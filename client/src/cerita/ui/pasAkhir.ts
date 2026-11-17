/**
 * T-024: layar akhir SATU LAYAR di cangkang HP (LayarAkhir `satuLayar`): isi kartu tidak pernah menggulir. Kartu mengisi ruang
 * antara kepala cerita dan bilah aksi. Angka blok = mock Designer (DESIGN-REVIEW "T-024 - mock", D-226): dengan teks hari ini
 * semua muat di 390 x 645 dan 360 x 640 dan aturan di bawah tidak pernah terpakai; aturan ini untuk layar yang lebih pendek,
 * teks yang lebih panjang, atau huruf sistem yang diperbesar.
 *
 * Urutan mengalah (spec T-024 + mock):
 *   1. grafik menyusut sendiri 72 -> 56 px (CSS: flex 0 1 72px, min-height 56px; tidak ada informasi yang hilang);
 *   2. `tanpa-sebab`    kalimat sebab disembunyikan (44 px dengan jaraknya; kalimat utuhnya pindah ke lembar Pelajaran);
 *   3. `tanpa-legenda`  baris legenda di atas token ikut disembunyikan (20 px);
 *   4. `gulir`          jaring pengaman: HANYA kartu yang menggulir, halaman dan bilah aksi tetap diam.
 * Token dan Pelajaran tidak pernah dipotong. Langkah 2-4 ditulis ke kartu sebagai atribut `data-pas` (akhir.css).
 *
 * MELONGGAR (D-245, review Designer T-024): aturan yang sama dijalankan ke arah sebaliknya di layar TINGGI (>= TINGGI_LEGA;
 * 390 x 844 punya 256 px kosong di bawah Pelajaran sementara dua teksnya masih terpotong dua baris). Selama muat, berurutan:
 *   1. `pelajaran`  teks Pelajaran utuh (tanpa potongan dua baris);
 *   2. `sebab`      kalimat sebab utuh;
 *   3. `grafik`     grafik mengambil sisa ruang sampai 96 px (CSS: flex 1 1 72px, max-height 96px).
 * Langkah berhenti di yang pertama tidak muat, dan teks utuh tidak pernah dibayar dengan grafik di bawah 72 px. Ditulis sebagai
 * `data-lega` (daftar kata). Di 390 x 645 dan 360 x 640 (ukuran mock) tidak pernah melonggar: angka mock tetap berlaku di sana.
 * Kedua lembar (Pelajaran, kalimat sebab) tidak berubah.
 */
import { useLayoutEffect, type RefObject } from 'react';

export type PasAkhir = 'utuh' | 'tanpa-sebab' | 'tanpa-legenda' | 'gulir';

/** Susunan dari yang terkaya; yang pertama muat dipakai. */
export const URUTAN_PAS: readonly PasAkhir[] = ['utuh', 'tanpa-sebab', 'tanpa-legenda', 'gulir'];

/** Susunan pertama (urut URUTAN_PAS) yang `muat`; `gulir` selalu muat (tidak ditanyakan). Murni: diuji tanpa browser. */
export function pilihPas(muat: (pas: PasAkhir) => boolean): PasAkhir {
  for (const pas of URUTAN_PAS) if (pas === 'gulir' || muat(pas)) return pas;
  return 'gulir';
}

/** Tinggi layar (px CSS) mulai mana kartu boleh melonggar (D-245); di bawahnya angka mock dipakai apa adanya. */
export const TINGGI_LEGA = 700;
export type LegaAkhir = 'pelajaran' | 'sebab' | 'grafik';
/** Urutan melonggar; tiap langkah hanya dicoba bila langkah sebelumnya muat. */
export const URUTAN_LEGA: readonly LegaAkhir[] = ['pelajaran', 'sebab', 'grafik'];

/** Awalan terpanjang URUTAN_LEGA yang setiap langkahnya `muat` (berhenti di langkah pertama yang tidak muat). Murni. */
export function pilihLega(muat: (lega: readonly LegaAkhir[]) => boolean): LegaAkhir[] {
  const hasil: LegaAkhir[] = [];
  for (const l of URUTAN_LEGA) {
    if (!muat([...hasil, l])) break;
    hasil.push(l);
  }
  return hasil;
}

/** Ruang kosong (px) di bawah blok terakhir kartu, di atas bantalan bawahnya; negatif = isi meluap. */
export function luangKartu(el: HTMLElement): number {
  const kotak = el.getBoundingClientRect();
  const gaya = getComputedStyle(el);
  const batas = kotak.bottom - (parseFloat(gaya.paddingBottom) || 0) - (parseFloat(gaya.borderBottomWidth) || 0);
  let bawah = kotak.top;
  for (const c of Array.from(el.children)) {
    if (c.classList.contains('sr-only')) continue;
    const r = c.getBoundingClientRect();
    if (r.height > 0) bawah = Math.max(bawah, r.bottom);
  }
  return batas - bawah;
}

/**
 * Pilih susunan untuk kartu akhir satu layar `el` dan tulis `data-pas`-nya; `bolehLega` (layar tinggi) = sesudah itu coba
 * melonggar dan tulis `data-lega`. Idempoten (hasil hanya bergantung pada ukuran).
 */
export function sesuaikanAkhir(el: HTMLElement, bolehLega = false): PasAkhir {
  if (el.scrollTop) el.scrollTop = 0;
  el.removeAttribute('data-lega');
  // Kartu memotong luapan, jadi mencoba susunan satu per satu di sini tidak pernah terlihat (semuanya sebelum digambar).
  const pas = pilihPas((p) => {
    el.setAttribute('data-pas', p);
    return luangKartu(el) >= -0.5;
  });
  if (pas !== 'utuh' || !bolehLega) return pas;
  const grafik = el.querySelector<HTMLElement>('.akh-grafik-ringkas');
  const lega = pilihLega((l) => {
    el.setAttribute('data-lega', l.join(' '));
    return luangKartu(el) >= -0.5 && (!grafik || grafik.getBoundingClientRect().height >= 71.5);
  });
  if (lega.length) el.setAttribute('data-lega', lega.join(' '));
  else el.removeAttribute('data-lega');
  return pas;
}

/**
 * Jaga susunan kartu akhir satu layar selama `aktif`: diukur sebelum digambar, lalu lagi saat ukuran kartu / blok bertanda
 * `data-pas-pantau` berubah (putar layar, ganti bahasa, fon selesai dimuat). `kunci` = apa pun yang mengubah isi kartu.
 */
export function usePasAkhir(ref: RefObject<HTMLElement | null>, aktif: boolean, kunci: string): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!aktif || !el) return;
    let hidup = true;
    const jalan = () => { if (hidup && el.isConnected) sesuaikanAkhir(el, window.innerHeight >= TINGGI_LEGA); };
    jalan();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(jalan);
    ro?.observe(el);
    // Blok yang tingginya mengikuti teks (kepala, judul, strip): berubah = teks melipat ulang.
    for (const x of Array.from(el.querySelectorAll('[data-pas-pantau]'))) ro?.observe(x);
    // Fon web selesai dimuat sesudah layar tampil (bobot yang baru dipakai di sini): lebar teks berubah tanpa mengubah kotak.
    const fon = document.fonts;
    void fon?.ready.then(jalan).catch(() => undefined);
    fon?.addEventListener?.('loadingdone', jalan);
    return () => { hidup = false; ro?.disconnect(); fon?.removeEventListener?.('loadingdone', jalan); };
  }, [ref, aktif, kunci]);
}
