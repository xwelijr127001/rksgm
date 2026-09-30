/**
 * Tumpukan dialog modal bersama (Modal & TombolKonfirmasi di ui/kit.tsx, editor soal host).
 *
 * Satu tumpukan untuk seluruh halaman; hanya dialog TERATAS yang aktif:
 *  - Latar `inert`: semua anak <body> selain dialog teratas diberi atribut inert. Nilai lama tiap
 *    elemen dicatat SEKALI (saat pertama disentuh) dan dipulihkan ketika tumpukan kosong, jadi dialog
 *    bertingkat (konfirmasi di atas editor soal) tetap benar.
 *  - Tab / Shift+Tab berputar di dalam dialog teratas.
 *  - Escape hanya untuk dialog teratas; propagasinya dihentikan (lapisan di bawahnya tidak ikut tertutup).
 *  - Gulir halaman dikunci selama ada dialog dan dipulihkan sesudahnya.
 *  - Saat ditutup, fokus kembali ke `kembaliKe`, lalu ke elemen yang fokus saat dialog dibuka, lalu ke
 *    kontrol wajar di halaman (bukan body).
 *
 * Logika inti (`buatTumpukan`, `fokusBerikut`, `terapkanInert`) tidak menyentuh `document` langsung
 * (lihat `Lingkungan`) supaya bisa diuji tanpa browser (modal.test.ts).
 */

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

// ------------------------------------------------------------------ tipe

/** Bagian DOM yang dipakai logika inti (`Diri` = tipe elemennya sendiri). HTMLElement memenuhinya; tes memakai tiruan. */
export interface ElemenDialog<Diri> {
  getAttribute(nama: string): string | null;
  setAttribute(nama: string, nilai: string): void;
  removeAttribute(nama: string): void;
  contains(lain: Diri | null): boolean;
  focus(opsi?: FocusOptions): void;
  readonly isConnected: boolean;
}

/** Tujuan fokus saat dialog ditutup (fungsi dibaca SAAT ditutup, mis. tombol yang digambar ulang). */
export type KembaliKe = HTMLElement | (() => HTMLElement | null) | null | undefined;

/** Peristiwa tombol minimum (KeyboardEvent memenuhinya). */
export interface PeristiwaTombol {
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  isComposing?: boolean;
  defaultPrevented: boolean;
  preventDefault(): void;
  stopPropagation(): void;
}

/** Semua akses ke dokumen lewat sini (DOM sungguhan di `lingkunganDom`, tiruan di tes). */
export interface Lingkungan<E extends ElemenDialog<E>> {
  /** Anak langsung <body> saat ini. */
  anakAkar(): readonly E[];
  /** Elemen yang sedang fokus (null bila body / tidak ada). */
  aktif(): E | null;
  /** Kontrol yang bisa dicapai Tab di dalam `wadah`, urut dokumen. */
  daftarFokus(wadah: E): E[];
  /** Bisa diberi fokus sekarang: terpasang, terlihat, tidak nonaktif, tidak di dalam inert. */
  bisaFokus(el: E): boolean;
  /** Urutan dokumen: negatif bila `a` sebelum `b`. */
  urutan(a: E, b: E): number;
  /** Kontrol wajar di halaman bila tidak ada tujuan fokus lain (bukan body). */
  cadangan(): E | null;
  /** Pastikan wadah bisa difokus lewat skrip (tabindex -1) sebagai pegangan terakhir. */
  siapkanWadah(wadah: E): void;
  /** Tumpukan berubah dari kosong ke berisi (true) atau sebaliknya (false): kunci gulir, pasang pendengar. */
  saatTumpukan(ada: boolean): void;
  /** Jalankan sesudah render selesai (DOM yang dilepas React sudah benar-benar hilang). */
  jadwalkan(fn: () => void): void;
}

export interface OpsiLapisan<E> {
  /** Dipanggil saat Escape ditekan dan lapisan ini teratas. */
  onEscape?: () => void;
  /** Tujuan fokus utama saat ditutup. */
  kembaliKe?: () => E | null;
  /** Elemen yang diberi fokus saat dibuka (bawaan: kontrol pertama, lalu wadah). */
  fokusAwal?: () => E | null;
}

interface Lapisan<E> {
  wadah: E;
  opsi: () => OpsiLapisan<E>;
  /** Elemen yang fokus saat dialog dibuka. */
  pembuka: E | null;
  /** Tujuan cadangan dari lapisan di bawahnya yang ditutup lebih dulu (mis. editor ditutup bersama konfirmasinya). */
  warisan: (() => E | null)[];
}

// ------------------------------------------------------------------ logika murni

/**
 * Elemen berikutnya untuk Tab (maju) / Shift+Tab (mundur) di dalam dialog, berputar di ujung.
 * `aktif` di luar daftar (mis. judul ber-tabindex -1): pakai posisinya di dokumen bila `urutan`
 * diberikan, selain itu mulai dari ujung. Daftar kosong -> null.
 */
export function fokusBerikut<T>(daftar: readonly T[], aktif: T | null, mundur: boolean, urutan?: (a: T, b: T) => number): T | null {
  const n = daftar.length;
  if (n === 0) return null;
  const i = aktif === null ? -1 : daftar.indexOf(aktif);
  if (i >= 0) return daftar[(i + (mundur ? n - 1 : 1)) % n]!;
  if (aktif !== null && urutan) {
    if (mundur) {
      for (let j = n - 1; j >= 0; j--) if (urutan(daftar[j]!, aktif) < 0) return daftar[j]!;
      return daftar[n - 1]!;
    }
    for (const el of daftar) if (urutan(aktif, el) < 0) return el;
    return daftar[0]!;
  }
  return mundur ? daftar[n - 1]! : daftar[0]!;
}

/**
 * Pasang/cabut atribut inert pada anak <body>: semua selain `atas` (dan leluhurnya) inert.
 * `catatan` menyimpan nilai ASLI tiap elemen saat pertama kali disentuh; `atas` null = pulihkan semua.
 */
export function terapkanInert<E extends ElemenDialog<E>>(anak: readonly E[], atas: E | null, catatan: Map<E, string | null>): void {
  if (atas === null) {
    for (const [el, lama] of catatan) pulihkanAtribut(el, lama);
    catatan.clear();
    return;
  }
  // Elemen yang sudah tidak ada di body: pulihkan & lupakan.
  for (const [el, lama] of catatan) {
    if (!anak.includes(el)) {
      pulihkanAtribut(el, lama);
      catatan.delete(el);
    }
  }
  for (const el of anak) {
    if (!catatan.has(el)) catatan.set(el, el.getAttribute('inert'));
    const aktif = el === atas || el.contains(atas);
    if (aktif) el.removeAttribute('inert');
    else if (el.getAttribute('inert') === null) el.setAttribute('inert', '');
  }
}

function pulihkanAtribut(el: ElemenDialog<unknown>, lama: string | null): void {
  if (lama === null) el.removeAttribute('inert');
  else el.setAttribute('inert', lama);
}

/** Tumpukan dialog. Satu instans per dokumen (lihat `tumpukanDom`); tes membuat instans sendiri. */
export function buatTumpukan<E extends ElemenDialog<E>>(env: Lingkungan<E>) {
  const lapisan: Lapisan<E>[] = [];
  const catatanInert = new Map<E, string | null>();
  let nomorBuka = 0;
  /** Tujuan kembali dialog yang baru ditutup, selama pemulihan fokusnya belum berjalan. */
  let tertunda: (() => E | null)[] | null = null;

  const teratas = (): Lapisan<E> | null => lapisan[lapisan.length - 1] ?? null;
  const susunInert = () => terapkanInert(env.anakAkar(), teratas()?.wadah ?? null, catatanInert);

  const di = (wadah: E, el: E | null): boolean => el !== null && (el === wadah || wadah.contains(el));

  /** Fokus ke dalam lapisan: fokusAwal, kontrol pertama, lalu wadah. */
  function fokusKeDalam(l: Lapisan<E>): void {
    const awal = l.opsi().fokusAwal?.() ?? null;
    const tujuan = awal && env.bisaFokus(awal) ? awal : env.daftarFokus(l.wadah)[0] ?? null;
    if (tujuan) {
      tujuan.focus({ preventScroll: true });
      return;
    }
    env.siapkanWadah(l.wadah);
    l.wadah.focus({ preventScroll: true });
  }

  function calonKembali(l: Lapisan<E>): (() => E | null)[] {
    return [() => l.opsi().kembaliKe?.() ?? null, () => l.pembuka, ...l.warisan];
  }

  /** Buka lapisan baru di atas tumpukan. Mengembalikan fungsi tutup (aman dipanggil berkali-kali). */
  function buka(wadah: E, opsi: () => OpsiLapisan<E>, pembuka: E | null = env.aktif()): () => void {
    // Dibuka tepat setelah dialog lain ditutup (mis. konfirmasi berantai): bila pembukanya ikut hilang,
    // fokus kembali ke tujuan dialog sebelumnya.
    const l: Lapisan<E> = { wadah, opsi, pembuka: di(wadah, pembuka) ? null : pembuka, warisan: tertunda ? [...tertunda] : [] };
    lapisan.push(l);
    nomorBuka++;
    if (lapisan.length === 1) env.saatTumpukan(true);
    susunInert();
    // Anak yang sudah memfokus dirinya (autoFocus) dibiarkan.
    if (!di(wadah, env.aktif())) fokusKeDalam(l);
    let tertutup = false;
    return () => {
      if (tertutup) return;
      tertutup = true;
      tutup(l);
    };
  }

  function tutup(l: Lapisan<E>): void {
    const i = lapisan.indexOf(l);
    if (i < 0) return;
    const diPuncak = i === lapisan.length - 1;
    lapisan.splice(i, 1);
    if (!diPuncak) {
      // Lapisan di atasnya mungkin dibuka dari dalam lapisan ini: warisi tujuan kembalinya.
      lapisan[i]!.warisan.push(...calonKembali(l));
      susunInert();
      return;
    }
    susunInert();
    if (lapisan.length === 0) env.saatTumpukan(false);
    const calon = calonKembali(l);
    const nomor = nomorBuka;
    tertunda = calon;
    env.jadwalkan(() => {
      if (tertunda === calon) tertunda = null;
      // Dialog lain sudah dibuka sejak itu (termasuk pasang ulang StrictMode): ia yang mengatur fokus.
      if (nomorBuka !== nomor) return;
      const atas = teratas();
      for (const ambil of calon) {
        const el = ambil();
        if (el && el !== l.wadah && !l.wadah.contains(el) && env.bisaFokus(el) && (!atas || di(atas.wadah, el))) {
          el.focus();
          return;
        }
      }
      if (atas) {
        fokusKeDalam(atas);
        return;
      }
      env.cadangan()?.focus();
    });
  }

  /** Tangani keydown (dipasang di document). true = sudah ditangani. */
  function tombol(e: PeristiwaTombol): boolean {
    const atas = teratas();
    if (!atas || e.defaultPrevented) return false;
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (e.isComposing) return false;
      e.preventDefault();
      e.stopPropagation();
      atas.opsi().onEscape?.();
      return true;
    }
    if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const tujuan = fokusBerikut(env.daftarFokus(atas.wadah), env.aktif(), e.shiftKey, env.urutan);
      if (tujuan) tujuan.focus();
      else fokusKeDalam(atas);
      return true;
    }
    return false;
  }

  /** Tangani focusin: fokus yang lolos ke luar dialog teratas dikembalikan ke dalam. */
  function fokusMasuk(target: E | null): void {
    const atas = teratas();
    if (!atas || target === null || di(atas.wadah, target)) return;
    fokusKeDalam(atas);
  }

  return {
    buka,
    tombol,
    fokusMasuk,
    /** Susun ulang inert (mis. anak body baru muncul selagi dialog terbuka). */
    susunInert,
    jumlah: () => lapisan.length,
    wadahTeratas: () => teratas()?.wadah ?? null,
  };
}

export type TumpukanDialog<E extends ElemenDialog<E>> = ReturnType<typeof buatTumpukan<E>>;

// ------------------------------------------------------------------ DOM

const PEMILIH_FOKUS = [
  'a[href]', 'area[href]', 'button', 'input', 'select', 'textarea', 'iframe', 'summary',
  '[tabindex]', '[contenteditable]:not([contenteditable="false"])', 'audio[controls]', 'video[controls]',
].join(',');

function terlihat(el: HTMLElement): boolean {
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
}

function nonaktif(el: HTMLElement): boolean {
  return (el as HTMLButtonElement).disabled === true || el.closest('fieldset:disabled') !== null;
}

/** Radio: hanya yang terpilih (atau yang pertama bila belum ada) yang dicapai Tab, seperti browser. */
function radioTerjangkau(el: HTMLElement, wadah: HTMLElement): boolean {
  if (!(el instanceof HTMLInputElement) || el.type !== 'radio' || !el.name) return true;
  const grup = Array.from(wadah.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(el.name)}"]`));
  const terpilih = grup.find((r) => r.checked);
  return terpilih ? terpilih === el : grup[0] === el;
}

export function daftarFokusDom(wadah: HTMLElement): HTMLElement[] {
  return Array.from(wadah.querySelectorAll<HTMLElement>(PEMILIH_FOKUS)).filter(
    (el) =>
      el.tabIndex >= 0 &&
      !nonaktif(el) &&
      !(el instanceof HTMLInputElement && el.type === 'hidden') &&
      el.closest('[inert]') === null &&
      terlihat(el) &&
      radioTerjangkau(el, wadah),
  );
}

function bisaFokusDom(el: HTMLElement): boolean {
  if (!el.isConnected || el === document.body || nonaktif(el) || el.closest('[inert]') !== null || !terlihat(el)) return false;
  return el.tabIndex >= 0 || el.hasAttribute('tabindex');
}

function aktifDom(): HTMLElement | null {
  const a = document.activeElement;
  return a instanceof HTMLElement && a !== document.body ? a : null;
}

/** Kontrol wajar di halaman: kontrol pertama di <main>, lalu di #root, lalu judul utama (tabindex -1). */
function cadanganDom(): HTMLElement | null {
  for (const akar of [document.querySelector('main'), document.getElementById('root')]) {
    if (akar instanceof HTMLElement) {
      const pertama = daftarFokusDom(akar)[0];
      if (pertama) return pertama;
    }
  }
  const h = document.querySelector<HTMLElement>('main h1, #root h1, main h2, #root h2');
  if (h && h.closest('[inert]') === null) {
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    return h;
  }
  return null;
}

let gulirLama: { overflow: string; gutter: string } | null = null;

function kunciGulir(kunci: boolean): void {
  const html = document.documentElement;
  const body = document.body;
  if (kunci) {
    if (gulirLama) return;
    gulirLama = { overflow: body.style.overflow, gutter: html.style.getPropertyValue('scrollbar-gutter') };
    // Sisakan ruang batang gulir (desktop) supaya isi halaman tidak bergeser saat dikunci.
    if (window.innerWidth > html.clientWidth) html.style.setProperty('scrollbar-gutter', 'stable');
    // Hanya body (seperti editor soal lama): overflow body diteruskan ke viewport, elemen sticky tetap di tempatnya.
    body.style.overflow = 'hidden';
    return;
  }
  if (!gulirLama) return;
  body.style.overflow = gulirLama.overflow;
  if (gulirLama.gutter) html.style.setProperty('scrollbar-gutter', gulirLama.gutter);
  else html.style.removeProperty('scrollbar-gutter');
  gulirLama = null;
}

let tumpukan: TumpukanDialog<HTMLElement> | null = null;

/** Tumpukan milik dokumen ini (dibuat saat dialog pertama dibuka). */
export function tumpukanDom(): TumpukanDialog<HTMLElement> {
  if (tumpukan) return tumpukan;
  let pengamat: MutationObserver | null = null;
  const onKey = (e: KeyboardEvent) => {
    tumpukan?.tombol(e);
  };
  const onFokus = (e: FocusEvent) => {
    tumpukan?.fokusMasuk(e.target instanceof HTMLElement ? e.target : null);
  };
  tumpukan = buatTumpukan<HTMLElement>({
    anakAkar: () =>
      Array.from(document.body.children).filter(
        (el): el is HTMLElement => el instanceof HTMLElement && !['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK', 'NOSCRIPT'].includes(el.tagName),
      ),
    aktif: aktifDom,
    daftarFokus: daftarFokusDom,
    bisaFokus: bisaFokusDom,
    urutan: (a, b) => (a === b ? 0 : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1),
    cadangan: cadanganDom,
    siapkanWadah: (w) => {
      if (!w.hasAttribute('tabindex')) w.setAttribute('tabindex', '-1');
    },
    saatTumpukan: (ada) => {
      kunciGulir(ada);
      if (ada) {
        // Bubble di document: komponen di dalam dialog boleh menangani Escape-nya sendiri lebih dulu,
        // dan pendengar di window (mis. halaman di belakang) tidak ikut menerima Escape.
        document.addEventListener('keydown', onKey);
        document.addEventListener('focusin', onFokus);
        pengamat = new MutationObserver(() => tumpukan?.susunInert());
        pengamat.observe(document.body, { childList: true });
      } else {
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('focusin', onFokus);
        pengamat?.disconnect();
        pengamat = null;
      }
    },
    jadwalkan: (fn) => queueMicrotask(fn),
  });
  return tumpukan;
}

/** Ada dialog modal terbuka? (untuk pintasan keyboard halaman yang harus diam selama dialog tampil). */
export function adaDialogTerbuka(): boolean {
  return (tumpukan?.jumlah() ?? 0) > 0;
}

function aktifSaatIni(): HTMLElement | null {
  return typeof document === 'undefined' ? null : aktifDom();
}

// ------------------------------------------------------------------ React

export interface OpsiDialog {
  /** Escape saat dialog ini teratas. */
  onEscape?: () => void;
  /** Tujuan fokus saat ditutup; bawaan: elemen yang fokus saat dialog dibuka. */
  kembaliKe?: KembaliKe;
  /** Elemen yang diberi fokus saat dibuka (mis. judul ber-tabindex -1). */
  fokusAwal?: () => HTMLElement | null;
}

/**
 * Daftarkan `wadahRef` (anak langsung <body>, mis. lewat createPortal) sebagai lapisan dialog selama
 * komponen terpasang. Opsi dibaca terbaru setiap kali dipakai (onEscape boleh berganti tiap render).
 */
export function useLapisanDialog(wadahRef: RefObject<HTMLElement | null>, opsi: OpsiDialog): void {
  // Elemen pembuka dibaca saat render pertama: sebelum anak ber-autoFocus sempat mengambil fokus.
  const [pembuka] = useState(aktifSaatIni);
  const opsiRef = useRef(opsi);
  useLayoutEffect(() => {
    opsiRef.current = opsi;
  });
  useLayoutEffect(() => {
    const wadah = wadahRef.current;
    if (!wadah) return;
    return tumpukanDom().buka(
      wadah,
      () => {
        const o = opsiRef.current;
        return {
          onEscape: o.onEscape,
          fokusAwal: o.fokusAwal,
          kembaliKe: () => (typeof o.kembaliKe === 'function' ? o.kembaliKe() : o.kembaliKe ?? null),
        };
      },
      pembuka && pembuka.isConnected ? pembuka : aktifDom(),
    );
  }, [wadahRef, pembuka]);
}

/** true bila isi `ref` lebih tinggi dari kotaknya (perlu digulir); diukur ulang saat ukuran berubah. */
export function useBisaGulir(ref: RefObject<HTMLElement | null>): boolean {
  const [bisa, setBisa] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ukur = () => setBisa(el.scrollHeight > el.clientHeight + 1);
    ukur();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    for (const anak of Array.from(el.children)) ro.observe(anak);
    return () => ro.disconnect();
  }, [ref]);
  return bisa;
}

/**
 * Jarak gulir untuk tombol panah/halaman saat fokus di judul dialog (belum di wilayah isi).
 * null = bukan tombol gulir. 'awal' / 'akhir' untuk Home / End.
 */
export function gulirUntukTombol(key: string, tinggiKotak: number): number | 'awal' | 'akhir' | null {
  switch (key) {
    case 'ArrowDown': return 40;
    case 'ArrowUp': return -40;
    case 'PageDown': return Math.max(40, Math.round(tinggiKotak * 0.9));
    case 'PageUp': return -Math.max(40, Math.round(tinggiKotak * 0.9));
    case 'Home': return 'awal';
    case 'End': return 'akhir';
    default: return null;
  }
}

/** Kelas tema halaman yang ikut dibawa ke portal (gaya pemain di player.css bergantung pada leluhur `.player-ui`). */
const KELAS_KONTEKS = ['player-ui', 'proyektor'] as const;

export function kelasKonteks(asal: HTMLElement | null): string {
  if (typeof document === 'undefined') return '';
  return KELAS_KONTEKS.filter((k) => (asal?.closest(`.${k}`) ?? document.querySelector(`#root .${k}`)) !== null).join(' ');
}
