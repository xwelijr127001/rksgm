/**
 * Shared information of a round (gameplay brief §3–§5): up to MAX_EVIDENCE items the participant can open — a document,
 * checklist, timeline, comparison or picture — the SAME for every option and every participant. Opening one never
 * scores or hints, so facts every option relies on belong here rather than inside the recommended option's text.
 * Moving or removing an item or a row keeps keyboard focus in the list (focus.ts).
 */
import { useId, useState } from 'react';
import { EVIDENCE_KINDS, EVIDENCE_MARKS, EVIDENCE_ROW_KINDS, MAX_EVIDENCE, MAX_EVIDENCE_ROWS, TEXT_LIMITS, contentText, textKey, type EvidenceKind, type EvidenceMark } from '@shared/story/content';
import { t } from '../../../i18n';
import { markWordKey } from '../../../story/round/roundModel';
import { Modal } from '../../../ui/kit';
import {
  SPOT_RANGE,
  addEvidence,
  addEvidenceRow,
  moveEvidence,
  moveEvidenceRow,
  removeEvidence,
  removeEvidenceRow,
  setEvidenceSpot,
  spotAt,
  updateEvidence,
  updateEvidenceRow,
} from '../contentEdit';
import { EVIDENCE_KIND_HELP, EVIDENCE_KIND_LABEL, EVIDENCE_MARK_HINT, EVIDENCE_VALUE_LABEL } from '../labels';
import { SpotMap } from './SpotMap';
import { arrowTargets, firstFocusable, focusAfterEdit } from './focus';
import { AssetSelect, NumberField, TextField, issueAt, type EditorProps } from './fields';

/** A status mark as the participant reads it for this kind ("Ada", "Berjalan", "Cocok"…; the room's own words). */
function markOptionLabel(kind: EvidenceKind, mark: EvidenceMark): string {
  const key = markWordKey(kind, mark);
  return key ? t(key) : 'Tanpa status';
}

/** The word the room shows above an item's title when the author gives it no label of its own ("Dokumen", "Alur"…). */
function kindWordOf(kind: EvidenceKind): string {
  return t(`ruang.jenis.${kind}`);
}

export function EvidenceSection({ ed, index }: { ed: EditorProps; index: number }) {
  const sid = useId();
  const r = ed.content.rounds[index];
  if (!r) return null;
  const listIssue = issueAt(ed.issues, `rounds[${index}].evidence`);
  const itemKey = (evidenceId: string) => `${sid}-${evidenceId}`;
  const move = (ei: number, delta: -1 | 1) => {
    const item = r.evidence[ei];
    if (!item) return;
    ed.update((x) => moveEvidence(x, index, ei, delta));
    focusAfterEdit(arrowTargets(itemKey(item.id), delta));
  };
  /** Where focus goes when item `ei` is removed: the item now in its place, the one before, the add buttons, the heading. */
  const focusIdsAfterRemove = (ei: number) => [...[r.evidence[ei + 1], r.evidence[ei - 1]].flatMap((e) => (e ? [`${itemKey(e.id)}-judul`] : [])), `${sid}-tambah`, `${sid}-judul`];
  const remove = (ei: number) => {
    ed.update((x) => removeEvidence(x, index, ei));
    focusAfterEdit(focusIdsAfterRemove(ei));
  };
  return (
    <section className="stf-kartu">
      <h3 id={`${sid}-judul`} tabIndex={-1}>
        Berkas (informasi bersama)
      </h3>
      <p className="stf-kecil">
        Informasi yang dibutuhkan untuk memutuskan, sama untuk kelima pilihan dan semua peserta. Membuka berkas tidak memberi poin atau petunjuk jawaban; jangan menaruh fakta penentu hanya di teks pilihan yang tepat. Di chat berkas tampil sebagai lampiran, di meja berkas sebagai kartu, di adegan lapangan sebagai titik bernomor. Maks. {MAX_EVIDENCE} berkas.
      </p>
      {listIssue ? <p className={listIssue.severity === 'error' ? 'cms-isu-galat' : 'cms-isu-peringatan'}>{listIssue.message}</p> : null}
      {r.layout === 'field' ? <SpotMap ed={ed} roundIndex={index} /> : null}
      {r.evidence.length === 0 ? <p className="stf-lembut">Belum ada berkas di babak ini.</p> : null}
      <ol className="cms-berkas-daftar">
        {r.evidence.map((item, ei) => (
          <EvidenceCard
            key={item.id}
            ed={ed}
            roundIndex={index}
            evidenceIndex={ei}
            domKey={itemKey(item.id)}
            onMove={(d) => move(ei, d)}
            onRemove={() => remove(ei)}
            focusAfterRemove={() => firstFocusable(focusIdsAfterRemove(ei))}
          />
        ))}
      </ol>
      {!ed.readOnly && r.evidence.length < MAX_EVIDENCE ? (
        <div className="stf-tombol">
          {EVIDENCE_KINDS.map((kind, k) => (
            <button key={kind} id={k === 0 ? `${sid}-tambah` : undefined} type="button" className="btn btn-netral btn-kecil" onClick={() => ed.update((x) => addEvidence(x, index, kind))}>
              + {EVIDENCE_KIND_LABEL[kind]}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function EvidenceCard({
  ed,
  roundIndex,
  evidenceIndex,
  domKey,
  onMove,
  onRemove,
  focusAfterRemove,
}: {
  ed: EditorProps;
  roundIndex: number;
  evidenceIndex: number;
  /** DOM id prefix of this item's heading and arrows (stable while the item moves). */
  domKey: string;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  /** The element that gets focus once the item is gone (after the confirmation dialog). */
  focusAfterRemove: () => HTMLElement | null;
}) {
  const id = useId();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const r = ed.content.rounds[roundIndex];
  const item = r?.evidence[evidenceIndex];
  if (!r || !item) return null;
  const n = evidenceIndex + 1;
  const f = (s: string) => `rounds[${roundIndex}].evidence[${evidenceIndex}].${s}`;
  const title = contentText(ed.content, ed.locale, textKey.evidenceTitle(r.id, item.id));
  const kicker = contentText(ed.content, 'id', textKey.evidenceKicker(r.id, item.id));
  const showsRows = EVIDENCE_ROW_KINDS.includes(item.kind);
  const idIssue = issueAt(ed.issues, f('id'));
  const kindWord = kindWordOf(item.kind);
  // Removing asks first once the item holds more than a title (its texts go in every language).
  const hasContent = Boolean(contentText(ed.content, 'id', textKey.evidenceBody(r.id, item.id))) || Boolean(kicker) || item.rows.length > 0 || item.assetId !== null;
  // A first coordinate places the point in the middle of the other axis; "Hapus titik" removes it.
  const setSpot = (axis: 'x' | 'y', v: number | null) => {
    if (v === null) return;
    const spot = item.spot ?? { x: 50, y: 50 };
    ed.update((x) => setEvidenceSpot(x, roundIndex, evidenceIndex, { ...spot, [axis]: v }));
  };
  const removeSpot = () => {
    ed.update((x) => setEvidenceSpot(x, roundIndex, evidenceIndex, null));
    focusAfterEdit([`${domKey}-titik-x`]);
  };
  // Where the room draws a stored spot (an imported one may lie outside the safe range).
  const drawn = item.spot ? spotAt(item.spot.x, item.spot.y) : null;
  const moved = item.spot && drawn && (drawn.x !== item.spot.x || drawn.y !== item.spot.y);
  return (
    <li className="cms-berkas">
      <div className="stf-judul-baris">
        <h4 id={`${domKey}-judul`} tabIndex={-1}>
          Berkas {n}: {title || '(tanpa judul)'} <span className="stf-kecil mono">({item.id})</span>
        </h4>
        {!ed.readOnly ? (
          <div className="stf-tombol cms-tombol-rapat">
            <button type="button" id={`${domKey}-naik`} className="btn btn-netral btn-kecil" aria-label={`Naikkan berkas ${n}`} disabled={evidenceIndex === 0} onClick={() => onMove(-1)}>
              ↑
            </button>
            <button type="button" id={`${domKey}-turun`} className="btn btn-netral btn-kecil" aria-label={`Turunkan berkas ${n}`} disabled={evidenceIndex === r.evidence.length - 1} onClick={() => onMove(1)}>
              ↓
            </button>
            <button type="button" className="btn btn-netral btn-kecil" aria-label={`Hapus berkas ${n}`} onClick={() => (hasContent ? setConfirmRemove(true) : onRemove())}>
              Hapus
            </button>
          </div>
        ) : null}
      </div>
      {idIssue ? <p className="cms-isu-galat">{idIssue.message}</p> : null}
      <div className="stf-grid">
        <div className="stf-isian">
          <label htmlFor={`${id}-jenis`}>Jenis berkas</label>
          <select id={`${id}-jenis`} className="kolom" value={item.kind} disabled={ed.readOnly} aria-describedby={`${id}-jenis-petunjuk`} onChange={(e) => ed.update((x) => updateEvidence(x, roundIndex, evidenceIndex, { kind: e.target.value as EvidenceKind }))}>
            {EVIDENCE_KINDS.map((k) => (
              <option key={k} value={k}>
                {EVIDENCE_KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <small id={`${id}-jenis-petunjuk`}>{EVIDENCE_KIND_HELP[item.kind]}</small>
        </div>
        <TextField ed={ed} textKey={textKey.evidenceTitle(r.id, item.id)} field={f('title')} label="Judul singkat (tampil di tombol berkas)" limit={TEXT_LIMITS.evidenceTitle} />
        <TextField
          ed={ed}
          textKey={textKey.evidenceKicker(r.id, item.id)}
          field={f('kicker')}
          label="Label jenis (opsional)"
          limit={TEXT_LIMITS.evidenceKicker}
          placeholder={kindWord}
          hint={`Menggantikan kata jenis “${kindWord}” di atas judul, mis. “Daftar kontak”, “Surat”, “Lokasi”. Kosong = “${kindWord}”.`}
        />
      </div>
      <TextField
        ed={ed}
        textKey={textKey.evidenceBody(r.id, item.id)}
        field={f('body')}
        label={item.kind === 'document' ? 'Isi dokumen' : item.kind === 'photo' ? 'Keterangan gambar (opsional)' : 'Pengantar (opsional)'}
        limit={TEXT_LIMITS.evidenceBody}
        multiline
        rows={item.kind === 'document' ? 4 : 2}
      />
      <AssetSelect
        ed={ed}
        label={item.kind === 'photo' ? 'Gambar' : 'Gambar (opsional)'}
        kind={['photo', 'background']}
        field={f('assetId')}
        value={item.assetId}
        allowNone={item.kind !== 'photo' || item.assetId !== null}
        noneLabel="Tanpa gambar"
        uploadedOnly
        onChange={(v) => ed.update((x) => updateEvidence(x, roundIndex, evidenceIndex, { assetId: v }))}
        hint="Foto bukti atau gambar latar dari pustaka aset, tampil saat berkas dibuka."
      />
      {r.layout === 'field' ? (
        <div className="cms-titik-isian">
          <NumberField
            ed={ed}
            label="Titik X (% dari kiri)"
            field={f('spot.x')}
            value={item.spot?.x ?? null}
            min={SPOT_RANGE.min}
            max={SPOT_RANGE.max}
            step={0.5}
            onChange={(v) => setSpot('x', v)}
            inputId={`${domKey}-titik-x`}
          />
          <NumberField ed={ed} label="Titik Y (% dari atas)" field={f('spot.y')} value={item.spot?.y ?? null} min={SPOT_RANGE.min} max={SPOT_RANGE.max} step={0.5} onChange={(v) => setSpot('y', v)} />
          {!ed.readOnly && item.spot ? (
            <button type="button" className="btn btn-netral btn-kecil" onClick={removeSpot}>
              Hapus titik
            </button>
          ) : null}
          {!item.spot ? <small className="stf-kecil">Tanpa titik: hanya tampil di daftar di bawah gambar.</small> : null}
          {moved && drawn ? (
            <small className="cms-isu-peringatan cms-titik-catatan">
              Titik di luar batas aman {SPOT_RANGE.min}–{SPOT_RANGE.max}%: di room tampil di X {drawn.x}%, Y {drawn.y}%. Ubah nilainya untuk menyimpan posisi itu.
            </small>
          ) : null}
        </div>
      ) : null}
      {showsRows || item.rows.length ? <EvidenceRows ed={ed} roundIndex={roundIndex} evidenceIndex={evidenceIndex} /> : null}
      {confirmRemove ? (
        <Modal
          judul={`Hapus berkas ${n}${title ? ` “${title}”` : ''}?`}
          onTutup={() => setConfirmRemove(false)}
          // Cancelled: back to "Hapus" (the dialog's default). Removed: the item's heading is gone, so to its neighbour.
          kembaliKe={() => (document.getElementById(`${domKey}-judul`) ? null : focusAfterRemove())}
          aksi={
            <>
              <button type="button" className="btn btn-netral" onClick={() => setConfirmRemove(false)}>
                Batal
              </button>
              <button
                type="button"
                className="btn btn-bahaya"
                onClick={() => {
                  setConfirmRemove(false);
                  onRemove();
                }}
              >
                Ya, hapus
              </button>
            </>
          }
        >
          <p>Judul, label jenis, isi{item.rows.length ? `, ${item.rows.length} baris` : ''} dan pilihan gambar berkas ini dihapus dari semua bahasa. Revisi draf yang sudah tersimpan tetap ada di riwayat.</p>
        </Modal>
      ) : null}
    </li>
  );
}

/**
 * Rows of a checklist/timeline/compare item: a status mark (icon + word for players), a label and an optional value.
 * Every control names its row AND its item ("baris 2 berkas 1"), since dialogue lines on the same page are "baris" too.
 */
function EvidenceRows({ ed, roundIndex, evidenceIndex }: { ed: EditorProps; roundIndex: number; evidenceIndex: number }) {
  const id = useId();
  const r = ed.content.rounds[roundIndex];
  const item = r?.evidence[evidenceIndex];
  if (!r || !item) return null;
  const f = (s: string) => `rounds[${roundIndex}].evidence[${evidenceIndex}].${s}`;
  const rowsIssue = issueAt(ed.issues, f('rows'));
  const of = ` berkas ${evidenceIndex + 1}`;
  // The status select of a row is its first control (and where focus goes after a neighbouring row is removed).
  const statusId = (rowId: string) => `${id}-${rowId}`;
  const move = (ri: number, rowId: string, delta: -1 | 1) => {
    ed.update((x) => moveEvidenceRow(x, roundIndex, evidenceIndex, ri, delta));
    focusAfterEdit(arrowTargets(statusId(rowId), delta));
  };
  const remove = (ri: number) => {
    const neighbours = [item.rows[ri + 1], item.rows[ri - 1]].flatMap((row) => (row ? [statusId(row.id)] : []));
    ed.update((x) => removeEvidenceRow(x, roundIndex, evidenceIndex, ri));
    focusAfterEdit([...neighbours, `${id}-tambah`, `${id}-judul`]);
  };
  return (
    <div className="cms-berkas-baris">
      <h5 id={`${id}-judul`} tabIndex={-1}>
        Baris ({item.rows.length}/{MAX_EVIDENCE_ROWS})<span className="sr-only">{of}</span>
      </h5>
      <p className="stf-kecil">{EVIDENCE_MARK_HINT}</p>
      {rowsIssue ? <p className={rowsIssue.severity === 'error' ? 'cms-isu-galat' : 'cms-isu-peringatan'}>{rowsIssue.message}</p> : null}
      <ol>
        {item.rows.map((row, ri) => {
          const n = ri + 1;
          const idIssue = issueAt(ed.issues, f(`rows[${ri}].id`));
          return (
            <li key={row.id} className="cms-berkas-baris-item">
              <div className="stf-isian">
                <label htmlFor={statusId(row.id)}>
                  Status baris {n}
                  <span className="sr-only">{of}</span>
                </label>
                <select id={statusId(row.id)} className="kolom" value={row.mark} disabled={ed.readOnly} onChange={(e) => ed.update((x) => updateEvidenceRow(x, roundIndex, evidenceIndex, ri, { mark: e.target.value as EvidenceMark }))}>
                  {EVIDENCE_MARKS.map((m) => (
                    <option key={m} value={m}>
                      {markOptionLabel(item.kind, m)}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                ed={ed}
                textKey={textKey.evidenceRow(r.id, item.id, row.id)}
                field={f(`rows[${ri}].label`)}
                label={
                  <>
                    Isi baris {n}
                    <span className="sr-only">{of}</span>
                  </>
                }
                limit={TEXT_LIMITS.evidenceRow}
              />
              <TextField
                ed={ed}
                textKey={textKey.evidenceRowValue(r.id, item.id, row.id)}
                field={f(`rows[${ri}].value`)}
                label={
                  <>
                    {EVIDENCE_VALUE_LABEL[item.kind]}
                    <span className="sr-only">
                      {' '}
                      baris {n}
                      {of}
                    </span>
                  </>
                }
                limit={TEXT_LIMITS.evidenceRow}
              />
              {!ed.readOnly ? (
                <div className="stf-tombol cms-tombol-rapat">
                  <button type="button" id={`${statusId(row.id)}-naik`} className="btn btn-netral btn-kecil" aria-label={`Naikkan baris ${n}${of}`} disabled={ri === 0} onClick={() => move(ri, row.id, -1)}>
                    ↑
                  </button>
                  <button type="button" id={`${statusId(row.id)}-turun`} className="btn btn-netral btn-kecil" aria-label={`Turunkan baris ${n}${of}`} disabled={ri === item.rows.length - 1} onClick={() => move(ri, row.id, 1)}>
                    ↓
                  </button>
                  <button type="button" className="btn btn-netral btn-kecil" aria-label={`Hapus baris ${n}${of}`} onClick={() => remove(ri)}>
                    Hapus
                  </button>
                </div>
              ) : null}
              {idIssue ? <small className="cms-isu-galat">{idIssue.message}</small> : null}
            </li>
          );
        })}
      </ol>
      {!ed.readOnly && item.rows.length < MAX_EVIDENCE_ROWS ? (
        <button type="button" id={`${id}-tambah`} className="btn btn-netral btn-kecil" onClick={() => ed.update((x) => addEvidenceRow(x, roundIndex, evidenceIndex))}>
          + Baris<span className="sr-only">{of}</span>
        </button>
      ) : null}
    </div>
  );
}
