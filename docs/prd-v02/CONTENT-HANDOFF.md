# Content readiness handoff — what only the business owners can supply

The platform is implemented locally; **official content is not ready**. The PDFs contain no approved, anonymized settled
cases with five-choice rubrics, so this work used two synthetic demonstration scenarios. Nothing below has been
approved; no reviewer names, signatures or dates were invented.

## What exists (synthetic, for testing only)

| Scenario | Source | Status in a dev DB | Use |
| --- | --- | --- | --- |
| `[DEMO] Baret di Parkiran Pasar` | `server/src/story/seed/demoBaret.ts` (reuses the fictional Bu Rina / Miss Raksa characters and the v5.1 office/parking stage) | draft; published only by `story:dev-setup --publish-demo` = **simulated approval** by test identities | engine, UI and report verification |
| `[DEMO] Mobil Terendam Banjir` | `server/src/story/seed/demoBanjir.ts` | same | same |

Both are 15 rounds × 5 choices with tepat / kurang tepat / keliru classifications, accuracy weights, mood deltas,
consequences, reasons, timeout consequences and three endings (happy / with notes / fallback). They are marked
`contentSource = demo`, excluded from competition reports by default, and labelled "DEMO" on the host, projector and
participant screens. **They must not be used for a real competition.** Known authoring weakness to fix in real content:
in the demos the recommended choice is often the longest sentence — real rubrics should vary length/wording so the
answer cannot be guessed from form.

## Decisions and inputs needed (with owners)

| # | Needed | Owner (PRD) | Blocks |
| --- | --- | --- | --- |
| C-1 | Two approved Auto settled cases for Testing 1, rewritten into 15 rounds × 5 choices (storyline) | Tim Story + Tim Storyline (DL #9) | official scenarios, App. B.5 |
| C-2 | Answer key per choice (tepat / kurang tepat / keliru), accuracy weight for "kurang tepat", reasons | Komite gabungan (DL #7, FR-A5) | publication of official versions |
| C-3 | Customer-state design per case: initial mood, mood deltas, ending thresholds (mood AND score) | Tim Storyline + Komite | endings that reflect the intended lesson |
| C-4 | Anonymization rules and the person who approves them (names, policy/claim numbers, workshops, surveyors, places, dates) | Legal + Tim Story (FR-E6, open #12, #15) | publishing any settled case (the CMS requires a recorded check) |
| C-5 | Approval of the provisional score policy `story-70-30-v2`, active for new rooms (flat speed points `round(300·s)` whenever accuracy > 0, no longer scaled by accuracy; rounding, ties, no late grace — SCHEMA-AND-SCORING.md, D-07). Decisions stored under the first release's `story-70-30-v1` keep their points and are never recalculated | Komite + Product (DL #6) | treating scores as official |
| C-6 | National winner rule across rooms/scenarios and winner identity verification | Product + Panitia + Legal (open #2, #4) | prizes, "national leaderboard" |
| C-7 | Final visual style, asset list and rights for the two Auto scenarios (backgrounds, characters/expressions, BGM, video, photos) | Product Management (DL #12) | replacing built-in pixel art if desired |
| C-8 | Brand guide (logo from the Raksa Game 917 logo contest, colors, typography, tone) | Marketing (FR-E5, open #13, #14) | final UI branding |
| C-9 | Data retention for names/results, privacy notice wording review | Legal + Product (open #11) | production use |
| C-10 | Who may host rooms (staff only vs brokers/agents) | Product (open #8) | host account provisioning |
| C-11 | Decision on Mini Games / solo story visibility in the release (staff review #3/#5 vs PRD B.3) | Product | `RAKSA_LEGACY` setting |
| C-12 | Cargo category request (staff review #10) | Product | category roadmap |

## How the owners use the platform once inputs exist

1. System admin creates real staff accounts (ROLES-AND-PROVISIONING.md) and uploads approved assets with rights metadata.
2. Authors write each scenario in `/cms` from blank (CMS-GUIDE.md), using the preview and the path check.
3. Reviewers (committee members, not the authors) record the anonymization evidence and publish.
4. Hosts open rooms from the published versions; the competition admin defines periods and exports results.
