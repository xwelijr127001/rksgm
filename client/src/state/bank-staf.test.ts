/** T-038 Fix 2: the legacy host page sends the staff session (x-staff-token) so a staff host needs no committee PIN. */
import assert from 'node:assert/strict';
import test from 'node:test';

const isi = new Map<string, string>();
const penyimpanan = {
  getItem: (k: string) => isi.get(k) ?? null,
  setItem: (k: string, v: string) => void isi.set(k, v),
  removeItem: (k: string) => void isi.delete(k),
  clear: () => isi.clear(),
};
(globalThis as unknown as { window: unknown }).window ??= globalThis;
(globalThis as unknown as { sessionStorage: unknown }).sessionStorage = penyimpanan;
(globalThis as unknown as { localStorage: unknown }).localStorage ??= penyimpanan;

test('bank headers: x-staff-token only when a staff session is stored in this tab', async () => {
  const { headerOtorisasi } = await import('./bank');
  const { staffReturnPath } = await import('../story/staff');
  assert.equal(headerOtorisasi()['x-staff-token'], undefined, 'tanpa sesi staf: tidak dikirim');
  isi.set('raksa:staf:token', 'token-staf-uji-0123456789abcdef');
  assert.equal(headerOtorisasi()['x-staff-token'], 'token-staf-uji-0123456789abcdef');
  // Return after sign-in: allowlisted path only (no open redirect).
  assert.equal(staffReturnPath('?kembali=%2Facara%2Fhost'), '/acara/host');
  assert.equal(staffReturnPath('?kembali=https%3A%2F%2Fpenyerang.example'), null);
  assert.equal(staffReturnPath('?kembali=%2F%2Fpenyerang.example'), null);
  assert.equal(staffReturnPath(''), null);
});
