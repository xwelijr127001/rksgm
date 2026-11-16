/**
 * Pak Hendra (Episode 2, T-013 Stage 1): atlas piksel + manifest, pola yang sama dengan bangun-miss / bangun-rina.
 *
 *   node tools/piksel/bangun-hendra.mjs
 *
 * Masukan: character/hendra-pixel-v1 (master, 6 pose, 6 ekspresi; TIDAK diubah). Langkah native: hendra-native.mjs.
 * Keluaran:
 *   client/src/cerita/seni/piksel/hendra.png   atlas PNG terindeks (alpha 0/255)
 *   client/src/cerita/seni/piksel/hendra.json  manifest (skema docs/cerita/aset/PIKSEL.md bagian 3, dibaca susun.ts)
 *   character/piksel/hendra/tinjau-*.png        lembar tinjauan (x4, latar putih/krem/hijau/gelap)
 *
 * Isi atlas:
 *  - frame `berdiri-kanan`: tubuh master (badan penuh, hadap KIRI, wajah tenang terpanggang) + wajah 5 ekspresi
 *    (panik, cemas, kecewa, tenang, senang) dari lembar ekspresi, diregistrasi ke kepala master (IoU siluet rambut),
 *    + varian `kedip` (mata dari sel kedip) untuk tenang/cemas/kecewa. Tanpa varian bicara (lembar tidak punya mulut
 *    bicara): mulut tertutup (aturan cadangan 4 susun.ts).
 *  - frame `gestur-<nama>-kanan` (6, pinggang ke atas, jangkar pinggul): cemas, panik, kecewa, tenang, senang,
 *    menjelaskan; wajah gestur terpanggang. Belum dipakai panggung Stage 1 (Hendra tidak hadir badan di kantor menurut
 *    naskah); tersedia untuk cue berikutnya.
 *  - D-93 (Stage 3): seni Hendra menghadap KANAN penonton (README Stage 1 keliru menyebut kiri), jadi frame bernama `-kanan`.
 *    Hadap kiri = CERMIN saat digambar di panggung (sementara: saku & ponsel pindah sisi), bukan frame atlas.
 *  - T-019 (D-105, owner 16 Nov): frame `jalan-kontak-kanan` / `jalan-lintas-kanan` (pose `jalan-a` / `jalan-b`) dari
 *    character/hendra-pixel-v1/hendra-jalan-v1.png (dua sel 512 x 1024, hadap kanan), dibaca pada pitch 4,582 px sumber per
 *    piksel seni dan dipetakan ke palet yang SUDAH ada (tanpa warna baru). Jangkar kaki x = pusat kepala + selisih jangkar
 *    frame berdiri (4,5), supaya kepala tidak melompat mendatar saat jalan berganti ke berdiri; y = telapak. Wajah terpanggang:
 *    tanpa lapisan ekspresi/kedip. Dipakai di tiga adegan akhir (Hendra masuk dari kanan = dicerminkan di panggung).
 * Pemetaan ekspresi cerita -> seni (D-79 + keputusan owner 15 Nov: `lega` -> senang): bingung->panik, cemas->cemas,
 * kesal->kecewa, netral|serius->tenang, lega|senang|tersenyum->senang.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as L from './lib.mjs';
import { kemas, tulisPngIndeks } from './miss-lib.mjs';
import { bahanNative, sampelIsi, SEL_POSE, SUMBER } from './hendra-native.mjs';

const KELUAR = path.join(L.ROOT, 'client', 'src', 'cerita', 'seni', 'piksel');
const TINJAU = path.join(L.ROOT, 'character', 'piksel', 'hendra');
export const EKSPRESI_SENI = ['panik', 'cemas', 'kecewa', 'tenang', 'senang'];
export const EKSPRESI_DARI = { bingung: 'panik', cemas: 'cemas', kesal: 'kecewa', netral: 'tenang', serius: 'tenang', lega: 'senang', senang: 'senang', tersenyum: 'senang' };
const DENGAN_KEDIP = ['tenang', 'cemas', 'kecewa'];
/** T-019: lembar bingkai jalan + pitch baca (hendra-jalan-v1.md). */
export const JALAN_HENDRA = { berkas: 'hendra-jalan-v1.png', pitch: 4.582 };

const buram = (img, x, y) => x >= 0 && y >= 0 && x < img.w && y < img.h && img.d[L.idx(img, x, y) + 3] >= 128;

/** Komponen terhubung terbesar saja (sisa sel tetangga di tepi lembar dibuang). */
export function komponenUtama(img) {
  const lab = new Int32Array(img.w * img.h).fill(-1);
  let terbaik = null;
  for (let s = 0; s < img.w * img.h; s++) {
    if (lab[s] >= 0 || img.d[s * 4 + 3] < 128) continue;
    const tumpuk = [s], isi = []; lab[s] = s;
    while (tumpuk.length) {
      const p = tumpuk.pop(); isi.push(p);
      const x = p % img.w, y = (p / img.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, q = ny * img.w + nx;
        if (nx < 0 || ny < 0 || nx >= img.w || ny >= img.h || lab[q] >= 0 || img.d[q * 4 + 3] < 128) continue;
        lab[q] = s; tumpuk.push(q);
      }
    }
    if (!terbaik || isi.length > terbaik.length) terbaik = isi;
  }
  const o = L.buat(img.w, img.h);
  for (const p of terbaik ?? []) img.d.copy(o.d, p * 4, p * 4, p * 4 + 4);
  const k = L.kotakAlpha(o);
  return L.potong(o, k.x, k.y, k.w, k.h);
}

/** Baris teratas buram & rentang x pita kepala (baris y0..y0+n). */
export function kepalaDari(img, n) {
  const k = L.kotakAlpha(img);
  let x0 = img.w, x1 = -1;
  for (let y = k.y; y < k.y + n; y++) for (let x = 0; x < img.w; x++) if (buram(img, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  return { atas: k.y, x0, x1 };
}

/** Geser (dx, dy) ekspresi E ke tubuh T dengan IoU siluet pita kepala (n baris teratas T) terbaik. */
export function registrasi(T, E, n) {
  const kt = kepalaDari(T, n), ke = kepalaDari(E, n);
  const dx0 = kt.x1 - ke.x1, dy0 = kt.atas - ke.atas; // tepi kanan rambut (sisi muka) + puncak
  let best = { dx: dx0, dy: dy0, iou: -1 };
  for (let dy = dy0 - 4; dy <= dy0 + 4; dy++) for (let dx = dx0 - 6; dx <= dx0 + 6; dx++) {
    let i = 0, u = 0;
    for (let y = kt.atas; y < kt.atas + n; y++) for (let x = kt.x0 - 4; x <= kt.x1 + 4; x++) {
      const a = buram(T, x, y), b = buram(E, x - dx, y - dy);
      if (a && b) i++;
      if (a || b) u++;
    }
    const iou = u ? i / u : 0;
    if (iou > best.iou) best = { dx, dy, iou: +iou.toFixed(3) };
  }
  return best;
}

export function bangunHendra() {
  const b = bahanNative();
  const tubuh = komponenUtama(b.tubuh);
  const eks = Object.fromEntries(Object.entries(b.ekspresi).map(([e, img]) => [e, komponenUtama(img)]));
  const gestur = Object.fromEntries(Object.entries(b.gestur).map(([g, img]) => [g, komponenUtama(img)]));

  // Kepala master: puncak rambut -> dagu. Dagu = baris pertama di bawah kepala yang melebar ke kerah (diukur).
  const PITA = 22; // baris rambut untuk registrasi
  const kM = kepalaDari(tubuh, PITA);
  const reg = Object.fromEntries(Object.entries(eks).map(([e, img]) => [e, registrasi(tubuh, img, PITA)]));

  // Kotak wajah (relatif frame tubuh): alis -> dagu, dari pipi kiri sampai garis pipi kanan (tepi siluet + 1).
  const wajah = { x: kM.x0 + 9, y: kM.atas + 13, w: kM.x1 - kM.x0 - 8, h: 26 };
  const mata = { x: wajah.x, y: wajah.y + 3, w: wajah.w, h: 9 };
  const mulut = { x: wajah.x + Math.floor(wajah.w / 2) - 5, y: wajah.y + 19, w: 10, h: 4 };
  const potongDari = (img, r, k) => L.potong(img, k.x - r.dx, k.y - r.dy, k.w, k.h);

  // Bagian atlas.
  // T-019: dua bingkai jalan (kontak, lintas) pada skala atlas, palet yang sudah ada.
  const sumberJalan = L.petakanPalet(L.binerkanAlpha(L.baca(path.join(SUMBER, JALAN_HENDRA.berkas))), b.palet);
  const jalan = ['kontak', 'lintas'].map((nama, i) => {
    const img = komponenUtama(sampelIsi(L.potong(sumberJalan, i * 512, 0, 512, 1024), JALAN_HENDRA.pitch));
    const k = kepalaDari(img, PITA), kotak = L.kotakAlpha(img);
    return { nama, img, kepala: { x: (k.x0 + k.x1 + 1) / 2, atas: k.atas, lebar: k.x1 - k.x0 + 1 }, telapak: kotak.y + kotak.h - 1 };
  });
  const bagian = [{ id: 'tubuh', img: tubuh }, ...jalan.map((f) => ({ id: `jalan-${f.nama}`, img: f.img }))];
  for (const e of ['panik', 'cemas', 'kecewa', 'tenang', 'senang']) bagian.push({ id: `wajah-${e}`, img: potongDari(eks[e], reg[e], wajah) });
  bagian.push({ id: 'kedip', img: potongDari(eks.kedip, reg.kedip, mata) });
  for (const g of SEL_POSE) bagian.push({ id: `gestur-${g}`, img: gestur[g] });
  const W = 512;
  const kotakAtlas = bagian.map((x) => ({ id: x.id, kunci: x.id, w: x.img.w, h: x.img.h }));
  const tinggiAtlas = kemas(kotakAtlas, W);
  const letak = { h: tinggiAtlas };
  const pos = Object.fromEntries(kotakAtlas.map((x) => [x.id, x]));
  const atlas = L.buat(W, letak.h);
  for (const x of bagian) L.tempel(atlas, x.img, pos[x.id].x, pos[x.id].y);
  const r = (id) => [pos[id].x, pos[id].y, pos[id].w, pos[id].h];

  // Titik frame tubuh.
  const kT = L.kotakAlpha(tubuh);
  let kakiX0 = tubuh.w, kakiX1 = 0;
  for (let y = tubuh.h - 6; y < tubuh.h; y++) for (let x = 0; x < tubuh.w; x++) if (buram(tubuh, x, y)) { kakiX0 = Math.min(kakiX0, x); kakiX1 = Math.max(kakiX1, x); }
  const kaki = { x: Math.round((kakiX0 + kakiX1 + 1) / 2), y: kT.y + kT.h - 1 };
  const kepalaTinggi = wajah.y + wajah.h - kM.atas;
  const kepala = { x: (kM.x0 + kM.x1 + 1) / 2, y: kM.atas + kepalaTinggi / 2 };
  const ekspresi = {};
  for (const e of EKSPRESI_SENI) {
    ekspresi[e] = { dasar: r(`wajah-${e}`) };
    if (DENGAN_KEDIP.includes(e)) ekspresi[e].kedip = r('kedip');
  }
  const frame = {
    'berdiri-kanan': {
      rect: r('tubuh'), hadap: 'kanan', jenisJangkar: 'kaki', jangkar: kaki, kaki, kepala, kepalaTinggi,
      titikWajah: { x: wajah.x + wajah.w / 2, y: wajah.y + 10 }, teleponTergambar: true,
      wajah: { kotak: [wajah.x, wajah.y, wajah.w, wajah.h], mata: [mata.x, mata.y, mata.w, mata.h], mulut: [mulut.x, mulut.y, mulut.w, mulut.h] },
      ekspresi,
    },
  };
  const pose = { berdiri: { kanan: 'berdiri-kanan', bawaan: 'kanan' }, 'jalan-a': { kanan: 'jalan-kontak-kanan', bawaan: 'kanan' }, 'jalan-b': { kanan: 'jalan-lintas-kanan', bawaan: 'kanan' } };
  const selisihJangkar = kaki.x - kepala.x; // frame berdiri: 45 - 40,5 = 4,5
  for (const f of jalan) {
    const kk = { x: Math.round(f.kepala.x + selisihJangkar), y: f.telapak };
    frame[`jalan-${f.nama}-kanan`] = { rect: r(`jalan-${f.nama}`), hadap: 'kanan', jenisJangkar: 'kaki', jangkar: kk, kaki: kk, kepala: { x: f.kepala.x, y: f.kepala.atas + kepalaTinggi / 2 }, kepalaTinggi, teleponTergambar: true };
  }
  for (const g of SEL_POSE) {
    const img = gestur[g];
    const k = kepalaDari(img, 20);
    frame[`gestur-${g}-kanan`] = {
      rect: r(`gestur-${g}`), hadap: 'kanan', jenisJangkar: 'pinggul', jangkar: { x: Math.round(img.w / 2), y: img.h - 1 }, pinggul: { x: Math.round(img.w / 2), y: img.h - 1 },
      kepala: { x: (k.x0 + k.x1 + 1) / 2, y: k.atas + kepalaTinggi / 2 }, kepalaTinggi, teleponTergambar: g === 'menjelaskan',
    };
    pose[`gestur-${g}`] = { kanan: `gestur-${g}-kanan`, bawaan: 'kanan' };
  }
  // Jendela potret/sisipan di sekitar kepala frame berdiri (skala bulat), pola manifest Miss Raksa.
  const jendela = (sisi, skala, geserY = 0) => ({ frame: 'berdiri-kanan', x: Math.round(kepala.x - sisi / 2), y: Math.round(kepala.y - sisi / 2 + geserY), sisi, skala, tampil: sisi * skala });
  const manifest = {
    versi: 1,
    dibuat: 'tools/piksel/bangun-hendra.mjs',
    tokoh: 'hendra',
    piksel: 4,
    gambar: 'hendra.png',
    ukuranAtlas: [W, letak.h],
    satuan: { dunia: 'piksel seni x 4', catatan: 'koordinat = piksel seni relatif pojok kiri-atas frame; tampilkan dengan skala bulat & nearest-neighbour' },
    skala: {
      unitDuniaPerPikselSeni: 4,
      pxSumberPerPikselSeni: { master: b.laporan.master.pitch, ekspresi: b.laporan.ekspresi.pitch, gestur: b.laporan.pose.pitch },
      kepala: `proporsi pria dewasa dipertahankan (D-83 #2): puncak rambut -> dagu = ${kepalaTinggi} piksel seni, lebar kepala ${b.laporan.master.lebarKepalaSeni}`,
    },
    palet: b.palet.map(L.hex),
    ekspresi: EKSPRESI_SENI,
    varian: ['dasar', 'kedip'],
    ekspresiDari: EKSPRESI_DARI,
    urutanGambar: ['tubuh (frame.rect; wajah tenang terpanggang)', 'wajah ekspresi dasar (frame.ekspresi[e].dasar di frame.wajah.kotak)', 'kedip (di frame.wajah.mata)'],
    frame,
    pose,
    pandang: { lawan: { arah: 'kanan' }, pemain: { arah: 'kanan' }, depan: { arah: 'kanan' }, bawah: {} },
    potret: {
      frame: 'berdiri-kanan',
      jendela: { 32: jendela(32, 1, 2), 44: jendela(44, 1, 4), 52: jendela(52, 1, 6), 64: jendela(64, 1, 8), 96: jendela(48, 2, 4) },
      dekat: { 52: jendela(26, 2, 2), 64: jendela(32, 2, 2), 96: jendela(32, 3, 2) },
    },
    telepon: { frame: 'berdiri-kanan', jendela: jendela(56, 1, 10), catatan: 'kepala utuh + bahu (ponsel di tangan tidak masuk jendela); skala bulat' },
    registrasi: reg,
  };
  return { atlas, manifest, tubuh, eks, gestur, jalan, laporan: b.laporan, reg, wajah };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const h = bangunHendra();
  fs.mkdirSync(KELUAR, { recursive: true });
  const png = tulisPngIndeks(path.join(KELUAR, 'hendra.png'), h.atlas, h.manifest.palet.map(L.dariHex));
  fs.writeFileSync(path.join(KELUAR, 'hendra.json'), JSON.stringify(h.manifest, null, 1) + '\n');
  // Tinjauan: tubuh dengan tiap wajah ditempel (x4), di empat latar.
  const item = [];
  for (const e of EKSPRESI_SENI) {
    const t = L.salin(h.tubuh);
    const [ax, ay, aw, ah] = h.manifest.frame['berdiri-kanan'].ekspresi[e].dasar;
    L.tempel(t, L.potong(h.atlas, ax, ay, aw, ah), h.wajah.x, h.wajah.y);
    item.push({ label: e, img: L.potong(t, 0, 0, t.w, 90) });
  }
  L.tulis(path.join(TINJAU, 'tinjau-wajah.png'), L.lembarTinjau(item, { k: 4 }));
  L.tulis(path.join(TINJAU, 'tinjau-atlas.png'), L.perbesar(h.atlas, 2));
  L.tulis(path.join(TINJAU, 'tinjau-jalan.png'), L.lembarTinjau([{ label: 'berdiri', img: h.tubuh }, ...h.jalan.map((f) => ({ label: f.nama, img: f.img }))], { k: 2 }));
  console.log(JSON.stringify({ atlas: [h.atlas.w, h.atlas.h], png, jalan: h.jalan.map((f) => ({ nama: f.nama, ukuran: [f.img.w, f.img.h], kepala: f.kepala, jangkar: h.manifest.frame[`jalan-${f.nama}-kanan`].jangkar })), laporan: h.laporan, registrasi: h.reg, wajah: h.wajah }, null, 1));
}
