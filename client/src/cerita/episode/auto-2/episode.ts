/**
 * EPISODE AUTO-2 "Truk Trailer di Jalan Tol": kasus nyata yang disamarkan (naskah draf "Skenario Auto 01", 15 babak),
 * dimainkan solo dengan mesin Mode Cerita yang sama dengan Episode 1, lewat antarmuka HP (`antarmuka: 'hp'`, cerita/hp).
 *
 * Bentuk: pembuka Miss Raksa -> 15 TITIK KEPUTUSAN naskah dalam 4 bagian -> cabang status -> 3 akhir. Tiap titik punya
 * lima alternatif naskah A-E (klasifikasi & perubahan status dari naskah). Dua penyajian, satu pemetaan:
 *  - percakapan (`pilihan`): lima balasan; balasan = alternatif (urutan tampil tetap per titik, posisi saran berbeda-beda);
 *  - tindakan pada objek (`aktivitas` + `langsung`; arena HP, lihat ./arena.ts dan cerita/hp/arena): susunan LENGKAP
 *    dipetakan oleh aturan berurutan (pertama yang cocok) ke tepat satu alternatif. Aturan & alasannya: ATURAN_* di
 *    bawah dan matriks keputusan (dokumen privat).
 * Setiap alternatif memasang tanda `kep:<titik>:<alt>` (ringkasan akhir) dan efek status dengan alasan netral; akibatnya
 * tampil sebagai node dialog `<titik>-<alt>` sebelum titik berikutnya.
 *
 * Status nasabah 0-100 (mulai 30, dijepit), lima suasana; titik kunci 6, 12, 14 berbobot ganda (naskah). Janji
 * "pasti beres sebelum tanggal 20" (titik 12-A): +4 saat itu dan tanda `janji-20`; cabang `k14-cek` memutar protes Pak
 * Hendra (efek -12) SEKALI saat memasuki babak 14 (efek node dialog diterapkan sekali saat transisi; muat ulang tidak
 * menerapkannya lagi). Akhir hanya dari status akhir (Puas >= 70, Selesai dengan catatan 45-69, Kurang puas < 45);
 * ketiganya menyatakan klaim DIBAYAR. Mode solo tanpa timer: "waktu habis" naskah tidak dipakai di sini.
 */
import type {
  Baris, CueLatar, Efek, Ekspresi, Episode, IdNode, Kondisi, KonfigLatar, NilaiAlternatif, NodeCerita, TitikKeputusan,
} from '../../tipe';
import { AKTIVITAS_AUTO_2 } from './aktivitas';
import { LAMPIRAN_AUTO_2, SENI_ARENA_AUTO_2 } from './arena';
import { TEKS_AUTO_2 } from './teks';

// ------------------------------------------------------------------ pembantu data

type Siapa = 'missRaksa' | 'hendra' | 'rudi' | 'bima' | 'darto' | 'admin' | 'pemain' | 'narasi';

/** Baris dengan kunci teks `kunci`. */
function b(kunci: string, siapa: Siapa, ekspresi?: Ekspresi, opsi: { jika?: Kondisi; istilah?: string[]; tata?: CueLatar; lampiran?: string; topik?: string } = {}): Baris {
  const baris: Baris = { siapa, teks: kunci };
  if (ekspresi) baris.ekspresi = ekspresi;
  if (opsi.jika) baris.jika = opsi.jika;
  if (opsi.istilah?.length) baris.istilah = opsi.istilah;
  if (opsi.tata) baris.tata = opsi.tata;
  if (opsi.lampiran) baris.lampiran = opsi.lampiran;
  if (opsi.topik) baris.topik = opsi.topik;
  return baris;
}

/** Baris akibat K11: sisi BERKAS (tindakan atas bundel) dan sisi KABAR (komunikasi), masing-masing berlabel topik. */
const berkas11 = (tindakan: string): Baris => b(`k11.akibat.berkas.${tindakan}`, 'narasi', undefined, { topik: 'topik.berkas' });
const kabar11 = (akhiran: string): Baris => b(`k11.akibat.kabar.${akhiran}`, 'narasi', undefined, { topik: 'topik.kabar' });

const tanda = (t: string): Kondisi => ({ tanda: t });
const tidak = (k: Kondisi): Kondisi => ({ tidak: k });
const semua = (...k: Kondisi[]): Kondisi => ({ semua: k });
const salahSatu = (...k: Kondisi[]): Kondisi => ({ salahSatu: k });
/** Item `item` aktivitas `akt` ditaruh di wadah `wadah` (tanda susunan dari mesin). */
const taruh = (akt: string, item: string, wadah: string): Kondisi => tanda(`akt:${akt}:taruh:${item}:${wadah}`);
/** Opsi `opsi` dipilih di langkah pilih-satu aktivitas `akt`. */
const pilih = (akt: string, opsi: string): Kondisi => tanda(`akt:${akt}:pilih:${opsi}`);

/** Tata panggung latar yang sering dipakai. */
const TELEPON_HENDRA: CueLatar = { lokasi: 'kantor', hadir: [], telepon: 'hendra' };

interface Alternatif {
  nilai: NilaiAlternatif;
  /** Perubahan status nasabah (naskah). */
  delta: number;
  /** Baris akibat (node `<titik>-<alt>`). */
  akibat: Baris[];
  tata?: CueLatar;
  pasang?: string[];
  catat?: string[];
}

/** Efek satu alternatif: status + alasan netral + tanda ringkasan `kep:<titik>:<alt>` (+ tanda/catatan tambahan). */
function efekAlt(titik: string, alt: string, a: Alternatif, alasan = `${titik}.${alt}.alasan`, catat: string[] = []): Efek {
  const efek: Efek = { kepercayaan: a.delta, alasan, pasang: [`kep:${titik}:${alt}`, ...(a.pasang ?? [])] };
  const semuaCatat = [...catat, ...(a.catat ?? [])];
  if (semuaCatat.length) efek.catat = semuaCatat;
  return efek;
}

/** Titik keputusan bernomor (urut naskah), diisi pembangun titik: klasifikasi & saran berasal dari alternatif yang sama. */
const TITIK: TitikKeputusan[] = [];

function daftarTitik(id: string, alt: Record<string, Alternatif>): void {
  const saran = Object.keys(alt).filter((x) => alt[x]!.nilai === 'tepat');
  if (saran.length !== 1) throw new Error(`titik ${id}: harus tepat satu alternatif 'tepat'`);
  TITIK.push({
    id,
    nomor: Number(id.slice(1)),
    judul: `titik.${id}.judul`,
    alternatif: Object.fromEntries(Object.keys(alt).sort().map((x) => [x, { label: `titik.${id}.${x}`, nilai: alt[x]!.nilai }])),
    saran: saran[0]!,
    alasan: `titik.${id}.alasan`,
  });
}

/** Node akibat `<titik>-<akhiran>` (dialog) lalu `lanjut`. */
function nodeAkibat(id: IdNode, bab: string, a: Alternatif, lanjut: IdNode, baris = a.akibat, tata = a.tata): NodeCerita {
  return { id, bab, jenis: 'dialog', baris, ...(tata ? { tata } : {}), lanjut };
}

interface TitikPilihan {
  id: string;
  bab: string;
  tata?: CueLatar;
  baris: Baris[];
  /** Urutan tampil balasan (tetap; posisi alternatif yang disarankan berbeda-beda antartitik). */
  urutan: string[];
  alt: Record<string, Alternatif>;
  dokumen?: string;
  catat?: string[];
  lanjut: IdNode;
}

/** Titik keputusan berupa balasan percakapan: node pilihan + lima node akibat. */
function titikPilihan(p: TitikPilihan): NodeCerita[] {
  daftarTitik(p.id, p.alt);
  const pilihan: NodeCerita = {
    id: p.id,
    bab: p.bab,
    jenis: 'pilihan',
    ...(p.tata ? { tata: p.tata } : {}),
    baris: p.baris,
    tanya: `${p.id}.tanya`,
    ...(p.dokumen ? { dokumen: p.dokumen } : {}),
    pilihan: p.urutan.map((alt) => ({ id: alt, teks: `${p.id}.${alt}`, efek: efekAlt(p.id, alt, p.alt[alt]!, undefined, p.catat), lanjut: `${p.id}-${alt}` })),
  };
  return [pilihan, ...p.urutan.map((alt) => nodeAkibat(`${p.id}-${alt}`, p.bab, p.alt[alt]!, p.lanjut))];
}

/** Satu aturan pemetaan susunan -> alternatif. Tanpa `jika` = sisa (harus paling akhir). */
interface Aturan {
  jika?: Kondisi;
  alt: string;
  /** Node akibat lain untuk alternatif yang sama (akibat yang tepat untuk susunan ini), mis. 'k09-a2'. */
  akibat?: string;
  alasan?: string;
}

interface TitikAktivitas {
  id: string;
  bab: string;
  tata?: CueLatar;
  baris: Baris[];
  aktivitas: string;
  aturan: Aturan[];
  alt: Record<string, Alternatif>;
  /** Akibat tambahan (akhiran -> baris, tata sendiri bila beda dengan alternatifnya) untuk aturan ber-`akibat`. */
  akibatLain?: Record<string, { alt: string; baris: Baris[]; tata?: CueLatar }>;
  catat?: string[];
  lanjut: IdNode;
}

/** Titik keputusan berupa tindakan pada objek: node aktivitas `langsung` + node akibat per alternatif. */
function titikAktivitas(p: TitikAktivitas): NodeCerita[] {
  daftarTitik(p.id, p.alt);
  const node: NodeCerita = {
    id: p.id,
    bab: p.bab,
    jenis: 'aktivitas',
    aktivitas: p.aktivitas,
    langsung: true,
    ...(p.tata ? { tata: p.tata } : {}),
    baris: p.baris,
    hasil: p.aturan.map((r) => ({
      ...(r.jika ? { jika: r.jika } : {}),
      efek: efekAlt(p.id, r.alt, p.alt[r.alt]!, r.alasan, p.catat),
      lanjut: `${p.id}-${r.akibat ?? r.alt}`,
    })),
  };
  const akibat = Object.keys(p.alt).map((alt) => nodeAkibat(`${p.id}-${alt}`, p.bab, p.alt[alt]!, p.lanjut));
  const lain = Object.entries(p.akibatLain ?? {}).map(([akhiran, x]) => nodeAkibat(`${p.id}-${akhiran}`, p.bab, p.alt[x.alt]!, p.lanjut, x.baris, x.tata ?? p.alt[x.alt]!.tata));
  return [node, ...akibat, ...lain];
}

// ------------------------------------------------------------------ aturan pemetaan tindakan -> alternatif

const PELENGKAP = ['kk', 'slip', 'rekening'];
const INTI = ['formulir', 'stnk', 'ktp', 'sim'];
/** K02: urut dari kekeliruan paling menentukan; sisa = susunan yang disarankan. */
export const ATURAN_BERKAS: Aturan[] = [
  { alt: 'e', jika: salahSatu(...PELENGKAP.flatMap((x) => [taruh('berkas', x, 'sekarang'), taruh('berkas', x, 'menyusul')])) },
  { alt: 'd', jika: taruh('berkas', 'suratpolisi', 'tidak') },
  { alt: 'c', jika: taruh('berkas', 'suratpolisi', 'sekarang') },
  { alt: 'a', jika: salahSatu(...INTI.map((x) => tidak(taruh('berkas', x, 'sekarang')))) },
  { alt: 'b' },
];
/** K04: satu objek, lima tujuan (satu tujuan = satu alternatif). */
export const ATURAN_SURVEYOR: Aturan[] = [
  { alt: 'a', jika: taruh('surveyor', 'rudi', 'kantor') },
  { alt: 'b', jika: taruh('surveyor', 'rudi', 'bengkel') },
  { alt: 'c', jika: taruh('surveyor', 'rudi', 'foto') },
  { alt: 'e', jika: taruh('surveyor', 'rudi', 'langganan') },
  { alt: 'd' },
];
/** K05: bundel foto, lima tujuan. */
export const ATURAN_FOTO: Aturan[] = [
  { alt: 'a', jika: taruh('foto', 'bundel', 'tunggu') },
  { alt: 'b', jika: taruh('foto', 'bundel', 'hendra') },
  { alt: 'c', jika: taruh('foto', 'bundel', 'lain') },
  { alt: 'd', jika: taruh('foto', 'bundel', 'diam') },
  { alt: 'e' },
];
/** K07: kartu pemeriksaan kejadian di rencana kerja. */
export const ATURAN_JALUR: Aturan[] = [
  { alt: 'a', jika: taruh('jalur', 'periksa', 'jelas') },
  { alt: 'b', jika: taruh('jalur', 'periksa', 'setelah') },
  { alt: 'c', jika: taruh('jalur', 'periksa', 'percaya') },
  { alt: 'e', jika: taruh('jalur', 'periksa', 'telepon') },
  { alt: 'd' },
];
/** K08: hasil hanya dari kesimpulan pemain (lima kalimat naskah, urutan c, e, a, d, b); tanda lajur dibaca tanggapan, bukan percabangan. */
export const ATURAN_RAMBU: Aturan[] = [
  { alt: 'a', jika: pilih('rambu', 'a') },
  { alt: 'b', jika: pilih('rambu', 'b') },
  { alt: 'c', jika: pilih('rambu', 'c') },
  { alt: 'd', jika: pilih('rambu', 'd') },
  { alt: 'e' },
];
const SAKSI = ['hendra', 'darto', 'tol', 'polisi'];
const diwawancara = (x: string) => taruh('saksi', x, 'ya');
/** K09: kartu saksi. Mencari pengemudi tak dikenal mendahului semuanya; tanpa wawancara; hanya supir; empat pihak; sisa. */
export const ATURAN_SAKSI: Aturan[] = [
  { alt: 'c', jika: diwawancara('mobilkecil') },
  { alt: 'd', jika: semua(...SAKSI.map((x) => tidak(diwawancara(x)))) },
  { alt: 'b', jika: semua(diwawancara('darto'), ...['hendra', 'tol', 'polisi'].map((x) => tidak(diwawancara(x)))) },
  { alt: 'e', jika: semua(...SAKSI.map(diwawancara)) },
  // Sebagian pihak: tanpa pihak resmi = akibat naskah A; dengan sebagian pihak resmi = varian A yang tetap benar.
  { alt: 'a', jika: semua(tidak(diwawancara('tol')), tidak(diwawancara('polisi'))) },
  { alt: 'a', akibat: 'a2', alasan: 'k09.a2.alasan' },
];
const SELISIH = ['jam', 'nama', 'antisipasi'];
const adaSelisih = (wadah: string) => salahSatu(...SELISIH.map((x) => taruh('selisih', x, wadah)));
/** K10: perlakuan paling berat yang dipakai untuk satu perbedaan menentukan akibatnya. */
export const ATURAN_SELISIH: Aturan[] = [
  { alt: 'a', jika: adaSelisih('tolak') },
  { alt: 'b', jika: adaSelisih('samakan') },
  { alt: 'e', jika: adaSelisih('abaikan') },
  { alt: 'c', jika: adaSelisih('ulang') },
  { alt: 'd' },
];
/** K11: kabar palsu "sudah disetujui" paling menentukan; lalu tindakan atas bundel; lalu kabar. */
/**
 * K11: ALTERNATIF per kombinasi (tindakan berkas x kabar) mengikuti urutan naskah: kabar "sudah disetujui" = D; laporan
 * ke Pak Hendra = E; ajukan tanpa surat polisi = B; tanpa kabar = C; sisa (lengkapi + tahap persetujuan) = A. Pemetaan
 * itu tidak berubah. Tiap kombinasi punya node akibat sendiri (`k11-<akhiran>`) yang menyebut akibat pada BERKAS dan
 * akibat pada KABAR untuk Pak Hendra, supaya penjelasannya benar untuk kombinasi itu (bukan satu kalimat untuk semua).
 */
export const KOMBINASI_BUNDEL: { bundel: string; kabar: string; alt: string; akibat: string }[] = [
  { bundel: 'lengkapi', kabar: 'persetujuan', alt: 'a', akibat: 'a' },
  { bundel: 'lengkapi', kabar: 'disetujui', alt: 'd', akibat: 'd' },
  { bundel: 'lengkapi', kabar: 'nanti', alt: 'c', akibat: 'c' },
  { bundel: 'sekarang', kabar: 'persetujuan', alt: 'b', akibat: 'b2' },
  { bundel: 'sekarang', kabar: 'disetujui', alt: 'd', akibat: 'd2' },
  { bundel: 'sekarang', kabar: 'nanti', alt: 'b', akibat: 'b' },
  { bundel: 'hendra', kabar: 'persetujuan', alt: 'e', akibat: 'e2' },
  { bundel: 'hendra', kabar: 'disetujui', alt: 'd', akibat: 'd3' },
  { bundel: 'hendra', kabar: 'nanti', alt: 'e', akibat: 'e' },
];
export const ATURAN_BUNDEL: Aturan[] = [
  ...KOMBINASI_BUNDEL.map((x) => ({ alt: x.alt, akibat: x.akibat, jika: semua(pilih('bundel', x.bundel), pilih('bundel', x.kabar)) })),
  { alt: 'a' },
];
const masuk = (x: string) => taruh('tutup', x, 'masuk');
/** K15: tanpa kabar = berkas ditutup diam-diam; lalu permintaan 5 bintang; tawaran polis; pesan lengkap; sisa = B. */
export const ATURAN_TUTUP: Aturan[] = [
  { alt: 'a', jika: tidak(masuk('kabar')) },
  { alt: 'd', jika: masuk('bintang') },
  { alt: 'e', jika: masuk('polis') },
  { alt: 'c', jika: semua(masuk('bukti'), masuk('langkah'), masuk('jujur')) },
  { alt: 'b' },
];

// ------------------------------------------------------------------ graf

const NODE: NodeCerita[] = [
  {
    id: 'buka',
    bab: 'b1',
    jenis: 'dialog',
    tata: { lokasi: 'kantor', hadir: ['missRaksa'], telepon: null, objek: [] },
    baris: [b('buka.1', 'missRaksa', 'tersenyum'), b('buka.2', 'missRaksa', 'netral'), b('buka.3', 'missRaksa', 'serius')],
    lanjut: 'k01',
  },

  // ---------------------------------------------------------------- Bagian 1: laporan awal (1-3)
  ...titikPilihan({
    id: 'k01', bab: 'b1', tata: TELEPON_HENDRA,
    baris: [b('k01.1', 'narasi'), b('k01.2', 'hendra', 'bingung')],
    urutan: ['d', 'b', 'a', 'e', 'c'],
    catat: ['laporan'],
    alt: {
      a: { nilai: 'tepat', delta: 6, akibat: [b('k01-a.1', 'hendra', 'lega'), b('k01-a.2', 'narasi', undefined, { lampiran: 'fotoTruk' })] },
      b: { nilai: 'keliru', delta: -3, akibat: [b('k01-b.1', 'hendra', 'lega'), b('k01-b.2', 'narasi')] },
      c: { nilai: 'keliru', delta: -6, akibat: [b('k01-c.1', 'hendra', 'kesal')] },
      d: { nilai: 'kurang', delta: 0, akibat: [b('k01-d.1', 'narasi')] },
      e: { nilai: 'kurang', delta: 0, akibat: [b('k01-e.1', 'hendra', 'bingung'), b('k01-e.2', 'narasi')] },
    },
    lanjut: 'k02',
  }),
  ...titikAktivitas({
    id: 'k02', bab: 'b1', tata: TELEPON_HENDRA, aktivitas: 'berkas',
    baris: [b('k02.1', 'narasi'), b('k02.2', 'hendra', 'cemas')],
    catat: ['suratpolisi'],
    aturan: ATURAN_BERKAS,
    alt: {
      a: { nilai: 'kurang', delta: 0, akibat: [b('k02-a.1', 'narasi'), b('k02-a.2', 'hendra', 'kesal')] },
      b: { nilai: 'tepat', delta: 6, tata: { objek: ['berkas'] }, akibat: [b('k02-b.1', 'hendra', 'lega'), b('k02-b.2', 'narasi')] },
      c: { nilai: 'keliru', delta: -6, akibat: [b('k02-c.1', 'narasi'), b('k02-c.2', 'hendra', 'cemas')] },
      d: { nilai: 'keliru', delta: -3, akibat: [b('k02-d.1', 'hendra', 'lega'), b('k02-d.2', 'narasi')] },
      e: { nilai: 'keliru', delta: -3, akibat: [b('k02-e.1', 'hendra', 'kesal'), b('k02-e.2', 'narasi')] },
    },
    lanjut: 'k03',
  }),
  ...titikPilihan({
    id: 'k03', bab: 'b1',
    baris: [b('k03.1', 'narasi'), b('k03.2', 'hendra', 'cemas')],
    urutan: ['b', 'c', 'e', 'a', 'd'],
    dokumen: 'proses',
    alt: {
      a: { nilai: 'keliru', delta: -6, akibat: [b('k03-a.1', 'hendra', 'lega'), b('k03-a.2', 'narasi')] },
      b: { nilai: 'kurang', delta: 0, akibat: [b('k03-b.1', 'hendra', 'cemas'), b('k03-b.2', 'narasi')] },
      c: { nilai: 'tepat', delta: 6, akibat: [b('k03-c.1', 'hendra', 'netral'), b('k03-c.2', 'narasi')] },
      d: { nilai: 'keliru', delta: -3, akibat: [b('k03-d.1', 'narasi')] },
      e: { nilai: 'kurang', delta: 0, akibat: [b('k03-e.1', 'narasi')] },
    },
    lanjut: 'k04',
  }),

  // ---------------------------------------------------------------- Bagian 2: survey dan estimasi (4-6)
  ...titikAktivitas({
    id: 'k04', bab: 'b2', aktivitas: 'surveyor',
    tata: { lokasi: 'pool', hadir: ['rudi'], telepon: null, objek: [] },
    baris: [b('k04.1', 'narasi', undefined, { istilah: ['surveyor'] }), b('k04.2', 'rudi')],
    catat: ['pool'],
    aturan: ATURAN_SURVEYOR,
    alt: {
      a: { nilai: 'keliru', delta: -6, tata: TELEPON_HENDRA, akibat: [b('k04-a.1', 'hendra', 'kesal'), b('k04-a.2', 'narasi')] },
      b: { nilai: 'kurang', delta: 0, akibat: [b('k04-b.1', 'narasi'), b('k04-b.2', 'rudi')] },
      c: { nilai: 'keliru', delta: -3, akibat: [b('k04-c.1', 'rudi'), b('k04-c.2', 'narasi')] },
      d: { nilai: 'tepat', delta: 6, akibat: [b('k04-d.1', 'narasi'), b('k04-d.2', 'hendra', 'lega', { tata: TELEPON_HENDRA })] },
      e: { nilai: 'keliru', delta: -6, akibat: [b('k04-e.1', 'narasi'), b('k04-e.2', 'rudi')] },
    },
    lanjut: 'k05',
  }),
  ...titikAktivitas({
    id: 'k05', bab: 'b2', aktivitas: 'foto',
    tata: { lokasi: 'bengkel', hadir: ['admin'], telepon: null, objek: [] },
    baris: [b('k05.1', 'narasi', undefined, { istilah: ['estimasi'] }), b('k05.2', 'admin')],
    catat: ['bengkel'],
    aturan: ATURAN_FOTO,
    alt: {
      a: { nilai: 'kurang', delta: 0, akibat: [b('k05-a.1', 'narasi'), b('k05-a.2', 'hendra', 'cemas', { tata: TELEPON_HENDRA })] },
      b: { nilai: 'keliru', delta: -6, tata: TELEPON_HENDRA, akibat: [b('k05-b.1', 'hendra', 'kesal'), b('k05-b.2', 'narasi')] },
      c: { nilai: 'kurang', delta: 0, akibat: [b('k05-c.1', 'narasi')] },
      d: { nilai: 'keliru', delta: -3, akibat: [b('k05-d.1', 'narasi')] },
      e: { nilai: 'tepat', delta: 6, tata: { objek: ['foto'] }, akibat: [b('k05-e.1', 'admin'), b('k05-e.2', 'narasi')] },
    },
    lanjut: 'k06',
  }),
  ...titikPilihan({
    id: 'k06', bab: 'b2', tata: { ...TELEPON_HENDRA, objek: [] },
    baris: [b('k06.1', 'narasi'), b('k06.2', 'hendra', 'cemas')],
    urutan: ['c', 'a', 'd', 'b', 'e'],
    dokumen: 'linimasa',
    alt: {
      a: { nilai: 'keliru', delta: -12, akibat: [b('k06-a.1', 'narasi'), b('k06-a.2', 'narasi')] },
      b: { nilai: 'tepat', delta: 12, akibat: [b('k06-b.1', 'hendra', 'lega'), b('k06-b.2', 'narasi')] },
      c: { nilai: 'kurang', delta: 0, akibat: [b('k06-c.1', 'hendra', 'cemas')] },
      d: { nilai: 'keliru', delta: -6, akibat: [b('k06-d.1', 'narasi')] },
      e: { nilai: 'keliru', delta: -6, akibat: [b('k06-e.1', 'hendra', 'kesal')] },
    },
    lanjut: 'k07',
  }),

  // ---------------------------------------------------------------- Bagian 3: pemeriksaan kejadian (7-11)
  ...titikAktivitas({
    id: 'k07', bab: 'b3', aktivitas: 'jalur',
    tata: { lokasi: 'kantor', hadir: ['bima'], telepon: null, objek: [] },
    baris: [b('k07.1', 'narasi', undefined, { istilah: ['pemeriksaan'] }), b('k07.2', 'bima')],
    aturan: ATURAN_JALUR,
    alt: {
      a: { nilai: 'keliru', delta: -3, akibat: [b('k07-a.1', 'narasi')] },
      b: { nilai: 'kurang', delta: 0, akibat: [b('k07-b.1', 'narasi')] },
      c: { nilai: 'keliru', delta: -6, akibat: [b('k07-c.1', 'bima')] },
      d: { nilai: 'tepat', delta: 6, akibat: [b('k07-d.1', 'bima'), b('k07-d.2', 'narasi')] },
      e: { nilai: 'kurang', delta: 0, akibat: [b('k07-e.1', 'bima')] },
    },
    lanjut: 'k08',
  }),
  // K08 = aktivitas arena 'rambu' (periksa rambu -> tandai lajur -> kesimpulan); id node & alternatif tetap, kesimpulan = alternatif.
  ...titikAktivitas({
    id: 'k08', bab: 'b3', aktivitas: 'rambu',
    tata: { lokasi: 'tol', hadir: ['bima'], telepon: null, objek: [] },
    baris: [b('k08.1', 'narasi'), b('k08.2', 'bima', 'serius')],
    aturan: ATURAN_RAMBU,
    catat: ['rambu', 'lajur2'],
    alt: {
      a: { nilai: 'keliru', delta: -6, akibat: [b('k08-a.1', 'narasi')] },
      b: { nilai: 'keliru', delta: -3, akibat: [b('k08-b.1', 'narasi')] },
      c: { nilai: 'tepat', delta: 6, akibat: [b('k08-c.1', 'narasi')] },
      d: { nilai: 'kurang', delta: 0, akibat: [b('k08-d.1', 'hendra', 'cemas', { tata: TELEPON_HENDRA }), b('k08-d.2', 'narasi')] },
      e: { nilai: 'kurang', delta: 0, akibat: [b('k08-e.1', 'narasi')] },
    },
    lanjut: 'k09',
  }),
  ...titikAktivitas({
    id: 'k09', bab: 'b3', aktivitas: 'saksi',
    tata: { lokasi: 'wawancara', hadir: ['bima'], telepon: null, objek: [] },
    baris: [b('k09.1', 'narasi'), b('k09.2', 'bima')],
    catat: ['mobilkecil'],
    aturan: ATURAN_SAKSI,
    alt: {
      a: { nilai: 'kurang', delta: 0, akibat: [b('k09-a.1', 'narasi')] },
      b: { nilai: 'keliru', delta: -6, akibat: [b('k09-b.1', 'narasi')] },
      c: { nilai: 'kurang', delta: 0, akibat: [b('k09-c.1', 'narasi')] },
      d: { nilai: 'keliru', delta: -3, akibat: [b('k09-d.1', 'narasi')] },
      // Empat pihak terkumpul: dua saksi resmi tampil bersama Pak Bima (Pak Darto muncul di babak 10).
      e: { nilai: 'tepat', delta: 6, tata: { hadir: ['tol', 'bima', 'polisi'] }, akibat: [b('k09-e.1', 'narasi')] },
    },
    akibatLain: { a2: { alt: 'a', baris: [b('k09-a.2', 'narasi')] } },
    lanjut: 'k10',
  }),
  ...titikAktivitas({
    id: 'k10', bab: 'b3', aktivitas: 'selisih',
    tata: { lokasi: 'wawancara', hadir: ['bima', 'darto'], telepon: null, objek: [] },
    baris: [b('k10.1', 'narasi'), b('k10.2', 'bima', 'serius')],
    catat: ['selisih'],
    aturan: ATURAN_SELISIH,
    alt: {
      a: { nilai: 'keliru', delta: -6, akibat: [b('k10-a.1', 'narasi')] },
      b: { nilai: 'keliru', delta: -6, akibat: [b('k10-b.1', 'narasi')] },
      c: { nilai: 'kurang', delta: 0, akibat: [b('k10-c.1', 'narasi')] },
      d: { nilai: 'tepat', delta: 6, akibat: [b('k10-d.1', 'narasi')] },
      e: { nilai: 'keliru', delta: -3, akibat: [b('k10-e.1', 'narasi')] },
    },
    lanjut: 'k11',
  }),
  ...titikAktivitas({
    id: 'k11', bab: 'b3', aktivitas: 'bundel',
    tata: { lokasi: 'kantor', hadir: [], telepon: null, objek: ['berkas'] },
    baris: [b('k11.1', 'narasi', undefined, { istilah: ['komite'] })],
    aturan: ATURAN_BUNDEL,
    // Akibat: BERKAS dulu, lalu KABAR. Kabar terkirim = obrolan (pesanmu tampil sebagai pesan terkirim, lalu reaksi
    // Pak Hendra); tanpa pesan = tetap di kantor. Status nasabah = alternatifnya (naskah), tampil sesudah akibat.
    alt: {
      a: { nilai: 'tepat', delta: 6, tata: TELEPON_HENDRA, akibat: [berkas11('lengkapi'), b('k11-a.3', 'hendra', 'lega'), kabar11('a')] },
      b: { nilai: 'keliru', delta: -6, akibat: [berkas11('sekarang'), kabar11('b')] },
      c: { nilai: 'kurang', delta: 0, akibat: [berkas11('lengkapi'), kabar11('c')] },
      d: { nilai: 'keliru', delta: -6, tata: TELEPON_HENDRA, akibat: [berkas11('lengkapi'), b('k11-d.1', 'hendra', 'senang'), kabar11('d')] },
      e: { nilai: 'kurang', delta: 0, akibat: [berkas11('hendra'), kabar11('e')] },
    },
    akibatLain: {
      b2: { alt: 'b', tata: TELEPON_HENDRA, baris: [berkas11('sekarang'), kabar11('b2')] },
      d2: { alt: 'd', baris: [berkas11('sekarang'), b('k11-d.1', 'hendra', 'senang'), kabar11('d2')] },
      d3: { alt: 'd', baris: [berkas11('hendra'), b('k11-d.1', 'hendra', 'senang'), kabar11('d3')] },
      e2: { alt: 'e', tata: TELEPON_HENDRA, baris: [berkas11('hendra'), kabar11('e2')] },
    },
    lanjut: 'k12',
  }),

  // ---------------------------------------------------------------- Bagian 4: keputusan dan penyelesaian (12-15)
  ...titikPilihan({
    id: 'k12', bab: 'b4', tata: { ...TELEPON_HENDRA, objek: [] },
    baris: [b('k12.1', 'narasi'), b('k12.2', 'hendra', 'cemas')],
    urutan: ['d', 'b', 'e', 'a', 'c'],
    catat: ['cicilan'],
    alt: {
      a: { nilai: 'keliru', delta: 4, pasang: ['janji-20'], catat: ['janji20'], akibat: [b('k12-a.1', 'hendra', 'lega'), b('k12-a.2', 'narasi')] },
      b: { nilai: 'tepat', delta: 12, akibat: [b('k12-b.1', 'hendra', 'netral'), b('k12-b.2', 'narasi')] },
      c: { nilai: 'keliru', delta: -12, akibat: [b('k12-c.1', 'hendra', 'kesal'), b('k12-c.2', 'narasi')] },
      d: { nilai: 'kurang', delta: 0, akibat: [b('k12-d.1', 'narasi')] },
      e: { nilai: 'keliru', delta: -6, akibat: [b('k12-e.1', 'narasi')] },
    },
    lanjut: 'k13',
  }),
  ...titikPilihan({
    id: 'k13', bab: 'b4', tata: { ...TELEPON_HENDRA, objek: ['surat'] },
    baris: [b('k13.1', 'narasi', undefined, { istilah: ['penawaran', 'leasing'] }), b('k13.2', 'hendra', 'cemas')],
    urutan: ['d', 'a', 'c', 'e', 'b'],
    dokumen: 'surat',
    catat: ['leasing'],
    alt: {
      a: { nilai: 'kurang', delta: 0, akibat: [b('k13-a.1', 'narasi')] },
      b: { nilai: 'keliru', delta: -6, akibat: [b('k13-b.1', 'hendra', 'kesal'), b('k13-b.2', 'narasi')] },
      c: { nilai: 'keliru', delta: -6, akibat: [b('k13-c.1', 'narasi')] },
      d: { nilai: 'kurang', delta: 0, akibat: [b('k13-d.1', 'narasi')] },
      e: { nilai: 'tepat', delta: 6, akibat: [b('k13-e.1', 'hendra', 'netral'), b('k13-e.2', 'narasi')] },
    },
    lanjut: 'k14-cek',
  }),
  // Konsekuensi tertunda janji tanggal 20 (titik 12-A): protes sekali di awal babak 14.
  { id: 'k14-cek', bab: 'b4', jenis: 'cabang', cabang: [{ jika: tanda('janji-20'), lanjut: 'k14-janji' }], lainnya: 'k14' },
  {
    id: 'k14-janji',
    bab: 'b4',
    jenis: 'dialog',
    tata: { ...TELEPON_HENDRA, objek: [] },
    baris: [b('k14.janji.1', 'hendra', 'kesal')],
    efek: { kepercayaan: -12, alasan: 'k14.janji.alasan', pasang: ['janji-20-ditagih'] },
    lanjut: 'k14',
  },
  ...titikPilihan({
    id: 'k14', bab: 'b4', tata: { ...TELEPON_HENDRA, objek: [] },
    baris: [b('k14.1', 'narasi'), b('k14.2', 'hendra', 'kesal')],
    urutan: ['e', 'a', 'd', 'b', 'c'],
    dokumen: 'banding',
    catat: ['keberatan'],
    alt: {
      a: { nilai: 'keliru', delta: -12, akibat: [b('k14-a.1', 'hendra', 'kesal')] },
      b: { nilai: 'keliru', delta: -6, akibat: [b('k14-b.1', 'narasi')] },
      c: { nilai: 'tepat', delta: 12, akibat: [b('k14-c.1', 'hendra', 'netral'), b('k14-c.2', 'narasi')] },
      d: { nilai: 'kurang', delta: 0, akibat: [b('k14-d.1', 'narasi')] },
      e: { nilai: 'keliru', delta: -6, akibat: [b('k14-e.1', 'narasi')] },
    },
    lanjut: 'k15',
  }),
  ...titikAktivitas({
    id: 'k15', bab: 'b4', aktivitas: 'tutup',
    // Pesan penutupan disusun di obrolan WhatsApp dengan Pak Hendra (antarmuka HP), jadi lawan bicaranya sudah di ponsel.
    tata: { lokasi: 'kantor', hadir: [], telepon: 'hendra', objek: [] },
    baris: [b('k15.1', 'narasi')],
    aturan: ATURAN_TUTUP,
    alt: {
      a: { nilai: 'keliru', delta: -6, akibat: [b('k15-a.1', 'narasi'), b('k15-a.2', 'hendra', 'kesal', { tata: TELEPON_HENDRA })] },
      b: {
        nilai: 'kurang', delta: 2, tata: TELEPON_HENDRA,
        akibat: [
          b('k15-b.1', 'hendra', 'lega'),
          b('k15-b.bukti', 'narasi', undefined, { jika: tidak(masuk('bukti')) }),
          b('k15-b.langkah', 'narasi', undefined, { jika: tidak(masuk('langkah')) }),
          b('k15-b.nilai', 'narasi', undefined, { jika: semua(masuk('bukti'), masuk('langkah'), tidak(masuk('jujur'))) }),
        ],
      },
      c: { nilai: 'tepat', delta: 6, tata: TELEPON_HENDRA, akibat: [b('k15-c.1', 'hendra', 'senang'), b('k15-c.2', 'narasi', undefined, { istilah: ['penilaian'] })] },
      d: { nilai: 'keliru', delta: -6, tata: TELEPON_HENDRA, akibat: [b('k15-d.1', 'narasi')] },
      e: { nilai: 'kurang', delta: 0, tata: TELEPON_HENDRA, akibat: [b('k15-e.1', 'narasi')] },
    },
    lanjut: 'akhir-cek',
  }),

  // ---------------------------------------------------------------- akhir: hanya dari status akhir (klaim selalu dibayar)
  {
    id: 'akhir-cek',
    bab: 'b4',
    jenis: 'cabang',
    cabang: [{ jika: { kepercayaan: { min: 70 } }, lanjut: 'akhir-puas' }, { jika: { kepercayaan: { min: 45 } }, lanjut: 'akhir-catatan' }],
    lainnya: 'akhir-kurang',
  },
  ...(['puas', 'catatan', 'kurang'] as const).map((akhir): NodeCerita => ({
    id: `akhir-${akhir}`,
    bab: 'b4',
    jenis: 'akhir',
    akhir,
    tata: { lokasi: 'kantor', hadir: ['missRaksa'], telepon: 'hendra', objek: [] },
    // Pak Hendra lebih dulu (wajah akhir = perasaannya, bukan "sesudahnya"), lalu fakta pembayaran, lalu Miss Raksa.
    baris: [
      b(`akhir.${akhir}.1`, 'hendra', akhir === 'puas' ? 'senang' : akhir === 'catatan' ? 'netral' : 'kesal'),
      b('akhir.bayar', 'narasi'),
      b(`akhir.${akhir}.2`, 'missRaksa', akhir === 'puas' ? 'tersenyum' : 'serius'),
    ],
  })),
];

// ------------------------------------------------------------------ latar, dokumen, istilah, akhir

const LATAR: KonfigLatar = {
  lokasi: {
    // Kantor = interior pilihan pemilik (tokoh di balik meja); lapangan = latar masing-masing (bukan interior kantor),
    // tokoh berdiri berbadan penuh.
    // T-013: semua lokasi di panggung piksel (ruang <lokasi>-ep2, seni/piksel/ruang-ep2.json); panggung ilustrasi dihapus di Stage 3.
    kantor: { nama: 'lokasi.kantor', piksel: 'kantor-ep2' },
    pool: { nama: 'lokasi.pool', piksel: 'pool-ep2' },
    bengkel: { nama: 'lokasi.bengkel', piksel: 'bengkel-ep2' },
    tol: { nama: 'lokasi.tol', piksel: 'tol-ep2' },
    wawancara: { nama: 'lokasi.wawancara', piksel: 'wawancara-ep2' },
  },
  awal: { lokasi: 'kantor', hadir: ['missRaksa'], telepon: null, objek: [] },
  // Sampul: truk trailer yang ringsek + Pak Hendra di depannya (identitas kendaraan kasus terbaca, review staf #7).
  sampul: { lokasi: 'pool', hadir: ['hendra'] },
};

/** Dokumen di atas pilihan: id -> judul + baris `dok.<id>.<n>` / `dok.<id>.<n>.isi`. */
const dokumen = (id: string, n: number) => ({
  judul: `dok.${id}.judul`,
  baris: Array.from({ length: n }, (_, i) => ({ label: `dok.${id}.${i + 1}`, nilai: `dok.${id}.${i + 1}.isi` })),
  catatan: `dok.${id}.catatan`,
});

const istilah = (...id: string[]) => Object.fromEntries(id.map((x) => [x, { label: `istilah.${x}.label`, arti: `istilah.${x}.arti` }]));

export const EPISODE_AUTO_2: Episode = {
  id: 'auto-2',
  versi: 1,
  produk: 'AUTO',
  judul: 'judul',
  ringkas: 'ringkas',
  // Diukur dari alur: ±1.900 kata wajib dibaca (pembuka, 15 titik, satu jalur akibat, akhir) pada ±180 kata/menit
  // ditambah 8 aktivitas ±40 detik; lihat matriks keputusan. Bukan salinan ±8 menit Episode 1.
  durasiMenit: 17,
  mulai: 'buka',
  pemeran: {
    missRaksa: { nama: 'pemeran.missRaksa.nama', peran: 'pemeran.missRaksa.peran', potret: 'missRaksa' },
    hendra: { nama: 'pemeran.hendra.nama', peran: 'pemeran.hendra.peran', potret: 'nasabah', diPanggung: true },
    rudi: { nama: 'pemeran.rudi.nama', peran: 'pemeran.rudi.peran', potret: 'tokoh' },
    bima: { nama: 'pemeran.bima.nama', peran: 'pemeran.bima.peran', potret: 'tokoh' },
    darto: { nama: 'pemeran.darto.nama', peran: 'pemeran.darto.peran', potret: 'tokoh' },
    admin: { nama: 'pemeran.admin.nama', peran: 'pemeran.admin.peran', potret: 'tokoh' },
    tol: { nama: 'pemeran.tol.nama', peran: 'pemeran.tol.peran', potret: 'tokoh' },
    polisi: { nama: 'pemeran.polisi.nama', peran: 'pemeran.polisi.peran', potret: 'tokoh' },
  },
  nasabah: 'hendra',
  bab: (['b1', 'b2', 'b3', 'b4'] as const).map((id) => ({ id, judul: `bab.${id}.judul`, tujuan: `bab.${id}.tujuan` })),
  akhir: {
    puas: { judul: 'akhir.puas.judul', ringkas: 'akhir.puas.ringkas', nada: 'baik', pelajaran: ['akhir.pelajaran.1', 'akhir.pelajaran.2'] },
    catatan: { judul: 'akhir.catatan.judul', ringkas: 'akhir.catatan.ringkas', nada: 'campuran', pelajaran: ['akhir.pelajaran.1', 'akhir.pelajaran.2'] },
    kurang: { judul: 'akhir.kurang.judul', ringkas: 'akhir.kurang.ringkas', nada: 'buruk', pelajaran: ['akhir.pelajaran.1', 'akhir.pelajaran.2'] },
  },
  paham: {},
  proses: {},
  catatan: Object.fromEntries(
    ['laporan', 'suratpolisi', 'pool', 'bengkel', 'rambu', 'lajur2', 'mobilkecil', 'selisih', 'cicilan', 'janji20', 'leasing', 'keberatan'].map((x) => [x, `catatan.${x}`]),
  ),
  kepercayaanAwal: 30,
  kepercayaanBatas: { min: 0, maks: 100 },
  // Label panggung = status kumulatif (skala naskah), wajah sprite = emosi sesaat (review staf #6).
  labelSuasana: 'status',
  // Mobile-first (cerita/hp): obrolan WhatsApp dengan Pak Hendra, adegan tatap muka ringkas, aktivitas di arena visual.
  antarmuka: 'hp',
  seniArena: SENI_ARENA_AUTO_2,
  lampiran: LAMPIRAN_AUTO_2,
  // Cut-in potret di obrolan (momen emosional terpilih): kecemasan awal, beban cicilan & tanggal 20, protes janji (hanya
  // bila janji 12-A dibuat), dan kabar penyelesaian. Bukan tiap pesan.
  cutIn: ['k01.2', 'k12.2', 'k14.janji.1', 'akhir.puas.1', 'akhir.catatan.1', 'akhir.kurang.1'],
  suasana: [
    { min: 80, ekspresi: 'senang', label: 'suasana.puas' },
    { min: 60, ekspresi: 'lega', label: 'suasana.percaya' },
    { min: 40, ekspresi: 'netral', label: 'suasana.tenang' },
    { min: 20, ekspresi: 'cemas', label: 'suasana.cemas' },
    { min: 0, ekspresi: 'kesal', label: 'suasana.kecewa' },
  ],
  node: Object.fromEntries(NODE.map((n) => [n.id, n])),
  aktivitas: AKTIVITAS_AUTO_2,
  teks: TEKS_AUTO_2,
  bahasa: ['id'],
  kartuAkhir: (['puas', 'catatan', 'kurang'] as const).map((akhir) => ({
    id: `kartu-${akhir}`,
    akhir,
    judul: `kartu.${akhir}.judul`,
    sebab: `kartu.${akhir}.sebab`,
    pelajaran: 'kartu.pelajaran',
  })),
  istilah: istilah('surveyor', 'estimasi', 'pemeriksaan', 'komite', 'penawaran', 'leasing', 'penilaian'),
  latar: LATAR,
  dokumen: {
    // K07 naskah: pemeriksaan kejadian bisa berjalan bersamaan dengan hitungan bengkel -> 'paralel'.
    proses: { ...dokumen('proses', 4), tahapan: 'paralel' },
    linimasa: { ...dokumen('linimasa', 3), tahapan: 'urut' },
    // Bukti babak 8: rambu terbaca + diagram 4 lajur dari kiri dengan truk di lajur 2 (keterangan supir); tanpa kesimpulan.
    rambu: {
      ...dokumen('rambu', 4),
      skema: { jenis: 'lajur', jumlah: 4, rambu: [{ baris: 0, warna: '#2a6a3f' }, { baris: 1, warna: '#1f4f8a' }], penomoran: 2, posisi: { lajur: 2, baris: 3 }, kendaraan: 'dok.rambu.kendaraan' },
    },
    surat: dokumen('surat', 4),
    banding: dokumen('banding', 3),
  },
  titik: TITIK,
  statusNaskah: 'ringkasan.status',
};
