/**
 * What one evidence item shows (shared by the evidence sheet and the projector's inline evidence): its picture, its
 * text and, for checklists, timelines and comparisons, its rows with status marks as icon + word (never colour only).
 * A picture that fails to load (or has no file) leaves a short note; the text and rows stay readable.
 */
import { useState } from 'react';
import type { EvidenceKind, EvidenceMark } from '@shared/story/content';
import type { StoryEvidence, StoryEvidenceRow } from '@shared/story/protocol';
import { t } from '../../i18n';
import { withBase } from '../base';
import type { RoomAssetMap } from '../stage/StoryStage';
import { markWordKey, showsRows } from './roundModel';

const kindWord = (kind: EvidenceKind): string => t(`ruang.jenis.${kind}`);

/** What an item is called above its title: the author's own word ("Daftar kontak", "Surat"), else its kind's word. */
export const evidenceLabel = (item: Pick<StoryEvidence, 'kind' | 'kicker'>): string => item.kicker.trim() || kindWord(item.kind);

const MARK_ICON: Record<EvidenceMark, string> = { none: '', ok: '✓', pending: '◷', missing: '✕', check: '?' };

/** Small line icon per evidence kind (decorative: the kind is always written next to it). */
export function KindIcon({ kind }: { kind: EvidenceKind }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (kind) {
    case 'checklist':
      return (
        <svg {...common} className="sr-ikon-berkas">
          <path d="M9 6h11M9 12h11M9 18h11" />
          <path d="m3.5 6 1.2 1.2L7 4.8M3.5 12l1.2 1.2L7 10.8M3.5 18l1.2 1.2L7 16.8" />
        </svg>
      );
    case 'timeline':
      return (
        <svg {...common} className="sr-ikon-berkas">
          <circle cx="5" cy="6" r="2" />
          <circle cx="5" cy="18" r="2" />
          <path d="M5 8v8M10 6h10M10 18h10M10 12h6" />
        </svg>
      );
    case 'compare':
      return (
        <svg {...common} className="sr-ikon-berkas">
          <rect x="3" y="4" width="7.5" height="16" rx="1.5" />
          <rect x="13.5" y="4" width="7.5" height="16" rx="1.5" />
          <path d="M5.5 9h2.5M16 9h2.5M5.5 13h2.5M16 13h2.5" />
        </svg>
      );
    case 'photo':
      return (
        <svg {...common} className="sr-ikon-berkas">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="m4 18 5.5-5 4 3.5 2.5-2 4 3.5" />
        </svg>
      );
    default:
      return (
        <svg {...common} className="sr-ikon-berkas">
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v4h4M9 11h6M9 15h6" />
        </svg>
      );
  }
}

/** A row's status as icon + word in its kind ("✓ Ada", "◷ Berjalan", "? Perlu dicek"); nothing for `none`. */
function MarkWord({ kind, mark }: { kind: EvidenceKind; mark: EvidenceMark }) {
  const key = markWordKey(kind, mark);
  if (!key) return null;
  return (
    <span className={`sr-tanda sr-tanda-${mark}`}>
      <span aria-hidden="true">{MARK_ICON[mark]}</span> {t(key)}
    </span>
  );
}

function EvidenceRows({ kind, rows }: { kind: EvidenceKind; rows: StoryEvidenceRow[] }) {
  if (kind === 'timeline') {
    return (
      <ol className="sr-alur">
        {rows.map((r) => (
          <li key={r.id} className={`sr-alur-langkah sr-tanda-baris-${r.mark}`}>
            <span className="sr-alur-label">{r.label}</span>
            {r.value ? <span className="sr-alur-nilai">{r.value}</span> : null}
            <MarkWord kind={kind} mark={r.mark} />
          </li>
        ))}
      </ol>
    );
  }
  if (kind === 'compare') {
    return (
      <dl className="sr-banding">
        {rows.map((r) => (
          <div key={r.id} className="sr-banding-baris">
            <dt>{r.label}</dt>
            <dd>{r.value || '—'}</dd>
            {r.mark !== 'none' ? (
              <dd className="sr-banding-tanda">
                <MarkWord kind={kind} mark={r.mark} />
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    );
  }
  return (
    <ul className="sr-periksa">
      {rows.map((r) => (
        <li key={r.id} className={`sr-periksa-baris sr-tanda-baris-${r.mark}`}>
          <span className="sr-periksa-label">
            {r.label}
            {r.value ? <span className="sr-periksa-nilai">{r.value}</span> : null}
          </span>
          <MarkWord kind={kind} mark={r.mark} />
        </li>
      ))}
    </ul>
  );
}

/** The evidence picture; an image without a file or a broken one leaves a note (the rest of the item stays usable). */
function EvidenceImage({ assetId, assets, alt }: { assetId: string; assets: RoomAssetMap | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  // An id the room's asset list does not hold (yet): the list may still be loading or be the previous round's. Show
  // nothing rather than a premature failure note; the picture appears once the round's list arrives.
  const asset = assets?.get(assetId);
  if (!asset) return null;
  const url = asset.url ? withBase(asset.url) : null;
  if (!url || failed) return <p className="sr-berkas-gagal">{t('ruang.gambarGagal')}</p>;
  return <img className="sr-berkas-gambar" src={url} alt={alt} decoding="async" onError={() => setFailed(true)} />;
}

export function EvidenceContent({ item, assets }: { item: StoryEvidence; assets: RoomAssetMap | null }) {
  return (
    <div className={`sr-berkas-isi sr-berkas-isi-${item.kind}`}>
      {item.assetId ? <EvidenceImage assetId={item.assetId} assets={assets} alt={item.title} /> : null}
      {item.body ? <p className="sr-berkas-teks">{item.body}</p> : null}
      {showsRows(item.kind) && item.rows.length ? <EvidenceRows kind={item.kind} rows={item.rows} /> : null}
    </div>
  );
}
