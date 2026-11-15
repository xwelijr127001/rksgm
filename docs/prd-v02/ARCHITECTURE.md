# Raksa Game 917 — PRD v0.2 MVP architecture

Status: implemented design (kept in sync with the code; see REVIEW-HANDOFF.md for verification evidence).

## 1. Product shape

One host-led, synchronized multiplayer visual novel ("Story Room" / *Ruang Cerita*). All participants of a room play
the SAME published scenario version: 15 shared hub rounds, 30-second answer window, five text choices; each round is
one activity (chat thread, desk of documents, field scene or the classic stage, §10). Each
participant has a private customer state (mood), private consequences, a private score and a private ending. The room
plays one session and closes. Legacy experiences (solo story, Mini Games, legacy quiz rooms, Mandarin) are preserved
behind `RAKSA_LEGACY=on` and are off by default (see DECISIONS.md D-03).

## 2. Module map

| Layer | Location | Responsibility |
| --- | --- | --- |
| Shared domain (pure, no I/O) | `shared/story/` | `content.ts` schema v2 + text keys, `validate.ts` (sanitize/upgrade + validation), `engine.ts` (mood, flags and delayed effects, consequences, endings), `scorePolicy.ts`, `ranking.ts`, `names.ts`, `scene.ts` (scene payloads: names, public vs private lines, evidence, respondent, lesson by phase, reminders), `summary.ts` (consequence view + final summary), `audit.ts` (option audit), `protocol.ts` (socket/public/private payloads), `roles.ts` (capabilities), `dto.ts` (staff REST contracts) |
| Server persistence | `server/src/story/db/migrations.ts`, `runtime/sqliteStore.ts`, `content/*.ts`, `reports.ts` | migrations; room/round/decision persistence; scenarios/versions/assets; periods, dashboard, results, CSV, analytics |
| Server auth | `server/src/story/auth/` | staff users (scrypt), bearer sessions, audit log, rate limiter |
| Server runtime | `server/src/story/runtime/` | `StoryRoom` state machine (ports: clock, store, events), `StoryRoomManager` (codes, limits), option handles/shuffle |
| Server transport | `server/src/story/http.ts`, `server/src/story/socket.ts` | REST (staff, CMS, host, admin, public room info/assets/result, `/aset-cerita` files) and the `/story` Socket.IO namespace; every handler validates its payload and checks the caller |
| Client foundation | `client/src/story/` | base path (`base.ts`), server config (`appConfig.ts`), server clock, sockets, participant + staff session stores, `{nama}` personalization (`view.ts`), round activities (`round/`, §10), stage (`stage/StoryStage.tsx` reusing the pixel `Panggung`), music, shared UI parts, `StaffShell` |
| Client pages | `client/src/pages/story/` (join, room, projector, host), `pages/cms/` (CMS), `pages/admin/` (reports, periods, users, audit) | participant, event screen, host console, authoring, administration |
| Legacy | existing files | solo story, Mini Games, legacy quiz rooms, Mandarin; routes registered and sockets/APIs served only with `RAKSA_LEGACY=on` |

The room runtime and the CMS preview both call the same `shared/story/engine.ts`, `scorePolicy.ts`, `scene.ts` and
`summary.ts`; the room, the projector and the preview render the same round components (§10).

## 3. Room state machine (server authoritative)

```
LOBBY --host start--> SCENE(r) --ready+reading | cap--> ANSWERING(r) --all eligible answered | deadline--> CONSEQUENCE(r)
CONSEQUENCE(r) --timer | host next(after min)--> LEADERBOARD(r) --auto timer | host next--> SCENE(r+1)
CONSEQUENCE(15) --> FINISHED (closed)
any non-final --host close / server restart--> INTERRUPTED (closed)
```

- **SCENE** (preload + shared reading): starts the round's scene for everyone. Ends at the earliest of
  (a) every *connected* eligible participant reported the round's assets ready AND the reading time elapsed, or
  (b) reading time + preload grace elapsed. Disconnected/slow devices never extend anyone's answer window. The reading
  time counts the round's lines and prompt only (opening lines on round 1), never evidence or conditional lines.
- **ANSWERING**: exactly 30 000 ms (`answerWindowMs` of the active score policy `story-70-30-v2`). Eligibility is
  frozen at phase start = registered, non-removed participants. A disconnected participant remains eligible until the
  deadline. Closes as soon as all eligible participants have one accepted answer, or at the deadline — whichever is
  first.
  `closeAnswering()` is guarded by phase/round so a deadline timer racing the last answer settles the round once.
- **Answer acceptance**: authenticated participant credential, phase ANSWERING, matching `roundId`, opaque option
  handle that maps to one of the round's five choices for THAT participant, not already answered, server receipt time
  `receivedAt <= deadlineAt` (inclusive boundary, no grace). `elapsedMs = receivedAt - answeringStartedAt` from the
  server clock only. One final answer: a retry of the SAME option (double tap, reconnect, lost ack) returns the original
  acknowledgement, also after close; any other option is refused with `answered`; neither changes the score.
- **CONSEQUENCE**: each participant privately receives their own choice (with its display form, `chosenForm`),
  consequence text, the respondent's reply, mood change, labelled delayed effects, score breakdown and (round closed)
  the recommended choice and reason; the round's lesson becomes public. Timeout = authored timeout consequence (and
  timeout reply), mood delta applied once, score 0.
- **LEADERBOARD**: cumulative rankings (public) + own position (private). Auto-advance (default, 7 s) or host-paced.
  On a participant's device the round stays on screen with its outcome, joined by a compact ranking card and a docked
  line with the own rank (§10); the projector shows its ranking screen.
- **FINISHED**: personalized summary of all 15 decisions + ending; room closed forever (no reset, replay,
  reopening or 16th round through UI, REST or sockets). New play = new room.
- **Restart policy**: rooms live in memory; decisions are persisted when each round settles. On server start, every
  persisted room that is not finished is marked `interrupted` (no silent reset, no claimed crash recovery). Completed
  results stay readable.

## 4. Public vs private payloads

| Payload | Audience | Contains | Never contains |
| --- | --- | --- | --- |
| `StoryPublicState` | room channel, projector, host | code, scenario title/version label, phase, round number, server time, deadlines, scene clock (`sceneStartedAt`, `readingMs`), shared scene (unconditional lines without mood variants, evidence, action label, respondent; the lesson only after close), participant names + connection + answered flags (counts), rankings in LEADERBOARD/FINISHED | answer keys, weights, classifications, conditional lines, replies, reminders, other participants' choices/moods/consequences, credentials |
| `StoryPrivateState` | one participant socket | own mood band, own customer-variant line, own conditional lines (scene → consequence) and flag reminders, own options (opaque handles, shuffled, with their display form) during ANSWERING, own accepted answer (incl. its handle), own consequence after close (reply, lesson, labelled delayed effects), own score breakdown, own rank, own final summary + ending (causal flag notes, stored names/status words) | anything about other participants |
| Host console | authenticated `host` staff socket | public state + participant list for removal; the current round's activity, evidence count and confirm label | private moods/choices of participants |

Choice IDs are never sent to participants; options carry per-participant HMAC handles
(`HMAC(roomSecret, participantId|roundId|choiceId)`), and the display order is a per-participant, per-round
deterministic shuffle, so it survives refresh/reconnect and grading uses choice IDs only. Public lines are numbered
among themselves and named neutrally (`p<pos>`; a participant's own conditional lines `f<k>`; opening lines keep their
authored id), never by the authored id of a round line, so a shared payload never shows that hidden lines exist. The
room's asset list (`/api/story/rooms/:code/assets`) covers only rounds already reached (backgrounds, media, evidence
pictures).

Emission order: on every phase or round change the server emits the public snapshot first, then each participant's
private one (`socket.ts` `phaseChanged`; one connection delivers in emit order), so no device holds a private snapshot
of a newer phase or round than its public one. Until the private snapshot catches up, the participant page shows a
loading state ("Pilihan segera dibuka…", "Memuat hasilmu…"), never another round's or phase's state
(`roundModel.privateOfRound`, `trayStateOf`).

## 5. Content versions

- `story_scenarios` = working copy metadata + lifecycle status (`draft`, `in_review`, `published`, `archived`).
- `story_scenario_drafts` = current editable content (JSON, schema v2; older JSON is upgraded on load, see
  SCHEMA-AND-SCORING.md) + revision counter;
  `story_scenario_revisions` = every saved draft revision (history).
- `story_scenario_versions` = immutable published snapshots (content JSON + SHA-256 hash, version number, publisher,
  reviewer, anonymization record, content kind demo/official). Only the scenario's **current** published version can
  start new rooms; publishing a newer version supersedes it; archiving/withdrawing blocks new rooms.
- A room stores `version_id` and `content_hash` at creation and keeps its frozen content in memory; later edits,
  publications or archival never affect it or its stored results.

## 6. Authorization

Staff authenticate with username + password (scrypt) → bearer session token (hashed at rest, 12 h). Roles:
`host`, `author`, `reviewer`, `competition_admin`, `system_admin`; a user may hold several, each assignment is audited.
Every REST route declares a capability (`requireCap` in `server/src/story/http.ts`, matrix in `shared/story/roles.ts`);
host socket events require the `host` role AND ownership of the room (`socket.ts`).
Participants are anonymous: room code + name → room-scoped credential (random, stored hashed). The legacy panitia PIN
and legacy host tokens are not used by the new system.

## 7. Persistence (SQLite, migrations)

`server/src/story/db/migrations.ts` applies ordered, transactional migrations recorded in `schema_migrations`.
Legacy tables (`matches`, `match_players`, `match_rounds`, `soal_kustom`) are untouched; legacy scores keep their
original 1000+300 interpretation. New tables are prefixed `story_` / `staff_` / `audit_`.

## 8. Abuse limits

Unauthenticated lookups (join, resume, room info, projector watch, personal result) are limited per IP by FAILED
guesses (unknown code/credential: 30 per 5 minutes) plus a generous flood cap (1 200 per minute), so a whole event
behind one office NAT can join and reconnect while code guessing is throttled. Staff login: FAILED attempts only
(10 per IP+username and 50 per IP per 10 minutes); successful logins are never limited. A code that once existed
(finished/interrupted room) answers `closed` and is never counted as a guess, so a reconnect storm after a restart does
not lock an event out. Behind a reverse proxy set `TRUST_PROXY_HOPS`. Socket payloads are capped at 64 KB; display
names are length-checked before normalization; host socket events re-authenticate the staff token every time. All
limiters are in-memory (single process).

## 9. Hosting

The MVP client can be built under a path prefix (`VITE_BASE_PATH`) for a reverse proxy; the server sets
`frame-ancestors` from `FRAME_ANCESTORS` (default `'self'`). See HOSTING.md and the local harness.

## 10. Round activities (client, `client/src/story/round/`)

A round is ONE activity picked by the content's `layout` (DECISIONS D-28), never by round number or title. The same
components serve the participant room, the projector and the CMS preview, so the preview shows what the room shows.

| File | Responsibility |
| --- | --- |
| `RoundScreen.tsx` | participant page of one round (keyed per round) through scene → answering → consequence → leaderboard: starts at its top (scrolled to 0 when it mounts); the header's task line only while reading; line reveal anchored to the scene clock, readiness report; only the private snapshot of the round on screen is used (`privateOfRound`; one that has not caught up shows loading); the decision slot (DecisionTray while played, OutcomeBlock after close, "Memuat hasilmu…" until the own outcome arrives); the page's sticky dock (`.sr-baki-dok`) holds the decision bar while answering and after close `CloseBar` (`data-langkah`): on the leaderboard "Peringkatmu: n dari N" with "Babak n dimulai dalam N detik" or "Menunggu host melanjutkan.", after the last round's outcome "Hasil akhir tampil dalam N detik", nothing during the other consequences; under the round its points and, on the leaderboard, the ranking card (`data-peringkat`: top three + own row); one polite live region (`announcer.tsx`: options open, own result, own rank) |
| `RoundActivity.tsx`, `RoundSurface.tsx` | public entry (injects the canvas stage) and the layout switch: activity root, private reminders, the evidence sheet's open state (survives phase changes, closes when the round changes) |
| `ChatActivity.tsx` | one thread: contact header (a customer/cast respondent, else the first named customer/cast sender, else the round title), evidence as attachments, messages, composer with the question and the decision slot; the outcome continues the thread |
| `DossierActivity.tsx` | short brief, document cards, decision; the result card under the documents |
| `FieldActivity.tsx` | scene picture with small numbered pins (30 px, 44 px tap area, drawn within `SPOT_SAFE_RANGE` 6–94 %) and the same items as a numbered list (the accessible equivalent; on short landscape screens the pins and their hint hide while answering, the list stays), "Perbesar gambar" (picture sheet), decision |
| `StageActivity.tsx` | legacy stage (`StoryStage`) + dialogue; optional light view (text-only stage, kept per device) |
| `RoundHeader.tsx` | "Babak n/15 · meta · key badge", title, the task line ("Tugas: …", reading phase only), ONE status chip (a band change by a delayed effect shown once) |
| `DecisionTray.tsx` | five option cards (radio group, roving focus, arrows/Home/End, no A–E, no form mark), ONE confirm button + ONE timer in a bar docked sticky by the page; the confirm label follows the selected option (`confirmLabelOf`: a chat action → "Tetapkan tindakan"); "Pilihan dibuka dalam N detik" while reading; "Pilihan segera dibuka…" while answering until the private options arrive (`trayStateOf` 'loading'); time-up and sent states (chat message → own bubble "✓✓ Terkirim", chat action → note "Kamu: …" "✓ Ditetapkan", elsewhere a card "✓ Ditetapkan": only a message is "sent"); selection kept in `sessionStorage` (`raksa:story:pilih:<code>:<roundId>`); option scroll margin = measured bar height; "N pilihan lagi di bawah" inside the bar (a line of its own on a narrow bar, between timer and button on a wide one); short landscape screens (landscape, height ≤ 500 px): tighter cards, still ≥ 44 px |
| `EvidenceList.tsx`, `evidenceParts.tsx`, `EvidenceSheet.tsx` | openers (chips, cards, numbered list; contents inline in mode `projector`), item content (picture, text, rows with icon + word marks, note for a failed picture; the label above a title = the authored kicker, else the kind word), the modal sheet (native `<dialog>`: page inert, Escape / close / backdrop, focus returns to the opener, the countdown repeated inside); `PictureSheet` = the field picture enlarged (`data-lembar-gambar`), at ≤ 600 px twice the screen width in a frame that pans sideways, centred, with the hint "Geser gambar ke samping …" |
| `OutcomeBlock.tsx` | own outcome after close, kept through the leaderboard: the own turn (chat: message bubble "✓✓ Terkirim" or, from `chosenForm`, action note "Kamu: …" "✓ Ditetapkan"; elsewhere a result card), the respondent's reply, outcome note; then the lesson (else the choice reason), the labelled delayed effects of the round's start ("Dampak tertunda di awal babak ini — …"), the badge with the status change since then (after the delayed effect), the recommended option when not tepat; the round's points follow outside the block |
| `activityParts.tsx`, `answerClock.tsx`, `notes.ts`, `useRoundReady.ts` | decision area: the question above the slot while played and, for a flag holder, a one-line reminder (wraps, no ellipsis); scrolled into view once when options open or the result arrives; when the leaderboard's line docks, the outcome on screen moves up by the part the line covers, so its end (status, delayed effects) stays readable; an outcome taller than the room left loses its start off the top instead (`clearOfBarDelta`); public lesson, reminders; timer pill + answer clock context; wording of reminders, delayed and causal notes; readiness report (pictures decoded or 6 s; evidence pictures prefetched, never gating) |
| `roundModel.ts` | pure helpers (unit-tested): `RoundView`, default and per-selection confirm labels (`actionLabelOf`, `confirmLabelOf`), draft key, line reveal, chat contact, status chip and status change, `privateOfRound`, radio-group keys, tray state (incl. 'loading') and deadline, scroll deltas (`bringIntoViewDelta`, `clearOfBarDelta`), evidence marks, field markers (within `SPOT_SAFE_RANGE`), causal notes |

Data flow:

```
server snapshots (StoryPublicState + StoryPrivateState)
  → view.ts personalize*          {nama} = own name on the device, a neutral word on shared screens
  → roundModel.roundViewOf        public + own conditional lines merged, opening lines apart, status chip, reminders, outcome
  → RoundScreen (participant) | StoryProjector (mode 'projector') | CMS PreviewTab (mode 'preview', shared engine)
  → RoundActivity → RoundSurface → Chat | Dossier | Field | Stage activity
       decision slot: DecisionTray (scene, answering) → answer(handle) → server ACK → sent state
                      OutcomeBlock (consequence, leaderboard: own StoryConsequenceView)
  page dock (participant): decision bar (answering) | CloseBar: own rank + next step (leaderboard, last consequence)
```

Nothing here decides timing, correctness or score: phases follow the server snapshots, timers show server deadlines,
and opening evidence sends nothing to the server. Modes: `participant` (decision slot, reminders, openers); `projector`
(no slot and no private data, evidence contents inline instead of openers, markers without buttons, the lesson after
close); `preview` (as participant, driven by the shared engine in the browser; it starts with the options open, so its
header has no task line). The event screen (`StoryProjector.tsx`, `story/projector.css`) is exactly one screen: on the
right a rail with the round's title, its task while the round is played and the status (the reading countdown
"Pilihan dibuka dalam N detik" from `sceneStartedAt + readingMs`, as on the phones; ONE big answer timer and the
answered count; then the wait for the next phase); on the left the activity in mode `projector`, cut to its three
newest public lines (round 1's opening lines first, on their own, for their share of the reading time; a field scene
keeps its markers), beside ONE focus panel: the shared evidence one item at a time (turns counted from
`sceneStartedAt`, so every screen shows the same item; `roundModel.evidenceTurnMs` shares the reading time out among the
items, 6–10 s each, so every item shows while the room reads) while the round is played, the lesson once the answers are
closed. In the leaderboard phase the event screen shows its ranking (top 10). The host console shows the current
round's activity, evidence count and confirm label; its controls are unchanged. The separate full-page consequence
screen and the "Baca lagi" answer panel of v1 are gone; on participant devices the leaderboard is no separate page
either.

Stable test hooks (browser tools select by these, not by CSS classes):

| Hook | Element |
| --- | --- |
| `data-fase="<phase>"` | round screen (scene, answering, consequence, leaderboard) and the projector's round view (scene, answering, consequence) |
| `data-aktivitas="chat\|dossier\|field\|stage"` | activity root |
| `data-pilihan="<handle>"` + `aria-checked` | each option card |
| `data-kirim` | the confirm button |
| `data-terkirim` | the sent state |
| `data-berkas="<evidenceId>"` | each evidence opener (chip, card, list item, field marker) |
| `data-lembar="<evidenceId>"` | the open evidence sheet |
| `data-lembar-gambar` | the open picture sheet (field scene enlarged) |
| `data-hasil` | the OutcomeBlock |
| `data-pengingat` | a private flag reminder |
| `data-timer` | the single answer timer (not its copy inside an open sheet) |
| `data-suasana="<band>"` | the status chip |
| `data-peringkat` | the ranking card on the round screen (leaderboard phase) |
| `data-langkah` | the line docked after close (own rank, next step) |
| `data-kegiatan="<layout>"` | host console, current round |

The final summary is a separate screen without hooks (`.sr-hasil-akhir`), and so is the projector's ranking
(`.sr-layar-papan`).

## 11. CMS editor: unsaved work and staff sessions

`ScenarioEditor.tsx` keeps a working copy beside the copy the server last stored (`workingCopy.ts`): a server answer
never drops what was typed after its request, and saves run one at a time (a save asked for while another is on its
way waits for it, then stores only what is still unsaved, on the revision that save made: no duplicate revision, no
false 409). While anything is unsaved, `LeaveGuard.tsx` asks before every way out: closing or reloading the tab (the
browser's own `beforeunload` warning), a link to another page of the app, any control outside the editor (e.g.
"Keluar"), and a move through the browser history (back/forward buttons, mouse buttons, Alt+←/→, swipe gestures). The
app keeps its `BrowserRouter`, which has no navigation blocker: `client/src/historyHold.ts`, imported by `App.tsx`
before the router mounts, listens to `popstate` first (capture phase), so the guard takes a history move before the
router sees it, undoes it (react-router numbers its entries in `history.state.idx`) and makes it again on leaving
(DECISIONS D-45). A save already on its way is waited for; when it leaves nothing unsaved, the held way out goes ahead.

A staff request answered 401 (expiry, revocation) marks the session `ended` (`story/staff.ts`). The CMS is a
`resumable` `StaffShell` tool: it stays mounted under a non-dismissable sign-in dialog; signing in again as the same
staff member continues with the unsaved work intact, another account restarts the tool (it is keyed by account).
Host and admin tools show the sign-in page instead (D-46).
