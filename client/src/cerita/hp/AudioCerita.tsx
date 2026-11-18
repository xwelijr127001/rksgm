/**
 * AUDIO MODE CERITA (Episode 2, antarmuka HP) — memakai pengelola audio yang SAMA (audio/audio.ts), tanpa sistem kedua.
 *  - useAudioCerita: tema musik menurut bagian cerita (kantor & percakapan / pemeriksaan / penutup) dan suasana tipis menurut
 *    lokasi adegan (bengkel/pool = "bengkel", ruas tol = "jalan"; kantor & obrolan tanpa suasana). Trek hanya berganti bila
 *    temanya berganti (tidak diulang dari awal tiap pesan). Keluar dari halaman = musik & suasana cerita berhenti.
 *  - KontrolSuara: di Menu — semua suara (master), musik & suasana, efek suara, dua volume, dan "Coba suara".
 *  - PetunjukSuara: petunjuk kecil sekali tampil bahwa suara tersedia; tidak memblokir, bisa ditutup.
 * Audio baru berbunyi sesudah interaksi pengguna (initAudio dari AudioUnlocker); kegagalan berkas = senyap, permainan jalan terus.
 */
import { useEffect, useState, type CSSProperties } from 'react';
import {
  initAudio, playSfx, setModeCerita, setMusicVolume, setMusikCerita, setMuted, setSfxEnabled, setSfxVolume, setSuasana, setTrack,
  type Sfx,
} from '../../audio/audio';
import { UJI_AUDIO } from '../../audio/bendera';
import { useAudioPrefs } from '../../hooks';
import { t } from '../../i18n';
import type { Episode, StateCerita } from '../tipe';
import { komposisiLatar } from '../ui/latar/komposisi';

export { suasanaUntuk, temaUntuk, type TemaCerita } from './audioTema';
import { suasanaUntuk, temaUntuk, type TemaCerita } from './audioTema';

export function useAudioCerita(ep: Episode, state: StateCerita, opsi: { babId?: string; akhir: boolean; obrolan: boolean; temaUji: TemaCerita | null }) {
  useEffect(() => {
    setModeCerita(true);
    return () => { setTrack(null); setSuasana(null); setModeCerita(false); };
  }, []);
  const tema = opsi.temaUji ?? temaUntuk(opsi.babId, state.node, opsi.akhir);
  useEffect(() => { setTrack(tema); }, [tema]);
  let lokasi: string | undefined;
  try { lokasi = komposisiLatar(ep, state).lokasi; } catch { lokasi = undefined; }
  const suasana = opsi.temaUji ? null : suasanaUntuk(lokasi, opsi.obrolan);
  useEffect(() => { setSuasana(suasana); }, [suasana]);
}

const CONTOH_SFX: { id: Sfx; kunci: string }[] = [
  { id: 'taruh', kunci: 'ceritaHp.sfxTaruh' },
  { id: 'kertas', kunci: 'ceritaHp.sfxKertas' },
  { id: 'pesanKirim', kunci: 'ceritaHp.sfxKirim' },
  { id: 'pesanTerima', kunci: 'ceritaHp.sfxTerima' },
  { id: 'ketuk', kunci: 'ceritaHp.sfxKetuk' },
  { id: 'konfirmasi', kunci: 'ceritaHp.sfxKonfirmasi' },
  { id: 'batal', kunci: 'ceritaHp.sfxBatal' },
];

export function KontrolSuara({ temaUji, onTemaUji }: { temaUji: TemaCerita | null; onTemaUji: (t: TemaCerita | null) => void }) {
  const p = useAudioPrefs();
  // T-041 (owner 19 Nov): two rows only, Music and Effects = pixel on/off key + pixel volume slider. The old "All sound" (master
  // mute) row is folded in: while muted both show Off; switching one on unmutes and keeps the other off, so what is shown stays true.
  const musik = !p.muted && p.musikCerita !== false;
  const efek = !p.muted && p.sfxEnabled !== false;
  const alih = (jenis: 'musik' | 'efek') => {
    initAudio();
    const on = jenis === 'musik' ? musik : efek;
    if (on) { if (jenis === 'musik') setMusikCerita(false); else setSfxEnabled(false); return; }
    if (p.muted) { if (jenis === 'musik') setSfxEnabled(false); else setMusikCerita(false); setMuted(false); }
    if (jenis === 'musik') setMusikCerita(true); else { setSfxEnabled(true); playSfx('ketuk'); }
  };
  const baris = (jenis: 'musik' | 'efek', nama: string, on: boolean, vol: number, labelVol: string, ubahVol: (v: number) => void) => {
    const nilai = Math.round(vol * 100);
    return (
      <div className="hp-suara-baris" data-baris-suara={jenis}>
        <button type="button" className="hp-sakelar" role="switch" aria-checked={on} data-suara={jenis} onClick={() => alih(jenis)}>
          <span className="hp-sakelar-nama">{nama}</span>
          <span className="hp-sakelar-status">{on ? t('ceritaHp.aktif') : t('ceritaHp.mati')}</span>
        </button>
        <input type="range" className="hp-geser" min={0} max={100} step={5} value={nilai} data-volume={jenis} aria-label={labelVol}
          style={{ '--isi': nilai } as CSSProperties}
          onChange={(e) => { initAudio(); ubahVol(Number(e.currentTarget.value) / 100); }} disabled={!on} />
      </div>
    );
  };
  return (
    <div className="hp-suara" data-kontrol-suara="">
      {baris('musik', t('ceritaHp.suaraMusikPendek'), musik, p.musicVolume, t('ceritaHp.volumeMusik'), setMusicVolume)}
      {baris('efek', t('ceritaHp.suaraEfekPendek'), efek, p.sfxVolume, t('ceritaHp.volumeEfek'), (v) => { setSfxVolume(v); playSfx('ketuk'); })}
      {/* Samples ("Coba suara") are a test aid: only in dev or a VITE_UJI_AUDIO=on build, so the phone menu never scrolls. */}
      {UJI_AUDIO ? <details className="hp-tahu hp-coba-suara" data-coba-suara="">
        <summary>{t('ceritaHp.cobaSuara')}</summary>
        {p.muted ? <p className="hp-suara-catatan" data-coba-bisu="">{t('ceritaHp.cobaBisu')}</p> : null}
        <p className="hp-coba-judul">{t('ceritaHp.cobaMusik')}</p>
        {temaUji ? <p className="hp-suara-catatan" data-contoh-aktif="">{t('ceritaHp.contohAktif')}</p> : null}
        <div className="hp-coba-baris">
          {([['cerita-kantor', 'ceritaHp.temaKantor'], ['cerita-periksa', 'ceritaHp.temaPeriksa'], ['cerita-penutup', 'ceritaHp.temaPenutup']] as const).map(([id, k]) => (
            <button key={id} type="button" className="hp-coba" aria-pressed={temaUji === id} data-tema={id} onClick={() => { initAudio(); onTemaUji(id); }}>{t(k)}</button>
          ))}
          <button type="button" className="hp-coba" aria-pressed={temaUji === null} data-tema="adegan" onClick={() => onTemaUji(null)}>{t('ceritaHp.temaAdegan')}</button>
        </div>
        <p className="hp-coba-judul">{t('ceritaHp.suaraEfek')}</p>
        <div className="hp-coba-baris">
          {CONTOH_SFX.map((x) => (
            <button key={x.id} type="button" className="hp-coba" data-sfx={x.id} onClick={() => { initAudio(); playSfx(x.id); }}>{t(x.kunci)}</button>
          ))}
        </div>
      </details> : null}
    </div>
  );
}

const KUNCI_PETUNJUK = 'raksa:cerita:petunjuk-suara';
/** Lama petunjuk suara tampil sebelum hilang sendiri (md). */
export const LAMA_PETUNJUK_SUARA = 6000;
/**
 * D-129 (T-018 Tahap 1b): petunjuk suara tampil SEKALI per episode, hanya di layar pertamanya; hilang pada ketukan pertama tombol
 * utama mana pun atau sesudah 6 detik, dan itu diingat (per episode; kunci lama tanpa episode = sudah pernah ditutup). Tidak
 * pernah tampil saat lembar balasan atau aktivitas terbuka (`sembunyi`).
 */
export function PetunjukSuara({ idEpisode, layarPertama, sembunyi = false }: { idEpisode: string; layarPertama: boolean; sembunyi?: boolean }) {
  const p = useAudioPrefs();
  const kunci = `${KUNCI_PETUNJUK}:${idEpisode}`;
  // Dinilai SEKALI saat pemain dipasang: bukan layar pertama episode = tidak pernah tampil di sesi ini.
  const [tampil, setTampil] = useState(() => { try { return layarPertama && localStorage.getItem(kunci) === null && localStorage.getItem(KUNCI_PETUNJUK) === null; } catch { return false; } });
  const terlihat = tampil && !p.muted;
  useEffect(() => {
    if (!terlihat) return;
    const tutup = () => { setTampil(false); try { localStorage.setItem(kunci, '1'); } catch { /* sekali per sesi */ } };
    const ketuk = (e: Event) => { if (e.target instanceof Element && e.target.closest('.hp-layar .primary-action')) tutup(); };
    const waktu = window.setTimeout(tutup, LAMA_PETUNJUK_SUARA);
    document.addEventListener('click', ketuk, true);
    return () => { window.clearTimeout(waktu); document.removeEventListener('click', ketuk, true); };
  }, [terlihat, kunci]);
  if (!terlihat || sembunyi) return null;
  const tutup = () => { setTampil(false); try { localStorage.setItem(kunci, '1'); } catch { /* sekali per sesi */ } };
  return (
    <div className="hp-petunjuk-suara-jangkar"><p className="hp-petunjuk-suara" data-petunjuk-suara="">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M15 8c2 2 2 6 0 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      <span>{t('ceritaHp.petunjukSuara')}</span>
      <button type="button" className="hp-tautan" onClick={tutup}>{t('ceritaHp.tutupPetunjuk')}</button>
    </p></div>
  );
}
