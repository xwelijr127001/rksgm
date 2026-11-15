# Final report — Raksa Game 917, PRD v0.2 + staff review (one combined delivery)

Status (30 Oct 2026): **software scope complete and verified locally.** Every requirement that software alone can
satisfy is implemented and integrated. What remains needs stakeholder decisions, official content or environments that
were outside this work (§7.2–7.3). This is not a production-readiness or acceptance statement.

Local implementation only: nothing was committed, pushed or deployed; raksaonline.com and live data were not touched.

Later work (activity-based rounds and two fix rounds, 30 Oct – 1 Nov 2026, DECISIONS D-28–D-47) and the latest
measured results are in REVIEW-HANDOFF.md §11–§12; the numbers in §4 are those of the 30 Oct build.

## 1. What changed

- **New Story Room product** (PRD primary product): host-led synchronized multiplayer visual novel — 15 shared rounds,
  5 shuffled text choices, 30 s server timer that closes early when every eligible participant has answered, private
  consequence + customer mood + 70:30 score, rankings between rounds, personalized final summary and ending; one room
  = one session, never restartable. Server-authoritative (`server/src/story/runtime/room.ts`), shared rules
  (`shared/story/`), Socket.IO namespace `/story`.
- **CMS** (`/cms`): structured editor for 15×5 scenarios (no JSON), live validation with round/field messages,
  whole-scenario preview with the same rules (no room, no results), draft → review → four-eyes publish → immutable
  versions → archive/withdraw, revision history, asset library with rights metadata, categories.
- **Admin** (`/admin`): competition periods, dashboard with definitions, cross-room results + safe CSV export, round
  analytics (most wrong / most timed out), room list (competition admin can close a live room), users & roles, audit log.
- **Internal roles** host / author / reviewer / competition admin / system admin, enforced on every REST route and
  host socket event; provisioning CLI; no default credentials.
- **Staff review**: Join Game card at the top with surveyor icon and "Mulai" (#2, #4, #6), Miss Raksa welcome with
  "anytime anywhere with our smile" (#1), "Cara main lain" removed (#3), "Mini Games" naming (#5), back/exit with
  confirmation (#8), timers/rounds/choices/consequences/endings/score explanation/leaderboards/notice in the new room
  (#7, #11–#17, #19), real CMS/admin (#18), category architecture with only Auto active (#10).
- **Legacy preserved, gated**: solo story, Mini Games, legacy event quiz, Mandarin, Unity behind `RAKSA_LEGACY=on`
  (default off: routes not registered, legacy APIs and sockets refused).
- **Hosting preparation**: base-path build, framing policy, proxy-aware rate limits, local raksaonline.com stand-in harness.
- **Abuse limits**: failure-only lookup and login limits per client IP (NAT-safe), flood caps, small socket payloads,
  idle-room expiry.

New settings (HOSTING.md §5): `RAKSA_LEGACY`, `TRUST_PROXY_HOPS`, `FRAME_ANCESTORS`, `STORY_MAX_PARTICIPANTS`,
`STORY_MAX_ACTIVE_ROOMS`, build-time `VITE_BASE_PATH` / `VITE_OUT_DIR`, and `STAFF_PASSWORD` for the provisioning CLI.

## 2. What was reused (first-party)

The v5.1 pixel stage (`cerita/ui/Panggung` — now owns its stylesheet), Miss Raksa / Bu Rina portraits and expressions,
office / parking / phone locations, the audio engine and BGM, i18n (`t()`, kamus), UI kit (modal, QR, timer styles),
PlayerShell/Merek, Express + Socket.IO + better-sqlite3 patterns, and the legacy code untouched behind the flag.

## 3. Backup and restore verification

`C:\Users\User\Desktop\rksgm-backups\20261030-154546-before-prd-v02\` — full working tree incl. `.git` and untracked
files (2 614 files, checksums), git bundle, consistent SQLite snapshot (SHA-256 `563b8019…`, integrity ok),
`BACKUP-MANIFEST.md`, `RESTORE.md`. Restored into a separate folder: checksums 2614/2614, git status identical, fsck
ok, `npm ci` ok, smoke run on port 4791 ok. The backup was not modified afterwards.

## 4. Verification results (final build, 30 Oct 2026; historic — latest: REVIEW-HANDOFF.md §12.5)

| Area | Result |
| --- | --- |
| Typecheck / build | clean / OK (only the pre-existing chunk-size warning for the legacy Phaser chunk) |
| Automated tests (`npm test`) | server 125/125, client 518/518 |
| Browser acceptance (`tools/uji-room-cerita.mjs`, 6 phases, 4 viewports) | 168/168 |
| Keyboard-only room flow | 8/8 |
| Hosting harness (path prefix, iframe, proxy hops) | 10/10 |
| Legacy regression (`RAKSA_LEGACY=on`) | 122/122; solo stage identical to baseline |
| Server restart during a running room | room `interrupted`, stored results identical |
| Answer keys in the client bundle | 0 of 408 scenario sentences |
| Bounded load test (same machine, loopback) | up to 10 rooms × 30 participants: 0 errors, answer ack p95 ≤ 4 ms, phase skew ≤ 6 ms |

Measured timing in the acceptance run: rounds where everyone answered closed ≤ 1 ms after the last answer; deadline
rounds closed at 30.002–30.015 s; room A (15 rounds, 8 closed early, 7 at the deadline) took 10.9 minutes against the
~14-minute target (measured, not enforced — D-09). Commands and details: REVIEW-HANDOFF.md §8.

Review: defects found by the browser runs (A1–A6) and a separate read-only code review (R1–R12, U1–U4) were each
verified in the code, then fixed with a regression check, or explicitly accepted with the reason (U4) —
REVIEW-HANDOFF.md §7. No assertion was weakened; changed test contracts and their reasons: REVIEW-HANDOFF.md §4.

## 5. Evidence

`docs/prd-v02/evidence/` (118 files, 8.7 MB; index in `evidence/README.md`): `baseline/` (before the change),
`e2e/`, `keyboard/`, `hosting/`, `load/`, `restart/`, `legacy/`, `checks/`. Every run used an isolated copy of the
database on a local port; the real `data/raksa-game.db` kept SHA-256 `563B8019…` (one development incident, restored
byte-identical and guarded since — REVIEW-HANDOFF.md §5).

## 6. Known limitations and risks

1. **Content is synthetic.** The two Auto scenarios are DEMO content published by test identities (simulated
   approval, D-10); they exercise the platform and must not be used as competition material.
2. **Score policy is provisional**: new rooms use `story-70-30-v2` (a correct answer at 0 / 15 / 30 s scores
   1000 / 850 / 700; speed points are no longer scaled by accuracy, so "kurang tepat" at weight 0.5 scores 650 / 500 at
   0 / 15 s — SCHEMA-AND-SCORING.md, D-07) until Komite + Product approve it (C-5). Results stored under the first
   release's `story-70-30-v1` keep their points and are never recalculated.
3. **Capacity is unknown for production.** Load numbers come from one machine over loopback; the limits (100 per room,
   20 active rooms) are local defaults (D-18).
4. **Devices**: Chrome emulation only (360×740, 390×844, 844×390, 1440×900, reduced motion, keyboard). No iOS Safari or
   Android hardware, no screen-reader session, no formal accessibility audit.
5. **Hosting**: verified only with the local stand-in harness. Legacy pages still assume root hosting, so do not enable
   `RAKSA_LEGACY` under a path prefix.
6. **Single process**: live room state (including each room's option secret) is in memory. A restart ends running
   rooms as `interrupted` with results kept; they cannot be resumed (D-17). No horizontal scaling.
7. **Staff identity**: local accounts (scrypt, 12 h sessions), no SSO. A system admin can create a second account and so
   defeat four-eyes publication; every change is audited (accepted trust boundary, U4).
8. **Data**: names and results are kept without automatic deletion (D-23, retention open). Uploaded CMS assets live
   in `data/aset-cerita/` and must be part of any backup.
9. **Name filter** is a starting list for Product/Legal review (D-19).
10. **Bundle**: main chunk 657 kB (baseline 638 kB); the 1.69 MB Phaser chunk is unchanged and loaded only by legacy pages.
11. **Languages**: participant UI in Indonesian and English; staff tools Indonesian only; Mandarin is legacy only.

## 7. Status per requirement

The per-requirement ledger with baseline, implementation and test references is REQUIREMENTS-MATRIX.md. Summary:

### 7.1 Implemented and locally verified

- PRD FR-A1–A4, FR-A6–A10, FR-B1–B10, FR-C1–C8, FR-D2–D6, FR-E1–E4, FR-E7.
- All 25 acceptance criteria of PRD Appendix A (on demo content, with the provisional score policy).
- Non-functional: responsive layout (emulation), real-time sync, network resilience incl. server restart, asset
  loading with text fallback, server-side scoring, roles/audit/rate limits, publication without redeploy, ownership
  of code and docs, accessibility conventions incl. keyboard-only play.
- Staff review #1, #2, #4, #6, #7, #8, #11–#19; #3 and #5 in legacy mode (owner decision below); #10 as category
  architecture with only Auto active.
- Legacy features preserved and gated; hosting preparation verified with the local harness.

### 7.2 Implemented, awaiting stakeholder approval or decision

| Item | Decision / input needed | Owner |
| --- | --- | --- |
| C-1 | Two approved Auto settled cases written as 15 rounds × 5 choices (the demo scenarios stand in) | Tim Story + Tim Storyline |
| C-2 | Answer key, "kurang tepat" weight and reasons per choice (FR-A5) | Komite gabungan |
| C-3 | Customer-state design and ending thresholds per case | Tim Storyline + Komite |
| C-4 | Anonymization rules and approver (FR-E6) | Legal + Tim Story |
| C-5 | Score policy `story-70-30-v2`, provisional and active for new rooms (FR-D1, D-07; v1 results are never recalculated); tie handling (D-08) | Komite + Product; Panitia |
| C-6 | Winner rule across rooms/scenarios, winner identity check (FR-D5, D-25) | Product + Panitia + Legal |
| C-7 | Visual style, asset list and rights for the scenarios | Product Management |
| C-8 | Brand guide and logo (FR-E5 — currently **partial**: existing v5.1 tokens) | Marketing |
| C-9 | Data retention and privacy-notice wording (D-23) | Legal + Product |
| Open #1 | Event size → production capacity limits (D-18) | Marketing + IT |
| Open #8 | Who may open rooms besides staff hosts (D-22) | Product |
| Open #17 | Mandarin timing (D-13) | Marketing |
| D-03 | **Conflict**: staff review #3/#5 want Mini Games on the home page; PRD strict MVP hides it. Both are built (`RAKSA_LEGACY=on` shows it) | Product |
| D-02 | Cargo category (staff review #10) — recorded, not created | Product |
| D-04/05/06/09/11/12/19 | Interpretations to confirm: exactly 5 choices; owned build reusing first-party parts; the two scenarios in separate rooms; timing defaults; host vs automation; eligibility freeze; name rules | Product (+ IT for D-05, Legal for D-19) |

PRD Appendix B.5 (definition of done): the software parts are verified locally; PIC Claim approval of the answer keys
and the winner rule are pending (C-2, C-6).

### 7.3 Unverified integration

| Item | Why not verified | Owner |
| --- | --- | --- |
| Embedding in raksaonline.com (FR-B2, App. B.2): real reverse proxy, TLS, parent-page CSP | changing raksaonline.com was out of scope; local stand-in harness only | IT (open #3) |
| Staff SSO / identity provider (FR-E3, D-14) | not implemented; local accounts | IT |
| Real phones and browsers (iOS Safari, Android, low-end devices, cellular/Wi-Fi) | Chrome emulation only | QA / Product |
| Production capacity and host machine | loopback load test only | IT |
| Operations: process manager, backups of the DB and `data/aset-cerita/`, monitoring | not in scope | IT |
| Review/publication with real reviewer accounts | test identities only | Tim Story / Komite |

### 7.4 Outside MVP (documented, not built)

FR-F1 HVC & Property (inactive categories exist), FR-F2 solo mode (existing solo story kept behind `RAKSA_LEGACY`),
FR-F3 Mandarin (legacy only), FR-F4 player accounts, FR-F5 certificates/badges, FR-F6 adaptive voice/music (optional
scenario BGM only), plus the B.3 list (native app, operations integration).

## 8. Repository state and commit hygiene

- Branch `prd-v02-mvp` created from `main` @ ff38b52; no commits, no stash. 36 tracked files modified, 466 untracked
  files after the fix rounds of 1 Nov 2026 (417 on 30 Oct).
- Must **not** be committed (pre-existing local material, untracked and not ignored): `character/` (201 master source
  files) and `docs/cerita/aset/MISS-RAKSA.md` (private design notes). Runtime data is ignored: `data/*.db`,
  `data/aset-cerita/`, `data/dev-staff-credentials.json`, `dist-game/`.
- To decide before any commit: whether `docs/prd-v02/evidence/` (8.7 MB of screenshots and logs) belongs in the
  repository or in a separate archive.

## 9. Where to continue

- Next reviewer: REVIEW-HANDOFF.md (invariants, commands, findings, review order).
- Content team and committee: CONTENT-HANDOFF.md, CMS-GUIDE.md.
- IT: HOSTING.md, ROLES-AND-PROVISIONING.md, SCHEMA-AND-SCORING.md, ARCHITECTURE.md.
- Decisions and interpretations: DECISIONS.md.
- Return to the pre-change state: `RESTORE.md` in the backup folder (§3).
