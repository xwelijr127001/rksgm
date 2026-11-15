/**
 * "Tinggalkan tanda": the flag a choice leaves for later rounds, and the flag's name. The ID is committed on blur or
 * Enter (not per keystroke), so a rename carries the flag's delayed effects, conditional lines and name along in ONE
 * edit (contentEdit.renameFlag) without passing through intermediate IDs that could merge with another flag. Clearing
 * a flag that later rounds react to asks first and lists exactly what is removed with it (contentEdit.clearFlag).
 */
import { useId, useState } from 'react';
import { TEXT_LIMITS, contentText, textKey, type ScenarioContent } from '@shared/story/content';
import { Modal } from '../../../ui/kit';
import { signedNumber } from '../../../story/view';
import { clearFlag, flagLeftElsewhere, flagReactions, flagUsesAfter, normalizeFlagId, renameFlag, type FlagReactions } from '../contentEdit';
import { TextField, issueAt, type EditorProps } from './fields';

/** The name of a flag (how reminders and the final summary call it), shared by every place that lists the flag. */
export function FlagLabelField({ ed, flag, label = 'Nama tanda (opsional)' }: { ed: EditorProps; flag: string; label?: string }) {
  return (
    <TextField
      ed={ed}
      textKey={textKey.flagLabel(flag)}
      field={`text.flagLabel.${flag}`}
      label={label}
      limit={TEXT_LIMITS.flagLabel}
      placeholder="mis. janji yang tidak realistis"
      hint="Dipakai di pengingat pribadi pemegang tanda dan di ringkasan akhir. Kosong = sebutan umum."
    />
  );
}

/**
 * What goes with a flag nobody can hold any more, as list items for a confirmation: every delayed effect, every
 * conditional line (with its text) and the flag's name.
 */
export function FlagReactionItems({ content, flag, reactions }: { content: ScenarioContent; flag: string; reactions: FlagReactions }) {
  const name = contentText(content, 'id', textKey.flagLabel(flag));
  return (
    <>
      {reactions.effects.map((e) => (
        <li key={`e${e.roundIndex}-${e.effectIndex}`}>
          Efek tertunda di babak {e.roundIndex + 1}: status {signedNumber(e.moodDelta)}
        </li>
      ))}
      {reactions.lines.map((l) => {
        const round = content.rounds[l.roundIndex];
        const text = round ? contentText(content, 'id', textKey.line(round.id, l.lineId)) : '';
        return (
          <li key={`l${l.roundIndex}-${l.lineId}`}>
            Baris khusus di babak {l.roundIndex + 1} (baris {l.lineIndex + 1}){text ? `: “${text}”` : ''}
          </li>
        );
      })}
      {name ? <li>Nama tanda {flag}: “{name}”</li> : null}
    </>
  );
}

export function ChoiceFlagField({ ed, roundIndex, choiceIndex }: { ed: EditorProps; roundIndex: number; choiceIndex: number }) {
  const id = useId();
  /** What the author is typing (normalized), until it is committed; null = showing the stored flag. */
  const [draft, setDraft] = useState<string | null>(null);
  const [pendingClear, setPendingClear] = useState<{ flag: string; reactions: FlagReactions } | null>(null);
  const c = ed.content;
  const flag = c.rounds[roundIndex]?.choices[choiceIndex]?.setsFlag ?? null;
  const field = `rounds[${roundIndex}].choices[${choiceIndex}].setsFlag`;
  const issue = issueAt(ed.issues, field);
  const uses = flag ? flagUsesAfter(c, roundIndex, flag) : [];

  const commit = () => {
    if (draft === null) return;
    const next = draft;
    setDraft(null);
    if (next === (flag ?? '')) return;
    if (next) {
      ed.update((x) => renameFlag(x, roundIndex, choiceIndex, next));
      return;
    }
    const reactions = flag ? flagReactions(c, flag) : null;
    const orphans = flag && reactions && !flagLeftElsewhere(c, roundIndex, choiceIndex, flag) && reactions.effects.length + reactions.lines.length > 0;
    if (orphans) setPendingClear({ flag, reactions });
    else ed.update((x) => clearFlag(x, roundIndex, choiceIndex));
  };

  return (
    <>
      <div className="stf-isian">
        <label htmlFor={id}>Tinggalkan tanda (opsional)</label>
        <input
          id={id}
          className="kolom mono"
          value={draft ?? flag ?? ''}
          placeholder="mis. janji_kirim"
          maxLength={40}
          readOnly={ed.readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-invalid={issue?.severity === 'error' ? true : undefined}
          aria-describedby={`${id}-isu ${id}-petunjuk`}
          onChange={(e) => setDraft(normalizeFlagId(e.target.value))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            else if (e.key === 'Escape' && draft !== null) {
              e.preventDefault();
              setDraft(null);
            }
          }}
        />
        {issue ? (
          <small id={`${id}-isu`} className={issue.severity === 'error' ? 'cms-isu-galat' : 'cms-isu-peringatan'}>
            {issue.message}
          </small>
        ) : null}
        <small id={`${id}-petunjuk`}>
          {draft !== null
            ? 'Tekan Enter atau pindah kolom untuk menyimpan. Mengganti ID ikut memindahkan efek tertunda, baris khusus, dan nama tanda.'
            : flag
              ? uses.length
                ? `Dipakai di babak ${uses.map((u) => u + 1).join(', ')} (efek tertunda atau baris khusus).`
                : 'Belum dipakai: tambahkan efek tertunda atau baris khusus di babak sesudahnya.'
              : 'Isi bila pilihan ini berdampak di babak sesudahnya (mis. janji yang tidak realistis): huruf kecil, angka, _ atau -.'}
        </small>
      </div>
      {flag ? <FlagLabelField ed={ed} flag={flag} label={`Nama tanda ${flag} (opsional)`} /> : null}
      {pendingClear ? (
        <ClearFlagDialog
          ed={ed}
          flag={pendingClear.flag}
          reactions={pendingClear.reactions}
          onCancel={() => setPendingClear(null)}
          onConfirm={() => {
            setPendingClear(null);
            ed.update((x) => clearFlag(x, roundIndex, choiceIndex));
          }}
        />
      ) : null}
    </>
  );
}

/** Confirmation before a flag's reactions are removed with it: names every effect, line and the flag's name. */
function ClearFlagDialog({ ed, flag, reactions, onCancel, onConfirm }: { ed: EditorProps; flag: string; reactions: FlagReactions; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal
      judul={`Hapus tanda ${flag}?`}
      onTutup={onCancel}
      aksi={
        <>
          <button type="button" className="btn btn-netral" onClick={onCancel}>
            Batal
          </button>
          <button type="button" className="btn btn-bahaya" onClick={onConfirm}>
            Hapus tanda dan reaksinya
          </button>
        </>
      }
    >
      <p>Tidak ada pilihan lain yang meninggalkan tanda ini, jadi semua yang bereaksi padanya ikut dihapus (dari semua bahasa):</p>
      <ul className="cms-daftar-hapus">
        <FlagReactionItems content={ed.content} flag={flag} reactions={reactions} />
      </ul>
      <p className="stf-kecil">Revisi draf yang sudah tersimpan tetap ada di riwayat.</p>
    </Modal>
  );
}
