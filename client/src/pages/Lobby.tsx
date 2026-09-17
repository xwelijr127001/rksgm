import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PlayerLook } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { playSfx, setTrack } from '../audio/audio';
import { CharacterPicker } from '../components/CharacterPicker';
import { PlayerShell } from '../components/PlayerShell';
import { useOnChange } from '../hooks';
import { actions, savedLook, useGame } from '../state/store';
import { Memuat, Modal, Pesan } from '../ui/kit';
export default function Lobby() {
  const { room, identity, status } = useGame();
  const [modal, setModal] = useState(false);
  const [nick, setNick] = useState('');
  const [look, setLook] = useState<PlayerLook>(() => savedLook());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setTrack('lobby'); return () => setTrack(null); }, []);
  useOnChange(room?.playerCount ?? 0, (next, prev) => { if (prev !== undefined && next > prev) playSfx('masuk'); });
  if (!identity) return <PlayerShell back="/"><main className="result-focus"><h1>Gabung dulu, yuk.</h1><Link className="primary-action" to="/join">Masukkan kode permainan</Link></main></PlayerShell>;
  if (!room) return <PlayerShell><main className="result-focus"><Memuat teks="Menyiapkan ruang main…" /><Link className="quiet-link" to="/join">Coba gabung lagi</Link></main></PlayerShell>;
  const me = room.players.find(p => p.id === identity.playerId);
  const ready = me?.ready ?? false;
  const name = me?.nickname ?? identity.nickname;
  const myLook = me?.look ?? identity.look;
  const others = room.players.filter(p => p.id !== identity.playerId);
  async function save() {
    setSaving(true); setError(null);
    const ok = await actions.updateLook(nick.trim(), look);
    setSaving(false);
    if (ok) setModal(false); else setError('Belum berhasil disimpan. Coba lagi, ya.');
  }
  return <PlayerShell label={'Kode ' + room.code}>
    <main className="lobby-focus"><span className="eyebrow">{room.eventName}</span><div className="lobby-avatar"><Avatar look={myLook} size={135} mood={ready ? 'senang' : 'netral'} /></div><h1>Halo, {name}!</h1><p>{ready ? 'Kamu sudah siap. Tunggu aba-aba panitia.' : 'Sudah nyaman? Kita segera mulai.'}</p>
      <button className="primary-action" disabled={ready || status !== 'connected'} onClick={() => { playSfx('pilih'); void actions.setReady(true); }}>{ready ? '✓  Siap bermain' : 'Saya siap!'}</button>
      {status !== 'connected' ? <Pesan jenis="kuning">Koneksi terputus. Sedang menyambungkan kembali…</Pesan> : null}
      <div className="result-links"><button className="text-button" onClick={() => { setNick(name); setLook(myLook); setError(null); setModal(true); }}>Ganti karakter</button>{ready ? <button className="text-button" disabled={status !== 'connected'} onClick={() => void actions.setReady(false)}>Belum siap</button> : null}</div>
      <div className="lobby-roster"><p>{others.length ? others.length + ' teman sudah bergabung' : 'Teman-temanmu segera bergabung.'}</p><div className="lobby-peers">{others.slice(0, 10).map(p => <div key={p.id}><Avatar look={p.look} size={48} mood={p.ready ? 'senang' : 'netral'} /><span>{p.nickname}</span></div>)}</div>{others.length > 10 ? <p>dan {others.length - 10} pemain lainnya</p> : null}</div>
    </main>
    {modal ? <Modal judul="Karakter kamu" onTutup={() => setModal(false)} aksi={<><button className="text-button" onClick={() => setModal(false)}>Batal</button><button className="primary-action" disabled={nick.trim().length < 2 || saving || status !== 'connected'} onClick={() => void save()}>{saving ? 'Menyimpan…' : 'Simpan'}</button></>}><CharacterPicker nickname={nick} look={look} onNickname={setNick} onLook={setLook} />{error ? <Pesan jenis="error">{error}</Pesan> : null}</Modal> : null}
  </PlayerShell>;
}

