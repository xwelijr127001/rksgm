import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MISSIONS } from '@shared/missions';
import type { Badge } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { Icon } from '../art/Icon';
import { playSfx, setTrack } from '../audio/audio';
import { PlayerShell, Arrow } from '../components/PlayerShell';
import { useReducedMotion } from '../hooks';
import { bahasaKini, misiDalamBahasa, t, useBahasa } from '../i18n';
import { terjemahkanBawaan } from '../i18n/galat';
import { useGame } from '../state/store';
import { Confetti, Leaderboard } from '../ui/kit';
import { KarakterTokoh } from '../game/KarakterTokoh';

/**
 * Nama/keterangan lencana dalam bahasa aktif, dicocokkan lewat id lencana. Bahasa Indonesia
 * (dan lencana yang belum ada di kamus) memakai teks kiriman server apa adanya.
 */
function teksLencana(b: Badge, bagian: 'nama' | 'ket'): string {
  const asli = bagian === 'nama' ? b.label : b.desc;
  if (bahasaKini() === 'id') return asli;
  const kunci = `pemain.lencana.${b.id}.${bagian}`;
  const teks = t(kunci);
  return teks === kunci ? asli : teks;
}

export default function Result() {
  const { bahasa } = useBahasa();
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
  if (!room || !me || !identity) return <PlayerShell back="/"><main className="result-focus"><h1>{t('pemain.hasilMenunggu')}</h1><p>{t('pemain.gabungKembaliKet')}</p><Link className="primary-action" to="/join">{t('pemain.gabungKembali')} <Arrow /></Link></main></PlayerShell>;
  const podium = (room.podium ?? []).filter(row => row.rank <= 3);
  const accuracy = me.rounds.length ? Math.round(me.totalAccuracy / me.rounds.length * 100) : 0;
  // Judul & pelajaran misi dalam bahasa aktif (id misi tidak berubah).
  const misiRonde = (i: number) => { const m = MISSIONS[i]; return m ? misiDalamBahasa(m, bahasa) : undefined; };
  return <PlayerShell label={t('pemain.labelHasil')}>
    {celebrate ? <Confetti jumlah={36} /> : null}
    <main className="final-main">
      <section className="final-personal"><div className="lobby-avatar"><Avatar look={me.look} size={130} mood="senang" /></div><span className="eyebrow">{room.tie ? t('pemain.hasilSementara') : t('pemain.permainanSelesai')}</span><h1>{me.rank === 1 ? t('pemain.kamuAndalan') : t('pemain.hebat', { nama: me.nickname })}</h1><p>{t('pemain.terimaKasih')}</p><div className="final-numbers"><div><strong>#{me.rank}</strong><span>{t('pemain.dariPemain', { n: room.playerCount })}</span></div><div><strong>{me.totalPoints.toLocaleString('id-ID')}</strong><span>{t('pemain.totalPoin')}</span></div></div>{room.tie ? <p className="status-caption">{t('pemain.masihSeri')}</p> : null}
        <Link className="primary-action" to="/">{t('pemain.sampaiMainLagi')} <Arrow /></Link>
      </section>
      <section className="final-podium"><span className="eyebrow">{t('pemain.paraAndalan')}</span><h2>{t('pemain.selamatPemenang')}</h2><KarakterTokoh tokoh="ceo" className="hasil-ceo" tinggi={130} teks={t('tokoh.ceo.podium')} /><div className="podium-cards">{podium.map(row => <article key={row.playerId} className={'podium-person rank-' + row.rank}><div className="podium-rank"><Icon name="medali" size={21} /><span>{t('pemain.juara' + row.rank)}{row.tied ? t('pemain.seri') : ''}</span></div><Avatar look={row.look} size={78} mood="senang" /><strong>{row.nickname}</strong><span>{t('pemain.nPoin', { n: row.totalPoints.toLocaleString('id-ID') })}</span><p>{terjemahkanBawaan(row.rank === 1 ? room.prizes.first : row.rank === 2 ? room.prizes.second : room.prizes.third)}</p></article>)}</div>
        <details className="simple-details"><summary>{t('pemain.lihatSemuaPeringkat')}</summary><Leaderboard rows={room.podium ?? []} highlightId={identity.playerId} /></details>
        <details className="simple-details answer-review"><summary>{t('pemain.catatanPermainan')}</summary><p>{t('pemain.catatanRingkas', { persen: accuracy, detik: (me.totalTimeMs / 1000).toFixed(1) })}</p>{me.badges.map(b => <p key={b.id}><Icon name={b.icon} size={18} /> <strong>{teksLencana(b, 'nama')}</strong> — {teksLencana(b, 'ket')}</p>)}{me.rounds.map(r => <div key={r.roundIndex}><strong>{misiRonde(r.roundIndex)?.title ?? t('pemain.rondeTambahan')}</strong><p>{t('pemain.rondeRingkas', { poin: r.roundScore.toLocaleString('id-ID'), persen: Math.round(r.accuracy * 100) })}</p><p className="lembut">{misiRonde(r.roundIndex)?.learning}</p></div>)}</details>
      </section>
    </main>
  </PlayerShell>;
}

