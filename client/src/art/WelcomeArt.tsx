import { TOKOH } from '@shared/brand';
import { PotretTokoh, SpriteTokoh, namaTokoh } from '../game/KarakterTokoh';
import { Raki } from './Raki';
import { t, useBahasa } from '../i18n';

/**
 * Ukuran potret bulat tokoh di halaman awal. SAMA untuk Miss Raksa (ilustrasi kota) dan potret di
 * kartu/pintu (Landing.tsx), supaya gaya & skala tokoh seragam (review 26 Sep, temuan F).
 */
export const POTRET_AWAL = 60;

/**
 * Ilustrasi kota halaman awal. Tokoh TIDAK digambar di dalam kota: Miss Raksa menyapa lewat potret bulat + balon di
 * BAWAH gambar, dalam alur halaman, jadi tidak pernah menutupi gambar atau teks dalam bahasa apa pun. Review staf #1
 * (PRD v0.2): sapaan Mr Roger diganti Miss Raksa dengan slogan "anytime anywhere with our smile" (slogan berbahasa
 * Inggris di semua bahasa, ditandai lang="en"). Mr Roger tetap ada di aset/mode lain.
 */
/* Geometri adegan hero = team/specs/T-004-hero-art.txt (generator Designer, diport apa adanya; jangan digambar ulang). */
const INK = '#214C3C', SUN = '#F7D45B', PALE = '#D8E8D9', GLASS = '#6CA887', GREEN = '#287451', SALMON = '#E7946E', CREAM = '#FCF8EB', WIN = '#F9FCF5', HOUSE = '#FFF8E8';
type Kotak = [number, number, number, number, string];
const r = (x: number, y: number, w: number, h: number, f: string): Kotak[] => [[x, y, w, h, f]];
const box = (x: number, y: number, w: number, h: number, f: string): Kotak[] => [[x, y, w, h, INK], [x + 2, y + 2, w - 4, h - 4, f]];
function windows(x: number, y: number, cols: number, rows: number): Kotak[] {
  const out: Kotak[] = [];
  for (let i = 0; i < rows; i++) for (let c = 0; c < cols; c++) out.push([x + c * 12, y + i * 12, 8, 8, GLASS]);
  return out;
}
const cloud = (x: number, y: number): Kotak[] => [...r(x + 8, y, 20, 4, WIN), ...r(x, y + 4, 36, 4, WIN), ...r(x + 4, y + 8, 28, 4, WIN)];
function disc(cx: number, cy: number, rad: number, step = 4): string {
  let d = '';
  for (let y = cy - rad; y < cy + rad; y += step) {
    const dy = y + step / 2 - cy;
    const w = Math.round(Math.sqrt(Math.max(0, rad * rad - dy * dy)) / step) * step;
    if (w > 0) d += `M${cx - w} ${y}h${2 * w}v${step}h${-2 * w}z`;
  }
  return d;
}
const LATAR_AWAN: Kotak[] = [...cloud(36, 14), ...cloud(318, 26), ...r(176, 8, 4, 4, WIN)];
const LATAR_KOTA: Kotak[] = [
  ...box(22, 96, 56, 70, PALE), ...windows(34, 108, 3, 3),
  ...r(88, 112, 52, 4, SALMON), ...r(92, 108, 44, 4, SALMON), ...r(100, 104, 28, 4, SALMON),
  ...box(92, 116, 44, 50, HOUSE), ...r(104, 128, 12, 12, GLASS), ...r(118, 138, 10, 28, GREEN),
  ...box(262, 66, 66, 100, PALE), ...windows(274, 78, 4, 5), ...r(300, 150, 12, 8, INK),
  ...r(318, 56, 4, 10, INK), ...r(316, 52, 8, 4, SALMON),
  ...box(338, 110, 56, 56, PALE), ...windows(350, 122, 3, 3),
  ...r(236, 128, 4, 28, INK), ...r(226, 114, 24, 8, GLASS), ...r(222, 122, 32, 8, GLASS), ...r(228, 130, 20, 6, GLASS),
];
const MATAHARI = disc(186, 112, 56);
const MEJA: Kotak[] = [
  ...r(-10, 20, 440, 34, INK), ...r(-10, 22, 440, 8, CREAM), ...r(-10, 30, 440, 20, GREEN), ...r(-10, 50, 440, 4, INK),
  ...Array.from({ length: 12 }, (_, i): Kotak => [14 + i * 36, 34, 4, 14, INK]),
  ...r(96, 8, 32, 14, INK), ...r(98, 10, 28, 12, CREAM), ...r(98, 6, 12, 4, SALMON), ...r(104, 14, 16, 2, GLASS), ...r(104, 18, 12, 2, GLASS),
  ...r(232, 12, 16, 10, INK), ...r(234, 14, 12, 8, SALMON), ...r(236, 0, 8, 4, GLASS), ...r(230, 4, 20, 6, GLASS), ...r(234, 10, 12, 2, GLASS),
];
const rects = (k: Kotak[]) => k.map(([x, y, width, height, fill], i) => <rect key={i} x={x} y={y} width={width} height={height} fill={fill} />);
/** Latar piksel di BELAKANG sprite (420x190 satuan). */
function LatarHero() {
  return <svg className="lp-latar" viewBox="0 0 420 190" width="420" height="190" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    {rects(LATAR_AWAN)}<path d={MATAHARI} fill={SUN} />{rects(LATAR_KOTA)}
  </svg>;
}
/** Meja layanan + map klaim + pot tanaman, DI DEPAN sprite (y 136..190 adegan). */
function MejaHero() {
  return <svg className="lp-meja" viewBox="0 0 420 54" width="420" height="54" aria-hidden="true" focusable="false" shapeRendering="crispEdges">{rects(MEJA)}</svg>;
}

export function WelcomeArt() {
  useBahasa();
  const miss = TOKOH.missRaksa.aktif;
  return <figure className="lp-kota">
    {/* T-004 D-21..D-25: adegan kecil "Miss Raksa menyapa dari meja layanan klaim". Dekorasi (aria-hidden): nama & jabatan
        dibacakan dari balon sapaan di bawah bingkai. Lapisan: latar piksel -> sprite -> meja (menutupi kaki, N-1). */}
    <div className="lp-kota-bingkai" aria-hidden="true">
      <LatarHero />
      {miss
        ? <div className="lp-kota-slot"><SpriteTokoh tokoh="missRaksa" tinggi={120} /></div>
        : <div className="lp-kota-slot lp-kota-slot-raki"><Raki size={88} mood="sapa" /></div>}
      <MejaHero />
    </div>
    {/* Catatan kota = sapaan Miss Raksa. Potret disembunyikan dari pembaca layar: namanya sudah dibacakan di balon. */}
    <figcaption className="lp-kota-sapa">
      {miss ? <span className="lp-kota-potret" aria-hidden="true"><PotretTokoh tokoh="missRaksa" ukuran={POTRET_AWAL} /></span> : null}
      {/* T-007 D-38: tanpa potret (tokoh nonaktif) balon tidak memakai ekor ke kiri. */}
      <p className={miss ? 'lp-kota-balon' : 'lp-kota-balon lp-kota-balon-tanpa-potret'}>
        {miss ? <b>{namaTokoh('missRaksa')}</b> : null}
        <span lang="en">{t('pemain.sambutSlogan')}</span>
      </p>
    </figcaption>
  </figure>;
}
