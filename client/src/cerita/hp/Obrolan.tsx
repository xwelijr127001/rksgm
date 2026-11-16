/**
 * OBROLAN (antarmuka HP): percakapan WhatsApp dengan nasabah sebagai SATU pusat komunikasi. Utas disusun dari riwayat
 * (alur.ts utasObrolan): pesan nasabah masuk, balasan & pesan aktivitas pemain keluar ("Terkirim", bukan centang),
 * narasi sebagai catatan kecil, perubahan status sebagai catatan tersendiri SESUDAH reaksinya. Pesan baru muncul
 * bertahap (animasi CSS, tanpa menunggu ketukan; gerak dikurangi = langsung) dan dibacakan sekali lewat live region.
 * Pesan sesi sebelumnya dilipat di balik "Lihat pesan sebelumnya" (tetap bisa dibaca ulang). Komposer (pilihan, tugas,
 * Lanjut) dari pemanggil.
 * Obrolan satu lawan: gelembung masuk TANPA avatar per pesan (siapa pengirimnya sudah jelas dari kepala obrolan), jadi
 * wajah nasabah tidak berulang.
 * CUT-IN (Episode.cutIn, alur.ts idCutIn): pada momen emosional terpilih, pesan masuk terbaru MENYATU dengan potret dekat
 * nasabah (ekspresi barisnya): gelembungnya menumpang di bawah potret, dan avatar kepala obrolan disembunyikan selama
 * cut-in tampil (satu wajah utama, bukan banner tambahan). Hiasan (aria-hidden), tidak mengunci input, tanpa guncangan atau
 * kilatan; gerak dikurangi = langsung tampil. Tetap obrolan WhatsApp (label "WhatsApp"), bukan telepon/video.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BATAS_IKUT, LembarObrolan, KUERI_CANGKANG } from './ekor';
import { selaPembicara } from '../ui/bagian';
import { gabungKalimat } from './arena/rambu';
import { playSfx } from '../../audio/audio';
import { useReducedMotion } from '../../hooks';
import { t } from '../../i18n';
import type { Ekspresi, Episode, KunciTeks, StateCerita } from '../tipe';
import { IkonArah } from '../ui/bagian';
import { PotretPikselHp } from '../ui/latar/piksel/PotretPikselHp';
import { tokohPotret } from '../ui/latar/piksel/potret';
import { CatatanStatus, GambarSeni, PotretHp, judulStatus } from './bagianHp';
import { idCutIn, ringkasCatatan, utasObrolan, type PesanObrolan } from './alur';

/** Lama indikator "sedang mengetik" sebelum pesan masuk tampil (ms). Bisa dilewati; gerak dikurangi = tanpa indikator. */
export const LAMA_MENGETIK = 750;
const KUNCI_MULAI = 'raksa:cerita:obrolan-mulai';
function sudahMulai(kunci: string): boolean {
  try { return (JSON.parse(sessionStorage.getItem(KUNCI_MULAI) ?? '[]') as string[]).includes(kunci); } catch { return false; }
}
function catatMulai(kunci: string): void {
  try {
    const a = (JSON.parse(sessionStorage.getItem(KUNCI_MULAI) ?? '[]') as string[]).filter((x) => x !== kunci);
    sessionStorage.setItem(KUNCI_MULAI, JSON.stringify([...a, kunci].slice(-40)));
  } catch { /* kenyamanan saja */ }
}

/**
 * RITME (15 Nov 2026), murni tampilan — mesin, riwayat, dan efek cerita tidak disentuh:
 *  1. GERBANG sesi obrolan baru yang belum dibalas: tujuan bagian + "Mulai percakapan"; isi sesi & komposer belum tampil.
 *  2. Sesudah mulai / saat pesan nasabah baru masuk: indikator "sedang mengetik" singkat (bisa "Tampilkan" langsung), lalu pesan.
 *  3. Narasi node kini diringkas (kalimat pertama + "Konteks"); akibat keputusan tetap utuh.
 *  4. Pesan baru TIDAK menggulir paksa bila pemain sedang membaca ke atas: muncul penanda "Pesan baru ↓".
 * Muat ulang: pesan yang sudah ada tampil langsung (tanpa mengetik); sesi yang sudah dimulai tidak bergerbang lagi.
 *
 * T-018 Tahap 1 (cangkang HP, lihat ekor.ts): di HP halaman TIDAK menggulir; satu-satunya penggulir = .hp-gulir (pesan + ekor).
 *  - Pesan baru: penggulir mengikuti (pesan pertama kelompok baru di atas bila kelompoknya lebih tinggi dari layar, selain itu
 *    ujung bawah), kecuali pemain menggulir ke atas lebih dari BATAS_IKUT px: lalu hanya pil "Pesan baru"; mengetuknya = ke ujung.
 *  - Balasan pemain sendiri selalu diikuti. Riwayat lama dibuka = batas lama/baru di tengah layar, bisa digulir sampai pesan pertama.
 * Desktop (>= 1024) dan layar sangat pendek: perilaku lama (halaman menggulir) tidak berubah.
 */
function useCangkang(): boolean {
  const [v, setV] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(KUERI_CANGKANG).matches);
  useEffect(() => {
    const m = window.matchMedia(KUERI_CANGKANG);
    const f = () => setV(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return v;
}
export function Obrolan({ ep, state, tx, status, pesanAktivitas, komposer, sisipan, tujuan, lembar = false }: {
  ep: Episode;
  state: StateCerita;
  tx: (k: KunciTeks) => string;
  /** Label status kumulatif nasabah ("Cemas"). */
  status: string;
  pesanAktivitas: (node: string, idAktivitas: string) => string | null;
  /** Bagian bawah: pilihan balasan, kartu tugas, atau tombol Lanjut. */
  komposer: ReactNode;
  /** Di atas komposer: istilah baris yang baru tampil. */
  sisipan?: ReactNode;
  /** Tujuan bagian cerita: tampil SEKALI di gerbang sesi, tidak di tiap pesan. */
  tujuan?: string;
  /** Komposer sedang berisi daftar balasan (di HP = lembar balasan terbuka: kepala obrolan jadi satu baris ramping). */
  lembar?: boolean;
}) {
  const reduced = useReducedMotion();
  const { pesan, sesiMulai } = useMemo(() => utasObrolan(ep, state, pesanAktivitas), [ep, state, pesanAktivitas]);
  const [bukaLama, setBukaLama] = useState(false);
  const nama = tx(ep.pemeran[ep.nasabah]?.nama ?? ep.nasabah);
  const cutIn = idCutIn(ep, pesan);

  // ---- gerbang sesi
  const kunciSesi = `${ep.id}:${pesan[sesiMulai]?.id ?? '-'}`;
  const sesi = pesan.slice(sesiMulai);
  const adaKeluar = sesi.some((p) => p.jenis === 'keluar');
  const [mulai, setMulai] = useState(() => sudahMulai(kunciSesi));
  const kunciLalu = useRef(kunciSesi);
  if (kunciLalu.current !== kunciSesi) { kunciLalu.current = kunciSesi; if (mulai !== sudahMulai(kunciSesi)) setMulai(sudahMulai(kunciSesi)); }
  // Gerbang hanya untuk sesi yang DIMULAI oleh titik keputusan percakapan (mis. K01, K06, K12); sesi yang dibuka oleh akibat
  // keputusan (mis. jawaban Pak Hendra sesudah K08-D) langsung tampil, agar akibat tidak tertahan di balik tombol.
  const nodeAwalSesi = sesi[0] ? ep.node[sesi[0].node] : undefined;
  const gerbang = !!tujuan && !adaKeluar && !mulai && sesi.length > 0 && nodeAwalSesi?.jenis === 'pilihan';

  // ---- sedang mengetik
  const [ketik, setKetik] = useState<string | null>(null);
  const waktuKetik = useRef<number | null>(null);
  const mulaiKetik = (id: string | undefined) => {
    if (!id) return;
    if (reduced) { playSfx('pesanTerima'); return; }
    if (waktuKetik.current) window.clearTimeout(waktuKetik.current);
    setKetik(id);
    waktuKetik.current = window.setTimeout(() => { waktuKetik.current = null; setKetik(null); playSfx('pesanTerima'); }, LAMA_MENGETIK);
  };
  const selesaiKetik = () => { if (waktuKetik.current) window.clearTimeout(waktuKetik.current); waktuKetik.current = null; setKetik(null); playSfx('pesanTerima'); };
  useEffect(() => () => { if (waktuKetik.current) window.clearTimeout(waktuKetik.current); }, []);

  // ---- posisi baca: dekat bawah = pesan baru boleh digulir ke layar; jauh = penanda saja.
  const dekatBawah = useRef(true);
  const [adaBaru, setAdaBaru] = useState(false);
  const cangkang = useCangkang();
  const gulirRef = useRef<HTMLDivElement>(null);
  const daftarRef = useRef<HTMLOListElement>(null);
  /** Pesan pertama kelompok terbaru (cangkang): sasaran gulir bila kelompoknya lebih tinggi dari layar. */
  const jangkar = useRef<string | null>(null);
  /** Posisi "terbaru" penggulir: pesan pertama kelompok baru, paling jauh ujung bawah. */
  const sasaran = useCallback((): number => {
    const g = gulirRef.current;
    if (!g) return 0;
    const maks = Math.max(0, g.scrollHeight - g.clientHeight);
    const el = jangkar.current ? g.querySelector<HTMLElement>(`[data-pesan="${jangkar.current}"]`) : null;
    if (!el) return maks;
    return Math.min(maks, Math.max(0, el.getBoundingClientRect().top - g.getBoundingClientRect().top + g.scrollTop - 8));
  }, []);
  /** Ikuti yang terbaru (tidak pernah menggulir NAIK: pemain yang sudah di ujung bawah tidak ditarik kembali). */
  const ikuti = useCallback(() => {
    const g = gulirRef.current;
    if (!g) return;
    const s = sasaran();
    if (s > g.scrollTop) g.scrollTop = s;
    dekatBawah.current = true;
  }, [sasaran]);
  useEffect(() => {
    if (cangkang) {
      const g = gulirRef.current;
      if (!g) return;
      const f = () => {
        dekatBawah.current = g.scrollTop >= sasaran() - BATAS_IKUT;
        if (dekatBawah.current) setAdaBaru(false);
      };
      g.addEventListener('scroll', f, { passive: true });
      // Isi bertambah (pesan tampil sesudah "mengetik", gambar termuat) atau komposer berubah tinggi: tetap di yang terbaru.
      const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => { if (dekatBawah.current) ikuti(); });
      if (ro) { ro.observe(g); for (const a of Array.from(g.children)) ro.observe(a); }
      return () => { g.removeEventListener('scroll', f); ro?.disconnect(); };
    }
    const f = () => {
      const jarak = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      dekatBawah.current = jarak < 240;
      if (dekatBawah.current) setAdaBaru(false);
    };
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, [cangkang, sasaran, ikuti]);

  // Pesan baru sejak tampilan sebelumnya: dianimasikan bertahap, dibacakan, dan (bila pemain di bawah) digulir ke layar.
  const jumlahLalu = useRef<number | null>(null);
  const baruMulai = jumlahLalu.current === null ? pesan.length : Math.min(jumlahLalu.current, pesan.length);
  const [umumkan, setUmumkan] = useState('');
  const gerbangRef = useRef(gerbang);
  gerbangRef.current = gerbang;
  useLayoutEffect(() => {
    const lalu = jumlahLalu.current;
    jumlahLalu.current = pesan.length;
    if (lalu === null || pesan.length <= lalu || gerbangRef.current) return;
    const baru = pesan.slice(lalu);
    setUmumkan(baru.map((p) => teksUmum(p, tx, nama)).filter(Boolean).join(' '));
    mulaiKetik(baru.find((p) => p.jenis === 'masuk')?.id);
    if (cangkang) {
      jangkar.current = baru[0]!.id;
      if (baru.some((p) => p.jenis === 'keluar')) dekatBawah.current = true;
      if (dekatBawah.current) ikuti(); else setAdaBaru(true);
    } else if (dekatBawah.current) {
      const el = daftarRef.current?.querySelector<HTMLElement>(`[data-pesan="${baru[0]!.id}"]`) ?? daftarRef.current?.lastElementChild as HTMLElement | null;
      el?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    } else setAdaBaru(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pesan, tx, nama, reduced]);
  // Cangkang: saat dibuka (dan saat cangkang baru berlaku, mis. layar diputar) langsung di pesan terbaru.
  useLayoutEffect(() => {
    if (!cangkang) return;
    const g = gulirRef.current;
    if (g) g.scrollTop = sasaran();
    dekatBawah.current = true;
  }, [cangkang, sasaran]);
  // Lembar balasan dibuka/ditutup: jendela pesan mengecil/membesar; bila pemain sedang mengikuti, tetap di UJUNG bawah
  // (ekor pesan terakhir nasabah terlihat di atas lembar), bukan di puncak kelompok pesan terakhir.
  useLayoutEffect(() => {
    if (!cangkang || !dekatBawah.current) return;
    if (lembar) jangkar.current = null;
    const g = gulirRef.current;
    if (g) g.scrollTop = sasaran();
  }, [lembar, cangkang, sasaran]);
  // Cangkang: riwayat lama dibuka = batas lama/baru di tengah layar (pesan lama terlihat, bisa digulir sampai pesan pertama).
  const bukaLamaLalu = useRef(bukaLama);
  useLayoutEffect(() => {
    if (bukaLamaLalu.current === bukaLama) return;
    bukaLamaLalu.current = bukaLama;
    const g = gulirRef.current;
    if (!cangkang || !g) return;
    if (!bukaLama) { g.scrollTop = sasaran(); dekatBawah.current = true; return; }
    const awal = g.querySelector<HTMLElement>(`[data-pesan="${pesan[sesiMulai]?.id ?? ''}"]`);
    if (awal) g.scrollTop = Math.max(0, awal.getBoundingClientRect().top - g.getBoundingClientRect().top + g.scrollTop - g.clientHeight / 2);
    dekatBawah.current = g.scrollTop >= sasaran() - BATAS_IKUT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bukaLama, cangkang]);
  // Saat dibuka (muat ulang / kembali ke obrolan): pesan terakhir sesi ini terlihat, bukan puncak halaman.
  useEffect(() => {
    if (cangkang) return;
    const id = requestAnimationFrame(() => {
      const semua = daftarRef.current?.querySelectorAll<HTMLElement>('[data-pesan]');
      const akhir = semua && semua.length ? semua[Math.max(0, semua.length - 3)] : null;
      akhir?.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mulaiPercakapan = () => {
    catatMulai(kunciSesi);
    setMulai(true);
    mulaiKetik(sesi.find((p) => p.jenis === 'masuk')?.id);
    if (cangkang) { dekatBawah.current = true; requestAnimationFrame(ikuti); return; }
    requestAnimationFrame(() => daftarRef.current?.querySelector<HTMLElement>('[data-pesan], .hp-mengetik')?.scrollIntoView({ block: 'start', behavior: 'auto' }));
  };
  const keBaru = () => {
    setAdaBaru(false);
    if (cangkang) { const g = gulirRef.current; if (g) g.scrollTop = g.scrollHeight; dekatBawah.current = true; return; }
    (daftarRef.current?.lastElementChild as HTMLElement | null)?.scrollIntoView({ block: 'end', behavior: reduced ? 'auto' : 'smooth' });
  };

  const indeksKetik = ketik ? pesan.findIndex((p) => p.id === ketik) : -1;
  const akhirTampil = gerbang ? sesiMulai : indeksKetik >= 0 ? indeksKetik : pesan.length;
  const awalTampil = Math.min(bukaLama ? 0 : sesiMulai, akhirTampil);
  const wajah = [...pesan.slice(0, akhirTampil)].reverse().find((p): p is Extract<PesanObrolan, { jenis: 'masuk' }> => p.jenis === 'masuk')?.ekspresi;
  const lamaTersembunyi = bukaLama ? 0 : Math.min(sesiMulai, akhirTampil);

  return (
    <section className="hp-obrolan" data-cangkang={cangkang ? '' : undefined} data-berlembar={lembar && cangkang && !gerbang && !ketik ? '' : undefined} data-cutin={cutIn && !gerbang && !ketik ? '' : undefined} data-gerbang={gerbang ? '' : undefined} aria-label={t('ceritaHp.obrolanDengan', { nama })}>
      <header className="hp-obrolan-kepala">
        <PotretHp ep={ep} id={ep.nasabah} ekspresi={wajah} nama={nama} />
        <div className="hp-obrolan-nama">
          <b>{nama}</b>
          <span className="hp-status" data-status={status}>{t('ceritaHp.statusChip', { status })}</span>
        </div>
      </header>
      {/* SATU penggulir layar obrolan di HP (T-018); di desktop hanya pembungkus biasa. */}
      <div ref={gulirRef} className="hp-gulir" data-gulir="">
      {lamaTersembunyi > 0 ? (
        <button type="button" className="hp-lama" onClick={() => setBukaLama(true)}>{t('ceritaHp.pesanSebelumnya', { n: lamaTersembunyi })}</button>
      ) : bukaLama && sesiMulai > 0 ? (
        <button type="button" className="hp-lama" onClick={() => setBukaLama(false)}>{t('ceritaHp.sembunyikanSebelumnya')}</button>
      ) : null}
      <ol ref={daftarRef} className="hp-utas">
        {pesan.slice(awalTampil, akhirTampil).map((p, i) => {
          const indeks = awalTampil + i;
          const baru = indeks >= baruMulai;
          const tunda = baru ? { animationDelay: `${Math.min(Math.max(0, indeks - Math.max(baruMulai, indeksKetik)), 5) * 260}ms` } : undefined;
          return <ItemPesan key={p.id} ep={ep} p={p} tx={tx} nama={nama} baru={baru} gaya={tunda} cutIn={p.id === cutIn} kini={p.node === state.node} />;
        })}
        {ketik ? (
          <li className="hp-pesan hp-masuk hp-mengetik" data-mengetik="">
            <p className="hp-gelembung"><span className="hp-titik-ketik" aria-hidden="true"><i /><i /><i /></span><span className="hp-mengetik-teks">{t('ceritaHp.mengetik', { nama })}</span></p>
            <button type="button" className="hp-tautan" data-tampilkan-pesan="" onClick={selesaiKetik}>{t('ceritaHp.tampilkanSekarang')}</button>
          </li>
        ) : null}
      </ol>
      <div className="hp-ekor">{gerbang || ketik ? null : sisipan}</div>
      </div>
      {gerbang ? (
        <div className="hp-gerbang" data-gerbang-sesi="">
          <p className="hp-gerbang-tujuan"><b>{t('ceritaHp.tujuan')}</b>{selaPembicara()}{tujuan}</p>
          <button type="button" className="primary-action hp-gerbang-mulai" data-mulai-percakapan="" onClick={mulaiPercakapan}>
            {t('ceritaHp.mulaiPercakapan')} <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">{ketik || gerbang ? '' : umumkan}</p>
      {adaBaru && !gerbang ? <button type="button" className="hp-pesan-baru" data-pesan-baru="" onClick={keBaru}>{t('ceritaHp.pesanBaruBawah')}</button> : null}
      {gerbang || ketik ? null : <LembarObrolan.Provider value={cangkang}><div className="hp-komposer">{komposer}</div></LembarObrolan.Provider>}
    </section>
  );
}

function teksUmum(p: PesanObrolan, tx: (k: KunciTeks) => string, nama: string): string {
  if (p.jenis === 'masuk') return t('ceritaHp.pesanBaru', { nama, teks: tx(p.teks) });
  if (p.jenis === 'catatan') return p.topik ? `${tx(p.topik)}: ${tx(p.teks)}` : tx(p.teks);
  if (p.jenis === 'status') return gabungKalimat([`${t('ceritaHp.kenapa')}${selaPembicara()}${tx(p.teks)}`, `${judulStatus(nama, tx(p.sebelum), tx(p.sesudah), p.arah)}${tx('daftar.titik')}`]);
  return '';
}

function ItemPesan({ ep, p, tx, nama, baru, gaya, cutIn = false, kini = false }: { ep: Episode; p: PesanObrolan; tx: (k: KunciTeks) => string; nama: string; baru: boolean; gaya?: React.CSSProperties; cutIn?: boolean; kini?: boolean }) {
  const umum = { 'data-pesan': p.id, 'data-baru': baru ? '' : undefined, style: gaya } as const;
  if (p.jenis === 'masuk') {
    return (
      <li className={'hp-pesan hp-masuk' + (cutIn ? ' hp-dengan-cutin' : '')} {...umum}>
        {cutIn ? <CutIn ep={ep} id={ep.nasabah} ekspresi={p.ekspresi} /> : null}
        <div className="hp-gelembung-kolom">
          <p className="hp-gelembung"><span className="sr-only">{nama}{selaPembicara()}</span>{tx(p.teks)}</p>
          {p.lampiran ? <Lampiran ep={ep} id={p.lampiran} tx={tx} /> : null}
        </div>
      </li>
    );
  }
  if (p.jenis === 'keluar') {
    return (
      <li className="hp-pesan hp-keluar" {...umum}>
        <p className="hp-gelembung"><span className="sr-only">{t('ceritaHp.kamu')}{selaPembicara()}</span>{p.teks ? tx(p.teks) : p.isi}</p>
        <span className="hp-terkirim">{t('ceritaHp.terkirim')}</span>
      </li>
    );
  }
  if (p.jenis === 'catatan') {
    return (
      <li className="hp-catatan" data-topik={p.topik ? '' : undefined} {...umum}>
        <IsiCatatan teks={tx(p.teks)} topik={p.topik ? tx(p.topik) : undefined} utuh={!!p.akibat || !!p.topik} konteks={kini} />
        {p.lampiran ? <Lampiran ep={ep} id={p.lampiran} tx={tx} /> : null}
      </li>
    );
  }
  return (
    <li className="hp-status-catatan" data-arah={p.arah} {...umum}>
      <CatatanStatus nama={nama} sebelum={tx(p.sebelum)} sesudah={tx(p.sesudah)} arah={p.arah} alasan={tx(p.teks)} />
    </li>
  );
}

/**
 * Cut-in potret: potret PIKSEL dekat (wajah x3) ekspresi pesan ini dalam bingkai miring beraksen emas, label "WhatsApp".
 * Tokoh tanpa seni piksel = tanpa cut-in (gelembung tetap utuh).
 */
function CutIn({ ep, id, ekspresi }: { ep: Episode; id: string; ekspresi?: Ekspresi }) {
  const tp = tokohPotret(ep, id);
  if (!tp) return null;
  return (
    <figure className="hp-cutin" data-tokoh={id} data-ekspresi={ekspresi ?? 'netral'} aria-hidden="true">
      <span className="hp-cutin-aksen" />
      <span className="hp-cutin-gambar hp-cutin-piksel"><PotretPikselHp tokoh={tp} ekspresi={ekspresi ?? 'netral'} ukuran={144} label="" className="hp-cutin-potret" /></span>
      <figcaption className="hp-cutin-label">{t('ceritaHp.cutInLabel')}</figcaption>
    </figure>
  );
}

/**
 * Narasi di obrolan: catatan panjang = kalimat pertama + tombol "Detail" (sisa kalimat tetap bisa dibaca). Akibat
 * keputusan dan catatan node yang sedang dimainkan (`utuh`) selalu utuh: fakta yang dibutuhkan untuk memutuskan atau
 * memahami akibat tidak disembunyikan di balik lipatan; hanya catatan lama di utas yang dilipat. `topik` = label di depan.
 */
function IsiCatatan({ teks, topik, utuh = false, konteks = false }: { teks: string; topik?: string; utuh?: boolean; konteks?: boolean }) {
  const [buka, setBuka] = useState(false);
  const r = utuh ? null : ringkasCatatan(teks);
  if (!r) return <p>{topik ? <b className="hp-topik">{topik}</b> : null}{teks}</p>;
  return (
    <>
      <p>{r.awal}{buka ? <> {r.sisa}</> : null}</p>
      <button type="button" className="hp-catatan-detail" aria-expanded={buka} onClick={() => setBuka((b) => !b)}>
        {konteks ? (buka ? t('ceritaHp.tutupKonteks') : t('ceritaHp.konteks')) : buka ? t('ceritaHp.tutupDetail') : t('ceritaHp.detail')}
      </button>
    </>
  );
}

/** Lampiran foto/dokumen di obrolan (gambar kode + judul). */
function Lampiran({ ep, id, tx }: { ep: Episode; id: string; tx: (k: KunciTeks) => string }) {
  const l = ep.lampiran?.[id];
  if (!l) return null;
  return (
    <figure className="hp-lampiran" data-jenis={l.jenis}>
      <GambarSeni ep={ep} id={l.seni} />
      <figcaption>{tx(l.judul)}</figcaption>
    </figure>
  );
}
