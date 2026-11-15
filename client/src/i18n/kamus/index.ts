/**
 * Daftar kamus per ruang. Tiap berkas: `export default { id: {...}, en: {...}, zh: {...} }`
 * dengan himpunan kunci yang sama (dijaga ../terjemahan.test.ts), kecuali zh pada KAMUS_MVP.
 */
import type { Bahasa } from '@shared/bahasa';
import umum from './umum';
import tokoh from './tokoh';
import adegan from './adegan';
import pemain from './pemain';
import misi from './misi';
import layar from './layar';
import host from './host';
import server from './server';
import alur from './alur';
import solo from './solo';
import bank from './bank';
import cerita from './cerita';
import ceritaAkhir from './ceritaAkhir';
import ceritaAkt from './ceritaAkt';
import ceritaHp from './ceritaHp';
import ruang from './ruang';

export type KamusRuang = Record<Bahasa, Record<string, string>>;

export const KAMUS: Record<string, KamusRuang> = { umum, tokoh, adegan, pemain, misi, layar, host, server, alur, solo, bank, cerita, ceritaAkhir, ceritaAkt, ceritaHp, ruang };

/**
 * Ruang kamus khusus fitur PRD v0.2 (MVP berbahasa Indonesia, en untuk kesiapan terjemahan). Mandarin adalah fitur mode
 * lama (docs/prd-v02/DECISIONS.md D-03): ruang ini boleh tanpa zh, t() lalu memakai teks Indonesia.
 */
export const KAMUS_MVP: ReadonlySet<string> = new Set(['ruang']);
