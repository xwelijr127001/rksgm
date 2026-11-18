/**
 * Join Game (/join?room=KODE): code -> room info -> name + explicit data notice (PRD FR-B2, FR-E7; staff review #19).
 * Only a code and a name are needed (no account, no avatar). The name is checked here with the same rules as the
 * server for instant feedback; the server re-checks everything. 4-character codes are legacy event-quiz rooms and are
 * forwarded to the legacy join page when legacy mode is on.
 */
import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { personalize } from '@shared/story/content';
import { checkName, NAME_MAX_CHARS } from '@shared/story/names';
import type { StoryRoomInfo } from '@shared/story/protocol';
import { PotretSurveyor } from '../../art/Surveyor';
import { Arrow, PlayerShell } from '../../components/PlayerShell';
import { t, useBahasa } from '../../i18n';
import { serverUrl } from '../../story/base';
import { useLegacyEnabled } from '../../story/appConfig';
import { storyErrorText } from '../../story/errors';
import { joinRoom, normalizeCode, savedSession } from '../../story/participant';
import { savedProfil } from '../../state/profil';
import '../../story/story.css';

type InfoState = { status: 'idle' } | { status: 'loading' } | { status: 'ok'; info: StoryRoomInfo } | { status: 'error'; message: string };

async function fetchInfo(code: string): Promise<InfoState> {
  try {
    const r = await fetch(serverUrl(`/api/story/rooms/${encodeURIComponent(code)}/info`), { headers: { accept: 'application/json' } });
    const json = (await r.json()) as { ok?: boolean; info?: StoryRoomInfo; error?: string; code?: string };
    if (r.ok && json.ok && json.info) return { status: 'ok', info: json.info };
    const errorCode = json.code === 'not_found' || json.code === 'closed' || json.code === 'rate_limited' ? json.code : r.status === 429 ? 'rate_limited' : undefined;
    return { status: 'error', message: storyErrorText({ code: errorCode, error: json.error ?? t('ruang.galat.not_found') }) };
  } catch {
    return { status: 'error', message: t('ruang.galat.invalid') };
  }
}

export default function StoryJoin() {
  useBahasa();
  const [params] = useSearchParams();
  const legacy = useLegacyEnabled();
  const fromUrl = normalizeCode(params.get('room') ?? '');
  if (legacy && fromUrl.length === 4) return <Navigate to={'/acara/join?room=' + fromUrl} replace />;
  return <JoinFlow initialCode={fromUrl} legacy={legacy} />;
}

function JoinFlow({ initialCode, legacy }: { initialCode: string; legacy: boolean }) {
  const nav = useNavigate();
  const id = useId();
  const [code, setCode] = useState(initialCode);
  const [checked, setChecked] = useState<string | null>(null);
  const [info, setInfo] = useState<InfoState>({ status: 'idle' });
  const [formatError, setFormatError] = useState(false);

  const check = async (c: string) => {
    if (legacy && c.length === 4) {
      nav('/acara/join?room=' + c);
      return;
    }
    if (c.length !== 6) {
      setFormatError(true);
      return;
    }
    setInfo({ status: 'loading' });
    const res = await fetchInfo(c);
    setChecked(c);
    setInfo(res);
  };

  useEffect(() => {
    if (initialCode.length === 6) void check(initialCode);
    // only for the code that came with the link
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    void check(normalizeCode(code));
  };

  const ready = info.status === 'ok' && checked === code;
  return (
    <PlayerShell back="/" className="sr-halaman" judul={t('ruang.joinJudul')}>
      <main className="sr-join">
        <div className="sr-join-kepala">
          <PotretSurveyor ukuran={56} />
          <div>
            <h1>{t('ruang.joinJudul')}</h1>
            <p className="sr-lembut">{t('ruang.joinPengantar')}</p>
          </div>
        </div>
        {!ready ? (
          <form className="sr-kartu sr-join-kode" onSubmit={submitCode} noValidate>
            <label className="sr-label" htmlFor={id + 'kode'}>
              {t('ruang.kodeLabel')}
            </label>
            <input
              id={id + 'kode'}
              className="kolom sr-input-kode"
              value={code}
              onChange={(e) => {
                setCode(normalizeCode(e.target.value));
                setFormatError(false);
              }}
              placeholder="KODE"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={6}
              aria-invalid={formatError || info.status === 'error' || undefined}
              aria-describedby={id + 'kode-ket'}
              autoFocus={!initialCode}
            />
            <div id={id + 'kode-ket'} aria-live="polite">
              {formatError ? <p className="sr-galat">{t('ruang.kodeFormat')}</p> : null}
              {info.status === 'error' ? <p className="sr-galat">{info.message}</p> : null}
              {info.status === 'loading' ? <p className="sr-lembut">{t('ruang.kodeMemeriksa')}</p> : null}
            </div>
            <button className="primary-action" type="submit" disabled={info.status === 'loading'}>
              {t('ruang.kodeLanjut')} <Arrow />
            </button>
          </form>
        ) : (
          <NameStep info={info.info} onChangeCode={() => setInfo({ status: 'idle' })} />
        )}
      </main>
    </PlayerShell>
  );
}

function NameStep({ info, onChangeCode }: { info: StoryRoomInfo; onChangeCode: () => void }) {
  const nav = useNavigate();
  const id = useId();
  const stored = useMemo(() => savedSession(info.code), [info.code]);
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const local = checkName(name);
  const nameError = touched && !local.ok ? t(`ruang.nama.${local.reason}`) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (!local.ok) return;
    if (!accepted) {
      setAcceptError(true);
      return;
    }
    setBusy(true);
    // T-052: the character chosen on this device (if any) shows next to the name on the room's ranking.
    const res = await joinRoom(info.code, name, savedProfil()?.look);
    setBusy(false);
    if (res.ok) nav(`/room/${res.data.state.code}`, { replace: true });
    else setServerError(storyErrorText(res));
  };

  return (
    <>
      <section className="sr-kartu sr-info-room" aria-label={t('ruang.kodeLabel')}>
        <span className="sr-kode">{info.code}</span>
        <div className="sr-info-teks">
          {/* No name chosen yet: `{nama}` in a title reads as the neutral word. */}
          <b>{personalize(info.scenarioTitle, t('ruang.namaUmum'))}</b>
          <span className="sr-lembut">
            {t('ruang.infoKategori', { kategori: info.categoryName })} · {t('ruang.infoPeserta', { n: info.participantCount, maks: info.maxParticipants })}
          </span>
        </div>
        <button type="button" className="text-button" onClick={onChangeCode}>
          {t('ruang.gantiKode')}
        </button>
      </section>
      {stored ? (
        <section className="sr-kartu sr-lanjut">
          <p>{t('ruang.sudahBergabung', { nama: stored.name })}</p>
          <Link className="primary-action" to={`/room/${info.code}`}>
            {t('ruang.lanjutkanSebagai', { nama: stored.name })} <Arrow />
          </Link>
        </section>
      ) : null}
      {!info.canJoin ? (
        <p className="sr-galat" role="alert">
          {storyErrorText({ code: info.reasonCode, error: info.reason ?? t('ruang.galat.closed') })}
        </p>
      ) : (
        <form className="sr-kartu sr-join-nama" onSubmit={submit} noValidate>
          <label className="sr-label" htmlFor={id + 'nama'}>
            {t('ruang.namaLabel')}
          </label>
          <input
            id={id + 'nama'}
            className="kolom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            maxLength={NAME_MAX_CHARS + 10}
            autoComplete="nickname"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={`${id}nama-bantu ${id}nama-galat`}
            autoFocus={!stored}
          />
          <p className="sr-kecil" id={id + 'nama-bantu'}>
            {t('ruang.namaBantu')}
          </p>
          <p className="sr-galat" id={id + 'nama-galat'} aria-live="polite">
            {nameError}
          </p>
          <div className="sr-pemberitahuan" role="note" aria-labelledby={id + 'pb'}>
            <b id={id + 'pb'}>{t('ruang.pemberitahuanJudul')}</b>
            <p>{t('ruang.pemberitahuanIsi')}</p>
            <label className="sr-setuju">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  setAcceptError(false);
                }}
                aria-describedby={acceptError ? id + 'setuju-galat' : undefined}
              />
              <span>{t('ruang.pemberitahuanSetuju')}</span>
            </label>
            {acceptError ? (
              <p className="sr-galat" id={id + 'setuju-galat'} role="alert">
                {t('ruang.pemberitahuanWajib')}
              </p>
            ) : null}
          </div>
          {serverError ? (
            <p className="sr-galat" role="alert">
              {serverError}
            </p>
          ) : null}
          <button className="primary-action" type="submit" disabled={busy}>
            {busy ? t('ruang.masuk') : t('ruang.masukRoom')} <Arrow />
          </button>
        </form>
      )}
    </>
  );
}
