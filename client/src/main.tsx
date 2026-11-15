import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { siapkanGerak } from './gerak';
import { aturBahasa, bahasaKini } from './i18n';
import { loadAppConfig } from './story/appConfig';
import './theme.css';

siapkanGerak();
// Rute & pilihan bahasa bergantung pada konfigurasi server (mode lama). Mandarin hanya di mode lama: tampilan kembali ke
// Indonesia tanpa menimpa pilihan yang tersimpan di perangkat.
void loadAppConfig().then((s) => {
  if (s.status === 'ready' && !s.config.legacy && bahasaKini() === 'zh') aturBahasa('id', false);
});
const el = document.getElementById('root');
if (!el) throw new Error('Elemen #root tidak ditemukan');

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
import './player.css';
