/**
 * MESIN CERITA - fungsi MURNI: state + aksi -> state baru. Tanpa React, tanpa penyimpanan, tanpa teks.
 * Kontrak: docs/rancangan-mode-cerita.md bagian 2 (tipe di ./tipe.ts).
 *
 * Jaminan:
 *  - `jalankan` tidak pernah mengubah state masukan. Aksi yang tidak sah untuk node kini (node lain,
 *    baris belum habis, pilihan tak tersedia, aktivitas sudah dinilai, rujukan rusak) mengembalikan
 *    OBJEK YANG SAMA, sehingga ketukan ganda / kiriman ganda / StrictMode aman (cek `baru === lama`).
 *  - Efek hanya diterapkan saat transisi (sekali). Membaca riwayat atau memuat ulang tidak menerapkan apa pun.
 *  - State & riwayat hanya berisi ID dan KUNCI teks; bahasa tidak pernah masuk ke mesin.
 *
 * Urutan riwayat satu transisi: [pilihan | aktivitas + baris umpan balik] -> alasan -> [bab baru] -> baris pertama.
 */
import { gradeMission } from '@shared/scoring';
import type { MissionAnswer, MissionPublic } from '@shared/types';
import type {
  AksiCerita, Baris, CabangHasil, DefAktivitas, Efek, EntriRiwayat, Episode, HasilAktivitas, IdAkhir, IdBab,
  IdLatar, IdNode, InfoBab, Kondisi, NilaiProses, NodeCerita, Pilihan, RingkasanAkhir, StateCerita, Suasana,
} from './tipe';

type Arah = 'naik' | 'turun' | 'tetap';
type Cadangan = Omit<StateCerita, 'cadangan'>;

const ada = (rec: object | null | undefined, kunci: string): boolean => !!rec && Object.prototype.hasOwnProperty.call(rec, kunci);

function ambilNode(ep: Episode, id: IdNode): NodeCerita | null {
  return ada(ep.node, id) ? ep.node[id]! : null;
}

// ------------------------------------------------------------------ kueri (dipakai tampilan)

/** Node yang sedang tampil, atau null bila state merujuk node yang tidak ada. */
export function nodeKini(ep: Episode, s: StateCerita): NodeCerita | null {
  return ambilNode(ep, s.node);
}

/** Evaluasi kondisi terhadap state. Bentuk kondisi yang tidak dikenal = tidak terpenuhi. */
export function kondisiTerpenuhi(k: Kondisi, s: Pick<StateCerita, 'tanda' | 'kepercayaan' | 'paham' | 'proses'>): boolean {
  if (!k || typeof k !== 'object') return false;
  if ('tanda' in k) return s.tanda.includes(k.tanda);
  if ('tidak' in k) return !kondisiTerpenuhi(k.tidak, s);
  if ('semua' in k) return Array.isArray(k.semua) && k.semua.every((x) => kondisiTerpenuhi(x, s));
  if ('salahSatu' in k) return Array.isArray(k.salahSatu) && k.salahSatu.some((x) => kondisiTerpenuhi(x, s));
  if ('kepercayaan' in k) {
    const { min, maks } = k.kepercayaan ?? {};
    return (min === undefined || s.kepercayaan >= min) && (maks === undefined || s.kepercayaan <= maks);
  }
  if ('paham' in k) return s.paham.includes(k.paham);
  if ('proses' in k) {
    const v = ada(s.proses, k.proses) ? s.proses[k.proses] : undefined;
    if (!v) return false;
    const boleh: NilaiProses[] = Array.isArray(k.nilai) ? k.nilai : [k.nilai];
    return boleh.includes(v);
  }
  return false;
}

const cocok = (jika: Kondisi | undefined, s: StateCerita): boolean => jika === undefined || kondisiTerpenuhi(jika, s);

/** Baris node yang tampil untuk state ini (baris ber-`jika` yang tidak terpenuhi dilewati). */
export function barisTerlihat(ep: Episode, s: StateCerita, node: NodeCerita | null = nodeKini(ep, s)): Baris[] {
  if (!node || node.jenis === 'cabang' || !Array.isArray(node.baris)) return [];
  return node.baris.filter((b) => cocok(b.jika, s));
}

/** Pilihan yang boleh ditampilkan di node pilihan (terlepas dari apakah baris pengantar sudah habis). */
export function pilihanTersedia(ep: Episode, s: StateCerita, node: NodeCerita | null = nodeKini(ep, s)): Pilihan[] {
  if (!node || node.jenis !== 'pilihan') return [];
  return node.pilihan.filter((p) => cocok(p.jika, s));
}

/** true bila semua baris terlihat node kini sudah tampil (pilihan / aktivitas boleh muncul). */
export function semuaBarisTampil(ep: Episode, s: StateCerita): boolean {
  return s.baris >= barisTerlihat(ep, s).length;
}

/** true bila aksi 'lanjut' mengubah sesuatu (tampilan: tombol/ketukan "Lanjut"). */
export function bisaLanjut(ep: Episode, s: StateCerita): boolean {
  return jalankan(ep, s, { jenis: 'lanjut' }) !== s;
}

/** Suasana nasabah dari kepercayaan: suasana dengan `min` tertinggi yang <= kepercayaan. */
export function suasanaNasabah(ep: Episode, s: Pick<StateCerita, 'kepercayaan'>): Suasana {
  const urut = [...(ep.suasana ?? [])].sort((a, b) => b.min - a.min);
  return urut.find((x) => s.kepercayaan >= x.min) ?? urut[urut.length - 1] ?? { min: 0, ekspresi: 'netral', label: '' };
}

/** Bab node kini beserta nomornya (1..jumlah) untuk header "Bagian n/5". */
export function babKini(ep: Episode, s: StateCerita): { bab: InfoBab; nomor: number; jumlah: number } | null {
  const n = nodeKini(ep, s);
  if (!n) return null;
  const i = ep.bab.findIndex((b) => b.id === n.bab);
  return i < 0 ? null : { bab: ep.bab[i]!, nomor: i + 1, jumlah: ep.bab.length };
}

/**
 * Latar panggung saat ini. Node tanpa `latar` memakai latar node sebelumnya; karena state tidak menyimpan
 * latar, dicari mundur lewat node di riwayat (tetap benar setelah muat ulang & "coba jalur lain").
 */
export function latarKini(ep: Episode, s: StateCerita): IdLatar {
  const kini = nodeKini(ep, s);
  if (kini?.latar) return kini.latar;
  for (let i = s.riwayat.length - 1; i >= 0; i--) {
    const e = s.riwayat[i]!;
    if ('node' in e) {
      const l = ambilNode(ep, e.node)?.latar;
      if (l) return l;
    }
  }
  return ambilNode(ep, ep.mulai)?.latar ?? 'kantor';
}

/** Umpan balik aktivitas yang sedang tampil (setelah dinilai, sebelum 'lanjut'), atau null. */
export function umpanBalikKini(ep: Episode, s: StateCerita): {
  def: DefAktivitas; hasil: HasilAktivitas; cabang: CabangHasil; baris: Baris[]; alasan?: { teks: string; arah: Arah };
} | null {
  const n = nodeKini(ep, s);
  if (!s.umpanBalik || !n || n.jenis !== 'aktivitas' || s.umpanBalik.node !== s.node) return null;
  const cabang = n.hasil[s.umpanBalik.cabang];
  const def = ada(ep.aktivitas, n.aktivitas) ? ep.aktivitas[n.aktivitas]! : null;
  const hasil = ada(s.aktivitas, n.aktivitas) ? s.aktivitas[n.aktivitas]! : null;
  if (!cabang || !def || !hasil) return null;
  const baris = (cabang.umpanBalik ?? []).filter((b) => cocok(b.jika, s));
  const alasan = cabang.efek?.alasan;
  return { def, hasil, cabang, baris, ...(alasan ? { alasan: { teks: alasan, arah: arahDari(cabang.efek?.kepercayaan) } } : {}) };
}

/**
 * Bab yang bisa diulang ("Coba jalur lain dari Bagian X"), urut cerita. Bab yang cadangannya langsung
 * berada di node akhir dilewati (mengulangnya hanya menampilkan akhir yang sama).
 */
export function babBisaDiulang(ep: Episode, s: StateCerita): IdBab[] {
  return ep.bab
    .map((b) => b.id)
    .filter((id) => {
      const c = ada(s.cadangan, id) ? s.cadangan[id] : undefined;
      const n = c ? ambilNode(ep, c.node) : null;
      return !!n && n.jenis !== 'akhir' && n.jenis !== 'cabang';
    });
}

// ------------------------------------------------------------------ penilaian aktivitas

function salinJawaban(jawaban: unknown): MissionAnswer {
  if (!jawaban || typeof jawaban !== 'object' || Array.isArray(jawaban)) return {};
  try {
    return JSON.parse(JSON.stringify(jawaban)) as MissionAnswer;
  } catch {
    return {};
  }
}

/**
 * Menilai jawaban aktivitas dengan rubrik klien (`def.kunci`, aturan sama dengan server: gradeMission/gradeStep).
 * Tanda (urut tetap, tidak bergantung urutan pilihan pemain):
 *   akt:<id>:tepat (akurasi >= 0,999) | :sebagian (> 0) | :belum,
 *   lalu per langkah single/multi: akt:<id>:pilih:<opsi> (opsi dipilih), akt:<id>:lewat:<opsi> (opsi benar tak dipilih),
 *   dan per langkah assign: akt:<id>:taruh:<item>:<wadah> (susunan pemain; dibaca kondisi cabang aktivitas langsung).
 * Opsi diurutkan menurut urutan opsi di misi; id opsi yang tidak ada di misi diabaikan.
 */
export function nilaiAktivitas(ep: Episode, def: DefAktivitas, jawaban: MissionAnswer | null | undefined): HasilAktivitas {
  void ep;
  const bersih = salinJawaban(jawaban);
  const nilai = gradeMission({ missionId: def.id, roundIndex: 0, summary: '', steps: def.kunci }, bersih);
  const akurasi = nilai.accuracy;
  const tanda: string[] = [`akt:${def.id}:${akurasi >= 0.999 ? 'tepat' : akurasi > 0 ? 'sebagian' : 'belum'}`];
  let misi: MissionPublic | null = null;
  try {
    misi = def.misi('id');
  } catch {
    misi = null;
  }
  for (const k of def.kunci) {
    if (k.assign !== undefined) {
      tanda.push(...tandaTaruh(def.id, misi, k.stepId, bersih[k.stepId]));
      continue;
    }
    const benar = k.single !== undefined ? [k.single] : k.multi !== undefined ? k.multi : null;
    if (!benar) continue;
    const mentah = bersih[k.stepId];
    // Aturan sama dengan penilaian (gradeStep): langkah single hanya menerima string, multi hanya larik.
    // Bentuk lain dianggap tidak memilih apa pun, jadi tanda 'pilih' tidak pernah bertentangan dengan akurasinya.
    const dipilih = new Set(
      k.single !== undefined
        ? (typeof mentah === 'string' ? [mentah] : [])
        : Array.isArray(mentah) ? mentah.filter((x): x is string => typeof x === 'string') : [],
    );
    const langkah = misi?.steps.find((st) => st.id === k.stepId);
    const urutan = langkah && (langkah.kind === 'single' || langkah.kind === 'multi') ? langkah.options.map((o) => o.id) : null;
    const urut = (ids: Set<string>): string[] => (urutan ? urutan.filter((id) => ids.has(id)) : [...ids].sort());
    for (const o of urut(dipilih)) tanda.push(`akt:${def.id}:pilih:${o}`);
    for (const o of urut(new Set(benar.filter((b) => !dipilih.has(b))))) tanda.push(`akt:${def.id}:lewat:${o}`);
  }
  return { jawaban: bersih, akurasi, tanda: [...new Set(tanda)] };
}

/**
 * Tanda langkah susun (assign): akt:<id>:taruh:<item>:<wadah> untuk tiap item yang ditaruh di wadah yang ADA di misi,
 * urut item misi. Item yang tidak ditaruh tidak bertanda (cabang episode membacanya sebagai "tidak diminta" lewat
 * kondisi `tidak`). Bentuk jawaban lain diabaikan, sama dengan penilaian (gradeStep hanya membaca rekaman item -> wadah).
 */
function tandaTaruh(idAkt: string, misi: MissionPublic | null, stepId: string, mentah: unknown): string[] {
  const langkah = misi?.steps.find((st) => st.id === stepId);
  if (!langkah || langkah.kind !== 'assign' || !mentah || typeof mentah !== 'object' || Array.isArray(mentah)) return [];
  const wadah = new Set(langkah.buckets.map((b) => b.id));
  const jawaban = mentah as Record<string, unknown>;
  return langkah.items
    .filter((it) => Object.prototype.hasOwnProperty.call(jawaban, it.id) && typeof jawaban[it.id] === 'string' && wadah.has(jawaban[it.id] as string))
    .map((it) => `akt:${idAkt}:taruh:${it.id}:${jawaban[it.id] as string}`);
}

// ------------------------------------------------------------------ transisi (internal)

function arahDari(delta: number | undefined): Arah {
  return typeof delta === 'number' && delta > 0 ? 'naik' : typeof delta === 'number' && delta < 0 ? 'turun' : 'tetap';
}

/** Salinan kerja: larik & rekaman disalin dangkal supaya boleh diubah tanpa menyentuh state lama. */
function draf(s: StateCerita): StateCerita {
  return {
    ...s,
    tanda: [...s.tanda],
    paham: [...s.paham],
    proses: { ...s.proses },
    catatan: [...s.catatan],
    keputusan: [...s.keputusan],
    aktivitas: { ...s.aktivitas },
    riwayat: [...s.riwayat],
    cadangan: { ...s.cadangan },
    langkah: s.langkah + 1,
  };
}

function potret(d: StateCerita): Cadangan {
  const { cadangan: _abaikan, ...sisa } = d;
  void _abaikan;
  return {
    ...sisa,
    tanda: [...d.tanda],
    paham: [...d.paham],
    proses: { ...d.proses },
    catatan: [...d.catatan],
    keputusan: [...d.keputusan],
    aktivitas: { ...d.aktivitas },
    riwayat: [...d.riwayat],
  };
}

const tambahUnik = (daftar: string[], baru: string[] | undefined): void => {
  for (const x of baru ?? []) if (!daftar.includes(x)) daftar.push(x);
};

/** Kepercayaan dijepit ke `Episode.kepercayaanBatas` bila ada (status nasabah 0-100); tanpa batas = apa adanya. */
function jepitKepercayaan(ep: Episode, nilai: number): number {
  const b = ep.kepercayaanBatas;
  return b ? Math.min(b.maks, Math.max(b.min, nilai)) : nilai;
}

/**
 * Terapkan efek ke draf; kembalikan entri alasan (belum dimasukkan ke riwayat) bila efek punya alasan. Entri alasan
 * membawa kepercayaan SESUDAH efek (`nilai`, sudah dijepit) untuk grafik status di layar akhir.
 */
function terapkanEfek(ep: Episode, d: StateCerita, efek: Efek | undefined, node: IdNode): Extract<EntriRiwayat, { jenis: 'alasan' }> | null {
  if (!efek) return null;
  tambahUnik(d.tanda, efek.pasang);
  if (efek.cabut?.length) d.tanda = d.tanda.filter((t) => !efek.cabut!.includes(t));
  if (typeof efek.kepercayaan === 'number' && Number.isFinite(efek.kepercayaan)) d.kepercayaan = jepitKepercayaan(ep, d.kepercayaan + efek.kepercayaan);
  tambahUnik(d.paham, efek.paham);
  tambahUnik(d.catatan, efek.catat);
  for (const [id, nilai] of Object.entries(efek.proses ?? {})) d.proses[id] = nilai;
  return efek.alasan ? { jenis: 'alasan', node, teks: efek.alasan, arah: arahDari(efek.kepercayaan), nilai: d.kepercayaan } : null;
}

/** Tampilkan baris terlihat berikutnya; false bila sudah habis. */
function barisBerikut(ep: Episode, d: StateCerita): boolean {
  const terlihat = barisTerlihat(ep, d);
  if (d.baris >= terlihat.length) return false;
  const b = terlihat[d.baris]!;
  d.baris += 1;
  d.riwayat.push({ jenis: 'baris', node: d.node, siapa: b.siapa, ...(b.ekspresi ? { ekspresi: b.ekspresi } : {}), teks: b.teks });
  return true;
}

/** Ikuti node 'cabang' sampai node tampil. null = rujukan hilang atau putaran cabang (penjaga loop). */
function resolusi(ep: Episode, s: StateCerita, target: IdNode): IdNode | null {
  const dilihat = new Set<IdNode>();
  let id = target;
  for (;;) {
    const n = ambilNode(ep, id);
    if (!n) return null;
    if (n.jenis !== 'cabang') return id;
    if (dilihat.has(id)) return null;
    dilihat.add(id);
    const c = (n.cabang ?? []).find((x) => kondisiTerpenuhi(x.jika, s));
    id = c ? c.lanjut : n.lainnya;
  }
}

/** Setelah node & cadangan diatur: catat bab (bila baru), tandai akhir, tampilkan baris pertama. */
function tampilkan(ep: Episode, d: StateCerita, babBaru: boolean): void {
  const n = ambilNode(ep, d.node)!;
  if (n.jenis === 'akhir') d.akhir = n.akhir;
  if (babBaru) d.riwayat.push({ jenis: 'bab', bab: n.bab });
  barisBerikut(ep, d);
}

/** Masuk node `target` (efek sudah diterapkan). false = rujukan rusak -> pemanggil mengembalikan state lama. */
function masuk(ep: Episode, d: StateCerita, target: IdNode): boolean {
  const id = resolusi(ep, d, target);
  if (id === null) return false;
  const babLama = ambilNode(ep, d.node)?.bab;
  const n = ambilNode(ep, id)!;
  d.node = id;
  d.baris = 0;
  d.umpanBalik = null;
  const babBaru = n.bab !== babLama;
  if (babBaru && !ada(d.cadangan, n.bab)) d.cadangan[n.bab] = potret(d);
  tampilkan(ep, d, babBaru);
  return true;
}

function awal(ep: Episode, langkah: number): StateCerita {
  const d: StateCerita = {
    format: 1,
    episode: ep.id,
    versi: ep.versi,
    node: '',
    baris: 0,
    tanda: [],
    kepercayaan: ep.kepercayaanAwal,
    paham: [],
    proses: {},
    catatan: [],
    keputusan: [],
    aktivitas: {},
    umpanBalik: null,
    terakhir: null,
    riwayat: [],
    akhir: null,
    langkah,
    cadangan: {},
  };
  if (!masuk(ep, d, ep.mulai)) d.node = ep.mulai;
  return d;
}

// ------------------------------------------------------------------ API mesin

/** State awal episode: node `mulai` (cabang diikuti), baris pertama tampil, cadangan bab pertama tercatat. */
export function stateAwal(ep: Episode): StateCerita {
  return awal(ep, 0);
}

/** Reducer murni. Aksi tidak sah -> state yang SAMA (===). Aksi sah -> objek baru dengan `langkah` + 1. */
export function jalankan(ep: Episode, s: StateCerita, aksi: AksiCerita): StateCerita {
  if (!aksi || typeof aksi !== 'object') return s;
  if (aksi.jenis === 'mulaiUlang') return { ...awal(ep, 0), langkah: s.langkah + 1 };
  if (s.episode !== ep.id) return s;

  switch (aksi.jenis) {
    case 'lanjut': {
      const n = nodeKini(ep, s);
      if (!n) return s;
      const d = draf(s);
      if (n.jenis === 'aktivitas' && s.umpanBalik) {
        const c = s.umpanBalik.node === s.node ? n.hasil[s.umpanBalik.cabang] : undefined;
        if (!c) return s;
        d.terakhir = null;
        return masuk(ep, d, c.lanjut) ? d : s;
      }
      if (barisBerikut(ep, d)) return d;
      if (n.jenis !== 'dialog') return s;
      const alasan = terapkanEfek(ep, d, n.efek, s.node);
      if (alasan) d.riwayat.push(alasan);
      d.terakhir = null;
      return masuk(ep, d, n.lanjut) ? d : s;
    }

    case 'pilih': {
      const n = nodeKini(ep, s);
      if (!n || n.jenis !== 'pilihan' || aksi.node !== s.node) return s;
      if (s.baris < barisTerlihat(ep, s, n).length) return s;
      const p = pilihanTersedia(ep, s, n).find((x) => x.id === aksi.pilihan);
      if (!p) return s;
      const d = draf(s);
      d.riwayat.push({ jenis: 'pilihan', node: s.node, pilihan: p.id, teks: p.teks });
      const alasan = terapkanEfek(ep, d, p.efek, s.node);
      if (alasan) d.riwayat.push(alasan);
      d.keputusan.push({ node: s.node, pilihan: p.id, langkah: d.langkah });
      d.terakhir = alasan ? { teks: p.teks, alasan: alasan.teks, arah: alasan.arah } : { teks: p.teks };
      return masuk(ep, d, p.lanjut) ? d : s;
    }

    case 'aktivitas': {
      const n = nodeKini(ep, s);
      if (!n || n.jenis !== 'aktivitas' || aksi.node !== s.node) return s;
      if (s.umpanBalik || ada(s.aktivitas, n.aktivitas)) return s;
      if (s.baris < barisTerlihat(ep, s, n).length) return s;
      const def = ada(ep.aktivitas, n.aktivitas) ? ep.aktivitas[n.aktivitas]! : null;
      if (!def) return s;
      const hasil = nilaiAktivitas(ep, def, aksi.jawaban);
      const d = draf(s);
      tambahUnik(d.tanda, hasil.tanda);
      const i = n.hasil.findIndex((c) => cocok(c.jika, d));
      if (i < 0) return s;
      const cabang = n.hasil[i]!;
      d.aktivitas[n.aktivitas] = hasil;
      d.riwayat.push({ jenis: 'aktivitas', node: s.node, aktivitas: n.aktivitas, akurasi: hasil.akurasi });
      if (n.langsung) {
        // Akibat langsung: sama dengan memilih (alasan -> [bab baru] -> baris pertama node akibat), tanpa pembahasan.
        const alasan = terapkanEfek(ep, d, cabang.efek, s.node);
        if (alasan) d.riwayat.push(alasan);
        d.umpanBalik = null;
        d.terakhir = alasan ? { teks: def.labelKirim, alasan: alasan.teks, arah: alasan.arah } : null;
        return masuk(ep, d, cabang.lanjut) ? d : s;
      }
      d.umpanBalik = { node: s.node, cabang: i };
      d.terakhir = null;
      const alasan = terapkanEfek(ep, d, cabang.efek, s.node);
      for (const b of (cabang.umpanBalik ?? []).filter((x) => cocok(x.jika, d))) {
        d.riwayat.push({ jenis: 'baris', node: s.node, siapa: b.siapa, ...(b.ekspresi ? { ekspresi: b.ekspresi } : {}), teks: b.teks });
      }
      if (alasan) d.riwayat.push(alasan);
      return d;
    }

    case 'ulangBab': {
      const snap = ada(s.cadangan, aksi.bab) ? s.cadangan[aksi.bab]! : null;
      if (!snap || !ambilNode(ep, snap.node) || ambilNode(ep, snap.node)!.jenis === 'cabang') return s;
      const urutan = ep.bab.map((b) => b.id);
      const batas = urutan.indexOf(aksi.bab);
      const cadangan: StateCerita['cadangan'] = {};
      for (const [bab, c] of Object.entries(s.cadangan)) {
        const i = urutan.indexOf(bab);
        if (bab === aksi.bab || (i >= 0 && batas >= 0 && i <= batas)) cadangan[bab] = c;
      }
      const d = draf({ ...snap, cadangan, langkah: s.langkah, akhir: null, baris: 0, umpanBalik: null });
      tampilkan(ep, d, true);
      return d;
    }

    default:
      return s;
  }
}

// ------------------------------------------------------------------ ringkasan akhir

/**
 * Ringkasan untuk layar akhir, dua sisi terpisah: komunikasi (alasan perubahan suasana, urut kejadian)
 * dan ketepatan langkah klaim (proses). Selalu mengembalikan objek; `akhir` = '' bila episode belum selesai.
 */
export function ringkasanAkhir(ep: Episode, s: StateCerita): RingkasanAkhir {
  const komunikasi: RingkasanAkhir['komunikasi'] = [];
  for (const e of s.riwayat) if (e.jenis === 'alasan') komunikasi.push({ teks: e.teks, arah: e.arah });
  return {
    akhir: (s.akhir ?? '') as IdAkhir,
    suasana: suasanaNasabah(ep, s),
    komunikasi,
    paham: Object.entries(ep.paham).map(([id, label]) => ({ id, label, sudah: s.paham.includes(id) })),
    proses: Object.entries(ep.proses).map(([id, label]) => ({ id, label, nilai: ada(s.proses, id) ? s.proses[id]! : null })),
    keputusan: [...s.keputusan],
  };
}
