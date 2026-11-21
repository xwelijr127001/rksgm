/**
 * DAFTAR EPISODE MODE CERITA (/cerita). Kontrak: docs/rancangan-mode-cerita.md bagian 4.
 *
 * T-037 (pemilik 18 Nov): satu layar HP tanpa gulir; kasus nyata (auto-2) = Episode 1, satu-satunya kartu yang bisa dimainkan;
 * lalu baris TERKUNCI Episode 2 (segera hadir, tanpa rute); kartu demo (auto-1) hanya bila RAKSA_DEMO_CERITA=on. Tanpa kartu Join
 * Game (cukup tautan "Punya kode room?"). Thumbnail = WAJAH tokoh (atlas potret piksel). Tiap kartu
 *
 * Judul + SATU kalimat pengantar, lalu Join Game (satu-satunya ajakan gabung acara, di ATAS daftar episode; review staf
 * #4), lalu satu kartu per episode di DAFTAR_EPISODE (nomor = urutan daftar, produk, durasi, ringkas, status sendiri
 * dari simpan.ts: Baru / Sedang berjalan · Bagian n / Selesai · akhir ditemukan n/m). Tidak ada blok "Cara main lain"
 * dan tidak ada Latihan misi (arahan pemilik); episode yang belum siap tidak tampil. Tanpa profil -> /kenalan. Tiap kartu
 * membawa tag jenis episode (T-026, `Episode.jenis`: DEMO / KASUS NYATA) sebagai lencana di pojok kanan-atas gambarnya. Kartu
 * selesai: "Main lagi dari awal" (arsip episode itu saja) dan "Lihat hasil". Seni kartu dari panggung episodenya:
 * ruang piksel Episode 1, atau sampul panggung latar (`Episode.latar.sampul`).
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import type { Bahasa } from '@shared/bahasa';
import { TOKOH } from '@shared/brand';
import { Icon } from '../art/Icon';
import { Arrow, PlayerShell } from '../components/PlayerShell';
import { t, useBahasa } from '../i18n';
import { useProfil } from '../state/profil';
import { cariEpisode } from '../cerita/episode';
import { daftarKasusHub } from '../cerita/investigasi/hub';
import { RUTE_HUB } from '../cerita/investigasi/rute';
import { bacaRekaman, berlanggananInvestigasi, TOTAL_MAKS, totalSkor, versiInvestigasi } from '../cerita/investigasi/simpan';
import { LatarPanggung, TokohNasabah } from '../cerita/seni';
import { PotretMissRaksa } from '../cerita/seni/tokoh/PotretMissRaksa';
import { akhirDitemukan, berlanggananCerita, muatProgres, mulaiBaru, versiPenyimpananCerita } from '../cerita/simpan';
import { teksCerita } from '../cerita/teks';
import type { Ekspresi, Episode } from '../cerita/tipe';
import { useAppConfig } from '../story/appConfig';
import { PotretPikselHp } from '../cerita/ui/latar/piksel/PotretPikselHp';
import { PanggungLatar } from '../cerita/ui/latar/PanggungLatar';
import { idAman, kotakKepala, type Kotak } from '../cerita/ui/panggung/dunia';
import { seniKartuRuang } from '../cerita/ui/panggung/kartuRuang';
import { kotakPapan, ruangPiksel, SATUAN_PIKSEL } from '../cerita/ui/panggung/piksel';
import { ambilRuang, gambarTokoh } from '../cerita/ui/panggung/sumber';
import { useDpr } from '../game/tokoh';
import { simpanModeAdegan } from '../cerita/ui/panggung/mode';
import { statusEpisode, type StatusEpisode } from '../cerita/ui/tampilan';
import { hangatkanEpisodeAwal } from '../cerita/ui/latar/hangatkanDaftar';
import potretInvestigator from '../cerita/seni/investigasi/reaksi.png';
import '../cerita/ui/cerita.css';

export default function Cerita() {
  const { bahasa } = useBahasa();
  const { profil } = useProfil();
  // ?adegan=ringan|penuh disimpan SEKALI saat daftar dibuka (sebelum pengalihan ke /kenalan dan sebelum pemain
  // membuka episode lewat tautan tanpa query), sama dengan halaman episode.
  useState(simpanModeAdegan);
  // Status kartu ikut perubahan progres (tab ini & tab lain).
  useSyncExternalStore(berlanggananCerita, versiPenyimpananCerita, () => 0);
  const nav = useNavigate();
  const cfg = useAppConfig();
  // T-010 G3: latar adegan pertama episode berpanggung latar dipanaskan selagi daftar dibaca (dibatalkan saat pindah halaman).
  // R-14: dipanaskan ulang dengan ukuran baru saat layar diputar / DPR berubah.
  useEffect(() => { if (profil) hangatkanEpisodeAwal(); }, [profil]);

  if (!profil) return <Navigate to="/kenalan?lanjut=/cerita" replace />;

  // T-037: hanya kasus nyata yang bisa dimainkan; demo (auto-1) hanya untuk uji internal (RAKSA_DEMO_CERITA=on). Id episode,
  // rute /cerita/auto-1 dan progres tersimpan tidak berubah.
  const nyata = cariEpisode('auto-2');
  // T-064: Episode 1 Dev (5-minute walk-up cut of the same case) is offered first; the full Episode 1 card is unchanged.
  // T-074 (owner, temporary): the card only with RAKSA_EP1_DEV=on (features.ep1Dev); /cerita/kenalan and /cerita/auto-2-dev
  // still open the episode directly when the card is hidden.
  const dev = cfg.status === 'ready' && cfg.config.ep1Dev ? cariEpisode('auto-2-dev') : null;
  // T-076 / T-094: with RAKSA_INVESTIGATOR=on the picker shows ONE "Raksa Investigator" card that opens the hub (/investigator),
  // not one card per case; the hub and the case links work regardless of the flag.
  const inv = cfg.status === 'ready' && cfg.config.investigator ? cariEpisode('auto-2-inv') : null;
  const demo = cfg.status === 'ready' && cfg.config.demoCerita ? cariEpisode('auto-1') : null;
  const kartu = (ep: Episode) => (
    <KartuEpisode
      key={ep.id}
      ep={ep}
      bahasa={bahasa}
      nama={profil.nickname}
      onMainLagi={() => {
        // Perjalanan lama diarsipkan (bukan dihapus); akhir yang ditemukan tetap tercatat.
        mulaiBaru(ep);
        nav('/cerita/' + ep.id);
      }}
    />
  );
  const [kodeAwal, kodeAkhir = ''] = t('cerita.hubKode', { tautan: '\u0000' }).split('\u0000');

  return (
    <PlayerShell
      back="/"
      label={<>{TOKOH.missRaksa.aktif ? <span className="cer-hub-potret-kecil" aria-hidden="true"><PotretMissRaksa ekspresi="tersenyum" ukuran={28} /></span> : null}{t('cerita.labelHub')}</>}
      className="cer-hub-layar"
    >
      <main className="cer-hub">
        <header className="cer-hub-kepala">
          {/* Potret piksel Miss Raksa (seni panggung cerita); tokoh dinonaktifkan = tanpa potret seperti dulu. */}
          {TOKOH.missRaksa.aktif ? <span className="cer-hub-potret" aria-hidden="true"><PotretMissRaksa ekspresi="tersenyum" ukuran={56} /></span> : null}
          <div>
            <span className="eyebrow">{t('cerita.eyebrowHub')}</span>
            <h1>{t('cerita.judulMode')}</h1>
            <p>{t('cerita.hubIntro')}</p>
          </div>
        </header>

        <ul className="cer-hub-daftar" aria-label={t('cerita.daftarEpisodeAria')}>
          {inv ? <KartuInvestigator ep={inv} bahasa={bahasa} nama={profil.nickname} /> : null}
          {dev ? kartu(dev) : null}
          {nyata ? kartu(nyata) : null}
          <BarisSegera />
          {demo ? kartu(demo) : null}
        </ul>
        <p className="cer-hub-kode">{kodeAwal}<Link to="/">{t('cerita.hubKodeTautan')}</Link>{kodeAkhir}</p>
        <p className="cer-hub-catatan">{t('cerita.catatanPerangkat')}</p>
      </main>
    </PlayerShell>
  );
}

/**
 * T-094: SATU kartu "Raksa Investigator" di daftar episode (dulu satu kartu per kasus): wajah Miss Raksa investigator, sampul
 * kasus 1, stempel dan total perangkat ini, dan satu tautan ke hub /investigator. Kelas kartunya sama dengan KartuEpisode.
 */
function KartuInvestigator({ ep, bahasa, nama }: { ep: Episode; bahasa: Bahasa; nama: string }) {
  useSyncExternalStore(berlanggananInvestigasi, versiInvestigasi, () => 0);
  const tx = (k: string) => teksCerita(ep, k, bahasa, { nama });
  const r = bacaRekaman();
  const daftar = daftarKasusHub(r);
  const stempel = daftar.filter((k) => k.stempel).length;
  const status = daftar.length > 0 && stempel >= daftar.length ? 'selesai' : stempel > 0 || daftar.some((k) => k.status === 'jalan') ? 'lanjut' : 'baru';
  const ekspresi: Ekspresi = status === 'selesai' ? 'lega' : 'cemas';
  const idJudul = 'cer-ep-investigator';
  const ketJenis = ep.jenis ? t(`cerita.jenisKet.${ep.jenis}`) : '';
  return (
    <li className="cer-ep" data-status={status} data-kartu-investigator="">
      <span className="cer-ep-wajah" aria-hidden="true">
        <span data-wajah-investigator="" style={{ display: 'block', width: 92, height: 92, imageRendering: 'pixelated', backgroundImage: `url(${potretInvestigator})`, backgroundSize: '768px 128px', backgroundPosition: '-662px -14px', backgroundRepeat: 'no-repeat' }} />
      </span>
      {ep.latar ? <SampulLatar ep={ep} ekspresi={ekspresi} tx={tx} /> : null}
      <div className="cer-ep-isi">
        <div className="cer-ep-teks">
          {ep.jenis ? <span className="cer-ep-jenis" data-jenis={ep.jenis} title={ketJenis} aria-description={ketJenis}>{t(`cerita.jenis.${ep.jenis}`)}</span> : null}
          <span className="cer-ep-jenis cer-ep-cepat" data-jenis="cepat">{t('cerita.durasi', { n: ep.durasiMenit })}</span>
          <p className="cer-ep-meta">
            <span>{t('hubInv.kartuMeta', { n: daftar.length })}</span>
            <span aria-hidden="true">·</span>
            <span>{t(`cerita.produk.${ep.produk}`)}</span>
            <span aria-hidden="true">·</span>
            <span>{t('cerita.durasi', { n: ep.durasiMenit })}</span>
          </p>
          <h2 id={idJudul}>{t('hubInv.nama')}</h2>
          <p className="cer-ep-ringkas">{t('hubInv.kartuRingkas')}</p>
          <p className="cer-ep-status" data-status={status}>
            <span className="cer-ep-status-ikon" aria-hidden="true"><Icon name={status === 'selesai' ? 'cek' : status === 'lanjut' ? 'jam' : 'bintang'} size={16} /></span>
            <span>{t('hubInv.kartuStempel', { n: stempel, total: daftar.length })}</span>
            {stempel > 0 ? <span className="cer-ep-akhir">{t('hubInv.total')} {totalSkor(r)} / {TOTAL_MAKS}</span> : null}
          </p>
        </div>
        <div className="cer-ep-aksi">
          <Link className="primary-action" to={RUTE_HUB} aria-describedby={idJudul}>{t('hubInv.kartuBuka')} <Arrow /></Link>
        </div>
      </div>
    </li>
  );
}

function teksStatus(s: StatusEpisode): string {
  switch (s.jenis) {
    case 'baru': return t('cerita.statusBaru');
    case 'lanjut': return t('cerita.statusLanjut', { n: s.nomor, total: s.jumlah });
    case 'selesai': return t('cerita.statusSelesai');
    default: return t('cerita.statusTidakCocok');
  }
}

/** Tepi (satuan dunia) di sekitar wilayah wajib kartu ruang piksel. */
const TEPI_WAJIB = 8;
/** Warna lantai baris terbawah latar ruang piksel (ruang-meja-latar.png), untuk potongan yang lebih tinggi dari dunia. */
const WARNA_LANTAI_PIKSEL = '#734829';

/**
 * Wilayah dunia yang wajib utuh di kartu RUANG PIKSEL: papan nama (tulisannya dipanggang di latar) sampai kepala Bu
 * Rina berdiri (titik akhir jalur masuk, sama dengan kartuRuang.ts), plus TEPI_WAJIB. null = ruang SVG / galat.
 */
function wilayahWajibPiksel(ekspresi: Ekspresi): { kiri: number; kanan: number; atas: number } | null {
  try {
    const r = ambilRuang('meja');
    if (!ruangPiksel(r)) return null;
    const ujung = r.tempat.jalurMasuk[r.tempat.jalurMasuk.length - 1];
    const titik = ujung?.titik ?? r.tempat.nasabahBerdiri;
    const skala = ujung?.skala ?? r.tempat.skalaNasabah;
    const gambar = gambarTokoh({ siapa: 'nasabah', pose: 'berdiri', ekspresi, pandang: 'pemain', kunci: true });
    const k = kotakKepala({ gambar, titik, skala });
    const papan = kotakPapan(r) ?? k;
    return {
      kiri: Math.min(papan.x, k.x) - TEPI_WAJIB,
      kanan: Math.max(papan.x + papan.w, k.x + k.w) + TEPI_WAJIB,
      atas: Math.min(papan.y, k.y) - TEPI_WAJIB,
    };
  } catch {
    return null;
  }
}

/**
 * Potongan kartu ruang piksel. Potongan kartuRuang.ts dipakai apa adanya bila wilayah wajib utuh di dalamnya. Bila
 * pembulatan skalanya memotong wilayah itu (kolom seni 280 px di desktop: lebar 680 -> 560 satuan, kepala Bu Rina di
 * luar), dipakai skala BULAT terbesar yang masih memuat wilayah wajib (k piksel perangkat per piksel seni, jadi satu
 * piksel seni tetap k piksel perangkat), pusat = pusat wilayah, sudut di kisi piksel seni, dijepit ke dunia
 * 1600 x 900; potongan yang lebih tinggi dari dunia dimulai dari atas.
 */
function potonganKartuPiksel(p: Kotak, W: number, H: number, dpr: number, wajib: { kiri: number; kanan: number; atas: number } | null): Kotak {
  if (!wajib || !(W > 0) || !(H > 0) || (p.x <= wajib.kiri && p.x + p.w >= wajib.kanan)) return p;
  const q = SATUAN_PIKSEL * (dpr > 0 && Number.isFinite(dpr) ? dpr : 1);
  const k = Math.max(1, Math.floor((W * q) / (wajib.kanan - wajib.kiri)));
  const w = (W * q) / k;
  const h = (H * q) / k;
  const langkah = SATUAN_PIKSEL / k;
  const bulat = (v: number) => Math.round(v / langkah) * langkah;
  let x = bulat((wajib.kiri + wajib.kanan) / 2 - w / 2);
  if (w <= 1600) x = Math.min(Math.max(x, 0), Math.floor((1600 - w) / langkah) * langkah);
  const y = h > 900 ? 0 : Math.min(Math.max(bulat(Math.min(p.y, wajib.atas)), 0), Math.floor((900 - h) / langkah) * langkah);
  return { x, y, w, h };
}

/**
 * Seni kartu episode berpanggung: potongan ruang layanan Raksa Silver Club (lapisan ruang panggung, PIKSEL bila ruang
 * raster tersedia) dengan Bu Rina piksel berdiri di samping kursi pengunjung (panggung/kartuRuang.ts). Satu SVG diam
 * (tanpa kamera/animasi); potongannya dipilih dari ukuran kotak seni (dibaca sebelum cat, lalu lewat ResizeObserver)
 * dan devicePixelRatio, jadi satu piksel seni = piksel perangkat bulat, dan papan nama + Bu Rina tetap utuh baik di
 * kartu HP yang lebar-pendek maupun kolom seni 280 px di desktop (potonganKartuPiksel). Ukuran & tata letak kartu tidak
 * berubah (CSS).
 */
function SeniRuangKartu({ nama, ekspresi }: { nama: string; ekspresi: Ekspresi }) {
  const akar = useRef<HTMLDivElement>(null);
  const dpr = useDpr();
  const awalan = `${idAman(useId())}k`;
  const [ukuran, setUkuran] = useState<{ w: number; h: number }>({ w: 358, h: 150 });
  useLayoutEffect(() => {
    const el = akar.current;
    if (!el) return;
    const baca = () => {
      const u = { w: el.clientWidth, h: el.clientHeight };
      if (u.w > 0 && u.h > 0) setUkuran((l) => (Math.abs(l.w - u.w) < 1 && Math.abs(l.h - u.h) < 1 ? l : u));
    };
    baca();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(baca);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const seni = useMemo(() => {
    try {
      const s = seniKartuRuang(ukuran.w, ukuran.h, nama, ekspresi, awalan, dpr);
      const potongan = potonganKartuPiksel(s.potongan, ukuran.w, ukuran.h, dpr, wilayahWajibPiksel(ekspresi));
      if (potongan === s.potongan) return s;
      // Potongan sendiri (lebih tinggi): kartuRuang.ts melewati lapisan di bawah potongannya sendiri (depan meja), jadi
      // isinya diambil ulang untuk kotak setinggi 4 x lebar (potongan kartuRuang-nya sampai dasar dunia = semua
      // lapisan). Bagian di bawah dunia (y > 900) diisi warna lantai, bukan dibiarkan kosong.
      const penuh = seniKartuRuang(ukuran.w, ukuran.w * 4, nama, ekspresi, awalan, dpr);
      const bawah = potongan.y + potongan.h;
      const lantai = bawah > 900 ? `<rect x="0" y="900" width="1600" height="${Math.ceil(bawah - 900)}" fill="${WARNA_LANTAI_PIKSEL}"/>` : '';
      return { svg: penuh.svg + lantai, potongan };
    } catch {
      return null; // seni gagal: kotak latar polos (kartu & tombolnya tetap ada)
    }
  }, [ukuran.w, ukuran.h, nama, ekspresi, awalan, dpr]);
  const p = seni?.potongan;
  return (
    <div ref={akar} className="cer-ep-seni cer-ep-ruang" aria-hidden="true">
      {seni && p ? (
        <svg
          viewBox={`${p.x} ${p.y} ${p.w} ${p.h}`}
          preserveAspectRatio="xMidYMin slice"
          focusable="false"
          dangerouslySetInnerHTML={{ __html: seni.svg }}
        />
      ) : null}
    </div>
  );
}

/** Sampul kartu episode berpanggung latar: lokasi & tokoh `latar.sampul` (gambar diam, tanpa label suasana). */
function SampulLatar({ ep, ekspresi, tx }: { ep: Episode; ekspresi: Ekspresi; tx: (k: string) => string }) {
  const s = ep.latar!.sampul;
  const komposisi = {
    lokasi: s.lokasi,
    hadir: s.hadir.map((id) => ({ id, ekspresi: id === ep.nasabah ? ekspresi : s.ekspresi ?? 'netral', bicara: false })),
    telepon: null,
    objek: [],
  };
  const nama = (id: string) => (ep.pemeran[id] ? tx(ep.pemeran[id]!.nama) : id);
  return (
    <div className="cer-ep-seni cer-ep-latar" aria-hidden="true">
      <PanggungLatar ep={ep} komposisi={komposisi} tx={tx} nama={nama} suasana={null} isi="penuh" />
    </div>
  );
}

/** Ikon gembok piksel 16 px (persegi utuh, tanpa penghalusan). */
function GembokPiksel() {
  return (
    <svg className="cer-segera-ikon" width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path fill="#5F5F5F" d="M5 2h6v1H5zM4 3h1v4H4zM11 3h1v4h-1zM2 7h12v8H2z" />
      <path fill="#F9EEEA" d="M7 9h2v2H7zM7.5 11h1v2h-1z" />
    </svg>
  );
}

/**
 * T-037 (pemilik 07:10): baris TERKUNCI Episode 2 di antara kasus nyata dan demo. Bukan tombol main: kontrol nonaktif
 * (aria-disabled, bisa difokus); ketuk / Enter / Spasi = catatan "Segera hadir" 2 detik di barisnya. Tanpa data cerita, tanpa rute.
 */
function BarisSegera() {
  const [catat, setCatat] = useState(false);
  const waktu = useRef<number | null>(null);
  useEffect(() => () => { if (waktu.current) window.clearTimeout(waktu.current); }, []);
  const tunjuk = () => {
    setCatat(true);
    if (waktu.current) window.clearTimeout(waktu.current);
    waktu.current = window.setTimeout(() => setCatat(false), 2000);
  };
  return (
    <li className="cer-segera">
      <div
        className="cer-segera-baris"
        role="button"
        tabIndex={0}
        aria-disabled="true"
        aria-label={t('cerita.pemilih.terkunciAria')}
        data-terkunci=""
        onClick={tunjuk}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tunjuk(); } }}
      >
        <GembokPiksel />
        <span className="cer-segera-teks">
          <b>{t('cerita.episodeKe', { n: 2 })} · {t('cerita.pemilih.segera')}</b>
          <small>{t('cerita.pemilih.segeraTeks')}</small>
        </span>
        <span className="cer-segera-catatan" role="status" aria-live="polite">{catat ? t('cerita.pemilih.segeraCatatan') : ''}</span>
      </div>
    </li>
  );
}

function KartuEpisode({ ep, bahasa, nama, onMainLagi }: { ep: Episode; bahasa: Bahasa; nama: string; onMainLagi: () => void }) {
  const tx = (k: string) => teksCerita(ep, k, bahasa, { nama });
  const status = statusEpisode(ep, muatProgres(ep));
  const akhir = akhirDitemukan(ep.id).filter((a) => Object.prototype.hasOwnProperty.call(ep.akhir, a));
  const total = Object.keys(ep.akhir).length;
  const ke = '/cerita/' + ep.id;
  const idJudul = 'cer-ep-' + ep.id;
  const latar = ep.node[ep.mulai]?.latar ?? 'kantor';
  const ekspresi: Ekspresi = status.jenis === 'selesai' ? 'lega' : 'cemas';
  // T-026: tag jenis (owner: "Episode 1 is only DEMO, Episode 2 is Real Case, so users can choose"). Lencana di pojok
  // kanan-atas gambar kartu di semua ukuran (keputusan Lead: di baris meta chip tidak muat pada HP dalam id / en, dan turun
  // baris menambah tinggi kartu; letaknya diatur cerita.css). Anak PERTAMA kartu, di luar kotak gambar yang aria-hidden:
  // dibaca sebelum meta dan judul. Keterangan = tooltip (title) + deskripsi aksesibel yang sama; episode tanpa `jenis` =
  // tanpa tag.
  const ketJenis = ep.jenis ? t(`cerita.jenisKet.${ep.jenis}`) : '';
  return (
    <li className="cer-ep" data-status={status.jenis}>
      {/* T-037: thumbnail = WAJAH tokoh (atlas potret piksel, aturan skala piksel bulat), di HP; sampul lama di >= 600 px. */}
      <span className="cer-ep-wajah" aria-hidden="true">
        {ep.investigasi ? (
          // T-084: kartu Episode 1 Investigator = Miss Raksa investigator dengan kaca pembesar (sel 'miss-detektif', 2x, dipotong ke wajah)
          <span data-wajah-investigator="" style={{ display: 'block', width: 92, height: 92, imageRendering: 'pixelated', backgroundImage: `url(${potretInvestigator})`, backgroundSize: '768px 128px', backgroundPosition: '-662px -14px', backgroundRepeat: 'no-repeat' }} />
        ) : <PotretPikselHp tokoh={ep.jenis === 'demo' ? 'buRina' : 'hendra'} ekspresi={ekspresi} ukuran={88} label="" />}
      </span>
      {ep.panggung ? (
        <SeniRuangKartu nama={ep.panggung.lokasi.nama} ekspresi={ekspresi} />
      ) : ep.latar ? (
        <SampulLatar ep={ep} ekspresi={ekspresi} tx={tx} />
      ) : (
        <div className="cer-ep-seni" aria-hidden="true">
          <LatarPanggung latar={latar} />
          <div className="cer-ep-tokoh"><TokohNasabah ekspresi={ekspresi} /></div>
        </div>
      )}
      <div className="cer-ep-isi">
        <div className="cer-ep-teks">
          {/* T-037 Fix 1 (D-341): chip jenis di BARIS SENDIRI di atas baris meta (meta tidak lagi terpotong di HP). */}
          {ep.jenis ? <span className="cer-ep-jenis" data-jenis={ep.jenis} title={ketJenis} aria-description={ketJenis}>{t(`cerita.jenis.${ep.jenis}`)}</span> : null}
          {/* T-064: Episode 1 Dev = "5 menit" chip next to the type chip. */}
          {ep.tampilan?.akhirKenalan || ep.investigasi ? <span className="cer-ep-jenis cer-ep-cepat" data-jenis="cepat">{t('cerita.durasi', { n: ep.durasiMenit })}</span> : null}
        <p className="cer-ep-meta">
          {/* Kasus nyata = Episode 1; demo tanpa nomor. */}
          <span>{ep.jenis === 'demo' ? t('cerita.labelDemo') : ep.tampilan?.akhirKenalan ? tx('dev.label') : ep.investigasi ? tx('inv.label') : t('cerita.episodeKe', { n: 1 })}</span>
          <span aria-hidden="true">·</span>
          <span>{t(`cerita.produk.${ep.produk}`)}</span>
          <span aria-hidden="true">·</span>
          <span>{t('cerita.durasi', { n: ep.durasiMenit })}</span>
        </p>
        <h2 id={idJudul}>{tx(ep.judul)}</h2>
        <p className="cer-ep-ringkas">{tx(ep.ringkas)}</p>
        <p className="cer-ep-status" data-status={status.jenis}>
          <span className="cer-ep-status-ikon" aria-hidden="true">
            <Icon name={status.jenis === 'selesai' ? 'cek' : status.jenis === 'lanjut' ? 'jam' : status.jenis === 'tidakCocok' ? 'tanya' : 'bintang'} size={16} />
          </span>
          <span>{teksStatus(status)}</span>
          {akhir.length ? <span className="cer-ep-akhir">{t('cerita.akhirDitemukan', { n: akhir.length, total })}</span> : null}
        </p>
        </div>
        <div className="cer-ep-aksi">
          {status.jenis === 'baru' ? (
            <Link className="primary-action" to={ke}>{t('cerita.tombolMulai')} <Arrow /></Link>
          ) : status.jenis === 'selesai' ? (
            <>
              <button type="button" className="primary-action" onClick={onMainLagi} aria-describedby={idJudul + '-ket'}>{t('cerita.tombolMainLagi')} <Arrow /></button>
              <Link className="cer-tombol-garis" to={ke}>{t('cerita.tombolRingkasan')}</Link>
              <p id={idJudul + '-ket'} className="cer-ep-ket">{t('cerita.mainLagiKet')}</p>
            </>
          ) : (
            <Link className="primary-action" to={ke}>{t('cerita.tombolLanjutkan')} <Arrow /></Link>
          )}
        </div>
      </div>
    </li>
  );
}
