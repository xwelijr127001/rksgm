/**
 * EPISODE AUTO-1 "Baret di Parkiran" - English (terjemahan dari teks.id.ts; kunci & parameter {nama}/{lokasi} SAMA).
 * DRAF, belum ditinjau penutur asli / PIC Claim. Perubahan materi klaim dari PIC Claim ditulis di teks
 * Indonesia dulu, lalu diterjemahkan ulang di sini.
 *
 * Catatan penerjemahan:
 * - Ejaan & kosakata Inggris Britania seperti shared/i18n/misi.en.ts: car park, number plate, tyre (ban),
 *   boot (bagasi), rear light (lampu belakang), workshop (bengkel), per cent.
 * - Istilah mengikuti misi.en.ts, kamus UI, dan shared/i18n/acara/*: risiko sendiri = deductible (m09),
 *   pemeriksaan = inspection (catatanSimulasiPeriksa), pemeriksa = inspector, dinilai / penilaian =
 *   assessed / assessment (m05), kartu polis = policy card, "Tercakup sesuai syarat kartu" = "Covered,
 *   subject to the card terms" (m05), kerusakan benturan = impact damage, ketentuan polis = policy terms,
 *   lapor = report, laporan tercatat = the report is recorded (bukan "logged": bisa terbaca sebagai nomor
 *   registrasi resmi), nasabah = customer, petugas layanan klaim = claims service officer (pintuCeritaIsi).
 *   Comprehensive tidak diterjemahkan (m05). TLO tidak lagi dipakai naskah v2 (hanya kunci pensiun).
 * - Istilah v2 (`istilah.<id>.label`) = kata PERSIS seperti tertulis di baris yang diberi tombol "Apa itu …?":
 *   nasabah = customer, klaim = claim, polis = policy, risiko sendiri = deductible.
 * - "Pasti diganti" = "definitely paid for" (BUKAN "covered", supaya tidak rancu dengan "Covered, subject
 *   to the card terms" di kartu). "Bisa dilanjutkan untuk dinilai" = "can proceed to assessment" (m05
 *   "Can proceed to assessment"); yang diperiksa (inspected) adalah mobil, yang dinilai (assessed) kerusakannya,
 *   bukan laporannya. "Langkah perbaikan mengikuti hasil penilaian" = "the repair steps follow the outcome of
 *   that assessment" (tidak menyiratkan perbaikan pasti dijamin).
 * - Judul akhir "Laporan Tertunda" = "Incomplete Report" (BUKAN "Report on Hold", yang dalam bahasa asuransi
 *   terbaca sebagai klaim yang ditangguhkan penanggung).
 * - Bu Rina = "Mrs Rina" (pola episode uji: "Mrs Uji"). Sapaan "Bu" dalam ucapan pemain/Miss Raksa
 *   umumnya dilepas (bahasa Inggris tidak mengulang sapaan tiap kalimat). Pemain disapa "you" / {nama};
 *   tidak ada sapaan bergender untuk pemain.
 * - Bilangan yang di sumber ditulis dengan kata ("tiga", "tujuh puluh lima") tetap ditulis dengan kata;
 *   angka ("150", "3", "75%", "1726") sama persis (dijaga validasiEpisode).
 * - Kutipan memakai tanda kutip tipografis “ ” dan apostrof ’ seperti teks Indonesia.
 */
export const TEKS_EN: Record<string, string> = {
  // ------------------------------------------------------------------ episode & pemeran
  'ep.judul': 'A Scrape in the Car Park',
  'ep.ringkas':
    'Mrs Rina’s car was hit in the market car park, and tomorrow morning she has 150 catering boxes to deliver. Listen, gather evidence, and explain the steps honestly.',

  'pemeran.nasabah.nama': 'Mrs Rina',
  'pemeran.nasabah.peran': 'Customer',
  'pemeran.missRaksa.nama': 'Miss Raksa',
  'pemeran.missRaksa.peran': 'Claims Officer',

  // ------------------------------------------------------------------ bab
  'bab.menyambut.judul': 'Welcoming',
  'bab.menyambut.tujuan': 'Understand Mrs Rina’s problem.',
  'bab.menggali.judul': 'Hearing the Story',
  'bab.menggali.tujuan': 'Find out what happened, then suggest the first step.',
  'bab.bukti.judul': 'Gathering Evidence',
  'bab.bukti.tujuan': 'Collect the evidence the inspector needs.',
  'bab.polis.judul': 'Reading the Policy',
  'bab.polis.tujuan': 'Read the policy card, then explain it accurately.',
  'bab.menutup.judul': 'Wrapping Up',
  'bab.menutup.tujuan': 'Explain the next steps honestly.',

  // ------------------------------------------------------------------ suasana nasabah
  'suasana.tenang': 'Calm',
  'suasana.mulai-tenang': 'Calming down',
  'suasana.cemas': 'Worried',
  'suasana.kesal': 'Annoyed',

  // ------------------------------------------------------------------ kejelasan (paham)
  'paham.langkah-sekarang': 'Document and report first; the car isn’t repaired yet.',
  'paham.polis-dinilai': 'The damage can proceed to assessment under the card terms; it’s not definitely paid for.',
  'paham.risiko-sendiri': 'Part of the loss is still hers to bear under the policy (the deductible).',
  'paham.langkah-berikut': 'The report is recorded; the car is inspected and the damage assessed under the policy, and the repair steps follow the outcome of that assessment.',

  // ------------------------------------------------------------------ ketepatan langkah klaim (proses)
  'proses.dokumentasi-dulu': 'Document and report before repairs',
  'proses.bukti': 'Three pieces of evidence: whole car, damage close-up, identity',
  'proses.baca-polis': 'Reading the policy card correctly',
  'proses.tanpa-janji': 'Not promising an outcome or timing',

  // ------------------------------------------------------------------ catatan kasus
  'catatan.masalah': 'Hit in the market car park this morning; the other driver left. Bumper & rear light dented, cracked.',
  'catatan.kebutuhan': 'Must deliver 150 catering boxes tomorrow morning.',
  'catatan.bagian-disimpan': 'Pieces of the light cover kept in the boot, not thrown away.',
  'catatan.rencana-bengkel': 'Plans to go straight to a workshop this afternoon.',
  'catatan.bukti': 'Evidence photos taken in the office car park.',
  'catatan.bukti-lengkap': 'Photos completed before Mrs Rina left: whole car, bumper & rear light close-up, number plate.',
  'catatan.bukti-kurang': 'Photos incomplete: the missing ones weren’t taken.',
  'catatan.polis': 'Comprehensive (simulation), active. Impact damage covered, subject to the card terms; deductible as per the policy.',

  // ------------------------------------------------------------------ istilah (v2; label = kata seperti tertulis di baris)
  'istilah.nasabah.label': 'customer',
  'istilah.nasabah.arti': 'Someone insured with an insurance company. In this story: Mrs Rina.',
  'istilah.klaim.label': 'claim',
  'istilah.klaim.arti': 'A report of a loss that a customer makes to the insurance company. The outcome follows their cover document (the policy) and the inspection.',
  'istilah.polis.label': 'policy',
  'istilah.polis.arti': 'The document that explains the insurance cover and its terms. The policy card summarises it.',
  'istilah.comprehensive.label': 'Comprehensive',
  'istilah.comprehensive.arti': 'Mrs Rina’s type of policy in this simulation. On her card, impact damage is covered, subject to the card terms.',
  'istilah.risiko-sendiri.label': 'deductible',
  'istilah.risiko-sendiri.arti': 'The part of a loss the customer still bears themselves. The amount follows the policy terms.',

  // ================================================================== BAB 1 - MENYAMBUT
  'b1-mentor.1': 'Morning, {nama}. Today you’re on duty at the {lokasi} service desk, and I’m right beside you. This is a simulation.',
  'b1-mentor.4': 'The door opens. A customer hurries in and puts her car keys down on the desk.',

  'b1-datang.1': 'Morning. Someone hit my car in the market car park just now. They drove straight off.',
  'b1-datang.2': 'The rear bumper’s dented and the light’s cracked. Tomorrow morning I have to deliver 150 catering boxes.',
  'b1-datang.tanya': 'What do you say first?',
  'b1-datang.prosedur': 'Right. First I’ll need your insurance details and photos of the damage, please.',
  'b1-datang.dengar': 'Are you all right yourself? Take a breath first, then tell me from the start.',
  'b1-datang.janji': 'Don’t worry, we’ll see this through. You’ll definitely be able to use the car tomorrow.',
  'b1-datang.prosedur.alasan': 'Mrs Rina tenses up: she came with a problem, but the first thing asked for was her insurance details.',
  'b1-datang.dengar.alasan': 'Mrs Rina starts to calm down because you asked how she was first.',
  'b1-datang.janji.alasan': 'Mrs Rina is relieved to hear that promise, even though the outcome and timing can’t be confirmed yet.',

  'b1-pulih.1': 'Hold on. I’m at a loss here. I didn’t just come to fill in a form.',
  'b1-pulih.2': '(quietly) The details can wait, {nama}. What does she need most right now?',
  'b1-pulih.tanya': 'How do you respond?',
  'b1-pulih.maaf': 'Sorry, I rushed ahead. Are you all right? Tell me what happened first.',
  'b1-pulih.tetap': 'I understand. To keep things quick, let’s fill in the details first.',
  'b1-pulih.maaf.alasan': 'Mrs Rina softens because you admitted rushing and asked how she was.',
  'b1-pulih.tetap.alasan': 'Mrs Rina goes along with it but only answers what she must: she feels like just another form.',

  // ================================================================== BAB 2 - MENGGALI
  'b2-cerita.1': 'Thank goodness. Tomorrow’s order is a big one; I can’t cancel it.',
  'b2-cerita.2': 'Yes, sorry, I’m a bit panicked too. Okay, from the start.',
  'b2-cerita.3': 'I’m fine, just shaken. Thanks for asking.',
  'b2-cerita.5': 'I’d popped in to do some shopping. I took a few quick photos on my phone; this afternoon I was going to go straight to a workshop.',
  'b2-cerita.6': 'Oh, and I picked up the pieces of the light cover. They’re in the boot.',

  'b2-singkat.2': 'Bumper and rear light. I’ve taken photos. I’m off to the workshop after this.',

  'b2-saran.1': 'Point is, I can just go straight to the workshop, right? The claim can wait; I haven’t got much time.',
  'b2-saran.2': 'So I’ll just go straight to the workshop, right? The claim can wait; the car has to run tomorrow.',
  'b2-saran.tanya': 'What do you advise?',
  'b2-saran.bengkel': 'If it’s that urgent, get it repaired first. The claim can follow later.',
  'b2-saran.dokumentasi': 'Let’s photograph and report it before you go to the workshop, so the damage is on record.',
  'b2-saran.ringan': 'If it’s just a scrape, maybe there’s no need to claim. The car still runs, doesn’t it?',
  'b2-saran.bengkel.alasan': 'Mrs Rina is glad she can go straight to the workshop, even though the damage hasn’t been recorded yet.',
  'b2-saran.dokumentasi.alasan': 'Mrs Rina nods because you explained why the car needs to be recorded before it’s repaired.',
  'b2-saran.ringan.alasan': 'Mrs Rina is offended because you played down the damage before even seeing it.',

  'b2-bengkel-akibat.1': 'Hold on, {nama}. If it’s repaired now, the damage can’t be seen any more.',
  'b2-bengkel-akibat.2': 'Wait, so which is it? You just said I could.',
  'b2-bengkel-akibat.tanya': 'What do you do?',
  'b2-bengkel-akibat.biarkan': 'The photos on your phone are enough. Go ahead to the workshop.',
  'b2-bengkel-akibat.koreksi': 'Sorry, my advice was wrong. Let’s photograph and report it first, then go to the workshop.',
  'b2-bengkel-akibat.biarkan.alasan': 'Mrs Rina is glad she can leave soon, but a few quick photos may not be enough for the inspector.',
  'b2-bengkel-akibat.koreksi.alasan': 'Mrs Rina is briefly confused by your change of advice, but she appreciates you setting it straight.',

  'b2-ringan-akibat.1': 'No need? Really? It’s quite a dent, and the light’s cracked too.',
  'b2-ringan-akibat.2': '(quietly) Have you seen the damage yourself, {nama}?',
  'b2-ringan-akibat.tanya': 'How do you respond?',
  'b2-ringan-akibat.lihat-dulu': 'You’re right, I judged too quickly. Could we look at the car first?',
  'b2-ringan-akibat.tetap-ringan': 'From what you’ve told me, it sounds minor. Better not to take it any further, to save you the trouble.',
  'b2-ringan-akibat.lihat-dulu.alasan': 'Mrs Rina is a little relieved because you admitted judging too quickly and want to see for yourself.',
  'b2-ringan-akibat.tetap-ringan.alasan': 'Mrs Rina feels her problem is being brushed aside, and you haven’t even seen the car.',

  // ================================================================== BAB 3 - BUKTI
  'b3-bukti-intro.1': 'You all head out to the office car park. Mrs Rina’s car is parked near the door.',
  'b3-bukti-intro.2': 'Do keep those light pieces in the boot. Don’t throw away any damaged parts yet.',
  'b3-bukti-intro.3': 'Make it quick. I still have to get to the workshop.',

  'b3-bukti.1': 'Go ahead. I’ll wait here.',
  'b3-bukti.hasil.1.1': 'Good. With these three photos, the inspector can confirm the car and where the damage is.',
  'b3-bukti.hasil.2.4': 'Photos that don’t show the point of damage or the car’s identity don’t help the inspector.',
  'b3-bukti.hasil.2.5': 'The report isn’t complete yet: some evidence the inspector needs hasn’t been photographed.',

  'b3-bukti-tepat.1': 'The number plate too? It’s obviously my car.',
  'b3-bukti-tepat.2': 'That’s exactly why. The plate confirms that the car being inspected really is yours.',
  'b3-bukti-tepat.3': 'Oh, I see. That makes sense.',

  'b3-bukti-kurang.1': 'That’s enough, isn’t it? I can’t stay long.',
  'b3-bukti-kurang.tanya': 'What do you do?',
  'b3-bukti-kurang.lengkapi': 'Could we add the missing photos now? It’ll only take a moment.',
  'b3-bukti-kurang.cukup': 'Yes, that’s fine. We’ll use the photos we have so you’re not late.',
  'b3-bukti-kurang.lengkapi.alasan': 'Mrs Rina waits a little longer, and her report now has the evidence it needs.',
  'b3-bukti-kurang.cukup.alasan': 'Mrs Rina doesn’t mind, but her report goes in with incomplete evidence.',
  'b3-lengkapi.1': 'You photograph what was missed. The report now has all three pieces of evidence: the whole car, a close-up of the bumper & rear light, and the number plate.',
  'b3-lengkapi.2': 'Oh, so that’s what was missing. Good thing we did it now.',
  'b3-cukup.1': 'Thanks. That’s quicker.',
  'b3-cukup.2': '(quietly) The missed photos aren’t in the report, {nama}. If they’re asked for later, Mrs Rina will have to make time again.',

  'b3-seadanya.1': 'Okay, I’ll send the photos from my phone now. Then I’m going straight to the workshop.',
  'b3-seadanya.2': 'The report is made from those quick photos: a bit blurry, and the number plate can’t be seen.',

  // ================================================================== BAB 4 - POLIS
  'b4-polis-intro.1': 'You all go back to the service desk. You open the summary of Mrs Rina’s cover documents: her Comprehensive policy card.',
  'b4-polis-intro.2': 'Before Mrs Rina leaves, you open the summary of her cover documents: her Comprehensive policy card.',
  'b4-polis-intro.3': 'You said you’d see it through. So my policy can be used, right?',
  'b4-polis-intro.4': 'My policy can be used, right? I pay for it every year, you know.',

  'b4-polis.1': '(quietly) Mrs Rina is hoping for a “yes”, {nama}. Still, tell her what the card actually says.',
  'b4-polis.hasil.1.1': 'So it’s assessed first. Okay, at least it can go ahead.',
  'b4-polis.hasil.1.2': 'Spot on. The card says covered subject to the terms, not automatically paid for.',
  'b4-polis.hasil.1.alasan': 'Mrs Rina is calmer because your explanation matches the card: the damage can proceed to assessment.',
  'b4-polis.hasil.2.1': 'Definitely paid for? Thank goodness!',
  'b4-polis.hasil.2.2': '(quietly) The card says “covered, subject to the card terms”. Is that the same as “definitely”?',
  'b4-polis.hasil.2.alasan': 'Mrs Rina is relieved to hear “definitely paid for”, even though the outcome still awaits assessment.',
  'b4-polis.hasil.3.1': 'Not covered? Then why am I paying for this policy?',
  'b4-polis.hasil.3.alasan': 'Mrs Rina is deeply disappointed: your explanation makes her feel her policy is useless.',
  'b4-polis.hasil.4.1': 'Seventy-five per cent? My car’s only dented, not wrecked.',
  'b4-polis.hasil.4.2': 'So what now? I still haven’t got an answer.',
  'b4-polis.hasil.4.alasan': 'Mrs Rina is confused because she hasn’t had an explanation that fits her card.',

  'b4-polis-tepat.1': 'And this bit: “deductible applies according to the policy terms”. What does that mean?',
  'b4-polis-tepat.2': 'Part of the loss is still yours to bear. The amount follows the policy terms.',
  'b4-polis-tepat.3': 'So some of it still comes out of my own pocket. Hm.',

  'b4-polis-janji.1': 'If it’s definitely paid for, what a relief. One less worry.',
  'b4-polis-janji.2': 'For the first time this morning, Mrs Rina smiles.',

  'b4-polis-salah.1': '{nama}, read the “Impact damage” line on the card again.',
  'b4-polis-salah.2': 'So which is it? I need an answer, not a guess.',
  'b4-polis-salah.tanya': 'What do you do?',
  'b4-polis-salah.bertahan': 'I read it carefully just now. So as not to confuse you, I’ll stick with my conclusion.',
  'b4-polis-salah.baca-ulang': 'Sorry, I misread it. Impact damage is covered, subject to the card terms, so it can be assessed.',
  'b4-polis-salah.bertahan.alasan': 'Mrs Rina loses trust because you stuck to a reading that doesn’t match the card.',
  'b4-polis-salah.baca-ulang.alasan': 'Mrs Rina calms down again because you admitted misreading and explained what the card says.',

  // ================================================================== BAB 5 - MENUTUP
  'b5-keberatan.1': 'You said it’s definitely paid for. So I can use my car tomorrow, right?',
  'b5-keberatan.2': 'You said I could definitely use it tomorrow. So I just wait, right?',
  'b5-keberatan.3': 'And that deductible, it’s not a problem, is it?',
  'b5-keberatan.4': 'Oh, and what’s this “deductible” on the card? It doesn’t matter, does it?',
  'b5-keberatan.5': 'Okay. So when will my car be fixed? The orders go out tomorrow morning.',
  'b5-keberatan.6': 'And that deductible: why do I still have to bear part of it?',
  'b5-keberatan.7': 'And the card mentions a “deductible”. What does that mean?',
  'b5-keberatan.8': 'My car’s going straight to the workshop this afternoon. So when will the claim be sorted?',
  'b5-keberatan.tanya': 'How do you answer?',
  'b5-keberatan.janjikan': 'I’ll try to get it done by tomorrow. I’ll chase the process up so you won’t need to wait long.',
  'b5-keberatan.aturan': 'That’s in the policy terms. It’s all written on your card; please read it again so you can see for yourself.',
  'b5-keberatan.aturan-janji': 'That’s in the policy terms. It’s all written on your card; please read it again so you can see for yourself.',
  'b5-keberatan.jujur': 'I can’t confirm tomorrow yet. There’s an inspection under the policy, and part of the loss is still yours to bear.',
  'b5-keberatan.ralat-janji':
    'Sorry, I need to correct myself: the outcome and timing aren’t certain yet, and part of the loss is still yours to bear.',
  'b5-keberatan.janjikan.alasan': 'Mrs Rina is pleased to be promised tomorrow, even though the timing can’t be confirmed yet.',
  'b5-keberatan.aturan.alasan': 'Mrs Rina feels left on her own because she was told to read the card without any explanation.',
  'b5-keberatan.aturan-janji.alasan': 'Mrs Rina feels left on her own because she was told to read the card without any explanation.',
  'b5-keberatan.jujur.alasan': 'Mrs Rina appreciates your honesty: it’s not good news, but she knows what she’s facing.',
  'b5-keberatan.ralat-janji.alasan': 'Mrs Rina is disappointed the promise is withdrawn, but now she knows the real situation.',
  'b5-keberatan.ralat-polis': 'Sorry, I got that wrong: the damage is assessed first under the terms, not definitely paid for. The timing isn’t certain yet, and part of the loss is still yours to bear.',
  'b5-keberatan.ralat-polis.alasan': 'Mrs Rina is disappointed the news has changed, but now she understands the card and knows the real situation.',

  'b5-tutup.1': 'Now that’s more like it. I’m holding you to that.',
  'b5-tutup.2': 'Hm. Not nice to hear, but I’d rather have the truth.',
  'b5-tutup.3': 'So now it’s changed... Oh well. Better I know now than tomorrow.',
  'b5-tutup.4': 'Read it myself? I came here precisely to have it explained.',
  'b5-tutup.5': 'So what do I need to do next?',
  'b5-tutup.tanya': 'How do you wrap up?',
  'b5-tutup.rangkum': 'Your report is recorded. The car is inspected and the damage assessed under the policy; the repair steps follow that outcome. If anything’s missing, I’ll let you know.',
  'b5-tutup.singkat': 'I’ve noted all the details down in full. No need to trouble yourself any more; just wait at home and you’ll hear from us.',
  'b5-tutup.rangkum.alasan': 'Mrs Rina is calmer because you summed up the steps and who will keep her posted.',
  'b5-tutup.singkat.alasan': 'Mrs Rina is still wondering: “you’ll hear from us” doesn’t explain the next steps.',
  'b5-rangkum.1': 'Okay. So it’s assessed first, and the repairs follow the outcome. Noted.',
  'b5-rangkum.2': 'Yes, yes. But it’ll be sorted by tomorrow, right? You promised.',
  'b5-rangkum.3': 'Yes, yes. But it’s definitely paid for, right? That’s what you said.',
  'b5-rangkum.4': 'Assessed first? But my car’s still going to the workshop this afternoon, isn’t it? You said I could.',

  // ================================================================== AKHIR
  'akhir-tuntas.1': 'Okay, the car can’t be fixed straight away. Tomorrow I’ll borrow my sister’s car for the deliveries.',
  'akhir-tuntas.2': 'Thank you for being clear from the start. Now I know what to do.',
  'akhir-tuntas.3': 'It stumbled at first, but you put it right. That’s a skill too, {nama}.',
  'akhir-tuntas.4': 'Correcting a promise isn’t pleasant, {nama}, but that’s why she can trust you.',
  'akhir-tuntas.5': 'Good work, {nama}. She didn’t get everything she hoped for, but she left with a clear picture.',
  'akhir-tuntas.6': 'Thank you for setting things straight. Now I know what to do.',

  'akhir-janji.1': 'Thank you so much. What a relief.',
  'akhir-janji.2': 'A few days later, Mrs Rina phones.',
  'akhir-janji.3': 'You said it’d be done the next day. I’d already promised my customers, and I ended up scrambling.',
  'akhir-janji.4': 'You said it’d definitely be paid for. It’s still being assessed, and I still have to bear part of it.',
  'akhir-janji.5': 'She was happy at our desk, {nama}, but disappointed afterwards. Promises outside the process only delay disappointment.',

  'akhir-dingin.1': 'Fine. I’ll be going, then.',
  'akhir-dingin.2': 'Okay. Thank you.',
  'akhir-dingin.3': 'Mrs Rina’s report is recorded, but she leaves still frowning.',
  'akhir-dingin.4': 'The report is moving, {nama}, but she went home without understanding everything. What was missed?',
  'akhir-dingin.5': 'The steps were clear, {nama}, but she didn’t feel heard. When did the distance start?',
  'akhir-dingin.6': '“You’ll hear from us” didn’t answer her question, {nama}: what does she do next? Sum up the steps before she leaves.',

  'akhir-tertunda.1': 'That afternoon, the workshop repaired Mrs Rina’s car right away.',
  'akhir-tertunda.2': 'Later the report needed completing, but the condition before the repair couldn’t be photographed again.',
  'akhir-tertunda.3': 'The car’s already been repaired. How am I supposed to photograph how it was before?',
  'akhir-tertunda.4': 'Later, Mrs Rina’s report needed the missing photos added.',
  'akhir-tertunda.5': 'Why not do it all while I was there? Now I have to find the time all over again.',
  'akhir-tertunda.6': 'Complete evidence from the start saves everyone time, {nama}. Especially the customer.',
  'akhir-tertunda.7': 'You did say you’d let me know if anything was missing. But why not do it all while I was there?',

  'akhir-pergi.1': 'Fine, if it’s really that trivial. I’ll sort it out myself.',
  'akhir-pergi.2': 'If even my policy gets read like that, I’ll look for answers elsewhere.',
  'akhir-pergi.3': 'Mrs Rina leaves without making a report, and without knowing the next steps.',
  'akhir-pergi.4': 'Mrs Rina leaves looking disappointed, without knowing the next steps.',
  'akhir-pergi.5': 'Damage is assessed after it’s been seen, {nama}, not from a story. Let’s try again.',
  'akhir-pergi.6': 'Misreading can happen, {nama}. What made her leave was digging in. Let’s try again.',

  // ------------------------------------------------------------------ info akhir
  'akhir.tuntas.judul': 'Heard and Clear',
  'akhir.tuntas.ringkas': 'The car can’t be fixed straight away, but Mrs Rina was heard, understands the steps, and has a backup plan.',
  'akhir.tuntas.pelajaran.1': 'Ask about the customer’s situation and needs first; the details follow more smoothly.',
  'akhir.tuntas.pelajaran.2': 'Documenting and reporting before repairs preserves the evidence of what happened.',
  'akhir.tuntas.pelajaran.3': 'Explain things as they are: assessed under the policy, a deductible if the policy includes one, and the timing can’t be confirmed yet.',

  'akhir.janji.judul': 'Brief Relief',
  'akhir.janji.ringkas': 'Mrs Rina went home happy, but promises that didn’t match the process turned into disappointment.',
  'akhir.janji.pelajaran.1': 'A happy customer doesn’t always mean the steps were right.',
  'akhir.janji.pelajaran.2': 'Claim outcomes and timing follow the policy and inspection, so don’t promise them at the desk.',
  'akhir.janji.pelajaran.3': 'Already made a promise? Correct it quickly. A little discomfort now is easier than disappointment later.',

  'akhir.dingin.judul': 'Right, but Distant',
  'akhir.dingin.ringkas': 'The report is moving, but Mrs Rina went home still unsure or not understanding everything.',
  'akhir.dingin.pelajaran.1': 'The right steps need to be explained in a way that makes the customer feel heard.',
  'akhir.dingin.pelajaran.2': 'Pointing to the rules without explaining leaves the customer feeling alone.',
  'akhir.dingin.pelajaran.3': 'Close with a summary of the next steps and who will keep them posted.',

  'akhir.tertunda.judul': 'Incomplete Report',
  'akhir.tertunda.ringkas': 'The evidence was incomplete, so Mrs Rina’s report has to be completed later.',
  'akhir.tertunda.pelajaran.1': 'Three pieces of evidence: whole car, damage close-up, and vehicle identity.',
  'akhir.tertunda.pelajaran.2': 'Document before repairs; once repaired, the damage can’t be seen again.',
  'akhir.tertunda.pelajaran.3': 'Adding a photo now is easier than asking the customer to redo it later.',

  'akhir.pergi.judul': 'The Customer Leaves',
  'akhir.pergi.ringkas': 'Mrs Rina left with no direction because she felt ignored or judged too quickly.',
  'akhir.pergi.pelajaran.1': 'Don’t judge the damage or the policy before you’ve seen and read them.',
  'akhir.pergi.pelajaran.2': 'Admitting a misreading is better than digging in.',
  'akhir.pergi.pelajaran.3': 'A customer who leaves with no direction hasn’t been helped, however small the damage.',

  // ------------------------------------------------------------------ ending card v2
  'kartu.tuntas.judul': 'Mrs Rina knows the next step',
  'kartu.janji-waktu.judul': 'Mrs Rina is let down after being promised it’d be sorted tomorrow',
  'kartu.janji-polis.judul': 'Mrs Rina is let down after being promised it’d definitely be paid for',
  'kartu.dingin-singkat.judul': 'Mrs Rina leaves not knowing what to do',
  'kartu.dingin-aturan.judul': 'Mrs Rina leaves without understanding everything',
  'kartu.dingin-jarak.judul': 'Mrs Rina understands, but isn’t at ease',
  'kartu.tertunda.judul': 'Mrs Rina’s report has to be completed later',
  'kartu.pergi.judul': 'Mrs Rina leaves before things are clear',

  'kartu.tuntas-ralat-janji.sebab': 'You corrected a promise that wasn’t certain, so Mrs Rina could make other plans for tomorrow’s order.',
  'kartu.tuntas-ralat-janji.pelajaran': 'Correcting a promise is uncomfortable, but information customers can rely on helps them plan for themselves.',
  'kartu.tuntas-baca-ulang.sebab': 'You admitted the misreading and explained what the card says, so Mrs Rina trusted you again and knows the next step.',
  'kartu.tuntas-baca-ulang.pelajaran': 'Misreadings happen; admitting one and explaining the card as it is helps the customer trust you again.',
  'kartu.tuntas-ralat-saran.sebab': 'You corrected your advice before the car was repaired, so the damage was photographed and reported first.',
  'kartu.tuntas-ralat-saran.pelajaran': 'Documenting and reporting before repairs keeps the damage available for inspection, even when the customer is in a hurry.',
  'kartu.tuntas-lengkapi.sebab': 'You added the missed photos before Mrs Rina left, so her report has the three pieces of evidence it needs.',
  'kartu.tuntas-lengkapi.pelajaran': 'Whole car, damage close-up and number plate: completing the photos now is easier than asking the customer to come back.',
  'kartu.tuntas-pulih.sebab': 'Mrs Rina was tense at first, but you apologised and listened, so she left knowing the next step.',
  'kartu.tuntas-pulih.pelajaran': 'Rushing into procedure can be fixed: admit it, ask how the customer is, then explain the steps honestly.',
  'kartu.tuntas-jelas.sebab': 'The car can’t be fixed straight away, but Mrs Rina knows what happens next and has made other plans.',
  'kartu.tuntas-jelas.pelajaran': 'Photos and a report help the inspection, and “covered, subject to the terms” means the damage is assessed first, not automatically paid for.',

  'kartu.janji-besok.sebab': 'Mrs Rina relied on your word that it would be done tomorrow, even though the timing couldn’t be confirmed.',
  'kartu.janji-besok.pelajaran': 'Reassuring a customer needs information they can rely on; claim timing and outcomes follow the policy and the inspection.',
  'kartu.janji-awal.sebab': 'Mrs Rina relied on your early promise that the car could be used tomorrow, even though the timing couldn’t be confirmed.',
  'kartu.janji-awal.pelajaran': 'An uncertain promise is best corrected before the customer leaves; unwelcome news now is easier than disappointment later.',
  'kartu.janji-polis.sebab': 'Mrs Rina relied on your word that the damage would definitely be paid for, when the card only says covered subject to the terms.',
  'kartu.janji-polis.pelajaran': '“Covered, subject to the terms” means the damage is assessed first; explain the card as it is, not an outcome that isn’t certain.',

  'kartu.dingin-singkat.sebab': 'Her report is recorded, but “we’ll let you know” didn’t tell Mrs Rina what she needs to do next.',
  'kartu.dingin-singkat.pelajaran': 'Close with a summary of the next steps and who will keep the customer posted, so they leave with a clear picture.',
  'kartu.dingin-aturan.sebab': 'Mrs Rina was told to read the card herself, so she left without understanding why part of the loss is still hers.',
  'kartu.dingin-aturan.pelajaran': 'Pointing to the rules without explaining leaves customers feeling alone; explain the deductible in simple, honest words.',
  'kartu.dingin-awal.sebab': 'Mrs Rina understands the steps, but from the start she felt treated like a form, so she isn’t at ease.',
  'kartu.dingin-awal.pelajaran': 'Ask about the customer’s situation and needs first; the right steps are easier to accept when they feel heard.',
  'kartu.dingin-ralat.sebab': 'Mrs Rina understands the steps, but explanations that changed along the way left her not quite at ease.',
  'kartu.dingin-ralat.pelajaran': 'Getting it right from the start is more reassuring than a correction; but if you’re wrong, correcting it beats leaving it.',
  'kartu.dingin-jarak.sebab': 'Mrs Rina understands the steps, but she didn’t feel listened to enough during the conversation.',
  'kartu.dingin-jarak.pelajaran': 'The right steps need to be explained in a way that makes the customer feel heard, not just informed.',

  'kartu.tertunda-bengkel.sebab': 'Mrs Rina’s car was repaired while the only evidence was quick phone photos, so its original condition can’t be photographed again to complete the report.',
  'kartu.tertunda-bengkel.pelajaran': 'Photograph and report before repairs; once damage has been repaired, the inspector can no longer see it.',
  'kartu.tertunda-foto.sebab': 'The missed photos aren’t in the report, so Mrs Rina has to make time again to complete it.',
  'kartu.tertunda-foto.pelajaran': 'Whole car, damage close-up and number plate: adding missing photos there and then saves the customer’s time.',

  'kartu.pergi-sepele.sebab': 'Mrs Rina felt her problem was dismissed before the car was even seen, so she chose to handle it herself.',
  'kartu.pergi-sepele.pelajaran': 'Damage is assessed after it’s seen and recorded, not from a story; listen and check before drawing any conclusion.',
  'kartu.pergi-bertahan.sebab': 'You stuck to a reading that didn’t match the card, so Mrs Rina stopped trusting your explanation.',
  'kartu.pergi-bertahan.pelajaran': 'Misreadings happen; admitting one and rereading the card keeps the customer’s trust better than sticking to your answer.',

  // ================================================================== AKTIVITAS (misi sintetis)
  // --- bukti: parkiran kantor, mobil Bu Rina
  'akt.bukti.judul': 'Three Photos for the Report',
  'akt.bukti.produk': 'AUTO - Motor Vehicle',
  'akt.bukti.lokasi': 'Raksa Office Car Park',
  'akt.bukti.cerita': 'Mrs Rina’s car was hit in the market car park this morning. Its bumper and rear light are dented and cracked.',
  'akt.bukti.instruksi': 'Choose 3 photos that help the inspector.',
  'akt.bukti.labelInteraksi': 'Evidence photos for the report',
  'akt.bukti.pelajaran': 'Evidence should help link the vehicle, the location of the damage, and the incident.',
  'akt.bukti.briefing': 'What catches the eye isn’t always useful for the report.',
  'akt.bukti.tanya': 'Which photos go in Mrs Rina’s report?',
  'akt.bukti.petunjuk': 'Think about what the inspector needs to see: which car it is, and where it’s damaged.',
  'akt.bukti.opsi.foto-menu': 'Catering menu flyer on the window',
  'akt.bukti.opsi.foto-full': 'Photo of the whole car',
  'akt.bukti.opsi.foto-ban': 'Close-up of the front tyre',
  'akt.bukti.opsi.foto-penyok': 'Close-up of the bumper & rear light',
  'akt.bukti.opsi.foto-dasbor': 'Photo of the dashboard through the window',
  'akt.bukti.opsi.foto-plat': 'Photo of the number plate',
  'akt.bukti.bahas.bukti':
    'The whole-car photo shows the vehicle’s condition, the close-up of the bumper & rear light shows the point of damage, and the number plate confirms the right car is being inspected. The front tyre and the dashboard show neither the damage at the rear nor the car’s identity, and the flyer has nothing to do with the incident. None of these three helps the inspection.',
  'akt.bukti.ringkasan': 'Three pieces of evidence linking the vehicle, the point of damage, and its identity.',
  'akt.bukti.kirim': 'Use these photos',
  'akt.bukti.alasan.foto-menu': 'The flyer has nothing to do with the incident.',
  'akt.bukti.alasan.foto-full': 'Shows the vehicle’s overall condition.',
  'akt.bukti.alasan.foto-ban': 'The front tyre shows neither the damage at the rear nor the car’s identity.',
  'akt.bukti.alasan.foto-penyok': 'Shows the point of damage on the bumper and rear light.',
  'akt.bukti.alasan.foto-dasbor': 'The dashboard shows neither the point of damage nor the car’s identity.',
  'akt.bukti.alasan.foto-plat': 'Confirms that the car being inspected really is Mrs Rina’s.',

  // --- polis: meja layanan, kartu polis Bu Rina
  'akt.polis.judul': 'Mrs Rina’s Policy Card',
  'akt.polis.produk': 'AUTO - Motor Vehicle',
  'akt.polis.lokasi': 'Service Desk, {lokasi}',
  'akt.polis.cerita': 'Mrs Rina asks whether her policy can be used for her dented bumper and cracked rear light.',
  'akt.polis.instruksi': 'Choose the explanation that matches what the card says.',
  'akt.polis.labelInteraksi': 'One explanation for Mrs Rina',
  'akt.polis.pelajaran': 'Cover follows the policy card. Read the card before explaining anything to the customer.',
  'akt.polis.briefing': 'The policy card is what your explanation rests on.',
  'akt.polis.tanya': 'What do you tell Mrs Rina?',
  'akt.polis.petunjuk': 'The “Impact damage” line answers Mrs Rina’s question.',
  'akt.polis.opsi.pasti-diganti': 'Your card says “covered”, so the damage to the bumper and rear light will definitely be paid for.',
  'akt.polis.opsi.tidak-tercakup': 'Minor damage like this dent and crack isn’t covered by your policy.',
  'akt.polis.opsi.bisa-dinilai': 'This damage can proceed to assessment under your policy card’s terms.',
  'akt.polis.alasan.pasti-diganti': '“Covered” doesn’t mean definitely paid for; the outcome awaits assessment.',
  'akt.polis.alasan.tidak-tercakup': 'Contradicts the card, which says impact damage is covered, subject to the card terms.',
  'akt.polis.alasan.bisa-dinilai': 'Matches the card: impact damage is covered subject to the terms, so it can proceed to assessment.',
  'akt.polis.kartu.judul': 'Mrs Rina’s Policy Card',
  'akt.polis.kartu.sub': 'Comprehensive (simulation)',
  'akt.polis.kartu.kendaraan.label': 'Vehicle & plate',
  'akt.polis.kartu.kendaraan.nilai': 'Family MPV · B 1726 RN',
  'akt.polis.kartu.benturan.label': 'Impact damage',
  'akt.polis.kartu.benturan.nilai': 'Covered, subject to the card terms',
  'akt.polis.kartu.status.label': 'Policy status',
  'akt.polis.kartu.status.nilai': 'Active',
  'akt.polis.kartu.risiko.label': 'Deductible',
  'akt.polis.kartu.risiko.nilai': 'Applies according to the policy terms',
  'akt.polis.kartu.catatan': 'Simulation card for practice. Real claims follow the policy and Raksa’s inspection.',
  'akt.polis.kartu.sub.arti': 'The name of this type of policy (simulation). What’s covered is read from the card lines below it.',
  'akt.polis.kartu.kendaraan.arti': 'The car this card covers. A photo of the number plate confirms the car being inspected really is this one.',
  'akt.polis.kartu.benturan.arti': 'Damage from an impact, such as being hit, is among what’s covered. “Subject to the card terms” means it’s assessed first, not automatically paid for.',
  'akt.polis.kartu.status.arti': 'Active means the cover on this card is currently in force.',
  'akt.polis.kartu.risiko.arti': 'The part of the loss Mrs Rina still bears herself. The amount follows the policy terms; it isn’t written on this card.',
  'akt.polis.bahas.penjelasan': 'The card says impact damage is covered, subject to the card terms, so this damage can proceed to assessment. “Covered” doesn’t mean “definitely paid for”: the outcome awaits the assessment. “Not covered” contradicts the card.',
  'akt.polis.ringkasan': 'Comprehensive card: impact damage can proceed to assessment under the card terms; it’s not definitely paid for.',
  'akt.polis.kirim': 'Tell Mrs Rina',

  // ================================================================== PENSIUN (teks.id.ts KUNCI_PENSIUN; simpanan lama)
  'b1-mentor.2': 'Our job: listen to the customer, gather information and evidence, then explain the next steps.',
  'b1-mentor.3': 'Oh, and this is a simulation. Real claims still follow the policy and Raksa’s inspection.',
  'b2-cerita.4': 'I popped in to do some shopping. When I got back, the bumper was dented and whoever did it was gone.',
  'b2-singkat.1': 'Got hit in the market car park this morning. The driver left.',
  'b3-bukti-intro.4': 'Just three photos, {nama}. What does the inspector need to see to confirm the car and its damage?',
  'akt.polis.opsi.ambang-tlo': 'Under the card terms, this damage is only covered if it reaches 75% of the car’s value.',
  // v2: umpan balik foto per bukti -> satu kalimat mentor; alasan per foto kini di panel (akt.bukti.alasan.*).
  'b3-bukti.hasil.2.1': 'There’s no photo of the whole car yet. That’s what shows the vehicle’s overall condition.',
  'b3-bukti.hasil.2.2': 'No close-up of the bumper and rear light yet. That’s where the damage is.',
  'b3-bukti.hasil.2.3': 'No photo of the number plate yet. Without it, it’s hard to confirm which car is being inspected.',
};
