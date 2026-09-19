/**
 * Avatar petugas Raksa: kartun membulat, tampak depan (dada ke atas),
 * di dalam lingkaran berlatar lembut. Semua variasi digambar SVG inline.
 */
import { useId } from 'react';
import type { ReactElement } from 'react';
import type { PlayerLook } from '@shared/types';
import { ACCESSORIES, HAIR_COLORS, SKIN_TONES, UNIFORM_COLORS } from '@shared/brand';
import { bahasaKini, t, useBahasa } from '../i18n';

type Mood = 'senang' | 'netral' | 'fokus';

const TINTA = 'var(--tinta)';
const KUNING = 'var(--kuning)';

/** Ambil warna dengan indeks apa pun (negatif / pecahan / NaN tetap aman). */
function pilih(daftar: readonly string[], i: number): string {
  const n = daftar.length;
  const bulat = Number.isFinite(i) ? Math.trunc(i) : 0;
  return daftar[((bulat % n) + n) % n];
}

/**
 * Keterangan avatar untuk pembaca layar, dalam bahasa aktif (kamus: pemain.avatarAria,
 * pemain.aksesori.<id>, pemain.suasana.<mood>). Aksesori yang belum ada di kamus memakai label
 * bawaannya. Huruf kecil hanya untuk bahasa Indonesia (teks aslinya memang begitu).
 */
function labelAvatar(aks: { id: string; label: string } | undefined, mood: Mood): string {
  const kunci = 'pemain.aksesori.' + (aks?.id ?? 'none');
  const teks = t(kunci);
  const aksesori = teks === kunci ? (aks?.label ?? '') : teks;
  return t('pemain.avatarAria', {
    aksesori: bahasaKini() === 'id' ? aksesori.toLowerCase() : aksesori,
    suasana: t('pemain.suasana.' + mood),
  });
}

function rambut(body: number, warna: string): ReactElement {
  // Busur mengikuti garis kepala (ellipse rx 11.4 / ry 11.8) agar tidak ada celah di puncak.
  const topi = 'M20.4 25.4a11.9 11.9 0 0 1 23.2 0c-1.8-3.6-5.6-5.1-11.6-5.1s-9.8 1.5-11.6 5.1Z';
  if (body === 1) {
    return (
      <>
        <path d={topi} fill={warna} />
        <path d="M31.6 15.2c4.6-1 8.2.6 10.4 4.4-3-1.2-5-.3-7.4 1.2-2.6 1.6-8 1-11.8 3 1.4-5 4.6-7.6 8.8-8.6Z" fill={warna} />
      </>
    );
  }
  if (body === 2) {
    return (
      <>
        <circle cx="45.4" cy="21.6" r="4.8" fill={warna} />
        <path d={topi} fill={warna} />
      </>
    );
  }
  if (body === 3) {
    return (
      <>
        <circle cx="23.4" cy="20.6" r="3.6" fill={warna} />
        <circle cx="32" cy="16.8" r="4.2" fill={warna} />
        <circle cx="40.6" cy="20.6" r="3.6" fill={warna} />
        <path d={topi} fill={warna} />
      </>
    );
  }
  return <path d={topi} fill={warna} />;
}

function wajah(mood: Mood): ReactElement {
  if (mood === 'senang') {
    return (
      <>
        <path
          d="M25.6 26.4q2 -2.6 4 0M34.4 26.4q2 -2.6 4 0"
          fill="none"
          stroke={TINTA}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
        <path
          d="M27.2 30.4q4.8 4.4 9.6 0"
          fill="none"
          stroke={TINTA}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
        <circle cx="23.4" cy="29.4" r="2.2" fill="rgba(196,69,47,0.22)" />
        <circle cx="40.6" cy="29.4" r="2.2" fill="rgba(196,69,47,0.22)" />
      </>
    );
  }
  if (mood === 'fokus') {
    return (
      <>
        <circle cx="27.6" cy="26.2" r="1.7" fill={TINTA} />
        <circle cx="36.4" cy="26.2" r="1.7" fill={TINTA} />
        <path
          d="M25 23.4l4.2 1M39 23.4l-4.2 1M29 31q3 1.8 6 0"
          fill="none"
          stroke={TINTA}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
      </>
    );
  }
  return (
    <>
      <circle cx="27.6" cy="26" r="1.8" fill={TINTA} />
      <circle cx="36.4" cy="26" r="1.8" fill={TINTA} />
      <path
        d="M27.8 30.2q4.2 3.6 8.4 0"
        fill="none"
        stroke={TINTA}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <circle cx="23.4" cy="29.4" r="2.2" fill="rgba(196,69,47,0.18)" />
      <circle cx="40.6" cy="29.4" r="2.2" fill="rgba(196,69,47,0.18)" />
    </>
  );
}

/** Jaket lapangan digambar di atas badan (sebelum kerah & lencana). */
function jaket(torso: string, clipTorso: string): ReactElement {
  return (
    <>
      <path d={torso} fill="var(--tinta-lembut)" />
      <g clipPath={`url(#${clipTorso})`}>
        <rect x="4" y="46" width="56" height="3.4" fill="rgba(255,249,233,0.92)" />
        <rect x="4" y="54" width="56" height="3.4" fill="rgba(255,249,233,0.92)" />
      </g>
      <path d="M32 41.6V64" fill="none" stroke="rgba(23,54,42,0.35)" strokeWidth={1.8} />
    </>
  );
}

/**
 * Aksesori kepala digambar paling akhir agar tidak tertutup rambut. Pinggiran helm/topi harus
 * berhenti di y <= 23: mata ada di y 24-28, dan wajah yang tertutup membuat avatar tampak tanpa ekspresi.
 */
function aksesoriKepala(jenis: PlayerLook['accessory']): ReactElement | null {
  if (jenis === 'helm') {
    return (
      <>
        <path d="M20 19a12 12 0 0 1 24 0Z" fill={KUNING} />
        <rect x="16.6" y="18" width="30.8" height="4.2" rx="2.1" fill={KUNING} />
        <path d="M32 7.2v10.8" fill="none" stroke="rgba(23,54,42,0.25)" strokeWidth={2} />
      </>
    );
  }
  if (jenis === 'headset') {
    return (
      <>
        <path d="M20.4 25.6a11.6 11.6 0 0 1 23.2 0" fill="none" stroke={TINTA} strokeWidth={3} />
        <rect x="17" y="23.6" width="6" height="8.6" rx="3" fill={TINTA} />
        <rect x="41" y="23.6" width="6" height="8.6" rx="3" fill={TINTA} />
        <path
          d="M22.4 32.2c-.8 3.2 1.2 5.4 3.8 6"
          fill="none"
          stroke={TINTA}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx="27" cy="38.6" r="1.9" fill={KUNING} />
      </>
    );
  }
  if (jenis === 'topi') {
    return (
      <>
        <path d="M21 19.2a11 11 0 0 1 22 0Z" fill="var(--hijau)" />
        <path d="M20.2 19.2h23.6a1.9 1.9 0 0 1 0 3.8H20.2a1.9 1.9 0 0 1 0-3.8Z" fill={KUNING} />
        <circle cx="32" cy="14.4" r="2.1" fill={KUNING} />
      </>
    );
  }
  return null;
}

export function Avatar({
  look,
  size = 64,
  mood = 'netral',
  className,
}: {
  look: PlayerLook;
  size?: number;
  mood?: Mood;
  className?: string;
}) {
  useBahasa();
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const clipBulat = `av-b-${uid}`;
  const clipTorso = `av-t-${uid}`;

  const seragam = pilih(UNIFORM_COLORS, look.color);
  const kulit = pilih(SKIN_TONES, look.skin);
  const warnaRambut = pilih(HAIR_COLORS, look.hair);
  const body = ((Math.trunc(Number.isFinite(look.body) ? look.body : 0) % 4) + 4) % 4;

  const lebar = 15 + body * 2.4;
  const bahu = Math.round(lebar * 5.5) / 10;
  const torso = `M${32 - lebar} 64C${32 - lebar} 49 ${
    32 - bahu
  } 41.6 32 41.6c${bahu} 0 ${lebar} 7.4 ${lebar} 22.4Z`;

  const aks = ACCESSORIES.find((a) => a.id === look.accessory);
  const label = labelAvatar(aks, mood);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={clipBulat}>
          <circle cx="32" cy="32" r="31" />
        </clipPath>
        <clipPath id={clipTorso}>
          <path d={torso} />
        </clipPath>
      </defs>

      <circle cx="32" cy="32" r="31" fill="var(--hijau-pucat)" />

      <g clipPath={`url(#${clipBulat})`}>
        {/* leher lalu badan */}
        <rect x="28.4" y="32" width="7.2" height="11" rx="3.4" fill={kulit} />
        <path d={torso} fill={seragam} />
        {look.accessory === 'jaket' ? jaket(torso, clipTorso) : null}
        {/* kerah */}
        <path d="M26.6 42.4 32 47.4l5.4-5a13 13 0 0 0-10.8 0Z" fill="rgba(255,255,255,0.9)" />
        {/* lencana identitas Raksa */}
        <rect x="22.2" y="48.6" width="9.4" height="7.2" rx="2.2" fill={KUNING} />
        <path
          d="M24.4 52.2l1.9 1.9 3.1-3.4"
          fill="none"
          stroke={TINTA}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* kepala */}
        <circle cx="21.6" cy="27" r="2.3" fill={kulit} />
        <circle cx="42.4" cy="27" r="2.3" fill={kulit} />
        <ellipse cx="32" cy="25.4" rx="11.4" ry="11.8" fill={kulit} />
        {rambut(body, warnaRambut)}
        {wajah(mood)}
        {aksesoriKepala(look.accessory)}
      </g>

      <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(23,54,42,0.16)" strokeWidth={2} />
    </svg>
  );
}
