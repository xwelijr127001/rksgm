/**
 * Raki - burung hantu pendamping RAKSA GAME.
 * Animasi hanya memakai kelas yang sudah ada di theme.css (.anim-melayang / .anim-denyut),
 * sehingga otomatis mati saat prefers-reduced-motion aktif.
 */
import type { ReactElement, ReactNode } from 'react';

type RakiMood = 'sapa' | 'bicara' | 'senang' | 'berpikir';

const COKELAT = 'var(--cokelat)';
const KREM = 'var(--krem)';
const KUNING = 'var(--kuning)';
const HIJAU = 'var(--hijau)';
const TINTA = 'var(--tinta)';
const PUTIH = 'var(--putih)';

function alis(mood: RakiMood): ReactElement {
  const d =
    mood === 'senang'
      ? 'M18.6 16.2q6 -3.4 11.6 -.6M34 15.6q5.6 -2.8 11.4 .6'
      : mood === 'berpikir'
        ? 'M18.6 18.6q6 -2 11.6 1.4M34 16q5.6 -3.4 11.4 -.4'
        : mood === 'sapa'
          ? 'M18.6 16.6q6 -3 11.6 0M34 16.6q5.6 -3 11.4 0'
          : 'M18.6 17.6q6 -2.4 11.6 0M34 17.6q5.6 -2.4 11.4 0';
  return <path d={d} fill="none" stroke={TINTA} strokeWidth={2.4} strokeLinecap="round" />;
}

function mata(mood: RakiMood): ReactElement {
  const naik = mood === 'berpikir' ? -1.6 : 0;
  return (
    <>
      <circle cx="24.4" cy="26.4" r="7.2" fill={PUTIH} />
      <circle cx="39.6" cy="26.4" r="7.2" fill={PUTIH} />
      <circle cx="24.4" cy={26.4 + naik} r="3.4" fill={TINTA} />
      <circle cx="39.6" cy={26.4 + naik} r="3.4" fill={TINTA} />
      <circle cx="25.8" cy={25.2 + naik} r="1.1" fill={PUTIH} />
      <circle cx="41" cy={25.2 + naik} r="1.1" fill={PUTIH} />
      {mood === 'senang' ? (
        <>
          <circle cx="15.6" cy="33.4" r="2.6" fill="rgba(196,69,47,0.24)" />
          <circle cx="48.4" cy="33.4" r="2.6" fill="rgba(196,69,47,0.24)" />
        </>
      ) : null}
    </>
  );
}

function paruh(mood: RakiMood): ReactElement {
  if (mood === 'bicara') {
    return (
      <>
        <path d="M32 31.4l3.6 3.4h-7.2Z" fill={KUNING} />
        <path d="M28.8 36.2h6.4l-3.2 3.4Z" fill="var(--kuning-tua)" />
      </>
    );
  }
  return <path d="M32 31.6l4 5.2h-8Z" fill={KUNING} />;
}

export function Raki({
  size = 96,
  mood = 'sapa',
  className,
}: {
  size?: number;
  mood?: RakiMood;
  className?: string;
}) {
  const anim = mood === 'senang' ? 'anim-denyut' : 'anim-melayang';
  const sayapKanan =
    mood === 'sapa'
      ? 'rotate(-52 50.4 34)'
      : mood === 'berpikir'
        ? 'rotate(14 50.4 34)'
        : 'rotate(8 50.4 34)';

  return (
    <svg
      className={[anim, className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      style={{ flex: '0 0 auto', overflow: 'visible' }}
    >
      {/* jambul */}
      <path d="M15.8 15.4 16.8 6.4l7.4 5.4Z" fill={COKELAT} />
      <path d="M48.2 15.4 47.2 6.4l-7.4 5.4Z" fill={COKELAT} />
      {/* kaki */}
      <path
        d="M26 55.6v3.4M23.6 59h4.8M38 55.6v3.4M35.6 59h4.8"
        fill="none"
        stroke={KUNING}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      {/* sayap */}
      <ellipse cx="13.6" cy="34" rx="4.8" ry="10.4" fill={COKELAT} transform="rotate(-8 13.6 34)" />
      <ellipse cx="50.4" cy="34" rx="4.8" ry="10.4" fill={COKELAT} transform={sayapKanan} />
      {/* badan */}
      <ellipse cx="32" cy="32.4" rx="19.6" ry="23" fill={COKELAT} />
      <ellipse cx="32" cy="38.4" rx="13" ry="15.6" fill={KREM} />
      {mata(mood)}
      {alis(mood)}
      {paruh(mood)}
      {/* syal hijau brand */}
      <path d="M19.4 46.8c7.6 4 17.6 4 25.2 0l-1.8 5.2c-6.6 3-14.8 3-21.6 0Z" fill={HIJAU} />
      <path d="M41.6 51.4l4.6 1.6-1.6 6-4.2-2Z" fill={HIJAU} />
      {mood === 'berpikir' ? (
        <>
          <rect x="44" y="36.4" width="16" height="19.6" rx="2.4" fill={PUTIH} stroke={TINTA} strokeWidth={1.6} />
          <rect x="49" y="34.2" width="6" height="3.6" rx="1.4" fill={KUNING} />
          <path
            d="M47.4 44h9M47.4 48h9M47.4 52h5.4"
            fill="none"
            stroke={TINTA}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </>
      ) : null}
    </svg>
  );
}

/* ponytail: ambang @container 330px disetel untuk size default (72px). Bila pemanggil
   memakai Raki jauh lebih besar, ekor balon bisa ikut pindah sedikit lebih awal/lambat. */
const CSS_BALON = `
.rb{display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;container-type:inline-size}
.rb-balon{position:relative;flex:1 1 240px;min-width:0;background:var(--putih);color:var(--tinta);
  border:2px solid var(--krem-tua);border-radius:var(--radius-l);padding:12px 14px;
  box-shadow:var(--shadow-s);overflow-wrap:anywhere;line-height:1.45}
.rb-judul{font-family:var(--font-judul);font-weight:800;font-size:15px;color:var(--hijau);
  margin-bottom:2px}
.rb-ekor{position:absolute;left:-9px;top:22px;width:14px;height:14px;background:var(--putih);
  border-left:2px solid var(--krem-tua);border-bottom:2px solid var(--krem-tua);
  border-bottom-left-radius:4px;transform:rotate(45deg)}
@container (max-width:330px){.rb-ekor{left:22px;top:-9px;transform:rotate(135deg)}}
`;

export function RakiBubble({
  teks,
  mood = 'bicara',
  size = 72,
  judul,
}: {
  teks: ReactNode;
  mood?: RakiMood;
  size?: number;
  judul?: string;
}) {
  return (
    <div className="rb" role="status">
      <style>{CSS_BALON}</style>
      <Raki size={size} mood={mood} />
      <div className="rb-balon">
        <span className="rb-ekor" aria-hidden="true" />
        {judul ? <div className="rb-judul">{judul}</div> : null}
        <div>{teks}</div>
      </div>
    </div>
  );
}
