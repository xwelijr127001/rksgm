/**
 * T-090 调查员 案件 2「茉莉街之夜」：仅新增的键（中文）。表的结构和 [konfirmasi PIC] 的含义见 ./teks.id.ts：带这个标记的每一行
 * 都包含保单措辞、结论依据或复核渠道，在给访客看之前必须由理赔 PIC 确认。键和数字与 id / en 相同。
 */
export const TEKS_AUTO_2_INV_2_ZH: Record<string, string> = {
  judul: '调查员 · 案件 2',
  ringkas: '一辆家用车、一次夜间碰擦，还有一张行程小票。不指责任何人，查清事实，再有礼貌地说明。5 分钟。',
  'inv.label': '案件 2',
  'inv2.kait': '家用车……还是正在载客？', // T-094: kalimat kait di hub Raksa Investigator
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
  'inv2.bab.3.tujuan': '拿出能回应 Yusuf 先生陈述的记录。',
  'inv2.bab.4.judul': '结论',
  'inv2.bab.4.tujuan': '对理赔下结论，然后有礼貌地向 Yusuf 先生说明。',

  'inv2.judul.kartu': '案件 #2 · 茉莉街之夜',
  'inv2.buka.1': '新案件，调查员。夜里在茉莉街，一辆摩托车擦到了 Yusuf 先生汽车的左前保险杠。这是我们查勘员拍的车内照片。',
  'inv2.bukti.foto.1': '查勘员拍的车内照片：手机架在仪表台支架上，一个应用亮着；后座上放着几瓶水。',
  'inv2.bukti.foto.judul': '车内照片',
  'inv2.bukti.foto.sumber': '来源：Raksa 查勘员的照片',
  'inv2.tebak.1': '没有对错。等记录收齐后，我们再回头看你的猜测。',
  'inv2.tebak.tanya': '那天晚上这辆车是用来做什么的？',
  'inv2.tebak.pilih.keluarga': '接送家人',
  'inv2.tebak.pilih.penumpang': '接送乘客',
  'inv2.tebak.pilih.belum': '还不知道',
  'inv2.tebak.balik.keluarga': '你最初的猜测：接送家人。你从记录判读的是：碰擦发生在应用里一段行程的中途。',
  'inv2.tebak.balik.penumpang': '你最初的猜测：接送乘客。你从记录判读的是：碰擦发生在应用里一段行程的中途。',
  'inv2.tebak.balik.belum': '你最初的猜测：还不知道。这个态度很好。现在记录你已经亲自读过了。',

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
  'inv2.bukti.struk.1': '行程小票记进了你的笔记本。上面的日期和车牌与事故登记表相同。',
  'inv2.bukti.struk.judul': '行程小票',
  'inv2.bukti.struk.sumber': '来源：Yusuf 先生提供的小票，乘客姓名和地址已遮住',

  'inv2.tekan.yusuf.tanya': '追问：那一单是什么时候在应用里结束的？',
  'inv2.tekan.yusuf.jawab': '21:24。车靠边停好以后，我自己在仪表台上的手机里结束的。',
  'inv2.tekan.yusuf.dudukan.tanya': '追问：那部手机为什么装在仪表台上？',
  'inv2.tekan.yusuf.dudukan.jawab': '看地图用的，免得走错路。很多司机都这么装。',
  'inv2.polis.1': '文件到了：保单摘录和扩展的状态。我们读上面写的，而不是我们以为的。', // [konfirmasi PIC]
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
  'inv2.bukti.polis.judul': '保单摘录',
  'inv2.bukti.polis.sumber': '来源：Yusuf 先生车辆保单的摘录',
  'inv2.tafsir.jam.tanya': '事故登记表。哪张时间条是碰擦的时间？',
  'inv2.tafsir.jam.gambar': '事故登记表：时间栏写着 21:18，还有一幅汽车与摩托车相碰的草图。',
  'inv2.tafsir.jam.pilih.2105': '21:05',
  'inv2.tafsir.jam.pilih.2118': '21:18',
  'inv2.tafsir.jam.pilih.2124': '21:24',
  'inv2.tafsir.jam.ket.2105': '一个人走向车门',
  'inv2.tafsir.jam.ket.2118': '一辆汽车和一辆摩托车碰在一起',
  'inv2.tafsir.jam.ket.2124': '手机上显示行程已结束',
  'inv2.tafsir.jam.salah.2105': '21:05 的时间条画的是有人上车。看看事故登记表上的时间栏。',
  'inv2.tafsir.jam.salah.2124': '21:24 的时间条画的是应用里行程结束。看看事故登记表上的时间栏。',
  'inv2.tafsir.jam.alasan': '事故登记表的时间栏写着 21:18，草图画的是碰擦。21:18 的时间条就是碰擦的时间。',
  'inv2.tafsir.jam.lagi': '读出事故登记表时间栏里的数字，再找数字完全相同的时间条。',
  'inv2.tafsir.jam.benar': '事故登记表记录的碰擦时间是 21:18。',
  'inv2.baca.struk.1': '你把碰擦时间放到行程小票旁边对照。',
  'inv2.tafsir.struk.tanya': '碰擦发生在 21:18。这个时间落在小票这段行程的哪里？',
  'inv2.tafsir.struk.gambar': '行程小票：一条路线上有两个时间，起点 21:05，终点 21:24。姓名和两个地址都被黑条遮住。',
  'inv2.tafsir.struk.salah.sebelum': '把这个时间和小票上的数字比一比：21:18 比 21:05 晚。',
  'inv2.tafsir.struk.salah.sesudah': '把这个时间和小票上的数字比一比：21:18 比 21:24 早。',
  'inv2.tafsir.struk.alasan': '小票：起点 21:05，终点 21:24。21:18 在两者之间：碰擦发生在行程中途。',
  'inv2.tafsir.struk.lagi': '看小票上的路线：起点 21:05，终点 21:24。21:18 落在这条线的哪里？',
  'inv2.tafsir.struk.benar': '21:18 在 21:05 和 21:24 之间：碰擦发生在小票上这段行程的中途。',
  'inv2.tafsir.struk.temuan': '行程小票：21:18 的碰擦发生在 21:05 和 21:24 之间，也就是这段行程的中途。',
  'inv2.tafsir.struk.ringkas': '在行程中途',
  'inv2.kurang.1': '在读保单之前，Miss Raksa 问：如果现在就要下结论，你会怎么判？',
  'inv2.tafsir.dokumen.tanya': '现在还不能下结论：需要补充证据。还缺哪份文件？', // [konfirmasi PIC]
  'inv2.tafsir.dokumen.pilih.identitas': '乘客的姓名和地址',
  'inv2.tafsir.dokumen.pilih.perluasan': '事故当日的使用扩展状态', // [konfirmasi PIC]
  'inv2.tafsir.dokumen.pilih.foto': '第二张保险杠照片',
  'inv2.tafsir.dokumen.salah.identitas': '乘客是谁并不改变保单的内容，而且这些资料是特意遮住的。哪份文件决定能不能承保？', // [konfirmasi PIC]
  'inv2.tafsir.dokumen.salah.foto': '保险杠的损坏没有疑问。你还没读到的，是保单在那一天写了什么。',
  'inv2.tafsir.dokumen.alasan': '小票已经回答了发生了什么。还缺的是：保单的内容，以及事故当日有没有使用扩展。没有这些，我们还不能下结论。', // [konfirmasi PIC]
  'inv2.tafsir.dokumen.lagi': '事故和损坏都已经记在你的笔记本里。这份案卷里还有什么是你完全没读过的？',
  'inv2.tafsir.dokumen.benar': '缺的就是这个：保单的内容和事故当日的使用扩展状态。我们先把文件要来。', // [konfirmasi PIC]
  'inv2.tafsir.klausul.tanya': '哪一项条款对本案起决定作用？',
  'inv2.tafsir.klausul.gambar': '保单摘录，有三项带编号的条款：第 1 项画着汽车和房子，第 2 项画着地图，第 3 项画着握方向盘的人。',
  'inv2.tafsir.klausul.pilih.1': '1 · 使用', // [konfirmasi PIC]
  'inv2.tafsir.klausul.pilih.2': '2 · 地域', // [konfirmasi PIC]
  'inv2.tafsir.klausul.pilih.3': '3 · 驾驶人', // [konfirmasi PIC]
  'inv2.tafsir.klausul.salah.2': '事发地点在这份案卷里没有争议。那晚这辆车有什么不一样？', // [konfirmasi PIC]
  'inv2.tafsir.klausul.salah.3': '开车的是 Yusuf 先生本人，这一点没有争议。那晚这辆车有什么不一样？', // [konfirmasi PIC]
  'inv2.tafsir.klausul.alasan': '地域和驾驶人都没有争议。那晚不同的是车的用途：第 1 项条款，使用。', // [konfirmasi PIC]
  'inv2.tafsir.klausul.lagi': '再看看笔记本里的行程小票：那晚这辆车载了付费乘客。哪一项条款管这件事？', // [konfirmasi PIC]
  'inv2.tafsir.klausul.benar': '第 1 项条款规定车辆的使用，而那晚不同的正是车的用途。', // [konfirmasi PIC]
  'inv2.tafsir.klausul.temuan': '保单摘录，第 1 项条款：私人使用。事故当日的商业使用扩展：无。', // [konfirmasi PIC]
  'inv2.tafsir.klausul.ringkas': '私人使用', // [konfirmasi PIC]

  'inv2.keb-buka.1': '三份记录都已经在你的记事本里了。你再次去见 Yusuf 先生。',
  'inv2.keb-buka.2': '就像我说的，那天晚上我只是送家人回家。',
  'inv2.keb-buka.3': '记住，我们不指责。拿出一份能回答这个问题的记录：21:18 发生了什么？',
  'inv2.keb.1': '选出两条对不上的记录：一条陈述和一件证据。',
  'inv2.keb.2': '再试一次。找带时间的那份记录。',
  'inv2.keb.3': '把行程小票给 Yusuf 先生看。',
  'inv2.keb.4': '再试一次。选一份你还没试过的记录。',
  'inv2.keb.tanya': '哪份记录能回应 Yusuf 先生的陈述？',
  'inv2.pasang.tanya': '哪些记录对不上？',
  'inv2.pasang.ket': '选一条陈述和一件证据。',
  'inv2.pasang.salah.agus': 'Agus 的陈述和你笔记本里的记录并不矛盾。找出与记录不一致的那条陈述。',
  'inv2.pasang.alasan': 'Yusuf 先生说那晚他只是送家人。需要和记录核对的就是这条陈述。',
  'inv2.pasang.temuan': '“只是送家人”的陈述与行程小票对不上：21:18 的碰擦发生在 21:05 和 21:24 之间。',
  'inv2.keb.petunjuk1': '还不对。哪份记录上有时间？看高亮的那一份。',
  'inv2.keb.petunjuk2': '还是不对。碰擦发生在 21:18。哪份记录上有当晚的时间？',
  'inv2.keb.pilih.foto-interior': '出示车内照片',
  'inv2.keb.pilih.struk': '出示行程小票',
  'inv2.keb.pilih.polis-kasus2': '出示保单',
  'inv2.keb.salah.foto-interior': '水瓶和手机支架不能证明收了车费。找带“时间”的那一份。',
  'inv2.keb.salah.polis-kasus2': '保单说明的是规则，不是 21:18 发生了什么。',
  'inv2.keb.pandu.foto-interior': '那张照片只是线索，不是时间记录。我们一起来看。',
  'inv2.keb.pandu.polis-kasus2': '保单只是规则，不是那天晚上发生的事。我们一起来看。',
  'inv2.keb.lagi.foto-interior': '那张照片只是线索，不是时间记录。再试一次：找记有当晚时间的那份记录。',
  'inv2.keb.lagi.polis-kasus2': '保单只是规则，不是那天晚上发生的事。再试一次：找记有当晚时间的那份记录。',
  'inv2.keb.cap': '行程小票记录了从 21:05 到 21:24 的付费乘客。碰擦发生在 21:18。',
  'inv2.akui.tapi': '可是小票只记录了我什么时候关掉应用。乘客也可能在那之前就下车了。',
  'inv2.akui.tutup': '你想起他刚才的回答：他是靠边停车之后才结束那一单的。',
  'inv2.akui.agus': '你又指出一条记录，Agus 的陈述：那位乘客是碰擦之后才下车的。',
  'inv2.akui.1': '没错。乘客是碰擦之后下车的。我当时确实在送乘客；我以为这种用途已经包括在内了。',
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
  'inv2.pesan.baik': 'Yusuf 先生，很抱歉消息不太好。您的保单用于私人使用，而碰擦时车上载着付费乘客，并且没有扩展。因此这笔保险杠理赔我们无法批准。您可以通过 Raksa 客户服务申请复核。', // [konfirmasi PIC] 拒赔措辞、复核渠道、今后的扩展选项
  'inv2.pesan.datar': '尊敬的客户：根据保单中有关车辆使用之约定及对相关证明文件的核验结果，保险标的于事故发生时用于承保用途范围以外，且未办理扩展承保手续，故对上述损失之理赔申请不予继续受理。特此函告，敬请知悉。', // [konfirmasi PIC] 拒赔措辞
  'inv2.pesan.janji': '别担心，先生，我尽量让它这周照样赔下来。那位乘客的姓名和电话我也发给您，您可以直接找对方处理。', // [konfirmasi PIC] janji tanpa dasar + data penumpang (privasi)
  'inv2.pesan.baik.alasan': 'Yusuf 先生知道了结果、原因和复核渠道。', // [konfirmasi PIC] 复核渠道
  'inv2.pesan.janji.alasan': 'Yusuf 先生现在松了一口气，但这个承诺没有依据。',
  'inv2.pesan.baik.1': '我很失望，但我明白原因。谢谢你解释清楚，还告诉我该走什么渠道。',
  'inv2.pesan.datar.1': '抱歉，这些话我看不太懂。是拒赔了吗？那我该怎么办？',
  'inv2.pesan.datar.2': '内容没有错，但措辞难懂，Yusuf 先生也不知道自己可以申请复核。', // [konfirmasi PIC] 申请复核的权利
  'inv2.pesan.janji.1': '啊，太好了！那我这周等消息。',
  'inv2.pesan.janji.2': '调查结果没有变，乘客的资料也不能外传。没有依据的承诺会让 Yusuf 先生失望两次。', // [konfirmasi PIC] data penumpang tidak dibagikan (privasi)

  'inv2.akhir.tuntas.1': '结案了，调查员。你对双方都公平：不指责任何人就查清了事实，然后有礼貌地做了说明。',
  'inv2.akhir.tinjau.1': '结案了。事实是你自己查到的；结论我们一起理顺了。',
  'inv2.akhir.tuntas.judul': '案件告破',
  'inv2.akhir.tuntas.ringkas': '已证明车辆用途超出保单范围，Yusuf 先生也得到了说明。', // [konfirmasi PIC]
  'inv2.akhir.tinjau.judul': '结案，附带备注',
  'inv2.akhir.tinjau.ringkas': '事实已查清；结论由 Miss Raksa 理顺。',
  'inv2.pelajaran.1': '车辆的用途必须与保单一致。调查员对双方都公平，不评判用意。', // [konfirmasi PIC] 这句总结的措辞

  'inv2.balas.baik': '谢谢你对我说实话，调查员。我知道去哪里申请复核，也会去问那项扩展。', // [konfirmasi PIC] 复核渠道
  'inv2.balas.datar': '那封信我读了两遍。意思是拒赔，可我还是不知道自己还能做些什么。',
  'inv2.balas.janji': '这周就能赔下来，对吧？我已经告诉修理厂了。希望真是这样。',
  'inv2.arsip.pesan': '你给 Yusuf 先生的消息',
  'inv2.hasil.kasus3': '案件 3 · 即将推出',
  'inv.lagi.langkah.pesan': '给 Yusuf 先生的消息',
  'inv.lagi.sempurna': '满分！这是因为你的记录而更新的 Yusuf 先生的说法。',
};
