# Evidence (PRD v0.2 + staff review)

All runs below used **isolated database copies** (SQLite backup API copies of `data/raksa-game.db`) and local ports;
the real database was never written (hash re-checked). Browser runs are Chrome emulation on one Windows machine —
not real phones, not production.

| Folder / file | What | Produced by |
| --- | --- | --- |
| `baseline/` | before-change state: typecheck/test/build logs and 19 screenshots (landing, join, lobby, host, projector, rounds, story, solo, `/admin` & `/cms` redirecting home) | baseline capture script (main @ ff38b52) |
| `e2e/` | acceptance run screenshots per phase/viewport + `hasil.json` (every check with pass/fail and detail) | `tools/uji-room-cerita.mjs` |
| `hosting/` | iframe/prefix harness screenshots + `hasil.json` | `tools/uji-hosting-harness.mjs` |
| `load/` | bounded load test JSON (machine, config, latencies, skew, errors) | `npm -w @raksa/server run story:loadtest` |
| `legacy/` | legacy mode regression (`RAKSA_LEGACY=on`) screenshots/logs | `tools/uji-temuan-review.mjs F`, screenshots |
| `keyboard/` | keyboard-only join + answering (8 checks) and screenshots | `tools/uji-keyboard-room.mjs` |
| `restart/` | rooms/results/dashboard before and after stopping the server during a running room, recovered room row, startup log | restart check on a DB copy (REVIEW-HANDOFF §8) |
| `checks/` | final typecheck/test/build/bundle-scan logs (`*-client-final.log` = client rerun after the last presentational fix) | `npm run typecheck`, `npm test`, `npm run build`, `tools/uji-bundel-kunci.mjs` |
| `e2e/proyektor-label-nama-desktop.png` | projector stage label after fix A6 (name only, no mood word) | targeted check on the final build |

Viewports: 360×740 (DPR 1), 390×844 (DPR 2), 844×390 landscape (DPR 2), 1440×900 desktop (DPR 1); one participant runs
with `prefers-reduced-motion: reduce`; one run blocks all images to prove the text fallback.
