/**
 * Gabung ke acara dengan kode (docs/rancangan-bank-soal.md bagian 2).
 *  Langkah 1: kode 4 karakter, LANGSUNG diperiksa (GET /api/room/:code/info) -> kartu konfirmasi.
 *  Langkah 2: profil perangkat ada -> "Main sebagai X · ubah"; belum ada -> isi nama + karakter di sini.
 * Kode dari alamat (/join?room=ABCD, QR layar acara) diperiksa saat dibuka dan, bila room bisa
 * dimasuki, langsung ke langkah 2.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { InfoRoom } from '@shared/bankSoal';
import type { PlayerLook } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { Icon } from '../art/Icon';
import { CharacterPicker } from '../components/CharacterPicker';
import { Arrow, PlayerShell } from '../components/PlayerShell';
import { Raki } from '../art/Raki';
import { TOKOH } from '@shared/brand';
import { KarakterTokoh } from '../game/KarakterTokoh';
import { t, useBahasa } from '../i18n';
import { terjemahkanBawaan, terjemahkanGalat } from '../i18n/galat';
import { LOOK_BAWAAN, savedProfil, simpanProfil } from '../state/profil';
import { actions, savedIdentity, useGame } from '../state/store';
import { Pesan } from '../ui/kit';
const cleanCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
/** Penanda galat lokal (server tidak memberi pesan); diterjemahkan saat ditampilkan. */
const GALAT_LOKAL = 'pemain.galatMasuk';
/** Teks asli server untuk 404 (kamus server.kodeTidakAda); dipakai bila badan jawaban tanpa `error`. */
const KODE_TIDAK_ADA = 'Kode tidak ditemukan';
/** Jeda setelah ketikan terakhir sebelum kode diperiksa, dan batas tunggu jawaban server (ms). */
const JEDA_KETIK = 280;
const BATAS_TUNGGU = 8000;
/**
 * Keadaan pemeriksaan kode. `pesan`/`info.alasan` = teks ASLI server (Indonesia), baru
 * diterjemahkan saat ditampilkan. `gagal` = jaringan/server tidak menjawab dengan benar: pemain
 * TIDAK dikunci (boleh coba lagi atau lanjut; server memeriksa lagi saat gabung).
 */
type Cek =
  | { s: 'kosong' }
  | { s: 'memeriksa' }
  | { s: 'ada'; info: InfoRoom }
  | { s: 'tolak'; info: InfoRoom }
  | { s: 'tiada'; pesan: string }
  | { s: 'gagal' };
type JawabanInfo = Partial<Omit<InfoRoom, 'ok'>> & { ok?: boolean; error?: unknown };
async function periksaKode(code: string, signal: AbortSignal): Promise<Cek> {
  const res = await fetch('/api/room/' + encodeURIComponent(code) + '/info', { signal, headers: { accept: 'application/json' } });
  const body = await res.json().catch(() => null) as JawabanInfo | null;
  if (res.ok && body?.ok === true && typeof body.eventName === 'string') {
    const info: InfoRoom = { ok: true, code, eventName: body.eventName, phase: String(body.phase ?? ''), playerCount: Math.max(0, Math.trunc(Number(body.playerCount)) || 0), bisaGabung: body.bisaGabung === true, alasan: typeof body.alasan === 'string' ? body.alasan : undefined };
    return info.bisaGabung ? { s: 'ada', info } : { s: 'tolak', info };
  }
  // 404 berbadan JSON { ok:false } = kode memang tidak ada. 404 lain (mis. server lama tanpa rute ini) = gagal.
  if (res.status === 404 && body?.ok === false) return { s: 'tiada', pesan: typeof body.error === 'string' ? body.error : KODE_TIDAK_ADA };
  return { s: 'gagal' };
}
const sudahMulai = (info: InfoRoom) => /sudah dimulai/i.test(info.alasan ?? '') || (info.phase !== '' && info.phase !== 'LOBBY');
const teksMenunggu = (n: number) => t(n === 0 ? 'alur.pemainMenungguNol' : n === 1 ? 'alur.pemainMenungguSatu' : 'alur.pemainMenunggu', { n });
/** Status pemeriksaan kode. Wadah role="status" selalu ada, jadi tiap pergantian keadaan diumumkan. */
function StatusKode({ cek, code, onCobaLagi }: { cek: Cek; code: string; onCobaLagi: () => void }) {
  const mulai = cek.s === 'tolak' && sudahMulai(cek.info);
  return <div className={'alur-cek alur-cek-' + cek.s}>
    {cek.s === 'memeriksa' ? <span className="memuat alur-cek-ikon" aria-hidden="true" /> : cek.s === 'kosong' ? null : <span className="alur-cek-ikon"><Icon name={cek.s === 'ada' ? 'cek' : cek.s === 'tiada' ? 'silang' : mulai ? 'jam' : 'tanya'} size={26} /></span>}
    <div className="alur-cek-teks" role="status">
      {cek.s === 'kosong' ? <p>{t('alur.cekPetunjuk')}</p> : null}
      {cek.s === 'memeriksa' ? <p>{t('alur.cekMemeriksa')}</p> : null}
      {cek.s === 'ada' ? <><small>{t('alur.cekDitemukan')}</small><b>{terjemahkanBawaan(cek.info.eventName)}</b><p>{teksMenunggu(cek.info.playerCount)}</p></> : null}
      {cek.s === 'tolak' ? <><small>{terjemahkanBawaan(cek.info.eventName)}</small><b>{cek.info.alasan ? terjemahkanGalat(cek.info.alasan) : t('alur.cekTolak')}</b></> : null}
      {cek.s === 'tiada' ? <><b>{terjemahkanGalat(cek.pesan)}</b><p>{t('alur.cekTiadaSaran')}</p></> : null}
      {cek.s === 'gagal' ? <><b>{t('alur.cekGagal')}</b><p>{t('alur.cekGagalSaran')}</p></> : null}
    </div>
    {/* Tindakan di luar wadah status supaya tidak ikut dibacakan sebagai pengumuman. */}
    {mulai ? <Link className="quiet-link alur-cek-aksi" to={'/projector?room=' + code}>{t('pemain.tontonPermainan')} <Arrow /></Link> : null}
    {cek.s === 'gagal' ? <button type="button" className="text-button alur-cek-aksi" onClick={onCobaLagi}>{t('alur.cobaLagi')}</button> : null}
  </div>;
}
export default function Join() {
  useBahasa();
  const [params] = useSearchParams();
  const initial = cleanCode(params.get('room') ?? '');
  const nav = useNavigate();
  const { status } = useGame();
  // Profil dibaca sekali: menyimpan profil setelah berhasil gabung tidak boleh mengubah layar ini.
  const [profil] = useState(() => savedProfil());
  const [step, setStep] = useState(0);
  const [code, setCode] = useState(initial);
  const [cek, setCek] = useState<Cek>(initial.length === 4 ? { s: 'memeriksa' } : { s: 'kosong' });
  const [percobaan, setPercobaan] = useState(0);
  const [nickname, setNickname] = useState(() => profil?.nickname ?? savedIdentity(initial)?.nickname ?? '');
  const [look, setLook] = useState<PlayerLook>(() => profil?.look ?? savedIdentity(initial)?.look ?? { ...LOOK_BAWAAN });
  const [ubahDiri, setUbahDiri] = useState(false);
  // Teks ASLI dari server (Indonesia) atau GALAT_LOKAL; baru diterjemahkan saat ditampilkan.
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const previous = useMemo(() => code.length === 4 ? savedIdentity(code) : null, [code]);
  const connected = status === 'connected';
  const pakaiKartu = profil !== null && !ubahDiri;
  const nama = nickname.trim();
  const bolehLanjut = code.length === 4 && (cek.s === 'ada' || cek.s === 'gagal');
  // Kode dari alamat: tanpa jeda ketik, dan langsung ke langkah 2 bila room bisa dimasuki.
  const tanpaJeda = useRef(initial.length === 4);
  const majuSendiri = useRef(initial.length === 4);
  useEffect(() => {
    if (code.length !== 4) { setCek({ s: 'kosong' }); return; }
    setCek({ s: 'memeriksa' });
    const ctrl = new AbortController();
    let batal = false;
    const tunda = window.setTimeout(() => {
      tanpaJeda.current = false;
      const habis = window.setTimeout(() => ctrl.abort(), BATAS_TUNGGU);
      void periksaKode(code, ctrl.signal).catch((): Cek => ({ s: 'gagal' })).then(hasil => {
        window.clearTimeout(habis);
        if (batal) return;
        setCek(hasil);
        if (hasil.s === 'ada' && majuSendiri.current) setStep(1);
        majuSendiri.current = false;
      });
    }, tanpaJeda.current ? 0 : JEDA_KETIK);
    return () => { batal = true; window.clearTimeout(tunda); ctrl.abort(); };
  }, [code, percobaan]);
  // Fokus mengikuti langkah: ke judul langkah 2 (tanpa membuka papan ketik), kembali ke kolom kode.
  const judulRef = useRef<HTMLHeadingElement>(null);
  const kodeRef = useRef<HTMLInputElement>(null);
  const isianRef = useRef<HTMLDivElement>(null);
  const stepLalu = useRef(step);
  useEffect(() => {
    if (stepLalu.current === step) return;
    stepLalu.current = step;
    if (step === 0) kodeRef.current?.focus(); else judulRef.current?.focus();
  }, [step]);
  useEffect(() => { if (ubahDiri) isianRef.current?.focus(); }, [ubahDiri]);
  function periksaLagi() { tanpaJeda.current = true; setPercobaan(n => n + 1); }
  async function join(rejoin = false) {
    setSending(true); setError(null);
    const result = rejoin ? await actions.rejoin(code) : await actions.join(code, nama, look);
    setSending(false);
    if (result.ok) {
      // Isian di sini ikut menjadi profil perangkat (rejoin memakai identitas room, profil tidak disentuh).
      if (!rejoin) simpanProfil({ nickname: nama, look });
      nav('/lobby');
    } else setError(result.error ?? GALAT_LOKAL);
  }
  const sapaan = step === 0 ? t('tokoh.missRaksa.gabungKode') : pakaiKartu ? t('alur.missHaloLagi', { nama: profil.nickname }) : t('tokoh.missRaksa.gabungKenalan');
  return <PlayerShell back="/" label={t('pemain.labelGabung')}><main className={'join-main alur-join' + (step === 1 ? ' alur-join-l2' : '')}>
    {/* Langkah 2: Miss Raksa sedikit lebih kecil supaya isian & pilihan karakter muat di HP pendek. */}
    <div className="join-heading">{TOKOH.missRaksa.aktif ? <KarakterTokoh tokoh="missRaksa" className="join-tokoh" tinggi={step === 0 ? 116 : 96} teks={sapaan} /> : <Raki size={86} mood="sapa" />}<span className="eyebrow">{step === 0 ? t('pemain.langkah1') : t('pemain.langkahAkhir')}</span><h1 ref={judulRef} tabIndex={-1} className="alur-judul-fokus">{step === 0 ? t('pemain.judulKode') : pakaiKartu ? t('alur.judulSiap') : t('pemain.judulKenalan')}</h1><p>{step === 0 ? t('pemain.ketKode') : pakaiKartu ? t('alur.ketSiap') : t('pemain.ketKenalan')}</p></div>
    <form className="join-form" onSubmit={e => { e.preventDefault(); if (step === 0) { if (bolehLanjut) setStep(1); } else if (code.length === 4 && nama.length >= 2 && connected && !sending) void join(); }}>
      {step === 0 ? <><div className="code-field"><label className="sr-only" htmlFor="kode-room">{t('pemain.kodePermainan')}</label><input id="kode-room" ref={kodeRef} className="kolom kolom-kode" value={code} maxLength={4} inputMode="text" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} placeholder="ABCD" aria-describedby="alur-cek-kode" aria-invalid={cek.s === 'tiada' ? true : undefined} onChange={e => { majuSendiri.current = false; setCode(cleanCode(e.target.value)); setError(null); }} /></div><div id="alur-cek-kode"><StatusKode cek={cek} code={code} onCobaLagi={periksaLagi} /></div></>
        : <><div className="joined-code alur-room"><span className="alur-room-teks">{cek.s === 'ada' ? <b className="alur-room-acara">{terjemahkanBawaan(cek.info.eventName)}</b> : null}<span>{t('pemain.kodePermainan')} <b>{code}</b></span></span><button type="button" className="text-button" onClick={() => { setStep(0); setError(null); periksaLagi(); }}>{t('pemain.ubah')}</button></div>
          {pakaiKartu ? <div className="alur-diri"><Avatar look={look} size={64} mood="senang" /><b className="alur-diri-nama">{t('alur.mainSebagai', { nama })}</b><button type="button" className="text-button alur-diri-ubah" aria-label={t('alur.ubahProfilAria')} onClick={() => setUbahDiri(true)}>{t('alur.ubahKecil')}</button></div>
            : <div ref={isianRef} tabIndex={-1} role="group" aria-label={t('alur.judulUbah')} className="alur-isian"><CharacterPicker nickname={nickname} look={look} onNickname={setNickname} onLook={setLook} /></div>}</>}
      {previous && cek.s !== 'tiada' ? <button type="button" className="resume-button" disabled={!connected || sending} onClick={() => void join(true)}>{t('pemain.lanjutkanSebagai', { nama: previous.nickname })} <Arrow /></button> : null}
      {/* Langkah 2: bar aksi lengket di bawah layar; pesan galat ikut di dalamnya supaya selalu terlihat di dekat tombol. */}
      <div className={'alur-aksi' + (step === 1 ? ' alur-aksi-lengket' : '')}>
        {/* Pencocokan "sudah dimulai" memakai teks asli server, bukan terjemahannya. */}
        {error ? <Pesan jenis="error"><div>{error === GALAT_LOKAL ? t(GALAT_LOKAL) : terjemahkanGalat(error)}{/sudah dimulai/i.test(error) ? <Link className="quiet-link" to={'/projector?room=' + code}>{t('pemain.tontonPermainan')} <Arrow /></Link> : null}</div></Pesan> : null}
        {step === 1 && nama.length === 1 ? <p className="field-error" role="status">{t('pemain.namaMinimal')}</p> : null}
        {!connected && step === 1 ? <p className="connection-note" role="status">{t('pemain.menyambungkan')}</p> : null}
        <div className="alur-aksi-baris"><button className="primary-action" type="submit" disabled={step === 0 ? !bolehLanjut : nama.length < 2 || !connected || sending}>{sending ? t('pemain.sebentar') : step === 0 ? t('pemain.lanjut') : t('pemain.ikutBermain')}{!sending ? <Arrow /> : null}</button></div>
      </div>
      {step === 0 ? <Link className="quiet-link centered" to={profil ? '/solo' : '/kenalan'}>{t('alur.belumPunyaKode')}</Link> : null}
    </form>
  </main></PlayerShell>;
}
