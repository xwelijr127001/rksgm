/**
 * T-080 .. T-083: SERAH TERIMA REKAMAN DASHCAM (Episode 1 Investigator). Lapisan di atas panggung keterangan (LayarKeterangan) saat
 * Pak Darto berkata "Silakan diputar. Semuanya terekam di situ.".
 * T-083 (pemilik: "jangan laptop; di belakang Pak Darto ada TV"): laptop di meja dihapus. Rekaman diputar di TV DINDING di belakang
 * Pak Darto (TvDinding di bawah ini; LayarKeterangan memasangnya di setiap adegan ruang wawancara, mati; di adegan ini menyala).
 * Urutan (3,4 detik, sekali): lengan Pak Darto (bingkai T-082: suntingan sprite-nya sendiri) menjulur dan menaruh kartu memori di
 * meja -> ia menarik tangan -> kartu melayang melengkung ke celah kotak media di bawah TV -> TV menyala dengan kedip gaya tabung
 * dan menampilkan "REKAMAN 14:32". Tombol "Putar rekaman" lalu membuka arena dashcam yang dibingkai sebagai layar TV itu.
 * Gerak dikurangi = bingkai diam: sprite biasa, kartu tergeletak di meja, TV menyala.
 */
import { t } from '../../../i18n';
import dartoSerah from '../../seni/investigasi/darto-serah.png';
import kartuMemori from '../../seni/investigasi/kartu-memori.png';
import tvDinding from '../../seni/investigasi/tv-dinding.png';
import './bukti-adegan.css';

/**
 * TV dinding ruang wawancara (seni/investigasi/tv-dinding.png, 2x: tambalan dinding yang menggantikan papan tulis + TV + braket +
 * kotak media). `nyala` = menayangkan "REKAMAN 14:32" (dengan kedip menyala sekali); tanpa itu layar gelap, lampu daya merah.
 */
export function TvDinding({ nyala = false }: { nyala?: boolean }) {
  return (
    <span className="kt-tv" aria-hidden="true" data-nyala={nyala ? '' : undefined} style={{ backgroundImage: `url(${tvDinding})` }}>
      {nyala ? <span className="kt-tv-layar"><i />{t('investigasi.serah.layar')}</span> : null}
      <i className="kt-tv-lampu" />
    </span>
  );
}

export function SerahDashcam() {
  return (
    <span className="sd" aria-hidden="true" data-serah-dashcam="">
      <i className="sd-kartu" style={{ backgroundImage: `url(${kartuMemori})` }} />
      {/* badan atas Pak Darto dengan lengan menjulur (menggantikan sprite hidup selama 1,3 detik); baris di bawah tepi meja hanya berisi lengan */}
      <i className="sd-badan" style={{ backgroundImage: `url(${dartoSerah})` }} />
    </span>
  );
}
