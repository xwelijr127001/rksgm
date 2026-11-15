/**
 * Potret bulat PIKSEL untuk antarmuka HP Episode 2 (T-013: avatar obrolan/dialog Pak Hendra, Miss Raksa di adegan piksel).
 * Jendela potret manifest (seni/piksel potretTokoh) pada skala bulat untuk ukuran tampil x DPR, isi SVG <image> atlas
 * pixelated. SENGAJA tidak memakai PotretPiksel Episode 1 (seni/tokoh/PotretMissRaksa): modul itu mengimpor
 * ui/panggung/sumberPiksel yang langsung memuat seluruh ruang PNG Episode 1 (±55 KB) saat diimpor.
 */
import { useMemo } from 'react';
import { ukuranPermintaanPotret, useDpr } from '../../../../game/tokoh';
import { potretTokoh, svgPotret, type IdTokohPiksel } from '../../../seni/piksel';
import type { Ekspresi } from '../../../tipe';

export function PotretPikselHp({ tokoh, ekspresi, ukuran, label, className = '' }: { tokoh: IdTokohPiksel; ekspresi: Ekspresi; ukuran: number; label: string; className?: string }) {
  const dpr = useDpr();
  const { px } = ukuranPermintaanPotret(ukuran, dpr);
  const isi = useMemo(() => {
    try {
      const p = potretTokoh(tokoh, ekspresi, px);
      if (!p || !p.lapisan.length) return null;
      const s = svgPotret(p);
      return { svg: s.isi, viewBox: s.viewBox, asal: p.asal };
    } catch {
      return null;
    }
  }, [tokoh, ekspresi, px]);
  return (
    <span className={'tokoh-potret cer-potret cseni-potret ' + className} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })} style={{ width: ukuran, height: ukuran }} data-tokoh={tokoh} data-ekspresi={ekspresi} data-jendela={isi?.asal}>
      {isi ? (
        <svg width={ukuran} height={ukuran} viewBox={isi.viewBox} preserveAspectRatio="none" focusable="false" aria-hidden="true" style={{ imageRendering: 'pixelated' }} dangerouslySetInnerHTML={{ __html: isi.svg }} />
      ) : (
        <span aria-hidden="true">{label.slice(0, 1)}</span>
      )}
    </span>
  );
}
