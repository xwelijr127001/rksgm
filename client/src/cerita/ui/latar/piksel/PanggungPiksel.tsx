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
import { susunTokoh, teleponSisipan } from '../../../seni/piksel';
import type { Episode, IdPembicara, KunciTeks } from '../../../tipe';
import { qPiksel } from '../../panggung/kamera';
import { DUNIA_H, DUNIA_W, type Kotak } from '../../panggung/dunia';
import { ADEGAN_SIAP } from '../hangatkan';
import { titikTeks } from './hurufPiksel';
import { titikPapanKantor } from './papan';
import { muatPng, siap } from './muat';
import { SENI_TELEPON, useTeleponTangan } from './teleponTangan';
import { nasabahDiPanggung, type KomposisiLatar } from '../komposisi';
import type { AdeganPiksel } from './adegan';
import { kameraPiksel, kotakLuarSisipan, langkahJalan, LANGKAH_JALAN_MS, POSE_JALAN_MAKS, posisiJalan, punyaJalan, rencanaJalan, sisipanAdegan, susunAdeganPiksel } from './tata';
import { RUANG_PIKSEL, SATUAN_RUANG } from './ruang';
import '../../panggung/panggung.css';
import '../latar.css';

const K = SATUAN_RUANG;
export * from './tata';

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

/**
 * D-96: hidup di luar kantor, semuanya MATI saat gerak dikurangi. `lompat` = pembicara naik 2 piksel seni 160 md saat mulai
 * berbicara; `napas` = pembicara naik 1 piksel seni bergantian tiap 1,2 d (T-016: tanpa pembicara = SEMUA tokoh slot bernapas,
 * selang-seling per slot, supaya adegan narasi tidak beku); `masuk` = tokoh yang baru bergabung meluncur dari
 * tepi terdekat 180 md (p 0..1; bukan pada pemasangan pertama panggung).
 */
function useHidup(mati: boolean, pembicara: string, hadir: string): { lompat: boolean; napas: boolean; masuk: { id: Set<string>; p: number } | null } {
  const [lompat, setLompat] = useState(false);
  const [napas, setNapas] = useState(false);
  const [masuk, setMasuk] = useState<{ id: Set<string>; p: number } | null>(null);
  const lama = useRef<{ pembicara: string; hadir: string } | null>(null);
  useEffect(() => {
    const sebelum = lama.current;
    lama.current = { pembicara, hadir };
    if (mati || !sebelum) return;
    const bersih: (() => void)[] = [];
    if (pembicara && pembicara !== sebelum.pembicara) {
      setLompat(true);
      const tm = window.setTimeout(() => setLompat(false), 160);
      bersih.push(() => { window.clearTimeout(tm); setLompat(false); });
    }
    const dulu = new Set(sebelum.hadir.split(' '));
    const baru = hadir.split(' ').filter((x) => x && !dulu.has(x));
    if (baru.length) {
      const id = new Set(baru);
      const t0 = performance.now();
      let raf = 0;
      const langkah = () => {
        const p = Math.min(1, (performance.now() - t0) / 180);
        setMasuk(p >= 1 ? null : { id, p });
        if (p < 1) raf = requestAnimationFrame(langkah);
      };
      setMasuk({ id, p: 0 });
      raf = requestAnimationFrame(langkah);
      bersih.push(() => { cancelAnimationFrame(raf); setMasuk(null); });
    }
    return () => bersih.forEach((fn) => fn());
  }, [mati, pembicara, hadir]);
  useEffect(() => {
    // T-016: napas juga berjalan saat TIDAK ada pembicara (baris narasi: pool, bengkel), asal ada tokoh di panggung.
    if (mati || !hadir) return;
    const iv = window.setInterval(() => setNapas((n) => !n), 1200);
    return () => { window.clearInterval(iv); setNapas(false); };
  }, [mati, !hadir]); // eslint-disable-line react-hooks/exhaustive-deps
  return { lompat, napas, masuk };
}

/** T-017: tokoh yang SUDAH tiba di ruang ('<ruang>:<id>'), lintas pasang-ulang panggung (aktivitas, obrolan): tidak jalan lagi. */
const sudahTiba = new Set<string>();

/**
 * T-017 (D-104): jalan masuk tokoh yang punya bingkai jalan, setiap kali ia baru hadir di ruang (termasuk panggung/ruang yang
 * baru dipasang). Mengembalikan { id, t } selama berjalan (t md sejak mulai), null bila tidak. Jam baru mulai saat PNG siap.
 * Gerak dikurangi = tidak pernah jalan (langsung berdiri). `kunciLangkah` berganti (pemain menekan Lanjut) = langsung berdiri.
 */
function useJalan(mati: boolean, siapGambar: boolean, ruang: string, pejalan: string, kunciLangkah: string | undefined): { id: Set<string>; t: number } | null {
  const [jalan, setJalan] = useState<{ id: Set<string>; t: number } | null>(null);
  const langkahMulai = useRef<string | undefined>(undefined);
  const raf = useRef(0);
  useLayoutEffect(() => {
    const hadir = pejalan.split(' ').filter(Boolean);
    for (const k of [...sudahTiba]) if (k.startsWith(ruang + ':') && !hadir.includes(k.slice(ruang.length + 1))) sudahTiba.delete(k);
    if (!siapGambar) return;
    const baru = hadir.filter((id) => !sudahTiba.has(ruang + ':' + id));
    for (const id of hadir) sudahTiba.add(ruang + ':' + id);
    if (mati || !baru.length) return;
    const id = new Set(baru);
    const t0 = performance.now();
    langkahMulai.current = kunciLangkah;
    const langkah = () => {
      const t = performance.now() - t0;
      if (t >= POSE_JALAN_MAKS * LANGKAH_JALAN_MS) { setJalan(null); return; }
      setJalan({ id, t });
      raf.current = requestAnimationFrame(langkah);
    };
    setJalan({ id, t: 0 });
    raf.current = requestAnimationFrame(langkah);
    return () => { cancelAnimationFrame(raf.current); setJalan(null); };
  }, [mati, siapGambar, ruang, pejalan]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (jalan && kunciLangkah !== langkahMulai.current) { cancelAnimationFrame(raf.current); setJalan(null); }
  }, [kunciLangkah]); // eslint-disable-line react-hooks/exhaustive-deps
  return jalan;
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
  /** Kunci langkah cerita (node + baris): berganti saat pemain menekan Lanjut; jalan masuk yang sedang berlangsung dihentikan. */
  kunciLangkah?: string;
  /** 'penuh' = kartu episode: adegan mengisi kotak (cover), bukan letterbox. */
  isi?: 'penuh';
  /** Ada PNG adegan yang gagal dimuat: pemakai menampilkan kotak latar polos. */
  onGagal?: () => void;
}

export function PanggungPiksel({ ep, komposisi, adegan, tx, nama, suasana, status = false, ruangBawah = 0, className = '', isi, onGagal, kunciLangkah }: PropsPanggungPiksel) {
  const akar = useRef<HTMLDivElement>(null);
  const kanvas = useRef<HTMLCanvasElement>(null);
  const ukuran = useUkuranKotak(akar);
  const dpr = useDpr();
  const kurang = useReducedMotion();
  const r = RUANG_PIKSEL[adegan.ruang]!;
  const kunciBaris = adegan.tokoh.map((x) => `${x.id}:${x.bicara}:${x.ekspresi}`).join('|');
  const gerak = useGerak(kurang, kunciBaris);
  const hidup = useHidup(kurang, adegan.tokoh.find((x) => x.bicara)?.id ?? '', adegan.tokoh.map((x) => x.id).join(' '));
  // T-021: telepon di tangan tokoh (lapisan tambahan selama adegan serah ke obrolan); digambar di bawah lapisan meja.
  const tlp = useTeleponTangan();
  const lapisLama = useRef<HTMLCanvasElement>(null);
  const ruangLama = useRef<string | null>(null);
  const menungguPudar = useRef(false);
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

  // T-017: jalan masuk (hanya tokoh slot yang atlasnya punya bingkai jalan; kartu episode 'penuh' tidak pernah).
  const pejalan = isi === 'penuh' ? '' : adegan.tokoh.filter((x) => x.tempat === 'slot' && punyaJalan(x.tokoh)).map((x) => x.id).join(' ');
  const jalan = useJalan(kurang, siapUrl, adegan.ruang, pejalan, kunciLangkah);
  const papanTeks = r.papan ? tx(r.papan.teksKunci) : '';
  const kamera = ukuran ? kameraPiksel(r, tokoh, ukuran.w, ukuran.h, dpr, ruangBawah, isi === 'penuh') : null;
  // T-015: sisipan telepon tidak pernah menutupi kepala tokoh (letak dipilih dari kotak kepala di layar).
  const letakSisipan = sisipan && ukuran && kamera ? sisipanAdegan(r, tokoh, kamera, ukuran.w, ukuran.h, dpr, ruangBawah, sisipan.jendela.sisi) : null;
  const jalanKini = new Map<string, { x: number; pose: 'jalan-a' | 'jalan-b'; arah: 'kiri' | 'kanan' }>();
  if (jalan && kamera && ukuran) for (const x of tokoh) {
    if (!jalan.id.has(x.t.id)) continue;
    const rj = rencanaJalan(x.kakiX, x.s.ukuran.w * K, kamera, ukuran.w, langkahJalan(x.t.tokoh));
    const pj = posisiJalan(rj, jalan.t);
    if (pj) jalanKini.set(x.t.id, { x: pj.x, pose: pj.pose, arah: rj.arah });
  }
  const css = (b: Kotak) => [b.x, b.y, b.w, b.h].map((v) => Math.round((v / dpr) * 10) / 10).join(',');
  useLayoutEffect(() => {
    const c = kanvas.current;
    if (!c || !ukuran || !kamera) return;
    const W = Math.round(ukuran.w * dpr), H = Math.round(ukuran.h * dpr);
    // D-96 e: ganti ruang = bingkai ruang lama disalin ke kanvas atas, lalu memudar 150 md sesudah ruang baru tergambar.
    const atas = lapisLama.current;
    if (atas && ruangLama.current && ruangLama.current !== adegan.ruang && !kurang && c.width > 0) {
      atas.width = c.width; atas.height = c.height;
      atas.getContext('2d')?.drawImage(c, 0, 0);
      atas.removeAttribute('data-pudar');
      atas.setAttribute('data-aktif', '');
      menungguPudar.current = true;
    }
    ruangLama.current = adegan.ruang;
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
    const adaPembicara = tokoh.some((x) => x.t.bicara);
    let pusatTelepon: string | null = null;
    const tokohDi = (tempat: string) => {
      for (const x of tokoh) {
        if (x.t.tempat !== tempat) continue;
        // T-017: sedang berjalan masuk = bingkai jalan (wajah terpanggang, tanpa kedip/lompat/napas/luncur), kaki di x jalan.
        const j = jalanKini.get(x.t.id);
        const sj = j ? susunTokoh(x.t.tokoh, { pose: j.pose as never, hadap: x.t.satuArah ?? j.arah, ekspresi: x.t.ekspresi }) : null;
        if (j && sj) {
          const kakiY = x.y + x.s.jangkar.y * K;
          g.save();
          if (x.t.satuArah && x.t.satuArah !== j.arah) { g.translate(2 * dx(j.x), 0); g.scale(-1, 1); }
          for (const l of sj.lapisan) gambar(sj.url, l.sumber.x, l.sumber.y, l.sumber.w, l.sumber.h, j.x - sj.jangkar.x * K + l.x * K, kakiY - sj.jangkar.y * K + l.y * K, l.sumber.w * K, l.sumber.h * K);
          g.restore();
          continue;
        }
        const tubuh = x.s.lapisan[0]!;
        // D-96: lompat/napas pembicara (piksel seni bulat) + luncur masuk dari tepi pandangan terdekat.
        const naik = (x.t.bicara ? (hidup.lompat ? 2 : hidup.napas ? 1 : 0) : !adaPembicara && x.t.tempat === 'slot' && hidup.napas !== (x.t.slot % 2 === 1) ? 1 : 0) * K;
        let geser = 0;
        if (hidup.masuk?.id.has(x.t.id)) {
          const vw = W / s, kiri = x.kakiX < kamera.x + vw / 2;
          const awal = kiri ? kamera.x - x.s.ukuran.w * K : kamera.x + vw + x.s.ukuran.w * K;
          geser = (awal - x.kakiX) * (1 - hidup.masuk.p) ** 2;
        }
        g.save();
        // D-93: hadap kiri untuk atlas satu arah = cermin terhadap titik kaki.
        if (x.t.cermin) { g.translate(2 * dx(x.kakiX + geser), 0); g.scale(-1, 1); }
        for (const l of x.s.lapisan) {
          gambar(x.s.url, l.sumber.x, l.sumber.y, l.sumber.w, l.sumber.h, x.x + geser + (l.x - tubuh.x) * K, x.y - naik + (l.y - tubuh.y) * K, l.sumber.w * K, l.sumber.h * K);
        }
        if (tlp && tlp.tokoh === x.t.id) {
          // Titik (0, 0) bingkai tokoh di dunia; offset README telepon-v2 dalam koordinat bingkai. Ikut naik 1 piksel bila tokoh bernapas.
          const bx = x.x + geser - tubuh.x * K, by = x.y - naik - tubuh.y * K;
          const { lengan, punggung, gelembung, pusat } = SENI_TELEPON;
          gambar(lengan.url, tlp.sel * lengan.w, 0, lengan.w, lengan.h, bx + lengan.x * K, by + lengan.y * K, lengan.w * K, lengan.h * K);
          gambar(punggung.url, 0, 0, punggung.w, punggung.h, bx + punggung.x * K, by + punggung.y[tlp.sel] * K, punggung.w * K, punggung.h * K);
          if (tlp.gelembung) gambar(gelembung.url, 0, 0, gelembung.w, gelembung.h, bx + gelembung.x * K, by + gelembung.y * K, gelembung.w * K, gelembung.h * K);
          const px = dx(bx + pusat.x * K), cermin = x.t.cermin ? 2 * dx(x.kakiX + geser) - px : px;
          pusatTelepon = `${Math.round((cermin / dpr) * 10) / 10},${Math.round((dy(by + pusat.y * K) / dpr) * 10) / 10}`;
        }
        g.restore();
      }
    };
    // Pandangan lebih besar daripada dunia (piksel bulat): pita di luar dunia diisi baris/kolom TEPI latar yang direntang
    // (langit berlanjut ke atas, lantai ke bawah), bukan warna polos.
    const latar = siap.get(r.lapisan[0]!.url);
    if (latar) {
      const x0 = dx(0), x1 = dx(DUNIA_W), y0 = dy(0), y1 = dy(DUNIA_H), pw = latar.naturalWidth, ph = latar.naturalHeight;
      if (y0 > 0) g.drawImage(latar, 0, 0, pw, 1, x0, 0, x1 - x0, y0);
      if (y1 < H) g.drawImage(latar, 0, ph - 1, pw, 1, x0, y1, x1 - x0, H - y1);
      if (x0 > 0) g.drawImage(latar, 0, 0, 1, ph, 0, y0, x0, y1 - y0);
      if (x1 < W) g.drawImage(latar, pw - 1, 0, 1, ph, x1, y0, W - x1, y1 - y0);
    }
    for (const l of r.lapisan) {
      if (l.z >= 30 && l.id !== 'latar') break;
      gambar(l.url, 0, 0, l.w / K, l.h / K, l.x, l.y, l.w, l.h);
    }
    if (r.papan && papanTeks) {
      const b = r.papan.kotak;
      g.fillStyle = r.papan.warna;
      // D-88: huruf piksel 3x5 pada skala piksel seni (sama dengan ruang); teks di luar font / terlalu lebar = fillText.
      const tt = titikPapanKantor(b, K, titikTeks, papanTeks);
      if (tt) {
        for (const [px, py] of tt.titik) { const wx = px * K, wy = py * K; g.fillRect(dx(wx), dy(wy), dx(wx + K) - dx(wx), dy(wy + K) - dy(wy)); }
      } else {
      g.font = `700 ${Math.max(8, Math.round(b.h * 0.5 * s))}px system-ui, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(papanTeks, dx(b.x + b.w / 2), dy(b.y + b.h / 2), Math.round(b.w * 0.9 * s));
      }
    }
    // D-137 (T-019): tokoh di balik meja dipotong di tepi BAWAH lapisan meja (kantor: y dunia 680), supaya betis & sepatunya
    // tidak pernah tergambar di lantai depan meja (frame badan penuh lebih panjang daripada meja).
    const meja = r.lapisan.find((l) => l.z >= 30 && l.id !== 'latar');
    g.save();
    if (meja) { g.beginPath(); g.rect(0, 0, W, dy(meja.y + meja.h)); g.clip(); }
    tokohDi('balikMeja');
    g.restore();
    for (const l of r.lapisan) if (l.z >= 30) gambar(l.url, 0, 0, l.w / K, l.h / K, l.x, l.y, l.w, l.h);
    for (const p of prop) gambar(p.url, 0, 0, p.w / K, p.h / K, p.x, p.y, p.w, p.h);
    tokohDi('slot');
    if (sisipan) {
      // Sisipan telepon: jendela kepala 56 piksel seni, skala bulat ± 34 % tinggi panggung, bingkai gelap. Letak = tataSisipan
      // (T-015: kanan atas bila bebas; tidak pernah di atas kepala tokoh).
      const { x0, y0, sisi, tepi, k } = (letakSisipan ?? sisipanAdegan(r, tokoh, kamera, ukuran.w, ukuran.h, dpr, ruangBawah, sisipan.jendela.sisi)).tata;
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
    if (atas && menungguPudar.current) {
      menungguPudar.current = false;
      requestAnimationFrame(() => { atas.setAttribute('data-pudar', ''); window.setTimeout(() => { atas.removeAttribute('data-aktif'); atas.removeAttribute('data-pudar'); }, 200); });
    }
    // T-021: pusat layar telepon di kotak panggung (px CSS) untuk kamera/zoom; sel yang sedang digambar untuk alat uji.
    const el = akar.current;
    if (el) { if (pusatTelepon) { el.setAttribute('data-telepon-pusat', pusatTelepon); el.setAttribute('data-telepon-sel', String(tlp?.sel ?? '')); } else { el.removeAttribute('data-telepon-pusat'); el.removeAttribute('data-telepon-sel'); } }
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
      data-sisipan={letakSisipan ? css(kotakLuarSisipan(letakSisipan.tata)) : undefined}
      data-sisipan-letak={letakSisipan?.tata.letak}
      data-kepala={letakSisipan && letakSisipan.kepala.length ? letakSisipan.kepala.map(css).join(';') : undefined}
      data-bawah={ruangBawah || undefined}
      data-kamera={kamera ? `${Math.round(kamera.x)},${Math.round(kamera.y)},${Math.round(ukuran!.w / kamera.s)}x${Math.round(ukuran!.h / kamera.s)}` : undefined}
    >
      <div className="cer-piksel" data-siap={siapUrl ? '' : undefined} aria-hidden="true">
        <canvas ref={kanvas} className="cer-piksel-kanvas" data-pose={tokoh.map((x) => `${x.t.id}:${x.s.pose}:${x.t.hadap}:${x.s.ekspresi}`).join(' ') || undefined} data-mata={gerak.kedip ? 'tutup' : 'buka'} data-napas={hidup.napas ? '1' : '0'} data-jalan={[...jalanKini].map(([id, j]) => `${id}:${j.pose}:${Math.round(j.x)}`).join(' ') || undefined} data-kaki={tokoh.map((x) => `${x.t.id}:${Math.round(jalanKini.get(x.t.id)?.x ?? x.kakiX)}`).join(' ') || undefined} />
        <canvas ref={lapisLama} className="cer-piksel-kanvas cer-piksel-lama" />
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
