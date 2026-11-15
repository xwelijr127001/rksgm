/**
 * PANGGUNG PIKSEL Episode 2 (T-013 Stage 1). Menggambar adegan hasil adapter (adegan.ts) ke SATU <canvas> pada piksel
 * perangkat BULAT per piksel seni: ruang raster (seni/piksel/ruang-ep2.json) + tokoh dari atlas piksel bersama (Miss Raksa
 * Episode 1, Pak Hendra baru) lewat penyusun yang sama (seni/piksel susunTokoh/teleponSisipan), kamera = pasKamera Episode 1
 * (ui/panggung/kamera.ts, opsi piksel bulat). Tanpa CSS blur/filter: tidak ada kotak samar di WebKit (cacat T-012).
 *
 * - Bingkai luar, label lokasi, dan chip status SAMA dengan PanggungLatar (kelas .cer-panggung.cer-latar), jadi tata letak
 *   HP (AdeganTatap: tinggi panggung, pita dialog `ruangBawah`) tidak berubah.
 * - Urutan gambar: latar (z 10) -> teks papan -> tokoh `balikMeja` (Miss Raksa, pinggang ke bawah tertutup) -> meja (z 30) -> prop (z 35)
 *   -> tokoh `depanMeja` (Hendra) -> sisipan telepon (kanan atas). Papan nama: teks runtime (kunci teks lokasi).
 * - Kesiapan: TIDAK memakai gerbang T-010 (D-51..D-55): warna dinding sampai semua PNG adegan (±30 KB) didekode, lalu tampil
 *   sekali; event ADEGAN_SIAP dikirim (pemanas lokasi berikutnya). PNG gagal = `onGagal` (pemakai kembali ke ilustrasi).
 * - Hidup: kedip tiap 3-5 s, mulut bergantian 1,4 s pertama saat tokoh berbicara (hanya bila atlas punya varian bicara).
 *   Gerak dikurangi = tanpa kedip/mulut. Hiasan: aria-hidden; informasi ada di teks dialog.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useReducedMotion } from '../../../../hooks';
import { t } from '../../../../i18n';
import { useDpr } from '../../../../game/tokoh';
import { susunTokoh, teleponSisipan, type SusunanTokoh } from '../../../seni/piksel';
import type { Episode, IdPembicara, KunciTeks } from '../../../tipe';
import { pasKamera, qPiksel, jenisBingkai, type Kamera } from '../../panggung/kamera';
import { gabungKotak, type Kotak } from '../../panggung/dunia';
import { ADEGAN_SIAP } from '../hangatkan';
import { titikTeks } from './hurufPiksel';
import { nasabahDiPanggung, type KomposisiLatar } from '../komposisi';
import type { AdeganPiksel, TokohDiPiksel } from './adegan';
import { RUANG_PIKSEL, SATUAN_RUANG, type RuangPiksel } from './ruang';
import '../../panggung/panggung.css';
import '../latar.css';

const K = SATUAN_RUANG;
/** Perbesaran di atas skala bingkai yang boleh dipakai piksel bulat (Episode 1: 1,25; kantor HP butuh wajah lebih besar). */
const MAKS_LEBIH = 1.6;

// ------------------------------------------------------------------ gambar (cache per dokumen)

const cache = new Map<string, Promise<HTMLImageElement>>();
const siap = new Map<string, HTMLImageElement>();
export function muatPng(url: string): Promise<HTMLImageElement> {
  let p = cache.get(url);
  if (!p) {
    p = new Promise<HTMLImageElement>((ok, gagal) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { (img.decode ? img.decode() : Promise.resolve()).then(() => { siap.set(url, img); ok(img); }, gagal); };
      img.onerror = () => gagal(new Error(`gagal ${url}`));
      img.src = url;
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

// ------------------------------------------------------------------ susunan murni

export interface TokohTersusun {
  t: TokohDiPiksel;
  s: SusunanTokoh;
  /** Pojok kiri-atas frame di dunia. */
  x: number;
  y: number;
}

/** Susun tokoh adegan (pose/arah dari adapter; mata & mulut dari animasi). */
export function susunAdeganPiksel(a: AdeganPiksel, r: RuangPiksel, gerak: { kedip: boolean; mulut: boolean }): TokohTersusun[] {
  const hasil: TokohTersusun[] = [];
  for (const t of a.tokoh) {
    // balikMeja (kantor) bila ruang punya; selain itu slot berdiri ke-i dari n (ruang-ep2.json slot).
    const titik = (t.tempat === 'balikMeja' ? r.tempat.balikMeja : undefined) ?? r.slot[Math.max(1, t.jumlahSlot)]?.[t.slot] ?? r.slot[1]?.[0];
    if (!titik) continue;
    const s = susunTokoh(t.tokoh, {
      pose: t.pose as never, hadap: t.hadap, ekspresi: t.ekspresi,
      mata: gerak.kedip ? 'tutup' : 'buka', mulut: t.bicara && gerak.mulut ? 'buka' : 'tutup',
    });
    if (!s) continue;
    hasil.push({ t, s, x: titik.x - s.jangkar.x * K, y: titik.y - s.jangkar.y * K });
  }
  return hasil;
}

/** Kotak kepala (dunia) tokoh tersusun. */
export function kotakKepalaPiksel(x: TokohTersusun): Kotak {
  const h = x.s.kepalaTinggi * K;
  // + 30 % ke atas: topi/peci tokoh samping (tol, polisi, darto) ikut utuh di bingkai.
  return { x: x.x + x.s.kepala.x * K - h / 2, y: x.y + x.s.kepala.y * K - h * 0.8, w: h, h: h * 1.3 };
}

/** Kamera diam piksel bulat: bingkai ruang per kelas layar, kepala + papan wajib terlihat di atas pita dialog. */
export function kameraPiksel(r: RuangPiksel, tokoh: readonly TokohTersusun[], W: number, H: number, dpr: number, bawah: number): Kamera {
  const kepala = tokoh.map(kotakKepalaPiksel).reduce<Kotak | null>((a, b) => gabungKotak(a, b), null);
  const rect = r.bingkai[jenisBingkai(W)];
  return pasKamera(W, H, rect, kepala, { atas: 0, kiri: 0, kanan: 0, bawah }, { q: qPiksel(dpr), wajib: gabungKotak(r.papan?.kotak ?? null, r.fokus), maksLebih: MAKS_LEBIH });
}

// ------------------------------------------------------------------ komponen

type Ukuran = { w: number; h: number };
function useUkuranKotak(akar: RefObject<HTMLDivElement | null>): Ukuran | null {
  const [ukuran, setUkuran] = useState<Ukuran | null>(null);
  useLayoutEffect(() => {
    const el = akar.current;
    if (!el) return;
    const baca = () => {
      const u = { w: el.clientWidth, h: el.clientHeight };
      if (u.w > 0 && u.h > 0) setUkuran((l) => (l && l.w === u.w && l.h === u.h ? l : u));
    };
    baca();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(baca);
    ro.observe(el);
    return () => ro.disconnect();
  }, [akar]);
  return ukuran;
}

/** Kedip berkala + mulut bergantian sesaat sesudah baris baru (kunciBaris berubah). */
function useGerak(mati: boolean, kunciBaris: string): { kedip: boolean; mulut: boolean } {
  const [kedip, setKedip] = useState(false);
  const [mulut, setMulut] = useState(false);
  useEffect(() => {
    if (mati) return;
    let tm = 0;
    const jadwal = () => { tm = window.setTimeout(() => { setKedip(true); tm = window.setTimeout(() => { setKedip(false); jadwal(); }, 140); }, 3000 + Math.random() * 2000); };
    jadwal();
    return () => { window.clearTimeout(tm); setKedip(false); };
  }, [mati]);
  useEffect(() => {
    if (mati) return;
    let n = 0;
    const iv = window.setInterval(() => { n += 1; setMulut((m) => (n >= 9 ? false : !m)); if (n >= 9) window.clearInterval(iv); }, 160);
    return () => { window.clearInterval(iv); setMulut(false); };
  }, [mati, kunciBaris]);
  return { kedip, mulut };
}

export interface PropsPanggungPiksel {
  ep: Episode;
  komposisi: KomposisiLatar;
  adegan: AdeganPiksel;
  tx: (k: KunciTeks) => string;
  nama: (id: IdPembicara) => string;
  suasana: string | null;
  status?: boolean;
  ruangBawah?: number;
  className?: string;
  /** Ada PNG adegan yang gagal dimuat: pemakai kembali ke panggung ilustrasi. */
  onGagal?: () => void;
}

export function PanggungPiksel({ ep, komposisi, adegan, tx, nama, suasana, status = false, ruangBawah = 0, className = '', onGagal }: PropsPanggungPiksel) {
  const akar = useRef<HTMLDivElement>(null);
  const kanvas = useRef<HTMLCanvasElement>(null);
  const ukuran = useUkuranKotak(akar);
  const dpr = useDpr();
  const kurang = useReducedMotion();
  const r = RUANG_PIKSEL[adegan.ruang]!;
  const kunciBaris = adegan.tokoh.map((x) => `${x.id}:${x.bicara}:${x.ekspresi}`).join('|');
  const gerak = useGerak(kurang, kunciBaris);
  const tokoh = useMemo(() => susunAdeganPiksel(adegan, r, gerak), [adegan, r, gerak]);
  const sisipan = useMemo(() => (adegan.telepon ? teleponSisipan(adegan.telepon.ekspresi, 56, { tokoh: adegan.telepon.tokoh }) : null), [adegan.telepon]);
  const prop = adegan.prop.map((p) => r.prop[p]).filter((x) => !!x);
  const url = useMemo(() => {
    const u = new Set<string>([...r.lapisan.map((l) => l.url), ...prop.map((p) => p.url), ...tokoh.map((x) => x.s.url)]);
    if (sisipan) u.add(sisipan.url);
    return [...u].filter(Boolean);
  }, [r, prop.map((p) => p.url).join(), tokoh.map((x) => x.s.url).join(), sisipan?.url]); // eslint-disable-line react-hooks/exhaustive-deps
  const [siapUrl, setSiapUrl] = useState(() => url.every((u) => siap.has(u)));
  const kunciUrl = url.join('|');
  useEffect(() => {
    if (url.every((u) => siap.has(u))) { setSiapUrl(true); return; }
    let hidup = true;
    setSiapUrl(false);
    Promise.all(url.map(muatPng)).then(() => { if (hidup) setSiapUrl(true); }, () => { if (hidup) onGagal?.(); });
    return () => { hidup = false; };
  }, [kunciUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const papanTeks = r.papan ? tx(r.papan.teksKunci) : '';
  const kamera = ukuran ? kameraPiksel(r, tokoh, ukuran.w, ukuran.h, dpr, ruangBawah) : null;
  useLayoutEffect(() => {
    const c = kanvas.current;
    if (!c || !ukuran || !kamera) return;
    const W = Math.round(ukuran.w * dpr), H = Math.round(ukuran.h * dpr);
    if (c.width !== W) c.width = W;
    if (c.height !== H) c.height = H;
    const g = c.getContext('2d');
    if (!g) return;
    g.imageSmoothingEnabled = false;
    g.fillStyle = r.warnaTepi;
    g.fillRect(0, 0, W, H);
    if (!siapUrl) return;
    const s = kamera.s * dpr; // px perangkat per satuan dunia
    const dx = (x: number) => Math.round((x - kamera.x) * s);
    const dy = (y: number) => Math.round((y - kamera.y) * s);
    const gambar = (u: string, sx: number, sy: number, sw: number, sh: number, wx: number, wy: number, ww: number, wh: number) => {
      const img = siap.get(u);
      if (!img) return;
      g.drawImage(img, sx, sy, sw, sh, dx(wx), dy(wy), dx(wx + ww) - dx(wx), dy(wy + wh) - dy(wy));
    };
    const tokohDi = (tempat: string) => {
      for (const x of tokoh) {
        if (x.t.tempat !== tempat) continue;
        const tubuh = x.s.lapisan[0]!;
        for (const l of x.s.lapisan) {
          gambar(x.s.url, l.sumber.x, l.sumber.y, l.sumber.w, l.sumber.h, x.x + (l.x - tubuh.x) * K, x.y + (l.y - tubuh.y) * K, l.sumber.w * K, l.sumber.h * K);
        }
      }
    };
    for (const l of r.lapisan) {
      if (l.z >= 30 && l.id !== 'latar') break;
      gambar(l.url, 0, 0, l.w / K, l.h / K, l.x, l.y, l.w, l.h);
    }
    if (r.papan && papanTeks) {
      const b = r.papan.kotak;
      g.fillStyle = r.papan.warna;
      // D-88: huruf piksel 3x5 pada skala piksel seni (sama dengan ruang); teks di luar font / terlalu lebar = fillText.
      const tt = titikTeks(papanTeks);
      if (tt && tt.w <= b.w / K - 4) {
        const ax = Math.round(b.x / K + (b.w / K - tt.w) / 2), ay = Math.round(b.y / K + (b.h / K - tt.h) / 2);
        for (const [px, py] of tt.titik) { const wx = (ax + px) * K, wy = (ay + py) * K; g.fillRect(dx(wx), dy(wy), dx(wx + K) - dx(wx), dy(wy + K) - dy(wy)); }
      } else {
      g.font = `700 ${Math.max(8, Math.round(b.h * 0.5 * s))}px system-ui, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(papanTeks, dx(b.x + b.w / 2), dy(b.y + b.h / 2), Math.round(b.w * 0.9 * s));
      }
    }
    tokohDi('balikMeja');
    for (const l of r.lapisan) if (l.z >= 30) gambar(l.url, 0, 0, l.w / K, l.h / K, l.x, l.y, l.w, l.h);
    for (const p of prop) gambar(p.url, 0, 0, p.w / K, p.h / K, p.x, p.y, p.w, p.h);
    tokohDi('slot');
    if (sisipan) {
      // Sisipan telepon: jendela kepala 56 piksel seni, skala bulat ± 34 % tinggi panggung, kanan atas, bingkai gelap.
      const k = Math.max(1, Math.round((H * 0.34) / sisipan.jendela.sisi));
      const sisi = sisipan.jendela.sisi * k;
      const tepi = Math.max(2, Math.round(2 * dpr));
      const x0 = W - sisi - Math.round(10 * dpr) - tepi, y0 = Math.round(10 * dpr) + tepi;
      g.fillStyle = '#1d2a23';
      g.fillRect(x0 - tepi, y0 - tepi, sisi + tepi * 2, sisi + tepi * 2);
      g.fillStyle = '#f3ead2';
      g.fillRect(x0, y0, sisi, sisi);
      g.save();
      g.beginPath();
      g.rect(x0, y0, sisi, sisi);
      g.clip();
      for (const l of sisipan.lapisan) {
        const img = siap.get(sisipan.url);
        if (!img) continue;
        g.drawImage(img, l.sumber.x, l.sumber.y, l.sumber.w, l.sumber.h, x0 + (l.x - sisipan.jendela.x) * k, y0 + (l.y - sisipan.jendela.y) * k, l.sumber.w * k, l.sumber.h * k);
      }
      g.restore();
    }
    window.dispatchEvent(new Event(ADEGAN_SIAP));
  });

  const lok = ep.latar?.lokasi[komposisi.lokasi];
  const wajahNasabah = nasabahDiPanggung(ep, komposisi);
  return (
    <div
      ref={akar}
      className={'cer-panggung cer-latar ' + className}
      data-jenis="latar"
      data-gaya="piksel"
      data-lokasi={komposisi.lokasi}
      data-ruang={adegan.ruang}
      data-hadir={komposisi.hadir.map((x) => x.id).join(' ') || undefined}
      data-telepon={komposisi.telepon?.id}
      data-objek={komposisi.objek.join(' ') || undefined}
      data-k={kamera ? Math.round(kamera.s * qPiksel(dpr)) : undefined}
    >
      <div className="cer-piksel" data-siap={siapUrl ? '' : undefined} aria-hidden="true">
        <canvas ref={kanvas} className="cer-piksel-kanvas" data-pose={tokoh.map((x) => `${x.t.id}:${x.s.pose}:${x.s.hadap}:${x.s.ekspresi}`).join(' ') || undefined} />
      </div>
      {/* Label lokasi hanya untuk ruang KOSONG tanpa papan: dengan tokoh, chip menutupi kepala (wawancara tiga saksi); di kantor
          nama lokasi sudah tertulis di papan. Nama lokasi tetap di narasi/judul bagian. */}
      {lok?.nama && !r.papan && !adegan.tokoh.length ? <p className="cer-latar-lokasi">{tx(lok.nama)}</p> : null}
      {wajahNasabah && suasana !== null ? (
        <p className="cer-suasana" data-ekspresi={wajahNasabah.ekspresi} data-jenis={status ? 'status' : 'wajah'}>
          <span className="sr-only">{t(status ? 'cerita.statusAria' : 'cerita.suasanaAria', { nama: nama(ep.nasabah), suasana })}</span>
          <span aria-hidden="true">{t(status ? 'cerita.statusChip' : 'cerita.suasanaChip', { nama: nama(ep.nasabah), suasana })}</span>
        </p>
      ) : null}
    </div>
  );
}
