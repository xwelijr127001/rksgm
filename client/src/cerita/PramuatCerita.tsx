/**
 * T-047 (owner: "the loading bar ... also downloads the assets needed so the user can enjoy all the assets and sound sfx"):
 * PRELOAD with a real progress bar before the first story screen of the playable case (route /cerita/auto-2).
 * Blocking items: the story chunk (same import() specifier as the router, so the same hashed chunk), the episode list module,
 * every picture of the episode (fetched + decode()), the first music track (canplaythrough in the element that will play it)
 * and the story SFX samples (T-048: sfx-tombol/kertas/taruh/ketuk/konfirmasi/batal.wav, decoded into the audio engine via
 * siapkanAudio, counted as one item). Save-Data: only chunks + first-screen pictures block; the rest
 * loads in the background. Progress = finished items / total. Per item 8 s, overall cap 12 s, then the story opens with what is
 * ready (the rest keeps loading lazily as before). Done in under 300 ms (second visit, HTTP cache) = no bar at all. Once per
 * page session; other episodes and routes pass straight through. After the first screen: remaining story music in the
 * background (low priority, idle time).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { pramuatMusik, siapkanAudio, type Track } from '../audio/audio';
import { Raki } from '../art/Raki';
import { t, useBahasa } from '../i18n';
import { useProfil } from '../state/profil';

/** T-064: Episode 1 Dev (auto-2-dev) shows the same case art, so it preloads the same list; guests there have no profile. */
const EPISODE = ['auto-2', 'auto-2-dev'];
const ITEM_MS = 8000;
const BATAS_MS = 12000;
const TANPA_BAR_MS = 300;
const SEGMEN = 10;
const TREK_AWAL: Exclude<Track, null> = 'cerita-kantor';
const TREK_LAIN: Exclude<Track, null>[] = ['cerita-periksa', 'cerita-penutup'];

let sudahSiap = false;

function hematData(): boolean {
  try { return Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData); } catch { return false; }
}
function denganBatas<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((ok) => {
    const w = window.setTimeout(() => ok(null), ms);
    p.then((v) => { window.clearTimeout(w); ok(v); }, () => { window.clearTimeout(w); ok(null); });
  });
}
function nanti(fn: () => void, ms: number) {
  const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
  window.setTimeout(() => (w.requestIdleCallback ? w.requestIdleCallback(fn, { timeout: 5000 }) : fn()), ms);
}

export function PramuatCerita({ children }: { children: ReactNode }) {
  useBahasa();
  const { episode } = useParams();
  const { profil } = useProfil();
  const perlu = !!episode && EPISODE.includes(episode) && (!!profil || episode === 'auto-2-dev') && !sudahSiap && typeof window !== 'undefined';
  const [fase, setFase] = useState<'tunggu' | 'tampil' | 'siap'>(perlu ? 'tunggu' : 'siap');
  const [maju, setMaju] = useState(0);

  useEffect(() => {
    if (fase === 'siap') return;
    let batal = false;
    const mulai = performance.now();
    const tBar = window.setTimeout(() => { if (!batal) setFase((f) => (f === 'tunggu' ? 'tampil' : f)); }, TANPA_BAR_MS);
    const hemat = hematData();
    let selesai = 0;
    let total = 2; // list module + story chunk; grows when the list is known
    const satu = <T,>(p: Promise<T>) => denganBatas(p, ITEM_MS).then((v) => { selesai++; if (!batal) setMaju(Math.min(1, selesai / total)); return v; });
    const kerja = (async () => {
      const chunk = satu(import('../pages/CeritaMain'));
      const daftar = await satu(import('./pramuatDaftar'));
      const tugas: Promise<unknown>[] = [chunk];
      if (daftar) {
        const { gambar, awal } = daftar.daftarPramuat();
        const blok = hemat ? awal : gambar;
        total += blok.length + (hemat ? 0 : 2);
        for (const u of blok) tugas.push(satu(daftar.muatPng(u)));
        if (!hemat) { tugas.push(satu(pramuatMusik(TREK_AWAL, ITEM_MS)), satu(siapkanAudio())); }
        // Not blocking: Save-Data = the other pictures in the background.
        if (hemat) nanti(() => { for (const u of gambar) void daftar.muatPng(u).catch(() => undefined); }, 1500);
      }
      if (!batal) setMaju(Math.min(1, selesai / total));
      await Promise.all(tugas);
    })();
    const sisa = Math.max(0, BATAS_MS - (performance.now() - mulai));
    void denganBatas(kerja, sisa).then(() => {
      if (batal) return;
      window.clearTimeout(tBar);
      sudahSiap = true;
      setFase('siap');
      // After the first screen: the remaining story music, lowest priority (not with Save-Data).
      if (!hemat) nanti(() => { for (const tr of TREK_LAIN) void pramuatMusik(tr, 60000); }, 3000);
    });
    return () => { batal = true; window.clearTimeout(tBar); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fase === 'siap') return <>{children}</>;
  if (fase === 'tunggu') return null;
  const isi = Math.round(maju * SEGMEN);
  const persen = Math.round(maju * 100);
  return (
    <div className="lp-pemuat" data-pramuat-cerita="">
      <div className="lp-pemuat-isi">
        <div className="mrk" aria-hidden="true"><span className="mrk-raksa">RAKSA</span><span className="mrk-game">GAME</span></div>
        <span className="lp-pemuat-raki" aria-hidden="true"><Raki size={80} mood="sapa" /></span>
        <div className="lp-pemuat-bar" data-nyata="" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={persen} aria-label={t('umum.pramuatCerita')}>
          {Array.from({ length: SEGMEN }, (_, i) => <i key={i} data-isi={i < isi ? '' : undefined} />)}
        </div>
        <p className="lp-pemuat-teks" role="status">{t('umum.pramuatCerita')} {persen}%</p>
      </div>
    </div>
  );
}
