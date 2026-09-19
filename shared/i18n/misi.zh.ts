import type { KamusMisi } from './misi';

/**
 * Konten misi dalam bahasa Mandarin, aksara sederhana (lapisan di atas shared/missions.ts; kunci = id misi).
 *
 * Catatan penerjemahan:
 * - Pemisah ' - ' pada productLabel dan label kasus DIPERTAHANKAN: UI memotong teks di situ
 *   (mis. "案件 A - 公司用车" tampil sebagai "案件 A" pada tab sempit).
 * - Angka di sumber harus tetap ada (dijaga tes). Tanggal ditulis wajar ("2026年9月3日": tes mengizinkan
 *   tambahan angka bulan 1-12) dan "Rp200 juta" diberi keterangan "两亿印尼盾".
 * - Nominal rupiah, kode produk, "TLO", "Comprehensive", dan nama tempat/tokoh tidak diterjemahkan.
 */
export const MISI_ZH: KamusMisi = {
  // ---------------------------------------------------------------- TUTORIAL
  tutorial: {
    title: '点击练习',
    productLabel: '练习',
    location: 'Raksa 办公室',
    story:
      '比赛开始前先来个小练习。点击图中的物品（或列表中的选项）进行选择，然后按“提交”。练习的答案不计入比赛得分。',
    instruction: '点击图中的工地安全帽，然后按“提交”。',
    interactionLabel: '练习',
    rakiBriefing: '你好！我是 Raki。先来试试怎么玩吧。',
    learning: '玩法：点击进行选择，检查你的选项，然后在时间结束前按“提交答案”。',
    steps: {
      latihan: {
        prompt: '点击工地安全帽',
        opsi: {
          helm: { label: '工地安全帽' },
          kopi: { label: '咖啡' },
          kucing: { label: '小猫' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 1
  'm01-parkir': {
    title: '停车小插曲',
    productLabel: 'AUTO - 机动车辆',
    location: '城市停车场',
    story: '客户的车在停车场被剐蹭了。所有人都平安，车辆也已停在安全的位置。',
    instruction: '请选择下一步行动。',
    interactionLabel: '选择一个答案',
    rakiBriefing: '别担心，大家都平安。现在来决定正确的第一步吧。',
    learning: '清晰的记录和报告有助于理赔处理。',
    steps: {
      s1: {
        prompt: '下一步该怎么做？',
        opsi: {
          dokumentasi: { label: '记录损坏情况，并通过理赔渠道报案' },
          perbaiki: { label: '不做记录也不沟通，直接修理' },
          buang: { label: '把损坏的部件扔掉' },
          abaikan: { label: '车还能开，就当没发生过' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 2
  'm02-detektif-penyok': {
    title: '凹痕侦探',
    productLabel: 'AUTO - 机动车辆',
    location: '合作修理厂',
    story: '车辆的左前部发生了碰撞。',
    instruction: '在修理厂的六个选项中，拍下三项相关证据。',
    interactionLabel: '选择 3 项证据',
    rakiBriefing: '证据选对了，查勘就更快。只选三项哦。',
    learning: '证据应当能把车辆、损坏部位和事故联系起来。',
    steps: {
      bukti: {
        prompt: '选择 3 项相关证据',
        hint: '选了不相关的卡片会降低正确率。',
        opsi: {
          'foto-full': { label: '车辆全景照片' },
          'foto-depan-kiri': { label: '左前部损坏细节照片' },
          'foto-identitas': { label: '车辆身份照片（车牌和车架号）' },
          'foto-makanan': { label: '咖啡馆午餐照片' },
          'foto-selfie': { label: '停车场自拍' },
          'foto-kucing': { label: '引擎盖上的小猫照片' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 3
  'm03-berkas-ruko': {
    title: '商铺文件',
    productLabel: 'FIRE / PROPERTY - 火灾与财产',
    location: 'Jalan Melati 商铺',
    story: '火已扑灭，现场已确认安全。客户想准备一份初步报告。',
    instruction: '把四份合适的文件放进报告文件夹。',
    interactionLabel: '将 4 份文件放入文件夹',
    rakiBriefing: '初步报告需要四项内容。看看文件夹旁边的清单吧。',
    learning: '初步报告需要前后一致、便于核查的证据。',
    checklist: ['事故经过', '损坏照片', '受损物品清单', '损失估价'],
    steps: {
      berkas: {
        prompt: '放入符合清单的文件',
        hint: '有两张卡片不相关，放进去会降低正确率。',
        opsi: {
          kronologi: { label: '事故经过' },
          'foto-kerusakan': { label: '商铺损坏照片' },
          'daftar-barang': { label: '受损物品清单' },
          estimasi: { label: '损失估价' },
          brosur: { label: '店铺促销宣传单' },
          'struk-kopi': { label: '装修队的咖啡小票' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 4
  'm04-excavator': {
    title: '倾斜的挖掘机',
    productLabel: 'HVC - 重型设备',
    location: '新道路工地',
    story: '挖掘机在工地上打滑了。现场已做好安全防护。',
    instruction: '点击查勘准备所需的四项信息。',
    interactionLabel: '在场景中找出 4 项信息',
    rakiBriefing: '点击场景中能提供查勘信息的地方，一共有四处。',
    learning: '设备身份和事故经过有助于事故查勘。',
    steps: {
      temuan: {
        prompt: '点击场景中的 4 项信息',
        hint: '找到的信息会记入“发现记录”。点到不相关的物体会降低正确率。',
        opsi: {
          seri: { label: '设备身份／序列号', desc: '挖掘机机身上的序列号铭牌' },
          posisi: { label: '事故发生时设备的位置', desc: '设备倾斜在土坑边缘' },
          rusak: { label: '损坏的部位', desc: '动臂和底盘被刮伤' },
          operator: { label: '操作员的说明', desc: '操作员可以讲述事故经过' },
          spanduk: { label: '工程横幅' },
          warung: { label: '工地旁的咖啡小摊' },
          awan: { label: '天上的云' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 5
  'm05-polis-mana': {
    title: '是哪一张保单？',
    productLabel: 'AUTO - 机动车辆',
    location: 'Raksa 办公室',
    story:
      '两辆车各价值 Rp200 juta（两亿印尼盾），碰撞损坏的金额均为 Rp4 juta（四百万印尼盾）。假设保单有效，且模拟中的其他条件均已满足。',
    instruction: '根据保单卡，为每个案件匹配结论。',
    interactionLabel: '案件与结论配对',
    rakiBriefing: '损坏一样，保单卡却不同。先看看保单卡吧。',
    learning: '保单的保障不同，相似的损坏也可能有不同的处理结果。',
    policyCards: {
      'polis-a': {
        title: '保单卡 A',
        subtitle: 'Comprehensive（模拟）',
        rows: [
          { label: '车辆价值', value: 'Rp200.000.000' },
          { label: '碰撞损坏', value: '按卡片条款属于保障范围' },
          { label: '保单状态', value: '有效' },
        ],
        note: '用于决策练习的模拟卡片。',
      },
      'polis-b': {
        title: '保单卡 B',
        subtitle: 'TLO - Total Loss Only（模拟）',
        rows: [
          { label: '车辆价值', value: 'Rp200.000.000' },
          { label: '全损门槛', value: '至少为车辆价值的 75%' },
          { label: '本案损坏', value: 'Rp4.000.000（车辆价值的 2%）' },
        ],
        note: '用于决策练习的模拟卡片。',
      },
    },
    steps: {
      cocok: {
        prompt: '为每个案件选择结论',
        item: {
          'kasus-a': { label: '案件 A - 保单卡 A（Comprehensive）' },
          'kasus-b': { label: '案件 B - 保单卡 B（TLO）' },
        },
        kategori: {
          lanjut: { label: '可以继续进行碰撞损坏评估' },
          'tidak-ambang': { label: '损坏未达到模拟中的 TLO 门槛' },
          'perlu-data': { label: '需要补充信息后才能下结论' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 6
  'm06-paket-penyok': {
    title: '货到了，箱子却凹了',
    productLabel: 'CARGO - 货物运输',
    location: '港口与物流',
    story: '发货清单上记录了 10 箱。收货凭证上记录了 8 箱，其中 2 箱包装破损。',
    instruction: '对比文件，填写两个数字，然后选择后续处理。',
    interactionLabel: '对比文件',
    rakiBriefing: '对比一下发货清单和收货凭证，数字可不一样哦。',
    learning: '货物数量、收货时的状况和文件要放在一起核对。',
    tables: {
      pengiriman: {
        title: '发货清单',
        rows: [
          { label: '发货箱数', value: '10 箱' },
          { label: '货物种类', value: '机器零部件' },
          { label: '装货日期', value: '2026年9月3日' },
        ],
      },
      penerimaan: {
        title: '收货凭证',
        rows: [
          { label: '收货箱数', value: '8 箱' },
          { label: '包装破损', value: '2 箱' },
          { label: '收货日期', value: '2026年9月11日' },
        ],
      },
      foto: {
        title: '收货照片',
        rows: [
          { label: '照片 1', value: '收货方仓库里堆放的箱子' },
          { label: '照片 2', value: '4 号箱：包装凹陷并破开' },
          { label: '照片 3', value: '7 号箱：包装受潮并凹陷' },
        ],
      },
    },
    steps: {
      selisih: { prompt: '箱数相差多少？', unit: '箱' },
      rusak: { prompt: '收到的箱子中有多少箱包装破损？', unit: '箱' },
      tindak: {
        prompt: '选择后续处理',
        opsi: {
          dokumentasi: { label: '记录不符之处，并备齐运输文件以供查勘' },
          'bayar-semua': { label: '认定全部损失自动获得保障，并申请全额赔付' },
          tolak: { label: '什么都不记录，直接拒收整批货物' },
          diam: { label: '货已经到了，直接收下就好' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 7
  'm07-banjir-gudang': {
    title: '仓库遭遇洪水',
    productLabel: 'FIRE / PROPERTY - 火灾与财产',
    location: 'Sentra Niaga 仓库',
    story: '洪水造成了损坏。现有两份模拟保单可供对比。',
    instruction: '选出在模拟中具有相关保障的保单，然后选择理由。',
    interactionLabel: '对比两份保单',
    rakiBriefing: '留意扩展保障和保险期间。',
    learning: '风险类型和保险期间都必须核对。',
    policyCards: {
      'polis-a': {
        title: '保单 A',
        subtitle: 'Property All Risk（模拟）',
        rows: [
          { label: '洪水扩展保障', value: '已列明' },
          { label: '保险期间', value: '2026年1月1日至2026年12月31日' },
          { label: '事故日期', value: '2026年9月5日（在保险期间内）' },
          { label: '承保对象', value: 'Sentra Niaga 仓库' },
        ],
      },
      'polis-b': {
        title: '保单 B',
        subtitle: '标准火灾险（模拟）',
        rows: [
          { label: '洪水扩展保障', value: '未列明' },
          { label: '保险期间', value: '2026年1月1日至2026年12月31日' },
          { label: '事故日期', value: '2026年9月5日（在保险期间内）' },
          { label: '承保对象', value: 'Sentra Niaga 仓库' },
        ],
      },
    },
    steps: {
      polis: {
        prompt: '在模拟中，哪份保单具有相关保障？',
        opsi: {
          'polis-a': { label: '保单 A' },
          'polis-b': { label: '保单 B' },
          keduanya: { label: '两份都一样' },
        },
      },
      alasan: {
        prompt: '选择正确的理由',
        opsi: {
          'perluasan-periode': { label: '洪水扩展保障已列明，且保险期间涵盖事故日期' },
          'nilai-besar': { label: '因为它的保险金额更高' },
          'dekat-kantor': { label: '因为仓库离办公室更近' },
          'selalu-dijamin': { label: '因为所有财产保单都一定保障洪水' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 8
  'm08-benturan-keausan': {
    title: '碰撞还是磨损？',
    productLabel: 'HVC - 重型设备',
    location: '重型设备仓库',
    story: '叉车发生了碰撞。照片显示面板上有新的损坏，而此前的保养记录提到另一个部件早已磨损。',
    instruction: '把每项证据归入正确的类别。',
    interactionLabel: '证据分类',
    rakiBriefing: '分清哪些与事故有关，哪些是事故前就有的状况。',
    learning: '决定要以证据为依据；有些部分还需要补充信息。',
    policyCards: {
      'kartu-hvc': {
        title: 'HVC 保单卡 - 重型设备（模拟）',
        rows: [
          { label: '碰撞', value: '按条款属于保障范围' },
          { label: '逐渐磨损', value: '除外，不予保障' },
          { label: '承保对象', value: '叉车 GT-220' },
        ],
      },
    },
    steps: {
      klasifikasi: {
        prompt: '确定每项证据的类别',
        item: {
          panel: { label: '碰撞后面板损坏' },
          'catatan-aus': { label: '保养记录：部件在事故前已经磨损' },
          internal: { label: '内部损坏，与碰撞的关系尚不明确' },
        },
        kategori: {
          terkait: { label: '作为与事故相关的损坏进行查勘' },
          sebelumnya: { label: '单独列为事故前已有的状况' },
          teknis: { label: '需要进一步的技术检查' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 9
  'm09-hitung-teliti': {
    title: '仔细算一算',
    productLabel: 'HVC - 重型设备',
    location: 'Raksa 办公室计算台',
    story:
      '核定损失为 Rp100.000.000。免赔额为该损失的 10%，最低 Rp5.000.000。本题没有其他限额或扣减项。',
    instruction: '列出免赔额的计算过程和最终结果。',
    interactionLabel: '列出计算',
    rakiBriefing: '留意百分比的计算基数和最低金额，别弄混了。',
    learning: '留意百分比的计算基数和最低金额。',
    tables: {
      data: {
        title: '模拟数据',
        rows: [
          { label: '核定损失', value: 'Rp100.000.000' },
          { label: '免赔额', value: '该损失的 10%' },
          { label: '最低免赔额', value: 'Rp5.000.000' },
          { label: '其他限额／扣减项', value: '无' },
        ],
      },
    },
    steps: {
      persen: { prompt: '10% × Rp100.000.000 = ?' },
      risiko: { prompt: '实际采用的免赔额', hint: '把按百分比算出的结果与最低金额比较一下。' },
      hasil: { prompt: '模拟的最终结果' },
    },
  },

  // ---------------------------------------------------------------- MISI 10
  'm10-grand-mission': {
    title: '终极任务',
    productLabel: 'AUTO + HVC（重型设备）+ PROPERTY',
    location: '城市商业园区',
    story: '洪水影响了商业园区里的三项资产。所有人都平安。请查看这三个案件，然后决定下一步。',
    instruction: '分三步：匹配产品、确定核对内容，然后选择后续处理。',
    interactionLabel: '三步决策',
    rakiBriefing: '最后一个任务！做决定前，先核对承保对象、保障、保险期间和证据。',
    learning: '在决定下一步之前，先核对承保对象、保障、保险期间和证据。',
    policyCards: {
      'kasus-a': {
        title: '案件 A - 公司用车',
        subtitle: '模拟保单卡',
        rows: [
          { label: '承保对象', value: '公司用车 B 1234 XX' },
          { label: '洪水', value: '不在卡片的保障范围内' },
          { label: '保单状态', value: '有效' },
        ],
      },
      'kasus-b': {
        title: '案件 B - 重型设备',
        subtitle: '模拟保单卡',
        rows: [
          { label: '洪水', value: '在卡片的保障范围内' },
          { label: '保单卡上的序列号', value: 'EX-4471' },
          { label: '报告上的序列号', value: 'EX-4417（不一致）' },
        ],
      },
      'kasus-c': {
        title: '案件 C - 仓库',
        subtitle: '模拟保单卡',
        rows: [
          { label: '洪水扩展保障', value: '事故当日有效' },
          { label: '承保对象', value: '与保单卡相符' },
          { label: '初步证据', value: '齐全' },
        ],
      },
    },
    steps: {
      produk: {
        prompt: '第 1 步 - 为每个案件匹配产品',
        item: {
          'kasus-a': { label: '案件 A - 公司用车' },
          'kasus-b': { label: '案件 B - 重型设备' },
          'kasus-c': { label: '案件 C - 仓库' },
        },
        kategori: {
          AUTO: { label: 'AUTO' },
          HVC: { label: 'HVC（重型设备）' },
          PROPERTY: { label: 'FIRE / PROPERTY' },
          CARGO: { label: 'CARGO' },
        },
      },
      periksa: {
        prompt: '第 2 步 - 需要核对哪些信息？',
        item: {
          'kasus-a': { label: '案件 A - 公司用车' },
          'kasus-b': { label: '案件 B - 重型设备' },
          'kasus-c': { label: '案件 C - 仓库' },
        },
        kategori: {
          jaminan: { label: '保单卡上的洪水保障范围' },
          identitas: { label: '设备序列号是否一致' },
          bukti: { label: '初步证据是否齐全、承保对象是否相符' },
        },
      },
      tindak: {
        prompt: '第 3 步 - 选择后续处理',
        item: {
          'kasus-a': { label: '案件 A - 公司用车' },
          'kasus-b': { label: '案件 B - 重型设备' },
          'kasus-c': { label: '案件 C - 仓库' },
        },
        kategori: {
          'luar-jaminan': { label: '不在模拟卡片所列的保障范围内' },
          klarifikasi: { label: '先核实设备身份，再继续评估' },
          survei: { label: '按流程进入查勘／评估' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- RONDE PENENTUAN
  'm11-penentuan': {
    title: '决胜回合',
    productLabel: 'AUTO - 机动车辆',
    location: 'Raksa 办公室',
    story: '领奖台上出现并列！一道快问快答决定胜负。客户的车被剐蹭后打来电话，所有人都平安。',
    instruction: '选出工作人员最需要首先记录的信息。',
    interactionLabel: '选择一个答案，要快！',
    rakiBriefing: '决胜回合！答得对又最快的人获胜。',
    learning: '承保对象的身份和事故经过，是最重要的第一笔记录。',
    steps: {
      penentuan: {
        prompt: '最需要首先记录的信息',
        opsi: {
          'identitas-kronologi': { label: '车辆身份和简要的事故经过' },
          'warna-favorit': { label: '客户最喜欢的颜色' },
          'harga-bengkel': { label: '附近修理厂的价目表' },
          'jadwal-servis': { label: '明年的保养计划' },
        },
      },
    },
  },
};
