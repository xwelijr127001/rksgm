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

---

## T-018 — Stage 1b review (2026-11-16)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: production build in client/dist on my own server on :4002 (started and stopped by me; :4000 not touched). **The build was rewritten three times while I worked** (Fullstack's Stage 2): 13:31:05 for the 390×645 run, 13:55:06 for the 360×640 run, and 13:58:31 arrived during the 390×844 run. The reply-sheet files (`PilihBalasan.tsx`, `Obrolan.tsx`, `ekor.ts`, `AudioCerita.tsx`, the sheet block of `desain.css`) did not change in that time, and the 390-wide numbers agree across the runs.
Method (run light: one headless Chrome at a time, closed between sizes, below-normal priority, no test suite): read HANDOFF "T-018 Stage 1b" and the sheet code; opened the sheet from the `balas-*` states and measured every part against my D-128 table at 390×645 DPR 3 (id K03, en K03, zh K13, id K14), 360×640 DPR 2 (id K14, K03, K01; en K13, K14, K01) and 390×844 DPR 3 (id K03: motion on, reduced motion, swipe on the handle, insets 47 / 34). Task card, header portrait and sound banner at 360×640. I opened 11 images. Evidence: `team/evidence/T-018/designer/stage1b/` (21 screenshots, four `ukur-*.txt` logs, two JSON files).
Not captured: K06 at 390×645 (my script stopped at its session gate); its note view is covered by K03.

### Verdict: FIX NEEDED — two small layout fixes ([D-139], [D-140]). The sheet itself is built to the table.

### What matches the mock
| Part | Table | Built (measured) |
| --- | --- | --- |
| Handle | zone 10, bar 36 × 4, touch 44 | 10; 36 × 4; touch area 96 × 44 |
| Question row | 36; icon box 36 × 36; text 16 / 20 / 800, max 2 lines | 36 (40 with a two-line question); 36 × 36; 16 / 20 / 800 |
| Choice list | margin-top 6, gap 5 | 6; 5 |
| Choice row | 15 / 19; padding 6 10 6 8; border 2; min 44 | two lines 54, three lines 73 (19 per line + 16) |
| Badge | 24 × 24, stepped corners, `#215c40` | 24 × 24; stepped; same colour |
| Chosen row | border `#215c40`, fill `#eaf0e1`, badge `#e0b84f` / digit `#1e2b24`; others text `#4d5a52`, badge 55 % | all as specified |
| Send button | margin-top 8; height 48; 8 below | 8; 48; 8; top edge at the same y before and after choosing (no jump) |
| Note tab | 36 high, 26 above the sheet, 14 from the right, −2°, red dot | box top 25.6 above the sheet; right edge 368.6 of 390; dot until opened |
| Slim chat header | 44; portrait 32; status inline | 44; 32 × 32; status on the name row |
| Sheet height | 218 + 19 × lines (222 with a two-line question) | 484 = 218 + 19 × 14 (K03 id); 469 = 222 + 19 × 13 (K14 id) |
- **390 × 645, the owner's size:** id K03 484 (52 px of chat above), en K03 465 (71), zh K13 408 (128), id K14 469 (58). Question, five choices and the send button are all visible; the list does not scroll; the page is 645 / 645.
- **Send label:** "Pilih 1 balasan" / "Choose 1 reply" / "请选 1 条回复" (grey, disabled) → "Kirim balasan 2" / "Send reply 2" / "发送回复 2". Tap another row = change.
- **Catatan flip:** the body becomes the yellow note (title 15 / 20 / 800, labels 15 / 800, values 14.5 / 19, amber numbered badges for stages, footnotes under a dashed line), "← Kembali ke balasan" where the send button was. Back keeps the choice; the red dot is gone after the first opening.
- **Close and reopen:** handle tap, and a 60 px touch swipe down on the handle, close the sheet; the header returns to 65 px; reopening restores "Kirim balasan N" and the chosen row.
- **Motion (390 × 844, motion on):** sheet 180 ms, 24 px rise + fade, ease-out; rows 180 ms each, 30 ms apart (all in by 300 ms); badge pop 140 ms, peak 27.6 px = 1.15. Changing the choice replays only the pop. **Reduced motion:** no animation at all (none running, sheet and rows at full opacity at once).
- **Insets 47 / 34:** sheet padding-bottom 42 (8 + 34), button ends 42 px above the screen edge, inset applied once.
- **Pixel quality:** Miss Raksa's icon is drawn 1 : 1 (32 art px in 32 CSS px, `pixelated`), so it is crisp at DPR 2 and 3; badge corners are clean 2 px steps; colours and the note tab look like the mock (`k14-id-390x645-2-pilih.png` against `../mock-k14-id-pilih.png`).

### What is wrong
- [D-139] Sheet with a note, when less than 26 px of chat is left above it · **the "Catatan" tab is hidden behind the chat header.** At 360 × 640 in id K14, en K13 and en K14 the chat window is 0 px, so only a 13 px yellow sliver shows and the word is gone (`k14-id-360x640-1-buka.png`). The player cannot find the reference card for that decision. At 390 × 645 the top of the tab is cut in the note view of en K03 (12 px of chat, `k03-en-390x645-3-nota.png`) and, by arithmetic, in en K13 (14 px or less) · whenever the decision has a note, keep **at least 28 px** of the message window above the sheet (tab 26 + 2); the choice list or the note scrolls inside the sheet instead · **high at 360 × 640, low at 390**.
- [D-140] All sizes · **the sheet is 16 px narrower than the mock.** The mock's sheet spans the screen (rows 370 px at 390, 340 at 360); the built one sits inside the chat card (rows 354 / 324). My table said "full width of the chat card", so the wording was mine. The text wraps one or two lines more, which is the "about 20 px taller than the mock" in the handoff and most of the 360 × 640 fallback · let the sheet span the full screen width, side padding 10 (or the side inset if larger) · **med**. Measured by injecting one rule in my browser (`.hp-obrolan[data-berlembar] > .hp-komposer { margin: 0 -8px }`; not a source change):

  | Case | Built | Full width |
  | --- | --- | --- |
  | 390: K03 id | 484 (14 lines) | 465 (13) |
  | 390: K03 en | 465 | 446 |
  | 390: K01 id | 503 | 484 |
  | 390: K01 en, K13 en | 522 | 484 |
  | 390: K13 zh | 408 | 398 |
  | 360 × 640: K14 id | 522, list scrolls 23 px, tab hidden | 488, no scroll, 34 px of chat, tab whole |
  | 360 × 640: K01 id | 522, 9 px of chat | 503, 28 px of chat |
  | 360 × 640: K03 id | 503 | 503 |
  | 360 × 640: K13 en | 522, list scrolls 19 px | 522, fits exactly, 0 px of chat |
  | 360 × 640: K14 en | 522, list scrolls 4 px | 522, fits exactly, 0 px of chat |
  | 360 × 640: K01 en | 531, list scrolls 29 px | 531, list scrolls 10 px |

  The 390 results equal the mock's numbers (zh + 9 for the 44 px minimum row). With D-139 and D-140 together, 360 × 640 becomes: every Indonesian case measured fits with the tab visible; en K13 and en K14 scroll 28 px inside the list, en K01 10 px. The chat card has `overflow: clip`, so with my test rule the sheet's outer 8 px (its rounded corners) are cut by the card; the real fix needs the sheet outside that clip (`k14-id-360x640-5-uji-lebar.png`, `k03-id-390x844-uji-lebar.png`).
- [D-141] Rows that are not chosen · the badge at 55 % opacity leaves the white digit at about 2.7 : 1, and the digit is what "Kirim balasan 5" refers to. My own number · instead of the opacity, fill those badges `#4f7d66` (digit about 4.6 : 1) · low.

### Fallback at 360 × 640 (list scrolls inside)
- It works as designed: in id K14 the list shows 400 of 423 px, the question and the send button stay, the page stays 640 / 640. The last row is cut mid-text, which is the only sign that the list scrolls.
- The fault there is the hidden tab (D-139), not the scrolling. After D-140 the Indonesian cases no longer need the fallback.

### D-129, D-130, D-131
- **D-129 sound banner: PASS.** Fresh episode: shown on the opening scene (48 px). Gone by itself after 6 s (present at 1.1 s, gone by 6.7 s after load), stays gone after a reload, gone 150 ms after the first tap on "Lanjut", and never shown when the old key exists. No banner in any sheet state I opened. The opening screen is a stage scene and the first tap removes the banner, so it cannot meet a reply sheet in normal play.
  - Observation for Stage 2: when it leaves after 6 s, everything below moves up by its height plus gap while the player reads. On stage screens let it float over the top of the stage instead of taking a row.
- **D-130 header portrait always shown on phones: OK.** While the cut-in is in view there are two Hendra faces, 48 px in the header and the large one in the message (`k01-id-360x640-0-sebelum.png`). That reads like any chat app with an avatar; a faceless header for the rest of the conversation was worse.
- **D-131 compact task card: PASS.** 360 × 640: card 164.5 px (was 222), message window 309 px (was 215), title 17 px, padding 10. The one-line instruction is cut in Indonesian ("Susun pesan penutupan untuk Pak Hen…", 10 px too long); the title above says the same, so I accept it.

### Game feel
- **Is it "more fun and game"? Yes, clearly more than the stacked form it replaces.** It reads as a choice panel in a game: Miss Raksa's pixel face asks the question, chunky numbered keys, the gold badge on the chosen key, a sticky note for the reference card, one fat send button that names the choice. The motion is short and tidy.
- **What it still lacks is touch feedback:** the rows do not react to the finger, nothing marks the moment the send button becomes ready, and the note tab relies on a 10 px dot to be noticed.
- [D-142] Optional, CSS only, about 0.4 KB, all off under reduced motion · low:
  1. **Keys that press.** Rows: replace the inset shade by a hard edge `0 2px 0 #cfd6c3` (chosen row `0 2px 0 #215c40`); while pressed move the row down 2 px and drop the edge. Use the `translate` property for this: the rows' entry animation keeps `transform`, so a `transform` on `:active` would do nothing.
  2. **Send button "armed".** When it turns green: one pop, scale 1 → 1.03 → 1 in 160 ms, and the arrow nudges 4 px to the right and back twice (0.6 s each).
  3. **The note asks to be read.** While unread, the tab wiggles once, −2° → −6° → −2° in 0.5 s, 1.2 s after the sheet opens.
  4. **Miss Raksa hops** once as the sheet lands: 3 px up and back in two steps, 120 ms each, after the 180 ms rise.
- One line of code, not CSS, no new bytes: play the existing tap sound when a row is chosen (choosing a row is silent today).
- Not recommended: changing Miss Raksa's expression on a choice (the icon strip has five faces). A smile would read as "right answer".

### Observations, no change asked
- The sheet changes height when it flips to the note (K03 id 484 → 505, K03 en 465 → 524, K14 id 469 → 372), so the tab moves under the thumb. "Kembali ke balasan" stays at the same place, which is enough.
- Opening the note has no motion; returning replays the row stagger and the badge pop.
- In Part 4 the story header is 66 px at 390 as well ("Keputusan dan penyelesaian" wraps), so K13 and K14 have 9 px less room than my 536.

### Not verified by me
A real iPhone and WebKit (Chromium only). Keyboard (1–5, Enter, Esc, focus) and the screen-reader names: Fullstack's check, not repeated. K06 and K12 in the game; the full-width result for K06, K12, K13 id and Chinese at 360. D-139's 28 px rule and the D-142 ideas are not built or tested; the full-width numbers come from one injected rule in my browser. Desktop 1280 (not in this brief). Sending a reply from the sheet. The test suites.

---

## T-020 — activity art redesign (2026-11-16)

Designer · Working under C:\Users\User\Desktop\rksgm-episode2 · No client source edits, no commit, BOARD.md not touched.
Scope: the first brief (map fit numbers, art direction and mocks for the map and the K08 road, inventory) plus the Lead's message of 15:04 (owner's five further screenshots: fit numbers, a game-like direction with a 390 × 645 mock, and the first instruction line for the plan, K08 conclusion, witness cards, compare statements, and also the map and the K02 documents).
Naming: the owner's "k05-rencana" screenshots are the activity "Rencana pemeriksaan", node K07 in the code; I call it K07 here.
Method (run light: one headless Chrome at a time, below-normal priority, no test suite): measured today's nine activities at 390 × 645 on the production build of 13:58 on my own server on :4002 (the build was rewritten at 14:46 during that run and again at 14:58 and 15:10; I did not re-measure; server stopped, :4000 not touched). Read the owner's six screenshots. Drew mock art with scratch scripts, built one mock page with the real game font and the real Indonesian, English and Chinese texts, and measured it at 360 × 640, 360 × 740, 390 × 645 and 390 × 844. I opened about 35 images.
Evidence: `team/evidence/T-020/designer/`: 18 mock screenshots `mock-k*.png`, the mock page `mock.html`, `mock-ukur.txt` / `.json` (all measured numbers), `seni/` (mock art and sheets `_lembar-*.png`, `_pratinjau-jalan.png`), `byte.json`, `hari-ini/` (today's screens and measurements).
**What the mocks are:** static pages, not the game. The art is mock quality: tiles and backdrops are derived from the Episode 2 room PNGs, small props are drawn by script, and the portraits in the K07 / K08 / K09 mocks are cut from the owner's screenshots. English strings that do not exist yet are my placeholders.

### Shared numbers (today's build, 390 × 645)
| Region | Size |
| --- | --- |
| Story header; top padding; activity head | 57; 12; 69 |
| Question | 23.4 per line |
| Gaps between head, question, body, send bar | 8 each |
| Send bar | 74 (8 + 58 + 8) with a one-line label; 89.5–108 today where the "not yet" label wraps |
| Body = screen − 236 − question | 360 × 640: 380.6 (one-line question), 357.2 (two lines) · 390 × 645: 385.6 / 362.2 · 360 × 740: 480.6 · 390 × 844: 584.6 |
Today the body content is 458–1,216 px, so every activity scrolls, by 27–830 px at 390 × 645 (`hari-ini/ukur-390x645.txt`).

### [D-143] Shared rules for the six screens
- **One green instruction line first**, directly under the question (15.5 / 20, weight 800, `#215c40`), using strings that already exist in all three languages (listed per activity below).
- **Tap = choose, tap another = change, one send button.** Same rule as the reply sheet the owner liked. It removes the "Pilih tujuan ini" step, the "Dipilih: …" line and the "Pilihanmu masih bisa diganti…" note.
- **A strip shows the meaning of the current choice** (name 15.5 / 19 bold, meaning 13.5 / 18, 72–76 px).
- **Task info behind a yellow "Info tugas" tab** in the title row (same look as "Catatan"), where the context does not fit.
- **Send bar label on one line.** New short strings needed in three languages: "Tandai N kartu lagi.", "Cap N perbedaan dulu.", "Taruh N dokumen dulu.", "Pilih 1 kesimpulan", and the tab labels "Info tugas" and "Tandamu".
- **"Gunakan tampilan daftar"** is shown only when 52 px are spare (from about 700 px of screen height); otherwise it moves to the Menu.

### A. [D-144] Location map (K04) · fit numbers · Fullstack first
Mocks: `mock-k04-peta-awal-390x645.png`, `-pilih-390x645.png`, `-pilih-360x640.png`, `-en-360x640.png`.
First instruction: **"Tentukan di mana truk diperiksa."** (`akt.surveyor.instruksi`).
| Part | Value (CSS px) |
| --- | --- |
| Instruction; context sentence | 20; 38 (two lines) or 57 (three) at 14.5 / 19 |
| Board | takes the rest: **minimum 202, maximum 300**; 2 px dark border with stepped corners |
| Tile | box 96 wide; picture 80 × 60 in an 84 × 64 frame; label plate 13 / 15 weight 800, 1 px border, overlapping the picture's bottom edge by 8; 75 high with a one-line label, 90 with two |
| Tile positions | left column 6 from the board edge, centre column centred, right column 6 from the edge; top row 8 from the top, bottom row 8 from the bottom, centre tile centred. Order as today: Kantor Raksa top left, Meja kantor bottom left, Pool centre, Bengkel rekanan top right, Bengkel langganan bottom right |
| Rudi | his start is the strip (40 px portrait + his question); once a place is tapped a 36 px portrait sits on that tile's top right corner |
| Strip | 72–76 |
| Send bar | 74 |

| Screen | Body | Board (id / en / zh) | Result |
| --- | --- | --- | --- |
| 360 × 640 | 380.6 | 205.6–207.6 / 203.6–205.6 / 226.6 | fits, 0 spare, no tile overlaps |
| 390 × 645 | 385.6 | 229.6–231.6 / 210.6–212.6 / 231.6 | fits |
| 360 × 740 | 480.6 | 253.6–255.6 / 251.6–253.6 / 274.6 | fits, list link visible, 52 spare |
| 390 × 844 | 584.6 | 300 / 300 / 300 | fits, list link visible, 110–131 spare |
- **What gives way, in order:** the list link; the board from 300 down to 202; the context sentence (behind "Info tugas", 38–57 px); only then the body scrolls with the send bar pinned.
- The same board serves K05 (forward the photos), whose context is 159 px today; there it goes behind "Info tugas".

### B. Art direction
- **[D-145] One rule for activity art:** pixel art at **1 art px = 1 CSS px**, `image-rendering: pixelated`, never scaled by CSS. I tried 2 CSS px per art px first; at tile size it is mush (`seni/_uji-kerapatan.png`: each pair is 1 : 1 on the left, 2 : 1 on the right). 1 : 1 matches the stage at 360 (scale 1) and the 32 px head icons.
- **Palette and texture come from the rooms.** Each map tile is a miniature of the room the player later stands in: Pool = the pool stage with the trailer, Bengkel rekanan and langganan = bays of the workshop stage (langganan with blue trim and an orange plate), Meja kantor = the office counter with photos on it, Kantor Raksa = an office front built from the pool warehouse with a "RAKSA" sign.
- **Map background:** a 48 × 48 repeating grass tile, sand roads drawn as plain rectangles in CSS, two trees and a bush as sprites. No fixed-size background picture, so it works at any board size.
- **No words inside the art** except the brand name. Labels stay HTML.
- **Frames and buttons:** dark 2 px outlines `#1c2b1c`, hard 2 px drop edges, gold `#e0b84f` for "chosen", stepped corners, cork and wood (`#67442c`, `#8c5938`) for boards. Keycaps and number badges as in the reply sheet.

### [D-146] K08 road and sign check
Mocks: `mock-k08-jalan-ketuk-390x645.png`, `-tandai-390x645.png`, `-tandai-360x640.png`, `mock-k08-simpul-390x645.png`, `-simpul-pilih-360x640.png`; art `seni/_pratinjau-jalan.png`.
First instruction: **"Ketuk rambu untuk memeriksa."**, then per sign **"Ketuk lajur yang dilarang untuk truk."** (both exist).
- **The road stays top-down with traffic going up.** I considered a side view so the stage trailer could be reused, and dropped it: sign 2 says "gunakan lajur kiri" and the lanes are "dihitung dari kiri", so left must be left on the screen.
- **The truck is the pool trailer seen from above:** orange cab, grey ribbed container, 40 × 124 px, with a hard shadow. The current one is blue.
- **Signs are objects in the scene:** two pixel sign posts (24 × 44, hit area 44 × 56) on the left verge with number badges; tap a post to read that sign. This replaces the "Rambu 1" button and the "Lihat lagi Rambu …" chips. Sign 2 is dimmed until sign 1 is done.
- **Lanes as game controls:** a pixel keycap 40 × 30 with the lane number at the foot of each lane; a marked lane gets the hatch, a 2 px border, the sign's pictogram at its top, and a gold pressed keycap. The whole lane stays the tap target.
- **Geometry:** lanes 66 px wide, road block 278 px (4 lanes + two 7 px shoulders) centred, grass verges 29 px at 336 wide and 44 at 366. Today the lanes are percentages; pixel art needs fixed pixels.
- **Marking step, measured:** sign card 87 (two-line wording), instruction 20, scene 236, legend 18–36: 9 px spare at 360 × 640, 14 at 390 × 645, in id and en. The scene may drop to 204 (cropped at the top). The "next sign" button is the pinned bar.
- **Conclusion step = the reply sheet over the road.** Pak Bima's face and his question head the sheet, five numbered rows, "Pilih 1 kesimpulan" → "Sampaikan ke Pak Bima", a "Tandamu" tab for the player's marks. Activity head as one 44 px row. Sheet 469 px at 390 × 645 (67 px of road visible above), 488 at 360 × 640 (43 px); English 450. Nothing scrolls, so the jump the owner saw cannot happen.
- The caption sentence and the hatch note become one legend line under the scene.

### [D-147] K07 "Rencana pemeriksaan" (owner: confusing, needs a graphic)
Mocks: `mock-k07-rencana-awal-390x645.png`, `-pilih-390x645.png`, `-360x640.png`.
First instruction: **"Tempatkan pemeriksaan kejadian di rencana kerja."** (`akt.jalur.instruksi`), shown in the strip next to the card to be placed (magnifier icon).
- **Graphic: a cork wall planner.** Two columns "Sekarang" and "Sesudah hitungan". The workshop estimate is a yellow card already pinned under "Sekarang" with "Sedang berjalan"; the case note is a sticky note beside it; under them two dashed slots, "+ Mulai sekarang" and "+ Tunggu hitungan selesai". Tap a slot and the inspection card is pinned there.
- **The three answers without an inspection** are a row of small cards under the board with a pixel icon each (phone, checked sheet, medal), under the existing label "Atau tidak lewat papan:". All five answers are visible at once; today three are hidden behind "Lihat 3 pilihan lainnya".
- **Numbers:** strip 72–75, board 171, label 17, card row 57 (390 wide) or 72 (360). Spare: 22–25 px at 390 × 645, 2–5 at 360 × 640 in Indonesian. In English at 360 × 640 the question takes three lines and it is 18–21 px over: there the label "Atau tidak lewat papan:" hides (25 px).

### [D-148] K09 "Kartu saksi" (owner: scrolling, unclear what to do)
Mocks: `mock-k09-saksi-390x645.png`, `-360x640.png`.
First instruction: **"Pilih kartu, lalu wawancarai atau tidak perlu."** (`akt.saksi.petunjuk`).
- **Graphic: a cork board "Rencana wawancara" with five slots**, and under it the five people as cards in one row (44 px pixel portrait, name).
- Tap a card: it lifts, and a strip shows who it is with two keys, "Wawancarai" and "Tidak perlu", each with its existing one-line meaning. "Wawancarai" pins the card on the board; "Tidak perlu" greys it with a dash badge. Bar: "Tandai N kartu lagi." → "Kirim daftar ke Pak Bima".
- **Numbers:** instruction 20, board 116, card row 84–98, strip 101. Spare 40.6 px at 390 × 645 and 21.6 at 360 × 640 (id; en 26.6 / 21.6).

### [D-149] K10 "Bandingkan keterangan" (owner: does not look like a game)
Mocks: `mock-k10-banding-390x645.png`, `-3-360x640.png`.
First instruction: **"Pilih perbedaan, lalu cara mencatatnya."** (`akt.selisih.petunjuk`); after a stamp is chosen the same line shows that stamp's meaning.
- **Graphic: the two papers side by side**, "Laporan polisi" (blue head) and "Catatan petugas tol" (orange head), three rows each, the current difference highlighted in both with a red "≠" between them. Under them the script's sentence and its evidence note, with a 1 / 3 counter.
- **Five rubber stamps** in a row with their names; tap a stamp to stamp the highlighted difference, then the next difference is highlighted.
- **Content caution, needs the content owner:** the papers show only what the script states: 20.10 and 20.15; the two names as masked bars of different length; "kurang antisipasi" on the toll note and "?" on the police side, because the script says it is not known whether the police note has it. Row markers are icons, not new words.
- **Numbers:** line 20–40, papers 97, sentence box 77–130, stamps 65 below 700 px of screen height (stamp drawn 22 × 24) and 89 above (44 × 48). Spare at 390 × 645: 102.6 px, 29.6 on the longest difference. At 360 × 640: 74.2, and 1.2 on the longest.

### [D-150] K02 "Permintaan dokumen"
Mocks: `mock-k02-dokumen-390x645.png`, `-360x640.png`.
First instruction: **"Ketuk baki untuk menaruh dokumen ini."** (exists).
- Keep the idea, make it one screen: the office counter 160 px high (the kantor room at 1 : 1, already pixel art) with the document as a pixel object, its name plate and a "1/8" counter inside the picture; three pixel trays below, each with its name, its one-line meaning and a count badge. "Isi (n)" opens from the badge.
- **Numbers:** instruction 20, scene 160, trays 131 (390 wide) or 161 (360). Spare 58.6 px at 390 × 645, 23.6 at 360 × 640 (en 60.6 / 17.2).

### Replacing the SVG art, and bytes
- **Tile by tile: yes.** Every activity picture is one entry `{ svg, w, h }` in `SENI_ARENA_AUTO_2` (`episode/auto-2/arena.ts`), drawn by `GambarSeni`. An entry can be swapped for a PNG one at a time. Two conditions: the picture must be shown at exactly its pixel size (today the map picture is squeezed to 66 px), and the cleanest way is an `<img>` (an optional PNG field on the entry) rather than a PNG inside the SVG.
- The road is separate: `lokasi/seni/svg/jalan-empat-lajur.svg` (3,641 B) and `truk-biru.svg` (2,846 B) are replaced by a 66 × 52 lane tile, the truck and two sign sprites, and `geometri.ts` changes from percentages to 66 px lanes.
- **Bytes, estimated by my script as indexed PNG** (palette, zlib 9; not run through the project's exporter): the map and road set is **9,958 B for 13 files**: five tiles 888–1,523 B each (6,131 B), grass 527, two trees and a bush 855, truck 1,060, lane tile 994, two signs 391. The same files as RGBA are 2.8–4.9 KB per tile, so they must be exported indexed like the room PNGs.
- It replaces about 6.5 KB of road SVG and about 3.7 KB of `benda.ts` source for the five places.
- **Whole programme, my estimate:** about 30 KB of PNG added (map and road 10, K05 tiles and the chat photo 11, K02 documents and trays 5, K07 / K09 / K10 props 3), 10–15 KB of vector code removed. With about 168 KB today, Episode 2 stays under 200 KB of the 400 KB gate.

### C. [D-151] Inventory: 53 illustrations (48 in `SENI_ARENA_AUTO_2`, 5 road SVG files)
| Group | Count | Verdict | Priority |
| --- | --- | --- | --- |
| K04 map places `lok.*` | 5 | restyle pixel (mock art exists) | 1 |
| K08 road: road, truck, two hatches, inspect icon | 5 | restyle pixel: lane tile, truck, two sign posts; hatches become CSS; the inspect icon goes | 1 |
| K07 `kartu.periksa`, `jalur.*` | 4 | restyle as pixel icons (card, phone, sheet, medal) + cork board | 2 |
| K09 `saksi.mobilkecil` | 1 | restyle pixel (small car) | 2 |
| K09 `baki.ya`, `baki.tidakperlu` | 2 | drop: replaced by the board and two keys | 2 |
| K10 stamps `cap.*` | 5 | restyle: one pixel stamp, five symbols | 2 |
| K02 documents `dok.*` (8) and trays `baki.*` (3) | 11 | restyle pixel | 3 |
| K05 `foto.bundel`, `tuju.*` | 6 | restyle pixel, on the K04 board | 4 |
| Chat photo `foto.truk` | 1 | restyle: a pixel photo made from the toll stage and the trailer | 4 |
| K11 `bundel.*` (5) and `dok.hitungan / tender / laporan / suratpolisi.ada` (4) | 9 | keep for now; restyle with the K02 documents later | 5 |
| K11 desk prototype `meja.*` | 4 | keep; not on the phone path I measured. Drop if the prototype is retired | none |
Totals: **restyle 38, keep 13, drop 2.** K15 has no pictures.

**My art time (final art, with states, both pixel ratios and the byte check):**
| Group | Estimate |
| --- | --- |
| Map and road (priority 1) | 4–6 h; about half exists as mock art |
| K07, K09, K10 props and boards | 4–5 h |
| K02 documents and trays | 4–5 h |
| K05 tiles and the chat photo | 3–4 h |
| K11 batch | about 3 h |
| Total | 18–23 h |

### Decisions for the Lead
- **Tap = choose** on the map (and K05): it removes the "see first, then choose" step of the current board. Keeping the two steps would need a 44 px "Pilih" key inside the strip; I did not measure that variant.
- **K10 papers:** whether the masked names and the "?" are an acceptable way to show the three differences.
- **K08 truck colour:** orange like the pool trailer (my choice) instead of today's blue.

### Not verified by me
Nothing here is built: every "fits" is a measurement of my static mock with the real font and texts, not of the game. Chinese at the two sizes for K07, K09, K10 and K02 was measured but I did not look at those screens. K05, K11 and K15 have no mock and no fit numbers beyond today's heights. K08's sign-2 step and the "tap a sign" step were not measured separately. The byte figures are my own estimate. Later steps of K02 (tray contents, sending) and of K10 (after the third stamp) are not drawn. A real phone, WebKit, keyboard and screen-reader behaviour of the new layouts. The test suites.

---

## T-020 — batch 1 art (2026-11-16)

Designer · Working under C:\Users\User\Desktop\rksgm-episode2 · No client source edits, no commit, BOARD.md not touched. No browser and no server used; the art is built and assembled by one script at below-normal priority.
Scope: production pixel art for the map (K04) and the road and sign scene (K08), per the Lead's GO (tap = choose, orange truck).

### Delivered
- **Folder:** `character/aktivitas-ep2-pixel-v1/` with `peta/` (16 PNG), `jalan/` (13 PNG), a `README.md` per set (file list, sizes, anchors, states, mapping), `BYTE.md`, and the build script `alat/bangun.mjs`.
- **Preview strip at 2x:** `team/evidence/T-020/designer/batch1-strip.png` (both scenes assembled, then every asset).
- **Format:** 1 art px = 1 CSS px, indexed PNG with a palette (1 to 31 colours per file). All 29 files decode with the project's PNG reader.
- **Source of the look:** the five tiles are miniatures of the pool, workshop and office stage art; asphalt and verge colours come from the toll stage; the truck uses the pool trailer's colours.

### Byte table
| File | Size (px) | Colours | Bytes |
| --- | --- | --- | --- |
| peta/ubin-kantor.png | 80 × 60 | 31 | 844 |
| peta/ubin-meja-kantor.png | 80 × 60 | 28 | 968 |
| peta/ubin-pool.png | 80 × 60 | 24 | 1396 |
| peta/ubin-bengkel-rekanan.png | 80 × 60 | 26 | 1326 |
| peta/ubin-bengkel-langganan.png | 80 × 60 | 25 | 1441 |
| peta/bingkai.png | 84 × 64 | 1 | 124 |
| peta/bingkai-pilih.png | 88 × 68 | 2 | 140 |
| peta/bingkai-fokus.png | 88 × 68 | 2 | 140 |
| peta/pin-cincin.png | 40 × 42 | 3 | 298 |
| peta/rumput.png | 48 × 48 | 6 | 527 |
| peta/jalan-tanah-h.png | 16 × 12 | 3 | 99 |
| peta/jalan-tanah-v.png | 12 × 16 | 3 | 93 |
| peta/jalan-tanah-simpang.png | 12 × 12 | 1 | 83 |
| peta/pohon-1.png | 28 × 32 | 9 | 325 |
| peta/pohon-2.png | 22 × 28 | 9 | 289 |
| peta/semak.png | 24 × 13 | 6 | 217 |
| jalan/jalan-strip.png | 278 × 26 | 9 | 1893 |
| jalan/panah-marka.png | 18 × 27 | 1 | 137 |
| jalan/truk-atas.png | 40 × 124 | 21 | 1039 |
| jalan/truk-bayangan.png | 40 × 124 | 1 | 170 |
| jalan/muka-rambu-1.png | 22 × 22 | 3 | 187 |
| jalan/muka-rambu-2.png | 22 × 22 | 4 | 156 |
| jalan/tiang-rambu-1.png | 24 × 44 | 5 | 202 |
| jalan/tiang-rambu-2.png | 24 × 44 | 6 | 183 |
| jalan/tuts-lajur.png | 160 × 120 | 10 | 826 |
| jalan/arsir-merah.png | 12 × 12 | 1 | 132 |
| jalan/contoh-arsir-merah.png | 14 × 14 | 2 | 107 |
| jalan/arsir-biru.png | 12 × 12 | 1 | 132 |
| jalan/contoh-arsir-biru.png | 14 × 14 | 2 | 107 |
| **Total, 29 files** | | | **13,581** |

- Map set 8,310 B, road set 5,271 B.
- My estimate was about 10 KB for 13 files. The same 13 kinds of file are about 10.6 KB here; the other 3 KB are the extra pieces this brief asked for (three frames, the portrait ring, three dirt-road tiles, arrow, truck shadow, two sign faces, the keycap atlas, hatch tiles and legend swatches).

### Mapping notes for Fullstack
- [D-152] **Map:** `lok.kantor`, `lok.foto`, `lok.pool`, `lok.bengkel`, `lok.langganan` in `SENI_ARENA_AUTO_2` map one to one onto `ubin-kantor`, `ubin-meja-kantor`, `ubin-pool`, `ubin-bengkel-rekanan`, `ubin-bengkel-langganan`. Each must be shown at exactly 80 × 60 (today the picture is squeezed to 66 px). Frame at picture (−2, −2); chosen and focus frames at (−4, −4). Pixel anchors replace the percent table `TATA[5]`: pictures at x = 14, (W − 80) / 2 and W − 94; top row y = 10; bottom row ends 8 px above the board edge.
- [D-153] **Rudi's pin:** `pin-cincin.png` is a 40 × 42 ring with a 32 px round hole for the existing pixel portrait, placed at picture (+52, −8). This differs from the mock, where the 36 px token sat 14 px above the picture and would be cut off on the top row.
- [D-154] **Road:** `jalan-strip.png` (278 × 26, repeat-y, centred) with the grass tile behind replaces `jalan-empat-lajur.svg`; `truk-atas.png` (40 × 124) replaces `truk-biru.svg`. `geometri.ts` changes from percent of a 360 box to pixels: lane n left = (W − 278) / 2 + 7 + (n − 1) × 66, width 66; truck at lane left + 13, top 80 in a 236 px scene. `seni.test.ts` checks the old numbers against the SVG files and needs the new ones.
- [D-155] **Lane controls:** `tuts-lajur.png` is one atlas, cell 40 × 30, columns = lane 1 to 4, rows = normal, chosen (gold), forbidden (red hatch, sign 1), left lane (blue hatch, sign 2); keycap at lane left + 13, top 200. Marked lanes use the 12 × 12 hatch tiles at 55 % opacity with a 2 px border, plus the sign face at the lane's top.
- **Sign posts** stand on the left verge (left 10 at 366 wide, 2 at 336; tops 28 and 124) with a 44 × 56 tap area. Badges, the truck's dashed ring and label plates stay CSS.
- Trees, bush and grass are shared between the two sets (they live in `peta/`).

### Differences from the mocks
- The road strip is one 278 px wide tile (shoulders and lane lines included) instead of a single lane tile: one background image for the whole road.
- The dirt roads on the map are textured tiles, not flat CSS rectangles.
- The "Bengkel langganan" recolour was cleaned (no stray blue pixels).
- Keycaps carry pixel digits and have four states instead of two.

### Not verified by me
Nothing is wired into the game and I did not open a browser: the scenes in the strip are assembled by the script, not rendered by CSS. How the files look at device pixel ratio 2 and 3 on a phone. Whether the portrait component can draw Mas Rudi crisply at 32 px. Tile repeat seams of grass and asphalt on a real screen (they are noise tiles; I see none in the 2x strip). The Kantor Raksa front is my invention (the story art has no office exterior) and carries the word "RAKSA" and a "P"; no other words are in the art. The total against the 400 KB gate was not re-measured. The test suites.

---

## T-020 — batch 2 art (2026-11-16)

Designer · Working under C:\Users\User\Desktop\rksgm-episode2 · No client source edits, no commit, BOARD.md not touched. No browser and no server used; one build script at below-normal priority.
Scope: production pixel art for the planner board (K07), the witness board (K09) and the compare papers (K10), after the owner's go on the mocks.

### Delivered
- **Sets** in `character/aktivitas-ep2-pixel-v1/`: `papan/` 18 files 3,069 B, `saksi/` 8 files 1,309 B, `banding/` 12 files 2,062 B. **38 files, 6,440 B.** With batch 1 the folder holds 67 files, 20,021 B.
- A `README.md` per set (files, sizes, nine-slice values, anchors, states, mapping), `BYTE.md` for all sets, build script `alat/bangun2.mjs` with shared helpers in `alat/kit.mjs`.
- **Preview strip at 2x:** `team/evidence/T-020/designer/batch2-strip.png` (three rough assemblies without text, then every asset).
- All 38 files are indexed PNG at 1 art px = 1 CSS px.

### Byte table
| File | Size (px) | Palette entries | Bytes |
| --- | --- | --- | --- |
| banding/beda.png | 22 × 22 | 4 | 157 |
| banding/cap-kecil.png | 110 × 48 | 10 | 244 |
| banding/cap.png | 220 × 96 | 11 | 448 |
| banding/ikon-jam.png | 12 × 11 | 3 | 132 |
| banding/ikon-pensil.png | 12 × 11 | 5 | 139 |
| banding/ikon-wajah.png | 12 × 11 | 4 | 139 |
| banding/jejak-cap.png | 220 × 20 | 2 | 265 |
| banding/kepala-polisi.png | 6 × 18 | 3 | 96 |
| banding/kepala-tol.png | 6 × 18 | 3 | 96 |
| banding/kertas-9i.png | 18 × 18 | 3 | 122 |
| banding/kotak-kemajuan.png | 30 × 10 | 5 | 132 |
| banding/sorot-9i.png | 12 × 22 | 2 | 92 |
| papan/bingkai-kayu-9i.png | 24 × 24 | 6 | 189 |
| papan/chip-9i.png | 18 × 20 | 4 | 131 |
| papan/chip-pilih-9i.png | 18 × 20 | 4 | 131 |
| papan/gabus.png | 32 × 32 | 6 | 381 |
| papan/ikon-jam.png | 12 × 11 | 3 | 132 |
| papan/ikon-kaca-kecil.png | 15 × 15 | 7 | 172 |
| papan/ikon-kaca.png | 30 × 30 | 7 | 250 |
| papan/ikon-lembar-cek.png | 24 × 24 | 7 | 216 |
| papan/ikon-lencana.png | 24 × 24 | 8 | 240 |
| papan/ikon-telepon.png | 24 × 24 | 7 | 183 |
| papan/kartu-kerja-9i.png | 18 × 20 | 5 | 135 |
| papan/kartu-periksa-9i.png | 18 × 20 | 5 | 141 |
| papan/nota-9i.png | 18 × 18 | 4 | 135 |
| papan/pin.png | 8 × 10 | 4 | 125 |
| papan/plat-kolom-9i.png | 12 × 18 | 4 | 115 |
| papan/plus.png | 20 × 20 | 4 | 143 |
| papan/slot-9i.png | 24 × 24 | 2 | 117 |
| papan/slot-isi-9i.png | 18 × 18 | 4 | 133 |
| saksi/ikon-pin.png | 12 × 15 | 5 | 155 |
| saksi/ikon-strip.png | 12 × 12 | 3 | 114 |
| saksi/ikon-tanya.png | 12 × 11 | 3 | 134 |
| saksi/kartu-9i.png | 72 × 18 | 7 | 196 |
| saksi/kartu-tidak-9i.png | 18 × 18 | 3 | 122 |
| saksi/lencana-strip.png | 18 × 18 | 4 | 133 |
| saksi/mobil-kecil.png | 48 × 22 | 11 | 306 |
| saksi/tombol-9i.png | 36 × 22 | 5 | 149 |
| **Total, 38 files** | | | **6,440** |

### Mapping notes for Fullstack
- [D-156] **Frames are nine-slice PNGs** (files ending `-9i`) for CSS `border-image` with `repeat`, so one small file serves any box size. The slice values are in each README. Cork, wooden frame, dashed slot and pin live in `papan/` and are shared by K07 and K09.
- [D-157] **K07:** `kartu.periksa` becomes `kartu-periksa-9i` plus the magnifier (30 px in the strip, 15 px on the placed card); `jalur.telepon`, `jalur.jelas`, `jalur.percaya` become three 24 × 24 icons. New pieces: column plates, yellow job card with a clock, sticky note, dashed slots with a "+" key, chips in two states.
- [D-158] **K09:** `saksi.mobilkecil` becomes `mobil-kecil.png` (48 × 22) with a "?" badge; `baki.ya` and `baki.tidakperlu` are dropped. Card frames come as one atlas (normal, placed, ghost, selected) plus a grey "Tidak perlu" frame and its "–" badge; the two action keys are one nine-slice atlas (normal, pressed) with a pin icon and a dash icon. The four portraits are the game's existing ones.
- [D-159] **K10:** `cap.catat`, `cap.samakan`, `cap.ulang`, `cap.abaikan`, `cap.tolak` become columns 0 to 4 of `cap.png` (cell 44 × 48, row 0 normal, row 1 pressed) and of `cap-kecil.png` (cell 22 × 24, for screens under 700 px tall). Each large stamp carries its own symbol; the labels stay HTML. Papers, header bands (police blue, toll brown), three row icons, highlight bar, "not equal" marker and progress squares are separate small files.
- Per the Lead's K10 decision the statement text is real story text in HTML; the art holds no words and no masked names.

### Beyond the brief
- `jejak-cap.png`: the red impression each stamp leaves on the paper (five cells 44 × 20).
- `kartu-periksa-9i`, `chip-9i` / `chip-pilih-9i`, `plus.png`, `ikon-tanya.png`: pieces the mocks use that the brief did not list.

### Not verified by me
Nothing is wired into the game and no browser was used. Whether `border-image` with these slices renders crisply at device pixel ratio 2 and 3 in Safari and Chrome is untested; if it does not, the same files work as plain backgrounds for fixed-size boxes. The small stamps have no symbol and are told apart only by their labels. The preview assemblies are rough (no text, placeholder discs for portraits) and are not a layout check. The test suites.

---

## T-020 — batch 3 art (2026-11-16)

Designer · Working under C:\Users\User\Desktop\rksgm-episode2 · No client source edits, no commit, BOARD.md not touched. No browser and no server used; one build script at below-normal priority.
Scope: K02 documents and trays, K05 pictures, K11 pictures, the chat photo.

### Delivered
- **Sets** in `character/aktivitas-ep2-pixel-v1/`: `dokumen/` 15 files 6,150 B, `terusan/` 5 files 4,326 B, `bundel/` 5 files 1,283 B, `obrolan/` 1 file 4,693 B. **26 files, 16,452 B.**
- **All three batches together: 93 files, 36,473 B**, all indexed PNG at 1 art px = 1 CSS px; all 93 decode with the project's PNG reader.
- A `README.md` per set, `BYTE.md` for all sets, build script `alat/bangun3.mjs`.
- **Preview strip at 2x:** `team/evidence/T-020/designer/batch3-strip.png`.

### Byte table
| File | Size (px) | Palette entries | Bytes |
| --- | --- | --- | --- |
| bundel/aksi-hendra.png | 48 × 40 | 6 | 247 |
| bundel/aksi-komite.png | 48 × 40 | 8 | 232 |
| bundel/aksi-lengkapi.png | 48 × 40 | 9 | 230 |
| bundel/bundel-berkas.png | 48 × 40 | 8 | 202 |
| bundel/map-pengajuan.png | 120 × 64 | 8 | 372 |
| dokumen/baki.png | 204 × 120 | 12 | 648 |
| dokumen/dok-formulir.png | 64 × 80 | 7 | 231 |
| dokumen/dok-foto-bundel.png | 60 × 48 | 10 | 300 |
| dokumen/dok-hitungan.png | 64 × 80 | 9 | 249 |
| dokumen/dok-kecil.png | 286 × 28 | 117 | 1878 |
| dokumen/dok-kk.png | 64 × 48 | 8 | 379 |
| dokumen/dok-ktp.png | 64 × 44 | 11 | 255 |
| dokumen/dok-laporan.png | 64 × 80 | 12 | 297 |
| dokumen/dok-rekening.png | 64 × 80 | 9 | 245 |
| dokumen/dok-sim.png | 64 × 44 | 12 | 303 |
| dokumen/dok-slip.png | 48 × 80 | 8 | 215 |
| dokumen/dok-stnk.png | 64 × 44 | 13 | 260 |
| dokumen/dok-suratpolisi-ada.png | 64 × 80 | 9 | 328 |
| dokumen/dok-suratpolisi.png | 64 × 80 | 8 | 296 |
| dokumen/dok-tender.png | 64 × 80 | 11 | 266 |
| obrolan/foto-truk.png | 240 × 150 | 16 | 4693 |
| terusan/ubin-diam.png | 80 × 60 | 9 | 892 |
| terusan/ubin-hendra.png | 80 × 60 | 14 | 1096 |
| terusan/ubin-lain.png | 80 × 60 | 12 | 749 |
| terusan/ubin-mitra.png | 80 × 60 | 25 | 1330 |
| terusan/ubin-tunggu.png | 80 × 60 | 11 | 259 |
| **Total, 26 files** | | | **16,452** |

### Mapping notes for Fullstack
- [D-160] **K02 counter scene: no new file.** It is the office stage the game already ships (`ep2-ruang-kantor-latar.png` with `ep2-ruang-kantor-meja.png` at (0, 66)), cropped at x 17, y 20 to 366 × 160 (x 32 at 336 wide). The document stands at left 30, 10 px above the scene's bottom edge.
- [D-161] **Documents:** twelve documents and the photo stack as objects (sheets 64 × 80, cards 64 × 44, payslip 48 × 80, photo stack 60 × 48), one to one for `dok.formulir`, `dok.stnk`, `dok.ktp`, `dok.sim`, `dok.suratpolisi`, `dok.kk`, `dok.slip`, `dok.rekening`, `dok.hitungan`, `dok.tender`, `dok.laporan`, `dok.suratpolisi.ada`, `foto.bundel`. The police letter has two versions: being processed (clock, faint lines) and issued (stamp, signature). `dok-kecil.png` is the thumbnail atlas (13 cells 22 × 28) for chips and tray contents.
- [D-162] **Trays:** `baki.png`, cell 68 × 40, columns = `baki.sekarang` (blue, bolt), `baki.menyusul` (purple, clock), `baki.tidak` (orange, dash); rows = empty, with documents (1 or 2), full (3 or more).
- [D-163] **K05:** five 80 × 60 pictures for `tuju.mitra`, `tuju.hendra`, `tuju.lain`, `tuju.tunggu`, `tuju.diam` on the K04 board, with the K04 frames, grass, roads and anchors. The token is the photo stack (thumbnail cell 12 on the chosen tile).
- [D-164] **K11:** `bundel.lengkapi`, `bundel.sekarang`, `bundel.hendra` become three 48 × 40 pictures; `bundel.berkas` a tied bundle; `bundel.map` an open folder 120 × 64 showing six of seven pockets ticked. That folder is a fixed picture; if the count can change, keep the CSS boxes and use it as decoration.
- [D-165] **Chat photo:** `foto.truk` becomes `obrolan/foto-truk.png`, 240 × 150 as today, 16 colours, 4,693 B. It shows the trailer against the cracked barrier of the toll stage.

### What is not done
- **K11 has no mock.** The brief asked for a mock first; I delivered only art that replaces today's K11 pictures in today's layout. A no-scroll layout for K11 is still to be designed.
- **K05 has no measured mock** either: its preview is the K04 board assembled by the script with the five new pictures. The K04 fit numbers apply because the board is the same; K05's 159 px context has to go behind "Info tugas".
- Three K05 pictures (phone, filing cabinet, bag) and the signpost are drawn by rule and look flatter than the map tiles, which are miniatures of stages.
- The thumbnail atlas is made by shrinking the documents to one third; at 22 × 28 the details are smudges, the colour bands tell the documents apart.

### Bytes against the gate
- My earlier estimate for the whole programme was about 30 KB; it is 36.5 KB for 93 files, because the briefs added frames, atlases and states.
- I did not measure the episode total. With about 168 KB before, and the vector art it replaces still in place, it stays far below 400 KB either way.

### Not verified by me
Nothing is wired into the game and no browser was used; the strips are assembled by the scripts. Rendering at device pixel ratio 2 and 3 on a phone. Whether the K02 crop of the office stage looks right behind each of the eight documents. Whether the tray rows should switch at other counts. The damage on the chat photo against what the story says about the truck. The episode byte total. The test suites.

---

## T-020 — K11/K05 mocks (2026-11-16)

Designer · Working under C:\Users\User\Desktop\rksgm-episode2 · No client source edits, no commit, BOARD.md not touched.
Method (run light: one headless Chrome, below-normal priority, no server needed, no test suite): added two screens to my mock page (real game font, real id / en / zh texts, the batch 3 production PNGs at 1 : 1) and measured them at 360 × 640, 390 × 645, 360 × 740 and 390 × 844. I opened three of the eleven screenshots (K05 chosen, K11 step 1, K11 step 2, all 390 × 645 Indonesian).
Evidence: `team/evidence/T-020/designer/`: `mock-k05-terusan-*.png` (5), `mock-k11-bundel-*.png` (6), `mock3-ukur.txt` / `.json`, `mock.html` (now nine screens).
These are static mocks, not the game. Shell numbers as in D-143: body = screen − 236 − question (23.4 per line); send bar 74 with a one-line label.

### [D-166] K11 "Bundel pengajuan": three steps, none scrolls
Pinned: story header, activity head with the "Info tugas" tab, the question. First row of the body: the three step tabs (40 px; number square + name, current step gold).
| Step | First instruction (existing string) | Body, top to bottom | Send bar |
| --- | --- | --- | --- |
| 1 Periksa berkas | the pinned sentence itself: "Sebelum diajukan ke Komite Klaim, periksa dulu isi map pengajuan." | tabs 40 · open folder 120 × 64 with "Isi bundel pengajuan" and "6 dari 7 kelompok berkas tersedia" (64) · folder board with seven pockets in 4 + 3, each 46 high with number, document thumbnail and ✓ or – (118) · strip for the tapped pocket: "Lembar n dari 7", "Ada" / "Belum ada di berkas", the contents (72–74) | "Tentukan langkah" |
| 2 Tentukan tindakan | "Pilih tindakan untuk berkas ini." | tabs 40 · instruction 20 · tied bundle + "6 dari 7 …" + "Belum ada: Surat keterangan polisi" (52) · three action cards with the 48 × 40 pictures, name and meaning (180, or 206 when a meaning wraps) | "Pilih tindakan untuk berkas ini." → "Lanjut: kabari Pak Hendra" |
| 3 Kabari Pak Hendra | "Pilih satu kabar." | tabs 40 · instruction 20 · the chosen action as a plan row (52) · three numbered rows as in the reply sheet (191; Chinese 142) | "Pilih satu kabar." → "Konfirmasi tindakan & kirim kabar" |

| Screen | Step 1 spare | Step 2 spare | Step 3 spare |
| --- | --- | --- | --- |
| 360 × 640, id | 37–39 px | 15 | 30 |
| 360 × 640, en | 37–39 | 39 | 54 |
| 360 × 640, zh | 22–24 (tabs 55, names on three lines) | 50 | 88 |
| 390 × 645, id | 42–44 | 46 | 35 |
| 390 × 645, en | 42–44 | 44 | 59 |
| 390 × 645, zh | 42–44 | 70 | 108 |
- Body height: 357.2 at 360 × 640 and 362.2 at 390 × 645 with a two-line question (steps 1 to 3 in Indonesian); 380.6 / 385.6 with one line.
- **Art used:** `bundel/map-pengajuan.png` (step 1 band), `dokumen/dok-kecil.png` cells 0, 12, 8, 9, 10, 4 and `papan/ikon-kaca-kecil.png` for the seven pockets, `bundel/bundel-berkas.png` (step 2), `aksi-lengkapi`, `aksi-komite`, `aksi-hendra` (step 2 cards, step 3 plan row).
- **Pocket 7** (police letter) is dashed, tinted and marked "–"; its strip turns red-edged with "Belum ada di berkas". Pocket 4 adds the tender note to its strip (74 px).
- **What gives way** (not needed at the two sizes): the open-folder band (64 px) first, then the plan row of step 3.
- The step tabs replace today's three tab buttons; "Kembali: periksa berkas" becomes a tap on tab 1.

### [D-167] K05 "Bengkel penuh" on the K04 board
First instruction: **"Tentukan langkahmu dengan foto kerusakan dari Mas Rudi."** (`akt.foto.instruksi`, two lines; one in Chinese). The 159 px context goes behind "Info tugas".
| Screen | Body | Question | Board (id / en / zh) | Result |
| --- | --- | --- | --- | --- |
| 360 × 640 | 357.2 (zh 380.6) | two lines (zh one) | 227–229 / 227–229 / 273 | fits, no tile overlaps |
| 390 × 645 | 385.6 (en 362.2) | one line (en two) | 256–258 / 234 / 278 | fits |
| 360 × 740 | 457.2 (zh 480.6) | as 360 × 640 | 275–277 / 275–277 / 300 | fits, list link visible, 52 spare |
| 390 × 844 | 584.6 (en 561.2) | as 390 × 645 | 300 / 300 / 300 | fits, list link visible, 133–177 spare |
- Instruction 40 (zh 20), strip 72–74, send bar 74. Board minimum 202 as on the map; the lowest measured is 227.
- Tiles, frames, grass, roads and anchors exactly as D-144 / `peta/README.md`; the five pictures are `terusan/ubin-*.png`. Labels are one or two lines in all three languages.
- **Token:** the photo stack. Before a choice it sits in the strip (60 × 48) with "Foto kerusakan dari Mas Rudi"; after a tap the 22 × 28 thumbnail sits on the tile's top right corner.
- **Send bar:** today's "Ketuk satu tujuan untuk: Foto kerusakan dari Mas Rudi." wraps to two lines; the mock uses "Ketuk satu tujuan." (new short string, three languages).

### New strings these two mocks assume (three languages)
"Ketuk satu tujuan.", "Ketuk satu tujuan di papan.", "Belum ada", "Pilih satu kabar." as a bar label. "6 dari 7 kelompok berkas tersedia" and "Lembar n dari 7" already appear in today's K11; I did not look up their keys, so the English and Chinese in the mock are my placeholders.

### Step 3 of the brief: T-018 Stage 2 first look
**Skipped.** `team/HANDOFF.md` has no "## T-018 Stage 2" section yet (the last section is "T-018 Stage 1b"), so there is nothing to look at. I started no server.

### Not verified by me
Nothing is built; every "fits" is my mock. I looked at three screenshots only: the 360 × 640, English and Chinese ones were measured but not opened. K11's "Info tugas" content and the preview of the message to be sent (today's "Pratinjau — belum dikirim") are not drawn. Keyboard and screen-reader order of the pockets. A real phone. The test suites.

---

## T-021 — concept (2026-11-16)

Designer · Working under C:\Users\User\Desktop\rksgm-episode2 · Concept only: no source edits, no commit, nothing built or measured in the game.
Owner idea (16:30, `team/evidence/T-021/owner/kantor-sebelum-chat.png`): when a kantor beat hands over to the WhatsApp chat, Miss Raksa takes her phone, the camera goes to the phone, the phone screen becomes the chat; the reverse on the way back.
Storyboard: `team/evidence/T-021/designer/papan-cerita-390.png` (390 wide, four frames; frames 1 to 3 are assembled from the stage art with a mock arm and phone, frame 4 is my capture of the chat).

### [D-168] Recommendation: phone in hand, as an arm overlay
| Frame | Time | What the player sees |
| --- | --- | --- |
| 1 Stage | 0 ms | the kantor as it is; a small notification bubble pops next to Miss Raksa |
| 2 Phone in hand | 0–350 ms | her forearm comes up from behind the counter holding the phone; the camera moves to the existing kantor close-up |
| 3 Zoom | 350–800 ms | the stage scales up around the phone in whole steps (about 2, 3, 4, 6 times, 90 ms each, pixels stay square); from 550 ms the chat fades in on the phone screen |
| 4 Chat | 800–1,000 ms | the chat screen is in place; its header settles 8 px |
- **Forward 1,000 ms, back 700 ms** (chat shrinks into the phone 300, phone goes down 250, camera returns 150).
- **A tap anywhere ends it at once** in the end state.
- **Full version once per Part**; later hand-overs in the same Part use a 300 ms short form (phone up, then cut), so it does not wear.
- **Reduced motion: a cut**, exactly as today. No arm frames, no zoom.

### Phone in hand or a monitor on the counter
| | Phone in hand (arm overlay) | Monitor prop on the counter |
| --- | --- | --- |
| Art | two overlay frames of forearm, hand and phone (about 18 × 42 art px each) + a notification bubble; no new body or face frame | one static prop, about 28 × 24 |
| Bytes (estimate) | about 0.6–1.0 KB | about 0.3 KB |
| My effort (estimate) | 2–3 h, including a check at the three stage sizes and with her five expressions | about 1 h |
| In character | yes: the chat is WhatsApp, and the screen it turns into is phone-shaped | weaker: WhatsApp on a desk monitor, and the monitor would stand on the counter in every kantor scene |
**My pick: the arm overlay.** Her hands are behind the counter in every kantor frame, so the arm can be a separate layer drawn with her figure and hidden by the counter where it should be; her body and face art stay untouched.

### Costs and risks outside the art
- This is mainly Fullstack work: for one second the stage and the chat are both on screen, the stage canvas has to scale beyond its box, and the zoom has to end exactly on the chat's message window. Stage screens and chat screens are different shells today. They should size it; I would not call it small.
- It only makes sense where a kantor beat is followed by a chat. I did not count how many such hand-overs Episode 2 has, or whether other rooms hand over to the chat as well.
- The zoom must not hide a new message: the first chat message should appear only after frame 4.

### Not verified by me
Nothing is built. The timings are a proposal, not tested for feel. The byte and effort figures are estimates. Where the hand-overs occur in the episode. Whether the pixel stage can be scaled in whole steps at 360, 390 and desktop widths.

---

## T-021 — art (2026-11-16)

Designer · Working under C:\Users\User\Desktop\rksgm-episode2 · No client source edits, no commit, BOARD.md not touched. No browser and no server used; one build script and one read-only probe of the episode data, both at below-normal priority.

### Delivered
- **Folder:** `character/miss-raksa-pixel-v4/telepon-v1/` with four indexed PNGs, `README.md` (frames, offsets, z-order, compatibility) and the build script `bangun-telepon.mjs`.
- **Preview strip at 3x:** `team/evidence/T-021/designer/telepon-strip.png` (her standing frame with the bubble, with the lifting frame, with the reading frame and lit screen, then the pieces).
- **Storyboard with the real frames:** `team/evidence/T-021/designer/papan-cerita-390-v2.png` (390 wide, four frames; frame 4 is an older capture of the chat and still shows the sound banner).

### Files and bytes
| File | Size (px) | Colours | Bytes |
| --- | --- | --- | --- |
| `lengan-telepon.png` (cell 0 lifting, cell 1 reading; 28 × 42 each) | 56 × 42 | 17 | 417 |
| `layar-menyala.png` (lit screen, stage scale) | 9 × 15 | 5 | 125 |
| `layar-menyala-besar.png` (lit screen for the zoom, 6 times larger) | 54 × 90 | 7 | 223 |
| `gelembung-notif.png` | 18 × 16 | 3 | 150 |
| **Total, 4 files** | | | **915** |
The arm frames use only colours of her atlas palette (checked by the script: 0 pixels outside it). The lit screen needs chat greens that her palette does not have, so it is a separate file.

### [D-169] Offsets and z-order
| Piece | In `berdiri-kanan` frame coordinates | From her foot anchor (33, 183) |
| --- | --- | --- |
| arm cell, top left | (32, 55) | (−1, −128) |
| lit screen, top left | (34, 57) | (+1, −126) |
| screen centre = zoom target | (38.5, 64.5) | (+5.5, −118.5); in the kantor that is world (822, 282) |
| notification bubble, top left | (50, 18) | (+17, −165) |
- **Z-order:** body and face layers, then the arm cell, then the lit screen, then the counter layer as today. The counter hides everything below frame row 89 (measured from the counter art), which is where the arm's cut-off elbow end lies.
- **Expressions:** compatible with all five and with kedip, bawah and bicara; the face box ends at row 50 and the overlay starts at row 55. Use the existing downward glance while the phone is up.
- **Only for `berdiri-kanan` behind the kantor counter.** There is no drawn elbow joint, so it must not be used where the counter does not cover it.
- **Reverse:** the same two frames played backwards are fine; no lowering art was made.
- **Changed from the concept storyboard:** the phone now has a dark screen in the arm frames and a separate lit face, so the screen can light up at reading height.

### [D-170] Where kantor and chat hand over in Episode 2
Read from the episode data (staging per node; a node without its own staging keeps the previous one).
| # | Direction | From → to | Miss Raksa on the stage? | Every play? |
| --- | --- | --- | --- | --- |
| 1 | kantor → chat | `buka` → `k01` (Part 1) | yes, alone | yes |
| 2 | chat → kantor | `k15-a` … `k15-e` → `akhir-puas` / `akhir-catatan` / `akhir-kurang` (Part 4; Pak Hendra then walks in) | yes | yes |
| 3 | kantor → chat | `k11` (the bundle on the counter) → `k11-a`, `k11-d`, `k11-b2`, `k11-d2`, `k11-d3`, `k11-e2` (chat from their first line), or → `k11-b`, `k11-c`, `k11-e` (stay on the stage) → `k12` (chat) | **no**: the kantor is empty, only the files | yes, one of the nine |
| 4 | chat → kantor | `k06-a` … `k06-e` → `k07` (Part 3) | **no**: Pak Bima stands there | yes |
- **The cutscene as designed can play at two points: 1 (forward) and 2 (back).** With "full version once per Part" both always play in full.
- Points 3 and 4 are kantor hand-overs without her. To use the cutscene at 3 she would have to be added to that staging, which is a story decision, not an art one.
- Other rooms also hand over to the chat and are not covered by this art: chat → pool (`k03-*` → `k04`), pool → chat (`k04-a`, and the second line of `k04-d`), bengkel → chat (`k05-b`, the second line of `k05-a`, and `k05-c` / `-d` / `-e` → `k06`), toll road → chat (first line of `k08-d`).

### Not verified by me
Nothing is wired into the game or rendered by it: the strip and the storyboard are assembled by the script from the shipped atlas and room art. I looked at the overlay with her neutral face only. How the overlay behaves with her idle or speaking motion. The zoom and the timings are untested. Whether the stage code can draw an extra layer between her figure and the counter is Fullstack's to confirm. The hand-over list comes from the node data; I did not play those transitions.

---

## T-021 — art v2 (2026-11-16)

Designer · Working under C:\Users\User\Desktop\rksgm-episode2 · No client source edits, no commit, BOARD.md not touched. No browser and no server used; one build script at below-normal priority.
Why: the owner (18:20) found the one-handed phone arm of v1 unnatural and asked for two hands and a POV.

### Delivered
- **Folder:** `character/miss-raksa-pixel-v4/telepon-v2/` with seven indexed PNGs, `README.md` (offsets, z-order, joins, compatibility) and `bangun-telepon2.mjs`. `telepon-v1/` stays on disk but is superseded.
- **Strip at 3x:** `team/evidence/T-021/designer/telepon-v2-strip.png`: lifting, reading with lit screen and downward glance, reading with the phone back, then reading with each of the five faces, then the POV picture and the pieces.
- **Storyboards (390 wide):** `papan-cerita-390-v3-pov.png` (A for frame 2, B for frame 3) and `papan-cerita-390-v3-langsung.png` (A only, zoom straight into her screen).

### Files and bytes
| File | Size (px) | Bytes |
| --- | --- | --- |
| `lengan-dua.png` (A: cell 0 lifting, cell 1 reading; 56 × 39 each) | 112 × 39 | 571 |
| `punggung-telepon.png` (phone back) | 9 × 15 | 107 |
| `layar-menyala.png` (lit screen, stage scale) | 9 × 15 | 125 |
| `layar-menyala-besar.png` (lit screen for the direct zoom; from v1) | 54 × 90 | 223 |
| `gelembung-notif.png` (from v1) | 18 × 16 | 150 |
| `pov-366x229.png` (B, stage box at 390 wide) | 366 × 229 | 3,489 |
| `pov-336x210.png` (B cropped for 360 wide) | 336 × 210 | 2,971 |
- **What ships with the POV version:** arm cells, phone back, bubble, the 366 POV picture = **4,317 B** (the 336 file is only needed if the 366 one cannot be shown cropped at (15, 10)).
- **What ships with the direct zoom:** arm cells, two lit screens, bubble = **1,069 B**.
- The arm cells and the phone back use only colours of her atlas palette (checked by the script: 0 pixels outside it). The POV picture is 24 colours: her sleeve and skin colours, the kantor counter and floor colours, the chat greens.

### [D-171] A. Two-handed pose: offsets and joins
| Piece | In `berdiri-kanan` frame coordinates | From her foot anchor (33, 183) |
| --- | --- | --- |
| arm cell, top left | (2, 54) | (−31, −129) |
| screen layer on the reading cell, top left | (26, 56) | (−7, −127) |
| screen layer on the lifting cell, top left | (26, 69) | (−7, −114) |
| screen centre at reading height = zoom target | (30.5, 63.5) | (−2.5, −119.5); world (790, 278) in the kantor |
| notification bubble, top left | (50, 18) | (+17, −165) |
- **Both forearms start on her existing upper arms** at the elbows (frame (7, 87) and (52, 87)); the joint is drawn in sleeve colour without an outline, so the yellow sleeve runs on. The hands meet at the centre of her chest on either side of the phone.
- **No floating limbs:** the script checks that each cell is one connected shape and that it overlaps her body. Both cells pass.
- **Z-order** as in v1: body and face, arm cell, screen layer, then the counter, which hides everything below frame row 89.
- **Expressions:** I looked at the reading cell with each of the five base faces and with the downward glance; nothing collides (face box ends at row 50, overlay starts at row 54). I drew no head tilt; the existing downward glance does that job.
- **Reverse:** the same two cells backwards.

### [D-172] B. POV picture
- First-person view at the stage box size: her two sleeves come in from the lower corners, white cuffs, hands at the sides of the phone with the thumbs over its front edges, the counter under them and the floor beyond; the chat screen is lit.
- **Screen rectangle = zoom target:** x 144, y 32, 78 × 154 in the 366 file (centre (183, 109)); in the 336 crop x 129, y 22.
- It is one flat picture shown in place of the stage, so the zoom is a scale of that picture about the screen centre (about 4.7 times until the screen fills the box). The live stage does not have to be scaled.

### [D-173] Recommendation: A for frame 2, B for frame 3
| | A + B (POV) | A only (zoom into her screen) |
| --- | --- | --- |
| Frame 2 | she holds the phone towards herself; we see its back | the screen has to face the viewer, which no one does |
| Frame 3 | cut to what she sees; the screen grows into the chat | the stage is magnified until the pixels are large blocks, then the chat fades in |
| Bytes | 4,317 | 1,069 |
| For Fullstack | scale one still picture | scale the live stage canvas around a point |
**My pick is A + B.** It is what the owner asked for, it removes the screen-towards-the-viewer cheat, and the zoom becomes simpler to build. Timing stays as approved: bubble and the two arm cells with the camera moving in during 0–350 ms, cut to the POV picture at 350, scale to the screen 350–800 with the chat fading in from about 650, settle to 1,000; back in 700; a tap skips; a plain cut under reduced motion.

### Not verified by me
Nothing is wired into the game or rendered by it; strip and storyboards are assembled by the script. The POV hands are simple drawn shapes, not traced from her model; whether they look natural enough is the owner's call from the strip. I checked the five base faces and the downward glance, not the blink and speaking variants. Her idle motion with the overlay. Device pixel ratio 2 and 3. The trigger points are unchanged from D-170.

---

## T-018 — Stage 2 review (2026-11-16)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: production build in client/dist of 16:28:16, unchanged during my run, on my own server on :4002 (started and stopped by me; :4000 and :4001 not touched).
Method (run light: one headless Chrome at a time, closed between sizes, below-normal priority, no test suite): read HANDOFF "T-018 Stage 2" with its addenda; at 360 × 640, 390 × 645, 360 × 740 and 390 × 844 in Indonesian I walked the opening (3 beats), K04, K07, K08, K09, K10, K11 and one ending beat by beat, opened eight activities, walked K08 through both signs to the conclusion, opened the end screen and two reply sheets; Chinese for the opening, K04, K09, the end screen and one sheet at 360 × 640; English for one sheet. I opened 11 screenshots. Evidence: `team/evidence/T-018/designer/stage2/` (screenshots, `ukur-*.txt`, `hasil-*.json`).

### Verdict: FIX NEEDED. One high item (K08 hides the sign wording), three medium, the rest polish. Nothing scrolls the page and nothing is unreachable.

### 1. Stage screens (D-132)
| Check | 360 × 640 | 390 × 645 | 360 × 740 | 390 × 844 |
| --- | --- | --- | --- | --- |
| Page height = screen, in every beat | yes | yes | yes | yes |
| Opening, three beats: stage height | 210, 210, 210 | 229, 229, 229 | 336, 336, 336 | 366, 366, 366 |
| K04 pool, two beats | 210, 210 | 229, 229 | 252, 252 | 275, 275 |
| K07 Pak Bima, two beats | 210 then **168** | 229, 229 | 252, 252 | 275, 275 |
| K08 toll road, two beats | 210 then **168** | 229 then **183** | 210, 210 | 229, 229 |
| K09, two beats | 210, 210 | 229, 229 | 252, 252 | 275, 275 |
| K10, two beats | 210 then **168** | 229 then **183** | 210, 210 | 229, 229 |
| K11 (task card) | 168, goal line hidden | 183, goal line hidden | 210 | 229 |
| Ending, two beats | 210, 210 | 229, 229 | 210, 210 | 229, 229 |
| Lowest stage | 168 | 183 | 210 | 229 |
| Last button, lowest position | 615 of 640 | 615 of 645 | 686 of 740 | 705 of 844 |
- **The owner's case is fixed:** the opening keeps one box through its three beats at all four sizes (Chinese too at 360 × 640).
- **Minimum stage** 168 at 360 wide and 183 at 390, as specified. **Goal line** hides only in K11 at the two short sizes. **Dialogue text** did not scroll in any beat I reached; K09-e and the K08 result, where Fullstack reports scrolling, need a finished activity and I did not reach them.
- **Close-up camera in the constant box:** reads well. On the tall screens the opening is the square close-up for all three beats (face, badge and the "LAYANAN KLAIM RAKSA" board are clear; the framed picture is cut by the right edge as before). On the short screens the box is 16 : 10 with the wide view; Miss Raksa is small but clear.

- [D-174] Stage, short screens · **the box still changes inside a node when the task card arrives:** K07, K08 and K10 at 360 × 640 (210 → 168) and K08 and K10 at 390 × 645 (229 → 183). The handoff lists K07 and K10 but not K08. It is the same kind of jump the owner reported, at his screen size · choose the node's shape with the task-card beat included, so those nodes use 168 / 183 from their first beat · **med**.
- [D-175] Opening, all four sizes · **the stage moves up 56 px after the first beat.** The sound banner (48 + 8) sits between the goal line and the stage on the first screen; when it leaves (first tap or 6 s) the stage top goes from 177 to 121. Same box, new position · show the banner over the top edge of the stage, or in the free space under the dialogue box, so nothing moves · **med**.

### 2. Activities (D-133)
Shell: story header 57, activity head 69, question pinned (23.4 or 46.8; K04 49.4 with its instruction line), one scroller, send bar 68 pinned. Page height = screen in every activity at every size; no sideways overflow.
| Activity | Layout | Scroller: px of content below the fold (360 × 640 / 390 × 645 / 360 × 740 / 390 × 844) |
| --- | --- | --- |
| K04 map | **new (D-143 / D-144)** | 56 / 51 / 0 / 0: only the list link and its padding |
| K02 documents | old | 175 / 170 / 75 / 0 |
| K05 forward the photos | old | 236 / 184 / 136 / 0 |
| K07 plan | old | 481 / 400 / 381 / 201 |
| K08 first step | old | 24 / 27 / 0 / 0 |
| K08 marking a sign | old | 279–364 at 360 × 640 |
| K08 conclusion | old | 844 / 824 / 744 / 625 |
| K09 witnesses | old | 404 / 357 / 304 / 158 |
| K10 compare | old | 489 / 439 / 389 / 240 |
| K11 bundle | old | 132 / 114 / 32 / 0 |
- **K04 matches my numbers.** Board 202 at the two short sizes, about 246 at 360 × 740, 300 at 390 × 844; five tiles 96 wide, no overlaps; strip under the board; one tap chooses, a second tap on another place changes it; no "Pilih tujuan ini" step. Chinese at 360 × 640 holds.
- **The other seven are today's layouts inside the new shell.** They do what D-133 asked (pinned head and bar, one scroller) but still need the scrolling the owner objected to. Fitting them is the T-020 work (D-145 to D-150, D-166, D-167), not a Stage 2 defect.
- **K08 conclusion is not the reply sheet yet**: five option cards of 74–98 px in the scroller.

- [D-176] K08, after tapping a sign · **the sign's wording is pushed under the pinned head.** The new scroll correction keeps the road where it was, so the card that appears above the road is cut: at 390 × 645 only its last line ("menggunakan lajur 3 dan 4.") is visible, the name "Rambu 1" and the first line are hidden; at 360 × 640 the name row is hidden (`akt-k08-tandai-*.png`). That card is what the player has to read · when a sign opens, put the top of its card at the top of the scroller and let the road move · **high**.
- [D-177] K08 · the step button ("Lanjut ke rambu berikutnya", "Lanjut ke kesimpulan") is at the end of the scroller, 279–364 px below the fold at 360 × 640; moving from the last sign to the conclusion the road jumped 63–85 px in my run (I pressed the button without scrolling) · put the step button in the pinned bar like a send button · med.
- [D-178] K04 at 360 × 640 and 390 × 645 · the plate "Papan ilustrasi, bukan peta" lies under the labels of "Meja kantor" and "Bengkel langganan" and reads "…apan ilustrasi, bukan pe…" · hide the plate while the board is under 230 px (keep the text for screen readers) · low.
- [D-179] Send bar · it grows from 68 to 74 px when the button becomes ready (button 52 → 58), so the scroller loses 6 px at that moment · one height, 58, for both states · low.
- [D-180] Send bar, disabled labels · "Tandai juga: Petugas tol, Pak Hendra, Pengemudi mobil kecil, Polisi Jalan…" is cut with an ellipsis at two lines (K09); K05 and K07 also take two lines · the short labels of D-143 ("Tandai 5 kartu lagi.", "Ketuk satu tujuan.") · low.

### 3. End screen (D-134): PASS
| Check | 360 × 640 | 390 × 645 | 360 × 740 | 390 × 844 |
| --- | --- | --- | --- | --- |
| Header pinned / scroller / action bar | 57 / 514 / 69 | 57 / 519 / 69 | 57 / 614 / 69 | 57 / 718 / 69 |
| "Ulangi Bagian 4" + "Selesai", one row, 52 high | 239 + 89 wide | 269 + 89 | 239 + 89 | 269 + 89 |
- Verdict, cause and lesson end at 503 px at 360 × 640 ("kurang", the longest), above the bar at 571; the summary follows in the same scroller under a fade.
- The short label carries the full sentence as its accessible name ("Coba lagi dari bagian Keputusan dan penyelesaian"). Chinese: "重玩第 4 部分" + "完成" on one row. The good ending shows "Selesai" + "Coba jalur lain" on one row.

### 4. Stage 1b fixes: PASS
| Item | Built |
| --- | --- |
| D-139 note tab | whole and on top at all four sizes; at 360 × 640 the chat keeps 28–32 px above the sheet (K14 id 32, K03 id 28, K13 en 28) |
| D-140 full width | sheet 0 to 360 / 390, rows 340 / 370 wide |
| Sheet heights | 390 wide: K14 471, K03 467 (my mock 469 / 465). 360 wide: K14 490 without list scroll, K03 503 (list scrolls 2 px), K13 en 494 (list scrolls 30 px, as predicted) |
| D-141 badges | unchosen badges filled `#4f7d66`, no opacity |
| D-142 game feel | rows have a hard 2 px edge; with motion on: Miss Raksa hops, the unread note tab wiggles, the send button pops and its arrow nods when ready, the chosen badge pops; the global reduced-motion rule turns them off (not re-measured this time) |
- K14 in Chinese at 360 × 640: sheet 419, 112 px of chat above.

### Blockers and polish
- **Fix before the owner looks again:** D-176 (high), then D-174, D-175, D-177 (medium). They are all "something jumps or hides" on the screens he has already commented on.
- **Polish:** D-178, D-179, D-180.
- **Not Stage 2:** the seven old activity layouts and the K08 conclusion sheet (T-020).

### Not verified by me
A real iPhone and WebKit (Chromium only; QA is on the same build). K09-e, the K05 result and the K08 result beats (they need a finished activity). English on stage, activity and end screens; Chinese only at 360 × 640. Activities beyond their first screen, except K04 and K08. Whether the row press and the send-button pop feel right (I confirmed the animations exist, I cannot watch them). Desktop 1280 and Episode 1 (not in this brief). The test suites.

---

## T-018 — Stage 2 re-check (2026-11-16)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: production build in client/dist of 19:16:31, unchanged during my run, on my own server on :4002 (started and stopped by me; other ports not touched).
Method (run light: one headless Chrome at a time, closed between sizes, below-normal priority, no test suite): read HANDOFF "Fix (… D-174..D-180)"; at 360 × 640 and 390 × 645 in Indonesian, and once at 390 × 844, I opened a brand-new episode (banner showing) and walked its three beats, walked K07, K08, K10, K04, K09, K11 beat by beat, walked K08 through both signs to the conclusion, opened the K04 map and read the disabled bar labels of K04, K05, K07, K09, K10; English and Chinese labels at 360 × 640. I opened 4 screenshots. Evidence: `team/evidence/T-018/designer/stage2-recheck/`.

### Verdict: FIX NEEDED, one item. D-174 and D-176 to D-180 are fixed. The D-175 fix stops the jump but now puts the banner on Miss Raksa's head.

### What I confirmed
| Item | 360 × 640 | 390 × 645 | 390 × 844 |
| --- | --- | --- | --- |
| D-176 K08: sign card after tapping a sign | whole: 147.8–260.4 in a scroller that starts at 146 (sign 2: 147.8–236.1) | whole: 148.4–261 (sign 2: to 236.7) | whole |
| D-177 K08: step button | in the pinned bar; none left in the scroller | same | same |
| K08 bar label | "Tandai setidaknya satu lajur." → "Lanjut ke rambu berikutnya" → "Lanjut ke kesimpulan" | same | same |
| D-174 stage box, K07 / K08 / K10 | 168 on both beats, top 121 | 183 on both beats, top 121 | 275 / 229 / 229 on both beats |
| K04 and K09 | 210, 210 | 229, 229 | 275, 275 |
| D-175 stage top, new episode, beats 0 / 1 / 2 | 121 / 121 / 121 | 121 / 121 / 121 | 121 / 121 / 121 |
| D-178 map plate | hidden (board 202), still in the page for screen readers | hidden (board 202) | shown (board 300) |
| D-179 send bar | 74 before and after choosing; button 58; scroller unchanged (355) | 74 / 74; scroller 360 | 74 / 74 |
| D-180 labels, one line each | "Ketuk satu tujuan." (K04, K05, K07), "Tandai 5 kartu lagi." (K09), "Catat 3 perbedaan lagi." (K10) | same | same |
- Page height = screen in every state I opened.
- When a sign opens the road moves down 46 px (262.8 → 308.7 at 360 × 640) so that its card is whole; that is the trade I asked for.

### What is wrong
- [D-181] First screen of a new episode, short screens · **the sound banner now lies on Miss Raksa.** It is drawn over the content from y 115 to 163 and the stage starts at 121, so it covers the top 42 px of the picture. At 360 × 640 that hides her hair and forehead down to the eyes (`buka-spanduk-360x640.png`); at 390 × 645 it hides the top of her hair and the "LAYANAN KLAIM RAKSA" board. It stays until the first tap or 6 s. My D-175 text offered "over the top edge of the stage" as one option; that was the wrong one for the wide view · put it in the empty space under the dialogue box instead: 12 px above the bottom edge (plus the bottom inset), same 48 px height, still not taking a row. On that screen the dialogue box ends about 138 px (390 × 645) and 153 px (360 × 640) above the bottom edge, read from the screenshots, and far more on tall screens · **med**.

### K07 at 390 × 645: 183 on both beats where 229 used to fit
**Acceptable.** Pak Bima is framed from head to belt and reads well (`adegan-k07-390x645-b0.png`); K08 and K10, which follow it, need 183 at this size anyway, so the three now share one box. The cost is 46 px of picture in one node while about 60 px stay free under the dialogue box on the task-card beat (its button ends at 569 of 645). If Fullstack wants it back: count the 22 px overlap when the last beat has a speaker. Low priority, not required.

### Remaining, not from this fix
- Going from the last sign to the K08 conclusion the road still moves up 131 px (308.7 → 177.4), because the conclusion screen starts at the road. It goes away when the conclusion becomes the reply sheet over the road (D-146).

### Final wording of the three short bar labels
| Key | id | en | zh |
| --- | --- | --- | --- |
| `belumTujuanRingkas` | Ketuk satu tujuan. | Tap one destination. | 请点选一个去向。 |
| `belumKontakRingkas` | Tandai {n} kartu lagi. | Cards left to mark: {n}. | 还需标记 {n} 张卡片。 |
| `belumBedaRingkas` | Tentukan {n} perbedaan lagi. | Differences left to decide: {n}. | 还需决定 {n} 处出入。 |
- **Destination and cards (id, zh):** Fullstack's drafts stand.
- **English, both counted labels:** "Mark {n} more cards." and "Record {n} more differences." read wrong at n = 1 ("1 more cards"). The forms above have no plural to get wrong.
- **K10, neither "Catat" nor "Cap":** "Catat apa adanya" is one of the five answers, so "Catat 3 perbedaan lagi" reads like a hint to choose it; the same goes for "Record" / "记录" next to that answer in the other languages. "Cap" would only make sense once the stamps are built. "Tentukan" matches the task's own instruction ("Tentukan cara mencatat tiap perbedaan di laporan.") and works before and after the stamps.
- **Chinese, K10:** the draft says "差异", but this activity calls the differences "出入" everywhere ("先选一处出入，再选记录方式。", "这处出入怎么写进报告？") and its instruction uses "决定". My line reuses those words. I am not a native reader, so the translator should confirm it.

### Not verified by me
WebKit and a real iPhone. The banner fix I propose is not built. English and Chinese only for the three labels at 360 × 640. The row and button animations. K09-e and the result beats. The test suites (Fullstack reports them green on this build).

---

## T-020 — batch 1 review (2026-11-16)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: production build in client/dist of 20:41:29 for all six runs (checked after each run). Fullstack rebuilt at 21:14:53, after my last run; I did not look at that build. My own server on :4002, started and stopped by me; other ports not touched.
Method (run light: one headless Chrome at a time, closed between runs, below-normal priority, no test suite): read HANDOFF "T-020 batch 1"; six runs: 360 × 640 at DPR 2 and 3, 390 × 645 at DPR 2 and 3, 390 × 844 at DPR 3 (Indonesian), 360 × 640 at DPR 2 in Chinese. In each run: K04 start, keyboard focus, tap pool, tap two other places; K08 first step, sign 1 marked, sign 2 marked (also with one lane carrying both marks), sign 1 reopened through its post, conclusion sheet, row chosen, "Tandamu" side and back, one "Periksa lagi" chip. **Crispness is measured, not judged by eye:** each screenshot is compared with the source PNGs; a sprite passes when every art pixel is a DPR × DPR block of exactly the source colour. I opened 10 screenshots and crops and my 3 mocks. K07, K09, K10 ignored as asked. Evidence: `team/evidence/T-020/designer/batch1-review/` (screenshots, `zoom-*.png` crops, `ukur-*.txt`).

### Verdict: FIX NEEDED, no blocker. The art is integrated correctly and is crisp at DPR 2 and 3. Three layout items first (D-182 to D-184), five polish.

### Crispness at DPR 2 and 3: PASS
| Sprite | Result at all sizes and both DPRs |
| --- | --- |
| Map: five pictures 80 × 60, five frames, focus frame, chosen frame, two trees, bush, tree, grass, dirt road | 0 device pixels differ from the source |
| Road: asphalt strip (lane 4, 66 × 130), four arrows, keycaps in the three states used, sign post 1 (without the corner under its number badge), trees and bushes, sign face in the card and on the lanes, legend swatches | 0 differ |
- The map pictures and the road scene report `image-rendering: pixelated` with no background scaling, and every sprite measures exactly its file's size.
- The map sits at a fractional height (y 270.39: the pinned question block is 49.39 high) and the legend swatches at a fractional x (82.7). Chrome snaps both by one device pixel; the blocks stay uniform. I would still give the pinned block a whole-pixel height, because other browsers may not snap the same way.
- Differences that are by design: the truck's last 4 rows are under keycap 2 (114 art pixels; my own anchors), arrows and asphalt under a hatch, and the two items D-188 and D-189 below.
- At 360 × 640 DPR 2 in Indonesian the map was checked for one tile only and the legend swatch not at all (that run predates the snap-tolerant check); the Chinese run at the same size and DPR passed in full.

### K04 map against `mock-k04-peta-*.png`
| Check | Built |
| --- | --- |
| Board | 336 × 202 (360 × 640), 366 × 202 (390 × 645), 366 × 300 (390 × 844) |
| Tile | box 96 wide; picture exactly 80 × 60; frame 84 × 64 at (−2, −2); chosen and focus frames 88 × 68 at (−4, −4) |
| Label plate | 13 / 15, overlaps the frame by 8, gold `#e0b84f` when chosen |
| Pin | 40 × 42 at picture (+52, −8); 4 px inside the board on the top row and the right column |
| Roads, trees | present, on whole pixels |
| Tap = choose | one tap chooses, a tap elsewhere moves the pin; keyboard focus shows the focus frame |
| Strip and bar | strip 72; bar 74 in both states; "Ketuk satu tujuan." → "Tugaskan Mas Rudi" |
| Chinese, 360 × 640 | four labels on one line, board 202, nothing collides |
- [D-186] Anchors · every tile sits 2 px further in than the README: picture x 16 and 16 from the right (spec 14), top row y 12 (spec 10), bottom row ends 10 px above the edge (spec 8); the anchors were applied inside the 2 px border. On the 202 px board the two right-hand tiles are 2 px apart (spec 6): with "Bengkel langganan" chosen its gold frame touches the "Bengkel rekanan" plate and the pin overlaps that plate by 4 px (no text covered; `zoom-k04-kanan-*.png`) · measure the anchors from the outer edge: 4 / 6 / 6 px inside the border · low.
- [D-187] "Kantor Raksa" · needs 97.6 px on one line, the plate allows 96, so it wraps to two lines (one line in the mock) · plate padding 5 px instead of 6 · low.
- [D-189] Pin · the portrait draws its own smooth round border over the inner rim of the pixel ring (140 of the ring's art pixels are anti-aliased) · draw the ring above the portrait and drop the portrait's border there · low.
- Still open from Stage 2, not batch 1: the map screen scrolls 62 px at 360 × 640 and 57 at 390 × 645 (in the Stage 2 review this was the list link under the strip; I did not look at it again).

### K08 road against `mock-k08-jalan-*.png`
| Check | Built (336 wide / 366 wide; x from the outer edge of the scene, y inside its 2 px border) |
| --- | --- |
| Scene | W × 236; road block 278 centred at x 29 / 44 |
| Lanes | 66 wide at 36, 102, 168, 234 / 51, 117, 183, 249 |
| Truck and shadow | 40 × 124 at lane 2 + 13, top 80 inside the border; shadow at (+3, +3) |
| Arrows, keycaps | arrow at lane + 24, top 14; keycap at lane + 13, top 200, 2 px lower when marked; plain / forbidden / left-lane cells |
| Marks | hatch 64 wide at lane + 1, opacity 0.55; border 2 px solid `#b3261e` / 2 px dashed `#2f5f8f`; sign face at lane + 22, top 8 |
| Sign posts | real buttons, 24 × 44 with a 44 × 56 tap area that receives the tap; left 4 / 10; active gold badge, done green, locked 55 % and disabled; a done post reopens its sign ("Selesai mengubah") |
| Old controls | "Rambu 1" button and "Lihat lagi" chips gone |
| Context sentence | first step only |
- The scene's 2 px border is inside the 236, so 232 px of road show. Fine.
- Accepted differences from the mock: no dashed ring and "Truk · menurut supir" plate around the truck (the context line and the legend say it); marked keycaps use the hatched cells, not the gold one.
- Fullstack's question, a lane marked for both signs: sign 2's face under sign 1's at top 34 is right.

| Marking step (Indonesian) | 360 × 640 | 390 × 645 | 390 × 844 |
| --- | --- | --- | --- |
| Sign card / instruction / scene / legend, sign 1 | 92 / 20 / 236 / 39.2 | same | same |
| Same, sign 2 with a mark | 70 / 40 / 236 / 58.8 | same | same |
| Content end against the fold, sign 1 | 557.2 of 558 | 557.2 of 563 | fits |
| Content end against the fold, sign 2 | **574.8 of 558** | **574.8 of 563** | fits |
| Scroller, sign 2 | 412 / 441 | 417 / 441 | no scroll |
- [D-182] Marking step, sign 2, both short sizes · **the legend is three lines once sign 2 has a mark and its last line ("Bukan denah kejadian.") is under the bar**: 17 px cut at 360 × 640, 12 px at 390 × 645. The handoff says nothing scrolls. My numbers were card 87, legend 18–36; built 92 and 39–59. In Chinese at 360 × 640 it fits · **build the README's 204 px scene on screens under 700 px high** (crop 32 px from the top, arrows at top 6, keycaps 36 above the bottom): that leaves 15 and 20 px spare with the three-line legend. This is the missing crop the brief asks about, and it is needed · **med**.
- [D-188] Lane with both marks · sign 1's face is under the blue hatch (a third of its pixels are tinted) · draw both faces above both hatches · low.

### K08 conclusion against `mock-k08-simpul-*.png`
| Check | 360 × 640 | 390 × 645 | 390 × 844 | 360 × 640 zh |
| --- | --- | --- | --- | --- |
| Sheet height | 492 (mock 488) | 454 (mock 469) | 454 | 383 |
| Road visible above the sheet | 43 | 86 | whole scene | 152 |
| List, visible / content | 382 / 382 | 344 / 344 | 344 / 344 | 277 / 277 |
| Rows | 73 × 5 | 73, 73, 54, 73, 54 | same | 54 × 4, 44 |
| Sheet moves when a row is chosen | 0 | 0 | 0 | 0 |
- Full width, activity head one 44 px row with "Kembali", Pak Bima's face and question on top, "Pilih 1 kesimpulan" → "Sampaikan ke Pak Bima", content behind the sheet cannot scroll. Handoff says 459 / 81 at 390 × 645; I measured 454 / 86.
- The "Tandamu" side shrinks the sheet to 276 (360 × 640) / 224 (390 × 645), so the whole road with the marks shows above it. Good; keep it. Back and the choice survive; the chips reopen a sign.
- [D-183] Tab over the question · **the "Tandamu" tab covers the top of the question's first line**: its lower edge is 8.75 px below the top of that line, over 24 px of text at 360 wide ("ini") and 79 px at 390 wide ("melanggar"; `zoom-k08-simpul-atas-390x645-d2.png`). It comes from tightening the sheet. Chinese is clear · raise the tab 8 px (it then stands 34 px above the sheet instead of 26) · **med**.
- [D-184] "Tandamu" side · **the Rambu 1 swatch is invisible** (12 × 12, no fill, no border) and the Rambu 2 swatch is the old grey box with a dashed light-blue edge (`zoom-k08-pilihanmu-*.png`). Likely cause: the sheet is drawn outside the container that defines the red · use the 14 × 14 pixel swatches of the legend for both · **med**.
- [D-185] Truck in the conclusion view · at 360 × 640 one pixel row of the truck shows above the sheet, although the question says "truk di lajur 2 ini". The README's "truck top 40" was my number for 67 px of road; with 43 px it does not work · truck top 12 in this view: 29 px of cab at 360 × 640, the whole cab at 390 × 645 · low.

### Final text of the four new strings
| Key | id | en | zh |
| --- | --- | --- | --- |
| `tandamu` | Tandamu | Your marks | 你的标记 |
| `kembaliPilihan` | Kembali ke pilihan | Back to choices | 返回选项 |
| `pilihSatuKesimpulan` | Pilih 1 kesimpulan | Choose 1 conclusion | 请选 1 个结论 |
| `kembali` | Kembali | Back | 返回 |
- One change: English "Back to the choices" → "Back to choices", to match the chat sheet's "Back to replies". The rest stands; "Choose 1 conclusion" and "请选 1 个结论" already mirror "Choose 1 reply" and "请选 1 条回复".
- I am not a native Chinese reader; the three Chinese strings read correctly to me and match their sibling strings.

### Order of work
- **Before the owner looks:** D-182 (204 px scene), D-183 (tab), D-184 (swatches).
- **Polish:** D-185, D-186, D-187, D-188, D-189.

### Not verified by me
A real phone and WebKit (headless Chromium only). The 21:14:53 build. English layouts. 360 × 740; 390 × 844 at DPR 2. Desktop 1280, the K08 result screen and the `/lokasi` page, which use the same scene. The entrance animations (my runs use reduced motion). Returning from "Selesai mengubah" to the conclusion after a chip. Sending the answer. The byte numbers of the handoff. The test suites.

---

## T-022 — concept (2026-11-16)

Designer · Working under C:\Users\User\Desktop\rksgm-episode2 · No client source edits, no commit, BOARD.md not touched. Run light: no server; one headless Chrome once per mock pass on a local file, below-normal priority; art built by one script.
Sources read: the module text "Modul Kasus Klaim SIM Palsu", `team/specs/2026-11-16-modul-vs-game.md` (P2), `docs/cerita/PANDUAN-EPISODE.md` §5.
Evidence: `team/evidence/T-022/designer/`: 28 mock screenshots,`papan-cerita-1.png` and `-2.png` (all 16 states at 390 × 645), `seni-strip.png` and `-2.png` (the art at 2x), `seni/` (the mock art), `mock.html`, `mock-ukur.json`.

### [D-190] The game: "Periksa SIM Pak Darto"
The player does what the module's surveyor did, with the hands: take the real card, read its class, go to the office that issued it, hand over the ID number, lay the card on the print-out. Four steps, five screens, about eleven taps. No list of answers anywhere.
| Step | What the player does | What it teaches (from the module) | Stamp |
| --- | --- | --- | --- |
| 1. Minta yang asli | Two things lie on the interview table: the photocopy in the claim folder and Pak Darto's wallet. Tap the wallet; he hands over the card and it lands under the player's thumb | Ask to see the original licence | ASLI |
| 2. Baca golongannya | The licence fills the scene. Tap its class box: a magnifying glass shows "B II UMUM" large. Then tap the tag on the truck ("Perlu SIM: B II UMUM"). A "Balik" button turns the card over; the back names the issuer, Satpas SIM | The licence must fit the vehicle; look at how the class is printed | COCOK |
| 3a. Ke mana dicek | A small place board (the K04 look): Kantor Raksa, Bengkel rekanan, Satpas SIM. Tap one | The check is done at Satpas SIM | |
| 3b. Loket Satpas | At the counter: Pak Darto's KTP, a terminal, his signed power of attorney, a wall notice "Bawa KTP atau KK dan surat kuasa". Tap the line on the KTP the officer needs; the number runs into the terminal | The search uses the NIK (KTP or KK), with a power of attorney or a family member named on the KK | SATPAS |
| 4. Cocokkan cetakan | The Satpas print-out lies above, the card is in hand below. Drag the card onto it (a tap does the same); name, class and number are ticked one by one | Compare the card with the register | SESUAI |
| End | The clipboard with four stamps, Pak Bima's card "Cerita Pak Bima dari kasus lain" with the edited print under the magnifying glass, one line of feedback | The module's case: refusal, admission, SIM A in the register, the exclusion | |
- **Progress** is a clipboard under the scene with four slots; each finished step gets a green ink stamp.
- **A wrong tap never says "salah".** The object gets an amber dashed frame and Pak Bima answers in one sentence in his speech box (amber). Nothing is lost and the player taps again.
- **At most three facts per screen.** Step 1: copy / original. Step 2: class on the card / class the truck needs. Step 3a: Satpas. Step 3b: NIK / KTP or KK / power of attorney. Step 4: name / class / number.
- **"Kenapa?"** is a yellow sticky note on the top right corner of every scene; tapped, it unfolds over the scene with one sentence (68 to 102 px high, always inside the scene).
- **Pak Darto's licence is genuine** (B II Umum, found in the register, everything matches), so Episode 2 stays a valid claim. The fake appears only on Pak Bima's card at the end.
- **Every drag has a tap.** Step 4 is the only drag; all targets are buttons with names (keyboard and screen reader). Under reduced motion the states change without sliding.

### [D-191] Screens and numbers (Stage 2 shell, no page scroll)
Story header 57, top padding 12, activity head 69, gaps 8, pinned bar 74 with a 58 px button: as today.
| Block | Height |
| --- | --- |
| Instruction line, 16 / 20, green | 20 (one line in every state) |
| Scene, pixel art at 1 art px = 1 CSS px, 2 px border | 236 |
| Clipboard with four stamp slots | 48 |
| Pak Bima's line: 32 px portrait + box, 14 / 18 | 36 to 69 (1 to 3 lines) |
| Spare above the bar, 360 × 640 | 23 to 56 |
| Spare above the bar, 390 × 645 | 46 to 61 |
| End screen: clipboard 62, case card 207 / 190, feedback 69; spare | 66 / 88 |
- Measured in the mock for all 16 states at both sizes: page width 360 / 390, nothing sticks out of the scene, every bar label on one line.
- Scene content is anchored to the centre or to an edge, so one set of art serves 336 and 366 px.
- Bar labels, one line each: "Ketuk satu benda di meja." → "Lanjut: baca kartunya"; "Ketuk kartu, lalu label truk." → "Lanjut: cek datanya"; "Ketuk satu tempat." → "Ke loket Satpas"; "Ketuk satu baris di KTP." → "Lanjut: cocokkan cetakan"; "Seret kartu ke cetakan." → "Selesai periksa"; "Kembali ke cerita".
- Mocks, both sizes: `mock-1-minta-asli`, `mock-1-minta-asli-dapat`, `mock-2-golongan`, `mock-2-golongan-lensa`, `mock-3a-tempat`, `mock-3b-loket`, `mock-3b-loket-ketemu`, `mock-4-cetakan`, `mock-4-cetakan-sama`, `mock-5-akhir`. At 390 × 645 only: the three "ragu" states, `-balik`, `-cocok`, `-satpas`, and the open note (`mock-2-golongan-kenapa`; `mock-3b-loket-kenapa` is at 360 × 640).

### [D-192] Text (Indonesian; every line under 20 words, the longest is 17)
| Step | Instruction | "Kenapa?" note |
| --- | --- | --- |
| 1 | Ketuk SIM yang perlu kita periksa. | Fotokopi bisa diedit. Kartu asli bisa diperiksa cetakannya. |
| 2 | Ketuk golongan SIM di kartu ini. Then: Cocokkan: ketuk label di truk. | SIM harus sesuai kendaraan yang dibawa. Truk trailer ini perlu B II Umum. |
| 3a | Ke mana kita cek data SIM ini? | Satpas SIM menerbitkan dan menyimpan data SIM. |
| 3b | Ketuk nomor yang dicari Satpas di KTP. | Dicari lewat NIK di KTP atau KK. Perlu surat kuasa pemilik SIM, atau ditemani keluarga di KK. |
| 4 | Cocokkan kartu dengan cetakan Satpas. | Kalau cetakan kartu berbeda dari data Satpas, SIM itu perlu ditelusuri. |
- **Done lines** (replace the instruction, green with a tick): "Kartu asli sudah di tanganmu." · "Golongan SIM cocok dengan truknya." · "Data SIM dicek di Satpas." · "Data ditemukan lewat NIK." · "Nama, golongan, dan nomor sama."
- **Pak Bima, guiding:** "Pak Darto supir truknya. Sebelum lanjut, kita lihat SIM-nya dulu." · "Golongan menentukan kendaraan apa yang boleh dibawa." · "B II Umum, cetakannya rapi. Sekarang bandingkan dengan truknya." · "Cocok. Tapi kartu yang rapi belum tentu tercatat. Kita cek datanya." · "Siapa yang menyimpan data SIM?" · "Betul. Bawa KTP dan surat kuasa Pak Darto ke loketnya." · "Petugas mencari data dari satu nomor di KTP. Yang mana?" · "Ketemu. Minta cetakannya, lalu cocokkan dengan kartu." · "Geser kartu ke cetakan. Lihat tiga baris: nama, golongan, nomor." · "Tiga-tiganya sama dengan data Satpas."
- **Pak Bima, after a wrong tap** (the photocopy, workshop and KTP-name cases are drawn; the rest is text only)**:** photocopy: "Fotokopi gampang diedit. Kita minta kartu aslinya ke Pak Darto, ya." · photo on the card: "Itu fotonya. Golongan SIM dicetak besar di pojok kanan atas." · name or number on the card: "Itu nama dan nomornya. Kita cari golongannya dulu." · workshop: "Bengkel paham truk, bukan data SIM. Data SIM ada di Satpas." · office: "Dari meja kita cuma melihat kartunya. Datanya ada di Satpas." · name on the KTP: "Nama bisa sama dengan orang lain. Satpas mencari lewat NIK." · address: "Alamat bisa berubah. Satpas mencari lewat NIK."
- **Pak Darto, handing the card over:** "Ini SIM saya. Silakan diperiksa." **Card turned over:** "Di belakang tertulis penerbitnya: Satpas SIM. Nanti kita ke sana."
- **End feedback:** "SIM Pak Darto asli dan sesuai truknya. Bagian ini beres; pemeriksaan klaim lanjut."
- **Pak Bima's card from the other case:** "Pengemudi menolak menunjukkan SIM asli, lalu mengaku." · "Cetakan golongannya berbeda. Di Satpas tercatat SIM A." · "Tidak punya SIM sesuai peruntukan: masuk pengecualian polis."
- **The article is not named** anywhere; the card says "pengecualian polis". No line says "ditolak" or promises an outcome. The module's real names, plate, policy and licence numbers are not used; card number and NIK are plainly invented (1234-5678-000042, 1234567890123456).

### [D-193] Pixel art list
The cards look like the real documents: red top band, "SURAT IZIN MENGEMUDI", a boxed class, photo, name, number, validity, signature, hologram; a made-up shield instead of any official emblem. Printed text is baked into the art in Indonesian (a document stays in its language); all game text around it is live text.
| File | Size (px) | Bytes in the mock |
| --- | --- | --- |
| `sim-depan.png` (licence, front, in hand) | 240 × 152 | 4,013 |
| `sim-belakang.png` (licence, back) | 240 × 152 | 1,861 |
| `sim-kecil.png` (licence, small, on the table) | 120 × 76 | 1,139 |
| `sim-pin.png` (licence as the pin on the place board) | 32 × 21 | 320 |
| `berkas-fotokopi.png` (claim folder with the grey photocopy) | 140 × 98 | 711 |
| `lensa-asli.png` (magnifying glass, even print) | 124 × 124 | 751 |
| `lensa-palsu.png` (magnifying glass, edited print (end card)) | 124 × 124 | 844 |
| `ktp.png` (KTP) | 190 × 120 | 2,269 |
| `dompet.png` (wallet) | 64 × 46 | 189 |
| `jempol.png` (the player's thumb) | 32 × 46 | 194 |
| `truk-mini.png` (the trailer, reduced from the pool art) | 120 × 58 | 2,016 |
| `meja.png` (table top tile) | 48 × 32 | 161 |
| `ubin-satpas.png` (Satpas SIM place tile) | 80 × 60 | 309 |
| `loket-dinding.png` (Satpas counter wall with window and notice) | 366 × 104 | 2,570 |
| `monitor-kosong.png` (terminal, waiting) | 124 × 92 | 271 |
| `monitor-isi.png` (terminal, data found) | 124 × 92 | 379 |
| `cetakan.png` (Satpas print-out) | 300 × 112 | 632 |
| `surat-kuasa.png` (power of attorney slip) | 124 × 46 | 322 |
| `klip.png` (clipboard clip) | 48 × 16 | 155 |
| `stempel-asli / -cocok / -satpas / -sesuai.png` (ink stamps) | 60 × 26 each | 949 |
| `sim-palsu-kecil.png` (edited licence, small; drawn, not used in the mock) | 120 × 76 | 581 |
| **Total, 24 new files** | | **20,636** |
- **Reused, no new bytes:** Pak Darto and the police officer from the side-character atlas (in the mock the officer is baked into the counter wall), the portraits, the interview room wall, the K04 tiles (Kantor Raksa, Bengkel rekanan), grass, dirt roads, trees, bush.
- **The brief's 120 × 76 card** is the small card on the table. In the hand it is 240 × 152: at 120 × 76 the name and number cannot be read at 1 art px = 1 CSS px.
- **Estimate for production art:** about 23 to 27 KB in about 26 indexed PNGs (the mock art is close to final; the licence front and the KTP want hand-tuning, and a "data not found" terminal may be added). One art dispatch, the size of T-020 batch 1. Client work is the Lead's and Fullstack's to estimate; in screens it is about one K08.

### [D-194] For the Lead and PIC Claim to decide
- **New statements that are not in the module** (PIC Claim sign-off, PANDUAN §5): "truk trailer ini perlu B II Umum"; "Satpas SIM menerbitkan dan menyimpan data SIM"; "nama bisa sama dengan orang lain"; "alamat bisa berubah"; "fotokopi bisa diedit". Everything else paraphrases the module.
- **Validity** is printed on the card but is not a step: the module does not teach it. Say so if it should be one.
- **Step 1 needs a photocopy in the folder.** If the player did not ask for the SIM in K02, the folder should show an empty slot and only the wallet can be tapped.
- **Outcome:** the activity cannot fail. The number of amber answers is the only score; I suggest it changes one sentence of Pak Bima's closing line and nothing else.
- **"Kenapa?" in step 3b names the NIK**, which is the answer. It is help the player has to open; it can be held back until after the first tap if that is too easy.
- **Pak Bima's card** could be kept as a collectable in the summary; not designed here.

### Not verified by me
Nothing is built in the game; the mocks are a static page with the game font, measured in headless Chromium at 360 × 640 and 390 × 645 only. English and Chinese text lengths. 360 × 740, 390 × 844 and desktop. How the drag feels on a phone. Whether the baked 3 × 5 pixel lettering on the cards is readable enough on a real screen at device pixel ratio 2 and 3 (it is in the screenshots). The total against the 400 KB gate. The legal accuracy of the licence class for this truck. The test suites.

---

## T-020 — batch 2 review (2026-11-16)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: production build in client/dist of 22:01:04 for five of the six runs (checked before and after each). Fullstack was rebuilding while I started: the 360 × 640 DPR 3 run began on the 21:58:39 build and the build changed to 22:01:04 during it; its numbers equal the DPR 2 run on 22:01:04. An earlier 360 × 640 DPR 2 run that straddled two builds was repeated. My own server on :4002, started and stopped by me; other ports not touched.
Method (run light: one headless Chrome at a time, closed between runs, below-normal priority, no test suite): read HANDOFF "T-020 batch 1 FIX" and "T-020 batch 2"; six runs: 360 × 640 at DPR 2 and 3, 390 × 645 at DPR 2 and 3, 390 × 844 at DPR 3 (Indonesian), 360 × 640 at DPR 2 in Chinese. In each run K07 (start, "Info tugas" open, slot chosen, chip chosen), K09 (start, card selected, one planned + one not needed, all five marked, a marked card selected again, undo), K10 (start, stamp pressed, after the automatic move, all three stamped, back by tapping a paper row), then the batch 1 walk of K04 and K08 again. **Pixel check as in batch 1:** every sprite against its source PNG; for every nine-slice frame the four corners and the four edges against the source file. I opened 9 screenshots and crops and my 3 mocks. K02, K05, K11 and the chat photo ignored as asked. Evidence: `team/evidence/T-020/designer/batch2-review/` (screenshots, `zoom-*.png`, `ukur-*.txt`).

### Verdict: PASS with polish. No blocker and nothing that scrolls. Batch 1 fixes D-182 to D-189 all confirmed. Five small items for batch 2, none of them about blur.

### Batch 1 fixes: PASS at DPR 2 and 3
| Item | Measured (360 × 640 / 390 × 645) |
| --- | --- |
| D-182 204 px scene | scene 204 high; with a mark on sign 2 the three-line legend ends at 542.8, fold at 558 / 563; scroller 412 / 412 and 417 / 417. At 390 × 844 the scene stays 236 |
| D-183 tab | "Tandamu" tab clear of the question text (the boxes overlap by 0.75 px, no glyph is touched; seen in `zoom-k08-simpul-atas-390x645-d2.png`) |
| D-184 swatches | both swatches on the "Tandamu" side are the 14 × 14 PNGs, exact |
| D-185 truck | 29 px / 72 px of cab above the sheet; sheet 492 / 454, road 43 / 86, no list scroll |
| D-186 tile anchors | pictures at x 14 and 14 from the right, top row y 10, both bottom tiles end 8 px above the edge; pin overlaps the plate above by 0 px |
| D-187 "Kantor Raksa" | one line (95.6 of 96 px), tile 75 high |
| D-188 faces | sign 1's face on a lane with both marks: 0 device pixels differ from the source |
| D-189 pin ring | 0 of the ring's pixels differ from the source |
- The handoff says the bottom row ends 21 px above the edge; I measured 8 px for both bottom tiles, which is the README value.

### Crispness of batch 2 at DPR 2 and 3: PASS
| What | Result at all sizes and both DPRs |
| --- | --- |
| Sprites: magnifiers, clock, "+" key, pushpin on the filled slot, three chip icons; car, "?" badge, pin and dash icons, undo badge; row icons, "not equal" marker, progress squares, small and large stamps normal and pressed, header bands | 0 device pixels differ from the source |
| Nine-slice frames, corners: cork frame, column plates, token, job card, empty and filled slots, chips normal and chosen, witness cards normal / selected / ghost, keys normal and pressed | 0 differ |
| Nine-slice frames, edges, wherever nothing is drawn over them | 0 differ |
- **The six cells cut from the two atlases show no seam and no blur**, also at the fractional widths of K09 (slots 56.8 and 62.8 px, cards 62.4 and 68.4 px). I accept the cut files as the delivery; I will ship single files in future.
- Not exact, by design: the sticky note (rotated 1.5°) and the pinned witness cards with their pins (rotated 2°), as in my mocks; the ghost card (40 % opacity); frames where something lies on top (header band on the paper, undo badge on the card corner, stamp impression and marker on the highlight, text that reaches into a border).
- On the dashed slots the repeated dashes start a fraction of an art pixel away from the corner pieces when the slot is an odd number of pixels wide (149 at 360 wide). The dashes themselves stay whole blocks; I can see it only in the numbers.

### Layout (Indonesian)
| Screen | 360 × 640 | 390 × 645 | 390 × 844 | 360 × 640 zh |
| --- | --- | --- | --- | --- |
| K07 strip / board / chips | 76 / 171 / 68 | 76 / 171 / 53 | 76 / 171 / 53 | 76 / 156 / 48 |
| K07 spare under the chips | 3.2 | 23.2 | 222 | 38.2 |
| K09 board / card row / action strip | 124 / 96 / 101 or 115 | 124 / 82 / 101 or 115 | same as 390 × 645 | 124 / 82 / 101 |
| K09 spare | 15.6, or 1.6 with the car driver selected | 34.6 or 20.6 | 234 or 220 | 29.6 |
| K10 papers / sentence box / stamp row | 93 / 129 / 66 | 93 / 129 / 66 | 93 / 129 / 90 (large stamps) | 93 / 93 / 52 |
| K10 spare | 3.2 | 31.6 | 207 | 76.6 |
- Nothing scrolls in any state; page height = screen; no sideways overflow. Board, card row and stamp row do not move when a choice is made (0.0 px in every run).
- All three match the mocks: K07 cork, plates, yellow job card with the clock, tilted note, dashed slots with the "+" key, pinned card with pushpin and magnifier, three chips; K09 five slots, count box, card states, "–" undo badge, car card with "?", two keys with pressed state; K10 blue and brown bands, Wahyudi / Wahyudin, highlight in both papers with the red marker, impressions on the rows, progress squares, five stamps.
- "Info tugas": yellow tab on the title row, 98 × 31 with a larger touch area, receives the tap; opened, it turns green and the info panel pushes the board down inside the scroller (357 / 636 at 360 × 640), which is the only time these screens scroll.
- Undo: the "–" badge is 18 × 18 with a 38 × 41 touch area and receives the tap; the card returns to unmarked and the bar goes back to "Tandai 1 kartu lagi."

- [D-195] K09, both widths · **the two keys move 14 px when the car driver is selected**: its line ("Pengemudi mobil kecil · Memotong jalur; pergi dan tidak dikenali.") takes two lines, so the action strip is 115 instead of 101 and the keys the player has just been tapping shift down, then back up at the next card. At 360 × 640 the spare falls to 1.6 px · give the strip one fixed height of 115 (two-line head always); it still fits · low.
- [D-196] K09 at 360 wide · "Pengemudi mobil kecil" breaks inside the word ("Pengemud / i mobil / kecil") and makes the card row 96 instead of 82 · never break inside a word on these cards; a smaller size for this one name (about 10.5 px) is fine · low.
- [D-197] K09 pinned cards · every name on the board is cut: "Petug…", "Penge…", "Polisi J…", "Pak Da…" (Chinese too). It was like that in my mock and it reads badly · on the pinned card use a 36 px portrait and the name on two lines of 11 / 12, which fits the 58 px inside the slot, or drop the name there (the full names stay on the row below) · low.
- [D-198] K10 paper rows · **verdict on the 22 px rows: acceptable to show the owner, change to 24 px before release.** Each row is two buttons 159 to 174 wide and 22 high, stacked without a gap; they receive their taps, and the automatic move means they are only needed to change an earlier stamp. But 22 px is under the 24 px minimum of WCAG 2.2 (target size) and half of our 44 · rows 24 px (papers 99) and 4 px less padding in the stamp buttons (66 → 62, still 64 wide): net +2 px, 1.2 px spare at 360 × 640 · low.
- [D-199] "Info tugas" tab · the "≡" sign touches the word ("≡Info tugas") · 4 px between them · low.
- Accepted as built: K09 board 124 px (my 116); the placed K07 card showing only "Pemeriksaan kejadian" (column and strip say where); the small stamps without symbols (the labels carry the meaning; the large ones at 844 have them).

### Final text of the draft strings
| Key | id | en | zh |
| --- | --- | --- | --- |
| `infoTugas` | Info tugas | Task info | 任务信息 |
| `belumBedaRingkas` | Cap {n} perbedaan dulu. | Differences left to stamp: {n}. | 还有 {n} 处出入待盖章。 |
| `arena.selisih.nama.catatan` | Yang pasti, namanya tertulis berbeda. | What is certain: the name is written differently. | 可以确定的是，两处姓名写法不同。 |
- **"Cap" is right now** that the stamps exist (my earlier objection was to "Catat", which is also the name of one answer).
- **Chinese bar text:** the draft "还需盖章 {n} 处出入。" puts an object after "盖章", which reads wrong to me; "还有 {n} 处出入待盖章。" keeps the same words. I am not a native reader, so the translator should confirm.
- **English note:** shortened from "What is certain is that the name is written differently." Same meaning, one "is" less.
- The other two stand as drafted.

### Not verified by me
A real phone and WebKit (headless Chromium only). English on all three screens; Chinese only at 360 × 640. 360 × 740 and desktop. The list view behind "Info tugas". Sending the three answers and the result beats. The entrance and press animations (my runs use reduced motion). 390 × 844 at DPR 2. Batch 3 screens. The byte numbers of the handoff. The test suites.

---

## T-022 — art (2026-11-16)

Designer · Working under C:\Users\User\Desktop\rksgm-episode2 · No client source edits, no commit, BOARD.md not touched. No browser and no server used; one build script at below-normal priority.
Scope: production pixel art for "Periksa SIM Pak Darto" after the owner's go on the concept [D-190..D-194], with the Lead's decisions (licence genuine; always start at the desk; validity drawn, not taught; "Kenapa?" may name the NIK; article behind "pengecualian polis").

### Delivered
- **Folder:** `character/aktivitas-ep2-pixel-v1/sim/`: **39 indexed PNGs, 24,171 B**, with `README.md` (files, sizes, which step uses what, positions, tap areas, the drag handle and drop target, states, nine-slice values). `BYTE.md` rewritten for all sets: 132 files, 60,644 B.
- **Build script:** `character/aktivitas-ep2-pixel-v1/alat/bangun-sim.mjs`.
- **Preview strip at 2x:** `team/evidence/T-022/designer/seni-produksi-strip.png`: the five scenes and the clipboard / speech box / note / end card assembled from the files, then every file. The same scenes at 1x are in the folder as `pratinjau-adegan-*.png` (not assets).
- **Palette:** every pixel is one of the 668 colours already used by the Ep2 rooms, the side-character atlas and the other activity sets; the script counts 0 pixels outside it.
- **Lettering:** a 5 × 7 pixel alphabet for all words on cards and papers (the 3 × 5 one of the mock made M, N and U hard to tell apart); long numbers keep the 3 × 5 digits at double size.

### Byte table
| File | Size (px) | Palette entries | Bytes |
| --- | --- | --- | --- |
| berkas-fotokopi.png | 140 × 98 | 9 | 703 |
| cap-asli.png | 60 × 26 | 2 | 228 |
| cap-cocok.png | 60 × 26 | 2 | 227 |
| cap-kosong.png | 120 × 26 | 3 | 135 |
| cap-satpas.png | 60 × 26 | 2 | 244 |
| cap-sesuai.png | 60 × 26 | 2 | 250 |
| catatan-9i.png | 20 × 20 | 4 | 137 |
| centang.png | 44 × 18 | 5 | 154 |
| cetakan.png | 300 × 112 | 7 | 719 |
| dompet.png | 64 × 46 | 9 | 189 |
| gelembung-9i.png | 18 × 18 | 2 | 92 |
| gelembung-ekor.png | 16 × 10 | 5 | 151 |
| gelembung-ragu-9i.png | 18 × 18 | 2 | 92 |
| jempol.png | 32 × 46 | 6 | 194 |
| kartu-kasus-9i.png | 18 × 20 | 2 | 92 |
| klip.png | 48 × 16 | 4 | 155 |
| ktp.png | 190 × 120 | 58 | 2636 |
| label-lubang.png | 8 × 8 | 3 | 114 |
| label-truk-9i.png | 18 × 20 | 3 | 104 |
| label-truk-cocok-9i.png | 18 × 20 | 3 | 104 |
| label-truk-ketuk-9i.png | 18 × 20 | 3 | 104 |
| lensa-asli.png | 124 × 124 | 9 | 784 |
| lensa-palsu.png | 124 × 124 | 11 | 881 |
| loket-dinding.png | 366 × 104 | 62 | 2261 |
| meja.png | 48 × 32 | 4 | 161 |
| monitor-isi.png | 124 × 92 | 9 | 478 |
| monitor-ketik.png | 124 × 92 | 7 | 371 |
| monitor-kosong.png | 124 × 92 | 6 | 294 |
| papan-jalan-9i.png | 18 × 18 | 3 | 104 |
| potret-petugas.png | 32 × 32 | 43 | 732 |
| sim-belakang.png | 240 × 152 | 10 | 1930 |
| sim-depan.png | 240 × 152 | 70 | 4304 |
| sim-hantu.png | 240 × 152 | 3 | 308 |
| sim-kecil.png | 120 × 76 | 55 | 1125 |
| sim-palsu-kecil.png | 120 × 76 | 11 | 589 |
| sim-pin.png | 32 × 21 | 14 | 338 |
| surat-kuasa.png | 124 × 46 | 6 | 349 |
| truk-mini.png | 120 × 58 | 25 | 2016 |
| ubin-satpas.png | 80 × 60 | 13 | 322 |
| **Total, 39 files** | | | **24,171** |

### Mapping notes for Fullstack
- [D-200] **Scenes are built from pieces at fixed pixel positions** in a W × 236 box with a 2 px border (drawing area (W − 4) × 232, W = 336 or 366). Each position is given from the left, the right or the centre, so one set of art serves both widths. The README has one table per step.
- [D-201] **Tap areas and the drag** (all in the README): step 1 photocopy 148 × 106 and wallet 108 × 76; step 2 three areas on the card, the right one is the class box (88 × 56), then the whole truck tag; step 3a the three tile boxes; step 3b three rows on the KTP, the right one is the NIK row (134 × 24); step 4 the visible card is the drag handle (240 × 96) and the print-out grown by 12 px is the drop target, with a 24 px upward drag or a plain tap counting as the drop.
- [D-202] **Frames are nine-slice files** for `border-image` with `repeat`, each a single file (no atlases this time): truck tag in three states, clipboard board, speech box normal and amber, sticky note, end card. Tick box, stamp place and speech tail are small cell atlases used as plain backgrounds.
- [D-203] **Reused without new bytes:** the interview room wall (shown 1:1 through a 366 × 88 window), Pak Darto and the portraits from the side-character atlas, the K04 tiles Kantor Raksa and Bengkel rekanan with their frames, grass, dirt roads, trees and bush. Hints and wrong / right outlines on tappable things are CSS borders.
- **The Satpas officer is a new person:** the Polisi figure mirrored, with glasses and a gold cap badge, drawn into the counter wall; `potret-petugas.png` (32 × 32) is there in case the officer gets a line.
- **Terminal:** three files (waiting, eight digits typed, found). Under reduced motion go straight to "found".
- **Drag ghost:** `sim-hantu.png` is a dashed outline of the card with its three landmarks; it stays where the card started while the card itself follows the finger.

### Differences from the concept
- **39 files instead of 24:** states and frames became files of their own (typing terminal, ghost, tag in three states with its hole, tick box, clipboard board, empty stamp places, speech boxes and tail, sticky note, end-card frame, officer portrait). Bytes: 24,171, inside my estimate of 23 to 27 KB.
- **Card layout changed slightly for readability:** the title is two lines of large letters, the class box is 80 × 48 with "B II" and "UMUM" at the same size, the hologram moved down so the number has room. The KTP rows moved by a few pixels; the README has the new tap areas.
- **Counter wall:** the "SATPAS SIM" sign is now a band across the top, so the "Kenapa?" tab in the corner covers nothing; a "Loket 1" plate was added; the notice reads "Cek data SIM / bawa KTP/KK dan surat kuasa".
- `sim-palsu-kecil.png` is delivered as a spare; the end card uses `lensa-palsu.png`.

### Not verified by me
Nothing is wired into the game and no browser was used: the scenes in the strip are assembled by the script, not rendered by CSS. Whether the 5 × 7 lettering reads well on a real phone at device pixel ratio 2 and 3. The nine-slice frames in a browser (same technique as batch 2, which was exact). The positions were carried over from the concept mock and adjusted by calculation for the new card layout, not re-measured in a page. English and Chinese text lengths around the art. The total against the 400 KB gate. The test suites.

---

## T-020 — batch 3 review (2026-11-16)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: Fullstack was rebuilding for T-021 while I worked. Four runs (390 × 645 at DPR 2 and 3, 390 × 844 at DPR 3, Chinese) and the desktop look were on the 23:08:39 build, unchanged before and after each. The two 360 × 640 runs each saw a rebuild land while they ran (23:01:45 → 23:05:27 and 23:05:27 → 23:08:39); an earlier 360 × 640 DPR 2 pass of the batch 3 screens alone, entirely on 23:01:45, gave the same numbers. My own server on :4002, started and stopped by me; other ports not touched.
Method (run light: one headless Chrome at a time, closed between runs, below-normal priority, no test suite): read HANDOFF "T-020 batch 2 polish" and "T-020 batch 3"; six runs: 360 × 640 and 390 × 645 at DPR 2 and 3, 390 × 844 at DPR 3 (Indonesian), 360 × 640 at DPR 2 in Chinese; one desktop pass at 1280 × 800 for the chat photo only. In each run: K02 through all eight documents (with the tray contents opened once), K05 with two places, K11 through its three steps with all seven pockets, the chat photo (reached by answering K01), then K07 / K09 / K10 again for the polish. **Pixel check as before:** every picture against its source PNG, and the K02 counter scene against the three stage files it is composed from. I opened 9 screenshots and crops and one mock; K05 and K11 were compared with the mock's numbers. Part 1 opening and the endings ignored as asked. Evidence: `team/evidence/T-020/designer/batch3-review/`.

### Verdict: PASS with fixes. No blocker. Two things to fix before the owner looks (D-204, D-205), the rest polish. Batch 2 polish D-195 to D-199 confirmed.

### Crispness at DPR 2 and 3
| What | Result |
| --- | --- |
| K02: counter scene (the three stage files, 1 : 1), all eight documents, tray cells empty / with documents / full, thumbnails in the contents panel | exact at all sizes and both DPRs (43 picture checks per run) |
| K05: four of the five tiles, photo stack in the strip, thumbnail token on the tile | exact |
| K05: the centre tile ("Bengkel lain") | exact at DPR 2; **not exact at DPR 3** (D-205) |
| K11: folder, pocket thumbnails, tied bundle, three action pictures, plan-row picture | exact |
| Chat photo 240 × 150 | exact at DPR 2 and 3 (0 of 144,000 and 0 of 324,000 device pixels differ) |
- All checked pictures are drawn at their file size.

### K02 documents against `mock-k02-dokumen-*.png`
| Check | 360 × 640 | 390 × 645 | 390 × 844 |
| --- | --- | --- | --- |
| Counter scene | 336 × 160 | 366 × 160 | 366 × 160 |
| Document, name plate, "n/8" plate | document 1 : 1 at left 30, 10 above the bottom; plate left 110 / right 12 / bottom 26; "n/8" at (8, 8), eight squares | same | same |
| Row between scene and trays | 48; instruction, then the placement with Batalkan / Ubah | same | same |
| Trays | 107 × 171, art 68 × 40 | 117 × 141 | 117 × 141 |
| Trays end above the fold by | 64 px | 99 px | 298 px |
| Trays move after a placement | 0 px | 0 px | 0 px |
| Count badge = "Isi" button | 22 × 22, touch 40 × 40, receives the tap | same | same |
| Below the fold | 66 px (info row and list link) | 31 px | 0 |
- **The 160 px scene is acceptable, and I have no better crop.** It is my own mock number. The stage art has only 20 rows of plain wall above this crop and floor below it; a 214 px scene would add floor under the counter and push the trays down for nothing. Keep 160 at every size.
- Tray art changes with the count as specified (after four placements: full, with documents, empty for 3 / 1 / 0).
- [D-204] Tray contents · **the "Isi" panel opens under the trays, mostly below the fold**: at 360 × 640 only its title is visible (58 px of 193), at 390 × 645 93 px; the document list with its "Ubah" links needs a scroll that nothing announces (`k02-isi-*.png`). On 390 × 844 it is whole · show the panel in place of the counter scene and the 48 px row while it is open (208 px are free there, the panel is 193), or scroll it into view · **med**.
- [D-208] End summary ("Periksa susunanmu") · the three tray pictures are the empty ones although the trays hold 4 / 2 / 2 documents; at 360 × 640 this screen also scrolls 17 px · use the same cell-by-count rule as on the trays · low.
- [D-209] Scene · the office sign shows as a fragment ("…SA") next to the "n/8" plate · leave the sign layer out of this scene · low.

### K05 against `mock-k05-terusan-*.png`
| Check | 360 × 640 | 390 × 645 | 390 × 844 | 360 × 640 zh |
| --- | --- | --- | --- | --- |
| Board | 336 × 221.2 | 366 × 249.6 | 366 × 300 | 336 × 264.6 |
| Spare under the strip | 2.0 | 2.0 | 2.0 (150 after a choice) | 2.0 |
| Tiles overlap | 0 | 0 | 0 | 0 |
- Pictures 80 × 60 in the K04 frames at the K04 anchors (14 from both sides, top row y 10); "Info tugas" in the head; instruction pinned (40 px, Chinese 20); the two strips are both 80 px, so the board does not move or change size on a tap (0 px).
- Token: the photo stack 60 × 48 in the strip; after a tap the 22 × 28 thumbnail at picture (+62, −10), inside the board. Bar "Ketuk satu tujuan." → "Teruskan foto", one line.
- [D-205] Centre tile at DPR 3 · **the middle tile is not pixel-exact**: 10.6 % of its device pixels differ from the source at 360 × 640 and 390 × 844, 0.4 % at 390 × 645; at DPR 2 it is exact. The tile is centred with a half or fractional pixel (picture top 114.5 on the 300 px board; the board itself is 221.22 and 249.61 px high on the short screens), so at three device pixels per pixel its rows come out uneven. K04 uses the same code; it was exact where I measured it only because its centre tile has a two-line label · give the board a whole-pixel height and the centre tile a whole-pixel top (round down) · **med**, because most current phones are DPR 3.

### K11 against `mock-k11-bundel-*.png`
| Check | 360 × 640 | 390 × 645 | 390 × 844 | 360 × 640 zh |
| --- | --- | --- | --- | --- |
| Step tabs | 109 × 40 | 119 × 40 | 119 × 40 | 109 × 50 (names on two lines) |
| Step 1: folder band / pocket / strip | 64 / 77 × 46 / 72–74 | 64 / 84.5 × 46 / 72 | same | 64 / 77 × 46 / 72 |
| Step 2: reminder / three cards | 56 / 56, 56, 68 | 56 / 56, 56, 56 | same | 56 / 56 × 3 |
| Step 3: plan row / three rows | 56 / 56, 56, 68 | 56 / 56 × 3 | same | 56 / 56 × 3 |
| Spare, steps 1 / 2 / 3 | 28 / 27 / 27 | 33 / 44 / 44 | 232 / 243 / 243 | 18 / 53 / 53 |
- Nothing scrolls in any step. Seven pockets in 4 + 3 with their thumbnails; pocket 7 dashed with "–" and a red-edged strip "Belum tersedia"; "Tentukan langkah" is the bar button; a tap on tab 1 from step 3 goes back to the pockets.
- **Per-pocket contents missing: not a blocker.** The strip shows "Lembar n dari 7", the group's name and "Tersedia" / "Belum tersedia", and the names already say what is inside ("Formulir klaim, STNK, SIM, KTP"). The content list was my mock's idea; the script has no such data. Leave it out.
- [D-206] Step 3 bar · "Konfirmasi tindakan & kirim kabar" takes two lines at both widths (the button stays 58 high) · a short bar label: "Konfirmasi & kirim kabar" / "Confirm & send the news"; the Chinese "确认处理并发送消息" already fits. The other label, "Konfirmasi tindakan tanpa mengabari", is longer still (not measured): "Konfirmasi, tanpa kabar" / "Confirm, no news yet" · low.
- [D-207] Tender note · the line about "hasil tender" still waiting for confirmation stands under the strip of every pocket · show it with pocket 4 only · low.

### Chat photo
- 240 × 150 with the 2 px frame (244 × 154), exact at DPR 2 and 3, 58 px (360 wide) and 73 px (390 wide) free beside it, caption "Foto truk dari Pak Hendra".
- **Wide screens:** at 1280 × 800 the chat column is 780 px, bubbles go to 760, and the photo is still 244 px: small, but correct and crisp (`obrolan-foto-1280x800-d1.png`). Not a blocker. When wanted: from 1024 px viewport width show it at exactly 2 : 1 (480 × 300, frame 4 px) with `image-rendering: pixelated`; no new file. Never a width in between.

### Batch 2 polish: confirmed
| Item | Measured |
| --- | --- |
| D-195 action strip | 115 in every state at every size; the keys stay at the same y for all five cards |
| D-196 card names | 11 px, wrap at spaces only; "Pengemudi / mobil kecil"; card row 82 at both widths |
| D-197 pinned cards | 36 px portrait, names in full on two lines; only "Pengemudi mobil kecil" at 360 wide is cut after two lines |
| D-198 paper rows | 24 px, papers 99, K10 spare 3.2 at 360 × 640 and 31.6 at 390 × 645 |
| D-199 "Info tugas" | tab 4 px wider (101.7), the sign no longer touches the word |
- Fullstack's question, names close to the card edge at 360 wide: in Indonesian the nearest is 2.2 px from the card's outer edge, just clear of the frame line; acceptable. In Chinese "Hendra 先生" is 1.1 px from the edge and touches the frame line; allow that one name to wrap or drop to 10.5 px. Low, no number of its own.

### Final text of the draft string
| Key | id | en | zh |
| --- | --- | --- | --- |
| `pilihSatuKabar` | Pilih satu kabar. | Choose one message. | 请选一条消息。 |
- Stands as drafted (it mirrors "Choose 1 reply" / "请选 1 条回复" closely enough and is one line everywhere I saw it). The two short bar labels of D-206 are new and need the translator's eye for Chinese only if the Chinese ones are changed too.

### Blockers and polish
- **Blockers:** none.
- **Fix before the owner looks:** D-204 (tray contents below the fold), D-205 (centre tile at DPR 3).
- **Polish:** D-206, D-207, D-208, D-209, the 2 : 1 chat photo on wide screens, the Chinese name on the witness card.

### Not verified by me
A real phone and WebKit (headless Chromium only). English on all screens; Chinese only at 360 × 640. 360 × 740. Desktop for K02, K05 and K11 (only the chat photo was looked at there). The list views. Sending the answers and the result beats. The desk prototype page. The animations (my runs use reduced motion). The byte numbers and the 400 KB gate. The test suites.

---

## T-021 — review (2026-11-16)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched. (Written shortly after midnight, 17 November.)
Build: all cutscene recordings on the production build of 23:26:37, unchanged before and after each of the three runs. Fullstack rebuilt for T-022 afterwards: the batch 3 re-check at 360 × 640 began on 23:26:37 and ended on 00:03:16, the one at 390 × 844 began on 00:03:16 and ended on 00:05:29, the 1280 photo check was on 00:05:29. My own server on :4002, started and stopped by me; other ports not touched.
Method (run light: one headless Chrome at a time, closed between sizes, below-normal priority, no test suite): read HANDOFF "T-021" and "T-020 batch 3 FIX". At 390 × 844 DPR 3, 360 × 740 DPR 2 and 1280 × 800 I recorded the forward move (opening, third tap, into K01) and the back move into each of the three endings (the ending state stepped back one line, as Fullstack's check does). Two recordings per move: **(1) at full speed**, a frame log written inside the page (one entry per frame, about 18 ms apart, no gap longer than 20 ms); **(2) a film at one eighth speed** (timers and CSS animations slowed together), about 50 to 90 screenshots per move, from which I made frame sheets (forward and back to "puas" at every size, all three endings at 390 × 844). Tap-to-skip and reduced motion at 390 × 844. The POV picture was compared with its file pixel by pixel at its whole zoom steps. I opened 5 sheets and crops (forward 390 × 844, back to "puas" and to "kurang" at 390 × 844, forward at 1280, and a device-resolution crop of the two arm cells); the other sizes I judge from the frame logs. Evidence: `team/evidence/T-021/designer/review/` (`strip-*.png`, `log-*.json`, `ukur-*.txt`) and `team/evidence/T-020/designer/batch3-recheck/`.

### Verdict: FIX NEEDED, one item (D-210: the camera pulses in the back move). Timing, box and page behaviour, tap, reduced motion and the POV zoom are as specified. Batch 3 fixes confirmed.

### Timing at full speed (ms after the first cutscene frame)
| Forward | 390 × 844 | 360 × 740 | 1280 × 800 | Spec |
| --- | --- | --- | --- | --- |
| Tap → first frame | 3 | 3 | 3 | |
| Arm "lifting" + bubble | 0 | 0 | 0 | 0 |
| Arm "reading" | 194 | 195 | 184 | about 200 |
| Camera 1.33 / 1.67 / 2 | 248 / 301 / not seen | 249 / 303 / not seen | 237 / 290 / 343 | 2x by 350 |
| POV 1x / 2x / 3x / 4x / fill | 357 / 465 / 555 / 643 / 715 | 356 / 465 / 554 / 644 / 715 | 361 / 450 / 557 / 648 / 720 | from 350 |
| Fill scale | 4.69x | 4.31x | 10x | |
| Screen covers the box | 715 | 715 | 720 | 730–750 |
| Chat mounted | 804 | 822 | 809 | about 820 |
| Layer gone, done | 1,020 | 1,019 | 1,008 | about 1,030 |
- Green cover fades 100 → 0 % over 200 ms; the chat settles from −8 px to 0 in steps of 2.
| Back (three endings each) | 390 × 844 | 360 × 740 | 1280 × 800 | Spec |
| --- | --- | --- | --- | --- |
| Tap → first frame | 10–11 | 10–11 | 11 | |
| POV fill → 4x / 3x / 2x / 1x | 79–82 / 132–135 / 205–208 / 241–262 | 79–83 / 132–137 / 192–206 / 241–246 | 79–80 / 132–134 / 203–206 / 240–243 | gone by 300 |
| Arm "lifting" | 440–443 | 427–439 | 437–443 | 425 |
| Arms gone | 551–569 | 551–566 | 551–568 | 550 |
| Done | 711–715 | 707–715 | 715–730 | 700 |
- All three endings behave alike at each size (nine back recordings).

### What holds
| Check | Result |
| --- | --- |
| Stage box during the move | one value in every recording: 366 × 366 / 336 × 336 / 780 × 432 forward; 366 × 228.8 / 336 × 210 / 780 × 400 back |
| Page height, width, scroll | one value in every recording (844 / 390 / 0; 740 / 360 / 0; 800 / 1280 / 0) |
| Overlay clipped at the dialogue card | the layer box ends 0 to 0.1 px from the card's top edge in every frame; the card stays readable |
| POV picture in whole steps | every art pixel is one flat block of the file's colour at 1x, 2x, 3x and 4x at 390 × 844 DPR 3, and at 1x, 3x and 4x at 360 × 740 DPR 2 (no film frame fell on 2x there); only the rounded corners of the box differ |
| Tap during the move | tapped 280 ms in: cutscene over 40 ms later, chat K01 shown, no layer left |
| Reduced motion | plain cut in both directions: the view changes 5 to 10 ms after the tap, the layer never exists |
| Arm cells | lifting with the bubble, then reading with her eyes down; joined to her sleeves, pixel-sharp (`lengan-390x844-d3.png`) |
| Frame pacing | 56 frames forward and 39 back, 17.7 to 17.9 ms apart, longest gap 20 ms (headless Chromium on this PC) |

### What is wrong
- [D-210] Back move, every size, every ending · **the stage camera pulses.** After the POV picture leaves at 300 ms the stage is shown at 1x, steps in to 1.33x (once as far as 1.67x) by about 385 ms, snaps back to 1x when the arm cell changes at about 440 ms, steps in again to 1.33x by about 512 ms and snaps to 1x at about 551–569 ms (times from 390 × 844). Two zoom-in-and-snap movements in 250 ms where the spec has one steady close view that then returns (`strip-balik-*-390x844-d3.png`, frames 304 / 358 / 425 / 484 / 552). The same reset happens forward, where it only means that 2x is reached for a single frame at most before the POV replaces the stage, and that the canvas keeps restarting its zoom underneath the POV picture, unseen. Cause as far as the log shows: the camera state is taken off and put back at every frame change, so each time the zoom starts again from 1x · keep the camera state through the whole move; in the back move the stage must already be at 2x when the POV leaves, hold it to 550, then return · **high for this task: fix before the owner sees it**.
- [D-211] Camera step · the move in is three jumps of 50 ms through 1.33x and 1.67x (not whole scales), and at 2x the stage picture is enlarged softly, not pixel-sharp (third crop of `lengan-390x844-d3.png`). At today's speed neither is easy to see, but once D-210 holds the 2x view for 175 ms forward and 250 ms back it will be · make it one hard step to 2x (and one back), drawn pixel-sharp · med, with D-210.
- [D-212] First POV frame · **the picture is letterboxed**: 366 × 229 in a box of 366 × 344 at 390 × 844 (brown bands of 57 px above and below), 336 × 314 at 360 × 740 (bands of 42 px), 780 × 410 at 1280 (bands on all four sides, 207 px left and right), for about 110 ms. On short phones the box is as flat as the picture and there is no band · start at the smallest whole scale that covers the box (2x on these two phones, 3x at 1280) · med on desktop, low on phones.
- [D-213] Last zoom step · the "fill" scale is not a whole number on phones (4.69x, 4.31x), so the picture's pixels are uneven for the last 90 ms; at 1280 the last step jumps from 4x to 10x · round the fill up to a whole scale (5x on phones) and spread the steps evenly up to it · low.
- [D-214] Chat arrival · the green cover is only as large as the old stage box, so the chat header and the lower part of the chat appear at once around a green block that fades (`strip-maju-390x844-d3.png`, frame 796) · let the cover span the chat area under the header · low.

### What a human eye must check on a phone
My recordings prove the order, the times and the geometry. They cannot tell how it feels. On a real phone, at normal speed, look at:
1. **The back move after D-210:** does it read as one motion (screen shrinks, she lowers the phone, the view opens)?
2. **The push-in before the POV** (175 to 350 ms): a quick step towards her, or a stutter?
3. **The first POV frame:** does the cut from her face to "what she sees" read at once, or does it look like a different picture popping up?
4. **The arrival in the chat:** does the green flash feel like the phone screen taking over, or like a blink?
5. **Length:** one second forward and 0.7 back, twice per playthrough. Too long on the second viewing?
6. **Tap to skip** with a thumb, anywhere on the screen, at any moment.
7. **An iPhone and a slow Android phone:** dropped frames, and whether the steps keep their rhythm (I measured Chromium on a PC only, with no dropped frame).
8. **Reduced motion switched on in the phone's settings:** a plain cut.
9. There is no sound. A short notification tone with the bubble at 0 ms would help the first beat; that is the owner's call.

### Batch 3 fixes: confirmed (DPR 3)
| Item | Measured (360 × 640 / 390 × 844) |
| --- | --- |
| D-204 tray contents | panel 214 high exactly on the counter scene (top difference 0.0), whole inside the window (ends 241 / 445 px above the fold); the trays do not move |
| D-205 centre tile | **pixel-exact at DPR 3 now**: K05 board 221 / 300, centre picture at (128, 75) / (143, 114), all six pictures 0 differing device pixels; K04 board 202 / 300, all five pictures exact |
| D-206 bar label | "Konfirmasi & kirim kabar" on one line |
| D-207 tender note | under pocket 4 only (pocket 7 has none) |
| D-208 end summary | tray cells by count: full for 4, with documents for 2 and 2. The summary still scrolls 17 px at 360 × 640, as Fullstack notes |
| D-209 office sign | the counter scene equals the stage files without the sign layer, exact |
| Chat photo 2 : 1 | at 1280 × 800 the picture is 480 × 300 (frame 2 px), `image-rendering: pixelated`, 0 of 144,000 device pixels differ from the file drawn at 2x. On phones still 240 × 150, exact |

### Not verified by me
A real phone, WebKit, and any screen other than the three sizes. The short 300 ms version (it cannot occur in a normal playthrough yet). Tap and reduced motion at sizes other than 390 × 844, and a tap during the back move. Short phones (the box is 16 : 10 there; I reason about them, I did not record them). English and Chinese. The other screens of the 00:03:16 and 00:05:29 builds (T-022 in progress). The test suites.

---

## T-022 — review (2026-11-17)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: production build of 00:27:30, unchanged before and after every run. My own server on :4002, started and stopped by me; ports 4000 and 4001 not touched.
Method (run light: one headless Chrome at a time, closed between sizes, below-normal priority, no test suite): read HANDOFF "T-022". Reached the activity from the saved state after K09 (`k09-a2` → `ksim`, one story line with Pak Bima and Pak Darto present, then the activity). Walked every step with every wrong tap at 360 × 640, 390 × 645 and 390 × 844, each at DPR 2 and 3 (Indonesian, 26 states per run), plus English and Chinese at 360 × 640 (25 states each), the path with no wrong tap at 390 × 844 (18 states), one run with motion on, and one at 1280 × 800. In every state I measured the layout and compared each picture, device pixel by device pixel, with the shipped PNG (one art pixel = one block of DPR × DPR), and the four corners of every nine-slice frame. The drag was done three ways: mouse, finger (touch events) and keyboard. I compared the result with my 16-state storyboard and read all 101 new text lines in the three languages. Evidence: `team/evidence/T-022/designer/review/` (`sheet-*.png`, `crop-*.png`, `ukur-*.txt`).

### Verdict: FIX NEEDED, one blocker (D-215: the card cannot be dragged with a finger). Everything else is polish. The art is pixel-exact and nothing scrolls.

### What holds
| Check | Result |
| --- | --- |
| Pictures | 262 picture checks per Indonesian run, at all three sizes and both DPRs: **0 device pixels differ** from the shipped files, except the clip on the end screen, which is half hidden (D-220). Checked: licence front, back, small, ghost and pin, both magnifiers, photocopy, wallet, thumb, truck, tag hole, Satpas tile, ID card, terminal empty and filled, power of attorney, print-out, ticks off and on, four stamps, empty stamp places, the interview-room wall and the counter wall |
| Frames | 64 frame checks per run (truck tag in three states, note, clipboard, speech bubble white and amber, case card): all corners exact |
| Scene and clipboard | scene 336 × 236 / 366 × 236, clipboard 48 (62 on the end screen), instruction one line of 20 px, in every state |
| Nothing scrolls | scroll 0 in all 276 states. Smallest space left under the content: 36 px at 360 × 640, 41 at 390 × 645, 240 at 390 × 844 (Indonesian and Chinese); 23 at 360 × 640 in English (end screen, three-line speech) |
| Text length | Indonesian: longest text 17 words (the note at the counter), every speech line at most two lines. Chinese: longest 36 characters, nothing cut. English: see D-216 |
| Desk | photocopy tapped: amber dashed line on it and the amber line "Fotokopi gampang diedit…"; wallet tapped: Pak Darto speaks, card with thumb appears, stamp ASLI |
| Card | photo and name taps give their own amber lines; the tag tapped before the class box gives a plain hint and is **not** counted as a wrong tap; class box → magnifier; tag → green tag, stamp COCOK; "Balik" shows the back with "Satpas SIM", "Depan" returns |
| Places | office and workshop give their own amber lines; Satpas gets the pin and the gold plate |
| Counter | name and address rows give their own amber lines; NIK row: terminal goes empty → typing (17 ms) → "DATA DITEMUKAN" (324 ms) with motion on; stamp SATPAS; power of attorney shown under the terminal |
| Print-out | mouse drag: the card follows (34 px up in my test), a ghost stays behind, release drops it; three ticks 250 ms apart; three green boxes; stamp SESUAI. Tap on the card, tap on the print-out and Enter on the card do the same |
| End | four stamps, case card with the tampered class in the magnifier and three lines, article name not shown ("pengecualian polis"); then story node `ksim-b` after wrong taps and `ksim-a` after a clean run (both reached through the browser) |
| "Kenapa?" notes | opened in all five steps: 204 wide, 76 to 110 high, inside the scene, 7 to 17 words |
| 1280 × 800 | 366 px column, every picture and frame exact, nothing scrolls |

### Blocker
- [D-215] Step 4, phones · **a finger cannot drag the card.** With touch events the card gets the press and 8 to 20 px of movement, then the browser cancels the gesture (`pointercancel`): the card jumps back to its start, no ghost, no drop. Same result with a slow drag (14 small steps). A finger **tap** on the card still drops it, and the mouse drag works, which is why it passed a desktop check. Cause, measured: the button's computed `touch-action` is `manipulation`, not `none`; the rule `.player-ui button { touch-action: manipulation }` in `player.css` is stronger than `.sim-kartu-seret { touch-action: none }` in `sim.css`. With `touch-action: none` forced on the card as a test style, the same finger drag works: the card follows 50 px, the ghost shows, it drops, three ticks (`ukur-t22p-390x844x2.txt`) · write the rule with more weight, for example `.hp-sim .sim-kartu-seret, .hp-sim .sim-kartu-seret * { touch-action: none; }` · **blocker: this is the one drag in the activity, the bar tells the player "Seret kartu ke cetakan.", and on a phone the card snaps back.** Needs one check on a real phone after the fix.

### Polish
- [D-216] English · two instructions are cut with "…" at 360 px, and the counter note has 30 words (five lines, 127 px high). Final text below · med, text only.
- [D-217] Counter · the three rows on the ID card are 134 × 24, 26 and 22 px, touching each other, and nothing marks them as tappable (the storyboard had a dashed line around each). A thumb that lands one row off counts as a wrong tap and changes the ending line · draw a 1 px dashed cream line around the three rows before the first tap, and the same around the photocopy and the wallet on the desk, as in the storyboard · med.
- [D-218] "Kembali ke cerita" in the head · leaving and coming back starts the activity again at the desk with the wrong-tap count at 0 (I left in step 2 with one wrong tap). Progress is lost, and a player can earn "tanpa ketukan keliru" by leaving and re-entering · Lead decides: keep the count across the visit, or accept · low.
- [D-219] Green "correct" line · on the desk it stays where the wallet was (108 × 76) after the wallet has moved and the card has appeared, so it cuts across both and frames neither. On the card it peeks out at two corners behind the magnifier · put it around the small card on the desk; hide it under the magnifier · low.
- [D-220] End screen, phones · the clip on the clipboard is half hidden under the top edge of the scroll area (about 8 of its 16 rows; whole at 1280) · hide the clip on the end screen, as in the storyboard · low.
- [D-221] Print-out after the drop · the green box around the name ends on the last letter of the name (62 px wide; it needs about 4 px more), and the box around the number loses its bottom line under the scene edge (card at top 122: the box ends at 233 of 232) · name box about 66 wide; drop the card at top 118 · low.
- [D-222] Step 4, keyboard · when the card gets focus with Tab, the scene scrolls 56 px inside itself (the card reaches below the scene, and a hidden-overflow box still scrolls on focus): the print-out moves out of view (`q-4-fokus-360x640-d2.png`). Touch and mouse do not trigger it · `overflow: clip` on `.sim-isi` · low.
- [D-223] 1280 × 800 · the instruction line sits **under** the button, last on the page, and the 366 px column is centred while the title is at the left edge of the 780 px column (207 px apart) (`end-1280x800.png`) · instruction above the scene, as on phones · low (phones first). I did not check whether other activities do the same at 1280.
- [D-224] Stamps (my art, not the build) · the lettering inside the four stamps is hard to read at 1 : 1; "COCOK" and "SATPAS" need a second look (`crop-end-360x640-d3.png`) · I redraw the four 60 × 26 files with cleaner letters, same size and names, no code change · low, Designer.
- Note on the card step covers the class box and "Balik" completely while it is open; "Tutup" is 28 px high. Acceptable: the note must be closed to go on, and it closes with one tap · no change asked.

### English and Chinese
Chinese: accepted as final. Nothing is cut at 360 px, terms are consistent (准驾类别, 半挂卡车, 保单除外责任). Two optional word changes: 办事员 → 工作人员 (`bima.loket`); 授权书 → 委托书 (`bima.satpas`, `kenapa.loket`, `benda.kuasa`).
English: accepted with these final texts.
| Key (`arena.sim.`) | Draft | Final | Why |
| --- | --- | --- | --- |
| `inst.loket` | Tap the number Satpas looks up on the ID card. | **Tap the number Satpas searches by.** | cut at 360 px |
| `inst.cetakan` | Compare the card with the Satpas print-out. | **Compare the card with the print-out.** | cut at 360 px |
| `kenapa.loket` | It is looked up by the NIK on the ID card or family card. It needs the holder’s power of attorney, or a family member named on the family card. | **Searched by NIK, from the ID or family card. Bring the holder’s power of attorney, or a listed relative.** | 30 words → 19 |
| `akhir.umpan` | …This part is done; the claim check goes on. | **Mr Darto’s licence is genuine and fits the truck. Now back to the claim check.** | three lines → two |
| `bima.cocok` | It fits. But a tidy card is not yet a recorded one. Let’s check the record. | **It matches. But a neat card may not be on record. Let’s check.** | reads more naturally |
| `bima.lensa` | B II Umum, evenly printed. … | **B II Umum, cleanly printed. Now compare it with the truck.** | wording |
| `kasus.1` | The driver refused to show the original licence, then admitted it. | **The driver would not show the original licence, then confessed.** | "admitted it" is unclear |
| `kasus.2` | The class was printed differently. At Satpas it was recorded as SIM A. | **The class print looked different. Satpas had it on record as SIM A.** | wording |
| `bilah.meja` | Tap one thing on the table. | **Tap one item on the desk.** | wording |
The other 92 English lines stand as drafted. I measured English at 360 × 640 only; the final texts above are shorter than lines that already fit there, but they were not run in the build.

### Is it "a game, not a quiz"?
Yes, with D-215 fixed. There is no option list anywhere: the player takes the card from a wallet, reads it under a magnifier, matches it to a truck, picks a building on a map, finds a number on an ID card, and lays the card on a print-out, collecting four stamps. A wrong tap costs nothing and gets one kind sentence. The documents look like documents. A player who knows nothing about claims needs two or three taps per step and has done the four checks in the right order. What still feels flat: everything appears at once (wallet → card, magnifier, terminal), and the one physical gesture is the broken drag.
Cheap to add, in order of value:
1. An up arrow between the card and the print-out before the drag, as in the storyboard (one small CSS shape or sprite).
2. Step numbers on the clipboard ("1. Minta asli" … "4. Cocokkan"), current one bold, as in the storyboard; the labels are 10.5 px today.
3. The speaker's name in bold at the start of the speech line ("Pak Bima", "Pak Darto"), as in the storyboard; today only the portrait changes.
4. With motion on: the magnifier and the handed-over card arrive in two hard steps (about 120 ms), like the stamp does. Reduced motion stays a cut.
The summary note is not in the end screen's decision review: I agree with leaving it out, because this node is not a numbered decision.

### Not verified by me
A real phone and WebKit (the finger drag most of all). Sound. English and Chinese at sizes other than 360 × 640. These shipped files were not compared pixel by pixel: the desk tile, the terminal "typing" frame, the speech-bubble tail, Pak Darto's figure on the desk, and the edges (not corners) of the nine-slice frames. The test suites. Whether other activities also restart when left (D-218).

**D-224 delivered (2026-11-17, Designer):** the four stamps are redrawn in `character/aktivitas-ep2-pixel-v1/sim/`, same names and size (60 × 26, one green, indexed): `cap-asli.png` 218 B (was 228), `cap-cocok.png` 225 B (227), `cap-satpas.png` 237 B (244), `cap-sesuai.png` 232 B (250); set 39 files, 24,134 B (was 24,171). Letters are now hand-drawn 6 × 10 with 2 px strokes and are not broken by ink holes; the holes stay on the frame. No other file in the set changed (checked by hash); `BYTE.md` and the sim README are updated. Before and after at 2x: `team/evidence/T-022/designer/cap-v2-strip.png` (top row old, bottom row new). The client copies in `client/src/cerita/seni/aktivitas/sim/` are still the old ones: Fullstack copies the four files and rebuilds, no mapping or CSS change.

---

## T-021 — re-check (2026-11-17)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: 00:27:30, unchanged before and after both runs. Method: read HANDOFF "T-021 FIX". Recorded the forward move once and the back move once per ending at 390 × 844 DPR 3 and at 1280 × 800, with the same recorder as the review (frame log at full speed, film at one eighth speed); tap-to-skip and reduced motion again at 390 × 844. I opened the forward sheet and the back sheet for "puas" at 390 × 844 and a device-resolution crop of the 2x camera frame; the other recordings I judge from the frame logs. Evidence: `team/evidence/T-021/designer/recheck/`.

### Verdict: PASS. D-210 to D-214 are fixed at both sizes, in all eight recordings.

| Item | Measured (390 × 844 / 1280 × 800) |
| --- | --- |
| D-210 camera pulse in the back move | camera values in the back move: 2x from the first frame, then 1x at 550–554 / 549–565 ms. **One change** in each of the six back recordings. No return to 1x between frames |
| D-211 one hard step to 2x | forward: 1x, then 2x at 196 / 196 ms, in one frame; no 1.33x or 1.67x in any frame. The canvas has no transition and stays `pixelated`: figure pixels are hard-edged blocks in the 2x frame (`camera-2x-crop-390x844-d3.png`) |
| D-212 no letterbox | the POV picture covers the box in every frame that shows it (25 forward, 17–18 back, per recording): smallest overhang 51 / 127 px forward, 0 / 143 px back. First forward frame is 2x / 3x |
| D-213 whole-number scales | forward 2, 3, 4, 5 / 3, 4, 5, 6, 7, 8, 9, 10; back 5, 4, 3, 2, 1 / 10, 9, 8, 7, 6, 5, 4, 3. No other value in any frame. The 4x → 10x jump at 1280 is gone (eight steps 53 to 72 ms apart) |
| D-214 full-box cover | the green cover is the whole stage box, 366 × 366 / 780 × 432 (was 366 × 344 / 780 × 410). It fades 100 → 0 % in 200 ms |

| Timing, forward | 390 × 844 | 1280 × 800 |
| --- | --- | --- |
| Arm "reading" and camera 2x | 196 | 196 |
| POV from | 359 | 357 |
| Screen covers the box | 700 | 770 |
| Chat mounted | 810 | 806 |
| Layer gone, done | 1,010 | 1,023 |
| Timing, back (three endings) | 390 × 844 | 1280 × 800 |
| --- | --- | --- |
| Last POV step | 244–259 | 277–280 |
| Arm "lifting" | 424–443 | 439–442 |
| Arms gone, camera 1x | 550–554 | 549–565 |
| Done | 714–717 | 709–711 |

Unchanged and still good: one stage box and one page size through every recording, the layer ends 0 to 0.1 px from the dialogue card, 39 to 56 frames about 18 ms apart with no gap over 20 ms, tap during the move ends it 39 ms later in the chat, reduced motion is a plain cut in both directions.
One remark, no change asked: on a phone the cover is the 366 × 366 square under the chat header; the chat area below it (from 487 px down) shows at once. The chat is still empty at that moment, so nothing pops in beside the cover. Whether it reads as "the phone screen takes over" is point 4 of the list for the human eye in the review, which still stands in full: no recording can judge the feel.

Not verified by me: a real phone, WebKit, short phones, 360 × 740 after the fix (Fullstack measured it), English and Chinese, the test suites.

---

## T-022 — re-check (2026-11-17)

Reviewer: Designer · Folder: C:\Users\User\Desktop\rksgm-episode2 · No source edits, no commit, BOARD.md not touched.
Build: production build of 01:17:38, unchanged before and after every run. My own server on :4002, started and stopped by me; ports 4000 and 4001 not touched.
Method (run light: one headless Chrome at a time, closed between sizes, below-normal priority, no test suite): read HANDOFF "T-022 Fix". Same tools as the review. Finger drag with Chromium touch events at 390 × 645 and 360 × 640 (DPR 2), six cases each. Full walk with every wrong tap at 360 × 640 and 390 × 645, DPR 2 and 3 (Indonesian, 26 states per run), English once at 360 × 640 (25 states) and one walk at 1280 × 800 for D-223, with every picture and frame corner compared with the shipped PNGs as before. Keyboard focus and leave-and-return at 360 × 640. I opened two device-resolution crop sheets (desk before and after, card with magnifier, counter; print-out after the drop, end screen), the English sheet with the counter, print-out and end, the finger-drag capture at 360 × 640 and the counter at 1280. Evidence: `team/evidence/T-022/designer/recheck/`.

### Verdict: PASS. The blocker D-215 is fixed, and D-216, D-219 to D-224 are done as asked. One new polish item, D-225: the hint line of D-217 is too faint on the ID card (my own colour choice).

### D-215, finger drag (same result at 390 × 645 and 360 × 640)
Computed `touch-action` is now `none` on the card and on the picture inside it (was `manipulation`).
| Case | Result |
| --- | --- |
| 50 px up in 4 steps | the card follows the full 50 px (top 136 → 86), ghost shown, **no `pointercancel`**; on lift it drops to top 118, three ticks, step done |
| 48 px up in 14 small steps | follows 48 px, 14 move events, no cancel; drops, three ticks |
| Diagonal, 30 px right and 40 px up | follows 40 px up, no cancel; drops |
| 16 px up (under the 24 px threshold) | follows 16 px; on lift the card returns to 136, no drop, no tick |
| 34 px down | the card stays at 136; page and scroll area do not move (scroll 0) |
| Tap on the card | drops, three ticks |
- Mouse drag (card 34 px up, ghost, drop at 118, three ticks) still works at every size walked; Enter on the card still drops it (360 × 640).
- Reply-sheet handle in the chat (the second rule Fullstack made heavier): computed `touch-action: none`, 96 × 44; a finger drag of 50 px down gives four move events and no cancel, and the sheet closes on lift. The sheet did not move while the finger was down (its top stayed at 159 / 135 px); I did not look into whether it is meant to follow.
- This is Chromium with touch events from the debug protocol, the same method that showed the failure. A real phone and WebKit are still not verified.

### The other items
| Item | Result | Measured |
| --- | --- | --- |
| D-216 English | done | all nine final texts are in `teks.en.ts` word for word. At 360 × 640: no instruction is cut ("Tap the number Satpas searches by.", "Compare the card with the print-out." on one line of 20 px); the counter note is 19 words, four lines, 110 px high (was 30 words, 127 px); the end speech is two lines; smallest space left 36 px (was 23) |
| D-217 hint lines | done as asked; **see D-225** | 1 px dashed line on the photocopy and the wallet until the desk is done, and on the three ID-card rows until the counter is done; the tapped wrong row shows the amber line instead |
| D-218 leave and return | unchanged, accepted by the Lead | back at the desk with the wrong-tap count at 0 |
| D-219 green line | done | desk: 124 × 80 around the small card (2 px clear on each side); card: no green line behind the magnifier (0 device pixels of the line colour in the screenshot at DPR 3; 882 in the review build), only the dark class box of the card itself shows |
| D-220 clip on the end screen | done | hidden at every size; the end screen has six pictures, all exact |
| D-221 print-out after the drop | done | card at top 118; boxes 80 × 48, 66 × 26 and 130 × 23, all inside the scene (the lowest ends at 229 of 232); the name is whole inside its box |
| D-222 scene scroll on focus | done | `overflow: clip`; with the card focused the scene's scroll stays 0 (was 56) |
| D-223 1280 × 800 | done | instruction above the scene; activity column and title both start at 250 px |
| D-224 stamps | done | the four client files are byte-identical to my redrawn ones; in the running build every stamp is pixel-exact at DPR 2 and 3 at both sizes, and ASLI, COCOK, SATPAS and SESUAI read clearly at 1 : 1 (`crop-printout-end-stamps-360x640-d3.png`) |

Whole walk on this build: 261 picture checks and 64 frame checks per Indonesian run, **0 device pixels differ** in all four runs, in English and at 1280; nothing scrolls in any state; smallest space left 36 px at 360 × 640 and 41 px at 390 × 645; wrong taps still end on `ksim-b`.

### New, polish
- [D-225] Counter, the hint line of D-217 · on the ID card the cream line (255, 243, 217) lies on light blue paper (207, 227, 238): contrast **1.20 : 1**, so at 1 : 1 the three rows still look unmarked (`counter-1280x800.png`; at 3x one can just see it in `crop-desk-card-counter-360x640-d3.png`). On the desk the same line has 2.0 to 2.8 : 1 against the wood and reads well. The colour was my instruction, so this is my miss, not Fullstack's · on the counter step only, draw the line in the card's dark blue `#2f4a6b` (6.9 : 1 on that paper), still 1 px dashed · low to med, one CSS value; not a blocker.

### Not verified by me
A real phone and WebKit (the finger drag most of all). The clean path to `ksim-a`, the motion-on timings, Chinese, and 390 × 844 on this build (all passed on the build of 00:27:30). English at sizes other than 360 × 640. The same files as in the review were not compared pixel by pixel (desk tile, terminal "typing" frame, bubble tail, Pak Darto's figure, frame edges). The test suites. The four cheap additions from the review (drag arrow, step numbers, speaker name, two-step arrival) were not part of this fix and are still only ideas.
