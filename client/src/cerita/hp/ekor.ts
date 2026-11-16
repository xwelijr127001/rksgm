/**
 * T-018 Tahap 1 (layar obrolan tidak menggulir halaman). Di HP, obrolan = cangkang setinggi layar: kepala disematkan, SATU
 * penggulir (.hp-gulir: pesan + "ekor"), komposer disematkan di bawah. Ekor = ujung penggulir untuk sisipan (istilah, ringkasan
 * rambu). Tahap 1b: daftar balasan TIDAK lagi di ekor; ia menjadi lembar balasan di komposer (PilihBalasan.tsx).
 */
import { createContext } from 'react';

/** Kueri cangkang: HARUS sama dengan @media "T-018" di desain.css. Di luar kueri (desktop >= 1024, layar sangat pendek) = halaman biasa. */
export const KUERI_CANGKANG = '(max-width: 1023.98px) and (min-height: 480px)';
/** Jarak (px) dari posisi terbaru yang masih dianggap "mengikuti": lebih jauh = pesan baru hanya ditandai pil. */
export const BATAS_IKUT = 80;
/**
 * true = komposer berada di cangkang obrolan HP: keputusan tampil sebagai LEMBAR BALASAN ringkas (T-018 Tahap 1b, D-128) yang
 * naik dari komposer. false (desktop, adegan tatap muka) = blok keputusan lama.
 */
export const LembarObrolan = createContext(false);
