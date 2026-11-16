/**
 * T-021: telepon di tangan Miss Raksa (lapisan tambahan di atas pose berdiri di balik meja kantor), dipakai transisi panggung
 * kantor <-> obrolan WhatsApp. Seni: character/miss-raksa-pixel-v4/telepon-v2/ (README = offset dan urutan lapis). Keadaan kecil di
 * luar React supaya PanggungPiksel bisa menggambarnya tanpa prop baru di sepanjang jalur adegan.
 *
 * Offset dalam koordinat bingkai `berdiri-kanan` (61 x 184, jangkar kaki (33, 183)); 1 piksel seni = SATUAN_RUANG satuan dunia.
 * Urutan lapis: badan + wajah, sel lengan, punggung telepon, lalu lapisan meja (z 30) yang menutup baris 89 ke bawah.
 */
import { useSyncExternalStore } from 'react';
import urlLengan from '../../../seni/piksel/telepon/lengan-dua.png';
import urlPunggung from '../../../seni/piksel/telepon/punggung-telepon.png';
import urlGelembung from '../../../seni/piksel/telepon/gelembung-notif.png';
import { muatPng } from './muat';

export interface TeleponTangan {
  /** Id tokoh di panggung (pemeran), mis. 'missRaksa'. */
  tokoh: string;
  /** 0 = mengangkat (telepon rendah, tepat di atas meja); 1 = membaca (telepon di dada). */
  sel: 0 | 1;
  /** Gelembung notifikasi di samping kepala (bingkai pertama). */
  gelembung?: boolean;
}

export const SENI_TELEPON = {
  lengan: { url: urlLengan, w: 56, h: 39, x: 2, y: 54 },
  punggung: { url: urlPunggung, w: 9, h: 15, x: 26, y: [69, 56] as const },
  gelembung: { url: urlGelembung, w: 18, h: 16, x: 50, y: 18 },
  /** Pusat layar telepon pada sel membaca = sasaran kamera / zoom. */
  pusat: { x: 30.5, y: 63.5 },
} as const;

let kini: TeleponTangan | null = null;
const pendengar = new Set<() => void>();
const langganan = (f: () => void) => { pendengar.add(f); return () => { pendengar.delete(f); }; };

export function aturTeleponTangan(v: TeleponTangan | null): void {
  if (kini === v || (kini && v && kini.tokoh === v.tokoh && kini.sel === v.sel && !!kini.gelembung === !!v.gelembung)) return;
  kini = v;
  for (const f of pendengar) f();
}
export function useTeleponTangan(): TeleponTangan | null {
  return useSyncExternalStore(langganan, () => kini, () => null);
}
/** Muat ketiga PNG lebih dulu (kecil; di build tersisip sebagai data URI). */
export function siapkanTeleponTangan(): Promise<unknown> {
  return Promise.all([urlLengan, urlPunggung, urlGelembung].map(muatPng)).catch(() => null);
}
