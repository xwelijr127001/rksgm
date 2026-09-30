/**
 * PANGGUNG CERITA v3 (docs/cerita/ADEGAN-AUTO1.md bagian 2 & 4): satu dunia 1600 x 900 berlapis (ruang layanan Raksa
 * Silver Club, pintu, Miss Raksa di sisi petugas, Bu Rina di sisi pengunjung, prop) yang ditampilkan lewat KAMERA
 * (transform CSS) sesuai kotak panggung: bingkai lebar (desktop) atau dua tokoh dirapatkan (HP).
 *
 * Presentasi, bukan gameplay:
 *  - Komposisi datang dari `adeganKini(ep, state)` (murni). Panggung tidak menulis state cerita, tidak memanggil
 *    kirim(), tidak memajukan dialog; selesai animasi hanya membersihkan tampilan.
 *  - DOM selalu berisi komposisi AKHIR; gerak (pembuka, masuk, pergi, kartu, pindah, ganti kecil) = aktor sementara
 *    + Web Animations di atasnya (panggung/rencana.ts), dijalankan `Sutradara` dengan token generasi.
 *  - Aksi sekali jalan diputar hanya saat `aksi.kunci` BERUBAH di sesi halaman ini (`sesi`, milik halaman, bertahan
 *    saat panggung dipasang ulang sesudah aktivitas). Pasang/muat ulang, ganti bahasa, resize, Bantuan/Riwayat, dan
 *    kembali ke tab = komposisi akhir tanpa memutar ulang. Pembuka: sekali per tab untuk episode baru.
 *  - "Lewati pembuka" (tombol HTML) & `selesaikan()` (dipanggil halaman sebelum semantik Lanjut) = lompat ke
 *    komposisi akhir. Tab tersembunyi / resize / dialog terbuka juga menyelesaikan gerak, KECUALI perubahan tinggi
 *    kecil saja (< 15 %, mis. bilah alamat HP yang muncul/hilang saat tinggi panggung dibatasi dvh): rencana yang
 *    sama dihitung ulang untuk ukuran baru dan dilanjutkan dari posisinya (kamera dipaskan ulang, gerak tidak selesai).
 *  - Gerak dikurangi / mode ringan (?adegan=ringan|penuh, disimpan di localStorage raksa:adegan seperti GameStage):
 *    komposisi akhir langsung, tanpa kedip/napas/mulut.
 *  - Respons input <= 200 md: gambar tokoh untuk komposisi BERIKUTNYA (dan rencana geraknya) dipanaskan saat idle
 *    (panggung/panas.ts, satu gambar per giliran); ukuran kotak dibaca dari ResizeObserver (ref), bukan dari layout
 *    di bingkai ketukan.
 *  - SENI PIKSEL (panggung/piksel.ts, sumberPiksel.ts): ruang raster dari seni/piksel/ruang.json bila ada (selain itu
 *    ruang SVG). Kamera DIAM dipaskan ke piksel bulat (px CSS/satuan x 4 x devicePixelRatio = k bulat; dihitung
 *    ulang saat ukuran atau devicePixelRatio/zoom berubah); selama animasi boleh pecahan. PNG didekode dulu: dialog
 *    tidak menunggu, dunia raster = warna ruang polos sampai siap lalu muncul sekali; gambar gagal = ruang SVG.
 *  - Hiasan: dunia aria-hidden; semua informasi ada di teks dialog. Label suasana ("Bu Rina · Cemas") tetap teks
 *    (terlihat + pembaca layar) dan mengikuti wajah yang tampil. Galat apa pun di panggung = kotak latar polos
 *    (BatasPanggung), cerita tetap jalan.
 */
import {
  Component, memo, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore,
  type CSSProperties, type ReactNode, type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '../../hooks';
import { t } from '../../i18n';
import { atlasGagal, gambarBuRina, KANVAS_DUDUK, tokohPiksel } from '../seni/tokoh';
import { buRinaSementara } from '../seni/tokoh/sementara';
import { svgPotret, teleponSisipan } from '../seni/piksel';
import type { Ekspresi, Episode } from '../tipe';
import type { KomposisiAdegan } from './adeganTipe';
import { tahanUlang } from './bagian';
import { JALUR_DEPAN_MULAI } from '../seni/ruang';
import { BILAH, PAPAN, PINTU, SEKAT, TEKS_PAPAN } from '../seni/ruang/geometri';
import { awalanId, cariTokoh, DUNIA_H, DUNIA_W, idAman, kotakPenting, susunAdegan, type Kotak, type SusunanAdegan } from './panggung/dunia';
import {
  LapisanRuang, PejalanDunia, PropDunia, SalinanAdegan, TokohDunia,
} from './panggung/UnsurDunia';
import {
  ambilRuang, ambilRuangSvg, aturanPotretSisipan, bisaDudukTurun, bisaDudukTurunMentor, bisaHadapKanan, gambarSementara, gambarTokoh, TOKOH_PIKSEL,
} from './panggung/sumber';
import { jenisBingkai, keLayar, pecahanPiksel, pikselPerSeni, qPiksel, transformKamera, type Kamera } from './panggung/kamera';
import { kotakPapan, pikselDari, ruangPiksel, susunanPiksel, teksPapanPiksel, urlSusunan } from './panggung/piksel';
import { langgananPiksel, muatGambar, statusGambar, urlPropPiksel, versiPiksel } from './panggung/sumberPiksel';
import { modeRingan, simpanModeAdegan } from './panggung/mode';
import { jalankanSaatIdle, kunciOpsi, opsiPanas } from './panggung/panas';
import { IKON_TELEPON } from './panggung/prop';
import type { Rencana } from './panggung/rencana';
import { GerakKecil, Sutradara } from './panggung/sutradara';
import { buatPembuka, kameraDiam, pabrikTransisi } from './panggung/transisi';

/** Kendali panggung untuk halaman (ref). */
export interface KendaliPanggung {
  /** Selesaikan gerak yang sedang berjalan ke komposisi akhir. true bila ada yang berjalan. */
  selesaikan(): boolean;
}

/**
 * Ingatan presentasi milik HALAMAN (bukan state cerita, tidak disimpan): kunci aksi terakhir yang sudah dilihat
 * (undefined = panggung belum pernah dipasang di halaman ini) dan apakah pembuka sudah ditangani.
 */
export interface SesiPanggung {
  aksi: string | null | undefined;
  pembuka: boolean;
}

export function buatSesiPanggung(): SesiPanggung {
  return { aksi: undefined, pembuka: false };
}

/** Pembuka sudah diputar di tab ini untuk episode ini (sessionStorage; gagal = ingatan modul). */
const pembukaMemori = new Set<string>();
function pembukaSudah(ep: string): boolean {
  try { if (window.sessionStorage.getItem(`raksa:cerita:pembuka:${ep}`)) return true; } catch { /* abaikan */ }
  return pembukaMemori.has(ep);
}
function tandaiPembuka(ep: string): void {
  pembukaMemori.add(ep);
  try { window.sessionStorage.setItem(`raksa:cerita:pembuka:${ep}`, '1'); } catch { /* abaikan */ }
}

/**
 * Menyimpan pilihan mode adegan dari alamat (?adegan=ringan|penuh -> localStorage raksa:adegan). Modul kecil
 * panggung/mode.ts, dipanggil halaman episode dan halaman daftar (/cerita) SEBELUM pengalihan ke /kenalan.
 */
export { simpanModeAdegan };

/** Indeks jalur masuk mulai lapisan pengunjung (seni ruang), bila ruang menyediakannya. */
const DEPAN_MULAI: number | undefined = typeof JALUR_DEPAN_MULAI === 'number' ? JALUR_DEPAN_MULAI : undefined;

/** Tanda komposisi yang mempengaruhi gambar (tanpa pembicara): memo susunan dunia. */
function tandaKomposisi(k: KomposisiAdegan): string {
  return JSON.stringify([k.lokasi, k.mentor, k.nasabah, k.prop]);
}

interface Transisi {
  gen: number;
  rencana: Rencana;
  /** Menghitung ulang rencana yang SAMA untuk ukuran kotak lain (kamera dipaskan ulang); null = tidak bisa. */
  buat: ((w: number, h: number) => Rencana | null) | null;
  /** Ukuran kotak (px) & lebar jendela saat rencana dihitung. */
  w: number;
  h: number;
  lebarJendela: number;
  /** Mulai dari posisi ini (md): lanjutan sesudah dipaskan ulang. */
  dari: number;
  /** Tahan di keadaan awal sampai bingkai mengalir (Sutradara `tunggu`): awal gerak tidak hilang di bingkai yang tertahan. */
  tunggu: boolean;
}

/**
 * Rencana yang ditahan di keadaan awalnya sampai bingkai benar-benar mengalir (panggung/sutradara.ts). Pembuka:
 * dipasang bersama seluruh dunia panggung, jadi bingkai pertamanya bisa tertahan lama di GPU (masuk dari /cerita).
 */
const TAHAN_SAMPAI_LANCAR: ReadonlySet<Rencana['jenis']> = new Set(['pembuka']);

/**
 * Jendela berubah TINGGI saja dan kotak panggung berubah kurang dari pecahan ini = kamera dipaskan ulang tanpa
 * menyelesaikan gerak. (Di HP pendek panggung dibatasi 38dvh dengan rasio 4:3, jadi lebar kotaknya ikut mengecil
 * sedikit; yang menentukan "tinggi saja" adalah lebar JENDELA.)
 */
const UBAH_KECIL = 0.15;
const lebarJendela = () => (typeof window === 'undefined' ? 0 : window.innerWidth);

export interface PropsPanggung {
  ep: Episode;
  komposisi: KomposisiAdegan;
  /** Kalimat baris kini sedang diketik (mulut pembicara bergerak). */
  mengetik: boolean;
  namaMentor: string;
  namaNasabah: string;
  /** Kata perasaan untuk wajah nasabah yang tampil (labelPerasaan), bahasa aktif. */
  suasana: string;
  sesi: SesiPanggung;
  kendali?: RefObject<KendaliPanggung | null>;
  /**
   * Komposisi yang bisa tampil sesudah aksi pemain berikutnya (pratinjau murni dari halaman: panas.ts
   * komposisiBerikut). Dipanggil saat idle untuk memanaskan cache seni; tanpa nilai = tanpa pemanasan.
   */
  berikut?: () => KomposisiAdegan[];
  /**
   * Tempat tombol "Lewati pembuka" di LUAR gambar (v5.1): sel kiri baris kaki kotak dialog (KotakDialog `slotLewati`),
   * jadi tombol tidak pernah menutupi wajah, tangan, pintu, atau jalur Bu Rina. Tanpa tempat (kotak dialog tanpa baris
   * kaki) = cadangan lama di pojok kanan-bawah panggung.
   */
  slotLewati?: HTMLElement | null;
  /** Dipanggil saat "Lewati pembuka" diaktifkan (halaman menelan ketukan kotak dialog sesaat sesudahnya). */
  onLewati?: () => void;
}

export const Panggung = memo(function Panggung(p: PropsPanggung) {
  return (
    <BatasPanggung kunci={tandaKomposisi(p.komposisi)}>
      <IsiPanggung {...p} />
    </BatasPanggung>
  );
});

function IsiPanggung({ ep, komposisi, mengetik, namaMentor, namaNasabah, suasana, sesi, kendali, berikut, slotLewati, onLewati }: PropsPanggung) {
  const reduced = useReducedMotion();
  const [ringan] = useState(modeRingan);
  const bergerak = !reduced && !ringan;
  const uid = idAman(useId());
  const akar = useRef<HTMLDivElement>(null);
  const sutradara = useMemo(() => new Sutradara(), []);
  const kecil = useMemo(() => new GerakKecil(), []);

  // ---- ukuran kotak panggung (px). Dibaca SEKALI saat dipasang, selanjutnya hanya dari ResizeObserver (sesudah
  // layout). ukuranRef = nilai terakhir itu, dipakai layout effect transisi supaya ketukan yang mengganti komposisi
  // tidak memaksa layout sinkron atas DOM panggung yang baru berubah (± 28 md di HP lambat).
  const [ukuran, setUkuran] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const ukuranRef = useRef({ w: 0, h: 0, jendela: 0 });
  // devicePixelRatio (zoom peramban / layar lain): kamera piksel bulat dihitung ulang. Dibaca saat dipasang, saat
  // ukuran kotak berubah (zoom mengubah px CSS), dan lewat media query resolusi (DPR berubah tanpa ubah ukuran CSS).
  const [dpr, setDpr] = useState(dprKini);
  const dprRef = useRef(dpr);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    let mq: MediaQueryList | null = null;
    const pasang = () => {
      mq?.removeEventListener?.('change', pasang);
      const d = dprKini();
      dprRef.current = d;
      setDpr(d);
      try {
        mq = window.matchMedia(`(resolution: ${d}dppx)`);
        mq.addEventListener?.('change', pasang);
      } catch { mq = null; }
    };
    pasang();
    return () => { mq?.removeEventListener?.('change', pasang); };
  }, []);
  useLayoutEffect(() => {
    const el = akar.current;
    if (!el) return;
    const baca = () => {
      const u = { w: el.clientWidth, h: el.clientHeight };
      ukuranRef.current = { ...u, jendela: lebarJendela() };
      setUkuran((lama) => (Math.abs(lama.w - u.w) < 1 && Math.abs(lama.h - u.h) < 1 ? lama : u));
      const d = dprKini();
      if (d !== dprRef.current) { dprRef.current = d; setDpr(d); }
    };
    baca();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', baca);
      return () => window.removeEventListener('resize', baca);
    }
    const ro = new ResizeObserver(baca);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = ukuran.w;
  const H = ukuran.h;

  // ---- susunan dunia komposisi kini
  const tanda = tandaKomposisi(komposisi);
  const lokasi = komposisi.lokasi;
  // Seni piksel: status manifest/gambar berubah (siap / gagal -> ruang SVG) = ruang dipilih ulang.
  const versiSeni = useSyncExternalStore(langgananPiksel, versiPiksel, versiPiksel);
  const namaLokasi = ep.panggung?.lokasi.nama ?? '';
  // Tulisan papan yang dipanggang di ruang raster BERBEDA dengan nama konfigurasi = ruang SVG (teks panggung, ejaan
  // terkontrol).
  const ruang = useMemo(() => {
    const r = ambilRuang(lokasi);
    const baked = teksPapanPiksel(r);
    return baked && namaLokasi && baked !== namaLokasi ? ambilRuangSvg(lokasi) : r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lokasi, versiSeni, namaLokasi]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // versiSeni: atlas tokoh yang GAGAL didekode = gambar tokoh SVG (seni/tokoh), jadi dunia disusun ulang.
  const susunan = useMemo(() => susunAdegan(komposisi, ruang, gambarTokoh), [tanda, ruang, versiSeni]);
  // Mode piksel (ruang ATAU tokoh raster): kamera diam dipaskan ke piksel bulat untuk DPR kini.
  const pikselRuang = ruangPiksel(ruang);
  const piksel = susunanPiksel(susunan);
  const dprKamera = piksel ? dpr : null;
  const dprKameraRef = useRef(dprKamera);
  dprKameraRef.current = dprKamera;
  // Pecahan piksel perangkat asal kotak panggung di halaman (mis. tepi 1 px CSS = 1,5 px perangkat pada dpr 1,5):
  // diukur SESUDAH cat (efek di bawah, tanpa memaksa tata letak di bingkai ketukan); berubah = satu render ulang.
  const [asal, setAsal] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const asalRef = useRef(asal);
  asalRef.current = asal;
  // Kamera diam: aksi dari komposisi KINI (susunan dimemo tanpa aksi). Baris kepergian HP = bingkai kepergian (v5.1).
  const kamera = W > 0 ? kameraDiam(susunan, W, H, komposisi.aksi, gambarTokoh, { dpr: dprKamera, asal }) : null;
  const kPiksel = kamera && dprKamera ? pikselPerSeni(kamera, qPiksel(dprKamera)) : null;
  // PNG susunan kini (ruang + tokoh raster) didekode dulu; dialog tidak menunggu.
  const gambarDunia = useGambarSiap(pikselRuang ? urlSusunan(susunan, urlPropPiksel()) : urlSusunan(susunan));
  const sempatMemuat = useRef(false);
  if (gambarDunia === 'memuat') sempatMemuat.current = true;

  // ---- transisi: diputuskan saat komposisi berganti (sebelum cat layar, jadi tanpa kilatan komposisi akhir)
  const [trans, setTrans] = useState<Transisi | null>(null);
  const genRef = useRef(0);
  const lalu = useRef<SusunanAdegan | null>(null);
  const aksiLalu = useRef<KomposisiAdegan['aksi']>(null);
  const aksiKunci = komposisi.aksi?.kunci ?? null;

  useLayoutEffect(() => {
    const sebelumnya = lalu.current;
    lalu.current = susunan;
    const aksiSebelumnya = aksiLalu.current;
    aksiLalu.current = komposisi.aksi;
    // Gambar berganti: kedip yang sedang berjalan (salinan kedip = pose/wajah LAMA, salinan dasar disembunyikan)
    // dibatalkan sebelum layar dicat. Salinan basi juga tidak pernah terlihat lewat CSS ([data-basi]).
    if (sebelumnya !== null && sebelumnya !== susunan) kecil.batalKedip();
    // Ukuran terakhir dari ResizeObserver (pemasangan pertama: dibaca efek ukuran di atas, pada commit yang sama).
    const u = ukuranRef.current;
    const boleh = bergerak && u.w > 0 && u.h > 0 && !document.hidden;
    const aksiBaru = aksiKunci !== null && sesi.aksi !== undefined && aksiKunci !== sesi.aksi;
    let buat: ((w: number, h: number) => Rencana | null) | null = null;
    if (boleh) {
      if (sebelumnya === null && komposisi.pembuka && !sesi.pembuka && !pembukaSudah(ep.id)) {
        tandaiPembuka(ep.id);
        const eksterior = ep.panggung?.eksterior ?? null;
        buat = (w, h) => buatPembuka(susunan, w, h, eksterior, gambarTokoh);
      } else {
        // `aksi` dari komposisi KINI: susunan dimemo pada tanda gambar (tanpa aksi), jadi baris beraksi yang gambarnya
        // sama dengan baris sebelumnya membawa susunan lama (aksi lama/null).
        buat = pabrikTransisi({
          lama: sebelumnya, baru: susunan, aksi: komposisi.aksi, aksiLama: aksiSebelumnya, aksiBaru, depanMulai: DEPAN_MULAI, hadapKanan: bisaHadapKanan,
          dudukTurun: bisaDudukTurun, dudukTurunMentor: bisaDudukTurunMentor, gambar: gambarTokoh, dpr: dprKameraRef.current, asal: asalRef.current,
        });
      }
    }
    const rencana = buat ? buat(u.w, u.h) : null;
    if (komposisi.pembuka) sesi.pembuka = true;
    sesi.aksi = aksiKunci;
    if (rencana && (rencana.gerak.length || rencana.aktor.length)) {
      setTrans({ gen: ++genRef.current, rencana, buat, w: u.w, h: u.h, lebarJendela: u.jendela, dari: 0, tunggu: TAHAN_SAMPAI_LANCAR.has(rencana.jenis) });
    } else if (sebelumnya !== null && sebelumnya.tanda !== susunan.tanda) {
      // Tanpa gerak (dikurangi / tab tersembunyi): gerak lama tidak boleh menutupi komposisi baru.
      sutradara.selesaikan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [susunan, aksiKunci]);

  // Jalankan rencana begitu aktornya terpasang (masih sebelum cat layar).
  useLayoutEffect(() => {
    if (!trans) return;
    const el = akar.current;
    if (!el) return;
    const gen = trans.gen;
    const cari = (target: string) => Array.from(el.querySelectorAll(`[data-aktor="${target}"]`));
    sutradara.mainkan(trans.rencana, cari, () => setTrans((x) => (x && x.gen === gen ? null : x)), trans.dari, { tunggu: trans.tunggu && trans.dari === 0 });
    return () => sutradara.hentikan();
  }, [trans, sutradara]);

  // Kotak berubah ukuran saat bergerak: lebar berubah / orientasi / tinggi berubah banyak = gerak diselesaikan
  // (kamera akhir dihitung ulang). Tinggi saja yang berubah sedikit (bilah alamat HP) = rencana yang sama dihitung
  // ulang untuk ukuran baru dan dilanjutkan dari posisinya, tanpa menyelesaikan atau memutar ulang.
  const ukuranLalu = useRef(ukuran);
  useEffect(() => {
    const a = ukuranLalu.current;
    ukuranLalu.current = ukuran;
    // Ukuran pertama (0 -> terukur) bukan resize: pembuka yang baru mulai tidak boleh ikut selesai.
    if (!(a.w > 0 && a.h > 0) || (Math.abs(a.w - ukuran.w) <= 2 && Math.abs(a.h - ukuran.h) <= 2)) return;
    const tr = trans;
    const t = tr && sutradara.aktif === tr.rencana ? sutradara.waktu : null;
    const tinggiSaja = !!tr && Math.abs(ukuranRef.current.jendela - tr.lebarJendela) <= 2 && jenisBingkai(ukuran.w) === jenisBingkai(tr.w)
      && Math.abs(ukuran.h - tr.h) < tr.h * UBAH_KECIL && Math.abs(ukuran.w - tr.w) < tr.w * UBAH_KECIL;
    if (tr && tr.buat && t !== null && tinggiSaja) {
      const baru = tr.buat(ukuran.w, ukuran.h);
      if (baru && t < baru.durasi) {
        setTrans({ ...tr, rencana: baru, dari: t });
        return;
      }
    }
    sutradara.selesaikan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ukuran, sutradara]);
  useEffect(() => {
    if (!bergerak) sutradara.selesaikan();
  }, [bergerak, sutradara]);
  // Asal kotak panggung dalam piksel perangkat (koordinat dokumen: gulir halaman tidak mengubahnya). Hanya mode piksel.
  useEffect(() => {
    const el = akar.current;
    if (!piksel || !el) return;
    const r = el.getBoundingClientRect();
    const d = dprRef.current;
    const a = {
      x: pecahanPiksel((r.left + el.clientLeft + window.scrollX) * d),
      y: pecahanPiksel((r.top + el.clientTop + window.scrollY) * d),
    };
    if (Math.abs(a.x - asalRef.current.x) > 1e-3 || Math.abs(a.y - asalRef.current.y) > 1e-3) setAsal(a);
  });
  const dprLalu = useRef(dpr);
  useEffect(() => {
    if (dprLalu.current === dpr) return;
    dprLalu.current = dpr;
    sutradara.selesaikan();
  }, [dpr, sutradara]);

  // Tab tersembunyi: selesaikan aksi, jeda gerak kecil; kembali: lanjutkan gerak kecil saja (tanpa memutar ulang).
  useEffect(() => {
    const f = () => {
      if (document.hidden) { sutradara.selesaikan(); kecil.jeda(); } else kecil.lanjutkan();
    };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, [sutradara, kecil]);

  // Bersihkan semuanya saat panggung dilepas (ganti tampilan / halaman).
  useEffect(() => () => { sutradara.hentikan(); kecil.henti(); kecil.bicara(null, null); }, [sutradara, kecil]);

  useImperativeHandle(kendali, () => ({ selesaikan: () => sutradara.selesaikan() }), [sutradara]);

  // ---- gerak kecil: napas & kedip (tidak saat gerak dikurangi); dimulai ulang bila susunan tokoh berganti
  // Kunci = siapa + jenis gambar: tokoh yang berganti SVG <-> raster (mis. PNG gagal) memasang ulang salinannya, jadi
  // napas/kedip dimulai ulang dengan elemen baru (dan tanpa napas untuk raster).
  const daftarTokoh = susunan.tokoh.map((l) => `${l.siapa}:${pikselDari(l.gambar) ? 'piksel' : 'svg'}`).join(',');
  useEffect(() => {
    const el = akar.current;
    if (!bergerak || !el || !daftarTokoh) return;
    const tokoh = daftarTokoh.split(',').map((x) => x.split(':')[0]!).map((siapa) => {
      const akarTokoh = el.querySelector(`[data-aktor="tokoh:${siapa}"]`);
      return {
        kunci: siapa,
        napas: akarTokoh?.querySelector('.cer-pg-napas:not([data-piksel])') ?? null,
        dasar: akarTokoh?.querySelector('[data-varian="dasar"]') ?? null,
        kedip: akarTokoh?.querySelector('[data-varian="kedip"]') ?? null,
      };
    });
    kecil.mulai(tokoh);
    if (document.hidden) kecil.jeda();
    return () => kecil.henti();
  }, [bergerak, daftarTokoh, kecil]);

  // ---- pembicara: sorotan halus; mulut bergantian selama kalimat diketik
  const pembicara = komposisi.pembicara === 'mentor' || komposisi.pembicara === 'nasabah' ? komposisi.pembicara : null;
  const pembicaraDiRuang = pembicara ? cariTokoh(susunan, pembicara) : undefined;
  const mulut = bergerak && mengetik && pembicaraDiRuang ? pembicara : null;
  const tandaMulut = mulut ? `${mulut}|${pembicaraDiRuang!.tanda}|${pikselDari(pembicaraDiRuang!.gambar) ? 'piksel' : 'svg'}` : '';
  // Efek tata letak (sebelum cat): pembicara lama yang salinan 'bicara'-nya baru dilepas tidak boleh tertinggal satu
  // bingkai dengan salinan dasar yang disembunyikan animasi mulutnya.
  useLayoutEffect(() => {
    const el = akar.current;
    if (!mulut || !el) { kecil.bicara(null, null); return; }
    const t = el.querySelector(`[data-aktor="tokoh:${mulut}"]`);
    kecil.bicara(t?.querySelector('[data-varian="dasar"]') ?? null, t?.querySelector('[data-varian="bicara"]') ?? null);
    return () => kecil.bicara(null, null);
  }, [tandaMulut, mulut, kecil]);

  // ---- pemanas cache seni (panas.ts): selagi baris ini dibaca, gambar untuk komposisi sesudah ketukan/pilihan
  // berikutnya (pose akhir, pose rencana gerak, varian kedip/mulut, potret sisipan) dibuat saat idle, satu gambar
  // per giliran. Dimulai ulang setiap susunan berganti; dibatalkan saat dilepas. Gerak mati = pose akhir saja.
  const adaUkuran = W > 0 && H > 0;
  useEffect(() => {
    if (!berikut || !adaUkuran) return;
    const lama = susunan;
    function* langkah(): Generator<void> {
      const daftar = berikut!();
      yield;
      const sudah = new Set<string>();
      for (const k of daftar) {
        const { w, h } = ukuranRef.current;
        const opsi = opsiPanas(lama, k, w, h, {
          gerak: bergerak, depanMulai: DEPAN_MULAI, hadapKanan: bisaHadapKanan, dudukTurun: bisaDudukTurun, dudukTurunMentor: bisaDudukTurunMentor,
          sisipanKecil: aturanPotretSisipan(ukuranPotretSisipan()).kecil,
        });
        yield;
        for (const o of opsi) {
          const kunci = kunciOpsi(o);
          if (sudah.has(kunci)) continue;
          sudah.add(kunci);
          try { gambarTokoh(o); } catch { /* generator gagal: panggung memakai pengganti saat itu */ }
          yield;
        }
      }
    }
    return jalankanSaatIdle(langkah());
  }, [susunan, berikut, bergerak, adaUkuran]);

  // ---- tampilan
  const nasabahDiRuang = cariTokoh(susunan, 'nasabah');
  const lewatTelepon = komposisi.nasabah?.lewatTelepon ? komposisi.nasabah : null;
  const ukuranSisip = lewatTelepon ? ukuranPotretSisipan() : 0;
  const lewati = () => { onLewati?.(); sutradara.selesaikan(); };
  const aktor = trans?.rencana.aktor ?? [];

  return (
    <div
      ref={akar}
      className="cer-panggung"
      data-lokasi={lokasi}
      data-bingkai={W > 0 ? jenisBingkai(W) : undefined}
      data-gerak={trans ? trans.rencana.jenis : undefined}
      data-diam={bergerak ? undefined : ''}
      data-seni={pikselRuang ? 'piksel' : 'svg'}
      data-tokoh-seni={susunan.tokoh.length ? susunan.tokoh.map((l) => (pikselDari(l.gambar) ? 'piksel' : 'svg')).join(' ') : undefined}
      data-piksel={kPiksel ?? undefined}
      data-dpr={piksel ? dpr : undefined}
      data-asal={piksel ? `${asal.x},${asal.y}` : undefined}
    >
      <div
        className="cer-pg-dunia"
        data-aktor="kamera"
        data-memuat={gambarDunia === 'memuat' ? '' : undefined}
        data-muncul={gambarDunia === 'siap' && sempatMemuat.current ? '' : undefined}
        aria-hidden="true"
        style={{ transform: kamera ? transformKamera(kamera) : undefined, visibility: kamera ? undefined : 'hidden' }}
      >
        <LapisanRuang ruang={ruang} awalan={`${uid}r`} papan={namaLokasi} pintuAktor />
        {susunan.tokoh.map((l) => (
          <TokohDunia
            key={l.siapa}
            letak={l}
            awalan={`${uid}${l.siapa}`}
            aktor={`tokoh:${l.siapa}`}
            kedip={bergerak}
            bicara={mulut === l.siapa}
            sorot={pembicara === l.siapa}
            className={l.siapa === 'nasabah' ? 'cer-tokoh' : ''}
            ekspresiData={l.siapa === 'nasabah' ? l.opsi.ekspresi : undefined}
            nama={gambarSementara(l) ? (l.siapa === 'mentor' ? namaMentor : namaNasabah) : undefined}
          />
        ))}
        {susunan.prop.map((p) => <PropDunia key={p.id} prop={p} awalan={`${uid}p${p.id}`} aktor={`prop:${p.id}`} piksel={pikselRuang} />)}
        {aktor.map((a) => {
          const aw = `${uid}x${trans!.gen}${a.kunci}`;
          if (a.jenis === 'tokoh') return <TokohDunia key={`${trans!.gen}-${a.kunci}`} letak={a.letak} awalan={aw} aktor={`x:${a.kunci}`} sementara />;
          if (a.jenis === 'jalan') return <PejalanDunia key={`${trans!.gen}-${a.kunci}`} kunci={a.kunci} titik0={a.titik0} z={a.z} salinan={a.salinan} awalan={aw} />;
          if (a.jenis === 'prop') return <PropDunia key={`${trans!.gen}-${a.kunci}`} prop={a.prop} awalan={aw} aktor={`x:${a.kunci}`} sementara piksel={pikselRuang} />;
          return null;
        })}
      </div>

      {aktor.map((a) => {
        const aw = `${uid}x${trans!.gen}${a.kunci}`;
        if (a.jenis === 'adegan') {
          return (
            <div key={`${trans!.gen}-${a.kunci}`} className="cer-pg-lapis" data-aktor={`x:${a.kunci}`} aria-hidden="true">
              <div className="cer-pg-dunia" data-aktor={`x:${a.kunci}:kamera`} style={{ transform: transformKamera(a.kamera) }}>
                <SalinanAdegan susunan={a.susunan} awalan={aw} papan={namaLokasi} tanpaTokoh={a.tanpaTokoh} />
              </div>
            </div>
          );
        }
        if (a.jenis === 'eksterior') {
          return (
            <div key={`${trans!.gen}-${a.kunci}`} className="cer-pg-lapis cer-pg-eksterior" data-aktor={`x:${a.kunci}`} aria-hidden="true">
              <img src={a.aset} alt="" />
              <span>{a.nama}</span>
            </div>
          );
        }
        return null;
      })}

      {nasabahDiRuang ? (
        <p className="cer-suasana" data-aktor="chip" data-ekspresi={nasabahDiRuang.opsi.ekspresi}>
          <span className="sr-only">{t('cerita.suasanaAria', { nama: namaNasabah, suasana })}</span>
          <span aria-hidden="true">{t('cerita.suasanaChip', { nama: namaNasabah, suasana })}</span>
        </p>
      ) : null}

      {lewatTelepon ? (
        <SisipanTelepon
          ekspresi={lewatTelepon.ekspresi}
          nama={namaNasabah}
          bicara={pembicara === 'nasabah' && mengetik && bergerak}
          awalan={`${uid}tel`}
          posisi={kamera ? posisiSisipan(susunan, kamera, W, H, namaNasabah, ukuranSisip) : null}
          dpr={dpr}
          ukuran={ukuranSisip}
          versi={versiSeni}
        />
      ) : null}

      {trans?.rencana.lewati
        ? slotLewati && slotLewati.isConnected ? createPortal(<TombolLewati onLewati={lewati} />, slotLewati) : <TombolLewati onLewati={lewati} />
        : null}
    </div>
  );
}

/** devicePixelRatio kini (1 bila tidak ada). */
function dprKini(): number {
  const d = typeof window === 'undefined' ? 1 : window.devicePixelRatio;
  return d > 0 && Number.isFinite(d) ? d : 1;
}

/**
 * Status dekode PNG (sumberPiksel.ts): 'siap' semua / 'memuat' / 'gagal'. Dirender ulang saat pemuatan selesai.
 * Tanpa URL (seni SVG) = 'siap'.
 */
function useGambarSiap(urls: readonly string[]): 'siap' | 'memuat' | 'gagal' {
  const kunci = urls.join('|');
  const [, paksa] = useReducer((x: number) => x + 1, 0);
  const st = statusGambar(urls);
  useEffect(() => {
    if (st !== 'memuat') return;
    let hidup = true;
    void Promise.all(kunci.split('|').filter(Boolean).map(muatGambar)).then(() => { if (hidup) paksa(); });
    return () => { hidup = false; };
  }, [kunci, st]);
  return st;
}

/**
 * "Lewati pembuka" (v5.1: dirender lewat portal di sel kiri baris kaki kotak dialog, di samping Lanjut; lihat
 * PropsPanggung.slotLewati). Event React dari portal merambat lewat pohon PANGGUNG, bukan kotak dialog: ketukan tombol
 * ini tidak pernah menjadi "ketuk kotak untuk lanjut". Tombol ini hilang saat gerak selesai (diketuk, Lanjut, atau selesai sendiri). Bila saat itu
 * FOKUS ada di tombol ini, fokus dipindahkan ke kontrol utama kotak dialog ([data-cer-fokus]: Lanjut / pertanyaan
 * pilihan), bukan jatuh ke <body> (WCAG 2.4.3). Fokus di tempat lain tidak pernah diambil. Cleanup efek tata letak
 * berjalan SEBELUM tombol dilepas dari DOM, jadi document.activeElement masih tombol ini saat diperiksa.
 */
function TombolLewati({ onLewati }: { onLewati: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    return () => {
      if (!el || document.activeElement !== el) return;
      requestAnimationFrame(() => {
        const aktif = document.activeElement;
        // Pemain sudah memindahkan fokus sendiri (atau dialog terbuka): biarkan.
        if (aktif && aktif !== document.body && aktif !== el && document.contains(aktif)) return;
        document.querySelector<HTMLElement>('.cer-main [data-cer-fokus]')?.focus({ preventScroll: true });
      });
    };
  }, []);
  return (
    <button
      ref={ref}
      type="button"
      className="cer-pg-lewati"
      onKeyDown={tahanUlang}
      onClick={(e) => {
        // Diaktifkan saat berfokus (Enter/Spasi/ketuk): fokus langsung ke kontrol utama dialog SEBELUM tombol dilepas
        // (tidak menunggu bingkai berikut; bingkai yang lambat pernah membuat fokus sempat jatuh ke <body>).
        const berfokus = document.activeElement === e.currentTarget;
        e.stopPropagation();
        onLewati();
        if (berfokus) document.querySelector<HTMLElement>('.cer-main [data-cer-fokus]')?.focus({ preventScroll: true });
      }}
    >
      {t('cerita.lewatiPembuka')}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="m6 6 6 6-6 6M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Tata letak sisipan panggilan: pusat (px, relatif kotak panggung) + `ringkas` (kolom: potret berlencana telepon, nama di bawah). */
export interface PosisiSisipan {
  x: number;
  y: number;
  ringkas: boolean;
}

/** Perkiraan lebar teks tebal (px): aksara CJK ± 1 em, lainnya ± 0,6 em. */
function lebarTeks(teks: string, px: number): number {
  let w = 0;
  for (const c of Array.from(teks)) w += /[⺀-鿿豈-﫿＀-￯]/.test(c) ? px : px * 0.6;
  return Math.ceil(w);
}

/**
 * Perkiraan ukuran sisipan (px CSS; cerita.css .cer-pg-telepon, termasuk tepi 1 px): BARIS = potret + ikon + nama tebal
 * 14 px; RINGKAS = kolom potret (lencana telepon di sudutnya) + nama tebal 12,5 px di bawahnya.
 */
export function ukuranSisipan(u: number, nama: string, ringkas: boolean): { w: number; h: number } {
  if (ringkas) return { w: Math.max(u + 24, lebarTeks(nama, 12.5) + 18), h: u + 28 };
  return { w: 5 + u + 8 + 26 + 6 + lebarTeks(nama, 14) + 12 + 2, h: u + 12 };
}

/**
 * Plakat nama + rak lilin di bawahnya (dunia), dari kotak teks papan ruang: plakat walnut melebihi kotak teksnya
 * (PAPAN vs TEKS_PAPAN seni/ruang/geometri.ts), rak dua lilin sampai PAPAN.rakBawah. Sisipan tidak boleh menutupinya.
 */
function plakatDanRak(teks: Kotak): Kotak {
  const kiri = TEKS_PAPAN.x - PAPAN.x;
  const atas = TEKS_PAPAN.y - PAPAN.y;
  const bawah = PAPAN.rakBawah - (TEKS_PAPAN.y + TEKS_PAPAN.h);
  return { x: teks.x - kiri, y: teks.y - atas, w: teks.w + 2 * kiri, h: teks.h + atas + bawah };
}

/** Jarak bebas (px) sisipan dari tepi panggung & dari plakat / Miss Raksa. */
const TEPI_SISIPAN = 6;

/**
 * Letak sisipan panggilan (epilog telepon; kursi pengunjung kosong): di DINDING KOSONG kanan plakat, yaitu dari tepi
 * kanan plakat + rak lilin sampai sekat pintu, di atas sandaran kursi pengunjung, diproyeksikan lewat kamera dan dipotong
 * ke kotak panggung. Titik yang diutamakan: tengah dinding itu di atas panel bilah (setinggi plakat). Tata letak BARIS
 * dipakai bila muat di dinding itu, selain itu RINGKAS (HP). Tidak ada yang muat: titik bebas terdekat di panggung
 * (tanpa menutupi plakat, rak lilin, kepala & tangan Miss Raksa), ringkas dulu. null = ruang tanpa kursi pengunjung.
 */
export function posisiSisipan(s: SusunanAdegan, k: Kamera, W: number, H: number, nama: string, u: number): PosisiSisipan | null {
  if (!s.ruang.tempat.nasabahDuduk) return null;
  const T = TEPI_SISIPAN;
  const halang: Kotak[] = [];
  const papan = kotakPapan(s.ruang);
  const plakat = papan ? plakatDanRak(papan) : null;
  if (plakat) halang.push(keLayar(k, plakat));
  const m = cariTokoh(s, 'mentor');
  if (m) halang.push(keLayar(k, kotakPenting(m)));
  // Dinding kosong (dunia) -> layar, dipotong ke panggung.
  const kiri = plakat ? plakat.x + plakat.w : DUNIA_W / 2;
  const kanan = s.ruang.pintu ? s.ruang.pintu.bukaan.x - SEKAT_PINTU : DUNIA_W;
  const bawah = s.ruang.kursi?.belakang.y ?? DUNIA_H;
  const d = keLayar(k, { x: kiri, y: 0, w: Math.max(0, kanan - kiri), h: bawah });
  const x0 = Math.max(T, d.x + T);
  const x1 = Math.min(W - T, d.x + d.w - T);
  const y0 = Math.max(T, d.y);
  const y1 = Math.min(H - T, d.y + d.h - T);
  const panel = (BILAH.y - k.y) * k.s;
  const px = (x0 + x1) / 2;
  const py = (y0 + Math.max(y0, Math.min(y1, panel))) / 2;
  const bebas = (x: number, y: number, w: number, h: number) =>
    halang.every((b) => x - w / 2 >= b.x + b.w + T || x + w / 2 <= b.x - T || y - h / 2 >= b.y + b.h + T || y + h / 2 <= b.y - T);
  const jepit = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
  for (const ringkas of [false, true]) {
    const { w, h } = ukuranSisipan(u, nama, ringkas);
    if (x1 - x0 < w || y1 - y0 < h) continue;
    const x = jepit(px, x0 + w / 2, x1 - w / 2);
    const y = jepit(py, y0 + h / 2, y1 - h / 2);
    if (bebas(x, y, w, h)) return { x, y, ringkas };
  }
  // Cadangan: titik bebas terdekat di seluruh panggung (di atas pita bawah), kisi 4 px.
  for (const ringkas of [true, false]) {
    const { w, h } = ukuranSisipan(u, nama, ringkas);
    let pilih: { x: number; y: number; jarak: number } | null = null;
    for (let y = T + h / 2; y <= H - 40 - h / 2; y += 4) {
      for (let x = T + w / 2; x <= W - T - w / 2; x += 4) {
        if (!bebas(x, y, w, h)) continue;
        const jarak = Math.hypot(x - px, y - py);
        if (!pilih || jarak < pilih.jarak) pilih = { x, y, jarak };
      }
    }
    if (pilih) return { x: pilih.x, y: pilih.y, ringkas };
  }
  const { w, h } = ukuranSisipan(u, nama, true);
  return { x: jepit(px, T + w / 2, W - T - w / 2), y: jepit(py, T + h / 2, H - T - h / 2), ringkas: true };
}

/** Lebar sekat pintu masuk (satuan dunia) di kiri bukaan pintu: muka sekat + sisinya (seni/ruang/geometri.ts). */
const SEKAT_PINTU = PINTU.x - (SEKAT.x - SEKAT.sisi);

/**
 * Sisi potret sisipan (px CSS) per tata letak: desktop 84 (isi 80 = 40 piksel seni x 2 px pada dpr 1: wajah terbaca),
 * HP sempit (<= 420 px) 44, lainnya 52 (isi x dpr 2 = 2 px perangkat per piksel seni). Satu sumber untuk ukuran (gaya
 * inline), tata letak (posisiSisipan) DAN aturan potretnya (aturanPotretSisipan); tanpa membaca layout.
 */
function ukuranPotretSisipan(): number {
  const cocok = (q: string) => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
  if (cocok('(min-width: 900px) and (min-height: 541px)')) return 84;
  return cocok('(max-width: 420px)') ? 44 : 52;
}

/** Tepi bingkai potret sisipan (px CSS, cerita.css .cer-pg-telepon-potret border 2 px; box-sizing border-box). */
const TEPI_POTRET_SISIPAN = 2;

/**
 * Potret sisipan PIKSEL Bu Rina (penyusun seni/piksel `teleponSisipan`: frame telepon, kepala utuh + gagang) untuk
 * isi kotak `isi` px CSS pada devicePixelRatio `dpr`: jendela dipilih untuk isi x dpr piksel PERANGKAT (skala bulat),
 * jadi satu piksel seni = `skala` piksel perangkat. Mulut tertutup + mulut terbuka (bicara). null = raster tidak
 * tersedia (atlas tidak ada / gagal): potret SVG.
 */
function potretSisipanPiksel(ekspresi: Ekspresi, isi: number, dpr: number): { viewBox: string; dasar: string; bicara: string; skala: number; asal: string } | null {
  if (!TOKOH_PIKSEL || !tokohPiksel('buRina')) return null;
  try {
    const u = Math.max(1, Math.round(isi * dpr));
    const tutup = teleponSisipan(ekspresi, u);
    const buka = teleponSisipan(ekspresi, u, { mulut: 'buka' });
    if (!tutup || !tutup.lapisan.length) return null;
    const a = svgPotret(tutup);
    return { viewBox: a.viewBox, dasar: a.isi, bicara: buka ? svgPotret(buka).isi : a.isi, skala: tutup.skala, asal: tutup.asal };
  } catch {
    return null;
  }
}

interface PropsSisipan {
  ekspresi: Ekspresi;
  nama: string;
  bicara: boolean;
  awalan: string;
  posisi: PosisiSisipan | null;
  dpr: number;
  /** Sisi potret (px CSS, ukuranPotretSisipan). */
  ukuran: number;
  /** Versi status seni piksel (sumberPiksel): atlas yang gagal sesudah tampil = potret dipilih ulang. */
  versi: number;
}

function SisipanTelepon({ ekspresi, nama, bicara, awalan, posisi, dpr, ukuran, versi }: PropsSisipan) {
  // SVG (cadangan): aturan potret sama dengan Miss Raksa (aturanPotret): <= 52 px jendela kecil + rincian kecil, 53-75
  // px jendela sedang + rincian kecil, >= 76 px jendela V3 normal. Dihitung ulang setiap render (panggung dirender
  // ulang saat ukurannya berubah). Atlas piksel GAGAL (tokoh panggung = siluet netral) = potret siluet yang sama, bukan
  // seni v3: tampilan gagal seragam dengan panggung.
  const { jendela: J, kecil } = aturanPotretSisipan(ukuran);
  const isi = ukuran - 2 * TEPI_POTRET_SISIPAN;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const piksel = useMemo(() => potretSisipanPiksel(ekspresi, isi, dpr), [ekspresi, isi, dpr, versi]);
  const siluet = TOKOH_PIKSEL && atlasGagal();
  const potret = useMemo(() => {
    if (piksel) return null;
    // Tanpa id per pemasangan (entri cache bersama, dipanaskan panas.ts); awalan unik lewat awalanId.
    const g = siluet ? buRinaSementara({ pose: 'telepon', ekspresi }) : gambarBuRina({ pose: 'telepon', ekspresi, kecil });
    // Jendela didefinisikan untuk kepala kanvas duduk; digeser mengikuti kepala gambar ini.
    const x = J.x + g.kepala.x - KANVAS_DUDUK.kepala.x;
    const y = J.y + g.kepala.y - KANVAS_DUDUK.kepala.y;
    return { html: awalanId(g.svg, `${awalan}s`), x, y, sisi: J.sisi };
  }, [piksel, siluet, ekspresi, awalan, kecil, J]);
  // Potret PIKSEL: sudut isinya dijatuhkan ke piksel perangkat bulat. Sisipan berpusat lewat translate(-50 %) dan asal
  // panggung boleh pecahan (dpr 1,25 / 1,5), jadi tanpa ini satu piksel seni bisa jatuh di antara piksel perangkat.
  // Koordinat dokumen (gulir halaman tidak mengubahnya), sama dengan asal kamera panggung; dihitung tiap render dan
  // saat ukuran sisipan berubah tanpa render (lebar nama berubah sesudah fon web dimuat).
  const potretRef = useRef<HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    const el = potretRef.current;
    if (!piksel || !el) return;
    const jatuhkan = () => {
      const svg = Array.from(el.querySelectorAll<SVGSVGElement>('.cer-pg-telepon-varian'));
      for (const s of svg) s.style.transform = '';
      const r = el.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      const x = (r.left + el.clientLeft + window.scrollX) * d;
      const y = (r.top + el.clientTop + window.scrollY) * d;
      const dx = (Math.round(x) - x) / d;
      const dy = (Math.round(y) - y) / d;
      if (Math.abs(dx) > 1e-3 || Math.abs(dy) > 1e-3) for (const s of svg) s.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    jatuhkan();
    const akar = el.closest('.cer-pg-telepon');
    if (!akar || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(jatuhkan);
    ro.observe(akar);
    return () => ro.disconnect();
  });
  return (
    <div
      className="cer-pg-telepon"
      data-aktor="telepon-sisip"
      data-bicara={bicara ? '' : undefined}
      data-posisi={posisi ? '' : undefined}
      data-ringkas={posisi?.ringkas ? '' : undefined}
      data-siluet={!piksel && siluet ? '' : undefined}
      style={{ ...(posisi ? { left: Math.round(posisi.x), top: Math.round(posisi.y) } : {}), '--u': `${ukuran}px` } as CSSProperties}
      aria-hidden="true"
    >
      {piksel ? (
        <span
          ref={potretRef}
          className="cer-pg-telepon-potret"
          data-ukuran={ukuran}
          data-piksel={piksel.skala}
          data-jendela={piksel.asal}
          style={{ width: ukuran, height: ukuran }}
        >
          {/* Mulut tertutup & terbuka bergantian (CSS) hanya selama Bu Rina berbicara; kepala & tubuh identik. */}
          <svg className="cer-pg-telepon-varian" data-varian="dasar" viewBox={piksel.viewBox} preserveAspectRatio="none" focusable="false" dangerouslySetInnerHTML={{ __html: piksel.dasar }} />
          {bicara ? <svg className="cer-pg-telepon-varian" data-varian="bicara" viewBox={piksel.viewBox} preserveAspectRatio="none" focusable="false" dangerouslySetInnerHTML={{ __html: piksel.bicara }} /> : null}
        </span>
      ) : (
        <span className="cer-pg-telepon-potret" data-ukuran={ukuran} data-jendela={J.sisi} style={{ width: ukuran, height: ukuran }}>
          <svg viewBox={`${potret!.x} ${potret!.y} ${potret!.sisi} ${potret!.sisi}`} focusable="false" dangerouslySetInnerHTML={{ __html: potret!.html }} />
        </span>
      )}
      <span className="cer-pg-telepon-teks">
        <span className="cer-pg-telepon-ikon">
          <svg width="16" height="16" viewBox="0 0 24 24" focusable="false" dangerouslySetInnerHTML={{ __html: IKON_TELEPON }} />
        </span>
        <b>{nama}</b>
      </span>
    </div>
  );
}

/** Batas galat panggung: galat apa pun di presentasi = kotak latar polos; dialog & pilihan tetap jalan. */
class BatasPanggung extends Component<{ children: ReactNode; kunci: string }, { galat: boolean; kunci: string }> {
  state = { galat: false, kunci: this.props.kunci };
  /** Komposisi berikutnya dicoba digambar lagi (galat sesaat tidak mematikan panggung untuk seterusnya). */
  static getDerivedStateFromProps(p: { kunci: string }, s: { galat: boolean; kunci: string }) {
    return p.kunci !== s.kunci ? { galat: false, kunci: p.kunci } : null;
  }
  static getDerivedStateFromError() {
    return { galat: true };
  }
  componentDidCatch(e: unknown) {
    if (import.meta.env?.DEV) console.warn('Panggung cerita gagal digambar; memakai latar polos.', e);
  }
  render() {
    return this.state.galat ? <div className="cer-panggung" data-rusak="" aria-hidden="true" /> : this.props.children;
  }
}
