/**
 * PEMILIH TRANSISI panggung v3 (murni, tanpa DOM): "susunan lama -> susunan baru" menjadi PABRIK rencana
 * `(w, h) => Rencana` untuk ukuran kotak panggung. Dipakai Panggung saat komposisi berganti, dan oleh pemanas cache
 * seni (panas.ts) untuk komposisi BERIKUTNYA dengan penggambar perekam (jadi pemanas meminta gambar yang persis sama
 * dengan yang nanti diminta rencana sungguhan, tanpa menyalin aturannya).
 */
import type { KomposisiAdegan } from '../adeganTipe';
import { ambilRuang } from './sumber';
import { LANDASAN_KARTU } from '../../seni/ruang/geometri';
import { buatLetak, cariTokoh, DUNIA_W, gabungKotak, intiTokoh, kotakKepala, kotakKepalaRapat, kotakPenting, poseDuduk, potongKeDunia, susunAdegan, Z, type Kotak, type PenggambarTokoh, type SusunanAdegan } from './dunia';
import { jenisBingkai, pasKamera, pasKameraBukaan, pasKameraPintu, qPiksel, rectBingkai, rectDenganPintu, rectPembuka, samaKamera, type JenisBingkai, type Kamera, type Pad } from './kamera';
import { kotakPapan, susunanPiksel } from './piksel';
import { rencanaGanti, rencanaKartu, rencanaMasuk, rencanaPembuka, rencanaPergi, rencanaPindah, type KonteksRencana, type Rencana } from './rencana';

/**
 * Pita bawah (px) yang dijaga bebas wajah/tangan: label suasana; saat kedatangan pita lebih tinggi (dulu untuk tombol
 * "Lewati pembuka" di panggung; v5.1 tombol di kotak dialog, pita tetap untuk cadangan tombol tanpa baris kaki dan
 * supaya bingkai kedatangan v5 tidak berubah).
 */
export function padKamera(jenis: JenisBingkai, denganTombol: boolean): Pad {
  const bawah = denganTombol ? 56 : jenis === 'hp' ? 34 : 44;
  return { atas: 6, bawah, kiri: 4, kanan: 4 };
}

/**
 * Kotak yang wajib utuh saat kamera dipaskan ke piksel bulat (selain kepala + tangan tokoh = `inti`): papan nama
 * ruang; saat kedatangan/kepergian (`pintu`) juga bukaan pintu.
 */
export function wajibPiksel(s: SusunanAdegan, pintu: boolean): Kotak | null {
  let k: Kotak | null = kotakPapan(s.ruang);
  if (pintu && s.ruang.pintu) k = gabungKotak(k, s.ruang.pintu.bukaan);
  return k;
}

/** Opsi kamera satu susunan. `dpr` (devicePixelRatio) = mode piksel: kamera dipaskan ke piksel bulat bila ruang atau tokohnya raster. */
export interface OpsiKamera {
  pintu?: boolean;
  tambahan?: Kotak | null;
  dpr?: number | null;
  /** Pecahan piksel perangkat asal kotak panggung (kamera.ts OpsiPiksel.asal). */
  asal?: { x: number; y: number } | null;
}

/**
 * Kamera akhir sebuah susunan. `pintu` = bingkai juga memperlihatkan pintu (kedatangan / kepergian); `tambahan` =
 * kotak lain yang wajib utuh selama gerak (kepala tokoh yang berdiri / berjalan). `dpr` + ruang/tokoh raster = skala
 * piksel bulat (kamera.ts OpsiPiksel); ruang SVG tetap memakai skala bingkai apa adanya.
 */
export function kameraUntuk(s: SusunanAdegan, W: number, H: number, opsi: OpsiKamera = {}): Kamera {
  const jenis = jenisBingkai(W);
  const tambahan = potongKeDunia(opsi.tambahan ?? null);
  const inti = gabungKotak(s.inti, tambahan);
  let rect = rectBingkai(s.komposisi.lokasi, jenis, inti);
  if (opsi.pintu) rect = rectDenganPintu(rect, s.ruang.pintu?.bukaan);
  const pad = padKamera(jenis, !!opsi.pintu);
  if (!opsi.dpr || !susunanPiksel(s)) return pasKamera(W, H, rect, inti, pad, null);
  const piksel = { q: qPiksel(opsi.dpr), wajib: wajibPiksel(s, !!opsi.pintu), asal: opsi.asal ?? undefined, rataKanan: pintuDiTepiKanan(s) };
  const meja = opsi.pintu ? null : percakapanMeja(s);
  if (!meja) return pasKamera(W, H, rect, inti, pad, piksel);
  return pasKamera(W, H, rect, gabungKotak(meja.inti, tambahan), pad, { ...piksel, wajib: gabungKotak(piksel.wajib, meja.wajib), bebas: meja.bebas });
}

/**
 * PERCAKAPAN DI MEJA (mode piksel; ruang layanan `meja`, Miss Raksa duduk; v5 komposisi-meja): SATU bingkai untuk semua
 * baris duduk, jadi kamera tidak bergeser per baris hanya karena pose (Miss Raksa menunjuk kartu, Bu Rina condong
 * memegang kunci di lutut, gestur lain), dan kamera percakapan = kamera akhir kedatangan & kepergian.
 *  - `inti` = Miss Raksa (kepala + tangan di meja), dijaga di atas pita bawah seperti biasa;
 *  - `wajib` = zona landasan kartu (`tempat.kartuMeja` ± LANDASAN_KARTU), juga di atas pita bawah: ujung telunjuk pose
 *    tunjuk & kartu selalu di zona ini, jadi baris kartu memakai kamera yang sama dengan baris lain;
 *  - `bebas` = Bu Rina (kepala + tangan): utuh di panggung TANPA pita bawah. Ia selalu di kanan (kursi pengunjung);
 *    label suasana ada di pita bawah KIRI (cerita.css `.cer-suasana`: "Bu Rina · <perasaan>", ± 110-150 px) dan
 *    tidak pernah sampai ke pangkuan/lututnya (diuji kamera.test.ts). Tombol "Lewati pembuka" ada di kotak dialog
 *    (v5.1), bukan di panggung.
 * null = bukan komposisi itu (kamera biasa).
 */
export function percakapanMeja(s: SusunanAdegan): { inti: Kotak | null; wajib: Kotak | null; bebas: Kotak | null } | null {
  if (s.komposisi.lokasi !== 'meja' || !s.ruang.belakangMeja) return null;
  const mentor = s.tokoh.find((t) => t.siapa === 'mentor');
  if (!mentor || !poseDuduk(mentor.opsi.pose)) return null;
  const km = s.ruang.tempat.kartuMeja;
  const zona = km ? { x: km.x - LANDASAN_KARTU.w / 2, y: km.y - LANDASAN_KARTU.h / 2, w: LANDASAN_KARTU.w, h: LANDASAN_KARTU.h } : null;
  return { inti: intiTokoh([mentor]), wajib: potongKeDunia(zona), bebas: intiTokoh(s.tokoh.filter((t) => t.siapa === 'nasabah')) };
}

/** Ruang yang tepi kanan dunianya bukaan pintu (ruang layanan: pintu di sekat kanan): letterbox mendatar rata kanan. */
export function pintuDiTepiKanan(s: SusunanAdegan): boolean {
  const b = s.ruang.pintu?.bukaan;
  return !!b && b.x + b.w >= DUNIA_W - 1e-6;
}

/**
 * Kamera kedatangan ('masuk', susunan = komposisi BARU) / kepergian ('pergi', susunan = komposisi LAMA). Mode piksel
 * (dpr + ruang/tokoh raster): kamera.ts `pasKameraPintu` = skala piksel kamera percakapan susunan itu, bergeser ke
 * pintu; wajib = kepala RAPAT + tangan tokoh selama gerak (kepalaBerdiri), dan untuk kepergian juga tokoh yang tetap
 * duduk (Miss Raksa). Kedatangan menjaga pita bawah lebih tinggi (padKamera); kepergian (tanpa tombol, tanpa label suasana
 * karena kursi kosong sesudahnya) hanya pita tipis. Ruang SVG (PNG gagal & tokoh SVG) = bingkai lama (rectDenganPintu).
 */
export function kameraPintu(s: SusunanAdegan, W: number, H: number, jenisAksi: 'masuk' | 'pergi', gambar: PenggambarTokoh, opsi: Pick<OpsiKamera, 'dpr' | 'asal'> = {}): Kamera {
  const b = s.ruang.pintu?.bukaan ?? null;
  if (!opsi.dpr || !susunanPiksel(s) || !b) return kameraUntuk(s, W, H, { ...opsi, pintu: true, tambahan: kepalaBerdiri(s, jenisAksi === 'masuk', gambar, false) });
  const berdiri = kepalaBerdiri(s, jenisAksi === 'masuk', gambar);
  const dasar = kameraUntuk(s, W, H, opsi);
  const tetap = jenisAksi === 'pergi' ? intiTokoh(s.tokoh.filter((t) => t.siapa !== 'nasabah'), true) : null;
  const wajib = gabungKotak(potongKeDunia(berdiri), tetap);
  if (!wajib) return dasar;
  const jenis = jenisBingkai(W);
  const pad = jenisAksi === 'masuk' ? padKamera(jenis, true) : { atas: 0, bawah: 6, kiri: 0, kanan: 0 };
  return pasKameraPintu(W, H, dasar, { q: qPiksel(opsi.dpr), wajib, pintu: b, pad, asal: opsi.asal ?? undefined });
}

/**
 * Baris kepergian yang DITAHAN di bingkai kepergian (v5.1, review HP 29 Sep): aksi 'pergi', kursi pengunjung kosong,
 * mode piksel, ruang berpintu.
 */
function tahanPergi(s: SusunanAdegan, aksi: KomposisiAdegan['aksi'] | null | undefined, dpr: number | null | undefined): boolean {
  return aksi?.jenis === 'pergi' && !!dpr && susunanPiksel(s) && !!s.ruang.pintu && !cariTokoh(s, 'nasabah');
}

/**
 * KAMERA DIAM komposisi kini (Panggung & pabrikTransisi). v5.1: baris kepergian (tahanPergi) memakai bingkai
 * kepergian (kameraPintu 'pergi': Miss Raksa duduk utuh, kursi kosong, sisi pintu; skala percakapan) SEBAGAI kamera
 * diamnya, jadi kamera tidak kembali ke percakapan di ujung gerak pergi (dulu: geser ke pintu lalu kembali dalam 2,9
 * dtk). Bingkai percakapan kembali di baris berikutnya (Miss Raksa bicara) lewat geser biasa. Desktop: bingkai
 * kepergian = bingkai percakapan (tanpa perubahan). Selain itu = kameraUntuk.
 */
export function kameraDiam(s: SusunanAdegan, W: number, H: number, aksi: KomposisiAdegan['aksi'] | null | undefined, gambar: PenggambarTokoh, opsi: Pick<OpsiKamera, 'dpr' | 'asal'> = {}): Kamera {
  if (tahanPergi(s, aksi, opsi.dpr)) return kameraPintu(s, W, H, 'pergi', gambar, opsi);
  return kameraUntuk(s, W, H, opsi);
}

/**
 * Kamera kedatangan (v5.1): `pintu` = bingkai kedatangan (kameraPintu 'masuk'); `bukaan` = bingkai PINTU yang dipakai
 * lebih dulu bila `pintu` tidak memperlihatkan seluruh bukaan (kamera.ts pasKameraBukaan; null = tidak perlu: desktop,
 * HP lebar, ruang SVG, ruang tanpa pintu).
 */
export function kameraKedatangan(s: SusunanAdegan, W: number, H: number, gambar: PenggambarTokoh, opsi: Pick<OpsiKamera, 'dpr' | 'asal'> = {}): { pintu: Kamera; bukaan: Kamera | null } {
  const pintu = kameraPintu(s, W, H, 'masuk', gambar, opsi);
  const b = s.ruang.pintu?.bukaan ?? null;
  if (!opsi.dpr || !susunanPiksel(s) || !b) return { pintu, bukaan: null };
  return { pintu, bukaan: pasKameraBukaan(W, H, pintu, b, qPiksel(opsi.dpr), opsi.asal ?? undefined) };
}

/**
 * Kepala yang tampil selama kedatangan/kepergian (Bu Rina berdiri di samping kursi, Miss Raksa berdiri
 * mempersilakan), supaya kamera gerak tidak memotongnya. Dihitung dari tempat ruang + jangkar gambar. `rapat` (mode
 * piksel): kepala RAPAT (dunia.ts kotakKepalaRapat) + tangan gestur mempersilakan Miss Raksa; false = kotak kepala lama.
 */
export function kepalaBerdiri(s: SusunanAdegan, mentor: boolean, gambar: PenggambarTokoh, rapat = true): Kotak | null {
  const t = s.ruang.tempat;
  const ujung = t.jalurMasuk[t.jalurMasuk.length - 1];
  let k: Kotak | null = null;
  if (ujung) {
    const n = buatLetak({ siapa: 'nasabah', pose: 'berdiri', ekspresi: 'netral', kunci: true }, ujung.titik, ujung.skala, Z.nasabah, gambar);
    k = gabungKotak(k, rapat ? kotakKepalaRapat(n) : kotakKepala(n));
  }
  if (mentor) {
    const m = buatLetak({ siapa: 'mentor', pose: 'berdiri-persilakan', ekspresi: 'tersenyum', pandang: 'lawan' }, t.mentorBerdiri, t.skalaMentor, Z.belakang, gambar);
    k = gabungKotak(k, rapat ? kotakPenting(m, true) : kotakKepala(m));
  }
  return k;
}

export type PabrikRencana = (w: number, h: number) => Rencana | null;

export interface MasukanTransisi {
  lama: SusunanAdegan | null;
  baru: SusunanAdegan;
  /**
   * Aksi komposisi KINI. Susunan dimemo pada tanda gambar (tanpa aksi), jadi `baru.komposisi.aksi` bisa milik baris
   * sebelumnya bila gambarnya sama; nilai ini yang dipakai. Tanpa nilai (undefined) = `baru.komposisi.aksi`.
   */
  aksi?: KomposisiAdegan['aksi'];
  /** Aksi komposisi baru BELUM dilihat di sesi halaman ini (kuncinya berubah): aksi diputar. */
  aksiBaru: boolean;
  /** Aksi komposisi LAMA (baris sebelumnya) untuk kamera diamnya (kameraDiam); tanpa nilai = `lama.komposisi.aksi`. */
  aksiLama?: KomposisiAdegan['aksi'];
  /** Indeks jalur masuk mulai lapisan pengunjung (seni ruang), bila ada. */
  depanMulai?: number;
  /** Generator Bu Rina mendukung `hadap: 'kanan'` (dicek malas: hanya bila aksi pergi diputar). */
  hadapKanan: () => boolean;
  /** Generator Bu Rina punya bingkai antara `duduk-turun` (dicek malas: hanya bila aksi masuk/pergi diputar). */
  dudukTurun?: () => boolean;
  /** Atlas Miss Raksa punya bingkai antara `duduk-turun` (dicek malas: hanya bila aksi masuk diputar). */
  dudukTurunMentor?: () => boolean;
  gambar: PenggambarTokoh;
  /** devicePixelRatio untuk kamera piksel bulat (ruang/tokoh raster); tanpa nilai = skala bingkai apa adanya. */
  dpr?: number | null;
  /** Pecahan piksel perangkat asal kotak panggung (kamera piksel bulat). */
  asal?: { x: number; y: number } | null;
}

/**
 * Pabrik rencana untuk pergantian komposisi (tanpa pembuka), atau null bila tidak ada yang perlu digerakkan.
 * Aturan pemilihan (docs/cerita/ADEGAN-AUTO1.md bagian 4): aksi baru = rencana aksinya (masuk/pergi di baris yang
 * juga berpindah lokasi = cukup larut); tanpa aksi = larut lokasi bila lokasi berganti, selain itu ganti kecil.
 */
export function pabrikTransisi(m: MasukanTransisi): PabrikRencana | null {
  const { lama, baru, gambar } = m;
  const dpr = m.dpr ?? null;
  const asal = m.asal ?? null;
  const aksi = m.aksi !== undefined ? m.aksi : baru.komposisi.aksi;
  const aksiLama = m.aksiLama !== undefined ? m.aksiLama : lama?.komposisi.aksi ?? null;
  const ctx = (w: number, h: number): KonteksRencana => ({
    lama,
    baru,
    kamLama: lama ? kameraDiam(lama, w, h, aksiLama, gambar, { dpr, asal }) : null,
    kamBaru: kameraDiam(baru, w, h, aksi, gambar, { dpr, asal }),
    depanMulai: m.depanMulai,
  });
  const pindahLokasi = !!lama && lama.komposisi.lokasi !== baru.komposisi.lokasi;
  // Gambar sama tetapi kamera diam berganti (baris sesudah kepergian yang ditahan, mis. Miss Raksa bicara): geser kamera.
  const gantiKamera: PabrikRencana | null = lama && tahanPergi(lama, aksiLama, dpr) !== tahanPergi(baru, aksi, dpr)
    ? (w, h) => { const c = ctx(w, h); return c.kamLama && !samaKamera(c.kamLama, c.kamBaru) ? rencanaGanti(c) : null; }
    : null;
  if (m.aksiBaru && aksi) {
    const jenis = aksi.jenis;
    if ((jenis === 'masuk' || jenis === 'pergi') && pindahLokasi) {
      // Kedatangan/kepergian di baris yang juga berpindah lokasi: cukup larut ke adegan baru.
      return (w, h) => rencanaPindah(ctx(w, h), jenis);
    }
    if (jenis === 'masuk') {
      const dudukTurun = m.dudukTurun?.() === true;
      const mentorTurun = m.dudukTurunMentor?.() === true;
      return (w, h) => {
        const k = kameraKedatangan(baru, w, h, gambar, { dpr, asal });
        return rencanaMasuk({ ...ctx(w, h), dudukTurun, mentorTurun, kamPintu: k.pintu, kamBukaan: k.bukaan }, (o) => gambar(o));
      };
    }
    if (jenis === 'pergi') {
      const hadapKanan = m.hadapKanan();
      const dudukTurun = m.dudukTurun?.() === true;
      const tahan = tahanPergi(baru, aksi, dpr);
      return (w, h) => {
        const c = ctx(w, h);
        // Ditahan (HP): satu geser ke bingkai kepergian (= kamera diam baris ini), lalu diam sampai Bu Rina keluar.
        return rencanaPergi({ ...c, hadapKanan, dudukTurun, kamPintu: tahan ? c.kamBaru : lama ? kameraPintu(lama, w, h, 'pergi', gambar, { dpr, asal }) : null }, (o) => gambar(o));
      };
    }
    // Kartu di baris yang juga berpindah lokasi (b4-polis-intro.1): larut lokasi dulu, lalu kartu & menunjuk.
    if (jenis === 'kartu') return (w, h) => rencanaKartu(ctx(w, h), (o) => gambar(o));
    if (lama && lama.tanda !== baru.tanda) return (w, h) => rencanaPindah(ctx(w, h));
    return gantiKamera;
  }
  if (lama && lama.tanda !== baru.tanda) return (w, h) => (pindahLokasi ? rencanaPindah(ctx(w, h)) : rencanaGanti(ctx(w, h)));
  return gantiKamera;
}

/** Rencana pembuka: lapisan `pintu-luar` (tanpa tokoh) dengan dorongan kamera ke pintu + papan nama. */
export function buatPembuka(akhir: SusunanAdegan, W: number, H: number, eksterior: { nama: string; aset: string } | null, gambar: PenggambarTokoh): Rencana {
  const ruangLuar = ambilRuang('pintu-luar');
  const luar = susunAdegan({ ...akhir.komposisi, lokasi: 'pintu-luar', mentor: null, nasabah: null, aksi: null }, ruangLuar, gambar);
  const fokus: Kotak | null = gabungKotak(kotakPapan(ruangLuar), ruangLuar.pintu?.bukaan ?? null);
  const { dari, ke } = rectPembuka(fokus);
  return rencanaPembuka(luar, pasKamera(W, H, dari), pasKamera(W, H, ke), eksterior);
}
