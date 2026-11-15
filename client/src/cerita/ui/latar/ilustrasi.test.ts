/**
 * Tes ILUSTRASI panggung latar (murni): pilihan resolusi, potongan kamera kantor per kelas layar, tokoh di balik meja
 * kantor Episode 2, lokasi lapangan (tokoh berdiri menurut perspektif, truk trailer berkedalaman, papan & rambu kode,
 * kamera mengikuti subjek dan tidak menaruh kepala/papan di bawah label lokasi), aset polisi vs petugas tol, validator.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { EPISODE_AUTO_2 as EP } from '../../episode/auto-2/episode';
import { KANTOR_AUTO_2 as KANTOR, POOL_AUTO_2 as POOL, TOKOH_AUTO_2 as TOKOH } from '../../seni/auto-2/ilustrasi';
import type { CueLatar, Episode, IdPembicara, LokasiIlustrasi } from '../../tipe';
import { validasiEpisode } from '../../validasi';
import {
  BINGKAI_BICARA, RUANG_SUBJEK, asetTokoh, kaburLatar, avatarTokoh, dekatTokoh, kelasLayar, kotakBerdiri, kotakTokohIlustrasi, letakBerdiri, pilihVarian,
  potonganIlustrasi, potonganSubjek, srcsetDari, type Kotak,
} from './ilustrasi';

const v = [{ w: 160, h: 160, src: 'a' }, { w: 320, h: 320, src: 'b' }];
/**
 * Kotak panggung (px CSS): HP 360/390/430 dengan tinggi panggung adaptif (AdeganTatap tinggiPanggung: tinggi 4:3, sedang
 * 16:10, pendek 2:1) & desktop (16:9); kartu episode HP & desktop (hanya sampul).
 */
const KOTAK_HP = [[332, 249], [362, 272], [402, 302], [332, 208], [362, 226], [402, 251], [332, 166], [362, 181], [402, 201]] as const;
const KOTAK = [...KOTAK_HP, [776, 437]] as const;
/** Pita bawah yang ditumpangi kotak dialog pada bidikan dekat / saat bicara (AdeganTatap TUMPANG_DIALOG). */
const TUMPANG = 22;
const KOTAK_KARTU = [[356, 150], [280, 238]] as const;
/** Pita label lokasi (px CSS) yang dipakai PanggungLatar. */
const PITA = 38;

test('pilihVarian: terkecil yang cukup, terbesar bila tak ada yang cukup; srcset berdeskriptor lebar', () => {
  assert.equal(pilihVarian(v, 150).src, 'a');
  assert.equal(pilihVarian(v, 161).src, 'b');
  assert.equal(pilihVarian(v, 2000).src, 'b');
  assert.equal(pilihVarian([...v].reverse(), 100).src, 'a', 'urutan masukan tidak berpengaruh');
  assert.equal(srcsetDari(v), 'a 160w, b 320w');
});

test('potonganIlustrasi: rasio = kotak panggung, selalu di dalam gambar; HP lebih dekat dari layar lebar', () => {
  for (const [w, h] of [[336, 189], [366, 206], [406, 228], [820, 461], [1280, 400], [300, 600]] as const) {
    const p = potonganIlustrasi(KANTOR, w, h);
    assert.ok(p.x >= 0 && p.y >= 0 && p.x + p.w <= KANTOR.w + 1e-6 && p.y + p.h <= KANTOR.h + 1e-6, `${w}x${h}: ${JSON.stringify(p)}`);
    assert.ok(Math.abs(p.w / p.h - w / h) < 1e-6, `${w}x${h}: rasio`);
  }
  assert.equal(kelasLayar(366), 'hp');
  assert.equal(kelasLayar(820), 'lebar');
  assert.ok(potonganIlustrasi(KANTOR, 366, 206).w < potonganIlustrasi(KANTOR, 820, 461).w, 'HP membingkai lebih dekat');
});

test('kantor: Miss Raksa & Pak Bima di balik meja; kepala terlihat di HP, potongan bawah gambar di bawah tepi meja', () => {
  const t = KANTOR.tokoh;
  assert.equal(t.jenis, 'dekat');
  if (t.jenis !== 'dekat') return;
  // Tepi jauh meja kaca (poligon lapisan depan) dari kiri ke sudut kanan: y meja di x.
  const yMeja = (x: number) => (x <= 1052 ? 666 + ((x - 425) / (1052 - 425)) * (604 - 666) : 604 + ((x - 1052) / (1558 - 1052)) * (760 - 604));
  const x = t.slot[1][0]!;
  const hp = potonganIlustrasi(KANTOR, 362, 272);
  for (const [id, e] of [['missRaksa', 'serius'], ['missRaksa', 'tersenyum'], ['bima', 'netral']] as const) {
    const g = dekatTokoh(EP, id, e)!;
    const k = kotakTokohIlustrasi(t, g, x);
    const kiri = k.x, kanan = k.x + k.w, bawah = k.y + k.h;
    assert.ok(bawah > Math.max(yMeja(Math.max(425, kiri)), yMeja(Math.min(1558, kanan))), `${id}/${e}: bawah ${bawah.toFixed(0)} di atas tepi meja`);
    assert.ok(t.atasKepala - hp.y >= 30, `${id}/${e}: ruang kepala HP`);
    assert.ok(k.x + g.kepala.cx * k.w > hp.x + 80 && k.x + g.kepala.cx * k.w < hp.x + hp.w - 80, `${id}/${e}: kepala di dalam bingkai HP`);
  }
  assert.ok((t.tinggiKepala * 362) / hp.w >= 80, 'kepala HP (visual novel) cukup besar');
  const b = KANTOR.objek!.berkas!;
  const seni = EP.seniArena![b.seni]!;
  const alas = b.y + (b.w * seni.h) / seni.w;
  assert.ok(alas > yMeja(b.x + b.w / 2) + 30, 'alas bundel di permukaan meja');
  assert.ok(b.x >= hp.x && b.x + b.w <= hp.x + hp.w && b.y >= hp.y && alas <= hp.y + hp.h, 'bundel terlihat utuh di HP');
});

test('kantor bidikan dekat (panggung HP 1:1, beat pendek): Miss Raksa memenuhi panggung, kepala utuh di bawah pita label; latar dikaburkan sesuai pembesaran', () => {
  const t = KANTOR.tokoh;
  if (t.jenis !== 'dekat') throw new Error('kantor dekat');
  for (const w of [332, 362, 402]) {
    const pot = potonganIlustrasi(KANTOR, w, w);
    assert.equal(Math.round(pot.w), KANTOR.bingkai.hpDekat!.lebar, `${w}: memakai bidikan dekat`);
    const g = dekatTokoh(EP, 'missRaksa', 'tersenyum')!;
    const k = kotakTokohIlustrasi(t, g, t.slot[1][0]!);
    const s = w / pot.w;
    assert.ok(t.tinggiKepala * s >= 130, `${w}: kepala ${(t.tinggiKepala * s).toFixed(0)} px`);
    assert.ok((t.atasKepala - pot.y) * s >= 38, `${w}: puncak kepala di bawah pita label`);
    const cx = k.x + g.kepala.cx * k.w;
    assert.ok(cx > pot.x + pot.w * 0.25 && cx < pot.x + pot.w * 0.75, `${w}: wajah di tengah panggung`);
    // Potret dekat cukup besar berkasnya: lebar tampil x DPR 3 <= berkas terbesar x 1,15 (tokoh tetap tajam).
    const tampil = k.w * s * 3;
    assert.ok(tampil <= Math.max(...g.varian.map((v) => v.w)) * 1.15, `${w}: potret ${tampil.toFixed(0)} px vs berkas ${Math.max(...g.varian.map((v) => v.w))}`);
  }
  assert.equal(potonganIlustrasi(KANTOR, 362, 272).w, KANTOR.bingkai.hp.lebar, '4:3 = bidikan HP biasa');
  assert.equal(kaburLatar(1.3), 0);
  assert.ok(kaburLatar(2.1) > 1 && kaburLatar(2.1) <= 2.5);
  assert.equal(kaburLatar(9), 2.5);
});

/** Komposisi lapangan yang dipakai naskah: cue node & baris (lokasi dari cue, node-nya, atau titik induk node akibat) + sampul. */
function komposisiLapangan(): { lokasi: string; hadir: IdPembicara[]; objek: string[]; sampul?: boolean }[] {
  const hasil = new Map<string, { lokasi: string; hadir: IdPembicara[]; objek: string[]; sampul?: boolean }>();
  const tambah = (c: CueLatar | undefined, induk: CueLatar | undefined, titik?: CueLatar) => {
    const lokasi = c?.lokasi ?? induk?.lokasi ?? titik?.lokasi;
    const hadir = c?.hadir ?? induk?.hadir;
    if (!lokasi || !hadir || lokasi === 'kantor') return;
    const objek = c?.objek ?? induk?.objek ?? [];
    hasil.set(`${lokasi}:${hadir.join(',')}:${objek.join(',')}`, { lokasi, hadir, objek });
  };
  for (const n of Object.values(EP.node)) {
    const titik = EP.node[n.id.split('-')[0]!]?.tata;
    tambah(n.tata, undefined, titik);
    if (n.jenis === 'cabang') continue;
    const baris = [...n.baris, ...(n.jenis === 'aktivitas' ? n.hasil.flatMap((h) => h.umpanBalik ?? []) : [])];
    for (const b of baris) tambah(b.tata, n.tata, titik);
  }
  const sp = EP.latar!.sampul;
  hasil.set('sampul', { lokasi: sp.lokasi, hadir: sp.hadir, objek: [], sampul: true });
  return [...hasil.values()];
}

const dalam = (k: Kotak, p: Kotak, toleransi = 1) => k.x >= p.x - toleransi && k.y >= p.y - toleransi && k.x + k.w <= p.x + p.w + toleransi && k.y + k.h <= p.y + p.h + toleransi;

test('lapangan: tiap komposisi naskah di HP 360/390/430, desktop, kartu: narasi = tokoh utuh & menapak; bicara = setengah badan; kepala/papan di bawah pita label, kepala truk utuh', () => {
  const daftar = komposisiLapangan();
  // Semua lokasi lapangan ikut teruji, termasuk tiga saksi bersama polisi.
  assert.deepEqual([...new Set(daftar.map((k) => k.lokasi))].sort(), ['bengkel', 'pool', 'tol', 'wawancara']);
  assert.ok(daftar.some((k) => k.hadir.includes('polisi') && k.hadir.includes('tol')), 'polisi & petugas tol bersama');
  for (const k of daftar) {
    const lok = EP.latar!.lokasi[k.lokasi]!.ilustrasi;
    assert.equal(lok.tokoh.jenis, 'berdiri', k.lokasi);
    for (const bicara of k.sampul ? [false] : [false, true]) {
    // Bicara: tokoh pertama sedang berbicara (bingkai setengah badan, gaya visual novel).
    const komp = { hadir: k.hadir.map((id, i) => ({ id, ekspresi: 'netral' as const, bicara: bicara && i === 0 })), objek: k.objek };
    const letak = letakBerdiri(EP, lok, komp);
    assert.equal(letak.bicara, bicara);
    for (const [w, h] of k.sampul ? [...KOTAK, ...KOTAK_KARTU] : KOTAK) {
      const pot = potonganSubjek(lok, w, h, letak.subjek, letak.bebasLabel, PITA, k.sampul || !bicara ? 0 : TUMPANG);
      const nama = `${k.lokasi} [${k.hadir}]${bicara ? ' bicara' : ''} ${w}x${h}`;
      assert.ok(pot.x >= -1e-6 && pot.y >= -1e-6 && pot.x + pot.w <= lok.w + 1e-6 && pot.y + pot.h <= lok.h + 1e-6, `${nama}: potongan di dalam gambar`);
      assert.ok(Math.abs(pot.w / pot.h - w / h) < 1e-6, `${nama}: rasio`);
      const pita = (Math.min(PITA, h / 2) * pot.w) / w;
      // Area bebas = potongan tanpa pita bawah yang ditumpangi kotak dialog.
      const bebas = { ...pot, h: pot.h - (k.sampul || !bicara ? 0 : (Math.min(TUMPANG, h * 0.3) * pot.w) / w) };
      for (const l of letak.lapis) {
        if (l.jenis === 'benda') {
          assert.ok(dalam(l.benda.fokus, bebas, 2), `${nama}: kepala truk utuh`);
          continue;
        }
        assert.ok(l.badan, `${nama}: ${l.tokoh.id} beraset badan penuh`);
        // Narasi: semua badan utuh (kaki menapak, di atas kotak dialog). Bicara: kamera milik PEMBICARA setengah badan; tokoh
        // lain boleh di tepi/luar bingkai.
        if (bicara && !l.tokoh.bicara) continue;
        const bagian = bicara ? { ...l.kotak, h: l.kotak.h * BINGKAI_BICARA } : l.kotak;
        assert.ok(dalam(bagian, bebas, 2), `${nama}: ${l.tokoh.id} ${bicara ? 'setengah badan' : 'utuh (kepala, tangan, kaki)'} ${JSON.stringify(l.kotak)} vs ${JSON.stringify(bebas)}`);
        assert.ok(l.kotak.y >= pot.y + pita - 1, `${nama}: kepala ${l.tokoh.id} di bawah pita label`);
      }
      // Papan wajib (rambu, antrean) utuh saat narasi; saat bicara isi bukti ada di lembar bukti / naskah.
      if (!bicara) for (const p of (lok.papan ?? []).filter((x) => x.wajib)) {
        assert.ok(dalam(p.kotak, bebas, 1), `${nama}: papan utuh`);
        assert.ok(p.kotak.y >= pot.y + pita - 1, `${nama}: papan di bawah pita label`);
      }
      // Tokoh cukup besar di panggung HP (bukan titik kecil): narasi = badan >= 110 px CSS di panggung >= 16:10; bicara = wajah
      // pembicara >= 28 px di panggung mana pun (kecuali pool: kepala truk ikut dibingkai bersama tokoh).
      if (w < 560) {
        for (const l of letak.lapis) {
          if (l.jenis !== 'tokoh' || !l.badan) continue;
          const tinggi = (l.kotak.h * w) / pot.w;
          if (!bicara && h >= 0.62 * w) assert.ok(tinggi >= 110, `${nama}: ${l.tokoh.id} ${tinggi.toFixed(0)} px`);
          // Panggung pendek (2:1, beat panjang / keputusan) memberi ruang ke teks: wajah >= 22 px; tinggi/sedang >= 28 px.
          if (bicara && l.tokoh.bicara && !lok.benda?.length) assert.ok((l.badan.kepala.bawah - l.badan.kepala.atas) * tinggi >= (h < 0.55 * w ? 22 : 28), `${nama}: wajah ${l.tokoh.id} ${((l.badan.kepala.bawah - l.badan.kepala.atas) * tinggi).toFixed(0)} px`);
        }
      }
    }
    }
  }
});

test('lapangan: perspektif & kedalaman: tokoh lebih jauh lebih kecil, truk ~3,9 m vs orang 1,7 m, tokoh di depan truk', () => {
  const t = POOL.tokoh;
  assert.equal(t.jenis, 'berdiri');
  if (t.jenis !== 'berdiri') return;
  const b = TOKOH.rudi!.badan!;
  const dekat = kotakBerdiri(t, b, { x: 800, y: 900 });
  const jauh = kotakBerdiri(t, b, { x: 800, y: 650 });
  assert.ok(dekat.h > jauh.h * 2, 'tokoh lebih dekat ke kamera lebih besar');
  assert.ok(Math.abs(jauh.y + jauh.h - 650) < 1e-6, 'kaki tepat di titik slot (menapak)');
  // Truk: tinggi kotak di alas roda depan dibanding orang setinggi acuan di kedalaman yang sama.
  const truk = POOL.benda![0]!;
  const orang = kotakBerdiri(t, { ...b, tinggi: 160 }, { x: 0, y: truk.alas });
  const rasio = (truk.alas - truk.kotak.y) / orang.h;
  assert.ok(rasio > 2 && rasio < 2.6, `truk/orang ${rasio.toFixed(2)} (kabin ~3,9 m / 1,7 m)`);
  const letak = letakBerdiri(EP, POOL, { hadir: [{ id: 'rudi', ekspresi: 'netral', bicara: false }], objek: [] });
  assert.deepEqual(letak.lapis.map((l) => l.jenis), ['benda', 'tokoh'], 'truk lebih jauh digambar dulu, Mas Rudi di depannya');
  // Tanpa aset (siluet) tetap di slot yang sama & ikut dibingkai.
  const tanpa = letakBerdiri({ ...EP, latar: { ...EP.latar!, tokoh: {} } } as Episode, POOL, { hadir: [{ id: 'rudi', ekspresi: 'netral', bicara: false }], objek: [] });
  assert.equal(tanpa.lapis.find((l) => l.jenis === 'tokoh')?.badan, null);
  assert.equal(tanpa.subjek.length, letak.subjek.length);
  assert.ok(RUANG_SUBJEK.atas > 0);
});

test('aset tokoh Episode 2: ekspresi naskah terpetakan, badan penuh untuk lapangan, polisi beraset & beda dari petugas tol', () => {
  assert.notEqual(avatarTokoh(EP, 'hendra', 'cemas'), avatarTokoh(EP, 'hendra', 'senang'), 'ekspresi Hendra berbeda');
  assert.equal(avatarTokoh(EP, 'hendra', 'lega'), avatarTokoh(EP, 'hendra', 'netral'), 'lega = potret tenang');
  assert.equal(avatarTokoh(EP, 'rudi', 'cemas'), avatarTokoh(EP, 'rudi', 'netral'), 'tanpa potret ekspresi = netral');
  for (const id of ['rudi', 'bima', 'darto', 'admin', 'tol', 'hendra', 'polisi']) assert.ok(TOKOH[id]!.badan && TOKOH[id]!.badan!.tinggi > 140, `${id}: badan penuh`);
  assert.equal(TOKOH.missRaksa!.badan, undefined, 'Miss Raksa badan penuh (bertepi cokelat) tidak dipakai');
  assert.ok(asetTokoh(EP, 'polisi'), 'polisi punya aset');
  assert.equal(EP.latar!.tanpaAset, undefined, 'tidak ada lagi pemeran tanpa aset');
  const src = (id: string) => [...avatarTokoh(EP, id, 'netral')!.map((x) => x.src), ...TOKOH[id]!.badan!.varian.map((x) => x.src)];
  assert.ok(src('polisi').every((s) => !src('tol').includes(s)), 'polisi & petugas tol berkas berbeda');
});

test('validator: aset latar ilustrasi', () => {
  assert.deepEqual(validasiEpisode(EP), []);
  const dengan = (latar: Partial<NonNullable<Episode['latar']>>): Episode => ({ ...EP, latar: { ...EP.latar!, ...latar } });
  const lokasi = (id: string, il: LokasiIlustrasi) => dengan({ lokasi: { ...EP.latar!.lokasi, [id]: { ...EP.latar!.lokasi[id]!, ilustrasi: il } } });
  const ada = (hasil: string[], teks: string) => assert.ok(hasil.some((p) => p.includes(teks)), `${teks}\n${hasil.join('\n')}`);
  ada(validasiEpisode(dengan({ tokoh: { ...EP.latar!.tokoh, rudi: { ...TOKOH.rudi!, badan: undefined } } })), '"rudi" tanpa badan penuh di lokasi "pool"');
  const { polisi: _polisi, ...tanpaPolisi } = EP.latar!.tokoh;
  ada(validasiEpisode(dengan({ tokoh: tanpaPolisi })), '"polisi" tidak punya aset');
  ada(validasiEpisode(lokasi('kantor', { ...KANTOR, bingkai: { ...KANTOR.bingkai, hp: { cx: 5000, cy: 470, lebar: 1060 } } })), 'bingkai.hp');
  ada(validasiEpisode(dengan({ tokoh: { ...EP.latar!.tokoh, bima: { ...TOKOH.bima!, avatar: {} as never } } })), '"bima".avatar: netral wajib ada');
  const t = POOL.tokoh;
  if (t.jenis !== 'berdiri') throw new Error('pool berdiri');
  ada(validasiEpisode(lokasi('pool', { ...POOL, tokoh: { ...t, slot: { ...t.slot, 1: [{ x: 800, y: 300 }] } } })), 'tokoh.slot[1]');
  ada(validasiEpisode(lokasi('pool', { ...POOL, papan: [{ kotak: { x: 1600, y: 10, w: 200, h: 50 }, latar: null, baris: [{ teks: 'latar.bengkel.penuh', ukuran: 20, warna: '#000' }] }] })), 'papan[0]: kotak di luar gambar');
  ada(validasiEpisode(lokasi('pool', { ...POOL, papan: [{ kotak: { x: 10, y: 10, w: 200, h: 50 }, latar: null, baris: [{ teks: 'tidak.ada', ukuran: 20, warna: '#000' }] }] })), 'tidak.ada');
  ada(validasiEpisode(dengan({ lokasi: { ...EP.latar!.lokasi, pool: { nama: 'lokasi.pool' } as never } })), 'ilustrasi: wajib ada');
});
