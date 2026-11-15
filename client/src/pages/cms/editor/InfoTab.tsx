import { useId, useState } from 'react';
import { MAX_CAST, MAX_INTRO_LINES, MOOD_BANDS, TEXT_LIMITS, textKey, type Difficulty, type MoodBand } from '@shared/story/content';
import type { CategoryView } from '@shared/story/dto';
import { MOOD_BAND_LABEL } from '@shared/story/protocol';
import { scenarioMoodLabels } from '@shared/story/scene';
import { Modal } from '../../../ui/kit';
import { addCastMember, addIntroLine, castUses, clearIntroFlag, moveIntroLine, removeCastMember, removeIntroLine, setLocaleEnabled, updateCastMember, updateIntroLine } from '../contentEdit';
import { MOOD_RANGE, castUsesLabel, moodBandLabel, roundListLabel } from '../labels';
import { arrowTargets, focusAfterEdit } from './focus';
import { AssetSelect, LineIssues, NoteField, NumberField, SpeakerButtons, SpeakerSelect, TextField, castNameOf, issueAt, type EditorProps } from './fields';

/**
 * Scenario metadata, characters/presentation, supporting cast, status words, opening lines, internal notes and the
 * translation switch (PRD FR-A2, FR-A3 initial state, FR-A10).
 */
export function InfoTab({ ed, categories }: { ed: EditorProps; categories: CategoryView[] }) {
  const id = useId();
  const c = ed.content;
  const customerId = c.presentation.customerCharacterId;
  const customer = ed.assets.find((a) => a.id === customerId);
  const expressions = customer?.expressions ?? [];
  const words = scenarioMoodLabels(c, 'id');
  // Same rule as validation: the officer's name is needed when there is an officer character or an officer line.
  const officerSpeaks = [...c.intro, ...c.rounds.flatMap((r) => r.lines)].some((l) => l.speaker === 'officer');
  const setPres = (patch: Partial<typeof c.presentation>) => ed.update((x) => ({ ...x, presentation: { ...x.presentation, ...patch } }));
  return (
    <div className="cms-tab-isi">
      <section className="stf-kartu">
        <h2>Identitas skenario</h2>
        <TextField ed={ed} textKey={textKey.title()} field="text.title" label="Judul skenario" limit={TEXT_LIMITS.title} />
        <TextField ed={ed} textKey={textKey.synopsis()} field="text.synopsis" label="Sinopsis" limit={TEXT_LIMITS.synopsis} multiline />
        <div className="stf-grid">
          <div className="stf-isian">
            <label htmlFor={id + 'kat'}>Kategori</label>
            <select id={id + 'kat'} className="kolom" value={c.categoryId} disabled={ed.readOnly} onChange={(e) => ed.update((x) => ({ ...x, categoryId: e.target.value }))}>
              {categories.map((k) => (
                <option key={k.id} value={k.id} disabled={!k.active && k.id !== c.categoryId}>
                  {k.name}
                  {k.active ? '' : ' (belum aktif)'}
                </option>
              ))}
            </select>
            {issueAt(ed.issues, 'categoryId') ? <small className="cms-isu-galat">{issueAt(ed.issues, 'categoryId')?.message}</small> : null}
          </div>
          <div className="stf-isian">
            <label htmlFor={id + 'sulit'}>Tingkat kesulitan</label>
            <select id={id + 'sulit'} className="kolom" value={c.difficulty} disabled={ed.readOnly} onChange={(e) => ed.update((x) => ({ ...x, difficulty: Number(e.target.value) as Difficulty }))}>
              <option value={1}>1 — dasar</option>
              <option value={2}>2 — menengah</option>
              <option value={3}>3 — lanjut</option>
            </select>
          </div>
          <NumberField
            ed={ed}
            label="Status customer awal (0–100)"
            field="initialMood"
            value={c.initialMood}
            min={0}
            max={100}
            onChange={(v) => ed.update((x) => ({ ...x, initialMood: v ?? 0 }))}
            hint="Hanya berlaku di babak 1. Babak berikutnya melanjutkan status masing-masing peserta (tidak direset)."
          />
        </div>
        <p className="stf-kecil">Sumber cerita: {c.contentSource === 'demo' ? 'DEMO sintetis (tidak masuk rekap kompetisi)' : 'kasus klaim settled — wajib pemeriksaan anonimisasi oleh reviewer sebelum terbit'}.</p>
      </section>
      <section className="stf-kartu">
        <h2>Tokoh & tampilan</h2>
        <div className="stf-grid">
          <AssetSelect
            ed={ed}
            label="Tokoh customer"
            kind="character"
            field="presentation.customerCharacterId"
            value={customerId}
            allowNone
            noneLabel="Tanpa gambar (nama & status saja)"
            onChange={(v) => setPres({ customerCharacterId: v })}
            hint={customerId ? undefined : 'Peserta melihat nama dan kata status customer tanpa potret. Gambar bisa dipilih nanti.'}
          />
          <TextField ed={ed} textKey={textKey.customerName()} field="text.customerName" label="Nama customer (tampil di dialog)" limit={TEXT_LIMITS.characterName} />
          <AssetSelect ed={ed} label="Tokoh petugas" kind="character" field="presentation.officerCharacterId" value={c.presentation.officerCharacterId} allowNone onChange={(v) => setPres({ officerCharacterId: v })} />
          {c.presentation.officerCharacterId || officerSpeaks || issueAt(ed.issues, 'text.officerName') ? (
            <TextField
              ed={ed}
              textKey={textKey.officerName()}
              field="text.officerName"
              label="Nama petugas / mentor"
              limit={TEXT_LIMITS.characterName}
              hint={c.presentation.officerCharacterId ? undefined : 'Tampil di dialog. Tanpa tokoh petugas, ringkasan akhir menyebut alasan dan kata-kata penutupnya “mentor”.'}
            />
          ) : null}
          <AssetSelect ed={ed} label="Musik latar (opsional)" kind="bgm" field="presentation.bgmAssetId" value={c.presentation.bgmAssetId} allowNone onChange={(v) => setPres({ bgmAssetId: v })} hint="Peserta selalu bisa mematikan suara." />
        </div>
        {customerId ? (
          <>
            <h3>Ekspresi customer per status</h3>
            <p className="stf-kecil">Wajah customer di HP tiap peserta mengikuti status customer-nya sendiri. Status bukan ukuran benar-salahnya proses klaim.</p>
            <div className="stf-grid">
              {MOOD_BANDS.map((band: MoodBand) => {
                const field = `presentation.moodExpressions.${band}`;
                const issue = issueAt(ed.issues, field);
                return (
                  <div className="stf-isian" key={band}>
                    <label htmlFor={id + band}>{moodBandLabel(band, words)}</label>
                    <select
                      id={id + band}
                      className="kolom"
                      value={c.presentation.moodExpressions[band]}
                      disabled={ed.readOnly}
                      aria-invalid={issue?.severity === 'error' ? true : undefined}
                      onChange={(e) => setPres({ moodExpressions: { ...c.presentation.moodExpressions, [band]: e.target.value } })}
                    >
                      {!expressions.includes(c.presentation.moodExpressions[band]) ? <option value={c.presentation.moodExpressions[band]}>{c.presentation.moodExpressions[band] || '— pilih —'}</option> : null}
                      {expressions.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                    {issue ? <small className="cms-isu-galat">{issue.message}</small> : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </section>
      <MoodWordsCard ed={ed} />
      <CastCard ed={ed} />
      <IntroCard ed={ed} />
      <section className="stf-kartu">
        <h2>Catatan internal</h2>
        <NoteField
          ed={ed}
          label="Catatan internal — tidak tampil ke peserta"
          value={c.authorNotes}
          limit={TEXT_LIMITS.authorNotes}
          rows={8}
          onChange={(v) => ed.update((x) => ({ ...x, authorNotes: v }))}
          hint="Untuk penulis & reviewer: butir yang perlu dikonfirmasi, glosarium, tafsiran naskah. Tidak pernah dikirim ke room atau laporan. Catatan per babak ada di tab Babak."
        />
      </section>
      <section className="stf-kartu">
        <h2>Bahasa teks</h2>
        <p className="stf-kecil">Bahasa Indonesia adalah bahasa MVP dan selalu wajib. Bahasa lain bersifat opsional; bila diaktifkan, semua teksnya wajib lengkap sebelum terbit. ID pilihan tidak berubah antarbahasa.</p>
        <label className="stf-centang">
          <input type="checkbox" checked={c.locales.includes('en')} disabled={ed.readOnly} onChange={(e) => ed.update((x) => setLocaleEnabled(x, 'en', e.target.checked))} />
          <span>Aktifkan teks bahasa Inggris (en)</span>
        </label>
      </section>
    </div>
  );
}

/** Optional per-scenario status words (all five or none); empty fields show the default word as placeholder. */
function MoodWordsCard({ ed }: { ed: EditorProps }) {
  return (
    <section className="stf-kartu">
      <h2>Kata status customer</h2>
      <p className="stf-kecil">
        Opsional. Status customer (0–100) dibagi lima rentang. Isi kelima kata untuk memakai sebutan khusus skenario ini di HP peserta dan layar acara, atau kosongkan semuanya untuk memakai kata bawaan (abu-abu).
      </p>
      <div className="stf-grid">
        {MOOD_BANDS.map((band) => (
          <TextField key={band} ed={ed} textKey={textKey.moodLabel(band)} field={`text.moodLabel.${band}`} label={`Status ${MOOD_RANGE[band]}`} limit={TEXT_LIMITS.moodLabel} placeholder={MOOD_BAND_LABEL[band]} />
        ))}
      </div>
    </section>
  );
}

/** Supporting characters who speak besides the customer and the officer (name required, role and portrait optional). */
function CastCard({ ed }: { ed: EditorProps }) {
  const id = useId();
  const [confirm, setConfirm] = useState<number | null>(null);
  const c = ed.content;
  // After a removal keyboard focus goes to a neighbour's heading, else the add button or the card's heading (focus.ts).
  const memberKey = (memberId: string) => `${id}-tokoh-${memberId}`;
  const remove = (i: number) => {
    const neighbours = [c.cast[i + 1], c.cast[i - 1]].flatMap((m) => (m ? [memberKey(m.id)] : []));
    ed.update((x) => removeCastMember(x, i));
    focusAfterEdit([...neighbours, `${id}-tambah`, `${id}-judul`]);
  };
  const pending = confirm !== null ? c.cast[confirm] : undefined;
  const pendingUses = pending ? castUses(c, pending.id) : null;
  return (
    <section className="stf-kartu">
      <h2 id={`${id}-judul`} tabIndex={-1}>
        Tokoh pendukung
      </h2>
      <p className="stf-kecil">
        Tokoh lain yang berbicara selain customer dan petugas (mis. surveyor, admin bengkel). Namanya tampil di dialog; peran hanya untuk penulis & reviewer. Maks. {MAX_CAST} tokoh.
      </p>
      {issueAt(ed.issues, 'cast') ? <p className="cms-isu-galat">{issueAt(ed.issues, 'cast')?.message}</p> : null}
      {c.cast.length === 0 ? <p className="stf-lembut">Belum ada tokoh pendukung.</p> : null}
      <ol className="cms-tokoh-daftar">
        {c.cast.map((m, i) => {
          const uses = castUses(c, m.id);
          const idIssue = issueAt(ed.issues, `cast[${i}].id`);
          return (
            <li key={m.id} className="cms-tokoh">
              <div className="stf-judul-baris">
                <h3 id={memberKey(m.id)} tabIndex={-1}>
                  {castNameOf(ed, m.id) || `Tokoh pendukung ${i + 1}`} <span className="stf-kecil mono">({m.id})</span>
                </h3>
                {!ed.readOnly ? (
                  <button type="button" className="btn btn-netral btn-kecil" aria-label={`Hapus tokoh pendukung ${i + 1}`} onClick={() => (uses.lines > 0 || uses.replies.length > 0 ? setConfirm(i) : remove(i))}>
                    Hapus
                  </button>
                ) : null}
              </div>
              {idIssue ? <p className="cms-isu-galat">{idIssue.message}</p> : null}
              <div className="stf-grid">
                <TextField ed={ed} textKey={textKey.castName(m.id)} field={`cast[${i}].name`} label="Nama (tampil di dialog)" limit={TEXT_LIMITS.characterName} />
                <TextField ed={ed} textKey={textKey.castRole(m.id)} field={`cast[${i}].role`} label="Peran (opsional, tidak tampil ke peserta)" limit={TEXT_LIMITS.castRole} />
                <AssetSelect
                  ed={ed}
                  label="Potret kecil (opsional)"
                  kind="character"
                  field={`cast[${i}].characterAssetId`}
                  value={m.characterAssetId}
                  allowNone
                  noneLabel="Tanpa potret (nama saja)"
                  onChange={(v) => ed.update((x) => updateCastMember(x, i, { characterAssetId: v }))}
                  hint="Tampil sebagai avatar kecil di samping pesan tokoh ini."
                />
              </div>
              <p className="stf-kecil">{castUsesLabel(uses)}</p>
            </li>
          );
        })}
      </ol>
      {!ed.readOnly && c.cast.length < MAX_CAST ? (
        <div className="stf-tombol">
          <button type="button" id={`${id}-tambah`} className="btn btn-netral btn-kecil" onClick={() => ed.update((x) => addCastMember(x))}>
            + Tokoh pendukung
          </button>
        </div>
      ) : null}
      {pending && pendingUses && confirm !== null ? (
        <Modal
          judul={`Hapus ${castNameOf(ed, pending.id) || `tokoh pendukung ${confirm + 1}`}?`}
          onTutup={() => setConfirm(null)}
          aksi={
            <>
              <button type="button" className="btn btn-netral" onClick={() => setConfirm(null)}>
                Batal
              </button>
              <button
                type="button"
                className="btn btn-bahaya"
                onClick={() => {
                  const i = confirm;
                  setConfirm(null);
                  remove(i);
                }}
              >
                Ya, hapus
              </button>
            </>
          }
        >
          {pendingUses.lines ? (
            <p>
              Tokoh ini berbicara di {pendingUses.lines} baris. Baris-baris itu tetap ada beserta teksnya, tetapi menjadi <b>Narasi</b>; pilih pembicara barunya di tab Info (pembuka) atau Babak.
            </p>
          ) : null}
          {pendingUses.replies.length ? (
            <p>
              Tokoh ini {pendingUses.lines ? 'juga ' : ''}membalas sesudah keputusan di babak {roundListLabel(pendingUses.replies)}. Teks balasannya tetap ada, tetapi babak itu belum punya yang membalas; pilih penggantinya di “Yang membalas sesudah keputusan” (tab Babak).
            </p>
          ) : null}
          <p>Nama dan peran tokoh dihapus dari semua bahasa.</p>
        </Modal>
      ) : null}
    </section>
  );
}

/** Opening lines shown to everybody at the start of round 1 (e.g. the mentor introducing the case). */
function IntroCard({ ed }: { ed: EditorProps }) {
  const id = useId();
  const c = ed.content;
  // A line's speaker select is its first control: where focus goes after a neighbouring line is removed.
  const lineKey = (lineId: string) => `${id}-${lineId}`;
  const move = (li: number, lineId: string, delta: -1 | 1) => {
    ed.update((x) => moveIntroLine(x, li, delta));
    focusAfterEdit(arrowTargets(lineKey(lineId), delta));
  };
  const remove = (li: number) => {
    const neighbours = [c.intro[li + 1], c.intro[li - 1]].flatMap((l) => (l ? [lineKey(l.id)] : []));
    ed.update((x) => removeIntroLine(x, li));
    focusAfterEdit([...neighbours, `${id}-judul`]);
  };
  return (
    <section className="stf-kartu">
      <h2 id={`${id}-judul`} tabIndex={-1}>
        Pembuka
      </h2>
      <p className="stf-kecil">
        Opsional. Ditampilkan kepada semua peserta (dan di layar acara) di awal babak 1, sebelum dialog babak 1 — mis. mentor memperkenalkan kasus. Maks. {MAX_INTRO_LINES} baris. Tulis {'{nama}'} untuk menyebut nama peserta.
      </p>
      {issueAt(ed.issues, 'intro') ? <p className="cms-isu-galat">{issueAt(ed.issues, 'intro')?.message}</p> : null}
      <ol className="cms-dialog">
        {c.intro.map((l, li) => (
          <li key={l.id} className="cms-dialog-baris">
            <div className="cms-dialog-kepala">
              <SpeakerSelect
                ed={ed}
                label={`Pembicara baris pembuka ${li + 1}`}
                line={l}
                field={`intro[${li}]`}
                selectId={lineKey(l.id)}
                onChange={(speaker, castId) => ed.update((x) => updateIntroLine(x, li, speaker, castId))}
              />
              {!ed.readOnly ? (
                <>
                  <button type="button" id={`${lineKey(l.id)}-naik`} className="btn btn-netral btn-kecil" aria-label={`Naikkan baris pembuka ${li + 1}`} disabled={li === 0} onClick={() => move(li, l.id, -1)}>
                    ↑
                  </button>
                  <button type="button" id={`${lineKey(l.id)}-turun`} className="btn btn-netral btn-kecil" aria-label={`Turunkan baris pembuka ${li + 1}`} disabled={li === c.intro.length - 1} onClick={() => move(li, l.id, 1)}>
                    ↓
                  </button>
                  <button type="button" className="btn btn-netral btn-kecil" aria-label={`Hapus baris pembuka ${li + 1}`} onClick={() => remove(li)}>
                    Hapus
                  </button>
                </>
              ) : null}
            </div>
            <LineIssues ed={ed} field={`intro[${li}]`} />
            {l.ifFlag && !ed.readOnly ? (
              <button type="button" className="btn btn-netral btn-kecil cms-baris-isu" onClick={() => ed.update((x) => clearIntroFlag(x, li))}>
                Tampilkan ke semua peserta (hapus syarat tanda {l.ifFlag})
              </button>
            ) : null}
            <TextField ed={ed} textKey={textKey.introLine(l.id)} field={`intro[${li}]`} label={`Baris pembuka ${li + 1}`} limit={TEXT_LIMITS.line} multiline rows={2} />
          </li>
        ))}
      </ol>
      {!ed.readOnly && c.intro.length < MAX_INTRO_LINES ? <SpeakerButtons ed={ed} onAdd={(speaker, castId) => ed.update((x) => addIntroLine(x, speaker, castId))} /> : null}
    </section>
  );
}
