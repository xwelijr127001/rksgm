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
