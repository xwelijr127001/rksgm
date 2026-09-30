import type { KamusRuang } from './index';

/**
 * Ruang kamus `ceritaAkhir`: teks ANTARMUKA layar akhir cerita v2 (kartu akhir, pemilih bagian, 'Lihat perjalananku'): client/src/cerita/ui/LayarAkhir.tsx & sekitarnya.
 * Kontrak: docs/rancangan-mode-cerita.md bagian 11. Kunci & parameter harus sama di id, en, zh (../terjemahan.test.ts).
 * Teks episode (dialog, kartu akhir, istilah) TIDAK di sini: ada di client/src/cerita/episode/<id>/teks.*.ts.
 *
 * Catatan:
 * - Nama tokoh selalu lewat parameter ({nama}: teks episode), tidak pernah ditulis di kamus.
 * - Kata nada akhir, status langkah (Tepat/Keliru), konfirmasi ulang episode, dan catatan simulasi dipakai ulang
 *   dari cerita.nada.*, cerita.proses.*, cerita.ulang*, misi.catatanSimulasiPeriksa (tidak digandakan di sini).
 * - Tanpa bahasa skor/poin/waktu: kartu menjelaskan akibat, bukan menilai pemain.
 */
const kamus: KamusRuang = {
  id: {
    // --- Kartu akhir
    perasaanAkhir: '{nama}: {suasana}',
    perasaanSesudah: 'Sesudahnya: {suasana}',
    pelajaranLabel: 'Pelajaran',
    selesai: 'Selesai',
    cobaJalurLain: 'Coba jalur lain',
    cobaLagiDari: 'Coba lagi dari bagian {judul}',
    ulangAwal: 'Ulang dari awal',
    ulangKet: 'Pilihanmu sejak bagian itu diganti; akhir yang sudah ditemukan tetap tercatat.',
    lihatPerjalanan: 'Lihat perjalananku',

    // --- Pemilih bagian
    pemilihJudul: 'Coba jalur lain',
    pemilihKet: 'Cerita diulang dari awal bagian itu; pilihanmu sesudahnya diganti. Akhir yang sudah ditemukan tetap tercatat.',
    bagianN: 'Bagian {n}: {judul}',
    disarankan: 'Disarankan',
    ulangBaru: 'Ulang dari awal sebagai perjalanan baru',
    tutup: 'Tutup',

    // --- Lihat perjalananku
    perjalananJudul: 'Perjalananku',
    membantu: 'Yang membantu',
    perhatian: 'Yang perlu diperhatikan',
    kenapa: 'Kenapa berakhir begini',
    subPerasaan: 'Perasaan {nama}',
    subLangkah: 'Langkah klaim',
    subPaham: 'Yang dipahami {nama}',
    subBelumPaham: 'Yang belum dipahami {nama}',
    diperbaiki: 'Diperbaiki',
    belumDilakukan: 'Belum dilakukan',
    kosongMembantu: 'Belum ada yang tercatat membantu di perjalanan ini.',
    kosongPerhatian: 'Tidak ada yang tertinggal di perjalanan ini.',
    kosongPerhatianDiluruskan: 'Semua langkah akhirnya diluruskan, tetapi {nama} belum sepenuhnya tenang. Penyebabnya ada di bawah.',
    pesanMentor: 'Pesan {nama}',
    temuan: 'Akhir yang ditemukan {n}/{total}',
    akhirIni: 'akhir ini',
    latihanJudul: 'Latihan terkait (tidak wajib)',
    cobaBagianLain: 'Coba dari bagian lain',
  },
  en: {
    perasaanAkhir: '{nama}: {suasana}',
    perasaanSesudah: 'Afterwards: {suasana}',
    pelajaranLabel: 'Takeaway',
    selesai: 'Done',
    cobaJalurLain: 'Try another path',
    cobaLagiDari: 'Try again from “{judul}”',
    ulangAwal: 'Start over',
    ulangKet: 'Your choices from that part on are replaced; endings you found stay recorded.',
    lihatPerjalanan: 'See my journey',

    pemilihJudul: 'Try another path',
    pemilihKet: 'The story restarts at the beginning of that part; your later choices are replaced. Endings you found stay recorded.',
    bagianN: 'Part {n}: {judul}',
    disarankan: 'Suggested',
    ulangBaru: 'Start over as a new run',
    tutup: 'Close',

    perjalananJudul: 'My journey',
    membantu: 'What helped',
    perhatian: 'What needs attention',
    kenapa: 'Why it ended this way',
    subPerasaan: 'How {nama} felt',
    subLangkah: 'Claim steps',
    subPaham: 'What {nama} understood',
    subBelumPaham: 'What {nama} does not understand yet',
    diperbaiki: 'Corrected',
    belumDilakukan: 'Not done yet',
    kosongMembantu: 'Nothing on this run was recorded as helping yet.',
    kosongPerhatian: 'Nothing was left behind on this run.',
    kosongPerhatianDiluruskan: 'Every step was eventually put right, but {nama} isn’t fully at ease yet. The reason is below.',
    pesanMentor: 'A word from {nama}',
    temuan: 'Endings found {n}/{total}',
    akhirIni: 'this ending',
    latihanJudul: 'Related practice (optional)',
    cobaBagianLain: 'Try from another part',
  },
  zh: {
    perasaanAkhir: '{nama}：{suasana}',
    perasaanSesudah: '之后：{suasana}',
    pelajaranLabel: '要点',
    selesai: '完成',
    cobaJalurLain: '试试另一条路线',
    cobaLagiDari: '从“{judul}”部分重试',
    ulangAwal: '从头开始',
    ulangKet: '从该部分起的选择会被替换；已发现的结局仍会保留。',
    lihatPerjalanan: '查看我的历程',

    pemilihJudul: '试试另一条路线',
    pemilihKet: '故事会从该部分的开头重新开始，之后的选择会被替换。已发现的结局仍会保留。',
    bagianN: '第 {n} 部分：{judul}',
    disarankan: '建议',
    ulangBaru: '作为新的历程从头开始',
    tutup: '关闭',

    perjalananJudul: '我的历程',
    membantu: '有帮助的做法',
    perhatian: '需要注意的地方',
    kenapa: '为什么是这个结局',
    subPerasaan: '{nama}的感受',
    subLangkah: '理赔步骤',
    subPaham: '{nama}已明白的内容',
    subBelumPaham: '{nama}尚未明白的内容',
    diperbaiki: '已纠正',
    belumDilakukan: '尚未进行',
    kosongMembantu: '这次历程中还没有记录到有帮助的做法。',
    kosongPerhatian: '这次历程没有遗漏。',
    kosongPerhatianDiluruskan: '所有步骤最后都更正了，但{nama}还没有完全安心。原因见下方。',
    pesanMentor: '{nama}的提醒',
    temuan: '已发现结局 {n}/{total}',
    akhirIni: '本结局',
    latihanJudul: '相关练习（可选）',
    cobaBagianLain: '从其他部分重试',
  },
};

export default kamus;
