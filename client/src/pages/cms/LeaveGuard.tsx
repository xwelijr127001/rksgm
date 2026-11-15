/**
 * Unsaved changes are never lost silently. While `active`, closing or reloading the tab gets the browser's own warning
 * (beforeunload), and inside the app every way out of the editor asks first: a link to another page (the CMS sections,
 * the staff tools, "← Semua skenario"), any control outside the editor, such as "Keluar", and a move through the
 * browser's history (back and forward buttons, mouse buttons, Alt+←/→, swipe gestures). The app runs on a
 * BrowserRouter, which has no navigation blocker, so the guard holds such a click in the capture phase and replays it
 * once the author has decided; a history move it takes before the router sees it (historyHold.ts), undoes it
 * (react-router numbers its entries in `history.state.idx`) and makes it again on leaving. A save already on its way (`saving`) is waited for: when it leaves
 * nothing unsaved, the held way out simply goes ahead.
 */
import { useEffect, useRef, useState } from 'react';
import { holdHistoryMoves } from '../../historyHold';
import { Modal } from '../../ui/kit';
import { historyIndex, isPlainClick, replacesEditor } from './leavePolicy';

/** Saving the draft from the dialog: ok, or the reason it failed. */
export type SaveOutcome = { ok: true } | { ok: false; error: string };

/** A way out of the editor waiting for the author's decision: a click to replay, or a move through history to make again. */
type HeldExit = { kind: 'click'; control: HTMLElement } | { kind: 'history'; delta: number };

/** The control a click would activate when that replaces the editor, else null. */
function leavingControl(e: MouseEvent, editor: HTMLElement | null): HTMLElement | null {
  if (!(e.target instanceof Element)) return null;
  const control = e.target.closest<HTMLElement>('a[href], button');
  // Controls in a dialog (confirmations, evidence sheets of the preview) never leave the page.
  if (!control || control.closest('dialog, [role="dialog"]')) return null;
  if (control instanceof HTMLAnchorElement) {
    const newTab = (control.target !== '' && control.target !== '_self') || control.hasAttribute('download');
    return !newTab && isPlainClick(e) && replacesEditor(window.location, new URL(control.href)) ? control : null;
  }
  return editor !== null && !editor.contains(control) ? control : null;
}

export function LeaveGuard({ active, saving, editor, onSave }: { active: boolean; saving: boolean; editor: HTMLElement | null; onSave: (() => Promise<SaveOutcome>) | null }) {
  const [held, setHeld] = useState<HeldExit | null>(null);
  /** A held way out to take once the dialog is gone (the page behind a dialog is inert). */
  const [replay, setReplay] = useState<HeldExit | null>(null);
  /** The dialog's own save is running. */
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  /** The replayed click, which the guard lets through. */
  const passing = useRef<HTMLElement | null>(null);
  /** The history move the guard is making itself: undoing the author's move (swallowed) or leaving (let through). */
  const ownMove = useRef<'undo' | 'leave' | null>(null);

  useEffect(() => {
    if (!active) return;
    ownMove.current = null;
    const here = historyIndex(window.history.state);
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    const hold = (e: MouseEvent) => {
      const control = leavingControl(e, editor);
      if (!control || control === passing.current) return;
      e.preventDefault();
      e.stopPropagation();
      setSaveError(null);
      setHeld({ kind: 'click', control });
    };
    // A move held here never reaches the router: the guard's own undo, or the author's move, which it undoes and asks about.
    const pop = (e: PopStateEvent): boolean => {
      const own = ownMove.current;
      ownMove.current = null;
      if (own === 'leave') return false;
      if (own === 'undo') return true;
      const to = historyIndex(e.state);
      if (here === null || to === null || to === here) return false;
      ownMove.current = 'undo';
      window.history.go(here - to);
      setSaveError(null);
      setHeld({ kind: 'history', delta: to - here });
      return true;
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', hold, true);
    holdHistoryMoves(pop);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', hold, true);
      holdHistoryMoves(null);
    };
  }, [active, editor]);

  useEffect(() => {
    if (!replay) return;
    if (replay.kind === 'click') {
      passing.current = replay.control;
      replay.control.click();
      passing.current = null;
    } else {
      ownMove.current = 'leave';
      window.history.go(replay.delta);
    }
    setReplay(null);
  }, [replay]);

  // The save that was on its way when the author tried to leave has stored everything: the way out goes ahead.
  useEffect(() => {
    if (!held || active || busy) return;
    setHeld(null);
    setReplay(held);
  }, [held, active, busy]);

  if (!held) return null;
  const stay = () => {
    if (!busy) setHeld(null);
  };
  const leave = () => {
    setHeld(null);
    setReplay(held);
  };
  const saveThenLeave = async () => {
    if (!onSave) return;
    setBusy(true);
    const result = await onSave();
    setBusy(false);
    if (result.ok) leave();
    else setSaveError(result.error);
  };
  return (
    <Modal
      judul="Tinggalkan editor?"
      onTutup={stay}
      lebar={560}
      aksi={
        <>
          <button type="button" className="btn btn-netral" disabled={busy} onClick={stay}>
            Kembali ke editor
          </button>
          {onSave ? (
            <button type="button" className="btn btn-utama" disabled={busy} onClick={() => void saveThenLeave()}>
              {busy ? 'Menyimpan…' : 'Simpan draf, lalu lanjutkan'}
            </button>
          ) : null}
          <button type="button" className="btn btn-bahaya" disabled={busy} onClick={leave}>
            Tinggalkan tanpa menyimpan
          </button>
        </>
      }
    >
      <p>Ada perubahan yang belum disimpan. Bila editor ditinggalkan sekarang, perubahan itu hilang; revisi draf yang sudah tersimpan tetap ada.</p>
      {saving && !busy ? (
        <p className="stf-lembut" role="status">
          Draf sedang disimpan. Bila sesudahnya tidak ada lagi yang belum disimpan, Anda langsung dilanjutkan.
        </p>
      ) : null}
      {saveError ? (
        <p className="stf-galat" role="alert">
          Draf belum tersimpan: {saveError}
        </p>
      ) : null}
    </Modal>
  );
}
