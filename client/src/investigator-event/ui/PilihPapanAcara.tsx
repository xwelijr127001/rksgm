/**
 * T-105 (Designer): LAYAR HP sesudah hub melihat kode acara, tampilan saja: props masuk, callback keluar; tanpa fetch / socket /
 * penyimpanan. Rupa = hub detektif T-100 (meja kayu, berkas kraft, kunci piksel). Dipasang di dalam cangkang hub (.hp-layar).
 *
 *   alias kosong  PILIHAN: berkas "Ada papan acara hari ini" + kode acara; dua tombol terpisah, sama besar:
 *                   "Ikut papan acara" (utama, jingga) -> onJoin()      "Main sendiri" (garis) -> onSolo()
 *                 tiap tombol punya satu kalimat akibatnya; di bawahnya kalimat privasi (nama samaran acak, tanpa data pribadi,
 *                 papan dihapus tengah malam) dan catatan "mulai dari awal, simpanan main sendiri tidak dihapus".
 *   alias terisi  LENCANA NAMA: kartu nama berjepit "Nama samaranmu" + alias besar; "Ganti nama samaran" -> onReroll() selama
 *                 `canReroll` (sesudah kasus pertama: kalimat "terkunci"); "Mulai sebagai <alias>" -> onStart(); tautan
 *                 "Main sendiri saja" -> onSolo().
 * `busy` = tombol nonaktif; `error` = kalimat galat jadi dari induk. Sasaran ketuk >= 48 px. Tanpa animasi.
 * Ukur 360 x 640 (hitung, isi 544): pilihan = berkas 96 + tombol 2 x (56 + 22) + 3 x 10 + privasi 66 + catatan 44 = 402 px;
 * lencana = kartu 148 + ganti 48 + mulai 56 + tautan 44 + privasi 66 + jarak 40 = 402 px.
 */
import { t, useBahasa } from '../../i18n';
import seniKlip from '../../cerita/seni/investigasi/klip.png';
import './acara-inv.css';

export interface PilihPapanAcaraProps {
  code: string;
  /** Nama samaran dari server sesudah bergabung; null / kosong = belum bergabung (layar pilihan). */
  alias?: string | null;
  canReroll?: boolean;
  busy?: boolean;
  error?: string | null;
  onJoin: () => void;
  onSolo: () => void;
  onReroll: () => void;
  onStart: () => void;
}

export function PilihPapanAcara({ code, alias, canReroll = true, busy = false, error, onJoin, onSolo, onReroll, onStart }: PilihPapanAcaraProps) {
  useBahasa();
  const privasi = <p className="ai-pilih-privasi" data-pilih-privasi="">{t('acaraInv.pilihPrivasi')}</p>;
  if (alias) {
    return (
      <section className="ai-pilih" data-pilih-papan="lencana" aria-labelledby="ai-pilih-judul">
        <div className="ai-nama" data-lencana-nama="">
          <img className="ai-nama-klip" src={seniKlip} alt="" aria-hidden="true" width={10} height={22} />
          <h2 id="ai-pilih-judul" className="ai-nama-label" tabIndex={-1} data-cer-fokus="">{t('acaraInv.lencanaLabel')}</h2>
          <b className="ai-nama-alias" data-alias="">{alias}</b>
          <span className="ai-nama-kode">{t('acaraInv.pilihKode', { kode: code })}</span>
        </div>
        {canReroll
          ? <button type="button" className="cer-tombol-garis ai-pilih-ganti" data-pilih-ganti="" disabled={busy} onClick={onReroll}>{t('acaraInv.lencanaGanti')}</button>
          : <p className="ai-pilih-ket">{t('acaraInv.lencanaKunci')}</p>}
        {error ? <p className="ai-pilih-galat" role="alert">{error}</p> : null}
        <button type="button" className="primary-action ai-pilih-utama" data-pilih-mulai="" disabled={busy} onClick={onStart}>{t('acaraInv.mulai', { alias })}</button>
        <button type="button" className="hp-tautan ai-pilih-tautan" data-pilih-sendiri="" disabled={busy} onClick={onSolo}>{t('acaraInv.batalIkut')}</button>
        {privasi}
      </section>
    );
  }
  return (
    <section className="ai-pilih" data-pilih-papan="pilihan" aria-labelledby="ai-pilih-judul">
      <div className="ai-pilih-berkas">
        <span className="ai-pilih-tab">{t('acaraInv.pilihKode', { kode: code })}</span>
        <h2 id="ai-pilih-judul" tabIndex={-1} data-cer-fokus="">{t('acaraInv.pilihJudul')}</h2>
      </div>
      {error ? <p className="ai-pilih-galat" role="alert">{error}</p> : null}
      <div className="ai-pilih-opsi">
        <button type="button" className="primary-action ai-pilih-utama" data-pilih-ikut="" disabled={busy} aria-describedby="ai-pilih-ikut-ket" onClick={onJoin}>{t('acaraInv.pilihIkut')}</button>
        <p id="ai-pilih-ikut-ket" className="ai-pilih-ket">{t('acaraInv.pilihIkutKet')}</p>
      </div>
      <div className="ai-pilih-opsi">
        <button type="button" className="cer-tombol-garis ai-pilih-kedua" data-pilih-sendiri="" disabled={busy} aria-describedby="ai-pilih-sendiri-ket" onClick={onSolo}>{t('acaraInv.pilihSendiri')}</button>
        <p id="ai-pilih-sendiri-ket" className="ai-pilih-ket">{t('acaraInv.pilihSendiriKet')}</p>
      </div>
      {privasi}
      <p className="ai-pilih-ket ai-pilih-awal">{t('acaraInv.pilihDariAwal')}</p>
    </section>
  );
}
