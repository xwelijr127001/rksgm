/**
 * Penjaga adegan MODE CERITA (docs/rancangan-mode-cerita.md bagian 3.2 & 6):
 * id misi & opsi sesuai kontrak, objek di dalam dunia, label singkat & tidak bertumpuk (id/en/zh),
 * area ketuk cukup besar & objek bersarang tidak saling menumpuk, label en/zh lengkap,
 * serta seni cerita tidak menyentuh kode pertandingan. Bila episode sudah terdaftar, adegan juga
 * dicocokkan dengan misi sintetis episode (opsi & dokumen).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ADEGAN_CERITA, LABEL_CERITA } from './index';
import { ADEGAN } from '../index';
import { LABEL } from '../label';
import { stepIdsOf } from '../../draft';
import { WORLD_H, WORLD_W, type SceneObjectSpec, type SceneSpec } from '../../types';
import { DAFTAR_EKSPRESI, DAFTAR_LATAR } from '../../../cerita/tipe';
import { nasabahSetengahBadan } from '../../../cerita/seni/nasabah';
import { latarPanggung } from '../../../cerita/seni/latar';

// ------------------------------------------------------------------ kontrak (bagian 3.2)

const BUKTI = 'cerita-auto1-bukti';
const POLIS = 'cerita-auto1-polis';
const OPSI_BUKTI = ['foto-full', 'foto-penyok', 'foto-plat', 'foto-menu', 'foto-ban', 'foto-dasbor'];
const BAHASA = ['id', 'en', 'zh'] as const;
type Bhs = (typeof BAHASA)[number];

function adegan(id: string): SceneSpec {
  const buat = ADEGAN_CERITA[id];
  assert.ok(buat, `${id} terdaftar di ADEGAN_CERITA`);
  const s = buat!();
  assert.ok(s, `${id} punya adegan`);
  return s!;
}

function labelDalam(s: SceneSpec, o: SceneObjectSpec, b: Bhs): string {
  return b === 'id' ? o.label : LABEL_CERITA[b][s.missionId]?.objek[o.id] ?? '';
}

/**
 * Perkiraan pil label engine (MissionScene.gambarLabel): lebar = teks (huruf tebal 20) + 20 + 24
 * (penanda), tinggi 34, pusat di bawah objek + labelDx/labelDy, x dijepit 6 dari tepi dunia.
 * Lebar huruf sengaja longgar (Latin 11,5; CJK 21) dibanding ukuran sungguhan (±10,4 / 20).
 */
function kotakLabel(o: SceneObjectSpec, teks: string): { x: number; y: number; w: number; h: number } {
  let lebarTeks = 0;
  for (const ch of teks) lebarTeks += /[⺀-鿿豈-﫿]/.test(ch) ? 21 : 11.5;
  const w = lebarTeks + 44;
  const cy = o.y + o.art.h / 2 + 18 + (o.labelDy ?? 0);
  const cx = Math.min(WORLD_W - w / 2 - 6, Math.max(w / 2 + 6, o.x + (o.labelDx ?? 0)));
  return { x: cx - w / 2, y: cy - 17, w, h: 34 };
}

function zona(o: SceneObjectSpec): { x: number; y: number; w: number; h: number } {
  const w = Math.max(o.hit?.w ?? o.art.w, 76);
  const h = Math.max(o.hit?.h ?? o.art.h, 76);
  return { x: o.x - w / 2, y: o.y - h / 2, w, h };
}

type Kotak = { x: number; y: number; w: number; h: number };
const tumpuk = (a: Kotak, b: Kotak): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const berisi = (a: Kotak, px: number, py: number): boolean => px > a.x && px < a.x + a.w && py > a.y && py < a.y + a.h;

// ------------------------------------------------------------------ pendaftaran

test('kedua adegan cerita terdaftar di ADEGAN_CERITA dan registri adegan utama', () => {
  assert.deepEqual(Object.keys(ADEGAN_CERITA).sort(), [BUKTI, POLIS].sort());
  for (const id of [BUKTI, POLIS]) {
    assert.equal(ADEGAN[id], ADEGAN_CERITA[id], `${id} ikut di scenes/index.ts`);
    assert.equal(adegan(id).missionId, id);
    assert.ok(LABEL.en[id] && LABEL.zh[id], `${id} ikut di kamus label en/zh`);
  }
});

// ------------------------------------------------------------------ struktur umum

for (const id of [BUKTI, POLIS]) {
  test(`${id}: objek di dalam dunia, id unik, label id <= 18, latar 640 x 480`, () => {
    const s = adegan(id);
    assert.equal(s.background.w, WORLD_W);
    assert.equal(s.background.h, WORLD_H);
    const ids = new Set<string>();
    for (const o of s.objects) {
      assert.ok(!ids.has(o.id), `id objek unik: ${o.id}`);
      ids.add(o.id);
      assert.ok(o.x >= 0 && o.x <= WORLD_W && o.y >= 0 && o.y <= WORLD_H, `${o.id} di dalam adegan`);
      assert.ok(o.x - o.art.w / 2 >= -1 && o.x + o.art.w / 2 <= WORLD_W + 1, `${o.id}: gambar tidak keluar kiri/kanan`);
      assert.ok(o.y - o.art.h / 2 >= -1 && o.y + o.art.h / 2 <= WORLD_H + 1, `${o.id}: gambar tidak keluar atas/bawah`);
      assert.ok(o.label.length > 0 && o.label.length <= 18, `${o.id}: label singkat (${o.label})`);
    }
    for (const p of s.props ?? []) assert.ok(p.x >= 0 && p.x <= WORLD_W && p.y >= 0 && p.y <= WORLD_H, `properti ${p.id} di dalam adegan`);
    assert.ok(s.hero.x >= 0 && s.hero.x <= WORLD_W && s.hero.y <= WORLD_H, 'petugas di dalam adegan');
  });

  for (const b of BAHASA) {
    test(`${id} (${b}): label tidak bertumpuk, tidak keluar tepi, dan tidak menutupi titik tengah objek lain`, () => {
      const s = adegan(id);
      const kotak = s.objects.map((o) => ({ o, k: kotakLabel(o, labelDalam(s, o, b)) }));
      for (const { o, k } of kotak) {
        assert.ok(k.x >= 0 && k.x + k.w <= WORLD_W, `${o.id}: label (${b}) muat selebar adegan`);
        assert.ok(k.y >= 0 && k.y + k.h <= WORLD_H, `${o.id}: label (${b}) tidak keluar atas/bawah`);
        for (const lain of s.objects) {
          if (lain === o || lain.art.w >= 300) continue; // objek besar (mobil utuh) memang dilintasi label
          assert.ok(!berisi(k, lain.x, lain.y), `label ${o.id} (${b}) menutupi titik tengah ${lain.id}`);
        }
      }
      for (let i = 0; i < kotak.length; i += 1) {
        for (let j = i + 1; j < kotak.length; j += 1) {
          assert.ok(!tumpuk(kotak[i]!.k, kotak[j]!.k), `label ${kotak[i]!.o.id} & ${kotak[j]!.o.id} (${b}) bertumpuk`);
        }
      }
    });
  }
}

// ------------------------------------------------------------------ bukti (parkiran)

test(`${BUKTI}: enam opsi foto sesuai kontrak (langkah bukti, fx photo)`, () => {
  const s = adegan(BUKTI);
  const opsi = s.objects.filter((o) => o.role === 'option');
  assert.equal(opsi.length, OPSI_BUKTI.length, 'jumlah opsi');
  assert.deepEqual(opsi.map((o) => o.refId).sort(), [...OPSI_BUKTI].sort(), 'refId opsi = daftar kontrak');
  for (const o of opsi) {
    assert.deepEqual(stepIdsOf(o), ['bukti'], `${o.id}: langkah bukti`);
    assert.equal(o.fx, 'photo', `${o.id}: fx photo`);
  }
  assert.equal(s.objects.length, opsi.length, 'tidak ada objek lain yang bisa diketuk');
  assert.ok(!s.acakPosisi?.length, 'posisi terikat benda: tanpa acakPosisi');
});

test(`${BUKTI}: area ketuk >= 86 (>= 44 px pada adegan 328 px di HP 360) dan objek bersarang tidak saling menumpuk`, () => {
  const s = adegan(BUKTI);
  for (const o of s.objects) {
    const z = zona(o);
    assert.ok(z.w >= 76 && z.h >= 76, `${o.id}: area ketuk minimal engine`);
    assert.ok(Math.min(z.w, z.h) >= 86, `${o.id}: area ketuk ${z.w}x${z.h} >= 86`);
  }
  const mobil = s.objects.find((o) => o.refId === 'foto-full')!;
  const sisipan = s.objects.filter((o) => o !== mobil);
  for (const o of sisipan) {
    if (tumpuk(zona(o), zona(mobil))) {
      assert.ok((o.depth ?? 20) > (mobil.depth ?? 20), `${o.id} di atas mobil: depth lebih tinggi supaya ketukan tidak jatuh ke mobil`);
    }
  }
  for (let i = 0; i < sisipan.length; i += 1) {
    for (let j = i + 1; j < sisipan.length; j += 1) {
      assert.ok(!tumpuk(zona(sisipan[i]!), zona(sisipan[j]!)), `area ketuk ${sisipan[i]!.id} & ${sisipan[j]!.id} bertumpuk`);
    }
  }
});

test(`${BUKTI}: pengecoh bagian mobil (ban depan, dasbor) bersarang di mobil Bu Rina, di atas mobil`, () => {
  // Pengecoh yang butuh pertimbangan: bagian mobil yang sama, bukan benda di luar mobil (kucing/swafoto dulu).
  const s = adegan(BUKTI);
  const mobil = s.objects.find((o) => o.refId === 'foto-full')!;
  const m: Kotak = { x: mobil.x - mobil.art.w / 2, y: mobil.y - mobil.art.h / 2, w: mobil.art.w, h: mobil.art.h };
  for (const ref of ['foto-ban', 'foto-dasbor']) {
    const o = s.objects.find((x) => x.refId === ref);
    assert.ok(o, `${ref} ada di adegan`);
    const g: Kotak = { x: o!.x - o!.art.w / 2, y: o!.y - o!.art.h / 2, w: o!.art.w, h: o!.art.h };
    assert.ok(g.x >= m.x && g.y >= m.y && g.x + g.w <= m.x + m.w && g.y + g.h <= m.y + m.h, `${ref}: gambar di dalam mobil`);
    assert.ok((o!.depth ?? 20) > (mobil.depth ?? 20), `${ref}: di atas mobil`);
  }
  for (const lama of ['foto-selfie', 'foto-kucing']) assert.ok(!s.objects.some((o) => o.refId === lama), `${lama} sudah dihapus`);
});

test(`${BUKTI}: petugas & properti tidak menutupi objek`, () => {
  const s = adegan(BUKTI);
  // Petugas tampil 0,8 x (90 x 152), titik jangkar di kaki (0,96). Cek seluruh pita jalan.
  const w = s.walk ?? { minX: s.hero.x, maxX: s.hero.x, minY: s.hero.y, maxY: s.hero.y };
  const petugas: Kotak = { x: w.minX - 36, y: w.minY - 117, w: w.maxX - w.minX + 72, h: w.maxY - w.minY + 122 };
  for (const o of s.objects) {
    const g: Kotak = { x: o.x - o.art.w / 2, y: o.y - o.art.h / 2, w: o.art.w, h: o.art.h };
    if (o.refId === 'foto-full') assert.ok(!berisi(petugas, o.x, o.y), 'petugas tidak di depan tengah mobil');
    else assert.ok(!tumpuk(petugas, g), `petugas tidak menutupi ${o.id}`);
  }
  for (const p of s.props ?? []) {
    const pk: Kotak = { x: p.x - p.art.w / 2, y: p.y - p.art.h / 2, w: p.art.w, h: p.art.h };
    for (const o of s.objects) {
      if (o.refId === 'foto-full') continue;
      assert.ok(!tumpuk(pk, { x: o.x - o.art.w / 2, y: o.y - o.art.h / 2, w: o.art.w, h: o.art.h }), `properti ${p.id} tidak bertumpuk dengan ${o.id}`);
    }
  }
});

// ------------------------------------------------------------------ polis (meja layanan)

test(`${POLIS}: satu kartu polis 'polis-rina' (doc), tanpa objek pilihan`, () => {
  const s = adegan(POLIS);
  const doc = s.objects.filter((o) => o.role === 'doc');
  assert.equal(doc.length, 1);
  assert.equal(doc[0]!.refId, 'polis-rina');
  assert.equal(s.objects.filter((o) => o.role === 'option' || o.role === 'item' || o.role === 'bucket').length, 0, 'langkah penjelasan dijawab lewat daftar HTML');
  const z = zona(doc[0]!);
  assert.ok(Math.min(z.w, z.h) >= 86, 'kartu mudah diketuk');
  assert.ok((s.props ?? []).length <= 2, 'paling banyak dua hiasan');
  assert.notEqual(s.background.key, 'm05-latar', 'susunan alas lain = kunci tekstur lain');
});

// ------------------------------------------------------------------ label en/zh

test('label en/zh lengkap untuk semua objek & dalam batas (en <= 20, zh <= 9)', () => {
  for (const id of [BUKTI, POLIS]) {
    const s = adegan(id);
    for (const b of ['en', 'zh'] as const) {
      const kamus = LABEL_CERITA[b][id];
      assert.ok(kamus, `${id}: kamus ${b}`);
      assert.deepEqual(Object.keys(kamus!.objek).sort(), s.objects.map((o) => o.id).sort(), `${id}/${b}: kunci = id objek`);
      for (const [k, v] of Object.entries(kamus!.objek)) {
        assert.ok(v.trim().length > 0, `${id}/${b}/${k}: tidak kosong`);
        assert.ok([...v].length <= (b === 'en' ? 20 : 9), `${id}/${b}/${k}: "${v}" terlalu panjang`);
      }
    }
  }
});

// ------------------------------------------------------------------ kunci tekstur & kode

test('kunci tekstur adegan cerita tidak bertabrakan dengan gambar lain', () => {
  const svgPerKunci = new Map<string, string>();
  for (const buat of Object.values(ADEGAN)) {
    const s = buat();
    if (!s) continue;
    for (const a of [s.background, ...(s.props ?? []).map((p) => p.art), ...s.objects.map((o) => o.art)]) {
      const ada = svgPerKunci.get(a.key);
      assert.ok(ada === undefined || ada === a.svg, `kunci gambar ${a.key} dipakai untuk gambar berbeda`);
      svgPerKunci.set(a.key, a.svg);
    }
  }
});

test('seni & adegan cerita tidak mengimpor kode pertandingan atau kunci jawaban', () => {
  // Pola dirakit supaya berkas ini sendiri tidak memuat kata terlarang (scenes.test.ts memindai folder ini).
  const terlarang = new RegExp(['answer' + 'Keys', 'MISSION' + '_KEYS', 'KUNCI' + '_ACARA', 'ser' + 'ver/'].join('|'));
  const berkas = (d: string): string[] =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? berkas(path.join(d, e.name)) : [path.join(d, e.name)]));
  const folder = [import.meta.dirname, path.join(import.meta.dirname, '..', '..', '..', 'cerita', 'seni')];
  let n = 0;
  for (const d of folder) {
    for (const f of berkas(d)) {
      n += 1;
      assert.ok(!terlarang.test(fs.readFileSync(f, 'utf8')), `${path.basename(f)} tidak menyentuh kode pertandingan`);
    }
  }
  assert.ok(n >= 6, 'berkas seni & adegan ditemukan');
});

// ------------------------------------------------------------------ seni Bu Rina & latar

test('Bu Rina: delapan ekspresi berbeda satu sama lain; latar panggung tanpa teks', () => {
  const svg = DAFTAR_EKSPRESI.map((e) => nasabahSetengahBadan(e));
  assert.equal(new Set(svg).size, DAFTAR_EKSPRESI.length, 'tiap ekspresi punya gambar sendiri');
  assert.equal(nasabahSetengahBadan('cemas'), svg[1], 'hasil di-cache (string sama)');
  for (const s of svg) assert.ok(!/<text|<image|url\(|id="/.test(s), 'tanpa teks, gambar luar, atau id (aman diulang di satu halaman)');
  for (const l of DAFTAR_LATAR) {
    const s = latarPanggung(l);
    assert.ok(s.length > 1000, `latar ${l} tidak kosong`);
    assert.ok(!/<text/.test(s.replace(/<text[^>]*>P<\/text>/, '')), `latar ${l} tanpa tulisan (selain rambu P latar misi 1)`);
    assert.ok(!/id="/.test(s), `latar ${l} tanpa id`);
    assert.equal(latarPanggung(l), s, 'latar di-cache');
  }
});

// ------------------------------------------------------------------ cocok dengan episode (bila sudah ada)

test('adegan cocok dengan misi sintetis episode yang terdaftar (opsi & dokumen)', async () => {
  const { DAFTAR_EPISODE } = await import('../../../cerita/episode/index');
  const misiCerita = DAFTAR_EPISODE.flatMap((ep) => Object.values(ep.aktivitas));
  for (const akt of misiCerita) {
    for (const b of BAHASA) {
      const m = akt.misi(b);
      const s = ADEGAN_CERITA[m.id]?.();
      assert.ok(s, `${m.id}: adegan terdaftar`);
      for (const o of s!.objects) {
        if (o.role === 'doc') {
          assert.ok((m.policyCards ?? []).some((c) => c.id === o.refId) || (m.tables ?? []).some((t) => t.id === o.refId), `${m.id}/${o.id}: dokumen ${o.refId} ada di misi`);
          continue;
        }
        for (const sid of stepIdsOf(o)) {
          const step = m.steps.find((x) => x.id === sid);
          assert.ok(step && (step.kind === 'single' || step.kind === 'multi'), `${m.id}/${o.id}: langkah ${sid} ada`);
          if (step && (step.kind === 'single' || step.kind === 'multi')) assert.ok(step.options.some((x) => x.id === o.refId), `${m.id}/${o.id}: opsi ${o.refId}`);
        }
      }
      // Bila langkah tampil di adegan, SEMUA opsinya harus ada (sama dengan aturan scenes.test.ts).
      for (const step of m.steps) {
        const obj: SceneObjectSpec[] = s!.objects.filter((o: SceneObjectSpec) => stepIdsOf(o).includes(step.id) && o.role === 'option');
        if (!obj.length || (step.kind !== 'single' && step.kind !== 'multi')) continue;
        const ada: string[] = obj.map((o: SceneObjectSpec) => o.refId);
        assert.deepEqual(ada.sort(), step.options.map((o) => o.id).sort(), `${m.id}/${step.id}: semua opsi tampil`);
      }
    }
  }
});
