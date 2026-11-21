/**
 * T-090 调查员 案件 2「茉莉街之夜」：仅新增的键（中文）。表的结构和 [konfirmasi PIC] 的含义见 ./teks.id.ts：带这个标记的每一行
 * 都包含保单措辞、结论依据或复核渠道，在给访客看之前必须由理赔 PIC 确认。键和数字与 id / en 相同。
 */
export const TEKS_AUTO_2_INV_2_ZH: Record<string, string> = {
  judul: '调查员 · 案件 2',
  ringkas: '一辆家用车、一次夜间碰擦，还有一张行程小票。不指责任何人，查清事实，再有礼貌地说明。5 分钟。',
  'inv.label': '案件 2',
  'inv2.kasus.judul': '茉莉街之夜',
  'pemeran.yusuf.nama': 'Yusuf 先生',
  'pemeran.yusuf.peran': '客户 · 车主',
  'pemeran.agus.nama': 'Agus',
  'pemeran.agus.peran': '证人 · 摩托车骑手',

  'inv2.bab.1.judul': '说法',
  'inv2.bab.1.tujuan': '看查勘员的照片，然后记下两句说法。',
  'inv2.bab.2.judul': '证据',
  'inv2.bab.2.tujuan': '把碰擦时间和行程小票对上，再读保单。',
  'inv2.bab.3.judul': '异议',
  'inv2.bab.3.tujuan': '拿出能回答这个问题的记录：21:18 发生了什么？',
  'inv2.bab.4.judul': '结论',
  'inv2.bab.4.tujuan': '对理赔下结论，然后有礼貌地向 Yusuf 先生说明。',

  'inv2.judul.kartu': '案件 #2 · 茉莉街之夜',
  'inv2.buka.1': '新案件，调查员。夜里在茉莉街，一辆摩托车在 21:18 擦到了 Yusuf 先生汽车的左前保险杠。这是我们查勘员拍的车内照片。',
  'inv2.bukti.foto.1': '查勘员拍的车内照片：手机架在仪表台支架上，一个应用亮着；后座上放着几瓶水。',
  'inv2.bukti.foto.judul': '车内照片：仪表台上的手机，后座的水瓶',
  'inv2.bukti.foto.sumber': '来源：Raksa 查勘员的照片',
  'inv2.tebak.1': '没有对错。等记录收齐后，我们再回头看你的猜测。',
  'inv2.tebak.tanya': '那天晚上这辆车是用来做什么的？',
  'inv2.tebak.pilih.keluarga': '接送家人',
  'inv2.tebak.pilih.penumpang': '接送乘客',
  'inv2.tebak.pilih.belum': '还不知道',
  'inv2.tebak.balik.keluarga': '你最初的猜测：接送家人。小票记录的是付费乘客。没关系：现在你有记录了。',
  'inv2.tebak.balik.penumpang': '你最初的猜测：接送乘客。现在有记录了，所以不再只是猜测。',
  'inv2.tebak.balik.belum': '你最初的猜测：还不知道。这个态度很好。现在由记录来回答。',

  'inv2.yusuf.1': '问询室。车主 Yusuf 先生下班后直接过来了。',
  'inv2.yusuf.2': '那辆摩托车从左边出来，擦到了我的保险杠。幸好没有人受伤。',
  'inv2.yusuf.3': '那天晚上我只是送家人回家。',
  'inv2.pernyataan.yusuf': '那天晚上我只是送家人回家。',
  'inv2.agus.1': '接下来是摩托车骑手 Agus。他手里还拿着头盔。',
  'inv2.agus.2': '是我擦到的，我承认。路很黑，我刹车晚了。',
  'inv2.agus.3': '碰擦之后，有一位乘客从后门下车，然后走路离开了。',
  'inv2.pernyataan.agus': '碰擦之后，有一位乘客从后门下车，然后走路离开了。',
  'inv2.selisih.1': '家人，还是乘客？我们不猜测，也不指责。我们去找带时间的记录。',

  'inv2.jalan.1': '你礼貌地问：仪表台上的那个应用，记录了那天晚上的行程吗？',
  'inv2.jalan.2': '有一单。这是小票，请看。对方的姓名和地址我遮住了。',
  'inv2.jalan.judul': '核对时间',
  'inv2.jalan.struk': '行程小票',
  'inv2.jalan.struk.ket': '出行应用（虚构）。乘客的姓名和地址已遮住。',
  'inv2.jalan.form': '事故登记表',
  'inv2.jalan.form.jam': '碰擦时间：21:18',
  'inv2.jalan.tertutup': '点一下打开',
  'inv2.jalan.sama': '日期相同 · 车牌相同',
  'inv2.garis.1': '21:05 · 接到乘客',
  'inv2.garis.2': '21:18 · 碰擦',
  'inv2.garis.3': '21:24 · 行程在应用中关闭',
  'inv2.jalan.l1.tanya': '点一下行程小票，把它打开。',
  'inv2.jalan.l1.hasil': '一单付费行程：21:05 接到乘客，21:24 行程在应用中关闭。',
  'inv2.jalan.l2.tanya': '点一下事故登记表，看碰擦时间。',
  'inv2.jalan.l2.hasil': '事故登记表记录的碰擦时间是 21:18。',
  'inv2.jalan.l3.tanya': '21:18 在这单行程的哪里？点一下那个位置。',
  'inv2.jalan.l3.sebelum': '21:05 之前',
  'inv2.jalan.l3.tengah': '21:05 和 21:24 之间',
  'inv2.jalan.l3.sesudah': '21:24 之后',
  'inv2.jalan.l3.coba': '还不对。比一比时间：21:18 在 21:05 之后，但在 21:24 之前。',
  'inv2.jalan.l3.hasil': '对了：21:18 正好在这单付费行程中间。',
  'inv2.jalan.l4.tanya': '点一下日期和车牌，把它们对上。',
  'inv2.jalan.l4.hasil': '小票上的日期和车牌与事故登记表相同。',
  'inv2.jalan.selesai': '保存检查结果',
  'inv2.bukti.struk.1': '小票和事故登记表对上了：日期相同，车牌相同。21:05 接到乘客，21:18 碰擦，21:24 行程在应用中关闭。',
  'inv2.bukti.struk.judul': '行程小票：付费乘客 21:05-21:24',
  'inv2.bukti.struk.sumber': '来源：Yusuf 先生提供的小票，乘客姓名和地址已遮住',

  'inv2.polis.1': '还有一份记录：保单。我们读上面写的，而不是我们以为的。',
  'inv2.polis.judul': '读保单',
  'inv2.polis.tanya': '点一下车辆使用条款。',
  'inv2.polis.kepala': '车辆保单（虚构示例）',
  'inv2.polis.ketuk': '点一下阅读',
  'inv2.polis.klausul.judul': '车辆使用',
  'inv2.polis.klausul.1': '使用性质：私人。', // [konfirmasi PIC] 使用条款措辞
  'inv2.polis.klausul.2': '车辆出租或收取报酬载人时不予承保，除非已有商业使用扩展。', // [konfirmasi PIC] 条款措辞 + 扩展名称
  'inv2.polis.klausul.3': '事故当日的扩展：无。', // [konfirmasi PIC] 保单上扩展状态的写法
  'inv2.polis.hasil': '这份保单用于私人使用。事故当日没有商业使用扩展。', // [konfirmasi PIC]
  'inv2.polis.selesai': '保存检查结果',
  'inv2.bukti.polis.1': 'Yusuf 先生的保单：私人使用。事故当日的商业使用扩展：无。', // [konfirmasi PIC]
  'inv2.bukti.polis.judul': '保单：私人使用，无扩展', // [konfirmasi PIC]
  'inv2.bukti.polis.sumber': '来源：Yusuf 先生的车辆保单',

  'inv2.keb-buka.1': '三份记录都已经在你的记事本里了。你再次去见 Yusuf 先生。',
  'inv2.keb-buka.2': '就像我说的，那天晚上我只是送家人回家。',
  'inv2.keb-buka.3': '记住，我们不指责。拿出一份能回答这个问题的记录：21:18 发生了什么？',
  'inv2.keb.1': '选一份记录给 Yusuf 先生看。',
  'inv2.keb.2': '再试一次。找带时间的那份记录。',
  'inv2.keb.3': '把行程小票给 Yusuf 先生看。',
  'inv2.keb.tanya': '哪份记录说明这辆车在 21:18 正载着付费乘客？',
  'inv2.keb.petunjuk1': '还不对。哪份记录上有时间？看高亮的那一份。',
  'inv2.keb.petunjuk2': '碰擦发生在 21:18。小票记录了从 21:05 到 21:24 的付费乘客。用这张小票。',
  'inv2.keb.pilih.foto-interior': '出示车内照片',
  'inv2.keb.pilih.struk': '出示行程小票',
  'inv2.keb.pilih.polis-kasus2': '出示保单',
  'inv2.keb.salah.foto-interior': '水瓶和手机支架不能证明收了车费。找带“时间”的那一份。',
  'inv2.keb.salah.polis-kasus2': '保单说明的是规则，不是 21:18 发生了什么。',
  'inv2.keb.pandu.foto-interior': '那张照片只是线索，不是时间记录。我们一起来看。',
  'inv2.keb.pandu.polis-kasus2': '保单只是规则，不是那天晚上发生的事。我们一起来看。',
  'inv2.keb.cap': '行程小票记录了从 21:05 到 21:24 的付费乘客。碰擦发生在 21:18。',
  'inv2.akui.1': '我当时正在送一位乘客。我以为这种用途已经包括在内了。',
  'inv2.akui.2': '谢谢您的坦诚，先生。',
  'inv2.koreksi.1': '你在记事本里更新了 Yusuf 先生的说法。',
  'inv2.koreksi.judul': '说法已更新',
  'inv2.koreksi.ket': '是 Yusuf 先生自己更正了说法。没有人被指责。',
  'inv2.koreksi.baris': '说法已更新：当时正在接送付费乘客',

  'inv2.putusan.1': '你的发现很清楚，Yusuf 先生也自己更正了说法。',
  'inv2.putusan.2': '现在该你下结论了。我们判断的是车辆的用途和保单内容，不是 Yusuf 先生的用意。',
  'inv2.putusan.3': '选一个结论。',
  'inv2.putusan.tanya': '这笔理赔怎么样？',
  'inv2.putusan.layak': '理赔可以承保',
  'inv2.putusan.tambahan': '需要补充证据',
  'inv2.putusan.polis': '保障范围有问题',
  'inv2.putusan.ket': '小票和保单都在你的记事本里。选一个结论。',
  'inv2.putusan.polis.sebab': '碰擦时车上载着付费乘客：超出私人使用，而且没有扩展。', // [konfirmasi PIC] 结论依据
  'inv2.putusan.tambahan.sebab': '先再检查一次更稳妥，虽然带时间的小票和保单条款都已在手。', // [konfirmasi PIC]
  'inv2.putusan.layak.sebab': '保险杠是被摩托车擦坏的，所以损失照样承保。', // [konfirmasi PIC]
  'inv2.putusan.polis.1': '正确。保单用于私人使用，小票记录了碰擦时的付费乘客，而当天没有扩展。保障范围有问题。这说的是车辆的用途，不是 Yusuf 先生的用意。', // [konfirmasi PIC] 结论依据 + 谁有权决定
  'inv2.putusan.tambahan.1': '细心是好事，但决定结论的两样东西你已经有了：带时间的小票，以及保单条款和它的扩展状态。结论是：保障范围有问题。', // [konfirmasi PIC]
  'inv2.putusan.layak.1': '还不对。损坏是真的，但碰擦时车辆的用途超出了保单写明的范围，而且没有扩展。结论是：保障范围有问题。', // [konfirmasi PIC]

  'inv2.pesan.1': '最后，通知 Yusuf 先生。这不是他期待的消息，所以怎么说很重要。',
  'inv2.pesan.2': '那我的保险杠理赔怎么样了？',
  'inv2.pesan.tanya': '你发送哪一条消息？',
  'inv2.pesan.baik': 'Yusuf 先生，谢谢您的坦诚，很抱歉消息不太好。您的保单用于私人使用，而小票记录了碰擦时的付费乘客，并且没有商业使用扩展。因此这笔保险杠理赔我们无法批准。您可以通过 Raksa 客户服务申请复核。今后，您可以咨询商业使用扩展。', // [konfirmasi PIC] 拒赔措辞、复核渠道、今后的扩展选项
  'inv2.pesan.datar': '很抱歉，先生。理赔无法批准：您的保单用于私人使用，而碰擦时车上载着付费乘客。', // [konfirmasi PIC] 拒赔措辞
  'inv2.pesan.janji': '别担心，先生，我尽量让它这周照样赔下来。',
  'inv2.pesan.baik.alasan': 'Yusuf 先生知道了结果、原因和复核渠道。', // [konfirmasi PIC] 复核渠道
  'inv2.pesan.janji.alasan': 'Yusuf 先生现在松了一口气，但这个承诺没有依据。',
  'inv2.pesan.baik.1': '我很失望，但我明白原因。谢谢你解释清楚，还告诉我该走什么渠道。',
  'inv2.pesan.datar.1': '这样啊……那我该怎么办？我什么都做不了了吗？',
  'inv2.pesan.datar.2': '你的理由准确又有礼貌，但 Yusuf 先生不知道自己可以申请复核。', // [konfirmasi PIC] 申请复核的权利
  'inv2.pesan.janji.1': '啊，太好了！那我这周等消息。',
  'inv2.pesan.janji.2': '调查结果没有变。没有依据的承诺会让 Yusuf 先生失望两次。',

  'inv2.akhir.tuntas.1': '结案了，调查员。你对双方都公平：不指责任何人就查清了事实，然后有礼貌地做了说明。',
  'inv2.akhir.tinjau.1': '结案了。事实是你自己查到的；结论我们一起理顺了。',
  'inv2.akhir.tuntas.judul': '案件告破',
  'inv2.akhir.tuntas.ringkas': '已证明车辆用途超出保单范围，Yusuf 先生也得到了说明。', // [konfirmasi PIC]
  'inv2.akhir.tinjau.judul': '结案，附带备注',
  'inv2.akhir.tinjau.ringkas': '事实已查清；结论由 Miss Raksa 理顺。',
  'inv2.pelajaran.1': '车辆的用途必须与保单一致。调查员对双方都公平，不评判用意。', // [konfirmasi PIC] 这句总结的措辞

  'inv2.balas.baik': '谢谢你对我说实话，调查员。我知道去哪里申请复核，也会去问那项扩展。', // [konfirmasi PIC] 复核渠道
  'inv2.balas.datar': '原因我明白。可我还是不知道自己还能做些什么。',
  'inv2.balas.janji': '这周就能赔下来，对吧？我已经告诉修理厂了。希望真是这样。',
  'inv2.arsip.pesan': '你给 Yusuf 先生的消息',
  'inv2.hasil.kasus3': '案件 3 · 即将推出',
  'inv.lagi.langkah.pesan': '给 Yusuf 先生的消息',
  'inv.lagi.sempurna': '满分！这是因为你的记录而更新的 Yusuf 先生的说法。',
};
