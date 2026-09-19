import type { KamusLabel } from './label';

/**
 * Label adegan bahasa Mandarin, aksara sederhana (kunci = id misi).
 * Batas: maks 8 aksara (idealnya 2-5). Istilah mengikuti shared/i18n/misi.zh.ts
 * (mis. "案件 A", "保单 A", "收货凭证", "保养记录") supaya label cocok dengan opsi panjangnya.
 */
export const LABEL_ZH: KamusLabel = {
  tutorial: {
    objek: {
      helm: '工地安全帽',
      kopi: '咖啡',
      kucing: '小猫',
    },
  },

  'm01-parkir': {
    objek: {
      buang: '扔掉部件',
      abaikan: '置之不理',
      dokumentasi: '拍照报案',
      perbaiki: '直接修理',
    },
  },

  'm02-detektif-penyok': {
    objek: {
      mobil: '车辆全景',
      penyok: '凹痕',
      plat: '车牌',
      kucing: '小猫',
      makan: '午餐',
      selfie: '自拍',
    },
  },

  'm03-berkas-ruko': {
    objek: {
      'foto-kerusakan': '损坏照片',
      'struk-kopi': '咖啡小票',
      'daftar-barang': '受损物品清单',
      estimasi: '损失估价',
      kronologi: '事故经过',
      brosur: '促销宣传单',
      folder: '报告文件夹',
    },
  },

  'm04-excavator': {
    objek: {
      awan: '云朵',
      operator: '操作员',
      rantai: '设备位置',
      plat: '序列号',
      boom: '损坏部位',
      spanduk: '横幅',
      warung: '咖啡小摊',
    },
  },

  'm05-polis-mana': {
    objek: {
      'stempel-lanjut': '可继续评估',
      'stempel-ambang': '未达门槛',
      'stempel-data': '需补充信息',
      'map-a': '案件 A',
      'map-b': '案件 B',
      'kartu-a': '保单 A',
      'kartu-b': '保单 B',
    },
    kategori: {
      'cocok:lanjut': '可继续评估',
      'cocok:tidak-ambang': '未达门槛',
      'cocok:perlu-data': '需补充信息',
    },
  },

  'm06-paket-penyok': {
    objek: {
      'dok-kiriman': '发货清单',
      'dok-foto': '收货照片',
      'dok-terima': '收货凭证',
      'aksi-catat': '记录',
      'aksi-bayar': '赔付',
      'aksi-tolak': '拒收',
      'aksi-terima': '收下',
    },
    papan: {
      catatan: { title: '现场记录', lines: ['箱数相差', '包装破损'] },
    },
  },

  'm07-banjir-gudang': {
    objek: {
      'binder-a': '保单 A',
      'binder-b': '保单 B',
      kalender: '日历',
      kardus: '湿纸箱',
    },
  },

  'm08-benturan-keausan': {
    objek: {
      kartu: '保单卡',
      panel: '面板损坏',
      mesin: '内部损坏',
      catatan: '保养记录',
      'baki-terkait': '与事故相关',
      'baki-sebelumnya': '事故前状况',
      'baki-teknis': '技术检查',
    },
    kategori: {
      'klasifikasi:terkait': '与事故相关',
      'klasifikasi:sebelumnya': '事故前状况',
      'klasifikasi:teknis': '技术检查',
    },
  },

  'm09-hitung-teliti': {
    objek: {
      data: '模拟数据',
    },
    papan: {
      lembar: { title: '计算表', lines: ['10% × Rp100.000.000', '免赔额', '最终结果'] },
    },
  },

  'm10-grand-mission': {
    objek: {
      'kasus-a': '案件 A',
      'kasus-b': '案件 B',
      'kasus-c': '案件 C',
      'polis-a': '保单 A',
      'polis-b': '保单 B',
      'polis-c': '保单 C',
    },
    kategori: {
      'produk:AUTO': 'AUTO',
      'produk:HVC': 'HVC',
      // Kode produk tidak diterjemahkan; dipendekkan ke "PROPERTY" (id kategori & productLabel misi 10)
      // karena batas stiker Mandarin 9 aksara ("FIRE/PROPERTY" = 13).
      'produk:PROPERTY': 'PROPERTY',
      'produk:CARGO': 'CARGO',
      'periksa:jaminan': '核对保障',
      'periksa:identitas': '核对序列号',
      'periksa:bukti': '核对证据',
      'tindak:luar-jaminan': '不在保障内',
      'tindak:klarifikasi': '先核实身份',
      'tindak:survei': '进入查勘',
    },
  },

  'm11-penentuan': {
    objek: {
      warna: '喜欢的颜色',
      harga: '修理厂价目表',
      plat: '车牌和事故经过',
      jadwal: '保养计划',
    },
  },
};
