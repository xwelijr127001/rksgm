import { useId, useMemo, useState } from 'react';
import { auditOptions } from '@shared/story/audit';
import { MOOD_BANDS, MOOD_DELTA_LIMIT, STORY_ROUND_COUNT, TEXT_LIMITS, contentText, textKey, type ScenarioContent } from '@shared/story/content';
import { respondentOf, scenarioMoodLabels, summaryLabelsOf } from '@shared/story/scene';
import { t } from '../../../i18n';
import { DEFAULT_ACTION_KEY } from '../../../story/round/roundModel';
import { Modal } from '../../../ui/kit';
import {
  addLine,
  addRound,
  flagReactions,
  flagsOnlyIn,
  flagsSetBefore,
  getText,
  moveLine,
  moveRound,
  removeLine,
  removeRound,
  roundsWithIssues,
  scaffoldRounds,
  updateLine,
  updateRound,
  type FlagSource,
} from '../contentEdit';
import { LAYOUT_TAG, SPEAKER_LABEL, flagSourceLabel, moodBandLabel } from '../labels';
import { LayoutPicker, RespondentSelect } from './ActivityFields';
import { ChoiceCard } from './ChoiceCard';
import { DelayedEffects } from './DelayedEffects';
import { EvidenceSection } from './EvidenceEditor';
import { FlagReactionItems } from './FlagField';
import { RoundAuditPanel } from './OptionAudit';
import { arrowTargets, focusAfterEdit } from './focus';
import { AssetSelect, LineIssues, NoteField, NumberField, SpeakerButtons, SpeakerSelect, TextField, issueAt, type EditorProps } from './fields';

const MAX_LINES = 10;

/** The 15 ordered rounds (PRD FR-A3–A6): list with issue badges + editor of the selected round. */
export function RoundsTab({ ed, selected, onSelect }: { ed: EditorProps; selected: number; onSelect: (i: number) => void }) {
  const tabId = useId();
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const c = ed.content;
  const perRound = roundsWithIssues(ed.issues);
  const audit = useMemo(() => auditOptions(c, ed.locale), [c, ed.locale]);
  const index = Math.min(selected, Math.max(0, c.rounds.length - 1));
  /** DOM id of a round editor's heading (focus after the round shown changes under the keyboard). */
  const headingId = (roundId: string) => `${tabId}-${roundId}-judul`;
  const arrowKey = `${tabId}-babak`;
  return (
    <div className="cms-babak">
      <nav className="cms-babak-daftar" aria-label="Daftar babak">
        <p className="stf-kecil">
          {c.rounds.length}/{STORY_ROUND_COUNT} babak. Semua peserta memainkan babak yang sama berurutan; tiap pilihan kembali ke babak berikutnya.
        </p>
        {c.rounds.length ? (
          <p className="stf-kecil cms-audit-ringkas">
            Tebakan buta: terpanjang {audit.longest.tepatBest}/{c.rounds.length} tepat · terpendek {audit.shortest.tepatBest}/{c.rounds.length} (rinciannya di tab Validasi).
          </p>
        ) : null}
        <ol>
          {c.rounds.map((r, i) => {
            const n = perRound.get(i + 1);
            const title = getText(c, 'id', textKey.roundTitle(r.id)) || 'Tanpa judul';
            return (
              <li key={r.id}>
                <button type="button" className={i === index ? 'aktif' : ''} aria-current={i === index ? 'true' : undefined} onClick={() => onSelect(i)}>
                  <span className="cms-babak-no">{i + 1}</span>
                  <span className="cms-babak-judul">{title}</span>
                  {r.keyRound ? <span className="cms-babak-tanda">kunci</span> : null}
                  {LAYOUT_TAG[r.layout] ? <span className="cms-babak-tanda">{LAYOUT_TAG[r.layout]}</span> : null}
                  {n?.errors ? <span className="cms-babak-isu galat">{n.errors} galat</span> : n?.warnings ? <span className="cms-babak-isu">{n.warnings} cek</span> : <span className="cms-babak-isu ok">✓</span>}
                </button>
              </li>
            );
          })}
        </ol>
        {!ed.readOnly && c.rounds.length < STORY_ROUND_COUNT ? (
          <div className="stf-tombol">
            <button type="button" className="btn btn-kecil" onClick={() => ed.update((x) => scaffoldRounds(x))}>
              Buat kerangka {STORY_ROUND_COUNT} babak
            </button>
            <button type="button" className="btn btn-netral btn-kecil" onClick={() => ed.update((x) => addRound(x))}>
              + Satu babak
            </button>
          </div>
        ) : null}
      </nav>
      <div className="cms-babak-editor">
        {c.rounds.length === 0 ? (
          <p className="stf-lembut">Belum ada babak. Tekan “Buat kerangka {STORY_ROUND_COUNT} babak” untuk memulai; setiap babak berisi 5 pilihan yang harus ditulis dan dinilai.</p>
        ) : (
          <RoundEditor
            // Local editing state (a flag being typed, the spot map's chosen item) belongs to one round.
            key={c.rounds[index]?.id}
            ed={ed}
            index={index}
            headingId={headingId(c.rounds[index]?.id ?? '')}
            arrowKey={arrowKey}
            onMove={(d) => {
              ed.update((x) => moveRound(x, index, d));
              onSelect(index + d);
              focusAfterEdit(arrowTargets(arrowKey, d));
            }}
            onRemove={() => setConfirmRemove(index)}
          />
        )}
      </div>
      {confirmRemove !== null ? (
        <RemoveRoundDialog
          content={c}
          index={confirmRemove}
          // Cancelled: back to "Hapus babak". Removed: to the heading of the round now shown in its place.
          returnFocus={() => {
            const removed = c.rounds[confirmRemove];
            const shown = c.rounds[confirmRemove - 1] ?? c.rounds[confirmRemove + 1];
            return removed && !document.getElementById(headingId(removed.id)) && shown ? document.getElementById(headingId(shown.id)) : null;
          }}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => {
            const i = confirmRemove;
            setConfirmRemove(null);
            ed.update((x) => removeRound(x, i));
            onSelect(Math.max(0, i - 1));
          }}
        />
      ) : null}
    </div>
  );
}

/** Confirmation before a round goes: its texts, and every flag only it leaves together with what reacts to that flag. */
function RemoveRoundDialog({
  content,
  index,
  returnFocus,
  onCancel,
  onConfirm,
}: {
  content: ScenarioContent;
  index: number;
  returnFocus: () => HTMLElement | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const orphans = flagsOnlyIn(content, index).map((flag) => {
    const all = flagReactions(content, flag);
    // Reactions inside the removed round go with it anyway.
    return { flag, reactions: { effects: all.effects.filter((e) => e.roundIndex !== index), lines: all.lines.filter((l) => l.roundIndex !== index) } };
  });
  return (
    <Modal
      judul={`Hapus babak ${index + 1}?`}
      onTutup={onCancel}
      kembaliKe={returnFocus}
      aksi={
        <>
          <button type="button" className="btn btn-netral" onClick={onCancel}>
            Batal
          </button>
          <button type="button" className="btn btn-bahaya" onClick={onConfirm}>
            Ya, hapus
          </button>
        </>
      }
    >
      <p>Babak beserta semua teksnya (semua bahasa) dihapus dari draf. Revisi draf sebelumnya tetap tersimpan di riwayat.</p>
      {orphans.length ? (
        <>
          <p>Tanda yang hanya ditinggalkan pilihan babak ini tidak bisa dipegang peserta lagi, jadi ikut dihapus bersama semua yang bereaksi padanya:</p>
          <ul className="cms-daftar-hapus">
            {orphans.map(({ flag, reactions }) => (
              <li key={flag}>
                Tanda {flag}
                <ul>
                  <FlagReactionItems content={content} flag={flag} reactions={reactions} />
                </ul>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Modal>
  );
}

function RoundEditor({
  ed,
  index,
  headingId,
  arrowKey,
  onMove,
  onRemove,
}: {
  ed: EditorProps;
  index: number;
  headingId: string;
  /** DOM id prefix of the round's ↑/↓ buttons (focus stays on them when the round moves). */
  arrowKey: string;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const c = ed.content;
  const r = c.rounds[index];
  if (!r) return null;
  const n = index + 1;
  const f = (s: string) => `rounds[${index}].${s}`;
  // A line's speaker select is its first control: where focus goes after a neighbouring line is removed.
  const lineKey = (lineId: string) => `${id}-baris-${lineId}`;
  const moveLineAt = (li: number, lineId: string, delta: -1 | 1) => {
    ed.update((x) => moveLine(x, index, li, delta));
    focusAfterEdit(arrowTargets(lineKey(lineId), delta));
  };
  const removeLineAt = (li: number) => {
    const neighbours = [r.lines[li + 1], r.lines[li - 1]].flatMap((l) => (l ? [lineKey(l.id)] : []));
    ed.update((x) => removeLine(x, index, li));
    focusAfterEdit([...neighbours, `${id}-dialog`]);
  };
  const roundIssues = ed.issues.filter((i) => i.round === n);
  const setRound = (patch: Partial<typeof r>) => ed.update((x) => updateRound(x, index, (y) => ({ ...y, ...patch })));
  const earlier = flagsSetBefore(c, index);
  const words = scenarioMoodLabels(c, 'id');
  // The final summary credits the round reason by the officer's name only when the scenario has an officer character
  // (scene.summaryLabelsOf, as in the room); otherwise it says "mentor".
  const mentorWord = summaryLabelsOf(c, 'id').officerName ?? 'mentor';
  // Per language, like validation: the round's mentor reason makes the choice reasons optional.
  const mentorReason = getText(c, ed.locale, textKey.roundReason(r.id)).trim() !== '';
  const respondent = respondentOf(c, index, 'id');
  const respondentName = respondent ? respondent.name ?? SPEAKER_LABEL[respondent.speaker] : null;
  // The room's own label for this activity (roundModel.actionLabelOf falls back to it when the round sets none).
  const defaultAction = t(DEFAULT_ACTION_KEY[r.layout]);
  return (
    <div className="cms-babak-isi">
      <div className="stf-judul-baris">
        <h2 id={headingId} tabIndex={-1}>
          Babak {n}
        </h2>
        {!ed.readOnly ? (
          <div className="stf-tombol">
            <button type="button" id={`${arrowKey}-naik`} className="btn btn-netral btn-kecil" disabled={index === 0} onClick={() => onMove(-1)}>
              ↑ Naikkan
            </button>
            <button type="button" id={`${arrowKey}-turun`} className="btn btn-netral btn-kecil" disabled={index === c.rounds.length - 1} onClick={() => onMove(1)}>
              ↓ Turunkan
            </button>
            <button type="button" className="btn btn-bahaya btn-kecil" onClick={onRemove}>
              Hapus babak
            </button>
          </div>
        ) : null}
      </div>
      {roundIssues.length ? (
        <ul className="cms-isu-daftar">
          {roundIssues.map((i, k) => (
            <li key={k} className={i.severity === 'error' ? 'cms-isu-galat' : 'cms-isu-peringatan'}>
              {i.message}
            </li>
          ))}
        </ul>
      ) : null}
      {r.authorNote.trim() ? (
        <p className="cms-catatan-ada">
          Babak ini punya catatan internal — lihat <a href={`#${id}-catatan`}>Catatan internal babak</a> di bagian bawah.
        </p>
      ) : null}
      <section className="stf-kartu">
        <h3>Adegan</h3>
        <TextField ed={ed} textKey={textKey.roundMeta(r.id)} field={f('meta')} label="Keterangan di atas judul (opsional)" limit={TEXT_LIMITS.roundMeta} hint="Mis. fase dan waktu cerita: “Survei · Hari ke-2, siang”." />
        <TextField ed={ed} textKey={textKey.roundTitle(r.id)} field={f('title')} label="Judul babak" limit={TEXT_LIMITS.roundTitle} />
        <div className="stf-grid">
          <AssetSelect
            ed={ed}
            label="Latar"
            kind="background"
            field={f('backgroundAssetId')}
            value={r.backgroundAssetId}
            uploadedOnly={r.layout === 'field'}
            onChange={(v) => setRound({ backgroundAssetId: v ?? '' })}
            hint={r.layout === 'field' ? 'Gambar adegan lapangan: titik berkas ditempatkan di atasnya.' : undefined}
          />
          <AssetSelect ed={ed} label="Foto/video bukti (opsional)" kind={['photo', 'video']} field={f('mediaAssetId')} value={r.mediaAssetId} allowNone onChange={(v) => setRound({ mediaAssetId: v })} />
        </div>
        <label className="stf-centang">
          <input type="checkbox" checked={r.keyRound} disabled={ed.readOnly} onChange={(e) => setRound({ keyRound: e.target.checked })} />
          <span>
            Babak kunci <small className="stf-kecil">— hanya penanda “Babak kunci” di layar; bobotnya ada di perubahan status pilihan.</small>
          </span>
        </label>
        <LayoutPicker ed={ed} index={index} />
        {/* Only the classic stage draws the officer; the other activities ignore this setting. */}
        {r.layout === 'stage' ? (
          <label className="stf-centang">
            <input type="checkbox" checked={r.showOfficer} disabled={ed.readOnly} onChange={(e) => setRound({ showOfficer: e.target.checked })} />
            <span>Tampilkan tokoh petugas di adegan</span>
          </label>
        ) : null}
      </section>
      <section className="stf-kartu">
        <h3 id={`${id}-dialog`} tabIndex={-1}>
          Dialog
        </h3>
        <p className="stf-kecil">
          Konteks singkat: satu atau dua pesan pendek (sekitar 25–45 kata). Tulis {'{nama}'} untuk menyebut nama peserta (layar acara menampilkan kata netral).
        </p>
        {issueAt(ed.issues, f('lines')) ? <p className={issueAt(ed.issues, f('lines'))?.severity === 'error' ? 'cms-isu-galat' : 'cms-isu-peringatan'}>{issueAt(ed.issues, f('lines'))?.message}</p> : null}
        <ol className="cms-dialog">
          {r.lines.map((l, li) => (
            <li key={l.id} className={`cms-dialog-baris${l.ifFlag ? ' cms-dialog-bersyarat' : ''}`}>
              <div className="cms-dialog-kepala">
                <SpeakerSelect
                  ed={ed}
                  label={`Pembicara baris ${li + 1}`}
                  line={l}
                  field={f(`lines[${li}]`)}
                  selectId={lineKey(l.id)}
                  onChange={(speaker, castId) => ed.update((x) => updateLine(x, index, li, { speaker, castId }))}
                />
                {earlier.length || l.ifFlag ? <LineCondition ed={ed} roundIndex={index} lineIndex={li} flag={l.ifFlag} earlier={earlier} /> : null}
                {!ed.readOnly ? (
                  <>
                    <button type="button" id={`${lineKey(l.id)}-naik`} className="btn btn-netral btn-kecil" aria-label={`Naikkan baris ${li + 1}`} disabled={li === 0} onClick={() => moveLineAt(li, l.id, -1)}>
                      ↑
                    </button>
                    <button type="button" id={`${lineKey(l.id)}-turun`} className="btn btn-netral btn-kecil" aria-label={`Turunkan baris ${li + 1}`} disabled={li === r.lines.length - 1} onClick={() => moveLineAt(li, l.id, 1)}>
                      ↓
                    </button>
                    <button type="button" className="btn btn-netral btn-kecil" aria-label={`Hapus baris ${li + 1}`} onClick={() => removeLineAt(li)}>
                      Hapus
                    </button>
                  </>
                ) : null}
              </div>
              <LineIssues ed={ed} field={f(`lines[${li}]`)} />
              <TextField ed={ed} textKey={textKey.line(r.id, l.id)} field={f(`lines[${li}]`)} label={l.ifFlag ? `Baris ${li + 1} (hanya pemegang tanda ${l.ifFlag}; tidak tampil di layar acara)` : `Baris ${li + 1}`} limit={TEXT_LIMITS.line} multiline rows={2} />
            </li>
          ))}
        </ol>
        {!ed.readOnly && r.lines.length < MAX_LINES ? <SpeakerButtons ed={ed} onAdd={(speaker, castId) => ed.update((x) => addLine(x, index, speaker, castId))} /> : null}
        <details className="cms-varian">
          <summary>Variasi kalimat sesuai status customer di awal babak (opsional)</summary>
          <p className="stf-kecil">Ditampilkan hanya kepada peserta yang status customer-nya berada di rentang itu. Status dibawa dari babak sebelumnya (termasuk efek tertunda babak ini).</p>
          {MOOD_BANDS.map((band) => (
            <TextField key={band} ed={ed} textKey={textKey.moodVariant(r.id, band)} field={f(`mood.${band}`)} label={moodBandLabel(band, words)} limit={TEXT_LIMITS.moodVariant} />
          ))}
        </details>
      </section>
      <EvidenceSection ed={ed} index={index} />
      <DelayedEffects ed={ed} index={index} earlier={earlier} />
      <section className="stf-kartu">
        <h3>Keputusan</h3>
        <TextField
          ed={ed}
          textKey={textKey.roundPrompt(r.id)}
          field={f('prompt')}
          label="Pertanyaan keputusan"
          limit={TEXT_LIMITS.prompt}
          hint="Satu kalimat pendek yang menyebut tugas peserta di babak ini, mis. “Siapa yang perlu dihubungi lebih dulu?”, bukan sekadar “Apa keputusanmu?”."
        />
        <div className="stf-grid">
          <TextField
            ed={ed}
            textKey={textKey.roundAction(r.id)}
            field={f('action')}
            label="Label tombol keputusan (opsional)"
            limit={TEXT_LIMITS.action}
            placeholder={defaultAction}
            hint={`Kosong = bawaan kegiatan ini (“${defaultAction}”). Isi hanya bila label itu cocok untuk kelima pilihan, mis. “Ajukan berkas” bila semua pilihan memang mengajukan berkas.`}
          />
          <RespondentSelect ed={ed} index={index} />
        </div>
        <TextField
          ed={ed}
          textKey={textKey.roundLesson(r.id)}
          field={f('lesson')}
          label="Pelajaran singkat (opsional)"
          limit={TEXT_LIMITS.lesson}
          multiline
          rows={2}
          hint="Satu pelajaran (15–25 kata), tampil untuk semua setelah jawaban ditutup — tidak pernah saat menjawab."
        />
        <TextField
          ed={ed}
          textKey={textKey.roundReason(r.id)}
          field={f('reason')}
          label={`Alasan dari ${mentorWord} — tampil di ringkasan akhir (opsional)`}
          limit={TEXT_LIMITS.reason}
          multiline
          rows={4}
          hint="Satu alasan untuk seluruh babak. Bila diisi, alasan per pilihan menjadi opsional. Tidak tampil di kartu konsekuensi saat bermain; peserta membacanya di ringkasan akhir."
        />
        {issueAt(ed.issues, f('choices')) ? <p className="cms-isu-galat">{issueAt(ed.issues, f('choices'))?.message}</p> : null}
        <p className="stf-kecil">
          Tepat = bobot 1, Keliru = 0, Kurang tepat di antaranya. Bobot & klasifikasi adalah kunci jawaban yang harus disetujui komite. Urutan pilihan diacak per peserta saat bermain; penilaian memakai ID pilihan.
        </p>
        <ol className="cms-pilihan">
          {r.choices.map((ch, ci) => (
            <ChoiceCard key={ch.id} ed={ed} roundIndex={index} choiceIndex={ci} mentorWord={mentorWord} mentorReason={mentorReason} respondentName={respondentName} />
          ))}
        </ol>
        <RoundAuditPanel ed={ed} index={index} />
      </section>
      <section className="stf-kartu">
        <h3>Bila waktu habis (tidak menjawab)</h3>
        <p className="stf-kecil">Peserta yang tidak menjawab dalam 30 detik mendapat 0 poin dan konsekuensi bawaan ini sekali; cerita tetap lanjut ke babak berikutnya.</p>
        <NumberField
          ed={ed}
          label={`Perubahan status customer (−${MOOD_DELTA_LIMIT}…+${MOOD_DELTA_LIMIT})`}
          field={f('timeout.moodDelta')}
          value={r.timeout.moodDelta}
          min={-MOOD_DELTA_LIMIT}
          max={MOOD_DELTA_LIMIT}
          onChange={(v) => setRound({ timeout: { moodDelta: v ?? 0 } })}
        />
        <TextField ed={ed} textKey={textKey.timeoutConsequence(r.id)} field={f('timeout.consequence')} label="Konsekuensi waktu habis" limit={TEXT_LIMITS.consequence} multiline />
        <TextField ed={ed} textKey={textKey.timeoutReason(r.id)} field={f('timeout.reason')} label="Alasan (opsional)" limit={TEXT_LIMITS.reason} multiline />
        <TextField
          ed={ed}
          textKey={textKey.timeoutReply(r.id)}
          field={f('timeout.reply')}
          label={respondentName ? `Balasan ${respondentName} bila waktu habis (opsional)` : 'Balasan bila waktu habis (opsional)'}
          limit={TEXT_LIMITS.reply}
          multiline
          rows={2}
        />
      </section>
      <section className="stf-kartu" id={`${id}-catatan`}>
        <h3>Catatan internal babak</h3>
        <NoteField
          ed={ed}
          label="Catatan internal babak — tidak tampil ke peserta"
          value={r.authorNote}
          limit={TEXT_LIMITS.authorNote}
          onChange={(v) => setRound({ authorNote: v })}
          hint="Untuk penulis & reviewer, mis. butir yang perlu dikonfirmasi atau tafsiran naskah. Tidak pernah dikirim ke room."
        />
      </section>
    </div>
  );
}

/** Who sees a line: everybody, or only participants who earlier chose a choice leaving a flag (private line). */
function LineCondition({ ed, roundIndex, lineIndex, flag, earlier }: { ed: EditorProps; roundIndex: number; lineIndex: number; flag: string | null; earlier: FlagSource[] }) {
  const id = useId();
  const issue = issueAt(ed.issues, `rounds[${roundIndex}].lines[${lineIndex}].ifFlag`);
  const known = !flag || earlier.some((s) => s.flag === flag);
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        Siapa yang melihat baris {lineIndex + 1}
      </label>
      <select
        id={id}
        className="kolom cms-dialog-syarat"
        value={flag ?? ''}
        disabled={ed.readOnly}
        aria-invalid={issue?.severity === 'error' ? true : undefined}
        onChange={(e) => ed.update((x) => updateLine(x, roundIndex, lineIndex, { ifFlag: e.target.value || null }))}
      >
        <option value="">Semua peserta</option>
        {!known && flag ? <option value={flag}>Hanya pemegang tanda {flag} (tidak ditinggalkan babak sebelumnya)</option> : null}
        {earlier.map((s) => (
          <option key={s.flag} value={s.flag}>
            Hanya untuk peserta yang memilih {flagSourceLabel(s, contentText(ed.content, 'id', textKey.flagLabel(s.flag)))}
          </option>
        ))}
      </select>
    </>
  );
}
