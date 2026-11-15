/**
 * LOGIKA MEJA KASUS (fungsi MURNI; PROTOTIPE K11, D-68): SATU sumber state untuk babak bundel sebagai meja kasus.
 *
 * - Draf meja = jawaban arena yang sama dengan pola bundel lama ({tindakan, kabar}) + jejak pemeriksaan (berkas yang sudah
 *   dibuka, map pernah dibuka, fokus meja/map). Disimpan sebagai SATU draf aktivitas per kunjungan (simpan.ts): jawaban di
 *   kunci langkahnya, jejak meja di `_meja` (sanitizeDraft pola lama mengabaikannya, jadi kedua versi bisa dibandingkan).
 * - Kelengkapan berkas mengikuti tabel fakta skenario (baris "ada" / belum); membuka berkas hanya mengubah jejak
 *   pemeriksaan, tidak pernah mengubah kelengkapan atau jawaban.
 * - Tindakan = menaruh map di tempat (papan kelengkapan / baki Komite / kontak nasabah) -> pilihan tindakan yang tempatnya
 *   itu. Kabar = pilihan kabar. Keduanya draf sampai dikonfirmasi; konfirmasi = SATU aksi mesin 'aktivitas'.
 * - Sesudah konfirmasi, keputusan & akibat dibaca dari state mesin (riwayat), bukan dari draf.
 */
import type { MissionAnswer } from '@shared/types';
import type { Episode, NodeAktivitas, StateCerita, TempatMeja } from '../../tipe';
import type { ArenaBundel } from '../arena/logika';

export type FokusMeja = 'meja' | 'map';
export type StatusBerkas = 'belum-diperiksa' | 'diperiksa' | 'belum-tersedia';
/** Langkah berikutnya yang disarankan (petunjuk, BUKAN gerbang): urutan wajar meja kasus. */
export type PetunjukMeja = 'periksa' | 'tindakan' | 'kabar' | 'konfirmasi';

export interface MejaDraf {
  jawaban: MissionAnswer;
  /** Id berkas yang sudah dibuka (urut pertama kali dibuka). */
  diperiksa: string[];
  /** Map pernah dibuka: isi & hitungan kelengkapan sudah terlihat. */
  mapDibuka: boolean;
  fokus: FokusMeja;
}

export type AksiMeja =
  | { jenis: 'buka-map' }
  | { jenis: 'tutup-map' }
  | { jenis: 'periksa'; berkas: string }
  | { jenis: 'taruh'; tempat: TempatMeja }
  | { jenis: 'kabar'; kabar: string };

/** Kunci jejak meja di dalam draf aktivitas (di samping jawaban). */
export const KUNCI_JEJAK = '_meja';

/** Konfig meja pola bundel (null bila arena ini tidak punya meja). */
export function mejaDari(k: ArenaBundel): NonNullable<ArenaBundel['meja']> | null {
  return k.meja ?? null;
}

/** Draf meja dari draf tersimpan (tak sah = kosong) dan jawaban yang sudah disaring (sanitizeDraft). */
export function bacaMeja(k: ArenaBundel, mentah: unknown, jawaban: MissionAnswer): MejaDraf {
  const m = k.meja;
  const j = mentah && typeof mentah === 'object' ? (mentah as Record<string, unknown>)[KUNCI_JEJAK] : null;
  const jejak = j && typeof j === 'object' ? (j as Record<string, unknown>) : {};
  const id = new Set(m?.berkas.map((b) => b.id) ?? []);
  const diperiksa = Array.isArray(jejak.diperiksa) ? [...new Set(jejak.diperiksa.filter((x): x is string => typeof x === 'string' && id.has(x)))] : [];
  return {
    jawaban: saringJawaban(k, jawaban),
    diperiksa,
    mapDibuka: jejak.mapDibuka === true || diperiksa.length > 0,
    fokus: jejak.fokus === 'map' ? 'map' : 'meja',
  };
}

/** Draf yang disimpan: jawaban di kunci langkahnya + jejak meja. */
export function drafSimpan(m: MejaDraf): Record<string, unknown> {
  return { ...m.jawaban, [KUNCI_JEJAK]: { diperiksa: m.diperiksa, mapDibuka: m.mapDibuka, fokus: m.fokus } };
}

/** Hanya dua langkah bundel dengan opsi sah. */
function saringJawaban(k: ArenaBundel, j: MissionAnswer): MissionAnswer {
  const out: MissionAnswer = {};
  const t = j[k.tindakan.langkah];
  const b = j[k.kabar.langkah];
  if (typeof t === 'string' && k.tindakan.pilihan.some((x) => x.id === t)) out[k.tindakan.langkah] = t;
  if (typeof b === 'string' && k.kabar.pilihan.some((x) => x.id === b)) out[k.kabar.langkah] = b;
  return out;
}

/** Id pilihan tindakan yang tempatnya `tempat` (null bila tidak ada). */
export function tindakanDiTempat(k: ArenaBundel, tempat: TempatMeja): string | null {
  const m = k.meja;
  if (!m) return null;
  return k.tindakan.pilihan.find((p) => m.tindakan[p.id]?.tempat === tempat)?.id ?? null;
}

/** Tindakan yang sedang direncanakan (draf), atau null. */
export function tindakanKini(k: ArenaBundel, m: Pick<MejaDraf, 'jawaban'>): string | null {
  const v = m.jawaban[k.tindakan.langkah];
  return typeof v === 'string' ? v : null;
}

/** Kabar yang sedang dipilih (draf), atau null. */
export function kabarKini(k: ArenaBundel, m: Pick<MejaDraf, 'jawaban'>): string | null {
  const v = m.jawaban[k.kabar.langkah];
  return typeof v === 'string' ? v : null;
}

/** Tempat map/laporan menurut rencana tindakan kini (null = map belum dipindah). */
export function tempatKini(k: ArenaBundel, m: Pick<MejaDraf, 'jawaban'>): TempatMeja | null {
  const t = tindakanKini(k, m);
  return t ? k.meja?.tindakan[t]?.tempat ?? null : null;
}

/** Pilihan kabar yang berarti TIDAK mengirim pesan (punya `arti` = tindakan sengaja tanpa pesan). */
export function kabarTanpaPesan(k: ArenaBundel, kabar: string | null): boolean {
  return !!kabar && !!k.kabar.pilihan.find((p) => p.id === kabar)?.arti;
}

/** Terapkan satu aksi meja (draf baru; yang lama tidak diubah). Aksi tak sah = draf yang sama. */
export function jalankanMeja(k: ArenaBundel, m: MejaDraf, a: AksiMeja): MejaDraf {
  switch (a.jenis) {
    case 'buka-map':
      return m.fokus === 'map' && m.mapDibuka ? m : { ...m, fokus: 'map', mapDibuka: true };
    case 'tutup-map':
      return m.fokus === 'meja' ? m : { ...m, fokus: 'meja' };
    case 'periksa': {
      if (!k.meja?.berkas.some((b) => b.id === a.berkas) || m.diperiksa.includes(a.berkas)) return m;
      return { ...m, diperiksa: [...m.diperiksa, a.berkas], mapDibuka: true };
    }
    case 'taruh': {
      const t = tindakanDiTempat(k, a.tempat);
      if (!t || m.jawaban[k.tindakan.langkah] === t) return m;
      return { ...m, fokus: 'meja', jawaban: { ...m.jawaban, [k.tindakan.langkah]: t } };
    }
    case 'kabar': {
      if (!k.kabar.pilihan.some((p) => p.id === a.kabar) || m.jawaban[k.kabar.langkah] === a.kabar) return m;
      return { ...m, jawaban: { ...m.jawaban, [k.kabar.langkah]: a.kabar } };
    }
  }
}

/**
 * Status tiap kelompok berkas: belum tersedia (fakta skenario: tidak ada di map) tidak pernah bergantung pada pemeriksaan;
 * berkas tersedia = belum diperiksa / diperiksa. `ada[i]` = baris tabel fakta ke-i bernilai "ada".
 */
export function statusBerkas(k: ArenaBundel, m: Pick<MejaDraf, 'diperiksa'>, ada: readonly boolean[]): { id: string; status: StatusBerkas }[] {
  return (k.meja?.berkas ?? []).map((b, i) => ({
    id: b.id,
    status: !ada[i] ? 'belum-tersedia' : m.diperiksa.includes(b.id) ? 'diperiksa' : 'belum-diperiksa',
  }));
}

/** Petunjuk langkah berikutnya (urutan wajar; tidak mengunci aksi lain). */
export function petunjukMeja(k: ArenaBundel, m: MejaDraf): PetunjukMeja {
  if (!m.mapDibuka && !tindakanKini(k, m)) return 'periksa';
  if (!tindakanKini(k, m)) return 'tindakan';
  if (!kabarKini(k, m)) return 'kabar';
  return 'konfirmasi';
}

/** Yang masih kurang sebelum konfirmasi (null = siap). */
export function kurangKonfirmasi(k: ArenaBundel, m: Pick<MejaDraf, 'jawaban'>): 'tindakan' | 'kabar' | null {
  if (!tindakanKini(k, m)) return 'tindakan';
  if (!kabarKini(k, m)) return 'kabar';
  return null;
}

/** Jawaban yang dikirim ke mesin saat konfirmasi: persis dua langkah bundel (sama dengan pola lama). */
export function jawabanKonfirmasi(k: ArenaBundel, m: Pick<MejaDraf, 'jawaban'>): MissionAnswer {
  return saringJawaban(k, m.jawaban);
}

/**
 * Node kini = node AKIBAT sebuah aktivitas bermeja yang sudah dikonfirmasi (salah satu `hasil[].lanjut` dari node aktivitas
 * di entri aktivitas terakhir riwayat): keputusan tersimpan + konfig meja + akhir di meja. null bila bukan.
 */
export function akibatMeja(ep: Episode, s: StateCerita): {
  aktivitas: string;
  konfig: ArenaBundel;
  tindakan: string;
  kabar: string;
  akhir: 'lengkap' | 'kembali' | 'tahan';
} | null {
  for (let i = s.riwayat.length - 1; i >= 0; i--) {
    const e = s.riwayat[i]!;
    if (e.jenis !== 'aktivitas') continue;
    const n = ep.node[e.node];
    if (!n || n.jenis !== 'aktivitas') return null;
    if (!(n as NodeAktivitas).hasil.some((c) => c.lanjut === s.node)) return null;
    const k = ep.aktivitas[e.aktivitas]?.arena;
    if (!k || k.pola !== 'bundel' || !k.meja) return null;
    const j = s.aktivitas[e.aktivitas]?.jawaban ?? {};
    const tindakan = j[k.tindakan.langkah];
    const kabar = j[k.kabar.langkah];
    if (typeof tindakan !== 'string' || typeof kabar !== 'string') return null;
    const akhir = k.meja.tindakan[tindakan]?.akhir;
    return akhir ? { aktivitas: e.aktivitas, konfig: k, tindakan, kabar, akhir } : null;
  }
  return null;
}
