/**
 * T-080 / T-081 / T-082: SERAH TERIMA REKAMAN DASHCAM (Episode 1 Investigator). Lapisan di atas panggung keterangan (LayarKeterangan)
 * saat Pak Darto berkata "Silakan diputar. Semuanya terekam di situ.".
 * T-082 (pemilik: tangan terpisah di bawah badan "tidak menyatu dengan badan Pak Darto"): lengannya kini BAGIAN DARI BADANNYA.
 * Atlasnya hanya punya satu pose (berdiri, lengan tergantung), jadi dipakai SUNTINGAN sprite badan atasnya sendiri
 * (seni/investigasi/darto-serah.png, 3 bingkai 71 x 92 piksel seni, 2x; character/investigator-t082/bangun.mts): lengan kirinya yang
 * asli ditekuk ke depan di siku: manset gulung naik ke tepi meja, lengan bawah memendek dan miring ke tengah meja, kepalan
 * tangannya sendiri di ujungnya. Satu anggota badan utuh dari jahitan bahu sampai tangan, piksel dan warna dari sprite-nya sendiri.
 * Urutan (3,2 detik, sekali): diam -> menjulur (bingkai 1) -> menaruh kartu memori (bingkai 2) -> menarik tangan (bingkai 1) ->
 * diam. Selama bingkai suntingan tampil, sprite hidupnya (napas / kedip) disembunyikan (LayarKeterangan memberi data-serah), lalu
 * tampil lagi. Kartu ikut di bawah kepalan, tertinggal di meja, lalu meluncur sendiri ke sisi laptop; laptop terbuka dan menyala
 * "REKAMAN 14:32". Gerak dikurangi = bingkai diam: sprite biasa, kartu tergeletak di meja, laptop menyala.
 * Tombol "Putar rekaman" (LayarKeterangan) lalu membuka arena dashcam yang dibingkai sebagai layar laptop yang sama.
 */
import { t } from '../../../i18n';
import dartoSerah from '../../seni/investigasi/darto-serah.png';
import laptop from '../../seni/investigasi/laptop.png';
import kartuMemori from '../../seni/investigasi/kartu-memori.png';
import './bukti-adegan.css';

export function SerahDashcam() {
  return (
    <span className="sd" aria-hidden="true" data-serah-dashcam="">
      <i className="sd-kartu" style={{ backgroundImage: `url(${kartuMemori})` }} />
      {/* badan atas Pak Darto dengan lengan menjulur (menggantikan sprite hidup selama 1,2 detik); baris di bawah tepi meja hanya berisi lengan */}
      <i className="sd-badan" style={{ backgroundImage: `url(${dartoSerah})` }} />
      <span className="sd-laptop" style={{ backgroundImage: `url(${laptop})` }}>
        <span className="sd-layar"><i />{t('investigasi.serah.layar')}</span>
      </span>
    </span>
  );
}
