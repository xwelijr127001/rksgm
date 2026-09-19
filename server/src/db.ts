/** Penyimpanan hasil pertandingan + soal kustom bank soal (SQLite via better-sqlite3). */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { SoalKustom } from '../../shared/bankSoal';
import { CONFIG } from './config';
import type { Room } from './rooms';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(path.dirname(CONFIG.dbFile), { recursive: true });
  db = new Database(CONFIG.dbFile);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      event_name TEXT NOT NULL,
      started_at INTEGER,
      finished_at INTEGER,
      player_count INTEGER NOT NULL DEFAULT 0,
      prizes_json TEXT NOT NULL DEFAULT '{}',
      saved_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS matches_code_started
      ON matches(code, IFNULL(started_at, 0));

    CREATE TABLE IF NOT EXISTS match_players (
      match_id INTEGER NOT NULL,
      player_id TEXT NOT NULL,
      nickname TEXT NOT NULL,
      look_json TEXT NOT NULL,
      rank INTEGER NOT NULL,
      total_points INTEGER NOT NULL,
      total_accuracy REAL NOT NULL,
      total_time_ms INTEGER NOT NULL,
      answered_count INTEGER NOT NULL,
      badges_json TEXT NOT NULL DEFAULT '[]',
      PRIMARY KEY (match_id, player_id)
    );

    CREATE TABLE IF NOT EXISTS match_rounds (
      match_id INTEGER NOT NULL,
      player_id TEXT NOT NULL,
      round_index INTEGER NOT NULL,
      mission_id TEXT NOT NULL,
      answered INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      base_points INTEGER NOT NULL,
      speed_bonus INTEGER NOT NULL,
      round_score INTEGER NOT NULL,
      elapsed_ms INTEGER NOT NULL,
      answer_json TEXT,
      PRIMARY KEY (match_id, player_id, round_index)
    );

    CREATE TABLE IF NOT EXISTS soal_kustom (
      id TEXT PRIMARY KEY,
      judul TEXT NOT NULL,
      data_json TEXT NOT NULL,
      dibuat INTEGER NOT NULL,
      diubah INTEGER NOT NULL
    );
  `);
  return db;
}

/** Simpan/perbarui hasil satu pertandingan. Idempoten per (code, started_at). */
export function saveMatch(room: Room): number {
  const d = getDb();
  const now = Date.now();
  const board = room.podium ?? room.leaderboard ?? [];

  const tx = d.transaction(() => {
    d.prepare(
      `INSERT INTO matches (code, event_name, started_at, finished_at, player_count, prizes_json, saved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(code, IFNULL(started_at, 0)) DO UPDATE SET
         event_name = excluded.event_name,
         finished_at = excluded.finished_at,
         player_count = excluded.player_count,
         prizes_json = excluded.prizes_json,
         saved_at = excluded.saved_at`,
    ).run(
      room.code,
      room.settings.eventName,
      room.startedAt,
      room.finishedAt,
      room.players.size,
      JSON.stringify(room.settings.prizes),
      now,
    );

    const matchId = d
      .prepare('SELECT id FROM matches WHERE code = ? AND IFNULL(started_at, 0) = IFNULL(?, 0)')
      .get(room.code, room.startedAt) as { id: number } | undefined;
    if (!matchId) throw new Error('gagal menyimpan match');
    const id = matchId.id;

    const insPlayer = d.prepare(
      `INSERT INTO match_players
        (match_id, player_id, nickname, look_json, rank, total_points, total_accuracy, total_time_ms, answered_count, badges_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(match_id, player_id) DO UPDATE SET
         nickname = excluded.nickname, look_json = excluded.look_json, rank = excluded.rank,
         total_points = excluded.total_points, total_accuracy = excluded.total_accuracy,
         total_time_ms = excluded.total_time_ms, answered_count = excluded.answered_count,
         badges_json = excluded.badges_json`,
    );
    const insRound = d.prepare(
      `INSERT INTO match_rounds
        (match_id, player_id, round_index, mission_id, answered, accuracy, base_points, speed_bonus, round_score, elapsed_ms, answer_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(match_id, player_id, round_index) DO UPDATE SET
         answered = excluded.answered, accuracy = excluded.accuracy, base_points = excluded.base_points,
         speed_bonus = excluded.speed_bonus, round_score = excluded.round_score,
         elapsed_ms = excluded.elapsed_ms, answer_json = excluded.answer_json`,
    );

    for (const p of room.players.values()) {
      const row = board.find((r) => r.playerId === p.id);
      const rank = row?.rank ?? 0;
      insPlayer.run(
        id,
        p.id,
        p.nickname,
        JSON.stringify(p.look),
        rank,
        p.totalPoints,
        p.totalAccuracy,
        p.totalTimeMs,
        p.rounds.filter((r) => r.answered).length,
        JSON.stringify(room.lencana(p, rank).map((b) => b.id)),
      );
      for (const r of p.rounds) {
        const sub = room.submissionOf(p.id, r.roundIndex);
        insRound.run(
          id,
          p.id,
          r.roundIndex,
          room.missionForRound(r.roundIndex)?.id ?? '-',
          r.answered ? 1 : 0,
          r.accuracy,
          r.basePoints,
          r.speedBonus,
          r.roundScore,
          r.elapsedMs,
          sub ? JSON.stringify(sub.answer) : null,
        );
      }
    }
    return id;
  });

  return tx();
}

export interface MatchSummaryRow {
  id: number;
  code: string;
  event_name: string;
  started_at: number | null;
  finished_at: number | null;
  player_count: number;
  saved_at: number;
}

export function listMatches(limit = 50): MatchSummaryRow[] {
  return getDb()
    .prepare('SELECT id, code, event_name, started_at, finished_at, player_count, saved_at FROM matches ORDER BY saved_at DESC LIMIT ?')
    .all(limit) as MatchSummaryRow[];
}

// ------------------------------------------------------------------ soal kustom (bank soal)
// Baris menyimpan SoalKustom utuh (TERMASUK kunci) sebagai JSON. Isinya sudah divalidasi
// soalKustom.ts sebelum disimpan; pembacaan tetap tahan baris rusak (dilewati, bukan melempar).

/** Pengaman: jumlah soal kustom yang boleh tersimpan. */
export const BATAS_JUMLAH_SOAL_KUSTOM = 200;

interface BarisSoalKustom {
  id: string;
  data_json: string;
  diubah: number;
}

function bacaBarisSoal(baris: BarisSoalKustom | undefined): SoalKustom | undefined {
  if (!baris) return undefined;
  try {
    const soal = JSON.parse(baris.data_json) as SoalKustom;
    if (!soal || typeof soal !== 'object' || !Array.isArray(soal.steps)) return undefined;
    return { ...soal, id: baris.id, diubah: baris.diubah };
  } catch {
    return undefined;
  }
}

/** Semua soal kustom, urut waktu dibuat. */
export function daftarSoalKustom(): SoalKustom[] {
  const baris = getDb()
    .prepare('SELECT id, data_json, diubah FROM soal_kustom ORDER BY dibuat ASC, id ASC')
    .all() as BarisSoalKustom[];
  return baris.map(bacaBarisSoal).filter((s): s is SoalKustom => s !== undefined);
}

export function ambilSoalKustom(id: string): SoalKustom | undefined {
  const baris = getDb().prepare('SELECT id, data_json, diubah FROM soal_kustom WHERE id = ?').get(id) as
    | BarisSoalKustom
    | undefined;
  return bacaBarisSoal(baris);
}

export function jumlahSoalKustom(): number {
  return (getDb().prepare('SELECT COUNT(*) AS n FROM soal_kustom').get() as { n: number }).n;
}

/** Simpan baru / timpa soal dengan id yang sama. Hasil = soal dengan cap waktu `diubah`. */
export function simpanSoalKustom(soal: SoalKustom): SoalKustom {
  const kini = Date.now();
  const { diubah: _lama, ...isi } = soal;
  getDb()
    .prepare(
      `INSERT INTO soal_kustom (id, judul, data_json, dibuat, diubah) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET judul = excluded.judul, data_json = excluded.data_json, diubah = excluded.diubah`,
    )
    .run(soal.id, soal.title, JSON.stringify(isi), kini, kini);
  return { ...isi, diubah: kini };
}

export function hapusSoalKustom(id: string): boolean {
  return getDb().prepare('DELETE FROM soal_kustom WHERE id = ?').run(id).changes > 0;
}

export function closeDb(): void {
  db?.close();
  db = null;
}
