/**
 * Konfigurasi terpusat RAKSA GAME: identitas acara, warna, hadiah, durasi fase.
 * Ubah di sini untuk menyesuaikan acara tanpa menyentuh komponen UI.
 */

export const BRAND = {
  gameName: 'RAKSA GAME',
  theme: 'Raksa Claim: Misi Lindungi Kota',
  tagline: '10 misi. Ambil keputusan tepat. Jadilah pahlawan tercepat.',
  company: 'PT Asuransi Raksa Pratikara',
  companion: 'Raki',
  /**
   * Palet usulan desain game (BUKAN klaim kode warna resmi perusahaan).
   * Ganti bila brand guideline resmi sudah tersedia.
   */
  colors: {
    kuning: '#F6C445',
    hijau: '#176B45',
    krem: '#FFF9E9',
    tinta: '#17362A',
    cokelat: '#5B4636',
    hijauMuda: '#2E9A66',
    merah: '#C4452F',
    biru: '#2F6FB0',
  },
  /**
   * Logo resmi belum diverifikasi. Taruh file di client/public/logo/logo-raksa.svg
   * (atau .png) lalu isi path-nya di sini; bila null, judul tipografis dipakai.
   */
  logoPath: null as string | null,
  /** Catatan aset yang belum terverifikasi, ditampilkan di layar host. */
  assetNote:
    'Logo & warna resmi belum diverifikasi dari raksaonline.com. Ganti di shared/brand.ts.',
} as const;

/**
 * Tokoh Raksa yang muncul di game. Sprite: client/public/karakter/ (dibuat dari character/
 * lewat `node tools/siapkan-karakter.mjs`).
 *
 *   ceo       Mr Roger - pembuka & penutup: halaman awal, lobby, hasil akhir, podium
 *   Tokoh tidak pernah digambar di adegan misi: tempatnya di panel (potret kecil), supaya
 *   tidak menutupi objek, label, atau tanda pembahasan.
 *   missRaksa Miss Raksa - ikon & pilar Raksa CS, "pembawa kasus": sapaan di halaman gabung,
 *             suara briefing tiap misi (HP & proyektor)
 *   isti      Bu Isti - Direktur IT, JURI: membacakan hasil tiap misi (HP & proyektor) dan
 *             ringkasan data ronde; juga cara bergabung (QR) & pesan saat koneksi HP terputus
 *   Ketiganya berdiri bersama di podium proyektor.
 *
 * PENTING: kalimat sapaan di bawah adalah USULAN tim game. Mohon disetujui oleh yang
 * bersangkutan (atau Corporate Communication) sebelum dipakai di acara resmi.
 * Set `aktif: false` untuk menyembunyikan satu tokoh di seluruh game.
 */
export const TOKOH = {
  ceo: {
    aktif: true,
    nama: 'Mr Roger' as string | null,
    jabatan: 'CEO Asuransi Raksa',
    /** false = cukup nama ("Mr Roger") di papan nama & balon; jabatan tetap untuk pembaca layar. */
    tampilJabatan: false,
    sapaan: {
      awal: 'Selamat datang di Misi Lindungi Kota!',
      lobby: 'Terima kasih sudah bergabung. Selamat bermain!',
      podium: 'Selamat untuk para juara. Terima kasih sudah ikut bermain!',
    },
  },
  missRaksa: {
    aktif: true,
    nama: 'Miss Raksa' as string | null,
    jabatan: 'Ikon Raksa CS',
    tampilJabatan: true,
    sapaan: {
      /** Halaman gabung: langkah kode, lalu langkah kenalan. Briefing misi memakai teks misi. */
      gabungKode: 'Halo, selamat datang di Raksa!',
      gabungKenalan: 'Senang berkenalan denganmu!',
    },
  },
  isti: {
    aktif: true,
    nama: 'Bu Isti' as string | null,
    jabatan: 'Direktur IT',
    tampilJabatan: true,
    sapaan: {
      /** Sebutan peran di samping namanya saat membacakan hasil misi ("Bu Isti · Juri"). */
      juri: 'Juri',
      /** Lobby proyektor, di bawah QR (setelah petunjuk alamat & kode). */
      gabung: 'Pilih karakter, lalu tekan Siap. Kalau koneksi putus, cukup buka lagi tautannya.',
      /** Papan peringkat proyektor, di atas ringkasan ronde. */
      ringkasan: 'Jawaban ronde ini sudah tercatat. Ini datanya.',
    },
  },
};

export type IdTokoh = keyof typeof TOKOH;

/** Nama tampil: "nama · jabatan" (atau nama saja bila tampilJabatan false); tanpa nama = jabatan. */
export function namaTokoh(id: IdTokoh): string {
  const t = TOKOH[id];
  if (!t.nama) return t.jabatan;
  return t.tampilJabatan ? `${t.nama} · ${t.jabatan}` : t.nama;
}

/** Nama lengkap untuk pembaca layar (selalu dengan jabatan). */
export function labelTokoh(id: IdTokoh): string {
  const t = TOKOH[id];
  return t.nama ? `${t.nama}, ${t.jabatan}` : t.jabatan;
}

export const DEFAULT_EVENT_NAME = 'Raksa Claim - Misi Lindungi Kota';

export const DEFAULT_PRIZES = {
  first: 'Juara 1 - Hadiah Utama',
  second: 'Juara 2 - Hadiah Kedua',
  third: 'Juara 3 - Hadiah Ketiga',
};

/** Durasi fase non-menjawab (ms). Durasi menjawab ada di tiap misi. */
export const PHASE_DURATIONS = {
  /** Briefing default; dapat dioverride per misi (8-12 detik). */
  briefingMs: 10_000,
  /** Pembahasan jawaban. */
  revealMs: 14_000,
  /** Papan peringkat antar ronde. */
  leaderboardMs: 10_000,
  /** Tutorial sebelum pertandingan. */
  tutorialMs: 60_000,
};

export const DISCLAIMER =
  'Semua kasus di game ini adalah simulasi edukasi. Penanganan klaim yang sebenarnya mengikuti ketentuan polis dan hasil pemeriksaan Raksa.';

export const ACCESSORIES: { id: PlayerAccessory; label: string }[] = [
  { id: 'none', label: 'Tanpa aksesori' },
  { id: 'helm', label: 'Helm proyek' },
  { id: 'jaket', label: 'Jaket lapangan' },
  { id: 'headset', label: 'Headset' },
  { id: 'topi', label: 'Topi Raksa' },
];

export type PlayerAccessory = 'none' | 'helm' | 'jaket' | 'headset' | 'topi';

/** Warna seragam petugas (kosmetik saja, tidak mempengaruhi skor). */
export const UNIFORM_COLORS = ['#176B45', '#2F6FB0', '#C4452F', '#5B4636', '#8A6A1F', '#3F3D8A'];
export const SKIN_TONES = ['#F2C9A0', '#E0AC7E', '#C68A5E', '#9C6240', '#7A4A2E'];
export const HAIR_COLORS = ['#2B2118', '#4A3527', '#6E4A2E', '#151515', '#7E6B58'];
