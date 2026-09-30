/**
 * Sumber seni panggung dengan pengaman: generator tokoh (seni/tokoh; galat -> pengganti sementara di sana) dan
 * lapisan ruang (seni/ruang; galat -> pengganti sementara di sini). Panggung tidak pernah berhenti karena aset.
 *
 * TOKOH PIKSEL (v4): panggung meminta gambar RASTER (`piksel: true`: penyusun piksel seni/piksel, atlas + manifest
 * Miss Raksa & Bu Rina). Atlas mulai dimuat & didekode saat modul ini dimuat (bersama PNG ruang di sumberPiksel.ts);
 * status dekodenya dipasang ke seni/tokoh (`pasangStatusAtlas`), jadi atlas SALAH SATU tokoh yang GAGAL = KEDUA tokoh
 * siluet netral + nama sebagai teks (tampilan gagal seragam, bukan seni SVG v3) dan cerita tetap jalan. Uji (hanya Vite
 * dev): localStorage `raksa:uji:tokoh-piksel` = 'mati' = paksa tokoh SVG.
 */
import {
  atlasGagal, gambarBuRina, gambarMissRaksa, JENDELA_POTRET_KECIL, JENDELA_POTRET_V3, KANVAS_BERDIRI, pasangStatusAtlas, POTRET_KECIL_MAKS_PX, tokohPiksel,
  type GambarTokohRaster, type JendelaPotret,
} from '../../seni/tokoh';
import { URL_ATLAS_PIKSEL } from '../../seni/piksel';
import { JENDELA_POTRET_SEDANG, POTRET_SEDANG_MAKS_PX } from '../../seni/tokoh/missRaksa';
import { buRinaSementara, missRaksaSementara } from '../../seni/tokoh/sementara';
import { ruangSementara } from '../../seni/ruang/sementara';
import { ruangAdegan, type RuangAdegan } from '../../seni/ruang';
import type { IdLokasiAdegan, PoseMentor } from '../../tipe';
import type { LetakTokoh, OpsiTokoh, PenggambarTokoh } from './dunia';
import { pikselDari, sidikGambar } from './piksel';
import { gambarSiap, muatGambar, ruangPikselUntuk } from './sumberPiksel';

type OpsiGambar = OpsiTokoh & { id?: string; bicara?: boolean; kedip?: boolean };

/** Uji (Vite dev saja): localStorage `raksa:uji:tokoh-piksel` = 'mati' = tokoh SVG. Build produksi = selalu piksel. */
function ujiTokohMati(): boolean {
  if (!import.meta.env?.DEV || typeof window === 'undefined') return false;
  try { return window.localStorage.getItem('raksa:uji:tokoh-piksel') === 'mati'; } catch { return false; }
}
/** Panggung meminta tokoh raster (penyusun piksel). */
export const TOKOH_PIKSEL = !ujiTokohMati();

// Status dekode atlas untuk seni/tokoh (atlas GAGAL = SVG), lalu atlas mulai dimuat & didekode sekarang (peramban
// saja), supaya biasanya sudah siap sebelum panggung dicat pertama kali. Gagal = pendengar sumberPiksel diberi tahu
// (Panggung menyusun ulang dunianya: tokoh SVG).
pasangStatusAtlas(gambarSiap);
if (TOKOH_PIKSEL && typeof window !== 'undefined' && typeof Image !== 'undefined') {
  for (const url of Object.values(URL_ATLAS_PIKSEL)) if (url && !url.startsWith('file:')) void muatGambar(url);
}

/** Penggambar tokoh untuk panggung: gambar RASTER dari penyusun piksel bila tersedia, selain itu generator SVG. */
export const gambarTokoh: PenggambarTokoh = (o) => {
  const { siapa, ...opsi } = o as OpsiGambar;
  const seni = { ...opsi, piksel: TOKOH_PIKSEL };
  if (siapa === 'mentor') return gambarMissRaksa(seni as Parameters<typeof gambarMissRaksa>[0]);
  return gambarBuRina(seni as Parameters<typeof gambarBuRina>[0]);
};

/** Mode gambar Bu Rina kini (raster / siluet karena atlas gagal / SVG): hasil deteksi dukungan di bawah disimpan per mode. */
const modeRina = (): string => (!TOKOH_PIKSEL ? 'svg' : tokohPiksel('buRina') ? 'piksel' : atlasGagal() ? 'siluet' : 'svg');

const hadapKananDidukung = new Map<string, boolean>();
/**
 * Gambar Bu Rina menggambar pose jalan menghadap kanan (`hadap: 'kanan'`) sendiri? Dicek sekali per mode gambar:
 * gambar kanan harus berbeda dari gambar bawaan (kiri). Tidak didukung / galat = kepergian memakai cermin CSS
 * sebagai cadangan. Raster: frame `jalan-a-kanan` atlas.
 */
export function bisaHadapKanan(): boolean {
  const mode = modeRina();
  const ada = hadapKananDidukung.get(mode);
  if (ada !== undefined) return ada;
  let hasil = false;
  try {
    // Tanpa id (entri cache sama dengan pose jalan sungguhan, bukan entri uji tersendiri).
    const kiri = gambarTokoh({ siapa: 'nasabah', pose: 'jalan-a', ekspresi: 'netral', kunci: true });
    const kanan = gambarTokoh({ siapa: 'nasabah', pose: 'jalan-a', ekspresi: 'netral', kunci: true, hadap: 'kanan' });
    const sk = sidikGambar(kanan);
    hasil = !!sk && sk !== sidikGambar(kiri) && sk !== sidikGambar(buRinaSementara({ pose: 'jalan-a', ekspresi: 'netral', hadap: 'kanan' }));
  } catch {
    hasil = false;
  }
  hadapKananDidukung.set(mode, hasil);
  return hasil;
}

const dudukTurunDidukung = new Map<string, boolean>();
/**
 * Gambar Bu Rina punya bingkai antara `duduk-turun` (berdiri -> duduk: lutut menekuk, pinggul setengah turun, jangkar
 * telapak kaki)? Dicek sekali per mode gambar: gambarnya harus berbeda dari pose berdiri dan dari pengganti
 * sementara; SVG: kanvas & jangkar pose berdiri; raster: frame `duduk-turun` atlas (bukan cadangan pose lain).
 * Tidak didukung / galat = duduk & berdiri ditukar seketika (tanpa bingkai antara).
 */
export function bisaDudukTurun(): boolean {
  const mode = modeRina();
  const ada = dudukTurunDidukung.get(mode);
  if (ada !== undefined) return ada;
  let hasil = false;
  try {
    // Tanpa id; opsi sama dengan pose antara sungguhan supaya entri cache dipakai lagi.
    const turun = gambarTokoh({ siapa: 'nasabah', pose: 'duduk-turun', ekspresi: 'netral' });
    const berdiri = gambarTokoh({ siapa: 'nasabah', pose: 'berdiri', ekspresi: 'netral' });
    const st = sidikGambar(turun);
    const beda = !!st && st !== sidikGambar(berdiri) && st !== sidikGambar(buRinaSementara({ pose: 'duduk-turun', ekspresi: 'netral' }));
    const frame = (turun as GambarTokohRaster).frame;
    hasil = beda && (mode === 'piksel'
      ? typeof frame === 'string' && frame.startsWith('duduk-turun')
      : turun.w === KANVAS_BERDIRI.w && turun.h === KANVAS_BERDIRI.h
        && Math.abs(turun.jangkar.x - KANVAS_BERDIRI.jangkar.x) < 1 && Math.abs(turun.jangkar.y - KANVAS_BERDIRI.jangkar.y) < 1);
  } catch {
    hasil = false;
  }
  dudukTurunDidukung.set(mode, hasil);
  return hasil;
}

let dudukTurunMentorDidukung: boolean | null = null;
/**
 * Atlas Miss Raksa punya bingkai antara `duduk-turun` (berdiri mempersilakan -> duduk, kedatangan)? Hanya gambar RASTER:
 * frame atlas yang id-nya diawali `duduk-turun` (manifest pose `duduk-turun`, atau frame `duduk-turun-<arah>` tanpa
 * entri pose: penyusun menurunkannya), bukan cadangan pose lain. SVG v3 / siluet / galat = false: Miss Raksa duduk
 * dengan tukar seketika seperti sebelumnya. Hasil raster disimpan sekali (manifest tetap selama modul dimuat).
 */
export function bisaDudukTurunMentor(): boolean {
  if (!TOKOH_PIKSEL || !tokohPiksel('missRaksa')) return false;
  if (dudukTurunMentorDidukung !== null) return dudukTurunMentorDidukung;
  let hasil = false;
  try {
    // Opsi sama dengan bingkai antara sungguhan (rencana.ts bingkaiTurunMentor: pandang lawan = hadap kanan).
    const g = gambarTokoh({ siapa: 'mentor', pose: 'duduk-turun' as PoseMentor, ekspresi: 'netral', pandang: 'lawan' }) as GambarTokohRaster;
    hasil = !!pikselDari(g) && typeof g.frame === 'string' && g.frame.startsWith('duduk-turun');
  } catch {
    hasil = false;
  }
  dudukTurunMentorDidukung = hasil;
  return hasil;
}

/**
 * Aturan potret Bu Rina di sisipan panggilan menurut ukuran tampil (px CSS), SAMA dengan `aturanPotret` Miss Raksa
 * (seni/tokoh/missRaksa.ts): <= POTRET_KECIL_MAKS_PX (52) -> JENDELA_POTRET_KECIL + versi `kecil`; 53-75 px ->
 * JENDELA_POTRET_SEDANG + `kecil` (kepala ± 65 % lingkaran); >= 76 px -> JENDELA_POTRET_V3 versi normal.
 */
export function aturanPotretSisipan(ukuran: number): { jendela: JendelaPotret; kecil: boolean } {
  if (ukuran <= POTRET_KECIL_MAKS_PX) return { jendela: JENDELA_POTRET_KECIL, kecil: true };
  if (ukuran <= POTRET_SEDANG_MAKS_PX) return { jendela: JENDELA_POTRET_SEDANG, kecil: true };
  return { jendela: JENDELA_POTRET_V3, kecil: false };
}

/** true bila gambar ini pengganti sementara (seni final belum ada / gagal): nama tokoh ditulis sebagai teks. */
export function gambarSementara(l: LetakTokoh): boolean {
  try {
    const { siapa, ...opsi } = l.opsi;
    const s = siapa === 'mentor'
      ? missRaksaSementara(opsi as Parameters<typeof missRaksaSementara>[0])
      : buRinaSementara(opsi as Parameters<typeof buRinaSementara>[0]);
    return sidikGambar(s) === sidikGambar(l.gambar);
  } catch {
    return false;
  }
}

/**
 * Lapisan ruang untuk lokasi: ruang PIKSEL (seni/piksel/ruang.json lewat sumberPiksel.ts) bila ada dan PNG-nya tidak
 * gagal, selain itu ruang SVG. Generator SVG gagal -> pengganti sementara (panggung tetap tampil).
 */
export function ambilRuang(lokasi: IdLokasiAdegan): RuangAdegan {
  return ruangPikselUntuk(lokasi) ?? ambilRuangSvg(lokasi);
}

/** Lapisan ruang SVG (cadangan ruang piksel); generator gagal -> pengganti sementara. */
export function ambilRuangSvg(lokasi: IdLokasiAdegan): RuangAdegan {
  try {
    const r = ruangAdegan(lokasi);
    if (r && r.latar && r.tempat) return r;
  } catch {
    /* jatuh ke pengganti sementara */
  }
  return ruangSementara(lokasi);
}
