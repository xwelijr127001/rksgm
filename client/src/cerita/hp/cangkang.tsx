/**
 * T-018 Tahap 2 (D-132, D-133, D-134): CANGKANG LAYAR untuk adegan tatap muka, aktivitas, dan layar akhir di HP. Halaman tidak
 * menggulir: kepala disematkan, SATU wilayah menggulir, tombol utama disematkan di bawah. Berlaku dari tinggi layar 560 px
 * (obrolan Tahap 1: 480); desktop >= 1024 dan layar lebih pendek = halaman biasa.
 *
 * Bagian yang disematkan dipindah dengan portal ke slot milik cangkang (urutan baca tetap wajar: kepala, isi, tombol kirim):
 *  - SlotKepalaArena: baris pertanyaan aktivitas (dan baris rambu K08) -> di bawah kepala aktivitas;
 *  - SlotKirimArena: tombol kirim aktivitas -> bilah bawah. Tanpa slot (desktop) semuanya tetap di tempatnya.
 */
import { createContext, useContext, useEffect, useState, type Context, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Kueri cangkang layar: HARUS sama dengan @media "T-018 Tahap 2" di desain.css. */
export const KUERI_CANGKANG_LAYAR = '(max-width: 1023.98px) and (min-height: 560px)';

export function useKueri(kueri: string): boolean {
  const [v, setV] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(kueri).matches);
  useEffect(() => {
    const m = window.matchMedia(kueri);
    const f = () => setV(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [kueri]);
  return v;
}

export const SlotKepalaArena = createContext<HTMLElement | null>(null);
export const SlotKirimArena = createContext<HTMLElement | null>(null);

/** Anak dipindah ke slot konteks `ke` bila slot ada (cangkang HP); selain itu tampil di tempat. */
export function KeSlot({ ke, children }: { ke: Context<HTMLElement | null>; children: ReactNode }) {
  const slot = useContext(ke);
  return slot ? createPortal(children, slot) : <>{children}</>;
}
