# REVIEW (Codex -> Lead)

## T-002..T-004 - plan review (2026-11-15)

Reviewed: team/specs/2026-11-15-homepage.md, BOARD.md, and current client implementation. Static review only; no tests or browser checks run.

- Verdict: needs revision. T-002 is straightforward after correcting validation; T-003/T-004 need the constraints below before implementation.

### Risks / things that could break

- [R-01] T-003/T-004: JoinGame is shared with /cerita (client/src/pages/Cerita.tsx:61), and its form/button use lp-* classes (components/JoinGame.tsx). Global changes to those classes would also restyle/reflow the story hub. Scope homepage overrides under .lp-halaman and include a /cerita regression check. Mode Cerita's Mulai is a span inside a whole-card Link (pages/Landing.tsx); retain that single accessible link, without nesting a button.
- [R-02] T-003: the illustration and all left-column content are separate siblings (pages/Landing.tsx:76). CSS order alone leaves the greeting last in reading order. Specify a single greeting in the desired DOM order and use desktop grid placement to preserve the desktop composition. Define 701-900px behavior explicitly; keep the portrait reorder from pushing Join Game below the fold in short landscape viewports.
- [R-03] T-004: the suggested story directories are not a lightweight SVG/CSS pixel-art component library. ui/latar/PanggungLatar.tsx uses episode/composition inputs and smooth illustrations; ui/panggung/sumberPiksel.ts eagerly discovers and loads room/prop PNGs when initialized. Importing stage machinery can increase initial requests even if total build growth stays small. Select exact assets/imports and measure initial homepage JS/CSS and image requests, with a stated raw or gzip basis for the 30 KB budget.
- [R-04] T-004: the claimed existing hero Raki fallback is inaccurate. art/WelcomeArt.tsx hides Miss Raksa's portrait/name when inactive and retains the slogan; the Raki fallback exists in Landing.tsx's ModeCerita card. A Raki hero is new behavior: specify it explicitly and verify both hero and card with the flag disabled.

### Missing / oversized scope

- [R-05] T-002 acceptance says npm test in client, but client/package.json has no test script. Use npm run test:client from the repository root; it already includes i18n/terjemahan.test.ts. Keep the title search literal and limited to the old title variants, covering both languages in cerita/uji/episodeUji.ts. Preserve the pending PIC note.
- [R-06] T-003 acceptance alternates between the code field and all of Join Game being visible. Require the complete input and Masuk action at 360x740, in all three languages. Count the header, greeting, margins and fixed legacy-event banner in the height budget, not only the illustration. Include profile present/absent, suggested-code focus from the banner, and one desktop check. Existing e2e passing alone does not establish these layout requirements.
- [R-07] T-004: motion acceptance should cover the waving sprite and optional CTA pulse as well as entrance animation. Follow the existing reduced-motion rule with the explicit data-gerak="penuh" override (player.css:198); check system reduce with override off/on. Avoid applying a blanket media rule that disables the user's explicit override.

### Simpler / cheaper alternative

Reuse game/KarakterTokoh.tsx's existing SpriteTokoh with lambai for the waving pixel Miss Raksa, plus one decorative background and the existing greeting markup. This already provides the sprite and DPR-aware sizing; do not mount a story stage or import its bulk loader for the homepage. Scope CTA changes to homepage selectors and retain existing navigation/form behavior. Keep the three separate tasks and approval order in the plan; no server or gameplay changes are needed for the layout/hero work.

## Revision 2 re-review (2026-11-15)

Verdict: OK with notes. Revision 2 addresses R-01 through R-07 sufficiently for implementation. Static comparison against client code; no runtime validation claimed.

### Risks / remaining notes

- T-004 sizing: game/tokoh.ts:148 enforces a minimum sprite scale. Miss Raksa remains about 184 CSS px tall at integer DPR even when a smaller tinggi is requested. The T-003 phone cap is only 144px at 360px width. Designer must specify a cropped decorative scene viewport, with the greeting outside its clipping area, or another local composition that meets the fold budget. Do not change the shared sprite sizing to fit the landing. Hiding the decorative illustration in short landscape is the simpler permitted option. Validate DPR 1, 2 and 3.
- T-004 motion: the sample .lp-hero selector cannot reach CTAs outside the hero. Apply the same preference condition to homepage CTA selectors too, including any pseudo-elements and animated Raki descendants. The toggle is hidden when system reduce is off (components/TombolGerak.tsx); use the persisted preference or supported ?gerak=penuh / ?gerak=ikut parameters for those matrix cases.

### Missing / scope corrections

- T-002: pages/Cerita.tsx's hub header renders a portrait and hub copy, not Miss Raksa's name/title. Treat /cerita as a regression check; verify the translated title on the homepage and episode cast/title surfaces that actually render it. Do not add a new hub title just to satisfy that acceptance sentence.
- T-004: record gzip bytes using actual compressed output or verified Content-Encoding, not an uncompressed preview Network transfer total. Keep the separate initial image-request comparison.

### Simpler / cheaper alternative

Retain the proposed SpriteTokoh plus one decorative background. Use a locally clipped illustration viewport and the existing greeting in normal flow; preserve shared components and their sizing rules.

### Per-task verdict / dispatch readiness

- T-002: GO - OK with the existing-surface acceptance correction above.
- T-003: GO after T-002 acceptance, starting with the planned Designer specification. Document whether the height cap covers illustration only or the full hero; always budget the greeting separately in the fold check.
- T-004: GO after T-003 acceptance, starting with the planned Designer specification. Incorporate the sprite-size, CTA-motion and gzip-measurement notes above.

These are plan-review approvals, not implementation sign-off. No tasks dispatched or reassigned; BOARD and spec unchanged.

## T-003 code review (2026-11-15)

Verdict: OK with notes. Findings: 0 high / 0 med / 1 low (validation gap, not a confirmed code defect).

- [R-08] team/HANDOFF.md:52 · The required live legacy-banner case remains unverified; the general e2e log does not establish banner overlap or Gabung fill/focus behavior. · Before task acceptance, record the real open-room checks at 360x740 and 375x667: input and Masuk unobscured, Gabung fills the code and focuses Masuk. · severity: low.

Reviewed the requested HEAD diff and isolated T-003 against team/evidence/T-003/base. Changes match D-01..D-14 and N-1/N-2: one greeting first in DOM, explicit desktop grid cells, phone-only capped illustration, greeting outside clipping, short-screen hides and scoped form overrides. No introduced behavior changes or debug code found.

Specific checks: .lp-halaman.alur-ada-spanduk correctly matches PlayerShell's same-element classes; its height/width condition matches D-04(c). The absolute 1px clipped intro remains available to screen readers without contributing to normal layout. The SVG's definite frame height, auto width and matching 560/444 aspect ratio preserve its proportions. .player-ui.lp-halaman .lp-join-kode outranks the existing two-class selector and cannot match the /cerita shell. Shared JoinGame behavior and ModeCerita link markup are unchanged from the baseline.

The .lp-kota-bingkai wrapper is a sound T-004 phone sprite viewport: overflow is clipped at the frame, with figcaption outside it. T-004 must position/crop its taller sprite locally and supply any desktop/tablet scene sizing; this does not require changing shared sprite scale.

Evidence: inspected after-ukur.json and the successful e2e log; independently verified matching SHA256 hashes for the supplied before/after desktop and /cerita screenshots. The handoff reports 724 passing client tests. No new browser run or test execution performed in this review; live banner and screen-reader acceptance remain for the planned review/QA checks. Only REVIEW.md updated; BOARD and code untouched.

## T-004 code review (2026-11-15)

Verdict: OK with notes. Findings: 0 high / 0 med / 2 low. No confirmed functional regression.

- [R-09] team/HANDOFF.md:101 · Image-request equality was measured on the dev client, while the parent spec requires production-build initial-load evidence. Gzip evidence itself is valid. · Record the cache-disabled image list from production preview and compare it with the baseline before closing the budget acceptance. · severity: low.
- [R-10] client/src/player.css:354 · The reduced-motion list covers descendant pseudo-elements but omits the frame's own ::before/::after, despite D-30 promising all hero pseudo-elements. No such animated frame pseudo-element exists today, so this is a coverage gap rather than a current motion bug. · Add .lp-kota-bingkai::before and ::after under the same preference guard. · severity: low.

Reviewed the HEAD diff, isolated T-004 against team/evidence/T-004/base, and checked D-21..D-35, hero-art source and N-1/N-3/N-5. Landing.tsx and shared/brand.ts match their pre-task snapshots by SHA256; shared tokoh.ts/KarakterTokoh.tsx have no HEAD diff. Greeting copy and the single ModeCerita Link/aria are unchanged; no forbidden stage imports or debug code introduced.

N-1/rendering: crop is local to the positioned frame/counter; greeting remains outside. SVG shapeRendering=crispEdges and inherited sprite image-rendering:pixelated are appropriate. Desktop scale(2) doubles the integer device-pixel scale without changing shared sizing or conflicting with the sprite's background-position animation. It does not guarantee device-grid-aligned placement at fractional zoom; that remains the documented visual check. Spot-checked clouds (44,14,20,4), tower (262,66,66,100), counter (-10,20,440,34), folder and stepped-disc generator against the art file: geometry agrees.

Motion/fallback: frame, sprite/Raki descendants and both CTAs honor the data-gerak override. animation:none removes the entrance keyframe opacity rather than leaving opacity:0; normal opacity is 1. The conditional renders Raki directly when inactive, retaining the fixed frame and slogan-only bubble. T-003 hide rules follow the new block and still win; /cerita selectors are unaffected. The card grid/type adjustments match D-28/D-29.

Evidence: build-before/after gzip columns confirm approximately +0.42 KB across the reported chunks, below 30 KB; supplied image lists report no added requests. Verified identical SHA256 hashes for before/after /cerita screenshots, inspected measurement JSON and e2e log (0 failures / 0 console-http issues). Handoff reports 724 passing client tests. Static/evidence review only: no new browser or test run. Only REVIEW.md updated; BOARD and source unchanged.
