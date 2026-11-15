/**
 * Delayed consequences of a round: mood changes applied when the round begins, only for participants who earlier
 * chose a choice leaving a flag, plus the flag's name their private reminder shows (FlagLabelField).
 */
import { useId } from 'react';
import { MAX_FLAG_EFFECTS, MOOD_DELTA_LIMIT, contentText, textKey } from '@shared/story/content';
import { addFlagEffect, removeFlagEffect, updateFlagEffect, type FlagSource } from '../contentEdit';
import { flagSourceLabel } from '../labels';
import { FlagLabelField } from './FlagField';
import { focusAfterEdit } from './focus';
import { NumberField, issueAt, type EditorProps } from './fields';

export function DelayedEffects({ ed, index, earlier }: { ed: EditorProps; index: number; earlier: FlagSource[] }) {
  const id = useId();
  const r = ed.content.rounds[index];
  if (!r) return null;
  const f = (s: string) => `rounds[${index}].${s}`;
  const used = new Set(r.flagEffects.map((e) => e.flag));
  const canAdd = r.flagEffects.length < MAX_FLAG_EFFECTS && earlier.some((s) => !used.has(s.flag));
  const listIssue = issueAt(ed.issues, f('flagEffects'));
  const nameOf = (flag: string) => contentText(ed.content, 'id', textKey.flagLabel(flag));
  // Effects are numbered by position: after a removal the next one takes this number, else the previous one is focused.
  const remove = (ei: number) => {
    ed.update((x) => removeFlagEffect(x, index, ei));
    focusAfterEdit([`${id}-ef-${ei}`, `${id}-ef-${ei - 1}`, `${id}-tambah`, `${id}-judul`]);
  };
  return (
    <section className="stf-kartu">
      <h3 id={`${id}-judul`} tabIndex={-1}>
        Efek tertunda
      </h3>
      <p className="stf-kecil">
        Perubahan status customer saat babak ini dimulai, hanya bagi peserta yang di babak sebelumnya memilih pilihan bertanda (mis. janji yang tidak bisa ditepati). Mereka juga melihat pengingat pribadi dengan nama tanda. Tanda dibuat lewat “Tinggalkan tanda” pada pilihan; baris dialog khusus bagi mereka dibuat lewat “Hanya untuk peserta yang memilih …” di baris dialog. Maks. {MAX_FLAG_EFFECTS} efek.
      </p>
      {listIssue ? <p className="cms-isu-galat">{listIssue.message}</p> : null}
      {earlier.length === 0 && r.flagEffects.length === 0 ? <p className="stf-lembut">Belum ada pilihan di babak sebelumnya yang meninggalkan tanda.</p> : null}
      {r.flagEffects.length ? (
        <ol className="cms-efek-daftar">
          {r.flagEffects.map((e, ei) => {
            const known = earlier.some((s) => s.flag === e.flag);
            const flagIssue = issueAt(ed.issues, f(`flagEffects[${ei}].flag`));
            return (
              <li key={ei} className="cms-efek">
                <div className="stf-isian">
                  <label htmlFor={`${id}-ef-${ei}`}>Efek {ei + 1}: bagi peserta yang memilih</label>
                  <select
                    id={`${id}-ef-${ei}`}
                    className="kolom"
                    value={e.flag}
                    disabled={ed.readOnly}
                    aria-invalid={flagIssue?.severity === 'error' ? true : undefined}
                    aria-describedby={`${id}-ef-${ei}-isu`}
                    onChange={(ev) => ed.update((x) => updateFlagEffect(x, index, ei, { flag: ev.target.value }))}
                  >
                    {!known ? <option value={e.flag}>{e.flag ? `tanda ${e.flag} (tidak ditinggalkan babak sebelumnya)` : '— pilih —'}</option> : null}
                    {earlier.map((s) => (
                      <option key={s.flag} value={s.flag} disabled={s.flag !== e.flag && used.has(s.flag)}>
                        {flagSourceLabel(s, nameOf(s.flag))}
                      </option>
                    ))}
                  </select>
                  {flagIssue ? (
                    <small id={`${id}-ef-${ei}-isu`} className={flagIssue.severity === 'error' ? 'cms-isu-galat' : 'cms-isu-peringatan'}>
                      {flagIssue.message}
                    </small>
                  ) : null}
                </div>
                <NumberField
                  ed={ed}
                  label={`Perubahan status (−${MOOD_DELTA_LIMIT}…+${MOOD_DELTA_LIMIT})`}
                  field={f(`flagEffects[${ei}].moodDelta`)}
                  value={e.moodDelta}
                  min={-MOOD_DELTA_LIMIT}
                  max={MOOD_DELTA_LIMIT}
                  onChange={(v) => ed.update((x) => updateFlagEffect(x, index, ei, { moodDelta: v ?? 0 }))}
                />
                {!ed.readOnly ? (
                  <button type="button" className="btn btn-netral btn-kecil" aria-label={`Hapus efek tertunda ${ei + 1}`} onClick={() => remove(ei)}>
                    Hapus
                  </button>
                ) : null}
                {known ? (
                  <div className="cms-efek-nama">
                    <FlagLabelField ed={ed} flag={e.flag} label={`Nama tanda ${e.flag} di pengingat (opsional)`} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}
      {!ed.readOnly && earlier.length ? (
        <div className="stf-tombol">
          <button type="button" id={`${id}-tambah`} className="btn btn-netral btn-kecil" disabled={!canAdd} onClick={() => ed.update((x) => addFlagEffect(x, index))}>
            + Efek tertunda
          </button>
        </div>
      ) : null}
    </section>
  );
}
