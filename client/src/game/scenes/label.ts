/**
 * Terjemahan teks yang DIGAMBAR di adegan: label singkat objek, stiker kategori, dan papan
 * angka. Kunci luar = id misi. Teks Indonesia tetap di berkas adegan masing-masing.
 * Batas panjang (supaya label tidak bertumpuk): Inggris ±18 huruf, Mandarin ±8 aksara.
 * Tulisan pada gambar latar (papan nama toko, spanduk) adalah bagian ilustrasi dan tidak diterjemahkan.
 */
import type { BahasaLain } from '@shared/bahasa';
import { LABEL_EN } from './label.en';
import { LABEL_ZH } from './label.zh';
import { LABEL_ACARA } from './acara';

export interface LabelAdegan {
  /** Per id objek adegan (SceneObjectSpec.id). */
  objek: Record<string, string>;
  /** Stiker kategori: kunci `${stepId}:${bucketId}` (sama dengan SceneSpec.bucketShort). */
  kategori?: Record<string, string>;
  /** Papan angka per BoardSpec.id: judul + label baris (urut sama dengan lines). */
  papan?: Record<string, { title: string; lines: string[] }>;
}

export type KamusLabel = Record<string, LabelAdegan>;

export const LABEL: Record<BahasaLain, KamusLabel> = {
  en: { ...LABEL_EN, ...LABEL_ACARA.en },
  zh: { ...LABEL_ZH, ...LABEL_ACARA.zh },
};
