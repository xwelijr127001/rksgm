import type { KamusRuang } from '.';

/**
 * Halaman panitia/host (client/src/pages/Host.tsx). Teks `id` = teks asli halaman (jangan diubah:
 * uji e2e mencocokkannya). "kode room" di en/zh memakai istilah yang dilihat pemain di HP
 * (game code / 游戏代码). `catatanAset.id` harus sama dengan BRAND.assetNote bawaan.
 */
const kamus: KamusRuang = {
  id: {
    // kepala halaman & pesan umum
    layarHost: 'Layar Host',
    koneksiBelumStabil:
      'Koneksi ke server belum stabil. Tombol kendali bisa gagal sampai status kembali "Tersambung".',
    chipRoom: 'Room {kode}',

    // buat room / masuk dengan token
    buatRoom: 'Buat Room',
    namaAcara: 'Nama acara',
    buatRoomBaru: 'Buat Room Baru',
    lanjutkanRoom: 'Lanjutkan room {kode}',
    masukToken: 'Masuk dengan token host',
    masukTokenKet: 'Pakai ini bila kamu berpindah browser atau perangkat.',
    kodeRoom: 'Kode room (4 huruf)',
    tokenHost: 'Token host',
    tempelToken: 'tempel token di sini',
    masukSebagaiHost: 'Masuk sebagai Host',
    infoToken:
      'Token host berbeda dari kode room peserta. Kode room boleh dibagikan; token host jangan dibagikan ke peserta karena bisa dipakai mengendalikan pertandingan.',

    // undang peserta
    undangPeserta: 'Undang Peserta',
    caraGabung: 'Peserta memindai QR atau membuka tautan di atas, lalu memasukkan kode room.',
    salinTautan: 'Salin tautan',
    bukaProyektor: 'Buka layar proyektor',
    tautanDisalin: 'Tautan sudah disalin.',
    salinManual:
      'Browser ini tidak mengizinkan salin otomatis. Salin tautan berikut secara manual:',
    salinManualAria: 'Tautan undangan untuk disalin manual',
    catatanAset:
      'Logo & warna resmi belum diverifikasi dari raksaonline.com. Ganti di shared/brand.ts.',

    // kendali pertandingan
    kendali: 'Kendali Pertandingan',
    ronde: 'Ronde {n} / {total}',
    misiJudul: 'Misi {n}: {judul}',
    belumAdaMisi: 'Belum ada misi aktif',
    jawabanMasuk: 'Jawaban masuk {masuk} / {total} peserta',
    terhubung: 'Terhubung {n} / {total}',
    dijeda: 'Pertandingan dijeda. Tekan "Lanjutkan" agar tombol ronde bisa dipakai lagi.',
    dijedaSisa:
      'Pertandingan dijeda dengan sisa {detik} detik. Tekan "Lanjutkan" agar tombol ronde bisa dipakai lagi.',
    mulaiTutorial: 'Mulai Tutorial',
    mulaiPertandingan: 'Mulai Pertandingan',
    mulaiMenjawab: 'Mulai Menjawab Sekarang',
    tutupRonde: 'Tutup Ronde',
    tampilkanPeringkat: 'Tampilkan Peringkat',
    selesaikan: 'Selesaikan Pertandingan',
    rondeBerikutnya: 'Ronde Berikutnya',
    rondePenentuan: 'Ronde Penentuan',
    lanjutkan: 'Lanjutkan',
    jeda: 'Jeda',
    mulaiNonaktif:
      'Tombol "Mulai Pertandingan" nonaktif karena belum ada peserta yang bergabung.',
    adaSeri: 'Ada peringkat seri di puncak. Ronde penentuan memakai satu misi tambahan.',
    akhiri: 'Akhiri Pertandingan',
    akhiriJudul: 'Akhiri pertandingan sekarang?',
    akhiriPesan:
      'Semua peserta langsung dipindahkan ke halaman hasil. Ronde yang belum dimainkan tidak dijalankan. Skor yang sudah terkumpul tetap tersimpan dan masih bisa diekspor.',
    akhiriSetuju: 'Ya, akhiri',
    reset: 'Reset Pertandingan',
    resetJudul: 'Reset pertandingan?',
    resetPesan:
      'Semua skor, jawaban, dan peringkat dihapus lalu room kembali ke lobby. Tindakan ini tidak bisa dibatalkan - ekspor CSV dulu bila hasilnya masih dibutuhkan.',
    resetSetuju: 'Ya, reset',
    lanjutOtomatis: 'Lanjut otomatis antar ronde',
    otomatisAktif:
      'Aktif: ronde berpindah sendiri saat waktu habis, kamu tidak perlu menekan tombol.',
    otomatisNonaktif: 'Nonaktif: setiap perpindahan ronde menunggu kamu menekan tombol.',

    // kesiapan adegan
    infoAdegan:
      'Adegan 2D dimuat di HP peserta sejak lobby. Bila HP peserta tidak sanggup menampilkannya, peserta otomatis memakai gambar sederhana dan tetap bisa menjawab lewat daftar pilihan.',
    kesiapan: 'Kesiapan Adegan',
    adeganSiap: 'Adegan siap {n} / {total}',
    tanpaTambahanWaktu:
      'Melanjutkan ronde tidak memberi tambahan waktu bagi peserta yang belum siap - waktu menjawab dihitung server dan sama untuk semua.',
    belumAdaPesertaRoom: 'Belum ada peserta di room ini.',
    kesiapanKosong:
      'Kesiapan dihitung ulang setiap ronde. Belum ada misi aktif, jadi daftar ini kosong sampai ronde pertama dimulai.',
    semuaSiap: 'Semua peserta sudah memuat adegan ronde ini.',
    adeganBelumTampil: 'adegan belum tampil',
    terputusKecil: 'terputus',
    mintaMuatUlang: 'Minta muat ulang adegan',

    // pengaturan acara
    pengaturan: 'Pengaturan Acara',
    namaAcaraDisimpan: 'Nama acara disimpan.',
    simpanNamaAcara: 'Simpan nama acara',
    hadiahJuara1: 'Hadiah Juara 1',
    hadiahJuara2: 'Hadiah Juara 2',
    hadiahJuara3: 'Hadiah Juara 3',
    hadiahDisimpan: 'Label hadiah disimpan.',
    simpanHadiah: 'Simpan label hadiah',
    berlakuSetelahSimpan: 'Perubahan baru berlaku setelah kamu menekan tombol simpan.',

    // daftar peserta
    aktif: 'Aktif',
    terputus: 'Terputus',
    sudahKirim: 'Sudah kirim',
    sudahKirimDetik: 'Sudah kirim ({detik}s)',
    belumKirim: 'Belum kirim',
    keluarkan: 'Keluarkan',
    keluarkanJudul: 'Keluarkan {nama}?',
    keluarkanPesan:
      'Peserta ini langsung keluar dari room dan skornya tidak lagi dihitung. Ia bisa bergabung lagi lewat QR bila pertandingan belum dimulai.',
    keluarkanSetuju: 'Ya, keluarkan',
    daftarPeserta: 'Daftar Peserta',
    jumlahPeserta: '{n} peserta',
    belumAdaPeserta: 'Belum ada peserta. Minta peserta memindai QR.',
    kolomPeserta: 'Peserta',
    kolomKoneksi: 'Koneksi',
    kolomRondeIni: 'Ronde ini',
    kolomPoin: 'Poin',
    kolomPeringkat: 'Peringkat',
    kolomAksi: 'Aksi',

    // papan peringkat, podium, ekspor
    papanPeringkat: 'Papan Peringkat Terkini',
    podium: 'Podium',
    juara1: 'Juara 1',
    juara2: 'Juara 2',
    juara3: 'Juara 3',
    juaraN: 'Juara {n}',
    poin: '{poin} poin',
    eksporHasil: 'Ekspor Hasil',
    eksporCsv: 'Ekspor CSV',
    eksporJson: 'Ekspor JSON',
    eksporKet:
      'File berisi hasil lengkap per misi untuk tiap peserta: ketepatan, poin, bonus kecepatan, dan waktu menjawab. Unduh sebelum menekan reset.',
  },

  en: {
    layarHost: 'Host Screen',
    koneksiBelumStabil:
      'The connection to the server is not stable yet. Control buttons may fail until the status shows "Connected" again.',
    chipRoom: 'Room {kode}',

    buatRoom: 'Create a Room',
    namaAcara: 'Event name',
    buatRoomBaru: 'Create New Room',
    lanjutkanRoom: 'Continue room {kode}',
    masukToken: 'Enter with a host token',
    masukTokenKet: 'Use this if you switch to another browser or device.',
    kodeRoom: 'Game code (4 letters)',
    tokenHost: 'Host token',
    tempelToken: 'paste the token here',
    masukSebagaiHost: 'Enter as Host',
    infoToken:
      "The host token is not the same as the players' game code. The game code may be shared; never share the host token with players, because it can be used to control the game.",

    undangPeserta: 'Invite Players',
    caraGabung: 'Players scan the QR code or open the link above, then enter the game code.',
    salinTautan: 'Copy link',
    bukaProyektor: 'Open projector screen',
    tautanDisalin: 'Link copied.',
    salinManual: 'This browser does not allow automatic copying. Please copy the link below by hand:',
    salinManualAria: 'Invitation link to copy by hand',
    catatanAset:
      'The official logo and colours have not been verified against raksaonline.com yet. Change them in shared/brand.ts.',

    kendali: 'Game Controls',
    ronde: 'Round {n} / {total}',
    misiJudul: 'Mission {n}: {judul}',
    belumAdaMisi: 'No active mission yet',
    jawabanMasuk: 'Answers in: {masuk} / {total} players',
    terhubung: 'Connected {n} / {total}',
    dijeda: 'The game is paused. Press "Resume" to use the round buttons again.',
    dijedaSisa:
      'The game is paused with {detik} seconds left. Press "Resume" to use the round buttons again.',
    mulaiTutorial: 'Start Tutorial',
    mulaiPertandingan: 'Start the Game',
    mulaiMenjawab: 'Start Answering Now',
    tutupRonde: 'Close Round',
    tampilkanPeringkat: 'Show Leaderboard',
    selesaikan: 'Finish the Game',
    rondeBerikutnya: 'Next Round',
    rondePenentuan: 'Tie-break Round',
    lanjutkan: 'Resume',
    jeda: 'Pause',
    mulaiNonaktif: 'The "Start the Game" button is disabled because no players have joined yet.',
    adaSeri: 'There is a tie at the top of the leaderboard. The tie-break round uses one extra mission.',
    akhiri: 'End the Game',
    akhiriJudul: 'End the game now?',
    akhiriPesan:
      'All players are moved to the results page straight away. Rounds that have not been played will not run. Points already earned are kept and can still be exported.',
    akhiriSetuju: 'Yes, end it',
    reset: 'Reset the Game',
    resetJudul: 'Reset the game?',
    resetPesan:
      'All scores, answers and rankings are deleted and the room goes back to the lobby. This cannot be undone - export the CSV first if you still need the results.',
    resetSetuju: 'Yes, reset',
    lanjutOtomatis: 'Move between rounds automatically',
    otomatisAktif:
      'On: rounds move on by themselves when time runs out, so you do not need to press any button.',
    otomatisNonaktif: 'Off: every move to the next round waits for you to press a button.',

    infoAdegan:
      "The 2D scenes load on players' phones from the lobby onwards. If a phone cannot display them, that player automatically gets simple pictures and can still answer from a list of choices.",
    kesiapan: 'Scene Readiness',
    adeganSiap: 'Scenes ready {n} / {total}',
    tanpaTambahanWaktu:
      'Moving the round on does not give extra time to players who are not ready - answer time is counted by the server and is the same for everyone.',
    belumAdaPesertaRoom: 'No players in this room yet.',
    kesiapanKosong:
      'Readiness is counted again every round. There is no active mission yet, so this list stays empty until the first round starts.',
    semuaSiap: "All players have loaded this round's scene.",
    adeganBelumTampil: 'scene not showing yet',
    terputusKecil: 'disconnected',
    mintaMuatUlang: 'Ask to reload the scene',

    pengaturan: 'Event Settings',
    namaAcaraDisimpan: 'Event name saved.',
    simpanNamaAcara: 'Save event name',
    hadiahJuara1: '1st place prize',
    hadiahJuara2: '2nd place prize',
    hadiahJuara3: '3rd place prize',
    hadiahDisimpan: 'Prize labels saved.',
    simpanHadiah: 'Save prize labels',
    berlakuSetelahSimpan: 'Changes only take effect after you press a save button.',

    aktif: 'Online',
    terputus: 'Disconnected',
    sudahKirim: 'Submitted',
    sudahKirimDetik: 'Submitted ({detik}s)',
    belumKirim: 'Not submitted yet',
    keluarkan: 'Remove',
    keluarkanJudul: 'Remove {nama}?',
    keluarkanPesan:
      'This player leaves the room straight away and their score is no longer counted. They can join again with the QR code if the game has not started.',
    keluarkanSetuju: 'Yes, remove',
    daftarPeserta: 'Player List',
    jumlahPeserta: '{n} players',
    belumAdaPeserta: 'No players yet. Ask players to scan the QR code.',
    kolomPeserta: 'Player',
    kolomKoneksi: 'Connection',
    kolomRondeIni: 'This round',
    kolomPoin: 'Points',
    kolomPeringkat: 'Rank',
    kolomAksi: 'Action',

    papanPeringkat: 'Current Leaderboard',
    podium: 'Podium',
    juara1: '1st place',
    juara2: '2nd place',
    juara3: '3rd place',
    juaraN: 'Place {n}',
    poin: '{poin} points',
    eksporHasil: 'Export Results',
    eksporCsv: 'Export CSV',
    eksporJson: 'Export JSON',
    eksporKet:
      'The file holds the full results per mission for every player: accuracy, points, speed bonus and answer time. Download it before you press reset.',
  },

  zh: {
    layarHost: '主持人页面',
    koneksiBelumStabil: '与服务器的连接还不稳定。在状态恢复为“已连接”之前，控制按钮可能会失效。',
    chipRoom: '房间 {kode}',

    buatRoom: '创建房间',
    namaAcara: '活动名称',
    buatRoomBaru: '创建新房间',
    lanjutkanRoom: '继续房间 {kode}',
    masukToken: '用主持人令牌进入',
    masukTokenKet: '更换浏览器或设备时，请用这个方式进入。',
    kodeRoom: '游戏代码（4 个字母）',
    tokenHost: '主持人令牌',
    tempelToken: '在此粘贴令牌',
    masukSebagaiHost: '以主持人身份进入',
    infoToken:
      '主持人令牌不同于玩家用的游戏代码。游戏代码可以分享；主持人令牌请勿告诉玩家，因为它可以用来控制比赛。',

    undangPeserta: '邀请玩家',
    caraGabung: '玩家扫描二维码或打开上方链接，然后输入游戏代码。',
    salinTautan: '复制链接',
    bukaProyektor: '打开投影大屏',
    tautanDisalin: '链接已复制。',
    salinManual: '此浏览器不允许自动复制。请手动复制下面的链接：',
    salinManualAria: '供手动复制的邀请链接',
    catatanAset: '官方标志和颜色尚未对照 raksaonline.com 核实。请在 shared/brand.ts 中更换。',

    kendali: '比赛控制',
    ronde: '第 {n} / {total} 回合',
    misiJudul: '任务 {n}：{judul}',
    belumAdaMisi: '暂无进行中的任务',
    jawabanMasuk: '已提交答案：{masuk} / {total} 位玩家',
    terhubung: '已连接 {n} / {total}',
    dijeda: '比赛已暂停。点击“继续”后，回合按钮才能再次使用。',
    dijedaSisa: '比赛已暂停，还剩 {detik} 秒。点击“继续”后，回合按钮才能再次使用。',
    mulaiTutorial: '开始教程',
    mulaiPertandingan: '开始比赛',
    mulaiMenjawab: '现在开始答题',
    tutupRonde: '结束本回合',
    tampilkanPeringkat: '显示排行榜',
    selesaikan: '完成比赛',
    rondeBerikutnya: '下一回合',
    rondePenentuan: '决胜回合',
    lanjutkan: '继续',
    jeda: '暂停',
    mulaiNonaktif: '还没有玩家加入，所以“开始比赛”按钮暂时不能使用。',
    adaSeri: '排行榜榜首出现并列。决胜回合会使用一个附加任务。',
    akhiri: '结束比赛',
    akhiriJudul: '现在结束比赛吗？',
    akhiriPesan:
      '所有玩家会立即转到结果页面。尚未进行的回合不再进行。已获得的分数会保留，仍然可以导出。',
    akhiriSetuju: '是的，结束',
    reset: '重置比赛',
    resetJudul: '要重置比赛吗？',
    resetPesan:
      '所有分数、答案和排名都会被删除，房间将回到大厅。此操作无法撤销——如果还需要结果，请先导出 CSV。',
    resetSetuju: '是的，重置',
    lanjutOtomatis: '回合之间自动推进',
    otomatisAktif: '已开启：时间一到，回合会自动推进，你不需要按任何按钮。',
    otomatisNonaktif: '已关闭：每次进入下一回合，都要等你按下按钮。',

    infoAdegan:
      '2D 场景从大厅阶段起就会在玩家的手机上加载。如果手机无法显示，玩家会自动改用简单图片，仍然可以通过选项列表作答。',
    kesiapan: '场景就绪情况',
    adeganSiap: '场景已就绪 {n} / {total}',
    tanpaTambahanWaktu:
      '推进回合不会给尚未就绪的玩家额外时间——答题时间由服务器统一计算，人人相同。',
    belumAdaPesertaRoom: '这个房间里还没有玩家。',
    kesiapanKosong:
      '每个回合都会重新统计就绪情况。目前没有进行中的任务，所以在第一回合开始之前，此列表为空。',
    semuaSiap: '所有玩家都已加载本回合的场景。',
    adeganBelumTampil: '场景尚未显示',
    terputusKecil: '已断线',
    mintaMuatUlang: '请玩家重新加载场景',

    pengaturan: '活动设置',
    namaAcaraDisimpan: '活动名称已保存。',
    simpanNamaAcara: '保存活动名称',
    hadiahJuara1: '第一名奖品',
    hadiahJuara2: '第二名奖品',
    hadiahJuara3: '第三名奖品',
    hadiahDisimpan: '奖品名称已保存。',
    simpanHadiah: '保存奖品名称',
    berlakuSetelahSimpan: '按下保存按钮后，更改才会生效。',

    aktif: '在线',
    terputus: '已断线',
    sudahKirim: '已提交',
    sudahKirimDetik: '已提交（{detik} 秒）',
    belumKirim: '尚未提交',
    keluarkan: '移出',
    keluarkanJudul: '要移出 {nama} 吗？',
    keluarkanPesan:
      '该玩家会立即离开房间，分数也不再计入。如果比赛还没开始，对方可以通过二维码重新加入。',
    keluarkanSetuju: '是的，移出',
    daftarPeserta: '玩家列表',
    jumlahPeserta: '{n} 位玩家',
    belumAdaPeserta: '还没有玩家。请让玩家扫描二维码。',
    kolomPeserta: '玩家',
    kolomKoneksi: '连接',
    kolomRondeIni: '本回合',
    kolomPoin: '分数',
    kolomPeringkat: '排名',
    kolomAksi: '操作',

    papanPeringkat: '当前排行榜',
    podium: '领奖台',
    juara1: '第一名',
    juara2: '第二名',
    juara3: '第三名',
    juaraN: '第 {n} 名',
    poin: '{poin} 分',
    eksporHasil: '导出结果',
    eksporCsv: '导出 CSV',
    eksporJson: '导出 JSON',
    eksporKet:
      '文件包含每位玩家每个任务的完整结果：正确率、分数、速度加分和答题用时。请在按下重置之前下载。',
  },
};
export default kamus;
