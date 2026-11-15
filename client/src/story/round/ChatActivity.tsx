/**
 * Chat activity: ONE message thread is the place of play, with no illustration beside it. Contact header (the round's
 * respondent, else the first named sender, else the round title — never an invented person), the shared evidence
 * pinned under it as the officer's own material ("Bahan untukmu", not something the contact sent), the messages, then
 * the composer: the round's question, the five reply drafts and the send button. After close the own turn and the
 * reply continue the thread (the page's OutcomeBlock).
 */
import { t } from '../../i18n';
import { ChatHeader, ChatLine, OpeningLines } from '../ui/conversation';
import { SceneMedia } from '../ui/SceneMedia';
import { DecisionArea, PublicLesson, type ActivityProps } from './activityParts';
import { EvidenceList } from './EvidenceList';
import { chatContactOf, isPlayPhase } from './roundModel';

export function ChatActivity(p: ActivityProps) {
  const { view, mode, phase, onOpen } = p;
  const contact = chatContactOf(view.scene);
  const evidence = view.scene.evidence;
  return (
    <>
      {view.intro.length ? <OpeningLines lines={view.intro} /> : null}
      <div className="sr-chat sr-chat-aktivitas">
        <ChatHeader name={contact.name} person={contact.person} />
        {onOpen && evidence.length ? (
          <div className="sr-chat-lampiran">
            <span className="sr-chat-lampiran-label" aria-hidden="true">
              {t('ruang.bahanUntukmu')}
            </span>
            <EvidenceList items={evidence} variant="chips" onOpen={onOpen} assets={view.assets} />
          </div>
        ) : null}
        {/* Polite live region while messages arrive in the shared reading time. */}
        <ol className="sr-chat-isi" aria-live={mode === 'participant' && phase === 'scene' ? 'polite' : 'off'}>
          {view.lines.map((l) => (
            <ChatLine key={l.key} line={l} contact={contact.person ? contact.name : null} />
          ))}
        </ol>
        <SceneMedia mediaAssetId={view.scene.mediaAssetId} assets={view.assets} />
        <div className={isPlayPhase(phase) ? 'sr-chat-komposer' : 'sr-chat-lanjutan'}>
          <DecisionArea {...p} />
          <PublicLesson view={view} phase={phase} />
        </div>
      </div>
      {/* Shared screen: the attachments' contents under the thread (nobody opens them there). */}
      {onOpen ? null : <EvidenceList items={evidence} variant="chips" onOpen={null} assets={view.assets} />}
    </>
  );
}
