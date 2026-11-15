/**
 * HALAMAN PROTOTIPE /meja (hanya build VITE_MEJA_KASUS=1, bukan fitur pemain): mulai langsung di babak bundel pengajuan
 * (K11) Episode 2 tanpa memainkan ulang episode, atau pilih versi K11 yang dibandingkan. Progres Episode 2 di alamat ini
 * diarsipkan dulu (Riwayat / arsip episode), lalu diganti state awal K11 dari mesin (jalur saran).
 */
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Arrow, PlayerShell } from '../components/PlayerShell';
import { useProfil } from '../state/profil';
import { cariEpisode } from '../cerita/episode';
import { hapusDrafAktivitas, mulaiBaru, simpanProgres } from '../cerita/simpan';
import { MEJA_KASUS, mejaAktif } from '../cerita/hp/meja/bendera';
import { stateDiTitik } from '../cerita/hp/meja/lompat';
import '../cerita/hp/meja/meja.css';

const ID_EPISODE = 'auto-2';

export default function ProtoMeja() {
  const { profil } = useProfil();
  const navigate = useNavigate();
  const [galat, setGalat] = useState('');
  const [versi, setVersi] = useState(() => (mejaAktif() ? 'meja' : 'lama'));
  if (!MEJA_KASUS) return <Navigate to="/cerita" replace />;
  if (!profil) return <Navigate to="/kenalan?lanjut=/meja" replace />;
  const ep = cariEpisode(ID_EPISODE);

  const mulai = (k11: 'meja' | 'lama') => {
    if (!ep) return;
    const s = stateDiTitik(ep, 'k11');
    if (!s) { setGalat('Jalur ke K11 tidak ditemukan (naskah berubah?).'); return; }
    try { localStorage.setItem('raksa:proto:k11', k11); } catch { /* abaikan */ }
    mulaiBaru(ep);
    hapusDrafAktivitas(ep.id);
    try { localStorage.removeItem('raksa:cerita:langkah-arena'); } catch { /* abaikan */ }
    simpanProgres(ep, s);
    navigate(`/cerita/${ep.id}`);
  };
  const pilihVersi = (v: 'meja' | 'lama') => {
    try { localStorage.setItem('raksa:proto:k11', v); } catch { /* abaikan */ }
    setVersi(v);
  };

  return (
    <PlayerShell>
      <main className="proto-meja">
        <p className="hp-arena-tugas">Prototipe · bukan fitur pemain</p>
        <h1>Meja kasus K11</h1>
        <p>Babak bundel pengajuan Episode 2 sebagai meja kasus (Phaser): periksa map, pindahkan map ke tujuannya, kabari Pak Hendra, konfirmasi, lalu lihat akibatnya.</p>
        <p>Tombol di bawah memulai Episode 2 <b>tepat sebelum tugas bundel</b> (keputusan sebelumnya = jalur yang disarankan naskah). Progres Episode 2 di alamat ini diarsipkan lebih dulu.</p>
        <div className="proto-meja-tombol">
          <button type="button" className="primary-action" onClick={() => mulai('meja')} disabled={!ep}>Mulai di meja kasus (K11) <Arrow /></button>
          <button type="button" className="btn btn-netral" onClick={() => mulai('lama')} disabled={!ep}>Mulai di K11 versi sekarang (pembanding)</button>
        </div>
        {galat ? <p role="alert">{galat}</p> : null}
        <p className="meja-catatan">Versi K11 yang aktif di peramban ini: <b>{versi === 'meja' ? 'meja kasus (prototipe)' : 'versi sekarang (3 langkah)'}</b>.{' '}
          <button type="button" className="hp-tautan" onClick={() => pilihVersi(versi === 'meja' ? 'lama' : 'meja')}>Ganti ke {versi === 'meja' ? 'versi sekarang' : 'meja kasus'}</button>
        </p>
        <p><Link to="/cerita">Daftar episode</Link></p>
      </main>
    </PlayerShell>
  );
}
