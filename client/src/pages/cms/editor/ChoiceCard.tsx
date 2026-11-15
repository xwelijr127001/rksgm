/**
 * One of the five choices of a round: what the participant reads (and whether it is an action without a message), the
 * committee key (classification, weight), the status change, the consequence and reasons, the respondent's reply, and
 * an optional flag for later rounds.
 */
import { useId } from 'react';
import { CLASSIFICATIONS, MOOD_DELTA_LIMIT, TEXT_LIMITS, contentText, textKey, type Classification } from '@shared/story/content';
import { AUTHORING_HINTS, wordCount } from '@shared/story/audit';
import { updateChoice } from '../contentEdit';
import { CLASSIFICATION_LABEL } from '../labels';
import { ChoiceFlagField } from './FlagField';
import { NumberField, TextField, issueAt, type EditorProps } from './fields';

/** Accuracy that goes with a classification: 1 / 0, or the current partial weight (0.5 when it was not partial). */
function accuracyFor(cls: Classification, current: number): number {
  if (cls === 'tepat') return 1;
  if (cls === 'keliru') return 0;
  return current > 0 && current < 1 ? current : 0.5;
}

export function ChoiceCard({
  ed,
  roundIndex,
  choiceIndex,
  mentorWord,
  mentorReason,
  respondentName,
}: {
  ed: EditorProps;
  roundIndex: number;
  choiceIndex: number;
  /** How the final summary credits the round reason ("Miss Raksa", or "mentor" without an officer character). */
  mentorWord: string;
  /** The round's mentor reason is filled (choice reasons become optional). */
  mentorReason: boolean;
  /** Who replies after the decision; null = nobody chosen yet. */
  respondentName: string | null;
}) {
  const id = useId();
  const r = ed.content.rounds[roundIndex];
  const ch = r?.choices[choiceIndex];
  if (!r || !ch) return null;
  const f = (s: string) => `rounds[${roundIndex}].choices[${choiceIndex}].${s}`;
  const words = wordCount(contentText(ed.content, ed.locale, textKey.choiceText(r.id, ch.id)));
  const classIssue = issueAt(ed.issues, f('classification'));
  // E.g. choice_form_hint: no action option of the scenario is tepat, so its confirm label can point at wrong answers.
  const formIssue = issueAt(ed.issues, f('form'));
  return (
    <li className={`cms-pilihan-item cms-pilihan-${ch.classification}`}>
      <div className="stf-judul-baris">
        <b>
          Pilihan {choiceIndex + 1} <span className="stf-kecil mono">({ch.id})</span>
        </b>
        {ch.setsFlag ? <span className="cms-tanda">tanda {ch.setsFlag}</span> : null}
      </div>
      <TextField
        ed={ed}
        textKey={textKey.choiceText(r.id, ch.id)}
        field={f('text')}
        label="Teks pilihan (yang dibaca peserta)"
        limit={TEXT_LIMITS.choiceText}
        multiline
        rows={2}
        hint={`${words} kata — usahakan 8–16, paling banyak ${AUTHORING_HINTS.choiceWordsMax}. Panjang, bentuk, dan tingkat detail kelima pilihan sebanding.`}
      />
      <label className="stf-centang">
        <input
          type="checkbox"
          checked={ch.form === 'action'}
          disabled={ed.readOnly}
          aria-describedby={`${id}-bentuk${formIssue ? ` ${id}-bentuk-isu` : ''}`}
          onChange={(e) => ed.update((x) => updateChoice(x, roundIndex, choiceIndex, { form: e.target.checked ? 'action' : 'message' }))}
        />
        <span>Tindakan, bukan pesan</span>
      </label>
      <small id={`${id}-bentuk`} className="stf-kecil cms-centang-bantu">
        Centang bila pilihan ini sebuah tindakan tanpa pesan, mis. tidak membalas dulu atau menutup berkas; tulis teksnya tanpa tanda kurung. Kartu pilihannya tampil sama seperti pilihan lain. Di babak chat, begitu pilihan ini dipilih, tombol konfirmasi menjadi “Tetapkan tindakan”, dan sesudah dikirim pilihan ini tampil sebagai catatan “Kamu: …” (“Ditetapkan”), bukan gelembung pesan. Tidak memengaruhi kunci, nilai, atau status.
      </small>
      {formIssue ? (
        <small id={`${id}-bentuk-isu`} className={`cms-centang-bantu ${formIssue.severity === 'error' ? 'cms-isu-galat' : 'cms-isu-peringatan'}`}>
          {formIssue.message}
        </small>
      ) : null}
      <div className="stf-grid">
        <div className="stf-isian">
          <label htmlFor={`${id}-kl`}>Klasifikasi</label>
          <select
            id={`${id}-kl`}
            className="kolom"
            value={ch.classification}
            disabled={ed.readOnly}
            onChange={(e) => {
              const cls = e.target.value as Classification;
              ed.update((x) => updateChoice(x, roundIndex, choiceIndex, { classification: cls, accuracy: accuracyFor(cls, ch.accuracy) }));
            }}
          >
            {CLASSIFICATIONS.map((k) => (
              <option key={k} value={k}>
                {CLASSIFICATION_LABEL[k]}
              </option>
            ))}
          </select>
          {classIssue ? <small className="cms-isu-galat">{classIssue.message}</small> : null}
        </div>
        <NumberField ed={ed} label="Bobot ketepatan (0–1)" field={f('accuracy')} value={ch.accuracy} min={0} max={1} step={0.05} onChange={(v) => ed.update((x) => updateChoice(x, roundIndex, choiceIndex, { accuracy: v ?? 0 }))} />
        <NumberField
          ed={ed}
          label={`Perubahan status customer (−${MOOD_DELTA_LIMIT}…+${MOOD_DELTA_LIMIT})`}
          field={f('moodDelta')}
          value={ch.moodDelta}
          min={-MOOD_DELTA_LIMIT}
          max={MOOD_DELTA_LIMIT}
          onChange={(v) => ed.update((x) => updateChoice(x, roundIndex, choiceIndex, { moodDelta: v ?? 0 }))}
        />
      </div>
      <TextField ed={ed} textKey={textKey.choiceConsequence(r.id, ch.id)} field={f('consequence')} label="Konsekuensi (yang terjadi setelah memilih)" limit={TEXT_LIMITS.consequence} multiline />
      <TextField
        ed={ed}
        textKey={textKey.choiceReason(r.id, ch.id)}
        field={f('reason')}
        label={mentorReason ? `Alasan/penjelasan pilihan (opsional — alasan dari ${mentorWord} sudah diisi)` : 'Alasan/penjelasan (dari komite)'}
        limit={TEXT_LIMITS.reason}
        multiline
      />
      <TextField
        ed={ed}
        textKey={textKey.choiceReply(r.id, ch.id)}
        field={f('reply')}
        label={respondentName ? `Balasan ${respondentName} sesudah pilihan ini (opsional)` : 'Balasan sesudah pilihan ini (opsional)'}
        limit={TEXT_LIMITS.reply}
        multiline
        rows={2}
        hint={
          respondentName
            ? 'Tampil setelah semua jawaban ditutup, hanya kepada peserta yang memilihnya.'
            : 'Pilih dulu “Yang membalas sesudah keputusan” di atas, supaya jelas siapa yang mengucapkannya.'
        }
      />
      <ChoiceFlagField ed={ed} roundIndex={roundIndex} choiceIndex={choiceIndex} />
    </li>
  );
}
