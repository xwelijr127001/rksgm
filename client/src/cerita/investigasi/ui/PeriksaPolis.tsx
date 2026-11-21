/**
 * T-091 / T-092 (Designer): PERIKSA POLIS (Investigator kasus 2). T-092 (pemilik: "look like a polis card but with 8 bit pixelate
 * style ... make it cute"): halaman polis polos diganti KARTU POLIS piksel seperti kartu identitas:
 *   tepi piksel hitam bersudut bertangga, pita kepala jingga Raksa dengan maskot burung hantu di perisai dan tulisan
 *   "POLIS KENDARAAN (CONTOH FIKTIF)"; MPV keluarga piksel; nomor polis dan pelat nomor (fiktif); lalu baris penggunaan:
 *     [mobil keluarga]  "Penggunaan: PRIBADI."
 *     [lencana X]       "Perluasan pada tanggal kejadian: TIDAK ADA."
 * Satu ketukan pada baris penggunaan (kaca pembesar mengintip di sudutnya): kaca menyapu sekali, barisnya menyala, kalimat
 * klausul terbaca di bawahnya (fon biasa 15 px, bukan fon piksel), dan cap merah "DICATAT" mendarat. Lalu kalimat hasil dan
 * "Simpan hasil pemeriksaan" -> onSelesai (cerita lanjut ke kartu bukti polis). Tidak ada jawaban salah.
 * Gambar kartu yang sama (kecil) = gambar kartu bukti polis (seni/investigasi/bukti-kasus2.png sel 3).
 *
 * Kontrak (LayarInvestigasi, tidak berubah): `{ onSelesai }`; `awal` / `onLangkah` yang ikut dikirim diabaikan.
 * TEKS: kalimat polis = kunci naskah kasus lewat `useTx()` (`inv2.polis.*`); kalimat klausul dan hasil bertanda [konfirmasi PIC] di
 * episode/auto-2-inv-2/teks.<bahasa>.ts dan TIDAK ditulis ulang di sini. Kata kartu ini sendiri ("No. polis", "DICATAT") di kamus
 * `investigasi` (`polis.*`). Nomor polis dan pelat nomor = angka fiktif.
 * Ukur 360 x 640 (hitung; ruang isi 544): kemajuan 20 + perintah 26 + kartu (tepi 8 + kepala 48 + identitas 52 + baris terbuka
 * 21 + 42 + klausul 6 + 80 + bantalan / jarak 34 + bawah 10 + jarak 2 x 8 = 317) + hasil 66 + tombol 56 + jarak 4 x 8 = 517 px
 * (klausul 4 baris, en); id 3 baris = 497 px. Sebelum diketuk: tiga baris samar memesan tempat kalimat klausul. Gerak dikurangi: tanpa sapuan / cap bergerak; keadaan akhir langsung tampil.
 */
import { useState, type CSSProperties } from 'react';
import { playSfx } from '../../../audio/audio';
import { t } from '../../../i18n';
import kaca from '../../seni/investigasi/kaca.png';
import maskot from '../../seni/investigasi/polis-maskot.png';
import mpv from '../../seni/investigasi/polis-mpv.png';
import { IkonInv, useTx } from './dasar';
import { PELAT_KASUS2 } from './PeriksaPerjalanan';
import './investigasi.css';
import './bukti-adegan.css';
import './kasus2.css';

/** Nomor polis fiktif (sama di semua bahasa). */
const NOMOR_POLIS = 'RKS-AUTO-0421';

export function PeriksaPolis({ onSelesai }: { onSelesai: () => void; awal?: number; onLangkah?: (langkah: number) => void }) {
  const tx = useTx();
  const [terbuka, setTerbuka] = useState(false);
  const buka = () => { if (terbuka) return; playSfx('kertas'); window.setTimeout(() => playSfx('konfirmasi'), 620); setTerbuka(true); };
  const baris = (
    <>
      <span><IkonInv nama="mpv" kali={2} />{tx('inv2.polis.klausul.1')}</span>
      <span data-sorot=""><IkonInv nama="silang" kali={2} />{tx('inv2.polis.klausul.3')}</span>
    </>
  );
  return (
    <section className="iv-layar pp" data-periksa-polis="" data-sudah={terbuka ? '' : undefined} aria-labelledby="pp-tanya">
      <p className="ps-kemajuan">
        <b>{tx('inv2.polis.judul')}</b>
        <span aria-hidden="true"><i data-isi={terbuka ? '' : undefined} data-kini="" /></span>
      </p>
      <h2 id="pp-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx('inv2.polis.tanya')}</h2>
      <div className="pp-bayang">
        <div className="pp-kartu" role="group" aria-label={t('investigasi.polis.halaman')} style={{ '--pp-kaca': `url(${kaca})`, '--pp-maskot': `url(${maskot})`, '--pp-mpv': `url(${mpv})` } as CSSProperties}>
          <div className="pp-isi">
            <p className="pp-kepala"><i className="pp-maskot" aria-hidden="true" /><span>{tx('inv2.polis.kepala')}</span></p>
            <div className="pp-identitas">
              <i className="pp-mpv" aria-hidden="true" />
              <p className="pp-data">
                <span><small>{t('investigasi.polis.nomor')}</small><b>{NOMOR_POLIS}</b></span>
                <span className="pj-pelat"><span className="sr-only">{t('investigasi.jalan.pelat')} </span>{PELAT_KASUS2}</span>
              </p>
            </div>
            {terbuka ? (
              <div className="pp-baris" data-klausul="" data-terbuka="">
                {baris}
                <p>{tx('inv2.polis.klausul.2')}</p>
                <i className="pp-kaca" aria-hidden="true" />
                <b className="pp-cap">{t('investigasi.polis.dicatat')}</b>
              </div>
            ) : (
              <button type="button" className="pp-baris" data-klausul="" aria-expanded={false} onClick={buka}>
                {baris}
                <small>{tx('inv2.polis.ketuk')}</small>
                <em className="pp-samar" aria-hidden="true"><i /><i /><i /></em>
                <i className="pp-kaca" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="ps-hasil" role="status">{terbuka ? tx('inv2.polis.hasil') : ''}</p>
      <button type="button" className="primary-action iv-tombol" data-polis-lanjut="" disabled={!terbuka} onClick={onSelesai}>{tx('inv2.polis.selesai')}</button>
    </section>
  );
}
