/**
 * Membuktikan build Unity BENAR-BENAR dimuat di browser dan bridge-nya bicara.
 *
 * PRASYARAT: npm install -D puppeteer-core socket.io-client
 *            npm run build && npm start   (server di port 4000)
 *            npm run unity:build          (build Unity ada)
 *   npm run check:unity-load
 *
 * Yang diperiksa:
 *  - /api/unity/status available
 *  - keempat berkas build diunduh dengan status 200 & header benar
 *  - createUnityInstance selesai (canvas punya konteks WebGL)
 *  - Unity mengirim unityReady, lalu missionReady untuk misi yang dimuat
 *  - tidak ada console error
 *
 * Catatan: Chrome headless memakai WebGL software (SwiftShader). Lolos di sini
 * berarti build & bridge benar; performa nyata di HP tetap harus diuji terpisah.
 */

import puppeteer from 'puppeteer-core';

const BASE = process.env.UI_BASE || 'http://127.0.0.1:4000';
const CHROME = process.env.RAKSA_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const gagal = [];

const status = await (await fetch(`${BASE}/api/unity/status`)).json();
console.log('[STATUS]', JSON.stringify(status, null, 1));
if (!status.available) {
  console.log('\nBuild Unity tidak tersedia - tidak ada yang bisa diuji.');
  console.log('Jalankan: npm run unity:build');
  process.exit(2);
}

const br = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--no-proxy-server',
    '--no-first-run',
    // WebGL di headless memakai SwiftShader (software).
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
  defaultViewport: null,
  protocolTimeout: 180000,
});

try {
  const p = await br.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const errs = [];
  const unduhan = new Map();
  p.on('pageerror', (e) => errs.push('pageerror: ' + String(e).slice(0, 200)));
  p.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error') errs.push('console: ' + t.slice(0, 200));
    if (/RaksaBridge|unityReady|missionReady|\[Unity\]/.test(t)) console.log('[PAGE]', t.slice(0, 160));
  });
  p.on('response', (r) => {
    const u = r.url();
    if (u.includes('/unity/')) {
      unduhan.set(u.replace(BASE, ''), {
        status: r.status(),
        type: r.headers()['content-type'],
        enc: r.headers()['content-encoding'] || '-',
        len: r.headers()['content-length'] || '?',
      });
    }
  });

  // Rekam pesan bridge dari sisi halaman sebelum aplikasi memasang handler-nya.
  await p.evaluateOnNewDocument(() => {
    window.__raksaLog = [];
    let asli = null;
    Object.defineProperty(window, 'RaksaUnityReceive', {
      configurable: true,
      get() {
        return asli;
      },
      set(fn) {
        asli = (json) => {
          try {
            window.__raksaLog.push(json);
          } catch {
            /* abaikan */
          }
          return fn(json);
        };
      },
    });
  });

  // MODE LATIHAN dipakai, bukan pertandingan: di pertandingan ronde punya batas
  // waktu (misi 1 = 20 detik) sehingga UnityStage bisa ter-unmount sebelum
  // runtime selesai dimuat - terutama di Chrome headless yang memakai WebGL
  // software (SwiftShader). Mode latihan membiarkan adegan terpasang selama
  // yang dibutuhkan, jadi yang diuji benar-benar "apakah Unity bisa dimuat".
  await p.goto(`${BASE}/latihan`, { waitUntil: 'networkidle2' });
  await tidur(1200);
  const mulai = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const b = [...document.querySelectorAll('button, a')].find((x) =>
      /Coba misi pertama|Parkir Kurang Mulus/i.test(norm(x.textContent)),
    );
    if (!b) return null;
    b.click();
    return norm(b.textContent).slice(0, 40);
  });
  console.log('[LATIHAN] membuka misi:', mulai ?? 'TIDAK KETEMU');
  if (!mulai) gagal.push('tidak bisa membuka misi latihan');
  await tidur(1500);

  // Tunggu canvas Unity muncul
  const adaCanvas = await p
    .waitForFunction(() => Boolean(document.querySelector('canvas')), { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  console.log('[CANVAS] elemen canvas ada:', adaCanvas);
  if (!adaCanvas) gagal.push('canvas Unity tidak pernah muncul');

  // Tunggu unityReady/missionReady (maks 4 menit: wasm 3,8 MB dikompilasi
  // WebGL software di headless memang lambat; di HP nyata jauh lebih cepat)
  const batas = Date.now() + 240000;
  let pesan = [];
  let siap = false;
  while (Date.now() < batas) {
    pesan = await p.evaluate(() => window.__raksaLog || []);
    if (pesan.some((j) => j.includes('unityReady'))) {
      siap = true;
      break;
    }
    await tidur(1500);
  }
  console.log('[BRIDGE] pesan diterima:', pesan.length);
  for (const j of pesan.slice(0, 8)) console.log('   <-', String(j).slice(0, 140));
  console.log('[BRIDGE] unityReady:', siap);
  if (!siap) gagal.push('Unity tidak pernah mengirim unityReady');

  if (siap) {
    const adaMisi = pesan.some((j) => j.includes('missionReady'));
    console.log('[BRIDGE] missionReady:', adaMisi);
    if (!adaMisi) {
      // beri waktu tambahan: loadMission dikirim setelah unityReady
      await tidur(8000);
      const lagi = await p.evaluate(() => window.__raksaLog || []);
      const ok2 = lagi.some((j) => j.includes('missionReady'));
      console.log('[BRIDGE] missionReady (setelah tunggu):', ok2);
      if (!ok2) gagal.push('Unity tidak mengirim missionReady');
    }
  }

  // Konteks WebGL benar-benar aktif?
  const gl = await p.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return null;
    const ctx = c.getContext('webgl2') || c.getContext('webgl');
    if (!ctx) return 'tidak ada konteks';
    return {
      versi: ctx.getParameter(ctx.VERSION),
      renderer: ctx.getParameter(ctx.RENDERER),
      lebar: c.width,
      tinggi: c.height,
    };
  });
  console.log('[WEBGL]', JSON.stringify(gl));
  if (!gl || gl === 'tidak ada konteks') gagal.push('canvas tidak punya konteks WebGL');

  console.log('\n[UNDUHAN BERKAS UNITY]');
  for (const [u, d] of unduhan) {
    console.log(`  ${String(d.status)} ${u}`);
    console.log(`      type=${d.type} encoding=${d.enc} bytes=${d.len}`);
    if (d.status !== 200) gagal.push(`berkas ${u} status ${d.status}`);
  }
  const wajib = ['loader.js', '.wasm', '.data', '.framework.js'];
  for (const w of wajib) {
    if (![...unduhan.keys()].some((u) => u.includes(w))) gagal.push(`berkas ${w} tidak pernah diminta`);
  }

  console.log('\n[CONSOLE ERROR]', errs.length);
  for (const e of errs.slice(0, 8)) console.log('  ' + e);
  if (errs.length) gagal.push(`${errs.length} console error`);
} finally {
  await br.close();
  console.log('\n================ HASIL ================');
  if (gagal.length === 0) {
    console.log('  Build Unity dimuat di browser dan bridge berfungsi.');
  } else {
    console.log('  kegagalan:', gagal.length);
    for (const g of gagal) console.log('   - ' + g);
  }
  console.log('=======================================\n');
}
process.exit(gagal.length ? 1 : 0);
