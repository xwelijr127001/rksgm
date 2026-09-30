/**
 * Tokoh Raksa (Mr Roger, Miss Raksa, Bu Isti) di halaman HTML: sprite melambai + balon
 * sapaan opsional. Animasi hanya CSS (tanpa engine); diam saat prefers-reduced-motion.
 *
 * Miss Raksa = SENI PIKSEL v4 (sheet dari atlas piksel cerita, tools/siapkan-karakter.mjs): sprite & potret tampil pada
 * jumlah piksel PERANGKAT bulat per piksel seni (image-rendering pixelated di tokoh.css), jadi ukurannya dibulatkan
 * dari `tinggi`/`ukuran` yang diminta (tokoh.ts ukuranSpritePiksel / potretSpritePiksel) dan ikut berubah saat
 * devicePixelRatio berubah (zoom). Sprite badan penuh minimal floor(dpr) piksel perangkat per piksel seni (v5: di HP
 * dpr 2 tidak lagi mengecil ke 92 px, sama dengan desktop 184 px). API komponen tidak berubah. Mr Roger & Bu Isti tetap
 * sheet lama (skala halus).
 */

import type { ReactNode } from 'react';
import { TOKOH, type IdTokoh } from '@shared/brand';
import { t, useBahasa } from '../i18n';
import { SPRITE_BESAR, potretSpritePiksel, ukuranSpritePiksel, useDpr, type SpriteBesar } from './tokoh';
import './tokoh.css';

/** Jabatan tokoh dalam bahasa aktif. */
const jabatan = (id: IdTokoh): string => t(`tokoh.${id}.jabatan`);
/** "nama · jabatan" (atau nama saja bila tampilJabatan false); tanpa nama = jabatan. */
export function namaTokoh(id: IdTokoh): string {
  const k = TOKOH[id];
  if (!k.nama) return jabatan(id);
  return k.tampilJabatan ? `${k.nama} · ${jabatan(id)}` : k.nama;
}
/** Nama lengkap untuk pembaca layar (selalu dengan jabatan). */
function labelTokoh(id: IdTokoh): string {
  const k = TOKOH[id];
  return k.nama ? `${k.nama}, ${jabatan(id)}` : jabatan(id);
}

/**
 * Ukuran tampil sprite (px CSS) untuk tinggi yang diminta: seni piksel = piksel perangkat bulat per piksel seni
 * (`n`), selain itu tinggi apa adanya dan lebar mengikuti rasio frame.
 */
function ukuranSprite(s: SpriteBesar, tinggi: number, dpr: number): { w: number; h: number; n: number | null } {
  if (s.piksel) return ukuranSpritePiksel(s.piksel, tinggi, dpr);
  return { w: Math.round((tinggi * s.frameW) / s.frameH), h: tinggi, n: null };
}

/** Sprite saja, tanpa nama/balon (mis. di dalam balon briefing). */
export function SpriteTokoh({ tokoh, tinggi, lambai = true }: { tokoh: IdTokoh; tinggi: number; lambai?: boolean }) {
  useBahasa();
  const dpr = useDpr();
  if (!TOKOH[tokoh].aktif) return null;
  const u = ukuranSprite(SPRITE_BESAR[tokoh], tinggi, dpr);
  return (
    <div
      className={`tokoh-sprite tokoh-${tokoh}` + (lambai ? ' lambai' : '')}
      style={{ width: u.w, height: u.h }}
      data-piksel={u.n ?? undefined}
      role="img"
      aria-label={t('tokoh.melambai', { nama: labelTokoh(tokoh) })}
    />
  );
}

/**
 * Potret bulat kecil (kepala & bahu, frame diam) untuk slot pemandu di panel.
 * Diambil dari sprite yang sama supaya identitas tokoh tetap; frame diskalakan utuh (tidak
 * diregangkan) sehingga "jendela potret" tokoh itu pas di lingkaran. Isi dibungkus selebar
 * satu frame supaya frame sebelahnya (tangan melambai) tidak ikut terlihat di tepi.
 *
 * `hias` = potret hanya hiasan (nama tokohnya tidak menambah informasi, mis. di dalam tautan/tombol pintu):
 * tanpa role="img"/aria-label dan aria-hidden, sehingga TIDAK ikut menyusun nama aksesibel tautan/tombol
 * pembungkusnya. Tanpa `hias`, Chrome tetap memakai label role="img" saat menghitung nama dari isi walau
 * pembungkusnya aria-hidden ("Bu Isti, Direktur IT Gabung acara…", review aksesibilitas 26 Sep).
 *
 * Seni piksel (Miss Raksa): jendela kepala-bahu frame 0 (berdiri senyum) pada n piksel perangkat bulat per piksel
 * seni (tokoh.ts potretSpritePiksel), pojok jendela di piksel seni bulat.
 */
export function PotretTokoh({ tokoh, ukuran = 44, hias = false }: { tokoh: IdTokoh; ukuran?: number; hias?: boolean }) {
  useBahasa();
  const dpr = useDpr();
  if (!TOKOH[tokoh].aktif) return null;
  const s = SPRITE_BESAR[tokoh];
  const peran = hias ? { 'aria-hidden': true } : { role: 'img', 'aria-label': labelTokoh(tokoh) };
  if (s.piksel) {
    const p = potretSpritePiksel(s.piksel, ukuran, dpr);
    return (
      <span className="tokoh-potret" {...peran} data-piksel={p.n} style={{ width: ukuran, height: ukuran }}>
        <span
          className={`tokoh-potret-isi tokoh-${tokoh}`}
          style={{ left: -p.x * p.q, top: -p.y * p.q, width: s.piksel.frameW * p.q, height: s.piksel.frameH * p.q }}
        />
      </span>
    );
  }
  const j = JENDELA_POTRET[tokoh];
  const k = ukuran / (j.tinggi * s.frameH);
  const fw = s.frameW * k;
  return (
    <span className="tokoh-potret" {...peran} style={{ width: ukuran, height: ukuran }}>
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
 * `*-besar`; ubah bila gambar sumber di character/ diganti. Miss Raksa (seni piksel) tidak memakainya
 * (potretSpritePiksel), nilainya disimpan untuk sheet lama.
 */
const JENDELA_POTRET: Record<IdTokoh, { atas: number; tinggi: number; cx: number }> = {
  ceo: { atas: -0.02, tinggi: 0.52, cx: 0.57 },
  missRaksa: { atas: -0.02, tinggi: 0.38, cx: 0.54 },
  isti: { atas: -0.02, tinggi: 0.4, cx: 0.53 },
};

/** Slot pemandu: potret + nama + satu kalimat, di panel (tidak pernah menutupi adegan). */
export function SapaanPemandu({ tokoh, teks, ukuran = 48, className = '', label }: { tokoh: IdTokoh; teks: ReactNode; ukuran?: number; className?: string; /** Baris nama; bawaan "nama · jabatan". */ label?: string }) {
  useBahasa();
  if (!TOKOH[tokoh].aktif) return null;
  return (
    <div className={'pemandu-kata ' + className}>
      <PotretTokoh tokoh={tokoh} ukuran={ukuran} />
      <p><b>{label ?? namaTokoh(tokoh)}</b>{teks}</p>
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
  label,
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
  /** Baris nama di balon; bawaan "nama · jabatan" (mis. "Bu Isti · Juri" saat membacakan hasil). */
  label?: string;
}) {
  useBahasa();
  const dpr = useDpr();
  if (!TOKOH[tokoh].aktif) return null;
  const k = TOKOH[tokoh];
  // Tinggi sprite yang benar-benar tampil (seni piksel dibulatkan ke piksel perangkat) untuk jarak balon.
  const tinggiTampil = ukuranSprite(SPRITE_BESAR[tokoh], tinggi, dpr).h;
  if (susun === 'bawah') {
    // Balon (opsional) di atas kepala, papan nama di bawah kaki: beberapa tokoh berjajar tetap sejajar.
    return (
      <figure className={`tokoh tokoh-bawah ${className}`}>
        {teks ? <p className="tokoh-balon tokoh-balon-atas">{teks}</p> : null}
        <SpriteTokoh tokoh={tokoh} tinggi={tinggi} lambai={lambai} />
        <figcaption className="tokoh-nama">
          {k.nama ? <><b>{k.nama}</b>{k.tampilJabatan ? <small>{jabatan(tokoh)}</small> : null}</> : <b>{jabatan(tokoh)}</b>}
        </figcaption>
      </figure>
    );
  }
  return (
    <figure className={`tokoh tokoh-${susun} ${className}`}>
      <SpriteTokoh tokoh={tokoh} tinggi={tinggi} lambai={lambai} />
      {/* Di samping: balon sejajar kepala (jarak dihitung dari tinggi sprite, bukan persen). */}
      <figcaption className={teks ? 'tokoh-balon' : 'tokoh-nama'} style={teks && susun === 'samping' ? { marginBottom: Math.round(tinggiTampil * 0.46) } : undefined}>
        {teks ? <><b>{label ?? namaTokoh(tokoh)}</b><span>{teks}</span></> : k.nama ? <><b>{k.nama}</b>{k.tampilJabatan ? <small>{jabatan(tokoh)}</small> : null}</> : <b>{jabatan(tokoh)}</b>}
      </figcaption>
    </figure>
  );
}
