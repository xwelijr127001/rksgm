import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PlayerLook } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { playSfx, setTrack } from '../audio/audio';
import { CharacterPicker } from '../components/CharacterPicker';
import { PlayerShell } from '../components/PlayerShell';
import { prefetchAdegan } from '../game/prefetch';
import { KarakterTokoh, PotretTokoh, namaTokoh } from '../game/KarakterTokoh';
import { TOKOH } from '@shared/brand';
import { useOnChange } from '../hooks';
import { t, useBahasa } from '../i18n';
import { terjemahkanBawaan } from '../i18n/galat';
import { actions, savedLook, useGame } from '../state/store';
import { Memuat, Modal, Pesan } from '../ui/kit';
export default function Lobby() {
  useBahasa();
  const { room, identity, status } = useGame();
  const [modal, setModal] = useState(false);
  const [nick, setNick] = useState('');
  const [look, setLook] = useState<PlayerLook>(() => savedLook());
  const [saving, setSaving] = useState(false);
  // Kunci kamus pesan galat (bukan teksnya), supaya ikut berganti bahasa.
  const [error, setError] = useState<string | null>(null);
  // Unduh engine adegan selagi menunggu, supaya misi pertama langsung tampil.
  useEffect(() => { setTrack('lobby'); prefetchAdegan(); return () => setTrack(null); }, []);
  useOnChange(room?.playerCount ?? 0, (next, prev) => { if (prev !== undefined && next > prev) playSfx('masuk'); });
  if (!identity) return <PlayerShell back="/"><main className="result-focus"><h1>{t('pemain.gabungDulu')}</h1><Link className="primary-action" to="/join">{t('pemain.masukkanKode')}</Link></main></PlayerShell>;
  if (!room) return <PlayerShell><main className="result-focus"><Memuat teks={t('pemain.menyiapkanRuang')} /><Link className="quiet-link" to="/join">{t('pemain.cobaGabungLagi')}</Link></main></PlayerShell>;
  const me = room.players.find(p => p.id === identity.playerId);
  const ready = me?.ready ?? false;
  const name = me?.nickname ?? identity.nickname;
  const myLook = me?.look ?? identity.look;
  const others = room.players.filter(p => p.id !== identity.playerId);
  async function save() {
    setSaving(true); setError(null);
    const ok = await actions.updateLook(nick.trim(), look);
    setSaving(false);
    if (ok) setModal(false); else setError('pemain.galatSimpan');
  }
  return <PlayerShell label={t('pemain.labelKode', { kode: room.code })}>
    <main className="lobby-focus"><span className="eyebrow">{terjemahkanBawaan(room.eventName)}</span><div className="lobby-avatar"><Avatar look={myLook} size={135} mood={ready ? 'senang' : 'netral'} /></div><h1>{t('pemain.halo', { nama: name })}</h1><p>{ready ? t('pemain.sudahSiap') : t('pemain.sudahNyaman')}</p>
      <button className="primary-action" disabled={ready || status !== 'connected'} onClick={() => { playSfx('pilih'); void actions.setReady(true); }}>{ready ? '✓  ' + t('pemain.siapBermain') : t('pemain.sayaSiap')}</button>
      {status !== 'connected' ? <Pesan jenis="kuning"><span className="tokoh-putus"><PotretTokoh tokoh="isti" ukuran={44} /><span className="tokoh-putus-isi">{TOKOH.isti.aktif ? <b>{namaTokoh('isti')}</b> : null}{t('pemain.koneksiPutus')}</span></span></Pesan> : null}
      <div className="result-links"><button className="text-button" onClick={() => { setNick(name); setLook(myLook); setError(null); setModal(true); }}>{t('pemain.gantiKarakter')}</button>{ready ? <button className="text-button" disabled={status !== 'connected'} onClick={() => void actions.setReady(false)}>{t('pemain.belumSiap')}</button> : null}</div>
      <KarakterTokoh tokoh="ceo" className="lobby-ceo" tinggi={120} teks={t('tokoh.ceo.lobby')} />
      <div className="lobby-roster"><p>{others.length ? t(others.length === 1 ? 'pemain.temanBergabungSatu' : 'pemain.temanBergabung', { n: others.length }) : t('pemain.temanSegera')}</p><div className="lobby-peers">{others.slice(0, 10).map(p => <div key={p.id}><Avatar look={p.look} size={48} mood={p.ready ? 'senang' : 'netral'} /><span>{p.nickname}</span></div>)}</div>{others.length > 10 ? <p>{t('pemain.pemainLainnya', { n: others.length - 10 })}</p> : null}</div>
    </main>
    {modal ? <Modal judul={t('pemain.karakterKamu')} onTutup={() => setModal(false)} aksi={<><button className="text-button" onClick={() => setModal(false)}>{t('pemain.batal')}</button><button className="primary-action" disabled={nick.trim().length < 2 || saving || status !== 'connected'} onClick={() => void save()}>{saving ? t('pemain.menyimpan') : t('pemain.simpan')}</button></>}><CharacterPicker nickname={nick} look={look} onNickname={setNick} onLook={setLook} />{error ? <Pesan jenis="error">{t(error)}</Pesan> : null}</Modal> : null}
  </PlayerShell>;
}

