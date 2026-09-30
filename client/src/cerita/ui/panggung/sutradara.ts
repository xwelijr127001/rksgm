/**
 * SUTRADARA panggung v3: pengendali presentasi yang menjalankan satu `Rencana` (Web Animations API) dan gerak kecil
 * (kedip, napas, mulut bicara). Tanpa React; DOM & jam disuntikkan supaya bisa diuji dengan Animation & timer palsu.
 *
 * Ketahanan (docs/cerita/ADEGAN-AUTO1.md bagian 4):
 *  - Token generasi: setiap `mainkan` menaikkan generasi; callback timer lama yang terlambat diabaikan, sehingga
 *    rencana lama tidak pernah "menyelesaikan" rencana baru atau memunculkan tokoh dari adegan sebelumnya.
 *  - `selesaikan()` = lompat ke komposisi akhir: batalkan semua animasi (elemen akhir kembali ke gaya bawaannya =
 *    komposisi akhir; aktor sementara bergaya bawaan tak terlihat) lalu beri tahu pemanggil untuk melepas aktor.
 *  - `mainkan(..., dari)` = mulai di tengah (md): kamera dipaskan ulang saat tinggi kotak berubah sedikit (bilah
 *    alamat HP) tanpa menyelesaikan gerak; `waktu` = posisi rencana yang sedang berjalan.
 *  - `hentikan()` = batalkan tanpa memberi tahu (unmount / rencana baru). Tidak ada yang menulis state cerita,
 *    memajukan dialog, atau memanggil kirim(); selesai animasi hanya membersihkan tampilan.
 *  - `mainkan(..., { tunggu: true })` = rencana ditahan di keadaan AWALNYA (animasi dibuat lalu dijeda di posisi 0,
 *    fill 'both', jadi bingkai pertama sudah benar) sampai bingkai benar-benar mengalir (dua callback
 *    requestAnimationFrame berturut-turut berjarak < SELA_LANCAR md, paling lama TUNGGU_MAKS md). Bingkai pertama
 *    sesudah panggung dipasang bisa tertahan lama di GPU (rasterisasi seluruh dunia panggung); tanpa penahanan jam
 *    animasi sudah berjalan selama itu dan awal pembuka tidak pernah terlihat.
 *  - Gerak kecil: kedip acak 3-6 dtk (± 120 md) per tokoh, napas sangat kecil dengan fase acak, dijeda saat tab
 *    tersembunyi, dilewati untuk tokoh yang sedang bicara (mulut bergantian) dan selama salinan kedipnya basi
 *    (data-basi: belum diperbarui untuk pose kini, diperbarui saat idle oleh UnsurDunia). Kedip yang SEDANG berjalan
 *    dibatalkan (`batalKedip`) begitu komposisi yang digambar berganti, sebelum layar dicat: salinan kedipnya masih
 *    berisi pose/wajah lama, jadi tidak boleh tampil di atas pose baru.
 */
import type { Rencana } from './rencana';

/** Bagian Animation yang dipakai (Animation DOM memenuhinya; uji memakai tiruan). */
export interface AnimasiLike {
  cancel(): void;
  pause(): void;
  play(): void;
  /** Posisi animasi (md); Animation DOM punya, tiruan uji boleh tidak. */
  currentTime?: CSSNumberish | null;
}

export type Animator = (el: Element, keyframes: Keyframe[], opsi: KeyframeAnimationOptions) => AnimasiLike | null;

export interface Jam {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
  /** Waktu kini (md) untuk posisi rencana bila animasi tidak melaporkannya. */
  sekarang?(): number;
  /** requestAnimationFrame (penahanan rencana sampai bingkai mengalir); tanpa nilai = tidak pernah menahan. */
  bingkai?(fn: (t: number) => void): unknown;
  batalBingkai?(id: unknown): void;
}

export const animatorDom: Animator = (el, keyframes, opsi) =>
  typeof (el as HTMLElement).animate === 'function' ? (el as HTMLElement).animate(keyframes, opsi) : null;

export const jamDom: Jam = {
  setTimeout: (fn, ms) => window.setTimeout(fn, ms),
  clearTimeout: (id) => window.clearTimeout(id as number),
  sekarang: () => performance.now(),
  bingkai: (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : null),
  batalBingkai: (id) => { if (typeof id === 'number' && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id); },
};

/** Dua bingkai berturut-turut berjarak kurang dari ini (md) = bingkai sudah mengalir (tidak tertahan di GPU). */
export const SELA_LANCAR = 70;
/** Batas penahanan rencana (md): lewat dari ini rencana tetap dimulai walau bingkai belum lancar. */
export const TUNGGU_MAKS = 2000;

function aman(f: () => void): void {
  try { f(); } catch { /* elemen sudah lepas / animasi sudah batal */ }
}

interface Berjalan {
  gen: number;
  rencana: Rencana;
  animasi: AnimasiLike[];
  timer: unknown;
  selesai: (gen: number) => void;
  /** Jam saat rencana dianggap mulai (sekarang() - dari). */
  mulai: number;
  /** Permintaan bingkai yang masih menunggu (rencana ditahan di keadaan awal), atau null. */
  tahan: unknown;
  /** Posisi mulai (md): posisi rencana selama ditahan. */
  dari: number;
}

export class Sutradara {
  private gen = 0;
  private berjalan: Berjalan | null = null;

  constructor(private readonly animator: Animator = animatorDom, private readonly jam: Jam = jamDom) {}

  /** Generasi rencana terakhir yang dimulai. */
  get generasi(): number {
    return this.gen;
  }

  /** Rencana yang sedang berjalan (null bila tidak ada). */
  get aktif(): Rencana | null {
    return this.berjalan?.rencana ?? null;
  }

  /** Posisi (md) rencana yang sedang berjalan, atau null. */
  get waktu(): number | null {
    const b = this.berjalan;
    if (!b) return null;
    if (b.tahan !== null) return b.dari;
    for (const a of b.animasi) {
      const t = a.currentTime;
      if (typeof t === 'number' && Number.isFinite(t)) return Math.min(b.rencana.durasi, Math.max(0, t));
    }
    return this.jam.sekarang ? Math.min(b.rencana.durasi, Math.max(0, this.jam.sekarang() - b.mulai)) : null;
  }

  /** Rencana sedang ditahan di keadaan awalnya (menunggu bingkai mengalir, `mainkan(..., { tunggu })`). */
  get tertahan(): boolean {
    return !!this.berjalan && this.berjalan.tahan !== null;
  }

  /**
   * Mulai rencana. `cari(target)` mengembalikan elemen untuk target `data-aktor`; target tanpa elemen dilewati.
   * `selesai(gen)` dipanggil SEKALI saat rencana selesai atau diselesaikan paksa (bukan saat dihentikan).
   * `dari` (md) = mulai di tengah rencana (dipaskan ulang sesudah kotak panggung berubah sedikit).
   * `opsi.tunggu` = tahan di keadaan awal sampai bingkai mengalir (hanya bila jam punya `bingkai`).
   */
  mainkan(rencana: Rencana, cari: (target: string) => Element[], selesai: (gen: number) => void, dari = 0, opsi: { tunggu?: boolean } = {}): number {
    this.hentikan();
    const gen = ++this.gen;
    const mulaiDi = Math.min(Math.max(0, dari), rencana.durasi);
    const tunggu = !!opsi.tunggu && typeof this.jam.bingkai === 'function';
    const animasi: AnimasiLike[] = [];
    for (const g of rencana.gerak) {
      if (!g.keyframes.length) continue;
      for (const el of cari(g.target)) {
        try {
          const a = this.animator(el, g.keyframes, { duration: rencana.durasi, fill: 'both', easing: 'linear' });
          if (a) {
            // Ditahan: dijeda di posisinya (fill 'both' = bingkai pertama sudah keadaan awal rencana).
            if (tunggu) aman(() => a.pause());
            if (mulaiDi > 0) aman(() => { a.currentTime = mulaiDi; });
            animasi.push(a);
          }
        } catch {
          /* keyframe tidak didukung peramban: elemen langsung tampil di keadaan akhir */
        }
      }
    }
    const b: Berjalan = { gen, rencana, animasi, timer: null, selesai, mulai: (this.jam.sekarang?.() ?? 0) - mulaiDi, tahan: null, dari: mulaiDi };
    this.berjalan = b;
    const jalan = () => {
      if (this.berjalan !== b) return;
      b.tahan = null;
      if (tunggu) for (const a of animasi) aman(() => a.play());
      b.mulai = (this.jam.sekarang?.() ?? 0) - mulaiDi;
      b.timer = this.jam.setTimeout(() => {
        if (this.berjalan?.gen === gen) this.selesaikan();
      }, rencana.durasi - mulaiDi + 40);
    };
    if (!tunggu) {
      jalan();
      return gen;
    }
    // Tunggu dua bingkai berturut-turut berjarak < SELA_LANCAR (bingkai mengalir), paling lama TUNGGU_MAKS.
    const awal = this.jam.sekarang?.() ?? 0;
    let lalu: number | null = null;
    const tiap = (t: number) => {
      if (this.berjalan !== b) return;
      const lancar = lalu !== null && t - lalu < SELA_LANCAR;
      lalu = t;
      if (lancar || (this.jam.sekarang?.() ?? t) - awal >= TUNGGU_MAKS) jalan();
      else b.tahan = this.jam.bingkai!(tiap) ?? null;
    };
    b.tahan = this.jam.bingkai!(tiap) ?? null;
    // Jam yang tidak bisa meminta bingkai (null): langsung mulai.
    if (b.tahan === null && this.berjalan === b && b.timer === null) jalan();
    return gen;
  }

  /** Lompat ke komposisi akhir. true bila ada rencana yang sedang berjalan. */
  selesaikan(): boolean {
    const b = this.berjalan;
    if (!b) return false;
    this.lepas(b);
    b.selesai(b.gen);
    return true;
  }

  /** Batalkan tanpa memberi tahu (unmount, atau rencana baru menggantikan). */
  hentikan(): void {
    const b = this.berjalan;
    if (b) this.lepas(b);
  }

  private lepas(b: Berjalan): void {
    this.berjalan = null;
    if (b.timer !== null) this.jam.clearTimeout(b.timer);
    if (b.tahan !== null) aman(() => this.jam.batalBingkai?.(b.tahan));
    b.tahan = null;
    for (const a of b.animasi) aman(() => a.cancel());
  }
}

// ------------------------------------------------------------------ gerak kecil

export interface ElemenTokoh {
  kunci: string;
  /** Pembungkus napas (transform-origin di jangkar). */
  napas: Element | null;
  /** Salinan gambar dasar & salinan mata tertutup. */
  dasar: Element | null;
  kedip: Element | null;
}

/** Pola mulut bicara (md): tutup, buka, tutup, buka, ... supaya tidak terasa mekanis. */
const POLA_BICARA = [110, 150, 90, 170, 130, 120];

/**
 * Keyframe visibility bergantian mengikuti pola (segmen genap = mulut tertutup, ganjil = terbuka).
 * `salinanDasar` true = salinan mulut tertutup (terlihat di segmen genap); false = salinan mulut terbuka.
 */
export function kfTerlihat(pola: readonly number[], salinanDasar: boolean): Keyframe[] {
  const total = pola.reduce((a, b) => a + b, 0);
  const kf: Keyframe[] = [];
  let t = 0;
  pola.forEach((d, i) => {
    const terlihat = (i % 2 === 0) === salinanDasar ? 'visible' : 'hidden';
    kf.push({ offset: t / total, visibility: terlihat }, { offset: (t + d) / total, visibility: terlihat });
    t += d;
  });
  return kf;
}

export class GerakKecil {
  private tokoh: ElemenTokoh[] = [];
  private napas: AnimasiLike[] = [];
  private timer = new Map<string, unknown>();
  private kedipJalan: AnimasiLike[] = [];
  private bicaraAnim: AnimasiLike[] = [];
  private bicaraDasar: Element | null = null;
  private jeda_ = false;
  private hidup = false;

  constructor(
    private readonly animator: Animator = animatorDom,
    private readonly jam: Jam = jamDom,
    private readonly acak: () => number = Math.random,
  ) {}

  /** Mulai napas & kedip untuk tokoh-tokoh ini (menggantikan yang lama). */
  mulai(tokoh: ElemenTokoh[]): void {
    this.henti();
    this.hidup = true;
    this.tokoh = tokoh;
    for (const t of tokoh) {
      if (t.napas) {
        const durasi = 3600 + this.acak() * 1000;
        const a = this.coba(t.napas, [{ transform: 'scale(1, 1)' }, { transform: 'scale(1.002, 1.006)' }], {
          duration: durasi, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', delay: -this.acak() * durasi,
        });
        if (a) {
          this.napas.push(a);
          if (this.jeda_) aman(() => a.pause());
        }
      }
      if (!this.jeda_) this.jadwalKedip(t);
    }
  }

  /** Hentikan semua gerak kecil (unmount, gerak dikurangi, ganti komposisi). */
  henti(): void {
    this.hidup = false;
    for (const id of this.timer.values()) this.jam.clearTimeout(id);
    this.timer.clear();
    for (const a of [...this.napas, ...this.kedipJalan, ...this.bicaraAnim]) aman(() => a.cancel());
    this.napas = [];
    this.kedipJalan = [];
    this.bicaraAnim = [];
    this.bicaraDasar = null;
    this.tokoh = [];
  }

  /** Tab tersembunyi: jeda napas, hentikan jadwal kedip & mulut. */
  jeda(): void {
    this.jeda_ = true;
    for (const id of this.timer.values()) this.jam.clearTimeout(id);
    this.timer.clear();
    for (const a of this.napas) aman(() => a.pause());
    for (const a of this.bicaraAnim) aman(() => a.pause());
  }

  lanjutkan(): void {
    if (!this.jeda_) return;
    this.jeda_ = false;
    if (!this.hidup) return;
    for (const a of this.napas) aman(() => a.play());
    for (const a of this.bicaraAnim) aman(() => a.play());
    for (const t of this.tokoh) this.jadwalKedip(t);
  }

  /**
   * Komposisi yang digambar berganti: kedip yang SEDANG berjalan dibatalkan seketika (salinan kedipnya berisi
   * pose/wajah lama sampai diperbarui saat idle, dan salinan dasarnya sedang disembunyikan). Jadwal kedip tetap.
   */
  batalKedip(): void {
    for (const a of this.kedipJalan) aman(() => a.cancel());
    this.kedipJalan = [];
  }

  /** Mulut bergantian buka-tutup (salinan 'bicara' vs 'dasar') selama teks mengetik; null = diam. */
  bicara(dasar: Element | null, buka: Element | null): void {
    for (const a of this.bicaraAnim) aman(() => a.cancel());
    this.bicaraAnim = [];
    this.bicaraDasar = null;
    if (!dasar || !buka) return;
    const opsi: KeyframeAnimationOptions = { duration: POLA_BICARA.reduce((a, b) => a + b, 0), iterations: Infinity };
    const a = this.coba(buka, kfTerlihat(POLA_BICARA, false), opsi);
    const b = this.coba(dasar, kfTerlihat(POLA_BICARA, true), opsi);
    for (const x of [a, b]) {
      if (!x) continue;
      this.bicaraAnim.push(x);
      if (this.jeda_) aman(() => x.pause());
    }
    this.bicaraDasar = dasar;
  }

  private jadwalKedip(t: ElemenTokoh): void {
    if (!t.dasar || !t.kedip) return;
    const lama = this.timer.get(t.kunci);
    if (lama !== undefined) this.jam.clearTimeout(lama);
    const tunda = 3000 + this.acak() * 3000;
    this.timer.set(t.kunci, this.jam.setTimeout(() => {
      this.timer.delete(t.kunci);
      if (!this.hidup || this.jeda_ || !this.tokoh.includes(t)) return;
      // Salinan kedip yang belum diperbarui untuk pose kini (data-basi) dilewati: pose lama tidak pernah tampil.
      const basi = typeof t.kedip!.hasAttribute === 'function' && t.kedip!.hasAttribute('data-basi');
      if (this.bicaraDasar !== t.dasar && !basi) {
        const opsi: KeyframeAnimationOptions = { duration: 120 };
        const a = this.coba(t.kedip!, [{ visibility: 'visible' }, { visibility: 'visible' }], opsi);
        const b = this.coba(t.dasar!, [{ visibility: 'hidden' }, { visibility: 'hidden' }], opsi);
        this.kedipJalan = [...this.kedipJalan.slice(-6), ...[a, b].filter((x): x is AnimasiLike => !!x)];
      }
      this.jadwalKedip(t);
    }, tunda));
  }

  private coba(el: Element, kf: Keyframe[], opsi: KeyframeAnimationOptions): AnimasiLike | null {
    try {
      return this.animator(el, kf, opsi);
    } catch {
      return null;
    }
  }

  /** Untuk uji: jumlah jadwal kedip yang menunggu. */
  get jumlahJadwal(): number {
    return this.timer.size;
  }
}
