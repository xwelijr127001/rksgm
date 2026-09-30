/**
 * TES PERILAKU episode AUTO-1 "Baret di Parkiran" (docs/rancangan-mode-cerita.md bagian 3 & 7).
 *
 * Semua jalur dijalankan lewat MESIN sungguhan (stateAwal/jalankan) seperti pemain: 'lanjut' sampai ada
 * pilihan/aktivitas, lalu memilih / mengirim jawaban (pembantu: ../../uji/jalurEpisode.ts). Harapan ditulis
 * dari KONTRAK (tabel 3.1, jalur uji wajib, suasana, paham/proses), bukan dihitung ulang dari data episode.
 *
 * Nama kunci alasan mengikuti konvensi teks episode ('<node>.<pilihan>.alasan', '<node>.hasil.<n>.alasan').
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { Bahasa } from '@shared/bahasa';
import type { MissionAnswer } from '@shared/types';
import { babBisaDiulang, babKini, barisTerlihat, jalankan, nilaiAktivitas, nodeKini, pilihanTersedia, ringkasanAkhir, suasanaNasabah, umpanBalikKini } from '../../mesin';
import { teksCerita } from '../../teks';
import type { AksiCerita, IdAkhir, Kondisi, NilaiProses, StateCerita } from '../../tipe';
import {
  barisDitampilkan, bekukan, intiState, jawab, LANJUT, majuSampaiKeputusan, mainkanJalur, nodeDilewati, salinJson, semuaString, titikKeputusan,
  ulangiAksi, type HasilJalur, type LangkahJalur,
} from '../../uji/jalurEpisode';
import { hitungKata } from '../../ui/tinjauan';
import { jelajahiSemuaJalur, validasiEpisode } from '../../validasi';
import { EPISODE_AUTO_1 as EP } from './episode';
import { TEKS_AUTO_1 } from './teks';
import { KUNCI_PENSIUN } from './teks.id';

const BAHASA: Bahasa[] = ['id', 'en', 'zh'];
const AKHIR_SEMUA: IdAkhir[] = ['tuntas', 'janji', 'dingin', 'tertunda', 'pergi'];
type Arah = 'naik' | 'turun' | 'tetap';

// ------------------------------------------------------------------ jawaban aktivitas (id opsi kontrak 3.2)

const BUKTI_BENAR = ['foto-full', 'foto-penyok', 'foto-plat'] as const;
/** Pengecoh: brosur + dua bagian mobil yang tidak rusak & tidak menunjukkan identitas (ban depan, dasbor). */
const BUKTI_LAIN = ['foto-menu', 'foto-ban', 'foto-dasbor'] as const;
const BUKTI_TEPAT: MissionAnswer = { bukti: [...BUKTI_BENAR] };
/** 2 tepat + 1 pengecoh yang masuk akal (ban depan, bagian yang tidak rusak): plat nomor terlewat. */
const BUKTI_KURANG: MissionAnswer = { bukti: ['foto-full', 'foto-penyok', 'foto-ban'] };
const polis = (opsi: string): MissionAnswer => ({ penjelasan: opsi });

const buktiTepat = jawab('b3-bukti', BUKTI_TEPAT);
const buktiKurang = jawab('b3-bukti', BUKTI_KURANG);
const polisDi = (opsi: string): LangkahJalur => jawab('b4-polis', polis(opsi));

/** Jalur terbaik kontrak: dengar, dokumentasi, bukti tepat, bisa-dinilai, jujur, rangkum. */
const JALUR_TERBAIK: LangkahJalur[] = ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/rangkum'];

// Kunci alasan (sebab-akibat perubahan suasana) yang sering muncul.
const A = {
  dengar: 'b1-datang.dengar.alasan',
  prosedur: 'b1-datang.prosedur.alasan',
  janji: 'b1-datang.janji.alasan',
  maaf: 'b1-pulih.maaf.alasan',
  tetap: 'b1-pulih.tetap.alasan',
  dokumentasi: 'b2-saran.dokumentasi.alasan',
  bengkel: 'b2-saran.bengkel.alasan',
  ringan: 'b2-saran.ringan.alasan',
  koreksi: 'b2-bengkel-akibat.koreksi.alasan',
  biarkan: 'b2-bengkel-akibat.biarkan.alasan',
  lihatDulu: 'b2-ringan-akibat.lihat-dulu.alasan',
  tetapRingan: 'b2-ringan-akibat.tetap-ringan.alasan',
  lengkapi: 'b3-bukti-kurang.lengkapi.alasan',
  cukup: 'b3-bukti-kurang.cukup.alasan',
  polisTepat: 'b4-polis.hasil.1.alasan',
  polisPasti: 'b4-polis.hasil.2.alasan',
  polisTidak: 'b4-polis.hasil.3.alasan',
  polisLain: 'b4-polis.hasil.4.alasan',
  bacaUlang: 'b4-polis-salah.baca-ulang.alasan',
  bertahan: 'b4-polis-salah.bertahan.alasan',
  jujur: 'b5-keberatan.jujur.alasan',
  janjikan: 'b5-keberatan.janjikan.alasan',
  aturan: 'b5-keberatan.aturan.alasan',
  aturanJanji: 'b5-keberatan.aturan-janji.alasan',
  ralatJanji: 'b5-keberatan.ralat-janji.alasan',
  ralatPolis: 'b5-keberatan.ralat-polis.alasan',
  rangkum: 'b5-tutup.rangkum.alasan',
  singkat: 'b5-tutup.singkat.alasan',
} as const;

type IdProses = 'dokumentasi-dulu' | 'bukti' | 'baca-polis' | 'tanpa-janji';
type N = NilaiProses | null;
const proses = (dokumentasi: N, bukti: N, bacaPolis: N, tanpaJanji: N): Record<IdProses, N> => ({
  'dokumentasi-dulu': dokumentasi,
  bukti,
  'baca-polis': bacaPolis,
  'tanpa-janji': tanpaJanji,
});
const PAHAM_SEMUA = ['langkah-sekarang', 'polis-dinilai', 'risiko-sendiri', 'langkah-berikut'];

/** Baris node yang tampil: kunci '<node>.<n>' dari nomor baris. */
const baris = (node: string, ...n: number[]): [string, string[]] => [node, n.map((i) => `${node}.${i}`)];

interface Harapan {
  nama: string;
  langkah: LangkahJalur[];
  akhir: IdAkhir;
  kepercayaan: number;
  /** Label suasana nasabah di akhir (kunci teks). */
  suasana: string;
  proses: Record<IdProses, N>;
  paham: string[];
  /** Alasan perubahan suasana, urut kejadian. */
  komunikasi: [string, Arah][];
  /** Baris yang tampil per node (hanya node yang disebut). */
  baris?: [string, string[]][];
  periksa?: (s: StateCerita) => void;
}

const JALUR: Harapan[] = [
  // ============================================================ jalur uji wajib (kontrak 3.1)
  {
    nama: 'terbaik -> tuntas',
    langkah: JALUR_TERBAIK,
    akhir: 'tuntas',
    kepercayaan: 6,
    suasana: 'suasana.tenang',
    proses: proses('tepat', 'tepat', 'tepat', 'tepat'),
    paham: PAHAM_SEMUA,
    komunikasi: [[A.dengar, 'naik'], [A.dokumentasi, 'naik'], [A.polisTepat, 'naik'], [A.jujur, 'naik'], [A.rangkum, 'naik']],
    baris: [
      baris('b2-cerita', 3, 5), ['b2-cerita-bagian', ['b2-cerita.6']], baris('b5-keberatan', 5, 6), baris('b5-tutup', 2, 5),
      ['b5-rangkum-jelas', ['b5-rangkum.1']], baris('akhir-tuntas', 1, 2, 5),
    ],
    periksa: (s) => {
      assert.deepEqual([...s.catatan].sort(), ['bagian-disimpan', 'bukti', 'kebutuhan', 'masalah', 'polis', 'rencana-bengkel']);
      assert.ok(!s.tanda.some((t) => t.startsWith('janji-')), 'tidak ada janji di jalur terbaik');
    },
  },
  {
    // K4 bermakna: jalur yang sama persis, tetapi ditutup "nanti dikabari" -> Bu Rina tidak tahu langkah
    // berikutnya, akhir BUKAN tuntas, dan mentor menunjuk penutupnya (bukan "belum merasa didengar").
    nama: 'terbaik + singkat -> dingin (penutup menentukan kejelasan)',
    langkah: [...JALUR_TERBAIK.slice(0, -1), 'b5-tutup/singkat'],
    akhir: 'dingin',
    kepercayaan: 4,
    suasana: 'suasana.tenang',
    proses: proses('tepat', 'tepat', 'tepat', 'tepat'),
    paham: ['langkah-sekarang', 'polis-dinilai', 'risiko-sendiri'],
    komunikasi: [[A.dengar, 'naik'], [A.dokumentasi, 'naik'], [A.polisTepat, 'naik'], [A.jujur, 'naik'], [A.singkat, 'turun']],
    baris: [baris('akhir-dingin', 2, 3, 6)],
    periksa: (s) => assert.ok(!s.tanda.includes('rangkum')),
  },
  {
    nama: 'pemulihan komunikasi (prosedur -> maaf -> ... ) -> tuntas',
    langkah: ['b1-datang/prosedur', 'b1-pulih/maaf', 'b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
    akhir: 'tuntas',
    kepercayaan: 5,
    suasana: 'suasana.tenang',
    proses: proses('tepat', 'tepat', 'tepat', 'tepat'),
    paham: PAHAM_SEMUA,
    komunikasi: [[A.prosedur, 'turun'], [A.maaf, 'naik'], [A.dokumentasi, 'naik'], [A.polisTepat, 'naik'], [A.jujur, 'naik'], [A.rangkum, 'naik']],
    // Jalur pemulihan: Bu Rina berterima kasih atas ralatnya (.6), bukan "sudah jelas dari awal" (.2).
    baris: [baris('b1-pulih', 1, 2), baris('b2-cerita', 2, 5), ['b2-cerita-bagian', ['b2-cerita.6']], baris('akhir-tuntas', 1, 6, 3)],
    periksa: (s) => {
      assert.ok(s.tanda.includes('pulih-komunikasi'));
      assert.ok(s.catatan.includes('bagian-disimpan'), 'setelah minta maaf, Bu Rina menyebut pecahan lampu');
    },
  },
  {
    nama: 'janji (janji, ..., janjikan) -> janji',
    langkah: ['b1-datang/janji', 'b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/janjikan', 'b5-tutup/rangkum'],
    akhir: 'janji',
    kepercayaan: 5,
    suasana: 'suasana.tenang',
    proses: proses('tepat', 'tepat', 'tepat', 'keliru'),
    // Ringkasan langkah tidak diterima: Bu Rina berpegang pada janji "besok beres" (tanpa langkah-berikut).
    paham: ['langkah-sekarang', 'polis-dinilai'],
    komunikasi: [[A.janji, 'naik'], [A.dokumentasi, 'naik'], [A.polisTepat, 'naik'], [A.janjikan, 'naik'], [A.rangkum, 'naik']],
    baris: [
      baris('b2-cerita', 1, 5),
      baris('b4-polis-intro', 1, 3),
      baris('b5-keberatan', 2, 3),
      baris('b5-tutup', 1, 5),
      ['b5-rangkum-janji', ['b5-rangkum.2']],
      baris('akhir-janji', 1, 2, 3, 5),
    ],
    periksa: (s) => {
      // Nasabah senang (Tenang) tetapi langkah klaim keliru: dua sisi ringkasan memang terpisah.
      assert.ok(s.tanda.includes('janji-awal') && s.tanda.includes('janji-waktu'));
      assert.ok(!s.catatan.includes('bagian-disimpan'));
    },
  },
  {
    nama: 'janji awal lalu ralat-janji -> tuntas',
    langkah: ['b1-datang/janji', 'b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/ralat-janji', 'b5-tutup/rangkum'],
    akhir: 'tuntas',
    kepercayaan: 3,
    suasana: 'suasana.tenang',
    proses: proses('tepat', 'tepat', 'tepat', 'dikoreksi'),
    paham: PAHAM_SEMUA,
    komunikasi: [[A.janji, 'naik'], [A.dokumentasi, 'naik'], [A.polisTepat, 'naik'], [A.ralatJanji, 'turun'], [A.rangkum, 'naik']],
    baris: [baris('b5-keberatan', 2, 3), baris('b5-tutup', 3, 5), ['b5-rangkum-jelas', ['b5-rangkum.1']], baris('akhir-tuntas', 1, 6, 4)],
    periksa: (s) => assert.ok(!s.tanda.some((t) => t.startsWith('janji-')), 'semua janji dicabut'),
  },
  {
    nama: 'kartu "pasti-diganti" lalu ralat-polis -> tuntas (baca-polis dikoreksi)',
    langkah: ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat, polisDi('pasti-diganti'), 'b5-keberatan/ralat-polis', 'b5-tutup/rangkum'],
    akhir: 'tuntas',
    kepercayaan: 4,
    suasana: 'suasana.tenang',
    proses: proses('tepat', 'tepat', 'dikoreksi', 'dikoreksi'),
    paham: PAHAM_SEMUA,
    komunikasi: [[A.dengar, 'naik'], [A.dokumentasi, 'naik'], [A.polisPasti, 'naik'], [A.ralatPolis, 'turun'], [A.rangkum, 'naik']],
    baris: [baris('b4-polis-janji', 1, 2), baris('b5-keberatan', 1, 4), baris('akhir-tuntas', 1, 6, 4)],
    periksa: (s) => {
      assert.ok(nodeDilewati(s).includes('b4-polis-janji'));
      assert.ok(!s.tanda.includes('janji-polis'), 'janji polis dicabut');
      assert.ok(s.catatan.includes('polis'), 'kartu polis bisa dibaca ulang di Catatan kasus');
    },
  },
  {
    nama: 'kartu "pasti-diganti" lalu ralat-polis + singkat -> dingin',
    langkah: ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat, polisDi('pasti-diganti'), 'b5-keberatan/ralat-polis', 'b5-tutup/singkat'],
    akhir: 'dingin',
    kepercayaan: 2,
    suasana: 'suasana.mulai-tenang',
    proses: proses('tepat', 'tepat', 'dikoreksi', 'dikoreksi'),
    // Ralat meluruskan kartu & risiko sendiri, tetapi langkah berikutnya tidak pernah dirangkum.
    paham: ['langkah-sekarang', 'polis-dinilai', 'risiko-sendiri'],
    komunikasi: [[A.dengar, 'naik'], [A.dokumentasi, 'naik'], [A.polisPasti, 'naik'], [A.ralatPolis, 'turun'], [A.singkat, 'turun']],
    // Pesan mentor menunjuk penutup "nanti dikabari" (.6), bukan "belum merasa didengar" (.5).
    baris: [baris('akhir-dingin', 2, 3, 6)],
  },
  {
    nama: 'dingin (prosedur -> tetap -> ... -> aturan) -> dingin',
    langkah: ['b1-datang/prosedur', 'b1-pulih/tetap', 'b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/aturan', 'b5-tutup/rangkum'],
    akhir: 'dingin',
    kepercayaan: -1,
    suasana: 'suasana.cemas',
    // Tidak ada janji sama sekali: butir "tidak menjanjikan" tepat; yang buruk komunikasinya.
    proses: proses('tepat', 'tepat', 'tepat', 'tepat'),
    paham: ['langkah-sekarang', 'polis-dinilai', 'langkah-berikut'],
    komunikasi: [[A.prosedur, 'turun'], [A.tetap, 'turun'], [A.dokumentasi, 'naik'], [A.polisTepat, 'naik'], [A.aturan, 'turun'], [A.rangkum, 'naik']],
    baris: [
      baris('b2-singkat', 2),
      baris('b2-saran', 1),
      baris('b3-bukti-intro', 1, 3),
      baris('b5-tutup', 4, 5),
      baris('akhir-dingin', 1, 3, 4),
    ],
    periksa: (s) => {
      assert.ok(!nodeDilewati(s).includes('b2-cerita'), 'cerita singkat, bukan kronologi lengkap');
      assert.ok(!s.catatan.includes('bagian-disimpan'), 'pecahan lampu tidak pernah disebut');
      assert.ok(s.catatan.includes('rencana-bengkel'));
    },
  },
  {
    nama: 'bukti kurang + cukup -> tertunda',
    langkah: ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiKurang, 'b3-bukti-kurang/cukup', polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
    akhir: 'tertunda',
    kepercayaan: 6,
    suasana: 'suasana.tenang',
    proses: proses('tepat', 'keliru', 'tepat', 'tepat'),
    paham: PAHAM_SEMUA,
    komunikasi: [[A.dengar, 'naik'], [A.dokumentasi, 'naik'], [A.cukup, 'tetap'], [A.polisTepat, 'naik'], [A.jujur, 'naik'], [A.rangkum, 'naik']],
    // Reaksi langsung atas "cukup" (b3-cukup), dan di epilog ia ingat pernah dijanjikan kabar (.7, karena rangkum).
    baris: [baris('b3-cukup', 1, 2), baris('akhir-tertunda', 4, 7, 6)],
    periksa: (s) => {
      // Kepercayaan tinggi & paham semua, tetapi bukti belum lengkap lebih menentukan (urutan cabang-akhir).
      assert.ok(s.tanda.includes('bukti-belum-lengkap'));
      assert.ok(s.tanda.includes('akt:bukti:lewat:foto-plat'));
      assert.ok(s.catatan.includes('bukti-kurang') && !s.catatan.includes('bukti-lengkap'), 'Catatan kasus: foto belum lengkap');
    },
  },
  {
    nama: 'bukti kurang + cukup + singkat -> tertunda (epilog tanpa janji kabar)',
    langkah: ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiKurang, 'b3-bukti-kurang/cukup', polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/singkat'],
    akhir: 'tertunda',
    kepercayaan: 4,
    suasana: 'suasana.tenang',
    proses: proses('tepat', 'keliru', 'tepat', 'tepat'),
    paham: ['langkah-sekarang', 'polis-dinilai', 'risiko-sendiri'],
    komunikasi: [[A.dengar, 'naik'], [A.dokumentasi, 'naik'], [A.cukup, 'tetap'], [A.polisTepat, 'naik'], [A.jujur, 'naik'], [A.singkat, 'turun']],
    baris: [baris('akhir-tertunda', 4, 5, 6)],
  },
  {
    nama: 'bukti kurang + lengkapi -> tuntas',
    langkah: ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiKurang, 'b3-bukti-kurang/lengkapi', polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
    akhir: 'tuntas',
    kepercayaan: 6,
    suasana: 'suasana.tenang',
    proses: proses('tepat', 'dikoreksi', 'tepat', 'tepat'),
    paham: PAHAM_SEMUA,
    komunikasi: [[A.dengar, 'naik'], [A.dokumentasi, 'naik'], [A.lengkapi, 'tetap'], [A.polisTepat, 'naik'], [A.jujur, 'naik'], [A.rangkum, 'naik']],
    // Foto yang kurang benar-benar ditambahkan (adegan b3-lengkapi). Menambah foto bukan ralat penjelasan:
    // Bu Rina tetap berterima kasih "sudah jelas dari awal" (.2).
    baris: [baris('b3-lengkapi', 1, 2), baris('akhir-tuntas', 1, 2, 5)],
    periksa: (s) => {
      assert.ok(!s.tanda.includes('bukti-belum-lengkap'));
      assert.ok(s.catatan.includes('bukti-lengkap') && !s.catatan.includes('bukti-kurang'), 'Catatan kasus: foto sudah dilengkapi');
    },
  },
  {
    nama: 'bengkel + biarkan -> tertunda (tanpa aktivitas bukti)',
    langkah: ['b1-datang/dengar', 'b2-saran/bengkel', 'b2-bengkel-akibat/biarkan', polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
    akhir: 'tertunda',
    kepercayaan: 6,
    suasana: 'suasana.tenang',
    proses: proses('keliru', 'keliru', 'tepat', 'tepat'),
    // Ringkasan "dinilai dulu" bertabrakan dengan saran "langsung ke bengkel" yang tidak pernah diluruskan.
    paham: ['polis-dinilai', 'risiko-sendiri'],
    komunikasi: [[A.dengar, 'naik'], [A.bengkel, 'naik'], [A.biarkan, 'tetap'], [A.polisTepat, 'naik'], [A.jujur, 'naik'], [A.rangkum, 'naik']],
    baris: [
      baris('b3-seadanya', 1, 2), baris('b4-polis-intro', 2, 4), baris('b5-keberatan', 8, 6), ['b5-rangkum-bengkel', ['b5-rangkum.4']],
      baris('akhir-tertunda', 1, 2, 3, 6),
    ],
    periksa: (s) => {
      assert.deepEqual(Object.keys(s.aktivitas), ['polis'], 'aktivitas bukti tidak pernah dimainkan');
      const dilewati = nodeDilewati(s);
      assert.ok(!dilewati.includes('b3-bukti') && !dilewati.includes('b3-bukti-intro'));
      assert.ok(dilewati.includes('b3-seadanya'));
      assert.ok(!s.riwayat.some((e) => e.jenis === 'aktivitas' && e.aktivitas === 'bukti'));
      assert.ok(!s.catatan.includes('bukti'));
      assert.ok(s.tanda.includes('bukti-seadanya') && s.tanda.includes('perbaiki-dulu'));
    },
  },
  {
    nama: 'ringan + tetap-ringan -> pergi',
    langkah: ['b1-datang/dengar', 'b2-saran/ringan', 'b2-ringan-akibat/tetap-ringan'],
    akhir: 'pergi',
    kepercayaan: -1,
    suasana: 'suasana.cemas',
    proses: proses('keliru', null, null, null),
    paham: [],
    komunikasi: [[A.dengar, 'naik'], [A.ringan, 'turun'], [A.tetapRingan, 'turun']],
    baris: [baris('akhir-pergi', 1, 3, 5)],
    periksa: (s) => {
      assert.deepEqual(s.aktivitas, {});
      assert.ok(s.tanda.includes('menolak-awal'));
      assert.ok(!nodeDilewati(s).some((n) => n.startsWith('b3-') || n.startsWith('b4-') || n.startsWith('b5-')));
    },
  },
  {
    nama: 'polis salah + bertahan -> pergi',
    langkah: ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat, polisDi('tidak-tercakup'), 'b4-polis-salah/bertahan'],
    akhir: 'pergi',
    kepercayaan: -1,
    suasana: 'suasana.cemas',
    proses: proses('tepat', 'tepat', 'keliru', null),
    paham: ['langkah-sekarang'],
    komunikasi: [[A.dengar, 'naik'], [A.dokumentasi, 'naik'], [A.polisTidak, 'turun'], [A.bertahan, 'turun']],
    baris: [baris('akhir-pergi', 2, 4, 6)],
    // Miss Raksa menyuruh membaca lagi baris kartu: kartunya ada di Catatan kasus.
    periksa: (s) => assert.ok(s.catatan.includes('polis')),
  },

  // ============================================================ jalur tambahan (pemulihan & variasi)
  {
    // v2: opsi `ambang-tlo` pensiun dari misi; kiriman dengan id itu = jawaban tak dikenal (cabang cadangan ke-4),
    // Bu Rina menunggu jawaban (4.2), bukan reaksi atas ambang 75% (4.1, hanya untuk simpanan lama).
    nama: 'polis: id opsi pensiun (ambang-tlo) = jawaban tak dikenal + bertahan -> pergi',
    langkah: ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat, polisDi('ambang-tlo'), 'b4-polis-salah/bertahan'],
    akhir: 'pergi',
    kepercayaan: 0,
    suasana: 'suasana.cemas',
    proses: proses('tepat', 'tepat', 'keliru', null),
    paham: ['langkah-sekarang'],
    komunikasi: [[A.dengar, 'naik'], [A.dokumentasi, 'naik'], [A.polisLain, 'turun'], [A.bertahan, 'turun']],
    periksa: (s) => {
      assert.ok(!s.tanda.includes('akt:polis:pilih:ambang-tlo'), 'opsi pensiun tidak pernah dipasang sebagai pilihan');
      assert.deepEqual(barisDitampilkan(s, 'b4-polis').filter((k) => k.startsWith('b4-polis.hasil.')), ['b4-polis.hasil.4.2']);
    },
  },
  {
    nama: 'polis salah + baca-ulang -> tuntas (baca-polis dikoreksi)',
    langkah: ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat, polisDi('tidak-tercakup'), 'b4-polis-salah/baca-ulang', 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
    akhir: 'tuntas',
    kepercayaan: 4,
    suasana: 'suasana.tenang',
    proses: proses('tepat', 'tepat', 'dikoreksi', 'tepat'),
    paham: PAHAM_SEMUA,
    komunikasi: [[A.dengar, 'naik'], [A.dokumentasi, 'naik'], [A.polisTidak, 'turun'], [A.bacaUlang, 'naik'], [A.jujur, 'naik'], [A.rangkum, 'naik']],
    // Risiko sendiri belum pernah dijelaskan (kartu tidak langsung dibaca tepat): pertanyaan versi .7.
    // Salah baca lalu diralat: ucapan terima kasih atas ralat (.6).
    baris: [baris('b5-keberatan', 5, 7), baris('akhir-tuntas', 1, 6, 5)],
  },
  {
    nama: 'ringan + lihat-dulu -> tuntas (dokumentasi-dulu dikoreksi)',
    langkah: ['b1-datang/dengar', 'b2-saran/ringan', 'b2-ringan-akibat/lihat-dulu', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
    akhir: 'tuntas',
    kepercayaan: 5,
    suasana: 'suasana.tenang',
    proses: proses('dikoreksi', 'tepat', 'tepat', 'tepat'),
    paham: PAHAM_SEMUA,
    komunikasi: [[A.dengar, 'naik'], [A.ringan, 'turun'], [A.lihatDulu, 'naik'], [A.polisTepat, 'naik'], [A.jujur, 'naik'], [A.rangkum, 'naik']],
    baris: [baris('akhir-tuntas', 1, 6, 5)],
  },
  {
    nama: 'bengkel + koreksi -> tuntas (dokumentasi-dulu dikoreksi)',
    langkah: ['b1-datang/dengar', 'b2-saran/bengkel', 'b2-bengkel-akibat/koreksi', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
    akhir: 'tuntas',
    kepercayaan: 6,
    suasana: 'suasana.tenang',
    proses: proses('dikoreksi', 'tepat', 'tepat', 'tepat'),
    paham: PAHAM_SEMUA,
    komunikasi: [[A.dengar, 'naik'], [A.bengkel, 'naik'], [A.koreksi, 'tetap'], [A.polisTepat, 'naik'], [A.jujur, 'naik'], [A.rangkum, 'naik']],
    baris: [baris('akhir-tuntas', 1, 6, 5)],
    periksa: (s) => assert.ok(!s.tanda.includes('perbaiki-dulu'), 'saran bengkel dicabut'),
  },
  {
    nama: 'janji awal lalu aturan -> tetap janji (janji tidak pernah diluruskan)',
    langkah: ['b1-datang/janji', 'b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/aturan-janji', 'b5-tutup/rangkum'],
    akhir: 'janji',
    kepercayaan: 2,
    suasana: 'suasana.mulai-tenang',
    // Janji "besok pasti bisa dipakai" masih berlaku: menunjuk aturan tidak meluruskannya.
    proses: proses('tepat', 'tepat', 'tepat', 'keliru'),
    paham: ['langkah-sekarang', 'polis-dinilai'],
    komunikasi: [[A.janji, 'naik'], [A.dokumentasi, 'naik'], [A.polisTepat, 'naik'], [A.aturanJanji, 'turun'], [A.rangkum, 'naik']],
    baris: [baris('b5-tutup', 4, 5), ['b5-rangkum-janji', ['b5-rangkum.2']]],
  },
  {
    nama: 'kartu "pasti-diganti" lalu aturan -> janji (reaksi atas ringkasan: "pasti diganti, kan?")',
    langkah: ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat, polisDi('pasti-diganti'), 'b5-keberatan/aturan-janji', 'b5-tutup/rangkum'],
    akhir: 'janji',
    kepercayaan: 3,
    suasana: 'suasana.tenang',
    proses: proses('tepat', 'tepat', 'keliru', 'keliru'),
    paham: ['langkah-sekarang'],
    komunikasi: [[A.dengar, 'naik'], [A.dokumentasi, 'naik'], [A.polisPasti, 'naik'], [A.aturanJanji, 'turun'], [A.rangkum, 'naik']],
    baris: [['b5-rangkum-janji', ['b5-rangkum.3']], baris('akhir-janji', 1, 2, 4, 5)],
  },
  {
    nama: 'ralat-janji tanpa merangkum -> dingin (sudah jujur, tetapi penutupnya tidak menjelaskan langkah)',
    langkah: ['b1-datang/janji', 'b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/ralat-janji', 'b5-tutup/singkat'],
    akhir: 'dingin',
    kepercayaan: 1,
    suasana: 'suasana.mulai-tenang',
    proses: proses('tepat', 'tepat', 'tepat', 'dikoreksi'),
    paham: ['langkah-sekarang', 'polis-dinilai', 'risiko-sendiri'],
    komunikasi: [[A.janji, 'naik'], [A.dokumentasi, 'naik'], [A.polisTepat, 'naik'], [A.ralatJanji, 'turun'], [A.singkat, 'turun']],
    baris: [baris('akhir-dingin', 2, 3, 6)],
  },
  {
    nama: 'dingin: sudah dirangkum & paham semuanya, tetapi awalnya tidak didengar -> pesan "belum merasa didengar"',
    langkah: ['b1-datang/prosedur', 'b1-pulih/tetap', 'b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
    akhir: 'dingin',
    kepercayaan: 2,
    suasana: 'suasana.mulai-tenang',
    proses: proses('tepat', 'tepat', 'tepat', 'tepat'),
    paham: PAHAM_SEMUA,
    komunikasi: [[A.prosedur, 'turun'], [A.tetap, 'turun'], [A.dokumentasi, 'naik'], [A.polisTepat, 'naik'], [A.jujur, 'naik'], [A.rangkum, 'naik']],
    baris: [baris('akhir-dingin', 2, 3, 5)],
  },
  {
    nama: 'dingin: aturan + singkat -> dingin, nasabah kesal',
    langkah: ['b1-datang/prosedur', 'b1-pulih/tetap', 'b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/aturan', 'b5-tutup/singkat'],
    akhir: 'dingin',
    kepercayaan: -3,
    suasana: 'suasana.kesal',
    proses: proses('tepat', 'tepat', 'tepat', 'tepat'),
    paham: ['langkah-sekarang', 'polis-dinilai'],
    komunikasi: [[A.prosedur, 'turun'], [A.tetap, 'turun'], [A.dokumentasi, 'naik'], [A.polisTepat, 'naik'], [A.aturan, 'turun'], [A.singkat, 'turun']],
    baris: [baris('akhir-dingin', 1, 3, 6)],
  },
];

const arahDari = (delta: number): Arah => (delta > 0 ? 'naik' : delta < 0 ? 'turun' : 'tetap');

/** Setiap perubahan kepercayaan di satu aksi disertai tepat satu alasan baru yang arahnya sesuai. */
function periksaAlasanTiapLangkah(h: HasilJalur): void {
  let sebelum = h.awal;
  for (const s of h.jejak) {
    const delta = s.kepercayaan - sebelum.kepercayaan;
    const alasanBaru = s.riwayat.slice(sebelum.riwayat.length).filter((e) => e.jenis === 'alasan');
    if (delta !== 0) {
      assert.equal(alasanBaru.length, 1, `node ${sebelum.node}: kepercayaan berubah ${delta} tanpa tepat satu alasan`);
    }
    for (const a of alasanBaru) assert.equal(a.jenis === 'alasan' && a.arah, arahDari(delta), `node ${sebelum.node}: arah alasan ${JSON.stringify(a)}`);
    sebelum = s;
  }
}

/** Tanda hasil aktivitas ('akt:<id>:...'): hanya dibaca di node aktivitasnya sendiri (dijaga tes di bawah). */
const TANDA_AKTIVITAS = (t: string): boolean => t.startsWith('akt:');
let TITIK: StateCerita[] | null = null;
/** Semua state yang menunggu keputusan (pilihan/aktivitas) di AUTO-1, dihitung sekali. */
const titikAuto1 = (): StateCerita[] => (TITIK ??= titikKeputusan(EP, { abaikanTanda: TANDA_AKTIVITAS }));

function tandaDalam(k: Kondisi | undefined, hasil: string[] = []): string[] {
  if (!k) return hasil;
  if ('tanda' in k) hasil.push(k.tanda);
  else if ('tidak' in k) tandaDalam(k.tidak, hasil);
  else if ('semua' in k) k.semua.forEach((x) => tandaDalam(x, hasil));
  else if ('salahSatu' in k) k.salahSatu.forEach((x) => tandaDalam(x, hasil));
  return hasil;
}

// Setiap jalur dimainkan sekali (state dibekukan: mesin yang mengubah masukan akan melempar TypeError).
const DIMAINKAN = new Map<string, HasilJalur>();
const main = (j: Harapan): HasilJalur => {
  let h = DIMAINKAN.get(j.nama);
  if (!h) {
    h = mainkanJalur(EP, j.langkah, { amati: bekukan });
    DIMAINKAN.set(j.nama, h);
  }
  return h;
};

// ================================================================== 1. validasi & penjelajahan

test('validasi: AUTO-1 sah; penjelajahan semua jalur tanpa masalah dan kelima akhir tercapai', () => {
  assert.deepEqual(validasiEpisode(EP), []);
  const j = jelajahiSemuaJalur(EP);
  assert.deepEqual(j.masalah, []);
  assert.deepEqual(Object.keys(j.akhir).sort(), [...AKHIR_SEMUA].sort());
  for (const a of AKHIR_SEMUA) assert.ok((j.akhir[a] ?? 0) > 0, `akhir ${a} tercapai`);
  assert.equal(j.jalur, Object.values(j.akhir).reduce((x, y) => x + y, 0));
  assert.deepEqual(Object.keys(EP.akhir).sort(), [...AKHIR_SEMUA].sort(), 'kontrak: lima akhir');
});

// ================================================================== 2. jalur wajib + tambahan

for (const j of JALUR) {
  test(`jalur: ${j.nama}`, () => {
    const h = main(j);
    const s = h.state;
    assert.equal(s.akhir, j.akhir);
    assert.equal(nodeKini(EP, s)?.jenis, 'akhir');
    assert.equal(s.baris, barisTerlihat(EP, s).length, 'semua baris epilog tampil');
    assert.equal(jalankan(EP, s, LANJUT), s, 'episode selesai: lanjut = no-op');
    assert.equal(s.kepercayaan, j.kepercayaan);
    assert.equal(suasanaNasabah(EP, s).label, j.suasana);

    const r = ringkasanAkhir(EP, s);
    assert.equal(r.akhir, j.akhir);
    assert.equal(r.suasana.label, j.suasana);
    // Dua sisi terpisah: komunikasi = alasan perubahan suasana; proses = ketepatan langkah klaim.
    assert.deepEqual(r.komunikasi.map((k) => [k.teks, k.arah]), j.komunikasi);
    assert.deepEqual(Object.fromEntries(r.proses.map((p) => [p.id, p.nilai])), j.proses);
    assert.deepEqual(r.proses.map((p) => p.label), r.proses.map((p) => `proses.${p.id}`));
    assert.deepEqual(r.paham.filter((p) => p.sudah).map((p) => p.id).sort(), [...j.paham].sort());
    const labelLain = new Set([...r.proses.map((p) => p.label), ...r.paham.map((p) => p.label)]);
    assert.ok(r.komunikasi.every((k) => !labelLain.has(k.teks)), 'komunikasi tidak mencampur label proses/paham');
    // Keputusan tercatat = pilihan jalur (aktivitas tidak dihitung sebagai keputusan).
    assert.deepEqual(r.keputusan.map((k) => `${k.node}/${k.pilihan}`), j.langkah.filter((l): l is `${string}/${string}` => typeof l === 'string'));
    periksaAlasanTiapLangkah(h);

    for (const [node, harap] of j.baris ?? []) assert.deepEqual(barisDitampilkan(s, node), harap, `baris tampil di ${node}`);
    j.periksa?.(s);
  });
}

test('jalur uji mencakup kelima akhir', () => {
  assert.deepEqual([...new Set(JALUR.map((j) => j.akhir))].sort(), [...AKHIR_SEMUA].sort());
});

// ================================================================== 3. konsekuensi nyata

test('konsekuensi: dengar / prosedur / janji di b1-datang mengubah suasana, baris berikutnya, dan catatan kasus', () => {
  const titik = bekukan(mainkanJalur(EP, []).state);
  assert.equal(titik.node, 'b1-datang');
  assert.deepEqual(pilihanTersedia(EP, titik).map((p) => p.id).sort(), ['dengar', 'janji', 'prosedur']);
  const pilih = (pilihan: string) => jalankan(EP, titik, { jenis: 'pilih', node: 'b1-datang', pilihan });
  const dengar = pilih('dengar');
  const prosedur = pilih('prosedur');
  const janji = pilih('janji');
  assert.deepEqual([dengar.node, prosedur.node, janji.node], ['b2-cerita', 'b1-pulih', 'b2-cerita']);
  assert.deepEqual([dengar.kepercayaan, prosedur.kepercayaan, janji.kepercayaan], [2, -1, 1]);
  assert.deepEqual([dengar, prosedur, janji].map((s) => suasanaNasabah(EP, s).label), ['suasana.mulai-tenang', 'suasana.cemas', 'suasana.mulai-tenang']);
  assert.equal(janji.proses['tanpa-janji'], 'keliru');
  assert.equal(dengar.proses['tanpa-janji'], undefined);
  assert.equal(new Set([dengar, prosedur, janji].map((s) => intiState(s))).size, 3);

  // Baris berikutnya: kronologi lengkap vs singkat; baris bagian-disimpan hanya bila didengar dulu.
  const sampaiSaran = (langkah: LangkahJalur[]) => mainkanJalur(EP, langkah).state;
  const sDengar = sampaiSaran(['b1-datang/dengar']);
  const sJanji = sampaiSaran(['b1-datang/janji']);
  const sMaaf = sampaiSaran(['b1-datang/prosedur', 'b1-pulih/maaf']);
  const sTetap = sampaiSaran(['b1-datang/prosedur', 'b1-pulih/tetap']);
  for (const s of [sDengar, sJanji, sMaaf, sTetap]) assert.equal(s.node, 'b2-saran');
  assert.deepEqual(barisDitampilkan(sDengar, 'b2-cerita'), ['b2-cerita.3', 'b2-cerita.5']);
  assert.deepEqual(barisDitampilkan(sJanji, 'b2-cerita'), ['b2-cerita.1', 'b2-cerita.5']);
  assert.deepEqual(barisDitampilkan(sMaaf, 'b2-cerita'), ['b2-cerita.2', 'b2-cerita.5']);
  assert.deepEqual(barisDitampilkan(sTetap, 'b2-cerita'), []);
  // Detail pecahan lampu ada di node tersendiri yang hanya dicapai bila didengar dulu; baru dicatat setelah disebut.
  assert.deepEqual(barisDitampilkan(sDengar, 'b2-cerita-bagian'), ['b2-cerita.6']);
  assert.deepEqual(barisDitampilkan(sMaaf, 'b2-cerita-bagian'), ['b2-cerita.6']);
  assert.deepEqual(barisDitampilkan(sJanji, 'b2-cerita-bagian'), []);
  assert.deepEqual(barisDitampilkan(sTetap, 'b2-cerita-bagian'), []);
  {
    let terlaluAwal = false;
    mainkanJalur(EP, ['b1-datang/dengar'], { amati: (st) => { if (st.node !== 'b2-cerita-bagian' && st.node !== 'b2-saran' && st.catatan.includes('bagian-disimpan')) terlaluAwal = true; } });
    assert.equal(terlaluAwal, false, 'belum dicatat sebelum Bu Rina menyebutnya');
  }
  assert.deepEqual(barisDitampilkan(sTetap, 'b2-singkat'), ['b2-singkat.2']);
  assert.deepEqual(barisDitampilkan(sTetap, 'b2-saran'), ['b2-saran.1']);
  assert.deepEqual(barisDitampilkan(sDengar, 'b2-saran'), ['b2-saran.2']);

  // Catatan kasus.
  const punya = (s: StateCerita) => s.catatan.includes('bagian-disimpan');
  assert.deepEqual([sDengar, sJanji, sMaaf, sTetap].map(punya), [true, false, true, false]);
  for (const s of [sDengar, sJanji, sMaaf, sTetap]) {
    assert.ok(['masalah', 'kebutuhan', 'rencana-bengkel'].every((c) => s.catatan.includes(c)));
  }
  assert.deepEqual([sDengar, sJanji, sMaaf, sTetap].map((s) => s.kepercayaan), [2, 1, 1, -2]);
  assert.equal(suasanaNasabah(EP, sTetap).label, 'suasana.kesal');
});

test('konsekuensi: janji sebelumnya mengubah keberatan Bu Rina dan pilihan jawaban yang tersedia', () => {
  const sampai = (langkah: LangkahJalur[]) => {
    const s = mainkanJalur(EP, langkah).state;
    assert.equal(s.node, 'b5-keberatan');
    return s;
  };
  const tanpaJanji = sampai(['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai')]);
  const janjiAwal = sampai(['b1-datang/janji', 'b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai')]);
  const janjiPolis = sampai(['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat, polisDi('pasti-diganti')]);
  const tersedia = (s: StateCerita) => pilihanTersedia(EP, s).map((p) => p.id).sort();
  // `aturan` (tanpa janji) dan `aturan-janji` (janji lama masih berlaku) = kalimat yang sama, akibat proses berbeda.
  assert.deepEqual(tersedia(tanpaJanji), ['aturan', 'janjikan', 'jujur']);
  assert.deepEqual(tersedia(janjiAwal), ['aturan-janji', 'janjikan', 'ralat-janji']);
  assert.deepEqual(tersedia(janjiPolis), ['aturan-janji', 'janjikan', 'ralat-polis']);
  assert.equal(
    teksCerita(EP, 'b5-keberatan.aturan-janji', 'id', { nama: 'Weli' }),
    teksCerita(EP, 'b5-keberatan.aturan', 'id', { nama: 'Weli' }),
    'pemain melihat kalimat yang sama',
  );
  assert.deepEqual(barisDitampilkan(tanpaJanji, 'b5-keberatan'), ['b5-keberatan.5', 'b5-keberatan.6']);
  assert.deepEqual(barisDitampilkan(janjiAwal, 'b5-keberatan'), ['b5-keberatan.2', 'b5-keberatan.3']);
  assert.deepEqual(barisDitampilkan(janjiPolis, 'b5-keberatan'), ['b5-keberatan.1', 'b5-keberatan.4']);
  // Pilihan yang tidak tersedia ditolak mesin.
  assert.equal(jalankan(EP, janjiAwal, { jenis: 'pilih', node: 'b5-keberatan', pilihan: 'jujur' }), janjiAwal);
  assert.equal(jalankan(EP, tanpaJanji, { jenis: 'pilih', node: 'b5-keberatan', pilihan: 'ralat-janji' }), tanpaJanji);
  assert.equal(jalankan(EP, janjiAwal, { jenis: 'pilih', node: 'b5-keberatan', pilihan: 'ralat-polis' }), janjiAwal);
  assert.equal(jalankan(EP, janjiAwal, { jenis: 'pilih', node: 'b5-keberatan', pilihan: 'aturan' }), janjiAwal);
  assert.equal(jalankan(EP, tanpaJanji, { jenis: 'pilih', node: 'b5-keberatan', pilihan: 'aturan-janji' }), tanpaJanji);
  // Menunjuk aturan tanpa janji apa pun: butir "tidak menjanjikan" tepat (bukan "tidak tersentuh"); dengan janji
  // lama yang masih berlaku, butir itu tetap keliru.
  const aturan = jalankan(EP, tanpaJanji, { jenis: 'pilih', node: 'b5-keberatan', pilihan: 'aturan' });
  const aturanJanji = jalankan(EP, janjiAwal, { jenis: 'pilih', node: 'b5-keberatan', pilihan: 'aturan-janji' });
  assert.equal(aturan.proses['tanpa-janji'], 'tepat');
  assert.equal(aturanJanji.proses['tanpa-janji'], 'keliru');
  assert.equal(aturan.kepercayaan - tanpaJanji.kepercayaan, -2);
  assert.equal(aturanJanji.kepercayaan - janjiAwal.kepercayaan, -2);
  // Jawaban di b5-keberatan tidak menyebut urutan langkah: belum ada yang memasang `langkah-berikut`.
  for (const s of [tanpaJanji, janjiAwal, janjiPolis]) {
    for (const p of pilihanTersedia(EP, s)) {
      const b = jalankan(EP, s, { jenis: 'pilih', node: 'b5-keberatan', pilihan: p.id });
      assert.ok(!b.paham.includes('langkah-berikut'), `b5-keberatan/${p.id} tidak memasang langkah-berikut`);
    }
  }

  // Saran "langsung ke bengkel" dibiarkan: Bu Rina menanyakan klaimnya (mobil sudah akan diperbaiki siang ini).
  const bengkel = sampai(['b1-datang/dengar', 'b2-saran/bengkel', 'b2-bengkel-akibat/biarkan', polisDi('bisa-dinilai')]);
  assert.deepEqual(barisDitampilkan(bengkel, 'b5-keberatan'), ['b5-keberatan.8', 'b5-keberatan.6']);

  // Janji di awal juga mengubah pengantar polis.
  assert.deepEqual(barisDitampilkan(janjiAwal, 'b4-polis-intro'), ['b4-polis-intro.1', 'b4-polis-intro.3']);
  assert.deepEqual(barisDitampilkan(tanpaJanji, 'b4-polis-intro'), ['b4-polis-intro.1', 'b4-polis-intro.4']);

  // Di b5-tutup, rangkum vs singkat: selisih kepercayaan 2, paham & tanda berbeda.
  const tutup = mainkanJalur(EP, ['b5-keberatan/aturan'], { dari: tanpaJanji }).state;
  assert.equal(tutup.node, 'b5-tutup');
  const rangkum = majuSampaiKeputusan(EP, jalankan(EP, tutup, { jenis: 'pilih', node: 'b5-tutup', pilihan: 'rangkum' }));
  const singkat = majuSampaiKeputusan(EP, jalankan(EP, tutup, { jenis: 'pilih', node: 'b5-tutup', pilihan: 'singkat' }));
  assert.equal(rangkum.kepercayaan - singkat.kepercayaan, 2);
  assert.ok(rangkum.paham.includes('langkah-berikut') && !singkat.paham.includes('langkah-berikut'));
  assert.ok(rangkum.tanda.includes('rangkum') && !singkat.tanda.includes('rangkum'));
});

test('K4 bermakna: hanya ringkasan yang diterima memberi "langkah-berikut"; penutup "singkat" tidak pernah berakhir tuntas', () => {
  const titik = titikAuto1().filter((s) => s.node === 'b5-tutup');
  assert.ok(titik.length >= 10, `keadaan di b5-tutup: ${titik.length}`);
  let tuntas = 0;
  for (const s of titik) {
    bekukan(s);
    assert.ok(!s.paham.includes('langkah-berikut'), 'langkah berikutnya belum dijelaskan sebelum menutup');
    const singkat = majuSampaiKeputusan(EP, jalankan(EP, s, { jenis: 'pilih', node: 'b5-tutup', pilihan: 'singkat' }));
    const rangkum = majuSampaiKeputusan(EP, jalankan(EP, s, { jenis: 'pilih', node: 'b5-tutup', pilihan: 'rangkum' }));
    assert.ok(singkat.akhir && rangkum.akhir, 'kedua penutup sampai ke akhir');
    assert.notEqual(singkat.akhir, 'tuntas', `singkat -> ${singkat.akhir} (tanda ${s.tanda.join(',')})`);
    assert.ok(!singkat.paham.includes('langkah-berikut'));
    // Ringkasan tidak "diterima" bila janji masih berlaku atau saran langsung ke bengkel belum diluruskan.
    const janjiBerlaku = ['janji-awal', 'janji-polis', 'janji-waktu'].some((t) => s.tanda.includes(t));
    const saranBengkel = s.tanda.includes('bukti-seadanya');
    assert.equal(rangkum.paham.includes('langkah-berikut'), !janjiBerlaku && !saranBengkel, `rangkum (tanda ${s.tanda.join(',')})`);
    if (rangkum.akhir === 'tuntas') tuntas++;
  }
  assert.ok(tuntas > 0, 'rangkum masih bisa berakhir tuntas');
  // Akhir yang sama tidak lagi menampilkan kalimat yang bertentangan: "nanti dikabari" + "sudah paham langkahnya".
  const h = mainkanJalur(EP, [...JALUR_TERBAIK.slice(0, -1), 'b5-tutup/singkat']).state;
  const r = ringkasanAkhir(EP, h);
  assert.equal(r.paham.find((p) => p.id === 'langkah-berikut')?.sudah, false);
  assert.ok(!barisDitampilkan(h, 'akhir-dingin').includes('akhir-dingin.5'), 'bukan "belum merasa didengar": ia sudah didengar');
});

test('b3-bukti-kurang: "lengkapi" dan "cukup" punya adegan & catatan kasus yang berbeda', () => {
  const kurang = mainkanJalur(EP, ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiKurang]).state;
  assert.equal(kurang.node, 'b3-bukti-kurang');
  const lengkapi = jalankan(EP, kurang, { jenis: 'pilih', node: 'b3-bukti-kurang', pilihan: 'lengkapi' });
  const cukup = jalankan(EP, kurang, { jenis: 'pilih', node: 'b3-bukti-kurang', pilihan: 'cukup' });
  assert.deepEqual([lengkapi.node, cukup.node], ['b3-lengkapi', 'b3-cukup']);
  const l2 = majuSampaiKeputusan(EP, lengkapi);
  const c2 = majuSampaiKeputusan(EP, cukup);
  assert.equal(l2.node, 'b4-polis');
  assert.equal(c2.node, 'b4-polis');
  assert.ok(l2.catatan.includes('bukti-lengkap') && !l2.catatan.includes('bukti-kurang'));
  assert.ok(c2.catatan.includes('bukti-kurang') && !c2.catatan.includes('bukti-lengkap'));
  // Narasi "lengkapi" menyebut ketiga bukti yang kini ada (bukan hanya "kembali ke meja").
  const narasi = teksCerita(EP, 'b3-lengkapi.1', 'id', { nama: 'Weli' });
  for (const k of ['akt.bukti.opsi.foto-full', 'akt.bukti.opsi.foto-plat']) {
    const inti = teksCerita(EP, k, 'id').replace(/^Foto /, '').toLowerCase();
    assert.ok(narasi.toLowerCase().includes(inti), `narasi menyebut "${inti}"`);
  }
});

test('tanda hasil aktivitas hanya dibaca di node aktivitasnya sendiri (syarat penyederhanaan titikKeputusan)', () => {
  let dibaca = 0;
  for (const n of Object.values(EP.node)) {
    const luar: string[] = [];
    if (n.jenis === 'cabang') n.cabang.forEach((c) => tandaDalam(c.jika, luar));
    else n.baris.forEach((b) => tandaDalam(b.jika, luar));
    if (n.jenis === 'pilihan') n.pilihan.forEach((p) => tandaDalam(p.jika, luar));
    assert.deepEqual(luar.filter(TANDA_AKTIVITAS), [], `node ${n.id} membaca tanda aktivitas`);
    if (n.jenis === 'aktivitas') {
      const sendiri = n.hasil.flatMap((h) => [...tandaDalam(h.jika), ...(h.umpanBalik ?? []).flatMap((b) => tandaDalam(b.jika))]);
      for (const t of sendiri.filter(TANDA_AKTIVITAS)) assert.ok(t.startsWith(`akt:${n.aktivitas}:`), `${n.id}: ${t}`);
      dibaca += sendiri.length;
    }
  }
  assert.ok(dibaca > 0);
});

test('tanpa cabang palsu: di SETIAP titik pilihan yang terjangkau, tiap pilihan memberi state yang berbeda', () => {
  const titik = titikAuto1().filter((s) => nodeKini(EP, s)?.jenis === 'pilihan');
  const nodePilihan = Object.values(EP.node).filter((n) => n.jenis === 'pilihan').map((n) => n.id).sort();
  assert.deepEqual([...new Set(titik.map((s) => s.node))].sort(), nodePilihan, 'semua node pilihan terjangkau');
  let pasangan = 0;
  for (const s of titik) {
    bekukan(s);
    const hasil = pilihanTersedia(EP, s).map((p) => {
      const b = jalankan(EP, s, { jenis: 'pilih', node: s.node, pilihan: p.id });
      assert.notEqual(b, s, `${s.node}/${p.id} harus sah`);
      return { id: p.id, inti: intiState(b) };
    });
    assert.ok(hasil.length >= 2, `${s.node}: minimal 2 pilihan`);
    for (let i = 0; i < hasil.length; i++) {
      for (let k = i + 1; k < hasil.length; k++) {
        assert.notEqual(hasil[i]!.inti, hasil[k]!.inti, `${s.node}: "${hasil[i]!.id}" dan "${hasil[k]!.id}" berakibat sama`);
        pasangan++;
      }
    }
  }
  assert.ok(pasangan > 20, `pasangan diperiksa: ${pasangan}`);
});

// ================================================================== 4. muat ulang & aksi ganda

test('muat ulang di setiap langkah jalur terbaik: hasil identik, tanpa efek ganda', () => {
  const biasa = mainkanJalur(EP, JALUR_TERBAIK);
  const dimuatTiapLangkah = mainkanJalur(EP, JALUR_TERBAIK, { muatUlang: true });
  assert.deepEqual(dimuatTiapLangkah.aksi, biasa.aksi);
  assert.deepEqual(dimuatTiapLangkah.jejak, biasa.jejak, 'setiap state antara identik');
  assert.deepEqual(dimuatTiapLangkah.state, biasa.state);
  // v2 memangkas baris yang mengulang (33 -> 29 aksi); jalurnya tetap panjang dan lengkap.
  assert.ok(biasa.aksi.length > 25, `jumlah aksi: ${biasa.aksi.length}`);

  for (let i = 0; i <= biasa.aksi.length; i++) {
    const titik = i === 0 ? biasa.awal : biasa.jejak[i - 1]!;
    const dimuat = salinJson(titik);
    assert.deepEqual(dimuat, titik, `langkah ${i}: state tahan JSON`);
    const sebelumnya = biasa.aksi[i - 1];
    if (sebelumnya && sebelumnya.jenis !== 'lanjut') {
      // Ketukan / kiriman ulang setelah muat ulang tidak menerapkan efek lagi.
      assert.equal(jalankan(EP, dimuat, sebelumnya), dimuat, `langkah ${i}: ${JSON.stringify(sebelumnya)} diulang`);
    }
    const akhir = ulangiAksi(EP, dimuat, biasa.aksi.slice(i));
    assert.deepEqual(akhir, biasa.state, `muat ulang di langkah ${i}`);
  }
  assert.deepEqual(ringkasanAkhir(EP, salinJson(biasa.state)), ringkasanAkhir(EP, biasa.state));
});

test('aksi ganda & aksi di luar giliran mengembalikan objek state yang sama', () => {
  const h = mainkanJalur(EP, []);
  const diDatang = h.state;
  assert.equal(diDatang.node, 'b1-datang');
  const belumHabis = h.jejak.find((s) => s.node === 'b1-datang' && s.baris < barisTerlihat(EP, s).length);
  assert.ok(belumHabis, 'ada state b1-datang dengan baris belum habis');
  const dengar: AksiCerita = { jenis: 'pilih', node: 'b1-datang', pilihan: 'dengar' };
  assert.equal(jalankan(EP, belumHabis, dengar), belumHabis, 'pilih sebelum baris habis');

  assert.equal(jalankan(EP, diDatang, LANJUT), diDatang, 'lanjut saat pilihan wajib');
  assert.equal(jalankan(EP, diDatang, { jenis: 'pilih', node: 'b1-datang', pilihan: 'tidak-ada' }), diDatang, 'pilihan tak dikenal');
  assert.equal(jalankan(EP, diDatang, { jenis: 'pilih', node: 'b2-saran', pilihan: 'dokumentasi' }), diDatang, 'node lain');
  assert.equal(jalankan(EP, diDatang, { jenis: 'aktivitas', node: 'b1-datang', jawaban: {} }), diDatang, 'aktivitas di node pilihan');
  assert.equal(jalankan(EP, diDatang, { jenis: 'ulangBab', bab: 'polis' }), diDatang, 'ulang bab yang belum dimasuki');

  const s1 = jalankan(EP, diDatang, dengar);
  assert.notEqual(s1, diDatang);
  assert.equal(jalankan(EP, s1, dengar), s1, 'pilih sama dua kali');
  assert.equal(jalankan(EP, s1, { jenis: 'pilih', node: 'b1-datang', pilihan: 'prosedur' }), s1, 'pilihan lain di node lama');
  assert.equal(s1.kepercayaan, 2);

  // Aktivitas dua kali (jawaban sama / berbeda), saat umpan balik tampil dan setelah lanjut.
  const siap = mainkanJalur(EP, ['b1-datang/dengar', 'b2-saran/dokumentasi']).state;
  assert.equal(siap.node, 'b3-bukti');
  const kirim: AksiCerita = { jenis: 'aktivitas', node: 'b3-bukti', jawaban: BUKTI_TEPAT };
  const k1 = jalankan(EP, siap, kirim);
  assert.notEqual(k1, siap);
  assert.equal(jalankan(EP, k1, kirim), k1);
  assert.equal(jalankan(EP, k1, { jenis: 'aktivitas', node: 'b3-bukti', jawaban: BUKTI_KURANG }), k1);
  assert.equal(jalankan(EP, k1, { jenis: 'pilih', node: 'b3-bukti-kurang', pilihan: 'cukup' }), k1, 'pilihan node berikut sebelum lanjut');
  const k2 = jalankan(EP, k1, LANJUT);
  assert.equal(k2.node, 'b3-bukti-tepat');
  assert.equal(jalankan(EP, k2, kirim), k2, 'aktivitas lama tidak bisa dikirim lagi');
  assert.deepEqual(k2.proses, k1.proses, 'lanjut tidak menerapkan efek hasil lagi');
  assert.deepEqual(k2.catatan, k1.catatan);

  // Episode selesai: tidak ada aksi yang mengubah apa pun, kecuali ulang bab / mulai ulang.
  const selesai = mainkanJalur(EP, JALUR_TERBAIK).state;
  assert.equal(jalankan(EP, selesai, LANJUT), selesai);
  assert.equal(jalankan(EP, selesai, { jenis: 'pilih', node: 'b5-tutup', pilihan: 'rangkum' }), selesai);
  assert.equal(jalankan(EP, selesai, { jenis: 'aktivitas', node: 'b4-polis', jawaban: polis('bisa-dinilai') }), selesai);
  const baru = jalankan(EP, selesai, { jenis: 'mulaiUlang' });
  assert.equal(baru.node, EP.mulai);
  assert.equal(baru.kepercayaan, EP.kepercayaanAwal);
  assert.deepEqual([baru.tanda, baru.paham, baru.catatan, baru.akhir], [[], [], [], null]);
});

test('jalankan tidak mengubah state masukan (semua jalur dimainkan dengan state beku)', () => {
  for (const j of JALUR) {
    const beku = main(j);
    const biasa = mainkanJalur(EP, j.langkah);
    assert.deepEqual(beku.state, biasa.state, j.nama);
  }
});

// ================================================================== 5. bahasa

test('bahasa: state & riwayat hanya berisi id dan kunci; tiap kunci yang dirujuk ada di id/en/zh', () => {
  // Label istilah = satu kata seperti tertulis di naskah ("nasabah", "polis") yang memang sama dengan id pemeran /
  // bab / aktivitas; bukan tanda teks bocor ke state, jadi tidak ikut dibandingkan.
  const nilaiTeks = new Set(BAHASA.flatMap((b) => Object.entries(TEKS_AUTO_1[b]).filter(([k]) => !/^istilah\.[^.]+\.label$/.test(k)).map(([, v]) => v)));
  const semuaState = [...JALUR.flatMap((j) => [main(j).awal, ...main(j).jejak]), ...titikAuto1()];
  const kunci = new Set<string>();
  const rujuk = (k: string | undefined) => {
    if (k !== undefined) kunci.add(k);
  };
  for (const s of semuaState) {
    const json = JSON.stringify(s);
    assert.ok(/^[\x20-\x7e]*$/.test(json), `state berisi karakter non-ASCII (teks terjemahan?) di node ${s.node}`);
    for (const x of semuaString(s)) assert.ok(!nilaiTeks.has(x), `nilai teks "${x}" masuk ke state (node ${s.node})`);

    for (const e of s.riwayat) {
      if (e.jenis === 'baris' || e.jenis === 'pilihan' || e.jenis === 'alasan') rujuk(e.teks);
      if (e.jenis === 'baris' && e.siapa !== 'pemain' && e.siapa !== 'narasi') {
        const p = EP.pemeran[e.siapa];
        assert.ok(p, `pembicara "${e.siapa}" dikenal`);
        rujuk(p.nama);
        rujuk(p.peran);
      }
    }
    rujuk(s.terakhir?.teks);
    rujuk(s.terakhir?.alasan);
    const bab = babKini(EP, s);
    rujuk(bab?.bab.judul);
    rujuk(bab?.bab.tujuan);
    rujuk(suasanaNasabah(EP, s).label);
    const n = nodeKini(EP, s);
    if (n?.jenis === 'pilihan') {
      rujuk(n.tanya);
      for (const p of pilihanTersedia(EP, s)) rujuk(p.teks);
    }
    if (s.akhir) {
      const info = EP.akhir[s.akhir]!;
      [info.judul, info.ringkas, ...info.pelajaran].forEach(rujuk);
      const r = ringkasanAkhir(EP, s);
      for (const x of [...r.paham, ...r.proses]) rujuk(x.label);
    }
  }
  assert.ok(kunci.size > 100, `kunci dirujuk: ${kunci.size}`);
  for (const k of kunci) {
    for (const b of BAHASA) {
      const t = TEKS_AUTO_1[b][k];
      assert.ok(typeof t === 'string' && t.trim().length > 0, `kunci "${k}" tidak ada / kosong di ${b}`);
      const tampil = teksCerita(EP, k, b, { nama: 'Weli' });
      assert.ok(!/\{\w+\}/.test(tampil), `kunci "${k}" (${b}) masih punya parameter: ${tampil}`);
    }
  }
});

test('bahasa: menampilkan riwayat dalam bahasa lain di tengah episode tidak mengubah state', () => {
  const s = mainkanJalur(EP, ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat]).state;
  const sebelum = JSON.stringify(s);
  const tampil: Record<string, string[]> = {};
  for (const b of BAHASA) {
    tampil[b] = s.riwayat.flatMap((e) => ('teks' in e ? [teksCerita(EP, e.teks, b, { nama: 'Weli' })] : []));
  }
  assert.equal(JSON.stringify(s), sebelum);
  assert.notDeepEqual(tampil.id, tampil.en);
  assert.notDeepEqual(tampil.id, tampil.zh);
  // Setelah "ganti bahasa", aksi berikutnya tetap sama hasilnya.
  const lanjut = mainkanJalur(EP, [polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/rangkum'], { dari: salinJson(s) }).state;
  assert.deepEqual(lanjut, mainkanJalur(EP, JALUR_TERBAIK).state);
});

// ================================================================== 6. aktivitas

/**
 * v2: cabang bukti kurang = SATU kalimat mentor tentang akibatnya (2.5 bila ada bukti terlewat; 2.4 hanya untuk
 * kiriman >3 foto tanpa bukti terlewat). Foto mana yang terlewat/tidak membantu + alasannya tampil per foto di panel
 * (DefAktivitas.alasanOpsi; ui/hasilAktivitas.test.ts rincianOpsi), dan tetap tercatat sebagai tanda lewat:<opsi>.
 */
const PETUNJUK_KURANG = 'b3-bukti.hasil.2.5';
const PETUNJUK_TIDAK_BERKAITAN = 'b3-bukti.hasil.2.4';

function siapBukti(): StateCerita {
  const s = mainkanJalur(EP, ['b1-datang/dengar', 'b2-saran/dokumentasi']).state;
  assert.equal(s.node, 'b3-bukti');
  assert.equal(s.umpanBalik, null);
  return bekukan(s);
}

function kirimDi(s: StateCerita, jawaban: MissionAnswer): { hasil: StateCerita; tandaBaru: string[]; umpan: string[]; berikut: string } {
  const hasil = jalankan(EP, s, { jenis: 'aktivitas', node: s.node, jawaban });
  assert.notEqual(hasil, s, `jawaban ${JSON.stringify(jawaban)} harus diterima (tidak ada jalan buntu)`);
  const ub = umpanBalikKini(EP, hasil);
  assert.ok(ub, 'umpan balik tampil setelah dinilai');
  const lanjut = jalankan(EP, hasil, LANJUT);
  assert.notEqual(lanjut, hasil);
  return {
    hasil,
    tandaBaru: hasil.tanda.filter((t) => !s.tanda.includes(t)),
    umpan: ub.baris.map((b) => b.teks),
    berikut: lanjut.node,
  };
}

test('aktivitas bukti: 3 tepat (urutan bebas) -> cabang tepat', () => {
  const siap = siapBukti();
  const [a, b, c] = BUKTI_BENAR;
  const urutan = [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]];
  for (const u of urutan) {
    const r = kirimDi(siap, { bukti: [...u] });
    assert.deepEqual(r.tandaBaru.sort(), ['akt:bukti:tepat', ...BUKTI_BENAR.map((o) => `akt:bukti:pilih:${o}`)].sort());
    assert.equal(r.hasil.aktivitas.bukti?.akurasi, 1);
    assert.equal(r.hasil.proses.bukti, 'tepat');
    assert.ok(r.hasil.catatan.includes('bukti'));
    assert.equal(r.hasil.kepercayaan, siap.kepercayaan);
    assert.deepEqual(r.umpan, ['b3-bukti.hasil.1.1']);
    assert.equal(r.berikut, 'b3-bukti-tepat');
  }
});

test('aktivitas bukti: 2 tepat + 1 salah -> cabang kurang, opsi terlewat tercatat sebagai lewat:<opsi>', () => {
  const siap = siapBukti();
  let kasus = 0;
  for (const lewat of BUKTI_BENAR) {
    for (const salah of BUKTI_LAIN) {
      const pilihan = [salah, ...BUKTI_BENAR.filter((o) => o !== lewat)];
      const r = kirimDi(siap, { bukti: pilihan });
      assert.ok(r.tandaBaru.includes('akt:bukti:sebagian'), `${pilihan.join(',')}: sebagian`);
      assert.ok(!r.tandaBaru.includes('akt:bukti:tepat'));
      assert.deepEqual(r.tandaBaru.filter((t) => t.startsWith('akt:bukti:lewat:')), [`akt:bukti:lewat:${lewat}`]);
      assert.ok(r.tandaBaru.includes(`akt:bukti:pilih:${salah}`));
      assert.ok(!r.tandaBaru.includes(`akt:bukti:pilih:${lewat}`));
      const akurasi = r.hasil.aktivitas.bukti!.akurasi;
      assert.ok(akurasi > 0 && akurasi < 1, `akurasi ${akurasi}`);
      assert.equal(r.hasil.proses.bukti, 'keliru');
      assert.ok(r.hasil.catatan.includes('bukti'));
      assert.deepEqual(r.umpan, [PETUNJUK_KURANG], 'satu kalimat mentor; rincian per foto di panel');
      assert.equal(r.berikut, 'b3-bukti-kurang');
      kasus++;
    }
  }
  assert.equal(kasus, 9);

  // Lebih dari 3 foto (3 tepat + 1 tidak berkaitan) bukan jawaban tepat.
  const lebih = kirimDi(siap, { bukti: [...BUKTI_BENAR, 'foto-dasbor'] });
  assert.ok(lebih.tandaBaru.includes('akt:bukti:sebagian'));
  assert.deepEqual(lebih.umpan, [PETUNJUK_TIDAK_BERKAITAN]);
  assert.equal(lebih.berikut, 'b3-bukti-kurang');

  // Tiga-tiganya salah: semua bukti terlewat.
  const salahSemua = kirimDi(siap, { bukti: [...BUKTI_LAIN] });
  assert.ok(salahSemua.tandaBaru.includes('akt:bukti:belum'));
  assert.deepEqual(salahSemua.tandaBaru.filter((t) => t.startsWith('akt:bukti:lewat:')).sort(), BUKTI_BENAR.map((o) => `akt:bukti:lewat:${o}`).sort());
  assert.deepEqual(salahSemua.umpan, [PETUNJUK_KURANG]);
  assert.equal(salahSemua.berikut, 'b3-bukti-kurang');
});

test('aktivitas polis: tiap opsi -> cabang sesuai kontrak 3.1', () => {
  const siap = mainkanJalur(EP, ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat]).state;
  assert.equal(siap.node, 'b4-polis');
  bekukan(siap);
  // v2: tiga opsi; `ambang-tlo` (ambang 75% / TLO, di luar materi episode) pensiun dari misi.
  for (const b of BAHASA) {
    const langkah = EP.aktivitas.polis!.misi(b).steps[0]!;
    assert.ok(langkah.kind === 'single');
    assert.deepEqual(langkah.options.map((o) => o.id), ['pasti-diganti', 'tidak-tercakup', 'bisa-dinilai'], `opsi polis (${b})`);
  }
  const harapan = [
    { opsi: 'bisa-dinilai', ke: 'b4-polis-tepat', delta: 1, baca: 'tepat', umpan: ['b4-polis.hasil.1.1', 'b4-polis.hasil.1.2'] },
    { opsi: 'pasti-diganti', ke: 'b4-polis-janji', delta: 1, baca: 'keliru', umpan: ['b4-polis.hasil.2.1', 'b4-polis.hasil.2.2'] },
    { opsi: 'tidak-tercakup', ke: 'b4-polis-salah', delta: -2, baca: 'keliru', umpan: ['b4-polis.hasil.3.1'] },
  ] as const;
  for (const h of harapan) {
    const r = kirimDi(siap, polis(h.opsi));
    assert.equal(r.berikut, h.ke, h.opsi);
    assert.equal(r.hasil.kepercayaan - siap.kepercayaan, h.delta, `${h.opsi}: kepercayaan`);
    assert.equal(r.hasil.proses['baca-polis'], h.baca, `${h.opsi}: baca-polis`);
    assert.deepEqual(r.umpan, [...h.umpan], `${h.opsi}: umpan balik`);
    assert.ok(r.tandaBaru.includes(`akt:polis:pilih:${h.opsi}`));
    assert.ok(r.tandaBaru.includes(h.opsi === 'bisa-dinilai' ? 'akt:polis:tepat' : 'akt:polis:belum'));
    const alasan = r.hasil.riwayat.filter((e) => e.jenis === 'alasan').at(-1);
    assert.equal(alasan?.jenis === 'alasan' && alasan.arah, arahDari(h.delta), `${h.opsi}: alasan tercatat`);
    assert.equal(r.hasil.paham.includes('polis-dinilai'), h.opsi === 'bisa-dinilai', `${h.opsi}: paham polis-dinilai`);
    assert.equal(r.hasil.tanda.includes('janji-polis'), h.opsi === 'pasti-diganti', `${h.opsi}: janji-polis`);
    if (h.opsi === 'pasti-diganti') assert.equal(r.hasil.proses['tanpa-janji'], 'keliru');
    // Isi kartu tercatat di SEMUA cabang: node pemulihan (b4-polis-salah, ralat-polis) meminta membaca ulang kartunya.
    assert.ok(r.hasil.catatan.includes('polis'), `${h.opsi}: kartu polis ada di Catatan kasus`);
  }
});

test('aktivitas: jawaban kosong / tak dikenal -> cabang cadangan yang sah dan episode tetap bisa selesai', () => {
  const bukti = siapBukti();
  for (const kosong of [{}, { bukti: [] }, { bukti: ['tidak-ada'] }] as MissionAnswer[]) {
    const r = kirimDi(bukti, kosong);
    assert.ok(r.tandaBaru.includes('akt:bukti:belum'), JSON.stringify(kosong));
    assert.ok(!r.tandaBaru.some((t) => t.startsWith('akt:bukti:pilih:')), 'id opsi tak dikenal diabaikan');
    assert.deepEqual(r.umpan, [PETUNJUK_KURANG]);
    assert.equal(r.berikut, 'b3-bukti-kurang');
    assert.equal(r.hasil.proses.bukti, 'keliru');
  }
  const dariKosong = mainkanJalur(EP, [jawab('b3-bukti', {}), 'b3-bukti-kurang/lengkapi', polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/rangkum'], {
    dari: bukti,
  }).state;
  assert.equal(dariKosong.akhir, 'tuntas');
  assert.equal(dariKosong.proses.bukti, 'dikoreksi');

  const siapPolis = bekukan(mainkanJalur(EP, ['b1-datang/dengar', 'b2-saran/dokumentasi', buktiTepat]).state);
  for (const kosong of [{}, polis('tidak-ada')] as MissionAnswer[]) {
    const r = kirimDi(siapPolis, kosong);
    assert.equal(r.berikut, 'b4-polis-salah', JSON.stringify(kosong));
    assert.ok(r.tandaBaru.includes('akt:polis:belum'));
    assert.ok(r.tandaBaru.includes('akt:polis:lewat:bisa-dinilai'));
    assert.deepEqual(r.umpan, ['b4-polis.hasil.4.2'], 'Bu Rina menunggu jawaban (bukan reaksi atas ambang TLO)');
    assert.equal(r.hasil.proses['baca-polis'], 'keliru');
    assert.ok(r.hasil.catatan.includes('polis'));
    assert.equal(r.hasil.kepercayaan, siapPolis.kepercayaan - 1);
  }
  const polisKosong = mainkanJalur(EP, [jawab('b4-polis', {}), 'b4-polis-salah/baca-ulang', 'b5-keberatan/jujur', 'b5-tutup/rangkum'], { dari: siapPolis }).state;
  assert.equal(polisKosong.akhir, 'tuntas');
  assert.equal(polisKosong.proses['baca-polis'], 'dikoreksi');
});

// ================================================================== 7. coba jalur lain dari bab

test('ulangBab "menggali" setelah selesai: kembali ke awal bab dengan state saat pertama masuk, lalu jalur lain ke akhir lain', () => {
  const h = mainkanJalur(EP, JALUR_TERBAIK);
  assert.equal(h.state.akhir, 'tuntas');
  assert.ok(babBisaDiulang(EP, h.state).includes('menggali'));
  const masuk = h.jejak.find((s) => nodeKini(EP, s)?.bab === 'menggali')!;
  assert.equal(masuk.node, 'b2-cerita');

  const ulang = jalankan(EP, bekukan(h.state), { jenis: 'ulangBab', bab: 'menggali' });
  assert.notEqual(ulang, h.state);
  assert.equal(ulang.node, 'b2-cerita');
  assert.equal(ulang.akhir, null);
  assert.equal(ulang.kepercayaan, masuk.kepercayaan);
  assert.deepEqual(ulang.tanda, masuk.tanda);
  assert.deepEqual(ulang.paham, masuk.paham);
  assert.deepEqual(ulang.proses, masuk.proses);
  assert.deepEqual(ulang.catatan, masuk.catatan);
  assert.deepEqual(ulang.aktivitas, {}, 'hasil aktivitas bab sesudahnya dibuang');
  assert.deepEqual(ulang.riwayat, masuk.riwayat);
  assert.deepEqual(Object.keys(ulang.cadangan).sort(), ['menggali', 'menyambut'], 'cadangan bab sesudahnya dibuang');
  assert.deepEqual({ ...ulang, langkah: 0 }, { ...masuk, langkah: 0 }, 'state = saat pertama masuk bab (kecuali penghitung langkah)');
  assert.ok(ulang.langkah > h.state.langkah);
  assert.deepEqual(jalankan(EP, salinJson(h.state), { jenis: 'ulangBab', bab: 'menggali' }), ulang, 'sama setelah muat ulang');

  // Jalur berbeda dari titik yang sama -> akhir berbeda; efek jalur lama tidak terbawa.
  const lanjutan: [LangkahJalur[], IdAkhir][] = [
    [['b2-saran/ringan', 'b2-ringan-akibat/tetap-ringan'], 'pergi'],
    [['b2-saran/bengkel', 'b2-bengkel-akibat/biarkan', polisDi('bisa-dinilai'), 'b5-keberatan/jujur', 'b5-tutup/rangkum'], 'tertunda'],
    [['b2-saran/dokumentasi', buktiTepat, polisDi('pasti-diganti'), 'b5-keberatan/janjikan', 'b5-tutup/rangkum'], 'janji'],
    [['b2-saran/dokumentasi', buktiTepat, polisDi('bisa-dinilai'), 'b5-keberatan/aturan', 'b5-tutup/singkat'], 'dingin'],
  ];
  for (const [langkah, akhir] of lanjutan) {
    const s = mainkanJalur(EP, langkah, { dari: ulang }).state;
    assert.equal(s.akhir, akhir);
    assert.notEqual(s.akhir, h.state.akhir);
  }
  const pergi = mainkanJalur(EP, lanjutan[0]![0], { dari: ulang }).state;
  assert.deepEqual(ringkasanAkhir(EP, pergi).komunikasi.map((k) => k.teks), [A.dengar, A.ringan, A.tetapRingan]);
  assert.equal(pergi.kepercayaan, -1);
  assert.deepEqual(pergi.aktivitas, {});
  assert.ok(!('bukti' in pergi.cadangan) && !('polis' in pergi.cadangan));

  // Mengulang jalur yang sama dari bab itu memberi akhir & ringkasan yang sama seperti semula.
  const sama = mainkanJalur(EP, JALUR_TERBAIK.slice(1), { dari: ulang }).state;
  const tanpaLangkah = (s: StateCerita) => ({ ...ringkasanAkhir(EP, s), keputusan: s.keputusan.map((k) => `${k.node}/${k.pilihan}`) });
  assert.deepEqual(tanpaLangkah(sama), tanpaLangkah(h.state));

  // Bab yang belum pernah dimasuki di jalur ini tidak bisa diulang.
  const jalurPergi = mainkanJalur(EP, ['b1-datang/dengar', 'b2-saran/ringan', 'b2-ringan-akibat/tetap-ringan']).state;
  assert.equal(jalankan(EP, jalurPergi, { jenis: 'ulangBab', bab: 'bukti' }), jalurPergi);
  assert.equal(jalankan(EP, jalurPergi, { jenis: 'ulangBab', bab: 'polis' }), jalurPergi);
  assert.deepEqual(babBisaDiulang(EP, jalurPergi), ['menyambut', 'menggali']);
});

test('aktivitas: bentuk jawaban yang tidak sah untuk jenis langkahnya tidak dihitung sebagai pilihan', () => {
  // Langkah single hanya menerima string (sama dengan gradeStep server): larik bernilai 0 dan TIDAK boleh
  // memasang tanda 'pilih' yang akan mengarahkan ke cabang "tepat".
  const polis = EP.aktivitas.polis!;
  const larik = nilaiAktivitas(EP, polis, { penjelasan: ['bisa-dinilai'] } as unknown as MissionAnswer);
  assert.equal(larik.akurasi, 0);
  assert.ok(larik.tanda.includes('akt:polis:belum'));
  assert.ok(!larik.tanda.some((t) => t.startsWith('akt:polis:pilih:')), larik.tanda.join(', '));
  assert.ok(larik.tanda.includes('akt:polis:lewat:bisa-dinilai'));
  const sah = nilaiAktivitas(EP, polis, { penjelasan: 'bisa-dinilai' });
  assert.equal(sah.akurasi, 1);
  assert.ok(sah.tanda.includes('akt:polis:pilih:bisa-dinilai'));
  // Langkah multi hanya menerima larik: string tunggal = tidak memilih apa pun.
  const bukti = EP.aktivitas.bukti!;
  const tunggal = nilaiAktivitas(EP, bukti, { bukti: 'foto-full' } as unknown as MissionAnswer);
  assert.equal(tunggal.akurasi, 0);
  assert.ok(!tunggal.tanda.some((t) => t.startsWith('akt:bukti:pilih:')));
});

// ================================================================== 8. tinjauan PIC Claim

test('tinjauan PIC Claim: setiap kunci teks episode tercantum di docs/cerita/TINJAUAN-PIC-CLAIM.md', () => {
  // Dokumen itu yang ditandatangani PIC Claim: kalimat baru/berubah yang tidak tercantum berarti tidak pernah ditinjau.
  // Kunci bermateri klaim ada di bagian A-G/K, sisanya di Lampiran L (lihat "Cara membaca" di dokumen).
  const doc = fs.readFileSync(new URL('../../../../../docs/cerita/TINJAUAN-PIC-CLAIM.md', import.meta.url), 'utf8');
  const hilang = Object.keys(TEKS_AUTO_1.id).filter((k) => !doc.includes('`' + k + '`'));
  assert.deepEqual(hilang, [], `kunci belum tercantum di TINJAUAN-PIC-CLAIM.md: ${hilang.join(', ')}`);
  // Dokumen tetap utuh untuk dibaca PIC: judul di baris pertama, tanpa sisa suntingan skrip yang gagal, status draf.
  assert.ok(doc.startsWith('# Tinjauan PIC Claim'), 'baris pertama = judul dokumen');
  assert.ok(!/undefined/.test(doc), 'tidak ada sel "undefined"');
  assert.match(doc, /DRAF, belum ditinjau PIC Claim/);
});

// ================================================================== 9. naskah v2 (docs/rancangan-mode-cerita.md 11.3-11.5)

const tid = (k: string, b: Bahasa = 'id'): string => teksCerita(EP, k, b, { nama: 'Weli' });
const kata = (k: string): number => hitungKata(tid(k));
/** Kalimat dalam teks (id/en: . ! ? ; zh: 。！？). */
const kalimat = (s: string): string[] => s.split(/(?<=[.!?。！？])\s*/).map((x) => x.trim()).filter(Boolean);
const normal = (s: string): string => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

test('v3 pembuka: satu perkenalan peran di b1-mentor yang menyebut tempat, tanpa istilah; masalah Bu Rina di baris ke-3; kata sehari-hari lebih dulu', () => {
  const s = mainkanJalur(EP, []).state;
  const baris = s.riwayat.flatMap((e) => (e.jenis === 'baris' ? [e] : []));
  assert.deepEqual(baris.slice(0, 3).map((e) => e.teks), ['b1-mentor.1', 'b1-mentor.4', 'b1-datang.1'], 'masalah Bu Rina paling lambat baris ke-3');
  assert.deepEqual(baris.filter((e) => e.node === 'b1-mentor' && e.siapa === 'missRaksa').map((e) => e.teks), ['b1-mentor.1'], 'satu perkenalan peran');
  // Review lanjutan 27 Sep butir 6: pembuka v2 menjelaskan nasabah & klaim sekaligus (padat). v3: satu kalimat peran yang
  // menyebut tempat lewat {lokasi} (nama yang sama dengan papan nama), tanpa istilah; istilah dijelaskan di baris
  // pertama yang memakainya (tes istilah di bawah), jadi pemula tidak disodori istilah sebelum dibutuhkan.
  const lokasi = EP.panggung?.lokasi.nama ?? '';
  assert.equal(lokasi, 'Raksa Silver Club', 'lokasi default episode ini');
  for (const b of BAHASA) {
    assert.ok(TEKS_AUTO_1[b]['b1-mentor.1']!.includes('{lokasi}'), `b1-mentor.1 (${b}) memakai parameter {lokasi}`);
    const t = tid('b1-mentor.1', b);
    assert.ok(t.includes(lokasi), `b1-mentor.1 (${b}) menyebut ${lokasi}`);
    for (const [id, x] of Object.entries(EP.istilah ?? {})) {
      assert.ok(!t.toLowerCase().includes(tid(x.label, b).toLowerCase()), `b1-mentor.1 (${b}) tanpa istilah "${id}"`);
    }
  }
  assert.ok(tid('b1-mentor.1').toLowerCase().includes('simulasi'), 'perkenalan (ucapan mentor) menyebut simulasi');
  assert.ok(tid('b1-mentor.1', 'en').toLowerCase().includes('simulation'));
  assert.ok(tid('b1-mentor.1', 'zh').includes('模拟'));
  assert.ok(kata('b1-mentor.1') <= 18, `perkenalan ringkas (${kata('b1-mentor.1')} kata; v2: 21)`);
  for (const k of ['b4-polis-intro.1', 'b4-polis-intro.2']) {
    const x = tid(k).toLowerCase();
    assert.ok(x.indexOf('dokumen perlindungan') >= 0 && x.indexOf('dokumen perlindungan') < x.indexOf('polis'), `${k}: dokumen perlindungan sebelum polis`);
  }
});

test('v3 istilah inti: "nasabah" & "klaim" bisa dibuka di SETIAP jalur uji sebelum bab 3 (bukan hanya di cabang/akhir tertentu)', () => {
  // Pembuka tanpa istilah (tes di atas) tidak boleh berarti pemula baru ditolong di akhir cerita: nasabah dijelaskan di
  // narasi pintu (saat nasabah muncul), klaim di baris Bu Rina yang dilewati semua jalur sebelum saran ke bengkel.
  for (const j of JALUR) {
    const riwayat = main(j).state.riwayat;
    const bab3 = riwayat.findIndex((e) => e.jenis === 'baris' && e.node.startsWith('b3-'));
    const awal = riwayat.slice(0, bab3 < 0 ? riwayat.length : bab3);
    for (const id of ['nasabah', 'klaim']) {
      const ada = awal.some((e) => {
        if (e.jenis !== 'baris') return false;
        const n = EP.node[e.node];
        return !!n && n.jenis !== 'cabang' && n.baris.some((b) => b.teks === e.teks && b.istilah?.includes(id));
      });
      assert.ok(ada, `jalur ${j.nama}: istilah ${id} tersedia sebelum bab 3`);
    }
  }
});

test('v2 pilihan: 2-3 pilihan tampil, masing-masing 8-20 kata (Indonesia)', () => {
  for (const n of Object.values(EP.node)) {
    if (n.jenis !== 'pilihan') continue;
    for (const p of n.pilihan) {
      const j = kata(p.teks);
      assert.ok(j >= 8 && j <= 20, `${p.teks}: ${j} kata`);
    }
  }
  for (const s of titikAuto1().filter((x) => nodeKini(EP, x)?.jenis === 'pilihan')) {
    const j = pilihanTersedia(EP, s).length;
    assert.ok(j >= 2 && j <= 3, `${s.node}: ${j} pilihan`);
  }
});

test('v2 pilihan: jawaban yang menolong TIDAK selalu yang terpanjang (paling banyak separuh titik pilihan)', () => {
  const menolong = (alasan: string | undefined) => {
    const m = alasan ? EP.makna?.[alasan] : undefined;
    return m?.nilai === 'membantu' || m?.nilai === 'ralat';
  };
  // Satu titik = node + himpunan pilihan yang tersedia (b5-keberatan punya tiga himpunan berbeda).
  const titik = new Map<string, boolean>();
  for (const s of titikAuto1().filter((x) => nodeKini(EP, x)?.jenis === 'pilihan')) {
    const ps = pilihanTersedia(EP, s);
    const kunci = `${s.node}|${ps.map((p) => p.id).join(',')}`;
    if (titik.has(kunci)) continue;
    const baik = ps.filter((p) => menolong(p.efek?.alasan));
    assert.equal(baik.length, 1, `${kunci}: tepat satu pilihan yang menolong`);
    const panjang = kata(baik[0]!.teks);
    titik.set(kunci, ps.every((p) => p === baik[0] || kata(p.teks) < panjang));
  }
  assert.ok(titik.size >= 11, `titik pilihan: ${titik.size}`);
  const terpanjang = [...titik].filter(([, v]) => v).map(([k]) => k);
  assert.ok(terpanjang.length * 2 <= titik.size, `terpanjang di ${terpanjang.length}/${titik.size}: ${terpanjang.join('; ')}`);
  const perNode = new Map<string, boolean>();
  for (const [k, v] of titik) perNode.set(k.split('|')[0]!, (perNode.get(k.split('|')[0]!) ?? false) || v);
  assert.ok([...perNode.values()].filter(Boolean).length * 2 <= perNode.size, 'per node');

  // Aktivitas kartu polis: penjelasan yang tepat bukan yang terpanjang.
  const st = EP.aktivitas.polis!.misi('id').steps[0]!;
  assert.ok(st.kind === 'single');
  const panjangOpsi = (id: string) => hitungKata(st.options.find((o) => o.id === id)!.label);
  assert.ok(st.options.some((o) => o.id !== 'bisa-dinilai' && panjangOpsi(o.id) > panjangOpsi('bisa-dinilai')), 'bisa-dinilai bukan terpanjang');
});

test('v2 istilah: lima istilah, label tertulis di baris bertanda (id/en/zh), ditandai di baris PERTAMA pemakaiannya', () => {
  const istilah = EP.istilah ?? {};
  assert.deepEqual(Object.keys(istilah).sort(), ['comprehensive', 'klaim', 'nasabah', 'polis', 'risiko-sendiri']);
  const ditandai = new Map<string, string[]>();
  for (const n of Object.values(EP.node)) {
    if (n.jenis === 'cabang') continue;
    for (const b of n.baris) if (b.istilah) ditandai.set(b.teks, b.istilah);
  }
  for (const id of Object.keys(istilah)) assert.ok([...ditandai.values()].some((x) => x.includes(id)), `${id} ditandai di baris`);
  // Baris node aktivitas tampil di kartu aktivitas, yang (per 26 Sep) tidak memberi tombol "Apa itu …?": istilah
  // hanya di baris kotak dialog. Longgarkan bila kartu aktivitas kelak menampilkan tombol istilah.
  for (const n of Object.values(EP.node)) {
    if (n.jenis === 'aktivitas') assert.ok(n.baris.every((b) => !b.istilah?.length), `${n.id}: istilah di baris node aktivitas tidak tampil`);
  }
  for (const [k, ids] of ditandai) {
    for (const id of ids) {
      for (const b of BAHASA) {
        const label = tid(istilah[id]!.label, b).toLowerCase();
        assert.ok(tid(k, b).toLowerCase().includes(label), `${k} (${b}) memuat "${label}"`);
      }
    }
  }
  for (const [id, x] of Object.entries(istilah)) {
    for (const b of BAHASA) {
      const n = kalimat(tid(x.arti, b)).length;
      assert.ok(n >= 1 && n <= 2, `arti ${id} (${b}): ${n} kalimat`);
    }
  }
  // Pertama kali muncul (id): di setiap jalur uji & titik keputusan, baris pertama yang memuat label = baris bertanda.
  for (const s of [...JALUR.map((j) => main(j).state), ...titikAuto1()]) {
    const sudah = new Set<string>();
    for (const e of s.riwayat) {
      if (e.jenis !== 'baris') continue;
      const t = tid(e.teks).toLowerCase();
      for (const [id, x] of Object.entries(istilah)) {
        if (sudah.has(id) || !t.includes(tid(x.label).toLowerCase())) continue;
        sudah.add(id);
        assert.ok(ditandai.get(e.teks)?.includes(id), `${id}: pertama muncul di ${e.teks} tanpa tanda istilah`);
      }
    }
  }
});

test('v2 aktivitas: satu kalimat tugas; instruksi/tanya/petunjuk/briefing/cerita/labelInteraksi (dan tujuan bab) tidak saling mengulang', () => {
  for (const [id, def] of Object.entries(EP.aktivitas)) {
    // Tujuan bab tampil di kepala layar sepanjang aktivitas: kalimat tugas tidak boleh mengulangnya.
    const nodeAkt = Object.values(EP.node).find((n) => n.jenis === 'aktivitas' && n.aktivitas === id)!;
    const tujuanBab = EP.bab.find((x) => x.id === nodeAkt.bab)!.tujuan;
    for (const b of BAHASA) {
      const m = def.misi(b);
      const st = m.steps[0]!;
      assert.equal(kalimat(m.instruction).length, 1, `${id} (${b}): instruksi satu kalimat`);
      if (b === 'id') assert.ok(hitungKata(m.instruction) <= 12, `${id}: instruksi pendek (${hitungKata(m.instruction)} kata)`);
      const bidang: Record<string, string> = {
        tujuanBab: tid(tujuanBab, b),
        instruksi: m.instruction, tanya: st.prompt, petunjuk: st.hint ?? '', briefing: m.rakiBriefing, cerita: m.story, labelInteraksi: m.interactionLabel,
      };
      const dilihat = new Map<string, string>();
      for (const [nama, isi] of Object.entries(bidang)) {
        for (const k of kalimat(isi)) {
          const lain = dilihat.get(normal(k));
          assert.ok(!lain, `${id} (${b}): "${k}" diulang di ${lain} dan ${nama}`);
          dilihat.set(normal(k), nama);
        }
      }
    }
  }
});

test('v2 aktivitas: alasan per opsi (semua opsi bukti & polis), arti awam tiap baris kartu, tanpa ambang 75%/TLO', () => {
  for (const id of ['bukti', 'polis']) {
    const def = EP.aktivitas[id]!;
    const st = def.misi('id').steps[0]!;
    assert.ok(st.kind === 'single' || st.kind === 'multi');
    assert.deepEqual(Object.keys(def.alasanOpsi ?? {}).sort(), st.options.map((o) => o.id).sort(), `${id}: alasan untuk semua opsi`);
    for (const k of Object.values(def.alasanOpsi ?? {})) for (const b of BAHASA) assert.notEqual(tid(k, b), k, `${k} (${b})`);
  }
  const polis = EP.aktivitas.polis!;
  const kartu = polis.misi('id').policyCards!.find((c) => c.id === 'polis-rina')!;
  const arti = polis.kartuArti?.['polis-rina'];
  assert.ok(arti);
  assert.equal(arti.sub, 'akt.polis.kartu.sub.arti');
  assert.deepEqual(arti.baris, ['kendaraan', 'benturan', 'status', 'risiko'].map((x) => `akt.polis.kartu.${x}.arti`));
  assert.equal(arti.baris.length, kartu.rows.length, 'satu arti per baris kartu, urutan sama');
  // Isi aktivitas polis yang tampil tidak lagi memuat ambang 75% / TLO (diajarkan di misi 5).
  for (const b of BAHASA) {
    const m = polis.misi(b);
    const semua = [
      JSON.stringify(m), tid('akt.polis.bahas.penjelasan', b), tid('akt.polis.ringkasan', b),
      ...Object.values(polis.alasanOpsi ?? {}).map((k) => tid(k, b)), ...[arti.sub!, ...arti.baris].map((k) => tid(k!, b)),
    ].join(' ');
    assert.ok(!/\b75\b|TLO|Total Loss/.test(semua), `polis (${b}) tanpa ambang TLO`);
  }
});

test('v2 pensiun: kunci yang dihapus dari naskah tetap terbaca di id/en/zh dan tidak dirujuk naskah aktif', () => {
  const dirujuk = new Set<string>();
  for (const n of Object.values(EP.node)) {
    if (n.jenis === 'cabang') continue;
    n.baris.forEach((b) => dirujuk.add(b.teks));
    if (n.jenis === 'pilihan') n.pilihan.forEach((p) => dirujuk.add(p.teks));
    if (n.jenis === 'aktivitas') n.hasil.forEach((h) => (h.umpanBalik ?? []).forEach((b) => dirujuk.add(b.teks)));
  }
  assert.ok(KUNCI_PENSIUN.length >= 6);
  for (const k of KUNCI_PENSIUN) {
    assert.ok(!dirujuk.has(k), `${k} tidak dirujuk graf`);
    for (const b of BAHASA) {
      assert.ok(typeof TEKS_AUTO_1[b][k] === 'string' && TEKS_AUTO_1[b][k]!.trim(), `${k} ada di ${b}`);
      assert.ok(!/\{\w+\}/.test(tid(k, b)), `${k} (${b}) parameter terisi`);
    }
  }
  // Opsi pensiun tidak ditawarkan lagi, tetapi baris umpan balik khusus opsi itu (simpanan lama) tetap sah & terbaca.
  assert.ok(!EP.aktivitas.polis!.misi('id').steps.some((st) => st.kind === 'single' && st.options.some((o) => o.id === 'ambang-tlo')));
  assert.ok(dirujuk.has('b4-polis.hasil.4.1'));
  assert.deepEqual(validasiEpisode(EP), []);
});

// ================================================================== 10. adegan v3 (docs/cerita/ADEGAN-AUTO1.md bagian 1-4)

test('v3 adegan: panggung Raksa Silver Club tanpa eksterior, versi tetap 1, aksi hanya di narasi tindakan fisik (kunci stabil)', () => {
  assert.equal(EP.versi, 1, 'cue hanya presentasi: data gameplay & simpanan tidak berubah');
  assert.deepEqual(EP.panggung?.lokasi, { nama: 'Raksa Silver Club', tema: 'silver' });
  assert.equal(EP.panggung?.eksterior, null, 'slot eksterior Wisma BSG kosong (belum ada foto fasad teridentifikasi)');
  assert.equal(EP.panggung?.awal.nasabah, null, 'awal: kursi pengunjung kosong');
  const aksi: Record<string, string> = {};
  for (const n of Object.values(EP.node)) {
    assert.equal(n.adegan?.aksi, undefined, `${n.id}: aksi hanya di baris`);
    if (n.jenis === 'cabang') continue;
    for (const b of n.baris) {
      if (!b.adegan?.aksi) continue;
      aksi[b.teks] = b.adegan.aksi;
      assert.equal(b.siapa, 'narasi', `${b.teks}: tindakan fisik diceritakan narasi`);
    }
  }
  // Dari naskah: pintu terbuka, keluar ke parkiran, membuka kartu polis, pergi, waktu berlalu / telepon.
  assert.deepEqual(aksi, {
    'b1-mentor.4': 'masuk',
    'b3-bukti-intro.1': 'pindah',
    'b4-polis-intro.1': 'kartu',
    'b4-polis-intro.2': 'kartu',
    'akhir-janji.2': 'pindah',
    'akhir-dingin.3': 'pergi',
    'akhir-tertunda.1': 'pindah',
    'akhir-tertunda.4': 'pindah',
    'akhir-pergi.3': 'pergi',
    'akhir-pergi.4': 'pergi',
  });
  assert.deepEqual(validasiEpisode(EP), []);
});
