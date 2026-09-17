/**
 * Menyajikan hasil build Unity Web.
 *
 * Unity mewajibkan MIME type & header Content-Encoding yang tepat, kalau tidak
 * browser gagal memuat .wasm/.data. Referensi resmi (Unity 6, "Server
 * configuration for Web builds"):
 *   .wasm            -> application/wasm
 *   .data            -> application/octet-stream
 *   .symbols.json    -> application/octet-stream
 *   *.gz             -> Content-Encoding: gzip
 *   *.br             -> Content-Encoding: br
 *   .data.gz         -> application/gzip  (bukan octet-stream, karena bug Safari)
 *
 * Route /unity/* TIDAK BOLEH jatuh ke fallback SPA: file Unity yang hilang harus
 * menjadi 404, bukan halaman HTML (kalau HTML, loader Unity gagal dengan pesan aneh).
 */

import fs from 'node:fs';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { CONFIG } from './config';

export interface UnityStatus {
  available: boolean;
  /** URL loader yang dipakai client, mis. /unity/Build/Web.loader.js */
  loaderUrl: string | null;
  /**
   * URL aset yang dibaca LANGSUNG dari index.html hasil build Unity.
   * Tidak ditebak dari sufiks: nama & ekstensi berbeda antar mode kompresi
   * (.unityweb bila decompression fallback aktif, .gz / .br bila tidak).
   */
  dataUrl: string | null;
  frameworkUrl: string | null;
  codeUrl: string | null;
  streamingAssetsUrl: string | null;
  /** Nama dasar build (mis. "Web"), hanya untuk informasi. */
  buildName: string | null;
  /**
   * 'unityweb' = Unity mendekompresi sendiri di JavaScript (decompression
   * fallback aktif); server TIDAK boleh mengirim Content-Encoding.
   * 'gzip' / 'br' = server yang mengirim Content-Encoding.
   */
  compression: 'gzip' | 'br' | 'unityweb' | 'none' | null;
  /** Total ukuran folder build dalam MB (1 desimal). */
  totalMb: number | null;
  /** Ukuran file yang benar-benar diunduh peserta (loader+framework+code+data), MB. */
  downloadMb: number | null;
  /** Cap waktu file loader, dipakai sebagai versi cache. */
  version: string | null;
  buildDir: string;
  /** Penjelasan singkat bila tidak tersedia. */
  reason?: string;
}

const MIME: Record<string, string> = {
  '.wasm': 'application/wasm',
  '.js': 'application/javascript; charset=utf-8',
  '.data': 'application/octet-stream',
  '.json': 'application/json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.bin': 'application/octet-stream',
  '.mem': 'application/octet-stream',
  '.unityweb': 'application/octet-stream',
};

/**
 * Tentukan MIME + Content-Encoding untuk satu nama file build Unity.
 *
 * `sniffed` dipakai untuk berkas `.unityweb` (mode decompression fallback):
 * ekstensinya tidak memberi tahu isinya gzip atau brotli, jadi harus dibaca
 * dari magic byte berkasnya. Unity sendiri menyarankan header ini dipasang -
 * loader-nya mencetak "You can reduce startup time if you configure your web
 * server to add Content-Encoding" bila tidak ada, karena browser mendekompresi
 * jauh lebih cepat daripada dekompresor JavaScript bawaan Unity.
 */
export function unityHeadersFor(
  filename: string,
  sniffed?: 'gzip' | 'br' | null,
): { type: string; encoding?: 'gzip' | 'br' } {
  const lower = filename.toLowerCase();

  let encoding: 'gzip' | 'br' | undefined;
  let base = lower;
  if (lower.endsWith('.gz')) {
    encoding = 'gzip';
    base = lower.slice(0, -3);
  } else if (lower.endsWith('.br')) {
    encoding = 'br';
    base = lower.slice(0, -3);
  } else if (lower.endsWith('.unityweb')) {
    if (sniffed) encoding = sniffed;
    base = lower.slice(0, -'.unityweb'.length);
  }

  // Unity menyarankan application/gzip untuk .data.gz karena bug Safari.
  if (encoding === 'gzip' && base.endsWith('.data')) {
    return { type: 'application/gzip', encoding };
  }
  if (base.endsWith('.symbols.json')) {
    return { type: 'application/octet-stream', encoding };
  }

  const ext = path.extname(base);
  return { type: MIME[ext] ?? 'application/octet-stream', encoding };
}

/**
 * Baca 2 byte pertama untuk mengetahui isi berkas `.unityweb`: gzip punya
 * magic 1f 8b, brotli tidak punya magic sehingga diasumsikan brotli.
 * Hasilnya di-cache per (path, mtime, size) supaya tidak membaca disk
 * berulang untuk setiap request.
 */
const sniffCache = new Map<string, 'gzip' | 'br' | null>();

export function sniffUnitywebEncoding(filePath: string): 'gzip' | 'br' | null {
  let kunci: string;
  try {
    const st = fs.statSync(filePath);
    kunci = `${filePath}|${st.mtimeMs}|${st.size}`;
  } catch {
    return null;
  }
  const cached = sniffCache.get(kunci);
  if (cached !== undefined) return cached;

  let hasil: 'gzip' | 'br' | null = null;
  let fd: number | null = null;
  try {
    fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(2);
    const n = fs.readSync(fd, buf, 0, 2, 0);
    if (n === 2) hasil = buf[0] === 0x1f && buf[1] === 0x8b ? 'gzip' : 'br';
  } catch {
    hasil = null;
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {
        /* abaikan */
      }
    }
  }
  if (sniffCache.size > 64) sniffCache.clear();
  sniffCache.set(kunci, hasil);
  return hasil;
}

function dirSizeBytes(dir: string): number {
  let total = 0;
  const walk = (d: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else {
        try {
          total += fs.statSync(p).size;
        } catch {
          /* abaikan */
        }
      }
    }
  };
  walk(dir);
  return total;
}

const mb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

/** Ubah path relatif di dalam folder build menjadi URL /unity/... */
function toUrl(rel: string): string {
  return '/unity/' + rel.split(/[\\/]/).filter(Boolean).map(encodeURIComponent).join('/');
}

/**
 * Periksa hasil build Unity dengan MEMBACA index.html yang dihasilkan Unity.
 *
 * Kenapa bukan menebak nama file: ekstensi aset berbeda-beda tergantung
 * pengaturan build. Dengan decompression fallback aktif Unity menghasilkan
 * `Web.wasm.unityweb`; tanpa fallback `Web.wasm.gz` atau `Web.wasm.br`;
 * tanpa kompresi `Web.wasm`. Membaca config asli membuat ini selalu cocok.
 */
export function readUnityStatus(): UnityStatus {
  const dir = CONFIG.unityBuildDir;
  const base: UnityStatus = {
    available: false,
    loaderUrl: null,
    dataUrl: null,
    frameworkUrl: null,
    codeUrl: null,
    streamingAssetsUrl: null,
    buildName: null,
    compression: null,
    totalMb: null,
    downloadMb: null,
    version: null,
    buildDir: dir,
  };

  if (!CONFIG.unity3d) {
    return { ...base, reason: 'adegan 3D dimatikan (UNITY_3D=on untuk menyalakan); game memakai adegan SVG' };
  }
  if (!fs.existsSync(dir)) {
    return { ...base, reason: 'folder build Unity belum ada. Jalankan: npm run unity:build' };
  }
  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return { ...base, reason: 'index.html hasil build Unity tidak ditemukan' };
  }

  let html: string;
  try {
    html = fs.readFileSync(indexPath, 'utf8');
  } catch {
    return { ...base, reason: 'index.html tidak dapat dibaca' };
  }

  const ambil = (key: string): string | null => {
    const m = html.match(new RegExp(key + '\\s*:\\s*"([^"]+)"'));
    return m ? m[1] : null;
  };

  // Loader diambil dari tag <script src="...loader.js">
  const loaderMatch = html.match(/<script\s+src="([^"]*\.loader\.js)"/i);
  const loaderRel = loaderMatch ? loaderMatch[1] : null;
  const dataRel = ambil('dataUrl');
  const frameworkRel = ambil('frameworkUrl');
  const codeRel = ambil('codeUrl');
  const streamingRel = ambil('streamingAssetsUrl');

  if (!loaderRel || !dataRel || !frameworkRel || !codeRel) {
    return {
      ...base,
      reason: 'config createUnityInstance tidak lengkap di index.html (loader/data/framework/code)',
    };
  }

  // Semua berkas yang akan diunduh peserta harus benar-benar ada.
  const wajib = [loaderRel, dataRel, frameworkRel, codeRel];
  const hilang = wajib.filter((rel) => !fs.existsSync(path.join(dir, rel)));
  if (hilang.length > 0) {
    return { ...base, reason: `berkas build tidak ada: ${hilang.join(', ')}` };
  }

  const lower = codeRel.toLowerCase();
  const compression: UnityStatus['compression'] = lower.endsWith('.unityweb')
    ? 'unityweb'
    : lower.endsWith('.br')
      ? 'br'
      : lower.endsWith('.gz')
        ? 'gzip'
        : 'none';

  const unduh = wajib.reduce((a, rel) => {
    try {
      return a + fs.statSync(path.join(dir, rel)).size;
    } catch {
      return a;
    }
  }, 0);

  let version: string | null = null;
  try {
    version = String(Math.floor(fs.statSync(path.join(dir, loaderRel)).mtimeMs));
  } catch {
    /* abaikan */
  }

  const buildName = path.basename(loaderRel).replace(/\.loader\.js$/i, '');

  return {
    available: true,
    loaderUrl: toUrl(loaderRel),
    dataUrl: toUrl(dataRel),
    frameworkUrl: toUrl(frameworkRel),
    codeUrl: toUrl(codeRel),
    streamingAssetsUrl: streamingRel ? toUrl(streamingRel) : null,
    buildName,
    compression,
    totalMb: mb(dirSizeBytes(dir)),
    downloadMb: mb(unduh),
    version,
    buildDir: dir,
  };
}

/**
 * Pasang route /unity/* pada aplikasi Express.
 * Harus dipasang SEBELUM fallback SPA.
 */
export function mountUnity(app: express.Express): void {
  app.get('/api/unity/status', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(readUnityStatus());
  });

  app.use(
    '/unity',
    (req: Request, res: Response, next) => {
      // Tolak path traversal sebelum menyentuh disk.
      if (req.path.includes('..')) {
        res.status(400).type('text/plain').send('path tidak valid');
        return;
      }
      next();
    },
    express.static(CONFIG.unityBuildDir, {
      fallthrough: true,
      index: false,
      etag: true,
      lastModified: true,
      // Aset build Unity diberi nama unik per build, jadi boleh di-cache lama;
      // file loader/index dibiarkan pendek supaya build baru langsung terbaca.
      setHeaders: (res, filePath) => {
        const name = path.basename(filePath);
        const sniffed = name.toLowerCase().endsWith('.unityweb')
          ? sniffUnitywebEncoding(filePath)
          : null;
        const { type, encoding } = unityHeadersFor(name, sniffed);
        res.setHeader('Content-Type', type);
        if (encoding) res.setHeader('Content-Encoding', encoding);
        // Penting: Content-Length dari express.static sudah ukuran file terkompresi.
        res.setHeader('Vary', 'Accept-Encoding');
        if (/\.(wasm|data|framework\.js)(\.gz|\.br)?$/i.test(name)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=60');
        }
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      },
    }),
    // File Unity yang tidak ada HARUS 404, bukan HTML SPA.
    (req: Request, res: Response) => {
      const status = readUnityStatus();
      res
        .status(404)
        .type('application/json')
        .send(
          JSON.stringify({
            ok: false,
            error: 'File build Unity tidak ditemukan',
            path: req.path,
            unityAvailable: status.available,
            hint: status.available
              ? 'Nama file tidak cocok dengan hasil build. Periksa /api/unity/status.'
              : status.reason,
          }),
        );
    },
  );
}
