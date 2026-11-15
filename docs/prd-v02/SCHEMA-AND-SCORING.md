# Schema, migration and score policy

## Database (SQLite, same file as the legacy game)

Migrations live in `server/src/story/db/migrations.ts` and run at server start inside one transaction per migration;
applied versions are recorded in `schema_migrations`. Migration v1 (`story-room-mvp`) is **additive**: it creates new
tables only and never alters or reads the legacy tables (`matches`, `match_players`, `match_rounds`, `soal_kustom`).
`PRAGMA foreign_keys = ON` is set for the connection.

| Area | Tables | Notes |
| --- | --- | --- |
| Staff & audit | `staff_users`, `staff_roles`, `staff_sessions`, `audit_log` | scrypt hashes; session token stored as SHA-256; audit rows are append-only |
| Content | `story_categories`, `story_assets`, `story_asset_variants`, `story_scenarios`, `story_scenario_drafts`, `story_scenario_revisions`, `story_scenario_versions`, `story_scenario_events` | drafts keep the working copy + optimistic revision; every save is a revision; versions are immutable (content JSON + SHA-256 hash, reviewer, note, anonymization evidence, withdrawal) |
| Competition | `story_periods`, `story_rooms`, `story_participants`, `story_room_rounds`, `story_decisions` | a room stores scenario id, version id/no, content hash, title, kind (demo/official), score policy, lifecycle timestamps, status and close reason; participants store the credential HASH, totals, rank, ending and the final summary JSON; rounds store scene/answering/deadline/close timestamps, close reason and eligible/answered counts; decisions store choice id, outcome, accuracy weight, server receipt time, elapsed ms, component points, mood before/after and score policy id |

Seeded rows: categories `auto` (active), `hvc`, `property` (inactive); built-in assets for the pixel locations
(meja, parkiran, telepon), the two pixel characters and the two built-in BGM tracks.

Uploaded asset files: `<dirname(DB_FILE)>/aset-cerita/<sha256-prefix>.<ext>` (served at `/aset-cerita/*` with strict file
names, `nosniff` and a sandbox CSP). Back them up together with the database.

### Migration on a copy of existing data (verified)

`npm run story:dev-setup` was run against a backup-API copy of the existing `data/raksa-game.db`
(SHA-256 `563b8019…`): migration v1 applied, legacy rows unchanged (matches 3, match_players 4, match_rounds 13,
soal_kustom 0), and the original file was left untouched (hash re-checked). Evidence: `evidence/e2e/` run notes.

### Rollback

- Code: restore the backup working tree (`C:\Users\User\Desktop\rksgm-backups\20261030-154546-before-prd-v02\RESTORE.md`)
  or check out the previous commit. The old code ignores the new tables, so a migrated database still works with it.
- Data: restore `data/raksa-game.db` from the backup snapshot (consistent SQLite backup) and remove `-wal`/`-shm`.
  There is no down-migration; dropping the `story_*`, `staff_*`, `audit_log` and `schema_migrations` tables returns the
  file to the legacy schema if ever needed (export results first).

## Scenario content JSON (schema v2, `shared/story/content.ts`)

Scenario content is stored as JSON (drafts, revisions, versions), so content schema v2 needed **no database
migration**. `sanitizeScenarioContent` (`shared/story/validate.ts`) runs on every load and save: it upgrades v1 JSON in
memory (missing fields get their defaults, `schemaVersion` becomes 2), clamps and caps the new lists and drops unknown
values. Stored JSON and published content hashes are never rewritten; a v1 version validates and scores exactly as
before and plays in the activity it names (`stage` when it names none). The additive fields of the first real
scenario import (cast, opening lines, `{nama}`, `meta`, `keyRound`, flags `setsFlag` / `flagEffects` / `ifFlag`,
author notes, optional customer portrait, ending kind `unhappy`) are unchanged.

| Object | v2 field (default) | Meaning |
| --- | --- | --- |
| round | `layout` (`stage`) | `chat` \| `dossier` \| `field` \| `stage` (v1 knew `stage` and `chat`); DECISIONS D-28 |
| round | `evidence` (`[]`) | ≤ 5 items shared by all options (D-29) |
| round | `respondent` (`null`) | `{ speaker, castId }` who reacts after the decision; a narrator is stored as `null` (D-30) |
| choice | `form` (`message`) | `message` \| `action`, display only (D-31) |
| evidence item | `id`, `kind`, `assetId` (`null`), `spot` (`null`), `rows` (`[]`) | kinds `document`, `checklist`, `timeline`, `compare`, `photo` (unknown → `document`); `assetId` = an uploaded asset of kind photo or background (a built-in background has no file: `evidence_asset_builtin`); `spot` = `{x, y}` in percent of the round background, clamped to 0–100 by sanitize (non-numbers → `null`); the room and the CMS draw it within `SPOT_SAFE_RANGE` 6–94 % (`drawnSpotCoordinate`), and the CMS stores new spots there (one decimal), D-43 |
| evidence row | `id`, `mark` (`none`) | `none`, `ok`, `pending`, `missing`, `check` ("perlu dicek"); unknown → `none` |

New id prefixes: `v` evidence item, `w` evidence row (same `CONTENT_ID_PATTERN`, no dots).

| Text key (per locale) | Required | Max | Shown |
| --- | --- | --- | --- |
| `round.<r>.action` | no | 24 | confirm button; empty = the activity's default word |
| `round.<r>.lesson` | no | 220 | public once the round's answers are closed |
| `round.<r>.choice.<c>.reply` | no | 220 | the respondent's words, only to whoever chose `c` |
| `round.<r>.timeout.reply` | no | 220 | the same, on timeout |
| `round.<r>.ev.<e>.title` | yes | 40 | evidence opener and sheet title |
| `round.<r>.ev.<e>.kicker` | no | 24 | label above the title instead of the kind word (e.g. "Surat", "Lokasi"); empty = the kind word |
| `round.<r>.ev.<e>.body` | for `document` | 500 | multiline text |
| `round.<r>.ev.<e>.row.<w>` | per row of a list kind | 120 | row label |
| `round.<r>.ev.<e>.row.<w>.value` | no | 120 | time, value or the other side of a comparison |
| `flag.<f>.label` | no | 80 | how private reminders and the summary name the flag |

Every new text gets the existing checks (limit, no markup, `{nama}` as the only placeholder, identifier warnings, all
enabled locales). Line breaks survive only in multiline keys (synopsis, ending texts, consequences, reasons, evidence
bodies); elsewhere sanitize turns a line break or tab into one space.

Validation added with v2 and its fix rounds (Indonesian messages naming the round, field paths for the CMS):
- errors: `evidence_id_invalid`, `evidence_id_duplicate`, `evidence_count` (> 5), `evidence_rows` (a list kind needs
  1–12 rows), `evidence_row_id_invalid`, `evidence_row_id_duplicate`, `evidence_asset_missing` (photo without a
  picture), `evidence_asset_unknown` (picture missing, archived, or not a photo/background), `evidence_asset_builtin`
  (a built-in background as an evidence picture: it has no file), `text_missing` for evidence titles, document bodies
  and row labels, `dossier_empty` (desk without evidence), `field_no_spot` (field round without a spotted item),
  `field_builtin_background` (field round on a built-in background: no picture, so no scene and no markers),
  `respondent_cast_unknown`, `placeholder_in_title` (`{nama}` in the scenario or a round title: titles show raw on
  staff reports and in the CSV);
- warnings: `evidence_rows_unused` (rows on a document or photo), `chat_no_contact` (a chat with neither an
  unconditional customer/cast line nor a customer/cast respondent; an officer respondent is the player's own side, not
  a contact), `reply_without_respondent`, `flag_multi_round`, `choice_form_hint` (on every `action` option when a
  scenario has at least `AUTHORING_HINTS.actionMarkMinOptions` = 2 of them and none is tepat, D-40), and the option
  audit below.

The live consequence view and every decision of the stored final summary carry `chosenForm` (`message` | `action`,
the form of the own choice; `message` on timeout), so a chat shows an own action as a note (D-39); a summary stored
before the field reads `message` (`withSummaryDefaults`). The ending kinds keep their stored values (`happy`,
`with_notes`, `unhappy`); staff screens word them "Akhir bahagia (happy ending penuh)", "Selesai dengan catatan" and
"Kurang puas" (`ENDING_KIND_LABEL`, `shared/story/protocol.ts`; the CSV keeps the stored kind, D-47).

## Option audit (`shared/story/audit.ts`)

Authoring guidance only: it feeds validation warnings, the CMS "Audit pilihan" panel and the private audit script, and
never affects scoring, endings or publication (DECISIONS D-34).

- `words` = whitespace-separated tokens of an option text (`{nama}` is one word); `chars` = Unicode code points.
- `rankLongest` = 1 + the number of options with MORE characters (equal lengths share the better rank; 1 = longest).
- Round: `recommendedRank` = best rank of a tepat option (0 = none); `recommendedIsLongest` / `recommendedIsShortest`
  = a tepat option has rank 1 / the minimum length; `tieAtTop` = several options share the longest length.
- Scenario: blind strategies "longest" (always the most characters) and "shortest" (always the fewest). A tie is a
  uniform pick among the tied options: `tepatWorst` counts rounds where every tied pick is tepat, `tepatBest` rounds
  where at least one is, `tepatExpected` = Σ tepat picks ÷ tied picks, `expectedPoints` = Σ mean round score of the
  tied picks under the ACTIVE policy at `elapsedMs` (default 15 000), kurang tepat weights included. Expected values
  are rounded to 2 decimals; an out-of-range accuracy (unfinished draft) counts 0 points.
- Warnings per locale (`AUTHORING_HINTS`): `choice_long` = more than 20 words; `choice_length_hint` = a tepat option
  with `rankLongest` 1 and at least 1.5 × the median characters of the other options; `lesson_long` = more than 30
  words. `AUTHORING_HINTS` also holds the bound of `choice_form_hint`, a scenario-wide check in `validate.ts`.
- The CMS marks each strategy against ≤ 5/15 tepat (judged on `tepatBest`), the bound used for the first real Auto
  scenario: a design check, not statistical evidence of an unbiased rubric.

## Score policy `story-70-30-v2` (active, provisional, `shared/story/scorePolicy.ts`)

```
a = choice accuracy weight in [0,1]   (tepat = 1, keliru = 0, kurang tepat strictly between — validated)
s = clamp(1 − elapsedMs / 30000, 0, 1)   elapsedMs = server receipt − server start of the answer window
accuracyPoints = round(700 · a)
speedPoints    = a > 0 ? round(300 · s) : 0       (v1: round(300 · a · s))
roundScore     = accuracyPoints + speedPoints          (max 1000; session max 15 000)
timeout / no answer → 0 (no speed points), author's timeout consequence applied once
```

Fixtures (unit-tested in `server/src/story/domain.test.ts`): a=1 at 0 s / 15 s / 30 s → 1000 / 850 / 700; a=0.5 at
0 s / 15 s → 650 / 500; a=0.25 at 30 s → 175; a=0 → 0; timeout → 0; invalid inputs throw. Two participants with the
same accuracy (> 0) and different times get different scores (PRD App. A). The deadline is inclusive at the server;
there is no grace for late packets and no client-provided time is used. 70:30 is the maximum allocation of the two
components; an individual score need not show that ratio.

v1 (`story-70-30-v1`, speed scaled by accuracy) was the first release's policy; v2 follows the scoring rule of the first
real Auto scenario script (DECISIONS D-07). The gameplay change set and its fix rounds (D-28–D-47) leave v2 unchanged:
evidence, option forms, replies and lessons never touch points, and the option audit only reads the policy to estimate
strategy points.

Ranking: cumulative total; equal totals share the rank ("1224") and are flagged `tied`; display order breaks ties by
accuracy points, then time, then name. No sixteenth/tiebreak round exists.

Historical legacy results keep their own 1000+300 rule (not recalculated). Every story decision row stores the policy
id, so decisions stored under v1 keep their v1 points and a future policy change stays auditable.
