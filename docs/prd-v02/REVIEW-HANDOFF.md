# Review handoff — PRD v0.2 Story Room MVP + staff review

For the next reviewer (human or a separate Claude session) who has not seen the implementation conversation.
Read with: `ARCHITECTURE.md`, `DECISIONS.md`, `REQUIREMENTS-MATRIX.md`, `SCHEMA-AND-SCORING.md`, `HOSTING.md`.
§1–§10 cover the PRD v0.2 delivery; §11 covers the later gameplay change set (activity-based rounds, D-28–D-35); §12
covers the two fix rounds that followed it (D-36–D-47) and the latest measured results.

## 1. Problem and final behaviour

The repo held an event quiz (tap missions, 1000+300 scoring), a solo visual-novel story and practice missions. PRD v0.2
asks for a host-led **multiplayer visual novel**: one room plays one published scenario version, 15 shared rounds,
5 text choices, 30-second answer window, private consequences/customer mood/score/ending per participant, rankings,
a CMS with review/versioned publication, internal roles, competition periods, cross-room reports and analytics. The
staff review adds landing/navigation changes (#1–#8), category scope (#10) and verification points (#11–#19).

Delivered locally (no commit/push/deploy):
- New subsystem "Story Room": `shared/story/*`, `server/src/story/*`, client `story/*`, `pages/story|cms|admin/*`.
- Legacy features kept intact behind `RAKSA_LEGACY=on` (default off): routes not registered, APIs/sockets refused.
- Landing rebuilt around "Join Game" (staff review #1–#6), legacy event play gets "Kembali" with confirmation (#8).
- Two synthetic Auto demo scenarios (15×5) for verification; real content/approvals are external (CONTENT-HANDOFF.md).

## 2. Invariants to check (where they are enforced)

| Invariant | Where |
| --- | --- |
| Server owns phase, clock, eligibility, answers, scores, moods, endings | `server/src/story/runtime/room.ts` |
| A round settles exactly once (all-answered vs deadline race) | `closeAnswering()` phase guard; `room.test.ts` race tests |
| Deadline inclusive, server receipt time only, no client time | `answer()`; `scoreDecision` |
| Eligibility frozen at answering start; reconnect never adds; removal excludes | `beginAnswering()`, `removeParticipant()` |
| Persistence failures never freeze a room | `persist()` wrapper around every store call |
| Public payload has no keys/weights/other players' private data; options only while answering; consequence only after close | `publicState()`, `privateState()`; E2E payload capture |
| Options = per-participant HMAC handles + deterministic shuffle; grading by choice id | `runtime/options.ts` |
| One room = one session; closed rooms cannot restart | `start()`, `close()`, manager; no reset API |
| Versions immutable; rooms pin version id + hash; withdrawn/archived cannot open rooms | `content/scenarios.ts`, manager `create()` |
| Four-eyes publish; settled cases need anonymization record | `publish()` |
| Every staff REST route and host socket event checks capability (and room ownership) | `http.ts requireCap`, `socket.ts hostedRoom` |
| Unauthenticated lookups throttled by failed guesses per IP | `socket.ts lookupAllowed`, `auth/rateLimit.ts` |
| CSV export neutralizes formula injection; BOM for Excel | `reports.ts csvCell/resultsCsv` |
| Uploaded assets: signature + size checked, content-addressed names, served with nosniff + sandbox CSP | `content/assets.ts`, `http.ts /aset-cerita` |

## 3. Setup and verification commands (Windows, Node ≥ 20.11)

```bash
npm ci
npm run typecheck            # server + client (client also compiles shared/)
npm test                     # server (node:test) + client unit tests
npm run build                # client (Vite) + server (tsc) — only while no server runs from client/dist + server/dist
                             # (e.g. the owner's port 4100); otherwise use the separate test build of §11.4 (D-35)

# isolated database copy for any manual/browser run — never the real data/raksa-game.db
node -e "const D=require('better-sqlite3');const s=new D('data/raksa-game.db',{readonly:true});s.backup('<tmp>/raksa-game.db')"
DB_FILE=<tmp>/raksa-game.db npm run story:dev-setup -- --publish-demo --period     # test identities + SIMULATED demo publication
PORT=4820 DB_FILE=<tmp>/raksa-game.db STORY_MAX_PARTICIPANTS=4 PUBLIC_BASE_URL=http://127.0.0.1:4820 npm start

# browser acceptance (needs `npm install --no-save puppeteer-core` and Chrome)
UI_BASE=http://127.0.0.1:4820 RAKSA_KREDENSIAL=<tmp>/dev-staff-credentials.json RAKSA_DB=<tmp>/raksa-game.db \
  node tools/uji-room-cerita.mjs landing main cms admin peran aset
UI_BASE=http://127.0.0.1:4820 RAKSA_KREDENSIAL=<tmp>/dev-staff-credentials.json node tools/uji-keyboard-room.mjs
# hosting harness: see HOSTING.md; load test: LOAD_* env + npm -w @raksa/server run story:loadtest (evidence/load/README.md)
```

## 4. Changed test contracts (and why)

| Test | Change | Reason |
| --- | --- | --- |
| `server/src/integration.test.ts`, `bank.integration.test.ts`, `unity.test.ts` | set `RAKSA_LEGACY=on` before loading the server | legacy features are off by default (D-03); these tests exercise legacy behaviour unchanged |
| `client/src/i18n/terjemahan.test.ts` | namespaces in `KAMUS_MVP` (`ruang`) must have id + en and an EMPTY zh | Mandarin is a legacy feature (PRD FR-F3 / B.3, D-13); other namespaces still require all three languages |
| `tools/uji-temuan-review.mjs` (finding F) | landing contract = Join Game card + legacy section instead of "three doors with the story door first"; legacy host/projector at `/acara/host`, `/acara/layar` | staff review #1–#6 intentionally replaced the landing; legacy routes moved under `/acara` (D-03) |
| `tools/e2e-browser.mjs` | legacy host at `/acara/host`; must run with `RAKSA_LEGACY=on` | same |
| `server/src/story/room.test.ts` | two steps advance to 1 ms past the answer deadline instead of exactly onto it | the inclusive deadline means the window closes strictly after `deadlineAt` (finding A5); a new test pins the boundary |

No assertion was weakened to make a failing behaviour pass.

## 5. Incident during development (data safety)

The first version of `server/src/story/story.integration.test.ts` set environment variables after hoisted static
imports, so one run bound port 4000 and wrote story tables + one staff user + a room + audit rows into the REAL
`data/raksa-game.db` (legacy tables untouched). The file was restored byte-identical from the verified backup
snapshot (SHA-256 `563b8019…`, `-wal/-shm` removed) and the test now imports `story/testing/integrationEnv.ts` first
and refuses to run unless the DB file name is a temp test name. The real DB hash was re-checked afterwards and again
at the end of the work (unchanged). The read-only opens used later to make isolated copies leave an empty `-wal`
(0 bytes) and the `-shm` WAL index next to it; they hold no data.

## 6. Legacy compatibility boundary

With `RAKSA_LEGACY=on` the pre-PRD features behave as before, except: legacy event join/host/projector moved to
`/acara/join|host|layar` (4-char codes at `/join` and `/projector` are forwarded), "Latihan misi" is labelled
"Mini Games", the story hub no longer shows "Cara main lain", and the legacy play screen has "Kembali" with a
confirmation. Legacy scoring (1000+300) and legacy auto-advance rules are unchanged on purpose (D-26). Legacy pages
still assume root hosting (no base path).

## 7. Review findings and resolutions

Two sources: (a) defects found by the browser acceptance runs, (b) a distinct, read-only review by a separate agent
over `shared/story`, `server/src/story`, the story/CMS/admin client (no answer-key leak, no missing capability check and
no four-eyes bypass were found). Every finding below was verified in the code before fixing.

| # | Sev. | Finding | Resolution | Verified by |
| --- | --- | --- | --- | --- |
| A1 | high | Pixel stage blank in the story room/CMS preview (its CSS lived in the solo page stylesheet) | stage CSS moved to `cerita/ui/panggung/panggung.css`, imported by `Panggung.tsx`; page-layout overrides scoped `.cer-main` | E2E screenshots; legacy solo stage identical to baseline |
| A2 | med | Join/resume/info limits counted every attempt per IP → an office NAT locks itself out | limiter counts only FAILED lookups (+ flood cap) | `domain.test` limiter test; integration |
| A3 | med | Successful staff logins counted → new tabs could lock a host out | only failed logins counted (per IP+user, per IP) | integration "review fixes" (12 successful logins, then 429 after 10 failures) |
| A5 | med | Real timers fired the deadline 1 ms early (one round closed at 29 999 ms), so an answer arriving exactly at the inclusive deadline could be refused | the round closes only once the clock is past the deadline (early timer re-armed) | `room.test` early-timer test; final E2E deadline check |
| A4 | low | Mood indicator inflated by the global `.isi` class; answer options below the fold on phones | data attribute; answering view puts timer/question/options first, conversation collapsible, compact stage | E2E viewports |
| A6 | low | Projector stage chip read "Bu Rina ·" (dangling separator): the shared screen has no mood word because moods are private | `Panggung` shows the name alone when no mood is given (visible text and screen-reader text) | targeted browser check on the final build (label = "Bu Rina", `evidence/e2e/proyektor-label-nama-desktop.png`) |
| R1 | high | Rate limits blind behind a reverse proxy; restart reconnect storm burns the NAT budget | `TRUST_PROXY_HOPS` (Express `trust proxy` + same hop logic for sockets, `auth/clientIp.ts`); codes that once existed answer `closed` without counting; client stops auto-resume after a room is gone | `hosting.test` (clientIp); integration (closed codes, 410) |
| R2 | med | Late host "next" acted on the NEW phase (skipped the next round's reading time) | console sends the phase/round it showed; mismatch → `wrong_phase` | `room.test` stale-click test; integration |
| R3 | med | Staff socket identity cached at handshake (deactivation/password change/logout ignored) | every host event re-authenticates the token | integration (deactivated host → `unauthorized`) |
| R4 | med | Synchronous scrypt on login could stall live rooms | async `crypto.scrypt` (libuv pool) + max 8 concurrent logins | integration logins; code review |
| R5 | med | 1 MB display names stalled the event loop | raw length checked before normalization; Socket.IO `maxHttpBufferSize` 64 KB; rename throttled | `domain.test` oversized name |
| R6 | med | `/api/story/rooms/:code/assets` was an unlimited code-guessing oracle | same limiter as `/info`; also only assets of rounds already reached (no early evidence titles) | integration (429 after guesses; lobby withholds later media) |
| R7 | med | Results/CSV silently capped at 5 000 rows | CSV exports every row; table view shows 2 000 with total + notice | integration (`total`, `truncated`) |
| R8 | low | Legacy gate case-sensitive (`/api/Matches` passed) | regex `/i` | integration (3 mixed-case URLs → 404) |
| R9 | low | Auto-advance off left a stale countdown | phase deadline cleared | `room.test` |
| R10 | low | Re-joining on the same socket left a "ghost" connected participant | previous participant unbound (channels left, marked disconnected) | code review; E2E rejoin flows |
| R11 | low | Paused rooms never expired; lobby expiry recorded as the host's close | `expired` close reason (system actor) for idle lobbies (6 h) and rooms paused on the host (2 h); competition admin can close any live room (`admin_closed`) | integration (expiry + admin close) |
| R12 | low | Dashboard counted running rooms in denominators; recovered rooms' end time = boot time | running rooms reported separately; end time = last settled round | integration; `restart/` evidence |
| U1 | low | Anonymization could be attested by the submitter/last editor | same four-eyes rule as publication | code review |
| U2 | low | Periods accepted `null` → 1970 | only numeric timestamps | integration (400) |
| U3 | low | Expired staff sessions never purged | hourly purge | code review |
| U4 | info | A system admin can grant itself roles and create accounts (could defeat four-eyes with a second account) | accepted: admin trust boundary, every change audited (documented) | — |

## 8. Final verification (final build, 30 Oct 2026) — historic

Historic: these are the results of the 30 Oct 2026 build of the PRD v0.2 delivery, before the gameplay change set
(§11) and its fix rounds (§12); the test counts below are not the current ones. The latest measured results are in
§12.5.

All runs on isolated DB copies and local ports; the real `data/raksa-game.db` kept SHA-256 `563B8019…` throughout.

| Check | How | Result | Evidence |
| --- | --- | --- | --- |
| Typecheck | `npm run typecheck` | clean (server + client incl. `shared/`) | `evidence/checks/typecheck*.log` |
| Unit + integration | `npm test` | server 125/125, client 518/518 (30 Oct; historic) | `evidence/checks/npm-test*.log` |
| Build | `npm run build` | OK; the only warning is the pre-existing legacy Phaser chunk (1 685 kB, same as baseline, loaded only by legacy pages) | `evidence/checks/build*.log` |
| Answer keys in the bundle | `node tools/uji-bundel-kunci.mjs` | 68 files, 0 of 408 scenario sentences, no demo seed code | `evidence/checks/bundle-scan.log` |
| Browser acceptance | `tools/uji-room-cerita.mjs landing main cms admin peran aset` | 168/168 (12 min run). Two concurrent rooms, one per demo scenario, 7 participants (room A: best path, poor path, mixed with 5 timeouts, disconnect + resume after 3 missed rounds; room B: host-paced), 5th participant refused when full; in room A all-answered rounds closed ≤ 1 ms after the last answer (8 rounds) and deadline rounds at 30 002–30 015 ms (7 rounds), session 10.9 min; CMS blank → validation → preview → review → publish → play → revise → v2 → archive with the running room pinned to v1; admin dashboard reconciled with the recap; 11 REST role denials (403), no session (401), 1 socket and 3 UI denials; images blocked → text fallback | `evidence/e2e/` |
| Keyboard only | `tools/uji-keyboard-room.mjs` | 8/8 (join, consent, radio-group arrows, visible focus, lock with Enter) | `evidence/keyboard/` |
| Restart recovery | server stopped during a running room, started again | room `interrupted` / `server_restart`, end time = last settled round; the 11 stored result rows and totals identical before/after (the dashboard now counts the recovered room as interrupted) | `evidence/restart/` |
| Hosting harness | `tools/uji-hosting-harness.mjs`, `TRUST_PROXY_HOPS=1` | 10/10 (prefixed assets/API/WebSocket, iframe join + one round, foreign origin refused) | `evidence/hosting/` |
| Bounded load | `npm -w @raksa/server run story:loadtest` | 1×100, 5×40, 10×30: 0 errors, answer ack p95 ≤ 4 ms, answering-phase skew ≤ 6 ms (same machine, loopback) | `evidence/load/` |
| Legacy regression | `RAKSA_LEGACY=on`, `tools/uji-temuan-review.mjs` A–F | 122/122; solo stage identical to baseline | `evidence/legacy/` |

The 168/168 run happened before fix A6 (presentational only); A6 and the keyboard check were verified on the final
client build afterwards.

## 9. Not verified / external

Real phones, real raksaonline.com integration, production capacity, SSO, committee/Legal/Product approvals, official
content, retention policy, brand assets — see DECISIONS.md and CONTENT-HANDOFF.md.

## 10. Suggested review order

1. `shared/story/` (protocol, content model, validation, score policy, roles, names) — the contracts everything else uses.
2. `server/src/story/runtime/room.ts` with `room.test.ts` — phases, the all-answered/deadline race, eligibility,
   reconnect, persistence guard.
3. `server/src/story/socket.ts` and `http.ts` — capability checks, room ownership, rate limits, payload shaping.
4. `server/src/story/content/` and `reports.ts` — four-eyes publication, versions, CSV, dashboard definitions.
5. Client: `pages/story/StoryRoom.tsx` (participant), `StoryHost.tsx`, `StoryProjector.tsx`, then `pages/cms`, `pages/admin`.
6. `client/src/App.tsx` + `server/src/index.ts` — legacy gating (routes not registered, APIs refused) and hosting headers.

## 11. Change set: activity-based rounds (gameplay adaptation, 30–31 Oct 2026)

Why: the first real Auto scenario played like a five-option text quiz (an illustration competing with the chat, heavy
reading, the recommended option guessable by its length). Content can now choose one activity per round and move
shared facts out of the options. Decisions: D-28–D-35. Schema and audit: SCHEMA-AND-SCORING.md. Components, data flow
and test hooks: ARCHITECTURE.md §10. Authoring: CMS-GUIDE.md §4. The adapted real scenario, its option mapping, its
review and every screenshot of it stay in the private case folder outside the repo; repo tests use synthetic content.

### 11.1 What changed

- **Content schema v2** (`shared/story/content.ts`, `validate.ts`): layouts `chat` / `dossier` / `field` / `stage`,
  round `evidence` and `respondent`, choice `form`; text keys for the action label, lesson, replies, evidence and flag
  labels; new errors and warnings; v1 upgraded on load. Option audit in `shared/story/audit.ts`.
- **Payloads** (`protocol.ts`, `scene.ts`, `summary.ts`, `runtime/room.ts`): public evidence, action label and
  respondent, the lesson only after close, the scene clock (`sceneStartedAt`, `readingMs`); private reminders,
  conditional lines kept through the consequence, reply + lesson + labelled delayed effects in the consequence, causal
  flag notes (`flagSet`) and stored names/status words (`labels`) in the summary; the accepted answer carries its
  handle; another option after acceptance is refused (`answered`); public line positions renumbered; evidence pictures
  join the reached-asset list; evidence is not counted in the reading time.
- **Participant room**: `client/src/story/round/*` replaces the scene/answer panels ("Baca lagi", A–E radios,
  "Kunci jawaban") and the separate consequence page; final summary with causal notes (`story/ui/FinalSummary.tsx`);
  chat and stage lines arrive faster (0.6–1.5 s each, at once with reduced motion); desk and field briefs show whole.
  The fix rounds reworked the tray, the outcome and the leaderboard (§12.1).
- **Projector** (`StoryProjector.tsx`, `story/projector.css`): the same activity in mode `projector` (no private data),
  laid out by the fix rounds as a rail beside the activity and one focus panel (§12.1). **Host console**: the
  round's activity, evidence count and confirm label.
- **CMS**: activity picker, evidence editor with a field spot map, respondent, replies, lesson, action label, option
  form, flag name, "Audit pilihan" per round and per scenario; the preview renders the room's round components.
- kamus `ruang`: new id + en strings (zh stays empty, D-13). `.gitignore`: `dist-uji/` (D-35).

### 11.2 Invariants to check (where they are enforced)

| Invariant | Where |
| --- | --- |
| Evidence, action label and respondent are identical for every participant and the projector; an option carries only its text, handle and form; no key, weight or outcome in any participant or projector payload | `scene.ts scenePublicOf`, `room.ts privateState()`; room.test "gameplay scene", "options carry each choice form"; integration "gameplay over sockets" |
| The lesson is public only in `LESSON_PHASES`, never while reading or answering | `scenePublicOf(…, phase)`; domain + room tests |
| Replies, labelled delayed effects, reminders and conditional lines reach only the participant concerned, never projector or host | `privateState()`, `scene.delayedNotesOf`, `summary.consequenceViewOf`; room.test "gameplay consequences"; integration |
| A shared payload never reveals that hidden lines exist | `scene.ts` line positions and neutral ids; domain test "public lines are p0..p(n−1) at positions 0..n−1" |
| One final answer: same-option retry = original ACK, other option = `answered`, score counted once | `room.ts answer()`; room.test "one final answer" |
| Opening evidence never reaches the server and never resets the selection or the timer | `RoundSurface` local state (no socket event exists); the tray keeps its state under the sheet |
| Reading time ignores evidence and conditional lines; the answer window stays 30 s | `room.ts defaultReadingMs`; room.test "reading time" |
| The activity comes from content only (no round-number or title branches) | `RoundSurface`; round.test "RoundSurface" |
| Later rounds' pictures and titles never leak through the asset list | `room.reachedAssetIds()`, `http.ts` room assets; room.test "room assets" |
| v1 content upgrades on load and scores as before; summaries stored without the new fields read with neutral defaults and their version's labels | `sanitizeScenarioContent`, `withSummaryDefaults`, `sqliteStore` version labels; domain test "schema v2"; integration "result reopened" |
| Authoring warnings never block publication | `validateScenario` severity `warning`; domain test "authoring guidance" |

### 11.3 Changed test contracts (and why)

| Test | Change | Reason |
| --- | --- | --- |
| `server/src/story/room.test.ts` "one final answer …" (was "duplicate submissions …") | another option after an accepted answer is refused with `answered` (before: the original acknowledgement); a retry of the same option still gets it | the decision is final and shown as sent (D-28); a silent ACK let a device believe it had changed its answer |
| `room.test.ts` delayed consequence; reading time | the conditional line is also present in the consequence; evidence is not counted | D-33; D-29 (no hidden extra time) |
| `domain.test.ts` scene positions; `story.integration.test.ts` round 4 | `StorySceneLine.pos`: public lines 0..n−1 among themselves, a conditional line fractional (e.g. −0.5); before: authored indices | a shared payload must not reveal that hidden lines exist (D-33) |
| `client/src/story/sceneLines.test.ts` | `revealStepMs` = 30 % of the reading time per line, 0.6–1.5 s, 1.2 s without a duration (was 70 %, 0.9–3.5 s, 1.5 s); `chatTitleOf` → `roundModel.chatContactOf` | no slow typing (gameplay brief §3A); the contact is the respondent first, never an invented person |
| `client/src/story/ui/conversation.test.tsx` | `Conversation` is the stage dialogue list only (no `layout` / `chatTitle`); bubbles and header are `ChatLine` / `ChatHeader`, used by the chat activity; a chat without a named contact shows the round title with a chat icon instead of "Chat" | the thread is the chat activity itself (ARCHITECTURE §10) |
| `client/src/story/view.test.ts` | `moodShiftOf` removed | the status change is shown once (status chip, outcome) |
| `tools/uji-room-cerita.mjs`, `tools/uji-keyboard-room.mjs` | select by the `data-*` hooks instead of `.sr-adegan`, `.sr-jawab`, `.sr-opsi` radios, `.sr-terkunci`, `.sr-kunci`, `.sr-konsekuensi`, `.sr-timer`; the confirm button carries the activity's label instead of "Kunci jawaban"; the round number is read from the header kicker | intended UI change: one round screen per activity |
| `tools/uji-skenario.mjs` | reads the round screen only through the `data-*` hooks (plus the existing lobby, leaderboard, final-summary and host-console classes; the leaderboard since the fix rounds through hooks too, §12.3) and derives every expectation from the published version and `shared/story` at run time; refuses `RAKSA_SHOTS` inside the repo | intended UI change; the real scenario's evidence stays outside the repo |
| `tools/uji-room-cerita.mjs`, `uji-keyboard-room.mjs`, `uji-hosting-harness.mjs`, `uji-skenario.mjs` (tool hygiene, 31 Oct) | arguments and environment are checked before anything runs (exit 2): `UI_BASE`/`HARNESS` and `RAKSA_KREDENSIAL` required (the file is never echoed), loopback only, port 4100 refused (`RAKSA_PORT_TERLARANG`), unknown phases refused; `uji-room-cerita` also refuses the real `data/raksa-game.db` as `RAKSA_DB` (unopened) and an evidence folder inside the repo while the test DB holds a real case. A phase that throws is recorded as failed and still closes its sockets, browser contexts and bots, so the run ends; `uji-room-cerita` also fails when a phase × viewport snapshot, the reconnect step, the host-disconnect step or the admin DEMO filter never happened. The keyboard and hosting runs play the first published DEMO scenario, close their room after a failure and always write `hasil.json`; the hosting run creates a room only behind a server configured for the harness | a failed phase left a socket open and the process running; a hook that no longer matched silently skipped 24 checks instead of failing them |

Other existing assertions were only extended (new fields asserted, e.g. demo rounds default to `evidence: []`,
`respondent: null`, schema version 2).

### 11.4 How to verify

```bash
npm run typecheck
npm test     # incl. client/src/story/round/*.test.*; server tests use the SYNTHETIC gameplay fixture
             # (server/src/story/testing/fixtures.ts buildGameplayScenario: chat, dossier and field rounds, a flag)

# test build in its own output folders: never rebuild client/dist or server/dist while a server runs from them (D-35)
(cd client && VITE_OUT_DIR=dist-uji npx vite build)
npx tsc -p server/tsconfig.json --outDir server/dist-uji

# isolated DB copy + test identities as in §3, then serve the test build from it
(cd server && PORT=4210 DB_FILE=<tmp>/raksa-game.db CLIENT_DIST=client/dist-uji node dist-uji/server/src/index.js)
UI_BASE=http://127.0.0.1:4210 RAKSA_KREDENSIAL=<tmp>/dev-staff-credentials.json RAKSA_DB=<tmp>/raksa-game.db \
  node tools/uji-room-cerita.mjs landing main cms admin peran aset
UI_BASE=http://127.0.0.1:4210 RAKSA_KREDENSIAL=<tmp>/dev-staff-credentials.json node tools/uji-keyboard-room.mjs
```

The demo scenarios use the `stage` activity. Chat, dossier and field rounds are covered by the synthetic fixture in the
automated tests and in the browser by authoring synthetic rounds in the CMS on the DB copy (the `cms` phase above
authors and plays a desk-of-documents round). By hand, at 360×740, 390×844, 844×390 and 1440×900: the five options and
the confirm button are reachable above the sticky bar; an evidence sheet opens and closes by keyboard and returns
focus without touching the selection or the timer; after the ACK a reload keeps the sent state and another option is
refused; the outcome shows the reply, the lesson and the status change once; the projector shows no options, moods,
reminders or replies; only the flag holder sees the reminder and the summary's causal note.

### 11.5 Not verified / open

Human usability tests (time to understand the task, mis-taps, scrolling, reasons for choices), real phones, a
screen-reader session, and any approval: the thresholds and the ≤ 5/15 bound of D-34, the activity per real round, the
fairness of the adapted evidence and every Komite item of the adapted scenario remain open (DECISIONS D-28–D-47,
CONTENT-HANDOFF.md).

Suggested review order: `shared/story/content.ts`, `validate.ts`, `audit.ts` → `scene.ts`, `summary.ts`, `protocol.ts`
→ `server/src/story/runtime/room.ts` (`answer()`, `privateState()`, `reachedAssetIds()`) → `client/src/story/round/`
(`roundModel.ts` first, then `RoundSurface`, `DecisionTray`, `EvidenceSheet`, `OutcomeBlock`) → `pages/story/*` →
`pages/cms/editor/*` (`ActivityFields`, `EvidenceEditor`, `SpotMap`, `OptionAudit`, `FlagField`).

## 12. Fix rounds after the change set (31 Oct and 1 Nov 2026)

Two rounds of fixes to the activity-based rounds. Decisions: D-36–D-47 (and the notes added to D-20, D-25, D-28–D-31,
D-33, D-34). Payloads, components, hooks and the CMS editor: ARCHITECTURE.md §4, §10, §11. Schema: SCHEMA-AND-SCORING.md.
Authoring: CMS-GUIDE.md. Generic platform behaviour only; the anonymised real-case scenario used for the browser run,
its screenshots and its `hasil.json` stay outside the repo.

### 12.1 What changed

- **Server and shared rules**: on every phase or round change the public snapshot is emitted before the private ones
  (`socket.ts` `phaseChanged`); public round lines are named `p<pos>`, a participant's own conditional lines `f<k>`
  (`scene.ts`); `StoryConsequenceView.chosenForm`, also per decision of the final summary (this closes the gap noted
  earlier for §11, where an own chat action showed as a sent bubble after close); the evidence `kicker` text key;
  `SPOT_SAFE_RANGE` + `drawnSpotCoordinate` (`content.ts`); validation `field_builtin_background` and
  `evidence_asset_builtin` (errors), `choice_form_hint` (warning), `chat_no_contact` counting only an unconditional
  customer/cast line or a customer/cast respondent; `ENDING_KIND_LABEL` (`protocol.ts`).
- **Participant round** (`client/src/story/round/`): a private snapshot that has not caught up shows loading
  ("Pilihan segera dibuka…", "Memuat hasilmu…"); option cards without a form mark; the confirm label follows the
  selected option; the "n more below" cue inside the bar; a chat action as "Kamu: …" with "✓ Ditetapkan" before and
  after close; delayed effects before the badge and the status line; each round starts at its top; the header's task
  line only while reading; the round and its outcome stay through the leaderboard with the docked line (`data-langkah`)
  and the ranking card (`data-peringkat`: top three + own row), the own rank announced and the outcome moved clear of
  the line; the holder's one-line reminder wraps; smaller field pins within the safe range; on short landscape screens
  tighter option cards, and the pins with their hint hidden while answering; the picture sheet twice as wide in a
  sideways-panning frame on narrow screens.
- **Projector**: a rail on the right (title, task while played, the reading countdown from `sceneStartedAt +
  readingMs`, one big timer, the answered count) beside the activity's three newest public lines and one focus panel
  (the shared evidence one item at a time, the reading time shared out in 6–10 s turns; the lesson after close).
- **CMS**: uploaded pictures only for field scenes and evidence (pickers + validation); the evidence kicker field; the
  spot frame 6–94 %; the unsaved-change guard (`LeaveGuard.tsx`: links, controls outside the editor, back/forward via
  `client/src/historyHold.ts`, tab close; it waits for a save on its way); saves one at a time; the sign-in over the
  editor when the session ends (`StaffShell` `resumable`, `staff.ts` `ended`); round and cast removal clean up what
  depended on them; keyboard focus stays in the list after a move or removal (`pages/cms/editor/focus.ts`); preview
  parity (no task line); the help text of "Tindakan, bukan pesan"; the ending labels in the CMS and the admin results
  table (`pages/admin/Reports.tsx`; the CSV keeps the stored kind).

### 12.2 Invariants to check (where they are enforced)

| Invariant | Where |
| --- | --- |
| On every phase or round change a device receives the public snapshot before its private one | `socket.ts` `phaseChanged`; room.test "every phase change reaches the transport as ONE phaseChanged event"; integration "phase changes reach every device public first"; `uji-skenario` frame order |
| While snapshots catch up a participant sees loading, never a state of another phase or round | `roundModel.privateOfRound`, `trayStateOf` ('loading'), `RoundScreen`; roundModel.test; `uji-skenario` DOM recorder (no mixed state, short loading, never "tidak terdaftar") |
| Room payloads never carry the authored id of a round line | `scene.ts` (`p<pos>`, `f<k>`); domain test "public lines are p0..p(n−1)"; room.test |
| The option form changes only the chat confirm label and how the own turn reads, never key, score or mood | `roundModel.confirmLabelOf`, `DecisionTray`, `OutcomeBlock`; round.test, roundModel.test |
| A field scene or an evidence picture is never a built-in background | `validate.ts`; domain test, integration, contentEdit.test (validation and pickers) |
| Markers are drawn where the CMS placed them, within 6–94 % | `content.ts` `drawnSpotCoordinate`, `roundModel.fieldMarkersOf`, `contentEdit.spotAt`; contentEdit.test "field spots" |
| Timers unchanged: consequence 10 s (host may continue after 4 s), leaderboard 7 s or host-paced | `runtime/room.ts` default timing |

### 12.3 Changed test contracts (and why)

| Test | Change | Reason |
| --- | --- | --- |
| `client/src/story/round/round.test.tsx` | option cards carry no form mark (before: the "Tindakan" mark); in a chat the confirm label follows the chosen option; a chat action is a note "Kamu: …" with "Ditetapkan" in the sent state and in the outcome; delayed effects come before the badge | D-39, D-41 |
| `client/src/story/round/roundModel.test.ts` | `trayStateOf` answers 'loading' while the answers are open without options (before: a not-registered state); new `confirmLabelOf`, `privateOfRound`, `clearOfBarDelta` | D-20, D-36, D-39 |
| `server/src/story/domain.test.ts`, `room.test.ts`, `story.integration.test.ts` | public round lines `p<pos>` and own conditional lines `f<k>` instead of authored ids; `chosenForm` in the consequence and the summary; built-in pictures rejected; the evidence kicker | D-39, D-42, D-44 |
| `tools/uji-skenario.mjs` | the leaderboard is read on the round screen through `data-peringkat` (top three + own row) and `data-langkah` (own rank, next step) instead of a separate leaderboard screen; new checks: each round starts at its top, the docked line is on screen with the own rank, the outcome is not covered by it, a chat action reads "Ditetapkan" (never "Terkirim"), public before private (frame order), no mixed state or long loading, no form mark on the cards, the confirm label per selection, field pins (44 px tap area, hidden on short landscape), "Perbesar gambar", the projector's rail, focus panel and reading countdown | D-36–D-39, D-43; intended UI change |

### 12.4 How to verify

```bash
npm run typecheck
npm test
# test build, isolated DB copy and test identities as in §11.4, with a published scenario on that copy; server settings
# in the header of tools/uji-skenario.mjs (STORY_MAX_PARTICIPANTS >= 6; never port 4100 or data/raksa-game.db)
UI_BASE=http://127.0.0.1:4210 RAKSA_KREDENSIAL=<copy>/dev-staff-credentials.json SKENARIO="<start of the title>" \
  RAKSA_SHOTS=<folder outside the repo> node tools/uji-skenario.mjs
```

The tool reads the round screen only through the hooks of ARCHITECTURE §10: `data-fase`, `data-aktivitas`,
`data-pilihan` (+ `aria-checked`), `data-kirim`, `data-terkirim`, `data-berkas`, `data-lembar` (+ `data-lembar-gambar`),
`data-hasil`, `data-pengingat`, `data-timer`, `data-suasana`, `data-peringkat` and `data-langkah`. Checks that depend
on content (chat actions, flags, field rounds) run only where the played scenario has them; the demo scenarios use the
stage activity and message options only.

Not covered by an automated browser run, so check by hand on a DB copy: with unsaved edits in a draft, try a link,
"Keluar", the browser's back button and closing the tab (each asks first); press "Simpan draf" and leave while it saves
(it continues once nothing is unsaved); end the session under the editor (e.g. a system admin resets the account's
password, which revokes its sessions), then save: the sign-in appears over the editor, the same account keeps the
work, another account restarts the CMS; after moving or removing a list item, keyboard focus stays in the list.

### 12.5 Latest results (measured 1 Nov 2026)

| Check | Result |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm test` | server 192/192, client 612/612 |
| `tools/uji-skenario.mjs` on a DB copy holding the anonymised real-case scenario (screenshots and `hasil.json` outside the repo) | 3483/3483 |

The other checks of §8 (build, bundle scan, `uji-room-cerita.mjs`, keyboard, hosting harness, load, restart, legacy
regression) have no result newer than the 30 Oct build recorded here or in `evidence/`. Human usability tests, real
phones and a screen-reader session remain open (§11.5).

Suggested review order: `server/src/story/socket.ts` (`phaseChanged`) → `shared/story/scene.ts`, `summary.ts`,
`validate.ts`, `content.ts` → `client/src/story/round/roundModel.ts`, `RoundScreen.tsx`, `DecisionTray.tsx`,
`OutcomeBlock.tsx`, `activityParts.tsx` → `pages/story/StoryProjector.tsx` → `client/src/historyHold.ts`,
`pages/cms/LeaveGuard.tsx`, `ScenarioEditor.tsx`, `story/ui/StaffShell.tsx`.
