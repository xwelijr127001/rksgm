import { useEffect, useMemo, useRef, useState } from 'react';
import type { MissionAnswer, MissionPublic, MissionReveal, Phase, StepAnswer, StepDef } from '@shared/types';
import type { CameraView, FromUnityMessage } from '@shared/unityBridge';
import { Scene } from '../art/Scene';
import { playSfx, playSfxFromUnity } from '../audio/audio';
import { StepRenderer, langkahTerisi } from '../interactions/Interaction';
import { DocTableView, PolicyCardView } from '../ui/kit';
import { sendToUnity, unityBridge } from '../unity/bridge';
import { objectsForMission, selectionsFromAnswer, sendLoadMission } from '../unity/missionObjects';
import { UnityStage } from '../unity/UnityStage';
import { unityRuntime, type UnityStatus } from '../unity/unityLoader';
import { Arrow } from './PlayerShell';

/** Misi inspeksi unit; sama dengan cameraViews di tools/gen-unity-data.ts. */
const MISI_BERSUDUT = new Set(['m02-detektif-penyok', 'm04-excavator', 'm08-benturan-keausan']);
const SUDUT_PANDANG: { view: CameraView; label: string }[] = [
  { view: 'depan', label: 'Depan' },
  { view: 'kiri', label: 'Sisi kiri' },
  { view: 'kanan', label: 'Sisi kanan' },
];

const GAYA_ADEGAN = `.mission-scene{margin-bottom:22px}
.mission-scene>div{border-radius:18px!important}
.scene-views{display:flex;flex-wrap:wrap;gap:8px;margin:-8px 0 20px}
.scene-views>button{flex:1 1 90px;min-height:44px}
.scene-views>button[aria-pressed="true"]{border-color:#427348;background:#eef5e9;box-shadow:0 0 0 1px #427348}`;

function useUnityStatus(): UnityStatus {
  const [status, setStatus] = useState<UnityStatus>(() => unityRuntime.getStatus());
  useEffect(() => unityRuntime.subscribe(setStatus), []);
  return status;
}

/** Unity masih mungkin dipakai (belum ketahuan tidak tersedia / gagal). */
function unityMungkin(status: UnityStatus): boolean {
  return status !== 'unavailable' && status !== 'unsupported' && status !== 'error';
}

function daftar(v: StepAnswer | undefined): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/**
 * Ketukan dari Unity diubah menjadi bentuk jawaban yang SAMA dengan kontrol HTML.
 * `tambah`: true/false dari evidenceToggled, null = ketukan biasa (toggle).
 */
function terapkanKetukan(step: StepDef, kini: StepAnswer | undefined, optionId: string, bucketId: string | undefined, tambah: boolean | null): StepAnswer {
  if (step.kind === 'single') return tambah === false ? null : optionId;
  if (step.kind === 'multi') {
    const ada = daftar(kini);
    const pilih = tambah === null ? !ada.includes(optionId) : tambah;
    if (!pilih) return ada.filter(id => id !== optionId);
    // Batas pilihan harus sama dengan kontrol HTML supaya ketepatan tidak turun diam-diam.
    if (ada.includes(optionId) || ada.length >= step.requiredSelections) return ada;
    return [...ada, optionId];
  }
  if (step.kind === 'order') {
    const ada = daftar(kini);
    return ada.includes(optionId) ? ada.filter(id => id !== optionId) : [...ada, optionId];
  }
  if (step.kind === 'assign') {
    const peta = kini !== null && kini !== undefined && typeof kini === 'object' && !Array.isArray(kini) ? { ...kini } : {};
    // Tanpa bucketId, Unity hanya menyorot kasus - bucket tetap dipilih di kontrol HTML.
    return bucketId ? { ...peta, [optionId]: bucketId } : peta;
  }
  return kini ?? null; // number: tidak ada objek yang diketuk
}

export function MissionReference({ mission, open = false }: { mission: MissionPublic; open?: boolean }) {
  if (!mission.policyCards?.length && !mission.tables?.length) return null;
  return <details className="mission-reference simple-details" open={open || undefined}><summary>{mission.tables?.length ? 'Lihat dokumen kasus' : 'Lihat informasi polis'}<span>Bahan untuk menjawab</span></summary><div className="reference-content">
    {mission.policyCards?.map(card => <PolicyCardView key={card.id} card={card} />)}
    {mission.tables?.map(table => <DocTableView key={table.id} table={table} />)}
  </div></details>;
}

export function MissionStage({ mission, answer, onAnswer, locked, reveal, showScene = true, onSubmit, submitting = false, submitLabel = 'Kirim jawaban', phase, roundIndex = 0 }: {
  mission: MissionPublic; answer: MissionAnswer; onAnswer: (stepId: string, v: StepAnswer) => void; locked?: boolean; reveal?: MissionReveal | null; showScene?: boolean;
  onSubmit?: () => void; submitting?: boolean; submitLabel?: string;
  /** Fase server; dipakai untuk setPhase ke Unity. */
  phase?: Phase;
  /** Ronde aktif; setiap pesan Unity membawanya agar ronde lama bisa ditolak. */
  roundIndex?: number;
}) {
  // Each assignment item is one screen. Its answer retains the original server step ID.
  const stages = useMemo(() => mission.steps.flatMap(step => step.kind === 'assign'
    ? step.items.map(item => ({ key: step.id + '-' + item.id, step: { ...step, items: [item], presentation: 'match' } as StepDef }))
    : [{ key: step.id, step }]), [mission]);
  const [cursor, setCursor] = useState(0);
  const [sudut, setSudut] = useState<CameraView>('default');
  const unityStatus = useUnityStatus();

  // ------------------------------------------------------------ sinkron Unity
  const adegan3d = showScene && unityMungkin(unityStatus);
  const fase: Phase = phase ?? (reveal ? 'REVEAL' : locked ? 'BRIEFING' : 'ACTIVE');
  const bolehJawab = !locked && !submitting;
  // Pesan Unity datang di luar siklus render; ref menjaga handler tetap stabil.
  const answerRef = useRef(answer);
  const onAnswerRef = useRef(onAnswer);
  const bolehRef = useRef(bolehJawab);
  const dariUnity = useRef(false);
  useEffect(() => { answerRef.current = answer; onAnswerRef.current = onAnswer; bolehRef.current = bolehJawab; });

  const objekSah = useMemo(() => new Set(objectsForMission(mission).map(o => o.stepId + '\u0000' + o.optionId)), [mission]);
  const selections = useMemo(() => selectionsFromAnswer(mission, answer), [mission, answer]);

  useEffect(() => {
    if (!adegan3d) return;
    unityBridge.setContext({ missionId: mission.id, roundIndex });
    sendLoadMission(mission, roundIndex);
  }, [adegan3d, mission, roundIndex]);

  useEffect(() => {
    if (!adegan3d) return;
    sendToUnity({ type: 'setPhase', missionId: mission.id, roundIndex, phase: fase });
  }, [adegan3d, mission.id, roundIndex, fase]);

  useEffect(() => {
    if (!adegan3d) return;
    sendToUnity({ type: 'setInteractionEnabled', missionId: mission.id, roundIndex, enabled: bolehJawab });
  }, [adegan3d, mission.id, roundIndex, bolehJawab]);

  // Perubahan dari kontrol HTML diteruskan ke Unity. Perubahan yang BARU datang
  // dari Unity tidak dikirim balik supaya tidak bergaung.
  useEffect(() => {
    if (!adegan3d) return;
    const gaung = dariUnity.current;
    dariUnity.current = false;
    if (gaung) return;
    sendToUnity({ type: 'restoreSelections', missionId: mission.id, roundIndex, selections });
  }, [adegan3d, mission.id, roundIndex, selections]);

  // Pesan Unity adalah DATA: divalidasi dulu, skor tetap dihitung server.
  useEffect(() => {
    if (!adegan3d) return;
    const handler = (msg: FromUnityMessage): void => {
      if (msg.type === 'unityReady') { sendLoadMission(mission, roundIndex, true); return; }
      if (msg.type === 'cameraViewChanged') { setSudut(msg.view); return; }
      if (msg.type === 'sfx') { playSfxFromUnity(msg.name); return; }
      if (msg.type !== 'objectSelected' && msg.type !== 'evidenceToggled') return;
      if (!bolehRef.current) return;
      const step = mission.steps.find(s => s.id === msg.stepId);
      if (!step || !objekSah.has(msg.stepId + '\u0000' + msg.optionId)) return;
      dariUnity.current = true;
      onAnswerRef.current(step.id, terapkanKetukan(step, answerRef.current[step.id], msg.optionId,
        msg.type === 'objectSelected' ? msg.bucketId : undefined,
        msg.type === 'evidenceToggled' ? msg.added : null));
      playSfx(step.kind === 'multi' ? 'bukti' : 'pilih');
    };
    unityBridge.on(handler);
    return () => unityBridge.off(handler);
  }, [adegan3d, mission, roundIndex, objekSah]);

  function pilihSudut(view: CameraView) {
    setSudut(view);
    sendToUnity({ type: 'setCameraView', missionId: mission.id, roundIndex, view });
  }

  // ------------------------------------------------------------ tampilan
  const index = Math.min(cursor, stages.length - 1);
  const current = stages[index];
  if (!current) return null;
  const step = current.step;
  const last = index === stages.length - 1;
  const complete = langkahTerisi(step, answer[step.id]);
  const hasAnswer = mission.steps.some(s => langkahTerisi(s, answer[s.id]));
  const hotspot = step.kind === 'multi' && step.presentation === 'hotspot';
  const correct = reveal?.steps.find(s => s.stepId === step.id)?.correctText ?? null;
  const tampilSudut = adegan3d && unityStatus === 'ready' && MISI_BERSUDUT.has(mission.id);
  function move(next: number) { setCursor(next); document.querySelector('.mission-question')?.scrollIntoView({ behavior: 'instant', block: 'start' }); }
  return <div className="mission-stage">
    <style>{GAYA_ADEGAN}</style>
    <aside className="mission-context">
      {showScene && adegan3d ? <div className="mission-scene"><UnityStage enabled fallback={<Scene scene={mission.scene} />} label={'Adegan ' + mission.location} /></div>
        : showScene && !hotspot ? <div className="mission-illustration"><Scene scene={mission.scene} /></div> : null}
      {tampilSudut ? <div className="scene-views" role="group" aria-label="Sudut pandang adegan">
        {SUDUT_PANDANG.map(s => <button key={s.view} type="button" className="btn btn-garis" aria-pressed={sudut === s.view} onClick={() => pilihSudut(s.view)}>{s.label}</button>)}
      </div> : null}
      <p className="mission-story">{mission.story}</p>
      <MissionReference key={mission.id} mission={mission} />
      {mission.checklist?.length && !(step.kind === 'multi' && step.presentation === 'folder') ? <details className="simple-details"><summary>Lihat daftar yang diperlukan</summary><ul>{mission.checklist.map(c => <li key={c}>{c}</li>)}</ul></details> : null}
    </aside>
    <section className="mission-question" aria-label="Tugas misi">
      {stages.length > 1 ? <div className="step-progress"><span>Pertanyaan {index + 1} dari {stages.length}</span><div aria-hidden="true">{stages.map((s, i) => <i key={s.key} className={i <= index ? 'filled' : ''} />)}</div></div> : null}
      <h2 tabIndex={-1}>{step.prompt}</h2>
      <StepRenderer key={current.key} step={step} value={answer[step.id]} onChange={v => onAnswer(step.id, v)} disabled={locked || submitting} reveal={correct} scene={mission.scene} checklist={mission.checklist} />
      <div className="mission-actions">
        {!last ? <button type="button" className="primary-action" disabled={!complete && !reveal} onClick={() => move(index + 1)}>Lanjut <Arrow /></button> : onSubmit ? <button type="button" className="primary-action" disabled={locked || submitting || !hasAnswer} onClick={onSubmit}>{submitting ? 'Mengirim…' : submitLabel}{!submitting ? <Arrow /> : null}</button> : null}
        {index > 0 ? <button type="button" className="text-button centered" onClick={() => move(index - 1)}><Arrow back /> Pertanyaan sebelumnya</button> : null}
      </div>
    </section>
  </div>;
}
