/**
 * T-018 Tahap 1: state tersimpan (`raksa:cerita`) untuk layar OBROLAN Episode 2 pada keadaan TERPANJANG, dicari dengan mesin
 * cerita yang asli (60 putaran acak, sama seperti state-kantor-t013.mts). Setiap state sudah dimajukan sampai ketukannya utuh
 * (seperti antarmuka HP), jadi yang tersimpan = yang tampil.
 *   - obrolan-b1:      Bagian 1, tombol "Balas ..." (kasus tangkapan layar owner), pesan terbanyak
 *   - obrolan-b4:      Bagian 4, pesan terbanyak (riwayat terkumpul)
 *   - obrolan-lanjut:  tombol Lanjut yang menambah pesan dan tetap di obrolan (uji "mengikuti pesan terbaru" + pil)
 *   - obrolan-pilihan: keputusan yang sesudah balasan pertama tetap di obrolan, teks pilihan terpanjang
 *   - obrolan-tugas:   kartu tugas di komposer (bila ada)
 *   - balas-<node>:    setiap keputusan obrolan (K01, K03, K06, K12, K13, K14) untuk lembar balasan (Tahap 1b)
 *
 *   npx tsx --tsconfig client/tsconfig.json tools/cerita/state-obrolan-t018.mts > team/evidence/T-018/states.json
 */
const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, String(v)); },
  removeItem: (k: string) => { mem.delete(k); },
  clear: () => mem.clear(),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
} as Storage;

const { EPISODE_AUTO_2 } = await import('../../client/src/cerita/episode/auto-2/episode');
const { jalankan, stateAwal, nodeKini, babKini, semuaBarisTampil, pilihanTersedia } = await import('../../client/src/cerita/mesin');
const { simpanProgres } = await import('../../client/src/cerita/simpan');
const { ketukanBelumUtuh, pandangKini, utasObrolan } = await import('../../client/src/cerita/hp/alur');
const { teksCerita } = await import('../../client/src/cerita/teks');
import type { AksiCerita, StateCerita } from '../../client/src/cerita/tipe';

const ep = EPISODE_AUTO_2!;
type Calon = { nilai: string; node: string; baris: number; bab: number; pesan: number; sesi: number; skor: number };
const hasil: Record<string, Calon> = {};
let benih = 7;
const acak = () => { benih = (benih * 1103515245 + 12345) % 2147483648; return benih / 2147483648; };
const utuh = (s: StateCerita): StateCerita => {
  for (let i = 0; i < 12 && ketukanBelumUtuh(ep, s); i++) { const t = jalankan(ep, s, { jenis: 'lanjut' }); if (t === s) break; s = t; }
  return s;
};
const utas = (s: StateCerita) => utasObrolan(ep, s, (_n, id) => (s.aktivitas[id]?.jawaban ? 'x' : null));
const calon = (nama: string, s: StateCerita, skor: number) => {
  if (hasil[nama] && hasil[nama]!.skor >= skor) return;
  const u = utas(s);
  simpanProgres(ep, s);
  hasil[nama] = { nilai: mem.get('raksa:cerita')!, node: s.node, baris: s.baris, bab: babKini(ep, s)?.nomor ?? 0, pesan: u.pesan.length, sesi: u.pesan.length - u.sesiMulai, skor };
};
for (let run = 0; run < 60; run++) {
  let s: StateCerita = utuh(stateAwal(ep));
  for (let i = 0; i < 600; i++) {
    const n = nodeKini(ep, s);
    if (!n) break;
    if (pandangKini(ep, s) === 'obrolan') {
      const u = utas(s);
      const bab = babKini(ep, s)?.nomor ?? 0;
      const lengkap = semuaBarisTampil(ep, s);
      if (bab === 1 && n.jenis === 'pilihan' && lengkap) calon('obrolan-b1', s, u.pesan.length);
      if (bab === 4 && !(n.jenis === 'akhir' && lengkap)) calon('obrolan-b4', s, u.pesan.length); // akhir lengkap dipulihkan sebagai layar akhir
      if (n.jenis === 'aktivitas' && lengkap) calon('obrolan-tugas', s, u.pesan.length);
      // Tahap 1b (D-128): SETIAP keputusan obrolan (lembar balasan), state pertama yang ditemukan.
      if (n.jenis === 'pilihan' && lengkap) calon('balas-' + n.id, s, 1);
      if (n.jenis === 'pilihan' && lengkap) {
        const p = pilihanTersedia(ep, s);
        const t = p[0] ? utuh(jalankan(ep, s, { jenis: 'pilih', node: n.id, pilihan: p[0].id })) : s;
        if (t !== s && pandangKini(ep, t) === 'obrolan' && nodeKini(ep, t)?.jenis !== 'akhir') {
          calon('obrolan-pilihan', s, p.reduce((a, x) => a + teksCerita(ep, x.teks, 'id', { nama: 'Weli' }).length, 0));
        }
      }
      if (n.jenis !== 'pilihan' && n.jenis !== 'aktivitas') {
        const t = utuh(jalankan(ep, s, { jenis: 'lanjut' }));
        if (t !== s && pandangKini(ep, t) === 'obrolan' && utas(t).pesan.length > u.pesan.length && utas(t).sesiMulai === u.sesiMulai) calon('obrolan-lanjut', s, u.pesan.length - u.sesiMulai + bab / 10);
      }
    }
    const aksi: AksiCerita[] = [];
    if (n.jenis === 'pilihan') aksi.push(...n.pilihan.map((p) => ({ jenis: 'pilih', node: n.id, pilihan: p.id }) as AksiCerita).sort(() => acak() - 0.5));
    if (n.jenis === 'aktivitas') {
      const def = (ep.aktivitas as Record<string, { kunci?: { stepId: string; assign?: unknown; answer?: unknown }[] }> | undefined)?.[(n as unknown as { aktivitas: string }).aktivitas];
      const kunci = def?.kunci ? Object.fromEntries(def.kunci.map((x) => [x.stepId, x.assign ?? x.answer])) : {};
      if (run % 2 && Object.keys(kunci).length) aksi.push({ jenis: 'aktivitas', node: n.id, jawaban: kunci as never });
      aksi.push({ jenis: 'aktivitas', node: n.id, jawaban: {} as never });
    }
    aksi.push({ jenis: 'lanjut' });
    let maju: StateCerita | null = null;
    for (const a of aksi) { const t = jalankan(ep, s, a); if (t !== s) { maju = t; break; } }
    if (!maju) break;
    s = utuh(maju);
  }
}
console.log(JSON.stringify(hasil));
console.error(Object.entries(hasil).map(([k, v]) => `${k}: node ${v.node} bab ${v.bab} pesan ${v.pesan} sesi ${v.sesi}`).join('\n'));
