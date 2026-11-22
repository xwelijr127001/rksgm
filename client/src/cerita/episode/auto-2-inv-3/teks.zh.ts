/**
 * T-104 Investigator 案件 3「修理厂的两行」（T-125 之前为「多出来的一行」）：仅新增键（简体中文）。键和数字与 ./teks.id.ts 一致。
 * [konfirmasi PIC]：带此标记的每一行涉及评审小组的名称或权限、出示证据的同意、无争议项目（保险杠）的处理、核查渠道或补充说明的权利，
 * 面向来宾使用前必须由理赔 PIC 确认。所有姓名、修理厂和日期均为虚构（“3 日 / 14 日 / 15 日”只表示先后顺序）。
 */
export const TEKS_AUTO_2_INV_3_ZH: Record<string, string> = {
  judul: '调查员 · 案件 3',
  ringkas: '一份维修估价单，两行：保险杠和后视镜。逐一出示证据，听取说明，再决定下一步。5 分钟。',
  'inv.label': '案件 3',
  'inv3.kait': '估价单上有两行。是同一次事故吗？',
  'inv3.kasus.judul': '修理厂的两行', // T-125：中性标题（旧标题回答了开场的问题）
  'pemeran.pemohon.nama': 'Gilang 先生',
  'pemeran.pemohon.peran': '理赔申请人 · 车主',
  'pemeran.penaksir.nama': 'Seno 先生',
  'pemeran.penaksir.peran': '修理厂估价员',
  'pemeran.ketua.nama': 'Arya 先生',
  'pemeran.ketua.peran': '理赔审核员 · 小组主持人', // [konfirmasi PIC]

  'inv3.bab.1.judul': '案卷',
  'inv3.bab.1.tujuan': '阅读事故卡，然后记下两段陈述。',
  'inv3.bab.2.judul': '证据',
  'inv3.bab.2.tujuan': '把修理厂的照片和事故卡对照，排出日期的先后。',
  'inv3.bab.3.judul': '评审',
  'inv3.bab.3.tujuan': '逐一出示能回应每段陈述的证据。',
  'inv3.bab.4.judul': '后续处理',
  'inv3.bab.4.tujuan': '总结发现，再有礼貌地说明下一步。',

  'inv3.judul.kartu': '案件 #3 · 修理厂的两行',
  'inv3.buka.1': '新案件，调查员。14 日，Gilang 先生的车在停车场被撞。修理厂的估价单上有两行：保险杠和后视镜。先看事故卡。',
  'inv3.bukti.kejadian.1': '14 日事故卡：一辆车倒车时撞到保险杠。停车场管理员证实了这次碰撞。损坏一栏写着：保险杠凹陷，后视镜破裂。',
  'inv3.bukti.kejadian.judul': '事故卡',
  'inv3.bukti.kejadian.sumber': '来源：14 日事故报告，经停车场管理员证实',
  'inv3.tebak.1': '没有对错。等证据收齐后，我们再回头看你的猜测。',
  'inv3.tebak.tanya': '这两处是在同一次事故中损坏的吗？',
  'inv3.tebak.pilih.sama': '是，同一次事故',
  'inv3.tebak.pilih.beda': '不是，不同的事故',
  'inv3.tebak.pilih.belum': '还不知道',
  'inv3.tebak.balik.sama': '你最初的猜测：同一次事故。你对两份记录的判读是：后视镜的裂纹在停车场事故之前就已存在。',
  'inv3.tebak.balik.beda': '你最初的猜测：不是同一次事故。你对两份记录的判读是：后视镜的裂纹在停车场事故之前就已存在。',
  'inv3.tebak.balik.belum': '你最初的猜测：还不知道。这个态度很好。现在两份记录你已经亲自读过了。',

  'inv3.pemohon.1': '面谈室。车主 Gilang 先生带来了修理厂的估价单。',
  'inv3.pemohon.2': '我的车当时停着。有辆车倒车，撞到了我的保险杠。',
  'inv3.pemohon.3': '保险杠和后视镜都是那天晚上坏的。',
  'inv3.pernyataan.pemohon': '保险杠和后视镜都是那天晚上坏的。',
  'inv3.penaksir.1': '接下来是 Seno 先生，检查这辆车的修理厂估价员。',
  'inv3.penaksir.2': '车是事故第二天送来的。我检查之后，做了这份估价。',
  'inv3.penaksir.3': '我只是写下预估的费用。',
  'inv3.pernyataan.penaksir': '我只是写下预估的费用。',
  'inv3.bukti.penawaran.1': '修理厂估价单：两行，保险杠和后视镜，各有价格。',
  'inv3.bukti.penawaran.judul': '估价单',
  'inv3.bukti.penawaran.sumber': '来源：修理厂，由 Seno 先生编制',
  'inv3.selisih.1': '保险杠的碰撞有停车场管理员证实。后视镜还没有。我们不猜测，也不指责：我们找有日期的记录。',

  'inv3.foto.1': '你礼貌地问：修理厂还有没有这辆车的其他照片？',
  'inv3.foto.2': '有。这是我们检查单上的照片。日期印在照片的角上。',
  'inv3.bukti.foto.1': '检查照片记进了你的笔记本。上面的车架号与 Gilang 先生的车一致。',
  'inv3.bukti.foto.kutipan': '修理厂的检查单，日期戳 03。车架号与 Gilang 先生的车一致。角上的小图：带分叉裂纹的后视镜镜片。',
  'inv3.bukti.foto.judul': '检查照片',
  'inv3.bukti.foto.sumber': '来源：修理厂定期保养单，车架号一致',
  'inv3.baca.foto.1': '你把那张照片放到事故卡旁边对照。',
  'inv3.tafsir.urutan.tanya': '这张照片上能看到后视镜的裂纹。照片是什么时候拍的？',
  'inv3.tafsir.urutan.gambar': '一辆汽车在修理车间里的照片。左下角的日期戳：03。右上角的小图是带分叉裂纹的后视镜镜片。',
  'inv3.tafsir.urutan.samping': '事故卡：一页写着 14 的日历，和停车位里几辆车的草图。',
  'inv3.tafsir.urutan.pilih.saat': '事故当天',
  'inv3.tafsir.urutan.pilih.sebelum': '事故之前',
  'inv3.tafsir.urutan.pilih.sesudah': '事故之后',
  'inv3.tafsir.urutan.salah.saat': '这两份记录的日期并不相同。把照片角上的日期戳和事故卡上的日历比一比。',
  'inv3.tafsir.urutan.salah.sesudah': '先后顺序还不对。把照片角上的日期戳和事故卡上的日历比一比。',
  'inv3.tafsir.urutan.alasan': '照片的日期戳是 03；事故卡的日期是 14。3 日在前：后视镜的裂纹在停车场事故之前就已存在。', // [konfirmasi PIC] rumusan kerusakan lama
  'inv3.tafsir.urutan.benar': '照片日期戳 03，事故卡 14：后视镜的裂纹在停车场事故之前就已存在。', // [konfirmasi PIC] rumusan kerusakan lama
  'inv3.tafsir.urutan.temuan': '检查照片日期戳 03，事故卡日期 14：后视镜的裂纹在停车场事故之前就已存在。', // [konfirmasi PIC] rumusan kerusakan lama
  'inv3.tafsir.urutan.ringkas': '事故之前',
  'inv3.tekan.penaksir.tanya': '追问：这张检查照片是什么时候拍的？',
  'inv3.tekan.penaksir.jawab': '3 日，定期保养的时候。日期和车架号是自动打印在检查单上的。',

  'inv3.kutipan.1': '修理厂的案卷里有一条 Gilang 先生发来的申请信息。阅读之前，你先征得他的同意。', // [konfirmasi PIC]
  'inv3.kutipan.2': '请看吧。这段摘录可以出示。', // [konfirmasi PIC]
  'inv3.bukti.pesan.1': 'Gilang 先生发给修理厂的信息摘录，15 日：“后视镜那道裂纹是旧的。请直接算作这次事故的损坏吧。”',
  'inv3.bukti.pesan.judul': '信息摘录',
  'inv3.bukti.pesan.sumber': '来源：Gilang 先生发给修理厂的信息，经他本人同意出示', // [konfirmasi PIC]
  'inv3.tekan.pemohon.tanya': '追问：是谁同意出示这段信息摘录的？',
  'inv3.tekan.pemohon.jawab': '是我本人。那条信息是从我的号码发出的，我同意把摘录用于这次评审。', // [konfirmasi PIC]
  'inv3.tekan.pemohon.harga.tanya': '追问：估价单上的价格是谁定的？',
  'inv3.tekan.pemohon.harga.jawab': '是修理厂的估价员 Seno 先生。那些数字我是照单收下的。',

  'inv3.panel-buka.1': '理赔评审小组。由 Arya 先生主持；Seno 先生和 Gilang 先生都在场，两人都可以说明情况。', // [konfirmasi PIC]
  'inv3.panel-buka.2': '本小组只评审案卷中的证据，不作最终决定，也不指责任何人。每一方都可以更正自己的陈述。', // [konfirmasi PIC]
  'inv3.panel-buka.3': '案卷里有两行：保险杠和后视镜。我只是写下预估的费用。',
  'inv3.panel-buka.4': '我们从 Gilang 先生的陈述开始：保险杠和后视镜都是那天晚上坏的。',
  'inv3.panel.pilih.kartu-kejadian': '出示事故卡',
  'inv3.panel.pilih.foto-inspeksi': '出示检查照片',
  'inv3.panel.pilih.pesan-pengajuan': '出示信息摘录',
  'inv3.panel.pilih.penawaran': '出示估价单',

  'inv3.panel.kronologi.nama': '第 1 轮 · 裂纹何时就有',
  'inv3.panel.kronologi.1': '请选择一项证据出示给小组。',
  'inv3.panel.kronologi.2': '再试一次。找日期在事故之前的证据。',
  'inv3.panel.kronologi.3': '把 3 日的检查照片出示给小组。',
  'inv3.panel.kronologi.tanya': '哪项证据能说明后视镜的裂纹何时就已存在？',
  'inv3.panel.kronologi.petunjuk1': '还不对。哪项证据的日期早于 14 日的事故？',
  'inv3.panel.kronologi.petunjuk2': '停车场事故发生在 14 日。3 日的检查照片已经显示后视镜有裂纹。用那张照片。',
  'inv3.panel.kronologi.salah.kartu-kejadian': '事故卡记录的是报告的内容，而不是后视镜裂纹最早何时出现。',
  'inv3.panel.kronologi.salah.penawaran': '估价单只显示价格，不显示损坏发生的时间。',
  'inv3.panel.kronologi.pandu.kartu-kejadian': '那张卡只是报告。我们一起看看日期在事故之前的证据。',
  'inv3.panel.kronologi.pandu.penawaran': '那份估价单只关乎价格。我们一起看看日期在事故之前的证据。',
  'inv3.panel.kronologi.koreksi': '陈述已更正：后视镜裂纹在事故前就已存在',
  'inv3.kronologi.jawab.1': '3 日的检查照片显示后视镜裂纹早已存在，比 14 日的停车场事故早十一天。',
  'inv3.kronologi.jawab.2': 'Gilang 先生，请您回应。', // [konfirmasi PIC]
  'inv3.kronologi.jawab.3': '是的。那道裂纹在停车场事故之前就有了。我刚才的说法有误。',
  'inv3.kronologi.koreksi.1': 'Gilang 先生更正了他的陈述。你在笔记本里作了更新。',
  'inv3.koreksi.judul': '陈述已更新',
  'inv3.koreksi.ket': '是 Gilang 先生本人在小组面前澄清了他的陈述。没有人受到指责。',

  'inv3.kira.1': '那么，为什么那道旧裂纹会出现在这次事故的估价单上？',
  'inv3.kira.tapi': '那份估价单是修理厂做的。光凭估价单，看不出我当时要求了什么。',
  'inv3.kira.2': '我以为两项维修都必须写成新的损坏。',
  'inv3.pernyataan.pemohon-panel': '我以为两项维修都必须写成新的损坏。',

  'inv3.panel.pengajuan.nama': '第 2 轮 · 提出了什么要求',
  'inv3.panel.pengajuan.1': '请选择一项证据出示给小组。',
  'inv3.panel.pengajuan.2': '再试一次。找含有 Gilang 先生本人原话的证据。',
  'inv3.panel.pengajuan.3': '把 15 日的信息摘录出示给小组。',
  'inv3.panel.pengajuan.tanya': '哪项证据能说明 Gilang 先生向修理厂提出了什么要求？',
  'inv3.panel.pengajuan.petunjuk1': '还不对。哪项证据含有 Gilang 先生本人的原话？',
  'inv3.panel.pengajuan.petunjuk2': '在 15 日的信息摘录里，Gilang 先生写明裂纹是旧的，并要求把它算进去。用那段摘录。',
  'inv3.panel.pengajuan.salah.penawaran': '估价单显示的是两行项目和价格，而不是 Gilang 先生提出的要求。',
  'inv3.panel.pengajuan.salah.foto-inspeksi': '那张照片说明的是裂纹何时就已存在，而不是要求怎样填写。',
  'inv3.panel.pengajuan.pandu.penawaran': '那份估价单只是清单和价格。我们一起看看 Gilang 先生本人的原话。',
  'inv3.panel.pengajuan.pandu.foto-inspeksi': '那张照片已经回答了时间的问题。我们一起看看 Gilang 先生本人的原话。',
  'inv3.panel.pengajuan.koreksi': '陈述已更正：要求把旧裂纹算作这次事故的损坏',
  'inv3.pengajuan.jawab.1': '在 15 日的信息摘录里，Gilang 先生写明后视镜裂纹是旧的，并要求把它算作这次事故的损坏。',
  'inv3.pengajuan.jawab.2': 'Gilang 先生、Seno 先生，请回应。', // [konfirmasi PIC]
  'inv3.pengajuan.jawab.jeli': '你想起他刚才的回答：是他本人同意使用这段摘录的。', // [konfirmasi PIC] persetujuan memperlihatkan bukti; hanya untuk pemain bertanda jeli
  'inv3.pengajuan.jawab.3': '是的，那是我的信息。我知道裂纹是旧的，是我要求把它算进去的。我想顺便一起修好。',
  'inv3.pengajuan.jawab.4': '我是按要求写的。我本该把那一行标注出来。',
  'inv3.pengajuan.jawab.5': '感谢说明。两位的陈述我们会如实记录。', // [konfirmasi PIC]
  'inv3.pengajuan.koreksi.1': 'Gilang 先生再次更正了他的陈述。你在笔记本里作了更新。',
  'inv3.temuan.pengajuan': '15 日的信息摘录：Gilang 先生要求把那道旧裂纹算作这次事故的损坏。', // [konfirmasi PIC] rumusan permintaan (bukan niat)
  'inv3.temuan.pengajuan.ringkas': '要求算进去',

  'inv3.putusan.1': '双方都已说明并更正了各自的陈述。', // [konfirmasi PIC]
  'inv3.putusan.2': '调查员，从这些证据中我们能得出什么结论？',
  'inv3.putusan.3': '请选择一个结论。',
  'inv3.putusan.tanya': '从这些证据中我们能得出什么结论？',
  'inv3.putusan.tambahan': '转交核查', // [konfirmasi PIC]
  'inv3.putusan.layak': '只要求澄清', // [konfirmasi PIC]
  'inv3.putusan.polis': '认定整个理赔为欺诈', // [konfirmasi PIC]
  'inv3.putusan.ket': '照片和信息摘录已在你的笔记本里。请选择一个结论。',
  'inv3.putusan.tambahan.sebab': '后视镜这一行转交有权核查的团队。保险杠的损坏另行记录。', // [konfirmasi PIC]
  'inv3.putusan.layak.sebab': '只需再请对方解释一次，不记录也不转交已经查明的差异。', // [konfirmasi PIC]
  'inv3.putusan.polis.sebab': '后视镜这一行有问题，所以认定整个理赔为欺诈。', // [konfirmasi PIC]
  'inv3.putusan.tambahan.1': '正确。在这份案卷里，照片和信息支持这样的发现：后视镜这一行是有意加上的。我们把这一发现转交有权核查的团队，已证实的保险杠损坏另行记录。在这里我们不决定赔付、拒赔或过错。', // [konfirmasi PIC]
  'inv3.putusan.layak.1': '多问是好事，但两人已经在小组面前说明过了。已经查明的差异需要记录并转交有权核查的团队；保险杠的损坏另行记录。', // [konfirmasi PIC]
  'inv3.putusan.polis.1': '还不对。查明有问题的只是后视镜这一行；保险杠的碰撞有停车场管理员证实。我们不认定任何人欺诈：这一发现转交有权核查的团队，保险杠另行记录。', // [konfirmasi PIC]

  'inv3.pesan.1': '最后，通知 Gilang 先生。有礼貌地说明下一步。',
  'inv3.pesan.2': '那我的理赔接下来怎么办？',
  'inv3.pesan.tanya': '你发送哪条信息？',
  'inv3.pesan.baik': 'Gilang 先生，感谢您的说明。后视镜一项我们转交有权核查的团队审核；保险杠另行记录。您可以补充说明。', // [konfirmasi PIC] rujukan: langkah berikutnya + hak menambahkan keterangan
  'inv3.pesan.datar': '检查照片和信息摘录显示，后视镜的裂纹在停车场事故之前就已存在。后视镜一项已转交有权核查的团队。保险杠的损坏另行记录。仅此通知。', // [konfirmasi PIC] isi benar, tanpa hak menambahkan keterangan
  'inv3.pesan.janji': '先生请放心，保险杠和后视镜我都会尽量争取给您换。',
  'inv3.pesan.tolak': 'Gilang 先生，检查照片和您本人的信息证明，后视镜的裂纹是旧的，而且是故意算进去的。因此这笔理赔，无论保险杠还是后视镜，我们一律拒赔，不再受理。此决定为最终决定，不得复核。', // [konfirmasi PIC] penolakan menyeluruh tanpa wewenang (pilihan bernilai 0)
  'inv3.pesan.baik.alasan': 'Gilang 先生知道了下一步，也知道自己可以补充说明。', // [konfirmasi PIC]
  'inv3.pesan.janji.alasan': 'Gilang 先生现在放心了，但那个承诺没有依据。',
  'inv3.pesan.tolak.alasan': '已被证实的保险杠损坏也被一并拒绝，而拒赔并不是你能决定的。', // [konfirmasi PIC] wewenang
  'inv3.pesan.baik.1': '我明白了。谢谢您这样好好地解释。我会补充我的说明。',
  'inv3.pesan.datar.1': '这样啊……那我现在能做什么？',
  'inv3.pesan.datar.2': '内容是对的，但 Gilang 先生不知道自己可以补充说明。', // [konfirmasi PIC]
  'inv3.pesan.janji.1': '哎呀，太好了！那两样都会换，对吧。',
  'inv3.pesan.tolak.1': '保险杠也拒赔？可是停车场管理员亲自证实了那次碰撞啊。',
  'inv3.pesan.janji.2': '发现没有改变。没有依据的承诺会让 Gilang 先生失望两次。',
  'inv3.pesan.tolak.2': '被证实有问题的只有后视镜那一行。拒绝整笔理赔，更不用说称其为最终决定，都不是我们在这里能决定的。', // [konfirmasi PIC] wewenang; yang terbukti hanya baris spion

  'inv3.akhir.tuntas.1': '案件结束，调查员。你逐一出示了证据，给了对方说明的机会，然后把发现转交到了正确的地方。',
  'inv3.akhir.tinjau.1': '案件结束。证据是你自己找到的；下一步我们一起理顺。',
  'inv3.akhir.tuntas.judul': '案件告破',
  'inv3.akhir.tuntas.ringkas': '后视镜这一行已转交核查，保险杠另行记录，Gilang 先生也得到了说明。', // [konfirmasi PIC]
  'inv3.akhir.tinjau.judul': '案件结束（附说明）',
  'inv3.akhir.tinjau.ringkas': '证据已找到；下一步由 Miss Raksa 理顺。',
  'inv3.pelajaran.1': '先有证据，再下结论。给对方说明的机会，然后把发现转交给有权核查的人。', // [konfirmasi PIC]

  'inv3.balas.baik': '调查员，谢谢你解释得这么清楚。我知道核查的是什么，我会补充我的说明。', // [konfirmasi PIC]
  'inv3.balas.datar': '理由我明白了。但我还是不知道自己能做什么。',
  'inv3.balas.janji': '两样都会换，对吧？我已经告诉修理厂了。希望真是这样。',
  'inv3.balas.tolak': '我的保险杠也被拒赔了，可明明有证人。我不知道还能去问谁。',
  'inv3.arsip.judul': '已更正的案卷',
  'inv3.garis.1': '3 日 · 检查照片：后视镜裂纹已存在',
  'inv3.garis.2': '14 日 · 停车场事故：保险杠凹陷，经停车场管理员证实',
  'inv3.garis.3': '15 日 · 申请信息：要求把旧裂纹算进去',
  'inv3.arsip.pesan': '你发给 Gilang 先生的信息',
  'inv.lagi.langkah.pesan': '发给 Gilang 先生的信息',
  'inv.lagi.sempurna': '满分！这就是凭你的证据更正后的 Gilang 先生的陈述。',
};
