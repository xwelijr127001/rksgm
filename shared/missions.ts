/**
 * Konten 10 misi RAKSA GAME (data publik, tanpa kunci jawaban).
 * Kunci jawaban + penjelasan ada di server/src/answerKeys.ts.
 *
 * Semua kasus adalah SIMULASI EDUKASI.
 */

import type { MissionPublic } from './types';

export const MISSIONS: MissionPublic[] = [
  // ---------------------------------------------------------------- MISI 1
  {
    id: 'm01-parkir',
    number: 1,
    title: 'Parkir Kurang Mulus',
    product: 'AUTO',
    productLabel: 'AUTO - Kendaraan Bermotor',
    location: 'Parkiran Kota',
    scene: 'parkiran',
    story:
      'Mobil nasabah tersenggol di parkiran. Semua orang sudah aman dan kendaraan berada di posisi aman.',
    instruction: 'Pilih tindakan berikutnya.',
    interactionLabel: 'Pilih satu jawaban',
    durationSeconds: 20,
    briefingSeconds: 8,
    rakiBriefing: 'Tenang, semua aman. Sekarang tentukan langkah pertama yang benar.',
    learning: 'Dokumentasi dan laporan yang jelas membantu proses penanganan klaim.',
    steps: [
      {
        kind: 'single',
        id: 's1',
        prompt: 'Apa tindakan berikutnya?',
        presentation: 'cards',
        weight: 1,
        options: [
          {
            id: 'dokumentasi',
            label: 'Dokumentasikan kerusakan dan laporkan kejadian melalui kanal klaim',
            icon: 'kamera',
          },
          {
            id: 'perbaiki',
            label: 'Langsung memperbaiki tanpa dokumentasi atau koordinasi',
            icon: 'obeng',
          },
          { id: 'buang', label: 'Membuang bagian yang rusak', icon: 'silang' },
          {
            id: 'abaikan',
            label: 'Mengabaikan kejadian karena kendaraan masih bisa berjalan',
            icon: 'mobil',
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- MISI 2
  {
    id: 'm02-detektif-penyok',
    number: 2,
    title: 'Detektif Penyok',
    product: 'AUTO',
    productLabel: 'AUTO - Kendaraan Bermotor',
    location: 'Bengkel Mitra',
    scene: 'bengkel',
    story: 'Benturan terjadi di bagian depan kiri kendaraan.',
    instruction: 'Pilih tiga bukti yang relevan dari enam kartu bergambar.',
    interactionLabel: 'Pilih 3 bukti',
    durationSeconds: 25,
    briefingSeconds: 10,
    rakiBriefing: 'Bukti yang tepat bikin pemeriksaan lebih cepat. Pilih tiga saja.',
    learning: 'Bukti harus membantu menghubungkan kendaraan, lokasi kerusakan, dan kejadian.',
    steps: [
      {
        kind: 'multi',
        id: 'bukti',
        prompt: 'Pilih 3 bukti yang relevan',
        presentation: 'cards',
        requiredSelections: 3,
        weight: 1,
        hint: 'Memilih kartu yang tidak relevan mengurangi ketepatan.',
        options: [
          { id: 'foto-full', label: 'Foto keseluruhan kendaraan', icon: 'mobil' },
          { id: 'foto-depan-kiri', label: 'Foto detail kerusakan depan kiri', icon: 'rusak' },
          { id: 'foto-identitas', label: 'Foto identitas kendaraan (plat & nomor rangka)', icon: 'plat' },
          { id: 'foto-makanan', label: 'Foto makan siang di kafe', icon: 'makanan' },
          { id: 'foto-selfie', label: 'Selfie di parkiran', icon: 'selfie' },
          { id: 'foto-kucing', label: 'Foto kucing di kap mobil', icon: 'kucing' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- MISI 3
  {
    id: 'm03-berkas-ruko',
    number: 3,
    title: 'Berkas Ruko',
    product: 'FIRE',
    productLabel: 'FIRE / PROPERTY - Kebakaran & Harta Benda',
    location: 'Ruko Jalan Melati',
    scene: 'ruko',
    story:
      'Kebakaran sudah ditangani dan lokasi dinyatakan aman. Nasabah ingin menyiapkan laporan awal.',
    instruction: 'Masukkan empat kartu dokumen yang sesuai ke folder laporan.',
    interactionLabel: 'Masukkan 4 dokumen ke folder',
    durationSeconds: 30,
    briefingSeconds: 10,
    rakiBriefing: 'Laporan awal butuh empat isi. Lihat checklist di sebelah folder.',
    learning: 'Laporan awal perlu bukti yang konsisten dan mudah diperiksa.',
    checklist: ['Kronologi', 'Foto kerusakan', 'Daftar barang terdampak', 'Estimasi kerugian'],
    steps: [
      {
        kind: 'multi',
        id: 'berkas',
        prompt: 'Masukkan dokumen yang sesuai checklist',
        presentation: 'folder',
        requiredSelections: 4,
        weight: 1,
        hint: 'Dua kartu tidak relevan; memasukkannya mengurangi ketepatan.',
        options: [
          { id: 'kronologi', label: 'Kronologi kejadian', icon: 'dokumen' },
          { id: 'foto-kerusakan', label: 'Foto kerusakan ruko', icon: 'foto' },
          { id: 'daftar-barang', label: 'Daftar barang terdampak', icon: 'daftar' },
          { id: 'estimasi', label: 'Estimasi kerugian', icon: 'kalkulator' },
          { id: 'brosur', label: 'Brosur promo toko', icon: 'brosur' },
          { id: 'struk-kopi', label: 'Struk kopi tim renovasi', icon: 'struk' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- MISI 4
  {
    id: 'm04-excavator',
    number: 4,
    title: 'Excavator Miring',
    product: 'HVC',
    productLabel: 'HVC - Alat Berat',
    location: 'Proyek Jalan Baru',
    scene: 'proyek',
    story: 'Excavator tergelincir di proyek. Area sudah diamankan.',
    instruction: 'Ketuk empat informasi yang dibutuhkan untuk persiapan pemeriksaan.',
    interactionLabel: 'Temukan 4 informasi di adegan',
    durationSeconds: 35,
    briefingSeconds: 10,
    rakiBriefing: 'Ketuk bagian adegan yang memberi informasi pemeriksaan. Ada empat.',
    learning: 'Identitas alat dan kronologi membantu pemeriksaan kejadian.',
    steps: [
      {
        kind: 'multi',
        id: 'temuan',
        prompt: 'Ketuk 4 informasi pada adegan',
        presentation: 'hotspot',
        requiredSelections: 4,
        weight: 1,
        hint: 'Temuan masuk ke panel catatan. Objek tidak relevan mengurangi ketepatan.',
        options: [
          {
            id: 'seri',
            label: 'Identitas / nomor seri unit',
            desc: 'Plat nomor seri pada bodi excavator',
            icon: 'plat',
            hotspot: { x: 57, y: 47 },
          },
          {
            id: 'posisi',
            label: 'Posisi unit saat kejadian',
            desc: 'Unit miring di tepi galian',
            icon: 'lokasi',
            hotspot: { x: 34, y: 72 },
          },
          {
            id: 'rusak',
            label: 'Bagian yang rusak',
            desc: 'Boom & undercarriage tergores',
            icon: 'rusak',
            hotspot: { x: 71, y: 34 },
          },
          {
            id: 'operator',
            label: 'Keterangan operator',
            desc: 'Operator siap memberi kronologi',
            icon: 'operator',
            hotspot: { x: 16, y: 55 },
          },
          {
            id: 'spanduk',
            label: 'Spanduk proyek',
            icon: 'spanduk',
            hotspot: { x: 86, y: 63 },
          },
          {
            id: 'warung',
            label: 'Warung kopi di tepi proyek',
            icon: 'warung',
            hotspot: { x: 91, y: 82 },
          },
          { id: 'awan', label: 'Awan di langit', icon: 'awan', hotspot: { x: 22, y: 15 } },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- MISI 5
  {
    id: 'm05-polis-mana',
    number: 5,
    title: 'Polisnya yang Mana?',
    product: 'AUTO',
    productLabel: 'AUTO - Kendaraan Bermotor',
    location: 'Kantor Raksa',
    scene: 'kantor',
    story:
      'Dua mobil masing-masing bernilai Rp200 juta mengalami kerusakan benturan Rp4 juta. Asumsikan polis aktif dan kondisi lain dalam simulasi terpenuhi.',
    instruction: 'Cocokkan setiap kasus dengan kesimpulan berdasarkan kartu polis.',
    interactionLabel: 'Cocokkan kasus dengan kesimpulan',
    durationSeconds: 40,
    briefingSeconds: 10,
    rakiBriefing: 'Kerusakan sama, kartu polisnya beda. Baca kartunya dulu, ya.',
    learning: 'Kerusakan serupa dapat menghasilkan penanganan berbeda karena jaminan polis berbeda.',
    policyCards: [
      {
        id: 'polis-a',
        title: 'Kartu Polis A',
        subtitle: 'Comprehensive (simulasi)',
        product: 'AUTO',
        rows: [
          { label: 'Nilai kendaraan', value: 'Rp200.000.000', flag: 'info' },
          { label: 'Kerusakan benturan', value: 'Tercakup sesuai syarat kartu', flag: 'ok' },
          { label: 'Status polis', value: 'Aktif', flag: 'ok' },
        ],
        note: 'Kartu simulasi untuk latihan pengambilan keputusan.',
      },
      {
        id: 'polis-b',
        title: 'Kartu Polis B',
        subtitle: 'TLO - Total Loss Only (simulasi)',
        product: 'AUTO',
        rows: [
          { label: 'Nilai kendaraan', value: 'Rp200.000.000', flag: 'info' },
          { label: 'Ambang kerusakan total', value: 'Minimal 75% nilai kendaraan', flag: 'info' },
          { label: 'Kerusakan pada kasus', value: 'Rp4.000.000 (2% nilai kendaraan)', flag: 'no' },
        ],
        note: 'Kartu simulasi untuk latihan pengambilan keputusan.',
      },
    ],
    steps: [
      {
        kind: 'assign',
        id: 'cocok',
        prompt: 'Pilih kesimpulan untuk tiap kasus',
        presentation: 'match',
        weight: 1,
        items: [
          { id: 'kasus-a', label: 'Kasus A - Kartu Polis A (Comprehensive)', icon: 'mobil' },
          { id: 'kasus-b', label: 'Kasus B - Kartu Polis B (TLO)', icon: 'mobil' },
        ],
        buckets: [
          { id: 'lanjut', label: 'Dapat dilanjutkan untuk penilaian kerusakan benturan', icon: 'cek' },
          { id: 'tidak-ambang', label: 'Kerusakan tidak memenuhi ambang TLO dalam simulasi', icon: 'silang' },
          { id: 'perlu-data', label: 'Perlu informasi tambahan sebelum disimpulkan', icon: 'tanya' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- MISI 6
  {
    id: 'm06-paket-penyok',
    number: 6,
    title: 'Paket Datang Penyok',
    product: 'CARGO',
    productLabel: 'CARGO - Pengangkutan Barang',
    location: 'Pelabuhan & Logistik',
    scene: 'pelabuhan',
    story:
      'Daftar pengiriman mencatat 10 peti. Bukti penerimaan mencatat 8 peti, dan 2 dari peti yang diterima memiliki kemasan rusak.',
    instruction: 'Bandingkan dokumen, isi dua angka, lalu pilih tindak lanjut.',
    interactionLabel: 'Bandingkan dokumen',
    durationSeconds: 45,
    briefingSeconds: 10,
    rakiBriefing: 'Bandingkan daftar pengiriman dan bukti penerimaan. Angkanya beda, lho.',
    learning: 'Jumlah barang, kondisi penerimaan, dan dokumen perlu diperiksa bersama.',
    tables: [
      {
        id: 'pengiriman',
        title: 'Daftar Pengiriman',
        icon: 'kapal',
        rows: [
          { label: 'Jumlah peti dikirim', value: '10 peti', flag: 'info' },
          { label: 'Jenis barang', value: 'Komponen mesin', flag: 'info' },
          { label: 'Tanggal muat', value: '03 Sep 2026', flag: 'info' },
        ],
      },
      {
        id: 'penerimaan',
        title: 'Bukti Penerimaan',
        icon: 'peti',
        rows: [
          { label: 'Jumlah peti diterima', value: '8 peti', flag: 'no' },
          { label: 'Kemasan rusak', value: '2 peti', flag: 'no' },
          { label: 'Tanggal terima', value: '11 Sep 2026', flag: 'info' },
        ],
      },
      {
        id: 'foto',
        title: 'Foto Penerimaan',
        icon: 'foto',
        rows: [
          { label: 'Foto 1', value: 'Tumpukan peti di gudang penerima', flag: 'info' },
          { label: 'Foto 2', value: 'Peti #4 kemasan penyok & terbuka', flag: 'no' },
          { label: 'Foto 3', value: 'Peti #7 kemasan basah & penyok', flag: 'no' },
        ],
      },
    ],
    steps: [
      {
        kind: 'number',
        id: 'selisih',
        prompt: 'Berapa selisih jumlah peti?',
        weight: 1,
        unit: 'peti',
        format: 'angka',
        suggestions: [0, 1, 2, 3, 4],
      },
      {
        kind: 'number',
        id: 'rusak',
        prompt: 'Berapa peti diterima dengan kemasan rusak?',
        weight: 1,
        unit: 'peti',
        format: 'angka',
        suggestions: [0, 1, 2, 3, 4],
      },
      {
        kind: 'single',
        id: 'tindak',
        prompt: 'Pilih tindak lanjut',
        presentation: 'cards',
        weight: 2,
        options: [
          {
            id: 'dokumentasi',
            label: 'Dokumentasikan ketidaksesuaian dan lengkapi dokumen pengangkutan untuk pemeriksaan',
            icon: 'dokumen',
          },
          {
            id: 'bayar-semua',
            label: 'Simpulkan seluruh kerugian otomatis dijamin dan ajukan pembayaran penuh',
            icon: 'uang',
          },
          { id: 'tolak', label: 'Tolak seluruh pengiriman tanpa mencatat apa pun', icon: 'silang' },
          { id: 'diam', label: 'Terima saja karena barang sudah sampai', icon: 'peti' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- MISI 7
  {
    id: 'm07-banjir-gudang',
    number: 7,
    title: 'Banjir di Gudang',
    product: 'FIRE',
    productLabel: 'FIRE / PROPERTY - Kebakaran & Harta Benda',
    location: 'Gudang Sentra Niaga',
    scene: 'gudang',
    story: 'Kerusakan terjadi akibat banjir. Dua polis simulasi tersedia untuk dibandingkan.',
    instruction: 'Pilih polis yang memiliki jaminan relevan dalam simulasi, lalu pilih alasannya.',
    interactionLabel: 'Bandingkan dua polis',
    durationSeconds: 50,
    briefingSeconds: 10,
    rakiBriefing: 'Perhatikan perluasan jaminan dan periode polisnya.',
    learning: 'Jenis risiko dan periode pertanggungan harus diperiksa.',
    policyCards: [
      {
        id: 'polis-a',
        title: 'Polis A',
        subtitle: 'Property All Risk (simulasi)',
        product: 'FIRE',
        rows: [
          { label: 'Perluasan banjir', value: 'Tercantum', flag: 'ok' },
          { label: 'Periode polis', value: '01 Jan 2026 - 31 Des 2026', flag: 'ok' },
          { label: 'Tanggal kejadian', value: '05 Sep 2026 (dalam periode)', flag: 'ok' },
          { label: 'Objek', value: 'Gudang Sentra Niaga', flag: 'info' },
        ],
      },
      {
        id: 'polis-b',
        title: 'Polis B',
        subtitle: 'Kebakaran standar (simulasi)',
        product: 'FIRE',
        rows: [
          { label: 'Perluasan banjir', value: 'Tidak tercantum', flag: 'no' },
          { label: 'Periode polis', value: '01 Jan 2026 - 31 Des 2026', flag: 'ok' },
          { label: 'Tanggal kejadian', value: '05 Sep 2026 (dalam periode)', flag: 'info' },
          { label: 'Objek', value: 'Gudang Sentra Niaga', flag: 'info' },
        ],
      },
    ],
    steps: [
      {
        kind: 'single',
        id: 'polis',
        prompt: 'Polis mana yang memiliki jaminan relevan dalam simulasi?',
        presentation: 'cards',
        weight: 1,
        options: [
          { id: 'polis-a', label: 'Polis A', icon: 'polis' },
          { id: 'polis-b', label: 'Polis B', icon: 'polis' },
          { id: 'keduanya', label: 'Keduanya sama saja', icon: 'tanya' },
        ],
      },
      {
        kind: 'single',
        id: 'alasan',
        prompt: 'Pilih alasan yang benar',
        presentation: 'list',
        weight: 1,
        options: [
          {
            id: 'perluasan-periode',
            label: 'Perluasan banjir tercantum dan periode polis sesuai tanggal kejadian',
            icon: 'cek',
          },
          { id: 'nilai-besar', label: 'Karena nilai pertanggungannya lebih besar', icon: 'uang' },
          { id: 'dekat-kantor', label: 'Karena gudangnya lebih dekat dengan kantor', icon: 'lokasi' },
          {
            id: 'selalu-dijamin',
            label: 'Karena banjir selalu dijamin pada semua polis properti',
            icon: 'banjir',
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- MISI 8
  {
    id: 'm08-benturan-keausan',
    number: 8,
    title: 'Benturan atau Keausan?',
    product: 'HVC',
    productLabel: 'HVC - Alat Berat',
    location: 'Gudang Alat Berat',
    scene: 'gudang-forklift',
    story:
      'Forklift mengalami benturan. Foto menunjukkan kerusakan baru pada panel, sedangkan catatan servis sebelumnya menyebut komponen lain sudah aus.',
    instruction: 'Klasifikasikan tiap bukti ke kategori yang tepat.',
    interactionLabel: 'Klasifikasi bukti',
    durationSeconds: 55,
    briefingSeconds: 10,
    rakiBriefing: 'Pisahkan mana yang terkait kejadian dan mana kondisi sebelumnya.',
    learning: 'Keputusan perlu mengikuti bukti; beberapa bagian membutuhkan informasi tambahan.',
    policyCards: [
      {
        id: 'kartu-hvc',
        title: 'Kartu Polis HVC - Alat Berat (simulasi)',
        product: 'HVC',
        rows: [
          { label: 'Benturan', value: 'Termasuk jaminan sesuai syarat', flag: 'ok' },
          { label: 'Keausan bertahap', value: 'Dikecualikan', flag: 'no' },
          { label: 'Objek', value: 'Forklift GT-220', flag: 'info' },
        ],
      },
    ],
    steps: [
      {
        kind: 'assign',
        id: 'klasifikasi',
        prompt: 'Tentukan kategori tiap bukti',
        presentation: 'sort',
        weight: 1,
        items: [
          { id: 'panel', label: 'Panel rusak setelah benturan', icon: 'rusak' },
          {
            id: 'catatan-aus',
            label: 'Catatan servis: komponen sudah aus sebelum kejadian',
            icon: 'dokumen',
          },
          {
            id: 'internal',
            label: 'Kerusakan internal, hubungan dengan benturan belum jelas',
            icon: 'tanya',
          },
        ],
        buckets: [
          { id: 'terkait', label: 'Periksa sebagai kerusakan terkait kejadian', icon: 'cek' },
          { id: 'sebelumnya', label: 'Pisahkan sebagai kondisi sebelum kejadian', icon: 'jam' },
          { id: 'teknis', label: 'Perlu pemeriksaan teknis tambahan', icon: 'obeng' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- MISI 9
  {
    id: 'm09-hitung-teliti',
    number: 9,
    title: 'Hitung dengan Teliti',
    product: 'HVC',
    productLabel: 'HVC - Alat Berat',
    location: 'Meja Hitung Kantor Raksa',
    scene: 'kantor-hitung',
    story:
      'Kerugian yang disetujui Rp100.000.000. Risiko sendiri 10% dari kerugian tersebut, dengan minimum Rp5.000.000. Tidak ada batas atau pengurang lain dalam soal.',
    instruction: 'Susun perhitungan risiko sendiri dan hasil akhirnya.',
    interactionLabel: 'Susun perhitungan',
    durationSeconds: 60,
    briefingSeconds: 12,
    rakiBriefing: 'Perhatikan dasar persentase dan nilai minimumnya. Jangan tertukar.',
    learning: 'Perhatikan dasar persentase dan nilai minimum.',
    tables: [
      {
        id: 'data',
        title: 'Data Simulasi',
        icon: 'kalkulator',
        rows: [
          { label: 'Kerugian disetujui', value: 'Rp100.000.000', flag: 'info' },
          { label: 'Risiko sendiri', value: '10% dari kerugian tersebut', flag: 'info' },
          { label: 'Minimum risiko sendiri', value: 'Rp5.000.000', flag: 'info' },
          { label: 'Batas / pengurang lain', value: 'Tidak ada', flag: 'info' },
        ],
      },
    ],
    steps: [
      {
        kind: 'number',
        id: 'persen',
        prompt: '10% x Rp100.000.000 = ?',
        weight: 1,
        format: 'rupiah',
        suggestions: [5_000_000, 10_000_000, 15_000_000, 20_000_000],
      },
      {
        kind: 'number',
        id: 'risiko',
        prompt: 'Risiko sendiri yang dipakai',
        weight: 1,
        format: 'rupiah',
        suggestions: [5_000_000, 10_000_000, 15_000_000],
        hint: 'Bandingkan hasil persentase dengan nilai minimum.',
      },
      {
        kind: 'number',
        id: 'hasil',
        prompt: 'Hasil akhir simulasi',
        weight: 2,
        format: 'rupiah',
        suggestions: [85_000_000, 90_000_000, 95_000_000, 100_000_000],
      },
    ],
  },

  // ---------------------------------------------------------------- MISI 10
  {
    id: 'm10-grand-mission',
    number: 10,
    title: 'Grand Mission',
    product: 'MIX',
    productLabel: 'AUTO + HVC (Alat Berat) + PROPERTY',
    location: 'Kompleks Usaha Kota',
    scene: 'kota-banjir',
    story:
      'Banjir memengaruhi tiga aset di kompleks usaha. Semua orang sudah aman. Periksa ketiga kasus lalu tentukan langkahnya.',
    instruction: 'Tiga tahap: cocokkan produk, tentukan pemeriksaan, lalu pilih tindak lanjut.',
    interactionLabel: 'Tiga tahap keputusan',
    durationSeconds: 75,
    briefingSeconds: 12,
    rakiBriefing: 'Misi terakhir! Periksa objek, jaminan, periode, dan bukti sebelum memutuskan.',
    learning: 'Periksa objek, jaminan, periode, dan bukti sebelum menentukan langkah berikutnya.',
    policyCards: [
      {
        id: 'kasus-a',
        title: 'Kasus A - Mobil operasional',
        subtitle: 'Kartu polis simulasi',
        product: 'AUTO',
        rows: [
          { label: 'Objek', value: 'Mobil operasional B 1234 XX', flag: 'info' },
          { label: 'Banjir', value: 'Tidak tercakup pada kartu', flag: 'no' },
          { label: 'Status polis', value: 'Aktif', flag: 'ok' },
        ],
      },
      {
        id: 'kasus-b',
        title: 'Kasus B - Alat berat',
        subtitle: 'Kartu polis simulasi',
        product: 'HVC',
        rows: [
          { label: 'Banjir', value: 'Tercakup pada kartu', flag: 'ok' },
          { label: 'Nomor seri kartu polis', value: 'EX-4471', flag: 'info' },
          { label: 'Nomor seri pada laporan', value: 'EX-4417 (berbeda)', flag: 'no' },
        ],
      },
      {
        id: 'kasus-c',
        title: 'Kasus C - Gudang',
        subtitle: 'Kartu polis simulasi',
        product: 'FIRE',
        rows: [
          { label: 'Perluasan banjir', value: 'Aktif pada tanggal kejadian', flag: 'ok' },
          { label: 'Objek', value: 'Sesuai kartu polis', flag: 'ok' },
          { label: 'Bukti awal', value: 'Lengkap', flag: 'ok' },
        ],
      },
    ],
    steps: [
      {
        kind: 'assign',
        id: 'produk',
        prompt: 'Tahap 1 - Cocokkan produk tiap kasus',
        presentation: 'stage',
        weight: 1,
        items: [
          { id: 'kasus-a', label: 'Kasus A - Mobil operasional', icon: 'mobil' },
          { id: 'kasus-b', label: 'Kasus B - Alat berat', icon: 'excavator' },
          { id: 'kasus-c', label: 'Kasus C - Gudang', icon: 'gudang' },
        ],
        buckets: [
          { id: 'AUTO', label: 'AUTO', icon: 'mobil' },
          { id: 'HVC', label: 'HVC (Alat Berat)', icon: 'excavator' },
          { id: 'PROPERTY', label: 'FIRE / PROPERTY', icon: 'gudang' },
          { id: 'CARGO', label: 'CARGO', icon: 'peti' },
        ],
      },
      {
        kind: 'assign',
        id: 'periksa',
        prompt: 'Tahap 2 - Informasi apa yang perlu diperiksa?',
        presentation: 'stage',
        weight: 1,
        items: [
          { id: 'kasus-a', label: 'Kasus A - Mobil operasional', icon: 'mobil' },
          { id: 'kasus-b', label: 'Kasus B - Alat berat', icon: 'excavator' },
          { id: 'kasus-c', label: 'Kasus C - Gudang', icon: 'gudang' },
        ],
        buckets: [
          { id: 'jaminan', label: 'Cakupan banjir pada kartu polis', icon: 'polis' },
          { id: 'identitas', label: 'Kesesuaian nomor seri unit', icon: 'plat' },
          { id: 'bukti', label: 'Kelengkapan bukti awal & kesesuaian objek', icon: 'dokumen' },
        ],
      },
      {
        kind: 'assign',
        id: 'tindak',
        prompt: 'Tahap 3 - Pilih tindak lanjut',
        presentation: 'stage',
        weight: 2,
        items: [
          { id: 'kasus-a', label: 'Kasus A - Mobil operasional', icon: 'mobil' },
          { id: 'kasus-b', label: 'Kasus B - Alat berat', icon: 'excavator' },
          { id: 'kasus-c', label: 'Kasus C - Gudang', icon: 'gudang' },
        ],
        buckets: [
          {
            id: 'luar-jaminan',
            label: 'Di luar jaminan yang tercantum pada kartu simulasi',
            icon: 'silang',
          },
          {
            id: 'klarifikasi',
            label: 'Klarifikasi identitas unit sebelum melanjutkan penilaian',
            icon: 'tanya',
          },
          { id: 'survei', label: 'Lanjutkan ke survei / penilaian sesuai prosedur', icon: 'cek' },
        ],
      },
    ],
  },
];

export const MISSION_BY_ID = new Map(MISSIONS.map((m) => [m.id, m]));

/**
 * Ronde penentuan (opsional, dijalankan host bila podium seri).
 * Waktu pendek supaya bonus kecepatan memisahkan peringkat.
 */
export const TIEBREAK_MISSION: MissionPublic = {
  id: 'm11-penentuan',
  number: 11,
  title: 'Ronde Penentuan',
  product: 'AUTO',
  productLabel: 'AUTO - Kendaraan Bermotor',
  location: 'Kantor Raksa',
  scene: 'kantor',
  story:
    'Seri di podium! Satu pertanyaan cepat menentukan pemenang. Nasabah menelepon setelah kendaraannya tersenggol dan semua orang sudah aman.',
  instruction: 'Pilih informasi pertama yang paling perlu dicatat petugas.',
  interactionLabel: 'Pilih satu jawaban - cepat!',
  durationSeconds: 15,
  briefingSeconds: 8,
  rakiBriefing: 'Ronde penentuan! Yang tepat dan tercepat menang.',
  learning: 'Identitas objek dan kronologi kejadian adalah catatan pertama yang paling penting.',
  steps: [
    {
      kind: 'single',
      id: 'penentuan',
      prompt: 'Informasi pertama yang paling perlu dicatat',
      presentation: 'cards',
      weight: 1,
      options: [
        {
          id: 'identitas-kronologi',
          label: 'Identitas kendaraan dan kronologi singkat kejadian',
          icon: 'plat',
        },
        { id: 'warna-favorit', label: 'Warna favorit nasabah', icon: 'tanya' },
        { id: 'harga-bengkel', label: 'Daftar harga bengkel terdekat', icon: 'uang' },
        { id: 'jadwal-servis', label: 'Jadwal servis tahun depan', icon: 'jam' },
      ],
    },
  ],
};

/** Misi khusus tutorial (tidak masuk skor kompetisi). */
export const TUTORIAL_MISSION: MissionPublic = {
  id: 'tutorial',
  number: 0,
  title: 'Latihan Mengetuk',
  product: 'AUTO',
  productLabel: 'Latihan',
  location: 'Kantor Raksa',
  scene: 'kantor',
  story:
    'Latihan singkat sebelum pertandingan. Ketuk kartu untuk memilih, lalu tekan Kirim Jawaban. Jawaban latihan tidak dihitung pada skor kompetisi.',
  instruction: 'Ketuk kartu bergambar helm, lalu tekan Kirim Jawaban.',
  interactionLabel: 'Latihan',
  durationSeconds: 45,
  briefingSeconds: 0,
  rakiBriefing: 'Hai! Aku Raki. Coba dulu cara mainnya, ya.',
  learning:
    'Cara main: ketuk untuk memilih, periksa pilihanmu, lalu tekan Kirim Jawaban sebelum waktu habis.',
  steps: [
    {
      kind: 'single',
      id: 'latihan',
      prompt: 'Ketuk kartu bergambar helm proyek',
      presentation: 'cards',
      weight: 1,
      options: [
        { id: 'helm', label: 'Helm proyek', icon: 'operator' },
        { id: 'kopi', label: 'Kopi', icon: 'warung' },
        { id: 'kucing', label: 'Kucing', icon: 'kucing' },
      ],
    },
  ],
};
