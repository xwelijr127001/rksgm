import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TOKOH } from '@shared/brand';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '@shared/missions';
import type { MissionAnswer, MissionPublic, MissionReveal } from '@shared/types';
import type { RoundScore } from '@shared/scoring';
import { Raki } from '../art/Raki';
import { Icon } from '../art/Icon';
import { forceMusic, playSfx, setTrack } from '../audio/audio';
import { PlayerShell, Arrow } from '../components/PlayerShell';
import { SapaanPemandu } from '../game/KarakterTokoh';
import { HasilMisi, MissionPlay, type SubmitState } from '../game/MissionPlay';
import { prefetchAdegan } from '../game/prefetch';
import { kalimatKe } from '../game/tokoh';
import { useLocalState } from '../hooks';
import { savedLook } from '../state/store';

interface HasilLatihan { accuracy: number; score: RoundScore; reveal: MissionReveal; }

export default function Practice() {
  const [params] = useSearchParams();
  useEffect(() => { forceMusic(true); setTrack('game'); prefetchAdegan(); return () => { setTrack(null); forceMusic(false); }; }, []);

  const [active, setActive] = useState<MissionPublic | null>(() => {
    const n = Number(params.get('misi'));
    // Pratinjau adegan tutorial (0) & penentuan (11) hanya saat development.
    if (import.meta.env.DEV && n === 0) return TUTORIAL_MISSION;
    if (import.meta.env.DEV && n === 11) return TIEBREAK_MISSION;
    return MISSIONS.find(m => m.number === n) ?? null;
  });
  const [answer, setAnswer] = useState<MissionAnswer>({});
  const [result, setResult] = useState<HasilLatihan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kirim, setKirim] = useState<SubmitState>('idle');
  const [start, setStart] = useState(Date.now);
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useLocalState<Record<string, number>>('raksa:latihan', {});
  const [look] = useState(savedLook);

  function begin(mission: MissionPublic) {
    setActive(mission); setAnswer({}); setResult(null); setError(null); setKirim('idle'); setStart(Date.now()); setAttempt(a => a + 1); window.scrollTo(0, 0);
  }
  async function submit() {
    if (!active || kirim === 'sending') return;
    setKirim('sending'); setError(null); playSfx('kirim');
    try {
      const response = await fetch('/api/practice/grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missionId: active.id, answer, elapsedSeconds: Math.min(active.durationSeconds, (Date.now() - start) / 1000) }) });
      if (!response.ok) throw new Error('grade');
      const data: HasilLatihan = await response.json();
      setResult(data);
      setKirim('sent');
      setProgress({ ...progress, [active.id]: Math.max(progress[active.id] ?? 0, data.accuracy) });
      playSfx(data.accuracy === 1 ? 'naik' : 'pilih');
    } catch { setKirim('failed'); setError('Belum ada jawaban dari server.'); }
  }

  if (!active) return <PlayerShell back="/" label="Latihan"><main className="join-main practice-intro">
    <Raki size={130} mood="sapa" /><span className="eyebrow">COBA TANPA BURU-BURU</span><h1>Pemanasan dulu?</h1><p>Kenali cara mainnya. Di sini, bebas mencoba.</p>
    <button className="primary-action" onClick={() => begin(MISSIONS[0])}>Coba misi pertama <Arrow /></button>
    <details className="simple-details practice-list"><summary>Pilih misi lainnya</summary><div>{MISSIONS.map(m => <button key={m.id} onClick={() => begin(m)}><span>{String(m.number).padStart(2, '0')}</span><b>{m.title}</b>{progress[m.id] === 1 ? <Icon name="cek" size={18} /> : <Arrow />}</button>)}</div></details>
    <p className="practice-note">Simulasi edukasi. Klaim sebenarnya mengikuti polis Raksa.</p>
  </main></PlayerShell>;

  const next = MISSIONS.find(m => m.number === active.number + 1);
  const tepat = result?.accuracy === 1;
  // Tombol utama mengikuti hasil; pemain tetap boleh lanjut tanpa mengulang.
  const lanjut = next
    ? <button className={tepat ? 'primary-action' : 'text-button'} onClick={() => begin(next)}>Lanjut ke misi {next.number}<Arrow /></button>
    : <button className={tepat ? 'primary-action' : 'text-button'} onClick={() => setActive(null)}>Lihat semua misi<Arrow /></button>;
  const ulang = <button className={tepat ? 'text-button' : 'primary-action'} onClick={() => begin(active)}>{tepat ? 'Ulangi misi ini' : 'Coba lagi'}{tepat ? null : <Arrow />}</button>;

  return <PlayerShell back="/" label="Latihan santai" className="kompak">
    <main className="misi-main">
      <div className="misi-judul"><div><span className="eyebrow">LATIHAN · MISI {String(active.number).padStart(2, '0')} / 10</span><h1>{active.title}</h1></div><button className="text-button" onClick={() => setActive(null)}>Daftar misi</button></div>
      <MissionPlay
        key={active.id + ':' + attempt}
        mission={active}
        roundIndex={-1}
        look={look}
        mode={result ? 'reveal' : 'play'}
        answer={answer}
        onAnswer={(id, value) => setAnswer(old => ({ ...old, [id]: value }))}
        onSubmit={() => void submit()}
        submitState={kirim}
        submitError={error}
        reveal={result?.reveal ?? null}
        submitLabel="Periksa jawabanku"
        panel={(bantu) => result ? <HasilMisi
          mission={active}
          reveal={result.reveal}
          answer={answer}
          akurasi={result.accuracy}
          dijawab
          lihatAdegan={bantu.lihatAdegan}
          aksi={tepat ? <>{lanjut}{ulang}</> : <>{ulang}{lanjut}</>}
          catatan={<>
            <SapaanPemandu tokoh="ceo" teks={kalimatKe(TOKOH.ceo.sapaan.pembahasan, active.number - 1)} ukuran={40} className="pemandu-kecil" />
            <p className="practice-note">Simulasi edukasi. Klaim sebenarnya mengikuti polis Raksa.</p>
          </>}
        /> : null}
      />
      {!result ? <p className="practice-note misi-catatan">Simulasi edukasi. Klaim sebenarnya mengikuti polis dan pemeriksaan Raksa.</p> : null}
    </main>
  </PlayerShell>;
}
