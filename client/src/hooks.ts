/** Hook kecil yang dipakai di banyak halaman. */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudioPrefs, subscribeAudio, type AudioPrefs } from './audio/audio';
import { serverNow } from './state/store';
import { gerakDikurangi, gerakPenuhDipaksa, pantauGerak, sistemMintaKurang } from './gerak';

/**
 * Hitung mundur berbasis jam SERVER (tidak bisa dicurangi di client).
 * @returns detik tersisa (dibulatkan ke atas) dan rasio 0..1
 */
export function useCountdown(endsAt: number | null, durationMs: number | null) {
  const [now, setNow] = useState(() => serverNow());

  useEffect(() => {
    if (endsAt === null) return;
    setNow(serverNow());
    const id = window.setInterval(() => setNow(serverNow()), 200);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (endsAt === null) return { remainingMs: null, seconds: null, ratio: null } as const;
  const remainingMs = Math.max(0, endsAt - now);
  const ratio = durationMs && durationMs > 0 ? Math.min(1, Math.max(0, remainingMs / durationMs)) : null;
  return { remainingMs, seconds: Math.ceil(remainingMs / 1000), ratio } as const;
}

export function useAudioPrefs(): AudioPrefs {
  const [prefs, setPrefs] = useState<AudioPrefs>(() => getAudioPrefs());
  useEffect(() => subscribeAudio(setPrefs), []);
  return prefs;
}

/** true bila animasi harus dikurangi: perangkat memintanya dan tidak dinyalakan paksa (lihat gerak.ts). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && gerakDikurangi());
  useEffect(() => pantauGerak(() => setReduced(gerakDikurangi())), []);
  return Boolean(reduced);
}

/** Untuk tombol "Nyalakan animasi": apakah perangkat meminta gerak dikurangi, dan apakah sudah dinyalakan paksa. */
export function useSetelanGerak(): { sistemKurang: boolean; dipaksa: boolean } {
  const baca = () => ({ sistemKurang: sistemMintaKurang(), dipaksa: gerakPenuhDipaksa() });
  const [s, setS] = useState(baca);
  useEffect(() => pantauGerak(() => setS(baca())), []);
  return s;
}

/** Jalankan callback sekali saat nilai berubah menjadi sesuatu yang baru. */
export function useOnChange<T>(value: T, fn: (next: T, prev: T | undefined) => void) {
  const prev = useRef<T | undefined>(undefined);
  useEffect(() => {
    if (prev.current !== value) {
      fn(value, prev.current);
      prev.current = value;
    }
  }, [value, fn]);
}

/** State yang tersimpan di localStorage (untuk preferensi, bukan skor). */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* abaikan */
      }
    },
    [key],
  );
  return [value, update] as const;
}
