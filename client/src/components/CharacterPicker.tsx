import { useId } from 'react';
import { ACCESSORIES, HAIR_COLORS, SKIN_TONES, UNIFORM_COLORS } from '@shared/brand';
import type { PlayerLook } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { playSfx } from '../audio/audio';
const PRESETS: { name: string; look: PlayerLook }[] = [
  { name: 'Si Sigap', look: { body: 0, skin: 2, hair: 0, color: 0, accessory: 'jaket' } },
  { name: 'Si Teliti', look: { body: 1, skin: 1, hair: 1, color: 4, accessory: 'headset' } },
  { name: 'Si Tangguh', look: { body: 2, skin: 3, hair: 0, color: 0, accessory: 'helm' } },
  { name: 'Si Ceria', look: { body: 1, skin: 2, hair: 2, color: 2, accessory: 'topi' } },
];
export function CharacterPicker({ nickname, look, onNickname, onLook, showNickname = true }: { nickname: string; look: PlayerLook; onNickname: (v: string) => void; onLook: (v: PlayerLook) => void; showNickname?: boolean }) {
  const uid = useId();
  function change(next: PlayerLook) { playSfx('pilih'); onLook(next); }
  return <div className="character-picker stack">
    {showNickname ? <div><label className="label-kolom" htmlFor={uid + '-nama'}>Mau dipanggil siapa?</label><input id={uid + '-nama'} className="kolom" value={nickname} maxLength={16} autoComplete="nickname" placeholder="Nama panggilan kamu" onChange={e => onNickname(e.target.value)} /></div> : null}
    <fieldset className="avatar-presets"><legend>Pilih teman mainmu</legend><div className="avatar-options">{PRESETS.map(p => {
      const selected = (Object.keys(p.look) as (keyof PlayerLook)[]).every(k => look[k] === p.look[k]);
      return <button key={p.name} type="button" className={'avatar-option ' + (selected ? 'selected' : '')} aria-pressed={selected} onClick={() => change(p.look)}><Avatar look={p.look} size={72} mood={selected ? 'senang' : 'netral'} /><span>{p.name}</span>{selected ? <i aria-hidden="true">✓</i> : null}</button>;
    })}</div></fieldset>
    <details className="simple-details custom-character"><summary>Atau atur karakter sendiri</summary><div className="custom-character-body"><Avatar look={look} size={82} /><div className="custom-controls">
      <label>Penampilan<select value={look.body} onChange={e => change({ ...look, body: Number(e.target.value) })}>{['Ramping', 'Sedang', 'Tegap', 'Kekar'].map((v, i) => <option key={v} value={i}>{v}</option>)}</select></label>
      <label>Warna kulit<select value={look.skin} onChange={e => change({ ...look, skin: Number(e.target.value) })}>{SKIN_TONES.map((v, i) => <option key={v} value={i}>{['Terang', 'Cerah', 'Sawo matang', 'Cokelat', 'Gelap'][i] ?? i + 1}</option>)}</select></label>
      <label>Rambut<select value={look.hair} onChange={e => change({ ...look, hair: Number(e.target.value) })}>{HAIR_COLORS.map((v, i) => <option key={v} value={i}>{['Hitam', 'Cokelat tua', 'Cokelat', 'Hitam pekat', 'Abu-abu'][i] ?? i + 1}</option>)}</select></label>
      <label>Seragam<select value={look.color} onChange={e => change({ ...look, color: Number(e.target.value) })}>{UNIFORM_COLORS.map((v, i) => <option key={v} value={i}>{['Hijau', 'Biru', 'Merah', 'Cokelat', 'Emas', 'Ungu'][i] ?? i + 1}</option>)}</select></label>
      <label>Aksesori<select value={look.accessory} onChange={e => change({ ...look, accessory: e.target.value as PlayerLook['accessory'] })}>{ACCESSORIES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
    </div></div></details>
  </div>;
}

