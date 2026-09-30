/**
 * SENI PIKSEL PANGGUNG (kontrak lead): 1 piksel seni = SATUAN_PIKSEL (4) satuan dunia, jadi dunia 1600 x 900 =
 * 400 x 225 piksel seni. Pembantu MURNI (tanpa React/DOM) untuk lapisan & aktor RASTER: sebuah potongan PNG (atlas)
 * yang ditaruh di kotak dunia, digambar nearest-neighbour (image-rendering: pixelated) dan tampil pada jumlah
 * piksel perangkat BULAT per piksel seni saat diam (kamera.ts `pasKamera` opsi `q`).
 *
 * Bentuk data dibuat SERUPA dengan SVG supaya seluruh panggung (dunia.ts, rencana, transisi, sutradara) tidak perlu
 * tahu jenis gambarnya:
 *  - Lapisan ruang raster = `LapisanSvg` dengan `svg: ''` + `piksel` (potongan PNG). x, y, w, h = kotak dunia.
 *  - Gambar tokoh / prop raster = `GambarTokoh` / `GambarProp` dengan `svg: ''` + `piksel`; w, h, jangkar, kepala,
 *    tangan dalam satuan dunia kanvas (piksel seni x 4). `diAtasMejaPiksel` = kotak (satuan kanvas yang sama) yang
 *    digambar lagi di atas meja: GAMBAR YANG SAMA, transform yang sama, dipotong ke kotak-kotak itu.
 *  - Varian kedip / bicara boleh berupa potongan lain di atlas yang sama atau PNG lain (url sendiri).
 * `pikselDari()` membaca potongan dari objek mana pun (null = SVG biasa).
 */
import type { LapisanSvg, RuangAdegan, TempatAdegan } from '../../seni/ruang';
import { KEPALA_TINGGI } from '../../seni/tokoh/ukuran';
import type { IdLokasiAdegan } from '../../tipe';
import type { Kotak } from './dunia';

/** Satuan dunia per piksel seni (kontrak lead). */
export const SATUAN_PIKSEL = 4;

/** Potongan sebuah PNG: URL, ukuran atlas (piksel seni), dan kotak sumber di atlas (piksel seni). */
export interface PotonganPiksel {
  url: string;
  atlas: { w: number; h: number };
  sumber: Kotak;
}

/** Lapisan ruang raster: bentuk LapisanSvg (svg kosong) + potongan PNG; x, y, w, h = kotak dunia. */
export interface LapisanPiksel extends LapisanSvg {
  piksel: PotonganPiksel;
}

/** Tambahan pada gambar tokoh raster (GambarTokoh + ini): kotak bagian yang digambar lagi di atas meja. */
/**
 * Potongan yang DITEMPEL di atas potongan dasar (lapisan wajah tokoh piksel: ekspresi di kotak wajah, kedip/bawah di
 * kotak mata, bicara di kotak mulut; urutan = urutan gambar). x, y = piksel seni relatif sudut kiri-atas potongan dasar.
 */
export interface TempelanPiksel {
  p: PotonganPiksel;
  x: number;
  y: number;
}

export interface TambahanTokohPiksel {
  piksel: PotonganPiksel;
  /** Lapisan di atas tubuh (wajah/mata/mulut), digambar berurutan di elemen yang sama (satu transform). */
  tempelan?: TempelanPiksel[];
  /** Kotak (satuan kanvas gambar, sama dengan w/h) yang tampil di atas meja: gambar sama, dipotong ke kotak ini. */
  diAtasMejaPiksel?: Kotak[];
  /**
   * Tinggi kepala (sanggul/hijab sampai dagu) dalam satuan kanvas. Kotak kepala untuk kamera = pusat `kepala` ±
   * nilai ini; tanpa nilai = KEPALA_TINGGI seni SVG (130).
   */
  kepalaTinggi?: number;
  /** URL PNG lain yang dipakai varian gambar ini (kedip/bicara di berkas terpisah): ikut didekode sebelum tampil. */
  varianUrl?: string[];
}

const angka = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Tempelan sah gambar raster (lapisan wajah), atau [] (SVG / tanpa tempelan / data cacat dilewati). */
export function tempelanDari(g: unknown): TempelanPiksel[] {
  const t = g && typeof g === 'object' ? (g as { tempelan?: unknown }).tempelan : undefined;
  if (!Array.isArray(t)) return [];
  const hasil: TempelanPiksel[] = [];
  for (const x of t) {
    if (!x || typeof x !== 'object') continue;
    const o = x as { p?: unknown; x?: unknown; y?: unknown };
    const p = pikselDari({ piksel: o.p });
    if (p && angka(o.x) && angka(o.y)) hasil.push({ p, x: o.x, y: o.y });
  }
  return hasil;
}

/** Tinggi kepala gambar (satuan kanvas): `kepalaTinggi` gambar raster bila ada, selain itu KEPALA_TINGGI SVG. */
export function tinggiKepala(g: unknown): number {
  const t = g && typeof g === 'object' ? (g as { kepalaTinggi?: unknown }).kepalaTinggi : undefined;
  return angka(t) && t > 0 ? t : KEPALA_TINGGI;
}

function kotakSah(k: unknown): k is Kotak {
  if (!k || typeof k !== 'object') return false;
  const o = k as Record<string, unknown>;
  return angka(o.x) && angka(o.y) && angka(o.w) && angka(o.h) && (o.w as number) > 0 && (o.h as number) > 0;
}

/**
 * Potongan PNG dari lapisan / gambar / prop, atau null bila objek itu SVG biasa (atau potongannya cacat). Bentuk PNG
 * utuh { src, pw, ph } juga diterima (dinormalkan menjadi potongan 0,0,pw,ph).
 */
export function pikselDari(x: unknown): PotonganPiksel | null {
  if (!x || typeof x !== 'object') return null;
  const p = (x as { piksel?: unknown }).piksel;
  if (!p || typeof p !== 'object') return null;
  const o = p as Record<string, unknown>;
  if (typeof o.url === 'string') {
    const atlas = o.atlas as Record<string, unknown> | undefined;
    if (!o.url || !atlas || !angka(atlas.w) || !angka(atlas.h) || !kotakSah(o.sumber)) return null;
    return p as PotonganPiksel;
  }
  if (typeof o.src === 'string' && o.src && angka(o.pw) && angka(o.ph) && o.pw > 0 && o.ph > 0) {
    return { url: o.src, atlas: { w: o.pw, h: o.ph }, sumber: { x: 0, y: 0, w: o.pw, h: o.ph } };
  }
  return null;
}

/** Kotak di atas meja (satuan kanvas) dari gambar tokoh raster, atau [] bila tidak ada. */
export function kotakDiAtasMeja(g: unknown): Kotak[] {
  const d = g && typeof g === 'object' ? (g as { diAtasMejaPiksel?: unknown }).diAtasMejaPiksel : undefined;
  return Array.isArray(d) ? d.filter(kotakSah) : [];
}

/**
 * Sidik gambar (untuk membandingkan dua gambar tanpa peduli jenisnya): isi SVG, atau url + kotak sumber raster.
 * Dipakai deteksi dukungan (hadap kanan, duduk-turun) supaya gambar raster tidak dianggap "sama" karena svg kosong.
 */
export function sidikGambar(g: { svg?: string } | null | undefined): string {
  if (!g) return '';
  const p = pikselDari(g);
  const k = (q: PotonganPiksel) => `${q.url}#${q.sumber.x},${q.sumber.y},${q.sumber.w},${q.sumber.h}`;
  if (p) return `piksel:${k(p)}${tempelanDari(g).map((t) => `+${k(t.p)}@${t.x},${t.y}`).join('')}`;
  return g.svg ?? '';
}

/** Lapisan raster dari potongan atlas; kotak dunia = posisi dunia + ukuran sumber x SATUAN_PIKSEL. */
export function lapisanPiksel(url: string, atlas: { w: number; h: number }, sumber: Kotak, x: number, y: number): LapisanPiksel {
  return { svg: '', x, y, w: sumber.w * SATUAN_PIKSEL, h: sumber.h * SATUAN_PIKSEL, piksel: { url, atlas: { ...atlas }, sumber: { ...sumber } } };
}

/**
 * Titik jangkar dunia yang dipaskan ke kisi piksel seni: sudut kiri-atas gambar (titik - jangkar) jatuh pada
 * kelipatan SATUAN_PIKSEL, supaya piksel tokoh sejajar dengan piksel ruang (bukan tergeser 1-3 satuan).
 */
export function titikKisi(titik: { x: number; y: number }, jangkar: { x: number; y: number }): { x: number; y: number } {
  const s = SATUAN_PIKSEL;
  return { x: Math.round((titik.x - jangkar.x) / s) * s + jangkar.x, y: Math.round((titik.y - jangkar.y) / s) * s + jangkar.y };
}

/**
 * Jalur CSS clip-path (koordinat kotak elemen = satuan kanvas) untuk gabungan kotak; null bila kosong. Subjalur
 * searah jarum jam semua (aturan nonzero = gabungan).
 */
export function jalurKlip(kotak: readonly Kotak[]): string | null {
  const r = (v: number) => Math.round(v * 100) / 100;
  const sub = kotak.filter(kotakSah).map((k) => `M${r(k.x)} ${r(k.y)}H${r(k.x + k.w)}V${r(k.y + k.h)}H${r(k.x)}Z`);
  return sub.length ? `path('${sub.join(' ')}')` : null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Potongan raster sebagai <svg> bersarang (string) di koordinat induk: viewBox = kotak sumber, <image> atlas utuh
 * di 0,0, nearest-neighbour (atribut SVG + CSS). Dipakai seni kartu episode (kartuRuang.ts) yang satu SVG diam.
 */
export function markupPiksel(p: PotonganPiksel, x: number, y: number, w: number, h: number, tempelan: readonly TempelanPiksel[] = []): string {
  const s = p.sumber;
  const img = (q: PotonganPiksel) => `<image href="${esc(q.url)}" x="0" y="0" width="${q.atlas.w}" height="${q.atlas.h}" preserveAspectRatio="none" image-rendering="pixelated" style="image-rendering:pixelated"/>`;
  const tempel = tempelan.map((t) => `<svg x="${s.x + t.x}" y="${s.y + t.y}" width="${t.p.sumber.w}" height="${t.p.sumber.h}" viewBox="${t.p.sumber.x} ${t.p.sumber.y} ${t.p.sumber.w} ${t.p.sumber.h}" overflow="hidden">${img(t.p)}</svg>`).join('');
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${s.x} ${s.y} ${s.w} ${s.h}" preserveAspectRatio="none" overflow="hidden">${img(p)}${tempel}</svg>`;
}

/** Semua URL PNG yang dipakai ruang (lapisan + daun pintu), tanpa duplikat. */
export function urlRuang(r: RuangAdegan | null | undefined): string[] {
  if (!r) return [];
  const set = new Set<string>();
  for (const l of [r.latar, r.koridor, r.pintu?.daun, r.belakangMeja, r.depanMeja, r.kursi?.belakang, r.kursi?.depan]) {
    const p = pikselDari(l);
    if (p) set.add(p.url);
  }
  return [...set];
}

/**
 * Semua URL PNG sebuah susunan yang harus sudah didekode sebelum dunia diperlihatkan: lapisan ruang + gambar tokoh
 * raster (gambar dasar; varian kedip/bicara di atlas yang sama ikut, varian di PNG lain disebut `varianUrl`) + `lain`
 * (mis. prop raster).
 */
export function urlSusunan(s: { ruang: RuangAdegan; tokoh: readonly { gambar: unknown }[] }, lain: readonly string[] = []): string[] {
  const set = new Set(urlRuang(s.ruang));
  for (const u of lain) if (u) set.add(u);
  for (const t of s.tokoh) {
    const p = pikselDari(t.gambar);
    if (p) set.add(p.url);
    for (const x of tempelanDari(t.gambar)) set.add(x.p.url);
    const lain = (t.gambar as { varianUrl?: unknown } | null)?.varianUrl;
    if (Array.isArray(lain)) for (const u of lain) if (typeof u === 'string' && u) set.add(u);
  }
  return [...set];
}

/** true bila ruang ini memakai lapisan raster (mode piksel: kamera dipaskan ke piksel bulat). */
export function ruangPiksel(r: RuangAdegan | null | undefined): boolean {
  return !!r && !!pikselDari(r.latar);
}

/**
 * true bila susunan ini perlu kamera piksel bulat: ruangnya raster ATAU ada tokoh raster (ruang PNG gagal = ruang SVG,
 * tetapi tokoh piksel tetap tampil pada piksel perangkat bulat per piksel seni, bukan skala pecahan).
 */
export function susunanPiksel(s: { ruang: RuangAdegan | null | undefined; tokoh: readonly { gambar: unknown }[] } | null | undefined): boolean {
  return !!s && (ruangPiksel(s.ruang) || s.tokoh.some((t) => !!pikselDari(t.gambar)));
}

/**
 * true bila gambar tokoh RASTER ini sudah menggambar kunci mobil di frame-nya (di tangan / lutut: berdiri, jalan,
 * duduk-turun, duduk-condong Bu Rina). Rencana gerak memakainya supaya kunci di meja tidak tampil bersamaan dengan
 * kunci di tangan (dua kunci). Gambar SVG = false (kunci SVG mengikuti opsi `kunci`).
 */
export function kunciTergambar(g: unknown): boolean {
  return !!pikselDari(g) && (g as { kunciTergambar?: unknown }).kunciTergambar === true;
}

// ------------------------------------------------------------------ manifest ruang (ruang.json)

/** Tambahan pada ruang raster (di luar tipe RuangAdegan milik seni/ruang): papan nama yang tulisannya SUDAH digambar. */
export interface TambahanRuangPiksel {
  /** Kotak papan nama (satuan dunia) yang tulisannya dipanggang di lapisan raster: wajib terlihat, tanpa teks HTML/SVG. */
  papanPiksel?: Kotak;
  /** Tulisan papan yang dipanggang (untuk dicocokkan dengan konfigurasi episode). */
  teksPapan?: string;
}

/** Kotak papan nama ruang (untuk kamera & kartu): kotak teks SVG, atau kotak papan piksel yang tulisannya dipanggang. */
export function kotakPapan(r: RuangAdegan | null | undefined): Kotak | null {
  if (!r) return null;
  const p = r.papanNama;
  if (p) return { x: p.x, y: p.y, w: p.w, h: p.h };
  const k = (r as RuangAdegan & TambahanRuangPiksel).papanPiksel;
  return kotakSah(k) ? { ...k } : null;
}

/** Tulisan papan yang dipanggang di ruang raster, atau null (ruang SVG: teks ditulis panggung dari konfigurasi). */
export function teksPapanPiksel(r: RuangAdegan | null | undefined): string | null {
  const t = r ? (r as RuangAdegan & TambahanRuangPiksel).teksPapan : undefined;
  return typeof t === 'string' ? t : null;
}

/** Prop raster (satuan dunia; jangkar = titik sentuh meja / pegangan), bentuk GambarProp + potongan PNG. */
export interface PropPiksel {
  svg: '';
  w: number;
  h: number;
  jangkar: { x: number; y: number };
  piksel: PotonganPiksel;
}

export type IdPropPiksel = 'kartu' | 'kartuTangan' | 'kunci' | 'telepon' | 'teleponTanpaGagang' | 'gagang';

/**
 * Hasil membaca manifest ruang piksel: ruang per lokasi (lapisan raster + tempat + papan), prop raster, semua URL
 * gambar, dan warna tepi (latar panggung selama PNG belum siap / di luar dunia).
 */
export interface ManifestRuang {
  ruang: Partial<Record<IdLokasiAdegan, RuangAdegan>>;
  prop: Partial<Record<IdPropPiksel, PropPiksel>>;
  url: string[];
  warnaTepi: string | null;
  /** Catatan kecacatan yang dilewati (lapisan tanpa gambar, dsb.), untuk laporan/konsol dev. */
  catatan: string[];
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : null);

/** [x, y, w, h] | {x, y, w, h} -> Kotak. */
function keKotak(v: unknown): Kotak | null {
  if (Array.isArray(v) && v.length >= 4 && v.slice(0, 4).every(angka)) return { x: v[0], y: v[1], w: v[2], h: v[3] };
  return kotakSah(v) ? { x: (v as Kotak).x, y: (v as Kotak).y, w: (v as Kotak).w, h: (v as Kotak).h } : null;
}
/** [x, y] | {x, y} -> titik. */
function keTitik(v: unknown): { x: number; y: number } | null {
  if (Array.isArray(v) && v.length >= 2 && angka(v[0]) && angka(v[1])) return { x: v[0], y: v[1] };
  const o = obj(v);
  return o && angka(o.x) && angka(o.y) ? { x: o.x, y: o.y } : null;
}
const nama = (o: Obj, ...k: string[]): string | null => {
  for (const x of k) if (typeof o[x] === 'string' && o[x]) return o[x] as string;
  return null;
};

/** Warna tepi bawaan: warna pertama palet manifest yang dipakai dinding (bila ada), selain itu null. */
function warnaTepiDari(m: Obj): string | null {
  const hex = (v: unknown) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : null);
  return hex(m.warnaTepi) ?? hex(m.tepi) ?? null;
}

/**
 * Membaca manifest ruang piksel (seni/piksel/ruang.json dari tools/piksel/bangun-ruang.mjs). Dua bentuk diterima:
 *
 *  A. Satu PNG per lapisan (bentuk alat bangun-ruang, 27 Sep):
 *     { piksel: 4, dunia: { w: 1600, h: 900, pw: 400, ph: 225 }, teksPapan,
 *       lokasi: { <lokasi>: { lapisan: [{ id, berkas, x, y, w, h (dunia), pw, ph (PNG), z, engsel? }],
 *                             bukaan?, papan?: { teks, kotak }, tempat } },
 *       prop: { <id>: { berkas, w, h, pw, ph, jangkar } } }
 *     id lapisan: latar, koridor, daun (daun pintu; engsel), belakangMeja, depanMeja, kursiBelakang, kursiDepan.
 *  B. Atlas: { satuan: 4, gambar: { <id>: { berkas, w, h } }, lokasi: { <lokasi>: { latar: { gambar, sumber: [x,y,w,h],
 *     dunia: [x,y] | piksel: [x,y] }, ..., pintu: { daun, engsel, bukaan }, kursi: { belakang, depan }, tempat,
 *     papanNama } } }.
 *
 * Aturan keselamatan: satuan harus 4; ukuran dunia lapisan harus = PNG x 4 (tanpa skala pecahan); lapisan cacat
 * dilewati dengan catatan; lokasi tanpa latar raster / tanpa tempat tokoh tidak dipakai (panggung tetap SVG untuk
 * lokasi itu). `cariUrl(berkas)` = URL yang bisa dimuat; `cadangan(lokasi)` = ruang SVG (tempat/pintu yang tidak ada
 * di manifest). Papan dengan tulisan yang sudah digambar (`papan.kotak`) TIDAK diberi teks panggung (papanNama
 * kosong); kotaknya tetap dipakai kamera sebagai kotak wajib (`kotakPapan`).
 */
export function bacaManifestRuang(
  json: unknown,
  cariUrl: (berkas: string) => string | null | undefined,
  cadangan: (lokasi: IdLokasiAdegan) => RuangAdegan | null,
): ManifestRuang {
  const hasil: ManifestRuang = { ruang: {}, prop: {}, url: [], warnaTepi: null, catatan: [] };
  const m = obj(json);
  if (!m) { hasil.catatan.push('manifest bukan objek'); return hasil; }
  const satuan = angka(m.satuan) ? m.satuan : angka(m.piksel) ? m.piksel : SATUAN_PIKSEL;
  if (satuan !== SATUAN_PIKSEL) { hasil.catatan.push(`satuan ${satuan} != ${SATUAN_PIKSEL}: manifest tidak dipakai`); return hasil; }
  hasil.warnaTepi = warnaTepiDari(m);

  // Bentuk B: atlas bernama.
  const atlas = new Map<string, { url: string; w: number; h: number }>();
  const daftarGambar = obj(m.gambar);
  if (daftarGambar) {
    for (const [id, g0] of Object.entries(daftarGambar)) {
      const g = obj(g0);
      const berkas = g ? nama(g, 'berkas', 'file') : null;
      const w = g && angka(g.w) ? g.w : null;
      const h = g && angka(g.h) ? g.h : null;
      if (!berkas || !w || !h) { hasil.catatan.push(`gambar ${id}: berkas/w/h tidak lengkap`); continue; }
      const url = cariUrl(berkas);
      if (!url) { hasil.catatan.push(`gambar ${id}: berkas ${berkas} tidak ditemukan`); continue; }
      atlas.set(id, { url, w, h });
    }
  }
  const atlasBawaan = atlas.size === 1 ? [...atlas.values()][0]! : null;

  /** Satu lapisan (bentuk A: berkas + pw/ph; bentuk B: gambar + sumber) -> LapisanPiksel. */
  const lapis = (v: unknown, label: string): LapisanPiksel | undefined => {
    const o = obj(v);
    if (!o) return undefined;
    const berkas = nama(o, 'berkas', 'file');
    if (berkas) {
      const url = cariUrl(berkas);
      const pw = angka(o.pw) ? o.pw : null;
      const ph = angka(o.ph) ? o.ph : null;
      const x = angka(o.x) ? o.x : null;
      const y = angka(o.y) ? o.y : null;
      if (!url || !pw || !ph || x === null || y === null) { hasil.catatan.push(`lapisan ${label}: berkas/pw/ph/x/y tidak sah`); return undefined; }
      if ((angka(o.w) && o.w !== pw * SATUAN_PIKSEL) || (angka(o.h) && o.h !== ph * SATUAN_PIKSEL)) {
        hasil.catatan.push(`lapisan ${label}: ukuran dunia != PNG x ${SATUAN_PIKSEL} (skala pecahan), dilewati`);
        return undefined;
      }
      return lapisanPiksel(url, { w: pw, h: ph }, { x: 0, y: 0, w: pw, h: ph }, x, y);
    }
    const a = typeof o.gambar === 'string' ? atlas.get(o.gambar) ?? null : atlasBawaan;
    const sumber = keKotak(o.sumber);
    const diDunia = keTitik(o.dunia);
    const diPiksel = keTitik(o.piksel);
    const di = diDunia ?? (diPiksel ? { x: diPiksel.x * SATUAN_PIKSEL, y: diPiksel.y * SATUAN_PIKSEL } : null);
    if (!a || !sumber || !di) { hasil.catatan.push(`lapisan ${label}: gambar/sumber/posisi tidak sah`); return undefined; }
    if (sumber.x < 0 || sumber.y < 0 || sumber.x + sumber.w > a.w || sumber.y + sumber.h > a.h) {
      hasil.catatan.push(`lapisan ${label}: sumber di luar atlas`);
      return undefined;
    }
    return lapisanPiksel(a.url, { w: a.w, h: a.h }, sumber, di.x, di.y);
  };

  const lokasi = obj(m.lokasi);
  if (!lokasi) { hasil.catatan.push('tanpa lokasi'); return hasil; }
  const teksGlobal = typeof m.teksPapan === 'string' ? m.teksPapan : null;
  for (const [id, v] of Object.entries(lokasi)) {
    const L = obj(v);
    const lok = id as IdLokasiAdegan;
    if (!L) continue;
    // Bentuk A: daftar lapisan ber-id -> peta nama.
    const daftar: Obj = {};
    if (Array.isArray(L.lapisan)) for (const l of L.lapisan) { const o = obj(l); if (o && typeof o.id === 'string') daftar[o.id] = o; }
    const ambil = (...k: string[]) => { for (const x of k) if (daftar[x] ?? L[x]) return daftar[x] ?? L[x]; return undefined; };
    const latar = lapis(ambil('latar'), `${id}.latar`);
    if (!latar) { hasil.catatan.push(`lokasi ${id}: tanpa latar raster, dilewati`); continue; }
    const svg = cadangan(lok);

    let pintu: RuangAdegan['pintu'];
    const pintuO = obj(L.pintu);
    const daunO = obj(pintuO?.daun ?? ambil('daun'));
    if (daunO) {
      const daun = lapis(daunO, `${id}.pintu.daun`);
      const engsel = keTitik(pintuO?.engsel ?? daunO.engsel);
      const bukaan = keKotak(pintuO?.bukaan ?? L.bukaan);
      if (daun && engsel && bukaan) pintu = { daun, engsel, bukaan };
      else hasil.catatan.push(`lokasi ${id}: pintu tidak lengkap, dilewati`);
    }
    const kursiO = obj(L.kursi);
    const kursiBelakang = lapis(kursiO?.belakang ?? ambil('kursiBelakang'), `${id}.kursi.belakang`);
    const kursiDepan = lapis(kursiO?.depan ?? ambil('kursiDepan'), `${id}.kursi.depan`);

    const tempatJson = obj(L.tempat);
    const tempat = (tempatJson ? { ...(svg?.tempat ?? {}), ...tempatJson } : svg?.tempat) as TempatAdegan | undefined;
    if (!tempat || !keTitik(tempat.mentor) || !keTitik(tempat.nasabahDuduk) || !Array.isArray(tempat.jalurMasuk)) {
      hasil.catatan.push(`lokasi ${id}: tempat tokoh tidak ada, dilewati`);
      continue;
    }

    // Papan: bentuk A = tulisan dipanggang di lapisan (kotak saja); bentuk B = kotak teks panggung (papanNama).
    const papanA = obj(L.papan);
    let papanNama: RuangAdegan['papanNama'];
    let papanPiksel: Kotak | undefined;
    let teksPapan: string | undefined;
    if (papanA) {
      const k = keKotak(papanA.kotak);
      if (k) { papanPiksel = k; teksPapan = typeof papanA.teks === 'string' ? papanA.teks : teksGlobal ?? undefined; }
    } else if (L.papanNama !== null) {
      const papanO = obj(L.papanNama);
      papanNama = papanO && kotakSah(papanO)
        ? { ukuranHuruf: 42, warna: '#e9c46a', ...(papanO as object) } as RuangAdegan['papanNama']
        : papanO ? svg?.papanNama : undefined;
    }

    const r: RuangAdegan & TambahanRuangPiksel = {
      lokasi: lok,
      latar,
      koridor: lapis(ambil('koridor'), `${id}.koridor`),
      pintu,
      belakangMeja: lapis(ambil('belakangMeja'), `${id}.belakangMeja`),
      depanMeja: lapis(ambil('depanMeja'), `${id}.depanMeja`),
      kursi: kursiBelakang ? { belakang: kursiBelakang, ...(kursiDepan ? { depan: kursiDepan } : {}) } : undefined,
      tempat,
      papanNama,
      ...(papanPiksel ? { papanPiksel, teksPapan } : {}),
    };
    hasil.ruang[lok] = r;
  }

  // Prop raster (bentuk A): satu PNG per prop, jangkar dalam satuan dunia.
  const propO = obj(m.prop);
  if (propO) {
    for (const [id, v] of Object.entries(propO)) {
      const o = obj(v);
      if (!o) continue;
      const berkas = nama(o, 'berkas', 'file');
      const url = berkas ? cariUrl(berkas) : null;
      const pw = angka(o.pw) ? o.pw : null;
      const ph = angka(o.ph) ? o.ph : null;
      const j = keTitik(o.jangkar);
      if (!url || !pw || !ph || !j) { hasil.catatan.push(`prop ${id}: berkas/pw/ph/jangkar tidak sah`); continue; }
      if ((angka(o.w) && o.w !== pw * SATUAN_PIKSEL) || (angka(o.h) && o.h !== ph * SATUAN_PIKSEL)) { hasil.catatan.push(`prop ${id}: skala pecahan, dilewati`); continue; }
      if (!['kartu', 'kartuTangan', 'kunci', 'telepon', 'teleponTanpaGagang', 'gagang'].includes(id)) continue;
      hasil.prop[id as IdPropPiksel] = { svg: '', w: pw * SATUAN_PIKSEL, h: ph * SATUAN_PIKSEL, jangkar: j, piksel: { url, atlas: { w: pw, h: ph }, sumber: { x: 0, y: 0, w: pw, h: ph } } };
    }
  }

  const semua = new Set<string>();
  for (const r of Object.values(hasil.ruang)) for (const u of urlRuang(r)) semua.add(u);
  for (const p of Object.values(hasil.prop)) semua.add(p.piksel.url);
  hasil.url = [...semua];
  return hasil;
}
