/**
 * Asset library (PRD FR-A9 author selection, FR-E4 admin upload): backgrounds, characters with expressions, evidence
 * photos, video and BGM, each with source/license/rights/usage metadata. Uploads are checked by file signature and
 * size on the server (no SVG/HTML), stored under content-addressed names and served with nosniff + sandbox CSP.
 */
import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { ASSET_KINDS, type AssetKind } from '@shared/story/content';
import type { AssetMeta, AssetView } from '@shared/story/dto';
import { can, type StaffIdentity } from '@shared/story/roles';
import { withBase } from '../../story/base';
import { staffApi, staffUpload } from '../../story/staff';
import { ActionMessage } from '../../story/ui/StaffShell';
import { ASSET_KIND_LABEL } from './labels';

const ACCEPT: Record<AssetKind, string> = {
  background: 'image/png,image/jpeg,image/webp',
  character: 'image/png,image/jpeg,image/webp',
  photo: 'image/png,image/jpeg,image/webp',
  video: 'video/mp4,video/webm',
  bgm: 'audio/mpeg,audio/ogg',
};
const EMPTY_META: AssetMeta = { title: '', collection: '', source: '', license: '', rightsHolder: '', usageNotes: '' };
const META_FIELDS: { key: keyof AssetMeta; label: string; required?: boolean; hint?: string }[] = [
  { key: 'title', label: 'Judul', required: true },
  { key: 'collection', label: 'Koleksi/folder', hint: 'Mis. "Auto — bengkel"' },
  { key: 'source', label: 'Sumber', required: true, hint: 'Siapa pembuat/asal berkas' },
  { key: 'license', label: 'Lisensi / hak pakai', required: true, hint: 'Mis. "Milik Raksa", "CC BY 4.0"' },
  { key: 'rightsHolder', label: 'Pemegang hak' },
  { key: 'usageNotes', label: 'Catatan pemakaian', hint: 'Batasan pemakaian, persetujuan, dll.' },
];

type Msg = { kind: 'ok' | 'error'; text: string } | null;

export function AssetLibrary({ identity }: { identity: StaffIdentity }) {
  const manage = can(identity.roles, 'manageAssets');
  const [kind, setKind] = useState<AssetKind | ''>('');
  const [archived, setArchived] = useState(false);
  const [assets, setAssets] = useState<AssetView[] | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (kind) q.set('kind', kind);
    if (archived) q.set('archived', '1');
    const r = await staffApi<{ assets: AssetView[] }>('GET', `/api/cms/assets?${q.toString()}`);
    if (r.ok) setAssets(r.data.assets);
    else setMsg({ kind: 'error', text: r.error });
  }, [kind, archived]);
  useEffect(() => {
    void load();
  }, [load]);
  if (!can(identity.roles, 'readAssets')) return <p className="stf-galat">Peran Anda tidak dapat membuka pustaka aset.</p>;
  return (
    <>
      <div className="stf-judul-baris">
        <h1>Pustaka aset</h1>
        <div className="stf-tombol">
          <label className="cms-filter">
            <span>Jenis</span>
            <select className="kolom" value={kind} onChange={(e) => setKind(e.target.value as AssetKind | '')}>
              <option value="">Semua</option>
              {ASSET_KINDS.map((k) => (
                <option key={k} value={k}>
                  {ASSET_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="stf-centang">
            <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            <span>Tampilkan yang diarsipkan</span>
          </label>
        </div>
      </div>
      <ActionMessage message={msg} />
      {manage ? <UploadForm onDone={(text) => { setMsg({ kind: 'ok', text }); void load(); }} onError={(text) => setMsg({ kind: 'error', text })} /> : <p className="stf-kecil">Penulis memilih aset di editor skenario; unggah & penataan aset dilakukan admin sistem (FR-E4).</p>}
      {assets === null ? (
        <p className="stf-lembut">Memuat…</p>
      ) : (
        <div className="cms-aset-daftar">
          {assets.map((a) => (
            <AssetCard key={a.id} asset={a} manage={manage && !a.builtin} onChanged={(text) => { setMsg({ kind: 'ok', text }); void load(); }} onError={(text) => setMsg({ kind: 'error', text })} />
          ))}
        </div>
      )}
    </>
  );
}

function MetaInputs({ meta, onChange, idPrefix }: { meta: AssetMeta; onChange: (m: AssetMeta) => void; idPrefix: string }) {
  return (
    <div className="stf-grid">
      {META_FIELDS.map((f) => (
        <div className="stf-isian" key={f.key}>
          <label htmlFor={idPrefix + f.key}>
            {f.label}
            {f.required ? ' *' : ''}
          </label>
          <input id={idPrefix + f.key} className="kolom" value={meta[f.key]} required={f.required} onChange={(e) => onChange({ ...meta, [f.key]: e.target.value })} />
          {f.hint ? <small>{f.hint}</small> : null}
        </div>
      ))}
    </div>
  );
}

function UploadForm({ onDone, onError }: { onDone: (text: string) => void; onError: (text: string) => void }) {
  const id = useId();
  const [kind, setKind] = useState<AssetKind>('background');
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<AssetMeta>(EMPTY_META);
  const [expression, setExpression] = useState('netral');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    const query: Record<string, string> = { kind, ...meta };
    if (kind === 'character') query.expression = expression;
    const r = await staffUpload<{ asset: AssetView }>('/api/cms/assets', file, query);
    setBusy(false);
    if (r.ok) {
      setMeta(EMPTY_META);
      setFile(null);
      onDone(`Aset "${r.data.asset.title}" diunggah.`);
    } else onError(r.error);
  };
  return (
    <details className="stf-kartu">
      <summary>
        <b>+ Unggah aset</b>
      </summary>
      <form onSubmit={submit}>
        <div className="stf-grid">
          <div className="stf-isian">
            <label htmlFor={id + 'k'}>Jenis</label>
            <select id={id + 'k'} className="kolom" value={kind} onChange={(e) => setKind(e.target.value as AssetKind)}>
              {ASSET_KINDS.map((k) => (
                <option key={k} value={k}>
                  {ASSET_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="stf-isian">
            <label htmlFor={id + 'f'}>Berkas *</label>
            <input id={id + 'f'} className="kolom" type="file" accept={ACCEPT[kind]} onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
            <small>Gambar PNG/JPG/WebP maks 6 MB · audio MP3/OGG maks 15 MB · video MP4/WebM maks 60 MB.</small>
          </div>
          {kind === 'character' ? (
            <div className="stf-isian">
              <label htmlFor={id + 'e'}>Nama ekspresi gambar ini</label>
              <input id={id + 'e'} className="kolom" value={expression} onChange={(e) => setExpression(e.target.value)} />
              <small>Ekspresi lain ditambahkan setelah unggah (mis. cemas, lega, senang).</small>
            </div>
          ) : null}
        </div>
        <MetaInputs meta={meta} onChange={setMeta} idPrefix={id} />
        <p className="stf-kecil">Jangan unggah foto orang nyata, data polis/klaim, atau aset tanpa hak pakai yang jelas.</p>
        <button className="btn" type="submit" disabled={busy || !file || !meta.title.trim() || !meta.source.trim() || !meta.license.trim()}>
          {busy ? 'Mengunggah…' : 'Unggah'}
        </button>
      </form>
    </details>
  );
}

function AssetPreview({ asset }: { asset: AssetView }) {
  if (asset.builtin) return <div className="cms-aset-bawaan">Bawaan game</div>;
  if (!asset.url) return null;
  const url = withBase(asset.url);
  if (asset.kind === 'bgm') return <audio controls preload="none" src={url} />;
  if (asset.kind === 'video') return <video controls preload="metadata" src={url} muted playsInline />;
  return <img src={url} alt="" loading="lazy" />;
}

function AssetCard({ asset, manage, onChanged, onError }: { asset: AssetView; manage: boolean; onChanged: (text: string) => void; onError: (text: string) => void }) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [meta, setMeta] = useState<AssetMeta>({ title: asset.title, collection: asset.collection, source: asset.source, license: asset.license, rightsHolder: asset.rightsHolder, usageNotes: asset.usageNotes });
  const [variantName, setVariantName] = useState('');
  const [variantFile, setVariantFile] = useState<File | null>(null);
  const saveMeta = async () => {
    const r = await staffApi<{ asset: AssetView }>('PUT', `/api/cms/assets/${encodeURIComponent(asset.id)}`, meta);
    if (r.ok) {
      setEditing(false);
      onChanged('Metadata aset disimpan.');
    } else onError(r.error);
  };
  const toggleArchive = async () => {
    const r = await staffApi<{ asset: AssetView }>('POST', `/api/cms/assets/${encodeURIComponent(asset.id)}/archive`, { archived: !asset.archived });
    if (r.ok) onChanged(asset.archived ? 'Aset dipulihkan.' : 'Aset diarsipkan. Skenario yang memakainya gagal validasi terbit sampai asetnya diganti.');
    else onError(r.error);
  };
  const addVariant = async () => {
    if (!variantFile || !variantName.trim()) return;
    const r = await staffUpload<{ asset: AssetView }>(`/api/cms/assets/${encodeURIComponent(asset.id)}/variants`, variantFile, { expression: variantName.trim() });
    if (r.ok) {
      setVariantName('');
      setVariantFile(null);
      onChanged(`Ekspresi "${variantName.trim()}" ditambahkan.`);
    } else onError(r.error);
  };
  return (
    <article className={`stf-kartu cms-aset${asset.archived ? ' diarsipkan' : ''}`}>
      <div className="cms-aset-pratinjau">
        <AssetPreview asset={asset} />
      </div>
      <h3>{asset.title}</h3>
      <p className="stf-kecil">
        {ASSET_KIND_LABEL[asset.kind]}
        {asset.builtin ? ' · bawaan' : ''}
        {asset.archived ? ' · DIARSIPKAN' : ''}
        {asset.sizeBytes ? ` · ${Math.round(asset.sizeBytes / 1024)} KB` : ''}
      </p>
      {asset.expressions.length ? <p className="stf-kecil">Ekspresi: {asset.expressions.join(', ')}</p> : null}
      {editing ? (
        <>
          <MetaInputs meta={meta} onChange={setMeta} idPrefix={id} />
          <div className="stf-tombol">
            <button type="button" className="btn btn-kecil" onClick={() => void saveMeta()}>
              Simpan
            </button>
            <button type="button" className="btn btn-netral btn-kecil" onClick={() => setEditing(false)}>
              Batal
            </button>
          </div>
        </>
      ) : (
        <dl className="cms-aset-meta">
          <dt>Sumber</dt>
          <dd>{asset.source || '—'}</dd>
          <dt>Lisensi</dt>
          <dd>{asset.license || '—'}</dd>
          {asset.rightsHolder ? (
            <>
              <dt>Pemegang hak</dt>
              <dd>{asset.rightsHolder}</dd>
            </>
          ) : null}
          {asset.usageNotes ? (
            <>
              <dt>Catatan</dt>
              <dd>{asset.usageNotes}</dd>
            </>
          ) : null}
        </dl>
      )}
      {manage && !editing ? (
        <div className="stf-tombol">
          <button type="button" className="btn btn-netral btn-kecil" onClick={() => setEditing(true)}>
            Ubah metadata
          </button>
          <button type="button" className="btn btn-netral btn-kecil" onClick={() => void toggleArchive()}>
            {asset.archived ? 'Pulihkan' : 'Arsipkan'}
          </button>
        </div>
      ) : null}
      {manage && asset.kind === 'character' && !asset.archived ? (
        <details className="cms-varian">
          <summary>Tambah ekspresi</summary>
          <div className="stf-isian">
            <label htmlFor={id + 'vn'}>Nama ekspresi</label>
            <input id={id + 'vn'} className="kolom" value={variantName} onChange={(e) => setVariantName(e.target.value)} />
          </div>
          <div className="stf-isian">
            <label htmlFor={id + 'vf'}>Gambar</label>
            <input id={id + 'vf'} className="kolom" type="file" accept={ACCEPT.character} onChange={(e) => setVariantFile(e.target.files?.[0] ?? null)} />
          </div>
          <button type="button" className="btn btn-kecil" disabled={!variantFile || !variantName.trim()} onClick={() => void addVariant()}>
            Tambah
          </button>
        </details>
      ) : null}
    </article>
  );
}
