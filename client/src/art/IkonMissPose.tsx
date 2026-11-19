/**
 * T-058: Miss Raksa round PIXEL icons, a different expression / pose per spot (owner: "more expression, not the same as the
 * big one"). Head-and-shoulder busts cut from her in-game atlas (same pixels as the story) by character/beranda-ekspresi-t058/
 * ikon.mjs (Fix 1: face = ~50 % of the icon height), each on the SAME frame as the other round portraits (.tokoh-potret: disc
 * #fbefd0, 2 px white inner ring, 1 px #e2d6ad line) baked in, one ring only. Drawn at 1 art px = 1 CSS px (no scaling, image-rendering
 * pixelated), so there is no soft zoom.
 *   sapa       greeting bubble (big smile, open palm welcome)
 *   kasus      Mode Cerita card (focused, pointing at a claim folder)
 *   telepon*   Join Game (phone in hand, smiling); 60 / 56 / 30 px cells
 *   jelaskan   help / guide spots (explaining, palm up), 44 px
 *   prihatin   errors / empty states (concerned)
 */
import atlas from '../cerita/seni/piksel/ikon-miss-pose.png';

const SEL = {
  sapa: [0, 60], kasus: [61, 60], telepon: [122, 60], jelaskan: [183, 44], telepon56: [228, 56], telepon30: [285, 30], prihatin: [316, 60],
} as const;
const LEBAR = 376;
const TINGGI = 60;

export type PoseMiss = keyof typeof SEL;

export function IkonMissPose({ pose, className }: { pose: PoseMiss; className?: string }) {
  const [x, s] = SEL[pose];
  return (
    <span className={'ikon-miss-pose' + (className ? ' ' + className : '')} aria-hidden="true"
      style={{ display: 'inline-block', flex: '0 0 auto', borderRadius: '50%', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated', width: s, height: s, backgroundImage: `url(${atlas})`, backgroundPosition: `-${x}px 0`, backgroundSize: `${LEBAR}px ${TINGGI}px` }} />
  );
}
