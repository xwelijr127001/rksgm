/**
 * Layar host (prioritas desktop, tetap terbaca di HP/tablet).
 * Membuat room, mengundang peserta lewat QR, mengendalikan ronde, dan mengekspor hasil.
 * Teks tampil dalam bahasa aktif (kamus: ../i18n/kamus/host.ts). Data acara (nama acara,
 * label hadiah) yang DIISI panitia tampil apa adanya; hanya nilai BAWAAN yang ikut bahasa aktif
 * saat ditampilkan (terjemahkanBawaan). Kolom isian selalu memuat nilai aslinya.
 *
 * T-053 (Designer, owner 19 Nov): SATU LAYAR di laptop (1280x720, 1366x768, 1920x1080), berpandu, gaya piksel game.
 *  - Rel langkah di atas (1 Buat room -> 2 Undang -> 3 Tutorial & mulai -> 4 Jalankan ronde -> 5 Hasil) dengan langkah
 *    sekarang disorot + SATU baris "apa yang dilakukan sekarang".
 *  - Room aktif: baris judul + strip 10 chip ronde (selesai / sekarang / berikutnya) dengan "Daftar soal" (laci = AturSoal,
 *    termasuk soal buatan panitia). Kolom kiri = undangan (kode, QR, tautan, jumlah peserta masuk). Kolom kanan = kendali
 *    (SATU tombol utama jingga per fase + Jeda) dan panel bertab (peserta, peringkat, kesiapan, pengaturan, ekspor, suara);
 *    hanya isi tab yang menggulir. Akhiri & Reset pindah ke "Lainnya" (konfirmasi Modal di halaman, bukan window.confirm).
 *  - Fungsi & event socket sama persis dengan sebelumnya (actions.hostAction / hostSettings / hostCreate / hostAttach).
 * Gaya: ./host/host.css.
 */

import { Merek } from '../components/Merek';
import { PilihBahasa } from '../components/PilihBahasa';
import { TombolGerak } from '../components/TombolGerak';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import type { IdPaket } from '@shared/bankSoal';
import { BRAND, DEFAULT_EVENT_NAME } from '@shared/brand';
import type { HostAction, Phase, PlayerPublic, Prizes, RoomPublicState } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { Icon } from '../art/Icon';
import { preferMusicOn } from '../audio/audio';
import { misiDalamBahasa, t, useBahasa } from '../i18n';
import { terjemahkanBawaan, terjemahkanGalat } from '../i18n/galat';
import kamusHost from '../i18n/kamus/host';
import { useKonfigBank } from '../state/bank';
import { useHalaman } from '../ui/halaman';
import { actions, savedHostToken, savedLastHostRoom, savedPin, useGame } from '../state/store';
import { AturSoal } from './host/AturSoal';
import { PaketAwal } from './host/PaketAwal';
import { KolomPin, adaSesiStaf } from './host/PinPanitia';
import {
  AudioControls,
  ConnectionBadge,
  KodeRoom,
  Leaderboard,
  Modal,
  Pesan,
  PhaseBadge,
  QrCode,
  Timer,
  TombolKonfirmasi,
} from '../ui/kit';
import './host/host.css';
import { BlokHostAcara } from '../investigator-event/HostAcara';

function jalankan(action: HostAction, extra?: Record<string, unknown>) {
  void actions.hostAction(action, extra);
}

/**
 * Catatan aset adalah data di shared/brand.ts. Nilai bawaannya diterjemahkan; bila panitia
 * sudah mengganti teksnya, tampilkan apa adanya.
 */
function catatanAset(): string {
  const catatan: string = BRAND.assetNote;
  return catatan === kamusHost.id.catatanAset ? t('host.catatanAset') : catatan;
}

/** "Juara 1" / "1st place" / "第一名". Peringkat di luar 1-3 memakai bentuk umum. */
function teksJuara(rank: number): string {
  return rank >= 1 && rank <= 3 ? t(`host.juara${rank}`) : t('host.juaraN', { n: rank });
}

/** Fase yang sedang berlaku (saat dijeda: fase sebelum jeda). */
const faseKini = (room: RoomPublicState): Phase => (room.phase === 'PAUSED' ? (room.prevPhase ?? 'LOBBY') : room.phase);

// ------------------------------------------------------------------ rel langkah (T-053)

type Langkah = 1 | 2 | 3 | 4 | 5;

function langkahDari(room: RoomPublicState | null): Langkah {
  if (!room) return 1;
  const f = faseKini(room);
  if (f === 'FINISHED') return 5;
  if (f === 'LOBBY') return room.playerCount > 0 ? 3 : 2;
  if (f === 'TUTORIAL') return 3;
  return 4;
}

function kunciPetunjuk(room: RoomPublicState | null): string {
  if (!room) return 'host.petunjuk1';
  if (room.phase === 'PAUSED') return 'host.petunjukJeda';
  const f = faseKini(room);
  if (f === 'BRIEFING') return 'host.petunjukBriefing';
  if (f === 'ACTIVE') return 'host.petunjukActive';
  if (f === 'REVEAL') return 'host.petunjukReveal';
  if (f === 'LEADERBOARD') return 'host.petunjukLeaderboard';
  return `host.petunjuk${langkahDari(room)}`;
}

function RelLangkah({ room }: { room: RoomPublicState | null }) {
  useBahasa();
  const kini = langkahDari(room);
  return (
    <nav className="host-rel" aria-label={t('host.langkahRel')}>
      <ol className="host-rel-daftar">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <li key={n} className="host-rel-langkah" data-status={n < kini ? 'selesai' : n === kini ? 'kini' : 'nanti'} aria-current={n === kini ? 'step' : undefined}>
            <span className="host-rel-no" aria-hidden="true">{n < kini ? '✓' : n}</span>
            <span className="host-rel-nama">{t(`host.langkah${n}`)}</span>
          </li>
        ))}
      </ol>
      <p className="host-petunjuk" role="status" aria-live="polite">
        <span className="sr-only">{t('host.langkahKini', { n: kini, nama: t(`host.langkah${kini}`) })}. </span>
        {t(kunciPetunjuk(room))}
      </p>
    </nav>
  );
}

// ------------------------------------------------------------------ mulai

function MulaiHost() {
  useBahasa();
  const [nama, setNama] = useState(DEFAULT_EVENT_NAME);
  const [kode, setKode] = useState('');
  const [token, setToken] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [tersimpan] = useState(() => {
    const code = savedLastHostRoom();
    // (bukan `t`: nama itu dipakai fungsi terjemahan)
    const tok = code ? savedHostToken(code) : null;
    return code && tok ? { code, token: tok } : null;
  });
  // PIN panitia hanya diminta bila server memasangnya; paket soal hanya bila bank soal tersedia.
  const konfig = useKonfigBank();
  // T-038 Fix 2: a staff session in this tab replaces the PIN (sent as staffToken; the server checks the host role).
  const sesiStaf = adaSesiStaf();
  const butuhPin = konfig?.butuhPin === true && !sesiStaf;
  const [pin, setPin] = useState(() => savedPin() ?? '');
  const [paket, setPaket] = useState<IdPaket | null>(null);

  const buat = async () => {
    if (sibuk || (butuhPin && !pin.trim())) return;
    setSibuk(true);
    await actions.hostCreate(nama.trim() || DEFAULT_EVENT_NAME, {
      ...(paket ? { paket } : {}),
      ...(butuhPin ? { pin } : {}),
    });
    setSibuk(false);
  };

  const sambung = async (code: string, hostToken: string) => {
    setSibuk(true);
    await actions.hostAttach(code.trim().toUpperCase(), hostToken.trim());
    setSibuk(false);
  };

  return (
    <div className="host-mulai">
      <section className="panel host-mulai-kartu" aria-labelledby="host-buat">
        <h2 id="host-buat">{t('host.buatRoom')}</h2>
        <div>
          <label className="label-kolom" htmlFor="host-nama">
            {t('host.namaAcara')}
          </label>
          <input
            id="host-nama"
            className="kolom"
            value={nama}
            maxLength={60}
            onChange={(e) => setNama(e.target.value)}
            placeholder={DEFAULT_EVENT_NAME}
          />
        </div>
        <PaketAwal nilai={paket} onPilih={setPaket} />
        {butuhPin ? <KolomPin nilai={pin} onUbah={setPin} onEnter={() => void buat()} /> : null}
        {konfig?.butuhPin === true && sesiStaf ? <p className="kecil lembut" data-staf-aktif style={{ margin: 0 }}>{t('bank.stafAktif')}</p> : null}
        <button
          className="btn btn-utama btn-blok"
          onClick={() => void buat()}
          disabled={sibuk || (butuhPin && !pin.trim())}
        >
          {t('host.buatRoomBaru')}
        </button>
        {tersimpan ? (
          <button
            className="btn btn-garis btn-blok"
            onClick={() => void sambung(tersimpan.code, tersimpan.token)}
            disabled={sibuk}
          >
            {t('host.lanjutkanRoom', { kode: tersimpan.code })}
          </button>
        ) : null}

        {/* T-053: masuk dengan token host = pelipat kecil di bawah tombol utama (bukan kartu kedua). */}
        <details className="host-token">
          <summary>{t('host.tokenLain')}</summary>
          <div className="host-token-isi">
            <p className="kecil lembut" style={{ margin: 0 }}>{t('host.masukTokenKet')}</p>
            <div className="host-token-baris">
              <div>
                <label className="label-kolom" htmlFor="host-kode">
                  {t('host.kodeRoom')}
                </label>
                <input
                  id="host-kode"
                  className="kolom kolom-kode"
                  value={kode}
                  maxLength={4}
                  autoCapitalize="characters"
                  autoComplete="off"
                  onChange={(e) => setKode(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="label-kolom" htmlFor="host-token">
                  {t('host.tokenHost')}
                </label>
                <input
                  id="host-token"
                  className="kolom mono"
                  value={token}
                  autoComplete="off"
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={t('host.tempelToken')}
                />
              </div>
            </div>
            <button
              className="btn btn-blok"
              onClick={() => void sambung(kode, token)}
              disabled={sibuk || kode.trim().length < 4 || token.trim().length === 0}
            >
              {t('host.masukSebagaiHost')}
            </button>
            <p className="mini lembut" style={{ margin: 0 }}>{t('host.infoToken')}</p>
          </div>
        </details>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ undang peserta

function Undang({ room }: { room: RoomPublicState }) {
  useBahasa();
  const [salin, setSalin] = useState<'diam' | 'ok' | 'gagal'>('diam');

  const salinTautan = async () => {
    try {
      await navigator.clipboard.writeText(room.joinUrl);
      setSalin('ok');
    } catch {
      setSalin('gagal');
    }
  };

  return (
    <section className="panel host-undang" aria-labelledby="host-undang">
      <h3 id="host-undang">{t('host.undangPeserta')}</h3>
      <div className="host-undang-kode">
        <KodeRoom code={room.code} />
      </div>
      <div className="host-undang-qr">
        <QrCode value={room.joinUrl} size={168} label={room.joinUrl} />
      </div>
      <p className="host-undang-tautan mono">{room.joinUrl}</p>
      <p className="host-undang-jumlah" role="status" aria-live="polite">
        <Icon name="operator" size={16} /> {t('host.pesertaMasuk', { n: room.playerCount })}
      </p>
      <div className="host-undang-aksi">
        <button className="btn btn-netral btn-kecil" onClick={() => void salinTautan()}>
          <Icon name="dokumen" size={16} /> {t('host.salinTautan')}
        </button>
        <button
          className="btn btn-garis btn-kecil"
          onClick={() => window.open(`/acara/layar?room=${room.code}`, '_blank', 'noopener')}
        >
          {t('host.bukaProyektor')}
        </button>
      </div>
      {salin === 'ok' ? <Pesan jenis="sukses">{t('host.tautanDisalin')}</Pesan> : null}
      {salin === 'gagal' ? (
        <Pesan jenis="kuning">
          {t('host.salinManual')}
          <input
            className="kolom mono kecil"
            style={{ marginTop: 8 }}
            readOnly
            value={room.joinUrl}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={t('host.salinManualAria')}
          />
        </Pesan>
      ) : null}
      <p className="mini lembut host-undang-cara">{t('host.caraGabung')}</p>
    </section>
  );
}

// ------------------------------------------------------------------ strip ronde + laci soal (T-053)

function StripRonde({ room, onBukaDaftar }: { room: RoomPublicState; onBukaDaftar: () => void }) {
  useBahasa();
  const f = faseKini(room);
  const main = f !== 'LOBBY' && f !== 'TUTORIAL';
  const selesai = f === 'FINISHED';
  return (
    <div className="host-strip">
      <ol className="host-strip-chip" aria-label={t('host.stripRonde')}>
        {Array.from({ length: room.totalRounds }, (_, i) => {
          const status = selesai || (main && i < room.roundIndex) ? 'selesai' : main && i === room.roundIndex ? 'kini' : 'nanti';
          const label = t('host.chipRonde', { n: i + 1, status: t(status === 'selesai' ? 'host.chipSelesai' : status === 'kini' ? 'host.chipKini' : 'host.chipNanti') });
          return (
            <li key={i} className="host-chip-ronde" data-status={status} title={label} aria-label={label} aria-current={status === 'kini' ? 'step' : undefined}>
              {status === 'selesai' ? '✓' : i + 1}
            </li>
          );
        })}
      </ol>
      <button type="button" className="btn btn-netral btn-kecil host-strip-daftar" aria-haspopup="dialog" onClick={onBukaDaftar}>
        <Icon name="daftar" size={16} /> {t('host.daftarSoal')}
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ kendali pertandingan

function Kendali({ room }: { room: RoomPublicState }) {
  const { bahasa } = useBahasa();
  const idLainnya = useId();
  const [lainnya, setLainnya] = useState(false);
  // Judul, lokasi, dan produk misi mengikuti bahasa aktif (id misi tidak berubah).
  const misi = useMemo(
    () => (room.mission ? misiDalamBahasa(room.mission, bahasa) : null),
    [room.mission, bahasa],
  );
  const dijeda = room.phase === 'PAUSED';
  const fase = faseKini(room);
  const rondeTerakhir = room.roundIndex >= room.totalRounds - 1;
  const tanpaPeserta = room.playerCount === 0;

  // T-053: SATU tombol utama jingga per fase (urutan & aksi sama dengan sebelumnya); tutorial = tombol kedua di lobby.
  let utama: ReactNode = null;
  if (fase === 'LOBBY' || fase === 'TUTORIAL') {
    utama = (
      <button className="btn btn-utama host-utama" onClick={() => jalankan('startMatch')} disabled={dijeda || tanpaPeserta}>
        {t('host.mulaiPertandingan')}
      </button>
    );
  } else if (fase === 'BRIEFING') {
    utama = <button className="btn btn-utama host-utama" onClick={() => jalankan('next')} disabled={dijeda}>{t('host.mulaiMenjawab')}</button>;
  } else if (fase === 'ACTIVE') {
    utama = <button className="btn btn-utama host-utama" onClick={() => jalankan('closeRound')} disabled={dijeda}>{t('host.tutupRonde')}</button>;
  } else if (fase === 'REVEAL') {
    utama = <button className="btn btn-utama host-utama" onClick={() => jalankan('next')} disabled={dijeda}>{t('host.tampilkanPeringkat')}</button>;
  } else if (fase === 'LEADERBOARD') {
    utama = <button className="btn btn-utama host-utama" onClick={() => jalankan('next')} disabled={dijeda}>{rondeTerakhir ? t('host.selesaikan') : t('host.rondeBerikutnya')}</button>;
  } else if (fase === 'FINISHED' && room.tie) {
    utama = <button className="btn btn-utama host-utama" onClick={() => jalankan('tiebreak')} disabled={dijeda}>{t('host.rondePenentuan')}</button>;
  }

  return (
    <section className="panel host-kendali" aria-labelledby="host-kendali">
      <div className="host-kendali-kepala">
        <h3 id="host-kendali">{t('host.kendali')}</h3>
        <div className="host-kendali-chip">
          <PhaseBadge phase={room.phase} />
          <span className="chip">{t('host.ronde', { n: room.roundIndex + 1, total: room.totalRounds })}</span>
          <Timer endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} />
        </div>
      </div>

      <div className="host-kendali-misi">
        <strong>{misi ? t('host.misiJudul', { n: misi.number, judul: misi.title }) : t('host.belumAdaMisi')}</strong>
        {misi ? <span className="kecil lembut"> · {misi.location} - {misi.productLabel}</span> : null}
      </div>

      <div className="host-kendali-chip">
        <span className="chip chip-biru">
          <Icon name="cek" size={15} /> {t('host.jawabanMasuk', { masuk: room.submittedCount, total: room.playerCount })}
        </span>
        <span className="chip">
          <Icon name="operator" size={15} /> {t('host.terhubung', { n: room.connectedCount, total: room.playerCount })}
        </span>
      </div>

      {dijeda ? (
        <Pesan jenis="kuning">
          {room.pausedRemainingMs !== null
            ? t('host.dijedaSisa', { detik: Math.ceil(room.pausedRemainingMs / 1000) })
            : t('host.dijeda')}
        </Pesan>
      ) : null}

      <div className="host-kendali-aksi">
        {utama}
        {fase === 'LOBBY' ? (
          <button className="btn btn-garis" onClick={() => jalankan('startTutorial')} disabled={dijeda}>
            {t('host.mulaiTutorial')}
          </button>
        ) : null}
        <button className="btn btn-netral" onClick={() => jalankan(dijeda ? 'resume' : 'pause')}>
          {dijeda ? t('host.lanjutkan') : t('host.jeda')}
        </button>
        <button type="button" className="btn btn-netral host-lainnya-tombol" aria-expanded={lainnya} aria-controls={idLainnya} onClick={() => setLainnya((b) => !b)}>
          <span aria-hidden="true">⋯</span> {t('host.lainnya')}
        </button>
      </div>

      {(fase === 'LOBBY' || fase === 'TUTORIAL') && tanpaPeserta ? (
        <p className="kecil lembut" style={{ margin: 0 }}>{t('host.mulaiNonaktif')}</p>
      ) : null}
      {fase === 'FINISHED' && room.tie ? (
        <p className="kecil lembut" style={{ margin: 0 }}>{t('host.adaSeri')}</p>
      ) : null}

      {/* T-053: tindakan berbahaya = kecil, terlipat, dengan konfirmasi Modal di halaman (TombolKonfirmasi). */}
      <div id={idLainnya} className="host-lainnya" hidden={!lainnya}>
        <p className="mini lembut" style={{ margin: 0 }}>{t('host.lainnyaKet')}</p>
        <div className="host-lainnya-aksi">
          <TombolKonfirmasi
            label={t('host.akhiri')}
            kelas="btn btn-kecil btn-garis host-bahaya-kecil"
            judul={t('host.akhiriJudul')}
            pesan={t('host.akhiriPesan')}
            labelSetuju={t('host.akhiriSetuju')}
            onSetuju={() => jalankan('end')}
          />
          <TombolKonfirmasi
            label={t('host.reset')}
            kelas="btn btn-kecil btn-garis host-bahaya-kecil"
            judul={t('host.resetJudul')}
            pesan={t('host.resetPesan')}
            labelSetuju={t('host.resetSetuju')}
            onSetuju={() => jalankan('reset')}
          />
        </div>
      </div>

      <label className="saklar host-otomatis" title={room.autoAdvance ? t('host.otomatisAktif') : t('host.otomatisNonaktif')}>
        <input
          type="checkbox"
          checked={room.autoAdvance}
          onChange={(e) => void actions.hostSettings({ autoAdvance: e.target.checked })}
        />
        <span>
          {t('host.lanjutOtomatis')}
          <small className="mini lembut"> {room.autoAdvance ? t('host.otomatisAktif') : t('host.otomatisNonaktif')}</small>
        </span>
      </label>
    </section>
  );
}

// ------------------------------------------------------------------ kesiapan adegan

/** Keterangan adegan 2D untuk panitia (bahasa sehari-hari, tanpa istilah teknis). */
function InfoAdegan2D() {
  useBahasa();
  return (
    <p className="kecil lembut" style={{ margin: 0 }}>
      {t('host.infoAdegan')}
    </p>
  );
}

function KesiapanAdegan({ room }: { room: RoomPublicState }) {
  useBahasa();
  const belum = room.players.filter((p) => !p.sceneReady);

  return (
    <div className="stack-s" aria-labelledby="host-kesiapan">
      <div className="baris-antara">
        <h4 id="host-kesiapan" style={{ margin: 0 }}>
          {t('host.kesiapan')}
        </h4>
        <span className="chip chip-biru">
          <Icon name="cek" size={15} />{' '}
          {t('host.adeganSiap', { n: room.sceneReadyCount, total: room.playerCount })}
        </span>
      </div>

      <InfoAdegan2D />

      <p className="kecil lembut" style={{ margin: 0 }}>
        {t('host.tanpaTambahanWaktu')}
      </p>

      {room.playerCount === 0 ? (
        <div className="kosong">{t('host.belumAdaPesertaRoom')}</div>
      ) : !room.mission ? (
        <p className="kecil lembut" style={{ margin: 0 }}>
          {t('host.kesiapanKosong')}
        </p>
      ) : belum.length === 0 ? (
        <div className="kosong">{t('host.semuaSiap')}</div>
      ) : (
        <ul className="host-siap">
          {belum.map((p) => (
            <li key={p.id}>
              <Avatar look={p.look} size={30} mood="fokus" />
              <span>
                <strong title={p.nickname}>{p.nickname}</strong>
                <i>
                  <Icon name={p.connected ? 'jam' : 'silang'} size={13} />
                  {p.connected ? t('host.adeganBelumTampil') : t('host.terputusKecil')}
                </i>
              </span>
              <button
                className="btn btn-garis btn-kecil"
                onClick={() => jalankan('retryScene', { playerId: p.id })}
              >
                {t('host.mintaMuatUlang')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ pengaturan acara

/** Kunci kamus untuk pesan "tersimpan" (disimpan sebagai kunci supaya ikut berganti bahasa). */
type PesanSimpan = 'host.namaAcaraDisimpan' | 'host.hadiahDisimpan';

function Pengaturan({ room }: { room: RoomPublicState }) {
  useBahasa();
  const [nama, setNama] = useState(room.eventName);
  const [hadiah, setHadiah] = useState<Prizes>(room.prizes);
  const [pesan, setPesan] = useState<PesanSimpan | null>(null);

  // Sinkron ulang hanya saat nilai dari server berubah, bukan tiap snapshot masuk.
  useEffect(() => setNama(room.eventName), [room.eventName]);
  useEffect(() => {
    setHadiah({ first: room.prizes.first, second: room.prizes.second, third: room.prizes.third });
  }, [room.prizes.first, room.prizes.second, room.prizes.third]);

  const simpan = async (
    patch: { eventName?: string; prizes?: Prizes },
    kunciPesan: PesanSimpan,
  ): Promise<void> => {
    const ok = await actions.hostSettings(patch);
    if (ok) setPesan(kunciPesan);
  };

  // Label kolom diterjemahkan; ISI kolom (label hadiah) adalah data acara dari panitia.
  const LABEL: { kunci: keyof Prizes; teks: string }[] = [
    { kunci: 'first', teks: 'host.hadiahJuara1' },
    { kunci: 'second', teks: 'host.hadiahJuara2' },
    { kunci: 'third', teks: 'host.hadiahJuara3' },
  ];

  return (
    <div className="stack-s host-pengaturan" aria-labelledby="host-pengaturan">
      <h4 id="host-pengaturan" style={{ margin: 0 }}>{t('host.pengaturan')}</h4>

      <div className="host-pengaturan-baris">
        <div>
          <label className="label-kolom" htmlFor="set-nama">
            {t('host.namaAcara')}
          </label>
          <input
            id="set-nama"
            className="kolom"
            value={nama}
            maxLength={60}
            onChange={(e) => setNama(e.target.value)}
          />
        </div>
        <button
          className="btn btn-kecil"
          onClick={() =>
            void simpan({ eventName: nama.trim() || DEFAULT_EVENT_NAME }, 'host.namaAcaraDisimpan')
          }
        >
          {t('host.simpanNamaAcara')}
        </button>
      </div>

      <div className="host-pengaturan-hadiah">
        {LABEL.map((l) => (
          <div key={l.kunci}>
            <label className="label-kolom" htmlFor={`set-${l.kunci}`}>
              {t(l.teks)}
            </label>
            <input
              id={`set-${l.kunci}`}
              className="kolom"
              value={hadiah[l.kunci]}
              maxLength={60}
              onChange={(e) => setHadiah({ ...hadiah, [l.kunci]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <button
        className="btn btn-kecil"
        onClick={() => void simpan({ prizes: hadiah }, 'host.hadiahDisimpan')}
      >
        {t('host.simpanHadiah')}
      </button>

      {pesan ? (
        <Pesan jenis="sukses" onTutup={() => setPesan(null)}>
          {t(pesan)}
        </Pesan>
      ) : null}
      <p className="mini lembut" style={{ margin: 0 }}>
        {t('host.berlakuSetelahSimpan')}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ daftar peserta

function BarisPeserta({ p }: { p: PlayerPublic }) {
  useBahasa();
  return (
    <tr>
      <td>
        <span className="baris baris-rapat">
          <Avatar look={p.look} size={32} />
          <strong>{p.nickname}</strong>
        </span>
      </td>
      <td className="kecil">
        <Icon name={p.connected ? 'cek' : 'silang'} size={14} />{' '}
        {p.connected ? t('host.aktif') : t('host.terputus')}
      </td>
      <td className="kecil">
        {p.submittedThisRound ? (
          <>
            <Icon name="cek" size={14} />{' '}
            {p.submitElapsedSeconds !== null
              ? t('host.sudahKirimDetik', { detik: p.submitElapsedSeconds })
              : t('host.sudahKirim')}
          </>
        ) : (
          <>
            <Icon name="jam" size={14} /> {t('host.belumKirim')}
          </>
        )}
      </td>
      <td className="tebal">{p.totalPoints.toLocaleString('id-ID')}</td>
      <td>#{p.rank}</td>
      <td>
        <TombolKonfirmasi
          label={t('host.keluarkan')}
          kelas="btn btn-kecil btn-bahaya"
          judul={t('host.keluarkanJudul', { nama: p.nickname })}
          pesan={t('host.keluarkanPesan')}
          labelSetuju={t('host.keluarkanSetuju')}
          onSetuju={() => jalankan('kick', { playerId: p.id })}
        />
      </td>
    </tr>
  );
}

function DaftarPeserta({ room }: { room: RoomPublicState }) {
  useBahasa();
  const urut = [...room.players].sort((a, b) => b.totalPoints - a.totalPoints);
  return (
    <div className="stack-s" aria-labelledby="host-peserta">
      <div className="baris-antara">
        <h4 id="host-peserta" style={{ margin: 0 }}>
          {t('host.daftarPeserta')}
        </h4>
        <span className="chip">{t('host.jumlahPeserta', { n: room.playerCount })}</span>
      </div>
      {urut.length === 0 ? (
        <div className="kosong">{t('host.belumAdaPeserta')}</div>
      ) : (
        <div className="host-geser">
          <table className="tabel">
            <thead>
              <tr>
                <th scope="col">{t('host.kolomPeserta')}</th>
                <th scope="col">{t('host.kolomKoneksi')}</th>
                <th scope="col">{t('host.kolomRondeIni')}</th>
                <th scope="col">{t('host.kolomPoin')}</th>
                <th scope="col">{t('host.kolomPeringkat')}</th>
                <th scope="col">{t('host.kolomAksi')}</th>
              </tr>
            </thead>
            <tbody>
              {urut.map((p) => (
                <BarisPeserta key={p.id} p={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ hasil (podium) + ekspor

function Podium({ room }: { room: RoomPublicState }) {
  useBahasa();
  if (room.phase !== 'FINISHED' || !room.podium || room.podium.length === 0) return null;
  return (
    <section className="panel host-hasil" aria-labelledby="host-podium">
      <h3 id="host-podium">{t('host.podium')}</h3>
      <div className="host-podium">
        {room.podium.map((r) => (
          <div key={r.playerId} className="panel-krem tengah stack-s">
            <span className="chip chip-kuning">
              <Icon name="medali" size={15} /> {teksJuara(r.rank)}
            </span>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <Avatar look={r.look} size={56} mood="senang" />
            </div>
            <strong>{r.nickname}</strong>
            <span className="kecil">{t('host.poin', { poin: r.totalPoints.toLocaleString('id-ID') })}</span>
            <span className="mini lembut">
              {terjemahkanBawaan(r.rank === 1 ? room.prizes.first : r.rank === 2 ? room.prizes.second : room.prizes.third)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Ekspor({ unduh, gagal }: { unduh: (jenis: 'csv' | 'json') => void; gagal: boolean }) {
  useBahasa();
  return (
    <div className="stack-s" aria-labelledby="host-ekspor">
      <h4 id="host-ekspor" style={{ margin: 0 }}>{t('host.eksporHasil')}</h4>
      <div className="baris">
        <button type="button" className="btn btn-netral" onClick={() => unduh('csv')}>
          {t('host.eksporCsv')}
        </button>
        <button type="button" className="btn btn-netral" onClick={() => unduh('json')}>
          {t('host.eksporJson')}
        </button>
      </div>
      {gagal ? (
        <p className="kecil" role="alert" style={{ margin: 0 }}>
          {t('host.eksporGagal')}
        </p>
      ) : null}
      <p className="kecil lembut" style={{ margin: 0 }}>
        {t('host.eksporKet')}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ panel bertab (T-053)

type Tab = 'peserta' | 'peringkat' | 'kesiapan' | 'pengaturan' | 'ekspor' | 'suara';
const TAB: { id: Tab; kunci: string }[] = [
  { id: 'peserta', kunci: 'host.tabPeserta' },
  { id: 'peringkat', kunci: 'host.tabPeringkat' },
  { id: 'kesiapan', kunci: 'host.tabKesiapan' },
  { id: 'pengaturan', kunci: 'host.tabPengaturan' },
  { id: 'ekspor', kunci: 'host.tabEkspor' },
  { id: 'suara', kunci: 'host.tabSuara' },
];

function PanelTab({ room, unduh, eksporGagal }: { room: RoomPublicState; unduh: (jenis: 'csv' | 'json') => void; eksporGagal: boolean }) {
  useBahasa();
  const selesai = room.phase === 'FINISHED';
  const [tab, setTab] = useState<Tab>(selesai ? 'peringkat' : 'peserta');
  // Hasil tampil: tab peringkat dibuka sekali saat pertandingan selesai.
  useEffect(() => { if (selesai) setTab('peringkat'); }, [selesai]);
  const uid = useId();
  const pindah = (arah: 1 | -1) => {
    const i = TAB.findIndex((x) => x.id === tab);
    const b = TAB[(i + arah + TAB.length) % TAB.length]!;
    setTab(b.id);
    document.getElementById(`${uid}-tab-${b.id}`)?.focus();
  };
  return (
    <section className="panel host-tab" aria-label={t('host.tabPanel')}>
      <div className="host-tab-daftar" role="tablist" aria-label={t('host.tabPanel')}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); pindah(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); pindah(-1); } }}>
        {TAB.map((x) => (
          <button key={x.id} id={`${uid}-tab-${x.id}`} type="button" role="tab" className="host-tab-tombol" aria-selected={tab === x.id}
            aria-controls={`${uid}-isi`} tabIndex={tab === x.id ? 0 : -1} onClick={() => setTab(x.id)}>
            {t(x.kunci)}
            {x.id === 'peserta' ? <span className="host-tab-angka">{room.playerCount}</span> : null}
          </button>
        ))}
      </div>
      <div id={`${uid}-isi`} className="host-tab-isi" role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} tabIndex={0}>
        {tab === 'peserta' ? <DaftarPeserta room={room} /> : null}
        {tab === 'peringkat' ? (
          <div className="stack-s">
            <h4 style={{ margin: 0 }}>{t('host.papanPeringkat')}</h4>
            <Leaderboard rows={room.leaderboard ?? []} prizes={room.prizes} />
          </div>
        ) : null}
        {tab === 'kesiapan' ? <KesiapanAdegan room={room} /> : null}
        {tab === 'pengaturan' ? <Pengaturan room={room} /> : null}
        {tab === 'ekspor' ? <Ekspor unduh={unduh} gagal={eksporGagal} /> : null}
        {tab === 'suara' ? (
          <div className="stack-s">
            <AudioControls />
            <TombolGerak className="btn btn-netral" />
            <p className="mini lembut" style={{ margin: 0 }}>{catatanAset()}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ halaman

export default function Host() {
  useBahasa();
  const { room, hostToken, status, error } = useGame();
  const [laciSoal, setLaciSoal] = useState(false);
  // Judul tab: "Panitia – RAKSA GAME" (dengan nama acara bila room sudah ada); fokus ke h1 saat dibuka dari tautan.
  useHalaman(room ? `${t('host.judulHalaman')} · ${terjemahkanBawaan(room.eventName)}` : t('host.judulHalaman'));

  useEffect(() => {
    preferMusicOn();
  }, []);

  // T-038: the host token goes in a header (never the URL); the file is fetched and saved from a blob.
  const [eksporGagal, setEksporGagal] = useState(false);
  const unduhEkspor = async (jenis: 'csv' | 'json') => {
    setEksporGagal(false);
    try {
      const res = await fetch(`/api/room/${encodeURIComponent(room?.code ?? '')}/results.${jenis}`, {
        headers: { 'x-host-token': hostToken ?? '' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(String(res.status));
      const nama =
        /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? `raksa-game-${room?.code ?? ''}.${jenis}`;
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = nama;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setEksporGagal(true);
    }
  };

  return (
    <div className="layar host-layar" data-langkah={langkahDari(room)}>
      {/* Header bersama (sama dengan pemain): wordmark + label konteks | bahasa + status koneksi.
          Wordmark bukan tautan: panitia tidak keluar dari layar kendali karena salah ketuk. */}
      <header className="mrk-kepala">
        <div className="mrk-kepala-kiri">
          <Merek tautan={false} />
          <span className="mrk-konteks">{t('host.layarHost')}</span>
        </div>
        <div className="mrk-kepala-kanan">
          <PilihBahasa />
          <ConnectionBadge />
        </div>
      </header>

      <main className="host-isi">
        <RelLangkah room={room} />
        {error ? (
          <Pesan jenis="error" onTutup={actions.clearError}>
            {terjemahkanGalat(error)}
          </Pesan>
        ) : null}
        {status !== 'connected' ? (
          <Pesan jenis="kuning">{t('host.koneksiBelumStabil')}</Pesan>
        ) : null}

        {!room ? (
          <>
            {/* Judul halaman untuk pembaca layar; secara visual header (Merek + "Layar Host") sudah jelas. */}
            <h1 className="sr-only">{t('host.judulMasuk')}</h1>
            <MulaiHost />
            {/* T-109: papan acara Investigator (terpisah dari room kuis; hanya bila server menyalakannya) */}
            <BlokHostAcara />
          </>
        ) : (
          <>
            <div className="host-judul">
              <h1>{terjemahkanBawaan(room.eventName)}</h1>
              <span className="chip chip-kuning">{t('host.chipRoom', { kode: room.code })}</span>
              <StripRonde room={room} onBukaDaftar={() => setLaciSoal(true)} />
            </div>

            <div className="host-grid">
              <div className="host-kolom-kiri">
                <Undang room={room} />
              </div>
              <div className="host-kolom-kanan">
                <Kendali room={room} />
                <Podium room={room} />
                <PanelTab room={room} unduh={(j) => void unduhEkspor(j)} eksporGagal={eksporGagal} />
              </div>
            </div>

            {/* T-109: papan acara Investigator (terpisah dari room kuis; hanya bila server menyalakannya) */}
            <BlokHostAcara />

            {/* Laci "Daftar soal": playlist 10 kasus + soal buatan panitia (AturSoal apa adanya, langsung terbuka). */}
            {laciSoal ? (
              <Modal judul={t('host.daftarSoal')} onTutup={() => setLaciSoal(false)} lebar={860}>
                <AturSoal room={room} bukaAwal />
              </Modal>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
