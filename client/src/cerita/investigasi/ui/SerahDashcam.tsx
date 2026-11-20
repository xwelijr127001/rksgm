/**
 * T-080: SERAH TERIMA REKAMAN DASHCAM (Episode 1 Investigator). Lapisan di atas panggung keterangan (LayarKeterangan) saat Pak
 * Darto berkata "Silakan diputar. Semuanya terekam di situ.": tangannya (lengan kemeja kotak-kotak) turun ke meja membawa kartu
 * memori dashcam, kartu itu meluncur di meja ke laptop pemain, laptop terbuka, kartu masuk, layar laptop menyala "REKAMAN 14:32".
 * Sekali jalan, 3,2 detik; keadaan dasar (tanpa animasi) = keadaan AKHIR, jadi gerak dikurangi = bingkai diam laptop menyala.
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
      <i className="sd-tangan" style={{ backgroundImage: `url(${tanganSerah})` }} />
      <i className="sd-kartu" style={{ backgroundImage: `url(${kartuMemori})` }} />
      <span className="sd-laptop" style={{ backgroundImage: `url(${laptop})` }}>
        <span className="sd-layar"><i />{t('investigasi.serah.layar')}</span>
      </span>
    </span>
  );
}
