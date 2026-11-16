/**
 * Prioritas rendah untuk alat uji browser: pemilik bekerja di PC yang sama.
 * Node sendiri turun ke PRIORITY_LOW, dan karena Chrome menaikkan prioritasnya sendiri (AboveNormal) setelah diluncurkan,
 * setiap 4 detik semua proses chrome.exe otomasi (puppeteer: --allow-pre-commit-input / --headless) dipaksa ke kelas Idle.
 * Hanya Windows; di OS lain cukup prioritas Node. Timer di-unref supaya tidak menahan proses keluar.
 */
import os from 'node:os';
import { execFile } from 'node:child_process';

const PS = `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -match 'allow-pre-commit-input|--headless' } | ForEach-Object { try { (Get-Process -Id $_.ProcessId -ErrorAction Stop).PriorityClass = 'Idle' } catch {} }`;
const PS_B64 = Buffer.from(PS, 'utf16le').toString('base64');

let sibuk = false;
export function turunkanChrome() {
  if (process.platform !== 'win32' || sibuk) return;
  sibuk = true;
  const anak = execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', PS_B64], { windowsHide: true }, () => { sibuk = false; });
  anak.unref?.();
}

export function mulaiPrioritasRendah(jedaMs = 4000) {
  // RAKSA_PRIORITAS=normal mematikan semuanya (untuk membandingkan hasil uji).
  if (process.env.RAKSA_PRIORITAS === 'normal') return () => {};
  try { os.setPriority(os.constants.priority.PRIORITY_LOW); } catch {}
  turunkanChrome();
  const t = setInterval(turunkanChrome, jedaMs);
  t.unref();
  return () => clearInterval(t);
}
