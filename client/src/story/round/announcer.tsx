/**
 * Screen-reader announcements of a round on a participant's device: one polite message when the options open and one
 * when the own result arrives. The page shows them in its live region. An open sheet is a modal dialog, which makes
 * the page behind it inert, so the sheet repeats the messages that arrive while it is open in a live region of its
 * own: a reader of a document still hears that the options opened or that the answers closed.
 */
import { createContext, useContext, useEffect, useRef, useState, type JSX } from 'react';

export interface Announcement {
  /** Grows with every message, so a sheet can tell the messages that arrived while it was open. */
  seq: number;
  text: string;
}

/** The page's latest announcement (participant room only; nothing elsewhere). */
export const AnnouncementContext = createContext<Announcement | null>(null);

const NONE: Announcement = { seq: 0, text: '' };

/**
 * The latest announcement of a page whose moment of note is `moment` (null = none): every change to a new moment
 * announces `text` once. The moment a page is opened in is not announced (a reloaded tab reads the page as it is).
 */
export function useMomentAnnouncement(moment: string | null, text: string): Announcement {
  const previous = useRef(moment);
  const [current, setCurrent] = useState(NONE);
  useEffect(() => {
    if (moment === previous.current) return;
    previous.current = moment;
    if (moment !== null) setCurrent((c) => ({ seq: c.seq + 1, text }));
  }, [moment, text]);
  return current;
}

/** The page's polite live region. */
export function PageAnnouncer({ announcement }: { announcement: Announcement }): JSX.Element {
  return (
    <p className="sr-only" role="status">
      {announcement.text}
    </p>
  );
}

/** Inside an open sheet: only messages that arrived after it opened (it starts empty, so opening never repeats one). */
export function SheetAnnouncer(): JSX.Element {
  const current = useContext(AnnouncementContext);
  const [openedAt] = useState(() => current?.seq ?? 0);
  return (
    <p className="sr-only" role="status">
      {current && current.seq > openedAt ? current.text : ''}
    </p>
  );
}
