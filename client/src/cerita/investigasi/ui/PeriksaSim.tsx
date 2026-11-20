/**
 * T-080: PERIKSA SIM DI MEJA (Episode 1 Investigator; menggantikan alur Satpas Episode 1 di episode ini saja).
 * Pak Darto menaruh SIM dan STNK truknya di meja wawancara. Tiga langkah pendek, ketuk saja, tiap langkah satu gerak kecil:
 *   1 ketuk SIM       kartu berbalik ke sisi depan; kaca pembesar + bingkai menyorot kotak GOLONGAN "B II UMUM" di SIM dan baris
 *                     SIM "B II UMUM" di STNK (truk trailer): cocok;
 *   2 ketuk hologram  berkas senter HP menyinari hologram, hologram berkilau berganti warna (kartu asli);
 *   3 ketuk kode QR   maket HP naik dari bawah: layar "Cek data SIM" memindai lalu "Data SIM cocok" (fiktif, tanpa nama / logo
 *                     lembaga mana pun).
 * Tiap langkah: perintah singkat, sasaran ketuk >= 56 px bercincin kedip, kalimat hasil, lalu "Lanjut"; langkah terakhir Pak Darto
 * "lega" (potret reaksi) dan "Simpan hasil pemeriksaan" -> onSelesai (cerita lanjut ke kartu bukti SIM). Tidak ada jawaban salah.
 * Meja 336 x 236 (seni 2x: seni/investigasi/sim-depan, sim-belakang, stnk, kaca; character/investigator-t080/bangun.mts).
 * Gerak dikurangi: tanpa balik / kilau / geser, keadaan akhir tiap langkah langsung tampil.
 * Ukur 360 x 640 (hitung; ruang isi 544): langkah 20 + perintah 26..52 + meja 240 + hasil 44..66 + tombol 56 + jarak 4 x 8 =
 * 418..466 px.
 */
import { useEffect, useState, type CSSProperties } from 'react';
import { playSfx } from '../../../audio/audio';
import { useReducedMotion } from '../../../hooks';
import { t } from '../../../i18n';
import simDepan from '../../seni/investigasi/sim-depan.png';
import simBelakang from '../../seni/investigasi/sim-belakang.png';
import stnk from '../../seni/investigasi/stnk.png';
import kaca from '../../seni/investigasi/kaca.png';
import { PotretReaksi } from './BukuCatatan';
import './investigasi.css';
import './bukti-adegan.css';

type Langkah = 0 | 1 | 2;

export function PeriksaSim({ onSelesai }: { onSelesai: () => void }) {
  const kurang = useReducedMotion();
  const [langkah, setLangkah] = useState<Langkah>(0);
  /** Langkah kini sudah diketuk (hasilnya tampil). */
  const [sudah, setSudah] = useState(false);
  /** Langkah 3: pindai selesai (layar HP menampilkan hasil). */
  const [cocok, setCocok] = useState(false);
  useEffect(() => {
    if (langkah !== 2 || !sudah) return;
    if (kurang) { setCocok(true); return; }
    const w = window.setTimeout(() => { setCocok(true); playSfx('konfirmasi'); }, 1300);
    return () => window.clearTimeout(w);
  }, [langkah, sudah, kurang]);

  const ketuk = (n: Langkah) => { if (langkah !== n || sudah) return; playSfx(n === 0 ? 'kertas' : 'ketuk'); setSudah(true); };
  const maju = () => {
    if (!sudah || (langkah === 2 && !cocok)) return;
    if (langkah === 2) { onSelesai(); return; }
    setLangkah((langkah + 1) as Langkah); setSudah(false);
  };
  const depan = langkah > 0 || sudah; // SIM sudah dibalik
  const siap = sudah && (langkah !== 2 || cocok);
  const n = langkah + 1;

  return (
    <section className="iv-layar ps" data-periksa-sim="" data-langkah={n} data-sudah={sudah ? '' : undefined} aria-labelledby="ps-tanya">
      <p className="ps-kemajuan">
        <b>{t('investigasi.sim.judul')}</b>
        <span aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} data-isi={i < langkah || (i === langkah && siap) ? '' : undefined} data-kini={i === langkah ? '' : undefined} />)}</span>
        <span className="sr-only">{t('investigasi.sim.langkah', { n })}</span>
      </p>
      <h2 id="ps-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{t(`investigasi.sim.${n}.tanya`)}</h2>
      <div className="ps-meja">
        <div className="ps-isi" style={{ '--ps-kaca': `url(${kaca})` } as CSSProperties}>
          <img className="ps-stnk" src={stnk} alt="" aria-hidden="true" />
          {langkah === 0 && !sudah ? (
            <button type="button" className="ps-sim ps-sim-tombol" data-sasaran="sim" aria-label={t('investigasi.sim.ketukSim')} onClick={() => ketuk(0)}>
              <img src={simBelakang} alt="" />
            </button>
          ) : (
            <span className="ps-sim" data-balik={langkah === 0 ? '' : undefined} aria-hidden="true"><img src={depan ? simDepan : simBelakang} alt="" /></span>
          )}
          {/* 1: golongan di SIM = SIM yang diwajibkan STNK */}
          {depan ? (
            <span className="ps-cocok" data-baru={langkah === 0 ? '' : undefined} aria-hidden="true">
              <i className="ps-cincin ps-cincin-sim" /><i className="ps-cincin ps-cincin-stnk" /><i className="ps-tali" />
              {langkah === 0 ? <i className="ps-kaca" /> : null}
              <b>{t('investigasi.sim.cocok')} ✓</b>
            </span>
          ) : null}
          {/* 2: hologram di bawah senter */}
          {langkah === 1 && !sudah ? <button type="button" className="ps-sasaran ps-sasaran-holo" data-sasaran="hologram" aria-label={t('investigasi.sim.ketukHolo')} onClick={() => ketuk(1)} /> : null}
          {langkah === 1 && sudah ? <><i className="ps-senter" aria-hidden="true" /><i className="ps-holo" aria-hidden="true" /></> : null}
          {langkah === 2 ? <i className="ps-holo ps-holo-diam" aria-hidden="true" /> : null}
          {/* 3: pindai QR dengan HP */}
          {langkah === 2 && !sudah ? <button type="button" className="ps-sasaran ps-sasaran-qr" data-sasaran="qr" aria-label={t('investigasi.sim.ketukQr')} onClick={() => ketuk(2)} /> : null}
          {langkah === 2 && sudah ? (
            <div className="ps-hp" data-cocok={cocok ? '' : undefined} aria-hidden="true">
              <p className="ps-hp-judul">{t('investigasi.sim.cek')}</p>
              {cocok ? (
                <div className="ps-hp-hasil">
                  <span className="ps-hp-centang">✓</span>
                  <b>{t('investigasi.sim.cocokData')}</b>
                  <span>{t('investigasi.sim.golongan')}: B II Umum</span>
                  <span>{t('investigasi.sim.status')}: {t('investigasi.sim.aktif')}</span>
                </div>
              ) : <div className="ps-hp-pindai"><i /><span>{t('investigasi.sim.memindai')}</span></div>}
            </div>
          ) : null}
          {langkah === 2 && cocok ? <span className="ps-lega" aria-hidden="true"><PotretReaksi reaksi="darto-lega" ukuran={64} /></span> : null}
        </div>
      </div>
      <p className="ps-hasil" role="status">{siap ? t(`investigasi.sim.${n}.hasil`) : ''}</p>
      <button type="button" className="primary-action iv-tombol" data-ps-lanjut="" disabled={!siap} onClick={maju}>
        {langkah === 2 ? t('investigasi.sim.selesai') : t('investigasi.sim.lanjut')}
      </button>
    </section>
  );
}
