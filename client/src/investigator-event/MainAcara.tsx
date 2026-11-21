/**
 * T-109 (Investigator lengkap, card 6): one case played ON the event board, route /investigator/acara/<n>.
 *
 * It is the SAME story player as solo (pages/CeritaMain `SesiCerita`), with two differences from card 5's hooks:
 *  - the story save is the run's own (`episodeAcara(ep, runId)`): a ranked run starts from the beginning, a reload resumes
 *    that run, and the solo save of the case is never read or written;
 *  - every scored choice (round card, conclusion, message) is POSTed first (`pasangPenilaiAcara`) and is applied to the story
 *    only after the server acknowledged it. The server computes the score; the phone sends ids only.
 *
 * Reliability rules
 *  - The command of a decision is stored BEFORE it is sent and its id is reused on every retry, so a decision counts once.
 *  - Entering the page: a stored unfinished run whose seq matches the server (or whose pending command the server already
 *    acknowledged) is resumed; anything else starts a new run with a new save.
 *  - Network loss or a refusal: the choice is NOT applied; a sheet offers "Coba lagi" (same command) or "Lanjut tanpa
 *    peringkat" (the rest of this run is played unranked and nothing more is sent). The game never gets stuck.
 *  - No session, flag off, board unreachable at the start, or a case / rubric version the server does not rank: the solo
 *    route of the case ("Main sendiri").
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { EVENT_ROUTES, type Ack, type RunState, type StartRunReply } from '@shared/investigator/event';
import { CASE_MANIFESTS, startProgress } from '@shared/investigator/rubric';
import { cariEpisode } from '../cerita/episode';
import { episodeAcara, pasangPenilaiAcara, type PilihanBernilai } from '../cerita/investigasi/acara';
import { EPISODE_KASUS, niatHub, RUTE_HUB, ruteKasus, stateNiat } from '../cerita/investigasi/rute';
import { teksCerita } from '../cerita/teks';
import { t, useBahasa } from '../i18n';
import { SesiCerita } from '../pages/CeritaMain';
import { LOOK_BAWAAN, useProfil } from '../state/profil';
import { useAppConfig } from '../story/appConfig';
import { Memuat, Modal } from '../ui/kit';
import { panggil, teksGalat } from './api';
import { bacaSesi, berlanggananSesi, idPerintah, simpanSesi, ubahRun, ubahSesi, versiSesi } from './sesi';
import { LencanaPapanAcara } from './ui';
import './acara.css';

type Tahap = { jenis: 'siap'; runId: string } | { jenis: 'gagal'; pesan: string } | { jenis: 'sendiri' } | null;
interface Masalah { pesan: string; coba: (() => void) | null; lepas: () => void }

export default function MainAcara() {
  const { kasus } = useParams();
  const lokasi = useLocation();
  const { bahasa } = useBahasa();
  const { profil } = useProfil();
  const cfg = useAppConfig();
  useSyncExternalStore(berlanggananSesi, versiSesi, () => 0);
  const m = CASE_MANIFESTS.find((x) => String(x.number) === kasus) ?? null;
  const ep = m && kasus && Object.prototype.hasOwnProperty.call(EPISODE_KASUS, kasus) ? cariEpisode(EPISODE_KASUS[kasus]) : null;
  const aktif = cfg.status === 'ready' && cfg.config.investigatorAcara;
  const [tahap, setTahap] = useState<Tahap>(null);
  const [ulang, setUlang] = useState(0);
  const [status, setStatus] = useState<'tersambung' | 'tunggu' | 'putus'>('tersambung');
  const [masalah, setMasalah] = useState<Masalah | null>(null);
  const caseId = m?.caseId ?? '';
  const versiRubrik = m?.rubricVersion ?? 0;

  // ---- find or start the run of this case
  useEffect(() => {
    if (!aktif || !m || !ep) return;
    let hidup = true;
    setTahap(null);
    void (async () => {
      const s = bacaSesi();
      // No session, or the server does not rank this case with this rubric version: play it solo.
      if (!s || !s.cases.some((c) => c.caseId === caseId && c.rubricVersion === versiRubrik)) { setTahap({ jenis: 'sendiri' }); return; }
      const lama = s.runs[caseId];
      if (lama && !lama.selesai && !lama.lepas) {
        const r = await panggil<RunState>('GET', EVENT_ROUTES.run, { bearer: s.credential, param: { runId: lama.runId } });
        if (!hidup) return;
        if (!r.ok && r.error === 'unavailable') { setTahap({ jenis: 'gagal', pesan: teksGalat(r.error) }); return; }
        // Resume only when both sides agree: same seq, or the server already acknowledged the command that was pending here
        // (then tapping that choice again returns the stored acknowledgement and the story catches up, exactly once).
        const cocok = r.ok && r.status === 'active' && (r.seq === lama.seq || (r.seq === lama.seq + 1 && !!lama.pending && r.last?.commandId === lama.pending.commandId));
        if (cocok) { setTahap({ jenis: 'siap', runId: lama.runId }); return; }
      }
      const r = await panggil<StartRunReply>('POST', EVENT_ROUTES.runs, { bearer: s.credential, body: { caseId, rubricVersion: versiRubrik } });
      if (!hidup) return;
      if (r.ok && r.status === 'started') {
        ubahSesi((x) => ({ ...x, mulai: true, runs: { ...x.runs, [caseId]: { runId: r.run.runId, seq: r.run.seq } } }));
        setTahap({ jenis: 'siap', runId: r.run.runId });
      } else if (r.ok) setTahap({ jenis: 'sendiri' });
      else if (r.error === 'unauthorized') { simpanSesi(null); setTahap({ jenis: 'sendiri' }); }
      else setTahap({ jenis: 'gagal', pesan: teksGalat(r.error) });
    })();
    return () => { hidup = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif, caseId, versiRubrik, ulang]);

  // ---- scored choices go to the server first
  const siap = tahap?.jenis === 'siap';
  useEffect(() => {
    if (!siap || !m) return;
    const tahapAwal = startProgress(m).stage;
    const kirim = (p: PilihanBernilai): Promise<boolean> => new Promise((selesai) => {
      const coba = async (sudahRunBaru: boolean): Promise<void> => {
        const s = bacaSesi();
        const run = s?.runs[caseId];
        if (!s || !run || run.lepas) { selesai(true); return; } // unranked from here on: apply locally, send nothing
        const pending = run.pending && run.pending.stageId === p.tahap && run.pending.choiceId === p.pilihan ? run.pending : { commandId: idPerintah(), stageId: p.tahap, choiceId: p.pilihan };
        ubahRun(caseId, (x) => (x ? { ...x, pending } : x));
        setMasalah(null);
        setStatus('tunggu');
        const r = await panggil<Ack>('POST', EVENT_ROUTES.decisions, { bearer: s.credential, param: { runId: run.runId }, body: { runId: run.runId, seq: run.seq, commandId: pending.commandId, stageId: p.tahap, choiceId: p.pilihan } });
        if (r.ok) {
          ubahRun(caseId, (x) => (x ? { runId: x.runId, seq: r.seq, ...(r.status === 'completed' ? { selesai: true } : {}) } : x));
          setStatus('tersambung');
          selesai(true);
          return;
        }
        // The story was replayed from its first scored step after this run had finished: a NEW ranked run, then send again.
        if (r.error === 'run_done' && !sudahRunBaru && p.tahap === tahapAwal) {
          const baru = await panggil<StartRunReply>('POST', EVENT_ROUTES.runs, { bearer: s.credential, body: { caseId, rubricVersion: versiRubrik } });
          if (baru.ok && baru.status === 'started') { ubahRun(caseId, () => ({ runId: baru.run.runId, seq: baru.run.seq })); void coba(true); return; }
        }
        const lepas = () => { ubahRun(caseId, (x) => (x ? { runId: x.runId, seq: x.seq, lepas: true } : x)); setMasalah(null); setStatus('tersambung'); selesai(true); };
        const jaringan = r.error === 'unavailable' || r.error === 'rate_limited';
        const selisih = r.error === 'seq_mismatch' || r.error === 'stage_mismatch' || r.error === 'command_conflict' || r.error === 'invalid_choice' || r.error === 'run_done';
        setStatus('putus');
        setMasalah({ pesan: jaringan ? t('acaraInv.putusTeks') : selisih ? t('acaraInv.tercatatTeks') : teksGalat(r.error), coba: jaringan ? () => void coba(sudahRunBaru) : null, lepas });
      };
      void coba(false);
    });
    return pasangPenilaiAcara(kirim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siap, caseId, versiRubrik]);

  const runId = tahap?.jenis === 'siap' ? tahap.runId : null;
  const epAcara = useMemo(() => (ep && runId ? episodeAcara(ep, runId) : null), [ep, runId]);
  const sesi = bacaSesi();

  if (cfg.status !== 'ready') return <Memuat />;
  if (!m || !ep) return <Navigate to={RUTE_HUB} replace />;
  const sendiri = ruteKasus(m.number);
  if (!aktif || tahap?.jenis === 'sendiri') return <Navigate to={sendiri} replace />;
  // The "continue / start new" gate of the solo player must never show here ("start new" would clear the SOLO record).
  if (niatHub(lokasi.state) !== 'lanjut') return <Navigate to={lokasi.pathname} state={stateNiat('lanjut')} replace />;
  if (tahap?.jenis === 'gagal') {
    return (
      <main className="ai-acara-gagal" data-acara-gagal="">
        <h1>{t('acaraInv.putusJudul')}</h1>
        <p role="alert">{tahap.pesan}</p>
        <button type="button" className="primary-action" onClick={() => setUlang((n) => n + 1)}>{t('acaraInv.cobaLagi')}</button>
        <Link className="cer-tombol-garis" to={sendiri}>{t('acaraInv.pilihSendiri')}</Link>
      </main>
    );
  }
  if (!epAcara) return <Memuat />;
  const profilAwal = profil ?? { nickname: teksCerita(ep, 'kenalan.namaBawaan', bahasa), look: { ...LOOK_BAWAAN } };
  return (
    <>
      {status !== 'tersambung' && sesi ? <div className="ai-melayang"><LencanaPapanAcara alias={sesi.alias} status={status} /></div> : null}
      <SesiCerita key={epAcara.id} ep={epAcara} profilAwal={profilAwal} />
      {masalah ? (
        <Modal judul={t('acaraInv.putusJudul')} onTutup={() => undefined} lebar={420}
          aksi={<>
            <button type="button" className="btn btn-netral" data-acara-lepas="" onClick={masalah.lepas}>{t('acaraInv.tanpaPeringkat')}</button>
            {masalah.coba ? <button type="button" className="btn btn-utama" data-acara-coba="" onClick={masalah.coba}>{t('acaraInv.cobaLagi')}</button> : null}
          </>}>
          <p>{masalah.pesan}</p>
        </Modal>
      ) : null}
    </>
  );
}
