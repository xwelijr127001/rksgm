# DESIGN REVIEW (Designer -> Fullstack/Lead)

## T-xxx — spec / review  (date)
- [D-01] screen · problem · fix · priority

---

## T-003 — spec (2026-11-15)

Author: Designer · Status: spec for Fullstack (step 1/3) · No source edited, no mockup (small change).
Sources: team/specs/2026-11-15-homepage.md (Context, N-1, N-2, T-003), team/REVIEW.md rev 2 re-review,
client/src/pages/Landing.tsx, art/WelcomeArt.tsx, components/JoinGame.tsx, player.css 233-320, theme.css tokens.

**How this spec was checked.** Dev client (vite, port 5199, no API server, so no legacy banner) driven by headless Chrome over
CDP. I reordered the DOM and injected the proposed CSS into the live page (nothing saved to the repo) and measured at
320/340/359/360/375/390/430, tablet 800x1024, landscape 844x390 and 740x360, desktop 1280x800, in id/en/zh, profile absent and
present, at DPR 2. Every number below is measured, not estimated. The proposed CSS block is in D-13 so Fullstack can start
from tested rules. Re-verify on the real build (DPR 1/2/3, real legacy banner) in the review step.

### Current state (before), for reference
- Phone order today: header, eyebrow/h1/intro, Join Game, Mode Cerita, footnote, then hero art + greeting last.
  At 360x640 the hero starts at y=694, i.e. entirely below the fold; the first screen is text + form.
- Desktop 1280x800 today: hero art y 169-575, greeting y 583-643, h1 y 141-261, Join card y 355-533. The new layout must
  reproduce exactly these (measured identical in the simulation, see D-09).

### Spec lines

- [D-01] Phone <=700px portrait · stacking order · Confirmed, no change to the Lead's order:
  header -> hero (illustration frame, then ONE greeting bubble) -> eyebrow -> h1 -> Join Game -> Mode Cerita card (incl. the
  play-as row inside it) -> footnote. The greeting stays in normal flow, a sibling AFTER the clipped illustration frame, never
  inside it (N-1). Implementation: DOM order, not CSS `order`. Minimal route that keeps desktop pixel-identical: in
  Landing.tsx move `<div className="lp-seni"><WelcomeArt/></div>` to be the FIRST child of `<main className="lp-utama">`, keep
  the `.lp-kiri` wrapper as is (do not flatten it). Desktop placement = explicit grid cells (D-09). Side effect to accept:
  screen-reader order on desktop is now greeting-then-headline although the hero is visually on the right; harmless, one
  sentence of greeting. Priority: high.

- [D-02] Hero height cap · scope (answers N-2) · The cap covers the ILLUSTRATION FRAME ONLY, not the whole hero. Cap:
  `height: min(40vw, 190px)` on a new frame element `.lp-kota-bingkai` that wraps the `<svg>` inside `figure.lp-kota`
  (so 144px at 360, 150 at 375, 156 at 390, 172 at 430, 190 from 475px up to 700). The greeting (`figcaption.lp-kota-sapa`,
  portrait 60px + bubble) is outside the frame and is budgeted separately: 60px normally, up to 80px when the bubble wraps
  to 3 lines at 320px. Frame CSS: `display:flex; justify-content:center; overflow:hidden; height:min(40vw,190px)`; the svg
  gets `height:100%; width:auto; aspect-ratio:560/444; margin:0 auto` so the city scales down whole (no cropping in T-003,
  the art is vector so it is DPR-independent). Why a frame now, not later: T-004 must put a pixel sprite (~184px tall at integer
  DPR, N-1) in this slot, and the frame is the clipped viewport that lets it fit 144px without touching shared sprite sizing;
  the greeting being outside it already satisfies N-1. Priority: high.

- [D-03] Fold budget at 360x740 · COMPLETE code input + Masuk visible without scrolling in id/en/zh, profile absent and
  present · Measured, identical in all six combinations (the profile row lives below Join, so it cannot move it):

  | Block | y from..to | px |
  |---|---|---|
  | Header (logo, ID, sound) | 0-78 | 78 |
  | Hero frame (illustration) | 78-222 | 144 |
  | gap | 222-230 | 8 |
  | Greeting (portrait + bubble) | 230-290 | 60 |
  | gap + eyebrow | 290-322 | 32 |
  | h1, 2 lines at 38px | 326-403 | 77 |
  | gap | 403-415 | 12 |
  | Join Game card (code field + Masuk inside) | 415-580 | 165 |

  Masuk bottom = 564 of 740 -> 176px spare. Same check: 360x620 -> 56 spare; 375x667 -> 97 spare; 390x844 -> 268 spare;
  430x932 -> 340 spare. Because real Chrome on a "740" phone shows roughly 650-690px once the address bar is counted,
  treat 650 as the practical fold: 360 wide still has ~85px spare. With the fixed legacy banner (86px incl. safe-area):
  360x740 has 90px spare, 375x667 has 11px (tight), so D-04's banner rule below is required, not optional.
  Do not let any block grow: e.g. the intro paragraph back on screen costs 65-85px and would erase the banner margin.
  Priority: high.

- [D-04] Short portrait screens and the legacy banner · When the illustration cannot fit, drop it, keep the greeting:
  (a) `max-width:700px` + portrait + `max-height:619px` -> hide `.lp-kota-bingkai` (display:none);
  (b) `max-width:359px` -> hide `.lp-kota-bingkai` always (the stacked Join form is +66px tall; 320x640 overflows by 13px
  with the hero shown, measured; with it hidden Masuk ends at 524);
  (c) `.lp-halaman.alur-ada-spanduk` + `max-height:699px` -> hide `.lp-kota-bingkai` so the fixed banner never covers Masuk
  (class is on the same root element as `.lp-halaman`, PlayerShell renders `player-ui <className>`).
  Measured: 320x568 Masuk bottom 524 (44 spare), 320x640 524 (116), 340x700 524. The greeting bubble stays visible in all of
  these. Priority: high.

- [D-05] Headline · size + lines · `.lp-halaman .lp-judul` = 38px, line-height 1.02 (existing), margin `4px 0 12px`, <=700px.
  Max 2 lines verified in all three languages at 320, 360, 390 and 430: id "Siap jadi / andalan?", en "Ready to /
  step up?", zh "准备好 / 挑大梁？" (each is already two spans split by `<br>`; the longest, en, fits on one line at 320). Height
  77px for 2 lines. Keep the existing `<br>`; do not let it wrap to 3 lines: if a future string is longer, reduce to 36px, never
  below. Eyebrow: remove the 10px override at <=700 (use the base 11px, contrast #5d6d5b is already >=4.5:1). Priority: high.

- [D-06] Intro paragraph `.lp-isi` · Hide on <=700px (all heights, both orientations) but VISUALLY hide, not `display:none`:
  use the clip/1px pattern equivalent to `.sr-only` so screen readers still get the one-sentence description. Reason: it costs
  65-85px (3-4 lines at 15px), it is the marketing-style sentence, and the page already explains itself: eyebrow
  "MAIN BARENG RAKSA", Join Game's own line, and the Mode Cerita card's own line. Shown again from 701px up (unchanged).
  Priority: med.

- [D-07] Tablet band 701-900px · Single column, hero FIRST (same DOM, same order as phone), hero container
  `width: min(420px,100%)` (existing `.lp-seni` rule; keep), centered. The illustration frame cap does NOT apply here
  (cap is <=700px only): the art shows at its natural 420x333. Measured 800x1024: art 114-447, greeting 455-515, h1 578-684,
  Join 774-939, Masuk bottom 921 (103 spare), no horizontal scroll. Text column stays `min(560px,100%)` centered as today.
  Priority: med.

- [D-08] Landscape phones (<=500px tall) · Choose HIDING: `@media (max-width:900px) and (orientation:landscape) and
  (max-height:500px) { .lp-halaman .lp-seni { display:none } }` (hides illustration AND greeting; the greeting row alone
  would cost ~68px and push Masuk below the fold: 844x390 Masuk bottom is 334 with 56 spare, 740x360 has 26 spare).
  Keep the existing landscape rules (smaller header, one-line h1 at 34px, intro 14px). Scoped to <=900 wide so a short
  desktop window (e.g. 1280x480) keeps today's two-column layout with the hero. Measured: 844x390 and 740x360 render
  exactly as today. Priority: med.

- [D-09] Desktop >900px · MUST look the same as today. Hero stays in the right column, text column left, same sizes,
  same vertical centering. Implementation: `@media (min-width:901px){ .lp-halaman .lp-seni{grid-column:2;grid-row:1}
  .lp-halaman .lp-kiri{grid-column:1;grid-row:1} }`. Measured at 1280x800 after the DOM move: art 169-575, greeting 583-643,
  h1 141-261, Join 355-533, i.e. identical to before (the T-002 title text is the only expected visual change). The frame cap and
  all phone rules are inside <=700px media queries only. QA: before/after screenshot at 1280 must match.
  Priority: high.

- [D-10] Join Game form · side by side from 360px up, stacked below 360px, no horizontal scroll at 320, taps >=44px.
  Measured: at 360 the code field is 139-147px wide and the Masuk button 117px, both 56px tall; at 320 stacked they are
  full width (234px) and 56px tall each; zero elements under 44px tall at 320/360/375/390/430; `scrollWidth <= innerWidth` at
  every width tested. Stacked rule (<=359px, homepage only): `.lp-halaman .lp-join-form{flex-direction:column}` and Masuk
  `justify-content:space-between` (label left, arrow right, same as the big CTA convention). Priority: high.

- [D-11] Join code field · REAL BUG found while testing: a code of six wide letters ("WWWWWW", legal: room alphabets
  include W and M) needs 159px of field width; today the field is 139px at 360 and 154px even at 375, so the last
  character is clipped. Fix on the homepage only (<=700px, under `.lp-halaman`): code font 20px (was 22), letter-spacing
  .08em (was .2em), horizontal padding 8px (was 12). Re-measured with "WWWWWW": no clipping at 360, 375, 390, 430
  (field 147-217px wide vs 125px needed) and in the stacked layout at 320-359. Selector must out-rank the existing
  `.player-ui .lp-join-kode`, i.e. `.player-ui.lp-halaman .lp-join-kode`. Join title goes 21 -> 20px at <=700px so the phone
  type scale shares one "title" size (D-12). OUT OF SCOPE, log for Lead: the same clipping exists on /cerita (JoinGame is
  shared and must not change in T-003); suggest a later ticket. Priority: high (homepage), low (/cerita).

- [D-12] Type scale, spacing, palette (phone) · Four sizes only: display 38px (h1) / title 20px (Join title and Join code) /
  body 14-15px (bubble, Join line, card line, button labels) / caption 11-12px (eyebrow, footnote, bubble name). Nothing new
  introduced; two existing values change (h1 44 -> 38, join title 21 -> 20). Spacing on the 4/8 grid: hero frame -> greeting 8,
  between blocks 16 (`.lp-utama` gap, was 26), h1 -> Join 12, side gutters 20 (existing), page bottom 24. No new colors: use the
  tokens `--hijau` (Join card, was #215c40), `--kuning` (Masuk), `--tinta`, `--tinta-lembut`, `--krem`, `--krem-tua`; any new
  rule should use `var(--...)` rather than a new hex. Radii stay at the existing 12/16/18; no new shadows. Priority: med.

- [D-13] Constraints for Fullstack (binding) ·
  1. Every homepage override under `.lp-halaman` (`.player-ui.lp-halaman` where specificity is needed). JoinGame is shared
     with /cerita (`cer-hub-join`): do not touch `.lp-join*` base rules or JoinGame.tsx behaviour; the /cerita hub at 390px
     must be pixel-identical to before.
  2. Mode Cerita "Mulai" stays a `<span>` inside the single card `<Link>` (no nested button), unchanged markup/aria.
  3. DOM order change, not CSS `order`; one greeting bubble in the DOM; keep `.lp-kiri` wrapper; add only the
     `.lp-kota-bingkai` div around the svg in WelcomeArt.tsx. No i18n key changes, no copy changes.
  4. No new animation in T-003. Nothing here needs `prefers-reduced-motion` handling; T-004 owns motion.
  5. Tested starting CSS (inject-and-measured; adjust only if the real DOM disagrees):

```css
@media (min-width:901px){ .lp-halaman .lp-seni{grid-column:2;grid-row:1} .lp-halaman .lp-kiri{grid-column:1;grid-row:1} }
@media (max-width:900px){ .lp-halaman .lp-seni{width:min(420px,100%)} }
@media (max-width:700px){
  .lp-halaman .lp-utama{gap:16px;padding:0 20px 24px}
  .lp-halaman .lp-kota-bingkai{display:flex;justify-content:center;overflow:hidden;height:min(40vw,190px)}
  .lp-halaman .lp-kota-gambar{width:auto;height:100%;aspect-ratio:560/444;margin:0 auto}
  .lp-halaman .lp-kota-sapa{margin-top:8px}
  .lp-halaman .lp-judul{font-size:38px;margin:4px 0 12px}
  .lp-halaman .lp-isi{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  .lp-halaman .lp-sapa .eyebrow{font-size:11px}
  .lp-halaman .lp-join-judul{font-size:20px}
  .player-ui.lp-halaman .lp-join-kode{font-size:20px;letter-spacing:.08em;padding:10px 8px}
}
@media (max-width:359px){
  .lp-halaman .lp-join-form{flex-direction:column}
  .lp-halaman .lp-join-mulai{justify-content:space-between}
  .lp-halaman .lp-kota-bingkai{display:none}
}
@media (max-width:700px) and (orientation:portrait) and (max-height:619px){ .lp-halaman .lp-kota-bingkai{display:none} }
@media (max-width:700px) and (max-height:699px){ .lp-halaman.alur-ada-spanduk .lp-kota-bingkai{display:none} }
@media (max-width:900px) and (orientation:landscape) and (max-height:500px){ .lp-halaman .lp-seni{display:none} }
```
  (The tested run applied the svg sizing directly because the frame div does not exist yet; behaviour is the same. The
  last-but-one rule, banner hide, is specified but could not be run: no API server, so no legacy banner. Verify it live.)
  Priority: high.

- [D-14] Anti AI-slop check on the new composition · Passes, with two watch items. Pass: flat cream/green/yellow palette from
  tokens, no gradient/glass/glow added, real RAKSA illustration + Miss Raksa portrait (no emoji), copy untouched and
  on-story, one primary action (yellow Masuk; Mode Cerita "Mulai" is the quiet second), error state exists
  (`.lp-join-galat`), pressed state exists (`.primary-action:active`), no animation added. Watch 1 (low, not T-003): the Mode
  Cerita card at 360px wraps its line to 4 lines because "Mulai" takes a column, and the portrait floats low against the
  text; consider stacking "Mulai" under the text on phones in a later pass (below the fold, so no T-003 impact). Watch 2
  (low): at 320px the greeting bubble wraps to 3 lines ("...with our / smile"); acceptable, covered by the 80px greeting
  budget. Priority: low.

### Review checklist for step 3 (Designer review) and QA
- 360x740 id/en/zh, profile absent + present: complete code input and Masuk visible, Masuk bottom <= ~570.
- Type "WWWWWW" at 360, 375, 390, 430 and at 320 (stacked): no clipped character.
- 320, 360, 390, 430, tablet 800, landscape 740x360 and 844x390, desktop 1280: screenshots; desktop identical to before
  except the title text; /cerita hub at 390 unchanged.
- Legacy banner on (one open room): Masuk not covered at 360x740 and 375x667; banner "Gabung" fills the code + focuses Masuk.
- DPR 1, 2, 3 at 360 wide: hero frame height equals min(40vw,190px), no cropping of the city, greeting outside the frame.
- Reading order via keyboard/screen reader: greeting -> eyebrow -> h1 -> Join (code, Masuk) -> Mode Cerita link.

### Sketch: phone 360x740 (scale ~ 1 row = 20px)

```
y     0 +--------------------------------------+
        | RAKSA | GAME             [ID] [sound]|  header 78
     78 +--------------------------------------+
        |        .-----------.                 |
        |        |  city art |  frame 144px    |  <- cap min(40vw,190), overflow hidden
        |        '-----------'                 |
    222 +--------------------------------------+  gap 8
    230 | (Miss)  Miss Raksa . Layanan Klaim   |
        | (Raksa) anytime anywhere with our .. |  greeting 60 (outside the frame)
    290 +--------------------------------------+  gap 16 (eyebrow 16 inside)
        |        MAIN BARENG RAKSA   (11px)    |
    326 |          Siap jadi                   |
        |          andalan?        (38px x2)   |  h1 77
    403 +--------------------------------------+  gap 12
    415 | [Join Game card, green, 165]         |
        |  (portrait) Join Game (20px)         |
        |             Punya kode room ...      |
        |  [ KODE field 56 ] [ Masuk -> 56 ]   |  Masuk bottom = 564
    580 +--------------------------------------+
        |  -- 160px spare to 740 (90 with the  |
        |     86px legacy banner) --           |
        |  Main sendiri / Mode Cerita card ... |  (below the fold, scrolls)
```
Stacked variant (<360px, hero frame hidden): header 78 -> greeting (60-80) -> eyebrow + h1 (~95) -> Join card ~250 (field 56 over Masuk 56)
-> Masuk bottom 524 at 320 wide.

---

## T-003 — review (2026-11-15)

Reviewer: Designer · Build reviewed: Fullstack's dev client on :5233 (talks to the API server with `RAKSA_LEGACY=on`, so a real
open-room banner "QA Uji Banner" was showing during my checks) · No source edited.
Method: read team/HANDOFF.md T-003 and the diff vs team/evidence/T-003/base/ (Landing.tsx +4/-2, WelcomeArt.tsx +3,
player.css +29); verified the claims myself with headless Chrome over CDP at DPR 2 (not just Fullstack's numbers); looked at
the screenshots; re-checked checksums of the before/after PNGs.

### Verdict: PASS

Implementation matches D-01..D-13 line for line (the CSS is the D-13 block as written, no deviations). No blockers.
Nothing below needs to be fixed before T-003 is accepted; the one med item pre-exists T-003 and is for Lead to schedule.

### Checklist results (all measured live)
- **360x740 fold, id/en/zh x profile absent/present (6 combos):** code input y 510-566 and Masuk bottom 566 in all six, 174px spare;
  h1 exactly 2 lines in all; frame 144px; no horizontal scroll; no element under 44px tall. The real legacy banner was
  showing in these runs and starts at y=666, so it does not touch Masuk (100px clear).
- **Other phones:** 390x844 Masuk 578, 430x932 594, 375x667 frame hidden (banner rule D-04c firing live) Masuk 422 vs banner top 593,
  360x600 / 320x640 frame hidden, 320x568 Masuk 525 with stacked form. "WWWWWW" does not clip at 320/360/375/390/430
  (Fullstack's shots + checksums agree with my width numbers; scrollWidth == clientWidth).
- **Tablet 800x1024:** single column, hero first, art 333px at min(420px,100%), intro paragraph shown, Masuk 921, no h-scroll.
- **Landscape 844x390 / 740x360 (no banner):** hero + greeting hidden, Masuk 334, as spec'd. Short desktop 1280x480 keeps the two-column
  layout with hero (rule correctly scoped to <=900 wide).
- **Desktop 1280:** before/after PNG byte-identical (md5 b83b1e75..., I re-ran it); my own capture shows the same composition
  (hero right, greeting under it, text column left).
- **/cerita hub 390:** before/after PNG byte-identical (md5 87487539...). Live computed styles on /cerita with a profile: code 22px,
  letter-spacing 4.4px (.2em), padding 10px 12px, title 21px, root has no `.lp-halaman`: shared JoinGame untouched.
- **Reading order (DOM order of the key nodes):** greeting bubble -> eyebrow -> h1 -> Join title -> code field -> Masuk -> Mode Cerita
  link, which equals the visual order on phone. One greeting bubble. "Mulai" is still a span inside the single card link.
  The visually-hidden intro (clip rect 0) is still in the DOM for screen readers.
- **Type scale:** the two values T-003 changes are exactly the spec's (h1 44 -> 38, Join title 21 -> 20; code 22 -> 20; eyebrow 10 -> 11).
  No new size introduced. **Spacing:** only 16/8/12/4/20/24 added. **Palette:** the new CSS contains no colors at all (tokens
  untouched). **Shadows/radii/animation:** none added (zero animated elements on the page apart from the pre-existing banner entrance).
- **Anti AI-slop (ROLE-DESIGNER.md) on the new phone composition:** pass. Flat cream/green/yellow, no gradients/glass/glow, real RAKSA
  illustration + pixel Miss Raksa portrait, no emoji, copy untouched and on-story (shows "Layanan Klaim" / "Claims Officer" / "理赔专员"
  correctly after T-002), one primary action (yellow Masuk) with Mode Cerita "Mulai" clearly secondary, hero no longer buried below
  the form, tap targets all >=44px, error/pressed states unchanged. It reads as a RAKSA game screen, not a SaaS template.

### Fix list: blockers (high)
None.

### Fix list: should schedule (med), none caused by T-003
- [D-15] Homepage, landscape phone 844x390 / 740x360 with the legacy event banner · the fixed bottom banner (86px) covers the code field and
  Masuk on the first screen (Join card ends y=352, banner starts y~304; page is scrollable, tap on Gabung still fills the code) ·
  fix (legacy mode only): on `(orientation:landscape) and (max-height:500px)` render the banner as the compact top pill it already is at
  >=1001px, or hide the Join description line, or let the banner sit in flow below the Join card · med. Pre-existing: the landscape
  rules are byte-identical to base, so this was true before T-003; log as its own ticket (suggest alongside T-005).

### Polish (low), non-blocking, can wait for T-004/T-005
- [D-16] Homepage 320x568 with the legacy banner · Masuk (bottom 525) is partly under the banner (banner top ~482); scrollable, and the
  hero is already hidden there · fix: under `.lp-halaman.alur-ada-spanduk` at `max-width:359px` visually hide `.lp-join-isi` (saves ~60px) ·
  low. Legacy mode only, not in the T-003 acceptance.
- [D-17] Join code field, all pages · "KODE" placeholder colour #b7c3b2 on #fffefa is ~1.8:1 and there is no visible label other than the
  card line; the sr-only label is fine for screen readers · fix: darken the placeholder to >=3:1 (e.g. #7d8a78) in the base rule, together
  with the /cerita "WWWWWW" clipping fix (T-005) since both touch the shared JoinGame · low.
- [D-18] Homepage phone type scale · it still renders 8 distinct sizes (38/20/18/17/15/14/12/11); T-003 added none, the extras are
  pre-existing (Mode Cerita title 18, Masuk label 17) · fix: fold 18 -> 20 or 17 -> 15 when T-004 restyles the CTAs · low.
- [D-19] Mode Cerita card at 360-390px · the intro line wraps to 4 lines because "Mulai" takes a column, and the portrait floats
  vertically centred against it (visible just above the banner in the 390 screenshot) · fix: stack "Mulai" under the text on phones or
  top-align the portrait, as part of T-004's CTA pass (the card must stay one Link) · low.
- [D-20] zh headline · second line "挑大梁？" looks ~18px left of centre against "准备好" because of the full-width question mark; id/en are
  fine · fix: none needed; if it bothers QA, drop the trailing glyph from the centring box with a negative `margin-right: -.5em` on that span
  under `.lp-halaman` · low.

### Not verified by me (QA covers)
DPR 1/3 on real devices (Fullstack's emulation says identical, I checked DPR 2 only), the banner "Gabung" -> code fill + Masuk focus
behaviour end to end, `npm run test:client` / `test:e2e` (Fullstack's logs show 724/724 and 0 failures; I did not re-run them).

---

## T-004 — spec (2026-11-15)

Author: Designer · Status: spec for Fullstack (step 1/3) · No source edited · **No Claude Design mockup needed**: the hero is specified in
words plus tested SVG/CSS (see below), so there is no cost for Lead to approve.
Scope (binding, owner): hero + call to action only. Fonts, card system, sounds, colours stay. Everything here is under `.lp-halaman`.
Inputs: team/specs/2026-11-15-homepage.md (T-004, N-1, N-3, N-5), team/REVIEW.md (rev 2 re-review, T-003 code review: the T-003 frame
`.lp-kota-bingkai` is "a sound T-004 phone sprite viewport"), my T-003 spec/review (D-02, D-18, D-19), client/src/game/KarakterTokoh.tsx,
game/tokoh.ts, game/tokoh.css, art/Raki.tsx, art/WelcomeArt.tsx, theme.css.
Tested art + generator: `team/specs/T-004-hero-art.txt` (documentation, not repo code). Tested CSS: D-35 below.

**How this was checked.** Same method as T-003: dev client :5233, headless Chrome over CDP, scene + CSS injected into the live homepage (nothing
saved to the repo), measured and screenshotted at DPR 1 / 1.5 / 2 / 3 on 360x740, plus 390x844, 430x932, 375x667, 360x600, 320x640, tablet 800x1024,
desktop 901x720, 1024x768, 1280x800; id/en/zh x profile on/off; reduced-motion matrix; Raki fallback; Mode Cerita card. Numbers below are measured.

### What the sprite really is (corrects the brief's wording)
`SpriteTokoh({tokoh:'missRaksa', lambai})` is a 4-frame pixel sheet, each frame 61x184 art pixels. The "wave" is a Thai-style greeting:
palms pressed together at the chest (frames 1-2, with a blink), 6 s loop, stepped (tokoh.css `tokoh-sambut-mr`). The palms are rows 62-92 of 184.
It is shown at `floor(DPR)` device pixels per art pixel, so it is **61x184 CSS px at DPR 1, 2 and 3** (measured), smaller at fractional DPR
(1.5 -> 41x123). It never exceeds 184 px, which is why the 144 px frame must crop it (N-1).

### Spec lines

- [D-21] Hero concept and composition · The hero stops being "a city illustration" and becomes a small game scene: **Miss Raksa greets you from
  the Layanan Klaim service counter**, with a pixel skyline and the brand's yellow sun disc behind her. It reads as an NPC at her post, ties to her
  title (Claims Officer) and to the product, and gives the crop a natural reason (the counter hides her legs). Replaces the current `.lp-kota-gambar`
  city SVG (remove it). Layers inside the existing frame `.lp-kota-bingkai`, back to front: (1) backdrop SVG `.lp-latar`: stepped pixel sun disc
  (r=56, 4px steps), left tower, small house with salmon roof, office tower with antenna, low block, pixel tree, two pixel clouds; (2) the sprite in
  `.lp-kota-slot`; (3) counter + props SVG `.lp-meja` drawn OVER the sprite: cream counter top, green front with 4px grooves every 36px, a claim
  folder (left) and a potted plant (right) standing on it. The frame is the "stage": 1px `#e2d6ad` border, radius 16 (existing `--radius-l`), fill
  `#FBEFD0` (both already used by `.tokoh-potret` in tokoh.css), `overflow:hidden`, `box-sizing:border-box` so the T-003 height cap stays exact.
  All fills are hexes already in art/WelcomeArt.tsx (sun #F7D45B, pale green #D8E8D9, glass #6CA887, salmon #E7946E, ink #214C3C, cream #FCF8EB,
  green #287451, house #FFF8E8). No new colours, no gradient, glow, blur, or emoji; no text drawn in the art (i18n-safe). Art uses
  `shape-rendering="crispEdges"`. The greeting bubble stays OUTSIDE the frame, unchanged markup and text (N-1). Priority: high.

- [D-22] Sprite crop (answers N-1) · Render `<SpriteTokoh tokoh="missRaksa" tinggi={120} lambai />` (120 is deliberately below native height so the shared
  `floor(DPR)` minimum in tokoh.ts decides the scale; do NOT pass a bigger `tinggi`, do NOT touch tokoh.ts/tokoh.css sizing). Position it **top-anchored**:
  slot `top: calc(100% - 136px)`, so the head top is 6 px under the frame's inner top at 144 px tall (and the same distance above the counter at every
  frame height, because everything is anchored to the bottom). The counter is 34 px tall, so the visible window is rows 0-~101: head, shoulders, the
  palms-together greeting and the jacket down to the hips. Her legs and shoes are hidden behind the counter, never clipped mid-shin. At 144 px the
  palms (rows 62-92) sit at y 68-98 and the counter top at y 108, i.e. 10 px clear at DPR 1/2/3. Horizontal: `.lp-kota-slot` is a full-width flex row
  with `justify-content:center; padding-right:48px`, so she stands 24 px left of centre (she faces right, toward the tower). Measured at 360x740:
  sprite 125.5-186.5 x 85-269 (61x184), frame 20-340 x 78-222. DPR 1 / 2 / 3 identical; DPR 1.5 renders 41x123 (smaller, same place, still reads well);
  browser zoom below 100% makes her bigger and hides a bit more of her torso behind the counter (accepted, the head stays visible because of the top anchor).
  Priority: high.

- [D-23] Accessibility of the hero · Put `aria-hidden="true"` on `.lp-kota-bingkai` (like the current svg): the scene is decoration and Miss Raksa's
  name and title are already read from the bubble; this also silences the SpriteTokoh `role="img"` label so she is not announced twice. The small portrait in
  the bubble is already hidden. Nothing in the frame is focusable. Reading order is unchanged from T-003 (hero, greeting, eyebrow, h1, Join, Mode Cerita).
  Priority: med.

- [D-24] Sizes by breakpoint · (the scene is drawn once at 420x190 user units and shown at 1:1 CSS px, bottom-anchored, centred, clipped by the frame)
  - <=359 px wide, portrait <620 px tall, or legacy-banner pages <700 px tall: frame hidden (unchanged T-003 D-04). Landscape <=500 tall and <=900 wide:
    whole `.lp-seni` hidden (unchanged T-003 D-08).
  - 360-700 portrait: frame = 100% of `.lp-seni` (max 420) x `min(40vw,190px)` = 144 @360, 156 @390, 172 @430, 190 from 475 px (T-003 cap, unchanged).
    Taller frames just show more sky above her; the clouds sit above y=46u on purpose so they only appear when the frame is >=173 px tall.
  - 701-900 tablet: single column, hero first, `.lp-seni` width `min(420px,100%)` (T-003), frame **420 x 190** (exactly the scene, nothing cropped).
    Measured 800x1024: frame 182.5-602.5 x 114-304, Masuk bottom 778 (was 921 with the 333 px city art).
  - >=901 desktop: grid placement unchanged from T-003 (hero in the right column, text left). Frame = column width (512 at 1280) x **380**; backdrop and
    counter SVGs are drawn at 2x (840x380, 840x108) and centred (on narrow desktops 901-1100 the scene is simply cropped on both sides and still reads: checked at
    901 and 1024); the sprite is scaled with CSS `transform: scale(2); transform-origin: 50% 0` (pixel-exact because device px per art px becomes 2 x floor(DPR);
    no JS viewport switch needed), slot `top: calc(100% - 272px); padding-right: 96px`. Measured at 1280x800: sprite 122x368 at DPR 1/2/3 (81x245 at 1.5).
    The text column is untouched (h1 y 141-261, Masuk 458-515 exactly as before T-004). The right column is about 26 px shorter than today's art (380 vs 406).
  Priority: high.

- [D-25] Fallback when `TOKOH.missRaksa.aktif` is false (R-04) · Same stage, backdrop and counter; Raki replaces the sprite: `<Raki size={88} mood="sapa" />`
  inside `.lp-kota-slot.lp-kota-slot-raki` (`top:auto; bottom:27px`, same `padding-right` as the sprite so he stands in the same spot, feet overlap the counter top by
  ~2 px). Desktop: same slot, `svg{width:176px;height:176px}` and `bottom:54px`. Raki keeps his own float animation (`anim-melayang`, 3.2 s); he is a smooth vector
  on a pixel scene, an accepted style mismatch for a fallback state. Bubble = slogan only: that is the existing WelcomeArt behaviour (name and portrait are only
  rendered when `miss` is true), keep it. The Mode Cerita card keeps its existing `PotretRaki`. Rendered and measured (360x740: Raki 112-200 x 103-191; 1280x800: 176 px).
  To test the flag off, Fullstack sets `TOKOH.missRaksa.aktif=false` locally in shared/brand.ts and reverts it (check both the hero and the card). Priority: high.

- [D-26] CTA treatment · homepage only (`.lp-halaman`), same copy, i18n keys, submit behaviour and Link navigation; "Mulai" stays a `<span>` inside the single card Link.
  Style = "chunky game button": a hard, zero-blur extrusion in the next darker brand tone, and a press that sinks it.
  - **Masuk** (`.lp-join-mulai`, yellow on the green Join card): `border:2px solid var(--kuning-tua); box-shadow:0 4px 0 var(--kuning-tua); font-size:15px;
    font-weight:700`; `:active:not(:disabled)` -> `transform:translateY(4px); box-shadow:0 0 0 var(--kuning-tua)`; 80 ms transform/box-shadow transition.
    The shadow falls into the card's own 16 px bottom padding, so no layout change (Masuk bottom stays 565.7 px at 360x740).
  - **Mulai** (`.lp-pintu-aksi`, dark green pill in the Mode Cerita card): `border:2px solid var(--hijau-tua); box-shadow:0 3px 0 var(--hijau-tua); font-weight:700`;
    pressed when the CARD is pressed: `.lp-pintu:active .lp-pintu-aksi{transform:translateY(3px); box-shadow:0 0 0 var(--hijau-tua)}` (the card keeps its own 1 px press).
  - Hover, focus ring and the error/pressed states of Join are unchanged. Hierarchy unchanged: Masuk is the one primary action (yellow on green, 56 px target);
    Mulai stays the quiet second. Tokens only, no gradient/glow/blur. These hard 0-blur extrusions are the ONLY new shadows and are an intentional exception to
    T-003's "no new shadows" because this task asks for a chunky CTA. /cerita Masuk stays as is (a known cross-page inconsistency until the later restyle). Priority: high.

- [D-27] No idle pulse (decision) · I recommend NOT adding the optional pulse. Masuk is not actionable until a valid code is typed (an empty press only shows the
  "code too short" error), so pulsing it would invite a failing tap; a pulse on Mulai would compete with Masuk (two primary actions). The motion budget is feedback only:
  press sink, the hero entrance, and the existing greeting loop. If the owner later wants a "ready" pop when the code becomes valid, it needs state in the shared
  JoinGame and belongs to a later ticket. Priority: med.

- [D-28] D-18 folded in (type scale) · Mode Cerita title 18 -> 20 px (`.lp-halaman .lp-pintu-judul`), Masuk label 17 -> 15 px / 700 (Mulai is already 15 / 700).
  Phone scale becomes 38 (h1) / 20 (Join title, code, card title) / 15 (button labels, bubble text) / 14 (card lines) / 12-11 (caption, eyebrow): the stray 17 and
  18 are gone. Applies at all widths (the rules are not media-scoped); on desktop the card title grows 18 -> 20 and still fits. Priority: low.

- [D-29] D-19 folded in (Mode Cerita card, <=700 px) · Make the card a 2-column grid: portrait top-left (spans both rows), title + line in column 2, "Mulai" under the line,
  left-aligned in column 2. CSS only (`.lp-pintu-cerita-solo`: `display:grid; grid-template-columns:auto 1fr; grid-template-areas:"potret teks" "potret aksi";
  column-gap:12px; row-gap:8px; align-items:start`; children get `grid-area`; `.lp-pintu-aksi{justify-self:start}`). The DOM order (portrait, text, Mulai) already equals the visual
  order, so reading order and the single accessible link do not change. Result at 360: the line wraps to 2 lines instead of 4, the portrait is aligned to the title, card height 139.5 px
  (was ~145). Tablet and desktop keep the one-row card. Priority: med.

- [D-30] Motion and reduced motion (N-3) · Inventory, everything else is static:
  1. Hero entrance: `.lp-kota-bingkai` only, `lp-masuk` 300 ms ease-out, once (opacity 0 -> 1, translateY 8 px -> 0). Text, Join and CTAs are never animated or delayed
     (product rule 9, "animation must not delay access").
  2. Sprite greeting: the existing `tokoh-sambut-mr` 6 s stepped loop (tokoh.css, already governed by its own reduced-motion rule). Raki fallback: existing `anim-melayang`.
  3. CTA press feedback: 80 ms transition (transform, box-shadow).
  One rule, existing shape, covers the hero frame, ALL its descendants and pseudo-elements (so the sprite, Raki's svg and any future ::before/::after) AND both CTAs with their
  pseudo-elements, setting `animation:none; transition:none` (D-35 block). It does not touch `data-gerak="penuh"`. Why it still matters although theme.css already has a blanket
  rule (lines 711-720: near-zero duration, one iteration): `animation:none` removes the single flash iteration and keeps the end state explicit.
  **Measured matrix (360x740, headless Chrome, emulated system setting x `?gerak=`):**

  | system | in-app | sprite | hero entrance | CTA transition | frame opacity |
  |---|---|---|---|---|---|
  | reduce | ikut (follow system) | none | none | ~0 | 1 |
  | reduce | penuh (animations on) | greeting loop | lp-masuk | 80 ms | ends at 1 |
  | no preference | ikut | greeting loop | lp-masuk | 80 ms | ends at 1 |
  | no preference | penuh | greeting loop | lp-masuk | 80 ms | ends at 1 |

  Note for QA: `?gerak=penuh` and `?gerak=ikut` are PERSISTED in localStorage; run `?gerak=ikut` to reset between cases; the in-app toggle button only appears when the
  system setting is "reduce". With reduce on, the hero must be fully visible (opacity 1), not stuck at the first keyframe. Priority: high.

- [D-31] Budget (N-5) · Measured on the injected art: new CSS 4.0 KB raw / 1.1 KB gzip; backdrop SVG 4.7 KB raw / 0.8 KB gzip; counter SVG 1.7 KB raw / 0.4 KB gzip; total about **2.1 KB gzip**
  (the JSX form may add 1-2 KB), far under 30 KB. **No new raster:** the Miss Raksa sheet (`/karakter/miss-raksa-besar.webp`, 7.1 KB; PNG fallback 46 KB) is already requested on `/`
  by the portraits (the greeting bubble and the Mode Cerita card use the same file through `.tokoh-potret-isi`), so SpriteTokoh adds 0 requests; `Raki` and `SpriteTokoh` are already in
  the Landing bundle. Forbidden: imports from cerita/ui/panggung/*, cerita/ui/latar/*, sumberPiksel.ts. **Fullstack must record in HANDOFF.md:** (a) `vite build` before/after gzip sizes of the
  Landing/index chunks and CSS (from the build report, or a response with a verified `Content-Encoding: gzip`, not an uncompressed preview transfer total), (b) the image-request list for `/` at
  360x740 with cache disabled before and after (expect identical, the sheet requested once), (c) the delta against the 30 KB gzip limit. Priority: med.

- [D-32] Fold budget re-measured with the sprite scene injected · The T-003 numbers hold, because the frame height is unchanged. **360x740, id/en/zh x profile absent/present (6 combos): Masuk bottom
  565.7 px in all (174 px spare), frame 78-222 (144 px), h1 78 px, no horizontal scroll, no element under 44 px.** Others: 390x844 577.7, 430x932 593.7, tablet 800x1024 777.9, 320x640 525.3
  (frame hidden), 375x667 and 360x600 421.7 (frame hidden by D-24), desktop 1280 Masuk 457.7-514.7 (same as before). The Join card, headline and greeting are not moved by anything in T-004.
  The legacy banner case is the same as T-003 (rules unchanged). Priority: high.

- [D-33] Anti AI-slop check · Pass. It reads as a RAKSA game screen: a pixel NPC at her post, brand yellow/green, her real sprite (not a stock illustration), a stage with a counter, no
  gradient/glass/glow, no emoji, copy unchanged, one primary action, animations are feedback/entrance only and respect reduced motion. The one new "card-like" surface is the stage frame and it is
  justified (it is the clip for the sprite, N-1). Watch items (low): the stepped sun disc is 4 px chunky next to the 1 px sprite pixels (deliberate, reads as "background resolution"; check it looks fine
  to the owner); the Raki fallback is a smooth vector on a pixel scene (accepted); at DPR 1.5 the sprite renders slightly irregular pixels (inherent to fractional DPR). Priority: low.

- [D-34] Constraints for Fullstack (binding) ·
  1. Files: `client/src/art/WelcomeArt.tsx` (replace the `<svg className="lp-kota-gambar">` with the scene; frame div + `aria-hidden`; `SpriteTokoh` from `../game/KarakterTokoh`,
     `Raki` from `./Raki`, both already in the bundle; figcaption/bubble markup and text untouched) and `client/src/player.css` (replace the T-003 `.lp-kota-bingkai`/`.lp-kota-gambar`
     phone rules with the D-35 block). Landing.tsx, JoinGame.tsx, i18n files, tokoh.ts, tokoh.css: NO changes.
  2. Every selector under `.lp-halaman`; /cerita and the shared JoinGame untouched (Join card, code field, Masuk on /cerita stay pixel-identical; check at 390).
  3. Keep the T-003 hide rules, landscape rule, frame cap and `.lp-seni` width rules exactly as they are (D-35 repeats them only so the block can be tested on its own).
  4. Art: use `team/specs/T-004-hero-art.txt` as the geometry source of truth (paste as JSX or port the generator); do not redraw by eye.
  5. Mode Cerita "Mulai" remains a span inside the single card Link; no nested button.
  6. No new colours, fonts, sounds, or raster assets; no JS viewport switch for the sprite size (CSS scale(2) on desktop).

- [D-35] Tested CSS (replaces the T-003 phone rules for `.lp-kota-bingkai` / `.lp-kota-gambar`; keep all other T-003 rules) ·

```css
/* ---- T-004 hero scene (frame = .lp-kota-bingkai from T-003) ---- */
.lp-halaman .lp-kota-bingkai { position: relative; display: block; box-sizing: border-box; width: 100%; border: 1px solid #e2d6ad; border-radius: 16px; background: #FBEFD0; overflow: hidden; animation: lp-masuk .3s ease-out both; }
@keyframes lp-masuk { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.lp-halaman .lp-latar, .lp-halaman .lp-meja { position: absolute; left: 50%; margin-left: -210px; display: block; max-width: none; }
.lp-halaman .lp-latar { bottom: 0; width: 420px; height: 190px; }
.lp-halaman .lp-meja { bottom: 0; width: 420px; height: 54px; }
.lp-halaman .lp-kota-slot { position: absolute; left: 0; right: 0; top: calc(100% - 136px); display: flex; justify-content: center; padding-right: 48px; pointer-events: none; }
.lp-halaman .lp-kota-slot-raki { top: auto; bottom: 27px; }
.lp-halaman .lp-kota-slot .tokoh-sprite { flex: 0 0 auto; }
@media (min-width: 701px) and (max-width: 900px) { .lp-halaman .lp-kota-bingkai { height: 190px; } }
@media (min-width: 901px) {
  .lp-halaman .lp-kota-bingkai { height: 380px; }
  .lp-halaman .lp-latar { margin-left: -420px; width: 840px; height: 380px; }
  .lp-halaman .lp-meja { margin-left: -420px; width: 840px; height: 108px; }
  .lp-halaman .lp-kota-slot { top: calc(100% - 272px); padding-right: 96px; }
  .lp-halaman .lp-kota-slot .tokoh-sprite { transform: scale(2); transform-origin: 50% 0; }
  .lp-halaman .lp-kota-slot-raki { top: auto; bottom: 54px; }
  .lp-halaman .lp-kota-slot-raki svg { width: 176px; height: 176px; }
}
@media (max-width: 700px) { .lp-halaman .lp-kota-bingkai { display: block; height: min(40vw, 190px); } }
@media (max-width: 359px) { .lp-halaman .lp-kota-bingkai { display: none; } }
@media (max-width: 700px) and (orientation: portrait) and (max-height: 619px) { .lp-halaman .lp-kota-bingkai { display: none; } }
@media (max-width: 700px) and (max-height: 699px) { .lp-halaman.alur-ada-spanduk .lp-kota-bingkai { display: none; } }
@media (max-width: 900px) and (orientation: landscape) and (max-height: 500px) { .lp-halaman .lp-seni { display: none; } }

/* ---- CTA ---- */
.lp-halaman .lp-join-mulai { border: 2px solid var(--kuning-tua); box-shadow: 0 4px 0 var(--kuning-tua); font-size: 15px; font-weight: 700; transition: transform 80ms ease-out, box-shadow 80ms ease-out; }
.lp-halaman .lp-join-mulai:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 var(--kuning-tua); }
.lp-halaman .lp-pintu-aksi { border: 2px solid var(--hijau-tua); box-shadow: 0 3px 0 var(--hijau-tua); font-weight: 700; transition: transform 80ms ease-out, box-shadow 80ms ease-out; }
.lp-halaman .lp-pintu:active .lp-pintu-aksi { transform: translateY(3px); box-shadow: 0 0 0 var(--hijau-tua); }
.lp-halaman .lp-pintu-judul { font-size: 20px; }
@media (max-width: 700px) {
  .lp-halaman .lp-pintu-cerita-solo { display: grid; grid-template-columns: auto 1fr; grid-template-areas: "potret teks" "potret aksi"; column-gap: 12px; row-gap: 8px; align-items: start; }
  .lp-halaman .lp-pintu-cerita-solo .lp-pintu-potret { grid-area: potret; }
  .lp-halaman .lp-pintu-cerita-solo .lp-pintu-teks { grid-area: teks; }
  .lp-halaman .lp-pintu-cerita-solo .lp-pintu-aksi { grid-area: aksi; justify-self: start; }
}

/* ---- Motion: same shape as player.css:198 / tokoh.css:87, covers hero + descendants + CTAs incl. pseudo-elements ---- */
@media (prefers-reduced-motion: reduce) {
  :root:not([data-gerak="penuh"]) .lp-halaman .lp-kota-bingkai,
  :root:not([data-gerak="penuh"]) .lp-halaman .lp-kota-bingkai *,
  :root:not([data-gerak="penuh"]) .lp-halaman .lp-kota-bingkai *::before,
  :root:not([data-gerak="penuh"]) .lp-halaman .lp-kota-bingkai *::after,
  :root:not([data-gerak="penuh"]) .lp-halaman .lp-join-mulai,
  :root:not([data-gerak="penuh"]) .lp-halaman .lp-join-mulai::before,
  :root:not([data-gerak="penuh"]) .lp-halaman .lp-join-mulai::after,
  :root:not([data-gerak="penuh"]) .lp-halaman .lp-pintu-aksi,
  :root:not([data-gerak="penuh"]) .lp-halaman .lp-pintu-aksi::before,
  :root:not([data-gerak="penuh"]) .lp-halaman .lp-pintu-aksi::after { animation: none; transition: none; }
}
```

  Markup for the frame (WelcomeArt.tsx), geometry from `team/specs/T-004-hero-art.txt`:
  `<div className="lp-kota-bingkai" aria-hidden="true">{backdrop svg .lp-latar}<div className="lp-kota-slot">{sprite}</div>{counter svg .lp-meja}</div>`
  where the sprite slot holds `<SpriteTokoh tokoh="missRaksa" tinggi={120} />` when `miss` is true (`lambai` is already the default), and when `miss` is false the slot is
  `<div className="lp-kota-slot lp-kota-slot-raki"><Raki size={88} mood="sapa" /></div>` instead (render ONE slot, not both). Priority: high.

### Sketch: phone hero frame at 360x740 (320 x 144 px; counter and props are drawn over the sprite)

```
 y=0   +--------------------------------------------------------------+  frame: 1px #e2d6ad, radius 16, bg #FBEFD0
       |  (stepped sun disc r56 behind her)                [antenna]  |  clouds only if the frame is >=173px tall
 y=6   |  [ tower ]       ####   sprite head top (6px)     +-------+  |
       |  [ left  ]      ######  61px wide, 24px left     | tower |  |
       |  [ windows]     ######  of centre, faces right   | 4x5   |  |
       |  /roof/ salmon   ####                            | win-  |  |
       |  [ house ]      jacket / shoulders               | dows  |  |
 y=68  |  [ door  ]   palms together (rows 62-92)  [plant]|       |  |   <- greeting pose, 10px clear of the counter
 y=98  |  folder         hips                       pot    |       |  |
 y=108 |==================== cream counter top (6px) ====================|  legs and shoes below this line are HIDDEN
       |##|####|####|####|####|####|####|####|####|####|####|####|##|  green counter front 34px, 4px dark grooves every 36px
 y=142 +--------------------------------------------------------------+  (inner bottom of the frame)
        [portrait] Miss Raksa . Layanan Klaim          <- greeting bubble: OUTSIDE the frame, normal flow, 8px below
                   anytime anywhere with our smile
```

Fold budget at 360x740 (unchanged from T-003): header 78 + frame 144 + gap 8 + greeting 60 + eyebrow/gap 32 + h1 78 + gap 12 + Join 165 -> Masuk bottom 565.7 of 740 (174 px spare).

### Review checklist for step 3 (Designer review) and QA
- 360x740, id/en/zh, profile absent/present: Masuk bottom <= ~570, complete code input visible; frame 144 px; sprite shows head to hips behind the counter; no horizontal scroll; no tap target < 44 px.
- DPR 1, 2, 3 (real devices or DevTools): sprite 61x184 CSS px (desktop 122x368), crisp pixel edges, palms (greeting frame) visible above the counter, no clipped legs/shins, greeting bubble outside the frame.
- Fractional DPR (1.25 / 1.5) and browser zoom 80% / 125%: head always visible, nothing overlaps the bubble.
- Widths 360, 390, 430, tablet 800, desktop 901, 1024, 1280; landscape 844x390 / 740x360 hero hidden; frame hidden at 320, at <620 tall portrait, and on banner pages <700 tall (T-003 rules unchanged).
- Flag off (`TOKOH.missRaksa.aktif=false`): Raki stands on the counter in the same spot, the bubble shows the slogan only, the Mode Cerita card still shows `PotretRaki`; revert the flag afterwards.
- Motion matrix from D-30 with `?gerak=penuh` / `?gerak=ikut` (persisted; reset with `ikut`): reduce + ikut = no animation and the hero fully visible; the Raki fallback float also stops.
- CTA: Masuk and Mulai sink on press and return on release; Join still submits; Mulai is still one link; the keyboard focus ring is visible; Masuk label 15 px, card title 20 px.
- Mode Cerita card at 360/390: grid layout (D-29), still one Link, reading order unchanged.
- `/cerita` hub at 390: pixel-identical to before (JoinGame untouched: code field 22 px / .2em, Masuk 17 px, no shadow).
- Desktop 1280: text column identical to before except the card title (20 px) and the CTA style.
- Budget numbers recorded in HANDOFF.md (D-31): gzip delta <= 30 KB from build output, 0 new image requests.
- `npm run test:client` and `npm run test:e2e` pass.

---

## T-004 — review (2026-11-15)

Reviewer: Designer · Build reviewed: Fullstack's dev client on :5233 (API server up, so a real open-room legacy banner was showing in many of my runs) ·
No source edited.
Method: read team/HANDOFF.md T-004, my spec D-21..D-35 and team/specs/T-004-hero-art.txt; diffed WelcomeArt.tsx and player.css against
team/evidence/T-004/base/ (Landing.tsx unchanged, as claimed); then measured and screenshotted the REAL page (no injection this time) with headless Chrome over CDP
at DPR 1 / 1.5 / 2 / 3 on 360x740, plus 390, 430, 375, 320, 360x600, tablet 800, desktop 901 / 1024 / 1280, landscape 844x390 / 740x360; id/en/zh, profile on/off;
real mouse presses for the CTA states; the reduced-motion matrix; /cerita; the legacy banner.

### Verdict: PASS

The build matches the spec. No blockers, nothing high or medium. Four low polish items below, none needs to hold T-004 (one is a defect in my own art).

### Checklist results (all measured live)
- **Geometry vs T-004-hero-art.txt:** the port is 1:1. I compared every rect list in WelcomeArt.tsx (clouds, sun disc path, left tower, house/roof, office tower + antenna,
  low block, tree, counter, 12 grooves, folder, plant) with the generator: identical coordinates and draw order (clouds, sun, skyline, sprite, counter). Frame 1px #e2d6ad,
  radius 16, fill #FBEFD0.
- **Sprite crop:** 61x184 CSS px at DPR 1, 2 and 3 at the same position (125.5-186.5 x 85-269); DPR 1.5 renders 40.6x122.7. The counter top is at y 187, the palms
  (rows 62-92) at y 147-177, so the greeting pose clears the counter by 10 px; legs and shoes are hidden, never cut mid-shin. I froze the greeting frame at DPR 1 and 2 and
  zoomed: crisp nearest-neighbour pixels, `image-rendering: pixelated` confirmed in computed style.
- **A11y / structure:** `.lp-kota-bingkai` has `aria-hidden="true"`; the greeting bubble is outside the frame and its markup/text is unchanged (diff shows the figcaption
  untouched). DOM order of the key nodes: frame, bubble, eyebrow, h1, Join title, code field, Masuk, Mode Cerita card (unchanged from T-003).
- **Desktop 1280 (scale(2)):** frame 512x380, sprite 122x368 at DPR 1 / 2 / 3 (81x245 at 1.5), crisp, standing in front of the sun with the counter at the frame bottom; the text
  column is unchanged (h1 y 141-261, Masuk 457.7-514.7). Looks intentional, not blurry. 901 and 1024: the scene is centre-cropped (house and tower partly cut), still reads well.
- **Tablet 800x1024:** frame 420x190 shows the whole scene, Masuk bottom 777.9, crisp.
- **Fold at 360x740, id/en/zh x profile absent/present (6 combos): Masuk bottom 565.7 in all (174 px spare),** frame 20-340 x 78-222, greeting 230-290, h1 2 lines, no horizontal
  scroll, no tap target under 44 px. Also 390 -> 577.7, 430 -> 593.7, 375x667 -> 571.7 with no banner (frame shown) and 421.7 when the legacy banner is present (the T-003 banner rule hides the frame, banner top 593, Masuk not
  covered), 320x640 -> 525.3 and 360x600 -> 421.7 (frame hidden by the T-003 rules).
- **CTA:** Masuk = 2px #D8A41F border (`--kuning-tua`), hard `0 4px 0` shadow, 15px/700; Mulai = 2px `--hijau-tua` border, `0 3px 0`, 15px/700. Real mouse press: Masuk sinks 4 px
  (transform translateY(4), shadow 0), returns on release; pressing the Mode Cerita card sinks Mulai 3 px and the card 1 px; releasing outside does not navigate or submit.
  **No pulse:** every animation name on the Join card, Masuk, the card and Mulai is `none`; the only animations on the page are the hero entrance and the sprite loop. No glow,
  no blur, no gradient on the new CSS.
- **Mode Cerita card at 360 / 390 / 430:** CSS grid, portrait top-left, title + 2-line text, "Mulai" under the text; card 139.5 px tall; the card is ONE `<a>` with 0 nested
  links/buttons and "Mulai" is a `<span>`; DOM order equals visual order.
- **Type scale (D-28):** card title 20 px, Masuk label 15 px (Mulai 15 px, bold); the stray 17 and 18 are gone on the homepage.
- **Motion (measured, 360x740):** system reduce + `?gerak=ikut`: sprite none, hero none, CTA transition ~0, frame opacity 1 (hero fully visible, not stuck at the first keyframe);
  reduce + penuh: sprite loop + `lp-masuk` + 80 ms CTA transition; no-preference + ikut: all on. The entrance runs once (300 ms) on the frame only; text, Join and CTAs are never delayed.
- **Anti AI-slop (ROLE-DESIGNER.md):** pass. Flat brand palette, no new colours, no gradient/glass/glow, real RAKSA sprite, no emoji, copy untouched, one primary action (yellow Masuk),
  purposeful motion only. It reads as a RAKSA game screen: a pixel NPC greeting from the claims counter, not a SaaS hero.
- **T-003 / T-005 / T-006 regressions:** none. `/cerita` hub: no `.lp-halaman`, Masuk still 17px/600 with no shadow and a 1px border (old style, accepted in D-26), code field 20px /
  1.6px tracking (the T-005 fix, shared), no horizontal scroll; Fullstack's before/after PNG md5s are identical too. T-006: with the real banner at 844x390 and 740x360 the banner is a
  top pill (y 10-64) and Masuk/code (bottom 334) are not covered; 360x740 and 375x667: not covered.
- **Flag-off evidence (QA owns it, I only looked):** Raki stands on the counter at the same spot, bubble = slogan only, Mode Cerita card shows the owl portrait.

### Fix list: blockers (high)
None.

### Fix list: should schedule (med)
None.

### Polish (low), non-blocking
- [D-36] Homepage hero art, left tower · its right-hand window column runs into the tower's dark outline (windows(34,108,4,3) puts the 4th column at x 70-78 inside a box whose
  inner edge is x 76); visible on tablet and as a nick on the left edge at phone width · fix: use 3 columns, `windows(34, 108, 3, 3)` in WelcomeArt.tsx `LATAR_KOTA` (and in
  team/specs/T-004-hero-art.txt); margins become 10 px each side · low. This is an error in my own generator, not in Fullstack's port.
- [D-37] Homepage hero · the sprite keeps the shared `filter: drop-shadow(0 6px 0 rgba(23,54,42,.10))` from tokoh.css, which paints a faint darker-yellow offset shape over the
  sun behind her torso (visible in the DPR 1 zoom) · fix: under `.lp-halaman .lp-kota-slot .tokoh-sprite` set `filter: none` (scoped, so no other page changes) for a cleaner pixel
  silhouette · low. Pre-existing shared style, not a new shadow.
- [D-38] Homepage, flag-off fallback only · with Miss Raksa inactive the portrait is hidden but the bubble keeps its left-pointing tail, so it points at empty space and the
  bubble sits flush left · fix: under `.lp-halaman`, hide `.lp-kota-balon::before` when no portrait is rendered (e.g. add a modifier class in WelcomeArt when `!miss`) · low. Pre-existing
  behaviour, only visible with the flag off.
- [D-39] Homepage 320x568 with the legacy banner · Masuk (bottom 501, stacked form) is still ~7 px under the banner (banner top 494); the code field (bottom 435) is clear; scrollable
  · fix: tighten the 320 stacked layout by 8 px under `.lp-halaman.alur-ada-spanduk` at `max-width:359px` (e.g. `.lp-join{gap:10px}` or a 12 px card padding) · low. Legacy mode and
  the smallest phone only; it is the remainder of T-003 D-16/T-006, not caused by T-004.

### Not verified by me (QA / Codex)
Flag-off render myself (evidence screenshots only), real DPR devices and fractional DPR / browser zoom, the `vite build` gzip numbers (Fullstack reports +0.42 KB total, far under 30 KB;
image requests unchanged, the sprite sheet once), `npm run test:client` / `test:e2e` (their logs show 724/724 and 0 failures; I did not re-run them).
