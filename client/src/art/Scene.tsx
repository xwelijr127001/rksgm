/**
 * Adegan SVG 2.5D isometrik untuk 10 misi RAKSA GAME.
 *
 * Semua ilustrasi digambar inline (tanpa aset / CDN eksternal).
 * `children` ditumpuk persis di atas SVG dengan kotak yang sama, jadi bisa
 * diposisikan memakai koordinat persen (option.hotspot.x / y di shared/missions.ts).
 */
import type { ReactElement, ReactNode } from 'react';
import type { SceneKey } from '@shared/types';

/** Palet lokal (nilai sama dengan token theme.css; atribut SVG butuh warna literal). */
const C = {
  kuning: '#f6c445',
  kuningTua: '#d8a41f',
  hijau: '#176b45',
  hijauMuda: '#2e9a66',
  krem: '#fff9e9',
  kremTua: '#f3e7c9',
  tinta: '#17362a',
  tintaLembut: '#47604f',
  cokelat: '#5b4636',
  merah: '#c4452f',
  biru: '#2f6fb0',
  putih: '#ffffff',
  kaca: '#cfe6f5',
  aspal: '#6f7b74',
  aspalTerang: '#808d85',
  tanah: '#c2a982',
  tanahTua: '#8a7151',
  beton: '#d9d2c4',
  betonTua: '#b8b0a0',
  besi: '#5c6b62',
  besiTua: '#3b4a42',
  air: '#5fa9d8',
} as const;

/* ========================================================== helper gambar */

function Langit({ id, atas, bawah }: { id: string; atas: string; bawah: string }): ReactElement {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={atas} />
          <stop offset="1" stopColor={bawah} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="260" fill={`url(#${id})`} />
    </>
  );
}

function Bayangan({
  cx,
  cy,
  rx,
  ry,
  opacity = 0.16,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
  opacity?: number;
}): ReactElement {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry ?? rx * 0.3} fill={C.tinta} opacity={opacity} />;
}

function Awan({
  x,
  y,
  s = 1,
  melayang = false,
}: {
  x: number;
  y: number;
  s?: number;
  melayang?: boolean;
}): ReactElement {
  const isi = (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity="0.92">
      <ellipse cx="0" cy="0" rx="26" ry="11" fill={C.putih} />
      <circle cx="-13" cy="-4" r="10" fill={C.putih} />
      <circle cx="3" cy="-9" r="13" fill={C.putih} />
      <circle cx="18" cy="-3" r="9" fill={C.putih} />
    </g>
  );
  return melayang ? <g className="anim-melayang">{isi}</g> : isi;
}

/** Gedung 2.5D: muka depan + sisi kanan + atap (gelap/terang dari overlay). */
function Gedung({
  x,
  y,
  w,
  h,
  badan,
  d = 12,
  jendela = true,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  badan: string;
  d?: number;
  jendela?: boolean;
}): ReactElement {
  const atas = y - h;
  const dSisi = `M${x + w} ${atas} L${x + w + d} ${atas - d * 0.6} L${x + w + d} ${y - d * 0.6} L${x + w} ${y} Z`;
  const dAtap = `M${x} ${atas} L${x + d} ${atas - d * 0.6} L${x + w + d} ${atas - d * 0.6} L${x + w} ${atas} Z`;
  const kolom = Math.max(1, Math.floor((w - 8) / 18));
  const baris = Math.max(1, Math.floor((h - 12) / 18));
  const kaca: ReactElement[] = [];
  if (jendela) {
    for (let r = 0; r < baris; r += 1) {
      for (let k = 0; k < kolom; k += 1) {
        kaca.push(
          <rect
            key={`${r}-${k}`}
            x={x + 7 + k * 18}
            y={atas + 9 + r * 18}
            width="10"
            height="12"
            rx="2"
            fill={C.kaca}
            opacity="0.9"
          />,
        );
      }
    }
  }
  return (
    <g>
      <path d={dSisi} fill={badan} />
      <path d={dSisi} fill="#000000" opacity="0.2" />
      <path d={dAtap} fill={badan} />
      <path d={dAtap} fill="#ffffff" opacity="0.22" />
      <rect x={x} y={atas} width={w} height={h} rx="3" fill={badan} />
      {kaca}
    </g>
  );
}

function Pohon({ x, y, s = 1 }: { x: number; y: number; s?: number }): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="15" ry="4.5" fill={C.tinta} opacity="0.15" />
      <rect x="-3.5" y="-24" width="7" height="24" rx="3.5" fill={C.cokelat} />
      <circle cx="-9" cy="-27" r="10" fill={C.hijauMuda} />
      <circle cx="9" cy="-25" r="9" fill={C.hijau} />
      <circle cx="0" cy="-36" r="11.5" fill="#3aad76" />
    </g>
  );
}

function Lampu({ x, y, s = 1 }: { x: number; y: number; s?: number }): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="9" ry="3" fill={C.tinta} opacity="0.16" />
      <rect x="-2.5" y="-62" width="5" height="62" rx="2.5" fill={C.besi} />
      <path d="M0 -62 q0 -10 14 -10" fill="none" stroke={C.besi} strokeWidth="5" strokeLinecap="round" />
      <rect x="8" y="-74" width="14" height="7" rx="3.5" fill={C.kuning} />
      <ellipse cx="15" cy="-63" rx="12" ry="7" fill={C.kuning} opacity="0.28" />
    </g>
  );
}

function Orang({
  x,
  y,
  s = 1,
  seragam = C.biru,
  helm = false,
  papan = false,
}: {
  x: number;
  y: number;
  s?: number;
  seragam?: string;
  helm?: boolean;
  papan?: boolean;
}): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="11" ry="3.2" fill={C.tinta} opacity="0.16" />
      <rect x="-6.5" y="-14" width="5" height="14" rx="2.4" fill="#3c4a52" />
      <rect x="1.5" y="-14" width="5" height="14" rx="2.4" fill="#3c4a52" />
      <rect x="-8.5" y="-33" width="17" height="21" rx="7" fill={seragam} />
      <rect x="-12.5" y="-31" width="5" height="15" rx="2.5" fill={seragam} />
      <rect x="7.5" y="-31" width="5" height="15" rx="2.5" fill={seragam} />
      <circle cx="0" cy="-39" r="7.5" fill="#e8b98e" />
      <path d="M-7.4 -40.6 a7.4 7.4 0 0 1 14.8 0 z" fill="#3a2b20" />
      {helm ? <path d="M-9.4 -41.6 a9.4 9.4 0 0 1 18.8 0 l1.6 2.2 h-22 z" fill={C.kuning} /> : null}
      {papan ? (
        <g>
          <rect x="8" y="-28" width="13" height="16" rx="2" fill={C.putih} stroke={C.tinta} strokeWidth="1.2" />
          <rect x="11" y="-30" width="7" height="3" rx="1.5" fill={C.besi} />
          <path d="M10.5 -23 h8 M10.5 -20 h8 M10.5 -17 h5" stroke={C.tintaLembut} strokeWidth="1.1" />
        </g>
      ) : null}
    </g>
  );
}

/** Mobil kartun; `penyok` menandai kerusakan agar terlihat jelas. */
function Mobil({
  x,
  y,
  s = 1,
  warna,
  penyok = 'none',
  balik = false,
}: {
  x: number;
  y: number;
  s?: number;
  warna: string;
  penyok?: 'none' | 'samping' | 'depan-kiri';
  balik?: boolean;
}): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${balik ? -s : s} ${s})`}>
      <ellipse cx="39" cy="0" rx="36" ry="5" fill={C.tinta} opacity="0.16" />
      <path
        d="M5 -5 L5 -12 Q5 -16 11 -18 L20 -18 L26 -28 Q28 -30 32 -30 L55 -30 Q59 -30 60 -27 L62 -18 Q71 -17 73 -12 L73 -5 Z"
        fill={warna}
      />
      <path d="M5 -8 L73 -8 L73 -5 L5 -5 Z" fill="#000000" opacity="0.16" />
      <path d="M21 -19 L27 -28 L38 -28 L38 -19 Z" fill={C.kaca} />
      <path d="M42 -28 L54 -28 L56 -19 L42 -19 Z" fill={C.kaca} />
      <path d="M40 -19 L40 -6" stroke="#000000" strokeOpacity="0.2" strokeWidth="1.3" />
      <rect x="5" y="-15" width="6" height="4.5" rx="2" fill="#ffe9a8" />
      <rect x="68" y="-15" width="5" height="4" rx="2" fill={C.merah} />
      <circle cx="18" cy="-5" r="6.5" fill="#2f3a34" />
      <circle cx="18" cy="-5" r="2.6" fill="#d8ded9" />
      <circle cx="58" cy="-5" r="6.5" fill="#2f3a34" />
      <circle cx="58" cy="-5" r="2.6" fill="#d8ded9" />
      {penyok === 'samping' ? (
        <g>
          <ellipse cx="46" cy="-13" rx="8" ry="5" fill="#000000" opacity="0.2" />
          <path
            d="M41 -16 l5 4 -4 3 m5 -9 l4 4 -3 3"
            fill="none"
            stroke={C.tinta}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M46 -22 l0 -4 M53 -19 l4 -2 M38 -19 l-4 -2" stroke={C.merah} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ) : null}
      {penyok === 'depan-kiri' ? (
        <g>
          <path d="M5 -5 L5 -12 Q5 -16 11 -18 L20 -18 L14 -13 L21 -10 L12 -8 L15 -5 Z" fill="#000000" opacity="0.24" />
          <path d="M8 -16 l6 4 -5 3 m7 -9 l4 5" fill="none" stroke={C.tinta} strokeWidth="1.5" strokeLinecap="round" />
          <rect x="5" y="-15" width="6" height="4.5" rx="2" fill="#8d8378" />
          <path d="M11 -22 l-2 -5 M18 -21 l1 -5 M3 -19 l-4 -3" stroke={C.merah} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
}

function Peti({
  x,
  y,
  w = 32,
  h = 26,
  rusak = false,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  rusak?: boolean;
}): ReactElement {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y={-h} width={w} height={h} rx="2" fill="#c89b62" />
      <rect x="0" y={-h} width={w} height="4" fill="#a87f4b" />
      <path d={`M0 ${-h} L${w} 0 M${w} ${-h} L0 0`} stroke="#a87f4b" strokeWidth="3" />
      <rect x="0" y={-h} width={w} height={h} rx="2" fill="none" stroke="#8d6737" strokeWidth="1.6" />
      {rusak ? (
        <g>
          <path
            d={`M${w * 0.1} ${-h - 1} L${w * 0.72} ${-h - 7} L${w * 0.95} ${-h - 2}`}
            fill="none"
            stroke="#8d6737"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            d={`M${w - 6} ${-h + 4} l-5 6 4 4 -6 3`}
            fill="none"
            stroke={C.tinta}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d={`M${w * 0.25} ${-h + 6} l6 7 -5 5`}
            fill="none"
            stroke={C.tinta}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d={`M${w * 0.5} ${-h - 9} l0 -5 M${w * 0.78} ${-h - 7} l4 -4`}
            stroke={C.merah}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      ) : null}
    </g>
  );
}

function Forklift({
  x,
  y,
  s = 1,
  penyok = false,
  balik = false,
}: {
  x: number;
  y: number;
  s?: number;
  penyok?: boolean;
  balik?: boolean;
}): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${balik ? -s : s} ${s})`}>
      <ellipse cx="34" cy="0" rx="32" ry="5" fill={C.tinta} opacity="0.16" />
      <rect x="6" y="-30" width="42" height="24" rx="5" fill={C.kuning} />
      <rect x="6" y="-13" width="42" height="7" rx="3" fill={C.kuningTua} />
      <rect x="11" y="-44" width="6" height="15" rx="3" fill={C.besi} />
      <path d="M11 -44 h30" stroke={C.besi} strokeWidth="5" strokeLinecap="round" />
      <rect x="36" y="-44" width="6" height="15" rx="3" fill={C.besi} />
      <rect x="20" y="-34" width="14" height="8" rx="3" fill="#3c4a52" />
      <rect x="52" y="-46" width="5" height="40" rx="2.5" fill={C.besiTua} />
      <rect x="58" y="-46" width="5" height="40" rx="2.5" fill={C.besiTua} />
      <rect x="52" y="-10" width="26" height="5" rx="2" fill={C.besiTua} />
      <circle cx="18" cy="-6" r="7" fill="#2f3a34" />
      <circle cx="18" cy="-6" r="2.8" fill="#d8ded9" />
      <circle cx="44" cy="-6" r="5.5" fill="#2f3a34" />
      <circle cx="44" cy="-6" r="2.2" fill="#d8ded9" />
      {penyok ? (
        <g>
          <ellipse cx="27" cy="-19" rx="10" ry="6" fill="#000000" opacity="0.24" />
          <path
            d="M21 -23 l6 5 -5 4 m7 -10 l5 5 -4 4"
            fill="none"
            stroke={C.tinta}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d="M27 -28 l0 -5 M37 -24 l5 -3 M17 -25 l-5 -3" stroke={C.merah} strokeWidth="1.7" strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
}

/**
 * Excavator dalam koordinat lokal (lebar ~285, dasar roda pada y = 66).
 * Pemanggil membungkus dengan <g transform> supaya bisa dimiringkan / diperkecil.
 */
function Excavator({ rusak = false }: { rusak?: boolean }): ReactElement {
  const rol = [16, 38, 60, 82, 100];
  const grouser = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <g>
      <rect x="0" y="46" width="110" height="20" rx="10" fill={C.besiTua} />
      {grouser.map((i) => (
        <rect key={i} x={7 + i * 13} y="46" width="5" height="20" fill="#25302b" />
      ))}
      {rol.map((cx) => (
        <circle key={cx} cx={cx} cy="56" r="5.5" fill="#6d7d74" />
      ))}
      <rect x="14" y="39" width="84" height="9" rx="4.5" fill="#4d5c53" />
      <rect x="34" y="32" width="62" height="9" rx="4.5" fill={C.kuningTua} />
      <rect x="46" y="10" width="144" height="38" rx="9" fill={C.kuning} />
      <rect x="46" y="40" width="144" height="8" rx="4" fill={C.kuningTua} />
      <rect x="52" y="4" width="46" height="38" rx="8" fill="#e9eff3" />
      <rect x="57" y="9" width="36" height="20" rx="5" fill={C.kaca} />
      <rect x="104" y="14" width="80" height="22" rx="5" fill={C.kuningTua} opacity="0.55" />
      <rect x="176" y="0" width="7" height="12" rx="3.5" fill={C.besi} />
      <rect x="148" y="22" width="32" height="14" rx="2.5" fill={C.putih} stroke={C.tinta} strokeWidth="1.6" />
      <path d="M152 27.5 h24 M152 32 h16" stroke={C.tinta} strokeWidth="2" />
      <path d="M188 30 L240 6" stroke={C.kuningTua} strokeWidth="15" strokeLinecap="round" />
      <path d="M188 30 L240 6" stroke={C.kuning} strokeWidth="9" strokeLinecap="round" />
      <path d="M240 6 L262 34" stroke={C.kuningTua} strokeWidth="13" strokeLinecap="round" />
      <path d="M240 6 L262 34" stroke={C.kuning} strokeWidth="7" strokeLinecap="round" />
      <circle cx="240" cy="6" r="5" fill={C.besiTua} />
      <path d="M258 30 q16 4 18 18 l-16 4 q-8 -12 -10 -18 z" fill={C.besi} />
      {rusak ? (
        <g>
          <path
            d="M238 18 l10 6 -9 5 m12 -14 l8 7"
            fill="none"
            stroke={C.tinta}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path d="M246 2 l3 -8 M258 12 l9 -4 M232 22 l-9 3" stroke={C.merah} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M20 42 l10 5 -9 4" fill="none" stroke={C.tinta} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
}

function gelombang(y: number, amp = 5, seg = 40): string {
  let d = `M0 ${y}`;
  for (let i = 0; i < 400 / seg; i += 1) d += ` q ${seg / 2} ${-amp} ${seg} 0`;
  return d;
}

function Air({ y, warna = C.air, opacity = 0.55 }: { y: number; warna?: string; opacity?: number }): ReactElement {
  return (
    <g>
      <path d={`${gelombang(y)} L400 260 L0 260 Z`} fill={warna} opacity={opacity} />
      <path d={gelombang(y)} fill="none" stroke={C.putih} strokeWidth="2" opacity="0.6" />
      <path d={gelombang(y + 14, 4, 56)} fill="none" stroke={C.putih} strokeWidth="1.6" opacity="0.35" />
    </g>
  );
}

function Papan({
  x,
  y,
  w,
  h,
  teks,
  isi = C.hijau,
  warnaTeks = C.krem,
  ukuran = 10,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  teks: string;
  isi?: string;
  warnaTeks?: string;
  ukuran?: number;
}): ReactElement {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" fill={isi} />
      <rect x={x} y={y} width={w} height={h} rx="4" fill="none" stroke={C.tinta} strokeWidth="1.4" opacity="0.35" />
      <text
        x={x + w / 2}
        y={y + h / 2 + ukuran * 0.36}
        textAnchor="middle"
        fontSize={ukuran}
        fontWeight="800"
        fill={warnaTeks}
      >
        {teks}
      </text>
    </g>
  );
}

/* ============================================================== 10 adegan */

function Parkiran(): ReactElement {
  const garis = [0, 1, 2, 3];
  return (
    <>
      <Langit id="sk-parkiran" atas="#bfe3f7" bawah="#e7f4ec" />
      <Awan x={54} y={36} melayang />
      <Awan x={300} y={28} s={0.8} />
      <Gedung x={16} y={132} w={54} h={44} badan="#cbdcd2" />
      <Gedung x={96} y={132} w={72} h={58} badan="#e3d8bf" />
      <Gedung x={298} y={132} w={62} h={50} badan="#d6e2ee" />
      <path d="M0 126 L400 118 L400 260 L0 260 Z" fill={C.aspal} />
      <path d="M0 130 L400 122 L400 148 L0 156 Z" fill={C.aspalTerang} />
      {garis.map((i) => (
        <path
          key={i}
          d={`M${34 + i * 92} 252 L${72 + i * 92} 168`}
          stroke={C.putih}
          strokeWidth="4"
          opacity="0.75"
          strokeLinecap="round"
        />
      ))}
      <path d="M0 164 L400 156" stroke={C.putih} strokeWidth="3" opacity="0.45" strokeDasharray="14 10" />
      <Pohon x={20} y={168} s={1.1} />
      <Pohon x={378} y={150} s={0.8} />
      <Lampu x={318} y={162} s={0.9} />
      <Mobil x={78} y={232} s={1.25} warna="#e8e3d6" penyok="samping" />
      <Mobil x={236} y={172} s={0.85} warna={C.biru} balik />
      <Papan x={132} y={196} w={86} h={16} teks="MOBIL NASABAH" ukuran={9} />
    </>
  );
}

function Bengkel(): ReactElement {
  const alat = [0, 1, 2, 3];
  return (
    <>
      <Langit id="sk-bengkel" atas="#cfe7f6" bawah="#eef3e6" />
      <Awan x={330} y={30} s={0.75} melayang />
      <path d="M0 118 L400 110 L400 260 L0 260 Z" fill="#8d9a92" />
      <path d="M0 176 L400 166 L400 260 L0 260 Z" fill={C.beton} />
      <path d="M22 112 L232 104 L248 118 L38 126 Z" fill={C.kuningTua} />
      <rect x="30" y="118" width="212" height="62" fill="#e7ded0" />
      <rect x="30" y="118" width="212" height="62" fill="none" stroke={C.betonTua} strokeWidth="1.6" />
      <rect x="120" y="126" width="112" height="54" rx="3" fill="#41504a" />
      <rect x="120" y="126" width="112" height="14" rx="3" fill={C.besi} />
      <path d="M124 130 h104 M124 134 h104" stroke="#7b8a82" strokeWidth="1.2" />
      <rect x="40" y="138" width="70" height="6" rx="2" fill={C.cokelat} />
      <rect x="40" y="160" width="70" height="6" rx="2" fill={C.cokelat} />
      {alat.map((i) => (
        <g key={i}>
          <rect x={46 + i * 16} y="126" width="6" height="12" rx="3" fill={C.besi} />
          <circle cx={49 + i * 16} cy="124" r="4" fill="none" stroke={C.besi} strokeWidth="2.4" />
          <rect x={45 + i * 16} y="150" width="9" height="10" rx="2" fill={i % 2 === 0 ? C.merah : C.biru} />
        </g>
      ))}
      <Papan x={44} y={92} w={104} h={20} teks="BENGKEL MITRA" ukuran={11} />
      <path d="M118 236 L306 224 L318 244 L130 256 Z" fill={C.betonTua} />
      <rect x="140" y="230" width="150" height="7" rx="3.5" fill={C.besi} />
      <Mobil x={148} y={230} s={1.3} warna="#e0eaf4" penyok="depan-kiri" />
      <Papan x={120} y={190} w={110} h={16} teks="RUSAK DEPAN KIRI" isi={C.merah} ukuran={9} />
      <Orang x={318} y={226} s={1.15} seragam={C.hijau} helm papan />
      <Pohon x={372} y={188} s={0.75} />
      <rect x="258" y="196" width="26" height="22" rx="3" fill={C.merah} />
      <rect x="262" y="190" width="18" height="7" rx="3" fill={C.besi} />
    </>
  );
}

function Ruko(): ReactElement {
  const jendela = [0, 1, 2];
  return (
    <>
      <Langit id="sk-ruko" atas="#c6dced" bawah="#efefe4" />
      <Awan x={64} y={30} s={0.8} melayang />
      <Gedung x={286} y={150} w={64} h={52} badan="#cfd9d4" />
      <path d="M0 148 L400 140 L400 260 L0 260 Z" fill={C.aspal} />
      <path d="M0 200 L400 190 L400 260 L0 260 Z" fill={C.beton} />
      <path d="M38 62 L228 56 L244 74 L54 80 Z" fill="#9c8f7d" />
      <rect x="46" y="74" width="190" height="126" fill="#e6ddcc" />
      <rect x="46" y="74" width="190" height="126" fill="none" stroke={C.betonTua} strokeWidth="1.6" />
      <rect x="46" y="134" width="190" height="6" fill={C.betonTua} />
      {jendela.map((i) => (
        <g key={i}>
          <rect x={64 + i * 58} y="88" width="40" height="34" rx="3" fill="#41504a" />
          <rect x={64 + i * 58} y="88" width="40" height="34" rx="3" fill="none" stroke="#2b332f" strokeWidth="2" />
          <path
            d={`M${62 + i * 58} 88 q10 -14 20 -6 q10 -12 22 2 q-6 8 -22 6 q-12 2 -20 -2 z`}
            fill="#3a3330"
            opacity="0.55"
          />
        </g>
      ))}
      <path d="M52 132 q34 -16 62 -4 q30 -14 58 0 q28 -12 60 -2 l0 8 L52 140 Z" fill="#3a3330" opacity="0.3" />
      <rect x="88" y="150" width="54" height="50" rx="3" fill="#6f665a" />
      <path d="M88 150 h54 v10 h-54 z" fill="#3a3330" opacity="0.5" />
      <rect x="164" y="152" width="48" height="46" rx="3" fill="#41504a" />
      <path d="M164 152 q16 -10 30 -2 q12 -6 18 2 l0 6 h-48 z" fill="#3a3330" opacity="0.45" />
      <Papan x={96} y={56} w={104} h={18} teks="RUKO MELATI" isi={C.cokelat} ukuran={10} />
      <Papan x={250} y={112} w={70} h={18} teks="LOKASI AMAN" isi={C.hijauMuda} warnaTeks={C.tinta} ukuran={9} />
      <Bayangan cx={264} cy={238} rx={60} ry={10} />
      <rect x="208" y="206" width="112" height="9" rx="4" fill={C.cokelat} />
      <rect x="214" y="215" width="7" height="24" rx="3" fill="#48372a" />
      <rect x="307" y="215" width="7" height="24" rx="3" fill="#48372a" />
      <rect x="220" y="192" width="34" height="16" rx="2.5" fill={C.kuning} />
      <rect x="226" y="186" width="34" height="18" rx="2.5" fill={C.putih} stroke={C.tinta} strokeWidth="1.2" />
      <path d="M231 192 h22 M231 197 h14" stroke={C.tintaLembut} strokeWidth="1.4" />
      <rect x="270" y="190" width="38" height="18" rx="2.5" fill="#f0c98a" />
      <path d="M276 196 h24 M276 201 h16" stroke={C.cokelat} strokeWidth="1.4" />
      <Orang x={186} y={240} s={1.2} seragam={C.hijau} papan />
      <path d="M340 232 l7 -24 h6 l7 24 z" fill={C.merah} />
      <rect x="337" y="230" width="26" height="6" rx="3" fill="#8f2f1f" />
    </>
  );
}

function Proyek(): ReactElement {
  return (
    <>
      <Langit id="sk-proyek" atas="#bfe0f4" bawah="#f0ead6" />
      {/* awan -> hotspot 22 / 15 */}
      <Awan x={88} y={39} s={1.1} melayang />
      <Awan x={306} y={32} s={0.8} />
      <path d="M0 122 q60 -16 130 -8 q70 8 140 -6 q70 -12 130 -2 L400 260 L0 260 Z" fill="#a8c7a8" />
      <Pohon x={26} y={124} s={0.7} />
      <Pohon x={220} y={118} s={0.6} />
      <path d="M0 118 L400 108 L400 260 L0 260 Z" fill={C.tanah} />
      <path d="M232 110 L400 104 L400 132 L248 140 Z" fill={C.aspal} />
      <path d="M238 122 L400 116" stroke={C.putih} strokeWidth="3" strokeDasharray="12 10" opacity="0.7" />
      {/* galian */}
      <path d="M40 200 L130 178 L236 192 L228 224 L128 244 L34 220 Z" fill={C.tanahTua} />
      <path d="M52 202 L130 185 L224 197 L217 216 L130 233 L46 213 Z" fill="#5f4c36" />
      <path d="M252 214 q22 -14 48 -6 q-10 14 -48 10 z" fill={C.tanahTua} />
      {/* excavator miring: roda 34/72, plat seri 57/47, kerusakan boom 71/34 */}
      <Bayangan cx={186} cy={206} rx={78} ry={13} opacity={0.2} />
      <g transform="translate(96.5 167.4) rotate(-30) scale(0.84)">
        <Excavator rusak />
      </g>
      {/* operator berhelm -> hotspot 16 / 55 */}
      <Orang x={64} y={166} s={1.2} seragam="#e4913f" helm papan />
      {/* spanduk proyek -> hotspot 86 / 63 */}
      <rect x="311" y="168" width="5" height="30" rx="2.5" fill={C.cokelat} />
      <rect x="376" y="168" width="5" height="30" rx="2.5" fill={C.cokelat} />
      <rect x="304" y="136" width="82" height="36" rx="4" fill={C.hijau} />
      <rect x="304" y="136" width="82" height="36" rx="4" fill="none" stroke={C.tinta} strokeWidth="1.4" opacity="0.4" />
      <text x="345" y="151" textAnchor="middle" fontSize="9" fontWeight="800" fill={C.krem}>
        PROYEK
      </text>
      <text x="345" y="164" textAnchor="middle" fontSize="9" fontWeight="800" fill={C.kuning}>
        JALAN BARU
      </text>
      {/* warung kopi -> hotspot 91 / 82 */}
      <Bayangan cx={364} cy={236} rx={38} ry={7} />
      <rect x="334" y="204" width="60" height="28" rx="3" fill="#e7dcc4" />
      <path d="M328 204 L400 198 L400 206 L328 212 Z" fill={C.merah} />
      <path d="M336 205 h8 v6 h-8 z M352 204 h8 v6 h-8 z M368 202 h8 v6 h-8 z" fill={C.putih} opacity="0.85" />
      <rect x="338" y="212" width="52" height="7" rx="3" fill={C.cokelat} />
      <rect x="344" y="220" width="10" height="10" rx="2" fill="#8d6737" />
      <circle cx="372" cy="216" r="4" fill={C.besi} />
      <text x="364" y="230" textAnchor="middle" fontSize="8" fontWeight="800" fill={C.cokelat}>
        KOPI
      </text>
      <rect x="10" y="196" width="34" height="9" rx="3" fill={C.kuning} />
      <rect x="10" y="205" width="34" height="9" rx="3" fill={C.merah} />
      <path d="M262 236 l7 -22 h6 l7 22 z" fill={C.merah} />
      <rect x="259" y="234" width="26" height="6" rx="3" fill="#8f2f1f" />
    </>
  );
}

function Kantor(): ReactElement {
  return (
    <>
      <Langit id="sk-kantor" atas="#cbe6f8" bawah="#f2f1e1" />
      <Awan x={70} y={32} s={0.9} melayang />
      <Awan x={320} y={26} s={0.7} />
      <Gedung x={8} y={148} w={58} h={64} badan="#cdd9e4" />
      <Gedung x={330} y={148} w={60} h={70} badan="#d7dfd2" />
      <Gedung x={112} y={150} w={172} h={98} badan={C.hijau} d={16} />
      <rect x="112" y="60" width="172" height="20" rx="5" fill={C.kuning} />
      <text x="198" y="75" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.tinta}>
        KANTOR RAKSA
      </text>
      <rect x="192" y="34" width="4" height="18" rx="2" fill={C.besi} />
      <path d="M196 34 l24 6 -24 6 z" fill={C.kuning} />
      <path d="M0 148 L400 140 L400 260 L0 260 Z" fill="#9aa8a0" />
      <path d="M0 184 L400 174 L400 260 L0 260 Z" fill={C.beton} />
      <path d="M150 150 h50 v34 h-50 z" fill={C.kaca} />
      <path d="M175 150 v34 M150 167 h50" stroke={C.putih} strokeWidth="2" />
      <Pohon x={92} y={196} s={0.9} />
      <Pohon x={314} y={192} s={0.85} />
      <Bayangan cx={198} cy={246} rx={92} ry={12} />
      <path d="M104 214 L292 206 L300 222 L112 232 Z" fill="#e3d4b6" />
      <rect x="112" y="222" width="180" height="16" rx="4" fill={C.cokelat} />
      <g transform="translate(144 196) rotate(-7)">
        <rect x="0" y="0" width="52" height="34" rx="4" fill={C.putih} stroke={C.tinta} strokeWidth="1.4" />
        <rect x="0" y="0" width="52" height="9" rx="4" fill={C.kuning} />
        <path d="M6 18 h34 M6 24 h22" stroke={C.tintaLembut} strokeWidth="1.6" />
        <text x="26" y="15" textAnchor="middle" fontSize="6.5" fontWeight="800" fill={C.tinta}>
          POLIS A
        </text>
      </g>
      <g transform="translate(212 198) rotate(6)">
        <rect x="0" y="0" width="52" height="34" rx="4" fill={C.putih} stroke={C.tinta} strokeWidth="1.4" />
        <rect x="0" y="0" width="52" height="9" rx="4" fill={C.biru} />
        <path d="M6 18 h34 M6 24 h22" stroke={C.tintaLembut} strokeWidth="1.6" />
        <text x="26" y="15" textAnchor="middle" fontSize="6.5" fontWeight="800" fill={C.putih}>
          POLIS B
        </text>
      </g>
      <Orang x={318} y={236} s={1.2} seragam={C.hijau} papan />
      <Orang x={72} y={242} s={1.15} seragam={C.kuningTua} />
    </>
  );
}

function Pelabuhan(): ReactElement {
  const kontainer = [
    { x: 208, y: 128, isi: C.merah },
    { x: 254, y: 128, isi: C.biru },
    { x: 230, y: 110, isi: C.kuning },
  ];
  return (
    <>
      <Langit id="sk-pelabuhan" atas="#bfe1f6" bawah="#dff0f6" />
      <Awan x={60} y={30} s={0.85} melayang />
      <path d="M0 132 L400 126 L400 178 L0 184 Z" fill="#7fb8d8" />
      <path d={gelombang(150, 3, 50)} fill="none" stroke={C.putih} strokeWidth="1.6" opacity="0.5" />
      <path d="M186 148 L340 146 L326 176 L200 176 Z" fill="#2c4f6e" />
      <path d="M186 148 L340 146 L338 154 L188 156 Z" fill="#3d6c93" />
      <rect x="300" y="118" width="34" height="28" rx="3" fill={C.putih} />
      <rect x="305" y="124" width="24" height="9" rx="2" fill={C.kaca} />
      {kontainer.map((k) => (
        <g key={`${k.x}-${k.y}`}>
          <rect x={k.x} y={k.y} width="44" height="18" rx="2" fill={k.isi} />
          <path
            d={`M${k.x + 8} ${k.y} v18 M${k.x + 18} ${k.y} v18 M${k.x + 28} ${k.y} v18 M${k.x + 38} ${k.y} v18`}
            stroke="#000000"
            strokeOpacity="0.2"
            strokeWidth="1.4"
          />
        </g>
      ))}
      <path d="M356 150 L356 74 L300 74" stroke={C.besi} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M312 74 L312 96" stroke={C.besi} strokeWidth="3" />
      <rect x="304" y="96" width="16" height="10" rx="2" fill={C.kuning} />
      <path d="M0 176 L400 170 L400 260 L0 260 Z" fill={C.beton} />
      <path d="M0 176 L400 170 L400 182 L0 188 Z" fill={C.betonTua} />
      <Bayangan cx={92} cy={244} rx={76} ry={11} />
      <Peti x={30} y={240} w={40} h={32} />
      <Peti x={74} y={240} w={40} h={32} rusak />
      <Peti x={118} y={240} w={40} h={32} />
      <Peti x={52} y={208} w={40} h={32} rusak />
      <Peti x={96} y={208} w={40} h={32} />
      <Papan x={20} y={186} w={66} h={15} teks="DERMAGA" isi={C.biru} ukuran={8} />
      <Forklift x={198} y={244} s={0.78} />
      <Orang x={318} y={246} s={1.2} seragam={C.hijau} papan helm />
      <Papan x={284} y={196} w={82} h={15} teks="PETUGAS" ukuran={8} />
      <g className="anim-melayang">
        <path
          d="M120 60 q8 -6 16 0 q8 -6 16 0"
          fill="none"
          stroke={C.tinta}
          strokeWidth="2"
          opacity="0.45"
          strokeLinecap="round"
        />
      </g>
    </>
  );
}

function Gudang(): ReactElement {
  const pallet = [
    { x: 46, y: 206 },
    { x: 138, y: 210 },
    { x: 262, y: 206 },
  ];
  return (
    <>
      <Langit id="sk-gudang" atas="#dfe6e2" bawah="#c9cec7" />
      <path d="M0 0 L400 0 L400 46 L0 52 Z" fill="#b6bdb6" />
      <path d="M0 46 L400 40 L400 56 L0 62 Z" fill="#9aa39c" />
      <rect x="0" y="52" width="400" height="152" fill="#e2ded1" />
      <rect x="0" y="52" width="400" height="8" fill={C.betonTua} />
      <rect x="18" y="86" width="120" height="8" rx="3" fill={C.cokelat} />
      <rect x="18" y="132" width="120" height="8" rx="3" fill={C.cokelat} />
      <rect x="22" y="66" width="24" height="20" rx="2" fill="#c89b62" />
      <rect x="52" y="70" width="28" height="16" rx="2" fill={C.biru} />
      <rect x="88" y="66" width="30" height="20" rx="2" fill={C.kuning} />
      <rect x="26" y="112" width="30" height="20" rx="2" fill={C.merah} />
      <rect x="64" y="116" width="26" height="16" rx="2" fill="#c89b62" />
      <rect x="292" y="66" width="92" height="88" rx="4" fill="#41504a" />
      <rect x="292" y="66" width="92" height="12" rx="4" fill={C.besi} />
      <path d="M296 84 h84 M296 92 h84 M296 100 h84" stroke="#7b8a82" strokeWidth="1.4" />
      <Papan x={150} y={70} w={120} h={22} teks="SENTRA NIAGA" ukuran={12} />
      {/* garis air di dinding */}
      <path d="M0 198 L400 198" stroke={C.merah} strokeWidth="2.4" strokeDasharray="10 7" />
      <path d="M150 198 L150 214" stroke={C.merah} strokeWidth="2" />
      <text x="156" y="194" fontSize="9" fontWeight="800" fill={C.merah}>
        GARIS AIR
      </text>
      <rect x="0" y="204" width="400" height="56" fill={C.beton} />
      <Air y={214} opacity={0.5} />
      {pallet.map((p) => (
        <g key={p.x}>
          <Bayangan cx={p.x + 34} cy={p.y + 22} rx={38} ry={7} opacity={0.14} />
          <rect x={p.x} y={p.y} width="68" height="10" rx="2" fill="#a87f4b" />
          <path
            d={`M${p.x + 8} ${p.y} v10 M${p.x + 30} ${p.y} v10 M${p.x + 54} ${p.y} v10`}
            stroke="#8d6737"
            strokeWidth="3"
          />
          <rect x={p.x + 4} y={p.y - 26} width="28" height="26" rx="2" fill="#c89b62" />
          <rect x={p.x + 36} y={p.y - 22} width="26" height="22" rx="2" fill="#d8b17d" />
          <path d={`M${p.x + 4} ${p.y - 16} h28`} stroke="#8d6737" strokeWidth="2" />
        </g>
      ))}
      <Orang x={214} y={226} s={1.15} seragam={C.hijau} helm papan />
      <path d="M198 224 q16 -5 32 0" fill="none" stroke={C.putih} strokeWidth="2.4" opacity="0.8" />
      <Papan x={38} y={176} w={108} h={16} teks="BANJIR" isi={C.biru} ukuran={9} />
    </>
  );
}

function GudangForklift(): ReactElement {
  return (
    <>
      <Langit id="sk-gudang-forklift" atas="#e6e3d6" bawah="#cdcfc6" />
      <path d="M0 0 L400 0 L400 40 L0 46 Z" fill="#b6bdb6" />
      <rect x="0" y="46" width="400" height="160" fill="#e6e0d0" />
      <rect x="0" y="46" width="400" height="8" fill={C.betonTua} />
      <g className="anim-melayang">
        <g>
          <path d="M120 46 L120 62" stroke={C.besi} strokeWidth="2.4" />
          <path d="M104 74 q16 -14 32 0 z" fill={C.besi} />
          <ellipse cx="120" cy="80" rx="26" ry="9" fill={C.kuning} opacity="0.35" />
        </g>
      </g>
      <rect x="252" y="66" width="132" height="8" rx="3" fill={C.cokelat} />
      <rect x="252" y="112" width="132" height="8" rx="3" fill={C.cokelat} />
      <rect x="252" y="158" width="132" height="8" rx="3" fill={C.cokelat} />
      <rect x="258" y="46" width="6" height="120" fill="#8d6737" />
      <rect x="372" y="46" width="6" height="120" fill="#8d6737" />
      <rect x="266" y="46" width="30" height="20" rx="2" fill={C.biru} />
      <rect x="302" y="50" width="26" height="16" rx="2" fill={C.merah} />
      <rect x="336" y="46" width="32" height="20" rx="2" fill="#c89b62" />
      <rect x="268" y="92" width="34" height="20" rx="2" fill={C.kuning} />
      <circle cx="326" cy="102" r="10" fill="none" stroke={C.besi} strokeWidth="4" />
      <rect x="348" y="94" width="20" height="18" rx="2" fill={C.besi} />
      <rect x="272" y="140" width="30" height="18" rx="2" fill="#d8b17d" />
      <rect x="312" y="136" width="36" height="22" rx="2" fill={C.hijauMuda} />
      <Papan x={24} y={92} w={126} h={22} teks="GUDANG ALAT BERAT" ukuran={11} />
      <path d="M0 206 L400 200 L400 260 L0 260 Z" fill={C.beton} />
      <path d="M0 206 L400 200 L400 210 L0 216 Z" fill={C.betonTua} />
      <path d="M40 260 L96 212 M180 260 L214 212 M320 260 L330 210" stroke={C.betonTua} strokeWidth="2" opacity="0.6" />
      <Forklift x={148} y={244} s={1.35} penyok balik />
      <Papan x={158} y={150} w={110} h={16} teks="FORKLIFT GT-220" isi={C.cokelat} ukuran={9} />
      <Bayangan cx={52} cy={250} rx={48} ry={9} />
      <rect x="10" y="212" width="84" height="8" rx="3" fill="#a87f4b" />
      <rect x="16" y="220" width="7" height="28" rx="3" fill="#8d6737" />
      <rect x="82" y="220" width="7" height="28" rx="3" fill="#8d6737" />
      <g transform="translate(18 194) rotate(-5)">
        <rect x="0" y="0" width="42" height="20" rx="2" fill={C.putih} stroke={C.tinta} strokeWidth="1.2" />
        <path d="M5 7 h30 M5 12 h20" stroke={C.tintaLembut} strokeWidth="1.3" />
      </g>
      <g transform="translate(52 196) rotate(7)">
        <rect x="0" y="0" width="40" height="18" rx="2" fill="#f0e6cd" stroke={C.cokelat} strokeWidth="1.2" />
        <path d="M5 6 h28 M5 11 h18" stroke={C.cokelat} strokeWidth="1.3" />
      </g>
      <Papan x={4} y={172} w={102} h={16} teks="CATATAN SERVIS" isi={C.cokelat} ukuran={8} />
    </>
  );
}

function KantorHitung(): ReactElement {
  const baris = [0, 1, 2, 3];
  const kol = [0, 1, 2];
  return (
    <>
      <Langit id="sk-kantor-hitung" atas="#f3ead2" bawah="#e0d7be" />
      <defs>
        <linearGradient id="sk-kantor-hitung-jendela" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe3f7" />
          <stop offset="1" stopColor="#e8f4ec" />
        </linearGradient>
      </defs>
      <rect x="216" y="30" width="156" height="104" rx="8" fill="url(#sk-kantor-hitung-jendela)" />
      <rect x="240" y="96" width="26" height="38" fill="#b7c9c0" />
      <rect x="274" y="82" width="32" height="52" fill="#c8d6cd" />
      <rect x="314" y="102" width="26" height="32" fill="#aebdb5" />
      <rect x="216" y="30" width="156" height="104" rx="8" fill="none" stroke={C.cokelat} strokeWidth="5" />
      <path d="M294 30 v104 M216 82 h156" stroke={C.cokelat} strokeWidth="4" />
      <Papan x={22} y={40} w={128} h={24} teks="MEJA HITUNG" ukuran={13} />
      <Papan x={22} y={70} w={128} h={18} teks="KANTOR RAKSA" isi={C.kuning} warnaTeks={C.tinta} ukuran={10} />
      <path d="M0 168 L400 158 L400 260 L0 260 Z" fill="#c9a575" />
      <path d="M0 168 L400 158 L400 176 L0 186 Z" fill="#dcbd90" />
      {/* lampu meja */}
      <ellipse cx="60" cy="182" rx="26" ry="8" fill={C.tinta} opacity="0.16" />
      <rect x="46" y="172" width="28" height="8" rx="4" fill={C.hijau} />
      <path d="M60 172 q2 -34 28 -40" fill="none" stroke={C.hijau} strokeWidth="5" strokeLinecap="round" />
      <path d="M74 126 q20 -12 32 6 l-34 14 q-8 -12 2 -20 z" fill={C.hijau} />
      <ellipse cx="96" cy="164" rx="34" ry="18" fill={C.kuning} opacity="0.3" />
      {/* kalkulator */}
      <g transform="translate(126 176) rotate(-4)">
        <rect x="0" y="0" width="60" height="70" rx="6" fill="#3c4a52" />
        <rect x="6" y="6" width="48" height="18" rx="3" fill="#cfe4c9" />
        <path d="M12 18 h18 M34 18 h14" stroke={C.tinta} strokeWidth="2.4" />
        {baris.map((r) =>
          kol.map((k) => (
            <rect key={`${r}-${k}`} x={8 + k * 16} y={30 + r * 10} width="12" height="7" rx="2" fill="#8d9a92" />
          )),
        )}
        <rect x="46" y="30" width="8" height="37" rx="2" fill={C.kuning} />
      </g>
      {/* lembar perhitungan */}
      <g transform="translate(198 186) rotate(5)">
        <rect x="0" y="0" width="86" height="62" rx="3" fill={C.putih} stroke={C.tinta} strokeWidth="1.4" />
        <text x="8" y="10" fontSize="7.5" fontWeight="800" fill={C.tinta}>
          PERHITUNGAN
        </text>
        <path d="M8 18 h50 M8 28 h62 M8 38 h40" stroke={C.tintaLembut} strokeWidth="1.6" />
        <path d="M8 46 h62" stroke={C.tinta} strokeWidth="2.2" />
        <text x="70" y="57" textAnchor="end" fontSize="9" fontWeight="800" fill={C.hijau}>
          Rp ...
        </text>
      </g>
      {/* tumpukan dokumen */}
      <Bayangan cx={334} cy={236} rx={44} ry={8} />
      <rect x="296" y="212" width="76" height="22" rx="3" fill="#f0c98a" />
      <rect x="300" y="200" width="72" height="16" rx="3" fill={C.putih} stroke={C.kremTua} strokeWidth="1.4" />
      <rect x="304" y="188" width="68" height="14" rx="3" fill={C.putih} stroke={C.kremTua} strokeWidth="1.4" />
      <rect x="308" y="178" width="62" height="12" rx="3" fill={C.putih} stroke={C.kremTua} strokeWidth="1.4" />
      <path d="M314 184 h38 M312 195 h44" stroke={C.tintaLembut} strokeWidth="1.4" />
      {/* cangkir */}
      <ellipse cx="42" cy="236" rx="18" ry="5" fill={C.tinta} opacity="0.14" />
      <path d="M28 212 h26 l-3 22 h-20 z" fill={C.putih} stroke={C.kremTua} strokeWidth="1.4" />
      <path d="M54 216 q10 4 0 12" fill="none" stroke={C.putih} strokeWidth="3.4" />
      <ellipse cx="41" cy="212" rx="13" ry="4" fill="#8d6737" />
    </>
  );
}

function KotaBanjir(): ReactElement {
  return (
    <>
      <Langit id="sk-kota-banjir" atas="#b8cfdd" bawah="#dceaee" />
      <Awan x={78} y={30} melayang />
      <Awan x={318} y={24} s={0.8} />
      <Gedung x={10} y={140} w={52} h={58} badan="#c6d2da" />
      <Gedung x={340} y={140} w={52} h={54} badan="#cfd8cd" />
      {/* aset 3: gudang */}
      <path d="M244 118 L370 112 L382 128 L256 134 Z" fill={C.merah} />
      <rect x="252" y="128" width="124" height="60" fill="#e6ddcc" />
      <rect x="252" y="128" width="124" height="60" fill="none" stroke={C.betonTua} strokeWidth="1.6" />
      <rect x="288" y="146" width="56" height="42" rx="3" fill="#41504a" />
      <path d="M292 152 h48 M292 160 h48 M292 168 h48" stroke="#7b8a82" strokeWidth="1.3" />
      <Papan x={256} y={98} w={116} h={18} teks="KOMPLEKS USAHA" ukuran={10} />
      <path d="M0 150 L400 142 L400 260 L0 260 Z" fill={C.aspal} />
      <path d="M0 186 L400 178 L400 260 L0 260 Z" fill="#8d9a92" />
      {/* aset 1: mobil operasional */}
      <Mobil x={34} y={222} s={1.05} warna="#e8e3d6" />
      {/* aset 2: alat berat */}
      <g transform="translate(150 178) scale(0.4)">
        <Excavator />
      </g>
      <Air y={206} opacity={0.6} />
      <path d={gelombang(226, 4, 46)} fill="none" stroke={C.putih} strokeWidth="1.6" opacity="0.45" />
      {/* orang sudah aman di tanggul yang lebih tinggi */}
      <path d="M296 202 L400 196 L400 232 L300 238 Z" fill={C.beton} />
      <path d="M296 202 L400 196 L400 204 L298 210 Z" fill={C.betonTua} />
      <Orang x={330} y={224} s={1.05} seragam={C.hijau} papan helm />
      <Orang x={372} y={228} seragam={C.kuningTua} />
      <Papan x={284} y={172} w={106} h={17} teks="SEMUA SUDAH AMAN" isi={C.hijauMuda} warnaTeks={C.tinta} ukuran={9} />
      <Papan x={12} y={192} w={64} h={15} teks="MOBIL" isi={C.biru} ukuran={8} />
      <Papan x={128} y={154} w={80} h={15} teks="ALAT BERAT" isi={C.kuningTua} warnaTeks={C.tinta} ukuran={8} />
      <Papan x={220} y={192} w={64} h={15} teks="GUDANG" isi={C.cokelat} ukuran={8} />
    </>
  );
}

/* ================================================================== ekspor */

/** Adegan vektor lama; soal bergambar (scene 'gambar') tidak punya padanannya di sini. */
type AdeganVektor = Exclude<SceneKey, 'gambar'>;

const ADEGAN: Record<AdeganVektor, () => ReactElement> = {
  parkiran: Parkiran,
  bengkel: Bengkel,
  ruko: Ruko,
  proyek: Proyek,
  kantor: Kantor,
  pelabuhan: Pelabuhan,
  gudang: Gudang,
  'gudang-forklift': GudangForklift,
  'kantor-hitung': KantorHitung,
  'kota-banjir': KotaBanjir,
};

/** Label lokasi singkat per adegan. */
export const SCENE_LABEL: Record<AdeganVektor, string> = {
  parkiran: 'Parkiran Kota',
  bengkel: 'Bengkel Mitra',
  ruko: 'Ruko Jalan Melati',
  proyek: 'Proyek Jalan Baru',
  kantor: 'Kantor Raksa',
  pelabuhan: 'Pelabuhan & Logistik',
  gudang: 'Gudang Sentra Niaga',
  'gudang-forklift': 'Gudang Alat Berat',
  'kantor-hitung': 'Meja Hitung Kantor',
  'kota-banjir': 'Kompleks Usaha Kota',
};

/** Keterangan adegan untuk pembaca layar. */
const SCENE_DESC: Record<AdeganVektor, string> = {
  parkiran: 'Area parkir dengan mobil nasabah yang penyok kecil di bodi, mobil lain, garis parkir, pohon, dan lampu parkir.',
  bengkel: 'Bengkel mitra dengan mobil di depan pintu, kerusakan depan kiri terlihat, rak alat, dan montir.',
  ruko: 'Ruko dua lantai bekas kebakaran yang sudah aman, ada jejak arang, petugas, serta meja berkas dan folder.',
  proyek: 'Proyek jalan dengan excavator miring di tepi galian, operator berhelm, spanduk proyek, dan warung kopi.',
  kantor: 'Kantor Raksa di pusat kota dengan meja layanan dan dua kartu polis di atasnya.',
  pelabuhan: 'Pelabuhan dengan kapal, kontainer, tumpukan peti kayu berisi dua peti penyok, forklift kecil, dan petugas mencatat.',
  gudang: 'Gudang Sentra Niaga tergenang banjir setinggi mata kaki, barang di atas pallet, dan garis air di dinding.',
  'gudang-forklift': 'Gudang alat berat dengan forklift berpanel penyok baru dan meja berisi catatan servis lama.',
  'kantor-hitung': 'Meja hitung kantor dengan kalkulator, lembar perhitungan, tumpukan dokumen, dan lampu meja.',
  'kota-banjir': 'Kompleks usaha terkena banjir dengan tiga aset terlihat: mobil, alat berat, dan gudang. Semua orang sudah aman.',
};

export function Scene({
  scene,
  className,
  children,
}: {
  scene: SceneKey;
  className?: string;
  children?: ReactNode;
}): ReactElement {
  // Soal bergambar tidak punya adegan vektor: pakai latar kantor sebagai cadangan netral.
  const kunci: AdeganVektor = scene === 'gambar' ? 'kantor' : scene;
  const Isi = ADEGAN[kunci];
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '400 / 260',
        borderRadius: 'var(--radius-l)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        background: 'var(--biru-pucat)',
      }}
    >
      <svg
        viewBox="0 0 400 260"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`${SCENE_LABEL[kunci]}. ${SCENE_DESC[kunci]}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      >
        <Isi />
      </svg>
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </div>
  );
}
