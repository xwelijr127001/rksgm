/**
 * Unduh engine adegan lebih awal (dipanggil dari lobby/tutorial/briefing/latihan)
 * supaya saat misi dimulai adegan langsung tampil. Gagal diam-diam: GameStage
 * akan mencoba lagi dan memakai tampilan sederhana bila tetap gagal.
 */
let dipanggil = false;

export function prefetchAdegan(): void {
  if (dipanggil) return;
  dipanggil = true;
  void import('./engine/stage')
    .then((m) => Promise.all([m.prefetchEngine(), import('./tokoh').then((p) => p.prefetchSpriteHalaman())]))
    .catch(() => { dipanggil = false; });
}
