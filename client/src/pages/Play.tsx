import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MissionPublic, Phase } from '@shared/types';
import { Icon } from '../art/Icon';
import { Raki } from '../art/Raki';
import { playSfx, setTrack } from '../audio/audio';
import { PlayerShell } from '../components/PlayerShell';
import { TOKOH } from '@shared/brand';
import { PotretTokoh, SapaanPemandu, namaTokoh } from '../game/KarakterTokoh';
import { HasilMisi, MissionPlay, TandaIkon, ringkas, sela, type PanelBantu, type SubmitState } from '../game/MissionPlay';
import { prefetchAdegan } from '../game/prefetch';
import type { StageMode } from '../game/types';
import { useRoundDraft } from '../game/useRoundDraft';
import { useCountdown } from '../hooks';
import { misiDalamBahasa, revealDalamBahasa, t, useBahasa } from '../i18n';
import { terjemahkanGalat } from '../i18n/galat';
import { actions, useGame } from '../state/store';
import { Leaderboard, Memuat, Timer } from '../ui/kit';

/** Fase ronde yang memakai layar misi (adegan tetap terpasang sepanjang fase ini). */
const FASE_MISI: Phase[] = ['BRIEFING', 'ACTIVE', 'REVEAL'];

export default function Play() {
  const { bahasa } = useBahasa();
  const { room, me, identity, status, kicked, sceneNonce } = useGame();
  const phase = room?.phase ?? null;
  const fase = phase === 'PAUSED' ? room?.prevPhase ?? null : phase;
  const roundIndex = room?.roundIndex ?? -1;
  const misiAsli = room?.mission ?? null;
  // Yang DITAMPILKAN = misi & pembahasan dalam bahasa aktif. Id misi/langkah/opsi tidak berubah,
  // jadi draft, kiriman jawaban, dan skor tidak terpengaruh bahasa.
  const mission = useMemo(() => (misiAsli ? misiDalamBahasa(misiAsli, bahasa) : null), [misiAsli, bahasa]);
  const revealAsli = room?.reveal ?? null;
  const reveal = useMemo(() => (revealAsli ? revealDalamBahasa(revealAsli, mission, bahasa) : null), [revealAsli, mission, bahasa]);
  const code = identity?.code ?? room?.code ?? null;
  const [draft, ubahDraft, hapusDraft] = useRoundDraft(code, roundIndex, misiAsli);
  const [submission, setSubmission] = useState<SubmitState>('idle');
  /** Pesan galat MENTAH dari server ('' = tanpa pesan); diterjemahkan saat render supaya ikut bahasa aktif. */
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
    else { setSubmission('failed'); setError(response.error ?? ''); }
  }

  if (kicked) return <PlayerShell back="/"><main className="result-focus"><Raki size={120} mood="berpikir" /><h1>{t('misi.keluarJudul')}</h1><p>{t('misi.keluarTeks')}</p><Link className="primary-action" to="/join">{t('misi.gabungLagi')}</Link></main></PlayerShell>;
  if (!room || !identity) return <PlayerShell back="/"><main className="result-focus">{status === 'connecting' ? <Memuat teks={t('misi.menyambungkan')} /> : <><Raki size={120} /><h1>{t('misi.ikutMain')}</h1><Link className="primary-action" to="/join">{t('misi.masukkanKode')}</Link></>}</main></PlayerShell>;

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
  const label = phase === 'ACTIVE' || phase === 'BRIEFING' ? <Timer endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} /> : t('misi.misiKe', { n: mission?.number ?? roundIndex + 1 });
  const spandukJeda = dijeda && mode !== 'paused' ? <div className="koneksi-putus spanduk-jeda" role="status"><Icon name="jam" size={18} /> {t('misi.spandukJeda')}</div> : null;
  const putus = !online ? <div className="koneksi-putus" role="status"><PotretTokoh tokoh="isti" ukuran={40} /><i className="adegan-spinner" aria-hidden="true" /><span className="tokoh-putus-isi">{TOKOH.isti.aktif ? <b>{namaTokoh('isti')}</b> : null}{t('misi.koneksiPutus')}</span></div> : null;
  // Galat kirim: pesan server dicocokkan ke kamus `server`; tanpa pesan = kalimat bawaan.
  const galatKirim = error === null ? null : error ? terjemahkanGalat(error) : t('misi.galatKirim');

  if (phase === 'LEADERBOARD' || (phase === 'PAUSED' && fase === 'LEADERBOARD')) {
    return <PlayerShell label={label}>{putus}<main className="briefing-main"><span className="eyebrow">{phase === 'PAUSED' ? t('misi.eyebrowJeda') : t('misi.eyebrowSeru')}</span><h1>{t('misi.siapaTerdepan')}</h1><Leaderboard rows={room.leaderboard ?? []} highlightId={identity.playerId} limit={5} />{mine && mine.rank > 5 ? <p className="status-caption">{t('misi.posisimu', { peringkat: mine.rank, poin: mine.totalPoints.toLocaleString('id-ID') })}</p> : null}<p className="status-caption">{t('misi.misiBerikutnya')}</p></main></PlayerShell>;
  }
  if (!mission || !fase || !FASE_MISI.includes(fase)) {
    return <PlayerShell label={label}>{putus}<main className="result-focus"><Memuat teks={t('misi.menyiapkanMisi')} /></main></PlayerShell>;
  }

  return <PlayerShell label={label} className="kompak">
    {putus}{spandukJeda}
    <main className="misi-main">
      <div className="misi-judul"><div><span className="eyebrow">{t('misi.eyebrowMisi', { n: String(mission.number).padStart(2, '0'), total: room.totalRounds, produk: mission.productLabel.split(' - ')[0] ?? '' })}</span><h1>{mission.title}</h1></div></div>
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
        submitError={galatKirim}
        online={online}
        reveal={fase === 'REVEAL' ? reveal : null}
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
          answer={answer} sent={sent} reveal={reveal} points={result?.roundScore ?? null} accuracy={result?.accuracy ?? null} answered={result?.answered ?? false} />}
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
  useBahasa();
  const punyaDokumen = Boolean(mission.policyCards?.length || mission.tables?.length);
  if (mode === 'intro') {
    // Gambar di atas; di sini cukup kasusnya (dibawakan Miss Raksa) dan satu kalimat tugas.
    const raki = mission.id === 'tutorial' || !TOKOH.missRaksa.aktif;
    return <div className="status-panel">
      {raki
        ? <div className="pemandu-kata"><Raki size={48} mood="sapa" /><p><b>Raki</b>{mission.story}</p></div>
        : <SapaanPemandu tokoh="missRaksa" label={TOKOH.missRaksa.nama ?? undefined} teks={mission.story} ukuran={48} />}
      <div className="status-tugas"><span className="status-label">{t('misi.tugasmu')}</span><h2>{mission.instruction}</h2></div>
      {punyaDokumen ? <button type="button" className="tombol-dokumen" onClick={() => bantu.bukaDokumen()}><Icon name="polis" size={18} /> {t('misi.lihatDokumen')}</button> : null}
    </div>;
  }
  if (mode === 'paused') {
    return <div className="status-panel status-jeda" role="status">
      <Icon name="jam" size={22} />
      <div>
        <h2>{t('misi.jedaJudul')}</h2>
        <p>{t('misi.jedaTeks')}{sela()}{sent ? t('misi.laporanTercatat') : t('misi.pilihanTerkunci')}</p>
      </div>
    </div>;
  }
  if (mode === 'sent') {
    return <div className="status-panel">
      <div className="status-kepala">
        <span className="status-ikon" aria-hidden="true"><TandaIkon jenis="tepat" /></span>
        <div><h2>{t('misi.terkirim')}</h2><p>{t('misi.tungguWaktu')}</p></div>
      </div>
      <p className="status-caption" aria-live="polite">{t('misi.sudahMengirim', { n: submitted, total })}</p>
      <details className="lipat"><summary>{t('misi.lihatJawabanku')}</summary>
        <ul className="ringkasan">{mission.steps.map(s => <li key={s.id}><b>{s.prompt}</b><span>{ringkas(s, answer[s.id])}</span></li>)}</ul>
      </details>
    </div>;
  }
  if (mode === 'locked') {
    return <div className="status-panel">
      <div className="status-kepala">
        <span className="status-ikon status-ikon-jam" aria-hidden="true"><Icon name="jam" size={26} /></span>
        <div><h2>{t('misi.waktuHabis')}</h2><p>{sent ? t('misi.laporanTercatat') : t('misi.laporanTidakTerkirim')}</p></div>
      </div>
      <p className="status-caption">{t('misi.pembahasanSebentar')}</p>
    </div>;
  }
  // Pembahasan: hasil & penjelasan jadi fokus; peringkat ditampilkan panitia sesudahnya.
  if (!reveal) return <div className="status-panel"><h2>{t('misi.pembahasanSebentar')}</h2></div>;
  const dijawab = answered || sent;
  // Hanya tampil ±14 detik dan layar proyektor memuat pembahasan lengkap: di HP cukup yang sekali lirik.
  return <HasilMisi
    mission={mission}
    reveal={reveal}
    answer={dijawab ? answer : null}
    akurasi={accuracy ?? 0}
    dijawab={dijawab}
    poin={points}
    padat
    catatan={<p className="status-caption">{t('misi.peringkatSebentar')}</p>}
  />;
}
