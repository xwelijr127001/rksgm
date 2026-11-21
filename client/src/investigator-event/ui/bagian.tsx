/**
 * T-105 (Designer): kepingan kecil bersama papan acara Investigator (tampilan saja).
 *   StempelPapan   tiga slot stempel kasus (seri = 3 kasus): terisi urut kasus 1 (merah), 2 (nila), 3 (kuning tua), sisanya kosong.
 *                  Seni yang sudah ada: seni/investigasi/ikon.png (sel 7, 14, kosong 8) dan seni/investigasi/panel/ikon.png (sel 5).
 *                  Ukuran mengikuti font induk (1 slot = 1 em x `skala`), jadi pas di proyektor (em kanvas) maupun di host / HP.
 *   KodeQr         QR sebagai SVG tajam (modul = kotak piksel, zona tenang 2 modul), mengisi kotak induknya: bisa diskalakan
 *                  di kanvas proyektor. Dihitung langsung (pustaka `qrcode`, tingkat koreksi M); tanpa jaringan.
 *   LencanaPapanAcara  lencana kecil saat bermain: "Papan acara · <alias>" (+ peringkat, + status kirim / terputus).
 */
import { useMemo, type CSSProperties } from 'react';
import QRCode from 'qrcode';
import { SENIOR_STAMPS } from '@shared/investigator/rubric';
import { t, useBahasa } from '../../i18n';
import ikonUrl from '../../cerita/seni/investigasi/ikon.png';
import ikonPanelUrl from '../../cerita/seni/investigasi/panel/ikon.png';
import './acara-inv.css';

/** [url, sel, jumlah sel atlas] stempel kasus 1, 2, 3; slot kosong = ikon.png sel 8. */
const SEL_STEMPEL: readonly (readonly [string, number, number])[] = [[ikonUrl, 7, 23], [ikonUrl, 14, 23], [ikonPanelUrl, 5, 8]];
const KOSONG: readonly [string, number, number] = [ikonUrl, 8, 23];

export function StempelPapan({ jumlah, skala = 1 }: { jumlah: number; skala?: number }) {
  return (
    <span className="ai-stempel" aria-hidden="true" style={{ '--ai-s': skala } as CSSProperties}>
      {Array.from({ length: SENIOR_STAMPS }, (_, i) => {
        const [url, sel, n] = i < jumlah ? SEL_STEMPEL[i] ?? SEL_STEMPEL[0]! : KOSONG;
        return <i key={i} data-isi={i < jumlah ? '' : undefined} style={{ backgroundImage: `url(${url})`, backgroundSize: `${n * 100}% 100%`, backgroundPosition: `${n > 1 ? (sel / (n - 1)) * 100 : 0}% 0` }} />;
      })}
    </span>
  );
}

export function KodeQr({ value, label }: { value: string; label: string }) {
  const qr = useMemo(() => {
    try {
      const m = QRCode.create(value, { errorCorrectionLevel: 'M' }).modules;
      let d = '';
      for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (m.data[y * m.size + x]) d += `M${x + 2} ${y + 2}h1v1h-1z`;
      return { n: m.size + 4, d };
    } catch { return null; }
  }, [value]);
  if (!qr) return <span className="ai-qr-gagal">{value}</span>;
  return (
    <svg className="ai-qr-gambar" viewBox={`0 0 ${qr.n} ${qr.n}`} shapeRendering="crispEdges" role="img" aria-label={label}>
      <rect width={qr.n} height={qr.n} fill="#ffffff" /><path d={qr.d} fill="#212121" />
    </svg>
  );
}

export interface LencanaPapanAcaraProps {
  alias: string;
  /** Peringkat sendiri di papan (null / tanpa nilai = belum punya skor). */
  rank?: number | null;
  /** 'tunggu' = keputusan sedang dikirim; 'putus' = jaringan hilang (keputusan berperingkat tertahan). */
  status?: 'tersambung' | 'tunggu' | 'putus';
}

export function LencanaPapanAcara({ alias, rank, status = 'tersambung' }: LencanaPapanAcaraProps) {
  useBahasa();
  return (
    <span className="ai-lari" data-lencana-papan={status} role="status">
      <i className="ai-lari-titik" aria-hidden="true" />
      <span className="ai-lari-teks">{t('acaraInv.lencanaLari', { alias })}</span>
      {status === 'tersambung' ? (rank ? <b>{t('acaraInv.lariPeringkat', { n: rank })}</b> : null) : <b>{t(status === 'tunggu' ? 'acaraInv.statusTunggu' : 'acaraInv.statusPutus')}</b>}
    </span>
  );
}
