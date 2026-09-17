/**
 * E2E RAKSA GAME pada UI yang disetujui (satu pertanyaan per halaman).
 *
 * PRASYARAT (tidak termasuk dependensi proyek supaya bundel acara tetap kecil):
 *   npm install -D puppeteer-core socket.io-client
 *   npm run build && npm start      # server harus jalan di http://127.0.0.1:4000
 *   npm run test:e2e
 *
 * Google Chrome harus terpasang. Ubah path lewat env RAKSA_CHROME bila perlu.
 * Keluar dengan kode 1 bila ada langkah yang gagal.
 * 1 host (desktop) + 2 pemain (HP) + 1 penonton (proyektor), pertandingan penuh 10 misi.
 *
 * Pemain dijalankan seperti manusia: baca halaman -> ketuk jawaban -> "Lanjut"
 * -> sampai "Kirim jawaban". Satu klik per tick supaya React selesai render.
 */

import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { io as ioClient } from 'socket.io-client';

const BASE = process.env.UI_BASE || 'http://127.0.0.1:4000';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.resolve(process.env.RAKSA_SHOTS || 'shots-e2e');
fs.mkdirSync(OUT, { recursive: true });

const konsol = [];
const gagal = [];
const catat = (t, ...a) => console.log(`[${t}]`, ...a);
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

function pantau(page, nama) {
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') {
      konsol.push({ nama, tipe: m.type(), teks: m.text().slice(0, 240) });
    }
  });
  page.on('pageerror', (e) => konsol.push({ nama, tipe: 'pageerror', teks: String(e).slice(0, 240) }));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(BASE)) {
      konsol.push({ nama, tipe: 'http' + r.status(), teks: r.url() });
    }
  });
}

const rpc = (sock, ev, payload) =>
  new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout ' + ev)), 12000);
    sock.emit(ev, payload, (r) => {
      clearTimeout(t);
      res(r);
    });
  });

async function tunggu(page, fn, label, ms = 20000) {
  const batas = Date.now() + ms;
  while (Date.now() < batas) {
    try {
      if (await page.evaluate(fn)) return true;
    } catch {
      /* render ulang */
    }
    await tidur(200);
  }
  gagal.push(`timeout: ${label}`);
  catat('GAGAL', 'timeout', label);
  return false;
}

// ---------------------------------------------------------------- jawaban benar

/** [regex konteks halaman (opsional), teks tombol yang harus diketuk] */
const ATURAN = {
  1: [[null, 'Dokumentasikan kerusakan dan laporkan kejadian melalui kanal klaim']],
  2: [
    [null, 'Foto keseluruhan kendaraan'],
    [null, 'Foto detail kerusakan depan kiri'],
    [null, 'Foto identitas kendaraan'],
  ],
  3: [
    [null, 'Kronologi kejadian'],
    [null, 'Foto kerusakan ruko'],
    [null, 'Daftar barang terdampak'],
    [null, 'Estimasi kerugian'],
  ],
  4: [
    ['aria', 'Identitas / nomor seri unit'],
    ['aria', 'Posisi unit saat kejadian'],
    ['aria', 'Bagian yang rusak'],
    ['aria', 'Keterangan operator'],
  ],
  5: [
    [/Kasus A/i, 'Dapat dilanjutkan untuk penilaian kerusakan benturan'],
    [/Kasus B/i, 'Kerusakan tidak memenuhi ambang TLO'],
  ],
  6: [
    [/selisih jumlah peti/i, '2 peti'],
    [/kemasan rusak/i, '2 peti'],
    [null, 'Dokumentasikan ketidaksesuaian'],
  ],
  7: [
    [/jaminan relevan|Polis mana/i, 'Polis A'],
    [null, 'Perluasan banjir tercantum dan periode polis sesuai'],
  ],
  8: [
    [/Panel rusak/i, 'Periksa sebagai kerusakan terkait kejadian'],
    [/Catatan servis/i, 'Pisahkan sebagai kondisi sebelum kejadian'],
    [/Kerusakan internal/i, 'Perlu pemeriksaan teknis tambahan'],
  ],
  9: [
    [/10% x/i, 'Rp10.000.000'],
    [/Risiko sendiri yang dipakai/i, 'Rp10.000.000'],
    [/Hasil akhir/i, 'Rp90.000.000'],
  ],
  10: [
    [/Tahap 1.*Kasus A/i, 'AUTO'],
    [/Tahap 1.*Kasus B/i, 'HVC (Alat Berat)'],
    [/Tahap 1.*Kasus C/i, 'FIRE / PROPERTY'],
    [/Tahap 2.*Kasus A/i, 'Cakupan banjir pada kartu polis'],
    [/Tahap 2.*Kasus B/i, 'Kesesuaian nomor seri unit'],
    [/Tahap 2.*Kasus C/i, 'Kelengkapan bukti awal'],
    [/Tahap 3.*Kasus A/i, 'Di luar jaminan yang tercantum'],
    [/Tahap 3.*Kasus B/i, 'Klarifikasi identitas unit'],
    [/Tahap 3.*Kasus C/i, 'Lanjutkan ke survei'],
  ],
};

const BACA = () => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const btns = [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().height > 0);
  const t = norm(document.body.innerText);
  const m = t.match(/Pertanyaan\s+(\d+)\s+dari\s+(\d+)/i);
  return {
    halNo: m ? Number(m[1]) : 1,
    halTotal: m ? Number(m[2]) : 1,
    teks: t,
    opsi: btns
      .filter((b) => /kartu|number-option|avatar-option|evidence|hotspot/.test((b.className || '').toString()) || b.getAttribute('role') === 'radio')
      .map((b) => ({ t: norm(b.textContent), aria: norm(b.getAttribute('aria-label') || ''), dis: b.disabled })),
    lanjut: btns.some((b) => /^Lanjut$/i.test(norm(b.textContent)) && !b.disabled),
    lanjutAda: btns.some((b) => /^Lanjut$/i.test(norm(b.textContent))),
    kirim: btns.some((b) => /Kirim jawaban/i.test(norm(b.textContent)) && !b.disabled),
    kirimAda: btns.some((b) => /Kirim jawaban/i.test(norm(b.textContent))),
  };
};

const KLIK_TEKS = (teks) => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const target = norm(teks);
  const b = [...document.querySelectorAll('button, a.btn, a.primary-action')].find(
    (x) => !x.disabled && x.getBoundingClientRect().height > 0 && norm(x.textContent).includes(target),
  );
  if (!b) return false;
  b.click();
  return true;
};

const KLIK_ARIA = (label) => {
  const b = [...document.querySelectorAll('button')].find(
    (x) => x.getAttribute('aria-label') === label && !x.disabled,
  );
  if (!b) return false;
  b.click();
  return true;
};

/**
 * Klik tombol NAVIGASI (Lanjut / Kirim jawaban) dengan pencocokan TEPAT.
 * Wajib tepat: teks opsi jawaban bisa memuat kata "lanjut"
 * (mis. "Dapat dilanjutkan untuk penilaian...", "Lanjutkan ke survei..."),
 * sehingga pencocokan substring akan mengetuk kartu jawaban, bukan tombol navigasi.
 */
const KLIK_NAV = (label) => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const btns = [...document.querySelectorAll('button')].filter(
    (x) => !x.disabled && x.getBoundingClientRect().height > 0,
  );
  const tepat = btns.find((x) => norm(x.textContent).toLowerCase() === label.toLowerCase());
  const utama = btns.find(
    (x) =>
      (x.className || '').toString().includes('primary-action') &&
      norm(x.textContent).toLowerCase().startsWith(label.toLowerCase()),
  );
  const b = tepat || utama;
  if (!b) return false;
  b.click();
  return true;
};

/** Jalankan satu misi seperti pemain: per halaman, ketuk lalu Lanjut. */
async function mainkanMisi(page, nomor) {
  const aturan = ATURAN[nomor] || [];
  let diklik = 0;
  let halaman = 0;

  for (let guard = 0; guard < 24; guard++) {
    const s = await page.evaluate(BACA);
    halaman++;

    // UI menampilkan SATU pertanyaan per halaman. Bila misi punya beberapa
    // halaman, aturan ke-i dipakai untuk halaman ke-i (urutannya sama dengan
    // urutan langkah/kasus di data misi). Bila hanya satu halaman, semua
    // aturan diketuk (misi multi-select).
    const dipakai = s.halTotal > 1 ? aturan.slice(s.halNo - 1, s.halNo) : aturan;
    for (const [konteks, teks] of dipakai) {
      if (konteks === 'aria') {
        if (await page.evaluate(KLIK_ARIA, teks)) {
          diklik++;
          await tidur(130);
        }
        continue;
      }
      if (await page.evaluate(KLIK_TEKS, teks)) {
        diklik++;
        await tidur(130);
      }
    }

    const s2 = await page.evaluate(BACA);
    if (s2.kirim) return { diklik, halaman, siapKirim: true };
    if (s2.lanjut) {
      await page.evaluate(KLIK_NAV, 'Lanjut');
      await tidur(320);
      continue;
    }
    // tidak bisa lanjut & tidak bisa kirim
    return { diklik, halaman, siapKirim: false, teks: s2.teks.slice(0, 200), kirimAda: s2.kirimAda, lanjutAda: s2.lanjutAda };
  }
  return { diklik, halaman, siapKirim: false, teks: 'guard habis' };
}

async function periksaLayout(page, nama) {
  return page.evaluate((n) => {
    const doc = document.documentElement;
    const kecil = [...document.querySelectorAll('button, a[href], input, select, [role="tab"]')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.height < 40;
      })
      .map((el) => `${((el.textContent || el.getAttribute('aria-label') || el.type || '') + '').trim().slice(0, 24)}(${Math.round(el.getBoundingClientRect().height)}px)`);
    return {
      nama: n,
      luberX: doc.scrollWidth - doc.clientWidth,
      kecil: [...new Set(kecil)].slice(0, 6),
      jml: new Set(kecil).size,
    };
  }, nama);
}

async function tangkap(page, file) {
  try {
    await page.bringToFront();
    await tidur(220);
    await page.screenshot({ path: path.join(OUT, file), timeout: 15000 });
  } catch (e) {
    catat('SHOT-GAGAL', file, String(e.message || e).slice(0, 60));
  }
}

// ---------------------------------------------------------------- main

const host = ioClient(BASE, { transports: ['websocket'], forceNew: true, reconnection: false });
await new Promise((r) => host.once('connect', r));
const dibuat = await rpc(host, 'host:create', { eventName: 'Uji E2E UI Baru' });
const { code, hostToken } = dibuat.data;
await rpc(host, 'host:settings', { code, hostToken, autoAdvance: false });
catat('HOST', 'room', code);

const unity = await (await fetch(`${BASE}/api/unity/status`)).json();
catat('UNITY', `available=${unity.available}`, unity.reason || `${unity.downloadMb}MB ${unity.compression}`);

const br = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-proxy-server', '--no-first-run', '--window-size=1366,940'],
  defaultViewport: null,
  protocolTimeout: 120000,
});

const layout = [];
const ringkas = [];
try {
  // ------- host & proyektor di browser (untuk memeriksa UI-nya)
  const hostPage = await br.newPage();
  pantau(hostPage, 'host');
  await hostPage.setViewport({ width: 1366, height: 900 });
  // Room dibuat lewat socket, jadi halaman host perlu token-nya di localStorage
  // (sama seperti browser panitia yang membuat room itu sendiri).
  await hostPage.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await hostPage.evaluate(
    (kode, token) => {
      localStorage.setItem(`raksa:host:${kode}`, JSON.stringify(token));
      localStorage.setItem('raksa:host:last', JSON.stringify(kode));
    },
    code,
    hostToken,
  );
  await hostPage.goto(`${BASE}/host?room=${code}`, { waitUntil: 'networkidle2' });
  await tidur(1500);
  layout.push(await periksaLayout(hostPage, 'host (1366px)'));

  const proj = await br.newPage();
  pantau(proj, 'projector');
  await proj.setViewport({ width: 1366, height: 768 });
  await proj.goto(`${BASE}/projector?room=${code}`, { waitUntil: 'networkidle2' });
  await tunggu(proj, () => document.body.innerText.length > 40, 'proyektor tampil');
  await tangkap(proj, '01-proyektor-lobby.png');
  layout.push(await periksaLayout(proj, 'proyektor (1366px)'));

  // ------- dua pemain
  const buatPemain = async (nama, shot) => {
    const p = await br.newPage();
    pantau(p, nama);
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await p.goto(`${BASE}/join?room=${code}`, { waitUntil: 'networkidle2' });
    await tunggu(p, () => /Mau dipanggil siapa|Pilih teman mainmu/i.test(document.body.innerText), `form join ${nama}`);
    await p.evaluate(() => {
      const el = [...document.querySelectorAll('input')].find((i) => i.maxLength === 16);
      if (el) { el.focus(); el.value = ''; }
    });
    await p.keyboard.type(nama);
    await tidur(250);
    if (!(await p.evaluate(KLIK_TEKS, 'Ikut bermain'))) gagal.push(`tombol Ikut bermain tidak ada (${nama})`);
    const ok = await tunggu(p, () => /Saya siap|Ganti karakter|segera bergabung/i.test(document.body.innerText), `lobby ${nama}`);
    if (!ok) throw new Error(`${nama} gagal masuk lobby`);
    if (shot) await tangkap(p, shot);
    return p;
  };
  const p1 = await buatPemain('Ani', '02-pemain-lobby.png');
  const p2 = await buatPemain('Budi', null);
  layout.push(await periksaLayout(p1, 'lobby pemain (390px)'));

  await tunggu(hostPage, () => /Ani/.test(document.body.innerText) && /Budi/.test(document.body.innerText), 'host melihat 2 peserta');
  catat('LOBBY', '2 pemain terlihat di host');
  await tangkap(hostPage, '03-host-lobby.png');

  // izin: halaman pemain tidak boleh punya kendali host
  const bocor = await p1.evaluate(() => /Tutup Ronde|Mulai Pertandingan|Akhiri Pertandingan/i.test(document.body.innerText));
  catat('IZIN', 'kendali host bocor ke pemain:', bocor);
  if (bocor) gagal.push('halaman pemain menampilkan kendali host');

  // ------- tutorial
  await rpc(host, 'host:action', { code, hostToken, action: 'startTutorial' });
  await tunggu(p1, () => /Pemanasan|tidak dihitung pada skor/i.test(document.body.innerText), 'pemain masuk tutorial');
  const disclaimer = await p1.evaluate(() => /simulasi edukasi|mengikuti ketentuan polis/i.test(document.body.innerText));
  catat('TUTORIAL', 'pemberitahuan simulasi tampil:', disclaimer);
  if (!disclaimer) gagal.push('tutorial tidak menampilkan pemberitahuan simulasi edukasi');
  await tangkap(p1, '04-pemain-tutorial.png');
  layout.push(await periksaLayout(p1, 'tutorial (390px)'));

  // ------- pertandingan
  await rpc(host, 'host:action', { code, hostToken, action: 'startMatch' });

  for (let r = 0; r < 10; r++) {
    const no = r + 1;
    await tunggu(p1, () => /MISI\s*0?\d+\s*\/\s*10/i.test(document.body.innerText), `pemain lihat misi ${no}`);

    // BRIEFING: input harus terkunci
    if (r === 0) {
      const b = await p1.evaluate(() => {
        const btns = [...document.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().height > 0);
        const opsi = btns.filter((x) => /kartu|number-option/.test((x.className || '').toString()) && !x.disabled);
        const kirim = btns.find((x) => /Kirim jawaban|Lanjut/i.test(x.textContent || ''));
        return { opsiAktif: opsi.length, tombol: kirim ? (kirim.disabled ? 'nonaktif' : 'AKTIF') : 'tidak ada' };
      });
      catat('BRIEFING', JSON.stringify(b));
      if (b.opsiAktif > 0) gagal.push('opsi jawaban aktif saat BRIEFING');
      await tangkap(p1, '05-pemain-briefing.png');
    }

    await rpc(host, 'host:action', { code, hostToken, action: 'next' }); // -> ACTIVE
    await tunggu(p1, () => /Kirim jawaban|Lanjut/i.test(document.body.innerText), `input terbuka misi ${no}`);
    if (no === 1) await tangkap(p1, '06-pemain-misi1.png');
    if (no === 4) await tangkap(p1, '07-pemain-misi4-hotspot.png');
    if (no === 10) await tangkap(p1, '08-pemain-misi10-tahap.png');

    const hasil = await mainkanMisi(p1, no);
    if (!hasil.siapKirim) {
      gagal.push(`misi ${no}: tidak sampai tombol Kirim (klik ${hasil.diklik}, halaman ${hasil.halaman})`);
      catat('GAGAL', `misi ${no} berhenti:`, String(hasil.teks).slice(0, 150));
    }

    // Budi menjawab seadanya
    await p2.evaluate(() => {
      const b = [...document.querySelectorAll('button.kartu, button.number-option')].find((x) => !x.disabled);
      if (b) b.click();
    });
    await tidur(200);

    await p1.evaluate(KLIK_NAV, 'Kirim jawaban');
    await p2.evaluate(KLIK_NAV, 'Kirim jawaban');
    const ack = await tunggu(p1, () => /Jawaban masuk|sudah menjawab/i.test(document.body.innerText), `ack misi ${no}`, 12000);
    // klik ulang: tidak boleh menggandakan
    await p1.evaluate(KLIK_NAV, 'Kirim jawaban');
    await tidur(150);

    await rpc(host, 'host:action', { code, hostToken, action: 'closeRound' });
    const reveal = await tunggu(p1, () => /MISI \d+ SELESAI|poin untukmu|Lihat jawaban/i.test(document.body.innerText), `reveal misi ${no}`);
    const poinTeks = await p1.evaluate(() => {
      const m = document.body.innerText.match(/\+([\d.]+) poin/);
      return m ? m[1] : null;
    });
    if (no === 1) {
      await tangkap(p1, '09-pemain-reveal.png');
      await tangkap(proj, '10-proyektor-reveal.png');
    }

    await rpc(host, 'host:action', { code, hostToken, action: 'next' }); // -> LEADERBOARD
    const papan = await tunggu(p1, () => /SEMAKIN SERU|terdepan|Misi berikutnya|Peringkat/i.test(document.body.innerText), `papan misi ${no}`);
    if (no === 1) await tangkap(proj, '11-proyektor-papan.png');

    ringkas.push({ no, klik: hasil.diklik, hal: hasil.halaman, ack, reveal, papan, poin: poinTeks });
    catat('MISI', String(no).padStart(2), `klik ${hasil.diklik} di ${hasil.halaman} halaman | ack ${ack} | reveal ${reveal} | papan ${papan} | +${poinTeks} poin`);

    if (r < 9) await rpc(host, 'host:action', { code, hostToken, action: 'next' }); // -> BRIEFING
  }

  await rpc(host, 'host:action', { code, hostToken, action: 'next' }); // -> FINISHED
  await tunggu(p1, () => /poin|Peringkat|Lencana|Podium/i.test(document.body.innerText), 'halaman hasil');
  await tidur(1500);
  await tangkap(p1, '12-pemain-hasil.png');
  await tangkap(proj, '13-proyektor-podium.png');
  await tangkap(hostPage, '14-host-selesai.png');
  layout.push(await periksaLayout(p1, 'hasil pemain (390px)'));
  const hasilTeks = await p1.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  catat('HASIL', hasilTeks.slice(0, 400));

  // reconnect
  await p1.reload({ waitUntil: 'networkidle2' });
  const pulih = await tunggu(p1, () => /Ani/.test(document.body.innerText), 'identitas pulih setelah refresh');
  catat('RECONNECT', 'pulih setelah refresh:', pulih);

  // CSV
  const csv = await fetch(`${BASE}/api/room/${code}/results.csv?hostToken=${hostToken}`);
  const csvTeks = await csv.text();
  const barisCsv = csvTeks.split('\r\n').filter((l) => l && !l.startsWith('#') && !l.startsWith('\ufeff#')).length;
  catat('CSV', `status ${csv.status}, ${barisCsv} baris data, memuat Ani=${/Ani/.test(csvTeks)}`);
  if (csv.status !== 200 || !/Ani/.test(csvTeks)) gagal.push('ekspor CSV tidak sesuai');

  // layout 360px
  const kecil = await br.newPage();
  pantau(kecil, 'mobile360');
  await kecil.setViewport({ width: 360, height: 780, isMobile: true, hasTouch: true });
  for (const [rute, nama] of [['/', 'landing'], ['/join', 'join'], ['/latihan', 'latihan']]) {
    await kecil.goto(`${BASE}${rute}`, { waitUntil: 'networkidle2' });
    await tidur(1000);
    layout.push(await periksaLayout(kecil, `${nama} (360px)`));
    await tangkap(kecil, `20-${nama}-360.png`);
  }
  // mode latihan satu misi
  await kecil.evaluate(KLIK_TEKS, 'Coba misi pertama');
  await tidur(900);
  if (!(await kecil.evaluate(() => /Kirim jawaban|Lanjut/i.test(document.body.innerText)))) {
    await kecil.evaluate(KLIK_TEKS, 'Parkir Kurang Mulus');
    await tidur(900);
  }
  const latihan = await mainkanMisi(kecil, 1);
  await kecil.evaluate(KLIK_NAV, 'Kirim jawaban');
  const latihanOk = await tunggu(kecil, () => /[Kk]etepatan|100%|benar|poin/i.test(document.body.innerText), 'hasil latihan');
  catat('LATIHAN', `klik ${latihan.diklik}, penilaian tampil: ${latihanOk}`);
  await tangkap(kecil, '21-latihan-hasil-360.png');
  layout.push(await periksaLayout(kecil, 'latihan (360px)'));
} finally {
  // laporan
  console.log('\n================ RINGKASAN E2E (UI BARU) ================');
  console.log('per misi:');
  for (const r of ringkas) {
    console.log(`  misi ${String(r.no).padStart(2)} | ${String(r.klik).padStart(2)} klik / ${r.hal} halaman | ack ${String(r.ack).padEnd(5)} | reveal ${String(r.reveal).padEnd(5)} | papan ${String(r.papan).padEnd(5)} | +${r.poin} poin`);
  }
  console.log('\nlayout:');
  for (const l of layout) {
    console.log(`  ${l.nama.padEnd(24)} luberX=${String(l.luberX).padStart(3)}px  tombol<40px=${l.jml} ${l.kecil.length ? JSON.stringify(l.kecil) : ''}`);
  }
  console.log('\nconsole/http bermasalah:', konsol.length);
  for (const c of konsol.slice(0, 15)) console.log(`  [${c.nama}/${c.tipe}] ${c.teks}`);
  console.log('\nkegagalan langkah:', gagal.length);
  for (const g of gagal) console.log('  - ' + g);
  console.log('\nscreenshot:', OUT);
  console.log('=========================================================\n');
  host.disconnect();
  await br.close();
}
process.exit(gagal.length ? 1 : 0);
