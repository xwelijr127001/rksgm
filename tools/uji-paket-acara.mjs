/**
 * UJI PAKET ACARA dari ujung ke ujung (pelengkap tools/e2e-browser.mjs yang memakai Paket Latihan).
 *
 *   npm install --no-save puppeteer-core
 *   npm run build && npm start            # server di http://127.0.0.1:4000 (ubah lewat UI_BASE)
 *   npm run test:acara                    # semua misi; "npm run test:acara -- a03,a07" = tangkapan misi itu saja
 *
 * Room dibuat dengan paket 'acara'. Pemain "Kunci" (socket) mengirim jawaban dari kunci server
 * (server/dist) dan HARUS dinilai 100% di tiap soal. Pemain "Mata" (Chrome HP 390x844) memotret
 * briefing/main/pembahasan dan memeriksa: adegan siap, label adegan tidak bertumpuk / keluar tepi
 * (id, en, zh), tanpa luber horizontal, console bersih, pertandingan FINISHED setelah soal terakhir.
 * Pemeriksa tumpukan memakai KOTAK PEMBATAS, jadi objek diagonal (mis. boom excavator) bisa memberi
 * temuan palsu: lihat tangkapan layarnya sebelum mengubah adegan. Keluar kode 1 hanya bila ada GAGAL.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { io } from 'socket.io-client';
import path from 'node:path';
const BASE = process.env.UI_BASE || 'http://127.0.0.1:4000';
const OUT = path.resolve(process.env.RAKSA_SHOTS || 'shots-acara');
const DIST = path.resolve(import.meta.dirname, '../server/dist');
const CHROME = process.env.RAKSA_CHROME || 'C:\Program Files\Google\Chrome\Application\chrome.exe';
const HANYA = process.argv[2] ? process.argv[2].split(',') : null; // mis. "a03,a07" -> tangkapan hanya misi itu
fs.mkdirSync(OUT, { recursive: true });
const require = createRequire(import.meta.url);
const { KUNCI_ACARA } = require(DIST + '/server/src/acara/index.js');
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const rpc = (s, ev, p) => new Promise((r) => s.emit(ev, p, r));
const gagal = []; const temuan = [];
const cek = (ok, pesan) => { console.log((ok ? 'ok    ' : 'GAGAL ') + pesan); if (!ok) gagal.push(pesan); };
const iris = (a, c) => Math.max(0, Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x)) * Math.max(0, Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y));
function periksaKotak(misi, keadaan, kotak) {
  for (let i = 0; i < kotak.length; i++) {
    const a = kotak[i]; if (!a.label) continue; const L = a.label;
    if (L.x < 0 || L.x + L.w > 640 || L.y < 0 || L.y + L.h > 480) temuan.push(`${misi} ${keadaan}: label ${a.id} keluar tepi adegan`);
    for (let j = 0; j < kotak.length; j++) {
      if (i === j) continue; const c = kotak[j];
      if (c.label && j > i) { const n = iris(L, c.label); if (n > 4) temuan.push(`${misi} ${keadaan}: label ${a.id} x label ${c.id} (${Math.round(n)} u2)`); }
      const bersarang = a.objek.x >= c.objek.x && a.objek.y >= c.objek.y - 4 && a.objek.x + a.objek.w <= c.objek.x + c.objek.w && a.objek.y + a.objek.h <= c.objek.y + c.objek.h;
      if (c.interaktif && !bersarang) { const n = iris(L, c.objek); if (n > 0.12 * L.w * L.h) temuan.push(`${misi} ${keadaan}: label ${a.id} menutupi objek ${c.id} (${Math.round((100 * n) / (L.w * L.h))}% label)`); }
    }
  }
}
function jawabanBenar(kunci) {
  const j = {};
  for (const s of kunci.steps) {
    if (s.single !== undefined) j[s.stepId] = s.single;
    else if (s.multi) j[s.stepId] = s.multi;
    else if (s.assign) j[s.stepId] = s.assign;
    else if (s.number) j[s.stepId] = s.number.value;
    else if (s.order) j[s.stepId] = s.order;
  }
  return j;
}

const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const host = io(BASE, { transports: ['websocket'] }); await new Promise((r) => host.on('connect', r));
const dibuat = await rpc(host, 'host:create', { eventName: 'Uji Paket Acara', paket: 'acara' });
const { code, hostToken } = dibuat.data;
cek(dibuat.data.playlist?.length === 10 && dibuat.data.playlist.every((x) => /^a\d\d-/.test(x)), 'room baru memakai paket acara: ' + JSON.stringify(dibuat.data.playlist));
await rpc(host, 'host:settings', { code, hostToken, autoAdvance: false });
const aksi = (action) => rpc(host, 'host:action', { code, hostToken, action });
const look = { body: 2, skin: 3, hair: 0, accessory: 'helm', color: 0 };

// pemain Kunci (socket saja)
const kunciS = io(BASE, { transports: ['websocket'] }); await new Promise((r) => kunciS.on('connect', r));
const jk = await rpc(kunciS, 'player:join', { code, nickname: 'Kunci', look });
let me = null; kunciS.on('me', (m) => { me = m; });

// pemain Mata (browser HP)
const s2 = io(BASE, { transports: ['websocket'] }); await new Promise((r) => s2.on('connect', r));
const jm = await rpc(s2, 'player:join', { code, nickname: 'Mata', look: { ...look, accessory: 'topi' } }); s2.close();
const ctx = await b.createBrowserContext(); const p = await ctx.newPage();
const err = []; p.on('pageerror', (e) => err.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.evaluate((id) => { localStorage.setItem(`raksa:player:${id.code}`, JSON.stringify(id)); localStorage.setItem('raksa:player:last', JSON.stringify(id.code)); }, { code, playerId: jm.data.playerId, playerToken: jm.data.playerToken, nickname: 'Mata', look });
await p.goto(BASE + '/lobby', { waitUntil: 'networkidle0' });
const gantiBahasa = async (kode) => { await p.select('.pilih-bahasa select', kode); await tidur(1300); await p.waitForFunction(() => document.querySelector('.adegan')?.getAttribute('data-status') === 'ready', { timeout: 20000 }).catch(() => {}); await tidur(400); };
const luber = () => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const sisaId = () => p.evaluate(() => { const t = document.querySelector('.misi')?.innerText ?? ''; return (t.match(/\b(yang|dan|atau|untuk|dengan|tidak|pilih|kerusakan|nasabah|dokumen)\b/gi) ?? []).length; });

await aksi('startMatch'); await tidur(1200);
for (let i = 0; i < 10; i++) {
  const kunci = KUNCI_ACARA[i]; const nn = 'a' + String(i + 1).padStart(2, '0'); const ambil = !HANYA || HANYA.includes(nn);
  const st = await rpc(host, 'state:request', { code }); const room = st.data?.state ?? st.data;
  cek(room?.phase === 'BRIEFING' && room?.mission?.id === kunci.missionId, `${nn}: briefing ${room?.mission?.id} (fase ${room?.phase})`);
  if (ambil) { await tidur(600); await p.screenshot({ path: `${OUT}/${nn}-0-briefing.png` }); }
  await aksi('next');
  await p.waitForFunction(() => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', { timeout: 30000 }).catch(() => cek(false, `${nn}: layar tidak masuk mode main`));
  await p.waitForFunction(() => document.querySelector('.adegan')?.getAttribute('data-status') === 'ready', { timeout: 30000 }).catch(() => cek(false, `${nn}: adegan tidak siap (${''})`));
  await tidur(900);
  const status = await p.evaluate(() => document.querySelector('.adegan')?.getAttribute('data-status'));
  cek(status === 'ready', `${nn}: adegan siap (${status})`);
  if (ambil) {
    for (const bahasa of ['id', 'en', 'zh']) {
      if (bahasa !== 'id') await gantiBahasa(bahasa);
      const kotak = await p.evaluate(() => window.__raksaStage?.kotak?.() ?? []);
      periksaKotak(nn + '/' + bahasa, 'main', kotak);
      const l = await luber(); if (l > 0) temuan.push(`${nn}/${bahasa} main: luber ${l}px`);
      if (bahasa !== 'id') { const n = await sisaId(); if (n > 2) temuan.push(`${nn}/${bahasa} main: ${n} kata Indonesia tersisa di layar`); }
      await p.screenshot({ path: `${OUT}/${nn}-1-main-${bahasa}.png`, fullPage: bahasa === 'id' });
    }
    await gantiBahasa('id');
  }
  const kirim = await rpc(kunciS, 'player:submit', { code, playerToken: jk.data.playerToken, roundIndex: i, answer: jawabanBenar(kunci) });
  cek(kirim?.ok, `${nn}: jawaban kunci diterima server${kirim?.ok ? '' : ' -> ' + kirim?.error}`);
  await tidur(300);
  await aksi('closeRound');
  await p.waitForFunction(() => document.querySelector('.misi')?.getAttribute('data-mode') === 'reveal', { timeout: 15000 }).catch(() => cek(false, `${nn}: tidak masuk pembahasan`));
  await tidur(1100);
  const r = me?.rounds?.find((x) => x.roundIndex === i);
  cek(r && Math.abs(r.accuracy - 1) < 1e-9, `${nn}: jawaban kunci dinilai 100% (akurasi ${r?.accuracy})`);
  if (ambil) {
    await p.evaluate(() => document.querySelectorAll('details.lipat').forEach((d) => { d.open = true; })); await tidur(300);
    for (const bahasa of ['id', 'en', 'zh']) {
      if (bahasa !== 'id') await gantiBahasa(bahasa);
      periksaKotak(nn + '/' + bahasa, 'pembahasan', await p.evaluate(() => window.__raksaStage?.kotak?.() ?? []));
      const l = await luber(); if (l > 0) temuan.push(`${nn}/${bahasa} pembahasan: luber ${l}px`);
      if (bahasa === 'id' || bahasa === 'en') await p.screenshot({ path: `${OUT}/${nn}-2-pembahasan-${bahasa}.png`, fullPage: true });
    }
    await gantiBahasa('id');
  }
  await aksi('next'); await tidur(500); // papan peringkat
  await aksi('next'); await tidur(900); // briefing berikutnya / selesai
}
const akhir = await rpc(host, 'state:request', { code }); const ra = akhir.data?.state ?? akhir.data;
cek(ra?.phase === 'FINISHED', 'pertandingan selesai setelah 10 soal acara (fase ' + ra?.phase + ')');
cek(me?.totalPoints > 0 && Math.abs(me.totalAccuracy - 10) < 1e-6 || me?.answeredCount === 10, `pemain Kunci: ${me?.totalPoints} poin, ${me?.answeredCount} dijawab`);
await tidur(800); await p.screenshot({ path: `${OUT}/zz-hasil-akhir.png`, fullPage: true });
cek(err.length === 0, 'console pemain bersih' + (err.length ? ': ' + [...new Set(err)].slice(0, 4).join(' | ').slice(0, 400) : ''));
console.log(temuan.length ? '\nTEMUAN VISUAL (' + temuan.length + '):\n' + temuan.join('\n') : '\ntanpa temuan visual');
console.log(gagal.length ? `\n${gagal.length} GAGAL` : '\nsemua lulus');
fs.writeFileSync(`${OUT}/temuan.json`, JSON.stringify({ gagal, temuan }, null, 1));
host.close(); kunciS.close(); await b.close(); process.exit(gagal.length ? 1 : 0);
