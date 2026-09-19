/**
 * Perhitungan skor, rubric, dan peringkat RAKSA GAME.
 *
 * Fungsi di sini murni (pure) agar mudah diuji. Data kunci jawaban TIDAK ada di
 * file ini - hanya bentuk/typenya. Kunci jawaban ada di server/src/answerKeys.ts.
 */

import type {
  Badge,
  LeaderRow,
  MissionAnswer,
  MissionPublic,
  PlayerLook,
  RoundResult,
  StepAnswer,
} from './types';

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Rubric satu langkah (server-side data, bentuknya dipakai bersama untuk tes). */
export interface StepKey {
  stepId: string;
  weight: number;
  /** Jawaban benar sesuai jenis langkah. */
  single?: string;
  multi?: string[];
  assign?: Record<string, string>;
  number?: { value: number; tolerance?: number };
  order?: string[];
  /** Jumlah pilihan yang diharapkan pada multi-select (default: multi.length). */
  requiredSelections?: number;
  explanation: string;
}

export interface MissionKey {
  missionId: string;
  roundIndex: number;
  summary: string;
  steps: StepKey[];
}

export interface StepGrade {
  stepId: string;
  accuracy: number;
  weight: number;
}

export interface MissionGrade {
  accuracy: number;
  steps: StepGrade[];
}

/** Ketepatan satu langkah: selalu 0..1. Jawaban kosong/salah bentuk = 0. */
export function gradeStep(key: StepKey, raw: StepAnswer | undefined): number {
  if (raw === undefined || raw === null) return 0;

  if (key.single !== undefined) {
    return typeof raw === 'string' && raw === key.single ? 1 : 0;
  }

  if (key.multi !== undefined) {
    if (!Array.isArray(raw)) return 0;
    const picked = new Set(raw.filter((x): x is string => typeof x === 'string'));
    const correctSet = new Set(key.multi);
    let correctSelections = 0;
    let wrongSelections = 0;
    for (const id of picked) {
      if (correctSet.has(id)) correctSelections++;
      else wrongSelections++;
    }
    const required = key.requiredSelections ?? key.multi.length;
    if (required <= 0) return 0;
    // Memilih distraktor mengurangi ketepatan -> memilih semua opsi tidak menguntungkan.
    return clamp((correctSelections - wrongSelections) / required, 0, 1);
  }

  if (key.assign !== undefined) {
    if (typeof raw !== 'object' || Array.isArray(raw)) return 0;
    const answer = raw as Record<string, string>;
    const itemIds = Object.keys(key.assign);
    if (itemIds.length === 0) return 0;
    let correct = 0;
    for (const itemId of itemIds) {
      if (answer[itemId] === key.assign[itemId]) correct++;
    }
    return clamp(correct / itemIds.length, 0, 1);
  }

  if (key.number !== undefined) {
    const value = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(value)) return 0;
    const tol = key.number.tolerance ?? 0;
    return Math.abs(value - key.number.value) <= tol ? 1 : 0;
  }

  if (key.order !== undefined) {
    if (!Array.isArray(raw)) return 0;
    const seq = raw.filter((x): x is string => typeof x === 'string');
    const want = key.order;
    if (want.length === 0) return 0;
    let correct = 0;
    for (let i = 0; i < want.length; i++) {
      if (seq[i] === want[i]) correct++;
    }
    return clamp(correct / want.length, 0, 1);
  }

  return 0;
}

/** Ketepatan misi = rata-rata berbobot ketepatan tiap langkah. */
export function gradeMission(key: MissionKey, answer: MissionAnswer | null | undefined): MissionGrade {
  const steps: StepGrade[] = key.steps.map((s) => ({
    stepId: s.stepId,
    weight: s.weight > 0 ? s.weight : 1,
    accuracy: gradeStep(s, answer ? answer[s.stepId] : undefined),
  }));
  const totalWeight = steps.reduce((a, s) => a + s.weight, 0);
  const accuracy = totalWeight > 0
    ? clamp(steps.reduce((a, s) => a + s.weight * s.accuracy, 0) / totalWeight, 0, 1)
    : 0;
  return { accuracy, steps };
}

export interface RoundScore {
  basePoints: number;
  speedBonus: number;
  roundScore: number;
}

/**
 * basePoints = round(1000 x accuracy)
 * speedBonus = round(300 x accuracy x max(0, 1 - elapsed/duration))
 */
export function scoreRound(
  accuracy: number,
  elapsedSeconds: number,
  durationSeconds: number,
): RoundScore {
  const a = clamp(accuracy, 0, 1);
  const basePoints = Math.round(1000 * a);
  const ratio = durationSeconds > 0 ? elapsedSeconds / durationSeconds : 1;
  const speedBonus = Math.round(300 * a * Math.max(0, 1 - ratio));
  return { basePoints, speedBonus, roundScore: basePoints + speedBonus };
}

export interface RankInput {
  playerId: string;
  nickname: string;
  look: PlayerLook;
  totalPoints: number;
  totalAccuracy: number;
  totalTimeMs: number;
  answeredCount: number;
}

/**
 * Urutan peringkat:
 * 1. total poin tertinggi
 * 2. total poin ketepatan tertinggi
 * 3. total waktu menjawab terendah (ronde tanpa jawaban = durasi penuh)
 * Nilai yang identik pada ketiga kunci -> peringkat sama & ditandai seri.
 */
export function rankPlayers(rows: RankInput[], prevRanks?: Map<string, number>): LeaderRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.totalAccuracy !== a.totalAccuracy) return b.totalAccuracy - a.totalAccuracy;
    if (a.totalTimeMs !== b.totalTimeMs) return a.totalTimeMs - b.totalTimeMs;
    return a.nickname.localeCompare(b.nickname, 'id');
  });

  const sameRank = (a: RankInput, b: RankInput) =>
    a.totalPoints === b.totalPoints &&
    a.totalAccuracy === b.totalAccuracy &&
    a.totalTimeMs === b.totalTimeMs;

  const out: LeaderRow[] = [];
  let rank = 0;
  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    if (i === 0 || !sameRank(sorted[i - 1], row)) rank = i + 1;
    const prev = prevRanks?.get(row.playerId);
    out.push({
      playerId: row.playerId,
      nickname: row.nickname,
      look: row.look,
      rank,
      totalPoints: row.totalPoints,
      totalAccuracy: Math.round(row.totalAccuracy * 1000) / 1000,
      totalTimeMs: row.totalTimeMs,
      answeredCount: row.answeredCount,
      delta: prev === undefined ? 0 : prev - rank,
      tied: false,
    });
  }
  // tandai seri
  const counts = new Map<number, number>();
  for (const r of out) counts.set(r.rank, (counts.get(r.rank) ?? 0) + 1);
  for (const r of out) if ((counts.get(r.rank) ?? 0) > 1) r.tied = true;
  return out;
}

/** true bila ada seri pada tiga posisi teratas (host perlu ronde penentuan). */
export function hasPodiumTie(rows: LeaderRow[]): boolean {
  return rows.some((r) => r.rank <= 3 && r.tied);
}

export const ALL_BADGES: Badge[] = [
  { id: 'juara', label: 'Pahlawan Tercepat', desc: 'Peringkat 1 pertandingan', icon: 'medali' },
  { id: 'tepat-sasaran', label: 'Tepat Sasaran', desc: 'Rata-rata ketepatan minimal 90%', icon: 'cek' },
  { id: 'kilat', label: 'Respons Kilat', desc: 'Rata-rata menjawab di bawah 40% waktu', icon: 'kilat' },
  { id: 'lengkap', label: 'Tuntas 10 Misi', desc: 'Mengirim jawaban di semua misi', icon: 'bintang' },
  { id: 'detektif', label: 'Detektif Bukti', desc: 'Sempurna di Misi 2 dan Misi 4', icon: 'kamera' },
  { id: 'teliti', label: 'Hitung Teliti', desc: 'Sempurna di Misi 9', icon: 'kalkulator' },
  { id: 'pahlawan-kota', label: 'Pahlawan Kota', desc: 'Sempurna di Grand Mission', icon: 'gudang' },
];

/**
 * `missions` = soal yang dimainkan, berurutan (playlist room; paket latihan untuk mode solo).
 * `opsi.lencanaMisi = false` mematikan lencana yang terikat nomor misi (detektif, teliti,
 * pahlawan-kota): dipakai room ber-playlist campuran, karena "Misi 9" di sana soal lain.
 */
export function computeBadges(
  rounds: RoundResult[],
  rank: number,
  missions: Pick<MissionPublic, 'durationSeconds'>[],
  opsi: { lencanaMisi?: boolean } = {},
): Badge[] {
  const byId = new Map(ALL_BADGES.map((b) => [b.id, b]));
  const earned: Badge[] = [];
  const add = (id: string) => {
    const b = byId.get(id);
    if (b && !earned.some((e) => e.id === id)) earned.push(b);
  };

  const answered = rounds.filter((r) => r.answered);
  const avgAccuracy = rounds.length ? rounds.reduce((a, r) => a + r.accuracy, 0) / rounds.length : 0;

  if (rank === 1) add('juara');
  if (rounds.length > 0 && avgAccuracy >= 0.9) add('tepat-sasaran');
  // Butuh 8 jawaban pada pertandingan 10 soal; playlist yang lebih pendek cukup semua soalnya.
  const minimalKilat = missions.length > 0 ? Math.min(8, missions.length) : 8;
  if (answered.length >= minimalKilat) {
    const ratios = answered.map((r) => {
      const dur = (missions[r.roundIndex]?.durationSeconds ?? 30) * 1000;
      return dur > 0 ? r.elapsedMs / dur : 1;
    });
    const avgRatio = ratios.reduce((a, v) => a + v, 0) / ratios.length;
    if (avgRatio <= 0.4) add('kilat');
  }
  if (rounds.length > 0 && answered.length === rounds.length) add('lengkap');
  if (opsi.lencanaMisi !== false) {
    const perfect = (i: number) => rounds.find((r) => r.roundIndex === i)?.accuracy === 1;
    if (perfect(1) && perfect(3)) add('detektif');
    if (perfect(8)) add('teliti');
    if (perfect(9)) add('pahlawan-kota');
  }

  return earned;
}

export function formatRupiah(v: number): string {
  return 'Rp' + Math.round(v).toLocaleString('id-ID');
}
