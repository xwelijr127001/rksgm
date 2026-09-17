/**
 * Komponen UI bersama RAKSA GAME.
 * Semua status ditampilkan dengan teks/ikon, tidak hanya warna.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import { BRAND, DISCLAIMER } from '@shared/brand';
import type { DocTable, LeaderRow, Phase, PolicyCard, Prizes } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { Icon } from '../art/Icon';
import {
  getAudioPrefs,
  initAudio,
  setMuted,
  setMusicEnabled,
  setMusicVolume,
  setSfxVolume,
} from '../audio/audio';
import { useAudioPrefs, useCountdown, useReducedMotion } from '../hooks';
import { useGame } from '../state/store';

// ---------------------------------------------------------------- judul brand

export function BrandTitle({ size = 'besar' }: { size?: 'besar' | 'kecil' }) {
  if (BRAND.logoPath) {
    return (
      <img
        src={BRAND.logoPath}
        alt={BRAND.gameName}
        style={{ height: size === 'besar' ? 64 : 34, width: 'auto' }}
      />
    );
  }
  // Logo resmi belum tersedia -> judul tipografis (lihat README untuk menggantinya).
  const fs = size === 'besar' ? 'clamp(30px, 9vw, 54px)' : '19px';
  return (
    <span
      aria-label={BRAND.gameName}
      style={{
        fontFamily: 'var(--font-judul)',
        fontWeight: 800,
        fontSize: fs,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        display: 'inline-flex',
        gap: '0.28em',
        alignItems: 'baseline',
      }}
    >
      <span style={{ color: 'var(--hijau)' }}>RAKSA</span>
      <span
        style={{
          color: 'var(--tinta)',
          background: 'var(--kuning)',
          padding: '0.04em 0.3em',
          borderRadius: 12,
          boxShadow: '0 3px 0 var(--kuning-tua)',
        }}
      >
        GAME
      </span>
    </span>
  );
}

// ---------------------------------------------------------------- timer

export function Timer({
  endsAt,
  durationMs,
  label,
  onZero,
}: {
  endsAt: number | null;
  durationMs: number | null;
  label?: string;
  onZero?: () => void;
}) {
  const { seconds, ratio } = useCountdown(endsAt, durationMs);
  const fired = useRef(false);
  useEffect(() => {
    if (seconds === 0 && !fired.current) {
      fired.current = true;
      onZero?.();
    }
    if (seconds !== 0) fired.current = false;
  }, [seconds, onZero]);

  if (seconds === null) {
    return (
      <span className="timer" aria-label="Menunggu host">
        <Icon name="jam" size={18} /> --
      </span>
    );
  }
  const mendesak = seconds <= 5;
  return (
    <span className="timer" role="timer" aria-live="off">
      <Icon name="jam" size={18} />
      <span style={{ color: mendesak ? 'var(--kuning)' : undefined }}>{seconds}s</span>
      {label ? <span className="mini lembut">{label}</span> : null}
      {ratio !== null ? (
        <span className={'timer-bar' + (mendesak ? ' mendesak' : '')} style={{ width: 84 }} aria-hidden>
          <i style={{ width: `${ratio * 100}%` }} />
        </span>
      ) : null}
    </span>
  );
}

export function TimerBar({ endsAt, durationMs }: { endsAt: number | null; durationMs: number | null }) {
  const { ratio, seconds } = useCountdown(endsAt, durationMs);
  if (ratio === null) return null;
  return (
    <div
      className={'timer-bar' + (seconds !== null && seconds <= 5 ? ' mendesak' : '')}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      aria-label="Sisa waktu"
    >
      <i style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------- fase

const PHASE_LABEL: Record<Phase, string> = {
  LOBBY: 'Lobby',
  TUTORIAL: 'Tutorial',
  BRIEFING: 'Briefing',
  ACTIVE: 'Menjawab',
  REVEAL: 'Pembahasan',
  LEADERBOARD: 'Peringkat',
  FINISHED: 'Selesai',
  PAUSED: 'Dijeda',
};

export function phaseLabel(phase: Phase): string {
  return PHASE_LABEL[phase] ?? phase;
}

export function PhaseBadge({ phase }: { phase: Phase }) {
  const warna =
    phase === 'ACTIVE' ? 'chip-hijau'
    : phase === 'PAUSED' ? 'chip-merah'
    : phase === 'REVEAL' || phase === 'LEADERBOARD' ? 'chip-biru'
    : 'chip-kuning';
  return (
    <span className={`chip ${warna}`}>
      <Icon name={phase === 'PAUSED' ? 'jam' : phase === 'ACTIVE' ? 'kilat' : 'bintang'} size={15} />
      {phaseLabel(phase)}
    </span>
  );
}

// ---------------------------------------------------------------- koneksi

export function ConnectionBadge() {
  const { status } = useGame();
  const info =
    status === 'connected'
      ? { cls: 'ok', text: 'Tersambung' }
      : status === 'reconnecting'
        ? { cls: '', text: 'Menyambung ulang...' }
        : status === 'connecting'
          ? { cls: '', text: 'Menyambung...' }
          : { cls: 'putus', text: 'Tidak tersambung' };
  return (
    <span className="status-koneksi" role="status">
      <i className={`titik ${info.cls}`} aria-hidden />
      {info.text}
    </span>
  );
}

// ---------------------------------------------------------------- pesan

export function Pesan({
  jenis = 'info',
  children,
  onTutup,
}: {
  jenis?: 'error' | 'info' | 'sukses' | 'kuning';
  children: ReactNode;
  onTutup?: () => void;
}) {
  const ikon = jenis === 'error' ? 'silang' : jenis === 'sukses' ? 'cek' : 'tanya';
  return (
    <div className={`pesan pesan-${jenis}`} role={jenis === 'error' ? 'alert' : 'status'}>
      <Icon name={ikon} size={20} />
      <div style={{ flex: 1 }}>{children}</div>
      {onTutup ? (
        <button className="btn btn-kecil btn-netral" onClick={onTutup} aria-label="Tutup pesan">
          Tutup
        </button>
      ) : null}
    </div>
  );
}

export function Memuat({ teks = 'Memuat...' }: { teks?: string }) {
  return (
    <div className="kosong">
      <span className="memuat" aria-hidden /> <div style={{ marginTop: 10 }}>{teks}</div>
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="mini lembut" style={{ marginTop: 8 }}>
      {DISCLAIMER}
    </p>
  );
}

// ---------------------------------------------------------------- modal / konfirmasi

export function Modal({
  judul,
  children,
  onTutup,
  aksi,
}: {
  judul: string;
  children?: ReactNode;
  onTutup: () => void;
  aksi?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTutup();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onTutup]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={judul}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(23,54,42,0.55)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 60,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <div className="panel anim-skala" style={{ width: '100%', maxWidth: 420 }}>
        <h3>{judul}</h3>
        <div className="stack">{children}</div>
        <div className="baris" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
          {aksi ?? (
            <button className="btn btn-netral" onClick={onTutup}>
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tombol dengan konfirmasi dua langkah (untuk aksi berisiko host). */
export function TombolKonfirmasi({
  label,
  judul,
  pesan,
  onSetuju,
  kelas = 'btn btn-bahaya',
  labelSetuju = 'Ya, lanjutkan',
  disabled,
}: {
  label: ReactNode;
  judul: string;
  pesan: ReactNode;
  onSetuju: () => void;
  kelas?: string;
  labelSetuju?: string;
  disabled?: boolean;
}) {
  const [buka, setBuka] = useState(false);
  return (
    <>
      <button className={kelas} onClick={() => setBuka(true)} disabled={disabled}>
        {label}
      </button>
      {buka ? (
        <Modal
          judul={judul}
          onTutup={() => setBuka(false)}
          aksi={
            <>
              <button className="btn btn-netral" onClick={() => setBuka(false)}>
                Batal
              </button>
              <button
                className="btn btn-bahaya"
                onClick={() => {
                  setBuka(false);
                  onSetuju();
                }}
              >
                {labelSetuju}
              </button>
            </>
          }
        >
          <p>{pesan}</p>
        </Modal>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------- QR

export function QrCode({ value, size = 220, label }: { value: string; size?: number; label?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#17362a', light: '#ffffff' },
    })
      .then((url) => {
        if (alive) setSrc(url);
      })
      .catch(() => {
        if (alive) setGagal(true);
      });
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (gagal) {
    return (
      <div className="panel-krem tengah" style={{ width: size }}>
        <p className="kecil tebal">QR gagal dibuat.</p>
        <p className="mini mono" style={{ wordBreak: 'break-all' }}>
          {value}
        </p>
      </div>
    );
  }
  return (
    <figure style={{ margin: 0, textAlign: 'center' }}>
      <div
        style={{
          width: size,
          height: size,
          background: '#fff',
          borderRadius: 18,
          padding: 10,
          display: 'grid',
          placeItems: 'center',
          boxShadow: 'var(--shadow)',
        }}
      >
        {src ? (
          <img src={src} width={size - 20} height={size - 20} alt={`QR menuju ${value}`} />
        ) : (
          <span className="memuat" aria-hidden />
        )}
      </div>
      {label ? (
        <figcaption className="mini mono" style={{ marginTop: 8, wordBreak: 'break-all' }}>
          {label}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function KodeRoom({ code, size = 'besar' }: { code: string; size?: 'besar' | 'kecil' }) {
  return (
    <span
      className="mono tebal"
      style={{
        fontSize: size === 'besar' ? 'clamp(30px, 8vw, 52px)' : '20px',
        letterSpacing: '0.18em',
        color: 'var(--kuning)',
        background: 'var(--tinta)',
        padding: size === 'besar' ? '8px 18px' : '4px 10px',
        borderRadius: 14,
        display: 'inline-block',
      }}
      aria-label={`Kode room ${code.split('').join(' ')}`}
    >
      {code}
    </span>
  );
}

// ---------------------------------------------------------------- kartu polis & dokumen

const FLAG_TEKS: Record<string, { teks: string; kelas: string; icon: 'cek' | 'silang' | 'tanya' }> = {
  ok: { teks: 'sesuai', kelas: 'chip-hijau', icon: 'cek' },
  no: { teks: 'perhatikan', kelas: 'chip-merah', icon: 'silang' },
  info: { teks: 'info', kelas: 'chip-biru', icon: 'tanya' },
};

export function PolicyCardView({ card, aktif }: { card: PolicyCard; aktif?: boolean }) {
  return (
    <article
      className="panel-krem"
      style={{
        minWidth: 250,
        borderColor: aktif ? 'var(--hijau)' : undefined,
        borderWidth: aktif ? 3 : 2,
      }}
    >
      <div className="baris-antara" style={{ marginBottom: 8 }}>
        <div>
          <strong style={{ fontFamily: 'var(--font-judul)', fontSize: 17 }}>{card.title}</strong>
          {card.subtitle ? <div className="mini lembut">{card.subtitle}</div> : null}
        </div>
        <span className="label-produk">{card.product}</span>
      </div>
      <dl style={{ margin: 0, display: 'grid', gap: 6 }}>
        {card.rows.map((r, i) => {
          const f = r.flag ? FLAG_TEKS[r.flag] : null;
          return (
            <div key={i} style={{ display: 'grid', gap: 2 }}>
              <dt className="mini lembut tebal">{r.label}</dt>
              <dd style={{ margin: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="kecil tebal">{r.value}</span>
                {f ? (
                  <span className={`chip ${f.kelas} mini`} style={{ minHeight: 22, padding: '1px 8px' }}>
                    <Icon name={f.icon} size={12} />
                    {f.teks}
                  </span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>
      {card.note ? <p className="mini lembut" style={{ marginTop: 8, marginBottom: 0 }}>{card.note}</p> : null}
    </article>
  );
}

export function DocTableView({ table }: { table: DocTable }) {
  return (
    <article className="panel-krem" style={{ minWidth: 230 }}>
      <div className="baris" style={{ marginBottom: 6 }}>
        {table.icon ? <Icon name={table.icon} size={22} /> : null}
        <strong style={{ fontFamily: 'var(--font-judul)' }}>{table.title}</strong>
      </div>
      <table className="tabel">
        <tbody>
          {table.rows.map((r, i) => {
            const f = r.flag ? FLAG_TEKS[r.flag] : null;
            return (
              <tr key={i}>
                <th scope="row" style={{ textTransform: 'none', fontSize: 12 }}>
                  {r.label}
                </th>
                <td className="tebal">
                  {r.value}
                  {f && r.flag !== 'info' ? (
                    <span className="mini" style={{ marginLeft: 6 }}>
                      <Icon name={f.icon} size={12} /> {f.teks}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {table.note ? <p className="mini lembut" style={{ marginBottom: 0 }}>{table.note}</p> : null}
    </article>
  );
}

// ---------------------------------------------------------------- leaderboard

export function Leaderboard({
  rows,
  highlightId,
  limit,
  showAvatar = true,
  prizes,
}: {
  rows: LeaderRow[];
  highlightId?: string | null;
  limit?: number;
  showAvatar?: boolean;
  prizes?: Prizes;
}) {
  const shown = limit ? rows.slice(0, limit) : rows;
  const sisa = limit ? Math.max(0, rows.length - limit) : 0;
  if (rows.length === 0) {
    return <div className="kosong">Belum ada peringkat. Peringkat muncul setelah ronde ditutup.</div>;
  }
  const hadiah = (rank: number) =>
    !prizes ? null : rank === 1 ? prizes.first : rank === 2 ? prizes.second : rank === 3 ? prizes.third : null;

  return (
    <div className="papan">
      {shown.map((r) => (
        <div
          key={r.playerId}
          className={`papan-baris r${r.rank} ${r.playerId === highlightId ? 'saya' : ''}`}
        >
          <span className="papan-peringkat">{r.rank}</span>
          {showAvatar ? <Avatar look={r.look} size={38} /> : null}
          <span className="papan-nama">
            {r.nickname}
            {r.playerId === highlightId ? <span className="mini lembut"> (kamu)</span> : null}
            {r.tied ? <span className="mini"> - seri</span> : null}
            {hadiah(r.rank) ? <div className="mini lembut">{hadiah(r.rank)}</div> : null}
          </span>
          {r.delta !== 0 ? (
            <span className={r.delta > 0 ? 'delta-naik' : 'delta-turun'}>
              {r.delta > 0 ? `▲${r.delta}` : `▼${Math.abs(r.delta)}`}
            </span>
          ) : null}
          <span className="papan-poin">{r.totalPoints.toLocaleString('id-ID')}</span>
        </div>
      ))}
      {sisa > 0 ? <p className="kecil lembut tengah">+{sisa} peserta lain</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------- stempel & confetti

export function Stempel({ teks = 'Misi Selesai' }: { teks?: string }) {
  return (
    <div
      className="anim-stempel"
      role="status"
      style={{
        display: 'inline-block',
        padding: '8px 18px',
        border: '4px solid var(--hijau)',
        color: 'var(--hijau)',
        borderRadius: 12,
        fontFamily: 'var(--font-judul)',
        fontWeight: 800,
        fontSize: 22,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        background: 'rgba(255,255,255,0.9)',
      }}
    >
      {teks}
    </div>
  );
}

export function Confetti({ jumlah = 60 }: { jumlah?: number }) {
  const reduced = useReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: jumlah }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        dur: 2.2 + Math.random() * 1.6,
        warna: ['#F6C445', '#176B45', '#2F6FB0', '#C4452F', '#FFF9E9'][i % 5],
        ukuran: 6 + Math.random() * 8,
        putar: Math.random() * 360,
      })),
    [jumlah],
  );
  if (reduced) return null;
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 50 }}>
      <style>{`@keyframes konfeti-jatuh{to{transform:translateY(112vh) rotate(720deg);opacity:0.15}}`}</style>
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '-6vh',
            left: `${b.left}%`,
            width: b.ukuran,
            height: b.ukuran * 0.6,
            background: b.warna,
            borderRadius: 2,
            transform: `rotate(${b.putar}deg)`,
            animation: `konfeti-jatuh ${b.dur}s linear ${b.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- audio

export function AudioControls({ ringkas = false }: { ringkas?: boolean }) {
  const prefs = useAudioPrefs();
  const toggleMute = () => {
    initAudio();
    setMuted(!prefs.muted);
  };
  if (ringkas) {
    return (
      <button
        className="btn btn-kecil btn-netral"
        onClick={toggleMute}
        aria-pressed={prefs.muted}
        aria-label={prefs.muted ? 'Aktifkan suara' : 'Matikan suara'}
        title={prefs.muted ? 'Aktifkan suara' : 'Matikan suara'}
      >
        {prefs.muted ? '🔇 Suara mati' : '🔊 Suara'}
      </button>
    );
  }
  return (
    <div className="panel-krem stack stack-s">
      <strong className="kecil">Suara</strong>
      <button className="btn btn-kecil btn-netral" onClick={toggleMute} aria-pressed={prefs.muted}>
        {prefs.muted ? '🔇 Semua suara: MATI' : '🔊 Semua suara: HIDUP'}
      </button>
      <label className="saklar kecil">
        <input
          type="checkbox"
          checked={prefs.musicEnabled}
          onChange={(e) => {
            initAudio();
            setMusicEnabled(e.target.checked);
          }}
        />
        Musik latar
      </label>
      <label className="mini lembut">
        Volume musik
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(prefs.musicVolume * 100)}
          onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
          className="penuh"
          aria-label="Volume musik"
        />
      </label>
      <label className="mini lembut">
        Volume efek
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(prefs.sfxVolume * 100)}
          onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
          className="penuh"
          aria-label="Volume efek suara"
        />
      </label>
    </div>
  );
}

/** Panggil initAudio() pada interaksi pertama halaman. */
export function AudioUnlocker() {
  useEffect(() => {
    const unlock = () => initAudio();
    const opts = { once: true, passive: true } as const;
    window.addEventListener('pointerdown', unlock, opts);
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  return null;
}

export { getAudioPrefs };
