import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MISSIONS } from '@shared/missions';
import type { MissionAnswer, MissionPublic, MissionReveal } from '@shared/types';
import type { RoundScore } from '@shared/scoring';
import { Raki } from '../art/Raki';
import { Icon } from '../art/Icon';
import { forceMusic, playSfx, setTrack } from '../audio/audio';
import { MissionStage } from '../components/MissionStage';
import { PlayerShell, Arrow } from '../components/PlayerShell';
import { useLocalState } from '../hooks';
import { Pesan } from '../ui/kit';
interface HasilLatihan { accuracy: number; score: RoundScore; reveal: MissionReveal; }
export default function Practice() {
  const [params] = useSearchParams();
  useEffect(() => { forceMusic(true); setTrack('game'); return () => { setTrack(null); forceMusic(false); }; }, []);

  const [active, setActive] = useState<MissionPublic | null>(() => MISSIONS.find(m => m.number === Number(params.get('misi'))) ?? null);
  const [answer, setAnswer] = useState<MissionAnswer>({});
  const [result, setResult] = useState<HasilLatihan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [start, setStart] = useState(Date.now);
  const [progress, setProgress] = useLocalState<Record<string, number>>('raksa:latihan', {});
  function begin(mission: MissionPublic) { setActive(mission); setAnswer({}); setResult(null); setError(null); setStart(Date.now()); window.scrollTo(0, 0); }
  async function submit() {
    if (!active || sending) return;
    setSending(true); setError(null); playSfx('kirim');
    try {
      const response = await fetch('/api/practice/grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missionId: active.id, answer, elapsedSeconds: Math.min(active.durationSeconds, (Date.now() - start) / 1000) }) });
      if (!response.ok) throw new Error('grade');
      const data: HasilLatihan = await response.json();
      setResult(data);
      setProgress({ ...progress, [active.id]: Math.max(progress[active.id] ?? 0, data.accuracy) });
      playSfx(data.accuracy === 1 ? 'naik' : 'pilih');
      window.scrollTo(0, 0);
    } catch { setError('Jawaban belum terkirim. Periksa koneksi, lalu coba lagi.'); }
    finally { setSending(false); }
  }
  if (!active) return <PlayerShell back="/" label="Latihan"><main className="join-main practice-intro">
    <Raki size={130} mood="sapa" /><span className="eyebrow">COBA TANPA BURU-BURU</span><h1>Pemanasan dulu?</h1><p>Kenali cara mainnya. Di sini, bebas mencoba.</p>
    <button className="primary-action" onClick={() => begin(MISSIONS[0])}>Coba misi pertama <Arrow /></button>
    <details className="simple-details practice-list"><summary>Pilih misi lainnya</summary><div>{MISSIONS.map(m => <button key={m.id} onClick={() => begin(m)}><span>{String(m.number).padStart(2, '0')}</span><b>{m.title}</b>{progress[m.id] === 1 ? <Icon name="cek" size={18} /> : <Arrow />}</button>)}</div></details>
    <p className="practice-note">Simulasi edukasi. Klaim sebenarnya mengikuti polis Raksa.</p>
  </main></PlayerShell>;
  const next = MISSIONS.find(m => m.number === active.number + 1);
  return <PlayerShell back="/" label="Latihan santai">
    <main className={result ? 'result-focus' : 'game-main'}>
      {error ? <Pesan jenis="error">{error}</Pesan> : null}
      {result ? <>
        <Raki size={145} mood={result.accuracy === 1 ? 'senang' : 'bicara'} />
        <span className="eyebrow">MISI {active.number} SELESAI</span>
        <h1>{result.accuracy === 1 ? 'Kamu jago juga!' : 'Makin paham, kan?'}</h1>
        <p>{result.reveal.learning}</p>
        <div className="result-stat"><strong>{Math.round(result.accuracy * 100)}<small>%</small></strong><span>jawaban tepat</span></div>
        <details className="simple-details answer-review"><summary>Lihat jawabannya</summary>{result.reveal.steps.map(s => <div key={s.stepId}><strong>{s.prompt}</strong><p>{s.correctText.join(' · ')}</p><p className="lembut">{s.explanation}</p></div>)}</details>
        <button className="primary-action" onClick={() => next ? begin(next) : setActive(null)}>{next ? 'Coba misi berikutnya' : 'Lihat semua misi'}<Arrow /></button>
        <div className="result-links"><button className="text-button" onClick={() => begin(active)}>Coba lagi</button><Link className="text-button" to="/join">Gabung acara</Link><button className="text-button" onClick={() => setActive(null)}>Pilih misi</button></div>
      </> : <>
        <div className="game-heading"><div><span className="eyebrow">MISI {String(active.number).padStart(2, '0')} / 10</span><h1>{active.title}</h1></div><button className="text-button" onClick={() => setActive(null)}>Ganti misi</button></div>
        <MissionStage key={active.id} mission={active} answer={answer} onAnswer={(id, value) => setAnswer(old => ({ ...old, [id]: value }))} locked={sending} onSubmit={() => void submit()} submitting={sending} />
      </>}
    </main>
  </PlayerShell>;
}

