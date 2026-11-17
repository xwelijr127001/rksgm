/**
 * T-025 evidence: saved progress (`raksa:cerita`) for every state of the Ruang Rapat Komite Klaim, made with the REAL story engine on
 * one fixed path (first reply at every conversation point, the key answer at every activity), advanced beat by beat exactly as the
 * phone player does.
 *
 *   npx tsx --tsconfig client/tsconfig.json tools/cerita/state-komite-t025.mts > team/evidence/T-025/states-komite.json
 *
 * states (Fix 1: SETUJU shows only at K13; a completed file at K11 leaves the members waiting):
 *   tunggu          K11 intro: members wait, the bundle task card is under the stage
 *   setuju          K13 opening beat: the Committee approves (nods + SETUJU), then the chat with the offer letter
 *   catatan         K11 result, file sent without the police letter, no news (k11-b): status note on that card
 *   kosong          K11 result, report sent to Mr Hendra instead, no news (k11-e)
 *   hasil-lengkapi  K11 result, file completed, no news sent (k11-c): the room still waits, no tag; both consequences + status note
 *   sela-a          K11 result with news sent (k11-a): the room beat first (still waiting, no status note), then the chat
 *   sela-b2         K11 result with news sent and no reply from Mr Hendra (k11-b2): room in `catatan`, then the chat
 *   k13             the same beat as `setuju` (kept under this name for the flow check)
 * harap: per language the room name, the sentence per room state, the glossary label / meaning and the four roles, the file and
 * news consequences and the reason lines of the K11 results (Fix 2, D-249: the news text of K11-E no longer repeats its reason),
 * read from the text tables, so the browser tools compare the page with the tables and not with a copy typed into the tool.
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

const { EPISODE_AUTO_2, KOMITE_BERKAS } = await import('../../client/src/cerita/episode/auto-2/episode');
const { jalankan, stateAwal, nodeKini, semuaBarisTampil, pilihanTersedia } = await import('../../client/src/cerita/mesin');
const { komposisiLatar } = await import('../../client/src/cerita/ui/latar/komposisi');
const { ketukanBelumUtuh, pandangKini } = await import('../../client/src/cerita/hp/alur');
const { simpanProgres } = await import('../../client/src/cerita/simpan');
const { teksCerita } = await import('../../client/src/cerita/teks');
import type { AksiCerita, StateCerita } from '../../client/src/cerita/tipe';

const ep = EPISODE_AUTO_2!;
const LANJUT: AksiCerita = { jenis: 'lanjut' };
/** Like the phone player: after every action the rest of the beat is shown too. */
const kirim = (s: StateCerita, aksi: AksiCerita): StateCerita => {
  let x = jalankan(ep, s, aksi);
  for (let i = 0; i < 12 && ketukanBelumUtuh(ep, x); i++) x = jalankan(ep, x, LANJUT);
  return x;
};
/** One step on the fixed path: first reply, key answer, or Lanjut. `bundel` = the K11 answer to give. */
function langkah(s: StateCerita, bundel?: { bundel: string; kabar: string }): StateCerita {
  const n = nodeKini(ep, s)!;
  if (n.jenis === 'pilihan' && semuaBarisTampil(ep, s) && pilihanTersedia(ep, s).length) return kirim(s, { jenis: 'pilih', node: n.id, pilihan: pilihanTersedia(ep, s)[0]!.id });
  if (n.jenis === 'aktivitas' && semuaBarisTampil(ep, s)) {
    const def = (ep.aktivitas as Record<string, { kunci?: { stepId: string; assign?: unknown; answer?: unknown; single?: unknown }[] }>)[n.aktivitas];
    const kunci = Object.fromEntries((def?.kunci ?? []).map((x) => [x.stepId, x.assign ?? x.answer ?? x.single]));
    const jawaban = n.id === 'k11' && bundel ? bundel : kunci;
    const t = kirim(s, { jenis: 'aktivitas', node: n.id, jawaban: jawaban as never });
    if (t !== s) return t;
    return kirim(s, { jenis: 'aktivitas', node: n.id, jawaban: {} as never });
  }
  return kirim(s, LANJUT);
}
function sampai(s: StateCerita, berhenti: (x: StateCerita) => boolean, bundel?: { bundel: string; kabar: string }): StateCerita {
  let x = s;
  for (let i = 0; i < 400 && !berhenti(x); i++) { const t = langkah(x, bundel); if (t === x) throw new Error(`macet di ${x.node}:${x.baris}`); x = t; }
  if (!berhenti(x)) throw new Error('tujuan tidak tercapai');
  return x;
}

const states: Record<string, { nilai: string; node: string; baris: number; komite: string; pandang: string }> = {};
const simpan = (nama: string, s: StateCerita) => {
  const k = komposisiLatar(ep, s);
  if (k.lokasi !== 'komite' || !k.komite) throw new Error(`${nama}: bukan ruang Komite (${k.lokasi})`);
  simpanProgres(ep, s);
  states[nama] = { nilai: mem.get('raksa:cerita')!, node: s.node, baris: s.baris, komite: k.komite, pandang: pandangKini(ep, s) };
};

const k11 = sampai(stateAwal(ep), (x) => x.node === 'k11' && semuaBarisTampil(ep, x));
simpan('tunggu', k11);
const hasil = (bundel: string, kabar: string) => kirim(k11, { jenis: 'aktivitas', node: 'k11', jawaban: { bundel, kabar } as never });
simpan('hasil-lengkapi', hasil('lengkapi', 'nanti'));
simpan('catatan', hasil('sekarang', 'nanti'));
simpan('kosong', hasil('hendra', 'nanti'));
simpan('sela-a', hasil('lengkapi', 'persetujuan'));
simpan('sela-b2', hasil('sekarang', 'persetujuan'));
// K13: lanjutkan dari hasil tanpa kabar sampai ketukan pembuka K13 (ruang Komite, setuju): satu-satunya tempat SETUJU tampil.
const k13 = sampai(hasil('lengkapi', 'nanti'), (x) => x.node === 'k13' && x.baris >= 1);
simpan('setuju', k13);
simpan('k13', k13);

// Sanity: keadaan tiap state = tabel naskah.
const harapKeadaan: Record<string, string> = { tunggu: 'tunggu', setuju: 'setuju', k13: 'setuju', catatan: KOMITE_BERKAS.sekarang!, kosong: KOMITE_BERKAS.hendra!, 'hasil-lengkapi': KOMITE_BERKAS.lengkapi!, 'sela-a': KOMITE_BERKAS.lengkapi!, 'sela-b2': KOMITE_BERKAS.sekarang!, };
for (const [n, k] of Object.entries(harapKeadaan)) if (states[n]!.komite !== k || states[n]!.pandang !== 'adegan') throw new Error(`${n}: ${JSON.stringify(states[n])}`);
// Fix 1: tidak ada akibat K11 yang memperlihatkan SETUJU; setuju hanya di node k13.
for (const [n, s] of Object.entries(states)) if ((s.komite === 'setuju') !== (s.node === 'k13')) throw new Error(`SETUJU di luar K13: ${n} ${s.node}`);
if (KOMITE_BERKAS.lengkapi !== 'tunggu') throw new Error('berkas lengkap seharusnya = ruang menunggu');

const harap = Object.fromEntries((['id', 'en', 'zh'] as const).map((b) => {
  const tx = (k: string) => teksCerita(ep, k, b, { nama: 'Weli' });
  const lok = ep.latar!.lokasi.komite!;
  const ist = ep.istilah!.komite!;
  return [b, {
    ruang: tx(lok.nama),
    kalimat: Object.fromEntries(Object.entries(lok.komite!).map(([k, v]) => [k, tx(v)])),
    istilah: { label: tx(ist.label), arti: tx(ist.arti), anggota: ist.anggota!.map((a) => ({ teks: tx(a.teks), ikon: a.ikon })) },
    berkas: Object.fromEntries(['lengkapi', 'sekarang', 'hendra'].map((x) => [x, tx(`k11.akibat.berkas.${x}`)])),
    topik: { berkas: tx('topik.berkas'), kabar: tx('topik.kabar') },
    k11: tx('k11.1'), k13: tx('k13.1'), k13Balas: tx('k13.2'), balasA: tx('k11-a.3'),
    pesanPersetujuan: tx('arena.bundel.persetujuan'),
    kabar: Object.fromEntries(['a', 'b', 'b2', 'c', 'e'].map((x) => [x, tx(`k11.akibat.kabar.${x}`)])),
    alasan: Object.fromEntries(['b', 'c', 'e'].map((x) => [x, tx(`k11.${x}.alasan`)])),
  }];
}));
console.log(JSON.stringify({ dibuat: 'tools/cerita/state-komite-t025.mts', states, harap }));
console.error(Object.entries(states).map(([n, s]) => `${n}=${s.node}:${s.baris}:${s.komite}`).join(' '));
