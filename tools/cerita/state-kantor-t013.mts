/**
 * T-013 Stage 1 evidence: drive Episode 2 with the REAL story engine (random choices, several runs) and save the
 * `raksa:cerita` progress for the first state of each kantor case the screenshots need:
 *   - mentor:       kantor, Miss Raksa alone on stage, speaking
 *   - tel-<face>:   kantor, Pak Hendra on the phone speaking, one per Hendra art face (panik, cemas, kecewa, tenang, senang)
 *   - berkas:       kantor with the claim folder prop
 *   - bima:         kantor with Bima (K07; Stage 2: pixel)
 *   - surat:        kantor with the police letter prop
 *   - pool, bengkel, foto, tol, wawancara-1/2/3: Stage 2 rooms (foto = bengkel with the photo prop; wawancara-N = N witnesses)
 *
 *   npx tsx --tsconfig client/tsconfig.json tools/cerita/state-kantor-t013.mts > states.json
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
const { jalankan, stateAwal, nodeKini } = await import('../../client/src/cerita/mesin');
const { komposisiLatar } = await import('../../client/src/cerita/ui/latar/komposisi');
const { simpanProgres } = await import('../../client/src/cerita/simpan');
const { susunTokoh } = await import('../../client/src/cerita/seni/piksel');
import type { AksiCerita, StateCerita } from '../../client/src/cerita/tipe';
const { alihLajur, pilihSimpul } = await import('../../client/src/cerita/hp/arena/rambu');

const ep = EPISODE_AUTO_2!;
const hasil: Record<string, { nilai: string; node: string; baris: number; ekspresi?: string }> = {};
let benih = 7;
const acak = () => { benih = (benih * 1103515245 + 12345) % 2147483648; return benih / 2147483648; };
const simpan = (nama: string, s: StateCerita, ekspresi?: string) => {
  if (hasil[nama]) return;
  simpanProgres(ep, s);
  hasil[nama] = { nilai: mem.get('raksa:cerita')!, node: s.node, baris: s.baris, ...(ekspresi ? { ekspresi } : {}) };
};
for (let run = 0; run < 60; run++) {
  let s: StateCerita = stateAwal(ep);
  let lalu: StateCerita | null = null;
  for (let i = 0; i < 600; i++) {
    const k = komposisiLatar(ep, s);
    if (k.lokasi === 'kantor') {
      if (k.hadir.length === 1 && k.hadir[0]!.id === 'missRaksa' && k.hadir[0]!.bicara) simpan('mentor', s);
      if (k.telepon?.id === 'hendra' && k.telepon.bicara) {
        const wajah = susunTokoh('hendra', { pose: 'berdiri', ekspresi: k.telepon.ekspresi })!.ekspresi;
        simpan(`tel-${wajah}`, s, k.telepon.ekspresi);
      }
      // T-015: SETIAP adegan kantor dengan sisipan telepon + tokoh di panggung (per node).
      // Disimpan state SEBELUMNYA (baris terakhir node akhir dipulihkan sebagai layar akhir); pemeriksa menekan Lanjut sekali.
      if (k.telepon && k.hadir.some((x) => x.bicara) && lalu) simpan(`cutin-${s.node}-${k.hadir.map((x) => x.id).join('+')}`, lalu);
      if (k.objek.includes('berkas')) simpan('berkas', s);
      if (k.objek.includes('surat')) simpan('surat', s);
      if (k.hadir.some((x) => x.id === 'bima')) simpan('bima', s);
    }
    // Stage 2: setiap lokasi lapangan + adegan dua/tiga saksi + objek foto.
    if (k.lokasi === 'pool' && k.hadir.length) simpan('pool', s);
    if (k.lokasi === 'bengkel' && k.hadir.length) simpan(k.objek.includes('foto') ? 'foto' : 'bengkel', s);
    if (k.lokasi === 'tol' && k.hadir.length) simpan('tol', s);
    if (k.lokasi === 'wawancara' && k.hadir.length) simpan(`wawancara-${k.hadir.length}`, s);
    const n = nodeKini(ep, s);
    if (!n) break;
    const calon: AksiCerita[] = [];
    if (n.jenis === 'pilihan') calon.push(...n.pilihan.map((p) => ({ jenis: 'pilih', node: n.id, pilihan: p.id }) as AksiCerita).sort(() => acak() - 0.5));
    if (n.jenis === 'aktivitas') {
      // T-014 fix (QA B-01): state SESUDAH aktivitas yang kalimatnya dirakit kode (daftar dokumen di obrolan, daftar lajur di
      // ringkasan & tanggapan rambu), dengan jawaban buatan berisi daftar 2 dan 3+ butir. Tidak mengubah jalur acak utama.
      const idAkt = (n as unknown as { aktivitas: string }).aktivitas;
      if (!hasil[`akt-${idAkt}`] && (idAkt === 'berkas' || idAkt === 'rambu' || idAkt === 'saksi')) {
        let jb: Record<string, unknown> = {};
        if (idAkt === 'berkas') jb = { berkas: { stnk: 'sekarang', ktp: 'sekarang', formulir: 'menyusul', kk: 'menyusul', slip: 'menyusul', rekening: 'tidak', sim: 'tidak', suratpolisi: 'tidak' } };
        if (idAkt === 'saksi') jb = { saksi: { hendra: 'ya', darto: 'ya', tol: 'ya', polisi: 'tidak', mobilkecil: 'tidak' } };
        if (idAkt === 'rambu') {
          const kr = (ep.aktivitas as Record<string, { arena?: unknown }>).rambu!.arena as never;
          let j = {} as never;
          for (const x of [1, 3]) j = alihLajur(kr, j, 0, x) as never;
          for (const x of [1, 2, 3]) j = alihLajur(kr, j, 1, x) as never;
          jb = pilihSimpul(kr, j, 'c') as never;
        }
        const t = jalankan(ep, s, { jenis: 'aktivitas', node: n.id, jawaban: jb as never });
        if (t !== s) simpan(`akt-${idAkt}`, t);
      }
      // Separuh putaran: jawaban KUNCI aktivitas (mencapai cabang seperti K09-E tiga saksi), selebihnya kosong.
      const def = (ep.aktivitas as Record<string, { kunci?: { stepId: string; assign?: unknown; answer?: unknown }[] }> | undefined)?.[(n as unknown as { aktivitas: string }).aktivitas];
      const kunci = def?.kunci ? Object.fromEntries(def.kunci.map((x) => [x.stepId, x.assign ?? x.answer])) : {};
      if (run % 2 && Object.keys(kunci).length) calon.push({ jenis: 'aktivitas', node: n.id, jawaban: kunci as never });
      calon.push({ jenis: 'aktivitas', node: n.id, jawaban: {} as never });
    }
    calon.push({ jenis: 'lanjut' });
    let maju: StateCerita | null = null;
    for (const a of calon) { const t = jalankan(ep, s, a); if (t !== s) { maju = t; break; } }
    if (!maju) break;
    lalu = s;
    s = maju;
  }
}
console.log(JSON.stringify(hasil));
console.error(Object.keys(hasil).sort().join(' '));
