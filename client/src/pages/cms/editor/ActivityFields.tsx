/**
 * The round's activity (one main activity per screen: chat, desk of documents, field scene, or the classic stage) and
 * who reacts after the decision. Both are content fields, so the room picks its layout from them (no per-round code).
 */
import { useId } from 'react';
import type { RoundLayout } from '@shared/story/content';
import { parseSpeakerValue, respondentValue, setRespondent, updateRound } from '../contentEdit';
import { LAYOUT_HELP, LAYOUT_LABEL } from '../labels';
import { issueAt, speakerOptions, type EditorProps } from './fields';

/** The three activity patterns first, the classic stage (demo scenarios) last. */
const LAYOUT_ORDER: readonly RoundLayout[] = ['chat', 'dossier', 'field', 'stage'];

export function LayoutPicker({ ed, index }: { ed: EditorProps; index: number }) {
  const name = useId();
  const r = ed.content.rounds[index];
  if (!r) return null;
  return (
    <fieldset className="cms-kegiatan">
      <legend>Kegiatan babak</legend>
      <p className="stf-kecil">Satu kegiatan utama per layar; navigasi, pilihan, dan tombol keputusan sama di semua kegiatan.</p>
      <div className="cms-kegiatan-pilih">
        {LAYOUT_ORDER.map((layout) => (
          <label key={layout} className={`stf-opsi${r.layout === layout ? ' terpilih' : ''}`}>
            <input type="radio" name={name} value={layout} checked={r.layout === layout} disabled={ed.readOnly} onChange={() => ed.update((x) => updateRound(x, index, (y) => ({ ...y, layout })))} />
            <span>
              <b>{LAYOUT_LABEL[layout]}</b>
              <small>{LAYOUT_HELP[layout]}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Who replies after the decision (reply bubble in chat, a quote on the desk/field); narration only = nobody. */
export function RespondentSelect({ ed, index }: { ed: EditorProps; index: number }) {
  const id = useId();
  const r = ed.content.rounds[index];
  if (!r) return null;
  const f = `rounds[${index}].respondent`;
  const issue = issueAt(ed.issues, `${f}.castId`) ?? issueAt(ed.issues, f);
  const options = speakerOptions(ed).map((o) => (o.value === 'narrator' ? { ...o, label: 'Tidak ada (hanya catatan hasil)' } : o));
  const value = respondentValue(r.respondent);
  const known = options.some((o) => o.value === value);
  return (
    <div className="stf-isian">
      <label htmlFor={id}>Yang membalas sesudah keputusan</label>
      <select
        id={id}
        className="kolom"
        value={value}
        disabled={ed.readOnly}
        aria-invalid={issue?.severity === 'error' ? true : undefined}
        aria-describedby={`${id}-isu ${id}-petunjuk`}
        onChange={(e) => {
          const next = parseSpeakerValue(e.target.value);
          ed.update((x) => setRespondent(x, index, next.speaker, next.castId));
        }}
      >
        {!known ? <option value={value}>{r.respondent?.castId ? `Tokoh ${r.respondent.castId} (tidak ada)` : 'Tokoh pendukung (belum dipilih)'}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {issue ? (
        <small id={`${id}-isu`} className={issue.severity === 'error' ? 'cms-isu-galat' : 'cms-isu-peringatan'}>
          {issue.message}
        </small>
      ) : null}
      <small id={`${id}-petunjuk`}>Balasannya ditulis per pilihan dan untuk waktu habis; tampil setelah semua jawaban ditutup.</small>
    </div>
  );
}
