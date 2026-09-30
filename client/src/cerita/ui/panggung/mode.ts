/**
 * Mode adegan panggung cerita dari alamat & penyimpanan (modul kecil tanpa React/seni, supaya halaman daftar episode
 * /cerita bisa menyimpan pilihan ?adegan=... tanpa ikut memuat panggung).
 *
 * ?adegan=ringan -> localStorage raksa:adegan=ringan (panggung tanpa gerak), ?adegan=penuh -> dihapus. Sama dengan
 * GameStage.adeganDimatikan (tidak diimpor supaya modul engine tidak ikut ke chunk cerita).
 */

/**
 * Menyimpan pilihan mode adegan dari alamat. Dipanggil saat halaman daftar (/cerita) dan halaman episode dibuka,
 * SEBELUM pengalihan ke /kenalan (profil baru) yang membuang query, supaya pilihan itu tidak hilang.
 */
export function simpanModeAdegan(): void {
  try {
    const q = new URLSearchParams(window.location.search).get('adegan');
    if (q === 'ringan') window.localStorage.setItem('raksa:adegan', 'ringan');
    if (q === 'penuh') window.localStorage.removeItem('raksa:adegan');
  } catch {
    /* penyimpanan diblokir: mode bawaan */
  }
}

/** Mode ringan adegan: panggung tanpa gerak (query alamat disimpan dulu, lalu localStorage raksa:adegan). */
export function modeRingan(): boolean {
  simpanModeAdegan();
  try {
    return window.localStorage.getItem('raksa:adegan') === 'ringan';
  } catch {
    return false;
  }
}
