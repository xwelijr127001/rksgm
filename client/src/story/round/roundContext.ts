/**
 * What a page provides to the components of a round besides their props: where the decision bar docks, and the signal
 * a decision slot gives once its content is on screen (the options after they open, the own outcome after close), so
 * the decision area can bring exactly that content into view.
 */
import { createContext, useContext, useEffect } from 'react';

/**
 * Where the bar (timer + confirm) is shown: a page that wants it visible during the whole answer window, wherever the
 * player scrolls, provides a sticky dock element spanning the round (the participant room). Without one (CMS
 * preview) the bar sticks within the tray itself.
 */
export const TrayDockContext = createContext<HTMLElement | null>(null);

/** Provided by the decision area to its slot: called once the slot shows what the participant must see next. */
export const DecisionShownContext = createContext<(() => void) | null>(null);

/** Tells the enclosing decision area that this component's content is on screen, once `ready` (its size is final). */
export function useDecisionShown(ready = true): void {
  const shown = useContext(DecisionShownContext);
  useEffect(() => {
    if (ready) shown?.();
  }, [shown, ready]);
}
