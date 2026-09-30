/**
 * TES PENYUSUN TOKOH PIKSEL (susun.ts + index.ts) atas manifest & atlas NYATA (seni/piksel/miss-raksa.*, bu-rina.*):
 * setiap pose cerita x ekspresi x arah x varian menghasilkan susunan sah (potongan di dalam atlas, koordinat bulat,
 * lapisan wajah di kotak wajah, kedip/bicara tidak menggeser tubuh/jangkar), pemetaan cerita -> seni, aturan
 * cadangan, potret & sisipan telepon berskala bulat, bentuk GambarTokoh raster panggung, SVG, dan komposisi piksel
 * nyata (pngjs) yang hanya berubah di kotak wajah/mata/mulut.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { DAFTAR_EKSPRESI, type Ekspresi, type PoseMentor, type PoseNasabah } from '../../tipe';
import { buatLetak } from '../../ui/panggung/dunia';
import { jalurKlip, kotakDiAtasMeja, pikselDari, SATUAN_PIKSEL, sidikGambar, tempelanDari, tinggiKepala } from '../../ui/panggung/piksel';
import {
  ARAH_BAWAAN, bacaManifestTokoh, buatPenyusun, DAFTAR_TOKOH_PIKSEL, idSvgAman, keGambarTokoh, keSvg, KEPALA_TINGGI_BAWAAN, opsiDariCerita,
  POSE_CERITA, potretDari, SATUAN, susunDari, susunFrame, svgPotret, svgTokoh, teleponDari,
  type ArahTokoh, type IdTokohPiksel, type KotakSeni, type ManifestTokoh, type MataTokoh, type MulutTokoh, type OpsiSusun, type SusunanTokoh,
} from './susun';
import * as pintu from './index';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const bacaJson = (f: string): unknown => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const JSON_MISS = bacaJson('miss-raksa.json') as Record<string, unknown>;
const JSON_RINA = bacaJson('bu-rina.json') as Record<string, unknown>;
const P = buatPenyusun({ missRaksa: { json: JSON_MISS, url: '/aset/miss-raksa.png' }, buRina: { json: JSON_RINA, url: '/aset/bu-rina.png' } });
const MAN: Record<IdTokohPiksel, ManifestTokoh> = { missRaksa: P.manifest.missRaksa!, buRina: P.manifest.buRina! };
const salin = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const ARAH: (ArahTokoh | undefined)[] = [undefined, 'kiri', 'kanan'];
const MATA: MataTokoh[] = ['buka', 'tutup', 'bawah'];
const MULUT: MulutTokoh[] = ['tutup', 'buka'];

const bulat = (k: KotakSeni) => [k.x, k.y, k.w, k.h].every(Number.isInteger);
const dalam = (k: KotakSeni, luar: KotakSeni) => k.x >= luar.x && k.y >= luar.y && k.x + k.w <= luar.x + luar.w && k.y + k.h <= luar.y + luar.h;
const dalamAtlas = (k: KotakSeni, a: { w: number; h: number }) => k.w > 0 && k.h > 0 && dalam(k, { x: 0, y: 0, w: a.w, h: a.h });

/** Frame yang diharapkan untuk pose cerita + arah (tabel dokumen MISS-RAKSA-PIKSEL.md & BU-RINA-PIKSEL.md). */
function frameHarapan(id: IdTokohPiksel, pose: string, hadap: ArahTokoh | undefined, e: Ekspresi): { frame: string; cadangan: string[] } {
  if (id === 'missRaksa') return { frame: `${pose}-${hadap ?? ARAH_BAWAAN[pose]}`, cadangan: [] };
  const hanya: Record<string, ArahTokoh> = { 'berdiri-pergi': 'kanan', 'duduk-turun': 'kiri', duduk: 'kiri', 'duduk-condong': 'kiri', telepon: 'kiri' };
  const cad = hadap && hanya[pose] && hanya[pose] !== hadap ? [`pose ${pose} tanpa arah ${hadap}: ${hanya[pose]}`] : [];
  const tubuh: Record<string, string> = { kesal: 'lipat-tangan', cemas: 'genggam', bingung: 'dagu', lega: 'dada' };
  if (pose === 'duduk') return { frame: tubuh[e] ?? 'duduk', cadangan: cad };
  if (pose === 'berdiri-pergi') return { frame: 'berdiri-kanan', cadangan: cad };
  if (hanya[pose]) return { frame: pose, cadangan: cad };
  return { frame: hadap === 'kanan' ? `${pose}-kanan` : pose, cadangan: cad };
}

const WAJAH_MISS: Record<Ekspresi, string> = { netral: 'netral', tersenyum: 'senyum', senang: 'senyum', cemas: 'prihatin', bingung: 'prihatin', serius: 'serius', kesal: 'serius', lega: 'lega' };

test('manifest nyata terbaca tanpa catatan; selisih skema kedua tokoh ditoleransi', () => {
  assert.equal(SATUAN, SATUAN_PIKSEL);
  assert.deepEqual(P.catatan, []);
  const m = MAN.missRaksa;
  const r = MAN.buRina;
  // Ukuran atlas = ukuran PNG nyata (header IHDR): atlas boleh dibangun ulang (mis. bingkai antara duduk-turun Miss
  // Raksa atau varian mata ditambahkan) tanpa tes ini ikut disunting.
  const ukuranPng = (f: string) => { const b = fs.readFileSync(path.join(DIR, f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
  assert.deepEqual(m.atlas, ukuranPng('miss-raksa.png'));
  assert.deepEqual(r.atlas, ukuranPng('bu-rina.png'));
  // 14 frame per tokoh; Miss Raksa boleh ditambah bingkai antara `duduk-turun-<arah>` (kedatangan, kanan & mungkin kiri).
  const turunMiss = Object.keys(m.frame).filter((f) => f.startsWith('duduk-turun')).length;
  assert.ok(turunMiss <= 2, `bingkai duduk-turun Miss Raksa: ${turunMiss}`);
  assert.equal(Object.keys(m.frame).length, 14 + turunMiss);
  assert.equal(Object.keys(r.frame).length, 14);
  assert.deepEqual(m.ekspresi, ['netral', 'senyum', 'prihatin', 'serius', 'lega']);
  assert.deepEqual([...r.ekspresi].sort(), [...DAFTAR_EKSPRESI].sort());
  // kepalaTinggi: Miss per frame (54), Bu Rina tidak punya -> bawaan
  for (const f of Object.values(m.frame)) assert.equal(f.kepalaTinggi, 54);
  for (const f of Object.values(r.frame)) assert.equal(f.kepalaTinggi, KEPALA_TINGGI_BAWAAN);
  // pinggul: Miss eksplisit, Bu Rina dari jangkar; kaki Bu Rina selalu ada
  for (const f of [...Object.values(m.frame), ...Object.values(r.frame)]) {
    if (f.jenisJangkar === 'pinggul') assert.deepEqual(f.pinggul, f.jangkar, f.id);
    else assert.deepEqual(f.kaki, f.jangkar, f.id);
  }
  for (const f of Object.values(r.frame)) assert.ok(f.kaki, `${f.id}: kaki`);
  // meja hanya di frame duduk Miss. v5: badan duduk 11 px seni lebih tinggi terhadap meja (garisMeja 91 -> 102, pinggul
  // tetap garisMeja + 34); kotak 1 baris di garisMeja - 1 = kolom lengan/tangan yang melintas tepi meja. Telepon v5:
  // lengan jauh bertumpu di meja dengan satu tangan (v4: ke pangkuan, tanpa diAtasMeja); sisa keliman jas di bawah manset
  // tangan istirahat dibuang (TUTUP_MANSET) -> frame telepon 2 baris lebih pendek (h 12 -> 10).
  assert.equal(m.frame['duduk-dengar-kiri']!.garisMeja, 102);
  assert.deepEqual(m.frame['duduk-dengar-kiri']!.diAtasMeja, [{ x: 0, y: 102, w: 61, h: 13 }, { x: 5, y: 101, w: 52, h: 1 }]);
  assert.deepEqual(m.frame['telepon-kiri']!.diAtasMeja, [{ x: 0, y: 102, w: 58, h: 10 }, { x: 5, y: 101, w: 18, h: 1 }]);
  for (const f of Object.values(r.frame)) assert.equal(f.diAtasMeja, undefined);
  // v5b (28 Sep): lengan tunjuk digambar ulang dari bawah ketiak (lengan atas lurus turun dengan celah ketiak berbentuk
  // baji -> siku bersudut di tepi jauh meja -> lengan bawah menurun ke kanan -> manset miring -> tangan + telunjuk 2 px);
  // ujung telunjuk TIDAK berubah: kartu (kartuMeja) x 800, ujung telunjuk dunia (816, 692) di dalam kartu &
  // LANDASAN_KARTU (tokoh.test 'kartu: ...')
  assert.deepEqual(m.frame['duduk-tunjuk-kiri']!.tangan.telunjuk, { x: 70, y: 115 });
  // pose Miss: bawaan & kartu; Bu Rina: tubuhEkspresi
  assert.deepEqual(m.pose['duduk-tunjuk']!.kartu, { arah: 'kanan', varian: 'bawah' });
  assert.equal(m.pose['duduk-tunjuk']!.bawaan, 'kanan');
  assert.equal(r.pose.duduk!.tubuhEkspresi.kesal, 'lipat-tangan');
  // jendela telepon: Bu Rina tanpa frame/skala -> telepon.frame & 1
  assert.deepEqual(r.telepon, { kunci: 'telepon', frame: 'telepon', x: 14, y: 0, sisi: 56, skala: 1, tampil: 56 });
  assert.deepEqual(m.telepon, { kunci: 'telepon', frame: 'telepon-kiri', x: 1, y: 0, sisi: 56, skala: 1, tampil: 56 });
  assert.deepEqual(m.potret.jendela.map((j) => j.tampil), [32, 44, 52, 64, 96]);
  assert.deepEqual(r.potret.dekat.map((j) => j.tampil), [52, 64, 96]);
  // semua pose cerita ada di manifest (tanpa cadangan pose)
  for (const id of DAFTAR_TOKOH_PIKSEL) for (const p of POSE_CERITA[id]) assert.ok(MAN[id].pose[p], `${id}: pose ${p}`);
});

test('setiap pose cerita x ekspresi x arah x varian: susunan sah, lapisan di atlas & kotak wajah, varian tidak menggeser tubuh', () => {
  let n = 0;
  for (const id of DAFTAR_TOKOH_PIKSEL) {
    const m = MAN[id];
    for (const pose of POSE_CERITA[id]) {
      for (const e of DAFTAR_EKSPRESI) {
        for (const hadap of ARAH) {
          const dasar = P.susunTokoh(id, { pose, ekspresi: e, hadap })!;
          const harap = frameHarapan(id, pose, hadap, e);
          const label = `${id} ${pose} ${e} ${hadap ?? '-'}`;
          assert.equal(dasar.frame, harap.frame, `${label}: frame`);
          assert.deepEqual(dasar.cadangan, harap.cadangan, `${label}: cadangan`);
          assert.equal(dasar.ekspresi, id === 'missRaksa' ? WAJAH_MISS[e] : e, `${label}: wajah`);
          const f = m.frame[dasar.frame]!;
          for (const mata of MATA) {
            for (const mulut of MULUT) {
              const s = P.susunTokoh(id, { pose, ekspresi: e, hadap, mata, mulut })!;
              const lb = `${label} ${mata}/${mulut}`;
              n++;
              assert.equal(s.url, id === 'missRaksa' ? '/aset/miss-raksa.png' : '/aset/bu-rina.png');
              assert.equal(s.hadap, f.hadap, `${lb}: hadap = arah frame`);
              assert.deepEqual(s.ukuran, { w: f.rect.w, h: f.rect.h });
              assert.deepEqual([s.mata, s.mulut], [mata, mulut], `${lb}: varian ada di manifest`);
              // urutan & isi lapisan
              const jenis = s.lapisan.map((l) => l.jenis);
              assert.deepEqual(jenis, ['tubuh', 'wajah', ...(mata !== 'buka' ? ['mata' as const] : []), ...(mulut === 'buka' ? ['mulut' as const] : [])], lb);
              assert.deepEqual(s.lapisan[0], { jenis: 'tubuh', sumber: f.rect, x: 0, y: 0 });
              const W = s.wajah!;
              const bingkai = { x: 0, y: 0, w: s.ukuran.w, h: s.ukuran.h };
              for (const l of s.lapisan) {
                assert.ok(bulat(l.sumber) && Number.isInteger(l.x) && Number.isInteger(l.y), `${lb}: koordinat bulat`);
                assert.ok(dalamAtlas(l.sumber, s.atlas), `${lb}: ${l.jenis} di dalam atlas`);
                const di = { x: l.x, y: l.y, w: l.sumber.w, h: l.sumber.h };
                assert.ok(dalam(di, bingkai), `${lb}: ${l.jenis} di dalam frame`);
                if (l.jenis === 'tubuh') continue;
                assert.ok(dalam(di, W.kotak), `${lb}: ${l.jenis} di dalam kotak wajah`);
                const target = l.jenis === 'wajah' ? W.kotak : l.jenis === 'mata' ? W.mata : W.mulut;
                assert.deepEqual(di, target, `${lb}: ${l.jenis} tepat di kotaknya`);
              }
              // varian: frame, tubuh, jangkar, kepala, meja, dan lapisan tubuh+wajah SAMA dengan dasar
              for (const k of ['frame', 'rect', 'ukuran', 'jangkar', 'kepala', 'kepalaTinggi', 'hadap', 'tangan', 'diAtasMeja', 'garisMeja', 'ekspresi'] as const) {
                assert.deepEqual(s[k], dasar[k], `${lb}: ${k} tetap`);
              }
              assert.deepEqual(s.lapisan.slice(0, 2), dasar.lapisan, `${lb}: tubuh + wajah tetap`);
              assert.deepEqual(s.cadangan, harap.cadangan, `${lb}: tanpa cadangan tambahan`);
            }
          }
        }
      }
    }
  }
  assert.equal(n, (7 + 8) * 8 * 3 * 3 * 2);
});

test('pemetaan cerita -> seni: wajah Miss, tubuh gestur Bu Rina, arah bawaan, mata bawah tunjuk-kiri', () => {
  for (const e of DAFTAR_EKSPRESI) {
    assert.equal(P.susunTokoh('missRaksa', { pose: 'duduk-dengar', ekspresi: e })!.ekspresi, WAJAH_MISS[e]);
    assert.equal(P.susunTokoh('buRina', { pose: 'duduk', ekspresi: e })!.ekspresi, e);
  }
  const frame = (id: IdTokohPiksel, o: OpsiSusun) => P.susunTokoh(id, o)!.frame;
  assert.equal(frame('missRaksa', { pose: 'berdiri-sambut', ekspresi: 'tersenyum' }), 'berdiri-sambut-kiri');
  assert.equal(frame('missRaksa', { pose: 'berdiri-persilakan', ekspresi: 'tersenyum' }), 'berdiri-persilakan-kanan');
  assert.equal(frame('missRaksa', { pose: 'duduk-tunjuk', ekspresi: 'serius' }), 'duduk-tunjuk-kanan');
  assert.equal(frame('missRaksa', { pose: 'telepon', ekspresi: 'netral' }), 'telepon-kiri');
  assert.equal(frame('buRina', { pose: 'jalan-b', ekspresi: 'netral', hadap: 'kanan' }), 'jalan-b-kanan');
  assert.equal(frame('buRina', { pose: 'berdiri-pergi', ekspresi: 'kesal' }), 'berdiri-kanan');
  // tunjuk-kiri + bawah = lapisan bawah frame itu (lirik kanan-bawah ke kartu), bukan bawah frame lain
  const kiri = P.susunTokoh('missRaksa', { pose: 'duduk-tunjuk', hadap: 'kiri', ekspresi: 'netral', mata: 'bawah' })!;
  const dengar = P.susunTokoh('missRaksa', { pose: 'duduk-dengar', hadap: 'kiri', ekspresi: 'netral', mata: 'bawah' })!;
  assert.notDeepEqual(kiri.lapisan[2]!.sumber, dengar.lapisan[2]!.sumber);
  assert.deepEqual(kiri.lapisan[2]!.sumber, MAN.missRaksa.frame['duduk-tunjuk-kiri']!.ekspresi.netral!.bawah);
  // tangan per sisi layar: Miss persilakan kanan -> kanan, kiri -> kiri; Bu Rina kunci berdiri -> kiri, pergi -> kanan
  assert.deepEqual(P.susunTokoh('missRaksa', { pose: 'berdiri-persilakan', ekspresi: 'netral' })!.tangan, { kanan: { x: 71, y: 73 } });
  assert.deepEqual(P.susunTokoh('missRaksa', { pose: 'berdiri-persilakan', hadap: 'kiri', ekspresi: 'netral' })!.tangan, { kiri: { x: 7, y: 73 } });
  assert.deepEqual(P.susunTokoh('buRina', { pose: 'berdiri', ekspresi: 'netral' })!.tangan, { kiri: { x: 9.5, y: 90 } });
  assert.deepEqual(P.susunTokoh('buRina', { pose: 'berdiri-pergi', ekspresi: 'netral' })!.tangan, { kanan: { x: 69.5, y: 90 } });
  assert.equal(P.susunTokoh('buRina', { pose: 'berdiri', ekspresi: 'netral' })!.kunciTergambar, true);
  assert.equal(P.susunTokoh('missRaksa', { pose: 'telepon', ekspresi: 'netral' })!.teleponTergambar, true);
  // hasil = objek baru (mengubahnya tidak merusak panggilan berikut); deterministik
  const a = P.susunTokoh('buRina', { pose: 'duduk', ekspresi: 'cemas', mata: 'tutup' })!;
  const b = P.susunTokoh('buRina', { pose: 'duduk', ekspresi: 'cemas', mata: 'tutup' })!;
  assert.deepEqual(a, b);
  a.lapisan[0]!.sumber.x = -1;
  a.jangkar.x = -1;
  assert.deepEqual(P.susunTokoh('buRina', { pose: 'duduk', ekspresi: 'cemas', mata: 'tutup' }), b);
  assert.notEqual(MAN.buRina.frame.genggam!.rect.x, -1);
});

test('opsiDariCerita: pandang -> arah & mata (Miss), Bu Rina tetap ke meja; kedip menang atas bawah', () => {
  const m = MAN.missRaksa;
  const r = MAN.buRina;
  const o = (id: IdTokohPiksel, x: Parameters<typeof opsiDariCerita>[2]) => opsiDariCerita(id, MAN[id], x);
  assert.deepEqual(o('missRaksa', { pose: 'duduk-dengar', ekspresi: 'netral', pandang: 'lawan' }), { pose: 'duduk-dengar', ekspresi: 'netral', hadap: 'kanan', mata: 'buka', mulut: 'tutup' });
  assert.equal(o('missRaksa', { pose: 'duduk-jelaskan', ekspresi: 'netral', pandang: 'pemain' }).hadap, 'kiri');
  assert.equal(o('missRaksa', { pose: 'berdiri', ekspresi: 'netral', pandang: 'depan' }).hadap, 'kiri');
  // momen kartu: tunjuk + bawah = kanan + bawah; tunjuk tanpa pandang = pandang bawaan (bawah)
  assert.deepEqual(o('missRaksa', { pose: 'duduk-tunjuk', ekspresi: 'serius', pandang: 'bawah' }), { pose: 'duduk-tunjuk', ekspresi: 'serius', hadap: 'kanan', mata: 'bawah', mulut: 'tutup' });
  assert.deepEqual(o('missRaksa', { pose: 'duduk-tunjuk', ekspresi: 'serius' }).hadap, 'kanan');
  assert.equal(o('missRaksa', { pose: 'duduk-tunjuk', ekspresi: 'serius' }).mata, 'bawah');
  assert.equal(o('missRaksa', { pose: 'duduk-tunjuk', ekspresi: 'serius', pandang: 'pemain' }).hadap, 'kiri');
  // bawah pada pose lain: arah bawaan pose (tanpa hadap -> susunDari memakai ARAH_BAWAAN)
  assert.equal(o('missRaksa', { pose: 'duduk-dengar', ekspresi: 'netral', pandang: 'bawah' }).hadap, undefined);
  assert.equal(susunDari(m, o('missRaksa', { pose: 'duduk-dengar', ekspresi: 'netral', pandang: 'bawah' })).frame, 'duduk-dengar-kanan');
  // tanpa pandang: bawaan generator SVG (sambut -> pemain -> kiri; telepon -> depan -> kiri; jelaskan -> lawan -> kanan)
  assert.equal(o('missRaksa', { pose: 'berdiri-sambut', ekspresi: 'tersenyum' }).hadap, 'kiri');
  assert.equal(o('missRaksa', { pose: 'telepon', ekspresi: 'netral' }).hadap, 'kiri');
  assert.equal(o('missRaksa', { pose: 'duduk-jelaskan', ekspresi: 'netral' }).hadap, 'kanan');
  // hadap eksplisit menang; kedip menang atas bawah; bicara -> mulut buka
  assert.equal(o('missRaksa', { pose: 'duduk-dengar', ekspresi: 'netral', pandang: 'lawan', hadap: 'kiri' }).hadap, 'kiri');
  assert.equal(o('missRaksa', { pose: 'duduk-tunjuk', ekspresi: 'netral', pandang: 'bawah', kedip: true }).mata, 'tutup');
  assert.equal(o('buRina', { pose: 'duduk', ekspresi: 'netral', bicara: true }).mulut, 'buka');
  // Bu Rina: pandang tidak mengubah arah; bawah -> mata bawah; pergi -> kanan
  assert.equal(o('buRina', { pose: 'duduk', ekspresi: 'netral', pandang: 'lawan' }).hadap, undefined);
  assert.equal(o('buRina', { pose: 'duduk', ekspresi: 'netral', pandang: 'pemain' }).hadap, undefined);
  assert.equal(o('buRina', { pose: 'duduk-condong', ekspresi: 'cemas', pandang: 'bawah' }).mata, 'bawah');
  assert.equal(susunDari(r, o('buRina', { pose: 'berdiri-pergi', ekspresi: 'netral' })).frame, 'berdiri-kanan');
  assert.equal(susunDari(r, o('buRina', { pose: 'jalan-a', ekspresi: 'netral', hadap: 'kanan' })).frame, 'jalan-a-kanan');
  // manifest tanpa `pandang` (Miss): bawaan PANDANG_BAWAAN sama
  const tanpa = bacaManifestTokoh({ ...salin(JSON_MISS), pandang: undefined })!;
  assert.equal(opsiDariCerita('missRaksa', tanpa, { pose: 'duduk-dengar', ekspresi: 'netral', pandang: 'lawan' }).hadap, 'kanan');
  assert.equal(opsiDariCerita('missRaksa', tanpa, { pose: 'duduk-dengar', ekspresi: 'netral', pandang: 'pemain' }).hadap, 'kiri');
});

test('cadangan: manifest dipangkas/cacat tetap menghasilkan susunan tanpa melempar, dengan catatan', () => {
  // pose hilang -> rantai POSE_CADANGAN (keluarga sama)
  const j1 = salin(JSON_MISS) as { pose: Record<string, unknown>; frame: Record<string, { ekspresi: Record<string, Record<string, unknown>>; wajah?: unknown }> };
  delete j1.pose['duduk-tunjuk'];
  delete j1.pose['berdiri-sambut'];
  delete j1.frame['duduk-jelaskan-kanan']!.ekspresi.serius!.kedip;
  delete j1.frame['duduk-jelaskan-kanan']!.ekspresi.lega;
  delete j1.frame['berdiri-kanan']!.wajah;
  const m1 = bacaManifestTokoh(j1)!;
  const tunjuk = susunDari(m1, { pose: 'duduk-tunjuk', ekspresi: 'serius' });
  assert.equal(tunjuk.frame, 'duduk-dengar-kanan');
  assert.deepEqual(tunjuk.cadangan, ['pose duduk-tunjuk tidak ada: duduk-dengar']);
  assert.equal(susunDari(m1, { pose: 'berdiri-sambut', ekspresi: 'netral' }).frame, 'berdiri-kiri');
  const kedip = susunDari(m1, { pose: 'duduk-jelaskan', ekspresi: 'kesal', mata: 'tutup', mulut: 'buka' });
  assert.equal(kedip.mata, 'buka');
  assert.equal(kedip.mulut, 'buka');
  assert.deepEqual(kedip.lapisan.map((l) => l.jenis), ['tubuh', 'wajah', 'mulut']);
  assert.match(kedip.cadangan.join('|'), /tanpa varian kedip/);
  const lega = susunDari(m1, { pose: 'duduk-jelaskan', ekspresi: 'lega' });
  assert.equal(lega.ekspresi, 'netral');
  assert.match(lega.cadangan.join('|'), /wajah lega tidak ada, netral/);
  const tanpaWajah = susunDari(m1, { pose: 'berdiri', hadap: 'kanan', ekspresi: 'senang', mata: 'tutup' });
  assert.deepEqual(tanpaWajah.lapisan.map((l) => l.jenis), ['tubuh']);
  assert.equal(tanpaWajah.ekspresi, '');
  assert.equal(tanpaWajah.mata, 'buka');
  // pose tak dikenal (bukan masukan cerita sah) tetap tidak melempar: keluarga jangkar sama, lalu pose pertama
  assert.equal(susunDari(MAN.missRaksa, { pose: 'duduk-rebah' as never, ekspresi: 'netral' }).jenisJangkar, 'pinggul');
  assert.ok(susunDari(MAN.buRina, { pose: 'terbang' as never, ekspresi: 'marah' as never }).frame);
  assert.match(susunDari(MAN.buRina, { pose: 'berdiri', ekspresi: 'marah' as never }).cadangan.join(''), /ekspresi marah tidak dikenal: netral/);

  // Bu Rina: frame gestur hilang -> tubuhEkspresi dilewati saat baca, bingung -> duduk
  const j2 = salin(JSON_RINA) as { frame: Record<string, unknown>; telepon: unknown; potret: Record<string, unknown> };
  delete j2.frame.dagu;
  const c2: string[] = [];
  const m2 = bacaManifestTokoh(j2, c2)!;
  assert.match(c2.join('|'), /tubuhEkspresi\.bingung: frame dagu tidak ada/);
  assert.equal(susunDari(m2, { pose: 'duduk', ekspresi: 'bingung' }).frame, 'duduk');

  // tanpa bagian pose: diturunkan dari id frame
  const j3 = salin(JSON_MISS);
  delete (j3 as { pose?: unknown }).pose;
  const m3 = bacaManifestTokoh(j3)!;
  // + bingkai antara duduk-turun bila atlas Miss Raksa memilikinya (frame duduk-turun-<arah>).
  const turun3 = Object.keys(MAN.missRaksa.frame).some((f) => f.startsWith('duduk-turun')) ? ['duduk-turun'] : [];
  assert.deepEqual(Object.keys(m3.pose).sort(), [...POSE_CERITA.missRaksa, ...turun3].sort());
  assert.equal(susunDari(m3, { pose: 'duduk-jelaskan', ekspresi: 'netral', hadap: 'kiri' }).frame, 'duduk-jelaskan-kiri');

  // potongan cacat dilewati dengan catatan: rect di luar atlas, ukuran lapisan salah, koordinat pecahan
  // (koordinat dari manifest nyata: atlas boleh dibangun ulang)
  const j4 = salin(JSON_RINA) as { frame: Record<string, { rect: number[]; ekspresi: Record<string, Record<string, number[]>> }> };
  const mataRina = MAN.buRina.frame.duduk!.wajah!.mata;
  j4.frame['duduk-condong']!.rect = [MAN.buRina.atlas.w - 6, 0, 92, 159];
  j4.frame.duduk!.ekspresi.senang!.kedip = [0, 0, mataRina.w - 1, mataRina.h];
  j4.frame.duduk!.ekspresi.lega!.dasar = [0.5, 0, 26, 34];
  const c4: string[] = [];
  const m4 = bacaManifestTokoh(j4, c4)!;
  assert.equal(m4.frame['duduk-condong'], undefined);
  assert.match(c4.join('|'), /frame duduk-condong: rect tidak sah/);
  assert.ok(c4.includes(`frame duduk.senang.kedip: ukuran ${mataRina.w - 1}x${mataRina.h} != kotak ${mataRina.w}x${mataRina.h}, dilewati`), c4.join('|'));
  assert.match(c4.join('|'), /duduk\.lega\.dasar: di luar atlas/);
  assert.equal(susunDari(m4, { pose: 'duduk-condong', ekspresi: 'netral' }).frame, 'duduk');
  assert.equal(susunDari(m4, { pose: 'duduk', ekspresi: 'senang', mata: 'tutup' }).mata, 'buka');
  // manifest tidak bisa dipakai -> null + alasan; penyusun -> null (pakai SVG), tidak melempar
  for (const [json, alasan] of [[null, /bukan objek/], [{ ...JSON_MISS, piksel: 2 }, /satuan 2/], [{ ...JSON_MISS, ukuranAtlas: [0, 5] }, /ukuranAtlas/], [{ ...JSON_MISS, frame: {} }, /tanpa frame/]] as const) {
    const c: string[] = [];
    assert.equal(bacaManifestTokoh(json, c), null);
    assert.match(c.join('|'), alasan);
  }
  const kosong = buatPenyusun({ missRaksa: { json: { piksel: 3 }, url: 'x.png' }, buRina: { json: JSON_RINA, url: '' } });
  assert.equal(kosong.tersedia('missRaksa'), false);
  assert.equal(kosong.tersedia('buRina'), false);
  assert.equal(kosong.susunTokoh('missRaksa', { pose: 'berdiri', ekspresi: 'netral' }), null);
  assert.equal(kosong.gambarTokohPiksel({ siapa: 'nasabah', pose: 'duduk', ekspresi: 'netral' }), null);
  assert.equal(kosong.potretTokoh('buRina', 'netral', 44), null);
  assert.equal(kosong.teleponSisipan('netral', 52), null);
  assert.equal(kosong.catatan.length, 2);
});

/** Kotak wajah frame di koordinat frame: di dalam jendela pada sumbu yang juga memuatnya di jendela acuan manifest. */
function cekPotret(id: IdTokohPiksel, p: NonNullable<ReturnType<typeof P.potretTokoh>>, u: number, label: string) {
  assert.ok(Number.isInteger(p.skala) && p.skala >= 1, `${label}: skala bulat`);
  assert.ok([p.jendela.x, p.jendela.y, p.jendela.sisi].every(Number.isInteger), `${label}: jendela bulat`);
  assert.equal(p.tampil, p.jendela.sisi * p.skala, `${label}: tampil`);
  assert.equal(p.ukuranPx, u);
  assert.ok(p.tampil >= u && p.potong === p.tampil - u && p.potong < p.skala, `${label}: lingkaran penuh`);
  assert.ok(Math.abs(p.viewBox.w * p.skala - u) < 1e-9 && p.viewBox.w === p.viewBox.h, `${label}: viewBox = ukuran / skala`);
  // tepi piksel seni jatuh di piksel tampil bulat
  assert.ok(Number.isInteger(Math.round((p.viewBox.x - p.jendela.x) * p.skala * 1e6) / 1e6), `${label}: geser bulat`);
  const f = MAN[id].frame[p.frame]!;
  assert.deepEqual(p.lapisan.map((l) => l.jenis), ['tubuh', 'wajah']);
  assert.equal(p.lapisan[1]!.x, f.wajah!.kotak.x);
}

test('potret: jendela manifest dipakai persis; 28/36/48/56/112 turunan dengan skala bulat yang memenuhi lingkaran', () => {
  for (const id of DAFTAR_TOKOH_PIKSEL) {
    const m = MAN[id];
    for (const [keluarga, daftar] of [['jendela', m.potret.jendela], ['dekat', m.potret.dekat]] as const) {
      for (const j of daftar) {
        const p = P.potretTokoh(id, 'netral', j.tampil, { dekat: keluarga === 'dekat' })!;
        assert.deepEqual([p.jendela, p.skala, p.frame, p.asal, p.potong], [{ x: j.x, y: j.y, sisi: j.sisi }, j.skala, j.frame, `${keluarga}.${j.kunci}`, 0]);
      }
    }
    for (const u of [28, 32, 36, 40, 44, 48, 52, 56, 64, 72, 96, 97, 112, 128]) {
      for (const dekat of [false, true]) {
        for (const e of DAFTAR_EKSPRESI) {
          const p = P.potretTokoh(id, e, u, { dekat })!;
          const label = `${id} ${u} ${dekat ? 'dekat' : 'biasa'} ${e}`;
          cekPotret(id, p, u, label);
          assert.equal(p.frame, m.potret.frame, `${label}: frame potret (bukan tubuh gestur)`);
          assert.deepEqual(p.cadangan, []);
          // wajah yang terlihat di jendela ACUAN manifest (per sumbu) tetap terlihat di jendela turunan
          const W = m.frame[p.frame]!.wajah!.kotak;
          const J = { x: p.jendela.x, y: p.jendela.y, w: p.jendela.sisi, h: p.jendela.sisi };
          const kunci = /(?:jendela|dekat)\.(\d+)$/.exec(p.asal)![1];
          const A = (dekat ? m.potret.dekat : m.potret.jendela).find((j) => j.kunci === kunci)!;
          if (A.x <= W.x && A.x + A.sisi >= W.x + W.w) assert.ok(W.x >= J.x && W.x + W.w <= J.x + J.w, `${label}: lebar wajah (acuan ${p.asal})`);
          if (A.y <= W.y && A.y + A.sisi >= W.y + W.h) assert.ok(W.y >= J.y && W.y + W.h <= J.y + J.h, `${label}: tinggi wajah (acuan ${p.asal})`);
          if (!dekat && id === 'missRaksa') assert.ok(dalam(W, J), `${label}: wajah Miss utuh di jendela biasa`);
        }
      }
    }
    // ukuran nyata aplikasi: pas tanpa potong
    for (const u of [28, 32, 36, 44, 48, 52, 56, 64, 96]) assert.equal(P.potretTokoh(id, 'netral', u)!.potong, 0, `${id} ${u}`);
    assert.deepEqual(P.potretTokoh(id, 'netral', 28)!.skala, 1);
    assert.deepEqual(P.potretTokoh(id, 'netral', 36)!.jendela.sisi, 36);
    assert.deepEqual(P.potretTokoh(id, 'netral', 56, { dekat: true })!.skala, 2);
  }
  // 32-44 px dekat tetap x1 (fitur 1 px; saran manifest), ukuran tak sah -> 1 px, tidak melempar
  assert.equal(P.potretTokoh('missRaksa', 'netral', 44, { dekat: true })!.skala, 1);
  assert.equal(P.potretTokoh('buRina', 'netral', 32, { dekat: true })!.skala, 1);
  assert.equal(P.potretTokoh('buRina', 'netral', Number.NaN)!.ukuranPx, 1);
  // mata/mulut potret
  const bicara = P.potretTokoh('missRaksa', 'tersenyum', 52, { dekat: true, mata: 'tutup', mulut: 'buka' })!;
  assert.deepEqual(bicara.lapisan.map((l) => l.jenis), ['tubuh', 'wajah', 'mata', 'mulut']);
  assert.equal(bicara.ekspresi, 'senyum');
});

test('sisipan telepon: jendela 56 manifest, ukuran HP/desktop skala bulat, kepala/wajah tidak terpotong', () => {
  const r = MAN.buRina;
  const f = r.frame.telepon!;
  const atas = f.kepala.y - f.kepalaTinggi / 2;
  const bawah = f.kepala.y + f.kepalaTinggi / 2;
  for (const u of [44, 52, 56, 64, 88, 104, 112, 128]) {
    for (const e of DAFTAR_EKSPRESI) {
      const p = P.teleponSisipan(e, u, { mulut: 'buka' })!;
      const label = `telepon ${u} ${e}`;
      cekPotret('buRina', { ...p, lapisan: p.lapisan.slice(0, 2) }, u, label);
      assert.equal(p.frame, 'telepon');
      assert.equal(p.lapisan.at(-1)!.jenis, 'mulut');
      const J = { x: p.jendela.x, y: p.jendela.y, w: p.jendela.sisi, h: p.jendela.sisi };
      assert.ok(dalam(f.wajah!.kotak, J), `${label}: wajah utuh`);
      if (p.jendela.sisi >= bawah - atas) assert.ok(p.jendela.y <= atas && p.jendela.y + p.jendela.sisi >= bawah, `${label}: kepala utuh`);
    }
  }
  assert.deepEqual(P.teleponSisipan('netral', 56)!.jendela, { x: 14, y: 0, sisi: 56 });
  assert.equal(P.teleponSisipan('netral', 56)!.asal, 'telepon');
  assert.deepEqual([P.teleponSisipan('netral', 112)!.jendela, P.teleponSisipan('netral', 112)!.skala], [{ x: 14, y: 0, sisi: 56 }, 2]);
  assert.equal(P.teleponSisipan('netral', 52)!.jendela.y, 0, 'tepi atas tetap');
  const miss = P.teleponSisipan('cemas', 56, { tokoh: 'missRaksa' })!;
  assert.deepEqual([miss.frame, miss.ekspresi, miss.jendela], ['telepon-kiri', 'prihatin', { x: 1, y: 0, sisi: 56 }]);
  // tanpa jendela telepon di manifest: jendela kepala frame potret
  const tanpa = bacaManifestTokoh({ ...salin(JSON_RINA), telepon: undefined })!;
  const t = teleponDari(tanpa, 'netral', 52);
  assert.equal(t.asal, 'kepala');
  assert.match(t.cadangan.join(''), /tanpa jendela telepon/);
});

test('keGambarTokoh = GambarTokoh raster panggung (piksel.ts): potongan, tempelan, meja, kepala, kisi', () => {
  const kasus: [IdTokohPiksel, OpsiSusun][] = [
    ['missRaksa', { pose: 'duduk-dengar', ekspresi: 'cemas', hadap: 'kanan' }],
    ['missRaksa', { pose: 'duduk-tunjuk', ekspresi: 'serius', mata: 'bawah', mulut: 'buka' }],
    ['missRaksa', { pose: 'berdiri-persilakan', ekspresi: 'tersenyum' }],
    ['missRaksa', { pose: 'telepon', ekspresi: 'netral', mulut: 'buka' }],
    ['buRina', { pose: 'jalan-a', ekspresi: 'netral', hadap: 'kanan' }],
    ['buRina', { pose: 'duduk', ekspresi: 'kesal', mata: 'tutup' }],
  ];
  for (const [id, o] of kasus) {
    const s = P.susunTokoh(id, o)!;
    const g = keGambarTokoh(s);
    const K = SATUAN_PIKSEL;
    assert.equal(g.svg, '');
    assert.deepEqual(pikselDari(g), { url: s.url, atlas: s.atlas, sumber: s.rect });
    assert.deepEqual(tempelanDari(g), s.lapisan.slice(1).map((l) => ({ p: { url: s.url, atlas: s.atlas, sumber: l.sumber }, x: l.x, y: l.y })));
    assert.deepEqual([g.w, g.h], [s.ukuran.w * K, s.ukuran.h * K]);
    assert.deepEqual(g.jangkar, { x: s.jangkar.x * K, y: s.jangkar.y * K });
    assert.deepEqual(g.kepala, { x: s.kepala.x * K, y: s.kepala.y * K });
    assert.equal(tinggiKepala(g), s.kepalaTinggi * K);
    assert.deepEqual(kotakDiAtasMeja(g), (s.diAtasMeja ?? []).map((k) => ({ x: k.x * K, y: k.y * K, w: k.w * K, h: k.h * K })));
    for (const sisi of ['kiri', 'kanan'] as const) assert.deepEqual(g.tangan?.[sisi], s.tangan[sisi] ? { x: s.tangan[sisi]!.x * K, y: s.tangan[sisi]!.y * K } : undefined);
    // panggung: skala 1, pojok kiri-atas di kisi 4 satuan
    const opsiTokoh = id === 'missRaksa'
      ? { siapa: 'mentor' as const, pose: o.pose as PoseMentor, ekspresi: o.ekspresi }
      : { siapa: 'nasabah' as const, pose: o.pose as PoseNasabah, ekspresi: o.ekspresi };
    const letak = buatLetak(opsiTokoh, { x: 657, y: 793 }, 1.05, 0, () => g);
    assert.equal(letak.skala, 1);
    assert.equal((letak.titik.x - g.jangkar.x) % K, 0);
    assert.equal((letak.titik.y - g.jangkar.y) % K, 0);
  }
  // kedip/bicara: potongan tubuh & kanvas sama, sidik berbeda (panggung menggambar salinan varian)
  const dasar = P.gambarTokohPiksel({ siapa: 'mentor', pose: 'duduk-jelaskan', ekspresi: 'netral', pandang: 'pemain' })!;
  const kedip = P.gambarTokohPiksel({ siapa: 'mentor', pose: 'duduk-jelaskan', ekspresi: 'netral', pandang: 'pemain', kedip: true })!;
  const bicara = P.gambarTokohPiksel({ siapa: 'mentor', pose: 'duduk-jelaskan', ekspresi: 'netral', pandang: 'pemain', bicara: true })!;
  for (const v of [kedip, bicara]) {
    assert.deepEqual([v.w, v.h, v.jangkar, v.kepala, pikselDari(v), v.diAtasMejaPiksel], [dasar.w, dasar.h, dasar.jangkar, dasar.kepala, pikselDari(dasar), dasar.diAtasMejaPiksel]);
    assert.notEqual(sidikGambar(v), sidikGambar(dasar));
  }
  assert.ok(jalurKlip(kotakDiAtasMeja(dasar)));
  assert.equal(dasar.piksel.sumber.x, MAN.missRaksa.frame['duduk-jelaskan-kiri']!.rect.x);
  // gambarTokohPiksel = keGambarTokoh(susunDari(opsiDariCerita))
  const o = { siapa: 'nasabah' as const, pose: 'duduk' as const, ekspresi: 'lega' as const, pandang: 'bawah' as const, bicara: true };
  assert.deepEqual(P.gambarTokohPiksel(o), keGambarTokoh(susunDari(MAN.buRina, opsiDariCerita('buRina', MAN.buRina, o), '/aset/bu-rina.png')));
  assert.equal(P.gambarTokohPiksel(o)!.piksel.sumber.x, MAN.buRina.frame.dada!.rect.x);
});

test('keSvg / svgPotret / svgTokoh: <image> pixelated memotong atlas, tanpa id kecuali diminta, URL di-escape', () => {
  const p = P.potretTokoh('missRaksa', 'tersenyum', 52, { mata: 'tutup' })!;
  const s = svgPotret(p);
  assert.equal(s.viewBox, '3 4 52 52');
  assert.equal(s.ukuran, 52);
  assert.ok(s.svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="3 4 52 52" width="52" height="52"'));
  assert.ok(!/\sid=/.test(s.svg) && !/\sid=/.test(s.isi), 'tanpa id');
  assert.equal((s.svg.match(/<image /g) ?? []).length, p.lapisan.length);
  assert.equal((s.svg.match(/image-rendering="pixelated"/g) ?? []).length, p.lapisan.length);
  assert.equal((s.svg.match(/<svg[\s>]/g) ?? []).length, (s.svg.match(/<\/svg>/g) ?? []).length);
  assert.ok(s.svg.includes('aria-hidden="true"'));
  // lapisan wajah Miss = kotak wajah 24 x 22 (v5: fitur master, kotak = piksel yang benar-benar berubah)
  assert.ok(s.svg.includes(`viewBox="${p.lapisan[1]!.sumber.x} ${p.lapisan[1]!.sumber.y} 24 22"`));
  const id = svgPotret(p, { id: ':r1:', judul: 'Miss "Raksa" <b>' }).svg;
  assert.ok(id.includes(' id="r1"') && id.includes('role="img"') && id.includes('aria-label="Miss &quot;Raksa&quot; &lt;b&gt;"'));
  assert.equal(idSvgAman('«r1»'), 'r1');
  assert.equal(idSvgAman('1-a'), 'p1-a');
  assert.equal(idSvgAman('::'), '');
  const aneh = keSvg(p.lapisan, 'a.png?x=1&y="2"', p.atlas);
  assert.ok(aneh.includes('href="a.png?x=1&amp;y=&quot;2&quot;"'));
  const t = svgTokoh(P.susunTokoh('buRina', { pose: 'berdiri', ekspresi: 'netral' })!, { skala: 2 });
  assert.ok(t.includes('viewBox="0 0 79 191" width="158" height="382"'));
  // potong ganjil: viewBox pecahan tetapi skala tetap bulat
  const ganjil = svgPotret(P.potretTokoh('missRaksa', 'netral', 97)!);
  assert.equal(ganjil.viewBox, '5 5 48.5 48.5');
});

// ------------------------------------------------------------------ komposisi piksel nyata

const { PNG } = createRequire(import.meta.url)('pngjs') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Buffer } } } };
const ATLAS: Record<IdTokohPiksel, { width: number; height: number; data: Buffer }> = {
  missRaksa: PNG.sync.read(fs.readFileSync(path.join(DIR, 'miss-raksa.png'))),
  buRina: PNG.sync.read(fs.readFileSync(path.join(DIR, 'bu-rina.png'))),
};

/** Komposisi RGBA sebuah susunan (alpha-over lapisan berurutan, seperti <image> bertumpuk di panggung). */
function komposit(id: IdTokohPiksel, s: SusunanTokoh): Uint8Array {
  const A = ATLAS[id];
  const o = new Uint8Array(s.ukuran.w * s.ukuran.h * 4);
  for (const l of s.lapisan) {
    for (let y = 0; y < l.sumber.h; y++) {
      for (let x = 0; x < l.sumber.w; x++) {
        const i = ((l.sumber.y + y) * A.width + l.sumber.x + x) * 4;
        if (A.data[i + 3] === 0) continue;
        const j = ((l.y + y) * s.ukuran.w + l.x + x) * 4;
        o[j] = A.data[i]!; o[j + 1] = A.data[i + 1]!; o[j + 2] = A.data[i + 2]!; o[j + 3] = A.data[i + 3]!;
      }
    }
  }
  return o;
}
function bedaDiLuar(a: Uint8Array, b: Uint8Array, w: number, kotak: KotakSeni[]): number {
  let n = 0;
  for (let p = 0; p < a.length / 4; p++) {
    const x = p % w;
    const y = Math.floor(p / w);
    if (kotak.some((k) => x >= k.x && y >= k.y && x < k.x + k.w && y < k.y + k.h)) continue;
    if (a[p * 4] !== b[p * 4] || a[p * 4 + 1] !== b[p * 4 + 1] || a[p * 4 + 2] !== b[p * 4 + 2] || a[p * 4 + 3] !== b[p * 4 + 3]) n++;
  }
  return n;
}

test('komposisi piksel nyata: ekspresi hanya mengubah kotak wajah, kedip/bawah/bicara hanya kotak mata/mulut; alpha biner; netral = tubuh', () => {
  let n = 0;
  for (const id of DAFTAR_TOKOH_PIKSEL) {
    const m = MAN[id];
    for (const f of Object.values(m.frame)) {
      const tubuh = komposit(id, { ...susunFrame(m, f.id, { ekspresi: 'netral' }), lapisan: [{ jenis: 'tubuh', sumber: f.rect, x: 0, y: 0 }] });
      const netral = komposit(id, susunFrame(m, f.id, { ekspresi: 'netral' }));
      assert.equal(bedaDiLuar(tubuh, netral, f.rect.w, []), 0, `${id} ${f.id}: wajah netral = tubuh (cadangan tubuh saja aman)`);
      for (let i = 3; i < netral.length; i += 4) assert.ok(netral[i] === 0 || netral[i] === 255, `${id} ${f.id}: alpha biner`);
      const W = f.wajah!;
      for (const e of m.ekspresi) {
        const dasar = komposit(id, susunFrame(m, f.id, { ekspresi: e }));
        assert.equal(bedaDiLuar(netral, dasar, f.rect.w, [W.kotak]), 0, `${id} ${f.id} ${e}: di luar kotak wajah`);
        for (const mata of MATA) {
          for (const mulut of MULUT) {
            const v = komposit(id, susunFrame(m, f.id, { ekspresi: e, mata, mulut }));
            assert.equal(bedaDiLuar(dasar, v, f.rect.w, [W.mata, W.mulut]), 0, `${id} ${f.id} ${e} ${mata}/${mulut}: di luar mata/mulut`);
            n++;
          }
        }
      }
    }
  }
  const frameMiss = Object.keys(MAN.missRaksa.frame).length;
  assert.ok(frameMiss >= 14);
  assert.equal(n, frameMiss * 5 * 6 + 14 * 8 * 6);
});

test('pintu masuk index.ts: manifest nyata terpasang, URL atlas, fungsi terikat', () => {
  assert.deepEqual(pintu.penyusunPiksel.catatan, []);
  assert.ok(pintu.tokohPikselTersedia('missRaksa') && pintu.tokohPikselTersedia('buRina'));
  assert.match(pintu.URL_ATLAS_PIKSEL.missRaksa, /miss-raksa\.png$/);
  assert.match(pintu.URL_ATLAS_PIKSEL.buRina, /bu-rina\.png$/);
  const s = pintu.susunTokoh('buRina', { pose: 'duduk', ekspresi: 'cemas' })!;
  assert.equal(s.url, pintu.URL_ATLAS_PIKSEL.buRina);
  assert.equal(s.frame, 'genggam');
  assert.equal(pintu.potretTokoh('missRaksa', 'tersenyum', 44)!.url, pintu.URL_ATLAS_PIKSEL.missRaksa);
  assert.equal(pintu.teleponSisipan('kesal', 52)!.frame, 'telepon');
  const g = pintu.gambarTokohPiksel({ siapa: 'mentor', pose: 'berdiri-sambut', ekspresi: 'senang' })!;
  assert.equal(pikselDari(g)!.url, pintu.URL_ATLAS_PIKSEL.missRaksa);
  assert.equal(typeof pintu.keGambarTokoh, 'function');
  assert.equal(typeof pintu.keSvg, 'function');
});

test('bingkai antara duduk-turun Miss Raksa: frame duduk-turun-<arah> dipakai (dengan ATAU tanpa entri pose), tanpa frame = cadangan berdiri', () => {
  // Manifest Miss dengan frame antara tambahan (salinan frame berdiri-persilakan-kanan berjangkar telapak): cukup untuk
  // menguji pemetaan penyusun, bukan seni. Frame nyata (bila atlas sudah memilikinya) diuji dengan cara yang sama.
  const denganFrame = (entriPose: boolean) => {
    const j = salin(JSON_MISS) as { frame: Record<string, unknown>; pose: Record<string, unknown> };
    const nyata = Object.keys(j.frame).some((f) => f.startsWith('duduk-turun'));
    if (!nyata) j.frame['duduk-turun-kanan'] = salin(j.frame['berdiri-persilakan-kanan']);
    if (entriPose && !j.pose['duduk-turun']) j.pose['duduk-turun'] = { kanan: 'duduk-turun-kanan' };
    if (!entriPose && !nyata) delete j.pose['duduk-turun'];
    const c: string[] = [];
    return { m: bacaManifestTokoh(j, c)!, catatan: c };
  };
  for (const entriPose of [true, false]) {
    const { m, catatan } = denganFrame(entriPose);
    assert.ok(m.pose['duduk-turun']?.kanan?.startsWith('duduk-turun'), `entri pose ${entriPose}: pose duduk-turun terbaca / diturunkan`);
    if (!entriPose && !Object.keys(JSON_MISS.frame as object).some((f) => f.startsWith('duduk-turun'))) {
      assert.ok(catatan.some((x) => /pose duduk-turun diturunkan dari frame duduk-turun-kanan/.test(x)), 'turunan dicatat');
    }
    // Opsi panggung (rencana.ts bingkaiTurunMentor): pandang lawan = hadap kanan, ekspresi pose akhir.
    for (const e of DAFTAR_EKSPRESI) {
      const s = susunDari(m, opsiDariCerita('missRaksa', m, { pose: 'duduk-turun' as PoseMentor, ekspresi: e, pandang: 'lawan' }), '/a.png');
      assert.ok(s.frame.startsWith('duduk-turun') && s.frame.endsWith('-kanan'), `${e}: frame ${s.frame}`);
      assert.equal(s.pose, 'duduk-turun');
      assert.ok(!s.cadangan.some((x) => /pose duduk-turun tidak ada/.test(x)), `${e}: tanpa cadangan pose (${s.cadangan.join('; ')})`);
      const g = keGambarTokoh(s);
      assert.ok(pikselDari(g), `${e}: raster`);
    }
  }
  // Tanpa frame antara (atlas lama): cadangan rantai POSE_CADANGAN -> berdiri (panggung tidak memakainya:
  // ui/panggung/sumber.ts bisaDudukTurunMentor memeriksa id frame).
  const j = salin(JSON_MISS) as { frame: Record<string, unknown>; pose: Record<string, unknown> };
  for (const f of Object.keys(j.frame)) if (f.startsWith('duduk-turun')) delete j.frame[f];
  delete j.pose['duduk-turun'];
  const lama = bacaManifestTokoh(j)!;
  const s = susunDari(lama, opsiDariCerita('missRaksa', lama, { pose: 'duduk-turun' as PoseMentor, ekspresi: 'netral', pandang: 'lawan' }));
  assert.ok(s.frame.startsWith('berdiri') && !s.frame.startsWith('duduk-turun'), `tanpa frame: ${s.frame}`);
  assert.ok(s.cadangan.some((x) => /pose duduk-turun tidak ada/.test(x)));
  // Manifest nyata Bu Rina: tidak ada pose yang diturunkan (semua pose cerita punya entri).
  assert.ok(!MAN.buRina.catatan.some((x) => /diturunkan/.test(x)));
});
