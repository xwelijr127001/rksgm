/**
 * Ikon SVG inline RAKSA GAME.
 * Semua ikon: viewBox "0 0 24 24", stroke = currentColor, fill aksen = token brand.
 * Bentuk sengaja sederhana agar tetap terbaca pada ukuran 20px.
 */
import type { ReactElement } from 'react';
import type { IconKey } from '@shared/types';

const KUNING = 'var(--kuning)';
const HIJAU = 'var(--hijau-muda)';
const MERAH = 'var(--merah)';
const BIRU = 'var(--biru)';
const KREM = 'var(--krem-tua)';
const COKELAT = 'var(--cokelat)';
const PUTIH = 'var(--putih)';
const TINTA = 'var(--tinta)';

const ICONS: Record<IconKey, ReactElement> = {
  kamera: (
    <>
      <path
        d="M3.6 8.4h3l1.5-2.1h5.8l1.5 2.1h3a1.6 1.6 0 0 1 1.6 1.6v7a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 17V10a1.6 1.6 0 0 1 1.6-1.6Z"
        fill={KREM}
      />
      <circle cx="12" cy="13.4" r="3.4" fill={KUNING} />
    </>
  ),
  mobil: (
    <>
      <path d="M4 14.6 5.7 9.9a2 2 0 0 1 1.9-1.3h8.8a2 2 0 0 1 1.9 1.3l1.7 4.7Z" fill={KUNING} />
      <path d="M2.6 14.6h18.8v2.6a1 1 0 0 1-1 1H3.6a1 1 0 0 1-1-1Z" fill={KREM} />
      <circle cx="7" cy="18.6" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="17" cy="18.6" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),
  plat: (
    <>
      <rect x="2.6" y="7" width="18.8" height="10" rx="2.2" fill={KUNING} />
      <path d="M6 11.4h4M6 14h9M13.4 11.4h4.6" />
    </>
  ),
  makanan: (
    <>
      <path d="M3.4 11.6h17.2A8.6 8.6 0 0 1 12 19.2a8.6 8.6 0 0 1-8.6-7.6Z" fill={KUNING} />
      <path d="M8.2 9c0-1.3 1-1.7 1-2.8M12 8.6c0-1.5 1-1.9 1-3.1M15.8 9c0-1.3 1-1.7 1-2.8" />
    </>
  ),
  selfie: (
    <>
      <rect x="3.6" y="3.2" width="10.4" height="17.4" rx="2.4" fill={KREM} />
      <circle cx="8.8" cy="9" r="2.3" fill={KUNING} />
      <path d="M5.6 15.8c.7-2 1.8-2.9 3.2-2.9s2.5.9 3.2 2.9" />
      <path d="M14 7.2l3 1.6a2 2 0 0 1 1 1.8v3" />
    </>
  ),
  kucing: (
    <>
      <path d="M6.6 9.4 5.9 4.8l3.9 2.3Z" fill={KREM} />
      <path d="M17.4 9.4l.7-4.6-3.9 2.3Z" fill={KREM} />
      <circle cx="12" cy="13.6" r="6.1" fill={KUNING} />
      <circle cx="10" cy="12.8" r="0.95" fill={TINTA} stroke="none" />
      <circle cx="14" cy="12.8" r="0.95" fill={TINTA} stroke="none" />
      <path d="M12 15.4c-.7.9-2.1.9-2.8 0M12 15.4c.7.9 2.1.9 2.8 0" />
      <path d="M4.6 13.4h2.6M16.8 13.4h2.6" />
    </>
  ),
  dokumen: (
    <>
      <path
        d="M6 2.8h7.4L19 8.4V20a1.4 1.4 0 0 1-1.4 1.4H6A1.4 1.4 0 0 1 4.6 20V4.2A1.4 1.4 0 0 1 6 2.8Z"
        fill={PUTIH}
      />
      <path d="M13.3 3v5.4H19" />
      <path d="M8 12.6h7.4M8 15.6h7.4M8 18.4h4.4" />
    </>
  ),
  foto: (
    <>
      <rect x="2.8" y="4.6" width="18.4" height="14.8" rx="2.4" fill={PUTIH} />
      <circle cx="8.4" cy="9.6" r="1.8" fill={KUNING} />
      <path d="M3.4 17.2 8.6 12l3.4 3 2.9-2.7 5.3 4.9Z" fill={HIJAU} />
    </>
  ),
  daftar: (
    <>
      <rect x="3.2" y="3.6" width="17.6" height="16.8" rx="2.4" fill={PUTIH} />
      <path d="M6.6 8.6l1.5 1.5 2.5-2.7" stroke={HIJAU} />
      <path d="M6.6 14.6l1.5 1.5 2.5-2.7" stroke={HIJAU} />
      <path d="M13 9h4.8M13 15h4.8" />
    </>
  ),
  kalkulator: (
    <>
      <rect x="4.6" y="2.8" width="14.8" height="18.4" rx="2.4" fill={PUTIH} />
      <rect x="7" y="5.4" width="10" height="3.6" rx="1.2" fill={KUNING} />
      <circle cx="8.6" cy="12.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="12.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.6" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  brosur: (
    <>
      <path d="M3 6.4 8.5 4.4l7 2 5.5-2v13.2l-5.5 2-7-2-5.5 2Z" fill={KUNING} />
      <path d="M8.5 4.4v15.2M15.5 6.4v15.2" />
    </>
  ),
  struk: (
    <>
      <path d="M5 3.4h14v14.2l-2.3 1.4-2.3-1.4-2.4 1.4-2.3-1.4L7.3 19 5 17.6Z" fill={PUTIH} />
      <path d="M8 7.4h8M8 10.4h8M8 13.4h5" />
    </>
  ),
  excavator: (
    <>
      <rect x="2.6" y="16.6" width="11" height="3.8" rx="1.9" fill={KREM} />
      <rect x="3.6" y="10.6" width="7.4" height="6" rx="1.6" fill={KUNING} />
      <path d="M11 11.6 16 7.4" />
      <path d="M16.2 7 21 11.4l-3.6 3.2-2.4-2.6Z" fill={COKELAT} />
      <circle cx="5.4" cy="18.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10.8" cy="18.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  operator: (
    <>
      <circle cx="12" cy="11.6" r="3.6" fill={KREM} />
      <path d="M5.2 8.8a6.8 6.8 0 0 1 13.6 0Z" fill={KUNING} />
      <path d="M3.6 8.9h16.8" />
      <path d="M4.8 20.8c1-3.2 3.6-4.9 7.2-4.9s6.2 1.7 7.2 4.9Z" fill={HIJAU} />
    </>
  ),
  lokasi: (
    <>
      <path d="M12 21.2s7-6.2 7-11.2a7 7 0 1 0-14 0c0 5 7 11.2 7 11.2Z" fill={MERAH} />
      <circle cx="12" cy="9.8" r="2.5" fill={PUTIH} />
    </>
  ),
  rusak: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.6" fill={KREM} />
      <path d="M9.6 4.6 8 10.2l4-.9-2.6 5.6 4.6-1-2 5.5" stroke={MERAH} />
    </>
  ),
  spanduk: (
    <>
      <path d="M2.6 4.4h18.8" />
      <path
        d="M5.6 4.4h12.8v11.4l-2.1-1.6-2.1 1.6-2.2-1.6-2.1 1.6-2.2-1.6-2.1 1.6Z"
        fill={KUNING}
      />
      <path d="M8.4 8.4h7.2M8.4 11.4h4.6" />
    </>
  ),
  warung: (
    <>
      <path d="M3.6 9.6h16.8V20a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1Z" fill={KREM} />
      <path d="M2.6 9.6 4.7 4.6h14.6l2.1 5Z" fill={KUNING} />
      <path d="M9.2 21v-5.6h5.6V21" />
    </>
  ),
  awan: (
    <>
      <path
        d="M7.2 18.4h9.6a3.9 3.9 0 0 0 .5-7.7A5.5 5.5 0 0 0 6.7 9.9a3.9 3.9 0 0 0 .5 8.5Z"
        fill={PUTIH}
      />
    </>
  ),
  polis: (
    <>
      <path
        d="M5.6 2.8h8.2L18.4 7.6V20a1.4 1.4 0 0 1-1.4 1.4H5.6A1.4 1.4 0 0 1 4.2 20V4.2A1.4 1.4 0 0 1 5.6 2.8Z"
        fill={PUTIH}
      />
      <path d="M13.6 3v4.7h4.8" />
      <path d="M11.4 10.4l3.7 1.3v3c0 2.3-1.6 3.8-3.7 4.5-2.1-.7-3.7-2.2-3.7-4.5v-3Z" fill={HIJAU} />
    </>
  ),
  peti: (
    <>
      <rect x="3.4" y="6" width="17.2" height="12" rx="1.8" fill={KUNING} />
      <path d="M3.4 9.8h17.2M3.4 14.2h17.2M9 6v12M15 6v12" />
    </>
  ),
  kapal: (
    <>
      <rect x="7" y="9.6" width="4.6" height="5" rx="1" fill={KUNING} />
      <rect x="12.2" y="6.8" width="4.6" height="7.8" rx="1" fill={KREM} />
      <path d="M3 14.6h18l-2.2 4.6a2 2 0 0 1-1.8 1.1H7a2 2 0 0 1-1.8-1.1Z" fill={BIRU} />
    </>
  ),
  gudang: (
    <>
      <path d="M3 10.6 12 4.6l9 6v9.8H3Z" fill={KREM} />
      <path d="M8.8 20.4v-6h6.4v6Z" fill={KUNING} />
    </>
  ),
  banjir: (
    <>
      <path d="M4.2 9.6 12 4.2l7.8 5.4v5.2H4.2Z" fill={KREM} />
      <path d="M9.4 14.8v-3.6h5.2v3.6" />
      <path
        d="M2.2 16.8c1.7-1.3 3.4-1.3 5 0s3.3 1.3 5 0 3.3-1.3 4.9 0M2.2 20.2c1.7-1.3 3.4-1.3 5 0s3.3 1.3 5 0 3.3-1.3 4.9 0"
        stroke={BIRU}
      />
    </>
  ),
  forklift: (
    <>
      <rect x="2.6" y="10.4" width="8.4" height="6.2" rx="1.6" fill={KUNING} />
      <path d="M11 5.2v11.4M11 14.6h6.4" />
      <rect x="15.8" y="7.6" width="5.2" height="6.4" rx="1" fill={COKELAT} />
      <circle cx="5.4" cy="19" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="10.4" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  obeng: (
    <>
      <path d="M15.2 2.8 21.2 8.8l-2.8 2.8-6-6Z" fill={MERAH} />
      <path d="M12.8 7.8 5.2 15.4l-1.6 4.4 4.4-1.6 7.6-7.6Z" fill={KREM} />
    </>
  ),
  cek: (
    <>
      <circle cx="12" cy="12" r="9" fill={HIJAU} />
      <path d="M7.8 12.4 11 15.6l5.4-6.2" stroke={PUTIH} strokeWidth={2.4} />
    </>
  ),
  tanya: (
    <>
      <circle cx="12" cy="12" r="9" fill={KUNING} />
      <path d="M9.4 9.6a2.7 2.7 0 0 1 5.3.6c0 1.9-2.6 2.1-2.6 4" stroke={TINTA} />
      <circle cx="12" cy="17.2" r="1.1" fill={TINTA} stroke="none" />
    </>
  ),
  silang: (
    <>
      <circle cx="12" cy="12" r="9" fill={MERAH} />
      <path d="M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8" stroke={PUTIH} strokeWidth={2.4} />
    </>
  ),
  jam: (
    <>
      <circle cx="12" cy="12.8" r="8.2" fill={PUTIH} />
      <path d="M12 8.4v4.6l3.2 2" />
      <path d="M9.6 2.8h4.8" />
    </>
  ),
  uang: (
    <>
      <rect x="2.4" y="6" width="19.2" height="12" rx="2.4" fill={HIJAU} />
      <circle cx="12" cy="12" r="3.2" fill={KUNING} />
      <path d="M5.8 9.6v4.8M18.2 9.6v4.8" stroke={PUTIH} />
    </>
  ),
  medali: (
    <>
      <path d="M8.2 2.8 12 9.4l3.8-6.6" stroke={MERAH} />
      <circle cx="12" cy="15" r="6.2" fill={KUNING} />
      <path
        d="M12 11.6l1.2 2.4 2.6.4-1.9 1.9.4 2.6-2.3-1.3-2.3 1.3.4-2.6-1.9-1.9 2.6-.4Z"
        fill={PUTIH}
        stroke="none"
      />
    </>
  ),
  bintang: (
    <>
      <path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1.1 6.1L12 17.2l-5.5 2.9 1.1-6.1L3.2 9.7l6.1-.9Z" fill={KUNING} />
    </>
  ),
  kilat: (
    <>
      <path d="M13.8 2.4 5.8 13.6h4.9l-1.3 8 8.8-11.8h-5.1Z" fill={KUNING} />
    </>
  ),
};

/** Ikon cadangan bila nama tidak dikenal (mis. data misi lama). */
const FALLBACK: ReactElement = (
  <>
    <circle cx="12" cy="12" r="9" fill={KREM} />
    <path d="M9.6 9.8a2.5 2.5 0 0 1 4.9.6c0 1.8-2.4 2-2.4 3.7" />
    <circle cx="12" cy="17" r="1.05" fill="currentColor" stroke="none" />
  </>
);

export function Icon({
  name,
  size = 24,
  className,
}: {
  name: IconKey;
  size?: number;
  className?: string;
}) {
  const isi = ICONS[name] ?? FALLBACK;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {isi}
    </svg>
  );
}
