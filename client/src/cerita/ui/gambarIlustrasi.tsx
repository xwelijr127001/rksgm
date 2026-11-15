/**
 * Gambar ILUSTRASI (halus): <img> dengan srcset/sizes (browser memilih berkas sesuai ukuran tampil x DPR, dimuat saat
 * dipakai saja) dan pergantian TANPA KEDIP: saat ekspresi berganti, gambar lama (beserta kotaknya) tetap tampil sampai
 * gambar baru selesai di-decode. Gagal dimuat = cadangan pemanggil. Rendering halus (bawaan browser): aturan pixelated
 * hanya milik seni piksel Episode 1. Juga seni kode episode (Episode.seniArena) sebagai <svg>.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Episode, VarianGambar } from '../tipe';
import { srcsetDari } from './latar/ilustrasi';

/**
 * Nilai yang sedang tampil: berganti ke `nilai` baru hanya setelah gambarnya (`varian` untuk ukuran `sizes`) selesai
 * di-decode. Nilai = data apa pun yang ikut gambar (mis. kotak tokoh), supaya gambar & kotaknya berganti bersamaan.
 */
export function useGambarSiap<T>(nilai: T, varian: readonly VarianGambar[], sizes: string): T {
  const kunci = srcsetDari(varian);
  const [tampil, setTampil] = useState(nilai);
  const kunciTampil = useRef(kunci);
  const terbaru = useRef({ nilai, varian });
  terbaru.current = { nilai, varian };
  useEffect(() => {
    if (kunciTampil.current === kunci) return;
    const { nilai: n, varian: v } = terbaru.current;
    const ganti = () => { kunciTampil.current = kunci; setTampil(n); };
    if (typeof Image === 'undefined') { ganti(); return; }
    let batal = false;
    const img = new Image();
    img.sizes = sizes;
    img.srcset = kunci;
    img.src = v[v.length - 1]!.src;
    // decode() gagal (berkas rusak/404) tetap mengganti: <img> lalu memicu onError -> cadangan pemanggil.
    img.decode().then(() => { if (!batal) ganti(); }, () => { if (!batal) ganti(); });
    return () => { batal = true; };
  }, [kunci, sizes]);
  return kunciTampil.current === kunci ? nilai : tampil;
}

/** <img> ilustrasi tanpa penahan (pemanggil yang memakai useGambarSiap). */
export function ImgIlustrasi({ varian, sizes, className, style, prioritas = false, data, onGagal }: {
  varian: readonly VarianGambar[];
  /** Lebar tampil (atribut sizes, mis. "320px"). */
  sizes: string;
  className?: string;
  style?: CSSProperties;
  /** Gambar adegan pertama: dimuat lebih dulu (fetchpriority high). */
  prioritas?: boolean;
  /** Atribut data-* (penanda uji & gaya). */
  data?: Readonly<Record<string, string | undefined>>;
  onGagal?: () => void;
}) {
  const atribut = Object.fromEntries(Object.entries(data ?? {}).map(([k, v]) => [`data-${k}`, v]));
  return (
    <img
      className={className}
      style={style}
      src={varian[varian.length - 1]!.src}
      srcSet={srcsetDari(varian)}
      sizes={sizes}
      alt=""
      draggable={false}
      fetchPriority={prioritas ? 'high' : 'auto'}
      onError={onGagal}
      {...atribut}
    />
  );
}

/** <img> ilustrasi yang berganti tanpa kedip. */
export function GambarIlustrasi(props: Parameters<typeof ImgIlustrasi>[0]) {
  const v = useGambarSiap(props.varian, props.varian, props.sizes);
  return <ImgIlustrasi {...props} varian={v} />;
}

/** Potret bulat kepala-bahu (avatar ilustrasi) ukuran `ukuran` px; gagal dimuat = huruf awal nama di bingkai yang sama. */
export function PotretIlustrasi({ varian, ukuran, nama = '', className = '' }: { varian: readonly VarianGambar[]; ukuran: number; nama?: string; className?: string }) {
  const [gagal, setGagal] = useState<string | null>(null);
  const kunci = srcsetDari(varian);
  if (gagal === kunci) {
    return <span className={'tokoh-potret cer-potret cer-inisial ' + className} data-potret-cadangan="" aria-hidden="true" style={{ width: ukuran, height: ukuran }}>{nama.slice(0, 1)}</span>;
  }
  return (
    <span className={'cer-potret cer-potret-ilustrasi ' + className} aria-hidden="true" style={{ width: ukuran, height: ukuran }}>
      <GambarIlustrasi varian={varian} sizes={`${ukuran}px`} onGagal={() => setGagal(kunci)} />
    </span>
  );
}

/**
 * Seni kode episode (Episode.seniArena: dokumen, baki, lokasi, cap, ...; SVG milik episode sendiri, bukan masukan
 * pengguna) sebagai <svg>; id tak dikenal = kosong. Hiasan: nama selalu teks.
 */
export function GambarSeni({ ep, id, className = '', style }: { ep: Episode; id?: string; className?: string; style?: CSSProperties }) {
  const s = id ? ep.seniArena?.[id] : undefined;
  if (!s) return null;
  return (
    <svg className={'hp-seni ' + className} style={style} viewBox={`0 0 ${s.w} ${s.h}`} aria-hidden="true" focusable="false"
      dangerouslySetInnerHTML={{ __html: s.svg }} />
  );
}
