/**
 * T-021 (owner GO 16 Nov 2026, varian POV): adegan pendek saat panggung kantor menyerahkan cerita ke obrolan WhatsApp dan kembali.
 *
 * MAJU (penuh 1.000 md): 0-350 Miss Raksa mengangkat telepon dengan dua tangan (sel lengan 0 lalu 1, digambar DI kanvas panggung
 * di bawah lapisan meja) dan kamera mendekat; 350-800 gambar sudut pandang (POV) menggantikan gambar panggung 1 : 1 lalu
 * membesar dalam langkah bulat sampai layar teleponnya memenuhi kotak panggung; 800-1.000 obrolan tampil di tempat panggung
 * (penutup hijau memudar, isi obrolan turun 8 px). BALIK (700 md): bingkai yang sama mundur: layar mengecil 300, telepon turun
 * 250, kamera kembali 150. Versi PENDEK (300 md) sesudah versi penuh pernah diputar di Bagian yang sama. Ketuk = langsung ke
 * keadaan akhir. Gerak dikurangi = potong langsung seperti sebelumnya (tidak ada bingkai sama sekali).
 *
 * Aturan cangkang T-018: tidak ada yang menambah tinggi halaman. Lapisan POV = position: fixed tepat di atas kotak panggung
 * (overflow tersembunyi), jadi kotak panggung tidak berubah ukuran selama gerak dan halaman tidak pernah menggulir.
 *
 * Titik serah (keputusan Lead, D-169 / D-170) = Episode.serahTelepon: hanya dua. Obrolan lain tidak berubah.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '../../hooks';
import urlPov from '../seni/piksel/telepon/pov-366x229.png';
import type { Episode, StateCerita } from '../tipe';
import { aturTeleponTangan, siapkanTeleponTangan } from '../ui/latar/piksel/teleponTangan';
import { muatPng } from '../ui/latar/piksel/muat';
import { pandangKini } from './alur';
import './transisiTelepon.css';

/** Persegi layar telepon di gambar POV 366 x 229 (README telepon-v2). */
export const POV = { w: 366, h: 229, layar: { x: 144, y: 32, w: 78, h: 154 } } as const;
export const DURASI = { maju: 1000, balik: 700, pendek: 300 } as const;

type Arah = 'maju' | 'balik';
/** Tahap yang digambar. lengan0/lengan1 = sel lengan di kanvas; pov = gambar POV berskala `skala`; tutup = penutup memudar. */
export interface Bingkai { pada: number; lengan: 0 | 1 | null; gelembung?: boolean; dekat: boolean; pov: number | null; tutup?: boolean; obrolan: boolean }

/**
 * Skala POV untuk kotak panggung W x H, bilangan BULAT saja (D-212 / D-213): `awal` = skala bulat terkecil yang gambarnya menutupi
 * seluruh kotak (tanpa pita kosong; gambar di tengah kotak, berskala terhadap pusat layar telepon), `penuh` = skala bulat terkecil
 * yang LAYAR teleponnya menutupi seluruh kotak.
 */
export function skalaPov(w: number, h: number): { awal: number; penuh: number } {
  const cx = POV.layar.x + POV.layar.w / 2, cy = POV.layar.y + POV.layar.h / 2;
  const kiri = (w - POV.w) / 2, atas = (h - POV.h) / 2;
  const awal = Math.max(1, Math.ceil(Math.max((kiri + cx) / cx, (w - kiri - cx) / (POV.w - cx), (atas + cy) / cy, (h - atas - cy) / (POV.h - cy)) - 1e-6));
  const penuh = Math.max(awal, Math.ceil(Math.max(w / POV.layar.w, h / POV.layar.h) - 1e-6));
  return { awal, penuh };
}
/** Garis waktu (md sejak mulai). `obrolan` = tampilan obrolan sudah menggantikan panggung. Langkah zoom = setiap skala bulat dari `awal` sampai `penuh`. */
export function garisWaktu(arah: Arah, pendek: boolean, skala: { awal: number; penuh: number }): Bingkai[] {
  const naik = Array.from({ length: skala.penuh - skala.awal + 1 }, (_, i) => skala.awal + i);
  if (arah === 'maju') {
    if (pendek) return [
      { pada: 0, lengan: 0, dekat: false, pov: null, obrolan: false },
      { pada: 100, lengan: 1, dekat: true, pov: null, obrolan: false },
      { pada: 200, lengan: null, dekat: false, pov: null, tutup: true, obrolan: true },
      { pada: DURASI.pendek, lengan: null, dekat: false, pov: null, obrolan: true },
    ];
    const zoom = naik;
    const sela = 450 / zoom.length;
    return [
      { pada: 0, lengan: 0, gelembung: true, dekat: false, pov: null, obrolan: false },
      { pada: 175, lengan: 1, dekat: true, pov: null, obrolan: false },
      ...zoom.map((s, i) => ({ pada: Math.round(350 + i * sela), lengan: 1 as const, dekat: true, pov: s, obrolan: false })),
      { pada: 800, lengan: null, dekat: false, pov: null, tutup: true, obrolan: true },
      { pada: DURASI.maju, lengan: null, dekat: false, pov: null, obrolan: true },
    ];
  }
  // balik: panggung sudah terpasang sejak 0 (di bawah lapisan POV); obrolan = false di semua bingkai.
  if (pendek) return [
    { pada: 0, lengan: 1, dekat: true, pov: null, obrolan: false },
    { pada: 150, lengan: 0, dekat: false, pov: null, obrolan: false },
    { pada: DURASI.pendek, lengan: null, dekat: false, pov: null, obrolan: false },
  ];
  const zoom = [...naik].reverse();
  const sela = 300 / zoom.length;
  return [
    ...zoom.map((s, i) => ({ pada: Math.round(i * sela), lengan: 1 as const, dekat: true, pov: s, obrolan: false })),
    { pada: 300, lengan: 1, dekat: true, pov: null, obrolan: false },
    { pada: 425, lengan: 0, dekat: true, pov: null, obrolan: false },
    { pada: 550, lengan: null, dekat: false, pov: null, obrolan: false },
    { pada: DURASI.balik, lengan: null, dekat: false, pov: null, obrolan: false },
  ];
}

/** Serah-terima yang memicu adegan, menurut daftar episode. null = tidak ada (potong langsung seperti sebelumnya). */
export function arahSerah(ep: Episode, dari: StateCerita, ke: StateCerita): Arah | null {
  const s = ep.serahTelepon;
  if (!s || dari.node === ke.node) return null;
  const pd = pandangKini(ep, dari), pk = pandangKini(ep, ke);
  if (pd === 'adegan' && pk === 'obrolan' && s.maju.some(([a, b]) => a === dari.node && b === ke.node)) return 'maju';
  if (pd === 'obrolan' && pk === 'adegan' && s.balik.dari.includes(dari.node) && s.balik.ke.includes(ke.node)) return 'balik';
  return null;
}

const KUNCI_SUDAH = 'raksa:cerita:telepon-penuh';
function sudahPenuh(ep: Episode, bab: string): boolean {
  try { return (JSON.parse(sessionStorage.getItem(KUNCI_SUDAH) ?? '[]') as string[]).includes(`${ep.id}:${bab}`); } catch { return false; }
}
function catatPenuh(ep: Episode, bab: string): void {
  try { const v = new Set(JSON.parse(sessionStorage.getItem(KUNCI_SUDAH) ?? '[]') as string[]); v.add(`${ep.id}:${bab}`); sessionStorage.setItem(KUNCI_SUDAH, JSON.stringify([...v])); } catch { /* kenyamanan saja */ }
}

interface Jalan { arah: Arah; dari: StateCerita; pendek: boolean; kunci: number }

/**
 * Dipakai pembungkus PemainHP. Mengembalikan state yang HARUS ditampilkan (selama 800 md pertama gerak maju = state panggung
 * lama), penanda "tahan" (aksi pemain dibekukan) dan lapisan gambar (portal ke <body>).
 */
export function useTransisiTelepon(ep: Episode, state: StateCerita): { tampil: StateCerita; tahan: boolean; lapis: ReactNode } {
  const kurang = useReducedMotion();
  const [lalu, setLalu] = useState(state);
  const [jalan, setJalan] = useState<Jalan | null>(null);
  const [bingkai, setBingkai] = useState<Bingkai | null>(null);
  const [kotak, setKotak] = useState<{ x: number; y: number; w: number; h: number; hPenuh: number; sudut: string; sudutPenuh: string } | null>(null);
  const nomor = useRef(0);

  // State berganti: putuskan saat render (tanpa satu bingkai obrolan yang berkedip sebelum adegan mulai).
  if (state !== lalu) {
    setLalu(state);
    const arah = kurang || state.episode !== lalu.episode ? null : arahSerah(ep, lalu, state);
    if (arah) {
      const bab = babDari(ep, arah === 'maju' ? lalu : state);
      setJalan({ arah, dari: lalu, pendek: sudahPenuh(ep, bab), kunci: ++nomor.current });
      setBingkai(null);
    }
    // (State yang berganti lagi selama adegan, mis. obrolan memajukan pesan pertamanya sendiri pada 800 md, tidak membatalkannya.)
  }

  useEffect(() => { void siapkanTeleponTangan(); void muatPng(urlPov).catch(() => null); }, []);

  const selesai = () => { setJalan(null); setBingkai(null); };
  // Ukur kotak panggung (dan pusat layar telepon di dalamnya) sebelum bingkai pertama digambar.
  useLayoutEffect(() => {
    if (!jalan) { aturTeleponTangan(null); document.documentElement.removeAttribute('data-telepon'); return; }
    const tokoh = ep.serahTelepon?.tokoh ?? '';
    let pewaktu: number[] = []; let rafId = 0; let batal = false;
    // Arah balik: panggung baru dipasang pada render ini dan kanvasnya bisa menyusul beberapa bingkai; tunggu paling lama 12 bingkai.
    const mulai = (sisa: number) => {
      if (batal) return;
      const pg = document.querySelector<HTMLElement>('.hp-vn .cer-panggung.cer-latar');
      const hadir = (pg?.getAttribute('data-hadir') ?? '').split(' ');
      if (!pg || !pg.querySelector('.cer-piksel[data-siap], .cer-piksel-kanvas')) { if (sisa > 0) rafId = requestAnimationFrame(() => mulai(sisa - 1)); else selesai(); return; }
      if (!hadir.includes(tokoh)) { selesai(); return; } // tokohnya tidak di panggung: potong langsung
      const r = pg.getBoundingClientRect();
      // Kotak yang TERLIHAT: kartu dialog menumpang di bagian bawah panggung, jadi lapisan berhenti di tepi atas kartu itu; sudutnya
      // membulat mengikuti bingkai panggung.
      const dl = document.querySelector<HTMLElement>('.hp-vn .hp-vn-dialog:not([data-bayangan])')?.getBoundingClientRect();
      const bawah = dl && dl.top > r.top + 80 && dl.top < r.bottom ? dl.top : r.bottom;
      const cs = getComputedStyle(pg);
      const tinggi = bawah - r.top;
      const sudutBawah = bawah < r.bottom ? '0 0' : cs.borderBottomRightRadius + ' ' + cs.borderBottomLeftRadius;
      // D-214: penutup hijau (saat obrolan terpasang) menutupi kotak panggung PENUH, bukan kotak yang dipotong kartu dialog.
      setKotak({ x: r.left, y: r.top, w: r.width, h: tinggi, hPenuh: r.height, sudut: cs.borderTopLeftRadius + ' ' + cs.borderTopRightRadius + ' ' + sudutBawah, sudutPenuh: cs.borderRadius });
      const gw = garisWaktu(jalan.arah, jalan.pendek, skalaPov(r.width, tinggi));
      if (!jalan.pendek) catatPenuh(ep, babDari(ep, jalan.arah === 'maju' ? jalan.dari : state));
      setBingkai(gw[0]!);
      const t0 = performance.now();
      pewaktu = gw.slice(1).map((b, i) => window.setTimeout(() => { if (i === gw.length - 2) selesai(); else setBingkai(b); }, Math.max(0, b.pada - (performance.now() - t0))));
    };
    mulai(12);
    return () => { batal = true; cancelAnimationFrame(rafId); for (const id of pewaktu) window.clearTimeout(id); };
  }, [jalan?.kunci]); // eslint-disable-line react-hooks/exhaustive-deps

  // Terapkan bingkai: sel lengan di kanvas panggung + kamera mendekat (CSS di kanvas, berpusat di layar telepon).
  useLayoutEffect(() => {
    const akar = document.documentElement;
    if (!jalan || !bingkai) { aturTeleponTangan(null); akar.removeAttribute('data-telepon'); akar.removeAttribute('data-telepon-arah'); return; }
    aturTeleponTangan(bingkai.lengan === null || bingkai.obrolan ? null : { tokoh: ep.serahTelepon!.tokoh, sel: bingkai.lengan, gelembung: bingkai.gelembung });
    akar.setAttribute('data-telepon', bingkai.obrolan ? 'obrolan' : bingkai.dekat ? 'dekat' : 'jauh');
    akar.setAttribute('data-telepon-arah', jalan.arah);
    const pg = document.querySelector<HTMLElement>('.hp-vn .cer-panggung.cer-latar');
    const pusat = pg?.getAttribute('data-telepon-pusat')?.split(',').map(Number);
    if (pg && pusat?.length === 2) { pg.style.setProperty('--tlp-x', `${pusat[0]}px`); pg.style.setProperty('--tlp-y', `${pusat[1]}px`); }
    // D-210: TIDAK ada pembersihan di antara bingkai: atribut kamera bertahan sepanjang gerak (dilepas di cabang atas saat selesai).
  }, [jalan, bingkai, ep]);
  useEffect(() => () => { aturTeleponTangan(null); document.documentElement.removeAttribute('data-telepon'); document.documentElement.removeAttribute('data-telepon-arah'); }, []);

  const maju800 = !!jalan && jalan.arah === 'maju' && !(bingkai?.obrolan);
  const tampil = maju800 ? jalan!.dari : state;
  let lapis: ReactNode = null;
  if (jalan && kotak && typeof document !== 'undefined') {
    const { awal, penuh } = skalaPov(kotak.w, kotak.h);
    const s = bingkai?.pov ?? null;
    // Gambar POV 1 : 1 di tengah kotak; berskala terhadap pusat layar telepon, yang ikut bergeser ke pusat kotak saat memenuhi.
    const cx = POV.layar.x + POV.layar.w / 2, cy = POV.layar.y + POV.layar.h / 2;
    const p = s === null ? 0 : penuh > awal ? (s - awal) / (penuh - awal) : 1;
    const kiri = (kotak.w - POV.w) / 2, atas = (kotak.h - POV.h) / 2;
    const gayaPov: CSSProperties = {
      left: Math.round(kiri), top: Math.round(atas), width: POV.w, height: POV.h, transformOrigin: `${cx}px ${cy}px`,
      transform: `translate(${Math.round((kotak.w / 2 - (kiri + cx)) * p)}px, ${Math.round((kotak.h / 2 - (atas + cy)) * p)}px) scale(${s ?? 1})`,
    };
    lapis = createPortal(
      <div className="tlp-lapis" data-telepon-lapis="" data-arah={jalan.arah} data-pendek={jalan.pendek ? '' : undefined} data-pada={bingkai?.pada ?? 0}
        data-lengan={bingkai?.lengan ?? undefined} data-pov={s ?? undefined} data-tutup={bingkai?.tutup ? '' : undefined} aria-hidden="true" onPointerDown={selesai}>
        <div className="tlp-kotak" style={bingkai?.tutup ? { left: kotak.x, top: kotak.y, width: kotak.w, height: kotak.hPenuh, borderRadius: kotak.sudutPenuh } : { left: kotak.x, top: kotak.y, width: kotak.w, height: kotak.h, borderRadius: kotak.sudut }}>
          {s !== null ? <img className="tlp-pov" src={urlPov} alt="" width={POV.w} height={POV.h} style={gayaPov} draggable={false} /> : null}
          {bingkai?.tutup ? <span className="tlp-tutup" /> : null}
        </div>
      </div>, document.body);
  }
  return { tampil, tahan: maju800, lapis };
}

/** Bab (Bagian) tempat sebuah state berada: entri riwayat 'bab' terakhir. */
function babDari(ep: Episode, s: StateCerita): string {
  for (let i = s.riwayat.length - 1; i >= 0; i--) { const e = s.riwayat[i]!; if (e.jenis === 'bab') return e.bab; }
  return ep.node[s.node]?.bab ?? '';
}
