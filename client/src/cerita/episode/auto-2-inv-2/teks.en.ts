/**
 * T-090 Investigator CASE 2 "A Night on Jalan Melati": NEW keys only (English). See ./teks.id.ts for the layout of the table and
 * the meaning of [konfirmasi PIC]: every line carrying that mark holds policy wording, the basis of the verdict, or the review
 * route, and must be confirmed by the claims PIC before guests see it. Same keys and digits as id / zh.
 */
export const TEKS_AUTO_2_INV_2_EN: Record<string, string> = {
  judul: 'Investigator · Case 2',
  ringkas: 'A family car, a night-time bump, and one trip receipt. Find the facts without accusing anyone, then explain them with respect. 5 minutes.',
  'inv.label': 'Case 2',
  'inv2.kait': 'A family car... or carrying a passenger?', // T-094: kalimat kait di hub Raksa Investigator
  'inv2.kasus.judul': 'A Night on Jalan Melati',
  'pemeran.yusuf.nama': 'Mr Yusuf',
  'pemeran.yusuf.peran': 'Customer · car owner',
  'pemeran.agus.nama': 'Agus',
  'pemeran.agus.peran': 'Witness · motorbike rider',

  'inv2.bab.1.judul': 'Statements',
  'inv2.bab.1.tujuan': 'Look at the surveyor’s photo, then note down two statements.',
  'inv2.bab.2.judul': 'Evidence',
  'inv2.bab.2.tujuan': 'Match the time of the bump with the trip receipt, then read the policy.',
  'inv2.bab.3.judul': 'Objection',
  'inv2.bab.3.tujuan': 'Show the record that answers Mr Yusuf’s statement.',
  'inv2.bab.4.judul': 'Verdict',
  'inv2.bab.4.tujuan': 'Decide the claim, then explain it to Mr Yusuf with respect.',

  'inv2.judul.kartu': 'Case #2 · A Night on Jalan Melati',
  'inv2.buka.1': 'A new case, Investigator. At night on Jalan Melati, a motorbike clipped the front-left bumper of Mr Yusuf’s car. Here is our surveyor’s photo of the cabin.',
  'inv2.bukti.foto.1': 'The surveyor’s cabin photo: a phone on a dashboard mount with an app glowing, and bottles of water on the back seat.',
  'inv2.bukti.foto.judul': 'Cabin photo',
  'inv2.bukti.foto.sumber': 'Source: Raksa surveyor’s photo',
  'inv2.tebak.1': 'There is no right or wrong. We will check your guess again once the records are in.',
  'inv2.tebak.tanya': 'What was this car being used for that night?',
  'inv2.tebak.pilih.keluarga': 'Driving family',
  'inv2.tebak.pilih.penumpang': 'Driving a passenger',
  'inv2.tebak.pilih.belum': 'Not sure yet',
  'inv2.tebak.balik.keluarga': 'Your first guess: driving family. Your reading of the records: the bump happened in the middle of a trip in the app.',
  'inv2.tebak.balik.penumpang': 'Your first guess: driving a passenger. Your reading of the records: the bump happened in the middle of a trip in the app.',
  'inv2.tebak.balik.belum': 'Your first guess: not sure yet. A good instinct. Now you have read the record yourself.',

  'inv2.yusuf.1': 'The interview room. Mr Yusuf, the car’s owner, has come straight from work.',
  'inv2.yusuf.2': 'The motorbike came from the left and clipped my bumper. Thankfully nobody was hurt.',
  'inv2.yusuf.3': 'That night I was only driving my family home.',
  'inv2.pernyataan.yusuf': 'That night I was only driving my family home.',
  'inv2.agus.1': 'Next is Agus, the motorbike rider. His helmet is still in his hand.',
  'inv2.agus.2': 'I am the one who clipped the car, I admit it. The road was dark and I braked too late.',
  'inv2.agus.3': 'After the bump, a passenger got out of the back door and walked away.',
  'inv2.pernyataan.agus': 'After the bump, a passenger got out of the back door and walked away.',
  'inv2.selisih.1': 'Family, or a passenger? We do not guess and we do not accuse. We look for a record with a time on it.',

  'inv2.jalan.1': 'You ask politely: did the app on the dashboard record a trip that night?',
  'inv2.jalan.2': 'There was one. Here is the receipt, please have a look. I have covered the person’s name and addresses.',
  'inv2.jalan.judul': 'Match the times',
  'inv2.jalan.struk': 'Trip receipt',
  'inv2.jalan.struk.ket': 'Ride app (fictional). The passenger’s name and addresses are hidden.',
  'inv2.jalan.form': 'Incident form',
  'inv2.jalan.form.jam': 'Time of the bump: 21:18',
  'inv2.jalan.tertutup': 'Tap to open',
  'inv2.jalan.sama': 'Same date · same number plate',
  'inv2.garis.1': '21:05 · passenger picked up',
  'inv2.garis.2': '21:18 · the bump',
  'inv2.garis.3': '21:24 · trip closed in the app',
  'inv2.jalan.l1.tanya': 'Tap the trip receipt to open it.',
  'inv2.jalan.l1.hasil': 'One paid trip: passenger picked up at 21:05, trip closed in the app at 21:24.',
  'inv2.jalan.l2.tanya': 'Tap the incident form to see the time of the bump.',
  'inv2.jalan.l2.hasil': 'The incident form records the bump at 21:18.',
  'inv2.jalan.l3.tanya': 'Where does 21:18 fall on that trip? Tap the place.',
  'inv2.jalan.l3.sebelum': 'Before 21:05',
  'inv2.jalan.l3.tengah': 'Between 21:05 and 21:24',
  'inv2.jalan.l3.sesudah': 'After 21:24',
  'inv2.jalan.l3.coba': 'Not quite. Compare the times: 21:18 is after 21:05, but before 21:24.',
  'inv2.jalan.l3.hasil': 'Correct: 21:18 falls in the middle of that paid trip.',
  'inv2.jalan.l4.tanya': 'Tap the date and the number plate to match them.',
  'inv2.jalan.l4.hasil': 'The date and the number plate on the receipt are the same as on the incident form.',
  'inv2.jalan.selesai': 'Save the check result',
  'inv2.bukti.struk.1': 'The trip receipt goes into your notebook. Its date and number plate are the same as on the incident form.',
  'inv2.bukti.struk.judul': 'Trip receipt',
  'inv2.bukti.struk.sumber': 'Source: receipt from Mr Yusuf, passenger’s name and addresses hidden',

  'inv2.tekan.yusuf.tanya': 'Ask: When was that trip closed in the app?',
  'inv2.tekan.yusuf.jawab': 'At 21:24. I closed it myself on the phone on the dashboard, after I had pulled over.',
  'inv2.tekan.yusuf.dudukan.tanya': 'Ask: Why was that phone mounted on the dashboard?',
  'inv2.tekan.yusuf.dudukan.jawab': 'For the map, so I do not take a wrong turn. Plenty of drivers mount it that way.',
  'inv2.polis.1': 'The documents are here: the policy extract and the status of its extension. We read what is written, not what we assume.', // [konfirmasi PIC]
  'inv2.polis.judul': 'Read the policy',
  'inv2.polis.tanya': 'Tap the vehicle use clause.',
  'inv2.polis.kepala': 'Motor policy (fictional example)',
  'inv2.polis.ketuk': 'Tap to read',
  'inv2.polis.klausul.judul': 'Use of the vehicle',
  'inv2.polis.klausul.1': 'Use: PRIVATE.', // [konfirmasi PIC] use clause wording
  'inv2.polis.klausul.2': 'Not covered if the vehicle is hired out or carries anyone for payment, unless a commercial-use extension is in place.', // [konfirmasi PIC] clause wording + name of the extension
  'inv2.polis.klausul.3': 'Extension on the incident date: NONE.', // [konfirmasi PIC] how the extension status appears on the policy
  'inv2.polis.hasil': 'This policy is for private use. On the incident date there was no commercial-use extension.', // [konfirmasi PIC]
  'inv2.polis.selesai': 'Save the check result',
  'inv2.bukti.polis.1': 'Mr Yusuf’s policy: private use. Commercial-use extension on the incident date: none.', // [konfirmasi PIC]
  'inv2.bukti.polis.judul': 'Policy extract',
  'inv2.bukti.polis.sumber': 'Source: extract from Mr Yusuf’s motor policy',
  'inv2.tafsir.jam.tanya': 'The incident form. Which slip carries the time of the bump?',
  'inv2.tafsir.jam.gambar': 'The incident form: a time box reading 21:18, and a sketch of a car touching a motorbike.',
  'inv2.tafsir.jam.pilih.2105': '21:05',
  'inv2.tafsir.jam.pilih.2118': '21:18',
  'inv2.tafsir.jam.pilih.2124': '21:24',
  'inv2.tafsir.jam.ket.2105': 'a person stepping to a car door',
  'inv2.tafsir.jam.ket.2118': 'a car and a motorbike touching',
  'inv2.tafsir.jam.ket.2124': 'a phone with a closed-trip bar',
  'inv2.tafsir.jam.salah.2105': 'The 21:05 slip shows a person getting into a car. Look at the time box on the incident form.',
  'inv2.tafsir.jam.salah.2124': 'The 21:24 slip shows a trip being closed in the app. Look at the time box on the incident form.',
  'inv2.tafsir.jam.alasan': 'The time box on the incident form reads 21:18, and its sketch shows the bump. The 21:18 slip is the time of the bump.',
  'inv2.tafsir.jam.lagi': 'Read the number in the time box on the incident form, then find the slip with exactly the same number.',
  'inv2.tafsir.jam.benar': 'The incident form records the bump at 21:18.',
  'inv2.baca.struk.1': 'You put the time of the bump next to the trip receipt.',
  'inv2.tafsir.struk.tanya': 'The bump was at 21:18. Where does that time fall on the trip in this receipt?',
  'inv2.tafsir.struk.gambar': 'The trip receipt: one route line with two times, 21:05 at the start and 21:24 at the end. The name and both addresses are covered by black bars.',
  'inv2.tafsir.struk.salah.sebelum': 'Compare the time with the numbers on the receipt: 21:18 is later than 21:05.',
  'inv2.tafsir.struk.salah.sesudah': 'Compare the time with the numbers on the receipt: 21:18 is earlier than 21:24.',
  'inv2.tafsir.struk.alasan': 'Receipt: 21:05 at the start, 21:24 at the end. 21:18 lies between them: the bump happened mid-trip.',
  'inv2.tafsir.struk.lagi': 'Look at the route line on the receipt: 21:05 at the start, 21:24 at the end. Where does 21:18 sit on that line?',
  'inv2.tafsir.struk.benar': '21:18 lies between 21:05 and 21:24: the bump happened in the middle of the trip on that receipt.',
  'inv2.tafsir.struk.temuan': 'Trip receipt: the 21:18 bump falls between 21:05 and 21:24, in the middle of that trip.',
  'inv2.tafsir.struk.ringkas': 'mid-trip',
  'inv2.kurang.1': 'Before the policy is read, Miss Raksa asks: what would your verdict be right now?',
  'inv2.tafsir.dokumen.tanya': 'Not ready to decide: more evidence is needed. Which document is still missing?', // [konfirmasi PIC]
  'inv2.tafsir.dokumen.pilih.identitas': 'The passenger’s name and address',
  'inv2.tafsir.dokumen.pilih.perluasan': 'The use-extension status on the incident date', // [konfirmasi PIC]
  'inv2.tafsir.dokumen.pilih.foto': 'A second photo of the bumper',
  'inv2.tafsir.dokumen.salah.identitas': 'Who the passenger was does not change what the policy says, and that data is hidden on purpose. Which document decides whether this is covered?', // [konfirmasi PIC]
  'inv2.tafsir.dokumen.salah.foto': 'The damage to the bumper is not in doubt. What you have not read yet is what the policy said on that date.',
  'inv2.tafsir.dokumen.alasan': 'The receipt already answers what happened. What is missing: what the policy says, and whether a use extension was in place on the incident date. Without that we may not decide yet.', // [konfirmasi PIC]
  'inv2.tafsir.dokumen.lagi': 'The incident and the damage are already in your notebook. What have you not read at all in this file yet?',
  'inv2.tafsir.dokumen.benar': 'That is what is missing: what the policy says and the use-extension status on the incident date. We ask for the document first.', // [konfirmasi PIC]
  'inv2.tafsir.klausul.tanya': 'Which clause decides this case?',
  'inv2.tafsir.klausul.gambar': 'A policy extract with three numbered clauses: clause 1 shows a car and a house, clause 2 shows a map, clause 3 shows a person at a steering wheel.',
  'inv2.tafsir.klausul.pilih.1': '1 · Use', // [konfirmasi PIC]
  'inv2.tafsir.klausul.pilih.2': '2 · Territory', // [konfirmasi PIC]
  'inv2.tafsir.klausul.pilih.3': '3 · Driver', // [konfirmasi PIC]
  'inv2.tafsir.klausul.salah.2': 'The place of the incident is not in question in this file. What was different about this car that night?', // [konfirmasi PIC]
  'inv2.tafsir.klausul.salah.3': 'Mr Yusuf was driving himself, and that is not in question. What was different about this car that night?', // [konfirmasi PIC]
  'inv2.tafsir.klausul.alasan': 'Territory and driver are not in question. What differed that night was how the car was used: clause 1, use.', // [konfirmasi PIC]
  'inv2.tafsir.klausul.lagi': 'Look again at the trip receipt in your notebook: that night this car carried a paying passenger. Which clause deals with that?', // [konfirmasi PIC]
  'inv2.tafsir.klausul.benar': 'Clause 1 governs the use of the vehicle, and how the car was used is what was different that night.', // [konfirmasi PIC]
  'inv2.tafsir.klausul.temuan': 'Policy extract, clause 1: private use. Commercial-use extension on the incident date: none.', // [konfirmasi PIC]
  'inv2.tafsir.klausul.ringkas': 'private use', // [konfirmasi PIC]

  'inv2.keb-buka.1': 'Three records are now in your notebook. You meet Mr Yusuf once more.',
  'inv2.keb-buka.2': 'As I said, that night I was only driving my family home.',
  'inv2.keb-buka.3': 'Remember, we do not accuse. Show one record that answers: what was happening at 21:18?',
  'inv2.keb.1': 'Choose two notes that do not match: one statement and one piece of evidence.',
  'inv2.keb.2': 'Try again. Look for the record with a time on it.',
  'inv2.keb.3': 'Show Mr Yusuf the trip receipt.',
  'inv2.keb.4': 'Try once more. Choose a record you have not tried yet.',
  'inv2.keb.tanya': 'Which record answers Mr Yusuf’s statement?',
  'inv2.pasang.tanya': 'Which notes do not match?',
  'inv2.pasang.ket': 'Choose one statement and one piece of evidence.',
  'inv2.pasang.salah.agus': 'Agus’s statement does not differ from the records in your notebook. Look for the statement that differs from your records.',
  'inv2.pasang.alasan': 'Mr Yusuf said he was only driving his family that night. That is the statement to check against your records.',
  'inv2.pasang.temuan': 'The statement "only driving family" does not match the trip receipt: the 21:18 bump falls between 21:05 and 21:24.',
  'inv2.keb.petunjuk1': 'Not quite. Which record has a time on it? Look at the highlighted one.',
  'inv2.keb.petunjuk2': 'Not yet. The bump was at 21:18. Which record shows the times of that night?',
  'inv2.keb.pilih.foto-interior': 'Show the interior photo',
  'inv2.keb.pilih.struk': 'Show the trip receipt',
  'inv2.keb.pilih.polis-kasus2': 'Show the policy',
  'inv2.keb.salah.foto-interior': 'Bottles and a phone mount do not prove a fare. Look for the one with a TIME on it.',
  'inv2.keb.salah.polis-kasus2': 'The policy explains the rules, not what was happening at 21:18.',
  'inv2.keb.pandu.foto-interior': 'That photo is only a hint, not a record of the time. Let us look together.',
  'inv2.keb.pandu.polis-kasus2': 'The policy is only the rules, not what happened that night. Let us look together.',
  'inv2.keb.lagi.foto-interior': 'That photo is only a hint, not a record of the time. Try again: look for the record that carries the times of that night.',
  'inv2.keb.lagi.polis-kasus2': 'The policy is only the rules, not what happened that night. Try again: look for the record that carries the times of that night.',
  'inv2.keb.cap': 'The trip receipt records a paying passenger from 21:05 to 21:24. The bump happened at 21:18.',
  'inv2.akui.tapi': 'But that receipt only records when I closed the app. The passenger could have got out before that.',
  'inv2.akui.tutup': 'You remember his answer: he closed the trip after pulling over.',
  'inv2.akui.agus': 'You show one more note, Agus’s statement: the passenger got out after the bump.',
  'inv2.akui.1': 'That is right. The passenger got out after the bump. I was driving a passenger; I thought that kind of use was already included.',
  'inv2.akui.2': 'Thank you for being open with us, sir.',
  'inv2.koreksi.1': 'You update Mr Yusuf’s statement in your notebook.',
  'inv2.koreksi.judul': 'Statement updated',
  'inv2.koreksi.ket': 'Mr Yusuf set his own statement straight. Nobody was accused.',
  'inv2.koreksi.baris': 'Statement updated: was driving a paying passenger',

  'inv2.putusan.1': 'Your finding is clear, and Mr Yusuf has set his own statement straight.',
  'inv2.putusan.2': 'Now your verdict. We judge how the car was used and what the policy says, not Mr Yusuf’s intentions.',
  'inv2.putusan.3': 'Choose one verdict.',
  'inv2.putusan.tanya': 'What about this claim?',
  'inv2.putusan.layak': 'Claim is covered',
  'inv2.putusan.tambahan': 'More evidence needed',
  'inv2.putusan.polis': 'There is a coverage problem',
  'inv2.putusan.ket': 'The receipt and the policy are in your notebook. Choose one verdict.',
  'inv2.putusan.polis.sebab': 'At the time of the bump the car carried a paying passenger: outside private use, and with no extension.', // [konfirmasi PIC] basis of the verdict
  'inv2.putusan.tambahan.sebab': 'Safer to check once more first, even with the timed receipt and the policy clause in hand.', // [konfirmasi PIC]
  'inv2.putusan.layak.sebab': 'The bumper was damaged by the motorbike, so the loss is covered anyway.', // [konfirmasi PIC]
  'inv2.putusan.polis.1': 'Correct. The policy is for private use, the receipt records a paying passenger at the time of the bump, and there was no extension on that date. There is a coverage problem. This is about how the car was used, not about Mr Yusuf’s intentions.', // [konfirmasi PIC] basis of the verdict + who has authority to decide
  'inv2.putusan.tambahan.1': 'Being careful is good, but you already hold the two things that decide it: the timed receipt, and the policy clause with its extension status. The verdict: there is a coverage problem.', // [konfirmasi PIC]
  'inv2.putusan.layak.1': 'Not quite. The damage is real, but at the time of the bump the car was being used outside what the policy states, with no extension. The verdict: there is a coverage problem.', // [konfirmasi PIC]

  'inv2.pesan.1': 'Lastly, tell Mr Yusuf. It is not the news he hoped for, so how you say it matters.',
  'inv2.pesan.2': 'So what about my bumper claim?',
  'inv2.pesan.tanya': 'Which message do you send?',
  'inv2.pesan.baik': 'Mr Yusuf, I am sorry the news is not good. Your policy is for private use, and at the time of the bump the car was carrying a paying passenger, with no extension. So we cannot approve this bumper claim. You may ask for a review through Raksa Customer Service.', // [konfirmasi PIC] decline wording, review route (channel), future extension option
  'inv2.pesan.datar': 'Dear Sir. With reference to the vehicle-use provision of the policy and the verification of the supporting documents, the insured object was, at the time of the incident, used outside the insured use without any extension of cover, and the claim for the said loss therefore cannot be processed further. Please be advised accordingly.', // [konfirmasi PIC] decline wording
  'inv2.pesan.janji': 'Do not worry, sir, I will try to get it paid out this week anyway. I will also send you that passenger’s name and number, so you can sort it out with them.', // [konfirmasi PIC] janji tanpa dasar + data penumpang (privasi)
  'inv2.pesan.baik.alasan': 'Mr Yusuf knows the result, the reason, and the route to a review.', // [konfirmasi PIC] review route
  'inv2.pesan.janji.alasan': 'Mr Yusuf is relieved for now, but that promise has no basis.',
  'inv2.pesan.baik.1': 'I am disappointed, but I understand the reason. Thank you for explaining it and telling me the route.',
  'inv2.pesan.datar.1': 'Sorry, I do not quite follow the wording. So it is declined? Then what do I do?',
  'inv2.pesan.datar.2': 'The content is accurate, but the wording is hard to follow, and Mr Yusuf does not know he may ask for a review.', // [konfirmasi PIC] right to ask for a review
  'inv2.pesan.janji.1': 'Oh, thank goodness! I will wait for it this week, then.',
  'inv2.pesan.janji.2': 'The finding has not changed, and the passenger’s details must not be shared. A promise with no basis will let Mr Yusuf down twice.', // [konfirmasi PIC] data penumpang tidak dibagikan (privasi)

  'inv2.akhir.tuntas.1': 'Case closed, Investigator. You were fair in both directions: you found the facts without accusing anyone, then explained them with respect.',
  'inv2.akhir.tinjau.1': 'Case closed. You found the facts yourself; we set the verdict straight together.',
  'inv2.akhir.tuntas.judul': 'Case solved',
  'inv2.akhir.tuntas.ringkas': 'The car’s use was shown to be outside the policy, and Mr Yusuf got the explanation.', // [konfirmasi PIC]
  'inv2.akhir.tinjau.judul': 'Case closed, with a note',
  'inv2.akhir.tinjau.ringkas': 'The facts were found; Miss Raksa set the verdict straight.',
  'inv2.pelajaran.1': 'How a vehicle is used must match its policy. An investigator is fair in both directions and does not judge intentions.', // [konfirmasi PIC] wording of the lesson

  'inv2.balas.baik': 'Thank you for being honest with me, Investigator. I know where to ask for a review, and I will ask about that extension.', // [konfirmasi PIC] review route
  'inv2.balas.datar': 'I read the letter twice. In short it is declined, but I still do not know whether there is anything I can do.',
  'inv2.balas.janji': 'It will be paid this week, right? I have already told the workshop. I hope that is true.',
  'inv2.arsip.pesan': 'Your message to Mr Yusuf',
  'inv2.hasil.kasus3': 'Case 3 · coming soon',
  'inv.lagi.langkah.pesan': 'Message to Mr Yusuf',
  'inv.lagi.sempurna': 'A perfect score! Here is Mr Yusuf’s statement, updated thanks to your record.',
};
