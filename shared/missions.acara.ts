/**
 * PAKET ACARA - 10 misi untuk pertandingan (berbeda dari paket latihan di ./missions.ts),
 * tingkat kesulitan naik dari misi 1 ke 10. Tanpa kunci jawaban (kunci: server/src/acara/).
 *
 * STATUS: DRAF buatan tim game, BELUM ditinjau PIC Claim. Sesuaikan bila soal resmi sudah ada.
 * Satu misi = satu berkas di ./acara/ supaya mudah diganti satu per satu. Silabus & daftar hal
 * yang perlu dikonfirmasi: docs/silabus-paket-acara.md
 */
import type { MissionPublic } from './types';
import { misi as a01 } from './acara/a01';
import { misi as a02 } from './acara/a02';
import { misi as a03 } from './acara/a03';
import { misi as a04 } from './acara/a04';
import { misi as a05 } from './acara/a05';
import { misi as a06 } from './acara/a06';
import { misi as a07 } from './acara/a07';
import { misi as a08 } from './acara/a08';
import { misi as a09 } from './acara/a09';
import { misi as a10 } from './acara/a10';

/** Berkas yang masih rintisan (null) dilewati, jadi paket boleh terisi bertahap. */
export const MISSIONS_ACARA: MissionPublic[] = [a01, a02, a03, a04, a05, a06, a07, a08, a09, a10].filter((m): m is MissionPublic => m !== null);

export const MISI_ACARA_BY_ID = new Map(MISSIONS_ACARA.map((m) => [m.id, m]));
