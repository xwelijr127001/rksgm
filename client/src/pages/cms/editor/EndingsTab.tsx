import { useId } from 'react';
import { ENDING_KINDS, TEXT_LIMITS, textKey, type EndingKind } from '@shared/story/content';
import { summaryLabelsOf } from '@shared/story/scene';
import { STORY_MAX_SESSION_SCORE } from '@shared/story/scorePolicy';
import { addEnding, clearEndingBounds, getText, isUnconditional, moveEnding, removeEnding, scaffoldEndings, updateEnding } from '../contentEdit';
import { ENDING_KIND_LABEL } from '@shared/story/protocol';
import { endingRuleLabel } from '../labels';
import { arrowTargets, focusAfterEdit } from './focus';
import { NumberField, TextField, issueAt, type EditorProps } from './fields';

/**
 * Endings (PRD FR-C5): chosen by the customer's final status and/or the total score (an empty bound is not checked),
 * first match in list order; the last ending must be unconditional so every participant reaches a resolution after
 * round 15. Bounds stay editable on every ending that has them (also a bounded LAST ending, which validation rejects),
 * so the editor can always repair the list: "Jadikan cadangan" clears them and endings can be reordered.
 */
export function EndingsTab({ ed }: { ed: EditorProps }) {
  const id = useId();
  const c = ed.content;
  const names = summaryLabelsOf(c, 'id');
  const customer = names.customerName.trim() || 'customer';
  // As in the room: the mentor's words are credited by the officer's name only with an officer character.
  const mentor = names.officerName?.trim() || null;
  // Keyboard focus after a move or a removal stays in the list (focus.ts): the moved arrow, else a neighbour's heading.
  const endingKey = (endingId: string) => `${id}-akhir-${endingId}`;
  const move = (ei: number, endingId: string, delta: -1 | 1) => {
    ed.update((x) => moveEnding(x, ei, delta));
    focusAfterEdit(arrowTargets(endingKey(endingId), delta));
  };
  const remove = (ei: number) => {
    const neighbours = [c.endings[ei + 1], c.endings[ei - 1]].flatMap((e) => (e ? [`${endingKey(e.id)}-judul`] : []));
    ed.update((x) => removeEnding(x, ei));
    focusAfterEdit([...neighbours, `${id}-tambah`]);
  };
  return (
    <div className="cms-tab-isi">
      <p className="stf-kecil">
        Akhir dipilih setelah babak 15 berdasarkan status akhir customer dan/atau total nilai peserta (maks. {STORY_MAX_SESSION_SCORE.toLocaleString('id-ID')}). Batas yang dikosongkan tidak diperiksa: kosongkan kedua batas nilai agar akhir dipilih <b>hanya berdasarkan status customer</b>. Urutan menentukan prioritas: akhir pertama yang syaratnya terpenuhi dipakai; akhir terakhir wajib tanpa syarat. Minimal satu “akhir bahagia” (happy ending penuh) dan satu “selesai dengan catatan”; “kurang puas” opsional.
      </p>
      {issueAt(ed.issues, 'endings') ? <p className="cms-isu-galat">{issueAt(ed.issues, 'endings')?.message}</p> : null}
      {c.endings.length === 0 && !ed.readOnly ? (
        <button type="button" className="btn" onClick={() => ed.update((x) => scaffoldEndings(x))}>
          Buat 3 akhir awal (bahagia, dengan catatan, cadangan)
        </button>
      ) : null}
      {c.endings.map((e, ei) => {
        const last = ei === c.endings.length - 1;
        const open = isUnconditional(e);
        const fallback = last && open;
        const f = (s: string) => `endings[${ei}].${s}`;
        const fallbackIssue = issueAt(ed.issues, `endings[${ei}]`);
        const customerWords = getText(c, ed.locale, textKey.endingCustomer(e.id)).trim() !== '';
        return (
          <section key={e.id} className="stf-kartu">
            <div className="stf-judul-baris">
              <h3 id={`${endingKey(e.id)}-judul`} tabIndex={-1}>
                Akhir {ei + 1} {fallback ? '(cadangan, tanpa syarat)' : ''}
              </h3>
              {!ed.readOnly ? (
                <div className="stf-tombol cms-tombol-rapat">
                  <button type="button" className="btn btn-netral btn-kecil" id={`${endingKey(e.id)}-naik`} aria-label={`Naikkan akhir ${ei + 1}`} disabled={ei === 0} onClick={() => move(ei, e.id, -1)}>
                    ↑
                  </button>
                  <button type="button" className="btn btn-netral btn-kecil" id={`${endingKey(e.id)}-turun`} aria-label={`Turunkan akhir ${ei + 1}`} disabled={last} onClick={() => move(ei, e.id, 1)}>
                    ↓
                  </button>
                  {c.endings.length > 1 ? (
                    <button type="button" className="btn btn-netral btn-kecil" aria-label={`Hapus akhir ${ei + 1}`} onClick={() => remove(ei)}>
                      Hapus
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {fallbackIssue ? (
              <div className="cms-isu-aksi">
                <p className="cms-isu-galat">{fallbackIssue.message}</p>
                {!ed.readOnly && last && !open ? (
                  <button type="button" className="btn btn-netral btn-kecil" onClick={() => ed.update((x) => clearEndingBounds(x, ei))}>
                    Jadikan cadangan (hapus syarat)
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="stf-isian">
              <label htmlFor={`${id}-k-${e.id}`}>Jenis akhir</label>
              <select id={`${id}-k-${e.id}`} className="kolom" value={e.kind} disabled={ed.readOnly} onChange={(ev) => ed.update((x) => updateEnding(x, ei, { kind: ev.target.value as EndingKind }))}>
                {ENDING_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {ENDING_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            {fallback ? (
              <p className="stf-kecil">Akhir cadangan berlaku untuk semua peserta yang tidak memenuhi syarat akhir di atasnya.</p>
            ) : (
              <>
                <div className="stf-grid">
                  <NumberField ed={ed} label="Status minimal (0–100)" field={f('moodMin')} value={e.minMood} min={0} max={100} nullable onChange={(v) => ed.update((x) => updateEnding(x, ei, { minMood: v }))} />
                  <NumberField ed={ed} label="Status maksimal" field={f('moodMax')} value={e.maxMood} min={0} max={100} nullable onChange={(v) => ed.update((x) => updateEnding(x, ei, { maxMood: v }))} />
                  <NumberField ed={ed} label="Nilai minimal" field={f('scoreMin')} value={e.minScore} min={0} max={STORY_MAX_SESSION_SCORE} step={100} nullable onChange={(v) => ed.update((x) => updateEnding(x, ei, { minScore: v }))} />
                  <NumberField ed={ed} label="Nilai maksimal" field={f('scoreMax')} value={e.maxScore} min={0} max={STORY_MAX_SESSION_SCORE} step={100} nullable onChange={(v) => ed.update((x) => updateEnding(x, ei, { maxScore: v }))} />
                </div>
                {issueAt(ed.issues, f('mood')) ? <p className="cms-isu-galat">{issueAt(ed.issues, f('mood'))?.message}</p> : null}
                {issueAt(ed.issues, f('score')) ? <p className="cms-isu-galat">{issueAt(ed.issues, f('score'))?.message}</p> : null}
                <p className="stf-kecil">Syarat: {endingRuleLabel(e)}.</p>
                {open ? <p className="cms-isu-peringatan">Tanpa syarat sebelum akhir terakhir: akhir sesudahnya tidak akan pernah terpilih.</p> : null}
              </>
            )}
            <TextField ed={ed} textKey={textKey.endingTitle(e.id)} field={f('title')} label="Judul akhir" limit={TEXT_LIMITS.endingTitle} />
            <TextField
              ed={ed}
              textKey={textKey.endingText(e.id)}
              field={f('text')}
              label={customerWords ? 'Teks akhir (resolusi klaim, opsional)' : 'Teks akhir (resolusi klaim) — wajib bila kata-kata customer kosong'}
              limit={TEXT_LIMITS.endingText}
              multiline
            />
            <TextField ed={ed} textKey={textKey.endingCustomer(e.id)} field={f('customer')} label={`Kata-kata ${customer} (opsional)`} limit={TEXT_LIMITS.endingText} multiline hint={`Tampil di ringkasan akhir dengan nama ${customer}.`} />
            <TextField
              ed={ed}
              textKey={textKey.endingMentor(e.id)}
              field={f('mentor')}
              label={`Kata-kata ${mentor ?? 'mentor'} (opsional)`}
              limit={TEXT_LIMITS.endingText}
              multiline
              hint={mentor ? `Tampil di ringkasan akhir dengan nama ${mentor}.` : 'Tampil di ringkasan akhir dengan sebutan “Mentor”: skenario ini belum memilih karakter petugas (tab Info & tokoh).'}
            />
          </section>
        );
      })}
      {!ed.readOnly && c.endings.length > 0 ? (
        <div className="stf-tombol">
          <button type="button" id={`${id}-tambah`} className="btn btn-netral btn-kecil" onClick={() => ed.update((x) => addEnding(x, 'happy'))}>
            + Akhir bahagia
          </button>
          <button type="button" className="btn btn-netral btn-kecil" onClick={() => ed.update((x) => addEnding(x, 'with_notes'))}>
            + Akhir dengan catatan
          </button>
          <button type="button" className="btn btn-netral btn-kecil" onClick={() => ed.update((x) => addEnding(x, 'unhappy'))}>
            + Akhir kurang puas
          </button>
        </div>
      ) : null}
    </div>
  );
}
