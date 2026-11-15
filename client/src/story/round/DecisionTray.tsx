/**
 * The decision of a round, the same in every activity: five option cards (a radio group — arrows move and select, no
 * A–E letters), one confirm button and the round's ONE compact timer, kept together in a bar that sticks to the bottom
 * of the screen while answering (in the page's dock when it provides one, so it stays visible wherever the player
 * scrolls in the round). One selection and one confirmation send the final decision; nothing here shows correctness.
 * The cards carry no form mark: an option's text says what it does. The confirm button names what the selection does:
 * the round's label ("Kirim balasan", "Ajukan berkas", "Tetapkan tindakan"), except a chat option that is an action
 * without a message, which is confirmed as "Tetapkan tindakan" (roundModel.confirmLabelOf).
 *
 *   scene      -> "Pilihan dibuka dalam N detik" (options open at the same moment for everybody)
 *   answering  -> options + bar; while the private snapshot with the options is still on its way, the same waiting
 *                 look ("Pilihan segera dibuka…"); after the server's ACK the tray collapses to the sent state
 *                 (`sentHandle`): in a chat a message becomes the own outgoing bubble and an action a note ("Kamu:
 *                 …"), elsewhere a card; a handle this device cannot name shows the sent state without its text;
 *                 re-sending is impossible
 *   otherwise  -> nothing (the outcome takes its place)
 *
 * The selection survives re-renders, reconnects and a reload of the tab (sessionStorage under `persistKey`). A focused
 * option is scrolled clear of the sticky bar (scroll margin = measured bar height). How many options are still below
 * the visible area is said inside the bar (a line above the timer and button on narrow screens, between them on wide
 * ones), so it is part of the bar and never covers an option.
 */
import { useContext, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type JSX, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { RoundLayout } from '@shared/story/content';
import type { StoryOption, StoryPhase } from '@shared/story/protocol';
import { gerakDikurangi } from '../../gerak';
import { t } from '../../i18n';
import { useServerCountdown } from '../ui/countdown';
import { TimerPill } from './answerClock';
import { TrayDockContext, useDecisionShown } from './roundContext';
import { arrowTarget, confirmLabelOf, readDraft, trayStateOf, writeDraft, type DraftStorage } from './roundModel';

export interface DecisionTrayProps {
  /** This participant's shuffled options (answering only); null = none yet (not open, or the snapshot is on its way). */
  options: StoryOption[] | null;
  layout: RoundLayout;
  /** The round's confirm label (roundModel.actionLabelOf). */
  actionLabel: string;
  phase: StoryPhase;
  /** null = not sent; otherwise the handle of the sent option (from this send or the server's acknowledgement). */
  sentHandle: string | null;
  /** Options and button inactive (e.g. while reconnecting). */
  disabled: boolean;
  /** Deadline (server clock) of the current phase: the reading time in the scene, the answer window while answering. */
  endsAt: number | null;
  durationMs: number | null;
  now: () => number;
  onSubmit: (handle: string) => Promise<{ ok: boolean; error?: string }>;
  /** sessionStorage key of the selection (roundModel.draftKey); none = selection lives in the component only. */
  persistKey?: string;
}

/** This tab's sessionStorage, or null where storage is blocked. */
function sessionDraftStorage(): DraftStorage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Keeps a focused option fully visible above the sticky bar (its scroll margin includes the bar's height). */
function keepVisible(e: FocusEvent<HTMLElement>): void {
  e.currentTarget.scrollIntoView({ block: 'nearest', behavior: gerakDikurangi() ? 'auto' : 'smooth' });
}

export function DecisionTray(p: DecisionTrayProps): JSX.Element {
  const { remainingMs, seconds, ratio } = useServerCountdown(p.endsAt, p.durationMs, p.now);
  const state = trayStateOf({ phase: p.phase, hasOptions: !!p.options?.length, sent: p.sentHandle !== null, remainingMs });
  if (state === 'closed') return <></>;
  if (state === 'waiting' || state === 'loading') {
    // Loading = the answers are open and this device's options are a moment away: no countdown to show.
    const opensIn = state === 'waiting' && seconds !== null && seconds > 0 ? seconds : null;
    return (
      <div className="sr-baki sr-baki-tunggu">
        <p className="sr-baki-tunggu-judul">{opensIn !== null ? t('ruang.pilihanDibuka', { n: opensIn }) : t('ruang.pilihanSegera')}</p>
        <p className="sr-kecil">{t(p.layout === 'chat' ? 'ruang.pilihanNanti.chat' : 'ruang.pilihanNanti.umum')}</p>
      </div>
    );
  }
  if (state === 'sent') {
    const sent = p.options?.find((o) => o.handle === p.sentHandle) ?? null;
    return <SentState layout={p.layout} option={sent} seconds={seconds} ratio={ratio} />;
  }
  return <OptionGroup {...p} options={p.options ?? []} timeUp={state === 'timeUp'} seconds={seconds} ratio={ratio} />;
}

/**
 * After the server's ACK: what was sent and the timer until the answers close. The confirm button that had focus is
 * gone, so focus lands here instead of on the page body. `option` null = this device cannot name the sent option.
 */
function SentState({ layout, option, seconds, ratio }: { layout: RoundLayout; option: StoryOption | null; seconds: number | null; ratio: number | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body) ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} tabIndex={-1} className={`sr-baki sr-baki-terkirim sr-baki-terkirim-${layout === 'chat' ? 'chat' : 'kartu'}`} data-terkirim="">
      <div role="status" className="sr-terkirim-isi">
        <SentContent layout={layout} option={option} />
      </div>
      <TimerPill seconds={seconds} ratio={ratio} primary />
    </div>
  );
}

/**
 * In a chat a sent message is the own outgoing bubble ("Terkirim") and an action a note in the thread ("Ditetapkan");
 * elsewhere a card with the decision ("Ditetapkan", as the button "Tetapkan tindakan" said).
 */
function SentContent({ layout, option }: { layout: RoundLayout; option: StoryOption | null }) {
  if (layout === 'chat' && option?.form === 'message') {
    return (
      <div className="sr-chat-baris sr-chat-keluar">
        <span className="sr-chat-gelembung">
          <span className="sr-chat-teks">{option.text}</span>
          <span className="sr-chat-status">
            <span aria-hidden="true">✓✓</span> {t('ruang.terkirim')}
          </span>
        </span>
      </div>
    );
  }
  if (layout === 'chat' && option?.form === 'action') {
    // Nothing was sent to the contact: the action is recorded ("Ditetapkan"), as in the outcome's thread later.
    return (
      <div className="sr-terkirim-catatan">
        <div className="sr-chat-catatan">
          <span>{t('ruang.terkirimTindakan', { teks: option.text })}</span>
        </div>
        <span className="sr-chat-status">
          <span aria-hidden="true">✓</span> {t('ruang.ditetapkan')}
        </span>
      </div>
    );
  }
  // A chat whose option this device cannot name was most likely a message; elsewhere a decision was set, not sent.
  return (
    <div className="sr-terkirim-kartu">
      <b>
        <span aria-hidden="true">✓</span> {t(layout === 'chat' ? 'ruang.terkirim' : 'ruang.ditetapkan')}
      </b>
      {option ? <p>{option.text}</p> : null}
    </div>
  );
}

function OptionGroup(p: DecisionTrayProps & { options: StoryOption[]; timeUp: boolean; seconds: number | null; ratio: number | null }) {
  const handles = p.options.map((o) => o.handle);
  const handlesKey = handles.join('|');
  // The selection belongs to one round's options: a new key or a new option set starts empty (or from storage).
  const scope = `${p.persistKey ?? ''}|${handlesKey}`;
  const storage = useMemo(sessionDraftStorage, []);
  const restored = useMemo(() => (p.persistKey ? readDraft(storage, p.persistKey, handlesKey.split('|')) : null), [storage, p.persistKey, handlesKey]);
  const [picked, setPicked] = useState<{ scope: string; handle: string } | null>(null);
  const [error, setError] = useState<{ scope: string; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const bar = useRef<HTMLDivElement>(null);
  const dock = useContext(TrayDockContext);
  const [barHeight, setBarHeight] = useState(0);
  const [hiddenBelow, setHiddenBelow] = useState(0);
  // The first count of options below decides whether the bar shows the cue (on a narrow bar a line of its own, so it
  // sets the bar's final height); only then is the decision area brought into view, measured against that bar, so the
  // move never leaves an option under it.
  const [counted, setCounted] = useState(() => typeof IntersectionObserver === 'undefined');
  const selected = picked && picked.scope === scope ? picked.handle : restored;
  const locked = p.disabled || p.timeUp || sending;
  const selectedForm = p.options.find((o) => o.handle === selected)?.form ?? null;
  useDecisionShown(counted);

  // The bar's real height (it grows with the cue line, an error line or 200% text) sets the options' scroll margin.
  // The bar element changes when it moves into the page's dock.
  useLayoutEffect(() => {
    const el = bar.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setBarHeight(Math.round(el.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dock]);

  // How many options sit (partly) below the visible area above the sticky bar: the cue in the bar.
  useLayoutEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const below = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const bottom = en.rootBounds ? en.rootBounds.bottom : window.innerHeight;
          if (en.intersectionRatio < 0.99 && en.boundingClientRect.bottom > bottom + 1) below.add(en.target);
          else below.delete(en.target);
        }
        setHiddenBelow(below.size);
        setCounted(true);
      },
      { rootMargin: `0px 0px -${barHeight}px 0px`, threshold: [0, 0.25, 0.5, 0.75, 0.99, 1] },
    );
    cards.current.forEach((c) => c && io.observe(c));
    return () => io.disconnect();
  }, [barHeight, handlesKey]);

  const choose = (handle: string) => {
    setPicked({ scope, handle });
    if (p.persistKey) writeDraft(storage, p.persistKey, handle);
    setError(null);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = arrowTarget(e.key, index, p.options.length);
    if (target === null) return;
    e.preventDefault();
    choose(p.options[target]!.handle);
    cards.current[target]?.focus();
  };

  const submit = async () => {
    if (sendingRef.current || locked) return;
    if (!selected) {
      setError({ scope, text: t('ruang.pilihDulu') });
      cards.current[0]?.focus();
      return;
    }
    sendingRef.current = true;
    setSending(true);
    setError(null);
    try {
      const res = await p.onSubmit(selected);
      if (!res.ok) setError({ scope, text: res.error || t('ruang.gagalKirim') });
    } catch {
      setError({ scope, text: t('ruang.gagalKirim') });
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const shownError = error && error.scope === scope ? error.text : null;
  const style = (barHeight ? { '--sr-baki-bar': `${barHeight}px` } : undefined) as CSSProperties | undefined;
  const actionBar = (
    <div className={`sr-baki-bar sr-baki-bar-${p.layout === 'chat' ? 'chat' : 'umum'}`} ref={bar}>
      {shownError ? (
        <p className="sr-galat" role="alert">
          {shownError}
        </p>
      ) : null}
      {/* An answer on its way may still be accepted (the server takes what reaches it before the deadline). */}
      {p.timeUp && !sending ? (
        <p className="sr-baki-catatan" role="status">
          {t('ruang.waktuHabisBelum')}
        </p>
      ) : null}
      <div className="sr-baki-baris">
        <TimerPill seconds={p.seconds} ratio={p.ratio} primary />
        {hiddenBelow > 0 ? (
          <p className="sr-baki-isyarat" aria-hidden="true">
            <span className="sr-baki-isyarat-panah">↓</span> {t('ruang.pilihanLagi', { n: hiddenBelow })}
          </p>
        ) : null}
        <button type="button" className="primary-action sr-kirim" data-kirim="" disabled={locked} onClick={() => void submit()}>
          {sending ? t('ruang.mengirim') : confirmLabelOf({ layout: p.layout, actionLabel: p.actionLabel, selectedForm }, t)}
        </button>
      </div>
    </div>
  );
  return (
    <div className={`sr-baki sr-baki-${p.layout === 'chat' ? 'chat' : 'umum'}`} style={style}>
      <div role="radiogroup" aria-label={t(p.layout === 'chat' ? 'ruang.pilihanGrup.chat' : 'ruang.pilihanGrup.umum')} className="sr-baki-opsi">
        {p.options.map((o, i) => {
          const checked = selected === o.handle;
          const tabbable = selected ? checked : i === 0;
          return (
            <button
              key={o.handle}
              ref={(el) => {
                cards.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={tabbable ? 0 : -1}
              className="sr-opsi-kartu"
              data-pilihan={o.handle}
              disabled={locked}
              onClick={() => choose(o.handle)}
              onKeyDown={(e) => onKey(e, i)}
              onFocus={keepVisible}
            >
              <span className="sr-opsi-tanda" aria-hidden="true" />
              <span className="sr-opsi-teks">{o.text}</span>
            </button>
          );
        })}
      </div>
      {dock ? createPortal(actionBar, dock) : actionBar}
    </div>
  );
}
