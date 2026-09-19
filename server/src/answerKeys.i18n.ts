/**
 * Terjemahan ringkasan & penjelasan jawaban. SERVER ONLY, sama seperti answerKeys.ts:
 * teks ini membocorkan kunci, jadi tidak pernah di-import client dan baru dikirim saat REVEAL
 * (ditempelkan buildReveal ke `MissionReveal.terjemahan`).
 * Kunci luar = id misi; `steps` = penjelasan per stepId.
 *
 * Catatan penerjemahan:
 * - Nominal rupiah, persen, kode produk (AUTO, HVC, FIRE / PROPERTY), "TLO", dan "Comprehensive"
 *   ditulis persis seperti sumbernya (tes penjaga mencocokkan deret angka dengan teks Indonesia).
 * - Bilangan yang di sumbernya ditulis dengan kata ("tiga", "empat") tetap ditulis dengan kata
 *   (three / 三), bukan angka, supaya deret angkanya tidak berubah.
 */
import type { BahasaLain } from '../../shared/bahasa';

export interface TeksPembahasan { summary: string; steps: Record<string, string> }

export const PEMBAHASAN_I18N: Record<BahasaLain, Record<string, TeksPembahasan>> = {
  // ------------------------------------------------------------------ ENGLISH
  en: {
    tutorial: {
      summary: 'The safety helmet card is the answer. This practice does not count towards the competition score.',
      steps: {
        latihan: 'That is how it works: tap a card to select it, then press Submit Answer.',
      },
    },
    'm01-parkir': {
      summary:
        'Document the damage first, then report it through the claims channel so the incident is properly recorded.',
      steps: {
        s1: 'Repairing straight away, throwing away the damaged parts, or ignoring the incident means the evidence is lost. Documentation plus a report keeps a clear trail of what happened.',
      },
    },
    'm02-detektif-penyok': {
      summary: 'Three pieces of evidence that link the vehicle, the point of damage, and its identity.',
      steps: {
        bukti:
          'The photo of the whole vehicle shows its condition, the close-up photo of the front-left damage shows the point of impact, and the identity photo confirms that the right vehicle is being inspected. Photos of lunch, a selfie, and a cat do not help the inspection.',
      },
    },
    'm03-berkas-ruko': {
      summary: 'The four documents that match the initial report checklist go into the folder.',
      steps: {
        berkas:
          'The initial report checklist: sequence of events, damage photos, list of affected items, and loss estimate. The shop promotion brochure and the coffee receipt have nothing to do with the incident.',
      },
    },
    'm04-excavator': {
      summary:
        "Four pieces of inspection information: the unit's identity, the unit's position, the damaged parts, and the operator's statement.",
      steps: {
        temuan:
          "The serial number confirms which unit is being inspected, the unit's position and the damaged parts explain what happened, and the operator's statement completes the sequence of events. The banner, the coffee stall, and the clouds add nothing to the inspection.",
      },
    },
    'm05-polis-mana': {
      summary:
        'Card A (Comprehensive) can proceed; Card B (TLO) does not meet the total loss threshold in this simulation.',
      steps: {
        cocok:
          'Card A states that impact damage is covered, so the assessment can proceed. Card B is TLO with a threshold of at least 75% of the vehicle value; damage of Rp4 million against a value of Rp200 million is only 2%, so it does not meet the threshold in this simulation.',
      },
    },
    'm06-paket-penyok': {
      summary:
        'A difference of 2 crates, 2 crates received with damaged packaging, then document the discrepancy and complete the transport documents.',
      steps: {
        selisih: '10 crates shipped - 8 crates received = a difference of 2 crates.',
        rusak: 'The proof of receipt and the photos show that 2 crates were received with damaged packaging.',
        tindak:
          'The discrepancy in quantity and the condition of the packaging need to be recorded, then the transport documents completed for inspection. Do not conclude that the whole loss is automatically covered.',
      },
    },
    'm07-banjir-gudang': {
      summary: 'Policy A, because the flood extension is listed and the policy period covers the date of the incident.',
      steps: {
        polis:
          'Only Policy A lists the flood extension. Policy B does not list it, so that card has no relevant cover for flood.',
        alasan:
          'The reason is the type of risk (the flood extension is listed) and a policy period that covers the date of the incident - not the size of the sum insured, the distance of the location, or the assumption that flood is always covered.',
      },
    },
    'm08-benturan-keausan': {
      summary:
        'Panel = related to the incident, wear record = condition before the incident, internal damage = needs a technical inspection.',
      steps: {
        klasifikasi:
          'The simulation policy card covers impact and excludes gradual wear and tear. The panel damaged after the impact is inspected as damage related to the incident; the record of wear before the incident is set aside; internal damage whose link to the impact is not yet clear needs a further technical inspection.',
      },
    },
    'm09-hitung-teliti': {
      summary: '10% x Rp100.000.000 = Rp10.000.000; deductible Rp10.000.000; final result Rp90.000.000.',
      steps: {
        persen: '10% of the approved loss of Rp100.000.000 is Rp10.000.000.',
        risiko:
          'The percentage result of Rp10.000.000 is higher than the minimum of Rp5.000.000, so the amount used is Rp10.000.000.',
        hasil: 'Rp100.000.000 - Rp10.000.000 = Rp90.000.000 in this simulation.',
      },
    },
    'm10-grand-mission': {
      summary:
        'A: AUTO, check the flood cover, outside the cover on the card. B: HVC, check the serial number, clarify the identity. C: PROPERTY, check the evidence & insured object, proceed to survey.',
      steps: {
        produk: 'Company car = AUTO, heavy equipment = HVC, warehouse = FIRE / PROPERTY.',
        periksa:
          'In Case A, check the flood cover on the card; in Case B, check the serial number because the report and the card differ; in Case C, the initial evidence is complete and the insured object matches, so those are the points to check.',
        tindak:
          "A: flood is not covered on the simulation card, so it is outside the listed cover. B: the serial numbers differ, so clarify the unit's identity first. C: the cover, insured object, and evidence all match, so proceed to survey / assessment according to procedure.",
      },
    },
    'm11-penentuan': {
      summary: 'The vehicle identity and a brief sequence of events are the first things to record.',
      steps: {
        penentuan:
          'Without the identity of the insured object and the sequence of events, the inspection cannot begin. The other information has nothing to do with the incident.',
      },
    },
  },

  // ------------------------------------------------------------------ 简体中文
  zh: {
    tutorial: {
      summary: '工地安全帽卡片就是答案。本次练习不计入比赛得分。',
      steps: {
        latihan: '就是这样操作：点击卡片进行选择，然后按“提交答案”。',
      },
    },
    'm01-parkir': {
      summary: '先记录损坏情况，再通过理赔渠道报案，让事故留下清楚的记录。',
      steps: {
        s1: '直接修理、扔掉损坏的部件，或者当作什么都没发生，都会让证据消失。记录加报案，才能留住事故的痕迹。',
      },
    },
    'm02-detektif-penyok': {
      summary: '三项证据，把车辆、损坏部位和车辆身份联系起来。',
      steps: {
        bukti:
          '车辆全景照片显示车辆的状况，左前部损坏细节照片显示碰撞部位，车辆身份照片用来确认查勘的车辆没有弄错。午餐照片、自拍和小猫照片对查勘没有帮助。',
      },
    },
    'm03-berkas-ruko': {
      summary: '符合初步报告清单的四份文件放入文件夹。',
      steps: {
        berkas:
          '初步报告清单：事故经过、损坏照片、受损物品清单和损失估价。促销宣传单和咖啡小票与事故无关。',
      },
    },
    'm04-excavator': {
      summary: '四项查勘信息：设备身份、设备位置、损坏的部位和操作员的说明。',
      steps: {
        temuan:
          '序列号确认查勘的是哪台设备，设备位置和损坏的部位说明事故情况，操作员的说明补全事故经过。横幅、咖啡小摊和云不能为查勘增加任何信息。',
      },
    },
    'm05-polis-mana': {
      summary: '保单卡 A（Comprehensive）可以继续处理；保单卡 B（TLO）在模拟中未达到全损门槛。',
      steps: {
        cocok:
          '保单卡 A 写明碰撞损坏属于保障范围，因此可以继续评估。保单卡 B 是 TLO，门槛为至少车辆价值的 75%；Rp4 juta（四百万印尼盾）的损坏只占车辆价值 Rp200 juta（两亿印尼盾）的 2%，因此在本次模拟中未达到门槛。',
      },
    },
    'm06-paket-penyok': {
      summary: '相差 2 箱，收到的箱子中有 2 箱包装破损，然后记录不符之处并备齐运输文件。',
      steps: {
        selisih: '发货 10 箱 - 收货 8 箱 = 相差 2 箱。',
        rusak: '收货凭证和照片显示，收到的箱子中有 2 箱包装破损。',
        tindak:
          '数量不符和包装状况都需要记录下来，然后备齐运输文件以供查勘。不要直接认定全部损失自动获得保障。',
      },
    },
    'm07-banjir-gudang': {
      summary: '保单 A，因为洪水扩展保障已列明，而且保险期间相符。',
      steps: {
        polis: '只有保单 A 列明了洪水扩展保障。保单 B 没有列明，所以洪水风险不在这份保单的保障之内。',
        alasan:
          '理由在于风险类型（洪水扩展保障已列明）以及保险期间涵盖事故日期——而不是保险金额高低、地点远近，或“洪水一定有保障”的想法。',
      },
    },
    'm08-benturan-keausan': {
      summary: '面板 = 与事故相关，磨损记录 = 事故前已有的状况，内部损坏 = 需要技术检查。',
      steps: {
        klasifikasi:
          '模拟保单卡保障碰撞，但逐渐磨损被列为除外，不予保障。碰撞后损坏的面板，作为与事故相关的损坏进行查勘；事故前的磨损记录要单独列出；内部损坏与碰撞的关系尚不明确，需要进一步的技术检查。',
      },
    },
    'm09-hitung-teliti': {
      summary: '10% × Rp100.000.000 = Rp10.000.000；免赔额 Rp10.000.000；最终结果 Rp90.000.000。',
      steps: {
        persen: '核定损失 Rp100.000.000 的 10% 是 Rp10.000.000。',
        risiko: '按百分比算出的 Rp10.000.000 高于最低金额 Rp5.000.000，因此采用 Rp10.000.000。',
        hasil: '在本次模拟中，Rp100.000.000 - Rp10.000.000 = Rp90.000.000。',
      },
    },
    'm10-grand-mission': {
      summary:
        'A：AUTO，核对洪水保障范围，不在卡片的保障范围内。B：HVC，核对序列号，先核实设备身份。C：PROPERTY，核对证据和承保对象，进入查勘。',
      steps: {
        produk: '公司用车 = AUTO，重型设备 = HVC，仓库 = FIRE / PROPERTY。',
        periksa:
          '案件 A 需要核对保单卡上的洪水保障范围；案件 B 需要核对序列号，因为报告和保单卡上的不一致；案件 C 的初步证据齐全、承保对象相符，所以要核对的正是这一方面。',
        tindak:
          'A：模拟卡片不保障洪水，因此不在所列的保障范围内。B：序列号不一致，先核实设备身份。C：保障、承保对象和证据都相符，按流程进入查勘／评估。',
      },
    },
    'm11-penentuan': {
      summary: '车辆身份和简要的事故经过，是首先要记录的内容。',
      steps: {
        penentuan: '没有承保对象的身份和事故经过，查勘就无法开始。其他信息与事故无关。',
      },
    },
  },
};
