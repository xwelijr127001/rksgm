/**
 * EKSPOR ASET MODE CERITA (docs/cerita/aset/EKSPOR.md): generator SVG tokoh & ruang v3 adalah MASTER/sumber; alat ini
 * menulis master itu sebagai berkas .svg mandiri, merasternya ke PNG & WebP transparan (puppeteer-core + Chrome),
 * memeriksa tepi (latar transparan, tidak ada tangan/rambut/kaki terpotong, id liar), lalu menulis manifest.json dan
 * lembar galeri (contact sheet) untuk tinjauan pemilik/ilustrator.
 *
 *   npx tsx --tsconfig client/tsconfig.json tools/ekspor-aset-cerita.ts [--keluar aset-ekspor/cerita] [--skala 1,2]
 *       [--waktu 2026-09-27T10:00:00Z] [--ekspresi-mr cerita|semua] [--paralel 2] [--webp-kualitas 90]
 *       [--tanpa-lembar] [--ketat]
 *
 * `--paralel` = jumlah PERAMBAN (bukan tab): tab latar di satu peramban bisa tertahan sampai batas waktu protokol.
 * Env: RAKSA_CHROME (chrome.exe; bawaan C:/Program Files/Google/Chrome/Application/chrome.exe), RAKSA_EKSPOR_JEJAK=1
 * (catat waktu tiap langkah). Kode keluar 1 bila ada master yang gagal dibuat/dirender/dibaca ulang (juga bila
 * generator ruang jatuh ke pengganti sementara) atau lembar galeri rusak. Masalah tepi & id hanya dilaporkan,
 * kecuali dengan --ketat (kode keluar 2). Folder keluaran hanya dikosongkan bila berpenanda hasil alat ini.
 *
 * Generator final diimpor LANGSUNG (missRaksa.ts, buRina.ts), bukan lewat pembungkus `aman` di seni/tokoh/index.ts,
 * supaya galat gambar menjadi kegagalan ekspor, bukan siluet pengganti yang diam-diam ikut terekspor.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { EPISODE_AUTO_1 } from '../client/src/cerita/episode/auto-1/episode';
import { propGagang, propKartuPolis, propKunci, propMap, propTelepon, ruangAdegan } from '../client/src/cerita/seni/ruang';
import { ruangSementara } from '../client/src/cerita/seni/ruang/sementara';
import type { LapisanSvg } from '../client/src/cerita/seni/ruang/tipe';
import { gambarBuRina } from '../client/src/cerita/seni/tokoh/buRina';
import { aturanPotret, gambarMissRaksa, potretMissRaksa } from '../client/src/cerita/seni/tokoh/missRaksa';
import type { GambarTokoh, JendelaPotret, OpsiBuRina, OpsiMissRaksa, Titik } from '../client/src/cerita/seni/tokoh/tipe';
import { JENDELA_POTRET_KECIL, JENDELA_POTRET_V3, KANVAS_DUDUK, KEPALA_TINGGI, POTRET_KECIL_MAKS_PX } from '../client/src/cerita/seni/tokoh/ukuran';
import { DAFTAR_EKSPRESI, DAFTAR_LOKASI_ADEGAN, type Ekspresi, type IdLokasiAdegan, type PoseMentor, type PoseNasabah } from '../client/src/cerita/tipe';
import { JENIS_POSE_MENTOR, JENIS_POSE_NASABAH } from '../client/src/cerita/ui/adegan';

const ROOT = path.resolve(import.meta.dirname, '..');
const ALAT = 'tools/ekspor-aset-cerita.ts';
const CHROME_BAWAAN = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
/** RAKSA_EKSPOR_JEJAK=1: catat waktu tiap langkah (mencari langkah yang lambat/macet). */
const JEJAK = !!process.env.RAKSA_EKSPOR_JEJAK;
const jejak = (...a: unknown[]): void => {
  if (JEJAK) console.log(new Date().toISOString().slice(11, 23), ...a);
};

// ------------------------------------------------------------------ argumen

interface Argumen {
  keluar: string;
  skala: number[];
  waktu: string;
  ekspresiMr: 'cerita' | 'semua';
  paralel: number;
  webpKualitas: number;
  lembar: boolean;
  ketat: boolean;
}

function bacaArgumen(argv: string[]): Argumen {
  const a: Argumen = {
    keluar: 'aset-ekspor/cerita', skala: [1, 2], waktu: new Date().toISOString(), ekspresiMr: 'cerita',
    paralel: 2, webpKualitas: 90, lembar: true, ketat: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]!;
    const nilai = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${k} butuh nilai`);
      return v;
    };
    if (k === '--keluar') a.keluar = nilai();
    else if (k === '--skala') {
      a.skala = [...new Set(nilai().split(',').map((s) => Number(s.trim())))].sort((x, y) => x - y);
      if (!a.skala.length || a.skala.some((s) => !(s > 0 && s <= 4))) throw new Error('--skala: daftar angka 0 < s <= 4, mis. 1,2');
    } else if (k === '--waktu') {
      const d = new Date(nilai());
      if (Number.isNaN(d.getTime())) throw new Error('--waktu: tanggal ISO tidak sah');
      a.waktu = d.toISOString();
    } else if (k === '--ekspresi-mr') {
      const v = nilai();
      if (v !== 'cerita' && v !== 'semua') throw new Error('--ekspresi-mr: cerita | semua');
      a.ekspresiMr = v;
    } else if (k === '--paralel') a.paralel = Math.max(1, Math.min(8, Math.round(Number(nilai())) || 1));
    else if (k === '--webp-kualitas') a.webpKualitas = Math.max(1, Math.min(100, Math.round(Number(nilai())) || 90));
    else if (k === '--tanpa-lembar') a.lembar = false;
    else if (k === '--ketat') a.ketat = true;
    else throw new Error(`argumen tidak dikenal: ${k}`);
  }
  return a;
}

// ------------------------------------------------------------------ daftar master

type Sisi = 'atas' | 'kanan' | 'bawah' | 'kiri';
type Jenis = 'tokoh' | 'potret' | 'ruang' | 'prop';

interface Kotak {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Satu master = satu berkas SVG mandiri (+ raster per skala). */
interface Master {
  id: string;
  grup: string;
  nama: string;
  jenis: Jenis;
  tokoh: 'miss-raksa' | 'bu-rina' | null;
  lapisan: string;
  lokasi: IdLokasiAdegan | null;
  pose: string | null;
  ekspresi: Ekspresi | null;
  varian: Record<string, string | boolean>;
  isi: string;
  /** viewBox (satuan dunia pada skala 1); titik-titik di bawah dalam ruang koordinat viewBox ini. */
  kotak: Kotak;
  posisiDunia?: Titik;
  jangkar?: Titik;
  kepala?: Titik;
  tangan?: { kiri?: Titik; kanan?: Titik };
  engsel?: Titik;
  jendela?: JendelaPotret & { nama: string };
  dipakai?: string;
  sumber: { berkas: string; fungsi: string; opsi?: unknown };
  /** Awalan id yang sah di SVG ini (selain itu = id liar). */
  awalanId: string[];
  /** Sisi yang BOLEH menyentuh tepi kanvas (potongan potret, latar penuh, kotak lapisan rapat). */
  tepiBoleh: Sisi[];
  /** Periksa gambar yang melewati kotak viewBox (render ber-pad). */
  periksaLuar: boolean;
  /**
   * Lapisan ruang & prop: kotak ekspor BOLEH diperluas ke gambar yang meluber (panggung menggambar lapisan dengan
   * overflow terlihat), dijepit ke `batas` (dunia 1600 x 900 untuk ruang). Kotak kontrak asli tetap di `kotakLapisan`.
   */
  bolehLuas?: boolean;
  batas?: Kotak;
  kotakLapisan?: Kotak;
  perluasan?: Record<Sisi, number>;
}

const SEMUA_SISI: Sisi[] = ['atas', 'kanan', 'bawah', 'kiri'];
const SUMBER_MR = 'client/src/cerita/seni/tokoh/missRaksa.ts';
const SUMBER_BR = 'client/src/cerita/seni/tokoh/buRina.ts';
const SUMBER_RUANG = 'client/src/cerita/seni/ruang/index.ts';
const SUMBER_PROP = 'client/src/cerita/seni/ruang/prop.ts';

/** Wajah Miss Raksa saat MENDENGARKAN (ui/adegan.ts `wajahMendengar`, tidak diekspor): netral / cemas / tersenyum. */
const WAJAH_DENGAR_MR: readonly Ekspresi[] = ['netral', 'cemas', 'tersenyum'];

/**
 * Ekspresi yang benar-benar dipakai cerita untuk Miss Raksa: ekspresi baris (dan umpan balik) semua pembicara yang
 * potretnya `missRaksa`, + `netral` (bawaan baris tanpa ekspresi), + wajah mendengar. Urutan = DAFTAR_EKSPRESI.
 */
function ekspresiMissRaksa(): Ekspresi[] {
  const pembicara = new Set(Object.entries(EPISODE_AUTO_1.pemeran).filter(([, p]) => p.potret === 'missRaksa').map(([k]) => k));
  if (!pembicara.size) pembicara.add('missRaksa');
  const set = new Set<Ekspresi>(['netral', ...WAJAH_DENGAR_MR]);
  const jalan = (o: unknown): void => {
    if (Array.isArray(o)) return o.forEach(jalan);
    if (!o || typeof o !== 'object') return;
    const r = o as Record<string, unknown>;
    if (typeof r.siapa === 'string' && pembicara.has(r.siapa) && typeof r.ekspresi === 'string') set.add(r.ekspresi as Ekspresi);
    for (const v of Object.values(r)) jalan(v);
  };
  jalan(EPISODE_AUTO_1);
  return DAFTAR_EKSPRESI.filter((e) => set.has(e));
}

const nm = (...bagian: (string | false | undefined | null)[]): string => bagian.filter(Boolean).join('_');

function dariGambar(g: GambarTokoh, isi: string): Pick<Master, 'isi' | 'kotak' | 'jangkar' | 'kepala' | 'tangan'> {
  const tangan = g.tangan && (g.tangan.kiri || g.tangan.kanan) ? { ...(g.tangan.kiri ? { kiri: { ...g.tangan.kiri } } : {}), ...(g.tangan.kanan ? { kanan: { ...g.tangan.kanan } } : {}) } : undefined;
  return { isi, kotak: { x: 0, y: 0, w: g.w, h: g.h }, jangkar: { ...g.jangkar }, kepala: { ...g.kepala }, ...(tangan ? { tangan } : {}) };
}

function varianTokoh(o: { bicara?: boolean; kedip?: boolean; kecil?: boolean; pandang?: string; hadap?: string; kunci?: boolean }, bu: boolean): Record<string, string | boolean> {
  return {
    bicara: !!o.bicara, kedip: !!o.kedip, kecil: !!o.kecil, pandang: o.pandang ?? 'bawaan',
    ...(bu ? { hadap: o.hadap ?? 'kiri', kunci: !!o.kunci } : {}),
  };
}

function mastersMissRaksa(ekspresi: Ekspresi[]): Master[] {
  const hasil: Master[] = [];
  const tambah = (o: OpsiMissRaksa, akhiran: string[]): void => {
    const g = gambarMissRaksa(o);
    const nama = nm(o.pose, o.ekspresi, ...akhiran);
    const dasar = {
      grup: 'miss-raksa', jenis: 'tokoh' as const, tokoh: 'miss-raksa' as const, lokasi: null, pose: o.pose, ekspresi: o.ekspresi,
      varian: varianTokoh(o, false), sumber: { berkas: SUMBER_MR, fungsi: 'gambarMissRaksa', opsi: o }, awalanId: ['mr'],
      tepiBoleh: [] as Sisi[], periksaLuar: true,
    };
    hasil.push({ ...dasar, id: `miss-raksa/${nama}`, nama, lapisan: 'badan', ...dariGambar(g, g.svg) });
    if (g.diAtasMeja) {
      const n2 = nm(nama, 'atas-meja');
      hasil.push({ ...dasar, id: `miss-raksa/${n2}`, nama: n2, lapisan: 'diAtasMeja', ...dariGambar(g, g.diAtasMeja), awalanId: ['mrd'] });
    }
  };
  for (const pose of Object.keys(JENIS_POSE_MENTOR) as PoseMentor[]) for (const e of ekspresi) tambah({ pose, ekspresi: e }, []);
  for (const e of ekspresi) tambah({ pose: 'duduk-dengar', ekspresi: e, bicara: true }, ['bicara']);
  tambah({ pose: 'duduk-dengar', ekspresi: 'netral', kedip: true }, ['kedip']);
  return hasil;
}

/** Kunci mobil di tangan untuk pose berdiri/jalan (seperti panggung: kedatangan, kepergian, parkiran). */
const POSE_BERKUNCI: ReadonlySet<PoseNasabah> = new Set(['berdiri', 'jalan-a', 'jalan-b', 'berdiri-pergi']);

function mastersBuRina(): Master[] {
  const hasil: Master[] = [];
  const tambah = (o: OpsiBuRina, akhiran: string[]): void => {
    const g = gambarBuRina(o);
    const nama = nm(o.pose, o.ekspresi, ...akhiran);
    hasil.push({
      id: `bu-rina/${nama}`, grup: 'bu-rina', nama, jenis: 'tokoh', tokoh: 'bu-rina', lapisan: 'badan', lokasi: null, pose: o.pose,
      ekspresi: o.ekspresi, varian: varianTokoh(o, true), sumber: { berkas: SUMBER_BR, fungsi: 'gambarBuRina', opsi: o },
      awalanId: ['rina'], tepiBoleh: [], periksaLuar: true, ...dariGambar(g, g.svg),
    });
    if (g.diAtasMeja) {
      const n2 = nm(nama, 'atas-meja');
      hasil.push({
        id: `bu-rina/${n2}`, grup: 'bu-rina', nama: n2, jenis: 'tokoh', tokoh: 'bu-rina', lapisan: 'diAtasMeja', lokasi: null, pose: o.pose,
        ekspresi: o.ekspresi, varian: varianTokoh(o, true), sumber: { berkas: SUMBER_BR, fungsi: 'gambarBuRina', opsi: o },
        awalanId: ['rina'], tepiBoleh: [], periksaLuar: true, ...dariGambar(g, g.diAtasMeja),
      });
    }
  };
  for (const pose of Object.keys(JENIS_POSE_NASABAH) as PoseNasabah[]) {
    for (const e of DAFTAR_EKSPRESI) tambah({ pose, ekspresi: e, ...(POSE_BERKUNCI.has(pose) ? { kunci: true } : {}) }, []);
  }
  // Langkah kepergian menghadap pintu (rencana.ts rencanaPergi: hadap kanan tanpa cermin CSS).
  for (const pose of ['jalan-a', 'jalan-b'] as const) for (const e of DAFTAR_EKSPRESI) tambah({ pose, ekspresi: e, kunci: true, hadap: 'kanan' }, ['kanan']);
  // Versi kecil: badan penuh aktivitas (nasabah.ts nasabahBadanPenuh) & sisipan telepon di HP (Panggung.tsx).
  for (const e of DAFTAR_EKSPRESI) tambah({ pose: 'berdiri', ekspresi: e, kunci: true, kecil: true, pandang: 'depan' }, ['kecil']);
  for (const e of DAFTAR_EKSPRESI) tambah({ pose: 'telepon', ekspresi: e, kecil: true }, ['kecil']);
  for (const e of DAFTAR_EKSPRESI) tambah({ pose: 'duduk', ekspresi: e, bicara: true }, ['bicara']);
  tambah({ pose: 'duduk', ekspresi: 'netral', kedip: true }, ['kedip']);
  return hasil;
}

function mastersPotret(ekspresiMr: Ekspresi[]): Master[] {
  const hasil: Master[] = [];
  const jendela = (J: JendelaPotret, nama: string) => ({ x: J.x, y: J.y, sisi: J.sisi, nama });
  const dasar = (tokoh: 'miss-raksa' | 'bu-rina', nama: string, e: Ekspresi, pose: string) => ({
    id: `potret/${nama}`, grup: 'potret', nama, jenis: 'potret' as const, tokoh, lapisan: 'potret', lokasi: null, pose, ekspresi: e,
    // Potret = potongan jendela: bahu boleh terpotong di kiri/kanan/bawah; puncak kepala tidak.
    tepiBoleh: ['kiri', 'kanan', 'bawah'] as Sisi[], periksaLuar: false,
  });
  // Miss Raksa (PotretMissRaksa.tsx → aturanPotret): > 75 px normal, 53-75 px jendela v3 + versi kecil, <= 52 px jendela kecil.
  const ATURAN_MR: { nama: string; ukuran: number; dipakai: string }[] = [
    { nama: 'v3', ukuran: 96, dipakai: '> 75 px (lembar galeri)' },
    { nama: 'v3-kecil', ukuran: 64, dipakai: `${POTRET_KECIL_MAKS_PX + 1}-75 px (mis. hub cerita 56 px)` },
    { nama: 'kecil', ukuran: POTRET_KECIL_MAKS_PX, dipakai: `<= ${POTRET_KECIL_MAKS_PX} px (dialog 52, aktivitas 44, kartu akhir 28)` },
  ];
  for (const a of ATURAN_MR) {
    for (const e of ekspresiMr) {
      const at = aturanPotret(a.ukuran);
      const p = potretMissRaksa({ ekspresi: e, ukuran: a.ukuran });
      const g = gambarMissRaksa({ pose: 'duduk-dengar', ekspresi: e, pandang: 'pemain', kecil: at.kecil });
      const J = at.jendela;
      const [vx, vy, vw, vh] = p.viewBox.split(/\s+/).map(Number) as [number, number, number, number];
      hasil.push({
        ...dasar('miss-raksa', nm('miss-raksa', a.nama, e), e, 'duduk-dengar'),
        varian: { bicara: false, kedip: false, kecil: at.kecil, pandang: 'pemain', jendela: J.sisi === JENDELA_POTRET_V3.sisi ? 'v3' : 'kecil' },
        isi: p.svg, kotak: { x: vx, y: vy, w: vw, h: vh }, kepala: { ...g.kepala }, jendela: jendela(J, J.sisi === JENDELA_POTRET_V3.sisi ? 'JENDELA_POTRET_V3' : 'JENDELA_POTRET_KECIL'),
        dipakai: a.dipakai, sumber: { berkas: SUMBER_MR, fungsi: 'potretMissRaksa', opsi: { ekspresi: e, ukuran: a.ukuran } }, awalanId: ['mr'],
      });
    }
  }
  // Bu Rina (TokohNasabah.tsx PotretNasabah): > 52 px jendela v3 normal, <= 52 px jendela kecil + versi kecil.
  for (const kecil of [false, true]) {
    for (const e of DAFTAR_EKSPRESI) {
      const J = kecil ? JENDELA_POTRET_KECIL : JENDELA_POTRET_V3;
      const o: OpsiBuRina = { pose: 'duduk', ekspresi: e, pandang: 'pemain', kecil };
      const g = gambarBuRina(o);
      hasil.push({
        ...dasar('bu-rina', nm('bu-rina', kecil ? 'kecil' : 'v3', e), e, 'duduk'),
        varian: { bicara: false, kedip: false, kecil, pandang: 'pemain', jendela: kecil ? 'kecil' : 'v3' },
        isi: g.svg, kotak: { x: J.x, y: J.y, w: J.sisi, h: J.sisi }, kepala: { ...g.kepala },
        jendela: jendela(J, kecil ? 'JENDELA_POTRET_KECIL' : 'JENDELA_POTRET_V3'),
        dipakai: kecil ? `<= ${POTRET_KECIL_MAKS_PX} px (dialog 52, aktivitas 44, riwayat 32)` : `> ${POTRET_KECIL_MAKS_PX} px (kartu akhir 64)`,
        sumber: { berkas: SUMBER_BR, fungsi: 'gambarBuRina', opsi: o }, awalanId: ['rina'],
      });
    }
  }
  // Sisipan panggilan telepon (Panggung.tsx SisipanTelepon): jendela digeser mengikuti kepala pose telepon.
  for (const kecil of [false, true]) {
    for (const e of DAFTAR_EKSPRESI) {
      const J = kecil ? JENDELA_POTRET_KECIL : JENDELA_POTRET_V3;
      const o: OpsiBuRina = { pose: 'telepon', ekspresi: e, kecil };
      const g = gambarBuRina(o);
      const x = J.x + g.kepala.x - KANVAS_DUDUK.kepala.x;
      const y = J.y + g.kepala.y - KANVAS_DUDUK.kepala.y;
      hasil.push({
        ...dasar('bu-rina', nm('bu-rina', kecil ? 'telepon-kecil' : 'telepon-v3', e), e, 'telepon'),
        varian: { bicara: false, kedip: false, kecil, pandang: 'bawaan', jendela: kecil ? 'telepon-kecil' : 'telepon-v3' },
        isi: g.svg, kotak: { x, y, w: J.sisi, h: J.sisi }, kepala: { ...g.kepala },
        jendela: { x, y, sisi: J.sisi, nama: `${kecil ? 'JENDELA_POTRET_KECIL' : 'JENDELA_POTRET_V3'} digeser ke kepala pose telepon` },
        dipakai: kecil ? 'sisipan telepon HP/tablet (44-52 px)' : 'sisipan telepon desktop (64 px)',
        sumber: { berkas: SUMBER_BR, fungsi: 'gambarBuRina', opsi: o }, awalanId: ['rina'],
      });
    }
  }
  return hasil;
}

function mastersRuang(): Master[] {
  const hasil: Master[] = [];
  for (const lok of DAFTAR_LOKASI_ADEGAN) {
    const r = ruangAdegan(lok);
    if (r.latar.svg === ruangSementara(lok).latar.svg) throw new Error(`ruang '${lok}': generator final gagal, jatuh ke pengganti sementara`);
    const lapis: [string, LapisanSvg | undefined, Partial<Master>?][] = [
      ['latar', r.latar],
      ['koridor', r.koridor],
      ['pintu-daun', r.pintu?.daun, r.pintu ? { engsel: { x: r.pintu.engsel.x - r.pintu.daun.x, y: r.pintu.engsel.y - r.pintu.daun.y } } : undefined],
      ['belakang-meja', r.belakangMeja],
      ['depan-meja', r.depanMeja],
      ['kursi-belakang', r.kursi?.belakang],
      ['kursi-depan', r.kursi?.depan],
    ];
    for (const [nama, l, tambahan] of lapis) {
      if (!l) continue;
      const n2 = nm(lok, nama);
      hasil.push({
        id: `ruang/${n2}`, grup: 'ruang', nama: n2, jenis: 'ruang', tokoh: null, lapisan: nama, lokasi: lok, pose: null, ekspresi: null,
        varian: {}, isi: l.svg, kotak: { x: 0, y: 0, w: l.w, h: l.h }, posisiDunia: { x: l.x, y: l.y },
        sumber: { berkas: SUMBER_RUANG, fungsi: `ruangAdegan('${lok}')` }, awalanId: ['rg-'],
        // Lapisan = kotak rapat (tepi boleh disentuh); gambar yang MELEWATI kotak ikut diekspor (kotak diperluas,
        // dijepit ke dunia 1600 x 900), karena panggung menggambarnya (overflow terlihat).
        tepiBoleh: SEMUA_SISI, periksaLuar: nama !== 'latar', bolehLuas: nama !== 'latar',
        batas: { x: -l.x, y: -l.y, w: 1600, h: 900 },
        ...(tambahan ?? {}),
      });
    }
  }
  return hasil;
}

function mastersProp(): Master[] {
  const daftar: [string, string, ReturnType<typeof propMap>][] = [
    ['map', 'propMap()', propMap()],
    ['kartu-polis', 'propKartuPolis()', propKartuPolis()],
    ['kunci', 'propKunci()', propKunci()],
    ['telepon', 'propTelepon({ gagang: true })', propTelepon({ gagang: true })],
    ['telepon-tanpa-gagang', 'propTelepon({ gagang: false })', propTelepon({ gagang: false })],
    ['gagang', 'propGagang()', propGagang()],
  ];
  return daftar.map(([nama, fungsi, p]) => ({
    id: `prop/${nama}`, grup: 'prop', nama, jenis: 'prop' as const, tokoh: null, lapisan: 'prop', lokasi: null, pose: null, ekspresi: null,
    varian: {}, isi: p.svg, kotak: { x: 0, y: 0, w: p.w, h: p.h }, jangkar: { ...p.jangkar },
    sumber: { berkas: SUMBER_PROP, fungsi }, awalanId: ['rg-'], tepiBoleh: SEMUA_SISI, periksaLuar: true, bolehLuas: true,
  }));
}

// ------------------------------------------------------------------ pemeriksaan SVG (id liar, angka rusak)

function periksaSvg(m: Master): string[] {
  const masalah: string[] = [];
  const ids = [...m.isi.matchAll(/\sid\s*=\s*"([^"]*)"/g)].map((x) => x[1]!);
  const ganda = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (ganda.length) masalah.push(`id ganda: ${[...new Set(ganda)].slice(0, 5).join(', ')}`);
  const liar = ids.filter((id) => !m.awalanId.some((a) => id.startsWith(a)));
  if (liar.length) masalah.push(`id tanpa awalan ${m.awalanId.join('/')}: ${[...new Set(liar)].slice(0, 5).join(', ')}`);
  const set = new Set(ids);
  const rujukan = [...m.isi.matchAll(/url\(\s*["']?#([^"')\s]+)["']?\s*\)/g), ...m.isi.matchAll(/href\s*=\s*["']#([^"']+)["']/g)].map((x) => x[1]!);
  const hilang = rujukan.filter((r) => !set.has(r));
  if (hilang.length) masalah.push(`rujukan id tak ada: ${[...new Set(hilang)].slice(0, 5).join(', ')}`);
  if (/NaN|undefined|Infinity/.test(m.isi)) masalah.push('angka rusak (NaN/undefined/Infinity) di SVG');
  if (/<(text|image|script|foreignObject)\b/i.test(m.isi)) masalah.push('elemen <text>/<image>/<script>/<foreignObject> di master');
  return masalah;
}

// ------------------------------------------------------------------ alat berkas

const sha256 = (b: string | Uint8Array): string => createHash('sha256').update(b).digest('hex');
const rel = (dasar: string, p: string): string => path.relative(dasar, p).split(path.sep).join('/');
const f1 = (n: number): number => Math.round(n * 10) / 10;

function dokumenSvg(isi: string, k: Kotak, pad = 0): string {
  const vb = `${f1(k.x - pad)} ${f1(k.y - pad)} ${f1(k.w + 2 * pad)} ${f1(k.h + 2 * pad)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${f1(k.w + 2 * pad)}" height="${f1(k.h + 2 * pad)}">${isi}</svg>`;
}

/** Penanda folder hasil alat ini (ditulis sebelum apa pun; ekspor yang terputus tetap dikenali). */
const PENANDA = '.ekspor-aset-cerita';

/** Siapkan folder keluaran: hanya mengosongkan folder yang memang hasil alat ini (ada penanda / manifest milik alat ini). */
function siapkanKeluar(dir: string): void {
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) {
    let milikKita = fs.existsSync(path.join(dir, PENANDA));
    if (!milikKita) {
      try {
        milikKita = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')).alat === ALAT;
      } catch {
        milikKita = false;
      }
    }
    if (!milikKita) throw new Error(`folder keluaran ${dir} tidak kosong dan bukan hasil ${ALAT}; pilih --keluar lain`);
    for (const sub of ['svg', 'png', 'webp', 'lembar', 'manifest.json']) fs.rmSync(path.join(dir, sub), { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, PENANDA), `${ALAT}\n`);
}

// ------------------------------------------------------------------ peramban

interface HasilAnalisis {
  w: number;
  h: number;
  sudut: number[];
  tepi: Record<Sisi, number>;
  jarak: Record<Sisi, number> | null;
  terisi: number;
  transparan: number;
}

/** Dijalankan DI peramban: statistik alfa sebuah gambar (PNG/WebP base64). */
const ANALISIS_JS = `
window.__analisis = async (b64, mime) => {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const bmp = await createImageBitmap(new Blob([bin], { type: mime }), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const w = bmp.width, h = bmp.height;
  const kv = new OffscreenCanvas(w, h);
  const cx = kv.getContext('2d');
  cx.drawImage(bmp, 0, 0);
  const d = cx.getImageData(0, 0, w, h).data;
  const A = (x, y) => d[(y * w + x) * 4 + 3];
  const AMBANG = 8;
  const tepi = { atas: 0, kanan: 0, bawah: 0, kiri: 0 };
  for (let x = 0; x < w; x++) { if (A(x, 0) > AMBANG) tepi.atas++; if (A(x, h - 1) > AMBANG) tepi.bawah++; }
  for (let y = 0; y < h; y++) { if (A(0, y) > AMBANG) tepi.kiri++; if (A(w - 1, y) > AMBANG) tepi.kanan++; }
  let x0 = w, y0 = h, x1 = -1, y1 = -1, isi = 0, nol = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = d[(y * w + x) * 4 + 3];
    if (a === 0) nol++;
    if (a > AMBANG) { isi++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return {
    w, h, sudut: [A(0, 0), A(w - 1, 0), A(0, h - 1), A(w - 1, h - 1)], tepi,
    jarak: x1 < 0 ? null : { atas: y0, kanan: w - 1 - x1, bawah: h - 1 - y1, kiri: x0 },
    terisi: isi / (w * h), transparan: nol / (w * h),
  };
};
/** Gambar SVG ber-pad: hitung piksel di LUAR kotak asli (gambar yang akan terpotong di ekspor). */
window.__luar = async (svg, pad, w, h) => {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const W = Math.ceil(w + 2 * pad), H = Math.ceil(h + 2 * pad);
    const kv = new OffscreenCanvas(W, H);
    const cx = kv.getContext('2d');
    cx.drawImage(img, 0, 0, W, H);
    const d = cx.getImageData(0, 0, W, H).data;
    const px = { atas: 0, kanan: 0, bawah: 0, kiri: 0 };
    const dalam = { atas: 0, kanan: 0, bawah: 0, kiri: 0 };
    const x1 = pad + w, y1 = pad + h;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] <= 8) continue;
      if (y < pad) px.atas++;
      else if (y >= y1) px.bawah++;
      else if (x < pad) px.kiri++;
      else if (x >= x1) px.kanan++;
      // kedalaman (px dari garis kotak) per sisi; piksel sudut dihitung ke dua sisi
      if (y < pad) dalam.atas = Math.max(dalam.atas, pad - y);
      if (y >= y1) dalam.bawah = Math.max(dalam.bawah, y - y1 + 1);
      if (x < pad) dalam.kiri = Math.max(dalam.kiri, pad - x);
      if (x >= x1) dalam.kanan = Math.max(dalam.kanan, x - x1 + 1);
    }
    return { px, dalam };
  } finally { URL.revokeObjectURL(url); }
};
`;

const HALAMAN_RASTER = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}#k>svg{display:block}</style></head><body><div id="k"></div></body></html>`;

type Peramban = import('puppeteer-core').Browser;
type Halaman = import('puppeteer-core').Page;

async function bukaPeramban(): Promise<Peramban> {
  const req = createRequire(path.join(ROOT, 'package.json'));
  const puppeteer = req('puppeteer-core') as typeof import('puppeteer-core');
  const exe = process.env.RAKSA_CHROME || CHROME_BAWAAN;
  if (!fs.existsSync(exe)) throw new Error(`Chrome tidak ditemukan: ${exe} (atur RAKSA_CHROME)`);
  return puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
}

async function halamanRaster(b: Peramban, skala: number): Promise<Halaman> {
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 1000, deviceScaleFactor: skala });
  await p.setContent(HALAMAN_RASTER);
  await p.addScriptTag({ content: ANALISIS_JS });
  return p;
}

/** Render ber-pad (1 satuan = 1 px): piksel & kedalaman gambar di luar kotak ekspor. Pad ruang/prop lebih lebar. */
async function cekLuar(p: Halaman, m: Master): Promise<HasilLuar> {
  const pad = m.bolehLuas ? 300 : 80;
  type Fn = { __luar: (s: string, p: number, w: number, h: number) => Promise<HasilLuar> };
  return p.evaluate((svg, pad, w, h) => (window as unknown as Fn).__luar(svg, pad, w, h), dokumenSvg(m.isi, m.kotak, pad), pad, m.kotak.w, m.kotak.h);
}

/** Perluas kotak ekspor ke gambar yang meluber (bilangan bulat), dijepit ke `batas`; kotak kontrak disimpan. */
function perluasKotak(m: Master, dalam: Record<Sisi, number>): void {
  const k = m.kotak;
  let x0 = Math.floor(k.x - dalam.kiri);
  let y0 = Math.floor(k.y - dalam.atas);
  let x1 = Math.ceil(k.x + k.w + dalam.kanan);
  let y1 = Math.ceil(k.y + k.h + dalam.bawah);
  if (m.batas) {
    x0 = Math.max(x0, Math.min(k.x, m.batas.x));
    y0 = Math.max(y0, Math.min(k.y, m.batas.y));
    x1 = Math.min(x1, Math.max(k.x + k.w, m.batas.x + m.batas.w));
    y1 = Math.min(y1, Math.max(k.y + k.h, m.batas.y + m.batas.h));
  }
  const luas = { atas: f1(k.y - y0), kanan: f1(x1 - k.x - k.w), bawah: f1(y1 - k.y - k.h), kiri: f1(k.x - x0) };
  // Semua luberan di luar batas (dunia): kotak tetap, hanya dicatat.
  if (!SEMUA_SISI.some((s) => luas[s] > 0)) return;
  m.kotakLapisan = { ...k };
  m.kotak = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  m.perluasan = luas;
}

// ------------------------------------------------------------------ hasil per master

interface BerkasRaster {
  skala: number;
  px: { w: number; h: number };
  png: { berkas: string; bytes: number };
  webp: { berkas: string; bytes: number };
}

interface Hasil {
  m: Master;
  svg?: { berkas: string; bytes: number; sha256: string };
  raster: BerkasRaster[];
  analisis: Record<number, HasilAnalisis>;
  webpSudut: Record<number, number[]>;
  /** Gambar di luar kotak ekspor akhir (px pada skala 1 & kedalaman px per sisi); `luarAwal` = sebelum diperluas. */
  luar?: HasilLuar;
  luarAwal?: HasilLuar;
  gagal: string[];
  masalah: string[];
  catatan: string[];
}

interface HasilLuar {
  px: Record<Sisi, number>;
  dalam: Record<Sisi, number>;
}

const teksLuar = (l: HasilLuar): string => SEMUA_SISI.filter((s) => l.px[s] > 0 || l.dalam[s] > 0).map((s) => `${s} ${l.px[s]} px, sedalam ${l.dalam[s]}`).join('; ');

function nilaiMasalah(h: Hasil): void {
  const m = h.m;
  h.masalah.push(...periksaSvg(m));
  for (const [s, a] of Object.entries(h.analisis)) {
    const skala = Number(s);
    const kena = SEMUA_SISI.filter((sisi) => a.tepi[sisi] > 0 && !m.tepiBoleh.includes(sisi));
    if (kena.length) h.masalah.push(`x${skala}: menyentuh tepi kanvas (${kena.map((k) => `${k} ${a.tepi[k]} px`).join(', ')})`);
    if (m.jenis === 'tokoh' && a.sudut.some((v) => v !== 0)) h.masalah.push(`x${skala}: sudut PNG tidak transparan (${a.sudut.join('/')})`);
    if (m.lapisan === 'latar' && a.transparan > 0.001) h.masalah.push(`x${skala}: latar berlubang (${(a.transparan * 100).toFixed(2)} % piksel transparan)`);
    if (m.lapisan !== 'latar' && a.terisi === 0) h.masalah.push(`x${skala}: PNG kosong`);
    if (m.jenis === 'tokoh' && a.jarak && !kena.length) {
      const mepet = SEMUA_SISI.filter((sisi) => a.jarak![sisi] <= 2 * skala);
      if (mepet.length) h.catatan.push(`x${skala}: gambar hanya ${mepet.map((k) => `${a.jarak![k]} px dari tepi ${k}`).join(', ')} (tidak terpotong, tanpa ruang sisa)`);
    }
    const ws = h.webpSudut[skala];
    if (ws && a.sudut.some((v, i) => (v === 0) !== (ws[i] === 0))) h.masalah.push(`x${skala}: alfa sudut WebP (${ws.join('/')}) beda dari PNG (${a.sudut.join('/')})`);
  }
  if (m.perluasan && h.luarAwal) {
    h.catatan.push(`kotak ekspor diperluas dari kotak lapisan (${SEMUA_SISI.filter((s) => m.perluasan![s]).map((s) => `${s} +${m.perluasan![s]}`).join(', ')}): gambar meluber ${teksLuar(h.luarAwal)}`);
  }
  if (h.luar && SEMUA_SISI.some((s) => h.luar!.px[s] > 0)) {
    if (m.jenis === 'tokoh') h.masalah.push(`gambar melewati kanvas, TERPOTONG (${teksLuar(h.luar)})`);
    else if (m.batas) h.catatan.push(`sisa gambar di luar dunia 1600 x 900 tidak diekspor (tak terlihat di panggung): ${teksLuar(h.luar)}`);
    else h.masalah.push(`gambar melewati kotak ekspor, terpotong (${teksLuar(h.luar)})`);
  }
}

// ------------------------------------------------------------------ lembar galeri

const CSS_LEMBAR = `
*{box-sizing:border-box}
body{margin:0;padding:24px 28px 32px;background:#f3efe7;color:#2b2622;font:13px/1.35 "Segoe UI",Arial,sans-serif}
h1{font-size:22px;margin:0 0 2px}h2{font-size:16px;margin:22px 0 8px;border-bottom:1px solid #d8cfc2;padding-bottom:4px}
.sub{color:#6b625a;margin:0 0 6px}.legenda{color:#6b625a;margin:0 0 14px;font-size:12px}
.legenda i{display:inline-block;width:10px;height:10px;border-radius:50%;margin:0 4px 0 10px;vertical-align:-1px}
.baris{display:flex;gap:10px;align-items:flex-start;margin:0 0 14px}
.jb{width:118px;flex:none;align-self:center;font-weight:600;font-size:13px}
.jb small{display:block;font-weight:400;color:#6b625a}
figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:3px}
.kv{position:relative;flex:none;outline:1px dashed #a39a8e;background:#fff conic-gradient(#ebe6de 25%,#fff 0 50%,#ebe6de 0 75%,#fff 0) 0 0/14px 14px}
.kv>img,.kv>svg{position:absolute;left:0;top:0;width:100%;height:100%}
figcaption{font-size:11.5px;text-align:center;color:#3b342e;max-width:190px}
.masalah .kv{outline:3px solid #d0302b}.masalah figcaption{color:#b0201b;font-weight:700}
.bulat{border-radius:50%;overflow:hidden;background:#fbefd0;box-shadow:0 0 0 1px #e2d6ad,inset 0 0 0 2px #fff;position:relative;flex:none}
.bulat>img{position:absolute;inset:0;width:100%;height:100%}
.grup{display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap}
.dunia{position:relative;overflow:hidden;outline:1px solid #8d8479;background:#fff}
.dunia>*{position:absolute}
`;

interface Lembar {
  nama: string;
  lebar: number;
  html: string;
}

function urlBerkas(p: string): string {
  return pathToFileURL(p).href;
}

/**
 * Tanda titik manifest di atas sel (garis saja, tidak menutup wajah): jangkar = silang merah, kepala = cincin biru
 * setinggi kepala kontrak (KEPALA_TINGGI), tangan = cincin hijau, engsel pintu = cincin ungu, kotak lapisan asli
 * (bila kotak ekspor diperluas) = persegi ungu putus-putus.
 */
function tanda(m: Master, skalaTampil: number): string {
  const k = m.kotak;
  const u = 1 / skalaTampil;
  let s = '';
  const cincin = (p: Titik | undefined, warna: string, r: number, ekstra = '') => {
    if (p) s += `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(r)}" fill="none" stroke="${warna}" stroke-width="${f1(1.2 * u)}" ${ekstra}/>`;
  };
  if (m.jangkar) {
    const p = m.jangkar;
    s += `<path d="M${f1(p.x - 7 * u)} ${f1(p.y)}h${f1(14 * u)}M${f1(p.x)} ${f1(p.y - 7 * u)}v${f1(14 * u)}" stroke="#d0302b" stroke-width="${f1(1.6 * u)}"/>`;
  }
  cincin(m.kepala, '#2465c9', KEPALA_TINGGI / 2, `stroke-dasharray="${f1(4 * u)} ${f1(3 * u)}" opacity=".75"`);
  cincin(m.tangan?.kiri, '#1f9a4a', 5 * u);
  cincin(m.tangan?.kanan, '#1f9a4a', 5 * u);
  cincin(m.engsel, '#8a3fc4', 5 * u);
  const kl = m.kotakLapisan;
  if (kl) s += `<rect x="${f1(kl.x)}" y="${f1(kl.y)}" width="${f1(kl.w)}" height="${f1(kl.h)}" fill="none" stroke="#8a3fc4" stroke-width="${f1(1.2 * u)}" stroke-dasharray="${f1(5 * u)} ${f1(3 * u)}"/>`;
  return s ? `<svg viewBox="${k.x} ${k.y} ${k.w} ${k.h}" preserveAspectRatio="none">${s}</svg>` : '';
}

function sel(h: Hasil, keluar: string, skalaTampil: number, label: string, opsi: { tanpaTanda?: boolean } = {}): string {
  const m = h.m;
  const png = h.raster[0]?.png.berkas;
  const src = png ? urlBerkas(path.join(keluar, png)) : '';
  const w = Math.round(m.kotak.w * skalaTampil);
  const hh = Math.round(m.kotak.h * skalaTampil);
  const masalah = h.masalah.length || h.gagal.length;
  const ket = masalah ? `<br>${h.gagal.length ? 'GAGAL' : 'TEPI/ID: ' + h.masalah.length}` : '';
  return `<figure class="${masalah ? 'masalah' : ''}"><div class="kv" style="width:${w}px;height:${hh}px"><img src="${src}" alt="">${opsi.tanpaTanda ? '' : tanda(m, skalaTampil)}</div><figcaption style="max-width:${Math.max(w, 96)}px">${label}${ket}</figcaption></figure>`;
}

function kepalaLembar(judul: string, sub: string, args: Argumen, legenda = true, bahan = `PNG x${args.skala[0]} di atas papan catur (= transparan), garis putus = batas kanvas`): string {
  return `<h1>${judul}</h1><p class="sub">${sub} · dibuat ${args.waktu} · ${ALAT} · ${bahan}</p>${
    legenda ? '<p class="legenda">Tanda:<i style="background:#d0302b"></i>jangkar (silang)<i style="background:#2465c9"></i>kepala (cincin setinggi kepala kontrak)<i style="background:#1f9a4a"></i>tangan<i style="background:#8a3fc4"></i>engsel pintu / kotak lapisan asli (putus-putus) · bingkai merah = masalah tepi/id (lihat manifest)</p>' : ''
  }`;
}

/** Lebar lembar: padding + kolom judul + kolom sel (sel = max(gambar, 96 px) + celah). */
const lebarLembar = (kolom: number, selPx: number): number => 56 + 128 + kolom * (Math.max(selPx, 96) + 10) + 16;

function dok(isi: string, lebar: number): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS_LEMBAR}body{width:${lebar}px}</style></head><body>${isi}</body></html>`;
}

function lembarMissRaksa(hs: Hasil[], keluar: string, args: Argumen, ekspresi: Ekspresi[]): Lembar {
  const cari = (id: string) => hs.find((h) => h.m.id === id);
  const F = 0.34;
  let isi = kepalaLembar('Galeri Miss Raksa v3', `${ekspresi.length} ekspresi yang dipakai cerita (${ekspresi.join(', ')}) × 7 pose, lapisan tangan di atas meja, varian bicara/kedip, potret`, args);
  isi += '<h2>Pose × ekspresi (skala tampil 0,34)</h2>';
  for (const pose of Object.keys(JENIS_POSE_MENTOR)) {
    let b = `<div class="baris"><div class="jb">${pose}<small>${JENIS_POSE_MENTOR[pose as PoseMentor]}</small></div>`;
    for (const e of ekspresi) {
      const h = cari(`miss-raksa/${nm(pose, e)}`);
      if (h) b += sel(h, keluar, F, `${pose} · ${e}`);
    }
    const atas = cari(`miss-raksa/${nm(pose, ekspresi[0]!, 'atas-meja')}`);
    if (atas) b += sel(atas, keluar, F, `${pose} · lapisan<br>diAtasMeja`);
    isi += b + '</div>';
  }
  isi += '<h2>Varian (duduk-dengar)</h2><div class="baris"><div class="jb">bicara / kedip</div>';
  for (const e of ekspresi) {
    const h = cari(`miss-raksa/${nm('duduk-dengar', e, 'bicara')}`);
    if (h) isi += sel(h, keluar, F, `bicara · ${e}`);
  }
  const kd = cari(`miss-raksa/${nm('duduk-dengar', 'netral', 'kedip')}`);
  if (kd) isi += sel(kd, keluar, F, 'kedip · netral');
  isi += '</div><h2>Potret (jendela persegi, ditampilkan 0,75×; bulatan UI tidak dipotong di sini)</h2>';
  for (const [j, ket] of [['v3', 'JENDELA_POTRET_V3 · normal'], ['v3-kecil', 'JENDELA_POTRET_V3 · versi kecil'], ['kecil', 'JENDELA_POTRET_KECIL · versi kecil']] as const) {
    isi += `<div class="baris"><div class="jb">${j}<small>${ket}</small></div>`;
    for (const e of ekspresi) {
      const h = cari(`potret/${nm('miss-raksa', j, e)}`);
      if (h) isi += sel(h, keluar, 0.75, `${j} · ${e}`, { tanpaTanda: true });
    }
    isi += '</div>';
  }
  const lebar = lebarLembar(ekspresi.length + 1, Math.ceil(Math.max(460 * F, JENDELA_POTRET_V3.sisi * 0.75)));
  return { nama: 'galeri-miss-raksa', lebar, html: dok(isi, lebar) };
}

function lembarBuRina(hs: Hasil[], keluar: string, args: Argumen): Lembar {
  const cari = (id: string) => hs.find((h) => h.m.id === id);
  const F = 0.3;
  const E = DAFTAR_EKSPRESI;
  let isi = kepalaLembar('Galeri Bu Rina v3', `7 pose × 8 ekspresi, langkah hadap kanan, versi kecil, bicara/kedip, potret`, args);
  const baris = (judul: string, sub: string, akhiran: string[], pose: string) => {
    let b = `<div class="baris"><div class="jb">${judul}<small>${sub}</small></div>`;
    for (const e of E) {
      const h = cari(`bu-rina/${nm(pose, e, ...akhiran)}`);
      if (h) b += sel(h, keluar, F, `${pose} · ${e}`);
    }
    return b + '</div>';
  };
  isi += '<h2>Pose × ekspresi (skala tampil 0,30)</h2>';
  for (const pose of Object.keys(JENIS_POSE_NASABAH)) isi += baris(pose, `${JENIS_POSE_NASABAH[pose as PoseNasabah]}${POSE_BERKUNCI.has(pose as PoseNasabah) ? ' · kunci' : ''}`, [], pose);
  isi += '<h2>Langkah kepergian hadap kanan (tanpa cermin)</h2>';
  for (const pose of ['jalan-a', 'jalan-b']) isi += baris(`${pose}`, 'hadap kanan · kunci', ['kanan'], pose);
  isi += '<h2>Versi kecil (garis & wajah tebal)</h2>';
  isi += baris('berdiri', 'kecil · aktivitas', ['kecil'], 'berdiri');
  isi += baris('telepon', 'kecil · sisipan HP', ['kecil'], 'telepon');
  isi += '<h2>Bicara & kedip</h2>';
  isi += baris('duduk', 'bicara', ['bicara'], 'duduk');
  const kd = cari(`bu-rina/${nm('duduk', 'netral', 'kedip')}`);
  if (kd) isi += `<div class="baris"><div class="jb">duduk<small>kedip</small></div>${sel(kd, keluar, F, 'duduk · netral · kedip')}</div>`;
  isi += '<h2>Potret (jendela persegi, ditampilkan 0,75×)</h2>';
  for (const [j, ket] of [['v3', 'JENDELA_POTRET_V3 · normal'], ['kecil', 'JENDELA_POTRET_KECIL · kecil'], ['telepon-v3', 'sisipan telepon desktop'], ['telepon-kecil', 'sisipan telepon HP']] as const) {
    isi += `<div class="baris"><div class="jb">${j}<small>${ket}</small></div>`;
    for (const e of E) {
      const h = cari(`potret/${nm('bu-rina', j, e)}`);
      if (h) isi += sel(h, keluar, 0.75, `${j} · ${e}`, { tanpaTanda: true });
    }
    isi += '</div>';
  }
  const lebar = lebarLembar(E.length, Math.ceil(Math.max(460 * F, JENDELA_POTRET_V3.sisi * 0.75)));
  return { nama: 'galeri-bu-rina', lebar, html: dok(isi, lebar) };
}

const NAMA_LOKASI: Record<IdLokasiAdegan, string> = {
  'pintu-luar': 'pintu-luar (koridor pembuka)',
  meja: 'meja (ruang layanan)',
  parkiran: 'parkiran',
  telepon: 'telepon (epilog, kursi pengunjung kosong)',
};

function lembarRuang(hs: Hasil[], keluar: string, args: Argumen): Lembar {
  const cari = (id: string) => hs.find((h) => h.m.id === id);
  const src = (h: Hasil | undefined) => (h?.raster[0] ? urlBerkas(path.join(keluar, h.raster[0].png.berkas)) : '');
  const F = 0.5;
  const namaPapan = EPISODE_AUTO_1.panggung?.lokasi.nama ?? '';
  let isi = kepalaLembar('Galeri ruang v3', `4 lokasi × lapisan, susunan uji dengan tokoh di titik tempat, prop`, args);
  for (const lok of DAFTAR_LOKASI_ADEGAN) {
    const r = ruangAdegan(lok);
    const lap = (n: string) => cari(`ruang/${nm(lok, n)}`);
    const img = (h: Hasil | undefined, z: number) => {
      if (!h?.m.posisiDunia) return '';
      // sudut kiri atas GAMBAR = posisi lapisan + asal viewBox (kotak ekspor bisa diperluas ke gambar yang meluber)
      const p = { x: h.m.posisiDunia.x + h.m.kotak.x, y: h.m.posisiDunia.y + h.m.kotak.y };
      return `<img src="${src(h)}" style="left:${p.x * F}px;top:${p.y * F}px;width:${h.m.kotak.w * F}px;height:${h.m.kotak.h * F}px;z-index:${z}" alt="">`;
    };
    const tokoh = (h: Hasil | undefined, titik: Titik, s: number, z: number) => {
      if (!h?.raster[0] || !h.m.jangkar) return '';
      const x = (titik.x - h.m.jangkar.x * s) * F;
      const y = (titik.y - h.m.jangkar.y * s) * F;
      return `<img src="${src(h)}" style="left:${x}px;top:${y}px;width:${h.m.kotak.w * s * F}px;height:${h.m.kotak.h * s * F}px;z-index:${z}" alt="">`;
    };
    const papan = (() => {
      const p = r.papanNama;
      if (!p || !namaPapan) return '';
      const u = Math.min(p.ukuranHuruf, p.h * 0.55);
      const pas = namaPapan.length * 0.52 * u > p.w * 0.88 ? ` textLength="${Math.round(p.w * 0.88)}" lengthAdjust="spacingAndGlyphs"` : '';
      return `<svg viewBox="0 0 ${p.w} ${p.h}" style="left:${p.x * F}px;top:${p.y * F}px;width:${p.w * F}px;height:${p.h * F}px;z-index:12"><text x="${p.w / 2}" y="${p.h / 2}" text-anchor="middle" dominant-baseline="central" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-weight="600" font-size="${u}" fill="${p.warna}"${pas}>${namaPapan}</text></svg>`;
    })();
    const dasar = img(lap('latar'), 10) + papan + img(lap('koridor'), 20) + img(lap('pintu-daun'), 30) + img(lap('belakang-meja'), 50) + img(lap('depan-meja'), 60) + img(lap('kursi-belakang'), 70) + img(lap('kursi-depan'), 90);
    const t = r.tempat;
    let denganTokoh = '';
    let ketTokoh = '';
    if (lok === 'meja') {
      const mr = cari('miss-raksa/duduk-dengar_tersenyum');
      const atas = cari('miss-raksa/duduk-dengar_tersenyum_atas-meja');
      const br = cari('bu-rina/duduk_cemas');
      denganTokoh = tokoh(mr, t.mentor, t.skalaMentor, 40) + tokoh(atas, t.mentor, t.skalaMentor, 57) + tokoh(br, t.nasabahDuduk, t.skalaNasabah, 80);
      ketTokoh = 'Miss Raksa duduk-dengar (+ diAtasMeja) di tempat.mentor, Bu Rina duduk di tempat.nasabahDuduk';
    } else if (lok === 'telepon') {
      const mr = cari('miss-raksa/telepon_netral');
      const atas = cari('miss-raksa/telepon_netral_atas-meja');
      denganTokoh = tokoh(mr, t.mentor, t.skalaMentor, 40) + tokoh(atas, t.mentor, t.skalaMentor, 57);
      ketTokoh = 'Miss Raksa pose telepon di tempat.mentor';
    } else if (lok === 'parkiran') {
      denganTokoh = tokoh(cari('bu-rina/berdiri_kesal'), t.nasabahBerdiri, t.skalaNasabah, 80);
      ketTokoh = 'Bu Rina berdiri (kunci) di tempat.nasabahBerdiri';
    }
    isi += `<h2>${NAMA_LOKASI[lok]}</h2><div class="grup" style="align-items:flex-start">`;
    isi += `<figure><div class="dunia" style="width:${1600 * F}px;height:${900 * F}px">${dasar}</div><figcaption>susunan lapisan (0,5×), teks papan dari konfigurasi</figcaption></figure>`;
    if (denganTokoh) isi += `<figure><div class="dunia" style="width:${1600 * F}px;height:${900 * F}px">${dasar}${denganTokoh}</div><figcaption>${ketTokoh} (uji jangkar; prop panggung tidak ditaruh)</figcaption></figure>`;
    isi += '</div><div class="baris" style="flex-wrap:wrap;margin-top:10px">';
    for (const h of hs.filter((x) => x.m.jenis === 'ruang' && x.m.lokasi === lok)) {
      const skl = h.m.lapisan === 'latar' ? 0.2 : 0.3;
      const p = h.m.posisiDunia!;
      const k = h.m.kotakLapisan ?? h.m.kotak;
      const luas = h.m.perluasan ? `<br>ekspor ${f1(h.m.kotak.w)}×${f1(h.m.kotak.h)} (meluber)` : '';
      isi += sel(h, keluar, skl, `${h.m.lapisan}<br>${f1(k.w)}×${f1(k.h)} @ (${f1(p.x)}, ${f1(p.y)})${luas}`);
    }
    isi += '</div>';
  }
  isi += '<h2>Prop (skala tampil 1,5)</h2><div class="baris" style="flex-wrap:wrap">';
  for (const h of hs.filter((x) => x.m.jenis === 'prop')) {
    const k = h.m.kotakLapisan ?? h.m.kotak;
    isi += sel(h, keluar, 1.5, `${h.m.nama}<br>${f1(k.w)}×${f1(k.h)}${h.m.perluasan ? ` (ekspor ${f1(h.m.kotak.w)}×${f1(h.m.kotak.h)})` : ''}`);
  }
  isi += '</div>';
  return { nama: 'galeri-ruang', lebar: 1700, html: dok(isi, 1700) };
}

function lembarUkuran(hs: Hasil[], keluar: string, args: Argumen, ekspresiMr: Ekspresi[]): Lembar {
  const cari = (id: string) => hs.find((h) => h.m.id === id);
  const svgSrc = (h: Hasil | undefined) => (h?.svg ? urlBerkas(path.join(keluar, h.svg.berkas)) : '');
  const TOKOH: [string, string][] = [
    ['miss-raksa/duduk-dengar_tersenyum', 'Miss Raksa duduk-dengar · tersenyum'],
    ['miss-raksa/berdiri-sambut_netral', 'Miss Raksa berdiri-sambut · netral'],
    ['bu-rina/duduk_cemas', 'Bu Rina duduk · cemas'],
    ['bu-rina/berdiri_kesal', 'Bu Rina berdiri · kesal'],
  ];
  let isi = kepalaLembar('Ukuran tampil', `tokoh pada ukuran kepala panggung & potret pada ukuran UI`, args, false, 'SVG master dirender Chrome langsung pada ukuran itu (1 px CSS = 1 px layar, kecuali baris 2×); potret dalam bingkai bulat seperti .tokoh-potret');
  for (const [kepalaPx, judul] of [[117, 'Desktop: kepala ± 117 px'], [62, 'HP: kepala ± 62 px']] as const) {
    const s = kepalaPx / KEPALA_TINGGI;
    isi += `<h2>${judul} (skala ${s.toFixed(3)} dari kanvas; tinggi kepala kontrak ${KEPALA_TINGGI} satuan)</h2><div class="grup">`;
    for (const [id, ket] of TOKOH) {
      const h = cari(id);
      if (!h) continue;
      isi += `<figure><div class="kv" style="width:${Math.round(h.m.kotak.w * s)}px;height:${Math.round(h.m.kotak.h * s)}px"><img src="${svgSrc(h)}" alt=""></div><figcaption>${ket}</figcaption></figure>`;
    }
    isi += '</div>';
  }
  const potret = (tokoh: 'miss-raksa' | 'bu-rina', uk: number, e: Ekspresi, telepon = false): Hasil | undefined => {
    if (telepon) return cari(`potret/${nm('bu-rina', uk <= POTRET_KECIL_MAKS_PX ? 'telepon-kecil' : 'telepon-v3', e)}`);
    if (tokoh === 'bu-rina') return cari(`potret/${nm('bu-rina', uk <= POTRET_KECIL_MAKS_PX ? 'kecil' : 'v3', e)}`);
    const a = aturanPotret(uk);
    const j = a.jendela.sisi === JENDELA_POTRET_V3.sisi ? (a.kecil ? 'v3-kecil' : 'v3') : 'kecil';
    return cari(`potret/${nm('miss-raksa', j, e)}`);
  };
  for (const kali of [1, 2]) {
    isi += `<h2>Potret 64 / 52 / 44 / 32 px${kali === 2 ? ' — dirender 2× (layar HP retina)' : ' — 1×'}</h2>`;
    for (const uk of [64, 52, 44, 32]) {
      const px = uk * kali;
      isi += `<div class="baris"><div class="jb">${uk} px<small>${kali}× · ${uk <= POTRET_KECIL_MAKS_PX ? 'jendela kecil' : 'jendela v3'}</small></div><div class="grup" style="gap:${8 * kali}px">`;
      for (const e of ekspresiMr) {
        const h = potret('miss-raksa', uk, e);
        if (h) isi += `<figure><div class="bulat" style="width:${px}px;height:${px}px"><img src="${svgSrc(h)}" alt=""></div><figcaption>MR ${e}</figcaption></figure>`;
      }
      isi += `<span style="width:${14 * kali}px"></span>`;
      for (const e of DAFTAR_EKSPRESI) {
        const h = potret('bu-rina', uk, e);
        if (h) isi += `<figure><div class="bulat" style="width:${px}px;height:${px}px"><img src="${svgSrc(h)}" alt=""></div><figcaption>BR ${e}</figcaption></figure>`;
      }
      isi += '</div></div>';
    }
  }
  isi += '<h2>Sisipan telepon Bu Rina (desktop 64 px jendela v3, HP 52/44 px jendela kecil), 1×</h2><div class="grup">';
  for (const uk of [64, 52, 44]) {
    for (const e of ['kesal', 'netral', 'lega'] as Ekspresi[]) {
      const h = potret('bu-rina', uk, e, true);
      if (h) isi += `<figure><div class="bulat" style="width:${uk}px;height:${uk}px"><img src="${svgSrc(h)}" alt=""></div><figcaption>${uk} · ${e}</figcaption></figure>`;
    }
  }
  isi += '</div>';
  return { nama: 'ukuran', lebar: 1960, html: dok(isi, 1960) };
}

async function tulisLembar(b: Peramban, daftar: Lembar[], dirLembar: string): Promise<{ berkas: string; bytes: number; w: number; h: number; gambarRusak: number; luber: boolean }[]> {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'raksa-ekspor-'));
  const hasil: { berkas: string; bytes: number; w: number; h: number; gambarRusak: number; luber: boolean }[] = [];
  try {
    fs.mkdirSync(dirLembar, { recursive: true });
    const p = await b.newPage();
    for (const l of daftar) {
      const html = path.join(tmp, `${l.nama}.html`);
      fs.writeFileSync(html, l.html);
      await p.setViewport({ width: l.lebar, height: 900, deviceScaleFactor: 1 });
      await p.goto(urlBerkas(html), { waitUntil: 'load' });
      const rusak = await p.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).length);
      const tinggi = await p.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
      // isi lebih lebar dari lembar = sebagian sel terpotong di tangkapan
      const luber = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      const buf = await p.screenshot({ type: 'png', fullPage: true });
      const keluar = path.join(dirLembar, `${l.nama}.png`);
      fs.writeFileSync(keluar, buf);
      hasil.push({ berkas: keluar, bytes: buf.byteLength, w: l.lebar, h: tinggi, gambarRusak: rusak, luber });
    }
    await p.close();
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return hasil;
}

// ------------------------------------------------------------------ utama

async function utama(): Promise<number> {
  const t0 = Date.now();
  const args = bacaArgumen(process.argv.slice(2));
  const keluar = path.resolve(process.cwd(), args.keluar);
  const ekspresiMr = args.ekspresiMr === 'semua' ? [...DAFTAR_EKSPRESI] : ekspresiMissRaksa();

  // 1. Master dari generator (galat = kegagalan ekspor).
  const masters: Master[] = [];
  const gagalBuat: string[] = [];
  for (const [nama, buat] of [
    ['Miss Raksa', () => mastersMissRaksa(ekspresiMr)],
    ['Bu Rina', () => mastersBuRina()],
    ['potret', () => mastersPotret(ekspresiMr)],
    ['ruang', () => mastersRuang()],
    ['prop', () => mastersProp()],
  ] as const) {
    try {
      masters.push(...buat());
    } catch (e) {
      gagalBuat.push(`${nama}: ${(e as Error).stack ?? e}`);
    }
  }
  const idGanda = masters.map((m) => m.id).filter((id, i, a) => a.indexOf(id) !== i);
  if (idGanda.length) gagalBuat.push(`id master ganda: ${idGanda.join(', ')}`);
  const tMaster = Date.now();

  const hasil: Hasil[] = masters.map((m) => ({ m, raster: [], analisis: {}, webpSudut: {}, gagal: [], masalah: [], catatan: [] }));
  let tRaster = 0;
  let lembar: Awaited<ReturnType<typeof tulisLembar>> = [];
  const gagalLembar: string[] = [];
  // Peramban dulu: Chrome yang tidak ada tidak sempat mengosongkan ekspor lama.
  const b = await bukaPeramban();
  try {
    siapkanKeluar(keluar);
    // 2. Gambar di luar kotak (render ber-pad): tokoh = masalah; lapisan ruang/prop = kotak ekspor diperluas.
    const cek = await halamanRaster(b, 1);
    for (const h of hasil) {
      if (!h.m.periksaLuar) continue;
      try {
        jejak('luar', h.m.id);
        h.luarAwal = await cekLuar(cek, h.m);
        h.luar = h.luarAwal;
        if (h.m.bolehLuas && SEMUA_SISI.some((s) => h.luarAwal!.dalam[s] > 0)) {
          perluasKotak(h.m, h.luarAwal.dalam);
          if (h.m.perluasan) h.luar = await cekLuar(cek, h.m);
        }
      } catch (e) {
        h.gagal.push(`cek luar kanvas: ${(e as Error).message}`);
      }
    }
    await cek.close();

    // 3. Master SVG mandiri.
    for (const h of hasil) {
      try {
        const teks = dokumenSvg(h.m.isi, h.m.kotak) + '\n';
        const berkas = `svg/${h.m.grup}/${h.m.nama}.svg`;
        fs.mkdirSync(path.join(keluar, 'svg', h.m.grup), { recursive: true });
        fs.writeFileSync(path.join(keluar, berkas), teks);
        h.svg = { berkas, bytes: Buffer.byteLength(teks), sha256: sha256(teks) };
      } catch (e) {
        h.gagal.push(`svg: ${(e as Error).message}`);
      }
    }

    // 4. Raster PNG + WebP per skala, lalu analisis alfa berkas yang ditulis. Paralel = beberapa PERAMBAN (satu tab
    //    aktif masing-masing): tab latar di peramban yang sama bisa tertahan lama sampai batas waktu protokol.
    const t = Date.now();
    const antre = args.skala.flatMap((skala) => hasil.filter((h) => h.svg).map((h) => ({ h, skala })));
    let i = 0;
    const pekerja = async (k: number): Promise<void> => {
      const pb = k === 0 ? b : await bukaPeramban();
      let p: Halaman | null = null;
      let skalaP = 0;
      try {
        for (;;) {
          const tugas = antre[i++];
          if (!tugas) break;
          if (!p || skalaP !== tugas.skala) {
            if (p) await p.close();
            p = await halamanRaster(pb, tugas.skala);
            skalaP = tugas.skala;
          }
          await rasterSatu(p, tugas.h, tugas.skala, keluar, args);
        }
      } finally {
        if (p) await p.close();
        if (pb !== b) await pb.close();
      }
    };
    await Promise.all(Array.from({ length: args.paralel }, (_, k) => pekerja(k)));
    tRaster = Date.now() - t;

    for (const h of hasil) nilaiMasalah(h);

    // 5. Lembar galeri.
    if (args.lembar) {
      try {
        lembar = await tulisLembar(b, [
          lembarMissRaksa(hasil, keluar, args, ekspresiMr),
          lembarBuRina(hasil, keluar, args),
          lembarRuang(hasil, keluar, args),
          lembarUkuran(hasil, keluar, args, ekspresiMr),
        ], path.join(keluar, 'lembar'));
        for (const l of lembar) {
          if (l.gambarRusak) gagalLembar.push(`${path.basename(l.berkas)}: ${l.gambarRusak} gambar gagal dimuat`);
          if (l.luber) gagalLembar.push(`${path.basename(l.berkas)}: isi lebih lebar dari lembar (sel terpotong)`);
        }
      } catch (e) {
        gagalLembar.push(`lembar: ${(e as Error).stack ?? e}`);
      }
    }
  } finally {
    await b.close();
  }

  // 6. Manifest.
  const sumberBerkas = [...new Set(['client/src/cerita/seni/tokoh', 'client/src/cerita/seni/ruang'].flatMap((d) =>
    fs.readdirSync(path.join(ROOT, d)).filter((n) => /\.ts$/.test(n) && !/\.test\.ts$/.test(n)).map((n) => `${d}/${n}`)))].sort();
  const totalBytes = hasil.reduce((s, h) => s + (h.svg?.bytes ?? 0) + h.raster.reduce((t, r) => t + r.png.bytes + r.webp.bytes, 0), 0);
  const jumlahBerkas = hasil.reduce((s, h) => s + (h.svg ? 1 : 0) + h.raster.length * 2, 0);
  const perJenis: Record<string, number> = {};
  for (const h of hasil) perJenis[h.m.jenis] = (perJenis[h.m.jenis] ?? 0) + 1;
  const manifest = {
    versi: 1,
    alat: ALAT,
    dibuat: args.waktu,
    perintah: `npx tsx --tsconfig client/tsconfig.json ${ALAT} ${process.argv.slice(2).join(' ')}`.trim(),
    episode: EPISODE_AUTO_1.id,
    skala: args.skala,
    webpKualitas: args.webpKualitas,
    ekspresiMissRaksa: ekspresiMr,
    satuan: 'satuan dunia panggung 1600 x 900 pada skala 1; titik (jangkar/kepala/tangan/engsel) dalam koordinat viewBox berkas SVG; lapisan ruang: sudut kiri atas gambar di dunia = posisiGambar',
    sumber: sumberBerkas.map((berkas) => ({ berkas, sha256: sha256(fs.readFileSync(path.join(ROOT, berkas))) })),
    ringkas: { aset: hasil.length, perJenis, berkas: jumlahBerkas, bytes: totalBytes, gagal: hasil.filter((h) => h.gagal.length).length, masalah: hasil.filter((h) => h.masalah.length).length },
    lembar: lembar.map((l) => ({ berkas: rel(keluar, l.berkas), bytes: l.bytes, px: { w: l.w, h: l.h } })),
    aset: hasil.map((h) => ({
      id: h.m.id,
      jenis: h.m.jenis,
      tokoh: h.m.tokoh,
      lapisan: h.m.lapisan,
      lokasi: h.m.lokasi,
      pose: h.m.pose,
      ekspresi: h.m.ekspresi,
      varian: h.m.varian,
      ukuran: { w: h.m.kotak.w, h: h.m.kotak.h, px: Object.fromEntries(h.raster.map((r) => [`x${r.skala}`, r.px])) },
      viewBox: `${f1(h.m.kotak.x)} ${f1(h.m.kotak.y)} ${f1(h.m.kotak.w)} ${f1(h.m.kotak.h)}`,
      ...(h.m.posisiDunia
        ? { posisiDunia: h.m.posisiDunia, posisiGambar: { x: f1(h.m.posisiDunia.x + h.m.kotak.x), y: f1(h.m.posisiDunia.y + h.m.kotak.y) } }
        : {}),
      ...(h.m.kotakLapisan ? { kotakLapisan: h.m.kotakLapisan, perluasan: h.m.perluasan } : {}),
      jangkar: h.m.jangkar ?? null,
      kepala: h.m.kepala ?? null,
      tangan: h.m.tangan ?? null,
      ...(h.m.engsel ? { engsel: h.m.engsel } : {}),
      ...(h.m.jendela ? { jendela: h.m.jendela } : {}),
      ...(h.m.dipakai ? { dipakai: h.m.dipakai } : {}),
      sumber: h.m.sumber,
      svg: h.svg ?? null,
      raster: h.raster,
      periksa: {
        tepi: Object.fromEntries(Object.entries(h.analisis).map(([s, a]) => [`x${s}`, { sentuh: a.tepi, jarak: a.jarak, sudutAlfa: a.sudut, terisi: Number(a.terisi.toFixed(4)) }])),
        luarKotak: h.luar ?? null,
        ...(h.m.perluasan ? { luarKotakAwal: h.luarAwal ?? null } : {}),
        masalah: h.masalah,
        catatan: h.catatan,
        gagal: h.gagal,
      },
    })),
  };
  fs.writeFileSync(path.join(keluar, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');

  // 7. Ringkasan.
  const detik = (ms: number) => `${(ms / 1000).toFixed(1)} dtk`;
  const kb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;
  console.log(`\nEkspor aset cerita → ${keluar}`);
  console.log(`  master: ${hasil.length} (${Object.entries(perJenis).map(([k, v]) => `${k} ${v}`).join(', ')}); ekspresi Miss Raksa: ${ekspresiMr.join(', ')}`);
  console.log(`  berkas: ${jumlahBerkas} (svg + png/webp x${args.skala.join(',x')}), ${kb(totalBytes)}; lembar: ${lembar.length}`);
  console.log(`  waktu: generator ${detik(tMaster - t0)}, raster ${detik(tRaster)}, total ${detik(Date.now() - t0)}`);
  const bermasalah = hasil.filter((h) => h.masalah.length);
  if (bermasalah.length) {
    console.log(`  MASALAH tepi/id (${bermasalah.length}):`);
    for (const h of bermasalah) console.log(`    - ${h.m.id}: ${h.masalah.join(' | ')}`);
  } else console.log('  masalah tepi/id: tidak ada');
  const bercatatan = hasil.filter((h) => h.catatan.length);
  if (bercatatan.length) {
    console.log(`  catatan (${bercatatan.length}):`);
    for (const h of bercatatan) console.log(`    - ${h.m.id}: ${h.catatan.join(' | ')}`);
  }
  const gagal = [...gagalBuat, ...gagalLembar, ...hasil.filter((h) => h.gagal.length).map((h) => `${h.m.id}: ${h.gagal.join(' | ')}`)];
  if (gagal.length) {
    console.error(`  GAGAL (${gagal.length}):`);
    for (const g of gagal) console.error(`    - ${g}`);
    return 1;
  }
  return args.ketat && bermasalah.length ? 2 : 0;
}

async function rasterSatu(p: Halaman, h: Hasil, skala: number, keluar: string, args: Argumen): Promise<void> {
  const m = h.m;
  try {
    jejak('raster', skala, m.id);
    await p.evaluate((doc) => {
      document.getElementById('k')!.innerHTML = doc;
    }, dokumenSvg(m.isi, m.kotak));
    const clip = { x: 0, y: 0, width: Math.ceil(m.kotak.w), height: Math.ceil(m.kotak.h) };
    jejak('  png', m.id);
    const png = await p.screenshot({ type: 'png', omitBackground: true, clip, captureBeyondViewport: false });
    jejak('  webp', m.id);
    const webp = await p.screenshot({ type: 'webp', quality: args.webpKualitas, omitBackground: true, clip, captureBeyondViewport: false });
    const berkasPng = `png/x${skala}/${m.grup}/${m.nama}.png`;
    const berkasWebp = `webp/x${skala}/${m.grup}/${m.nama}.webp`;
    for (const bk of [berkasPng, berkasWebp]) fs.mkdirSync(path.dirname(path.join(keluar, bk)), { recursive: true });
    fs.writeFileSync(path.join(keluar, berkasPng), png);
    fs.writeFileSync(path.join(keluar, berkasWebp), webp);
    // Analisis dari berkas yang DITULIS (baca ulang), bukan dari DOM.
    jejak('  analisis', m.id);
    type Fn = { __analisis: (b: string, t: string) => Promise<HasilAnalisis> };
    const a = await p.evaluate((b64) => (window as unknown as Fn).__analisis(b64, 'image/png'), fs.readFileSync(path.join(keluar, berkasPng)).toString('base64'));
    const aw = await p.evaluate((b64) => (window as unknown as Fn).__analisis(b64, 'image/webp'), fs.readFileSync(path.join(keluar, berkasWebp)).toString('base64'));
    h.analisis[skala] = a;
    h.webpSudut[skala] = aw.sudut;
    if (aw.w !== a.w || aw.h !== a.h) h.gagal.push(`x${skala}: ukuran WebP ${aw.w}x${aw.h} ≠ PNG ${a.w}x${a.h}`);
    h.raster.push({ skala, px: { w: a.w, h: a.h }, png: { berkas: berkasPng, bytes: png.byteLength }, webp: { berkas: berkasWebp, bytes: webp.byteLength } });
    h.raster.sort((x, y) => x.skala - y.skala);
  } catch (e) {
    h.gagal.push(`raster x${skala}: ${(e as Error).message}`);
  }
}

utama().then(
  (kode) => process.exit(kode),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
