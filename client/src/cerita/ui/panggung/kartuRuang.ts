/**
 * SENI KARTU EPISODE (/cerita): potongan ringan ruang layanan v3 (Raksa Silver Club) yang dibingkai di sekitar Bu Rina,
 * dari lapisan ruang yang SAMA dengan panggung (seni/ruang) dan gambar Bu Rina v3 yang sama. Satu SVG diam: tanpa
 * kamera, tanpa aktor, tanpa animasi; hanya latar (dinding + papan nama + panel), daun pintu tertutup, meja & kursi
 * pengunjung bila terlihat di potongan itu, dan Bu Rina berdiri di samping kursi (titik akhir jalur masuk) menatap
 * pemain dengan kunci mobil di tangan. Teks papan nama ditulis dari konfigurasi episode seperti di panggung.
 *
 * Murni (tanpa React/DOM) supaya bisa diuji: halaman daftar memberi ukuran kotak seni (px CSS), di sini dipilih
 * potongan dunia (viewBox) yang memuat kepala-sampai-pinggang Bu Rina DAN tulisan papan nama utuh.
 */
import type { RuangAdegan } from '../../seni/ruang';
import type { GambarTokoh } from '../../seni/tokoh';
import type { Ekspresi } from '../../tipe';
import { awalanId, titikDunia, type Kotak } from './dunia';
import { markupPiksel, pikselDari, ruangPiksel, SATUAN_PIKSEL, tempelanDari } from './piksel';
import { ambilRuang, gambarTokoh } from './sumber';

/** Tulisan papan nama yang harus utuh (tinta ± x 671-990 di kotak papan 610-1050) + tepi; badan Bu Rina sampai ± x 1300. */
const PERLU_KIRI = 640;
const PERLU_KANAN = 1320;
/** Tinggi dunia yang tampil pada kotak lebar (kepala sampai tangan/pinggang Bu Rina). */
const TINGGI_LEBAR = 470;
/** Letak mendatar kepala Bu Rina di potongan (pecahan lebar), seperti tokoh kartu lama (62 %). */
const LETAK_KEPALA = 0.64;
const ATAS = 20;

export interface SeniKartuRuang {
  /** Isi SVG (koordinat dunia 1600 x 900). */
  svg: string;
  /** Potongan dunia untuk viewBox. */
  potongan: Kotak;
}

/** devicePixelRatio peramban (1 di luar peramban). */
function dprBawaan(): number {
  const d = typeof window === 'undefined' ? 1 : window.devicePixelRatio;
  return d > 0 && Number.isFinite(d) ? d : 1;
}

/** Bu Rina berdiri di samping kursi pengunjung (ujung jalur masuk), menatap pemain, kunci di tangan. */
function buRinaBerdiri(r: RuangAdegan, ekspresi: Ekspresi): { g: GambarTokoh; titik: { x: number; y: number }; skala: number } {
  const ujung = r.tempat.jalurMasuk[r.tempat.jalurMasuk.length - 1];
  const titik = ujung?.titik ?? r.tempat.nasabahBerdiri;
  const skala = ujung?.skala ?? r.tempat.skalaNasabah;
  return { g: gambarTokoh({ siapa: 'nasabah', pose: 'berdiri', ekspresi, pandang: 'pemain', kunci: true }), titik, skala };
}

/**
 * Potongan dunia untuk kotak W x H (px): kotak lebar (HP, kartu satu kolom) = kepala sampai pinggang Bu Rina dengan
 * kepala di ± 64 % lebar; kotak sempit/tinggi (kolom seni 280 px di desktop) = cukup lebar untuk papan nama utuh +
 * badan Bu Rina, tingginya mengikuti rasio kotak (lebih banyak badan, meja & kursi ikut terlihat).
 */
export function potonganKartuRuang(W: number, H: number, kepala: { x: number; y: number }): Kotak {
  const rasio = W > 0 && H > 0 ? W / H : 2.4;
  let lebar = Math.max(rasio * TINGGI_LEBAR, PERLU_KANAN - PERLU_KIRI);
  let tinggi = lebar / rasio;
  if (ATAS + tinggi > 900) {
    tinggi = 900 - ATAS;
    lebar = tinggi * rasio;
  }
  let x = kepala.x - LETAK_KEPALA * lebar;
  x = Math.min(x, PERLU_KIRI);
  x = Math.max(x, PERLU_KANAN - lebar);
  x = Math.min(Math.max(x, 0), Math.max(0, 1600 - lebar));
  const r = (v: number) => Math.round(v * 10) / 10;
  return { x: r(x), y: ATAS, w: r(lebar), h: r(tinggi) };
}

/**
 * Potongan kartu dipaskan ke piksel bulat (ruang piksel): lebar potongan = W x 4 x dpr / k satuan dunia dengan k
 * bulat terdekat ke potongan desain, jadi satu piksel seni = k piksel perangkat di kotak W x H; sudut kiri-atas di
 * kelipatan 4 / k (tepi piksel seni jatuh di piksel perangkat). Pusat potongan desain dipertahankan.
 */
export function potonganPiksel(p: Kotak, W: number, H: number, dpr: number): Kotak {
  if (!(W > 0) || !(H > 0)) return p;
  const q = SATUAN_PIKSEL * (dpr > 0 && Number.isFinite(dpr) ? dpr : 1);
  const k = Math.max(1, Math.round((W * q) / p.w));
  const w = (W * q) / k;
  const h = (H * q) / k;
  const langkah = SATUAN_PIKSEL / k;
  const bulat = (v: number) => Math.round(v / langkah) * langkah;
  let x = bulat(p.x + p.w / 2 - w / 2);
  let y = bulat(p.y);
  if (w <= 1600) x = Math.min(Math.max(x, 0), Math.floor((1600 - w) / langkah) * langkah);
  if (h <= 900) y = Math.min(Math.max(y, 0), Math.floor((900 - h) / langkah) * langkah);
  return { x, y, w, h };
}

/** Satu lapisan ruang sebagai <svg> bersarang di koordinat dunia (raster: potongan PNG nearest-neighbour). */
function lapis(l: { svg: string; x: number; y: number; w: number; h: number } | undefined, awalan: string): string {
  if (!l) return '';
  const p = pikselDari(l);
  if (p) return markupPiksel(p, l.x, l.y, l.w, l.h);
  return `<svg x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" viewBox="0 0 ${l.w} ${l.h}" overflow="visible">${awalanId(l.svg, awalan)}</svg>`;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Teks papan nama (sama dengan PapanNama di UnsurDunia: Georgia miring, dipaskan ke kotak papan). */
function papan(r: RuangAdegan, nama: string): string {
  const p = r.papanNama;
  if (!p || !nama) return '';
  const ukuran = Math.min(p.ukuranHuruf, p.h * 0.55);
  const pas = nama.length * 0.52 * ukuran > p.w * 0.88 ? ` textLength="${Math.round(p.w * 0.88)}" lengthAdjust="spacingAndGlyphs"` : '';
  return `<text x="${p.x + p.w / 2}" y="${p.y + p.h / 2}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="600" font-size="${ukuran}" letter-spacing="${ukuran * 0.02}" fill="${p.warna}"${pas}>${esc(nama)}</text>`;
}

/**
 * Seni kartu episode untuk kotak W x H px. `awalan` = awalan id unik salinan ini (id gradien lapisan & tokoh).
 * Lapisan yang sama sekali di luar potongan (meja, kursi) tidak ikut, supaya kartu di HP tetap ringan.
 */
export function seniKartuRuang(W: number, H: number, namaPapan: string, ekspresi: Ekspresi, awalan: string, dpr = dprBawaan()): SeniKartuRuang {
  const r = ambilRuang('meja');
  const b = buRinaBerdiri(r, ekspresi);
  const kepala = titikDunia(b.g, b.g.kepala, b.titik, b.skala);
  const desain = potonganKartuRuang(W, H, kepala);
  // Ruang piksel: potongan dipaskan supaya piksel seni tampil pada jumlah piksel perangkat bulat.
  const potongan = ruangPiksel(r) ? potonganPiksel(desain, W, H, dpr) : desain;
  const bawah = potongan.y + potongan.h;
  const terlihat = (l: { y: number } | undefined) => !!l && l.y < bawah;
  const ox = b.titik.x - b.g.jangkar.x * b.skala;
  const oy = b.titik.y - b.g.jangkar.y * b.skala;
  const svg = [
    lapis(r.latar, `${awalan}l`),
    papan(r, namaPapan),
    r.pintu ? lapis(r.pintu.daun, `${awalan}p`) : '',
    terlihat(r.belakangMeja) ? lapis(r.belakangMeja, `${awalan}mb`) : '',
    terlihat(r.depanMeja) ? lapis(r.depanMeja, `${awalan}md`) : '',
    terlihat(r.kursi?.belakang) ? lapis(r.kursi?.belakang, `${awalan}kb`) : '',
    pikselDari(b.g)
      ? markupPiksel(pikselDari(b.g)!, ox, oy, b.g.w * b.skala, b.g.h * b.skala, tempelanDari(b.g))
      : `<svg x="${ox}" y="${oy}" width="${b.g.w * b.skala}" height="${b.g.h * b.skala}" viewBox="0 0 ${b.g.w} ${b.g.h}" overflow="visible">${awalanId(b.g.svg, `${awalan}n`)}</svg>`,
    terlihat(r.kursi?.depan) ? lapis(r.kursi?.depan, `${awalan}kd`) : '',
  ].join('');
  return { svg, potongan };
}
