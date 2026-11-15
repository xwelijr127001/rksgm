/**
 * A modal sheet (a bottom sheet on phones) showing one evidence item, or the round's scene picture enlarged: native
 * modal <dialog>, so the page behind is inert and keyboard focus stays inside; Escape, the close button or a tap on the
 * backdrop close it, and focus returns to the element that opened it. Opening or closing never touches the selection,
 * the timer or the score: the tray keeps its state underneath, and while answering the sheet repeats the countdown
 * (AnswerClockContext) and the page's announcements (announcer.SheetAnnouncer), which the inert page cannot give.
 */
import { useId, useLayoutEffect, useRef, type JSX, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react';
import type { StoryEvidence } from '@shared/story/protocol';
import { t } from '../../i18n';
import type { RoomAssetMap } from '../stage/StoryStage';
import { SheetAnnouncer } from './announcer';
import { SheetClock } from './answerClock';
import { EvidenceContent, evidenceLabel, KindIcon } from './evidenceParts';

export function EvidenceSheet(p: { item: StoryEvidence | null; assets: RoomAssetMap | null; onClose: () => void }): JSX.Element | null {
  if (!p.item) return null;
  const item = p.item;
  return (
    <SheetFrame key={item.id} className={`sr-lembar-${item.kind}`} hook={{ 'data-lembar': item.id }} icon={<KindIcon kind={item.kind} />} kicker={evidenceLabel(item)} title={item.title} onClose={p.onClose}>
      <EvidenceContent item={item} assets={p.assets} />
    </SheetFrame>
  );
}

/**
 * The round's scene picture across the sheet's full width (decorative: the numbered list carries every point). On a
 * phone the sheet is no wider than the scene, so there the picture is twice as large in a frame that pans sideways,
 * starting at its middle.
 */
export function PictureSheet(p: { url: string; title: string; onClose: () => void }): JSX.Element {
  const centre = (e: SyntheticEvent<HTMLImageElement>) => {
    const frame = e.currentTarget.parentElement;
    if (frame && frame.scrollWidth > frame.clientWidth) frame.scrollLeft = (frame.scrollWidth - frame.clientWidth) / 2;
  };
  return (
    <SheetFrame className="sr-lembar-gambar" hook={{ 'data-lembar-gambar': '' }} icon={null} kicker={t('ruang.gambarAdegan')} title={p.title} onClose={p.onClose}>
      <div className="sr-lembar-gambar-geser">
        <img className="sr-lembar-gambar-isi" src={p.url} alt="" decoding="async" onLoad={centre} />
      </div>
      <p className="sr-lembar-gambar-petunjuk">{t('ruang.gambarGeser')}</p>
    </SheetFrame>
  );
}

/** Test hook of the open sheet (`data-lembar="<evidenceId>"`, or `data-lembar-gambar` for the scene picture). */
type SheetHook = { 'data-lembar': string } | { 'data-lembar-gambar': '' };

function SheetFrame(p: { className: string; hook: SheetHook; icon: ReactNode; kicker: string; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { onClose } = p;
  // The 'close' event of a close this component made itself (effect cleanup) must not close the sheet again: in
  // development the effect runs twice and the dialog is open again when that event arrives.
  const selfClosed = useRef(false);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // Browsers without modal dialogs still show the content (without the inert backdrop).
        dialog.setAttribute('open', '');
      }
    }
    return () => {
      if (dialog.open) {
        selfClosed.current = true;
        dialog.close();
      }
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  // The browser may close the dialog on its own (e.g. a repeated Escape): the page state follows.
  const onNativeClose = () => {
    if (selfClosed.current) selfClosed.current = false;
    else onClose();
  };
  // A click whose target is the dialog element itself landed on the backdrop (the frame inside covers the box).
  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };
  return (
    <dialog
      ref={ref}
      className={`sr-lembar ${p.className}`}
      {...p.hook}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Escape: let the page state close the sheet (the effect cleanup closes the dialog and returns focus).
        e.preventDefault();
        onClose();
      }}
      onClose={onNativeClose}
      onClick={onBackdrop}
    >
      <div className="sr-lembar-bingkai">
        <header className="sr-lembar-kepala">
          {p.icon}
          <div className="sr-lembar-judul">
            <span className="sr-lembar-jenis">{p.kicker}</span>
            <h2 id={titleId}>{p.title}</h2>
          </div>
          <SheetClock />
          <button type="button" className="sr-lembar-tutup" onClick={onClose}>
            <span aria-hidden="true">✕</span> {t('ruang.tutup')}
          </button>
        </header>
        <div className="sr-lembar-isi">{p.children}</div>
        <SheetAnnouncer />
      </div>
    </dialog>
  );
}
