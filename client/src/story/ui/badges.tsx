/**
 * Words and badges shared by the room, the projector, the CMS preview and the final summary. No canvas or page
 * imports, so round components using them render in node tests.
 */
import type { MoodBand } from '@shared/story/content';
import type { DecisionOutcome } from '@shared/story/engine';
import { t } from '../../i18n';

export const outcomeLabel = (o: DecisionOutcome): string => t(`ruang.hasil.${o}`);

/** Status word of a mood band: the scenario's own words when it has them (StoryScenarioLabel.moodLabels), else the default words. */
export const moodLabel = (b: MoodBand, labels?: Record<MoodBand, string> | null): string => labels?.[b] || t(`ruang.mood.${b}`);

/**
 * "★ Babak kunci" with what it means: a hover title for pointers, the same sentence read out after the badge (the
 * lobby explains it to everybody once).
 */
export function KeyRoundBadge() {
  const meaning = t('ruang.babakKunciArti');
  return (
    <span className="sr-tanda-kunci" title={meaning}>
      <span aria-hidden="true">★</span> {t('ruang.babakKunci')}
      <span className="sr-only">: {meaning}</span>
    </span>
  );
}

/** Outcome of a decision as icon + word (never colour only); shown only after the answers are closed. */
export function OutcomeBadge({ outcome }: { outcome: DecisionOutcome }) {
  const icon = outcome === 'tepat' ? '✓' : outcome === 'kurang_tepat' ? '◐' : outcome === 'keliru' ? '✕' : '⏱';
  return (
    <span className={`sr-hasil sr-hasil-${outcome}`}>
      <span aria-hidden="true">{icon}</span> {outcomeLabel(outcome)}
    </span>
  );
}
