/**
 * T-088: TEBAK LAJUR (tebakan pembuka; review pilot butir 1: tamu ikut menyelidik dalam 30 detik pertama). Bingkai dashcam diam
 * sebelum truk membanting setir (keempat lajur, 292 x 150) dengan tanda "?" berdenyut di atas truk; Miss Raksa investigator (kaca
 * pembesar, T-084) bertanya "Truk di lajur berapa?"; empat keping lajur besar (56 x 52 px) tepat di bawah lajurnya masing-masing.
 * Satu ketukan = onPilih(lajur). Tidak ada benar / salah di sini: tebakannya diingat pemanggil dan dicek lagi di rekaman.
 *
 * Props: { onPilih(lajur: 1 | 2 | 3 | 4), pilihan? } (\`pilihan\` = keping yang sudah dipilih, mis. saat layar ini dibuka lagi).
 * Ukur 360 x 640 (hitung): tanya 68 + bingkai 150 + keping 52 + keterangan 20..40 + jarak 3 x 8 = 314..334 px.
 * T-125 (ulasan Pak Peterson: gambar tebakan sudah memperlihatkan truk di lajur 2): bingkai dashcam diganti gambar NETRAL
 * (SeniTolNetral: jalan tol empat lajur yang kosong, ukuran dan pusat lajur sama, "?" di tengah jalan). Tinggi layar tidak berubah.
 */
import { t } from '../../../i18n';
import { PotretReaksi } from './BukuCatatan';
import { SeniTolNetral } from './SeniTolNetral';
import './investigasi.css';
import './tambahan.css';

export type Lajur = 1 | 2 | 3 | 4;
/** Pusat lajur 1-4 di bingkai potongan 'lajur' (x adegan 97 / 163 / 229 / 295 dikurangi 44). */
const PUSAT = [53, 119, 185, 251] as const;

export function TebakLajur({ onPilih, pilihan }: { onPilih: (lajur: Lajur) => void; pilihan?: Lajur }) {
  return (
    <section className="iv-layar iv-tebak" data-tebak-lajur="" aria-labelledby="iv-tebak-tanya">
      <div className="iv-tebak-kepala">
        <PotretReaksi reaksi="miss-detektif" ukuran={64} />
        <p className="iv-tebak-balon"><b>Miss Raksa</b><span id="iv-tebak-tanya" tabIndex={-1} data-cer-fokus="">{t('investigasi.tebak.tanya')}</span></p>
      </div>
      <div className="iv-tebak-jalan">
        <SeniTolNetral besar tanya />
        <div className="iv-tebak-keping" role="group" aria-labelledby="iv-tebak-tanya">
          {PUSAT.map((x, i) => (
            <button key={i} type="button" className="iv-keping" data-lajur={i + 1} aria-pressed={pilihan === i + 1} aria-label={t('investigasi.tebak.lajur', { n: i + 1 })}
              style={{ left: x }} onClick={() => onPilih((i + 1) as Lajur)}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      <p className="iv-label">{t('investigasi.tebak.ket')}</p>
    </section>
  );
}
