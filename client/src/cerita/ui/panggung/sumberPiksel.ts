/**
 * SUMBER SENI PIKSEL panggung: manifest ruang raster (seni/piksel/ruang.json dari tools/piksel/bangun-ruang.mjs,
 * dibaca `bacaManifestRuang` di piksel.ts) + pemuat/dekode PNG.
 *
 * - Deteksi saat BUILD: `import.meta.glob` (Vite). Berkas tidak ada = peta kosong = panggung tetap memakai ruang SVG.
 *   Di luar Vite (tes node lewat tsx) `import.meta.glob` tidak ada: panggilannya dibungkus try/catch = tanpa piksel.
 * - PNG ruang & prop mulai dimuat & didekode (HTMLImageElement.decode) SAAT MODUL DIMUAT (halaman daftar /cerita dan
 *   halaman episode mengimpornya), jadi biasanya sudah siap sebelum panggung dicat pertama kali. Dialog tidak pernah
 *   menunggu; dunia raster disembunyikan (warna panggung polos) sampai PNG susunan kini siap, lalu muncul sekali.
 * - Satu PNG ruang gagal dimuat/didekode = status 'gagal': `ruangPikselUntuk()` mengembalikan null dan panggung kembali
 *   ke ruang SVG (cerita tetap jalan). PNG prop gagal = prop itu SVG. Pendengar (`langgananPiksel`) diberi tahu
 *   setiap status berubah.
 * - Uji (hanya Vite dev): localStorage `raksa:uji:ruang-piksel` = URL manifest lain (PNG relatif terhadap URL itu),
 *   atau 'mati' = paksa ruang SVG. Build produksi membuang cabang ini.
 */
import { ruangAdegan, type RuangAdegan } from '../../seni/ruang';
import type { IdLokasiAdegan } from '../../tipe';
import { bacaManifestRuang, type IdPropPiksel, type ManifestRuang, type PropPiksel } from './piksel';

export type StatusPiksel = 'tidak-ada' | 'memuat' | 'siap' | 'gagal';

const AKAR = '../../seni/piksel/';

let jsonBuild: Record<string, unknown> = {};
let pngBuild: Record<string, string> = {};
try {
  jsonBuild = import.meta.glob('../../seni/piksel/ruang.json', { eager: true, import: 'default' });
  pngBuild = import.meta.glob('../../seni/piksel/ruang-*.png', { eager: true, query: '?url', import: 'default' });
} catch {
  /* bukan Vite (tes node): tanpa seni piksel */
}

let manifest: ManifestRuang | null = null;
let status: StatusPiksel = 'tidak-ada';
let versi = 0;
const pendengar = new Set<() => void>();

function beritahu(): void {
  versi++;
  for (const f of [...pendengar]) {
    try { f(); } catch { /* pendengar rusak tidak menghentikan yang lain */ }
  }
}
function ubah(s: StatusPiksel): void {
  if (s === status) return;
  status = s;
  beritahu();
}

/** Berlangganan perubahan status seni piksel (useSyncExternalStore). */
export function langgananPiksel(f: () => void): () => void {
  pendengar.add(f);
  return () => { pendengar.delete(f); };
}
/** Versi status (berubah setiap status manifest / PNG berubah): snapshot useSyncExternalStore. */
export const versiPiksel = (): number => versi;
export const statusPiksel = (): StatusPiksel => status;

/** Ruang raster untuk lokasi, atau null (tanpa manifest / lokasi tidak ada / PNG ruang gagal = pakai ruang SVG). */
export function ruangPikselUntuk(lokasi: IdLokasiAdegan): RuangAdegan | null {
  if (!manifest || status === 'gagal' || status === 'tidak-ada') return null;
  return manifest.ruang[lokasi] ?? null;
}

/** Prop raster (null: tanpa manifest, ruang gagal, prop tidak dibangun, atau PNG prop gagal). */
export function propPikselUntuk(id: IdPropPiksel): PropPiksel | null {
  if (!manifest || status === 'gagal' || status === 'tidak-ada') return null;
  const p = manifest.prop[id];
  return p && gambarSiap(p.piksel.url) !== false ? p : null;
}

/** URL PNG prop raster (didekode bersama ruang sebelum dunia piksel diperlihatkan). */
export function urlPropPiksel(): string[] {
  if (!manifest) return [];
  return Object.values(manifest.prop).map((p) => p.piksel.url);
}

// ------------------------------------------------------------------ pemuat gambar

interface EntriGambar {
  siap: boolean | null;
  janji: Promise<boolean>;
}
const gambar = new Map<string, EntriGambar>();
/** Elemen gambar yang sudah didekode ditahan supaya hasil dekode tetap di cache memori peramban. */
const tahan: HTMLImageElement[] = [];

/** Muat & dekode satu PNG (sekali per URL). true = siap digambar tanpa kedip kosong; false = gagal. */
export function muatGambar(url: string): Promise<boolean> {
  const ada = gambar.get(url);
  if (ada) return ada.janji;
  const entri: EntriGambar = { siap: null, janji: Promise.resolve(false) };
  gambar.set(url, entri);
  entri.janji = new Promise<boolean>((selesai) => {
    if (typeof Image === 'undefined') { selesai(false); return; }
    const img = new Image();
    img.decoding = 'async';
    let beres = false;
    const akhir = (ok: boolean) => {
      if (beres) return;
      beres = true;
      if (ok) tahan.push(img);
      selesai(ok);
    };
    img.onerror = () => akhir(false);
    img.onload = () => {
      if (typeof img.decode === 'function') img.decode().then(() => akhir(true), () => akhir(img.naturalWidth > 0));
      else akhir(img.naturalWidth > 0);
    };
    img.src = url;
  }).then((ok) => {
    entri.siap = ok;
    if (!ok) beritahu();
    return ok;
  });
  return entri.janji;
}

/** Status dekode URL: true siap, false gagal, null belum selesai / belum diminta. */
export function gambarSiap(url: string): boolean | null {
  return gambar.get(url)?.siap ?? null;
}

/** Status gabungan beberapa URL: 'siap' (semua), 'gagal' (ada yang gagal), selain itu 'memuat' (dan mulai memuat). */
export function statusGambar(urls: readonly string[]): 'siap' | 'memuat' | 'gagal' {
  let memuat = false;
  for (const u of urls) {
    const s = gambarSiap(u);
    if (s === false) return 'gagal';
    if (s !== true) {
      memuat = true;
      if (!gambar.has(u)) void muatGambar(u);
    }
  }
  return memuat ? 'memuat' : 'siap';
}

// ------------------------------------------------------------------ inisialisasi

function pasangManifest(json: unknown, cariUrl: (berkas: string) => string | null | undefined): void {
  const m = bacaManifestRuang(json, cariUrl, (lok) => {
    try { return ruangAdegan(lok); } catch { return null; }
  });
  if (import.meta.env?.DEV && m.catatan.length) console.warn('[panggung piksel] manifest ruang:', m.catatan);
  if (!Object.keys(m.ruang).length) return;
  manifest = m;
  ubah('memuat');
  // PNG ruang menentukan status ruang; PNG prop dimuat juga (prop gagal = prop itu SVG, ruang tetap piksel).
  const ruangUrl = new Set(m.url);
  for (const p of Object.values(m.prop)) ruangUrl.delete(p.piksel.url);
  for (const p of Object.values(m.prop)) void muatGambar(p.piksel.url);
  void Promise.all([...ruangUrl].map(muatGambar)).then((hasil) => {
    if (manifest !== m) return;
    if (hasil.every(Boolean)) ubah('siap');
    else {
      if (import.meta.env?.DEV) console.warn('[panggung piksel] PNG ruang gagal dimuat; memakai ruang SVG', [...ruangUrl].filter((_, i) => !hasil[i]));
      ubah('gagal');
    }
  });
}

function uji(): string | null {
  if (!import.meta.env?.DEV || typeof window === 'undefined') return null;
  try { return window.localStorage.getItem('raksa:uji:ruang-piksel'); } catch { return null; }
}

function mulai(): void {
  if (typeof window === 'undefined') return;
  const u = uji();
  if (u === 'mati') return;
  if (u) {
    // Sinkron (hanya uji dev) supaya urutan tampil sama dengan manifest build: ruang piksel sejak render pertama.
    try {
      const x = new XMLHttpRequest();
      x.open('GET', u, false);
      x.send();
      const dasar = new URL(u, window.location.href).href;
      if (x.status >= 200 && x.status < 300) pasangManifest(JSON.parse(x.responseText), (berkas) => new URL(berkas, dasar).href);
      else console.warn('[panggung piksel] manifest uji gagal dimuat', x.status);
    } catch (e) {
      console.warn('[panggung piksel] manifest uji gagal dimuat', e);
    }
    return;
  }
  const json = jsonBuild[`${AKAR}ruang.json`];
  if (json !== undefined) pasangManifest(json, (berkas) => pngBuild[`${AKAR}${berkas.replace(/^\.?\//, '')}`] ?? null);
}

mulai();
