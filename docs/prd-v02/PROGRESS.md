# PRD v0.2 + staff review — implementation progress (durable checkpoint)

STATUS: **COMPLETE for the software scope (30 Oct 2026)** — implemented, integrated and verified locally. Not
production-ready until the external decisions in FINAL-REPORT.md §7.2–7.3 are closed. Nothing committed, pushed or
deployed.

Brief: `C:\Users\User\Documents\raksa-prd-review-20261030\PROMPT-CLAUDE-PRD.md`
Sources: PRD v0.2 (18 pp.), staff review (3 pp., items 1–8, 10–19), ARCHITECTURE-REVIEW.md.
Working branch: `prd-v02-mvp` (created from `main` @ ff38b52; no commits made — none requested).

## Checkpoints

| # | Checkpoint | State |
| --- | --- | --- |
| 1 | Verified backup + restore test | DONE — `C:\Users\User\Desktop\rksgm-backups\20261030-154546-before-prd-v02\` (BACKUP-MANIFEST.md, RESTORE.md) |
| 2 | Baseline run, requirement matrix, conflict log, design | DONE — `evidence/baseline/`, REQUIREMENTS-MATRIX.md, DECISIONS.md (D-01…D-27), ARCHITECTURE.md |
| 3 | Multiplayer story slice (server/participant/host/projector/score/persist/reconnect) | DONE — tests + browser runs |
| 4 | 15-round hub, results, timeout/close, two demo scenarios | DONE — both scenarios played to the end in separate rooms |
| 5 | CMS, review/publish/version, assets, roles, periods, reports, analytics | DONE — browser e2e (cms, admin, peran) |
| 6 | Staff UI changes, legacy gating, hosting harness, regression | DONE — landing #1–#6, #8, legacy gating, harness 10/10, legacy regression 122/122 |
| 7 | Acceptance verification, review pass, handoff | DONE — REVIEW-HANDOFF.md §7–§8, FINAL-REPORT.md |

## Final state (30 Oct 2026; historic — latest results: REVIEW-HANDOFF.md §12.5)

- `npm run typecheck` clean; `npm test` server 125/125, client 518/518; `npm run build` OK; bundle scan 0/408.
- Browser acceptance 168/168; keyboard 8/8; hosting harness 10/10; legacy regression 122/122; restart recovery and
  bounded load test recorded in `evidence/`.
- Test servers stopped; no browser processes left; real `data/raksa-game.db` SHA-256 `563B8019…` unchanged.

## Incident log (must appear in the handoff)

- 2026-10-30: the FIRST version of `story.integration.test.ts` set env vars after hoisted static imports, so the server
  bound port 4000 and wrote story tables + 1 staff user + room ZZZZZZ + audit rows into the REAL `data/raksa-game.db`
  (legacy tables untouched). Restored byte-identical from the backup snapshot (SHA-256 563b8019…, -wal/-shm removed);
  fixed with `story/testing/integrationEnv.ts` as first import + a DB-name guard. Real DB re-verified unchanged.

## Remaining (not software — owners in FINAL-REPORT.md §7)

Official cases and answer keys, score policy and winner rule approval, anonymization approver, retention, brand guide,
capacity target, Mini Games visibility (conflict D-03), Cargo request; real raksaonline.com integration, SSO, real
devices, production capacity and operations.

## Log

- 2026-10-30 15:46 backup created and restore-verified (2614/2614 checksums, git/bundle, SQLite integrity, npm ci, smoke run).
- 2026-10-30 baseline captured (`evidence/baseline/`), architecture written, server Story Room subsystem implemented.
- 2026-10-30 integration test stall fixed (named SQL params; persistence guarded so a store error can never freeze a room).
- 2026-10-30 client MVP pages, CMS and admin written; typecheck clean.
- 2026-10-30 browser runs: landing 36/36; first two-room run exposed (a) pixel stage blank outside the solo page
  (stage CSS lived in the page stylesheet → moved to `cerita/ui/panggung/panggung.css`, imported by Panggung),
  (b) `.isi` class collision in the mood indicator, (c) answer options below the fold on phones, (d) a test-script
  bug (reopened host tab needs a new staff login). All fixed; full suite re-running on a fresh DB copy.
- 2026-10-30 rate limits changed to count FAILED lookups per IP (NAT-safe) + flood cap; framing policy
  (`FRAME_ANCESTORS`), base-path build + hosting harness (10/10), bundle scan (0/408 scenario sentences),
  persistence-failure regression test; docs DECISIONS, MATRIX, CMS-GUIDE, ROLES, HOSTING, SCHEMA, CONTENT-HANDOFF,
  REVIEW-HANDOFF written. Independent code review running.
- 2026-10-30 independent review findings R1–R12, U1–U4 verified and fixed (proxy-aware limits, stale host clicks,
  socket re-authentication, async scrypt, name/payload limits, asset oracle, results cap, legacy gate case, expiry and
  admin close, dashboard denominators, four-eyes anonymization, period validation, session purge); deadline timer
  firing 1 ms early fixed (A5); load test skew measurement corrected.
- 2026-10-30 final verification on the final build: tests/typecheck/build, e2e 168/168, restart recovery, harness 10/10,
  load runs, legacy A–F 122/122; projector label separator fixed (A6) and verified with the keyboard check 8/8.
- 2026-10-30 handoff docs completed (REVIEW-HANDOFF §7–§10, REQUIREMENTS-MATRIX references, HOSTING settings,
  FINAL-REPORT §4–§9).
- 2026-10-30/31 gameplay change set (activity-based rounds, D-28–D-35): REVIEW-HANDOFF §11.
- 2026-10-31 and 2026-11-01 two fix rounds (D-36–D-47): REVIEW-HANDOFF §12. 1 Nov: `npm run typecheck` exit 0;
  `npm test` server 192/192, client 612/612; `tools/uji-skenario.mjs` 3483/3483 on a DB copy holding the anonymised
  real-case scenario (outside the repo).
