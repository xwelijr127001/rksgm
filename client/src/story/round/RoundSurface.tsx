/**
 * The activity of one round, picked by the content's `layout` (never by round number or scenario): chat thread, desk
 * of documents, field scene, or the legacy stage (passed in as `renderStage`, so this module stays free of the canvas
 * stage and renders in node tests). Holds what all activities share: the private reminders, the sheet (one evidence
 * item, or the field scene's picture enlarged; open state survives phase changes and ends when the round changes) and
 * the activity root with its test hook `data-aktivitas`.
 */
import { useState, type JSX, type ReactNode } from 'react';
import type { StoryPhase } from '@shared/story/protocol';
import { Reminders, type ActivityProps } from './activityParts';
import { ChatActivity } from './ChatActivity';
import { DossierActivity } from './DossierActivity';
import { EvidenceSheet, PictureSheet } from './EvidenceSheet';
import { FieldActivity, fieldPictureUrl } from './FieldActivity';
import type { RoundView, RoundViewMode } from './roundModel';

export type StageRenderer = (p: ActivityProps) => ReactNode;

/** What the sheet shows, for the round it was opened in. */
type OpenSheet = { roundId: string; evidenceId: string } | { roundId: string; picture: true };

export function RoundSurface({ view, mode, phase, decision, renderStage }: { view: RoundView; mode: RoundViewMode; phase: StoryPhase; decision?: ReactNode; renderStage: StageRenderer }): JSX.Element {
  const roundId = view.scene.roundId;
  const [open, setOpen] = useState<OpenSheet | null>(null);
  const current = open && open.roundId === roundId ? open : null;
  const item = current && 'evidenceId' in current ? (view.scene.evidence.find((e) => e.id === current.evidenceId) ?? null) : null;
  const picture = current && 'picture' in current ? fieldPictureUrl(view) : null;
  const close = () => setOpen(null);
  const taps = mode !== 'projector';
  const props: ActivityProps = {
    view,
    mode,
    phase,
    decision,
    onOpen: taps ? (evidenceId) => setOpen({ roundId, evidenceId }) : null,
    onZoom: taps ? () => setOpen({ roundId, picture: true }) : null,
  };
  const layout = view.scene.layout;
  return (
    <section className={`sr-aktivitas sr-aktivitas-${layout} sr-mode-${mode} sr-tahap-${phase}`} data-aktivitas={layout}>
      {mode === 'projector' ? null : <Reminders reminders={view.reminders} />}
      {layout === 'chat' ? <ChatActivity {...props} /> : layout === 'dossier' ? <DossierActivity {...props} /> : layout === 'field' ? <FieldActivity {...props} /> : renderStage(props)}
      <EvidenceSheet item={item} assets={view.assets} onClose={close} />
      {picture ? <PictureSheet url={picture} title={view.scene.title} onClose={close} /> : null}
    </section>
  );
}
