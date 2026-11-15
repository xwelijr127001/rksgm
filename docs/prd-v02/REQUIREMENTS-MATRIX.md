# Combined requirement ledger — PRD v0.2 + staff review

Sources: PRD "Game Raksa" v0.2 Draft, 24 Sep 2026 (18 pp.) and the staff review (3 pp., items 1–8, 10–19; there is no
item 9; the round/timer observation is split across 13–14). Baseline = `evidence/baseline/` (main @ ff38b52, before
this work). Status legend: **Implemented + verified locally** · **Partial** · **Awaiting external decision** ·
**Outside MVP (documented)** · **Conflict (documented)**. "Verified locally" means automated tests and/or browser
emulation on one machine — not production, not real phones, not stakeholder acceptance.

Test references: `S:` server tests (`npm run test:server`), `C:` client tests (`npm run test:client`),
`E2E:` `tools/uji-room-cerita.mjs` (results `evidence/e2e/hasil.json`), `H:` `tools/uji-hosting-harness.mjs`
(`evidence/hosting/`), `L:` load test (`evidence/load/`), `K:` `tools/uji-keyboard-room.mjs` (`evidence/keyboard/`),
`R:` server restart during a running room (`evidence/restart/`), `LG:` legacy regression with `RAKSA_LEGACY=on`
(`evidence/legacy/`). Final numbers of the 30 Oct delivery: REVIEW-HANDOFF.md §8 (historic); latest results: §12.5.
Where the later gameplay change set (activity-based rounds, D-28–D-35) and its fix rounds (D-36–D-47) touch these
requirements: section "Gameplay change set" after the non-functional table.

## A. Content & scenarios (PRD p. 6–7)

| ID | Requirement (short) | Baseline | Status | Implementation | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-A1 | Category master with active status; Auto active, HVC/Property inactive | no categories; `/cms` → `/` | Implemented + verified | `story_categories` seed; `/cms/kategori` (system admin toggles) | S: integration (setup, roles); E2E landing/CMS |
| FR-A2 | Scenario: title, category, synopsis, difficulty, 15 ordered rounds | solo episode in TS source only | Implemented + verified | `shared/story/content.ts`, CMS Info/Babak tabs | E2E cms (created from blank via UI) |
| FR-A3 | Round: scene text, background, characters, customer state at round start | — | Implemented + verified | round lines/background/officer flag/media; per-band mood variant lines; carried mood (initial only round 1) | S: room.test (carried mood); E2E main |
| FR-A4 | Up to five choices with text, accuracy weight, mood change, consequence, reason | — | Implemented (**exactly 5**, D-04) | validator `shared/story/validate.ts` | S: domain.test; E2E cms |
| FR-A5 | Choices marked tepat/kurang tepat/keliru by joint committee, reason shown in final summary | — | Implemented; **committee approval awaiting** (C-2) | classification + reason fields; summary shows reasons/recommended | S: integration (summary); E2E main (15 decisions) |
| FR-A6 | Preview without room, without affecting results | — | Implemented + verified | CMS Pratinjau uses `shared/story/engine` + `summary` client-side | E2E cms ("pratinjau tidak membuat room/hasil") |
| FR-A7 | Status draft/review/published/archived, history, publisher | — | Implemented + verified | `server/src/story/content/scenarios.ts`, events + audit; WorkflowTab | S: integration (CMS workflow, versions); E2E cms |
| FR-A8 | Reject publication if rounds ≠ 15, round without choices, choice without consequence (message names the round) | — | Implemented + verified | `validateScenario` (round-specific Indonesian messages) | S: integration ("blank scenario fails"); E2E cms |
| FR-A9 | Authors pick backgrounds/characters/expressions from admin-managed library | — | Implemented + verified | asset pickers in editor; `/cms/aset` | E2E cms (upload + use in round 3) |
| FR-A10 | Player text separate from logic, translatable without duplicating scenarios | — | Implemented + verified | `text[locale][key]` + `textKey`; en locale switch | C: contentEdit.test (texts removed per locale); S: domain.test |

## B. Rooms & multiplayer sessions (PRD p. 7)

| ID | Requirement | Baseline | Status | Implementation | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-B1 | Host creates room from a scenario, gets a shareable code | legacy quiz rooms (PIN) | Implemented + verified | `/host` (staff role host), `host:create`, 6-char code, QR | S: integration; E2E main |
| FR-B2 | Join on raksaonline.com with code + name, no account | legacy join with avatar | Implemented + verified (embedding: local harness only) | `/join` (code → name + notice), room credential | E2E main; H: iframe join |
| FR-B3 | Lobby: host and participants see names + count | legacy lobby | Implemented + verified | lobby (count), projector names, host table | E2E main (projector lobby names) |
| FR-B4 | Reject empty / exact duplicate names; filter inappropriate words | not validated (staff #19) | Implemented + verified | `shared/story/names.ts`, same rules on rename | S: domain + integration; E2E main (empty/duplicate/inappropriate) |
| FR-B5 | Host starts, continues, skips non-answerers after timer, closes | host controls (legacy) | Implemented + verified (D-11) | `host:start/next/auto/remove/close` | S: room.test; E2E main (room B host-paced) |
| FR-B6 | Same round for all; next opens when timer ends or all answered | legacy waits for timer (staff #17) | Implemented + verified | `closeAnswering('all_answered' / 'deadline')` | S: room.test (1 and N participants); E2E DB timing check (≤ 1 ms after the last answer; deadline 30 002–30 015 ms) |
| FR-B7 | Separate host screen: scene, countdown, answered count, rankings | legacy projector | Implemented + verified | `/projector?room=` | E2E main (projector shots) |
| FR-B8 | Rejoin same room, continue current round, zero for missed rounds | legacy reconnect tokens | Implemented + verified | room-scoped credential, `participant:resume` | S: integration (Dodi); E2E main (Dodi) |
| FR-B9 | Capacity limit with clear rejection | legacy cap | Implemented + verified (limit value = local default, D-18) | `STORY_MAX_PARTICIPANTS` | S: integration; E2E main (5th participant) |
| FR-B10 | Room closes after session; one session, cannot be repeated | legacy reset/tiebreak could reopen | Implemented + verified | closed phases final; no reset API | S: integration; E2E main (late join, `host:start` refused) |

## C. Game engine (PRD p. 8)

| ID | Requirement | Baseline | Status | Implementation | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-C1 | Staged dialogue, illustration, customer status indicator | solo VN only | Implemented + verified | pixel stage reuse, line reveal on server clock, mood label + 5-step indicator | E2E main screenshots |
| FR-C2 | Visible 30 s countdown, synchronized | legacy 39 s missions (staff #13–14) | Implemented + verified | server deadline; `AnswerTimer` | S: room.test; E2E main (timer label) ; L: phase skew |
| FR-C3 | Timeout → author's default consequence + zero | — | Implemented + verified | `resolveDecision(null)` | S: domain/room; E2E (Citra 5 timeouts) |
| FR-C4 | Own consequence + own customer state before room moves on | — | Implemented + verified | private payload after close | S: integration (isolation); E2E payload checks |
| FR-C5 | Ending by customer state AND total score, ≥2 endings | — | Implemented + verified | `selectEnding`; validator requires happy + with_notes + fallback | S: demo.test; E2E (best = happy, poor ≠ happy) |
| FR-C6 | Final summary: decisions, recommended, reasons, score | — | Implemented + verified | `buildSummary`; progressive disclosure | E2E (15 decisions per participant) |
| FR-C7 | Time, scoring, round order computed on server | legacy server-side | Implemented + verified | `StoryRoom` | S: integration (forged handle/round/late); E2E payloads |
| FR-C8 | Five options shuffled per participant | legacy shuffle | Implemented + verified | HMAC handles + deterministic per-participant order | S: room.test |

## D. Scoring & ranking (PRD p. 8)

| ID | Requirement | Baseline | Status | Implementation | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-D1 | Round score = accuracy 70% + speed 30%; session = sum | 1000 + 300 (staff #16) | Implemented; **policy provisional** (D-07, C-5) | `shared/story/scorePolicy.ts` | S: domain.test fixtures; UI "Cara nilai dihitung" |
| FR-D2 | Rankings between rounds and at the end, cumulative | legacy leaderboard (staff #7) | Implemented + verified | `rankParticipants`, leaderboard phase, own rank | S: domain/integration; E2E |
| FR-D3 | Cross-room recap per period: names, scenario, score, session time | per-room CSV only | Implemented + verified | `/admin/rekap`, `/api/admin/results` | S: integration (reports); E2E admin |
| FR-D4 | Admin sets competition start/end; outside = archive | — | Implemented + verified | `/admin/periode`, overlap rejected, "di luar periode" filter | S: integration; E2E admin |
| FR-D5 | Export results for winner/prize administration | per-room CSV | Implemented + verified (winner rule open) | CSV with BOM + formula-injection guard | S: integration; E2E admin |
| FR-D6 | Mark which scenario each room played when several are used | — | Implemented + verified | scenario + version on every row/report | E2E admin |

## E. Administration, reports & assets (PRD p. 9)

| ID | Requirement | Baseline | Status | Implementation | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-E1 | Dashboard: rooms, participants, completion rate, average score per period | `/admin` → `/` (staff #18) | Implemented + verified | `/admin/dasbor` with definitions/denominators | S: integration; E2E admin (reconciled) |
| FR-E2 | Most-often wrong / timed-out decisions | — | Implemented + verified | `/admin/analitik` (top lists + per round, "membingungkan" > 75% keliru) | S: integration; E2E admin |
| FR-E3 | Separate host / author / reviewer / competition / system roles | shared panitia PIN | Implemented + verified (SSO open) | `shared/story/roles.ts`, `requireCap`, socket checks | S: integration (role matrix); E2E peran |
| FR-E4 | Admin uploads/organizes illustrations, characters, BGM, video, photos with rights info | custom question images only | Implemented + verified | `/cms/aset`, signature/size checks, metadata required | E2E cms (upload) |
| FR-E5 | Brand colors, typography, logo, tone | v5.1 brand tokens | Partial — **awaiting brand guide/logo** (C-8) | existing tokens reused | screenshots |
| FR-E6 | Settled cases anonymized before publication | — | Implemented (check + evidence); **approver open** (C-4) | anonymization record required for settled_case; identifier warnings | S: integration |
| FR-E7 | Notice before joining that the name appears on the leaderboard / winner announcements | only "Begini kamu tampil" (staff #19) | Implemented + verified | explicit notice + required consent (client + server) | S: integration (`acceptNotice`); E2E main |

## F. Backlog (PRD p. 9) — outside MVP

| ID | Item | Status |
| --- | --- | --- |
| FR-F1 | HVC & Property categories | Outside MVP (inactive categories exist) |
| FR-F2 | Solo mode | Outside MVP; the existing solo story/practice is preserved behind `RAKSA_LEGACY` (D-03, conflict with staff #3/#5) |
| FR-F3 | Mandarin | Outside MVP; legacy only (D-03, D-13) |
| FR-F4 | Player accounts | Outside MVP (not built; no unique-person metrics claimed) |
| FR-F5 | Certificates/badges | Outside MVP |
| FR-F6 | Adaptive voice/music | Outside MVP (optional scenario BGM only) |

## Non-functional (PRD p. 10)

| Aspect | Status | Evidence |
| --- | --- | --- |
| Responsive phone/desktop | Verified in emulation (360×740, 390×844, 844×390, 1440×900; DPR 1/2) | E2E shots; real phones NOT tested |
| Real-time sync | Verified locally | L: answering-phase skew; E2E two concurrent rooms |
| Network resilience | Verified locally (drop + resume, host console drop, server restart → room `interrupted` with results kept) | S: integration; E2E main; R |
| Capacity | **Awaiting decision** (open #1); bounded local load test only | L |
| Performance (assets before timer) | Implemented: shared reading time + bounded readiness; text fallback | E2E aset (images blocked) |
| Scoring reliability | Server-side only; forged values rejected | S: integration; E2E payloads |
| Security (roles, audit, unguessable codes) | Implemented; failure-only rate limits per IP | S; E2E peran |
| Data protection (name only; retention per law) | Name is the only personal data; **retention open** (open #11) | DECISIONS D-23 |
| Case confidentiality | No real case data in repo/dev data; demo content synthetic | CONTENT-HANDOFF |
| Maintainability (new scenario without redeploy) | Verified (published via UI, host sees it immediately) | E2E cms |
| Independence (code/docs owned by Raksa) | Source + docs in repo; no external VN engine/service | ARCHITECTURE, REVIEW-HANDOFF |
| Accessibility (text size, contrast, touch area) | Implemented to project conventions (≥44 px targets, labels, live regions, reduced motion, keyboard-only join and answering) | E2E; K (8/8); no formal audit, no screen-reader session |

## Gameplay change set: requirement touch points (D-28–D-47)

The rows above keep their PRD v0.2 evidence. The activity-based rounds (REVIEW-HANDOFF.md §11) and their fix rounds
(§12) change how the requirements below are met; how to verify is in REVIEW-HANDOFF.md §11.4 and §12.4.
`C: round` = `client/src/story/round/round.test.tsx` + `roundModel.test.ts`. Browser runs on the real scenario stay in
the private case folder; in the repo the `cms` phase of `tools/uji-room-cerita.mjs` authors and plays a synthetic
desk-of-documents round.

| ID | What the change adds | Verification |
| --- | --- | --- |
| FR-A2 (CMS authoring) | Unsaved edits are never lost silently: a link, a control outside the editor (e.g. "Keluar"), a back/forward move or closing the tab asks first; a save on its way is waited for and saves run one at a time; when the staff session ends under the editor a sign-in appears over it and the same account keeps its work (D-45, D-46). Removing a round or a used cast member asks first and cleans up what depended on it | C: contentEdit (working copy, leave policy, history index, round and cast removal); the guard, the history hold and the sign-in dialog have no automated browser check |
| FR-A3 | Round `layout` (chat / dossier / field / stage), shared `evidence` and a `respondent`; the status chip shows the customer's state at round start (delayed effects included, a band change shown once) | S: domain (sanitize, v2 validation), room ("gameplay scene"); C: round (RoundSurface, RoundHeader) |
| FR-A4 | Still exactly five choices (D-04); each gets a display `form` and an optional `reply`; the round gets an action label, a lesson and a timeout reply; the warnings `choice_long`, `choice_length_hint`, `lesson_long`, `choice_form_hint` and the "Audit pilihan" never block publication; option cards carry no form mark, and in a chat the confirm label follows the selected option (D-39, D-40) | S: domain (validation, audit, form hint); C: contentEdit, round (no form mark, confirm label per selection), roundModel (`confirmLabelOf`) |
| FR-A9 | Evidence pictures and field scenes are uploaded pictures from the asset library (built-in backgrounds rejected: `evidence_asset_builtin`, `field_builtin_background`; the pickers offer uploads only); field rounds place their points on the round background by click, arrow keys or numbers (no precise dragging), within the 6–94 % frame the room draws (`SPOT_SAFE_RANGE`, D-42, D-43) | S: domain (evidence assets, built-in pictures); C: contentEdit (spots and safe range, pickers) |
| FR-C1 | One main activity per screen instead of a stage beside an answer panel; ONE status chip (no duplicate meters); chat and stage lines 0.6–1.5 s apart (all at once with reduced motion), desk and field briefs shown whole; the stage stays for the demos | C: round, roundModel, sceneLines; E2E main (demo stage), cms (synthetic desk round) |
| FR-C4 | The own outcome appears inside the activity and stays through the leaderboard: the own turn (a chat action as a note "Kamu: …" "✓ Ditetapkan"), the respondent's reply, consequence, lesson, the labelled delayed effects of the round's start, then the badge with the status change since then (once); reminders and conditional lines only for the flag holder (kept through the consequence); the lesson is public only after close; the public snapshot always comes first and a private one that has not caught up shows loading (D-20, D-39, D-41) | S: room ("gameplay consequences", one `phaseChanged` event per phase change), integration ("gameplay over sockets", "phase changes reach every device public first"); C: round (OutcomeBlock, private parts), roundModel (`trayStateOf`, `privateOfRound`) |
| FR-C6 | The final summary adds the respondent's reply per decision and causal notes where a flag was left and where it took effect, also with a good ending; names and status words are stored with the summary | S: domain (summary), integration ("result reopened"); C: roundModel (causalNotesOf), view |
| FR-D2 | Between rounds a participant's device keeps the round and its outcome on screen (no separate leaderboard page) with a compact ranking card (top three + own row) and a docked line: the own rank and when the next round begins, or that the host continues; after the last round's outcome, when the final result shows. Timers unchanged; the projector keeps its ranking screen (D-36) | C: roundModel (`clearOfBarDelta`, `isAfterClosePhase`); browser: `tools/uji-skenario.mjs` (`data-peringkat`, `data-langkah`: own rank, line on screen, outcome not covered), run on the anonymised real-case scenario outside the repo (REVIEW-HANDOFF §12.5) |
| NFR accessibility | Options as one radio group (arrows/Home/End, no A–E letters, no form mark); one confirm button and one timer in a sticky bar that never covers the last option (scroll margin = bar height; the "n more below" cue inside the bar); every round starts at its top; evidence sheet = native modal dialog (focus kept inside, Escape / close / backdrop, focus returns); status marks as icon + word; field markers = small pins with a 44 px tap area and an equivalent numbered list (pins hidden while answering on short landscape screens); notes for failed pictures; polite announcements (options open, own result, own rank on the leaderboard; repeated inside an open sheet); reduced motion. CMS: after moving or removing a round, line, evidence item or row, delayed effect, ending or cast member, keyboard focus stays in that list. Still no formal audit, screen-reader session or human test | C: round, roundModel (arrowTarget); K: `tools/uji-keyboard-room.mjs` (now on the test hooks); CMS focus after edits: no automated check |

Also touched: FR-A6 (the preview renders the room's round components and, like the room once the options are open,
shows no task line), FR-A10 (new text keys per locale, incl. the evidence kicker; kamus `ruang` id + en), FR-B7 (the
projector: a rail with the round's title, task and the reading countdown, one big answer timer and the answered count,
beside the activity's newest public lines and one focus panel with the shared evidence one item at a time, then the
lesson; no private data; the host console shows the activity, evidence count and confirm label), FR-C7 (one final
answer: another option after acceptance is refused as `answered`), FR-D3/FR-D5 (the admin results table words the
ending kinds as staff screens do; the CSV keeps the stored kind, D-47), FR-E3 (a staff session that ends under the CMS
signs in again over it, D-46).

## Appendix A — acceptance criteria (PRD p. 17–18)

| Criterion | Status | Evidence |
| --- | --- | --- |
| Author creates a 15×5 Auto scenario without developer help | Verified locally (test identity) | E2E cms |
| Publication refused with round-specific messages | Verified | S: integration; E2E cms |
| Draft scenarios cannot be chosen by hosts | Verified | S: integration |
| Preview runs 15 rounds without room/recap | Verified | E2E cms |
| Room + code in one step; lobby names grow | Verified | E2E main |
| Join with code + name only | Verified | E2E main |
| Empty / duplicate names rejected with clear message | Verified | E2E main |
| Same scene and countdown for all after start | Verified | E2E main; L |
| Next round after timer or all answered (whichever first) | Verified | S; E2E DB check |
| Reconnect continues current round; missed rounds zero | Verified | S; E2E |
| Capacity rejection with clear message | Verified | S; E2E |
| Room cannot restart after the session | Verified | S; E2E |
| Timeout → default consequence + zero | Verified | S; E2E |
| Own consequence only | Verified | S; E2E payloads |
| Option order differs between participants | Verified | S: room.test |
| Changing browser data does not change server score | Verified | S: integration (forged handles/rounds/time) |
| Summary shows 15 decisions, recommended, reasons | Verified | E2E |
| 70/30 score traceable per round | Verified (policy provisional) | S; UI breakdown |
| Same accuracy, different time → different score | Verified | S: domain.test |
| Rankings updated between rounds and on host screen | Verified | E2E |
| Export of all rooms in a period (name, scenario, score, time) | Verified | S; E2E admin |
| Dashboard per period | Verified | E2E admin |
| Round analytics most wrong / most timed out | Verified | E2E admin |
| Host cannot edit content; author cannot open rooms | Verified (REST + socket + UI) | S; E2E peran |
| Name notice before joining | Verified | E2E main |

## Appendix B — MVP summary (PRD p. 18)

| Item | Status |
| --- | --- |
| B.1 ~14-minute session in a room, no accounts | Session length measured, not enforced (D-09): room A 10.9 min with 8 rounds closed early (all answered) and 7 at the 30 s deadline; no accounts |
| B.2 Auto, two scenarios × 15 rounds × 5 choices; real-time rooms, host screen, 70:30, rankings, recap, authoring, admin dashboard, embedded in raksaonline.com | Implemented locally; scenarios are DEMO (C-1/C-2); embedding verified only with the local harness (IT open #3) |
| B.3 Outside MVP (HVC/Property, solo, accounts, Mandarin, native app, certificates, ops integration) | Respected; legacy solo/Mandarin only behind `RAKSA_LEGACY` |
| B.4 Prerequisites (8 items) | Not closable by software: see DECISIONS / CONTENT-HANDOFF |
| B.5 Definition of done | Room of configured size completes both scenarios (separate rooms, D-06) — verified locally; Tim Story publishing alone — verified with test identity only; PIC Claim approval of keys — **awaiting**; winner rule — **awaiting** |

## Staff review (Raksa Game Review.pdf)

| # | Page | Observation / request | Linked PRD | Status | Where |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | Welcome: Miss Raksa instead of Mr Roger, "anytime anywhere with our smile" | FR-E5 | Implemented + verified | `art/WelcomeArt.tsx`; E2E landing |
| 2 | 1 | "Main Cerita" → "Mulai / Start" | FR-B2 | Implemented (Join Game card button "Mulai"; leads to room participation; solo story renamed "Cerita solo" in legacy section) | `pages/Landing.tsx`; E2E landing |
| 3 | 1 | Remove "Cara main lain" in story selection; Mini Games as own home section | FR-F2 | Implemented in legacy mode; **conflict** in strict MVP (D-03) | `pages/Cerita.tsx`, `Landing.tsx` |
| 4 | 1 | "Gabung acara" → "Join Game", move to top | FR-B2 | Implemented + verified (first phone viewport, portrait and landscape) | E2E landing |
| 5 | 1 | "Latihan misi" → "Mini Games" | FR-F2 | Implemented (legacy section) | `i18n/kamus/pemain.ts` |
| 6 | 1 | Join Game icon → surveyor | FR-E5 | Implemented (first-party SVG; replace with brand art if provided) | `art/Surveyor.tsx` |
| 7 | 2 | No leaderboard showing each player's score | FR-D2 | Implemented + verified (between rounds, final, own rank) | E2E main |
| 8 | 2 | Mini game has no back button | NFR access. | Implemented: legacy event play "Kembali" with confirmation; story room "Keluar" with confirmation; leaving never resets the room | `components/TombolKeluar.tsx`, `pages/Play.tsx`, `StoryRoom.tsx` |
| 10 | 2 | Stories split per HVC / Cargo / Auto | FR-A1, FR-F1 | Category architecture ready; only Auto active; Cargo = future request (D-02) | `/cms/kategori` |
| 11 | 2 | No timer per session/round | FR-C2 | Implemented + verified (30 s server timer) | E2E |
| 12 | 2 | PRD format 15 decisions × 5 text choices; game uses tap missions | FR-A2/A4 | Implemented (new story room; legacy missions kept separately) | E2E main |
| 13–14 | 2 | 15 rounds and 30 s vs observed 14 missions / 39 s / ~17 min | FR-C2, DL #4/#13 | Implemented: 15 rounds, 30 s answer window; session length measured | E2E DB timing |
| 15 | 2 | No customer status unhappy→happy, no per-choice consequence, no ending; graph | FR-C4, C5 | Implemented: private mood (label + portrait + compact indicator), consequences, endings; no second score | E2E main |
| 16 | 2 | Cannot verify 70:30 from "+1,183" | FR-D1 | Implemented: per-round breakdown + explanation (policy provisional) | UI; S: domain.test |
| 17 | 2 | Round does not advance when all answered (1 participant) | FR-B6 | Implemented + verified for 1 and N participants | S: room.test; E2E |
| 18 | 2 | No CMS / admin (`/admin`, `/cms` go home) | FR-A*, D3–D4, E1–E2 | Implemented + verified | `/cms`, `/admin`; E2E cms/admin |
| 19 | 2–3 | No explicit name notice; name validation untested | FR-E7, FR-B4 | Implemented + verified | E2E main |
