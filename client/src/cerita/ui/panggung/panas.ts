/**
 * PEMANAS CACHE SENI panggung v3 (aturan brief: respons input <= 200 md; gerak narasinya sendiri dikecualikan).
 *
 * Gambar tokoh dibuat generator SVG (seni/tokoh) dan disimpan di cache LRU-nya. Tanpa pemanasan, ketukan yang
 * memulai kedatangan harus membuat pose jalan/berdiri/duduk baru SEKETIKA (± 100 md di HP lambat). Di sini, selagi
 * pemain membaca baris kini, panggung melihat SATU langkah ke depan: komposisi sesudah Lanjut (atau sesudah tiap
 * pilihan yang tersedia), dihitung reducer mesin yang murni (`jalankan`, tidak menulis state apa pun), lalu rencana
 * transisinya disusun dengan PENGGAMBAR PEREKAM (siluet murah) untuk mencatat opsi gambar yang akan diminta. Opsi itu
 * digambar sungguhan saat idle, SATU gambar per giliran, sehingga ketukan pemain tidak pernah menunggu pemanasan
 * lebih dari satu gambar.
 *
 * Presentasi saja: tidak ada yang ditulis ke state cerita; gagal = tidak dipanaskan (ketukan tetap benar, hanya
 * lebih lambat).
 */
import { jalankan, nodeKini, pilihanTersedia, semuaBarisTampil } from '../../mesin';
import { buRinaSementara, missRaksaSementara } from '../../seni/tokoh/sementara';
import type { AksiCerita, Episode, StateCerita } from '../../tipe';
import { adeganKini } from '../adegan';
import type { KomposisiAdegan } from '../adeganTipe';
import { cariTokoh, susunAdegan, type OpsiTokoh, type PenggambarTokoh, type SusunanAdegan } from './dunia';
import { ambilRuang } from './sumber';
import { pabrikTransisi } from './transisi';

/** Opsi satu gambar tokoh (tanpa `id`: varian dibuat sekali lalu diberi awalan per salinan lewat awalanId). */
export type OpsiGambar = OpsiTokoh & { bicara?: boolean; kedip?: boolean; kecil?: boolean };

/**
 * Komposisi yang bisa tampil sesudah SATU aksi pemain berikutnya: Lanjut, atau tiap pilihan yang tersedia (node
 * pilihan yang barisnya sudah semua tampil). Murni; aksi yang tidak sah dilewati.
 */
export function komposisiBerikut(ep: Episode, s: StateCerita): KomposisiAdegan[] {
  const hasil: KomposisiAdegan[] = [];
  const coba = (aksi: AksiCerita) => {
    const n = jalankan(ep, s, aksi);
    if (n !== s) hasil.push(adeganKini(ep, n));
  };
  try {
    coba({ jenis: 'lanjut' });
    const node = nodeKini(ep, s);
    if (node?.jenis === 'pilihan' && semuaBarisTampil(ep, s)) {
      for (const p of pilihanTersedia(ep, s, node)) coba({ jenis: 'pilih', node: s.node, pilihan: p.id });
    }
  } catch {
    /* pratinjau saja: tanpa pemanasan */
  }
  return hasil;
}

/** Kunci stabil opsi gambar (urutan properti tidak berpengaruh). */
export function kunciOpsi(o: OpsiGambar): string {
  const r = o as Record<string, unknown>;
  return Object.keys(r).filter((k) => r[k] !== undefined && r[k] !== false).sort().map((k) => `${k}=${String(r[k])}`).join('|');
}

/**
 * Opsi gambar yang akan diminta panggung bila komposisi `k` menggantikan susunan `lama` pada kotak w x h: pose akhir
 * tiap tokoh, pose sementara & pose jalan rencana transisinya, salinan kedip (dan mulut terbuka bila tokoh itu
 * pembicara), serta potret sisipan telepon. Urutan = urutan kebutuhan (pose rencana dulu, varian kedip terakhir).
 * `gerak` false (gerak dikurangi / mode ringan): hanya pose akhir & potret sisipan (tanpa rencana, kedip, mulut).
 */
export function opsiPanas(
  lama: SusunanAdegan,
  k: KomposisiAdegan,
  w: number,
  h: number,
  o: { gerak: boolean; depanMulai?: number; hadapKanan: () => boolean; dudukTurun?: () => boolean; dudukTurunMentor?: () => boolean; sisipanKecil?: boolean },
): OpsiGambar[] {
  const daftar = new Map<string, OpsiGambar>();
  const catat = (x: OpsiGambar) => {
    const kunci = kunciOpsi(x);
    if (!daftar.has(kunci)) daftar.set(kunci, x);
  };
  const perekam: PenggambarTokoh = (x) => {
    const { id: _id, ...opsi } = x;
    void _id;
    catat(opsi);
    return x.siapa === 'mentor' ? missRaksaSementara(opsi as Parameters<typeof missRaksaSementara>[0]) : buRinaSementara(opsi as Parameters<typeof buRinaSementara>[0]);
  };
  const baru = susunAdegan(k, ambilRuang(k.lokasi), perekam);
  if (o.gerak) {
    const aksiBaru = !!k.aksi && k.aksi.kunci !== (lama.komposisi.aksi?.kunci ?? null);
    const pabrik = pabrikTransisi({
      lama, baru, aksiBaru, depanMulai: o.depanMulai, hadapKanan: o.hadapKanan, dudukTurun: o.dudukTurun, dudukTurunMentor: o.dudukTurunMentor, gambar: perekam,
    });
    const r = pabrik && w > 0 && h > 0 ? pabrik(w, h) : null;
    for (const a of r?.aktor ?? []) {
      if (a.jenis === 'jalan') for (const s of a.salinan) catat(s.opsi);
    }
    const p = k.pembicara;
    for (const l of baru.tokoh) {
      catat({ ...l.opsi, kedip: true });
      if (l.siapa === p) catat({ ...l.opsi, bicara: true });
    }
  }
  const tel = k.nasabah?.lewatTelepon ? k.nasabah : null;
  if (tel) catat({ siapa: 'nasabah', pose: 'telepon', ekspresi: tel.ekspresi, ...(o.sisipanKecil ? { kecil: true } : {}) });
  return [...daftar.values()];
}

// ------------------------------------------------------------------ penjadwal idle

export interface JamIdle {
  minta(fn: (sisa: () => number) => void): unknown;
  batal(id: unknown): void;
}

type RIC = (fn: (d: { timeRemaining(): number }) => void, o?: { timeout?: number }) => number;

/** requestIdleCallback bila ada (Safari belum): cadangan setTimeout 80 md (tanpa info sisa waktu = satu langkah). */
export const jamIdleDom: JamIdle = {
  minta(fn) {
    const w = window as unknown as { requestIdleCallback?: RIC };
    if (typeof w.requestIdleCallback === 'function') return { ric: w.requestIdleCallback((d) => fn(() => d.timeRemaining())) };
    return { st: window.setTimeout(() => fn(() => 0), 80) };
  },
  batal(id) {
    const x = id as { ric?: number; st?: number };
    const w = window as unknown as { cancelIdleCallback?: (n: number) => void };
    if (x.ric !== undefined) w.cancelIdleCallback?.(x.ric);
    if (x.st !== undefined) window.clearTimeout(x.st);
  },
};

/**
 * Menjalankan langkah-langkah (satu langkah = satu gambar) saat idle. Satu langkah per giliran; langkah berikutnya
 * di giliran yang sama hanya bila sisa waktu idle masih > `cadangan` md. Mengembalikan fungsi pembatal.
 */
export function jalankanSaatIdle(langkah: Iterator<unknown>, jam: JamIdle = jamIdleDom, cadangan = 25): () => void {
  let batal = false;
  let id: unknown = null;
  const giliran = (sisa: () => number) => {
    id = null;
    if (batal) return;
    do {
      let r: IteratorResult<unknown>;
      try {
        r = langkah.next();
      } catch {
        return;
      }
      if (r.done || batal) return;
    } while (sisa() > cadangan);
    id = jam.minta(giliran);
  };
  id = jam.minta(giliran);
  return () => {
    batal = true;
    if (id !== null) jam.batal(id);
    id = null;
  };
}
