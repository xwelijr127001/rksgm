import test from 'node:test';
import Database from 'better-sqlite3';
import { runInvestigatorMigrations } from './migrations';
import * as S from './store';
import { manifestOf } from '../../../shared/investigator/rubric';

// Investigator event store, one scripted session on an in-memory SQLite. Random ids/aliases/codes are replaced by placeholders.
// Update: tsx --test --test-update-snapshots server/src/investigator/store.expect.test.ts
test('investigator event store session', (t) => {
  const db = new Database(':memory:');
  runInvestigatorMigrations(db, 0);
  let now = Date.UTC(2026, 10, 21, 3, 0, 0); // 10:00 WIB
  const log: string[] = [];
  const e0 = S.createEvent(db, 'host-1', now);
  const nama = new Map<string, string>();
  const ph = (alias: string, label: string): string => (nama.set(alias, label), label);
  const orang = ['P1', 'P2', 'P3'].map((label) => {
    const j = S.joinEvent(db, e0, now);
    ph(j.alias, label);
    return { label, id: j.participantId, ...S.participantOf(db, j.credential, now)! };
  });
  log.push(`joined: ${orang.length}, participants=${S.hostView(db, e0, now).participants}`);

  const m = manifestOf('kasus-1', 1)!;
  const benar = m.rounds[0]!.accepted[0]!, salah = m.rounds[0]!.cards.find((c) => !m.rounds[0]!.accepted.includes(c))!;
  const [bestV, bestP] = [Object.entries(m.verdicts).sort((a, b) => b[1] - a[1])[0]![0], Object.entries(m.messages).sort((a, b) => b[1] - a[1])[0]![0]];
  const worstV = Object.entries(m.verdicts).sort((a, b) => a[1] - b[1])[0]![0];
  let n = 0;
  const kirim = (o: (typeof orang)[number], runId: string, seq: number, stageId: string, choiceId: string, commandId = `cmd-${++n}-padding`) => {
    try {
      const a = S.decide(db, o.p, runId, { runId, seq, commandId, stageId, choiceId }, now);
      return `${o.label} seq${seq} ${choiceId} -> ${a.status} seq=${a.seq} next=${a.nextStage}${a.score ? ` score=${a.score.total}/${a.score.nilai}` : ''}`;
    } catch (err) { return `${o.label} seq${seq} ${choiceId} -> ERROR ${(err as S.EventError).code}`; }
  };
  const main = (o: (typeof orang)[number], pilihan: string[], verdict: string, basi = false) => {
    now += 1000; // fake clock: later finisher = later tie-break
    const r = S.startRun(db, o.p, e0, 'kasus-1', 1, now);
    if (r.status !== 'started') throw new Error('not started');
    let stage = r.run.stage, seq = 0;
    const urutan = [...pilihan, verdict, bestP];
    for (const c of urutan) {
      const line = kirim(o, r.run.runId, seq, stage, c); log.push(line);
      const mm = /next=(\S+)/.exec(line); if (!mm) break; stage = mm[1]!; seq++;
      if (basi && seq === 1) log.push(kirim(o, r.run.runId, 0, stage, c)); // stale seq 0, new commandId, run still active
    }
    return r.run;
  };
  // P1: first try, best verdict + message. P3: same (tie). P2: one miss first, worst verdict.
  const run1 = main(orang[0]!, [benar], bestV);
  log.push(kirim(orang[0]!, run1.runId, 0, run1.stage, benar, 'cmd-1-padding')); // retried commandId (cmd-1)
  main(orang[1]!, [salah, benar], worstV, true);
  main(orang[2]!, [benar], bestV);

  const label = (alias: string): string => nama.get(alias) ?? alias;
  const papan = (judul: string) => log.push(`${judul}: ${JSON.stringify(S.boardSnapshot(db, e0, now).rows.map((r) => ({ ...r, alias: label(r.alias) })))}`);
  papan('board (tie P1/P3)');
  S.hideEntry(db, e0, orang[2]!.id, true);
  papan('board (P3 hidden)');
  log.push(`host view rows: ${JSON.stringify(S.hostView(db, e0, now).rows.map((r) => ({ alias: label(r.alias), rank: r.rank, total: r.total, hidden: r.hidden })))}`);
  S.issueDisplayCode(db, e0, now);
  const kode = S.issueDisplayCode(db, e0, now).displayCode;
  const closed = S.closeEvent(db, e0, now + 60_000);
  log.push(`closed: status=${closed.status}, purgeAfter=${closed.purge_at! - closed.closed_at!} ms`);
  log.push(`pairing code after close: ${S.exchangeDisplayCode(db, kode, now + 61_000) === null ? 'refused' : 'EXCHANGED'}`);
  t.assert.snapshot(log);
});
