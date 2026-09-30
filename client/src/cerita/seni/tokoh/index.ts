/**
 * Pintu masuk seni tokoh untuk panggung, potret, dan aktivitas. Generator final SVG (missRaksa.ts, buRina.ts)
 * menggantikan pengganti sementara di sini; `aman` membungkus generator supaya galat gambar tidak menghentikan
 * cerita (fallback siluet sementara.ts, nama tokoh ditulis sebagai teks oleh tampilan).
 *
 * SENI PIKSEL (v4): opsi `piksel: true` = gambar RASTER dari penyusun piksel (seni/piksel: atlas + manifest Miss Raksa
 * & Bu Rina) dalam bentuk GambarTokoh panggung (svg '' + potongan PNG + tempelan wajah/mata/mulut + kotak di atas
 * meja; ui/panggung/piksel.ts TambahanTokohPiksel). Dipakai panggung (ui/panggung/sumber.ts). Tanpa opsi itu hasilnya
 * tetap SVG, karena pemakai lain (potret dialog, kartu episode, sprite aktivitas) masih membaca `.svg` dengan jendela
 * kanvas SVG. Cadangan jalur raster:
 *  - dekode PNG atlas SALAH SATU tokoh GAGAL (status dari panggung lewat `pasangStatusAtlas`; belum selesai = tetap
 *    raster, panggung menyembunyikan dunia sampai PNG siap) = KEDUA tokoh memakai SILUET netral sementara.ts (nama
 *    ditulis sebagai teks oleh panggung), bukan SVG v3: tampilan gagal seragam, tidak pernah seni v3 yang ditolak di
 *    samping tokoh piksel (`atlasGagal`);
 *  - manifest/atlas tokoh itu tidak terpasang (tokohPikselTersedia false) atau penyusun melempar / hasilnya kosong =
 *    SVG (lalu siluet);
 *  - generator tokoh itu diganti lewat `pasangGenerator` (uji: generator pengganti berlaku untuk semua jalur), atau
 *    raster dimatikan (`pasangGenerator({ piksel: false })`) = generator itu / SVG.
 *
 * Hasil null / tanpa svg-dan-tanpa-potongan / ukuran tidak sah dihitung GAGAL (sama dengan melempar).
 * Varian mulut terbuka (`bicara`) / mata tertutup (`kedip`) yang gagal TIDAK jatuh ke siluet selama gambar dasarnya
 * berhasil: dipakai gambar dasar (mulut/kedip diam), supaya panggung tidak berganti-ganti antara seni final dan
 * siluet saat animasi mulut/kedip.
 */
import { gambarBuRina as buRinaFinal } from './buRina';
import { gambarMissRaksa as missRaksaFinal } from './missRaksa';
import { buRinaSementara, missRaksaSementara } from './sementara';
import type { GambarTokoh, GeneratorBuRina, GeneratorMissRaksa, OpsiBuRina, OpsiMissRaksa } from './tipe';
import {
  DAFTAR_TOKOH_PIKSEL, keGambarTokoh, opsiDariCerita, penyusunPiksel, SATUAN, susunDari, URL_ATLAS_PIKSEL, type GambarTokohPiksel, type IdTokohPiksel,
  type JenisJangkar,
} from '../piksel';

export type { GambarTokoh, OpsiBuRina, OpsiMissRaksa, Titik, JendelaPotret } from './tipe';
export { KANVAS_BERDIRI, KANVAS_DUDUK, JENDELA_POTRET_V3, JENDELA_POTRET_KECIL, POTRET_KECIL_MAKS_PX, KEPALA_TINGGI } from './ukuran';
export { aturanPotret, JENDELA_POTRET_SEDANG, type AturanPotret } from './missRaksa';

/** Opsi seni tambahan: `piksel` = minta gambar raster (penyusun piksel) bila tersedia. */
export interface OpsiSeni {
  piksel?: boolean;
}

/**
 * Gambar tokoh RASTER untuk panggung: GambarTokohPiksel + fakta frame yang dibutuhkan rencana gerak (kunci yang sudah
 * digambar di tangan/lutut frame itu, jadi prop kunci meja tidak tampil ganda).
 */
export type GambarTokohRaster = GambarTokohPiksel & {
  kunciTergambar?: boolean;
  teleponTergambar?: boolean;
  /** Id frame atlas yang dipakai (mis. 'duduk-tunjuk-kanan'). */
  frame?: string;
  /** Jenis jangkar frame itu: telapak kaki (berdiri, bingkai antara duduk-turun) atau pinggul (duduk). */
  jenisJangkar?: JenisJangkar;
  /** Titik tangan BERNAMA (telapak, telunjuk, telepon, kunci) dalam satuan kanvas (piksel seni x 4). */
  titikTangan?: Record<string, { x: number; y: number }>;
};

let genMiss: GeneratorMissRaksa = missRaksaFinal;
let genRina: GeneratorBuRina = buRinaFinal;
let pikselAktif = true;
/** Status dekode PNG (true siap, false GAGAL, null belum selesai) dari pemuat panggung; tanpa pemuat = null. */
let statusAtlas: (url: string) => boolean | null = () => null;

/**
 * Dipakai lead saat integrasi (dan uji) untuk memasang generator. Generator yang DIGANTI (bukan generator final)
 * berlaku juga untuk permintaan `piksel` (jalur raster dilewati untuk tokoh itu). `piksel: false` = jalur raster mati.
 */
export function pasangGenerator(g: { missRaksa?: GeneratorMissRaksa; buRina?: GeneratorBuRina; piksel?: boolean }): void {
  if (g.missRaksa) genMiss = g.missRaksa;
  if (g.buRina) genRina = g.buRina;
  if (typeof g.piksel === 'boolean') pikselAktif = g.piksel;
}

/** Pemuat gambar panggung memasang pembaca status dekode PNG (ui/panggung/sumber.ts -> sumberPiksel.gambarSiap). */
export function pasangStatusAtlas(f: (url: string) => boolean | null): void {
  statusAtlas = f;
}

const angka = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Gambar yang bisa dipakai: ukuran positif + isi SVG ATAU potongan PNG (panggung/piksel.ts). */
export function gambarSah(g: unknown): g is GambarTokoh {
  if (!g || typeof g !== 'object') return false;
  const o = g as Partial<GambarTokoh> & { piksel?: { url?: unknown; sumber?: unknown } };
  if (!angka(o.w) || !angka(o.h) || o.w <= 0 || o.h <= 0) return false;
  if (typeof o.svg === 'string' && o.svg.length > 0) return true;
  return !!o.piksel && typeof o.piksel.url === 'string' && o.piksel.url.length > 0 && !!o.piksel.sumber;
}

function aman<O extends { bicara?: boolean; kedip?: boolean }>(gen: (o: O) => GambarTokoh, siluet: (o: O) => GambarTokoh, o: O): GambarTokoh {
  try {
    const g = gen(o);
    if (gambarSah(g)) return g;
  } catch {
    // jatuh ke gambar dasar / siluet di bawah
  }
  if (o.bicara || o.kedip) {
    try {
      const g = gen({ ...o, bicara: false, kedip: false });
      if (gambarSah(g)) return g;
    } catch {
      // gambar dasar juga gagal: siluet di bawah
    }
  }
  return siluet(o);
}

/**
 * Atlas piksel SALAH SATU tokoh (manifest terpasang) GAGAL didekode selagi raster aktif: panggung memakai siluet netral
 * untuk KEDUA tokoh (tampilan gagal seragam). Belum selesai dimuat = bukan gagal.
 */
export function atlasGagal(): boolean {
  if (!pikselAktif) return false;
  return DAFTAR_TOKOH_PIKSEL.some((id) => penyusunPiksel.tersedia(id) && statusAtlas(penyusunPiksel.url[id] ?? URL_ATLAS_PIKSEL[id]) === false);
}

/**
 * true bila tokoh ini digambar dari atlas piksel saat diminta `piksel` (manifest ada, TIDAK ADA atlas tokoh yang gagal,
 * tanpa pengganti).
 */
export function tokohPiksel(id: IdTokohPiksel): boolean {
  if (!pikselAktif || !penyusunPiksel.tersedia(id)) return false;
  if (id === 'missRaksa' ? genMiss !== missRaksaFinal : genRina !== buRinaFinal) return false;
  return !atlasGagal();
}

/** Gambar raster tokoh, atau null (jalur raster tidak tersedia / gagal: pakai SVG). */
function raster(id: IdTokohPiksel, o: (OpsiMissRaksa | OpsiBuRina) & OpsiSeni): GambarTokohRaster | null {
  if (!o.piksel || !tokohPiksel(id)) return null;
  const m = penyusunPiksel.manifest[id];
  if (!m) return null;
  try {
    // Arah frame: `hadap` cue (Bu Rina pergi) bila ada. Miss Raksa: pandang lawan/bawah = kanan (ke Bu Rina / kartu &
    // dokumen di meja, kanan gambar), pemain/depan = kiri (penyusun: manifest.pandang); `bawah` dipastikan kanan di
    // sini untuk SEMUA pose (penyusun sendiri memakai arah bawaan pose untuk `bawah`).
    const hadap = (o as OpsiBuRina).hadap ?? (id === 'missRaksa' && o.pandang === 'bawah' ? 'kanan' : undefined);
    const s = susunDari(m, opsiDariCerita(id, m, {
      pose: o.pose, ekspresi: o.ekspresi, pandang: o.pandang, ...(hadap ? { hadap } : {}), bicara: !!o.bicara, kedip: !!o.kedip,
    }), penyusunPiksel.url[id]);
    const g: GambarTokohRaster = keGambarTokoh(s);
    g.kunciTergambar = s.kunciTergambar;
    g.teleponTergambar = s.teleponTergambar;
    g.frame = s.frame;
    g.jenisJangkar = s.jenisJangkar;
    g.titikTangan = Object.fromEntries(Object.entries(s.titikTangan).map(([k, t]) => [k, { x: t.x * SATUAN, y: t.y * SATUAN }]));
    return gambarSah(g) ? g : null;
  } catch {
    return null;
  }
}

/** Opsi tanpa `piksel` (generator SVG & siluet tidak mengenalnya; kunci cache SVG tetap sama). */
function tanpaSeni<O extends OpsiSeni>(o: O): Omit<O, 'piksel'> {
  if (!('piksel' in o)) return o;
  const { piksel: _piksel, ...sisa } = o;
  return sisa;
}

/**
 * Raster diminta tetapi atlas gagal didekode (atlasGagal) = siluet netral, KECUALI generator tokoh itu diganti
 * (pasangGenerator; uji), yang tetap berlaku.
 */
function siluetGagal(o: OpsiSeni, diganti: boolean): boolean {
  return !!o.piksel && !diganti && atlasGagal();
}

export function gambarMissRaksa(o: OpsiMissRaksa & OpsiSeni): GambarTokoh {
  if (siluetGagal(o, genMiss !== missRaksaFinal)) return missRaksaSementara(tanpaSeni(o));
  return raster('missRaksa', o) ?? aman(genMiss, missRaksaSementara, tanpaSeni(o));
}

export function gambarBuRina(o: OpsiBuRina & OpsiSeni): GambarTokoh {
  if (siluetGagal(o, genRina !== buRinaFinal)) return buRinaSementara(tanpaSeni(o));
  return raster('buRina', o) ?? aman(genRina, buRinaSementara, tanpaSeni(o));
}
