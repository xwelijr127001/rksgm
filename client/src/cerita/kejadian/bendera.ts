/**
 * Bendera PROTOTIPE "Kejadian" (irisan K10, dua menit). Build biasa: `KEJADIAN` false, jadi halaman dan kodenya tidak
 * ikut dibundel. Build prototipe: VITE_KEJADIAN=1 (lihat `define` di vite.config.ts). Pola sama dengan meja kasus K11.
 */
declare const __KEJADIAN__: boolean | undefined;
export const KEJADIAN: boolean = typeof __KEJADIAN__ === 'boolean' ? __KEJADIAN__ : false;
