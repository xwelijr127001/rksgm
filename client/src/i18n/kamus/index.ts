/**
 * Daftar kamus per ruang. Tiap berkas: `export default { id: {...}, en: {...}, zh: {...} }`
 * dengan himpunan kunci yang sama (dijaga ../terjemahan.test.ts).
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

export type KamusRuang = Record<Bahasa, Record<string, string>>;

export const KAMUS: Record<string, KamusRuang> = { umum, tokoh, adegan, pemain, misi, layar, host, server, alur, solo, bank };
