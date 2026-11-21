/**
 * T-109 (Investigator lengkap, card 6): the event board ENTRY on the hub (`InvestigatorEventEntry`), registered through the
 * mount point of card 5 (cerita/investigasi/acara.ts `pasangEntriAcara`). Hidden unless the server reports
 * `features.investigatorAcara` (RAKSA_INVESTIGATOR_ACARA=on).
 *
 *   hub opened with ?acara=KODE, or a code typed here  -> sheet `PilihPapanAcara`: "Ikut papan acara" / "Main sendiri"
 *   "Ikut papan acara"   POST /join -> the server makes the alias and the credential; the sheet shows the name badge
 *                        ("Ganti nama samaran" until the first run, "Mulai sebagai <alias>")
 *   "Main sendiri"       nothing is sent; the hub is used as always (asked once per tab for that code)
 *   joined               a small block on the hub: badge with the own rank, one button per case to play it ON the board,
 *                        and "Keluar dari papan acara". The normal case rows of the hub stay SOLO.
 * A failed join shows one sentence and leaves "Main sendiri" available. Solo saves and the solo record are never touched here.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { EVENT_LIMITS, EVENT_ROUTES, type AliasReply, type JoinReply, type Standing } from '@shared/investigator/event';
import { CASE_MANIFESTS } from '@shared/investigator/rubric';
import type { PropsEntriAcara } from '../cerita/investigasi/acara';
import { stateNiat } from '../cerita/investigasi/rute';
import { t, useBahasa } from '../i18n';
import { useAppConfig } from '../story/appConfig';
import { Modal } from '../ui/kit';
import { panggil, teksGalat } from './api';
import { bacaSesi, berlanggananSesi, catatPilihSendiri, simpanSesi, sudahPilihSendiri, ubahSesi, versiSesi } from './sesi';
import { LencanaPapanAcara, PilihPapanAcara } from './ui';
import './acara.css';

export const RUTE_ACARA = '/investigator/acara';
const kodeRapi = (v: string | null | undefined): string | null => {
  const s = (v ?? '').trim().toUpperCase();
  return /^[A-Z0-9]{4,12}$/.test(s) ? s : null;
};

export function EntriAcara({ kode }: PropsEntriAcara) {
  useBahasa();
  useSyncExternalStore(berlanggananSesi, versiSesi, () => 0);
  const cfg = useAppConfig();
  const aktif = cfg.status === 'ready' && cfg.config.investigatorAcara;
  const nav = useNavigate();
  const sesi = aktif ? bacaSesi() : null;
  const [ketik, setKetik] = useState('');
  const [bukaKetik, setBukaKetik] = useState(false);
  const [kodeKetik, setKodeKetik] = useState<string | null>(null);
  const [lembar, setLembar] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [posisi, setPosisi] = useState<Standing | null>(null);
  const kodeAktif = kodeRapi(kodeKetik ?? kode);
  const kredensial = sesi?.credential ?? null;

  // Own standing while joined (rank on the badge, best per case). An unknown credential = the board was cleared or purged.
  useEffect(() => {
    if (!kredensial) { setPosisi(null); return; }
    let hidup = true;
    const ambil = async () => {
      if (document.visibilityState === 'hidden') return;
      const r = await panggil<Standing>('GET', EVENT_ROUTES.me, { bearer: kredensial });
      if (!hidup) return;
      if (r.ok) setPosisi(r);
      else if (r.error === 'unauthorized') simpanSesi(null);
    };
    void ambil();
    const id = window.setInterval(() => void ambil(), EVENT_LIMITS.pollMs * 2);
    return () => { hidup = false; window.clearInterval(id); };
  }, [kredensial]);

  if (!aktif) return null;

  const gabung = async () => {
    if (!kodeAktif || sibuk) return;
    setSibuk(true); setGalat(null);
    const r = await panggil<JoinReply>('POST', EVENT_ROUTES.join, { body: { code: kodeAktif } });
    setSibuk(false);
    if (!r.ok) { setGalat(teksGalat(r.error)); return; }
    simpanSesi({ code: r.event.code, eventId: r.event.eventId, participantId: r.participantId, alias: r.alias, credential: r.credential, expiresAt: r.expiresAt, cases: r.cases, mulai: false, runs: {} });
    setLembar(true);
  };
  const gantiAlias = async () => {
    if (!sesi || sibuk) return;
    setSibuk(true); setGalat(null);
    const r = await panggil<AliasReply>('POST', EVENT_ROUTES.alias, { bearer: sesi.credential });
    setSibuk(false);
    if (r.ok) ubahSesi((s) => ({ ...s, alias: r.alias }));
    else if (r.error === 'alias_locked') ubahSesi((s) => ({ ...s, mulai: true }));
    else setGalat(teksGalat(r.error));
  };
  /** Play case n ON the board (a ranked run from the beginning; the solo save of that case is not used). */
  const main = (nomor: number) => { setLembar(false); nav(`${RUTE_ACARA}/${nomor}`, { state: stateNiat('lanjut') }); };
  const berikut = (): number => CASE_MANIFESTS.find((m) => posisi?.best[m.caseId] === undefined)?.number ?? CASE_MANIFESTS[0]!.number;
  const sendiri = () => { if (kodeAktif) catatPilihSendiri(kodeAktif); setKodeKetik(null); setBukaKetik(false); setLembar(false); setGalat(null); };
  const keluar = () => { simpanSesi(null); catatPilihSendiri(kodeAktif); setLembar(false); };

  const tawar = !sesi && !!kodeAktif && !sudahPilihSendiri(kodeAktif);
  return (
    <div className="ai-entri" data-entri-acara={sesi ? 'ikut' : 'belum'}>
      {sesi ? (
        <>
          <LencanaPapanAcara alias={sesi.alias} rank={posisi?.rank ?? null} />
          <div className="ai-entri-kasus" role="group" aria-label={t('acaraInv.papanJudul')}>
            {CASE_MANIFESTS.map((m) => (
              <button key={m.caseId} type="button" className="cer-tombol-garis ai-entri-main" data-main-acara={m.caseId} onClick={() => main(m.number)}>
                {t('acaraInv.mainKasus', { n: m.number })}{posisi?.best[m.caseId] !== undefined ? ` · ${posisi.best[m.caseId]}` : ''}
              </button>
            ))}
          </div>
          <button type="button" className="hp-tautan ai-entri-keluar" data-keluar-acara="" onClick={keluar}>{t('acaraInv.keluarPapan')}</button>
        </>
      ) : bukaKetik ? (
        <form className="ai-entri-kode" onSubmit={(e) => { e.preventDefault(); const k = kodeRapi(ketik); if (k) { catatPilihSendiri(null); setGalat(null); setKodeKetik(k); } else setGalat(t('acaraInv.galatKode')); }}>
          <label htmlFor="ai-entri-kode">{t('acaraInv.kodeLabel')}</label>
          <input id="ai-entri-kode" value={ketik} onChange={(e) => setKetik(e.target.value.toUpperCase())} inputMode="text" autoCapitalize="characters" autoComplete="off" maxLength={12} />
          <button type="submit" className="cer-tombol-garis">{t('acaraInv.kodeBuka')}</button>
          {galat && !tawar ? <p className="ai-pilih-galat" role="alert">{galat}</p> : null}
        </form>
      ) : (
        <button type="button" className="hp-tautan ai-entri-tanya" data-kode-acara="" onClick={() => setBukaKetik(true)}>{t('acaraInv.kodeTanya')}</button>
      )}
      {tawar || (sesi && lembar) ? (
        <Modal judul={t('acaraInv.papanJudul')} onTutup={sesi ? () => setLembar(false) : sendiri} lebar={420}>
          <PilihPapanAcara code={sesi?.code ?? kodeAktif ?? ''} alias={sesi?.alias ?? null} canReroll={!sesi?.mulai} busy={sibuk} error={galat}
            onJoin={() => void gabung()} onSolo={sesi ? () => setLembar(false) : sendiri} onReroll={() => void gantiAlias()} onStart={() => main(berikut())} />
        </Modal>
      ) : null}
    </div>
  );
}
