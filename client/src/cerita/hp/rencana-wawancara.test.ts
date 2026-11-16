/**
 * Tes K09 (rencana wawancara: tiap orang berpotret + peran) dan K10 (catatan bukti per perbedaan: yang diketahui vs yang
 * belum; tanpa menyimpulkan sebab atau menilai pihak mana pun; tanpa kata "kecil" pada teks tugas).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { teksCerita } from '../teks';
import type { KonfigArena, KunciTeks, NodeAktivitas } from '../tipe';
import { jalankan, pilihanTersedia, semuaBarisTampil, stateAwal } from '../mesin';
import { kandidatJawaban, validasiEpisode } from '../validasi';
import { EPISODE_AUTO_2 as EP } from '../episode/auto-2/episode';

const tx = (k: KunciTeks) => teksCerita(EP, k, 'id', { nama: 'Rina' });
const arena = (node: string): KonfigArena => EP.aktivitas[(EP.node[node] as NodeAktivitas).aktivitas]!.arena!;

test('K09: setiap orang di daftar saksi punya potret tokoh dan keterangan peran (identitas & relevansi terbaca)', () => {
  const k = arena('k09');
  assert.equal(k.pola, 'susun');
  if (k.pola !== 'susun') return;
  const orang = k.benda.filter((b) => b.tokoh);
  assert.deepEqual(orang.map((b) => b.id).sort(), ['darto', 'hendra', 'polisi', 'tol']);
  for (const b of orang) {
    assert.ok(b.keterangan, `${b.id}: keterangan peran`);
    assert.ok(EP.pemeran[b.tokoh!.id], `${b.id}: tokoh ada di pemeran`);
    assert.notEqual(tx(b.keterangan!), b.keterangan, `${b.id}: teks peran ada`);
  }
  // Pengemudi mobil kecil bukan tokoh bergambar: ia berupa ikon dan tetap berketerangan (tanpa dikarang identitasnya).
  const mobil = k.benda.find((b) => b.id === 'mobilkecil')!;
  assert.ok(mobil.seni && !mobil.tokoh && mobil.keterangan);
});

test('K10: tiap perbedaan punya catatan bukti; yang belum diketahui disebut belum diketahui (bukan dinyatakan tidak ada)', () => {
  const k = arena('k10');
  assert.equal(k.pola, 'bandingkan');
  if (k.pola !== 'bandingkan') return;
  assert.deepEqual(k.selisih.map((s) => s.id), ['jam', 'nama', 'antisipasi']);
  for (const s of k.selisih) assert.ok(s.catatan, `${s.id}: catatan bukti`);
  const cat = Object.fromEntries(k.selisih.map((s) => [s.id, tx(s.catatan!)]));
  assert.match(cat.jam!, /belum diketahui/i);
  assert.match(cat.antisipasi!, /Dalam kutipan ini/);
  assert.match(cat.antisipasi!, /Belum diketahui apakah catatan polisi/);
  assert.doesNotMatch(cat.antisipasi!, /tidak ada di catatan polisi|polisi tidak (menulis|memuat)/i, 'ketiadaan di catatan polisi BELUM terkonfirmasi');
  assert.match(cat.nama!, /tertulis berbeda/);
  // T-020 (keputusan owner 16 Nov): dua kertas memuat isi tiap baris; nama = ejaan fiktif yang berbeda satu huruf, sama di semua bahasa.
  for (const s of k.selisih) { assert.ok(s.sel && s.ikon, `${s.id}: sel kertas + ikon`); for (const b of ['id', 'en', 'zh'] as const) for (const sisi of [s.sel!.kiri, s.sel!.kanan]) assert.notEqual(teksCerita(EP, sisi, b, { nama: 'Rina' }), sisi, `${sisi} (${b})`); }
  const nm = k.selisih.find((s) => s.id === 'nama')!.sel!;
  for (const b of ['id', 'en', 'zh'] as const) assert.deepEqual([teksCerita(EP, nm.kiri, b, { nama: 'Rina' }), teksCerita(EP, nm.kanan, b, { nama: 'Rina' })], ['Wahyudi', 'Wahyudin']);
  assert.deepEqual([tx('arena.selisih.sel.jam.kiri'), tx('arena.selisih.sel.jam.kanan'), tx('arena.selisih.sel.antisipasi.kiri')], ['20.10', '20.15', '?']);
});

test('K10: teks tugas tidak menilai perbedaan "kecil/wajar" dan tidak menuduh; hanya naskah asli yang memakai kata itu', () => {
  const larangan = /\b(kecil|wajar|sepele|bohong|menipu|penipuan|dusta)\b/i;
  const milik = ['akt.selisih.cerita', 'arena.selisih.faktaLipat', 'arena.selisih.jam.catatan', 'arena.selisih.nama.catatan', 'arena.selisih.antisipasi.catatan'];
  for (const k of milik) assert.doesNotMatch(tx(k), larangan, k);
});

/** PRNG deterministik kecil (mulberry32). */
function acak(benih: number): () => number {
  let s = benih >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

test('Episode 2 sah, dan 400 permainan acak (pilihan & jawaban arena apa pun) semuanya berakhir; ketiga akhir tercapai', () => {
  assert.deepEqual(validasiEpisode(EP), []);
  const kandidat = new Map<string, unknown[]>();
  const akhirDicapai = new Set<string>();
  for (let p = 0; p < 400; p++) {
    const r = acak(p + 1);
    let s = stateAwal(EP);
    let selesai = false;
    for (let i = 0; i < 700 && !selesai; i++) {
      const n = EP.node[s.node]!;
      if (n.jenis === 'akhir') { selesai = true; break; }
      if (semuaBarisTampil(EP, s) && n.jenis === 'pilihan') {
        const pil = pilihanTersedia(EP, s);
        s = jalankan(EP, s, { jenis: 'pilih', node: s.node, pilihan: pil[Math.floor(r() * pil.length)]!.id });
      } else if (semuaBarisTampil(EP, s) && n.jenis === 'aktivitas' && !s.umpanBalik) {
        const id = (n as NodeAktivitas).aktivitas;
        if (!kandidat.has(id)) kandidat.set(id, kandidatJawaban(EP, id, 100_000) ?? []);
        const k = kandidat.get(id)!;
        s = jalankan(EP, s, { jenis: 'aktivitas', node: s.node, jawaban: k[Math.floor(r() * k.length)] as never });
      } else s = jalankan(EP, s, { jenis: 'lanjut' });
    }
    assert.ok(selesai, `permainan acak ${p}: tidak berakhir (macet di ${s.node})`);
    akhirDicapai.add(String(s.akhir));
  }
  assert.deepEqual([...akhirDicapai].sort(), ['catatan', 'kurang', 'puas']);
});
