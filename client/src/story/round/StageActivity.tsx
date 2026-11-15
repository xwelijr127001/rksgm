/**
 * Legacy stage activity (demo scenarios, v1 default layout): the scene picture (built-in pixel stage or uploaded
 * images) above the dialogue, then the question and the decision. The status lives in the round header's chip, so
 * the picture carries no second status caption. A participant can switch to the light view (text-only stage; kept on
 * this device) with a toggle button: a constant label whose pressed state says whether the light view is on.
 */
import { useState } from 'react';
import { t } from '../../i18n';
import { StoryStage } from '../stage/StoryStage';
import { Conversation } from '../ui/conversation';
import { SceneMedia } from '../ui/SceneMedia';
import { DecisionArea, PublicLesson, type ActivityProps } from './activityParts';
import { EvidenceList } from './EvidenceList';

const LIGHT_KEY = 'raksa:story:ringan';

function readLight(): boolean {
  try {
    return window.localStorage.getItem(LIGHT_KEY) === '1';
  } catch {
    return false;
  }
}

export function StageActivity(p: ActivityProps) {
  const { view, mode, phase, onOpen } = p;
  const [light, setLight] = useState(readLight);
  const stage = view.stage;
  const last = view.lines[view.lines.length - 1] ?? view.intro[view.intro.length - 1];
  const toggleLight = () => {
    const next = !light;
    setLight(next);
    try {
      window.localStorage.setItem(LIGHT_KEY, next ? '1' : '0');
    } catch {
      /* blocked storage: the choice lasts until the page closes */
    }
  };
  return (
    <>
      {stage ? (
        <div className="sr-panggung">
          <StoryStage
            scene={view.scene}
            scenario={stage.scenario}
            customerExpression={stage.customerExpression}
            moodLabel=""
            customerName={stage.scenario.customerName}
            officerName={stage.scenario.officerName ?? ''}
            assets={view.assets}
            speaking={last ? last.speaker : null}
            textOnly={light}
          />
          {mode === 'participant' ? (
            <button type="button" className="text-button sr-ringan" onClick={toggleLight} aria-pressed={light}>
              {t('ruang.tampilanRingan')}
            </button>
          ) : null}
        </div>
      ) : null}
      {light ? null : <SceneMedia mediaAssetId={view.scene.mediaAssetId} assets={view.assets} />}
      <Conversation lines={view.lines} intro={view.intro} live={mode === 'participant' && phase === 'scene'} />
      {view.scene.evidence.length ? <EvidenceList items={view.scene.evidence} variant="cards" onOpen={onOpen} assets={view.assets} /> : null}
      <DecisionArea {...p} />
      <PublicLesson view={view} phase={phase} />
    </>
  );
}
