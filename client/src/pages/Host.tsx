/**
 * Layar host (prioritas desktop, tetap terbaca di HP/tablet).
 * Membuat room, mengundang peserta lewat QR, mengendalikan ronde, dan mengekspor hasil.
 * Teks tampil dalam bahasa aktif (kamus: ../i18n/kamus/host.ts). Data acara (nama acara,
 * label hadiah) yang DIISI panitia tampil apa adanya; hanya nilai BAWAAN yang ikut bahasa aktif
 * saat ditampilkan (terjemahkanBawaan). Kolom isian selalu memuat nilai aslinya.
 */

import { PilihBahasa } from '../components/PilihBahasa';
import { TombolGerak } from '../components/TombolGerak';
import { useEffect, useMemo, useState } from 'react';
import type { IdPaket } from '@shared/bankSoal';
import { BRAND, DEFAULT_EVENT_NAME } from '@shared/brand';
import type { HostAction, PlayerPublic, Prizes, RoomPublicState } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { Icon } from '../art/Icon';
import { preferMusicOn } from '../audio/audio';
import { misiDalamBahasa, t, useBahasa } from '../i18n';
import { terjemahkanBawaan, terjemahkanGalat } from '../i18n/galat';
import kamusHost from '../i18n/kamus/host';
import { useKonfigBank } from '../state/bank';
import { actions, savedHostToken, savedLastHostRoom, savedPin, useGame } from '../state/store';
import { AturSoal } from './host/AturSoal';
import { PaketAwal } from './host/PaketAwal';
import { KolomPin } from './host/PinPanitia';
import {
  AudioControls,
  BrandTitle,
  ConnectionBadge,
  KodeRoom,
  Leaderboard,
  Pesan,
  PhaseBadge,
  QrCode,
  Timer,
  TombolKonfirmasi,
} from '../ui/kit';

const GAYA = `
.host-grid{display:grid;grid-template-columns:minmax(0,360px) minmax(0,1fr);gap:16px;align-items:start}
@media (max-width:900px){.host-grid{grid-template-columns:minmax(0,1fr)}}
.host-geser{overflow-x:auto;-webkit-overflow-scrolling:touch}
.host-geser .tabel{min-width:600px}
.host-podium{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.host-siap{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.host-siap li{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 10px;
  background:var(--krem);border:2px solid var(--krem-tua);border-radius:var(--radius)}
.host-siap li > span{flex:1;min-width:140px}
.host-siap strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.host-siap i{display:flex;align-items:center;gap:4px;font-style:normal;font-size:12px;
  color:var(--tinta-lembut)}
`;

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
  const butuhPin = konfig?.butuhPin === true;
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
    <div className="wrap stack-l" style={{ padding: 0 }}>
      <section className="panel stack">
        <h2>{t('host.buatRoom')}</h2>
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
      </section>

      <section className="panel stack">
        <h3>{t('host.masukToken')}</h3>
        <p className="kecil lembut">{t('host.masukTokenKet')}</p>
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
        <button
          className="btn btn-blok"
          onClick={() => void sambung(kode, token)}
          disabled={sibuk || kode.trim().length < 4 || token.trim().length === 0}
        >
          {t('host.masukSebagaiHost')}
        </button>
        <Pesan jenis="info">{t('host.infoToken')}</Pesan>
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
    <section className="panel stack" aria-labelledby="host-undang">
      <h3 id="host-undang">{t('host.undangPeserta')}</h3>
      <div className="stack tengah">
        <div>
          <KodeRoom code={room.code} />
        </div>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <QrCode value={room.joinUrl} size={230} label={room.joinUrl} />
        </div>
      </div>
      <p className="kecil lembut">{t('host.caraGabung')}</p>
      <div className="baris">
        <button className="btn btn-netral" onClick={() => void salinTautan()}>
          <Icon name="dokumen" size={18} /> {t('host.salinTautan')}
        </button>
        <button
          className="btn btn-garis"
          onClick={() => window.open(`/projector?room=${room.code}`, '_blank', 'noopener')}
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
      <Pesan jenis="info">
        <span className="mini">{catatanAset()}</span>
      </Pesan>
    </section>
  );
}

// ------------------------------------------------------------------ kendali pertandingan

function Kendali({ room }: { room: RoomPublicState }) {
  const { bahasa } = useBahasa();
  // Judul, lokasi, dan produk misi mengikuti bahasa aktif (id misi tidak berubah).
  const misi = useMemo(
    () => (room.mission ? misiDalamBahasa(room.mission, bahasa) : null),
    [room.mission, bahasa],
  );
  const dijeda = room.phase === 'PAUSED';
  const fase = dijeda ? (room.prevPhase ?? 'LOBBY') : room.phase;
  const rondeTerakhir = room.roundIndex >= room.totalRounds - 1;
  const tanpaPeserta = room.playerCount === 0;

  return (
    <section className="panel stack" aria-labelledby="host-kendali">
      <h3 id="host-kendali">{t('host.kendali')}</h3>

      <div className="baris">
        <PhaseBadge phase={room.phase} />
        <span className="chip">
          {t('host.ronde', { n: room.roundIndex + 1, total: room.totalRounds })}
        </span>
        <Timer endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} />
      </div>

      <div className="stack-s">
        <strong>
          {misi ? t('host.misiJudul', { n: misi.number, judul: misi.title }) : t('host.belumAdaMisi')}
        </strong>
        {misi ? (
          <span className="kecil lembut">
            {misi.location} - {misi.productLabel}
          </span>
        ) : null}
      </div>

      <div className="baris">
        <span className="chip chip-biru">
          <Icon name="cek" size={15} />{' '}
          {t('host.jawabanMasuk', { masuk: room.submittedCount, total: room.playerCount })}
        </span>
        <span className="chip">
          <Icon name="operator" size={15} />{' '}
          {t('host.terhubung', { n: room.connectedCount, total: room.playerCount })}
        </span>
      </div>

      {dijeda ? (
        <Pesan jenis="kuning">
          {room.pausedRemainingMs !== null
            ? t('host.dijedaSisa', { detik: Math.ceil(room.pausedRemainingMs / 1000) })
            : t('host.dijeda')}
        </Pesan>
      ) : null}

      <div className="baris">
        {fase === 'LOBBY' ? (
          <button
            className="btn btn-garis"
            onClick={() => jalankan('startTutorial')}
            disabled={dijeda}
          >
            {t('host.mulaiTutorial')}
          </button>
        ) : null}
        {fase === 'LOBBY' || fase === 'TUTORIAL' ? (
          <button
            className="btn btn-utama"
            onClick={() => jalankan('startMatch')}
            disabled={dijeda || tanpaPeserta}
          >
            {t('host.mulaiPertandingan')}
          </button>
        ) : null}
        {fase === 'BRIEFING' ? (
          <button className="btn btn-utama" onClick={() => jalankan('next')} disabled={dijeda}>
            {t('host.mulaiMenjawab')}
          </button>
        ) : null}
        {fase === 'ACTIVE' ? (
          <button
            className="btn btn-utama"
            onClick={() => jalankan('closeRound')}
            disabled={dijeda}
          >
            {t('host.tutupRonde')}
          </button>
        ) : null}
        {fase === 'REVEAL' ? (
          <button className="btn btn-utama" onClick={() => jalankan('next')} disabled={dijeda}>
            {t('host.tampilkanPeringkat')}
          </button>
        ) : null}
        {fase === 'LEADERBOARD' ? (
          <button className="btn btn-utama" onClick={() => jalankan('next')} disabled={dijeda}>
            {rondeTerakhir ? t('host.selesaikan') : t('host.rondeBerikutnya')}
          </button>
        ) : null}
        {fase === 'FINISHED' && room.tie ? (
          <button className="btn btn-utama" onClick={() => jalankan('tiebreak')} disabled={dijeda}>
            {t('host.rondePenentuan')}
          </button>
        ) : null}
        <button className="btn btn-netral" onClick={() => jalankan(dijeda ? 'resume' : 'pause')}>
          {dijeda ? t('host.lanjutkan') : t('host.jeda')}
        </button>
      </div>

      {(fase === 'LOBBY' || fase === 'TUTORIAL') && tanpaPeserta ? (
        <p className="kecil lembut" style={{ margin: 0 }}>
          {t('host.mulaiNonaktif')}
        </p>
      ) : null}
      {fase === 'FINISHED' && room.tie ? (
        <p className="kecil lembut" style={{ margin: 0 }}>
          {t('host.adaSeri')}
        </p>
      ) : null}

      <div className="baris">
        <TombolKonfirmasi
          label={t('host.akhiri')}
          judul={t('host.akhiriJudul')}
          pesan={t('host.akhiriPesan')}
          labelSetuju={t('host.akhiriSetuju')}
          onSetuju={() => jalankan('end')}
        />
        <TombolKonfirmasi
          label={t('host.reset')}
          judul={t('host.resetJudul')}
          pesan={t('host.resetPesan')}
          labelSetuju={t('host.resetSetuju')}
          onSetuju={() => jalankan('reset')}
        />
      </div>

      <label className="saklar">
        <input
          type="checkbox"
          checked={room.autoAdvance}
          onChange={(e) => void actions.hostSettings({ autoAdvance: e.target.checked })}
        />
        {t('host.lanjutOtomatis')}
      </label>
      <p className="kecil lembut" style={{ margin: 0 }}>
        {room.autoAdvance ? t('host.otomatisAktif') : t('host.otomatisNonaktif')}
      </p>
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
    <section className="panel stack" aria-labelledby="host-kesiapan">
      <div className="baris-antara">
        <h3 id="host-kesiapan" style={{ margin: 0 }}>
          {t('host.kesiapan')}
        </h3>
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
    </section>
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
    <section className="panel stack" aria-labelledby="host-pengaturan">
      <h3 id="host-pengaturan">{t('host.pengaturan')}</h3>

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
    </section>
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
    <section className="panel stack" aria-labelledby="host-peserta">
      <div className="baris-antara">
        <h3 id="host-peserta" style={{ margin: 0 }}>
          {t('host.daftarPeserta')}
        </h3>
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
    </section>
  );
}

// ------------------------------------------------------------------ halaman

export default function Host() {
  useBahasa();
  const { room, hostToken, status, error } = useGame();

  useEffect(() => {
    preferMusicOn();
  }, []);

  const tautanEkspor = (jenis: 'csv' | 'json') =>
    `/api/room/${room?.code ?? ''}/results.${jenis}?hostToken=${encodeURIComponent(hostToken ?? '')}`;

  return (
    <div className="layar">
      <style>{GAYA}</style>
      <header className="topbar">
        <span className="baris baris-rapat">
          <BrandTitle size="kecil" />
          <span className="judul-kecil">{t('host.layarHost')}</span>
        </span>
        <span className="baris baris-rapat" style={{ justifyContent: 'flex-end' }}>
          <PilihBahasa />
          <ConnectionBadge />
        </span>
      </header>

      <main className="isi wrap-lebar stack-l" style={{ paddingTop: 16 }}>
        {error ? (
          <Pesan jenis="error" onTutup={actions.clearError}>
            {terjemahkanGalat(error)}
          </Pesan>
        ) : null}
        {status !== 'connected' ? (
          <Pesan jenis="kuning">{t('host.koneksiBelumStabil')}</Pesan>
        ) : null}

        {!room ? (
          <MulaiHost />
        ) : (
          <>
            <div className="baris-antara">
              <h1 style={{ margin: 0 }}>{terjemahkanBawaan(room.eventName)}</h1>
              <span className="chip chip-kuning">{t('host.chipRoom', { kode: room.code })}</span>
            </div>

            {/* Soal acara ini: playlist + soal buatan panitia (komponen terpisah, ringkas bila ditutup). */}
            <AturSoal room={room} />

            <div className="host-grid">
              <div className="stack-l">
                <Undang room={room} />
                <AudioControls />
                <TombolGerak className="btn btn-netral" />
              </div>
              <div className="stack-l">
                <Kendali room={room} />
                <KesiapanAdegan room={room} />
                <Pengaturan room={room} />
              </div>
            </div>

            <DaftarPeserta room={room} />

            <section className="panel stack" aria-labelledby="host-papan">
              <h3 id="host-papan">{t('host.papanPeringkat')}</h3>
              <Leaderboard rows={room.leaderboard ?? []} prizes={room.prizes} />
            </section>

            {room.phase === 'FINISHED' && room.podium && room.podium.length > 0 ? (
              <section className="panel stack" aria-labelledby="host-podium">
                <h3 id="host-podium">{t('host.podium')}</h3>
                <div className="host-podium">
                  {room.podium.map((r) => (
                    <div key={r.playerId} className="panel-krem tengah stack-s">
                      <span className="chip chip-kuning">
                        <Icon name="medali" size={15} /> {teksJuara(r.rank)}
                      </span>
                      <div style={{ display: 'grid', placeItems: 'center' }}>
                        <Avatar look={r.look} size={72} mood="senang" />
                      </div>
                      <strong>{r.nickname}</strong>
                      <span className="kecil">
                        {t('host.poin', { poin: r.totalPoints.toLocaleString('id-ID') })}
                      </span>
                      <span className="mini lembut">
                        {terjemahkanBawaan(
                          r.rank === 1
                            ? room.prizes.first
                            : r.rank === 2
                              ? room.prizes.second
                              : room.prizes.third,
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="panel stack" aria-labelledby="host-ekspor">
              <h3 id="host-ekspor">{t('host.eksporHasil')}</h3>
              <div className="baris">
                <a className="btn btn-netral" href={tautanEkspor('csv')} download>
                  {t('host.eksporCsv')}
                </a>
                <a className="btn btn-netral" href={tautanEkspor('json')} download>
                  {t('host.eksporJson')}
                </a>
              </div>
              <p className="kecil lembut" style={{ margin: 0 }}>
                {t('host.eksporKet')}
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
