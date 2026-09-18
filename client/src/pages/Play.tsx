import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MissionPublic, Phase } from '@shared/types';
import { Icon } from '../art/Icon';
import { Raki } from '../art/Raki';
import { playSfx, setTrack } from '../audio/audio';
import { PlayerShell } from '../components/PlayerShell';
import { TOKOH, namaTokoh } from '@shared/brand';
import { PotretTokoh, SapaanPemandu } from '../game/KarakterTokoh';
import { CaraMain, HasilMisi, MissionPlay, TandaIkon, ringkas, type PanelBantu, type SubmitState } from '../game/MissionPlay';
import { kalimatKe } from '../game/tokoh';
import { prefetchAdegan } from '../game/prefetch';
import type { StageMode } from '../game/types';
import { useRoundDraft } from '../game/useRoundDraft';
import { useCountdown } from '../hooks';
import { actions, useGame } from '../state/store';
import { Leaderboard, Memuat, Timer } from '../ui/kit';

/** Fase ronde yang memakai layar misi (adegan tetap terpasang sepanjang fase ini). */
const FASE_MISI: Phase[] = ['BRIEFING', 'ACTIVE', 'REVEAL'];

export default function Play() {
  const { room, me, identity, status, kicked, sceneNonce } = useGame();
  const phase = room?.phase ?? null;
  const fase = phase === 'PAUSED' ? room?.prevPhase ?? null : phase;
  const roundIndex = room?.roundIndex ?? -1;
  const mission = room?.mission ?? null;
  const code = identity?.code ?? room?.code ?? null;
  const [draft, ubahDraft, hapusDraft] = useRoundDraft(code, roundIndex, mission);
  const [submission, setSubmission] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);
  const { remainingMs } = useCountdown(room?.phaseEndsAt ?? null, room?.phaseDurationMs ?? null);
  const result = me?.rounds.find(r => r.roundIndex === roundIndex) ?? null;
  const sent = (roundIndex >= 0 && me?.submittedRound === roundIndex) || submission === 'sent';
  const answer = sent && me?.submittedAnswer ? me.submittedAnswer : draft;
  const inFlight = useRef(false);
  const siapDilaporkan = useRef(-1);

  useEffect(() => { prefetchAdegan(); }, []);
  useEffect(() => { setSubmission('idle'); setError(null); inFlight.current = false; }, [roundIndex, mission?.id]);
  useEffect(() => { if (fase === 'ACTIVE' || fase === 'BRIEFING') setTrack('game'); }, [fase]);
  useEffect(() => () => setTrack(null), []);
  useEffect(() => {
    if (phase === 'REVEAL') playSfx(result?.accuracy === 1 ? 'naik' : 'pilih');
    if (phase === 'LEADERBOARD') playSfx('papan');
  }, [phase, roundIndex]);
  useEffect(() => { if (sent) hapusDraft(); }, [sent, hapusDraft]);

  // Tab kembali aktif: ambil snapshot server terbaru. Timer tetap dari phaseEndsAt server.
  useEffect(() => {
    const onVisible = (): void => {
      if (document.visibilityState === 'visible' && code) void actions.requestState(code);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [code]);

  async function submit() {
    if (!room || phase !== 'ACTIVE' || sent || inFlight.current || status !== 'connected') return;
    inFlight.current = true; setSubmission('sending'); setError(null);
    const response = await actions.submit(room.roundIndex, draft);
    inFlight.current = false;
    if (response.ok) { setSubmission('sent'); playSfx('kirim'); }
    else { setSubmission('failed'); setError(response.error ?? 'Server belum menerima laporanmu.'); }
  }

  if (kicked) return <PlayerShell back="/"><main className="result-focus"><Raki size={120} mood="berpikir" /><h1>Kamu keluar dari permainan.</h1><p>Panitia mengeluarkanmu dari room ini. Kalau ini keliru, minta kode baru ke panitia lalu gabung lagi.</p><Link className="primary-action" to="/join">Gabung lagi</Link></main></PlayerShell>;
  if (!room || !identity) return <PlayerShell back="/"><main className="result-focus">{status === 'connecting' ? <Memuat teks="Menyambungkan permainan…" /> : <><Raki size={120} /><h1>Ikut main, yuk.</h1><Link className="primary-action" to="/join">Masukkan kode permainan</Link></>}</main></PlayerShell>;

  const online = status === 'connected';
  const waktuHabis = fase === 'ACTIVE' && phase === 'ACTIVE' && remainingMs !== null && remainingMs <= 0;
  // Jeda hanya mengunci layar menjawab; briefing, pembahasan, dan laporan terkirim tetap tampil
  // apa adanya (dengan spanduk jeda) supaya isinya tidak hilang dari layar.
  const dijeda = phase === 'PAUSED';
  const mode: StageMode = dijeda && fase === 'ACTIVE' && !sent ? 'paused'
    : fase === 'BRIEFING' ? 'intro'
    : fase === 'REVEAL' ? 'reveal'
    : sent ? 'sent'
    : waktuHabis ? 'locked'
    : 'play';
  const mine = room.leaderboard?.find(r => r.playerId === identity.playerId);
  const label = phase === 'ACTIVE' || phase === 'BRIEFING' ? <Timer endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} /> : 'Misi ' + (mission?.number ?? roundIndex + 1);
  const spandukJeda = dijeda && mode !== 'paused' ? <div className="koneksi-putus spanduk-jeda" role="status"><Icon name="jam" size={18} /> Dijeda panitia. Waktu ikut berhenti.</div> : null;
  const putus = !online ? <div className="koneksi-putus" role="status"><PotretTokoh tokoh="isti" ukuran={40} /><i className="adegan-spinner" aria-hidden="true" /><span className="tokoh-putus-isi">{TOKOH.isti.aktif ? <b>{namaTokoh('isti')}</b> : null}Koneksi terputus. Menyambungkan kembali… Pilihanmu tetap tersimpan.</span></div> : null;

  if (phase === 'LEADERBOARD' || (phase === 'PAUSED' && fase === 'LEADERBOARD')) {
    return <PlayerShell label={label}>{putus}<main className="briefing-main"><span className="eyebrow">{phase === 'PAUSED' ? 'DIJEDA PANITIA' : 'SEMAKIN SERU!'}</span><h1>Siapa yang terdepan?</h1><Leaderboard rows={room.leaderboard ?? []} highlightId={identity.playerId} limit={5} />{mine && mine.rank > 5 ? <p className="status-caption">Posisimu #{mine.rank} · {mine.totalPoints.toLocaleString('id-ID')} poin</p> : null}<p className="status-caption">Misi berikutnya segera dimulai.</p></main></PlayerShell>;
  }
  if (!mission || !fase || !FASE_MISI.includes(fase)) {
    return <PlayerShell label={label}>{putus}<main className="result-focus"><Memuat teks="Menyiapkan misi…" /></main></PlayerShell>;
  }

  return <PlayerShell label={label} className="kompak">
    {putus}{spandukJeda}
    <main className="misi-main">
      <div className="misi-judul"><div><span className="eyebrow">MISI {String(mission.number).padStart(2, '0')} / {room.totalRounds} · {mission.productLabel.split(' - ')[0]}</span><h1>{mission.title}</h1></div></div>
      <MissionPlay
        key={`${roundIndex}:${mission.id}`}
        mission={mission}
        roundIndex={roundIndex}
        look={identity.look}
        mode={mode}
        answer={answer}
        onAnswer={ubahDraft}
        onSubmit={() => void submit()}
        submitState={sent ? 'sent' : submission}
        submitError={error}
        online={online}
        reveal={fase === 'REVEAL' ? room.reveal : null}
        remainingMs={remainingMs}
        sceneNonce={sceneNonce}
        sudahBriefing
        onSceneStatus={(s) => {
          // Info kesiapan untuk host saja: TIDAK menambah waktu siapa pun.
          if (s !== 'loading' && siapDilaporkan.current !== roundIndex) {
            siapDilaporkan.current = roundIndex;
            void actions.sceneReady(roundIndex);
          }
        }}
        panel={(bantu) => <PanelStatus mode={mode} mission={mission} bantu={bantu}
          submitted={room.submittedCount} total={room.playerCount}
          answer={answer} sent={sent} reveal={room.reveal} points={result?.roundScore ?? null} accuracy={result?.accuracy ?? null} answered={result?.answered ?? false} />}
      />
    </main>
  </PlayerShell>;
}

function PanelStatus({ mode, mission, bantu, submitted, total, answer, sent, reveal, points, accuracy, answered }: {
  mode: StageMode;
  mission: MissionPublic;
  bantu: PanelBantu;
  submitted: number;
  total: number;
  answer: import('@shared/types').MissionAnswer;
  sent: boolean;
  reveal: import('@shared/types').MissionReveal | null;
  points: number | null;
  accuracy: number | null;
  answered: boolean;
}) {
  const punyaDokumen = Boolean(mission.policyCards?.length || mission.tables?.length);
  if (mode === 'intro') {
    const raki = mission.id === 'tutorial' || !TOKOH.missRaksa.aktif;
    return <div className="status-panel">
      <span className="status-cap kuning"><Icon name="jam" size={16} /> Bersiap · baca dulu kasusnya</span>
      {/* Kasus dibawakan Miss Raksa (CS); tutorial tetap Raki karena teksnya "Aku Raki". */}
      {raki
        ? <div className="pemandu-kata"><Raki size={52} mood="sapa" /><p><b>Raki</b>{mission.rakiBriefing}</p></div>
        : <SapaanPemandu tokoh="missRaksa" teks={mission.rakiBriefing} ukuran={52} />}
      <h2>Kasusnya</h2>
      <p>{mission.story}</p>
      <p className="status-tugas"><b>Tugasmu:</b> {mission.instruction}</p>
      <CaraMain mission={mission} />
      {punyaDokumen ? <button type="button" className="tombol-dokumen" onClick={() => bantu.bukaDokumen()}><Icon name="polis" size={18} /> Lihat dokumen kasus</button> : null}
      <p className="status-caption">Gambar belum bisa disentuh. Waktu menjawab dimulai bersamaan untuk semua pemain.</p>
    </div>;
  }
  if (mode === 'paused') {
    return <div className="status-panel status-jeda" role="status">
      <Icon name="jam" size={22} />
      <div>
        <h2>Dijeda panitia. Istirahat sebentar.</h2>
        <p>Waktumu ikut berhenti, jadi tidak ada yang dirugikan. {sent ? 'Laporanmu sudah tercatat.' : 'Pilihanmu tetap tersimpan dan terkunci sampai dilanjutkan.'}</p>
      </div>
    </div>;
  }
  if (mode === 'sent') {
    return <div className="status-panel">
      <div className="status-konfirmasi">
        <span className="status-ikon" aria-hidden="true"><TandaIkon jenis="tepat" /></span>
        <div><h2>Laporanmu sudah terkirim.</h2><p>Server sudah mencatatnya. Pilihan dikunci sampai pembahasan.</p></div>
      </div>
      <ul className="ringkasan">{mission.steps.map(s => <li key={s.id}><b>{s.prompt}</b><span>{ringkas(s, answer[s.id])}</span></li>)}</ul>
      <p className="status-caption" aria-live="polite">{submitted} dari {total} pemain sudah mengirim. Pembahasan muncul setelah waktu habis.</p>
    </div>;
  }
  if (mode === 'locked') {
    return <div className="status-panel">
      <span className="status-cap merah"><Icon name="jam" size={16} /> Waktu habis</span>
      <h2>Waktu menjawab sudah selesai.</h2>
      <p>{sent ? 'Laporanmu sudah tercatat.' : 'Laporan yang belum dikirim tidak dinilai.'} Pembahasan segera muncul.</p>
      <div className="waiting-orbit" aria-hidden="true"><i /><i /><i /></div>
    </div>;
  }
  // Pembahasan: hasil & penjelasan jadi fokus; peringkat ditampilkan panitia sesudahnya.
  if (!reveal) return <div className="status-panel"><h2>Pembahasan segera muncul.</h2><div className="waiting-orbit" aria-hidden="true"><i /><i /><i /></div></div>;
  const dijawab = answered || sent;
  return <HasilMisi
    mission={mission}
    reveal={reveal}
    answer={dijawab ? answer : null}
    akurasi={accuracy ?? 0}
    dijawab={dijawab}
    poin={points}
    lihatAdegan={bantu.lihatAdegan}
    catatan={<>
      <SapaanPemandu tokoh="ceo" teks={kalimatKe(TOKOH.ceo.sapaan.pembahasan, mission.number - 1)} ukuran={40} className="pemandu-kecil" />
      <p className="status-caption">Peringkat segera ditampilkan panitia.</p>
    </>}
  />;
}
