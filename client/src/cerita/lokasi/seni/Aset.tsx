/**
 * Aset visual adegan "Periksa rambu" (dari ekspor Claude Design, lihat README.md di folder ini). Komponen tipis di atas berkas
 * SVG asli di svg/ (satu sumber kebenaran, bisa dimuat Phaser nanti). Tanpa logika permainan.
 */
import { useId } from 'react';
import './font.css';
import jalanSvg from './svg/jalan-empat-lajur.svg?raw';
import trukSvg from './svg/truk-biru.svg?raw';
import arsirSvg from './svg/arsir-lajur.svg?raw';
import arsirBiruSvg from './svg/arsir-lajur-biru.svg?raw';
import ikonPeriksaSvg from './svg/ikon-periksa.svg?raw';
import { unikkan } from './svg';

function Inline({ markup, kelas }: { markup: string; kelas?: string }) {
  const sufiks = useId().replace(/[^a-zA-Z0-9]/g, '');
  return <span className={`lk-svg${kelas ? ' ' + kelas : ''}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: unikkan(markup, sufiks) }} />;
}

/** Jalan empat lajur dengan pinggir hijau, pepohonan, dan tekstur halus (ruang 360 x 360). */
export function JalanEmpatLajur() { return <Inline markup={jalanSvg} kelas="lk-svg-jalan" />; }
/** Truk biru-krem tampak atas (viewBox 60 x 170). */
export function TrukBiru() { return <Inline markup={trukSvg} kelas="lk-svg-truk" />; }
/** Arsiran satu lajur: merah untuk rambu 1, biru (turunan) untuk rambu 2. Direntang mengikuti kotak lajur. */
export function ArsirLajur({ varian }: { varian: 'merah' | 'biru' }) { return <Inline markup={varian === 'merah' ? arsirSvg : arsirBiruSvg} kelas="lk-svg-arsir" />; }
/** Ikon kaca pembesar "periksa" (mengikuti warna teks). */
export function IkonPeriksa({ ukuran = 24 }: { ukuran?: number }) {
  return <span className="lk-svg lk-svg-ikon" style={{ width: ukuran, height: ukuran }}><Inline markup={ikonPeriksaSvg} /></span>;
}

// Ikon kecil inline dari ekspor (jalur gambar disalin apa adanya).
export function IkonTandai({ ukuran = 15 }: { ukuran?: number }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" />
    </svg>
  );
}
export function IkonCentang({ ukuran = 28 }: { ukuran?: number }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke="#215C40" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      <circle cx="12" cy="12" r="9.5" /><path d="M7.5 12.5l3 3 6-6.5" />
    </svg>
  );
}
export function IkonUlang({ ukuran = 28 }: { ukuran?: number }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke="#3D4A42" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" /><path d="M3.5 4v5h5" />
    </svg>
  );
}
/** Contoh kecil arsiran untuk catatan "ini tandamu sendiri" (dari ekspor). */
export function ContohArsir() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" style={{ flex: 'none' }}>
      <defs><pattern id={`rk-hatch-mini-${id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.4" height="6" fill="#D4553B" /></pattern></defs>
      <rect x="1.5" y="1.5" width="19" height="19" rx="4" fill="#5A6066" />
      <rect x="1.5" y="1.5" width="19" height="19" rx="4" fill={`url(#rk-hatch-mini-${id})`} />
      <rect x="1.5" y="1.5" width="19" height="19" rx="4" fill="none" stroke="#D4553B" strokeWidth="2" />
    </svg>
  );
}
