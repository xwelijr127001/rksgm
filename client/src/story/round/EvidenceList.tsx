/**
 * The round's shared evidence, the same for every participant and every option: attachment chips in a chat, document
 * cards on a desk, a numbered list at a field scene (numbers match the scene's markers). Each item is called by the
 * author's own word when there is one ("Daftar kontak", "Surat"), else by its kind. Each opener carries
 * `data-berkas="<evidenceId>"` and opens the item in the sheet; opening earns nothing and hints nothing. Without an
 * opener (projector) the contents are shown inline, because nobody taps a shared screen.
 */
import type { StoryEvidence } from '@shared/story/protocol';
import { t } from '../../i18n';
import type { RoomAssetMap } from '../stage/StoryStage';
import { EvidenceContent, evidenceLabel, KindIcon } from './evidenceParts';
import { showsRows } from './roundModel';

export type EvidenceListVariant = 'chips' | 'cards' | 'list';

/** What a card says under its title: the number of rows of a list, nothing else (the content is one tap away). */
function previewOf(item: StoryEvidence): string {
  return showsRows(item.kind) && item.rows.length ? t('ruang.jumlahButir', { n: item.rows.length }) : '';
}

export function EvidenceList({ items, variant, onOpen, assets }: { items: StoryEvidence[]; variant: EvidenceListVariant; onOpen: ((id: string) => void) | null; assets: RoomAssetMap | null }) {
  if (!items.length) return null;
  if (!onOpen) return <EvidenceInline items={items} variant={variant} assets={assets} />;
  if (variant === 'chips') {
    return (
      <ul className="sr-lampiran" aria-label={t('ruang.bahanUntukmu')}>
        {items.map((e) => (
          <li key={e.id}>
            <button type="button" className="sr-lampiran-chip" data-berkas={e.id} onClick={() => onOpen(e.id)}>
              <KindIcon kind={e.kind} />
              <span className="sr-lampiran-judul">{e.title}</span>
              <span className="sr-only">, {evidenceLabel(e)}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }
  if (variant === 'cards') {
    return (
      <ul className="sr-berkas-daftar" aria-label={t('ruang.berkasMeja')}>
        {items.map((e) => {
          const preview = previewOf(e);
          return (
            <li key={e.id}>
              <button type="button" className="sr-berkas-kartu" data-berkas={e.id} onClick={() => onOpen(e.id)}>
                <KindIcon kind={e.kind} />
                <span className="sr-berkas-kartu-teks">
                  <span className="sr-berkas-jenis">{evidenceLabel(e)}</span>
                  <span className="sr-berkas-judul">{e.title}</span>
                  {preview ? <span className="sr-berkas-ringkas">{preview}</span> : null}
                </span>
                <span className="sr-berkas-buka" aria-hidden="true">
                  {t('ruang.buka')} ›
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <ol className="sr-titik" aria-label={t('ruang.titikInfo')}>
      {items.map((e, i) => (
        <li key={e.id}>
          <button type="button" className="sr-titik-tombol" data-berkas={e.id} onClick={() => onOpen(e.id)}>
            <span className="sr-titik-no" aria-hidden="true">
              {i + 1}
            </span>
            <span className="sr-titik-judul">{e.title}</span>
            <span className="sr-titik-jenis">{evidenceLabel(e)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Shared screen: every item open at once (title, picture, text, rows). */
function EvidenceInline({ items, variant, assets }: { items: StoryEvidence[]; variant: EvidenceListVariant; assets: RoomAssetMap | null }) {
  return (
    <div className={`sr-berkas-tampil sr-berkas-tampil-${variant}`}>
      {items.map((e, i) => (
        <article key={e.id} className="sr-berkas-panel">
          <header className="sr-berkas-panel-kepala">
            {variant === 'list' ? (
              <span className="sr-titik-no" aria-hidden="true">
                {i + 1}
              </span>
            ) : (
              <KindIcon kind={e.kind} />
            )}
            <h3>{e.title}</h3>
            <span className="sr-berkas-jenis">{evidenceLabel(e)}</span>
          </header>
          <EvidenceContent item={e} assets={assets} />
        </article>
      ))}
    </div>
  );
}
