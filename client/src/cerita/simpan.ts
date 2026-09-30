/**
 * Penyimpanan progres MODE CERITA di perangkat ini (docs/rancangan-mode-cerita.md bagian 2.4).
 *
 *  raksa:cerita = {
 *    format: 1,
 *    episode: { [idEpisode]: { versi, state, disimpan } },   progres yang sedang berjalan
 *    akhir:   { [idEpisode]: IdAkhir[] },                     akhir yang pernah dicapai (bertahan walau diulang)
 *    arsip:   [{ episode, versi, state, diarsipkan, sebab }], progres lama (lihat "Arsip" di bawah)
 *  }
 *  raksa:cerita:rusak:<waktu> = data mentah lama yang tidak terbaca, dicadangkan sebelum ditimpa.
 *
 * Tidak ada penghapusan diam-diam: progres yang tidak cocok (versi beda tanpa migrasi, node hilang, rusak)
 * hanya dilaporkan oleh muatProgres; data mentahnya tetap di tempat sampai pemain memilih "Mulai ulang"
 * (mulaiBaru -> diarsipkan) atau progres baru disimpan (simpanProgres -> diarsipkan). Semua akses dibungkus
 * try/catch; bila localStorage diblokir/penuh, cadangan di memori berlaku selama tab terbuka (pola state/profil.ts).
 * Naskah yang dipangkas tanpa menaikkan versi (baris node berkurang; kunci lama tetap di teks sebagai "pensiun"):
 * `baris` progres & tiap cadangan dijepit ke jumlah baris terlihat node-nya saat dimuat (jepitBaris).
 *
 * Arsip punya dua kuota terpisah per episode:
 *  - sebab 'perjalanan' = perjalanan biasa yang masih cocok ("Ulang episode" / "Main lagi"): hanya
 *    MAKS_ARSIP_PER_EPISODE terbaru yang disimpan; yang terlama dirotasi.
 *  - sebab 'versi' | 'rusak' | 'node-hilang' = progres tidak cocok (yang dijanjikan dialog pemulihan "tidak
 *    dihapus"): TIDAK PERNAH dirotasi. Entri lama tanpa `sebab` juga diperlakukan begitu (aman). Jumlahnya
 *    tetap kecil: tiap entri tidak cocok diarsipkan sekali lalu diganti progres yang cocok, jadi paling banyak
 *    satu per versi episode yang tidak kompatibel (atau per kejadian data rusak).
 */
import { barisTerlihat, stateAwal } from './mesin';
import type { Episode, HasilMuat, IdAkhir, NilaiProses, StateCerita } from './tipe';

const KUNCI = 'raksa:cerita';
const AWALAN_RUSAK = 'raksa:cerita:rusak:';
/** Batas arsip PERJALANAN BIASA per episode (progres tidak cocok tidak ikut dihitung dan tidak dirotasi). */
export const MAKS_ARSIP_PER_EPISODE = 5;

type AlasanTidakCocok = Extract<HasilMuat, { status: 'tidakCocok' }>['alasan'];
/** 'perjalanan' = perjalanan cocok yang diulang (boleh dirotasi); selain itu = progres tidak cocok (disematkan). */
export type SebabArsip = 'perjalanan' | AlasanTidakCocok;

export interface EntriArsipCerita {
  episode: string;
  /** null bila versi data lama tidak terbaca. */
  versi: number | null;
  /** State lama apa adanya (bisa rusak / versi lama). */
  state: unknown;
  diarsipkan: number;
  /** Tidak ada pada entri yang ditulis sebelum kuota dipisah; entri seperti itu tidak pernah dirotasi. */
  sebab?: SebabArsip;
}

interface AkarCerita {
  format: 1;
  episode: Record<string, unknown>;
  akhir: Record<string, unknown>;
  arsip: unknown[];
}

type Bacaan = { status: 'kosong' } | { status: 'ok'; akar: AkarCerita } | { status: 'rusak'; mentah: string };

// ------------------------------------------------------------------ akses mentah + cadangan memori

const memori = new Map<string, string>();
/** Kunci yang tulisan terakhirnya gagal ke localStorage: nilai terbaru hanya ada di memori. */
const hanyaMemori = new Set<string>();

function bacaMentah(kunci: string): string | null {
  if (hanyaMemori.has(kunci)) return memori.get(kunci) ?? null;
  try {
    return localStorage.getItem(kunci);
  } catch {
    return memori.get(kunci) ?? null;
  }
}

/** true = tersimpan di localStorage; false = hanya di memori (diblokir / penuh). */
function tulisMentah(kunci: string, nilai: string): boolean {
  memori.set(kunci, nilai);
  try {
    localStorage.setItem(kunci, nilai);
    hanyaMemori.delete(kunci);
    return true;
  } catch {
    hanyaMemori.add(kunci);
    return false;
  }
}

function tulisMemoriSaja(kunci: string, nilai: string): void {
  memori.set(kunci, nilai);
  hanyaMemori.add(kunci);
}

// ------------------------------------------------------------------ berlangganan (untuk hook React di lapisan UI)

const pendengar = new Set<() => void>();
let versiData = 0;
let pendengarStorage = false;

function kabari(): void {
  versiData += 1;
  pendengar.forEach((f) => f());
}

/**
 * Berlangganan perubahan penyimpanan cerita (tab ini & tab lain). Cocok untuk useSyncExternalStore:
 * `useSyncExternalStore(berlanggananCerita, versiPenyimpananCerita)` lalu baca akhirDitemukan() dsb.
 */
export function berlanggananCerita(f: () => void): () => void {
  pendengar.add(f);
  if (!pendengarStorage && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    pendengarStorage = true;
    window.addEventListener('storage', (e) => {
      if (e.key === null || e.key === KUNCI) kabari();
    });
  }
  return () => {
    pendengar.delete(f);
  };
}

/** Naik setiap kali penyimpanan cerita berubah (snapshot untuk useSyncExternalStore). */
export function versiPenyimpananCerita(): number {
  return versiData;
}

/** HANYA UNTUK TES: lupakan cadangan memori & status tulis. */
export function aturUlangMemoriCerita(): void {
  memori.clear();
  hanyaMemori.clear();
}

// ------------------------------------------------------------------ bentuk data

const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const ada = (rec: object, kunci: string): boolean => Object.prototype.hasOwnProperty.call(rec, kunci);
const larikTeks = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
const bulat = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const NILAI_PROSES: readonly unknown[] = ['tepat', 'dikoreksi', 'keliru'] satisfies NilaiProses[];
const ARAH: readonly unknown[] = ['naik', 'turun', 'tetap'];

function riwayatSah(e: unknown): boolean {
  if (!obj(e)) return false;
  const str = (k: string) => typeof e[k] === 'string';
  switch (e.jenis) {
    case 'bab': return str('bab');
    case 'baris': return str('node') && str('siapa') && str('teks');
    case 'pilihan': return str('node') && str('pilihan') && str('teks');
    case 'alasan': return str('node') && str('teks') && ARAH.includes(e.arah);
    case 'aktivitas': return str('node') && str('aktivitas') && typeof e.akurasi === 'number';
    default: return false;
  }
}

/** State tanpa cadangan yang bentuknya sah untuk episode ini, atau null. */
function intiSah(v: unknown, idEp: string): Omit<StateCerita, 'cadangan'> | null {
  if (!obj(v)) return null;
  if (v.format !== 1 || v.episode !== idEp || typeof v.versi !== 'number' || typeof v.node !== 'string' || !bulat(v.baris)) return null;
  if (!larikTeks(v.tanda) || typeof v.kepercayaan !== 'number' || !Number.isFinite(v.kepercayaan)) return null;
  if (!larikTeks(v.paham) || !larikTeks(v.catatan)) return null;
  if (!obj(v.proses) || !Object.values(v.proses).every((x) => NILAI_PROSES.includes(x))) return null;
  if (!Array.isArray(v.keputusan) || !v.keputusan.every((k) => obj(k) && typeof k.node === 'string' && typeof k.pilihan === 'string' && typeof k.langkah === 'number')) return null;
  if (!obj(v.aktivitas) || !Object.values(v.aktivitas).every((h) => obj(h) && obj(h.jawaban) && typeof h.akurasi === 'number' && larikTeks(h.tanda))) return null;
  if (v.umpanBalik !== null && !(obj(v.umpanBalik) && typeof v.umpanBalik.node === 'string' && bulat(v.umpanBalik.cabang))) return null;
  if (v.terakhir !== null && !(obj(v.terakhir) && typeof v.terakhir.teks === 'string')) return null;
  if (!Array.isArray(v.riwayat) || !v.riwayat.every(riwayatSah)) return null;
  if (v.akhir !== null && typeof v.akhir !== 'string') return null;
  if (!bulat(v.langkah)) return null;
  const { cadangan: _abaikan, ...inti } = v;
  void _abaikan;
  return inti as unknown as Omit<StateCerita, 'cadangan'>;
}

function stateSah(v: unknown, idEp: string): StateCerita | null {
  const inti = intiSah(v, idEp);
  if (!inti) return null;
  const c = (v as Record<string, unknown>).cadangan;
  if (c !== undefined && !obj(c)) return null;
  const cadangan: StateCerita['cadangan'] = {};
  for (const [bab, snap] of Object.entries(c ?? {})) {
    const x = intiSah(snap, idEp);
    if (x) cadangan[bab] = x;
  }
  return { ...inti, cadangan };
}

function bacaAkar(): Bacaan {
  const mentah = bacaMentah(KUNCI);
  if (mentah === null || mentah === '') return { status: 'kosong' };
  let data: unknown;
  try {
    data = JSON.parse(mentah);
  } catch {
    return { status: 'rusak', mentah };
  }
  if (!obj(data) || data.format !== 1) return { status: 'rusak', mentah };
  const episode = data.episode === undefined ? {} : data.episode;
  const akhir = data.akhir === undefined ? {} : data.akhir;
  const arsip = data.arsip === undefined ? [] : data.arsip;
  if (!obj(episode) || !obj(akhir) || !Array.isArray(arsip)) return { status: 'rusak', mentah };
  return { status: 'ok', akar: { format: 1, episode, akhir, arsip } };
}

/**
 * Ubah akar lalu tulis. Akar yang tidak terbaca TIDAK ditimpa diam-diam: data mentahnya dicadangkan dulu ke
 * raksa:cerita:rusak:<waktu>; bila pencadangan gagal (penyimpanan penuh), perubahan hanya disimpan di memori.
 */
function ubahAkar(ubah: (akar: AkarCerita) => void): boolean {
  const b = bacaAkar();
  let akar: AkarCerita;
  let bolehTulis = true;
  if (b.status === 'ok') akar = b.akar;
  else {
    if (b.status === 'rusak') bolehTulis = tulisMentah(AWALAN_RUSAK + Date.now(), b.mentah);
    akar = { format: 1, episode: {}, akhir: {}, arsip: [] };
  }
  ubah(akar);
  const mentah = JSON.stringify(akar);
  let ok = false;
  if (bolehTulis) ok = tulisMentah(KUNCI, mentah);
  else tulisMemoriSaja(KUNCI, mentah);
  kabari();
  return ok;
}

// ------------------------------------------------------------------ pemeriksaan progres

function periksaEntri(ep: Episode, entri: unknown): HasilMuat {
  if (!obj(entri)) return { status: 'tidakCocok', alasan: 'rusak' };
  const mentahState = entri.state;
  const versi = typeof entri.versi === 'number' ? entri.versi : obj(mentahState) && typeof mentahState.versi === 'number' ? mentahState.versi : undefined;
  if (versi === undefined) return { status: 'tidakCocok', alasan: 'rusak' };
  let state = stateSah(mentahState, ep.id);
  if (!state) return { status: 'tidakCocok', alasan: 'rusak', versiTersimpan: versi };

  if (versi !== ep.versi) {
    const migrasi = ep.migrasi && ada(ep.migrasi, String(versi)) ? ep.migrasi[versi] : undefined;
    if (typeof migrasi !== 'function') return { status: 'tidakCocok', alasan: 'versi', versiTersimpan: versi };
    let baru: StateCerita | null = null;
    try {
      baru = migrasi(JSON.parse(JSON.stringify(state)) as StateCerita);
    } catch {
      baru = null;
    }
    const sah = baru ? stateSah({ ...baru, versi: ep.versi }, ep.id) : null;
    if (!sah) return { status: 'tidakCocok', alasan: 'versi', versiTersimpan: versi };
    state = sah;
  }

  const nodeSah = (id: string) => ada(ep.node, id) && ep.node[id]!.jenis !== 'cabang';
  if (!nodeSah(state.node)) return { status: 'tidakCocok', alasan: 'node-hilang', versiTersimpan: versi };
  if (state.akhir !== null && !ada(ep.akhir, state.akhir)) return { status: 'tidakCocok', alasan: 'node-hilang', versiTersimpan: versi };
  if (state.umpanBalik) {
    const n = ep.node[state.node]!;
    if (state.umpanBalik.node !== state.node || n.jenis !== 'aktivitas' || !n.hasil[state.umpanBalik.cabang]) {
      return { status: 'tidakCocok', alasan: 'node-hilang', versiTersimpan: versi };
    }
  }
  // Titik "coba jalur lain" yang node-nya sudah tidak ada dilewati (progres utama tetap utuh).
  const cadangan: StateCerita['cadangan'] = {};
  for (const [bab, c] of Object.entries(state.cadangan)) if (nodeSah(c.node)) cadangan[bab] = jepitBaris(ep, c);
  return { status: 'lanjut', state: { ...jepitBaris(ep, state), cadangan } };
}

/**
 * Naskah boleh dipangkas tanpa menaikkan versi episode (docs/rancangan-mode-cerita.md 11.3): simpanan yang
 * berada lebih jauh dari jumlah baris terlihat node-nya dijepit ke baris terakhirnya, jadi tampilan tetap punya
 * kalimat untuk ditampilkan dan 'lanjut' tetap berjalan. Node harus sudah diperiksa ada (bukan cabang).
 */
function jepitBaris<T extends Omit<StateCerita, 'cadangan'>>(ep: Episode, s: T): T {
  const maks = barisTerlihat(ep, { ...s, cadangan: {} }, ep.node[s.node] ?? null).length;
  return s.baris > maks ? { ...s, baris: maks } : s;
}

// ------------------------------------------------------------------ API

/** Muat progres episode. Tidak pernah menulis: data yang tidak cocok tetap di tempat. */
export function muatProgres(ep: Episode): HasilMuat {
  const b = bacaAkar();
  if (b.status === 'kosong') return { status: 'baru' };
  if (b.status === 'rusak') return { status: 'tidakCocok', alasan: 'rusak' };
  const entri = ada(b.akar.episode, ep.id) ? b.akar.episode[ep.id] : undefined;
  if (entri === undefined || entri === null) return { status: 'baru' };
  return periksaEntri(ep, entri);
}

/** Hanya perjalanan biasa yang boleh dirotasi; progres tidak cocok & entri lama tanpa `sebab` disematkan. */
const bolehDirotasi = (a: unknown, idEp: string): boolean => obj(a) && a.episode === idEp && a.sebab === 'perjalanan';

function arsipkan(akar: AkarCerita, idEp: string, entri: unknown, sebab: SebabArsip): void {
  const versi = obj(entri) && typeof entri.versi === 'number' ? entri.versi : null;
  const state = obj(entri) && 'state' in entri ? entri.state : entri;
  akar.arsip.push({ episode: idEp, versi, state, diarsipkan: Date.now(), sebab } satisfies EntriArsipCerita);
  let lebih = akar.arsip.filter((a) => bolehDirotasi(a, idEp)).length - MAKS_ARSIP_PER_EPISODE;
  if (lebih > 0) akar.arsip = akar.arsip.filter((a) => !(bolehDirotasi(a, idEp) && lebih-- > 0));
}

/**
 * Simpan progres. Entri lama yang TIDAK cocok dengan episode ini (versi beda tanpa migrasi, node hilang,
 * rusak) diarsipkan dulu (disematkan), bukan ditimpa. Mengembalikan true bila tersimpan di localStorage
 * (false = hanya di memori tab ini, atau state milik episode lain).
 */
export function simpanProgres(ep: Episode, s: StateCerita): boolean {
  if (!s || s.episode !== ep.id) return false;
  return ubahAkar((akar) => {
    const lama = ada(akar.episode, ep.id) ? akar.episode[ep.id] : undefined;
    if (lama !== undefined && lama !== null) {
      const h = periksaEntri(ep, lama);
      if (h.status === 'tidakCocok') arsipkan(akar, ep.id, lama, h.alasan);
    }
    akar.episode[ep.id] = { versi: ep.versi, state: s, disimpan: Date.now() };
  });
}

/**
 * "Mulai ulang (progres lama diarsipkan)": progres tersimpan (cocok atau tidak) dipindah ke arsip, lalu
 * state awal dikembalikan (belum disimpan; simpan setelah aksi pertama). Progres yang belum berjalan
 * (langkah 0) tidak perlu diarsipkan. Progres cocok masuk kuota 'perjalanan' (dirotasi); progres tidak
 * cocok disematkan dengan alasannya.
 */
export function mulaiBaru(ep: Episode): StateCerita {
  const b = bacaAkar();
  const perlu = b.status === 'rusak' || (b.status === 'ok' && ada(b.akar.episode, ep.id) && b.akar.episode[ep.id] != null);
  if (perlu) {
    ubahAkar((akar) => {
      const lama = ada(akar.episode, ep.id) ? akar.episode[ep.id] : undefined;
      if (lama === undefined || lama === null) return;
      const s = obj(lama) ? stateSah(lama.state, ep.id) : null;
      if (!(s && s.langkah === 0)) {
        const h = periksaEntri(ep, lama);
        arsipkan(akar, ep.id, lama, h.status === 'tidakCocok' ? h.alasan : 'perjalanan');
      }
      delete akar.episode[ep.id];
    });
  }
  return stateAwal(ep);
}

/** Akhir yang pernah dicapai di perangkat ini (urut saat ditemukan, tanpa duplikat). */
export function akhirDitemukan(idEp: string): IdAkhir[] {
  const b = bacaAkar();
  if (b.status !== 'ok' || !ada(b.akar.akhir, idEp)) return [];
  const daftar = b.akar.akhir[idEp];
  return Array.isArray(daftar) ? [...new Set(daftar.filter((x): x is string => typeof x === 'string'))] : [];
}

/** Catat akhir yang dicapai (tanpa duplikat). */
export function catatAkhir(idEp: string, akhir: IdAkhir): void {
  if (!akhir || akhirDitemukan(idEp).includes(akhir)) return;
  ubahAkar((akar) => {
    const lama = ada(akar.akhir, idEp) && Array.isArray(akar.akhir[idEp]) ? (akar.akhir[idEp] as unknown[]) : [];
    akar.akhir[idEp] = [...new Set([...lama.filter((x): x is string => typeof x === 'string'), akhir])];
  });
}

/** Progres lama episode ini yang diarsipkan (terlama dulu). */
export function arsipProgres(idEp: string): EntriArsipCerita[] {
  const b = bacaAkar();
  if (b.status !== 'ok') return [];
  return b.akar.arsip.filter((a): a is EntriArsipCerita => obj(a) && a.episode === idEp);
}
