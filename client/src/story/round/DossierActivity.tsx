/**
 * Desk activity ("meja berkas"): a short brief, the documents on the desk as cards (each opens in the sheet: text,
 * checklist, timeline, comparison or photo), then the round's question and five concise actions. After close the
 * result card (the page's OutcomeBlock) lies under the documents, which stay openable.
 */
import { DialogueList, OpeningLines } from '../ui/conversation';
import { SceneMedia } from '../ui/SceneMedia';
import { DecisionArea, PublicLesson, type ActivityProps } from './activityParts';
import { EvidenceList } from './EvidenceList';

export function DossierActivity(p: ActivityProps) {
  const { view, phase, onOpen } = p;
  return (
    <>
      {view.intro.length ? <OpeningLines lines={view.intro} /> : null}
      {view.lines.length ? (
        <div className="sr-ringkasan">
          <DialogueList lines={view.lines} />
        </div>
      ) : null}
      <SceneMedia mediaAssetId={view.scene.mediaAssetId} assets={view.assets} />
      {view.scene.evidence.length ? (
        <div className="sr-meja">
          <EvidenceList items={view.scene.evidence} variant="cards" onOpen={onOpen} assets={view.assets} />
        </div>
      ) : null}
      <DecisionArea {...p} />
      <PublicLesson view={view} phase={phase} />
    </>
  );
}
