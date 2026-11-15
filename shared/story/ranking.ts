/**
 * In-room ranking for Story Rooms (PRD FR-D2). Deterministic and documented (DECISIONS.md D-08):
 *  - rank = 1 + number of participants with a STRICTLY higher total score ("1224" competition ranking), so equal
 *    totals share a rank and are flagged `tied`. No extra round is ever added to break ties.
 *  - display order inside a shared rank: more accuracy points, then less total answer time, then name, then ID.
 *    This order is presentation only; it does not change the shared rank.
 */

export interface RankInput {
  participantId: string;
  name: string;
  totalScore: number;
  accuracyPoints: number;
  totalElapsedMs: number;
}

export interface RankedRow extends RankInput {
  rank: number;
  tied: boolean;
}

export function rankParticipants(rows: readonly RankInput[]): RankedRow[] {
  const sorted = [...rows].sort(
    (a, b) =>
      b.totalScore - a.totalScore ||
      b.accuracyPoints - a.accuracyPoints ||
      a.totalElapsedMs - b.totalElapsedMs ||
      a.name.localeCompare(b.name, 'id') ||
      (a.participantId < b.participantId ? -1 : a.participantId > b.participantId ? 1 : 0),
  );
  const countByScore = new Map<number, number>();
  for (const r of sorted) countByScore.set(r.totalScore, (countByScore.get(r.totalScore) ?? 0) + 1);
  let higher = 0;
  let prevScore: number | null = null;
  let prevRank = 0;
  return sorted.map((r, i) => {
    if (prevScore === null || r.totalScore !== prevScore) {
      higher = i;
      prevRank = higher + 1;
      prevScore = r.totalScore;
    }
    return { ...r, rank: prevRank, tied: (countByScore.get(r.totalScore) ?? 0) > 1 };
  });
}
