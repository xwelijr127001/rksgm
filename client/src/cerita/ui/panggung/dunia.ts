/**
 * DUNIA PANGGUNG v3 (docs/cerita/ADEGAN-AUTO1.md bagian 2): pembantu MURNI untuk menyusun komposisi adegan ke dalam
 * dunia 1600 x 900 satuan. Tanpa React & tanpa DOM, supaya bisa diuji dan dipakai ulang oleh rencana gerak.
 *
 * - Tokoh diletakkan dengan menaruh `jangkar` gambarnya di titik `tempat` ruang, dengan skala tempat itu. Posisi
 *   kepala & tangan (untuk kamera) dihitung dari `kepala`/`tangan` gambar, bukan dari angka tetap, sehingga seni
 *   final (kanvas & jangkar sama) langsung tersusun benar tanpa menyetel ulang panggung.
 * - Urutan lapisan (z) mengikuti kontrak: latar → koridor → daun pintu → tokoh di belakang meja → meja belakang →
 *   prop di meja → meja depan → kursi belakang → nasabah di kursi → kursi depan.
 */
import type { IdPropAdegan, PoseMentor, PoseNasabah, TempatProp } from '../../tipe';
import type { KomposisiAdegan } from '../adeganTipe';
import type { RuangAdegan } from '../../seni/ruang';
import { type GambarTokoh, type OpsiBuRina, type OpsiMissRaksa, type Titik } from '../../seni/tokoh';
import { kotakDiAtasMeja, pikselDari, tinggiKepala, titikKisi } from './piksel';

export const DUNIA_W = 1600;
export const DUNIA_H = 900;

export interface Kotak {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Urutan lapisan dunia (z-index di dalam satu konteks tumpukan). */
export const Z = {
  latar: 10,
  papan: 12,
  koridor: 20,
  pintu: 30,
  belakang: 40,
  mejaBelakang: 50,
  prop: 55,
  mejaDepan: 60,
  kursiBelakang: 70,
  nasabah: 80,
  kursiDepan: 90,
  label: 95,
} as const;

export const DUNIA: Kotak = { x: 0, y: 0, w: DUNIA_W, h: DUNIA_H };

export function gabungKotak(a: Kotak | null, b: Kotak | null): Kotak | null {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/** Kotak dipotong ke dunia; null bila tidak ada bagian yang tersisa. */
export function potongKeDunia(k: Kotak | null): Kotak | null {
  if (!k) return null;
  const x = Math.max(0, k.x);
  const y = Math.max(0, k.y);
  const x2 = Math.min(DUNIA_W, k.x + k.w);
  const y2 = Math.min(DUNIA_H, k.y + k.h);
  return x2 > x && y2 > y ? { x, y, w: x2 - x, h: y2 - y } : null;
}

/** Kotak diperbesar (atau diperkecil) dari pusatnya. */
export function skalaKotak(k: Kotak, f: number): Kotak {
  const w = k.w * f;
  const h = k.h * f;
  return { x: k.x + (k.w - w) / 2, y: k.y + (k.h - h) / 2, w, h };
}

/** Id React (`:r1:` / `«r1»`) menjadi awalan id SVG yang sah. */
export function idAman(s: string): string {
  const bersih = s.replace(/[^a-zA-Z0-9_-]/g, '');
  return 'pg' + (bersih || '0');
}

/**
 * Memberi awalan unik pada SEMUA id di dalam potongan SVG beserta rujukannya (url(#id), href="#id"), supaya
 * lapisan/tokoh yang sama bisa tampil lebih dari sekali di halaman (pembuka, silang-pudar lokasi) tanpa id bentrok.
 * Id yang sudah diberi awalan oleh generator tetap aman (hanya diberi awalan lagi, rujukannya ikut).
 */
export function awalanId(svg: string, awalan: string): string {
  if (!svg.includes('id=')) return svg;
  const ids = new Set<string>();
  for (const m of svg.matchAll(/\sid\s*=\s*"([^"]+)"/g)) ids.add(m[1]!);
  for (const m of svg.matchAll(/\sid\s*=\s*'([^']+)'/g)) ids.add(m[1]!);
  if (!ids.size) return svg;
  const ganti = (id: string) => (ids.has(id) ? `${awalan}-${id}` : id);
  return svg
    .replace(/(\sid\s*=\s*)(["'])([^"']+)\2/g, (_m, a: string, q: string, id: string) => `${a}${q}${ganti(id)}${q}`)
    .replace(/url\(\s*(["']?)#([^"')\s]+)\1\s*\)/g, (_m, q: string, id: string) => `url(${q}#${ganti(id)}${q})`)
    .replace(/((?:xlink:)?href\s*=\s*)(["'])#([^"']+)\2/g, (_m, a: string, q: string, id: string) => `${a}${q}#${ganti(id)}${q}`);
}

// ------------------------------------------------------------------ tokoh

export type SiapaTokoh = 'mentor' | 'nasabah';

/** Opsi gambar tanpa `id` (awalan id diberikan saat digambar per salinan). */
export type OpsiTokoh =
  | ({ siapa: 'mentor' } & Omit<OpsiMissRaksa, 'id' | 'bicara' | 'kedip'>)
  | ({ siapa: 'nasabah' } & Omit<OpsiBuRina, 'id' | 'bicara' | 'kedip'>);

/** Satu tokoh yang sudah diletakkan di dunia. */
export interface LetakTokoh {
  siapa: SiapaTokoh;
  opsi: OpsiTokoh;
  /** Gambar dasar (tanpa bicara/kedip): ukuran, jangkar, kepala, tangan. */
  gambar: GambarTokoh;
  /** Titik dunia tempat jangkar gambar diletakkan. */
  titik: Titik;
  skala: number;
  z: number;
  /** Tanda ringkas penampilan (pose/ekspresi/pandang/prop tangan/posisi) untuk mendeteksi perubahan. */
  tanda: string;
}

export type PenggambarTokoh = (o: OpsiTokoh & { id?: string; bicara?: boolean; kedip?: boolean }) => GambarTokoh;

export const poseDuduk = (pose: PoseMentor | PoseNasabah): boolean => pose.startsWith('duduk') || pose === 'telepon';

/** Titik dunia sebuah titik gambar (mis. kepala) bila gambar diletakkan pada `titik` dengan `skala`. */
export function titikDunia(g: GambarTokoh, p: Titik, titik: Titik, skala: number): Titik {
  return { x: titik.x + (p.x - g.jangkar.x) * skala, y: titik.y + (p.y - g.jangkar.y) * skala };
}

/** Kotak kepala (rambut/sanggul/hijab sampai dagu) di dunia. */
export function kotakKepala(l: Pick<LetakTokoh, 'gambar' | 'titik' | 'skala'>): Kotak {
  const c = titikDunia(l.gambar, l.gambar.kepala, l.titik, l.skala);
  const t = tinggiKepala(l.gambar) * l.skala;
  return { x: c.x - 0.62 * t, y: c.y - 0.64 * t, w: 1.24 * t, h: 1.22 * t };
}

/**
 * Kotak kepala RAPAT untuk bingkai kedatangan/kepergian (kamera.ts `pasKameraPintu`): tinggi sama dengan kotakKepala,
 * lebar 1,0 x tinggi kepala (kotakKepala 1,24 x memberi ± 0,12 tinggi kepala ruang kosong di tiap sisi). Kepala piksel
 * sebenarnya: Miss Raksa ± 0,8 x (sanggul termasuk), Bu Rina ± 1,05 x dengan hijab menjuntai ke BELAKANG (sisi pintu
 * saat ia masuk/pergi; bingkai pintu selalu memperlihatkan sisi itu).
 */
export function kotakKepalaRapat(l: Pick<LetakTokoh, 'gambar' | 'titik' | 'skala'>): Kotak {
  const k = kotakKepala(l);
  const w = tinggiKepala(l.gambar) * l.skala;
  return { x: k.x + (k.w - w) / 2, y: k.y, w, h: k.h };
}

/** Jari-jari kotak tangan di kotakPenting (x tinggi kepala): tangan SVG (kepala 130 satuan). */
export const FAKTOR_TANGAN = 0.28;
/**
 * Jari-jari kotak tangan tokoh RASTER (x tinggi kepala): tangan piksel ± 8-10 piksel seni pada kepala ± 46-54, jadi
 * 0,2 (± 9-11 piksel seni) sudah memuat tangan + tepi. v5 (komposisi meja): 0,28 membuat ujung telunjuk di kartu dan
 * kunci di lutut Bu Rina (condong) mendorong kamera percakapan turun per baris, dan di HP 360 px menurunkan k.
 */
export const FAKTOR_TANGAN_PIKSEL = 0.2;

/**
 * Kotak yang tidak boleh terpotong kamera/tertutup label: kepala + tangan (bila ada). Gambar RASTER di balik meja:
 * juga kotak tangan di atas meja frame itu (`diAtasMejaPiksel`: lengan bawah & telapak yang bertumpu di meja), karena
 * beberapa frame (mis. Miss Raksa duduk-dengar) tidak punya titik tangan di manifest; tanpa ini tangan di meja bisa
 * jatuh ke pita bawah panggung (di bawah label suasana) di HP. `rapat` = kepala memakai kotakKepalaRapat.
 */
export function kotakPenting(l: Pick<LetakTokoh, 'gambar' | 'titik' | 'skala'>, rapat = false): Kotak {
  let k: Kotak | null = rapat ? kotakKepalaRapat(l) : kotakKepala(l);
  const r = (pikselDari(l.gambar) ? FAKTOR_TANGAN_PIKSEL : FAKTOR_TANGAN) * tinggiKepala(l.gambar) * l.skala;
  for (const p of [l.gambar.tangan?.kiri, l.gambar.tangan?.kanan]) {
    if (!p) continue;
    const w = titikDunia(l.gambar, p, l.titik, l.skala);
    k = gabungKotak(k, { x: w.x - r, y: w.y - r, w: 2 * r, h: 2 * r });
  }
  if (pikselDari(l.gambar)) {
    for (const m of kotakDiAtasMeja(l.gambar)) {
      const a = titikDunia(l.gambar, { x: m.x, y: m.y }, l.titik, l.skala);
      k = gabungKotak(k, { x: a.x, y: a.y, w: m.w * l.skala, h: m.h * l.skala });
    }
  }
  return k!;
}

function tandaTokoh(o: OpsiTokoh, titik: Titik, skala: number): string {
  const kunci = o.siapa === 'nasabah' && o.kunci ? 'k' : '';
  return `${o.siapa}|${o.pose}|${o.ekspresi}|${o.pandang ?? ''}|${kunci}|${Math.round(titik.x)},${Math.round(titik.y)}|${skala}`;
}

/**
 * Satu tokoh di titik dunia. Gambar RASTER (piksel.ts) selalu skala 1 (1 piksel seni = 4 satuan dunia, tanpa skala
 * pecahan) dan sudut kiri-atasnya dipaskan ke kisi piksel seni, supaya piksel tokoh sejajar dengan piksel ruang;
 * kepala/tangan untuk kamera dihitung dari letak yang sama dengan yang digambar.
 */
export function buatLetak(o: OpsiTokoh, titik: Titik, skala: number, z: number, gambar: PenggambarTokoh): LetakTokoh {
  const g = gambar(o);
  if (pikselDari(g)) {
    const t = titikKisi(titik, g.jangkar);
    return { siapa: o.siapa, opsi: o, gambar: g, titik: t, skala: 1, z, tanda: tandaTokoh(o, t, 1) };
  }
  return { siapa: o.siapa, opsi: o, gambar: g, titik, skala, z, tanda: tandaTokoh(o, titik, skala) };
}

/**
 * Letak Miss Raksa & Bu Rina untuk komposisi ini. Bu Rina yang hadir lewat telepon TIDAK diletakkan di ruangan
 * (tampil di sisipan panggilan).
 */
export function letakTokoh(k: KomposisiAdegan, r: RuangAdegan, gambar: PenggambarTokoh): LetakTokoh[] {
  const t = r.tempat;
  const hasil: LetakTokoh[] = [];
  if (k.mentor) {
    const duduk = poseDuduk(k.mentor.pose);
    hasil.push(buatLetak(
      { siapa: 'mentor', pose: k.mentor.pose, ekspresi: k.mentor.ekspresi, pandang: k.mentor.pandang },
      duduk ? t.mentor : t.mentorBerdiri, t.skalaMentor, Z.belakang, gambar,
    ));
  }
  if (k.nasabah && !k.nasabah.lewatTelepon) {
    const duduk = poseDuduk(k.nasabah.pose);
    hasil.push(buatLetak(
      { siapa: 'nasabah', pose: k.nasabah.pose, ekspresi: k.nasabah.ekspresi, pandang: k.nasabah.pandang, kunci: k.prop.kunci === 'tangan' },
      duduk ? t.nasabahDuduk : t.nasabahBerdiri, t.skalaNasabah, Z.nasabah, gambar,
    ));
  }
  return hasil;
}

/** Gabungan kotak penting semua tokoh (dipotong ke dunia), atau null bila tidak ada tokoh. */
export function intiTokoh(daftar: readonly Pick<LetakTokoh, 'gambar' | 'titik' | 'skala'>[], rapat = false): Kotak | null {
  let k: Kotak | null = null;
  for (const l of daftar) k = gabungKotak(k, kotakPenting(l, rapat));
  return potongKeDunia(k);
}

// ------------------------------------------------------------------ prop

export interface LetakProp {
  id: IdPropAdegan;
  tempat: TempatProp;
  /** Titik dunia (tengah bawah prop). */
  titik: Titik;
  skala: number;
}

/**
 * Prop yang terlihat di dunia: kunci & kartu di meja, kartu di tangan mentor, pesawat telepon di meja. Kunci di
 * tangan Bu Rina digambar oleh gambar tokohnya sendiri (`OpsiBuRina.kunci`); 'tersimpan' tidak terlihat.
 */
export function letakProp(k: KomposisiAdegan, r: RuangAdegan, tokoh: readonly LetakTokoh[]): LetakProp[] {
  const t = r.tempat;
  const hasil: LetakProp[] = [];
  const skala = t.skalaMentor || 1;
  const adaMeja = !!r.belakangMeja;
  if (k.prop.kunci === 'meja' && t.kunciMeja && adaMeja) hasil.push({ id: 'kunci', tempat: 'meja', titik: t.kunciMeja, skala });
  if (k.prop.kartu === 'meja' && t.kartuMeja && adaMeja) hasil.push({ id: 'kartu', tempat: 'meja', titik: t.kartuMeja, skala });
  if (k.prop.kartu === 'tangan') {
    const m = tokoh.find((x) => x.siapa === 'mentor');
    const tangan = m ? m.gambar.tangan?.kanan ?? m.gambar.tangan?.kiri : undefined;
    if (m && tangan) hasil.push({ id: 'kartu', tempat: 'tangan', titik: titikDunia(m.gambar, tangan, m.titik, m.skala), skala: m.skala });
    else if (t.kartuMeja && adaMeja) hasil.push({ id: 'kartu', tempat: 'meja', titik: t.kartuMeja, skala });
  }
  // Gagang yang sudah DIGAMBAR frame raster Miss Raksa (pose telepon: teleponTergambar) = pesawat di meja TANPA gagang
  // (tempat 'tangan'), apa pun data cue-nya: tidak pernah dua gagang.
  const gagangDiTangan = tokoh.some((x) => x.siapa === 'mentor' && (x.gambar as { teleponTergambar?: unknown }).teleponTergambar === true);
  const tempatTelepon: TempatProp = gagangDiTangan && k.prop.telepon === 'meja' ? 'tangan' : k.prop.telepon;
  if (tempatTelepon !== 'tersimpan' && t.telepon && adaMeja) hasil.push({ id: 'telepon', tempat: tempatTelepon, titik: t.telepon, skala });
  return hasil;
}

// ------------------------------------------------------------------ susunan

/** Komposisi yang sudah disusun ke dunia: ruang, tokoh, prop. Satu susunan = satu "gambar akhir". */
export interface SusunanAdegan {
  komposisi: KomposisiAdegan;
  ruang: RuangAdegan;
  tokoh: LetakTokoh[];
  prop: LetakProp[];
  /** Kotak kepala+tangan yang wajib terlihat (untuk kamera & penempatan label). */
  inti: Kotak | null;
  /** Tanda ringkas seluruh penampilan (tanpa pembicara): berubah = ada yang perlu ditransisikan. */
  tanda: string;
}

export function susunAdegan(k: KomposisiAdegan, r: RuangAdegan, gambar: PenggambarTokoh): SusunanAdegan {
  const tokoh = letakTokoh(k, r, gambar);
  const prop = letakProp(k, r, tokoh);
  const telepon = k.nasabah?.lewatTelepon ? `tel:${k.nasabah.ekspresi}` : '';
  const tanda = [
    k.lokasi,
    ...tokoh.map((t) => t.tanda),
    ...prop.map((p) => `${p.id}:${p.tempat}:${Math.round(p.titik.x)},${Math.round(p.titik.y)}`),
    telepon,
  ].join(';');
  return { komposisi: k, ruang: r, tokoh, prop, inti: intiTokoh(tokoh), tanda };
}

export function cariTokoh(s: SusunanAdegan | null | undefined, siapa: SiapaTokoh): LetakTokoh | undefined {
  return s?.tokoh.find((t) => t.siapa === siapa);
}
