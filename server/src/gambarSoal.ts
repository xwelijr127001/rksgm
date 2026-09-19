/**
 * Gambar soal kustom (buatan desainer, diunggah panitia dari halaman host).
 *
 * - Disimpan di folder `gambar-soal/` di sebelah berkas DB (CONFIG.dbFile), jadi ikut
 *   tercadang bersama datanya dan tidak masuk hasil build client.
 * - Nama berkas = hash isi + ekstensi dari MAGIC BYTES. Nama & Content-Type kiriman client
 *   tidak pernah dipakai untuk menentukan jenis, jadi SVG/HTML yang menyamar tidak lolos.
 * - Penyajian (/gambar-soal/<nama>) hanya menerima nama yang cocok POLA_NAMA_GAMBAR:
 *   tidak ada pemisah folder, jadi path traversal tidak mungkin.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { BATAS_KUSTOM } from '../../shared/bankSoal';
import { CONFIG } from './config';

export const POLA_NAMA_GAMBAR = /^[a-f0-9]{32}\.(png|jpg|webp)$/;
export const MIME_GAMBAR = ['image/png', 'image/jpeg', 'image/webp'] as const;
/** Pengaman disk: jumlah berkas gambar yang boleh tersimpan. */
export const BATAS_JUMLAH_GAMBAR = 500;

export const PESAN_JENIS_GAMBAR = 'Gambar harus berupa PNG, JPEG, atau WebP.';
export const PESAN_TERLALU_BESAR = `Gambar terlalu besar. Maksimal ${Math.round(BATAS_KUSTOM.gambarMaks / (1024 * 1024))} MB.`;

export type EkstensiGambar = 'png' | 'jpg' | 'webp';

export class GalatGambar extends Error {
  constructor(
    pesan: string,
    readonly status: number,
  ) {
    super(pesan);
  }
}

export function folderGambar(): string {
  return path.join(path.dirname(CONFIG.dbFile), 'gambar-soal');
}

/** Jenis gambar dari byte awalnya; null bila bukan PNG/JPEG/WebP (termasuk SVG). */
export function kenaliGambar(buf: Uint8Array): EkstensiGambar | null {
  if (buf.length < 12) return null;
  const awal = (...byte: number[]) => byte.every((b, i) => buf[i] === b);
  if (awal(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'png';
  if (awal(0xff, 0xd8, 0xff)) return 'jpg';
  const ascii = (dari: number, teks: string) => [...teks].every((c, i) => buf[dari + i] === c.charCodeAt(0));
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'webp';
  return null;
}

/** Simpan byte gambar; hasil = alamat publiknya. Isi yang sama -> berkas yang sama (idempoten). */
export function simpanGambar(buf: Buffer): string {
  if (!Buffer.isBuffer(buf) || buf.length === 0) throw new GalatGambar('Berkas gambar kosong.', 400);
  if (buf.length > BATAS_KUSTOM.gambarMaks) throw new GalatGambar(PESAN_TERLALU_BESAR, 413);
  const ext = kenaliGambar(buf);
  if (!ext) throw new GalatGambar(PESAN_JENIS_GAMBAR, 415);

  const nama = createHash('sha256').update(buf).digest('hex').slice(0, 32) + '.' + ext;
  const folder = folderGambar();
  fs.mkdirSync(folder, { recursive: true });
  const tujuan = path.join(folder, nama);
  if (!fs.existsSync(tujuan)) {
    const jumlah = fs.readdirSync(folder).filter((f) => POLA_NAMA_GAMBAR.test(f)).length;
    if (jumlah >= BATAS_JUMLAH_GAMBAR) {
      throw new GalatGambar('Penyimpanan gambar penuh. Hapus soal yang tidak dipakai atau hubungi tim teknis.', 507);
    }
    // Tulis ke berkas sementara lalu ganti nama: pembaca tidak pernah melihat gambar setengah jadi.
    const sementara = `${tujuan}.${process.pid}.tmp`;
    fs.writeFileSync(sementara, buf);
    fs.renameSync(sementara, tujuan);
  }
  return `/gambar-soal/${nama}`;
}

/** Alamat publik -> jalur berkas; null bila bukan alamat gambar hasil unggahan. */
function jalurGambar(src: string): string | null {
  const nama = typeof src === 'string' && src.startsWith('/gambar-soal/') ? src.slice('/gambar-soal/'.length) : '';
  return POLA_NAMA_GAMBAR.test(nama) ? path.join(folderGambar(), nama) : null;
}

/** true bila `src` adalah alamat gambar hasil unggahan yang berkasnya masih ada. */
export function gambarAda(src: string): boolean {
  const jalur = jalurGambar(src);
  return jalur !== null && fs.existsSync(jalur);
}

/** Hapus berkas gambar yang sudah tidak dipakai soal mana pun. Gagal menghapus bukan galat. */
export function hapusGambar(src: string): void {
  const jalur = jalurGambar(src);
  if (!jalur) return;
  try {
    fs.rmSync(jalur, { force: true });
  } catch {
    /* abaikan: berkas yatim tidak mengganggu permainan */
  }
}

