import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '@shared/missions';
import type { MissionAnswer, MissionPublic, MissionReveal } from '@shared/types';
import type { RoundScore } from '@shared/scoring';
import { TOKOH } from '@shared/brand';
import { Icon } from '../art/Icon';
import { forceMusic, playSfx, setTrack } from '../audio/audio';
import { PlayerShell, Arrow } from '../components/PlayerShell';
import { SapaanPemandu, namaTokoh } from '../game/KarakterTokoh';
import { HasilMisi, MissionPlay, type PanelBantu, type SubmitState } from '../game/MissionPlay';
import { prefetchAdegan } from '../game/prefetch';
import { misiDalamBahasa, revealDalamBahasa, t, useBahasa } from '../i18n';
import { terjemahkanGalat } from '../i18n/galat';
import { bintangUntuk, catatHasilSolo, progresSolo, savedProfil } from '../state/profil';
import { savedLook } from '../state/store';
import { BarisBintang, KeteranganBintang, TOTAL_MISI, angka, jumlahDicoba, tingkatMisi } from './soloBagian';
import './solo.css';

interface HasilSolo { accuracy: number; score: RoundScore; reveal: MissionReveal; }

/** Yang terjadi pada catatan perangkat setelah misi dinilai. */
interface CatatanBaru { terbaikBaru: boolean; terbaik: number; semuaDicoba: boolean; }

/**
 * Setelah "Siap mulai": bila adegan tak kunjung melapor siap, hitungan bonus tetap dimulai (pemain
 * sudah bisa menjawab lewat daftar). Waktu menunggu adegan tidak dihitung selama batas ini.
 */
const TUNGGU_ADEGAN_MS = 8000;

function cariMisi(mentah: string | null): MissionPublic | null {
  if (mentah === null || !/^\d{1,2}$/.test(mentah.trim())) return null;
  const n = Number(mentah);
  // Pratinjau adegan tutorial (0) & penentuan (11) hanya saat development; tidak dicatat.
  if (import.meta.env.DEV && n === 0) return TUTORIAL_MISSION;
  if (import.meta.env.DEV && n === 11) return TIEBREAK_MISSION;
  return MISSIONS.find((m) => m.number === n) ?? null;
}

/**
 * MAIN SATU MISI (mode solo). Alamat: /solo/main?misi=N. Dinilai server lewat POST /api/practice/grade.
 * Alur: kartu "Siap mulai" (kasus, tugas, cara main ringkas; MissionPlay mode 'intro') -> menjawab ->
 * hasil. Bonus waktu baru berjalan SETELAH "Siap mulai" ditekan; waktu membaca kartu tidak dihitung.
 * Waktu hanya memengaruhi bonus cepat dan tidak pernah mengunci; tombol jeda menghentikan hitungan.
 * Boleh dimainkan tanpa profil ("coba dulu" dari tautan lama /latihan?misi=N): tampilan tokoh
 * memakai tampilan terakhir/bawaan, progres tetap tercatat di perangkat.
 */
export default function SoloMain() {
  const [params] = useSearchParams();
  const asli = useMemo(() => cariMisi(params.get('misi')), [params]);
  const [ulang, setUlang] = useState(0);
  useEffect(() => { forceMusic(true); setTrack('game'); prefetchAdegan(); return () => { setTrack(null); forceMusic(false); }; }, []);

  if (!asli) return <Navigate to="/solo" replace />;
  // Kunci = misi + percobaan: "Coba lagi" dan pindah misi memulai sesi yang benar-benar baru.
  return <SesiSolo key={asli.id + ':' + ulang} asli={asli} onUlang={() => setUlang((u) => u + 1)} />;
}

/** `asli` = misi ASLI (Indonesia) dari shared/missions; yang ditampilkan adalah versi bahasa aktif. */
function SesiSolo({ asli, onUlang }: { asli: MissionPublic; onUlang: () => void }) {
  const { bahasa } = useBahasa();
  const [answer, setAnswer] = useState<MissionAnswer>({});
  const [result, setResult] = useState<HasilSolo | null>(null);
  const [catatan, setCatatan] = useState<CatatanBaru | null>(null);
  /** Pesan galat MENTAH ('' = tanpa pesan server); diterjemahkan saat render supaya ikut bahasa aktif. */
  const [error, setError] = useState<string | null>(null);
  const [kirim, setKirim] = useState<SubmitState>('idle');
  const [jeda, setJeda] = useState(false);
  /** "Siap mulai" sudah ditekan: baru sekarang menjawab & bonus waktu dimulai. */
  const [mulai, setMulai] = useState(false);
  const [adeganSiap, setAdeganSiap] = useState(false);
  const [terpakaiMs, setTerpakaiMs] = useState(0);
  const [look] = useState(() => savedProfil()?.look ?? savedLook());
  // Misi pertama di perangkat ini: contoh "cara main" dibuka sejak awal, seperti pemanasan.
  const [pertamaKali] = useState(() => Object.keys(progresSolo().misi).length === 0);
  const tercatat = MISSIONS.some((m) => m.id === asli.id);

  // Id misi/langkah/opsi tidak berubah, jadi jawaban yang dikirim ke server tidak terpengaruh bahasa.
  const misi = useMemo(() => misiDalamBahasa(asli, bahasa), [asli, bahasa]);
  const revealAsli = result?.reveal ?? null;
  const reveal = useMemo(() => (revealAsli ? revealDalamBahasa(revealAsli, misi, bahasa) : null), [revealAsli, misi, bahasa]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ---- jam bonus: hanya menghitung waktu AKTIF (setelah "Siap mulai", tanpa jeda, tanpa menunggu adegan dimuat).
  const durasiMs = asli.durationSeconds * 1000;
  const jam = useRef<{ terpakai: number; mulai: number | null }>({ terpakai: 0, mulai: null });
  const bacaJam = useCallback((): number => {
    const j = jam.current;
    return j.terpakai + (j.mulai === null ? 0 : performance.now() - j.mulai);
  }, []);
  const berjalan = mulai && adeganSiap && !jeda && !result && kirim !== 'sending';
  useEffect(() => {
    const j = jam.current;
    if (berjalan) j.mulai = performance.now();
    else if (j.mulai !== null) { j.terpakai += performance.now() - j.mulai; j.mulai = null; }
    setTerpakaiMs(bacaJam());
    if (!berjalan) return;
    const id = window.setInterval(() => setTerpakaiMs(bacaJam()), 250);
    return () => window.clearInterval(id);
  }, [berjalan, bacaJam]);
  useEffect(() => {
    // Batas tunggu adegan dihitung sejak "Siap mulai" (bukan sejak halaman dibuka).
    if (adeganSiap || !mulai) return;
    const id = window.setTimeout(() => setAdeganSiap(true), TUNGGU_ADEGAN_MS);
    return () => window.clearTimeout(id);
  }, [adeganSiap, mulai]);

  // Pindah tab / layar terkunci saat menjawab = jeda otomatis (waktu bonus tidak terbuang diam-diam).
  // Sebelum "Siap mulai" tidak ada yang berjalan, jadi tidak ada yang perlu dijeda.
  const bolehJeda = mulai && !result && kirim !== 'sending';
  const bolehJedaRef = useRef(bolehJeda);
  bolehJedaRef.current = bolehJeda;
  useEffect(() => {
    const saatSembunyi = (): void => { if (document.hidden && bolehJedaRef.current) setJeda(true); };
    document.addEventListener('visibilitychange', saatSembunyi);
    return () => document.removeEventListener('visibilitychange', saatSembunyi);
  }, []);

  async function submit() {
    if (kirim === 'sending' || result) return;
    // Waktu jeda tidak ikut: yang dikirim hanya waktu aktif, paling banyak durasi misi.
    const elapsedSeconds = Math.min(asli.durationSeconds, bacaJam() / 1000);
    setKirim('sending'); setError(null); playSfx('kirim');
    try {
      const response = await fetch('/api/practice/grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missionId: asli.id, answer, elapsedSeconds }) });
      if (!response.ok) {
        const pesan = await response.json().then((d: { error?: unknown }) => (typeof d?.error === 'string' ? d.error : ''), () => '');
        setKirim('failed'); setError(pesan);
        return;
      }
      const data: HasilSolo = await response.json();
      if (tercatat) {
        const lama = progresSolo().misi[asli.id];
        const baru = catatHasilSolo(asli.id, data.accuracy, data.score.roundScore);
        setCatatan({
          terbaikBaru: Boolean(lama) && data.score.roundScore > (lama?.poin ?? 0),
          terbaik: baru.misi[asli.id]?.poin ?? data.score.roundScore,
          semuaDicoba: jumlahDicoba(baru) >= TOTAL_MISI,
        });
      }
      setResult(data);
      setKirim('sent');
      playSfx(data.accuracy === 1 ? 'naik' : 'pilih');
    } catch { setKirim('failed'); setError(''); }
  }

  const next = MISSIONS.find((m) => m.number === asli.number + 1);
  const tepat = result?.accuracy === 1;
  // Galat kirim: pesan server (bila ada) dicocokkan ke kamus `server`; tanpa pesan = kalimat bawaan.
  const galat = error === null ? null : error ? terjemahkanGalat(error) : t('misi.galatPeriksa');

  // Tombol utama mengikuti hasil; pemain tetap boleh lanjut tanpa mengulang.
  const kelasLanjut = tepat ? 'primary-action' : 'text-button';
  const kePeta = !next && !catatan?.semuaDicoba;
  const lanjut = next
    ? <Link className={kelasLanjut} to={'/solo/main?misi=' + next.number}>{t('misi.lanjutKeMisi', { n: next.number })}<Arrow /></Link>
    : catatan?.semuaDicoba
      ? <Link className={kelasLanjut} to="/solo/hasil">{t('solo.lihatHasilku')}<Arrow /></Link>
      : <Link className={kelasLanjut} to="/solo">{t('solo.labelPeta')}<Arrow /></Link>;
  const ulangi = <button type="button" className={tepat ? 'text-button' : 'primary-action'} onClick={onUlang}>{tepat ? t('misi.ulangiMisi') : t('misi.cobaLagi')}{tepat ? null : <Arrow />}</button>;
  const peta = kePeta ? null : <Link className="text-button" to="/solo">{t('solo.labelPeta')}</Link>;

  const sisaDetik = Math.max(0, Math.ceil((durasiMs - terpakaiMs) / 1000));
  const bonusHabis = terpakaiMs >= durasiMs;
  // 'siap' = belum dimulai (kartu "Siap mulai"): bonus penuh, belum berjalan.
  const statusBonus = bonusHabis ? 'habis' : !mulai ? 'siap' : jeda ? 'jeda' : 'jalan';
  const nomor = String(asli.number).padStart(2, '0');
  const bintang = result ? bintangUntuk(result.accuracy) : 0;

  // Judul tab "Misi 3: Berkas Ruko" (useHalaman lewat PlayerShell); pratinjau development tanpa nomor.
  const judulTab = tercatat ? t('misi.judulTab', { n: asli.number, judul: misi.title }) : misi.title;

  return <PlayerShell back="/solo" label={t('solo.labelMain')} className="kompak solo-layar solo-main" judul={judulTab}>
    <main className="misi-main">
      <div className="solo-bilah">
        <div className="solo-bilah-judul">
          <span className="eyebrow">{tercatat ? t('solo.eyebrowMisi', { n: nomor, total: TOTAL_MISI, tingkat: t(`solo.tingkat.${tingkatMisi(asli)}`).toLocaleUpperCase() }) : t('solo.pratinjau').toLocaleUpperCase()}</span>
          <h1>{misi.title}</h1>
        </div>
        {!result ? <div className="solo-alat">
          <span className="solo-bonus" data-status={statusBonus} role="timer" aria-live="off" aria-label={bonusHabis ? t('solo.bonusHabis') : t('solo.bonusAria', { detik: sisaDetik })}>
            <Icon name="jam" size={18} />
            <span>{bonusHabis ? t('solo.bonusHabis') : jeda ? t('solo.bonusJeda', { detik: sisaDetik }) : t('solo.bonusSisa', { detik: sisaDetik })}</span>
          </span>
          {/* Sebelum "Siap mulai" tidak ada yang berjalan: tombol jeda baru tampil setelah mulai. */}
          {mulai ? <button type="button" className="solo-tombol-jeda" disabled={kirim === 'sending'} onClick={() => { playSfx('tik'); setJeda((j) => !j); }}>
            <TandaJeda lanjut={jeda} />{jeda ? t('solo.lanjutkan') : t('solo.jeda')}
          </button> : null}
        </div> : null}
        <p className="sr-only" aria-live="polite">{bonusHabis && !result ? t('solo.bonusHabis') : ''}</p>
      </div>
      <MissionPlay
        mission={misi}
        roundIndex={-1}
        look={look}
        mode={result ? 'reveal' : !mulai ? 'intro' : jeda ? 'paused' : 'play'}
        answer={answer}
        onAnswer={(id, value) => setAnswer((old) => ({ ...old, [id]: value }))}
        onSubmit={() => void submit()}
        submitState={kirim}
        submitError={galat}
        reveal={reveal}
        submitLabel={t('misi.periksaJawabanku')}
        // Kasus sudah dibaca di kartu "Siap mulai": saat menjawab cerita dilipat, kunjungan pertama cukup satu baris petunjuk.
        sudahBriefing
        kiatAwal={pertamaKali}
        ketIntro={t('misi.adeganSetelahMulai', { tombol: t('misi.siapMulai') })}
        onSceneStatus={(s) => { if (s !== 'loading') setAdeganSiap(true); }}
        panel={(bantu) => result && reveal ? <HasilMisi
          mission={misi}
          reveal={reveal}
          answer={answer}
          akurasi={result.accuracy}
          dijawab
          poin={result.score.roundScore}
          raihan={tercatat ? <>
            <p className="solo-raih">
              <BarisBintang n={bintang} ukuran={30} className="solo-raih-bintang" />
              <span className="solo-raih-teks">
                <b aria-hidden="true">{t('solo.nBintang', { n: bintang })}</b>
                <small>{catatan?.terbaikBaru ? t('solo.terbaikBaru') : catatan && catatan.terbaik > result.score.roundScore ? t('solo.terbaikmu', { n: angka(catatan.terbaik) }) : t('solo.tersimpan')}</small>
              </span>
            </p>
            <KeteranganBintang n={bintang} ringkas />
          </> : null}
          aksi={tepat
            ? <>{lanjut}<div className="solo-aksi-lain">{ulangi}{peta}</div></>
            : <>{ulangi}<div className="solo-aksi-lain">{lanjut}{peta}</div></>}
          catatan={<p className="practice-note">{t('misi.catatanSimulasiPolis')}</p>}
        /> : !mulai ? <KartuMulai misi={misi} bantu={bantu} onMulai={() => { playSfx('tik'); setMulai(true); }} />
          : jeda ? <div className="status-panel status-jeda" role="status">
            <Icon name="jam" size={22} />
            <div className="solo-jeda-isi">
              <h2>{t('solo.jedaJudul')}</h2>
              <p>{t('solo.jedaTeks')}</p>
              <button type="button" className="primary-action solo-jeda-lanjut" onClick={() => { playSfx('tik'); setJeda(false); }}>{t('solo.lanjutkanMain')} <Arrow /></button>
            </div>
          </div> : null}
      />
      {!result ? <p className="practice-note misi-catatan">{t('misi.catatanSimulasiPeriksa')}</p> : null}
    </main>
  </PlayerShell>;
}

/**
 * Gerbang "Siap mulai": kasus (dibawakan Miss Raksa), tugas, cara main ringkas sesuai mode adegan,
 * tombol dokumen/checklist bila ada, dan janji bahwa bonus waktu baru berjalan setelah tombol ditekan.
 * Tugas = h2 (menerima fokus saat kartu tampil); judul misi = h1 tepat di atasnya.
 */
function KartuMulai({ misi, bantu, onMulai }: { misi: MissionPublic; bantu: PanelBantu; onMulai: () => void }) {
  useBahasa();
  const tombol = t('misi.siapMulai');
  const kasus = TOKOH.missRaksa.aktif
    ? <SapaanPemandu tokoh="missRaksa" label={`${namaTokoh('missRaksa')} · ${t('misi.labelKasus')}`} teks={misi.story} ukuran={44} />
    : <div><span className="status-label">{t('misi.labelKasus')}</span><p>{misi.story}</p></div>;
  return <div className="status-panel misi-mulai">
    {kasus}
    <div className="status-tugas"><span className="status-label">{t('misi.tugasmu')}</span><h2>{misi.instruction}</h2></div>
    <div className="misi-mulai-cara"><span className="status-label">{t('misi.caraMain')}</span>{bantu.caraRingkas}</div>
    {bantu.tombolInfo}
    <div className="misi-mulai-aksi">
      <p className="misi-mulai-bonus"><Icon name="jam" size={18} /><span>{t('misi.bonusSetelahMulai', { tombol })}</span></p>
      <button type="button" className="primary-action" onClick={onMulai}>{tombol}<Arrow /></button>
    </div>
  </div>;
}

/** Ikon jeda (dua balok) / lanjut (segitiga); hiasan, katanya ada di sebelahnya. */
function TandaJeda({ lanjut }: { lanjut: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
    {lanjut ? <path d="M8 5.5v13l11-6.5Z" /> : <><rect x="6.5" y="5" width="4" height="14" rx="1.2" /><rect x="13.5" y="5" width="4" height="14" rx="1.2" /></>}
  </svg>;
}
