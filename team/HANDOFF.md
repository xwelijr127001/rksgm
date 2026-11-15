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
