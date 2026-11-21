/**
 * T-109 (Investigator lengkap, card 6): PROJECTOR of the event board, route /investigator/acara/layar (also the event
 * screen /acara/layar?papan=investigator). It is separate from the quiz screens: the host decides what is projected by
 * opening this address on the projector.
 *
 * Pairing: the projector has no staff login. The host presses "Hubungkan proyektor" and reads out an 8-character code
 * (one use, two minutes); typed here it is exchanged for a READ-ONLY display credential, kept in this tab's
 * sessionStorage and sent only in the Authorization header. The board is then polled every few seconds
 * (EVENT_LIMITS.pollMs) and drawn by the Designer's `ProyektorPapan` (top ten; equal totals share a rank, as the server
 * sends it). A credential the server no longer knows (revoked, purged) returns to the pairing form.
 */
import { useEffect, useState } from 'react';
import { EVENT_LIMITS, EVENT_ROUTES, type BoardSnapshot, type DisplayExchangeReply } from '@shared/investigator/event';
import { t, useBahasa } from '../i18n';
import { useAppConfig } from '../story/appConfig';
import { panggil, tautanGabung, teksGalat } from './api';
import { ProyektorPapan } from './ui';
import './acara.css';

const KUNCI = 'raksa:investigator:layar';
const bacaKredensial = (): string | null => { try { return window.sessionStorage.getItem(KUNCI); } catch { return null; } };
const simpanKredensial = (v: string | null): void => { try { if (v) window.sessionStorage.setItem(KUNCI, v); else window.sessionStorage.removeItem(KUNCI); } catch { /* blocked: pairing lasts until reload */ } };

export default function LayarAcara() {
  useBahasa();
  const cfg = useAppConfig();
  const aktif = cfg.status === 'ready' && cfg.config.investigatorAcara;
  const [kredensial, setKredensial] = useState<string | null>(() => bacaKredensial());
  const [papan, setPapan] = useState<BoardSnapshot | null>(null);
  const [ketik, setKetik] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [putus, setPutus] = useState(false);

  useEffect(() => {
    if (!aktif || !kredensial) return;
    let hidup = true;
    const ambil = async () => {
      const r = await panggil<BoardSnapshot>('GET', EVENT_ROUTES.board, { bearer: kredensial });
      if (!hidup) return;
      if (r.ok) { setPapan(r); setPutus(false); }
      else if (r.error === 'unauthorized') { simpanKredensial(null); setKredensial(null); setPapan(null); }
      else setPutus(true); // keep the last picture; try again on the next tick
    };
    void ambil();
    const id = window.setInterval(() => void ambil(), EVENT_LIMITS.pollMs);
    return () => { hidup = false; window.clearInterval(id); };
  }, [aktif, kredensial]);

  if (cfg.status !== 'ready') return null;
  if (!aktif) return <main className="ai-layar-pasang"><p>{t('acaraInv.galatUmum')}</p></main>;
  if (kredensial && papan) {
    return (
      <>
        <ProyektorPapan rows={papan.rows} participants={papan.participants} code={papan.event.code} status={papan.event.status}
          joinUrl={tautanGabung(cfg.config.joinBaseUrl, papan.event.code)} />
        {putus ? <p className="ai-layar-putus" role="status">{t('acaraInv.layarPutus')}</p> : null}
      </>
    );
  }
  const sambung = async () => {
    const kode = ketik.trim().toUpperCase();
    if (sibuk || kode.length < 4) return;
    setSibuk(true); setGalat(null);
    const r = await panggil<DisplayExchangeReply>('POST', EVENT_ROUTES.displayExchange, { body: { displayCode: kode } });
    setSibuk(false);
    if (!r.ok) { setGalat(r.error === 'not_found' ? t('acaraInv.layarGalat') : teksGalat(r.error)); return; }
    simpanKredensial(r.credential); setKetik(''); setKredensial(r.credential);
  };
  return (
    <main className="ai-layar-pasang" data-layar-pasang="">
      <form onSubmit={(e) => { e.preventDefault(); void sambung(); }}>
        <h1>{t('acaraInv.layarJudul')}</h1>
        <p>{t('acaraInv.layarKet')}</p>
        <label htmlFor="ai-layar-kode">{t('acaraInv.layarLabel')}</label>
        <input id="ai-layar-kode" value={ketik} onChange={(e) => setKetik(e.target.value.toUpperCase())} autoComplete="off" autoCapitalize="characters" maxLength={12} autoFocus />
        {galat ? <p role="alert">{galat}</p> : putus && kredensial ? <p role="status">{t('acaraInv.layarPutus')}</p> : null}
        <button type="submit" className="btn" disabled={sibuk}>{sibuk ? t('acaraInv.hostSibuk') : t('acaraInv.layarSambung')}</button>
      </form>
    </main>
  );
}
