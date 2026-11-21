/**
 * T-091 (Designer): PERIKSA POLIS (Investigator kasus 2; menggantikan layar sementara T-090). Halaman polis FIKTIF: kepala biru
 * dengan ikon halaman polis, baris-baris teks samar, dan SATU kotak bertepi putus-putus "Penggunaan kendaraan". Satu ketukan:
 * kotaknya terbuka dan terbaca besar (16 px), kaca pembesar menyapu sekali:
 *   "Penggunaan: PRIBADI." (tebal) · kalimat pengecualian · "Perluasan pada tanggal kejadian: TIDAK ADA." (disorot, garis merah).
 * Lalu kalimat hasil dan "Simpan hasil pemeriksaan" -> onSelesai (cerita lanjut ke kartu bukti polis). Tidak ada jawaban salah.
 *
 * Kontrak (LayarInvestigasi): `{ onSelesai }`; `awal` / `onLangkah` yang ikut dikirim diabaikan (layar ini satu langkah).
 * TEKS: semua kalimat = kunci naskah kasus lewat `useTx()` (`inv2.polis.*`). Kalimat klausul dan hasil bertanda [konfirmasi PIC] di
 * episode/auto-2-inv-2/teks.<bahasa>.ts dan TIDAK ditulis ulang di sini.
 * Ukur 360 x 640 (hitung; ruang isi 544): kemajuan 20 + perintah 26..52 + halaman 292 + hasil 66 + tombol 56 + jarak 4 x 8 =
 * 492..518 px. Kotak klausul terbuka (id / en, lebar teks 284): judul 18 + 21 + 84 + 44 + jarak 12 + bantalan 16 + tepi 4 = 199 px.
 * Gerak dikurangi: tanpa sapuan kaca dan tanpa bukaan; keadaan akhir langsung tampil.
 */
import { useState, type CSSProperties } from 'react';
import { playSfx } from '../../../audio/audio';
import { t } from '../../../i18n';
import kaca from '../../seni/investigasi/kaca.png';
import { IkonInv, useTx } from './dasar';
import './investigasi.css';
import './bukti-adegan.css';
import './kasus2.css';

export function PeriksaPolis({ onSelesai }: { onSelesai: () => void; awal?: number; onLangkah?: (langkah: number) => void }) {
  const tx = useTx();
  const [terbuka, setTerbuka] = useState(false);
  const buka = () => { if (terbuka) return; playSfx('kertas'); setTerbuka(true); };
  return (
    <section className="iv-layar pp" data-periksa-polis="" data-sudah={terbuka ? '' : undefined} aria-labelledby="pp-tanya">
      <p className="ps-kemajuan">
        <b>{tx('inv2.polis.judul')}</b>
        <span aria-hidden="true"><i data-isi={terbuka ? '' : undefined} data-kini="" /></span>
      </p>
      <h2 id="pp-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx('inv2.polis.tanya')}</h2>
      <div className="pp-halaman" role="group" aria-label={t('investigasi.polis.halaman')} style={{ '--pp-kaca': `url(${kaca})` } as CSSProperties}>
        <p className="pp-kepala"><IkonInv nama="polis-dok" kali={1} /><span>{tx('inv2.polis.kepala')}</span></p>
        <span className="pp-garis" aria-hidden="true"><i /><i />{terbuka ? null : <><i /><i /></>}</span>
        {terbuka ? (
          <div className="pp-klausul" data-klausul="" data-terbuka="">
            <b>{tx('inv2.polis.klausul.judul')}</b>
            <span>{tx('inv2.polis.klausul.1')}</span>
            <span>{tx('inv2.polis.klausul.2')}</span>
            <span data-sorot="">{tx('inv2.polis.klausul.3')}</span>
            <i className="pp-kaca" aria-hidden="true" />
          </div>
        ) : (
          <button type="button" className="pp-klausul" data-klausul="" aria-expanded={false} onClick={buka}>
            <b>{tx('inv2.polis.klausul.judul')}</b>
            <small>{tx('inv2.polis.ketuk')}</small>
          </button>
        )}
        <span className="pp-garis" aria-hidden="true"><i /><i /><i />{terbuka ? null : <><i /><i /><i /><i /><i /><i /></>}</span>
      </div>
      <p className="ps-hasil" role="status">{terbuka ? tx('inv2.polis.hasil') : ''}</p>
      <button type="button" className="primary-action iv-tombol" data-polis-lanjut="" disabled={!terbuka} onClick={onSelesai}>{tx('inv2.polis.selesai')}</button>
    </section>
  );
}
