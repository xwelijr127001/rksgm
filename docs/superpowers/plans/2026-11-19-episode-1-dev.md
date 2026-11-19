# Episode 1 Dev ("Kenalan Raksa") Implementation Plan

> **For agentic workers:** executed by the RAKSA Orca team cards (Fullstack + Designer), dispatched by the Lead. Steps use checkbox
> (`- [ ]`) syntax. Owner rule overrides the usual TDD: NO test runs, NO new tests, NO e2e, NO browser runs; gate = `npm run typecheck`
> + rebuild `client/dist`; workers do not commit; the Lead commits, pushes and deploys.

**Goal:** a 5-minute walk-up cut of the truck case (4 decisions, the SIM check, a new dashcam replay, an ID-card ending) as a separate
episode "Episode 1 Dev", leaving the full Episode 1 untouched.

**Architecture:** a new episode module `auto-2-dev` registered beside `auto-2`, reusing `TEKS_AUTO_2`, the auto-2 art and the existing
phone player (`antarmuka: 'hp'`); one new arena pattern `dashcam`; an opt-in large-text mode and a dev ending, both switched on only by
the new episode's config.

**Tech Stack:** React + TypeScript (client/src), existing story engine (`cerita/tipe.ts`, `cerita/mesin`), phone player `cerita/hp`.

**Spec:** `docs/superpowers/specs/2026-11-19-episode-1-dev-design.md`

## Global Constraints
- Full Episode 1 (`client/src/cerita/episode/auto-2/*`) behaviour and text unchanged; shared components only get opt-in props.
- About 5 minutes; tap only; body text >= 18 px on phones, in-scene labels >= 14 px, tap targets >= 48 px; one screen per step.
- No name before playing; name is optional at the ending (default display "Tamu").
- Pixel style, Raksa palette (character/palet-raksa-v1/PALET.md); id/en/zh for every new string.
- Mood: start 30, clamp 0-100; endings Puas >= 70, Selesai dengan catatan 45-69, Kurang puas < 45 (same as Episode 1).

## Review Focus
- A guest closes the tab mid-way and reopens `/cerita/kenalan`: it must restart cleanly (or resume) without the full-episode save
  leaking in (separate save key `auto-2-dev`).
- Tapping the dashcam before the replay finishes: taps are ignored until the freeze frame; "Putar lagi" always works.
- Reduced motion on: the dashcam shows a 3-frame step sequence instead of animation, still answerable.
- Small phone 360x640: every step fits without scroll (dashcam scene scales; choices max 3, 2 lines each).
- Empty or very long name at the ending: empty -> "Tamu"; > 24 chars trimmed; card still fits.

---

### Task 1 (Fullstack): episode `auto-2-dev`, route, picker card, flow, large text, ending

**Files:**
- Create: `client/src/cerita/episode/auto-2-dev/episode.ts`, `client/src/cerita/episode/auto-2-dev/teks.ts` (+ `teks.id.ts`,
  `teks.en.ts`, `teks.zh.ts` only for NEW keys; reuse `TEKS_AUTO_2` keys for reused lines)
- Modify: `client/src/cerita/episode/index.ts` (register after `EPISODE_AUTO_2`), the router in `client/src/App.tsx`
  (`/cerita/kenalan` -> `/cerita/auto-2-dev`), the episode picker card list (T-037 picker), `client/src/cerita/tipe.ts` (opt-in fields),
  `client/src/cerita/hp/PemainHP.tsx` + `hp.css` (large text), the end screen `client/src/cerita/ui/LayarAkhir.tsx` (dev ending)

**Interfaces:**
- Produces: `EPISODE_AUTO_2_DEV: Episode` with `id: 'auto-2-dev'`, `antarmuka: 'hp'`, `tampilan?: { teksBesar: true; akhirKenalan: true }`.
- Produces for Task 2: node `{ id: 'kdash', jenis: 'aktivitas', aktivitas: 'dashcam', langsung: true }` whose arena konfig is
  `{ pola: 'dashcam'; benda: { id: 'mobil' | 'truk' | 'truk-kecil' }[]; tepat: 'mobil'; bersih: string; ragu: string }`
  (alternative ids `bersih` = picked `mobil` first try, `ragu` = otherwise), consumed by `ArenaPolaDashcam`.
- [ ] Step 1: types: add `pola: 'dashcam'` to `KonfigArena` and `tampilan?: { teksBesar?: boolean; akhirKenalan?: boolean }` to `Episode`.
- [ ] Step 2: write `episode.ts`: nodes pembuka (Miss Raksa, 2 lines reused from auto-2 opening) -> `k1` (Babak 1, 3 options: A tepat +10,
  C keliru -6, E kurang 0) -> `k6` (Babak 6, 3 options: B tepat +14, A keliru -10, D keliru -10) -> `ksim` (reuse auto-2 SIM arena konfig;
  bersih +8, ragu 0) -> `kdash` (dashcam; bersih +8, ragu -4) -> `k14` (Babak 14, 3 options: C tepat +14, A keliru -10, D kurang 0) ->
  cabang by status -> 3 akhir nodes reusing auto-2 ending lines. Reaction lines reuse the auto-2 consequence keys.
- [ ] Step 3: new text keys (id/en/zh): picker title "Episode 1 Dev · Kenalan Raksa", tag "5 menit", how-to card lines for SIM and
  dashcam, dashcam prompt "Ketuk kendaraan yang memicu kejadian.", "Putar lagi", feedback lines (tepat: the car cut in from lane 3 to
  lane 2; still we check signs and witnesses; keliru: replay hint), ending line "Ini kasus nyata yang pernah Raksa tangani.", buttons
  "Main versi lengkap" (-> `/cerita/auto-2`) and "Kenal Raksa lebih jauh" (https://www.raksaonline.com/, new tab).
- [ ] Step 4: register + route + picker card (playable, placed first, "5 menit" chip; full Episode 1 card unchanged).
- [ ] Step 5: large text: when `ep.tampilan?.teksBesar`, add a root class that sets body 18 px, choice text 18 px, labels >= 14 px, tap
  targets >= 48 px; fit each step at 360x640 / 390x700 by calculation.
- [ ] Step 6: ending: when `ep.tampilan?.akhirKenalan`, the end screen shows final mood + Pak Hendra line, the real-case line, an optional
  name field (max 24, empty -> "Tamu") that fills the existing `KartuPetugas` (T-052), and the two buttons; skip the name screen at start
  for this episode only; save key `auto-2-dev`.
- [ ] Step 7: `npm run typecheck` -> 0 errors; rebuild client/dist. HANDOFF "## T-064".

### Task 2 (Designer): dashcam replay arena `ArenaPolaDashcam`

**Files:**
- Create: `client/src/cerita/hp/arena/ArenaDashcam.tsx`, `client/src/cerita/hp/arena/dashcam.css`, pixel art under
  `client/src/cerita/seni/piksel/` (`dashcam-*.png` or grid ts) + sources in `character/dashcam-t065/`
- Modify: `client/src/cerita/hp/arena/Arena.tsx` (one branch `konfig.pola === 'dashcam' ? <ArenaPolaDashcam .../>`), `Pandu.tsx` coach card
  (how-to for `dashcam`, and the SIM how-to card when the episode is `auto-2-dev`)

**Interfaces:**
- Consumes: Task 1 konfig `{ pola: 'dashcam'; benda; tepat; bersih; ragu }`, the standard `PropsPola` (`ep, konfig, jawaban, ubah, tx,
  labelKirim, onKirim`) like `ArenaPolaSim`, and `tetapkan(jawaban, langkah, benda, alt)` to record the outcome.
- [ ] Step 1: art: toll road from the K08 lane scene style (4 lanes, signs), the Episode 1 truck (crashed only at the end), a small
  car, a small truck stopped on the shoulder; pixel density k=2 like the event cases.
- [ ] Step 2: replay ~6 s: small car moves from lane 3 into lane 2 in front of the truck, truck swerves left, hits the barrier and
  the stopped small truck; freeze frame with the three vehicles as tap targets (>= 48 px, pixel ring on focus); taps ignored while
  playing; "Putar lagi" key; reduced motion = 3 still frames with "Lanjut".
- [ ] Step 3: tap result: `mobil` -> tepat feedback, record `bersih`; other -> short hint + replay, a second wrong tap records `ragu`
  and shows the explanation; then the normal Kirim/next flow.
- [ ] Step 4: coach card "Tonton rekamannya, lalu ketuk penyebabnya" (5 s, once) and a SIM how-to card for `auto-2-dev`.
- [ ] Step 5: typecheck 0; rebuild client/dist; preview PNG of freeze frame; HANDOFF "## T-065".
