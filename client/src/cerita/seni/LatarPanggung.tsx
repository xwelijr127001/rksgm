/**
 * Latar panggung mode cerita (SVG inline 640 x 480, `xMidYMid slice`): mengisi wadahnya dan
 * terpotong rata di tepi bila rasio wadah berbeda. Hiasan murni (aria-hidden, tanpa teks);
 * string SVG dibuat sekali per latar (seni/latar.ts).
 */

import { memo } from 'react';
import type { IdLatar } from '../tipe';
import { LATAR_H, LATAR_W, latarPanggung } from './latar';
import './seni.css';

export const LatarPanggung = memo(function LatarPanggung({ latar, className = '' }: { latar: IdLatar; className?: string }) {
  return (
    <svg
      className={`cseni-latar ${className}`}
      viewBox={`0 0 ${LATAR_W} ${LATAR_H}`}
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
      aria-hidden="true"
      data-latar={latar}
      dangerouslySetInnerHTML={{ __html: latarPanggung(latar) }}
    />
  );
});
