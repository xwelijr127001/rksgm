/**
 * Layar host (prioritas desktop, tetap terbaca di HP/tablet).
 * Membuat room, mengundang peserta lewat QR, mengendalikan ronde, dan mengekspor hasil.
 */

import { useEffect, useState } from 'react';
import { BRAND, DEFAULT_EVENT_NAME } from '@shared/brand';
import type { HostAction, PlayerPublic, Prizes, RoomPublicState } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { Icon } from '../art/Icon';
import { preferMusicOn } from '../audio/audio';
import { actions, savedHostToken, savedLastHostRoom, useGame } from '../state/store';
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

// ------------------------------------------------------------------ mulai

function MulaiHost() {
  const [nama, setNama] = useState(DEFAULT_EVENT_NAME);
  const [kode, setKode] = useState('');
  const [token, setToken] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [tersimpan] = useState(() => {
    const code = savedLastHostRoom();
    const t = code ? savedHostToken(code) : null;
    return code && t ? { code, token: t } : null;
  });

  const buat = async () => {
    setSibuk(true);
    await actions.hostCreate(nama.trim() || DEFAULT_EVENT_NAME);
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
        <h2>Buat Room</h2>
        <div>
          <label className="label-kolom" htmlFor="host-nama">
            Nama acara
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
        <button className="btn btn-utama btn-blok" onClick={() => void buat()} disabled={sibuk}>
          Buat Room Baru
        </button>
        {tersimpan ? (
          <button
            className="btn btn-garis btn-blok"
            onClick={() => void sambung(tersimpan.code, tersimpan.token)}
            disabled={sibuk}
          >
            Lanjutkan room {tersimpan.code}
          </button>
        ) : null}
      </section>

      <section className="panel stack">
        <h3>Masuk dengan token host</h3>
        <p className="kecil lembut">Pakai ini bila kamu berpindah browser atau perangkat.</p>
        <div>
          <label className="label-kolom" htmlFor="host-kode">
            Kode room (4 huruf)
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
            Token host
          </label>
          <input
            id="host-token"
            className="kolom mono"
            value={token}
            autoComplete="off"
            onChange={(e) => setToken(e.target.value)}
            placeholder="tempel token di sini"
          />
        </div>
        <button
          className="btn btn-blok"
          onClick={() => void sambung(kode, token)}
          disabled={sibuk || kode.trim().length < 4 || token.trim().length === 0}
        >
          Masuk sebagai Host
        </button>
        <Pesan jenis="info">
          Token host berbeda dari kode room peserta. Kode room boleh dibagikan; token host jangan
          dibagikan ke peserta karena bisa dipakai mengendalikan pertandingan.
        </Pesan>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ undang peserta

function Undang({ room }: { room: RoomPublicState }) {
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
      <h3 id="host-undang">Undang Peserta</h3>
      <div className="stack tengah">
        <div>
          <KodeRoom code={room.code} />
        </div>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <QrCode value={room.joinUrl} size={230} label={room.joinUrl} />
        </div>
      </div>
      <p className="kecil lembut">
        Peserta memindai QR atau membuka tautan di atas, lalu memasukkan kode room.
      </p>
      <div className="baris">
        <button className="btn btn-netral" onClick={() => void salinTautan()}>
          <Icon name="dokumen" size={18} /> Salin tautan
        </button>
        <button
          className="btn btn-garis"
          onClick={() => window.open(`/projector?room=${room.code}`, '_blank', 'noopener')}
        >
          Buka layar proyektor
        </button>
      </div>
      {salin === 'ok' ? <Pesan jenis="sukses">Tautan sudah disalin.</Pesan> : null}
      {salin === 'gagal' ? (
        <Pesan jenis="kuning">
          Browser ini tidak mengizinkan salin otomatis. Salin tautan berikut secara manual:
          <input
            className="kolom mono kecil"
            style={{ marginTop: 8 }}
            readOnly
            value={room.joinUrl}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Tautan undangan untuk disalin manual"
          />
        </Pesan>
      ) : null}
      <Pesan jenis="info">
        <span className="mini">{BRAND.assetNote}</span>
      </Pesan>
    </section>
  );
}

// ------------------------------------------------------------------ kendali pertandingan

function Kendali({ room }: { room: RoomPublicState }) {
  const dijeda = room.phase === 'PAUSED';
  const fase = dijeda ? (room.prevPhase ?? 'LOBBY') : room.phase;
  const rondeTerakhir = room.roundIndex >= room.totalRounds - 1;
  const tanpaPeserta = room.playerCount === 0;

  return (
    <section className="panel stack" aria-labelledby="host-kendali">
      <h3 id="host-kendali">Kendali Pertandingan</h3>

      <div className="baris">
        <PhaseBadge phase={room.phase} />
        <span className="chip">
          Ronde {room.roundIndex + 1} / {room.totalRounds}
        </span>
        <Timer endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} />
      </div>

      <div className="stack-s">
        <strong>
          {room.mission
            ? `Misi ${room.mission.number}: ${room.mission.title}`
            : 'Belum ada misi aktif'}
        </strong>
        {room.mission ? (
          <span className="kecil lembut">
            {room.mission.location} - {room.mission.productLabel}
          </span>
        ) : null}
      </div>

      <div className="baris">
        <span className="chip chip-biru">
          <Icon name="cek" size={15} /> Jawaban masuk {room.submittedCount} / {room.playerCount}{' '}
          peserta
        </span>
        <span className="chip">
          <Icon name="operator" size={15} /> Terhubung {room.connectedCount} / {room.playerCount}
        </span>
      </div>

      {dijeda ? (
        <Pesan jenis="kuning">
          Pertandingan dijeda
          {room.pausedRemainingMs !== null
            ? ` dengan sisa ${Math.ceil(room.pausedRemainingMs / 1000)} detik`
            : ''}
          . Tekan &quot;Lanjutkan&quot; agar tombol ronde bisa dipakai lagi.
        </Pesan>
      ) : null}

      <div className="baris">
        {fase === 'LOBBY' ? (
          <button
            className="btn btn-garis"
            onClick={() => jalankan('startTutorial')}
            disabled={dijeda}
          >
            Mulai Tutorial
          </button>
        ) : null}
        {fase === 'LOBBY' || fase === 'TUTORIAL' ? (
          <button
            className="btn btn-utama"
            onClick={() => jalankan('startMatch')}
            disabled={dijeda || tanpaPeserta}
          >
            Mulai Pertandingan
          </button>
        ) : null}
        {fase === 'BRIEFING' ? (
          <button className="btn btn-utama" onClick={() => jalankan('next')} disabled={dijeda}>
            Mulai Menjawab Sekarang
          </button>
        ) : null}
        {fase === 'ACTIVE' ? (
          <button
            className="btn btn-utama"
            onClick={() => jalankan('closeRound')}
            disabled={dijeda}
          >
            Tutup Ronde
          </button>
        ) : null}
        {fase === 'REVEAL' ? (
          <button className="btn btn-utama" onClick={() => jalankan('next')} disabled={dijeda}>
            Tampilkan Peringkat
          </button>
        ) : null}
        {fase === 'LEADERBOARD' ? (
          <button className="btn btn-utama" onClick={() => jalankan('next')} disabled={dijeda}>
            {rondeTerakhir ? 'Selesaikan Pertandingan' : 'Ronde Berikutnya'}
          </button>
        ) : null}
        {fase === 'FINISHED' && room.tie ? (
          <button className="btn btn-utama" onClick={() => jalankan('tiebreak')} disabled={dijeda}>
            Ronde Penentuan
          </button>
        ) : null}
        <button className="btn btn-netral" onClick={() => jalankan(dijeda ? 'resume' : 'pause')}>
          {dijeda ? 'Lanjutkan' : 'Jeda'}
        </button>
      </div>

      {(fase === 'LOBBY' || fase === 'TUTORIAL') && tanpaPeserta ? (
        <p className="kecil lembut" style={{ margin: 0 }}>
          Tombol &quot;Mulai Pertandingan&quot; nonaktif karena belum ada peserta yang bergabung.
        </p>
      ) : null}
      {fase === 'FINISHED' && room.tie ? (
        <p className="kecil lembut" style={{ margin: 0 }}>
          Ada peringkat seri di puncak. Ronde penentuan memakai satu misi tambahan.
        </p>
      ) : null}

      <div className="baris">
        <TombolKonfirmasi
          label="Akhiri Pertandingan"
          judul="Akhiri pertandingan sekarang?"
          pesan="Semua peserta langsung dipindahkan ke halaman hasil. Ronde yang belum dimainkan tidak dijalankan. Skor yang sudah terkumpul tetap tersimpan dan masih bisa diekspor."
          labelSetuju="Ya, akhiri"
          onSetuju={() => jalankan('end')}
        />
        <TombolKonfirmasi
          label="Reset Pertandingan"
          judul="Reset pertandingan?"
          pesan="Semua skor, jawaban, dan peringkat dihapus lalu room kembali ke lobby. Tindakan ini tidak bisa dibatalkan - ekspor CSV dulu bila hasilnya masih dibutuhkan."
          labelSetuju="Ya, reset"
          onSetuju={() => jalankan('reset')}
        />
      </div>

      <label className="saklar">
        <input
          type="checkbox"
          checked={room.autoAdvance}
          onChange={(e) => void actions.hostSettings({ autoAdvance: e.target.checked })}
        />
        Lanjut otomatis antar ronde
      </label>
      <p className="kecil lembut" style={{ margin: 0 }}>
        {room.autoAdvance
          ? 'Aktif: ronde berpindah sendiri saat waktu habis, kamu tidak perlu menekan tombol.'
          : 'Nonaktif: setiap perpindahan ronde menunggu kamu menekan tombol.'}
      </p>
    </section>
  );
}

// ------------------------------------------------------------------ kesiapan adegan

/** Bentuk /api/unity/status yang dipakai halaman ini (tanpa mengimpor server/). */
interface StatusBuild {
  available: boolean;
  totalMb: number | null;
  downloadMb: number | null;
  compression: 'gzip' | 'br' | 'none' | null;
  reason: string | null;
}

const LABEL_KOMPRESI: Record<'gzip' | 'br' | 'none', string> = {
  gzip: 'Gzip',
  br: 'Brotli',
  none: 'tanpa kompresi',
};

function bacaStatusBuild(data: unknown): StatusBuild | null {
  if (typeof data !== 'object' || data === null) return null;
  const o = data as Record<string, unknown>;
  const angka = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;
  const k = o.compression;
  return {
    available: o.available === true,
    totalMb: angka(o.totalMb),
    downloadMb: angka(o.downloadMb),
    compression: k === 'gzip' || k === 'br' || k === 'none' ? k : null,
    reason: typeof o.reason === 'string' ? o.reason : null,
  };
}

/** Status build 3D dari server. Tidak tersedia = informasi, bukan kegagalan. */
function StatusBuild3D() {
  const [data, setData] = useState<StatusBuild | null>(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let hidup = true;
    const jalan = async (): Promise<void> => {
      try {
        const res = await fetch('/api/unity/status', { headers: { accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        const hasil = bacaStatusBuild((await res.json()) as unknown);
        if (!hidup) return;
        if (hasil) setData(hasil);
        else setGagal(true);
      } catch {
        if (hidup) setGagal(true);
      }
    };
    void jalan();
    return () => {
      hidup = false;
    };
  }, []);

  if (gagal) {
    return (
      <Pesan jenis="kuning">
        Status build 3D tidak bisa dibaca dari server. Peserta tetap bisa bermain memakai mode
        ringan (adegan SVG).
      </Pesan>
    );
  }
  if (!data) {
    return (
      <p className="kecil lembut" style={{ margin: 0 }}>
        Memeriksa build 3D...
      </p>
    );
  }
  if (!data.available) {
    return (
      <Pesan jenis="info">
        Build 3D belum tersedia, jadi peserta memakai <strong>mode ringan</strong> (adegan SVG).
        Permainan, waktu, dan skor tetap berjalan normal.
        {data.reason ? <span className="mini lembut"> ({data.reason})</span> : null}
      </Pesan>
    );
  }
  return (
    <div className="baris">
      <span className="chip chip-hijau">
        <Icon name="cek" size={15} /> Build 3D tersedia
      </span>
      {data.downloadMb !== null ? (
        <span className="chip">
          <Icon name="kilat" size={15} /> Unduhan peserta {data.downloadMb} MB
        </span>
      ) : null}
      {data.totalMb !== null ? <span className="chip">Total build {data.totalMb} MB</span> : null}
      {data.compression !== null ? (
        <span className="chip">Kompresi {LABEL_KOMPRESI[data.compression]}</span>
      ) : null}
    </div>
  );
}

function KesiapanAdegan({ room }: { room: RoomPublicState }) {
  const belum = room.players.filter((p) => !p.sceneReady);

  return (
    <section className="panel stack" aria-labelledby="host-kesiapan">
      <div className="baris-antara">
        <h3 id="host-kesiapan" style={{ margin: 0 }}>
          Kesiapan Adegan
        </h3>
        <span className="chip chip-biru">
          <Icon name="cek" size={15} /> Adegan siap {room.sceneReadyCount} / {room.playerCount}
        </span>
      </div>

      <StatusBuild3D />

      <p className="kecil lembut" style={{ margin: 0 }}>
        Melanjutkan ronde tidak memberi tambahan waktu bagi peserta yang belum siap - waktu
        menjawab dihitung server dan sama untuk semua.
      </p>

      {room.playerCount === 0 ? (
        <div className="kosong">Belum ada peserta di room ini.</div>
      ) : !room.mission ? (
        <p className="kecil lembut" style={{ margin: 0 }}>
          Kesiapan dihitung ulang setiap ronde. Belum ada misi aktif, jadi daftar ini kosong
          sampai ronde pertama dimulai.
        </p>
      ) : belum.length === 0 ? (
        <div className="kosong">Semua peserta sudah memuat adegan ronde ini.</div>
      ) : (
        <ul className="host-siap">
          {belum.map((p) => (
            <li key={p.id}>
              <Avatar look={p.look} size={30} mood="fokus" />
              <span>
                <strong title={p.nickname}>{p.nickname}</strong>
                <i>
                  <Icon name={p.connected ? 'jam' : 'silang'} size={13} />
                  {p.connected ? 'belum siap memuat adegan' : 'terputus'}
                </i>
              </span>
              <button
                className="btn btn-garis btn-kecil"
                onClick={() => jalankan('retryScene', { playerId: p.id })}
              >
                Minta muat ulang adegan
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ pengaturan acara

function Pengaturan({ room }: { room: RoomPublicState }) {
  const [nama, setNama] = useState(room.eventName);
  const [hadiah, setHadiah] = useState<Prizes>(room.prizes);
  const [pesan, setPesan] = useState<string | null>(null);

  // Sinkron ulang hanya saat nilai dari server berubah, bukan tiap snapshot masuk.
  useEffect(() => setNama(room.eventName), [room.eventName]);
  useEffect(() => {
    setHadiah({ first: room.prizes.first, second: room.prizes.second, third: room.prizes.third });
  }, [room.prizes.first, room.prizes.second, room.prizes.third]);

  const simpan = async (
    patch: { eventName?: string; prizes?: Prizes },
    teks: string,
  ): Promise<void> => {
    const ok = await actions.hostSettings(patch);
    if (ok) setPesan(teks);
  };

  const LABEL: { kunci: keyof Prizes; teks: string }[] = [
    { kunci: 'first', teks: 'Juara 1' },
    { kunci: 'second', teks: 'Juara 2' },
    { kunci: 'third', teks: 'Juara 3' },
  ];

  return (
    <section className="panel stack" aria-labelledby="host-pengaturan">
      <h3 id="host-pengaturan">Pengaturan Acara</h3>

      <div>
        <label className="label-kolom" htmlFor="set-nama">
          Nama acara
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
          void simpan({ eventName: nama.trim() || DEFAULT_EVENT_NAME }, 'Nama acara disimpan.')
        }
      >
        Simpan nama acara
      </button>

      {LABEL.map((l) => (
        <div key={l.kunci}>
          <label className="label-kolom" htmlFor={`set-${l.kunci}`}>
            Hadiah {l.teks}
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
        onClick={() => void simpan({ prizes: hadiah }, 'Label hadiah disimpan.')}
      >
        Simpan label hadiah
      </button>

      {pesan ? (
        <Pesan jenis="sukses" onTutup={() => setPesan(null)}>
          {pesan}
        </Pesan>
      ) : null}
      <p className="mini lembut" style={{ margin: 0 }}>
        Perubahan baru berlaku setelah kamu menekan tombol simpan.
      </p>
    </section>
  );
}

// ------------------------------------------------------------------ daftar peserta

function BarisPeserta({ p }: { p: PlayerPublic }) {
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
        {p.connected ? 'Aktif' : 'Terputus'}
      </td>
      <td className="kecil">
        {p.submittedThisRound ? (
          <>
            <Icon name="cek" size={14} /> Sudah kirim
            {p.submitElapsedSeconds !== null ? ` (${p.submitElapsedSeconds}s)` : ''}
          </>
        ) : (
          <>
            <Icon name="jam" size={14} /> Belum kirim
          </>
        )}
      </td>
      <td className="tebal">{p.totalPoints.toLocaleString('id-ID')}</td>
      <td>#{p.rank}</td>
      <td>
        <TombolKonfirmasi
          label="Keluarkan"
          kelas="btn btn-kecil btn-bahaya"
          judul={`Keluarkan ${p.nickname}?`}
          pesan="Peserta ini langsung keluar dari room dan skornya tidak lagi dihitung. Ia bisa bergabung lagi lewat QR bila pertandingan belum dimulai."
          labelSetuju="Ya, keluarkan"
          onSetuju={() => jalankan('kick', { playerId: p.id })}
        />
      </td>
    </tr>
  );
}

function DaftarPeserta({ room }: { room: RoomPublicState }) {
  const urut = [...room.players].sort((a, b) => b.totalPoints - a.totalPoints);
  return (
    <section className="panel stack" aria-labelledby="host-peserta">
      <div className="baris-antara">
        <h3 id="host-peserta" style={{ margin: 0 }}>
          Daftar Peserta
        </h3>
        <span className="chip">{room.playerCount} peserta</span>
      </div>
      {urut.length === 0 ? (
        <div className="kosong">Belum ada peserta. Minta peserta memindai QR.</div>
      ) : (
        <div className="host-geser">
          <table className="tabel">
            <thead>
              <tr>
                <th scope="col">Peserta</th>
                <th scope="col">Koneksi</th>
                <th scope="col">Ronde ini</th>
                <th scope="col">Poin</th>
                <th scope="col">Peringkat</th>
                <th scope="col">Aksi</th>
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
          <span className="judul-kecil">Layar Host</span>
        </span>
        <ConnectionBadge />
      </header>

      <main className="isi wrap-lebar stack-l" style={{ paddingTop: 16 }}>
        {error ? (
          <Pesan jenis="error" onTutup={actions.clearError}>
            {error}
          </Pesan>
        ) : null}
        {status !== 'connected' ? (
          <Pesan jenis="kuning">
            Koneksi ke server belum stabil. Tombol kendali bisa gagal sampai status kembali
            &quot;Tersambung&quot;.
          </Pesan>
        ) : null}

        {!room ? (
          <MulaiHost />
        ) : (
          <>
            <div className="baris-antara">
              <h1 style={{ margin: 0 }}>{room.eventName}</h1>
              <span className="chip chip-kuning">Room {room.code}</span>
            </div>

            <div className="host-grid">
              <div className="stack-l">
                <Undang room={room} />
                <AudioControls />
              </div>
              <div className="stack-l">
                <Kendali room={room} />
                <KesiapanAdegan room={room} />
                <Pengaturan room={room} />
              </div>
            </div>

            <DaftarPeserta room={room} />

            <section className="panel stack" aria-labelledby="host-papan">
              <h3 id="host-papan">Papan Peringkat Terkini</h3>
              <Leaderboard rows={room.leaderboard ?? []} prizes={room.prizes} />
            </section>

            {room.phase === 'FINISHED' && room.podium && room.podium.length > 0 ? (
              <section className="panel stack" aria-labelledby="host-podium">
                <h3 id="host-podium">Podium</h3>
                <div className="host-podium">
                  {room.podium.map((r) => (
                    <div key={r.playerId} className="panel-krem tengah stack-s">
                      <span className="chip chip-kuning">
                        <Icon name="medali" size={15} /> Juara {r.rank}
                      </span>
                      <div style={{ display: 'grid', placeItems: 'center' }}>
                        <Avatar look={r.look} size={72} mood="senang" />
                      </div>
                      <strong>{r.nickname}</strong>
                      <span className="kecil">{r.totalPoints.toLocaleString('id-ID')} poin</span>
                      <span className="mini lembut">
                        {r.rank === 1
                          ? room.prizes.first
                          : r.rank === 2
                            ? room.prizes.second
                            : room.prizes.third}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="panel stack" aria-labelledby="host-ekspor">
              <h3 id="host-ekspor">Ekspor Hasil</h3>
              <div className="baris">
                <a className="btn btn-netral" href={tautanEkspor('csv')} download>
                  Ekspor CSV
                </a>
                <a className="btn btn-netral" href={tautanEkspor('json')} download>
                  Ekspor JSON
                </a>
              </div>
              <p className="kecil lembut" style={{ margin: 0 }}>
                File berisi hasil lengkap per misi untuk tiap peserta: ketepatan, poin, bonus
                kecepatan, dan waktu menjawab. Unduh sebelum menekan reset.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
