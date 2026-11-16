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
import { rect, line } from '../../../game/art/kit';
import {
  AKSEN, amplopHendra, baki, bakiKomite, bundelBerkas, bundelFoto, dokFormulir, dokHitungan, dokKk, dokKtp, dokRekening, dokSim, dokSlip,
  dokStnk, dokSuratPolisi, dokSuratPolisiAda, dokTender, kartuKontak, lembarLaporan, mapTertutup, mapTerbuka, mejaKayu, ikonBicara, ikonJam, ikonKilat, ikonSilang, ikonStrip, isiMobilKecil, kartuPemeriksaan, laciArsip,
  lencanaPercaya, lokBengkel, lokKantor, lokMejaFoto, lokPool, mapJelas, mapPengajuan, mejaEstimator, papanLengkapi, ponselChat,
  ponselMeja, simbolAbaikan, simbolCatat, simbolSama, simbolUlang, stempelAksi, tasPetugas, tiangPetunjuk, trukTrailer,
} from '../../seni/auto-2/benda';
import type { IdAktivitas, KonfigArena, KunciTeks, LampiranCerita, SeniArena } from '../../tipe';
import { lajurTertulisRambu1 } from '../../lokasi/logika';
import { daftarNama, gabungKalimat } from '../../hp/arena/rambu';
import { JUMLAH_LAJUR, LAJUR_TRUK } from '../../lokasi/seni/geometri';

/** Pin peta & aksen netral (warna bukan pembawa arti: setiap tujuan berlabel teks). */
const NETRAL = { tua: '#2f6b52', pucat: '#e3efe8' } as const;

/** Foto truk dari Pak Hendra (lampiran obrolan K01): trailer ringsek di bahu jalan tol, rel pengaman penyok. */
function fotoTruk(): string {
  let tiang = '';
  for (let x = 8; x < 240; x += 26) tiang += rect(x, 120, 3, 14, '#8f979c');
  return `
    ${rect(0, 0, 240, 150, '#cfe6f2')}
    ${rect(0, 78, 240, 72, '#7b8085')}
    ${line('M0 92 H240', '#f4f1e6', 2, 'stroke-dasharray="12 9"')}
    ${rect(0, 116, 240, 5, '#b9c0c4')}${tiang}
    <path d="M8 116 l14 6 10 -3 12 7 14 -5 v5 h-50z" fill="#8f979c"/>
    <g transform="translate(24 52)">${trukTrailer({ kepala: '#d0602a', penyok: true })}</g>`;
}

const seni = (svg: string, w: number, h: number): SeniArena => ({ svg, w, h });

export const SENI_ARENA_AUTO_2: Readonly<Record<string, SeniArena>> = {
  // K02 dokumen + baki
  'dok.formulir': seni(dokFormulir(), 104, 80),
  'dok.stnk': seni(dokStnk(), 104, 80),
  'dok.ktp': seni(dokKtp(), 104, 80),
  'dok.sim': seni(dokSim(), 104, 80),
  'dok.suratpolisi': seni(dokSuratPolisi(), 104, 80),
  'dok.kk': seni(dokKk(), 104, 80),
  'dok.slip': seni(dokSlip(), 104, 80),
  'dok.rekening': seni(dokRekening(), 104, 80),
  'baki.sekarang': seni(baki(AKSEN[0], ikonKilat), 150, 72),
  'baki.menyusul': seni(baki(AKSEN[1], ikonJam), 150, 72),
  // Baki "tidak diminta" & "tidak perlu": garis datar, bukan silang (silang terbaca sebagai "salah").
  'baki.tidak': seni(baki(AKSEN[2], ikonStrip), 150, 72),
  // K04 peta
  'lok.kantor': seni(lokKantor(NETRAL), 132, 100),
  'lok.foto': seni(lokMejaFoto(NETRAL), 132, 100),
  'lok.pool': seni(lokPool(NETRAL), 132, 100),
  'lok.bengkel': seni(lokBengkel(NETRAL, 'REKANAN', '#e7d2b4'), 132, 100),
  'lok.langganan': seni(lokBengkel(NETRAL, 'LANGGANAN', '#d9e4ea'), 132, 100),
  // K05 teruskan foto
  'foto.bundel': seni(bundelFoto(), 110, 84),
  'tuju.mitra': seni(mejaEstimator(NETRAL), 130, 96),
  'tuju.hendra': seni(ponselChat(NETRAL, 'H'), 110, 100),
  'tuju.lain': seni(tiangPetunjuk(NETRAL), 110, 104),
  'tuju.tunggu': seni(laciArsip(NETRAL), 110, 100),
  'tuju.diam': seni(tasPetugas(NETRAL), 110, 90),
  // K07 rencana
  'kartu.periksa': seni(kartuPemeriksaan(), 120, 80),
  'jalur.telepon': seni(ponselMeja(NETRAL), 100, 76),
  'jalur.jelas': seni(mapJelas(NETRAL), 100, 76),
  'jalur.percaya': seni(lencanaPercaya(NETRAL), 100, 76),
  // K09 saksi + baki daftar
  'saksi.mobilkecil': seni(`<g transform="translate(-10 -24)">${isiMobilKecil()}</g>`, 80, 70),
  'baki.ya': seni(baki(AKSEN[0], ikonBicara), 150, 72),
  'baki.tidakperlu': seni(baki(AKSEN[2], ikonStrip), 150, 72),
  // K10 stempel
  'cap.catat': seni(stempelAksi(AKSEN[0], simbolCatat), 84, 96),
  'cap.samakan': seni(stempelAksi(AKSEN[1], simbolSama), 84, 96),
  'cap.ulang': seni(stempelAksi(AKSEN[2], simbolUlang), 84, 96),
  'cap.abaikan': seni(stempelAksi(AKSEN[3], simbolAbaikan), 84, 96),
  'cap.tolak': seni(stempelAksi(AKSEN[4], ikonSilang), 84, 96),
  // K11 bundel
  'bundel.berkas': seni(bundelBerkas(), 120, 96),
  // Map terbuka di langkah "Periksa berkas": tujuh kelompok berkas, kelompok ke-7 (surat polisi) belum tersedia.
  'bundel.map': seni(mapPengajuan([true, true, true, true, true, true, false]), 232, 128),
  'bundel.lengkapi': seni(papanLengkapi(), 120, 90),
  'bundel.sekarang': seni(bakiKomite(), 120, 90),
  'bundel.hendra': seni(amplopHendra(), 120, 90),
  // Meja kasus K11 (PROTOTIPE, D-68): permukaan meja, map tertutup/terbuka, kartu kontak, lembar isi map.
  'meja.kayu': seni(mejaKayu(), 360, 400),
  'meja.map': seni(mapTertutup(), 190, 140),
  'meja.mapBuka': seni(mapTerbuka(), 344, 372),
  'meja.kontak': seni(kartuKontak(), 120, 132),
  'dok.hitungan': seni(dokHitungan(), 104, 80),
  'dok.tender': seni(dokTender(), 104, 80),
  'dok.laporan': seni(lembarLaporan(), 104, 80),
  'dok.suratpolisi.ada': seni(dokSuratPolisiAda(), 104, 80),
  // Lampiran obrolan
  'foto.truk': seni(fotoTruk(), 240, 150),
};

export const LAMPIRAN_AUTO_2: Record<string, LampiranCerita> = {
  fotoTruk: { jenis: 'foto', judul: 'lampiran.fotoTruk', seni: 'foto.truk', dari: 'hendra' },
};

const t = (id: string) => ({ id, label: `arena.${id}`, arti: `arena.${id}.arti` });

export const ARENA_AUTO_2: Record<IdAktivitas, KonfigArena> = {
  berkas: {
    pola: 'susun', langkah: 'berkas', gaya: 'baki', tanya: 'arena.berkas.tanya', satuan: 'arena.berkas.satuan', catatan: 'arena.berkas.catatan', catatanBenda: 'suratpolisi',
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
    pola: 'susun', langkah: 'saksi', gaya: 'papan', tanya: 'arena.saksi.tanya', satuan: 'arena.saksi.satuan', catatan: 'arena.saksi.catatan',
    benda: [
      { id: 'tol', nama: 'arena.saksi.tol', keterangan: 'arena.saksi.tol.ket', tokoh: { id: 'tol' } },
      { id: 'hendra', nama: 'arena.saksi.hendra', keterangan: 'arena.saksi.hendra.ket', tokoh: { id: 'hendra' } },
      { id: 'mobilkecil', nama: 'arena.saksi.mobilkecil', keterangan: 'arena.saksi.mobilkecil.ket', seni: 'saksi.mobilkecil' },
      { id: 'polisi', nama: 'arena.saksi.polisi', keterangan: 'arena.saksi.polisi.ket', tokoh: { id: 'polisi' } },
      { id: 'darto', nama: 'arena.saksi.darto', keterangan: 'arena.saksi.darto.ket', tokoh: { id: 'darto' } },
    ],
    wadah: [
      { id: 'ya', label: 'arena.saksi.wadah.ya', arti: 'arena.saksi.arti.ya', ikon: 'cek', seni: 'baki.ya' },
      { id: 'tidak', label: 'arena.saksi.wadah.tidak', arti: 'arena.saksi.arti.tidak', ikon: 'silang', seni: 'baki.tidakperlu' },
    ],
  },
  selisih: {
    pola: 'bandingkan', langkah: 'selisih', tanya: 'arena.selisih.tanya', fakta: { tabel: 'fakta' },
    sumber: { kiri: 'arena.selisih.kiri', kanan: 'arena.selisih.kanan' },
    selisih: [
      { id: 'jam', label: 'arena.selisih.jam', catatan: 'arena.selisih.jam.catatan' },
      { id: 'nama', label: 'arena.selisih.nama', catatan: 'arena.selisih.nama.catatan' },
      { id: 'antisipasi', label: 'arena.selisih.antisipasi', catatan: 'arena.selisih.antisipasi.catatan' },
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
