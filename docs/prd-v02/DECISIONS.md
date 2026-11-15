# Decision record — PRD v0.2 + staff review (Raksa Game 917)

These are working decisions made for THIS local implementation, following the brief's explicit reconciliations
(`PROMPT-CLAUDE-PRD.md` §4) and the PRD decision log (DL #1–#14). A decision marked **provisional / local default**
is not a stakeholder approval; its owner is named. Nothing here records committee, Legal, IT or Product approval.

D-28–D-35 come from the later gameplay change set (activity-based rounds, built while adapting the first real Auto
scenario; owner's gameplay brief of 30 Oct 2026). They describe generic platform behaviour only: the adapted scenario,
its option mapping and its review stay in the private case folder outside the repo. **Implemented** means built and
tested locally, not approved.

D-36–D-47 record the two fix rounds that followed the change set (31 Oct and 1 Nov 2026), again as generic platform
behaviour only; earlier rows that the fix rounds changed say so (D-20, D-25, D-28–D-31, D-33, D-34).

| ID | Topic | Decision | Basis | Status / owner |
| --- | --- | --- | --- | --- |
| D-01 | Product format | One host-led, synchronized multiplayer visual novel. All participants of a room play the same 15 rounds (hub model); each sees only their own consequence, customer mood, score and ending. | PRD DL #2, #4, #5; FR-B6, FR-C4 | Decided in PRD |
| D-02 | MVP category | Only **Auto** is active (two scenarios). HVC and Property exist as inactive categories; Cargo (staff review #10) is recorded as a future request, not created. Activation is a system-admin switch but content for those categories does not exist. | DL #8, FR-A1, FR-F1, brief §4 | Decided (Product); Cargo = open request → Product |
| D-03 | Legacy features | Solo story (`/cerita`), solo practice missions (now labelled **Mini Games**), the legacy event quiz (`/acara/*`, 4-char codes, 1000+300 scoring), Unity 3D and **Mandarin** are preserved behind `RAKSA_LEGACY=on` (default **off**). When off: legacy REST/static paths return 404, the default Socket.IO namespace refuses connections, client routes are not registered (direct URLs redirect to `/`), and the language picker hides 中文. | PRD B.3 (solo mode, Mandarin outside MVP), FR-F2/F3, brief §4 | Implemented. **Conflict for owner:** staff review #3/#5 ask for a "Mini Games" section on the home page; in the strict MVP configuration it is hidden. Owner chooses: keep hidden (PRD) or enable legacy → Product |
| D-04 | Choices per round | Exactly **5** meaningful text choices per round (validation error otherwise). The PRD body says "sampai lima" (FR-A4) but Appendix A/B require five; the conservative reading is used. No padding with absurd/duplicate options (duplicate texts are a validation error). | FR-A4 vs App. A/B | Interpretation; confirm → Product |
| D-05 | Build vs reuse | The narrative multiplayer engine is built in-house (`shared/story`, `server/src/story`), no turnkey VN platform. First-party pieces are reused: the v5.1 pixel stage (`cerita/ui/Panggung`), portraits, audio engine, i18n, UI kit, Express/Socket.IO/SQLite patterns. DL #11 ("dibangun dari nol") is read as *owned, not bought* — rewriting working first-party code to simulate a greenfield start would add risk without value. | DL #11, brief §4 | Interpretation → IT + Product |
| D-06 | Two scenarios | One room plays exactly one scenario version once (FR-B10). The two Auto scenarios are verified in **separate rooms**; App. B.5 "satu room … dua skenario" is not implemented as 30 rounds in one room. | FR-B10, App. B.5, brief §4 | Interpretation → Product |
| D-07 | Score policy | `story-70-30-v1` (**provisional**): max 1000/round; `accuracyPoints = round(700·a)`, `speedPoints = round(300·a·s)`, `s = clamp(1 − elapsed/30000, 0, 1)`, timeout = 0. Speed is accuracy-gated (a wrong answer earns no speed points). Elapsed time = server receipt − server answering start; the deadline is inclusive (`now ≤ deadline` accepted); no client-supplied time is used; no late-packet grace. Fixtures: a=1 at 0/15/30 s → 1000/850/700. The policy id is stored with every decision. "70:30" is the maximum component allocation, not a ratio every score shows. **Replaced for new rooms by `story-70-30-v2`** (still provisional): `speedPoints = a > 0 ? round(300·s) : 0`, no longer scaled by accuracy, following the scoring rule of the first real Auto scenario script; a=0.5 at 0/15 s → 650/500. Decisions stored under v1 keep their policy id and points. The gameplay change set (D-28–D-35) does not change the policy. | FR-D1, DL #6, brief §5C | Provisional → Komite gabungan + Product |
| D-08 | Ties | Competition ranking "1224": equal totals share a rank (flag `tied`); display order breaks ties by accuracy points, then server time, then name. No tiebreak round beyond 15. | FR-D2, brief §5C | Provisional → Panitia |
| D-09 | Timing | 30 s is ONLY the answer window. Each scene has a shared reading time (8–25 s, from text length) plus bounded readiness (answering opens when all connected devices report ready, or 8 s after reading time — never per-participant extensions). Consequence 10 s (host may skip after 4 s), leaderboard 7 s (auto) or host-paced. ~14 min is a target that is measured, not enforced. | FR-C2, NFR Performa, DL #13 | Local default → Product |
| D-10 | Demo content | The two Auto scenarios are **synthetic demonstrations** (`contentSource = demo`, titles "[DEMO] …"), built only to exercise the platform. Their publication by test identities (`npm run story:dev-setup -- --publish-demo`) is a **simulated approval**, never committee approval. Demo rooms are excluded from competition reports unless "sertakan DEMO" is chosen. | Brief §7 | Awaiting real cases → Tim Story, Komite, Legal |
| D-11 | Host vs automation | Answer collection closes automatically when every eligible participant has answered or at the deadline (FR-B6), then private consequences, then rankings. The host starts, may open choices early during the reading time, may continue after the consequence minimum, advances leaderboards when auto-advance is off, removes participants, and closes the room. The host can never shorten an answer window. FR-B5 "melewati peserta yang belum menjawab setelah timer habis" happens automatically at the deadline (timeouts score 0). | FR-B5, FR-B6, staff #17 | Interpretation → Product |
| D-12 | Eligibility | The eligible set is frozen when answering opens: all registered, non-removed participants (connected or not). Reconnects never add anyone; a disconnected participant stays eligible until the deadline (so the room waits at most 30 s for them) and scores 0 if they do not answer; a removed participant is excluded from the remaining rounds. | FR-B8, brief §5B | Local default → Product |
| D-13 | Languages | Indonesian is the MVP language. Participant UI strings exist in id + en (kamus `ruang`); scenario text is stored per locale (`text[locale][key]`, Indonesian required, English optional and validated for completeness when enabled). Staff tools (host/CMS/admin) are Indonesian-only. Mandarin stays a legacy feature (D-03); the translation test now allows the MVP namespace without zh (`KAMUS_MVP`). | DL #10, FR-A10, FR-F3 | Decided; Mandarin timing = open #17 → Marketing |
| D-14 | Internal access | Local staff accounts (scrypt-hashed passwords, 12-hour bearer sessions stored as hashes, rate-limited login), five explicit combinable roles mapped to capabilities (`shared/story/roles.ts`), enforced on REST and sockets. No default/production credentials exist; the first system admin is created with the provisioning CLI. The panitia PIN of the legacy quiz is not used for the MVP. IT-approved identity (SSO with raksaonline.com) is **not** implemented. | FR-E3, NFR Keamanan, open #3 | Local implementation; SSO/IdP → IT |
| D-15 | Publication rules | Draft → in review (locked) → published (immutable version, content hash) → archived. A reviewer may not publish a scenario they submitted or last edited (four-eyes). Settled-case scenarios need a recorded anonymization check (evidence note) before publication. Every transition is attributed in the scenario history and the audit log. | FR-A7, FR-E6, open #12 | Implemented; who approves anonymization = open #12 → Legal + Tim Story |
| D-16 | Versions | A room pins the exact version (id + hash) at creation; later edits, publication, archive or withdrawal never change a running room or historical results. Withdrawn versions and archived scenarios cannot open new rooms. | FR-A7, brief §5A | Implemented |
| D-17 | Restart & expiry policy | Live rooms are in memory. On server start every room still `lobby`/`running` is marked `interrupted` (`server_restart`, end time = last settled round); no crash recovery is claimed. Completed rounds/decisions and finished summaries are persisted and readable (participant credential, admin reports) after restart. Abandoned rooms close as `expired` (lobby idle 6 h, paused on the host 2 h); the competition admin can close any live room (`admin_closed`). | Brief §5B | Implemented; recovery = future decision → IT |
| D-18 | Capacity | Configured limits (env): `STORY_MAX_PARTICIPANTS` (default 100/room), `STORY_MAX_ACTIVE_ROOMS` (default 20). These are **local defaults, not approved capacity**; see the load-test evidence for what was actually tested. | FR-B9, open #1 | Open #1 → Marketing + IT |
| D-19 | Names | 2–20 characters (Unicode letters/marks/digits, space . ' _ -), must contain a letter; duplicates are compared case-, width- and space-insensitively within a room; an Indonesian/English blocklist rejects inappropriate names (some short words only as whole tokens to avoid rejecting real names such as "Colin"). The same rules apply to rename (lobby only). Hosts can remove participants. | FR-B4, staff #19, risk table | Local default; list review → Product + Legal |
| D-20 | Reveal & privacy | Options (opaque per-participant handles, deterministic per-participant shuffle) are sent only during answering; correctness, consequence, reasons and mood change are sent privately only after answering has closed for the whole room. Public/projector payloads contain counts and rankings only. Answer keys and weights never leave the server except to staff with CMS rights. On every phase or round change the public snapshot is emitted before the private ones; a device whose private snapshot has not caught up shows a loading state, never another round's or phase's state (fix round, 31 Oct 2026). | FR-C4, FR-C7, FR-C8 | Implemented |
| D-21 | Customer mood | Mood 0–100, five bands (sangat kecewa…senang), carried across rounds per participant; the author's initial mood applies only to round 1. Each choice and the timeout have a mood delta (±40). Mood describes the customer's experience, **not** process correctness, and is not a second score. Endings: first match on mood AND total score, last ending unconditional, ≥1 "happy" and ≥1 "with notes". | FR-A3, FR-C1, FR-C5, staff #15 | Implemented; content thresholds → Tim Story + Komite |
| D-22 | Who may host | Only staff accounts with the `host` role open rooms. Whether brokers/agents may open rooms is open. | Open #8 | Open → Product |
| D-23 | Retention | Names and results are kept without an automatic deletion schedule in this build; reports show the stored names. No retention policy is invented. | NFR Pelindungan data, open #11 | Open → Legal + Product |
| D-24 | Hosting | The MVP client can be built under a path prefix (`VITE_BASE_PATH`) for a reverse proxy that strips the prefix (e.g. `https://raksaonline.com/game/` → Node); `TRUST_PROXY_HOPS` makes per-IP limits see real clients behind it. Framing is controlled by `FRAME_ANCESTORS` (default `'self'`). Verified only with the local harness; no change to raksaonline.com. | DL #1, open #3 | Local harness; real integration → IT |
| D-25 | Leaderboards | Live rankings are per room (between rounds and at the end, own rank highlighted; on participant devices the ranking between rounds joins the round screen, D-36). Cross-room recap for the committee lists scenario + version per row; scenarios/versions are not merged into a national ranking. | DL #14, FR-D6, open #2 | Winner rule = open #2/#4 → Product + Panitia + Legal |
| D-26 | Legacy quiz behaviour | The legacy event quiz keeps its own behaviour (1000+300 scoring, its auto-advance rules) so historical results keep their meaning; only the staff review's naming and back-navigation fixes were applied there (Mini Games label, "Kembali" with confirmation on the event play screen). | Brief §5C ("do not recalculate old results"), staff #5, #8 | Implemented |
| D-27 | Room codes | 6 characters from a 31-symbol alphabet without look-alikes (≈8.9·10⁸ codes), cryptographic randomness, rate-limited join/info/watch/resume. 4-character codes belong to the legacy quiz and are forwarded only in legacy mode. | NFR Keamanan, FR-B1 | Implemented |
| D-28 | Rounds as activities (content schema v2) | Content `schemaVersion` 2. Each round names ONE main activity in `layout`: `chat` (one message thread, no illustration beside it; shared evidence as attachments; the five reply drafts in the composer), `dossier` (short brief + document cards), `field` (one scene picture with numbered information points, repeated as a numbered list) or `stage` (the v1 pixel stage + dialogue; default, used by the demos). All four share one round shell: "Babak n/15 · meta · key badge", ONE status chip, ONE compact timer docked with ONE confirm button, five option cards (radio group, no A–E letters, shuffled per participant) visible together with the context, an evidence sheet, and the own outcome inside the same activity (no separate consequence page; kept on screen through the leaderboard, D-36). Once the server acknowledges the answer the tray shows the sent state; another option for that round is refused (`answered`), a retry of the same option gets the original acknowledgement. Behaviour comes from content fields only, never from round numbers or titles. 15 rounds, 30 s, five options and server-owned state/score are unchanged. v1 content is upgraded on load (defaults; stored JSON and version hashes untouched), scores exactly as before and plays in the layout it names (`stage` when none). | Gameplay brief §3, §6, §7; FR-A2/A3, FR-C1, FR-C7 | Implemented (checked by inspection and automated tests; no human playtest yet → Product). Activity per real round = authoring → Tim Story |
| D-29 | Shared evidence; fairness rule | Shared information is a ROUND field: ≤ 5 items (document, checklist, timeline, comparison, photo; list kinds hold 1–12 rows with status marks shown as icon + word; pictures from the asset library). It is identical for all five options and every participant, public in every phase of the round (the projector shows the items one at a time in its focus panel while the round is played) and never carries a key, weight, outcome or hint. Opening an item stays on the device: no points, no server event, no reset of the selection or the timer. Facts every option relies on belong in evidence, not only in the recommended option's text; a status the source does not give is marked "perlu dicek", never guessed. Evidence is not counted in the shared reading time and the answer window stays 30 s: a heavy reading load is an authoring issue, not hidden extra time. | Gameplay brief §3B, §5, §6; FR-C4, FR-C7 | Implemented. Fairness of a scenario's evidence = content review → Tim Story + Komite |
| D-30 | Respondent, reply, lesson, action label | A round may name a `respondent` (customer, officer, a cast member; none = narration only). Its `reply` per choice (and `timeout.reply`) reaches only the participant who chose it, after the answers are closed: an incoming bubble after their sent bubble in a chat, a quote on the result card elsewhere. The round `lesson` (one short lesson) is public only once the answers are closed (`LESSON_PHASES`: consequence, leaderboard, closed), never while reading or answering; in the live outcome it replaces the choice reason, which stays in the final summary. The round `action` labels the confirm button; empty = the activity's word: "Kirim balasan" (chat), "Tetapkan tindakan" (dossier, field), "Tetapkan pilihan" (stage); in a chat a selected action option is confirmed as "Tetapkan tindakan" (D-39). "Kunci jawaban" is gone. | Gameplay brief §3, §5 (one reaction, one lesson); FR-C4 | Implemented |
| D-31 | Option form | Each choice has a display `form`: `message` (default: words sent to the contact) or `action` (a step taken without a message). The form is never part of the key, the score or the mood. **Changed by D-39/D-40:** the "Tindakan" mark on the option card is gone; in a chat the form sets the confirm label of a selected option and shows a sent action as a note ("Kamu: …", "✓ Ditetapkan") before and after close. Authors must not let it become a tell (e.g. only the recommended option being an action); `choice_form_hint` warns about the plainest case (D-40), the audit measures nothing else about it. | Gameplay brief §3, §5 | Implemented; use per scenario = content review → Tim Story + Komite |
| D-32 | Flag labels, reminders, causal notes | An optional `flag.<id>.label` names a flag (e.g. the promise it stands for). Only the participant holding the flag sees: a private reminder while the reacting round is read and answered, the labelled delayed-effect note in their outcome (the clamped share of each flag, authored order), and causal notes in the final summary at the round that left the flag and at the round where it took effect, also when the status recovered and the ending is good. Without a label the flag reads as "keputusanmu di babak n". Public, projector and host payloads never carry any of it. Recovery after an effect stays possible; no new penalty or bonus. A flag left in more than one round is a warning (`flag_multi_round`: reminders name the latest such round). | Gameplay brief §6; FR-C4, FR-C6 | Implemented. Whether a scenario intends recovery after an effect = content → Tim Story + Komite |
| D-33 | Private lines in the consequence | A participant's conditional (`ifFlag`) lines stay in their round's conversation through the consequence (before: scene and answering only), so the thread keeps them when the outcome arrives; still private. Public lines are numbered among themselves (and named neutrally, D-44), so a shared payload never reveals that hidden lines exist; private lines merge back in authored order. | FR-C4, D-20 | Implemented |
| D-34 | Authoring guidance, "Audit pilihan" | Validation adds WARNINGS that never block publication: `choice_long` (option > 20 words; target 8–16), `choice_length_hint` (a tepat option is the longest of its round AND ≥ 1.5 × the median length of the others), `lesson_long` (> 30 words; target 15–25); the fix rounds add `choice_form_hint` (D-40). The CMS "Audit pilihan" shows per round the words, characters and length rank of each option and where the recommended one ranks, and per scenario the blind strategies "always the longest" / "always the shortest": tepat count (ties: worst–best and expected value) and expected points under the active policy at 15 s, kurang tepat weights included. One pure module (`shared/story/audit.ts`) serves the panel, the validator and the private audit script. The bound used for the first real Auto scenario (each strategy ≤ 5/15 tepat) is the owner's design check, not statistical proof of an unbiased rubric. | Gameplay brief §5, §6 | Implemented. Thresholds and the bound are local defaults → Tim Story + Product |
| D-35 | Separate local test build | Builds for local verification go to `client/dist-uji` (`VITE_OUT_DIR=dist-uji`) and `server/dist-uji` (`tsc --outDir dist-uji`) and run with `CLIENT_DIST=client/dist-uji` on a DB copy; `dist-uji/` is git-ignored. A server already running from `client/dist` + `server/dist` (someone's live test) is never rebuilt under its users. No deploy, CI or production change. | Owner's run rules (port and DB isolation) | Implemented (local practice; `.gitignore` only) |
| D-36 | Leaderboard on participant devices | The round stays on a participant's screen through the consequence AND the leaderboard (no separate leaderboard page): the activity, the own outcome and private lines, the round's points and, on the leaderboard, a compact ranking card (top three + the own row, "+n peserta lain"). After close the page docks one line at the bottom, like the decision bar: on the leaderboard the own rank ("Peringkatmu: n dari N") and "Babak n dimulai dalam N detik" (auto-advance) or "Menunggu host melanjutkan." (host-paced); after the last round's outcome "Hasil akhir tampil dalam N detik"; nothing during the other consequences. When the line docks, an outcome on screen moves up by the part the line covers (its end stays readable; on a short landscape screen the line is slimmer); the own rank is announced in the polite live region. Timers unchanged (consequence 10 s, host may continue after 4 s; leaderboard 7 s or host-paced, D-09). The projector keeps its ranking screen. | FR-D2, FR-C4; D-09, D-25; fix rounds 31 Oct + 1 Nov 2026 | Implemented; human usability open (REVIEW-HANDOFF §11.5) → Product |
| D-37 | Round start | Every round starts at its top (title, task, status), wherever the previous round's outcome and ranking or the lobby left the page: the round screen, keyed per round, scrolls to the top when it mounts. | Fix round 1 Nov 2026 | Implemented |
| D-38 | Task line | The header's task line ("Tugas: …") shows only while the round is read; once the options open, the question heads them in the decision area (where it also stands above the waiting note while reading). The CMS preview starts with the options open and shows no task line, as the room does then. | Fix round 1 Nov 2026 | Implemented |
| D-39 | Option form on screen | Option cards carry no form mark (replaces the "Tindakan" mark of D-31): the text says what an option does, and a mark singled out the action options before sending. In a chat, selecting an action option switches the confirm label to "Tetapkan tindakan" (else the round's label: `confirmLabelOf`), and the action is never shown as a sent message: in the sent state and in the outcome after close it is a note "Kamu: …" with "✓ Ditetapkan", never "Terkirim" (the consequence view and the summary carry `chosenForm`; summaries stored without it read `message`). In the other activities the form changes nothing on screen. | D-31; fix rounds 31 Oct + 1 Nov 2026 | Implemented |
| D-40 | Form guidance (`choice_form_hint`) | The form changes the chat confirm label and the sent note, so action options that are never tepat would form a learnable pattern. Validation warns (never blocks) on every action option when a scenario has at least 2 action options (`AUTHORING_HINTS.actionMarkMinOptions`) and none of them is tepat; the CMS shows the warning at the option's "Tindakan, bukan pesan" box. | D-31, D-34; fix rounds | Implemented; threshold = local default → Tim Story + Product |
| D-41 | Delayed effect before the status | In the outcome, the delayed effects that hit the round as it began ("Dampak tertunda di awal babak ini — …: status −n") come before the badge and the status line; the status change shown is measured from the round's start after that effect, so it is the own decision's change. | D-32; fix round 1 Nov 2026 | Implemented |
| D-42 | Built-in pictures | Built-in pixel backgrounds have no image file, so they cannot be a field scene or an evidence picture: validation errors `field_builtin_background` and `evidence_asset_builtin`; the CMS pickers for those offer uploaded pictures only (a stored built-in stays listed until changed) and link the asset library. Rounds of the other activities may still use a built-in background. | FR-A9; D-28, D-29; fix rounds | Implemented |
| D-43 | Marker safe range | One range for field markers, `SPOT_SAFE_RANGE` 6–94 % of the picture (`shared/story/content.ts`, `drawnSpotCoordinate`): the room draws markers within it and the CMS stores and draws spots within it (a dashed frame), so the author places what the room shows and no marker is clipped. A stored spot outside it (sanitize only clamps to 0–100) is drawn at the range's edge, and the CMS says so. Markers are small pins (30 px) with a 44 px tap area, hidden while answering on short landscape screens (the numbered list stays). | D-29; fix rounds | Implemented |
| D-44 | Neutral line ids | Room payloads name a round's public lines `p<pos>` (0..n−1) and a participant's own conditional lines `f<k>` (authored order); opening lines keep their authored id. The authored id of a round line never appears in a room payload, so neither an id nor a gap reveals hidden lines (extends D-33). | D-20, D-33; fix round 31 Oct 2026 | Implemented |
| D-45 | Unsaved work in the CMS; back/forward | While the editor holds unsaved changes, every way out asks first: tab close/reload (the browser's warning), a link to another page of the app, a control outside the editor (e.g. "Keluar") and a back/forward move (buttons, mouse, keys, gestures). Back/forward moves are held by a `popstate` listener added before the router (`client/src/historyHold.ts`). The app keeps its `BrowserRouter` and does not adopt a data router (`createBrowserRouter`, which brings `useBlocker`): the smaller change, as the router setup and every route, legacy ones included, stay as they are. A save already on its way is waited for (the way out goes ahead when it leaves nothing unsaved); saves run one at a time (no duplicate revision, no false 409); text typed during a save stays. | FR-A2, FR-A7; fix rounds | Implemented (pure parts unit-tested; no automated browser check) |
| D-46 | Staff session ending under the CMS | When a staff request is answered 401 (expiry or revocation) while the CMS is open, the CMS (`StaffShell` `resumable`) stays mounted under a non-dismissable sign-in dialog with the username filled in: the same staff member continues with the unsaved work intact (and saves again); another account restarts the tool, so unsaved work never passes to another account. Host and admin tools show the sign-in page as before. | D-14, FR-E3; fix round 1 Nov 2026 | Implemented (no automated browser check) |
| D-47 | Ending kind wording | Staff screens name the ending kinds "Akhir bahagia (happy ending penuh)", "Selesai dengan catatan" and "Kurang puas" (`ENDING_KIND_LABEL`, `shared/story/protocol.ts`): the CMS endings tab and preview and the admin results table; the validation messages use the same words. The CSV export keeps the stored kind (`happy`, `with_notes`, `unhappy`); participants read the room's words (kamus `ruang.akhir.*`). | FR-C5, FR-D5; fix round 1 Nov 2026 | Implemented |
| D-48 | Sent wording; projector evidence turns | After confirming, only a chat message reads "✓✓ Terkirim"; a chat action (note "Kamu: …") and every card decision of the other activities read "✓ Ditetapkan", as their button "Tetapkan tindakan" says (`DecisionTray` SentContent; a chat option the device cannot name stays "Terkirim"). The projector's evidence items take turns of the reading time shared out among them, between 6 and 10 s (`roundModel.evidenceTurnMs`; 10 s for one item or without a reading time), so every item is on the shared screen while the room reads (before: fixed 10 s turns could skip the last item of a short round). | FR-C4, FR-D2; D-36, D-39; novice re-check 2 Nov 2026 | Implemented |
| D-52 | Mode Cerita back as a main path (owner direction, 2 Nov 2026) | The owner chose the "Raksa dev" experience: Mode Cerita (solo, no timer, no leaderboard) is always available next to Join Game; `/kenalan`, `/cerita`, `/cerita/:episode` are registered in every configuration. This **deviates from the PRD room-only MVP**: the PRD lists "Mode bermain sendiri di luar room" under *Di Luar Lingkup (MVP)* and in the backlog (FR-F, Tahap 2), and the solo path keeps a device profile (name + avatar in localStorage) beyond "Pemain cukup mengisi nama per sesi". It is a product decision by the owner, not a claim of PRD compliance. Room rules (15 decisions, 30 s, score 70:30, all-answered close) stay in the event mode only and are not applied to solo episodes. Legacy practice missions and the legacy quiz remain behind `RAKSA_LEGACY=on`. | Owner brief 2 Nov 2026 §1 | Implemented |
| D-53 | Home & story list navigation | One Join Game card (surveyor icon, code field, button "Masuk") is the only join call-to-action: first on the home page and above the episode list on `/cerita`. Below it on the home page: one Mode Cerita door with the action "Mulai" (staff review #2). No "Latihan misi"/Mini Games door or "Cara main lain" block anywhere (owner direction replaces the earlier Mini Games request); the legacy open-event banner only fills the Join Game code field. | Staff review #1–#6, owner brief §4 | Implemented |
| D-54 | Episode 2 on the story engine | Episode 2 (real case, disguised) runs on the same engine, save format and screens as Episode 1 via data: a background stage (`Episode.latar`, sprites from the owner's assets), fact cards above replies (`dokumen`), numbered decisions with an end summary (`titik`), status clamp 0–100 (`kepercayaanBatas`), and activities with `langsung` (complete arrangement -> explicit ordered rules -> one of the five authored alternatives; the consequence is shown as dialogue, suggestions and reasons only in the end summary). The delayed promise effect (12 -> 14) is a dialog node effect, applied once on the transition. | Owner brief §5, §8 | Implemented |
| D-55 | Security boundary of solo episodes | Solo episodes are client-only: script, classifications and reasons ship in the client bundle and the end summary shows the suggested option. Episode 2 is the same case as the Auto 01 room scenario, so a deployment that runs that scenario competitively must be built with `VITE_CERITA_TANPA=auto-2` (the episode module is aliased to a null stub; verified: no script, keys or sprites in that build). Room mode keeps server authority (keys never sent before reveal). | Owner brief §8 | Implemented; deployment choice open -> Product/IT |
| D-56 | Episode 2 language | The Episode 2 script is a draft with 17 confirmation items pending, so it ships in Indonesian only (`Episode.bahasa = ['id']`); in other UI languages the story text falls back to Indonesian with a visible note. Translation waits for the approved script. | Script status (draft) | Open -> Story team |

## D-57 — Aktivitas Episode 2 memakai adegan Phaser (benda = tindakan), bukan panggung presentasional (2 Nov 2026)

> **Digantikan D-60 (2 Nov 2026, malam):** adegan Phaser Episode 2 dicabut; aktivitasnya kini arena HP. Isi di bawah
> dipertahankan sebagai catatan.

- **Konteks:** review 4360 ("Tambahan: Phaser pada Episode 2") memverifikasi aktivitas Episode 2 melewati GameStage
  (`scene: 'gambar'` + `MissionPlay.visual` = panggung latar SVG yang tidak menulis state), jadi pemain melihat ilustrasi
  dengan kontrol jawaban HTML terpisah.
- **Keputusan:** delapan aktivitas Episode 2 punya SceneSpec di engine yang sama dengan Episode 1
  (`client/src/game/scenes/cerita/auto-2/adegan.ts`): dokumen -> baki, kartu Mas Rudi -> lokasi di peta, bundel foto ->
  tujuan, kartu pemeriksaan -> slot rencana, kartu saksi -> baki, penanda perbedaan -> stempel, bundel + gelembung kabar,
  bagian pesan -> ponsel/keranjang. Ketukan menulis draf yang sama dengan daftar HTML; Kirim memetakan susunan ke satu
  alternatif naskah lewat node `langsung` (tanpa kuis kedua). Fitur engine opsional `SceneSpec.masukWadah` (salinan item
  terbang ke wadahnya) + warna stiker kategori ke-5. Daftar HTML tetap ada (keyboard/pembaca layar, engine gagal).
- **Batas:** adegan ikut dikeluarkan oleh `VITE_CERITA_TANPA=auto-2` (alias `./auto-2/adegan`). Label adegan Episode 2
  hanya Bahasa Indonesia (seperti naskahnya).

## D-58 — Kamera panggung latar & satu pusat komunikasi (2 Nov 2026)

- **Konteks:** review 4360 #1-#2 + review independen: di desktop panggung lebar memberi dinding kosong dan tokoh kecil
  (pita kosong di layar laptop), benda akibat (baki, surat) bisa di luar potongan HP, dan ponsel "panggilan video" berisi
  kepala Pak Hendra besar menggandakan avatar dialog padahal naskahnya WhatsApp.
- **Keputusan:** `ui/latar/bingkai.ts` membingkai tokoh + ponsel + benda akibat; desktop diperbesar & dipotong vertikal
  (kepala utuh), HP tetap tinggi utuh, lokasi `utuh` (tol) tidak dipotong. Ponsel menjadi layar OBROLAN kecil (tanpa
  wajah); wajah & kata lawan bicara hanya di kotak dialog. Sampul memakai `bingkai` (truk trailer + nasabah).

## D-59 — Label status kumulatif & draf aktivitas tersimpan (2 Nov 2026)

- **Label:** `Episode.labelSuasana: 'status'` (Episode 2) = label panggung menunjukkan pita status dari kepercayaan
  (Kecewa/Cemas/Tenang/Percaya/Puas, skala naskah), bukan ekspresi sesaat ("Bingung" adalah ekspresi). Episode 1 tetap
  `'wajah'` (perilaku v5.1 yang disetujui).
- **Draf:** susunan aktivitas yang belum dikirim disimpan per kunjungan (`raksa:cerita:draf`), dipulihkan setelah muat
  ulang, dihapus saat dikirim atau "Mulai ulang". Progres cerita tetap hanya berubah lewat aksi mesin (kirim = sekali).

## D-60 — Episode 2 memakai antarmuka HP (mobile-first), aktivitas = arena DOM/SVG (2 Nov 2026)

- **Konteks:** arahan pemilik "mobile-first untuk pemain awam": mayoritas bermain di HP, belum tentu terbiasa main game
  atau paham klaim. Antarmuka sebelumnya menampilkan bersamaan panggung dekoratif, kanvas Phaser, daftar jawaban HTML
  yang sama, kategori radio, dan beberapa tombol bantuan; aktivitas dokumen = delapan chip + centang + tiga radio
  ("8 dari 8 ditandai" terbaca seperti "semua benar"). Diukur di 390 px: 4 ketukan "Lanjut" sebelum keputusan pertama,
  12-17 kontrol terlihat di aktivitas pertama.
- **Keputusan:** `Episode.antarmuka: 'hp'` memakai pemain `cerita/hp/PemainHP.tsx` (HP dan desktop; desktop = kolom
  yang sama, lebih lebar). Satu pusat perhatian per layar: kepala ringkas (bagian + judul + Menu berisi Riwayat, Catatan
  kasus, Bantuan, bahasa, suara), satu kalimat tujuan, lalu SATU tampilan: obrolan, adegan, arena, atau akhir.
  Aktivitas = arena (`DefAktivitas.arena`, `cerita/hp/arena`) dengan pola sesuai adegan, bukan reskin sortir:
  `susun` (satu benda aktif "Dokumen 2 dari 8" + pertanyaan + wadah besar; umpan balik "X ditempatkan di 'Y'" + Ubah;
  ringkasan per baki; baru tombol kirim), `tujuan` (peta penugasan, teruskan foto, papan rencana), `bandingkan` (cap
  per perbedaan), `bundel` (periksa isi + tindakan + kabar), `pesan` (susun pesan WhatsApp). "Ditempatkan" bukan
  "benar": tanpa centang keberhasilan dan tanpa kunci sebelum dikirim. Susunan = MissionAnswer misi sintetis yang sama
  (draf per kunjungan), dikirim sebagai satu aksi `aktivitas` (`langsung`); tidak ada kuis kedua. Arena memakai DOM +
  SVG kode (gambar `Episode.seniArena`), bukan Phaser: target sentuh nyata >= 44 px tanpa penskalaan kanvas, teks
  terbaca tanpa zoom, keyboard & pembaca layar memakai elemen yang sama.
- **Dicabut:** SceneSpec Episode 2 (`game/scenes/cerita/auto-2`), `SceneSpec.masukWadah`, warna stiker ke-5, alias
  `./auto-2/adegan`. Episode 1 tidak berubah (antarmuka standar, adegan Phaser-nya tetap).
- **Validator:** episode `antarmuka: 'hp'` wajib punya arena untuk tiap aktivitas; item/wadah/opsi arena = isi langkah
  misi; gambar, tokoh, tabel/dokumen fakta, lampiran, dan kunci teks harus ada.

## D-61 — Obrolan WhatsApp = satu utas yang dimainkan; ketukan; umpan balik dipisah (2 Nov 2026)

- **Obrolan:** baris dengan lawan bicara jarak jauh = nasabah (`tata.telepon`) tampil sebagai SATU utas
  (`hp/alur.ts utasObrolan`, disusun dari riwayat, jadi muat ulang memulihkannya): pesan Pak Hendra masuk, balasan dan
  pesan hasil aktivitas pemain keluar ("Terkirim"), narasi = catatan kecil, foto/bukti = lampiran (`Baris.lampiran`),
  pilihan balasan di bawahnya. Ponsel dekoratif dengan gelembung kosong tidak dipakai di antarmuka HP. Pesan sesi lama
  dilipat ("Lihat pesan sebelumnya") tetapi tetap bisa dibaca; kepala obrolan (nama + status) tetap terlihat saat digulir.
- **Ketukan:** baris berurutan dengan tampilan sama dan tanpa perubahan tata tampil bersama (satu "Lanjut" per ketukan,
  bukan per kalimat): keputusan pertama tercapai dengan 1 ketukan (sebelumnya 4).
- **Umpan balik dipisah:** tindakan ("Tindakanmu: Mas Rudi → Pool Pak Hendra"), akibat cerita (baris node akibat),
  status ("Status Pak Hendra: Cemas → Tenang" / "masih Cemas, tapi membaik" + satu kalimat alasan, sesudah reaksi), dan
  pelajaran (layar akhir). Penilaian tepat/kurang/keliru tetap hanya di ringkasan akhir (D-54).

## D-62 — Tampilan daftar = jalur setara, bukan formulir kedua (2 Nov 2026)

- Arena punya dua tampilan yang memakai state, draf, dan penilaian yang sama: gambar (bawaan) dan daftar (teks
  sederhana, "Gunakan tampilan daftar"; preferensi per perangkat). Hanya satu yang tampil. Berpindah tampilan tidak
  menghapus susunan. Galat saat menggambar tampilan gambar = tampilan daftar + pesan singkat (error boundary).
- Mode cerita tanpa timer dan tanpa bonus kecepatan. Kirim dilindungi dari ketukan ganda (satu keputusan tercatat).

## D-63 — Episode 2 memakai ilustrasi halus + interior kantor pilihan pemilik (3 Nov 2026)

- **Konteks:** pemilik menyukai flow HP (D-60..D-62) dan meminta polish visual: aset baru `newasset` (potret Miss Raksa &
  Pak Hendra per ekspresi, badan penuh tokoh lain) dan interior pilihannya. Audit: tokoh panggung tampak berpiksel karena
  aturan `image-rendering: pixelated` berlaku untuk semua tokoh latar; Miss Raksa badan penuh bertepi cokelat.
- **Keputusan:** model `Episode.latar` diganti dari sprite piksel ke aset ilustrasi (`tokoh`: avatar & dekat per ekspresi,
  badan penuh; `tanpaAset`; `lokasi.ilustrasi`). Kantor = interior pilihan pemilik dengan lapisan meja depan dari gambar
  yang sama (tokoh di balik meja, tanpa meja ganda), bingkai HP/lebar sendiri, label netral "Layanan Klaim Raksa" sebagai
  UI. Lapangan tetap seni kode dengan badan penuh ilustrasi. Rendering halus untuk ilustrasi; seni piksel Episode 1 tidak
  berubah. Berkas per resolusi (srcset), dimuat saat dipakai, ganti ekspresi tanpa kedip.
- **Dicabut:** sprite piksel Episode 2 (`seni/auto-2/*.png`, `sprite.json`, `bangun-sprite-auto2.mjs`) dan `PotretSprite`.
- **Kekurangan diakui:** polisi tanpa aset (siluet/inisial), ekspresi tertentu belum ada (lihat
  `docs/cerita/aset/ILUSTRASI-AUTO2.md` bagian 6).

## D-64 — Lokasi lapangan Episode 2 bergambar ilustrasi; seni kode lapangan dicabut (3 Nov 2026)

- **Konteks:** pemilik menambah aset `reasset` (dua pose polisi, truk trailer ringsek, latar pool/bengkel/tol/ruang
  wawancara) dan meminta polisi menggantikan siluet, trailer menggantikan truk kecil, serta komposisi HP yang rapi.
- **Keputusan:** semua lokasi `Episode.latar` wajib `ilustrasi`. Tokoh lokasi lapangan = `berdiri` (badan penuh, skala dari
  perspektif gambar), truk = `benda` berkedalaman, tulisan papan/rambu & nomor lajur dari kode (bukan teks hasil generasi;
  lajur di gambar tidak bisa dihitung pasti, jadi nomor lajur = diagram UI). Kamera lapangan mengikuti subjek dan menjaga
  kepala/papan di luar pita label. Konfigurasi terpusat per lokasi di `seni/auto-2/ilustrasi/index.ts`.
- **Dicabut:** `ui/latar/seni.tsx` (dunia SVG 720 x 225), `ui/latar/bingkai.ts` (+ tesnya, diganti tes `ilustrasi.test.ts`),
  ponsel obrolan di panggung, `latar.sampul.bingkai`, `tanpaAset: ['polisi']`, kunci teks papan nama lama.
- **Polisi:** gambar `reasset` tanpa atribut kepolisian; dipakai sesuai arahan pemilik, identitas dari nama pemeran,
  dibedakan jelas dari petugas tol (lihat `docs/cerita/aset/ILUSTRASI-AUTO2.md`).
- **Arena susun:** sesudah benda pertama ditempatkan, konteks dilipat ("Pesan & info tugas"), fakta kunci
  (`KonfigArena.catatan`, mis. surat polisi masih diurus) tetap terlihat; jumlah per wadah hanya bila > 0.
- **Label akhir:** kartu akhir menyebut ambang akhir (Puas = status akhir >= 70), bukan "rentang Puas (70-100)"; legenda
  grafik status diberi judul "Rentang suasana" (Puas 80+). Aturan skor, pita suasana, dan ambang akhir tidak berubah.

## D-65 — Presentasi visual novel selektif untuk Episode 2 HP (3 Nov 2026)

- **Konteks:** pemilik menyukai flow dan mockup tiga layar (percakapan, cut-in, aktivitas). Review build reasset: polisi masih
  terbaca petugas keselamatan, rambu tol seperti panel overlay & diagram 1-4 tanpa posisi kendaraan, tiga tokoh wawancara
  berjajar tanpa nama/pembicara jelas, fakta surat polisi diulang dua kali, label lipat tanpa affordance.
- **Keputusan:** adegan tatap muka = panggung 4:3 (HP) + kotak dialog menyatu di bawah gambar (tab nama/peran, pembicara
  disorot, kamera lapangan setengah badan saat bicara, papan nama tokoh). Chat WhatsApp tetap chat; cut-in potret hanya untuk
  `Episode.cutIn` (kecemasan awal k01, tanggal 20 k12, protes janji k14 bila 12-A, penyelesaian), sesaat & tidak mengunci
  input. Bukti rambu dipisah dari ilustrasi: lembar bukti (`DokumenCerita.skema`) dengan rambu terbaca + diagram lajur & truk
  di lajur 2 menurut supir, bisa diperbesar, tanpa warna kesimpulan; diagram lajur di panggung dicabut. Arena: fakta surat
  polisi tidak diulang saat kartunya aktif; lipatan berchevron. Tanpa typewriter (teks langsung), tanpa timer.
- **Tidak berubah:** 15 keputusan & lima alternatif, makna, konsekuensi, skor, mood, ambang akhir, janji 12 -> 14, progres,
  draf, fallback daftar & aset, Episode 1.
- **Aset belum sesuai:** polisi berseragam Polri, beberapa ekspresi, pose duduk (`docs/cerita/aset/ILUSTRASI-AUTO2.md` bagian 8).

## D-66 — Ritme & kepadatan layar HP Episode 2: beat, panggung adaptif, satu wajah utama (3 Nov 2026)

- **Konteks:** review build visual novel: beberapa layar HP lebih panjang (panggung 4:3 global + kartu bertumpuk), pembuka satu
  blok panjang, cut-in menambah banner di samping avatar yang berulang, papan nama permanen di wawancara. Acuan komposisi =
  mockup tiga layar pemilik (bukan sumber konten).
- **Keputusan:** satu ketukan adegan = satu beat bermakna (penutur/ekspresi baru = beat baru; narasi menempel), pembuka jadi
  tiga beat Miss Raksa (salam, kasus, cara bermain). Tinggi panggung adaptif per beat. Lanjut/tugas di dalam kotak dialog;
  tindakan & status = baris; pilihan tanpa kartu. Wawancara: kamera mengikuti pembicara, nama & peran di kotak dialog, baris
  "Hadir" untuk yang lain; papan nama dicabut. Obrolan: tanpa avatar per gelembung; cut-in menggantikan wajah (gelembung
  menumpang potret, avatar kepala disembunyikan). Arena susun dibuka ringkas (briefing sudah dibaca di obrolan) dengan benda
  aktif lebih besar.
- **Tidak berubah:** teks naskah, 15 keputusan & lima alternatif, penilaian, mood, ambang akhir, janji 12 -> 14, progres, draf.
- **Ukuran:** perbandingan sebelum/sesudah di 390 x 844 (`rksgm-uji-auto01/episode2/bukti/ritme`).

## D-67 — Kejelasan tindakan Episode 2: bundel bertahap, akibat per sisi, kosakata tetap (3 Nov 2026)

- **Konteks:** bermain langsung di HP (toolbar browser memakan layar): bundel pengajuan menumpuk dua keputusan di satu
  halaman, pilihan kabar tampil seperti gelembung hijau terkirim, "Lengkapi dulu: 1 lagi" tidak menyebut apa yang kurang,
  dan akibat satu kalimat untuk beberapa kombinasi (mis. "belum mengabari" padahal kombinasi lain mengabari).
- **Keputusan:** bundel (K11) = tiga langkah dengan satu fokus: periksa berkas (map dengan slot per kelompok berkas,
  "6 dari 7 kelompok berkas tersedia", slot surat polisi netral, daftar lengkap bisa dibuka) -> tentukan tindakan (pilihan
  satu kolom, pengingat isi berkas di dekatnya) -> kabari nasabah (rencana + Ubah, pilihan pesan yang belum terkirim,
  satu pratinjau "belum dikirim", tombol konfirmasi yang labelnya mengikuti pilihan). State jawaban, opsi, kunci, dan
  pemetaan ke alternatif TIDAK berubah (tes: sembilan kombinasi = alternatif lama). Tiap kombinasi punya node akibat
  sendiri (`KOMBINASI_BUNDEL`, `k11-<akhiran>`) dengan baris berlabel `Baris.topik` "Berkas" dan "Kabar untuk Pak Hendra";
  kabar terkirim = akibat di obrolan sesudah pesan terkirim, tanpa kabar = di kantor. Hasil keputusan: "Kenapa: <alasan>"
  dulu, perubahan status sebagai baris kecil sesudahnya. Kosakata: dipilih (belum dijalankan), draf (pesan disusun),
  tersedia (ada di berkas), terkirim (sudah sampai). Alasan tombol terkunci menyebut yang belum diisi. Ubin tujuan satu
  kolom di HP; laci stempel ringkas; draf pesan K15 bingkai putus-putus (bukan hijau terkirim); fakta tugas terlihat di
  arena (tidak dilipat); akibat & catatan node kini di obrolan tidak dilipat; ikon centang/silang di baki dan papan
  "lengkapi" diganti ikon arti netral (centang tidak boleh terbaca sebagai jawaban benar); `scroll-padding-top` agar
  fokus/gulir tidak berhenti di bawah kepala lengket.
- **Tidak berubah:** 15 keputusan & lima alternatif, skor, mood, ambang akhir, janji 12 -> 14, progres, draf. Teks akibat
  K11 lama dipertahankan di tabel teks agar riwayat simpanan lama tetap terbaca.

## D-68 — PROTOTIPE meja kasus K11 (Phaser), terisolasi di balik bendera build (3 Nov 2026)

- **Konteks:** babak bundel pengajuan (K11) masih terasa seperti formulir bertahap. Pemilik meminta satu babak dicoba
  sebagai pekerjaan kasus: periksa objek, temukan kekurangan, lakukan tindakan pada objek, kabari nasabah, lihat dunia
  merespons, sebelum pola ini diperluas.
- **Keputusan:** `KonfigArena` pola bundel boleh membawa `meja` (berkas seurutan tabel fakta, tempat per pilihan tindakan,
  status pengajuan). Build `VITE_MEJA_KASUS=1` (vite `define __MEJA_KASUS__`) menampilkan `cerita/hp/meja/`: adegan
  Phaser baru di atas fondasi engine yang sama (`prefetchEngine`, `rasterize`, sentuhan tidak menahan gulir, lepas konteks
  WebGL), ketuk objek -> ketuk tujuan (tanpa seret), panel HTML (lembar bawah) untuk berkas, tempat, kontak & ringkasan,
  lapisan tombol HTML di atas kanvas untuk keyboard / pembaca layar, tampilan daftar = jalur tanpa engine / engine gagal.
  SATU sumber state: draf meja (`logika.ts`: jawaban {tindakan, kabar} + jejak pemeriksaan di `_meja`), konfirmasi = satu
  aksi mesin `aktivitas`, layar hasil dibaca dari state mesin (`akibatMeja`). Klik tiruan sesudah ketukan kanvas ditelan
  350 ms. Build biasa tidak memuat kode meja; `?k11=lama` di build prototipe = versi K11 sekarang untuk pembanding.
- **Tidak berubah:** pemetaan sembilan kombinasi ke alternatif A-E & node akibat (tes), skor, mood, ambang akhir,
  Episode 1 & babak lain. Narasi akibat e2 diperjelas (kabar "tahap persetujuan" padahal berkas belum diajukan).

## D-69 — K08 menjadi aktivitas arena `rambu`; arah visual dari ekspor Claude Design (14 Nov 2026)
- **Keputusan:** Titik K08 ("Rambu di lokasi") bukan lagi lima balasan percakapan, melainkan aktivitas arena `rambu` (`hp/arena/ArenaRambu.tsx`,
  logika murni `hp/arena/rambu.ts`): satu adegan jalan dan satu petunjuk pada satu waktu. Ketuk rambu 1 -> tandai lajur -> ketuk rambu 2 -> tandai
  lajur -> kesimpulan kepada Pak Bima (lima kalimat naskah, urutan naskah c, e, a, d, b). Nomor lajur dan posisi truk ("menurut supir") terlihat sejak
  awal. Rambu yang sudah dibuka bisa dilihat/diubah lagi tanpa kehilangan kemajuan. Jalan bertanda tetap terlihat saat menyimpulkan.
- **Tetap:** id node `k08`, kelima alternatif A-E, node akibat `k08-a..e`, tanda ringkasan `kep:k08:<alt>`, status naskah (-6/-3/+6/0/0), catatan
  kasus. Hasil cabang HANYA dari kesimpulan (`akt:rambu:pilih:<alt>`); tanda lajur tidak mengubah percabangan (tes). Kunci rambu 2 sengaja kosong:
  tafsir "lajur kiri" belum dikonfirmasi (naskah). Versi episode tidak dinaikkan: simpanan lama (K08 belum/sudah dijawab sebagai pilihan) tetap termuat (tes).
- **Susunan & simpanan:** tanda lajur = langkah assign per rambu (`r1`, `r2`; item `r1l1..r1l4`, wadah `tanda`), kesimpulan = langkah single `simpul`;
  dipersist lewat draf aktivitas yang sama dengan arena lain; langkah layar disimpan per kunjungan (kunci `raksa:cerita:langkah-arena`). Kirim = SATU aksi mesin.
- **Tanggapan:** sesudah dikirim, Pak Bima mencocokkan tanda rambu 1 dengan TULISAN rambu (lajur yang disebut, dibaca dari teks naskah) dan dengan kesimpulan
  pemain; hanya perbandingan ("Tulisan rambunya menyebut lajur 3 dan 4", "mana yang kamu maksud?"), tanpa kata benar/salah, tanpa hasil klaim. Dibaca dari
  jawaban tersimpan (`RingkasRambu`), jadi benar setelah muat ulang dan saat bab diulang. Rambu 2 tidak pernah dibandingkan.
- **Aset & gaya:** aset ASLI dari ekspor ada di `client/src/cerita/lokasi/seni/` (SVG, geometri, font Plus Jakarta Sans + lisensi OFL; README di folder itu).
  Antarmuka HP Episode 2 memakai font dan palet itu lewat `.hp-layar` saja (Episode 1 dan mode lain tidak berubah). Satu deklarasi font (`seni/font.css`).
- **Teks DRAF (butuh tinjauan Tim Claim):** semua `arena.rambu.*`, `akt.rambu.*`, dan catatan bukti K10 (`arena.selisih.*.catatan`, `faktaLipat`,
  `akt.selisih.cerita` yang tidak lagi menyebut "kecil"). Isi kasus tetap dari naskah.
- **Batas yang diketahui:** (1) akibat naskah K08-C ("Pak Bima mengangguk...") tetap tampil walau tanda pemain bertentangan dengan kesimpulannya; tanggapan
  mendahuluinya. (2) Latar ilustrasi lokasi tol (aset lama) memuat tulisan kedua rambu pada papan di gambar, jadi bunyi rambu sudah terbaca sebelum diperiksa.
  (3) Prototipe /kejadian (pertanyaan klarifikasi) belum diintegrasikan: alternatif K10 tetap lima perlakuan naskah.

## D-70 — K09 rencana wawancara berpotret; K10 catatan bukti; Riwayat memuat tindakan (14 Nov 2026)
- K09: ringkasan rencana wawancara menampilkan potret + nama + peran tiap orang (kartu tetap pola susun; pemetaan A-E tidak berubah).
- K10: tiap perbedaan memuat catatan bukti (yang diketahui dan yang belum, mis. "Dalam kutipan ini hanya catatan tol yang memuatnya. Belum diketahui apakah catatan
  polisi memuat hal serupa"); fakta pokok semua saksi dilipat ("Fakta yang disepakati semua saksi"); teks tugas tidak menyebut perbedaan "kecil".
  Pemetaan perlakuan -> alternatif tidak berubah.
- Riwayat: di bawah "Dijalankan" kini ada satu kalimat tindakan pemain untuk aktivitas berarena (mis. "Rambu 1: lajur 3 dan 4. Rambu 2: lajur 1."); Episode 1 tanpa perubahan.

## D-71 · K08: tanda lajur bertentangan dengan kesimpulan "tidak melanggar" (integrasi desain, 14 Nov 2026) — MENUNGGU KEPUTUSAN OWNER

Masalah: bila pemain menandai lajur truk (2) sebagai lajur terlarang Rambu 1 lalu memilih kesimpulan C ("Tidak melanggar"), game menampilkan dua kartu
"Pak Bima bertanya ... mana yang kamu maksud?" sekaligus baris akibat naskah K08-C ("Pak Bima mengangguk ... pertanyaan penting sudah terjawab") dan alasan
"Satu pertanyaan penting terjawab", ditambah status naik (+6). Pesan menumpuk dan saling bertentangan.

Yang SUDAH diubah (hanya tampilan, `PemainHP.tsx`): dalam keadaan bertentangan itu, teks `k08-c.1` dan `k08.c.alasan` diganti `k08-c.konflik` dan
`k08.c.alasanKonflik` (netral: "temuan ini perlu ditinjau lagi sebelum dipakai"). Tanpa pertentangan, teks naskah asli tetap. Berlaku juga di Riwayat. Teks DRAF.

Yang TIDAK diubah (butuh keputusan substansi owner / Tim Claim): efek mesin alternatif C tetap +6 kepercayaan, percabangan tetap ke K09, tidak ada penilaian
Rambu 2, hasil klaim tidak disentuh. Akibatnya baris status "Percaya -> Puas" (naik) masih tampil di keadaan bertentangan dan terasa janggal di samping teks netral.

Opsi untuk owner: (1) biarkan seperti sekarang; (2) delta C = 0 dan alasan status "tetap" saat bertentangan (perlu aturan baru di mesin dan tes);
(3) minta pemain menyelesaikan pertentangan dulu (ubah tanda/kesimpulan) sebelum boleh dikirim. Rekomendasi desain: (2) atau (3). Jangan mengubah tafsir "lajur kiri" Rambu 2 (belum dikonfirmasi).
