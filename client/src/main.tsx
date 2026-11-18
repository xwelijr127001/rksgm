import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { siapkanGerak } from './gerak';
import { loadAppConfig } from './story/appConfig';
import './theme.css';

siapkanGerak();
// Rute bergantung pada konfigurasi server (mode lama). Bahasa TIDAK: id / en / zh selalu tersedia (T-035).
void loadAppConfig();
const el = document.getElementById('root');
if (!el) throw new Error('Elemen #root tidak ditemukan');

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
import './player.css';
// T-030 + T-031: tombol pixel key, kartu dan latar piksel (terakhir, menang atas lembar gaya bagian).
import './gaya-game.css';

// T-036: pengukuran SFX tanpa mendengar (tools/cek-audio-t036.mjs). Hanya dengan ?uji-audio di URL.
if (typeof location !== 'undefined' && location.search.includes('uji-audio')) {
  void import('./audio/audio').then((m) => { (window as unknown as { __rekamSfx?: typeof m.rekamSfx }).__rekamSfx = m.rekamSfx; });
}
