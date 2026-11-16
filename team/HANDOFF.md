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
