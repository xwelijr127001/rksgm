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
import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { t } from '../../../i18n';
import type { Episode, IdPembicara, KunciTeks, LokasiIlustrasi, PapanIlustrasi } from '../../tipe';
import { GambarSeni, ImgIlustrasi, useGambarSiap } from '../gambarIlustrasi';
import { dekatTokoh, kaburLatar, kotakTokohIlustrasi, letakBerdiri, potonganIlustrasi, potonganSubjek, type Kotak, type LapisBerdiri } from './ilustrasi';
import { nasabahDiPanggung, type KomposisiLatar, type TokohLatar } from './komposisi';
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
}

type Ukuran = { w: number; h: number };

/** Tinggi pita label lokasi/status di atas panggung (px CSS) yang tidak boleh menutupi kepala tokoh berdiri. */
const PITA_LABEL = 38;

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

export function PanggungLatar({ ep, komposisi, tx, nama, suasana, status = false, className = '', ruangBawah = 0 }: PropsPanggungLatar) {
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
      {ukuran && lok ? <AdeganIlustrasi key={komposisi.lokasi} ep={ep} lok={lok.ilustrasi} komposisi={komposisi} ukuran={ukuran} tx={tx} nama={nama} ruangBawah={ruangBawah} /> : null}
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

function AdeganIlustrasi({ ep, lok, komposisi, ukuran, tx, nama, ruangBawah }: {
  ep: Episode;
  lok: LokasiIlustrasi;
  komposisi: KomposisiLatar;
  ukuran: Ukuran;
  tx: (k: KunciTeks) => string;
  nama: (id: IdPembicara) => string;
  ruangBawah: number;
}) {
  const berdiri = letakBerdiri(ep, lok, komposisi);
  const pot = lok.tokoh.jenis === 'berdiri'
    ? potonganSubjek(lok, ukuran.w, ukuran.h, berdiri.subjek, berdiri.bebasLabel, PITA_LABEL, ruangBawah)
    : potonganIlustrasi(lok, ukuran.w, ukuran.h);
  const s = ukuran.w / pot.w;
  const lebar = lok.w * s;
  // Bidikan yang memperbesar latar melewati berkas terbesarnya: latar & lapisan depan dikaburkan lembut (tokoh tetap tajam).
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const kabur = kaburLatar((lebar * dpr) / Math.max(...lok.latar.map((v) => v.w)));
  const gayaLatar = kabur ? { filter: `blur(${kabur}px)` } : undefined;
  const tokoh = lok.tokoh;
  const n = Math.min(3, komposisi.hadir.length) as 0 | 1 | 2 | 3;
  return (
    <div
      className="cer-ilustrasi"
      data-susun={lok.tokoh.jenis}
      data-ada-bicara={komposisi.hadir.some((x) => x.bicara) ? '' : undefined}
      data-kamera={`${Math.round(pot.x)} ${Math.round(pot.y)} ${Math.round(pot.w)} ${Math.round(pot.h)}`}
      style={{ width: lebar, height: lok.h * s, transform: `translate(${-pot.x * s}px, ${-pot.y * s}px)` }}
      aria-hidden="true"
    >
      <ImgIlustrasi className="cer-ilustrasi-lapis" varian={lok.latar} sizes={`${Math.round(lebar)}px`} prioritas style={gayaLatar} data={{ lapis: 'latar', kabur: kabur ? String(kabur) : undefined }} />
      {(lok.tiang ?? []).map((k, i) => <div key={i} className="cer-ilustrasi-tiang" style={gayaKotak(lok, k)} />)}
      {(lok.papan ?? []).map((p, i) => <Papan key={i} lok={lok} p={p} skala={s} tx={tx} />)}
      {tokoh.jenis === 'dekat'
        ? komposisi.hadir.slice(0, 3).map((tk, i) => (
          <TokohDekat key={tk.id} ep={ep} lok={lok} tk={tk} x={(n ? tokoh.slot[n] : [])[i]!} skala={s} nama={nama(tk.id)} />
        ))
        : berdiri.lapis.map((l, i) => <LapisAdegan key={l.jenis === 'tokoh' ? l.tokoh.id : `benda-${i}`} lok={lok} l={l} skala={s} nama={nama} />)}
      {lok.depan ? <ImgIlustrasi className="cer-ilustrasi-lapis" varian={lok.depan} sizes={`${Math.round(lebar)}px`} prioritas style={gayaLatar} data={{ lapis: 'depan', kabur: kabur ? String(kabur) : undefined }} /> : null}
      {/* Benda akibat berdiri DI ATAS meja / di depan papan: sesudah lapisan depan. */}
      {komposisi.objek.map((id) => {
        const o = lok.objek?.[id];
        const seni = o ? ep.seniArena?.[o.seni] : undefined;
        if (!o || !seni) return null;
        return <GambarSeni key={id} ep={ep} id={o.seni} className="cer-ilustrasi-objek" style={gayaKotak(lok, { x: o.x, y: o.y, w: o.w, h: (o.w * seni.h) / seni.w })} />;
      })}
    </div>
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
      data={{ tokoh: tk.id, ekspresi: tk.ekspresi, bicara: tk.bicara ? '' : undefined }}
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

