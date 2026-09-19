/**
 * Layar proyektor kantor (landscape 16:9, dibaca dari jauh).
 *
 * Halaman ini hanya PENONTON: tidak ada kontrol pertandingan di sini.
 * Peserta yang datang terlambat juga memakai halaman ini dari HP,
 * jadi seluruh grid turun menjadi satu kolom di layar sempit.
 *
 * Semua angka berasal dari snapshot server (`room`). Tidak ada peserta,
 * skor, atau kunci jawaban yang dibuat di client; bila data kosong kita
 * tampilkan `.kosong` yang jujur.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { LeaderRow, Phase } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { CityMap } from '../art/CityMap';
import { Icon } from '../art/Icon';
import { RakiBubble } from '../art/Raki';
import { AdeganLayar } from '../game/AdeganLayar';
import { misiBergambar } from '../game/gambar';
import { KarakterTokoh } from '../game/KarakterTokoh';
import { PilihBahasa } from '../components/PilihBahasa';
import { TombolGerak } from '../components/TombolGerak';
import { TOKOH } from '@shared/brand';
import { playSfx, preferMusicOn, setTrack } from '../audio/audio';
import { useOnChange } from '../hooks';
import { misiDalamBahasa, revealDalamBahasa, t, useBahasa } from '../i18n';
import { terjemahkanBawaan, terjemahkanGalat } from '../i18n/galat';
import { actions, useGame } from '../state/store';
import {
  AudioControls,
  BrandTitle,
  Confetti,
  KodeRoom,
  Leaderboard,
  Memuat,
  Pesan,
  PhaseBadge,
  QrCode,
  Timer,
  phaseLabel,
} from '../ui/kit';

/** Musik latar per fase (fase PAUSED memakai fase yang dijeda). */
const TRACK: Record<Phase, 'lobby' | 'game' | 'podium'> = {
  LOBBY: 'lobby',
  TUTORIAL: 'lobby',
  BRIEFING: 'game',
  ACTIVE: 'game',
  REVEAL: 'game',
  LEADERBOARD: 'game',
  FINISHED: 'podium',
  PAUSED: 'game',
};

/** Penanda "room tidak ditemukan" tanpa pesan server; teksnya dibaca saat render (ikut bahasa aktif). */
const GAGAL_TANPA_PESAN = 'layar.roomTidakDitemukan';

const MAKS_AVATAR = 40;
const MAKS_TITIK = 60;

const CSS = `
.pj-lebar{max-width:1500px}
.pj-kolom{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);
  gap:clamp(14px,1.8vw,28px);align-items:start}
.pj-judul{font-family:var(--font-judul);font-weight:800;line-height:1.05;margin:0;
  font-size:clamp(28px,4.2vw,56px)}
.pj-judul2{font-family:var(--font-judul);font-weight:800;line-height:1.1;margin:0;
  font-size:clamp(22px,2.4vw,38px)}
.pj-teks{font-size:clamp(18px,1.55vw,26px);line-height:1.4;margin:0}
.pj-teks2{font-size:clamp(16px,1.15vw,21px);line-height:1.45;margin:0;color:#cfe3d5}
.pj-timer .timer{font-size:clamp(20px,2.1vw,34px)}
.pj-acara{font-family:var(--font-judul);font-weight:800;font-size:clamp(17px,1.8vw,30px)}
.pj-kode > span{font-size:clamp(44px,6vw,92px) !important;padding:10px 26px !important}

.pj-avatars{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:10px}
.pj-avatars figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:2px}
.pj-avatars figcaption{font-size:13px;font-weight:700;max-width:78px;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.pj-avatars svg{max-width:100%;height:auto}

.pj-titik{display:grid;grid-template-columns:repeat(auto-fill,minmax(152px,1fr));gap:8px}
.pj-kirim{display:flex;align-items:center;gap:8px;padding:6px 10px;min-height:44px;
  border-radius:var(--radius-pill);border:2px solid rgba(255,249,233,.22);
  background:rgba(255,249,233,.06)}
.pj-kirim.ok{border-color:var(--kuning);background:rgba(246,196,69,.2)}
.pj-kirim b{display:block;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pj-kirim i{display:flex;align-items:center;gap:4px;font-size:12px;font-style:normal;color:#cfe3d5}
.pj-kirim.ok i{color:var(--kuning);font-weight:800}
.pj-kirim > span{min-width:0;flex:1}

.pj-bar{height:clamp(22px,2.2vw,34px);border-radius:var(--radius-pill);
  background:rgba(255,249,233,.16);overflow:hidden}
.pj-bar > i{display:block;height:100%;background:var(--kuning);
  border-radius:var(--radius-pill);transition:width 420ms ease}

.pj-papan .papan-baris{padding:12px 16px;gap:16px}
.pj-papan .papan-peringkat{width:46px;height:46px;font-size:22px}
.pj-papan .papan-nama{font-size:clamp(18px,1.5vw,26px)}
.pj-papan .papan-poin{font-size:clamp(18px,1.6vw,28px)}
.pj-papan .papan-baris svg{width:46px;height:46px}

.pj-podium{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(6px,1.4vw,20px);align-items:end}
.pj-tiang{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;
  padding:14px 8px;text-align:center;background:rgba(255,249,233,.12);
  border:2px solid rgba(255,249,233,.3);border-bottom:0;
  border-radius:var(--radius-l) var(--radius-l) 0 0}
.pj-tiang.emas{background:rgba(246,196,69,.22);border-color:var(--kuning)}
.pj-tiang svg{max-width:100%;height:auto}
.pj-tiang .pj-nama{font-family:var(--font-judul);font-weight:900;line-height:1.1;
  font-size:clamp(17px,1.9vw,32px);overflow-wrap:anywhere}
.pj-tiang .pj-poin{font-weight:900;font-variant-numeric:tabular-nums;
  font-size:clamp(16px,1.6vw,28px)}

.pj-kunci{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.pj-kunci li{display:flex;gap:8px;align-items:flex-start}

.pj-pojok{position:fixed;right:12px;bottom:12px;z-index:40;display:flex;gap:8px;align-items:center}
.pj-jeda{position:fixed;inset:0;z-index:45;display:grid;place-items:center;text-align:center;
  padding:24px;background:rgba(12,42,29,.92)}
.pj-jeda-kata{font-family:var(--font-judul);font-weight:900;letter-spacing:.06em;line-height:1;
  font-size:clamp(46px,12vw,150px)}

@media (max-width:900px){
  .pj-kolom{grid-template-columns:minmax(0,1fr)}
}
`;

/** Potong daftar panjang agar layar tetap terbaca; sisanya diringkas. */
function potong<T>(daftar: readonly T[], maks: number): { tampil: T[]; sisa: number } {
  return { tampil: daftar.slice(0, maks), sisa: Math.max(0, daftar.length - maks) };
}

function rondeSelesai(sampai: number): number[] {
  return Array.from({ length: Math.max(0, sampai) }, (_, i) => i);
}

/**
 * Rata-rata ketepatan per ronde yang dijawab.
 * `totalAccuracy` pada LeaderRow adalah JUMLAH ketepatan seluruh ronde,
 * jadi pembaginya adalah total ronde terjawab. null bila belum ada data.
 */
function rataKetepatan(rows: readonly LeaderRow[]): number | null {
  let jumlah = 0;
  let ronde = 0;
  for (const r of rows) {
    jumlah += r.totalAccuracy;
    ronde += r.answeredCount;
  }
  return ronde > 0 ? jumlah / ronde : null;
}

export default function Projector() {
  const { room, status } = useGame();
  const { bahasa } = useBahasa();
  const [params, setParams] = useSearchParams();
  const kodeUrl = (params.get('room') ?? '').trim().toUpperCase();

  const [ketikan, setKetikan] = useState(kodeUrl);
  const [gagal, setGagal] = useState<string | null>(null);
  const [menyambung, setMenyambung] = useState(kodeUrl.length > 0);
  const [konfeti, setKonfeti] = useState(false);
  const dicoba = useRef<string | null>(null);

  // Panitia memutar musik di layar besar; halaman pemain tidak.
  useEffect(() => {
    preferMusicOn();
  }, []);

  useEffect(() => {
    if (!kodeUrl || dicoba.current === kodeUrl) return;
    dicoba.current = kodeUrl;
    setMenyambung(true);
    setGagal(null);
    void actions.spectate(kodeUrl).then((res) => {
      setMenyambung(false);
      setGagal(res.ok ? null : (res.error ?? GAGAL_TANPA_PESAN));
    });
  }, [kodeUrl]);

  // Misi & pembahasan dalam bahasa aktif (id tidak berubah). Dihitung sebelum early-return (aturan hooks).
  const misiAsli = room?.mission ?? null;
  const revealAsli = room?.reveal ?? null;
  const misi = useMemo(() => (misiAsli ? misiDalamBahasa(misiAsli, bahasa) : null), [misiAsli, bahasa]);
  const reveal = useMemo(() => (revealAsli ? revealDalamBahasa(revealAsli, misi, bahasa) : null), [revealAsli, misi, bahasa]);

  // Fase yang ditampilkan: saat PAUSED tetap tampilkan isi fase yang dijeda.
  const fase: Phase = room
    ? room.phase === 'PAUSED'
      ? (room.prevPhase ?? 'LOBBY')
      : room.phase
    : 'LOBBY';

  useOnChange(fase, (berikut) => {
    setTrack(TRACK[berikut]);
    if (berikut === 'LEADERBOARD') playSfx('papan');
    if (berikut === 'FINISHED') {
      setKonfeti(true);
      playSfx('confetti');
    }
  });

  useEffect(() => {
    if (!konfeti) return;
    const id = window.setTimeout(() => setKonfeti(false), 6000);
    return () => window.clearTimeout(id);
  }, [konfeti]);

  // ---------------------------------------------------------------- gerbang kode

  if (gagal || (!room && !menyambung)) {
    const pesanGagal = gagal === GAGAL_TANPA_PESAN ? t(GAGAL_TANPA_PESAN) : terjemahkanGalat(gagal);
    return (
      <div className="proyektor">
        <style>{CSS}</style>
        <div className="wrap-lebar stack stack-l" style={{ maxWidth: 620, paddingTop: 24 }}>
          <BrandTitle size="besar" />
          <h1 className="pj-judul">{t('layar.layarAcara')}</h1>
          {gagal ? (
            <Pesan jenis="error">
              {t('layar.gagalPeriksaKode', { pesan: pesanGagal })}
            </Pesan>
          ) : (
            <p className="pj-teks">{t('layar.masukkanKode')}</p>
          )}
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const bersih = ketikan.trim().toUpperCase();
              if (bersih.length < 4) return;
              setGagal(null);
              dicoba.current = null;
              setParams({ room: bersih });
            }}
          >
            <label className="label-kolom" htmlFor="pj-kode">
              {t('layar.labelKode')}
            </label>
            <input
              id="pj-kode"
              className="kolom kolom-kode"
              value={ketikan}
              onChange={(e) => setKetikan(e.target.value.toUpperCase().slice(0, 4))}
              maxLength={4}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ABCD"
              aria-describedby="pj-kode-bantu"
            />
            <button className="btn btn-utama btn-blok" type="submit" disabled={ketikan.trim().length < 4}>
              {t('layar.tampilkanLayar')}
            </button>
          </form>
          <p id="pj-kode-bantu" className="pj-teks2">
            {t('layar.bantuKode')}
          </p>
          <div className="pj-pojok">
            <PilihBahasa />
            <AudioControls ringkas />
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="proyektor">
        <style>{CSS}</style>
        <div className="wrap-lebar" style={{ maxWidth: 620, paddingTop: 48 }}>
          <Memuat teks={t('layar.menyambungKeRoom', { kode: kodeUrl })} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- data turunan

  const selesai = rondeSelesai(room.roundIndex);
  const papan = room.leaderboard ?? [];
  const podium = room.podium ?? papan;
  const tampilRonde = room.roundIndex >= 0 && fase !== 'LOBBY' && fase !== 'TUTORIAL';
  const masuk = room.submittedCount;
  const totalPeserta = room.playerCount;
  const persen = totalPeserta > 0 ? Math.round((masuk / totalPeserta) * 100) : 0;
  // Nama acara & label hadiah BAWAAN ikut bahasa aktif; isian panitia tampil apa adanya.
  const hadiah = [room.prizes.first, room.prizes.second, room.prizes.third].map(terjemahkanBawaan);
  const namaAcara = terjemahkanBawaan(room.eventName);

  const galeri = potong(room.players, MAKS_AVATAR);
  const titik = potong(room.players, MAKS_TITIK);

  // ---------------------------------------------------------------- bagian layar

  const gerbangGabung = (
    <div className="pj-kolom">
      <div className="panel stack stack-l" style={{ alignItems: 'center', textAlign: 'center' }}>
        <QrCode value={room.joinUrl} size={TOKOH.isti.aktif ? 260 : 300} />
        <div className="pj-kode">
          <KodeRoom code={room.code} />
        </div>
        {/* Bu Isti (Direktur IT) menjelaskan cara bergabung; tanpa tokoh, petunjuk biasa. */}
        {TOKOH.isti.aktif ? (
          <KarakterTokoh
            tokoh="isti"
            className="pj-isti"
            tinggi={150}
            teks={
              <>
                {t('layar.pindaiAwal')}{' '}
                <strong className="mono" style={{ overflowWrap: 'anywhere' }}>
                  {room.joinUrl}
                </strong>{' '}
                {t('layar.pindaiAkhir')} {t('tokoh.isti.gabung')}
              </>
            }
          />
        ) : (
          <>
            <p className="pj-teks">
              {t('layar.pindaiAwal')}{' '}
              <strong className="mono" style={{ overflowWrap: 'anywhere' }}>
                {room.joinUrl}
              </strong>{' '}
              {t('layar.pindaiAkhir')}
            </p>
            <p className="pj-teks2">{t('layar.pilihKarakter')}</p>
          </>
        )}
      </div>
      <div className="stack">
        <KarakterTokoh tokoh="ceo" className="pj-ceo" tinggi={150} teks={t('tokoh.ceo.awal')} />
        <div className="panel">
          <h2 className="pj-judul2">{t('layar.petaPerjalanan')}</h2>
          <CityMap currentRound={-1} completed={[]} compact />
        </div>
        <div className="panel stack">
          <div className="baris-antara">
            <h2 className="pj-judul2">{t('layar.pesertaBergabung')}</h2>
            <span className="chip chip-kuning">
              <Icon name="bintang" size={16} /> {t('layar.nOrang', { n: totalPeserta })}
            </span>
          </div>
          {totalPeserta === 0 ? (
            <div className="kosong">{t('layar.belumAdaPesertaQr')}</div>
          ) : (
            <>
              <div className="pj-avatars">
                {galeri.tampil.map((p) => (
                  <figure key={p.id} className="anim-masuk">
                    <Avatar look={p.look} size={56} mood={p.ready ? 'senang' : 'netral'} />
                    <figcaption title={p.nickname}>{p.nickname}</figcaption>
                  </figure>
                ))}
              </div>
              {galeri.sisa > 0 ? (
                <p className="pj-teks tebal">{t('layar.pesertaLainBergabung', { n: galeri.sisa })}</p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const progres = (
    <div className="panel stack">
      <div className="baris-antara">
        <h2 className="pj-judul2">{t('layar.progresPengiriman')}</h2>
        <strong className="pj-teks">
          {t('layar.jawabanMasuk', { masuk, total: totalPeserta })}
        </strong>
      </div>
      <div
        className="pj-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={persen}
        aria-label={t('layar.jawabanMasukAria', { masuk, total: totalPeserta })}
      >
        <i style={{ width: `${persen}%` }} />
      </div>
      {totalPeserta === 0 ? (
        <div className="kosong">{t('layar.belumAdaPesertaRoom')}</div>
      ) : (
        <>
          <div className="pj-titik">
            {titik.tampil.map((p) => (
              <span key={p.id} className={'pj-kirim' + (p.submittedThisRound ? ' ok' : '')}>
                <Avatar look={p.look} size={30} mood={p.submittedThisRound ? 'senang' : 'fokus'} />
                <span>
                  <b title={p.nickname}>{p.nickname}</b>
                  <i>
                    <Icon name={p.submittedThisRound ? 'cek' : 'jam'} size={13} />
                    {p.submittedThisRound ? t('layar.terkirim') : t('layar.menunggu')}
                  </i>
                </span>
              </span>
            ))}
          </div>
          {titik.sisa > 0 ? <p className="pj-teks2">{t('layar.pesertaLain', { n: titik.sisa })}</p> : null}
        </>
      )}
      <p className="pj-teks2">
        {t('layar.kunciSaatPembahasan')}
      </p>
    </div>
  );

  const misiBerjalan = (
    <div className="pj-kolom">
      <div className="stack">
        <div className="panel">
          <h2 className="pj-judul2">{t('layar.perjalananMisi')}</h2>
          <CityMap currentRound={room.roundIndex} completed={selesai} />
        </div>
        {/* Kasus dibawakan Miss Raksa (CS) di kolom kiri supaya terlihat tanpa menggulung. */}
        {fase === 'BRIEFING' && misi && misi.id !== 'tutorial' ? (
          <KarakterTokoh tokoh="missRaksa" className="pj-ceo" tinggi={190} teks={misi.rakiBriefing} />
        ) : null}
      </div>
      <div className="stack">
        <div className="panel stack">
          <div className="baris">
            <span className="label-produk">{misi ? misi.productLabel : t('layar.labelMisi')}</span>
            {misi ? <span className="chip chip-biru">{misi.location}</span> : null}
          </div>
          <h2 className="pj-judul">
            {misi ? t('layar.judulMisi', { n: misi.number, judul: misi.title }) : t('layar.menungguMisi')}
          </h2>
          {misi ? <p className="pj-teks">{misi.story}</p> : null}
          {misi ? (
            // Soal bergambar: gambar adalah bahan utamanya, jadi boleh selebar kolom (dibaca dari jauh).
            <div style={{ maxWidth: misiBergambar(misi) ? 760 : 560 }}>
              <AdeganLayar mission={misi} roundIndex={room.roundIndex} reveal={null} />
            </div>
          ) : null}
          {fase === 'BRIEFING' && misi && (misi.id === 'tutorial' || !TOKOH.missRaksa.aktif) ? (
            <RakiBubble judul={t('layar.briefing')} teks={misi.rakiBriefing} mood="bicara" size={88} />
          ) : null}
          {fase === 'BRIEFING' && totalPeserta > 0 ? (
            <p className="pj-teks tebal">
              <Icon name="cek" size={20} /> {t('layar.adeganSiap', { siap: room.sceneReadyCount, total: totalPeserta })}
            </p>
          ) : null}
          {fase === 'ACTIVE' && misi ? <p className="pj-teks tebal">{misi.instruction}</p> : null}
        </div>
        {progres}
      </div>
    </div>
  );

  const pembahasan = !reveal ? (
    <div className="kosong">{t('layar.pembahasanBelum')}</div>
  ) : (
    <div className="pj-kolom">
      <div className="stack">
        <div className="panel stack-s">
          <h2 className="pj-judul">
            {misi ? t('layar.pembahasanMisi', { n: misi.number, judul: misi.title }) : t('layar.pembahasan')}
          </h2>
          <p className="pj-teks">{reveal.summary}</p>
        </div>
        {reveal.steps.map((s) => (
          <div className="panel stack-s" key={s.stepId}>
            <strong className="pj-teks">{s.prompt}</strong>
            <ul className="pj-kunci">
              {s.correctText.map((teksBenar, i) => (
                <li key={i} className="pj-teks">
                  <Icon name="cek" size={22} />
                  <span>{teksBenar}</span>
                </li>
              ))}
            </ul>
            <p className="pj-teks2">{s.explanation}</p>
          </div>
        ))}
      </div>
      <div className="stack">
        {/* Bu Isti sebagai juri membacakan inti pembahasan (Raki bila tokoh dinonaktifkan). */}
        {TOKOH.isti.aktif ? (
          <KarakterTokoh tokoh="isti" className="pj-juri" tinggi={140} label={`${TOKOH.isti.nama} · ${t('tokoh.isti.juri')}`} teks={<><strong>{t('layar.dibawaPulangTitik')}</strong> {reveal.learning}</>} />
        ) : (
          <RakiBubble judul={t('layar.dibawaPulang')} teks={reveal.learning} mood="bicara" size={110} />
        )}
        {misi ? <AdeganLayar mission={misi} roundIndex={room.roundIndex} reveal={reveal} /> : null}
        <div className="panel">
          <h2 className="pj-judul2">{t('layar.perjalananMisi')}</h2>
          <CityMap currentRound={room.roundIndex} completed={selesai} compact />
        </div>
      </div>
    </div>
  );

  const rata = rataKetepatan(papan);
  const naik = papan.filter((r) => r.delta > 0).length;

  const peringkat = (
    <div className="pj-kolom">
      <div className="panel stack">
        <h2 className="pj-judul">{t('layar.peringkat10')}</h2>
        {/* key = ronde: papan dianimasikan ulang tiap kali peringkat diperbarui. */}
        <div className="pj-papan anim-masuk" key={`papan-${room.roundIndex}`}>
          <Leaderboard rows={papan} limit={10} prizes={room.prizes} />
        </div>
      </div>
      <div className="stack">
        <KarakterTokoh tokoh="isti" className="pj-ceo" tinggi={130} teks={t('tokoh.isti.ringkasan')} />
        <div className="panel stack-s">
          <h2 className="pj-judul2">{t('layar.ringkasanRonde', { n: room.roundIndex + 1 })}</h2>
          <p className="pj-teks">
            <strong>{masuk}</strong> {t('layar.dariPesertaMengirim', { total: totalPeserta })}
          </p>
          {rata !== null ? (
            <p className="pj-teks">
              {t('layar.rataKetepatan')} <strong>{Math.round(rata * 100)}%</strong>
            </p>
          ) : (
            <p className="pj-teks2">{t('layar.rataBelum')}</p>
          )}
          {naik > 0 ? (
            <p className="pj-teks2">
              <Icon name="kilat" size={18} /> {t('layar.naikPeringkat', { n: naik })}
            </p>
          ) : null}
        </div>
        <div className="panel">
          <h2 className="pj-judul2">{t('layar.perjalananMisi')}</h2>
          <CityMap currentRound={room.roundIndex} completed={selesai} compact />
        </div>
      </div>
    </div>
  );

  const tigaBesar = podium.slice(0, 3);
  const akhir = (
    <div className="stack stack-l">
      <h2 className="pj-judul tengah">{t('layar.juara', { acara: namaAcara })}</h2>
      <div className="tokoh-trio">
        <KarakterTokoh tokoh="isti" tinggi={170} susun="bawah" />
        <KarakterTokoh tokoh="ceo" tinggi={190} susun="bawah" teks={t('tokoh.ceo.podium')} />
        <KarakterTokoh tokoh="missRaksa" tinggi={170} susun="bawah" />
      </div>
      {room.tie ? (
        <Pesan jenis="kuning">
          {t('layar.adaSeri')}
        </Pesan>
      ) : null}
      {tigaBesar.length === 0 ? (
        <div className="kosong">{t('layar.belumAdaHasil')}</div>
      ) : (
        <div className="pj-podium">
          {[1, 0, 2].map((idx, kolom) => {
            const r = tigaBesar[idx];
            if (!r) return <div key={`kosong-${kolom}`} aria-hidden />;
            const tinggi = idx === 0 ? 300 : idx === 1 ? 240 : 210;
            return (
              <div
                key={r.playerId}
                className={'pj-tiang anim-masuk' + (idx === 0 ? ' emas' : '')}
                style={{ minHeight: tinggi }}
              >
                <span className="papan-peringkat" style={{ width: 44, height: 44, fontSize: 22 }}>
                  {r.rank}
                </span>
                <Avatar look={r.look} size={110} mood="senang" />
                <div className="pj-nama">{r.nickname}</div>
                <div className="pj-poin">{t('layar.nPoin', { n: r.totalPoints.toLocaleString('id-ID') })}</div>
                <span className="chip chip-kuning">
                  <Icon name="medali" size={16} /> {hadiah[idx]}
                </span>
                {r.tied ? <span className="pj-teks2">{t('layar.peringkatSeri')}</span> : null}
              </div>
            );
          })}
        </div>
      )}
      <div className="panel stack">
        <h2 className="pj-judul2">{t('layar.sepuluhBesar')}</h2>
        <div className="pj-papan">
          <Leaderboard rows={podium} limit={10} prizes={room.prizes} />
        </div>
      </div>
      <p className="pj-teks2 tengah">{t('layar.terimaKasih')}</p>
    </div>
  );

  const isi =
    fase === 'LOBBY' || fase === 'TUTORIAL'
      ? gerbangGabung
      : fase === 'BRIEFING' || fase === 'ACTIVE'
        ? misiBerjalan
        : fase === 'REVEAL'
          ? pembahasan
          : fase === 'LEADERBOARD'
            ? peringkat
            : fase === 'FINISHED'
              ? akhir
              : gerbangGabung;

  // ---------------------------------------------------------------- render

  return (
    <div className="proyektor">
      <style>{CSS}</style>
      <header className="wrap-lebar pj-lebar baris-antara" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="baris">
          <BrandTitle size="kecil" />
          <span className="pj-acara">{namaAcara}</span>
          <PhaseBadge phase={room.phase} />
        </div>
        <div className="baris">
          {tampilRonde ? (
            <span className="chip chip-biru">
              <Icon name="lokasi" size={16} /> {t('layar.rondeKe', { n: room.roundIndex + 1, total: room.totalRounds })}
            </span>
          ) : null}
          <span className="pj-timer">
            <Timer endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} />
          </span>
          <span className="chip chip-hijau">
            <Icon name="operator" size={16} /> {t('layar.pesertaTersambung', { n: totalPeserta, tersambung: room.connectedCount })}
          </span>
          <span className="chip">
            <Icon name="selfie" size={16} /> {t('layar.nPenonton', { n: room.spectatorCount })}
          </span>
        </div>
      </header>

      <div className="wrap-lebar pj-lebar stack">
        {status !== 'connected' ? (
          <Pesan jenis="kuning">{t('layar.menyambungUlangServer')}</Pesan>
        ) : null}
        {isi}
      </div>

      {konfeti ? <Confetti jumlah={90} /> : null}

      {room.phase === 'PAUSED' ? (
        <div className="pj-jeda" role="status">
          <div className="stack">
            <div className="pj-jeda-kata">{t('layar.dijedaBesar')}</div>
            <p className="pj-teks">
              {t('layar.faseDijeda')} <strong>{phaseLabel(fase)}</strong>
            </p>
            <p className="pj-teks">
              {room.pausedRemainingMs !== null
                ? t('layar.sisaWaktuDetik', { n: Math.ceil(room.pausedRemainingMs / 1000) })
                : t('layar.tanpaHitungMundur')}
            </p>
            <p className="pj-teks2">{t('layar.menungguLanjut')}</p>
          </div>
        </div>
      ) : null}

      <div className="pj-pojok">
        <TombolGerak ringkas />
        <PilihBahasa />
        <AudioControls ringkas />
      </div>
    </div>
  );
}
