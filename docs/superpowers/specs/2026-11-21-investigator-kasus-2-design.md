# Investigator · Kasus 2 "Malam di Jalan Melati": design

Date: 2026-11-21 · Owner: "can you also build a kasus 2 ... dont forget to ask codex for review" · Codex concept review:
team/REVIEW.md "Kasus 2 concept review (2026-11-21)" (Option A with changes; all changes adopted below). Builds on
docs/superpowers/specs/2026-11-20-episode-1-investigator-design.md (case 1, live at /cerita/investigator).

## Why
Senior advisor: external guests need a reward curve (points that add up across cases) and the "fraud or not" judgement of a real
investigator. Case 1 protects an honest customer by correcting an officer. Case 2 earns trust differently: the guest finds that the
car was carrying a paying passenger, explains an unwelcome decision to the customer with respect, and gives him a real next step.
Lesson: the vehicle's use must match the policy; the investigator is fair in both directions and never assumes intent.

## Goals / non-goals / anti-goals
- Goals: ~5 min, same loop and UI as case 1, ONE substantive investigation (the timeline), scores add up with case 1 (best of 200,
  rank), id/en/zh, big text, 360x640 without page scroll, no hearts or timers, a miss never blocks progress.
- Non-goals: case 3 (labelled preview text only), online scores, a map, new music (reuse inv-* tracks).
- Anti-goals: calling the customer a liar or fraudster, shame poses, sob-story confessions, judging intent; any real ride-hailing
  brand/logo/colours (fictional generic app); legal wording we cannot back (all policy wording marked [konfirmasi PIC]); any
  change to case 1's flow, the full Episode 1 or Episode 1 Dev (case 1 ids, flags and saves stay valid).

## The case (final)
Private MPV, policy use PRIBADI, no commercial-use extension on the incident date. Night, Jl. Melati: a motorbike clips the
front-left bumper at 21:18 (time from the incident form). Customer Pak Yusuf (40s, polite, tired) claims for the bumper.
1. Title "KASUS #2 · Malam di Jalan Melati". Miss Raksa (magnifier) shows the surveyor's interior photo: phone on a dashboard
   mount with an app glowing, water bottles on the back seat. The photo is FILED as card "Foto interior" (no tap activity).
   Hunch (unscored): "Malam itu mobil ini dipakai untuk apa?" Antar keluarga / Antar penumpang / Belum tahu. Revisited after the
   timeline ("Tebakan awalmu: ...").
2. Statements (pinned):
   - Pak Yusuf: "Malam itu saya cuma antar keluarga pulang." [pin; the statement we confront]
   - Mas Agus, motorbike rider (witness, helmet in hand): "Sesudah benturan, ada penumpang turun dari pintu belakang, lalu pergi
     jalan kaki." [pin]
3. Evidence:
   - TIMELINE (the one real investigation, ~4 taps): Pak Yusuf willingly shares ONE trip receipt (passenger name and addresses
     hidden). The guest sees the receipt and the incident form side by side and places 21:18 on the trip timeline: 21:05 penumpang
     dijemput · 21:18 benturan · 21:24 perjalanan ditutup di aplikasi (label it "ditutup", since the passenger walked away). Same date,
     same plate. -> card "Struk perjalanan: penumpang berbayar 21:05-21:24".
   - POLICY (one tap): the guest opens the fictional policy page and taps the readable use clause [konfirmasi PIC]: "Penggunaan:
     PRIBADI. Tidak dijamin bila kendaraan disewakan atau menerima balas jasa, kecuali ada perluasan penggunaan komersial.
     Perluasan pada tanggal kejadian: TIDAK ADA." -> card "Polis: penggunaan pribadi, tanpa perluasan".
4. KEBERATAN against Pak Yusuf's line. Question: "Catatan mana yang menunjukkan mobil sedang membawa penumpang berbayar jam
   21:18?" Cards (correct not first): Foto interior · Struk perjalanan (correct) · Polis. Miss 1 hint: "Botol dan dudukan HP
   bukan bukti ada tarif. Cari yang ada JAM-nya." / "Polis menjelaskan aturan, bukan apa yang terjadi jam 21:18." Miss 2:
   guided. Then Pak Yusuf, calm, with dignity: "Saya sedang mengantar penumpang. Saya kira penggunaan itu sudah termasuk."
   Miss Raksa: "Terima kasih sudah terbuka, Pak." His notebook line gets the correction mark ("Keterangan diperbarui").
5. Verdict [konfirmasi PIC]: Ada masalah pertanggungan (pemakaian di luar polis, tanpa perluasan) = 30 · Butuh bukti tambahan
   = 15 · Klaim layak dijamin = 0, each with a short why. (Per Codex: full points only because the clause and the extension status
   are shown to the guest.)
6. Message to Pak Yusuf (chat like Pak Hendra's):
   - 30: acknowledges the inconvenience, names the confirmed term and the finding, gives the review route (he may ask for a
     review [konfirmasi PIC channel]); future cover (ask about a commercial-use extension) mentioned separately from this loss.
   - 15: accurate and courteous reason, but no review step.
   - 0: a plausible unsupported promise ("Tenang Pak, saya usahakan tetap cair minggu ini").
7. Result: opens with Pak Yusuf's reply tied to the message, then score, grade, stamp 2, both stamps on the officer card, best
   total "x / 200", rank, and "1 kasus lagi menuju Senior" when at 2 stamps. Souvenir: the timeline card and the guest's chosen
   message stay readable in the notebook/archive without replaying. "Kasus 3 · segera hadir" text only.

## Placement and engineering
- New episode `auto-2-inv-2` (own story save), route `/cerita/investigator/2`. Case 1's "Kasus berikutnya" opens case 2 (the
  preview sheet becomes a playable link). Case 1's teaser copy drops "diam-diam" -> "Mobil keluarga... atau sedang antar penumpang?"
- Make case data-driven (Codex point 5): broaden evidence ids and witness roles in tipe.ts; move KEBERATAN order, correct card,
  confronted statement, hunch options, title art, notebook portraits, customer, and a per-case verdict table into
  `Episode.investigasi`; `skorKasus`/`poinPutusan` read the case's verdict table; LayarInvestigasi uses it for live and practice.
- Shared record `raksa:investigasi:v1` (catatHasil, totalSkor, pangkat) with case key `kasus-2`.
- New art (Claude Designer): Pak Yusuf (netral, cemas, serius, terbuka/menjelaskan, lega), Mas Agus (helmet), MPV night scene
  (title card + flashback), surveyor interior photo, trip receipt + incident form timeline UI (fictional app), policy page,
  3 card icons, case-2 stamp, his chat avatar.
