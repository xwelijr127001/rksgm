import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { PlayerLook } from '@shared/types';
import { CharacterPicker } from '../components/CharacterPicker';
import { Arrow, PlayerShell } from '../components/PlayerShell';
import { Raki } from '../art/Raki';
import { actions, savedIdentity, savedLook, useGame } from '../state/store';
import { Pesan } from '../ui/kit';
const cleanCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
export default function Join() {
  const [params] = useSearchParams();
  const initial = cleanCode(params.get('room') ?? '');
  const nav = useNavigate();
  const { status } = useGame();
  const [step, setStep] = useState(initial.length === 4 ? 1 : 0);
  const [code, setCode] = useState(initial);
  const [nickname, setNickname] = useState(() => savedIdentity(initial)?.nickname ?? '');
  const [look, setLook] = useState<PlayerLook>(() => savedIdentity(initial)?.look ?? { ...savedLook(), body: 0, skin: 2, hair: 0, color: 0, accessory: 'jaket' });
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const previous = useMemo(() => code.length === 4 ? savedIdentity(code) : null, [code]);
  const connected = status === 'connected';
  async function join(rejoin = false) {
    setSending(true); setError(null);
    const result = rejoin ? await actions.rejoin(code) : await actions.join(code, nickname.trim(), look);
    setSending(false);
    if (result.ok) nav('/lobby');
    else setError(result.error ?? 'Belum berhasil masuk. Coba sekali lagi, ya.');
  }
  return <PlayerShell back="/" label="Gabung permainan"><main className="join-main">
    <div className="join-heading"><Raki size={86} mood="sapa" /><span className="eyebrow">{step === 0 ? 'LANGKAH 1 DARI 2' : 'TINGGAL SATU LANGKAH'}</span><h1>{step === 0 ? 'Punya kode main?' : 'Kenalan dulu, yuk.'}</h1><p>{step === 0 ? 'Lihat 4 karakter di layar acara.' : 'Isi nama dan pilih karakter favoritmu.'}</p></div>
    <form className="join-form" onSubmit={e => { e.preventDefault(); if (step === 0 && code.length === 4) setStep(1); else if (step === 1 && code.length === 4 && nickname.trim().length >= 2 && connected && !sending) void join(); }}>
      {step === 0 ? <div className="code-field"><label className="sr-only" htmlFor="kode-room">Kode permainan</label><input id="kode-room" className="kolom kolom-kode" value={code} maxLength={4} inputMode="text" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} placeholder="ABCD" onChange={e => { setCode(cleanCode(e.target.value)); setError(null); }} /></div> : <><div className="joined-code"><span>Kode permainan <b>{code}</b></span><button type="button" className="text-button" onClick={() => { setStep(0); setError(null); }}>Ubah</button></div><CharacterPicker nickname={nickname} look={look} onNickname={setNickname} onLook={setLook} />{nickname.trim().length === 1 ? <p className="field-error">Nama minimal 2 karakter, ya.</p> : null}</>}
      {previous ? <button type="button" className="resume-button" disabled={!connected || sending} onClick={() => void join(true)}>Lanjutkan sebagai {previous.nickname} <Arrow /></button> : null}
      {error ? <Pesan jenis="error"><div>{error}{/sudah dimulai/i.test(error) ? <Link className="quiet-link" to={'/projector?room=' + code}>Tonton permainan <Arrow /></Link> : null}</div></Pesan> : null}
      {!connected && step === 1 ? <p className="connection-note" role="status">Sedang menyambungkan. Pastikan Wi-Fi kamu aktif.</p> : null}
      <button className="primary-action" type="submit" disabled={step === 0 ? code.length !== 4 : nickname.trim().length < 2 || !connected || sending}>{sending ? 'Sebentar, ya…' : step === 0 ? 'Lanjut' : 'Ikut bermain'}{!sending ? <Arrow /> : null}</button>
      {step === 0 ? <Link className="quiet-link centered" to="/latihan?misi=1">Belum ada kode? Coba latihan</Link> : null}
    </form>
  </main></PlayerShell>;
}

