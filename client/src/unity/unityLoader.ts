/**
 * Pemuat runtime Unity Web untuk RAKSA GAME.
 *
 * Aturan:
 * - Runtime dimuat SATU KALI per sesi (aman untuk React StrictMode).
 * - Bila build Unity belum ada, statusnya 'unavailable' - BUKAN error. Pemain
 *   tetap bisa bermain dengan adegan SVG (mode ringan).
 * - Progres yang dilaporkan adalah progres NYATA dari loader Unity.
 * - Unity tidak pernah menerima kunci jawaban dan tidak menghitung skor.
 */

export type UnityStatus =
  | 'idle'
  | 'checking'
  | 'unavailable'
  | 'unsupported'
  | 'loading'
  | 'ready'
  | 'error';

/** Bagian instance Unity yang dipakai sisi web. */
export interface UnityInstance {
  SendMessage(objectName: string, methodName: string, value: string): void;
  Quit?: () => Promise<void>;
}

interface UnityBuildInfo {
  loaderUrl: string;
  /**
   * URL aset diambil APA ADANYA dari server (yang membacanya dari index.html
   * hasil build Unity). Jangan ditebak dari sufiks: ekstensinya berbeda antar
   * mode build (.unityweb / .gz / .br / tanpa sufiks).
   */
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  streamingAssetsUrl: string | null;
  version: string | null;
  totalMb: number | null;
  compression: 'gzip' | 'br' | 'unityweb' | 'none';
}

type CreateUnityInstance = (
  canvas: HTMLCanvasElement,
  config: Record<string, unknown>,
  onProgress?: (progress: number) => void,
) => Promise<UnityInstance>;

const STATUS_URL = '/api/unity/status';
/** Nama GameObject bridge di scene Unity (unity/Assets/Scripts/Bridge/RaksaBridge.cs). */
const BRIDGE_OBJECT = 'RaksaBridge';

let status: UnityStatus = 'idle';
let progres = 0;
let galat: string | null = null;
let instance: UnityInstance | null = null;
let kanvas: HTMLCanvasElement | null = null;
/** Pemuatan yang sedang/sudah berjalan; membuat ensureLoaded idempoten. */
let pemuatan: Promise<UnityInstance | null> | null = null;
let skrip: Promise<void> | null = null;
let lepasContextLost: (() => void) | null = null;
const pelanggan = new Set<(s: UnityStatus) => void>();

function beriTahu(): void {
  for (const cb of [...pelanggan]) {
    try {
      cb(status);
    } catch (e) {
      console.warn('[unity] pelanggan status gagal:', e);
    }
  }
}

function setStatus(s: UnityStatus): void {
  status = s;
  beriTahu();
}

function gagal(pesan: string): null {
  galat = pesan;
  setStatus('error');
  return null;
}

function dukungWebgl2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

/** Tanya server apakah build Unity tersedia. Gagal/404 = tidak tersedia, bukan error. */
async function ambilInfo(): Promise<UnityBuildInfo | null> {
  if (typeof fetch !== 'function') return null;
  try {
    const res = await fetch(STATUS_URL, { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null) return null;
    const o = data as Record<string, unknown>;
    if (o.available !== true) return null;
    const teks = (v: unknown): string | null =>
      typeof v === 'string' && v.length > 0 ? v : null;
    const loaderUrl = teks(o.loaderUrl);
    const dataUrl = teks(o.dataUrl);
    const frameworkUrl = teks(o.frameworkUrl);
    const codeUrl = teks(o.codeUrl);
    if (!loaderUrl || !dataUrl || !frameworkUrl || !codeUrl) return null;
    const komp = o.compression;
    return {
      loaderUrl,
      dataUrl,
      frameworkUrl,
      codeUrl,
      streamingAssetsUrl: teks(o.streamingAssetsUrl),
      version: typeof o.version === 'string' ? o.version : null,
      totalMb: typeof o.totalMb === 'number' ? o.totalMb : null,
      compression:
        komp === 'gzip' || komp === 'br' || komp === 'unityweb' ? komp : 'none',
    };
  } catch {
    return null;
  }
}

/**
 * Config createUnityInstance. URL diambil langsung dari /api/unity/status,
 * yang membacanya dari index.html hasil build - jadi selalu cocok dengan
 * mode kompresi apa pun (.unityweb / .gz / .br / tanpa kompresi).
 */
function buatConfig(info: UnityBuildInfo): Record<string, unknown> {
  const dir = info.loaderUrl.slice(0, Math.max(0, info.loaderUrl.lastIndexOf('/')));
  const root = dir.endsWith('/Build') ? dir.slice(0, -'/Build'.length) : dir;
  return {
    dataUrl: info.dataUrl,
    frameworkUrl: info.frameworkUrl,
    codeUrl: info.codeUrl,
    streamingAssetsUrl: info.streamingAssetsUrl ?? `${root}/StreamingAssets`,
    companyName: 'PT Asuransi Raksa Pratikara',
    productName: 'RAKSA GAME',
    productVersion: info.version ?? '1.0',
  };
}

function muatSkrip(src: string): Promise<void> {
  if (skrip) return skrip;
  skrip = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.dataset.raksaUnity = '1';
    el.onload = () => resolve();
    el.onerror = () => {
      skrip = null;
      el.remove();
      reject(new Error('berkas Unity gagal diunduh'));
    };
    document.head.appendChild(el);
  });
  return skrip;
}

function pasangContextLost(canvas: HTMLCanvasElement): void {
  lepasContextLost?.();
  const onLost = (): void => {
    // Tidak di-preventDefault: Unity tidak dapat melanjutkan setelah context hilang.
    instance = null;
    gagal('Grafik 3D terputus. Biasanya karena memori HP penuh.');
  };
  canvas.addEventListener('webglcontextlost', onLost);
  lepasContextLost = () => canvas.removeEventListener('webglcontextlost', onLost);
}

async function muat(canvas: HTMLCanvasElement): Promise<UnityInstance | null> {
  galat = null;
  progres = 0;
  setStatus('checking');

  const info = await ambilInfo();
  if (!info) {
    setStatus('unavailable');
    return null;
  }
  if (!dukungWebgl2()) {
    setStatus('unsupported');
    return null;
  }
  if (!info.loaderUrl.endsWith('.loader.js')) {
    return gagal('Alamat berkas Unity tidak dikenal.');
  }

  setStatus('loading');
  try {
    await muatSkrip(info.loaderUrl);
    const buat = (globalThis as unknown as { createUnityInstance?: CreateUnityInstance })
      .createUnityInstance;
    if (typeof buat !== 'function') throw new Error('loader Unity tidak lengkap');
    const inst = await buat(canvas, buatConfig(info), (p) => {
      progres = Math.min(1, Math.max(0, p));
      beriTahu();
    });
    instance = inst;
    progres = 1;
    pasangContextLost(canvas);
    setStatus('ready');
    return inst;
  } catch (e) {
    return gagal(e instanceof Error ? e.message : 'Unity gagal dimuat.');
  }
}

export const unityRuntime = {
  getStatus(): UnityStatus {
    return status;
  },
  /** Dipanggil ulang saat status ATAU progres berubah. */
  subscribe(cb: (s: UnityStatus) => void): () => void {
    pelanggan.add(cb);
    return () => {
      pelanggan.delete(cb);
    };
  },
  /**
   * Idempoten: pemanggilan kedua (mis. StrictMode) memakai pemuatan yang sama.
   * ponytail: satu canvas per sesi; bila halaman lain butuh canvas baru,
   * panggil dispose() dulu lalu ensureLoaded() lagi.
   */
  ensureLoaded(canvas: HTMLCanvasElement): Promise<UnityInstance | null> {
    if (pemuatan) {
      if (kanvas && kanvas !== canvas) {
        console.warn('[unity] canvas baru diabaikan; runtime hanya dimuat sekali per sesi');
      }
      return pemuatan;
    }
    kanvas = canvas;
    pemuatan = muat(canvas);
    return pemuatan;
  },
  progress(): number {
    return progres;
  },
  error(): string | null {
    return galat;
  },
  /** Kirim JSON mentah ke bridge di Unity. false bila runtime belum siap. */
  send(json: string): boolean {
    if (!instance) return false;
    try {
      instance.SendMessage(BRIDGE_OBJECT, 'Receive', json);
      return true;
    } catch (e) {
      console.warn('[unity] gagal mengirim pesan:', e);
      return false;
    }
  },
  dispose(): void {
    lepasContextLost?.();
    lepasContextLost = null;
    const inst = instance;
    instance = null;
    kanvas = null;
    pemuatan = null;
    progres = 0;
    galat = null;
    if (inst?.Quit) {
      const p = inst.Quit();
      if (p && typeof p.catch === 'function') p.catch(() => undefined);
    }
    setStatus('idle');
  },
  retry(): void {
    if (instance) return;
    pemuatan = null;
    galat = null;
    progres = 0;
    setStatus('idle');
    if (kanvas) void unityRuntime.ensureLoaded(kanvas);
  },
};
