/**
 * T-125 (Designer): GAMBAR NETRAL KASUS 1 "Truk di Tol" untuk semua tempat SEBELUM pemain memeriksa rekaman (hub, sampul kasus,
 * tebakan "Truk di lajur berapa?"). Ulasan Pak Peterson: bingkai dashcam lama di tempat-tempat itu sudah memperlihatkan truk di
 * lajur 2 (bocoran jawaban). Gambar ini = jalan tol EMPAT lajur yang kosong dilihat dari atas, di bawah gawang dengan satu kamera
 * di tengah; tanpa kendaraan, tanpa jam, tanpa lajur yang ditandai. Seni: character/investigator-t125/bangun.mts.
 * Rekaman bernomor dengan truknya TETAP dipakai di penyelidikan (ArenaDashcam, kartu bukti, zum KEBERATAN): jangan diganti.
 *
 *   <SeniTolNetral />          168 x 108 (seperti <BingkaiDashcam />): foto berkas di hub
 *   <SeniTolNetral besar />    292 x 150 (seperti <BingkaiDashcam besar potong="lajur" />): pusat lajur 1-4 di x 53 / 119 / 185 / 251,
 *                              jadi keping lajur TebakLajur tepat di bawah lajurnya
 *   tanya                      (hanya `besar`) tanda "?" berdenyut di tengah jalan, di antara lajur 2 dan 3 (tidak memihak lajur)
 * Untuk kartu C: pengganti langsung <BingkaiDashcam besar /> di tempat mana pun sebelum rekaman diperiksa (mis. prop `gambar`
 * sampul kasus). Foto sampul 96 x 68 = seni/investigasi/hub-kasus-1.png (sudah gambar yang sama; dipakai JudulKasus dan hub).
 */
import { t } from '../../../i18n';
import seniBesar from '../../seni/investigasi/tol-netral-besar.png';
import seniKecil from '../../seni/investigasi/tol-netral.png';
import './tol-netral.css';

export function SeniTolNetral({ besar = false, tanya = false }: { besar?: boolean; tanya?: boolean }) {
  return (
    <figure className="tn" data-besar={besar ? '' : undefined} data-seni-netral="kasus-1" role="img" aria-label={t('hubInv.fotoTol')}>
      <img src={besar ? seniBesar : seniKecil} alt="" width={besar ? 144 : 82} height={besar ? 73 : 52} />
      {besar && tanya ? <i className="tn-tanya" aria-hidden="true">?</i> : null}
    </figure>
  );
}
