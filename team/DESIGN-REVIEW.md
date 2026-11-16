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

---

## T-008 — spec (2026-11-15)

Author: Designer · Status: spec for Fullstack (step 1/3) · No source edited · no mockup (small change) · no copy/i18n change · no new colours · every rule under `.lp-halaman`,
`/cerita` untouched.
Inputs: team/evidence/T-008/owner-shot-1-ok.png and owner-shot-2-off.png (studied first), Lead's analysis (items 1-4, verified below), team/HANDOFF.md T-004/T-007, my T-003/T-004
specs and reviews, client/src/player.css (lp-* rules), art/WelcomeArt.tsx, pages/Landing.tsx. Coordinator note: owner confirmed shot 2 came from the desktop browser's device
toolbar, so item 4 is kept short.

**How this was checked.** Same method as before: dev client :5233, headless Chrome over CDP, the proposed CSS and the edited art injected into the live page (nothing saved to the
repo), measured and screenshotted before/after at 360x740, 390x844, 800x1024, 1280x800 (and 320, 375, 412, 430 where noted); id/en/zh. Numbers are measured.

### What the owner's screenshots show
Every red arrow points at the RIGHT end of a block: hero frame, greeting bubble, headline, Join card, Mode Cerita card. Reading the two shots against the live layout, the page
has three horizontal problems, all on the right side or on the centre line: (1) the greeting bubble stops short of the right edge that the frame and cards share (ragged edge);
(2) the sprite stands 24 px LEFT of the page's centre line while the eyebrow and headline are centred, so the hero and the headline do not share an axis; (3) the header content
sits 2 px further in than the page content. None of it is a vertical problem.

### Verdicts on Lead's four items

- [D-40] Item 1 (ragged right edge) · **Confirmed and fixed.** The frame and both cards span the column, `.lp-kota-balon` shrinks to its text. Fix: `flex: 1 1 auto; max-width: none`
  at <=900 px (phone and tablet, where the greeting sits in a 320-420 px column). Measured: bubble right edge 325.3 -> 340 at 360 (gap to the frame edge 14.7 -> 0); 325.3 -> 370 at 390
  (gap 44.7 -> 0); 523.1 -> 602.5 at tablet 800 (gap 79.4 -> 0). Bubble height unchanged (58.4 px, row 60 px) in id/en/zh at 360/390/430/800; at 320 (hero hidden, greeting still shown) the bubble
  already filled the row (92-300) and still wraps to 3 text lines, unchanged. The tail (`::before`, left -7 px, vertically centred) stays attached to the portrait, no change needed. The
  flag-off bubble (`lp-kota-balon-tanpa-potret`, no portrait, no tail) also simply spans the full width. Desktop (>900) keeps its 340 px bubble (optional later: the same rule, but the
  desktop bubble would then be 415 px wide around one short line, so I leave it). Priority: high.

- [D-41] Item 2 (hero not tied to the greeting) · **My call: NOT (a) sprite in the left third, NOT (b) centre the greeting row. Put the sprite on the page's centre axis and let the
  full-width bubble be the dialogue box under the stage.** I tested both of Lead's options in the live page:
  - (a) sprite moved over her portrait (variant tested): with the current art she collides with the house, her hands hit the folder, the sun half-leaves the frame, the middle of the scene is empty,
    and an exact tie to the portrait is impossible (the portrait's centre is 30 px from the frame edge; the sprite is 61 px wide, so she would sit flush against the frame's border). The portrait is also
    the same face as the sprite, so tying them vertically adds nothing.
  - (b) centred greeting row (variant tested): the group floats, margins become irregular (7 px at 360, 22 px at 390) and it still does not line up with the cards.
  - **Chosen:** the page already has two hard edges (left x=20, right x=gutter) and one axis (the centred eyebrow and headline). Make the hero obey all three: sprite and sun centred on the axis
    (sprite centre x 156 -> 180 at 360, 171 -> 195 at 390, now equal to the frame, eyebrow and h1 centres), bubble to the right edge (D-40). The stage frame and the bubble now read as one
    "scene + dialogue box" unit: same width, 8 px apart, portrait at the left edge like the cards' portraits. Eye path: sprite (axis) -> bubble -> eyebrow/headline (same axis) -> Join.
  Priority: high.

- [D-42] Art edits that go with D-41 (geometry source of truth: team/specs/T-004-hero-art.txt, update it too) · Moving her to the axis means the scene has to be symmetric around x=210:
  1. Sun disc `disc(186, 112, 56)` -> `disc(210, 112, 56)` (centred behind her head; WelcomeArt.tsx `MATAHARI`).
  2. Delete the backdrop tree (the line `...r(236, 128, 4, 28, INK), ...r(226, 114, 24, 8, GLASS), ...r(222, 122, 32, 8, GLASS), ...r(228, 130, 20, 6, GLASS),` in `LATAR_KOTA`): she now stands where it was.
  3. Move the counter plant right by 16 u in `MEJA`: `r(232,12,16,10)`, `r(234,14,12,8)`, `r(236,0,8,4)`, `r(230,4,20,6)`, `r(234,10,12,2)` -> x = 248, 250, 252, 246, 250 (same y/w/h/colours). It now stands between her arm and the office tower.
  4. Cloud: `cloud(318, 26)` -> `cloud(318, 14)` (removes the 2 px cloud sliver that peeked at the top edge of the frame at about 385-400 px wide; measured clean at 375, 390, 412; at 430 the cloud shows cropped by the frame top, which is natural).
  5. CSS: remove `padding-right: 48px` from `.lp-halaman .lp-kota-slot` and `padding-right: 96px` from its desktop override (T-004 rules) so the slot centres the sprite; the Raki fallback uses the same slot, so he is centred too.
  Sprite size, crop, counter, frame height, hide rules are unchanged (D-22/D-24). Desktop and tablet get the centred sprite and the new scene as well (the art is shared): measured sprite centre =
  frame centre at 800 (392.5) and 1280 (916.5). Priority: high.

- [D-43] Item 3 (vertical rhythm) · **No vertical change.** Measured block gaps (frame -> greeting -> eyebrow -> headline -> Join) are 8 / 16 / 12 px at 360 and 390 and do not change when the
  bubble goes full width. 8 px keeps stage and dialogue box together as one unit; 16 px separates the greeting from the headline block; 12 px keeps the headline attached to the Join card it
  introduces. I tested 16 px under the headline (+4 px, Masuk bottom 569.7 at 360): it makes the headline float away from Join and uses the whole fold margin, so rejected. Fold stays:
  **Masuk bottom 565.7 at 360x740 and 577.7 at 390x844** (174 and 266 px spare), identical before and after. Priority: med.

- [D-44] Header alignment (small, found while checking item 4) · `.player-header` insets its content by 22 px (player.css line 170, <=700) while the page content is inset 20 px, so the logo
  and the sound button sit 2 px inside the card edges. Fix, homepage only, <=700 px: `.lp-halaman .player-header { padding-left: 20px; padding-right: 20px; }`. Measured: logo left 22 -> 20,
  sound-button right gap 22 -> 20, equal to the cards. Do NOT apply this on tablet: there the content is a centred 560 px column, so the header cannot align with it. Priority: low.

- [D-45] Item 4 (left shift in the owner's shot 2) · **Confirmed: scrollbar only, no real asymmetry.** Measured with a non-mobile window with a classic scrollbar (innerWidth 375,
  clientWidth 360, scrollbar 15 px): frame gap left 20 / right 20, Join card left 20 / right 20, header padding 22 / 22, `.lp-utama` padding 20 / 20, logo 22 from the left, sound button
  22 from the right (of the content box). With mobile emulation (overlay scrollbar, 390): scrollbar 0 px, same symmetric gaps. The 15 px extra on the right of shot 2 is the desktop browser's classic
  scrollbar track taking the right edge of the window; a real phone shows none. The only real mismatch is the symmetric 2 px of D-44. No `margin`/`padding` asymmetry exists in the lp-* or header rules.
  Priority: n/a (finding).

- [D-46] Constraints for Fullstack (binding) ·
  1. Files: `client/src/art/WelcomeArt.tsx` (D-42 items 1-4), `client/src/player.css` (D-47 block; remove the two `padding-right` declarations named in D-42.5), `team/specs/T-004-hero-art.txt` (update
     generator and the static blocks A/B to the new geometry). Landing.tsx, JoinGame.tsx, i18n, tokoh.ts/css: no change.
  2. Every selector under `.lp-halaman`; `/cerita` unchanged (check 390). No new colours, no copy change, no new animation.
  3. Keep T-003/T-004/T-007 behaviour: frame cap, hide rules, aria-hidden frame, greeting outside the frame, flag-off Raki, reduced-motion block.

- [D-47] Tested CSS (add after the T-004 hero block; plus the two deletions in D-42.5) ·

```css
/* T-008: the greeting bubble spans to the frame's right edge (phone + tablet column) */
@media (max-width: 900px) { .lp-halaman .lp-kota-balon { flex: 1 1 auto; max-width: none; } }
/* sprite (and Raki) centred on the page axis: delete padding-right:48px from .lp-halaman .lp-kota-slot and padding-right:96px from its >=901 override */
@media (max-width: 700px) { .lp-halaman .player-header { padding-left: 20px; padding-right: 20px; } }
```

### Before / after (measured, headless Chrome, DPR 2; x in CSS px)

| 360x740 | before | after |
|---|---|---|
| frame (left-right) | 20-340 | 20-340 |
| bubble right edge (gap to frame edge) | 325.3 (14.7) | 340 (0) |
| sprite centre x / frame centre / h1 centre | 156 / 180 / 180 | 180 / 180 / 180 |
| portrait centre x | 50 | 50 (left aligned with the cards, as intended) |
| logo left / sound right gap (cards at 20) | 22 / 22 | 20 / 20 |
| gaps frame -> greeting -> eyebrow -> headline -> Join | 8 / 16 / 12 | 8 / 16 / 12 |
| Masuk bottom (spare to 740) | 565.7 (174.3) | 565.7 (174.3) |

| 390x844 | before | after |
|---|---|---|
| bubble right edge (gap to frame edge) | 325.3 (44.7) | 370 (0) |
| sprite centre x / frame centre | 171 / 195 | 195 / 195 |
| logo left / sound right gap | 22 / 22 | 20 / 20 |
| Masuk bottom (spare to 844) | 577.7 (266.3) | 577.7 (266.3) |

Tablet 800x1024: bubble right gap 79.4 -> 0, sprite centre 368.5 -> 392.5 (= frame centre), Masuk bottom 777.9 unchanged. Desktop 1280x800: sprite centre 868.5 -> 916.5 (= frame centre), text
column and Masuk (457.7-514.7) unchanged, bubble unchanged.

### Sketch (phone 360, 1 char ~ 4 px; the three alignment lines are what changed)

```
  x=20                      axis x=180                        x=340
   |  RAKSA | GAME                              [ID] [sound]  |     logo/sound now flush with the cards (was 2px inside)
   +--------------------------------------------------------+     stage frame (unchanged size 320x144)
   |  [tower]  [house]       ( sun )                [office] |
   |   folder                 [HER]   plant          tower   |     sprite + sun centred on the axis
   |===================== counter ===========================|
   +--------------------------------------------------------+
   (portrait)<| Miss Raksa . Layanan Klaim                  |     bubble now reaches x=340 like the frame and the cards
              | anytime anywhere with our smile             |
                         MAIN BARENG RAKSA                        eyebrow + headline already on the axis
                            Siap jadi / andalan?
   +--------------------------------------------------------+
   |  Join Game card                                         |     left x=20 and right x=340 shared by every block
```

### Review checklist for step 3 (Designer review) and QA
- 360x740 and 390x844, id/en/zh: bubble right edge equals the frame/card right edge (gap 0); sprite, eyebrow, h1 and frame share one centre x; Masuk bottom 565.7 / 577.7 unchanged; no horizontal scroll.
- Bubble keeps its height (58.4 px, 2 text lines) in all three languages; 320x640 unchanged (3 lines); tail still attached to the portrait.
- Hero art: sun centred behind her head, no tree behind her, plant between her arm and the tower (not overlapping her), no cloud sliver at the top edge at 375/390/412 wide; palms still clear the counter (D-22).
- Header: logo and sound button flush with the card edges at <=700 (20 px); tablet header unchanged.
- Flag off: Raki centred on the counter, bubble alone spans the full width without a tail.
- Tablet 800 and desktop 1280: sprite centred in the frame, nothing else moved; `/cerita` 390 unchanged; reduced-motion matrix and fold results from T-003/T-004/T-006/T-007 unchanged.
- Real-phone check (owner, tomorrow): there is no classic scrollbar on a phone, so the left shift in the owner's shot 2 should not appear.
- `npm run test:client` and `npm run test:e2e` pass.

---

## T-008 — review (2026-11-15)

Reviewer: Designer · Build reviewed: Fullstack's dev client on :5233 · No source edited.
Method: read team/HANDOFF.md T-008, my spec D-40..D-47 and the regenerated team/specs/T-004-hero-art.txt; diffed WelcomeArt.tsx and player.css against
team/evidence/T-008/base/; then measured and screenshotted the REAL page with headless Chrome over CDP (DPR 2; DPR 1 for desktop) at 360x740, 390x844 (id/en/zh each),
800x1024, 901x720, 1280x800, plus the top edge at 375 / 390 / 412 / 430 and `/cerita`; looked at Fullstack's flag-off evidence.

### Verdict: PASS

The build matches the spec exactly (the diff is the D-42 art constants, the two `padding-right` removals, the bubble rule and the header rule, nothing else). No blockers, nothing
high or medium. Three small polish items below.

### The owner's complaint, step 2
**Yes: the phone "off" feeling is resolved.** In the owner's shot 2 every red arrow points at a right edge that did not line up, and now frame, greeting bubble, Join card, Mode Cerita card and
header controls all end at the same right edge, begin at the same left edge (x=20), and the sprite, sun, eyebrow and headline stand on one centre line, so nothing on the page sits "a bit off" any more
(the remaining 15 px left shift in that screenshot is the desktop browser's scrollbar, D-45).

### Checklist results (all measured live)
- **Alignment, 360x740 and 390x844, id/en/zh (6 runs, identical):** frame 20-340 / 20-370; bubble right edge 340 / 370 (gap to the frame 0, was 14.7 / 44.7); Join card and Mode Cerita card
  20-340 / 20-370; logo left 20 and sound-button right gap 20 (were 22/22); portrait left 20 (flush with the cards); sprite centre = frame centre = eyebrow centre = h1 centre (180 at 360, 195 at 390,
  sprite was 156 / 171). No horizontal scroll.
- **Tablet 800x1024:** frame 182.5-602.5, bubble right gap 0 (was 79.4), sprite centre 392.5 = frame = h1 centre, Masuk bottom 777.9 unchanged.
- **Desktop 1280x800 and 901x720:** sprite centre 916.5 = frame centre at 1280 (658.5 at 901), text column and Masuk (514.7 / 528.6) unchanged, desktop bubble deliberately unchanged (spec D-40).
  The scene still composes well with the centred sprite: sun behind her head, house left, office tower right, plant between her arm and the tower, counter and folder as before.
- **Art:** sun disc centred behind her head (measured: `disc(210,112,56)`), no tree remnants (the 4 tree rects are gone from `LATAR_KOTA`), plant at x 246-266 between her arm and the tower, folder and counter
  unchanged, tower windows still 3x3 clear of the outline (T-007). Top edge: no cloud sliver at 375 (visible scene y>=42), 390 (36) and 412 (27.2) because the clouds occupy y 14-26; confirmed in the 390
  screenshot. (At 430 the clouds do show, see D-48.)
- **Fold and rhythm unchanged:** Masuk bottom 565.7 (174.3 spare) at 360x740 and 577.7 (266.3) at 390x844 in all three languages; gaps frame -> greeting -> eyebrow, headline -> Join = 8 / 16 / 12.
- **Flag off (Fullstack's evidence flagoff-360.png):** Raki is centred on the counter in the frame (centre 180 = frame centre), the slogan-only bubble spans the full width with no tail and no portrait, the
  Mode Cerita card shows the owl portrait; coherent.
- **`/cerita` unchanged:** no `.lp-halaman`, header padding still 22/22, Masuk 17px/600 with no shadow, no hero frame; Fullstack's before/after /cerita 390 PNG md5 are identical (10d35d4c...).
- **Anti AI-slop (ROLE-DESIGNER.md):** pass. This pass only aligns edges and the axis: no new colours, shadows, radii, animation or copy; the dialogue-box reading (stage + full-width bubble) is cleaner, not
  more decorated, and it still reads as a RAKSA game screen.

### Fix list: blockers (high)
None.

### Fix list: should schedule (med)
None.

### Polish (low), non-blocking
- [D-48] Homepage hero, phone about 420-445 px wide (e.g. 430x932) · both clouds (y 14-26) are cut by the frame top and show as two thin pale strips along the top edge (6 px tall each, visible in the
  430 screenshot); the same cloud1 strip already existed before T-008, and a lone 4x4 white pixel at (176, 8) shows as a stray dot at the top of the tablet/desktop scene · fix: move both clouds up out of the
  phone range, `cloud(36, 4)` and `cloud(318, 4)`, and delete the stray `r(176, 8, 4, 4, WIN)` in `LATAR_AWAN` (WelcomeArt.tsx and team/specs/T-004-hero-art.txt); clouds then appear whole from about 445 px
  up (tablet, desktop) and never as slivers on phones · low. My geometry from T-004/T-008 spec (I called the cut cloud "natural"; at 430 it reads as a glitch).
- [D-49] Homepage tablet 701-900 · the greeting row keeps the base `padding-left: 4%`, so the portrait starts 16.8 px inside the frame's left edge (199.3 vs 182.5 at 800) while the bubble now reaches the
  right edge, which looks lopsided · fix: add `.lp-halaman .lp-kota-sapa { padding-left: 0; }` inside the `@media (max-width: 900px)` bubble rule block (the phone rule at <=700 already has 0); desktop keeps 4% · low.
- [D-50] Homepage hero · the counter plant's leaves overlap the office tower's left outline by about 2 units (as specified) so it can read as leaning on the tower · fix: optional, shift the plant 4 units left
  (x 244/246/248/242/246, sprite's right arm edge is about x 241 so keep >=2 units clear) or leave as is · low. No action needed unless the owner notices.

### Not verified by me
Flag-off render myself (Fullstack's evidence screenshot only), real DPR devices and fractional DPR / zoom, the owner's real-phone check (planned tomorrow; there is no classic scrollbar on a phone, so the 15 px
left shift in shot 2 should be gone), and `npm run test:client` / `test:e2e` (Fullstack's logs: 724/724 and 0 failures; I did not re-run them).

---

## T-010 — spec (2026-11-15)

Author: Designer · Status: spec for Fullstack · No source edited · **No Claude Design mockup needed**: both treatments are fully specified in words plus tested CSS/markup,
and they cost no new design asset, so there is nothing for Lead to approve.
Inputs: team/specs/2026-11-15-aset-episode2.md (rev 2: G1, G2, Work 1 and 3), team/REVIEW.md "T-010 plan review" and "re-review rev 2" (last bullet: a flat colour is the same square), ROLE-DESIGNER.md,
client/src/cerita/ui/latar/PanggungLatar.tsx + latar.css, cerita/ui/gambarIlustrasi.tsx, cerita/seni/auto-2/ilustrasi/ (index.ts, ilustrasi.json, the webp files), pages/Landing.tsx,
components/PlayerShell.tsx + Merek.tsx, ui/halaman.ts, theme.css tokens, i18n/kamus/layar.ts.
Support file (tested data, documentation only): `team/specs/T-010-kabur-thumbs.txt` (the five placeholder thumbnails as data URIs plus the exact ffmpeg command).

**How this was checked.** Live dev client :5233, headless Chrome over CDP. Episode 2 first scene = `/cerita/auto-2` (office, Miss Raksa "salam", desk foreground), with the placeholder CSS/markup injected on stage mount
(nothing saved to the repo). Network throttle = CDP Fetch interception of ONLY `*.webp` responses on one shared pipe with 150 ms RTT (200 KB/s = 1.6 Mbps and 100 KB/s = 0.8 Mbps), because throttling the whole dev
page made the dev bundle itself unusable; Fullstack's real harness (production build, `Network.emulateNetworkConditions`) is the authority for the before/after table. 360x740 and 390x844 DPR 2, id/en/zh,
reduced motion on/off, 404 failure of a layer, loader at 360 / 390 / 1280 including the 2000 ms cap. Numbers below are measured.

### What the owner sees today (baseline, measured)
The stage frame `.cer-latar` has a flat `#efe3c8` background. On the throttled first scene the three images (office 121 KB, Miss Raksa 60 KB, desk 44 KB, 225 KB total) land one by one: at 200 KB/s the stage mounts at
0.6 s and the layers arrive at 1.2 s, 1.5 s and 1.7 s; at 100 KB/s they arrive at 1.8 s, 2.4 s and 2.8 s. Until then the frame is a beige square with only the location chip on it (captured frames 1-8 at 100 KB/s), which is
exactly the owner's "plain coloured square". The room, Miss Raksa and the desk also appear one at a time.

### Part A: Episode 2 scene placeholder (G1, Work item 1)

- [D-51] Placeholder = a blurred thumbnail of THE room, plus a small branded loading pill · Recommended and tested. Not a flat colour, not a spinner on white. Each location gets a tiny build-time thumbnail of its own
  background (`kantor`, `pool`, `bengkel`, `tol`, `wawancara`), shown blurred as the FIRST layer inside the camera world (`.cer-ilustrasi`, same coordinates as the background layer, so the camera crop is already right
  and nothing jumps at the reveal): `<div class="cer-ilustrasi-kabur" style="background-image:url(data:image/webp;base64,...)">` with `filter: blur(6px) saturate(.9) brightness(1.04); transform: scale(1.06)` (the scale hides
  the blur's edge bleed). It reads as "this room is coming" (warm wood and green slats for the office, sky and road for the toll, and so on, see the contact sheet of all five in my notes), keeps the real palette and costs almost nothing.
  The pill `.cer-memuat` sits centred at 38% from the top of the stage (above the dialogue card, below the location chip): `rgba(255,254,250,.94)` fill, 1px `#d9dfd2` border, radius 999 (the same chip look as `.cer-latar-lokasi`),
  12.5px/650 `#243d30`, text = the EXISTING key `layar.menyiapkanAdegan` ("Menyiapkan adegan…", "Preparing the scene…", "正在准备场景……": no new i18n), and three 5 px pixel squares that step through a 1.2 s loop
  (`steps(1)`, same pixel language as the homepage hero and CTA). The pill is `aria-hidden` (the stage is decorative and the dialogue text, buttons and focus are untouched, so nothing needs announcing). Priority: high.

- [D-52] Placeholder asset approach and measured cost · Thumbnails are 64x36 WebP, quality 40, generated from each `<lokasi>-latar-1100.webp` with the SAME toolchain as `tools/cerita/bangun-ilustrasi-auto2.mjs` (ffmpeg libwebp):
  `ffmpeg -i <lokasi>-latar-1100.webp -vf "scale=64:-2:flags=area" -c:v libwebp -quality 40 -compression_level 6 out.webp`. **Measured: kantor 540 B, pool 526 B, bengkel 742 B, tol 532 B, wawancara 486 B = 2,826 B total
  (3,891 characters as five inline data URIs).** That is 0.5-0.75 KB per location (the limit was 2 KB), no network request, no new large asset. Where it lives: a generated module next to the illustration manifest
  (for example `seni/auto-2/ilustrasi/kabur.ts` exporting the five data URIs, written by the same build script) read through an optional `kabur?: string` on `LokasiIlustrasi`; it is imported only by the AUTO-2 episode chunk,
  so the homepage bundle is unchanged. Locations without a thumbnail (other episodes) keep today's flat fallback. Rejected: 32 px (200 B each, visibly blocky), 48 px (350-490 B) is the acceptable floor, 64 px chosen for
  smoother blur. Rejected: a drawn pattern in the dominant colour (still reads as a coloured block) and a stage-frame silhouette (does not say which room). Priority: high.

- [D-53] The reveal · The four things the owner sees at once must appear together. Required layers = background (`latar`), foreground (`depan`, only kantor has one) and every character illustration visible at the start of the scene
  (the `hadir` list; `miss-salam` in scene 1); optional layers that do not exist count as absent, not pending. While the group is pending, all layers stay MOUNTED (so they load) but hidden (`opacity:0`) above the placeholder.
  When every required image is loaded and `decode()`d (or failed, D-54, or the 6 s cap fired) the world gets `data-siap` ONCE: the layers fade in over **240 ms ease-out** while the placeholder fades out over the same 240 ms and the pill
  over 160 ms, then the placeholder and the pill are removed after 300 ms. Reduced motion (and `data-gerak` not `penuh`): **instant swap**, static pill squares, no fade, same rule shape as today (`:root:not([data-gerak="penuh"]) ...`).
  Remove the existing mount `animation: cer-latar-muncul` from the world root and from the group layers until `data-siap`, otherwise a cached image could flash alone during its own 200 ms animation (measured: no flash when the
  image arrives after the animation, but not guaranteed on cached loads). Tested: at 100 KB/s the stage mounted at 0.40 s, the placeholder showed from the first frame, the group was ready at 2.84 s, the crossfade ran, the placeholder
  was removed at 3.24 s; same timing in en and zh at 390x844. Do not gate dialogue, buttons or story actions on readiness (Codex: no restart of actions). Priority: high.

- [D-54] Failure and slow layers · Measured with the background returning 404: the placeholder stays at full opacity as the room (`data-gagal-latar`), the pill is removed (no endless "loading" for something that failed),
  Miss Raksa and the desk still reveal on top, the dialogue card and buttons work (screenshot at 3.4 s: blurred office behind a sharp Miss Raksa). Per layer: background fails = placeholder is the room; desk (`depan`) fails = omitted;
  a character fails or has no asset = the existing named silhouette (`Siluet`) over the placeholder; every required layer needs an explicit error/decode handler that settles to this state (the existing `onGagal` path is
  not enough, per Codex re-review). 6 s cap: reveal what has loaded, keep the placeholder under whatever has not, and let late layers fade in on their own (still no blank block). Priority: high.

- [D-55] Transition between scenes · When the LOCATION changes (`key={komposisi.lokasi}` already remounts the world) show the NEW room's thumbnail immediately (hard cut from the old sharp room to the new blurred room, then
  the same reveal). Do NOT keep the previous room visible: the location chip and the dialogue already say the story moved, so a stale room would contradict them. When G3 warm-up has the next composition decoded, the group is ready in
  the same tick and the user just sees the 240 ms crossfade. Same-location changes (expression, another speaker, the existing `useGambarSiap` swap-after-decode) are unchanged and need no placeholder. Priority: med.

- [D-56] Tested CSS for Part A (markup: placeholder div first in `.cer-ilustrasi`, pill as a sibling inside `.cer-panggung`, `data-siap` / `data-gagal-latar` set on `.cer-ilustrasi`) ·

```css
/* T-010 A: stage placeholder + one-shot reveal. Mount fade moves from the world root to the group (below). */
.cer-latar .cer-ilustrasi { animation: none; }
.cer-ilustrasi-kabur { position: absolute; inset: 0; background-size: 100% 100%; background-repeat: no-repeat; filter: blur(6px) saturate(.9) brightness(1.04); transform: scale(1.06); }
.cer-ilustrasi:not([data-siap]) > :not(.cer-ilustrasi-kabur) { opacity: 0; animation: none; }
.cer-ilustrasi > :not(.cer-ilustrasi-kabur) { transition: opacity .24s ease-out; }
.cer-ilustrasi[data-siap]:not([data-gagal-latar]) .cer-ilustrasi-kabur { opacity: 0; transition: opacity .24s ease-out; }
.cer-memuat { position: absolute; left: 50%; top: 38%; transform: translate(-50%, -50%); z-index: 3; display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px 6px 12px; border-radius: 999px;
  background: rgba(255, 254, 250, .94); border: 1px solid #d9dfd2; color: #243d30; font-size: 12.5px; font-weight: 650; line-height: 1.3; white-space: nowrap; transition: opacity .16s ease-out; }
.cer-memuat[data-selesai] { opacity: 0; pointer-events: none; }
.cer-memuat i { display: inline-flex; gap: 3px; }
.cer-memuat i b { width: 5px; height: 5px; background: var(--hijau); opacity: .25; animation: cer-titik 1.2s steps(1) infinite; }
.cer-memuat i b:nth-child(2) { animation-delay: .4s; } .cer-memuat i b:nth-child(3) { animation-delay: .8s; }
@keyframes cer-titik { 0%, 33% { opacity: 1; } 34%, 100% { opacity: .25; } }
@media (prefers-reduced-motion: reduce) {
  :root:not([data-gerak="penuh"]) .cer-memuat i b { animation: none; opacity: .6; }
  :root:not([data-gerak="penuh"]) .cer-ilustrasi > :not(.cer-ilustrasi-kabur),
  :root:not([data-gerak="penuh"]) .cer-ilustrasi[data-siap] .cer-ilustrasi-kabur,
  :root:not([data-gerak="penuh"]) .cer-memuat { transition: none; }
}
```
  Cost of this block: 1.8 KB raw / 0.74 KB gzip. Priority: high.

### Part B: homepage first-visit loader (G2, Work item 3)

- [D-57] Loader look and layout · Route `/` only, mounted by Landing, first visit of the session. A full-viewport overlay in `var(--krem)` with ONE centred column, nothing else (no card, no shadow, no gradient, no spinner-on-white):
  1. the shared wordmark "RAKSA | GAME" (existing `.mrk` / `.mrk-game` styles, `aria-hidden`), 34 px;
  2. **Raki** (`art/Raki.tsx`, mood `sapa`, 80 px, its existing gentle float) 24 px below the wordmark. Decision: Raki ALWAYS, not Miss Raksa: the loader waits for Miss Raksa's sprite sheet, so her portrait cannot be visible
     inside it (tested: the ring stayed an empty cream circle), Raki is inline vector (zero requests, zero decode wait), and it also covers `TOKOH.missRaksa.aktif === false` with no branching;
  3. an indeterminate pixel bar 20 px below Raki: four 28x10 segments, 4 px apart, each with a 3 px base; one segment at a time lights up (`--kuning` face, `--kuning-tua` base) in a 1.2 s `steps(1)` loop, idle segments
     `--krem-tua` with a base of that colour mixed 12% with `--tinta` (the one tone I used is `#d3d6cb`; write it as `color-mix(in srgb, var(--krem-tua), var(--tinta) 12%)` or keep the hex, no other colour);
  4. the status text 12 px below the bar: 14 px `--tinta-lembut`, `role="status"`: **new key `umum.menyiapkan`: id "Menyiapkan…", en "Preparing…", zh "正在准备……"** (existing "…" style).
  The column sits 8vh above the optical centre. **360x740 / 390x844:** as above. **>=901 px (1280x800 tested):** wordmark 48 px, Raki 112 px (margin 32), bar segments 40x12 (margin 24), text 16 px (margin 16), same column.
  The whole overlay is `position:fixed; inset:0; z-index:60`, and the page behind must not scroll: `html:has(.lp-pemuat){overflow:hidden}` (tested: without it the desktop scrollbar showed through the overlay). Palette = theme tokens only.
  Priority: high.

- [D-58] Loader motion and dismissal · Indeterminate bar (honest: no fake percentage) plus Raki's existing float; under reduced motion (`:root:not([data-gerak="penuh"])`) the bar is static (all four segments lit at 55%) and Raki is still
  (the global rule already stops `.anim-melayang`), the text alone says what is happening. Dismissal: the content under the overlay stops being `inert` at the START of the dismissal, the overlay fades out in **200 ms ease-out**
  (instant under reduced motion), then unmounts after 260 ms. It ends when the homepage essentials are ready (sprite sheet decoded and `document.fonts.ready`) OR at the 2000 ms cap (measured: dismissal at 2016-2021 ms with the sheet
  stalled, `inert` removed). It never mounts when the essentials are already ready (warm visit: no flash), is skipped for reduced data and for the whole session after the first dismissal (Lead's `raksa:loader:v1` rule), and never
  mounts on other routes. Status text is OUTSIDE the inert region (the overlay is a sibling of the app root; the app root is the inert subtree), and focus moves to the h1 only after the overlay is gone, per the Codex notes. Priority: high.

- [D-59] The homepage at the 2000 ms cap with the sprite not ready (measured, sheet stalled for 6 s) · No layout jump: the hero frame, the greeting row, the headline, Join and Mode Cerita card sit at exactly the final
  positions (frame 20-340 x 78-222 at 360, same at 1280) because the sprite slot has its inline size and the portrait rings are fixed-size. What is missing until the 7 KB sheet lands: Miss Raksa in the hero (the sun shows empty
  behind the counter), and the two portrait rings (greeting and Mode Cerita) are empty cream circles. Spec: accept it (the reserved size is the requirement), let the sprite and portraits appear when ready (pop-in, no layout change;
  a fade is optional polish). The cheap way to make this case rare: have `client/index.html` add a `<link rel="preload" as="image" href="/karakter/miss-raksa-besar.webp" type="image/webp">` only when the path is the homepage
  (a tiny inline check that respects the base path), so the 7 KB sheet downloads in parallel with the entry JS; do not preload for other routes. Priority: med.

- [D-60] Tested CSS for Part B (markup: `<div class="lp-pemuat" aria-busy="true"><div class="lp-pemuat-isi"><div class="mrk" aria-hidden="true">...</div><span class="lp-pemuat-raki" aria-hidden="true"><Raki size={80} mood="sapa"/></span><div class="lp-pemuat-bar" aria-hidden="true"><i/><i/><i/><i/></div><p class="lp-pemuat-teks" role="status">…</p></div></div>`; add `data-selesai` at dismissal) ·

```css
/* T-010 B: homepage first-visit loader (route "/" only) */
.lp-pemuat { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 24px 24px calc(24px + env(safe-area-inset-bottom)); background: var(--krem); transition: opacity .2s ease-out; }
.lp-pemuat[data-selesai] { opacity: 0; pointer-events: none; }
.lp-pemuat-isi { display: flex; flex-direction: column; align-items: center; margin-top: -8vh; }
.lp-pemuat .mrk { font-size: 34px; min-height: 0; }
.lp-pemuat .mrk-game { font-size: 14px; padding: 4px 0 4px 12px; }
.lp-pemuat-raki { margin-top: 24px; display: block; }
.lp-pemuat-bar { display: flex; gap: 4px; margin-top: 20px; }
.lp-pemuat-bar i { width: 28px; height: 10px; background: var(--krem-tua); border-bottom: 3px solid #d3d6cb; animation: lp-seg 1.2s steps(1) infinite; }
.lp-pemuat-bar i:nth-child(2) { animation-delay: .3s; } .lp-pemuat-bar i:nth-child(3) { animation-delay: .6s; } .lp-pemuat-bar i:nth-child(4) { animation-delay: .9s; }
@keyframes lp-seg { 0%, 24% { background: var(--kuning); border-bottom-color: var(--kuning-tua); } 25%, 100% { background: var(--krem-tua); border-bottom-color: #d3d6cb; } }
.lp-pemuat-teks { margin: 12px 0 0; font-size: 14px; line-height: 1.4; color: var(--tinta-lembut); }
html:has(.lp-pemuat) { overflow: hidden; }
@media (min-width: 901px) {
  .lp-pemuat .mrk { font-size: 48px; } .lp-pemuat .mrk-game { font-size: 16px; padding: 5px 0 5px 14px; }
  .lp-pemuat-raki { margin-top: 32px; } .lp-pemuat-raki svg { width: 112px; height: 112px; }
  .lp-pemuat-bar { margin-top: 24px; } .lp-pemuat-bar i { width: 40px; height: 12px; }
  .lp-pemuat-teks { font-size: 16px; margin-top: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  :root:not([data-gerak="penuh"]) .lp-pemuat-bar i { animation: none; background: var(--kuning); border-bottom-color: var(--kuning-tua); opacity: .55; }
  :root:not([data-gerak="penuh"]) .lp-pemuat { transition: none; }
}
```
  Cost: 1.5 KB raw / 0.66 KB gzip; with the loader component and hook I estimate 2-3 KB gzip for the whole homepage change (limit 10 KB). The thumbnails are NOT in the homepage bundle. Priority: high.

### Part C: anti AI-slop check (both)
Pass. Both reuse what already makes this a RAKSA game: Part A shows the real room blurred (not a stock shimmer or a grey block), with the same chip style as the stage's location label and the pixel-square motif from the hero and CTA;
Part B is the brand wordmark, the owl mascot and a pixel bar on the cream page colour, with honest indeterminate motion and a status line, not a generic spinner in white. No gradient besides the existing stage styles, no glow, no emoji,
no new colour except the one derived bar tone, no new copy except one i18n key, motion only for status (stepping squares/segments, 240 ms and 200 ms reveals), all of it stopped under reduced motion.

### Sketch (1 char ~ 4 px)

```
 Homepage loader, 360x740                          Stage placeholder, first scene (stage frame ~328 x 184, camera crop applied)
 +------------------------------------+            +--------------------------------------------------+  gold border, radius 16
 |                                    |            | (Layanan Klaim Raksa)                            |  location chip (existing)
 |                                    |            |   ~~ blurred office thumbnail (64x36, blur 6px) ~~|
 |         RAKSA | GAME      (34px)    |            |   ~~    warm wood / green slats / desk      ~~ |
 |                                    |            |        +--------------------------+              |
 |              ,___,                 |            |        | [] [] []  Menyiapkan adegan… |            |  pill at 38%, stepping squares
 |              (o,o)   Raki 80px      |            |        +--------------------------+              |
 |              /)__)  (floats)       |            |   ~~ ~~ ~~ ~~ ~~ ~~ ~~ ~~ ~~ ~~ ~~ ~~ ~~ ~~    |
 |                                    |            +--------------------------------------------------+
 |        [] [] [] []   bar 4x28x10     |            | dialogue card (existing, usable the whole time)  |
 |        one segment lit, steps 1.2s  |            +--------------------------------------------------+
 |            Menyiapkan…   (14px)    |             then: layers fade in 240 ms (group), placeholder + pill fade out; failed latar => blur stays
 |                                    |
 +------------------------------------+
```

### Part D: review checklist for step 3 (Designer review) and QA
- **Throttle matrix (Part A), production build, Fullstack's harness:** 360x740 DPR 2 and 390x844 DPR 3, CPU 4x, 1.6 Mbps and also 0.8 Mbps, cache enabled for the warm run; id/en/zh. A frame series at 50 ms plus the readiness marker
  (`data-siap` timestamp and decode times): the placeholder is visible in the FIRST frame after the stage mounts; NO frame shows the flat `#efe3c8` square; the room, desk and character appear together; reveal 240 ms; final-layer time
  against the baseline table.
- **Part A states:** 404 on the background (placeholder stays, pill gone, character visible), 404 on the desk, 404 on the character (silhouette), all layers stalled past 6 s (partial reveal, placeholder under the missing ones); reduced motion
  with `?gerak=ikut` (instant swap, static squares); `?gerak=penuh` (fades on); scene change to pool / tol (new thumbnail at once, no stale room); a cached/warm scene (no visible placeholder frame beyond the crossfade); dialogue and
  buttons usable the whole time; stage crop identical to today's final frame.
- **Part B:** cold `/` with the sprite sheet held 1.5 s: loader visible at 360x740, 390x844, 1280x800 in id/en/zh; ends when the sheet is decoded, not later; cap case (sheet stalled 6 s): dismissal at about 2000 ms, no layout jump
  (positions equal to the final layout), Miss Raksa and the portraits appear when the sheet lands; warm visit and second visit in the session: no loader; reduced motion: static bar, instant dismissal; page behind does not scroll;
  `inert` removed at dismissal; status text announced once; focus lands on the h1 only after dismissal; not mounted on /host, /projector, /join, /cerita, /acara/*; flag off (Miss Raksa inactive): same loader (Raki), homepage per T-007.
- **Cost:** production build gzip delta for the whole T-010 homepage change <= 10 KB (expect 2-3 KB); the AUTO-2 episode chunk grows by about 3.9 KB (inline thumbnails); no new network requests in the placeholder approach.
- `npm run test:client` and `npm run test:e2e` pass; T-003..T-008 homepage results unchanged.

---

## T-010 — review (2026-11-15)

Reviewer: Designer · Build reviewed: the production build in client/dist (newer than the sources: 19:06 vs 18:43), served by `npm start` on :4000 with `RAKSA_LEGACY=on` (I started it for this review and stopped it
afterwards) · No source edited.
Method: read team/HANDOFF.md T-010 and the diffs of PanggungLatar.tsx, latar.css, PemuatAwal.tsx, Landing.tsx, player.css, halaman.ts; then measured and screenshotted the REAL production pages with headless Chrome over CDP
(my own scripts, so Fullstack's evidence folder was not overwritten): Episode 2 first scene at 360x740 and 390x844 (DPR 2), images-only throttle at 200 KB/s and 100 KB/s + 150 ms RTT, id/en; reduced motion + `?gerak=ikut`; a 404 on the
background; the homepage loader cold at 360/390/1280 (id/en/zh), at the 2000 ms cap, under reduced motion, unthrottled "fast" cold loads, and a whole-page 1.6 Mbps throttle.

### Verdict: FIX NEEDED (two small fixes, both quick; everything else PASS)

The design and the logic match my spec. The two things to fix before acceptance: a CSS class-name collision that makes the Episode 2 pill twice as tall as designed and restyles an unrelated loading fallback (D-61, my spec's naming mistake), and a
loader that flashes instead of reading as a loading screen (D-62, open point 3a). Decisions for the three open points are below.

### Does it look like my spec, and does it read as "loading", not a square? (Part A, production, measured)
- **Yes, with one cosmetic exception (D-61).** At 360x740 (200 KB/s) the stage mounts at 413 ms and the FIRST frame already shows the blurred office thumbnail (warm wood and green slats) with the "Menyiapkan adegan…" pill and three stepping
  squares; no frame shows a stage without the placeholder (list of such frames is empty). The three layers (office 121 KB, Miss Raksa 60 KB, desk 44 KB) become ready together and the group is revealed at 1.73 s (`data-siap`), caught
  mid-crossfade (latar opacity 0.73, placeholder 0.27); the placeholder and pill are gone by 2.8 s. At 390x844 in English (100 KB/s): placeholder from 412 ms, single reveal at 2.86 s. The flat beige square is gone.
- **Reduced motion + `?gerak=ikut`:** instant swap: the first revealed frame already has latar opacity 1 and placeholder opacity 0, then the placeholder is removed; static squares.
- **404 background:** `data-gagal-latar`, the blurred room stays at full opacity as the room, the pill is gone, Miss Raksa and the desk are visible on top (screenshot at 3.4 s), the dialogue is usable.
- **Warm-up:** after the reveal the next location (pool, 194 KB) is fetched once (one variant per layer); the scene's own layers were not requested twice.
- **Location change (D-55): not verified by me.** Reaching another room needs real story interactions (the first beats go through a phone conversation); I could not script it safely. By construction the world is keyed on the location
  and takes the new location's thumbnail, so QA should check scene 1 -> pool/tol with the 0.8 Mbps throttle.

### Homepage loader (Part B, production, measured)
- **Layout and content as specced:** cold `/` with the sprite sheet held 1.5 s: shown at ~360 ms, dismissed when the sheet decodes (1.2 s on screen), gone ~260 ms later. Wordmark, Raki (80 px), 4-segment pixel bar (one lit segment,
  stepping), status text "Menyiapkan…" / "Preparing…" / "正在准备……" at 360x740 (id), 390x844 (en), 1280x800 (zh). `#root` is `inert` and `aria-busy="true"` while shown, the `role=status` text is outside `#root`, `<html>` is
  `overflow:hidden` (no scrollbar behind it), `inert` and `aria-busy` are gone when the fade starts.
- **200 ms fade / reduced motion:** overlay removed 262 ms after dismissal; with reduced motion the bar animation is `none`.
- **2000 ms cap, sheet stalled:** dismissed at the cap (2027 ms on screen), the homepage keeps its final layout: frame 20,78 -> 340,222, Masuk bottom 565.7 (id/360) with no jump; Miss Raksa and the portrait rings fill in when the
  sheet lands (accepted in D-59).
- **Homepage composition unchanged:** Masuk bottom 565.7 at 360x740 (id), 577.7 at 390x844 (en); frame 20,78 -> 340,222 / 20,78 -> 370,234 (T-003..T-008 numbers). The 1280 zh run is taller only because of Chinese text.
- **Two problems:** the loader FLASHES instead of being seen (D-62), measured below.

### Decisions on Fullstack's three open points (binding for the follow-up)

- **3a. Loader appears only after the JS and flashes:** **Recommend two steps, not "accept".**
  Measured: (i) slow link (whole page at 1.6 Mbps): the page is a blank cream screen for about 4.9 s while the ~730 KB entry JS downloads, then the loader shows for 209 ms plus a 260 ms fade (gone at 5.4 s); (ii) a fast cold load
  (localhost, cache off): the overlay mounts and is dismissed on the SAME frame (duration 0 ms, `inert` never set) and then fades for ~260 ms, i.e. a one-frame flash of a full-opacity branded screen followed by a ghost fade.
  Neither is the owner's "loading screen, then the homepage".
  **Step 1 (do now, small, inside T-010):** a minimum on-screen time of **600 ms** measured from the overlay's first painted frame, whenever the loader mounts (dismiss at max(essentials ready, 600 ms), the 2000 ms cap unchanged and still the
  upper bound). It makes the screen read as a deliberate, branded moment (once per session, only on a cold visit, skipped when the sheet is already cached/warm as it is today) instead of a flicker. Cost: +0.6 s on a cold first visit only.
  Reject "accept as is" (flash) and reject a bare delay-before-show (on the slow link it would still show nothing, because the sheet finishes right after the JS).
  **Step 2 (new follow-up task, recommended soon):** a tiny pre-JS loader in `client/index.html`, `/` only (base-path-aware inline check), the SAME look (wordmark, Raki as inline SVG, bar, text; about 1.5-2 KB inline,
  tokens as CSS variables or copied hex), visible from the first paint and handed over to the React overlay without a jump, removed at dismissal. It is the only thing that gives a slow-link user (the owner's phone over Tailscale) a loading
  screen during the ~5 s that is currently blank; the page background is already `--krem`, so the hand-over is seamless. Keep the React overlay (essentials, inert, a11y) as the owner of dismissal.
- **3b. Homepage preload hint removed:** **Agree, keep it removed.** With the preload the 7 KB sheet is always complete before the entry JS runs, so the "skip when already ready" rule means the loader never shows on a cold `/`, which
  contradicts the owner's request. The cost of removing it (the rare empty rings after the cap, D-59) is accepted. Do not re-add a preload unless the pre-JS loader of step 2 exists, and even then not for the sprite sheet.
- **3c. D-56 CSS scoped under `[data-gerbang]` and `aria-busy` on `#root`:** **Accept both.** Scoping is correct and better than my spec: my unscoped rule would have hidden every other `PanggungLatar` (episode card, activities)
  forever; `data-gerbang` is set only for the played scene. `aria-busy` belongs on the content being prepared (`#root`); on the overlay it would mute the status announcement inside it, and I measured it is set while shown and removed with
  `inert` at the start of the fade. No change.

### Fix list: blockers (high)
- [D-61] Episode 2 scene pill · **class-name collision:** `.cer-memuat` already exists in `client/src/cerita/ui/cerita.css:156` (`.cer-memuat { padding: 24px 16px }`) and is the activity-loading fallback in `pages/CeritaMain.tsx:486`
  (`<div className="cer-memuat"><Memuat .../></div>`). (a) The pill's padding is overridden to 24px 16px, so it renders 66 px tall (computed on the production page: 194 x 66) instead of the specified ~30 px (6px 14px 6px 12px); (b) my pill
  rules now apply to the unrelated activity fallback: measured on the production page it becomes `position:absolute; left:50%; top:38%; border-radius:999px; white-space:nowrap; pointer-events:none`, i.e. a floating pill instead of an inline
  loading block, a regression while an activity chunk loads · fix: rename the pill class everywhere to a unique name, for example `.cer-adegan-memuat` (CSS in latar.css incl. `[data-selesai]` and the reduced-motion list, and
  `PanggungLatar.tsx:254`), and update any selector in tools/cek-pemuat-t010.mjs / ukur-aset-t010.mjs; do not touch cerita.css:156 or CeritaMain.tsx · high. The collision is my spec's naming mistake (D-56 reused the name), Fullstack followed the spec.
- [D-62] Homepage loader · flashes instead of reading as a loading screen (open point 3a): 0 ms on screen on fast cold loads, 209 ms on a slow link · fix: step 1 of decision 3a, minimum 600 ms on screen from first paint of the overlay
  (`const sisa = max(0, 600 - tampilMs)` before `lepas()`), 2000 ms cap unchanged · high.

### Should schedule (med)
- [D-63] Homepage, slow links · about 4.9 s of blank cream screen before the loader can exist, because it lives in the JS bundle · fix: new follow-up task: pre-JS loader in `client/index.html` for `/` only (decision 3a, step 2) · med.

### Polish (low), non-blocking
- [D-64] Episode 2 first scene · after D-61 re-check the pill at 360 and 390 (about 30 px tall, centred at 38%, above the dialogue card) in id/en/zh and that the English "Preparing the scene…" fits at 320 · low.
- [D-65] Homepage cap case · empty portrait rings and an empty sun until the 7 KB sheet lands (accepted, D-59); optional later polish: fade the sprite and portraits in when they arrive · low.

### Anti AI-slop and regression
Pass on both treatments: the room placeholder is the real room blurred with the same chip style and pixel-square motif as the hero and CTA; the loader is wordmark + Raki + pixel bar + status on the cream page colour with honest indeterminate motion,
tokens only, static under reduced motion; no gradients, glow, emoji or new colours; one new i18n key. The homepage composition from T-003..T-008 is unchanged (numbers above); `/cerita` untouched by this task.

### Not verified by me
The scene change to pool/tol (D-55), real devices, the 0.8 Mbps matrix on the production harness, Fullstack's before/after table and gzip numbers (their evidence), and `npm run test:client` / `test:e2e` (their logs: 724/724, 0 failures).

---

## T-010 — re-check (2026-11-15)

Reviewer: Designer · Build: production build in client/dist (20:08, newer than the 19:39 sources) on `npm start` :4000 (`RAKSA_LEGACY=on`, started and stopped by me) · Only my items re-checked · No source edited.

### Verdict: PASS. No open items.

- **D-61 (pill collision) fixed.** The pill is `.cer-adegan-memuat`; computed padding is `6px 14px 6px 12px` and the pill is **30.3 px tall at 320 / 360 / 390 in id, en and zh** (widths 187-188 px id/en, 151 px zh).
  **D-64:** English "Preparing the scene…" fits at 320 with 55 px either side (id 54, zh 72), centred above the dialogue card. The old `.cer-memuat` class is not present on the scene. The activity-loading fallback markup
  (`<div class="cer-memuat">`, CeritaMain) is back to normal: `position:static`, `padding:24px 16px`, no radius, `white-space:normal`, `pointer-events:auto`.
- **D-62 (loader flash) fixed.** With the sheet request held, the loader that shows stays on screen **621 ms** (sheet at ~0.6 s) and **656 ms** (0.9 s), **1185 ms** with a 1.5 s hold, then fades ~250-280 ms (unchanged);
  with the sheet never arriving it dismisses at the 2000 ms cap (2031 ms on screen), and the homepage keeps its final layout (frame 20,78 -> 340,222, Masuk bottom 565.7 at 360; 577.7 at 390).
- **D-59 (restored preload hint + honest skip rule): accepted.** Measured: the preload is in the served index.html; on a normal cold `/` (360 id, 390 en) the sheet is decoded before Landing mounts and the loader is
  **skipped** (no overlay, no flash, layout unchanged); with a 300 ms hold it is also skipped; it shows, for at least 600 ms, only when the sheet is late (hold 0.6 / 0.9 / 1.5 s). On the whole-page 1.6 Mbps throttle the
  loader showed after the JS at 4.99 s and stayed 639 ms, so no flash either. I accept this on one condition for the owner's expectation: on a normal link the loader will usually NOT be seen, and on a slow link it only
  appears after the ~5 s blank cream screen; making a loading screen visible during that wait is T-011 (pre-JS loader in index.html, my D-63), which stays open.
- **D-55 (location change) verified live.** Using `tools/cerita/state-lokasi-kedua.mts` (progress saved in `raksa:cerita`, one "Lanjut" before the first change), pressing Lanjut under a 100 KB/s image throttle: **8 ms later** the stage is on
  `pool` with the pool thumbnail at opacity 1, every layer at opacity 0 and the pill showing ("Pool truk" chip, part title "Survey dan estimasi"); the layers arrive one by one (background 2.1 s, trailer 3.0 s, Rudi 3.2 s) and
  are revealed as one group at about 3.2 s (placeholder 0.07 -> removed by 3.45 s). No stale room and no flat square.

Not re-verified: real devices and Fullstack's before/after numbers (their evidence); `npm run test:client` / `test:e2e`.

---

## T-011 — spec (2026-11-15)

Author: Designer · Status: spec for Fullstack (step 1) · No source edited · no mockup (words + tested HTML/JS) · nothing new for Lead to approve.
Inputs: client/index.html (+ the built client/dist/index.html), components/PemuatAwal.tsx, player.css `.lp-pemuat*`, theme.css, components/Merek.tsx, ui/halaman.ts, main.tsx, i18n/index.ts, my D-57..D-63.
Support file (the exact tested block): `team/specs/T-011-pra-pemuat-block.html`.

**How this was checked.** Production build (client/dist, :4000). The block was injected by rewriting the served `index.html` with CDP (`Fetch.fulfillRequest`), with the WHOLE page throttled (`Network.emulateNetworkConditions`: 1.6 Mbps =
200 KB/s, 150 ms RTT, cache off), 360x740 DPR 2, plus 390x844 and 1280x800, id/en/zh, reduced motion, a per-animation-frame state recorder (rAF) and timed screenshots. The app code was NOT edited, so the React side of the handover
(D-71) is emulated from outside by calling the same function the React code will call; the emulation is labelled below. Numbers are measured.

### What the owner sees today (measured, 1.6 Mbps whole page)
First paint at 776 ms (blank cream), first CONTENTFUL paint at 4,028 ms when the ~730 KB entry JS has run, and the React loader at 4.77 s (shown for about 0.6 s). So about 4 s of blank cream, then a short loader.

### Spec lines

- [D-66] Look and markup: reuse the React loader's own markup and class names, no inline CSS · The `.lp-pemuat*` and `.mrk*` rules live in the render-blocking main stylesheet (`index-*.css`, in `<head>`), so the first paint already has them.
  The pre-JS screen is therefore the SAME markup as `PemuatAwal` (`<div class="lp-pemuat" id="pra-pemuat"><div class="lp-pemuat-isi">` wordmark, Raki, 4-segment bar, `<p class="lp-pemuat-teks" role="status">`) held in a `<template>` and styled by the same
  CSS: cream `--krem`, 34 px wordmark (48 px on desktop), 4 pixel segments, 14 px status text. **Measured pixel match:** at 360x740 (id), 390x844 (en) and 1280x800 (zh), under reduced motion (static bar), the element rectangles of wordmark, Raki,
  bar and text are identical to the React overlay's to 0.1 px, and the full-page PNG of the pre-JS screen alone and of the React overlay alone have the SAME MD5 (pixel-identical). Dark mode is not a thing here (no `prefers-color-scheme` or
  `color-scheme` in theme.css or player.css). No fonts, no external assets, no React. Priority: high.

- [D-67] Raki: inline copy (recommended, not wordmark + bar only) · The handover must be invisible, and the React overlay has Raki. A wordmark+bar-only pre-JS screen would make the column jump (Raki adds an 80 px block plus 24 px margin, shifting
  the wordmark about 52 px) and pop the owl in at the handover, OR force Raki out of the React loader I specified (D-57). Cost of keeping Raki inline, measured on the built index.html: **+538 bytes gzip** (full block 1,503 B vs 965 B without Raki).
  It is the exact markup React renders (`<svg class="anim-melayang" ...>`, colours via the existing CSS variables; the float animation class comes from the main CSS and stops under reduced motion). Priority: high.

- [D-68] Status text and language · Use the page language with a three-way text, not a single Indonesian string: `?lang=id|en|zh` first, then `localStorage['raksa:bahasa']`, default id (the template already holds "Menyiapkan…"); en "Preparing…",
  zh "正在准备……" (same strings as `umum.menyiapkan`), with `lang="en"` / `lang="zh-CN"` on the `<p>` so a screen reader uses the right voice. Tested for the six combinations (stored x query: `?lang=id` overrides stored `en`; `?lang=en`; stored `zh`;
  stored `en`; none -> id), all correct. Known and accepted: when legacy mode is off, `main.tsx` flips zh to id after /api/config; the pre-JS screen may say zh for that short moment. Priority: med.

- [D-69] Scope: route `/` only, not rendered elsewhere · The block's script checks `location.pathname` against the base path with the SAME test as the existing D-59 preload (`p===b||p+'/'===b`, `b='%BASE_URL%'`) and only then takes the node out of the `<template>`
  (a `<template>` is inert and never rendered). Measured on the production page: node and `__lepasPra` exist on `/` and `/?lang=en`; on `/host`, `/join`, `/projector`, `/cerita`, `/cerita/auto-2`, `/acara/join`, `/kenalan`, `/room/ABC123`, `/cms`
  there is no `#pra-pemuat` in the DOM, no `__lepasPra`, no `aria-busy` on `#root`. Priority: high.

- [D-70] Timing: 400 ms show-delay, then at least 600 ms on screen · Without a delay, a fast link would flash the pre-JS screen on every cold load (the same flicker D-62 removed). So the node is inserted only if the app has not claimed the page after
  **400 ms**, and once shown it stays at least **600 ms from its first painted frame** (the script records `window.__praT` in a `requestAnimationFrame` after insertion) before the 200 ms fade. Measured: **fast link (no throttle):** the app is up at
  15 ms, no pre-JS node was ever inserted, no flicker. **Medium (1.5 MB/s):** node at ~660 ms, painted ~700 ms, held ~710 ms, fade 281 ms, homepage. **Slow (1.6 Mbps):** cream at first paint (776 ms), loader painted at ~1.15 s (first contentful
  paint 1.15-1.18 s, was 4.03 s), held until the app takes over at ~4.8 s, fade, homepage. The short cream gap before the loader (0.4 s after the script runs) is deliberate. Priority: high.

- [D-71] Handover: the pre-JS node IS the overlay; React only releases it (recommended) · One function owns the node: `window.__lepasPra(f)`: `f = 1` = wait until the node has been on screen 600 ms, then fade it (`data-selesai`, the same 200 ms CSS as the
  React overlay, instant under reduced motion) and remove it after 260 ms; `f = 0` = remove at once (or just cancel the 400 ms timer if the node was never inserted). It also clears `aria-busy` on `#root`. What PemuatAwal does (Fullstack):
  (a) **decision "show" (sprite late) and the pre-JS node exists:** ADOPT it: do not render the portal; keep `#root` inert + `aria-busy` and the focus hold exactly as today; when the essentials are ready (or the 2000 ms cap from mount) call `__lepasPra(1)`.
  The inline code enforces the 600 ms minimum from the pre-JS first paint, so React's own minimum logic only applies when it renders its own overlay. (b) **decision "skip" (sprite ready):** `__lepasPra(1)`: the pre-JS screen fades over the complete homepage
  (and still honours the 600 ms minimum). (c) **no pre-JS node yet** (the JS arrived before 400 ms): at mount call `__lepasPra(0)` to cancel the pending 400 ms timer so the pre-JS screen can never appear after React took over; PemuatAwal then behaves exactly as it does today
  (own overlay if the sprite is late). Reasons for adoption over replacement: one node, no duplicated Raki, and the bar's lit segment and Raki's float do not restart at the handover. (d) **Landing never mounts** (a player resumed into `/lobby`, `/main` etc. by
  `PhaseRouter`, or any redirect away from `/`): add one effect in `App` that calls `__lepasPra(1)` when the route is not the homepage. Type the globals: `interface Window { __lepasPra?: (f: 0 | 1) => void; __praT?: number }`.
  **Tested (React side emulated from outside, same calls):** *adopt:* pre-JS node painted from 1.1 s, home mounted under it at 4.8 s, fade at 5.4 s, gone 5.7 s, **0 frames with no overlay** and no jump; *skip:* node fades the moment the homepage is mounted
  (after its minimum) over the complete page, 0 blank frames; *replace* (alternative, not recommended): the node is removed in the same frame the React overlay appears, 0 frames with neither. Priority: high.

- [D-72] Failure: never stay forever · If the bundle never runs or errors, a 15 s timer inside the same script replaces the status text with a short message (id "Memuat terlalu lama. Periksa koneksi lalu muat ulang halaman.", en "Taking too long. Check your
  connection and reload the page.", zh "加载时间过长。请检查网络后重新加载页面。"), hides the bar and clears `aria-busy` (measured with the JS bundle blocked: text changed at 15.7 s, bar `display:none`, busy removed); the node stays so the user is told what to do,
  and `__lepasPra` still removes it if the app wakes up later. If JavaScript is off, the script never runs, the template is never rendered, and the existing `<noscript>` message is the only content (unchanged). If the Landing chunk fails after the entry JS ran,
  the same 15 s timer fires (the node is only released by Landing or by the App route effect). Priority: high.

- [D-73] Motion and reduced motion · The bar is pure CSS from the main stylesheet (`lp-seg` 1.2 s `steps(1)`, one lit segment, Raki's existing float). Before the JS runs there is no `data-gerak` attribute, so the rule shape
  `@media (prefers-reduced-motion: reduce) { :root:not([data-gerak="penuh"]) ... }` reduces to the media query alone: with reduced motion the bar is static (all four segments lit at 55%), Raki is still and the fade is instant (the pixel-identical test above
  ran in this mode). Once the JS runs, `siapkanGerak()` sets `data-gerak="penuh"` when the user turned animations on in the app, and the React override takes over (animations resume); that is the expected, documented hand-off. Priority: med.

- [D-74] Accessibility · The status `<p>` keeps `role="status"` (inserted with the node; a region inserted together with its text is not reliably announced, so this is best effort like the React version) with the right `lang`; `aria-busy="true"` is on `#root` (the content
  being prepared, never on an ancestor of the status text, which would mute it), set on insertion and cleared by `__lepasPra`; the wordmark, Raki and bar are `aria-hidden`; nothing focusable exists in the overlay or before the app mounts, so there is no focus trap;
  scrolling is locked by the existing `html:has(.lp-pemuat){overflow:hidden}` rule. Priority: med.

- [D-75] Budget · Measured on the built `client/dist/index.html`: **804 B -> 2,307 B gzip = +1,503 B** (raw +3,451 B): template 1,937 B raw (the React markup incl. Raki), script 1,221 B raw. That is 1.47 KiB, at the 1.5 KB target. If a few bytes are needed:
  dropping the zh timeout text saves 94 B gzip (zh would fall back to id), dropping Raki saves 538 B (not recommended, D-67). No new request, no CSS, no font, no asset; the block is parsed with the HTML so it costs nothing on the JS or CSS bundles.
  Known and accepted: the first paint still waits for the render-blocking 10.7 KB gzip main stylesheet (776 ms at 1.6 Mbps); the loader appears about 0.4 s after the script runs (D-70), so on the slowest link there is about 1.1 s of cream before it, down from 4 s. Priority: med.

- [D-76] Constraints for Fullstack (binding) · 1. Edit `client/index.html` only for the block (place it after `<div id="root"></div>`, use `'%BASE_URL%'` in the path test, keep the D-59 preload script as is) plus the small React hooks of D-71 in `PemuatAwal.tsx` and `App.tsx`.
  2. The template must stay a byte-for-byte copy of the React overlay markup (regenerate from the rendered `.lp-pemuat` if PemuatAwal changes; the support file says how). 3. No inline CSS, no new colours, no new i18n keys. 4. Verify on the PRODUCTION build (the block is
  not applied by the dev server's `%BASE_URL%`, check it there too). 5. Landing/Join/other routes untouched.

### Tested block (the exact file is `team/specs/T-011-pra-pemuat-block.html`; the template's `<svg>` is the exact Raki markup React renders, abbreviated here)

```html
<template id="pra-tpl"><div class="lp-pemuat" id="pra-pemuat"><div class="lp-pemuat-isi"><div class="mrk" aria-hidden="true"><span class="mrk-raksa">RAKSA</span><span class="mrk-game">GAME</span></div><span class="lp-pemuat-raki" aria-hidden="true"><svg class="anim-melayang" width="80" height="80" viewBox="0 0 64 64" ...exact Raki markup...></svg></span><div class="lp-pemuat-bar" aria-hidden="true"><i></i><i></i><i></i><i></i></div><p class="lp-pemuat-teks" role="status">Menyiapkan…</p></div></div></template>
<script>(function(){try{var b='%BASE_URL%',p=location.pathname;if(p!==b&&p+'/'!==b)return;
var d=document,r=d.getElementById('root'),T=d.getElementById('pra-tpl'),n,s,k,q=/[?&]lang=(id|en|zh)/.exec(location.search),l=q&&q[1];
try{l=l||localStorage.getItem('raksa:bahasa')}catch(e){}
function show(){n=T.content.firstChild;s=n.querySelector('p');var x={en:'Preparing…',zh:'正在准备……'}[l];if(x){s.textContent=x;s.lang=l=='zh'?'zh-CN':l}
d.body.insertBefore(n,d.body.firstChild);r.setAttribute('aria-busy','true');requestAnimationFrame(function(){window.__praT=performance.now()});
k=setTimeout(function(){s.textContent={en:'Taking too long. Check your connection and reload the page.',zh:'加载时间过长。请检查网络后重新加载页面。'}[l]||'Memuat terlalu lama. Periksa koneksi lalu muat ulang halaman.';n.querySelector('.lp-pemuat-bar').style.display='none';r.removeAttribute('aria-busy')},15000)}
var w=setTimeout(show,400);
window.__lepasPra=function(f){clearTimeout(w);if(!n)return;clearTimeout(k);function g(){r.removeAttribute('aria-busy');if(f){n.setAttribute('data-selesai','');setTimeout(function(){n.remove()},260)}else n.remove()}
f?setTimeout(g,Math.max(0,600-(performance.now()-(window.__praT||performance.now())))):g()}
}catch(e){}})();</script>
```
(Bug found and fixed while testing, worth knowing: the regex must not contain a `\b` written through a string template: it silently became a backspace character; the file above has none.)

### Sketch (360x740, 1 char ~ 4 px; identical to the React loader, so the same picture before and after the handover)

```
 t=0..~1.1s (slow link)      t=~1.15s .. app takes over (~4.8s)                 t=handover               t=+200ms fade
 +----------------+          +----------------+                                 +----------------+       +----------------+
 |  cream         |          |                |                                 | (same screen,  |       | complete       |
 |  (first paint  |          |  RAKSA | GAME  |   34px wordmark                  |  bar keeps     |       | homepage       |
 |   776 ms,      |   -->    |     ,___,      |   Raki 80px (floats)            |  stepping;     |  -->  | (hero, Join,   |
 |   no content   |          |     (o,o)      |                                 |  node adopted  |       |  Mode Cerita)  |
 |   yet)         |          |  [] [] [] []   |   4-segment pixel bar           |  by React)     |       |                |
 |                |          |   Menyiapkan…  |   status, role=status           +----------------+       +----------------+
 +----------------+          +----------------+                                  fast link: no node at all (app in <400 ms)
```

### Measurements (production build, 360x740 DPR 2 unless noted)

| case | first paint | loader painted | app takes over | handover | blank/gap frames |
|---|---|---|---|---|---|
| today (no pre-JS) | 776 ms (cream) | React loader at 4.77 s | 4.77 s | n/a | cream until 4.0 s |
| slow 1.6 Mbps, pre-JS block | 776 ms (cream) | ~1.15 s | ~4.8 s | adopt / skip / replace | 0 frames with no overlay after it appears |
| medium 1.5 MB/s | 292 ms | ~0.7 s | ~1.4 s | skip: held ~710 ms then 281 ms fade | 0 |
| fast (no throttle) | 76 ms | never inserted | 15 ms | n/a | none (no flicker) |
| gzip cost of index.html | 804 B | | | +1,503 B (2,307 B) | |
| pixel match (reduced motion) | | | | 360 id, 390 en, 1280 zh: rects identical, PNG MD5 identical | |

### Review checklist for step 3 (Designer review) and QA
- Production build, 360x740 DPR 2 and 390x844 DPR 3, whole-page throttle 1.6 Mbps / 150 ms, cache off AND a warm second visit: screenshot series (50-100 ms): cream, loader painted ~1.1 s (wordmark, Raki, bar stepping, status), handover frame(s), complete homepage;
  an rAF recorder shows no frame without an overlay between the node's first paint and the homepage reveal; the bar's lit segment does not restart at the handover (adopt).
- Fast link (no throttle) and a LAN/Tailscale run: the pre-JS screen does not appear (no flash); medium link: 600 ms minimum honoured.
- Three languages (id/en/zh, `?lang=` and stored `raksa:bahasa`): text and `lang` attribute; zh-then-id flip with legacy off noted.
- Scope: no `#pra-pemuat` on /host, /join, /projector, /cerita, /cerita/auto-2, /acara/*, /kenalan, /room/*, /cms; a player resumed into /lobby or /main: the App effect removes it (no stuck screen).
- Failure: JS blocked -> 15 s message (id/en/zh), bar hidden, `aria-busy` cleared; JS disabled -> only the existing noscript message; Landing chunk blocked -> 15 s message.
- Reduced motion: static bar, instant fade, `?gerak=ikut` and `?gerak=penuh` after the JS runs; pixel-identical pre-JS vs React overlay (rects and PNG MD5) at 360, 390, 1280.
- A11y: `role=status` with the right `lang`, `aria-busy` on `#root` only, no focusable elements, page behind does not scroll.
- Size: gzip of the built index.html <= +1.5 KB (expect about +1,503 B); homepage composition from T-003..T-010 unchanged; `npm run test:client` and `npm run test:e2e` pass.

---

## T-011 — review (2026-11-15)

Reviewer: Designer · Build: production build in client/dist (20:57, newer than the sources) on `npm start` :4000 (`RAKSA_LEGACY=on`, started and stopped by me) · No source edited.
Method: read team/HANDOFF.md T-011, the diffs of client/index.html, PemuatAwal.tsx and App.tsx, the guard test (I ran it: 2/2 pass); checked that the `index.html` script and template are **byte-identical** to the block I tested
(team/specs/T-011-pra-pemuat-block.html); then ran my own CDP checks on the real, un-rewritten page (per-animation-frame recorder, whole-page throttle), not Fullstack's harness.

### Verdict: PASS. No open items for Fullstack (two low notes for QA/Lead below).

### Results (measured)
1. **Slow cold `/` (1.6 Mbps whole page, 150 ms RTT, cache off), 360x740, id / en / zh:** first contentful paint **1,368 / 1,328 / 1,312 ms and it is the loader** (was 4,028 ms of blank cream); node inserted at ~1.12-1.15 s; the app's JS finished at
   ~4.1 s and the homepage mounted under the loader at ~4.73-4.75 s; the node starts fading the same frame and is gone ~280 ms later (about 5.0 s). **0 frames with no overlay** from the node's first paint to the homepage, **no second React overlay at any
   frame** (max 0), and the `.lp-pemuat-isi` rectangle is the same single value for the whole run (93.6,238 172.7x204.8): it is the same node, so nothing moves at the handover. Text and `lang` per language: "Menyiapkan…" (id, inherits the page
   language), "Preparing…" with `lang="en"`, "正在准备……" with `lang="zh-CN"`; `aria-busy="true"` on `#root` while shown, cleared afterwards.
   **Pre-JS vs React overlay, pixel check under reduced motion:** 360x740 id, 390x844 en, 1280x800 zh: PNG MD5 of the pre-JS screen (slow link) equals the MD5 of React's own overlay (fast link, sprite held 1.5 s) in all three
   (ead183dbf7, 3cdcc07780, 96939fe2da), the same hashes as in my spec test.
2. **Fast cold `/` (no throttle):** the node is never inserted (homepage at 364 ms, FCP 88 ms), no flash. **Medium (1.5 MB/s, sprite held 1 s):** node painted ~575 ms, adopted when the homepage mounted at ~1.0 s, fade at 1.2 s = **624 ms on screen**,
   gone 1.45 s, released once, no second overlay. **Late sprite (slow, sprite held 15 s):** adopted, released **2,032 ms after the homepage mounted** (the 2000 ms cap), gone 0.25 s later, no second overlay; `inert` and `aria-busy` cleared.
3. **JS blocked:** after ~16 s the status text reads the "too long" message in the page language (id "Memuat terlalu lama. Periksa koneksi lalu muat ulang halaman.", en "Taking too long. Check your connection and reload the page.", zh "加载时间过长。请检查网络后重新加载页面。"),
   bar `display:none`, `aria-busy` cleared (not stuck busy), node stays so the user is told what to do. **Reduced motion before JS:** bar `animation: none` (static).
4. **Scope:** on `/host`, `/projector`, `/join`, `/cerita`, `/cerita/auto-2`, `/acara/join`, `/kenalan`, `/cms`, `/room/ABC123` there is no `#pra-pemuat` and no `aria-busy` (JS blocked so a stray node would stay visible). **Resumed player landing off `/`:** I
   could not drive a live PhaseRouter redirect, so I emulated the same condition: with the pre-JS node shown I changed the URL to `/kenalan` right when the React root was created; the App effect released the node (removed 184 ms later), the Kenalan page
   rendered, nothing left busy or inert. The PhaseRouter navigation itself is NOT run: note for QA (resume a player into /lobby or /main on the slow link and check no stuck loader).
5. **Anti AI-slop and composition:** it is still the RAKSA loader (wordmark, the Raki owl floating, the 4-segment pixel bar, status on the cream page colour), the same screen as the React one, not a generic splash. Homepage composition after the handover is unchanged:
   Masuk bottom 565.7 (360x740 id) / 577.7 (390x844 en) / 777.9 (800x1024) / 514.7 (1280x800), frame 20,78 -> 340,222 and the T-008 positions, no overlay left, `<html>` overflow back to visible, no horizontal scroll.
   Code points: the `index.html` block is unchanged from my tested one, the template is guarded by `pemuatPra.test.tsx` against drift from the React markup, PemuatAwal adopts the node (no portal) and the App route effect uses `0` (remove at once) instead of my `1` (fade):
   an accepted improvement, nobody needs a fade when the homepage never mounts.

### Step 6: the owner's wish ("it kinda loads and downloads some assets, then the homepage appears")
**Yes on the slow link: T-010 + T-011 now show the owner a branded loader from about 1.3 s (it was about 4 s of blank cream) through the ~5 s bundle download and a fade into the complete homepage, with Episode 2 rooms shown as a blurred placeholder instead of a flat square;
what is still missing is any real progress indication (the bar is indeterminate by design) and the first ~1.3 s of cream before anything paints.**
(On a fast link nothing shows at all, by design, so a LAN test will not reproduce the loader.)

### Items
- [D-77] Resumed player (PhaseRouter redirect off `/`) · not driven end to end (emulated via the same App effect) · QA: resume a player into /lobby or /main on the 1.6 Mbps throttle and confirm the loader is released at once and focus/inert are clean · low.
- [D-78] Slow link, first ~1.3 s · cream before the loader: the first paint waits for the render-blocking 10.7 KB gzip stylesheet (~0.78 s at 1.6 Mbps) and the 400 ms show-delay adds the rest · accepted trade-off (no flicker on fast links); only revisit if the owner still finds the start too blank, e.g.
  by moving the few loader rules inline (extra bytes in index.html) and shortening the delay to ~250 ms · low.

### Not verified by me
Real devices and a real PhaseRouter resume (D-77), the legacy-off zh-then-id text flip (accepted in D-68), Fullstack's bundle-size numbers (their evidence: +1,482 B gzip in index.html, Landing +0.32 KB), and `npm run test:e2e` (their log; I ran only the 2 guard tests, 2/2 pass).

---

## T-013 — Stage 1 concept (2026-11-15)

Author: Designer · Art produced, not only notes · No code edited (`client/`, `tools/`, BOARD untouched, nothing committed).
Deliverables: `character/hendra-pixel-v1/` (master, 6 poses, 6 expressions, all RGBA full size, README, PROMPTS-IMAGEGEN, preview.html) and `character/kantor-ep2-pixel-v1/` (room reference 2720×1536, README with layer plan + camera mapping).
**Preview for the owner's phone:** `character/hendra-pixel-v1/preview.html` (Hendra next to Miss Raksa v4 at the same scale, white/cream/green/dark backgrounds, 44–96 px avatars, room reference at the bottom).

### How the art was made
Canva image generation with two references (Miss Raksa v4 master = style, old `hendra-480.webp` = identity), then Canva background removal, then export of exact-size pages as lossless transparent PNG (the only path to full-size bytes; media links give 200 px thumbnails). Verified with ffprobe + alpha histogram: master 1024×1536 RGBA (67.9 % transparent / 3.4 % edge), poses and expressions 1536×1024 RGBA (53 % transparent / 6.4 % edge), room 2720×1536 RGB. Full prompts in PROMPTS-IMAGEGEN.md.

### Pak Hendra sheet (D-79)
Indonesian man ±45, haulage owner: grey temples, moustache, tan skin, heavier build; cream short-sleeve polo with chest pocket, open navy field vest, brown belt and trousers, brown work shoes, black phone in the left hand. No yellow/green so he never reads as staff. Master faces viewer's LEFT (Miss Raksa stands left, facing right). Poses (waist-up, 3×2): cemas (arms crossed) · panik (both palms up) · kecewa (hand on neck) · tenang (hands at waist) · senang (thumbs-up, open smile) · menjelaskan (phone held up, pointing). Expressions (3×2): panik · cemas · kecewa · tenang · senang · kedip. Identity is continuous with the old illustration (moustache, grey, cream shirt, brown trousers) so returning players see the same man. Priority: high (owner sign-off).

### Expression mapping (old `hendra-*` → new sheet cell)
| old file | script `ekspresi` | new cell (col,row) |
|---|---|---|
| hendra-panik | bingung | panik (1,1) |
| hendra-cemas | cemas | cemas (2,1) |
| hendra-kecewa | kesal | kecewa (3,1) |
| hendra-tenang | netral, lega | tenang (1,2); recommend routing `lega` → senang (2,2) |
| hendra-senang | senang | senang (2,2) |
| — | blink variant | kedip (3,2) |
Chat avatar (cerita/hp): crop from the expression sheet, default tenang (1,2), tense scenes cemas (2,1); approximate face boxes in the README, pipeline measures the real alpha box.

### Kantor room (D-80)
Reference continues the homepage hero counter (cream top, green grooved front, wood wall, yellow claim folder, phone, plant) in the Episode 1 room palette; nameplate board left BLANK for runtime text "Layanan Klaim". Layer plan at 400×225 art px: `latar` (wall, blank board, poster, clock, drawers, floor), `meja` (alpha, hides characters from the waist down), props `map`, `telepon`, `kartu`, `tanaman` (alpha, ≤1 KB each), optional `depan`. Camera: Miss Raksa behind the counter left-centre facing right, Hendra in front right-centre facing left, 120 art px between faces (same as Episode 1 `meja`); phone crop ±1000 world units centred between the heads. Full table in `character/kantor-ep2-pixel-v1/README.md`.

### Camera mapping, `dekat` → v3 (D-81)
`hadir` both → `lokasi:'meja'`, mentor standing (recommend `berdiri`/`berdiri-persilakan`, ignore `bisaDudukTurun`: a service counter has no chair), nasabah `berdiri` facing left; `hadir` mentor only → nasabah `null`; `telepon:'hendra'` → same room, nasabah `lewatTelepon`, prop telepon in hand; close-up `dekat` has no equivalent: expressions carry through the 44–64 px face and the dialog avatar, camera stays; `objek` → `prop` on `meja`. **Owner decision needed:** Miss Raksa standing at the counter (recommended, matches homepage) or seated as in Episode 1.

### Asset accounting (compressed bytes of final atlas/room PNGs, not sources) (D-82)
Basis: Episode 1 production files (`miss-raksa.png` atlas 20.0 KB, `bu-rina.png` 54.5 KB, `ruang-meja-latar.png` 14.1 KB) and measured downsamples of the new art: room at 400×225 with a 48-colour palette = **22.2 KB**; master at 184 art px, 40 colours + alpha = **5.3 KB** per body frame; pose sheet at atlas scale 20.4 KB, expression sheet 11.3 KB. Estimate Stage 1: Hendra atlas (≈8 body frames + 6 faces × blink/talk variants) **45–60 KB**, kantor room + 4 props **≈ 25 KB**, Miss Raksa extra poses **≈ 8 KB** → **≈ 80–95 KB**. Whole episode (Stage 2 adds 4 rooms ≈ 25 KB each, trailer prop ≈ 6 KB, Rudi/Darto/admin/tol/polisi as silhouettes or ≈ 15 KB each if drawn) → **≈ 200–290 KB**, inside the 400 KB gate with margin; the gate is only at risk if every side character gets a full atlas. Measurement basis for Fullstack: gzip/brotli is irrelevant for PNG; report raw file bytes of `client/src/cerita/seni/piksel/*ep2*` from the build output.

### Open questions for Fullstack's pipeline (`tools/piksel/bangun-hendra.mjs`, v4 pattern) (D-83)
1. Native pitch: measure like `miss-native.mjs` (v4 master was 7.34 px/art px; Hendra master looks ≈ 8; sheets differ). 2. Head lock: Hendra's head is proportionally smaller than Miss Raksa's; decide whether to scale his head to the 54-art-px rule or keep adult-male proportion (recommend keep, verify at 44 px). 3. Facing-right variant: not generated; do not mirror (pocket, phone hand, buttons flip). 4. Missing frames: walking in/out, sitting, phone-at-ear: only needed if the kantor cue uses Episode 1 `masuk`/`duduk`; Stage 1 can start with standing only. 5. Alpha sheets are ≈2 % rescaled vs the `-putih` sheets (Canva trim); use `-putih` for geometry registration if needed. 6. Room: downsample 2720×1536 → 400×225 with area filter, palette ≤48, split by the layer boxes; blank board gets `teksPapan`.

### Stage 2 list
bengkel (workshop bay, lift, tool wall), tol (toll-road shoulder at night, barrier, trailer crash as a room feature not a prop), pool (truck yard, parked trailer prop, office hut), wawancara/trailer (interview room or trailer cab), plus props: trailer (depth-sorted), police letter, claim documents; characters Rudi, Darto, admin bengkel, petugas tol, polisi (decide atlas vs named silhouettes against the budget).

### Anti AI-slop
Same pixel language as Miss Raksa v4 and the homepage hero; no text, logos, gradients or glow baked in; costume differentiates roles by colour (navy/cream vs RAKSA gold); props are story props (claim folder, phone), not decoration.

---

## T-013 — Stage 2 concept (2026-11-15)

Author: Designer · Art produced as in Stage 1 (Canva generate → background removal where alpha is needed → exact-size page → lossless PNG export, verified with ffprobe + alpha histogram) · No `client/`/`tools/` edits, BOARD untouched, nothing committed.

**Deliverables and preview paths (open on the phone):**
- `character/bengkel-ep2-pixel-v1/preview.html` · `character/tol-ep2-pixel-v1/preview.html` · `character/pool-ep2-pixel-v1/preview.html` (shows the trailer prop composited) · `character/wawancara-ep2-pixel-v1/preview.html`
- `character/trailer-ep2-pixel-v1/preview.html` (alpha check, 150 px size test)
- `character/tokoh-samping-ep2-pixel-v1/preview.html` (six side characters beside Hendra, 64 px avatars)
Each folder: reference/sheet PNG, README (layer plan, props, camera, cue mapping or sheet notes + honest limits), PROMPTS-IMAGEGEN.md, thumb/.

### Files (all full size)
| file | size | alpha |
|---|---|---|
| bengkel-ep2-referensi-v1.png | 1680×944 RGB | n/a (room) |
| tol-ep2-referensi-v1.png | 1680×944 RGB | n/a |
| pool-ep2-referensi-v1.png | 1680×944 RGB | n/a |
| wawancara-ep2-referensi-v1.png | 1680×944 RGB | n/a |
| trailer-ep2-sheet-v1.png (intact + damaged, facing left) | 1456×1088 RGBA | 52.0 % transparent / 5.3 % edge |
| tokoh-samping-badan-v1.png (6 waist-up) | 1536×1024 RGBA | 55.3 % / 6.2 % |
| tokoh-samping-ekspresi-v1.png (6 heads, 2nd expression) | 1536×1024 RGBA | 51.1 % / 6.8 % |

### Per-room layer plan and camera (D-84) — details and boxes in each README
| room | script use | layers (400×225 art px) | horizon | slots (world 1600) | cue mapping |
|---|---|---|---|---|---|
| bengkel | K05, `hadir:['admin']` | `latar`; optional props kotak-alat, rak-ban | 45 % | admin x≈1000 facing left; 2nd x 700 | nasabah-slot = admin `berdiri`, mentor null |
| tol | Bima's inspection, `hadir:['bima']` (crash was at night; scene is a daylight visit, so drawn late afternoon) | `latar` (barrier with cracked segment + tyre mark = the story point); `pagar` guardrail in front; optional cones | 43 % | Bima x≈560 facing right; keep cracked segment (x≈1000–1300) in the phone crop | nasabah-slot = bima `berdiri`, `pandang:'depan'` when pointing |
| pool | K04 `hadir:['rudi']` + episode cover `['hendra']` | `latar`; `benda-trailer` (damaged prop, x 230–380 art px, wheels y≈170, z between kerb and standing characters) | 58 % | Rudi x≈560, Hendra x 700, trailer right | nasabah-slot = rudi/hendra `berdiri`; `prop.trailer:'rusak'` always on in pool |
| wawancara | K09, 1–3 witnesses (`bima`, `bima+darto`, `tol+bima+polisi`) | `latar` (blank whiteboard, blank binders); `meja` alpha layer (people in front of it stay whole) | 45 % | 830 / 650+1010 / 520+830+1140, feet y≈870 | all `berdiri`; **three on stage needs a third slot in `CueAdegan`** (open question) |
Kantor (Stage 1) unchanged. Trailer decision: **prop, not a room feature** (pool only; not drawn at tol, not at wawancara).

### Side characters (D-85)
On stage besides Hendra/Miss Raksa (from `episode.ts` `hadir`): **rudi, bima, darto, admin, tol, polisi** (six). Budget choice: waist-up stills + one second-expression head each (no atlas, no second facing, no blink): bodies sheet + expression sheet, 3×2 each, scale/grain anchored to the Hendra master. Expression map: face 1 (bodies) ← `netral, tersenyum, senang, lega`; face 2 (expressions) ← `cemas, serius, bingung, kesal`. Feet: generate the lower body procedurally from each palette (2–3 KB) or stand them behind furniture. Known drift between the two sheets (facial hair on Bima, Petugas tol, Polisi): bodies sheet is canonical; fix at pixel normalisation or re-run the expression sheet with the bodies sheet as reference. Police cap/badge are generic emblems with no lettering (not a real insignia) — Lead to confirm acceptable.

### Episode-wide asset accounting (compressed PNG bytes, measured downsamples at atlas/room scale) (D-86)
| asset | basis | estimate |
|---|---|---|
| kantor room (Stage 1) | 400×225, 48 col | 22.2 KB (+ props ≈ 3 KB) |
| bengkel | same | 25.8 KB |
| tol | same | 32.3 KB |
| pool | same | 30.5 KB |
| wawancara | same | 21.0 KB |
| layer overhead (alpha meja/pagar/props across rooms) | | ≈ 12 KB |
| trailer prop, damaged only / both | 170 art px, 32 col | 3 / 5.6 KB |
| Hendra atlas (Stage 1 estimate) | 8 body frames × 5.3 KB + faces | 45–60 KB |
| Miss Raksa extra poses | | ≈ 8 KB |
| six side characters | bodies 19.0 KB + heads 11.6 KB + feet ≈ 3 KB | ≈ 34 KB |
| **Episode total** | | **≈ 235–255 KB** (gate 400 KB; ≈ 145 KB headroom) |
Measurement basis for Fullstack: raw bytes of the shipped `client/src/cerita/seni/piksel/*ep2*` PNGs in the build; not gzip, not source PNGs. Tol is the heaviest room (trees + markings); flatten the tree band to two tones if a room must shrink.

### Open questions for Fullstack
1. Third stage slot for the three-witness wawancara scene (`CueAdegan` extension) or stage them as two + one on the dialog avatar.
2. Side characters are waist-up: procedural lower body vs furniture occlusion (recommend procedural).
3. Trailer prop registration in pool: ground line y≈170 art px, depth between kerb (z 10) and characters (z 30+); cover scene uses the same.
4. Room pitch: all four rooms were generated at 1680×944 (÷4.2 to 400×225) vs kantor at 2720×1536 (÷6.8); `bangun-ruang.mjs` must downsample each from its own source size with the area filter, palette ≤ 48.
5. Tol time of day: daylight (readable) vs night tint — owner taste; geometry is the same.
6. Expression-sheet facial-hair drift: fix in pixel pass or regenerate.

### Step-3 review checklist (Designer review + QA screenshots)
Per room, production build, 360×740 DPR 2 and 390×844 DPR 3 + 1280×800: first frame of the scene (placeholder, if T-010 gate still applies), settled frame with the scripted characters in place; check: horizon/feet line consistent across rooms, characters not clipped by `meja`/`pagar` wrongly, the cracked barrier visible in the tol phone crop, the damaged trailer visible with Rudi in the pool crop, three witnesses readable in wawancara (or the agreed fallback), no baked text/logo anywhere, palette ≤ 48 per room, pixel grain matches Hendra/Miss Raksa (no smooth blur), no WebKit rectangle artefacts; side characters: identity matches the bodies sheet, both faces distinguishable at 44–64 px, feet treatment looks intentional; totals: shipped bytes table in HANDOFF ≤ 400 KB; id/en/zh full playthrough; T-003..T-011 homepage untouched.

---

## T-013 — Stage 1 review (2026-11-15)

Reviewer: Designer · Build: production build in client/dist (22:16, newer than the 22:10 assets) on `npm start` :4000 (`RAKSA_LEGACY=on`, started and stopped by me) · No source edits.
Method: read team/HANDOFF.md "T-013 Stage 1"; drove the same saved states as Fullstack's harness (team/evidence/T-013/states.json via `raksa:cerita`) with my own CDP scripts: kantor `mentor` at 360×740 DPR 2 (id), 390×844 DPR 3 (en), 1280×800 DPR 1 (zh); `berkas`; WhatsApp `tel-tenang`/`tel-cemas`/`tel-panik`; `bima` (illustrated fallback) and `pool` (illustrated, next location); a 12 s canvas-hash probe for blink under normal / reduce+`?gerak=ikut` / reduce+`?gerak=penuh`; and the atlas review sheet `character/piksel/hendra/tinjau-wajah.png`.

### Verdict: FIX NEEDED (one composition blocker, small); everything else PASS

### 1. Kantor scene vs my reference and Episode 1
- **Room, palette, grain, props:** the 400×225 room is my reference, faithfully downsampled: wood wall, blank green nameplate board, poster, clock, drawers, plant, cream counter top with the desk phone and card holder, green grooved front, tiled floor; 48-colour palette sits next to Episode 1's rooms without a seam; pixel grain matches Miss Raksa v4 and the Hendra atlas (no blur, no filter, integer device-pixel canvas). The dialogue box, name plate chip and "Lanjut" are Episode 1's. It reads as one game. PASS.
- **Miss Raksa:** standing, facing right, behind the counter, hidden from the waist down by the `meja` layer; head ≈ 36 art px against a 17-art-px-tall counter top: the scale is right and the pose matches the homepage hero. PASS.
- **Camera:** phone crop keeps her head, the phone and the counter; 1280 shows the wider room. PASS, except:
- **Nameplate overlap, confirmed at ALL three viewports:** her head covers the right half of the board; the runtime text reads "Layanan K…" (id) at 360, 390 and 1280. Her feet are at world x 560 (art px 140); the board spans art px 57–121; her head (≈ 122–158) sits on the board's right end and the text is centred under it. **[D-87] blocker:** move Miss Raksa's `balikMeja` place from x 560 to **x 720** (art px 180; head ≈ 162–198) so the whole board is clear on her left and she still stands left of the frame's centre, 80 art px from Hendra's slot at 1040 (was 120; still ≥ 2 head widths, fine for a counter). Alternative if Fullstack prefers not to move her: shift the board to the wall segment right of her (art px 200–264, under the poster) in `bangun-ruang-ep2.mjs`; do NOT shrink the text. Re-check at 360/390/1280 that the full "Layanan Klaim Raksa" / "Raksa Claims Service" / zh string fits the board width (the longest string decides; `fillText` max-width already clamps).

### 2. Hendra as chat/dialog avatar
- The round pixel portrait in the Obrolan header is the tenang face by default and the cemas face in tense beats (`Status: Cemas`), crisp at ≈ 64 px on 360 and ≈ 76 px on 390 DPR 3; identity (grey temples, moustache, cream polo, navy vest) matches the canonical sheet; crop shows hair top to collar. The five atlas faces (tinjau-wajah.png) are faithful to the expression sheet and distinct at small size; `lega → senang` per the owner. PASS.

### 3. Transitions pixel → illustrated (Stage 1 coexistence)
- Kantor (pixel) → pool (illustrated): a visible style change (pixel room with pixel Miss Raksa, then the smooth illustrated yard with the blue illustrated truck and smooth Rudi). Acceptable for Stage 1 as agreed; Stage 2 removes it by converting pool/bengkel/tol/wawancara.
- **Most jarring case: K07 Bima in the OLD illustrated kantor.** The same location appears in two different looks (smooth wood/candle office vs the pixel counter) within one episode. Stage 2 must give Bima his pixel still so K07 renders on the pixel kantor; note for Fullstack: the side-character sheet already has him (col 2, row 1).
- The T-010 blurred placeholder still shows for illustrated rooms; the pixel kantor shows wall colour then the room (≈ 30 KB) — no square, fine.

### 4. Reduced motion / data-gerak
- Canvas hash over 12 s: normal = 2 distinct frames, 6 changes (3 blinks, 100-ms frames); system reduce + `?gerak=ikut` = 1 frame, 0 changes (no blink, no mouth); reduce + `?gerak=penuh` = blinks again (`data-gerak="penuh"`). Same behaviour as Episode 1. PASS.

### 5. Anti AI-slop
Still a RAKSA game screen: hand-drawn-feeling pixel room, a single character at her post, Episode 1's dialogue chrome, no gradients/glow, no baked text (the nameplate is runtime text). PASS.

### Items
- [D-87] Kantor pixel scene, all viewports · Miss Raksa's head covers the nameplate; the location text is unreadable · fix: move her `balikMeja` place to world x 720 (or move the board to art px 200–264); verify id/en/zh text fits · **high (blocker for owner phone check)**.
- [D-88] Nameplate text · drawn with `system-ui` on the canvas; it is the only non-pixel element inside the pixel frame · fix (polish, fold into Stage 2): render the board text with the same approach Episode 1 uses for "Raksa Silver Club" (its bitmap/pixel lettering helper) or a small inline bitmap font; keep runtime translation · low.
- [D-89] K07 Bima scene · illustrated old kantor coexists with the pixel kantor · fix: Stage 2 Bima pixel still (sheet col 2,row 1) and remove the fallback for kantor · med (Stage 2 scope, not a Stage 1 block).
- [D-90] Script language · Episode 2 dialogue stays Indonesian under `?lang=en|zh` (only UI chrome translates); pre-existing (no `teks.en/zh.ts` for AUTO-2) · note for Lead/owner, out of T-013 scope · low.
- [D-91] Bytes · pre-existing: AUTO-2 pages still download all Episode 1 room PNGs + both Episode 1 atlases (~131 KB) via `sumberPiksel` import; count it in the Stage 2/3 gate or lazy-load · med (Fullstack already flagged).

### Not verified by me
Real iOS WebKit device, the owner phone check, `npm run test:client`/`test:e2e` (Fullstack reports 733/733 and e2e 0 failures), Hendra physically on stage (the script never places him in the kantor; the slot exists and is unit-tested only).

---

## T-013 — Stage 2 review (2026-11-15)

Reviewer: Designer · Build: production build in client/dist (22:42) on `npm start` :4000 (`RAKSA_LEGACY=on`, started and stopped by me) · No source edits.
Method: read team/HANDOFF.md "T-013 Stage 2" and my D-84..D-86; drove Fullstack's saved states (team/evidence/T-013/states.json) with my own CDP scripts at 360×740 DPR 2 (id), 390×844 DPR 3 (en), 1280×800 DPR 1 (zh): kantor mentor/berkas/K07 Bima, pool, bengkel (+ foto), tol (+ the next line, Bima "serius"), wawancara 1/2/3, a WhatsApp beat, the /cerita card; a 10 s canvas-hash motion probe; the atlas sheet `character/piksel/samping/tinjau-samping.png`; Fullstack's 20-frame kantor→pool series; the owner's phone screenshot `team/evidence/T-013/owner/side-characters-legs-off.jpg`. For the scale question I composited mock-ups from the shipped room PNG + my trailer sheet (not saved to the repo).

### Verdict: FIX NEEDED (3 high, 3 med, 2 low). The port itself is sound.
Confirmed working: every scene is on the pixel stage (0 `.webp`, 0 Episode 1 room PNGs in every run; only `ep2-ruang-*`, `samping`, `hendra`, `miss-raksa`), rooms are faithful to my references (layers, palette ≤ 48, grain, no baked text), the third witness slot works at all three viewports, K07 Bima is in the pixel kantor (D-89 ✔), the nameplate is clear in all three viewports and reads "LAYANAN KLAIM RAKSA" in pixel lettering (D-87 ✔, D-88 ✔), chat avatars are the pixel Hendra, and reduced motion behaves as in Episode 1.

### 1. Rooms and the outdoor scale question
- **Decision: keep the characters at the Episode 1 scale** (188–198 art px in a 225-px room). Face readability at 360 px and consistency with the kantor and Episode 1 matter more than literal scale, and Episode 1 already uses this convention (in `ruang-parkiran-latar.png` the van is ≈ 100 art px tall next to 184-px people: backdrop objects are drawn at about half the character scale and read as "further back").
- **bengkel: acceptable as is.** The admin stands in front of the kerb; the roller doors (≈ her height) read as a hall behind her. No change.
- **tol: acceptable as is.** Bima is a foreground figure on the shoulder, the cracked barrier segment and tyre mark stay in the phone crop (verified 360 and 1280). No change.
- **wawancara: good.** Table behind, witnesses in front, three faces clear at 360/390/1280, chip hidden.
- **pool: NOT acceptable (D-94).** The damaged trailer is on the same ground plane as Rudi but at backdrop scale: cab 39 art px tall vs Rudi 188, so the truck (the subject of the whole episode and of the card) looks like a toy. Mock-up tested: trailer at **450 art px wide (3×)**, cab ≈ 110 art px tall, reads as a real truck parked beside him and the cracked windscreen/crumpled bumper become legible.

### 2. Facing: the labels are wrong, the art faces RIGHT (my Stage 1 error)
Hendra's master and all side-character art are three-quarter views toward the viewer's **RIGHT** (ear on the left, nose and toes to the right), the same direction as Miss Raksa's `berdiri-kanan`. My Stage 1/2 READMEs said "faces left"; that was wrong (the generator inverted the request and I did not verify it; corrected in `character/hendra-pixel-v1/README.md` and the side-character README). So the atlas frames named `berdiri-kiri` are right-facing, and "everyone faces left" is really "everyone faces right".
What that means on screen today: **reads right by accident:** pool (Rudi on the left looks right at the truck), tol (Bima looks right at the cracked barrier), card (Hendra looks at the truck). **Reads wrong:** kantor visitor slots (K07 Bima at x 1120 looks out of the right edge, away from the counter and nameplate; Hendra would turn his back on Miss Raksa if the script ever stages him), wawancara-2 (Darto looks away from Bima who interviews him), bengkel (admin at x 1000 looks out of the frame on the phone crop).
**Decision (D-93): no new art now; rename + mirror.** Draw LEFT-facing by mirroring the frame on the canvas around the foot anchor. Mirror-safe (no lettering; only a plain pocket/patch changes side): rudi, bima, darto, admin, tol. Acceptable as an interim: polisi (plain badge/name bar swap sides) and Hendra (chest pocket, phone hand). Drawn left-facing sheets are a follow-up only if the owner notices the swapped pocket/badge.

### 3. Side characters
- Identity vs the sheets: all six match the canonical bodies sheet (Bima glasses + moustache, Darto flat cap + grey goatee, Petugas tol and Polisi clean-shaven with the right caps).
- Second expression: only two scripted beats use one (Bima `serius` at K08.2 and K10.2); verified live on K08.2: `data-pose` goes `bima:berdiri:kiri:netral` → `…:prihatin` and the concerned face shows.
- **Procedural legs: owner feedback confirmed (D-92, high).** Flat two-tone columns, no knees/shoes, too long under hand-drawn torsos. **Art fix delivered in this task:** `character/tokoh-samping-ep2-pixel-v1/tokoh-samping-badan-v2.png` (1536×2048 RGBA, six FULL-BODY figures with drawn trousers and shoes, 3×2, common foot baseline per row, same height as Hendra; name→cell table and measured alpha boxes in the README).
- Third slot: works.

### 4. Stage 1 items, transitions, avatars, motion
- D-87 ✔ (Miss Raksa at x 800, board fully visible at 360/390/1280). D-88 ✔ pixel font (see D-98 for one glyph). D-89 ✔. D-91 ✔ (no Episode 1 room PNGs or bu-rina on AUTO-2 pages).
- Pixel→pixel transition (Fullstack's 100-ms series kantor→pool): hard cut, the pool is complete within the series, no illustrated or blank frame. Acceptable; a short crossfade belongs to D-96.
- Chat: Hendra pixel portrait in the header, `hendra.png` only, 0 illustrations.
- Motion (10 s canvas hash): kantor mentor 2 distinct frames/6 changes (blink) under normal motion, 1/0 under system reduce + `?gerak=ikut`, 2/6 with `?gerak=penuh`. **Pool (and every scene without Miss Raksa): 1 frame, 0 changes: nothing moves** (D-96).

### 5. Anti AI-slop and the one sentence for the owner
Pass on style: one consistent hand-pixelled world, no gradients/glow, no baked text or logos, story props only.
**For the owner: Episode 2 now lives in the same pixel world as Episode 1 and is clearly better than the old stills, but it is not yet as lively as Episode 1: outside the office nobody blinks, moves or enters, and the side characters' legs and the toy-sized truck still need the fixes below; with those three fixes plus a little idle motion it will feel like Episode 1.**

### Fix list: blockers (high)
- [D-92] All scenes with side characters · procedural lower bodies look stiff and too long (owner) · rebuild the samping atlas from `tokoh-samping-badan-v2.png` (drawn full bodies; frame `berdiri`, foot anchor on the row baseline y=983 in each 512×1024 cell; total height 198 art px like Hendra; face `netral` from v2 bodies, `prihatin` from the v2 expression sheet registered as before) and delete the procedural legs · high. Cost measured at atlas scale: ≈ 26.2 KB for six full bodies (was 17.7 KB): +8.5 KB.
- [D-93] Facing · frames are mislabelled (`berdiri-kiri` art faces right) and no left-facing drawing exists · (1) rename the Hendra and side-character frames to `…-kanan` in the manifests/tools; (2) add mirrored drawing for `hadap: 'kiri'` (flip around the foot anchor; faces and blink strips flipped with the body); (3) set facing per scene: kantor visitors (Bima K07, Hendra if staged) → **kiri** and move kantor visitor slot 1 from x 1120 to **x 1040** (his elbow is cut by the phone crop today); pool Rudi/Hendra → **kanan**; tol Bima → **kanan**; bengkel admin → **kiri** at x 1000 (she looks into the hall); wawancara 1 → kanan; 2 → left **kanan**, right **kiri** (they face each other); 3 → left and middle **kanan**, right **kiri** · high.
- [D-94] Pool (scene and /cerita card) · truck at backdrop scale on the character's ground plane · rebuild the trailer layer from the damaged row of `trailer-ep2-sheet-v1.png` at **450 art px wide** (pitch ≈ 2.95 source px per art px, ≈ 450×124 art px, 32 colours; do NOT scale the 150-px layer ×3, the grain would not match); place it at **art x 160 (world 640), wheel contact at art y 172 (world 688)**, z 25, running off the right edge (cut in the container, never the cab; it faces left, toward Rudi); slots: 1 → **x 360** (art 90), 2 → 160 / 460; focus box = cab, **world x 640–1040, y 240–700**; phone crop must contain Rudi (art 51–127) and the whole cab (art 160–260) · high. Cost measured: ≈ 12.2 KB (was 1.8 KB): +10.4 KB. New episode stage total ≈ 164 KB of the 400 KB gate.

### Should fix in Stage 3 (med)
- [D-95] 1280 (wide frame), bengkel / tol / wawancara · the camera zooms to `maksLebih` 1.6 so characters are cut at the waist/thigh and the room loses its identity, while pool shows the whole room (its focus box) · use `maksLebih` **1.15** for the `lebar` frame on the Episode 2 rooms (or give each room a focus box: bengkel world x 80–1180 y 100–660; wawancara x 0–1600 y 60–560) so 1280 shows the room like pool does · med.
- [D-96] Liveliness, all non-kantor scenes · nothing moves (side characters have no blink/talk frames; rooms are static) · code-only life, all disabled under reduced motion: (a) blink for the six side characters (eye-closed strip per face; I can draw them, or use a 2-row eyelid in the face's skin tone over the eye box), (b) speaker "hop" 2 art px for 160 ms when a character starts a line, (c) 1-art-px idle breathing bob every ≈ 2.4 s on the speaking character, (d) 180 ms slide-in from the nearest edge when a character joins `hadir`, (e) 150 ms crossfade between rooms · med (it is the owner's original complaint: "not lively like Episode 1").
- [D-97] /cerita Episode 2 card · the scene is letterboxed inside the card (bars of the wall colour left and right at 360/390; the Episode 1 card fills the width) · use "cover" for the card: the next integer scale up and crop top/bottom, centred on Hendra + cab (after D-94) · med.

### Polish (low)
- [D-98] Nameplate pixel font · 3×5 `M` and `N` are nearly identical, "KLAIM" can read as "KLAIN" · give `M` (and `W`) a 5-px-wide glyph; the board has room (text ≈ 76 of 87 art px) · low.
- [D-99] Bengkel `foto` prop · a 12×9 art px print on the pillar is easy to miss · enlarge to ≈ 20×15 at eye height left of the admin, or show it only in the dialog attachment · low.

### Not verified by me
Real iOS WebKit and the owner phone check; a full manual playthrough in en/zh (dialogue is Indonesian in all languages, D-90, out of scope); `npm run test:client` / `test:e2e` (Fullstack: 735/735, e2e clean); Fullstack's byte table (I re-measured only my two cost estimates).

---

## T-013 — final review (2026-11-15)

Reviewer: Designer · Build: production build in client/dist (23:19) on `npm start` :4000 (`RAKSA_LEGACY=on`, started and stopped by me) · No source edits.
Method: read team/HANDOFF.md "T-013 Stage 3" and my D-92..D-99; drove the saved states (team/evidence/T-013/states.json) with my own CDP scripts at 360×740 DPR 2 (id), 390×844 DPR 3 (en), 1280×800 DPR 1 (zh): kantor mentor + K07 Bima, pool, bengkel (+ foto), tol (+ Bima's next line), wawancara 1/2/3, a WhatsApp beat, the K02 activity, the /cerita card (also 1024 and 768 wide); canvas-hash motion probes (10 s idle, 1.2 s on a new line) under normal motion, system reduce + `?gerak=ikut`, reduce + `?gerak=penuh`; read `ruang-ep2.json` slots and `samping.json` anchors.

### Verdict: FIX NEEDED — 1 high (small, desktop card only), 1 med, 2 low. The episode itself (every in-game scene, all three viewports) is PASS.
The one high item is a one-line camera choice on the /cerita card at desktop width; nothing inside the episode blocks. If the Lead prefers, a Fullstack screenshot of the card at 1280 after the fix is enough to close; no further Designer round is needed for it.

### 1. Side characters from the full-body sheet (D-92): PASS
All six stand on drawn legs with knees, hems and real shoes; the owner's "legs look off" complaint is resolved. Feet sit on one baseline with Hendra's, heights 195–198 art px match Hendra (196), and the scale reads correctly against all five rooms. Identity matches the sheet (Bima glasses + moustache, Darto cap + grey goatee, tol officer and police clean-shaven with the right caps). Viewed at 360, 390 and 1280.

### 2. Facing per scene (D-93): PASS, one spacing follow-up
- kantor K07: Bima mirrored, faces left toward the counter and the nameplate; elbow no longer cut at 360. ✔
- pool: Rudi faces right at the truck. ✔ · tol: Bima faces right at the cracked barrier. ✔ · bengkel: admin mirrored, faces left into the hall. ✔
- wawancara 1: faces right. ✔
- wawancara 2 at **610 / 1050: confirmed, keep.** Bima faces right, Darto (mirrored) faces left, they face each other with ≈ 9 art px of air between them at 360; no change needed.
- wawancara 3: left and middle face right, Polisi (mirrored) faces left. Facing is right, but **Bima and the Polisi overlap by ≈ 21 art px while the gap between the tol officer and Bima is wide** (D-100).
- Mirrored figures look right: no lettering flips anywhere; only a plain pocket/badge changes side (Polisi, Hendra: still interim, redraw only if the owner notices).

### 3. Truck, camera, motion, card, font, prop
- **Pool truck at 450 art px (D-94): PASS.** Cab is now roughly shoulder-height-plus next to Rudi, reads as a real truck, cracked windscreen and crumpled bumper are legible at 360; phone crop holds Rudi and the whole cab.
- **1280 camera cap (D-95): PASS.** Bengkel, tol and wawancara show the room and the figures down to their shoes.
- **Idle motion outside the kantor (D-96): PASS for what I could measure.** Pool idle: 2 distinct frames / 6 changes in 10 s (blink). Wawancara 3: 2 / 6. Bengkel with the admin speaking: 4 distinct / 13 changes (blink + breathing bob). New line (tol → Bima): 4 distinct frames within 1.2 s (speaker hop), pose `bima:berdiri:kanan:prihatin`. **System reduce + `?gerak=ikut`: 1 frame, 0 changes in every probe** (all motion off). Reduce + `?gerak=penuh`: motion back (2 / 6).
- **Slide-in and room crossfade: not observed by me.** No saved state crosses stage → stage or adds a character without an activity in between; the overlay canvas `.cer-piksel-lama` exists in the DOM. Left to QA's playthrough (see "Not verified").
- **/cerita card cover (D-97): PASS at 360 and 390** (fills the card width, Hendra from hair to thigh beside the damaged cab; a good cover image). **FAIL at desktop width (D-101):** in the two-column card layout the image is near-square (280×238 at 1280 and 1024, 280×261 at 768) and the crop is so tight that Hendra's head is cut off above the moustache, half his body is outside the left edge and the cab is cut on the right. Episode 1's card directly above shows Bu Rina whole. My D-97 wording ("next integer scale up") did not consider this near-square frame; that part is my miss.
- **Pixel font M (D-98): PASS.** "LAYANAN KLAIM RAKSA" reads unambiguously at 360.
- **Foto prop (D-99): PASS.** The 20×15 print on the pillar is visible at 360 next to the admin.

### 4. B-01: chat, activity backdrop, avatars
- Chat (WhatsApp beat): header avatar is the pixel Hendra, 0 `.webp` requests. ✔
- Activity K02: backdrop is `ep2-ruang-kantor-latar` with `image-rendering: pixelated`; resources are `hendra` + that PNG only, 0 `.webp`. ✔ (the green board is blank there: D-102, low).
- Every in-game capture (16 scenes × viewports): `piksel: true`, 0 `.webp`, PNGs only `ep2-ruang-*`, `samping`, `hendra`, `miss-raksa`.
- **Chat cut-in: not observed** (no sampled state shows one). QA to confirm during the playthrough.

### 5. One sentence for the owner
**On the phone, yes: Episode 2 now feels like the same living pixel game as Episode 1 (people stand on real legs, blink, breathe and hop when they speak, they look at each other and at the truck, and the truck is finally truck-sized); the only liveliness Episode 1 still has over it is that Bu Rina walks and sits while Episode 2's people slide in, and one small desktop-only fix remains (the episode card crops Pak Hendra's head).**

### Blocker (high)
- [D-101] /cerita Episode 2 card, wide layout (≥ 768 px: image column 280×238 / 280×261) · cover scale is one step too large: about 93×79 art px are visible, Hendra's head and left half are cut, the cab is cut · step down one integer scale for this frame (2 device px per art px at DPR 1; visible ≈ 140×119 art px) and centre horizontally midway between Hendra's head and the windscreen, top edge 3–4 art px above his hair. General rule that keeps the phone cards exactly as they are now: never use a card scale that shows fewer than **125 art px of width**, and the frame must always contain Hendra's whole head and both shoulders plus the cracked windscreen. Check at 1280, 1024 and 768 · high (first thing a desktop player sees of Episode 2). Numbers are measured from screenshots, ± 3 art px.

### Follow-up list (does not block)
- [D-100] wawancara 3 (and every mirrored side character) · the side-character foot anchor is on the back foot (`jangkar.x` ≈ 20–23 of a 70–71 px frame) instead of under the body, so a slot x is not the body centre and a mirrored figure shifts ≈ 30 art px toward its neighbour: Bima and the Polisi overlap ≈ 21 art px at slots 520 / 830 / 1140 (body centres land at ≈ 578 / 888 / 1086) · preferred: set `jangkar.x` to the midpoint between the soles (≈ 35–37 art px) for all six, then re-seat the slots so the pictures I approved today stay where they are (rule: + 58 world px for a `kanan` slot, − 58 for a `kiri` slot): wawancara 3 → **500 / 830 / 1160** (this one also evens the spacing: 330 between body centres, ≈ 11 art px of air; fits the 360 crop with > 40 art px to spare each side), wawancara 2 → **670 / 990**, wawancara 1 → **890**, kantor visitor slot 1 → **980**, tol slot 1 → **620**, bengkel admin → **940**, pool slot 1 → **420** (Hendra shares this slot on the /cerita card and his anchor is already centred, so re-check the card or give him his own x 360). Slot-only alternative if the anchors stay untouched: wawancara 3 → **442 / 772 / 1218**, nothing else changes · med.
- [D-102] Activity backdrop (K02 and other tasks) · the kantor wall is used without its runtime nameplate text, so the green board is an empty rectangle behind the task card · either draw the same pixel-font text there or use a wall crop without the board · low.
- [D-103] Liveliness, later · Episode 1's Bu Rina walks in and sits; Episode 2's characters only slide in · if the owner still feels a gap after the phone check, the next step is a 2-frame walk for Hendra and Rudi (new art from me, ≈ 2 frames each), not more code motion · low, owner's call.
- Carried over, unchanged: mirrored Polisi/Hendra are interim (pocket/badge swap sides, no lettering); D-90 (dialogue stays Indonesian under en/zh) is outside T-013.

### Not verified by me
Slide-in (180 ms) and room crossfade (150 ms) on a live transition; the chat cut-in; real iOS WebKit and the owner phone check; a full manual playthrough in en/zh; `npm run test:client` / `test:e2e` / `cek-piksel-t013.mjs` (Fullstack reports 728/728, e2e clean, 73/73); Fullstack's byte table.

---

## T-017 — walk frames (2026-11-16)

Author: Designer · Art only; no source edits, no commit. Follows D-103 (owner go 2026-11-16).

### 1. Delivered
| File | What |
| --- | --- |
| `character/hendra-pixel-v1/hendra-jalan-v1.png` (+ `.md`) | 1024×1024 RGBA, two 512×1024 cells (same grid as `tokoh-samping-badan-v2.png`): left = **kontak** (contact), right = **lintas** (passing). Full body, faces and walks RIGHT, soles on cell y 983 |
| `character/tokoh-samping-ep2-pixel-v1/rudi-jalan-v1.png` (+ `.md`) | same layout for Mas Rudi (clipboard stays under his arm) |
| `…-jalan-v1-sumber.png` next to each | the generator output as it came (standing copy + two walk frames); trace only |
| `team/evidence/T-017/jalan-strip-3x.png` | **preview strip for approval**: standing (the frame that ships today) · contact · passing, both characters, 3×, built at real atlas scale and palette |
| `team/evidence/T-017/jalan-hendra-3x.gif`, `jalan-rudi-3x.gif` | the walk at the proposed timing: six frames in, then the standing frame |
| `team/evidence/T-017/native-*.png`, `ukur.json` | the four frames exactly as the atlas builder will produce them, and every measurement below |

Frame boxes (px in each sheet) and atlas-scale result, measured with the project's own `sampelIsi` / `kepalaDari`:

| Frame | Cell | Alpha box (x, y, w, h) | Read pitch | Native art px | Head width (standing) | Suggested foot anchor |
| --- | --- | --- | --- | --- | --- | --- |
| hendra `jalan-kontak` | 0, 0, 512, 1024 | 39, 93, 434, 891 | 4.582 | 95 × 195 | 37.1 (36.1) | x 51, y 194 |
| hendra `jalan-lintas` | 512, 0, 512, 1024 | 600, 88, 336, 896 | 4.582 | 73 × 196 | 36.7 (36.1) | x 37, y 195 |
| rudi `jalan-kontak` | 0, 0, 512, 1024 | 17, 124, 479, 860 | 4.444 | 108 × 194 | 35.1 (35) | x 53, y 193 |
| rudi `jalan-lintas` | 512, 0, 512, 1024 | 622, 123, 292, 861 | 4.444 | 66 × 194 | 34.6 (35) | x 36, y 193 |

Scale check: the pitch comes from the standing figure that sits in the same generated sheet (Hendra 898 px = 196 art px, Rudi 880 px = 198 art px), and that figure's head measures 36.2 / 34.4 art px against 36.1 / 35 in the shipped atlas, so walk and standing frames are the same size. The anchor is "head centre + the standing frame's own head-to-anchor offset", so the head does not jump sideways when the walk hands over to the standing frame.

Honest notes on the art: it took three passes. Pass 1 drew the heads 16 % (Hendra) and 8 % (Rudi) too big and gave Rudi a third arm; pass 2 over-corrected (Hendra's head 17 % too small, body too slim). Pass 3, the one delivered, puts the shipped standing figure on the canvas and adds the two walk poses at its scale. Checked: two arms and two legs in every frame, facing right, no text. Limits: faces are baked (no expression or blink overlay while walking); Rudi's walk frames are 4 art px shorter than his standing frame, so he straightens up as he stops (a read pitch of 4.35 removes it if it looks like a jump); a 2-frame cycle always leads with the same leg, as Bu Rina's does.

### 2. Where the walk plays
- **Rudi: K04, the pool (not the bengkel; the bengkel scene is the admin's).** K04 is the first time the pool appears and Rudi is its only character (`hadir: ['rudi']`). He walks in from the left edge of the view (the gate side) to his slot (x 420), walking right, and stops facing the truck. No script change; every player sees it.
- **Hendra: there is no scene for it today, and K01 cannot be it.** K01 is a WhatsApp conversation (`k01.1`: "Kamu menghubunginya lewat WhatsApp"; staging `TELEPON_HENDRA`), and every later Hendra line is on the phone as well. His only full-body appearance is the /cerita cover. So his walk needs one staging decision from the owner/Lead (D-105). My recommendation: **the ending** (`akhir-puas` / `-catatan` / `-kurang`, kantor with Miss Raksa): stage him in person (`hadir: ['missRaksa', 'hendra']`, no phone cut-in) so the man the player has only texted for thirteen weeks walks up to the counter for his last line. He enters from the right edge walking left (mirrored frames) to the visitor slot (x 980) and stops facing Miss Raksa. All three ending lines read naturally in person, so no text changes; every player sees it. Until that is decided, do not add Hendra's frames to the atlas (no unused bytes).

### 3. Timing
- **Frame rate: 270 ms per frame (3.7 frames per second)**, the same `LANGKAH_MS` as Bu Rina in Episode 1. Order kontak → lintas → kontak → …; start on kontak, the last walk frame is lintas, then the standing frame.
- **Travel: 24 art px (96 world px) per frame**, moved continuously (linear, no easing) and snapped to whole art px; about 89 art px per second. The drawn stride is ≈ 50 art px between the same point of both shoes, so two frames cover one step and the feet do not slide.
- **Length:** distance d = from just outside the nearest view edge to the slot; frames n = round(d / 96 world px), clamped to 3–7; per-frame travel = d / n (stays within 80–120 world px). That gives 0.8–1.9 s: about 1.1–1.6 s on a phone, up to 1.9 s on the 1280 view.
- No extra bob in code: the passing frame is already 1 art px taller than the contact frame.
- Walking left = the same frames mirrored around the foot anchor (D-93). On arrival the figure takes its slot facing (`hadap`).
- The walk replaces the 180 ms slide-in only for characters that have walk frames; everyone else keeps the slide-in. Blink, speaker hop and breathing start after arrival. The dialogue text is not held back; "Lanjut" during the walk skips to the standing frame (as Episode 1's entrance does).
- **Reduced motion (system setting, unless `?gerak=penuh`): no walk**; the character is simply standing at the slot, as today.

### 4. Bytes
Measured, not guessed: the two atlas-scale frames of each character written as an indexed PNG with the shipped palette (no new colours): **Hendra 7,738 B, Rudi 7,297 B, together ≈ 15.0 KB**. Mirrored use costs nothing. Episode 2 stage: ≈ 152 KB today → **≈ 159 KB with Rudi only, ≈ 167 KB with both**, of the 400 KB gate. Inside the atlases it will be slightly less (shared header and palette); the atlas sheets get taller, which compresses to almost nothing.

### Items
- [D-104] K04 pool, Rudi · today he gets at most the 180 ms slide-in, and nothing at all when the stage was not mounted in the beat before (`useHidup` skips the first mount; I did not observe which case K03 → K04 is), so the first field scene opens almost static · add `jalan-kontak` / `jalan-lintas` to the samping atlas for `rudi` and play the walk-in above whenever he becomes present, including when the stage or the room itself is new; reduced motion = no walk · med.
- [D-105] Hendra's walk · no scene stages him on the pixel stage (K01 is WhatsApp) · owner/Lead decision: stage the three endings in person as described in section 2 (recommended), or keep the frames in reserve; integrate his frames only once a scene uses them · med, needs a decision before Fullstack starts on Hendra.

### What I will check in the review after integration
360 id / 390 en / 1280 zh: Rudi enters from the left edge and stops on his slot without a sideways head jump; feet do not slide; pixels stay on the integer grid while moving; no walk under reduced motion + `?gerak=ikut`; "Lanjut" mid-walk lands on the standing frame; byte table; and Hendra's entrance if D-105 is approved.

---

## T-014 — translation review (2026-11-16)

Reviewer: Designer · Build: production build in client/dist (07:15, newer than `teks.en.ts` 07:06 and `teks.zh.ts` 07:10) on my own server on :4002 (`PORT=4002 RAKSA_LEGACY=on npm start`, started and stopped by me; :4000 and :4001 not touched) · No source edits, no commit.
Method: read team/HANDOFF.md "T-014"; built a key-by-key side-by-side of `teks.id.ts` / `teks.en.ts` / `teks.zh.ts` and read **all 894 keys in both languages** (dialogue, choices, chat, activities, arena labels, documents, endings, summary cards, glossary). Checked by script: every glossary label still occurs in the line that carries its button (7 / 7 in en and zh), no straight quotes, no ASCII punctuation or missing space in the Chinese. In-game: my own CDP captures at 390×844 DPR 3 and 1280×800, en and zh: kantor, K01 chat + choice list, K08 tol, K13 chat + choice list (the longest English choice, 153 characters), wawancara 3, the K02 activity, the ending scene and the full end screen. Eight of them are in `team/evidence/T-014/designer/`.
Limit, stated plainly: this is a careful meaning and tone review, not a native-speaker sign-off. The Chinese proposals in particular should still be read once by a native speaker before a public release.

### Verdict
- **One blocker in both languages, in code, not in the text files (D-123): Indonesian words are assembled at run time into English and Chinese sentences.** After the K02 activity the player's own chat message reads "…Truck registration, Mr Hendra’s ID card **dan** Mr Darto’s driving licence.", and in the K08 sign check the feedback reads "your choice **lajur 3 dan 4**" / "Mr Bima looks at your marks for Sign 1: **lajur 2, 3, dan 4**. The sign itself says **lajur 3 dan 4**." Same in Chinese. Neither the completeness test nor `cek-bahasa-t014.mjs` can see it, because the strings do not exist until the player acts.
- **English text: PASS.** Faithful, natural British register, names and titles consistent ("Claims Officer", "Mr Hendra", "Rudi"). 36 keys of polish in 7 items below, none blocking.
- **Chinese text: FIX NEEDED.** The meaning is right almost everywhere and the layout is clean, but two things would make a native player stumble at once (D-113 the title's vehicle word, D-114 a misused insurance term), and the player's own chat lines read as translated because of a repeated bare "先生" (D-117). 97 keys in 8 items, all with paste-ready text.
- **Layout (both languages, 390 and 1280): PASS.** No clipped or overflowing text, no horizontal scroll, choice buttons wrap cleanly (English up to 5 lines at 390), chat bubbles, nameplates ("Miss Raksa · Claims Officer / 理赔专员", "Mr Hendra / Hendra 先生"), status chips and the end screen all hold. Chinese renders in the system CJK font and looks consistent.
- All replacement texts are also in **`team/specs/T-014-teks-fixes.json`** (`en` / `zh` → D-item → key → text) so Fullstack can paste or script them. Each one was checked against `teks.id.ts`: key exists, same `{placeholders}`, same numbers (the validator's rule), glossary labels still inside their lines.

### 1. English: items
- [D-106] K08 and its arena feedback · "break the sign" reads as physically breaking a sign · use "go against the signs" · med.

| Key | Replace with |
| --- | --- |
| `k08.2` | In your view, did the truck go against the signs by being in lane 2? |
| `k08.a` | It did: a truck should always be in the leftmost lane. Let’s just reject the claim. |
| `arena.rambu.tanggap.sikapMelanggar` | By your marks, a truck in lane {truk} was not in a banned lane. Mr Bima asks: what is the basis for “it went against the signs”? |
| `arena.rambu.tanggap.sikapTidak` | Your marks put lane {truk} among the banned lanes, yet you concluded it did not go against the signs. Mr Bima asks: which do you mean? |

- [D-107] K08 choices · the player says "sir" to Mr Bima, a colleague; "sir" suits the customer (Pak Hendra) but sounds servile between colleagues · drop it in the four K08 lines (k08.a is already in D-106) · low.

| Key | Replace with |
| --- | --- |
| `k08.b` | Those signs have nothing to do with the claim. They needn’t go in the report. |
| `k08.d` | We can’t conclude yet. Let’s just ask Mr Hendra to explain where his truck was at the time. |
| `k08.e` | Let the police decide about the signs. We’ll wait for their official answer. |

- [D-108] K11 bundle · "Complete the police report" reads as if the player writes the police report; the source means "complete the file with it" · med.

| Key | Replace with |
| --- | --- |
| `k11.akibat.berkas.lengkapi` | You got the police report into the file first. The file reaches the Committee with nothing marked as missing. |
| `akt.bundel.opsi.lengkapi` | Add the police report first, then submit to the Committee |
| `arena.bundel.lengkapi` | Complete the file first |
| `arena.bundel.lengkapi.arti` | Add the police report, then submit to the Committee. |

- [D-109] K10 · "the claim deserves cover" is not idiomatic · low.

| Key | Replace with |
| --- | --- |
| `k10-d.1` | Mr Bima’s report is tidy and honest. Its conclusion: the incident really happened and the claim should be covered. |
| `titik.k10.alasan` | What matters is whether the core facts match. Small differences are recorded, not hidden, and not used as grounds for rejection. In the real case, the investigation found that the claim should be covered. |

- [D-110] Instalments · "the instalments keep running" is a calque of "cicilan tetap jalan"; and "asking in instalments" (K02) collides with the truck instalments · low.

| Key | Replace with |
| --- | --- |
| `catatan.cicilan` | The truck instalments to Leasing Sentosa still have to be paid; Mr Hendra hopes it is settled before the 20th. |
| `k12.2` | Roughly when will it be approved? It’s getting hard for me: I still have to pay the truck instalments to the leasing company even though the truck can’t work. I hope it can be settled before the 20th. |
| `titik.k12.judul` | The instalments are still due |
| `k02.a.alasan` | Asking bit by bit makes Mr Hendra go back and forth. |

- [D-111] Ending "Selesai dengan catatan" · "Closed with notes" is literal and a little opaque as an ending title · low.

| Key | Replace with |
| --- | --- |
| `akhir.catatan.judul` | Closed, with reservations |
| `kartu.catatan.sebab` | Mr Hendra’s final status is 45-69, so the case ends Closed, with reservations: there were times he waited with no news or got an unclear answer. |

- [D-112] Small naturalness fixes, the KK label, and one cross-episode term ("Cemas" is "Worried" in Episode 1, "Anxious" here) · low.

| Key | Replace with |
| --- | --- |
| `k03.a.alasan` | A timescale that is too short sets an expectation that is hard to meet. |
| `titik.k03.e` | Sent a brochure for him to read on his own |
| `k05.d.alasan` | Nothing moves, and the file is forgotten. |
| `k05-d.1` | Nothing moves. The file is forgotten for several days. |
| `k12.e.alasan` | A message left on read leaves Mr Hendra hanging. |
| `k12-e.1` | His message is left on read. Mr Hendra feels left hanging at the hardest moment. |
| `k12-c.1` | I was only saying. |
| `akt.jalur.lokasi` | Claims officer’s desk |
| `akt.bundel.lokasi` | Claims officer’s desk |
| `akt.bundel.instruksi` | Check the bundle, then decide your next step and what to tell Mr Hendra. |
| `akt.berkas.petunjuk` | Pick a document, then a tray: ask now, may follow, or not needed. |
| `akt.berkas.item.kk` | Copy of the Family Card (KK) |
| `arena.berkas.kk` | Copy of the Family Card (KK) |
| `arena.berkas.pesan.sekarang` | Mr Hendra, please send these documents: |
| `arena.berkas.pesan.kosong` | Mr Hendra, there are no documents you need to send for now. |
| `arena.tutup.kabar.isi` | Mr Hendra, the settlement has been paid to Leasing Sentosa. |
| `suasana.cemas` | Worried |

Accepted as they are: "heavy-damage claim" (clear and used consistently), "Motor" as the product line, British spelling with "truck", "Alhamdulillah" rendered as "thank goodness", "passed from pillar to post" for "dipingpong".

### 2. Chinese: items
- [D-113] Title, summary, K01, K05 · "挂车卡车" is not a word a Chinese speaker uses for a trailer truck (it is in the episode **title**), and "收费公路" is correct but formal; in speech people say "高速" · use "半挂卡车" and "高速公路" ("高速" inside Pak Hendra's own line) · **high**.

| Key | Replace with |
| --- | --- |
| `judul` | 高速公路上的半挂卡车 |
| `ringkas` | Hendra 先生的卡车撞上了高速公路的护栏。重损理赔需要时间：从第一次报案到付款，帮他始终清楚进展到了哪一步。 |
| `lokasi.tol` | 高速公路路段 |
| `catatan.laporan` | Hendra 先生的半挂卡车夜间撞上了高速公路的护栏。司机平安。 |
| `buka.2` | 车主是 Hendra 先生，做货运生意。昨晚他的卡车在高速公路上出了事故。 |
| `k01.1` | 第 1 天，上午。市场部转来一条报案：Hendra 先生的半挂卡车昨晚撞上了高速公路的护栏。你通过 WhatsApp 联系他。 |
| `k01.2` | 你好，对，是这样。我的卡车昨晚在高速上撞了护栏，车头全毁了。司机没事，可我不知道该怎么办。这个能理赔吧？ |
| `akt.berkas.cerita` | Hendra 先生的卡车撞上高速公路护栏后严重受损。警方证明还在办理，还要几天才能拿到。 |
| `k05.c.alasan` | 替换的修理厂不一定修得了半挂卡车。 |
| `k05-c.1` | 也许会快一些，但替换的修理厂不一定修得了半挂卡车，得先核实。 |

- [D-114] K08, K10 · "承保" means underwriting (accepting a policy), not paying a claim; "理赔是否承保" / "理赔应予承保" is wrong insurance Chinese · **high**.

| Key | Replace with |
| --- | --- |
| `k08.e.alasan` | 赔不赔由 Raksa 决定，不由警方决定。 |
| `k08-e.1` | 警方只是记录事故，赔不赔仍由 Raksa 决定。流程卡住了，在等一个本不该由警方给的答复。 |
| `k10-d.1` | Bima 先生的报告条理清楚、实事求是。结论是：事故确实发生，应予赔付。 |
| `titik.k10.alasan` | 关键是主要事实是否吻合。小出入要记录下来，不隐瞒，也不当作拒赔理由。在真实案例中，调查结论是应予赔付。 |

- [D-115] K02 activity · the episode text says "资料盘" while the game's own interface on the same screen says "托盘" ("点击托盘放入这份文件", "每个托盘的含义"); "资料盘" also reads like a data disc · use "托盘", and make the hint name the trays as they are labelled · med.

| Key | Replace with |
| --- | --- |
| `k02-b.2` | 当天文件就进了文件托盘，流程马上开始。 |
| `akt.berkas.tanya` | 把每份文件放进合适的托盘 |
| `akt.berkas.petunjuk` | 先选文件，再选托盘：现在索要、可以后补，或不需要。 |
| `akt.berkas.wadah.sekarang` | 现在索要 · 流程要等这个托盘里的文件到齐 |

- [D-116] Role names · "公路管理员" and "公路警察" are understandable but not what these people are called; natural: "高速巡查员" and "高速交警" · med.

| Key | Replace with |
| --- | --- |
| `pemeran.tol.nama` | 高速巡查员 |
| `pemeran.polisi.nama` | 高速交警 |
| `catatan.selisih` | 陈述有出入：时间为 20.10（警方）和 20.15（高速巡查员）；小货车司机的姓名不一致；高速巡查员写了“预判不足”。 |
| `akt.saksi.item.tol` | 记录事故的高速巡查员 |
| `akt.saksi.item.polisi` | 高速交警 |
| `akt.selisih.item.jam` | 事发时间：警方记为 20.10，高速巡查员记为 20.15 |
| `akt.selisih.item.antisipasi` | 高速巡查员写司机“预判不足” |
| `titik.k09.e` | 车主、司机、高速巡查员和交警 |
| `arena.saksi.tol` | 高速巡查员 |
| `arena.saksi.polisi` | 高速交警 |
| `arena.selisih.kanan` | 高速巡查员记录 |
| `arena.selisih.jam` | 事发时间：警方记为 20.10，高速巡查员记为 20.15。 |
| `arena.selisih.antisipasi` | 高速巡查员写司机“预判不足”（视为不够谨慎，不属于违规）。 |
| `arena.selisih.antisipasi.catatan` | 在这段摘录中，只有巡查员的记录提到了这一点。警方记录是否有类似内容，尚不清楚。 |

- [D-117] Player's chat lines (K01, K03, K06, K08, K12, K13, K14, two activity messages) · "Pak" was rendered as a bare "先生" in almost every line ("好的，先生。", "放心，先生，…"); once is fine, 34 times it reads like a translated script, and to a colleague (Mr Bima, K08) it is wrong · drop the bare vocative, keep "您", use "Hendra 先生" where a message opens with an address. Politeness is kept equal across right and wrong answers so the tone does not give the answer away · med.

| Key | Replace with |
| --- | --- |
| `k01.b` | 您放心，一定全赔。维修费用您完全不用操心。 |
| `k01.c` | 怎么会撞上护栏呢？司机是不是犯困了？夜里出事一般都是这个原因吧？ |
| `k01.d` | 好的。请您先在 Raksa 网站上填写理赔申请表，我现在把链接发给您。 |
| `k01.e` | 好的。请您准备理赔申请表、行驶证、身份证、驾驶证、警方证明和卡车损坏照片。 |
| `k03.a` | 最多一个星期就好。送货安排您可以从下周起重新排。 |
| `k03.b` | 现在还说不准。一有进展我马上告诉您。 |
| `k03.c` | 损坏很严重，所以比刮蹭理赔要久。这是各个阶段，每到一步我都会通知您。 |
| `k03.d` | 好的，文件我收到了。谢谢您。 |
| `k03.e` | 流程确实分几个阶段。细节都在我发的 PDF 手册里，请您先看一看。 |
| `k06.a` | 下周就会有决定。送货安排您现在就可以重新排了。 |
| `k06.b` | 我按阶段给您说明吧，每个阶段大概多久。每完成一步，我都通知您。 |
| `k06.c` | 这要看修理厂和管理层。流程掌握在几个部门手里。 |
| `k06.d` | 请您耐心等待。我们都在按规定流程办理。 |
| `k06.e` | 哎，这个不在我的权限范围内。我只负责转交案卷。 |
| `k08.a` | 违反了，卡车应该一直走最左侧车道。直接拒赔吧。 |
| `k08.b` | 标志牌和理赔没有关系。不用写进报告。 |
| `k08.d` | 现在还下不了结论。就请 Hendra 先生说明一下事发时卡车的位置吧。 |
| `k08.e` | 标志牌的事就让警方来定吧。我们等他们的正式答复。 |
| `k12.a` | 您放心，20 号之前一定办好。我保证您这个月的分期没问题。 |
| `k12.b` | 我明白这对您很不容易。理赔正在委员会审批，大约 14 个工作日；我会一直盯着。 |
| `k12.c` | 分期是您和租赁公司之间的事。那不在 Raksa 办理的理赔流程之内。 |
| `k12.d` | 我请上级帮忙加快办理。希望能比平时快一些。 |
| `k13.a` | 规定就是这样。这类理赔向来寄给双方，您不用多想。 |
| `k13.c` | 哦，那是寄错了。寄给租赁公司的那份您别管就行。 |
| `k13.d` | 请您先仔细看看通知书。里面什么都写清楚了，包括租赁公司的事。 |
| `k14.a` | 抱歉，这是委员会的决定，金额不能再改了。 |
| `k14.b` | 我尽量争取把金额提高到您说的价格。 |
| `k14.c` | 方便发些参照给我吗，比如同类卡车的出售广告？我来申请复核；需要一些时间，有进展我会告诉您。 |
| `k14.d` | 请您向总部提交书面异议。地址和格式请您自己在 Raksa 网站上查一下。 |
| `k14.e` | 还是接受吧。要是申诉，赔款到账更慢，您办起来也更麻烦。 |
| `arena.berkas.pesan.sekarang` | Hendra 先生，麻烦您发一下这些文件： |
| `arena.berkas.pesan.kosong` | Hendra 先生，目前还没有需要您发的文件。 |
| `arena.tutup.kabar.isi` | Hendra 先生，赔款已经打到 Leasing Sentosa 账上了。 |
| `arena.tutup.bintang.isi` | 麻烦您给我们打个 5 星。 |

- [D-118] K01 best answer · "很遗憾听到这个消息" is English syntax ("I'm sorry to hear that"); this is the answer the episode teaches, so it should sound like a person · med.

| Key | Replace with |
| --- | --- |
| `k01.a` | 听到这事我也替您着急，还好司机平安。我是 Raksa 的 {nama}。方便简单说说经过，再发几张卡车的照片吗？ |

- [D-119] End screen and summary cards · "理赔已付" / "理赔支付完毕" (a claim is "paid" as 赔款, not 理赔), "在没有消息的情况下等待" is heavy, "流程和告诉我的一样" is stiff · med.

| Key | Replace with |
| --- | --- |
| `akhir.puas.ringkas` | 赔款已付，Hendra 先生很满意：他始终知道理赔到了哪一步。 |
| `akhir.catatan.ringkas` | 赔款已付，但 Hendra 先生有好几次苦等不到消息。 |
| `akhir.kurang.ringkas` | 赔款已付，但整个过程中 Hendra 先生觉得孤立无援。 |
| `akhir.bayar` | Leasing Sentosa 已经收到赔款。Hendra 先生的理赔全部赔付完毕。 |
| `akhir.puas.1` | 非常满意。整个流程和你当初说的一样。谢谢你，{nama}。 |
| `akhir.catatan.1` | 我的理赔款已经付了，谢谢。不过流程很长，我常常收不到消息。 |
| `akhir.catatan.2` | 理赔办完了，{nama}。但有好几次，Hendra 先生苦等不到消息。我们来看看哪些场景还能做得更好。 |
| `kartu.catatan.sebab` | Hendra 先生的最终状态为 45-69，所以结局是“结案，但有不足”：有些时候他苦等不到消息，或者得到的回答不够清楚。 |
| `kartu.kurang.sebab` | Hendra 先生的最终状态低于 45，所以结局是“不太满意”：赔款付了，但他常常觉得没人听他说、没人告诉他进展，或者得到的承诺落了空。 |

- [D-120] Polish · "警察分局" → "派出所" (the everyday word for a local police post); "线路 1/2" reads like a bus line → "工作线"; "指令" → "委托单"; KK label; a few idioms; "担心" as in Episode 1 · low.

| Key | Replace with |
| --- | --- |
| `catatan.suratpolisi` | 警方证明还在由 Hendra 先生公司的人到派出所办理，还要几天。 |
| `k02.2` | 我要准备哪些文件？对了，警方证明还在让公司的人去派出所办，可能还要几天才能拿到。 |
| `arena.berkas.catatan` | Hendra 先生说：警方证明还在派出所办理，还要几天才能拿到。 |
| `arena.berkas.suratpolisi.ket` | 还在派出所办理；还要几天。 |
| `akt.jalur.cerita` | 损坏严重，还有另一辆车被撞。工作线 1（修理厂核算费用）正在进行。 |
| `akt.jalur.labelInteraksi` | 安排调查的工作线 |
| `akt.jalur.wadah.setelah` | 工作线 1，等修理厂核算完之后 |
| `akt.jalur.wadah.paralel` | 工作线 2，现在开始，与修理厂核算同时进行 |
| `akt.jalur.tabel.1` | 工作线 1 |
| `akt.jalur.tabel.2` | 工作线 2 |
| `akt.berkas.item.kk` | 家庭卡（KK）复印件 |
| `arena.berkas.kk` | 家庭卡（KK）复印件 |
| `k04-d.1` | Rudi 在车场查勘了卡车。当天就给修理厂发出了核算维修费用的委托单。 |
| `k05.1` | 第 6 天。核算维修费用的委托单已经发给 Mitra 修理厂。 |
| `k06-b.2` | Hendra 先生现在心里有数了，可以安排日程了。 |
| `k12-e.1` | 他的消息被已读不回。在最难的时候，Hendra 先生觉得被晾在一边。 |
| `k14.a.alasan` | Hendra 先生觉得吃了闭门羹。 |
| `akt.berkas.judul` | 资料清单 |
| `akt.bundel.kirim` | 确定 |
| `latar.bengkel.antrean` | 本周排期 |
| `suasana.cemas` | 担心 |

- [D-121] Interface string, not the episode file · the reply button reads "回复Hendra 先生" (no space before the Latin name; the episode text always spaces Han and Latin) · `i18n/kamus/ceritaHp.ts` zh `balasNama`: `'回复 {nama}'` · low.
Accepted as they are: "理赔专员", "Hendra 先生 / Bima 先生 / Darto 先生", "查勘员", "事故调查组", "理赔委员会", "赔偿方案通知书", "全损", "重损理赔", "小货车", "抢道", "被踢了皮球", "只读不回".

### 3. Blocker in code: Indonesian assembled at run time
- [D-123] K02 chat message and K08 sign check, en and zh · two helper functions are Indonesian-only: `daftar()` in `episode/auto-2/arena.ts` (joins with " dan ") and `daftarLajur()` in `hp/arena/rambu.ts` ("lajur 3 dan 4", "belum ada lajur"), used by `arena.rambu.pilihanmu`, `arena.rambu.tanggap.tulisan` and the K08 action summary. Rendered with the project's own functions (output in `team/evidence/T-014/designer/teks-rakitan-en-zh.txt`) · make both language-aware; the wording I want on screen:

| Case | English | Chinese |
| --- | --- | --- |
| one lane | lane 3 | 第 3 车道 |
| two lanes | lanes 3 and 4 | 第 3、4 车道 |
| three lanes | lanes 2, 3 and 4 | 第 2、3、4 车道 |
| no lane | no lane yet | 还没有车道 |
| list of documents | A, B and C (no comma before "and") | A、B 和 C (items joined with "、", "和" before the last) |
| K02 message, after D-112 / D-117 | Mr Hendra, please send these documents: Claim form, Truck registration, Mr Hendra’s ID card and Mr Darto’s driving licence. These may follow once they are ready: Police report. | Hendra 先生，麻烦您发一下这些文件：理赔申请表、卡车行驶证、Hendra 先生的身份证和 Darto 先生的驾驶证。以下可以办好后再补：警方证明。 |

  In Chinese the sentence must end with "。" and have no space after "：" (today the code adds " " and "."). Also check `teksLajur()` and the Indonesian sentence in `lokasi/logika.ts` (line 149): it is imported by `auto-2/arena.ts`; I did not trace whether its text can reach Episode 2 · **high, blocks both languages**. Please add a test that renders these composed strings in en and zh and scans them for Indonesian words.
- [D-124] Chinese only · other joiners in code put ASCII punctuation into Chinese sentences: seen in-game on wawancara 3: "你的行动：访谈: 公路管理员, Hendra 先生, 公路警察, Darto 先生. 不需要: 小轿车司机" and "在场：公路管理员, Bima 先生, 公路警察" (`hp/arena/ringkas.ts` lines 23–30, `hp/AdeganTatap.tsx` line 128; the same pattern is in `ArenaBundel.tsx` 132, `PapanSaksi.tsx` 106, `ArenaBandingkan.tsx` 105) · in zh join names with "、", use "：" after a label and "。" between groups: "访谈：高速巡查员、Hendra 先生、高速交警、Darto 先生。不需要：小轿车司机" · med.

### 4. In-game look and the kantor board
- **The board stays Latin "Layanan Klaim Raksa" in en and zh: OK.** It is a brand sign on the wall of an Indonesian office, in pixel lettering that matches the room; next to it the interface is fully translated, so nobody needs the board to understand the screen. A system-font Chinese label drawn on the pixel canvas would look worse than an untranslated sign. Same reasoning for the small board in the activity backdrop.
- Nothing to fix in layout. One note for the owner's phone check: the Chinese depends on the device's CJK font; on my Windows capture it is clean.

### 5. Lettering inside the activity illustrations (`seni/auto-2/benda.ts`)
**Recommendation: keep it Indonesian, as in-world props. No redraw now.** [D-122, decision, low]
- What it is: 20 short labels drawn at about 9 px inside small pictures (FORMULIR, STNK, KTP, SIM, POLISI, KARTU KELUARGA, SLIP GAJI, REK. KORAN, DIPROSES, ESTIMASI, BENGKEL LAIN, PEMERIKSAAN, JELAS, KOMITE, KONTAK, BIAYA BENGKEL, TENDER, LAPORAN, POOL, RAKSA).
- Why keep: (1) every picture has its translated caption directly beside or under it (checked in zh: "FORMULIR" card next to "理赔申请表"), so no meaning is lost; (2) seven of them are names of the real documents in the case (STNK, KTP, SIM, Kartu Keluarga, the police letter, payslip, bank statement), which a translated version would make less true to it; (3) it is the same decision as the kantor board, so the world stays consistent: the story happens in Indonesia, the interface speaks the player's language.
- Cost if the owner wants them translated anyway: Fullstack threads the language through about 20 art functions and their callers in `arena.ts` and fits 20 labels × 2 languages into fixed card headers (Chinese needs a system font inside the SVG, so every card must be re-checked at three widths): about half a day to one day of Fullstack plus 2–3 hours of Designer review; bytes are negligible. If it is ever done, translate only the 13 workflow words and leave the 7 document names.

### Counts
Blocker: 1, in code, both languages (D-123). English text: 36 keys in 7 items (2 med, 5 low). Chinese text: 97 keys in 8 items (2 high, 5 med, 1 low), plus 2 interface items (D-121 low, D-124 med). Layout: 0 items. `benda.ts`: keep (D-122).

### Not verified by me
A native speaker's read of either language; a real phone (iOS / Android CJK fonts); a full manual playthrough of every branch in en/zh (I read every string; in-game I captured 11 screens per language and width and opened 14 of them, 8 zh and 6 en; the rest passed only my no-horizontal-scroll probe); the K02 and K08 activities played by hand to the end (D-123 was found by reading the code and rendering the strings with the project's functions, not by playing); `npm run test:client` / `test:e2e` / `cek-bahasa-t014.mjs` after the fixes (Fullstack to re-run; my replacement texts were only checked for keys, placeholders, numbers and glossary labels).

---

## T-017 — motion review (2026-11-16)

Reviewer: Designer · Build: production build in client/dist (07:34, newer than the walk sources of 07:32–07:33) on my own server on :4002 (started and stopped by me; :4000 and :4001 not touched) · No source edits, no commit.
Method: read team/HANDOFF.md "T-017"; reloaded the saved K04 state (`pool`) at 360×740 DPR 2, 390×844 DPR 3 and 1280×800 and recorded **every distinct canvas frame** in the page with its timestamp, pose and foot x (`data-jalan` / `data-kaki`): 90, 77 and 108 frames. From those: pose timing, travel per frame, speed, when Rudi becomes visible, head movement at the stop. Measured the shoes of the shipped atlas frames against the foot anchor to judge foot planting, and did the same for Bu Rina's Episode 1 frames and entrance path. Also recorded reduced motion with `?gerak=ikut` and `?gerak=penuh`, and "Lanjut" pressed 0.5 s into the walk.
Evidence in `team/evidence/T-017/designer/`: `jalan-360.gif`, `jalan-390.gif`, `jalan-1280.gif` (the real frames at their real timing), `diam-4-360/390/1280.png` (four stills each), `geser-kaki-24-vs-41.png` (the foot-planting diagram), `ukur-gerak.json`.
Limit: I cannot watch a moving picture; this verdict rests on the frame recordings, the measurements and the stills, not on an eye watching it at speed. The owner's phone check is the real test of feel.

### Verdict: FIX NEEDED — one number, and it is my own spec error. Everything else PASS.

### What works
- **Integration is exactly as specified.** 270 ms per pose (measured 254–288 ms), kontak / lintas alternating, linear travel on whole art px (every step a multiple of 4 world px, usually 4 or 8 per screen frame), ends on lintas and then stands at x 420 at all three sizes. 360: 6 poses, 576 world px, 1.62 s. 390: 5 poses (starts on lintas, as Fullstack explained), 452 px, 1.35 s. 1280: 7 poses, 684 px, 1.90 s.
- **The stop is clean.** From the last walk frame to the standing frame the head moves 1 art px right (2 at 360, the final snap to the slot) and 1 art px up, and the head is the same width (70 / 140 / 70 device px before and after). No jump. Fullstack's choice of read pitch 4.35 was right.
- **Scale next to the truck:** the walking figure is the same 198 art px as the standing one; against the cab it reads as the same man.
- **Reduced motion + `?gerak=ikut`:** no walk, one frame in 3 s, he is simply standing. With `?gerak=penuh` he walks. **"Lanjut" mid-walk:** pressed at 874 ms, standing at x 420 in the next frame (13 ms later).
- **Leading leg:** a two-frame cycle always leads with the same leg; over 3–4 poses that is not noticeable. No change.
- **Mirrored case:** none exists in the game today (Rudi only walks right at K04; Hendra waits on D-105), so it is untested.

### What is wrong: the feet slide
- [D-125] K04 walk, all sizes · the body travels **24 art px (96 world px) per pose**, but the drawn legs cover **41 art px per pose**: one drawn step is 82 art px (in the kontak frame the front heel is 28 art px ahead of the anchor and the back heel 54 behind; in the lintas frame the standing heel is 15 behind). So a heel lands, and one pose later it is drawn 17–22 art px behind that spot, and after the full step 34 art px behind: **41 % of every step is slip**, like walking on ice (`geser-kaki-24-vs-41.png`, left panel; measured the same from the live recordings). My T-017 spec said the stride was "≈ 50 art px" and that 24 per frame would not slide; that measurement was wrong, and Fullstack built what I wrote.
  **Change:** nominal travel per pose **96 → 164 world px (41 art px)**; frame count n = round(distance / 164), clamped **3..6** (was 3..7); travel per pose stays distance / n; keep 270 ms; keep "ends on lintas". With today's start points:

  | Size | Distance | Poses | Travel per pose | Walk time | First pose |
  | --- | --- | --- | --- | --- | --- |
  | 360 | 576 world px | 4 | 144 world px (36 art) | 1.08 s (was 1.62) | kontak |
  | 390 | 452 | 3 | 151 (37.7 art) | 0.81 s (was 1.35) | lintas |
  | 1280 | 684 | 4 | 171 (42.8 art) | 1.08 s (was 1.90) | kontak |

  That leaves at most 5 art px of slip per pose (12 %), which the diagram's right panel shows as feet staying where they land. Plausibility check: 41 art px per 270 ms on a 198-art-px man is a normal walking pace (about 1.3 m/s at about 110 steps a minute); today's 24 is a stroll taken with full-length strides, which is why it slips.
  Priority: **high** (it is the one visible flaw of the walk), small change.

### Timing feel against Bu Rina (Episode 1)
Same 270 ms cadence. Bu Rina covers 260 world px in 1.2 s, 14.6 art px per pose, with a drawn step of about 57 art px (a rough figure from her shoe positions): she also slips (she covers 51 % of her stride), but her long skirt hides the legs and only the shoes show. Rudi covers 59 % of his, in open trousers with a wide stride, so the same technique shows on him. After D-125 he will be clearly brisker than Bu Rina (about 150 against 54 art px per second) and the entrance shorter (0.8–1.1 s against her 1.2 s). I think that suits a surveyor crossing a yard; if the owner finds it too quick on the phone, lengthen the pose to 300 ms (0.9–1.2 s) rather than shortening the travel again.

### Observations, no change asked
- He starts further left than he needs to: the leading edge of the first frame is 63 (360), 166 (390) and 167 (1280) world px outside the view, so nothing is on screen for the first 234–287 ms. At the new speed that becomes about 0.1–0.27 s; harmless.
- On phones the view's left edge is close to his slot (world x 131 at 360, 254 at 390), so he is fully inside the picture only for the last pose. It reads as "he steps in from the left", which is fine.

### Follow-up, not caused by T-017
- [D-126] Pool camera, 1280 and 390 · the view cuts the bottom of the standing figure: **10 art px at 1280** (the shoes; view 390×200 art px, figure top 12 art px below the view top) and **3.5 art px at 390** (the soles); at 360 he is whole. My capture of 15 November shows the same framing, so it predates the walk, and my T-013 final review wrongly said "down to the shoes" for the pool at 1280. With a walk the feet matter more · move the pool camera down by **10 art px at 1280** and **4 art px at 390** (head keeps 2 and 7.75 art px of air), or give the wide stage about 10 art px more height; check bengkel and tol at 1280 for the same cut · med.

### Not verified by me
The walk seen at speed by a human eye; a real phone; that it plays only once per visit; the byte table (161,008 B as reported); `test:client`, `test:e2e`, `cek-jalan-t017.mjs`. After D-125, `cek-jalan-t017.mjs` will need its expected frame counts and timings updated.

---

## T-014 — re-check (2026-11-16)

Reviewer: Designer · Build: production build in client/dist (08:07, newer than every file under client/src) on my own server on :4002 (started and stopped by me; :4000 and :4001 not touched) · No source edits, no commit.
Method: read team/HANDOFF.md "T-014 → Fix"; compared the current `teks.en.ts` / `teks.zh.ts` with `team/specs/T-014-teks-fixes.json` by script; read the 16 new keys; then in-game at 390×844 DPR 3 in en and zh: the three new after-activity states (`akt-berkas`, `akt-rambu`, `akt-saksi`), the K08 sign check played by hand from the tol scene (start the task, open Sign 1, mark lanes 3 and 4), two endings up to the end screen (`catatan`, `puas`) and the episode list. I read the page text of every screen and opened 5 screenshots (K02 chat zh, K08 result zh and en, K08 activity zh, end screen zh). Evidence: `team/evidence/T-014/designer/recheck/`.

### Verdict: PASS. D-123 (the blocker), D-121 and D-124 are fixed; all 133 text fixes are in.

### What I confirmed
- **Text fixes:** en 36 / 36 and zh 97 / 97 keys are identical to my file. None of the old terms is left (收费公路, 挂车卡车, 承保, 资料盘, 公路管理员, 公路警察, 警察分局, 线路, a bare 先生; "break the sign", "deserves cover", "keep running", "workroom"). Key sets are 910 / 910 / 910.
- **K02 chat message after the activity (D-123):** en "Mr Hendra, please send these documents: Truck registration and Mr Hendra’s ID card. These may follow once they are ready: Claim form, Copy of the Family Card (KK) and Driver’s payslip." · zh "Hendra 先生，麻烦您发一下这些文件：卡车行驶证和 Hendra 先生的身份证。以下可以办好后再补：理赔申请表、家庭卡（KK）复印件和司机工资单。" No Indonesian word; the Chinese uses "、", "和", "：" and "。" and keeps the space before the Latin name. This is the wording of my review.
- **K08 sign check (D-123):** in the activity: en "Sign 1: your choice lanes 3 and 4" · zh "标志牌 1：你的选择：第 3、4 车道". In the result: en "Mr Bima looks at your marks for Sign 1: lanes 1 and 3. The sign itself says lanes 3 and 4." and "Your action: Sign 1: lanes 1 and 3. Sign 2: lanes 1, 2 and 3." · zh "Bima 先生看了你对标志牌 1 的标记：第 1、3 车道。标志牌上写的是第 3、4 车道。" and "你的行动：标志牌 1：第 1、3 车道。标志牌 2：第 1、2、3 车道。"
- **Road illustration labels (the third leak Fullstack found):** en "Truck · per the driver", "Illustration • truck position per the driver. Not a plan of the incident.", lane buttons "Lane 1 … Lane 2, the truck’s position per the driver" · zh "卡车 · 据司机说", "示意图 • 卡车位置据司机所述。并非事故现场图。", "第 2 车道，据司机说卡车在此". Natural in both; the label fits its pill at 390.
- **D-124, Chinese punctuation from code:** witness summary "你的行动：访谈：高速巡查员、Hendra 先生、Darto 先生。不需要：小轿车司机、高速交警"; labels "原因：", "目标：", "标志牌 1：" are full-width. I found no ASCII comma, colon or full stop between Chinese characters on any screen I read.
- **D-121:** the reply button is "回复 {nama}" in the dictionary (read in `i18n/kamus/ceritaHp.ts`).
- **Title, endings, end screen:** zh title "高速公路上的半挂卡车" on the episode list and in the end-screen header; en "A Trailer Truck on the Toll Road". Ending line zh "Leasing Sentosa 已经收到赔款。Hendra 先生的理赔全部赔付完毕。"; en ending title "Closed, with reservations" with its matching card sentence; zh "结案，但有不足" with "…有些时候他苦等不到消息…"; status word "Worried" / "担心". Layout holds at 390, no horizontal scroll.

### Polish, does not block (interface dictionary, not the episode text)
- [D-127] Chinese status line under a reason card · "Hendra 先生仍是担心，但有所下降" / "…仍是平静，但有所好转" reads oddly ("is still worried, but has declined") · `i18n/kamus/ceritaHp.ts` zh `statusTetapTurun`: `'{nama}的状态仍是“{ke}”，但略有下降'`, `statusTetapNaik`: `'{nama}的状态仍是“{ke}”，但略有好转'` · low. Older string, not introduced by T-014.
- Two screen-reader-only Chinese strings still have small slips that sighted players never see: the chat speaker label "Hendra 先生:" (ASCII colon) and `cerita.ts` zh `statusAria` "与Hendra 先生的关系状态" (no space before the Latin name). Low; fix when that file is next touched.

### Not verified by me
A native speaker's read (still advised before public release, as in the first review); 360 and 1280 in this round (the brief asked for 390; layout was checked at 390 and 1280 in the first review); a real phone; the K02 activity played by hand (I used Fullstack's saved after-activity state for it; K08 I played myself); the test suites (Fullstack reports 738 / 738, e2e clean, `cek-bahasa-t014.mjs` 138 / 138).

---

## T-017 — motion re-check (2026-11-16)

Reviewer: Designer · Build: production build in client/dist (08:44, no source file newer) on my own server on :4002, started at below-normal priority and stopped by me; :4000 not touched · No source edits, no commit.
Run light, as asked: one headless browser at a time, closed after each size, everything at below-normal priority, no test suite. One recording of the K04 pool walk per size (360×740 DPR 2, 390×844 DPR 3, 1280×800; every distinct canvas frame with timestamp, pose and foot x) and one still each of bengkel and tol at 1280 and 360. Evidence: `team/evidence/T-017/designer/recheck/` (`jalan-360/390/1280.gif`, `diam-1280-pool-bengkel-tol.png`, `diam-360-pool-bengkel-tol.png`, `diam-390-pool.png`, `ukur-gerak.json`).

### Verdict: PASS. D-125 and D-126 are fixed.

### D-125, foot slip
| Size | Poses (first) | Travel per pose | Walk time | Slip at each pose change |
| --- | --- | --- | --- | --- |
| 360 | 4 (kontak) | 140–152 world px (35–38 art) | 1.08 s | 5, 4, 7 art px behind |
| 390 | 3 (lintas) | 148–152 (37–38 art) | 0.82 s | 1, 5 art px behind |
| 1280 | 4 (kontak) | 168–176 (42–44 art) | 1.10 s | 1 ahead, 3 ahead, 0 |

Before the fix every pose change put the planted heel 14–22 art px behind. Now it is within 5 art px everywhere except one change at 360 (7 art px, the kontak → lintas change, which needs 43 art px and gets 36). That is 3.5 CSS px on the phone and I accept it: 3 poses at 360 would overshoot by more. Pose length measured 266–284 ms; travel on whole art px; he ends standing at x 420 at all three sizes.

### The stop
Clean. From the last walk frame to the standing frame the head does not move vertically at any size and moves 2, 2 and 0 art px sideways (360 / 390 / 1280); head width is unchanged.

### D-126, feet and heads
- **1280:** pool, bengkel and tol all show the standing figure whole, shoes included, with the head clear of the top (pool measured: 2 art px of air, figure 198 art px tall, soles on the last row of the canvas). There is no ground under the shoes at 1280; that is the price of a 200-art-px-high view and I accept it.
- **390 pool:** whole, 7.75 art px of air above the head.
- **360:** pool and tol whole. Bengkel at 360 shows the admin from the hips up: this is the phone close-up while she is the speaker, which Fullstack left alone on purpose. Agreed, it is a designed framing, not a cut.

### Tempo: keep 270 ms; 300 ms is not advisable as a default
The walk is now 0.8–1.1 s at about 135–155 art px per second, a normal walking pace at about 110 steps a minute. On phones he is on screen for roughly the last 0.5–0.9 s of it (first visible 166 ms after the start at 360, 282 ms at 390). Going to 300 ms would add only 0.1 s and slow the cadence without making him more visible, because on phones the length of the entrance is set by how close the view's left edge is to his slot, not by the tempo. Change `LANGKAH_JALAN_MS` to 300 only if the owner says on the phone that he rushes in.

### Not verified by me
The walk seen at speed by a human eye (this is again frame recordings and measurements); a real phone; wawancara at 1280 after the camera rule (Fullstack reports it whole; not in this brief); reduced motion and "Lanjut" mid-walk were verified in the first review and not repeated; no test suite was run.

---

## T-018 — Stage 1 review + Stage 2 rules (2026-11-16)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: production build in client/dist on my own server on :4002 (started and stopped by me; :4000 not touched). **The build changed while I worked:** it was 11:24 when I started and was rewritten at 11:42 (T-019 work: the endings became stage scenes). The Stage 1 chat files (`Obrolan.tsx`, `PilihBalasan.tsx`, `desain.css`, `ekor.ts`) are the same in both, so the chat findings stand; the longest chat state (`obrolan-b4`) could no longer be opened as a chat at 360×640 in Chinese after 11:42.
Method (run light: one headless Chrome at a time, closed between sizes, below-normal priority, no test suite): read the spec + Rev 1.1 and HANDOFF "T-018 Stage 1"; measured and photographed the chat states of `team/evidence/T-018/states.json` at 390×844 DPR 3 and 360×640 DPR 2 in id and zh (owner case, longest chat, task card, session gate, reply choices open / scrolled / chosen, opened history, the new-message pill, safe-area insets 47 / 34 emulated), desktop at 1280×800; measured the six reply prompts at the owner's real visible page size; measured today's stage, activity and end screens at 360×640 by walking forward from the 22 saved states. I opened 17 screenshots. Evidence: `team/evidence/T-018/designer/`.
Owner's visible page: measured from `owner/balas-terlalu-tinggi-1.jpg`, the page area is **390 × 645 CSS px** (toolbar expanded). All "fits" claims below use that size, not 844.

### Verdict: FIX NEEDED
- **The scrolling shell itself: PASS.** It behaves like a chat app.
- **The reply moment: FIX NEEDED, [D-128] high** (owner feedback 11:42): the question + reference card + choices are 878–1,037 px tall in a 347 px window. Compact, more game-like design specified below, with a mock.
- [D-129] med (sound banner), [D-130], [D-131] low.

### 1. Chat screens: what I confirmed
| Check | 390×844 | 360×640 |
| --- | --- | --- |
| Page height / screen height | 844 / 844 in all 27 measured states | 640 / 640 in all chat states |
| Horizontal overflow | none | none |
| Story header, chat header | fixed rows, 57 px (66 when the part title wraps) and 65 px | same |
| Message window (owner case / task card) | 573 / 441 px | 369 / 215 px |
| Reply button | 768–826, 18 px above the screen edge | 564–622, 18 px |
| With insets 47 top / 34 bottom | header 98 px, button ends 44 px above the edge (34 + 10) | same |
| New-message pill | 44 px high, centred (130–260), 10 px above the composer; tap goes to the end | same (115–245) |
| Pill wording | "Pesan baru ↓" / "新消息 ↓" | same |
| Opened history | first message reachable inside the window (5,643 px of content) | same (5,794 px) |
- **Reads as a chat app:** yes. Header and reply row stay put, only the messages move, the newest message sits just above the reply row, a hairline separates list and composer.
- **Against the owner's screenshot** (`owner/chat-page-scroll.jpg`): same header, bubbles, "Kenapa" card, day chip and button. Differences: the page no longer scrolls, the chat header has rounded top corners, a hairline above the composer. No regression.
- **Chinese:** layout holds at both sizes; the reply button reads "回复 Hendra 先生".
- **Desktop 1280:** unchanged behaviour: the page scrolls (1,326 px), the chat header is sticky as before, the choices open inside the composer. Fullstack's before / after capture of the owner case is byte-identical (I hashed both). Their before / after of the longest chat differs in a 161 × 51 px box at the header portrait, because that state was regenerated at 11:54 on the newer build; not a layout change.

### 2. [D-128] Reply moment: compact game-style sheet · high
**Problem, measured at 390 × 645 (message window 347 px, composer 104 px, sound banner 48 px):**
| Decision | Today: block height | of which reference card | of which choices |
| --- | --- | --- | --- |
| K03 "Apa yang kamu jelaskan sekarang?" | 1,037 | 464 | 508 |
| K06 "Bagaimana kamu menjawab?" (owner's screenshot) | 1,016 | 442 | 508 |
| K13 "Apa penjelasanmu?" | 933 (en 999) | 360 | 508 (en 553) |
| K14 "Bagaimana kamu menanggapi keberatan ini?" | 878 | 281 | 508 |
| K01 "Apa balasan pertamamu?" | 636 (en 681) | none (41 px first-time hint) | 530 (en 575) |
| K12 "Bagaimana kamu membalas?" | not measured (no card; about 600) | none | about 510 |
All six decisions of Episode 2 are chat decisions, so one component fixes every case the owner saw. Also today: the "Kirim balasan" button jumps 27 px when a choice is made, because the line "Pilih satu balasan dulu." under it disappears.

**Design (one recommendation): the reply is a card that slides up from the composer.** Mock: `team/evidence/T-018/designer/balas-ringkas-mock-390x844.png` (three states: open, chosen, note open); single states `mock-*.png`; the page itself `balas-ringkas-mock.html` (real game font and texts; `#node=k13&lang=en&pilih=2&tampil=nota`).
- **Where:** in the pinned composer slot, not at the end of the message list. Tap "Balas Pak Hendra" → the sheet slides up; the message window shrinks and stays at its end, so the tail of the customer's last message shows above the sheet.
- **While the sheet is open:** the sound banner is hidden; the chat header becomes one slim row (44 px instead of 65).
- **Top edge:** a grab handle; tap it or swipe down to close the sheet and read the chat (back to "Balas …"; the selection is kept).
- **Question row:** Miss Raksa's 32 px pixel icon in a framed square, then the question.
- **Choices:** five numbered rows with a pixel-cornered number badge. Tap = select; tap another row to change. No collapse into the "Pratinjau · belum dikirim" bubble on phones.
- **Send button:** disabled it says "Pilih 1 balasan"; after a choice "Kirim balasan 5 →". This replaces the separate line under the button and the first-time hint paragraph, so nothing jumps.
- **Reference card → "Catatan" sticky note:** a yellow note tab stuck on the sheet's top edge at the right, with a red unread dot until opened. Tap → the sheet body flips to the note, with "← Kembali ke balasan" where the send button was. The note is a plain list (label bold, value under it), no stepper. Only K03, K06, K13, K14 have one.
- **Not adopted:** a Hendra-mood hint per choice. It would tell the player which answer is right.
- **Keyboard / screen reader:** radiogroup as today; keys 1–5 select, Enter sends, Esc closes; focus moves to the question on open.
- **Motion:** sheet 180 ms ease-out (24 px rise + fade); rows appear 30 ms apart; the chosen badge pops (scale 1 → 1.15 → 1, 140 ms). None of it under reduced motion.

**Numbers (CSS px):**
| Part | Value |
| --- | --- |
| Sheet | full width of the chat card; padding 0 10 8 (+ bottom inset); background `#fffdf6 → #fbf4e1`; top border 2 `#d9b45a`; radius 16 16 0 0; shadow `0 -4px 0 rgba(30,45,36,.10)` |
| Handle | zone 10 high; bar 36 × 4, radius 2, `#d8c58f`; touch area 44 high |
| Question row | min-height 36; gap 8; icon box 36 × 36, border 2 `#215c40`, radius 8, fill `#fbe9c8`; text 16 / 20, weight 800, max 2 lines |
| Choice list | margin-top 6; gap 5; max 5 rows |
| Choice row | grid 24 + 1fr, gap 8; padding 6 10 6 8; border 2 `#d9dfce`; radius 10; fill `#fff`; `inset 0 -2px 0 #e7ebdf`; text 15 / 19, weight 500; min-height 44 |
| Number badge | 24 × 24, stepped corners by `clip-path` (2 px steps); fill `#215c40`, digit 14 / 800 `#fffdf6` |
| Chosen row | border `#215c40`; fill `#eaf0e1`; `inset 0 -2px 0 #b9c9a4`; badge `#e0b84f` with digit `#1e2b24`. Other rows: text `#4d5a52`, badge at 55 % opacity (do not fade the whole row as the mock does) |
| Send button | margin-top 8; height 48; radius 12; `#215c40`; label 16 / 800; `inset 0 -3px 0 #163f2c`. Disabled: `#c9d3c5`, text `#4d5a52` |
| Note tab | height 36; sticks 26 above the sheet, 14 from the right; border 2 `#b5871a`; radius 4 4 12 4; fill `#ffe58a`; text 13.5 / 800 `#4a3606`; rotate −2°; unread dot 10 `#c2452d`; touch area 44 |
| Note card | margin-top 8; padding 10 12 12; border 2 `#b5871a`; radius 4 4 14 4; fill `#fff3c4`; title 15 / 20 / 800; rows gap 6, label 15 / 800, value 14.5 / 19; footnote 13 / 17 `#6b4e08` |
| Slim chat header | height 44; portrait 32; name 16 / 800; status chip inline |
Sheet height = 218 + 19 × (text lines of the five choices), 222 with a two-line question. Room for it = screen height − 57 (story header) − 8 − 44 (slim chat header): 536 px at 390 × 645, 531 at 360 × 640.

**Result, measured in the mock (all six decisions):**
| Visible page | Language | Choice lines | Sheet height | Chat left above the sheet |
| --- | --- | --- | --- | --- |
| 390 × 645 (owner) | id | 12–14 | 446–484 | 52–90 px |
| 390 × 645 | en | 12–14 | 446–484 | 52–90 px |
| 390 × 645 | zh | 8–10 | 370–408 | 128–166 px |
| 360 × 640 | id | 13–15 | 465–503 | 28–66 px |
| 360 × 640 | en | 13–16 | 465–522 | 9–66 px; K01, K13 and K14 leave only 9 px, so no chat shows |
| 360 × 640 | zh | 8–11 | 370–427 | 104–161 px |
| 360 × 740 | id / en | 13–16 | 465–522 | 109–166 px |
- **Target met:** at 390 × 645 the question and all five choices and the send button are visible without scrolling, in all six decisions, in id, en and zh. Note view: 366–465 px (id, en), also without scrolling. The mock has no 44 px minimum on one-line rows, which only Chinese has; with it the Chinese sheets grow by up to about 30 px and still fit.
- **When it does not fit** (any future longer text, or a screen shorter than 640): sheet max-height = screen − story header − slim chat header − 8; the choice list becomes the one inner scroller, the send button stays pinned.
- **Copy rule for new decisions:** five choices, each at most about 120 characters in Indonesian (150 in English), together at most about 520.

**Cost:**
| Kind | Items |
| --- | --- |
| CSS / TSX only | sheet, handle, numbered rows, pixel badge (`clip-path`), note tab and note card, slim header, motion; `PilihBalasan` renders the list in the composer again and gets the note view. About 1.6 KB of CSS before compression (my estimate) |
| Existing art, no new bytes | `ikon-miss-raksa.png` (509 B, already shipped for Riwayat and the end card); Hendra's header portrait; the document icon already inline in `KartuDokumen` |
| New raster art | none |
The mock's Hendra portrait is cropped from my own capture of the game; the mock is a static page, not the game.

### 3. Other Stage 1 items
- [D-129] All phone screens · the first-visit sound banner takes 56 px (48 + gap) on every screen until "Tutup" is tapped; the owner's screenshots still show it in Part 2 · show it once, on the first screen of the episode only; remove it on the first tap of any primary button or after 6 s, and remember that as today; never show it while a reply sheet or an activity is open · med.
- [D-130] Chat header · Hendra's portrait disappears from the header whenever a cut-in portrait exists in the current thread, even after that message has scrolled out of view (rule `.hp-obrolan[data-cutin] … .hp-potret { display: none }`). With the inner scroller the header is then faceless for the rest of the conversation (seen at K01 with choices open, and in Part 4) · hide it only while the cut-in is inside the visible window, or always show it · low. Older rule, not introduced by Stage 1.
- [D-131] Task card in the composer, 360 × 640 · the card is 222 px, leaving 215 px of messages (246 in Chinese) · after D-129 that becomes 271 px, which is enough; if more is wanted, at screen heights below 700 use card padding 10, title 17 px, and clamp the instruction to one line (card about 170 px) · low.

### 4. Stage 2 rules
Measured today at 360 × 640 in Indonesian (`tahap2-360x640.json`). Fixed rows: story header 57 (66 with a two-line part title), goal line 42, top padding 12, bottom 10. Stage width 336, so the four existing stage shapes are 336 (1:1, office close-up), 252 (4:3), 210 (16:10), 168 (2:1).

**[D-132] Dialogue / stage screen · what gives way, in this order**
1. The sound banner (D-129).
2. **The stage steps down** through the shapes that already exist (1:1 → 16:10 → 2:1 in the office close-up; 4:3 → 16:10 → 2:1 elsewhere) until stage + dialogue fit. **Minimum stage height: 168 px at 360 wide (2:1); 183 px at 390.**
3. The goal line hides (42 px). It must then be readable in the Menu.
4. **Only then the dialogue text scrolls** inside the dialogue box: name tab pinned at the top, the action row (Lanjut, or the task card) pinned at the bottom, 24 px fade at the bottom edge while more text is below.
| Screen | Room for stage + dialogue | Minimum stage | What happens with today's Indonesian text |
| --- | --- | --- | --- |
| 360 × 640 | 519 px (561 with the goal line hidden) | 168 | Most beats keep 252 or 210. Stage drops to 168 on K05 result (296 characters) and K11 task. Goal line hides on K11 task and K09-e. Text scrolls on K09-e (402 characters, 4 px) and on the K08 result |
| 360 × 740 | 619 px | 168 allowed; 210 is the lowest any beat uses by its own text rule | Every beat fits at its natural shape (largest total 579). Only the K08 result scrolls |
- Tallest dialogue boxes today: K09-e 397 px, K11 with task card 369, K05 result 334, K10 with task card 330. The dialogue overlaps the stage by 22 px on close shots; that overlap stays.
- **K08 result** (road diagram as evidence, no stage, 837 px): the dialogue box is the scroller, "Lanjut" pinned; about 441 px visible at 640.
- Stepping through the four tested shapes needs no new camera cases. If Fullstack lets the stage shrink continuously instead, new aspect ratios appear and the head / foot checks must be re-run at 360 × 640.
- Use the shell only from 560 px screen height for stage and activity screens (Stage 1 uses 480); below that keep page scroll.

**[D-133] Activities · one scroller, pinned head and send bar**
| Region | Rule | Size |
| --- | --- | --- |
| Pinned top | story header; activity head ("Tugas", "Kembali ke cerita", title); the question line | 57; 69; 23 (one line) or 47 (two) |
| Pinned bottom | send bar, only when the activity shows its send button; the "not yet" reason goes into the disabled button label; the "cannot be changed" note moves to the end of the scroller | 8 + 52 + 8 = 68 (+ bottom inset) |
| The one scroller | everything else: context, board or list, details, "Tampilan daftar" link | 360 × 640: 395 px with the send bar, 463 without. 360 × 740: 495 / 563 |
- **K02, 8-document request:** order inside the scroller: progress, document picture, instruction, three trays, tray contents, then "Pesan & info tugas", tray meaning, view link (the context toggle moves below the trays). At 640 the picture (214), instruction and trays (112) are all visible at once: 395 of 463 px. When the send bar appears the picture may shrink to **160 minimum**; trays keep 112.
- **K08, sign check:** also pin the sign row (sign button + "Ketuk rambu untuk memeriksa", 54 px). The scroller holds the context sentence, the road and its caption: 432 px at 640 without the send bar (content 436), 364 with it. Road box 336 square, **minimum 300**; the caption may fall below the fold.
- Other activities are 975–1,247 px tall today (K04, K05, K07, K09, K10, K15); the same three regions apply. Their question is two lines in K05, K07, K10, K11, K15.
- I did not check at which step K02 and K08 show their send button.

**[D-134] End screen / summary**
| Region | Rule | Size |
| --- | --- | --- |
| Pinned top | story header | 57 |
| Pinned bottom | action bar: primary button and the second action on one row | 8 + 52 + 8 = 68 (+ inset) |
| The one scroller | verdict card, then the decision summary | 503 px at 360 × 640; 603 at 360 × 740 |
- First view without scrolling at 360 × 640: portrait and feeling (69), ending title (27–54), cause (96–120), lesson box (155): 387–438 px of 503. The 1,733 px summary follows below in the same scroller, with a 24 px bottom fade.
- The retry button is 92 px tall today because "Coba lagi dari bagian Keputusan dan penyelesaian" wraps to three lines. On phones use a short label, for example "Ulangi Bagian 4", so the bar stays one row.
- The `/cerita` episode list keeps page scroll (Rev 1.1).

### Not verified by me
A real iPhone, and WebKit (Fullstack ran WebKit; I used Chromium only). The compact sheet in the game: the numbers come from a static mock with the real font and texts. K12's current height. English and Chinese on stage, activity and end screens (Stage 2 numbers are from Indonesian at 360 × 640; 360 × 740 follows by arithmetic because widths are equal; 390 not measured for Stage 2). Activities after their first screen. The test suites. The CSS size estimate.

---

## T-019 — review (2026-11-16)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: production build in client/dist (11:42:38, newer than `episode.ts` and `hendra.png` of 11:38) on my own server on :4002 (started and stopped by me; :4000 not touched).
Method (run light: one headless Chrome at a time, closed between sizes, below-normal priority, no test suite): read HANDOFF "T-019"; for `akhir-puas`, `akhir-catatan`, `akhir-kurang` at 360×740 DPR 2, 390×844 DPR 3 and 1280×800 I recorded every distinct canvas frame of the walk-in with its timestamp, pose and foot x (9 recordings, 82–101 frames each), then took the canvas and a page screenshot of both ending beats (Hendra's line, then Miss Raksa's line). Offline: pose timing and travel, Hendra's shoe positions in the atlas frames, the row-by-row overlap with Miss Raksa, and the project's own layout and camera functions (`susunAdeganPiksel`, `kameraPiksel`) run read-only for candidate slots. I opened 9 images.
Evidence: `team/evidence/T-019/designer/`: `jalan-hendra-360.gif`, `-390.gif`, `-1280.gif` (real frames at real timing, `akhir-puas`), `kandidat-slot.png` (rows: today, x 1040, x 1060; columns: 360 beat 1, 360 beat 2, 390 beat 2, 1280 beat 1; cream band = what the dialogue box covers; Miss Raksa clipped at the counter in rows 2 and 3), `wajah-hendra.png`, `jalan-tengah-1280.png`, `kaki-hendra-x6.png`, four page screenshots, `kamera.json`, `ukur-jalan.txt`.
Limit: I cannot watch a moving picture; the walk verdict rests on frame recordings and measurements.

### Verdict: FIX NEEDED — two numbers and one clip. The restage itself works.

### What works
- **The scene plays as specified.** Kantor, Miss Raksa behind the counter, Hendra walks in from the right edge with mirrored frames and stops facing her; no phone cut-in. Measured: 5 / 5 / 6 poses at 360 / 390 / 1280, first pose lintas / lintas / kontak, last pose lintas, 266–292 ms per pose, walk 1.37 / 1.36 / 1.64 s, every step on whole art px.
- **Stop:** no jump. Head top row 20 while walking, 19–20 standing (the speaker's breathing); the silhouette widens 3–4 art px on the counter side and 7–8 on the other as his hand goes to his hip.
- **Expression per ending** (`wajah-hendra.png`): puas = eyes closed, smiling; catatan = calm; kurang = displeased, looking aside. All three fit their lines. Keep `kecewa` for kurang; `cemas` would be wrong here.
- **Mirrored frames:** Hendra carries no badge or lettering, so nothing reads backwards. Two arms and two legs in both walk frames; the phone stays in the hand nearest the counter while walking and standing.
- **Board and name tab:** "LAYANAN KLAIM RAKSA" is whole and clear of both heads in all six views (three sizes × two beats; Miss Raksa's hair starts 2 art px right of the board). The dialogue name tab and the "Hadir: Miss Raksa, Pak Hendra" line read fine.
- **Miss Raksa** changes to senyum / serius / serius on her own line.
- **Bytes:** `hendra.png` is 25,920 B (checked). I did not re-add the Episode 2 total.

### What is wrong
- [D-135] All three endings, all sizes · **Hendra covers Miss Raksa.** At slot x 980 his frame spans art px 207–291 and hers 167–227: his arm covers her right arm by up to 10 art px on 15 rows, and their head boxes are about 4 art px apart, so the two figures read as one mass (`layar-akhir-catatan-390-b0.png`). The slot is my own number (D-100 / D-105); I re-seated it for a lone visitor and never checked it against Miss Raksa · **Hendra's x in the kantor: 980 → 1040**, as a per-character value on kantor slot 1 (`xTokoh: { hendra: 1040 }` in `bangun-ruang-ep2.mjs` / `ruang-ep2.json`), so Pak Bima at K07 stays at 980. Result: 5 art px of air between his phone hand and her sleeve, heads about 19 art px apart, the letter prop on the counter becomes visible between them · **high**.
  - Why not further right: in the phone close-up of the second beat the view is only 220–224 art px wide and must hold the board (from art px 78). At 1040 the tip of his elbow is cut by 4 (360) and 8 (390) art px; at 1060 by 9 and 13, with his body almost at the frame edge at 390; at 1100 the 390 camera falls back to a smaller scale. 1010 is off the art-px grid, and at 1012 he still covers her by 2 art px.
- [D-136] The walk, all sizes · **his feet slide.** The code moves him 36–46 art px per pose (the constant tuned on Rudi), but Hendra's drawn step is shorter: front heel 15 ahead of the anchor and back heel 51 behind in the contact frame, standing heel 14 behind in the passing frame, so one step is about 66 art px (Rudi: 82) and a pose should cover 29 then 37. Measured slip per pose change: **8–17 art px at 360, 3–8 at 390, 2–12 at 1280** (± 2). That is the D-125 fault again, smaller · make the travel per pose a per-character value: **Hendra 128 world px (32 art px), Rudi stays 164**; raise `POSE_JALAN_MAKS` 6 → 7 (Rudi never exceeds 4). With slot 1040 that gives:

  | Size | Distance | Poses | Travel per pose | Walk time | Slip per pose change |
  | --- | --- | --- | --- | --- | --- |
  | 360 | 818 world px | 6 (was 5) | 34.1 art px | 1.62 s (was 1.37) | about +5 / −3 |
  | 390 | 695 | 5 | 34.8 | 1.35 s | about +6 / −2 |
  | 1280 | 876 | 7 (was 6) | 31.3 | 1.89 s (was 1.64) | about +2 / −6 |

  The unit test and `cek-jalan-t017.mjs` expect 5 / 5 / 6 and need the new counts. Priority **high at 360**, med elsewhere.
- [D-137] Kantor, every scene with Miss Raksa, all sizes · **her shoes stand on the floor in front of the counter.** Her frame reaches art row 189 but the counter layer ends at row 169, so 20 rows of shin and shoe are drawn below the counter front. It is not only 1280: it shows wherever the dialogue box or the status chip does not cover that spot (1280 both beats, phone second beat, opening scene). I passed the kantor in T-013 without seeing it. Next to Hendra's legs it now looks like a third pair of feet · not one line but three: clip the `balikMeja` figure to above the counter's bottom edge (world y < 680) around `tokohDi('balikMeja')` in `PanggungPiksel.tsx` · **med; fix it with this task**.
- [D-138] 360, first beat · the status chip wraps to two lines (181 × 42 CSS px) and covers Hendra's phone hand and thigh; at 390 and 1280 it is one line (194 × 25) · let it stay on one line at 360 (it needs 194 px; the stage is 336) · low.

### Answers to the three questions
- **Hendra slot x: 1040** (D-135), for Hendra only.
- **Kantor camera drop for these scenes: no.** The cut that Fullstack measured at the canvas edge (6 / 44 / 16 art px at 360 / 390 / 1280) is never seen, because in these scenes the dialogue box overlaps the bottom 22 CSS px of the stage. What the player sees: his legs go behind the dialogue box 28 / 61 / 27 art px above the soles in his own beat (lower shin; mid-thigh on the 390 close-up) and 7 / 10 / 11 art px in Miss Raksa's beat (through the shoes). That reads as "standing behind the dialogue box", not as a cropped picture. The most the camera could drop is 4 art px (Miss Raksa's hair has 6 of air, the rule keeps 2), which changes none of this. I also tried raising his feet by 8 and 16 art px: it frees the shoes in the second beat but moves the first-beat cut to the ankle or into the shoes, which is worse. Keep slot y 860.
- **Miss Raksa's shoes: fix, with the three-line clip** (D-137).

### Observations, no change asked
- He is outside the view for the first 0.29–0.36 s of the walk (he starts a full frame width beyond the edge), so about 1.1–1.3 s of it is visible today. Same rule as Rudi; leave it.
- The baked walking face (my T-017 art) looks slightly worried, and the two walk frames differ a little. On arrival it changes to the ending's expression; in `akhir-puas` that reads as worried, then relieved. Acceptable; no new art.
- Between the two ending beats the stage box changes height, so the phone view cuts from scale 1 to 1.5 (360) and 1.33 to 1.67 (390). Older behaviour of every kantor scene.

### Not verified by me
The walk seen at speed by a human eye; a real phone; reduced motion and "Lanjut" mid-walk (Fullstack's check covers them; same code I verified for Rudi in T-017); slot 1040 and the 128 px stride in the running game (computed with the project's own layout functions and the atlas geometry, not built); English and Chinese; the Episode 2 byte total; the test suites.

---

## T-019 — re-check (2026-11-16)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: production build in client/dist (12:19:23, newer than `tata.ts`, `PanggungPiksel.tsx` and `ruang-ep2.json` of 12:18; unchanged during my run) on my own server on :4002 (started and stopped by me; :4000 not touched).
Method (run light: one headless Chrome at a time, closed between sizes, below-normal priority, no test suite): read HANDOFF "T-019 → Fix"; recorded every distinct canvas frame of the `akhir-puas` walk at 360×740 DPR 2, 390×844 DPR 3 and 1280×800 (98, 81 and 115 frames) and took both ending beats there; both beats of `akhir-catatan` and `akhir-kurang` at 390; K07 with Pak Bima and the opening scene (Miss Raksa alone) at 1280. Analysed the walk offline with the heel positions from my first review. I opened 8 images; `diam-kurang-390-b0.png` and `diam-catatan-390-b1.png` are saved but not opened.
Evidence: `team/evidence/T-019/designer/recheck/`.
Limit: I cannot watch a moving picture; the walk verdict rests on frame recordings and measurements.

### Verdict: PASS. D-135, D-136, D-137 and D-138 are fixed.

### What I confirmed
- **D-135, the two figures are apart.** Hendra's foot x is 1040 in all three endings and both beats (`data-kaki`). At 360, 390 and 1280 there is air between his phone arm and her sleeve, and their heads no longer touch. In the phone close-up of Miss Raksa's beat the tip of his elbow is cropped by the frame edge, as predicted (4 and 8 art px); his body and head are well inside.
- **D-136, the feet hold.**

  | Size | Poses | First / last pose | Walk time | Travel per pose | Slip per pose change (was) |
  | --- | --- | --- | --- | --- | --- |
  | 360 | 6 | kontak / lintas | 1.63 s | 33–35 art px | −3 to +6 (8–17) |
  | 390 | 5 | lintas / lintas | 1.35 s | 34–37 | −2 to +5 (3–8) |
  | 1280 | 7 | lintas / lintas | 1.90 s | 30–33 | −6 to +4 (2–12) |

  Pose length 266–284 ms, every step on whole art px. 6 art px is one more than my target of 5 and the same order as the 7 I accepted for Rudi at 360; fewer or more poses would be worse. He becomes visible 0.32–0.40 s after the start.
- **Stop:** unchanged and clean: head top row 20 walking, 19–20 standing; the last walk frame is 1–2 art px from the slot.
- **D-137, Miss Raksa's shoes are gone**, in the endings at all three sizes and in the opening scene at 1280 (`sepatu-sebelum-sesudah-1280.png`: my capture of 07:35 today against now). Nothing else is lost: against that older capture the stage differs only at the shoes, on her own figure above the counter (expression and breathing) and in the dialogue name tab (the older capture was English); phone, card stand, counter, board, poster, clock, plant and floor are identical.
- **D-138, status chip:** one line, 194 × 25 CSS px, at 360 (189–194 at 390 and 1280). At 360 its right end sits directly under the tip of his phone; it no longer covers his hand or thigh. Acceptable.
- **Pak Bima at K07, 1280:** still at x 980 (`data-kaki`), facing the counter, framed as before.
- **Other two endings at 390:** catatan calm, kurang displeased; Miss Raksa serious in her beat; board whole.

### Remaining, not caused by this task
- At 360 the second ending beat makes the page 785 px tall on a 740 px screen. That is T-018 Stage 2 (D-132).

### Not verified by me
The walk seen at speed by a human eye; a real phone; reduced motion and "Lanjut" mid-walk (Fullstack's check; not repeated); Pak Bima and the opening scene at 360 and 390; English and Chinese; bytes; the test suites.
