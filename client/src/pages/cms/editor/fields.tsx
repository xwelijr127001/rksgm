/**
 * Form fields of the scenario editor. Text fields write `text[activeLocale][key]` (never logic objects); every field
 * shows its validation issue (same validator as publication) right under it, with a character counter.
 */
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SPEAKERS, textKey, type AssetKind, type ContentLocale, type DialogueLine, type ScenarioContent, type Speaker } from '@shared/story/content';
import type { AssetView } from '@shared/story/dto';
import { isMultilineKey, type ContentIssue } from '@shared/story/validate';
import { withBase } from '../../../story/base';
import { getText, parseSpeakerValue, setText, speakerValue } from '../contentEdit';
import { SPEAKER_LABEL, castOptionLabel } from '../labels';

export interface EditorProps {
  content: ScenarioContent;
  locale: ContentLocale;
  readOnly: boolean;
  issues: ContentIssue[];
  assets: AssetView[];
  /** Fetch the asset library again (after an upload in another tab). */
  reloadAssets: () => void;
  update: (fn: (c: ScenarioContent) => ScenarioContent) => void;
}

export function issueAt(issues: readonly ContentIssue[], field: string): ContentIssue | undefined {
  return issues.find((i) => i.field === field && i.severity === 'error') ?? issues.find((i) => i.field === field);
}

function IssueText({ issue, id }: { issue: ContentIssue | undefined; id: string }) {
  if (!issue) return null;
  return (
    <small id={id} className={issue.severity === 'error' ? 'cms-isu-galat' : 'cms-isu-peringatan'}>
      {issue.message}
    </small>
  );
}

/** Line breaks, tabs and other vertical whitespace: in a single-line text they become a space (as saving does). */
const LINE_BREAKS = /[\r\n\t\v\f]/g;

/**
 * Player-facing text bound to a text key in the active locale; shows the Indonesian source when translating.
 * `multiline` asks for a larger, wrapping box. Line breaks are kept only where the key allows them
 * (validate.isMultilineKey: synopsis, consequences, reasons, ending texts, document bodies); in every other text Enter
 * does nothing and pasted breaks become spaces, exactly as saving would, so the preview shows what players get.
 */
export function TextField({
  ed,
  textKey: key,
  field,
  label,
  limit,
  multiline = false,
  rows = 3,
  hint,
  placeholder,
}: {
  ed: EditorProps;
  textKey: string;
  field: string;
  /** Visible label; may carry visually hidden context (e.g. which evidence item a row belongs to). */
  label: ReactNode;
  limit: number;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  placeholder?: string;
}) {
  const id = useId();
  const value = getText(ed.content, ed.locale, key);
  const issue = issueAt(ed.issues, field);
  const source = ed.locale !== 'id' ? getText(ed.content, 'id', key) : '';
  const count = [...value].length;
  const breaks = isMultilineKey(key);
  const props = {
    id,
    className: 'kolom',
    value,
    placeholder,
    readOnly: ed.readOnly,
    'aria-invalid': issue?.severity === 'error' ? true : undefined,
    'aria-describedby': `${id}-isu ${id}-hitung${hint ? ` ${id}-petunjuk` : ''}`,
    onChange: (e: { target: { value: string } }) => {
      const v = breaks ? e.target.value : e.target.value.replace(LINE_BREAKS, ' ');
      ed.update((c) => setText(c, ed.locale, key, v));
    },
  };
  const singleLineBox = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.preventDefault();
  };
  return (
    <div className="stf-isian">
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea {...props} rows={rows} onKeyDown={breaks ? undefined : singleLineBox} /> : <input {...props} />}
      <div className="cms-isian-kaki">
        <IssueText issue={issue} id={`${id}-isu`} />
        <small id={`${id}-hitung`} className={count > limit ? 'cms-isu-galat' : 'cms-hitung'}>
          {count}/{limit}
        </small>
      </div>
      {source ? <small className="cms-sumber">Teks Indonesia: {source}</small> : null}
      {hint ? <small id={`${id}-petunjuk`}>{hint}</small> : null}
    </div>
  );
}

/**
 * Internal note for authors/reviewers (CMS only, never sent to rooms): one value for every language. Saving keeps at
 * most `limit` characters (shared sanitize), so the counter warns before anything is cut.
 */
export function NoteField({ ed, label, value, limit, onChange, hint, rows = 4 }: { ed: EditorProps; label: string; value: string; limit: number; onChange: (v: string) => void; hint?: string; rows?: number }) {
  const id = useId();
  // UTF-16 length, like the cut made when saving.
  const over = value.length > limit;
  return (
    <div className="stf-isian cms-catatan">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} className="kolom" rows={rows} value={value} readOnly={ed.readOnly} aria-describedby={`${id}-hitung${hint ? ` ${id}-petunjuk` : ''}`} onChange={(e) => onChange(e.target.value)} />
      <div className="cms-isian-kaki">
        <small id={`${id}-hitung`} className={over ? 'cms-isu-galat' : 'cms-hitung'}>
          {value.length}/{limit}
          {over ? ' — teks setelah batas ini terpotong saat disimpan' : ''}
        </small>
      </div>
      {hint ? <small id={`${id}-petunjuk`}>{hint}</small> : null}
    </div>
  );
}

/**
 * Number input. While focused it keeps what is being typed, so a partial entry such as "-" (on the way to "-12") is not
 * overwritten. An empty field means null only when `nullable` (e.g. "no bound"); otherwise the stored value is kept.
 */
export function NumberField({
  ed,
  label,
  value,
  field,
  min,
  max,
  step = 1,
  nullable = false,
  onChange,
  hint,
  inputId,
}: {
  ed: EditorProps;
  label: string;
  value: number | null;
  field: string;
  min: number;
  max: number;
  step?: number;
  nullable?: boolean;
  onChange: (v: number | null) => void;
  hint?: string;
  /** DOM id of the input (e.g. where focus goes after an edit); generated when absent. */
  inputId?: string;
}) {
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const issue = issueAt(ed.issues, field);
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="stf-isian">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="kolom"
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft ?? value ?? ''}
        readOnly={ed.readOnly}
        aria-invalid={issue?.severity === 'error' ? true : undefined}
        aria-describedby={`${id}-isu${hint ? ` ${id}-petunjuk` : ''}`}
        onChange={(e) => {
          const text = e.target.value;
          setDraft(text);
          if (text === '') {
            if (nullable) onChange(null);
          } else if (Number.isFinite(Number(text))) onChange(Number(text));
        }}
        onBlur={() => setDraft(null)}
      />
      <IssueText issue={issue} id={`${id}-isu`} />
      {hint ? <small id={`${id}-petunjuk`}>{hint}</small> : null}
    </div>
  );
}

/**
 * What an asset picker offers: library assets of the right kinds, without archived ones and, for `uploadedOnly`
 * pictures, without built-in pixel art (it has no image file: a field scene or an evidence picture needs one). The
 * current value always stays listed, so a stored choice that validation rejects remains visible until it is changed.
 */
export function assetChoices(assets: readonly AssetView[], kinds: readonly AssetKind[], value: string | null, uploadedOnly: boolean): AssetView[] {
  return assets.filter((a) => kinds.includes(a.kind) && (a.id === value || (!a.archived && !(uploadedOnly && a.builtin))));
}

/**
 * Asset picker (FR-A9): only library assets of the right kind; archived ones are marked and rejected by validation.
 * `uploadedOnly`: pictures the room loads from a file (field scene, evidence picture), so built-in backgrounds are not
 * offered; the hint links the asset library (new tab) and reloads the list after an upload.
 */
export function AssetSelect({
  ed,
  label,
  kind,
  value,
  field,
  allowNone = false,
  noneLabel = '— tidak ada —',
  uploadedOnly = false,
  onChange,
  hint,
}: {
  ed: EditorProps;
  label: string;
  kind: AssetKind | AssetKind[];
  value: string | null;
  field: string;
  allowNone?: boolean;
  /** Text of the empty choice when `allowNone` (e.g. "Tanpa gambar"). */
  noneLabel?: string;
  uploadedOnly?: boolean;
  onChange: (v: string | null) => void;
  hint?: string;
}) {
  const id = useId();
  const issue = issueAt(ed.issues, field);
  const kinds: AssetKind[] = Array.isArray(kind) ? kind : [kind];
  const options = assetChoices(ed.assets, kinds, value, uploadedOnly);
  const selected = ed.assets.find((a) => a.id === value);
  const noUpload = uploadedOnly && !options.some((a) => !a.builtin && !a.archived);
  const describedBy = [`${id}-isu`, hint ? `${id}-petunjuk` : '', uploadedOnly ? `${id}-unggahan` : ''].filter(Boolean).join(' ');
  return (
    <div className="stf-isian">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="kolom" value={value ?? ''} disabled={ed.readOnly} aria-invalid={issue?.severity === 'error' ? true : undefined} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value || null)}>
        {allowNone || !value ? <option value="">{allowNone ? noneLabel : '— pilih —'}</option> : null}
        {value && !selected ? <option value={value}>{value} [tidak ada di pustaka]</option> : null}
        {options.map((a) => (
          <option key={a.id} value={a.id}>
            {a.title}
            {a.builtin ? (uploadedOnly ? ' (bawaan, tanpa berkas gambar)' : ' (bawaan)') : ''}
            {a.archived ? ' [diarsipkan]' : ''}
          </option>
        ))}
      </select>
      <IssueText issue={issue} id={`${id}-isu`} />
      {selected && !selected.builtin && selected.url && (selected.kind === 'background' || selected.kind === 'photo' || selected.kind === 'character') ? <img className="cms-pratinjau-aset" src={withBase(selected.url)} alt={`Pratinjau ${selected.title}`} /> : null}
      {hint ? <small id={`${id}-petunjuk`}>{hint}</small> : null}
      {uploadedOnly ? (
        <small id={`${id}-unggahan`}>
          {noUpload ? 'Belum ada gambar hasil unggahan. ' : 'Hanya gambar hasil unggahan; latar bawaan tidak punya berkas gambar. '}
          {ed.readOnly ? null : (
            <>
              Unggah di{' '}
              <Link to="/cms/aset" target="_blank" rel="noopener">
                Pustaka aset (tab baru)
              </Link>
              , lalu{' '}
              <button type="button" className="cms-tautan cms-tautan-kecil" onClick={ed.reloadAssets}>
                muat ulang daftar
              </button>
              .
            </>
          )}
        </small>
      ) : null}
    </div>
  );
}

/** Display name of a cast member for editor labels (active locale, Indonesian fallback). */
export function castNameOf(ed: EditorProps, castId: string): string {
  return getText(ed.content, ed.locale, textKey.castName(castId)) || getText(ed.content, 'id', textKey.castName(castId));
}

/** Speaker choices: narration, customer, officer (with their names when set) and every cast member by name. */
export function speakerOptions(ed: EditorProps): { value: string; label: string }[] {
  const named = (s: Speaker, nameKey: string) => {
    const name = getText(ed.content, 'id', nameKey).trim();
    return name ? `${SPEAKER_LABEL[s]}: ${name}` : SPEAKER_LABEL[s];
  };
  return [
    ...SPEAKERS.filter((s) => s !== 'cast').map((s) => ({
      value: s,
      label: s === 'customer' ? named(s, textKey.customerName()) : s === 'officer' ? named(s, textKey.officerName()) : SPEAKER_LABEL[s],
    })),
    ...ed.content.cast.map((m) => ({ value: speakerValue({ speaker: 'cast', castId: m.id }), label: castOptionLabel(castNameOf(ed, m.id), m.id) })),
  ];
}

/**
 * Who speaks a line (visually hidden label; the line's text field right below is labelled "Baris N"). A cast line whose
 * member is missing keeps showing its stored value until reassigned; the caller shows the validation message (LineIssues).
 * `selectId`: DOM id of the select (where focus goes after a neighbouring line is removed); generated when absent.
 */
export function SpeakerSelect({
  ed,
  label,
  line,
  field,
  onChange,
  selectId,
}: {
  ed: EditorProps;
  label: string;
  line: Pick<DialogueLine, 'speaker' | 'castId'>;
  field: string;
  onChange: (speaker: Speaker, castId: string | null) => void;
  selectId?: string;
}) {
  const generatedId = useId();
  const id = selectId ?? generatedId;
  const issue = issueAt(ed.issues, `${field}.castId`);
  const options = speakerOptions(ed);
  const value = speakerValue(line);
  const known = options.some((o) => o.value === value);
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="kolom"
        value={value}
        disabled={ed.readOnly}
        aria-invalid={issue?.severity === 'error' ? true : undefined}
        onChange={(e) => {
          const next = parseSpeakerValue(e.target.value);
          onChange(next.speaker, next.castId);
        }}
      >
        {!known ? <option value={value}>{line.castId ? `${SPEAKER_LABEL.cast} (${line.castId}, tidak ada)` : `${SPEAKER_LABEL.cast} (belum dipilih)`}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  );
}

/** Validation messages about a line's structure (missing cast member, unknown flag, flag on an opening line, bad ID). */
export function LineIssues({ ed, field }: { ed: EditorProps; field: string }) {
  const found = ['castId', 'ifFlag', 'id'].map((s) => issueAt(ed.issues, `${field}.${s}`)).filter((i): i is ContentIssue => Boolean(i));
  if (!found.length) return null;
  return (
    <>
      {found.map((i) => (
        <small key={i.field} className={`cms-baris-isu ${i.severity === 'error' ? 'cms-isu-galat' : 'cms-isu-peringatan'}`}>
          {i.message}
        </small>
      ))}
    </>
  );
}

/** "+ Narasi / + Customer / + Petugas / + <tokoh>" buttons that append a line spoken by that speaker. */
export function SpeakerButtons({ ed, onAdd }: { ed: EditorProps; onAdd: (speaker: Speaker, castId: string | null) => void }) {
  return (
    <div className="stf-tombol">
      {speakerOptions(ed).map((o) => {
        const s = parseSpeakerValue(o.value);
        return (
          <button key={o.value} type="button" className="btn btn-netral btn-kecil" onClick={() => onAdd(s.speaker, s.castId)}>
            + {s.speaker === 'cast' ? castNameOf(ed, s.castId ?? '') || o.label : SPEAKER_LABEL[s.speaker]}
          </button>
        );
      })}
    </div>
  );
}
