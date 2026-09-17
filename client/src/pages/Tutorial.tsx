import { useState } from 'react';
import { TUTORIAL_MISSION } from '@shared/missions';
import type { MissionAnswer } from '@shared/types';
import { Raki } from '../art/Raki';
import { playSfx } from '../audio/audio';
import { MissionStage } from '../components/MissionStage';
import { PlayerShell } from '../components/PlayerShell';
export default function Tutorial() {
  const [answer, setAnswer] = useState<MissionAnswer>({});
  const [sent, setSent] = useState(false);
  const correct = answer[TUTORIAL_MISSION.steps[0].id] === 'helm';
  return <PlayerShell label="Pemanasan">
    {sent ? <main className="result-focus"><Raki size={140} mood={correct ? 'senang' : 'bicara'} /><h1>{correct ? 'Nah, semudah itu!' : 'Coba pilih helm, ya.'}</h1><p>{correct ? 'Kamu siap bermain. Tunggu panitia memulai.' : 'Tenang, ini masih pemanasan. Boleh coba lagi.'}</p><button className={correct ? 'text-button' : 'primary-action'} onClick={() => { setSent(false); setAnswer({}); }}>Coba lagi</button><p className="practice-note">Simulasi edukasi. Klaim sebenarnya mengikuti polis dan pemeriksaan Raksa.</p></main>
    : <main className="game-main"><div className="game-heading"><div><span className="eyebrow">COBA SEKALI, LANGSUNG PAHAM</span><h1>Ketuk pilihan, lalu kirim.</h1></div></div><MissionStage mission={TUTORIAL_MISSION} answer={answer} onAnswer={(id, v) => setAnswer(old => ({ ...old, [id]: v }))} onSubmit={() => { playSfx('kirim'); setSent(true); }} showScene={false} /><p className="practice-note" style={{ marginTop: 25 }}>Pemanasan ini tidak memengaruhi poin kamu.</p><p className="practice-note">Simulasi edukasi. Klaim sebenarnya mengikuti polis dan pemeriksaan Raksa.</p></main>}
  </PlayerShell>;
}

