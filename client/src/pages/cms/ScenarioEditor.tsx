/**
 * Structured scenario editor (/cms/skenario/:id). Holds the working copy, validates it live with the SAME validator
 * the server runs before review/publication (shared/story/validate.ts), and saves drafts with optimistic revision
 * checks (a concurrent edit returns 409 instead of silently overwriting). No JSON/TypeScript editing is needed.
 * Unsaved edits are never dropped silently: a server answer keeps what was typed after its request (workingCopy.ts),
 * saves run one at a time, leaving the editor asks first (LeaveGuard), and an ended staff session signs in again over
 * the editor (StaffShell `resumable`).
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { contentText, textKey, type ContentLocale, type ScenarioContent } from '@shared/story/content';
import type { AssetView, CategoryView, ScenarioDetail } from '@shared/story/dto';
import { can, type StaffIdentity } from '@shared/story/roles';
import { validateScenario, type ContentIssue, type ValidationContext } from '@shared/story/validate';
import { staffApi } from '../../story/staff';
import { ActionMessage, formatTime } from '../../story/ui/StaffShell';
import { flagsSetBefore } from './contentEdit';
import { STATUS_LABEL } from './labels';
import { LeaveGuard, type SaveOutcome } from './LeaveGuard';
import { editWorkingCopy, hasUnsavedChanges, withServerCopy, type WorkingCopy } from './workingCopy';
import { EndingsTab } from './editor/EndingsTab';
import type { EditorProps } from './editor/fields';
import { InfoTab } from './editor/InfoTab';
import { IssuesTab } from './editor/IssuesTab';
import { ScenarioAuditPanel } from './editor/OptionAudit';
import { PreviewTab } from './editor/PreviewTab';
import { RoundsTab } from './editor/RoundsTab';
import { WorkflowTab } from './editor/WorkflowTab';

type Tab = 'info' | 'babak' | 'akhir' | 'validasi' | 'pratinjau' | 'alur';
const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Info & tokoh' },
  { id: 'babak', label: 'Babak' },
  { id: 'akhir', label: 'Akhir cerita' },
  { id: 'validasi', label: 'Validasi' },
  { id: 'pratinjau', label: 'Pratinjau' },
  { id: 'alur', label: 'Review, terbit & riwayat' },
];

type Msg = { kind: 'ok' | 'error'; text: string } | null;

export function ScenarioEditor({ identity }: { identity: StaffIdentity }) {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<ScenarioDetail | null>(null);
  const [copy, setCopy] = useState<WorkingCopy | null>(null);
  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [assets, setAssets] = useState<AssetView[]>([]);
  const [tab, setTab] = useState<Tab>('info');
  const [roundIndex, setRoundIndex] = useState(0);
  const [locale, setLocale] = useState<ContentLocale>('id');
  const [msg, setMsg] = useState<Msg>(null);
  const [saving, setSaving] = useState(false);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  // The working copy and the stored scenario as they are now, for code that runs after an await (a save's own closure
  // holds them from when it began). A server answer updates them at once, before React renders it.
  const latest = useRef<WorkingCopy | null>(null);
  const stored = useRef<ScenarioDetail | null>(null);
  useLayoutEffect(() => {
    latest.current = copy;
    stored.current = detail;
  });
  /** The save on its way, if any. */
  const inFlight = useRef<Promise<SaveOutcome> | null>(null);

  /** The server's copy of the scenario. Edits newer than `basis` (by default the last stored copy) stay in the editor. */
  const adopt = useCallback((d: ScenarioDetail, basis?: ScenarioContent) => {
    stored.current = d;
    latest.current = withServerCopy(latest.current, d.content, basis);
    setDetail(d);
    setCopy((w) => withServerCopy(w, d.content, basis));
  }, []);

  /** The asset library: at start, and again on request after an upload in another tab ("Muat ulang daftar"). */
  const loadAssets = useCallback(async () => {
    const a = await staffApi<{ assets: AssetView[] }>('GET', '/api/cms/assets?archived=1');
    if (a.ok) setAssets(a.data.assets);
  }, []);
  const load = useCallback(async () => {
    const [s, c] = await Promise.all([
      staffApi<{ scenario: ScenarioDetail }>('GET', `/api/cms/scenarios/${id}`),
      staffApi<{ categories: CategoryView[] }>('GET', '/api/cms/categories'),
      loadAssets(),
    ]);
    if (s.ok) adopt(s.data.scenario);
    else setMsg({ kind: 'error', text: s.error });
    if (c.ok) setCategories(c.data.categories);
  }, [id, adopt, loadAssets]);
  useEffect(() => {
    void load();
  }, [load]);

  const content = copy?.content ?? null;
  const dirty = copy !== null && hasUnsavedChanges(copy);
  const ctx: ValidationContext = useMemo(
    () => ({
      categories: new Map(categories.map((c) => [c.id, { active: c.active }])),
      assets: new Map(assets.map((a) => [a.id, { kind: a.kind, expressions: a.expressions, archived: a.archived, builtin: a.builtin }])),
    }),
    [categories, assets],
  );
  const issues: ContentIssue[] = useMemo(() => (content && categories.length ? validateScenario(content, ctx) : []), [content, ctx, categories.length]);

  if (!detail || !content) {
    return (
      <>
        <ActionMessage message={msg} />
        <p className="stf-lembut">Memuat skenario…</p>
      </>
    );
  }

  const canEdit = can(identity.roles, 'editScenarios') && (detail.status === 'draft' || detail.status === 'published');
  const ed: EditorProps = {
    content,
    locale: content.locales.includes(locale) ? locale : 'id',
    readOnly: !canEdit,
    issues,
    assets,
    reloadAssets: () => void loadAssets(),
    update: (fn) => setCopy((w) => (w ? editWorkingCopy(w, fn) : w)),
  };

  /**
   * Save the draft as it is now. Typing goes on while the request is out; what was typed meanwhile stays unsaved. Saves
   * run one at a time: one asked for while another is on its way (the header button, then the leave dialog) waits for
   * it, then stores only what is still unsaved, on the revision that save made (no duplicate revision, no false 409).
   */
  const save = async (): Promise<SaveOutcome> => {
    while (inFlight.current) {
      const earlier = await inFlight.current;
      if (!earlier.ok) return earlier;
    }
    const w = latest.current;
    const d = stored.current;
    if (!w || !d || !hasUnsavedChanges(w)) return { ok: true };
    const request = storeDraft(w.content, d.draftRevision);
    inFlight.current = request;
    try {
      return await request;
    } finally {
      if (inFlight.current === request) inFlight.current = null;
    }
  };

  const storeDraft = async (sent: ScenarioContent, revision: number): Promise<SaveOutcome> => {
    setSaving(true);
    setMsg(null);
    const res = await staffApi<{ scenario: ScenarioDetail }>('PUT', `/api/cms/scenarios/${id}/draft`, { content: sent, revision });
    setSaving(false);
    if (!res.ok) {
      setMsg({ kind: 'error', text: res.error });
      return { ok: false, error: res.error };
    }
    const newer = latest.current !== null && latest.current.content !== sent;
    adopt(res.data.scenario, sent);
    const saved = `Draf tersimpan (revisi ${res.data.scenario.draftRevision}).`;
    setMsg({ kind: 'ok', text: newer ? `${saved} Perubahan yang dibuat selama menyimpan belum tersimpan.` : saved });
    return { ok: true };
  };

  const act = async (path: string, body: Record<string, unknown>, okText: string): Promise<boolean> => {
    setMsg(null);
    const res = await staffApi<{ scenario?: ScenarioDetail }>('POST', path, body);
    if (!res.ok) {
      const list = (res.issues as ContentIssue[] | undefined)?.filter((i) => i.severity === 'error').slice(0, 5).map((i) => i.message) ?? [];
      setMsg({ kind: 'error', text: [res.error, ...list].join(' · ') });
      return false;
    }
    if (res.data.scenario) adopt(res.data.scenario);
    else await load();
    setMsg({ kind: 'ok', text: okText });
    return true;
  };

  const openRound = (index: number) => {
    setRoundIndex(index);
    setTab('babak');
  };
  const jump = (issue: ContentIssue) => {
    // A flag's name is edited where the flag is left (the choice) and where it takes effect.
    const flagSource = issue.field.startsWith('text.flagLabel.') ? flagsSetBefore(content, content.rounds.length).find((s) => `text.flagLabel.${s.flag}` === issue.field) : undefined;
    if (issue.round) openRound(issue.round - 1);
    else if (flagSource?.setBy[0]) openRound(flagSource.setBy[0].roundIndex);
    else if (issue.field.startsWith('endings')) setTab('akhir');
    else setTab('info');
  };

  const errors = issues.filter((i) => i.severity === 'error').length;
  const title = contentText(content, 'id', textKey.title()) || detail.title;
  return (
    <div className="cms-editor" ref={setRoot}>
      <LeaveGuard active={dirty} saving={saving} editor={root} onSave={canEdit ? save : null} />
      <div className="cms-editor-kepala">
        <div>
          <Link to="/cms" className="stf-kecil">
            ← Semua skenario
          </Link>
          <h1>{title}</h1>
          <p className="stf-kecil">
            <span className={`stf-lencana stf-lencana-${detail.status}`}>{STATUS_LABEL[detail.status]}</span> {detail.contentSource === 'demo' ? <span className="stf-lencana stf-lencana-demo">DEMO</span> : null} · revisi {detail.draftRevision}
            {detail.currentVersionNo ? ` · versi terbit ${detail.currentVersionNo}` : ''} · diubah {formatTime(detail.updatedAt)}
            {detail.updatedBy ? ` oleh ${detail.updatedBy}` : ''}
          </p>
        </div>
        <div className="cms-editor-aksi">
          {content.locales.length > 1 ? (
            <label className="cms-filter">
              <span>Bahasa teks</span>
              <select className="kolom" value={ed.locale} onChange={(e) => setLocale(e.target.value as ContentLocale)}>
                {content.locales.map((l) => (
                  <option key={l} value={l}>
                    {l === 'id' ? 'Indonesia (sumber)' : 'English'}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <span className={errors ? 'cms-isu-galat' : 'cms-isu-ok'} role="status">
            {errors ? `${errors} galat` : 'Tanpa galat'}
          </span>
          {canEdit ? (
            <button type="button" className="btn btn-utama" disabled={!dirty || saving} onClick={() => void save()}>
              {saving ? 'Menyimpan…' : dirty ? 'Simpan draf' : 'Tersimpan'}
            </button>
          ) : null}
        </div>
      </div>
      {!canEdit ? (
        <p className="stf-peringatan">
          {detail.status === 'in_review' ? 'Sedang direview: draf terkunci. ' : detail.status === 'archived' ? 'Diarsipkan: tidak bisa diubah. ' : ''}
          {can(identity.roles, 'editScenarios') ? '' : 'Peran Anda hanya dapat membaca isi skenario.'}
        </p>
      ) : detail.status === 'published' ? (
        <p className="stf-kecil">Mengubah skenario terbit membuat draf baru; versi terbit tetap dipakai room sampai versi baru diterbitkan.</p>
      ) : null}
      <ActionMessage message={msg} />
      <div className="stf-tab" role="tablist" aria-label="Bagian editor">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'validasi' && issues.length ? ` (${issues.length})` : ''}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'info' ? <InfoTab ed={ed} categories={categories} /> : null}
        {tab === 'babak' ? <RoundsTab ed={ed} selected={roundIndex} onSelect={setRoundIndex} /> : null}
        {tab === 'akhir' ? <EndingsTab ed={ed} /> : null}
        {tab === 'validasi' ? (
          <>
            <IssuesTab issues={issues} onJump={jump} />
            <ScenarioAuditPanel content={content} issues={issues} locale={ed.locale} onOpenRound={openRound} />
          </>
        ) : null}
        {tab === 'pratinjau' ? <PreviewTab ed={ed} /> : null}
        {tab === 'alur' ? (
          <WorkflowTab
            detail={detail}
            identity={identity}
            dirty={dirty}
            act={act}
            onRestore={(c, rev) => {
              ed.update(() => c);
              setTab('info');
              setMsg({ kind: 'ok', text: `Revisi ${rev} dimuat ke editor. Simpan draf untuk menjadikannya revisi terbaru.` });
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
