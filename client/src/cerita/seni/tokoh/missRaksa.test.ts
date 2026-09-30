/**
 * Uji generator Miss Raksa final (seni/tokoh/missRaksa.ts): setiap pose × ekspresi × pandang × bicara/kedip/kecil
 * menghasilkan SVG sah (tag seimbang, tanpa NaN), kanvas & jangkar sesuai ukuran.ts, id berawalan & setiap url(#…)
 * menunjuk id yang ada, lapisan tangan di atas meja ber-awalan sendiri (tidak ada id kembar dengan SVG utama),
 * pandang/bicara/kedip benar-benar mengubah gambar (dan HANYA wajah: badan, lengan, lapisan meja tetap sama persis),
 * 8 ekspresi naskah → tepat 5 wajah, titik tangan untuk prop di semua pose duduk (telapak mempersilakan menjauh dari
 * tepi kanan kanvas), setiap pose berdiri & duduk punya DUA kaki + dua sepatu, aturan potret (jendela kecil Miss Raksa
 * = kontrak dinaikkan 6 + versi kecil <= POTRET_KECIL_MAKS_PX, raut mini <= POTRET_MINI_MAKS_PX, jendela sedang 53–75 px),
 * dan anggaran ukuran.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { DAFTAR_EKSPRESI, type ArahPandang, type PoseMentor } from '../../tipe';
import { awalanId } from '../../ui/panggung/dunia';
import {
  GARIS_SIKU,
  SERAGAM,
  JENDELA_POTRET_KECIL_MR,
  JENDELA_POTRET_SEDANG,
  POTRET_MINI_MAKS_PX,
  aturanPotret,
  gambarMissRaksa,
  potretMissRaksa,
  wajahDari,
} from './missRaksa';
import { JENDELA_POTRET_KECIL, JENDELA_POTRET_V3, KANVAS_BERDIRI, KANVAS_DUDUK, KEPALA_TINGGI, POTRET_KECIL_MAKS_PX } from './ukuran';
import { MEJA_KANVAS_DUDUK } from '../ruang/geometri';

const POSE: PoseMentor[] = ['berdiri-sambut', 'berdiri-persilakan', 'duduk-dengar', 'duduk-jelaskan', 'duduk-tunjuk', 'berdiri', 'telepon'];
const PANDANG: ArahPandang[] = ['lawan', 'pemain', 'bawah', 'depan'];
const duduk = (p: PoseMentor): boolean => p.startsWith('duduk') || p === 'telepon';

const ids = (svg: string): string[] => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]!);
const rujukan = (svg: string): string[] => [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]!);

/** Pemeriksa XML sederhana: tag buka/tutup seimbang, tag kosong ditutup `/>`. */
function tagSeimbang(svg: string): boolean {
  const tumpuk: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w-]*)[^<>]*?(\/?)>/g)) {
    const [, tutup, nama, kosong] = m;
    if (kosong) continue;
    if (tutup) {
      if (tumpuk.pop() !== nama) return false;
    } else tumpuk.push(nama!);
  }
  return tumpuk.length === 0 && !/<[^>]*</.test(svg);
}

function periksaDokumen(svg: string, awalan: string, konteks: string): void {
  assert.ok(!/NaN|undefined|Infinity|null/.test(svg), `${konteks}: angka/isi rusak`);
  assert.ok(tagSeimbang(svg), `${konteks}: tag tidak seimbang`);
  assert.ok(!svg.includes('<filter'), `${konteks}: tanpa filter (kinerja)`);
  assert.ok(!svg.includes('<image') && !svg.includes('data:'), `${konteks}: tanpa raster`);
  const semua = ids(svg);
  assert.equal(new Set(semua).size, semua.length, `${konteks}: id kembar di dalam satu SVG`);
  for (const i of semua) assert.ok(i.startsWith(`${awalan}-`), `${konteks}: id tanpa awalan ${i}`);
  const ada = new Set(semua);
  for (const r of rujukan(svg)) assert.ok(ada.has(r), `${konteks}: rujukan hilang ${r}`);
}

test('semua pose × 8 ekspresi × 4 pandang × bicara/kedip/kecil: SVG sah, kanvas & jangkar kontrak, id berawalan', () => {
  let n = 0;
  for (const pose of POSE) {
    const K = duduk(pose) ? KANVAS_DUDUK : KANVAS_BERDIRI;
    for (const ekspresi of DAFTAR_EKSPRESI) {
      for (const pandang of PANDANG) {
        for (const [bicara, kedip, kecil] of [[false, false, false], [true, false, false], [false, true, false], [true, false, true], [false, true, true]] as const) {
          const konteks = `${pose}/${ekspresi}/${pandang}/${bicara ? 'b' : ''}${kedip ? 'k' : ''}${kecil ? 'K' : ''}`;
          const g = gambarMissRaksa({ pose, ekspresi, pandang, bicara, kedip, kecil, id: 'uji' });
          n++;
          assert.equal(g.w, K.w, konteks);
          assert.equal(g.h, K.h, konteks);
          assert.deepEqual(g.jangkar, K.jangkar, konteks);
          assert.deepEqual(g.kepala, K.kepala, konteks);
          periksaDokumen(g.svg, 'uji', konteks);
          for (const t of [g.tangan?.kiri, g.tangan?.kanan]) {
            if (!t) continue;
            assert.ok(Number.isFinite(t.x) && Number.isFinite(t.y), `${konteks}: titik tangan`);
            assert.ok(t.x >= 0 && t.x <= K.w && t.y >= 0 && t.y <= K.h, `${konteks}: tangan di luar kanvas`);
          }
          if (g.diAtasMeja) periksaDokumen(g.diAtasMeja, 'ujid', `${konteks} diAtasMeja`);
        }
      }
    }
  }
  assert.equal(n, 7 * 8 * 4 * 5);
});

test('lapisan tangan di atas meja: hanya pose duduk, id sendiri (tidak kembar dengan SVG utama), kelas lapis-tangan', () => {
  for (const pose of POSE) {
    const g = gambarMissRaksa({ pose, ekspresi: 'netral', id: 't' });
    if (duduk(pose)) {
      assert.ok(g.diAtasMeja && g.diAtasMeja.length > 500, pose);
      assert.ok(g.svg.includes('class="lapis-tangan"'), pose);
      const utama = new Set(ids(g.svg));
      for (const i of ids(g.diAtasMeja!)) assert.ok(!utama.has(i), `${pose}: id kembar ${i}`);
    } else {
      assert.equal(g.diAtasMeja, undefined, pose);
      assert.ok(!g.svg.includes('lapis-tangan'), pose);
    }
    assert.ok(g.svg.includes('class="lapis-badan"'), pose);
  }
  assert.equal(GARIS_SIKU, MEJA_KANVAS_DUDUK, 'garis siku seni = garis siku ruang');
});

test('dua salinan dengan id berbeda tidak berbagi id; id bawaan tetap berawalan; deterministik', () => {
  const a = gambarMissRaksa({ pose: 'duduk-dengar', ekspresi: 'netral', id: 'a1' });
  const b = gambarMissRaksa({ pose: 'duduk-dengar', ekspresi: 'netral', id: 'b2' });
  const ia = new Set([...ids(a.svg), ...ids(a.diAtasMeja!)]);
  for (const i of [...ids(b.svg), ...ids(b.diAtasMeja!)]) assert.ok(!ia.has(i), `id bentrok ${i}`);
  const bawaan = gambarMissRaksa({ pose: 'berdiri-sambut', ekspresi: 'tersenyum' });
  periksaDokumen(bawaan.svg, 'mr', 'bawaan');
  assert.equal(gambarMissRaksa({ pose: 'berdiri-sambut', ekspresi: 'tersenyum' }).svg, bawaan.svg);
});

test('hasil cache tidak rusak bila objek hasil diubah pemanggil', () => {
  const a = gambarMissRaksa({ pose: 'duduk-tunjuk', ekspresi: 'serius', id: 'c' });
  a.jangkar.x = 999;
  if (a.tangan?.kiri) a.tangan.kiri.x = -5;
  a.svg = '';
  const b = gambarMissRaksa({ pose: 'duduk-tunjuk', ekspresi: 'serius', id: 'c' });
  assert.deepEqual(b.jangkar, KANVAS_DUDUK.jangkar);
  assert.ok(b.svg.length > 1000);
  assert.ok(b.tangan?.kiri && b.tangan.kiri.x > 0);
});

test('8 ekspresi naskah → tepat 5 wajah yang berbeda; pandang, bicara, kedip, kecil mengubah gambar', () => {
  assert.equal(wajahDari('netral'), 'dengar');
  assert.equal(wajahDari('tersenyum'), 'senyum');
  assert.equal(wajahDari('senang'), 'senyum');
  assert.equal(wajahDari('cemas'), 'prihatin');
  assert.equal(wajahDari('bingung'), 'prihatin');
  assert.equal(wajahDari('serius'), 'serius');
  assert.equal(wajahDari('kesal'), 'serius');
  assert.equal(wajahDari('lega'), 'lega');
  for (const pose of ['duduk-dengar', 'berdiri-sambut'] as const) {
    const svg = (o: Partial<Parameters<typeof gambarMissRaksa>[0]>) => gambarMissRaksa({ pose, ekspresi: 'netral', pandang: 'lawan', id: 'w', ...o }).svg;
    const semua = new Set(DAFTAR_EKSPRESI.map((e) => svg({ ekspresi: e })));
    assert.equal(semua.size, 5, `${pose}: 8 ekspresi → 5 wajah`);
    assert.equal(svg({ ekspresi: 'tersenyum' }), svg({ ekspresi: 'senang' }));
    assert.equal(svg({ ekspresi: 'cemas' }), svg({ ekspresi: 'bingung' }));
    assert.equal(svg({ ekspresi: 'serius' }), svg({ ekspresi: 'kesal' }));
    const dasar = svg({});
    assert.notEqual(dasar, svg({ bicara: true }), 'bicara');
    assert.notEqual(dasar, svg({ kedip: true }), 'kedip');
    assert.notEqual(dasar, svg({ kecil: true }), 'kecil');
    const arah = new Set(PANDANG.map((p) => svg({ pandang: p })));
    assert.equal(arah.size, 4, 'empat arah pandang berbeda');
    // versi kecil juga tetap 5 wajah berbeda
    assert.equal(new Set(DAFTAR_EKSPRESI.map((e) => svg({ ekspresi: e, kecil: true }))).size, 5);
  }
  // pandang bawaan per pose: tunjuk melihat ke bawah (kartu), sambut ke pemain
  assert.equal(gambarMissRaksa({ pose: 'duduk-tunjuk', ekspresi: 'netral', id: 'p' }).svg, gambarMissRaksa({ pose: 'duduk-tunjuk', ekspresi: 'netral', pandang: 'bawah', id: 'p' }).svg);
  assert.equal(gambarMissRaksa({ pose: 'berdiri-sambut', ekspresi: 'netral', id: 'p' }).svg, gambarMissRaksa({ pose: 'berdiri-sambut', ekspresi: 'netral', pandang: 'pemain', id: 'p' }).svg);
});

test('titik tangan untuk prop: semua pose duduk punya titik tangan di meja/telinga; tunjuk menunjuk kartu', () => {
  for (const pose of ['duduk-dengar', 'duduk-jelaskan', 'duduk-tunjuk', 'telepon'] as const) {
    const g = gambarMissRaksa({ pose, ekspresi: 'netral', id: 'h' });
    assert.ok(g.tangan?.kiri, `${pose}: tangan kiri (dekat)`);
    if (pose !== 'duduk-tunjuk') assert.ok(g.tangan?.kanan, `${pose}: tangan kanan (jauh)`);
    // tangan yang bertumpu di meja berada di bidang meja (di bawah garis siku)
    if (pose !== 'telepon') assert.ok(g.tangan!.kiri!.y > GARIS_SIKU, `${pose}: tangan dekat di meja`);
  }
  const tunjuk = gambarMissRaksa({ pose: 'duduk-tunjuk', ekspresi: 'netral', id: 'h' });
  assert.ok(tunjuk.tangan?.kiri && tunjuk.tangan.kiri.x > 340, 'ujung telunjuk jauh di kanan (ke arah kartu)');
  const jelaskan = gambarMissRaksa({ pose: 'duduk-jelaskan', ekspresi: 'serius', id: 'h' });
  assert.ok(jelaskan.tangan?.kanan && jelaskan.tangan.kanan.y < GARIS_SIKU, 'telapak menjelaskan terangkat di atas meja');
  const tel = gambarMissRaksa({ pose: 'telepon', ekspresi: 'netral', id: 'h' });
  assert.ok(tel.tangan?.kiri && tel.tangan.kiri.y < KANVAS_DUDUK.kepala.y + 70, 'tangan telepon setinggi kepala');
  const persilakan = gambarMissRaksa({ pose: 'berdiri-persilakan', ekspresi: 'tersenyum', id: 'h' });
  assert.ok(persilakan.tangan?.kanan && persilakan.tangan.kanan.x > 360, 'telapak terbuka mengarah ke kursi (kanan)');
  // putaran 4: ujung jari ± 32 satuan di kanan titik pegang; titik pegang <= 380 → ujung jari >= 8 satuan dari tepi 420
  assert.ok(persilakan.tangan.kanan.x <= 380, `telapak mempersilakan terlalu dekat tepi kanan: ${persilakan.tangan.kanan.x}`);
});

test('dua kaki + dua sepatu di semua pose (sprite duduk tanpa meja tidak berkaki satu)', () => {
  const hitung = (svg: string, warna: string): number => svg.split(`fill="${warna}"`).length - 1;
  for (const pose of POSE) {
    const g = gambarMissRaksa({ pose, ekspresi: 'netral', id: 'kk' });
    const badan = g.svg.slice(g.svg.indexOf('<g class="lapis-badan">'), g.svg.indexOf('<g transform="translate('));
    assert.equal(hitung(badan, SERAGAM.stoking), 2, `${pose}: dua betis`);
    assert.ok(hitung(badan, SERAGAM.sepatu) >= 2, `${pose}: dua sepatu`);
  }
});

test('anggaran ukuran: SVG utama ≤ 54 KB per pose (sasaran ≤ 60), lapisan meja ≤ 14 KB', () => {
  for (const pose of POSE) {
    for (const ekspresi of ['netral', 'tersenyum', 'cemas', 'serius', 'lega'] as const) {
      const g = gambarMissRaksa({ pose, ekspresi, bicara: true, id: 'ukuranPanjang' });
      assert.ok(g.svg.length <= 54 * 1024, `${pose}/${ekspresi}: ${(g.svg.length / 1024).toFixed(1)} KB`);
      if (g.diAtasMeja) assert.ok(g.diAtasMeja.length <= 14 * 1024, `${pose}/${ekspresi} diAtasMeja: ${(g.diAtasMeja.length / 1024).toFixed(1)} KB`);
    }
  }
});

test('bicara & kedip hanya mengubah wajah: badan, lengan, tangan & lapisan meja identik', () => {
  for (const pose of POSE) {
    for (const pandang of PANDANG) {
      const o = { pose, ekspresi: 'serius' as const, pandang, id: 'v' };
      const dasar = gambarMissRaksa(o);
      for (const varian of [gambarMissRaksa({ ...o, bicara: true }), gambarMissRaksa({ ...o, kedip: true })]) {
        const kepala = (s: string): number => s.indexOf('<g transform="translate(');
        assert.equal(varian.svg.slice(0, kepala(varian.svg)), dasar.svg.slice(0, kepala(dasar.svg)), `${pose}/${pandang}: badan sebelum kepala`);
        const lapisDepan = (s: string): string => s.slice(s.lastIndexOf('<g class="lapis-tangan">'));
        if (duduk(pose)) assert.equal(lapisDepan(varian.svg), lapisDepan(dasar.svg), `${pose}/${pandang}: lapis tangan`);
        assert.equal(varian.diAtasMeja, dasar.diAtasMeja, `${pose}/${pandang}: diAtasMeja`);
        assert.deepEqual(varian.tangan, dasar.tangan, `${pose}/${pandang}: titik tangan`);
        // jumlah elemen hampir sama (hanya mulut/mata berganti; mata tertutup lebih sederhana)
        const n = (s: string): number => (s.match(/</g) ?? []).length;
        assert.ok(Math.abs(n(varian.svg) - n(dasar.svg)) <= 40, `${pose}/${pandang}: jumlah elemen`);
      }
    }
  }
});

test('aturan potret: <= 52 px jendela kecil (kontrak dinaikkan 6) + kecil, <= 36 px mini; 53–75 px jendela sedang + kecil; 76+ px V3 normal', () => {
  assert.equal(POTRET_KECIL_MAKS_PX, 52);
  // jendela kecil Miss Raksa = kontrak bersama dengan x & sisi SAMA (skala wajah sama dengan Bu Rina), hanya naik 6
  const K = JENDELA_POTRET_KECIL;
  assert.deepEqual(JENDELA_POTRET_KECIL_MR, { x: K.x, y: K.y - 6, sisi: K.sisi });
  for (const uk of [28, 32, 44, 52]) {
    const a = aturanPotret(uk);
    assert.deepEqual(a.jendela, JENDELA_POTRET_KECIL_MR, `${uk}`);
    assert.equal(a.kecil, true, `${uk}`);
    assert.equal(a.mini, uk <= POTRET_MINI_MAKS_PX, `${uk} mini`);
    const { x, y, sisi }: { x: number; y: number; sisi: number } = JENDELA_POTRET_KECIL_MR;
    const p = potretMissRaksa({ ekspresi: 'tersenyum', ukuran: uk, id: `k${uk}` });
    assert.equal(p.viewBox, `${x} ${y} ${sisi} ${sisi}`);
    periksaDokumen(p.svg, `k${uk}`, `potret ${uk}`);
  }
  for (const uk of [53, 56, 64, 75]) assert.deepEqual(aturanPotret(uk), { jendela: JENDELA_POTRET_SEDANG, kecil: true, mini: false }, `${uk}`);
  for (const uk of [76, 96, 150]) assert.deepEqual(aturanPotret(uk), { jendela: JENDELA_POTRET_V3, kecil: false, mini: false }, `${uk}`);
  // kepala di tengah setiap jendela (wajah tidak terpotong lingkaran); jendela sedang: kepala ± 65–70 % lingkaran
  for (const J of [JENDELA_POTRET_KECIL_MR, JENDELA_POTRET_SEDANG]) {
    assert.ok(Math.abs(KANVAS_DUDUK.kepala.x - (J.x + J.sisi / 2)) <= 12);
    assert.ok(Math.abs(KANVAS_DUDUK.kepala.y - (J.y + J.sisi / 2)) <= 12);
  }
  const isi = KEPALA_TINGGI / JENDELA_POTRET_SEDANG.sisi;
  assert.ok(isi >= 0.62 && isi <= 0.72, `kepala mengisi ${isi.toFixed(2)} jendela sedang`);
  // 5 wajah tetap berbeda pada potret kecil & mini; raut mini berbeda dari raut kecil biasa (prihatin dilebihkan)
  for (const uk of [28, 32, 44]) {
    assert.equal(new Set(['netral', 'tersenyum', 'cemas', 'serius', 'lega'].map((e) => potretMissRaksa({ ekspresi: e as 'netral', ukuran: uk, id: 'z' }).svg)).size, 5, `${uk}`);
  }
  assert.notEqual(potretMissRaksa({ ekspresi: 'cemas', ukuran: 32, id: 'z' }).svg, potretMissRaksa({ ekspresi: 'cemas', ukuran: 44, id: 'z' }).svg);
  // API publik gambarMissRaksa tidak berubah: kecil tanpa mini = SVG potret 44 px
  assert.equal(potretMissRaksa({ ekspresi: 'cemas', ukuran: 44, id: 'z' }).svg, gambarMissRaksa({ pose: 'duduk-dengar', ekspresi: 'cemas', pandang: 'pemain', kecil: true, id: 'z' }).svg);
});

test('potret per salinan: gambar TANPA id (satu entri cache) lalu awalanId → id unik per salinan, rujukan utuh', () => {
  // PotretMissRaksa tidak lagi meneruskan id per pemasangan ke generator (kunci cache memuat id → heap naik terus)
  const src = fs.readFileSync(path.join(import.meta.dirname, 'PotretMissRaksa.tsx'), 'utf8');
  assert.match(src, /potretMissRaksa\(\{ ekspresi, ukuran, pandang \}\)/, 'potret dibuat tanpa id');
  assert.match(src, /awalanId\(r\.svg, id\)/, 'awalan per salinan lewat awalanId');
  assert.match(src, /useId\(\)/, 'awalan dari useId');
  for (const uk of [28, 32, 44, 52, 56, 96]) {
    const dasar = potretMissRaksa({ ekspresi: 'cemas', ukuran: uk });
    // hasil tanpa id = hasil yang sama (dari cache), id bawaan 'mr'
    assert.equal(potretMissRaksa({ ekspresi: 'cemas', ukuran: uk }).svg, dasar.svg, `${uk}: deterministik`);
    periksaDokumen(dasar.svg, 'mr', `potret ${uk} tanpa id`);
    const a = awalanId(dasar.svg, 'pmrA');
    const b = awalanId(dasar.svg, 'pmrB');
    periksaDokumen(a, 'pmrA', `potret ${uk} salinan A`);
    periksaDokumen(b, 'pmrB', `potret ${uk} salinan B`);
    const idA = new Set(ids(a));
    for (const i of ids(b)) assert.ok(!idA.has(i), `${uk}: id bentrok antarsalinan ${i}`);
    // awalan hanya mengganti id & rujukan: gambar sama persis dengan pemanggilan ber-id lama
    assert.equal(a.replaceAll('pmrA-mr-', 'X-'), potretMissRaksa({ ekspresi: 'cemas', ukuran: uk, id: 'Y' }).svg.replaceAll('Y-', 'X-'));
  }
});

/** Titik (ujung & kendali) sebuah path SVG dalam koordinat mutlak (M/L/H/V/C/S/Q/Z, besar & kecil). */
function titikPath(d: string): [number, number][] {
  const tok = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const hasil: [number, number][] = [];
  let x = 0, y = 0, x0 = 0, y0 = 0, cmd = 'M';
  const n = (): number => Number(tok[i++]);
  let i = 0;
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i]!)) cmd = tok[i++]!;
    const rel = cmd === cmd.toLowerCase();
    const bx = rel ? x : 0, by = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'Z':
        x = x0;
        y = y0;
        continue;
      case 'H':
        x = bx + n();
        break;
      case 'V':
        y = by + n();
        break;
      default: {
        const jml = { M: 1, L: 1, C: 3, S: 2, Q: 2 }[cmd.toUpperCase() as 'M'] ?? 1;
        for (let j = 0; j < jml; j++) {
          const p: [number, number] = [bx + n(), by + n()];
          hasil.push(p);
          if (j === jml - 1) [x, y] = p;
        }
        if (cmd.toUpperCase() === 'M') {
          [x0, y0] = [x, y];
          cmd = rel ? 'l' : 'L';
        }
        continue;
      }
    }
    hasil.push([x, y]);
  }
  return hasil;
}

test('mata tetap punya iris + sorot di setiap wajah & pandang (juga lega/senyum + pandang bawah, versi normal & kecil)', () => {
  for (const pose of ['duduk-dengar', 'duduk-tunjuk', 'berdiri-sambut'] as const) {
    for (const ekspresi of ['netral', 'tersenyum', 'cemas', 'serius', 'lega'] as const) {
      for (const pandang of PANDANG) {
        for (const kecil of [false, true]) {
          const svg = gambarMissRaksa({ pose, ekspresi, pandang, kecil, id: 's' }).svg;
          const konteks = `${pose}/${ekspresi}/${pandang}/${kecil ? 'kecil' : 'normal'}`;
          assert.equal((svg.match(/fill="#fff6ee"/g) ?? []).length, 2, `${konteks}: dua sorot mata`);
          // sorot berada di dalam bukaan mata (kotak batas klip bukaan), tidak di atas garis kelopak
          for (const m of svg.matchAll(/<clipPath id="s-km[dj]"><path d="([^"]+)"\/><\/clipPath><g clip-path="url\(#s-km[dj]\)">(.*?)<\/g>/g)) {
            const tp = titikPath(m[1]!);
            const sorot = /<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)" fill="#fff6ee"/.exec(m[2]!);
            assert.ok(sorot, `${konteks}: sorot di dalam klip mata`);
            const cx = Number(sorot![1]), cy = Number(sorot![2]), r = Number(sorot![3]);
            // kelopak atas di sekitar x sorot = titik bukaan tertinggi dalam ± 2,5 satuan mendatar
            const dekat = tp.filter(([x]) => Math.abs(x - cx) <= 2.5).map(([, y]) => y);
            assert.ok(dekat.length > 1, `${konteks}: titik bukaan di sekitar sorot`);
            assert.ok(cy - r >= Math.min(...dekat) - 0.2, `${konteks}: sorot tertutup kelopak (sorot ${cy} r ${r}, kelopak ${Math.min(...dekat)})`);
            assert.ok(cy + r <= Math.max(...dekat) + 0.2, `${konteks}: sorot di bawah kelopak bawah (${cy})`);
          }
        }
      }
    }
  }
});

test('potret: jendela JENDELA_POTRET_V3 dari pose duduk, versi kecil berbeda', () => {
  const p = potretMissRaksa({ ekspresi: 'netral', id: 'pt' });
  const J = JENDELA_POTRET_V3;
  assert.equal(p.viewBox, `${J.x} ${J.y} ${J.sisi} ${J.sisi}`);
  periksaDokumen(p.svg, 'pt', 'potret');
  // kepala pose duduk berada di tengah jendela
  assert.ok(Math.abs(KANVAS_DUDUK.kepala.x - (J.x + J.sisi / 2)) <= 12);
  assert.ok(Math.abs(KANVAS_DUDUK.kepala.y - (J.y + J.sisi / 2)) <= 12);
  assert.notEqual(potretMissRaksa({ ekspresi: 'netral', kecil: true, id: 'pt' }).svg, p.svg);
});
