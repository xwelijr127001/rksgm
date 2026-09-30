/**
 * Uji generator Bu Rina v3 (seni/tokoh/buRina.ts): semua pose × ekspresi × pandang × bicara/kedip/kecil/kunci
 * menghasilkan SVG sah (tanpa NaN), kanvas & jangkar kontrak (ukuran.ts), id berawalan opsi.id dan semua rujukan
 * url(#…) terpenuhi, versi polos tanpa id, deterministik, delapan wajah benar-benar berbeda, gestur mengikuti
 * ekspresi, hadap kanan (berdiri/jalan/pergi) tanpa cermin CSS dengan kunci tetap di tangan kiri anatomis, celemek krem
 * bertepi jingga di semua pose (identitas katering), condong duduk 10-12°, langkah jalan naik-turun, tangan berjari,
 * bingkai antara duduk-turun (kanvas berdiri, pinggul setengah turun, tangan meraih), dan bayang kontak duduk kecil.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DAFTAR_EKSPRESI, type ArahPandang, type PoseNasabah } from '../../tipe';
import { KANVAS_BERDIRI, KANVAS_DUDUK } from './ukuran';
import {
  ID_BAWAAN_RINA,
  PINGGUL_BERDIRI,
  PINGGUL_TURUN,
  gambarBuRina,
  gambarBuRinaPolos,
  gesturUntuk,
  kanvasPoseRina,
  menghadapKanan,
  titikTurunRina,
} from './buRina';
import { JENIS_POSE_NASABAH } from '../../ui/adegan';

const POSE: PoseNasabah[] = ['berdiri', 'jalan-a', 'jalan-b', 'duduk-turun', 'duduk', 'duduk-condong', 'telepon', 'berdiri-pergi'];
const PANDANG: ArahPandang[] = ['lawan', 'pemain', 'bawah', 'depan'];
/** Kanvas duduk (jangkar = pinggul). duduk-turun memakai kanvas BERDIRI (jangkar = telapak). */
const duduk = (p: PoseNasabah): boolean => kanvasPoseRina(p) === 'duduk';

test('setiap pose tipe.ts PoseNasabah digambar sendiri (bukan jatuh ke pose lain)', () => {
  assert.deepEqual([...POSE].sort(), Object.keys(JENIS_POSE_NASABAH).sort(), 'daftar uji = semua pose');
  const svg = POSE.map((pose) => gambarBuRina({ pose, ekspresi: 'netral', id: 'p' }).svg);
  assert.equal(new Set(svg).size, POSE.length);
});

test('semua kombinasi: SVG sah, kanvas & jangkar kontrak, id berawalan, rujukan terpenuhi', () => {
  for (const pose of POSE) {
    for (const ekspresi of DAFTAR_EKSPRESI) {
      for (const pandang of PANDANG) {
        for (const [bicara, kedip, kecil, kunci] of [[false, false, false, false], [true, false, false, true], [false, true, true, true]] as const) {
          const g = gambarBuRina({ pose, ekspresi, pandang, bicara, kedip, kecil, kunci, id: 'uji7' });
          const K = duduk(pose) ? KANVAS_DUDUK : KANVAS_BERDIRI;
          const nama = `${pose}/${ekspresi}/${pandang}/${bicara ? 'b' : ''}${kedip ? 'k' : ''}${kecil ? 'c' : ''}`;
          assert.equal(g.w, K.w, nama);
          assert.equal(g.h, K.h, nama);
          assert.deepEqual(g.jangkar, K.jangkar, nama);
          assert.ok(!/NaN|undefined|Infinity/.test(g.svg), `${nama}: angka rusak`);
          assert.ok(!/<filter|<image|<text|clip-path|<clipPath/.test(g.svg), `${nama}: tanpa filter, raster, teks, atau klip`);
          const ids = [...g.svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
          for (const idn of ids) assert.ok(idn.startsWith('uji7-'), `${nama}: id tanpa awalan ${idn}`);
          assert.equal(new Set(ids).size, ids.length, `${nama}: id ganda`);
          const ada = new Set(ids);
          for (const [, ref] of g.svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ada.has(ref), `${nama}: rujukan hilang ${ref}`);
          // kepala di dalam kanvas & dekat pusat kepala kontrak (condong 11° dari pinggul: kepala ± 80 ke arah meja;
          // duduk-turun: badan turun ± 84 bersama pinggul)
          const turunY = pose === 'duduk-turun' ? PINGGUL_TURUN.y - PINGGUL_BERDIRI.y : 0;
          assert.ok(Math.abs(g.kepala.x - K.kepala.x) <= (pose === 'duduk-condong' ? 95 : pose === 'duduk-turun' ? 20 : 12), `${nama}: kepala x ${g.kepala.x}`);
          assert.ok(Math.abs(g.kepala.y - turunY - K.kepala.y) <= 14, `${nama}: kepala y ${g.kepala.y}`);
          for (const t of [g.tangan?.kiri, g.tangan?.kanan]) {
            if (t) assert.ok(t.x >= 0 && t.x <= K.w && t.y >= 0 && t.y <= K.h, `${nama}: tangan di luar kanvas`);
          }
          assert.ok(g.svg.length < 63_000, `${nama}: ukuran ${g.svg.length} B`);
        }
      }
    }
  }
});

test('id bawaan berawalan, deterministik, dan cache mengembalikan salinan', () => {
  const a = gambarBuRina({ pose: 'duduk', ekspresi: 'netral' });
  const b = gambarBuRina({ pose: 'duduk', ekspresi: 'netral' });
  assert.equal(a.svg, b.svg);
  for (const [, idn] of a.svg.matchAll(/\bid="([^"]+)"/g)) assert.ok(idn.startsWith(`${ID_BAWAAN_RINA}-`));
  a.jangkar.x = -1;
  a.kepala.y = -1;
  const c = gambarBuRina({ pose: 'duduk', ekspresi: 'netral' });
  assert.equal(c.jangkar.x, KANVAS_DUDUK.jangkar.x, 'mengubah hasil tidak merusak cache');
  assert.notEqual(c.kepala.y, -1);
});

test('versi polos: tanpa id, gradien, atau rujukan url (aman disisipkan inline berulang)', () => {
  for (const e of DAFTAR_EKSPRESI) {
    for (const kecil of [false, true]) {
      const s = gambarBuRinaPolos({ pose: 'berdiri', ekspresi: e, kunci: true, kecil }).svg;
      assert.ok(!/\bid="|url\(|<defs|Gradient|clipPath|<text|<image/.test(s), `${e}${kecil ? ' kecil' : ''}`);
    }
  }
});

test('delapan ekspresi = delapan wajah berbeda; bicara/kedip/pandang mengubah wajah', () => {
  const svg = (e: (typeof DAFTAR_EKSPRESI)[number], o: object = {}) => gambarBuRina({ pose: 'duduk', ekspresi: e, pandang: 'lawan', id: 'w', ...o }).svg;
  assert.equal(new Set(DAFTAR_EKSPRESI.map((e) => svg(e))).size, 8, 'stage');
  assert.equal(new Set(DAFTAR_EKSPRESI.map((e) => svg(e, { kecil: true }))).size, 8, 'potret kecil');
  assert.notEqual(svg('netral'), svg('netral', { bicara: true }));
  assert.notEqual(svg('netral'), svg('netral', { kedip: true }));
  assert.notEqual(svg('netral'), svg('netral', { pandang: 'pemain' }));
  assert.notEqual(svg('netral'), svg('netral', { pandang: 'bawah' }));
});

test('gestur tangan ikut ekspresi (bukan simbol); pose menentukan gestur khusus', () => {
  assert.equal(gesturUntuk('duduk', 'kesal'), 'silang');
  assert.equal(gesturUntuk('duduk', 'cemas'), 'genggam');
  assert.equal(gesturUntuk('duduk', 'bingung'), 'dagu');
  assert.equal(gesturUntuk('duduk', 'lega'), 'dada');
  assert.equal(gesturUntuk('duduk', 'senang'), 'tepuk');
  assert.equal(gesturUntuk('duduk', 'netral'), 'pangkuan');
  assert.equal(gesturUntuk('berdiri', 'netral'), 'kunci');
  assert.equal(gesturUntuk('duduk-condong', 'serius'), 'meja');
  assert.equal(gesturUntuk('jalan-a', 'kesal'), 'jalan-a');
  assert.equal(gesturUntuk('telepon', 'lega'), 'telepon');
  // tangan benar-benar pindah: titik tangan berbeda antara netral & kesal
  const n = gambarBuRina({ pose: 'duduk', ekspresi: 'netral', id: 'g' }).tangan!;
  const k = gambarBuRina({ pose: 'duduk', ekspresi: 'kesal', id: 'g' }).tangan!;
  assert.notDeepEqual(n, k);
});

/** x awal path remote kunci (isi #2b2a2e) di SVG, atau null. */
function xRemote(svg: string): number | null {
  const m = /<path d="M(-?[\d.]+)[ -][^"]*" fill="#2b2a2e"/.exec(svg);
  return m ? Number(m[1]) : null;
}

test('jalan dua langkah berbeda; hadap kanan tanpa cermin CSS: kunci tetap di tangan kiri anatomis (kanan layar)', () => {
  const a = gambarBuRina({ pose: 'jalan-a', ekspresi: 'netral', kunci: true, id: 'j' });
  const b = gambarBuRina({ pose: 'jalan-b', ekspresi: 'netral', kunci: true, id: 'j' });
  assert.notEqual(a.svg, b.svg);
  assert.notDeepEqual(a.tangan, b.tangan, 'lengan mengayun bergantian');
  // badan naik-turun 1-2 satuan antar langkah (kepala ikut badan)
  const bob = Math.abs(a.kepala.y - b.kepala.y);
  assert.ok(bob >= 1 && bob <= 2, `naik-turun ${bob}`);
  // kombinasi yang didukung: berdiri, jalan-a, jalan-b (+ berdiri-pergi selalu kanan); pose duduk & duduk-turun
  // mengabaikan hadap
  for (const p of ['berdiri', 'jalan-a', 'jalan-b'] as const) assert.ok(menghadapKanan(p, 'kanan') && !menghadapKanan(p, 'kiri') && !menghadapKanan(p));
  assert.ok(menghadapKanan('berdiri-pergi') && menghadapKanan('berdiri-pergi', 'kiri'));
  for (const p of ['duduk-turun', 'duduk', 'duduk-condong', 'telepon'] as const) {
    assert.ok(!menghadapKanan(p, 'kanan'));
    assert.equal(gambarBuRina({ pose: p, ekspresi: 'netral', hadap: 'kanan', id: 'd' }).svg, gambarBuRina({ pose: p, ekspresi: 'netral', id: 'd' }).svg, `${p}: hadap diabaikan`);
  }
  const W2 = KANVAS_BERDIRI.w / 2;
  for (const pose of ['berdiri', 'jalan-a', 'jalan-b', 'berdiri-pergi'] as const) {
    for (const e of ['netral', 'kesal', 'lega', 'cemas'] as const) {
      const kiri = gambarBuRina({ pose, ekspresi: e, kunci: true, id: 'h' });
      const kanan = gambarBuRina({ pose, ekspresi: e, kunci: true, hadap: 'kanan', id: 'h' });
      const nama = `${pose}/${e}`;
      assert.ok(!/scale\(-1|matrix\(-1/.test(kanan.svg), `${nama}: tanpa transform cermin`);
      // kepala digambar ulang (menoleh), letaknya cermin letak kepala menghadap kiri
      if (pose !== 'berdiri-pergi') assert.ok(Math.abs(kanan.kepala.x - (KANVAS_BERDIRI.w - kiri.kepala.x)) < 0.5, `${nama}: kepala`);
      // tangan pemegang kunci = tangan.kanan layar di kedua arah; remote kunci di kanan layar
      if (pose !== 'berdiri-pergi' && (e === 'netral' || pose.startsWith('jalan'))) {
        assert.ok(kiri.tangan!.kanan!.x > W2, `${nama} kiri: tangan kunci di kanan layar`);
        assert.ok((xRemote(kiri.svg) ?? 0) > W2 - 40, `${nama} kiri: remote ${xRemote(kiri.svg)}`);
      }
      assert.ok(kanan.tangan!.kanan!.x > W2, `${nama} kanan: tangan kunci (tangan jauh) di kanan layar`);
      assert.ok((xRemote(kanan.svg) ?? 0) > W2, `${nama} kanan: remote di kanan layar ${xRemote(kanan.svg)}`);
    }
  }
  const pergi = gambarBuRina({ pose: 'berdiri-pergi', ekspresi: 'netral', kunci: true, id: 'p' });
  assert.equal(pergi.svg, gambarBuRina({ pose: 'berdiri-pergi', ekspresi: 'netral', kunci: true, hadap: 'kanan', id: 'p' }).svg, 'berdiri-pergi selalu kanan');
  const berdiri = gambarBuRina({ pose: 'berdiri', ekspresi: 'netral', kunci: true, id: 'p' });
  const FOB = '#2b2a2e';
  assert.ok(berdiri.svg.includes(FOB), 'kunci di tangan');
  assert.ok(!gambarBuRina({ pose: 'berdiri', ekspresi: 'netral', id: 'p' }).svg.includes(FOB), 'tanpa kunci');
  assert.ok(gambarBuRina({ pose: 'telepon', ekspresi: 'netral', id: 't' }).svg.includes('#2b2f36'), 'telepon genggam');
});

test('celemek krem bertepi & bertali jingga di SEMUA pose (identitas katering), juga versi kecil & polos', () => {
  const JINGGA = '#e8833a';
  for (const pose of POSE) {
    for (const hadap of ['kiri', 'kanan'] as const) {
      for (const kecil of [false, true]) {
        const g = gambarBuRina({ pose, ekspresi: 'netral', hadap, kecil, id: 'c' });
        const nama = `${pose}/${hadap}${kecil ? '/kecil' : ''}`;
        // gradien celemek (terang = krem identitas) dipakai sebuah bentuk, lis/tali jingga ada
        assert.match(g.svg, /id="c-clm"[^>]*><stop offset="0" stop-color="#f4e4c4"/, `${nama}: gradien krem`);
        assert.ok(g.svg.includes('fill="url(#c-clm)"'), `${nama}: bentuk celemek`);
        assert.ok(g.svg.includes(JINGGA), `${nama}: tepi & tali jingga`);
      }
    }
  }
  const polos = gambarBuRinaPolos({ pose: 'duduk', ekspresi: 'netral' }).svg;
  assert.ok(!polos.includes('url(') && polos.includes(JINGGA), 'versi polos: warna datar');
});

test('duduk: celemek kain tipis di pangkuan (bukan bantal), condong 10-12° dari pinggul, kaki lebih pendek', () => {
  const d = gambarBuRina({ pose: 'duduk', ekspresi: 'netral', id: 'v' });
  const c = gambarBuRina({ pose: 'duduk-condong', ekspresi: 'lega', kunci: true, id: 'v' });
  // kepala berputar di pinggul (230,560): 10-12° → geser x = 410·sin(sudut) ≈ 71-85
  const sudut = Math.atan2(d.kepala.x - c.kepala.x, KANVAS_DUDUK.jangkar.y - c.kepala.y) * (180 / Math.PI);
  assert.ok(sudut >= 9.5 && sudut <= 12.5, `condong ${sudut.toFixed(1)}°`);
  // kunci di tangan saat bersiap pergi, tangan di depan badan (ke arah meja)
  assert.ok(c.svg.includes('#2b2a2e'), 'kunci di tangan');
  assert.ok(c.tangan!.kiri!.x < d.tangan!.kiri!.x, 'tangan maju ke meja');
  // celemek duduk: tanpa pita bayang tepi melingkar (pitaTepi) yang membuatnya menggembung — hanya satu bentuk celemek
  assert.equal((d.svg.match(/fill="url\(#v-clm\)"/g) ?? []).length, 1, 'satu panel celemek di pangkuan');
  // bayang kontak di dudukan KECIL, tepat di bawah pinggul (ruang-3: elips lebar menjalar ke sisi kursi = pita gelap
  // di tepi bawah panggung): berakhir di x <= 350 kanvas, pusat di antara pinggul (230) & bokong (± 331)
  const m = /<ellipse cx="([\d.]+)" cy="(5\d\d(?:\.\d)?)" rx="([\d.]+)" ry="([\d.]+)" fill="#2a1a12" fill-opacity="0\.25"\/>/.exec(d.svg);
  assert.ok(m, 'bayang kontak dudukan ada');
  const [cx, cy, rx, ry] = m!.slice(1).map(Number);
  assert.ok(cx + rx <= 350 && cx - rx >= 180, `bayang dudukan x ${cx - rx}..${cx + rx}`);
  assert.ok(cy >= 570 && cy <= 590 && ry <= 12, `bayang dudukan y ${cy} ry ${ry}`);
  // telapak di lantai yang lebih tinggi (lutut → telapak ± 257, bukan ± 310)
  assert.match(d.svg, /<ellipse cx="106\.3" cy="824"/);
});

test('duduk-turun: bingkai antara berdiri ↔ duduk di kanvas berdiri (telapak di jangkar), pinggul setengah turun', () => {
  assert.equal(kanvasPoseRina('duduk-turun'), 'berdiri', 'jangkar = telapak, BUKAN pinggul (startsWith("duduk") keliru)');
  assert.equal(kanvasPoseRina('duduk'), 'duduk');
  assert.equal(kanvasPoseRina('telepon'), 'duduk');
  assert.equal(kanvasPoseRina('jalan-a'), 'berdiri');
  const b = gambarBuRina({ pose: 'berdiri', ekspresi: 'netral', kunci: true, id: 't' });
  for (const e of DAFTAR_EKSPRESI) {
    const t = gambarBuRina({ pose: 'duduk-turun', ekspresi: e, kunci: true, id: 't' });
    assert.deepEqual(t.jangkar, KANVAS_BERDIRI.jangkar, e);
    assert.equal(gesturUntuk('duduk-turun', e), 'raih', `${e}: tangan meraih (ekspresi di wajah)`);
    // kepala turun bersama badan (± 84), tetap di atas telapak (badan condong sedikit, bukan jatuh ke belakang)
    const turun = t.kepala.y - b.kepala.y;
    assert.ok(turun >= 70 && turun <= 100, `${e}: kepala turun ${turun}`);
    // kedua tangan lebih rendah dari tangan berdiri (meraih ke lutut / kursi) dan di depan pinggul (kiri)
    for (const k of [t.tangan!.kiri!, t.tangan!.kanan!]) {
      assert.ok(k.y > 540 && k.x < PINGGUL_TURUN.x, `${e}: tangan ${k.x},${k.y}`);
    }
    // identitas tetap: celemek krem & kunci di tangan (opsi kunci dihormati)
    assert.ok(t.svg.includes('fill="url(#t-clm)"') && t.svg.includes('#2b2a2e'), e);
  }
  assert.ok(!gambarBuRina({ pose: 'duduk-turun', ekspresi: 'netral', id: 't' }).svg.includes('#2b2a2e'), 'tanpa kunci');
  // pinggul setengah turun (± 84 dari berdiri; berdiri → duduk di panggung ± 164) & mundur di atas telapak
  assert.ok(PINGGUL_TURUN.y - PINGGUL_BERDIRI.y >= 70 && PINGGUL_TURUN.y - PINGGUL_BERDIRI.y <= 100);
  assert.ok(PINGGUL_TURUN.x > KANVAS_BERDIRI.jangkar.x + 30, 'duduk ke belakang: pinggul di belakang telapak');
  // titik panggung: pinggul tepat di tengah pinggul berdiri & pinggul duduk; telapak tetap di lantai berdiri
  const berdiri = { x: 1150, y: 1031 }, dudukT = { x: 1060, y: 757 }, s = 1.05;
  const j = titikTurunRina(berdiri, dudukT, s);
  const pinggulTurun = { x: j.x + (PINGGUL_TURUN.x - 210) * s, y: j.y + (PINGGUL_TURUN.y - 985) * s };
  const pinggulBerdiri = { x: berdiri.x + (PINGGUL_BERDIRI.x - 210) * s, y: berdiri.y + (PINGGUL_BERDIRI.y - 985) * s };
  assert.ok(Math.abs(pinggulTurun.x - (pinggulBerdiri.x + dudukT.x) / 2) < 0.01 && Math.abs(pinggulTurun.y - (pinggulBerdiri.y + dudukT.y) / 2) < 0.01);
  assert.ok(Math.abs(j.y - berdiri.y) <= 8, `telapak di lantai: ${j.y}`);
  assert.ok(j.x < berdiri.x && j.x > dudukT.x - 60, `telapak di antara tempat berdiri & kursi: ${j.x}`);
});

test('bersedekap (kesal): tangan jauh terselip dengan ujung jari tampak, bukan ujung lengan runcing', () => {
  for (const pose of ['duduk', 'berdiri'] as const) {
    const n = (gambarBuRina({ pose, ekspresi: 'kesal', id: 's' }).svg.match(/fill="url\(#s-tgn\)"/g) ?? []).length;
    // tangan dekat utuh (punggung tangan + 4 jari + ibu jari) + 3 ujung jari tangan jauh
    assert.ok(n >= 9, `${pose}: bentuk kulit ${n}`);
  }
});

test('tangan berjari (bukan sarung tangan)', () => {
  // dua tangan rebah di pangkuan = 2 × (punggung tangan + 4 jari + ibu jari) bentuk kulit bergradien
  const n = (gambarBuRina({ pose: 'duduk', ekspresi: 'netral', id: 'c' }).svg.match(/fill="url\(#c-tgn\)"/g) ?? []).length;
  assert.ok(n >= 12, `bentuk tangan/jari: ${n}`);
});

test('versi kecil menebalkan garis (terbaca di potret 32–52 px)', () => {
  const tebal = (s: string) => Math.max(...[...s.matchAll(/stroke-width="([\d.]+)"/g)].map((m) => Number(m[1])));
  const biasa = gambarBuRina({ pose: 'duduk', ekspresi: 'cemas', id: 'k' }).svg;
  const kecil = gambarBuRina({ pose: 'duduk', ekspresi: 'cemas', kecil: true, id: 'k' }).svg;
  assert.ok(tebal(kecil) > tebal(biasa) * 1.5, `${tebal(kecil)} vs ${tebal(biasa)}`);
  assert.ok(kecil.length < biasa.length, 'versi kecil lebih sederhana');
});
