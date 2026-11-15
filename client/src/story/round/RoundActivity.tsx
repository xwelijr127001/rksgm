/**
 * Public entry of a round's activity for the participant room, the projector (mode 'projector') and the CMS preview
 * (mode 'preview'). The view comes in personalized (roundModel.roundViewOf + personalize*).
 *
 * `decision` is the page's slot under the activity's question, placed by the activity (chat: inside the thread's
 * composer; desk/field/stage: under the documents or the scene): the DecisionTray while the round is played
 * (scene/answering) and the OutcomeBlock once the answers are closed. RoundActivity never renders an OutcomeBlock
 * itself (the block needs the page's officer name and status words); `view.outcome` only tells it that a private
 * outcome is on screen, so it hides the public lesson. The projector passes no decision: it shows the question, the
 * evidence contents inline, field markers, and the lesson after close.
 */
import type { JSX, ReactNode } from 'react';
import type { StoryPhase } from '@shared/story/protocol';
import type { ActivityProps } from './activityParts';
import type { RoundView, RoundViewMode } from './roundModel';
import { RoundSurface } from './RoundSurface';
import { StageActivity } from './StageActivity';

export type { RoundMood, RoundStageInfo, RoundView, RoundViewMode } from './roundModel';

const renderStage = (p: ActivityProps) => <StageActivity {...p} />;

export function RoundActivity(p: { view: RoundView; mode: RoundViewMode; decision?: ReactNode; phase: StoryPhase }): JSX.Element {
  return <RoundSurface view={p.view} mode={p.mode} phase={p.phase} decision={p.decision} renderStage={renderStage} />;
}
