/**
 * T-025: SPRITE MILIK RUANG (blok `komite` sebuah ruang di seni/piksel/ruang-ep2.json; Ruang Rapat Komite Klaim). Empat
 * anggota komite adalah hiasan ruangnya: BUKAN pemeran, tidak pernah masuk state dialog, tidak ikut menghitung kamera (rev 1.1
 * spec T-025). Yang menggerakkannya hanya isyarat tata `komite: tunggu | setuju | catatan | kosong` (tipe.ts CueLatar).
 *
 * Berkas ini MURNI (tanpa React / DOM, diuji di node): pembaca manifest yang toleran + susunan gambar untuk satu keadaan pada
 * waktu t sejak keadaan itu mulai. Tiap bingkai = tumpukan sel atlas (README Designer, character/komite-ep2-pixel-v1):
 *   diam    badan, kepala
 *   kedip   + tambalan mata 120 md (hanya keadaan ber-`kedip`; tiap anggota sendiri-sendiri, dijadwalkan pemakai)
 *   angguk  kepala turun 3 piksel seni 160 md lalu kembali 160 md, dua kali; tambalan mata ikut kepala
 *   angkat  + lengan terangkat
 * Tanda (SETUJU / CATATAN) muncul satu per satu menurut `urutan`, berjarak `jedaMs` (180). Gerak dikurangi (`diam`): bingkai
 * diam (kepala tidak digeser, tanpa kedip) dan semua tanda sekaligus.
 * Fix 2 (D-253): keadaan yang punya gerak masuk lebih dulu MENAHAN ruang yang menunggu selama TAHAN_AWAL_KOMITE (320 md = satu
 * anggukan): anggota duduk diam, tanpa tanda, tanpa lengan terangkat; baru sesudah itu tanda pertama, anggukan pertama, dan
 * lengan. Pemain melihat "sebelum"-nya, jadi anggukan terbaca sebagai kejadian, bukan pose. Gerak dikurangi: tanpa jeda.
 */
import { KEADAAN_KOMITE, type KeadaanKomite } from '../../../tipe';
import type { Kotak } from '../../panggung/dunia';

/** Sel atlas: x, y, w, h (piksel seni). */
export type SelAtlas = readonly [number, number, number, number];

export interface AnggotaKomite {
  id: string;
  /** Kotak bingkai anggota di dunia (piksel seni x satuan ruang); sel diletakkan relatif pojok kiri-atasnya. */
  bingkai: Kotak;
  sel: Readonly<Record<string, SelAtlas>>;
  /** Letak pojok kiri-atas tiap sel di dalam bingkai (piksel seni). */
  letak: Readonly<Record<string, readonly [number, number]>>;
}

export interface PoseKomite {
  /** Sel yang ditumpuk, dari bawah ke atas. */
  lapis: string[];
  /** Lama tambalan (kedip), md. */
  ms?: number;
  /** Bingkai gerak: geser kepala (piksel seni) + lamanya; diulang `ulang` kali lalu diam di letak aslinya. */
  bingkai?: { kepalaDy: number; ms: number }[];
  ulang?: number;
}

export interface KeadaanRuangKomite {
  /** Pose tiap anggota yang tampil (anggota tanpa pose tidak digambar: kursinya kosong). */
  pose: Readonly<Record<string, string>>;
  /** Tanda di atas kepala tiap anggota (jenis sel tanda). */
  tanda: Readonly<Record<string, string>>;
  /** Urutan muncul tanda. */
  urutan: string[];
  jedaMs: number;
  kedip: boolean;
}

export interface KomiteRuang {
  /** URL atlas anggota. */
  url: string;
  z: number;
  zTanda: number;
  anggota: AnggotaKomite[];
  pose: Readonly<Record<string, PoseKomite>>;
  keadaan: Readonly<Record<KeadaanKomite, KeadaanRuangKomite>>;
  tanda: { url: string; sel: Readonly<Record<string, SelAtlas>>; w: number; h: number; letak: Readonly<Record<string, { x: number; y: number }>> };
  /** Sel ikon kepala 32 px per anggota (rincian istilah; gambarnya dirujuk CSS .px-komite). */
  ikon: Readonly<Record<string, SelAtlas>>;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : null);
const n = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const sel = (v: unknown): SelAtlas | null => (Array.isArray(v) && v.length === 4 && v.every(n) ? [v[0], v[1], v[2], v[3]] as const : null);
const teksObj = (v: unknown): Record<string, string> | null => { const o = obj(v); return o && Object.values(o).every((x) => typeof x === 'string') ? (o as Record<string, string>) : null; };

/**
 * Baca blok `komite` sebuah ruang. Toleran seperti pembaca ruang: blok cacat = null + catatan (ruang tetap tampil tanpa
 * anggotanya). `url(berkas)` = URL PNG di seni/piksel.
 */
export function bacaKomite(v: unknown, url: (berkas: string) => string, ruang: string, catatan: string[] = []): KomiteRuang | null {
  const o = obj(v);
  if (!o) return null;
  const tolak = (pesan: string): null => { catatan.push(`ruang ${ruang}: komite ${pesan}`); return null; };
  if (typeof o.atlas !== 'string') return tolak('tanpa atlas');
  const anggota: AnggotaKomite[] = [];
  for (const x of Array.isArray(o.anggota) ? o.anggota : []) {
    const a = obj(x); const b = obj(a?.bingkai); const s = obj(a?.sel); const l = obj(a?.letak);
    if (!a || typeof a.id !== 'string' || !b || !n(b.x) || !n(b.y) || !n(b.w) || !n(b.h) || !s || !l) return tolak('anggota tidak sah');
    const selA: Record<string, SelAtlas> = {}; const letakA: Record<string, readonly [number, number]> = {};
    for (const [nama, sv] of Object.entries(s)) {
      const k = sel(sv); const lv = l[nama];
      if (!k || !Array.isArray(lv) || lv.length !== 2 || !lv.every(n)) return tolak(`sel ${a.id}.${nama} tidak sah`);
      selA[nama] = k; letakA[nama] = [lv[0] as number, lv[1] as number];
    }
    anggota.push({ id: a.id, bingkai: { x: b.x, y: b.y, w: b.w, h: b.h }, sel: selA, letak: letakA });
  }
  if (!anggota.length) return tolak('tanpa anggota');
  const id = new Set(anggota.map((a) => a.id));
  const pose: Record<string, PoseKomite> = {};
  for (const [nama, pv] of Object.entries(obj(o.pose) ?? {})) {
    const p = obj(pv);
    if (!p || !Array.isArray(p.lapis) || !p.lapis.every((x) => typeof x === 'string' && anggota.every((a) => a.sel[x]))) return tolak(`pose ${nama} tidak sah`);
    const bingkai = Array.isArray(p.bingkai) ? p.bingkai.map(obj) : null;
    if (bingkai && !bingkai.every((b) => b && n(b.kepalaDy) && n(b.ms) && b.ms > 0)) return tolak(`bingkai pose ${nama} tidak sah`);
    pose[nama] = {
      lapis: p.lapis as string[],
      ...(n(p.ms) ? { ms: p.ms } : {}),
      ...(bingkai?.length ? { bingkai: bingkai.map((b) => ({ kepalaDy: b!.kepalaDy as number, ms: b!.ms as number })), ulang: n(p.ulang) && p.ulang >= 1 ? Math.floor(p.ulang) : 1 } : {}),
    };
  }
  const t = obj(o.tanda); const selTanda: Record<string, SelAtlas> = {}; const letakTanda: Record<string, { x: number; y: number }> = {};
  if (!t || typeof t.gambar !== 'string' || !n(t.w) || !n(t.h)) return tolak('tanpa tanda');
  for (const [nama, sv] of Object.entries(obj(t.sel) ?? {})) { const k = sel(sv); if (!k) return tolak(`sel tanda ${nama}`); selTanda[nama] = k; }
  for (const [a, lv] of Object.entries(obj(t.letak) ?? {})) { const l = obj(lv); if (!l || !n(l.x) || !n(l.y)) return tolak(`letak tanda ${a}`); letakTanda[a] = { x: l.x, y: l.y }; }
  const kd = obj(o.keadaan);
  const keadaan = {} as Record<KeadaanKomite, KeadaanRuangKomite>;
  for (const k of KEADAAN_KOMITE) {
    const s = obj(kd?.[k]); const p = teksObj(s?.pose); const td = teksObj(s?.tanda);
    if (!s || !p || !td) return tolak(`keadaan ${k} tidak ada`);
    if (!Object.entries(p).every(([a, x]) => id.has(a) && pose[x]) || !Object.entries(td).every(([a, x]) => id.has(a) && selTanda[x] && letakTanda[a])) return tolak(`keadaan ${k} merujuk yang tidak ada`);
    const urutan = Array.isArray(s.urutan) ? s.urutan.filter((x): x is string => typeof x === 'string' && x in td) : Object.keys(td);
    keadaan[k] = { pose: p, tanda: td, urutan: urutan.length === Object.keys(td).length ? urutan : Object.keys(td), jedaMs: n(s.jedaMs) && s.jedaMs >= 0 ? s.jedaMs : 0, kedip: s.kedip === true };
  }
  const ikon: Record<string, SelAtlas> = {};
  for (const [a, sv] of Object.entries(obj(obj(o.ikon)?.sel) ?? {})) { const k = sel(sv); if (k) ikon[a] = k; }
  return {
    url: url(o.atlas), z: n(o.z) ? o.z : 20, zTanda: n(o.zTanda) ? o.zTanda : 40, anggota, pose, keadaan,
    tanda: { url: url(t.gambar), sel: selTanda, w: t.w, h: t.h, letak: letakTanda },
    ikon,
  };
}

/** Lama satu putaran penuh gerak pose (md); 0 = pose diam. */
const lamaPose = (p: PoseKomite | undefined): number => (p?.bingkai ? p.bingkai.reduce((a, b) => a + b.ms, 0) * (p.ulang ?? 1) : 0);

/** Fix 2 (D-253): lama ruang yang menunggu ditahan sebelum gerak masuk sebuah keadaan (md) = satu anggukan (160 + 160). */
export const TAHAN_AWAL_KOMITE = 320;

/** Jeda awal keadaan (md): TAHAN_AWAL_KOMITE bila keadaan punya tanda atau pose bergerak; keadaan diam (tunggu, kosong) = 0. */
export function tahanKomite(k: KomiteRuang, keadaan: KeadaanKomite): number {
  const s = k.keadaan[keadaan];
  return s.urutan.length > 0 || Object.values(s.pose).some((p) => lamaPose(k.pose[p]) > 0) ? TAHAN_AWAL_KOMITE : 0;
}

/**
 * Lama gerak masuk sebuah keadaan (md): jeda awal + anggukan terpanjang atau tanda terakhir, mana yang lebih lama. 0 = tidak
 * ada gerak.
 */
export function lamaKomite(k: KomiteRuang, keadaan: KeadaanKomite): number {
  const s = k.keadaan[keadaan];
  return tahanKomite(k, keadaan) + Math.max(0, ...Object.values(s.pose).map((p) => lamaPose(k.pose[p])), (s.urutan.length - 1) * s.jedaMs);
}

/**
 * Saat-saat (md sejak keadaan mulai, urut naik, selalu diawali 0) gambar keadaan berganti karena waktu: akhir jeda awal, tepi
 * tiap bingkai gerak dan munculnya tiap tanda; yang terakhir = `lamaKomite`. Satu butir saja = keadaan diam (tidak perlu jam).
 */
export function titikUbahKomite(k: KomiteRuang, keadaan: KeadaanKomite): number[] {
  const s = k.keadaan[keadaan];
  const tahan = tahanKomite(k, keadaan);
  const titik = new Set<number>([0, tahan]);
  for (const nama of new Set(Object.values(s.pose))) {
    const p = k.pose[nama];
    if (!p?.bingkai) continue;
    let t = tahan;
    for (let u = 0; u < (p.ulang ?? 1); u++) for (const b of p.bingkai) { t += b.ms; titik.add(t); }
  }
  s.urutan.forEach((_, i) => titik.add(tahan + i * s.jedaMs));
  return [...titik].sort((a, b) => a - b);
}

export interface LapisKomite { nama: string; sumber: SelAtlas; x: number; y: number; w: number; h: number }
export interface GambarKomite {
  /** Anggota yang tampil, urut manifest; `bingkai` = indeks bingkai gerak yang sedang tampil (-1 = diam). */
  anggota: { id: string; pose: string; bingkai: number; kedip: boolean; lapis: LapisKomite[] }[];
  /** Tanda yang SUDAH muncul pada waktu t, urut muncul. */
  tanda: { id: string; jenis: string; sumber: SelAtlas; x: number; y: number; w: number; h: number }[];
  /** Tidak ada lagi yang berubah karena waktu (kedip tidak dihitung). */
  selesai: boolean;
}

/**
 * Susunan gambar keadaan `keadaan` pada `t` md sejak keadaan itu mulai (koordinat dunia; `satuan` = dunia per piksel seni).
 * `t` di bawah jeda awal (`tahanKomite`) = ruang yang menunggu; gerak masuknya dihitung sejak jeda itu habis.
 * `diam` (gerak dikurangi) = bingkai diam + semua tanda, tanpa jeda awal; `kedip` = id anggota yang sedang berkedip.
 */
export function susunKomite(k: KomiteRuang, keadaan: KeadaanKomite, t: number, opsi: { diam?: boolean; kedip?: ReadonlySet<string> } = {}, satuan = 4): GambarKomite {
  const s = k.keadaan[keadaan];
  const diam = opsi.diam === true;
  // Jeda awal (D-253): selama `menahan` yang tampil adalah ruang yang menunggu; `tg` = md sejak gerak masuknya mulai.
  const tahan = diam ? 0 : tahanKomite(k, keadaan);
  const menahan = t < tahan;
  const tg = t - tahan;
  const anggota: GambarKomite['anggota'] = [];
  for (const a of k.anggota) {
    // Selama jeda awal: pose keadaan tunggu (duduk, tanpa lengan terangkat), hanya untuk anggota yang tampil di keadaan ini.
    const nama = s.pose[a.id] && menahan ? (k.keadaan.tunggu.pose[a.id] ?? s.pose[a.id]) : s.pose[a.id];
    const p = nama ? k.pose[nama] : undefined;
    if (!nama || !p) continue;
    // Bingkai gerak (angguk): kepala digeser selama putaran berjalan, lalu diam di letak aslinya.
    let dy = 0, bingkai = -1;
    const lama = lamaPose(p);
    if (p.bingkai && !diam && tg >= 0 && tg < lama) {
      let sisa = tg % p.bingkai.reduce((x, b) => x + b.ms, 0);
      bingkai = p.bingkai.findIndex((b) => { if (sisa < b.ms) return true; sisa -= b.ms; return false; });
      dy = p.bingkai[Math.max(0, bingkai)]!.kepalaDy;
    }
    const kedip = s.kedip && !diam && !!opsi.kedip?.has(a.id) && !!k.pose.kedip;
    const tumpuk = kedip ? k.pose.kedip!.lapis : p.lapis;
    // Pose kedip = badan + kepala + tambalan; anggota yang posenya punya sel lain (lengan) tetap membawanya.
    const namaSel = kedip ? [...tumpuk, ...p.lapis.filter((x) => !tumpuk.includes(x))] : tumpuk;
    const lapis = namaSel.map((x): LapisKomite => {
      const sumber = a.sel[x]!; const [lx, ly] = a.letak[x]!;
      // Tambalan mata menempel di kepala: ikut turun saat mengangguk.
      const geser = x === 'kepala' || x === 'kedip' ? dy : 0;
      return { nama: x, sumber, x: a.bingkai.x + lx * satuan, y: a.bingkai.y + (ly + geser) * satuan, w: sumber[2] * satuan, h: sumber[3] * satuan };
    });
    anggota.push({ id: a.id, pose: nama, bingkai, kedip, lapis });
  }
  const tanda = s.urutan.filter((_, i) => diam || tg >= i * s.jedaMs).map((id) => {
    const jenis = s.tanda[id]!; const l = k.tanda.letak[id]!;
    return { id, jenis, sumber: k.tanda.sel[jenis]!, x: l.x, y: l.y, w: k.tanda.w, h: k.tanda.h };
  });
  return { anggota, tanda, selesai: diam || t >= lamaKomite(k, keadaan) };
}
