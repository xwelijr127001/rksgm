import { useId } from 'react';
import { ACCESSORIES, HAIR_COLORS, SKIN_TONES, UNIFORM_COLORS } from '@shared/brand';
import type { PlayerLook } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { playSfx } from '../audio/audio';
import { t, useBahasa } from '../i18n';
/** `name` = kunci kamus `pemain.<name>` (Si Sigap, Si Teliti, Si Tangguh, Si Ceria). */
const PRESETS: { name: string; look: PlayerLook }[] = [
  { name: 'presetSigap', look: { body: 0, skin: 2, hair: 0, color: 0, accessory: 'jaket' } },
  { name: 'presetTeliti', look: { body: 1, skin: 1, hair: 1, color: 4, accessory: 'headset' } },
  { name: 'presetTangguh', look: { body: 2, skin: 3, hair: 0, color: 0, accessory: 'helm' } },
  { name: 'presetCeria', look: { body: 1, skin: 2, hair: 2, color: 2, accessory: 'topi' } },
];
// Kunci kamus per indeks pilihan (urutan = urutan lama; indeks tetap menjadi nilainya).
const BADAN = ['badanRamping', 'badanSedang', 'badanTegap', 'badanKekar'];
const KULIT = ['kulitTerang', 'kulitCerah', 'kulitSawoMatang', 'kulitCokelat', 'kulitGelap'];
const RAMBUT = ['rambutHitam', 'rambutCokelatTua', 'rambutCokelat', 'rambutHitamPekat', 'rambutAbu'];
const SERAGAM = ['seragamHijau', 'seragamBiru', 'seragamMerah', 'seragamCokelat', 'seragamEmas', 'seragamUngu'];
const pilihan = (daftar: string[], i: number): string | number => (daftar[i] ? t('pemain.' + daftar[i]) : i + 1);
/** Label aksesori lewat kamus berdasarkan id; id yang belum ada di kamus memakai label bawaan. */
function labelAksesori(a: { id: string; label: string }): string {
  const kunci = 'pemain.aksesori.' + a.id;
  const teks = t(kunci);
  return teks === kunci ? a.label : teks;
}
export function CharacterPicker({ nickname, look, onNickname, onLook, showNickname = true }: { nickname: string; look: PlayerLook; onNickname: (v: string) => void; onLook: (v: PlayerLook) => void; showNickname?: boolean }) {
  useBahasa();
  const uid = useId();
  function change(next: PlayerLook) { playSfx('pilih'); onLook(next); }
  return <div className="character-picker stack">
    {showNickname ? <div><label className="label-kolom" htmlFor={uid + '-nama'}>{t('pemain.mauDipanggil')}</label><input id={uid + '-nama'} className="kolom" value={nickname} maxLength={16} autoComplete="nickname" placeholder={t('pemain.namaPanggilan')} onChange={e => onNickname(e.target.value)} /></div> : null}
    <fieldset className="avatar-presets"><legend>{t('pemain.pilihTeman')}</legend><div className="avatar-options">{PRESETS.map(p => {
      const selected = (Object.keys(p.look) as (keyof PlayerLook)[]).every(k => look[k] === p.look[k]);
      return <button key={p.name} type="button" className={'avatar-option ' + (selected ? 'selected' : '')} aria-pressed={selected} onClick={() => change(p.look)}><Avatar look={p.look} size={72} mood="senang" /><span>{t('pemain.' + p.name)}</span>{selected ? <i aria-hidden="true">✓</i> : null}</button>;
    })}</div></fieldset>
    <details className="simple-details custom-character"><summary>{t('pemain.aturSendiri')}</summary><div className="custom-character-body"><Avatar look={look} size={82} mood="senang" /><div className="custom-controls">
      <label>{t('pemain.penampilan')}<select value={look.body} onChange={e => change({ ...look, body: Number(e.target.value) })}>{BADAN.map((k, i) => <option key={k} value={i}>{t('pemain.' + k)}</option>)}</select></label>
      <label>{t('pemain.warnaKulit')}<select value={look.skin} onChange={e => change({ ...look, skin: Number(e.target.value) })}>{SKIN_TONES.map((v, i) => <option key={v} value={i}>{pilihan(KULIT, i)}</option>)}</select></label>
      <label>{t('pemain.rambut')}<select value={look.hair} onChange={e => change({ ...look, hair: Number(e.target.value) })}>{HAIR_COLORS.map((v, i) => <option key={v} value={i}>{pilihan(RAMBUT, i)}</option>)}</select></label>
      <label>{t('pemain.seragam')}<select value={look.color} onChange={e => change({ ...look, color: Number(e.target.value) })}>{UNIFORM_COLORS.map((v, i) => <option key={v} value={i}>{pilihan(SERAGAM, i)}</option>)}</select></label>
      <label>{t('pemain.aksesori')}<select value={look.accessory} onChange={e => change({ ...look, accessory: e.target.value as PlayerLook['accessory'] })}>{ACCESSORIES.map(a => <option key={a.id} value={a.id}>{labelAksesori(a)}</option>)}</select></label>
    </div></div></details>
  </div>;
}

