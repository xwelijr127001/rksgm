/**
 * PANGGUNG LATAR (episode dengan `Episode.latar`, mis. Episode 2). Setiap lokasi = gambar ILUSTRASI (`LokasiIlustrasi`)
 * dalam lapisan HTML berkoordinat persen dari gambar sumber, satu bingkai `.cer-panggung`:
 *
 *   latar -> tiang & papan (kode: tulisan tajam) -> benda & tokoh (urut kedalaman) -> `depan` (meja dari gambar yang sama)
 *   -> benda akibat keputusan; label lokasi & status = teks UI di atas panggung. Nama & peran pembicara ada di kotak dialog
 *   (bukan papan nama permanen di gambar).
 * - Gaya visual novel: pembicara aktif disorot halus (yang lain sedikit diredupkan); di lapangan kamera mengikuti pembicara
 *   setengah badan, badan penuh saat narasi (ilustrasi.ts letakBerdiri). `ruangBawah` = pita bawah yang ditumpangi kotak
 *   dialog: subjek dibingkai di atasnya.
 *
 * - Tokoh `dekat` (kantor): gambar dekat ekspresinya di BALIK meja, diskalakan menurut tinggi kepala; kamera = potongan tetap
 *   per kelas layar (ilustrasi.ts potonganIlustrasi: HP tegak lebih dekat ke tokoh, layar lebar hampir seluruh ruangan).
 * - Tokoh `berdiri` (lapangan: pool, bengkel, tol, ruang wawancara): badan penuh berpijak di lantai menurut perspektif
 *   gambar; truk trailer = benda berkedalaman (tokoh di depan/belakangnya menurut letak kaki). Kamera MENGIKUTI SUBJEK
 *   (potonganSubjek): tokoh, kepala truk, papan wajib; kepala tidak pernah di bawah pita label lokasi.
 *
 * Gambar halus (bukan pixelated), resolusi berkas mengikuti ukuran tampil x DPR (srcset), dimuat saat dipakai.
 * Presentasi, bukan gameplay: komposisi dari `komposisiLatar(ep, state)` (murni); panggung tidak menulis state. Hiasan
 * (aria-hidden); semua informasi ada di teks. Aset tidak ada / gagal dimuat = siluet bernama di tempat yang sama. Lawan
 * bicara jarak jauh (telepon) tidak digambar di panggung: obrolannya tampil di antarmuka HP. Gerak dikurangi: tanpa pudar.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { t } from '../../../i18n';
import type { Episode, IdPembicara, KunciTeks, LokasiIlustrasi, PapanIlustrasi } from '../../tipe';
import { GambarSeni, ImgIlustrasi, useGambarSiap } from '../gambarIlustrasi';
import { dekatTokoh, kaburLatar, kotakTokohIlustrasi, type Kotak, type LapisBerdiri } from './ilustrasi';
import { ADEGAN_SIAP, catatCocok, ukuranDunia } from './hangatkan';
import { useDpr } from '../../../game/tokoh';
import { nasabahDiPanggung, type KomposisiLatar, type TokohLatar } from './komposisi';
import { adeganPiksel } from './piksel/adegan';
import { PanggungPiksel } from './piksel/PanggungPiksel';
import '../panggung/panggung.css';
import './latar.css';

export interface PropsPanggungLatar {
  ep: Episode;
  komposisi: KomposisiLatar;
  tx: (k: KunciTeks) => string;
  /** Nama tampilan pemeran (untuk siluet cadangan). */
  nama: (id: IdPembicara) => string;
  /** Label suasana nasabah ("Cemas"); null = tanpa label (kartu episode). */
  suasana: string | null;
  /** true = label itu status hubungan kumulatif (Episode.labelSuasana 'status'), ditulis "Status …". */
  status?: boolean;
  /** Kelas tambahan (mis. kartu episode). */
  className?: string;
  /** Pita bawah panggung (px CSS) yang ditumpangi kotak dialog; tokoh lapangan dibingkai di atasnya. */
  ruangBawah?: number;
  /**
   * (T-010 G1, D-51..D-55) Adegan cerita yang sedang dimainkan: lapisan wajib (latar, depan, tokoh/benda awal) disembunyikan
   * di atas gambar mini kabur ruangan sampai SEMUA selesai dimuat & di-decode (atau gagal / batas 6 s), lalu tampil
   * bersama SEKALI. Bawaan false: kartu episode, aktivitas, dll. tetap seperti sebelumnya.
   */
  gerbang?: boolean;
}

type Ukuran = { w: number; h: number };


/** Ukuran kotak panggung (piksel CSS), diukur sebelum digambar dan saat berubah. */
function useUkuranKotak(akar: RefObject<HTMLDivElement | null>): Ukuran | null {
  const [ukuran, setUkuran] = useState<Ukuran | null>(null);
  useLayoutEffect(() => {
    const el = akar.current;
    if (!el) return;
    const baca = () => {
      const u = { w: el.clientWidth, h: el.clientHeight };
      if (u.w > 0 && u.h > 0) setUkuran((l) => (l && Math.abs(l.w - u.w) < 1 && Math.abs(l.h - u.h) < 1 ? l : u));
    };
    baca();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(baca);
    ro.observe(el);
    return () => ro.disconnect();
  }, [akar]);
  return ukuran;
}

/**
 * T-013: pintu masuk panggung Episode 2 untuk SEMUA pemakai (adegan HP, aktivitas, kartu episode, halaman cerita lebar).
 * Komposisi yang bisa dipetakan adapter (piksel/adegan.ts) = PanggungPiksel; selain itu (atau PNG piksel gagal) = panggung
 * ilustrasi di bawah, tidak berubah. Stage 2: semua lokasi AUTO-2 berpiksel.
 */
export function PanggungLatar(p: PropsPanggungLatar) {
  const [gagal, setGagal] = useState(false);
  const piksel = gagal ? null : adeganPiksel(p.ep, p.komposisi).piksel;
  if (piksel) {
    return <PanggungPiksel ep={p.ep} komposisi={p.komposisi} adegan={piksel} tx={p.tx} nama={p.nama} suasana={p.suasana} status={p.status} ruangBawah={p.ruangBawah} className={p.className} onGagal={() => setGagal(true)} />;
  }
  return <PanggungLatarIlustrasi {...p} />;
}

export function PanggungLatarIlustrasi({ ep, komposisi, tx, nama, suasana, status = false, className = '', ruangBawah = 0, gerbang = false }: PropsPanggungLatar) {
  const akar = useRef<HTMLDivElement>(null);
  const ukuran = useUkuranKotak(akar);
  const lok = ep.latar?.lokasi[komposisi.lokasi];
  const nasabah = ep.nasabah;
  const wajahNasabah = nasabahDiPanggung(ep, komposisi);
  return (
    <div
      ref={akar}
      className={'cer-panggung cer-latar ' + className}
      data-jenis="latar"
      data-gaya="ilustrasi"
      data-lokasi={komposisi.lokasi}
      data-hadir={komposisi.hadir.map((x) => x.id).join(' ') || undefined}
      data-telepon={komposisi.telepon?.id}
      data-objek={komposisi.objek.join(' ') || undefined}
    >
      {ukuran && lok ? <AdeganIlustrasi key={komposisi.lokasi} ep={ep} lok={lok.ilustrasi} komposisi={komposisi} ukuran={ukuran} tx={tx} nama={nama} ruangBawah={ruangBawah} gerbang={gerbang} /> : null}
      {lok?.nama ? <p className="cer-latar-lokasi">{tx(lok.nama)}</p> : null}
      {wajahNasabah && suasana !== null ? (
        <p className="cer-suasana" data-ekspresi={wajahNasabah.ekspresi} data-jenis={status ? 'status' : 'wajah'}>
          <span className="sr-only">{t(status ? 'cerita.statusAria' : 'cerita.suasanaAria', { nama: nama(nasabah), suasana })}</span>
          <span aria-hidden="true">{t(status ? 'cerita.statusChip' : 'cerita.suasanaChip', { nama: nama(nasabah), suasana })}</span>
        </p>
      ) : null}
    </div>
  );
}

/** Kotak (piksel sumber) -> posisi CSS relatif adegan (persen), tidak bergantung ukuran layar. */
const gayaKotak = (lok: LokasiIlustrasi, k: Kotak): CSSProperties => ({
  left: `${(k.x / lok.w) * 100}%`, top: `${(k.y / lok.h) * 100}%`, width: `${(k.w / lok.w) * 100}%`, height: `${(k.h / lok.h) * 100}%`,
});

/** Batas tunggu grup (D-54): sesudahnya yang sudah siap tampil, gambar mini tetap di bawah yang belum. */
const BATAS_GRUP_MS = 6000;
/** Gambar mini & pil dilepas sesudah pudar 240 ms (D-53). */
const LEPAS_MS = 300;

type StatusGrup = { siap: boolean; latarOk: boolean };

/** Deskriptor gambar wajib: berkas yang benar-benar diminta (srcset + sizes + src) per lapisan. */
const deskriptor = (img: HTMLImageElement) =>
  `${img.dataset.lapis ?? img.dataset.tokoh ?? '?'}:${img.getAttribute('srcset') ?? ''}|${img.getAttribute('sizes') ?? ''}|${img.getAttribute('src') ?? ''}`;

/**
 * Kesiapan grup lapisan adegan (T-010 G1; perbaikan R-11/R-12).
 * - WAJIB = semua <img> di dunia saat itu (latar, depan, tokoh & benda yang tampil; lapisan tak ada / siluet = tidak ditunggu),
 *   dikunci dengan DESKRIPTOR NYATA tiap gambar (srcset/sizes/src) + DPR + kunci React (lebar, tokoh:ekspresi, objek). Pergantian
 *   ekspresi yang masih MENUNGGU decode (TokohDekat `data-menunggu`) menahan grup: gambar lama tidak boleh membuat grup siap.
 * - Deskriptor berubah sebelum siap (ganti ekspresi selesai, DPR/ukuran berubah, lapisan dilepas) = generasi baru; hasil generasi
 *   lama diabaikan. Sesudah siap tidak pernah kembali tersembunyi.
 * - Tiap gambar: load + decode() BERHASIL + naturalWidth > 0 = siap; error ATAU decode ditolak = GAGAL. Gambar gagal yang bukan
 *   latar diberi event 'error' supaya pemiliknya memakai cadangan (tokoh -> siluet, depan -> dihilangkan, benda -> dihilangkan).
 *   Latar gagal = `latarOk` false (gambar mini tetap menjadi ruangan). Latar yang berhasil belakangan tetap mengganti gambar mini.
 * - Batas 6 s sejak mulai (tidak diulang saat generasi baru).
 */
function useGrupSiap(dunia: RefObject<HTMLDivElement | null>, aktif: boolean, kunci: string): StatusGrup {
  const [st, setSt] = useState<StatusGrup>({ siap: !aktif, latarOk: !aktif });
  const siapRef = useRef(!aktif);
  const latarOkRef = useRef(false);
  const mulaiRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = dunia.current;
    if (!aktif || !el) return;
    mulaiRef.current ??= performance.now();
    let gen = 0;
    let kunciDom = '';
    let lepas: (() => void)[] = [];
    let mati = false;
    const bersihkan = () => { lepas.forEach((f) => f()); lepas = []; };
    const tetapkan = (latarOk: boolean) => { latarOkRef.current = latarOk; setSt({ siap: siapRef.current, latarOk }); };
    const bacaKunci = () => [...el.querySelectorAll('img')].map(deskriptor).join('#') + (el.querySelector('[data-menunggu]') ? '#menunggu' : '');
    const mulai = () => {
      bersihkan();
      const g = ++gen;
      const imgs = [...el.querySelectorAll('img')];
      const menunggu = el.querySelector('[data-menunggu]') !== null;
      kunciDom = bacaKunci();
      const latar = el.querySelector<HTMLImageElement>('img[data-lapis="latar"]');
      let sisa = imgs.length;
      const selesaiSatu = (img: HTMLImageElement, ok: boolean) => {
        if (mati || g !== gen) return; // generasi lama / dilepas: abaikan
        if (!ok && img !== latar) img.dispatchEvent(new Event('error')); // pemilik memakai cadangannya
        if (img === latar) {
          latarOkRef.current = ok;
          if (siapRef.current) { tetapkan(ok); return; }
        }
        sisa -= 1;
        if (sisa <= 0 && !menunggu && !siapRef.current) { siapRef.current = true; tetapkan(latarOkRef.current); }
      };
      const tunggu = (img: HTMLImageElement) => {
        let sekali = false;
        const decode = () => {
          if (sekali) return; sekali = true;
          if (!(img.naturalWidth > 0)) { selesaiSatu(img, false); return; }
          img.decode().then(() => selesaiSatu(img, img.naturalWidth > 0), () => selesaiSatu(img, false));
        };
        const gagal = () => { if (sekali) return; sekali = true; selesaiSatu(img, false); };
        img.addEventListener('load', decode);
        img.addEventListener('error', gagal);
        lepas.push(() => { img.removeEventListener('load', decode); img.removeEventListener('error', gagal); });
        if (img.complete && img.getAttribute('src')) decode();
      };
      if (!imgs.length && !menunggu && !siapRef.current) { siapRef.current = true; tetapkan(false); }
      imgs.forEach(tunggu);
    };
    mulai();
    // Deskriptor berubah sebelum siap = generasi baru; sesudah siap hanya latar yang belum berhasil yang dipantau lagi.
    const obs = new MutationObserver(() => {
      if (bacaKunci() === kunciDom) return;
      if (!siapRef.current || !latarOkRef.current) mulai();
    });
    obs.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'srcset', 'sizes', 'data-menunggu'] });
    const batas = window.setTimeout(() => {
      if (mati || siapRef.current) return;
      siapRef.current = true;
      tetapkan(latarOkRef.current);
    }, Math.max(0, BATAS_GRUP_MS - (performance.now() - mulaiRef.current)));
    return () => { mati = true; obs.disconnect(); window.clearTimeout(batas); bersihkan(); };
  }, [dunia, aktif, kunci]);
  return st;
}

/** Nilai yang menjadi true LEPAS_MS sesudah `aktif` true (gambar mini & pil dilepas sesudah pudar). */
function useSesudah(aktif: boolean): boolean {
  const [lewat, setLewat] = useState(false);
  useEffect(() => {
    if (!aktif) { setLewat(false); return; }
    const id = window.setTimeout(() => setLewat(true), LEPAS_MS);
    return () => window.clearTimeout(id);
  }, [aktif]);
  return lewat;
}

function AdeganIlustrasi({ ep, lok, komposisi, ukuran, tx, nama, ruangBawah, gerbang }: {
  ep: Episode;
  lok: LokasiIlustrasi;
  komposisi: KomposisiLatar;
  ukuran: Ukuran;
  tx: (k: KunciTeks) => string;
  nama: (id: IdPembicara) => string;
  ruangBawah: number;
  gerbang: boolean;
}) {
  const dunia = useRef<HTMLDivElement>(null);
  // Perhitungan kamera tidak berubah; dipindah ke hangatkan.ts supaya pemanasan memakai angka yang sama (T-010 G3).
  const { berdiri, pot, s, lebar } = ukuranDunia(ep, lok, komposisi, ukuran.w, ukuran.h, ruangBawah);
  // Bidikan yang memperbesar latar melewati berkas terbesarnya: latar & lapisan depan dikaburkan lembut (tokoh tetap tajam).
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const kabur = kaburLatar((lebar * dpr) / Math.max(...lok.latar.map((v) => v.w)));
  const gayaLatar = kabur ? { filter: `blur(${kabur}px)` } : undefined;
  const tokoh = lok.tokoh;
  const n = Math.min(3, komposisi.hadir.length) as 0 | 1 | 2 | 3;
  // R-11: + DPR (pilihan varian srcset) + objek; deskriptor gambar nyata dibaca dari DOM oleh useGrupSiap.
  const dprGrup = useDpr();
  const kunciGrup = `${Math.round(lebar)}|${dprGrup}|${komposisi.hadir.map((x) => x.id + ':' + x.ekspresi).join(',')}|${komposisi.objek.join(',')}`;
  // R-12: lapisan depan yang gagal (404 / decode ditolak) DIHILANGKAN dari adegan.
  const [depanGagal, setDepanGagal] = useState(false);
  const grup = useGrupSiap(dunia, gerbang, kunciGrup);
  // Gambar mini tetap selama latar belum siap (gagal / masih dimuat sesudah batas): ruangan tidak pernah kotak polos.
  const latarGagal = gerbang && grup.siap && !grup.latarOk;
  const lepasMini = useSesudah(gerbang && grup.siap && grup.latarOk);
  const lepasPil = useSesudah(gerbang && grup.siap);
  useEffect(() => {
    if (gerbang && grup.siap) window.dispatchEvent(new Event(ADEGAN_SIAP));
  }, [gerbang, grup.siap]);
  useEffect(() => {
    if (!gerbang || !grup.latarOk) return;
    const img = dunia.current?.querySelector<HTMLImageElement>('img[data-lapis="latar"]');
    if (img?.currentSrc) catatCocok(lok.latar, `${Math.round(lebar)}px`, img.currentSrc);
  }, [gerbang, grup.latarOk, lok.latar, lebar]);
  const mini = gerbang && lok.kabur && !lepasMini
    ? <div className="cer-ilustrasi-kabur" style={{ backgroundImage: `url(${lok.kabur})` }} />
    : null;
  return (
    <>
    <div
      ref={dunia}
      className="cer-ilustrasi"
      data-gerbang={gerbang ? '' : undefined}
      data-siap={gerbang && grup.siap ? '' : undefined}
      data-gagal-latar={latarGagal ? '' : undefined}
      data-susun={lok.tokoh.jenis}
      data-ada-bicara={komposisi.hadir.some((x) => x.bicara) ? '' : undefined}
      data-kamera={`${Math.round(pot.x)} ${Math.round(pot.y)} ${Math.round(pot.w)} ${Math.round(pot.h)}`}
      style={{ width: lebar, height: lok.h * s, transform: `translate(${-pot.x * s}px, ${-pot.y * s}px)` }}
      aria-hidden="true"
    >
      {mini}
      <ImgIlustrasi className="cer-ilustrasi-lapis" varian={lok.latar} sizes={`${Math.round(lebar)}px`} prioritas style={gayaLatar} data={{ lapis: 'latar', kabur: kabur ? String(kabur) : undefined }} />
      {(lok.tiang ?? []).map((k, i) => <div key={i} className="cer-ilustrasi-tiang" style={gayaKotak(lok, k)} />)}
      {(lok.papan ?? []).map((p, i) => <Papan key={i} lok={lok} p={p} skala={s} tx={tx} />)}
      {tokoh.jenis === 'dekat'
        ? komposisi.hadir.slice(0, 3).map((tk, i) => (
          <TokohDekat key={tk.id} ep={ep} lok={lok} tk={tk} x={(n ? tokoh.slot[n] : [])[i]!} skala={s} nama={nama(tk.id)} />
        ))
        : berdiri.lapis.map((l, i) => <LapisAdegan key={l.jenis === 'tokoh' ? l.tokoh.id : `benda-${i}`} lok={lok} l={l} skala={s} nama={nama} />)}
      {lok.depan && !(gerbang && depanGagal) ? <ImgIlustrasi className="cer-ilustrasi-lapis" varian={lok.depan} sizes={`${Math.round(lebar)}px`} prioritas style={gayaLatar} data={{ lapis: 'depan', kabur: kabur ? String(kabur) : undefined }} onGagal={gerbang ? () => setDepanGagal(true) : undefined} /> : null}
      {/* Benda akibat berdiri DI ATAS meja / di depan papan: sesudah lapisan depan. */}
      {komposisi.objek.map((id) => {
        const o = lok.objek?.[id];
        const seni = o ? ep.seniArena?.[o.seni] : undefined;
        if (!o || !seni) return null;
        return <GambarSeni key={id} ep={ep} id={o.seni} className="cer-ilustrasi-objek" style={gayaKotak(lok, { x: o.x, y: o.y, w: o.w, h: (o.w * seni.h) / seni.w })} />;
      })}
    </div>
    {/* Pil "Menyiapkan adegan…" (D-51): hiasan; dialog & tombol tidak menunggu. Hilang saat siap ATAU gagal. */}
    {gerbang && !lepasPil ? (
      <p className="cer-adegan-memuat" aria-hidden="true" data-selesai={grup.siap ? '' : undefined}><i><b /><b /><b /></i>{t('layar.menyiapkanAdegan')}</p>
    ) : null}
    </>
  );
}

/** Siluet bernama pengganti tokoh tanpa aset / gagal dimuat (kotak piksel sumber). */
function Siluet({ lok, k, id, nama }: { lok: LokasiIlustrasi; k: Kotak; id: string; nama: string }) {
  return <div className="cer-ilustrasi-siluet" data-tokoh={id} style={gayaKotak(lok, k)}><span>{nama}</span></div>;
}

/** Tokoh di balik meja: gambar dekat ekspresinya; gambar & kotaknya berganti bersama setelah gambar baru siap. */
function TokohDekat({ ep, lok, tk, x, skala, nama }: { ep: Episode; lok: LokasiIlustrasi; tk: TokohLatar; x: number; skala: number; nama: string }) {
  const g = dekatTokoh(ep, tk.id, tk.ekspresi);
  const [gagal, setGagal] = useState(false);
  const t0 = lok.tokoh.jenis === 'dekat' ? lok.tokoh : null;
  const baru = g && t0 ? { g, k: kotakTokohIlustrasi(t0, g, x) } : null;
  const sizes = baru ? `${Math.round(baru.k.w * skala)}px` : '0px';
  const tampil = useGambarSiap(baru, baru?.g.varian ?? [], sizes);
  // R-11: ekspresi baru diminta tetapi gambar lama masih tampil sampai yang baru ter-decode: grup adegan menunggu.
  const menunggu = baru !== null && tampil !== baru;
  if (!t0) return null;
  if (!tampil || gagal) {
    const k = { x: x - t0.tinggiKepala * 0.9, y: t0.atasKepala, w: t0.tinggiKepala * 1.8, h: lok.h - t0.atasKepala };
    return <Siluet lok={lok} k={k} id={tk.id} nama={nama} />;
  }
  return (
    <ImgIlustrasi
      className="cer-ilustrasi-tokoh"
      varian={tampil.g.varian}
      sizes={`${Math.round(tampil.k.w * skala)}px`}
      style={gayaKotak(lok, tampil.k)}
      prioritas
      data={{ tokoh: tk.id, ekspresi: tk.ekspresi, bicara: tk.bicara ? '' : undefined, menunggu: menunggu ? '' : undefined }}
      onGagal={() => setGagal(true)}
    />
  );
}

/** Satu lapisan lokasi berdiri: benda (truk) atau tokoh badan penuh (siluet bila tanpa aset / gagal dimuat). */
function LapisAdegan({ lok, l, skala, nama }: { lok: LokasiIlustrasi; l: LapisBerdiri; skala: number; nama: (id: IdPembicara) => string }) {
  const [gagal, setGagal] = useState(false);
  const sizes = `${Math.round(l.kotak.w * skala)}px`;
  if (l.jenis === 'benda') {
    return gagal ? null : (
      <ImgIlustrasi className="cer-ilustrasi-benda" varian={l.benda.varian} sizes={sizes} style={gayaKotak(lok, l.kotak)} prioritas data={{ lapis: 'benda' }} onGagal={() => setGagal(true)} />
    );
  }
  const tk = l.tokoh;
  // Bayangan kontak di bawah kaki: tokoh menapak lantai gambar, tidak melayang.
  const bayang = { x: l.kotak.x + l.kotak.w * 0.1, y: l.kotak.y + l.kotak.h * 0.975, w: l.kotak.w * 0.8, h: l.kotak.h * 0.04 };
  return (
    <>
      <div className="cer-ilustrasi-bayang" style={gayaKotak(lok, bayang)} />
      {!l.badan || gagal ? <Siluet lok={lok} k={l.kotak} id={tk.id} nama={nama(tk.id)} /> : (
        <ImgIlustrasi
          className="cer-ilustrasi-tokoh"
          varian={l.badan.varian}
          sizes={sizes}
          style={gayaKotak(lok, l.kotak)}
          prioritas
          data={{ tokoh: tk.id, ekspresi: tk.ekspresi, bicara: tk.bicara ? '' : undefined }}
          onGagal={() => setGagal(true)}
        />
      )}
    </>
  );
}

/** Papan bertulisan (teks HTML tajam, ukuran huruf ikut skala adegan). */
function Papan({ lok, p, skala, tx }: { lok: LokasiIlustrasi; p: PapanIlustrasi; skala: number; tx: (k: KunciTeks) => string }) {
  return (
    <div
      className="cer-ilustrasi-papan"
      data-latar={p.latar ? '' : undefined}
      style={{
        ...gayaKotak(lok, p.kotak),
        ...(p.latar ? { backgroundColor: p.latar, borderColor: p.tepi ?? p.latar, borderWidth: Math.max(1, 5 * skala) } : {}),
      }}
    >
      {p.baris.map((b) => (
        <span key={b.teks} style={{ fontSize: b.ukuran * skala, color: b.warna, fontWeight: b.tebal ?? 700 }}>{tx(b.teks)}</span>
      ))}
    </div>
  );
}

