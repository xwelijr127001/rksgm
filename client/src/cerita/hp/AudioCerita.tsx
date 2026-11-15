/**
 * AUDIO MODE CERITA (Episode 2, antarmuka HP) — memakai pengelola audio yang SAMA (audio/audio.ts), tanpa sistem kedua.
 *  - useAudioCerita: tema musik menurut bagian cerita (kantor & percakapan / pemeriksaan / penutup) dan suasana tipis menurut
 *    lokasi adegan (bengkel/pool = "bengkel", ruas tol = "jalan"; kantor & obrolan tanpa suasana). Trek hanya berganti bila
 *    temanya berganti (tidak diulang dari awal tiap pesan). Keluar dari halaman = musik & suasana cerita berhenti.
 *  - KontrolSuara: di Menu — semua suara (master), musik & suasana, efek suara, dua volume, dan "Coba suara".
 *  - PetunjukSuara: petunjuk kecil sekali tampil bahwa suara tersedia; tidak memblokir, bisa ditutup.
 * Audio baru berbunyi sesudah interaksi pengguna (initAudio dari AudioUnlocker); kegagalan berkas = senyap, permainan jalan terus.
 */
import { useEffect, useState } from 'react';
import {
  initAudio, playSfx, setModeCerita, setMusicVolume, setMusikCerita, setMuted, setSfxEnabled, setSfxVolume, setSuasana, setTrack,
  type Sfx,
} from '../../audio/audio';
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
  const musik = p.musikCerita !== false;
  const sakelar = (nama: string, on: boolean, ubah: () => void, data: string) => (
    <button type="button" className="hp-sakelar" role="switch" aria-checked={on} data-suara={data} onClick={() => { initAudio(); ubah(); }}>
      <span className="hp-sakelar-nama">{nama}</span>
      <span className="hp-sakelar-status">{on ? t('ceritaHp.aktif') : t('ceritaHp.mati')}</span>
    </button>
  );
  return (
    <div className="hp-suara" data-kontrol-suara="">
      {sakelar(t('ceritaHp.suaraMaster'), !p.muted, () => setMuted(!p.muted), 'master')}
      {sakelar(t('ceritaHp.suaraMusik'), musik, () => setMusikCerita(!musik), 'musik')}
      {sakelar(t('ceritaHp.suaraEfek'), p.sfxEnabled !== false, () => setSfxEnabled(p.sfxEnabled === false), 'efek')}
      <label className="hp-suara-volume">
        <span>{t('ceritaHp.volumeMusik')}</span>
        <input type="range" min={0} max={100} step={5} value={Math.round(p.musicVolume * 100)} data-volume="musik"
          onChange={(e) => { initAudio(); setMusicVolume(Number(e.currentTarget.value) / 100); }} disabled={p.muted || !musik} />
      </label>
      <label className="hp-suara-volume">
        <span>{t('ceritaHp.volumeEfek')}</span>
        <input type="range" min={0} max={100} step={5} value={Math.round(p.sfxVolume * 100)} data-volume="efek"
          onChange={(e) => { initAudio(); setSfxVolume(Number(e.currentTarget.value) / 100); playSfx('ketuk'); }} disabled={p.muted || p.sfxEnabled === false} />
      </label>
      {p.muted ? <p className="hp-suara-catatan">{t('ceritaHp.suaraDibisukan')}</p> : null}
      <details className="hp-tahu hp-coba-suara" data-coba-suara="">
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
      </details>
    </div>
  );
}

const KUNCI_PETUNJUK = 'raksa:cerita:petunjuk-suara';
export function PetunjukSuara() {
  const p = useAudioPrefs();
  const [tampil, setTampil] = useState(() => { try { return localStorage.getItem(KUNCI_PETUNJUK) === null; } catch { return false; } });
  if (!tampil || p.muted) return null;
  const tutup = () => { setTampil(false); try { localStorage.setItem(KUNCI_PETUNJUK, '1'); } catch { /* sekali per sesi */ } };
  return (
    <p className="hp-petunjuk-suara" data-petunjuk-suara="">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M15 8c2 2 2 6 0 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      <span>{t('ceritaHp.petunjukSuara')}</span>
      <button type="button" className="hp-tautan" onClick={tutup}>{t('ceritaHp.tutupPetunjuk')}</button>
    </p>
  );
}
