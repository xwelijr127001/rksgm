import type { KamusRuang } from './index';

/**
 * Ruang kamus `ceritaAkt`: teks ANTARMUKA aktivitas cerita v2 (album foto, kartu polis yang bisa diperiksa, konfirmasi foto belum lengkap): client/src/cerita/ui/Aktivitas.tsx & sekitarnya.
 * Kontrak: docs/rancangan-mode-cerita.md bagian 11. Kunci & parameter harus sama di id, en, zh (../terjemahan.test.ts).
 * Teks episode (dialog, kartu akhir, istilah) TIDAK di sini: ada di client/src/cerita/episode/<id>/teks.*.ts.
 * Tanpa bahasa poin/waktu (mode cerita tidak menilai dengan angka dan tidak berwaktu). {nama} = nama nasabah dari
 * teks episode (tidak ada nama tokoh yang ditulis mati di sini).
 */
const kamus: KamusRuang = {
  id: {
    // Penghitung album foto (MissionPlay labelHitung).
    hitungFoto: '{n}/{maks} foto',
    // Keterangan di bawah adegan sebelum "Mulai" bila gambar tidak bisa disentuh (mode ringan / engine gagal).
    ketDaftarMulai: 'Setelah kamu menekan “{tombol}”, pilihannya tersedia sebagai daftar.',
    // Konfirmasi kirim foto yang belum lengkap (MissionPlay konfirmasiKurang).
    fotoKurangJudul: 'Baru {n} dari {total} foto dipilih',
    fotoKurangAkibat: 'Foto yang belum dipilih tidak ikut di laporan {nama}.',
    lengkapiFoto: 'Lengkapi foto',
    kirimFotoSatu: 'Kirim dengan {n} foto',
    kirimFotoBanyak: 'Kirim dengan {n} foto',
    // Cadangan untuk langkah lain yang belum lengkap (episode berikutnya).
    kurangJudul: 'Belum semua diisi',
    kurangAkibat: 'Yang belum diisi tidak ikut dalam jawabanmu.',
    lengkapi: 'Lengkapi dulu',
    kirimApaAdanya: 'Kirim apa adanya',
    // Umpan balik: kelompok pilihan setelah dikirim (ikon + kata; bukan warna saja).
    'kelompok.membantu': 'Yang membantu',
    'kelompok.terlewat': 'Yang terlewat',
    'kelompok.kurang': 'Kurang membantu',
    // "Kenapa begitu?": sisi langkah klaim & sisi perasaan nasabah dipisah.
    langkahKlaim: 'Langkah klaim',
    pilihanmu: 'Pilihanmu',
    perasaan: 'Perasaan {nama}',
    // Kartu polis yang bisa diperiksa.
    kartuKet: 'Ketuk baris kartu untuk melihat artinya.',
  },
  en: {
    hitungFoto: '{n}/{maks} photos',
    ketDaftarMulai: 'After you press “{tombol}”, the choices are available as a list.',
    fotoKurangJudul: 'Only {n} of {total} photos chosen',
    fotoKurangAkibat: 'Photos you have not chosen will not be in {nama}’s report.',
    lengkapiFoto: 'Choose more photos',
    kirimFotoSatu: 'Send with {n} photo',
    kirimFotoBanyak: 'Send with {n} photos',
    kurangJudul: 'Not everything is filled in',
    kurangAkibat: 'Anything left empty will not be part of your answer.',
    lengkapi: 'Finish first',
    kirimApaAdanya: 'Send as it is',
    'kelompok.membantu': 'Helped',
    'kelompok.terlewat': 'Missed',
    'kelompok.kurang': 'Did not help',
    langkahKlaim: 'Claim step',
    pilihanmu: 'Your choice',
    perasaan: 'How {nama} feels',
    kartuKet: 'Tap a line on the card to see what it means.',
  },
  zh: {
    hitungFoto: '{n}/{maks} 张照片',
    ketDaftarMulai: '按下“{tombol}”后，可以从列表中选择。',
    fotoKurangJudul: '只选了 {n}/{total} 张照片',
    fotoKurangAkibat: '没有选的照片不会放进 {nama} 的报告。',
    lengkapiFoto: '继续选照片',
    kirimFotoSatu: '用 {n} 张照片提交',
    kirimFotoBanyak: '用 {n} 张照片提交',
    kurangJudul: '还没有全部填写',
    kurangAkibat: '没有填写的部分不会包含在你的回答里。',
    lengkapi: '先填完',
    kirimApaAdanya: '按现在的内容提交',
    'kelompok.membantu': '有帮助的',
    'kelompok.terlewat': '漏掉的',
    'kelompok.kurang': '帮助不大的',
    langkahKlaim: '理赔步骤',
    pilihanmu: '你的选择',
    perasaan: '{nama}的感受',
    kartuKet: '点按卡片上的一行，查看它的意思。',
  },
};

export default kamus;
