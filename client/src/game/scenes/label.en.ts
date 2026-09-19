import type { KamusLabel } from './label';

/**
 * Label adegan bahasa Inggris (kunci = id misi).
 * Batas: maks 18 huruf; lebar tiap label dijaga kira-kira <= label Indonesia di posisi yang sama
 * (tata letak adegan disetel untuk lebar label Indonesia). Istilah mengikuti shared/i18n/misi.en.ts.
 */
export const LABEL_EN: KamusLabel = {
  tutorial: {
    objek: {
      helm: 'Safety helmet',
      kopi: 'Coffee',
      kucing: 'Cat',
    },
  },

  'm01-parkir': {
    objek: {
      buang: 'Throw away parts',
      abaikan: 'Ignore it',
      dokumentasi: 'Photo & report',
      perbaiki: 'Repair now',
    },
  },

  'm02-detektif-penyok': {
    objek: {
      mobil: 'Whole vehicle',
      penyok: 'Dent',
      plat: 'Number plate',
      kucing: 'Cat',
      makan: 'Lunch',
      selfie: 'Selfie',
    },
  },

  'm03-berkas-ruko': {
    objek: {
      'foto-kerusakan': 'Photos',
      'struk-kopi': 'Coffee receipt',
      'daftar-barang': 'Item list',
      estimasi: 'Loss estimate',
      kronologi: 'Event sequence',
      brosur: 'Brochure',
      folder: 'Report folder',
    },
  },

  'm04-excavator': {
    objek: {
      awan: 'Clouds',
      operator: 'Operator',
      rantai: 'Unit position',
      plat: 'Serial no.',
      boom: 'Damaged parts',
      spanduk: 'Banner',
      warung: 'Coffee stall',
    },
  },

  'm05-polis-mana': {
    objek: {
      'stempel-lanjut': 'Can proceed',
      'stempel-ambang': 'Below threshold',
      'stempel-data': 'Need more info',
      'map-a': 'Case A',
      'map-b': 'Case B',
      'kartu-a': 'Policy A',
      'kartu-b': 'Policy B',
    },
    kategori: {
      'cocok:lanjut': 'Can proceed',
      'cocok:tidak-ambang': 'Below threshold',
      'cocok:perlu-data': 'Need more info',
    },
  },

  'm06-paket-penyok': {
    objek: {
      'dok-kiriman': 'Shipping list',
      'dok-foto': 'Crate photos',
      'dok-terima': 'Receipt',
      'aksi-catat': 'Record',
      'aksi-bayar': 'Pay',
      'aksi-tolak': 'Reject',
      'aksi-terima': 'Accept',
    },
    papan: {
      catatan: { title: "Officer's notes", lines: ['Difference', 'Damaged'] },
    },
  },

  'm07-banjir-gudang': {
    objek: {
      'binder-a': 'Policy A',
      'binder-b': 'Policy B',
      kalender: 'Calendar',
      kardus: 'Wet boxes',
    },
  },

  'm08-benturan-keausan': {
    objek: {
      kartu: 'Policy card',
      // Lebar dijaga: 'Dented panel' & 'Service log' mengapit 'Internal damage' (jarak label ~190).
      panel: 'Dented panel',
      mesin: 'Internal damage',
      catatan: 'Service log',
      // Tiga nampan berjarak 183 dan semuanya berpenanda saat dipilih: label tengah harus pendek.
      'baki-terkait': 'Incident-related',
      'baki-sebelumnya': 'Pre-existing',
      'baki-teknis': 'Technical check',
    },
    kategori: {
      'klasifikasi:terkait': 'Incident-related',
      'klasifikasi:sebelumnya': 'Pre-existing',
      'klasifikasi:teknis': 'Technical check',
    },
  },

  'm09-hitung-teliti': {
    objek: {
      data: 'Simulation data',
    },
    papan: {
      lembar: { title: 'Calculation sheet', lines: ['10% x Rp100.000.000', 'Deductible', 'Final result'] },
    },
  },

  'm10-grand-mission': {
    objek: {
      'kasus-a': 'Case A',
      'kasus-b': 'Case B',
      'kasus-c': 'Case C',
      'polis-a': 'Policy A',
      'polis-b': 'Policy B',
      'polis-c': 'Policy C',
    },
    kategori: {
      'produk:AUTO': 'AUTO',
      'produk:HVC': 'HVC',
      'produk:PROPERTY': 'FIRE/PROPERTY',
      'produk:CARGO': 'CARGO',
      'periksa:jaminan': 'Check cover',
      'periksa:identitas': 'Check serial no.',
      'periksa:bukti': 'Check evidence',
      'tindak:luar-jaminan': 'Not covered',
      'tindak:klarifikasi': 'Clarify first',
      'tindak:survei': 'Proceed to survey',
    },
  },

  'm11-penentuan': {
    objek: {
      warna: 'Favourite colour',
      harga: 'Workshop prices',
      plat: 'Plate & events',
      jadwal: 'Service schedule',
    },
  },
};
