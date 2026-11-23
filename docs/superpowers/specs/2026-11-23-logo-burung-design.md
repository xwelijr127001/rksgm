# Owl logo replaces the "RAKSA | GAME" wordmark · 23 November 2026

**Intent.** The owner supplied the official owl logo (Asuransi Raksa · Since 1975 · owl with headset and controller · RAKSA GAME)
and wants it to replace the text wordmark "RAKSA | GAME" on every screen, without making it bigger, so all layouts and art stay put.

**Goals.** One logo everywhere the wordmark shows today (player header, Episode 1/2, host, projector, staff), through the existing
`BRAND.logoPath` slot in `shared/brand.ts` / `components/Merek.tsx`. Browser tab icon and home-screen icon become the owl head.
**Non-goals.** No change to page layouts, header heights, Miss Raksa or any game art; no new mascot role in the story.
**Anti-goals.** A logo that grows the header, pushes content (breaks the no-scroll screens), or is unreadable at header size.

**Approaches.** (a) Drop the tall lockup into the slot as is: at 40 px high the text is unreadable. (b) Make a horizontal header
lockup from the same artwork: owl head left, "RAKSA GAME" right, transparent background, light + dark variants, same footprint as
the current wordmark (max 40 px high, 150 px wide; larger `mrk-besar` on the projector). The full tall lockup is kept as a source
asset. **Lead's call: (b)**, because the owner asked that it not get bigger and every asset stay still.

**Left to the builder.** Exact crop, whether "Asuransi Raksa" fits at header size (drop it if unreadable), pixel snapping of the
owl so it sits next to pixel art, favicon sizes.
