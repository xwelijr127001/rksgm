/**
 * Tokoh Raksa (Mr Roger, Miss Raksa, Bu Isti) di halaman HTML: sprite melambai + balon
 * sapaan opsional. Animasi hanya CSS (tanpa engine); diam saat prefers-reduced-motion.
 */

import type { ReactNode } from 'react';
import { TOKOH, labelTokoh, namaTokoh, type IdTokoh } from '@shared/brand';
import { SPRITE_BESAR } from './tokoh';
import './tokoh.css';

/** Sprite saja, tanpa nama/balon (mis. di dalam balon briefing). */
export function SpriteTokoh({ tokoh, tinggi, lambai = true }: { tokoh: IdTokoh; tinggi: number; lambai?: boolean }) {
  if (!TOKOH[tokoh].aktif) return null;
  const s = SPRITE_BESAR[tokoh];
  return (
    <div
      className={`tokoh-sprite tokoh-${tokoh}` + (lambai ? ' lambai' : '')}
      style={{ width: Math.round((tinggi * s.frameW) / s.frameH), height: tinggi }}
      role="img"
      aria-label={`${labelTokoh(tokoh)} melambaikan tangan`}
    />
  );
}

/**
 * Potret bulat kecil (kepala & bahu, frame diam) untuk slot pemandu di panel.
 * Diambil dari sprite yang sama supaya identitas tokoh tetap; frame diskalakan utuh (tidak
 * diregangkan) sehingga "jendela potret" tokoh itu pas di lingkaran. Isi dibungkus selebar
 * satu frame supaya frame sebelahnya (tangan melambai) tidak ikut terlihat di tepi.
 */
export function PotretTokoh({ tokoh, ukuran = 44 }: { tokoh: IdTokoh; ukuran?: number }) {
  if (!TOKOH[tokoh].aktif) return null;
  const s = SPRITE_BESAR[tokoh];
  const j = JENDELA_POTRET[tokoh];
  const k = ukuran / (j.tinggi * s.frameH);
  const fw = s.frameW * k;
  return (
    <span className="tokoh-potret" role="img" aria-label={labelTokoh(tokoh)} style={{ width: ukuran, height: ukuran }}>
      <span
        className={`tokoh-potret-isi tokoh-${tokoh}`}
        style={{ left: ukuran / 2 - j.cx * fw, top: -j.atas * s.frameH * k, width: fw, height: s.frameH * k }}
      />
    </span>
  );
}
/**
 * Jendela kepala-bahu per tokoh, dalam pecahan frame: atas (negatif = ruang di atas rambut),
 * tinggi (sisi lingkaran relatif tinggi frame), cx (pusat wajah). Dikalibrasi dari sprite
 * `*-besar`; ubah bila gambar sumber di character/ diganti.
 */
const JENDELA_POTRET: Record<IdTokoh, { atas: number; tinggi: number; cx: number }> = {
  ceo: { atas: -0.02, tinggi: 0.52, cx: 0.57 },
  missRaksa: { atas: -0.02, tinggi: 0.38, cx: 0.54 },
  isti: { atas: -0.02, tinggi: 0.4, cx: 0.53 },
};

/** Slot pemandu: potret + nama + satu kalimat, di panel (tidak pernah menutupi adegan). */
export function SapaanPemandu({ tokoh, teks, ukuran = 48, className = '' }: { tokoh: IdTokoh; teks: ReactNode; ukuran?: number; className?: string }) {
  if (!TOKOH[tokoh].aktif) return null;
  return (
    <div className={'pemandu-kata ' + className}>
      <PotretTokoh tokoh={tokoh} ukuran={ukuran} />
      <p><b>{namaTokoh(tokoh)}</b>{teks}</p>
    </div>
  );
}

export function KarakterTokoh({
  tokoh,
  tinggi = 160,
  teks,
  lambai = true,
  susun = 'samping',
  className = '',
}: {
  tokoh: IdTokoh;
  /** Tinggi tampil sprite (px CSS). */
  tinggi?: number;
  /** Kalimat sapaan di balon; tanpa teks = hanya sprite + nama. */
  teks?: ReactNode;
  lambai?: boolean;
  /** Keterangan di samping sprite, di atasnya, atau di bawahnya. */
  susun?: 'samping' | 'atas' | 'bawah';
  className?: string;
}) {
  if (!TOKOH[tokoh].aktif) return null;
  const t = TOKOH[tokoh];
  if (susun === 'bawah') {
    // Balon (opsional) di atas kepala, papan nama di bawah kaki: beberapa tokoh berjajar tetap sejajar.
    return (
      <figure className={`tokoh tokoh-bawah ${className}`}>
        {teks ? <p className="tokoh-balon tokoh-balon-atas">{teks}</p> : null}
        <SpriteTokoh tokoh={tokoh} tinggi={tinggi} lambai={lambai} />
        <figcaption className="tokoh-nama">
          {t.nama ? <><b>{t.nama}</b>{t.tampilJabatan ? <small>{t.jabatan}</small> : null}</> : <b>{t.jabatan}</b>}
        </figcaption>
      </figure>
    );
  }
  return (
    <figure className={`tokoh tokoh-${susun} ${className}`}>
      <SpriteTokoh tokoh={tokoh} tinggi={tinggi} lambai={lambai} />
      {/* Di samping: balon sejajar kepala (jarak dihitung dari tinggi sprite, bukan persen). */}
      <figcaption className={teks ? 'tokoh-balon' : 'tokoh-nama'} style={teks && susun === 'samping' ? { marginBottom: Math.round(tinggi * 0.46) } : undefined}>
        {teks ? <><b>{namaTokoh(tokoh)}</b><span>{teks}</span></> : t.nama ? <><b>{t.nama}</b>{t.tampilJabatan ? <small>{t.jabatan}</small> : null}</> : <b>{t.jabatan}</b>}
      </figcaption>
    </figure>
  );
}
