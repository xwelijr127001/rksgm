/**
 * Peta kota mini isometrik: perjalanan 10 misi RAKSA GAME.
 *
 * Kantor Raksa di pusat, 10 simpul lokasi mengelilinginya dan dihubungkan
 * jalur melengkung bernomor 1-10. Judul & lokasi diambil dari MISSIONS.
 * Status simpul dibaca tanpa warna: selalu ada nomor + ikon (centang / panah / titik).
 */
import type { ReactElement } from 'react';
import { MISSIONS } from '@shared/missions';

const C = {
  kuning: '#f6c445',
  kuningTua: '#d8a41f',
  hijau: '#176b45',
  hijauMuda: '#2e9a66',
  krem: '#fff9e9',
  tinta: '#17362a',
  putih: '#ffffff',
} as const;

const CX = 240;
/** Sudut simpul: busur 300 derajat dari kiri-bawah, memutar sampai kanan-bawah. */
const SUDUT = MISSIONS.map((_, i) => ((130 + i * (300 / 9)) * Math.PI) / 180);

/** Potong label jadi maksimal 2 baris pendek supaya tidak tabrakan di HP. */
function pecahLabel(teks: string, maks = 14): string[] {
  const baris: string[] = [];
  let kini = '';
  for (const kata of teks.split(' ')) {
    if (!kini) kini = kata;
    else if (`${kini} ${kata}`.length <= maks) kini = `${kini} ${kata}`;
    else {
      baris.push(kini);
      kini = kata;
    }
  }
  if (kini) baris.push(kini);
  if (baris.length <= 2) return baris;
  return [baris[0], `${baris[1]}...`];
}

function Centang({ x, y }: { x: number; y: number }): ReactElement {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="7.5" fill={C.putih} stroke={C.hijau} strokeWidth="1.6" />
      <path d="M-3.4 0 L-1 2.6 L3.4 -2.8" fill="none" stroke={C.hijau} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

function Panah({ x, y }: { x: number; y: number }): ReactElement {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="7.5" fill={C.tinta} />
      <path d="M-2.2 -3.4 L3.4 0 L-2.2 3.4 Z" fill={C.kuning} />
    </g>
  );
}

function Titik({ x, y }: { x: number; y: number }): ReactElement {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="7.5" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.4" />
      <circle r="2.6" fill="currentColor" fillOpacity="0.5" />
    </g>
  );
}

/** Kantor Raksa - pusat kota. */
function Pusat({ x, y, label }: { x: number; y: number; label: boolean }): ReactElement {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="30" rx="46" ry="12" fill={C.tinta} opacity="0.14" />
      <path d="M26 -14 L38 -21 L38 22 L26 28 Z" fill={C.hijau} />
      <path d="M26 -14 L38 -21 L38 22 L26 28 Z" fill="#000000" opacity="0.22" />
      <path d="M-26 -14 L-14 -21 L38 -21 L26 -14 Z" fill={C.hijau} />
      <path d="M-26 -14 L-14 -21 L38 -21 L26 -14 Z" fill="#ffffff" opacity="0.2" />
      <rect x="-26" y="-14" width="52" height="42" rx="4" fill={C.hijau} />
      <rect x="-20" y="-6" width="40" height="13" rx="3" fill={C.kuning} />
      <text x="0" y="4" textAnchor="middle" fontSize="8.5" fontWeight="800" fill={C.tinta}>
        RAKSA
      </text>
      <rect x="-18" y="13" width="11" height="11" rx="2" fill="#cfe6f5" />
      <rect x="-3" y="13" width="11" height="11" rx="2" fill="#cfe6f5" />
      <rect x="12" y="13" width="8" height="11" rx="2" fill="#cfe6f5" />
      <rect x="-1.6" y="-38" width="3.2" height="17" rx="1.6" fill="#5c6b62" />
      <path d="M1.6 -38 l18 5 -18 5 z" fill={C.kuning} />
      {label ? (
        <text x="0" y="50" textAnchor="middle" fontSize="11" fontWeight="800" fill="currentColor">
          Kantor Raksa
        </text>
      ) : null}
    </g>
  );
}

export function CityMap({
  currentRound,
  completed,
  compact = false,
  className,
}: {
  currentRound: number;
  completed: number[];
  compact?: boolean;
  className?: string;
}): ReactElement {
  const rx = compact ? 195 : 150;
  const ry = compact ? 78 : 96;
  const cy = compact ? 112 : 148;
  const tinggi = compact ? 216 : 300;
  const r = compact ? 15 : 16;

  const simpul = SUDUT.map((a) => ({ x: CX + rx * Math.cos(a), y: cy + ry * Math.sin(a) }));
  const selesai = new Set(completed);
  const total = MISSIONS.length;
  const misiKini = MISSIONS[currentRound];
  const ringkas = misiKini
    ? `Misi ${currentRound + 1} dari ${total} sedang berjalan: ${misiKini.title} di ${misiKini.location}.`
    : `Belum ada misi yang berjalan.`;
  const aria = `Peta perjalanan misi. ${selesai.size} dari ${total} misi selesai. ${ringkas}`;

  const jalur = simpul.slice(0, -1).map((a, i) => {
    const b = simpul[i + 1];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    // Titik kendali didorong ke luar dari pusat supaya jalur melengkung.
    const kx = mx + (mx - CX) * 0.18;
    const ky = my + (my - cy) * 0.18;
    const lewat = selesai.has(i) || i < currentRound;
    return (
      <path
        key={i}
        d={`M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${kx.toFixed(1)} ${ky.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`}
        fill="none"
        stroke={lewat ? C.hijauMuda : 'currentColor'}
        strokeOpacity={lewat ? 1 : 0.25}
        strokeWidth={lewat ? 4 : 3}
        strokeLinecap="round"
        strokeDasharray={lewat ? undefined : '7 7'}
      />
    );
  });

  return (
    <svg
      className={className}
      viewBox={`0 0 480 ${tinggi}`}
      role="img"
      aria-label={aria}
      style={{ width: '100%', height: 'auto', display: 'block', color: 'var(--tinta)' }}
    >
      {/* dataran kota */}
      <ellipse cx={CX} cy={cy} rx={rx + 42} ry={ry + 44} fill="currentColor" opacity="0.06" />
      <ellipse
        cx={CX}
        cy={cy}
        rx={rx + 30}
        ry={ry + 32}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.14"
        strokeWidth="2"
        strokeDasharray="4 8"
      />

      {jalur}
      <Pusat x={CX} y={cy} label={!compact} />

      {simpul.map((p, i) => {
        const misi = MISSIONS[i];
        const sudah = selesai.has(i);
        const kini = i === currentRound;
        const nomor = i + 1;
        const isi = sudah ? C.hijau : kini ? C.kuning : 'currentColor';
        const kiri = p.x < CX - 40;
        const kanan = p.x > CX + 40;
        const teks = compact ? [] : pecahLabel(misi.location);
        const anchor = kiri ? 'end' : kanan ? 'start' : 'middle';
        const tx = kiri ? p.x - r - 6 : kanan ? p.x + r + 6 : p.x;
        const atasLabel = !kiri && !kanan && p.y < cy;
        const ty = kiri || kanan ? p.y + 3 - (teks.length - 1) * 5 : atasLabel ? p.y - r - 12 - (teks.length - 1) * 11 : p.y + r + 16;

        return (
          <g key={misi.id}>
            <ellipse cx={p.x} cy={p.y + r - 1} rx={r} ry={r * 0.3} fill={C.tinta} opacity="0.12" />
            {kini ? (
              <>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 7}
                  fill="none"
                  stroke={C.kuning}
                  strokeWidth="3"
                  className="anim-denyut"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                />
                <circle cx={p.x} cy={p.y} r={r + 3.5} fill="none" stroke={C.kuningTua} strokeWidth="2" opacity="0.6" />
              </>
            ) : null}
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={isi}
              fillOpacity={sudah || kini ? 1 : 0.1}
              stroke={sudah ? C.hijau : kini ? C.kuningTua : 'currentColor'}
              strokeOpacity={sudah || kini ? 1 : 0.35}
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={p.y + (kini ? 6 : 5)}
              textAnchor="middle"
              fontSize={kini ? 17 : 13}
              fontWeight="900"
              fill={sudah ? C.krem : kini ? C.tinta : 'currentColor'}
              fillOpacity={sudah || kini ? 1 : 0.7}
            >
              {nomor}
            </text>
            {sudah ? <Centang x={p.x + r - 2} y={p.y - r + 1} /> : null}
            {kini ? <Panah x={p.x + r - 2} y={p.y - r + 1} /> : null}
            {!sudah && !kini ? <Titik x={p.x + r - 2} y={p.y - r + 1} /> : null}
            {teks.map((baris, b) => (
              <text
                key={baris}
                x={tx}
                y={ty + b * 11}
                textAnchor={anchor}
                fontSize="9.5"
                fontWeight={kini ? 800 : 700}
                fill="currentColor"
                fillOpacity={sudah || kini ? 0.9 : 0.6}
              >
                {baris}
              </text>
            ))}
          </g>
        );
      })}

      {/* keterangan status (tidak hanya warna) */}
      {compact ? null : (
        <g transform="translate(20 276)">
          <Centang x={8} y={0} />
          <text x="20" y="4" fontSize="10" fontWeight="700" fill="currentColor" fillOpacity="0.8">
            Selesai
          </text>
          <Panah x={82} y={0} />
          <text x="94" y="4" fontSize="10" fontWeight="700" fill="currentColor" fillOpacity="0.8">
            Berjalan
          </text>
          <Titik x={160} y={0} />
          <text x="172" y="4" fontSize="10" fontWeight="700" fill="currentColor" fillOpacity="0.8">
            Belum
          </text>
        </g>
      )}
    </svg>
  );
}
