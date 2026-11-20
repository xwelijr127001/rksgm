# Episode 1 · Investigator (pilot) - design

Date: 2026-11-20 · Owner: "lets do it ... episode 1 - investigator ... current eps 1 stay still. lets go team" · Concept doc (PM):
https://claude.ai/artifact/JMni2AJUweF1qCCdpP6FYM · Codex review: team/REVIEW.md "Investigator concept review (2026-11-20)".

## Why
Senior advisor: great as internal training; external audiences need a reward curve (exciting story, accumulating points), Ace
Attorney / Professor Layton style with an insurance investigator. Pilot = one 5-minute case to test the loop with 10 unaided guests.

## Goals / non-goals / anti-goals
- Goals: ~5 min, tap only, big text (reuse Dev's teksBesar), one "KEBERATAN!" moment, verdict, respectful message, 100-pt score,
  grade S/A/B/C, stamp + rank saved on the device, "Kasus berikutnya" button (shows "segera hadir" for now).
- Non-goals: map, extra rooms, online scores, cases 2-4, accounts.
- Anti-goals: any change to the full Episode 1 or Episode 1 Dev; accusing the customer; hearts or timers; a guessy confront.

## The case (Lead calls; fiction on top of Skenario Auto 01)
Truck trailer, toll road. The twist PROTECTS the honest customer: the toll officer's written note says the truck was in LANE 3
(banned for trucks), so the claim would look excluded. The player proves with the dashcam that the truck was in LANE 2.
1. Opener (Miss Raksa, title card "KASUS #1 · Truk di Tol"): frozen dashcam, "Catatan petugas tol bilang truk di lajur 3. Benar?"
2. Talk: Pak Darto (driver): "Saya di lajur 2, mobil kecil tiba-tiba motong." [pin] · Petugas tol: "Di catatan saya, truknya di
   lajur 3." [pin] (two short chats, 2-3 lines each, statements pinnable to the notebook).
3. Evidence (reuse arenas): dashcam replay gives card "Rekaman dashcam: truk di lajur 2"; road-sign photo gives card "Rambu: truk
   dilarang di lajur 3 dan 4"; SIM check (short) gives card "SIM B II Umum asli".
4. KEBERATAN: pinned statement = toll officer "truk di lajur 3"; choose 1 of the 3 cards. Correct = dashcam. Miss 1: highlight the
   lane-number area in the card thumbnail + hint; miss 2: Miss Raksa walks through it. Then the officer revises: "Oh, saya salah
   catat lajurnya. Saya perbaiki laporannya."
5. Verdict: Klaim layak dijamin (correct, 30) · Butuh bukti tambahan (15) · Ada masalah pertanggungan (0), each with a short why.
6. Message to Pak Hendra: 3 choices (clear + respectful + next step = 30; correct but cold = 15; promise a date / overpromise = 0).
7. Result: grade, points by part (Bukti 40: first try 40, second 25, guided 10), stamp on the officer card, rank Investigator Muda ->
   Investigator (1 stamp) -> Senior (3) -> Kepala (4); "Main lagi" (best score kept) and "Kasus berikutnya" (segera hadir).

## Placement
New episode id `auto-2-inv`, route `/cerita/investigator`, picker card "Episode 1 · Investigator" behind env RAKSA_INVESTIGATOR
(default off, like RAKSA_EP1_DEV); the direct link always works. Progress saved per device under its own key; "Tamu baru" resets it.
id/en/zh. Pixel style; Claude Designer art.
