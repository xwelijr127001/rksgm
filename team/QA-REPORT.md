# QA REPORT

## T-xxx — PASS/FAIL  (date)
- Tested: build/port, device (HP view/desktop)
- Steps run:
- Bugs: [B-01] description · repro steps · severity (high/med/low)

## T-003 — PASS (2026-11-15)
Reading folder C:\Users\User\Desktop\rksgm-episode2. Source code not edited, nothing committed.

- Tested build: fresh `npm run build` (client + server) from repo root. :4380 was NOT used: it runs an older `dist-uji` bundle without T-003 CSS (no `lp-kota-bingkai`) and has legacy off, and no script exists for the Ep2 build. Instead served the fresh build with `npm start`: :4001 (legacy off, for steps 1,3-7) and :4000 with `RAKSA_LEGACY=on` + one open quiz room (step 2, zh). Playwright (qa-venv, `-I`), Chromium, mobile emulation under 900px. Evidence: `team/evidence/T-003/qa/` (screenshots + run.log).
- Sizes: 320x640, 360x740, 390x844, 430x932, 800x1024, 740x360, 844x390, 1280x800.

| Step | Result |
|---|---|
| 1 Fold 360x740, id/en/zh x profile absent/present | PASS. Input 510-566 and Masuk bottom = **566** in all combos; no hscroll. zh only selectable with legacy on (PilihBahasa), tested on :4000: Masuk 566. |
| 2 Legacy banner (open room N7EQ) | **PASS.** 360x740: banner (fixed, y666-730) does not cover Masuk (y510-566); hero frame visible (144px). 375x667: banner y593-657, Masuk y366-422, hero frame hidden (D-04c works, greeting kept). Banner "Gabung" fills code N7EQ and focuses Masuk at both sizes. Masuk hit-test after scrolling to bottom: reachable. |
| 3 "WWWWWW" at 320/360/375/390/430 | PASS, scrollWidth == clientWidth (234/147/162/177/217). |
| 4 Sizes | PASS. No horizontal scroll at any size; 0 tappable elements <44px on phone/tablet sizes. Masuk bottom: 525 / 566 / 578 / 594 / 921; landscape 740x360 and 844x390: hero+greeting hidden, Masuk bottom 334 (first screen). Desktop 1280x800 visually identical to before-1280x800.png (only footer motion-note differs: headless motion setting, not a T-003 change). |
| 5 /cerita hub 390 (with profile) | PASS. JoinGame identical to before-cerita-390.png (22px code, .2em spacing, 10px 12px padding). |
| 6 Flow | PASS. Valid code ABC234 -> `/join?room=ABC234`; invalid "ZZZ" stays on `/` with "Kode room berisi 6 huruf/angka (contoh: K7M2QX)." in the Join card; Mode Cerita -> `/kenalan?lanjut=/cerita` (no profile), `/cerita` (profile). Console errors: 0 at every size. |
| 7 Keyboard 360 | PASS. Logo link, language select, sound, code field, Masuk, Mode Cerita link, in that order (logo link first is expected). |

- Bugs: none (high 0 / med 0 / low 0).
- Notes (not bugs): /cerita still clips WWWWWW (T-005, out of scope). Real DPR 1/3 devices not tested. Port :4380 serves a stale build, ROLE-QA.md hint is out of date.

## T-005 + T-006 — PASS (2026-11-15)
Reading folder C:\Users\User\Desktop\rksgm-episode2. Source not edited, nothing committed.

- Build: fresh `npm run build`. Served with `npm start`: :4001 (legacy off) and :4000 (`RAKSA_LEGACY=on`, ONE REAL open quiz room created via socket `host:create`, shown by `/api/acara-terbuka`). :4380 ignored. Playwright (qa-venv, `-I`), mobile emulation <900px. Evidence + `run.log`: `team/evidence/T-005-006/qa/`.
- `npm run test:client`: tests 724 / pass 724 / fail 0. `npm run test:e2e` (against :4000): "kegagalan: 0", exit clean.

| Step | Result |
|---|---|
| 1 /cerita hub "WWWWWW" (profile) | PASS. scrollWidth==clientWidth at 320 (242, stacked field over button), 360 (155), 375 (170), 390 (185), 430 (225); font 20px/1.6px. 1280 unchanged: 26px / .28em-equivalent, 727/727. No hscroll. |
| 2 D-17 placeholder | PASS. `/` and `/cerita` computed `::placeholder` = rgb(95,111,100) = `--tinta-lembut` #5f6f64 on rgb(255,254,250): contrast 5.28:1. Shots `placeholder-home.png`, `placeholder-cerita.png`. |
| 3 T-006 landscape, REAL banner | **PASS.** 844x390: pill y10-64 (x224-620); input y277-334 / Masuk y277-334 fully visible, hit-test on both = themselves (not overlapped). 740x360: pill y10-64, Masuk 277-334. 640x360: pill y10-64 (x176-464, clear of header controls), Masuk 226-282. Banner container `position:absolute`. Gabung fills the real code and focuses Masuk at all three. No hscroll. |
| 4 D-16 320x568 + banner | PASS (known low confirmed, slightly better). Join description hidden; Masuk y445-501, banner top **494** (not 487) -> only ~7px of Masuk under banner; button centre y473 tappable (hit-test OK); no hscroll. |
| 5 Regression | PASS. 360x740 id/en/zh Masuk bottom 566 (field width 165/185/182 w/ button width; WWWWWW text width unchanged from T-003 QA). 360x740 banner: y666-730, hero shown, Masuk tappable; 375x667 banner: hero hidden, Masuk 366-422 not covered. 1280x800 visually identical to T-003 QA shot (only "KODE" placeholder now darker, expected). |
| 6 Console | PASS. 0 errors on `/` and `/cerita` at 320x640, 360x740, 390x844, 430x932, 740x360, 844x390, 1280. One transient "404 Not Found" resource on 800x1024 during one run; NOT reproducible in 4 re-runs (with/without profile, `/` and `/cerita`), no failing URL observed. |

- Bugs: none (high 0 / med 0 / low 0).
- Notes: D-16 residual overlap as accepted by Lead; DPR/real devices not tested.

## T-004 — PASS (2026-11-15)
Reading folder C:\Users\User\Desktop\rksgm-episode2. Source not edited except the step-4 flag flip in `shared/brand.ts`, reverted (byte-identical to the pre-test file; `git diff shared/brand.ts` = only the T-002 `jabatan` change) and rebuilt. Nothing committed.

- Build: fresh `npm run build`; `npm start` on :4001 (legacy off) and :4000 (`RAKSA_LEGACY=on`, one real open room). :4380 not used. Playwright (qa-venv `-I`). Evidence + `run.log`, `run-flagoff.log`: `team/evidence/T-004/qa/`.
- `npm run test:client`: tests 724 / pass 724 / fail 0. `npm run test:e2e` (:4000): "console/http bermasalah: 0", "kegagalan: 0".

| Step | Result |
|---|---|
| 1 Fold 360x740 id/en/zh x profile absent/present | PASS. Masuk bottom **566** in all 6 combos (zh on :4000, legacy only); input 510-566 fully visible; sw 360. |
| 2 Hero renders | PASS. Pixel scene in frame (y78-222), Miss Raksa sprite cropped by the counter, bubble below frame: "Miss Raksa · Layanan Klaim" / "Miss Raksa · Claims Officer" / "Miss Raksa · 理赔专员" + slogan. Frame hidden at 320x640 and 740x360; shown 360 (144px), 390 (156), 430 (172), 800 (420x190), 1280 (512x380). No hscroll anywhere; 0 elements <44px on phone sizes. |
| 3 Motion matrix 360x740 | PASS, exactly as expected. no-pref+ikut: frame `lp-masuk`, sprite `tokoh-sambut-mr`, CTA transition 0.08s, opacity 1, in view. no-pref+penuh: same. reduce+ikut: no animations (0 running), opacity 1, in view. reduce+penuh: animations present (`lp-masuk`, `tokoh-sambut-mr`), visible. |
| 4 Flag off (missRaksa `aktif:false`) | PASS. Hero shows Raki on the counter (slot 318x88, no sprite); bubble = slogan only ("anytime anywhere with our smile"); Mode Cerita card shows the Raki portrait (`lp-potret-raki`). Masuk bottom 547. File reverted + rebuilt, sprite back. |
| 5 CTA | PASS. Valid ABC234 -> `/join?room=ABC234`; invalid "ZZZ" -> "Kode room berisi 6 huruf/angka (contoh: K7M2QX)."; Mode Cerita -> `/kenalan?lanjut=/cerita` (no profile) / `/cerita` (profile). `:active` (mouse down): translateY(4px), shadow 0 4px -> 0 (button sinks); shot `masuk-active.png`. Tab order: logo, language, sound, code, Masuk, Mode Cerita. |
| 6 Legacy banner (real room) | PASS, unchanged. 360x740: banner y666-730, Masuk 510-566 tappable, hero shown. 375x667: banner y593-657, hero hidden, Masuk 366-422 tappable. 844x390: pill y10-64, Masuk 277-334 tappable. Gabung fills the real code and focuses Masuk at all three. |
| 7 Budget | PASS. `/` at 360x740, cache disabled: only image request is `/karakter/miss-raksa-besar.webp` (existing sprite sheet; no new PNG/SVG; favicon not requested in this run). Build gzip: index CSS 10.41 KB, JoinGame chunk 1.89, Landing 1.34 (matches HANDOFF: +~0.42 KB total) - far under 30 KB. |
| 8 /cerita hub 390 + console | PASS. Visually identical to T-005-006 hub shot (that shot is viewport-only, has a focus ring). Console: 0 errors on `/` and `/cerita` at 320, 360, 390, 430, 800, 740x360, 844x390, 1280. |

- Bugs: none (high 0 / med 0 / low 0).
- Notes: real devices/DPR not tested (HANDOFF has emulated DPR 1/2/3).

## T-007 — PASS (2026-11-15)
Reading folder C:\Users\User\Desktop\rksgm-episode2. Source not edited except the step-4 flag flip in `shared/brand.ts`, reverted (byte-identical to pre-test; `git diff shared/brand.ts` = only the T-002 `jabatan` change) and rebuilt. Nothing committed.

- Build: fresh `npm run build`; `npm start` on :4001 (legacy off); :4000 (legacy on) only for the zh check. Playwright (qa-venv `-I`). Evidence + logs: `team/evidence/T-007/qa/`.
- `npm run test:client`: tests 724 / pass 724 / fail 0. `npm run test:e2e`: "console/http bermasalah: 0", "kegagalan: 0".

| Step | Result |
|---|---|
| 1 D-36 tower windows | PASS. 4x-zoom shot `tower-zoom.png` at 800x1024: left tower shows 3x3 windows with clear margin to the dark outline on both sides (`hero-800.png`, `hero-360.png`). |
| 2 D-37 sprite filter | PASS. Computed `filter` on the hero sprite = `none` at 360, 800 and 1280. Elsewhere unaffected: `/kenalan` sprite still `drop-shadow(rgba(23,54,42,.1) 0 6px 0)`. (`/cerita` and `/join?room=` render no `.tokoh-sprite`.) |
| 3 R-10 reduced motion (360x740) | PASS. reduce+ikut: 0 running animations on the frame or descendants, `::before`/`::after` animation none, opacity 1, in view. reduce+penuh: `tokoh-sambut-mr` running, visible. no-pref+ikut: running, visible. |
| 4 D-38 flag off | PASS. `aktif:false`: bubble class `lp-kota-balon lp-kota-balon-tanpa-potret`, `::before` display **none** (no tail), bubble = slogan only, Raki on the counter (`flag-off-360.png`). Reverted + rebuilt; flag on: tail `::before` display block, bubble "Miss Raksa · Layanan Klaim" + slogan, tail present next to the portrait. |
| 5 Regression | PASS. 360x740 id/en/zh Masuk bottom 566, frame 320x144, no hscroll. 800x1024 frame 420x190, 1280x800 frame 512x380 / Masuk 458-515 as in T-004. `/cerita` hub 390 shot `cerita-390.png` unchanged. Console: 0 errors at 360, 800, 1280. |
| 6 Tests | PASS (summary lines above). |

- Bugs: none (high 0 / med 0 / low 0).
- Not tested: real devices.

## T-008 — PASS (2026-11-15)
Reading folder C:\Users\User\Desktop\rksgm-episode2. Source not edited except the step-4 flag flip in `shared/brand.ts`, reverted (`git diff HEAD -- shared/brand.ts` empty) and rebuilt. Nothing committed.

- Build: fresh `npm run build`; `npm start` on :4001 (legacy off) and :4000 (`RAKSA_LEGACY=on`, one real open room; zh tested there). Playwright (qa-venv `-I`), DPR 2 for phone sizes. Evidence + logs: `team/evidence/T-008/qa/`.
- `npm run test:client`: tests 724 / pass 724 / fail 0. `npm run test:e2e`: "console/http bermasalah: 0", "kegagalan: 0".

| Step | Result |
|---|---|
| 1 Alignment | PASS in id/en/zh, profile absent/present. **360x740:** frame, `.lp-join`, `.lp-pintu` all x20-340; bubble right edge 340 (its left is 92 because the portrait sits at 20 on the same row); header logo left 20, sound button right 340. **390x844:** same set x20-370, logo left 20, sound right 370. Sprite centre == frame centre: 180/180 (360), 195/195 (390), 400/400 (800x1024), 924/924 (1280x800). |
| 2 Fold | PASS. Masuk bottom 566 at 360x740 (absent + present, all langs), 578 at 390x844; also 525 (320x640), 572 (375x667), 587 (412), 594 (430). No horizontal scroll at 320, 360, 375, 390, 412, 430, 800, 1280. |
| 3 Art | PASS. Hero shots at 360 (+4x zoom), 375, 390, 412, 430, 800: no cloud sliver at the top edge at 375-412; plant visible between her hands/arm and the office tower; sun disc behind her head. |
| 4 Flag off | PASS. Raki centred (svg centre 180 == frame centre 180); bubble = slogan only, `::before` display none, bubble spans x20-340 (aligned with frame). Reverted + rebuilt. |
| 5 Banner (real room) + motion | PASS, identical to T-006/T-007. 360x740: banner y666-730, Masuk 510-566, hero shown, tappable. 375x667: banner 593-657, Masuk 366-422, hero hidden. 844x390: pill y10-64, Masuk 277-334. Gabung fills the real code and focuses Masuk at all three. reduce+`?gerak=ikut`: 0 running animations, hero opacity 1 in view; `penuh`: sprite animation running. |
| 6 Hub + console | PASS. `/cerita` 390 unchanged (`cerita-390.png`). Console 0 errors at 360, 390, 800, 1280 on `/` and `/cerita`. |

- Bugs: none (high 0 / med 0 / low 0).
- Note: the brief's "bubble left x=20" holds only for the flag-off bubble; with Miss Raksa on, the portrait is at x20 and the bubble right edge is 340, which matches the design (D-47).

## T-010 — PASS (2026-11-15)
Reading folder C:\Users\User\Desktop\rksgm-episode2. Source not edited. Nothing committed.

- Build/ports: fresh `npm run build`; `npm start` on :4001 (legacy off, harness + most checks) and :4000 (`RAKSA_LEGACY=on`, one real open room, zh + /acara/join + banner). Harness: `tools/ukur-aset-t010.mjs` (5 runs, 360x740 DPR2 and 390x844 DPR3, 200 KB/s / 150 ms, CPU 4x, UI_BASE=:4001) and `tools/cek-pemuat-t010.mjs` (UI_BASE=:4000). Playwright (qa-venv `-I`) for the rest. Evidence: `team/evidence/T-010/qa/` (`harness/`, `frames/`, `pemuat-rerun/`, logs, shots).
- `npm run test:client`: tests 724 / pass 724 / fail 0. `npm run test:e2e`: "console/http bermasalah: 0", "kegagalan: 0".
- Build report (my build): index CSS gzip 10.78 KB (HANDOFF before 10.41), Landing chunk 2.51 (was 1.34), JoinGame 1.86, index JS 227.84 (was 227.60): growth well under 10 KB gzip (HANDOFF total +3.31).

### Harness medians (QA 5 runs vs HANDOFF "after")
| journey | vp | metric | QA median | HANDOFF after | diff |
|---|---|---|---|---|---|
| a | 360 | LCP | 5168 | 5188 | -0.4% |
| a | 360 | bytes / requests | 804,738 / 19 | 804,738 / 19 | same |
| a | 360/390 | loader shown / dismissed | 5146 / 5202 · 5174 / 5229 | ~5150 / +50 ms | same |
| b | 360 | stage mounted = first room = dialogue | 2013 | 1987 | +1.3% |
| b | 360 | final bg+fg+char (group reveal) | 2045 | 2013 | +1.6% |
| b | 390 | first room / final | 2233 / 2266 | 2243 / 2278 | -0.4% |
| b | both | warm-up cache hit | **5/5**, **5/5** | 5/5 | same (>=4/5) |
| c | 360 | dialogue / first room / final | 9675 / 9677 / 11890 | 9649 / 9649 / 11874 | +0.3% / +0.1% |
| c | 390 | first room / final | 9653 / 12204 | 9645 / 12195 | +0.1% |

All within ~2% (tolerance 15%), same direction: room visible ~2.2 s earlier than before, journey b final ~2 s earlier, journey c final unchanged.

### Steps
| Step | Result |
|---|---|
| 1 Harness | PASS (table above). |
| 2 Episode 2 placeholder | PASS. Throttled cold c: first dialogue frame (9670 ms) = blurred room + pill "Menyiapkan adegan…" (frame `frames/frames-c-360/005-9669ms.jpg`), background/character/foreground at opacity 0 until ONE reveal at 11891 ms where latar, tokoh, depan are all 1.00, placeholder 0 and pill gone together (`007-11888ms.jpg`). 50 ms sampler: 45 pre-reveal samples, all with the blurred placeholder, 0 flat/empty frames. Journey b: single pre-reveal dialogue sample (blur + pill, layers 0), reveal ~45 ms later; the earlier "flat" samples belong to the /cerita list card, not the scene (dialog false). Reduce + `?gerak=ikut`: instant swap (layer transition 0s), `?gerak=penuh` 0.24 s (rerun of Fullstack tool). Backgrounds returning 404: `data-gagal-latar`, blurred room stays at opacity 1, pill gone, Miss Raksa visible, "Lanjut" advances dialogue. **Not verified live:** "change location in the story -> new thumbnail" (could not script the free-reply conversation to reach a 2nd location within the time box; relying on Fullstack's gate code/tests). |
| 3 Loader | PASS. Held sheet 1.5 s: overlay shown ~400-425 ms in id "Menyiapkan…", en "Preparing…", zh "正在准备……" (on :4000), dismissed when the sheet decodes (~1.2 s on screen); `#root` inert while shown, status text outside `#root`, not inert after. Sheet never arrives: released at 1988 ms (~2000 cap), frame 20,78 320x144, Masuk bottom 565.7. Second visit in the same session (sessionStorage `raksa:loader:v1`): no loader. Not mounted on /host, /projector, /join, /cerita, /acara/join, /cerita/auto-2, /kenalan. Reduced motion: bar animation none. Scroll lock: while shown the overlay is `position:fixed`, html overflow hidden, wheel leaves scrollY 0; after dismissal scrolling works (302). Sheet URL 404: overlay dismisses, page works (Masuk 566, /join flow OK, no page errors). Focus: user navigation /cerita -> `/`: h1 gets focus only after the overlay is removed; cold load moves no focus (existing policy). Raki + bar present. |
| 4 Regression | PASS. 360x740 Masuk 566 (390: 578, 320: 525, 375: 572, 800: 778, 1280: 515), alignment lines identical to T-008 QA (frame/join/pintu x20-340, sprite centre 180/195/400/924), no hscroll 320-1280. Banner (real room): 360x740 banner y666-730 / Masuk 510-566 tappable; 375x667 hero hidden, Masuk 366-422; 844x390 pill y10-64, Masuk 277-334; Gabung fills + focuses Masuk. Reduced-motion ikut/penuh as before. Episode 1 (`/cerita/auto-1`) first scene renders normally (pixel stage). /cerita hub 360 shot OK. Console: 0 errors on `/`, `/cerita`, Episode 2 scene 1 at 360 and 1280. |
| 5 Tests + build | PASS (above). |

- Bugs: none (high 0 / med 0 / low 0).
- Observations (not bugs, already in HANDOFF known issues): on a cold throttled `/` the loader appears only after the ~730 KB entry JS has run (~5.15 s) and stays ~55 ms + 200 ms fade, so it reads as a flash; LCP ~+20 ms vs before. Designer's call on a minimum display time.
- Not tested: real devices, the 0.8 Mbps matrix, scene change to pool/tol (D-55), live location-change thumbnail (see step 2).

## T-010 fix round — PASS (2026-11-15)
Reading folder C:\Users\User\Desktop\rksgm-episode2. Source not edited. Nothing committed.

- Build/ports: fresh `npm run build`; `npm start` :4001 (legacy off; harness, regression) and :4000 (`RAKSA_LEGACY=on`; failure matrix, loader/pill tool, real banner room). Playwright (qa-venv `-I`) + Fullstack tools `ukur-aset-t010.mjs` (5 runs, both viewports, UI_BASE=:4001), `cek-gagal-t010.mjs`, `cek-pemuat-t010.mjs`. Evidence: `team/evidence/T-010/qa-fix/` (`harness/`, `gagal/`, `pemuat/`, `lokasi2-*`, shots).
- `npm run test:client`: tests 724 / pass 724 / fail 0. `npm run test:e2e`: "console/http bermasalah: 0", "kegagalan: 0". Build gzip: index CSS 10.78 KB, Landing 2.77 KB, index JS 227.84 KB (vs HANDOFF first-round baseline CSS 10.41 / Landing 1.34 / JS 227.60: ~+2 KB for these chunks; HANDOFF total 3.57) — well under 10 KB.

### Harness medians (QA, n=5, median) vs corrected HANDOFF "after"
| journey | vp | metric | QA | HANDOFF | diff |
|---|---|---|---|---|---|
| b | 360 | first room treatment | 1993 | 2007 | -0.7% |
| b | 360 | all required layers decoded | 2003 | 2026 | -1.1% |
| b | 360 | visibly revealed | 2017 | 2041 | -1.2% |
| b | 360 | warm-up COMPLETED cache hit | **5/5** | 5/5 | same |
| b | 360 | in-flight reuse | 0/5 | 0/5 | same |
| b | 390 | first room treatment | 2238 | 2240 | same |
| b | 390 | decoded / visibly revealed | 2249 / 2256 | 2250 / 2266 | same |
| b | 390 | warm-up COMPLETED cache hit | **0/5** | 0/5 | same (as seen, not relabelled) |
| b | 390 | in-flight reuse (no second request) | **5/5** | 5/5 | same |
| c | 360 | first room / visibly revealed | 9647 / 11890 | 9680 / 11899 | within 0.4% |
| c | 390 | first room / visibly revealed | 9664 / 12202 | 9680 / 12236 | within 0.3% |
| a | 360 / 390 | LCP | 5228 / 5236 | 5288 (360) | -1.1% |
| a | both | loader shown | not shown (null, 10/10) | not shown | same |
| a | both | bytes / requests | 805,764 / 19 | 806,054 / 20 | ~same |

### Failure matrix (`cek-gagal-t010.mjs`, :4000): ALL PASS, 7/7
| case | result |
|---|---|
| latar-404 | PASS: `data-gagal-latar`, blurred room opacity 1, failed bg hidden, pill gone |
| depan-404 | PASS: foreground omitted from DOM, room + character shown, placeholder gone |
| tokoh-rusak (corrupt WebP) | PASS: named silhouette for Miss Raksa, scene revealed |
| ekspresi-saat-muat | PASS: pending state seen; revealed only with the NEW expression (netral) decoded |
| dpr-saat-muat (2->3) | PASS: gate restarted on new descriptors, all revealed layers decoded at DPR 3 |
| putar-saat-hangat (rotation) | PASS: warm generation 0 -> 1, re-warmed at 669 px, scene bg not re-requested after the click |
| lokasi-kedua (D-55) | PASS (tool). My own frame series (360x740 DPR2, 200 KB/s throttle, 50 ms sampler, state from `state-lokasi-kedua.mts`, one "Lanjut"): first frame of "Pool truk" at t=3212 = blurred pool thumbnail opacity 1 + pill, all three layers opacity 0; 73 pre-reveal samples, all with the placeholder, 0 flat frames; then one reveal (latar, trailer, Rudi fade in together). Shots `lokasi2-*.png`, data `lokasi2-sampel.json`. **This closes the earlier unverified item.** |

### Steps
| Step | Result |
|---|---|
| 3 Loader | PASS. Cold `/` normal link: loader skipped (`dingin-cepat` id/en pass, harness journey a 10/10), page complete (Masuk 565.7). Sheet held 1.5 s: shown ~400 ms, on screen 1124-1140 ms; sheet 0.5 s late: on screen 635 ms (>= 600); sheet never arrives: dismissed 1996 ms after mount, frame 20,78 320x144. Not mounted on /host, /projector, /join, /cerita, /acara/join, /cerita/auto-2, /kenalan; second visit in session: none; reduced motion: bar animation none; h1 focus only after dismissal (t 2770, overlay gone), cold load moves no focus. zh text verified. |
| 4 Pill / fallback / diag | PASS. Scene pill 30.3 px tall at 320/360/390 in id, en and zh, all inside the stage (en 320: 187 px, 55 px margins). Only remaining `.cer-memuat` rule = activity fallback `padding: 24px 16px` (no position/top/radius); `git diff HEAD` empty for CeritaMain.tsx and cerita.css. `window.__raksaHangat`: `undefined` on the production build without `raksa:diag`, `object` with `raksa:diag=1`. |
| 5 Regression | PASS. 360x740 Masuk 566 (390: 578, 320: 525, 375: 572, 800: 778, 1280: 515), alignment lines x20-340 / 20-370, sprite centre 180/195/400/924, no hscroll. Legacy banner (real room): 360x740 banner 666-730 / Masuk 510-566, 375x667 hero hidden / Masuk 366-422, 844x390 pill 10-64 / Masuk 277-334, Gabung fills + focuses. Reduced motion ikut/penuh as before. Episode 1 first scene and /cerita hub render fine. Console: 0 errors on `/`, `/cerita`, Episode 2 scene 1 at 360, 390, 800, 1280. |

- Bugs: none (high 0 / med 0 / low 0).
- Not tested: real devices, 0.8 Mbps matrix.

## T-011 — PASS (2026-11-15)
Reading folder C:\Users\User\Desktop\rksgm-episode2. Source not edited. Nothing committed.

- Build/ports: fresh `npm run build`; `npm start` :4001 (legacy off) and :4000 (`RAKSA_LEGACY=on`, one real room for banner cases; zh). `tools/cek-pra-t011.mjs` (UI_BASE=:4000) + own Playwright/CDP scripts (qa-venv `-I`). Evidence: `team/evidence/T-011/qa/` (`run.log`, `run-c.log`, shots) and `qa/tool-run/hasil.json`.
- `npm run test:client`: tests **726** / pass 726 / fail 0. `npm run test:e2e`: "console/http bermasalah: 0", "kegagalan: 0". Built `index.html` gzip **2,301 B** (build report 2.30 KB); Landing chunk 3,115 B (~3.04 KB, HANDOFF 3.09); index.js 227.88 KB (HANDOFF +0.04). No other growth.

### 1. cek-pra-t011.mjs: ALL PASS, 19/19
lambat-dingin-id (FCP 1332), lambat-dingin-en (1336), lambat-dingin-zh (1344) · cepat-dingin (node never, home 350 ms) · sedang-lembar-1s (on screen 613 ms) · rute /host, /projector, /join, /cerita, /cerita/auto-2, /acara/join, /kenalan, /cms, /room/ABC123 (9 cases: no node, no `__lepasPra`, no aria-busy) · js-diblokir-id / -en / -zh (too-long text, bar none, aria-busy cleared) · gerak-dikurangi-prajs · adopsi-lembar-terlambat (released 1998 ms after home mount, cap).

### 2-3. Own timings (CDP 200 KB/s, 150 ms RTT, CPU 4x, cache off, 50 ms sampler)
| case | FCP | node first present | home mounted / fade start | node gone | frames with no overlay & no home after node | max `.lp-pemuat` nodes | `.lp-pemuat-isi` rect first -> before fade |
|---|---|---|---|---|---|---|---|
| 360 id | 1400 | 1399 | 5147 | 5446 | 0 | 1 | identical (93.6, 238, 172.7x204.8) |
| 360 en | 1352 | 1349 | 5127 | 5336 | 0 | 1 | identical |
| 360 zh (:4000) | 1400 | 1397 | 5165 | 5340 | 0 | 1 | identical |
| 390 id | 1356 | 1353 | 5120 | 5392 | 0 | 1 | identical (108.6, 285.8) |
| 390 en | 1356 | 1355 | 5126 | 5344 | 0 | 1 | identical |
| 390 zh | 1352 | 1350 | 5139 | 5336 | 0 | 1 | identical |
FCP is the loader (~1.35-1.40 s vs ~4 s blank before). Hero sprite present when the homepage mounts (no pop-in), status text correct ("Menyiapkan…", "Preparing…", "正在准备……"; the `<p>` carries `lang="zh-CN"` for zh; the node itself has no `lang` attribute, `html lang` follows the app). No duplicate overlay at any time.
Fast cold `/` x5 (no throttle): node never in the DOM, no React overlay, homepage complete (sprite present, root not inert), home mounted 357-412 ms; reload in session: none, 5/5.
Medium (1.5 MB/s, 40 ms, sprite held 1 s): node first 623 ms, fade 1237 ms = **614 ms on screen** (>= 600), gone 1536 ms, never more than 1 `.lp-pemuat` node, no reappearance, no React overlay.

### 4. Routes / resumed player
- /host, /projector, /join, /cerita, /cerita/auto-2, /acara/join, /kenalan, /cms (slow link): no `#pra-pemuat` instantiated (the `<template id="pra-tpl">` element exists in index.html, as designed, never cloned), no aria-busy.
- Resumed player: the app has no code path that redirects off `/` on first load (`PhaseRouter` only acts on /lobby, /tutorial, /main, /hasil, so a real resume lands there by direct URL, where the node never exists), so the literal scenario cannot be produced via storage setup. Closest reachable equivalent tested: throttled cold `/`, node present, React mounted, then SPA navigation to `/kenalan`: node removed ~200 ms after the navigation (under CPU 4x), `#root` not inert, URL `/kenalan`, no overlay lingering. Code path `LepasPraDiLuarBeranda` -> `__lepasPra(0)` confirmed by this behaviour.

### 5. Failure / reduced motion
| case | result |
|---|---|
| main JS blocked (abort), 16.5 s | PASS: id "Memuat terlalu lama. Periksa koneksi lalu muat ulang halaman.", en "Taking too long. Check your connection and reload the page.", bar `display:none`, `aria-busy` cleared, `<noscript>` text untouched ("Game ini memerlukan JavaScript aktif."). zh covered by the tool. |
| CSS only blocked | Not stuck forever. 4 s/8 s: pre-JS node + aria-busy still up (home not mounted: the lazy chunk's "Unable to preload CSS" rejects). At 17 s the node shows the "too long" message (bar hidden, aria-busy cleared) overlaying the app's own error page ("Halaman ini belum bisa dibuka"), root unstyled. Reported behaviour, not a bug (CSS loss is an unrealistic partial failure; the user is told to reload). |
| reduced motion before JS | PASS: bar `animation none` (1e-6 s), Raki 1e-6 s x1 (still). After JS with `?gerak=penuh` + reduce: 1 running animation (sprite). |

### 7. Regression: PASS
360x740 Masuk 566 (390: 578, 320: 525, 375: 572, 412: 587, 430: 594, 800: 778, 1280: 515), alignment lines x20-340 / 20-370, sprite centre 180/195/400/924, no hscroll. Legacy banner (real room): 360x740 banner 666-730 / Masuk 510-566, 375x667 hero hidden / Masuk 366-422, 844x390 pill 10-64 / Masuk 277-334, Gabung fills + focuses. Reduced motion ikut/penuh as before. Episode 2 scene 1 revealed (`data-siap`) and Episode 1 first scene fine at 360 and 1280; console 0 errors (360, 390, 800, 1280).

- Bugs: none (high 0 / med 0 / low 0).
- Note: my regression scripts re-wrote same-named screenshots (home-*, ep1-*, cerita-hub-*) inside `team/evidence/T-010/qa-fix/` with equivalent T-011 results; nothing else was overwritten.
- Not tested: real devices, a literal resumed-player redirect (not reachable, see step 4).

## T-013 Stage 1 — PARTIAL, superseded by Stage 2 (2026-11-15)

Folder read: C:\Users\User\Desktop\rksgm-episode2. No source edited, nothing committed. Lead (option C): Stage 2 is already built on this tree, so a Stage-1-only verdict is moot; the Stage 2 QA is the verdict that matters.

| # | Test | Result |
|---|---|---|
| 1 | `tools/cek-piksel-t013.mjs` on :4001 (my own fresh build, Stage 1 only at that moment) | **82/82 PASS** ("ALL PASS"; log `team/evidence/T-013/stage1/qa/cek-82.log`). Kantor cases pixel, 0 kantor/miss/hendra illustration requests, Hendra chat avatar = pixel (`piksel:hendra`) in all 5 faces, bima/pool illustrated |
| 2 | Playthrough id (auto-driver, 390x844, ~1500 steps, dist already mixed with Stage 2 WIP) | Reached all 4 locations and the WhatsApp/form/stage-order/location-picker activities, 0 console errors except one 404 on `rudi-avatar-160` that occurred while dist was being rebuilt by another agent (file exists and serves 200 afterwards, not a product bug). My driver did not get past the lane-tap activity ("Periksa rambu"), so end of episode and en/zh were NOT reached |
| 3, 4, 5, 7 | Per-viewport shots, WebKit, network bytes, regression/test suites | NOT RUN (dist changed under me) — covered by the Stage 2 QA |
| 6 | Kantor -> illustrated location and back | **NOT TESTABLE / superseded** (no illustrated locations remain) |

Bugs: none found (B-xx: 0). Note: my 82-check run re-wrote same-named screenshots/`hasil.json` in `team/evidence/T-013/` (equivalent content).

## T-013 Stage 2 — INTERIM, 1 bug (2026-11-15)

Folder read: C:\Users\User\Desktop\rksgm-episode2. No source edited, nothing committed. Per Lead (Stage 3 starts on this tree), this is a quick INTERIM run on the Stage 2 build (fresh `npm run build`, :4001); per-room screenshots skipped; a FINAL QA follows Stage 3.

| # | Test | Result |
|---|---|---|
| 1 | `tools/cek-piksel-t013.mjs` | **70/70 PASS** ("ALL PASS", `stage2/qa/cek-70.log`) |
| 2 | Playthrough id (3 auto-driven runs, 390x844): kantor, pool, bengkel, tol, wawancara all pixel; WhatsApp, forms, stage order, location picker, rambu lane activity work | 0 console errors, 0 HTTP>=400. Driver stopped at the witness-interview planner (my driver limit, not a product stall) so **no ending reached, en/zh not played** |
| 2b | Requests on AUTO-2 | Ep1 room PNGs / bu-rina: **0**. **Illustration WebP: NOT 0 — see B-01** |
| 4 | WebKit 27.2, 390x844 DPR3, kantor (mentor) + pool | No halo or rectangle, pixels crisp, nameplate "LAYANAN KLAIM RAKSA" complete, text readable (`stage2/qa/webkit-*.png`). No page errors |
| 6 | PNG bytes served on a (partial) playthrough | 135,522 B (HANDOFF PNG subtotal 136,027, same set minus 3 small props not reached). Plus WebP 219,168 B (B-01) |
| 7 | `test:client` | **728/728 pass** (brief expected 735: tree moved on, Stage 3 likely changed tests); `test:e2e` exit 0, kegagalan 0, console/http 0 |
| 3, 5, rest of 7 | Per-room shots, reduce/gerak, nameplate id/en/zh, homepage numbers, Ep1 scene | NOT RUN (interim) |

### Bugs
- **[B-01] Illustration WebP still downloaded on AUTO-2** · medium · Repro: open /cerita/auto-2 (id), press Lanjut through the first scene: `hendra-panik-1160-*.webp` (113,640 B) is requested at the Pak Hendra call gate/chat opening (step ~7) and `kantor-latar-1100-*.webp` (65,788 B) when the first activity "Mulai" screen opens (step ~16); the six `*-avatar-160-*.webp` (rudi, admin, bima, tol, polisi, darto, ~6.4-6.9 KB each) also load. Total WebP 219,168 B, which breaks "0 requests to the illustration set" and the 145,510 B total (real total ≈ 355 KB of the 400 KB gate). Non-stage screens (gate card, activity intro, avatars) still use the illustrated assets; Stage 3 cleanup should cover them.

Note: my 70-check run re-wrote same-named screenshots/`hasil.json` in `team/evidence/T-013/stage2/` (equivalent content).

## T-013 FINAL — PASS with gaps (2026-11-15)

Folder read: C:\Users\User\Desktop\rksgm-episode2. No source edited (a temporary helper `tools/cerita/zz-qa-akhir.mts` was created to walk the real engine to the endings and deleted again; copy at `team/evidence/T-013/final/qa/zz-qa-akhir.mts.txt`), nothing committed. Fresh `npm run build`; :4001 (legacy off), :4000 (legacy on, one real room). Evidence: `team/evidence/T-013/final/qa/`. Note: the tree was still being edited/rebuilt by Fullstack during the run (dist rewritten 00:02); one e2e run failed for that reason (stale chunk hashes) and passed on re-run.

| # | Test | Result |
|---|---|---|
| 1 | `tools/cek-piksel-t013.mjs` | **73/73 PASS** (`cek-73.log`) |
| 2 | Full playthrough id (auto-driver, 390x844, 4000 steps; 2 more seeds of 3500) | Kantor, bengkel, pool, tol, wawancara all `data-gaya=piksel`; WhatsApp, forms, attachments, stage-order, location picker, rambu lanes, witness planner (driver fixed) work; Part 4 reached (week 8+). **0 console errors, 0 HTTP>=400, no stuck scene**. Cast portraits seen: piksel hendra, bima, tol, polisi, darto, admin, rudi |
| 2b | Endings | **NOT reached through the UI.** The driver stops in Part 4 (closing WhatsApp chain "Minggu ke-7..13": reply radio options, then the closing-message composer "Pesan penutupan" with "+ Masukkan" parts + "Kirim pesan"); 300-500 step runs from engine-made saves (catatan, kurang) ended in that chain. The real engine (same data the UI uses) reaches **2 endings, `akhir-catatan` (first-choice policy) and `akhir-kurang` (last-choice policy)** without error. End screen/scoring UI and the en/zh *endings* were NOT seen; en and zh were driven through the Part 4 chat only (0 errors). Needs a human/Chrome finish |
| 3 | B-01 re-check, whole playthrough | **0 WebP requests** (3 runs); Episode 1 PNGs: 0. Images transferred: kantor latar 8,705 + meja 2,404, bengkel 22,249, tol 21,001, pool 11,013 + trailer 6,691, wawancara 12,252, map 259, hendra 18,445, samping 28,471, miss-raksa 19,972 = **151,462 B** (HANDOFF 151,731; surat/foto props not hit). **B-01 FIXED** |
| 4 | Per-room screenshots 360x740 DPR2, 390x844 DPR3, 1280x800 (kantor, bengkel, tol, pool, wawancara-3, bima) | Taken (`chromium-<room>-<w>.png`). Viewed 390: pool Rudi has full drawn legs, truck whole; wawancara-3 shows 3 witnesses with drawn bodies, no overlap; kantor nameplate complete. Not pixel-inspected at all sizes |
| 5 | Motion (canvas-hash sampling, 15 s, 390 DPR2) | reduce + `?gerak=ikut`: **1 distinct frame in every room (no idle animation)**. no-preference: 2 distinct frames in wawancara-3 and tol, 1 in pool and bengkel (animation not observed in those two within 15 s: narration lines, no speaker/blink caught); `?gerak=penuh` under reduce: 2 frames in wawancara-3/pool/bengkel, 1 in tol. Hop/slide-in/crossfade not individually verified. Nameplate in en/zh: NOT checked |
| 6 | WebKit 27.2 390x844 DPR3: pool, wawancara-3, chat opener | No halo/rectangle, crisp pixels, no page errors; chat avatar = pixel Hendra (`webkit-*.png`) |
| 7 | Regression | Homepage numbers unchanged (Masuk bottom 566/578/525/572/778/515 at 360/390/320/375/800/1280; no horizontal scroll; no console errors); legacy banner 360x740 y666-730, 375x667 y593-657, landscape 844x390 y10-64; Episode 1 first scene + choice screen load with its own PNGs, 0 errors; `test:client` **728/728**; `test:e2e` exit 0, kegagalan 0, console/http 0 (after one re-run); `dist` has 3 WebPs (prototype avatars 50 KB, unreferenced, never requested, disclosed in HANDOFF) |

### Bugs
None high/medium found. Observations: (a) idle animation not seen in pool/bengkel in a 15 s window; (b) in en/zh the Pak Hendra chat lines stay Indonesian (D-90, known/out of scope); (c) 3 unreferenced prototype WebPs remain in dist.

Evidence overwrite note: my 73-check run re-wrote same-named files in `team/evidence/T-013/` (equivalent content).

## T-015 — PASS (2026-11-16)

Folder confirmed: C:\Users\User\Desktop\rksgm-episode2 (own server on :4001; :4000 untouched). No source edited, nothing committed. Evidence: `team/evidence/T-015/qa/`.

- Browser checks: `cek-piksel-t013.mjs` 84/84 PASS; `cek-sisipan-t015.mjs` 9/9 PASS (cek-84.log, cek-sisipan-9.log).
- Independent matrix (matrix.log + screenshots): akhir-puas / akhir-kurang / akhir-catatan at Chromium 360x740 DPR2, 390x844 DPR3, 1280x800 and WebKit 390x844 DPR3 = 12/12: cut-in hits 0 head boxes, fully inside the stage, 0 console errors. Phones: cut-in "kiri-bawah-papan" (name board readable, checked visually at WebKit 390); 1280: top-right.
- Other kantor cut-in scenes: the only stage scenes with cut-in + a character are those three endings (grep adegan/episode). The `tel-*` states (Hendra on the phone, no one on stage) render as chat screens, not the stage, so there is no cut-in to place.
- `npm run test:client` 729/729; `npm run test:e2e` exit 0, kegagalan 0 (needs the server started with `RAKSA_LEGACY=on`; without it the e2e hangs at socket connect, not a bug).
- Visual: cut-in's lower-right corner is close to the desk phone handset at 390 (no overlap), as the HANDOFF notes. Not checked on a real iPhone.
- Bugs: 0.

## T-016 — PASS (2026-11-16)

Folder confirmed: C:\Users\User\Desktop\rksgm-episode2 (own server :4001 with RAKSA_LEGACY=on; :4000 untouched). No source edited, nothing committed. Evidence: `team/evidence/T-016/qa/`. Tested in id only; Fullstack was editing T-014 (en/zh text) in the same tree during the run.

1. Homepage (home.log, home-*.png): Masuk bottom 566/578/525/572/778/515 at 360/390/320/375/800/1280 = unchanged; 844x390 landscape 334; no horizontal scroll, 0 console errors, loader gone. Opened 390 and 1280: hero, Miss Raksa greeting bubble, clouds whole at 1280 (none at 390), no regression seen. Legacy banner not re-run (T-016 did not touch it). 800 not opened.
2. Activity backdrop: "Permintaan dokumen" (tel-cemas) at 390 DPR3 shows LAYANAN KLAIM RAKSA on the board, crisp; `ep2-papan-kantor` PNG requested once. The second activity I opened ("Bundel pengajuan", map screen) has no kantor backdrop, so it does not show the board; only ONE backdrop activity was viewed. Whole id playthrough (500 steps, 0 console/HTTP errors) also loaded the 789 B PNG once.
3. Idle motion (act-motion.log, cek-gerak.log 8/8): normal: pool 2 distinct frames in 10 s, bengkel 3, kantor (mentor) 2, wawancara 3; reduce+?gerak=ikut: 1 frame in 15 s everywhere; reduce+?gerak=penuh: frames change (pool 3, bengkel 3, mentor 3, wawancara 2).
4. Build: 0 `*avatar-320*` files in client/dist; only 3 `karakter/*-besar.webp` (public). Playthrough images total **152,251 B** (= 151,462 + 789), 0 webp requests.
5. Checks: cek-piksel-t013 86/86; cek-gerak-t016 8/8; `test:e2e` exit 0, kegagalan 0; `test:client` 729/730 — the 1 failure is `episode.test.ts` "naskah hanya Bahasa Indonesia", caused by Fullstack's in-progress T-014 edits (episode.ts/teks/test modified, en/zh now present), not T-016. Re-run after T-014 settles.
- Bugs: 0 (T-016).

## T-014 — FAIL (1 medium bug) (2026-11-16)

Folder confirmed: C:\Users\User\Desktop\rksgm-episode2 (own server :4001, RAKSA_LEGACY=on; :4000/:4002 untouched). No source edited, nothing committed. Evidence: `team/evidence/T-014/qa/`. Fullstack's T-017 edits were in the tree; no build break hit.

**B-01 (medium): hard-coded Indonesian list words in en and zh player text.**
- `client/src/cerita/hp/arena/rambu.ts:137-143` builds "lajur 1 dan 3" / "lajur 2, 3, dan 4" (the lane-sign activity); `client/src/cerita/episode/auto-2/arena.ts:255-258` joins document names with ", dan ". Neither goes through the text table.
- Seen in en: "Sign 1: your choice lajur 1 dan 3", "Your action: Sign 1: lajur 1 dan 3. Sign 2: lajur 1, 2, dan 3.", "Mr Bima looks at your marks for Sign 1: lajur 1 dan 3. The sign itself says lajur 3 dan 4.", "Sir, please send these documents: Truck registration dan Mr Hendra's ID card. These may follow...: Claim form, Copy of the Family Card, Driver's payslip dan Business bank statements."
- Seen in zh: "标志牌 1: 你的选择：lajur 1 dan 3", "你的行动：标志牌 1: lajur 1 dan 3. 标志牌 2: lajur 2 dan 4.", "先生，请发送以下文件： 警方证明 dan 家庭卡复印件. 以下可以办好后再补： 卡车行驶证, Hendra 先生的身份证 dan 公司银行流水."
- Why the automated checks missed it: cek-bahasa/teks.test scan saved states and text tables, not the activity-generated sentences.
- Fix: language-aware joiner/"lajur"/lane word via the text table (en "and", "lane"; zh "和", "车道").

**Other Indonesian text found (known / not bugs):** lettering inside activity illustrations (FORMULIR, POLISI, BENGKEL...), the kantor board "Layanan Klaim Raksa", the homepage tagline "anytime anywhere with our smile" (English brand line, same in all languages). Nothing else Indonesian in ~690 (en) / ~670 (zh) distinct visible lines of the playthroughs (scan of common Indonesian words).

1. Automated: `test:client` 736/736 (HANDOFF said 735; one more test was added); `test:e2e` kegagalan 0; cek-bahasa-t014 120/120; cek-piksel-t013 86/86.
2. Playthroughs en and zh (driver, seed 21, 600 steps, 0 console errors, 0 HTTP errors, not stuck): reached Parts 1-4 and the ending screens (en "Poor ending: Not satisfied", "Summary from the script", recap). Not finished by hand in Chrome; the zh run's end screen and summary text were scanned from the page text, not viewed. Only one (poor) ending path per language.
3. Language switch: homepage select EN -> "Story mode" list -> Episode 2 in en (stored `raksa:bahasa=en`); `?lang=zh` deep link switches to zh and persists to the homepage; mid-episode switch en/zh/id/en on saved states (bengkel, tel-cemas) keeps the saved progress (same length, same location), and the activity opens in zh.
4. Layout: cek-bahasa covers 360/390/1280 x en/zh with no overflow. WebKit 390 zh (mentor, wawancara-3, tel-panik, ending, pool): no horizontal overflow, 0 errors; ending screenshot opened and looks right (nameplate Latin, zh status pill and text fit). Not checked: real phone CJK fonts.
5. Regression: id first scene OK; Episode 1 en first scene OK (screenshot opened).
Bugs: 1 medium.

## T-017 — PASS (2026-11-16)

Folder confirmed: C:\Users\User\Desktop\rksgm-episode2 (own server :4001, RAKSA_LEGACY=on; :4000 untouched). No source edited, nothing committed. Evidence: `team/evidence/T-017/qa/`.

1. Automated: `test:client` 736/736; `test:e2e` exit 0, kegagalan 0; `cek-piksel-t013` 86/86; `cek-jalan-t017` 7/7 on re-run. First run was 6/7: `tangkapan-390` found no walk at 0.9 s, because the 390 walk takes ~1.0-1.4 s and e2e was running at the same time (screenshot timing only); the re-run on a quiet server passed.
2. K04 pool (id), own sampler every ~40 ms (pool-matrix*.log):
   - Chromium 360 / 390 / 1280 and WebKit 390: Rudi starts outside the left edge (x -152 / -28 / -260 at the first sample), alternates jalan-a / jalan-b, and is standing at x 420 facing right (`rudi:berdiri:kanan:netral`) after about 1.6 s / 1.4 s / 1.9 s (WebKit 1.4 s). 0 console errors everywhere.
   - "Lanjut" mid-walk (360, 390, 1280, WebKit 390, at 0.3 s and 0.7 s): standing at 420 within 250 ms, no walk afterwards.
   - Reduce + `?gerak=ikut`: no walk frames, 1 canvas frame, standing at 420 (360, 390, WebKit). `?gerak=penuh` under reduce: walks like normal. One run of 390 penuh timed out waiting for the stage on its first attempt (15 s); 3 re-runs were fine (not reproduced).
   - My first Lanjut probe clicked the wrong "Lanjut" button and looked like a failure; with the app's own button selector it passes in all 8 cases.
3. Other rooms (rooms.log): kantor (Miss Raksa x 800), bengkel (admin 940), tol (Bima 620), wawancara-3 (500 / 830 / 1160), kantor-Bima (980) at 390 and 1280: no walk, standing poses, 0 errors. `tata.ts` change is additive only (39 lines added, none removed). Slide-in timing itself was not measured frame by frame (the stage is ready before my sampler starts).
4. Image bytes, id playthrough (500 steps, 0 console/HTTP errors, 0 webp): **160,739 B** (rooms/props 8,705 + 2,404 + 11,013 + 6,691 + 22,249 + 21,001 + 12,252 + 259, board 789, miss-raksa 19,972, hendra 18,445, samping 36,959); HANDOFF 161,008 B (some props not hit). samping.png 36,959 B as expected.
5. Pool 390 (reduce) screenshot opened: Rudi standing left, facing the truck. I did not watch the walk as motion (foot sliding is for the Designer's review).
Bugs: 0.

## T-014 re-check — FAIL (1 medium: e2e regression, cause not in T-014 text) (2026-11-16)

Folder confirmed: C:\Users\User\Desktop\rksgm-episode2 (own server :4001, RAKSA_LEGACY=on; :4000/:4002 untouched). No source edited, nothing committed. Evidence: `team/evidence/T-014/qa-recheck/`. Fullstack's T-017 fix is in the same tree.

**All T-014 content checks PASS:**
1. `test:client` 738/738; `cek-bahasa-t014` 138/138; `cek-piksel-t013` 95/95.
2. en and zh playthroughs (seed 21, 600 steps, ends reached, 0 console errors, 0 HTTP errors) plus saved states right after the K02 / K08 / witness activities and tol, 390 and 1280: **0 Indonesian words** in ~690 (en) / ~680 (zh) visible lines. B-01 fixed: en "lanes 1 and 3", "lanes 2, 3 and 4", "Truck registration and Mr Hendra's ID card", "Sign 1: you have not marked any lane yet"; zh "第 1、3 车道", "第 3、4 车道", "你的行动：标志牌 1：第 1、3 车道…". K08 road illustration label: en "Truck · per the driver", zh "卡车 · 据司机说"; caption under it translated. Chinese: no ASCII punctuation next to Han in visible text; reply button "回复 Hendra 先生" (spaced) seen. Designer replaced keys seen verbatim on screen: 18 of 36 (en), 60 of 97 (zh), e.g. k08.2, k08.a, arena.bundel.lengkapi, k12.2 / judul, buka.2, k01.1, k01.2, pemeran.tol.nama, arena.saksi.tol, akt.selisih.item.jam.
3. Layout zh and en at 390x844 DPR3 and 1280 (title, chat, choices, activities, tol, wawancara-3): no horizontal overflow, 0 errors; zh akt-rambu 390 screenshot opened: full-width punctuation, label and caption fit. Ending screens: covered by cek-bahasa and the earlier playthrough, not re-viewed as screenshots.
- Observation (low): the visually hidden screen-reader labels in zh chat ("你:", "Hendra 先生:") still use an ASCII colon; not visible.

**B-02 (medium): `npm run test:e2e` fails, 3 of 3 runs (one concurrent with other load, two on a quiet server).** `kegagalan: 2`, exit 1: "langkah berkas: daftar-barang tidak masuk baki HTML (draft adegan & HTML tidak sinkron)" and "misi 3: jawaban benar Ani mendapat poin penuh (+840 / +889)" (needs >= 1000). This is the legacy room game mission 3 (the e2e's step after a page reload), not Episode 2 text. e2e passed in my earlier runs today (T-014, T-016, T-017) and Fullstack reports 0 on :4011 before its last edits. The T-014 fix changed no legacy-game file; the tree also holds T-017's in-progress edits (`PanggungLatar.tsx`, `PanggungPiksel.tsx`, `tata.ts`, samping atlas), so the cause was NOT isolated (I could not run against a clean HEAD without touching the tree). Lead: have Fullstack re-run e2e on a quiet server and, if it still fails, bisect the T-017 / T-014-fix edits.
Bugs: 1 medium (B-02), 0 in T-014 text.

## T-017 re-check — PASS (e2e not confirmed by me) (2026-11-16)

Folder confirmed: C:\Users\User\Desktop\rksgm-episode2 (own server :4001 at below-normal priority, stopped afterwards; :4000 untouched). No source edited, nothing committed. Ran light: one browser at a time, suites never alongside browser checks. Evidence: `team/evidence/T-017/qa-recheck/`.

1. `test:client` 740/740. Browser checks, in sequence, all PASS: pixel 95/95, walk 8/8, foot 18/18, cek-bahasa 138/138.
   **`npm run test:e2e` (run ONCE, below-normal priority, owner's PC busy): did NOT pass — kegagalan 194, 124 of them "timeout …" lines (mode bermain, adegan siap, ack), failing from mission 1.** This is the CPU-starvation signature Fullstack described (their below-normal run also failed this way), not a pass or a code finding; I did not re-run (instruction: once only). T-014's "done" condition (e2e pass) is therefore not met by my run. Fullstack's two clean passes on this tree are unconfirmed by QA. Needs one run at normal priority on a quiet machine.
2. K04 pool (id), own sampler: Chromium 360 / 390 / 1280 and WebKit 390: walk 4 / 3 / 4 / 3 poses, standing at x 420 after 1.13 s / 0.80 s / 1.09 s / 0.86 s (from first walk sample; limit 1.2 s); reduce + `?gerak=ikut`: no walk, standing at 420; Lanjut mid-walk: standing at 420 within 300 ms in all four; 0 console errors.
3. Camera: pool / bengkel / tol / wawancara-3 at 1280 and 360 changed as intended; opened pool 1280, tol 1280, wawancara-3 1280 and a kantor-staged wawancara-1 1280: shoes whole, head clear of the top edge (about 4 px), no new overlap. wawancara-1/2 room framing covered by cek-kaki (18/18), not by my own screenshots. Kantor (mentor, bima) at 360 / 390 / 1280: pixel-IDENTICAL to my T-013 final screenshots. Phone close-ups (tel-panik) were not re-diffed (no T-013 baseline file at those names).
4. Images on a full id playthrough (500 steps, 0 console/HTTP errors, 0 webp): **160,739 B** (expected ~161 KB).
Bugs: 0 (T-017). Open: e2e needs a quiet-machine re-run.

## T-018 Stage 1 — PASS (0 bugs, 2 notes)
I am reading and writing in C:\Users\User\Desktop\rksgm-episode2 (QA, no source edits, no commit). Evidence: `team/evidence/T-018/stage1/qa/`. Server on :4001 (mine, stopped), run at below-normal priority, one browser at a time, no e2e.

**1. Project checks**
- `cek-gulir-t018.mjs`: ALL PASS (50) (`cek-gulir.log`).
- `cek-piksel-t013.mjs`: 99/99 on the second run (`cek-piksel2.log`). The first run (`cek-piksel.log`) failed 4 t018 items ("bukan layar obrolan") because Fullstack rebuilt `client/dist` during it (index.js 11:42); a quiet rerun passed. Not a bug.
- `test:client`: 740 pass / 1 fail of 741. The failure is `T-019 (D-105)` (Hendra ending frames) = Fullstack's T-019 in the same tree, out of scope. No T-018 test failed (`test-client.log`).

**2. Independent chat check (my own Playwright script, longest state = Part 4 with history)**
- id/en/zh x 360x740 DPR2, 390x844 DPR3, 360x640 DPR2 in Chromium; WebKit id at all three, en/zh at 390: 14 combos all OK. `scrollingElement.scrollHeight == innerHeight` (740/844/640), no horizontal overflow, `window.scrollTo` leaves scrollY 0, the Lanjut button fully inside visualViewport (e.g. [18,670,342,722] at 360x740), exactly one overflowing region = `.hp-gulir`, which reaches its end (gap 0). Opened history: first message reachable at top, page still not scrolling (id/en; the zh history button was not matched by my selector, covered by the project check's zh run).
- Pill: scrolled up (rem 472) then Lanjut keeps the position and shows "Pesan baru ↓" / "New message ↓" / "新消息 ↓" in Chromium and WebKit; tapping it scrolls to the end (remaining 0), 6/6.
- Reply options: Balas -> options in `.hp-ekor` (11 tappable items, tail slot), "Kirim balasan" pinned inside the viewport, page height = screen at all three sizes in Chromium and WebKit; tapping the last item works and page stays fixed.
- Attachments/extras: "Detail" and the glossary chip open inside the scroller at 360x640, page stays 640, no console errors (Chromium, WebKit).

**3. Playthrough (id, driver, seed 11, 1,600 steps)**: reached the ending ("Klaimnya selesai … Lihat ringkasan"), stuck 0, HTTP errors 0. First 600-step run: 0 console errors. The long run logged only `WebSocket ... ERR_CONNECTION_REFUSED` errors: my :4001 server was gone mid-run (client/dist was being rebuilt by Fullstack, server log shows ENOENT index.html); not an app error. I restarted it for the regression.

**4. Regression**
- Stage/activity/end states (T-013 saved states, 390 and 1280): `.hp-layar` has `data-tampilan=adegan`, overflow visible, page scroll still allowed (e.g. akt-rambu 1072 px at 390). Chat states (akt-berkas, surat, tel-panik) use the shell at 390 and are normal at 1280 (overflow visible).
- 1280 chat: not a shell, page scrolls (b1 1326 = identical to `sebelum`; header sticky).
- Homepage 390: scrollHeight 912, scrollWidth 390 (no overflow); T-003..T-011 numbers not re-measured by a separate tool, no change observed.

**Notes (not bugs)**
- N-1: 1280 Part 4 chat is 2,413 px high now vs 2,548 in `sebelum`, and the chat header now shows the Hendra avatar. `cangkang:false`, sticky header and all rules unchanged; I attribute it to T-019 content in the same tree (hendra atlas, episode.ts), not to T-018 CSS. Lead may want to confirm.
- N-2: `npm run test:client` is red only from the T-019 test above until Fullstack finishes.

## T-019 — PASS (0 bugs, 2 notes)
I am reading and writing in C:\Users\User\Desktop\rksgm-episode2 (QA, no source edits, no commit). Evidence: `team/evidence/T-019/qa/`. Own server :4001 (stopped after), below-normal priority, one browser at a time, no e2e. Build = final T-019 tree incl. Fix D-135..D-138.

**1. Project checks (sequential):** `test:client` 741/741; `cek-akhir-t019` 45/45; `cek-piksel-t013` 99/99; `cek-jalan-t017` 8/8; `cek-kaki-t017` 18/18; `cek-bahasa-t014` 138/138; `cek-gulir-t018` 50/50.

**2. Endings (my own Playwright script `end.log`)**
- puas / catatan / kurang in id at 360x740 DPR2, 390x844 DPR3, 1280, plus WebKit 390 (all 3): Hendra walks in (first frame `jalan`, 9..16 samples at 120 ms), ends `hendra:berdiri:kiri:<senang|tenang|kecewa>` at x 1040 next to Miss Raksa at 800; no cut-in (`data-sisipan` empty). Expression per ending as scripted.
- Status chip one line everywhere: 25 px high (194 / 189 px wide at 360; en 185; zh 162).
- en (puas, 360) and zh (kurang, 360): same walk and standing result; text localised, 0 Indonesian visible.
- Reduce + `?gerak=ikut` (puas, 360): 0 walk frames, standing at once. Lanjut mid-walk (360): standing at once (kaki 1040, no jalan).
- Screens I opened: kurang 360, puas 1280 (Hendra beside Miss Raksa, no overlap; board "LAYANAN KLAIM RAKSA" readable; Hendra's feet are under the dialogue card, accepted per Designer notes).
- End screen: from each saved ending state, Lanjut then "Lihat ringkasan" reaches "AKHIR CERITA" with Pak Hendra: Puas / Tenang / Kecewa; 0 console errors in all runs (Chromium + WebKit).

**3. Regression:** K07 with Bima (1280) unchanged: Bima at slot 980, same framing. Kantor opening (Miss Raksa only, 1280): shoes no longer show below the counter front; nothing else clipped. Pool Rudi walk unchanged (`cek-jalan` 8/8, 4/3/4 poses).

**4. Bytes (full id playthrough, seed 11, 2,200 steps, 0 console errors, 0 HTTP errors, 0 stuck):** 12 PNGs, total **168,214 B** (expected ~168.5 KB; hendra.png 25,920, samping 36,959); 0 webp. The random driver did not itself reach the end screen in 2,200 steps (stayed in Part 4 chat), which is why the end screen was verified from the saved ending states instead.

**Notes (not bugs):** N-1 Hendra's feet are cut by the dialogue card at 360/1280 as already known (kantor camera rule, same as Bima). N-2 my total is 269 B below Fullstack's 168,483 (one small prop not requested on this path).

## T-018 Stage 1b — FAIL (1 medium bug, 3 notes)
I am reading and writing in C:\Users\User\Desktop\rksgm-episode2 (QA, no source edits, no commit). Evidence: `team/evidence/T-018/stage1b/qa/`. Own server :4001 (stopped after), below-normal priority, one browser at a time, no e2e. Tree also contains Stage 2 work in progress (ignored as briefed).

**1. Project checks:** `test:client` 741/741; `cek-piksel-t013` 99/99; `cek-gulir-t018` **131/132** (1 FAIL: `lembar-k01-360x640-zh-webkit` "tanpa tombol Balas": did not reproduce in my own matrix, same state/size/engine passed, so load flake: see N-1); `cek-bahasa-t014` **134/138** (4 FAIL: `tel-cemas-360/390-en/zh`, the 8-document request activity: `hp-arena-gulir` clipped; this is an activity screen = Stage 2 work in the tree, see N-2).

**2. Reply sheets (my own Playwright matrix, `lembar-*.log`):** K01, K03, K06, K12, K13, K14 x id/en/zh x 390x645, 360x640, 390x844 (Chromium) + 390x645, 360x640 (WebKit) = 90 runs: 82 fully OK, 8 = B-01. Per run: gate -> Balas -> sheet inside visualViewport, question + all five choices + send visible, no page scroll, send disabled "Pilih 1 balasan" until a choice, then "Kirim balasan 2", Catatan flip + "Kembali" keeps the selection, Esc closes and the selection is restored on reopen, key 3 selects, Enter sends, sheet gone and chat continues, 0 console errors. At 390x645 and 390x844 all 36 combinations pass in both engines for every language (en and zh prompts answered in all of them).
- **B-01 (medium)**: at **360x640** in **K13 and K14, id and en** (4 combos; both Chromium and WebKit = 8 runs) the sheet is taller than the space under the chat header, so its top, including the yellow **Catatan tab** (y 92..131), sits UNDER the header (`hp-obrolan-kepala` intercepts pointer events; Playwright click on `[data-catatan]` times out). The reference card (document contents) is unreachable there; the grab handle shows but the tab is clipped (`k14-360x640-id-catatan.png`). The Handoff lists K14 id, K01 en, K13 en, K14 en as 360x640 fallbacks with "only the list scrolls"; the Catatan tab being covered is not documented, and K13 id also hits it while K01 en does not (its tab was clickable). Suggested fix: cap the sheet at viewport height minus header and let the list (not the sheet) scroll, or let the sheet top stay below the header.

**3. D-129 sound banner:** Episode 2 first screen shows it; it vanishes after ~6 s with no tap; vanishes on the first primary tap; stays gone after reload; not shown mid-episode (K03, K14) and not with a sheet open. **Episode 1: the banner never existed** (`PetunjukSuara` is only used by `PemainHP`, Episode 2; same at git HEAD), so "still shows once on Episode 1" cannot be met; not a regression.

**4. D-131/D-130:** task card at 360x640 / 390x645: composer 183 px (vs 200 at 390x844, 222 at 360x740) = compact; message area 309/314 px. Header portrait 48 px visible in the chat header on phones through whole threads (b4, lanjut, K06, b1 steps; None only after the chat leaves for a stage scene).

**5. Playthrough id (driver, seed 3, via the sheets):** reached "AKHIR CERITA / Akhir kurang baik: Kurang puas" at step 233, 0 console errors, 0 HTTP errors, no stuck screen. (Seed 11 wandered 2,200 steps in Part 4 chat without finishing; the driver is random, last screen was a normal typing indicator, 0 errors.)

**6. Regression:** desktop 1280 chat: not a shell (overflow visible, page scrolls: b1 1270 vs 1326 before = the banner gone), K14 still uses the old inline block, no banner. Stage/activity/end screens not re-examined beyond the cek-piksel 99/99.

**Notes:** N-1 cek-gulir 1 flaky fail under load (rerun cost: ~9 min, not repeated). N-2 cek-bahasa 4 fails are on the activity arena clipping (Stage 2 area). N-3 `cek-gulir` passed its K13/K14 360x640 runs while Catatan was covered, so the tool misses this case (it should click `[data-catatan]` with a real pointer, not a scripted click).

## T-018 Stage 2 — PASS (0 bugs, 3 notes)
I am reading and writing in C:\Users\User\Desktop\rksgm-episode2 (QA, no source edits, no commit). Evidence: `team/evidence/T-018/stage2/qa/`. Own server :4001 (stopped after), below-normal priority, tools run one at a time (runner with 15-min kill), no e2e. Final Stage 2 build, no hung tool.

**1. Tools (no hang; durations 27 s to 610 s)**
- `test:client` 741/741.
- `cek-bahasa-t014` 138/138 (the 4 arena fails from Stage 1b are fixed).
- `cek-kaki-t017` 18/18.
- `cek-gulir-t018 --tanpa-tahap2` (chat family, Chromium + WebKit) **150/150**.
- `cek-layar-t018` (stage beats, K02, K04 map, K05, K08, K09, K10, three endings + summary, desktop, Episode 1; Chromium + WebKit) **106/106**.
- First run of `cek-piksel-t013` FAILED 2 (`gerak-pool-normal`, `gerak-bengkel-normal`: idle motion 0 changes), `cek-akhir-t019` FAILED (all walk-in checks: 0 walk samples) and `cek-jalan-t017` FAILED 7 (same, 0 walk samples), all in one back-to-back run. Reruns of each alone: `cek-jalan` 8/8, `cek-akhir` 45/45, `cek-piksel` ALL PASS (99). My own probe (Playwright) showed the walk playing (Rudi 6 frames, Hendra 10) and reduced motion not walking; so I classify the first-run failures as a timing flake of the Chrome-based tools, not a game regression (N-1). Logs: `cek-*.log` (first run), `cek-*-2.log` (reruns).

**2. Own matrix (Chromium AND WebKit; 360x640, 360x740, 390x645, 390x844; `mat2-*.log`)**
- (a) Stage beats: opening (the owner's case, 3 beats), K04 pool, K07 Bima, K10 wawancara-2, K11 task: page never scrolls, action button inside the viewport, <=1 scroller, stage always >= 2:1 (168 at 360, 183 at 390). **Owner's case fixed**: opening keeps ONE stage height over its three beats at every size (210 / 336 / 229 / 366), same in both engines. Pool is also constant (210/252/229/275). Only the documented step-downs remain when a task card appears: Bima and K10 210 -> 168 at 360x640, K10 229 -> 183 at 390x645 (identical in Chromium and WebKit).
- (b) Activities K02, K04 map, K05, K08, K09, K10 at four sizes: covered by `cek-layar` 106/106 in both engines (no page scroll, send button in the viewport, one scroller, 5 tiles + CTA, K08 conclusion no jump per its assertion). I did not write my own K08 pixel-jump probe.
- (c) End screens (puas, catatan, kurang x 4 sizes x 2 engines = 24): page fits, one scroller (`hp-main`), verdict visible, pinned bar one 52 px row: kurang/catatan show "Ulangi Bagian 4" + "Selesai"; puas (no retry by design) shows "Selesai" + "Coba jalur lain" (my first script wrongly expected a retry on puas). Opened `chromium-akhir-puas-end-360x640.png` and `webkit-akhir-kurang-end-360x640.png`: verdict + lesson visible without scrolling.
- (d) Chat + reply sheet regression at 360x640, 6 decisions x id/en/zh x both engines = **36/36 OK; B-01 fixed** (Catatan tab tappable, including K13/K14 id/en); send continues the story, 0 console errors.

**3. Playthrough id (driver seed 3)**: reached "AKHIR CERITA / Akhir kurang baik" at step 221, 0 console errors, 0 HTTP errors. en and zh: K02 document activity opened and an ending screen reached at 360x740, page fits, 0 errors, text localised (`en-*`, `zh-*` PNGs); full en/zh coverage also by `cek-bahasa` 138/138.

**4. Desktop / hub / bytes:** desktop 1280 mentor and akhir-puas: no lock (`data-kunci` empty, overflow visible); /cerita hub page-scrolls (390: 1361 > 844; 1280: 996 > 800), no horizontal overflow. Image bytes, full id playthrough: 13 PNGs, **168,723 B** (168,214 in T-019 + 509 B `ikon-miss-raksa.png` for the reply sheet), 0 webp.

**Notes:** N-1 the three tools above flaked once (rerun green) when run right after each other; the Lead may rerun `cek-jalan`/`cek-akhir` once on a quiet machine. N-2 step-downs on task cards at 360x640 and 390x645 are documented, not bugs. N-3 Episode 1 (standard player) is unchanged and was not part of Stage 2. Real iPhone not tested.

## T-020 batch 1 — PASS (0 bugs, 4 notes)
I am reading and writing in C:\Users\User\Desktop\rksgm-episode2 (QA, no source edits, no commit). Evidence: `team/evidence/T-020/qa/batch1/`. Own server :4001 (stopped after), below-normal priority, one browser/tool at a time, no e2e. K07/K09/K10 (batch 2 in the same tree) ignored as briefed.

**1. Tools:** `test:client` **742/742**; `cek-layar-t018` (all Stage 2 families, Chromium + WebKit) ALL PASS **124** (Fullstack quoted 160: my run executes 124 cases, all green; I could not reconcile the count, WebKit runs only 2 sizes in the tool, see N-1); `cek-piksel-t013` ALL PASS (99); `cek-bahasa-t014` **138/138**; `cek-akhir-t019` **45/45**; `cek-jalan-t017` **8/8**; `cek-kaki-t017` **18/18**; `cek-gulir-t018 --tanpa-tahap2` (chat family) **149/150**: 1 FAIL `lembar-k03-390x844-en-chromium` "tanpa tombol Balas" (same load flake type seen before on K01 zh; not reproduced in my K04/K08/sheet runs; N-2).

**2. K04 map (my matrix, `k04-*.log`):** 360x640, 360x740, 390x645, 390x844 in id (+ en, zh at 360x640 and 390x844), Chromium AND WebKit: for every one of the five tiles: five tiles whole inside the scroller, CTA inside the viewport, no page scroll, tap selects exactly one tile with Rudi's pin, send enabled, send continues the story. The five tiles give five different continuations (Kantor Raksa: status Cemas -> Kecewa; Meja kantor: still Cemas but lower; Pool Pak Hendra: still Cemas but better; Bengkel rekanan: stays Cemas; Bengkel langganan: Cemas -> Kecewa), identical in both engines and languages; 0 console errors. Opened `webkit-k04-id-360x640.png`: pixel board, all five tiles, pin on the pool tile, detail strip and send bar visible.

**3. K08 road (my matrix, `k08-*.log`):** same matrix, right lanes (sign 1 = lanes 3+4, sign 2 = lane 1) and wrong lanes (1+2, 2+3), Chromium AND WebKit = 48 runs, all OK: sign tap opens the wording card fully inside the scroller, lane keycaps toggle on/off to the requested set, marking completes, the conclusion is the reply sheet over the road (5 rows inside, no list scroll, page fixed, "Tandamu" tab flips and back), result correct: right marks + "Tidak melanggar" -> "Satu pertanyaan penting terjawab dengan bukti foto", Cemas -> Tenang; wrong marks + "Melanggar" -> "Kesimpulan terburu-buru ...", Cemas but lower; en/zh texts localised; 0 console errors. Opened `webkit-k08-id-360x640-salah-simpul.png`: five numbered rows fully visible over the pixel road with the Tandamu tab. Keyboard focus order on the map was not separately exercised beyond the `cek-layar` assertions (N-3).

**4. Regression + bytes:** K02, K05, K11 families green in `cek-layar` (K09/K10 also green there, but they are batch 2); chat family 149/150 (above). Full id playthrough (driver seed 3, 3,000 steps, 0 console / 0 HTTP errors) reached Part 3 and got stuck in K09 (batch 2 area: the driver's witness-card handling no longer matches the new markup; the screen itself is fine, "Kirim daftar ke Pak Bima" is enabled), so it did not reach an ending; the ending screens are covered by `cek-akhir` 45/45 and `cek-layar`. Image requests on that path: 13 PNGs = **168,723 B**, identical to the Stage 2 total, so the 29 map/road PNGs add **no requests** (inlined in CSS) and no SVG requests. CSS chunk sizes visible now: `CeritaMain-*.css` 178,014 B, `story-*.css` 34,261 B; I have no "before" build, so I cannot state a before/after (same as Fullstack).

**Notes:** N-1 `cek-layar` count 124 vs 160. N-2 chat-family flake (K03 en 390x844 once). N-3 keyboard order not independently tested. N-4 playthrough blocked by K09 batch 2 (not in scope); real iPhone not tested.

## T-020 batch 2 — PASS (0 game bugs, 5 notes incl. one environment finding)
I am reading and writing in C:\Users\User\Desktop\rksgm-episode2 (QA, no source edits, no commit). Evidence: `team/evidence/T-020/qa/batch2/`. Own server :4001 (stopped after), below-normal priority, one browser/tool at a time, no e2e. Batch 3 (K02/K05/K11/chat photo) ignored as briefed; it was already landing in the tree (a `sim-depan` PNG and an SIM-check screen appeared during my run).

**1. Tools**
- `test:client` **742/742**; `cek-layar-t018` ALL PASS **136** (Fullstack quoted 168; the tool ran 136 cases, all green); chat family `cek-gulir --tanpa-tahap2` **150/150**; `cek-kaki` **18/18**; `cek-bahasa` 138/138 on rerun (first run had 6 FAILs on K02 `tel-cemas` en/zh = the K02 screen that batch 3 is changing; clean on the rerun, so a mid-build flake).
- `cek-piksel` (2 fails: `gerak-pool/bengkel-normal`), `cek-akhir` (13 fails) and `cek-jalan` (7 fails): ONLY the walk-in / idle-motion samples fail ("0 walk samples"), on every rerun now. **Cause found (environment, not game): the system Chrome 157 launched by these puppeteer tools reports `prefers-reduced-motion: reduce`** (Windows "Show animations" is off on this PC: `matchMedia` true, `UserPreferencesMask` animation bits off), so the game correctly shows no walk and no idle bob. With Playwright Chromium (motion on) the walks play: Rudi 6 frames, Hendra 10 frames; reduced-motion still gives 0. All other checks of those three tools pass (framing, foot, text). The tools should force `prefers-reduced-motion: no-preference` (e.g. `emulateMediaFeatures`) or the OS setting be turned back on before the Lead relies on them (N-1). This also explains the earlier "flakes" in the Stage 2 / T-020 batch 1 runs.

**2. K07 / K09 / K10 (my matrices, Chromium AND WebKit, 360x640, 360x740, 390x645, 390x844 in id + en/zh at 360x640 and 390x844 = 8 configs per engine per screen, 48 in total, `b2-*.log`): all 48 configs OK**: no page scroll, send button inside the viewport, at most one scroller, 0 console errors.
- K07: each of the 5 targets (2 slots `setelah`, `paralel`, 3 off-board chips `jelas`, `telepon`, `percaya`) selects exactly that target, send enables, and gives five different, correct results (e.g. paralel -> "masih Cemas, tapi membaik"; telepon -> "tetap Cemas").
- K09: send label counts down "Tandai 5 ... 1 kartu lagi." then "Kirim daftar ke Pak Bima"; Wawancarai / Tidak perlu on all 5 cards, undo via the "-" badge, plan count (5 for all-Wawancarai, 3 for the mixed plan), send continues.
- K10: 3 differences x 5 stamps covered (5 rotating plans, each difference gets every stamp), progress squares 3/3, page fixed; scoring checked with targeted plans in both engines: all catat -> "membaik" (+6), ulang -> "tetap Cemas" (0), abaikan / samakan / tolak -> "menurun", matching `ATURAN_SELISIH` (tolak A, samakan B, abaikan E, ulang C, else D). I had no previous build to diff against; the mapping is the unchanged rule table and its unit tests pass.
- Info tugas tab present on the title row of the three screens (`cek-layar` asserts it opens the info).

**3. Batch 1 fixes:** K08 legend: 2 lines after sign 1 and **3 lines after sign 2**, clear of the bar (`clear:true`) at 360x640, 390x645, 360x740, 390x844, both engines; swatch is pixel (`px-contoh`, radius 0, `image-rendering: pixelated`); Tandamu tab sits over the road, not over the question (screenshot `chromium-k08-id-360x640-benar-simpul.png`; my programmatic overlap probe returned no selector match, so this is by screenshot). K04: pin on 'Bengkel langganan' inside the board and not overlapping the plate at all four sizes, both engines.

**4. Playthrough id (driver seed 3, patched for the new K09 / K10 boards, 3,000 steps, 0 console errors, 0 HTTP errors):** passes K04, K07, K08, K09 and K10, reaches Part 3's SIM check (batch 3 screen) but the random driver does not reach an ending in 3,000 steps (it wanders in the SIM-check activity); endings are covered by `cek-akhir` (all non-walk checks pass). **Image bytes:** 14 PNGs = **172,390 B** (168,723 B before + `sim-depan` 4,304 B from batch 3; the 42 batch 2 PNGs are inlined in CSS, no extra requests), 0 webp. **CSS chunk now:** `CeritaMain-*.css` 217,204 B, `story-*.css` 34,261 B; the tree already contains batch 3, so I cannot isolate the batch 2 share (Fullstack's batch 2 figure: story CSS 150,013 B).

**Notes:** N-1 reduced-motion environment finding above. N-2 `cek-layar` ran 136 cases vs the quoted 168. N-3 playthrough ended at the batch 3 SIM screen. N-4 row targets in K10 are 22 px tall (documented). N-5 real iPhone not tested.

## T-020 batch 3 — PASS (0 bugs, 5 notes)
I am reading and writing in C:\Users\User\Desktop\rksgm-episode2 (QA, no source edits, no commit). Evidence: `team/evidence/T-020/qa/batch3/`. Own server :4001 (stopped after), below-normal priority, one browser/tool at a time, no e2e. T-021 (cutscene) already in the tree and ignored.

**1. Tools:** `test:client` **746/746** (742 + 4 T-021 tests); `cek-layar-t018` ALL PASS **142** (Fullstack quoted 176; the run executes 142 cases, all green); `cek-piksel-t013` ALL PASS (99); `cek-bahasa-t014` **138/138**; chat family `cek-gulir --tanpa-tahap2` **150/150**; `cek-akhir-t019` **45/45**; `cek-jalan-t017` **8/8**; `cek-kaki-t017` **18/18**. The walk/idle tools pass again (Windows reduced-motion no longer interferes / `cek-gerak` fixed; the earlier batch 2 environment finding is resolved on this run).

**2. K02 documents (my matrix, Chromium AND WebKit, 360x640, 360x740, 390x645, 390x844 in id + en/zh at 360x640 and 390x844 = 16 configs, all OK):** all 8 documents placed one by one into the three trays by tap in five arrangements; the "n/8" plate advances 2..8 and the summary appears after the 8th; the Isi badge opens its panel in place of the counter scene and inside the window; no page scroll, at most one scroller, no clipping of visible text; send enabled at the end; **scoring correct and distinct per arrangement** (rule `ATURAN_BERKAS`): benar (core now, police letter later, supplements "not needed") -> "masih Cemas, tapi membaik"; supplements now/later -> "menurun", police letter "tidak" -> "diminta mendadak", police letter now -> "satu dokumen yang belum jadi menahan seluruh proses", a core document "tidak" -> "dicicil ... bolak-balik / tetap Cemas". Fullstack's two clipping faults confirmed fixed (tool and my probe show no clipped document names/badges; hidden counter text is sr-only). I had no previous build to diff against; the mapping is the unchanged rule table.

**3. K05 / K11 / chat photo**
- K05 pixel board: five tiles, selection pins the photo-stack token, Info tugas tab present, no page scroll, send enabled; the five destinations give five distinct results (Chromium 8 configs, WebKit 8 configs). My first script flagged "clipped `hp-papan-lok-label`": that is the screen-reader-only "Papan ilustrasi" label (documented), not a bug.
- K11 (16 configs, both engines): step 1 folder, step 2 action cards, step 3 message rows, bar labels "Konfirmasi & kirim kabar" / "Konfirmasi, tanpa kabar" on one line; all 9 action x message paths give correct, distinct results (best: lengkapi + persetujuan -> Cemas -> Tenang; wrong approval claim -> menurun). One WebKit 360x740 run reported "no task" (timing); the rerun passed.
- Chat photo: 244 x 154 px (240 x 150 + 2 px frame), `image-rendering: pixelated`, Chromium and WebKit at 390x645 and 360x640 (my path: K01 answer option 3). It is a static figure (no zoom handler in `Lampiran`, same as before). The 480 x 300 version at >= 1024 px was **not** verified (my desktop flow did not reach the photo).

**4. Batch 2 polish D-195..D-199 (both engines, four sizes):** K09 strip height 115 px in every state (D-195); card row 82 px; screenshot shows names wrapped at spaces, "Petugas tol" in full and "Pengemudi mobil kecil" on two lines with 36 px portraits (D-196/D-197, `chromium-k09-pilih-360x640.png`); K10 paper rows 24 px, papers 99 px (D-198); Info tugas glyph gap visible in the screenshots (D-199; I did not measure it in px).

**5. Playthrough id (driver seed 3, patched for the new K09/K10 markup):** reached "AKHIR CERITA / Akhir kurang baik" in 252 steps through K02, K04, K05, K07-K11 boards, 0 console errors, 0 HTTP errors. **K09 driver loop:** the original driver rule (clicks any `hp-saksi-kartu`) still loops on the new board because the new cards keep that class; with the driver patched to use the `sk-tombol` keys it passes. This is a driver issue, not a game bug. **Bytes:** 14 PNGs = **172,390 B** (as in batch 2; the activity PNGs are inlined in CSS), 0 webp; story CSS chunk `CeritaMain-*.css` **217,782 B** now (Fullstack quotes 178,553 B for the story chunk; the tree has more CSS since).

**Notes:** N-1 `cek-layar` 142 vs 176 cases. N-2 one transient console 404 (Failed to load resource) in one Chromium K05 zh 390x844 run, not reproduced in the other 143 runs, the K02/K11 matrices or the playthrough (0 HTTP errors); I could not identify the URL. N-3 chat photo 2:1 at 1280 not verified. N-4 D-199 gap not measured numerically. N-5 real iPhone not tested.

## T-021 — PASS (0 high/medium, 2 low findings, 3 notes)
I am reading and writing in C:\Users\User\Desktop\rksgm-episode2 (QA, no source edits, no commit). Evidence: `team/evidence/T-021/qa/`. Own server :4001 (stopped after), below-normal priority, one browser/tool at a time, no e2e. T-022 ignored.

**1. Tools:** `test:client` **746/746** (745 quoted + the T-021/T-022 tests in the tree); `cek-telepon-t021` ALL PASS **14/14**; `cek-layar-t018` ALL PASS **142** (176 quoted; same count gap as batch 3); `cek-piksel-t013` ALL PASS (99); `cek-bahasa-t014` **138/138**; chat family **150/150**; `cek-akhir` **45/45**; `cek-jalan` **8/8**; `cek-kaki` **18/18**.

**2. Cutscene (my own Playwright matrix with an in-page frame recorder, motion on, Chromium AND WebKit)**
- Forward (buka -> k01): 360x640, 360x740, 390x645, 390x844 in id + en/zh at 360x640 and 390x844 = 8 configs per engine, all OK: layer lasts 990-1,025 ms, scale steps 1..5 / 2..5, **no page scroll or extra page height in any of ~104 recorded frames**, view goes stage -> chat, the chat is usable right after (gate/Balas works and the reply sheet opens).
- Back (K15 -> akhir-puas / akhir-catatan / akhir-kurang): puas at all four sizes in id + en/zh (8 configs per engine), catatan and kurang at all four sizes in id, both engines: all OK: ~690-720 ms, scale steps 5 -> 1, no page scroll in any frame, the stage returns intact (Miss Raksa 800 + Hendra 1040, expression per ending: senang / tenang / kecewa), Hendra's walk-in plays (`data-jalan` seen in ~98 of ~104 frames; part of it runs under the 700 ms move).
- Reduce + `?gerak=ikut`: forward and back are plain cuts, 0 layer frames. Tap during the forward move: the layer disappears within 150 ms and the chat is shown (tap = skip to the end state). 0 console errors in every run.
- **B-01 (low, spec/brief mismatch):** "Episode 2 restarted in the same session: full version plays again at Part 1" is **not** met: after the full forward version has played, restarting Part 1 in the same browser session (story state reset, session kept) plays the **short** 295 ms version. Cause: `transisiTelepon.tsx` records `auto-2:b1` in `sessionStorage` (`raksa:cerita:telepon-penuh`) and a restart does not clear it. This matches Fullstack's written rule ("short after the full has played in the same Part in this session") but not the Lead's acceptance line; Lead to decide which is intended (a repeat player sees a shorter transition).

**3. Batch 3 fixes (both engines, four sizes):** K05 and K04 pixel boards: board height, tile tops and picture boxes are all whole CSS px at 390x844 DPR3, 390x645 DPR3, 360x640 and 360x740 (centre tile tops 105/56/74 K04, 112/87/73/112 K05): crisp. K11: step 3 bar label "Konfirmasi & kirim kabar" is one line (checked earlier in batch 3 and by `cek-layar`); the tender note shows with pocket 4 only (pockets 1-3, 5-7 have none). K02 end summary: tray cell shown, **no sign fragment** (the counter scene has no sign layer, D-209), Isi panel in place of the scene (checked in batch 3, `cek-layar`). Chat photo at 1280: 484 x 304 px = 480 x 300 + 2 px frame, 2:1, pixelated; on phones 244 x 154.
- **B-02 (low): K02 end summary scrolls its content: 17 px at 360x640 in Chromium (21 px in WebKit)**, 0 at 390x645, 360x740, 390x844; page itself does not scroll, the send bar stays pinned, content is reachable. Fullstack's 17 px confirmed (WebKit is 21).

**4. Playthrough id (driver seed 3, patched for the new K09 board):** reached "AKHIR CERITA / Akhir kurang baik" in 252 steps including the forward cutscene, 0 console errors, 0 HTTP errors. **Bytes:** 14 PNGs = **172,390 B** (the four cutscene PNGs are inlined in JS), 0 webp. **Chunks now:** `CeritaMain-*.js` 188,789 B, `CeritaMain-*.css` 217,782 B, `story-*.css` 34,261 B (Fullstack quotes story JS 175,054 B and CSS 180,316 B for its build; the tree has grown since, so figures are not comparable).

**Notes:** N-1 `cek-layar` 142 vs 176 and `test:client` 746 vs 745 (counts differ, all green). N-2 the sound and the feel of the timing / 2x step were not judged (headless). N-3 real iPhone not tested.

## T-022 — PASS (0 bugs, 5 notes)
I am reading and writing in C:\Users\User\Desktop\rksgm-episode2 (QA, no source edits, no commit). Evidence: `team/evidence/T-022/qa/`. Own server :4001 (stopped after), below-normal priority, one browser/tool at a time, no e2e, tree untouched.

**1. Tools (one at a time, none hung):** `test:client` **746/746**; `cek-telepon` **14/14**; `cek-layar-t018` ALL PASS **142** (184 quoted; includes the `arena-ksim` case, 6 PASS lines for its sizes/engines); `cek-piksel` ALL PASS (99); `cek-bahasa` **138/138**; chat family **150/150**; `cek-akhir` **45/45**; `cek-jalan` **8/8**; `cek-kaki` **18/18** (the motion tools force motion themselves now: all green with no tweaks).

**2. ksim (my own Playwright driver, Chromium AND WebKit, 360x640, 360x740, 390x645, 390x844 in id + en/zh at 360x640 and 390x844 = 8 configs x 3 paths x 2 engines = 48 runs, all OK, 0 console errors)**
- **clean path (no wrong tap):** desk wallet (via real keyboard Tab + Enter at 390x844) -> bar -> card: Balik flips and flips back, class box (magnifier) then truck tag -> bar -> place board: Satpas -> bar -> counter: NIK line, the terminal reaches "data found" -> bar -> print-out by **real mouse drag** of the card onto the print-out -> three rows tick -> bar -> end card -> bar. Stamps fill in order (asli, cocok, satpas, sesuai: `ccck`... `cccc` progression); at every step no page scroll, the bar button inside the visual viewport, at most one scroller.
- **wrong-tap-everywhere path:** every wrong target tapped at each step (fotokopi at the desk; foto, name and number on the card, label tag before the class box; Kantor Raksa and Bengkel rekanan on the board; name and address lines at the counter): Pak Bima's box turns amber after the first wrong tap, the right target still completes the step, the end card shows, and the story continues with the "arahan Pak Bima" result line (`ksim-b`); clean path shows "tanpa ketukan keliru" (id) / the "without hesitation" result (en/zh), i.e. `ksim-a`.
- **tap fallback on the print-out** (tap the print-out instead of dragging): completes in all 16 runs.
- Not separately exercised by me: a real finger drag on a phone (Fullstack's touch-action fix D-215 is unverified on an iPhone; the Chromium touch drag was Fullstack's own; I used mouse drag), keyboard reachability beyond the desk step (the other targets are named buttons, `cek-layar` walks the Tab order), the Catatan note (see N-2).

**3. Flow:** K09 -> ksim -> k10: after the last bar press the story continues in the interview room and offers the K10 task ("Tapi ada perbedaan kecil di catatan ... TUGAS Bandingkan ..."). Mid-ksim reload (after the desk step): the app returns to the story line before the activity and re-entering starts at the desk again (documented: nothing is saved mid-way; D-218 about keeping the wrong-tap count is still open per Fullstack), no crash, 0 errors. End screen unchanged: "AKHIR CERITA ... Ringkasan 15 keputusanmu" (ksim not counted, by Lead decision), no ksim line in it.

**4. Playthrough id (driver seed 3, patched for the K09 board):** reached "AKHIR CERITA / Akhir kurang baik" in 252 steps, 0 console errors, 0 HTTP errors. **Bytes:** 14 PNG requests = **172,390 B** (the 134 activity PNGs, incl. the 37 ksim sprites, are inlined in CSS/JS), 0 webp. **Chunk sizes now:** `CeritaMain-*.css` 218,214 / 218,563 B and `CeritaMain-*.js` 188,789 / 188,943 B (two builds are present in `dist/assets`; Fullstack's quoted 217,204 B CSS / 187,742 B JS: +0.5-1 % since).

**Notes:** N-1 `cek-layar` 142 cases vs 184 quoted (all pass). N-2 the one-sentence Catatan note (`catatan.simBersih` / `simRagu`) and the line under the result scene: the result line is visible after ksim; the Catatan sentence I could not find in the menu or end screen from my flow (it appears in the reply-sheet Catatan tab of later decisions, which my states do not reach) so it is **unverified**. N-3 real finger drag on iOS/Android not tested. N-4 desktop 1280 of the activity not opened. N-5 en/zh: all 3 paths pass the fit rules; wording of the English/Chinese drafts was not reviewed by me.

## T-024 (2026-11-17) — PASS (0 bugs, 3 notes)

Testing under `C:\Users\User\Desktop\rksgm-episode2` (QA, no source edits, no commit, no e2e). My server :4001 (`RAKSA_LEGACY=on`, `CLIENT_DIST=client/dist`), stopped afterwards. One headless browser at a time, below-normal priority. Evidence: `team/evidence/T-024/qa/`.

**Tools (once each):** `test:client` 750/750; `cek-akhir-t019` ALL PASS (84); `cek-layar` ALL PASS (142); `cek-bahasa` ALL PASS (138); `cek-gulir` ALL PASS (150, chat family, `--tanpa-tahap2`). The bare `cek-gulir` run hit my 15-minute kill limit, and its end-card part duplicates `cek-layar`, so I ran the chat family only.

**My own matrix** (`k24.py`, Playwright Python): the three endings (puas, catatan, kurang) reached from the saved game states by pressing Lanjut through to the card, at 390x645 and 360x640, in id/en/zh, in Chromium and WebKit. That is 2515 checks per engine, run again with reduced motion on. All pass, with 0 console errors.
- **Fit:** one-screen form; 0 px page, `.hp-main` and card scroll; no inner scrollers; the fit rule is unused; 15 tokens.
- **Action bar:** inside the viewport. Selesai, Coba jalur lain (opens the dialog) and Coba lagi dari bagian N (leaves the card) work.
- **Tokens:** all 15 open the sheet with the right decision title and number. The sheet sits at least 65 px under the top, has no inner scroll, `#root` is inert and the page does not scroll. Sebelumnya/Berikutnya and the arrow keys work, and both ends are disabled at 1 and 15. Escape, the close button and a backdrop tap each return focus to the token.
- **Other sheets and Menu:** the reason and lesson sheets open and close with focus returned. Both Menu rows ("Rentang suasana", "Catatan simulasi") are present.
- **Keyboard only:** Tab reaches the reason line, tokens 1-15, the lesson and the action bar. Enter and Space open a sheet, focus is trapped inside it and Escape returns focus.
- **Desktop 1280x800:** unchanged (old list form, 15 rows, no tokens, no one-screen marker).

**Notes (not bugs):**
1. In WebKit, Tab skips the links (Selesai, back arrow). That is the engine's default link-focus setting; Chromium reaches them. Buttons are fine.
2. The reason and lesson text are cut to two lines with an arrow. This is by design; the full text is in the sheet.
3. Not tested: a real finger on a phone, and a real iPhone.

## T-025 (2026-11-17) — PASS (0 bugs, 4 notes)

Testing under `C:\Users\User\Desktop\rksgm-episode2` (QA; no source edits, no commit, no e2e). My server :4001 (`RAKSA_LEGACY=on`, `CLIENT_DIST=client/dist`), stopped afterwards; `dist-rilis` untouched. One headless browser at a time, below-normal priority. Evidence: `team/evidence/T-025/qa/`.

**Tools (once each):** `test:client` 759/759; `cek-piksel` ALL PASS (156, includes the 57 `cek-komite` cases); `cek-layar` 148/148; `cek-bahasa` 138/138; `cek-gulir` 150/150 (chat family, `--tanpa-tahap2`; the other families are inside `cek-layar`); `cek-akhir-t019` 105/105.

**My own matrix** (`k25.py`, Playwright Python), 390x645 and 360x640, id/en/zh, Chromium, WebKit and Chromium with reduced motion: 686 checks per run, 0 bad, 0 console errors.
- **K11, nine combinations** (berkas lengkapi/sekarang/hendra x kabar persetujuan/disetujui/nanti), played through the real activity. The room beat after the task shows the right state: lengkapi = tunggu (no tags, ever), sekarang = catatan with two CATATAN tags, hendra = kosong (no tags). For the two kabar options that send news the chat then follows with the player's sent message first and the status note last, with no gate and no page scroll.
- **K13:** the committee room with `setuju` and four SETUJU tags; the next beat is the chat at once (no "Mulai percakapan" gate), message visible.
- **K12 and a full playthrough** (id, seed 3): the ending is reached in 253 steps. It passes through bengkel, komite, kantor, pool, tol and wawancara, with 0 console errors and 0 HTTP errors.
- **Glossary "Apa itu Komite Klaim?":** the meaning is whole, with four 32 px icons in a row and role names (Ketua Komite, Underwriter, Surveyor, Kepala Klaim; en/zh equivalents); the page does not scroll.
- **Regression on T-013 saved states** `berkas` and `surat`: both open and do not scroll.
- **T-024 polish:** `cek-akhir` 105 (it covers the clamps relaxed at 390x844, the Menu rows in view and the pressed state) and `cek-layar` pass.

**Notes (not bugs):**
1. Phone framing is wider than the mock (1 CSS px per art pixel, heads 36 px). This is Fullstack's point 1, accepted by the Lead.
2. The room pixel checks inside `cek-komite` are Chromium only. My own matrix covers the room state, tags and chat flow in WebKit.
3. English Menu: the last line of the script-status sentence is just below the fold at 360x640 (Fullstack's own note).
4. Not tested: a real phone, a screen reader (live region checked in the DOM only), and a real finger on the glossary.

## T-026 (2026-11-17) — PASS (0 bugs, 3 notes)

Testing under `C:\Users\User\Desktop\rksgm-episode2` (QA; no source edits, no commit, no e2e). My server :4001 (`RAKSA_LEGACY=on`, `CLIENT_DIST=client/dist`), stopped afterwards; `dist-rilis` untouched. One headless browser at a time, below-normal priority. Evidence: `team/evidence/T-026/qa/`.

**Tools (once each):** `test:client` 762/762; `cek-tag-t026` ALL PASS (18); `cek-bahasa` ALL PASS (138).

**My own check** (`k26.py`, Playwright Python) of `/cerita` at 390x645, 360x640 and 1280x800 in id/en/zh, Chromium (236 checks) and WebKit (227), 0 bad, 0 console errors:
- Episode 1 badge reads DEMO (grey #e9ebe4 with #4d5a4f letters); Episode 2 reads KASUS NYATA / REAL CASE / 真实案例 (green #215c40 with white letters).
- The badge sits inside the picture's top-right corner, is the same distance from the corner on both cards, is the topmost element at its centre and does not touch the meta line. I looked at the screenshots: no face is covered at 360x640 and 390x645 (the Episode 1 badge is over wall, the Episode 2 one over sky and roof).
- Tooltip (`title`) and `aria-description` equal the expected line in every language.
- Card heights and page scroll height equal Fullstack's baseline (`dasar-tanpa-tag.json`) within 0.6 px at every size that has a baseline (three WebKit sizes have none); no horizontal page scroll.
- Mulai works on both cards; Episode 2 opens at its first node (`buka`, "Laporan awal"), and the story text is unchanged.

**Notes (not bugs):**
1. The tooltip is hover only; on a touch screen the explanation is not visible (also noted by Fullstack).
2. The en and zh tooltip lines are Fullstack's wording, for the Lead or PIC to confirm.
3. Not tested: a real phone, a screen reader, and covers other than the current two.

## T-028 (2026-11-17) — PASS (0 high, 0 medium, 0 low bugs; 5 notes)

Testing under `C:\Users\User\Desktop\rksgm-episode2` (QA; no source edits, no commit, no e2e). Server: a fresh `tsc` build into `server/qa-t028/dist` (git-ignored, removed afterwards; I did not touch `server/dist`, `server/dist-uji` or `client/dist-rilis`), a scratch database outside the repo (`dev-setup --publish-demo` for the two DEMO scenarios and the test identities), `CLIENT_DIST=client/dist`, `RAKSA_LEGACY=on`, port 4001, stopped afterwards. Evidence: `team/evidence/T-028/qa/` (logs and screenshots; `sesi/` is the final run, `sesi-run2-citra-janji/` the one before it).

**`tools/cek-room-t028.mjs`:** ALL PASS (6). The tool refuses ports 4000-4002, so I ran an unchanged copy from my scratch folder with only that port rule, the import paths and the evidence folder changed (the file in `tools/` is untouched).

**My own session:** staff sign-in on `/host` as `qa.host`, created with `staff.ts create` (host role) and deactivated afterwards (a scratch database, discarded). A room from "Truk Trailer di Jalan Tol" (picker: first in the list, "versi 1 · tingkat 2 · DEMO", synopsis "untuk uji acara."), the projector open at `/projector?room=`, and four players: Ani (Chromium, always tepat, answers at 2.5 s), Budi (Chromium, tepat but at 22 s), Citra (WebKit, always keliru), Dodi (Chromium, times out on rounds 1, 6 and 12, reloads his page once at 4 s of round 9, otherwise kurang tepat). All 15 rounds were played; the final run had 127 checks and 0 findings. Two earlier runs gave only findings caused by my own script (the ranking card shows the top 3 plus your own row, so I had expected four rows).
- **30 s window:** a round with a missing answer closes 29-33.5 s after it opens (rounds 1, 6, 12); a round where everybody answers closes early.
- **Scoring (700 a + 300 s):** the cumulative points on each player's own screen match my replay of the policy within 40 points in every round (for example round 1: Ani 973 at 2.5 s, Budi 778 at 22 s, Citra 0, Dodi 0). Keliru and timeout give 0; kurang tepat gives 350 plus speed. Final totals: Ani 13,622, Budi 11,670, Dodi 6,536, Citra 0; each equals its own row in the final ranking.
- **Leaderboard order and ties:** descending in all rounds. In round 1 Citra and Dodi are tied at 0 and both show rank "3". Dodi's own screen shows both rows; the others show the top 3.
- **Reconnect:** Dodi reloaded his page mid-round 9 and came back to "Babak 9/15" with the five options, then answered normally.
- **K12 promise:** Ani made it (K12 option A). At K14 only Ani sees Pak Hendra's protest and her status chip shows "dampak tertunda −12"; the others do not. Her final summary lists the effect ("Babak 14 terkena dampak keputusanmu di babak 12 … status −12"), and nobody else's does. In the earlier run Citra made it and got the protest and the trace (her status was already at the floor).
- **Endings and summaries:** each player's ending matches my replay of the moods (Ani and Budi "Puas", Citra and Dodi "Kurang puas"); the 15 decision cards of each summary agree with what they chose (3 timeouts for Dodi); nothing scrolls sideways on a phone; host shows "Selesai"; no page errors.
- **DEMO room:** "[DEMO] Baret di Parkiran Pasar" still opens a room, a player joins and round 1 plays.
- **Second server start does not duplicate:** before and after the restart: 3 scenarios, 3 versions, 3 drafts, 9 events; Episode 2 is version 1 with the same hash (`a3f79ee8beda`); audit rows `scenario.create/submit/publish` stay 3 each. The only new row is the runtime's `room.interrupted_on_boot`. The log says "sudah terbit (versi 1), tidak ada yang ditulis".

**Notes (not bugs):**
1. The ranking card shows the top 3 plus your own row, so a tied player below third place is only visible on their own screen.
2. The line "Dicatat walaupun statusnya pulih dan akhir ceritanya baik." (existing room text) also appears under the trace for a player whose ending is poor and whose status did not recover (Citra, run 2).
3. Rooms show Indonesian only (Fullstack's point 1), and Pak Hendra has no portrait (point 3); both are known and accepted.
4. Not tested: a real phone, the CMS pages, more than four players, WebKit as host or projector, and Linode. Rooms left unfinished by the tool were reported as interrupted at restart, as designed.
5. The seed is published at every server start including production (Fullstack's point 2); the owner's :4000 only gets it after `server/dist` is rebuilt, which I did not do.

## T-027/T-029 (2026-11-17) — PASS (0 bugs; 1 handover finding, 4 notes)

Testing under `C:\Users\User\Desktop\rksgm-episode2` (QA; no source edits, no commit, no e2e). Evidence: `team/evidence/T-029/qa/`.

**Read first (handover finding):** the shared `client/dist` is still the build of T-026: its `theme-color` is `#176B45` and the home page and palette are the old ones. The first full run (kept in `run1-dist-lama/`) failed `cek-palet` (5 of 45) and `cek-beranda` (36 of 37) for that reason only. T-027 and T-029 are in the source tree but not yet in `client/dist`, which Fullstack's handoff says too ("`client/dist` untouched"). I therefore built the working tree into my own folder (`vite build --outDir` under `server/qa-t029`, removed afterwards) and tested that; `client/dist` and `client/dist-rilis` were not touched. Before the Lead's e2e or any commit/deploy check, `client/dist` has to be rebuilt from this tree.

**Server:** a fresh `tsc` server build in `server/qa-t029/dist` (git-ignored, removed afterwards), a scratch database outside the repo, :4001, stopped afterwards. The tools that refuse ports 4000-4002 (`cek-palet`, `cek-beranda`, `cek-room`) ran as copies from my scratch folder with only that rule, the import paths and the evidence folder changed; the files in `tools/` are untouched. `uji-room-cerita` ran on a start without legacy mode and with `STORY_MAX_PARTICIPANTS=4`, as its header asks.

**Full suites on the new build, all pass (one at a time):** `test:client` 771/771; typecheck 0 errors; `cek-palet` 45/45; `cek-beranda` 37/37; `cek-layar` 148/148; `cek-akhir` 105/105; `cek-gulir` 298/298 (full, all families); `cek-bahasa` 138/138; `cek-tag` 18/18; `cek-piksel` ALL PASS (incl. komite); `cek-telepon` 14/14; `cek-jalan` 8/8; `cek-kaki` 18/18; `cek-sisipan` ALL PASS (0 cases: the tool says there are no `cutin-*` states); `cek-gerak` 8/8; `cek-room` 6/6; `uji-room-cerita` 179/179 (all phases).

**My own checks (Chromium and WebKit):**
- **Home page** at 390x745, 360x640, a landscape phone (844x390) and 1280x800, in id/en/zh, first visit and returning player: 0 px page scroll on the portrait phones, Mode Cerita first, Mulai and Masuk on the first screen, no horizontal scroll, the profile state right, one `h1`. Tab order in Chromium: wordmark, language, sound, Mode Cerita card, "ubah" (returning player only), code field, Masuk, "Untuk panitia". Page background is the blush `#FFF9F5`.
- **Event banner with an open room** (the endpoint answered in the browser): shown at all four sizes in both engines, does not cover the code field or Masuk; its button fills the code and moves focus to Masuk. The page then scrolls 78 px on phones, as Fullstack documented.
- **Mulai and Masuk** flows (3 languages, both engines): Mulai opens `/cerita`; a code goes to `/join`. The only console messages are the expected 404s for a made-up room code.
- **Nothing green by mistake:** a computed-style scan of 14 screens (home, picker, K01 chat, committee room, end card, host, join, CMS and admin sign-in, solo, tutorial, the legacy host and join pages and the lobby) for any green outside the tepat family in PALET.md (pixel art excluded): 0 hits. The screens I looked at (home, picker, a mid-game chat at K13) are in the Raksa orange and blush with ink text.
- **Episode 2 playthrough** (id, seed 5) to an ending in 254 steps: 0 console errors, 0 HTTP errors; it passes through the committee room and the end card.
- **Legacy quiz** (legacy mode on): host created a room, a player joined on a phone, tutorial started, an option tapped; no page errors, no stray greens.
- **Story room round 1** and staff sign-in pages: covered by `cek-room` and `uji-room-cerita`, and the CMS and admin sign-in pages render.

**Notes (not bugs):**
1. In WebKit, Tab skips links (the Mode Cerita card, the wordmark, "Untuk panitia"): the engine's default link-focus setting, as in T-024.
2. The server on :4001 stopped on its own once between `cek-akhir` and `cek-gulir`; I restarted it and re-ran everything after that point. I do not know the cause (I had deleted its log file while it was running, which may be the reason); it did not recur in about 2 hours.
3. `cek-sisipan` has nothing to check without `cutin-*` states, so "ALL PASS (0)" is not evidence.
4. Not tested: a real phone or on-screen keyboard, a browser without `svh`, the pages behind the CMS and admin sign-in, hover and pressed states, the old quiz projector in a real round.

## T-030/T-031 (2026-11-18) — PASS (0 high, 0 medium, 1 low bug; 3 notes)

Testing under `C:\Users\User\Desktop\rksgm-episode2` (QA; no source edits, no commit, no e2e). I built the working tree (client and server) into my own folder `server/qa-t030` (git-ignored, removed afterwards), ran :4001 on that build with `RAKSA_LEGACY=on` and a scratch database, and stopped it afterwards. `client/dist` and `client/dist-rilis` were not touched. `cek-palet`, `cek-tugas` (and for beranda and room) refuse port 4001, so they ran as copies from my scratch folder with only that rule, the import paths and the evidence folder changed. Evidence: `team/evidence/T-030/qa/`.

**Full suites, all pass, one at a time:** `test:client` 771/771; typecheck 0 errors; `cek-palet` 50/50; `cek-tugas-t030` 9/9; `cek-beranda` 37/37; `cek-layar` 148/148 (all families); `cek-akhir` 105/105; `cek-gulir` 298/298; `cek-bahasa` 138/138; `cek-tag` 18/18; `cek-piksel` ALL PASS (incl. komite); `cek-telepon` 14/14; `cek-jalan` 8/8; `cek-kaki` 18/18; `cek-gerak` 8/8; `cek-room` 6/6. `uji-room-cerita` was not in this brief's suite list, so I did not run it (the legacy flow and story room round 1 are covered below). `cek-sisipan` is not in this list either.

**My own matrix, Chromium and WebKit, 227 checks each:**
- **Task cards K02, K04, K05, K07, K08, K09, K10, K11 and the ksim (K-SIM) card**, at 390x745 and 360x640: text inset 14 px or more on all four sides, the TUGAS tab centred on the top line, 0 px page scroll, no console errors.
- **0 px page scroll:** home at 390x745 and 360x640 (id/en/zh), the end card (id/en/zh), K11, ksim, K13 and K14 reply sheet in English and Indonesian, at 390x645/390x745 and 360x640.
- **Corners:** no rounded corner over 2 px on chat bubbles, the reply sheet, an activity, home, picker, host and CMS sign-in (icon circles, avatars and portraits excepted).
- **Button types** (Chromium, mouse and keyboard): home Mulai and Masuk, picker Mulai, end-card main and second button, task Mulai, host and CMS sign-in, the activity send button and the reply sheet send button. The enabled ones move 2 px down when pressed and show an ink focus ring; the disabled ones are the grey key shape and not orange. The reply rows show a pressed state in the screenshot. WebKit gave the same results.
- **Grounds:** home and picker show the sky pattern; story, activities, end card and staff pages show the tile ground (screens `*-home-*`, `*-kartu-*`, `*-akhir-*`, `stf-*`).
- **Episode 2 playthrough** (id, seed 7) to an ending in 221 steps: 0 console errors, 0 HTTP errors.
- **Legacy quiz** (legacy mode on): room created, a player joined, tutorial started and an option tapped; no page errors.
- **Story room round 1:** `cek-room` (6/6) covers it. **Host, CMS, admin sign-in and projector** (and the host on a phone) render in both engines without horizontal scroll or page errors.

**Bug (low):**
1. **B-01 low:** the room join page `/join?room=…` (the name and consent form) still has a card with 16 px rounded corners (`form.sr-kartu.sr-join-kode`), in both engines. Every other screen I scanned is stepped. The spec's list (home doors, code row, picker, staff cards, reply sheet) does not name this page, so the Lead may decide it is out of scope.

**Notes (not bugs):**
1. WebKit skips links when tabbing (home Mulai, picker Mulai and the end-card second button are links), so my keyboard-focus check could not reach them in WebKit; this is the engine's default, as in T-024.
2. My pressed-state check only reads the transform; the reply-row pressed state is a colour change, so I confirmed that one in the screenshot (`chromium-btn-sheet-opsi-tekan.png`).
3. Not tested: a real phone or touch pressed state held on a real finger, hover, and the pages behind the CMS and admin sign-in.

## T-033 (2026-11-18) — FAIL (0 high, 1 medium, 2 low bugs; 5 notes)

Testing under `C:\Users\User\Desktop\rksgm-episode2` (QA; no source edits, no commit, no e2e). I built the working tree (client and server) into my own folder `server/qa-t033` (git-ignored, removed afterwards), ran :4001 on it (legacy mode on; off for `uji-room-cerita`, with `STORY_MAX_PARTICIPANTS=4`) with a scratch database, and stopped it afterwards. `client/dist` and `client/dist-rilis` were not touched. The tools that refuse ports 4000-4002 (`cek-palet`, `cek-tugas`, `cek-langkah`, `cek-room`) ran as copies from my scratch folder with only the port rule, import paths and evidence folder changed. Evidence: `team/evidence/T-033/qa/`.

**The tree moved while I tested.** My first build (sources of 03:34) failed `typecheck` (`bacaTampilan` not found in `PemainHP.tsx`), and `cek-layar` and `cek-gulir` failed on `arena-k15` (6 of 154); Fullstack's edits of 04:34 fixed both. I rebuilt from the tree as it stood at 04:39 (identical to the `client/dist` Fullstack copied later) and re-ran everything; that second run is the one reported (the first is kept in `run1-tree-0334/`). A first re-run of `cek-langkah` failed 10 of 54 only because my copy of the tool was older than Fullstack's tool update; with a fresh copy it passes.

**Suites on the 04:39 build, all pass:** `test:client` 771/771; typecheck 0 errors; `cek-langkah` 54/54; `cek-layar` 154/154 (all families); `cek-palet` 56/56; `cek-tugas` 9/9; `cek-akhir` 105/105; `cek-gulir` ALL PASS (full run, all families); `cek-bahasa` 138/138; `cek-piksel` ALL PASS; `cek-room` 6/6. `uji-room-cerita`: 178/179. The one failure is "periode baru dibuat; periode bentrok ditolak: 409 409": my scratch database already held that period from an earlier run of mine, so it is an environment artifact (179/179 on a fresh database in T-029).

**My matrix: all 9 activities step by step** (a script that reads the pointer, hint, step and send bar after every real tap on the pointer's target; id/en/zh at 390x745 and 360x640 in Chromium, id in WebKit and with reduced motion):
- **K04, K05, K07, K10:** the pointer sits on a tappable target near it at every step, the hint changes, the send bar unlocks at the last step, no page scroll, no console errors. The coach card "Cara main" shows once for K05, K10 and ksim (never for the others), closes with "Mengerti", and does not return after a reload. The pointer is static under reduced motion.
- **K02:** the pointer alternates document (on the desk) and tray as designed (D-333) and the send bar unlocks after the last tray. But the document is a non-focusable `div.hp-panggung-benda` (see B-03).
- **K08:** the tool-based walk (`cek-langkah`) passes; my generic loop could not walk K08 end to end because the "next sign" and "send" buttons look alike to it.
- **K11, K-SIM:** my loop stops at the first enabled stage button, so it only checks the first step; `cek-langkah` covers the rest.
- **Keyboard path:** Tab reaches the pointer's target on K09 in both engines.
- **Scoring unchanged:** I re-ran the T-020 answer scripts on this build: K02, K04, K07, K09 and K10 give identical result texts and status lines to the T-020 logs; K11 differs only in the result of option "hendra + disetujui" (it now shows the committee-room beat before the chat, as T-025 changed it). K05 matches in id and en; in Chinese the "just wait" result text is two characters longer than in the T-020 log (the status line is the same), which I could not trace.
- **Story room:** `cek-room` and `cek-palet` (screens 18 and 19: lobby, round 1, consequence, leaderboard) pass; the host, projector, join and CMS pages show no corner above 2 px in either engine (my T-030 low about the join card is fixed). **Legacy quiz** (legacy mode on): room created, a player joined, tutorial started and an option tapped, with no page errors.
- **Episode 2 playthrough** (id, seed 11) to an ending in 259 steps: 0 console errors, 0 HTTP errors.

**Bugs:**
1. **B-01 medium: the K09 pointer leads away from completion.** After the five testimonies are read, the pointer goes to the first untouched button of the board in DOM order: a statement chip, the "Tidak perlu" button and then `sk-lepas`, the remove control of a pinned item. Following it literally (tapping what it points at, 9 taps) undoes the pinned card and the activity returns to step 1 with no pointer and the send bar still locked ("Tandai 5 kartu lagi"). Happens in id/en/zh, both sizes, Chromium (6 of 6), WebKit and reduced motion. Cause: `Pandu.tsx` `cariSasaran` has no K09 rule and falls through to "first untouched button". Evidence: `dbg-k09.png`, `k33-chromium.log`.
2. **B-02 low: K08 conclusion step at 360x640 in Indonesian.** The list of five conclusions scrolls by a few pixels (the fifth option is clipped at the bottom) and the pointer arrow sits on the question text ("rambu" is partly covered). English and Chinese at 360x640 and Indonesian at the other sizes do not scroll. The T-020 run of the same script had no scroll here. `cek-layar` does not catch it. Evidence: `pontaj/chromium-k08-id-360x640-benar-simpul.png`.
3. **B-03 low: K02's pointer target is not keyboard-focusable.** Step 1 and every "document" step point at the document on the desk, a `div`; a keyboard user cannot reach it in the picture view (the list-view link "Gunakan tampilan daftar" is the keyboard route). The handoff says the pointer target is an existing focusable control.

**Notes (not bugs):**
1. The "hint never changed" and "no pointer" lines for K09, K11 and ksim in my generic loop are partly artifacts of the loop; B-01 was confirmed by hand (`dbg-k09.png`).
2. The coach card is a non-modal dialog but it blocks taps on the activity until "Mengerti" is pressed, so the older T-020 answer scripts stall on K05, K10 and ksim unless the card is dismissed first.
3. `cek-sisipan` was not in this brief's list; `cek-piksel` was re-run as asked.
4. WebKit skips links when tabbing (engine default, as before).
5. Not tested: a real phone, a screen reader, hover, and all three languages in WebKit and reduced motion (Indonesian only there).

## T-034/T-035 (2026-11-18) — PASS (0 high, 0 medium, 4 low findings; 4 notes)

Testing under `C:\Users\User\Desktop\rksgm-episode2` (QA; no source edits, no commit, no e2e). I used the shared `client/dist` as it was (built 07:30) and a fresh `tsc` server build in `server/qa-t035` (git-ignored, removed afterwards), :4001 with a scratch database, `RAKSA_LEGACY=on`, and `RAKSA_LEGACY=off` for the language-menu check; stopped afterwards. `client/dist-rilis` not touched. The tools that refuse ports 4000-4002 (`cek-k15`, `cek-tugas`, `cek-langkah`) ran as copies from my scratch folder with only the port rule, import paths and evidence folder changed. Evidence: `team/evidence/T-035/qa/`.

**Suites:** `test:client` 771/771; typecheck 0 errors; `cek-k15-t034` 12/12; `cek-tugas` 141/141; `cek-langkah` 54/54; `cek-layar` 154/154 (all families); `cek-bahasa` **FAILED 18 of 138** (see L-01).

**K15 composer matrix** (390x745 and 360x640, id/en/zh in Chromium; id in WebKit and with reduced motion; 227 checks, all pass): 6 chips in two columns, each at least 44 px high, preview on top; chips chosen in a shuffled order (5, 2, 6, 1) give a preview in part order; the preview opens and closes on tap (`aria-expanded`); a chosen part leaves the message on a touch tap; Enter and Space toggle a chip and Tab reaches all six chips and the send button; the send button is locked with nothing chosen and unlocked with parts chosen; 0 px page scroll and 0 px inner scroll in every state; no console errors. **Scoring identical for the same chosen set:** parts {1, 2, 4} chosen in three different orders give the identical result card text ("... Status Pak Hendra masih Tenang, tapi membaik").

**Re-test of my T-033 findings:**
- **B-01 medium (K09 pointer):** resolved. The pointer and the target marker no longer exist outside K08 (checked on all nine activities in both engines: present only in K08). The K09 answer script (the T-020 one, with the coach card dismissed) completes the activity, the send bar unlocks only when the board is complete, and its result texts equal the T-020 logs. K02, K04, K07 and K10 also match the T-020 logs; K05 and K11 differ as noted in my T-033 report (T-025 flow, and two characters in a Chinese text).
- **B-02 low (K08 conclusion sheet at 360x640 id):** resolved. All five conclusions fit without scrolling, and the arrow now stands beside conclusion 1 and covers no text (`pontaj/chromium-k08-id-360x640-benar-simpul.png`).
- **B-03 low (K02 keyboard focus):** no longer applies, because there is no pointer target in K02.
- **Result cards (T-035):** `cek-tugas` passes all 141 cases (every saved state, 390x745 and 360x640, id/en/zh: the tab sits on the frame line, no text touches it, inner-panel text is 14 px or more from the left line); I also looked at a Chinese result card, which shows the tab on the line and the Kenapa panel padded.
- **Language menu with the server flag off:** the picker offers ID / EN / 中文 on the home page, the picker page, the join page and the story Menu, in both engines, and choosing 中文 switches the page to Chinese.

**Findings:**
1. **L-01 low (tool, not the game): `cek-bahasa` fails 18 of 138** (the states `akt-rambu`, `akt-saksi`, `wawancara-3` at three sizes in en and zh). The failing check is "text clipped": `b.: Your action` / `b.: 你的行动`, the screen-reader-only original label of the result card that T-035 now hides and replaces by the tab. The cards themselves look right (the tab "Your action" / 你的行动 sits on the frame line, nothing is cut off). The tool needs to skip that hidden label; T-035's gate did not list `cek-bahasa`.
2. **L-02 low: K15 chip "Kabar pembayaran" breaks the word "pembayaran" across two lines** ("pembayara" / "n") at 360x640 in Indonesian (no other size or language breaks a word). `cek-k15` does not catch it (no overflow).
3. **L-03 low: K15 preview at 360x640** shows one full line and a half-cut second line with the "…" (spec: 2 lines on short screens). Evidence: `chromium-id-360x640-k15.png`.

**Notes (not bugs):**
1. While the preview is open at 360x640 the chips below the first row are pushed under the send bar and cannot be scrolled to (the page and the inner area do not scroll); tapping the preview closes it again.
2. (L-04) Hints of K05, K10 and K-SIM still say "the arrow points at ..." ("Ketuk tempat tujuan yang ditunjuk panah", "Bandingkan baris yang ditunjuk panah", "Ketuk benda yang ditunjuk panah"), but since T-035 there is no arrow outside K08. This is a misleading instruction for the player; I count it as L-04 low (same text in en and zh).
3. WebKit skips links when tabbing (engine default, as before).
4. The two things in the brief about the hosted room and legacy quiz were not re-tested here (nothing changed there since my T-033 run).
5. Not tested: a real phone, a screen reader, hover.

## T-037/T-036 (2026-11-18) — PASS (0 high, 0 medium, 1 low finding; 5 notes)

Testing under `C:\Users\User\Desktop\rksgm-episode2` (QA; no source edits, no commit, no e2e). I used the shared `client/dist` (built 08:42, unchanged during my run) and a fresh `tsc` server build in `server/qa-t037` (git-ignored, removed afterwards), :4001 with a scratch database and `RAKSA_LEGACY=on` (restarted once with `RAKSA_DEMO_CERITA=on`); stopped afterwards. `client/dist-rilis` not touched. `cek-beranda` (refuses port 4001) and `cek-pemilih`, `cek-audio` ran as copies from my scratch folder with only the port rule, import paths and evidence folder changed. Evidence: `team/evidence/T-037/qa/`.

**Suites, all pass:** `test:client` 771/771; typecheck 0 errors; `cek-pemilih` 13/13; `cek-tag` 18/18; `cek-beranda` 37/37; `cek-bahasa` 138/138; `check:audio` (with `AUDIO_BASE=:4001`) all three tracks pass; `cek-audio-t036` ALL PASS.

**Picker matrix** (`/cerita` at 390x745, 360x640, 390x844 and 1280x800 in id/en/zh, new player and returning player with saved progress; Chromium and WebKit; 358 checks each; Chromium 0 bad, WebKit 3 bad that are only the keyboard-order note below):
- Exactly one playable card, linking to `/cerita/auto-2` (the truck case); no demo card; no Join Game card; the card shows Pak Hendra's portrait.
- The KASUS NYATA chip sits on its own line directly above the meta line, and the meta line is not truncated (no ellipsis, no clipped item). 0 px page scroll on the phones and no horizontal overflow at any size.
- The locked "Episode 2 · Segera hadir" row is a disabled control (`aria-disabled`, no link), 52 px high; a tap shows the note for about 2 s with the row height unchanged and no navigation, and it is empty again after 2.7 s.
- The key reads Mulai for a new player and Lanjutkan for a returning one, in all three languages. Mulai and Lanjutkan open the story at `/cerita/auto-2` and the browser Back returns to the one-card picker.
- The room-code link "Masuk di beranda" goes to `/` and the home page code row is there.
- Chromium keyboard order: back, language, sound, the card key, the locked row, "Masuk di beranda".
- `/cerita/auto-1` still loads by URL at 390 and 1280 in both engines.
- With `RAKSA_DEMO_CERITA=on` (`/api/config` reports `features.demoCerita: true`): two cards appear, the demo one linking to `/cerita/auto-1` (336 checks, Chromium); the only misses are the page scroll with two cards at 360x640 in English (61 px) and the 360x640 Chinese is fine; this is a developer flag and was not expected to fit one screen.

**Audio:**
- The three story tracks are requested as `cerita-kantor.mp3`, `cerita-periksa.mp3` and `cerita-penutup.mp3` with `?v=t036b` (in the built JS). Decoded: kantor 110.8 s, peak -7.1 dB, RMS -21.4 dB; periksa 120 s, peak -7.2 dB, RMS -21.4 dB; penutup 115.2 s, peak -8.3 dB, RMS -22.4 dB: the HANDOFF numbers. No silence, loop start and end within 1.4 dB.
- Which SFX fires on which event (I counted the Web Audio nodes created after each action and matched them to each SFX as played from the Menu's "Coba suara" buttons): K02 tray tap = `taruh`; K11 file tab opened = `kertas`; chat: sending a reply plays `pesanKirim` immediately and the reply that follows plays `pesanTerima`. No console errors in any of these.

**Finding:**
1. **L-01 low:** tapping the document on the desk in K02 (picture view) plays no sound at all. The brief names "K02 document open" for `kertas`; in the code `kertas` is wired to the K11 file tabs and the K-SIM objects only. If a document sound is wanted in K02, it is not there.

**Notes (not bugs):**
1. In WebKit, Tab skips the links and buttons that are links (the card key, "Masuk di beranda"), so my keyboard-order check fails there; it is the engine default, as before.
2. The returning-player key text only shows "Lanjutkan" for a state past the first chapter (my first choice of saved state still read "Mulai", so I used a later one).
3. Playwright treats the `aria-disabled` locked row as not clickable, so my script forced the click; a real finger or mouse works (tested).
4. Not verified: listening to the music or the effects, a real phone, a screen reader.
5. `check:audio` reads :4000 by default, which still serves the old files until the Lead refreshes `dist-rilis`; I ran it against my own server.
