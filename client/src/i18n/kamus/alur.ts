import type { KamusRuang } from './index';

/**
 * Ruang kamus `alur`: alur masuk pemain (docs/rancangan-bank-soal.md bagian 2).
 *  - Landing  : tautan "Punya kode acara?", baris "Main sebagai X · ubah", spanduk acara terbuka.
 *  - Kenalan  : sapaan Miss Raksa, judul/aksi versi baru & versi "ubah".
 *  - Join     : keadaan pemeriksaan kode (GET /api/room/:code/info) dan langkah 2 dengan profil.
 *
 * Catatan:
 * - Kalimat Miss Raksa (`miss*`) adalah USULAN tim game, sama seperti sapaan di shared/brand.ts.
 *   Nama tokoh tidak diterjemahkan.
 * - `pemainMenungguSatu` ada untuk bahasa Inggris (tunggal); id & zh sama dengan bentuk jamaknya.
 * - Teks lama yang tetap dipakai (pemain.ayoMain, pemain.judulKenalan, pemain.ikutBermain, ...)
 *   tidak disalin ke sini.
 * Kunci harus sama di id, en, zh (dijaga ../terjemahan.test.ts).
 */
const kamus: KamusRuang = {
  id: {
    // --- Landing
    punyaKode: 'Punya kode acara?',
    mainSebagai: 'Main sebagai {nama}',
    ubahKecil: 'ubah',
    ubahProfilAria: 'Ubah nama dan karakter',
    acaraDibuka: 'Acara «{nama}» sedang dibuka',
    gabung: 'Gabung',

    // --- Kenalan
    labelKenalan: 'Kenalan dulu',
    labelUbah: 'Ubah karakter',
    missKenalan: 'Hai! Aku yang menemanimu di tiap misi. Kenalan dulu, yuk!',
    missUbah: 'Mau ganti gaya, {nama}? Boleh banget!',
    judulUbah: 'Ubah nama & karakter',
    simpanMain: 'Simpan & main',
    simpanLanjut: 'Simpan & lanjut',
    simpanPerubahan: 'Simpan perubahan',
    catatanPerangkat: 'Tersimpan di perangkat ini saja.',

    // --- Join, langkah 1: pemeriksaan kode
    cekPetunjuk: 'Begitu 4 karakter terisi, kodenya langsung dicek.',
    cekMemeriksa: 'Memeriksa kode…',
    cekDitemukan: 'Kode ditemukan',
    pemainMenunggu: '{n} pemain menunggu',
    pemainMenungguSatu: '{n} pemain menunggu',
    pemainMenungguNol: 'Belum ada pemain lain. Kamu yang pertama!',
    cekTiadaSaran: 'Cek lagi 4 karakter di layar acara, ya.',
    cekTolak: 'Permainan ini sedang tidak menerima pemain baru.',
    cekGagal: 'Belum bisa memeriksa kode.',
    cekGagalSaran: 'Cek koneksimu lalu coba lagi. Boleh juga langsung lanjut: kodenya dicek lagi saat kamu masuk.',
    cobaLagi: 'Coba lagi',
    belumPunyaKode: 'Belum punya kode? Main sendiri dulu',

    // --- Join, langkah 2: sudah punya profil
    missHaloLagi: 'Halo lagi, {nama}! Senang ketemu kamu.',
    judulSiap: 'Siap masuk?',
    ketSiap: 'Begini kamu tampil di layar acara.',
  },
  en: {
    // --- Landing
    punyaKode: 'Got an event code?',
    mainSebagai: 'Playing as {nama}',
    ubahKecil: 'change',
    ubahProfilAria: 'Change your name and character',
    acaraDibuka: 'The event “{nama}” is open now',
    gabung: 'Join',

    // --- Kenalan
    labelKenalan: 'Say hello first',
    labelUbah: 'Change character',
    missKenalan: 'Hi! I’ll be with you on every mission. Let’s get to know you first!',
    missUbah: 'Fancy a new look, {nama}? Go for it!',
    judulUbah: 'Change your name & character',
    simpanMain: 'Save & play',
    simpanLanjut: 'Save & continue',
    simpanPerubahan: 'Save changes',
    catatanPerangkat: 'Saved on this device only.',

    // --- Join, step 1: checking the code
    cekPetunjuk: 'As soon as all 4 characters are in, we’ll check the code.',
    cekMemeriksa: 'Checking the code…',
    cekDitemukan: 'Code found',
    pemainMenunggu: '{n} players waiting',
    pemainMenungguSatu: '{n} player waiting',
    pemainMenungguNol: 'No other players yet. You’re the first!',
    cekTiadaSaran: 'Please check the 4 characters on the event screen again.',
    cekTolak: 'This game isn’t taking new players right now.',
    cekGagal: 'Couldn’t check the code just yet.',
    cekGagalSaran: 'Check your connection and try again. You can also just continue: the code is checked again when you join.',
    cobaLagi: 'Try again',
    belumPunyaKode: 'No code yet? Play solo first',

    // --- Join, step 2: profile already saved
    missHaloLagi: 'Hello again, {nama}! Good to see you.',
    judulSiap: 'Ready to go in?',
    ketSiap: 'This is how you’ll appear on the event screen.',
  },
  zh: {
    // --- Landing
    punyaKode: '有活动代码吗？',
    mainSebagai: '以“{nama}”的身份游戏',
    ubahKecil: '修改',
    ubahProfilAria: '修改名字和角色',
    acaraDibuka: '活动“{nama}”正在开放',
    gabung: '加入',

    // --- Kenalan
    labelKenalan: '先认识一下',
    labelUbah: '修改角色',
    missKenalan: '嗨！每个任务我都会陪着你。先来认识一下吧！',
    missUbah: '{nama}，想换个造型吗？当然可以！',
    judulUbah: '修改名字和角色',
    simpanMain: '保存并开始',
    simpanLanjut: '保存并继续',
    simpanPerubahan: '保存修改',
    catatanPerangkat: '仅保存在这台设备上。',

    // --- Join，第 1 步：检查代码
    cekPetunjuk: '填满 4 个字符后，会立刻检查代码。',
    cekMemeriksa: '正在检查代码……',
    cekDitemukan: '已找到代码',
    pemainMenunggu: '{n} 位玩家正在等待',
    pemainMenungguSatu: '{n} 位玩家正在等待',
    pemainMenungguNol: '还没有其他玩家，你是第一个！',
    cekTiadaSaran: '请再核对一下活动大屏上的 4 个字符。',
    cekTolak: '这场游戏暂时不接受新玩家。',
    cekGagal: '暂时无法检查代码。',
    cekGagalSaran: '请检查网络后再试一次。也可以直接继续：加入时会再次检查代码。',
    cobaLagi: '再试一次',
    belumPunyaKode: '还没有代码？先自己玩',

    // --- Join，第 2 步：已有个人资料
    missHaloLagi: '{nama}，又见面了！很高兴见到你。',
    judulSiap: '准备进入了吗？',
    ketSiap: '你会以这个形象出现在活动大屏上。',
  },
};

export default kamus;
