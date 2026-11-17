/**
 * Tampilan HP tiap baris tiap node Episode 2 (A = adegan, O = obrolan), dari banyak putaran acak mesin cerita yang sebenarnya.
 * Dipakai saat merancang isyarat tata (T-025: sela ruang Komite di K11 / K13): node akibat mana yang berpindah adegan <-> obrolan
 * di tengahnya, dan keputusan mana yang mengirim pesan obrolan.
 *
 *   npx tsx --tsconfig client/tsconfig.json tools/cerita/pandang-node.mts [awalan node, mis. k11]
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
const { telusuriRiwayat } = await import('../../client/src/cerita/ui/latar/komposisi');
const { utasObrolan } = await import('../../client/src/cerita/hp/alur');
const { KOMBINASI_BUNDEL } = await import('../../client/src/cerita/episode/auto-2/episode');
import type { AksiCerita, StateCerita } from '../../client/src/cerita/tipe';

const ep = EPISODE_AUTO_2!;
const awalan = process.argv[2] ?? '';
const tx = (k: string) => k;
const pesanAkt = (s: StateCerita) => (_n: string, id: string) => {
  const def = ep.aktivitas[id];
  const j = s.aktivitas[id]?.jawaban;
  return def?.pesanObrolan && j ? def.pesanObrolan(j, tx as never) : null;
};
/** node -> pola tampilan barisnya (mis. "A O O") -> berapa kali. */
const pola = new Map<string, Map<string, number>>();
const utas = new Map<string, string>();
let benih = 11;
const acak = () => { benih = (benih * 1103515245 + 12345) % 2147483648; return benih / 2147483648; };
const catat = (s: StateCerita) => {
  const perNode = new Map<string, string[]>();
  telusuriRiwayat(ep, s.riwayat, (e, k, b) => {
    if (e.jenis !== 'baris') return;
    const siapa = b?.siapa ?? e.siapa;
    const o = !!ep.nasabah && k.telepon === ep.nasabah && (siapa === ep.nasabah || k.hadir.length === 0);
    const a = perNode.get(e.node) ?? [];
    a.push((o ? 'O' : 'A') + (k.lokasi === 'komite' ? `[${k.komite ?? '-'}]` : ''));
    perNode.set(e.node, a);
  });
  for (const [node, a] of perNode) {
    if (awalan && !node.startsWith(awalan)) continue;
    const m = pola.get(node) ?? new Map<string, number>();
    m.set(a.join(' '), (m.get(a.join(' ')) ?? 0) + 1);
    pola.set(node, m);
  }
};
const jalur = (bundel?: { bundel: string; kabar: string }) => {
  let s: StateCerita = stateAwal(ep);
  for (let i = 0; i < 700; i++) {
    const n = nodeKini(ep, s);
    if (!n) break;
    const calon: AksiCerita[] = [];
    if (n.jenis === 'pilihan') calon.push(...n.pilihan.map((p) => ({ jenis: 'pilih', node: n.id, pilihan: p.id }) as AksiCerita).sort(() => acak() - 0.5));
    if (n.jenis === 'aktivitas') {
      const idAkt = (n as unknown as { aktivitas: string }).aktivitas;
      if (idAkt === 'bundel' && bundel) calon.push({ jenis: 'aktivitas', node: n.id, jawaban: bundel as never });
      const def = (ep.aktivitas as Record<string, { kunci?: { stepId: string; assign?: unknown; answer?: unknown; single?: unknown }[] }>)[idAkt];
      const kunci = def?.kunci ? Object.fromEntries(def.kunci.map((x) => [x.stepId, x.assign ?? x.answer ?? x.single])) : {};
      if (acak() < 0.5 && Object.keys(kunci).length) calon.push({ jenis: 'aktivitas', node: n.id, jawaban: kunci as never });
      calon.push({ jenis: 'aktivitas', node: n.id, jawaban: {} as never });
    }
    calon.push({ jenis: 'lanjut' });
    let maju: StateCerita | null = null;
    for (const a of calon) { const t = jalankan(ep, s, a); if (t !== s) { maju = t; break; } }
    if (!maju) break;
    s = maju;
    // Utas obrolan tepat saat node akibat K11 selesai tampil (baris terakhirnya), per kombinasi.
    if (bundel && /^k11-/.test(s.node)) {
      const nn = nodeKini(ep, s) as { baris?: unknown[] } | null;
      if (nn?.baris && s.baris === nn.baris.length) {
        const u = utasObrolan(ep, s, pesanAkt(s));
        utas.set(`${bundel.bundel}+${bundel.kabar} -> ${s.node}`, `sesiMulai ${u.sesiMulai}/${u.pesan.length}: ` + u.pesan.slice(Math.max(0, u.sesiMulai - 1)).map((p, i) => (i === 0 && u.sesiMulai > 0 ? '(lama) ' : '') + p.jenis + ':' + (p.jenis === 'keluar' ? (p.teks ?? 'isi') : p.teks) + ('akibat' in p && p.akibat ? '*' : '')).join(' | '));
      }
    }
  }
  catat(s);
};
for (let run = 0; run < 80; run++) jalur();
for (const k of KOMBINASI_BUNDEL) jalur({ bundel: k.bundel, kabar: k.kabar });
for (const node of [...pola.keys()].sort()) {
  const m = pola.get(node)!;
  const semua = [...m.entries()].map(([p, n]) => `${p} (x${n})`).join('  ;  ');
  const campur = [...m.keys()].some((p) => /A.* O|O.* A/.test(p.replace(/\[[^\]]*\]/g, '')));
  console.log(`${node.padEnd(10)} ${campur ? 'CAMPUR ' : '       '}${semua}`);
}
if (utas.size) { console.log('\n== utas obrolan di akhir node akibat K11'); for (const [k, v] of utas) console.log(k + '\n   ' + v); }
