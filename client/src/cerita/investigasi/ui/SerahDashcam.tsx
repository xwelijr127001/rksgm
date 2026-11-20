/**
 * T-080 / T-081: SERAH TERIMA REKAMAN DASHCAM (Episode 1 Investigator). Lapisan di atas panggung keterangan (LayarKeterangan) saat
 * Pak Darto berkata "Silakan diputar. Semuanya terekam di situ.".
 * T-081 (pemilik: "tangannya rusak"): lengan bawah + tangan Pak Darto digambar dari atas dengan palet sprite-nya sendiri (kemeja
 * kotak-kotak, manset, kulit, garis luar) dan KELUAR DARI BALIK TEPI MEJA tepat di bawah badannya (wadah berpotong: tidak pernah
 * ada celah atau balok melayang, tidak pernah menutupi wajah): menjulur dengan kartu memori terjepit di ujung jari -> menaruhnya di
 * meja -> menarik tangan. Kartu lalu meluncur sendiri ke sisi laptop pemain, laptop terbuka, layar menyala "REKAMAN 14:32".
 * Sekali jalan, 3,2 detik. Gerak dikurangi = bingkai diam: tangan tidak tampil, kartu tergeletak di meja, laptop menyala.
 * Tombol "Putar rekaman" (LayarKeterangan) lalu membuka arena dashcam yang dibingkai sebagai layar laptop yang sama.
 * Seni 2x: seni/investigasi/laptop.png (4 bingkai), kartu-memori.png, tangan-serah.png (character/investigator-t080/bangun.mts).
 */
import { t } from '../../../i18n';
import laptop from '../../seni/investigasi/laptop.png';
import kartuMemori from '../../seni/investigasi/kartu-memori.png';
import tanganSerah from '../../seni/investigasi/tangan-serah.png';
import './bukti-adegan.css';

export function SerahDashcam() {
  return (
    <span className="sd" aria-hidden="true" data-serah-dashcam="">
      {/* wadah berpotong: tepi atasnya = tepi belakang meja; lengan (dan kartu di jarinya) bergeser keluar dari baliknya */}
      <span className="sd-lengan">
        <i className="sd-kartu-jari" style={{ backgroundImage: `url(${kartuMemori})` }} />
        <i className="sd-tangan" style={{ backgroundImage: `url(${tanganSerah})` }} />
      </span>
      <i className="sd-kartu" style={{ backgroundImage: `url(${kartuMemori})` }} />
      <span className="sd-laptop" style={{ backgroundImage: `url(${laptop})` }}>
        <span className="sd-layar"><i />{t('investigasi.serah.layar')}</span>
      </span>
    </span>
  );
}
