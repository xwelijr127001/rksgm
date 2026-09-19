/**
 * Pemanggilan REST bank soal untuk halaman host (kontrak: docs/rancangan-bank-soal.md bagian 3
 * + shared/bankSoal.ts). Playlist room TIDAK lewat sini: itu socket `host:playlist` (store.ts).
 *
 * Semua fungsi tahan galat: tidak pernah melempar, dan membedakan "API belum ada di server ini"
 * (404 tanpa JSON) dari "server menolak" supaya halaman host lama tetap berfungsi dan panitia
 * mendapat pesan yang ramah.
 */

import { useEffect, useState } from 'react';
import type { BankSoal, IdPaket, RingkasSoal, SoalKustom } from '@shared/bankSoal';
import { t } from '../i18n';
import { terjemahkanGalat } from '../i18n/galat';
import { getState, savedPin } from './store';

export type JenisGalatBank =
  /** fetch gagal: jaringan putus / server mati. */
  | 'jaringan'
  /** Alamat API belum ada di server ini (server versi lama). */
  | 'belumAda'
  /** 401/403: PIN panitia atau token host tidak diterima. */
  | 'ditolak'
  /** 4xx lain: isi kiriman tidak sah (lihat `rincian`). */
  | 'tidakSah'
  /** 5xx atau jawaban yang tidak dimengerti. */
  | 'server';

export interface GagalBank {
  ok: false;
  jenis: JenisGalatBank;
  /** Pesan Indonesia dari server (bila ada); kosong = pakai pesan bawaan per jenis. */
  error: string;
  /** Rincian validasi dari server, satu butir per masalah. */
  rincian: string[];
  /** Status HTTP (0 = tidak sampai ke server). */
  status: number;
}

export type HasilBank<T> = { ok: true; data: T } | GagalBank;

/**
 * Server menolak karena PIN panitia SALAH (bukan karena token host, bukan karena terkunci
 * sementara): PIN tersimpan perlu dibuang dan diminta ulang. Server mengirim teks Indonesia
 * ("PIN panitia salah"), jadi cukup dikenali dari kata PIN + status 403.
 */
export function pinSalah(g: GagalBank): boolean {
  return g.jenis === 'ditolak' && g.status !== 429 && /PIN/.test(g.error);
}

/** Pesan galat untuk ditampilkan, dalam bahasa aktif. */
export function pesanGalatBank(g: GagalBank): string {
  return g.error ? terjemahkanGalat(g.error) : t(`bank.galat.${g.jenis}`);
}

// ------------------------------------------------------------------ dasar

function headerOtorisasi(): Record<string, string> {
  const { room, hostToken } = getState();
  const h: Record<string, string> = {};
  if (room?.code) h['x-room-code'] = room.code;
  if (hostToken) h['x-host-token'] = hostToken;
  const pin = savedPin();
  if (pin) h['x-panitia-pin'] = pin;
  return h;
}

function gagal(jenis: JenisGalatBank, error = '', rincian: string[] = [], status = 0): GagalBank {
  return { ok: false, jenis, error, rincian, status };
}

async function panggil(
  metode: 'GET' | 'POST' | 'PUT' | 'DELETE',
  alamat: string,
  opsi: { otorisasi?: boolean; json?: unknown; badan?: Blob; jenisIsi?: string } = {},
): Promise<HasilBank<Record<string, unknown>>> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (opsi.otorisasi) Object.assign(headers, headerOtorisasi());
  let body: BodyInit | undefined;
  if (opsi.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opsi.json);
  } else if (opsi.badan) {
    headers['Content-Type'] = opsi.jenisIsi ?? opsi.badan.type;
    body = opsi.badan;
  }

  let res: Response;
  try {
    res = await fetch(alamat, { method: metode, headers, body });
  } catch {
    return gagal('jaringan');
  }

  let isi: Record<string, unknown> | null = null;
  try {
    const mentah: unknown = await res.json();
    if (mentah && typeof mentah === 'object' && !Array.isArray(mentah)) isi = mentah as Record<string, unknown>;
  } catch {
    isi = null;
  }

  const error = typeof isi?.error === 'string' ? isi.error : '';
  const rincian = Array.isArray(isi?.rincian) ? isi.rincian.filter((r): r is string => typeof r === 'string') : [];

  if (!res.ok || isi?.ok === false) {
    if (!isi && res.status === 404) return gagal('belumAda', '', [], 404);
    // 429 = terlalu banyak percobaan PIN (server mengunci sementara).
    if (res.status === 401 || res.status === 403 || res.status === 429) return gagal('ditolak', error, rincian, res.status);
    if (res.status >= 400 && res.status < 500) return gagal('tidakSah', error, rincian, res.status);
    return gagal('server', error, rincian, res.status);
  }
  if (!isi) return gagal('server', '', [], res.status);
  return { ok: true, data: isi };
}

// ------------------------------------------------------------------ konfigurasi server

export interface KonfigBank {
  /** Server memasang PANITIA_PIN. */
  butuhPin: boolean;
  /** false = server versi lama (GET /api/config belum memberi `butuhPin`). */
  dikenal: boolean;
  paketBawaan: IdPaket | null;
}

let janjiKonfig: Promise<KonfigBank | null> | null = null;

/** GET /api/config (sekali per halaman; gagal = boleh dicoba lagi). */
export function ambilKonfig(): Promise<KonfigBank | null> {
  if (!janjiKonfig) {
    janjiKonfig = panggil('GET', '/api/config').then((h) => {
      if (!h.ok) {
        janjiKonfig = null;
        return null;
      }
      const paket = h.data.paketBawaan;
      return {
        butuhPin: h.data.butuhPin === true,
        dikenal: typeof h.data.butuhPin === 'boolean',
        paketBawaan: paket === 'acara' || paket === 'latihan' ? paket : null,
      };
    });
  }
  return janjiKonfig;
}

/** Konfigurasi server untuk komponen; null selama memuat atau bila server tidak menjawab. */
export function useKonfigBank(): KonfigBank | null {
  const [konfig, setKonfig] = useState<KonfigBank | null>(null);
  useEffect(() => {
    let hidup = true;
    void ambilKonfig().then((k) => {
      if (hidup) setKonfig(k);
    });
    return () => {
      hidup = false;
    };
  }, []);
  return konfig;
}

// ------------------------------------------------------------------ bank

const PRODUK = ['AUTO', 'HVC', 'FIRE', 'CARGO', 'MIX'];

function ringkasSah(v: unknown): v is RingkasSoal {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === 'string' && typeof r.judul === 'string' && typeof r.asal === 'string';
}

/** Rapikan jawaban GET /api/bank: isian yang hilang diberi nilai aman supaya daftar tetap tampil. */
function rapikanBank(isi: Record<string, unknown>): BankSoal | null {
  // Kontrak: BankSoal langsung di badan jawaban. Bungkus `bank`/`data` ikut diterima.
  const inti = (isi.bank ?? isi.data ?? isi) as Record<string, unknown>;
  if (!inti || typeof inti !== 'object' || !Array.isArray(inti.soal)) return null;
  const paketMentah = (inti.paket ?? {}) as Record<string, unknown>;
  const daftarId = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const soal: RingkasSoal[] = inti.soal.filter(ringkasSah).map((r) => ({
    id: r.id,
    judul: r.judul,
    produk: PRODUK.includes(r.produk) ? r.produk : 'MIX',
    tingkat: r.tingkat === 1 || r.tingkat === 3 ? r.tingkat : 2,
    asal: r.asal === 'latihan' || r.asal === 'acara' ? r.asal : 'kustom',
    langkah: Number.isFinite(r.langkah) ? r.langkah : 1,
    durasi: Number.isFinite(r.durasi) ? r.durasi : 60,
    gambar: typeof r.gambar === 'string' && r.gambar ? r.gambar : null,
  }));
  return {
    paket: { latihan: daftarId(paketMentah.latihan), acara: daftarId(paketMentah.acara) },
    soal,
    bawaan: inti.bawaan === 'acara' ? 'acara' : 'latihan',
  };
}

/** GET /api/bank: ringkasan semua soal (tanpa isi & kunci). Tidak butuh otorisasi. */
export async function ambilBank(): Promise<HasilBank<BankSoal>> {
  const h = await panggil('GET', '/api/bank');
  if (!h.ok) return h;
  const bank = rapikanBank(h.data);
  return bank ? { ok: true, data: bank } : gagal('server');
}

function soalDari(isi: Record<string, unknown>): HasilBank<SoalKustom> {
  const soal = isi.soal as SoalKustom | undefined;
  if (!soal || typeof soal !== 'object' || typeof soal.id !== 'string' || !Array.isArray(soal.steps)) return gagal('server');
  return { ok: true, data: soal };
}

/** GET /api/bank/soal/:id: soal kustom LENGKAP dengan kunci (hanya untuk editor). */
export async function ambilSoal(id: string): Promise<HasilBank<SoalKustom>> {
  const h = await panggil('GET', `/api/bank/soal/${encodeURIComponent(id)}`, { otorisasi: true });
  return h.ok ? soalDari(h.data) : h;
}

/** POST (baru, `id` kosong) atau PUT (ubah) soal kustom. Galat validasi server ada di `rincian`. */
export async function simpanSoal(soal: SoalKustom): Promise<HasilBank<SoalKustom>> {
  const h = soal.id
    ? await panggil('PUT', `/api/bank/soal/${encodeURIComponent(soal.id)}`, { otorisasi: true, json: soal })
    : await panggil('POST', '/api/bank/soal', { otorisasi: true, json: soal });
  return h.ok ? soalDari(h.data) : h;
}

export async function hapusSoal(id: string): Promise<HasilBank<null>> {
  const h = await panggil('DELETE', `/api/bank/soal/${encodeURIComponent(id)}`, { otorisasi: true });
  return h.ok ? { ok: true, data: null } : h;
}

export const JENIS_GAMBAR = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** POST /api/bank/gambar: badan = byte gambar. Mengembalikan alamat `/gambar-soal/...`. */
export async function unggahGambar(berkas: Blob): Promise<HasilBank<string>> {
  const h = await panggil('POST', '/api/bank/gambar', { otorisasi: true, badan: berkas, jenisIsi: berkas.type });
  if (!h.ok) return h;
  return typeof h.data.src === 'string' && h.data.src ? { ok: true, data: h.data.src } : gagal('server');
}
