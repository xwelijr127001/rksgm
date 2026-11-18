/**
 * T-052: kartu petugas piksel (ID card berlanyard) di kepala layar akhir: pita jingga dengan tanda burung hantu Raksa, potret
 * piksel karakter pemain (profil.look), nama pemain, dan jabatannya. 84 x 56 px, setinggi potret nasabah di baris kepala, jadi
 * kartu satu layar (T-024) tidak bertambah tinggi. Tanpa profil (bukan pemutar HP) = tidak digambar.
 */
import { AvatarPiksel } from '../../art/AvatarPiksel';
import { t } from '../../i18n';
import { useLookPemain } from '../hp/lookPemain';

/** Tanda burung hantu Raksa 10 x 10 sel (cokelat logo #73502F, mata krem, paruh jingga). */
const BURUNG = [
  '.b......b.',
  '.bbbbbbbb.',
  'bwwbbbbwwb',
  'bwkbbbbkwb',
  'bwwbbbbwwb',
  '.bbbbobbb.',
  '.bpppppbb.',
  '.bpppppbb.',
  '..bbbbbb..',
  '..o....o..',
];
const WARNA: Record<string, string> = { b: '#73502F', w: '#FFF1E2', k: '#212121', o: '#FF9000', p: '#F6D25C' };
const RECT_BURUNG = BURUNG.flatMap((r, y) => {
  const out: string[] = [];
  let x = 0;
  while (x < r.length) { const c = r[x]!; if (c === '.') { x++; continue; } let e = x + 1; while (e < r.length && r[e] === c) e++; out.push(`<rect x="${x}" y="${y}" width="${e - x}" height="1" fill="${WARNA[c]}"/>`); x = e; }
  return out;
}).join('');

export function KartuPetugas({ nama }: { nama: string }) {
  const look = useLookPemain();
  if (!look) return null;
  return (
    <div className="akh-kartu-petugas" role="img" aria-label={t('ceritaAkhir.kartuPetugas', { nama })} data-kartu-petugas="">
      <span className="akh-kp-pita" aria-hidden="true">
        <svg width="10" height="10" viewBox="0 0 10 10" shapeRendering="crispEdges" focusable="false" dangerouslySetInnerHTML={{ __html: RECT_BURUNG }} />
        RAKSA
      </span>
      <span className="akh-kp-isi" aria-hidden="true">
        <AvatarPiksel look={look} ukuran={32} />
        <span className="akh-kp-teks"><b>{nama}</b><small>{t('ceritaAkhir.petugasKlaim')}</small></span>
      </span>
    </div>
  );
}
