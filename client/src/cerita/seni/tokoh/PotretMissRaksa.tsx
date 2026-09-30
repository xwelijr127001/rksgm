/**
 * Potret bulat tokoh cerita di LUAR panggung (kotak dialog 52/44 px, Riwayat 32, label "Pelajaran" kartu akhir 32,
 * kartu akhir 56-88, hub /cerita 56, pemandu aktivitas 44): SENI PIKSEL v4 dari penyusun seni/piksel (atlas + manifest
 * yang SAMA dengan panggung), `PotretPiksel` dipakai bersama oleh PotretMissRaksa (di sini) dan PotretNasabah
 * (TokohNasabah.tsx).
 *
 * - Ukuran TAMPIL < BATAS_IKON_PX (44 px CSS): IKON KEPALA MINI gambar tangan (seni/piksel/ikon.ts): kepala utuh
 *   (sanggul Miss Raksa / hijab & bros Bu Rina) + kerah, 1 piksel ikon = 1 px CSS x dpr pada slot 32. Jendela 1:1
 *   manifest di ukuran ini hanya memuat wajah (terbaca cakram kulit botak; temuan verifikasi 28 Sep).
 *
 * - Jendela potret manifest keluarga BIASA (kepala-bahu; `dekat` terlalu rapat: lingkaran hampir penuh kulit), frame
 *   potret manifest (Miss Raksa duduk-dengar-kiri, Bu Rina duduk) + wajah ekspresi. Jendela dipilih untuk ukuran
 *   TAMPIL (px CSS) bila devicePixelRatio bulat (1, 2, 3: potongan sama di semua perangkat, skala perangkat = skala
 *   jendela x dpr), selain itu untuk ukuran tampil x dpr (piksel perangkat). Jadi satu piksel seni selalu
 *   `data-piksel` piksel perangkat BULAT (potretTokoh: skala bulat, viewBox pas) dengan image-rendering pixelated;
 *   tidak pernah skala pecahan.
 * - Ukuran tampil diukur dari kotak potret (ResizeObserver), bukan hanya prop `ukuran`: CSS halaman boleh menimpa
 *   ukuran (kartu akhir 80/88/56 px) dan jendela tetap dipilih untuk ukuran yang benar-benar tampil.
 * - Atlas PNG dimuat & didekode lewat pemuat panggung (ui/panggung/sumberPiksel: satu permintaan untuk panggung &
 *   potret). Atlas GAGAL dimuat = huruf awal di bingkai yang sama (tidak pernah menghentikan halaman). Manifest piksel
 *   tidak tersedia (build tanpa seni piksel) = potret SVG v3 lama sebagai cadangan (`cadanganSvg`).
 * - Bingkai memakai kelas `.tokoh-potret` yang sama dengan PotretTokoh (potret seragam di seluruh game).
 * - Aksesibilitas: hiasan (aria-hidden) karena nama & peran pembicara selalu ditulis sebagai teks; beri `label` bila
 *   potret berdiri sendiri (role="img" + aria-label).
 * - Arah pandang (`pandang`) hanya dipakai potret SVG cadangan; potret piksel memakai arah jendela manifest (menatap
 *   pemain).
 */
import { memo, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import type { ArahPandang, Ekspresi } from '../../tipe';
import { awalanId } from '../../ui/panggung/dunia';
import { gambarSiap, langgananPiksel, muatGambar, versiPiksel } from '../../ui/panggung/sumberPiksel';
import { ukuranPermintaanPotret, useDpr } from '../../../game/tokoh';
import { URL_ATLAS_PIKSEL, type IdTokohPiksel } from '../piksel';
import { BATAS_IKON_PX, potretPiksel, type IsiPotret } from '../nasabah';
import { potretMissRaksa } from './missRaksa';
import { missRaksaSementara } from './sementara';
import { JENDELA_POTRET_V3, POTRET_KECIL_MAKS_PX } from './ukuran';
import '../../../game/tokoh.css';
import '../seni.css';

/** Batas potret kecil seni SVG lama (= ukuran.ts POTRET_KECIL_MAKS_PX); dipertahankan untuk pemakai lama. */
export const POTRET_KECIL_MAKS = POTRET_KECIL_MAKS_PX;

/** Ukuran tampil kotak (px CSS, lebar tata letak tanpa transform): prop `ukuran` sampai kotak terukur. */
function useUkuranTampil(ukuran: number): [RefObject<HTMLSpanElement | null>, number] {
  const ref = useRef<HTMLSpanElement>(null);
  const [terukur, setTerukur] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const baca = () => {
      const w = el.clientWidth;
      if (w > 0) setTerukur((l) => (l !== null && Math.abs(l - w) < 0.5 ? l : w));
    };
    baca();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(baca);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, terukur ?? ukuran];
}

/**
 * Potret bulat piksel satu tokoh (bingkai .tokoh-potret). `cadanganSvg` = potret SVG bila tokoh ini tidak punya seni
 * piksel; null/galat = huruf awal. Atlas gagal dimuat = huruf awal.
 */
export const PotretPiksel = memo(function PotretPiksel({
  tokoh,
  ekspresi,
  ukuran,
  label,
  className = '',
  huruf,
  cadanganSvg,
}: {
  tokoh: IdTokohPiksel;
  ekspresi: Ekspresi;
  /** Sisi potret (px CSS) yang diminta; ukuran tampil diukur ulang dari kotak. */
  ukuran: number;
  label?: string;
  className?: string;
  /** Huruf awal cadangan terakhir. */
  huruf: string;
  cadanganSvg?: () => IsiPotret | null;
}) {
  const [ref, tampil] = useUkuranTampil(ukuran);
  const dpr = useDpr();
  const { px, kali } = ukuranPermintaanPotret(tampil, dpr);
  // Slot kecil (< 44 px CSS tampil): ikon kepala mini, bukan jendela wajah 1:1.
  const ikon = tampil < BATAS_IKON_PX;
  const piksel = useMemo(() => potretPiksel(tokoh, ekspresi, px, { ikon }), [tokoh, ekspresi, px, ikon]);
  // Status dekode atlas (pemuat panggung memberi tahu saat gagal): gagal = huruf awal.
  useSyncExternalStore(langgananPiksel, versiPiksel, versiPiksel);
  const url = piksel?.url ?? URL_ATLAS_PIKSEL[tokoh];
  useEffect(() => {
    if (piksel && url && !url.startsWith('file:')) void muatGambar(url);
  }, [piksel, url]);
  const gagal = !!piksel && gambarSiap(url) === false;
  // Cadangan SVG hanya bila tokoh ini tanpa seni piksel (generator SVG sudah ber-cache sendiri).
  const svg = piksel ? null : (cadanganSvg?.() ?? null);
  const aria = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };
  let isi: ReactNode;
  if (piksel && !gagal) {
    isi = (
      <svg
        width={tampil}
        height={tampil}
        viewBox={piksel.viewBox}
        preserveAspectRatio="none"
        focusable="false"
        aria-hidden="true"
        style={{ imageRendering: 'pixelated' }}
        dangerouslySetInnerHTML={{ __html: piksel.svg }}
      />
    );
  } else if (!piksel && svg) {
    isi = <svg width={tampil} height={tampil} viewBox={svg.viewBox} focusable="false" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg.svg }} />;
  } else {
    isi = (
      <span aria-hidden="true" className="cseni-potret-huruf" style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: Math.round(tampil * 0.45) }}>
        {huruf}
      </span>
    );
  }
  return (
    <span
      ref={ref}
      className={`tokoh-potret cseni-potret ${className}`}
      style={{ width: ukuran, height: ukuran }}
      data-tokoh={tokoh}
      data-ekspresi={ekspresi}
      data-seni={piksel && !gagal ? 'piksel' : !piksel && svg ? 'svg' : 'huruf'}
      data-piksel={piksel && !gagal ? piksel.skala * kali : undefined}
      data-jendela={piksel ? piksel.asal : undefined}
      data-ukuran-px={px}
      {...aria}
    >
      {isi}
    </span>
  );
});

/** SVG potret v3 lama (cadangan bila manifest piksel tidak ada); null = gambar & siluet gagal. */
function isiPotret(ekspresi: Ekspresi, ukuran: number, pandang: ArahPandang, id: string): IsiPotret | null {
  try {
    // tanpa `id`: satu entri cache untuk semua salinan; awalan unik per salinan sesudahnya
    const r = potretMissRaksa({ ekspresi, ukuran, pandang });
    return { ...r, svg: awalanId(r.svg, id) };
  } catch {
    try {
      const J = JENDELA_POTRET_V3;
      return { svg: missRaksaSementara({ pose: 'duduk-dengar', ekspresi }).svg, viewBox: `${J.x} ${J.y} ${J.sisi} ${J.sisi}` };
    } catch {
      return null;
    }
  }
}

export const PotretMissRaksa = memo(function PotretMissRaksa({
  ekspresi = 'netral',
  ukuran = 44,
  label,
  className = '',
  pandang = 'pemain',
}: {
  ekspresi?: Ekspresi;
  /** Sisi potret (px CSS). */
  ukuran?: number;
  /** Nama untuk pembaca layar bila potret tampil tanpa teks nama di dekatnya. */
  label?: string;
  className?: string;
  /** Arah pandang potret SVG cadangan (bawaan: ke pemain/penonton). */
  pandang?: ArahPandang;
}) {
  const id = `pmr${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  return (
    <PotretPiksel
      tokoh="missRaksa"
      ekspresi={ekspresi}
      ukuran={ukuran}
      label={label}
      className={className}
      huruf="M"
      cadanganSvg={() => isiPotret(ekspresi, ukuran, pandang, id)}
    />
  );
});
