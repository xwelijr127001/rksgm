/**
 * Asset library (PRD FR-A9, FR-E4): backgrounds, characters with expression variants, photos, videos and BGM, each with
 * source/license/rights/usage metadata. Built-in assets are the project's pixel art (rendered by client code, no file).
 *
 * Upload safety:
 *  - File type is detected from MAGIC BYTES only (client name/Content-Type are ignored), so SVG/HTML/scripts cannot
 *    pass as images; only png/jpg/webp images, mp3/ogg audio and mp4/webm video are stored.
 *  - Stored name = SHA-256 prefix of the content + detected extension; served by `/aset-cerita/<name>` with a strict
 *    name pattern (no path separators -> no traversal) and `nosniff`.
 */
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../../config';
import { getDb } from '../../db';
import { ASSET_KINDS, type AssetKind } from '../../../../shared/story/content';
import { writeAudit, type AuditActor } from '../auth/audit';
import type { AssetMeta, AssetView } from '../../../../shared/story/dto';
import type { ValidationAsset } from '../../../../shared/story/validate';
export type { AssetMeta, AssetView };

export const ASSET_FILE_PATTERN = /^[a-f0-9]{32}\.(png|jpg|webp|mp3|ogg|mp4|webm)$/;
export const ASSET_URL_PREFIX = '/aset-cerita/';

type Detected = { ext: 'png' | 'jpg' | 'webp' | 'mp3' | 'ogg' | 'mp4' | 'webm'; mime: string; family: 'image' | 'audio' | 'video' };

export const ASSET_SIZE_LIMIT: Record<Detected['family'], number> = {
  image: 6 * 1024 * 1024,
  audio: 15 * 1024 * 1024,
  video: 60 * 1024 * 1024,
};

/** Which file families each asset kind accepts. */
const FAMILY_FOR_KIND: Record<AssetKind, Detected['family']> = {
  background: 'image',
  character: 'image',
  photo: 'image',
  video: 'video',
  bgm: 'audio',
};

export function detectFile(buf: Uint8Array): Detected | null {
  if (buf.length < 12) return null;
  const at = (offset: number, ...bytes: number[]) => bytes.every((b, i) => buf[offset + i] === b);
  const ascii = (offset: number, s: string) => [...s].every((c, i) => buf[offset + i] === c.charCodeAt(0));
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { ext: 'png', mime: 'image/png', family: 'image' };
  if (at(0, 0xff, 0xd8, 0xff)) return { ext: 'jpg', mime: 'image/jpeg', family: 'image' };
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return { ext: 'webp', mime: 'image/webp', family: 'image' };
  if (ascii(0, 'ID3') || (buf[0] === 0xff && ((buf[1] ?? 0) & 0xe0) === 0xe0)) return { ext: 'mp3', mime: 'audio/mpeg', family: 'audio' };
  if (ascii(0, 'OggS')) return { ext: 'ogg', mime: 'audio/ogg', family: 'audio' };
  if (ascii(4, 'ftyp')) return { ext: 'mp4', mime: 'video/mp4', family: 'video' };
  if (at(0, 0x1a, 0x45, 0xdf, 0xa3)) return { ext: 'webm', mime: 'video/webm', family: 'video' };
  return null;
}

export function assetFolder(): string {
  return path.join(path.dirname(CONFIG.dbFile), 'aset-cerita');
}

export class AssetError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

/** Store bytes for `kind`; returns stored file name. Idempotent for identical content. */
export function storeAssetFile(buf: Buffer, kind: AssetKind): { fileName: string; mime: string; size: number } {
  if (!Buffer.isBuffer(buf) || buf.length === 0) throw new AssetError('Berkas kosong.');
  const det = detectFile(buf);
  const family = FAMILY_FOR_KIND[kind];
  if (!det || det.family !== family) {
    const allowed = family === 'image' ? 'PNG, JPEG, atau WebP' : family === 'audio' ? 'MP3 atau OGG' : 'MP4 atau WebM';
    throw new AssetError(`Jenis berkas tidak sesuai. Untuk aset ini gunakan ${allowed}.`, 415);
  }
  if (buf.length > ASSET_SIZE_LIMIT[family]) throw new AssetError(`Berkas terlalu besar (maks ${Math.round(ASSET_SIZE_LIMIT[family] / 1048576)} MB).`, 413);
  const fileName = createHash('sha256').update(buf).digest('hex').slice(0, 32) + '.' + det.ext;
  const folder = assetFolder();
  fs.mkdirSync(folder, { recursive: true });
  const target = path.join(folder, fileName);
  if (!fs.existsSync(target)) {
    const tmp = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, target);
  }
  return { fileName, mime: det.mime, size: buf.length };
}

interface AssetRow {
  id: string;
  kind: string;
  title: string;
  collection: string;
  builtin: number;
  file_name: string | null;
  mime: string | null;
  size_bytes: number | null;
  expressions_json: string;
  source: string;
  license: string;
  rights_holder: string;
  usage_notes: string;
  archived: number;
  created_at: number;
  updated_at: number;
}

function parseList(s: string): string[] {
  try {
    const v = JSON.parse(s) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function toView(r: AssetRow): AssetView {
  const variants = getDb().prepare('SELECT variant, file_name FROM story_asset_variants WHERE asset_id = ? ORDER BY variant').all(r.id) as { variant: string; file_name: string }[];
  return {
    id: r.id,
    kind: r.kind as AssetKind,
    title: r.title,
    collection: r.collection,
    builtin: r.builtin === 1,
    url: r.file_name ? ASSET_URL_PREFIX + r.file_name : null,
    mime: r.mime,
    sizeBytes: r.size_bytes,
    expressions: r.builtin === 1 ? parseList(r.expressions_json) : variants.map((v) => v.variant),
    variantUrls: Object.fromEntries(variants.map((v) => [v.variant, ASSET_URL_PREFIX + v.file_name])),
    source: r.source,
    license: r.license,
    rightsHolder: r.rights_holder,
    usageNotes: r.usage_notes,
    archived: r.archived === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listAssets(opts: { kind?: AssetKind; includeArchived?: boolean } = {}): AssetView[] {
  const where: string[] = [];
  const args: unknown[] = [];
  if (opts.kind) {
    where.push('kind = ?');
    args.push(opts.kind);
  }
  if (!opts.includeArchived) where.push('archived = 0');
  const rows = getDb()
    .prepare(`SELECT * FROM story_assets ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY builtin DESC, kind, collection, title`)
    .all(...args) as AssetRow[];
  return rows.map(toView);
}

export function getAsset(id: string): AssetView | undefined {
  const r = getDb().prepare('SELECT * FROM story_assets WHERE id = ?').get(id) as AssetRow | undefined;
  return r ? toView(r) : undefined;
}

/** Map used by content validation (all assets; archived and built-in ones flagged: built-ins have no image file). */
export function assetValidationMap(): Map<string, ValidationAsset> {
  return new Map(listAssets({ includeArchived: true }).map((a) => [a.id, { kind: a.kind, expressions: a.expressions, archived: a.archived, builtin: a.builtin }]));
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n) : '');

export function cleanAssetMeta(raw: unknown): AssetMeta {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    title: clip(o.title, 80),
    collection: clip(o.collection, 60),
    source: clip(o.source, 200),
    license: clip(o.license, 200),
    rightsHolder: clip(o.rightsHolder, 120),
    usageNotes: clip(o.usageNotes, 400),
  };
}

export function isAssetKind(v: unknown): v is AssetKind {
  return typeof v === 'string' && (ASSET_KINDS as readonly string[]).includes(v);
}

/** Rights metadata is mandatory for uploads (FR-E4 "beserta keterangan hak pakainya"). */
function requireMeta(meta: AssetMeta): void {
  if (!meta.title) throw new AssetError('Judul aset wajib diisi.');
  if (!meta.source) throw new AssetError('Sumber aset wajib diisi (pembuat/asal berkas).');
  if (!meta.license) throw new AssetError('Keterangan hak pakai/lisensi wajib diisi.');
}

export function createUploadedAsset(kind: AssetKind, buf: Buffer, meta: AssetMeta, actor: AuditActor, expression?: string): AssetView {
  requireMeta(meta);
  const file = storeAssetFile(buf, kind);
  const db = getDb();
  const id = `asset:${randomUUID().slice(0, 12)}`;
  const now = Date.now();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO story_assets (id, kind, title, collection, builtin, file_name, mime, size_bytes, expressions_json, source, license, rights_holder, usage_notes, archived, created_at, created_by, updated_at, updated_by)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, '[]', ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    ).run(id, kind, meta.title, meta.collection, file.fileName, file.mime, file.size, meta.source, meta.license, meta.rightsHolder, meta.usageNotes, now, actor.id, now, actor.id);
    if (kind === 'character') {
      const expr = cleanExpression(expression) || 'netral';
      db.prepare('INSERT INTO story_asset_variants (asset_id, variant, file_name, mime, size_bytes) VALUES (?, ?, ?, ?, ?)').run(id, expr, file.fileName, file.mime, file.size);
    }
    writeAudit(actor, 'asset.upload', 'asset', id, { kind, title: meta.title, file: file.fileName, size: file.size });
  })();
  return getAsset(id)!;
}

function cleanExpression(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) : '';
}

/** Add/replace one expression image of an uploaded character. */
export function putCharacterVariant(assetId: string, expression: unknown, buf: Buffer, actor: AuditActor): AssetView {
  const asset = getAsset(assetId);
  if (!asset) throw new AssetError('Aset tidak ditemukan.', 404);
  if (asset.kind !== 'character' || asset.builtin) throw new AssetError('Ekspresi hanya bisa ditambahkan ke karakter unggahan.');
  const expr = cleanExpression(expression);
  if (!expr) throw new AssetError('Nama ekspresi wajib diisi (huruf kecil, mis. "senang").');
  const file = storeAssetFile(buf, 'character');
  getDb()
    .prepare(
      `INSERT INTO story_asset_variants (asset_id, variant, file_name, mime, size_bytes) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(asset_id, variant) DO UPDATE SET file_name = excluded.file_name, mime = excluded.mime, size_bytes = excluded.size_bytes`,
    )
    .run(assetId, expr, file.fileName, file.mime, file.size);
  writeAudit(actor, 'asset.variant', 'asset', assetId, { expression: expr, file: file.fileName });
  return getAsset(assetId)!;
}

export function updateAssetMeta(assetId: string, meta: AssetMeta, actor: AuditActor): AssetView {
  const asset = getAsset(assetId);
  if (!asset) throw new AssetError('Aset tidak ditemukan.', 404);
  requireMeta(meta);
  getDb()
    .prepare('UPDATE story_assets SET title = ?, collection = ?, source = ?, license = ?, rights_holder = ?, usage_notes = ?, updated_at = ?, updated_by = ? WHERE id = ?')
    .run(meta.title, meta.collection, meta.source, meta.license, meta.rightsHolder, meta.usageNotes, Date.now(), actor.id, assetId);
  writeAudit(actor, 'asset.meta', 'asset', assetId, { title: meta.title });
  return getAsset(assetId)!;
}

/**
 * Archive hides an asset from pickers and blocks NEW publications that reference it. Published versions and running
 * rooms keep working: files are never deleted, so historical sessions stay renderable.
 */
export function setAssetArchived(assetId: string, archived: boolean, actor: AuditActor): AssetView {
  const asset = getAsset(assetId);
  if (!asset) throw new AssetError('Aset tidak ditemukan.', 404);
  getDb().prepare('UPDATE story_assets SET archived = ?, updated_at = ?, updated_by = ? WHERE id = ?').run(archived ? 1 : 0, Date.now(), actor.id, assetId);
  writeAudit(actor, archived ? 'asset.archive' : 'asset.unarchive', 'asset', assetId, { title: asset.title });
  return getAsset(assetId)!;
}
