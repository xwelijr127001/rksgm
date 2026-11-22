/**
 * T-128 (Designer): SENI BUKTI BABAK 2 (rencana Peterson, round 2), hanya peta impor. Tidak dipakai layar mana pun sampai Fullstack
 * memasangnya (T-127 dan irisan berikutnya). Kontrak isi tiap gambar: team/HANDOFF.md "## T-128". Seni:
 * character/investigator-t128/bangun.mts. Berkas di cerita/seni/investigasi/r2/.
 *   exhibit  288 x 192 (3 : 2, bingkai zum PanelExhibit; 1 piksel gambar = 1 px CSS)
 *   thumb     96 x 68  (sel kartu bukti; 1x)
 * Teks di dalam gambar hanya jam, tanggal sebagai angka hari, nomor klausul / baris, serta kode golongan dan tahun SIM yang sudah
 * ada di seni SIM lama. Tidak ada centang, silang atau sorotan yang membocorkan jawaban.
 */
import k1Bingkai from '../../seni/investigasi/r2/k1-bingkai-1432.png';
import k1BingkaiKartu from '../../seni/investigasi/r2/k1-bingkai-1432-kartu.png';
import k1Pos from '../../seni/investigasi/r2/k1-pos-petugas.png';
import k1PosKartu from '../../seni/investigasi/r2/k1-pos-petugas-kartu.png';
import k1Sim from '../../seni/investigasi/r2/k1-catatan-sim.png';
import k1SimKartu from '../../seni/investigasi/r2/k1-catatan-sim-kartu.png';
import k2Formulir from '../../seni/investigasi/r2/k2-formulir.png';
import k2FormulirKartu from '../../seni/investigasi/r2/k2-formulir-kartu.png';
import k2Struk from '../../seni/investigasi/r2/k2-struk.png';
import k2StrukKartu from '../../seni/investigasi/r2/k2-struk-kartu.png';
import k2Polis from '../../seni/investigasi/r2/k2-polis.png';
import k2PolisKartu from '../../seni/investigasi/r2/k2-polis-kartu.png';
import k2Endorsemen from '../../seni/investigasi/r2/k2-endorsemen.png';
import k2EndorsemenKartu from '../../seni/investigasi/r2/k2-endorsemen-kartu.png';
import k2Slip2105 from '../../seni/investigasi/r2/k2-slip-2105.png';
import k2Slip2118 from '../../seni/investigasi/r2/k2-slip-2118.png';
import k2Slip2124 from '../../seni/investigasi/r2/k2-slip-2124.png';
import k3Foto from '../../seni/investigasi/r2/k3-foto-inspeksi-03.png';
import k3FotoKartu from '../../seni/investigasi/r2/k3-foto-inspeksi-03-kartu.png';
import k3FotoCincin from '../../seni/investigasi/r2/k3-foto-inspeksi-cincin.png';
import k3Kejadian from '../../seni/investigasi/r2/k3-kartu-kejadian-14.png';
import k3KejadianKartu from '../../seni/investigasi/r2/k3-kartu-kejadian-14-kartu.png';
import k3Penawaran from '../../seni/investigasi/r2/k3-penawaran.png';
import k3PenawaranKartu from '../../seni/investigasi/r2/k3-penawaran-kartu.png';

export interface SeniBuktiR2 { /** 288 x 192 */ exhibit: string; /** 96 x 68 */ thumb: string }

export const SENI_R2 = {
  // Kasus 1
  'k1-bingkai-1432': { exhibit: k1Bingkai, thumb: k1BingkaiKartu },
  'k1-pos-petugas': { exhibit: k1Pos, thumb: k1PosKartu },
  'k1-catatan-sim': { exhibit: k1Sim, thumb: k1SimKartu },
  // Kasus 2
  'k2-formulir': { exhibit: k2Formulir, thumb: k2FormulirKartu },
  'k2-struk': { exhibit: k2Struk, thumb: k2StrukKartu },
  'k2-polis': { exhibit: k2Polis, thumb: k2PolisKartu },
  'k2-endorsemen': { exhibit: k2Endorsemen, thumb: k2EndorsemenKartu },
  // Kasus 3
  'k3-foto-inspeksi-03': { exhibit: k3Foto, thumb: k3FotoKartu },
  'k3-kartu-kejadian-14': { exhibit: k3Kejadian, thumb: k3KejadianKartu },
  'k3-penawaran': { exhibit: k3Penawaran, thumb: k3PenawaranKartu },
} as const satisfies Record<string, SeniBuktiR2>;
export type IdSeniR2 = keyof typeof SENI_R2;

/** Kasus 2: tiga slip waktu 96 x 68 (jemput, benturan, perjalanan ditutup di aplikasi). */
export const SLIP_WAKTU_K2 = { '21:05': k2Slip2105, '21:18': k2Slip2118, '21:24': k2Slip2124 } as const;

/** Kasus 1, `k1-bingkai-1432` (288 px): batas kiri dan kanan tiap lajur, untuk sasaran ketuk. Lajur TIDAK bernomor di gambarnya. */
export const LAJUR_K1_BINGKAI: readonly (readonly [number, number])[] = [[24, 90], [90, 156], [156, 222], [222, 288]];
/** Kasus 2, `k2-polis` (288 x 192): kotak [x, y, lebar, tinggi] klausul 1 (penggunaan), 2 (wilayah), 3 (pengemudi). */
export const KLAUSUL_K2_POLIS: readonly (readonly [number, number, number, number])[] = [[16, 44, 256, 44], [16, 92, 256, 44], [16, 140, 256, 44]];
/**
 * T-129: cincin jingga di sekeliling spion (dulu digambar di foto bengkel, sekarang DILEPAS dari fotonya karena menunjuk barang yang
 * ditanyakan). Lapisan tembus pandang 288 x 192: tumpangkan di atas `panel/foto-inspeksi.png` atau `k3-foto-inspeksi-03` HANYA sesudah
 * pemain menemukannya sendiri (layar temuan).
 */
export const CINCIN_K3_FOTO = k3FotoCincin;
