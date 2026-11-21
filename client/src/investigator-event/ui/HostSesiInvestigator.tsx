/**
 * T-105 (Designer): BLOK HOST "Papan acara Investigator", tampilan saja: props masuk, callback keluar; tanpa fetch / socket /
 * penyimpanan. Kartu 6 mengisi `view` dari `HostEventView` (shared/investigator/event.ts) dan menyambung callback ke API.
 * Gaya = layar host satu-layar (pages/host/host.css): kartu `.panel`, kunci piksel `.btn`, chip; blok ini ringkas (laptop:
 * dua kolom, tinggi isi sekitar 300 px; daftar peringkat menggulir di dalam kotaknya sendiri).
 *
 *   view null      belum ada sesi: penjelasan satu kalimat + "Buat sesi Investigator" -> onCreate()
 *   papan dibuka   kiri: kode acara + QR 132 + jumlah peserta. Kanan: "Peringkat sementara" (semua baris host; tiap baris punya
 *                  "Sembunyikan" / "Tampilkan" -> onHide(participantId, hidden)), lalu kendali:
 *                    "Hubungkan proyektor" -> onPairDisplay(); `displayCode` tampil besar + sisa detik; `view.displayPaired` =
 *                    "Proyektor tersambung" + "Putuskan proyektor" -> onRevokeDisplay()
 *                    "Tutup papan" dan "Hapus papan": KONFIRMASI DI HALAMAN (baris tanya + "Ya, ..." / "Batal"; fokus pindah
 *                    ke "Batal", dan kembali ke tombol asal bila dibatalkan) -> onClose() / onClear()
 *   papan ditutup  chip "Papan ditutup", daftar terakhir tetap terbaca, "Hapus papan" dan "Buat sesi baru".
 * `busy` = semua kendali nonaktif + "Memproses…"; `error` = kalimat galat jadi (sudah diterjemahkan) dari induk.
 */
import { useEffect, useRef, useState } from 'react';
import type { HostEventView } from '@shared/investigator/event';
import { SERIES_MAX } from '@shared/investigator/rubric';
import { t, useBahasa } from '../../i18n';
import { KodeQr, StempelPapan } from './bagian';
import './acara-inv.css';

export interface HostSesiInvestigatorProps {
  view: HostEventView | null;
  /** Tautan QR tamu (/investigator?acara=KODE); tanpa nilai = QR tidak digambar. */
  joinUrl?: string;
  /** Kode pasang proyektor yang baru diterbitkan (sekali pakai) dan sisa detiknya; null = tidak ada. */
  displayCode?: { code: string; secondsLeft: number } | null;
  busy?: boolean;
  error?: string | null;
  onCreate: () => void;
  onHide: (participantId: string, hidden: boolean) => void;
  onClose: () => void;
  onClear: () => void;
  onPairDisplay: () => void;
  onRevokeDisplay?: () => void;
}

type Tanya = 'tutup' | 'hapus' | null;

export function HostSesiInvestigator({ view, joinUrl, displayCode, busy = false, error, onCreate, onHide, onClose, onClear, onPairDisplay, onRevokeDisplay }: HostSesiInvestigatorProps) {
  useBahasa();
  const [tanya, setTanya] = useState<Tanya>(null);
  const batalRef = useRef<HTMLButtonElement>(null);
  const asalRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { if (tanya) batalRef.current?.focus(); }, [tanya]);
  const buka = (apa: Exclude<Tanya, null>, asal: HTMLButtonElement) => { asalRef.current = asal; setTanya(apa); };
  const batal = () => { setTanya(null); asalRef.current?.focus(); };
  const setuju = () => { const apa = tanya; setTanya(null); if (apa === 'tutup') onClose(); else if (apa === 'hapus') onClear(); };

  if (!view) {
    return (
      <section className="panel ai-host" data-host-investigator="kosong" aria-labelledby="ai-host-judul">
        <h3 id="ai-host-judul" className="ai-host-judul">{t('acaraInv.hostJudul')}</h3>
        <p className="ai-host-ket">{t('acaraInv.hostKet')}</p>
        <p className="ai-host-ket ai-host-kecil">{t('acaraInv.hostTengahMalam')} {t('acaraInv.catatan')}</p>
        {error ? <p className="ai-host-galat" role="alert">{error}</p> : null}
        <button type="button" className="btn ai-host-buat" data-host-buat="" disabled={busy} onClick={onCreate}>{busy ? t('acaraInv.hostSibuk') : t('acaraInv.hostBuat')}</button>
      </section>
    );
  }

  const tutup = view.event.status === 'closed';
  return (
    <section className="panel ai-host" data-host-investigator={view.event.status} aria-labelledby="ai-host-judul" aria-busy={busy}>
      <div className="ai-host-kepala">
        <h3 id="ai-host-judul" className="ai-host-judul">{t('acaraInv.hostJudul')}</h3>
        <span className="chip ai-host-status" data-status={view.event.status}>{t(tutup ? 'acaraInv.hostStatusTutup' : 'acaraInv.hostStatusBuka')}</span>
        <span className="ai-host-peserta" data-host-peserta="">{t('acaraInv.hostPeserta', { n: view.participants })}</span>
      </div>
      {error ? <p className="ai-host-galat" role="alert">{error}</p> : null}
      <div className="ai-host-grid">
        <div className="ai-host-undang">
          <span className="ai-host-label">{t('acaraInv.hostKode')}</span>
          <b className="ai-host-kode" data-host-kode="">{view.event.code}</b>
          {joinUrl && !tutup ? <span className="ai-host-qr"><KodeQr value={joinUrl} label={joinUrl} /></span> : null}
          <p className="ai-host-kecil">{t('acaraInv.hostTengahMalam')}</p>
        </div>
        <div className="ai-host-kanan">
          <h4 className="ai-host-label">{t('acaraInv.hostDaftar')}</h4>
          {view.rows.length ? (
            <ol className="ai-host-daftar" tabIndex={0}>
              {view.rows.map((r) => (
                <li key={r.participantId} className="ai-host-baris" data-tersembunyi={r.hidden ? '' : undefined}>
                  <span className="ai-host-rank">{r.hidden ? '–' : r.rank}</span>
                  <span className="ai-host-nama">{r.alias}{r.hidden ? <small> · {t('acaraInv.hostTersembunyi')}</small> : null}</span>
                  <StempelPapan jumlah={r.stamps} skala={1.25} />
                  <span className="ai-host-total"><b>{r.total}</b>/{SERIES_MAX}</span>
                  <button type="button" className="btn btn-kecil btn-netral ai-host-sembunyi" data-host-sembunyi={r.participantId} disabled={busy} aria-pressed={r.hidden}
                    aria-label={t(r.hidden ? 'acaraInv.hostTampilAria' : 'acaraInv.hostSembunyiAria', { alias: r.alias })} onClick={() => onHide(r.participantId, !r.hidden)}>
                    {t(r.hidden ? 'acaraInv.hostTampil' : 'acaraInv.hostSembunyi')}
                  </button>
                </li>
              ))}
            </ol>
          ) : <p className="ai-host-kosong">{t('acaraInv.hostKosong')}</p>}

          {tanya ? (
            <div className="ai-host-tanya" role="group" aria-label={t(tanya === 'tutup' ? 'acaraInv.hostTutup' : 'acaraInv.hostHapus')} data-host-tanya={tanya}>
              <p>{t(tanya === 'tutup' ? 'acaraInv.hostTutupTanya' : 'acaraInv.hostHapusTanya')}</p>
              <button ref={batalRef} type="button" className="btn btn-kecil btn-netral" onClick={batal}>{t('acaraInv.batal')}</button>
              <button type="button" className="btn btn-kecil btn-bahaya" data-host-ya={tanya} onClick={setuju}>{t(tanya === 'tutup' ? 'acaraInv.hostTutupYa' : 'acaraInv.hostHapusYa')}</button>
            </div>
          ) : (
            <div className="ai-host-aksi">
              {tutup ? null : view.displayPaired ? (
                <span className="ai-host-proyektor" data-tersambung="">
                  <b>{t('acaraInv.hostProyektorTersambung')}</b>
                  {onRevokeDisplay ? <button type="button" className="btn btn-kecil btn-netral" disabled={busy} onClick={onRevokeDisplay}>{t('acaraInv.hostProyektorPutus')}</button> : null}
                </span>
              ) : displayCode ? (
                <span className="ai-host-proyektor" data-host-kode-proyektor="">
                  <span>{t('acaraInv.hostProyektorKet')}</span>
                  <b className="ai-host-kode-proyektor">{displayCode.code}</b>
                  <small>{t('acaraInv.hostProyektorSisa', { n: Math.max(0, Math.ceil(displayCode.secondsLeft)) })}</small>
                </span>
              ) : <button type="button" className="btn btn-kecil" data-host-proyektor="" disabled={busy} onClick={onPairDisplay}>{t('acaraInv.hostProyektor')}</button>}
              <span className="ai-host-aksi-kanan">
                {tutup ? <button type="button" className="btn btn-kecil" data-host-buat="" disabled={busy} onClick={onCreate}>{t('acaraInv.hostBaru')}</button>
                  : <button type="button" className="btn btn-kecil btn-netral" data-host-tutup="" disabled={busy} onClick={(e) => buka('tutup', e.currentTarget)}>{t('acaraInv.hostTutup')}</button>}
                <button type="button" className="btn btn-kecil btn-bahaya" data-host-hapus="" disabled={busy} onClick={(e) => buka('hapus', e.currentTarget)}>{t('acaraInv.hostHapus')}</button>
              </span>
            </div>
          )}
          {busy ? <p className="ai-host-kecil" role="status">{t('acaraInv.hostSibuk')}</p> : null}
        </div>
      </div>
    </section>
  );
}
