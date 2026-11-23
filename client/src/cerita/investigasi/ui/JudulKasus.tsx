/**
 * T-077: KARTU JUDUL KASUS ("KASUS #1 · Truk di Tol"), node `judul`. Props rencana: { nomor, judul, onMulai } (`judul` = teks jadi
 * atau KunciTeks; + opsional tx, gambar, tokoh). Kait data- (`data-judul-kasus`, `data-mulai-kasus`), id judul dan fokus tetap.
 *
 * T-120 (Designer; pemilik: "This also need redesign"): kartu judul = SAMPUL KASUS bergaya "Raksa Cerah" seperti hub
 * (pages/Investigator.tsx, T-117 / T-119), supaya hub -> kasus terasa satu game. Hanya tampilan; logika LayarInvestigasi tidak
 * disentuh. Yang tidak dikirim sebagai prop dibaca dari pembantu hub yang sudah ada (`daftarKasusHub`: konfig kasus, skor terbaik,
 * stempel; episode: durasi) menurut `nomor`.
 *   PANGGUNG  langit siang (seni/investigasi/cerah-latar.png), Miss Raksa detektif stiker (cerah-miss.png) di depan cakram matahari
 *             dengan kilau, balon ucapan "Ayo kita selidiki!". Tinggi 84 .. 204 px (mengisi sisa layar); mulai 204 px ia utuh dan
 *             berdiri di belakang pita tanah.
 *   BERKAS    tab cap "KASUS #N"; di badan putih: "Raksa Investigator" (+ "Dari cerita Episode 1" untuk kasus yang punya cerita),
 *             judul besar, kalimat kait kasus (`hubInv.kaitDaftar.<kasus>`), FOTO kasus berklip 192 x 136 (foto hub T-113: truk
 *             dashcam / MPV malam / bumper + spion; kasus lain = `gambar`), keping "±5 menit", "N bukti", dan bila sudah pernah
 *             tuntas: stempel kasus di foto + skor terbaik.
 *   TOMBOL    "Mulai selidiki": kunci piksel jingga besar (suara tombol jingga yang sama), panah berkedip, dua kilau.
 * `tokoh` (potret lama di kiri judul) tidak dipakai lagi; prop-nya tetap diterima supaya pemanggil tidak berubah.
 * Ukur (hitung, sampul.css): ruang isi 360 x 640 = 544 px. Panggung 84 + 8 + berkas (tab 26 + badan 248; +28 judul dua baris,
 * +20 kait dua baris) + 10 + tombol 56 = 432 .. 480 px; dengan tautan "Tamu baru" (12 + 48) 492 .. 540 px. Layar lebih tinggi:
 * tinggi minimum bagian = min(100dvh - 157 px, 640 px); sisanya mengisi panggung (sampai 204 px) dan jarak (sampai 16 px).
 * T-137: balon = PERAN pemain ("Kamu investigatornya!", paling banyak 2 baris, lebih lebar: sisa 152 px untuk Miss Raksa) dan
 * baris tugas `investigasi.sampulPeran` (13 / 17 px, dua baris = 36 px) di bawah kalimat kait. Layar pendek (< 700 px, sampul.css):
 * sela 4 px, bantalan lebih rapat, dan "Raksa Investigator" tanpa asal cerita disembunyikan (kepala layar sudah menyebut Investigator).
 * Hitung 360 x 640 (ruang 484 dengan "Tamu baru"): kasus 1 448 (+20 kait dua baris = 468); kasus 2 / 3 430 (+20, +28 judul dua
 * baris = 478). 390 x 700 (ruang 544, tanpa perapatan): 468 .. 516.
 * T-122: tata letak = kolom lentur dengan dua sela (`.iv-sampul-sela`), bukan kisi minmax (yang memakai batas atasnya di layar pendek).
 */
import type { CSSProperties, ReactNode } from 'react';
import { t } from '../../../i18n';
import seniLatar from '../../seni/investigasi/cerah-latar.png';
import seniMiss from '../../seni/investigasi/cerah-miss.png';
import seniCakram from '../../seni/investigasi/cerah-cakram.png';
import seniKilauA from '../../seni/investigasi/cerah-kilau-a.png';
import seniKilauB from '../../seni/investigasi/cerah-kilau-b.png';
import seniKlip from '../../seni/investigasi/klip.png';
import foto1 from '../../seni/investigasi/hub-kasus-1.png';
import foto2 from '../../seni/investigasi/hub-kasus-2.png';
import foto3 from '../../seni/investigasi/hub-kasus-3.png';
import { daftarKasusHub } from '../hub';
import { bacaRekaman } from '../simpan';
import { SKOR_MAKS } from '../skor';
import { IkonStempel, useTx, type Tx } from './dasar';
import './investigasi.css';
import './sampul.css';

/** Foto kasus 96 x 68 (character/investigator-t113/bangun.mts), ditampilkan 2x. */
const FOTO_KASUS: Readonly<Record<string, string>> = { 'kasus-1': foto1, 'kasus-2': foto2, 'kasus-3': foto3 };

export function JudulKasus({ nomor, judul, onMulai, tx, gambar }: { nomor: number; judul: string; onMulai: () => void; tx?: Tx; gambar?: ReactNode; /** T-084: potret lama; tidak dipakai sejak T-120. */ tokoh?: ReactNode }) {
  const teks = useTx(tx);
  const x = daftarKasusHub(bacaRekaman()).find((k) => k.nomor === nomor);
  const kasus = x?.konfig.kasus ?? '';
  const foto = FOTO_KASUS[kasus];
  const kait = x ? (foto ? t(`hubInv.kaitDaftar.${kasus}`) : teks(x.konfig.kait)) : '';
  const asal = x?.konfig.cerita ? teks(x.konfig.cerita.asal) : '';
  const nBukti = x?.konfig.bukti.length ?? 0;
  return (
    <section className="iv-layar iv-judul iv-sampul" data-judul-kasus="" aria-labelledby="iv-judul-kasus">
      <div className="iv-sampul-panggung" style={{ '--iv-latar': `url(${seniLatar})` } as CSSProperties}>
        <i className="iv-sampul-sinar" aria-hidden="true" />
        <p className="iv-sampul-balon">{t('investigasi.sampulSapa')}</p>
        <span className="iv-sampul-miss" aria-hidden="true">
          <img className="iv-sampul-cakram" src={seniCakram} alt="" width={80} height={80} />
          <img className="iv-sampul-miss-gambar" src={seniMiss} alt="" width={68} height={88} />
          <img className="iv-sampul-kilau" data-set="a" src={seniKilauA} alt="" width={100} height={92} />
          <img className="iv-sampul-kilau" data-set="b" src={seniKilauB} alt="" width={100} height={92} />
        </span>
        <i className="iv-sampul-pita" aria-hidden="true" />
      </div>
      {/* T-122: sela lentur (sampul.css): 8 .. 16 px dan 10 .. 16 px */}
      <i className="iv-sampul-sela" aria-hidden="true" />
      <div className="iv-sampul-berkas">
        <p className="iv-sampul-tab">{t('investigasi.kasus', { n: nomor })}</p>
        <div className="iv-sampul-badan">
          <p className="iv-sampul-sub" data-polos={asal ? undefined : ''}>{t('hubInv.nama')}{asal ? <span data-asal-cerita=""> · {asal}</span> : null}</p>
          <h2 id="iv-judul-kasus" tabIndex={-1} data-cer-fokus="">{teks(judul)}</h2>
          {kait ? <p className="iv-sampul-kait">{kait}</p> : null}
          {/* T-137 (pemilik: "supaya dia tau role nya apa"): tugas pemain, satu kalimat, di semua sampul kasus */}
          <p className="iv-sampul-peran" data-peran-investigator="">{t('investigasi.sampulPeran')}</p>
          <div className="iv-sampul-baris">
            <span className="iv-sampul-foto" aria-hidden="true">
              <img className="iv-sampul-klip" src={seniKlip} alt="" width={10} height={22} />
              {foto ? <img className="iv-sampul-foto-gambar" src={foto} alt="" width={96} height={68} /> : gambar ?? <i className="iv-sampul-foto-gambar" />}
              {x?.stempel ? <span className="iv-sampul-cap"><IkonStempel kasus={kasus} /></span> : null}
            </span>
            <ul className="iv-sampul-keping">
              {x ? <li>{t('investigasi.sampulDurasi', { n: x.ep.durasiMenit })}</li> : null}
              {nBukti ? <li>{t('investigasi.sampulBukti', { n: nBukti })}</li> : null}
              {x && x.terbaik !== null ? <li data-terbaik=""><small>{t('investigasi.sampulTerbaik')}</small>{t('hubInv.skorFoto', { skor: x.terbaik, maks: SKOR_MAKS })}</li> : null}
            </ul>
          </div>
        </div>
      </div>
      <i className="iv-sampul-sela" data-dua="" aria-hidden="true" />
      <button type="button" className="primary-action iv-tombol iv-sampul-mulai" data-mulai-kasus="" onClick={onMulai}>{t('investigasi.mulai')}</button>
    </section>
  );
}
