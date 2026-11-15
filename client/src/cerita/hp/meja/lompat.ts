/**
 * LOMPAT KE MEJA KASUS (PROTOTIPE, hanya halaman /meja build VITE_MEJA_KASUS=1): state cerita di AWAL titik bundel,
 * dihasilkan MESIN lewat jalur sah (pilihan & aktivitas yang disarankan naskah sebelum titik itu), supaya peninjau bisa
 * mencoba babak ini tanpa memainkan ulang seluruh episode. Bukan fitur pemain.
 */
import type { MissionAnswer } from '@shared/types';
import { jalankan, semuaBarisTampil, stateAwal } from '../../mesin';
import type { Episode, KonfigArena, NodeAktivitas, StateCerita } from '../../tipe';
import { jawabanKirim, tetapkan } from '../arena/logika';

/** Pilihan & susunan yang disarankan sebelum K11 (alternatif bernilai "tepat" di naskah). */
const TEPAT: Record<string, string> = { k01: 'a', k03: 'c', k06: 'b' };
const JAWAB: Record<string, MissionAnswer | ((k: KonfigArena) => MissionAnswer)> = {
  k02: { berkas: { formulir: 'sekarang', stnk: 'sekarang', ktp: 'sekarang', sim: 'sekarang', suratpolisi: 'menyusul', kk: 'tidak', slip: 'tidak', rekening: 'tidak' } },
  k04: (k) => (k.pola === 'tujuan' ? tetapkan({}, k.langkah, k.benda.id, 'pool') : {}),
  k05: (k) => (k.pola === 'tujuan' ? tetapkan({}, k.langkah, k.benda.id, 'mitra') : {}),
  k07: (k) => (k.pola === 'tujuan' ? tetapkan({}, k.langkah, k.benda.id, 'paralel') : {}),
  // K08 = arena rambu: tanda sama dengan tulisan rambu 1, tafsir rambu 2 bebas, kesimpulan C (alternatif tepat naskah).
  k08: { r1: { r1l3: 'tanda', r1l4: 'tanda' }, r2: { r2l1: 'tanda' }, simpul: 'c' },
  k09: { saksi: { hendra: 'ya', darto: 'ya', tol: 'ya', polisi: 'ya', mobilkecil: 'tidak' } },
  k10: { selisih: { jam: 'catat', nama: 'catat', antisipasi: 'catat' } },
};

/** State di awal node `target` lewat jalur saran; null bila jalur tidak sampai (naskah berubah). */
export function stateDiTitik(ep: Episode, target: string): StateCerita | null {
  let s = stateAwal(ep);
  for (let i = 0; i < 900; i++) {
    if (s.node === target) return s;
    const n = ep.node[s.node];
    if (!n) return null;
    let berikut = s;
    if (semuaBarisTampil(ep, s) && n.jenis === 'pilihan' && TEPAT[s.node]) {
      berikut = jalankan(ep, s, { jenis: 'pilih', node: s.node, pilihan: TEPAT[s.node]! });
    } else if (semuaBarisTampil(ep, s) && n.jenis === 'aktivitas' && JAWAB[s.node]) {
      const k = ep.aktivitas[(n as NodeAktivitas).aktivitas]?.arena;
      if (!k) return null;
      const j = JAWAB[s.node]!;
      berikut = jalankan(ep, s, { jenis: 'aktivitas', node: s.node, jawaban: jawabanKirim(k, typeof j === 'function' ? j(k) : j) });
    } else {
      berikut = jalankan(ep, s, { jenis: 'lanjut' });
    }
    if (berikut === s) return null;
    s = berikut;
  }
  return null;
}
