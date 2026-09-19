import type { KamusRuang } from '.';

/**
 * Jabatan & kalimat sapaan tokoh (teks `id` sama dengan shared/brand.ts TOKOH; semuanya USULAN
 * dan perlu disetujui yang bersangkutan). Nama tokoh (Mr Roger, Miss Raksa, Bu Isti, Raki)
 * tidak diterjemahkan.
 */
const kamus: KamusRuang = {
  id: {
    'ceo.jabatan': 'CEO Asuransi Raksa',
    'ceo.awal': 'Selamat datang di Misi Lindungi Kota!',
    'ceo.lobby': 'Terima kasih sudah bergabung. Selamat bermain!',
    'ceo.podium': 'Selamat untuk para juara. Terima kasih sudah ikut bermain!',
    'missRaksa.jabatan': 'Ikon Raksa CS',
    'missRaksa.gabungKode': 'Halo, selamat datang di Raksa!',
    'missRaksa.gabungKenalan': 'Senang berkenalan denganmu!',
    'isti.jabatan': 'Direktur IT',
    'isti.juri': 'Juri',
    'isti.gabung': 'Pilih karakter, lalu tekan Siap. Kalau koneksi putus, cukup buka lagi tautannya.',
    'isti.ringkasan': 'Jawaban ronde ini sudah tercatat. Ini datanya.',
    melambai: '{nama} melambaikan tangan',
  },
  en: {
    'ceo.jabatan': 'CEO of Asuransi Raksa',
    'ceo.awal': 'Welcome to Mission: Protect the City!',
    'ceo.lobby': 'Thanks for joining. Have fun!',
    'ceo.podium': 'Congratulations to the winners. Thank you all for playing!',
    'missRaksa.jabatan': 'Raksa CS Icon',
    'missRaksa.gabungKode': 'Hello, welcome to Raksa!',
    'missRaksa.gabungKenalan': 'Nice to meet you!',
    'isti.jabatan': 'IT Director',
    'isti.juri': 'Judge',
    'isti.gabung': 'Pick a character, then tap Ready. If you lose connection, just open the link again.',
    'isti.ringkasan': 'This round’s answers are in. Here are the numbers.',
    melambai: '{nama} waving',
  },
  zh: {
    'ceo.jabatan': 'Asuransi Raksa 首席执行官',
    'ceo.awal': '欢迎来到“守护城市”任务！',
    'ceo.lobby': '感谢你的加入，祝你玩得开心！',
    'ceo.podium': '恭喜各位获胜者，感谢大家的参与！',
    'missRaksa.jabatan': 'Raksa 客服形象大使',
    'missRaksa.gabungKode': '你好，欢迎来到 Raksa！',
    'missRaksa.gabungKenalan': '很高兴认识你！',
    'isti.jabatan': 'IT 总监',
    'isti.juri': '评委',
    'isti.gabung': '选择角色，然后点击“准备好了”。如果断线，重新打开链接即可。',
    'isti.ringkasan': '本回合的答案已记录，数据如下。',
    melambai: '{nama} 正在挥手',
  },
};
export default kamus;
