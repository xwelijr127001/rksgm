import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MissionAnswer, StepAnswer } from '@shared/types';
import type { FromUnityMessage } from '@shared/unityBridge';
import { Raki } from '../art/Raki';
import { Scene } from '../art/Scene';
import { playSfx, setTrack } from '../audio/audio';
import { MissionReference, MissionStage } from '../components/MissionStage';
import { PlayerShell } from '../components/PlayerShell';
import { useCountdown } from '../hooks';
import { langkahTerisi } from '../interactions/Interaction';
import { actions, useGame } from '../state/store';
import { sendToUnity, unityBridge } from '../unity/bridge';
import { selectionsFromAnswer, sendLoadMission } from '../unity/missionObjects';
import { unityRuntime, type UnityStatus } from '../unity/unityLoader';
import { Leaderboard, Memuat, Pesan, Timer } from '../ui/kit';

export default function Play() {
  const { room, me, identity, status } = useGame();
  const [draft, setDraft] = useState<MissionAnswer>({});
  const [submission, setSubmission] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sceneSiap, setSceneSiap] = useState(false);
  const [unityStatus, setUnityStatus] = useState<UnityStatus>(() => unityRuntime.getStatus());
  const phase = room?.phase ?? null;
  const roundIndex = room?.roundIndex ?? -1;
  const mission = room?.mission ?? null;
  const code = identity?.code ?? room?.code ?? null;
  const { remainingMs } = useCountdown(room?.phaseEndsAt ?? null, room?.phaseDurationMs ?? null);
  const result = me?.rounds.find(r => r.roundIndex === roundIndex) ?? null;
  const sent = (roundIndex >= 0 && me?.submittedRound === roundIndex) || submission === 'sent';
  const answer = sent && me?.submittedAnswer ? me.submittedAnswer : draft;
  const answerRef = useRef<MissionAnswer>(answer);
  const inFlight = useRef(false);

  useEffect(() => { setDraft({}); setSubmission('idle'); setError(null); setSceneSiap(false); inFlight.current = false; }, [roundIndex]);
  useEffect(() => { answerRef.current = answer; });
  useEffect(() => unityRuntime.subscribe(setUnityStatus), []);
  useEffect(() => { if (phase === 'ACTIVE' || phase === 'BRIEFING') setTrack('game'); }, [phase]);
  useEffect(() => () => setTrack(null), []);
  useEffect(() => {
    if (phase === 'REVEAL') playSfx(result?.accuracy === 1 ? 'naik' : 'pilih');
    if (phase === 'LEADERBOARD') playSfx('papan');
  }, [phase, roundIndex]);

  // Kesiapan adegan: BRIEFING sudah meminta Unity memuat misi, lalu kesiapannya
  // dilaporkan ke host. Server TIDAK memberi tambahan waktu individual.
  useEffect(() => {
    if (!mission || roundIndex < 0) return;
    unityBridge.setContext({ missionId: mission.id, roundIndex });
    const handler = (msg: FromUnityMessage): void => {
      if (msg.type !== 'missionReady') return;
      setSceneSiap(true);
      void actions.sceneReady(roundIndex);
    };
    unityBridge.on(handler);
    if (phase === 'BRIEFING') sendLoadMission(mission, roundIndex);
    return () => unityBridge.off(handler);
  }, [mission, roundIndex, phase]);

  // Tab kembali aktif: ambil snapshot server terbaru & samakan lagi adegan Unity.
  // Timer tetap dari room.phaseEndsAt, jadi tidak ada hitung mundur yang dimulai ulang.
  useEffect(() => {
    const onVisible = (): void => {
      if (document.visibilityState !== 'visible') return;
      if (code) void actions.requestState(code);
      if (!mission || roundIndex < 0 || !phase) return;
      sendToUnity({ type: 'setPhase', missionId: mission.id, roundIndex, phase });
      sendToUnity({ type: 'restoreSelections', missionId: mission.id, roundIndex, selections: selectionsFromAnswer(mission, answerRef.current) });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [code, mission, roundIndex, phase]);

  function change(stepId: string, value: StepAnswer) { setDraft(old => ({ ...old, [stepId]: value })); }
  async function submit() {
    if (!room || phase !== 'ACTIVE' || sent || inFlight.current || status !== 'connected') return;
    inFlight.current = true; setSubmission('sending'); setError(null);
    const response = await actions.submit(room.roundIndex, draft);
    inFlight.current = false;
    if (response.ok) { setSubmission('sent'); playSfx('kirim'); }
    else { setSubmission('failed'); setError(response.error ?? 'Jawaban belum terkirim. Coba lagi, ya.'); }
  }
  if (!room || !identity) return <PlayerShell back="/"><main className="result-focus">{status === 'connecting' ? <Memuat teks="Menyambungkan permainan…" /> : <><Raki size={120} /><h1>Ikut main, yuk.</h1><Link className="primary-action" to="/join">Masukkan kode permainan</Link></>}</main></PlayerShell>;

  const locked = phase !== 'ACTIVE' || sent || submission === 'sending' || status !== 'connected' || (remainingMs !== null && remainingMs <= 0);
  const mine = room.leaderboard?.find(r => r.playerId === identity.playerId);
  // Hanya relevan bila Unity memang sedang dimuat; mode ringan tidak perlu menunggu.
  const menyiapkan = !sceneSiap && (unityStatus === 'checking' || unityStatus === 'loading' || unityStatus === 'ready');

  return <PlayerShell label={phase === 'ACTIVE' || phase === 'BRIEFING' ? <Timer endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} /> : 'Misi ' + (mission?.number ?? roundIndex + 1)}>
    {status !== 'connected' ? <div className="wrap"><Pesan jenis="kuning">Koneksi terputus. Sedang menyambungkan kembali…</Pesan></div> : null}
    {phase === 'PAUSED' ? <main className="result-focus"><Raki size={145} mood="berpikir" /><h1>Istirahat sebentar.</h1><p>Panitia menjeda permainan. Tunggu di sini, ya.</p><div className="waiting-orbit" aria-hidden="true"><i /><i /><i /></div></main>
    : phase === 'LEADERBOARD' ? <main className="briefing-main"><span className="eyebrow">SEMAKIN SERU!</span><h1>Siapa yang terdepan?</h1><Leaderboard rows={room.leaderboard ?? []} highlightId={identity.playerId} limit={5} />{mine && mine.rank > 5 ? <p className="status-caption">Posisimu #{mine.rank} · {mine.totalPoints.toLocaleString('id-ID')} poin</p> : null}<p className="status-caption">Misi berikutnya segera dimulai.</p></main>
    : !mission ? <main className="result-focus"><Memuat teks="Menyiapkan misi…" /></main>
    : phase === 'BRIEFING' ? <main className="briefing-main"><span className="eyebrow">MISI {String(mission.number).padStart(2, '0')} / {room.totalRounds}</span><h1>{mission.title}</h1><div className="briefing-scene"><Scene scene={mission.scene} /></div><p>{mission.story}</p><MissionReference key={mission.id} mission={mission} open />{menyiapkan ? <p className="status-caption" role="status" aria-live="polite">Menyiapkan kotamu…</p> : null}<div className="status-caption">Baca ceritanya dulu. Sebentar lagi giliranmu.</div></main>
    : phase === 'REVEAL' ? <main className="result-focus"><Raki size={130} mood={result?.accuracy === 1 ? 'senang' : 'bicara'} /><span className="eyebrow">MISI {mission.number} SELESAI</span><h1>{result?.accuracy === 1 ? 'Kerja bagus!' : result?.answered ? 'Satu pelajaran baru.' : 'Lanjut di misi berikutnya.'}</h1>{result ? <div className="result-stat"><strong>+{result.roundScore.toLocaleString('id-ID')}</strong><span>poin untukmu</span></div> : null}<p>{room.reveal?.learning ?? 'Pembahasan segera muncul.'}</p>{room.reveal ? <details className="simple-details answer-review"><summary>Lihat jawaban & penjelasan</summary>{room.reveal.steps.map(s => <div key={s.stepId}><strong>{s.prompt}</strong><p>{s.correctText.join(' · ')}</p><p className="lembut">{s.explanation}</p></div>)}</details> : null}<span className="status-caption">Peringkat segera ditampilkan.</span></main>
    : sent ? <main className="result-focus"><Raki size={150} mood="senang" /><h1>Jawaban masuk!</h1><p>Sekarang, tunggu teman-teman yang lain.</p><div className="waiting-orbit" aria-hidden="true"><i /><i /><i /></div><span className="status-caption">{room.submittedCount} dari {room.playerCount} pemain sudah menjawab</span></main>
    : <main className="game-main"><div className="game-heading"><div><span className="eyebrow">MISI {String(mission.number).padStart(2, '0')} / {room.totalRounds}</span><h1>{mission.title}</h1></div></div>
      {error ? <Pesan jenis="error">{error}</Pesan> : null}
      {menyiapkan ? <p className="status-caption" role="status" aria-live="polite" style={{ marginBottom: 12 }}>Menyiapkan kotamu… Soalnya sudah bisa dijawab, kok.</p> : null}
      <MissionStage key={mission.id} mission={mission} answer={answer} onAnswer={change} locked={locked} phase={phase ?? undefined} roundIndex={room.roundIndex} onSubmit={() => void submit()} submitting={submission === 'sending'} />
      {phase === 'ACTIVE' && remainingMs !== null && remainingMs < 7000 && mission.steps.some(s => langkahTerisi(s, draft[s.id])) && !locked ? <button className="text-button" onClick={() => void submit()}>Waktu hampir habis — kirim jawaban yang sudah diisi</button> : null}
    </main>}
  </PlayerShell>;
}
