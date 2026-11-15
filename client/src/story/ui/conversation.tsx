/**
 * Lines of a scene: the dialogue list (stage look), the opening lines (round 1) under their label, and the pieces of
 * a messaging-app thread used by the chat activity (contact header; customer/cast incoming on the left, officer
 * outgoing on the right, narration as a small centered note; no app brand marks). Presentation only: callers pass
 * lines already merged (public + the participant's own conditional lines), cut for the reveal and personalized
 * ({nama} substituted).
 */
import type { JSX } from 'react';
import type { Speaker } from '@shared/story/content';
import { t } from '../../i18n';
import { initialsOf } from '../sceneLines';

export interface ConversationLine {
  key: string;
  speaker: Speaker;
  /** Display name (customer/officer/cast); null for narration. */
  name: string | null;
  /** Personalized text. */
  text: string;
}

/** The stage conversation: opening lines first, then the dialogue list, in ONE live region while lines reveal. */
export function Conversation(p: {
  /** Already merged/ordered and personalized. */
  lines: ConversationLine[];
  /** Shown first under a "Pembuka" label. */
  intro?: ConversationLine[];
  /** aria-live polite while lines reveal. */
  live?: boolean;
}): JSX.Element {
  const intro = p.intro ?? [];
  return (
    <div className="sr-percakapan sr-percakapan-stage" aria-live={p.live ? 'polite' : 'off'}>
      {intro.length ? <OpeningLines lines={intro} /> : null}
      <DialogueList lines={p.lines} />
    </div>
  );
}

/** The opening lines under their "Pembuka" label (dialogue list look). */
export function OpeningLines({ lines }: { lines: ConversationLine[] }) {
  return (
    <section className="sr-pembuka">
      <span className="sr-pembuka-label">{t('ruang.pembuka')}</span>
      <DialogueList lines={lines} />
    </section>
  );
}

export function DialogueList({ lines }: { lines: ConversationLine[] }) {
  return (
    <ol className="sr-dialog">
      {lines.map((l) => (
        <li key={l.key} className={`sr-baris sr-baris-${l.speaker}`}>
          {l.speaker !== 'narrator' && l.name ? <span className="sr-baris-siapa">{l.name}</span> : null}
          <span className="sr-baris-teks">{l.text}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Chat header: the contact's initials (a chat icon when no person is named) and name. `person` false = the header
 * names the round, not someone the player writes to.
 */
export function ChatHeader({ name, person = true }: { name: string; person?: boolean }) {
  return (
    <div className="sr-chat-kepala">
      <span className={`sr-chat-avatar${person ? '' : ' sr-chat-avatar-ikon'}`} aria-hidden="true">
        {person ? (
          initialsOf(name)
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M4 5h16v11H9l-5 4z" />
          </svg>
        )}
      </span>
      <span className="sr-chat-kontak">
        <b>{name}</b>
        <span>{t('ruang.chatKeterangan')}</span>
      </span>
    </div>
  );
}

/**
 * One chat line: narration as a centered note, the officer as the outgoing side, everyone else incoming. The sender is
 * written on incoming bubbles from someone other than the contact (`contact`), and read out on the others.
 */
export function ChatLine({ line, contact }: { line: ConversationLine; contact: string | null }) {
  if (line.speaker === 'narrator') {
    return (
      <li className="sr-chat-catatan">
        <span>{line.text}</span>
      </li>
    );
  }
  const outgoing = line.speaker === 'officer';
  const showSender = !outgoing && !!line.name && line.name !== contact;
  return (
    <li className={`sr-chat-baris ${outgoing ? 'sr-chat-keluar' : 'sr-chat-masuk'} sr-chat-${line.speaker}`}>
      <span className="sr-chat-gelembung">
        {showSender ? <span className="sr-chat-pengirim">{line.name}</span> : line.name ? <span className="sr-only">{line.name}: </span> : null}
        <span className="sr-chat-teks">{line.text}</span>
      </span>
    </li>
  );
}
