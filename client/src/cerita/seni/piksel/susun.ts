/**
 * PENYUSUN TOKOH PIKSEL (murni: tanpa React, tanpa DOM, deterministik). Membaca manifest atlas tokoh
 * (seni/piksel/miss-raksa.json & bu-rina.json; skema docs/cerita/aset/PIKSEL.md bagian 3) lalu menyusun satu tokoh
 * menjadi daftar potongan atlas BERURUTAN: tubuh (`rect`, wajah netral terpanggang) -> wajah ekspresi (`dasar` di
 * `wajah.kotak`) -> mata (`kedip` ATAU `bawah` di `wajah.mata`) -> mulut (`bicara` di `wajah.mulut`). Semua koordinat
 * = piksel seni relatif pojok kiri-atas frame; 1 piksel seni = SATUAN (4) satuan dunia.
 *
 * Pemakai:
 *  - panggung: `keGambarTokoh` -> GambarTokoh raster (ui/panggung/piksel.ts TambahanTokohPiksel);
 *  - potret bulat: `potretDari` (jendela manifest, skala BULAT); sisipan telepon: `teleponDari`;
 *  - SVG kecil di luar panggung: `keSvg` / `svgPotret` / `svgTokoh`.
 * Pintu masuk dengan manifest & URL atlas terpasang: seni/piksel/index.ts (`susunTokoh`, `potretTokoh`, ...).
 *
 * PEMETAAN cerita -> seni
 *  - Wajah Miss Raksa (5): netral->netral, tersenyum|senang->senyum, cemas|bingung->prihatin, serius|kesal->serius,
 *    lega->lega (manifest.ekspresiDari; tanpa kunci itu dipakai EKSPRESI_BAWAAN yang sama). Bu Rina: 8 ekspresi
 *    cerita apa adanya.
 *  - Pose -> frame: manifest.pose[pose][arah]. Bu Rina `duduk`: tubuh gestur manifest.pose.duduk.tubuhEkspresi
 *    (kesal->lipat-tangan, cemas->genggam, bingung->dagu, lega->dada, netral/serius/tersenyum/senang->duduk).
 *  - Arah (hadap = arah FRAME, bukan cermin CSS): opsi.hadap, selain itu pose.bawaan manifest, selain itu ARAH_BAWAAN.
 *    `opsiDariCerita` menurunkan hadap & mata dari `pandang` cerita (Miss: lawan->kanan, pemain/depan->kiri,
 *    bawah->mata `bawah` dengan arah pose; duduk-tunjuk+bawah = pose.kartu {kanan, bawah}). Bu Rina: pandang tidak
 *    mengubah arah (frame duduk hanya kiri), `bawah` -> mata `bawah`.
 *
 * ATURAN CADANGAN (tidak pernah melempar untuk masukan cerita yang sah; setiap cadangan dicatat di `cadangan`):
 *  1. Ekspresi: ekspresiDari -> nama cerita bila ada di manifest -> EKSPRESI_BAWAAN -> netral. Frame tanpa ekspresi itu
 *     -> netral frame itu; frame tanpa lapisan wajah sama sekali -> tubuh saja (wajah netral sudah terpanggang).
 *  2. Arah: arah diminta tidak ada untuk pose itu -> arah lain pose yang SAMA (mis. Bu Rina duduk + kanan -> kiri;
 *     berdiri-pergi hanya kanan). `hadap` hasil = arah frame yang benar-benar dipakai.
 *  3. Pose: tidak ada di manifest -> rantai POSE_CADANGAN (keluarga jangkar sama: berdiri <-> berdiri/jalan,
 *     duduk <-> duduk), lalu pose apa pun berjenis jangkar sama, lalu pose pertama manifest.
 *  4. Varian: potongan kedip/bawah/bicara tidak ada -> lapisan itu dilewati (mata terbuka / mulut tertutup).
 *  Kedip, bawah, dan bicara TIDAK PERNAH mengubah frame, rect, jangkar, kepala, atau lapisan tubuh + wajah.
 *
 * Manifest dibaca TOLERAN (`bacaManifestTokoh`), selisih skema yang diketahui antara kedua tokoh:
 *  - titik/kotak berupa [x, y(, w, h)] atau {x, y(, w, h)};
 *  - ukuran atlas `ukuranAtlas: [w, h]` atau {w, h}; satuan dari `piksel` (angka; Miss juga punya `satuan` berupa objek);
 *  - `kepalaTinggi` per frame hanya di Miss -> Bu Rina memakai KEPALA_TINGGI_BAWAAN (46: hijab -> dagu 45-46 px);
 *  - `pinggul` hanya di Miss -> dari jangkar bila jenisJangkar 'pinggul'; `kaki` Bu Rina selalu ada;
 *  - `garisMeja`/`diAtasMeja` hanya di frame duduk Miss (diAtasMeja daftar kotak; satu kotak tunggal juga diterima);
 *  - `ujungTelunjuk` Miss -> titik tangan `telunjuk` bila `tangan.telunjuk` tidak ada;
 *  - jendela telepon Bu Rina tanpa `frame`/`skala` -> frame `telepon.frame`, skala 1;
 *  - `ekspresiDari`, `pandang`, pose `bawaan`/`kartu` hanya di Miss; `tubuhEkspresi` hanya di Bu Rina;
 *  - pose berupa string frame, atau tanpa bagian `pose` sama sekali -> diturunkan dari id frame (`<pose>-<arah>`).
 * Potongan di luar atlas / ukuran lapisan != kotaknya / koordinat pecahan dilewati dengan catatan (bukan galat).
 */
import type { ArahPandang, Ekspresi, PoseMentor, PoseNasabah } from '../../tipe';
import type { GambarTokoh, Titik } from '../tokoh/tipe';
import type { PotonganPiksel, TambahanTokohPiksel } from '../../ui/panggung/piksel';

/** Satuan dunia per piksel seni (= ui/panggung/piksel.ts SATUAN_PIKSEL; diuji sama). */
export const SATUAN = 4;
/** Tinggi kepala (piksel seni) bila frame tidak menyebutnya (Bu Rina: hijab -> dagu 45-46, BU-RINA-PIKSEL.md). */
export const KEPALA_TINGGI_BAWAAN = 46;

export type IdTokohPiksel = 'missRaksa' | 'buRina';
export const DAFTAR_TOKOH_PIKSEL: readonly IdTokohPiksel[] = ['missRaksa', 'buRina'];
export type ArahTokoh = 'kiri' | 'kanan';
/** Mata: terbuka (dasar), tertutup (kedip), atau melihat ke bawah/kartu (bawah). */
export type MataTokoh = 'buka' | 'tutup' | 'bawah';
export type MulutTokoh = 'tutup' | 'buka';
export type JenisJangkar = 'kaki' | 'pinggul';

/** Kotak piksel seni (sama bentuknya dengan Kotak panggung). */
export interface KotakSeni {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type JenisLapisan = 'tubuh' | 'wajah' | 'mata' | 'mulut';

/** Satu potongan atlas (`sumber`) yang digambar di (x, y) piksel seni relatif pojok kiri-atas frame. */
export interface LapisanSusun {
  jenis: JenisLapisan;
  sumber: KotakSeni;
  x: number;
  y: number;
}

export interface WajahFrame {
  kotak: KotakSeni;
  mata: KotakSeni;
  mulut: KotakSeni;
}

/** Potongan wajah satu ekspresi (rect atlas); ukuran = wajah.kotak / mata / mata / mulut. */
export interface VarianWajah {
  dasar?: KotakSeni;
  kedip?: KotakSeni;
  bawah?: KotakSeni;
  bicara?: KotakSeni;
}

/** Frame manifest yang sudah dinormalkan. */
export interface FrameTokoh {
  id: string;
  rect: KotakSeni;
  hadap: ArahTokoh;
  jenisJangkar: JenisJangkar;
  jangkar: Titik;
  kaki?: Titik;
  pinggul?: Titik;
  kepala: Titik;
  kepalaTinggi: number;
  /** Titik tangan bernama (telapak, telunjuk, telepon, kunci, ...). */
  tangan: Record<string, Titik>;
  wajah: WajahFrame | null;
  ekspresi: Record<string, VarianWajah>;
  garisMeja?: number;
  diAtasMeja?: KotakSeni[];
  kunciTergambar: boolean;
  teleponTergambar: boolean;
}

export interface PoseTokoh {
  kiri?: string;
  kanan?: string;
  bawaan?: ArahTokoh;
  /** Miss duduk-tunjuk: momen kartu = arah + varian mata. */
  kartu?: { arah: ArahTokoh; varian?: 'bawah' };
  /** Bu Rina duduk: ekspresi cerita -> frame tubuh gestur. */
  tubuhEkspresi: Record<string, string>;
}

export interface JendelaManifest {
  /** Kunci di manifest ('32', '44', ..., 'telepon'). */
  kunci: string;
  frame: string;
  x: number;
  y: number;
  sisi: number;
  skala: number;
  tampil: number;
}

export interface ManifestTokoh {
  tokoh: string;
  gambar: string;
  atlas: { w: number; h: number };
  /** Wajah seni yang tersedia. */
  ekspresi: string[];
  /** Ekspresi cerita -> wajah seni. */
  ekspresiDari: Record<string, string>;
  frame: Record<string, FrameTokoh>;
  pose: Record<string, PoseTokoh>;
  pandang: Partial<Record<ArahPandang, { arah?: ArahTokoh; varian?: 'bawah' }>>;
  potret: { frame: string | null; jendela: JendelaManifest[]; dekat: JendelaManifest[] };
  telepon: JendelaManifest | null;
  /** Kecacatan kecil yang dilewati saat membaca (untuk laporan / konsol dev). */
  catatan: string[];
}

// ------------------------------------------------------------------ tabel cerita

const POSE_MENTOR: Readonly<Record<PoseMentor, true>> = {
  berdiri: true, 'berdiri-sambut': true, 'berdiri-persilakan': true, 'duduk-dengar': true, 'duduk-jelaskan': true, 'duduk-tunjuk': true, telepon: true,
};
const POSE_NASABAH: Readonly<Record<PoseNasabah, true>> = {
  berdiri: true, 'jalan-a': true, 'jalan-b': true, 'duduk-turun': true, duduk: true, 'duduk-condong': true, telepon: true, 'berdiri-pergi': true,
};
/** Semua pose cerita (tipe.ts) per tokoh, urutan tetap. */
export const POSE_CERITA: Readonly<{ missRaksa: readonly PoseMentor[]; buRina: readonly PoseNasabah[] }> = {
  missRaksa: Object.keys(POSE_MENTOR) as PoseMentor[],
  buRina: Object.keys(POSE_NASABAH) as PoseNasabah[],
};
/**
 * Pose yang DITURUNKAN dari id frame bila manifest punya bagian pose tetapi tidak menyebutnya: bingkai antara panggung
 * `duduk-turun` (Bu Rina: pose cerita; Miss Raksa: hanya bingkai antara kedatangan, ui/panggung/rencana.ts
 * bingkaiTurunMentor). Pose lain yang tidak disebut tetap jatuh ke rantai POSE_CADANGAN (bagian pose berwenang).
 */
const POSE_DARI_FRAME: ReadonlySet<string> = new Set<string>(['duduk-turun']);

/** Wajah seni bawaan bila manifest tidak punya `ekspresiDari` (sama dengan missRaksa.ts wajahDari). */
export const EKSPRESI_BAWAAN: Readonly<Partial<Record<Ekspresi, string>>> = {
  tersenyum: 'senyum', senang: 'senyum', cemas: 'prihatin', bingung: 'prihatin', kesal: 'serius',
};

/**
 * Arah bawaan per pose bila opsi.hadap & pose.bawaan kosong (nama pose kedua tokoh tidak bentrok artinya):
 * Miss menyambut/berdiri/telepon ke pemain (kiri), mempersilakan & duduk ke Bu Rina (kanan); Bu Rina ke meja (kiri),
 * pergi ke pintu (kanan).
 */
export const ARAH_BAWAAN: Readonly<Record<string, ArahTokoh>> = {
  berdiri: 'kiri', 'berdiri-sambut': 'kiri', 'berdiri-persilakan': 'kanan', 'duduk-dengar': 'kanan', 'duduk-jelaskan': 'kanan',
  'duduk-tunjuk': 'kanan', telepon: 'kiri', 'jalan-a': 'kiri', 'jalan-b': 'kiri', 'duduk-turun': 'kiri', duduk: 'kiri',
  'duduk-condong': 'kiri', 'berdiri-pergi': 'kanan',
};

/** Rantai cadangan pose (aturan 3): keluarga jangkar sama lebih dulu. */
export const POSE_CADANGAN: Readonly<Record<string, readonly string[]>> = {
  berdiri: ['berdiri-sambut', 'berdiri-persilakan', 'jalan-a', 'jalan-b', 'berdiri-pergi'],
  'berdiri-sambut': ['berdiri', 'berdiri-persilakan'],
  'berdiri-persilakan': ['berdiri', 'berdiri-sambut'],
  'berdiri-pergi': ['berdiri', 'jalan-a'],
  'jalan-a': ['jalan-b', 'berdiri'],
  'jalan-b': ['jalan-a', 'berdiri'],
  'duduk-turun': ['berdiri'],
  'duduk-dengar': ['duduk-jelaskan', 'duduk-tunjuk', 'duduk'],
  'duduk-jelaskan': ['duduk-dengar', 'duduk-tunjuk'],
  'duduk-tunjuk': ['duduk-dengar', 'duduk-jelaskan'],
  duduk: ['duduk-condong', 'duduk-dengar'],
  'duduk-condong': ['duduk'],
  telepon: ['duduk-dengar', 'duduk'],
};

/** Pandang bawaan per pose bila cue tidak menyebutnya (sama dengan generator SVG missRaksa.ts / buRina.ts). */
function pandangBawaan(id: IdTokohPiksel, pose: string): ArahPandang {
  if (id === 'missRaksa') {
    if (pose === 'berdiri-sambut' || pose === 'berdiri') return 'pemain';
    if (pose === 'duduk-tunjuk') return 'bawah';
    if (pose === 'telepon') return 'depan';
    return 'lawan';
  }
  return pose === 'jalan-a' || pose === 'jalan-b' || pose === 'telepon' || pose === 'berdiri-pergi' ? 'depan' : 'lawan';
}

/** Arah pandang -> arah frame bila manifest tidak punya `pandang` (hanya Miss punya frame dua arah yang berarti). */
const PANDANG_BAWAAN: Readonly<Record<IdTokohPiksel, Partial<Record<ArahPandang, { arah?: ArahTokoh; varian?: 'bawah' }>>>> = {
  missRaksa: { lawan: { arah: 'kanan' }, pemain: { arah: 'kiri' }, depan: { arah: 'kiri' }, bawah: { varian: 'bawah' } },
  buRina: { bawah: { varian: 'bawah' } },
};

const jenisPose = (pose: string): JenisJangkar => (pose !== 'duduk-turun' && (pose.startsWith('duduk') || pose === 'telepon') ? 'pinggul' : 'kaki');

// ------------------------------------------------------------------ pembaca manifest

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : null);
const angka = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const teks = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const bulat = (k: KotakSeni): boolean => Number.isInteger(k.x) && Number.isInteger(k.y) && Number.isInteger(k.w) && Number.isInteger(k.h);
const arahSah = (v: unknown): ArahTokoh | null => (v === 'kiri' || v === 'kanan' ? v : null);

/** [x, y, w, h] | {x, y, w, h} -> kotak (w, h > 0), atau null. */
function keKotak(v: unknown): KotakSeni | null {
  let k: KotakSeni | null = null;
  if (Array.isArray(v) && v.length >= 4 && v.slice(0, 4).every(angka)) k = { x: v[0], y: v[1], w: v[2], h: v[3] };
  else {
    const o = obj(v);
    if (o && angka(o.x) && angka(o.y) && angka(o.w) && angka(o.h)) k = { x: o.x, y: o.y, w: o.w, h: o.h };
  }
  return k && k.w > 0 && k.h > 0 ? k : null;
}
/** [x, y] | {x, y} -> titik, atau null. */
function keTitik(v: unknown): Titik | null {
  if (Array.isArray(v) && v.length >= 2 && angka(v[0]) && angka(v[1])) return { x: v[0], y: v[1] };
  const o = obj(v);
  return o && angka(o.x) && angka(o.y) ? { x: o.x, y: o.y } : null;
}
/** [w, h] | {w, h} -> ukuran bulat positif, atau null. */
function keUkuran(v: unknown): { w: number; h: number } | null {
  const a = Array.isArray(v) ? { w: v[0], h: v[1] } : obj(v) ? { w: obj(v)!.w, h: obj(v)!.h } : null;
  return a && angka(a.w) && angka(a.h) && Number.isInteger(a.w) && Number.isInteger(a.h) && a.w > 0 && a.h > 0 ? { w: a.w, h: a.h } : null;
}
const kotakDalam = (k: KotakSeni, luar: { w: number; h: number }, x0 = 0, y0 = 0): boolean =>
  k.x >= x0 && k.y >= y0 && k.x + k.w <= x0 + luar.w && k.y + k.h <= y0 + luar.h;

/**
 * Membaca manifest tokoh piksel (bentuk bersama Miss Raksa & Bu Rina, PIKSEL.md bagian 3). null = tidak bisa dipakai
 * (bukan objek, satuan != 4, tanpa ukuran atlas, atau tanpa frame sah); alasannya ditambahkan ke `catatan`.
 * Kecacatan kecil (satu potongan/frame/pose) dilewati dan dicatat di `hasil.catatan` (juga ditambahkan ke `catatan`).
 */
export function bacaManifestTokoh(json: unknown, catatan: string[] = []): ManifestTokoh | null {
  const m = obj(json);
  if (!m) { catatan.push('manifest bukan objek'); return null; }
  const satuan = angka(m.piksel) ? m.piksel : angka(m.satuan) ? m.satuan : SATUAN;
  if (satuan !== SATUAN) { catatan.push(`satuan ${satuan} != ${SATUAN}: manifest tidak dipakai`); return null; }
  const atlas = keUkuran(m.ukuranAtlas ?? m.atlas);
  if (!atlas) { catatan.push('ukuranAtlas tidak sah'); return null; }
  const cat: string[] = [];

  const frame: Record<string, FrameTokoh> = {};
  for (const [id, v] of Object.entries(obj(m.frame) ?? {})) {
    const f = bacaFrame(id, v, atlas, cat);
    if (f) frame[id] = f;
  }
  if (!Object.keys(frame).length) { catatan.push(...cat, 'tanpa frame sah'); return null; }

  // ekspresi seni
  const daftarE = Array.isArray(m.ekspresi) ? m.ekspresi.filter((x): x is string => typeof x === 'string' && !!x) : [];
  const ekspresi = daftarE.length ? daftarE : [...new Set(Object.values(frame).flatMap((f) => Object.keys(f.ekspresi)))];
  const ekspresiDari: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj(m.ekspresiDari) ?? {})) {
    if (typeof v === 'string' && ekspresi.includes(v)) ekspresiDari[k] = v;
    else cat.push(`ekspresiDari.${k}: ${String(v)} bukan ekspresi manifest`);
  }

  // pose
  const pose: Record<string, PoseTokoh> = {};
  const turunan = new Set<string>();
  const poseO = obj(m.pose);
  for (const [p, v] of Object.entries(poseO ?? {})) {
    const hasil: PoseTokoh = { tubuhEkspresi: {} };
    const pasang = (arah: ArahTokoh, idF: unknown) => {
      const s = teks(idF);
      if (!s) return;
      if (!frame[s]) { cat.push(`pose ${p}.${arah}: frame ${s} tidak ada`); return; }
      if (frame[s]!.hadap !== arah) cat.push(`pose ${p}.${arah}: frame ${s} berhadap ${frame[s]!.hadap}`);
      hasil[arah] = s;
    };
    const o = obj(v);
    if (typeof v === 'string') { if (frame[v]) pasang(frame[v]!.hadap, v); else cat.push(`pose ${p}: frame ${v} tidak ada`); }
    else if (o) {
      pasang('kiri', o.kiri);
      pasang('kanan', o.kanan);
      const b = arahSah(o.bawaan);
      if (b && hasil[b]) hasil.bawaan = b;
      const k = obj(o.kartu);
      const ka = k ? arahSah(k.arah) : null;
      if (k && ka && hasil[ka]) hasil.kartu = { arah: ka, ...(k.varian === 'bawah' ? { varian: 'bawah' as const } : {}) };
      for (const [e, idF] of Object.entries(obj(o.tubuhEkspresi) ?? {})) {
        if (typeof idF === 'string' && frame[idF]) hasil.tubuhEkspresi[e] = idF;
        else cat.push(`pose ${p}.tubuhEkspresi.${e}: frame ${String(idF)} tidak ada`);
      }
    }
    if (hasil.kiri || hasil.kanan) pose[p] = hasil;
    else cat.push(`pose ${p}: tanpa frame sah, dilewati`);
  }
  if (!Object.keys(pose).length) {
    // Tanpa bagian pose (atau semuanya cacat): turunkan dari id frame `<pose>-<arah>` / `<pose>` (arah = hadap frame).
    if (poseO) cat.push('pose diturunkan dari id frame');
    for (const f of Object.values(frame)) {
      const cocok = /^(.*)-(kiri|kanan)$/.exec(f.id);
      const p = cocok ? cocok[1]! : f.id;
      const arah = cocok ? (cocok[2] as ArahTokoh) : f.hadap;
      const q = (pose[p] ??= { tubuhEkspresi: {} });
      if (!q[arah]) q[arah] = f.id;
    }
  } else {
    // Bingkai antara `duduk-turun` yang tidak disebut bagian pose tetapi frame-nya ada (`duduk-turun-<arah>` /
    // `duduk-turun`, mis. frame Miss Raksa yang baru ditambahkan): diturunkan dari id frame, bukan jatuh ke `berdiri`.
    for (const f of Object.values(frame)) {
      const cocok = /^(.*)-(kiri|kanan)$/.exec(f.id);
      const p = cocok ? cocok[1]! : f.id;
      if (!POSE_DARI_FRAME.has(p) || (pose[p] && !turunan.has(p))) continue;
      const arah = cocok ? (cocok[2] as ArahTokoh) : f.hadap;
      if (!pose[p]) { pose[p] = { tubuhEkspresi: {} }; turunan.add(p); cat.push(`pose ${p} diturunkan dari frame ${f.id}`); }
      if (!pose[p]![arah]) pose[p]![arah] = f.id;
    }
  }

  // pandang (Miss)
  const pandang: ManifestTokoh['pandang'] = {};
  for (const [k, v] of Object.entries(obj(m.pandang) ?? {})) {
    if (k !== 'lawan' && k !== 'pemain' && k !== 'bawah' && k !== 'depan') continue;
    const o = obj(v);
    if (!o) continue;
    const arah = arahSah(o.arah);
    pandang[k] = { ...(arah ? { arah } : {}), ...(o.varian === 'bawah' ? { varian: 'bawah' as const } : {}) };
  }

  // potret & telepon
  const potretO = obj(m.potret);
  const frameP = teks(potretO?.frame);
  const bacaDaftar = (v: unknown, nama: string): JendelaManifest[] => {
    const hasil: JendelaManifest[] = [];
    for (const [k, j] of Object.entries(obj(v) ?? {})) {
      const x = bacaJendela(k, j, frameP, frame, `potret.${nama}.${k}`, cat);
      if (x) hasil.push(x);
    }
    return hasil.sort((a, b) => a.tampil - b.tampil || a.kunci.localeCompare(b.kunci));
  };
  const potret = { frame: frameP && frame[frameP] ? frameP : null, jendela: bacaDaftar(potretO?.jendela, 'jendela'), dekat: bacaDaftar(potretO?.dekat, 'dekat') };
  const telO = obj(m.telepon);
  const telepon = telO && telO.jendela ? bacaJendela('telepon', telO.jendela, teks(telO.frame), frame, 'telepon.jendela', cat) : null;

  catatan.push(...cat);
  return {
    tokoh: teks(m.tokoh) ?? '',
    gambar: teks(m.gambar) ?? '',
    atlas,
    ekspresi,
    ekspresiDari,
    frame,
    pose,
    pandang,
    potret,
    telepon,
    catatan: cat,
  };
}

function bacaJendela(kunci: string, v: unknown, frameBawaan: string | null, frame: Record<string, FrameTokoh>, label: string, cat: string[]): JendelaManifest | null {
  const o = obj(v);
  if (!o) return null;
  const f = teks(o.frame) ?? frameBawaan;
  const { x, y, sisi } = o;
  if (!f || !frame[f]) { cat.push(`${label}: frame ${String(f)} tidak ada`); return null; }
  if (!angka(x) || !angka(y) || !angka(sisi) || !Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(sisi) || sisi <= 0) {
    cat.push(`${label}: x/y/sisi tidak sah`);
    return null;
  }
  const skala = angka(o.skala) && Number.isInteger(o.skala) && o.skala >= 1 ? o.skala : 1;
  const tampil = angka(o.tampil) && o.tampil === sisi * skala ? o.tampil : sisi * skala;
  if (angka(o.tampil) && o.tampil !== sisi * skala) cat.push(`${label}: tampil ${o.tampil} != sisi x skala, dipakai ${tampil}`);
  return { kunci, frame: f, x, y, sisi, skala, tampil };
}

function bacaFrame(id: string, v: unknown, atlas: { w: number; h: number }, cat: string[]): FrameTokoh | null {
  const f = obj(v);
  if (!f) return null;
  const rect = keKotak(f.rect);
  if (!rect || !bulat(rect) || !kotakDalam(rect, atlas)) { cat.push(`frame ${id}: rect tidak sah / di luar atlas, dilewati`); return null; }
  const pinggulM = keTitik(f.pinggul);
  const kakiM = keTitik(f.kaki);
  const jenisJangkar: JenisJangkar = f.jenisJangkar === 'kaki' || f.jenisJangkar === 'pinggul' ? f.jenisJangkar : pinggulM ? 'pinggul' : 'kaki';
  const jangkar = keTitik(f.jangkar) ?? (jenisJangkar === 'pinggul' ? pinggulM : kakiM);
  if (!jangkar) { cat.push(`frame ${id}: tanpa jangkar, dilewati`); return null; }
  let hadap = arahSah(f.hadap);
  if (!hadap) { cat.push(`frame ${id}: hadap tidak sah, dianggap kiri`); hadap = 'kiri'; }
  const kepalaTinggi = angka(f.kepalaTinggi) && f.kepalaTinggi > 0 ? f.kepalaTinggi : KEPALA_TINGGI_BAWAAN;
  let kepala = keTitik(f.kepala);
  if (!kepala) { cat.push(`frame ${id}: tanpa kepala, dianggap tengah atas`); kepala = { x: rect.w / 2, y: kepalaTinggi / 2 }; }

  const tangan: Record<string, Titik> = {};
  for (const [k, t] of Object.entries(obj(f.tangan) ?? {})) {
    const p = keTitik(t);
    if (p) tangan[k] = p;
  }
  const ujung = keTitik(f.ujungTelunjuk);
  if (ujung && !tangan.telunjuk) tangan.telunjuk = ujung;

  // wajah & ekspresi
  let wajah: WajahFrame | null = null;
  const ekspresi: Record<string, VarianWajah> = {};
  const wO = obj(f.wajah);
  const kotak = keKotak(wO?.kotak);
  const mata = keKotak(wO?.mata);
  const mulut = keKotak(wO?.mulut);
  const ukuranF = { w: rect.w, h: rect.h };
  if (kotak && mata && mulut && [kotak, mata, mulut].every((k) => bulat(k) && kotakDalam(k, ukuranF))) {
    wajah = { kotak, mata, mulut };
    for (const [e, x] of Object.entries(obj(f.ekspresi) ?? {})) {
      const o = obj(x);
      if (!o) continue;
      const hasil: VarianWajah = {};
      for (const [varian, target] of [['dasar', kotak], ['kedip', mata], ['bawah', mata], ['bicara', mulut]] as const) {
        const r = keKotak(o[varian]);
        if (!r) { if (o[varian] !== undefined) cat.push(`frame ${id}.${e}.${varian}: kotak tidak sah`); continue; }
        if (!bulat(r) || !kotakDalam(r, atlas)) { cat.push(`frame ${id}.${e}.${varian}: di luar atlas, dilewati`); continue; }
        if (r.w !== target.w || r.h !== target.h) { cat.push(`frame ${id}.${e}.${varian}: ukuran ${r.w}x${r.h} != kotak ${target.w}x${target.h}, dilewati`); continue; }
        hasil[varian] = r;
      }
      if (Object.keys(hasil).length) ekspresi[e] = hasil;
    }
  } else if (f.wajah !== undefined) cat.push(`frame ${id}: kotak wajah tidak sah, tubuh saja`);

  // meja (Miss duduk)
  const garisMeja = angka(f.garisMeja) ? f.garisMeja : undefined;
  let diAtasMeja: KotakSeni[] | undefined;
  if (Array.isArray(f.diAtasMeja)) {
    const tunggal = keKotak(f.diAtasMeja);
    const daftar = tunggal && f.diAtasMeja.length === 4 && f.diAtasMeja.every(angka) ? [tunggal] : f.diAtasMeja.map(keKotak).filter((k): k is KotakSeni => !!k);
    diAtasMeja = daftar.filter((k) => bulat(k));
    if (diAtasMeja.length !== f.diAtasMeja.length && !tunggal) cat.push(`frame ${id}: sebagian diAtasMeja tidak sah`);
  } else {
    const k = keKotak(f.diAtasMeja);
    if (k && bulat(k)) diAtasMeja = [k];
  }

  const kaki = kakiM ?? (jenisJangkar === 'kaki' ? jangkar : null);
  const pinggul = pinggulM ?? (jenisJangkar === 'pinggul' ? jangkar : null);
  return {
    id,
    rect,
    hadap,
    jenisJangkar,
    jangkar,
    ...(kaki ? { kaki: { ...kaki } } : {}),
    ...(pinggul ? { pinggul: { ...pinggul } } : {}),
    kepala,
    kepalaTinggi,
    tangan,
    wajah,
    ekspresi,
    ...(garisMeja !== undefined ? { garisMeja } : {}),
    ...(diAtasMeja ? { diAtasMeja } : {}),
    kunciTergambar: f.kunciTergambar === true,
    teleponTergambar: f.teleponTergambar === true,
  };
}

// ------------------------------------------------------------------ susun tokoh

export interface OpsiSusun {
  pose: PoseMentor | PoseNasabah;
  /** Arah frame (bawaan: pose.bawaan manifest / ARAH_BAWAAN). */
  hadap?: ArahTokoh;
  /** Ekspresi CERITA (tipe.ts); nama wajah seni manifest juga diterima. */
  ekspresi: Ekspresi;
  mata?: MataTokoh;
  mulut?: MulutTokoh;
}

/** Hasil susun satu tokoh: satuan piksel seni relatif pojok kiri-atas frame (rect trim). */
export interface SusunanTokoh {
  tokoh: string;
  /** URL atlas (diisi penyusun di index.ts; '' bila disusun tanpa URL). */
  url: string;
  atlas: { w: number; h: number };
  frame: string;
  /** Pose manifest yang dipakai (bisa berbeda dari yang diminta: lihat `cadangan`). */
  pose: string;
  /** Wajah seni yang dipakai ('' = tubuh saja, wajah netral terpanggang). */
  ekspresi: string;
  /** Mata & mulut yang BENAR-BENAR digambar (varian yang tidak ada -> buka / tutup). */
  mata: MataTokoh;
  mulut: MulutTokoh;
  hadap: ArahTokoh;
  /** Potongan tubuh di atlas. */
  rect: KotakSeni;
  ukuran: { w: number; h: number };
  /** Urutan gambar: tubuh, wajah, mata?, mulut?. */
  lapisan: LapisanSusun[];
  jenisJangkar: JenisJangkar;
  jangkar: Titik;
  kaki?: Titik;
  pinggul?: Titik;
  kepala: Titik;
  kepalaTinggi: number;
  /** Titik tangan per SISI LAYAR (x < jangkar.x = kiri), untuk kamera & prop panggung. */
  tangan: { kiri?: Titik; kanan?: Titik };
  /** Titik tangan bernama dari manifest (telapak, telunjuk, telepon, kunci). */
  titikTangan: Record<string, Titik>;
  wajah: WajahFrame | null;
  /** y tepi jauh meja di frame (Miss duduk). */
  garisMeja?: number;
  /** Kotak yang digambar lagi di atas meja (gambar & transform sama), piksel seni. */
  diAtasMeja?: KotakSeni[];
  kunciTergambar: boolean;
  teleponTergambar: boolean;
  /** Cadangan yang dipakai (kosong = persis seperti diminta). */
  cadangan: string[];
}

/** Wajah seni untuk ekspresi cerita (aturan 1). */
export function wajahSeni(m: ManifestTokoh, e: string, cadangan: string[] = []): string {
  const dari = m.ekspresiDari[e];
  if (dari) return dari;
  if (m.ekspresi.includes(e)) return e;
  const bawaan = EKSPRESI_BAWAAN[e as Ekspresi];
  if (bawaan && m.ekspresi.includes(bawaan)) return bawaan;
  cadangan.push(`ekspresi ${String(e)} tidak dikenal: netral`);
  return 'netral';
}

function jenisPoseManifest(m: ManifestTokoh, p: string): JenisJangkar | null {
  const P = m.pose[p];
  const f = P ? m.frame[(P.kiri ?? P.kanan)!] : undefined;
  return f ? f.jenisJangkar : null;
}

/** Pose manifest untuk pose cerita (aturan 3). */
function pilihPose(m: ManifestTokoh, pose: string, cad: string[]): string {
  if (m.pose[pose]) return pose;
  for (const p of POSE_CADANGAN[pose] ?? []) {
    if (m.pose[p]) { cad.push(`pose ${pose} tidak ada: ${p}`); return p; }
  }
  const semua = Object.keys(m.pose);
  const jenis = jenisPose(pose);
  const sama = semua.find((p) => jenisPoseManifest(m, p) === jenis);
  const p = sama ?? semua[0]!;
  cad.push(`pose ${pose} tidak ada: ${p}`);
  return p;
}

/** Lapisan satu frame (tubuh -> wajah -> mata -> mulut) dengan cadangan aturan 1 & 4. */
function lapisanFrame(f: FrameTokoh, e: string, mata: MataTokoh, mulut: MulutTokoh, cad: string[]): { lapisan: LapisanSusun[]; ekspresi: string; mata: MataTokoh; mulut: MulutTokoh } {
  const lapisan: LapisanSusun[] = [{ jenis: 'tubuh', sumber: { ...f.rect }, x: 0, y: 0 }];
  const tanpaWajah = (alasan: string) => {
    cad.push(`${f.id}: ${alasan}, tubuh saja`);
    return { lapisan, ekspresi: '', mata: 'buka' as const, mulut: 'tutup' as const };
  };
  if (!f.wajah) return tanpaWajah('tanpa lapisan wajah');
  let ePakai = e;
  let v = f.ekspresi[e];
  if (!v?.dasar) {
    if (e !== 'netral') cad.push(`${f.id}: wajah ${e} tidak ada, netral`);
    ePakai = 'netral';
    v = f.ekspresi.netral;
  }
  if (!v?.dasar) return tanpaWajah('wajah netral tidak ada');
  const W = f.wajah;
  lapisan.push({ jenis: 'wajah', sumber: { ...v.dasar }, x: W.kotak.x, y: W.kotak.y });
  let mataPakai: MataTokoh = 'buka';
  if (mata === 'tutup' || mata === 'bawah') {
    const r = mata === 'tutup' ? v.kedip : v.bawah;
    if (r) { lapisan.push({ jenis: 'mata', sumber: { ...r }, x: W.mata.x, y: W.mata.y }); mataPakai = mata; }
    else cad.push(`${f.id}: ${ePakai} tanpa varian ${mata === 'tutup' ? 'kedip' : 'bawah'}, mata terbuka`);
  }
  let mulutPakai: MulutTokoh = 'tutup';
  if (mulut === 'buka') {
    if (v.bicara) { lapisan.push({ jenis: 'mulut', sumber: { ...v.bicara }, x: W.mulut.x, y: W.mulut.y }); mulutPakai = 'buka'; }
    else cad.push(`${f.id}: ${ePakai} tanpa varian bicara, mulut tertutup`);
  }
  return { lapisan, ekspresi: ePakai, mata: mataPakai, mulut: mulutPakai };
}

const URUT_TANGAN = ['telapak', 'telunjuk', 'kartu', 'kunci', 'telepon'];
const peringkat = (n: string) => { const i = URUT_TANGAN.indexOf(n); return i < 0 ? URUT_TANGAN.length : i; };

/** Titik tangan per sisi layar (x < jangkar.x = kiri); dua titik di sisi sama -> urutan URUT_TANGAN. */
function tanganLayar(f: FrameTokoh): { kiri?: Titik; kanan?: Titik } {
  const hasil: { kiri?: Titik; kanan?: Titik } = {};
  const nama = Object.keys(f.tangan).sort((a, b) => peringkat(a) - peringkat(b) || a.localeCompare(b));
  for (const n of nama) {
    const p = f.tangan[n]!;
    const sisi = p.x < f.jangkar.x ? 'kiri' : 'kanan';
    if (!hasil[sisi]) hasil[sisi] = { ...p };
  }
  return hasil;
}

const salinTitik = (p: Titik): Titik => ({ x: p.x, y: p.y });

/** Susunan satu FRAME tertentu (tanpa pemetaan pose); dipakai susunDari, potret, dan alat tinjau. */
export function susunFrame(
  m: ManifestTokoh,
  frameId: string,
  opsi: { ekspresi: string; mata?: MataTokoh; mulut?: MulutTokoh; pose?: string; url?: string; cadangan?: string[] },
): SusunanTokoh {
  const cad = opsi.cadangan ?? [];
  let f = m.frame[frameId];
  if (!f) {
    const lain = Object.keys(m.frame)[0]!;
    cad.push(`frame ${frameId} tidak ada: ${lain}`);
    f = m.frame[lain]!;
  }
  const eSeni = m.ekspresi.includes(opsi.ekspresi) ? opsi.ekspresi : wajahSeni(m, opsi.ekspresi, cad);
  const l = lapisanFrame(f, eSeni, opsi.mata ?? 'buka', opsi.mulut ?? 'tutup', cad);
  const titikTangan: Record<string, Titik> = {};
  for (const [k, p] of Object.entries(f.tangan)) titikTangan[k] = salinTitik(p);
  return {
    tokoh: m.tokoh,
    url: opsi.url ?? '',
    atlas: { ...m.atlas },
    frame: f.id,
    pose: opsi.pose ?? f.id,
    ekspresi: l.ekspresi,
    mata: l.mata,
    mulut: l.mulut,
    hadap: f.hadap,
    rect: { ...f.rect },
    ukuran: { w: f.rect.w, h: f.rect.h },
    lapisan: l.lapisan,
    jenisJangkar: f.jenisJangkar,
    jangkar: salinTitik(f.jangkar),
    ...(f.kaki ? { kaki: salinTitik(f.kaki) } : {}),
    ...(f.pinggul ? { pinggul: salinTitik(f.pinggul) } : {}),
    kepala: salinTitik(f.kepala),
    kepalaTinggi: f.kepalaTinggi,
    tangan: tanganLayar(f),
    titikTangan,
    wajah: f.wajah ? { kotak: { ...f.wajah.kotak }, mata: { ...f.wajah.mata }, mulut: { ...f.wajah.mulut } } : null,
    ...(f.garisMeja !== undefined ? { garisMeja: f.garisMeja } : {}),
    ...(f.diAtasMeja ? { diAtasMeja: f.diAtasMeja.map((k) => ({ ...k })) } : {}),
    kunciTergambar: f.kunciTergambar,
    teleponTergambar: f.teleponTergambar,
    cadangan: cad,
  };
}

/**
 * Susun satu tokoh untuk pose + arah + ekspresi cerita + varian mata/mulut (aturan pemetaan & cadangan: kepala berkas).
 * Tidak pernah melempar untuk pose/ekspresi cerita yang sah; nama tak dikenal pun jatuh ke cadangan.
 */
export function susunDari(m: ManifestTokoh, opsi: OpsiSusun, url = ''): SusunanTokoh {
  const cad: string[] = [];
  const diminta = String(opsi.pose);
  const eCerita = String(opsi.ekspresi);
  const eSeni = wajahSeni(m, eCerita, cad);
  const pose = pilihPose(m, diminta, cad);
  const P = m.pose[pose]!;
  const arahMinta = opsi.hadap ?? m.pose[diminta]?.bawaan ?? ARAH_BAWAAN[diminta] ?? P.bawaan ?? 'kiri';
  let arah: ArahTokoh = arahMinta;
  if (!P[arah]) {
    arah = arah === 'kiri' ? 'kanan' : 'kiri';
    cad.push(`pose ${pose} tanpa arah ${arahMinta}: ${arah}`);
  }
  let frame = P[arah]!;
  const tubuh = P.tubuhEkspresi[eCerita] ?? P.tubuhEkspresi[eSeni];
  if (tubuh) {
    if (m.frame[tubuh]?.hadap === arah) frame = tubuh;
    else cad.push(`tubuh ${tubuh} (${eCerita}) tidak berhadap ${arah}: ${frame}`);
  }
  return susunFrame(m, frame, { ekspresi: eSeni, mata: opsi.mata, mulut: opsi.mulut, pose, url, cadangan: cad });
}

/** Opsi tokoh gaya cerita/panggung (ui/panggung/dunia.ts OpsiTokoh + bicara/kedip). */
export interface OpsiCerita {
  pose: PoseMentor | PoseNasabah;
  ekspresi: Ekspresi;
  pandang?: ArahPandang;
  hadap?: ArahTokoh;
  bicara?: boolean;
  kedip?: boolean;
}

/**
 * Opsi cerita -> opsi susun: hadap dari opsi.hadap, selain itu dari `pandang` (manifest.pandang, bawaan
 * PANDANG_BAWAAN): Miss lawan->kanan, pemain/depan->kiri; `bawah` -> mata bawah dengan arah pose (duduk-tunjuk:
 * pose.kartu = kanan + bawah). Pandang kosong = pandang bawaan pose (sama dengan generator SVG). kedip menang atas
 * bawah (mata tertutup); bicara -> mulut buka.
 */
export function opsiDariCerita(id: IdTokohPiksel, m: ManifestTokoh, o: OpsiCerita): OpsiSusun {
  const pose = String(o.pose);
  const pandang = o.pandang ?? pandangBawaan(id, pose);
  const peta = Object.keys(m.pandang).length ? m.pandang : PANDANG_BAWAAN[id];
  const aturan = peta[pandang] ?? {};
  const P = m.pose[pose];
  let hadap = o.hadap;
  let mata: MataTokoh = 'buka';
  if (aturan.varian === 'bawah' || pandang === 'bawah') {
    mata = 'bawah';
    hadap ??= P?.kartu?.arah ?? aturan.arah;
  } else hadap ??= aturan.arah;
  if (o.kedip) mata = 'tutup';
  return { pose: o.pose, ekspresi: o.ekspresi, ...(hadap ? { hadap } : {}), mata, mulut: o.bicara ? 'buka' : 'tutup' };
}

// ------------------------------------------------------------------ panggung (GambarTokoh raster)

/** GambarTokoh raster panggung (ui/panggung/piksel.ts TambahanTokohPiksel). */
export type GambarTokohPiksel = GambarTokoh & TambahanTokohPiksel;

/**
 * Susunan -> GambarTokoh raster panggung: `svg: ''`; w, h, jangkar, kepala, tangan dalam satuan kanvas (= piksel seni
 * x SATUAN); `piksel` = potongan tubuh; `tempelan` = wajah/mata/mulut (piksel seni relatif pojok potongan tubuh,
 * urutan gambar); `diAtasMejaPiksel` (satuan kanvas) bila frame duduk di balik meja; `kepalaTinggi` satuan kanvas.
 */
export function keGambarTokoh(s: SusunanTokoh, url: string = s.url): GambarTokohPiksel {
  const K = SATUAN;
  const titik = (p: Titik): Titik => ({ x: p.x * K, y: p.y * K });
  const potongan = (k: KotakSeni): PotonganPiksel => ({ url, atlas: { ...s.atlas }, sumber: { ...k } });
  const [tubuh, ...atas] = s.lapisan;
  const tangan = { ...(s.tangan.kiri ? { kiri: titik(s.tangan.kiri) } : {}), ...(s.tangan.kanan ? { kanan: titik(s.tangan.kanan) } : {}) };
  const g: GambarTokohPiksel = {
    svg: '',
    w: s.ukuran.w * K,
    h: s.ukuran.h * K,
    jangkar: titik(s.jangkar),
    kepala: titik(s.kepala),
    ...(tangan.kiri || tangan.kanan ? { tangan } : {}),
    piksel: potongan(tubuh!.sumber),
    kepalaTinggi: s.kepalaTinggi * K,
  };
  if (atas.length) g.tempelan = atas.map((l) => ({ p: potongan(l.sumber), x: l.x - tubuh!.x, y: l.y - tubuh!.y }));
  if (s.diAtasMeja?.length) g.diAtasMejaPiksel = s.diAtasMeja.map((k) => ({ x: k.x * K, y: k.y * K, w: k.w * K, h: k.h * K }));
  return g;
}

// ------------------------------------------------------------------ potret & sisipan telepon

export interface OpsiPotret {
  /** Jendela `dekat` (wajah x2/x3) bila ada; manifest menyarankan 52-96 px dekat, 32-44 px biasa (x1). */
  dekat?: boolean;
  mata?: MataTokoh;
  mulut?: MulutTokoh;
}

/** Potret / sisipan: lapisan frame + jendela persegi (piksel seni) + skala BULAT. */
export interface PotretTokoh {
  tokoh: string;
  url: string;
  atlas: { w: number; h: number };
  frame: string;
  ekspresi: string;
  mata: MataTokoh;
  mulut: MulutTokoh;
  hadap: ArahTokoh;
  lapisan: LapisanSusun[];
  /** Jendela (piksel seni, relatif frame, bulat). Digambar pada `skala` = `tampil` px. */
  jendela: { x: number; y: number; sisi: number };
  /** Piksel tampil per piksel seni (bulat >= 1). */
  skala: number;
  /** sisi x skala (>= ukuranPx: lingkaran selalu penuh). */
  tampil: number;
  /** Ukuran diminta (px, dibulatkan >= 1). */
  ukuranPx: number;
  /** tampil - ukuranPx (0 = pas); dipotong rata tengah ke piksel tampil bulat oleh `viewBox`. */
  potong: number;
  /** Kotak tampil PAS ukuranPx x ukuranPx pada skala bulat (viewBox potret; tepi piksel tetap di piksel bulat). */
  viewBox: KotakSeni;
  /** Asal jendela: 'jendela.44', 'dekat.64', 'turunan jendela.32', 'telepon', 'turunan telepon', 'kepala'. */
  asal: string;
  cadangan: string[];
}

interface Rentang { a: number; b: number }

/**
 * Posisi satu sumbu jendela turunan: pusat jendela acuan (atau tepi atas acuan bila `atas`), dijepit supaya kotak wajah
 * (dan seluruh kepala, bila muat) yang terlihat di jendela acuan tetap terlihat.
 */
function posisiSumbu(awal: number, sisi: number, acuan: Rentang, wajah: Rentang | null, kepala: Rentang | null, atas: boolean): number {
  const dalam = (r: Rentang | null) => !!r && acuan.a <= r.a && acuan.b >= r.b;
  const w = dalam(wajah) ? wajah : null;
  const k = dalam(kepala) ? kepala : null;
  const jepit = (p: number, r: Rentang) => Math.min(Math.max(p, r.b - sisi), r.a);
  const p0 = atas ? acuan.a : Math.round(awal);
  if (k && sisi >= k.b - k.a) return w ? Math.min(Math.max(jepit(p0, k), w.b - sisi), w.a) : jepit(p0, k);
  if (w && sisi >= w.b - w.a) return jepit(k ? Math.round((k.a + k.b) / 2 - sisi / 2) : p0, w);
  if (w) return Math.round((w.a + w.b) / 2 - sisi / 2);
  return p0;
}

/**
 * Jendela untuk ukuran tampil `u` px dari daftar jendela manifest (satu keluarga): jendela yang tampilnya = u dipakai
 * apa adanya; selain itu jendela TURUNAN dari jendela terdekat (selisih tampil terkecil; seri -> yang lebih besar):
 * skala bulat s dan sisi = ceil(u / s) sehingga sisi x s >= u (lingkaran penuh), dipilih s yang membuat sisi paling
 * dekat dengan sisi acuan (log), utamakan sisi x s = u, dan hanya s yang masih memuat kotak wajah yang terlihat di
 * acuan. Posisi: pusat acuan (telepon: tepi atas acuan), dijepit ke wajah/kepala (posisiSumbu).
 */
function pilihJendela(daftar: readonly JendelaManifest[], u: number, m: ManifestTokoh, keluarga: string, atas: boolean): { j: JendelaManifest; x: number; y: number; sisi: number; skala: number; asal: string } {
  const tepat = daftar.find((j) => j.tampil === u);
  if (tepat) return { j: tepat, x: tepat.x, y: tepat.y, sisi: tepat.sisi, skala: tepat.skala, asal: keluarga === 'telepon' ? 'telepon' : `${keluarga}.${tepat.kunci}` };
  const acuan = [...daftar].sort((a, b) => Math.abs(a.tampil - u) - Math.abs(b.tampil - u) || b.tampil - a.tampil)[0]!;
  const f = m.frame[acuan.frame]!;
  const W = f.wajah?.kotak ?? null;
  const wajahX = W ? { a: W.x, b: W.x + W.w } : null;
  const wajahY = W ? { a: W.y, b: W.y + W.h } : null;
  const kepalaY = { a: Math.floor(f.kepala.y - f.kepalaTinggi / 2), b: Math.ceil(f.kepala.y + f.kepalaTinggi / 2) };
  const acuanX = { a: acuan.x, b: acuan.x + acuan.sisi };
  const acuanY = { a: acuan.y, b: acuan.y + acuan.sisi };
  const wajib = (r: Rentang | null, ac: Rentang) => (r && ac.a <= r.a && ac.b >= r.b ? r.b - r.a : 0);
  const minSisi = Math.max(wajib(wajahX, acuanX), wajib(wajahY, acuanY), 1);
  let pilih: { s: number; sisi: number; skor: number } | null = null;
  const maks = Math.min(256, Math.max(1, Math.ceil(u / 4)));
  for (let s = 1; s <= maks; s++) {
    const sisi = Math.ceil(u / s);
    if (sisi < minSisi) break;
    const skor = Math.abs(Math.log(sisi / acuan.sisi)) + (sisi * s === u ? 0 : 0.25);
    if (!pilih || skor < pilih.skor - 1e-9) pilih = { s, sisi, skor };
  }
  const s = pilih?.s ?? 1;
  const sisi = pilih?.sisi ?? u;
  const x = posisiSumbu(acuan.x + acuan.sisi / 2 - sisi / 2, sisi, acuanX, wajahX, wajahX, false);
  const y = posisiSumbu(acuan.y + acuan.sisi / 2 - sisi / 2, sisi, acuanY, wajahY, kepalaY, atas);
  return { j: acuan, x, y, sisi, skala: s, asal: keluarga === 'telepon' ? 'turunan telepon' : `turunan ${keluarga}.${acuan.kunci}` };
}

const ukuranBulat = (u: number): number => (Number.isFinite(u) && u >= 1 ? Math.round(u) : 1);

function potretDariDaftar(m: ManifestTokoh, daftar: readonly JendelaManifest[], keluarga: string, atas: boolean, e: string, u0: number, opsi: OpsiPotret, url: string, cad: string[]): PotretTokoh {
  const u = ukuranBulat(u0);
  let pilih: { frame: string; x: number; y: number; sisi: number; skala: number; asal: string };
  if (daftar.length) {
    const p = pilihJendela(daftar, u, m, keluarga, atas);
    pilih = { frame: p.j.frame, x: p.x, y: p.y, sisi: p.sisi, skala: p.skala, asal: p.asal };
  } else {
    // Tanpa jendela manifest: persegi di sekitar kepala frame potret / frame pertama, skala 1.
    const idF = m.potret.frame ?? Object.keys(m.frame)[0]!;
    const f = m.frame[idF]!;
    cad.push(`tanpa jendela ${keluarga}: jendela kepala frame ${idF}`);
    pilih = { frame: idF, x: Math.round(f.kepala.x - u / 2), y: Math.round(f.kepala.y - u / 2), sisi: u, skala: 1, asal: 'kepala' };
  }
  const s = susunFrame(m, pilih.frame, { ekspresi: wajahSeni(m, e, cad), mata: opsi.mata, mulut: opsi.mulut, url, cadangan: cad });
  const tampil = pilih.sisi * pilih.skala;
  const potong = tampil - u;
  const geser = Math.floor(potong / 2) / pilih.skala;
  return {
    tokoh: s.tokoh,
    url,
    atlas: s.atlas,
    frame: s.frame,
    ekspresi: s.ekspresi,
    mata: s.mata,
    mulut: s.mulut,
    hadap: s.hadap,
    lapisan: s.lapisan,
    jendela: { x: pilih.x, y: pilih.y, sisi: pilih.sisi },
    skala: pilih.skala,
    tampil,
    ukuranPx: u,
    potong,
    viewBox: { x: pilih.x + geser, y: pilih.y + geser, w: u / pilih.skala, h: u / pilih.skala },
    asal: pilih.asal,
    cadangan: cad,
  };
}

/**
 * Potret bulat `ukuranPx` px (px tampil; beri px PERANGKAT bila ingin bulat di layar HiDPI) dari jendela potret
 * manifest (frame potret + wajah ekspresi; tubuh TIDAK mengikuti tubuhEkspresi supaya kepala tetap di jendela).
 * Ukuran yang ada di manifest (32/44/52/64/96, dekat 52/64/96) dipakai persis; ukuran lain (mis. 28, 36, 48, 56)
 * diturunkan dengan skala bulat (lihat pilihJendela).
 */
export function potretDari(m: ManifestTokoh, ekspresi: Ekspresi, ukuranPx: number, opsi: OpsiPotret = {}, url = ''): PotretTokoh {
  const cad: string[] = [];
  let keluarga: 'jendela' | 'dekat' = opsi.dekat ? 'dekat' : 'jendela';
  if (keluarga === 'dekat' && !m.potret.dekat.length) { cad.push('tanpa jendela dekat: jendela biasa'); keluarga = 'jendela'; }
  return potretDariDaftar(m, m.potret[keluarga], keluarga, false, String(ekspresi), ukuranPx, opsi, url, cad);
}

/**
 * Sisipan panggilan telepon: frame `telepon.frame` + wajah ekspresi, jendela `telepon.jendela` (56 px: kepala utuh +
 * gagang). Ukuran lain diturunkan dengan skala bulat; tepi atas tetap (kepala utuh bila muat, selain itu dipusatkan
 * ke kepala tanpa memotong wajah). Tanpa jendela telepon: frame pose `telepon` + jendela kepala.
 */
export function teleponDari(m: ManifestTokoh, ekspresi: Ekspresi, ukuranPx: number, opsi: Omit<OpsiPotret, 'dekat'> = {}, url = ''): PotretTokoh {
  const cad: string[] = [];
  return potretDariDaftar(m, m.telepon ? [m.telepon] : [], 'telepon', true, String(ekspresi), ukuranPx, opsi, url, cad);
}

// ------------------------------------------------------------------ SVG (di luar panggung)

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n: number) => String(Math.round(n * 1e6) / 1e6);
/** Id SVG aman (huruf/angka/_/-, diawali huruf); '' bila kosong. */
export function idSvgAman(s: string): string {
  const b = s.replace(/[^A-Za-z0-9_-]/g, '');
  return b ? (/^[A-Za-z]/.test(b) ? b : `p${b}`) : '';
}

/**
 * Isi SVG (tanpa elemen pembungkus) untuk lapisan: tiap lapisan = <svg> bersarang di (x, y) seukuran potongannya dengan
 * viewBox = kotak sumber, berisi <image> atlas utuh (nearest-neighbour: atribut + CSS). Tanpa id sama sekali, jadi
 * aman disisipkan berkali-kali di satu halaman.
 */
export function isiSvg(lapisan: readonly LapisanSusun[], url: string, atlas: { w: number; h: number }): string {
  const img = `<image href="${esc(url)}" x="0" y="0" width="${atlas.w}" height="${atlas.h}" preserveAspectRatio="none" image-rendering="pixelated" style="image-rendering:pixelated"/>`;
  return lapisan
    .map((l) => `<svg x="${fmt(l.x)}" y="${fmt(l.y)}" width="${l.sumber.w}" height="${l.sumber.h}" viewBox="${l.sumber.x} ${l.sumber.y} ${l.sumber.w} ${l.sumber.h}" preserveAspectRatio="none" overflow="hidden">${img}</svg>`)
    .join('');
}

export interface OpsiSvg {
  /** Kotak piksel seni yang terlihat (bawaan: kotak lapisan pertama = tubuh). */
  viewBox?: KotakSeni;
  /** Ukuran elemen (px); bawaan viewBox x 1. Pilih kelipatan bulat viewBox supaya piksel tetap tajam. */
  lebar?: number;
  tinggi?: number;
  /** Id elemen <svg> (dibersihkan idSvgAman). Tanpa id = tidak ada id apa pun. */
  id?: string;
  kelas?: string;
  /** Nama untuk pembaca layar (role img); tanpa judul = aria-hidden. */
  judul?: string;
}

/** SVG utuh (toSvg) untuk lapisan di luar panggung: <svg viewBox> + <image> pixelated yang memotong atlas. */
export function keSvg(lapisan: readonly LapisanSusun[], url: string, atlas: { w: number; h: number }, opsi: OpsiSvg = {}): string {
  const t = lapisan[0];
  const vb = opsi.viewBox ?? (t ? { x: t.x, y: t.y, w: t.sumber.w, h: t.sumber.h } : { x: 0, y: 0, w: 1, h: 1 });
  const lebar = opsi.lebar ?? vb.w;
  const tinggi = opsi.tinggi ?? (opsi.lebar !== undefined ? (opsi.lebar * vb.h) / vb.w : vb.h);
  const id = opsi.id ? idSvgAman(opsi.id) : '';
  const aria = opsi.judul ? ` role="img" aria-label="${esc(opsi.judul)}"` : ' aria-hidden="true"';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg"${id ? ` id="${id}"` : ''}${opsi.kelas ? ` class="${esc(opsi.kelas)}"` : ''}` +
    ` viewBox="${fmt(vb.x)} ${fmt(vb.y)} ${fmt(vb.w)} ${fmt(vb.h)}" width="${fmt(lebar)}" height="${fmt(tinggi)}"` +
    ` preserveAspectRatio="none" overflow="hidden" focusable="false" style="image-rendering:pixelated"${aria}>` +
    `${opsi.judul ? `<title>${esc(opsi.judul)}</title>` : ''}${isiSvg(lapisan, url, atlas)}</svg>`
  );
}

/** Potret -> { svg utuh ukuranPx x ukuranPx, isi (untuk <svg viewBox> milik komponen), viewBox string }. */
export function svgPotret(p: PotretTokoh, opsi: Omit<OpsiSvg, 'viewBox' | 'lebar' | 'tinggi'> = {}): { svg: string; isi: string; viewBox: string; ukuran: number } {
  const v = p.viewBox;
  return {
    svg: keSvg(p.lapisan, p.url, p.atlas, { ...opsi, viewBox: v, lebar: p.ukuranPx, tinggi: p.ukuranPx }),
    isi: isiSvg(p.lapisan, p.url, p.atlas),
    viewBox: `${fmt(v.x)} ${fmt(v.y)} ${fmt(v.w)} ${fmt(v.h)}`,
    ukuran: p.ukuranPx,
  };
}

/** Tokoh utuh (frame) sebagai SVG pada skala bulat (bawaan 1 px per piksel seni), mis. untuk aktivitas. */
export function svgTokoh(s: SusunanTokoh, opsi: Omit<OpsiSvg, 'viewBox' | 'lebar' | 'tinggi'> & { skala?: number } = {}): string {
  const k = Math.max(1, Math.round(opsi.skala ?? 1));
  return keSvg(s.lapisan, s.url, s.atlas, { ...opsi, viewBox: { x: 0, y: 0, w: s.ukuran.w, h: s.ukuran.h }, lebar: s.ukuran.w * k, tinggi: s.ukuran.h * k });
}

// ------------------------------------------------------------------ penyusun terpasang

export interface SumberAtlasTokoh {
  /** Isi manifest (JSON yang sudah di-parse). */
  json: unknown;
  /** URL PNG atlas yang bisa dimuat. */
  url: string;
}

/** Opsi gambar panggung: OpsiTokoh dunia.ts (siapa + opsi cerita) + bicara/kedip. `kunci` diabaikan (lihat kunciTergambar). */
export type OpsiGambarPiksel = OpsiCerita & { siapa: 'mentor' | 'nasabah'; kunci?: boolean; id?: string };

export interface PenyusunPiksel {
  manifest: Partial<Record<IdTokohPiksel, ManifestTokoh>>;
  url: Partial<Record<IdTokohPiksel, string>>;
  /** Catatan baca manifest (awalan id tokoh). */
  catatan: string[];
  tersedia(id: IdTokohPiksel): boolean;
  /** Susun tokoh (null = manifest tokoh itu tidak ada/tidak sah: pakai seni SVG). */
  susunTokoh(id: IdTokohPiksel, opsi: OpsiSusun): SusunanTokoh | null;
  potretTokoh(id: IdTokohPiksel, ekspresi: Ekspresi, ukuranPx: number, opsi?: OpsiPotret): PotretTokoh | null;
  /** Sisipan telepon (bawaan Bu Rina). */
  teleponSisipan(ekspresi: Ekspresi, ukuranPx: number, opsi?: Omit<OpsiPotret, 'dekat'> & { tokoh?: IdTokohPiksel }): PotretTokoh | null;
  /** Opsi panggung (siapa, pose, ekspresi, pandang, bicara, kedip) -> GambarTokoh raster, atau null (pakai SVG). */
  gambarTokohPiksel(o: OpsiGambarPiksel): GambarTokohPiksel | null;
}

/** Penyusun dengan manifest & URL atlas terpasang (index.ts memasang berkas nyata; tes memakai JSON nyata juga). */
export function buatPenyusun(sumber: Partial<Record<IdTokohPiksel, SumberAtlasTokoh>>): PenyusunPiksel {
  const manifest: Partial<Record<IdTokohPiksel, ManifestTokoh>> = {};
  const url: Partial<Record<IdTokohPiksel, string>> = {};
  const catatan: string[] = [];
  for (const id of DAFTAR_TOKOH_PIKSEL) {
    const s = sumber[id];
    if (!s) continue;
    const c: string[] = [];
    const m = bacaManifestTokoh(s.json, c);
    catatan.push(...c.map((x) => `${id}: ${x}`));
    if (!m) continue;
    if (typeof s.url !== 'string' || !s.url) { catatan.push(`${id}: URL atlas kosong, tidak dipakai`); continue; }
    manifest[id] = m;
    url[id] = s.url;
  }
  return {
    manifest,
    url,
    catatan,
    tersedia: (id) => !!manifest[id],
    susunTokoh: (id, opsi) => (manifest[id] ? susunDari(manifest[id]!, opsi, url[id]) : null),
    potretTokoh: (id, e, u, opsi = {}) => (manifest[id] ? potretDari(manifest[id]!, e, u, opsi, url[id]) : null),
    teleponSisipan: (e, u, opsi = {}) => {
      const id = opsi.tokoh ?? 'buRina';
      return manifest[id] ? teleponDari(manifest[id]!, e, u, opsi, url[id]) : null;
    },
    gambarTokohPiksel: (o) => {
      const id: IdTokohPiksel = o.siapa === 'mentor' ? 'missRaksa' : 'buRina';
      const m = manifest[id];
      if (!m) return null;
      return keGambarTokoh(susunDari(m, opsiDariCerita(id, m, o), url[id]));
    },
  };
}
