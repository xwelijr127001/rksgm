/**
 * Komponen UI bersama RAKSA GAME.
 * Semua status ditampilkan dengan teks/ikon, tidak hanya warna.
 */

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { BRAND } from '@shared/brand';
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
import { t, useBahasa } from '../i18n';
import { terjemahkanBawaan } from '../i18n/galat';
import { useGame } from '../state/store';
import { gulirUntukTombol, kelasKonteks, useBisaGulir, useLapisanDialog, type KembaliKe } from './modal';
import './modal.css';

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
  useBahasa();
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
      <span className="timer" aria-label={t('layar.timerMenungguHost')}>
        <Icon name="jam" size={18} /> --
      </span>
    );
  }
  const mendesak = seconds <= 5;
  return (
    <span className="timer" role="timer" aria-live="off">
      <Icon name="jam" size={18} />
      <span className={mendesak ? 'timer-mendesak' : undefined}>{t('layar.timerDetik', { n: seconds })}</span>
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
  useBahasa();
  const { ratio, seconds } = useCountdown(endsAt, durationMs);
  if (ratio === null) return null;
  return (
    <div
      className={'timer-bar' + (seconds !== null && seconds <= 5 ? ' mendesak' : '')}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      aria-label={t('layar.sisaWaktu')}
    >
      <i style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------- fase

/** Nama fase dalam bahasa aktif (kamus: layar.fase.<PHASE>); fase tak dikenal ditampilkan apa adanya. */
export function phaseLabel(phase: Phase): string {
  const kunci = `layar.fase.${phase}`;
  const teks = t(kunci);
  return teks === kunci ? phase : teks;
}

export function PhaseBadge({ phase }: { phase: Phase }) {
  useBahasa();
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
  useBahasa();
  const info =
    status === 'connected'
      ? { cls: 'ok', text: t('layar.tersambung') }
      : status === 'reconnecting'
        ? { cls: '', text: t('layar.menyambungUlang') }
        : status === 'connecting'
          ? { cls: '', text: t('layar.menyambung') }
          : { cls: 'putus', text: t('layar.tidakTersambung') };
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
  useBahasa();
  const ikon = jenis === 'error' ? 'silang' : jenis === 'sukses' ? 'cek' : 'tanya';
  return (
    <div className={`pesan pesan-${jenis}`} role={jenis === 'error' ? 'alert' : 'status'}>
      <Icon name={ikon} size={20} />
      <div style={{ flex: 1 }}>{children}</div>
      {onTutup ? (
        <button className="btn btn-kecil btn-netral" onClick={onTutup} aria-label={t('layar.tutupPesan')}>
          {t('layar.tutup')}
        </button>
      ) : null}
    </div>
  );
}

/** `teks` bawaan: "Memuat..." dalam bahasa aktif. */
export function Memuat({ teks }: { teks?: string }) {
  useBahasa();
  return (
    <div className="kosong">
      <span className="memuat" aria-hidden /> <div style={{ marginTop: 10 }}>{teks ?? t('layar.memuat')}</div>
    </div>
  );
}

/** Teks `id` sama dengan DISCLAIMER di shared/brand.ts. */
export function Disclaimer() {
  useBahasa();
  return (
    <p className="mini lembut" style={{ marginTop: 8 }}>
      {t('layar.disclaimer')}
    </p>
  );
}

// ---------------------------------------------------------------- modal / konfirmasi

/**
 * Dialog modal bersama (logika di ./modal.ts, gaya di ./modal.css).
 * Dirender lewat portal ke <body>: fokus masuk ke judul saat dibuka, Tab/Shift+Tab berputar di dalam,
 * latar inert, Escape hanya menutup dialog teratas, klik latar menutup. Saat ditutup fokus kembali ke
 * `kembaliKe` (mis. tombol "Dokumen" bila dialog dibuka dari kanvas), lalu ke elemen pembuka.
 * Isi panjang menggulir di wilayah isi (bisa difokus & digulir keyboard); tombol aksi selalu terlihat.
 * `lebar` = lebar maksimum panel (bawaan 420px).
 */
export type SebabTutup = 'escape' | 'latar' | 'tombol';

export function Modal({
  judul,
  children,
  onTutup,
  aksi,
  kembaliKe,
  lebar,
  gaya,
}: {
  judul: string;
  children?: ReactNode;
  /** `sebab`: 'escape' | 'latar' | 'tombol'. Pemanggil yang perlu menjaga klik hantu cukup mengabaikan 'latar'. */
  onTutup: (sebab?: SebabTutup) => void;
  aksi?: ReactNode;
  kembaliKe?: KembaliKe;
  lebar?: number | string;
  /** 'lembar' = panel menempel di tepi bawah layar sempit (lembar bawah HP); bawaan = panel di tengah. */
  gaya?: 'lembar';
}) {
  useBahasa();
  const idJudul = useId();
  const latarRef = useRef<HTMLDivElement>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const isiRef = useRef<HTMLDivElement>(null);
  // Tekan dimulai di latar? (klik "hantu" dari ketukan yang membuka dialog, atau seret dari dalam panel, tidak menutup)
  const tekanDiLatar = useRef(false);
  const bisaGulir = useBisaGulir(isiRef);
  // Gaya pemain (player.css) bergantung pada leluhur .player-ui: bawa kelas tema halaman ke portal.
  const [konteks] = useState(() => kelasKonteks(typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null)));
  useLapisanDialog(latarRef, { onEscape: () => onTutup('escape'), kembaliKe, fokusAwal: () => judulRef.current });

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      ref={latarRef}
      className={'mdl-latar' + (konteks ? ` ${konteks}` : '')}
      data-gaya={gaya}
      onPointerDown={(e) => {
        tekanDiLatar.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        const dariLatar = tekanDiLatar.current;
        tekanDiLatar.current = false;
        if (e.target === e.currentTarget && dariLatar) onTutup('latar');
      }}
    >
      <div
        className="panel anim-skala mdl-panel"
        role="dialog"
        // Bisa difokus (bukan tab stop): klik/ketukan pada isi yang tidak bisa difokus - termasuk klik tiruan
        // setelah ketukan sentuh yang membuka dialog - memindah fokus ke panel ini, bukan ke body di luar dialog.
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={idJudul}
        style={lebar !== undefined ? { maxWidth: lebar } : undefined}
      >
        <h3
          id={idJudul}
          ref={judulRef}
          tabIndex={-1}
          className="mdl-judul"
          onKeyDown={(e) => {
            // Fokus awal di judul: panah / PageUp / PageDown / Home / End langsung menggulir isi.
            const isi = isiRef.current;
            if (!isi || !bisaGulir) return;
            const jarak = gulirUntukTombol(e.key, isi.clientHeight);
            if (jarak === null) return;
            e.preventDefault();
            if (jarak === 'awal') isi.scrollTop = 0;
            else if (jarak === 'akhir') isi.scrollTop = isi.scrollHeight;
            else isi.scrollBy({ top: jarak });
          }}
        >
          {judul}
        </h3>
        <div
          ref={isiRef}
          className="mdl-isi"
          {...(bisaGulir ? { tabIndex: 0, role: 'region', 'aria-label': t('umum.dialogIsi', { judul }) } : {})}
        >
          <div className="stack">{children}</div>
        </div>
        <div className="baris mdl-aksi">
          {aksi ?? (
            <button type="button" className="btn btn-netral" onClick={() => onTutup('tombol')}>
              {t('layar.tutup')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Tombol dengan konfirmasi dua langkah (untuk aksi berisiko host). `labelSetuju` bawaan: "Ya, lanjutkan" dalam bahasa aktif. */
export function TombolKonfirmasi({
  label,
  judul,
  pesan,
  onSetuju,
  kelas = 'btn btn-bahaya',
  labelSetuju,
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
  // Fokus kembali ke tombol ini walau klik tidak memberinya fokus (Safari) atau ia digambar ulang.
  const tombolRef = useRef<HTMLButtonElement>(null);
  useBahasa();
  return (
    <>
      <button ref={tombolRef} type="button" className={kelas} onClick={() => setBuka(true)} disabled={disabled}>
        {label}
      </button>
      {buka ? (
        <Modal
          judul={judul}
          onTutup={() => setBuka(false)}
          kembaliKe={() => tombolRef.current}
          aksi={
            <>
              <button type="button" className="btn btn-netral" onClick={() => setBuka(false)}>
                {t('layar.batal')}
              </button>
              <button
                type="button"
                className="btn btn-bahaya"
                onClick={() => {
                  setBuka(false);
                  onSetuju();
                }}
              >
                {labelSetuju ?? t('layar.yaLanjutkan')}
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
  useBahasa();

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#212121', light: '#ffffff' },
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
        <p className="kecil tebal">{t('layar.qrGagal')}</p>
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
          <img src={src} width={size - 20} height={size - 20} alt={t('layar.qrAlt', { alamat: value })} />
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
  useBahasa();
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
      aria-label={t('layar.kodeRoomAria', { kode: code.split('').join(' ') })}
    >
      {code}
    </span>
  );
}

// ---------------------------------------------------------------- kartu polis & dokumen

/** `teks` = kunci kamus; dibaca lewat t() saat render supaya ikut bahasa aktif. */
const FLAG_TEKS: Record<string, { teks: string; kelas: string; icon: 'cek' | 'silang' | 'tanya' }> = {
  ok: { teks: 'layar.flagSesuai', kelas: 'chip-hijau', icon: 'cek' },
  no: { teks: 'layar.flagPerhatikan', kelas: 'chip-merah', icon: 'silang' },
  info: { teks: 'layar.flagInfo', kelas: 'chip-biru', icon: 'tanya' },
};

export function PolicyCardView({ card, aktif }: { card: PolicyCard; aktif?: boolean }) {
  useBahasa();
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
                    {t(f.teks)}
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
  useBahasa();
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
                      <Icon name={f.icon} size={12} /> {t(f.teks)}
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
  useBahasa();
  const shown = limit ? rows.slice(0, limit) : rows;
  const sisa = limit ? Math.max(0, rows.length - limit) : 0;
  if (rows.length === 0) {
    return <div className="kosong">{t('layar.papanKosong')}</div>;
  }
  // Label hadiah BAWAAN ikut bahasa aktif; label isian panitia tampil apa adanya.
  const hadiah = (rank: number) => {
    const teks = !prizes ? null : rank === 1 ? prizes.first : rank === 2 ? prizes.second : rank === 3 ? prizes.third : null;
    return teks ? terjemahkanBawaan(teks) : null;
  };

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
            {r.playerId === highlightId ? <span className="mini lembut"> {t('layar.kamu')}</span> : null}
            {r.tied ? <span className="mini"> - {t('layar.seri')}</span> : null}
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
      {sisa > 0 ? <p className="kecil lembut tengah">{t('layar.pesertaLain', { n: sisa })}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------- stempel & confetti

/** `teks` bawaan: "Misi Selesai" dalam bahasa aktif. */
export function Stempel({ teks }: { teks?: string }) {
  useBahasa();
  return (
    <div
      className="anim-stempel"
      role="status"
      style={{
        display: 'inline-block',
        padding: '8px 18px',
        border: '4px solid var(--hijau)',
        color: 'var(--utama-teks)',
        borderRadius: 12,
        fontFamily: 'var(--font-judul)',
        fontWeight: 800,
        fontSize: 22,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        background: 'rgba(255,255,255,0.9)',
      }}
    >
      {teks ?? t('layar.misiSelesai')}
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
        warna: ['#FF9000', '#2F7D57', '#3E7285', '#D32F2F', '#FFF5EC'][i % 5], // T-029: jingga merek + tiga warna status + rona terang
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
  useBahasa();
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
        aria-label={prefs.muted ? t('layar.suaraAktifkan') : t('layar.suaraMatikan')}
        title={prefs.muted ? t('layar.suaraAktifkan') : t('layar.suaraMatikan')}
      >
        {prefs.muted ? `🔇 ${t('layar.suaraMati')}` : `🔊 ${t('layar.suara')}`}
      </button>
    );
  }
  return (
    <div className="panel-krem stack stack-s">
      <strong className="kecil">{t('layar.suara')}</strong>
      <button className="btn btn-kecil btn-netral" onClick={toggleMute} aria-pressed={prefs.muted}>
        {prefs.muted ? `🔇 ${t('layar.semuaSuaraMati')}` : `🔊 ${t('layar.semuaSuaraHidup')}`}
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
        {t('layar.musikLatar')}
      </label>
      <label className="mini lembut">
        {t('layar.volumeMusik')}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(prefs.musicVolume * 100)}
          onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
          className="penuh"
          aria-label={t('layar.volumeMusik')}
        />
      </label>
      <label className="mini lembut">
        {t('layar.volumeEfek')}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(prefs.sfxVolume * 100)}
          onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
          className="penuh"
          aria-label={t('layar.volumeEfekAria')}
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
