/**
 * T-018 Tahap 1 (layar obrolan tidak menggulir halaman). Di HP, obrolan = cangkang setinggi layar: kepala disematkan, SATU
 * penggulir (.hp-gulir: pesan + "ekor"), komposer disematkan di bawah. Ekor = ujung penggulir tempat isi komposer yang TINGGI
 * (pertanyaan + daftar balasan) ditaruh, supaya yang disematkan hanya tombol utamanya (Kirim) dan pesan tetap terbaca.
 */
import { createContext } from 'react';

/** Kueri cangkang: HARUS sama dengan @media "T-018" di desain.css. Di luar kueri (desktop >= 1024, layar sangat pendek) = halaman biasa. */
export const KUERI_CANGKANG = '(max-width: 1023.98px) and (min-height: 480px)';
/** Jarak (px) dari posisi terbaru yang masih dianggap "mengikuti": lebih jauh = pesan baru hanya ditandai pil. */
export const BATAS_IKUT = 80;
/** Elemen ekor penggulir obrolan (null = bukan cangkang: komposer tampil utuh di tempatnya). */
export const EkorObrolan = createContext<HTMLElement | null>(null);
