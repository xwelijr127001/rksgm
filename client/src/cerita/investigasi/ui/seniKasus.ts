/**
 * T-091 (Designer): SENI PER KASUS Investigator (menggantikan rintisan T-090; kontraknya tetap).
 *
 * `seniKasus(kasus)` = seni per id kasus (`Episode.investigasi.kasus`: 'kasus-1', 'kasus-2'); SEMUA nilai = URL gambar PNG:
 *   judul      gambar kartu judul kasus                 kasus 2: 292 x 150 (seni 146 x 75 dipanggang 2x, jadi <img> ukuran asli)
 *   kilas      gambar kilas balik, bingkai diam          kasus 2: 336 x 184 (versi bergerak: KilasBalik jenis 'benturan' / 'turun')
 *   tebak      gambar layar tebakan pembuka             kasus 2: 292 x 150, foto kabin dari surveyor
 *   ikonBukti  gambar kartu bukti 96 x 68 per id bukti   (sama dengan sel KartuBukti / slip BukuCatatan)
 *   potret     potret 64 x 64 per `Pernyataan.siapa`     (latar krem; wajah netral)
 *
 *   kasus-1  "Truk di Tol": seni yang SUDAH ada, tidak diubah: map kasus (judul.png, 96 x 64, ditampilkan 2x), buku petugas tol
 *            (kilas-tol.png), kartu bukti = sel bukti.png dipotong per berkas. Kartu judul dan layar tebakan kasus 1 sendiri tetap
 *            bingkai dashcam hidup (`konfig.bingkai === 'dashcam'`), jadi `judul` / `tebak` di sini hanya cadangan.
 *   kasus-2  "Malam di Jalan Melati": MPV keluarga di jalan malam (bumper depan kiri lecet), kilas balik benturan, foto kabin
 *            (HP di dudukan dasbor dengan aplikasi fiktif menyala, botol air di kursi belakang), kartu foto interior / struk /
 *            polis, potret Pak Yusuf dan Mas Agus. Aplikasinya fiktif (ungu): tanpa nama, logo, atau warna merek.
 * Id kasus yang tidak dikenal = seni kasus 1. Sumber: character/investigator-t091/{adegan,tokoh}.mts.
 */
import judul1 from '../../seni/investigasi/judul.png';
import kilas1 from '../../seni/investigasi/kilas-tol.png';
import dashcam from '../../seni/investigasi/bukti/dashcam.png';
import rambu from '../../seni/investigasi/bukti/rambu.png';
import sim from '../../seni/investigasi/bukti/sim.png';
import darto from '../../seni/investigasi/potret/darto.png';
import petugasTol from '../../seni/investigasi/potret/petugasTol.png';
import judul2 from '../../seni/investigasi/kasus2-judul.png';
import kilas2 from '../../seni/investigasi/kasus2-kilas.png';
import interior from '../../seni/investigasi/kasus2-interior.png';
import fotoInterior from '../../seni/investigasi/bukti/foto-interior.png';
import struk from '../../seni/investigasi/bukti/struk.png';
import polisKasus2 from '../../seni/investigasi/bukti/polis-kasus2.png';
import yusuf from '../../seni/investigasi/potret/yusuf.png';
import agus from '../../seni/investigasi/potret/agus.png';
import { PanelAssets } from './panel/aset';

export interface SeniKasus {
  judul: string;
  kilas: string;
  tebak: string;
  ikonBukti: Record<string, string>;
  potret: Record<string, string>;
}

const KASUS_1: SeniKasus = {
  judul: judul1,
  kilas: kilas1,
  tebak: judul1,
  ikonBukti: { dashcam, rambu, sim },
  potret: { darto, petugasTol },
};
const KASUS_2: SeniKasus = {
  judul: judul2,
  kilas: kilas2,
  tebak: interior,
  ikonBukti: { 'foto-interior': fotoInterior, struk, 'polis-kasus2': polisKasus2 },
  potret: { yusuf, agus },
};
/** T-106: kasus 3 "Satu Baris Terlalu Banyak": meja berkas Designer T-103 (kartu judul, layar tebakan), potret tiga kursi panel. */
const KASUS_3: SeniKasus = {
  judul: PanelAssets.desk,
  kilas: PanelAssets.desk,
  tebak: PanelAssets.desk,
  ikonBukti: {},
  potret: PanelAssets.portrait,
};
const SENI: Readonly<Record<string, SeniKasus>> = { 'kasus-1': KASUS_1, 'kasus-2': KASUS_2, 'kasus-3': KASUS_3 };

export function seniKasus(kasus: string): SeniKasus {
  return SENI[kasus] ?? KASUS_1;
}
