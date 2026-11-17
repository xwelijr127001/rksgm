/**
 * ADAPTER CUE Episode 2 -> PANGGUNG PIKSEL (T-013 Stage 1; REVIEW "T-013 plan review": adapter presentasi + pemetaan cue
 * EKSPLISIT). Fungsi MURNI: komposisi panggung latar (`komposisiLatar`, lipatan CueLatar naskah: lokasi, hadir, telepon,
 * objek) -> komposisi piksel (ruang, tokoh di tempat tetap, sisipan telepon, prop), ATAU alasan kenapa adegan ini tetap di
 * panggung ilustrasi. Mesin, naskah, dan simpanan tidak disentuh; `Episode.latar` tetap satu-satunya sumber cue.
 *
 * Pemetaan (D-81 + keputusan owner 15 Nov: Miss Raksa BERDIRI di meja layanan):
 *  - lokasi: `latar.lokasi[x].piksel` = id ruang piksel; tanpa itu -> ilustrasi (bengkel/tol/pool/wawancara: Stage 2).
 *  - hadir missRaksa -> tempat `balikMeja`, pose `berdiri`, hadap KANAN (ke sisi pengunjung), pinggang ke bawah di balik meja.
 *    `bisaDudukTurun` Episode 1 diabaikan: meja layanan tanpa kursi.
 *  - hadir hendra -> tempat `depanMeja`, pose `berdiri`, hadap KIRI (atlas Hendra hanya hadap kiri).
 *  - hadir pemeran lain (bima, rudi, ...) -> TIDAK dipetakan: seluruh adegan tetap ilustrasi (tanpa siluet di ruang piksel).
 *  - telepon X (X punya atlas piksel) -> sisipan telepon wajah X (ekspresi barisnya) + gagang meja; ruang tetap.
 *    telepon pemeran tanpa atlas -> ilustrasi.
 *  - objek: berkas -> prop `map` (map klaim di meja), surat -> prop `surat`; objek lain -> ilustrasi.
 *  - `dekat` (potongan dekat ilustrasi) tidak punya padanan: kamera tetap; ekspresi dibaca dari wajah + potret dialog.
 *  - komite (T-025): di ruang yang punya sprite milik ruang (ruang-ep2.json blok `komite`), isyarat `komite` diteruskan
 *    apa adanya (bawaan `tunggu`); anggota komite BUKAN tokoh adegan: tidak masuk `tokoh`, slot, maupun kamera.
 * Wajah: ekspresi cerita apa adanya; atlas memetakan sendiri (manifest.ekspresiDari, Hendra: lega -> senang).
 */
import type { Ekspresi, Episode, IdPembicara, KeadaanKomite } from '../../../tipe';
import type { IdTokohPiksel } from '../../../seni/piksel/susun';
import type { KomposisiLatar } from '../komposisi';
import { RUANG_PIKSEL } from './ruang';

/** `balikMeja` = di balik meja layanan (Miss Raksa, kantor); `slot` = berdiri di slot ruang ke-i dari n (kiri -> kanan). */
export type TempatPiksel = 'balikMeja' | 'slot';
export type ArahPiksel = 'kiri' | 'kanan';

/** Peran naskah yang punya seni piksel, dan cara ia berdiri di ruang kantor. */
export interface PeranPiksel {
  tokoh: IdTokohPiksel;
  tempat: TempatPiksel;
  pose: string;
  /** Arah bawaan (Miss Raksa: tetap). Tokoh slot: arah adegan diambil dari slot ruang (D-93). */
  hadap: ArahPiksel;
  /** Atlas hanya punya SATU arah (seni Hendra & tokoh samping menghadap kanan): arah lain = cermin saat digambar. */
  satuArah?: ArahPiksel;
}

/** SEMUA pose yang bisa diminta adapter (diuji terhadap atlas: tidak boleh jatuh ke cadangan pose/arah). */
export const PERAN_PIKSEL: Readonly<Partial<Record<IdPembicara, PeranPiksel>>> = {
  missRaksa: { tokoh: 'missRaksa', tempat: 'balikMeja', pose: 'berdiri', hadap: 'kanan' },
  // D-93: seni Hendra & tokoh samping menghadap KANAN penonton; hadap 'kiri' di adegan = dicerminkan di panggung.
  ...Object.fromEntries((['hendra', 'rudi', 'bima', 'darto', 'admin', 'tol', 'polisi'] as const).map((id) => [id, { tokoh: id, tempat: 'slot', pose: 'berdiri', hadap: 'kanan', satuArah: 'kanan' } satisfies PeranPiksel])),
};
/** Slot berdiri per ruang (ruang-ep2.json `slot` 1..3). */
export const MAKS_SLOT = 3;

/** Objek akibat keputusan -> prop ruang piksel. */
export const OBJEK_PIKSEL: Readonly<Record<string, string>> = { berkas: 'map', surat: 'surat', foto: 'foto' };

export interface TokohDiPiksel extends PeranPiksel {
  /** (tempat 'slot') urutan 0..n-1 dan jumlah tokoh slot di adegan. */
  slot: number;
  jumlahSlot: number;
  /** true = frame atlas (satuArah) digambar tercermin terhadap jangkar kaki. */
  cermin: boolean;
  id: IdPembicara;
  ekspresi: Ekspresi;
  bicara: boolean;
}

export interface AdeganPiksel {
  ruang: string;
  tokoh: TokohDiPiksel[];
  telepon: { id: IdPembicara; tokoh: IdTokohPiksel; ekspresi: Ekspresi; bicara: boolean } | null;
  prop: string[];
  /** (T-025) Keadaan sprite milik ruang; hanya ada bila ruangnya punya blok `komite`. */
  komite?: KeadaanKomite;
}

export type HasilAdapter = { piksel: AdeganPiksel; alasan: null } | { piksel: null; alasan: string };

const tolak = (alasan: string): HasilAdapter => ({ piksel: null, alasan });

/** Komposisi latar -> adegan piksel, atau alasan tetap ilustrasi. */
export function adeganPiksel(ep: Pick<Episode, 'latar'>, k: KomposisiLatar): HasilAdapter {
  const ruang = ep.latar?.lokasi[k.lokasi]?.piksel;
  if (!ruang) return tolak(`lokasi ${k.lokasi || '(kosong)'} tanpa ruang piksel`);
  const tokoh: TokohDiPiksel[] = [];
  for (const h of k.hadir) {
    const p = PERAN_PIKSEL[h.id];
    if (!p) return tolak(`pemeran ${h.id} tanpa atlas piksel`);
    if (p.tempat === 'balikMeja' && tokoh.some((x) => x.tempat === 'balikMeja')) return tolak('tempat balikMeja ganda');
    tokoh.push({ ...p, id: h.id, ekspresi: h.ekspresi, bicara: h.bicara, slot: 0, jumlahSlot: 0, cermin: false });
  }
  // Slot berdiri: urut naskah (kiri -> kanan), maksimal MAKS_SLOT (adegan tiga saksi wawancara = slot 3, D-84 q1).
  const berdiri = tokoh.filter((x) => x.tempat === 'slot');
  if (berdiri.length > MAKS_SLOT) return tolak(`${berdiri.length} tokoh berdiri > ${MAKS_SLOT} slot`);
  const slotRuang = RUANG_PIKSEL[ruang]?.slot[berdiri.length] ?? [];
  berdiri.forEach((x, i) => {
    x.slot = i;
    x.jumlahSlot = berdiri.length;
    // Arah per adegan dari slot ruang (ruang-ep2.json, D-93); atlas satu arah -> cermin bila berbeda.
    x.hadap = slotRuang[i]?.hadap ?? x.hadap;
    x.cermin = !!x.satuArah && x.satuArah !== x.hadap;
  });
  let telepon: AdeganPiksel['telepon'] = null;
  if (k.telepon) {
    const p = PERAN_PIKSEL[k.telepon.id];
    if (!p) return tolak(`telepon ${k.telepon.id} tanpa atlas piksel`);
    telepon = { id: k.telepon.id, tokoh: p.tokoh, ekspresi: k.telepon.ekspresi, bicara: k.telepon.bicara };
  }
  const prop: string[] = [];
  for (const o of k.objek) {
    const p = OBJEK_PIKSEL[o];
    if (!p) return tolak(`objek ${o} tanpa prop piksel`);
    prop.push(p);
  }
  const komite: KeadaanKomite | undefined = RUANG_PIKSEL[ruang]?.komite ? k.komite ?? 'tunggu' : undefined;
  return { piksel: { ruang, tokoh, telepon, prop, ...(komite ? { komite } : {}) }, alasan: null };
}

/**
 * Pemeriksaan pose (dipakai uji & bisa dipanggil saat build): setiap pose+arah yang bisa diminta adapter HARUS ada persis di
 * manifest atlas tokohnya (tanpa rantai cadangan pose/arah susun.ts). Mengembalikan daftar yang hilang ('' = lengkap).
 */
export function poseHilang(
  manifest: (id: IdTokohPiksel) => { pose: Record<string, { kiri?: string; kanan?: string }> } | undefined,
  peran: Readonly<Partial<Record<IdPembicara, PeranPiksel>>> = PERAN_PIKSEL,
): string[] {
  const hilang: string[] = [];
  for (const [id, p] of Object.entries(peran)) {
    if (!p) continue;
    const m = manifest(p.tokoh);
    if (!m) { hilang.push(`${id}: atlas ${p.tokoh} tidak ada`); continue; }
    const arah = p.satuArah ?? p.hadap;
    if (!m.pose[p.pose]?.[arah]) hilang.push(`${id}: pose ${p.pose}/${arah} tidak ada di atlas ${p.tokoh}`);
  }
  return hilang;
}
