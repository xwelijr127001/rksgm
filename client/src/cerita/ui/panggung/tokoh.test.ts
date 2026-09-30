/**
 * Uji TOKOH PIKSEL di panggung (atlas + manifest NYATA lewat penyusun seni/piksel; seni/tokoh opsi `piksel`):
 * pemetaan komposisi cerita -> frame, skala 1 & kisi piksel seni, garis meja Miss Raksa, tangan di atas meja dari
 * frame yang sama, kedip/mulut/mata-bawah hanya mengubah lapisan wajah, ujung telunjuk di landasan kartu, satu gagang
 * telepon, rencana masuk/pergi raster, dan cadangan SVG/siluet bila atlas gagal / generator diganti / hasil null.
 * Dijalankan lewat impor dari kamera.test.ts (daftar test:client).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { DAFTAR_EKSPRESI, type ArahPandang, type Ekspresi, type PoseMentor, type PoseNasabah } from '../../tipe';
import { ruangAdegan } from '../../seni/ruang';
import { CAKRAWALA, GARIS_MEJA_MENTOR, LANDASAN_KARTU, TEMPAT_MEJA } from '../../seni/ruang/geometri';
import {
  atlasGagal, gambarBuRina, gambarMissRaksa, pasangGenerator, pasangStatusAtlas, tokohPiksel, type GambarTokohRaster,
} from '../../seni/tokoh';
import { gambarMissRaksa as missRaksaFinal } from '../../seni/tokoh/missRaksa';
import { gambarBuRina as buRinaFinal } from '../../seni/tokoh/buRina';
import { buRinaSementara, missRaksaSementara } from '../../seni/tokoh/sementara';
import { penyusunPiksel, POSE_CERITA, URL_ATLAS_PIKSEL } from '../../seni/piksel';
import { DAFTAR_PANDANG } from '../adegan';
import type { KomposisiAdegan } from '../adeganTipe';
import { buatLetak, cariTokoh, kotakPenting, letakProp, susunAdegan, titikDunia, Z, type OpsiTokoh, type SusunanAdegan } from './dunia';
import type { Kamera } from './kamera';
import { kotakDiAtasMeja, pikselDari, sidikGambar, tempelanDari } from './piksel';
import { rencanaMasuk, rencanaPergi } from './rencana';
import { bisaDudukTurun, bisaHadapKanan, gambarSementara, gambarTokoh } from './sumber';

const RUANG = ruangAdegan('meja');
const POSE_DUDUK_MISS: readonly PoseMentor[] = ['duduk-dengar', 'duduk-jelaskan', 'duduk-tunjuk', 'telepon'];
const kelipatan4 = (v: number) => Number.isInteger(v / 4);
type Raster = GambarTokohRaster;
const g = (o: OpsiTokoh & { bicara?: boolean; kedip?: boolean }) => gambarTokoh(o) as Raster;
const opsiMiss = (pose: PoseMentor, ekspresi: Ekspresi, pandang: ArahPandang): OpsiTokoh => ({ siapa: 'mentor', pose, ekspresi, pandang });
const opsiRina = (pose: PoseNasabah, ekspresi: Ekspresi, pandang: ArahPandang, hadap?: 'kiri' | 'kanan'): OpsiTokoh =>
  ({ siapa: 'nasabah', pose, ekspresi, pandang, ...(hadap ? { hadap } : {}) }) as OpsiTokoh;
const semuaOpsi = (): OpsiTokoh[] => [
  ...POSE_CERITA.missRaksa.flatMap((pose) => DAFTAR_EKSPRESI.flatMap((e) => DAFTAR_PANDANG.map((p) => opsiMiss(pose, e, p)))),
  ...POSE_CERITA.buRina.flatMap((pose) => DAFTAR_EKSPRESI.flatMap((e) => DAFTAR_PANDANG.map((p) => opsiRina(pose, e, p)))),
];

test('tokoh piksel: setiap pose x ekspresi x pandang cerita = gambar raster (frame atlas), satuan kanvas kelipatan 4, skala 1 & kisi di tempatnya', () => {
  assert.ok(tokohPiksel('missRaksa') && tokohPiksel('buRina'), 'manifest & atlas nyata terpasang');
  for (const o of semuaOpsi()) {
    const x = g(o);
    const di = `${o.siapa} ${o.pose} ${o.ekspresi} ${o.pandang}`;
    const p = pikselDari(x);
    assert.ok(p && x.svg === '' && typeof x.frame === 'string' && x.frame.length > 0, `${di}: raster dengan frame atlas`);
    assert.equal(p!.url, o.siapa === 'mentor' ? URL_ATLAS_PIKSEL.missRaksa : URL_ATLAS_PIKSEL.buRina, `${di}: atlas tokohnya`);
    // Kanvas = piksel seni utuh. Jangkar (tengah telapak) & kepala = titik TENGAH: boleh setengah piksel seni; sudut
    // kiri-atas di dunia tetap di kisi (titikKisi, diuji di bawah).
    for (const v of [x.w, x.h]) assert.ok(kelipatan4(v), `${di}: ${v} kelipatan 4 (1 piksel seni)`);
    for (const v of [x.jangkar.x, x.jangkar.y, x.kepala.x, x.kepala.y]) assert.ok(kelipatan4(v * 2), `${di}: ${v} di kisi setengah piksel seni`);
    assert.equal(x.w, p!.sumber.w * 4, `${di}: lebar = potongan x 4`);
    assert.equal(x.h, p!.sumber.h * 4, `${di}: tinggi = potongan x 4`);
    const titik = o.siapa === 'mentor' ? (o.pose.startsWith('duduk') || o.pose === 'telepon' ? TEMPAT_MEJA.mentor : TEMPAT_MEJA.mentorBerdiri) : TEMPAT_MEJA.nasabahDuduk;
    const l = buatLetak(o, titik, 1.3, Z.belakang, gambarTokoh);
    assert.equal(l.skala, 1, `${di}: skala 1 (tanpa skala pecahan)`);
    assert.ok(kelipatan4(l.titik.x - x.jangkar.x) && kelipatan4(l.titik.y - x.jangkar.y), `${di}: sudut kiri-atas di kisi piksel seni`);
    assert.ok(Math.abs(l.titik.x - titik.x) <= 2 && Math.abs(l.titik.y - titik.y) <= 2, `${di}: jangkar di tempatnya (± setengah piksel seni)`);
  }
});

test('Miss Raksa: pandang lawan/bawah = frame hadap kanan (ke Bu Rina / kartu), pemain/depan = hadap kiri (pemain), semua pose', () => {
  for (const pose of POSE_CERITA.missRaksa) {
    for (const e of DAFTAR_EKSPRESI) {
      for (const pandang of DAFTAR_PANDANG) {
        const f = g(opsiMiss(pose, e, pandang)).frame!;
        const arah = pandang === 'lawan' || pandang === 'bawah' ? 'kanan' : 'kiri';
        assert.ok(f.endsWith(`-${arah}`), `${pose} ${e} ${pandang}: frame ${f} hadap ${arah}`);
        assert.ok(f.startsWith(pose), `${pose}: frame pose itu sendiri (${f})`);
      }
    }
  }
});

test('Miss Raksa duduk: garis meja frame di y garisMejaMentor (640, v5) di tempat duduknya; tangan di atas meja = kotak frame yang SAMA', () => {
  const m = penyusunPiksel.manifest.missRaksa!;
  assert.equal(RUANG.tempat.garisMejaMentor, GARIS_MEJA_MENTOR);
  assert.equal(GARIS_MEJA_MENTOR, 640, 'v5 komposisi meja: tepi jauh meja 640 (dulu 656)');
  for (const pose of POSE_DUDUK_MISS) {
    for (const e of DAFTAR_EKSPRESI) {
      for (const pandang of DAFTAR_PANDANG) {
        const o = opsiMiss(pose, e, pandang);
        const l = buatLetak(o, RUANG.tempat.mentor, 1, Z.belakang, gambarTokoh);
        const x = l.gambar as Raster;
        const f = m.frame[x.frame!]!;
        assert.ok(typeof f.garisMeja === 'number', `${x.frame}: garis meja di manifest`);
        assert.equal(l.titik.y - x.jangkar.y + f.garisMeja! * 4, GARIS_MEJA_MENTOR, `${pose} ${e} ${pandang} (${x.frame}): garis meja dunia ${GARIS_MEJA_MENTOR}`);
        const kotak = kotakDiAtasMeja(x);
        // Pose telepon: tangan di telinga (tanpa tangan di atas meja).
        if (pose !== 'telepon') assert.ok(kotak.length >= 1, `${x.frame}: ada tangan di atas meja`);
        if (kotak.length) assert.ok(kotak.some((k) => k.y + k.h > f.garisMeja! * 4), `${x.frame}: tangan menjangkau permukaan meja (di bawah garis tepi jauh)`);
        assert.deepEqual(kotak, x.diAtasMejaPiksel ?? [], `${x.frame}: klip = kotak frame yang sama (gambar & transform sama, tanpa lengan kedua)`);
        for (const k of kotak) {
          assert.ok(k.x >= 0 && k.y >= 0 && k.x + k.w <= x.w && k.y + k.h <= x.h, `${x.frame}: kotak di dalam frame`);
          assert.ok(k.y + k.h >= f.garisMeja! * 4, `${x.frame}: kotak tangan menyentuh garis meja atau di bawahnya (tepi lengan 1 baris di atas garis)`);
        }
      }
    }
  }
});

test('percakapan setara (v5 komposisi meja): garis mata Miss Raksa duduk & Bu Rina duduk (semua gestur, condong) berselisih <= 4 piksel seni, di sekitar cakrawala', () => {
  /** y dunia tengah kotak mata (manifest `wajah.mata`) frame yang dipakai letak ini. */
  const mata = (siapa: 'missRaksa' | 'buRina', o: OpsiTokoh, titik: { x: number; y: number }) => {
    const l = buatLetak(o, titik, 1, Z.belakang, gambarTokoh);
    const x = l.gambar as Raster;
    const f = penyusunPiksel.manifest[siapa]!.frame[x.frame!]! as unknown as { wajah: { mata: [number, number, number, number] | { y: number; h: number } } };
    const k = f.wajah.mata;
    const [my, mh] = Array.isArray(k) ? [k[1], k[3]] : [k.y, k.h];
    return { frame: x.frame!, y: l.titik.y - x.jangkar.y + (my + mh / 2) * 4 };
  };
  const miss = POSE_DUDUK_MISS.flatMap((pose) => DAFTAR_PANDANG.map((p) => mata('missRaksa', opsiMiss(pose, 'netral', p), TEMPAT_MEJA.mentor)));
  const rina = [
    ...DAFTAR_EKSPRESI.map((e) => mata('buRina', opsiRina('duduk', e, 'lawan'), TEMPAT_MEJA.nasabahDuduk)),
    ...DAFTAR_EKSPRESI.map((e) => mata('buRina', opsiRina('duduk-condong', e, 'lawan'), TEMPAT_MEJA.nasabahDuduk)),
  ];
  for (const m of miss) {
    assert.ok(Math.abs(m.y - CAKRAWALA) <= 2 * 4, `Miss Raksa ${m.frame}: garis mata ${m.y} di cakrawala ${CAKRAWALA} (± 2 piksel)`);
    for (const r of rina) assert.ok(Math.abs(m.y - r.y) <= 4 * 4, `Miss Raksa ${m.frame} (${m.y}) vs Bu Rina ${r.frame} (${r.y}): garis mata berselisih <= 4 piksel seni`);
  }
});

test('kamera: tangan Miss Raksa di atas meja (frame tanpa titik tangan di manifest) ikut kotak penting, jadi tidak jatuh ke pita label', () => {
  for (const pose of ['duduk-dengar', 'duduk-jelaskan', 'duduk-tunjuk'] as const) {
    for (const pandang of ['lawan', 'pemain'] as const) {
      const l = buatLetak(opsiMiss(pose, 'netral', pandang), RUANG.tempat.mentor, 1, Z.belakang, gambarTokoh);
      const k = kotakPenting(l);
      for (const m of kotakDiAtasMeja(l.gambar)) {
        const a = titikDunia(l.gambar, { x: m.x, y: m.y }, l.titik, 1);
        assert.ok(a.x >= k.x - 1e-6 && a.y >= k.y - 1e-6 && a.x + m.w <= k.x + k.w + 1e-6 && a.y + m.h <= k.y + k.h + 1e-6, `${pose} ${pandang}: kotak tangan di meja di dalam kotak penting`);
      }
    }
  }
});

test('kedip, mulut bicara & mata bawah hanya menambah lapisan wajah (kepala, tubuh, frame, jangkar tetap)', () => {
  for (const o of semuaOpsi()) {
    const dasar = g(o);
    const di = `${o.siapa} ${o.pose} ${o.ekspresi} ${o.pandang}`;
    for (const [nama, v] of [['kedip', g({ ...o, kedip: true })], ['bicara', g({ ...o, bicara: true })]] as const) {
      assert.equal(v.frame, dasar.frame, `${di} ${nama}: frame sama`);
      assert.deepEqual([v.w, v.h, v.jangkar, v.kepala, pikselDari(v)!.sumber], [dasar.w, dasar.h, dasar.jangkar, dasar.kepala, pikselDari(dasar)!.sumber], `${di} ${nama}: kanvas, jangkar, kepala & tubuh sama`);
      const td = tempelanDari(dasar);
      const tv = tempelanDari(v);
      if (!td.length) continue;
      assert.deepEqual(tv[0], td[0], `${di} ${nama}: lapisan wajah dasar sama (tidak bergeser)`);
      const w = td[0]!;
      for (const t of tv.slice(1)) {
        assert.ok(t.x >= w.x && t.y >= w.y && t.x + t.p.sumber.w <= w.x + w.p.sumber.w && t.y + t.p.sumber.h <= w.y + w.p.sumber.h, `${di} ${nama}: lapisan mata/mulut di dalam kotak wajah`);
      }
    }
  }
  // Mata bawah (kartu) = lapisan mata tambahan, frame sama dengan pandang lawan untuk Bu Rina (frame duduk hanya kiri).
  for (const e of DAFTAR_EKSPRESI) {
    const lawan = g(opsiRina('duduk', e, 'lawan'));
    const bawah = g(opsiRina('duduk', e, 'bawah'));
    assert.equal(bawah.frame, lawan.frame, `Bu Rina duduk ${e}: frame sama saat melihat kartu`);
    assert.equal(tempelanDari(bawah).length, tempelanDari(lawan).length + 1, `Bu Rina duduk ${e}: mata bawah = satu lapisan mata`);
  }
});

test('Bu Rina duduk: tubuh gestur per ekspresi (kesal lipat tangan, cemas genggam, bingung dagu, lega dada, lainnya duduk)', () => {
  const harus: Record<Ekspresi, string> = { kesal: 'lipat-tangan', cemas: 'genggam', bingung: 'dagu', lega: 'dada', netral: 'duduk', serius: 'duduk', tersenyum: 'duduk', senang: 'duduk' };
  for (const e of DAFTAR_EKSPRESI) for (const p of DAFTAR_PANDANG) assert.equal(g(opsiRina('duduk', e, p)).frame, harus[e], `duduk ${e} ${p}`);
  // Pinggul semua tubuh gestur sama: tukar ekspresi = tempat sama (ganti seketika + angguk 1 piksel, tanpa silang-pudar).
  const titik = DAFTAR_EKSPRESI.map((e) => buatLetak(opsiRina('duduk', e, 'pemain'), TEMPAT_MEJA.nasabahDuduk, 1, Z.nasabah, gambarTokoh).titik);
  for (const t of titik) assert.deepEqual(t, titik[0]);
});

test('kartu: ujung telunjuk Miss Raksa (duduk-tunjuk, mata ke kartu) di landasan kartu untuk setiap ekspresi', () => {
  const L = LANDASAN_KARTU;
  for (const e of DAFTAR_EKSPRESI) {
    const l = buatLetak(opsiMiss('duduk-tunjuk', e, 'bawah'), RUANG.tempat.mentor, 1, Z.belakang, gambarTokoh);
    const x = l.gambar as Raster;
    assert.equal(x.frame, 'duduk-tunjuk-kanan');
    const t = titikDunia(x, x.titikTangan!.telunjuk!, l.titik, l.skala);
    assert.ok(t.x >= L.x && t.x <= L.x + L.w && t.y >= L.y && t.y <= L.y + L.h, `${e}: telunjuk ${t.x},${t.y} di landasan ${JSON.stringify(L)}`);
    assert.equal(tempelanDari(x).length, 2, `${e}: wajah + mata bawah (melihat kartu)`);
  }
});

const kom = (x: Partial<KomposisiAdegan>): KomposisiAdegan => ({
  lokasi: 'meja',
  mentor: { pose: 'duduk-dengar', ekspresi: 'netral', pandang: 'lawan' },
  nasabah: null,
  pembicara: 'narasi',
  prop: { kunci: 'tersimpan', kartu: 'tersimpan', telepon: 'meja' },
  aksi: null,
  pembuka: false,
  ...x,
});
const susun = (k: KomposisiAdegan): SusunanAdegan => susunAdegan(k, ruangAdegan(k.lokasi), gambarTokoh);

test('telepon: frame Miss Raksa memegang gagangnya sendiri -> pesawat di meja tanpa gagang (tempat tangan), juga bila cue menyebut meja', () => {
  for (const telepon of ['tangan', 'meja'] as const) {
    const s = susun(kom({ lokasi: 'telepon', mentor: { pose: 'telepon', ekspresi: 'netral', pandang: 'depan' }, prop: { kunci: 'tersimpan', kartu: 'tersimpan', telepon } }));
    const m = cariTokoh(s, 'mentor')!.gambar as Raster;
    assert.ok(m.teleponTergambar && m.frame!.startsWith('telepon-'), 'frame telepon menggambar gagang');
    const p = s.prop.filter((x) => x.id === 'telepon');
    assert.equal(p.length, 1, 'satu pesawat');
    assert.equal(p[0]!.tempat, 'tangan', `cue ${telepon}: pesawat tanpa gagang`);
  }
  const biasa = susun(kom({}));
  assert.equal(letakProp(biasa.komposisi, biasa.ruang, biasa.tokoh).find((x) => x.id === 'telepon')?.tempat, 'meja', 'tanpa pose telepon: gagang di pesawat');
});

test('jalan & pergi raster: jalan-a/jalan-b frame berbeda, hadap kanan dengan frame sendiri, berdiri-pergi = berdiri-kanan, bingkai duduk-turun', () => {
  assert.equal(bisaHadapKanan(), true);
  assert.equal(bisaDudukTurun(), true);
  const a = g(opsiRina('jalan-a', 'netral', 'depan'));
  const b = g(opsiRina('jalan-b', 'netral', 'depan'));
  assert.notEqual(a.frame, b.frame);
  assert.equal(g(opsiRina('jalan-a', 'netral', 'depan', 'kanan')).frame, 'jalan-a-kanan');
  assert.equal(g(opsiRina('jalan-b', 'netral', 'depan', 'kanan')).frame, 'jalan-b-kanan');
  assert.equal(g(opsiRina('berdiri-pergi', 'kesal', 'depan')).frame, 'berdiri-kanan');
  assert.equal(g(opsiRina('duduk-turun', 'netral', 'lawan')).frame, 'duduk-turun');
  // Jangkar = telapak (kanvas terpangkas berbeda): kepala relatif telapak sama mendatar, jalan-b 1 piksel seni lebih tinggi
  // (manifest: badan terangkat saat kaki terayun), jadi bergantian tanpa lompatan kepala.
  for (const hadap of [undefined, 'kanan'] as const) {
    const ka = g(opsiRina('jalan-a', 'netral', 'depan', hadap));
    const kb = g(opsiRina('jalan-b', 'netral', 'depan', hadap));
    assert.equal(kb.kepala.x - kb.jangkar.x, ka.kepala.x - ka.jangkar.x, `jalan ${hadap ?? 'kiri'}: kepala mendatar sama`);
    assert.ok(Math.abs((kb.kepala.y - kb.jangkar.y) - (ka.kepala.y - ka.jangkar.y)) <= 4, `jalan ${hadap ?? 'kiri'}: kepala naik-turun <= 1 piksel seni`);
  }
});

const K: Kamera = { s: 0.8, x: 0, y: 150 };
test('rencana masuk & pergi dengan tokoh raster: pose antara skala 1 di kisi piksel seni, salinan jalan raster pada jalur skala 1', () => {
  const sambut = susun(kom({ mentor: { pose: 'berdiri-sambut', ekspresi: 'tersenyum', pandang: 'pemain' } }));
  const duduk = susun(kom({
    nasabah: { pose: 'duduk', ekspresi: 'kesal', pandang: 'pemain', lewatTelepon: false },
    prop: { kunci: 'meja', kartu: 'tersimpan', telepon: 'meja' },
    aksi: { jenis: 'masuk', kunci: 'uji#masuk' },
  }));
  const kosong = susun(kom({ aksi: { jenis: 'pergi', kunci: 'uji#pergi' } }));
  const masuk = rencanaMasuk({ lama: sambut, baru: duduk, kamLama: K, kamBaru: K, kamPintu: K, dudukTurun: true, hadapKanan: true }, gambarTokoh);
  const pergi = rencanaPergi({ lama: duduk, baru: kosong, kamLama: K, kamBaru: K, kamPintu: K, dudukTurun: true, hadapKanan: true }, gambarTokoh);
  for (const r of [masuk, pergi]) {
    assert.ok(r.aktor.length > 0, `${r.jenis}: ada aktor`);
    for (const a of r.aktor) {
      if (a.jenis === 'tokoh') {
        assert.ok(pikselDari(a.letak.gambar), `${r.jenis} ${a.kunci}: raster`);
        assert.equal(a.letak.skala, 1, `${r.jenis} ${a.kunci}: skala 1`);
        assert.ok(kelipatan4(a.letak.titik.x - a.letak.gambar.jangkar.x) && kelipatan4(a.letak.titik.y - a.letak.gambar.jangkar.y), `${r.jenis} ${a.kunci}: di kisi`);
      }
      if (a.jenis === 'jalan') {
        for (const s of a.salinan) {
          const x = gambarTokoh(s.opsi) as Raster;
          assert.ok(pikselDari(x), `${r.jenis} salinan ${s.id}: raster`);
          assert.ok(!s.cermin, `${r.jenis} salinan ${s.id}: tanpa cermin CSS`);
          if (r.jenis === 'pergi' && s.id !== 'diam') assert.ok(x.frame!.endsWith('-kanan'), `pergi salinan ${s.id}: frame hadap kanan (${x.frame})`);
        }
      }
    }
    const skala = r.gerak.filter((x) => x.target === 'x:jalan').flatMap((x) => x.keyframes.map((k) => String(k.transform ?? '')));
    assert.ok(skala.filter(Boolean).length >= 4, `${r.jenis}: keyframe jalan ada`);
    for (const t of skala) if (t) assert.match(t, /scale\(1\)/, `${r.jenis}: jalur skala 1 (${t})`);
  }
  for (const p of RUANG.tempat.jalurMasuk) assert.equal(p.skala, 1, 'jalur masuk ruang: skala 1');
});

test('cadangan: atlas GAGAL didekode / generator diganti / raster dimatikan / hasil null -> siluet seragam atau SVG, cerita tetap punya gambar', () => {
  const o = { pose: 'duduk-dengar' as const, ekspresi: 'netral' as const, pandang: 'lawan' as const, piksel: true };
  const rinaO = { pose: 'duduk' as const, ekspresi: 'kesal' as const, piksel: true };
  const { piksel: _p1, ...oSvg } = o;
  const { piksel: _p2, ...rinaSvg } = rinaO;
  void _p1; void _p2;
  try {
    assert.ok(pikselDari(gambarMissRaksa(o)), 'bawaan: raster');
    assert.equal(atlasGagal(), false);
    // SATU atlas gagal (Miss ATAU Bu Rina) = KEDUA tokoh siluet netral (sementara.ts), bukan seni SVG v3 yang ditolak.
    for (const gagal of [URL_ATLAS_PIKSEL.missRaksa, URL_ATLAS_PIKSEL.buRina]) {
      pasangStatusAtlas((url) => (url === gagal ? false : null));
      const di = gagal === URL_ATLAS_PIKSEL.missRaksa ? 'atlas Miss gagal' : 'atlas Bu Rina gagal';
      assert.ok(atlasGagal() && !tokohPiksel('missRaksa') && !tokohPiksel('buRina'), `${di}: tidak ada tokoh raster`);
      const m = gambarMissRaksa(o);
      const r = gambarBuRina(rinaO);
      assert.equal(sidikGambar(m), sidikGambar(missRaksaSementara(oSvg)), `${di}: Miss Raksa = siluet netral`);
      assert.equal(sidikGambar(r), sidikGambar(buRinaSementara(rinaSvg)), `${di}: Bu Rina = siluet netral (seragam)`);
      assert.notEqual(sidikGambar(m), sidikGambar(missRaksaFinal(oSvg)), `${di}: bukan SVG v3`);
      // Panggung (sumber.ts gambarTokoh): siluet -> nama ditulis sebagai teks (gambarSementara).
      const l = buatLetak(opsiMiss('duduk-dengar', 'netral', 'lawan'), RUANG.tempat.mentor, 1, Z.belakang, gambarTokoh);
      assert.ok(gambarSementara(l), `${di}: panggung menulis nama (siluet)`);
      // Tanpa permintaan raster (potret dialog / kartu / aktivitas): generator SVG seperti biasa.
      assert.equal(sidikGambar(gambarMissRaksa(oSvg)), sidikGambar(missRaksaFinal(oSvg)), `${di}: tanpa piksel tetap SVG`);
    }
    // Belum selesai dimuat (null) = bukan gagal: raster.
    pasangStatusAtlas(() => null);
    assert.ok(pikselDari(gambarBuRina(rinaO)) && !atlasGagal(), 'belum selesai dimuat: tetap raster');
    pasangGenerator({ piksel: false });
    assert.ok(!pikselDari(gambarMissRaksa(o)) && gambarMissRaksa(o).svg.length > 0, 'raster dimatikan: SVG');
    pasangGenerator({ piksel: true, missRaksa: () => null as never });
    const siluet = gambarMissRaksa(o);
    assert.ok(!pikselDari(siluet) && siluet.svg.length > 0 && siluet.w > 0, 'generator diganti & hasil null = GAGAL -> siluet (bukan gambar kosong)');
  } finally {
    pasangStatusAtlas(() => null);
    pasangGenerator({ piksel: true, missRaksa: missRaksaFinal, buRina: buRinaFinal });
  }
  assert.ok(pikselDari(gambarMissRaksa(o)), 'dipulihkan: raster');
});
