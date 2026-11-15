/**
 * Editorial workflow (PRD FR-A7, FR-E6): draft -> in review -> published -> archived, immutable versions, four-eyes
 * publication, anonymization evidence for settled cases, withdrawal, and the attributed history. The buttons follow
 * the signed-in roles; the server enforces every rule (e.g. a reviewer cannot publish their own submission).
 */
import { useEffect, useId, useState } from 'react';
import type { RevisionRow, ScenarioDetail } from '@shared/story/dto';
import type { ScenarioContent } from '@shared/story/content';
import { can, type StaffIdentity } from '@shared/story/roles';
import { staffApi } from '../../../story/staff';
import { formatTime } from '../../../story/ui/StaffShell';
import { Modal } from '../../../ui/kit';
import { EVENT_LABEL, STATUS_LABEL } from '../labels';

type Act = (path: string, body: Record<string, unknown>, okText: string) => Promise<boolean>;

export function WorkflowTab({ detail, identity, dirty, act, onRestore }: { detail: ScenarioDetail; identity: StaffIdentity; dirty: boolean; act: Act; onRestore: (content: ScenarioContent, revision: number) => void }) {
  const id = useId();
  const roles = identity.roles;
  const [note, setNote] = useState('');
  const [revisions, setRevisions] = useState<RevisionRow[]>([]);
  /** A revision waiting for the author's go-ahead: loading it would replace unsaved changes. */
  const [pendingRestore, setPendingRestore] = useState<number | null>(null);
  const errors = detail.issues.filter((i) => i.severity === 'error').length;
  const base = `/api/cms/scenarios/${detail.id}`;
  useEffect(() => {
    void staffApi<{ revisions: RevisionRow[] }>('GET', `${base}/revisions`).then((r) => {
      if (r.ok) setRevisions(r.data.revisions);
    });
  }, [base, detail.draftRevision]);
  const run = async (path: string, okText: string, body: Record<string, unknown> = { note }) => {
    if (await act(path, body, okText)) setNote('');
  };
  const restore = async (rev: number) => {
    const r = await staffApi<{ content: ScenarioContent }>('GET', `${base}/revisions/${rev}`);
    if (r.ok) onRestore(r.data.content, rev);
  };
  const askRestore = (rev: number) => {
    if (dirty) setPendingRestore(rev);
    else void restore(rev);
  };
  const settled = detail.contentSource === 'settled_case';
  return (
    <div className="cms-tab-isi">
      <section className="stf-kartu">
        <h2>Status & alur terbit</h2>
        <dl className="cms-status">
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`stf-lencana stf-lencana-${detail.status}`}>{STATUS_LABEL[detail.status]}</span>
            </dd>
          </div>
          <div>
            <dt>Versi terbit (dipakai room baru)</dt>
            <dd>{detail.currentVersionNo ?? '—'}</dd>
          </div>
          <div>
            <dt>Revisi draf</dt>
            <dd>{detail.draftRevision}</dd>
          </div>
          <div>
            <dt>Anonimisasi</dt>
            <dd>{detail.anonymization.status === 'not_required_demo' ? 'Tidak perlu (DEMO sintetis)' : detail.anonymization.status === 'checked' ? `Diperiksa ${formatTime(detail.anonymization.at)}` : 'Belum diperiksa'}</dd>
          </div>
        </dl>
        {detail.anonymization.note ? <p className="stf-kecil">Catatan anonimisasi: {detail.anonymization.note}</p> : null}
        {detail.status === 'in_review' ? (
          <p className="stf-kecil">
            Diajukan {formatTime(detail.submittedAt)} (revisi {detail.submittedRevision}). Draf terkunci selama review.
          </p>
        ) : null}
        {dirty ? <p className="stf-peringatan">Ada perubahan yang belum disimpan. Simpan draf dulu sebelum mengajukan.</p> : null}
        <div className="stf-isian">
          <label htmlFor={id + 'n'}>Catatan untuk riwayat (alasan, keputusan komite, bukti anonimisasi)</label>
          <textarea id={id + 'n'} className="kolom" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        </div>
        <div className="stf-tombol">
          {can(roles, 'editScenarios') && (detail.status === 'draft' || detail.status === 'published') ? (
            <button type="button" className="btn" disabled={dirty || errors > 0} title={errors ? 'Perbaiki galat validasi dulu' : undefined} onClick={() => void run(`${base}/submit`, 'Diajukan ke review.')}>
              Ajukan ke review
            </button>
          ) : null}
          {can(roles, 'reviewScenarios') && detail.status === 'in_review' ? (
            <>
              <button type="button" className="btn btn-netral" onClick={() => void run(`${base}/return`, 'Dikembalikan ke draf.')}>
                Kembalikan ke draf
              </button>
              {settled ? (
                <button type="button" className="btn btn-netral" disabled={!note.trim()} onClick={() => void run(`${base}/anonymization`, 'Pemeriksaan anonimisasi dicatat.')}>
                  Catat pemeriksaan anonimisasi
                </button>
              ) : null}
              <button type="button" className="btn btn-utama" onClick={() => void run(`${base}/publish`, 'Diterbitkan sebagai versi baru.')}>
                Terbitkan
              </button>
            </>
          ) : null}
          {can(roles, 'archiveScenarios') && detail.status !== 'archived' ? (
            <button type="button" className="btn btn-bahaya" onClick={() => void run(`${base}/archive`, 'Diarsipkan.', { reason: note })}>
              Arsipkan
            </button>
          ) : null}
          {can(roles, 'archiveScenarios') && detail.status === 'archived' ? (
            <button type="button" className="btn btn-netral" onClick={() => void run(`${base}/unarchive`, 'Dipulihkan dari arsip.')}>
              Pulihkan dari arsip
            </button>
          ) : null}
        </div>
        <p className="stf-kecil">
          Terbit = versi baru yang tidak bisa diubah. Room yang sedang/sudah berjalan tetap memakai versi yang dipakai saat dibuka. Reviewer tidak boleh menerbitkan skenario yang ia ajukan/sunting sendiri. Penerbitan oleh akun uji adalah SIMULASI, bukan persetujuan komite.
        </p>
      </section>
      <section className="stf-kartu">
        <h2>Versi terbit</h2>
        {detail.versions.length === 0 ? (
          <p className="stf-lembut">Belum pernah terbit.</p>
        ) : (
          <div className="stf-gulir">
            <table className="stf-tabel">
              <thead>
                <tr>
                  <th>Versi</th>
                  <th>Status</th>
                  <th>Terbit</th>
                  <th>Diajukan oleh</th>
                  <th>Diterbitkan oleh</th>
                  <th>Catatan</th>
                  <th>Sidik isi</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {detail.versions.map((v) => (
                  <tr key={v.id}>
                    <td>{v.versionNo}</td>
                    <td>{v.status === 'withdrawn' ? `ditarik ${formatTime(v.withdrawnAt)}${v.withdrawnReason ? ` — ${v.withdrawnReason}` : ''}` : v.status === 'superseded' ? 'digantikan' : 'aktif'}</td>
                    <td>{formatTime(v.publishedAt)}</td>
                    <td>{v.submittedBy ?? '—'}</td>
                    <td>{v.reviewedBy}</td>
                    <td>{v.reviewNote || '—'}</td>
                    <td className="mono">{v.contentHash.slice(0, 12)}</td>
                    <td>
                      {can(roles, 'archiveScenarios') && v.status !== 'withdrawn' ? (
                        <button type="button" className="btn btn-netral btn-kecil" onClick={() => void act(`/api/cms/versions/${v.id}/withdraw`, { reason: note }, `Versi ${v.versionNo} ditarik.`)}>
                          Tarik versi
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="stf-kecil">Versi yang ditarik tidak bisa membuka room kompetisi baru; hasil room lama tetap tersimpan.</p>
      </section>
      <section className="stf-kartu">
        <h2>Riwayat</h2>
        <ol className="cms-riwayat">
          {detail.events.map((e, i) => (
            <li key={i}>
              <span className="stf-kecil">{formatTime(e.at)}</span> <b>{EVENT_LABEL[e.action] ?? e.action}</b> oleh {e.actorName}
              {e.revision ? ` · revisi ${e.revision}` : ''}
              {e.note ? <span className="stf-kecil"> — {e.note}</span> : null}
            </li>
          ))}
        </ol>
      </section>
      <section className="stf-kartu">
        <h2>Revisi draf</h2>
        <div className="stf-gulir">
          <table className="stf-tabel">
            <thead>
              <tr>
                <th>Revisi</th>
                <th>Disimpan</th>
                <th>Oleh</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {revisions.map((r) => (
                <tr key={r.revision}>
                  <td>{r.revision}</td>
                  <td>{formatTime(r.savedAt)}</td>
                  <td>{r.savedBy ?? '—'}</td>
                  <td>
                    {can(roles, 'editScenarios') && r.revision !== detail.draftRevision && (detail.status === 'draft' || detail.status === 'published') ? (
                      <button type="button" className="btn btn-netral btn-kecil" onClick={() => askRestore(r.revision)}>
                        Muat ke editor
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {pendingRestore !== null ? (
        <Modal
          judul={`Muat revisi ${pendingRestore} ke editor?`}
          onTutup={() => setPendingRestore(null)}
          aksi={
            <>
              <button type="button" className="btn btn-netral" onClick={() => setPendingRestore(null)}>
                Batal
              </button>
              <button
                type="button"
                className="btn btn-bahaya"
                onClick={() => {
                  const rev = pendingRestore;
                  setPendingRestore(null);
                  void restore(rev);
                }}
              >
                Ganti isi editor
              </button>
            </>
          }
        >
          <p>
            Ada perubahan yang belum disimpan. Isi editor akan diganti isi revisi {pendingRestore}, dan perubahan itu hilang. Untuk menyimpannya, tekan Batal lalu “Simpan draf” lebih dulu.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
