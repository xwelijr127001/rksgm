/**
 * ARENA HP EPISODE AUTO-2: benda, tujuan, dan gambar delapan aktivitas (pola di client/src/cerita/hp/arena), lampiran
 * obrolan, dan pesan pemain yang lahir dari susunan aktivitas. Id benda/tujuan = id item/wadah/opsi misi sintetis
 * (./aktivitas.ts), jadi jawaban arena dinilai & dipetakan persis seperti sebelumnya (aturan `langsung` di episode.ts).
 *
 * Interaksi menurut adegan, bukan satu pola sortir untuk semua: susun dokumen ke baki (K02), tugaskan surveyor lewat
 * peta (K04), teruskan foto bukti (K05), tempatkan pemeriksaan di papan rencana (K07), tentukan saksi (K09), stempel
 * perbedaan catatan (K10), periksa bundel lalu pilih kabar (K11), susun pesan penutupan (K15).
 * Arti tiap tujuan diturunkan dari label wadah naskah (lihat teks.id.ts "antarmuka HP"); tanpa fakta asuransi baru.
 */
import type { MissionAnswer } from '@shared/types';
import {
  kartuKontak, mapTertutup, mapTerbuka, mejaKayu, kartuPemeriksaan,
} from '../../seni/auto-2/benda';
import type { IdAktivitas, KonfigArena, KunciTeks, LampiranCerita, SeniArena } from '../../tipe';
import { lajurTertulisRambu1 } from '../../lokasi/logika';
import { daftarNama, gabungKalimat } from '../../hp/arena/rambu';
import { JUMLAH_LAJUR, LAJUR_TRUK } from '../../lokasi/seni/geometri';

const seni = (svg: string, w: number, h: number): SeniArena => ({ svg, w, h });
const piksel = (kelas: string, w: number, h: number): SeniArena => ({ svg: '', w, h, piksel: kelas });
/** Dokumen piksel (T-020 batch 3): berkas besar 1 : 1 + sel atlas 22 x 28 (dok-kecil.png) untuk chip, kantong map dan token. */
const dok = (nama: string, w: number, h: number, sel: number): SeniArena => ({ svg: '', w, h, piksel: 'px-dok-' + nama, kecil: 'px-dokk px-dokk-' + sel });

export const SENI_ARENA_AUTO_2: Readonly<Record<string, SeniArena>> = {
  // K02 dokumen + baki
  'dok.formulir': dok('formulir', 64, 80, 0),
  'dok.stnk': dok('stnk', 64, 44, 1),
  'dok.ktp': dok('ktp', 64, 44, 2),
  'dok.sim': dok('sim', 64, 44, 3),
  'dok.suratpolisi': dok('suratpolisi', 64, 80, 4),
  'dok.kk': dok('kk', 64, 48, 5),
  'dok.slip': dok('slip', 48, 80, 6),
  'dok.rekening': dok('rekening', 64, 80, 7),
  'baki.sekarang': piksel('px-baki px-baki-0', 68, 40),
  'baki.menyusul': piksel('px-baki px-baki-1', 68, 40),
  // Baki "tidak diminta" & "tidak perlu": garis datar, bukan silang (silang terbaca sebagai "salah").
  'baki.tidak': piksel('px-baki px-baki-2', 68, 40),
  // K04 peta
  // T-020 batch 1: lima tempat = ubin PIKSEL 80 x 60 (seni/aktivitas/peta/*.png lewat kelas CSS), bukan SVG lagi.
  'lok.kantor': piksel('px-ubin-kantor', 80, 60),
  'lok.foto': piksel('px-ubin-meja-kantor', 80, 60),
  'lok.pool': piksel('px-ubin-pool', 80, 60),
  'lok.bengkel': piksel('px-ubin-bengkel-rekanan', 80, 60),
  'lok.langganan': piksel('px-ubin-bengkel-langganan', 80, 60),
  // K05 teruskan foto
  'foto.bundel': dok('foto-bundel', 60, 48, 12),
  'tuju.mitra': piksel('px-ubin-mitra', 80, 60),
  'tuju.hendra': piksel('px-ubin-hendra', 80, 60),
  'tuju.lain': piksel('px-ubin-lain', 80, 60),
  'tuju.tunggu': piksel('px-ubin-tunggu', 80, 60),
  'tuju.diam': piksel('px-ubin-diam', 80, 60),
  // K07 rencana
  'kartu.periksa': { ...seni(kartuPemeriksaan(), 120, 80), kecil: 'px-dokk-kaca' },
  'jalur.telepon': piksel('px-ikon-telepon', 24, 24),
  'jalur.jelas': piksel('px-ikon-lembar-cek', 24, 24),
  'jalur.percaya': piksel('px-ikon-lencana', 24, 24),
  // K09 saksi + baki daftar
  'saksi.mobilkecil': piksel('px-mobil-kecil', 48, 22),
  // K10 stempel
  'cap.catat': piksel('px-cap-0', 44, 48),
  'cap.samakan': piksel('px-cap-1', 44, 48),
  'cap.ulang': piksel('px-cap-2', 44, 48),
  'cap.abaikan': piksel('px-cap-3', 44, 48),
  'cap.tolak': piksel('px-cap-4', 44, 48),
  // K11 bundel
  'bundel.berkas': piksel('px-bundel-berkas', 48, 40),
  // Map terbuka di langkah "Periksa berkas": tujuh kelompok berkas, kelompok ke-7 (surat polisi) belum tersedia.
  'bundel.map': piksel('px-map-pengajuan', 120, 64),
  'bundel.lengkapi': piksel('px-aksi-lengkapi', 48, 40),
  'bundel.sekarang': piksel('px-aksi-komite', 48, 40),
  'bundel.hendra': piksel('px-aksi-hendra', 48, 40),
  // Meja kasus K11 (PROTOTIPE, D-68): permukaan meja, map tertutup/terbuka, kartu kontak, lembar isi map.
  'meja.kayu': seni(mejaKayu(), 360, 400),
  'meja.map': seni(mapTertutup(), 190, 140),
  'meja.mapBuka': seni(mapTerbuka(), 344, 372),
  'meja.kontak': seni(kartuKontak(), 120, 132),
  'dok.hitungan': dok('hitungan', 64, 80, 8),
  'dok.tender': dok('tender', 64, 80, 9),
  'dok.laporan': dok('laporan', 64, 80, 10),
  'dok.suratpolisi.ada': dok('suratpolisi-ada', 64, 80, 11),
  // Lampiran obrolan
  'foto.truk': piksel('px-foto-truk', 240, 150),
};

export const LAMPIRAN_AUTO_2: Record<string, LampiranCerita> = {
  fotoTruk: { jenis: 'foto', judul: 'lampiran.fotoTruk', seni: 'foto.truk', dari: 'hendra' },
};

const t = (id: string) => ({ id, label: `arena.${id}`, arti: `arena.${id}.arti` });

export const ARENA_AUTO_2: Record<IdAktivitas, KonfigArena> = {
  berkas: {
    pola: 'susun', langkah: 'berkas', gaya: 'baki', tanya: 'arena.berkas.tanya', satuan: 'arena.berkas.satuan', satuanHitung: 'arena.berkas.satuanHitung', catatan: 'arena.berkas.catatan', catatanBenda: 'suratpolisi',
    // Urutan tampil campuran (bukan dikelompokkan menurut kunci).
    benda: [
      { id: 'formulir', nama: 'arena.berkas.formulir', seni: 'dok.formulir' },
      { id: 'suratpolisi', nama: 'arena.berkas.suratpolisi', keterangan: 'arena.berkas.suratpolisi.ket', seni: 'dok.suratpolisi' },
      { id: 'kk', nama: 'arena.berkas.kk', seni: 'dok.kk' },
      { id: 'stnk', nama: 'arena.berkas.stnk', seni: 'dok.stnk' },
      { id: 'slip', nama: 'arena.berkas.slip', seni: 'dok.slip' },
      { id: 'ktp', nama: 'arena.berkas.ktp', seni: 'dok.ktp' },
      { id: 'rekening', nama: 'arena.berkas.rekening', seni: 'dok.rekening' },
      { id: 'sim', nama: 'arena.berkas.sim', keterangan: 'arena.berkas.sim.ket', seni: 'dok.sim' },
    ],
    wadah: [
      { id: 'sekarang', label: 'arena.berkas.wadah.sekarang', arti: 'arena.berkas.arti.sekarang', ikon: 'kilat', seni: 'baki.sekarang' },
      { id: 'menyusul', label: 'arena.berkas.wadah.menyusul', arti: 'arena.berkas.arti.menyusul', ikon: 'jam', seni: 'baki.menyusul' },
      { id: 'tidak', label: 'arena.berkas.wadah.tidak', arti: 'arena.berkas.arti.tidak', ikon: 'silang', seni: 'baki.tidak' },
    ],
  },
  surveyor: {
    pola: 'tujuan', langkah: 'tujuan', gaya: 'peta', tanya: 'arena.surveyor.tanya',
    benda: { id: 'rudi', nama: 'arena.surveyor.rudi', keterangan: 'arena.surveyor.rudi.ket', tokoh: { id: 'rudi' } },
    tujuan: [
      { ...t('surveyor.kantor'), id: 'kantor', seni: 'lok.kantor' },
      { ...t('surveyor.foto'), id: 'foto', seni: 'lok.foto' },
      { ...t('surveyor.pool'), id: 'pool', seni: 'lok.pool' },
      { ...t('surveyor.bengkel'), id: 'bengkel', seni: 'lok.bengkel' },
      { ...t('surveyor.langganan'), id: 'langganan', seni: 'lok.langganan' },
    ],
  },
  foto: {
    pola: 'tujuan', langkah: 'tujuan', gaya: 'teruskan', tanya: 'arena.foto.tanya',
    benda: { id: 'bundel', nama: 'arena.foto.bundel', seni: 'foto.bundel' },
    tujuan: [
      { ...t('foto.mitra'), id: 'mitra', seni: 'tuju.mitra' },
      { ...t('foto.hendra'), id: 'hendra', seni: 'tuju.hendra' },
      { ...t('foto.lain'), id: 'lain', seni: 'tuju.lain' },
      { ...t('foto.tunggu'), id: 'tunggu', seni: 'tuju.tunggu' },
      { ...t('foto.diam'), id: 'diam', seni: 'tuju.diam' },
    ],
  },
  jalur: {
    pola: 'tujuan', langkah: 'jalur', gaya: 'rencana', tanya: 'arena.jalur.tanya', fakta: { tabel: 'rencana', hanyaDaftar: true },
    catatan: 'arena.jalur.catatan',
    benda: { id: 'periksa', nama: 'arena.jalur.periksa', keterangan: 'arena.jalur.periksa.ket', seni: 'kartu.periksa' },
    tujuan: [
      // Dua slot papan dulu (urutan papan), lalu tiga pilihan di luar papan.
      { ...t('jalur.setelah'), id: 'setelah' },
      { ...t('jalur.paralel'), id: 'paralel' },
      { ...t('jalur.telepon'), id: 'telepon', seni: 'jalur.telepon' },
      { ...t('jalur.jelas'), id: 'jelas', seni: 'jalur.jelas' },
      { ...t('jalur.percaya'), id: 'percaya', seni: 'jalur.percaya' },
    ],
  },
  saksi: {
    pola: 'susun', langkah: 'saksi', gaya: 'papan', tanya: 'arena.saksi.tanya', satuan: 'arena.saksi.satuan', satuanHitung: 'arena.saksi.satuanHitung', catatan: 'arena.saksi.catatan',
    benda: [
      { id: 'tol', nama: 'arena.saksi.tol', keterangan: 'arena.saksi.tol.ket', tokoh: { id: 'tol' } },
      { id: 'hendra', nama: 'arena.saksi.hendra', keterangan: 'arena.saksi.hendra.ket', tokoh: { id: 'hendra' } },
      { id: 'mobilkecil', nama: 'arena.saksi.mobilkecil', keterangan: 'arena.saksi.mobilkecil.ket', seni: 'saksi.mobilkecil' },
      { id: 'polisi', nama: 'arena.saksi.polisi', keterangan: 'arena.saksi.polisi.ket', tokoh: { id: 'polisi' } },
      { id: 'darto', nama: 'arena.saksi.darto', keterangan: 'arena.saksi.darto.ket', tokoh: { id: 'darto' } },
    ],
    wadah: [
      { id: 'ya', label: 'arena.saksi.wadah.ya', arti: 'arena.saksi.arti.ya', ikon: 'cek' },
      { id: 'tidak', label: 'arena.saksi.wadah.tidak', arti: 'arena.saksi.arti.tidak', ikon: 'silang' },
    ],
  },
  // T-022: periksa SIM Pak Darto (permainan empat langkah; semua tata letak di hp/arena/ArenaSim.tsx).
  sim: { pola: 'sim', langkah: 'sim', tanya: 'akt.sim.tanya', benda: 'periksa', bersih: 'bersih', ragu: 'ragu' },
  selisih: {
    pola: 'bandingkan', langkah: 'selisih', tanya: 'arena.selisih.tanya', fakta: { tabel: 'fakta' },
    sumber: { kiri: 'arena.selisih.kiri', kanan: 'arena.selisih.kanan' },
    selisih: [
      { id: 'jam', label: 'arena.selisih.jam', catatan: 'arena.selisih.jam.catatan', sel: { kiri: 'arena.selisih.sel.jam.kiri', kanan: 'arena.selisih.sel.jam.kanan' }, ikon: 'jam' },
      { id: 'nama', label: 'arena.selisih.nama', catatan: 'arena.selisih.nama.catatan', sel: { kiri: 'arena.selisih.sel.nama.kiri', kanan: 'arena.selisih.sel.nama.kanan' }, ikon: 'wajah' },
      { id: 'antisipasi', label: 'arena.selisih.antisipasi', catatan: 'arena.selisih.antisipasi.catatan', sel: { kiri: 'arena.selisih.sel.antisipasi.kiri', kanan: 'arena.selisih.sel.antisipasi.kanan' }, ikon: 'pensil' },
    ],
    perlakuan: [
      { ...t('selisih.catat'), id: 'catat', seni: 'cap.catat' },
      { ...t('selisih.samakan'), id: 'samakan', seni: 'cap.samakan' },
      { ...t('selisih.ulang'), id: 'ulang', seni: 'cap.ulang' },
      { ...t('selisih.abaikan'), id: 'abaikan', seni: 'cap.abaikan' },
      { ...t('selisih.tolak'), id: 'tolak', seni: 'cap.tolak' },
    ],
  },
  bundel: {
    pola: 'bundel', tanya: 'arena.bundel.tanya1', fakta: { tabel: 'isi-bundel' },
    tindakan: {
      langkah: 'bundel', tanya: 'arena.bundel.tanya1',
      pilihan: [
        { ...t('bundel.lengkapi'), id: 'lengkapi', seni: 'bundel.lengkapi' },
        { ...t('bundel.sekarang'), id: 'sekarang', seni: 'bundel.sekarang' },
        { ...t('bundel.hendra'), id: 'hendra', seni: 'bundel.hendra' },
      ],
    },
    kabar: {
      langkah: 'kabar', tanya: 'arena.bundel.tanya2',
      pilihan: [
        { id: 'persetujuan', label: 'arena.bundel.persetujuan' },
        { id: 'disetujui', label: 'arena.bundel.disetujui' },
        { id: 'nanti', label: 'arena.bundel.nanti', arti: 'arena.bundel.nanti.arti' },
      ],
    },
    // Meja kasus (PROTOTIPE, D-68): berkas seurutan tabel 'isi-bundel'; rincian = fakta naskah yang sudah ada (tanpa fakta baru).
    meja: {
      berkas: [
        { id: 'formulir', singkat: 'meja.berkas.formulir', seni: 'dok.formulir', rincian: 'meja.berkas.formulir.isi' },
        { id: 'foto', singkat: 'meja.berkas.foto', seni: 'foto.bundel', rincian: 'meja.berkas.foto.isi' },
        { id: 'hitungan', singkat: 'meja.berkas.hitungan', seni: 'dok.hitungan', rincian: 'meja.berkas.hitungan.isi' },
        { id: 'tender', singkat: 'meja.berkas.tender', seni: 'dok.tender' },
        { id: 'lokasi', singkat: 'meja.berkas.lokasi', seni: 'kartu.periksa', rincian: 'meja.berkas.lokasi.isi' },
        { id: 'laporan', singkat: 'meja.berkas.laporan', seni: 'dok.laporan', rincian: 'meja.berkas.laporan.isi' },
        { id: 'suratpolisi', singkat: 'meja.berkas.suratpolisi', seni: 'dok.suratpolisi.ada' },
      ],
      objek: { map: 'meja.objek.map', komite: 'meja.objek.komite', papan: 'meja.objek.papan' },
      tindakan: {
        lengkapi: { tempat: 'papan', akhir: 'lengkap', status: 'meja.status.lengkap' },
        sekarang: { tempat: 'komite', akhir: 'kembali', status: 'meja.status.kembali' },
        hendra: { tempat: 'kontak', akhir: 'tahan', status: 'meja.status.tahan', singkat: 'meja.aksi.hendra' },
      },
      statusAwal: 'meja.status.awal',
    },
  },
  // K08: periksa dua rambu di jalan, tandai lajur sendiri, simpulkan. Tulisan rambu 1 dibaca dari teks naskah (lajur yang disebutnya).
  rambu: {
    pola: 'rambu', tanya: 'k08.tanya', jumlahLajur: JUMLAH_LAJUR, lajurTruk: LAJUR_TRUK,
    rambu: [
      { langkah: 'r1', wadah: 'tanda', awalanItem: 'r1l', label: 'dok.rambu.1', isi: 'dok.rambu.1.isi', petunjuk: 'arena.rambu.petunjuk1', tulisan: lajurTertulisRambu1() },
      { langkah: 'r2', wadah: 'tanda', awalanItem: 'r2l', label: 'dok.rambu.2', isi: 'dok.rambu.2.isi', petunjuk: 'arena.rambu.petunjuk2' },
    ],
    // Urutan tampil = urutan naskah k08 (c, e, a, d, b). Sikap hanya untuk "melanggar?" (a) dan "tidak melanggar" (c).
    simpul: {
      langkah: 'simpul', tanya: 'k08.tanya', sikap: { a: 'melanggar', c: 'tidak' },
      pilihan: ['c', 'e', 'a', 'd', 'b'].map((id) => ({ id, label: `k08.${id}` })),
    },
  },
  tutup: {
    pola: 'pesan', langkah: 'pesan', masuk: 'masuk', tidak: 'tidak', tanya: 'arena.tutup.tanya',
    benda: ['kabar', 'bukti', 'langkah', 'jujur', 'bintang', 'polis'].map((id) => ({ id, nama: `arena.tutup.${id}`, keterangan: `arena.tutup.${id}.isi` })),
  },
};

// ------------------------------------------------------------------ pesan pemain di obrolan

type Tx = (k: KunciTeks, param?: Record<string, string | number>) => string;

/** Pengantar + daftar ("A, B dan C" per bahasa, T-014 fix D-123) + titik; tanpa spasi sesudah tanda baca lebar penuh (zh "："). */
const kalimatDaftar = (pengantar: string, nama: string[], tx: Tx): string => gabungKalimat([pengantar, daftarNama(nama, tx)]) + tx('daftar.titik');

const peta = (j: MissionAnswer, langkah: string): Record<string, string> => {
  const v = j[langkah];
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : {};
};

/** Pesan pemain yang lahir dari susunan aktivitas (tampil di obrolan dengan Pak Hendra), atau null. */
export const PESAN_AUTO_2: Partial<Record<IdAktivitas, (j: MissionAnswer, tx: Tx) => string | null>> = {
  berkas: (j, tx) => {
    const p = peta(j, 'berkas');
    const urut = (ARENA_AUTO_2.berkas as Extract<KonfigArena, { pola: 'susun' }>).benda;
    const nama = (w: string) => urut.filter((b) => p[b.id] === w).map((b) => tx(b.nama!));
    const sekarang = nama('sekarang');
    const menyusul = nama('menyusul');
    const kalimat = [sekarang.length ? kalimatDaftar(tx('arena.berkas.pesan.sekarang'), sekarang, tx) : tx('arena.berkas.pesan.kosong')];
    if (menyusul.length) kalimat.push(kalimatDaftar(tx('arena.berkas.pesan.menyusul'), menyusul, tx));
    return gabungKalimat(kalimat);
  },
  // Kabar yang dipilih = pesan terkirim di obrolan (sebelum akibatnya); "tidak mengabari dulu" = tanpa pesan.
  bundel: (j, tx) => (j.kabar === 'disetujui' || j.kabar === 'persetujuan' ? tx(`arena.bundel.${j.kabar}`) : null),
  tutup: (j, tx) => {
    const p = peta(j, 'pesan');
    const isi = (ARENA_AUTO_2.tutup as Extract<KonfigArena, { pola: 'pesan' }>).benda.filter((b) => p[b.id] === 'masuk').map((b) => tx(b.keterangan!));
    return isi.length ? gabungKalimat(isi) : null;
  },
};
