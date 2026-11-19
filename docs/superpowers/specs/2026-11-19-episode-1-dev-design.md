# Episode 1 Dev ("Kenalan Raksa") - short design

Date: 2026-11-19 · Owner approved approach A ("go ahead") · Status: design, awaiting owner OK on the new incident moment.

## Why
Episode 1 (truck trailer case, `client/src/cerita/episode/auto-2`) is a full 15-decision course (~20-30 min, 6 mini-games). The real
audience at Raksa events is random first-timers: potential investors, guests, agents, partner-workshop staff during a presentation or
while waiting, on their own phone, with nobody explaining. They need a 5-minute walk-up version that is understandable without help and
shows Raksa well.

## Goals / non-goals / anti-goals
- Goals: about 5 minutes; tap only; bigger text; understandable without help; ends with a souvenir (ID card) and a link to Raksa.
- Non-goals: new story, new case, scoring/leaderboard for rooms, replacing the full episode.
- Anti-goals: the full Episode 1 changes in any way; a guest has to type anything before playing; a moment where the right answer is
  obvious (owner: the lane question "is just choosing the obvious").

## Approaches (picked: A)
- A (picked) separate "Episode 1 Dev" cut of the same case: 4 decisions + 1 mini-game + 1 new incident moment, reuses art/text.
- B fast mode inside the full episode (auto-play minor rounds): still long, skipped content visible.
- C readability fixes only: still 20-30 minutes.

## Design (owner-approved flow, Lead calls marked)
Entry: a new picker card "Episode 1 Dev · Kenalan Raksa · 5 menit" next to Episode 1 (Lead call: own route/id `auto-2-dev`, own QR-able
URL `/cerita/kenalan`); no name at start.
1. Opening (~15 s): Miss Raksa sets the scene; Pak Hendra's mood meter starts at Cemas.
2. Decision 1 - first WhatsApp reply (Babak 1), 3 choices (Lead call: the right one + the 2 most instructive wrong ones from the script).
3. Decision 2 - "Kapan keputusannya?" (Babak 6), 3 choices.
4. Mini-game - "Periksa SIM Pak Darto" (existing ArenaSim, manual row matching from T-049), with a 5-second how-to card.
5. NEW incident moment replacing the lane question (Lead proposal, owner to confirm): "Rekaman dashcam" - a ~6-second pixel replay on
   the toll road (small car cuts from lane 3 into lane 2, the truck swerves left into the barrier). Then: "Ketuk kendaraan yang memicu
   kejadian." The player taps a vehicle in the frozen last frame (truck / small car / stopped small truck); a "Putar lagi" button
   replays. Feedback explains: the cause was the car cutting in, and why we still check the signs and witnesses. Easy (watch, tap),
   not obvious from text, and it teaches "a clear accident still has to be proven".
6. Decision 3 - the customer disagrees with the payout (Babak 14), 3 choices.
7. Ending (~30 s): final mood (Puas / Selesai dengan catatan / Kurang puas) + Pak Hendra's line; Miss Raksa: "Ini kasus nyata yang
   pernah Raksa tangani."; optional name -> Petugas Klaim Raksa ID card (T-052) to screenshot; buttons "Main versi lengkap" (full
   Episode 1) and "Kenal Raksa lebih jauh" (raksaonline.com).
Readability: body >= 18 px on phones, in-scene labels >= 14 px, tap targets >= 48 px, one screen per step, leave any time.
Languages id/en/zh (Lead call: same keys reused where the text is identical).

## Constraints
No change to the full Episode 1 files' behaviour (shared components may get opt-in props only). Pixel style and Raksa palette.
Owner rules: no e2e/test runs; owner checks on the phone; Lead deploys.

## Left to the builder
Mood-meter numbers for 4 decisions (keep the script's +/- scale), exact 3-choice subsets, replay timing, how-to card wording.
