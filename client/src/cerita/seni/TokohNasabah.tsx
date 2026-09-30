/**
 * Bu Rina di halaman HTML: <TokohNasabah> (kepala sampai pinggang, kartu episode tanpa panggung) dan <PotretNasabah>
 * (potret bulat kepala-bahu di kotak dialog, Riwayat, pemandu aktivitas & kartu akhir). Keduanya SENI PIKSEL v4 dari
 * penyusun seni/piksel (atlas + manifest yang sama dengan panggung): nearest-neighbour pada jumlah piksel PERANGKAT
 * bulat per piksel seni, tidak pernah skala pecahan.
 *
 * - PotretNasabah = `PotretPiksel` bersama (seni/tokoh/PotretMissRaksa.tsx): jendela potret manifest untuk ukuran
 *   tampil x devicePixelRatio, ukuran tampil diukur dari kotak (CSS boleh menimpa), atlas gagal = huruf awal.
 * - TokohNasabah = frame `berdiri` (kunci mobil di tangan) + wajah ekspresi, dipotong kepala sampai pinggang
 *   (POTONG_SETENGAH_PIKSEL, kunci & pangkal celemek masih di dalam). Tanpa `tinggi` gambar mengisi tinggi wadahnya
 *   pada skala bulat terbesar yang masih muat (wadah harus bertinggi tetap), rata bawah.
 * - Manifest piksel tidak tersedia (build tanpa seni piksel) = seni SVG v3 lama lewat pintu masuk BERPENGAMAN
 *   seni/tokoh/index.ts (galat seni -> siluet), gambar tanpa id lalu awalanId unik per salinan (useId).
 *
 * Aksesibilitas: gambar ini hiasan; nama, peran, dan suasana nasabah sudah ditulis sebagai teks oleh tampilan
 * cerita. Karena itu bawaannya aria-hidden. Beri `label` bila potret berdiri sendiri tanpa teks nama di dekatnya
 * (role="img" + aria-label).
 */

import { memo, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import type { Ekspresi } from '../tipe';
import { NASABAH_H, NASABAH_W, SETENGAH_BADAN as SETENGAH, aturanPotretNasabah, setengahBadanPiksel } from './nasabah';
import { awalanId } from '../ui/panggung/dunia';
import { gambarSiap, langgananPiksel, muatGambar, versiPiksel } from '../ui/panggung/sumberPiksel';
import { skalaPerangkat, useDpr } from '../../game/tokoh';
import { gambarBuRina } from './tokoh';
import { PotretPiksel } from './tokoh/PotretMissRaksa';
import '../../game/tokoh.css';
import './seni.css';

/** Awalan id SVG dari useId (hanya huruf/angka/-). */
function useAwalan(dasar: string): string {
  const mentah = useId();
  return `${dasar}-${mentah.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/** Tinggi tata letak wadah (px CSS) untuk gambar tanpa `tinggi`; null sampai terukur. */
function useTinggiWadah(aktif: boolean): [RefObject<HTMLSpanElement | null>, number | null] {
  const ref = useRef<HTMLSpanElement>(null);
  const [h, setH] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!aktif || !el) return;
    const baca = () => {
      const v = el.clientHeight;
      if (v > 0) setH((l) => (l !== null && Math.abs(l - v) < 0.5 ? l : v));
    };
    baca();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(baca);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aktif]);
  return [ref, h];
}

/**
 * Bu Rina kepala-sampai-pinggang (pose berdiri, kunci di tangan). `tinggi` (px CSS) menetapkan ukuran (dibulatkan ke
 * piksel perangkat bulat per piksel seni); tanpa `tinggi`, gambar setinggi wadahnya (skala bulat terbesar yang muat)
 * dan lebarnya mengikuti rasio. Ganti ekspresi memutar gerak kecil (dimatikan saat "kurangi gerak").
 */
export const TokohNasabah = memo(function TokohNasabah({
  ekspresi,
  tinggi,
  className = '',
}: {
  ekspresi: Ekspresi;
  tinggi?: number;
  className?: string;
}) {
  const awalan = useAwalan('rtk');
  const dpr = useDpr();
  const [ref, tinggiWadah] = useTinggiWadah(!tinggi);
  const piksel = useMemo(() => setengahBadanPiksel(ekspresi), [ekspresi]);
  useSyncExternalStore(langgananPiksel, versiPiksel, versiPiksel);
  useEffect(() => {
    if (piksel && !piksel.url.startsWith('file:')) void muatGambar(piksel.url);
  }, [piksel]);
  const gagal = !!piksel && gambarSiap(piksel.url) === false;
  const dasar = useMemo(() => (piksel ? '' : gambarBuRina({ pose: 'berdiri', ekspresi, pandang: 'pemain', kunci: true }).svg), [piksel, ekspresi]);
  const svg = useMemo(() => (dasar ? awalanId(dasar, awalan) : ''), [dasar, awalan]);

  if (piksel) {
    const d = dpr > 0 ? dpr : 1;
    // skala bulat: `tinggi` = bulat terdekat; tanpa `tinggi` = terbesar yang masih muat di wadah (minimal 1)
    const n = tinggi ? skalaPerangkat(tinggi, piksel.h, d) : Math.max(1, Math.floor(((tinggiWadah ?? piksel.h / d) * d) / piksel.h));
    const w = (n * piksel.w) / d;
    const h = (n * piksel.h) / d;
    return (
      <span
        ref={ref}
        key={ekspresi}
        className={`cseni-tokoh-bingkai cseni-ganti ${className}`}
        style={tinggi ? { width: w, height: h } : { height: '100%', display: 'inline-flex', alignItems: 'flex-end' }}
        data-ekspresi={ekspresi}
        data-seni={gagal ? 'kosong' : 'piksel'}
        data-piksel={n}
        aria-hidden="true"
      >
        {gagal || (!tinggi && tinggiWadah === null) ? null : (
          <svg
            className="cseni-tokoh"
            viewBox={`${piksel.x} ${piksel.y} ${piksel.w} ${piksel.h}`}
            width={w}
            height={h}
            preserveAspectRatio="none"
            focusable="false"
            aria-hidden="true"
            style={{ imageRendering: 'pixelated' }}
            dangerouslySetInnerHTML={{ __html: piksel.svg }}
          />
        )}
      </span>
    );
  }

  const ukuran = tinggi ? { width: Math.round((tinggi * NASABAH_W) / NASABAH_H), height: tinggi } : { height: '100%' };
  return (
    <span ref={ref} key={ekspresi} className={`cseni-tokoh-bingkai cseni-ganti ${className}`} style={ukuran} data-ekspresi={ekspresi} data-seni="svg" aria-hidden="true">
      <svg
        className="cseni-tokoh"
        viewBox={`${SETENGAH.x} ${SETENGAH.y} ${NASABAH_W} ${NASABAH_H}`}
        width={tinggi ? ukuran.width : undefined}
        height={tinggi ? tinggi : undefined}
        focusable="false"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </span>
  );
});

/** SVG potret v3 lama Bu Rina (cadangan bila manifest piksel tidak ada): jendela & versi dari aturanPotretNasabah. */
function isiPotretSvg(ekspresi: Ekspresi, ukuran: number, awalan: string): { svg: string; viewBox: string } | null {
  try {
    const { jendela: J, kecil } = aturanPotretNasabah(ukuran);
    const dasar = gambarBuRina({ pose: 'duduk', ekspresi, pandang: 'pemain', kecil }).svg;
    return { svg: awalanId(dasar, awalan), viewBox: `${J.x} ${J.y} ${J.sisi} ${J.sisi}` };
  } catch {
    return null;
  }
}

/**
 * Potret bulat Bu Rina (kepala & bahu dari frame potret manifest, menatap pemain). Bingkai, latar, dan garis memakai
 * kelas `.tokoh-potret` yang SAMA dengan potret tokoh lain; aturan jendela SAMA dengan potret Miss Raksa (PotretPiksel:
 * jendela manifest keluarga biasa untuk ukuran tampil x devicePixelRatio, skala bulat).
 */
export const PotretNasabah = memo(function PotretNasabah({
  ekspresi = 'netral',
  ukuran = 44,
  label,
  className = '',
}: {
  ekspresi?: Ekspresi;
  /** Sisi potret (px CSS). */
  ukuran?: number;
  /** Nama untuk pembaca layar bila potret tampil tanpa teks nama di dekatnya. */
  label?: string;
  className?: string;
}) {
  const awalan = useAwalan('rpt');
  return (
    <PotretPiksel
      tokoh="buRina"
      ekspresi={ekspresi}
      ukuran={ukuran}
      label={label}
      className={className}
      huruf="B"
      cadanganSvg={() => isiPotretSvg(ekspresi, ukuran, awalan)}
    />
  );
});

