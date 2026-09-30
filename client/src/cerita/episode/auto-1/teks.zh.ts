/**
 * EPISODE AUTO-1 "Baret di Parkiran" - 简体中文 (terjemahan dari teks.id.ts; kunci & parameter {nama}/{lokasi} SAMA).
 * DRAF, belum ditinjau penutur asli / PIC Claim. Perubahan materi klaim dari PIC Claim ditulis di teks
 * Indonesia dulu, lalu diterjemahkan ulang di sini.
 *
 * Catatan penerjemahan:
 * - Istilah mengikuti shared/i18n/misi.zh.ts, kamus UI, dan shared/i18n/acara/*: risiko sendiri = 免赔额
 *   (m09), pemeriksaan = 查勘 (catatanSimulasiPeriksa), pemeriksa = 查勘员, dinilai / penilaian = 评估
 *   (m05), kartu polis = 保单卡, "Tercakup sesuai syarat kartu" = 按卡片条款属于保障范围 (m05), kerusakan
 *   benturan = 碰撞损坏, ketentuan polis = 保单条款, lapor = 报案 (m01), laporan = 报案 / 报案资料,
 *   laporan tercatat = 报案已记录 (bukan 登记, yang bisa terbaca sebagai nomor registrasi resmi),
 *   bengkel = 修理厂, plat nomor = 车牌, nasabah = 客户, petugas layanan klaim = 理赔服务专员 (pintuCeritaIsi).
 *   Comprehensive tidak diterjemahkan (m05). TLO tidak lagi dipakai naskah v2 (hanya kunci pensiun).
 * - Istilah v2 (`istilah.<id>.label`) = kata PERSIS seperti tertulis di baris yang diberi tombol "Apa itu …?":
 *   nasabah = 客户, klaim = 理赔, polis = 保单, risiko sendiri = 免赔额.
 * - "Pasti diganti" = 一定会赔 (bukan 保障, supaya tidak rancu dengan baris kartu 属于保障范围).
 *   "Bisa dilanjutkan untuk dinilai" = 可以继续评估 (m05 可以继续进行…评估). "Langkah perbaikan mengikuti hasil
 *   penilaian" = 维修安排以评估结果为准 (tidak menyiratkan perbaikan pasti dijamin).
 * - Judul akhir "Laporan Tertunda" = 报案资料待补充 (BUKAN 报案延误 = terlambat melapor, konsep lain).
 * - Bu Rina = "Rina 女士" (pola episode uji: "Uji 女士"). Pemain menyapa Rina 女士 dengan "您"; Miss Raksa
 *   menyapa pemain dengan "你" / {nama}; tidak ada sapaan bergender untuk pemain.
 * - Spasi di antara aksara Han dan huruf Latin/angka ("Rina 女士", "150 份"), tidak di samping tanda baca
 *   lebar penuh, seperti misi.zh.ts. Bilangan yang di sumber ditulis dengan kata tetap kata (三, 百分之七十五);
 *   angka ("150", "3", "75%", "1726") sama persis (dijaga validasiEpisode).
 */
export const TEKS_ZH: Record<string, string> = {
  // ------------------------------------------------------------------ episode & pemeran
  'ep.judul': '停车场里的剐蹭',
  'ep.ringkas':
    'Rina 女士的车在市场停车场被剐蹭了，可她明天一早还要送 150 份盒饭。倾听她的讲述，收集证据，如实说明接下来的步骤。',

  'pemeran.nasabah.nama': 'Rina 女士',
  'pemeran.nasabah.peran': '客户',
  'pemeran.missRaksa.nama': 'Miss Raksa',
  'pemeran.missRaksa.peran': '资深理赔专员',

  // ------------------------------------------------------------------ bab
  'bab.menyambut.judul': '接待客户',
  'bab.menyambut.tujuan': '了解 Rina 女士遇到的问题。',
  'bab.menggali.judul': '了解经过',
  'bab.menggali.tujuan': '问清事情经过，再建议第一步。',
  'bab.bukti.judul': '收集证据',
  'bab.bukti.tujuan': '收集查勘员需要的证据。',
  'bab.polis.judul': '阅读保单',
  'bab.polis.tujuan': '看懂保单卡，再准确说明。',
  'bab.menutup.judul': '结束服务',
  'bab.menutup.tujuan': '如实说明接下来的步骤。',

  // ------------------------------------------------------------------ suasana nasabah
  'suasana.tenang': '平静',
  'suasana.mulai-tenang': '渐渐平静',
  'suasana.cemas': '担心',
  'suasana.kesal': '恼火',

  // ------------------------------------------------------------------ kejelasan (paham)
  'paham.langkah-sekarang': '现在先记录并报案，车暂时不修。',
  'paham.polis-dinilai': '损坏可以按卡片条款继续评估，不是一定会赔。',
  'paham.risiko-sendiri': '按保单，部分损失仍由她自己承担（免赔额）。',
  'paham.langkah-berikut': '报案已记录，按保单查勘并评估损坏；维修安排以评估结果为准。',

  // ------------------------------------------------------------------ ketepatan langkah klaim (proses)
  'proses.dokumentasi-dulu': '维修前先记录并报案',
  'proses.bukti': '三项证据：车辆全景、损坏细节、车辆身份',
  'proses.baca-polis': '准确解读保单卡',
  'proses.tanpa-janji': '不承诺结果或时间',

  // ------------------------------------------------------------------ catatan kasus
  'catatan.masalah': '今早在市场停车场被剐蹭，肇事者已离开。保险杠和尾灯凹陷、破裂。',
  'catatan.kebutuhan': '明天一早要送 150 份盒饭。',
  'catatan.bagian-disimpan': '灯罩碎片放在后备箱里，没有扔掉。',
  'catatan.rencana-bengkel': '打算今天中午直接去修理厂。',
  'catatan.bukti': '证据照片已在办公室停车场拍摄。',
  'catatan.bukti-lengkap': 'Rina 女士离开前已补拍照片：车辆全景、保险杠和尾灯近照、车牌。',
  'catatan.bukti-kurang': '照片不全：漏掉的照片没有补拍。',
  'catatan.polis': 'Comprehensive（模拟），有效。碰撞损坏按卡片条款属于保障范围；免赔额按保单规定。',

  // ------------------------------------------------------------------ istilah (v2; label = kata seperti tertulis di baris)
  'istilah.nasabah.label': '客户',
  'istilah.nasabah.arti': '买了保险、受保险保障的人。在这个故事里：Rina 女士。',
  'istilah.klaim.label': '理赔',
  'istilah.klaim.arti': '客户向保险公司报告损失、请求处理。结果以保障文件（保单）和查勘为准。',
  'istilah.polis.label': '保单',
  'istilah.polis.arti': '说明保险保障内容和条件的文件。保单卡是它的摘要。',
  'istilah.comprehensive.label': 'Comprehensive',
  'istilah.comprehensive.arti': '模拟中 Rina 女士的保单类型。在她的卡上，碰撞损坏按卡片条款属于保障范围。',
  'istilah.risiko-sendiri.label': '免赔额',
  'istilah.risiko-sendiri.arti': '损失中仍由客户自己承担的部分。金额按保单条款确定。',

  // ================================================================== BAB 1 - MENYAMBUT
  'b1-mentor.1': '早上好，{nama}。今天你在 {lokasi} 的服务台值班，我就在你旁边。这是模拟练习。',
  'b1-mentor.4': '门开了。一位客户匆匆走进来，把车钥匙放在桌上。',

  'b1-datang.1': '早。我的车刚才在市场停车场被人剐了，那人直接开走了。',
  'b1-datang.2': '后保险杠凹了，尾灯也裂了。明天一早我还得送 150 份盒饭。',
  'b1-datang.tanya': '你先说什么？',
  'b1-datang.prosedur': '好的。我需要先拿到您的保险资料和损坏照片。',
  'b1-datang.dengar': '您本人没事吧？先喘口气，再从头慢慢说。',
  'b1-datang.janji': '别担心，我们会帮您处理好。明天车肯定能用。',
  'b1-datang.prosedur.alasan': 'Rina 女士更紧张了：她是带着难题来的，可你先问的却是她的保险资料。',
  'b1-datang.dengar.alasan': 'Rina 女士开始平静下来，因为你先关心了她的情况。',
  'b1-datang.janji.alasan': '听到这个承诺，Rina 女士松了口气，但结果和时间其实还无法确定。',

  'b1-pulih.1': '等一下。我现在心里很乱，不只是来填表的。',
  'b1-pulih.2': '（小声）资料可以晚点再补，{nama}。她现在最需要的是什么？',
  'b1-pulih.tanya': '你怎么回应？',
  'b1-pulih.maaf': '抱歉，是我太急了。您没事吧？先说说发生了什么。',
  'b1-pulih.tetap': '我明白。为了快一点，我们先把资料填好吧。',
  'b1-pulih.maaf.alasan': 'Rina 女士的态度缓和了，因为你承认自己太急，还关心了她的情况。',
  'b1-pulih.tetap.alasan': 'Rina 女士照做了，但只答必要的：她觉得自己只被当成一张表格。',

  // ================================================================== BAB 2 - MENGGALI
  'b2-cerita.1': '谢天谢地。明天那单很大，我不能取消。',
  'b2-cerita.2': '嗯，不好意思，我也有点慌。好，从头说。',
  'b2-cerita.3': '我没事，就是吓了一跳。谢谢你关心。',
  'b2-cerita.5': '我刚才去买了一会儿东西。用手机随手拍了几张；本来打算今天中午直接去修理厂。',
  'b2-cerita.6': '对了，灯罩碎片我捡起来了，放在后备箱里。',

  'b2-singkat.2': '保险杠和尾灯。照片拍了。等下我就去修理厂。',

  'b2-saran.1': '说白了，我直接去修理厂就行了吧？理赔的事以后再说，我时间不多。',
  'b2-saran.2': '那我直接去修理厂就好了吧？理赔的事以后再说，明天车必须能上路。',
  'b2-saran.tanya': '你给什么建议？',
  'b2-saran.bengkel': '既然这么急，就先修吧。理赔可以之后再办。',
  'b2-saran.dokumentasi': '去修理厂之前，我们先拍照报案，把车况记录下来。',
  'b2-saran.ringan': '如果只是剐蹭，也许不用理赔。车还能开，对吧？',
  'b2-saran.bengkel.alasan': 'Rina 女士很高兴能直接去修理厂，但损坏情况还没有记录下来。',
  'b2-saran.dokumentasi.alasan': 'Rina 女士点点头，因为你解释了为什么修车前要先把车况记录下来。',
  'b2-saran.ringan.alasan': 'Rina 女士有些不快，因为你还没看车，就把损坏说得无关紧要。',

  'b2-bengkel-akibat.1': '等一下，{nama}。现在就修的话，损坏情况就再也看不到了。',
  'b2-bengkel-akibat.2': '啊？那到底怎么办？刚才不是说可以吗？',
  'b2-bengkel-akibat.tanya': '你怎么做？',
  'b2-bengkel-akibat.biarkan': '您手机里那几张照片就够了。去修理厂吧。',
  'b2-bengkel-akibat.koreksi': '抱歉，我刚才的建议不对。我们先拍照报案，再去修理厂。',
  'b2-bengkel-akibat.biarkan.alasan': 'Rina 女士很高兴能马上走，但随手拍的照片对查勘员来说不一定够用。',
  'b2-bengkel-akibat.koreksi.alasan': '你的建议变了，Rina 女士一时有点糊涂，但她感谢你及时纠正。',

  'b2-ringan-akibat.1': '不用？怎么会？凹得挺厉害的，尾灯也裂了。',
  'b2-ringan-akibat.2': '（小声）你亲眼看过损坏情况了吗，{nama}？',
  'b2-ringan-akibat.tanya': '你怎么回应？',
  'b2-ringan-akibat.lihat-dulu': '您说得对，是我判断得太快了。我们先去看看车好吗？',
  'b2-ringan-akibat.tetap-ringan': '听您的描述，损坏不大。还是别再折腾了，免得您麻烦。',
  'b2-ringan-akibat.lihat-dulu.alasan': 'Rina 女士稍微松了口气，因为你承认判断太快，并愿意亲自去看。',
  'b2-ringan-akibat.tetap-ringan.alasan': 'Rina 女士觉得自己的问题被轻视了，而你连车都还没看。',

  // ================================================================== BAB 3 - BUKTI
  'b3-bukti-intro.1': '你们来到办公室停车场。Rina 女士的车就停在门口附近。',
  'b3-bukti-intro.2': '后备箱里的灯罩碎片请继续留着。损坏的部件先别扔。',
  'b3-bukti-intro.3': '快点吧。我还得去修理厂。',

  'b3-bukti.1': '请吧，我在这儿等。',
  'b3-bukti.hasil.1.1': '很好。有了这三张照片，查勘员就能确认是哪辆车、损坏在哪里。',
  'b3-bukti.hasil.2.4': '看不出损坏部位或车辆身份的照片，帮不了查勘员。',
  'b3-bukti.hasil.2.5': '报案资料还不完整：查勘员需要的证据还有没拍到的。',

  'b3-bukti-tepat.1': '连车牌也要拍？这明明就是我的车啊。',
  'b3-bukti-tepat.2': '正因为这样。车牌能确认查勘的确实是您的车。',
  'b3-bukti-tepat.3': '哦，原来如此。有道理。',

  'b3-bukti-kurang.1': '这样够了吧？我不能待太久。',
  'b3-bukti-kurang.tanya': '你怎么做？',
  'b3-bukti-kurang.lengkapi': '我们现在把缺的照片补上好吗？很快就好。',
  'b3-bukti-kurang.cukup': '够了。就用现有的照片吧，免得您迟到。',
  'b3-bukti-kurang.lengkapi.alasan': 'Rina 女士多等了一会儿，她的报案资料现在有了所需的证据。',
  'b3-bukti-kurang.cukup.alasan': 'Rina 女士并不介意，但她的报案资料证据不全。',
  'b3-lengkapi.1': '你补拍了刚才漏掉的照片。现在报案资料有了三项证据：车辆全景、保险杠和尾灯近照，还有车牌。',
  'b3-lengkapi.2': '哦，原来缺的是这些。幸好现在一起补上了。',
  'b3-cukup.1': '谢谢，这样快多了。',
  'b3-cukup.2': '（小声）漏掉的照片不在报案资料里，{nama}。如果之后要补，Rina 女士还得再抽时间。',

  'b3-seadanya.1': '好，我现在就把手机里的照片发过去。然后直接去修理厂。',
  'b3-seadanya.2': '报案用的是随手拍的照片：有点模糊，也看不到车牌。',

  // ================================================================== BAB 4 - POLIS
  'b4-polis-intro.1': '你们回到服务台。你打开了 Rina 女士保障文件的摘要：她的 Comprehensive 保单卡。',
  'b4-polis-intro.2': '趁 Rina 女士出发前，你打开了她保障文件的摘要：Comprehensive 保单卡。',
  'b4-polis-intro.3': '刚才说会帮我处理好。那我的保单能用，对吧？',
  'b4-polis-intro.4': '我的保单能用吧？我可是每年都交保费的。',

  'b4-polis.1': '（小声）Rina 女士希望听到“可以”，{nama}。但还是要照卡上写的说。',
  'b4-polis.hasil.1.1': '要先评估啊。好吧，至少能继续处理。',
  'b4-polis.hasil.1.2': '说得对。卡上写的是按条款属于保障范围，不是自动就赔。',
  'b4-polis.hasil.1.alasan': 'Rina 女士更安心了，因为你的说明和卡上一致：损坏可以继续评估。',
  'b4-polis.hasil.2.1': '一定会赔？太好了！',
  'b4-polis.hasil.2.2': '（小声）卡上写的是“按卡片条款属于保障范围”。这和“一定”是一回事吗？',
  'b4-polis.hasil.2.alasan': '听到“一定会赔”，Rina 女士松了口气，但结果其实还要等评估。',
  'b4-polis.hasil.3.1': '不在保障范围？那我交保费是为了什么？',
  'b4-polis.hasil.3.alasan': 'Rina 女士非常失望：你的说明让她觉得这份保单白买了。',
  'b4-polis.hasil.4.1': '百分之七十五？我的车只是凹了，又不是撞烂了。',
  'b4-polis.hasil.4.2': '那到底怎么样？我还没得到答复。',
  'b4-polis.hasil.4.alasan': 'Rina 女士很困惑，因为她还没听到与卡片相符的说明。',

  'b4-polis-tepat.1': '还有这个，“免赔额按保单条款适用”。这是什么意思？',
  'b4-polis-tepat.2': '有一部分损失仍由您自己承担。具体金额按保单条款确定。',
  'b4-polis-tepat.3': '所以还是得自掏腰包一部分。嗯。',

  'b4-polis-janji.1': '既然一定会赔，我就放心了。少了一桩心事。',
  'b4-polis-janji.2': '这是今天早上 Rina 女士第一次露出笑容。',

  'b4-polis-salah.1': '{nama}，再看一遍卡上“碰撞损坏”那一行。',
  'b4-polis-salah.2': '那到底哪个对？我要的是答案，不是猜测。',
  'b4-polis-salah.tanya': '你怎么做？',
  'b4-polis-salah.bertahan': '我刚才已经仔细看过了。为了不让您糊涂，我的结论不变。',
  'b4-polis-salah.baca-ulang': '抱歉，我看错了。碰撞损坏按卡片条款属于保障范围，所以可以进行评估。',
  'b4-polis-salah.bertahan.alasan': 'Rina 女士不再信任你，因为你坚持一个与卡片不符的解读。',
  'b4-polis-salah.baca-ulang.alasan': 'Rina 女士重新平静下来，因为你承认看错，并解释了卡上的内容。',

  // ================================================================== BAB 5 - MENUTUP
  'b5-keberatan.1': '刚才说一定会赔。那明天我的车就能用了，对吧？',
  'b5-keberatan.2': '刚才说明天肯定能用。那我等着就行了，对吧？',
  'b5-keberatan.3': '刚才说的免赔额，应该没什么问题吧？',
  'b5-keberatan.4': '对了，卡上的“免赔额”是什么？没什么影响吧？',
  'b5-keberatan.5': '好。那我的车什么时候能修好？明天一早就得送货了。',
  'b5-keberatan.6': '还有刚才的免赔额，为什么我还得自己承担一部分？',
  'b5-keberatan.7': '还有，卡上写着“免赔额”。那是什么意思？',
  'b5-keberatan.8': '我的车今天中午就直接去修理厂了。那理赔什么时候能办好？',
  'b5-keberatan.tanya': '你怎么回答？',
  'b5-keberatan.janjikan': '我尽量明天就办好。我会帮您催一催流程，免得您等太久。',
  'b5-keberatan.aturan': '这是保单条款规定的。您的卡上都写着，请您再看一遍，自己确认一下。',
  'b5-keberatan.aturan-janji': '这是保单条款规定的。您的卡上都写着，请您再看一遍，自己确认一下。',
  'b5-keberatan.jujur': '明天能不能好，我现在没法确定。要先按保单查勘，而且有一部分损失仍由您承担。',
  'b5-keberatan.ralat-janji': '抱歉，我得更正一下：结果和时间都还不确定，而且有一部分损失仍由您承担。',
  'b5-keberatan.janjikan.alasan': '得到“明天办好”的承诺，Rina 女士很高兴，但时间其实还无法确定。',
  'b5-keberatan.aturan.alasan': 'Rina 女士觉得被丢下不管，因为你只让她自己看卡，却不解释。',
  'b5-keberatan.aturan-janji.alasan': 'Rina 女士觉得被丢下不管，因为你只让她自己看卡，却不解释。',
  'b5-keberatan.jujur.alasan': 'Rina 女士感谢你的坦诚：消息不太好，但她清楚了自己要面对什么。',
  'b5-keberatan.ralat-janji.alasan': '承诺被收回，Rina 女士很失望，但现在她知道了真实情况。',
  'b5-keberatan.ralat-polis': '抱歉，是我说错了：这次损坏要先按条款评估，不是一定会赔。时间还不确定，而且有一部分损失仍由您承担。',
  'b5-keberatan.ralat-polis.alasan': '消息变了，Rina 女士很失望，但现在她看懂了保单卡，也知道了真实情况。',

  'b5-tutup.1': '这才对嘛。我可记住你的承诺了。',
  'b5-tutup.2': '嗯。不太中听，但我宁愿听实话。',
  'b5-tutup.3': '怎么又变了……算了。现在知道总比明天才知道好。',
  'b5-tutup.4': '让我自己看？我来这儿就是想听你们解释的。',
  'b5-tutup.5': '那接下来我该怎么做？',
  'b5-tutup.tanya': '你怎么收尾？',
  'b5-tutup.rangkum': '您的报案已记录。接下来按保单查勘并评估损坏；维修安排以评估结果为准。如有需要补充的，我会通知您。',
  'b5-tutup.singkat': '您说的情况我都完整记下了，您不用再操心。在家等着就行，之后会通知您。',
  'b5-tutup.rangkum.alasan': 'Rina 女士安心了一些，因为你总结了步骤，也说明了谁会联系她。',
  'b5-tutup.singkat.alasan': 'Rina 女士仍然一头雾水：“之后会通知您”并没有说明下一步。',
  'b5-rangkum.1': '好。所以先评估，维修要看评估结果。我记下了。',
  'b5-rangkum.2': '好好好。可明天就能办好，对吧？刚才可是答应了的。',
  'b5-rangkum.3': '好好好。可一定会赔，对吧？刚才可是这么说的。',
  'b5-rangkum.4': '要先评估？可我的车今天中午还是要去修理厂的吧？刚才说可以的。',

  // ================================================================== AKHIR
  'akhir-tuntas.1': '好吧，车没法马上修好。明天我借妹妹的车去送货。',
  'akhir-tuntas.2': '谢谢你从一开始就说得这么清楚。现在我知道该怎么做了。',
  'akhir-tuntas.3': '一开始有点卡壳，但你扳回来了。这也是一种本事，{nama}。',
  'akhir-tuntas.4': '更正承诺并不好受，{nama}，但正因如此，她才能信任你。',
  'akhir-tuntas.5': '做得好，{nama}。她没有得到期望的一切，但离开时心里有数了。',
  'akhir-tuntas.6': '谢谢你愿意更正。现在我知道该怎么做了。',

  'akhir-janji.1': '谢谢啊。听你这么说我就放心了。',
  'akhir-janji.2': '几天后，Rina 女士打来电话。',
  'akhir-janji.3': '说好第二天就能办好。我都已经答应客户了，结果手忙脚乱。',
  'akhir-janji.4': '说好一定会赔。结果还在评估，而且有一部分还得我自己承担。',
  'akhir-janji.5': '她在我们服务台前很开心，{nama}，事后却很失望。脱离流程的承诺，只会把失望往后推。',

  'akhir-dingin.1': '行吧。我先走了。',
  'akhir-dingin.2': '好的，谢谢。',
  'akhir-dingin.3': 'Rina 女士的报案已记录，但她离开时依然眉头紧锁。',
  'akhir-dingin.4': '报案在推进，{nama}，但她走的时候还没完全弄明白。漏掉了什么？',
  'akhir-dingin.5': '步骤很清楚，{nama}，但她并没有觉得被倾听。距离是从什么时候开始的？',
  'akhir-dingin.6': '“之后会通知您”并没有回答她的问题，{nama}：接下来她该做什么？在她离开前，把步骤总结一下。',

  'akhir-tertunda.1': '当天中午，Rina 女士的车就直接在修理厂修了。',
  'akhir-tertunda.2': '后来报案资料需要补充，但修理前的状况已经无法重新拍照了。',
  'akhir-tertunda.3': '车都已经修好了。原来的样子还上哪儿去拍？',
  'akhir-tertunda.4': '后来，Rina 女士的报案资料还需要补上缺少的照片。',
  'akhir-tertunda.5': '为什么不趁我在那儿的时候一起拍？现在我还得再抽时间。',
  'akhir-tertunda.6': '一开始就把证据收齐，能节省每个人的时间，{nama}。尤其是客户的。',
  'akhir-tertunda.7': '刚才是说过有缺的会通知我。可为什么不趁我在那儿的时候一起拍？',

  'akhir-pergi.1': '行吧，既然觉得是小事，那我自己处理。',
  'akhir-pergi.2': '连保单都这样解读，我还是去别处问吧。',
  'akhir-pergi.3': 'Rina 女士没有报案就走了，也不知道下一步该怎么做。',
  'akhir-pergi.4': 'Rina 女士一脸失望地离开了，不知道下一步该怎么做。',
  'akhir-pergi.5': '损坏要亲眼看过才能评估，{nama}，不能只凭描述。我们再试一次吧。',
  'akhir-pergi.6': '看错是难免的，{nama}。让她离开的，是固执己见。我们再试一次吧。',

  // ------------------------------------------------------------------ info akhir
  'akhir.tuntas.judul': '被倾听，也说清楚了',
  'akhir.tuntas.ringkas': '车没法马上修好，但 Rina 女士被倾听了，清楚了步骤，也准备好了备用方案。',
  'akhir.tuntas.pelajaran.1': '先关心客户的状况和需求，之后收集资料会更顺利。',
  'akhir.tuntas.pelajaran.2': '维修前先记录、先报案，才能保留事故的痕迹。',
  'akhir.tuntas.pelajaran.3': '实话实说：按保单评估；保单有规定的，就有免赔额；时间暂时无法确定。',

  'akhir.janji.judul': '一时的安心',
  'akhir.janji.ringkas': 'Rina 女士高高兴兴地回去了，但与流程不符的承诺最后变成了失望。',
  'akhir.janji.pelajaran.1': '客户高兴，不代表步骤就对了。',
  'akhir.janji.pelajaran.2': '理赔结果和时间以保单和查勘为准，别在服务台上承诺。',
  'akhir.janji.pelajaran.3': '已经许下承诺？尽快更正。现在尴尬一点，总比以后失望好。',

  'akhir.dingin.judul': '做对了，却有距离',
  'akhir.dingin.ringkas': '报案在推进，但 Rina 女士回去时仍有疑虑，或没有完全弄明白。',
  'akhir.dingin.pelajaran.1': '正确的步骤，也要用让客户感到被倾听的方式来说明。',
  'akhir.dingin.pelajaran.2': '只搬出规定而不解释，会让客户觉得孤立无援。',
  'akhir.dingin.pelajaran.3': '最后总结下一步，并说明由谁来联系客户。',

  'akhir.tertunda.judul': '报案资料待补充',
  'akhir.tertunda.ringkas': '证据不全，Rina 女士的报案资料只能事后补充。',
  'akhir.tertunda.pelajaran.1': '三项证据：车辆全景、损坏细节和车辆身份。',
  'akhir.tertunda.pelajaran.2': '维修前先记录；修好之后，原来的损坏就看不到了。',
  'akhir.tertunda.pelajaran.3': '现在多拍一张，总比以后让客户重来一遍轻松。',

  'akhir.pergi.judul': '客户走了',
  'akhir.pergi.ringkas': 'Rina 女士觉得被忽视或被草率判断，茫然地离开了。',
  'akhir.pergi.pelajaran.1': '没看过损坏、没读过保单之前，不要下结论。',
  'akhir.pergi.pelajaran.2': '承认看错，好过固执己见。',
  'akhir.pergi.pelajaran.3': '客户若茫然离开，就没有得到帮助，无论损坏多小。',

  // ------------------------------------------------------------------ 结局卡 v2
  'kartu.tuntas.judul': 'Rina 女士知道下一步了',
  'kartu.janji-waktu.judul': '被承诺“明天办好”后，Rina 女士很失望',
  'kartu.janji-polis.judul': '被承诺“一定会赔”后，Rina 女士很失望',
  'kartu.dingin-singkat.judul': 'Rina 女士离开时不知道该做什么',
  'kartu.dingin-aturan.judul': 'Rina 女士离开时还没完全明白',
  'kartu.dingin-jarak.judul': 'Rina 女士明白了，但还不安心',
  'kartu.tertunda.judul': 'Rina 女士的报案资料之后还要补充',
  'kartu.pergi.judul': '事情还没说清楚，Rina 女士就走了',

  'kartu.tuntas-ralat-janji.sebab': '你更正了还不确定的承诺，所以 Rina 女士能为明天的订单另作安排。',
  'kartu.tuntas-ralat-janji.pelajaran': '更正承诺并不舒服，但可靠的信息能帮助客户自己安排计划。',
  'kartu.tuntas-baca-ulang.sebab': '你承认看错并说明了卡上的内容，所以 Rina 女士重新信任你，也知道下一步。',
  'kartu.tuntas-baca-ulang.pelajaran': '看错难免；承认错误，再如实说明卡上的内容，客户会重新信任你。',
  'kartu.tuntas-ralat-saran.sebab': '你在修车之前更正了建议，所以损坏先拍了照、报了案。',
  'kartu.tuntas-ralat-saran.pelajaran': '维修前先记录、先报案，即使客户赶时间，损坏状况也仍然可以查勘。',
  'kartu.tuntas-lengkapi.sebab': '你在 Rina 女士离开前补拍了漏掉的照片，所以报案资料有了需要的三项证据。',
  'kartu.tuntas-lengkapi.pelajaran': '车辆全景、损坏细节和车牌：现在补齐照片，比以后请客户再来一趟轻松。',
  'kartu.tuntas-pulih.sebab': '一开始 Rina 女士很紧张，但你道歉并认真倾听，所以她离开时知道下一步。',
  'kartu.tuntas-pulih.pelajaran': '太快进入流程是可以补救的：承认，问问客户的状况，再如实说明步骤。',
  'kartu.tuntas-jelas.sebab': '车没法马上修好，但 Rina 女士知道接下来会怎样，也另作了安排。',
  'kartu.tuntas-jelas.pelajaran': '照片和报案有助于查勘；“按条款属于保障范围”意思是先评估损坏，不是自动就赔。',

  'kartu.janji-besok.sebab': 'Rina 女士相信了你说的“明天办好”，但时间其实还无法确定。',
  'kartu.janji-besok.pelajaran': '安抚客户要配上可靠的信息；理赔的时间和结果以保单和查勘为准。',
  'kartu.janji-awal.sebab': 'Rina 女士相信了你一开始说的“明天车就能用”，但时间其实还无法确定。',
  'kartu.janji-awal.pelajaran': '不确定的承诺，最好在客户离开前更正；现在听到坏消息，总比以后失望好。',
  'kartu.janji-polis.sebab': 'Rina 女士相信了你说的“一定会赔”，但卡上只写着按条款属于保障范围。',
  'kartu.janji-polis.pelajaran': '“按条款属于保障范围”意思是先评估损坏；如实说明卡上的内容，别说还不确定的结果。',

  'kartu.dingin-singkat.sebab': '报案已记录，但“之后会通知您”没有告诉 Rina 女士接下来该做什么。',
  'kartu.dingin-singkat.pelajaran': '结束服务时总结下一步，并说明由谁来联系，让客户清清楚楚地离开。',
  'kartu.dingin-aturan.sebab': 'Rina 女士被要求自己去读卡片，所以她离开时还不明白为什么部分损失仍由她承担。',
  'kartu.dingin-aturan.pelajaran': '只搬出规定而不解释，会让客户觉得孤立无援；用简单、诚实的话解释免赔额。',
  'kartu.dingin-awal.sebab': 'Rina 女士明白了步骤，但从一开始她就觉得自己只被当成一张表格，所以还不安心。',
  'kartu.dingin-awal.pelajaran': '先关心客户的状况和需求；客户觉得被倾听时，正确的步骤更容易被接受。',
  'kartu.dingin-ralat.sebab': 'Rina 女士明白了步骤，但中途改变的说明让她还不完全安心。',
  'kartu.dingin-ralat.pelajaran': '一开始就说对，比事后更正更让人安心；但如果说错了，更正总比放着不管好。',
  'kartu.dingin-jarak.sebab': 'Rina 女士明白了步骤，但对话中她没有感到自己被充分倾听。',
  'kartu.dingin-jarak.pelajaran': '正确的步骤，也要用让客户感到被倾听的方式来说明，而不只是告知。',

  'kartu.tertunda-bengkel.sebab': 'Rina 女士的车在只有随手拍照片的时候就修好了，所以原来的状况无法再拍照来补充报案资料。',
  'kartu.tertunda-bengkel.pelajaran': '维修前先拍照、先报案；损坏修好之后，查勘员就再也看不到了。',
  'kartu.tertunda-foto.sebab': '漏掉的照片不在报案资料里，所以 Rina 女士还得再抽时间来补。',
  'kartu.tertunda-foto.pelajaran': '车辆全景、损坏细节和车牌：当场补拍缺少的照片，能节省客户的时间。',

  'kartu.pergi-sepele.sebab': '车还没看，Rina 女士就觉得自己的问题被轻视了，所以她决定自己处理。',
  'kartu.pergi-sepele.pelajaran': '损坏要在查看并记录后评估，而不是凭描述判断；先倾听、先查看，再下任何结论。',
  'kartu.pergi-bertahan.sebab': '你坚持一个与卡片不符的解读，所以 Rina 女士不再相信你的说明。',
  'kartu.pergi-bertahan.pelajaran': '看错难免；承认并重新读卡，比固执己见更能留住客户的信任。',

  // ================================================================== AKTIVITAS (misi sintetis)
  // --- bukti: parkiran kantor, mobil Bu Rina
  'akt.bukti.judul': '报案用的三张照片',
  'akt.bukti.produk': 'AUTO - 机动车辆',
  'akt.bukti.lokasi': 'Raksa 办公室停车场',
  'akt.bukti.cerita': 'Rina 女士的车今早在市场停车场被剐蹭，保险杠凹陷，尾灯破裂。',
  'akt.bukti.instruksi': '选出 3 张对查勘员有帮助的照片。',
  'akt.bukti.labelInteraksi': '报案用的证据照片',
  'akt.bukti.pelajaran': '证据应当能把车辆、损坏部位和事故联系起来。',
  'akt.bukti.briefing': '吸引眼球的，不一定对报案有用。',
  'akt.bukti.tanya': '哪些照片放进 Rina 女士的报案资料？',
  'akt.bukti.petunjuk': '想想查勘员需要看到什么：是哪辆车，损坏在哪里。',
  'akt.bukti.opsi.foto-menu': '车窗上的菜单传单',
  'akt.bukti.opsi.foto-full': '车辆全景照片',
  'akt.bukti.opsi.foto-ban': '前轮近照',
  'akt.bukti.opsi.foto-penyok': '保险杠和尾灯近照',
  'akt.bukti.opsi.foto-dasbor': '透过车窗拍的仪表盘',
  'akt.bukti.opsi.foto-plat': '车牌照片',
  'akt.bukti.bahas.bukti':
    '车辆全景照片展示车况，保险杠和尾灯近照展示损坏部位，车牌能确认查勘的车辆没有弄错。前轮和仪表盘既看不出车尾的损坏部位，也看不出车辆身份；传单则与事故无关。这三张对查勘都没有帮助。',
  'akt.bukti.ringkasan': '三项证据，把车辆、损坏部位和车辆身份联系起来。',
  'akt.bukti.kirim': '就用这些照片',
  'akt.bukti.alasan.foto-menu': '传单与事故无关。',
  'akt.bukti.alasan.foto-full': '展示车辆的整体状况。',
  'akt.bukti.alasan.foto-ban': '前轮既看不出车尾的损坏部位，也看不出车辆身份。',
  'akt.bukti.alasan.foto-penyok': '展示保险杠和尾灯上的损坏部位。',
  'akt.bukti.alasan.foto-dasbor': '仪表盘既看不出损坏部位，也看不出车辆身份。',
  'akt.bukti.alasan.foto-plat': '确认查勘的确实是 Rina 女士的车。',

  // --- polis: meja layanan, kartu polis Bu Rina
  'akt.polis.judul': 'Rina 女士的保单卡',
  'akt.polis.produk': 'AUTO - 机动车辆',
  'akt.polis.lokasi': '{lokasi} 服务台',
  'akt.polis.cerita': 'Rina 女士问，她的保单能不能用于凹陷的保险杠和破裂的尾灯。',
  'akt.polis.instruksi': '选出与卡上内容相符的说明。',
  'akt.polis.labelInteraksi': '给 Rina 女士的一个说明',
  'akt.polis.pelajaran': '保障以保单卡为准。向客户说明之前，先把卡看清楚。',
  'akt.polis.briefing': '保单卡是你解释的依据。',
  'akt.polis.tanya': '你怎么跟 Rina 女士说？',
  'akt.polis.petunjuk': '“碰撞损坏”那一行回答了 Rina 女士的问题。',
  'akt.polis.opsi.pasti-diganti': '您的卡上写着“属于保障范围”，所以保险杠和尾灯的损坏一定会赔。',
  'akt.polis.opsi.tidak-tercakup': '像这样的小凹陷和裂痕，不在您保单的保障范围内。',
  'akt.polis.opsi.bisa-dinilai': '这处损坏可以按您保单卡的条款继续评估。',
  'akt.polis.alasan.pasti-diganti': '“属于保障范围”不等于一定会赔；结果要等评估。',
  'akt.polis.alasan.tidak-tercakup': '与卡片矛盾：卡上写明碰撞损坏按卡片条款属于保障范围。',
  'akt.polis.alasan.bisa-dinilai': '与卡片一致：碰撞损坏按条款属于保障范围，所以可以继续评估。',
  'akt.polis.kartu.judul': 'Rina 女士的保单卡',
  'akt.polis.kartu.sub': 'Comprehensive（模拟）',
  'akt.polis.kartu.kendaraan.label': '车辆与车牌',
  'akt.polis.kartu.kendaraan.nilai': '家用 MPV · B 1726 RN',
  'akt.polis.kartu.benturan.label': '碰撞损坏',
  'akt.polis.kartu.benturan.nilai': '按卡片条款属于保障范围',
  'akt.polis.kartu.status.label': '保单状态',
  'akt.polis.kartu.status.nilai': '有效',
  'akt.polis.kartu.risiko.label': '免赔额',
  'akt.polis.kartu.risiko.nilai': '按保单条款适用',
  'akt.polis.kartu.catatan': '用于练习的模拟卡片。实际理赔以保单和 Raksa 的查勘为准。',
  'akt.polis.kartu.sub.arti': '这类保单的名称（模拟）。具体保障什么，要看下面卡片的各行。',
  'akt.polis.kartu.kendaraan.arti': '这张卡保障的车。车牌照片能确认查勘的确实是这辆车。',
  'akt.polis.kartu.benturan.arti': '碰撞造成的损坏，例如被剐蹭，属于保障范围。“按卡片条款”意思是先评估，不是自动就赔。',
  'akt.polis.kartu.status.arti': '有效表示这张卡上的保障目前正在生效。',
  'akt.polis.kartu.risiko.arti': '损失中仍由 Rina 女士自己承担的部分。金额按保单条款确定，这张卡上没有写。',
  'akt.polis.bahas.penjelasan': '卡上写明碰撞损坏按卡片条款属于保障范围，所以这处损坏可以继续评估。“属于保障范围”不等于“一定会赔”：结果要等评估。“不在保障范围”与卡片矛盾。',
  'akt.polis.ringkasan': 'Comprehensive 卡：碰撞损坏可以按卡片条款继续评估，不是一定会赔。',
  'akt.polis.kirim': '告诉 Rina 女士',

  // ================================================================== PENSIUN (teks.id.ts KUNCI_PENSIUN; simpanan lama)
  'b1-mentor.2': '我们的任务：倾听客户，收集信息和证据，再说明接下来的步骤。',
  'b1-mentor.3': '对了，这是模拟练习。实际理赔仍以保单和 Raksa 的查勘为准。',
  'b2-cerita.4': '我去买了一会儿东西。回来一看，保险杠已经凹了，撞车的人也走了。',
  'b2-singkat.1': '今早在市场停车场被剐了。那人走了。',
  'b3-bukti-intro.4': '只拍三张，{nama}。查勘员需要看到什么，才能确认是这辆车、是这些损坏？',
  'akt.polis.opsi.ambang-tlo': '按卡片条款，损坏达到车辆价值的 75% 才属于保障范围。',
  // v2: umpan balik foto per bukti -> satu kalimat mentor; alasan per foto kini di panel (akt.bukti.alasan.*).
  'b3-bukti.hasil.2.1': '还缺车辆全景照片。它能展示车辆的整体状况。',
  'b3-bukti.hasil.2.2': '还没拍保险杠和尾灯的细节。损坏就在那里。',
  'b3-bukti.hasil.2.3': '还没拍车牌。没有它，就很难确认查勘的是哪辆车。',
};
