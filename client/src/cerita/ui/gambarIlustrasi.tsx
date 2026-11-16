/**
 * Seni kode episode (Episode.seniArena: dokumen, baki, lokasi, cap, ...; SVG milik episode sendiri, bukan masukan pengguna)
 * sebagai <svg>; id tak dikenal = kosong. Hiasan: nama selalu teks. (T-013 Stage 3: komponen <img> ilustrasi WebP & potret
 * ilustrasi dihapus bersama panggung ilustrasi; potret Episode 2 = ui/latar/piksel/PotretPikselHp.)
 */
import type { CSSProperties } from 'react';
import type { Episode } from '../tipe';
import '../seni/aktivitas/piksel.css';

export function GambarSeni({ ep, id, className = '', style, kecil = false }: { ep: Episode; id?: string; className?: string; style?: CSSProperties; /** Pakai versi kecil 22 x 28 bila entri punya (dokumen). */ kecil?: boolean }) {
  const s = id ? ep.seniArena?.[id] : undefined;
  if (!s) return null;
  // T-020: seni piksel = kotak persis w x h dengan PNG sebagai latar (kelas dari seni/aktivitas/piksel.css), tanpa penskalaan.
  if (kecil && s.kecil) return <span className={`hp-seni-piksel px ${s.kecil} ${className}`} style={{ ...style, width: 22, height: 28 }} aria-hidden="true" />;
  if (s.piksel) return <span className={`hp-seni-piksel px ${s.piksel} ${className}`} style={{ ...style, width: s.w, height: s.h }} aria-hidden="true" />;
  return (
    <svg className={'hp-seni ' + className} style={style} viewBox={`0 0 ${s.w} ${s.h}`} aria-hidden="true" focusable="false"
      dangerouslySetInnerHTML={{ __html: s.svg }} />
  );
}
