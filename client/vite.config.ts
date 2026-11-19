import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = import.meta.dirname;
const repoRoot = path.resolve(rootDir, '..');
const serverTarget = process.env.VITE_SERVER_URL || 'http://localhost:4000';
// Episode cerita yang dikeluarkan dari build (mis. VITE_CERITA_TANPA=auto-2 untuk deployment lomba yang memakai kasus yang
// sama di room resmi): impor './<id>/episode' di registri diganti rintisan null, jadi naskah, kunci, arena, dan seni
// kasusnya (semua diimpor dari modul episode) tidak dibundel.
const episodeTanpaMentah = (process.env.VITE_CERITA_TANPA || '').split(',').map((s) => s.trim()).filter((s) => /^[a-z0-9-]+$/.test(s));
// T-064: Episode 1 Dev (auto-2-dev) memakai ulang isi auto-2: mengeluarkan auto-2 ikut mengeluarkan auto-2-dev.
const episodeTanpa = [...new Set([...episodeTanpaMentah, ...(episodeTanpaMentah.includes('auto-2') ? ['auto-2-dev'] : [])])];

export default defineConfig({
  // Hosting under a path prefix behind a reverse proxy (docs/prd-v02/HOSTING.md), e.g. VITE_BASE_PATH=/game/.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  // PROTOTIPE meja kasus K11 (D-68): konstanta build, jadi build biasa membuang seluruh kode meja (tanpa chunk meja).
  define: {
    __MEJA_KASUS__: JSON.stringify(process.env.VITE_MEJA_KASUS === '1'),
    // PROTOTIPE "Kejadian" (irisan K10): halaman /kejadian hanya ada di build VITE_KEJADIAN=1.
    __KEJADIAN__: JSON.stringify(process.env.VITE_KEJADIAN === '1'),
    // T-038 Fix 1: audio test hook only in dev (vite serve) or a VITE_UJI_AUDIO=on build (client/src/audio/bendera.ts).
    __UJI_AUDIO__: JSON.stringify(process.env.NODE_ENV !== 'production' || process.env.VITE_UJI_AUDIO === 'on'),
  },
  resolve: {
    alias: [
      { find: '@shared', replacement: path.resolve(repoRoot, 'shared') },
      ...episodeTanpa.map((id) => ({ find: new RegExp(`^\\./${id}/episode$`), replacement: path.resolve(rootDir, 'src/cerita/episode/rintisan.ts') })),
    ],
  },
  server: {
    host: true,
    port: Number(process.env.CLIENT_PORT || 5173),
    strictPort: false,
    // Izinkan impor dari folder shared/ di luar root client.
    fs: { allow: [repoRoot] },
    proxy: {
      '/api': { target: serverTarget, changeOrigin: true },
      // Gambar soal buatan panitia disimpan & dilayani server (lihat server/src/gambarSoal.ts).
      '/gambar-soal': { target: serverTarget, changeOrigin: true },
      // Aset cerita yang diunggah lewat CMS (server/src/story/content/assets.ts).
      '/aset-cerita': { target: serverTarget, changeOrigin: true },
      '/socket.io': { target: serverTarget, ws: true, changeOrigin: true },
      // Build Unity disajikan Express (bukan Vite) supaya MIME & Content-Encoding benar.
      // Musik (/audio/*.mp3) TIDAK diproxy: itu aset di client/public dan sudah
      // disajikan Vite sendiri saat development.
      '/unity': { target: serverTarget, changeOrigin: true },
    },
  },
  preview: {
    host: true,
    proxy: {
      '/api': { target: serverTarget, changeOrigin: true },
      // Gambar soal buatan panitia disimpan & dilayani server (lihat server/src/gambarSoal.ts).
      '/gambar-soal': { target: serverTarget, changeOrigin: true },
      // Aset cerita yang diunggah lewat CMS (server/src/story/content/assets.ts).
      '/aset-cerita': { target: serverTarget, changeOrigin: true },
      '/socket.io': { target: serverTarget, ws: true, changeOrigin: true },
      '/unity': { target: serverTarget, changeOrigin: true },
    },
  },
  build: {
    // A prefixed build goes to its own folder (VITE_OUT_DIR) so it never overwrites the root build.
    outDir: process.env.VITE_OUT_DIR || 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    // Seni piksel cerita (atlas tokoh, lapisan ruang, prop, ikon) SELALU berkas terpisah, tidak di-inline sebagai data URL:
    // panggung melacak dekode per URL, PNG di-cache terpisah dari JS, dan uji browser mengenali lapisan dari nama
    // berkasnya (sama dengan Vite dev). Aset lain tetap memakai ambang bawaan Vite.
    assetsInlineLimit: (berkas: string) => (/[\\/]cerita[\\/]seni[\\/]piksel[\\/][^\\/]+\.png$/.test(berkas) ? false : undefined),
  },
});
