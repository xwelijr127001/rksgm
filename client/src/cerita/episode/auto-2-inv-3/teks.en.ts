/**
 * T-104 Investigator CASE 3 "Two Lines at the Workshop" (until T-125: "One Line Too Many"): new keys only (English). Same keys and numbers as ./teks.id.ts.
 * [konfirmasi PIC]: every line so marked carries the panel's name or authority, consent to show evidence, handling of the
 * undisputed item (bumper), the review channel, or the right to add a statement, and MUST be confirmed by the claims PIC
 * before it is shown to guests. All names, the workshop and the dates are invented ("the 3rd / 14th / 15th" only order the days).
 */
export const TEKS_AUTO_2_INV_3_EN: Record<string, string> = {
  judul: 'Investigator · Case 3',
  ringkas: 'One repair estimate, two lines: bumper and mirror. Present the evidence one piece at a time, hear the explanation, then decide the next step. 5 minutes.',
  'inv.label': 'Case 3',
  'inv3.kait': 'Two lines on the estimate. One incident?',
  'inv3.kasus.judul': 'Two Lines at the Workshop', // T-125: neutral title (the old one answered the opening question)
  'pemeran.pemohon.nama': 'Mr Gilang',
  'pemeran.pemohon.peran': 'Claimant · car owner',
  'pemeran.penaksir.nama': 'Mr Seno',
  'pemeran.penaksir.peran': 'Workshop estimator',
  'pemeran.ketua.nama': 'Mr Arya',
  'pemeran.ketua.peran': 'Claims reviewer · panel chair', // [konfirmasi PIC]

  'inv3.bab.1.judul': 'The file',
  'inv3.bab.1.tujuan': 'Read the incident card, then note two accounts.',
  'inv3.bab.2.judul': 'Evidence',
  'inv3.bab.2.tujuan': 'Pair the workshop photo with the incident card and put the dates in order.',
  'inv3.bab.3.judul': 'Panel',
  'inv3.bab.3.tujuan': 'Present the evidence that answers each account, one at a time.',
  'inv3.bab.4.judul': 'Next step',
  'inv3.bab.4.tujuan': 'Sum up the finding, then explain the next step with respect.',

  'inv3.judul.kartu': 'Case #3 · Two Lines at the Workshop',
  'inv3.buka.1': 'A new case, Investigator. On the 14th, Mr Gilang’s car was hit in a parking area. The workshop estimate has two lines: bumper and mirror. Start with the incident card.',
  'inv3.bukti.kejadian.1': 'Incident card for the 14th: a car reversed into the bumper. The parking attendant confirms the impact. Under damage it says: bumper dented, mirror cracked.',
  'inv3.bukti.kejadian.judul': 'Incident card',
  'inv3.bukti.kejadian.sumber': 'Source: incident report for the 14th, confirmed by the parking attendant',
  'inv3.tebak.1': 'There is no right or wrong. We will check your guess again once the evidence is in.',
  'inv3.tebak.tanya': 'Were both parts damaged in the same incident?',
  'inv3.tebak.pilih.sama': 'Yes, the same incident',
  'inv3.tebak.pilih.beda': 'No, different incidents',
  'inv3.tebak.pilih.belum': 'Not sure yet',
  'inv3.tebak.balik.sama': 'Your first guess: the same incident. Your reading of the two records: the mirror crack was there before the parking incident.',
  'inv3.tebak.balik.beda': 'Your first guess: different incidents. Your reading of the two records: the mirror crack was there before the parking incident.',
  'inv3.tebak.balik.belum': 'Your first guess: not sure yet. A good attitude. Now you have read the two records yourself.',

  'inv3.pemohon.1': 'The interview room. Mr Gilang, the car owner, has brought the estimate from the workshop.',
  'inv3.pemohon.2': 'My car was parked. Another car reversed and hit my bumper.',
  'inv3.pemohon.3': 'The bumper and the mirror were both damaged that same evening.',
  'inv3.pernyataan.pemohon': 'The bumper and the mirror were both damaged that same evening.',
  'inv3.penaksir.1': 'Next is Mr Seno, the estimator at the workshop that inspected the car.',
  'inv3.penaksir.2': 'The car came in the day after the incident. I inspected it, then I drew up the estimate.',
  'inv3.penaksir.3': 'I only wrote down the estimated cost.',
  'inv3.pernyataan.penaksir': 'I only wrote down the estimated cost.',
  'inv3.bukti.penawaran.1': 'The workshop estimate: two lines, bumper and mirror, each with its price.',
  'inv3.bukti.penawaran.judul': 'Repair estimate',
  'inv3.bukti.penawaran.sumber': 'Source: the workshop, drawn up by Mr Seno',
  'inv3.selisih.1': 'The bumper impact is confirmed by the parking attendant. The mirror is not, yet. We do not guess and we do not accuse: we look for a dated record.',

  'inv3.foto.1': 'You ask politely: does the workshop have any other photo of this car?',
  'inv3.foto.2': 'Yes. This one is from our inspection sheet. The date is printed in the corner of the photo.',
  'inv3.bukti.foto.1': 'The inspection photo goes into your notebook. Its chassis number matches Mr Gilang’s car.',
  'inv3.bukti.foto.kutipan': 'The workshop’s inspection sheet, date stamp 03. Same chassis number as Mr Gilang’s car. In the corner print: mirror glass with a branching crack.',
  'inv3.bukti.foto.judul': 'Inspection photo',
  'inv3.bukti.foto.sumber': 'Source: the workshop’s routine service sheet, same chassis number',
  'inv3.baca.foto.1': 'You put the photo next to the incident card.',
  'inv3.tafsir.urutan.tanya': 'The mirror crack shows here. When was this photo taken?',
  'inv3.tafsir.urutan.gambar': 'A photo of a car in a workshop bay. Date stamp in the bottom-left corner: 03. A small print in the top-right corner shows the mirror glass with a branching crack.',
  'inv3.tafsir.urutan.samping': 'Incident card: a calendar leaf reading 14 and a sketch of cars in parking bays.',
  'inv3.tafsir.urutan.pilih.saat': 'Incident day',
  'inv3.tafsir.urutan.pilih.sebelum': 'Before the incident',
  'inv3.tafsir.urutan.pilih.sesudah': 'After the incident',
  'inv3.tafsir.urutan.salah.saat': 'The two records do not carry the same date. Compare the stamp in the corner of this photo with the calendar on the incident card.',
  'inv3.tafsir.urutan.salah.sesudah': 'The order is not right yet. Compare the stamp in the corner of this photo with the calendar on the incident card.',
  'inv3.tafsir.urutan.alasan': 'This photo is stamped 03; the incident card is dated 14. The 3rd comes first: the mirror crack was there before the parking incident.', // [konfirmasi PIC] rumusan kerusakan lama
  'inv3.tafsir.urutan.lagi': 'The stamp in the bottom-left corner of the photo: 03. The calendar on the incident card: 14. Which date comes first?',
  'inv3.tafsir.urutan.benar': 'Photo stamp 03, incident card 14: the mirror crack was there before the parking incident.', // [konfirmasi PIC] rumusan kerusakan lama
  'inv3.tafsir.urutan.temuan': 'Inspection photo stamped 03, incident card dated 14: the mirror crack was there before the parking incident.', // [konfirmasi PIC] rumusan kerusakan lama
  'inv3.tafsir.urutan.ringkas': 'before the incident',
  'inv3.tekan.penaksir.tanya': 'Ask: When was this inspection photo taken?',
  'inv3.tekan.penaksir.jawab': 'On the 3rd, during the routine service. The date and the chassis number are printed on the inspection sheet automatically.',

  'inv3.kutipan.1': 'The workshop file holds a message from Mr Gilang about the estimate. You ask his permission before reading it.', // [konfirmasi PIC]
  'inv3.kutipan.2': 'Go ahead. That extract may be shown.', // [konfirmasi PIC]
  'inv3.bukti.pesan.1': 'Extract of Mr Gilang’s message to the workshop, on the 15th: “That mirror crack is an old one. Please just put it in as damage from this incident.”',
  'inv3.bukti.pesan.judul': 'Message extract',
  'inv3.bukti.pesan.sumber': 'Source: Mr Gilang’s message to the workshop, shown with his consent', // [konfirmasi PIC]
  'inv3.tekan.pemohon.tanya': 'Ask: Who agreed to this message extract being shown?',
  'inv3.tekan.pemohon.jawab': 'I did. The message came from my number, and I allowed the extract to be used for this review.', // [konfirmasi PIC]
  'inv3.tekan.pemohon.harga.tanya': 'Ask: Who set the prices on that estimate?',
  'inv3.tekan.pemohon.harga.jawab': 'Mr Seno, the workshop’s estimator. I took the figures as they were.',

  'inv3.panel-buka.1': 'The claim review panel. Mr Arya chairs it; Mr Seno and Mr Gilang are present, and both may explain.', // [konfirmasi PIC]
  'inv3.panel-buka.2': 'This panel reviews the evidence in the file. It gives no final decision and accuses no one. Each party may correct their account.', // [konfirmasi PIC]
  'inv3.panel-buka.3': 'The file has two lines: bumper and mirror. I only wrote down the estimated cost.',
  'inv3.panel-buka.4': 'We start with Mr Gilang’s account: the bumper and the mirror were both damaged that same evening.',
  'inv3.panel.pilih.kartu-kejadian': 'Present the incident card',
  'inv3.panel.pilih.foto-inspeksi': 'Present the inspection photo',
  'inv3.panel.pilih.pesan-pengajuan': 'Present the message extract',
  'inv3.panel.pilih.penawaran': 'Present the estimate',

  'inv3.panel.kronologi.nama': 'Round 1 · when the crack was there',
  'inv3.panel.kronologi.1': 'Choose one piece of evidence to present to the panel.',
  'inv3.panel.kronologi.2': 'Try again. Look for evidence dated before the incident.',
  'inv3.panel.kronologi.3': 'Present the inspection photo from the 3rd to the panel.',
  'inv3.panel.kronologi.4': 'Try once more. Choose evidence you have not presented yet.',
  'inv3.panel.kronologi.tanya': 'Which evidence shows when the mirror crack was already there?',
  'inv3.panel.kronologi.petunjuk1': 'Not quite. Which evidence is dated before the incident on the 14th?',
  'inv3.panel.kronologi.petunjuk2': 'Not yet. The parking incident was on the 14th. Which evidence carries an earlier date?',
  'inv3.panel.kronologi.salah.kartu-kejadian': 'The incident card records what was reported, not when the mirror crack first appeared.',
  'inv3.panel.kronologi.salah.penawaran': 'The estimate shows only the price, not when the damage happened.',
  'inv3.panel.kronologi.pandu.kartu-kejadian': 'That card is only the report. Let us look together at the evidence dated before the incident.',
  'inv3.panel.kronologi.pandu.penawaran': 'That estimate is only about price. Let us look together at the evidence dated before the incident.',
  'inv3.panel.kronologi.lagi.kartu-kejadian': 'That card is only the report. Please try again: look for the evidence dated before the incident.',
  'inv3.panel.kronologi.lagi.penawaran': 'That estimate is only about price. Please try again: look for the evidence dated before the incident.',
  'inv3.panel.kronologi.koreksi': 'Account corrected: the mirror crack was there before the incident',
  'inv3.kronologi.jawab.1': 'The inspection photo from the 3rd shows the mirror crack was already there, eleven days before the parking incident on the 14th.',
  'inv3.kronologi.jawab.2': 'Mr Gilang, please respond.', // [konfirmasi PIC]
  'inv3.kronologi.jawab.3': 'That is right. The crack was there before the parking incident. What I said earlier was wrong.',
  'inv3.kronologi.koreksi.1': 'Mr Gilang corrects his account. You update it in your notebook.',
  'inv3.koreksi.judul': 'Account updated',
  'inv3.koreksi.ket': 'Mr Gilang himself set his account straight before the panel. No one was accused.',

  'inv3.kira.1': 'Then why is that old crack on the estimate for this incident?',
  'inv3.kira.tapi': 'The workshop drew up that estimate, sir. An estimate alone does not show what I asked for.',
  'inv3.kira.2': 'I thought both repairs had to be written up as new damage.',
  'inv3.pernyataan.pemohon-panel': 'I thought both repairs had to be written up as new damage.',

  'inv3.panel.pengajuan.nama': 'Round 2 · what was asked for',
  'inv3.panel.pengajuan.1': 'Choose one piece of evidence to present to the panel.',
  'inv3.panel.pengajuan.2': 'Try again. Look for the evidence that carries Mr Gilang’s own words.',
  'inv3.panel.pengajuan.3': 'Present the message extract from the 15th to the panel.',
  'inv3.panel.pengajuan.4': 'Try once more. Choose evidence you have not presented yet.',
  'inv3.panel.pengajuan.tanya': 'Which evidence shows what Mr Gilang asked the workshop to do?',
  'inv3.panel.pengajuan.petunjuk1': 'Not quite. Which evidence carries Mr Gilang’s own words?',
  'inv3.panel.pengajuan.petunjuk2': 'Not yet. Prices and dates do not answer this. Which evidence did Mr Gilang write himself?',
  'inv3.panel.pengajuan.salah.penawaran': 'The estimate shows two lines and their prices, not what Mr Gilang asked for.',
  'inv3.panel.pengajuan.salah.foto-inspeksi': 'That photo shows when the crack was already there, not what was asked to be written.',
  'inv3.panel.pengajuan.pandu.penawaran': 'That estimate is only a list and prices. Let us look together at Mr Gilang’s own words.',
  'inv3.panel.pengajuan.pandu.foto-inspeksi': 'That photo has already answered the question of time. Let us look together at Mr Gilang’s own words.',
  'inv3.panel.pengajuan.lagi.penawaran': 'That estimate is only a list and prices. Please try again: look for Mr Gilang’s own words.',
  'inv3.panel.pengajuan.lagi.foto-inspeksi': 'That photo has already answered the question of time. Please try again: look for Mr Gilang’s own words.',
  'inv3.panel.pengajuan.koreksi': 'Account corrected: the old crack was asked to be included as damage from this incident',
  'inv3.pengajuan.jawab.1': 'In the message extract from the 15th, Mr Gilang wrote that the mirror crack was old and asked for it to be included as damage from this incident.',
  'inv3.pengajuan.jawab.2': 'Mr Gilang, Mr Seno, please respond.', // [konfirmasi PIC]
  'inv3.pengajuan.jawab.jeli': 'You remember his answer: he himself allowed that extract to be used.', // [konfirmasi PIC] persetujuan memperlihatkan bukti; hanya untuk pemain bertanda jeli
  'inv3.pengajuan.jawab.3': 'Yes, that is my message. I knew the crack was old, and I was the one who asked for it to be included. I wanted to get it fixed at the same time.',
  'inv3.pengajuan.jawab.4': 'I wrote it as requested. I should have flagged that line.',
  'inv3.pengajuan.jawab.5': 'Thank you for explaining. We record both your accounts exactly as given.', // [konfirmasi PIC]
  'inv3.pengajuan.koreksi.1': 'Mr Gilang corrects his account once more. You update it in your notebook.',
  'inv3.temuan.pengajuan': 'Message extract from the 15th: Mr Gilang asked for that old crack to be included as damage from this incident.', // [konfirmasi PIC] rumusan permintaan (bukan niat)
  'inv3.temuan.pengajuan.ringkas': 'asked to include it',

  'inv3.putusan.1': 'Both parties have explained and corrected their accounts.', // [konfirmasi PIC]
  'inv3.putusan.2': 'Investigator, what can we conclude from this evidence?',
  'inv3.putusan.3': 'Choose one conclusion.',
  'inv3.putusan.tanya': 'What can we conclude from this evidence?',
  'inv3.putusan.tambahan': 'Refer for examination', // [konfirmasi PIC]
  'inv3.putusan.layak': 'Only ask for clarification', // [konfirmasi PIC]
  'inv3.putusan.polis': 'Declare the whole claim fraudulent', // [konfirmasi PIC]
  'inv3.putusan.ket': 'The photo and the message extract are in your notebook. Choose one conclusion.',
  'inv3.putusan.tambahan.sebab': 'The mirror line goes to the team authorised to examine it. The bumper damage is recorded separately.', // [konfirmasi PIC]
  'inv3.putusan.layak.sebab': 'Just ask for an explanation once more, without recording or passing on the discrepancy already shown.', // [konfirmasi PIC]
  'inv3.putusan.polis.sebab': 'The mirror line is a problem, so the whole claim is declared fraudulent.', // [konfirmasi PIC]
  'inv3.putusan.tambahan.1': 'Correct. In this file, the photo and the message support the finding that the mirror line was added on purpose. We pass that finding to the authorised team, and the proven bumper damage is recorded separately. We do not decide payment, refusal or guilt here.', // [konfirmasi PIC]
  'inv3.putusan.layak.1': 'Asking is good, but both of them have already explained at the panel. A discrepancy that has been shown needs to be recorded and passed to the authorised team; the bumper damage is recorded separately.', // [konfirmasi PIC]
  'inv3.putusan.polis.1': 'Not quite. Only the mirror line is shown to be a problem; the bumper impact is confirmed by the parking attendant. We do not declare anyone a fraud: the finding goes to the authorised team, and the bumper is recorded separately.', // [konfirmasi PIC]

  'inv3.pesan.1': 'Last, let Mr Gilang know. Give the next step, with respect.',
  'inv3.pesan.2': 'So what happens with my claim now?',
  'inv3.pesan.tanya': 'Which message do you send?',
  'inv3.pesan.baik': 'Thank you for explaining, Mr Gilang. We are passing the mirror line to the authorised team for review; the bumper is recorded separately. You may add a statement.', // [konfirmasi PIC] rujukan: langkah berikutnya + hak menambahkan keterangan
  'inv3.pesan.datar': 'The mirror crack was there before the parking incident, as the inspection photo and the message extract show. The mirror line is passed to the authorised team for examination. The bumper damage is recorded separately. That is all.', // [konfirmasi PIC] isi benar, tanpa hak menambahkan keterangan
  'inv3.pesan.janji': 'Don’t worry, sir, I will do my best to get both the bumper and the mirror replaced.',
  'inv3.pesan.tolak': 'Mr Gilang, the inspection photo and your own message prove that the mirror crack was old and was put in on purpose. We therefore reject this whole claim, bumper and mirror alike, and it will not be processed any further. This decision is final and cannot be reviewed.', // [konfirmasi PIC] penolakan menyeluruh tanpa wewenang (pilihan bernilai 0)
  'inv3.pesan.baik.alasan': 'Mr Gilang knows the next step, and that he may add a statement.', // [konfirmasi PIC]
  'inv3.pesan.janji.alasan': 'Mr Gilang is relieved for now, but that promise has no basis.',
  'inv3.pesan.tolak.alasan': 'The proven bumper damage is rejected too, and rejecting a claim is not yours to decide.', // [konfirmasi PIC] wewenang
  'inv3.pesan.baik.1': 'I understand. Thank you for explaining it properly. I will add my statement.',
  'inv3.pesan.datar.1': 'I see... So what can I do now?',
  'inv3.pesan.datar.2': 'The content is right, but Mr Gilang does not know he may add a statement.', // [konfirmasi PIC]
  'inv3.pesan.janji.1': 'Oh, thank goodness! So both will be replaced, then.',
  'inv3.pesan.tolak.1': 'The bumper is rejected too? But the parking attendant himself confirmed the impact.',
  'inv3.pesan.janji.2': 'The finding has not changed. A promise with no basis will let Mr Gilang down twice.',
  'inv3.pesan.tolak.2': 'Only the mirror line was shown to be a problem. Rejecting the whole claim, let alone calling it final, is not ours to decide here.', // [konfirmasi PIC] wewenang; yang terbukti hanya baris spion

  'inv3.akhir.tuntas.1': 'Case closed, Investigator. You presented the evidence one piece at a time, gave them the chance to explain, then passed the finding to the right place.',
  'inv3.akhir.tinjau.1': 'Case closed. You found the evidence yourself; we set the next step straight together.',
  'inv3.akhir.tuntas.judul': 'Case solved',
  'inv3.akhir.tuntas.ringkas': 'The mirror line was referred for examination, the bumper recorded separately, and Mr Gilang was given the explanation.', // [konfirmasi PIC]
  'inv3.akhir.tinjau.judul': 'Case closed with a note',
  'inv3.akhir.tinjau.ringkas': 'The evidence was found; Miss Raksa set the next step straight.',
  'inv3.pelajaran.1': 'Evidence first, conclusion second. Give people the chance to explain, then pass the finding to those authorised to examine it.', // [konfirmasi PIC]

  'inv3.balas.baik': 'Thank you for explaining it so well, Investigator. I know what is being examined, and I will add my statement.', // [konfirmasi PIC]
  'inv3.balas.datar': 'I understand the reason. But I still do not know what I can do.',
  'inv3.balas.janji': 'Both will be replaced, right? I have already told the workshop. I hope that is true.',
  'inv3.balas.tolak': 'My bumper is rejected too, although there was a witness. I do not know where else to ask.',
  'inv3.arsip.judul': 'The corrected file',
  'inv3.garis.1': 'The 3rd · inspection photo: mirror crack already there',
  'inv3.garis.2': 'The 14th · parking incident: bumper dented, confirmed by the parking attendant',
  'inv3.garis.3': 'The 15th · message about the estimate: old crack asked to be included',
  'inv3.arsip.pesan': 'Your message to Mr Gilang',
  'inv.lagi.langkah.pesan': 'Message to Mr Gilang',
  'inv.lagi.sempurna': 'A perfect score! This is Mr Gilang’s account, corrected thanks to your evidence.',
};
