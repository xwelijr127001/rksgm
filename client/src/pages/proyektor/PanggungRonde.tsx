/**
 * T-059: layar proyektor SAAT pertandingan (BRIEFING/ACTIVE = menjawab, REVEAL = pembahasan, LEADERBOARD = peringkat), dunia
 * piksel yang sama dengan panggung juara T-057. Pemilik: "ini juga belum ramah sama sekali" (owner-76/77/78: halaman gelap,
 * kotak kecil, ruang kosong, Bu Isti chibi).
 *
 * Panggung tetap 1920 x 1016 (1080 dikurangi bilah status) yang DISKALAKAN utuh ke ruang di bawah bilah status
 * (1920x1080 -> x 1,0; 1366x768 -> x 0,68; 1280x720 -> x 0,63), tanpa gulir. Latar: dinding kantor klaim krem + lis kayu +
 * lantai papan (hangat, bukan halaman gelap). Ukuran huruf di panggung: judul 60-64 px, isi >= 32 px, nama >= 34 px.
 *
 * - Menjawab: adegan kasus BESAR di kiri (~60 %); kanan: judul misi, satu kalimat instruksi besar, bar waktu piksel besar,
 *   "X / N sudah menjawab" dan wajah piksel pemain yang muncul saat mereka mengirim (isi jawaban TIDAK ditampilkan).
 *   Briefing: Miss Raksa piksel membawakan kasus di gelembung + "adegan siap".
 * - Pembahasan: adegan dengan tanda jawaban benar (seperti sebelumnya) besar; Bu Isti PIKSEL dengan gelembung "yang dibawa
 *   pulang"; jawaban tepat sebagai 2-3 kartu piksel besar; alasan/penjelasan di baris lebih kecil.
 * - Peringkat: 10 besar sebagai baris piksel dengan wajah T-052, panah naik/turun dari `delta` (data server; "baru" tidak ada di
 *   data, jadi dilewati), poin menghitung naik; kartu ringkasan ronde (terkirim X dari N, rata-rata ketepatan, tercepat bila
 *   ada `submitElapsedSeconds`) + Bu Isti melambai dengan satu kalimat.
 * - "Perjalanan misi" = strip piksel kecil 10 perhentian di pojok kiri atas (bukan panel besar).
 * Data & alur socket sama (tidak ada perubahan protokol). Gerak dikurangi: tanpa animasi masuk/hitung, angka langsung akhir.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { LeaderRow, MissionPublic, MissionReveal, Phase, RoomPublicState } from '@shared/types';
import { TOKOH } from '@shared/brand';
import { AvatarPiksel } from '../../art/AvatarPiksel';
import { playSfx } from '../../audio/audio';
import { AdeganLayar } from '../../game/AdeganLayar';
import { SpriteTokoh } from '../../game/KarakterTokoh';
import { useCountdown, useReducedMotion } from '../../hooks';
import { t } from '../../i18n';
import istiPng from './isti-piksel.png';
import './panggung.css';
import './ronde.css';

const LEBAR = 1920;
const TINGGI = 1016;

/** Kotak panggung 1920 x 1016 yang diskalakan utuh ke wadahnya (sama dengan PanggungJuara). */
function KotakPanggung({ children, label }: { children: ReactNode; label: string }) {
  const wadah = useRef<HTMLDivElement>(null);
  const [u, setU] = useState({ s: 1, x: 0, y: 0 });
  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const hitung = () => {
      const w = el.clientWidth, h = el.clientHeight;
      const s = Math.max(0.2, Math.min(w / LEBAR, h / TINGGI));
      setU({ s, x: (w - LEBAR * s) / 2, y: (h - TINGGI * s) / 2 });
    };
    hitung();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(hitung);
    ro?.observe(el);
    window.addEventListener('resize', hitung);
    return () => { ro?.disconnect(); window.removeEventListener('resize', hitung); };
  }, []);
  return (
    <div ref={wadah} className="pjp-wadah">
      <section className="pjr-panggung" aria-label={label} style={{ transform: `translate(${u.x}px, ${u.y}px) scale(${u.s})` }}>
        <div className="pjr-dinding" aria-hidden="true" />
        <div className="pjr-lantai" aria-hidden="true" />
        {children}
      </section>
    </div>
  );
}

/** Bu Isti piksel badan penuh (isti-piksel.png: 'diam' tangan bertaut, 'lambai' melambai), `s` px per piksel seni. */
const ISTI = { diam: [0, 36], lambai: [38, 48] } as const;
const ISTI_W = 86, ISTI_H = 107;
function IstiPiksel({ pose, s }: { pose: keyof typeof ISTI; s: number }) {
  const [x, w] = ISTI[pose];
  return <span className="pjr-isti" aria-hidden="true" style={{ width: w * s, height: ISTI_H * s, backgroundImage: `url(${istiPng})`, backgroundSize: `${ISTI_W * s}px ${ISTI_H * s}px`, backgroundPosition: `-${x * s}px 0` }} />;
}

/** Strip piksel "Perjalanan misi": 10 perhentian, yang selesai dicentang, yang berjalan disorot. */
function PetaStrip({ ronde, total, lokasi }: { ronde: number; total: number; lokasi: string | null }) {
  const n = Math.max(1, total);
  return (
    <div className="pjr-peta" role="img" aria-label={`${t('layar.perjalananMisi')}: ${t('layar.rondeKe', { n: ronde + 1, total: n })}`}>
      <span className="pjr-peta-judul">{t('layar.perjalananMisi')}</span>
      <ol aria-hidden="true">
        {Array.from({ length: n }, (_, i) => (
          <li key={i} className={i < ronde ? 'selesai' : i === ronde ? 'kini' : ''}>{i < ronde ? '✓' : i + 1}</li>
        ))}
      </ol>
      {lokasi ? <span className="pjr-peta-lokasi">{lokasi}</span> : null}
    </div>
  );
}

/** Angka menghitung naik dari 0 ke `ke` (~0,9 s); gerak dikurangi = langsung. */
function useHitungNaik(ke: number, kurang: boolean, kunci: string): number {
  const [v, setV] = useState(kurang ? ke : 0);
  useEffect(() => {
    if (kurang) { setV(ke); return; }
    let raf = 0; const mulai = performance.now();
    const langkah = (now: number) => {
      const p = Math.min(1, (now - mulai) / 900);
      setV(Math.round(ke * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(langkah);
    };
    raf = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(raf);
  }, [ke, kurang, kunci]);
  return v;
}

function Poin({ n, kurang, kunci }: { n: number; kurang: boolean; kunci: string }) {
  const v = useHitungNaik(n, kurang, kunci);
  return <>{v.toLocaleString('id-ID')}</>;
}

/** Bar waktu piksel besar (segmen 24 kotak) + detik. */
function BarWaktu({ endsAt, durationMs }: { endsAt: number | null; durationMs: number | null }) {
  const { seconds, ratio } = useCountdown(endsAt, durationMs);
  if (seconds === null) return null;
  const isi = ratio === null ? 24 : Math.ceil(ratio * 24);
  return (
    <div className={'pjr-waktu' + (seconds <= 5 ? ' mendesak' : '')} role="timer" aria-label={t('layar.sisaWaktu')}>
      <b>{seconds}</b>
      <span className="pjr-waktu-bar" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} className={i < isi ? 'isi' : ''} />)}</span>
    </div>
  );
}

function Adegan({ misi, ronde, reveal }: { misi: MissionPublic | null; ronde: number; reveal: MissionReveal | null }) {
  return (
    <div className="pjr-adegan">
      {misi ? (
        <>
          <div className="pjr-adegan-label"><span className="pjr-chip jingga">{misi.productLabel}</span><span className="pjr-chip">{misi.location}</span></div>
          <div className="pjr-adegan-isi"><AdeganLayar mission={misi} roundIndex={ronde} reveal={reveal} /></div>
        </>
      ) : <p className="pjr-kosong">{t('layar.menungguMisi')}</p>}
    </div>
  );
}

const MAKS_WAJAH = 18;

export function PanggungRonde({ fase, room, misi, reveal }: { fase: Phase; room: RoomPublicState; misi: MissionPublic | null; reveal: MissionReveal | null }) {
  const kurang = useReducedMotion();
  const ronde = room.roundIndex;
  const peta = <PetaStrip ronde={ronde} total={room.totalRounds} lokasi={misi?.location ?? null} />;

  // Wajah pemain yang sudah mengirim, urut waktu kirim (yang baru muncul di belakang). "tik" ringan saat ada kiriman baru.
  const terkirim = useMemo(
    () => room.players.filter((p) => p.submittedThisRound).sort((a, b) => (a.submitElapsedSeconds ?? 0) - (b.submitElapsedSeconds ?? 0)),
    [room.players],
  );
  const jumlahKirim = useRef(room.submittedCount);
  useEffect(() => {
    if (fase === 'ACTIVE' && room.submittedCount > jumlahKirim.current) playSfx('tik');
    jumlahKirim.current = room.submittedCount;
  }, [room.submittedCount, fase]);

  if (fase === 'BRIEFING' || fase === 'ACTIVE') {
    const total = room.playerCount;
    return (
      <KotakPanggung label={misi ? t('layar.judulMisi', { n: misi.number, judul: misi.title }) : t('layar.menungguMisi')}>
        {peta}
        <Adegan misi={misi} ronde={ronde} reveal={null} />
        <div className="pjr-kanan">
          <h2 className="pjr-judul">{misi ? t('layar.judulMisi', { n: misi.number, judul: misi.title }) : t('layar.menungguMisi')}</h2>
          {fase === 'BRIEFING' && misi ? (
            <div className="pjr-sapa">
              {TOKOH.missRaksa.aktif ? <span className="pjr-sapa-tokoh"><SpriteTokoh tokoh="missRaksa" tinggi={276} lambai={!kurang} /></span> : null}
              <p className="pjr-gelembung"><b>{TOKOH.missRaksa.nama || t('layar.briefing')}</b>{misi.rakiBriefing}</p>
            </div>
          ) : misi ? (
            <>
              <p className="pjr-cerita">{misi.story}</p>
              <p className="pjr-instruksi">{misi.instruction}</p>
            </>
          ) : null}
          <BarWaktu endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} />
          {fase === 'BRIEFING' ? (
            <p className="pjr-hitung">{t('layar.adeganSiap', { siap: room.sceneReadyCount, total })}</p>
          ) : (
            <div className="pjr-kirim">
              <p className="pjr-hitung" aria-live="polite">{t('layar.sudahMenjawab', { masuk: room.submittedCount, total })}</p>
              {terkirim.length ? (
                <ul className="pjr-wajah">
                  {terkirim.slice(0, MAKS_WAJAH).map((p) => (
                    <li key={p.id} className={kurang ? '' : 'muncul'} title={p.nickname}><AvatarPiksel look={p.look} ukuran={64} /></li>
                  ))}
                  {terkirim.length > MAKS_WAJAH ? <li className="pjr-wajah-sisa">+{terkirim.length - MAKS_WAJAH}</li> : null}
                </ul>
              ) : <p className="pjr-kecil">{total ? t('layar.menungguJawabanPertama') : t('layar.belumAdaPesertaRoom')}</p>}
              <p className="pjr-kecil">{t('layar.kunciSaatPembahasan')}</p>
            </div>
          )}
        </div>
      </KotakPanggung>
    );
  }

  if (fase === 'REVEAL') {
    const benar = reveal ? reveal.steps.flatMap((s) => s.correctText).slice(0, 3) : [];
    const alasan = reveal ? reveal.steps.map((s) => s.explanation).filter(Boolean).join(' ') : '';
    return (
      <KotakPanggung label={misi ? t('layar.pembahasanMisi', { n: misi.number, judul: misi.title }) : t('layar.pembahasan')}>
        {peta}
        <Adegan misi={misi} ronde={ronde} reveal={reveal} />
        <div className="pjr-kanan">
          <h2 className="pjr-judul">{misi ? t('layar.pembahasanMisi', { n: misi.number, judul: misi.title }) : t('layar.pembahasan')}</h2>
          {!reveal ? <p className="pjr-cerita">{t('layar.pembahasanBelum')}</p> : (
            <>
              <div className="pjr-juri">
                {TOKOH.isti.aktif ? <IstiPiksel pose="diam" s={3} /> : null}
                <p className="pjr-gelembung"><b>{t('layar.dibawaPulang')}</b>{reveal.learning}</p>
              </div>
              <ol className="pjr-kartu" aria-label={t('layar.jawabanTepat')}>
                {benar.map((teks, i) => <li key={i} className={kurang ? '' : 'muncul'} style={{ animationDelay: `${300 + i * 250}ms` } as CSSProperties}><span aria-hidden="true">✓</span>{teks}</li>)}
              </ol>
              {alasan ? <p className="pjr-alasan">{alasan}</p> : null}
            </>
          )}
        </div>
      </KotakPanggung>
    );
  }

  // LEADERBOARD
  return <Peringkat room={room} misi={misi} kurang={kurang} peta={peta} />;
}

function Peringkat({ room, misi, kurang, peta }: { room: RoomPublicState; misi: MissionPublic | null; kurang: boolean; peta: ReactNode }) {
  const papan: readonly LeaderRow[] = room.leaderboard ?? [];
  const sepuluh = papan.slice(0, 10);
  const kunci = `r${room.roundIndex}`;
  let jumlah = 0, terjawab = 0;
  for (const r of papan) { jumlah += r.totalAccuracy; terjawab += r.answeredCount; }
  const rata = terjawab > 0 ? Math.round((jumlah / terjawab) * 100) : null;
  const cepat = room.players
    .filter((p) => p.submittedThisRound && p.submitElapsedSeconds !== null)
    .sort((a, b) => (a.submitElapsedSeconds ?? 0) - (b.submitElapsedSeconds ?? 0))[0];
  return (
    <KotakPanggung label={t('layar.peringkat10')}>
      {peta}
      <div className="pjr-papan">
        <h2 className="pjr-judul">{t('layar.peringkat10')}</h2>
        {sepuluh.length ? (
          <ol>
            {sepuluh.map((r, i) => (
              <li key={r.playerId} className={(r.rank === 1 ? 'satu ' : '') + (kurang ? '' : 'muncul')} style={{ animationDelay: `${i * 90}ms` } as CSSProperties}>
                <span className="pjr-no">{r.rank}</span>
                <AvatarPiksel look={r.look} ukuran={56} />
                <span className="pjr-nama">{r.nickname}</span>
                <span className={'pjr-gerak ' + (r.delta > 0 ? 'naik' : r.delta < 0 ? 'turun' : 'tetap')} aria-label={r.delta > 0 ? `+${r.delta}` : r.delta < 0 ? String(r.delta) : undefined}>
                  {r.delta > 0 ? `▲${r.delta}` : r.delta < 0 ? `▼${-r.delta}` : ''}
                </span>
                <span className="pjr-poin"><Poin n={r.totalPoints} kurang={kurang} kunci={kunci} /></span>
              </li>
            ))}
          </ol>
        ) : <p className="pjr-kosong">{t('layar.belumAdaHasil')}</p>}
      </div>
      <div className="pjr-ringkas">
        <h2 className="pjr-sub">{t('layar.ringkasanRonde', { n: room.roundIndex + 1 })}{misi ? ` · ${misi.title}` : ''}</h2>
        <dl>
          <div><dt>{t('layar.terkirimDari')}</dt><dd>{room.submittedCount} / {room.playerCount}</dd></div>
          <div><dt>{t('layar.rataKetepatanPendek')}</dt><dd>{rata === null ? '–' : `${rata}%`}</dd></div>
        </dl>
        {cepat ? <p className="pjr-cepat"><AvatarPiksel look={cepat.look} ukuran={40} />{t('layar.tercepat', { nama: cepat.nickname, n: cepat.submitElapsedSeconds ?? 0 })}</p> : null}
      </div>
      <div className="pjr-juri pjr-juri-papan">
        {TOKOH.isti.aktif ? <IstiPiksel pose="lambai" s={3} /> : null}
        <p className="pjr-gelembung">{TOKOH.isti.aktif ? <b>{TOKOH.isti.nama}</b> : null}{t('tokoh.isti.ringkasan')}</p>
      </div>
    </KotakPanggung>
  );
}
