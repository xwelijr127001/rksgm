/**
 * Bank soal LENGKAP = paket bawaan (./bankSoal.ts) + soal kustom panitia di SQLite (./db.ts).
 * SERVER ONLY. Dipisah dari bankSoal.ts karena berkas ini menyentuh DB & CONFIG; hanya
 * index.ts yang memakainya (RoomManager menerima `cariSoal` lewat konstruktor).
 */

import type { BankSoal, RingkasSoal } from '../../shared/bankSoal';
import { cariSoalBawaan, idPaket, ringkas, semuaSoalBawaan, type PencariSoal } from './bankSoal';
import { CONFIG } from './config';
import { ambilSoalKustom, daftarSoalKustom } from './db';
import { POLA_ID_KUSTOM, kustomKeMisi } from './soalKustom';

/** Cari soal di SEMUA asal. Hanya id berpola k-xxxxxxxx yang menyentuh DB. */
export const cariSoal: PencariSoal = (id) => {
  const bawaan = cariSoalBawaan(id);
  if (bawaan) return bawaan;
  if (typeof id !== 'string' || !POLA_ID_KUSTOM.test(id)) return undefined;
  const soal = ambilSoalKustom(id);
  return soal ? { ...kustomKeMisi(soal), asal: 'kustom' } : undefined;
};

/** Jawaban GET /api/bank: ringkasan saja, tanpa isi pertanyaan & tanpa kunci. */
export function daftarBank(): BankSoal {
  const soal: RingkasSoal[] = semuaSoalBawaan().map(ringkas);
  for (const k of daftarSoalKustom()) soal.push(ringkas({ ...kustomKeMisi(k), asal: 'kustom' }));
  return {
    paket: { latihan: idPaket('latihan'), acara: idPaket('acara') },
    soal,
    bawaan: CONFIG.paketBawaan,
  };
}
