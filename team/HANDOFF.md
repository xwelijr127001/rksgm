# HANDOFF (Fullstack -> QA)

## T-xxx — <title>  (date)
- Changes: files/features
- How to test: steps, URL/port
- Build: command / build ID
- Known issues:

## T-002 — Rename "Senior Layanan Klaim" -> "Layanan Klaim" (2026-11-15)
- Changes (literal replacements only, 3 languages: Senior Layanan Klaim -> Layanan Klaim, Senior Claims Officer -> Claims Officer, 资深理赔专员 -> 理赔专员):
  - `client/src/i18n/kamus/tokoh.ts` (missRaksa.jabatan id/en/zh + header comment)
  - `shared/brand.ts` (TOKOH.missRaksa.jabatan)
  - `client/src/cerita/episode/auto-1/teks.id.ts`, `teks.en.ts`, `teks.zh.ts` (pemeran.missRaksa.peran)
  - `client/src/cerita/episode/auto-2/teks.id.ts` (pemeran.missRaksa.peran)
  - `client/src/cerita/uji/episodeUji.ts` (pemeran.mentor.peran, all three language blocks)
  - `client/src/cerita/tipe.ts` (doc comment example)
  - `docs/cerita/TINJAUAN-PIC-CLAIM.md` (pemeran.missRaksa.peran row + term T13 wording; "menunggu konfirmasi PIC / Corporate Communication" note and status untouched)
  - `docs/rancangan-mode-cerita.md` line 509 (tracked doc quoting the old title; not in the spec list but covered by "every occurrence" + the docs grep sweep)
- Render surfaces (verified by reading code): homepage bubble `client/src/art/WelcomeArt.tsx:55` -> `namaTokoh('missRaksa')` -> `t('tokoh.missRaksa.jabatan')` (`client/src/game/KarakterTokoh.tsx:20-25`) => "Miss Raksa · Layanan Klaim" / "· Claims Officer" / "· 理赔专员". Story cast/dialog: `cerita/ui/bagian.tsx:37` reads `pemeran.*.peran`, shown in `KotakDialog.tsx:159` and `Aktivitas.tsx:241`. No hub title added on `/cerita` (N-4).
- How to test: `npm run test:client` from repo root; open `/` and switch id/en/zh, check the greeting bubble; open an episode and check Miss Raksa's role under her name in the dialog box.
- Test output: `npm run test:client` -> `# tests 724 / # pass 724 / # fail 0`.
- Grep sweep: `grep -rn "Senior Layanan Klaim\|Senior Claims Officer\|资深理赔专员" client shared server docs tools` returns ZERO hits in tracked source/docs. The only remaining hits are UNTRACKED generated files, left untouched on purpose: stale local build output (`client/dist-game`, `client/dist-uji`, `server/dist-uji` are gitignored; `client/dist-kejadian`, `client/dist-meja` are untracked and not ignored) and old e2e evidence logs (`docs/prd-v02/evidence/e2e/hasil.json`, `run.log`, untracked). They disappear on the next build / e2e run; QA decides whether to rebuild or delete them.
- Build: not rebuilt (no commit per task).
- Known issues: none.

## T-003 — phone layout (2026-11-15)

Fullstack · status: review · not committed. Followed DESIGN-REVIEW D-01..D-13; D-13 item 5 CSS used as written, no deviations.

Changes per file (diff vs pre-T-003 snapshot in `team/evidence/T-003/base/`; `git diff --stat` vs HEAD is larger because the tree already held earlier uncommitted work):
- `client/src/pages/Landing.tsx` (+4/-2): `<div className="lp-seni"><WelcomeArt/></div>` moved to the FIRST child of `main.lp-utama`; `.lp-kiri` kept; comment. One greeting bubble. ModeCerita/"Mulai" untouched.
- `client/src/art/WelcomeArt.tsx` (+3): `<div className="lp-kota-bingkai">` wraps the svg; figcaption stays outside as the next sibling.
- `client/src/player.css` (+29): new block after the landscape rule, every selector under `.lp-halaman` / `.player-ui.lp-halaman`: desktop grid placement (>=901), tablet `.lp-seni` width, <=700 phone rules (frame cap min(40vw,190px), h1 38px, `.lp-isi` clip-hidden, eyebrow 11px, Join title 20px, code 20px/.08em/8px), <=359 stacked form + frame hidden, short portrait / banner / landscape hides. No base `.lp-join*` rule changed, no new colors/shadows/radii/animation.
- No other source file changed (git status count outside team/ unchanged: 121 before and after). `npm run build` regenerated build output (dist folders) for e2e.

How to test: `cd client && npx vite --port 5233` (dev client, still running on :5233), open `/`. Evidence script: `node team/evidence/T-003/shoot.mjs after` (puppeteer-core + Chrome, writes PNGs + `after-ukur.json`).

Tests:
- `npm run test:client` -> tests 724 / pass 724 / fail 0.
- `npm run test:e2e` (after `npm run build`, server `RAKSA_LEGACY=on npm start` on :4000) -> exit 0, "kegagalan: 0", "console/http bermasalah: 0", landing 360 luberX 0px, tombol<44px 0. Log: `team/evidence/T-003/e2e.log`, shots `team/evidence/T-003/e2e-shots/`.

Measurements (headless Chrome, isMobile):
- 360x740, id/en/zh x profile absent/present (6 combos): Masuk bottom = 566 in all; code input y 510-566 fully visible; no horizontal scroll. Frame 78-222 (144px), greeting 230-290, h1 327-405, Join 417-582.
- DPR 1/2/3 at 360x740: identical (frame 144px = 40vw, greeting outside the frame).
- "WWWWWW": scrollWidth == clientWidth at 320 (234, stacked), 360 (147), 375 (162), 390 (177), 430 (217): no clipping. Before the fix it was 139/159 at 360 and 154/159 at 375.
- 320x640: frame hidden, stacked, Masuk bottom 525. 390x844: 578. 430x932: 594. 800x1024: art 114-447, Masuk 921. 740x360 / 844x390: `.lp-seni` hidden, Masuk 334.
- Desktop 1280x800: before and after PNG byte-identical (md5 b83b1e75...). /cerita hub 390 full page: before and after byte-identical (md5 87487539...); hub JoinGame computed style unchanged (code 22px, ls .2em, pad 10px 12px, title 21px).

Screenshots (`team/evidence/T-003/`): after-320x640, after-360x740, after-390x844, after-430x932, after-800x1024, after-740x360, after-844x390, before-1280x800, after-1280x800, before-cerita-390, after-cerita-390, after-WWWWWW-360, after-WWWWWW-375 (.png); before-ukur.json, after-ukur.json.

Known issues / not tested:
- Real legacy banner (`alur-ada-spanduk`, one open room) NOT tested: the D-04(c) rule is in but unverified live; banner "Gabung" fill + focus unchanged in code. QA should verify at 360x740 and 375x667.
- DPR tested via headless emulation only, not on a real DPR 1/3 device.
- Reading order: on desktop the screen reader now hears the greeting before the headline (accepted in D-01).
- /cerita still clips "WWWWWW" (shared JoinGame, out of scope -> T-005).

## T-005 + T-006 — JoinGame hub clipping, placeholder contrast, landscape banner (2026-11-15)

Fullstack · status: review · not committed. Only `client/src/player.css` changed (+20/-1). JoinGame.tsx and Cerita.tsx untouched (existing `cer-hub-join` class was enough).

Changes:
- T-005: in the existing `@media (max-width:700px)` T-003 block, added sibling `.player-ui .cer-hub-join .lp-join-kode { font-size:20px; letter-spacing:.08em; padding:10px 8px }`. At 320 the side-by-side hub field is only 115px (needs 130), so in the `<=359px` block the hub form also stacks like the homepage (D-10): `.cer-hub-join .lp-join-form {flex-direction:column}` + Masuk `justify-content:space-between`. >700px unchanged.
- D-17: base `.player-ui .lp-join-kode::placeholder` colour #b7c3b2 -> `var(--tinta-lembut)` (#5f6f64, ~5.4:1 on #fffefa; theme token, all pages).
- T-006 (D-15 option a): `@media (orientation:landscape) and (max-height:500px) and (max-width:1000px)`, scoped `.lp-halaman`: banner becomes the compact top pill (same treatment as >=1001px: absolute, top 10px, radius 28/22, no shadow, `alur-turun` existing animation), max-width calc(100% - 352px) = measured gap between logo and header controls at 640-900; no bottom scroll padding in that state.
- D-16: `<=359px` + `.lp-halaman.alur-ada-spanduk`: `.lp-join-isi` visually hidden (clip pattern).

How to test: dev client `cd client && npx vite --port 5233`. Evidence script `node team/evidence/T-005-006/ukur.mjs <before|after>` (run it from a folder where puppeteer-core resolves, e.g. copy it to tools/ and set OUT; it MOCKS `/api/config` legacy=true and `/api/acara-terbuka` one room N7EQ via request interception, so the banner is the real component with mocked data; set MOCK=0 against a real legacy server).

Tests: `npm run test:client` -> 724 / pass 724 / fail 0. `npm run build` + `RAKSA_LEGACY=on npm start` (:4000) + `npm run test:e2e` -> exit 0, kegagalan 0, console/http bermasalah 0, landing 360 luberX 0. Log `team/evidence/T-005-006/e2e.log`.

Measurements (before -> after):
- /cerita "WWWWWW" client/scroll width: 320 107/159 clipped -> 242/242 (stacked); 360 147/159 clipped -> 155/155; 375 162 -> 170; 390 177 -> 185; 430 217 -> 225; 1280 727 unchanged (26px). No clipping after.
- Homepage unchanged: 360x740 field 147, Masuk bottom 566; 320x640 Masuk 525; 1280 Masuk 515. Only the placeholder colour differs.
- Banner (mocked room): 844x390 before banner top 310 over Masuk 277-334 -> pill y10-64, no overlap; 740x360 before top 280 overlap -> pill y10-64, no overlap; 640x360 pill y10-69, Masuk 226-282. 360x740 banner y666-730, Masuk 510-566, hero shown (= QA). 375x667 banner y593-657, Masuk 366-422, hero hidden (= QA). 1280 pill unchanged. Gabung fills N7EQ and focuses Masuk at every size. No horizontal scroll.

Screenshots (`team/evidence/T-005-006/`): before-/after- cerita-WWWWWW-360, -390; home-360x740, -320x640, -1280x800; banner-844x390, -740x360, -640x360, -320x568, -360x740, -375x667, -1280x800 (.png); before-/after-ukur.json; e2e-shots/.

Known issues:
- LOW, accepted by Lead (option C): 320x568 + legacy banner, Masuk bottom 501 vs banner top 487 -> bottom 14px of Masuk under the banner (centre y473 tappable, page scrolls). D-16 assumed banner top ~482 and Masuk 525; hiding `.lp-join-isi` only saved 24px. Greeting kept per D-04.
- Banner tested with mocked API responses, not a live open room; QA should re-check with a real room.

## T-004 — game-feel hero + CTA (2026-11-15)

Fullstack · status: review · not committed. Followed DESIGN-REVIEW D-21..D-35 and specs/T-004-hero-art.txt; D-35 CSS used as written. One placement detail: the block sits BEFORE the T-003 block in player.css (not after), and the T-003 phone frame rule became `display:block; height:min(40vw,190px)`, so the T-003 hide rules (<=359, short portrait, banner, landscape) still win by source order. No other deviation.

Changes per file (vs pre-T-004 copies in team/evidence/T-004/base/):
- `client/src/art/WelcomeArt.tsx` (+59/-33): old city `<svg className="lp-kota-gambar">` removed. `.lp-kota-bingkai` now `aria-hidden="true"` and holds `LatarHero` (svg `.lp-latar` 420x190), ONE slot (`<SpriteTokoh tokoh="missRaksa" tinggi={120} />` when `TOKOH.missRaksa.aktif`, else `.lp-kota-slot.lp-kota-slot-raki` with `<Raki size={88} mood="sapa" />`), and `MejaHero` (svg `.lp-meja` 420x54) drawn over the sprite. The Designer generator (section C) is ported 1:1 into typed rect lists plus the stepped-disc path, so the geometry is identical. Figcaption/bubble unchanged. Imports: `SpriteTokoh` (KarakterTokoh), `Raki` (./Raki). No forbidden imports. tokoh.ts/tokoh.css/KarakterTokoh untouched.
- `client/src/player.css` (+51/-3): the D-35 hero, CTA, Mode Cerita grid (<=700) and reduced-motion block, all under `.lp-halaman`. The T-003 `.lp-kota-gambar` phone rule and the now-unused base `.lp-kota-gambar` rule were removed.
- `client/src/pages/Landing.tsx`: NOT changed (CSS alone was enough for D-29). shared/brand.ts: flag flipped only for the test, then restored; byte-identical to its pre-task (T-002) state.

How to test: dev client `cd client && npx vite --port 5233`, open `/`. Evidence script: copy `team/evidence/T-004/shoot.mjs` to tools/ (puppeteer-core resolves there) and run `node tools/shoot.mjs <label> all|img|cerita|raki`.

Tests: `npm run test:client` -> tests 724 / pass 724 / fail 0. `npm run build` + `RAKSA_LEGACY=on npm start` (:4000) + `npm run test:e2e` -> exit 0, kegagalan 0, console/http bermasalah 0, landing 360 luberX 0 / tombol<44 0 (team/evidence/T-004/e2e.log).

Fold at 360x740 (Masuk top+56): id 565.7 / 565.7, en 565.7 / 565.7, zh 565.7 / 565.7 (profile absent / present). Frame 20-340 x 78-222 (144), no horizontal scroll. Others: 390x844 577.7, 430x932 593.7, 800x1024 777.9 (frame 420x190), 320x640 525.3 (frame hidden), 740x360 334.1 (hero hidden), 1280x800 Masuk 457.7-514.7 and h1 141-261 (unchanged), frame 512x380. Mode Cerita card at 360/390/430: 139.4 px tall, grid layout.

DPR 1 / 2 / 3 at 360x740: sprite 125.5,85 61x184 in all three; counter svg y167-221 hides her legs (palms visible above it); greeting 230-290 below the frame. Desktop 1280 and 901: sprite 122x368.

Budget (D-31, N-5), vite build report gzip column:
- (a) index CSS 9.94 -> 10.41 KB (+0.47); JoinGame chunk (holds WelcomeArt) 1.93 -> 1.89 (-0.04); Landing 1.34 -> 1.34; PlayerShell 0.99 -> 0.98; KarakterTokoh 1.09 -> 1.09; index JS 227.60 -> 227.60; tokoh css/js unchanged. Logs: build-before.log, build-after.log.
- (b) Image requests on `/` at 360x740, cache disabled (dev client): before `/favicon.svg`, `/karakter/miss-raksa-besar.webp`; after the same two. The sprite sheet is requested once, 0 new images.
- (c) Delta about +0.42 KB gzip against the 30 KB limit.

Motion matrix 360x740 (emulated prefers-reduced-motion x `?gerak=`):
| system | gerak | frame anim | sprite anim | CTA transition | frame opacity |
|---|---|---|---|---|---|
| no-pref | ikut | lp-masuk | tokoh-sambut-mr | 80 ms | 1 |
| no-pref | penuh | lp-masuk | tokoh-sambut-mr | 80 ms | 1 |
| reduce | ikut | none | none | ~0 | 1 |
| reduce | penuh | lp-masuk | tokoh-sambut-mr | 80 ms | 1 |
The hero is visible in all four; with reduce on it is never stuck at opacity 0.

Flag off (missRaksa.aktif=false, local only): Raki 88px at 360 (112,100), 176px at 1280; bubble = slogan only; Mode Cerita card shows PotretRaki. Screenshots flagoff-raki-360x740.png (full page), flagoff-raki-1280x800.png. Reverted (cmp identical with base/brand.ts).

/cerita 390 full page: before and after md5 identical (ce85009a...), same capture settings.

Screenshots (team/evidence/T-004/): after-320x640, after-360x740, after-390x844, after-430x932, after-800x1024, after-740x360, after-1280x800, after-901x720, after-dpr1/2/3-360x740 (top 320px), before-cerita-390, after-cerita-390, flagoff-raki-360x740, flagoff-raki-1280x800 (.png); after-ukur.json, flagoff-ukur.json, before-ukur.json (image list), e2e-shots/.

Known issues:
- flagoff-raki-360x740.png (full page) caught the 300 ms entrance fade, so the hero looks pale there; the steady state is opacity 1 (measured). Other shots use a 1.5 s wait.
- DPR checked by emulation only; real devices and fractional DPR/zoom are left to QA (D-33 watch items).
- The image list was taken on the dev client, not the production preview; the gzip numbers come from the production build report.
- The /cerita Masuk keeps the old style (accepted in D-26 until the later restyle).

## T-007 — homepage polish (2026-11-15)

Fullstack · status: review · not committed. Items R-10, D-36, D-37, D-38; D-39 not in scope.

Changes (vs pre-T-007 copies in team/evidence/T-007/base/):
- `client/src/player.css` (+6): R-10 adds `.lp-halaman .lp-kota-bingkai::before` / `::after` to the guarded reduced-motion list. D-37 adds `.lp-halaman .lp-kota-slot .tokoh-sprite { filter: none; }` (homepage hero only). D-38 adds `.lp-halaman .lp-kota-balon.lp-kota-balon-tanpa-potret::before { display: none; }`.
- `client/src/art/WelcomeArt.tsx` (+3/-2): D-36 changes `windows(34, 108, 4, 3)` to `(3, 3)`. D-38: the bubble gets `lp-kota-balon-tanpa-potret` when `!miss`.
- `team/specs/T-004-hero-art.txt` (+3/-2): generator line updated, the three x=70 window rects removed from static block A, rev note on line 2.
- shared/brand.ts: flag flipped for the test only, then restored; `git diff shared/brand.ts` shows only the T-002 title change. No other file changed (121 non-team status entries, unchanged).

How to test: dev client `cd client && npx vite --port 5233`, open `/`. Script: copy team/evidence/T-007/shoot.mjs to tools/ and run `node tools/shoot.mjs after` (or `flagoff` with aktif=false).

Tests: `npm run test:client` -> tests 724 / pass 724 / fail 0. `npm run build` + `RAKSA_LEGACY=on npm start` + `npm run test:e2e` -> exit 0, kegagalan 0, console/http bermasalah 0, landing 360 luberX 0 / tombol<44 0 (team/evidence/T-007/e2e.log).

Measurements: 360x740 id Masuk 509.7-565.7 (unchanged), frame 320x144, no horizontal scroll; 800x1024 frame 420x190, Masuk bottom 777.9; 1280x800 Masuk 457.7-514.7. Computed sprite filter = none at all three sizes. Flag off: bubble class `lp-kota-balon lp-kota-balon-tanpa-potret`, ::before display none; flag on: tail still shown (block).

Screenshots (team/evidence/T-007/): after-hero-360x740, after-hero-800x1024 (tower windows 3x3, clear of the outline), after-sprite-dpr1-zoom (sprite over the sun, no shadow), flagoff-bubble-360x740 (Raki, slogan bubble without tail), after-360x740, after-800x1024, after-1280x800 (.png); after-ukur.json, flagoff-ukur.json.

Known issues: none new. D-39 stays accepted.

## T-008 — phone alignment (2026-11-15)

Fullstack · status: review · not committed. Followed DESIGN-REVIEW D-40..D-47 exactly.

Changes (`git diff --stat` vs HEAD 2f779f7: WelcomeArt.tsx 7 lines, player.css 9 lines; team/specs is untracked, so its diff is vs team/evidence/T-008/base/):
- `client/src/art/WelcomeArt.tsx`: D-42 changes. Sun `disc(186,112,56)` -> `disc(210,112,56)`; backdrop tree (rects 236/226/222/228) deleted; counter plant x +16 (248/250/252/246/250); right cloud `cloud(318,14)`.
- `client/src/player.css`: D-42.5 removes `padding-right:48px` from `.lp-halaman .lp-kota-slot` and `padding-right:96px` from its >=901 override. The D-47 block (bubble `flex:1 1 auto; max-width:none` at <=900, header padding 20px at <=700) is added after the T-004 block, before T-003.
- `team/specs/T-004-hero-art.txt`: generator (section C) updated the same way, static blocks A/B regenerated from it, rev note on line 3.
- shared/brand.ts: flag flipped for the test, then restored; it equals HEAD (the Lead's commit 2f779f7 already contains the T-002 title).

How to test: dev client `cd client && npx vite --port 5233`. Script: copy team/evidence/T-008/shoot.mjs to tools/, `node tools/shoot.mjs after` (DPR 2).

Tests: `npm run test:client` -> tests 724 / pass 724 / fail 0. `npm run build` + `RAKSA_LEGACY=on npm start` + `npm run test:e2e` -> exit 0, kegagalan 0, console/http bermasalah 0, landing 360 luberX 0 / tombol<44 0.

Measurements (before -> after):
| | bubble gap to frame right | sprite centre / frame centre | logo left / sound gap | Masuk bottom | gaps frame>greeting>eyebrow, h1>Join |
|---|---|---|---|---|---|
| 360x740 | 14.7 -> 0 (340) | 156 -> 180 / 180 | 22/22 -> 20/20 | 565.7 -> 565.7 | 8/16/12 -> 8/16/12 |
| 390x844 | 44.7 -> 0 (370) | 171 -> 195 / 195 | 22/22 -> 20/20 | 577.7 -> 577.7 | 8/16/12 -> 8/16/12 |
| 800x1024 | 79.4 -> 0 (610) | 376 -> 400 / 400 | 40/40 unchanged | 777.9 -> 777.9 | unchanged |
| 1280x800 | unchanged (desktop) | 876 -> 924 / 924 | 80/80 unchanged | 514.7 -> 514.7 | unchanged |
No horizontal scroll. Frame 144 px at 360. /cerita 390 full page: before and after md5 identical (10d35d4c...).
Flag off (missRaksa.aktif=false, local only): Raki centre 180 = frame centre 180; bubble spans to 340.

Screenshots (team/evidence/T-008/): before-/after- 360x740, 390x844, 800x1024, 1280x800; after-hero-zoom-360 (sun behind head, plant between arm and tower); after-hero-375 / -390 / -412 (top edge, no cloud sliver); before-/after-cerita-390; flagoff-360 (.png); before-/after-/flagoff-ukur.json.

Known issues: none.

## T-010 — Episode 2 asset loading + first-visit loader (2026-11-15)

Fullstack · status: review · not committed. Followed spec rev 2, the Codex re-review notes and DESIGN-REVIEW D-51..D-60. Deviations are listed under "Decisions".

### Changes per file
- `client/src/cerita/ui/latar/PanggungLatar.tsx`: new opt-in prop `gerbang`. When it is on, the world gets a group-readiness gate (`useGrupSiap`):
  - Every `<img>` in the world at group start must load and `decode()` OK, or settle as failed (error event, decode rejection, naturalWidth 0). That covers the background, foreground, starting characters and the trailer object.
  - The key is lokasi + rounded world width + starting `hadir` id:ekspresi. A change before ready restarts the gate and ignores stale completions; after ready the world never hides again. A 6 s cap reveals whatever is ready.
  - `data-siap` is set once. `data-gagal-latar` is set while the background is failed or still missing: the placeholder stays as the room, and is removed if the background lands later.
  - The placeholder `.cer-ilustrasi-kabur` (the location thumbnail) is the first child of the world. The pill `.cer-memuat` (`layar.menyiapkanAdegan`, aria-hidden) is a sibling inside `.cer-panggung`. Both are removed 300 ms after the reveal.
  - After the reveal it dispatches `raksa:adegan-siap` and records whether the warm-up picked the same variant as the scene.
  - Camera maths are unchanged; the calculation moved verbatim into `ukuranDunia`.
- `client/src/cerita/ui/latar/latar.css`: the D-56 CSS, scoped to `.cer-ilustrasi[data-gerbang]` (see Decisions), plus the reduced-motion block in the `data-gerak` pattern.
- `client/src/cerita/hp/AdeganTatap.tsx`: passes `gerbang`. It warms the NEXT location only after the current scene is revealed, using the mounted stage size. `komposisiBerikut` finds that location with a breadth-first walk over the script's `tata` cues.
- `client/src/cerita/ui/latar/hangatkan.ts` (new):
  - `ukuranDunia`: the single camera-width calculation, used by both the scene and the warm-up.
  - `hangatkanGambar`: off-DOM Image with sizes and srcset set before src, then decode and read currentSrc. At most 2 decoded images are held; requests are deduplicated; everything is invalidated on a resize, orientation or DPR change; it runs from an idle callback with a timeout fallback; cancelling suppresses stale results.
  - Also `hangatkanKomposisi`, `komposisiBerikut`, `perkiraanPanggung`, `catatCocok` and `sesudahAdeganSiap`. Test hook: `window.__raksaHangat`.
- `client/src/cerita/ui/latar/hangatkanDaftar.ts` (new): warms the first composition of each `latar` episode (from saved progress or the start state). The starting character is downloaded but not held decoded. Builds with AUTO-2 disabled warm nothing.
- `client/src/pages/Cerita.tsx`: the list page calls `hangatkanEpisodeAwal()`, cancelled on unmount.
- `client/src/pages/Landing.tsx`: mounts `<PemuatAwal/>`. The Mode Cerita card warms on pointerenter/focus through a dynamic import, so episode data stays out of the homepage bundle.
- `client/src/components/PemuatAwal.tsx` (new): the D-57/58/60 loader.
  - Portalled to `<body>`, so the status text sits outside `#root`. While shown, `#root` gets `inert` and `aria-busy`.
  - Essentials = the sheet `BASE_URL/karakter/miss-raksa-besar.webp` (naturalWidth > 0 + decode; skipped when Miss Raksa is inactive) and `document.fonts.ready`.
  - Dismisses at the 2000 ms cap (counted from first mount), when the essentials are ready, or when loading them fails.
  - `sessionStorage raksa:loader:v1` means "dismissed this session". Reads are wrapped in try/catch; blocked storage means no loader.
  - Skipped when the essentials are already ready, or for reduced-data / Save-Data.
  - StrictMode-safe: one deadline, full cleanup, late results ignored.
  - `inert` is removed at the start of the 200 ms fade; the overlay unmounts after 260 ms.
- `client/src/player.css`: the D-60 CSS.
- `client/src/ui/halaman.ts`: new `tahanFokusJudul()` hold. `useHalaman` waits for it before trying to focus the h1. `coba()` refuses an h1 inside `[inert]`, and the observer also watches the `inert` attribute. Focus policy is unchanged (a cold load moves no focus).
- `client/src/i18n/kamus/umum.ts`: new key `umum.menyiapkan` (id "Menyiapkan…", en "Preparing…", zh "正在准备……").
- `client/src/cerita/tipe.ts`: `LokasiIlustrasi.kabur?: string`. `cerita/seni/auto-2/ilustrasi/index.ts` fills it from the generated `kabur.ts`.
- `client/src/cerita/seni/auto-2/ilustrasi/kabur.ts` (generated) + `tools/cerita/bangun-kabur-auto2.mjs`: the ffmpeg recipe from T-010-kabur-thumbs.txt. 2,826 B for 5 locations, identical to the Designer's sizes.
- `tools/ukur-aset-t010.mjs` (measurement harness) and `tools/cek-pemuat-t010.mjs` (loader and Part A state checks).
- `client/index.html`: unchanged in the end; see Decision 4.

### Decisions (please review)
1. The D-56 CSS is scoped under `[data-gerbang]`. Unscoped, `.cer-ilustrasi:not([data-siap]) > * { opacity: 0 }` would hide every other `PanggungLatar` (episode card, activities) forever.
2. The required group also includes the trailer object (`benda`) on field locations, so nothing pops in on its own after the reveal.
3. `aria-busy` is on `#root` (the content being prepared), not on the overlay. On the overlay it would mute the status announcement inside it.
4. The D-59 preload hint was implemented, measured and then REMOVED. With it, the 7 KB sheet is always complete before the ~730 KB entry JS has run, so by the "skip when ready" rule the loader never showed on a cold `/` (smoke run: no loader). That contradicts "cold `/` shows the loader".
5. zh: with legacy mode OFF, `main.tsx` deliberately switches zh to id. So the zh loader text was checked on a `RAKSA_LEGACY=on` server.

### How to run
1. Build and start: `npm run build && npm start` (port 4000).
2. Measure: `node tools/ukur-aset-t010.mjs <label> [--runs 5] [--journeys a,b,c] [--vp 360,390] [--frames] [--fail-latar]`. Output goes to `team/evidence/T-010/<label>/`: `hasil.json`, `ringkas.md`, `frames-*` jpg series, and 50 ms state samples from run 0.
3. Harness settings: Chrome via puppeteer-core; a fresh incognito context per run with cache enabled; CPU 4x; `Network.emulateNetworkConditions` at 200,000 B/s down / 94,000 B/s up / 150 ms, set before navigation; a fixed 3 s dwell on /cerita.
4. Loader checks: `node tools/cek-pemuat-t010.mjs`. Start the server with `RAKSA_LEGACY=on npm start` to cover zh and /acara/*.

### Before / after (median / p95 of 5, ms; b = from the click on Episode 2 "Mulai", c = from navigation)
| journey | vp | metric | before | after |
|---|---|---|---|---|
| b | 360 | stage mounted | 1992 / 2005 | 1987 / 2006 |
| b | 360 | first visible room treatment | 4054 / 4062 (real bg) | **1987 / 2007** (blurred room, same frame as the dialogue) |
| b | 360 | final bg+fg+character | 4054 / 4062 (one by one) | **2013 / 2046** (one group reveal) |
| b | 390 | first room treatment | 4339 / 4347 | **2243 / 2253** |
| b | 390 | final | 4378 / 4400 | **2278 / 2283** |
| c | 360 | dialogue visible | 9582 / 9631 | 9646 / 9666 |
| c | 360 | first room treatment | 11781 / 11806 | **9649 / 9668** (blurred room) |
| c | 360 | final | 11781 / 11806 | 11874 / 11885 |
| c | 390 | first room treatment / final | see before/ringkas.md | 9645 / 9672 · 12195 / 12216 |
| a | 360 | LCP | 5064 / 5080 | 5188 / 5196 |
| a | 360 | bytes / requests | 795,056 / 18 | 804,738 / 19 |

Full tables: `team/evidence/T-010/before/ringkas.md`, `after/ringkas.md`, and `after-b/ringkas.md` (journey b rerun with the final cache-hit rule; its b numbers are the ones shown above).
- **Room visible:** about 2.1 s earlier in both b and c.
- **Final reveal:** b is about 2.0 s faster thanks to the warm-up. c is unchanged within ~100 ms: a cold direct entry downloads the same bytes, and the layers now appear as one group instead of one by one, so the reveal waits for the slowest layer.
- **Warm-up cache hits (after-b):** the scene background was never requested again after the click in 5/5 runs at 360 and 5/5 at 390. Under a stricter rule ("download finished before the click") it is 5/5 at 360 and 0/5 at 390: at DPR 3 the warm-up download is still in flight at the end of the 3 s dwell, and the scene reuses it (reveal 20-35 ms after the stage mounts).
- **Background variants downloaded on journey b:** pool-latar-1100 (the existing list-card cover), kantor-latar-1672 (the scene, once), pool-latar-1672 (next-location warm-up, after the reveal). That is one variant per scene layer; the card cover is a separate download that already happened before T-010.
- **Loader on journey a** (200 KB/s, no preload): shown at ~5150 ms (after the JS has run), dismissed ~50 ms later when the essentials are ready, gone ~300 ms later.
- **Loader checks** (unthrottled, sheet held 1.5 s):
  - Shown at ~400 ms and dismissed when the sheet decodes (~1.2 s on screen).
  - `#root` is inert while shown and not inert after dismissal; the status text is outside `#root`; id, en and zh texts are correct.
  - Second visit in the same session: no loader.
  - Sheet never arrives: dismissed 1989-2002 ms after mount; frame at 20,78 320x144 and Masuk bottom 565.7, so no layout jump.
  - Reduced motion: bar animation none, no transition.
  - Not mounted on /host, /projector, /join, /cerita, /cerita/auto-2, /kenalan or /acara/join (legacy on).
  - User navigation /cerita → "/": the h1 gets focus only after the overlay is gone (t 2771 = overlay removed). A cold load moves no focus (existing policy).
- **Part A states:**
  - Backgrounds return 404: `data-gagal-latar` is set, the blurred room stays at opacity 1, the pill is removed, Miss Raksa is visible, and "Lanjut" advances the dialogue (`pemuat/adegan-latar-404-360.png`, `gagal-latar/` frames).
  - `?gerak=ikut` with reduced motion: instant swap, no transition. `?gerak=penuh`: 0.24 s fade.
- **Homepage JS+CSS gzip** (build report, homepage chunks): 251.74 → 255.05 KB = **+3.31 KB** (limit 10 KB).
- **Regression:**
  - The T-008 numbers are identical on the production build with the loader skipped: 360 Masuk 565.7, gaps 8/16/12, sprite centre 180; 390 577.7; 800 777.9; 1280 514.7.
  - /cerita at 390: the only difference from the T-008 shot is a wider language button. The dev server was proxying a legacy-ON API, so the zh option exists. No T-010 code touches that layout.

### Tests
- `npm run test:client`: 724 tests, 724 pass, 0 fail.
- `npm run build` + `RAKSA_LEGACY=on npm start` + `npm run test:e2e`: exit 0, kegagalan 0, console/http bermasalah 0, landing 360 luberX 0 (`team/evidence/T-010/e2e.log`).

### Evidence (team/evidence/T-010/)
- `before/` and `after/`: hasil.json, ringkas.md, akhir-*.png, plus frame series `frames-b-360`, `frames-b-390`, `frames-c-360`, `frames-c-390` (jpg files named by ms).
- `after-b/`: journey b with the final warm-up rule.
- `gagal-latar/`: the 404 run with frames.
- `pemuat/`: loader screenshots (360 id, 390 en, 1280 zh), the cap case, reduced motion, Part A states, hasil.json.
- `regresi-*.png/json`, `build-after.log`, `e2e.log`, `before.log`, `after.log`.

### Known issues
- On a cold `/` over a slow link the loader appears only after the ~730 KB entry JS has run (about 5.1 s), then stays for about 50-70 ms plus the 200 ms fade, so it reads as a short flash. The JS download itself cannot be covered (Codex note). Designer to decide: keep it, add a minimum on-screen time, or only show it after a delay.
- LCP on journey a is about 120 ms later (the overlay plus 3.3 KB). On journey c, LCP now follows the group reveal, because hidden images are not LCP candidates.
- Cold direct entry (c): the final reveal is unchanged because the group waits for the slowest layer; the gain there is the room-visible time.
- The list-card cover (pool 1100) is still downloaded by the existing episode card.
- `komposisiBerikut` warms the nearest location change found by a breadth-first walk. On branching choices it may warm the wrong branch: one wasted download, never a wrong display.
- Not scripted, left to QA: real devices, the 0.8 Mbps matrix, and the scene change to pool/tol (D-55).

### T-010 fix round (2026-11-15)

Fullstack · status: review · not committed. Every item below is done and verified on the production build (`RAKSA_LEGACY=on npm start`, :4000).

| Item | Status | What changed |
|---|---|---|
| D-61 (high) | done | Scene pill renamed `.cer-memuat` -> `.cer-adegan-memuat` in latar.css (incl. `[data-selesai]` + reduced motion), PanggungLatar.tsx and both harness scripts. cerita.css / CeritaMain.tsx untouched. Measured: pill 30.3 px tall at 320/360/390 in id/en/zh, fully inside the stage (English at 320: 187 px wide, 55 px either side). The only stylesheet rule left for `.cer-memuat` is the activity fallback's own `padding: 24px 16px` (no position/top/radius). |
| D-62 (high) | done | PemuatAwal: once essentials are ready (or the cap fires), dismissal waits until the overlay has been on screen ≥ 600 ms, timed from its first painted frame (rAF after commit). The cap is still 2000 ms from mount and stays the upper bound. Measured: sheet arriving 535/725/915 ms -> on screen 625/630/630 ms; sheet held 1.5 s -> 1129-1140 ms; sheet never arrives -> dismissed 1996 ms after mount. |
| R-11 (med) | done | `useGrupSiap` rewritten. Required images are identified by the actual `srcset`/`sizes`/`src` of each `<img>` in the world (background, foreground, characters, trailer object), plus DPR (`useDpr`), React key (width, character:expression, objects) and a pending expression swap (`data-menunggu` on TokohDekat while useGambarSiap still shows the old picture). A MutationObserver restarts a NEW generation whenever those descriptors change before ready; results from older generations are ignored. Coverage: harness cases `ekspresi-saat-muat` and `dpr-saat-muat` (below). |
| R-12 (med) | done | Decode rejection = FAILED (no more "success if naturalWidth > 0"). Per required layer: failed background -> `data-gagal-latar`, the failed `<img>` is hidden and the blurred room stays; failed foreground -> removed from the DOM (`depanGagal` state); failed character or trailer -> the gate fires `error` on it, so the existing owner fallback runs (named silhouette, or the trailer is dropped). Coverage: `latar-404`, `depan-404`, `tokoh-rusak` (corrupt WebP bytes). |
| R-13 (med) | done | Harness: per required image, "ok" = `decode()` resolved AND naturalWidth > 0 for its current file; failed required images are counted and never count as ready. It now reports "all required layers decoded" and "visibly revealed" (decoded + `data-siap` on a gated world + every layer at opacity ≥ 0.99) separately. Cache: COMPLETED hit (download finished before the click, no refetch) vs IN-FLIGHT reuse (started before the click, finished after, no new request). Both series re-run (table below). |
| R-14 (med) | done | hangatkan.ts: watches resize, orientationchange and `matchMedia('(resolution: Ndppx)')` (re-armed when DPR changes). A change invalidates all warm results and notifies subscribers (`langgananUkuran` / `useVersiUkuran`). AdeganTatap and the list page re-warm the currently intended composition at the new size. Landing owns its hover warm-up: the cancel callback is kept and called on unmount, and an import that resolves after unmount starts nothing. Coverage: `putar-saat-hangat`. |
| R-15 (low) | done | `window.__raksaHangat` exists only in dev builds or when localStorage `raksa:diag` = "1" (set by the harness); lists capped at 20. `catatCocok` compares only against a warm result of the CURRENT generation with the same srcset + sizes. |
| R-16 (low) | done | Rendering has no side effects. The show/skip decision happens once in a layout effect, before the first paint; sessionStorage is written only in effects. Skipping when ready needs a SUCCESSFUL decode: a shared `decodeLembar()` promise (started when the module loads, rejection handled, retryable), and `lembarSiap` is true only after decode() resolved with naturalWidth > 0. |
| D-59 (Lead) | done | Scoped homepage preload restored in client/index.html (inline, base-path aware, `/` only). The skip-ready rule is kept. Consequence, as decided: on the throttled cold `/` and on fast cold loads the sheet is decoded before React mounts, so the loader does NOT appear (journey a, 10/10 runs; fast cold id/en). It appears only when the sheet is late (held 0.5-1.5 s: shown, ≥ 600 ms). The slow-link blank screen before JS is T-011. |

#### Corrected before/after (median / p95, n=5, descriptive)
Production builds: before = HEAD 1231fe6 (pre-T-010) built from a git worktree into a separate folder; after = this round. Server `RAKSA_LEGACY=on`, `CLIENT_DIST` pointing at each build. Harness: CPU 4x, 200,000 B/s down / 94,000 up / 150 ms, fresh incognito context, cache on, 3 s dwell. Times in ms from the episode route start (b = click on Episode 2 "Mulai", c = navigation). "Visibly revealed" = all required layers decoded + reveal flag + opacity 1 (before: no gate, so decoded + opacity 1).

| journey | vp | metric | before | after |
|---|---|---|---|---|
| b | 360 | stage mounted | 1990 / 2001 | 2007 / 2018 |
| b | 360 | first room treatment | 4048 / 4074 | **2007 / 2018** (blurred room) |
| b | 360 | all required layers decoded | 4075 / 4092 | 2026 / 2028 |
| b | 360 | visibly revealed | 4075 / 4092 | **2041 / 2047** |
| b | 360 | warm-up COMPLETED cache hit | 0/5 | **5/5** |
| b | 360 | warm-up in-flight reuse | 0/5 | 0/5 |
| b | 390 | first room treatment | 4356 / 4367 | **2240 / 2259** |
| b | 390 | all required layers decoded | 4426 / 4430 | 2250 / 2269 |
| b | 390 | visibly revealed | 4426 / 4430 | **2266 / 2276** |
| b | 390 | warm-up COMPLETED cache hit | 0/5 | **0/5** |
| b | 390 | warm-up in-flight reuse | 0/5 | 5/5 |
| c | 360 | first room treatment | 11802 / 11825 | **9680 / 9684** (blurred room) |
| c | 360 | visibly revealed | 11832 / 11839 | 11899 / 11922 |
| c | 390 | first room treatment | 12076 / 12081 | **9680 / 9690** |
| c | 390 | visibly revealed | 12138 / 12174 | 12236 / 12256 |
| a | 360 | LCP | 5112 / 5196 | 5288 / 5320 |
| a | 360 | bytes / requests | 795,378 / 19 | 806,054 / 20 (+ Raki chunk) |
| a | 360/390 | loader shown | n/a | not shown (sheet decoded before mount, D-59) |

- No run had a failed required image (0/5 everywhere).
- **DPR 3, strict definition:** the warm-up does NOT finish within the 3 s dwell at 390x844 DPR 3: **0/5 completed cache hits**. In 5/5 runs the scene reused the warm-up's in-flight download (no second request) and was revealed 26-37 ms after the stage mounted.
- Direct cold entry (c): the final reveal is unchanged (+60-100 ms; the group waits for its slowest layer); the gain there is the room being visible ~2.1-2.4 s earlier.
- Full tables: `team/evidence/T-010/before/ringkas.md`, `after/ringkas.md` (frame series in `frames-*`). The first-round tables above are superseded.

#### Failure matrix (all PASS) — `node tools/cek-gagal-t010.mjs` (exit 1 on any failure)
| case | result |
|---|---|
| latar-404 | `data-gagal-latar`, blurred room at opacity 1, failed bg hidden, pill gone, Miss Raksa visible, Lanjut advances |
| depan-404 | foreground removed from the DOM, room + Miss Raksa revealed, placeholder gone |
| tokoh-rusak (corrupt WebP) | Miss Raksa routed to the named silhouette, scene revealed |
| ekspresi-saat-muat | Lanjut pressed mid-load (tersenyum -> netral): `data-menunggu` seen, gate revealed only with miss-senyum decoded (never the old picture) |
| dpr-saat-muat (2 -> 3) | gate restarted on the new descriptors; all revealed layers decoded |
| putar-saat-hangat (360x740 -> 740x360 on the list page, throttled) | warm-up generation 0 -> 1, re-warmed at 669 px; scene background not requested again after the click |
| lokasi-kedua (D-55) | from the phone call to the pool: the first pool frame = pool thumbnail at opacity 1 with all layers at 0, then one reveal ~1.5 s later (pool images delayed 1.5 s) |
Screenshots: `team/evidence/T-010/gagal/*.png` (incl. `lokasi-kedua-placeholder-360.png` / `-siap-360.png`), data in `gagal/hasil.json`.
**Second-location path for QA:** `npx tsx --tsconfig client/tsconfig.json tools/cerita/state-lokasi-kedua.mts` drives the real engine to one "Lanjut" before the first location change (node k03-b) and prints the `raksa:cerita` localStorage entry. Put it in localStorage, open `/cerita/auto-2`, press Lanjut once.

#### Loader + pill checks — `node tools/cek-pemuat-t010.mjs` (server `RAKSA_LEGACY=on` for zh and /acara/*)
- Cold `/`, sheet held 1.5 s: shown 399-413 ms, on screen 1129-1140 ms; inert while shown, removed at dismissal; status outside #root; id/en/zh texts correct; second visit in the session = no loader.
- Cap: dismissed 1996 ms after mount; frame 20,78 320x144, Masuk 565.7.
- Reduced motion: bar animation none, no transition.
- Never on /host, /projector, /join, /cerita, /cerita/auto-2, /kenalan, /acara/join.
- Focus: /cerita -> "/" puts focus on the h1 only after the overlay is gone (2769 vs gone at 2768); a cold load moves no focus.
- Fast cold `/` id/en: skipped (D-59).
- Pills `team/evidence/T-010/pemuat/pil-{320,360,390}-{id,en,zh}.png`; the CeritaMain fallback keeps only its own padding rule.

#### Other evidence
- `npm run test:client`: 724 / 724 pass / 0 fail.
- `npm run test:e2e` (after build, legacy on): exit 0, kegagalan 0, console/http bermasalah 0.
- Homepage JS+CSS gzip vs T-008: 251.74 -> 255.31 KB = **+3.57 KB** (limit 10).
- T-003..T-008 regression on this build (loader skipped): 360 Masuk 565.7, gaps 8/16/12, sprite centre 180; 390 577.7; 800 777.9; 1280 514.7, all unchanged (`regresi-fix-*`).

#### How to run
1. Build and serve: `npm run build && RAKSA_LEGACY=on npm start`. For the before series, build HEAD into a separate folder and start with `CLIENT_DIST=<folder>`.
2. Measure: `node tools/ukur-aset-t010.mjs <label> [--frames]`.
3. Failure matrix: `node tools/cek-gagal-t010.mjs`.
4. Loader + pill checks: `node tools/cek-pemuat-t010.mjs`.

#### Known issues
- At DPR 3 the 3 s dwell is not enough to COMPLETE the warm-up (0/5 strict); the scene still avoids a second download (in-flight reuse 5/5).
- Unit tests for the gate were not added: it is DOM-event driven (image load/decode, MutationObserver) and the client tests run under plain node without a DOM. Coverage is the seven browser cases above, which fail with a non-zero exit.
- Because of D-59 the loader will rarely be seen; the blank screen while the JS downloads is T-011.

- Lead acceptance (2026-11-15) of Codex R-17: the 390px DPR 3 warm-up completes 0/5 within the 3 s dwell but is reused in flight 5/5 and the scene reveals within ~40 ms of mounting; the 4/5 completed-cache target is waived for DPR 3. Improving it would require a longer dwell or heavier prefetch, neither of which helps the player.

## T-011 — pre-JS loading screen (2026-11-15)

Fullstack · status: review · not committed. Followed DESIGN-REVIEW D-66..D-76. The block in index.html is the tested block from team/specs/T-011-pra-pemuat-block.html, unchanged.

### Changes
- `client/index.html`: the T-011 block was inserted directly after `<div id="root"></div>`:
  - `<template id="pra-tpl">`: the same markup as the React loader, including the inline Raki.
  - The inline script: `'%BASE_URL%'` path test identical to the D-59 preload, 400 ms show delay, `window.__lepasPra(f)` with the 600 ms minimum from the node's first paint, the 15 s id/en/zh "taking too long" message, language from `?lang`, then `raksa:bahasa`, default id.
  - The D-59 preload script is untouched.
- `client/src/components/PemuatAwal.tsx` (D-71):
  - New `lepasPra()` helper: every call is guarded with `typeof window.__lepasPra === 'function'`, plus the typed globals.
  - New `ikutiPra()`: watches the node's `data-selesai` attribute and its removal.
  - **Skip** (sheet decoded / already dismissed): `__lepasPra(1)`. If the node is up, `#root` stays inert and the h1 focus is held until the fade starts or the node is gone; otherwise the call only cancels the 400 ms timer.
  - **Show + node present: ADOPT.** No portal is rendered and no second overlay appears. `#root` stays inert + aria-busy and the focus hold is kept; on essentials-ready or the 2000 ms cap from mount it calls `__lepasPra(1)`. Inert is removed when the fade starts; the focus hold is released when the node is removed.
  - **Show + no node yet:** `__lepasPra(0)` cancels the timer, then React's own overlay, exactly as in T-010.
  - The overlay markup moved into an exported `KerangkaPemuat` component (the same JSX) so it can be tested.
- `client/src/App.tsx`: `LepasPraDiLuarBeranda` calls `__lepasPra(0)` when the router path is not `/`. The brief says `0`; D-71(d) said `1`. I used the Lead's `0`: remove at once, because nobody needs a fade when the homepage never mounts. It is written inline so PemuatAwal does not move into the main bundle.
- `client/src/components/pemuatPra.test.tsx` (new guard, added to `test:client` in the root package.json):
  1. The `<template>` in index.html must equal `renderToStaticMarkup(<KerangkaPemuat teks="Menyiapkan…"/>)`. It is normalised only for `id="pra-pemuat"`, inline-style spacing and `<i></i>` vs `<i/>`.
  2. The block is scoped with the D-59 path test, exposes `__lepasPra`, and sits after `#root`.
- `tools/cek-pra-t011.mjs` (new): the check script below.
- Not changed: `ui/halaman.ts` (the T-010 focus hold already covers adoption) and `tools/cek-pemuat-t010.mjs`.

### How to test
1. Build and serve: `npm run build && RAKSA_LEGACY=on npm start` (port 4000; legacy on for zh and /acara/*).
2. Run `node tools/cek-pra-t011.mjs`. It exits 1 on any failure.
3. Throttles it uses:
   - Slow: whole page via `Network.emulateNetworkConditions`, 200,000 B/s down / 94,000 B/s up / 150 ms latency, cache disabled.
   - Medium: 1,500,000 B/s / 40 ms.
4. Viewport: 360x740 at DPR 2.
5. Output goes to `team/evidence/T-011/`: `hasil.json`, `frames-lambat-{id,en,zh}/` (one screencast frame per 100 ms) and screenshots.

### Timings (production build, 360x740)
| case | result |
|---|---|
| slow, cold `/`, id / en / zh | first contentful paint **1352 / 1332 / 1356 ms**, and it is the loader (node inserted at 1320 / 1299 / 1321 ms; it was 4.03 s of blank cream before). Homepage mounted under it at 4964 / 4973 / 4990 ms; fade starts 4975 / 4986 / 5009; node gone 5257 / 5267 / 5259 ms. **0 frames with neither overlay nor homepage** after the node appears; **no second React overlay**; `.lp-pemuat-isi` rect identical before and after the handover (93.6, 238.0, 172.7 x 204.8). Text and `lang` correct. |
| fast cold `/` (no throttle) | node never inserted; homepage at 365 ms, FCP 88 ms; no flash |
| medium + sheet held 1 s | node inserted 610 ms, painted 622 ms, released 1235 ms = **614 ms on screen**, gone 1516 ms; released once, no second overlay |
| slow + sheet held 15 s (adoption, sprite late) | node adopted, released **1981 ms after the homepage mounted** (the 2000 ms cap), gone 7240 ms; no second overlay |
| other routes (slow link): /host, /projector, /join, /cerita, /cerita/auto-2, /acara/join, /kenalan, /cms, /room/ABC123 | no `#pra-pemuat`, no `__lepasPra`, no `aria-busy` |
| main JS blocked | after 15 s: id "Memuat terlalu lama…", en "Taking too long…", zh "加载时间过长…"; bar `display:none`; `aria-busy` cleared |
| reduced motion, before JS | bar `animation: none` (static); Raki held by the global theme.css rule (0.001 ms x 1 = still) |

### Size
- Built `client/dist/index.html` gzip: **819 -> 2,301 B (+1,482 B)**. 819 rather than the Designer's 804 because the D-59 preload line is included.
- Bundles:
  - Landing 2.77 -> 3.09 KB gzip (adoption code).
  - index.js 227.84 -> 227.88 KB (App route effect).
  - Every other chunk is within ±0.01 KB (hash churn).
  - Lists: `team/evidence/T-011/bundle-before.txt` and `bundle-after.txt`.

### Regression
- `npm run test:client`: 726 tests / 726 pass / 0 fail (+2 guard tests).
- `npm run test:e2e`: exit 0, kegagalan 0, console/http bermasalah 0.
- T-008 numbers unchanged: 360 Masuk 565.7, gaps 8/16/12, sprite centre 180; 390 577.7; 800 777.9; 1280 514.7.
- T-010 loader checks unchanged:
  - Late sheet: shown ≥ 600 ms (636 ms with a short hold; 1118-1148 ms when held 1.5 s); cap 2010 ms.
  - Fast cold `/`: skipped.
  - Never on other routes; h1 focus only after dismissal; cold load moves no focus.
  - Pill 30.3 px; the `.cer-memuat` fallback keeps only its padding; a 404 background keeps the blurred room.
  - Evidence: `team/evidence/T-011/regresi-t010/` and `regresi-*`.

### Known issues
- Not scripted: a player resumed away from `/` by PhaseRouter (the App effect releases the node; covered by code, not by a run).
- With legacy mode off, zh briefly shows on the pre-JS screen before `main.tsx` flips the app to id (accepted in D-68).


## T-013 Stage 1 (2026-11-15)

Fullstack · status: doing (Stage 1 built, awaiting Designer review + QA + owner phone check) · not committed. Followed REVIEW "T-013 plan review" and DESIGN-REVIEW D-79..D-83. Owner decisions applied: Miss Raksa STANDING at the counter, Hendra `lega` -> senang face, standing poses only.

### 1. Boundary decision (settled before coding)
- **Selection is per location.** `KonfigLatar.lokasi[x].piksel?: string` (tipe.ts) names a pixel room. AUTO-2 sets it only on `kantor` (`piksel: 'kantor-ep2'`). `Episode.latar` stays the only cue source. The engine, the script, `antarmuka: 'hp'` and the saved state are untouched.
- **Presentation adapter** `ui/latar/piksel/adegan.ts` (pure): `komposisiLatar(ep, state)` (folded CueLatar) -> a pixel scene, or a named reason to stay illustrated.

  | AUTO-2 cue | pixel stage |
  |---|---|
  | `lokasi` with `piksel` | room `kantor-ep2` |
  | `hadir: missRaksa` | place `balikMeja`, pose `berdiri`, faces RIGHT; waist down hidden by the counter (`bisaDudukTurun` ignored: no chair) |
  | `hadir: hendra` | place `depanMeja`, pose `berdiri`, faces LEFT |
  | `hadir: <other>` (bima, rudi, …) | whole scene stays ILLUSTRATED (reason `pemeran X tanpa atlas piksel`) |
  | `telepon: hendra` | phone inset with Hendra's face in the line's expression; the room stays |
  | `objek: berkas` / `surat` | prop `map` / `surat` on the counter; any other objek -> illustrated |
  | `dekat` close-up | no equivalent: the camera stays; expression is read from the face and the dialog portrait |
  | lokasi without `piksel` (bengkel, tol, pool, wawancara) | illustrated renderer, unchanged until Stage 2 |
- **Coexistence:**
  - `AdeganTatap` renders `PanggungPiksel` when the adapter returns a scene, otherwise `PanggungLatar` exactly as before, T-010 gate included. If a pixel PNG fails to load, it falls back to the illustrated stage.
  - The pixel stage never waits on the T-010 gate. It shows the wall colour until its ~30 KB of PNGs decode, then dispatches `ADEGAN_SIAP`; `sesudahAdeganSiap` also accepts `.cer-piksel[data-siap]`.
  - The next-location warm-up skips pixel scenes, so no kantor illustrations are prefetched.
  - The old renderer and the illustration set are untouched; removal is Stage 3.
- **Script finding:**
  - In the current script Pak Hendra is NEVER physically in the kantor. Every kantor `telepon: 'hendra'` beat is rendered by the HP UI as the WhatsApp chat (Obrolan), not on the stage.
  - So in Stage 1 his pixel art is seen as the chat and dialog avatar, in every expression. The on-stage slot (`depanMeja`) and the phone inset are implemented and unit-tested, but the current script never reaches them.
  - The only kantor scene that stays illustrated is K07 (surveyor Bima at the office; no pixel atlas yet).

### 2. Pipeline
- **`tools/piksel/hendra-native.mjs`:**
  - Shared palette: ≤ 40 colours (OKLab k-means over all three sheets), then a MODE sample per cell.
  - Master pitch: measured with `lib.cariPitch` (x 7, y 7.4; weak scores because the source is generative). Used at **7.4**, giving a 198 art px body (Miss Raksa is 184).
  - Head rule: adult-male proportion KEPT (D-83 #2). Head 36 art px wide, 39 px from top to chin.
  - The expression and pose sheets are resampled at the pitch that matches the master head width: 7.777 and 5.1.
- **`tools/piksel/bangun-hendra.mjs`** -> `seni/piksel/hendra.png` + `hendra.json` (existing manifest schema, read by susun.ts):
  - Frame `berdiri-kiri`: full body, facing LEFT only, no mirrored variant.
  - Five faces (panik, cemas, kecewa, tenang, senang), registered to the master head by hair-silhouette IoU 0.95-0.97.
  - `kedip` eyes for tenang, cemas and kecewa. No talk mouth: the sheet has none.
  - Six waist-up gesture frames, `gestur-<cemas|panik|kecewa|tenang|senang|menjelaskan>-kiri`. Available, not requested in Stage 1.
  - Portrait and phone windows.
  - `ekspresiDari`: bingung->panik, cemas->cemas, kesal->kecewa, netral|serius->tenang, **lega|senang|tersenyum->senang**.
  - Review sheet: `character/piksel/hendra/tinjau-wajah.png`.
- **`tools/piksel/bangun-ruang-ep2.mjs`** -> `ruang-ep2.json` + `ep2-ruang-*.png`:
  - Downsample: 400×225 by area mean, 48-colour palette.
  - Layers were MEASURED from the image: counter top y 95-112, front 113-159, base 160-169. The README estimate was 70-125.
  - `latar` (z 10): the folder is cut out and filled with the counter colour.
  - `meja` (z 30, alpha): counter plus the phone, card holder and plant on it. Drawn over Miss Raksa and under Hendra.
  - Props: `map` (taken from the reference) and `surat` (drawn by code).
  - Nameplate: blank in the art, text drawn at runtime (`lokasi.kantor`).
  - Places: Miss Raksa's feet at (560, 756), Hendra's at (1040, 860); 120 art px between heads (D-80).
  - Kept separate from Episode 1's `ruang.json`. The `ep2-` prefix keeps the files out of Episode 1's `ruang-*.png` glob and its orphan-file test.
- **Registration:**
  - `IdTokohPiksel` gains `'hendra'`. The new `DAFTAR_TOKOH_PIKSEL_SEMUA` feeds the composer; `DAFTAR_TOKOH_PIKSEL` (the Episode 1 list) is unchanged.
  - `gambarTokohPiksel` now honours an explicit `id`.
  - `game/tokoh.ts` / `KarakterTokoh` are NOT changed: they are the homepage sheet registry and Hendra is not a homepage character. Shared sizing rules are untouched.
- **Runtime:**
  - `ui/latar/piksel/PanggungPiksel.tsx`: one `<canvas>` at an integer number of device pixels per art pixel.
  - Camera: Episode 1's `pasKamera` with the pixel option (`q = 4 × DPR`; nameplate and heads must stay visible above the dialog band; `maksLebih` 1.6).
  - No CSS blur or filter, so the T-012 iOS rectangle cannot occur on this stage.
  - Motion: blink every 3-5 s; mouth flaps only where the atlas has a talk frame (Miss Raksa). Reduced motion stops both.
  - Draw order: wall, nameplate text, Miss Raksa, counter, props, Hendra, phone inset. The location chip is hidden when the room has a nameplate, so the name is not shown twice.
  - `ui/latar/piksel/ruang.ts` reads the room manifest.
  - `ui/latar/piksel/PotretPikselHp.tsx`: pixel round portrait. It deliberately avoids Episode 1's `PotretPiksel`, which imports `sumberPiksel`.
- **Avatars (step 5):**
  - `PotretHp` always uses the Hendra pixel portrait (Obrolan header, cut-ins, dialog, arena), in the line's expression: default tenang, cemas in tense beats.
  - Miss Raksa's portrait is pixel only in pixel scenes.

### 3. Asset table (production build, bytes as served; PNG raw, text gzip -9)
| asset | bytes |
|---|---|
| hendra.png (atlas 512×196, 40 colours) | 18,445 |
| ep2-ruang-kantor-latar.png | 8,705 |
| ep2-ruang-kantor-meja.png | 2,404 |
| ep2-ruang-prop-map.png | 259 |
| ep2-ruang-prop-surat.png | 117 |
| **new PNG subtotal** | **29,930** |
| hendra.json (gzip; bundled in CeritaMain) | 1,669 |
| ruang-ep2.json (gzip; bundled) | 769 |
| stage + adapter + portrait code (rest of the CeritaMain delta) | ~4,845 |
| **CeritaMain.js gzip delta (41,454 -> 48,737)** | **7,283** |
| **Stage 1 new total** | **37,213 B ≈ 36.3 KB** |
| miss-raksa.png (reused Episode 1 atlas; already downloaded on AUTO-2 before T-013) | 19,972 |

- **Against the 80-95 KB estimate:** 36.3 KB new, 55.8 KB including the reused Miss Raksa atlas.
- **Why it came in lower:** no extra Miss Raksa poses (`berdiri` facing right already exists), Hendra has no talk or blink variants beyond three kedip eye strips, and the room is 11.5 KB.
- **All JS, gzip:** +8.6 KB (1,101,546 -> 1,110,148).
- **Old illustration set:** untouched.
- **Pre-existing, not caused by T-013 (measured on the HEAD build):**
  - What: AUTO-2 pages download ALL Episode 1 room PNGs plus `miss-raksa.png` and `bu-rina.png`, about 131 KB.
  - Why: `ui/panggung/sumberPiksel.ts` starts loading as soon as it is imported, and it sits in the shared CeritaMain chunk.
  - Worth fixing in Stage 2/3 if the 400 KB gate counts transferred bytes.

### 4. Pose coverage (requested vs provided)
| character | requested by Stage 1 scenes | atlas provides | fallback |
|---|---|---|---|
| Miss Raksa | `berdiri`, facing right (all kantor pixel scenes) | berdiri L/R, berdiri-sambut L/R, berdiri-persilakan L/R, duduk-*, telepon | none needed |
| Pak Hendra (stage) | none in the current script (the adapter's `depanMeja` slot asks for `berdiri`, facing left) | `berdiri` LEFT + 6 gesture frames (left) | right-facing is NOT provided; the adapter only ever asks for left |
| Pak Hendra (faces) | bingung, cemas, kesal, netral, lega, senang (+ serius, tersenyum) | panik, cemas, kecewa, tenang, senang + kedip | lega -> senang (owner); no talk mouth |
| Bima (K07 kantor) | on stage | no atlas | whole scene illustrated (explicit) |

- **Seated, walking, phone-at-ear:** neither requested nor provided (owner constraint).
- **Unknown-pose check:**
  - `poseHilang()` in adegan.ts and the "pose atlas" test fail on any pose or direction missing from the atlas. Verified with `duduk` and `berdiri/kanan` for Hendra.
  - The script test walks the whole AUTO-2 node graph: every reachable node and line, with cue folding along each path.
  - It asserts every kantor composition is either pixel or a named fallback (only `pemeran bima`).
  - It also asserts every requested pose resolves without fallback for all 8 story expressions.

### 5. Tests and evidence
- `npm run test:client`: **733 / 733 pass**, including 7 new tests in `client/src/cerita/ui/latar/piksel/adegan.test.ts` (added to the root package.json `test:client` list). Two existing test files got type-only edits (`IdTokohPikselEp1`).
- `npm run test:e2e` (production build, legacy on): **exit 0, kegagalan 0**.
- `npx tsc --noEmit -p client`: clean. The production build succeeds.
- **Browser checks:** `node tools/cek-piksel-t013.mjs` against `RAKSA_LEGACY=on npm start`.
  - Result: **82/82 PASS**. That is 9 cases × three viewports (360×740 DPR 2, 390×844 DPR 3, 1280×800 DPR 1) × three languages (id/en/zh), plus one transition series.
  - States come from `tools/cerita/state-kantor-t013.mts`, which drives the real engine, and are saved to `team/evidence/T-013/states.json`.
  - Cases:
    - `mentor`: Miss Raksa standing and speaking.
    - `berkas`: claim folder prop on the counter.
    - `tel-panik|cemas|kecewa|tenang|senang`: WhatsApp with the Hendra pixel avatar in that face.
    - `bima`: illustrated fallback.
    - `pool`: illustrated, unchanged.
  - Network: **0 kantor/miss/hendra illustration requests** on every kantor pixel case. The next location (pool) is still warmed by the existing rule.
  - Frame series: `team/evidence/T-013/transisi/00-15.png`, 100 ms apart (mentor line -> next line; the face changes and the stage stays drawn).
  - Screenshots and `hasil.json` are in `team/evidence/T-013/`. Before-build screenshots (HEAD f6da694): `sebelum-*.png`.
- **Unchanged:**
  - Homepage: not touched.
  - Episode 1: still on `Panggung` / `ruang.json`, tests green.
  - Non-kantor Episode 2 scenes: still on `PanggungLatar` (pool case verified).

### 6. Known gaps for Stage 2
- **Hendra on stage:** the current script never puts him in the kantor (his phone beats are WhatsApp). Showing him at the counter needs a script/cue change (`hadir: ['missRaksa','hendra']` on a kantor node); the adapter already handles it.
- **Composition:** at the phone crop, Miss Raksa's head overlaps the nameplate (Designer placement x 560). The text is drawn behind her; the Designer should review the board or her position.
- **Art and text gaps:**
  - The nameplate text uses a system font on the canvas, not pixel type.
  - There is no lifted-handset variant of the desk phone (it is baked into the counter layer).
  - Hendra has no talk-mouth frames.
- **K07 Bima** stays illustrated until the side-character atlases exist.
- **Not yet checked:**
  - iOS WebKit has not been tested on a real device (canvas, no filters).
  - The owner phone check is pending.


## T-013 Stage 2 (2026-11-15)

Fullstack · status: doing (Stage 2 built, awaiting Designer review + QA) · not committed. Built on the Stage 1 adapter. Followed D-84..D-86 and folded in the Stage 1 review items D-87 (blocker), D-88, D-89 and D-91. QA-REPORT has no T-013 Stage 1 section, so there were no QA bugs to fold in.

### Result
**Every AUTO-2 composition is now on the pixel stage, with 0 fallbacks.** That covers kantor, pool, bengkel, tol, wawancara (1, 2 and 3 witnesses), K07 Bima in the kantor, and the episode card on /cerita.
- **Scope:** all four `PanggungLatar` consumers (HP scene, activity, /cerita card, wide CeritaMain) now go through ONE wrapper. `PanggungLatar` picks the pixel stage via the adapter; otherwise, or if a pixel PNG fails, it renders `PanggungLatarIlustrasi`, which is the old renderer unchanged.
- **Network:** 0 `.webp` requests on any AUTO-2 scene or on the card, and 0 Episode 1 room or Bu Rina PNGs.

### Rooms (tools/piksel/bangun-ruang-ep2.mjs -> seni/piksel/ruang-ep2.json v2 + ep2-ruang-*.png)
- **Downsampling:** each room from its own source size (D-84 q4) with an area mean to 400×225 and a ≤ 48-colour OKLab palette.
- **Layers:** latar only for the four new rooms. Characters stand in front of everything, so no `meja`/`pagar` alpha layers are needed.

| room | layers / props | slots (feet, world) | camera focus |
|---|---|---|---|
| kantor | latar + meja (alpha) + map/surat props; nameplate in a pixel font | Miss Raksa `balikMeja` x **800** (D-87); visitors 1: 1120 · 2: 1080/1320 · 3: 1040/1240/1440, y 860 | nameplate |
| pool | latar + **damaged trailer** layer z 25 (behind people, in front of the kerb), wheels on art y 170, x 230-380 | 1: 560 · 2: 400/760 · 3: 400/760/1000, y 860 | trailer cab (world 900-1100 × 520-690) |
| bengkel | latar + prop `foto` (code-drawn photo print, for K05-E `objek: ['foto']`) | 1: 1000 · 2: 700/1060 · 3: 520/820/1120, y 860 | — |
| tol | latar (daylight as delivered) | 1: 560 · 2: 460/760 · 3: 360/600/840, y 880 | cracked barrier (world 960-1260 × 380-560), always in the phone crop |
| wawancara | latar (table stays background; witnesses in front, Designer option (a)) | 1: 830 · 2: 650/1010 · 3: 520/830/1140, y 870 | — |

- **Trailer:** only the damaged variant is shipped. It is the bottom row of the sheet, mode-sampled at pitch 8.87 to 150 art px, 32 colours. The intact one is not bundled (README: "bila tidak dipakai, jangan dibundel").
- **Three witnesses (D-84 q1):** a THIRD stage slot, not the two-plus-avatar fallback. The pixel adapter has its own slot model (`tempat: 'slot'`, index i of n ≤ 3), so `CueAdegan` and the Episode 1 types are NOT extended and there is no schema change. More than 3 standing characters returns a named fallback; the script has none.

### Side characters (tools/piksel/bangun-samping.mjs -> seni/piksel/samping.png + samping.json)
- **Characters:** rudi, bima, darto, admin, tol, polisi, in one shared atlas (512×188, 17.7 KB) with one manifest per character in the existing susun.ts schema. Registered as `IdTokohSamping` and composed by the same composer.
- **Scale:** head width normalised to Hendra's 36 art px per sheet. Body pitch is 4.86-5.53; the expression sheet pitch is 6.33-7.03 (its heads are ≈ 1.3× larger, normalised as noted).
- **Body:** the waist-up sheet plus a PROCEDURAL lower body (D-85 (a)): two-tone trousers per costume, a dark outline and shoes, 188 art px tall in total (Hendra 198).
- **Faces:** `netral` = face from the bodies sheet (canonical identity). `prihatin` = face from the v2 expression sheet, registered to the body head by top-of-head IoU 0.967-0.973.
- **Expression map (D-85):** netral|tersenyum|senang|lega -> netral; cemas|serius|bingung|kesal -> prihatin.
- **Facing:** LEFT only (no right variant exists). No blink or talk frames.
- **Review sheet:** `character/piksel/samping/tinjau-samping.png`.

### Camera
- **Base camera:** `pasKamera` with integer pixels, the same as Stage 1.
- **Required area:** heads (+30 % upward so caps stay whole) ∪ nameplate ∪ room focus box.
- **Location chip:** shown only for an empty room without a nameplate. With characters on stage the chip covered a witness's face in wawancara-3. The location is still named in the narration and the section title.
- **`dekat`:** still no close-up. Expression is read from the face and the dialog portrait.

### Stage 1 review items
- **D-87 (blocker):** fixed. The nameplate is MEASURED at art px 78-165 (the README estimated 57-121), so Miss Raksa moved to x 800 (head ≈ art 182-218). "LAYANAN KLAIM RAKSA" is fully visible at 360/390/1280 (`stage2/mentor-*.png`).
- **D-88:** fixed. The nameplate uses a 3×5 pixel font at art-pixel scale (`ui/latar/piksel/hurufPiksel.ts`, the font from tools/piksel/lib.mjs). Text outside the font, or too wide, falls back to fillText.
- **D-89:** fixed. K07 Bima is in the pixel kantor at the visitor slot.
- **D-91:** fixed, and it was an easy split.
  - `ui/panggung/sumberPiksel.ts` now starts the Episode 1 room manifest and PNG loading on FIRST USE (`pastikanPiksel()` inside its accessors) instead of at import.
  - `ui/panggung/sumber.ts` starts the Episode 1 atlas preload on the first `gambarTokoh`/`ambilRuang`.
  - The first-use call is synchronous, so Episode 1's first render still sees status 'memuat'.
  - AUTO-2 pages no longer download ≈ 111 KB of Episode 1 room PNGs + bu-rina.png. miss-raksa.png is still loaded because AUTO-2 uses it.
  - Episode 1 tests and e2e are green.
- **D-90 (script language):** out of scope; unchanged.

### Asset table: everything AUTO-2's stage ships (production build, bytes as served; PNG raw, JS gzip -9)
| asset | bytes |
|---|---|
| ep2-ruang-kantor-latar.png | 8,705 |
| ep2-ruang-kantor-meja.png | 2,404 |
| ep2-ruang-bengkel-latar.png | 22,249 |
| ep2-ruang-tol-latar.png | 21,001 |
| ep2-ruang-pool-latar.png | 11,013 |
| ep2-ruang-wawancara-latar.png | 12,252 |
| ep2-ruang-pool-trailer.png | 1,785 |
| props map / surat / foto | 259 / 117 / 129 |
| hendra.png | 18,445 |
| samping.png (6 characters) | 17,696 |
| miss-raksa.png (Episode 1 atlas, reused) | 19,972 |
| **PNG subtotal** | **136,027** |
| all JS gzip delta vs HEAD f6da694 (1,101,546 -> 1,111,029): stage, adapter, font, manifests (hendra 1,669 + samping 1,274 + ruang-ep2 877 gzip) | 9,483 |
| **AUTO-2 stage total** | **145,510 B ≈ 142 KB** of the 400 KB gate (Designer estimate 235-255 KB) |
- **Removed from AUTO-2 transfers (D-91):** ≈ 111 KB of Episode 1 PNGs. The illustrated WebP set is no longer requested but still sits in the build (Stage 3).

### Tests and evidence
- **Tests:**
  - `npm run test:client`: **735 / 735 pass**.
  - `adegan.test.ts` has 9 tests. The whole-episode graph walk asserts every reachable composition is pixel with NO fallback, every room/slot/prop exists, and every requested pose+facing resolves without fallback for all 8 story expressions. Requested set: missRaksa berdiri/right; rudi, bima, darto, admin, tol, polisi berdiri/left. The other tests cover the 3-slot mapping, the card (pool + Hendra), side-character faces, named fallbacks for impossible input, and the unknown-pose check.
  - `npm run test:e2e` (production build, legacy on): **exit 0, kegagalan 0, console/http bermasalah 0**. `tsc --noEmit` is clean and the production build succeeds.
- **Browser checks:** `node tools/cek-piksel-t013.mjs` -> **70 / 70 PASS**, all with 0 `.webp` and 0 Episode 1 room PNG requests.
  - 16 cases at 360×740 DPR 2, 390×844 DPR 3 and 1280×800 in id; mentor, pool and wawancara-3 also in en and zh.
  - Cases: mentor, berkas, surat (lands on the chat), K07 bima, pool (Rudi + trailer), bengkel, foto, tol, wawancara-1/2/3, tel-panik/cemas/kecewa/tenang/senang (chat avatar).
  - Also the /cerita card at 3 viewports, and a kantor -> pool transition series (20 frames, 100 ms apart, `stage2/transisi-kantor-pool/`).
  - States come from `tools/cerita/state-kantor-t013.mts` (the real engine; half the runs use activity answer keys so K09-E with three witnesses is reached) and `state-lokasi-kedua.mts`.
- **Screenshots:** `team/evidence/T-013/stage2/`.

### Remaining fallbacks: none
The adapter can still refuse an unknown location or objek, a cast member without pixel art, or more than 3 standing characters. No AUTO-2 composition does (test-enforced).

### For Designer review / Stage 3
- **Scale and facing:**
  - Characters are large relative to the outdoor rooms. Rudi is much taller than the trailer cab: the trailer was sized per D-84 (150 art px), the people to the Episode 1/Hendra scale.
  - Everyone faces left, including Rudi (README asked for right) and Bima at tol (right, towards the barrier). No right-facing sheets exist.
- **Art gaps:** the lower bodies are procedural and plain. The `foto` prop in bengkel is a small print on the wall, a placement chosen by Fullstack.
- **Stage 3:**
  - Delete `seni/auto-2/ilustrasi` (≈ 4.9 MB) and `PanggungLatarIlustrasi`, `useGrupSiap` and the T-010 gate/warm-up code if no consumer is left. The `PanggungLatar` wrapper becomes the pixel stage only.
  - Drop the unused illustrated avatar path in `PotretHp`, and the illustrated warm-up of the next location (`komposisiBerikut` -> `hangatkanKomposisi`, now a no-op for pixel scenes).
  - Possibly night tint for tol (D-84 q5).


## T-013 Stage 3 (2026-11-15)

Fullstack · status: doing (Stage 3 done, awaiting final QA) · NOT committed. Base: 0013d01 (tag ep2-piksel-stage2). The deletions were made with `git rm`, so they are staged in the index; nothing else is staged. QA-REPORT has no "T-013 Stage 2" section yet; the QA interim item B-01 arrived by Orca message and is handled below.

### Fixes applied
| item | what was done |
|---|---|
| **D-92** (owner blocker: legs) | `bangun-samping.mjs` rebuilt from `tokoh-samping-badan-v2.png` (drawn full bodies, cell 512×1024, pitch 945/198 = 4.773). Procedural legs deleted. Heights: rudi/bima/darto 198, tol/polisi 196, admin 195 art px (Hendra 198). Face `netral` from the v2 bodies; `prihatin` from the v2 expression sheet, normalised to the MEASURED body head width (34-40 art px) and registered by IoU 0.961-0.982. Atlas 512×204, 62 colours, 28,471 B (was 17,696). Review sheet: `character/piksel/samping/tinjau-samping.png`. |
| **D-93** (facing) | Frames renamed `berdiri-kanan` / `gestur-*-kanan` in `hendra.json` and `samping.json` (pose `kanan`, `bawaan: 'kanan'`). Left-facing = mirrored on the canvas around the foot anchor (faces and blink strips flip with the body; the camera head box is mirrored too). Facing comes per slot from `ruang-ep2.json` (`slot[n][i].hadap`); the adapter sets `hadap` + `cermin`. Applied as listed: kantor visitors kiri with slot 1 at x 1040; pool kanan; tol kanan; bengkel admin kiri at x 1000; wawancara 1 kanan, 2 kanan/kiri, 3 kanan/kanan/kiri. Test-enforced per scene. |
| **D-94** (truck) | Trailer layer rebuilt directly from the damaged row of the sheet at 450 art px wide (pitch 2.96, 32 colours), cropped at the world's right edge (240×124 art px; cut in the container, cab whole). Placed at art x 160, wheels on art y 172, z 25. Pool slots 1: 360 · 2: 160/460 (3: 120/300/480, mine). Focus box world x 640-1040, y 240-700. 6,691 B (was 1,785). |
| **D-95** (1280) | `maksLebih` 1.15 for the wide frame, 1.6 kept for phones. Bengkel, tol and wawancara now show the room at 1280 (`stage3/*-1280-id.png`). |
| **D-96** (liveliness) | (a) Blink for the six side characters: a closed-eye strip per face, generated in the builder (eye pixels replaced by skin, lash line). (b) Speaker hop 2 art px for 160 ms. (c) 1-art-px breathing bob on the speaker, toggling every 1.2 s. (d) 180 ms slide-in from the nearest view edge when a character joins `hadir` (not on first mount). (e) 150 ms crossfade when the room changes (old frame copied to an overlay canvas). All off under reduced motion via `useReducedMotion` (respects `data-gerak`). Probe at pool: normal = 2 distinct frames / 4 changes in 9 s; system reduce + `?gerak=ikut` = 1 frame / 0 changes. Hop, bob, slide-in and crossfade are implemented but only the blink is asserted by the probe. |
| **D-97** (card) | `/cerita` card uses cover (`isi="penuh"`): the next integer scale that fills the box, centred on Hendra + cab. No side bars at 360 (`stage3/kartu-cerita-360.png`). |
| **D-98** | 5×5 glyphs for `M` and `W` in the nameplate font; "KLAIM" reads correctly. |
| **D-99** | `foto` prop is 20×15 art px at eye height left of the admin (art 196, 40). |
| **B-01** (QA, medium) | Every remaining illustration consumer replaced: chat cut-in / call gate (pixel portrait), K02 activity backdrop (`hp.css` now uses `ep2-ruang-kantor-latar.png`, pixelated), all avatars (chat, dialog, Riwayat, activity guide, end screen: `PotretPikselHp` for every cast member with pixel art, Miss Raksa included). No JS or CSS in the build references an AUTO-2 WebP any more. |

Extra, not in the review:
- The band outside the 1600×900 world (integer-pixel letterbox) is now filled by stretching the room's edge row/column (sky continues upward) instead of a flat wall colour.
- Wawancara slot 2 moved from 650/1010 to 610/1050: with full-width drawn bodies facing each other, Bima's arm and Darto overlapped. Designer to confirm.

### Deletions
- `client/src/cerita/seni/auto-2/ilustrasi/` (94 files: 90 WebP ≈ 4.7 MB, `ilustrasi.json`, `index.ts`, `kabur.ts`). Source art remains in `character/auto-2-ilustrasi/`.
- `ui/latar/ilustrasi.ts` + `ilustrasi.test.ts` (removed from `test:client`).
- The illustrated renderer inside `PanggungLatar.tsx` (AdeganIlustrasi, `useGrupSiap`, T-010 gate, blurred placeholder, pill). The illustrated CSS in `latar.css`.
- `ImgIlustrasi`, `GambarIlustrasi`, `PotretIlustrasi`, `useGambarSiap` from `ui/gambarIlustrasi.tsx`.
- The illustrated warm-up in `hangatkan.ts` (srcset/size generations, `useVersiUkuran`, diagnostics).
- Types `VarianGambar`, `GambarTokoh`, `TokohIlustrasi`, `LokasiIlustrasi`, etc.; `KonfigLatar.lokasi[x].ilustrasi`, `.tokoh`, `.tanpaAset`. `piksel` is now required.
- Tools: `tools/ukur-aset-t010.mjs`, `tools/cek-gagal-t010.mjs`, `tools/cerita/bangun-kabur-auto2.mjs` (they measured or built the illustrated stage). `tools/cek-pemuat-t010.mjs`: sections 7, 10, 11 (AUTO-2 placeholder and pill) retired with a note; the homepage loader checks stay and pass.

### Kept, and why
- `PanggungLatar` (now a thin wrapper): still the single entry for the HP scene, activity, `/cerita` card and wide CeritaMain. Unmappable composition or failed PNG = plain stage box with the location label.
- `hangatkan.ts` / `hangatkanDaftar.ts`: kept as a small pixel warm-up (preloads the first composition's PNGs from the list page / homepage card hover, and the next location's PNGs from the current scene). `komposisiBerikut` kept.
- `GambarSeni` (code SVG art for the arena): unrelated to illustrations.
- T-010/T-011 homepage loader (`PemuatAwal`, index.html): untouched; it never served AUTO-2 scenes.
- `tools/cerita/state-lokasi-kedua.mts`: used by the T-013 transition check.
- Three prototype avatars moved to `seni/auto-2/proto/` (hendra-cemas, hendra-tenang, bima, 320 px): consumed only by `ProtoKejadian` / `ProtoLokasi` (build flag `VITE_KEJADIAN`). Vite still emits them into the default dist (50 KB, unreferenced by any JS/CSS, never requested).
- `MejaKasus` prototype (flag `VITE_MEJA_KASUS`): modal avatar is now the pixel portrait; its Phaser canvas gets no avatar (`avatarUrl: null`).
- Validation (`validasi.ts`): the illustrated-asset checks were replaced by "lokasi has a `piksel` id" + "cast exists"; room/slot/pose existence is enforced by `adegan.test.ts`.

### Bundle and dist (production build, gzip -9; before = 0013d01)
| | before | after |
|---|---|---|
| index.js | 226,044 | 226,044 |
| Landing.js | 3,119 | 3,112 |
| CeritaMain.js | 41,813 | 41,397 |
| cerita shared chunk (`hangatkan-*.js`: episodes + stage) | 82,582 | 69,863 |
| all JS | 1,111,092 | 1,095,058 (−16,034) |
| all CSS | 62,707 | 61,979 |
| WebP in dist/assets | 90 files, 4,734,280 B | 3 files, 50,102 B (prototype avatars, unreferenced) |
| dist total | 16.6 MB | 11.8 MB |

### Episode 2 stage assets as served (PNG raw)
| asset | bytes |
|---|---|
| rooms: kantor latar 8,705 + meja 2,404 · bengkel 22,249 · tol 21,001 · pool 11,013 · wawancara 12,252 | 77,624 |
| pool trailer | 6,691 |
| props map / surat / foto | 528 |
| hendra.png | 18,445 |
| samping.png | 28,471 |
| miss-raksa.png (Episode 1 atlas, reused) | 19,972 |
| **PNG total** | **151,731 B ≈ 148 KB** of the 400 KB gate |
- Manifests are bundled in JS (gzip: hendra 1,671, samping 1,402, ruang-ep2 904). All JS is now 6.5 KB gzip SMALLER than before T-013 began (1,101,546 at f6da694), so the stage code adds no net transfer.
- Measured in the browser: every image requested across all 16 saved states plus two opened activities = 13 unique files, **152,086 B**, 0 Episode 2 WebP (`stage3/transfer-gambar.json`). This is state sampling, not a single continuous playthrough; QA's full playthrough should confirm.

### Tests
- `npm run test:client`: **728 / 728 pass** (735 before; −8 from the retired `ilustrasi.test.ts`, +1 new in `adegan.test.ts`, now 10 tests incl. facing per scene, mirror flag, trailer geometry, blink strips).
- `npm run test:e2e`: **exit 0, kegagalan 0, console/http bermasalah 0** (production build, legacy on).
- `tsc --noEmit` clean; production build OK.
- `node tools/cek-piksel-t013.mjs`: **73 / 73 PASS**, 0 `.webp` and 0 Episode 1 room PNG requests. 16 states × 3 viewports in id (+ en/zh for mentor, pool, wawancara-3), `/cerita` card × 3, kantor→pool transition, B-01 non-stage check, motion probe normal + reduced. Screenshots: `team/evidence/T-013/stage3/`.
- `node tools/cek-pemuat-t010.mjs` (homepage loader, after retiring its AUTO-2 sections): exit 0.

### Open / for final QA
- The chat cut-in (pixel portrait in the slanted frame) did not appear in any sampled state, so its new look is unverified visually.
- Mirrored Hendra/polisi are the Designer's interim (pocket/badge swap sides).
- Not checked on real iOS WebKit; no continuous full playthrough by me in en/zh.
- `PotretHp` keeps an unused `piksel` prop for call-site compatibility.


### T-013 final fix (2026-11-16)

Fullstack · NOT committed · base d4cd775 (tag ep2-piksel-stage3). Board status unchanged.

**D-101 (blocker), `/cerita` Episode 2 card in the wide layout: fixed, with one shortfall.**
- **Root cause:** in the near-square image column (280×238 / 280×261) the D-97 "cover" branch picked the scale and centred on head + whole cab box, which cut Hendra's head.
- **Fix** (`kameraPiksel` in `ui/latar/piksel/PanggungPiksel.tsx`): the card scale may never show fewer than 125 art px of width. When the default cover frame cuts the head, hair or windscreen, the card is reframed: horizontally midway between the head and the cracked windscreen (the Designer's rule), head kept whole, top edge 5 art px above the hair.
- **Measured at 768, 1024, 1280:** 2 device px per art px, 140 art px visible (camera x 268, y 60 world). Hendra's whole head and hair are in, with his chest and right shoulder.
- **Shortfall:** head-left to windscreen-right is ≈ 148 art px, which does not fit in 140. The head wins, so the right ≈ 30 % of the windscreen and the edge of his left shoulder/arm are cut. The cracks are clearly visible. Options if the Designer wants all of it: move Hendra ≈ 10 art px toward the cab on the card only, or use 1 device px per art px (whole scene, small, like the Episode 1 card).
- **Phone cards unchanged:** same camera as Stage 3 (360: x 0, y 66, 1304×600 world; 390: x 0, y 67, 1424×600). Hendra keeps his own card position (x 360) through a per-character slot override (`xTokoh` in `ruang-ep2.json`), because his anchor was already centred.

**D-100, side-character anchors: fixed (preferred option).**
- `bangun-samping.mjs`: `jangkar.x` is now the body centre (35-36 of a 70-71 px frame; was ≈ 21, the back foot). The measured midpoint between both soles is ≈ 40 because the front shoe's toe extends right, so I used the frame centre to match the Designer's 35-37.
- Slots re-seated in `bangun-ruang-ep2.mjs`:
  - Designer numbers: wawancara 1 → 890, 2 → 670/990, 3 → 500/830/1160; kantor visitor 1 → 980; tol 1 → 620; bengkel admin → 940; pool 1 → 420.
  - Slots the review did not list (2- and 3-person slots in kantor, tol, bengkel, pool) follow the same rule (+58 for `kanan`, −58 for `kiri`). The script never uses them.
- Result: wawancara 3 is evenly spaced with air between all three at 360 and 1280. No new overlaps seen in wawancara 3 (360 and 1280) and wawancara 2 (360), which I opened. K07 kantor, bengkel, pool and tol were captured and pass the automated checks, but I did not open those screenshots after the change.

**D-102 (blank board behind the activity card): NOT done.** The backdrop is a CSS background image, so the pixel lettering would need either a second baked PNG per language or an overlay element with its own scaling maths. That is more than a few lines; left for a later round.

**Also changed**
- Added a `data-kamera` attribute on the stage root (camera x, y and visible world size) for checks.
- `tools/cek-piksel-t013.mjs`: the card is now checked at 768 and 1024 too (asserts ≥ 125 art px visible); output folder `team/evidence/T-013/final/`.

**Tests**
- `npm run test:client`: **728 / 728 pass**.
- `npm run test:e2e`: **exit 0, kegagalan 0, console/http bermasalah 0**.
- `node tools/cek-piksel-t013.mjs`: **75 / 75 PASS** (73 from Stage 3 + the card at 768 and 1024), 0 `.webp` requests.
- `tsc --noEmit` clean; production build OK.

**Screenshots** (`team/evidence/T-013/final/`)
- Card, image only: `kartu-ep2-gambar-{360,390,768,1024,1280}.png`. Whole page: `kartu-cerita-{360,390,768,1024,1280}.png`.
- D-100: `wawancara-3-360-id.png`, `wawancara-3-1280-id.png`, `wawancara-2-*-id.png`, `bima-*-id.png` (K07), `bengkel-*-id.png`, `pool-*-id.png`, `tol-*-id.png` (each at 360, 390, 1280).


## T-015 (2026-11-16): phone cut-in covered Miss Raksa's head

Fullstack · NOT committed · base 11c8c75. Board status: review.

**Cause.** The cut-in was always drawn top-right of the stage. On a phone the kantor camera shows only about 160 art px of width, so the top-right square sat exactly on Miss Raksa's head (she stands at x 800).

**Scenes affected.** The script has three kantor scenes with a cut-in plus a character on stage: the three endings `akhir-puas`, `akhir-kurang`, `akhir-catatan` (Miss Raksa at the counter, Hendra on the phone). All phone widths were affected; 1280 was not.

**Placement rule** (`tataSisipan` in the new `ui/latar/piksel/tata.ts`).
- Candidates in order: top-right (default), top-left, left under the name board, right under the name board.
- The first candidate that touches no character head box and not the board wins. If none fits, the cut-in steps down in whole pixel scales (to 50 %). If still none, the board may be covered; a head never is.
- Result: on phones the cut-in sits left, under the LAYANAN KLAIM RAKSA board (board readable, head free). At 1280 it stays top-right. Miss Raksa and the camera do not move.
- I did not use the "move Miss Raksa left" option: the board, her head and the cut-in do not fit side by side in a phone view, and her head would cover the board.

**Code.**
- `ui/latar/piksel/tata.ts` (new): the pure layout functions moved out of `PanggungPiksel.tsx` (no behaviour change) plus `tataSisipan` / `sisipanAdegan`. `PanggungPiksel.tsx` re-exports them.
- `PanggungPiksel.tsx`: draws the cut-in at the chosen place; stage root now carries `data-sisipan`, `data-sisipan-letak`, `data-kepala`, `data-bawah` (CSS px) for checks.
- `adegan.test.ts`: new test. Every kantor scene with a cut-in from the story graph (plus a Miss Raksa + Bima guard case) at the three measured stage boxes and a sweep of 162 other sizes: no cut-in/head intersection, cut-in fully on stage.
- `tools/cek-sisipan-t015.mjs` (new): browser check + screenshots. `tools/cek-piksel-t013.mjs` now runs the same check for the `cutin-*` states.
- `tools/cerita/state-kantor-t013.mts`: saves `cutin-*` states (one step before the scene; the checker presses Lanjut once). `team/evidence/T-013/states.json` regenerated (19 states).

**Tests** (own server on :4001; :4000 not touched)
- `npm run test:client`: 729 / 729 pass.
- `npm run test:e2e`: exit 0, kegagalan 0.
- `node tools/cek-piksel-t013.mjs`: 84 / 84 PASS (75 before + 9 cut-in checks).
- `node tools/cek-sisipan-t015.mjs`: 9 / 9 PASS (3 scenes x 360x740 DPR2, 390x844 DPR3, 1280x800).
- `tsc --noEmit` clean; production build OK.

**Screenshots** (`team/evidence/T-015/`, all `id`)
- `cutin-akhir-puas-missRaksa-{360,390,1280}-id.png`
- `cutin-akhir-kurang-missRaksa-{360,390,1280}-id.png`
- `cutin-akhir-catatan-missRaksa-{360,390,1280}-id.png`
- `hasil.json` (measured rects per case)

**Notes**
- `npm run build` rewrote `client/dist`. If the owner's :4000 server serves that folder, it now serves this uncommitted fix.
- I opened the `akhir-puas` screenshots at 390 and 1280; the other seven passed the automated check but I did not open them.
- On phones the cut-in's lower-right corner comes close to the desk phone handset (no overlap of the handset body seen at 390).
- Not checked on a real iPhone.


## T-016 (2026-11-16): polish bundle (T-009 hero, D-102 board, idle motion, stray WebPs)

Fullstack · NOT committed · base 722014f. Board: T-009 done (folded in), T-016 review.

**1. T-009 hero art (D-48, D-49, D-50): all three done.**
- D-48: both clouds moved to y 4 and the stray 4x4 pixel at (176, 8) removed (`art/WelcomeArt.tsx`, `team/specs/T-004-hero-art.txt`). At 430 wide there are no cloud slivers; at 800 and 1280 the clouds show whole.
- D-49: `.lp-halaman .lp-kota-sapa { padding-left: 0 }` at <= 900 (`player.css`). At 800 the portrait and the frame both start at x 190. Desktop keeps 4 %.
- D-50: counter plant moved 4 units left (x 244/246/248/242/246); the leaves no longer touch the tower outline.
- Homepage numbers unchanged: "Masuk" bottom 566 / 578 / 778 / 515 at 360 / 390 / 800 / 1280, no horizontal scroll.

**2. D-102 activity backdrop: the board now reads LAYANAN KLAIM RAKSA.**
- New `seni/piksel/ep2-papan-kantor.png` (789 B, transparent, same 400x225 size as the kantor wall, text only). `hp.css` stacks it over the wall with the same background size and position, so the text lands exactly on the board at any card size.
- Built by `tools/piksel/bangun-papan-ep2.mts` from the same pixel font, board box and colour as the stage. The placement maths moved to `ui/latar/piksel/papan.ts`, used by both the stage and the tool.
- Same text in id/en/zh (en and zh have no own entry and fall back to id). New unit test checks the text matches `lokasi.kantor` and fits the board.

**3. Idle motion in pool and bengkel.**
- Root cause: blink did work in every room, but it is only 140 ms long every 3-5 s, so a sampler slower than that misses it. The idle bob ran only while a character was speaking; the pool and bengkel scenes QA sampled are narration lines with no speaker, so nothing else moved.
- Fix (`PanggungPiksel.tsx`): the 1.2 s bob timer now runs whenever a character is on stage. With no speaker, every standing (slot) character bobs 1 art px, alternating by slot. With a speaker, behaviour is as before. Blink unchanged. All off under reduced motion.
- Measured over 10 s at 100 ms (before -> after, distinct frames / bob toggles): pool 2 / 0 -> 3 / 8, bengkel 2 / 0 -> 3 / 8, tol 2 / 0 -> 4 / 8, wawancara-1 2 / 0 -> 3 / 8. Blink seen in all four. Reduce + `?gerak=ikut`: 1 frame, 0 changes in all four.
- New `tools/cek-gerak-t016.mjs` (canvas hash + `data-mata` + new `data-napas`); `tools/cek-piksel-t013.mjs` now runs it for pool and bengkel (normal + reduced).
- Side effect: Bima in the kantor (K07) also bobs during narration lines. Miss Raksa behind the counter does not.

**4. Stray WebPs: gone from the build.**
- Names: `bima-avatar-320`, `hendra-cemas-avatar-320`, `hendra-tenang-avatar-320` (`.webp`, about 50 KB).
- What emitted them: the prototype pages `ProtoKejadian` / `ProtoLokasi`. `App.tsx` gated their `import()` on the exported `KEJADIAN` flag, which the bundler could not remove, so the normal build still emitted both page chunks and their avatars.
- Fix: `App.tsx` now tests the build constant `__KEJADIAN__` directly, so the normal build drops the pages and the WebPs. `client/dist` has 0 prototype WebPs (the 3 remaining `.webp` are `karakter/*-besar.webp` from `public/`, used elsewhere).
- Sources NOT deleted: they still have a consumer, the `VITE_KEJADIAN=1` prototype build. I did not rebuild that prototype to confirm it still works.

**Tests** (own server on :4001; :4000 not touched)
- `npm run test:client`: 730 / 730 pass.
- `npm run test:e2e` (RAKSA_LEGACY=on): exit 0, kegagalan 0.
- `node tools/cek-piksel-t013.mjs`: 86 / 86 PASS (84 + bengkel normal/reduced).
- `node tools/cek-gerak-t016.mjs`: 8 / 8 PASS.
- `tsc --noEmit` clean; production build OK.

**Screenshots** (`team/evidence/T-016/`)
- Homepage: `beranda-{360,390,430,800,1280}.png`.
- Activity backdrop: `latar-aktivitas-papan-{id,en,zh}.png` (backdrop only), `aktivitas-390-{id,en,zh}.png` (whole screen).
- Motion, two different frames: `gerak-{pool,bengkel,tol,wawancara-1}-{a,b}.png`; numbers in `gerak.json`.

**Notes**
- I opened `latar-aktivitas-papan-id.png`, `beranda-800.png` and `beranda-430.png`. The rest were captured but not opened.
- `npm run build` rewrote `client/dist`; a :4000 server serving that folder now serves these uncommitted changes.


## T-014 (2026-11-16): Episode 2 text in English and Chinese

Fullstack · NOT committed · on top of the uncommitted T-016 tree (no T-016 file changed for T-014). Board: review.

**What changed**
- New `episode/auto-2/teks.en.ts` and `teks.zh.ts`: 894 keys each, the exact key set of `teks.id.ts` (the file has 972 lines; 894 are keys, the rest comments).
- `auto-2/teks.ts` wires id/en/zh like auto-1; `auto-2/episode.ts` now has `bahasa: ['id', 'en', 'zh']`.
- Everything the player reads through the text table is translated: dialogue, narration, choices, chat, attachments, activities and arena labels, feedback reasons, endings, summary cards, the 15-decision recap, glossary terms.
- Conventions (written in the header of each file):
  - Names stay. Honorifics follow auto-1: Pak Hendra / Bima / Darto = "Mr Hendra" / "Hendra 先生"; Mas Rudi = "Rudi".
  - Miss Raksa's title is "Claims Officer" / "理赔专员" (T-002).
  - English uses British spelling like auto-1, but keeps "truck" (not "lorry").
  - Numbers match the source exactly (the episode validator enforces this), so times stay "20.10" / "20.15".
- Both translations are DRAFT: written by me, not reviewed by a native speaker, the Designer or the owner. Meaning review is theirs (spec Rev 1.1).

**Nameplate decision**
- The kantor nameplate keeps the Latin brand label "Layanan Klaim Raksa" in id, en and zh (`lokasi.kantor` is identical in all three).
- Why: the pixel font has Latin glyphs only. A translated zh label would fall back to system text on the canvas, and the T-016 activity backdrop already bakes this same lettering. The other location names (depot, workshop, toll road, interview room) are translated; they are not drawn on a pixel board.

**Overflow check (actor labels, choice buttons, chat bubbles, dialogue, activity cards, end screen)**
- New `tools/cek-bahasa-t014.mjs`: every saved state plus a fresh start driven to the K01 choice list, in en and zh at 360x740 DPR2, 390x844 DPR3 and 1280x800. It fails on horizontal page scroll, any story text element outside the viewport or clipped sideways, or an Indonesian word left in visible text.
- Result: 120 / 120 pass. No overflow found, so no wrapping fix was needed; the existing layouts wrap the longer English lines.

**Tests** (own server on :4001; :4000 not touched)
- `npm run test:client`: 735 / 735 pass (730 + 5 new in `auto-2/teks.test.ts`; the old "Indonesian only" test in `episode.test.ts` was replaced).
- New completeness test covers: exact key-set equality, non-empty values, identical `{placeholder}` sets, `Episode.bahasa`, a three-language data walk (nodes, arena, attachments, dynamic keys) with no raw key and no fallback to Indonesian, activity missions per language, and an Indonesian-word scan. Values equal to Indonesian are limited to an explicit list of names and the brand.
- `npm run test:e2e` (RAKSA_LEGACY=on): exit 0, kegagalan 0.
- `node tools/cek-piksel-t013.mjs`: 86 / 86 PASS. `node tools/cek-bahasa-t014.mjs`: 120 / 120 PASS.
- `tsc --noEmit` clean; production build OK.

**Screenshots** (`team/evidence/T-014/`, each in `en` and `zh`)
- `kantor-{390,1280}-{en,zh}.png`, `wawancara-3-{390,1280}-{en,zh}.png`, `aktivitas-{390,1280}-{en,zh}.png`, `akhir-{390,1280}-{en,zh}.png` (full page).
- Extra: `pilihan-k01-{360,390,1280}-{en,zh}.png` (longest choice buttons). `hasil.json` has the per-case results.

**Open items**
- Lettering drawn inside the small activity illustrations is still Indonesian (`seni/auto-2/benda.ts`: FORMULIR, POLISI, DIPROSES, KARTU KELUARGA, SLIP GAJI, REK. KORAN, ESTIMASI, BENGKEL LAIN, PEMERIKSAAN, JELAS, KOMITE, KONTAK, BIAYA BENGKEL, TENDER, LAPORAN, POOL). It is art, not the text table, so I left it; the translated caption sits next to each picture. Designer to decide: keep as Indonesian documents, or thread the language through about 20 art functions.
- I opened six screenshots (zh wawancara-3 390, en activity 390, zh K01 choices 390, en ending 390, en first screen 390); the others were captured and passed the automated check but were not opened.
- Not checked on a real phone. The Chinese relies on the device's system CJK font.
- `npm run build` rewrote `client/dist`; a :4000 server serving that folder now serves these uncommitted changes.

### Fix (2026-11-16, after QA FAIL B-01, Codex R-18, Designer D-106..D-124)

Fullstack · NOT committed · T-017 edits in the tree left as they were. Board: review.

**Root cause.** Some sentences are assembled in code after the player acts, so they never passed through the text tables and neither the completeness test nor the browser check could see them.

**Places fixed (Indonesian words reaching en/zh)**
1. `hp/arena/rambu.ts` `daftarLajur()` ("lajur 1 dan 3", "belum ada lajur"): now built from the text table. Used by the lane-sign choices, the "Your action" summary and Mr Bima's response.
2. `episode/auto-2/arena.ts` `daftar()` (document list in the K02 chat message, ", … dan …"): now uses per-language joiners.
3. `lokasi/Adegan.tsx` (the road illustration in the lane-sign activity and its result): three visible strings and two screen-reader labels were hard-coded Indonesian ("Truk · menurut supir", "Ilustrasi • posisi truk menurut supir. Bukan denah kejadian.", lane names). **Found by the extended browser check, not by QA or the Designer.** Now passed in from the text table; the Indonesian prototype page keeps its own defaults.

Wording is the Designer's (D-123): en "lane 3", "lanes 3 and 4", "lanes 2, 3 and 4", "no lane yet", "A, B and C"; zh "第 3 车道", "第 3、4 车道", "还没有车道", "A、B和 C" with the Han-Latin space. The K02 message renders exactly as the Designer's example in both languages (asserted in the test).

**D-124, Chinese punctuation from code joiners (all now full-width in zh, unchanged in id/en)**
- Action summary (`hp/arena/ringkas.ts`): "访谈：A、B。不需要：C".
- "Present:" line (`hp/AdeganTatap.tsx`), bundle reminder (`ArenaBundel.tsx`), unfinished-items hints (`PapanSaksi.tsx`, `ArenaBandingkan.tsx`).
- Bold label + colon: "Why", "Goal" on the chat gate, "Chosen", sign names (`bagianHp.tsx`, `Obrolan.tsx`, `ArenaTujuan.tsx`, `ArenaRambu.tsx`), plus the status announcement sentence in `Obrolan.tsx`.

**D-121.** zh reply button is now "回复 {nama}" (`i18n/kamus/ceritaHp.ts`).

**Designer text fixes pasted exactly as given** from `team/specs/T-014-teks-fixes.json`: **en 36 keys** (D-106..D-112), **zh 97 keys** (D-113..D-120).

**New text keys: 16 per language (894 -> 910).** List joiners and punctuation (`daftar.*`, 5), lane wording (`arena.rambu.lajur*`, 6), road-illustration labels (`arena.rambu.adegan.*`, 5). Key sets, placeholders and numbers still match across id/en/zh.

**Not changed, on purpose**
- `seni/auto-2/benda.ts` art lettering stays Indonesian (Codex R-18 / D-122, accepted by the Lead). R-18 was the only [R-xx] item in the Codex review.
- `lokasi/logika.ts` still has Indonesian sentences: it is the `/lokasi` prototype (VITE_KEJADIAN build only). Episode 2 imports one function from it that returns lane numbers, not text, so nothing from it reaches en/zh.
- The case-desk prototype (`hp/meja/*`, VITE_MEJA_KASUS build only) still joins with ASCII ". " and ":".

**Checks added so a leak like this is caught**
- `auto-2/teks.test.ts`, 2 new tests:
  - Renders every code-assembled sentence (document message, action summaries for all activities, lane lists, Mr Bima's responses) in en and zh and scans for 29 Indonesian function words. It first proves the scanner fires on the Indonesian output.
  - Scans the story UI source for string-built joiners ("… dan …", "lajur ${…}").
- `tools/cek-bahasa-t014.mjs`:
  - Three new saved states taken right after an activity (`akt-berkas`, `akt-rambu`, `akt-saksi`, generated by `tools/cerita/state-kantor-t013.mts`). Each must show the expected assembled sentence in its language.
  - The Indonesian word list grew to 29 words.
  - Chinese lines are scanned for ASCII punctuation between Han characters.
- First run of the extended check: 39 failures (the road-illustration leak and the ASCII punctuation). After the fixes: all pass.

**Tests** (own server on :4011; :4000, :4001, :4002 not touched)
- `npm run test:client`: 738 / 738 pass (736 + 2).
- `npm run test:e2e` (RAKSA_LEGACY=on): exit 0, kegagalan 0.
- `node tools/cek-bahasa-t014.mjs`: **138 / 138 PASS** (was 120).
- `node tools/cek-piksel-t013.mjs`: 95 / 95 PASS (86 + the 3 new states at 3 sizes). `node tools/cek-jalan-t017.mjs`: 7 / 7.
- `tsc --noEmit` clean; production build OK.

**Notes**
- e2e and the walk check ran before my last two edits, which only touched the check tools' expectations, not the app.
- I did not open any screenshot in this round; the evidence is the page text asserted by the checks. The `team/evidence/T-014/` screenshots were re-taken by the check.
- `team/evidence/T-013/states.json` was regenerated (22 states; the 19 earlier ones keep their names and nodes).
- `npm run build` rewrote `client/dist`; any server serving that folder now serves these uncommitted changes.


## T-017 (2026-11-16): Rudi walks in at K04 pool (D-104)

Fullstack · NOT committed · on top of the uncommitted T-014 tree. Board: review. Hendra's frames are NOT in any atlas (D-105 pending).

**Art in the atlas** (`tools/piksel/bangun-samping.mjs`, `seni/piksel/samping.png` + `samping.json`)
- Rudi has two new frames, `jalan-kontak-kanan` and `jalan-lintas-kanan` (poses `jalan-a` / `jalan-b`), mapped to the existing samping palette (62 colours, none added). Body only: baked face, no expression or blink layers.
- **Read pitch chosen: 4.35, not 4.444.** At 4.444 the walk frames are 194 art px tall against 198 standing, so his head rises 4 art px when he stops. At 4.35 both walk frames are 198 tall and the head is still 36 / 35 art px wide (standing 35), so there is no jump. I compared both renders side by side before choosing.
- Anchors at 4.35 (the Designer's x53/y193 and x36/y193 were for 4.444): kontak x 54, y 197; lintas x 37, y 197. Rule kept from the Designer: head centre rounded down, feet on the bottom row, same as the standing frame (x 36, y 197).
- The builder takes more walkers later: add an entry to `JALAN`, or call the exported `bingkaiJalan(png, palette, pitch)` from another builder (Hendra's atlas has its own).

**Walk logic** (`ui/latar/piksel/tata.ts`, `PanggungPiksel.tsx`)
- When a character with walk frames becomes present in a room (including a newly mounted stage or room), he starts just outside the nearest view edge and walks to his slot. At K04 pool: from the left edge to x 420, facing the truck.
- Timing as specified: 270 ms per frame, alternating kontak / lintas, frame count = round(distance / 96 world px) clamped 3..7, linear travel snapped to whole art px. Measured walk: about 1.5 s at 360, 1.3 s at 390, 1.8 s at 1280.
- One deviation from the Designer's text: the last frame is always lintas (as asked), so when the frame count is odd the sequence starts on lintas instead of kontak. "Start on kontak" and "end on lintas" cannot both hold for an odd count.
- Replaces the 180 ms slide-in only for characters with walk frames; everyone else is unchanged. No blink, hop or bob while walking.
- Reduced motion with `?gerak=ikut`: no walk, he is simply standing.
- "Lanjut" during the walk: he snaps to the standing frame. `AdeganTatap` passes a new `kunciLangkah` (node + line) down to the stage for this.
- He walks once per visit: coming back to the pool stage after the activity or a chat does not replay it; a page reload at K04 does.
- New canvas attributes for checks: `data-jalan` (id:pose:x while walking) and `data-kaki` (foot x per character).

**Bytes**
- `samping.png`: 28,471 -> 36,959 B (**+8,488 B**; the estimate was about 7.3 KB, the difference is the slightly larger 4.35 frames and repacking; atlas 512x394).
- Episode 2 stage PNGs (rooms, props, board text, hendra, samping, miss-raksa): **161,008 B** of the 400 KB gate (152,520 before this task).

**Tests**
- `npm run test:client`: 736 / 736 pass (1 new: atlas frames, only Rudi has a walk, K04 plan at three stage sizes).
- `npm run test:e2e` (RAKSA_LEGACY=on, own server on :4011): exit 0, kegagalan 0.
- `node tools/cek-piksel-t013.mjs`: 86 / 86 PASS.
- New `node tools/cek-jalan-t017.mjs`: 7 / 7 PASS:
  - Canvas hash at 360, 390 and 1280: the pool scene changes during the first 2 s (21 to 34 distinct frames), both walk frames seen, foot x only increases on whole art px, and it ends with Rudi standing at x 420.
  - Reduced motion: never walks, 1 distinct frame.
  - "Lanjut" mid-walk: standing at 420 straight after.
- `tsc --noEmit` clean; production build OK.

**Evidence** (`team/evidence/T-017/fullstack/`)
- `pool-390-0_3d.png`, `pool-390-0_9d.png`, `pool-390-akhir.png` (390x844 DPR3 at 0.3 s, 0.9 s, end).
- `pool-1280-0_9d.png`, `pool-1280-akhir.png`. `hasil.json` has the measurements.

**Notes**
- I opened the 390 screenshots at 0.9 s and at the end; the other three were captured but not opened. I did not watch the walk as a moving sequence, so foot sliding and overall feel are for the Designer's review.
- The `pool-*` screenshots that `cek-piksel-t013.mjs` takes now catch Rudi mid-walk (it waits 0.6 s).
- Servers: ports 4001 and 4002 were held by servers I did not start, so my first check runs went against 4001; I reran e2e and the walk check on my own :4011 and stopped only that one. :4000, :4001 and :4002 were not touched.
- `npm run build` rewrote `client/dist`; any server serving that folder now serves these uncommitted changes.

### Fix (2026-11-16, Designer motion review D-125, D-126; addenda D-127, QA B-02, owner CPU note)

Fullstack · NOT committed. Board: T-017 stays `review`, note "D-125/D-126 fixed".

**D-125, feet sliding: fixed (one number).**
- Nominal travel per pose 96 -> **164 world px (41 art px)**; pose count = round(distance / 164) clamped **3..6**; travel per pose = distance / count on whole art px; still 270 ms per pose and always ends on lintas.
- Measured in the browser:

  | Size | Poses | First pose | Walk time |
  | --- | --- | --- | --- |
  | 360 | 4 | kontak | about 1.0 s |
  | 390 | 3 | lintas | about 0.8 s |
  | 1280 | 4 | kontak | about 1.1 s |

- The tempo is one constant, `LANGKAH_JALAN_MS` in `ui/latar/piksel/tata.ts`: change 270 to 300 on that line if the owner finds it brisk. Travel and pose limits are named constants next to it.

**D-126, shoes cut by the camera: fixed with a general rule, not per-room numbers.**
- New `turunkanKeKaki()` in `tata.ts`: in the field rooms (pool, bengkel, tol, wawancara), when the bottom edge cuts a standing figure's feet by a small amount, the camera moves down by exactly that much in whole art px. It only does so if the tallest head keeps at least 2 art px of air, the room's must-see box stays in view and the view stays inside the world. Scale is unchanged.
- Camera offsets (camera y in world px, before -> after; my cut figures count the sole row, so they are about 1 art px larger than the Designer's):

  | Room, size | Camera y | Moved down | Shoes cut before | Head air after |
  | --- | --- | --- | --- | --- |
  | pool 1280 | 20 -> 64 | 11 art px | 11 | 2 art px |
  | pool 390 | 21 -> 41 | 5 art px | 4.5 | 7.75 |
  | pool 360 | unchanged | 0 | 0 | 31.5 |
  | bengkel 1280 | 32 -> 64 | 8 art px | 8 | 5 |
  | tol 1280 | 40 -> 84 | 11 art px | 11 | 2 |
  | tol 360 | 30 -> 46 | 4 art px | 3.5 | 11.5 |

- Wawancara at 1280 (1, 2 and 3 witnesses) is also whole now: camera y 74, head air 2 art px. I have no "before" number for it.
- Deliberately NOT changed:
  - Phone close-ups while a character is speaking (half body, feet cut by about 40 art px) are a designed framing; the rule leaves them alone because the feet cannot fit there.
  - Kantor (characters behind the counter) and the /cerita episode card are untouched.

**D-127 (Lead addendum).** zh `statusTetapNaik` / `statusTetapTurun` in `i18n/kamus/ceritaHp.ts` now carry the Designer's exact text. The two screen-reader strings: chat speaker label uses the full-width colon in zh (`Obrolan.tsx`), and zh `statusAria` in `cerita.ts` has the space before the name.

**B-02 (QA: e2e failing 3 of 3). Not reproduced as a code regression; it is timing under CPU load. Not bisected.**
- On this final tree (T-014 fix + T-017 fix + D-127), alone on my own server: **run 1 exit 0, kegagalan 0; run 2 exit 0, kegagalan 0** (logs `e2e-lulus-run1.log`, `e2e-lulus-run2.log`).
- Run 3 started while the machine was busy and failed with "timeout ack misi 7" lines; I stopped it.
- A further run at below-normal priority failed from mission 2 on with 32 timeout lines ("timeout mode bermain", "timeout ack"); I stopped it when the Lead said to stop e2e (`e2e-prioritas-rendah-dihentikan.log`).
- Reading: the e2e drives six browsers and has fixed waits, so it fails when it is starved of CPU, whatever the code. Two clean passes on the same tree are why I did not bisect. No legacy-game file is changed by T-014 or T-017.
- No further e2e was run after the Lead's stop message. `tools/e2e-browser.mjs` was not edited by me.

**Owner CPU note: acknowledged.**
- My checks already ran one after another, but two of my commands hit the shell timeout and left their browser processes behind, and the e2e itself opens six browsers. I killed only my own leftover check processes and their browsers, and stopped my :4011 server.
- `cek-jalan-t017.mjs`, `cek-kaki-t017.mjs` and `cek-sisipan-t015.mjs` now set low process priority like the Lead's four tools.
- From now on: one browser check at a time, never alongside a build, low priority, no e2e unless the Lead asks.

**Tests** (own server on :4011, now stopped; :4000 not touched)
- `npm run test:client`: 740 / 740 pass (738 + 2: pose counts at the three sizes; camera rule incl. close-up and kantor left alone).
- `node tools/cek-jalan-t017.mjs`: 8 / 8 PASS (pose counts 4 / 3 / 4 asserted, ends on lintas, reduced motion, Lanjut mid-walk, stills at three sizes).
- New `node tools/cek-kaki-t017.mjs`: 18 / 18 PASS (6 scenes x 3 sizes: no small foot cut, head at least 1 art px from the top; close-ups reported as such).
- `node tools/cek-piksel-t013.mjs`: 95 / 95. `node tools/cek-bahasa-t014.mjs`: 138 / 138 (after D-127).
- `npm run test:e2e`: see B-02 above (2 clean passes, then stopped on instruction).
- `tsc --noEmit` clean; production build OK.

**Evidence** (`team/evidence/T-017/fullstack-fix/`)
- Pool stills: `pool-{360,390,1280}-0_3d.png`, `pool-{360,390,1280}-0_9d.png`, `pool-{360,390,1280}-akhir.png`. At 390 the 0.9 s still already shows him standing (the walk is 0.8 s).
- Camera at 1280: `pool-1280-kamera.png`, `bengkel-1280-kamera.png`, `tol-1280-kamera.png`. Measurements: `kaki.json`, `hasil.json`.
- I opened `pool-1280-akhir.png`, `pool-360-0_9d.png` and `tol-1280-kamera.png`; the rest were captured but not opened.

**Notes**
- One walk-check run failed once when the machine was busy (too few samples in 3 s); I lowered its minimum sample count from 5 to 3, since the pose count is the real assertion.
- I did not watch the walk in motion; whether the feet now plant is for the Designer's recording.
- `npm run build` rewrote `client/dist`.

## T-018 Stage 1 (2026-11-16): chat screens never page-scroll

Fullstack · NOT committed (base 23dc15d). Board: T-018 stays `doing`, note "Stage 1 built".

**What changed (Episode 2 chat screens, phone and tablet widths)**
- The page no longer scrolls on a chat screen. Before, the longest chat was 3,447 px tall on a 740 px screen; now the page is exactly the screen height at 360x740, 390x844 and 360x640.
- Shell: `.hp-layar[data-tampilan="obrolan"]` is a column of `height: 100vh; height: 100dvh` with `overflow: hidden`; `.hp-main` is the `min-height: 0` child. Safe area: top in `.hp-kepala` (as before), bottom once in `.hp-main`. No `position: fixed`, no body/#root rule.
- **The one scroller is `.hp-gulir`** (new `<div data-gulir>` in `Obrolan.tsx` around the "earlier messages" button, the message list and a tail slot `.hp-ekor`). It has `overflow-y: auto`, `overscroll-behavior-y: contain`, `touch-action: pan-y pinch-zoom`.
- Chat header: no longer sticky on phones; it is a fixed row above the scroller.
- Composer `.hp-komposer`: fixed row below the scroller. It holds the primary button (Balas / Lanjut / Kirim balasan / Mulai) or the task card. The session gate ("Mulai percakapan") is pinned the same way.
- Reply choices: after "Balas", the question and the option list appear at the end of the scroller (the tail slot), and only "Kirim balasan" stays pinned. Otherwise the options would leave no room for the messages. Done with a React portal in `PilihBalasan.tsx`; outside the phone chat shell the block renders as one piece, as before.
- Glossary chips and the K08 road summary (the old "sisipan") also sit in the tail slot.

**Following the newest message**
- On open: the scroller starts at the newest message.
- On new messages: it follows. If the new group is taller than the visible area, the first new message is put at the top (so nothing is skipped); otherwise it goes to the end. It also keeps following while the typing indicator turns into messages and when the composer changes height (ResizeObserver).
- If the player has scrolled up by more than 80 px (`BATAS_IKUT` in `hp/ekor.ts`): the position is kept and the existing pill appears above the composer; tapping it scrolls to the end. The pill text was already translated: "Pesan baru ↓" / "New message ↓" / "新消息 ↓".
- The player's own reply is always followed.
- "Lihat pesan sebelumnya": the view lands on the boundary between old and current messages; scrolling up reaches the first message and the "hide" button.

**Where the shell applies**
- Media query `(max-width: 1023.98px) and (min-height: 480px)`, kept identical in `hp/desain.css` and `KUERI_CANGKANG` in `hp/ekor.ts`.
- Desktop 1024 and wider: old behaviour. The 1280 screenshots of two chat states are byte-identical to the ones taken before the change.
- Screens lower than 480 px (phone in landscape): old page-scrolling behaviour, because header + composer would leave no room for messages.

**Findings**
- **Episode 1 has no chat screen.** It runs on the standard story player (`PemainCerita` in `pages/CeritaMain.tsx`), not on `PemainHP`; only Episode 2 has `antarmuka: 'hp'`. The Codex note that Episode 1 shares this shell is not correct for the current code. Nothing changed for Episode 1 in this stage; the check records that and takes a screenshot (`ep1-390-id-*.png`, the opening screen, which fits 844 px).
- Old WebKit without `dvh` (iOS before 15.4) falls back to `100vh`: there the button can sit under the toolbar until it collapses. I did not add `-webkit-fill-available`, because it is unreliable without html/body rules.
- Tightest case: 360x640 with the task card and the first-visit sound hint leaves 215 px for messages (`obrolan-tugas-360x640-id-chromium.png`). It passes, but the Designer may want the card shorter there.

**Check tool: `tools/cek-gulir-t018.mjs`** (imports `prioritas-rendah.mjs`; one browser at a time)
- States from the real story engine: `tools/cerita/state-obrolan-t018.mts` -> `team/evidence/T-018/states.json` (Part 4 with 61 messages, Part 1 owner case, a Lanjut state, a decision, a task card).
- Result on my server (:4001, stopped): **50 / 50 PASS**: Chromium 35, WebKit 15.
- Per screen: page height not above the screen and `window.scrollTo` does not move; primary button inside `visualViewport`; exactly one overflowing region, which scrolls to its end; both headers stay put; opened history reaches the first message.
- Behaviour: follow after Lanjut; pill after scrolling up, in id / en / zh, and tap goes to the end; gate -> Balas -> options in the scroller with Kirim pinned -> send -> follows.
- Sizes 360x740 DPR2, 390x844 DPR3, 360x640 DPR2. Chromium: all states in id plus the longest state in en and zh. WebKit (Playwright build 2388): the longest state and the owner case at all three sizes, en / zh at 390, and the behaviour checks at 390.
- Wired into `tools/cek-piksel-t013.mjs` (Chromium: longest chat at the three sizes + follow): that tool now reports **99 / 99** (was 95).
- `tools/cek-bahasa-t014.mjs`: selector extended to `.hp-ekor` so the reply choices are still scanned: 138 / 138.

**Other tests**
- `npm run test:client`: 740 / 740. `tsc --noEmit` clean. Production build OK.
- `test:e2e`: not run (Lead runs it).

**Evidence** (`team/evidence/T-018/stage1/`)
- Chat id: `obrolan-b1-{360,390,360x640}-id-chromium.png` (owner case), `obrolan-b4-*` (longest); en / zh: `obrolan-b4-390-{en,zh}-{chromium,webkit}.png`.
- Options open: `balas-b1-*.png`; pill: `pil-390-id-*.png`; desktop: `obrolan-b{1,4}-1280-id-chromium.png`; Episode 1: `ep1-390-id-*.png`.
- Before the change: `sebelum/` (same names) and `sebelum/hasil.json`. Results: `hasil.json`.
- I opened six of the screenshots (owner case 360, options at 360x640, pill 390, zh WebKit 390, task card 360x640); the rest were captured but not opened.

**Needs attention**
- **node_modules:** to get WebKit I ran `npm i -D playwright-core`, and npm removed the unsaved `puppeteer-core` with it. I reverted `package.json` / lock and reinstalled both with `npm install --no-save puppeteer-core@24 playwright-core@1.65.1`. `puppeteer-core` is now 24.43.1; I do not know which version was there before. All browser checks above ran on it. Always install the two in ONE command, or npm drops the other.
- Not checked: a real iPhone (toolbar collapsed / expanded), which is the owner's check. There is no text input in chat, so no keyboard case.
- `npm run build` rewrote `client/dist`, which the owner's :4000 server also serves. I did not touch that server (it was restarted by someone else during my work).
- Running `cek-piksel-t013.mjs` rewrote the T-013 evidence screenshots, as it always does.

## T-019 (2026-11-16): endings in person, Hendra walks in (D-105)

Fullstack · NOT committed (base 23dc15d; T-018 Stage 1 is also uncommitted in the same tree). Board: T-019 -> `review`.

**What changed**
- The three endings (`akhir-puas`, `akhir-catatan`, `akhir-kurang`) are staged in person in the kantor: Miss Raksa behind the counter, Pak Hendra walks in from the right view edge (walk frames mirrored) to the visitor slot x 980, then stands facing left. No phone cut-in. Text unchanged.
- The cue is in `episode/auto-2/episode.ts`, not `adegan.ts`: `tata: { lokasi: 'kantor', hadir: ['missRaksa', 'hendra'], telepon: null }`. `adegan.ts`, `tata.ts` and `PanggungPiksel.tsx` needed no change; the T-017 walk code already handles right-edge entry and mirroring.
- Side effect of the restage: Hendra's ending line is now a spoken line on the stage, no longer a WhatsApp message with a portrait cut-in. The three `akhir.*.1` entries were removed from `Episode.cutIn`.
- Atlas: `tools/piksel/bangun-hendra.mjs` now adds `jalan-kontak-kanan` / `jalan-lintas-kanan` (poses `jalan-a` / `jalan-b`) from `hendra-jalan-v1.png` at read pitch 4.582, mapped to the existing 40-colour palette. Result equals the Designer's table: 95 x 195 with anchor x51 / y194, and 73 x 196 with anchor x37 / y195.
- Expression after arrival comes from the script line, as before: puas -> senang, catatan -> tenang (line says netral), kurang -> kecewa (line says kesal). I did not change kurang to cemas.

**Walk, measured in the browser** (same constants as Rudi: 270 ms per pose, 3..6 poses, ends on lintas)

| Size | Stage box | Poses | First pose | Walk time | Travel per pose |
| --- | --- | --- | --- | --- | --- |
| 360x740 | 336 x 210 | 5 | lintas | about 1.35 s | about 44 art px |
| 390x844 | 366 x 229 | 5 | lintas | about 1.35 s | about 38 art px |
| 1280x800 | 780 x 400 | 6 | kontak | about 1.6 s | 39 art px |

- Reduced motion with `?gerak=ikut`: no walk, he is standing at once. "Lanjut" mid-walk: standing at once.
- I did not watch it in motion; whether his feet plant at 38 to 44 art px per pose is for the Designer's recording. The travel constant (164 world px) was tuned on Rudi's drawn stride.

**Bytes**
- `hendra.png`: 18,445 -> **25,920 B (+7,475)**; Designer estimate was 7,738.
- Episode 2 stage PNGs (rooms, props, board text, hendra, miss-raksa, samping): 161,008 -> **168,483 B**, of the 400 KB gate.

**Findings for the Designer**
- **Hendra overlaps Miss Raksa.** At slot x 980 his body covers her right arm at 360 and 1280 (`akhir-*-360-akhir.png`, `akhir-*-1280-akhir.png`). The slot is as specified; a slot further right would separate them. Not changed.
- **His shoes are cut by the bottom edge**: 6 art px at 360 and 16 at 1280; at 390 it is the half-body close-up (44). The kantor camera is already at the top of the room and Miss Raksa's head has 6 art px of air, so the camera cannot move down enough; the T-017 foot rule deliberately does not apply to the kantor. Bima at the same slot (K07) is cut the same way today. Not changed.
- **Existing bug, not from this task:** Miss Raksa's shoes show on the floor below the counter front at 1280 (also in the opening scene, `team/evidence/T-013/final/mentor-1280-id.png`). Not changed.
- Name board: fully in view and not covered by either head at all three sizes.

**Tests** (own server on :4001, now stopped; one browser at a time; :4000 not touched)
- `npm run test:client`: **741 / 741** (740 + 1 new Hendra test: frames, anchors, right-edge plan, pose counts 5 / 5 / 6; four older tests updated to the new staging).
- New `node tools/cek-akhir-t019.mjs`: **23 / 23** (3 endings x 3 sizes: walk + framing; 3 screenshot runs; reduced motion; Lanjut mid-walk).
- `cek-piksel-t013.mjs`: 99 / 99 (the 9 cut-in cases are now 9 in-person ending cases). `cek-bahasa-t014.mjs`: 138 / 138. `cek-gulir-t018.mjs`: 50 / 50. `cek-jalan-t017.mjs`: 8 / 8. `cek-kaki-t017.mjs`: 18 / 18.
- `tsc --noEmit` clean; production build OK. `test:e2e` not run.

**Tool and state changes**
- `tools/cerita/state-kantor-t013.mts` saves `akhir-puas|catatan|kurang`; `team/evidence/T-013/states.json` regenerated (the three `cutin-akhir-*` states no longer exist, because no script scene has a cut-in plus a figure any more).
- `cek-sisipan-t015.mjs` standalone now reports "no cut-in states" as a note, not a failure. The T-015 head rule is still guarded by the unit test with a made-up scene.
- `team/evidence/T-018/states.json` regenerated: the longest Part 4 chat state used to be the ending line; it is now node k15-c with 60 messages.

**Evidence** (`team/evidence/T-019/`)
- Per ending: `akhir-<x>-390-0_3d.png`, `-0_9d.png`, `-akhir.png`; `akhir-<x>-360-akhir.png`, `akhir-<x>-1280-akhir.png`; `hasil.json`.
- Note: the 360 / 1280 / first 390 screenshots in the folder are from the measuring run before the final assertion run; the code was the same.
- Frame sheet: `character/piksel/hendra/tinjau-jalan.png`.
- I opened `akhir-puas-390-0_9d.png`, `akhir-kurang-1280-akhir.png`, `akhir-catatan-360-akhir.png` and the frame sheet; the rest were captured but not opened.

**Notes**
- `npm run build` rewrote `client/dist` (also served by the owner's :4000).
- The check runs rewrote evidence under T-013, T-014, T-017 and T-018, as those tools always do.

### Fix (2026-11-16, Designer review D-135..D-138)

Fullstack · NOT committed. Board: T-019 stays `review`, note "D-135..138 fixed".

**D-135, Hendra covered Miss Raksa: fixed.** Kantor slot 1 now carries `xTokoh: { hendra: 1040 }` (`tools/piksel/bangun-ruang-ep2.mjs` -> `ruang-ep2.json`; only that line of the JSON changed, room PNGs are byte-identical). Pak Bima at K07 stays at 980 (checked in the browser and in the unit test). Slot y stays 860; the camera was not changed.

**D-136, feet sliding: fixed with a per-character stride.** `LANGKAH_JALAN_TOKOH = { hendra: 128 }` in `tata.ts` (32 art px per pose); everyone else, including Rudi, keeps 164. `POSE_JALAN_MAKS` 6 -> 7. Measured in the browser:

| Size | Poses | First pose | Walk time | Travel per pose |
| --- | --- | --- | --- | --- |
| 360 | 6 (was 5) | kontak | about 1.6 s | 34.1 art px |
| 390 | 5 | lintas | about 1.3 s | 34.8 |
| 1280 | 7 (was 6) | lintas | about 1.85 s | 31.3 |

Rudi at the pool is unchanged: 4 / 3 / 4 poses (`cek-jalan-t017.mjs` 8 / 8).

**D-137, Miss Raksa's shoes below the counter: fixed.** In `PanggungPiksel.tsx` the behind-the-counter figure is clipped at the bottom edge of the counter layer (kantor: world y 680, read from the layer, not a typed number). Applies to every kantor scene and size.
- Check: no dark pixel in the floor area under her feet, in the second beat of all three endings at three sizes and in the opening scene at 1280. At 360 and 390 the opening view does not reach that area, so nothing was examined there.
- I did not run this pixel check against the old build to prove it would have failed; the before picture is `team/evidence/T-013/final/mentor-1280-id.png` from the earlier run.

**D-138, status chip: fixed.** `.hp-vn .cer-suasana` may now use the stage width, so it is one line at 360 (194 x 25 px; was 181 x 42). It still touches the tip of Hendra's phone at 360 in his own beat (`akhir-catatan-360-akhir.png`); it no longer covers his hand and thigh.

**Bytes:** unchanged by this round. `hendra.png` 25,920 B; Episode 2 stage PNGs 168,483 B.

**Tests** (own server on :4001, now stopped; one browser at a time; :4000 not touched)
- `npm run test:client`: 741 / 741 (Hendra test updated: x 1040, Bima 980, stride 128 / 164, max 7, poses 6 / 5 / 7, 29..37 art px per pose).
- `node tools/cek-akhir-t019.mjs`: **45 / 45** (was 23: added chip height, shoe pixels, opening scene, Bima K07).
- `cek-piksel-t013.mjs` 99 / 99, `cek-jalan-t017.mjs` 8 / 8, `cek-kaki-t017.mjs` 18 / 18, `cek-bahasa-t014.mjs` 138 / 138, `cek-gulir-t018.mjs` 50 / 50.
- `tsc --noEmit` clean; production build OK. `test:e2e` not run.

**Evidence** (`team/evidence/T-019/fix/`)
- Per ending: `akhir-<x>-390-akhir.png` (his beat), `akhir-<x>-{360,390,1280}-ketukan2.png` (Miss Raksa's beat), `akhir-<x>-{360,1280}-akhir.png`, `akhir-<x>-390-0_3d.png` / `-0_9d.png`.
- `k07-bima-1280.png` (Bima unchanged at 980), `mentor-1280.png` (opening scene, no shoes), `hasil.json`.
- I opened `akhir-kurang-1280-akhir.png`, `akhir-catatan-360-akhir.png` and `akhir-puas-390-ketukan2.png`; the rest were captured but not opened.

**Notes**
- I did not watch the walk in motion.
- `npm run build` rewrote `client/dist`; the check runs rewrote evidence under T-013, T-014, T-017 and T-018.

## T-018 Stage 1b (2026-11-16): reply sheet (D-128), sound banner (D-129), D-130, D-131

Fullstack · NOT committed (base 56ffbb0). Board: T-018 note "Stage 1b built".

**D-128, reply sheet: built to the Designer's table.**
- On phones (the Stage 1 chat shell) "Balas ..." now opens a sheet that slides up from the composer (180 ms rise + fade; rows 30 ms apart; chosen badge pops; none under reduced motion). The Stage 1 placement (choices at the end of the message list) is gone.
- Parts: grab handle; Miss Raksa 32 px icon (`ikon-miss-raksa.png`, no new art) + question 16 / 20; numbered rows 15 / 19 with pixel-cornered badges (padding 6 / 10, gap 5, min 44); send button 48 px.
- Send label: "Pilih 1 balasan" (disabled) -> "Kirim balasan N". New keys in `i18n/kamus/ceritaHp.ts`: `pilihSatuBalasan`, `kirimBalasanN`, `catatan`, `catatanBaru`, `kembaliBalasan`, `tutupBalasan` (id / en / zh; en and zh wording from the mock: "Choose 1 reply", "Send reply N", "Note", "Back to replies"; "请选 1 条回复", "发送回复 N", "备注", "返回回复"). The button no longer jumps when a choice is made.
- No collapse into the preview bubble on phones: tap selects, tap another row changes.
- Reference card: behind the yellow "Catatan" tab (red dot until opened). The sheet flips to a plain note list with "Kembali ke balasan". Staged documents become a numbered list; the "order of explanation, not a schedule" line of parallel stages is kept as a footnote.
- While the sheet is open: chat header is one 44 px row (portrait 32, status inline), the sound banner is hidden, the message window shrinks and stays at its end.
- Close: tap the handle, swipe it down, or Esc. The selection is kept and restored when "Balas" is tapped again.
- Keyboard: radiogroup and arrows as before; keys 1-5 select; Enter on the selected row sends; focus moves to the question on open and back to "Balas" on close. Accessible names unchanged (question labels the group).
- The sheet reaches the bottom of the screen (the page's bottom padding moves inside the sheet, safe-area inset still applied once).
- Desktop (1024 and wider) and face-to-face decisions keep the old block.
- Code: `hp/PilihBalasan.tsx` (sheet + note), `hp/ekor.ts` (`LembarObrolan` context replaces the Stage 1 portal slot), `hp/Obrolan.tsx`, `hp/PemainHP.tsx`, `hp/desain.css`.

**Sheet heights, measured in the built game** (six chat decisions K01, K03, K06, K12, K13, K14; Chromium and WebKit gave the same numbers except two zh cases at 360x640)

| Visible page | Language | Sheet height | Chat left above the sheet | List scrolls? |
| --- | --- | --- | --- | --- |
| 390 x 645 (owner) | id | 465-503 | 33-62 px | no |
| 390 x 645 | en | 446-522 | 14-90 | no |
| 390 x 645 | zh | 388-427 | 109-148 | no |
| 390 x 844 | id / en / zh | same heights | 213-347 | no |
| 360 x 640 | id | 503-522 | 0-28 | K14 only |
| 360 x 640 | en | 484-531 | 0-47 | K01, K13, K14 |
| 360 x 640 | zh | 388-446 | 85-143 | no |

- Per decision at 390 x 645, id / en / zh: K01 503 / 522 / 427, K03 484 / 465 / 388, K06 484 / 446 / 398, K12 484 / 484 / 398, K13 465 / 522 / 408, K14 469 / 503 / 407.
- **Target at 390 x 645 met**: question, all five choices and the send button visible without scrolling in all 18 cases, both engines.
- **Fallback cases (360 x 640 only, 4 of 18):** K14 id (list 23 px too tall), K01 en (29), K13 en (19), K14 en (4). There only the choice list scrolls; question and send button stay. Note view: K03 en at 360 x 640 scrolls inside the note.
- Why 360 x 640 does not match the mock's "fits": in Part 4 the story header is 66 px, not 57 (the part title wraps at 360), and rows have the 44 px minimum the mock lacks. Sheets are about 20 px taller than the mock overall.

**D-129, sound banner: done.** Shown once per episode, only if the player is on the episode's first screen; removed on the first tap of any primary button or after 6 s, remembered per episode (the old global key still counts as dismissed). Never rendered while a reply sheet or an activity is open. Applies at every width, so the desktop chat screenshot no longer shows the banner mid-episode.

**D-130: my call = always show the header portrait on phones.** The rule that hid it during a cut-in is switched off inside the phone shell only; desktop keeps the old rule.

**D-131: done.** At heights under 700 px the task card in the chat composer uses padding 10, title 17 px and a one-line instruction (ellipsis).

**Tests** (own server on :4001, now stopped; one browser at a time; :4000 not touched)
- `npm run test:client`: 741 / 741. `tsc --noEmit` clean. Production build OK.
- `node tools/cek-gulir-t018.mjs`: **132 / 132** (Chromium 84, WebKit 48). Of these, 90 are sheet runs: every decision x id / en / zh at 390x645, 360x640 (both engines) and 390x844 (Chromium).
- Each sheet run checks: sheet and note tab inside `visualViewport`; no page scroll; all choices visible (or the list-only fallback at 360x640); label change without a jump; 48 px button; 44 px header; no banner; note flip and back keeping the selection; Esc closes and focus returns; selection restored on reopen; key "1" selects. At 390x645 in Indonesian, Enter sends and the chat follows.
- `cek-piksel-t013.mjs`: 99 / 99. `cek-bahasa-t014.mjs`: 138 / 138.
- `test:e2e`: not run (Lead).

**Evidence** (`team/evidence/T-018/stage1b/`)
- Mock states at 390x645 id: `lembar-k14-390x645-id-buka-*.png`, `lembar-k14-390x645-id-pilih-*.png`, `lembar-k06-390x645-id-nota-*.png` (Chromium and WebKit).
- `lembar-k03-390x645-en-buka-*.png`, `lembar-k13-390x645-zh-buka-*.png`, `lembar-k01-360x640-id-buka-*.png`, `lembar-k01-360x640-en-buka-*.png` (a fallback case).
- Desktop: `obrolan-b1-1280-id-chromium.png`, `balas-k14-1280-id-chromium.png` (old block). `hasil.json`.
- I opened four: K14 open (before the spacing fix), K14 chosen, K06 note (WebKit), K01 en at 360x640. The rest were captured but not opened.

**Not done / to judge**
- Swipe-down on the handle is implemented but not exercised by the check (tap and Esc are).
- Desktop is not byte-identical to Stage 1 any more: the mid-episode sound banner is gone (D-129). Layout checks for desktop pass; I did not diff the pixels beyond that.
- Not checked on a real iPhone.
- `team/evidence/T-018/states.json` regenerated with a `balas-<node>` state per chat decision. `npm run build` rewrote `client/dist`.

## T-018 Stage 2 (2026-11-16): stage, activity and end screens fit the phone (D-132..D-134) + addenda

Fullstack · NOT committed (base 56ffbb0; Stage 1b is uncommitted in the same tree). Board: T-018 note "Stage 2 built".

### A. Stage 2 proper

**Shell.** `PemainHP` marks the screen `data-kunci` for stage beats (action inside the dialogue box), activities and the end screen. From 560 px screen height and below 1024 px width the page is the screen height and does not scroll (`hp/cangkang.tsx`, block "T-018 Tahap 2" in `hp/desain.css`). Desktop and shorter screens keep page scroll. `PanggungPiksel` camera math is untouched.

**D-132 stage screens** (`AdeganTatap.tsx`)
- Gives way in order: stage steps down through the existing shapes (never below 2:1 = 168 px at 360, 183 at 390), then the goal line hides (it is now also in the Menu), then only the dialogue text scrolls (`.hp-vn-isi`), with the name tab sticky, the action row pinned and a 24 px fade.
- Measured, Indonesian (stage height in px; "goal hidden", "text scrolls" where they apply):

  | Beat | 360x640 | 390x645 | 360x740 | 390x844 |
  | --- | --- | --- | --- | --- |
  | Opening (3 beats) | 210 | 229 | 336 | 366 |
  | K04 pool (2 beats) | 210 | 229 | 252 | 275 |
  | K07 Bima (2 beats) | 210 then 168 | 229 | 252 | 275 |
  | K10 (2 beats) | 210 then 168 | 229 then 183 | 210 | 229 |
  | K05 result | 168 | 183 | 210 | 229 |
  | K11 task | 168, goal hidden | 183, goal hidden | 210 | 229 |
  | K09-e | 168, goal hidden, text scrolls 4 px | 183, goal hidden | 168 | 183 |
  | K08 result (no stage) | text scrolls | text scrolls | text scrolls | text scrolls |

**Frame jump between beats (owner 16:25) and its root cause.**
- Root cause: two rules, neither an animation. (1) By design since the visual-novel rhythm work, the stage shape was chosen per beat from the text length (`tinggiPanggung`: up to 140 characters = tall, up to 260 = medium, more = short); in the kantor the tall shape is 1:1, and for a square box the T-013 camera uses the close-up frame. (2) My first Stage 2 build added a per-beat "does it fit" step-down, which on the owner's phone made the short greeting keep the tall box and the next, longer beat drop to the wide one. The canvas simply redraws in the new box; no zoom was ever animated.
- Fix: the shape is now chosen per node from its longest beat and remembered per room and screen width; while the location does not change it may only step down (when a beat does not fit), never back up. On screens under 700 px high the tall shape is not used at all.
- Result: at 360x740 and 390x844 every checked node keeps one stage height across its beats (asserted in the check). At 360x640 two nodes still step down once when the task card appears (K07, K10: 210 then 168), and K10 at 390x645 (229 then 183).
- Not changed: the camera rules themselves. Within one box the camera can still frame differently when the speaker changes; I did not touch that (Codex: no camera math changes).

**D-133 activities** (`arena/Arena.tsx` + the six pattern files)
- Pinned: story header, activity head, the question (and K08's sign row), moved with a portal into a slot under the head. Pinned send bar at the bottom: `TombolKirim` portals its button there; the "not yet" reason becomes the disabled label (two lines at most); the "can still be changed" note stays at the end of the scroller.
- One scroller: `.hp-arena-gulir`.
- K02: picture 214 + instruction + trays visible at once at all four sizes; "Pesan & info tugas" below the trays; after 8 documents the send button is in the bar.
- K08: sign row pinned; road box 336 / 366 wide. **Scroll jump fixed**: when the step changes, the scroll position is corrected so the road stays where it was (conclusion step: 69 -> 68 px at 360x640, 43 -> 43 at 390x645). It cannot be corrected when the scroller is already at its limit (sign 1 -> sign 2 on screens where everything fits: the road moves 30 to 85 px because the sign card above it changes).
- K05: info card is collapsed by default (it already was in code; asserted). K09: plan box + 5 cards in two columns visible at once at all four sizes (spacing tightened only). K10: same three regions.

**D-134 end screen** (`ui/LayarAkhir.tsx`, optional `slotAksi`): header pinned; action bar pinned as one 52 px row; retry label on phones is "Ulangi Bagian N" / "Retry Part N" / "重玩第 N 部分" (full text stays as the accessible name); verdict + lesson visible without scrolling; the summary follows in the same scroller with a 24 px fade.

**Episode 1.** It does not use these screens (standard player `PemainCerita`, as reported in Stage 1). Nothing changed for it; the check records its opening screen at two sizes. If Episode 1 must also stop page-scrolling, that is separate work on `pages/CeritaMain.tsx` / `ui/cerita.css`.

### B. Addenda in the same round

**Stage 1b review (Designer D-139..D-142, QA B-01)**
- D-139 / B-01: when a decision has a note, at least 28 px of chat stays above the sheet, so the "Catatan" tab is whole and tappable. The check now fails if the tab is not fully in the viewport or not the element at its centre.
- D-140: the sheet spans the full screen width.
- D-141: unchosen badges are filled #4f7d66 instead of 55 % opacity.
- D-142 (CSS only, off under reduced motion): rows press down 2 px with a hard edge; the send button pops once and its arrow nods when it becomes ready; the unread note tab wiggles once after 1.2 s; Miss Raksa hops once. Plus the tap sound when a row is chosen.

**T-020 location map (D-143 / D-144, K04)**
- One green instruction line under the question; context 14.5 / 19; board takes the rest (202..300 px); tiles 96 wide with the label overlapping the picture; fixed positions (6 px from the sides, 8 px from top and bottom, centre tile centred); strip of 72 px under the board (Rudi and his question, then name + meaning of the chosen place).
- **Tap = choose**, tap another = change; the send bar confirms. The "Pilih tujuan ini" step is gone (all widths).
- Measured board height: 202 at 360x640 and 390x645, 246 at 360x740, 300 at 390x844; all five tiles whole, no overlap, strip and send button visible.
- Not built from D-143: the yellow "Info tugas" tab (context always fits in the four sizes), and hiding the list-view link. The link stays at the end of the scroller, below the fold on short screens, because it is the non-visual alternative and I did not want it unreachable.
- Tile art is today's art; only layout changed.

### C. Checks

- `node tools/cek-gulir-t018.mjs` now also runs the Stage 2 families from `tools/cek-layar-t018.mjs` (stage beats, K02, K04 map, K05, K08, K09, K10, three endings + summary; 360x640, 390x645, 360x740, 390x844).
- Result of the last run on the final build: **incomplete.** The combined run hung in its Stage 2 part (started 16:29, no output after 16:35) and I stopped it. What did pass, all Chromium, each on the build of its time: chat families 102 / 102 (with D-139..D-142 and the tappable-tab assertion, four sizes); stage beats 32 / 32 on the final build (with the same-height assertion); activities K02, K04 map, K05, K09, K10 at four sizes 20 / 20 and K08 4 / 4 (before the frame-jump change, which does not touch activity code); three endings + summary 12 / 12 on the first Stage 2 build only.
- **Not verified on the final build:** WebKit for anything in this round; the endings + summary case; `cek-piksel`, `cek-akhir`, `cek-jalan`, `cek-kaki`; `cek-bahasa` after the badge fix (it was 134 / 138 before it). Why the combined run hangs while `cek-layar-t018.mjs` alone passes is not diagnosed; run `cek-gulir-t018.mjs --tanpa-tahap2` and `cek-layar-t018.mjs` separately until it is.
- `npm run test:client`: 741 / 741 (run before the frame-jump change; not rerun after it). `tsc --noEmit` clean. Production build OK. `test:e2e` not run.
- QA's 4 `cek-bahasa` fails in the 8-document activity: cause was the tray count badges being clipped by 2 px at the scroller edge; fixed with 6 px side room.

**Evidence:** `team/evidence/T-018/stage2/` (per case and size, `hasil.json` when run standalone), `team/evidence/T-018/stage1b/` for the sheet. I opened: K09-e, K02 summary, K08, end screen (kurang) and the map at 360x640; the rest were captured but not opened.

**Open / to judge**
- Real iPhone not tested by me.
- The server I used (:4003) is stopped. `npm run build` rewrote `client/dist` many times (port 4000 now serves a frozen copy).

### Tooling (2026-11-16 evening): why the combined check hung, and the fix (tools only; no game code, no rebuild)

**Root cause.** A circular import, not a browser or network wait. `cek-gulir-t018.mjs` loads `cek-layar-t018.mjs` with a dynamic `import()` from inside its top-level main block, and `cek-layar-t018.mjs` statically imported `cek-gulir-t018.mjs` for `luncur` / `bukaGulir` / `siap`. The first module was still being evaluated (waiting on that very `import()`), so the import never resolved. The open browser kept the process alive, so it sat there silently. Reproduced with two 3-line files (Node reports "unsettled top-level await"). `cek-layar` run on its own never hit it, which is why it passed alone.

**Fix.**
- New `tools/t018-umum.mjs` holds the shared helpers; both tools import from it and `cek-layar` no longer imports `cek-gulir`.
- Every case has a time limit (chat 120 s, Stage 2 150 s): a stuck case prints `FAIL <case> batas waktu ...`, its browser is killed, the run goes on. Page actions and navigation also have 20 s / 30 s defaults.
- Families can be run alone: `--keluarga obrolan,adegan,aktivitas,akhir` (any subset), `--vp 360x740,390x844` for the Stage 2 families, `--kasus <part of name>` in `cek-layar`. One line is printed per case as it finishes.
- Whole-run watchdog: `--batas-menit N` (default 45 in `cek-gulir`, 30 in `cek-layar`): writes `hasil.json`, kills the browser, exits with code 2. Verified with a 3-second limit (exit code 2).
- One browser at a time, closed and relaunched whenever the screen size changes (`PerambanPerUkuran`); Stage 2 loops are size-outer so that is one launch per size.

**Runs after the fix** (existing `client/dist`, own server on :4003, now stopped; :4000 and :4001 not touched)

| Run (through `cek-gulir-t018.mjs`) | Result | Time |
| --- | --- | --- |
| `--keluarga adegan --vp 360x740,390x844` (Chromium + WebKit) | 32 / 32 (16 + 16) | 1 min 23 s |
| `--keluarga aktivitas,akhir --vp 360x740,390x844` (Chromium + WebKit) | 36 / 36 (18 + 18) | 2 min 48 s |
| `--keluarga obrolan --tanpa-webkit` (chat + reply sheet, all sizes) | 102 / 102 | 7 min |

- These cover, on the current build: stage beats incl. the same-height assertion, K02, K04 map, K05, K08, K09, K10, and the three endings + summary, on both engines at 360x740 and 390x844.
- Still not run on the current build: the Stage 2 families at 360x640 and 390x645 on WebKit; the chat families on WebKit; `cek-piksel`, `cek-akhir`, `cek-jalan`, `cek-kaki`, `cek-bahasa`.
- Dead-server behaviour: a refused connection is reported as a failed case at once (checked against a closed port).

### Fix (2026-11-16 evening, Designer Stage 2 review D-174..D-180)

Fullstack · NOT committed. Board: T-018 note "Stage 2 fix done".

- **D-176 (high), K08 sign wording hidden: fixed.** When a step shows the sign's wording card, the scroller now puts that card at its top (the road moves). The road is only held in place when no card is shown (the conclusion step). Asserted for both signs at four sizes: the card is whole inside the scroller.
- **D-177, K08 step button: fixed.** "Lanjut ke rambu berikutnya" / "Lanjut ke kesimpulan" is in the pinned bar on phones; while nothing is marked the disabled label is the existing "mark first" reason. Desktop keeps the old inline button.
- **D-174, box changing when the task card arrives: fixed by measuring, not guessing.** For an activity node whose task card is not shown yet, an invisible copy of the last beat plus the task card is laid out and measured; if it would not fit, the stage steps down from the first beat. (A first attempt with a character-count estimate changed K04's box on tall screens, so I dropped it.)

  | Node | 360x640 | 390x645 | 360x740 | 390x844 |
  | --- | --- | --- | --- | --- |
  | K07 Pak Bima (2 beats) | 168, 168 (was 210, 168) | 183, 183 (was 229, 229) | 252, 252 | 275, 275 |
  | K08 toll road (2 beats) | 168, 168 (was 210, 168) | 183, 183 (was 229, 183) | 210, 210 | 229, 229 |
  | K10 (2 beats) | 168, 168 (was 210, 168) | 183, 183 (was 229, 183) | 210, 210 | 229, 229 |
  | K04 pool, K09 (2 beats) | 210, 210 | 229, 229 | 252, 252 | 275, 275 |
  | Opening (3 beats) | 210 x3 | 229 x3 | 336 x3 | 366 x3 |

  K07 at 390x645 is now 183 on both beats although 229 fitted before: the measurement leaves out the 22 px dialogue overlap, because the task-card beat often has no speaker and then has no overlap.
- **D-175, banner moving the stage: fixed.** On locked screens the sound banner no longer takes a row; it sits over the top of the content area and disappears in place. Stage top is 121 px with the banner and after it, at all four sizes (new episode and opening state).
- **D-178:** the "Papan ilustrasi, bukan peta" plate is visually hidden on screens under 740 px high (board 202 px); it stays in the page for screen readers.
- **D-179:** the send bar is one height (button 58 px) in both states.
- **D-180:** short disabled labels in the bar: "Ketuk satu tujuan." / "Tandai N kartu lagi." / "Catat N perbedaan lagi." (new keys `belumTujuanRingkas`, `belumKontakRingkas`, `belumBedaRingkas`, id / en / zh; en and zh are my drafts). I wrote "Catat N perbedaan lagi" instead of the Designer's "Cap N perbedaan dulu" because the existing text for that activity says "mencatat"; say if "Cap" is wanted. Outside the bar the full reasons are unchanged.

**Checks on this build** (own server on :4003, now stopped; one browser at a time, families run separately)

| Check | Result |
| --- | --- |
| `cek-layar-t018.mjs` stage family, Chromium, four sizes | 44 / 44 |
| `cek-layar-t018.mjs` activities + endings, Chromium, four sizes | 36 / 36 |
| `cek-layar-t018.mjs` all Stage 2 families, WebKit, four sizes | 80 / 80 |
| `cek-gulir-t018.mjs --keluarga obrolan` (chat + sheet) | 150 / 150 (Chromium 102, WebKit 48) |
| `npm run test:client` | 741 / 741 |
| `cek-bahasa-t014.mjs` | 138 / 138 |
| `cek-piksel-t013.mjs` | 99 / 99 |
| `cek-akhir-t019.mjs` | 45 / 45 |
| `cek-jalan-t017.mjs`, `cek-kaki-t017.mjs` | 8 / 8, 18 / 18 |

- New assertions in `cek-layar-t018.mjs`: same stage height AND same stage top across beats in a room at all four sizes; cases for K08, K09 and a brand-new episode (banner showing); K08 card whole and step button in the bar; bar height unchanged when ready; short labels; plate hidden on the short board.
- This also closes the "not verified" list of the Stage 2 report: every check above ran on the final build.
- `tsc --noEmit` clean; production build OK; `test:e2e` not run.

**Evidence:** `team/evidence/T-018/stage2/fix/` (K08, map, K09, K07, K10, K08 stage, new-episode opening; Chromium and WebKit). I opened the K08 conclusion at 360x640; the rest were captured but not opened.

**Not done:** real iPhone; watching the K08 flow by eye (the card rule is asserted by position only).

### Fix 2 (2026-11-16 evening, Designer re-check D-181 + final labels)

Fullstack · NOT committed. Board: T-018 note "fix 2 done".

- **D-181, banner covering the top of the stage: fixed.** The sound banner is still an overlay (no row, no reflow) but now sits in the free space under the dialogue box, 10 px above the bottom edge. Measured on the first screen, both engines: banner at 582-630 px on 360x640 (stage 121-331, dialogue ends 486) and 587-635 px on 390x645 (stage 121-350, dialogue ends 505). Dismiss rules unchanged (first primary tap or 6 s, once per episode).
- The check now fails if the banner overlaps the stage or the dialogue box, or leaves the screen.
- **Final labels** (replacing my drafts exactly):

  | Key | id | en | zh |
  | --- | --- | --- | --- |
  | `belumTujuanRingkas` | Ketuk satu tujuan. | Tap one destination. | 请点选一个去向。 |
  | `belumKontakRingkas` | Tandai {n} kartu lagi. | Cards left to mark: {n}. | 还需标记 {n} 张卡片。 |
  | `belumBedaRingkas` | Tentukan {n} perbedaan lagi. | Differences left to decide: {n}. | 还需决定 {n} 处出入。 |

**Checks on this build** (own server on :4003, now stopped; one family at a time, Chromium + WebKit, four sizes)

| Check | Result |
| --- | --- |
| `cek-gulir-t018.mjs --keluarga adegan` | 88 / 88 |
| `--keluarga aktivitas` | 48 / 48 |
| `--keluarga akhir` | 24 / 24 |
| `--keluarga obrolan` | 150 / 150 |
| `cek-bahasa-t014.mjs` | 138 / 138 |
| `npm run test:client` | 741 / 741 |

- `tsc --noEmit` clean; production build OK; `test:e2e` not run. `cek-piksel`, `cek-akhir`, `cek-jalan`, `cek-kaki` were not rerun in this round (last green in the Fix round; this round changed one CSS position and three strings).

**Evidence:** `team/evidence/T-018/stage2/fix2/layar-pertama-{360x640,390x645}-{chromium,webkit}.png` (captured, not opened by me; positions above are measured).

## T-020 batch 1 (2026-11-16): pixel map (K04) and pixel road + sign scene (K08)

Fullstack · NOT committed. Board: T-020 note "batch 1 integrated".

**Assets.** The 29 approved PNGs (16 map, 13 road) are copied unchanged to `client/src/cerita/seni/aktivitas/{peta,jalan}/` and used only through `seni/aktivitas/piksel.css`: every sprite is drawn at its own size, `image-rendering: pixelated`, nothing is scaled. A unit test checks each file's size against the README, the 13,581 B total, and that the CSS references exactly these 29 files.

**1. Map (K04)**
- `lok.kantor / foto / pool / bengkel / langganan` in `SENI_ARENA_AUTO_2` are now pixel entries (`SeniArena.piksel` = CSS class, 80 x 60); `GambarSeni` draws them as an exact 80 x 60 box.
- `PapanTujuan` switches to the pixel board when all its pictures are pixel: grass tile, dirt roads with junction patches, two trees + bush + tree, 2 px dark edge with the inner line.
- Tiles: 96 px box, picture 80 x 60 inside the 84 x 64 frame, chosen and focus/hover frames, label plate (13 / 15, 1 px border, gold when chosen) overlapping by 8.
- Pixel anchors replace the percent table for five places: side columns 6 px from the board edge (picture x = 14 and W - 94), centre column centred, top row at y 8 (picture y 10), bottom row ending 8 px above the edge.
- Rudi's pin: the ring at picture (+52, -8) with the existing pixel portrait at 32 px. Measured in the browser: offset (52, -8), 40 x 42, inside the board.
- Tap = choose with the send bar as confirmation (already so since Stage 2). The "Papan ilustrasi" plate is kept for screen readers only.
- K05 (same board, other pictures) keeps its SVG pictures and the old percent layout until its batch.

**2. Road (K08)**
- `lokasi/seni/geometri.ts` is now in pixels: road block 278 (shoulder 7 + four lanes of 66 + shoulder 7), lane n left = (W - 278) / 2 + 7 + (n - 1) x 66, truck 40 x 124 at lane left + 13 and top 80 of 236, keycap at lane left + 13 and top 200, ring 54 x 136. `seni.test.ts` rewritten for these numbers and the PNG sizes.
- `lokasi/Adegan.tsx` rewritten: grass, `jalan-strip.png` repeat-y, arrows, orange truck with shadow, hatch layers at 55 % with a 2 px border (solid red / dashed blue), the sign face at the top of a marked lane, keycap atlas (plain / forbidden / left lane; pressed 2 px when marked), trees and bush. Scene is W x 236 everywhere (was a square).
- Sign posts on the left verge are now the buttons: the active post opens that sign, a finished post reopens it, sign 2 is locked at 55 % until sign 1 is done; number badge gold (active) or green (done). The "Rambu 1" button and the "Lihat lagi" chips are gone.
- Marking step on phones: compact sign card with the pixel sign face, instruction 16 / 20, scene, then ONE legend line ("Tandamu · Rambu 1: lajur 3 dan 4 · Ilustrasi ..."). The context sentence shows on the first step only. Nothing scrolls at the four sizes.
- **Conclusion step on phones = the reply sheet over the road.** Pak Bima's pixel face and his question head the sheet, five numbered rows, "Pilih 1 kesimpulan" -> "Sampaikan ke Pak Bima", a "Tandamu" tab that flips to the player's marks with the "Periksa lagi Rambu n" chips, activity head as one 44 px row. The content behind the sheet cannot scroll, so the jump cannot happen.

  | Size | Sheet height | Road visible above | List scrolls? |
  | --- | --- | --- | --- |
  | 360x640 | 492 | 43 px | no |
  | 390x645 | 459 | 81 | no |
  | 360x740, 390x844 | not re-measured after the last spacing change (509 and 471 before it) | more than 100 | no |

  To fit five rows at 360x640 I tightened this sheet by about 16 px against the chat sheet (no grab handle, gaps 4, top padding 4).
- Desktop keeps the old conclusion layout (road, marks, quote, five option cards), now with the pixel scene.
- `RingkasRambu` (K08 result) and the `/lokasi` prototype page use the same component, so they show the pixel scene too.

**3. Removed vector**
- Deleted: `lokasi/seni/svg/jalan-empat-lajur.svg` (3,641 B), `truk-biru.svg` (2,846 B), `arsir-lajur.svg` (464 B), `arsir-lajur-biru.svg` (475 B) and their components in `Aset.tsx`; `lokKantor`, `lokMejaFoto`, `lokPool`, `lokBengkel` in `seni/auto-2/benda.ts` (41 lines). I grepped first: no other consumer.
- Stays: `ikon-periksa.svg` and `IkonPeriksa` (still used by the `/lokasi` prototype), `ContohArsir`, `IkonCentang`, `IkonUlang`, `IkonTandai`; all `tuju.*` pictures of K05; every other `SENI_ARENA_AUTO_2` entry.

**Bytes**
- Added PNG: 13,581 B (29 files), as expected. Vite inlines files under 4 KB, so they are not separate requests: they sit as base64 inside the story CSS chunk (about 18.1 KB of text there). No extra image requests on K04 / K08.
- Removed: 7,426 B of SVG source plus the four generator functions.
- This build: story CSS chunk 129,866 B, story JS chunk 157,610 B. I did not build the previous commit, so there is no exact before / after for the chunks.

**New strings** (`i18n/kamus/ceritaHp.ts`, id / en / zh; **en and zh are my drafts**): `tandamu` "Tandamu" / "Your marks" / "你的标记"; `kembaliPilihan` "Kembali ke pilihan" / "Back to the choices" / "返回选项"; `pilihSatuKesimpulan` "Pilih 1 kesimpulan" / "Choose 1 conclusion" / "请选 1 个结论"; `kembali` "Kembali" / "Back" / "返回".

**Checks on this build** (own server on :4003, now stopped; one browser at a time)

| Check | Result |
| --- | --- |
| `npm run test:client` | 742 / 742 (741 + 1: PNG set and CSS references) |
| `cek-layar-t018.mjs`, all Stage 2 families, Chromium + WebKit, four sizes | 160 / 160 |
| `cek-piksel-t013.mjs` | 99 / 99 |
| `cek-bahasa-t014.mjs` | 138 / 138 |

- K04 assertions added: pixel board, five pictures exactly 80 x 60 and pixelated, pin offset (+52, -8) inside the board.
- K08 assertions rewritten: scene 236 high, road block 278 centred, truck and keycap at their pixel anchors, post states, sign card whole, step button in the bar, marks + hatched keycaps + legend; conclusion sheet full width and inside the screen, five rows visible, at least 40 px of road above, label change without a jump, "Tandamu" flip and back, background not scrollable.
- Not rerun this round: the chat family of `cek-gulir`, `cek-akhir`, `cek-jalan`, `cek-kaki` (their code is untouched). `tsc --noEmit` clean; production build OK; `test:e2e` not run.

**Evidence:** `team/evidence/T-020/fullstack/`: `k04-peta-{awal,pilih}-{390x645,360x640}.png`, `k08-{ketuk,tandai,simpul,simpul-pilih}-{390x645,360x640}.png`, `k04-peta-1280.png`, `k08-1280.png`. I opened five (K04 chosen 360x640, K08 marking 360x640, K08 conclusion 360x640 twice, K08 at 1280); the rest were captured but not opened.

**To judge / not done**
- How the pixels look on a real phone at DPR 2 and 3 (headless screenshots look crisp; not seen on a device).
- When a lane is marked for both signs I put sign 2's face under sign 1's (top 34); the README does not say where it goes.
- Keycap row 1 (generic gold "chosen") is not used; marked lanes use the hatched rows as in the preview.
- The README's 204 px minimum scene height (cropping) is not implemented; the scene is always 236.

## T-020 batch 1 FIX (2026-11-16): Designer review D-182..D-189 + final strings

Fullstack · NOT committed. Same build and same check run as batch 2 below.

| Item | What changed | Measured |
| --- | --- | --- |
| D-182 | In the phone shell on screens under 700 px high the road scene is 204 px: 32 px cropped from the top, arrows at top 6, keycaps 36 px above the bottom, truck / ring / posts move up with it (post 1 stops at top 4) | legend with a mark on sign 2 (three lines) ends 15 px above the bar at 360x640 and 20 px at 390x645; nothing scrolls |
| D-183 | "Tandamu" tab raised 8 px (34 px above the sheet) | tab no longer overlaps the question (asserted) |
| D-184 | "Tandamu" side uses the 14 x 14 pixel swatches for both signs | asserted 14 x 14 PNG |
| D-185 | Truck top 12 in the conclusion view | 29 px of cab above the sheet at 360x640, 72 px at 390x645 |
| D-186 | Map tiles at the README positions, measured from the board's outer edge | picture x 14 / 14 from the right, top row y 10; bottom-row tiles end 8 px above the board edge as in the README (their pictures end 21 px above it, the plate hangs below) |
| D-187 | Label plate padding 5 px | "Kantor Raksa" on one line |
| D-188 | Sign faces drawn above both hatches | not measured, z-order only |
| D-189 | Pin ring drawn above the portrait; portrait has no border inside the ring | not measured |

- Final strings applied: `kembaliPilihan` en is now "Back to choices"; the other three were already as decided.
- Sheet numbers after the fixes: 492 px with 43 px of road at 360x640; 454 px with 86 px at 390x645.
- New assertions in `cek-layar-t018.mjs`: scene 204 / 236 by screen height, legend fully visible at every marking step, tab clear of the question, cab at least 20 px, swatches, README tile anchors, one-line first labels.
- Not done: I did not zoom into D-188 / D-189 at DPR 2 or 3; they need the Designer's eye.

## T-020 batch 2 (2026-11-16): planner board (K07), witness board (K09), compare papers (K10)

Fullstack · NOT committed. Board: T-020 note "batch 2 integrated".

**Assets.** The 38 approved PNGs go to `client/src/cerita/seni/aktivitas/{papan,saksi,banding}/`, used only from `piksel.css`, never scaled, `image-rendering: pixelated`. Frames ending `-9i` are CSS `border-image` with `repeat`.
- **One deviation:** `saksi/kartu-9i.png` and `saksi/tombol-9i.png` are atlases, and `border-image` cannot address one cell of an atlas. `tools/piksel/potong-atlas-t020.mjs` cuts them into six single-cell files (same palette and bit depth, pixels untouched): `kartu-{biasa,tempel,bayangan,pilih}-9i.png`, `tombol-{biasa,tekan}-9i.png`. The two atlas files are not shipped in the client. The Designer may prefer to deliver these as separate files.

**1. K07 Rencana pemeriksaan** (`RencanaPeriksa.tsx`)
- Strip: magnifier on the inspection-card frame + the instruction; after a choice it shows the chosen answer, "Pemeriksaan kejadian" and its meaning. Fixed 76 px, so the board never moves.
- Cork board with the wooden frame: plates "Sekarang" / "Sesudah hitungan", yellow job card with the clock and "Sedang berjalan", sticky note with the case note, two dashed slots with the "+" key. Tap a slot: the card is pinned there (gold frame, pushpin, small magnifier).
- Three chips with icons under "Atau tidak lewat papan:". All five answers are visible at once; "Lihat 3 pilihan lainnya" is gone.
- English at 360x640: the label "Or skip the board:" is hidden from sight (still read by screen readers), as documented by the Designer. Checked: it then fits exactly.

**2. K09 Kartu saksi** (`PapanSaksi.tsx`)
- Cork board "Rencana wawancara" with five slots and a count box; five portrait cards in one row (normal / selected and lifted / ghost when on the board / grey "Tidak perlu" with the "–" badge, which is also the undo key); the small-car driver is the car card with the "?" badge.
- Action strip: name and role, then the keys "Wawancarai" and "Tidak perlu" with their meanings (pressed state when chosen; tap again = undo).
- After a mark the next unmarked card is selected, so the strip stays and nothing jumps. Bar: "Tandai N kartu lagi." -> "Kirim daftar ke Pak Bima" (keys already existed in id / en / zh).
- Head: the script's question "Perlu dimintai keterangan?" plus the instruction line (it was "Kontak · ketuk untuk melihat").

**3. K10 Bandingkan keterangan** (`ArenaBandingkan.tsx`)
- Two papers with blue / brown header bands, three rows with clock / face / pencil icons, highlight bar on the current row in both papers and the red marker between them.
- **Row text = Lead's option C** (HTML, new keys `arena.selisih.sel.*` in id / en / zh): 20.10 | 20.15; **Wahyudi | Wahyudin** (fictional, same in all languages); ? | "kurang antisipasi" (en “failed to anticipate”, zh “预判不足”).
- **Note text changed, as asked:** `arena.selisih.nama.catatan` no longer says the name is disguised: id "Yang pasti, namanya tertulis berbeda." / en "What is certain is that the name is written differently." / zh "可以确定的是，两处姓名写法不同。" (en / zh are my wording).
- Sentence box with the evidence note and progress squares "n/3"; it is always as tall as the longest difference, so the stamps do not move.
- Five rubber stamps (22 x 24 under 700 px of screen height, 44 x 48 above). Tap a stamp: its impression lands on the row, the instruction line shows that stamp's meaning, and after 0.65 s the next unstamped difference is highlighted. Tap a paper row to go back and change a stamp.
- Bar: "Cap 3 perbedaan dulu." (`belumBedaRingkas`; en "Differences left to stamp: {n}.", zh "还需盖章 {n} 处出入。" are my drafts).
- The list view keeps the old text layout.

**"Info tugas" tab** (`Arena.tsx`, K07 / K09 / K10, phone shell only): a yellow tab on the title row opens the folded info (quote, story, facts) at the top of the scroller. New key `infoTugas`: "Info tugas" / "Task info" / "任务信息" (en / zh drafts). On these three screens the "Gunakan tampilan daftar" link and the "pilihan bisa diubah" note are now inside that opened panel, not under the board.

**4. Removed vector**
- `SENI_ARENA_AUTO_2`: `baki.ya`, `baki.tidakperlu` deleted; `jalur.telepon / jelas / percaya`, `saksi.mobilkecil`, `cap.*` are now pixel entries.
- `seni/auto-2/benda.ts`: 11 generators deleted (`ponselMeja`, `mapJelas`, `lencanaPercaya`, `isiMobilKecil`, `stempelAksi`, `simbolSama / Ulang / Catat / Abaikan`, `ikonSilang`, `ikonBicara`), 26,128 -> 21,950 B. Grepped first: no other consumer.
- **Stays:** `kartu.periksa` (SVG) is still used by the K11 bundle (`meja.berkas.lokasi`); `baki()`, `ikonStrip` are used by K02.
- Old K07 / K09 phone CSS removed from `desain.css` (91 lines).

**Bytes**
| | Batch 1 build | This build |
| --- | --- | --- |
| Story CSS chunk | 129,866 B | 150,013 B (+20,147) |
| Story JS chunk | 157,610 B | 162,282 B (+4,672) |
- PNG added in the client: 6,900 B in 42 files (Designer's 6,440 B, minus the two atlases 345 B, plus their six cut cells 805 B). All inlined as base64 in the CSS chunk; no extra requests.
- The CSS growth is those PNGs as base64 (about 9.2 KB) plus about 11 KB of new rules; I did not measure gzip sizes.
- Removed source: 4,178 B of SVG generators, 91 lines of CSS.

**Measured (id)**
| Screen | 360x640 | 390x645 |
| --- | --- | --- |
| K07 board / strip / spare under the chips | 171 / 76 / 3 px | 171 / 76 / 23 px |
| K09 board / card row / action strip / spare | 124 / 96 / 101 / 12–31 px | 124 / 82 / 101 / 31–50 px |
| K10 papers / sentence box / stamp row / spare | 93 / 129 / 66 / 3 px | 93 / 129 / 66 / 32 px |
- Nothing scrolls on the three screens at 360x640, 390x645, 360x740, 390x844 in Indonesian, in both engines, in every state the check walks through.
- English and Chinese: opening state at 390x645 fits on all three (and K07 English at 360x640). **Not checked:** later states in en / zh, and K09 / K10 en / zh at 360x640.

**Checks on this build** (own server on :4003, now stopped; one browser at a time)
| Check | Result |
| --- | --- |
| `npm run test:client` | 742 / 742 |
| `cek-layar-t018.mjs`, all Stage 2 families, Chromium + WebKit, four sizes | 168 / 168 |
| `cek-piksel-t013.mjs` | 99 / 99 |
| `cek-bahasa-t014.mjs` | 138 / 138 |
- Tests changed: asset test covers the 42 batch 2 files and that the CSS references exactly the shipped files; text test counts 916 keys and allows the six paper cells to equal Indonesian; the K10 test now asserts the cells and the two names.
- New case `arena-k07-rencana` (the old case of that name was really K05 and is kept as `arena-k05-rencana`); K09 and K10 assertions rewritten for the new screens.
- Not run: chat family of `cek-gulir`, `cek-akhir`, `cek-jalan`, `cek-kaki`, `test:e2e`. `tsc --noEmit` clean.

**Evidence:** `team/evidence/T-020/fullstack/batch2/`, 30 files: per screen `-awal` and the later states at 360x640 and 390x645 (id), `-awal-390x645-en` and `-zh`, `-1280`, plus `k07-rencana-awal-360x640-en`. I opened seven (K07 initial and chosen 360x640, K09 marked 360x640, K10 second stamp 360x640, K09 and K10 English, K10 at 1280).

**To judge**
- Paper rows are 22 px high, as in the README: a small touch target. The automatic move to the next difference means most players never need to tap a row.
- K09 board is 124 px (Designer 116) and the selected card's name can take three lines at 360 ("Pengemudi mobil kecil").
- The placed K07 card shows only "Pemeriksaan kejadian"; which slot it is in is read from the column and the strip.
- Desktop uses the same three components at up to 560 px wide; only looked at K10 there.

## T-020 batch 2 polish (2026-11-16): Designer review D-195..D-199 + final strings

Fullstack · NOT committed. Same build and check run as batch 3 below.

| Item | What changed | Measured |
| --- | --- | --- |
| D-195 | K09 action strip has one fixed height, 115 px; the name line is a fixed two-line slot | strip 115 in every state, keys do not move; 24–26 px spare at 360x640 |
| D-196 | Card names wrap at spaces only, 11 px | "Pengemudi / mobil kecil" on two lines; card row 82 px at both sizes (was 96 at 360) |
| D-197 | Pinned cards: 36 px portrait, name on two lines | "Petugas tol" in full |
| D-198 | K10 paper rows 24 px; the 6 px comes from the gap above the stamps | papers 99 px; 3 px spare at 360x640 |
| D-199 | 4 px between the glyph and "Info tugas" | |
- Final strings applied: `belumBedaRingkas` zh "还有 {n} 处出入待盖章。"; `arena.selisih.nama.catatan` en "What is certain: the name is written differently."
- Handoff text corrected (batch 1 FIX table, D-186 row): bottom tiles end 8 px above the board edge.
- At 360 wide the longest card names sit 1 px from the card edge; worth a look by the Designer.

## T-020 batch 3 (2026-11-16): documents (K02), K05 pictures, K11 pictures and layout, chat photo

Fullstack · NOT committed. Board: T-020 note "batch 3 integrated".

**Assets.** 26 PNGs, 16,452 B, copied unchanged to `client/src/cerita/seni/aktivitas/{dokumen,terusan,bundel,obrolan}/`. A document entry now has two forms: the big file at 1 : 1 and its 22 x 28 atlas cell (`SeniArena.kecil`, `<GambarSeni kecil>`) for chips, map pockets and the token on a tile.

**1. K02 documents**
- Counter scene = the shipped office stage (wall + sign + desk layer at (0, 66)), 1 : 1, cropped at y 20 and centred, **160 px high at every size**. No new file.
- **Deviation from the brief ("picture 214, min 160"):** the art is 400 x 225 and the crop puts the counter at the bottom, so a 214 px scene would need 34 px of filler above. I kept 160 everywhere; the freed space stays empty below the trays.
- Document object 1 : 1 at left 30, 10 px above the scene's bottom edge; name plate at left 110 / right 12 / bottom 26; "n/8" plate with eight squares in the picture's top left.
- One fixed 48 px row between picture and trays: the instruction, then (after a placement) the feedback with Batalkan / Ubah. The trays never move.
- Trays: atlas cell 68 x 40 (empty / with documents / full by count 0 / 1–2 / 3+), name 14 / 17, meaning 12 / 15 now visible, count badge 22 x 22 at the top right. **The badge is the "Isi (n)" button**; the separate row of three "Isi" buttons and the folded "Arti tiap baki" are gone.
- "Pesan & info tugas" and the list-view link are below the trays as before (the scroller still has 66 px below the fold at 360x640, 31 px at 390x645, 0 at the two taller sizes).

**2. K05 "Bengkel penuh"** (D-167): the five `tuju.*` pictures are 80 x 60 pixel tiles on the K04 board with the K04 frames and README anchors. The photo stack is the token: 60 x 48 in the strip, the 22 x 28 thumbnail on the chosen tile at picture (+62, -10), no ring. Context is behind "Info tugas"; the instruction line is pinned; the two strips share one height (80 px) so the board does not change size on a tap. Board 221 / 250 / 300 / 300 px at the four sizes, nothing scrolls.

**3. K11 "Bundel pengajuan"** (D-166, Designer's no-scroll layout applied in the phone shell)
- Step tabs 40 px (current step gold); "Info tugas" tab in the head.
- Step 1: open folder 120 x 64 with "Map pengajuan" and the count; folder board with seven pockets in 4 + 3 (46 px: number, 22 x 28 thumbnail, ✓ or –); strip for the tapped pocket (72 px, red edge when not available). "Tentukan langkah" is now the bar button.
- Step 2: pinned instruction "Pilih tindakan untuk berkas ini."; tied bundle + the "6 dari 7" reminder; three action cards with the 48 x 40 pictures. "Kembali: periksa berkas" is replaced by a tap on tab 1.
- Step 3: pinned "Pilih satu kabar." (new key `pilihSatuKabar`: "Pilih satu kabar." / "Choose one message." / "请选一条消息。", en / zh my drafts); the chosen action as a plan row with its picture; three message rows. The "Pratinjau — belum dikirim" figure is kept for screen readers only in the shell.
- Pocket 7 shows the "still being processed" police letter, not the issued one.
- Spare under the content, id: 27–28 px at 360x640, 33–44 px at 390x645, in all three steps and with the choices made. Nothing scrolls at the four sizes.
- Not built from the mock: the tender note is one line under the strip on every pocket (the mock puts it in pocket 4's strip only); the strip does not list the contents of each group.

**4. Chat photo:** `foto.truk` is the 240 x 150 pixel photo at exactly that size with a 2 px frame (measured 244 x 154 with the frame), `image-rendering: pixelated`. The 2 : 1 version for wide screens is not implemented.

**5. Removed vector**
- `seni/auto-2/benda.ts`: 27 generators deleted (all document, tray, K05, K11 and helper drawings), 21,949 -> 9,512 B. `fotoTruk()` deleted from `arena.ts`. Grepped first: no other consumer.
- **Stays:** `kartu.periksa`, `meja.kayu / map / mapBuka / kontak` (desk prototype). The desk prototype now shows the document entries as pixel pictures at 1 : 1; I did not open it.

**Bytes, whole T-020 programme**
| | Before T-020 (HEAD) | Now |
| --- | --- | --- |
| Activity PNG in the client | 0 | **36,933 B, 97 files** (batch 1 13,581 · batch 2 6,900 · batch 3 16,452) |
| `benda.ts` (SVG generators) | 28,364 B | 9,512 B (−18,852) |
| Road SVG files | 7,426 B | 0 |
| Story CSS chunk | not measured | 178,553 B (batch 1: 129,866 · batch 2: 150,013) |
| Story JS chunk | not measured | 163,810 B (batch 1: 157,610 · batch 2: 162,282) |
- PNG: +36.9 KB against the expected +36.5 KB (the 0.46 KB difference is the six cut atlas cells of batch 2). Removed vector source: about 26.3 KB.
- **400 KB gate:** I have no script for the Designer's "about 168 KB" Episode 2 figure and did not reproduce it. On that basis the episode is at about 205 KB (168 + 36.9), before subtracting the removed vector. The shipped Episode 2 room art alone (`seni/piksel/ep2-*`, 11 files) is 85.6 KB.
- All PNGs are inlined as base64 in the story CSS chunk (no extra requests); that is why the CSS chunk grew by about 48.7 KB since batch 1. gzip sizes not measured.

**Checks on this build** (own server on :4003, now stopped; one browser at a time)
| Check | Result |
| --- | --- |
| `npm run test:client` | 742 / 742 |
| `cek-layar-t018.mjs`, all families, Chromium + WebKit, four sizes | 176 / 176 |
| `cek-piksel-t013.mjs` | 99 / 99 (after a tool fix, below) |
| `cek-bahasa-t014.mjs` | 138 / 138 (second run) |
- The 176 run was before four last small fixes (K02 hidden counter text, K02 badge touch area, K11 focus outline, K02 scene capped at 400 px on desktop). After them I reran K02 at the four sizes on both engines (8 / 8), unit tests, pixel and language checks, but not the other layout cases.
- **Language check, first run 132 / 138:** K02 in en / zh failed its clipping test because of my hidden counter text and the badge's touch area sticking out 11 px. Both fixed.
- **Pixel check, first two runs 97 / 99:** the two idle-animation cases failed because headless Chrome on this PC reported `prefers-reduced-motion: reduce` (Windows setting tonight), so nothing animates. With motion set to normal the characters blink and breathe. I changed `tools/cek-gerak-t016.mjs` to set "no-preference" itself for the normal case. No game code was involved.
- New / changed cases in `cek-layar`: K02 (document 1 : 1 at its anchor, tray atlas cells, badge position, trays do not move), K05 rewritten, K11 new (three steps, no overflow, bar labels, picture sizes).
- Not run: chat family of `cek-gulir`, `cek-akhir`, `cek-jalan`, `cek-kaki`, `test:e2e`. e2e selectors I know I changed: `[data-tahap-lanjut]` (now the bar button), the "Isi (n)" text (now a number with an aria-label), "Lihat 3 pilihan lainnya" (gone since batch 2).

**Evidence:** `team/evidence/T-020/fullstack/batch3/`, 30 files: K02 `awal` / `taruh`, K05 `awal` / `pilih`, K11 six states, each at 360x640 and 390x645 (id); `-awal-390x645-en` / `-zh` for the three; `-1280` for the three; `obrolan-foto-truk-390x645`. I opened six (K02 after a placement 360x640, K11 pocket 7 and step 2 at 360x640, K05 chosen 360x640, the chat photo, K02 at 1280 before the width cap).

**To judge / not verified**
- en / zh: only the opening state at 390x645 was checked for fit (K02 English has 29 px below the fold there, which is the info row, not the trays).
- K02 at 1280 after the 400 px cap, K05 and K11 at 1280: captured, not opened.
- Real phone, DPR 3 look of the 22 x 28 thumbnails.

## T-020 batch 3 FIX (2026-11-16): Designer review D-204..D-209 + 2 : 1 chat photo

Fullstack · NOT committed. Same build and check run as T-021 below.

| Item | What changed | Measured / asserted |
| --- | --- | --- |
| D-204 | The tray's "Isi" panel opens in place of the counter scene and the 48 px row (214 px), not under the trays | panel top = scene top, 214 px high, fully inside the window at the four sizes |
| D-205 | Pixel board height is rounded down to a whole CSS px and the centre tile gets a whole-px top (K04 and K05, same code) | 360x640: K04 board 202, tile top 56; K05 board 221, tile top 73. Asserted as integers at all four sizes; I did not compare device pixels at DPR 3 |
| D-206 | Bar labels: "Konfirmasi & kirim kabar" / "Confirm & send the news"; "Konfirmasi, tanpa kabar" / "Confirm, no news yet"; Chinese unchanged | one line asserted for the first (id) |
| D-207 | Tender note shows with pocket 4 only | not asserted |
| D-208 | End summary uses the tray cell by count (0 / 1–2 / 3+) | asserted |
| D-209 | The office sign layer is left out of the K02 counter scene | asserted |
| Chat photo | On screens 1024 px and wider the photo is exactly 2 : 1 (480 x 300) | not opened at that width |
- Not addressed: the end summary still scrolls 17 px at 360x640 (noted under D-208).
- **B-02 (QA T-021; fixed 2026-11-17):** the K02 end summary ("Periksa susunanmu") now fits at 360x640 without scrolling: 0 px in Chromium and WebKit (was 17 / 21), with 15 / 11 px to spare in id and en (zh 36 / 32). Spacing only, and only on locked phone screens under 700 px high (last block of `hp/desain.css`): tray rows 52 px instead of 56, gaps of 6 px instead of 8 inside the summary, and 8 px instead of 12 to 16 between the summary, "Pesan & info tugas" and the list-view link; screens of 700 px and taller are unchanged. With a tray opened, its document list scrolls in the one activity scroller and the page and send bar stay put (D-133). `cek-layar` K02 now fails when the closed summary scrolls (on the previous build: FAIL, 17 px Chromium and 21 px WebKit), also checks the opened tray with all 8 documents in it, and captures `team/evidence/T-020/fullstack/batch3/k02-ringkas-360x640.png` (I looked at it). Activities family 72 / 72 on Chromium + WebKit at four sizes; `test:client` 746 / 746. Not covered: in the list view this summary still scrolls about 60 px at 360x640 (extra hint card). Build: made in a side folder and copied into `client/dist` at 03:22 so the folder was never empty for QA on 4001; story CSS chunk 218,214 B (+432). Not committed.
- **Tiny fix 2 (2026-11-17): K02 list view summary + English plural.** (1) List view: the B-02 spacing was already active there; the 56 / 60 px that still scrolled at 360x640 (Chromium / WebKit) came from the key-fact card that only the list view shows ("Kata Pak Hendra: surat polisi masih diurus...", 60 px). On locked screens under 700 px high that card now gives way while the K02 summary is shown (the same fact is in "Pesan & info tugas": Pak Hendra's message and the story line; the card is back as soon as a document is changed) and the summary-to-note gap is 6 px as in the picture view: 0 px scroll in both engines, 15 / 11 px to spare (id, en; zh 36 / 32); screens of 700 px and taller are unchanged. Count badge: a fixed 30 x 30 circle in both views, and list rows use three columns (name | count | arrow), so the badge no longer stretches (it was 146 px wide). (2) Total line: new optional arena text `satuanHitung` = the unit as written after a number (English "document|documents" and "witness|witnesses", singular only for a total of 1; Chinese with its measure word, "份文件" and "位证人"; Indonesian unchanged), so English reads "8 of 8 documents placed." (K02) and "5 of 5 witnesses placed." (K09 list view), and the Chinese K09 line reads "已放置 5/5 位证人。" instead of "份证人"; 1,019 text keys. `cek-layar` K02 now also switches to the list view at the summary and fails on any scroll or on a badge that is not 30 x 30 in the picture view's place (previous build: FAIL, 56 px Chromium / 60 px WebKit, badge 146 px); capture `team/evidence/T-020/fullstack/batch3/k02-daftar-360x640.png` (I looked at it). Activities family 72 / 72 on Chromium + WebKit at four sizes; `test:client` 747 / 747 (one new test for the total line in id, en, zh). Left: the English list view summary at 360x740 still scrolls 14 px (its fact card is three lines; outside the under-700 rule, not changed by this). Build: made in a side folder and copied into `client/dist` at 03:51; the previous chunk set stayed beside it until 04:03 (QA's "two builds present" note) and is now removed; story chunks CSS 218,563 B, JS 188,943 B. Not committed.
- **`tools/e2e-browser.mjs`: run once, alone, low priority, against this build: 0 failures, 0 console / HTTP problems, exit 0.** It tests the legacy event quiz, not Episode 2, so none of the three selectors I changed in batch 3 appear in it.

## T-021 (2026-11-16): cutscene from the kantor stage into the WhatsApp chat and back (POV variant)

Fullstack · NOT committed. Board: T-021 -> review.

**Triggers: 2** (`Episode.serahTelepon` in `episode/auto-2/episode.ts`, as decided in D-169 / D-170)
- Forward: `buka` -> `k01` (Part 1).
- Back: from `k15` / `k15-a..e` to `akhir-puas` / `akhir-catatan` / `akhir-kurang` (Part 4).
- Every other chat hand-over is a plain cut as before. If Miss Raksa is not on the stage at a trigger, it also falls back to the cut.

**What plays**
| | Timeline |
| --- | --- |
| Forward, 1,000 ms | 0: arm cell "lifting" + notification bubble · 175: "reading" cell, camera 2x towards the phone · 350: POV picture replaces the stage picture 1 : 1 · then whole steps 2, 3, 4 and "fill" (4.3x at 360 wide, 4.7x at 390), the screen covers the box by about 720–750 ms · 800: the chat is mounted, a chat-green cover fades for 200 ms and the chat settles 8 px |
| Back, 700 ms | the same frames backwards: POV from "fill" down to 1 by 300 ms · "reading" cell · "lifting" cell at 425 · arms gone at 550, camera back by 700 |
| Short, 300 ms | arm up, cut, 100 ms fade. Used after the full version has played in the same Part in this browser session |
- Tap anywhere during the move: straight to the end state.
- Reduced motion (and `?gerak=ikut` with the system asking for it): plain cut, no frame at all.
- With only two triggers, each in its own Part, the short version cannot occur in a normal playthrough today; it is there for later triggers. Not exercised by the check.

**How it is built**
- `ui/latar/piksel/teleponTangan.ts`: a small store; `PanggungPiksel` draws the arm cell, the phone back and the bubble on the stage canvas after her body and before the counter layer, at the README offsets (frame (2, 54), (26, 56 / 69), (50, 18)). The stage publishes the phone-screen centre so the camera can aim at it.
- `hp/transisiTelepon.tsx` + `.css`: the timeline and the POV layer. The layer is `position: fixed` exactly over the visible stage box (it stops at the dialogue card), so the stage box never changes size and nothing is added to the page.
- `PemainHP` is now a thin wrapper: during the first 800 ms of the forward move the inner player keeps drawing the old stage state with input frozen.
- Camera "in on her" is a 2x CSS scale of the stage canvas about the phone screen (whole factor, pixels stay square), not a move of the stage camera itself.
- The lit-screen files (`layar-menyala*.png`) and the 336 crop of the POV are not shipped: the POV variant does not need them, and the 366 picture is simply centred in the narrower box.

**Bytes**
- Art in the client: 4,317 B, 4 files (`pov-366x229` 3,489 · `lengan-dua` 571 · `gelembung-notif` 150 · `punggung-telepon` 107).
- Story JS chunk 163,810 -> 175,054 B (+11.2 KB: code plus the four PNGs inlined); story CSS chunk 178,553 -> 180,316 B (this also contains the batch 3 fixes).

**Checks on this build** (own server on :4003, now stopped; one browser at a time)
| Check | Result |
| --- | --- |
| `tools/cek-telepon-t021.mjs` (new) | 10 / 10 |
| `npm run test:client` | 742 / 742, plus 3 new tests in `hp/transisiTelepon.test.ts` (run on their own: 3 / 3) |
| `cek-layar-t018.mjs`, all families, both engines, four sizes | 176 / 176 |
| `cek-piksel-t013.mjs` | 99 / 99 |
| `cek-bahasa-t014.mjs` | 138 / 138 |
- `cek-telepon` at 390x844 and 360x740, Chromium with motion forced to normal: an in-page recorder logs every frame (about 31 ms apart). Measured, 390x844 / 360x740: reading cell at 195 / 209 ms; POV from 358 / 371 ms; screen covers the box at 749 / 727 ms; chat mounted at 816 / 825 ms; layer gone at 1,043 / 1,020 ms; back finished at 709 / 711 ms. Page scroll 0 and no extra page height or width in any frame; stage box height constant. Plus reduced motion = cut (both directions) and tap = skip.
- The "back" case starts from the `akhir-puas` state stepped back one line into the chat; the other two endings are covered by the unit test of the list only.
- **Layout check, first run 168 / 176:** the eight failures were the opening scene on WebKit. The check went on measuring the old stage during the new 800 ms hold; it now stops when the view changes. Chromium did not show it because headless Chrome on this PC reports reduced motion tonight, so the layout, pixel and language checks ran the Chromium side with the cut, not the cutscene.
- The three new unit tests were not in the suite at first: `test:client` lists its files, so I added the file to `package.json`. The 742 figure is from before that; the full suite was not rerun after the one-line script change.
- Not run: chat family of `cek-gulir`, `cek-akhir`, `cek-jalan`, `cek-kaki`.

**Evidence:** `team/evidence/T-021/fullstack/`: six captures per direction per size (`maju-*`, `balik-*`) and `hasil.json`. A capture takes about 100 ms, so each shows the frame roughly 100 ms after the time in its name. I opened two (forward 390x844, first and third).

**To judge / not verified**
- Feel of the timing and of the 2x camera step; nobody has watched it at full speed on a phone.
- In the first build I looked at, the POV layer covered the top edge of the dialogue card; I then clipped it at the card. I did not open a capture after that change.
- The back move on the two other endings, WebKit, and sizes other than the two in the brief.
- Sound: nothing is played for the move.

## T-021 FIX (2026-11-17): Designer review D-210..D-214 + motion-independent checks

Fullstack · NOT committed. Same build as T-022 below.

| Item | What changed | Measured / asserted |
| --- | --- | --- |
| D-210 | The camera state is no longer reset at every frame change; it holds across the whole move | back move: camera value changes once (2x -> 1x), in all three endings |
| D-211 | Camera = one hard step to 2x, no transition | only 1 and 2 ever measured |
| D-212 | The POV starts at the smallest whole scale that covers the box | every POV frame covers the box (asserted); forward starts at 2x on phones |
| D-213 | Whole-number POV scales only, one step per whole number | phones: 2, 3, 4, 5 forward and 5, 4, 3, 2, 1 back. 1280 not run |
| D-214 | The green cover is the full stage box | asserted against the stage box height |
- `cek-telepon-t021.mjs`: **14 / 14**. It now runs the back move once per ending (`akhir-puas` at both sizes, `akhir-catatan` and `akhir-kurang` at 390x844), with six captures each, and asserts the five items above. Captures: `team/evidence/T-021/fullstack/` (36 PNG + `hasil.json`; the old ones were replaced). I did not open the new captures.
- Timing after the fixes, 390x844 / 360x740: reading cell 196 / 185 ms, POV from 361 / 367, screen covers the box at 708 / 708, chat at 806 / 816, done at 1,017 / 1,015; back done at 703–721.
- **Motion-independent checks (Lead's addendum):** `cek-jalan-t017.mjs` (its page helper is also what `cek-akhir-t019.mjs` uses) and `cek-kaki-t017.mjs` now set `prefers-reduced-motion: no-preference` themselves, like `cek-gerak-t016` / `cek-piksel` and `cek-telepon`. Run once each on this PC, where Chrome reports reduced motion: cek-akhir 45 / 45, cek-jalan 8 / 8, cek-kaki 18 / 18.
- `cek-layar`, `cek-gulir` and `cek-bahasa` still follow the PC's setting on Chromium (they measure layout, not motion).

## T-022 (2026-11-17): new activity "Periksa SIM Pak Darto"

Fullstack · NOT committed. Board: T-022 -> review.

**Where it sits.** New node `ksim` after K09 (`k09` -> `ksim` -> `k10`), in the interview room with Pak Bima and Pak Darto, two intro lines, then the activity. It always starts at the desk.
- **It is not a numbered decision point:** the episode keeps its 15. Pak Darto's licence is genuine, so there is no story branch and no change of trust.
- Scoring as decided: no wrong tap = the activity's full mark and Pak Bima's line `ksim-a`; one or more wrong taps = `ksim-b` (he repeats the order of the steps). Nothing else is lost.

**The game** (`hp/arena/ArenaSim.tsx`, `seni/aktivitas/sim.css`; new arena pattern `sim`)
| Step | Player does | Wrong taps answered by Pak Bima | Stamp |
| --- | --- | --- | --- |
| 1 Desk | taps the wallet; Pak Darto hands the card over | the photocopy | ASLI |
| 2 Card | taps the class box (magnifier), then the truck tag; "Balik" flips the card | the photo; name and number | COCOK |
| 3a Places | taps Satpas SIM | Kantor Raksa; Bengkel rekanan | |
| 3b Counter | taps the NIK line on the KTP; the terminal types, then "data found"; the power of attorney lies there | name line; address line | SATPAS |
| 4 Print-out | drags the card onto it, or taps the card or the print-out; three rows tick one by one | | SESUAI |
| End | clipboard with four stamps, "Cerita Pak Bima dari kasus lain" with the edited print under the glass, one line of feedback | | |
- Clipboard with four stamp places under the scene, Pak Bima's speech box (amber after a wrong tap), "Kenapa?" note on every scene, bar label per step.
- Every target is a named button; the drag has a tap and a keyboard equivalent (Enter / Space on the card). Under reduced motion the ticks and the terminal change at once.
- Tapping the truck tag before the class box is not counted as wrong: Pak Bima says to read the class first (new line, my wording).
- The article is not named; the card says "pengecualian polis". Validity is on the drawn card only.
- No list view for this activity (the link is hidden); nothing of it is saved mid-way, so leaving and coming back restarts at the desk.

**Summary note.** Two places: the line under the result scene ("Selesai tanpa ketukan keliru" / "Selesai dengan arahan Pak Bima") and a note in the player's Catatan (`catatan.simBersih` / `catatan.simRagu`, one sentence). **I did not add a line to the end screen's decision review**, because that review lists the 15 numbered points; say if it should appear there too.

**Texts.** 101 new keys in `teks.id / en / zh` (Indonesian from the concept; **English and Chinese are my drafts for the Designer**). Key count test updated (916 -> 1,017).

**Art.** 37 of the 39 PNGs shipped, 22,850 B, in `seni/aktivitas/sim/`; `sim-palsu-kecil` and `potret-petugas` are not used by any screen and are not shipped. Pak Darto at the desk is drawn from his existing atlas; the wall is the existing interview-room art.

**Bytes**
| | Before T-022 | Now |
| --- | --- | --- |
| Activity PNG in the client | 36,933 B, 97 files | **59,783 B, 134 files** (+22,850) |
| Story CSS chunk | 180,316 B | 217,204 B (+36.9 KB: the PNGs inlined as base64, about 30.5 KB, plus rules) |
| Story JS chunk | 175,054 B | 187,742 B (+12.7 KB) |
- Expected about +25 KB of art; actual +22.9 KB. On the Designer's 168 KB basis (not reproduced by me) Episode 2 is at about 232 KB of the 400 KB gate, counting T-020, T-021 and T-022 art.

**Checks on this build** (own server on :4003, now stopped; one browser at a time)
| Check | Result |
| --- | --- |
| `npm run test:client` | 746 / 746 |
| `cek-layar-t018.mjs`, all families, both engines, four sizes | 184 / 184 before the T-021 fixes; stage + ending families rerun after them: 112 / 112 |
| `cek-piksel-t013.mjs` | 99 / 99 (before the T-021 fixes) |
| `cek-bahasa-t014.mjs` | 138 / 138 (before the T-021 fixes) |
| `cek-telepon-t021.mjs` | 14 / 14 |
| `cek-akhir` / `cek-jalan` / `cek-kaki` | 45 / 8 / 18, all pass |
- New case `arena-ksim` in `cek-layar`: 19 states (the 16 mock states, the wrong tap on the card, and both open notes). In every state: nothing scrolls, scene 236, clipboard 48 (62 at the end), instruction one 20 px line, bar label one line, sprites unscaled, targets inside the scene; plus the flow (wrong tap = amber + count, right tap = stamp, pointer drag, return to the story at `ksim-b`).
- Smallest spare under the content: 36 px at 360x640, 41 at 390x645, 136 at 360x740, 240 at 390x844; same on WebKit.
- Unit tests: several play-through helpers and the desk prototype's jump list needed a `ksim` answer; the 400 random playthroughs still all finish.
- Not run: chat family of `cek-gulir`, `test:e2e`. `cek-bahasa` does not open this activity.

**Evidence:** `team/evidence/T-022/fullstack/`: the 19 states at 360x640 and 390x645 (id), opening and magnifier states at 390x645 in en and zh, `ksim-1280.png`. I opened four (opening, magnifier and print-out at 360x640; magnifier in English).

**To judge / not verified**
- en / zh: only two states each were checked for fit; the other 17 were not.
- The no-wrong-tap path through the browser (the check always makes four wrong taps; `ksim-a` is covered by unit tests only).
- Desktop at 1280: captured, not opened; the game is capped at 366 px wide there.
- Existing saved games at or after K10 are unaffected; a save sitting in K09's result will meet the new activity next.
- Sound: existing tap / confirm / paper sounds are reused; nothing new.

### T-022 Fix (2026-11-17): D-215 finger drag, D-216..D-223, final English texts, redrawn stamps

Fullstack · NOT committed. Belongs to "## T-022" above. Board: note "T-022 fix done".

**D-215 (blocker): fixed.** `.hp-sim .sim-kartu-seret` and everything inside it now have `touch-action: none` with more weight than `.player-ui button { touch-action: manipulation }`.
- Verified with a real touch drag on Chromium (the touchscreen of the browser's debug protocol, so the browser applies `touch-action`): 60 px up in six steps at 360x640, 390x645, 360x740 and 390x844. The card follows the finger the full 60 px, the ghost shows, no `pointercancel`, the card drops and the three rows tick.
- **WebKit: not a real finger.** Playwright has no touch-move input for WebKit, so there the check sends pointer events of type "touch" from script and asserts the computed `touch-action: none` on the card and its content. That covers the measured cause, not the browser's own gesture handling. A real iPhone is still unverified.
- I did not run the drag once with the old rule to see the check fail; the Designer's review has that measurement.
- Other draggable that is a button: the grab handle of the chat reply sheet. Its rule had the same weight as the `.player-ui button` rule, so file order decided; I added a heavier rule. Not tested with touch.
- While at it: the card called `setPointerCapture` without a guard, which threw on WebKit for script-made pointer events; it is now guarded.

| Item | Done | Note |
| --- | --- | --- |
| D-216 | yes | the nine final English texts applied exactly; at 360x640 both shortened instructions fit on one line (measured) |
| D-217 | yes | 1 px dashed cream line around the photocopy and the wallet on the desk and around the three KTP rows, until the step is done |
| D-218 | **skipped** | needs the Lead's decision (keep the wrong-tap count when the player leaves and returns, or accept) |
| D-219 | yes | desk: the green line is around the small card; card: no green line under the magnifier |
| D-220 | yes | clip hidden on the end screen |
| D-221 | yes | name box 66 px; card drops at top 118, all three green boxes inside the scene (asserted) |
| D-222 | yes | `overflow: clip` on the scene; focusing the card no longer scrolls it (asserted) |
| D-223 | yes | at 1280 the instruction is above the scene and the 366 px column is left-aligned with the title; captured, not opened |
| D-224 | yes | the Designer's four redrawn stamps copied in (same names, 60 x 26); set is now 22,813 B (was 22,850) |

**Checks on this build** (own server on :4003, now stopped)
| Check | Result |
| --- | --- |
| `npm run test:client` | 746 / 746 |
| `cek-layar-t018.mjs`, `arena-ksim`, both engines, four sizes | 8 / 8 (first run 4 / 8: WebKit threw on the script-made pointer events, see above) |
| `cek-bahasa-t014.mjs` | 138 / 138 |
- New assertions in the ksim case: touch drag as above, hint lines (D-217), green boxes inside the scene (D-221), no inner scroll on focus (D-222), clip hidden at the end (D-220).
- Not rerun: the other layout families, `cek-piksel`, `cek-telepon`, `test:e2e` (Lead runs it).
- Story chunks now: CSS 217,457 B, JS 187,986 B.

**Evidence:** `team/evidence/T-022/fix/`: the 19 states plus the mid-drag capture at 360x640 and 390x645, two English states at 360x640, `ksim-1280.png`. I opened two (mid-drag and the end screen with the new stamps, 360x640).
- **D-225 (re-check, 2026-11-17):** on the counter step only, the hint line around the three KTP rows is now the card's dark blue `#2f4a6b` (cream had 1.20 : 1 on the light blue paper); the desk keeps cream. In the same rule I fixed a regression from D-217: a hinted target focused by keyboard showed only the 1 px hint line, not the focus ring (measured before: `1px dashed` cream; now the shell's `3px solid` ring). `test:client` 746 / 746; `arena-ksim` 8 / 8 on both engines at four sizes with new assertions for both points (run against the previous build first: 3 failures, as expected); capture `team/evidence/T-022/fix/d225.png` (390x645); the 40 state captures and the English counter capture in that folder were retaken from this build; story CSS chunk 217,596 B. **Found, not fixed (outside this brief):** in steps 1, 2 and 3b the tap targets are recreated on every re-render (`Ketuk` is a component defined inside the render in `ArenaSim.tsx`), so after a keyboard activation focus falls to the page body (measured at the counter: Enter on the name row, `document.activeElement` = `BODY`, 2 Tabs to get back in Chromium); taps and the drag show no effect in the checks; fix would be to define `Ketuk` at module level. Not committed.
- **Keyboard focus (2026-11-17, small fix):** `Ketuk` is now a module-level component with stable keys (it was defined inside the render, so the tap targets of steps 1, 2 and 3b were recreated on every re-render and keyboard focus fell to `BODY` after each activation). After a keyboard activation focus now stays on the target (wrong tap, or the class box) or moves on: step done -> the bar button; bar button -> the new step's instruction line (tabindex -1, no ring, one Tab to the first target); "Kenapa?" -> "Tutup" -> back to "Kenapa?". Focus is moved only after a keyboard activation (trusted click with detail 0); taps, mouse and the drag are unchanged (asserted with a real mouse click). Two additions to make that safe: a held Enter no longer re-presses a button (focus may just have landed on the bar button), and in step 4 the card and the print-out stay focusable until the three ticks are done. `arena-ksim` 8 / 8 on Chromium + WebKit at four sizes with the new assertions (desk, card and counter are now played by keyboard; on the previous build they gave 12 failures, all "focus on BODY"); `test:client` 746 / 746. One-off checks, not in the suite: step 4 by keyboard (Enter on the card and on the print-out, normal and reduced motion: never `BODY`, ends on the bar button), desktop 1280 (10 / 10), Space as well as Enter. Story chunks: CSS 217,782 B, JS 188,789 B. Not committed.

## T-024 (2026-11-17): end screen fits one phone screen

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed. Board: T-024 note "built (uncommitted)".
Spec `team/specs/2026-11-17-T-024-T-025.md` + rev 1.1, built to the Designer's measured mock (DESIGN-REVIEW "T-024 — mock", D-226..D-235, `team/evidence/T-024/designer/mock-akhir-satu-layar.css`) as the Lead instructed. Lead decisions applied: D-228 (the reason line is a button; its sheet has the whole sentence and "Lihat perjalananku"), D-233 (retry sentence only as `aria-describedby`; script note in the Menu row; chart caption and summary heading for screen readers only), D-229 / D-231 / D-232 (the keys below, the 18 px legend row).

**Result.** In the locked phone shell the end card of an episode with numbered decisions is one screen: nothing scrolls (page, `.hp-main`, card) and the action bar stays pinned. At 390 × 645 and 360 × 640, in id / en / zh and all three endings, in Chromium and in WebKit, every block has the mock's height and the space left under the content is the mock's table to the pixel:

| Space left (px) | Puas | Selesai dengan catatan | Kurang puas |
| --- | --- | --- | --- |
| 390 × 645 id and zh | 57 | 57 | 57 |
| 390 × 645 en | 48 | 23 | 48 |
| 360 × 640 id | 52 | 26 | 27 |
| 360 × 640 zh | 52 | 52 | 52 |
| 360 × 640 en | 18 | 17 | 43 |
- Blocks: head 56 (57 when the ending name wraps), title 25 / 50, reason 40, chart 72, legend 18, tokens 132 (15 buttons, cell 67.2 × 44 at 360 and 73.2 × 44 at 390), lesson 63. Chart gutter 54 / 60 / 33 px for id / en / zh (mock 54 / 61 / 33): it is the width of the longer band label + 12 by layout, not a number per language.
- Sheet heights equal the mock's lists (360 × 640 id, mixed ending: 403 403 403 360 340 383 360 403 363 360 340 420 423 443 443; lesson 162, reason 214). Over the three endings the tallest decision sheet is 463 px at 360 × 640 and 443 px at 390 × 645, more than 110 px under the limit (screen − 65 px), so no sheet body scrolls at these sizes.
- Outside the locked shell nothing changed: four full-page captures of the end screen (1280 × 800 id and en, 1100 × 700, 800 × 420) are pixel-identical to the previous build. Because I touched shared shell CSS (below), I also compared ten other screens (scenes, chats, one activity, the Menu on a story screen; phone and desktop; id / en / zh): 0 pixels differ.

**How it is built**
- `LayarAkhir.tsx`: new prop `satuLayar` (PemainHP passes the media query that locks the shell). With it, and only for an episode with `titik`, the card renders the one-screen form (`.akh-kartu.akh-satu[data-satu-layar]`); the old form is the second return, untouched. PemainHP marks the screen with `data-akhir-satu`.
- `RingkasanKeputusan.tsx`: `RingkasanSatuLayar` (compact chart + legend + token strip), `GambarToken`, `PetaTitik`, `IsiLembarTitik`. The desktop list renders the same markup as before and reads its data through the same helper as the tokens (`infoTitik` in `titik.ts`).
- Token art: `client/src/cerita/seni/akhir/token-keputusan.png`, a byte-identical copy of `character/akhir-ep2-pixel-v1/token-keputusan.png` (496 B, inlined into the CSS once). The speech bubble is the T-022 art.
- **One sheet owner** (rev 1.1): `ui/LembarAkhir.tsx`. LayarAkhir holds a single sheet state (a decision, the reason, or the lesson). The look is the reply-sheet shell (`.hp-lembar` CSS: gold edge, handle, only the body scrolls); the behaviour is the shared dialog stack `ui/modal.ts`, not PilihBalasan's state: one focus trap, `#root` inert, one page scroll lock for the whole stack, Escape / backdrop / close button, focus back to the token or card. It is a portal on `<body>`, so it also covers the pinned action bar. Left / Right arrow keys move between decisions too.
- **Fit rule** (`ui/pasAkhir.ts`; only needed below the two target sizes): the chart shrinks by itself 72 → 56 (CSS flex), then `data-pas="tanpa-sebab"` hides the reason line, then `tanpa-legenda` hides the legend; `gulir` is a safety net in which only the card scrolls. It is measured before paint and again on resize, language change and font load. Shortening a 360-wide screen from 640 to 560 px gives the same in both engines: chart 72, 66 at 608, 58 at 600, then the reason hides at 592 and the chart is 72 again, 62 at 560; tokens and lesson are never cut and nothing scrolls. On a 320 × 568 phone in English the reason is hidden and the chart is 61 px.
- **Menu rows** (`PemainHP.tsx`, `hp.css`): "Rentang suasana" ("80+ Puas · 60+ Percaya · 40+ Tenang · 20+ Cemas · 0+ Kecewa") and "Catatan simulasi" (the disclaimer, then the script-status note), in id / en / zh.
- New keys in `i18n/kamus/ceritaAkhir.ts` (id / en / zh): `statusSingkat`, `token.aria`, `nilai.kosong`, `lembar.nomor`, `lembar.sebelum`, `lembar.berikut`, `menu.suasana`, `menu.catatan`.

**For the Lead and Designer to accept or reject**
1. **Order of the fit rule.** The spec body and the mock say chart first, then the reason line; the parenthesis in rev 1.1 says "sebab first, chart to 56 px next". I followed the mock, since shrinking the chart loses no information. The other order is one array in `pasAkhir.ts` plus one CSS line.
2. **When the fit rule hides the reason line** its button is gone too, so the lesson sheet then also shows the reason sentence and the "Lihat perjalananku" link. Not in the mock, where the rule never triggers.
3. **"Lihat perjalananku" in Episode 2.** That dialog was hidden for Episode 2 because the episode has no review data. Opened as it was, it said "Belum ada yang tercatat membantu di perjalanan ini" and, on the two other endings, "Semua langkah akhirnya diluruskan", both untrue here. `PerjalananKu.tsx` now leaves out those two groups for an episode without review data, so Episode 2 shows "Kenapa berakhir begini", the endings found, and "Coba dari bagian lain". Episode 1 has the data and is unchanged.
4. **Sheet details that differ from the mock's CSS.** The sheet keeps the reply sheet's 0.18 s rise (the mock had `animation: none`). The handle is pointer-only and the cross is the named close button, so a screen reader meets one "Tutup". At decision 1 and 15 the end button is `aria-disabled` with the mock's disabled look, so keyboard focus is not lost.
5. **Menu rows** appear only while the one-screen end card is shown, and sit under the sound controls: at these sizes the Menu has to be scrolled to reach them.
6. **Taller phones.** I kept the mock's numbers at every height. At 390 × 844 the space left under the lesson is 256 px in Indonesian (222 px for the English mixed ending) and the two texts are still cut to two lines. Not changed; say if the clamps should relax when there is room.
7. Tokens have the mock's blue inset focus ring; the reason line and the lesson keep the shell's green ring. The card is 12 px wider than the column (6 px each side) only so that this ring is not clipped; the content sits where the mock has it.

**Checks** (my server on :4003, one headless browser at a time, below-normal priority, no e2e)
| Check | Result |
| --- | --- |
| `npm run test:client` | 750 / 750 (3 new tests: token data and legend counts, order of the fit rule, the new texts in id / en / zh) |
| `tools/cek-akhir-t019.mjs` (extended) | ALL PASS (84): the 45 T-019 checks, 20 card checks in Chromium (18 cards, fit rule, desktop), 19 in WebKit (18 cards, fit rule) |
| `tools/cek-layar-t018.mjs --keluarga akhir` | ALL PASS (18): 3 endings × 4 sizes in Chromium, × 2 sizes in WebKit; space left 152 / 126 / 127 px at 360 × 740 and 256 px at 390 × 844 |
| `tools/cek-bahasa-t014.mjs` | ALL PASS (138): en and zh at 360 × 740, 390 × 844 and 1280 × 800 |
| The new checks on the previous build | fail as they should: card "bukan bentuk satu layar"; layout family 3 of 3 fail (content scrolls 1,735 to 1,837 px) |
- The card checks are a new module, `tools/cek-kartu-t024.mjs`, called by `cek-akhir-t019` (Chromium, then WebKit) and runnable alone. Per ending × language × size it asserts: no page scroll, no inner scroll (the scroll area is measured; the English header is 66 px, D-234), fit rule unused, action bar one row inside the screen, block heights, 15 tokens of at least 44 × 44 with a name in the page language, band labels and chart name in the language and clear of the line, no Indonesian word under en / zh. Then the sheet: opened by a real tap, modal with inert background and scroll lock, action bar covered, text wraps inside the sheet (zh / en), next / previous / arrow keys / both ends, Escape, backdrop and close button each returning focus to the token, lesson and reason sheets with the full text, "Lihat perjalananku", the two Menu rows. Plus the fit rule on a shortened screen and the unchanged desktop. In WebKit the sheet part runs on the mixed ending only.
- The `cek-layar` end-screen family now requires the one-screen card (it used to require a scrolling summary).

**Files.** `client/src/cerita/ui/`: `LayarAkhir.tsx`, `RingkasanKeputusan.tsx`, `LembarAkhir.tsx` (new), `pasAkhir.ts` (new), `titik.ts`, `PerjalananKu.tsx`, `akhir.css`. `client/src/cerita/hp/`: `PemainHP.tsx`, `hp.css` (`.hp-tema` = the shell's colours and font for the sheet, which lives outside `.hp-layar`; the Menu rows), `desain.css` (one-screen `.hp-main`, sheet shell). `client/src/cerita/seni/akhir/token-keputusan.png` (new). `client/src/i18n/kamus/ceritaAkhir.ts`. Tests in `episode/auto-2/episode.test.ts` and `teks.test.ts`. Tools: `cek-kartu-t024.mjs` (new), `cek-akhir-t019.mjs`, `cek-layar-t018.mjs`.
- Story chunks: CSS 218,563 → 230,815 B, JS 188,943 → 201,872 B (gzip, both together: 129,953 → 135,689 B).
- Build made in a side folder and copied into `client/dist` at 12:32; the previous chunk set was removed at 12:49 and `client/dist` is now exactly this build (141 files). My server on :4003 is stopped.

**Evidence:** `team/evidence/T-024/fullstack/` (93 files): `satu-layar-<ending>-<size>-<language>.png` (18 Chromium, 18 with `-webkit`); for the mixed ending `lembar-k03`, `lembar-k15`, `lembar-pelajaran`, `lembar-sebab`, `perjalanan`, `menu` per size and language (WebKit at 360 × 640 only); `pas-360x560-id.png` (+ `-webkit`); `hasil.json`. I opened eleven: the card at 360 × 640 in zh and in en (WebKit) and at 390 × 645 for the poor ending; the decision sheet at 360 × 640 in id and zh; the tallest sheet in WebKit; the reason sheet (en), the lesson sheet (zh), "Perjalananku" (zh), the Menu rows (en) and the shortened screen. I also looked once at 320 × 568 and 768 × 1024 (not saved as evidence).

### Polish (2026-11-17, with the T-025 round): Designer review D-245, D-246, D-247

Fullstack · same folder · NOT committed. Lead's message: apply the three items before reporting T-025, rerun cek-akhir.
- **D-245, taller phones.** The fit helper now also runs the other way (`ui/pasAkhir.ts`: `pilihLega`, attribute `data-lega` on the card). On a screen at least 700 px high, while it still fits and in this order: the lesson is shown whole, then the reason sentence is shown whole, then the chart takes the room that is left, up to 96 px. A step is skipped, and the ones after it too, if it would not fit or would push the chart under 72 px. Below 700 px nothing changes: at 390 × 645 and 360 × 640 the two-line cuts and every mock number are as before (the card checks now also fail if the card relaxes there). The two sheets are unchanged.
| Space left under the lesson (px), after / before | Puas | Selesai dengan catatan | Kurang puas |
| --- | --- | --- | --- |
| 390 × 844 id | 152 / 256 | 152 / 256 | 152 / 256 |
| 390 × 844 en | 163 / 247 | 138 / 222 | 143 / 247 |
| 390 × 844 zh | 192 / 256 | 192 / 256 | 192 / 256 |
| 360 × 740 id | 48 | 22 | 23 |
| 360 × 740 en | 0 (chart 90) | 0 (chart 89) | 19 |
| 360 × 740 zh | 88 | 88 | 88 |
  At every one of these the lesson and the reason are whole (lesson 83 to 123 px, reason 60 or 80 px) and the chart is 96 px, except the two English cards at 360 × 740 where it takes the last 89 and 90 px. The threshold was checked on one card: 699 px high does not relax, 700 px does.
- **D-246, Menu rows.** "Rentang suasana" and "Catatan simulasi" now sit directly under "Bantuan", above the language and sound controls, and are in view when the Menu opens. In Indonesian and Chinese both rows are whole in view at 640 and 645 px. In English the script-status sentence is longer: at 360 × 640 its last line (28 px) is below the fold of the Menu, at 390 × 645 2 px; the row title, the disclaimer and the lines before are in view.
- **D-247, press feedback.** While pressed, a token picture and the two chevron chips (reason line, lesson card) go 2 px down, and the chip loses its edge, as the reply sheet's options do. Not with reduced motion.
- **Checks.** `npm run test:client` 759 / 759 (one new test for the relax order). `tools/cek-akhir-t019.mjs` extended, rerun on the final build: ALL PASS (105) = the 45 T-019 checks, 37 card cases, 21 tall-screen cases, 2 fit-rule cases. The 21 tall-screen cases are new in `tools/cek-kartu-t024.mjs`: 18 in Chromium (two sizes × three languages × three endings) and three in WebKit; on one of them per engine the press movement with motion on (2 px) and with reduced motion (0 px), the 699 / 700 px threshold and the unchanged lesson sheet; the Menu rows measured without scrolling the Menu. Evidence: `team/evidence/T-024/fullstack/lega-<ending>-<size>-<language>.png`, and the `menu-*.png` pictures are retaken.
- Not verified: the press on a real phone (the check uses a mouse press in headless Chromium and WebKit).

## T-025 (2026-11-17): Ruang Rapat Komite Klaim, room-owned sprites

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed · T-024 work kept in the tree. Board: T-025 note "built (uncommitted)".
Spec `team/specs/2026-11-17-T-024-T-025.md` section T-025 + rev 1.1; Codex plan review points 3 and 4; art and numbers from `character/komite-ep2-pixel-v1/` (D-237..D-244) as accepted by the Lead.

**Result.** Episode 2 has a sixth pixel room, `komite` (`komite-ep2`). Its four members are sprites that belong to the room: they are not cast members, never speak, never enter the dialogue state and are never read by the camera. The script only says which state the room is in, with a new cue field `komite: 'tunggu' | 'setuju' | 'catatan' | 'kosong'`.
| Where | Room state | What shows |
| --- | --- | --- |
| K11 intro (`k11.1`), with the bundle task card under the stage | `tunggu` | four members seated; each blinks on their own every 3 to 6 s |
| K11 result, file completed first (`lengkapi`) | `tunggu` since Fix 1 (was `setuju`) | as the intro: four members seated, no nod, no tag |
| K11 result, file sent without the police letter (`sekarang`) | `catatan` | Underwriter and Surveyor raise a hand; two CATATAN tags, 180 ms apart (since Fix 2: after the waiting room has been held for 320 ms) |
| K11 result, report sent to Mr Hendra instead (`hendra`) | `kosong` | four empty chairs, no tags |
| K13 opening beat (`k13.1`) | `setuju` | all four nod twice (head 3 px down 160 ms, back 160 ms) while SETUJU tags appear one by one, 180 ms apart (since Fix 2: after the waiting room has been held for 320 ms); then the chat with Mr Hendra's message and the offer letter as before |
| K12 | none | unchanged: chat from the office |
- The camera is a function of the room and the stage box only. In every check the four states have the same scale and the same view for the same box, and going into the bundle activity and back shows the same picture (same pixels) with no room fade.
- Reduced motion: no nod, no blink, every tag from the first frame; the still picture is pixel-identical to the last frame of the normal motion.
- Screen readers: the canvas stays hidden; one localized sentence per room state sits in the stage as a polite live region ("Ruang Rapat Komite Klaim. Keempat anggota mengangguk; di atas tiap anggota muncul tanda setuju."). The location chip is not drawn in this room (it would cover the first tag).
- "Apa itu Komite Klaim?": under the meaning, a row of the four 32 px head icons in seat order with the role under each (Ketua Komite, Underwriter, Surveyor, Kepala Klaim; en: Committee Chair, Underwriter, Surveyor, Head of Claims; zh: 委员会主席, 核保员, 查勘员, 理赔主管). Since Fix 2 the first seat reads Ketua / Chair / 主席.

**How it is built**
- **Art is installed, not redrawn.** `tools/piksel/ruang-komite-ep2.mjs` copies the five PNGs byte for byte into `client/src/cerita/seni/piksel/` and merges one room entry into `ruang-ep2.json`: the Designer's layers, frames and focus box plus a self-contained block `komite` (atlas, z 20 and tag z 40, the four ids with frame box, cells and offsets, the poses, the state map, tag cells and positions, icon cells). It checks the two source manifests against each other and against the PNG sizes, and has `--cek`. `bangun-ruang-ep2.mjs` calls it, so rebuilding the room manifest keeps the room; I ran the builder once: the 46 older files in `seni/piksel/` and the six review pictures came out byte-identical, and the manifest came out equal to the merged one.
- **Cue and fold.** `CueLatar.komite` (`tipe.ts`), folded like the other cue fields in `ui/latar/komposisi.ts` (kept until the next cue). `adeganPiksel` passes it on only for a room that has a `komite` block (default `tunggu`); `tokoh` stays empty.
- **Pure logic** in `ui/latar/piksel/komite.ts`: a tolerant reader for the block, `susunKomite(room, state, t, { diam, kedip })` (what to draw at time t: pose stacks, nod frames, tags that have appeared), `titikUbahKomite` (the instants the picture changes) and `lamaKomite`.
- **Stage.** `PanggungPiksel` draws the members after the background and before the table layer, and the tags after everything else. `useKomite` runs the entry motion once from the moment the PNGs are ready, with timers set to the change instants (no frame loop), and schedules the blinks. `kameraPiksel` is untouched and is not given the room state. `hangatkan.ts` preloads the atlas and the tags with the room.
- **Script** (`episode.ts`): location `komite` with the four sentence keys; `RUANG_KOMITE(state)`; one table `KOMITE_BERKAS = { lengkapi: 'setuju', sekarang: 'catatan', hendra: 'kosong' }`; the file-side line of each K11 result carries the room cue, and the line that follows goes back to the chat when news was sent. K13: node cue `setuju`, and `k13.2` carries the chat cue with the letter.
- **Chat flow** (`hp/alur.ts`, `Obrolan.tsx`, `PemainHP.tsx`), see points 3 and 4 below.
- **Glossary**: `Istilah.anggota` (text key + icon id); `ui/istilah.ts` (the pure part of the glossary, moved out of `KotakDialog.tsx` so that it can be tested in node); the row in `DaftarIstilah`; icons are cells of `komite-ikon.png` in `cerita.css` (a test compares them with the manifest).
- **Validator**: unknown room state, a `komite` cue on a location without state sentences, a missing state sentence, a member line without text.
- **Texts**: 9 new keys per language (1,019 to 1,028): `lokasi.komite`, `lokasi.komite.tunggu / setuju / catatan / kosong`, `istilah.komite.anggota.1..4`.

**For the Lead and Designer to accept or reject**
1. **Phone framing is wider than the mock.** (Changed in Fix 2 below: with the Designer's new focus box, phones 390 wide and wider at DPR 3 draw at 4 device px per art pixel, heads 48 CSS px.) The stage draws at a whole number of device pixels per art pixel, as every room does. With the manifest's focus box (1,100 world units) that gives 1 CSS px per art pixel on phones: 366 of the 400 art pixels at 390 wide, 336 at 360 (DPR 2 and 3 alike). So heads are 36 CSS px wide, not the mock's 48, and the whiteboard and the picture are partly in view at the edges (D-239 had them outside). The mock's 2.65 times is not a whole-pixel scale, and the next whole scale up does not fit: at 360 wide and at DPR 2 it is too narrow for the four members, and on a 390-wide DPR 3 phone it would show 274.5 art pixels where the focus box asks for 275 (the members and tags span 273) and only 137 art pixels of height in the 2 : 1 stage box where the focus box needs 155. So the mock's framing is not reachable on these phones without a fractional scale, which the pixel stage does not use. I did not change the Designer's numbers.
2. **SETUJU at K11 comes two weeks before the story's decision.** (Agreed by the Lead and changed in Fix 1 below: `lengkapi` is now `tunggu`.) As briefed, `lengkapi` shows nods and SETUJU in week 5. The texts say otherwise: K11-D "Padahal keputusannya belum keluar", K12 "Berkas sedang menunggu keputusan Komite", K13 "Minggu ke-7. Komite menyetujui klaim." With the false-news reply (K11-D) the player sees four SETUJU tags and then reads that nothing is decided. A mapping that fits the texts: `lengkapi` to `tunggu` (file accepted, members still seated) and SETUJU only at K13. It is one word in `KOMITE_BERKAS`.
3. **K11 with news sent: the room beat comes first, the chat block stays whole.** Order: room beat with the file-side sentence, then the chat with the player's sent message, Mr Hendra's reply, the news-side sentence and the status note. Two rules in `hp/alur.ts` had to learn about a scene beat that opens a result and then returns to the chat: the next chat session starts at the player's sent message (it would otherwise be folded behind "Lihat pesan sebelumnya"), and the status note still closes the result in the chat and is not shown on the room card. No older node has this shape, so nothing else changes (`tools/cerita/pandang-node.mts` lists the view of every line of every node). Without news (three of nine combinations) both sentences and the status note are on the room card.
4. **K13: no "Mulai percakapan" gate after the room beat.** The chat now starts in the middle of the node, after a beat the player has already advanced, so it shows Mr Hendra's message at once. Sessions that start with a node's first line (K01, K06, K12) keep the gate.
5. **The claim folder on the office desk is gone from K11**, because K11 is now in the committee room and that art has no folder. No scene shows the `berkas` prop any more (`ep2-ruang-prop-map.png`, 259 B, is unused by the script).
6. **Glossary row.** Role names only: I did not write what each role does, since that is claims content for the PIC review. Two-word roles wrap to two lines at 360 and 390 wide (Ketua Komite, Kepala Klaim, Committee Chair, Head of Claims); no word is broken. Opening an entry now scrolls the dialog box so that the whole meaning is in view; this is new for every glossary entry in the phone shell, where the page itself cannot scroll. The stage does not move or resize while an entry is open.
7. Tags stay Indonesian in English and Chinese (D-240). The state sentence gives the meaning to screen readers only; sighted players get it from the narration under the stage.
8. The entry motion plays each time the beat is mounted (first arrival, reload, return from another screen). Blink is drawn only in `tunggu`, as the manifest says.

**Checks** (my server on :4003, one headless browser at a time, below-normal priority, no e2e; all on the build named below)
| Check | Result |
| --- | --- |
| `npm run test:client` | 759 / 759 (9 new: 6 for the room sprites, 1 for the script wiring and the validator, 1 for the texts and the glossary, 1 for the T-024 relax order; older tests updated where the K11 flow, the list of locations and the key count changed) |
| `tools/cek-piksel-t013.mjs` | ALL PASS (149): the 99 older cases and 50 for the committee room |
| `tools/cek-layar-t018.mjs` | 148 / 148. The full run had 142; the six end-screen cases at 360 × 740 and 390 × 844 failed on the tool's own T-024 rule "chart is 72 px", which D-245 changes there. After the rule was updated the end family passed 18 / 18 (the app build was not touched in between) |
| `tools/cek-bahasa-t014.mjs` | ALL PASS (138) |
| `tools/cek-gulir-t018.mjs --keluarga obrolan` | ALL PASS (150). The other families of this tool are the cek-layar run above; I did not run them twice |
| `tools/cek-akhir-t019.mjs` (extended, for the T-024 polish) | ALL PASS (105), see "Polish" in the T-024 section |
- **The 50 committee-room cases** (`tools/cek-komite-t025.mjs`, called by cek-piksel, runnable alone):
  - 24 room cases, four states × id / en / zh × 390 × 645 (DPR 3) and 360 × 640 (DPR 2). Each compares the canvas with the atlas pixel by pixel at the whole-pixel scale: the head of every seated member and every tag that should show match with 0 differing pixels, both raised arms match above the table edge, and what must not be there is not (tags while waiting, arms in `setuju`, heads on empty chairs). Each also records the entry motion from the page: tags appear at about 0 / 180 / 360 / 545 ms, the nod frames run 0 1 0 1 and stop at about 640 ms. Sentence for screen readers and beat text equal the text tables; no Indonesian word in en / zh; no location chip; page does not scroll.
  - 6 camera cases: same scale and same view for the four states of a size and language.
  - Reduced motion (2): every tag in the first frame, no nod frame, final picture identical to normal motion. Blink (2): in 7 s all four members blinked with motion on, none with reduced motion.
  - Glossary (6): meaning and four roles equal the tables; four 32 × 32 icons in one row from four different cells; the picture file loads; the whole entry is inside the dialog box after it opens; stage and page do not move.
  - Flow (10): from the K11 card into the bundle activity and back (same pixels, no fade), then finish the task and arrive at the result beat with the tags appearing one by one; K11 with news sent, two variants × three languages (room card without status note, then chat: sent message in view, reply, news sentence, status note); K13 × three languages (room beat with its two glossary buttons, then chat at once with the message and the reply button).
- cek-layar has one new case, `adegan-k11-istilah` (four sizes in Chromium, two in WebKit): the glossary entry opened by a real tap in the locked shell.
- The T-013 saved states `berkas` (K11) and `surat` (K13) were not regenerated; both now open on the committee room and pass their old checks as pixel stages. New states: `tools/cerita/state-komite-t025.mts` to `team/evidence/T-025/states-komite.json` (with the expected texts read from the tables).

**Budget**
- Art: 9,889 B in five PNGs (limit 12 KB); 9,867 B since Fix 2. The four room files (8,313 B) load with the room; the icon strip (1,576 B) loads when the glossary entry is first opened.
- JS + CSS, all chunks, against the 12:32 T-024 build and including the T-024 polish: **+4,815 B gzip, +15,007 B raw**. The team's JS + CSS budgets have been counted in gzip (homepage spec, N-5), and by that count this is inside the 8 KB; counted raw it is not. Largest part: the stage chunk, +7.3 KB raw (room manifest entry, sprite logic, drawing).

- Build: made in a side folder at 13:48 and checked there. Copied into `client/dist` at 14:44, after QA's T-024 run had ended and its server on :4001 was stopped, so no review ran across the change; the older chunk set is removed and `client/dist` is exactly the checked build (146 files). `client/dist-rilis` not touched. My server on :4003 is stopped.

**Files.** New: `client/src/cerita/ui/latar/piksel/komite.ts`, `client/src/cerita/ui/istilah.ts`, five PNGs in `client/src/cerita/seni/piksel/`, `tools/piksel/ruang-komite-ep2.mjs`, `tools/cek-komite-t025.mjs`, `tools/cerita/state-komite-t025.mts`, `tools/cerita/pandang-node.mts`. Changed: `tipe.ts`, `validasi.ts`, `seni/piksel/ruang-ep2.json` (one entry added), `ui/latar/komposisi.ts`, `ui/latar/hangatkan.ts`, `ui/latar/piksel/` (`ruang.ts`, `adegan.ts`, `PanggungPiksel.tsx`), `ui/KotakDialog.tsx`, `ui/cerita.css`, `hp/alur.ts`, `hp/Obrolan.tsx`, `hp/PemainHP.tsx`, `episode/auto-2/` (`episode.ts`, `teks.id.ts`, `teks.en.ts`, `teks.zh.ts`), tests (`adegan.test.ts`, `hp.test.ts`, `episode.test.ts`, `teks.test.ts`), tools (`cek-piksel-t013.mjs`, `cek-layar-t018.mjs`, `piksel/bangun-ruang-ep2.mjs`). For the T-024 polish: `ui/pasAkhir.ts`, `ui/akhir.css`, `hp/PemainHP.tsx`, `hp/hp.css`, `tools/cek-kartu-t024.mjs`.

**Evidence:** `team/evidence/T-025/fullstack/` (58 files): `ruang-<state>-<size>-<language>.png` (24, plus two with reduced motion), `istilah-<size>-<language>.png` (6) and `layar-istilah-<size>-<engine>.png` (6), `alur-*.png` (19), `hasil-komite.json` (the 50 cases of the final cek-piksel run). Desktop view of the room: `team/evidence/T-013/final/surat-1280-id.png`. I opened: the four states at 390 × 645 (id), `catatan` at 360 × 640 in zh, the glossary at 360 × 640 in id and en and at 390 × 844, the chat after the room beat (K11 id and en, K13), and the room at 1280.

**Not verified.** A real phone. A screen reader (the sentence and its live region are checked in the DOM only). WebKit for the room itself: the pixel checks are Chromium only; WebKit ran the glossary layout case, the K11 scene, the chat and the end screen. `npm run test:e2e` was not run, as instructed.

### Fix 1 (2026-11-17): SETUJU only at K13

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed. Lead decisions on the eight points above: 1, 3, 4, 5, 6, 7 and 8 accepted, the gzip count accepted; point 2 agreed, so this fix.
- **Change.** `KOMITE_BERKAS.lengkapi` is now `tunggu` (`episode.ts`, one word plus the comment). A completed file at K11 leaves the room as the intro shows it: four members seated, blinking, no nod, no tag. The nods and the SETUJU tags now show in one place only, the opening beat of K13, which is where the texts put the decision. `sekarang` (two raised hands, CATATAN) and `hendra` (empty chairs) are as before. In the table above, the row "K11 result, file completed first" now reads `tunggu`.
- **State sentences: not changed.** The sentence of the waiting state names no tag ("Ruang Rapat Komite Klaim. Empat anggota komite duduk menunggu di balik meja panjang."). The sentence that names the approval tag belongs to `setuju` and is now read at K13 only.
- **Tests.** The table itself; the only node with a `setuju` cue is `k13`; the first line of seven K11 results carries the expected room state; the two phone-flow expectations for K11-A and K11-C (`tunggu`).
- **Tools.** States regenerated (`team/evidence/T-025/states-komite.json`): `setuju` is the K13 opening beat, and `hasil-lengkapi` is new (K11 result with the completed file). `tools/cek-komite-t025.mjs`, 57 cases instead of 50:
  - the six `setuju` room cases load K13 and fail if that state shows on any other node;
  - six new cases `komite-hasil-lengkapi-*` (three languages × two sizes): room in `tunggu`, four heads matched against the atlas, no SETUJU or CATATAN pixel, no tag recorded at any time after the picture is ready, both consequences and the status note on the card;
  - the task flow now has two variants: with the completed file the result beat has the same picture as the intro and no tag; sent without the police letter, the two CATATAN tags appear one after the other on arrival (0 and 180 ms);
  - the K11 news flow expects the waiting room on its room beat.
  Also: the head match now allows for a member caught in the 120 ms blink (no run caught one).
- **Checks on the new build** (my server on :4003, one headless browser at a time, below-normal priority, no e2e): `npm run test:client` 759 / 759 · `tools/cek-komite-t025.mjs` ALL PASS (57) · `tools/cek-piksel-t013.mjs` ALL PASS (156): the 99 older cases and the 57 room cases. Not rerun: cek-layar, cek-bahasa, cek-gulir and cek-akhir; the change is one word of script data, and no CSS, layout or text changed.
- **Evidence retaken** in `team/evidence/T-025/fullstack/` (65 files): `ruang-setuju-*` are now K13, `hasil-lengkapi-<size>-<language>.png` are new, `alur-tugas-lengkapi-akibat-id.png` and `alur-tugas-sekarang-akibat-id.png` replace the single task-flow picture, `alur-sela-a-1-ruang-*` show the waiting room; the six `layar-istilah-*` pictures are the earlier ones (that screen did not change). I opened the K11 result with the completed file and the K13 opening at 390 × 645.
- **Build.** Made in a side folder at 14:51 and checked there; copied into `client/dist` at 14:59 with no review server running (only the owner's :4000), older chunks removed, `client/dist` is exactly the checked build (146 files). `client/dist-rilis` not touched. My server on :4003 is stopped.

### Fix 2 (2026-11-17): Designer review D-248..D-253

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed. Review: `team/DESIGN-REVIEW.md` "T-025 — review" and its "delivered" line.
Numbers are the review's own: D-251 = glossary labels, D-252 = word on the whiteboard, D-253 = start hold. The brief's art items "D-250/251" are the review's D-250 and D-252 (the Designer delivered both), and I read its "D-252, D-253: apply if a few lines" as the two items that were still open, D-251 and D-253. Both are applied; nothing is skipped.

- **Art reinstalled (D-248, D-250, D-252).** `node tools/piksel/ruang-komite-ep2.mjs` copied `ep2-ruang-komite-latar.png` (916 B) and `ep2-komite-tanda.png` (267 B) and merged the room entry (focus box 252, 0, 1096 × 472; nothing else in the entry changed). `--cek` is clean: the five PNGs are byte-identical to `character/komite-ep2-pixel-v1/`, 9,867 B. The focus box needed no client code: the camera reads it from the manifest.
- **One scale per phone (D-248), measured in the app.** Device px per art pixel:

  | Phone (CSS px, DPR) | Before (16 : 10 box / 2 : 1 box) | Now, both boxes | CSS px per art px | Head of 36 art px |
  | --- | --- | --- | --- | --- |
  | 390 × 645 and 390 × 844, DPR 3 | 3 / 3 | 4 | 1.33 | 48 CSS px |
  | 393 × 852, DPR 3 | 4 / 3 | 4 | 1.33 | 48 |
  | 430 × 932, DPR 3 | 4 / 3 | 4 | 1.33 | 48 |
  | 360 × 640, DPR 2 | 2 / 2 | 2, same camera as before | 1 | 36 |
  | 320 × 568, DPR 2 | 2 / 1 (half size) | 2 | 1 | 36 |

  "Before" is the client's camera function with the old box (it agrees with the review). "Now" is read from the page on the five room screens of each phone: K11 intro, the three results without news, K13 opening. Between them they use both stage shapes on every phone except 320 × 568, where all five use the 2 : 1 box. On each of these screens the heads and the tags match the atlas pixel by pixel at that scale. At 390 wide DPR 3 the view is art x 62.75 to 337.25, on whole device pixels, and rows 0 to 137 in the 2 : 1 box: sign, tags, members, table top. The wall picture and the whiteboard are outside the view there, as the review predicted; at 360 wide both are still partly in view.
  Wide layouts are not changed: for the stage boxes of 1280 × 800, 1440 × 900, 768 × 1024 and 1024 × 768 the camera function gives the identical camera with the old and the new box; the page reports that camera at the four sizes, and I looked at the room at 1280 × 800 and 768 × 1024.
- **Camera test** ("T-025: kamera ruang Komite ..." in `adegan.test.ts`). It now expects: the delivered focus box; the scale of 14 phone classes in both shapes (390, 393, 402 and 430 wide at DPR 3 = 4; 390 wide at DPR 1 and 2 and every 360, 375 and 320 wide class = 1 CSS px; 412 wide at DPR 2.625 = 3); the focus box whole; offsets on whole device pixels with a tolerance (the old `% 1 === 0` gave 0.99999999999997 for x 251 at scale 1/3, as the Designer noted); 36 art px = 48 CSS px at 390 wide DPR 3; and a sweep of 320 to 480 wide × DPR 1, 1.5, 2, 2.5, 2.625, 2.75, 3, 3.5 and 4, where the two shapes must always give the same scale and never less than floor(DPR) device px per art pixel.
- **D-249: the status note of the K11-E card is in view.** The Designer's cut alone was not enough at 360 × 640: Indonesian was still 6 px over (the news text kept four lines, the last one a single word) and English 5 px over, as the review expected. 390 × 645 and Chinese fit with the cut. So in id and en I also shortened the second sentence; zh has the cut only. `k11.akibat.kabar.e` is now:
  - id: "Kamu tidak menambahkan kabar soal proses. Pak Hendra bingung membaca laporan teknis yang panjang." (the second sentence is the wording of the older line `k11-e.1`)
  - en: "You added no news about the process. The long report confuses Mr Hendra."
  - zh: "你没有补充任何关于流程的消息。Hendra 先生只收到一份很长的技术报告，看得一头雾水。"

  The reason line is not changed, so the card says "for the Committee, not for the customer to approve" once. Measured on the three result cards without news (K11-B, K11-C, K11-E) × id / en / zh × 390 × 645 and 360 × 640, in Chromium and in WebKit: the status note is inside the dialog box and the box does not scroll. At 360 wide the news text is three lines in id (last line 100 px free) and two in en (24 and 44 px free), so a small difference in text width does not add a line. The chat variant `k11.akibat.kabar.e2` still carries the sentence (the chat scrolls). **These are script texts: the Lead and the PIC may want another wording.**
  Height each card can still grow before its box would scroll (Chromium, px; one text line is 23.25 px):

  | Card | 360 × 640 id / en / zh | 390 × 645 id / en / zh |
  | --- | --- | --- |
  | K11-E, report to Mr Hendra | 19 / 20 / 11 | 9 / 32 / 24 |
  | K11-B, sent without the police letter | 5 / 42 / 14 | 32 / 32 / 46 |
  | K11-C, file completed | 42 / 19 / 34 | 32 / 9 / 24 |

  So every card fits, and on most of them one more line of text would put the note under the fold again; the tightest is K11-B in Indonesian at 360 × 640 (5 px), which this fix did not touch. (zh K11-B at 360 wide still has the taller stage shape, so its real room is larger.)
- **D-251: first seat label.** `istilah.komite.anggota.1` is "Ketua" / "Chair" / "主席" (was Ketua Komite / Committee Chair / 委员会主席). Gaps between neighbouring labels, measured on the text itself: English at 360 wide 20.7 / 9.4 / 18.3 px (the first was 4), at 390 wide 26.2 / 14.9 / 27.7 (was 7.5); Indonesian 18.9 / 9.4 / 21.2 and 24.4 / 14.9 / 30.6. Not changed: at 360 wide the second column is still 8 px wider than the others (65.5 / 73.4 / 65.5 / 65.5) in id and en, because "Underwriter" at 12.5 px is wider than a quarter of the row; at 390 wide and in Chinese the four columns are equal. Equal columns at 360 would need the Designer's other option (12 px text and labels that may overhang their column); I left the layout as it is.
- **D-253: the room waits before it reacts.** A state that has an entry motion first shows the waiting room for 320 ms (one nod): members seated, heads up, no tag, no raised hand. Then the first tag, the first nod and the raised hands start. K13: tags at 320 / 500 / 680 / 860 ms, nods from 320, still at 960. CATATAN: hands up and the first tag at 320, the second at 500. `tunggu` and `kosong` have no motion and no hold; reduced motion has no hold (every tag in the first frame, as before). It is a constant in `komite.ts` (`TAHAN_AWAL_KOMITE`), not a manifest field, so the Designer's files are untouched. Recorded in the page in the 12 room cases with motion: first tag 320 to 327 ms after the picture is ready.
- **Tools.** `tools/cek-komite-t025.mjs`, 81 cases instead of 57:
  - scale: every room case now expects the scale of its phone from one table (390 / 393 / 430 wide DPR 3 = 4, 360 and 320 wide DPR 2 = 2) and fails below 1 CSS px per art pixel;
  - 24 new cases `komite-skala-*`: the five room screens at 390 × 844, 393 × 852, 430 × 932 (DPR 3) and 320 × 568 (DPR 2), each judged like a room case (poses, tags, pixels against the atlas, focus box, entry motion), plus one case per phone that the five have one scale. At 320 × 568 only the stage is judged: there the text of four of the five screens scrolls inside the dialog box (44 to 104 px), which is the shell's rule below its guaranteed sizes; the stage box is the same 296 × 148 as before, so that is not new;
  - result cards (18 cases): file and news consequence equal the text tables exactly, the reason line is the table's, the status note is in view and the dialog box does not scroll;
  - entry motion: the first frame must be the waiting room, the first tag must come 240 to 520 ms later, nod frames -1 0 1 0 1 -1;
  - glossary: neighbouring labels at least 8 px apart.
  States regenerated (`team/evidence/T-025/states-komite.json`; the expected texts now include the news consequences and reasons of the three cards).
- **Checks on the new build** (my server on :4003, one headless browser at a time, below-normal priority, no e2e): `npm run test:client` 759 / 759 · `tools/cek-komite-t025.mjs` ALL PASS (81) · `tools/cek-piksel-t013.mjs` ALL PASS (180): the 99 older cases and the 81 room cases · `tools/cek-layar-t018.mjs --kasus k11` ALL PASS (18: 12 Chromium, 6 WebKit; `team/evidence/T-018/stage2/hasil.json` keeps its 148 cases with these 18 replaced) · `tools/cek-bahasa-t014.mjs` ALL PASS (138) · the three result cards in WebKit, a one-off Playwright script that is not in the repo: 18 / 18. Not rerun: cek-gulir and cek-akhir (no chat, end-screen, CSS or layout code changed; the two changed texts show on the room card and in the glossary only).
- **Evidence retaken** in `team/evidence/T-025/fullstack/` (91 files): all room, result, glossary and flow pictures; new `skala-<phone>-<screen>-id.png` (20) and `webkit-kartu-kosong-<size>-<language>.png` (6); `hasil-komite.json` has the 81 cases. `layar-istilah-*` are from this round's cek-layar run. I opened: CATATAN at 390 × 645 (new scale, darker letters), the K11-E card at 360 × 640 in id and en and in WebKit (id), the glossary at 360 × 640 in en, CATATAN at 320 × 568 and at 393 × 852.
- **Budget.** Art 9,867 B (22 B less). JS + CSS against the Fix 1 build: 40 B less raw, 46 B less in gzip.
- **Build.** Made in a side folder at 16:14; every browser run above was on that build. Copied into `client/dist` at 16:35, after QA's T-025 report was written (16:24, on the Fix 1 build) and its server on :4001 was stopped, so no review ran across the change; older chunks removed, `client/dist` is exactly the checked build (146 files). `client/dist-rilis` not touched. My server on :4003 is stopped.
- **For the re-check.** QA's report lists the old first-seat label (Ketua Komite). A check that pins that label or the old K11-E news text needs the new text, and a check that reads the tags in the first frame now finds the waiting room for the first 320 ms.
- **Not verified.** A real phone. The 320 ms hold by eye on a device (times come from the page's attribute record). WebKit for the room pixels (Chromium only); WebKit ran the three result cards and the cek-layar K11 cases. A screen reader.

## T-026 (2026-11-17): episode cards get a type tag, DEMO and KASUS NYATA

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed. Board: T-026 note "built (uncommitted)".
Owner request 2026-11-17: "add tags: Episode 1 is only DEMO, Episode 2 is Real Case, so users can choose."

**Result.** Each card in the picker (`/cerita`) carries a small badge on the top-right corner of its picture. Episode 1: DEMO, neutral grey. Episode 2: KASUS NYATA, brand green with white letters. English DEMO / REAL CASE, Chinese 演示 / 真实案例. Hovering shows one line, and the same line is the badge's accessible description:

| | DEMO | KASUS NYATA |
| --- | --- | --- |
| id | Cerita contoh untuk mencoba alur | Berdasarkan modul klaim Raksa |
| en | A sample story for trying out the flow | Based on the Raksa claims module |
| zh | 用来体验流程的示例故事 | 根据 Raksa 理赔模块编写 |

The id lines and the six labels are the brief's. **The en and zh lines are mine: for the Lead or PIC to confirm.**

**Where the badge sits, and why not in the meta line.** The brief asked for a chip in the meta line and for unchanged card heights at 390 and 360 wide. In Indonesian and English both cannot hold: beside the meta text there are 61 to 91 px free for Episode 2 in id and 26 to 56 px in en, and the chip needs 101 px (KASUS NYATA) or 79 px (REAL CASE) plus the gap. Wrapped under the meta text it adds 19 px to the card. I asked, with pictures of both; the Lead chose the badge on the picture corner at every size, the same place on both cards.
One change after that answer: my preview pictures had the badge on the top-left corner, and there it covers Pak Hendra's head on the Episode 2 cover at every phone size and the top of his hair on desktop (`sudut-kiri-ditolak-semua-ukuran.png`). The badge is therefore on the **top-right** corner, where both covers show only wall, door frame, sky or roof: 28 close-ups of both covers at 320, 360, 390, 412 and 430 wide (DPR 2, 2.625 and 3) and at 768, 1024 and 1280 wide are in one sheet, `sudut-kanan-semua-ukuran.png`. From 600 px, where the picture is the left column, the badge stays on the picture's top-right corner, not the card's.
The optional tag in the story header is skipped (the Lead agreed): the phone header has no room for it.

**How it is built**
- `Episode.jenis?: 'demo' | 'nyata'` and `JENIS_EPISODE` in `tipe.ts`; auto-1 is `demo`, auto-2 is `nyata`. The validator accepts an episode without the field (its card then has no badge) and rejects any other value.
- Dictionary `cerita`: `jenis.demo`, `jenis.nyata`, `jenisKet.demo`, `jenisKet.nyata` in id / en / zh.
- `pages/Cerita.tsx`: the badge is a `<p>` and the first child of the card, outside the picture box (which is `aria-hidden`), so it is read before the meta line and the title. It has `title` and `aria-description`. The meta line is untouched.
- `cerita.css`: the badge is positioned against the card and takes no room in the layout. 22 px high, 11 px text at weight 800, a 2 px ring in the card colour so its edge reads on any picture. Grey #e9ebe4 with #4d5a4f letters is 6.04 : 1; green #215c40 with white is 7.87 : 1. In the two-column layout one custom property holds the picture column width (280 px) for both the grid and the badge offset.
- `docs/cerita/PANDUAN-EPISODE.md`: one row for the new field.

**Checks** (my server on :4003, one headless browser at a time, below-normal priority, no e2e)

| Check | Result |
| --- | --- |
| `npm run test:client` | 762 / 762 (3 new: the validator, the two episodes, the dictionary keys) |
| `tools/cek-tag-t026.mjs` (new) | ALL PASS (18): Chromium at 390 × 645, 360 × 640, 320 × 568 and 1280 × 800, WebKit at 390 × 645 and 360 × 640, each in id / en / zh |
| `tools/cek-piksel-t013.mjs` | ALL PASS (180); its five picker-card cases (`kartu-cerita-360`, `-390`, `-768`, `-1024`, `-1280`) pass as before |
| `tools/cek-bahasa-t014.mjs` | ALL PASS (138) |

- **cek-layar has no picker or home family** (its families are scene, activity and end screen), so I could not run what the brief names. The picker is covered by the new tool and by the five picker-card cases of cek-piksel (360, 390, 768, 1024, 1280 wide). The home page is not touched by this change.
- The new tool, per case: one badge per card with the right type, label, tooltip and description (expected texts are read from the dictionary file, not typed into the tool); 10 px from the top and right edges of the picture box, wholly inside it, the same on both cards, not over the meta line, not clipped, and the topmost element at its centre; the two colours and their contrast; no horizontal page scroll; no page error.
- **Nothing moved.** Before the change I ran the same tool with `--ukur-dasar` on the build that was in `client/dist` (`dasar-tanpa-tag.json`). In all 18 cases the height of each card, the box of the meta line (still five items), the picture box and the page's scroll height and width equal those measurements within 0.5 px.

**Evidence:** `team/evidence/T-026/` (35 files): `picker-<size>-<language>.png`, full page (12 Chromium, 6 with `-webkit`); `hasil.json`; `dasar-tanpa-tag.json`; the two sheets and seven single close-ups `sudut-kanan-*.png` (final corner) and `sudut-kiri-ditolak-*.png` (rejected corner); `pilihan-A-*.png` and `pilihan-B-*.png` are the two options of my question, and B there still shows the top-left corner. I opened the final pictures of the picker at 390 × 645 (id), 360 × 640 (en, and zh in WebKit) and 1280 × 800 (id), and both sheets.

**Budget.** JS + CSS against the Fix 2 build: +1,241 B raw, about +450 B gzip. No new picture.

**Build.** Made in a side folder; every browser run above was on that build. Rebuilt once after a comment-only CSS edit: the output is byte-identical to the checked build (146 files). Copied into `client/dist` at 17:44 with no review server running (only the owner's :4000, which still serves its own build); older chunks removed; `client/dist` is exactly the checked build. `client/dist-rilis` not touched. My server on :4003 is stopped.

**Notes**
- The tooltip is hover only: on a touch screen the badge has no visible explanation. The description is in the DOM; no screen reader was run.
- A new or changed cover must keep its top-right corner free of faces. The tool checks where the badge is, not what the picture shows under it.
- Not verified: a real phone; `npm run test:e2e` (not run, as instructed).

**Files.** New: `tools/cek-tag-t026.mjs`. Changed: `client/src/cerita/tipe.ts`, `validasi.ts`, `episode/auto-1/episode.ts`, `episode/auto-2/episode.ts`, `ui/cerita.css`, `client/src/pages/Cerita.tsx`, `client/src/i18n/kamus/cerita.ts`, tests (`validasi.test.ts`, `episode/auto-2/episode.test.ts`, `i18n/terjemahan.test.ts`), `docs/cerita/PANDUAN-EPISODE.md`.

## T-028 (2026-11-17): Episode 2 as a hosted story room

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed. Board: T-028 note "built (uncommitted)".
Spec `team/specs/2026-11-17-T-028-ep2-room.md` rev 1.0 + rev 1.1; Codex plan review in `team/REVIEW.md` (7 points).

**Result.** A host can open a room from "Truk Trailer di Jalan Tol" next to the two DEMO scenarios. The existing room runtime and the client play it unchanged: 15 rounds (K01 to K15), five options each with the script's classification and status change, the delayed promise of the 20th, endings by final status, the final summary. Nothing of the script is typed again: `tools/cerita/ep2-ke-skenario.mts` reads the solo Episode 2 and writes `server/src/story/seed/ep2Trailer.ts` (id and en, 480 texts each, validator 0 errors), and the server publishes that scenario itself, once.

**Read first: what differs from what the spec assumed**

1. **A room shows Indonesian only.** The runtime reads one fixed content language (`server/src/story/runtime/room.ts`, `const LOCALE = 'id'`, used for the scene, the options, the consequence and the summary). The spec asked for the runtime to stay unchanged, so it is. The English texts are converted, stored and validated, but no room shows them: with the interface in English a player gets English buttons and an Indonesian story (`babak1-*-en.png`). If English rooms are wanted, that is a follow-up of its own: one content language per room (chosen by the host, stored with the room): the eight uses of that constant in `room.ts`, the `host:create` payload, the host picker, and the labels of a stored summary.
2. **"Published at server start like the demo" is not how the demo works.** The two DEMO scenarios are created and published only by `npm run story:dev-setup -- --publish-demo`, which refuses `NODE_ENV=production`. The Episode 2 scenario IS published at server start, in every environment including production, because the owner's event needs it on the deployed server (`STORY_SEED=off` skips it). The owner's server on :4000 runs the old `server/dist`; it gets the scenario when `server/dist` is rebuilt and that server restarted. I did not touch `server/dist`.
3. **Pak Hendra has no portrait.** It is not a data + URL addition: built-in characters are drawn by client code, for Bu Rina only; built-in assets have no file URL; and the chat and dossier layouts (all 15 rounds) show no customer portrait anyway. The fallback the spec names, the default customer portrait, is Bu Rina's face, which must not stand for Pak Hendra. So `customerCharacterId` is null: his name, initials in the chat header and the status word. Miss Raksa keeps her portrait.
4. **Every screen marks it as demo content.** Rev 1.1 keeps `contentSource: 'demo'`, so the host picker reads "DEMO (tidak masuk rekap kompetisi)", the host console "DEMO", and the player's lobby "Konten demonstrasi (bukan kasus resmi)" (`lobi-hp390-id.png`); the projector page uses the same text key (read in the code, not opened). The solo card of the same episode says KASUS NYATA (T-026), so the owner will see both labels for one story. Competition recaps leave its rooms out unless "sertakan DEMO" is chosen. It sorts first in the picker (by title).
5. **The answer key is not secret.** The solo Episode 2 on the same site has the same five alternatives per decision and shows the recommended ones at its end, and its script is in the client bundle. The project already has the switch for an event on the same case: a build with `VITE_CERITA_TANPA=auto-2` leaves the solo episode out of the bundle (`client/src/cerita/episode/index.ts`), at the price of the Episode 2 card. For the same reason I did not add the new seed to `tools/uji-bundel-kunci.mjs`: it would fail on every default build. Owner's call.
6. **Two sentences are mine, not the script's**: the synopsis ending that rev 1.1 asks for, and the timeout sentence (the solo game has no timer, so the script has no text for it). For the Lead / PIC to confirm:

| Key | Used for | id | en |
| --- | --- | --- | --- |
| `scenario.synopsis` | appended to the Episode 2 blurb (`ringkas`) | Kasus dari modul klaim; untuk uji acara. | A case from the claims module; for an event trial. |
| `round.<id>.timeout.consequence` | timeout consequence of all 15 rounds; {nasabah} = the customer’s name from the script | Kamu belum memutuskan apa pun. {nasabah} menunggu tanpa kabar. | You have not decided anything. {nasabah} is left waiting with no news. |

7. **Option length gives one answer away.** Validator warning `choice_length_hint` (not blocking): in round 15 the recommended option is by far the longest (69 characters, the others 23 to 56), because it is the script's summary of the complete closing message. In English the same holds for rounds 3, 13 and 15, and 11 English options are over 20 words. The solo script has the same texts.

**What was built**

- **Converter** `tools/cerita/ep2-ke-skenario.mts` (run with the client tsconfig; `--cek` compares the checked-in seed with a fresh conversion and exits 1 when they differ). It reads the episode graph, the id and en text tables and the activity definitions, and throws with the node's name when the script has something its rules do not cover (a conditional opening line, a new flag, a text over its limit with no split rule). Every text is measured against `TEXT_LIMITS`; a validator error stops it before anything is written. It writes the seed and the report `docs/prd-v02/EP2-ROOM-CONVERSION.md`.
- **Seed** `server/src/story/seed/ep2Trailer.ts`: generated data, typed `ScenarioContent`, with the canonical content hash in its header.
- **Publication** `server/src/story/seed/publish.ts`, called at server start (`server/src/index.ts`, after the interrupted-room recovery) and by `story:dev-setup`. It uses the normal lifecycle (`createScenario`, `submitForReview`, `publish`), so the scenario has a draft, an immutable version with its SHA-256 hash, three events and three audit rows, attributed to the actor `seed` (no staff id). The review note reads "Terbit otomatis oleh seed server untuk uji acara. BUKAN persetujuan komite; naskah sumbernya masih draf." Rules:
  - no scenario `sc_ep2_trailer`: create, submit, publish version 1 in one transaction;
  - current version has the seed's hash: nothing is written at all;
  - current version is the seed's and the seed content changed in a new build: the next version, in one transaction;
  - anything a person did (a draft being edited, their own published version, a withdrawn version, an archived scenario): left as it is, logged as "DILEWATI";
  - a failure (for example the category deactivated) is logged as "GAGAL" and never stops the server.
- `createScenario` takes a third argument `{ id }` for the stable id. It is separate from the request body on purpose: a request can never choose an id (tested).
- `CONFIG.storySeed` (`STORY_SEED`, default on), documented in `docs/prd-v02/HOSTING.md`; one row in `docs/prd-v02/CONTENT-HANDOFF.md`.
- Three scripts that took "the first demo scenario" now prefer a `[DEMO]` title, because the new scenario is demo-kind too and sorts first: `tools/uji-hosting-harness.mjs`, `tools/uji-keyboard-room.mjs`, `server/src/story/loadtest.ts` (one line each, the old expression as fallback; not run).
- **Tool** `tools/cek-room-t028.mjs` (below).

**Rounds** (from the report; each cell is the script's classification and status change, kept as authored)

| # | Round | Solo form | Layout | Key | Respondent | A | B | C | D | E | Timeout | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `k01` Kabar pertama | chat reply | chat |  | Pak Hendra | **tepat** +6 | keliru -3 | keliru -6 | kurang 0 | kurang 0 | -6 | none |
| 2 | `k02` Dokumen yang dibutuhkan | activity `berkas` | dossier |  | Pak Hendra | kurang 0 | **tepat** +6 | keliru -6 | keliru -3 | keliru -3 | -6 | checklist: the 8 items of the activity, in the activity’s own order, no status marks |
| 3 | `k03` Menjelaskan sejak awal | chat reply | chat |  | Pak Hendra | keliru -6 | kurang 0 | **tepat** +6 | keliru -3 | kurang 0 | -6 | timeline `dok.proses` (4 rows) |
| 4 | `k04` Di mana truk diperiksa? | activity `surveyor` | dossier |  | Pak Hendra | keliru -6 | kurang 0 | keliru -3 | **tepat** +6 | keliru -6 | -6 | document: the activity card (title + story) |
| 5 | `k05` Bengkel sedang penuh | activity `foto` | dossier |  | Pak Hendra | kurang 0 | keliru -6 | kurang 0 | keliru -3 | **tepat** +6 | -6 | document: the activity card (title + story) |
| 6 | `k06` Kapan keputusannya? | chat reply | chat | yes | Pak Hendra | keliru -12 | **tepat** +12 | kurang 0 | keliru -6 | keliru -6 | -12 | timeline `dok.linimasa` (3 rows) |
| 7 | `k07` Perlu diperiksa di lapangan? | activity `jalur` | dossier |  | Pak Bima | keliru -3 | kurang 0 | keliru -6 | **tepat** +6 | kurang 0 | -6 | compare: activity table `rencana` (3 rows) |
| 8 | `k08` Rambu di lokasi | activity `rambu` | dossier |  | Pak Hendra | keliru -6 | keliru -3 | **tepat** +6 | kurang 0 | kurang 0 | -6 | compare `dok.rambu` (4 rows) |
| 9 | `k09` Siapa yang ditanya? | activity `saksi` | dossier |  | none (narration) | kurang 0 | keliru -6 | kurang 0 | keliru -3 | **tepat** +6 | -6 | checklist: the 5 items of the activity, in the activity’s own order, no status marks |
| 10 | `k10` Keterangan yang berbeda | activity `selisih` | dossier |  | none (narration) | keliru -6 | keliru -6 | kurang 0 | **tepat** +6 | keliru -3 | -6 | compare: activity table `fakta` (4 rows); checklist: the 3 items of the activity, in the activity’s own order, no status marks |
| 11 | `k11` Sebelum diajukan ke Komite | activity `bundel` | dossier |  | none (narration) | **tepat** +6 | keliru -6 | kurang 0 | keliru -6 | kurang 0 | -6 | checklist: activity table `isi-bundel` (7 rows) |
| 12 | `k12` Cicilan tetap jalan | chat reply | chat | yes | Pak Hendra | keliru +4 ⚑ `janji-20` | **tepat** +12 | keliru -12 | kurang 0 | keliru -6 | -12 | none |
| 13 | `k13` Surat penawaran ganti rugi | chat reply | chat |  | Pak Hendra | kurang 0 | keliru -6 | keliru -6 | kurang 0 | **tepat** +6 | -6 | compare `dok.surat` (4 rows) |
| 14 | `k14` Nasabah tidak setuju nilainya | chat reply | chat | yes | Pak Hendra | keliru -12 | keliru -6 | **tepat** +12 | kurang 0 | keliru -6 | -12; start: -12 if `janji-20` | compare `dok.banding` (3 rows) |
| 15 | `k15` Pembayaran dan penutupan | activity `tutup` | chat |  | Pak Hendra | keliru -6 | kurang +2 | **tepat** +6 | keliru -6 | kurang 0 | -6 | document: the activity card (title + story) |

Accuracy: tepat 1, kurang 0.5, keliru 0. Option ids `alt-a` to `alt-e`; a room shuffles the order per participant. Key rounds are the script's double-weight decisions 6, 12 and 14. A session with automatic advance takes at most 14.7 minutes (every 30 s window used up) and about 9.7 minutes when everybody answers within 10 s: shared reading 8.4 to 16.5 s per round (25.2 s in round 1 with the opening), 10 s consequence, 7 s ranking. Evidence is not part of the shared reading time (a runtime rule), so in the eight dossier rounds the list or table is read inside the 30 s.

**Approximation list** (complete; the same list is in the report)

- Room text is Indonesian for every participant: the room runtime reads one fixed content language (`server/src/story/runtime/room.ts`, `LOCALE = 'id'`). The English text map is stored (480 texts) and validated, but no room shows it until the runtime gets a language choice.
- Chinese (zh) is not converted (content locales are id and en).
- Pak Hendra has no portrait: `customerCharacterId` is null (name and status word only). A built-in character is not a data + URL addition: built-in characters are drawn by client code for Bu Rina only, built-in assets have no file URL, and the chat and dossier layouts show no customer portrait at all. The default customer portrait is Bu Rina’s face, which must not stand for Pak Hendra.
- No `stage` rounds: every solo decision is either a chat reply or an activity, so rounds are `chat` (7) or `dossier` (8). Backgrounds are the built-in `telepon` (chat and phone-cue rounds) and `meja`; neither layout draws them. The Episode 2 pixel rooms, walking, the phone hand-over cutscene and the Claims Committee room are not in a room.
- Activities become one decision with five options (the script’s five alternatives). The player does not arrange documents, cards or message parts; what an arrangement would show (which tray, which lane) is reduced to the option text `titik.<id>.<alt>`, the script’s own summary of that alternative.
- In English the summary labels used as option texts of activity rounds are in the past tense ("Sent Rudi to inspect at the depot"): right for a summary, odd for an option. No room shows English today (first item); to be reworded if rooms get an English content language.
- Not a round: `ksim` (the SIM check after K09: a learning activity with no status change and no numbered decision).
- Solo bookkeeping is not mapped: the summary flags `kep:<titik>:<alt>` and the case notes (`catat`). Only a flag that a later round reads becomes a room flag: `janji-20` (left in K12, read at the start of K14: -12 and a line only its holder sees). The follow-up flag set by the protest itself is not needed (a room applies a delayed effect once by construction).
- The delayed flag has no label text: the script has only full sentences for it, and the room inserts a label into its own sentence ("<label> (babak 12) berdampak di babak ini"). Without a label the reminder reads "keputusanmu di babak 12 …"; the protest line itself names the promise.
- The opening is carried whole (3 lines), including Miss Raksa’s sentence that her advice and reasons come at the end (`buka.3`). In a room that is only half true: the recommended option is shown right after a round that was not answered correctly, and her reasons come in the final summary. Kept as written; leaving the sentence out is a script decision.
- Timeout: the solo game has no timer and no timeout text. Each round’s timeout applies the worst status change among its five alternatives, with one converter-written sentence (below).
- No lesson text per round: after a decision the room shows the option’s neutral cause sentence (as the solo game does); Miss Raksa’s reason for the round (`titik.<id>.alasan`) is the round reason of the final summary. Nothing is cut to the 220-character lesson limit.
- Endings: chosen by final status only, as in the script (`puas` happy from 70, `catatan` with_notes from 45, `kurang` unhappy fallback). Ending text = the one-line summary `akhir.<id>.ringkas`, then Pak Hendra’s and Miss Raksa’s closing words. The shared narration `akhir.bayar` is not carried (its fact is in the summary line), nor are the solo end screen’s result cards and lessons (`kartu.*`, `akhir.pelajaran.*`).
- Not carried from the solo presentation: glossary buttons ("Apa itu …?"), chat attachments such as the truck photos, expressions, the buttons’ send labels (`akt.<id>.kirim`: they name the solo gesture, e.g. "Tugaskan Mas Rudi", and would contradict options such as assessing from photos only), the per-step questions and hints of activities, chapter goals, and the location names.
- Scenario kind: `contentSource` is `demo` (the schema has only demo and settled_case, and this script is a draft, not a committee-settled case). The host picker therefore marks it DEMO and competition recaps leave its rooms out unless "sertakan DEMO" is chosen.
- **K03** Document `proses` is shown as numbered steps; the solo screen’s remark that its order is the order of explanation, not a schedule, is interface text of the solo game and is not in the room.
- **K08** The lane diagram and sign pictures of document `rambu` are not drawn: its 4 facts are the rows of a comparison.
- **K08** The activity story `akt.rambu.cerita` is not carried: its fact is already a row of the evidence document.
- **K09** Option A: the solo result variant `k09-a2` (other arrangements of the activity that map to the same alternative, same classification and status change) is flattened to the base outcome `k09-a`.
- **K11** Option B: the solo result variant `k11-b2` (other arrangements of the activity that map to the same alternative, same classification and status change) is flattened to the base outcome `k11-b`.
- **K11** Option D: the solo result variants `k11-d2`, `k11-d3` (other arrangements of the activity that map to the same alternative, same classification and status change) are flattened to the base outcome `k11-d`.
- **K11** Option E: the solo result variant `k11-e2` (other arrangements of the activity that map to the same alternative, same classification and status change) is flattened to the base outcome `k11-e`.
- **K11** The solo activity combines 2 choices; a room option is one of the script’s five alternatives, and its outcome is that of the alternative’s base combination: A = `lengkapi` + `persetujuan`; B = `sekarang` + `nanti`; C = `lengkapi` + `nanti`; D = `lengkapi` + `disetujui`; E = `hendra` + `nanti` (option texts `akt.bundel.opsi.<id>`). An outcome therefore also states the side its option text does not name, for example that no news was sent.
- **K15** Option B: 3 outcome lines shown only for certain arrangements of the solo activity (`k15-b.bukti`, `k15-b.langkah`, `k15-b.nilai`) are not carried: a room option has no arrangement.

**Text compositions** (28, each listed per option in the report; no sentence was rewritten)

- 11 outcomes hold a character's words inside the consequence text as `Name: "…"`, in script order: the words come after narration (a reply is always shown before the consequence), or the speaker is not the round's respondent (K02 A, C; K04 B, C, D, E; K05 A, E; K11 A, D; K15 A).
- 7 outcomes are only the respondent's words, so the script's neutral cause sentence is the consequence text and the option has no separate reason (K01 C; K06 C, E; K07 C, E; K14 A; K15 B).
- K11: the topic labels "Berkas" and "Kabar untuk Pak Hendra" are written as a prefix inside the one consequence text (5 options); the table values "Ada" / "Belum ada di berkas" are shown as the room's status marks.
- K13 B: the neutral cause sentence is word for word the outcome narration, so it is not shown twice.
- K12 E is a stage direction in brackets: form "action", brackets removed. K08: the prompt is the activity's last question ("Apa kesimpulanmu?"), because the instruction tells the player to mark lanes. K06: an evidence title of 41 characters (limit 40) gives its bracketed ending to the kind label.

**Checks** (my server on :4003 only, one headless browser at a time, below-normal priority, no e2e)

| Check | Result |
| --- | --- |
| `npm run test:server` | 202 / 202 (10 new: 9 in `seed.test.ts`, 1 in `room.test.ts`) |
| `npm run test:client` | 771 / 771 (762 before; 9 new: the converter tests) |
| `tools/cek-room-t028.mjs` | ALL PASS (6): the full run in Chromium in Indonesian (15 rounds to the final summary), round 1 to the ranking with the interface in English, round 1 to the ranking in WebKit; each run opens its own room from the host picker |
| Type check | server `tsc --noEmit` clean; the converter, its test and the seed checked with the client tsconfig through a temporary config (the only errors are the Node type names, unknown to that config as for every `tools/*.mts`) |

- **Server tests, new.** `server/src/story/seed.test.ts` (9, on a temp database): the seed as the server sees it (15 x 5, the script key `abcdebdcedabecc` pinned, accuracy, ids, id + en with the same keys, no error with the real categories and asset library), engine paths to the three endings and the promise costing 12 once, the checked-in seed equals a fresh conversion (the converter runs as its own process with the client tsconfig), first seed = version 1 with the seed hash and three audit rows, **reseed three times = same version, same hash, no row written in any table**, **the DEMO set (two scenarios, their versions and hashes) unchanged**, a room opens from the seeded scenario and from a DEMO scenario, a changed seed publishes version 2 on an untouched scenario and is skipped on an edited draft, a reviewer's own version, a withdrawn version and an archived scenario, a failing seed leaves nothing behind, a request cannot choose an id. `room.test.ts` (+1): the Episode 2 content through all 15 rounds in a live room with two participants and production timing: the faster correct player leads (970 against 880 points for the same right answer at 3 s and 12 s), a timeout, the promise of the 20th (the protest and the reminder reach only its maker, status 12 lower once, at round 14), totals, endings "Puas" and "Selesai dengan catatan", the summaries, and the live room equal to the shared engine.
- **Converter tests, new.** `tools/cerita/ep2-ke-skenario.test.mts` (9, in `test:client` because the converter imports client code): against the solo episode itself, per round and option, in id and en; **no text other than script text, the two converter sentences and glue (name, colon, quote marks)**; the report names every flattened variant and every dropped conditional line; the checked-in seed is the current conversion.
- The existing story integration tests start the real server, so they now run with the seed published in their temp database: all pass unchanged.

**Tool run**

Test server: the server built into `server/dist-uji`, a new test database in my scratch folder (`story:dev-setup -- --publish-demo`: the test identities, the two demos and the seed), a copy of `client/dist`, port 4003, production timing (30 s answers). The seed line of that database, start by start: dev-setup `seed sc_ep2_trailer: terbit sebagai versi 1`; first server start `sudah terbit (versi 1), tidak ada yang ditulis`; after I changed the seed's internal note and rebuilt, `isi seed berubah, terbit versi 2`; the start after that `sudah terbit (versi 2), tidak ada yang ditulis`. The last tool run played version 2.

- **Full run, Chromium, Indonesian** (host 1280 x 800, Ani 390 x 645 DPR 3, Budi 360 x 640 DPR 2, the host sets the pace). The picker lists the scenario first, with "Auto · versi 2 · tingkat 2 · DEMO (tidak masuk rekap kompetisi)" and the synopsis ending "untuk uji acara."; the room gets its code; both join and see the title in the lobby. Round 1 with real timing: "Babak 1/15", "Kabar pertama", the opening with the player's own name ("Halo, Ani!"), the five script replies on both phones (in a different order per phone, all five on screen above the send bar once the tray has settled), Ani takes the recommended one and Budi a keliru one, each sees their own consequence (Pak Hendra's reply as a chat bubble, the script narration, the cause sentence), and the ranking is the same on both phones: Ani 1 with 967 points (700 + speed), Budi 2 with 0. Rounds 2 to 15 at the host's pace: round 2 is a dossier, its evidence opens ("Permintaan dokumen", 8 rows) and Budi does not answer ("Tidak menjawab", the converter sentence, 0 points); round 11 shows the composed consequence whole on both phones; in round 14 only Budi sees the protest, with the chip "Status Pak Hendra: Cemas → Kecewa · −12" and the reminder "keputusanmu di babak 12 berdampak di babak ini: status −12"; final summaries: Ani "Puas", 15 decisions tepat, total 14.932 of 15.000; Budi "Kurang puas", total 8.439, with the note that round 14 was hit by the decision of round 12; each total equals its row in the final ranking; the host console reads "Selesai". No page error on any page; no sideways scroll on the phones in round 1 (the only place the tool measures it).
- **English run, Chromium** (a new room, round 1 to the ranking): the interface is English ("Round 1/15", "Send reply", "Current ranking") and the story is Indonesian ("Kabar pertama", the options, the status word "Cemas"): point 1 above; `hasil.json` records it as `isiCerita: "id"`.
- **WebKit run** (host and both phones in WebKit, Indonesian, round 1 to the ranking): the same checks, pass.

The tool ran five times in all. The first run (the full part only) failed on one check of mine (the timeout card of a dossier round reads "Tidak menjawab", not the chat sentence the tool looked for); the product was right and the check was corrected. I stopped one run on purpose, to move the report to a tracked folder. A WebKit screenshot of an earlier run showed "5 pilihan lagi di bawah" with two options on screen: it was taken while the tray was still scrolling itself into view; the tool now waits 1.2 s and records what is on screen (five options, no cue, in all three runs).

**Evidence:** `docs/prd-v02/EP2-ROOM-CONVERSION.md` (the conversion report) and `team/evidence/T-028/fullstack/` (28 files: 27 screenshots and `hasil.json`). The ones the brief names: `host-pemilih-skenario.png` (host picker), `babak1-pilihan-hp390-id.png` (round 1 on a phone), `babak1-konsekuensi-hp390-id.png` (consequence), `babak1-peringkat-hp390-id.png` (leaderboard), `hasil-akhir-hp390-id.png` and `hasil-akhir-hp360-id.png` (final summary, "Puas" and "Kurang puas"). Also: a dossier round with its evidence open (`babak2-*`), the timeout (`babak2-waktu-habis-hp360-id.png`), the protest of round 14 for the player who promised (`babak14-protes-hp360-id.png`), the host console, and round 1 in English and in WebKit. From the last run I opened the host picker and the round 1 options in Chromium and WebKit. In the earlier runs of the same tool on the same client build I opened: the round 1 scene, consequence and ranking at 390 wide, the lobby, the host console at the ranking, the dossier of round 2 with its evidence sheet and Budi's timeout card, both round 11 consequences, the protest of round 14, both final summaries, and the English consequence and ranking. For the Designer: the densest text is the round 11 consequence, one paragraph with two labels and a quoted reply (`babak11-konsekuensi-*.png`).

**Not verified**

- A real phone, the projector screen, more than two participants, a reconnect, the CMS pages with this scenario, `npm run test:e2e` (not run, as instructed).
- The seed on the owner's data or on Linode: it was published only into temp and scratch databases. `data/raksa-game.db` was not opened.
- The three scripts with the `[DEMO]` preference were not run.
- English content in a room cannot be seen (point 1), so the English compositions were read in the seed file only.

**State left behind.** My server on :4003 is stopped. `server/dist-uji` holds my test build of the server (ignored by git; it replaced a build from 2 Nov). `client/dist`, `client/dist-rilis`, `server/dist` and `data/` not touched; the tool served a copy of `client/dist` from my scratch folder (T-028 changes no client code).

**Files.** New: `tools/cerita/ep2-ke-skenario.mts`, `tools/cerita/ep2-ke-skenario.test.mts`, `tools/cek-room-t028.mjs`, `server/src/story/seed/ep2Trailer.ts` (generated), `server/src/story/seed/publish.ts`, `server/src/story/seed.test.ts`, `server/src/story/testing/seedEnv.ts`, `docs/prd-v02/EP2-ROOM-CONVERSION.md` (generated), `team/evidence/T-028/`. Changed: `server/src/index.ts`, `server/src/config.ts`, `server/src/story/content/scenarios.ts`, `server/src/story/cli/devSetup.ts`, `server/src/story/room.test.ts`, `server/src/story/loadtest.ts`, `server/package.json` and `package.json` (test lists), `tools/uji-hosting-harness.mjs`, `tools/uji-keyboard-room.mjs`, `docs/prd-v02/HOSTING.md`, `docs/prd-v02/CONTENT-HANDOFF.md`.

## T-027 (2026-11-17): home page on one phone screen (variant A)

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed. Board: T-027 note "built (uncommitted)".
Design: `team/DESIGN-REVIEW.md` "## T-027 — mock", D-254 to D-267 (variant A, approved by the owner 2026-11-17); Lead decision D-265 (a): Mode Cerita first at every width. Colours are T-029, next section.

**Result.** On a phone the whole home page is one screen: header, street scene, Miss Raksa's bubble, the Mode Cerita card with a Mulai as wide as the card, the code row, one note line, one footer row. The page scrolls 0 px at 390x745 and 360x640 in id / en / zh, with and without a saved profile (12 screens), and at 390x664, 390x844, 430x932, 360x700, 375x553 and 320x568. Every size I measured equals the Designer's table:

| | 390x745 | 360x640 |
| --- | --- | --- |
| street scene | 190 px | 143 px |
| Mode Cerita card | 147 px | 137 px |
| Mulai | 318 x 54 | 288 x 50 |
| code field, id / en / zh | 207.5 / 224.8 / 224 x 48 | 177.5 / 194.8 / 194 x 48 |
| Masuk, id / en / zh | 110.5 / 93.2 / 94 x 48 | the same |
| code row | 110 px | 110 px |
| footer row | 44 px | 44 px |

**What changed**

- **One order everywhere (D-265 a).** `Landing.tsx` renders the greeting, Mode Cerita, the code row (Join Game) and the note in that order, so source order, screen order and Tab order are the same at every width. No CSS `order` (the mock used it to move blocks). Tab order at 390x745: wordmark, language, sound, Mode Cerita card, "ubah", code field, Masuk, "Untuk panitia".
- **Phones (700 px wide and narrower).** The headline, "Main sendiri", the long card sentence and the Join sentence leave the screen but stay in the page for screen readers (the page keeps its `h1`; the Join sentence stays the description of the code field). The card shows the short line and the code row asks the question.
- **Two new texts** (D-258, wording accepted by the Lead as D-288), in `client/src/i18n/kamus/pemain.ts`: `pintuCeritaIsiHp` "Main sendiri. Tanpa timer." / "Play on your own. No timer." / "自己玩，没有计时。" and `joinTanya` "Punya kode room?" / "Got a room code?" / "有房间代码吗？".
- **States come from the components, not from `:has()`.** `lp-ada-profil` on the page (the line "Main sebagai … · ubah" replaces the note "Tanpa akun"), `lp-join-ada-galat` on the code row (the wrong-code message takes the place of the question, so the row stays 110 px; measured before and after: 110 / 110).
- **Street scene**: `clamp(140px, 100svh - 525px, 190px)`, 497 instead of 525 on screens lower than 700 px; the line `min(40vw, 190px)` in front of it is the fallback for a browser without `svh` (D-267). Hidden below 640 px high (portrait) and below 360 px wide, as designed.
- **Reduced motion** (D-262): at 480 px and narrower the "Animasi dimatikan" switch shares the footer row and the company name gives way. This one rule uses `:has()`; without it the switch keeps a row of its own, as before.
- The rules are one block at the end of `client/src/player.css`, all under `.lp-halaman`, so the Join Game panel on `/cerita` is not touched (the title there still reads "Join Game").

**Decided by me, not in the mock (for the Designer to look at)**

1. **Phones held sideways** (844x390, 740x360). With Mode Cerita first, the code row fell below the first screen (card ended at 308 px, code row at 495 of 390), and since D-08 a landscape phone must show Join Game without scrolling. Now the two doors stand side by side, the card on the left and the code row on the right (left to right is the source order), and the headline is off-screen as on portrait phones. Both doors end at 190 and 256 px of 390; at 740x360 at 217 and 265 of 360 (the page still scrolls 32 px there, for the footer). Screens `mendatar-*.png`. The event banner in landscape is the pill in the header (T-006), so it does not cover them.
2. **Desktop and tablets** keep today's look; only the order changed. At 1280x800 both doors are on the first screen: card 383 to 476 px, Join Game 498 to 675 px (550 to 727 with a saved profile). The 2 px orange frame and the wide Mulai are phone rules only, as in the mock.

**Checks** (my server on :4003, test database, one headless browser at a time, below-normal priority)

- `tools/cek-beranda-t027.mjs` (new): ALL PASS (37), last run on the final build with the Raksa colours. Chromium: the 12 screens above; the six other sizes; wrong code, six wide letters "WWWWWW" (field 177.5 px, not clipped) and reduced motion at 360x640; the event banner at both sizes and on a landscape phone; keyboard order; three landscape cases; 1280x800 with and without profile; 768x1024. WebKit: both target sizes with and without profile and 390x664 with profile, same numbers.
- The event banner (`RAKSA_IKLAN_ROOM`, `/api/acara-terbuka`): shown, the code field and Masuk are not covered at 390x745 and 360x640, its button fills the code and moves focus to Masuk. With the banner the page scrolls 78 px (the existing bottom margin for the banner) and at 360x640 the street scene steps aside (existing rule D-04). At 844x390 the banner is the pill in the header (10 to 64 px) and the two doors start at 78 px. The tool supplies the endpoint's answer for one open room; no real quiz room was opened.
- `tools/uji-room-cerita.mjs`, landing phase only: 40 / 40 on a start of my server without legacy mode (four screen sizes; Join Game whole on the first screen of both phones and of the landscape phone; old routes closed). Its two expectations that said "Join Game above Mode Cerita" and "title Join Game" now say the approved order; on a landscape phone "first" means left of the code row on the same line. The other phases of that tool were not run.
- `test:client` 771 / 771 (the dictionary parity test covers the two new keys); client typecheck 0 errors.

**Not verified**

- A real phone, and the on-screen keyboard over the code field (D-267): headless browsers only. The 390x664 case stands in for the iPhone with its toolbars.
- A browser without `svh`: the fallback line is there, no such browser was run.
- English and Chinese were measured (no clipped text, same heights), not read by a native speaker.

**Files.** Changed: `client/src/pages/Landing.tsx`, `client/src/components/JoinGame.tsx`, `client/src/i18n/kamus/pemain.ts`, `client/src/player.css`, `tools/uji-room-cerita.mjs`. New: `tools/cek-beranda-t027.mjs`. Evidence: `team/evidence/T-027/fullstack/` (screens + `hasil.json`).

## T-029 (2026-11-17): the Raksa palette across the game

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed. Board: T-029 note "built (uncommitted)".
Design: `character/palet-raksa-v1/PALET.md` and `team/DESIGN-REVIEW.md` D-268 to D-288 (the Lead accepted D-280 to D-288 as written).

**Result.** The game is in the colours of raksaonline.com: orange `#FF9000` for the one main button, the selected and the current thing; dark labels on it; page `#FFF9F5`, white cards, blush panels; ink `#212121` text; status colours of their own (tepat green, kurang blue-grey, keliru red). Pixel art, the street scene, characters and uniforms keep their colours. No old colour is left in any style sheet, in the source or in the build, and outside the art files none is left in the code.

**How the sweep was done**

- **Tokens** as in PALET section 3: `theme.css` `:root`, `cerita/hp/hp.css`, the token copies in `meja.css`, `lokasi.css` (`.lk`) and `projector.css`. The old names stay and mean something new (`--hijau` and `--kuning` are the orange fill), so the head of `theme.css` now says so. New tokens for the roles green carried alone: `--utama`, `--utama-tekan`, `--utama-tepi`, `--di-utama`, `--utama-teks`, `--utama-teks-tua`, `--panel`, `--pilih`, `--catatan`, `--persik`, `--garis-kuat`, and twelve status values (`--tepat`, `--tepat-teks`, `--tepat-pucat`, `--tepat-garis`, the same for `kurang` and `keliru`).
- **Mechanical, from the Designer's table.** A script reads every rule the way `alat/peta.mjs` does, asks that tool's own rule for each colour, and writes the new value at the exact place. Before writing it reproduced the Designer's three files byte for byte and checked that it sees the 1,826 colour uses in the same order. Applied: 1,599 hex uses in 25 style sheets (the table's own count), 76 `rgb()` / `rgba()` values by the same rules (not in the table), the 39 labels of list A to `var(--di-utama)`, and 35 of the 37 green-token-as-text declarations to `var(--utama-teks)` (the two left are the wordmark, which is the brand orange on purpose). Every change is a row in `team/evidence/T-029/fullstack/alat/sapuan-css.csv` (file, line, selector, property, old, new, rule).
- **By hand**: 101 edits, each with its reason in `alat/tangan.csv`. The groups are below.
- **Art from the Designer**: `token-keputusan.png` (500 B) is installed in `client/src/cerita/seni/akhir/`; the number on a kurang token is white, on an empty token dark (the shared rule in `akhir.css` is split, D-280).

**Read first: what I decided by hand**

1. **Where green or yellow meant a status, the status colour, not the brand.** A token swap would have turned "right" orange. Now tepat: `.kartu.benar`, `.chip-hijau`, `.pesan-sukses`, `.delta-naik`, the connection dot `.titik.ok`, `.bank-status-tersimpan`, `.bank-opsi-benar`, the "sama" tick of the sign summary. Kurang family: `.chip-kuning`, the "connecting" dot, `.bank-status-menyimpan`. `.delta-turun` is keliru text.
2. **Characters drawn with brand tokens are pinned to their old colours.** Raki (`art/Raki.tsx`: yellow beak, green scarf) and the old avatars (`art/Avatar.tsx`: cap, badge, disc) took their colours from `--kuning` and `--hijau`; with the swap the two-colour cap would have become one orange shape. D-276 says characters keep their colours, so the values are written into the art. The pre-JS loader in `client/index.html` holds a copy of Raki and got the same values (the guard test `pemuatPra.test.tsx` passes). If the mascot's scarf should be brand orange, that is two constants.
3. **Things the table cannot know.**
   - Chart bands of the end card are shapes, not text: white and blush (the table read `fill` as text and made both white).
   - A grey fill that carries a white mark is `#5F5F5F` (6.1 : 1), not `#A4A4A4` (2.5 : 1): `.akh-nada`, `.cer-arah`, `.cer-proses-ikon`.
   - Seven hover or open states had become the same as their normal state (two pale greens, one blush). They now change the border to `#A4A4A4`; `.slot-hapus`, which has no border, fills with `#E0E0E0`; `.kj-status.ditanyakan` uses the note tint.
   - Children that stayed white on a fill that turned orange (list B and beyond): the link in `.hp-tutorial`, the title and the tabs of the question bank editor, the number on the field markers `.sr-penanda`, the selected hotspot in `Interaction.tsx`. In the editor's orange bar the selected tab is ink with a white label, and the level bars inside a selected button are ink.
   - Two text colours written as `var(--hp-hijau, …)` with a fallback were not in the Designer's list (it looks for the plain form): now `--utama-teks`.
4. **Focus rings.** The interface ring is ink (`--fokus`). Six green rings would have become orange (2.1 : 1 on the page), four by the table and two through the tokens: the Episode 2 screens (`hp.css` line 15, as PALET says), `.hp-tempat`, `.lk` buttons, the end card's `summary`, the skip button on the stage, the table prototype. All ink now. The ring on the question bank's orange bar is ink too, and on the dark old projector it is white. Blue rings inside pixel-art activities stay (D-286).
5. **The home page follows the mock, with one addition.** Mulai: face `#FF9000`, label `#212121`, border and extrusion `#B25C00`; Masuk: `#212121`, white label, border and extrusion `#000000`; "GAME" in the wordmark is ink. Addition: the code row has a 1 px edge `#ECD5CB`. It is in the approved mock picture (I sampled it) and not in PALET.md; blush on the page is only 1.07 : 1, so the edge is what makes the panel read. It is drawn inside the panel, so no size changed. Designer: confirm or name the colour.
6. **Colours in `.ts` and `.tsx`** (not in the table). Interface, swept by the same rules: the old projector's inline styles, QR code, confetti, the "misi selesai" stamp, rating stars, stage labels, the loading bar, the old mission engine's pills, verdict tags and panel, and the constants of the K11 table prototype (not in a normal build, not rendered). Art, left alone: everything under `art/`, `cerita/seni/`, `game/art/`, `game/scenes/`, the stage props, the road diagram `BuktiLajur.tsx`, the incident diagram of `ProtoKejadian.tsx`. The list with a reason per entry is the allowlist in the tool.
7. **Small ones.** The urgent timer number was yellow written inline (1.6 : 1 on the old cream); it is a class now, keliru red on light pages and orange on the dark projector. `theme-color` in `index.html` is `#FF9000`. The empty rating star's outline is `#818181`, the grey the table's rule gives, because it must stay 3 : 1.

**For the Lead and the Designer to decide or look at**

- **Staff pages** (host, CMS, admin) have blush as the page ground with white cards: that is the table's row for the `.stf` ground. And every `.btn` is orange, so a staff page can show more than one orange thing (host console: the active tab and the main button are orange, "Tutup room" red, the rest blush; the host's room list has "Buka room" and one "Kendalikan" per running room in orange; see `08-host-*.png`, `15-host-babak1-*.png`).
- **The old quiz projector** (`.proyektor` in `theme.css`, `pages/Projector.tsx`) has the plain ink ground the Designer proposed. It was not rendered: it needs a room of the old quiz. The story projector (`/projector?room=`) is a light page and is in the screens.
- **A disabled main button** keeps the orange-brown edge around its grey fill (it kept the green edge before). `05-ksim-390x745.png`, bottom bar.
- **Input fields** (`.kolom`) have the `#E0E0E0` line: that is the table's row for their old border. PALET section 1 names `#A4A4A4` for field borders, and only the home code field has it (decided by hand in the mock). One line per sheet if the stronger edge is wanted everywhere (`10-join-*.png`, `12-cms-masuk-*.png`).
- **Two pairs of states share a colour now**, as D-285 says they would: "dikoreksi" and "sebagian" icons (both `#3E7285`), and the pending and check marks on the projector's dossier (both `#2C5A6B`). They differ by icon and word only.
- **Not touched**: `client/public/favicon.svg` (old green and yellow, an icon to redraw) and `shared/brand.ts` (`BRAND.colors` holds the old values; nothing reads them).

**The tool** `tools/cek-palet-t029.mjs` (+ `cek-palet-t029.data.json`)

- **A. Old colours.** The list is the seven brand colours of the task, the old colours PALET.md names (75), and the other old colours of the Designer's table whose every use changed (307): 389 in all. It looks for `#rrggbb(aa)`, `#rgb`, `0xrrggbb` and `rgb()` / `rgba()`. Source: none allowed in a style sheet; in `.ts` / `.tsx` only in art files (allowlist with reasons); in `index.html` only inside the pre-JS copy of Raki. Build: none in CSS outside a `url(data:…)`; in JS every hit must be a colour that an art source file really contains.
- **B. Tokens.** 30 token values read from the built CSS, and 21 contrast pairs, among them the focus ring on the page, on blush, on white and on the selected tint.
- **C. Screens.** 35 pictures: the 12 key screens at 390x745 and 1280 (home, picker, K01 chat, K02 dossier activity, K-SIM, committee room, end card, host, projector, join, lobby, CMS sign-in), plus the K01 reply sheet (numbered options, D-284), the host picker, round 1 of a room on phone, projector and host, and `/solo`. On each it reads the computed styles: no light text on an orange fill, no orange text on a light ground (the wordmark excepted), and on the home page the focus ring at each Tab stop against its ground. Text under 4.5 : 1 is listed, not failed.
- It checks itself first: a page with three planted faults must be reported, or a clean result would mean nothing. And run against the older build in `client/dist` the scan fails as it should (1,577 hits in the CSS, the green tokens, the theme colour).
- The screen part opens a room, so it needs a test server and refuses ports 4000 to 4002.

**Checks** (my server on :4003 with a test database, one headless browser at a time, below-normal priority, no e2e)

All on the final build; no source file changed after it.

| Check | Result |
| --- | --- |
| `test:client` | 771 / 771. Client typecheck (`tsc --noEmit`): 0 errors |
| `tools/cek-palet-t029.mjs` (cek-palet) | ALL PASS (45). Source: 0 old colours in the style sheets, 0 in code outside art (art: 20 files, 85 uses, 33 colours), 0 in `index.html` outside Raki. Build: 13 CSS files 0 hits, 64 JS files 0 unexplained and 80 that are art, `index.html` 0. 30 token values right. 21 contrast pairs at or above their floor (focus ring 15.4 on the page, 14.1 on blush, 16.1 on white; label on orange 7.09; orange text 5.28 to 6.01; white on the status fills 4.98 to 5.32). 35 screens: no light text on orange, no orange text on a light ground, and no text it could measure under 4.5 : 1 (text that lies on a picture is not measured); focus ring 14.1 to 16.1 at the eight Tab stops of the home page |
| `tools/cek-beranda-t027.mjs` | ALL PASS (37), Chromium and WebKit |
| `tools/cek-layar-t018.mjs` (cek-layar) | ALL PASS (148), Chromium and WebKit |
| `tools/cek-akhir-t019.mjs` (cek-akhir) | ALL PASS (105) |
| `tools/cek-gulir-t018.mjs --tanpa-tahap2` (cek-gulir) | ALL PASS (150): the chat family. Its scene, activity and end-card families are the cek-layar run above, so I did not run those twice |
| `tools/cek-bahasa-t014.mjs` (cek-bahasa) | ALL PASS (138) |
| `tools/cek-tag-t026.mjs` | ALL PASS (18) after I changed the two tag colours it expects: KASUS NYATA is orange with ink letters (7.09 : 1), DEMO blush with grey letters (5.61 : 1) |
| `tools/uji-room-cerita.mjs landing` | 40 / 40 (see T-027) |

Bundle against the build of 17:44 in `client/dist`: CSS 1.07 KB smaller gzipped, JS 78 B larger.

**Evidence:** `team/evidence/T-029/fullstack/`: 35 screens, `hasil.json`, and `alat/` (the two logs and the scripts that made the changes). `hasil.json` is the full run of 45 checks; a later scan-only run of mine overwrote it, so I rebuilt it from that full run's own output, and the tool now writes partial runs to `hasil-sebagian.json`.

**Not verified**

- Not rendered: the activities other than K02 and K-SIM, phone calls, the location scene, the old quiz beyond its `/solo` map (a mission itself, its projector, the question bank editor), the pages of CMS and admin behind the sign-in, the K11 table prototype, the incident prototype. For those the evidence is the table, the scan, and a comparison of every rule that sets both a ground and a text colour: 278 such rules, none under 4.5 : 1 after the sweep.
- Hover and pressed states were read in the CSS, not seen.
- No real phone; Chromium for the palette screens (the home page also in WebKit).

**State left behind.** My server on :4003 is stopped and no browser of mine is running. It used the test database in my scratch folder (the palette tool opened two rooms there). Client builds went to my scratch folder; `client/dist`, `client/dist-rilis` and `server/dist` are untouched, so the owner's server on :4000 still shows the old colours until the client is built there. The check tools write into their own evidence folders, as always: the pictures in `team/evidence/T-014`, `T-018/stage1b` and `stage2`, `T-019/fix`, `T-020/fullstack`, `T-022/fix`, `T-024/fullstack`, `T-025/fullstack` and `T-026` were replaced by today's runs and now show the new colours. `character/` was only read (the Designer's `peta.mjs` was run as a copy in my scratch folder, so their three lists are as they delivered them).

**Files.** Changed: 25 style sheets under `client/src` (all except `seni.css` and `font.css`), `client/index.html`, `client/src/cerita/seni/akhir/token-keputusan.png`, `client/src/art/Raki.tsx`, `art/Avatar.tsx`, `ui/kit.tsx`, `pages/Projector.tsx`, `pages/soloBagian.tsx`, `unity/UnityStage.tsx`, `game/GameStage.tsx`, `game/engine/MissionScene.ts`, `game/engine/stage.ts`, `components/MissionStage.tsx`, `interactions/Interaction.tsx`, `cerita/lokasi/seni/Aset.tsx`, `cerita/hp/meja/MejaScene.ts`, `tools/cek-tag-t026.mjs` (the tag colours it expects). New: `tools/cek-palet-t029.mjs`, `tools/cek-palet-t029.data.json`.

## T-029 Fix 1 (2026-11-17): Designer review D-289 to D-298

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed (on top of 5c5200c). Board: note under "Shipped 2026-11-17".
Review: `team/DESIGN-REVIEW.md` "## T-027/T-029 — review (2026-11-17)", PASS with no blocker. Every item, in its order:

| Item | What I did |
| --- | --- |
| D-289 disabled main button | **One look everywhere**: fill `#E0E0E0`, label `#5F5F5F` (4.84 : 1), edge the same as the fill, no extrusion, not transparent. It is the rule of `.primary-action:disabled` (`player.css`), of every `.btn` variant (`theme.css`) and of the location scene's main button; the two rules that only made the send bar and the table prototype half transparent are gone. On the dark old projector: fill `#424242`, label `#A4A4A4`. Checked on screens: K-SIM on a phone (the brown edge is gone) and at 1280 (was pale orange), CMS sign-in, and the old projector page without a room (`17-proyektor-lama-*.png`: fill `#424242`, label `#A4A4A4`). The palette tool now checks this look on every screen it opens: six disabled buttons on this run's screens, all right |
| | Left as it was, on purpose: "Kamu siap" in the lobby of the old quiz (`.lobby-focus`). It is a finished state, not a button that cannot be used yet: blush with an ink label. Say if it should take the grey look too. Other disabled controls (option cards, icon buttons, the pause button of `/solo`, the end card's arrows) keep their faded look: D-289 is about the main button |
| D-290 Mulai and Masuk on wide screens | From 701 px wide Mulai is as tall as Masuk: 129.4 x 57 against 126.5 x 57 at 1280 x 800 and 768 x 1024 (was 98 x 43), label 17 px, the same 4 px extrusion. Phones are unchanged (318 x 54 and 288 x 50) |
| | **Landscape phones changed more than the review asked.** In those narrow columns a button of that size beside the text squeezed the card sentence into 4 to 9 lines (card 131 px at 844 x 390, 235 px at 740 x 360). So there Mulai sits under the text and is as wide as the text column (280 x 57; 228 x 57 at 740 x 360), and the card shows the short line of the portrait phones ("Main sendiri. Tanpa timer."). 844 x 390 still scrolls 0 px with and without a profile; 740 x 360 scrolls 27 px (was 32). Screens `mendatar-*.png` in `team/evidence/T-027/fullstack/` |
| D-291 keliru cap | border `#B3261E`, its text colour |
| D-292 "Yang seharusnya" | kurang family: text and ring `#2C5A6B` on white, on the page (`.tanda-terlewat`) and on the canvas (the tag of a missed object in the old mission engine, which I had made green in T-029; the two are meant to be the same mark) |
| D-293 weak greys | `#5F5F5F` for the five named: `.alur-catatan`, `.cer-bab-sela`, `.practice-list button > span`, `.hp-saksi-kartu.ditandai-rencana`, `.cms-hitung`. I searched the style sheets for every grey text under 4.5 : 1 on white: three more exist and stay, as the review allows: the placeholder of the code field (`#BDBDBD`), the disabled label of the end-card arrows (`#909090`) and the "+" of an empty slot (`#929292`, a sign, 3.1 : 1) |
| D-294 polish | (1) the accent word of the big headline is `#B25C00`. (2) The instruction sentence of an activity is ink (four rules: the tray line in both layouts, the line above the board, the strip line of the inspection plan). The bold lead of the K10 line (`.bd-instruksi b`) is a label and keeps the orange text colour |
| D-295 | nothing, as the review says |
| D-296 favicon | `client/public/favicon.svg` is the Designer's `favicon-proposed.svg`, byte for byte. There are no PNG or ICO variants: `client/public` holds only this file besides `audio/` and `karakter/`, and `index.html` links only it |
| D-297 `shared/brand.ts` | `BRAND.colors` holds the new values (`kuning` and `hijau` `#FF9000`, `krem` `#FFF9F5`, `tinta` `#212121`, `hijauMuda` `#2F7D57`, `merah` `#D32F2F`, `biru` `#3E7285`, `cokelat` as it was) and its comment names PALET.md as the source. Uniform, skin and hair colours are untouched |
| D-298 | the code row's edge is a token now: `--panel-tepi: #ECD5CB` |

**For the Lead.** `BRAND.assetNote` in the same file still says that the official logo and colours are not yet verified from raksaonline.com. It is shown on the old host page in three languages (`kamus/host.ts`, `catatanAset`). The colours now are the site's, so the sentence is half out of date; I did not change wording.

**Tools.**
- `tools/cek-palet-t029.mjs`: a check of the disabled look on every screen it opens (it plants one wrong button in its self-test and must find it); the favicon is scanned in the source and in the build (run against the shipped build of 22:31 it fails on the old favicon's four colours and on the missing token, as it should); `--panel-tepi` joins the token values (31); the old projector page without a room is a screen, for the dark variant of D-289. Pages that scroll are no longer captured with the browser's full-page mode: that mode replays the entrance animations, and the home page at 1280 was caught with a half-faded street scene; the tool now makes the window as tall as the page, waits for the animations to end and captures that.
- `tools/cek-beranda-t027.mjs`: on wide screens and on landscape phones Mulai must not be shorter than Masuk.

**Build gate** (my server on :4003 with a test database, one headless browser at a time, below-normal priority)

| Check | Result |
| --- | --- |
| typecheck (server and client) | 0 errors |
| `test:client` | 771 / 771 |
| cek-palet | ALL PASS (49), run against `client/dist` after the rebuild: 0 old colours in source and build (favicon included), 31 token values, 21 contrast pairs, 37 screens with the disabled-look check |
| cek-beranda | ALL PASS (37), Chromium and WebKit |
| cek-akhir | ALL PASS (105) |

All five on the final tree; nothing in `client/`, `shared/` or `server/` changed after them.

**`client/dist` rebuilt.** When this task started, `client/dist` already held the shipped build of 5c5200c (22:31, the same bundle as `client/dist-rilis`, palette included), so the brief's "first rebuild" had been done by the deploy. At the end I built the working tree into my scratch folder (22:52), ran the checks above on that build, and copied it into `client/dist`: 146 files, the old bundle removed first, `diff -r` against the checked build identical. The previous `client/dist` is kept in my scratch folder. Neither running server serves `client/dist`: the owner's :4000 and QA's :4001 both still served the 22:31 bundle after the copy. `client/dist-rilis` and `server/dist` not touched.

**Not verified.** The old quiz inside a room (its lobby with "Kamu siap", a mission with the "Yang seharusnya" tag on the canvas, the projector with a room): the rules were changed and read, the screens were not opened. Hover and pressed states. A real phone.

**State left behind.** My server on :4003 is stopped and no browser of mine is running; the test database in my scratch folder holds a few more test rooms. QA's server on :4001 (PID 54684, started 22:20, not mine) was still running when I finished; I did not touch it.

**Files.** Changed: `client/src/player.css`, `theme.css`, `cerita/hp/hp.css`, `cerita/hp/desain.css`, `cerita/hp/meja/meja.css`, `cerita/lokasi/lokasi.css`, `cerita/seni/aktivitas/piksel.css`, `cerita/ui/akhir.css`, `cerita/ui/cerita.css`, `pages/cms/cms.css`, `game/stage.css`, `game/engine/MissionScene.ts`, `client/public/favicon.svg`, `shared/brand.ts`, `tools/cek-palet-t029.mjs`, `tools/cek-beranda-t027.mjs`. Log of the 27 edits with reasons: `team/evidence/T-029/fullstack/alat/perbaikan1.csv`.

## T-030/T-031 (2026-11-18): pixel-key buttons, pixel cards, pixel grounds

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed (T-029 Fix 1 still in the tree). Spec `team/specs/2026-11-17-T-030-T-031-gaya-game.md`; Designer rules `team/evidence/T-030/designer/mock-rules-T-030.css` and `-T-031.css`; owner flags 1 and 2 on the K4 task card (18 Nov 00:10 and 00:2x) applied.

**How.** One new sheet, `client/src/gaya-game.css`, imported last in `main.tsx`. It is the Designer's two rule files copied as measured, made from a script (`team/evidence/T-030/fullstack/alat/buat-gaya.cjs`), plus the owner's rules. The drawing properties (background, border-color, border-radius, box-shadow, color) carry `!important`, because the part sheets (hp, desain, akhir, staff) load later and some old rules are more specific; states change only through the variables (`--k-*` keys, `--c-*` cards). No component changed.

- **Buttons (T-030):** pixel key on `.primary-action`, every `.btn`, the home Mulai, end-card buttons, reply rows, location buttons, staff active tab; secondary (ink outline) on `.btn-garis`, `.btn-netral`, `.akh-kedua`, Masuk on home, and the classes the Designer listed as "same rule". Disabled = the D-289 grey in the key shape (dark variant on the old projector). Round icon buttons keep the circle with a 2 px base. Reduced motion: no pressed transition.
- **Cards (T-031):** K1 on home doors, code row, picker cards, staff cards, reply sheet; light K1 on chat bubbles, the home bubble, notes and the glossary chip; K4 with the hanging tab on the task card (TUGAS), the result (Tindakanmu) and the Pelajaran.
- **Grounds:** sky (ground 8) on home and picker, tile (ground 6) on the story shell (activities and end card inside it) and staff pages; CSS gradients only.
- **Owner flags:** K4 inner padding 14 px; tab centred on the top line (`top: 1.5px; translateY(-50%)`), left 12 px; no corner squares on the task card, 2 px L-brackets on HASIL / PELAJARAN; 21 px above the card (10 px clear of the text above the tab); K1 cards 14 px side padding, reply sheet 14 px; no rounded corners left in the story shell, end card, home and picker except icon circles, avatars and portraits; the stage frame is stepped (clip-path, 2 px orange line drawn inside); the desktop Pelajaran tab shows the word only (the mentor portrait made it 42 px tall).

**Mine, for the Designer:**
1. Disabled buttons do not sink 2 px (the mock had them "already down"): the send button would move 2 px when it turns on, which breaks the no-jump rule of the reply sheet (D-128).
2. Reply rows lose 4 px inner padding per side and 2 px of number gap, so their text width equals before; with the 14 px sheet inset alone the English K13 / K14 lists needed a scroll at 390x645.
3. The wrong-code message on the phone home uses 15 px lines, so two lines stay 30 px and the code row stays 110 px.
4. `#ECD5CB` (D-298 code-row edge) is allowed by the tool next to the four new tones; it is not in PALET.md yet.
5. The stage frame and pills are stepped; other framed boxes inside the story shell are square (0 radius), not stepped.

**Checks** (my server :4003, test database, one headless browser, below-normal priority), final build:

| Check | Result |
| --- | --- |
| typecheck / `test:client` | 0 errors / 771 of 771 |
| `cek-palet-t029` (extended) | ALL PASS (50): 37 screens; 76 key buttons with the pixel-key signature, 36 cards, 84 frames measured for padding, button inset and tab; no rounded corner > 2 px in the shells; grounds present; no hex outside PALET.md in `gaya-game.css` |
| `cek-tugas-t030` (new) | ALL PASS (9): task cards K02, K04, K05, K07, K08, K09, K10, K11, K-SIM at 390x745: padding 14+, tab on the line, Mulai inset 14+, 10 px clear above, 0 px scroll; `tugas-*.png` |
| `cek-beranda` | ALL PASS (37) |
| `cek-akhir` | ALL PASS (105) |
| `cek-layar` end family / K11 / K-SIM | 18 / 18 / 6, all pass |
| `cek-gulir --tanpa-tahap2` (reply sheet and chat) | ALL PASS (150) |

Screens: `team/evidence/T-030/fullstack/` (37 pictures of the key screens at 390x745 and 1280, `tugas-*.png`, `hasil-cek-palet.json`, `tugas-hasil.json`). Not verified: real phone, hover / pressed states seen, WebKit for the new palette screens, `client/dist` not rebuilt (scratch build only).

## T-033 (2026-11-18): guided steps, pixel pointer and per-step hint in every activity

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed (T-029 Fix 1 and T-030/T-031 still in the tree). Concept `team/DESIGN-REVIEW.md` "## T-033 — concept" D-306..D-311; owner 18 Nov 00:16 (K08: nothing says to tap the signs first).

**Built.** One component, `client/src/cerita/hp/arena/Pandu.tsx` (+ `pandu.css` = the Designer's rules + build notes), mounted once by `Arena.tsx` for K02, K04, K05, K07, K08, K09, K10, K11 and K-SIM in the picture view. No activity pattern was changed: the component reads the current step from the arena's DOM (K08 `data-tahap`; K11 `data-langkah` periksa / tindakan / kabar; K-SIM `data-langkah` meja / middle / akhir; others: nothing filled = step 1, send enabled = step 3, otherwise step 2).
- Step strip `ol.lgk-langkah` (aria-current="step", done = tick with the word kept for screen readers) and hint `p.lgk-petunjuk` (aria-live polite) in the instruction slot; the old instruction line is hidden while the strip shows (K-SIM keeps its own line: it is already per step, and the hint is read only).
- Pixel pointer + blinking ring on the next tap target (the target is an existing focusable button, so keyboard reaches it as before); 2-frame bounce, static under reduced motion, 2 px cream outline (D-307). K08: points at the sign to read; the lane step has no pointer (that would give the answer away).
- Coach card "Cara main" once per device for K05, K10 and K-SIM (`raksa:pelatih:<k>`, try/catch), "Mengerti" closes it.
- The send bar keeps its own disabled state and reason (unchanged per pattern).
- Texts: new dictionary `client/src/i18n/kamus/langkah.ts` (id / en / zh): K08 exactly as D-310; the others from D-311, adjusted to what each screen really asks (K04 places on the map, K11 its three existing stages, K-SIM check / match / result).

**Decided by me (Designer to look at).**
1. **Short phones (height < 700 px: 360x640, 390x645): the strip and hint do not show; only the pointer, the ring, the coach card and the spoken hint.** The strip was measured by the Designer for K08 only; on short screens it made the activity content overflow by 3 to 59 px (cek-layar). On 390x745 and taller the strip and hint show.
2. Narrow screens (≤ 400 px wide): steps other than the current one show the number / tick only (the English words clipped).
3. K11 already has its own step tabs; the strip repeats them in words.

**Checks** (my server :4003, test database, one headless browser, below-normal priority), final build:

| Check | Result |
| --- | --- |
| typecheck / `test:client` | 0 errors / 771 of 771 |
| `cek-layar --keluarga aktivitas` | ALL PASS (54), Chromium + WebKit |
| `cek-bahasa` | ALL PASS (138) |
| `cek-langkah-t033` (new) | ALL PASS (54): 9 activities x 390x745 / 360x640 x id / en / zh: strip text = dictionary, one current step, hint = step key and aria-live, pointer on a focusable target inside the screen, coach card only on K05 / K10 / K-SIM and gone after "Mengerti" + reload, 0 px page scroll; one tap on the target moves K08 to step 2 ("Ketuk lajur") |
| `cek-tugas-t030`, `cek-palet` | 9 and 56, all pass |

Screens: `team/evidence/T-033/fullstack/` (64: each activity per step and size and language, after-tap, coach). Not verified: a real phone, a screen reader, the list view (no guided steps there).

## T-030/T-031 Fix 1 (2026-11-18): Designer D-317 / D-318, story room and old quiz

Same tree, not committed. `client/src/gaya-game.css` (generator `team/evidence/T-030/fullstack/alat/buat-gaya.cjs`, rules `fix1.css`): no rounded corners left in the story room, host, staff, projector and old quiz (`.player-ui`, `.stf`, `.sr-layar`, `.proyektor`), except icon circles, avatars, portraits, markers and form checkboxes; K1 stepped frames on `.panel`, `.sr-kartu`, `.sr-pembuka`, `.sr-chat`, `.sr-meja` (blush ones with the `#ECD5CB` edge, 14 px padding); ground 6 behind the story room (`.sr-halaman`, `.sr-layar`); the old projector's panels in palette greys. `#ECD5CB` added to `character/palet-raksa-v1/PALET.md`. `cek-palet` now checks corners on those screens too and opens a room through round 1 to the consequence and the leaderboard (screens 18 and 19): ALL PASS (56). Not covered: a match of the old quiz (needs a legacy room), status-coloured story cards (they keep their own fills with square corners).

## T-034 (2026-11-18): K15 "Pesan penutupan" as a pixel message composer

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed (earlier uncommitted work kept). Concept + art `team/DESIGN-REVIEW.md` "## T-034 — concept + art" D-312..D-316.

**Built.** `client/src/cerita/hp/arena/ArenaPesan.tsx` + new `pesan.css` (the Designer's rules, icon paths adjusted); the six icons copied to `client/src/cerita/seni/aktivitas/penutup/`.
- Draft preview at the top: Pak Hendra's pixel phone bubble, fills with the chosen parts in part order, 3 lines (2 on short screens) then "…"; the whole bubble is one button with `aria-expanded` that opens / closes it. Its sentences are plain text now (a part leaves the message from its chip).
- Six parts as pixel chips in two columns with their icons; chosen = orange chip with a tick, not chosen = outline with "+"; `aria-pressed`, Enter / Space toggle, 60–64 px high.
- Gone: the "preview" jump link, the parts title, the "draft not sent" note. The picture / list switch is not under the activity any more but in the story Menu (new item, shown while an activity is open; it works for every activity).
- Scoring, texts and the chosen set: unchanged (same `alihBagian` / `bagianDiPesan`).

**Checks** (my server :4003, test database): `tools/cek-k15-t034.mjs` (new) ALL PASS (12): 390x745 and 360x640 x id / en / zh x 0 and 4 parts: 0 px page scroll and 0 px inner scroll, 6 chips in 2 columns with icons, ≥ 44 px, preview on top in part order, opens and closes, helper lines gone, switch in the Menu, send bar off / on. `cek-layar` has a new case `arena-k15` (state "surat" moved to node k15; no K15 state is saved yet): pass in Chromium (4 sizes) and WebKit (2). Screens `team/evidence/T-034/fullstack/`.

## T-033 Fix 1 (2026-11-18): Designer D-322..D-329, step logic

- **D-322** K08 step 1 ends only after both signs are read; **D-323** in the marking stage the pointer goes to the first lane until one is marked, then to the "next" button. The test walks it: sign 1 → lane → next → sign 2 → step 2.
- **D-324** K02 points at the document on the desk (hint "Baca dokumen di meja, lalu ketuk bakinya"); K05 hint now names the destination ("Ketuk tempat tujuan…").
- **D-325** the pointer never stays on what was just tapped (taps are remembered); K10: after a row, the pointer goes to the stamps; K-SIM: after an object, to the control that appeared.
- **D-326** K11: no strip (its own stage tabs are the steps); pointer on the files / choices, never on a tab.
- **D-327** short phones: the compact strip (24 px, numbers only, hint in one line) is used where it fits: **K05 and K11 only**. Measured with cek-layar: in K08 the content overflowed by 28–46 px (sign card + legend), in K10 by 5 px and in K-SIM by 6 px, so those keep the pointer + spoken hint fallback, like K02, K04, K07, K09. Designer: decide whether something else on those screens may give way.
- **D-328** a target at the top edge of the picture gets the arrow from the right, inside the picture.
- **D-329** the old quiz's guide bubble, question-pack buttons, info messages and the connection pill are square.
- `cek-langkah-t033` now asserts the step-1 pointer target of every activity, the both-signs rule, that the pointer leaves a tapped control, K11 without strip, and the compact strip where it applies.

**Gate** (final build): typecheck 0, `test:client` 771 / 771, `cek-layar --keluarga aktivitas` ALL PASS (60, incl. K15), `cek-bahasa` 138, `cek-langkah-t033` 54, `cek-k15-t034` 12, `cek-palet` 56, `cek-tugas` 9. Not verified: a real phone, a screen reader.

## T-033 Fix 2 + T-034 check (2026-11-18): Designer D-331..D-333

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed.
- **D-333** K02: after the document on the desk is tapped, the pointer moves to a tray; after a tray, back to the (next) document. The pointer listener now also records taps on the document picture.
- **D-332** K08: the hint follows the pointer (marking a lane = "Sekarang ketuk lajur yang dilarang" also during sign 1); the conclusion sheet gets the pointer on its first conclusion and hint 3, then the send button once one is chosen.
- **D-331** K15: checked with real touch taps (`page.tap`, touch-enabled phone viewport): a chosen part taken out after the preview was opened and closed, and while it is open, registers in all 6 size and language runs. Nothing to fix.
- Tools: `cek-langkah-t033` asserts K02 tray after the document, the K08 lane hint and the conclusion pointer; `cek-k15-t034` the two touch un-taps.
- Gate (final build): typecheck 0, `test:client` 771 / 771, `cek-langkah-t033` 54, `cek-k15-t034` 12, `cek-layar --keluarga aktivitas` 60.
- `client/dist` rebuilt = an exact copy of the checked scratch build (146 files, `diff -r` identical; previous copy kept in my scratch folder). Neither :4000 (dist-rilis) nor QA's :4001 serves `client/dist`; both unchanged after the copy.

## T-035 (2026-11-18): HOTFIX from the owner's phone

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed.
1. **Result card tab** ("Tindakanmu"): it was positioned against the inner action line and covered the first text line. The tab is now drawn by the card (`.hp-vn-dialog[data-tab]::before`) and centred on the card's top frame line; the card has 26 px top padding (11 px half-tab + 14 px). The same 26 px applies to TUGAS and PELAJARAN. The original label stays for screen readers, and the stray ": " after it is hidden.
2. **Inner panels:** "Kenapa" plus the status panel (`.hp-status-catatan`) get 14 px padding, and the action quote gets 14 px left padding.
3. **Pandu:** the pointer and its ring appear in K08 only (`cariSasaran` returns null elsewhere). The strip, hint and coach card are kept. K04 no longer points at the answer.
4. **Mandarin** (coordinator item 4): `PilihBahasa` always offers id/en/zh. `main.tsx` no longer switches zh back to id when legacy mode is off. The comment in `terjemahan.test.ts` is updated. New `server/src/bahasa.config.test.ts` (added to the server test script) boots with RAKSA_LEGACY=off and asserts `features.legacy=false` plus the three languages; it passes. The hosted story room does not use this picker and still has no zh, per T-028 rev 1.1.
- **Tools:**
  - `cek-tugas-t030` now walks every saved state, pressing Lanjut until a result card shows, at 390x745 and 360x640 in id/en/zh. It asserts that no text intersects the tab, that the tab sits on the top line, and that inner-panel text is at least 14 px from the left line.
  - `cek-langkah-t033` asserts there is no pointer outside K08.
- **Gate** (final build): typecheck 0, `test:client` 771, `cek-tugas` 141, `cek-langkah` 54, `cek-layar` adegan 76 and aktivitas 60, `cek-palet` 56. `client/dist` is an exact copy of that build.
- **Screens** are in `team/evidence/T-035/`: result cards plus each activity without a pointer.

## T-036 (2026-11-18): AUDIO: quieter, cozier story music; phone-style chat ping; satisfying document SFX

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed. Everything is still synthesized in the project. There are no downloads or samples, and no melody is quoted from any song.

**Music** (`tools/make-music-ep2.mjs`, which is where the story tracks have always been made; `make-music.mjs` makes lobby, gameplay and podium, untouched):
- The tracks are a new pastoral town theme: major key, soft square or triangle lead with delayed vibrato, marimba-like plucks, gentle sine bass and a light hat. The original melody is generated from chord tones by the seeded PRNG.
- Each track is a seamless loop whose length is a whole number of bars, with the reverb tail wrapped to the start.

| File | Before | After |
| --- | --- | --- |
| `cerita-kantor` | 96 s, 80 BPM, peak -4.6, RMS -19.4 | "Pagi di Loket", 130.9 s, 88 BPM, 48 bars, F major, peak -8.6, RMS -21.4 |
| `cerita-periksa` | 91.5 s, 84 BPM, peak -4.9, RMS -18.3 | "Jalan Desa", 146.1 s, 92 BPM, 56 bars, C major, peak -9.0, RMS -21.4 |
| `cerita-penutup` | 109.7 s, 70 BPM, peak -5.2, RMS -16.9 | "Senja di Kantor", 137.1 s, 84 BPM, 48 bars, G major, peak -8.6, RMS -22.4 |

All values are in dBFS as decoded by Chrome. The loop seam is under 0.002, and level changes between sections stay within 2.2 dB. The files are mono 80 kbps (1.3-1.4 MB), under the 1.6 MB limit that `test:client` enforces.

**Mix** (`client/src/audio/audio.ts`):
- `GAIN_CERITA` goes from 0.55 to 0.28, on top of the quieter files.
- Story music at the default volume: about -23.5 dB effective RMS before, -32.5 after (about 9 dB quieter relative to SFX).
- Ambience `GAIN_SUASANA` is multiplied by 0.4 (-8 dB).
- Music on the phone stays off by default.
- No cache key existed, so I added `?v=t036` to the three story URLs and updated the test helper.

**SFX** (Web Audio synthesis in `audio.ts`). The names are unchanged, so the existing wiring plays the new sounds: K02 tray = `taruh`, berkas opened = `kertas`, chat = `pesanTerima` and `pesanKirim`. Measured offline at the default SFX volume:

| SFX | Before | After |
| --- | --- | --- |
| `kertas` (berkas dibuka): paper slide (band sweep) + soft pop + small bright tail | 0.11 s, peak -28.0, RMS -40.4 | 0.31 s, peak -14.6, RMS -32.9 |
| `taruh` (dokumen ke baki): paper flutter + wooden tick + tiny chime | 0.07 s, peak -22.8, RMS -35.3 | 0.40 s, peak -14.3, RMS -36.4 |
| `pesanTerima`: three ascending bell/marimba notes | 0.20 s, peak -25.5, RMS -38.3 | 0.57 s, peak -18.1, RMS -32.1 |
| `pesanKirim`: single short tick | 0.12 s, peak -24.1, RMS -37.6 | 0.06 s, peak -20.3, RMS -34.9 |

**Tools:**
- `tools/cek-audio-t036.mjs` (new): renders the four SFX offline through a test-only hook, which loads only when the URL has `?uji-audio`. It recomputes the old recipes to give the before numbers, and decodes the tracks. Result: ALL PASS.
- `check:audio` (`tools/audio-check.mjs`) now covers the story tracks too, and accepts `AUDIO_BASE`. Story tracks must be 120-190 s with RMS between -30 and -20 dB.
- The loop-edge rule is 12 dB: the 50 ms after the downbeat versus the 50 ms of decay before it differ by about 9 dB naturally; the old gameplay track also differs by 9 dB.

**Gate:**
- typecheck 0, `test:client` 771 / 771.
- `check:audio` passes against my :4003 server. By default it reads :4000, which still serves dist-rilis with the old files.
- `cek-audio-t036` ALL PASS.
- `client/dist` was rebuilt as an exact copy of the checked build. dist-rilis is untouched, so :4000 plays the new audio only after the Lead refreshes dist-rilis.
- Not verified: listening by a human.

## T-037 (2026-11-18): episode picker on one phone screen, real case first

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed. Follows the Designer mock D-335..D-340 and the owner addendum of 07:00-07:12.

- **Picker** (`client/src/pages/Cerita.tsx`):
  - The picker shows the Episode 1 card (auto-2, the truck case), then a LOCKED Episode 2 row.
  - The demo card (auto-1) is hidden. It only shows with the new server flag `RAKSA_DEMO_CERITA=on` (default off), which `/api/config` reports as `features.demoCerita`.
  - The auto-1 code, its route `/cerita/auto-1`, saved progress and the hosted-room demo are untouched. `DAFTAR_EPISODE` keeps its order; the picker sets its own.
  - No Join Game card. Instead one line, "Punya kode room? **Masuk di beranda**", links to `/`.
- **Header:** one line (back, small 28 px Miss Raksa head + "Mode cerita", language, sound). The hub eyebrow, title and lead sentence are not shown under 600 px.
- **Card on phones:**
  - Thumbnail = Pak Hendra's FACE from the pixel portrait atlas (`PotretPikselHp`, whole-pixel scale), 88 px inside a 96 px blush square with a 2 px frame. Bu Rina's face is used for the demo when the flag is on. At 600 px and wider the old cover stays.
  - Meta line on one line: a small chip (20 px tall, 11 px caps; orange for KASUS NYATA, grey outline for DEMO) then "Episode 1 · Kendaraan · ± 17 menit". The demo reads "Demo · …" with no number.
  - Below the meta: title 18/22, blurb clamped to 2 lines (1 on screens ≤ 700 px high), and the status on one line with its icon inline.
  - Mulai / Lanjutkan key full width, 48 px.
- **Locked row:** 52 px tall with a grey K1-light frame, a 16 px pixel lock, "Episode 2 · Segera hadir" and one muted line.
  - It is a disabled control (`aria-disabled`, tabbable, no link or route). A tap, Enter or Space shows "Segera hadir" for 2 s in place of the second line, so the row height does not change.
- **New keys** (id/en/zh): `cerita.labelDemo`, `hubKode`, `hubKodeTautan`, `pemilih.segera`, `pemilih.segeraTeks`, `pemilih.segeraCatatan`, `pemilih.terkunciAria`.
- **"Episode 2" label check:** the story screens never printed an episode number; their header says "Mode cerita". The only number was on the picker, which now says Episode 1.
- **Tools:**
  - `tools/cek-pemilih-t037.mjs` (new), 13 cases: 390x745 and 360x640 x id/en/zh x new/returning, plus 1280x800.
  - It asserts:
    - 0 px page scroll;
    - exactly one playable card (auto-2), and the order card → locked row;
    - no Join card, and the room-code link goes to `/`;
    - the chip is first in the meta line, sized and coloured as specified, and does not overlap the portrait;
    - the portrait box is 96 px;
    - blurb line limit, one-line status, key text and size;
    - the locked row is ≤ 64 px, `aria-disabled`, has no link, shows the 2 s note, and a tap does not navigate.
  - Free space below the last line: about 400 px at 390x745 and 316 px at 360x640.
  - `cek-tag-t026` now checks the chip contract described above, in place of the old corner badge and the before/after baseline.
- **Also:** the T-035 hidden "Tindakanmu" label is now `class="sr-only"`, because `cek-bahasa` flagged it as clipped text.
- **Screens:** `team/evidence/T-037/fullstack/`.

## T-033 Fix 3 (2026-11-18): QA B-01, B-02

- **B-01 (K09):** with the pointer gone outside K08 (T-035), K09 completes by the steps. Opening each witness and marking "Di rencana" or "Tidak perlu" enables the send bar, and the strip reaches step 3. `cek-langkah` now walks this at every size and language and asserts both.
- **B-02 (K08 conclusion):**
  - The pointer now sits at the RIGHT end of the first option, pointing left, with 30 px reserved in the option. It no longer covers the question text.
  - On screens ≤ 700 px high the options are 4 px tighter and use an 18 px line height. The list had 8 px of inner scroll at 360x640 id; it now has 0.
  - `cek-langkah` asserts 0 px inner scroll and no overlap between the pointer and any text.
- **K02 keyboard focus (B-03):** no longer relevant, since K02 has no pointer.

## T-036 Fix 1 (2026-11-18): story loops in 8-bit chiptune style

- **New loops:** recomposed in `tools/make-music-ep2.mjs`. All original, with no samples and no downloads.
  - Sound: band-limited pulse leads (12.5 / 25 / 50 % duty), a 4-bit stepped triangle bass, and LFSR-noise hat, kick and snare.
  - Melody: a catchy 4-bar motif that repeats with A/B sections, generated from chord tones.

  | Track | Title | Character | BPM | Bars | Length | RMS |
  | --- | --- | --- | --: | --: | --: | --: |
  | `cerita-kantor` | "Loket Pagi" | light, C major | 104 | 48 | 110.8 s | -21.4 |
  | `cerita-periksa` | "Lapangan Berangkat" | more drive, D major | 112 | 56 | 120.0 s | -21.4 |
  | `cerita-penutup` | "Berkas Beres" | warm, F major, short victory lick at the end of each B section | 100 | 48 | 115.2 s | -22.4 |

  Peaks are -7.1 to -8.3 dBFS. Loudness variation is 0.16-0.17, and the start and end of each loop differ by at most 1.4 dB.
- **Mix:** unchanged (`GAIN_CERITA` 0.28). Cache key bumped to `?v=t036b`. `CREDITS.md` updated.
- **`check:audio`:** the length rule for the story tracks is now 99-190 s (48-64 bars at 100-116 BPM).
- **The pastoral version from T-036** is kept in my scratch folder only.

**Gate:**
- The picker and Fix 3 checks ran on the build before the new audio: typecheck 0, `test:client` 771, `cek-pemilih` 13, `cek-tag` 18, `cek-beranda` 37, `cek-bahasa` 138, `cek-langkah` 54, `cek-layar` aktivitas 60, server `bahasa.config` 1.
- The final build (same code plus the new audio): `check:audio` passes against :4003, `cek-audio-t036` ALL PASS, `test:client` 771, `cek-pemilih` 13.
- `client/dist` is an exact copy of the final build. My test server build (`server/dist-uji`) was rebuilt with the new flag.
- **Not verified:** a real phone, a screen reader, and anyone listening to the chiptune loops.

## T-037 Fix 1 (2026-11-18): Designer D-341, D-342

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed.
- **D-341:** the KASUS NYATA chip now has its own line above the meta line, with nothing else on that line. The meta line is never cut or ellipsised.
  - On phones the meta uses 12 px type, no letter-spacing and narrower separators. At 360 px the gap between portrait and text is 10 px instead of 12.
  - id and zh fit on ONE line at both 390x745 and 360x640.
  - **en does not fit one line.** "Episode 1 · Motor vehicle · about 17 min" needs about 230 px, but the text column is 198 px at 360 and 216 px at 390. So in en the line wraps BETWEEN items, never inside one, and the separator moves with the next item so no dot is left hanging.
  - To get en onto one line, the en wording would need to be shorter, for example "Vehicle" and "± 17 min" (those keys are shared). Lead or Designer decision.
- **D-342:** the tap note on the locked row is now "Segera hadir. Kasus berikutnya sedang disiapkan." (en "Coming soon. The next case is in preparation.", zh "即将推出。下一案例正在筹备中。"). It replaces both text lines, so the title is not repeated, and the row height stays 52 px. The row tint is blush `#F9EEEA`.
- **Tools:**
  - `cek-pemilih-t037` asserts that the chip is its own line directly above the meta; that neither the meta nor any of its items is truncated (scrollWidth ≤ clientWidth, no `text-overflow`); that the meta has 5 items on at most 2 lines; and that the page is not wider than the screen. It reports the meta line count for each case.
  - `cek-tag-t026` asserts that the chip sits directly above the meta. This caught a 5 px sideways overflow in WebKit en during the fix, which the wrapping resolves.
- **Gate** (final build): typecheck 0, `test:client` 771, `cek-pemilih` 13, `cek-tag` 18 (Chromium + WebKit). Page scroll is 0 px everywhere; the lowest content ends at 406 px (390x745 en) and 381 px (360x640 en).
- `client/dist` is an exact copy of the final build.

## T-034/T-035 Fix 2 (2026-11-18): QA L-01..L-04

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed.
- **L-01** (`cek-bahasa` measured the hidden original label on the result card): this was already fixed in T-037. The label is now `class="sr-only"`, and `cek-bahasa` skips `.sr-only` elements. The check passes 138 / 138.
- **L-02** (K15 chip "pembayaran" broken mid-word at 360x640 id): chip titles now wrap only at word boundaries (`overflow-wrap: normal`, no hyphens), and the chip may grow by a line.
- **L-03** (K15 preview half-cut):
  - The collapsed preview is now exactly 3 whole lines, or 2 on screens ≤ 700 px high. The height comes from the line-height clamp (19 px lines) with the built-in ellipsis on the last line. The old max-height and the "…" overlay are removed.
  - The empty-message text obeys the same clamp. Without that it grew to 3 lines at 360x640 en and caused 16 px of inner scroll.
- **L-04:** the K05, K10 and K-SIM hints and the coach card no longer mention an arrow. The arrow wording remained only in those three hints and the coach card; no other text had it.

  | Hint | id | en | zh |
  | --- | --- | --- | --- |
  | K05 | "Ketuk kartu, lalu tempat tujuannya" | "Tap a card, then where it goes" | "先点卡片，再点它的去处" |
  | K10 | "Bandingkan tiap baris kedua dokumen" | "Compare each row of both documents" | "逐行比较两份文件" |
  | K-SIM | "Ketuk benda di adegan untuk memeriksanya" | "Tap an item in the scene to check it" | "点击场景中的物体进行检查" |
  | Coach card | "Ketuk benda atau tempat yang disebut petunjuk. …" | "Tap the item or place the hint names. …" | "点击提示所说的物体或位置。…" |

- **Tools:** `cek-k15-t034` now asserts that no Latin-script word in a chip title is split across lines (CJK may break between characters), and that the collapsed preview shows whole lines only.
- **Gate** (final build): typecheck 0, `test:client` 771, `cek-k15` 12 (0 px page and inner scroll at 360x640 and 390x745 x id/en/zh), `cek-langkah` 54, `cek-bahasa` 138.
- `client/dist` is an exact copy of the final build.

## T-036 Fix 2 (2026-11-18): every document open plays "kertas"

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed.
- **K02:** tapping the document on the desk (`.hp-panggung-benda`, while a document is there) now plays `kertas`, the "berkas dibuka" sound. Fixes QA low.
- **K10:** switching to another row of the papers plays `kertas`. Tapping the row that is already open stays silent.
- **K11 and ksim:** already played it (opening a file in the bundle, flipping the card). Unchanged.
- **Mute:** every case goes through `playSfx`, so mute and the SFX switch apply as before.
- **Test hook:** with `?uji-audio`, `playSfx` logs each request to `window.__sfxLog`. Nothing is logged otherwise.
- **`cek-audio-t036`:** opens K02 on the test state, taps the document and asserts the log contains `kertas`. Result: `["kertas"]`, ALL PASS.
- **Gate:** typecheck 0, `test:client` 771, `cek-audio-t036` ALL PASS. `client/dist` is an exact copy of the final build.

## T-038 (2026-11-18): app security fixes, Codex findings 1, 2, 4, 5, 6, 7

Fullstack · edited under `C:\Users\User\Desktop\rksgm-episode2` · NOT committed. Box items (finding 3, nginx, firewall) are the Lead's.

- **1 CSV formula guard** (`server/src/csvGuard.ts`, new): one guard for the legacy export (`csv.ts`) and the Story report (`story/reports.ts` re-exports it). An apostrophe is prefixed when a cell starts with = + - @ (also full-width) or with any whitespace / control character (TAB, CR, LF, NUL, NBSP, BOM, ideographic space). Cells with a quote, comma, semicolon or line break are quoted.
- **2 PIN brute force** (`server/src/keamanan.ts` `PembatasPin`):
  - Per trusted client IP: 8 wrong PINs in 5 min. The socket path now uses `clientIp()` with `TRUST_PROXY_HOPS`; REST uses `req.ip`.
  - Global: 60 wrong PINs in 10 min across all IPs locks PIN checks for everyone for 10 min. Every lockout is logged as `[keamanan] ...`.
  - `RAKSA_LEGACY=on` + `NODE_ENV=production` without `PANITIA_PIN`: legacy routes answer 503 with a clear message and the legacy Socket.IO namespace is refused. Story mode keeps running. A startup log line says so. Live already has a PIN, so nothing changes there.
  - Bank writes and key reads already needed host token AND PIN on every request when a PIN is set; with the production rule a PIN is always set there.
- **4 Export token**: `results.csv` / `results.json` accept the token only from `x-host-token` (timing-safe compare) and send `Cache-Control: no-store`. The host page fetches the file and saves it from a blob; a failed download shows "Unduhan gagal. Coba lagi." (new key `host.eksporGagal`, id/en/zh). Tests, `loadtest.ts` and `tools/e2e-browser.mjs` use the header.
- **5 Origins and headers**:
  - New env `RAKSA_ORIGINS`. Allowed: no Origin header (non-browser), same origin (Origin host = Host, or `X-Forwarded-Host` behind trusted hops), `PUBLIC_BASE_URL`, the listed origins. Outside production, loopback/LAN origins are allowed too (Vite dev server).
  - HTTP CORS reflects only allowed origins. Engine.IO `allowRequest` refuses other origins on every handshake, WebSocket upgrades included, with a log line.
  - App-wide `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. frame-ancestors / X-Frame-Options unchanged. nginx also sets these; equal values, so harmless.
  - `RAKSA_CSP_REPORT=on` sends `Content-Security-Policy-Report-Only` on pages (self, Google Fonts, data/blob media, ws/wss). Default off, never enforced.
- **6 Legacy socket flood**: per-IP connection budget (600 per minute) and a per-socket event budget (100 events / 10 s get a "Terlalu banyak permintaan" ack; 300 disconnects the socket with a log line; `disconnect` is exempt). `RateLimiter` now has a hard key cap (20 000, oldest dropped), so all limiter maps are bounded.
- **7 Debug hook**: `?uji-audio` / `__sfxLog` / `__rekamSfx` only when `import.meta.env.DEV` or a build with `VITE_UJI_AUDIO=on`. The production bundle no longer contains the string. `cek-audio-t036` therefore needs a build with `VITE_UJI_AUDIO=on`.
- **Tests**: new `server/src/keamanan.test.ts` (guard cases, legacy export with hostile name/event/prize/badge/mission text, per-IP and global PIN lock with release after 10 min, origin policy incl. production, legacy-without-PIN rule, limiter cap). `integration.test.ts`: query token refused, no-store, nosniff, Referrer-Policy, foreign origin gets no CORS, foreign Engine.IO handshake 403.
- **Docs**: `.env.example` and README §Pengaturan server (`RAKSA_ORIGINS`, `RAKSA_CSP_REPORT`, production PIN rule).

**Gate:** typecheck 0, `test:server` 209 / 209, `test:client` 771 / 771, `cek-room-t028` ALL PASS (6), `uji-room-cerita` exit 0 (legacy off, :4003, scratch DB). `client/dist` is an exact copy of the final build; `server/dist-uji` rebuilt.
**Not verified:** a real nginx in front (X-Forwarded-Host handling, duplicate headers), the CSP report-only output in a browser console.

## T-038 Fix 1 (2026-11-18): Codex code review points 1-4

- **1 Global PIN budget** (`server/src/keamanan.ts` `PembatasPin.cek`): order is per-IP lock, then the timing-safe compare. While the global budget is saturated a CORRECT PIN passes (log "pin benar saat budget global jenuh"); a wrong PIN answers the lockout message and is still counted per IP. A staff session with `hostRooms` (`x-staff-token` on bank REST, `staffToken` in `host:create`) skips the PIN gate; other staff roles do not. The legacy host page does not send a staff token yet (server path only).
  - Tests: `keamanan.test.ts` (saturated + correct = ok, wrong during lock = denied and counted, per-IP lock first); `bank.integration.test.ts` (staff host creates a room and writes the bank while the address is locked; an author account is still refused).
- **2 Audio hook**: new build constant `__UJI_AUDIO__` (vite.config define; `client/src/audio/bendera.ts`) true only for `vite serve` or `VITE_UJI_AUDIO=on`. It guards the `__sfxLog` push in `playSfx` and the `?uji-audio` / `__rekamSfx` setup in `main.tsx` (`import.meta.env?.X` was NOT folded by the minifier). New `tools/cek-rilis.mjs`: 0 hits in the release build, 3 hits in a `VITE_UJI_AUDIO=on` build (sanity).
- **3 Origin**: same-origin now compares scheme + host + port. Behind trusted hops scheme and host come from `X-Forwarded-Proto` / `X-Forwarded-Host`, otherwise http + Host. Test: https on the forwarded host passes, http or another port on the same host fails. README: RAKSA_ORIGINS REPLACES the public-URL fallback; Tailscale/LAN :4000 note; nginx must overwrite the forwarded headers.
- **4 CSV**: README documents that leading whitespace/control characters always get the apostrophe (normalisation).

**Gate:** typecheck 0, `test:server` 209 / 209, `test:client` 771 / 771, `cek-rilis` on `client/dist` 0 hits (uji-audio / __sfxLog / __rekamSfx). `client/dist` = exact copy of the final build. Not committed.

## T-038 Fix 2 (2026-11-18): global PIN lock stops verification; staff path from the host page

- **Server** (`keamanan.ts` `PembatasPin.cek`): order is global lock, then per-IP lock, then compare. While the global budget is saturated NO unauthenticated PIN is checked (no compare, generic "Terlalu banyak percobaan PIN"), for the full 10 min. One log line when the lock starts (it now also says staff hosts can still sign in). The Fix 1 "correct PIN passes" path is gone. Per-IP lock unchanged.
- **Staff path on the legacy host page (`/acara/host`)**:
  - `client/src/story/staff.ts`: `storedStaffToken()` (same sessionStorage key as /admin, /cms, /host) and `staffReturnPath()` (allowlist: only `/acara/host`, so `?kembali=` is no open redirect).
  - The bank requests (`state/bank.ts` `headerOtorisasi`) send `x-staff-token`; `host:create` (`state/store.ts`) sends `staffToken`, when a staff session is stored in this tab.
  - The PIN field (`KolomPin`) shows a "Masuk sebagai staf" link (id/en/zh, `bank.stafMasuk`) to `/host?kembali=%2Facara%2Fhost`. After sign-in `StaffShell` returns there in the same tab, so the session carries over.
  - With a staff session the create panel and the bank do not ask for the PIN, and show "Masuk sebagai staf: PIN panitia tidak diperlukan." The server still checks the host role; another role gets the normal PIN answer.
- **Tests:**
  - `keamanan.test.ts`: saturated budget refuses a correct PIN ("terkunci"), still locked at 9 min, PIN works again after 10 min.
  - `bank.integration.test.ts`: during a global lock (`jenuhkanPinGlobal()` test helper) a correct PIN is refused and a staff host still creates rooms and writes the bank.
  - New `client/src/state/bank-staf.test.ts`: header sent only with a stored staff token, return-path allowlist. `net/socket.ts` reads `import.meta.env?.` so the module loads in node.
- **Coordinator add-on:** `tools/e2e-browser.mjs` takes `RAKSA_PIN` and sends it in `host:create` (the tool does not call the bank), and stops with a clear message when `host:create` fails.

**Gate:** typecheck 0, `test:server` 209 / 209, `test:client` 772 / 772, `cek-rilis` 0 hits on the rebuilt `client/dist` (exact copy). e2e with a PIN not run by me (Lead gate). Not committed.

## T-040 (2026-11-19): owner phone pass, items 1-4 (item 5 Story menu moved to Designer T-041, not touched)

- **1 K15 draft empty line** (`client/src/cerita/hp/arena/pesan.css`): `.hp-draf-kosong` inherited a white fill + padding + radius from hp.css and is forced inline when collapsed, so it wrapped into patchy boxes. The composer rule now sets padding 0, radius 0, background none; the line sits on the panel colour (CSS only, same for id/en/zh). The sentence spans (`.hp-draf-kalimat`) already had no background.
- **2 K08 pointer** (`client/src/cerita/hp/arena/Pandu.tsx` `cariSasaran`): no pointer and no `.lgk-sasaran` ring on lanes (`tandai`) or conclusions (`putus`); after a choice the pointer moves to the send button only. It still shows on the sign post at `ketuk` (signs are not graded). Ribbon and hints unchanged.
- **3 Audio pile-up** (`client/src/audio/audio.ts`): every SFX has a 70 ms minimum gap (story SFX keep 80 ms); each play is its own voice GainNode, max 6 at once, the oldest fades out in about 10 ms. `setTrack` with the unchanged track is a no-op; `fade` skips when the same target is already running or reached; a pending `play()` is not called again or reset to 0 (this was the restart on quick screen updates); ambience with the same place + volume does no new ramp. One element per track (map by src), at most two during a crossfade.
- **4 iPhone volume** (`audio.ts`): `initAudio` sets `navigator.audioSession.type = 'playback'` (try/catch). Music elements are routed element -> MediaElementSource -> per-track gain -> new `musicBus` -> master; volume and fades drive the gain (`el.volume` stays 1), with `el.volume` as fallback when there is no AudioContext. So `prefs.musicVolume` really changes loudness on iOS; SFX already went through the Web Audio sfx bus. Prefs keys and defaults unchanged.

**Gate (owner rule: typecheck + build only):** typecheck 0; `client/dist` rebuilt = exact copy of the scratch build. No tests, e2e or browser runs; nothing verified on a phone yet. Not committed.

## T-041 (2026-11-19): pixel Story menu, compact (Designer)

Owner phone pass item 5. Built by the Designer; uncommitted. Owner rule: no e2e, no tests, no browser runs. NOTHING here was opened in a browser; the sizes below are calculated from the CSS.

**What changed**
- `client/src/cerita/hp/PemainHP.tsx`: the menu Modal gets `kelas="hp-menu-piksel"`. Order: Goal (max 2 lines), then 2x2 pixel keys (History, Case notes, Help, and List view / Picture view in the arena), then a language row, then two sound rows, then Close. The List view key now has its own pixel list icon (picture icon when switching back), not the "?" icon. Its full label ("Use list view") stays as `aria-label`. `PilihBahasa` is no longer used in the menu.
- `client/src/cerita/hp/MenuPiksel.tsx` (new):
  - `IkonMenu`: 12x12-cell pixel icons drawn as rects (24 px, crispEdges, PALET colours) for riwayat, catatan, bantuan, daftar and gambar.
  - `BahasaKunci`: ID / EN / 中文 as three segmented pixel keys (`role="group"` + `aria-label` "Pilih bahasa", `aria-pressed` on each). Each key calls `aturBahasa`, as PilihBahasa does.
- `client/src/cerita/hp/AudioCerita.tsx` (`KontrolSuara`): two rows only, Music and Effects. Each row has a pixel On/Off key (`role="switch"`, `aria-checked`) and a pixel slider.
  - Music slider: `setMusicVolume` (prefs.musicVolume). Effects slider: `setSfxVolume` (prefs.sfxVolume) plus a tap sound. Both have `aria-label`s and step 5.
  - The "All sound" row is dropped and folded in: while muted, both rows show Off; switching one on unmutes and keeps the other off. `audio.ts` is not touched.
  - "Coba suara" samples now show only when `UJI_AUDIO` is on (dev or VITE_UJI_AUDIO build), so the phone menu does not grow.
- `client/src/ui/kit.tsx`: `Modal` gets an optional `kelas` prop (an extra class on `.mdl-latar`). Focus trap, Escape, backdrop close and the title focus are unchanged.
- `client/src/i18n/kamus/ceritaHp.ts`: new keys in id, en and zh: `suaraMusikPendek`, `suaraEfekPendek`, `tampilanDaftarPendek`, `tampilanVisualPendek`.
- `client/src/cerita/hp/desain.css`: block "T-041" (all rules scoped to `.hp-menu-piksel`).
  - Panel: K1 frame (3 px stepped corners, 2 px orange line, 5 px base). Title is an orange strip across the panel (#FFD9A8 top, #E07E00 underside).
  - Keys: T-030 pixel key shape. Ink by default; orange when On or selected; 2 px press.
  - Slider: 12 px stepped track (ink outline with notched corners, #FFF9F5 face, #ECD5CB tick every 16 px, orange fill from `--isi`). The thumb is a square 28 px pixel thumb, and the input is 44 px high.
  - Close is the shared `.btn` key, full width. Layer padding is `max(12px, safe-area)`, and the panel max-height uses 100dvh minus the insets.

**Sizes (calculated, not measured)**
- 360x640, insets 0: room 616 px. Menu = 2 + title 36 + 10 + list [4 + goal 40 + 8 + 2x2 keys 104 + 8 + language 44 + 8 + sound 102 + 4] + 10 + Close 44 + 12 + 5 = 447 px. That leaves 169 px; there is no inner scroll.
- 390x700: 447 px, leaving 229.
- End screen (no goal, plus the two info rows, about 2x60): about 520 px, which still fits.
- Widths at 360: key 149 px. Label room 101 px at 14 px, and a 2-line label still fits the 48 px key. Language keys 3x52 + 8 = 164 px. Sound row: key 136 + 12 + slider 156 px.
- Tap targets: keys 48, language 52x44, On/Off 136x44, slider input 44 high with a 28 px thumb, Close 44.

**For the owner's phone check (iPhone Safari)**
- The slider thumb drags by touch.
- Music follows the slider.
- Effects On/Off.
- Language switches without closing.
- Close is visible without scrolling on the smallest phone.

**Risks**
- e2e/cek tools that clicked the old master switch (`data-suara="master"`), the "Coba suara" details, or the `<select>` in the menu will need updating if they are run later. `data-suara="musik|efek"` and `data-volume="musik|efek"` are kept.
- Gate: client typecheck 0 errors, client/dist rebuilt. Not committed; `client/dist-rilis` untouched.

## T-042 (2026-11-19): SFX late on iPhone after T-040

- **Reasoning:** the tap-to-sound path in `playSfx` was already synchronous (gap check, voice bookkeeping and `bunyikan` at `ctx.currentTime` in the same call; `resume()` fire-and-forget; the setTimeouts only disconnect finished voices), so the delay must come from the output buffer size. T-040 added two session-wide iOS changes that can raise it: `audioSession.type = 'playback'` and music routed into the same AudioContext via `createMediaElementSource`. The context also had no `latencyHint`.
- **Certain fixes** (`client/src/audio/audio.ts`): `new Ctor({ latencyHint: 'interactive' })` with fallback to `new Ctor()`; `resume()` now runs whenever the state is not `running` (iOS reports `interrupted`, not only `suspended`), still fire-and-forget.
- **T-042 temporary A/B, remove after owner picks:** read once at `initAudio` from `?suara=`, kept in sessionStorage key `raksa:suara-ab`.
  - `?suara=a` = T-040 as shipped (audioSession playback + music through Web Audio)
  - `?suara=b` = no audioSession playback, music still through Web Audio (**default** without parameter: keeps the in-app music volume working on iOS, which the owner confirmed, and drops the session-category change that is new and global)
  - `?suara=c` = audioSession playback, music NOT routed (el.volume as before T-040)
  - `?suara=d` = neither (pre-T-040 audio routing/session)
  - Note: routing is per element and permanent once made, so switch mode with a fresh load of the URL (new tab or reload), not mid-page.
- T-040 fixes untouched: 70/80 ms per-sound gap, max 6 voices, idempotent music/ambience, single play per track.

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy of the scratch build. Not tested in a browser or on a phone. Not committed.

## T-043
QA added 3 expect (snapshot) tests with node:test `t.assert.snapshot` (record: `tsx --test --test-update-snapshots <file>`): `server/src/story/skor.expect.test.ts` (12 cases), `server/src/csv.expect.test.ts` (1 snapshot, 9 inputs), `server/src/keamanan.expect.test.ts` (1 snapshot, 14 decisions); `*.snapshot` files sit beside them; the 3 files are appended to the server `test` script and run in about 0.7 s. Finding: `PembatasPin` builds its two `RateLimiter`s without its injected `now`, so a fake clock cannot expire the per-IP window; the staff-host bypass lives in `index.ts` `cekPin` and is not covered.

## T-044 (2026-11-19): Mulai sound on iPhone; suara=b permanent

- **SFX lead** (`client/src/audio/audio.ts` `playSfx`): sounds are scheduled at `ctx.currentTime + 0.02`, so a short main-thread stall right after the tap does not put the start of the envelope in the past. Still started in the same call (no await, resume fire-and-forget).
- **Deferred mounts (sound first, heavy screen on the next frame via requestAnimationFrame, about one frame):**
  - `client/src/cerita/hp/PemainHP.tsx` Mulai / Lanjutkan tugas (`playSfx('kertas')` then `setArenaUntuk`).
  - `client/src/cerita/ui/Aktivitas.tsx` desktop story activity start (`playSfx('tik')` then `setMulai(true)`).
  - Not changed: the Lanjut / Lihat ringkasan button to the end card and the episode picker play no SFX, so there is nothing to protect there.
- **Optional pointerdown trigger:** skipped (would need a click/keyboard double-play guard; the frame deferral covers the case).
- **T-042 A/B removed:** no `?suara=`, no sessionStorage key `raksa:suara-ab` (0 hits in the build). Behaviour b is permanent: no audioSession 'playback', music through Web Audio, latencyHint 'interactive'. T-040 gap / voice cap / idempotent music untouched.

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy of the scratch build. Not tested in a browser or on a phone. Not committed.

## T-045 (2026-11-19): every orange button plays a sound

- **Mechanism (one place, no per-button edits):** `client/src/ui/kit.tsx` `AudioUnlocker` (mounted once in App.tsx) adds a window click listener in the CAPTURE phase. If the target is inside an enabled orange key (not `disabled`, not `aria-disabled="true"`) it calls `tombolUtamaDiklik()` (`client/src/audio/audio.ts`), which starts the new SFX `tombol` right away. Capture runs before React's root listener and before React renders this click, so a heavy screen cannot delay it (no flushSync anywhere in client/src).
- **No double sound:** if the button's own handler starts its own sound in the same click (Mulai = kertas, Kirim = pesanKirim, Lanjut aktivitas = konfirmasi, ...), `playSfx` cuts the default voice before it is heard (it is scheduled 20 ms ahead) and restores its gap timer. A bubble-phase listener (`akhiriKlikTombol`) closes the window at the end of the click. Keyboard Enter/Space fire click, so they are covered. Mute and effects-off are respected (same path as playSfx).
- **Orange classes:** `.primary-action` (includes akh-utama, hp-kirim-tombol, cer-lanjut, sr-kirim, solo-jeda-lanjut, lp-join-mulai, hp-gerbang-mulai, ...), `.btn-utama`, `.kj-utama`, `.lk-btn-utama`, `.meja-utama`, `.akh-utama`, `.lp-pintu-aksi` (the "Primary" group of gaya-game.css). Not counted: ink/secondary keys, danger, reply rows (`.hp-opsi`), toggles (`.hp-sakelar`, menu pixel keys), round keys.
- **Left out on purpose:** staff authoring pages `/cms` and `/admin` (not the game). The host page is included.
- **New SFX `tombol`** (~130 ms, original synth): sine "thock" 180 -> 110 Hz (25 ms drop + short tail, peak 0.085) + triangle chime N(24) then N(31) 10 ms apart through a 5 kHz lowpass (peaks 0.05 / 0.045), 2.5 ms attack, exponential release; 70 ms gap. Listed in the dev-only "Coba suara" samples (i18n `ceritaHp.sfxTombol` id/en/zh).

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy of the scratch build. Not tested in a browser or on a phone. Not committed.

## T-046 (2026-11-19): orange-button sound = owner's pick (Kenney confirmation_003, CC0)

- `client/src/audio/audio.ts`: `initAudio` fetches `BASE_URL + audio/sfx-tombol.wav` once (`muatSampelTombol`) and decodes it with `decodeAudioData` (promise and callback form, for older Safari); the AudioBuffer stays in memory. SFX `tombol` = AudioBufferSourceNode -> level gain `GAIN_TOMBOL` -> the per-voice gain -> sfxBus, started at the same 20 ms lead. Until the buffer is ready, or if fetch/decode fails (logged once), the T-045 synth recipe plays.
- **Gain:** `GAIN_TOMBOL = 0.16` (file peak 0.89, RMS 0.17, measured from the WAV; about the loudness of konfirmasi, which peaks near 0.12). One constant to tweak.
- Unchanged from T-045: central capture listener, a button's own sound wins and the default voice is cut, 70 ms gap, voice cap, mute / effects-off.
- The WAV is not re-encoded; Vite copies `client/public/audio/sfx-tombol.wav` to `client/dist/audio/sfx-tombol.wav` (byte-identical, 28 622 bytes).

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy of the scratch build. Not tested in a browser or on a phone. Not committed.

## T-047 (2026-11-19): real loading bar into the playable case + cache headers

- **Where:** `client/src/App.tsx` route `/cerita/:episode` wraps CeritaMain in `PramuatCerita` (`client/src/cerita/PramuatCerita.tsx`). Only for `auto-2` (the playable truck case in the picker), only with a profile (else CeritaMain redirects to /kenalan as before), once per page session. Other episodes and routes pass straight through.
- **Blocking preload (normal connection), 35 items, about 1.6 MB raw:**
  - story chunk `CeritaMain` via the same `import('../pages/CeritaMain')` specifier as the router (201 KB raw, gzip on the wire) + list module `pramuatDaftar` (1.2 KB chunk, deps shared with the story chunk, main bundle unchanged). Phaser is NOT included: the playable case uses the phone player, the Phaser meja path is behind MEJA_KASUS (off in release).
  - 31 pictures, 378 KB (`client/src/cerita/pramuatDaftar.ts`): Episode 2 pixel rooms (layers, props, committee atlas + sign), character atlases + icons, phone POV, and the CSS-only pictures (WhatsApp truck photo, SIM card, office board, committee icon) imported with the same hashed URLs; small files inlined as data: are skipped. Loaded with `muatPng` (fetch + decode, the same cache the pixel stage reads).
  - first music `cerita-kantor.mp3` (1.08 MB) buffered to canplaythrough in the element that will play it (`pramuatMusik` in audio.ts; load() only on an idle never-loaded element, never restarts a playing track).
  - `sfx-tombol.wav` (28 KB) decoded into the audio engine (`siapkanAudio()` in audio.ts; without an AudioContext yet it only fetches into the HTTP cache).
- **Save-Data** (`navigator.connection.saveData`): only the chunks + the first-screen pictures (first composition of the story, or of the saved resume point) block; no music; the other pictures load in the background after 1.5 s.
- **Not blocking:** after the first screen, `cerita-periksa` and `cerita-penutup` are buffered in idle time (3 s + requestIdleCallback), not with Save-Data.
- **Caps:** per item 8 s, overall 12 s, then the story opens with what is ready (missing items load lazily as before). Finished in under 300 ms (second visit, HTTP cache) = no bar shown at all.
- **Bar:** same Raksa loader look as PemuatAwal (RAKSA GAME mark, Raki, `.lp-pemuat-bar`) but REAL: 10 steps filled by finished items / total, `role="progressbar"` with aria-valuenow, status text `umum.pramuatCerita` + percent (id/en/zh). CSS in `client/src/player.css` (`[data-nyata]`, reduced-motion keeps empty/filled steps).
- **Cache headers** (`server/src/index.ts` static): `/assets/*` unchanged (1 year immutable); `index.html` (static and the SPA fallback) `no-cache`; every other un-hashed public file (`/audio`, `/karakter`, icons) `public, max-age=86400` (was 1 hour for /karakter, nothing for /audio); ETag kept (express.static default). Security headers and the results no-store untouched.

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy of the scratch build. Not tested in a browser or on a phone. Not committed.

## T-048 (2026-11-19): story SFX from samples, quieter orange button, no click on overlap

- **Samples** (`client/src/audio/audio.ts` table `SAMPEL`, file + gain): the T-046 single loader is generalised. All six WAVs are fetched and decoded once at initAudio and by the T-047 preloader (`siapkanAudio()`, one item); playback = buffer source -> level gain -> per-voice gain -> sfxBus at the same 20 ms lead; synth recipe until a file is decoded or if it fails (logged once per file). pesanKirim / pesanTerima stay synth bells; legacy quiz sounds (pilih, tik, bukti, kirim, naik, salah, papan, confetti, masuk) unchanged.
- **Gains** (measured: loudest 100 ms RMS of each file, aiming at the tombol level):
  - tombol 0.08 (was 0.16, owner "about half"; RMS100 0.63 -> ~0.050)
  - konfirmasi 0.07 (RMS100 0.70 -> ~0.049)
  - kertas 1.8 (quiet file, peak 0.33, RMS100 0.024 -> ~0.043)
  - taruh 0.22 (peak 1.00, RMS100 0.22 -> ~0.048)
  - ketuk 0.06 (RMS100 0.43 -> ~0.026, quieter than tombol)
  - batal 0.065 (RMS100 0.60 -> ~0.039)
- **Overlap rule (no start-then-cut):** the capture-phase listener only ARMS the default tombol; any `playSfx` that really starts a sound during the same click disarms it; the window bubble listener (after the React handlers) starts tombol only if still armed. A 0 ms timer settles it when a handler stops propagation. So a button with its own sound (Mulai = kertas, Kirim = pesanKirim, ...) never starts the default at all. Trade-off: a button WITHOUT its own sound that renders heavily in the same click hears tombol after that render (Mulai already defers its mount by a frame, T-044).
- **Voice cap:** the oldest voice now fades out linearly over 40 ms (was setTargetAtTime 10 ms), disconnected after 120 ms.
- The noise() bursts that sounded crackly (kertas / taruh / ketuk synth) only play now as fallback before the samples are decoded.
- Preloader: `pramuatDaftar.ts` / `PramuatCerita.tsx` comments updated; the sounds come from SAMPEL via siapkanAudio (no URL list duplicated). No ?v bump: gains are in code, files unchanged.

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy of the scratch build; the six sfx-*.wav are byte-identical in client/dist/audio. Not tested in a browser or on a phone. Not committed.

### T-048 Fix 1 (2026-11-19): default orange sound never waits for a heavy render

- `client/src/audio/audio.ts`: `tombolUtamaDiklik()` (capture phase, before React handlers and render) starts the `tombol` sample at once, scheduled `ctx.currentTime + 0.035` (`LEAD_TOMBOL_S`). If `playSfx` starts the button's own sound in the same click, the default voice is cancelled BEFORE its start time with `src.stop()` + disconnect in the same task (never audible, no click); a voice whose start time has passed is never cut by this rule. `akhiriKlikTombol()` (bubble) only closes the window; no timer, nothing deferred. Voice-cap cuts of sounding voices keep the 40 ms linear fade.
- This removes the T-048 trade-off: Lanjut / next-scene and other orange buttons without their own sound now sound before the render.

**Gate:** typecheck 0; `client/dist` rebuilt = exact copy. Not tested in a browser or on a phone. Not committed.

## T-049 (2026-11-19): silent choice taps + manual compare in the SIM check

- **Default rule** (`client/src/ui/kit.tsx` AudioUnlocker, `client/src/audio/audio.ts` `tombolUtamaDiklik(nama)`): orange keys keep `tombol`. In the story player (route `/cerita/<episode>`, incl. its dialogs) every other enabled `button` / `[role=button|switch|radio|checkbox]` gets the soft `ketuk` with the same rule as T-048 Fix 1: started in the capture phase at +35 ms, cancelled before its start time when the handler starts its own sound. A handler that plays `ketuk` itself is gap-dropped (80 ms), so it still sounds once. Skipped: links (`a[href]`), text inputs, sliders, selects, summary toggles, disabled / aria-disabled, staff pages.
- **Specific sounds:** `client/src/cerita/hp/arena/PapanSaksi.tsx`: pin on the plan board ("Wawancarai") = `taruh`, another tray ("Tidak perlu") = `ketuk`, untick / remove = `batal`. Witness card select (PapanSaksi), RencanaPeriksa slots / chips: the default `ketuk`.
- **SIM step 4 manual** (`client/src/cerita/hp/arena/ArenaSim.tsx`, `seni/aktivitas/sim.css`, `episode/auto-2/teks.{id,en,zh}.ts`): dropping the card (drag or tap, as before) no longer ticks anything. The player taps each Satpas row (NAMA, GOLONGAN, NO. SIM) or the matching box on the card, any order: the pair is outlined (row + card box, same green `.sim-garis`), the row is ticked, `ketuk` plays, Pak Bima says "Nama sama." / "Golongan sama." / "Nomor sama." (en/zh too). The third tick = the existing finish (cap SESUAI, "Tiga-tiganya sama dengan data Satpas.", `konfirmasi`). Unticked rows keep the empty tick box. Instruction after the drop: "Ketuk tiap baris untuk mencocokkan dengan SIM." / "Tap each row to match it with the licence." / zh; bar reason "Ketuk ketiga baris dulu.".
  - Hit areas (transparent buttons over the art, art unchanged): NAMA 44 px (with the print-out header), NO. SIM 44 px (with the footer), GOLONGAN 24 px (rows are 24 px apart) plus its 48 px box on the card; card boxes are a second way to tick (tabIndex -1; the rows are the keyboard path).
  - Keyboard: rows are buttons; a keyboard drop focuses the first unticked row; ticked rows stay focusable (aria-pressed) until the third tick, then focus goes to the bar button (header comment updated). The print-out is no longer a button after the drop (role img), so nothing nests.
  - Layout unchanged (no height change), so it still fits 360x640.

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy. Not tested in a browser or on a phone. Not committed.

## T-050 (2026-11-19): Miss Raksa in the committee room, Raksa yellow surveyor uniform, service-desk monitor + sign + headset (Designer)

Built by the Designer and uncommitted. Owner rule: NOTHING was opened in a browser. The previews are composed from the PNGs by script, not taken from the app. Gate: client typecheck 0 errors; client/dist rebuilt (the three `ep2-kantor-*` PNGs are in dist/assets).

**1. Committee room (Part 4): Miss Raksa as host.**
- **Where she stands:** at the right end of the table, in front of the whiteboard, facing the members, smiling.
  - Feet at art (366, 214), frame box 338, 31, 61×184.
  - She covers no face and no SETUJU / CATATAN tag; the table hides her near leg.
- **How she is built:** she is a 5th room sprite `missRaksa` with `tamu: true`.
  - She has no tag, no vote and no istilah icon.
  - She appears in tunggu, setuju (standing still) and catatan; she is absent in `kosong`.
  - Her pixels are copied 1:1 from her in-game `berdiri-kiri` frame with the senyum face, and she blinks like the members.
- **Camera:** `fokus` widened to art x 63..390 and `bingkai.hp` to x 62.5..391.5.
  - Cost (calculated, not measured): 390–402 px wide phones at DPR 3 now draw the room at 1 CSS px per art px instead of 1.33.
  - 430 px wide keeps 1.33. A 320 px wide phone at DPR 2 halves.
  - The Lead can revert it with one number if the owner prefers bigger faces.
- **Text:** the screen-reader room sentences (lokasi.komite.tunggu / setuju / catatan, id/en/zh) now mention her. The visible "Hadir:" line lists cast members only; this room has none, so it is unchanged.
- **Files:**
  - `character/komite-ep2-pixel-v1/alat/miss-raksa-t050.mjs` (new)
  - `komite.png` (315×193), `komite.json`, `ruang-komite.json`, README "T-050"
  - `tools/piksel/ruang-komite-ep2.mjs` (accepts `tamu`: no tag place, no icon)
  - `client/src/cerita/seni/piksel/komite.png`, `ruang-ep2.json`
  - `client/src/cerita/episode/auto-2/teks.{id,en,zh}.ts`
- **Previews:** `character/komite-ep2-pixel-v1/pratinjau-miss-raksa-t050-2x.png` and `pratinjau-miss-raksa-fokus-t050-2x.png`.

**2. Pak Rudi (Surveyor): Raksa yellow polo, from the real uniform.**
- **Yellow #F6D25C:** sampled from the owner's poster `character/surveyor-raksa-ref/seragam-surveyor-raksa.jpg`. It is the mean of the most common brightness band of the shirt pixels (861 px).
  - Ramp: #F6D25C main, #E2B74D shadow, #C69E43 deep, #9E7F20 folds.
  - The saved raksaonline.com CSS has no colours (fonts only), so the photo is the source.
- **Black parts:** collar and shoulder yoke in #33363F / #2C2C31, plus a small owl patch on the chest and a mark on the sleeve.
- **Unchanged:** face, hair, skin, lanyard and ID card, tablet, trousers, pose and grid.
- **Scope:** the change is in the runtime atlas `client/src/cerita/seni/piksel/samping.png` (his 3 body frames + the collar rows of his 2 face cells), so every Rudi scene, portrait and the K04 pin follow it.
- **Not changed:**
  - the Committee's own Surveyor seat (a different person in a khaki vest). The Lead can ask for the same yellow there if wanted.
  - the Underwriter, who was once drawn from Rudi.
- **Files:**
  - `character/tokoh-samping-ep2-pixel-v1/seragam-rudi-t050/`: `seragam.mjs` (idempotent; rerun it after `tools/piksel/bangun-samping.mjs`), `png.mjs`, README.
- **Previews:** `rudi-sebelum-sesudah-3x.png` and `rudi-dada-sebelum-sesudah-6x.png`.

**3. Part 1 service desk.**
- **Wall sign:** "SOGOK = NO / SERVICE = YES" with the smiley badge (maroon ring, waving glove).
  - It is a beige plaque that replaces the framed picture (layer z 12, art x 224, y 16), between Miss Raksa's head and the clock.
  - The text is in a 5×7 pixel font and not translated. The ring words were dropped (unreadable at 31 px).
- **Monitor and keyboard:** a black monitor seen from behind, left of the desk phone, plus a keyboard in front of her on the counter (layer z 31: above the counter, below Pak Hendra).
- **Headset:** grey band over the crown, ear cup on her visible ear, boom ending 1 px left of the mouth; eyes and mouth are uncovered.
  - It is drawn only in the office room and only on her desk frame `berdiri-kanan`, through a new room `aksesori` block (`ruang.ts` parses it; `PanggungPiksel.tsx` draws it after her frame and preloads it).
  - It does not appear in the committee room or in the phone-in-hand frames.
- **Files:**
  - `character/kantor-ep2-pixel-v1/t050/` (bangun.mjs, 3 PNG, kantor-t050.json, README)
  - `tools/piksel/kantor-t050.mjs` (new installer); `tools/piksel/bangun-ruang-ep2.mjs` calls it
  - `client/src/cerita/seni/piksel/ep2-kantor-{tanda-sogok,monitor,headset}.png`, `ruang-ep2.json`
  - `client/src/cerita/ui/latar/piksel/ruang.ts`, `PanggungPiksel.tsx`
- **Previews:** `character/kantor-ep2-pixel-v1/t050/pratinjau-kantor-t050-3x.png` (before/after), `-1x.png`, `pratinjau-headset-8x.png`.

**Risks:**
- Tests that count 4 committee members (`data-komite-anggota`), that pin the office room's layer list, or that pin the samping.png hash will need updating. None were run (owner rule).
- The camera scale numbers for the committee room are calculated from the README table, not measured.

## T-051 (2026-11-19): name & character screen on one phone screen; committee room without Miss Raksa again (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt.

**1. /kenalan (the first-time screen and ?ubah=1, same component Kenalan.tsx + CharacterPicker): CSS only, `client/src/player.css` block "T-051", phones up to 700 px wide, scoped to `.alur-kenalan` (the /join picker is untouched).**

Why it scrolled: the pixel sprite is never drawn under 1 CSS px per art pixel, so `tinggi={104}` was ignored and Miss Raksa was always 184 px tall.

- **Miss Raksa:** a half-body crop of the same sprite (rows 0–107, 108 px tall, with a 3 px #ECD5CB ground line). The pixel scale is kept (`background-size: 400% auto`) and the wave animation still runs.
- **Bubble:** beside her in one row (14 px text, the arrow at head height).
- **Title:** 22/28 px (was 27).
- **Header:** 56 px (was 76) on this page only.
- **Avatar cards:** still one row of 4, with 56 px avatars (was 72); every card stays at least 44 px.
- **"Design your own":** a 44 px row, still collapsible, above the save bar.
- **Save bar:** still sticky; key 50 px (was 58).

Heights by calculation (header + bust row + title + name 74 + cards 115 + design row 45 + gaps + save bar 67 + note + padding):

| Screen | Height | Spare |
| --- | --- | --- |
| 390×700 | ≈570 px | ≈130 px |
| 360×640 | ≈578 px | ≈62 px |

The 360×640 figure assumes the longest bubble (en first-time text) wraps to 3 lines.

The first-time "story" variant (name + "change your look" fold) is shorter still. When "design your own" is opened the page may scroll, as the brief allows.

**2. Committee room: Miss Raksa removed (owner changed his mind).**
- **Restored, byte-identical to the T-025 state before T-050:** `character/komite-ep2-pixel-v1/komite.png`, `komite.json` and `ruang-komite.json`, the client `seni/piksel/komite.png` and the `komite-ep2` entry in `ruang-ep2.json`. That means no host sprite and the old camera focus (art x 63–337, faces back at 1.33 CSS px on 390–402 px phones).
- **Text:** the three room sentences in `teks.{id,en,zh}.ts` match the pre-T-050 commit 792ef9b again.
- **Kept:**
  - the `tamu` support in `tools/piksel/ruang-komite-ep2.mjs` (unused, harmless);
  - all T-050 desk work (monitor, keyboard, Sogok sign, headset) and Pak Rudi's yellow polo.
- **Records:** `alat/miss-raksa-t050.mjs` is marked "reverted, do not run", and the komite README notes the revert.

## T-052 (2026-11-19): the player's character has a job in the truck story + Raksa uniform palette (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: typecheck 0 errors (server + client); client/dist rebuilt. server/dist was NOT rebuilt, so the Lead decides when; until then the old server ignores the new optional `look` field.

**Palette** (`character/palet-raksa-v1/PALET.md` section 12 has the full table).
- **The 4 official uniforms** are sampled from the owner's raksaonline.com photo (`character/kantor-raksa-ref/seragam-raksa-empat-warna.jpg`): lime #D0C282, butter yellow #FBD7A3, mauve #CA94AE, navy #1C1D30.
- **The other 4 clothing colours:**
  - white #FFFFFF;
  - cream #F9EEEA (site CSS);
  - charcoal #33363F;
  - brand orange #FF9000 (site CSS, 61 uses).
- **Accents:**
  - surveyor yellow #F6D25C (helmet, cap brim, reflective stripe, badge);
  - logo owl brown #73502F and logo red #C02430 (navy neckline trim);
  - cream portrait backgrounds #FFF1E2.
- **Not sampleable:** raksaonline.com loads its Miss Raksa image by script, so there was no file to sample from the page HTML.
- **Where it lives:** `shared/brand.ts` `UNIFORM_COLORS` now has 8 entries. The server's `sanitizeLook` clamps to the list length, so saved looks stay valid.
- **The 4 presets**, one per uniform:
  - Sigap: lime field jacket with a yellow stripe. Still color 0 + jaket, which equals LOOK_BAWAAN.
  - Teliti: butter yellow + headset.
  - Tangguh: navy + helmet.
  - Ceria: mauve + charcoal cap.
- **Labels:** the "design your own" colour names are new in id/en/zh (`pemain.seragam*`).
- **Round SVG avatar (`art/Avatar.tsx`):**
  - cream background instead of green;
  - the jacket takes the uniform colour;
  - dark front buttons;
  - accents in Raksa yellow / charcoal.

**Where the character now appears** (new pixel portrait `client/src/art/AvatarPiksel.tsx`):
- **What it is:** 16×16 art cells from look (5 skins, 5 hairs, 4 hair styles, 8 colours, 5 accessories), drawn as SVG rects at 32 px (2 px per cell).
- **Your messages in the chat:** a 32 px portrait beside each message the player sent (`Obrolan.tsx`, `.hp-keluar`). The row does not get taller.
- **Reply sheet:** a 32 px portrait to the left of the send key (`TombolKirim` new optional `potret`, used by `PilihBalasan.tsx`). The sheet height is unchanged.
- **End card staff ID card** (`client/src/cerita/ui/KartuPetugas.tsx`):
  - Content: an 84×56 lanyard card with an orange band, a pixel Raksa owl and "RAKSA", the portrait, the player's name and "Petugas Klaim" (id/en/zh).
  - Position: in the head row next to Pak Hendra's 56 px portrait, so the T-024 one-screen card does not get taller at 360×640 or 390×700. The head texts were already single-line with ellipsis; they give up about 94 px of width.
  - Accessibility: aria-label "Kartu petugas: {nama}, Petugas Klaim Raksa" (en/zh too).
  - It is also on the scrolling end card.
- **Hosted story rooms (T-028):**
  - The protocol had no look. Now `participant:join` may carry `look`, which the server passes through `sanitizeLook`; nothing sent means no character.
  - The look is stored on the participant (in memory, not persisted, so it is gone after a server restart) and sent in `StoryParticipantPublic.look` and `StoryRankRow.look`.
  - `StoryJoin` sends the device's `savedProfil().look`. `RankList` shows a 32 px pixel portrait beside the name (participant round view, final summary, host console, projector).
- **Plumbing:** the look reaches the story player via a small context (`cerita/hp/lookPemain.tsx`, provided in `PemainHP`).

**Files:**
- Shared and server:
  - `shared/brand.ts`, `shared/story/protocol.ts`
  - `server/src/story/socket.ts`, `server/src/story/runtime/room.ts`
- Client:
  - `client/src/art/Avatar.tsx`, `client/src/art/AvatarPiksel.tsx` (new)
  - `client/src/components/CharacterPicker.tsx`
  - `client/src/i18n/kamus/{pemain,ceritaAkhir}.ts`
  - `client/src/cerita/hp/{lookPemain.tsx (new), PemainHP.tsx, Obrolan.tsx, PilihBalasan.tsx, bagianHp.tsx, hp.css}`
  - `client/src/cerita/ui/{KartuPetugas.tsx (new), LayarAkhir.tsx, akhir.css}`
  - `client/src/story/{participant.ts, ui/parts.tsx, story.css}`, `client/src/pages/story/StoryJoin.tsx`
- Art and docs: `character/palet-raksa-v1/PALET.md` (section 12) and `karakter-pemain-t052/` (preview script + PNG).

**Risks:**
- Tests that pin the old colour list or labels, the `.hp-keluar` markup (a new inner column), or the head row of the end card will need updating. None were run.
- The legacy Phaser art (`game/art/characters.ts`) also reads `UNIFORM_COLORS`, so it gets the new colours.

## T-053 (2026-11-19): event host page /acara/host on one screen, guided, pixel style (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. The previews are wireframes drawn from the calculated sizes, not screenshots: `character/host-t053/` (README; before = the owner's screenshots, after = 3 states).

**Files**
- `client/src/pages/Host.tsx`: restructured. Every function and socket action is kept: hostCreate, hostAttach, hostAction start/next/close/pause/resume/end/reset/tiebreak/kick/retryScene, hostSettings, and export with the header token.
- `client/src/pages/host/host.css`: new; it replaces the inline GAYA block.
- `client/src/pages/host/AturSoal.tsx`: new optional prop `bukaAwal`.
- `client/src/i18n/kamus/host.ts`: new step, hint and tab strings in id/en/zh. The existing id texts are unchanged.

**Layout**
- **Step rail:** 5 pixel chips plus a one-line hint for each step and phase.
- **Step 1:** one pixel card with the question set as 2 pixel option cards, the PIN, one orange key, and the host token as an expander.
- **Room steps:** a title row with 10 numbered round chips (done / now / next) and a "Daftar soal" drawer. The drawer is a Modal holding AturSoal, which includes the questions written by the organisers.
- **Left column:** the invite (code, 168 px QR, link, joined count).
- **Right column, controls:** ONE orange key per phase plus Jeda. Akhiri and Reset are small keys under "⋯ Lainnya", each with its existing Modal confirm.
- **Right column, tabs:** Peserta / Peringkat / Kesiapan / Pengaturan / Ekspor / Suara. Only the tab body scrolls.
- **Finished:** a compact podium sits above the tabs, and the Peringkat tab opens by itself.

**Fit by calculation**
- 1280×720: the columns get 506 px. The invite needs 464 px; the controls take 246 px, leaving 202 px for the tab body.
- 1366×768: +48 px. 1920×1080: +360 px, and the QR grows to 240 px.
- Create room: about 683 of 720 px.
- Below 900×600 (phone, or a tablet held upright) the page scrolls as before.

**Risks**
- e2e and check tools will need updating if they look for:
  - the old page order or headings (h3 changed to h4 inside the tabs);
  - the visible Akhiri / Reset buttons (now under "Lainnya");
  - the playlist section on the main page (now in the drawer).
- None of those tools were run.

The 10 event cases (paket acara) are the next task, as the brief says.

## T-054a
QA added `server/src/acara/a01.expect.test.ts` (2 snapshots: public mission shape in id/en/zh, 11 verdict+score cases; appended to the server test script, about 0.7 s); values checked by eye, scoring is (correct - wrong)/required so 1 correct + 1 wrong = 0 and 1 option or 3 options = 0.5; speed bonus sits on top of 1000 so a perfect fast answer scores 1267 at 5 s.

## T-054 (2026-11-19): event case 1 "Setelah Api Padam" in the pixel style (Designer, step 1 of 10)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. shared/acara/* and server/src/acara/* are untouched (git status clean). Previews are in `character/acara-a01-t054/` (README): before = the old scene as SVG, after = PNG composed from the game's own grids.

**Case 1 only (scene art)**
- Files: `client/src/game/scenes/acara/a01.ts`, `a01.piksel.ts` (new), `a01.pemilik.ts` (new, generated), `client/src/game/art/piksel.ts` (new pixel-grid helper that outputs SVG rect runs with crispEdges; it uses the existing SVG rasteriser, so there is no new atlas or loader).
- **Background:** the burnt-but-safe fabric shop as a pixel grid of 160×120 cells (1 cell = 4 world units).
  - The same m03 geometry is kept.
  - Contents: soot tongues on the wall, a burnt shelf, the fire extinguisher, a photo, the rolled-up rolling door with an orange "TOKO KAIN" plate, the street outside, a cabinet with fabric rolls (one scorched), a tiled floor and the long table.
- **Props and cards:**
  - pixel lamp;
  - fabric pile;
  - five pixel action cards (camera, report sheet + orange check, screwdriver, bin with burnt goods, maroon "BUKA" sign).
- **Shop owner:** Pak Darto from the story side-character atlas, reduced 2:1, mirrored to face the table, head and collar. He moved to x 588 (right of the door) so the "TOKO KAIN" plate shows.
- **Unchanged:** option ids, labels (id/en/zh), slots, acakPosisi, behaviour and socket events.

**Engine (shared code, active ONLY for scenes that opt in; only case 1 does)**
- `SceneSpec.gaya: 'piksel'` (`client/src/game/types.ts`). MissionScene then draws:
  - square stepped label pills with a 4 px ink base;
  - square tap/pick markers;
  - a square focus ring;
  - an orange stepped frame (orange 8 + dark orange 4) with a check badge around each selected option.
- Selection rules are unchanged (max 2, tap again to undo).

**Shared chrome (all 10 event cases, scene art untouched for cases 2–10)**
- `MissionPlay` root gets `data-paket="acara"` for mission ids `aNN-*`. New `client/src/game/acara-piksel.css`, imported by MissionPlay:
  - the task card as a K1 stepped orange frame;
  - the scene in an ink pixel frame with a base;
  - the "Pilihanmu" chip and tool keys as pixel chips.
- On phones (≤899 px wide, ≤760 px tall) while answering, a compact layout: smaller title and prompt, one-line hint, first-visit tip hidden, 48 px send key.
- Practice missions, the tutorial and story activities do not change.
- The timer and keys were already pixel (T-030, header Timer).
- The projector shows the same scene art; its chrome already follows the `.proyektor` pixel rules.

**Fit by calculation (answering, one step)**

| Phone | Used | Spare |
| --- | --- | --- |
| 360×640 | 622 px | 18 px |
| 390×700 | 645 px | 55 px |

Before this change it was about 742 px at 360×640, so it scrolled. A transient "max 2" message can still push it a little past 640 while it shows.

**Next:** cases 2–10, one by one after the owner checks this one. The engine flag and the chrome are ready; each case needs only its art.

## T-054 Fix 1 (2026-11-19): case 1 reads as "after a fire", distinct shop owner, "max 2" message never adds height (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. shared/acara and server/src/acara are untouched. The updated preview is `character/acara-a01-t054/sesudah-adegan-a01-2x.png` (and `-1x.png`).

**Fire damage** (`client/src/game/scenes/acara/a01.piksel.ts`; not gory)
- The ceiling is blackened above the shelf, and layered black soot tongues rise from the shelf.
- The shelf posts and boards are charred, with burnt boxes. The top-left corner is blackened, and a thin smoke haze sits under the ceiling.
- Fabric rolls are charred on the cabinet and on the table pile, and a cooled burnt heap lies on the floor.
- The firefighters left water puddles on the floor.
- Soot also marks the left part of the rolled door and the back edge of the table.

The five cards are unchanged and fully readable.

**Shop owner**
- She is no longer Pak Darto. She is **Ibu pemilik toko kain**, a distinct person built from the story's side-character woman, with a maroon blouse and a cream shop apron with orange straps.
- Files: `client/src/game/scenes/acara/a01.pemilik.ts`, generated by `character/acara-a01-t054/pemilik.mjs`.
- Head and shoulders (29×30 cells), standing in the doorway at x 453, bottom y 120. She is not cut by the edge; the back-row cards are drawn over her lower shoulders.
- The "TOKO KAIN" plate moved to the left wall as a two-line plate.

**"Max 2" and other short messages** (`client/src/game/acara-piksel.css`, event cases only)
- `.misi-pesan` is absolutely positioned above the answer panel, over the bottom edge of the scene (the table front, where there are no cards).
- It never adds height, so the 360×640 / 390×700 fit stays at 622 / 645 px. It is still role=status.

## T-055 (2026-11-19): case 1 at Episode 1 pixel density + pixel player marker; Bu Isti result panel for all 10 event cases (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. shared/acara/* and server/src/acara/* are untouched. Previews are in `character/acara-t055/` (README): before = the owner's screenshots; after = the scene composed from the game's grids, plus a CSS-size mock of the result panel (desktop and 360 px).

**1. Case 1 finer pixels (case 1 only)**
- **Finer grid:** `client/src/game/art/piksel.ts` gets a subdivision factor `k`. Case 1 (`a01.piksel.ts`) now draws at k = 2: 1 fine cell = 2 world units, the story-room density, about 1 art px per CSS px on a phone.
  - Layout, cards, ids, labels, acakPosisi and the fire damage are unchanged.
  - Outlines, corners, soot, circles and lines are fine. "TOKO KAIN" and "BUKA" use a new fine 5×7 font (`teksHalus`), the fabric rolls have round ends, and the screwdriver is drawn with fine lines.
- **Shop owner:** at the atlas's native resolution, regenerated by `character/acara-a01-t054/pemilik.mjs` (K=1, 60 rows, apron at double detail).
- **Player marker:** a pixel officer (`client/src/game/art/heroPiksel.ts`: the T-052 AvatarPiksel portrait grid plus body, belt, trousers and shoes, outlined, 3 world units per cell, shown ×0.8).
  - `engine/stage.ts` uses it for every pose when `SceneSpec.gaya === 'piksel'`, so only case 1.

**2. Result panel (all 10 event cases; one component)**
- **Routing:** `HasilMisi` (MissionPlay.tsx) hands `aNN-*` missions to the new `client/src/game/HasilAcara.tsx` with the SAME props and data (nilaiMisi / statusMisi / judulHasil, points, aksi, catatan). Practice and old room missions keep the old panel.
- **Layout:**
  - Bu Isti as a 40×40 PIXEL portrait shown at ×2 = 80 px (`client/src/cerita/seni/piksel/ikon-isti-juri.png`, from her pixel sheet by `character/acara-t055/isti-piksel.mjs`), in a speech-bubble header with the verdict title.
  - A verdict chip in status colours (green / dark orange / brick, with icon and word) and an orange pixel points badge.
  - "Sudah tepat", "Masih terlewat" / "Yang tepat" and "Kamu pilih" as compact icon lists, one item per line.
  - "Intinya" as a note-tint card with a lamp icon.
  - The long reasons folded behind a "Kenapa begitu?" pixel key (the folded content scrolls inside, max 40vh).
- **Reading comfort:** 16 px, line height 1.5, about 60 characters per line.
- **Strings:** only existing keys, so id/en/zh are covered.
- **Fit by calculation:**
  - Desktop: about 450 px.
  - Phone 360×640: 540 px, or 576 px with the sub line. Both lists share one frame there and the "Intinya" label sits inline.
- **Styles:** `client/src/game/hasil-acara.css`.

**Risks:**
- Tests that look for the old result markup in event cases (`.hasil-daftar`, `.hasil-inti`, the round `PotretTokoh` isti) or for the old case 1 texture keys will need updating. None were run.
- Server ranking, points and answers are untouched.

## T-057 (2026-11-19): projector winners screen = concept A "Panggung podium" (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. Previews of the built geometry, final state, are in `character/proyektor-t056/`: `bangun-a-10-pemain.png` and `bangun-a-2-pemain.png` (static, drawn from the CSS numbers, not screenshots).

**What was built**
- **Files:** `client/src/pages/proyektor/PanggungJuara.tsx` and `panggung.css` (new). `client/src/pages/Projector.tsx`: the FINISHED state renders `<PanggungJuara rows={room.podium ?? leaderboard} …/>` full-bleed under the status bar. The old chibi trio (Bu Isti / Mr Roger / Miss Raksa), the rank-1 box, the "10 besar" table and the generic Confetti on FINISHED are gone.
- **Stage:**
  - Maroon curtain stage with a bulb valance, a soft spotlight cone that widens for rank 1, plank floor and pixel confetti.
  - 2-1-3 podium blocks (gold / silver / bronze) with each player's T-052 pixel officer (kisiHeroPiksel, 8 px per cell for rank 1 and 7 for the others), rank, name, points, prize label and "peringkat seri" when tied.
  - Miss Raksa (pixel sprite) announcing in a stepped bubble: "Selamat, para juara!", later the thank-you line. Mr Roger is removed.
  - Ranks 4–10 side list with 48 px AvatarPiksel faces.
- **Reveal** (README A):
  - 2.0 s: rows 4–10, 150 ms apart, each with "tik".
  - 4.0 s: rank 3 ("podium"). 6.0 s: rank 2 ("podium").
  - 6.7 s and 7.5 s: drum roll.
  - 8.5 s: rank 1, confetti, fanfare, then the confetti sound 0.3 s later.
  - 11 s: thank-you line.
  - Reduced motion: all at once plus one "chime", with still confetti.
- **Sounds:** 4 new ORIGINAL synth cues in `client/src/audio/audio.ts` (`drum`, `podium`, `fanfare`, `chime`; each ≤0.85 s, the drum roll is played twice). They go through `playSfx`, so mute and the effects toggle are respected.
- **1–3 players:** only filled blocks, centred. No side list when nobody is 4th or lower. Ranks and ties are taken as the server sends them.
- **No protocol change.** Strings: the new `layar.panggungSelamat` and `layar.panggungLain` in id/en/zh; the others are existing (`layar.juara`, `nPoin`, `peringkatSeri`, `terimaKasih`, `belumAdaHasil`).

**Sizes (by calculation)**
- The stage is a fixed 1920×1016 box scaled whole into the space under the status bar (≈64 px at full width), so the page never scrolls.
- 1920×1080: scale ≈1.0. Title 64 px, block names 40 px, points 30 px, side list 32 px.
- 1366×768: scale ≈0.68 (title 44, names 27, list 22).
- 1280×720: scale ≈0.63 (title 40, names 25, list 20).

**Risks**
- Tests or tools that looked for the old FINISHED markup (`.pj-podium`, `.pj-tiang`, the Leaderboard table on the projector, the CEO speech) will need updating. None were run.
- The SpriteTokoh size is computed for an unscaled page, so inside the scaled stage Miss Raksa is resampled at non-integer scales on 1366/1280 (nearest neighbour, still pixel-sharp).

## T-058 (2026-11-19): Miss Raksa expressions on the home page + pixel Join Game icon (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt.

**What changed**
- New `client/src/art/IkonMissPose.tsx` + atlas `client/src/cerita/seni/piksel/ikon-miss-pose.png` (376×60, 4 KB), generated by `character/beranda-ekspresi-t058/ikon.mjs` from Miss Raksa's in-game pixel atlas (`miss-raksa.png/.json`: body frame + expression face cell, the same pixels as the story). Each icon is a crisp pixel bust (3:2 area-weighted reduction, drawn at 1 art px = 1 CSS px, `image-rendering: pixelated`) on a cream disc with the same baked 2-tone orange pixel ring.
- One pose per spot, sizes as before, no layout change:
  - Greeting bubble (`WelcomeArt`, 60 px): `sapa`, big smile + open palm welcome.
  - Mode Cerita card (`Landing`, 60 px): `kasus`, focused/serious, pointing at a yellow claim folder.
  - Join Game (`JoinGame`, 60 px; 30 px on phones via `.lp-join-ikon-kecil` in player.css) and the story-room join page (`StoryJoin`, 56 px): `telepon`, smiling with the phone at her ear. Replaces the old vector helmet surveyor (still the fallback when Miss Raksa is inactive).
  - Mission guide slot (`MissionPlay`, 44 px, the "how to play" spot): `jelaskan`, explaining.
  - `prihatin` (concerned) is in the atlas for error/empty states; no Miss Raksa error spot exists on these pages today (connection errors use Bu Isti), so it is not wired yet.
- Previews in `character/beranda-ekspresi-t058/`: `ikon-miss-pose-8x.png` (all icons, 8×) and `sebelum-sesudah.png` (owner screenshots left, the same crops with the new icon pasted right; static, not a browser screenshot).

**Notes / risks**
- The expression sheet `miss-raksa-pixel-expressions-v1.png` faces are the ones already cut into the atlas (netral/senyum/prihatin/serius/lega); there is no "finger up" frame, so "explaining" uses the open-palm `duduk-jelaskan` frame.
- On fractional DPR (e.g. 1.25) the 1:1 icon is resampled by the browser with nearest neighbour (still sharp, slightly uneven pixels).
- Tests/selectors looking for `.potret-surveyor` or `.tokoh-potret` inside the home cards will need updating. None were run.

## T-058 Fix 1 (2026-11-19): pose icons read too small (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt.

- **Tighter crop:** head and shoulders only. The face (brows to chin) now fills about 50% of the icon height, measured on the generated atlas: sapa 50%, kasus 50%, telepon 52%, jelaskan 48%, telepon56 52%, telepon30 47%, prihatin 50%. Before Fix 1 it was about 1/5.
  - Window is 70/size art px per icon px (≈1.17:1 at 60 px). Each icon pixel takes the colour covering most of its cell, with no blended colours. Shown at 1 CSS px per pixel with `image-rendering: pixelated`.
  - The atlas head is about 60 art px tall, so 1:1 overfills the icon and 2:1 leaves a tiny face; neither integer step hits the target.
- **Props only where they fit:** phone at the ear (Join Game), folder corner bottom-right (Mode Cerita). The welcome hand sits at chest height in the atlas frame, so it is outside the head-and-shoulders crop; the greeting is carried by the big smile.
- **Expressions per spot:**
  - Greeting: `senyum`, big smile.
  - Mode Cerita: `serius`, focused.
  - Join Game: `lega`, cheerful, with the phone.
  - Guide: `senyum`, explaining.
  - `prihatin`: ready for error states.
- **One ring:** the orange pixel ring is gone. Each icon bakes in the same frame as the other round portraits (`.tokoh-potret`: disc #fbefd0, 2 px white inner ring, 1 px #e2d6ad line). The page has no outer circle around these icons; the double ring in the earlier preview came from pasting over the old screenshot.
- **Unchanged:** sizes, layout and code paths. Only the atlas PNG `client/src/cerita/seni/piksel/ikon-miss-pose.png` and the component comment changed.
- **Previews in `character/beranda-ekspresi-t058/`:**
  - `sebelum-sesudah.png`: the old portrait is cleared and the icon is drawn at the screenshots' ~1.1 zoom.
  - `ikon-miss-pose-8x.png`.

## T-059 (2026-11-19): projector in-match screens, friendly and pixel (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt.

**What changed**
- **New files:** `client/src/pages/proyektor/PanggungRonde.tsx` and `ronde.css`, plus `isti-piksel.png`. The PNG is Bu Isti full body in two pixel frames, "hands clasped" and "waving", 86×107. It is made by `character/proyektor-t059/isti-badan.mjs` from her pixel sheet.
- **Projector.tsx:** BRIEFING, ACTIVE, REVEAL and LEADERBOARD now render `<PanggungRonde/>` full height under the slim status bar, using the same `pj-akhir` layout as the T-057 podium. Removed: the old panels, the big CityMap "Perjalanan misi" panel, the chibi Bu Isti / Miss Raksa / Raki bubbles, the Leaderboard table and the progress panel. The lobby (QR) screen is unchanged.
- **Stage:**
  - A fixed 1920×1016 box scaled whole, like T-057: ×1.0 at 1080p, ×0.68 at 1366×768, ×0.63 at 1280×720. No scroll.
  - Warm claim-office backdrop: cream wall, wood rail and wainscot, plank floor, and white pixel cards with a 6 px dark edge.
- **Menjawab:**
  - Left: the case scene, large (1000 px wide).
  - Right: mission title (56 px), story clamped to 2 lines (32 px), the instruction in a big orange card (40 px), and a 24-segment pixel time bar with large seconds.
  - Below that: "X / N sudah menjawab" (40 px) and the pixel faces of players who have sent, which pop in. No answers are shown. A light "tik" plays when a new answer arrives.
  - During BRIEFING the instruction card is replaced by Miss Raksa's pixel sprite with the briefing in a bubble, plus "Adegan siap".
- **Pembahasan:** the scene with the correct marks (as before); pixel Bu Isti with the "Yang dibawa pulang" bubble (32 px); up to 3 correct answers as green check cards (32 px); the explanation in a smaller line, clamped to 2 lines.
- **Peringkat:**
  - Top 10 as pixel rows (64 px): rank box, T-052 face, name (38 px), ▲/▼ from `delta`, and points counting up over 0.9 s. There is no "new" arrow because that is not in the data.
  - Round summary card: sent X/N, average accuracy, and the fastest player from `submitElapsedSeconds` when present.
  - Waving pixel Bu Isti with the existing one-line `tokoh.isti.ringkasan`.
- **Perjalanan misi:** a small pixel strip in the top-left corner with 10 stops (done = green ✓, current = orange) and the location name.
- **Strings:** new `layar.sudahMenjawab`, `menungguJawabanPertama`, `jawabanTepat`, `tercepat`, `rataKetepatanPendek`, `terkirimDari` in id/en/zh.
- **Data and motion:** no protocol change. Reduced motion means no pop-in, slide or count-up animations.
- **Previews in `character/proyektor-t059/`:** `sesudah-menjawab.png`, `sesudah-pembahasan.png`, `sesudah-peringkat.png`. They are static, drawn from the CSS geometry with example data. The scene image is the T-055 case-1 render, and the pixel font only approximates the real web font.

**Notes / risks**
- Long text is clamped or clipped inside the stage rather than scrolled. Height budgets are written in comments in ronde.css.
- The scene inside the scaled stage keeps its Phaser/image size logic at 1000 px wide (4:3 gives 750 px tall). Scenes with a different aspect are centred and clipped by the card.
- Tests or selectors that target the old in-match markup will need updating: `.pj-titik`, `.pj-kirim`, the projector Leaderboard and CityMap panels, and the `pj-juri`/`pj-ceo` chibis. None were run.

## T-060 (2026-11-19): event mission phone screens without scrolling (all 10 cases)

Owner (iPhone, live 05c807a): the case-1 result scrolled (title, 190 px Bu Isti, verdict card, lists, Intinya, Kenapa, "Peringkat sebentar lagi", then the scene below the fold). Shared fix for all 10 cases; desktop, landscape phones and solo practice (`.solo-layar`) unchanged. Scene art (`scenes/acara/a0N*.ts`) and `shared/acara/*` untouched.

- **Layout** (`client/src/game/acara-piksel.css`, block "T-060"): on portrait phones / tablets the event page (`.player-ui.kompak` with `.misi[data-paket="acara"]`, not solo) is one `100dvh` flex column. Header, task card, panel and submit bar take their height; the SCENE takes the rest (`container-type: size`, frame 4:3, `width = min(100cqw, 100cqh * 4/3)`, never narrower than 160 px so the stage resize stays sane) and is hidden when less than 72 px is left (`@container`). If a text were longer than calculated, the scene reaches 0 first and only then the page scrolls (nothing clipped). The submit bar is no longer sticky (it is the last flex item); `env(safe-area-inset-bottom)` kept; `dvh` follows Safari's toolbars.
- **Answering:** round title hidden (timer in the header, title in the briefing); compact task card (step dots without text, prompt 16 px, the generic hint only when the step is answered in the scene: `data-di-adegan`, tools row 40 px); panel controls compact: choices 44 px / 14 px, number chips 3 per row, assign tabs = numbered chips (`.item-chip-no`, label stays the accessible name and is shown in "Kategori untuk" on one line), progress "n/m" at the end of the tab row (`.item-hitung`, the separate status chip is hidden for assign), multi slots 40 px; submit key 48 px. On screens <= 660 px tall the grey sentence under the key is hidden (still its aria-describedby); "Lewati dulu" / "Waktu hampir habis" stay.
- **Result** (`client/src/game/HasilAcara.tsx`, `hasil-acara.css` "T-060"): one row = Bu Isti 44 px + verdict chip + points (the verdict sentence and "Bu Isti · Juri" stay for screen readers); each list max 3 one-line items + "+n lagi di bawah", the full lists then also in the "Kenapa" fold (`misi.lainDiKenapa`, `misi.daftarLengkap`, id/en/zh); Intinya card; one footer row = "Kenapa ini tepat?" key + the small leaderboard note (Play's `catatan`, no separate line); the opened fold scrolls inside (`34dvh`). The scene below is a full-width strip (middle band) in the rest of the height, hidden under 72 px; the legend is off on the phone result (marks are in the lists).
- **Briefing / waiting:** panel first (compact text), scene strip in the rest.

**Fit table** (calculation from the CSS heights + the Indonesian text lengths of each case, longest step; header 56 px; scene = width x height that is left; result = all correct .. worst partial with three lists; strip 0 = hidden):

| case | 360x640 answering (content, scene) | 360x640 result (content, strip) | 390x700 answering | 390x700 result |
|---|---|---|---|---|
| a01 multi | 443, scene 244x183 | 372..432, strip 248/194 | 459, 303x227 | 372..432, 270/254 |
| a02 multi | 489, 183x137 | 392..452, 234/174 | 505, 241x181 | 392..452, 270/234 |
| a03 assign | 539, 116x87 | 412..492, 214/134 | 549, 183x137 | 412..492, 270/194 |
| a04 single (step 3) | 537, 119x89 | 413..473, 213/153 | 553, 177x133 | 392..452, 270/234 |
| a05 assign | 521, 140x105 | 454..534, 172/92 | 516, 227x170 | 454..534, 232/152 |
| a06 assign 5x5 | 597, scene hidden | 433..533, 193/93 | 613, 97x73 | 412..512, 270/174 |
| a07 single (step 2) | 579, hidden | 412..492, 214/134 | 580, 141x106 | 412..492, 270/194 |
| a08 single (step 2) | 591, hidden | 454..594, 172/0 | 589, 129x97 | 433..573, 253/113 |
| a09 number | 471, 207x155 | 413..473, 213/153 | 487, 265x199 | 413..473, 270/213 |
| a10 assign 4x5 | 619, hidden | 433..633, 193/0 | 632, 72x54 (hidden) | 433..633, 253/0 |

Briefing at 360x640: 426..483 px content, strip 143..200 (a09 has the longest story).

**Cannot show the scene while answering at 360x640** (content still fits, no scroll): a06 (5 parts x 5 order numbers), a07 / a08 step 2 (four long answer sentences, 50..112 chars), a10 (5 buckets of up to 64 chars). The answer lists themselves need the height; the scene is hidden there and "Dokumen" / "Cerita" stay one tap away. At 390x700 they show a small scene except a10 (72x54, hidden).

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy. Heights are calculated, NOT measured in a browser or on a phone. Not committed.

## T-061a (2026-11-19): event cases 2, 3 and 4 in the case-1 pixel style (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. The only size warning is Phaser's chunk, which was there before. The scene chunk is 129 kB (48 kB gzip).

**Scope kept**
- Only scene files changed, under `client/src/game/scenes/acara/`.
- Untouched: MissionPlay, HasilAcara, the hasil/acara CSS, the engine, `shared/acara/*` and `server/acara/*`.
- Option ids, positions, `acakPosisi` slots, hit areas, `labelDy`, labels (id/en/zh, the `aNN.label.ts` files are unchanged), the a04 notes board, behaviour and the answer key are all unchanged.

**Files**
- **New helpers:** `rle.ts` (compact pixel grids) and `piksel-umum.ts` (crate with damage states, 3×5 mini digits, extra 5×7 glyphs C/D/M/P/R/5, floor shadow).
- **New pixel art:** `a02.piksel.ts`, `a03.piksel.ts`, `a04.piksel.ts`.
- **Generated, do not edit:** `a02.gen.ts`, `a03.gen.ts`, `a04.gen.ts`, `truk.gen.ts`, from `character/acara-t061/bangun.mjs`.
- **Rewritten:** `a02.ts`, `a03.ts`, `a04.ts`. All three now set `gaya: 'piksel'`.

**Per case**
- **a02 parkiran:**
  - Background: the Episode 1 story parkiran with its baked-in van painted out, plus a front pavement.
  - Truck: the Episode 2 trailer with an orange courier band.
  - Courier: a new person from the side cast "tol", with an orange cap.
  - Objects: six pixel photo objects.
- **a03 bengkel:** the Episode 2 bengkel; a pixel teal hatchback with the rear-right dent; the photo line; four identical polaroids. The contents are A whole car, B dent close-up, C plate "B1703", D selfie.
- **a04 pelabuhan:**
  - Background: the Episode 2 pool yard with harbour cranes, containers and gulls added behind the fence.
  - Truck and driver: the same truck stands at the left (it was part of the old m06 background). The driver is a new person from the side cast "polisi", recoloured to a teal work shirt and navy cap, with the worried face.
  - Objects: 21 crates with the same numbers and damage (#3, #9, #15, #20); the six-photo board, shipping list and stamped receipt; four identical pixel action boards.
- **Cast:** no Darto or Hendra.

**Previews** (`character/acara-t061/`, see README):
- Before: `sebelum-a0N.svg`. This is SVG because nothing can rasterise vector art without a browser, the same as T-054.
- After: `sesudah-a0N-2x.png`, painted from the real scene specs.

**Risks**
- **Pixel-font glyphs:** HURUF_HALUS only has A B I K N O T U. Any new in-scene text must use `teksBesar` (piksel-umum.ts) or add glyphs; T-061b/c should reuse it.
- **a02 background:** a faint stray parking-bay line from the story background remains between the truck and the crate stack.
- **a04 truck:** the trailer's rear is cut off straight where the crate stack starts.
- **Not checked in a browser:** Phaser label positions and the photo/tag effects in the pixel style. The engine already handles `gaya: 'piksel'` generically.

## T-061b (2026-11-19): Fix 1 for cases 2-4, then event cases 5, 6, 7 in the case-1 pixel style (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt.

**Scope kept:** only scene files in `client/src/game/scenes/acara/` and the generator/previews in `character/acara-t061/`. Untouched: `shared/acara/*`, `server/acara/*`, MissionPlay, HasilAcara, hasil-acara.css, acara-piksel.css and the engine. Ids, positions, slot shuffling, hit areas, labels (id/en/zh), categories, behaviour and the answer key are unchanged; only the label anchors (`labelDx` / `labelDy`) moved.

**Fix 1: labels (cases 2-4)**
- **Cause:** the clipped pills in the T-061a previews came from the preview itself (too wide, wrong place). Even so, a few real pills were tight or past the edge:
  - a04's action-board pills ended at y 481.
  - Several right/left pills relied on the engine's 6-unit side clamp.
- **Check:** `character/acara-t061/cek-label.mts` mirrors MissionScene: width = text + 44, centre `(x + labelDx, y + h/2 + 18 + labelDy)`, 34 high + 4 base. It uses a conservative per-character width and checks id/en/zh. It now reports every label of a02-a07 at least 8 units inside the scene, with no overlaps.
- **Anchors moved:**

| Case | Label | Change |
| --- | --- | --- |
| a02 | Selfie kurir | `labelDx +45` |
| a02 | Label peti | `labelDx -24` |
| a02 | Tumpukan peti | `labelDx -16` |
| a04 | Foto peti | `labelDx -21` |
| a04 | Bukti terima | `labelDx -21` |
| a04 | Action boards | `labelDy -10` |
| a05 | Lanjut dinilai | `labelDx +3` |
| a06 | Item label rows | top `-25`, bottom `+21` (the old bottom row ended at y 480) |
| a07 | Polis A/B/C | `labelDy -24` |
| a07 | Kardus basah | `labelDx +33`, `labelDy -10` |

- **Previews:** they now draw the pills where the engine puts them.

**Fix 1: truck (cases 2 and 4)**
- The Episode 2 trailer is the story's crashed truck. In `bangun.mjs` the smashed windshield is repainted as clean glass and the crumpled bumper replaced with a straight one before the 2:1 reduction (`truk.gen.ts`).

**Cases 5-7**
- **a05 (office):**
  - Background: the Episode 2 office wall (`a05.gen.ts`) above a pixel desk seen from above, with the stamp rack, three work mats and a tiled floor (`a05.piksel.ts`).
  - Objects: three pixel stamps (✓ / ✕ / ?, same ink colours), identical case folders A-C, and identical upright policy cards.
- **a06 (heavy-equipment warehouse):**
  - Background: pixel warehouse with m08 geometry (`gudang.piksel.ts`).
  - Props: a pixel forklift GT-220, the bent rack, a clock and five equal action items (`a06.piksel.ts`).
  - Warehouse head: a new person from the side cast "bima", with a yellow helmet, orange hi-vis vest and worried face (`a06.gen.ts`).
- **a07 (flooded warehouse):**
  - Background: pixel warehouse with m07 geometry, including the waterline, the flooded street with sandbags, the wet shelf boxes, the floor puddle, the mop and bucket, and the dry table with its card rack.
  - Objects: identical stone-grey binders, identical policy cards, the text-free incident report and the wet boxes (`a07.piksel.ts`).
- **Font:** `teksBesar` (piksel-umum.ts) now carries the full 5×7 font (A-Z, 0-9 and punctuation from the T-053 wireframe font), so no in-scene text depends on the 8-letter `HURUF_HALUS`.
- **Previews** (`character/acara-t061/`, see README):
  - Before: `sebelum-a05..a07.svg`, from the committed vector scenes via `git show HEAD`.
  - After: `sesudah-a02..a07-2x.png`.

**Risks**
- The pill widths are estimates; the real font may be narrower, which only adds margin.
- In a06 the top-row pills now cover the items' base strip.
- The a05 policy cards have lost their tilt and the "POLIS" word, because the 5×7 letters do not fit on a 64-unit card.
- Not checked in a browser.
- Cases 8-10 follow as T-061c, using the same helpers: `gudang.piksel.ts`, `piksel-umum.ts`, `rle.ts`, `bangun.mjs` and `cek-label.mts`.

## T-061c (2026-11-19): event cases 8, 9, 10 in the case-1 pixel style + leftover scan of all 10 cases (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt.

**Scope kept**
- Untouched: `shared/acara/*`, `server/acara/*`, MissionPlay, HasilAcara and the result/acara CSS.
- Unchanged: ids, labels (id/en/zh), categories, behaviour and the answer key. Only label anchors moved where `cek-label.mts` required it.
- `cek-label.mts` now covers cases 2-10. Result: every label is at least 8 inside the scene with no overlaps, in id, en and zh.

**Case 8: Lini Masa Excavator (proyek)** — `a08.piksel.ts`, `a08.gen.ts`
- **Background:** the project site with m04 geometry: sky, distant city, barricades, ground, excavation pit, cones and new road.
- **Excavator:**
  - EX-2085 is drawn as pixel layers on a world canvas, using the same pivot and -9° tilt as m04: body, track, boom, cracked glass, open engine bay, worn tread and leaking hose.
  - Each layer is cut at the same box `potong()` used (`potongDunia`), so part positions shift by at most 2 world units and stickers and labels stay where they were.
  - The damage is neutral, as before: boom dent, cracked windshield with a hole, open engine bay, shiny worn tread, oil drips and a puddle.
- **Operator:** a NEW person from the side cast "tol", with a yellow helmet, blue shirt and vest, holding the teal service book.
- **Report:** a pixel clipboard.
- **Labels:** Buku servis `+49/-6`, Laporan `-23`, Track shoe `-8`.

**Case 9: Hitung Berlapis (kantor-hitung)** — `a09.piksel.ts`
- **Background:** the counting office with m09 geometry: wall, chalk ledge under the engine board, clock, window, desk with lamp, calculator, file pile and pencil cup, and a wood floor.
- **Objects:** the estimate clipboard (orange strip and wrench badge) and the HVC policy card, drawn as equals, plus the miniature excavator on its stand.

**Case 10: Banjir Susulan (kota-banjir)** — `a10.piksel.ts`
- **Background:** the flooded business complex with m10 geometry, including the "KOMPLEKS USAHA" sign (widened so the 5×7 letters fit), the P sign, sandbag dike and dry road.
- **Four equal flooded cases:** van, excavator, warehouse and pallet, each with the same blank ID plate. The pallet crates carry no numbers, so they give no hint.
- **Other objects:** the policy cards reuse the case-7 pixel card (only the letter differs), and there is a rubber boat with a waving staff member in a life vest.
- **Shared helper:** `excavatorSamping()` serves both case B and the case-9 miniature.

**Leftover scan of all 10 cases**
- **Scene files:** all 10 use `gaya: 'piksel'`, and no vector kit art or `personArt` remains. The remaining m04, m05, m08 and m09 imports are geometry only (positions, ink colours, board size).
- **Found and fixed in the engine** (`MissionScene.ts`, only when `gaya === 'piksel'`, via a new `kotakPiksel()` stepped box; the practice missions are unchanged):
  - the document marker (cases 4, 5, 7, 8, 9, 10);
  - the notes boards (cases 4 and 9);
  - category stickers (cases 3, 5, 6, 7, 8, 10), which are now upright;
  - verdict pills at review;
  - action captions;
  - the photo fly-in polaroid (case 2), now upright;
  - the pause overlay pill.
- **Found and fixed in the art:** the case-10 pallet crate numbers (a possible hint) are removed.
- **Found, not fixed:** in case 4 the engine's notes board (top-left, x 4-240) covers most of the harbour cranes added in T-061a, so the port is read mostly from the containers. Moving the cranes to the right means redrawing the warehouse side, which is left as a possible follow-up.

**Previews** (`character/acara-t061/`)
- Before: `sebelum-a08..a10.svg`, from HEAD via `sebelum-c.mts`.
- After: `sesudah-a02..a10-2x.png`. The preview now draws the engine boards dark and centred, as in the game.

**Risks**
- None of this was checked in a browser.
- Engine change: the shapes above changed only for the 10 pixel-style cases.
- `scenes.test.ts` rules were kept: background 640×480, unique art keys, all options shown and identical slot sizes. Not run, by the owner rule.

## T-062 (2026-11-19): URGENT fix of T-060 - event scene collapsed to a thin sliver on phones

- **Root cause:** stage.css gives `.misi` `align-items: start` (meant for its grid). T-060 made `.misi` a flex COLUMN, where that value aligns the CROSS (horizontal) axis, so every child shrank to fit its content; the scene box has `container-type: size` (size containment = 0 intrinsic width), so it became ~6 px (its padding) and clipped the canvas, and the panel / submit bar went narrower than the screen.
- **Fix** (`client/src/game/acara-piksel.css`, T-060 phone block): `.misi-main` and `.misi` `align-items: stretch; width: 100%; box-sizing: border-box`; task card, scene box, panel and submit bar `align-self: stretch` (panel and bar `width: 100%`). Scene width now `min(100%, max(min(100%, 300px), (100cqh - ket) * 4/3))`: taken from the real box, height-based shrink only down to a hard floor of min(100%, 300 px); below that the frame is clipped as a strip instead of shrinking, so a wrong container size can never give a tiny canvas. The stage already sizes from its parent clientWidth (min 200) with a ResizeObserver on that parent (engine/stage.ts), no change there. Desktop / landscape / solo untouched (block is portrait < 900 px, event page only).
- Effect on the T-060 fit table: scenes that were calculated narrower than 300 px (a02..a08 at 360x640, a06 / a08 / a10 at 390x700) now show a 300 px wide frame clipped to the free height (still hidden under 72 px); all content heights unchanged, still no page scroll by calculation.

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy. Not tested in a browser or on a phone. Not committed.

## T-063 (2026-11-19): event scene clipped at the bottom on phones (objects untappable)

- **Cause:** the T-062 floor (min 300 px wide) made the frame taller than its box whenever the panel grew (each pick added a 2-line row); `overflow: hidden` cut the lower third (Selfie kurir, Sisi penyok, Label peti).
- **Never clip** (`client/src/game/acara-piksel.css`): the frame is CONTAINED: width = min(100%, box height x 4/3). While answering the box has `min-height` = a 260 px wide frame (`min(100vw - 30px, 260px) x 3/4 + 10`) and the frame uses max(that floor, height x 4/3), so it always fits; if the column has no room the PAGE scrolls (scroll beats untappable). Briefing / waiting / result: contained in the rest of the height, hidden under 72 px (no strip crop any more).
- **Height won back while answering** (`MissionPlay.tsx` + CSS): picked items one line 36 px (number, icon, label with ellipsis, icon-only remove 36 x 36 with the existing aria-label "Batalkan ..."); "Pilih lewat daftar" = small text button in the album header next to the count (`.baki-daftar-tombol`, same open state, aria-expanded / aria-controls; the 48 px summary row hidden there); task card = prompt + ONE row with the hint (ellipsis) and icon-only tool chips 44 x 44 (labels in `.alat-teks` stay the accessible names); the grey sentence under "Kirim laporan" is gone (still the key aria-describedby), the row only shows when "Lewati dulu" / time buttons are there. Elsewhere (desktop, landscape, solo, cerita) the new button and spans are hidden / unchanged.

**Answering fit at max picks** (calculated from the CSS and the id texts; header 56; scene = width x height; page scroll = how far the page scrolls when the scene is at its 260 px floor):

| case (worst step) | 390x664: scene width x height | 390x664 page scroll | 360x560: scene | 360x560 page scroll |
|---|---|---|---|---|
| a01 (tindakan multi) | 360 x 270 | none | 260 x 195 (floor) | 17 px |
| a02 (bukti multi) | 322 x 242 | none | 260 x 195 (floor) | 57 px |
| a03 (fungsi assign) | 260 x 195 (floor) | 51 px | 260 x 195 (floor) | 161 px |
| a04 (tindak single) | 260 x 195 (floor) | 55 px | 260 x 195 (floor) | 159 px |
| a05 (simpul assign) | 260 x 195 (floor) | 18 px | 260 x 195 (floor) | 143 px |
| a06 (urutan assign) | 260 x 195 (floor) | 115 px | 260 x 195 (floor) | 219 px |
| a07 (alasan single) | 260 x 195 (floor) | 82 px | 260 x 195 (floor) | 201 px |
| a08 (simpul single) | 260 x 195 (floor) | 91 px | 260 x 195 (floor) | 213 px |
| a09 (dasar number) | 274 x 206 | none | 260 x 195 (floor) | 93 px |
| a10 (temuan assign) | 260 x 195 (floor) | 134 px | 260 x 195 (floor) | 241 px |

- Target >= 330 px at 390 px: a01 360 px; a02 (3 picks) 322 px. The single / assign / number steps answer in the panel lists (2-line answer sentences, 3..5 buckets), so at 390x664 they keep the scene at the 260 px floor and the page scrolls 18..134 px; at 360x560 every case scrolls (17..241 px). Nothing is clipped any more.

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy. Heights calculated, NOT measured in a browser or on a phone. Not committed.

## T-065 (2026-11-20): Episode 1 Dev "Kenalan Raksa", plan Task 2: ArenaPolaDashcam + coach cards (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. The full Episode 1 is unchanged: no file under `episode/auto-2` was touched, and the shared files only gained a dashcam branch and opt-in coach cards.

**Contract.** The arena uses Task 1's `KonfigArena` `pola: 'dashcam'` type from `cerita/tipe.ts` (`langkah`, `item`, `benda`, `tepat: 'mobil'`, `bersih`, `ragu`). I did not edit `tipe.ts`. The answer is recorded as `tetapkan(jawaban, konfig.langkah, konfig.item, bersih | ragu)`, which for Auto 2 Dev means `akt:dashcam:taruh:rekaman:<bersih|ragu>`, matching node `kdash`.

**Files**
- **New:**
  - `client/src/cerita/hp/arena/ArenaDashcam.tsx`
  - `client/src/cerita/hp/arena/dashcam.css`
  - `client/src/i18n/kamus/dashcam.ts` (id/en/zh)
- **New art:** `client/src/cerita/seni/aktivitas/dashcam/*.png`:
  - `mobil-atas` 26×44
  - `truk-kecil-atas-nyala` / `-mati` 32×58 (two hazard-light frames)
  - `truk-miring` 75×133 (the Episode 1 top-down truck rotated -16° by nearest neighbour, crumpled front-left)
  - `pembatas` (guardrail tile)
  - `serpih` (debris)
- **Sources:** `character/dashcam-t065/bangun.mjs` (sprites) and `pratinjau.mjs`, which writes `bingkai-dashcam-3x.png` (frames 1/2/3, frame 3 = freeze frame with the tap rings).
- **Modified:**
  - `hp/arena/Arena.tsx`: the dashcam branch. The context block and the list-view toggle are hidden as for SIM, and `episode={ep.id}` is passed to the coach.
  - `hp/arena/Pandu.tsx`: `kdash` added to the guided steps and coach cards, and a special card for SIM in `auto-2-dev`.
  - `i18n/kamus/langkah.ts`: `kdash.*` and the two coach texts.
  - `i18n/kamus/index.ts`: registers `dashcam`.

**What it does**
- **Scene:** K08 lane-scene style: the same road strip and top-down truck, 1 art px = 1 CSS px, with the 278 px road centred in the 236 px scene.
- **Replay, CSS, 6 s:**
  - The road scrolls.
  - 1.5-3 s: the small car moves from lane 3 into lane 2 in front of the truck.
  - 3-4.5 s: the truck swerves left and hits the guardrail and the stopped small truck (hazard lights blinking). It swaps to the pixel-rotated crashed sprite and debris appears.
  - Then the frame freezes.
- **Tapping:**
  - The three tap targets (car 48×52, small truck 48×70, truck 68×114) only appear in the frozen frame, so taps during the replay are ignored.
  - They show a dashed yellow pixel ring, and a solid orange ring on keyboard focus.
  - "Putar lagi" always restarts the replay.
- **Reduced motion:** three still frames with a caption and "Lanjut"; frame 3 is the answerable freeze frame.
- **Outcome:**
  - Car on the first try: correct feedback plus the note "we still check signs and witnesses", recorded `bersih`.
  - First wrong tap: a short hint per vehicle and "Putar lagi" highlighted.
  - Second wrong tap: the explanation, recorded `ragu`.
  - Car after one wrong tap: correct feedback, recorded `ragu`.
  - Then the normal Kirim button.
- **Coach cards:**
  - `kdash`: "Tonton rekamannya, lalu ketuk penyebabnya." It shows once per device and closes itself after 5 s.
  - `ksim` in `auto-2-dev`: its own SIM how-to text, with a separate "seen" key from the full episode, also closing after 5 s.
  - The full-episode cards are unchanged.
- **Readability:** body 17-18 px, in-scene labels at least 14 px, buttons and targets at least 48 px.

**Open points**
- Task 1's konfig carries `tanya: 'arena.dashcam.tanya'`. The arena does not read it; its prompt comes from the `dashcam` kamus, and the same goes for "Putar lagi" and the feedback. Task 1 may drop its duplicate dashcam UI keys or keep them for the list view.
- The arena has no list view of its own; the toggle is hidden, as for SIM.
- Fit on a 360×640 phone is calculated, not measured: scene 236, controls 48, feedback about 80, Kirim bar. The longest zh/en feedback may need the arena to scroll by one line.
- Not checked in a browser. Mid-replay rotation uses a CSS rotate, which is briefly not pixel-exact; the frozen frame uses the pixel-rotated sprite.

## T-064 (2026-11-20): Episode 1 Dev "Kenalan Raksa" - plan Task 1 (Fullstack)

Spec `docs/superpowers/specs/2026-11-19-episode-1-dev-design.md`, plan `docs/superpowers/plans/2026-11-19-episode-1-dev.md` Task 1. Full Episode 1 (`cerita/episode/auto-2/*`) untouched: the new episode only re-uses its text, art, cast, documents and the SIM activity.

- **Episode** `client/src/cerita/episode/auto-2-dev/episode.ts` (`EPISODE_AUTO_2_DEV`, id `auto-2-dev`, `antarmuka: 'hp'`, `durasiMenit: 5`, `tampilan: { teksBesar: true, akhirKenalan: true }`, own save entry under the same `raksa:cerita` root = separate from `auto-2`). Flow: `buka` (Miss Raksa, buka.1 + buka.2) -> `k01` (Babak 1: A +10, C -6, E 0) -> `k06` (Babak 6: B +14, A -10, D -10, document linimasa) -> `ksim` (auto-2 SIM activity + arena; bersih +8, ragu 0) -> `kdash` (NEW dashcam activity; bersih +8, ragu -4) -> `k14` (Babak 14: C +14, A -10, D 0, document banding) -> `akhir-cek` (>= 70 Puas, >= 45 Selesai dengan catatan, else Kurang puas) -> 3 akhir nodes (auto-2 ending lines). Start 30 (Cemas), best path 84. Reply / reaction lines = the auto-2 keys. Phone hand-off Miss Raksa -> chat at buka -> k01 and k14 -> endings (serahTelepon).
- **Dashcam contract for Task 2** (`client/src/cerita/tipe.ts`, `KonfigArena`): `{ pola: 'dashcam'; langkah: string; item: string; benda: { id: 'mobil' | 'truk' | 'truk-kecil' }[]; tepat: 'mobil'; bersih: string; ragu: string }` - the Interfaces block plus `langkah` and `item`, which `tetapkan(jawaban, konfig.langkah, konfig.item, konfig.bersih | konfig.ragu)` needs (same as 'sim'). Values in the episode: langkah 'dashcam', item 'rekaman', benda truk / mobil / truk-kecil, bersih 'bersih', ragu 'ragu'. Node `kdash` (`aktivitas: 'dashcam'`, `langsung: true`) branches on `akt:dashcam:taruh:rekaman:ragu`. Synthetic mission = one assign step `dashcam` (item rekaman -> bersih / ragu). Texts for the arena (id/en/zh): `arena.dashcam.tanya`, `.putar`, `.lanjut`, `.benda.mobil|truk|truk-kecil`, `.tepat`, `.salah`, `.jelas`, `.diputar`; how-to cards `cara.sim`, `cara.dashcam`.
  - To keep typecheck green I added the 'dashcam' cases to `hp/arena/logika.ts` (itemArena, sisaArena) and `hp/arena/ringkas.ts`, and ONE guard in `hp/arena/Arena.tsx`: the last branch is now `konfig.pola === 'pesan' ? <ArenaPolaPesan/> : null /* dashcam = Task 2 */` - the Designer replaces that `null` with `<ArenaPolaDashcam/>`. Note: the list-view toggle in Arena.tsx still shows for 'dashcam' (only rambu / sim hide it) and the list view would offer the bersih / ragu buckets directly: Task 2 should hide it like 'sim'.
- **Texts** `auto-2-dev/teks.{id,en,zh}.ts` (NEW keys only) + `teks.ts` (= TEKS_AUTO_2 + new keys; `judul` / `ringkas` overridden for this episode only).
- **Register / route / picker:** `episode/index.ts` (after auto-2), `episode/rintisan.ts` (null stub), `client/vite.config.ts` (VITE_CERITA_TANPA=auto-2 now also drops auto-2-dev, so the case never leaks through it). `App.tsx`: `/cerita/kenalan` -> `/cerita/auto-2-dev`. `pages/Cerita.tsx`: the dev card first, meta "Episode 1 Dev", chip "5 menit" (`cer-ep-cepat`, cerita.css); the full Episode 1 card unchanged.
- **No name before playing:** `pages/CeritaMain.tsx` - for an `akhirKenalan` episode without a profile the session runs as "Tamu" / "Guest" / "访客" with `LOOK_BAWAAN` (no redirect to /kenalan); every other episode still asks first. `cerita/PramuatCerita.tsx` (T-047 preload bar) also runs for auto-2-dev, also without a profile.
- **Large text** (`hp/PemainHP.tsx` root `data-teks-besar`, rules in `hp/hp.css`): speech / chat / narration 18 px, question 20 px, replies 18 px and >= 48 px, small labels 14 px, links / buttons >= 48 px. Fit by calculation (reply sheet: question + 3 replies, 18 px): 360x640 id 362..388 px, en 338..458 px (k01 longest), zh 266..338 px, + sheet chrome ~120 px <= 584 px under the header; 390x700 smaller.
- **Ending** (`ui/LayarAkhir.tsx` -> `AkhirKenalan`, `ui/akhir.css`): Pak Hendra portrait + "Pak Hendra sekarang: <suasana>" + ending title, his final line, "Ini kasus nyata yang pernah Raksa tangani.", optional name (max 24, empty -> Tamu) that fills `KartuPetugas` (T-052) live, buttons "Main versi lengkap" (-> /cerita/auto-2) and "Kenal Raksa lebih jauh" (https://www.raksaonline.com/, new tab), pinned in the phone action bar. Fit at 360x640 ~568 px.

**Open points:** Task 2 must plug `ArenaPolaDashcam` into the `null` branch and hide the list view for 'dashcam'; the SIM how-to card for auto-2-dev (`cara.sim`) is Task 2 (Pandu). Story music stays the office theme for the whole cut (one part, b1). The guest name is not saved to a profile (only on the card). Owner still to confirm the dashcam moment (spec).

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy. Not tested in a browser or on a phone. Not committed.

## T-067 (2026-11-20): dashcam replay in the Codex look (owner pick) (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt.

**Kept from T-065:** the ArenaDashcam API and props, the 6 s replay, the freeze frame, three tap targets of at least 48 px with pixel rings, "Putar lagi", the reduced-motion three stills with "Lanjut", the `kdash` coach card, and the `tetapkan(langkah, item, bersih | ragu)` recording with its outcome rules.

**Art.** It is now the Codex art: `character/dashcam-codex/draw.cjs`, ported into `character/dashcam-t065/bangun.mjs` (the T-065 K08-style generator is replaced). It is drawn at 1 art px = 1 CSS px, as a 320×240 scene centred in the arena (`--x0`), with grass filling the side margins.
- **Background** `latar.png`:
  - green verge with the orange/white striped barrier on the left, and Codex's asphalt tone, dashes and edge lines;
  - the two road signs: red "TRUK DAN TRAILER DILARANG DI LAJUR 3 DAN 4" and blue "← TRUK DAN BUS GUNAKAN LAJUR KIRI";
  - lane numbers 1-4 at the bottom of each lane;
  - the stopped white utility truck on the shoulder with hazard lights, and the worker kneeling at the tyre.
- **Vehicles:** pixel-rotated poses with the shadow baked in, at Codex's three frames. Truck: (186,177,0°) → (176,162,-14°) → (118,130,-36°). Car: (236,133,0°) → (204,105,-36°) → (178,33,+4°). Files: `truk-0/-m14/-m36.png`, `mobil-0/-m36/-p4.png`. Centres are in `sprite.json`.
- **Impact layers:** `debu.png` (dust puff at impact) and `jejak.png` (skid marks).

**Motion (dashcam.css)**
- Pose 1 moves with CSS (rotating about the vehicle centre), then the pixel pose 3 takes over at the impact (76 %).
- The cut-in reads in the motion: from 0.9 s the car steers out of lane 3 and settles in lane 2 directly in front of the truck. Only then (from 2.4 s) does the truck swerve left into the barrier and the small truck.
- Then the dust puff, the skid marks and blinking hazards.
- Reduced motion: stills 1 / 2 / 3 = Codex frames 1 / 2 / 3.

**Sign text and translation:** the pixel signs carry Codex's id text, with 5 px glyphs. Underneath the scene, a two-line legend gives both signs in the active language (`dashcam.rambu.*` in id/en/zh, 14 px, with red and blue chips). The frame-1 caption now mentions the worker changing a tyre.

**Fit on 360×640 (calculation):** the scene grows by +4 (240), and the sign legend adds +46. The separate button row is removed (−58): "Putar lagi" moved into the scene, top-right during the replay and stills 1-2 (with "Lanjut" under it), bottom-right in the frozen frame. Net −8 px, so the fit is unchanged or better. The preview checks at 336 px that no button covers a vehicle or a tap target in any frame; the reduced-motion caption moved to the bottom.

**Preview:** `character/dashcam-t065/bingkai-dashcam-3x.png`. Top row: our three frames at 336 width, with the buttons and the frame-3 tap rings. Bottom row: Codex frames 1-3 for comparison.

**Open points**
- Mid-motion rotation is CSS (briefly not pixel-exact); all stills and the freeze frame are pixel-rotated.
- The REC badge is HTML text ("REKAM 14:32"), not Codex's "REKAM 01/02, JEDA 03" frame counter.
- Not checked in a browser.

## T-068 (2026-11-20): full Episode 1 - K08 lane scene replaced by the Codex-look dashcam (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. This is the change the owner explicitly asked for in the full Episode 1; the rest of `episode/auto-2` is untouched.

**K08 now (activity id `rambu`, node `k08`, unchanged)**
- **Step 1:** the dashcam replay (ArenaDashcam, Codex look): 6 s replay, freeze frame, "who caused it?" tap on 3 targets, Putar lagi, reduced-motion stills. It is recorded on a NEW unscored step `dashcam` (item `rekaman` -> `bersih` / `ragu`, empty key). Branching does not read it.
- **Step 2:** on the SAME frozen frame (sticky at the top: both signs, lane numbers and the translated sign legend stay visible), Pak Bima's bubble asks `k08.2` ("Menurutmu, truk di lajur 2 ini melanggar rambu?"). The five script conclusions `k08.c, e, a, d, b` (keys unchanged) form a radio list. The pick goes to the existing single step `simpul`, then Kirim.
- **Scores and branches unchanged:** `ATURAN_RAMBU` is still `pilih('rambu', a-e)`, so c tepat +6, a keliru -6, b keliru -3, d/e kurang 0. Also unchanged: `catat: ['rambu', 'lajur2']` and the akibat lines k08-a..e, so the ringkasan/akhir references still work.
- **Removed from K08:** the lane-marking grid (steps r1/r2 and pola 'rambu').
  - ArenaRambu, RingkasRambu and rambu.ts stay in the repo, unused by K08.
  - The PemainHP lines that only apply to pola 'rambu' (lane-mark summary and the "sikap tidak" reaction) simply no longer trigger.
  - The old `akt.rambu.item.r1l*`/`r2l*` and `arena.rambu.*` text keys are left in place.

**Files**
- `cerita/tipe.ts`: dashcam konfig gains an optional `simpul?: { langkah; tanya; judul?; penanya; pilihan }`.
- `cerita/episode/auto-2/arena.ts`: `rambu` is now pola 'dashcam' + simpul (bima, k08.2, k08.tanya, c/e/a/d/b). Unused imports were removed.
- `cerita/episode/auto-2/aktivitas.ts`: mission steps = assign `dashcam` (unscored) + single `simpul` (key c). The `tandaLajur` helper was removed.
- `teks.id/en/zh.ts`: `akt.rambu.item.rekaman` and `akt.rambu.wadah.bersih/ragu`.
- `cerita/hp/arena/ArenaDashcam.tsx`:
  - New: fase rekaman/tanya, the step-1 button "Lanjut: pertanyaan {nama}", Pak Bima's bubble and the radio list.
  - New: "Putar lagi" in step 2 replays without touching step 1 (no targets).
  - Unchanged: without `simpul` it behaves exactly as before (Episode 1 Dev kdash).
- `dashcam.css`: sticky frame, bubble and options (16-17 px, at least 48 px).
- `hp/arena/logika.ts`: dashcam `sisaArena` also requires the simpul pick when present.
- `validasi.ts`: new `dashcam` case (item/wadah vs mission, simpul step/options/penanya).
- `hp/arena/Pandu.tsx`:
  - K08 steps read from the dashcam (Tonton -> Ketuk penyebab -> Jawab Pak Bima).
  - There is no pointer ever on K08.
  - The new 5 s coach card "Tonton rekamannya, lalu jawab pertanyaan Pak Bima." shows once, with a new key `k08dash`.
- `i18n/kamus/langkah.ts` (k08.* pita texts, `pelatih.isi.k08dash`) and `i18n/kamus/dashcam.ts` (`keTanya`, `belumSimpul`), each in id/en/zh.

**Episode 1 Dev:** kdash is unchanged (no `simpul`; same flow, recording and coach card).

**Fit on 360×640 (calculation)**
- Step 1 is as T-067.
- Step 2: the arena content area is about 480 px. That holds the frame (246) + sign legend (46) + bubble (52) + about 2 conclusions. Conclusions 3-5 scroll under the sticky frame, so nothing is cut off and the frame stays in view. The Kirim button sits in the bottom bar.

**Preview:** `character/dashcam-t065/k08-dua-langkah-2x.png` (step 1 | step 2; the dashed line marks the visible bottom at 360×640). Generator: `pratinjau-k08.mjs`.

**Open points**
- In the frozen frame the truck has already swerved out of lane 2. The question is about the truck in lane 2, which is visible via Putar lagi (step 2 replays). Showing the pre-crash pose (Codex frame 1) in step 2 would be a one-line switch if the owner prefers.
- Not checked in a browser. Tests were not run (owner rule); `teks.test` / `validasi` expectations for K08 r1/r2 may need the QA card's update.

## T-068 Fix 1 (2026-11-20): K08 step 2 = pre-crash band, everything fits without scrolling (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. Step 1, the recording and scoring are as built in T-068.

**Step 2 now** (ArenaDashcam, `fase` 'tanya', only when `konfig.simpul` is set; Episode 1 Dev kdash is unchanged):
- **Band:** the PRE-CRASH pose (Codex frame 1: truck straight in lane 2, small car in lane 3), drawn as a static band.
  - Exactly 1/2 scale (1 art px = 1 device px on DPR-2 phones), cropped to y 24-234: both signs, all four lanes, the truck and the car.
  - 160×105 plus a 2 px border, so 109 px.
  - Lane numbers 1-4 are overlaid as readable 14 px HTML numbers at each lane centre; the pixel numbers would be 2.5 px at this scale.
- **Beside the band:** Pak Bima (28 px portrait) with `k08.2` at 14 px. Below it, a folded **"Rambu"** chip (`dashcam.rambu.chip` id/en/zh) that opens the translated sign texts as a small popover.
- **Below:** the five conclusions `k08.c, e, a, d, b` as 14 px rows: line-height 1.2, padding 2/8, at least 44 px tall, 3 px apart. There is no tick box; the chosen row gets a light-orange background, an orange edge and bold text.
- **Removed from step 2:** the big frame, the sticky behaviour and "Putar lagi" in step 2.

**Heights (calculation; row text width 316 px at 360 / 346 px at 390; 14 px ≈ 7.3 px per Latin char, 14 px per CJK glyph)**
- **Arena scroll area** = screen − story header 48 − activity header 44 − instruction 34 − 3 × 8 gaps − send bar 68 − 8, so about **414 px at 360×640** and **474 px at 390×700**.
- **Step 2** = band row 109 (en question 4 lines = 111) + 6 + rows (+ 4 × 3 gaps). Row heights are max(44, lines × 16.8 + 8).

| Language | Screen | Lines c, e, a, d, b | Total | Available |
| --- | --- | --- | --- | --- |
| id | 360×640 | 3, 3, 2, 3, 2 | 390 | 414 |
| id | 390×700 | 3, 3, 2, 3, 2 | 390 | 474 |
| en | 360×640 | 3, 2, 2, 3, 2 | 376 (+2) | 414 |
| en | 390×700 | 3, 2, 2, 3, 2 | 376 (+2) | 474 |
| zh | 360×640 | 2, 2, 2, 2, 1 | 347 | 414 |
| zh | 390×700 | 2, 1, 1, 2, 1 | 347 | 474 |

So step 2 needs no scrolling in any of the three languages on either screen. Some id/en conclusions take 3 lines at 14 px. Two lines would need about 380 px of text width, more than a 360 phone has, so it is only possible by shortening the script text (keys unchanged here).

**Files:** `client/src/cerita/hp/arena/ArenaDashcam.tsx`, `dashcam.css`, `client/src/i18n/kamus/dashcam.ts`.

**Preview:** `character/dashcam-t065/k08-dua-langkah-2x.png` (step 1 | step 2, with the 360×640 and 390×700 visible-bottom lines). Generator: `pratinjau-k08.mjs`.

**Open:**
- Not checked in a browser.
- The 226 px chrome figure is an estimate from desain.css; the real header heights should be confirmed on the phone.

## T-069 (2026-11-20): dashcam back to the Claude Designer style (T-065) + signs + lane numbers (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. It applies to both Episode 1 Dev (kdash) and the full Episode 1 (K08), since both use ArenaDashcam.

**Art (owner's mix)**
- **From T-065:** the camera corners and REC badge (top right), the K08 road strip, the grey-green verge, the T-065 guardrail, and the vehicle sprites restored from commit fd91ca6:
  - `mobil-atas`, `truk-kecil-atas-nyala/-mati`, `truk-miring`, `serpih` and `pembatas`;
  - the truck is `jalan/truk-atas.png`.
- **New in that style:** generated by `character/dashcam-t065/bangun-t069.mjs` as a 336×240 `latar.png`:
  - the red sign on the left verge (no-truck roundel + "3 4" + lane bars);
  - the blue sign (left arrow + truck and bus);
  - lane numbers 1-4 (5×7, cream on a dark tile) at the bottom of each lane;
  - dust puffs (`debu.png`) and skid marks (`jejak.png`).
- **Removed:** the Codex sprites (`truk-0/-m14/-m36`, `mobil-0/-m36/-p4`). The Codex generator is kept as `character/dashcam-t065/bangun-codex-t067.mjs`.

**Layout:** road x 57..335 (lane n starts at 64 + (n−1)·66), guardrail 45..57, signs 5..43. At 360 width the bordered view is 330 px, so 3 px is cut off each side and the signs stay clear.

**Kept from T-067 / T-068 (mechanics unchanged)**
- **Readable cut-in:**
  - 0.9-3.3 s: the car moves from lane 3 (216,34) into lane 2 (150,2), directly in front of the truck;
  - 3.3-4.5 s: only then does the truck (143,100) swerve into the barrier and the stopped small truck. The crash sprite (91,78), debris, dust and skid marks appear at 76 %.
- **Freeze frame:** tap targets car (139,0,48×52), small truck (57,18,48×66), truck (97,96,68×112).
- **Buttons:** "Putar lagi" (with "Lanjut" stacked above it in reduced motion) is now always bottom-right; the car starts top-right, so the old top-right spot would cover it.
- **Unchanged:** reduced-motion stills 1/2/3, the sign legend, the Rambu chip and the coach cards.
- **Reduced-motion caption:** moved below the scene, so it never covers the car or the signs.
- **K08 step-2 band:** the pre-crash pose of the new scene at exactly 1/2 scale, cropped y 20-236, so 168×108 + 2 = 112 px (was 109), with 14 px lane numbers overlaid at the lane centres.

**Fit (calculation)**
- Replay: unchanged from T-067 (scene 240 + legend 46; buttons inside the scene; the caption below adds about 22 px only in reduced-motion stills 1-2).
- K08 step 2 is +3 px: id 393 / en 379 / zh 350 of about 414 at 360×640, and the same values of about 474 at 390×700, so no scrolling.

**Files:**
- `client/src/cerita/hp/arena/ArenaDashcam.tsx` and `dashcam.css`.
- `client/src/cerita/seni/aktivitas/dashcam/*`: `latar`, `debu`, `jejak`, `sprite.json`, plus the restored T-065 PNGs.
- `character/dashcam-t065/bangun-t069.mjs` and `pratinjau-t069.mjs`.

**Preview:** `character/dashcam-t065/bingkai-dashcam-t069-3x.png` (frames 1 / 2 / 3 with tap rings, and the K08 step-2 band).

**Open:** not checked in a browser. In-motion rotation is CSS (the stills and the freeze frame are pixel sprites).

## T-071 (2026-11-20): dashcam road moves while the replay plays (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. It applies to both Episode 1 Dev (kdash) and the full Episode 1 (K08 step 1), since both use ArenaDashcam.

**What moves:** the camera now follows the truck, so the ground scrolls DOWN during the replay. The ground is split into layers in `client/src/cerita/seni/aktivitas/dashcam/`, generated by `character/dashcam-t065/bangun-t069.mjs`.

| Layer | Size | What it holds | How it moves |
|---|---|---|---|
| `ubin.png` | 336×26 | seamless tile: verge speckle, guardrail posts, dashed lines and asphalt (dash period 26 = tile height) | `repeat-y`, animated `background-position-y` |
| `rambu.png` | 336×528 | two sign pairs 288 px apart, plus the stopped small truck (hazard blink unchanged) | `transform: translateY` |
| `nomor-lajur.png` | 336×13 | lane numbers 1-4 | fixed at y 226 (UI, not ground) |

`latar.png` is now only a static composite for previews; the app no longer imports it.

**Timing** (dashcam.css `dc-gulir-latar` / `dc-gulir-tanah`, the same steps for both layers): the total scroll is 288 px.
- **0-3.3 s:** 245 px, which is 74 px/s, one dash period every 0.35 s (truck speed).
- **Slowing down:** 23, 14 and 6 px over the next 1.2 s, about 55, 33 and 17 px/s.
- **4.5 s:** still, at the moment of impact.

Each segment uses `steps(n)` with exactly 1 px per step, so it stays crisp. There is no canvas or JS, and the timings of the vehicles, debris, dust and skid marks are unchanged.

**Ground objects move with the road; the story timing holds**
- **Signs:** the first pair slides down and out. The next pair (288 px further up) arrives exactly where the first pair started, so the freeze frame shows the same signs as before.
- **Small truck:** it starts off-screen at y −266 and enters from the top at about 2.8 s. At 3.3 s it is half in view and the truck begins to swerve. At 4.5 s it stops at y 22, right next to the impact, the same freeze position as in T-069, so the tap targets did not change.

**Fully still**
- **Freeze frame:** offset 288.
- **Reduced-motion stills:** frame 1 = 0, frame 2 = 245, frame 3 = 288. The existing reduced-motion rule turns off all animation.
- **K08 step-2 band:** offset 0. The two signs, the truck in lane 2 and the car in lane 3 are visible.
- **Change:** in step 2's band the stopped small truck is no longer visible, because at 0 s it has not entered the frame yet. The K08 question is about the truck in lane 2 and the signs, so the band still shows everything it asks about.

**Files:**
- `client/src/cerita/hp/arena/ArenaDashcam.tsx` and `dashcam.css`.
- `client/src/cerita/seni/aktivitas/dashcam/`: `ubin.png`, `rambu.png` and `nomor-lajur.png` are new; `latar.png` was regenerated.
- `character/dashcam-t065/bangun-t069.mjs` (T-071 section) and `pratinjau-t071.mjs`.

**Preview:** `character/dashcam-t065/gulir-dashcam-t071-3x.png` shows 0.0 s / 2.0 s / 3.3 s / 4.5 s+ with the offset written under each frame (vehicles drawn unrotated).

**Open:** the motion has not been seen running in a browser.

## T-072 (2026-11-20): cuter, fixed "Petugas Klaim Raksa" ID card in Episode 1 Dev AND the full Episode 1 (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt.

**Card** (`client/src/cerita/ui/KartuPetugas.tsx`, CSS `.kp*` in `cerita/ui/akhir.css`, which replaces the T-052 `.akh-kartu-petugas`): a lanyard ID card, `min(300px, 100%)` wide and 176 px tall (strap 14 + card 162).
- **Top:** orange strap with a metal clip.
- **Edge:** 3 px ink edge with a hard and a soft drop shadow.
- **Header:** orange band with the pixel Raksa owl, "RAKSA", and an ID tag `RKS-0000`. The number is `nomorPetugas()`, an FNV-1a hash of name and date, so it is stable for the same name on the same day.
- **Photo:** 76×84 framed photo box holding the player's pixel portrait at 64 px (exactly 4× the 16-cell grid), with two pixel sparkles.
- **Name:** 20 px on ONE line, ellipsis when long (a 24-character name is cut with "…").
- **Role:** "Petugas Klaim" / "Claims Officer" / 理赔专员 at 15 px. It wraps only at spaces (`word-break: keep-all`, no `overflow-wrap: anywhere`), and in the 186 px text column it stays on one line in all three languages.
- **Result stamp:** the ending title (Puas / Selesai dengan catatan / Kurang puas, and the en/zh equivalents) in the game's status colours, tilted 3°.
- **Footer:** blush strip with a sparkle, "Lulus pelatihan Raksa" / "Raksa training graduate" / "Raksa 培训结业", and today's date (`Intl`, follows the active language).
- **No animation.** It renders nothing without a player look (same as before).

New keys `ceritaAkhir.kartuLulus` and `ceritaAkhir.kartuBuka` (id/en/zh).

**Episode 1 Dev ending** (`AkhirKenalan` in LayarAkhir.tsx):
- The name is now typed ON the card. The name line is the input: 44 px tall, dashed underline, ✎ mark, the label read by screen readers, maxLength 24. The visible placeholder "Tamu" / "Guest" / 访客 is styled as the name, so an empty name screenshots cleanly.
- The separate label and field are gone, and the caption is shorter (`kenalan.kartu`: "Ketuk nama untuk mengganti, lalu tangkap layar." / "Tap the name to change it, then screenshot." / 点名字可修改，然后截图保存。).
- Spacing is tighter (gaps 12 → 8, and the card block has no frame).
- **Fit at 360×640:** 476 px of content room below the 56 px story header, the 80 px pinned action bar and the 28 px fade padding.
  - Indonesian, "Puas": 450 px.
  - English, "Kurang puas" (4-line quote, worst case): 476 px, so it fits with 0 px spare.
  - 390×700 has 60 px more height.

**Full Episode 1 ending** (one-screen, T-024): the head row keeps an 84×56 slot, so the one-screen layout is unchanged.
- The slot now holds a mini card button (`.kp-mini`): RAKSA band, portrait and a › chip. Its label is "Lihat kartu petugas {nama}". It no longer contains text that can break.
- Tapping it opens the full card in the existing bottom sheet (`LembarAkhir`, new `jenis: 'kartu'`), with the result stamp; focus returns to the mini card when the sheet closes.
- The scrolling (wide) form of the ending shows the full card under the head row instead.

**Files:**
- `client/src/cerita/ui/KartuPetugas.tsx`, `LayarAkhir.tsx`, `LembarAkhir.tsx` (type only), `akhir.css`.
- `client/src/i18n/kamus/ceritaAkhir.ts`.
- `client/src/cerita/episode/auto-2-dev/teks.{id,en,zh}.ts` (`kenalan.kartu`).

**Previews** (calculated mocks with the real pixel avatar and owl; other text as grey bars; mock font is uppercase pixel), in `character/kartu-petugas-t072/`, made by `pratinjau.mts` (`npx tsx --tsconfig client/tsconfig.json character/kartu-petugas-t072/pratinjau.mts`):
- `akhir-dev-t072-360x640.png` and `-390x700.png`
- `akhir-lengkap-t072-360x640.png` and `-390x700.png` (mini card in the head row, plus the sheet with the full card)
- `kartu-t072-varian-3x.png` (id Tamu/Puas; en 24-character name/Closed, with reservations; en Guest/Not satisfied)

**Open:** not seen in a browser. The worst case at 360×640 (English, "Kurang puas") has 0 px spare by calculation, so if real font metrics run longer, that ending scrolls by a few pixels.

## T-073 (2026-11-20): URGENT dashcam bugs on the owner's iPhone + real parts for Episode 1 Dev (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. The dashcam fixes apply to both Episode 1 Dev (kdash) and full Episode 1 K08 step 1, since both use ArenaDashcam.

**1. Stopped small truck missing in the freeze frame**
- **Root cause (my T-071 error):** inside the scrolling ground layer (`.dc-tanah`, `top: -288px` + `translateY(288px)`, so its origin is the top of the scene in the freeze frame), the small truck was given `top: 310px`, adding the 288 offset a second time. So it ended at y 310, below the 240-px scene, and was never visible on any phone. My T-071 preview script placed it correctly, which hid the error.
- **Fix:**
  - The small truck is now its own sprite in the scene at its T-069 final coordinates (x 65, y 22), outside the scrolling layer, with no transform at rest. So it is always in place in the freeze frame and whenever animations are off or late (iOS Safari timing).
  - Its entry from the top during the replay is a separate animation, `dc-gulir-kecil` (translateY −288 → 0, the same pixel steps as the ground), so it still stops beside the impact. The hazard blink is unchanged.
  - Reduced-motion stills now keep the ground at its final position in all three frames, so the small truck and the signs are always visible at the T-069 spots.
  - The K08 step-2 band still uses ground offset 0, as in T-071.

**2. Lane numbers cut in half**
- **Cause:** a global `* { box-sizing: border-box }` makes the 240-px scene 234 px tall inside its 3-px frame. The numbers sat at top 226 and are 13 px tall, so they ended at 239 and their bottom 5 px were cut.
- **Fix:** they are now anchored `bottom: 6px` (y 215..228 inside). The in-scene buttons moved from bottom 12 to bottom 26 so they never cover lane 3-4 numbers. That spot is clear of the vehicles: the freeze truck reaches x 166 and the buttons start at about x 194.

**3. Episode 1 Dev header showed "BAGIAN 1/1 · Laporan awal" everywhere.** `auto-2-dev/episode.ts` now has four parts with the full case's titles and goals (`bab.b1..b4`, id/en/zh already in the auto-2 texts). Each node's part is where that step sits in the full case (`babDev()`):

| Steps | Part |
|---|---|
| buka + Babak 1 (k01) | 1/4 Laporan awal |
| Babak 6 (k06) | 2/4 Survey dan estimasi |
| SIM + dashcam | 3/4 Pemeriksaan kejadian |
| Babak 14 + endings | 4/4 Keputusan dan penyelesaian |

The header shows e.g. "BAGIAN 3/4 · Pemeriksaan kejadian" at the dashcam. Side effects:
- Story music now follows the full case: parts 2-3 use the "periksa" theme, the endings the closing theme.
- The Kenalan ending still has no "try again from part".

**Files:** `client/src/cerita/hp/arena/ArenaDashcam.tsx`, `dashcam.css`, and `client/src/cerita/episode/auto-2-dev/episode.ts`.

**Open:** not seen on a phone. Saves from the old single-part version keep working, since node ids are unchanged.

## T-074 (2026-11-20): Episode 1 Dev card hidden behind a server flag (temporary, owner)

- Same pattern as RAKSA_DEMO_CERITA: env `RAKSA_EP1_DEV` (on|off, default **off = hidden**) -> `CONFIG.ep1Dev` (server/src/config.ts) -> `/api/config` `features.ep1Dev` (server/src/index.ts) -> `AppConfig.ep1Dev` (client/src/story/appConfig.ts, fallback false).
- `client/src/pages/Cerita.tsx`: the "Episode 1 Dev · Kenalan Raksa" card renders only when `features.ep1Dev` is true (config loaded). The full Episode 1 card and the locked Episode 2 row are unchanged; with the card hidden the picker is exactly the pre-T-064 picker (fits one screen as before).
- Direct links keep working when hidden: `/cerita/kenalan` -> `/cerita/auto-2-dev` (route and episode registry untouched), so the owner can show it privately and printed QR posters do not break.
- Docs: README env table rows for `RAKSA_DEMO_CERITA` (was missing) and `RAKSA_EP1_DEV`; `.env.example` `RAKSA_EP1_DEV=off`. To show the card on the live server: set `RAKSA_EP1_DEV=on` in the server .env and restart.

**Gate (owner rule):** typecheck 0; `client/dist` rebuilt = exact copy. Not tested in a browser or on a phone. Not committed.

## T-077 (2026-11-20): Episode 1 Investigator pilot, plan Task 2: investigator UI + assets (Designer)

Built by the Designer; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt (with Task 1's files as they were on disk at that moment). Full Episode 1 and Episode 1 Dev are unchanged: every change to shared code is opt-in.

**Components** (`client/src/cerita/investigasi/ui/`, props as in the plan; extra props are all optional):

| Component | Plan props | What it is | Optional extras |
|---|---|---|---|
| `JudulKasus` | `{nomor, judul, onMulai}` | Title card: "KASUS #1" band, folder + magnifier art, big title, "Mulai selidiki" | `tx` |
| `BukuCatatan` | `{pernyataan, bukti}` | Spiral notebook: pinned statements + evidence cards, empty-state lines, scrolls inside itself | `tx` |
| `KartuBukti` | `{bukti, terpilih?, sorot?, onPilih?}` | 76 px row: 96×68 thumbnail, title, source with icon; a toggle button when `onPilih` is given | `tx`, `redup` |
| `LayarKeberatan` | `{pernyataan, bukti, percobaan, onPilih}` | Glowing statement, evidence cards, big "KEBERATAN!" key (off until a card is picked) | `tx`, `tepat` (default `'dashcam'`) |
| `CapKeberatan` | `{onSelesai}` | Full-screen stamp via a body portal: flash, burst zooms in and shakes, word as live text, plays the SFX | none |
| `LayarPutusan` | `{onPilih}` | Three verdict cards with a short why, then "Tetapkan putusan" | none |
| `HasilInvestigasi` | `{skor, nama, look, stempel, pangkat, onMainLagi, onKasusBerikutnya}` | Grade badge, total / 100, three part bars, officer card, two buttons | `berikutnyaSegera` (default true) |

- **Miss handling in `LayarKeberatan`:** try 1 shows a hint and blinks a frame on the lane-number strip of the dashcam thumbnail. Try 2 shows Miss Raksa ("berpikir") walking through it, with the right card preselected and the others dimmed and disabled. Only cards passed in `bukti` are shown, so an uncollected card cannot be chosen.
- **`CapKeberatan` timing:** it ends itself after 1.5 s; a tap or key skips it. Reduced motion shows a still image for the same time.
- **"Kasus berikutnya":** tapping shows "Kasus berikutnya segera hadir." and still calls `onKasusBerikutnya`.
- **Also exported for Task 1:**
  - `KartuPernyataan {pernyataan, tersemat?, onSemat?, reaksi?, sorot?}` (from `BukuCatatan.tsx`): the pinnable statement for the `catat` node, with a 48 px "Sematkan" key, glow and pin.
  - `PotretReaksi {reaksi}`: the five reaction portraits.
  - `IkonInv` (from `dasar.tsx`).

**Two things Task 1 needs to know**
1. **Text keys.** The plan's props carry no `tx`, but `Bukti.judul/sumber` and `Pernyataan.teks` are episode text keys. Wrap the investigator screens once in `<PenyediaTeksInvestigasi value={tx}>` (from `ui/dasar.tsx`), or pass the optional `tx` prop. Without either, the components fall back to the app dictionary and would show the raw key.
2. **Types.** `ui/dasar.tsx` re-exports Task 1's own types (`status.ts`, `skor.ts`, `simpan.ts`), so there are no local copies to keep in sync.

**Shared code touched (opt-in only)**
- `cerita/ui/KartuPetugas.tsx` + `akhir.css`: new optional props `look` (character passed directly) and `investigasi={{ stempel, pangkat }}`. With `investigasi`, the role line becomes the rank with a 24 px rank badge, and the footer shows a row of 4 case-stamp slots. Without them the card renders exactly as before.
- `audio/audio.ts`: new SFX `'keberatan'` (original synth: slam + rising three-note stab, about 0.65 s).
- `i18n/kamus/investigasi.ts` (new, registered in `kamus/index.ts`): all UI strings in id/en/zh. This includes rank names, verdict labels and whys, hints, and "KEBERATAN!" / "OBJECTION!" / "有异议！".

**Art** (`client/src/cerita/seni/investigasi/`, generated by `character/investigator-t077/bangun.mts`):
- `ikon.png`: 11 icons, 16 px (rekaman, foto, kartu, pin, three verdicts, stamp filled / empty, notebook, padlock).
- `bukti.png`: three 96×68 thumbnails. Dashcam is the real scene at half scale with lane numbers 1-3 on top; rambu is the red sign at 2×; sim is a licence card with a genuine tick.
- `nilai.png` (S/A/B/C badges), `pangkat.png` (4 rank badges), `ledakan.png` (KEBERATAN burst), `judul.png` (title art), `spiral.png` (notebook binding).
- `reaksi.png`: five 64 px reaction portraits: petugas tol "kaget" and "mengaku", Pak Darto "lega", Miss Raksa "berpikir" and "bangga". These are the existing cast portraits plus drawn emotion marks (!!, sweat drops, sigh puff, thought bubble, sparkles); the faces themselves are not redrawn.

**Fit at 360×640 (calculation; 584 px below the story header, 328 px content width)**

| Screen | Height |
|---|---|
| Title card | about 390 px |
| KEBERATAN, try 0 / 1 / 2 | about 474 / 518 / 529 px |
| Verdict (id, whys up to 3 lines) | about 463 px |
| Result | about 462 px |
| Notebook | scrolls inside itself when full (2 statements + 3 cards is about 520 px) |

390×700 has 60 px more.

**Previews** (calculated mocks from the real art; mock text is an uppercase pixel font, so line breaks are indicative), in `character/investigator-t077/`, made by `pratinjau.mts`:
- `layar-t077-360x640-2x.png`: title card, KEBERATAN (second try), the stamp, result.
- `buku-putusan-t077-2x.png`: notebook, verdict.
- `aset-t077-3x.png`: all art.

**Open**
- Not seen in a browser; the components are not yet rendered by anything until Task 1 wires them.
- The hint texts and the verdict whys are written for this case (lanes 2 and 3). A second case will need them moved into episode texts.
- Reactions are marks over existing faces; real redrawn expressions would be a follow-up if the owner wants more acting.
- `.iv-layar` assumes it sits inside `.hp-main` (12 px side padding).

## T-076 (2026-11-20): Episode 1 Investigator pilot, plan Task 1 (Fullstack): episode, state, scoring, saves, routing, wiring

Spec `docs/superpowers/specs/2026-11-20-episode-1-investigator-design.md`, plan `docs/superpowers/plans/2026-11-20-episode-1-investigator.md` Task 1. Full Episode 1 (`auto-2`) and Episode 1 Dev (`auto-2-dev`) are unchanged: every change to shared code is behind `Episode.investigasi` / `node.investigasi`. The engine (`cerita/mesin.ts`) is untouched.

**How the plan's node kinds are built.** `catat`, `bukti`, `keberatan`, `putusan`, `hasil-investigasi` (plus `judul` and `cap`) are an opt-in annotation `investigasi` on the EXISTING engine node kinds (`cerita/tipe.ts`: `NodeInvestigasi`, `KonfigInvestigasi`, `BuktiInvestigasi`, `PernyataanInvestigasi`). So saves, reload-resume and history work as for any episode, and results live in story tags: `catat:<id>`, `bukti:<id>`, `keb:tepat|tepat-kedua|dipandu`, `putusan:layak|tambahan|polis`, `pesan:baik|datar|janji`.

**Files**
- New episode `client/src/cerita/episode/auto-2-inv/`: `episode.ts` (`EPISODE_AUTO_2_INV`, id `auto-2-inv`, `tampilan.teksBesar`, `investigasi: { kasus: 'kasus-1', nomor: 1, ... }`), `teks.ts` (= TEKS_AUTO_2 + the dashcam activity keys of Dev + new keys), `teks.{id,en,zh}.ts` (new keys, all prefixed `inv.`).
- `client/src/cerita/investigasi/status.ts` (types `Bukti`, `Pernyataan`, `HasilKeberatan`, `Putusan`, `Pesan`; reads pinned statements / collected cards / results from tags), `skor.ts` (`skorKasus`, `nilaiDari`), `simpan.ts` (device record `raksa:investigasi:v1` = `{ versi: 1, terbaik, stempel }`; `catatHasil` keeps the BEST score and adds the stamp once, idempotent; `totalSkor`; `pangkat`; `tamuBaru`; memory fallback when storage is blocked), `LayarInvestigasi.tsx` (the wiring: `LayarInvestigasi`, `HasilKasus`, `IsiBukuCatatan`).
- Modified: `cerita/tipe.ts`, `cerita/hp/PemainHP.tsx` (new view `investigasi`, result instead of LayarAkhir, notebook instead of Catatan kasus, "Tamu baru" menu row; all only when `ep.investigasi`), `cerita/episode/index.ts` + `rintisan.ts` + `client/vite.config.ts` (excluding auto-2 from a build also excludes auto-2-inv), `App.tsx` (`/cerita/investigator` -> `/cerita/auto-2-inv`), `pages/Cerita.tsx` (card first in the list, only with the flag), `pages/CeritaMain.tsx` (guest plays without the name screen), `cerita/PramuatCerita.tsx` (preload bar also for auto-2-inv), `cerita/hp/arena/Pandu.tsx` (short SIM coach card also for auto-2-inv), `server/src/config.ts` + `index.ts` + `client/src/story/appConfig.ts` (`RAKSA_INVESTIGATOR`, default off -> `features.investigator`), README + `.env.example`.

**Graph** (4 parts in the header; b2 / b3 get the investigation music)
1. b1 `judul` (title card) -> `buka` (Miss Raksa, office) -> `darto` [catat] -> `tol` [catat] -> `selisih` (Miss Raksa on the phone inset).
2. b2 `kdash` (Dev's dashcam arena, reused as is) -> `bukti-dashcam` [bukti] -> `bukti-rambu` [bukti; the sign seen in the same recording] -> `ksim` (auto-2 SIM arena) -> `bukti-sim` [bukti].
3. b3 `keb-buka` -> `keb0` [keberatan 0, choice node; options only for collected cards via `jika: bukti:<id>`]: dashcam -> `keb-cap`; a wrong card -> `keb0-<card>` (Miss Raksa says why THAT card does not show the lane) -> `keb1` [keberatan 1]; wrong again -> `keb1-<card>` -> `keb2` [keberatan 2, guided, dialog node: only the right card continues] -> `keb-cap` [cap] -> `keb-akui` (officer corrects his note, spec line kept).
4. b4 `putusan-buka` -> `putusan` [putusan] -> `putusan-<x>` (Miss Raksa's short why; a wrong verdict is straightened out, the claim is covered either way) -> `pesan` (chat with Pak Hendra, 3 replies) -> `pesan-<x>` -> `akhir-tuntas` (verdict layak) | `akhir-tinjau` (other verdict) [hasil-investigasi].
A miss never blocks: only points differ. Two endings exist because the episode validator requires at least two.

**Wiring of the T-077 components** (`investigasi/LayarInvestigasi.tsx`, all inside `<PenyediaTeksInvestigasi value={tx}>`)
- `judul` -> `JudulKasus` (+ a small "Tamu baru" link when a device record exists); `catat` -> the statement line is read on the stage first, "Lanjut" opens `KartuPernyataan` with "Sematkan", the pin shows for 0.55 s, then the story continues; `bukti` -> "Bukti baru!" + the finding sentence + `KartuBukti` + "Simpan ke buku catatan"; `keberatan` -> `LayarKeberatan` (cards in the order rambu, dashcam, sim so the right one is not first; `percobaan` and `tepat` from the node); `cap` -> `CapKeberatan` over the objection sentence + `PotretReaksi tol-kaget`; `putusan` -> `LayarPutusan`; ending -> `HasilInvestigasi` via `HasilKasus` (records the result once, shows this case's stamp at once, "Skor terbaik di perangkat ini" when the best is higher, "Tamu baru" with a second tap). Menu: "Buku catatan" opens `BukuCatatan`; a "Tamu baru" row clears the record and restarts the case.

**Checks done (no browser, no test suite)**
- typecheck 0 (client + server); `client/dist` rebuilt = exact copy; `cek-rilis` pass.
- One-off script (scratch, not committed) calling the project's own `validasiEpisode` and `jelajahiSemuaJalur` on the new episode: 0 validator messages; 252 paths, endings tuntas 84 / tinjau 168, no dead ends. Scripted walks with the real engine: best path 100 = S; second-try + tambahan + datar 55 = B; guided + polis + janji 10 = C; always 3 cards offered at the objection; an uncollected card is refused by the engine. Record: 55 -> 85 -> 40 keeps 85, one stamp; `tamuBaru` empties it. All stage compositions used map to existing pixel rooms / slots, including Miss Raksa's phone inset.

**Open points**
- Nothing was seen in a browser or on a phone. The parts most worth a look: Miss Raksa as a PHONE INSET in the interview room (first use of the inset for her), the two-step pin, the stamp overlay timing, the result screen height with the extra "Tamu baru" line.
- `LayarPutusan` whys (T-077 dictionary) are written as if the officer's note still stood; in this graph the officer corrects it before the verdict. Either wording works for play; align if the owner wants.
- `LayarKeberatan` has its own generic hints; this graph adds one card-specific sentence from Miss Raksa before each retry (why the sign / the licence cannot show the lane). Slight overlap by design.
- Reactions `tol-mengaku`, `darto-lega`, `miss-bangga`, `miss-berpikir` (outside LayarKeberatan) are not placed anywhere yet; the opener has no frozen dashcam picture (text only).
- Guest name: without a profile the card says Tamu / Guest / 访客; there is no name field in this pilot.
- "Kasus berikutnya" only shows "segera hadir" (no case 2). Rank needs 3 / 4 stamps, so with one case a guest tops out at "Investigator".
- The investigator UI is imported statically by the phone player, so its small JS / CSS / art ride in the story chunk for every episode (no behaviour change; lazy-loading is a follow-up if size matters).
- Card on the picker: set `RAKSA_INVESTIGATOR=on` and restart; `/cerita/investigator` works without it. Not committed.

## T-078 (2026-11-20): Investigator pilot polish (open points from T-076 / T-077) (Designer)

Built by the Designer on top of f2a4861; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. Scoring, saves and the graph (`episode.ts`, `status.ts`, `skor.ts`, `simpan.ts`) are untouched. Full Episode 1 and Episode 1 Dev are unchanged: the two shared-code changes are opt-in.

**1. Verdict whys** (`i18n/kamus/investigasi.ts`, id/en/zh): they now follow the corrected report.
- Sub-line: "Laporan petugas sudah diperbaiki. Pilih satu putusan."
- Layak: the footage proves lane 2 and the report is corrected, so nothing was broken.
- Butuh bukti tambahan: safer to check once more, although the footage, the sign and the licence are already in hand.
- Masalah pertanggungan: the officer's FIRST note said lane 3, and the player treats that as still a problem (wrong, because that note was the mistake).

**2. Reaction portraits placed**
- **Mechanism:** new `investigasi/ui/reaksiBaris.tsx` maps text keys to reactions. `AdeganTatap` got an optional `hiasUcapan` prop; the phone player passes it only when `ep.investigasi`. The portrait (48 px in a 52 px frame) sits at the right of the spoken line and pops in.
- **Placements:**

| Moment | Line | Reaction |
|---|---|---|
| Opener | `inv.buka.3`, `inv.selisih.1` | Miss Raksa "berpikir" |
| KEBERATAN hit | the screen under the stamp | petugas tol "kaget", 128 px |
| Officer looks at the footage | `inv.akui.1` | petugas tol "kaget" |
| The revision | `inv.akui.2` | petugas tol "mengaku" |
| After | `inv.akui.3` | Pak Darto "lega" |
| Right verdict | `inv.putusan.layak.1`, `inv.akhir.tuntas.1` | Miss Raksa "bangga" |
| Result screen | head row, right | "bangga" when the verdict was layak, else "berpikir" |

**3. Frozen dashcam picture in the opener card.** The pre-crash band of ArenaDashcam is now a small exported component, `BingkaiDashcam` (K08 step 2 uses it too, with the same markup as before). The opener card shows it large: a 1:1 crop of 292×150 with both signs, the truck in lane 2, the car in lane 3 and lane numbers 1-3. `JudulKasus` takes it through a new optional `gambar` prop; without it the folder art stays.

**4. Checks by calculation** (big text, 360×640). The real room is 544 px: 640 − story header 56 − `.hp-main` padding 12 + 28. T-077 had assumed 568.

| Check | Result |
|---|---|
| Miss Raksa phone inset, interview room | OK, no fix. The project's own geometry functions, for [tol] and [tol + darto] at 336 and 366 px wide in three stage shapes, put the inset top-left or top-right, 60 to 97 px, never over a head and always inside the stage |
| Two-step pin | Fits (about 166 px). Pin time 550 → 900 ms and the pin now drops in, so "Tersemat" can be read |
| KEBERATAN stamp timing | FIXED. The stamp used to continue the story by itself after 1.5 s, so the "kaget" screen under it was never seen. Now the stamp closes and that screen stays until "Lanjut" (one more tap) |
| Case stamp on the result card | New: the just-earned stamp is stamped on after 0.6 s with one sound; reduced motion shows it at once |
| KEBERATAN, guided try | Was about 542 with the real hint length; tightened to about 532 |
| Verdict | 463 to 483 px; worst case (all whys 4 lines) 543 |
| Result | FIXED. It was 514 to 542, and 590 with the "Tamu baru" confirmation open (scrolled). Now 412 for the result itself and 492 with best score + "Tamu baru"; 508 with the confirmation open; 536 with "segera hadir" also showing |
| Opener card | 371 px, 431 with the "Tamu baru" link |

How the result was tightened: rows 26 → 24, gaps 10 → 8, the "segera hadir" note no longer reserves space, the foot is compact (44 px link), and the best-score line hides while the confirmation is open.

**Files**
- `client/src/cerita/investigasi/ui/`: `reaksiBaris.tsx` (new), `HasilInvestigasi.tsx`, `JudulKasus.tsx`, `LayarPutusan.tsx` (comment), `investigasi.css`.
- `client/src/cerita/investigasi/LayarInvestigasi.tsx` (presentation only: opener picture, `LayarCap`, result reaction, pin time).
- `client/src/cerita/hp/AdeganTatap.tsx` + `PemainHP.tsx` (opt-in `hiasUcapan`), `hp/arena/ArenaDashcam.tsx` + `dashcam.css` (`BingkaiDashcam`).
- `client/src/cerita/ui/KartuPetugas.tsx` + `akhir.css` (opt-in `baru` stamp animation), `client/src/i18n/kamus/investigasi.ts`.

**Preview** (calculated mock from the real art): `character/investigator-t077/layar-t078-360x640-2x.png` (opener with the dashcam frame, the screen after the stamp, a stage line with a reaction, the result), made by `pratinjau-t078.mts`.

**Open**
- Not seen in a browser or on a phone.
- The opener picture shows the truck in lane 2 before the player has heard either statement (as the spec asks). If the owner finds it gives the answer away, crop the frame to the signs and lanes without the truck.
- The stamp screen now needs one more tap ("Lanjut").
- The `:has()` rule for the result foot needs iOS 15.4 or newer; on older phones the best-score line stays visible and that one state can scroll by a few pixels.

## T-079 (2026-11-21): Investigator redesign: testimony with motion + a real detective notebook (Designer)

Built by the Designer on top of 43e39c1; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. Only the investigator episode changes: everything in the phone player is behind `ep.investigasi`. Scoring, saves and the graph are untouched (two wrapper text keys were added to the episode texts, id/en/zh).

### 1. Testimony with motion
New `investigasi/ui/LayarKeterangan.tsx` + `keterangan.css`. The phone player uses it instead of the general stage for investigator nodes in the interview room that have a witness with a pixel sprite (`pakaiKeterangan`). That covers the two statements, Miss Raksa's phone lines, the KEBERATAN intro and misses, the officer's correction, and the dashcam / SIM task intros. Lines still advance through the player's own "Lanjut".

- **Staging (336×236, art at 2×):**
  - The room wall is the backdrop.
  - The witness is SEATED across a table: his existing sprite from head to chest, with the lower body hidden by the new table edge on the player's side (`meja-depan.png`: open notebook, pen, coffee cup).
- **Loops:**
  - Idle: breathing (2 px every 2.6 s) and a blink (the atlas's closed-eyes face, every 3.8 s).
  - Talking: a quick small nod while his line types out letter by letter. Tapping the text shows it whole.
- **Motion beats per line** (`GERAK_BARIS`): lean in, lean back, shake head, nod, and wipe sweat (two drops fall). The T-078 reaction portraits pop in at the top right. Miss Raksa on the phone is a portrait inset at the top left.
- **Flashback on the key line** (`KilasBalik.tsx`, `KILAS_BARIS`): the stage cuts to a film-strip panel with sprocket holes, sepia, film grain and a "KETERANGAN · name" tag. The next line returns to the room.
  - Pak Darto (`inv.darto.3`): the dashcam road scrolling, the truck in lane 2, the small car cutting in from lane 3, the truck swerving left; lane numbers at the bottom with "2" ringed. 4.8 s loop.
  - Petugas tol (`inv.tol.3`): a close-up of his logbook "CATATAN KEJADIAN" with the hand writing "3" in the LAJUR box. 3.6 s loop.
- **Reduced motion:** no typing and no loops. The flashbacks show their final still (car already cut in; "3" written).
- **Task intros:** when the task card shows, the stage shortens to 168 px. If the text still overflows, the goal line hides (the same mechanism the general stage uses).

### 2. Detective notebook
`BukuCatatan.tsx` rewritten (same `{pernyataan, bukti}` props, new look) + `buku.css`.

- **The book:** an open brown leather notebook with stitching, an elastic band and a pencil in its loop.
- **Layout choice:** it is bound at the TOP like a reporter's notebook, so on a portrait phone the two pages stack and each stays full width. Side-by-side pages would be 150 px each, too narrow for 16 px text.
  - Upper page "Keterangan": each pinned statement is a small polaroid of the speaker with a red pin, plus the sentence in handwriting.
  - Ring binding between the pages.
  - Lower page "Bukti": evidence as paper slips held by paper clips (picture + handwritten title).
- **Handwriting:** the system's handwriting font (Bradley Hand / Segoe Print / Chalkboard / Android "casual"), 16-18 px, blue-black ink. Titles and names stay in the normal font.
- **Pin screen (replaces the empty page):** the book fills the screen with the new statement in faint pencil inside a dashed outline. "Sematkan ke buku catatan" makes the sentence write itself in ink (0.9 s), then the pin drops (paper sound, then a soft "taruh"), and the story continues after 2 s.
- **KEBERATAN picks FROM the book:** the contested statement is highlighted in orange on the upper page and the evidence slips are the choices on the lower page (same data and props). Hints are a yellow sticky note.
- **Always reachable:** a book button with an item count sits at the top right of the header, left of Menu. It opens the full book.

### Fit by calculation (360×640)
- **Testimony:** 236 stage + about 218 dialog = about 454 of about 492 px (with the goal line showing).
- **Pin screen:** at most about 398 of 544 px. Both pin screens come before any evidence, so the lower page is short there.
- **KEBERATAN:** 466 px on the first try, up to 524 with a hint.
- **Full book** (2 statements + 3 slips): about 450 to 480 px, in the dialog.
- 390×700 has more room.

### Files
- **New components and CSS** (`client/src/cerita/investigasi/ui/`): `LayarKeterangan.tsx`, `KilasBalik.tsx`, `keterangan.css`, `buku.css`.
- **Rewritten:** `BukuCatatan.tsx`, `LayarKeberatan.tsx`.
- **Changed:** `investigasi/LayarInvestigasi.tsx` (pin screen), `hp/PemainHP.tsx` (testimony screen + book button, investigator only), `i18n/kamus/investigasi.ts`, `episode/auto-2-inv/teks.{id,en,zh}.ts` (two button labels).
- **New art** (`client/src/cerita/seni/investigasi/`): `meja-depan`, `kilas-tol`, `kilas-tiga`, `kilas-tangan`, `butir`, `pensil`, `klip`, generated by `character/investigator-t079/bangun.mts`.

### Previews
Calculated mocks from the real art; text is a stand-in pixel font. In `character/investigator-t079/`, made by `pratinjau.mts`:
- `keterangan-t079-2x.png`: the room with Pak Darto, the room with the officer and a reaction, and two frames of each flashback.
- `buku-t079-2x.png`: the notebook empty (pin screen), half, and full.
- `aset-t079-3x.png`: the new art.

### Open
- Not seen in a browser or on a phone; the motion in particular is unseen.
- "Seated" is the standing sprite cropped by the table; there is no new seated or arm art. So "scratch head" is not drawn: the beats are body movement plus sweat drops and the reaction portraits. Real gesture sprites would be a follow-up.
- There is no mouth animation (these sprites have no open-mouth face); talking is the nod.
- The handwriting font differs per device, and Chinese falls back to the system font.
- The notebook pages are stacked, not side by side (see the layout choice above).

## T-080 (2026-11-21): Investigator evidence scenes that match the story: dashcam handover + a new SIM check at the table (Designer)

Built by the Designer on top of be32190; uncommitted. Owner rule: nothing was opened in a browser. Gate: client typecheck 0 errors; client/dist rebuilt. Only the investigator episode changes. Card grants and scoring are as they were.

### What I changed in Fullstack's files (for the Lead)
- **`cerita/tipe.ts`:** one more opt-in presentation kind in `NodeInvestigasi`: `{ jenis: 'periksa-sim' }`. It sets no tag and is not scored.
- **`episode/auto-2-inv/episode.ts`:**
  - Node `ksim` is no longer the Episode 1 SIM arena. It is now a dialog node with `investigasi: { jenis: 'periksa-sim' }`, lines `inv.sim.1` (narration) and `inv.sim.2` (Pak Darto), with Pak Darto alone in the room. It still continues to `bukti-sim`, which grants the card as before.
  - `bukti-sim` now has Pak Darto alone too (Pak Bima no longer appears).
  - `aktivitas` no longer lists `sim`; the dashcam activity is unchanged.
- **`auto-2-inv/teks.{id,en,zh}.ts`:** new `inv.sim.1` and `inv.sim.2`. `inv.bukti.sim.sumber` now says the licence was checked at the interview table, not with Satpas. `inv.ksim.1` is left in place, unused.
- **Check (calculation script, not the test suite):** the project's `validasiEpisode` returns 0 messages on the changed episode. `jelajahiSemuaJalur` finds 126 paths, endings tuntas 42 / tinjau 84, no dead ends. It was 252 before, because the old SIM arena had two outcomes.

### 1. Dashcam handover
- **Where:** on the testimony stage, at Pak Darto's line "Silakan diputar. Semuanya terekam di situ." (`SerahDashcam.tsx`, shown by `LayarKeterangan` when the dashcam task is ready). The generic TUGAS card is gone for this node.
- **Motion (3.2 s, once):**
  1. Pak Darto's arm (plaid sleeve) comes down to the table with the dashcam memory card.
  2. The card slides across the table to the player's laptop.
  3. The laptop opens (4 frames) and the card goes in.
  4. The screen lights up "REKAMAN 14:32" with a blinking red dot.
- **Button:** one key "▶ Putar rekaman" opens the dashcam arena. It is usable at once; the motion does not block.
- **Arena as the laptop screen:** the existing ArenaDashcam is framed as that laptop (dark bezel + keyboard deck), only when `ep.investigasi`. Its content and logic are unchanged; it is 18 px taller.
- **Card into the notebook:** every "Bukti baru!" screen now shows the notebook's "Bukti" page. The new slip slides in and the paper clip drops onto it, with a soft sound. This applies to dashcam, rambu and SIM.
- **Reduced motion:** stills (laptop open and lit; slip already clipped).

### 2. New SIM check at the table
`PeriksaSim.tsx` replaces the Satpas flow in this episode only. Same room, same witness: Pak Darto says "Ini SIM saya, dan ini STNK truknya", then three tap-only steps on a table view (336×236), each with a small motion. There is no wrong answer.
1. **Tap the SIM:** it flips to the front. A magnifier and green frames mark the GOLONGAN box "B II UMUM" on the licence and the "SIM B II UMUM" row on the vehicle slip (truk trailer), with a "COCOK ✓" tag.
2. **Tap the hologram:** a torch beam from the player's phone lights it and it shimmers through colours (genuine card).
3. **Tap the QR code:** a phone mockup slides up with a "Cek data SIM" screen, scans for 1.3 s, then shows "Data SIM cocok", class and status. It is fictional: no institution name or logo anywhere.

Then Pak Darto's "lega" portrait appears, "Simpan hasil pemeriksaan" continues to the SIM card screen, and the card clips into the notebook. The tap targets are 56 px with a blinking ring. All text is id/en/zh in `i18n/kamus/investigasi.ts`. The words on the documents themselves are Indonesian (in-world props).

### Fit by calculation (360×640, 544 px room)
- SIM check: 418 to 466 px.
- "Bukti baru!" with the notebook page: about 416 px with three slips.
- Handover: the testimony screen, about 454 px.
- Dashcam arena: +18 px for the laptop frame.

### Files
- **New** (`client/src/cerita/investigasi/ui/`): `PeriksaSim.tsx`, `SerahDashcam.tsx`, `bukti-adegan.css`.
- **Changed:** `LayarKeterangan.tsx`, `BukuCatatan.tsx` (`buktiBaru`, `halaman`), `investigasi/LayarInvestigasi.tsx`, `hp/PemainHP.tsx`, `hp/arena/ArenaDashcam.tsx` (laptop frame, investigator only), `tipe.ts`, `episode/auto-2-inv/*`, `i18n/kamus/investigasi.ts`.
- **New art** (`client/src/cerita/seni/investigasi/`): `laptop`, `kartu-memori`, `tangan-serah`, `sim-depan`, `sim-belakang`, `stnk`, `kaca`, generated by `character/investigator-t080/bangun.mts`.

### Previews
Calculated mocks from the real art, in `character/investigator-t080/`, made by `pratinjau.mts`:
- `serah-t080-2x.png`: three moments of the handover and the laptop-framed replay.
- `sim-t080-2x.png`: the SIM check at the start and after each of the three steps.
- `aset-t080-3x.png`: the new art.

### Open
- Not seen in a browser or on a phone; all the motion is unseen.
- The replay itself does not first play small on the laptop in the room: the room shows the lit screen, then the full arena opens framed as the laptop.
- Pak Darto pulling the card "out of his shirt pocket" is his arm coming down from the shoulder; there is no pocket animation.
- The dashcam arena is 18 px taller in this episode; I did not re-measure its worst case after an answer.
- A guest who is mid-case exactly at the old SIM arena when this deploys resumes at the new table check.
