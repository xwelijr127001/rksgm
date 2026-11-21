/**
 * T-109 (Investigator lengkap, card 6): HOST side of the event board. `BlokHostAcara` wires the Designer's presentational
 * `HostSesiInvestigator` (T-105) to the API of card 4: create the session, show the code and the QR
 * (/investigator?acara=KODE), participant count and ranked preview, hide / show an entry, close, clear, and pair the
 * projector with the one-use code. It uses the staff session of this tab (the existing staff login; the server checks
 * the hostRooms capability and that this account owns the board). Hidden unless `features.investigatorAcara`.
 * Mounted in the event host screen (pages/Host.tsx) and on its own page /investigator/acara/host (default export).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EVENT_LIMITS, EVENT_ROUTES, type ApiResult, type CreateEventReply, type DisplayCodeReply, type HostEventView } from '@shared/investigator/event';
import { t, useBahasa } from '../i18n';
import { useAppConfig } from '../story/appConfig';
import { withBase } from '../story/base';
import { storedStaffToken } from '../story/staff';
import { panggil, tautanGabung, teksGalat } from './api';
import { RUTE_ACARA } from './EntriAcara';
import { HostSesiInvestigator } from './ui';
import '../pages/host/host.css';
import './acara.css';

export function BlokHostAcara() {
  useBahasa();
  const cfg = useAppConfig();
  const aktif = cfg.status === 'ready' && cfg.config.investigatorAcara;
  const [token] = useState(() => storedStaffToken());
  const [view, setView] = useState<HostEventView | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [kode, setKode] = useState<{ code: string; expiresAt: number } | null>(null);
  const [kini, setKini] = useState(() => Date.now());
  const idAcara = view?.event.eventId ?? null;
  const sibukRef = useRef(false);

  const terima = useCallback((r: ApiResult<HostEventView | { event: null }>): boolean => {
    if (!r.ok) { setGalat(teksGalat(r.error)); return false; }
    setGalat(null);
    setView(r.event ? (r as HostEventView) : null);
    return true;
  }, []);
  /** Refresh: the known board by its id (also after it was closed), otherwise this host's open board. */
  const segarkan = useCallback(async (diam: boolean) => {
    if (!token) return;
    const r = idAcara
      ? await panggil<HostEventView>('GET', EVENT_ROUTES.host, { bearer: token, param: { eventId: idAcara } })
      : await panggil<HostEventView | { event: null }>('GET', EVENT_ROUTES.mine, { bearer: token });
    if (sibukRef.current) return;
    if (!r.ok && r.error === 'not_found' && idAcara) { setView(null); return; } // purged
    if (!r.ok && diam) return; // a failed background refresh keeps the last picture
    terima(r);
  }, [token, idAcara, terima]);

  useEffect(() => {
    if (!aktif || !token) return;
    void segarkan(false);
    const id = window.setInterval(() => { if (document.visibilityState !== 'hidden') void segarkan(true); }, EVENT_LIMITS.pollMs);
    return () => window.clearInterval(id);
  }, [aktif, token, segarkan]);
  // Seconds left of the pairing code; the code is forgotten when it runs out or when the projector is paired.
  useEffect(() => {
    if (!kode) return;
    const id = window.setInterval(() => setKini(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [kode]);
  useEffect(() => { if (kode && (kode.expiresAt <= kini || view?.displayPaired)) setKode(null); }, [kode, kini, view?.displayPaired]);

  if (!aktif) return null;
  if (!token) {
    return (
      <section className="panel ai-host" data-host-investigator="tanpa-sesi">
        <h3 className="ai-host-judul">{t('acaraInv.hostJudul')}</h3>
        <p className="ai-host-ket">{t('acaraInv.hostMasuk')}</p>
        <Link className="btn btn-kecil" to="/host">{t('acaraInv.hostMasukTombol')}</Link>
      </section>
    );
  }

  const aksi = async (f: () => Promise<ApiResult<HostEventView | { event: null }>>): Promise<void> => {
    if (sibukRef.current) return;
    sibukRef.current = true; setSibuk(true);
    const r = await f();
    sibukRef.current = false; setSibuk(false);
    terima(r);
  };
  const pos = (rute: string, body?: unknown, param: Record<string, string> = {}) =>
    panggil<HostEventView>('POST', rute, { bearer: token, body, param: { eventId: idAcara ?? '', ...param } });
  const buat = () => aksi(async () => {
    const r = await panggil<CreateEventReply>('POST', EVENT_ROUTES.create, { bearer: token });
    if (!r.ok) return r;
    setKode(null);
    return panggil<HostEventView>('GET', EVENT_ROUTES.host, { bearer: token, param: { eventId: r.event.eventId } });
  });
  const pasang = async () => {
    if (sibukRef.current || !idAcara) return;
    sibukRef.current = true; setSibuk(true);
    const r = await panggil<DisplayCodeReply>('POST', EVENT_ROUTES.displayCode, { bearer: token, param: { eventId: idAcara } });
    sibukRef.current = false; setSibuk(false);
    if (!r.ok) { setGalat(teksGalat(r.error)); return; }
    setGalat(null); setKini(Date.now()); setKode({ code: r.displayCode, expiresAt: r.expiresAt });
  };
  const basis = cfg.status === 'ready' ? cfg.config.joinBaseUrl : '';
  return (
    <div className="ai-host-bungkus">
      <HostSesiInvestigator view={view} busy={sibuk} error={galat}
        joinUrl={view ? tautanGabung(basis, view.event.code) : undefined}
        displayCode={kode ? { code: kode.code, secondsLeft: (kode.expiresAt - kini) / 1000 } : null}
        onCreate={() => void buat()}
        onHide={(participantId, hidden) => void aksi(() => pos(EVENT_ROUTES.hide, { hidden }, { participantId }))}
        onClose={() => void aksi(() => pos(EVENT_ROUTES.close))}
        onClear={() => void aksi(() => pos(EVENT_ROUTES.clear))}
        onPairDisplay={() => void pasang()}
        onRevokeDisplay={() => void aksi(() => pos(EVENT_ROUTES.displayRevoke))} />
      {/* The host decides what the projector shows: this board has its own screen address, apart from the quiz screens. */}
      {view && view.event.status === 'open' ? <p className="ai-host-layar"><a href={withBase(`${RUTE_ACARA}/layar`)} target="_blank" rel="noopener">{t('acaraInv.hostLayar')}</a></p> : null}
    </div>
  );
}

export default function HalamanHostAcara() {
  useBahasa();
  return (
    <div className="layar host-layar ai-host-halaman">
      <main className="host-isi">
        <h1 className="sr-only">{t('acaraInv.hostJudul')}</h1>
        <BlokHostAcara />
      </main>
    </div>
  );
}
