/**
 * T-052: karakter pilihan pemain (profil.look) untuk pemutar cerita HP. PemainHP menyediakannya sekali; gelembung pesan pemain,
 * lembar balasan, dan kartu petugas di layar akhir membacanya tanpa meneruskan prop ke setiap lapis.
 */
import { createContext, useContext } from 'react';
import type { PlayerLook } from '@shared/types';
import { AvatarPiksel } from '../../art/AvatarPiksel';

export const LookPemain = createContext<PlayerLook | null>(null);

export const useLookPemain = (): PlayerLook | null => useContext(LookPemain);

/** Potret piksel pemain (hiasan: nama "Kamu" sudah dibaca dari teks di sebelahnya). Tanpa profil = tidak digambar. */
export function PotretSaya({ ukuran = 32, className = '' }: { ukuran?: number; className?: string }) {
  const look = useLookPemain();
  if (!look) return null;
  return <span className={'hp-potret-saya ' + className} aria-hidden="true"><AvatarPiksel look={look} ukuran={ukuran} /></span>;
}
