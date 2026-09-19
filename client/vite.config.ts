import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = import.meta.dirname;
const repoRoot = path.resolve(rootDir, '..');
const serverTarget = process.env.VITE_SERVER_URL || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@shared': path.resolve(repoRoot, 'shared') },
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
      '/socket.io': { target: serverTarget, ws: true, changeOrigin: true },
      '/unity': { target: serverTarget, changeOrigin: true },
    },
  },
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 900 },
});
