/**
 * Seni kode episode (Episode.seniArena: dokumen, baki, lokasi, cap, ...; SVG milik episode sendiri, bukan masukan pengguna)
 * sebagai <svg>; id tak dikenal = kosong. Hiasan: nama selalu teks. (T-013 Stage 3: komponen <img> ilustrasi WebP & potret
 * ilustrasi dihapus bersama panggung ilustrasi; potret Episode 2 = ui/latar/piksel/PotretPikselHp.)
 */
import type { CSSProperties } from 'react';
import type { Episode } from '../tipe';

export function GambarSeni({ ep, id, className = '', style }: { ep: Episode; id?: string; className?: string; style?: CSSProperties }) {
  const s = id ? ep.seniArena?.[id] : undefined;
  if (!s) return null;
  return (
    <svg className={'hp-seni ' + className} style={style} viewBox={`0 0 ${s.w} ${s.h}`} aria-hidden="true" focusable="false"
      dangerouslySetInnerHTML={{ __html: s.svg }} />
  );
}
