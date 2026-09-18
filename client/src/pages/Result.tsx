import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MISSIONS } from '@shared/missions';
import { Avatar } from '../art/Avatar';
import { Icon } from '../art/Icon';
import { playSfx, setTrack } from '../audio/audio';
import { PlayerShell, Arrow } from '../components/PlayerShell';
import { useReducedMotion } from '../hooks';
import { useGame } from '../state/store';
import { Confetti, Leaderboard } from '../ui/kit';
import { KarakterTokoh } from '../game/KarakterTokoh';
import { TOKOH } from '@shared/brand';

export default function Result() {
  const { room, me, identity } = useGame();
  const reduced = useReducedMotion();
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => { setTrack('podium'); return () => setTrack(null); }, []);
  useEffect(() => {
    playSfx('confetti');
    if (reduced) return;
    setCelebrate(true);
    const id = window.setTimeout(() => setCelebrate(false), 3500);
    return () => window.clearTimeout(id);
  }, [reduced]);
  if (!room || !me || !identity) return <PlayerShell back="/"><main className="result-focus"><h1>Hasilmu menunggu.</h1><p>Gabung kembali dengan kode permainan untuk melihat hasil.</p><Link className="primary-action" to="/join">Gabung kembali <Arrow /></Link></main></PlayerShell>;
  const podium = (room.podium ?? []).filter(row => row.rank <= 3);
  const accuracy = me.rounds.length ? Math.round(me.totalAccuracy / me.rounds.length * 100) : 0;
  return <PlayerShell label="Hasil permainan">
    {celebrate ? <Confetti jumlah={36} /> : null}
    <main className="final-main">
      <section className="final-personal"><div className="lobby-avatar"><Avatar look={me.look} size={130} mood="senang" /></div><span className="eyebrow">{room.tie ? 'HASIL SEMENTARA · SKOR SERI' : 'PERMAINAN SELESAI'}</span><h1>{me.rank === 1 ? 'Kamu andalannya!' : 'Hebat, ' + me.nickname + '!'}</h1><p>Terima kasih sudah bermain bersama Raksa.</p><div className="final-numbers"><div><strong>#{me.rank}</strong><span>dari {room.playerCount} pemain</span></div><div><strong>{me.totalPoints.toLocaleString('id-ID')}</strong><span>total poin</span></div></div>{room.tie ? <p className="status-caption">Peringkat teratas masih seri. Tunggu arahan panitia, ya.</p> : null}
        <Link className="primary-action" to="/">Sampai main lagi! <Arrow /></Link>
      </section>
      <section className="final-podium"><span className="eyebrow">PARA ANDALAN HARI INI</span><h2>Selamat untuk pemenang!</h2><KarakterTokoh tokoh="ceo" className="hasil-ceo" tinggi={130} teks={TOKOH.ceo.sapaan.podium} /><div className="podium-cards">{podium.map(row => <article key={row.playerId} className={'podium-person rank-' + row.rank}><div className="podium-rank"><Icon name="medali" size={21} /><span>Juara {row.rank}{row.tied ? ' (seri)' : ''}</span></div><Avatar look={row.look} size={78} mood="senang" /><strong>{row.nickname}</strong><span>{row.totalPoints.toLocaleString('id-ID')} poin</span><p>{row.rank === 1 ? room.prizes.first : row.rank === 2 ? room.prizes.second : room.prizes.third}</p></article>)}</div>
        <details className="simple-details"><summary>Lihat semua peringkat</summary><Leaderboard rows={room.podium ?? []} highlightId={identity.playerId} /></details>
        <details className="simple-details answer-review"><summary>Catatan permainanmu</summary><p>{accuracy}% jawaban tepat · {(me.totalTimeMs / 1000).toFixed(1)} detik total waktu menjawab</p>{me.badges.map(b => <p key={b.id}><Icon name={b.icon} size={18} /> <strong>{b.label}</strong> — {b.desc}</p>)}{me.rounds.map(r => <div key={r.roundIndex}><strong>{MISSIONS[r.roundIndex]?.title ?? 'Ronde tambahan'}</strong><p>{r.roundScore.toLocaleString('id-ID')} poin · {Math.round(r.accuracy * 100)}% tepat</p><p className="lembut">{MISSIONS[r.roundIndex]?.learning}</p></div>)}</details>
      </section>
    </main>
  </PlayerShell>;
}

