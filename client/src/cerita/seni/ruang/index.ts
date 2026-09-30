/**
 * Pintu masuk lapisan ruang v3 (tipe.ts): generator final ruang Raksa Silver Club (`meja`, `telepon`), koridor
 * pembuka (`pintu-luar`), dan parkiran kantor (`parkiran`). Hasil di-cache per lokasi (string stabil). Galat
 * generator jatuh ke pengganti sementara supaya panggung tetap tampil. Rincian: docs/cerita/aset/RUANG.md.
 */
import type { IdLokasiAdegan } from '../../tipe';
import { denganGaya, lapisan } from './alat';
import { latarRuangLayanan } from './dinding';
import { GARIS_MEJA_MENTOR, JALUR_MASUK, PINTU, PROP_MEJA, TEKS_PAPAN, TEMPAT_MEJA } from './geometri';
import { KOTAK_KURSI, kursiPengunjungSvg } from './kursi';
import { luarPintu } from './luar';
import { KOTAK_BELAKANG_MEJA, KOTAK_DEPAN_MEJA, belakangMejaSvg, depanMejaSvg } from './meja';
import { parkiranKantor } from './parkiran';
import { daunSekat, koridorSekat } from './pintu';
import { ruangSementara } from './sementara';
import type { RuangAdegan } from './tipe';

export type { LapisanSvg, RuangAdegan, TempatAdegan } from './tipe';
export { propCangkir, propGagang, propKartuPolis, propKartuTangan, propKunci, propMap, propTelepon, SKALA_PROP, type PropRuang } from './prop';
export {
  BINGKAI_PIKSEL, GARIS_MEJA_MENTOR, JALUR_DEPAN_MULAI, MEJA, MEJA_KANVAS_DUDUK, PIKSEL, PINGGUL_DI_BAWAH_MEJA, UKURAN_TOKOH_PIKSEL,
  yTepiJauh, yTepiDekat,
} from './geometri';
/** Ruang layanan (meja) & varian epilog telepon (kursi pengunjung kosong + cangkir; telepon = prop panggung). */
function ruangLayanan(lok: 'meja' | 'telepon'): RuangAdegan {
  const b = PINTU;
  return {
    lokasi: lok,
    latar: lapisan(latarRuangLayanan(lok), 0, 0, 1600, 900),
    koridor: lapisan(koridorSekat(`rg-${lok}-koridor`, b), b.x, b.y, b.w, b.h),
    pintu: {
      daun: lapisan(daunSekat(`rg-${lok}-daun`, b), b.x, b.y, b.w, b.h),
      engsel: { x: b.x, y: b.y + b.h / 2 },
      bukaan: { x: b.x, y: b.y, w: b.w, h: b.h },
    },
    belakangMeja: lapisan(belakangMejaSvg(lok), KOTAK_BELAKANG_MEJA.x, KOTAK_BELAKANG_MEJA.y, KOTAK_BELAKANG_MEJA.w, KOTAK_BELAKANG_MEJA.h),
    depanMeja: lapisan(depanMejaSvg(lok), KOTAK_DEPAN_MEJA.x, KOTAK_DEPAN_MEJA.y, KOTAK_DEPAN_MEJA.w, KOTAK_DEPAN_MEJA.h),
    kursi: { belakang: lapisan(kursiPengunjungSvg(lok), KOTAK_KURSI.x, KOTAK_KURSI.y, KOTAK_KURSI.w, KOTAK_KURSI.h) },
    tempat: {
      mentor: { ...TEMPAT_MEJA.mentor },
      mentorBerdiri: { ...TEMPAT_MEJA.mentorBerdiri },
      skalaMentor: TEMPAT_MEJA.skalaMentor,
      nasabahDuduk: { ...TEMPAT_MEJA.nasabahDuduk },
      skalaNasabah: TEMPAT_MEJA.skalaNasabah,
      nasabahBerdiri: { ...TEMPAT_MEJA.nasabahBerdiri },
      jalurMasuk: JALUR_MASUK.map((j) => ({ titik: { ...j.titik }, skala: j.skala })),
      kartuSimpan: { ...PROP_MEJA.kartuSimpan },
      kartuMeja: { ...PROP_MEJA.kartuMeja },
      kunciMeja: { ...PROP_MEJA.kunciMeja },
      telepon: { ...PROP_MEJA.telepon },
      garisMejaMentor: GARIS_MEJA_MENTOR,
    },
    papanNama: { ...TEKS_PAPAN },
  };
}

function buat(lokasi: IdLokasiAdegan): RuangAdegan {
  switch (lokasi) {
    case 'meja':
    case 'telepon':
      return ruangLayanan(lokasi);
    case 'pintu-luar':
      return luarPintu();
    case 'parkiran':
      return parkiranKantor();
    default:
      return ruangSementara(lokasi);
  }
}

/**
 * Ruang lokasi dalam GAYA PIKSEL (sumber lapisan piksel untuk tools/piksel/bangun-ruang.mjs; tidak di-cache, tidak
 * dipakai panggung). Geometri & kotak sama persis dengan `ruangAdegan`.
 */
export function ruangGayaPiksel(lokasi: IdLokasiAdegan): RuangAdegan {
  return denganGaya('piksel', () => buat(lokasi));
}

const cache = new Map<IdLokasiAdegan, RuangAdegan>();

export function ruangAdegan(lokasi: IdLokasiAdegan): RuangAdegan {
  const ada = cache.get(lokasi);
  if (ada) return ada;
  let r: RuangAdegan;
  try {
    r = buat(lokasi);
  } catch {
    return ruangSementara(lokasi);
  }
  cache.set(lokasi, r);
  return r;
}
