/**
 * Progres solo: arti bintang baru (ketepatan terbaik) dan migrasi aman progres lama 'raksa:solo'.
 * Rancangan: docs/rancangan-mode-cerita.md bagian 5E & 6. localStorage ditiru di memori (global).
 */
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  VERSI_SOLO,
  bintangUntuk,
  catatHasilSolo,
  kosongkanMemoriUntukTes,
  progresSolo,
  rekorLalu,
  totalPoin,
  ulangSolo,
} from './profil';

// ------------------------------------------------------------------ localStorage tiruan
const isi = new Map<string, string>();
/** Jumlah setItem per kunci (untuk memastikan membaca data terbaru tidak menulis apa pun). */
const tulisan = new Map<string, number>();
let diblokir = false;
const tiruan = {
  getItem(k: string): string | null {
    if (diblokir) throw new Error('SecurityError');
    return isi.has(k) ? isi.get(k)! : null;
  },
  setItem(k: string, v: string): void {
    if (diblokir) throw new Error('QuotaExceededError');
    isi.set(k, String(v));
    tulisan.set(k, (tulisan.get(k) ?? 0) + 1);
  },
  removeItem(k: string): void {
    if (diblokir) throw new Error('SecurityError');
    isi.delete(k);
  },
  clear(): void { isi.clear(); },
  key(i: number): string | null { return [...isi.keys()][i] ?? null; },
  get length(): number { return isi.size; },
};
Object.defineProperty(globalThis, 'localStorage', { value: tiruan, configurable: true, writable: true });

const SOLO = 'raksa:solo';
const CADANGAN = 'raksa:solo:cadangan-v1';
const CADANGAN_RUSAK = 'raksa:solo:cadangan-rusak';

beforeEach(() => {
  isi.clear();
  tulisan.clear();
  diblokir = false;
  kosongkanMemoriUntukTes();
});

/** Progres format lama persis seperti yang ditulis build 99fb182 (tanpa field versi, 1 bintang = sudah dicoba). */
const LAMA = JSON.stringify({
  misi: {
    'm01-parkir': { akurasi: 0, poin: 0, bintang: 1, kali: 1 },
    'm02-detektif-penyok': { akurasi: 0.5, poin: 640, bintang: 1, kali: 2 },
    'm03-berkas-ruko': { akurasi: 0.6, poin: 700, bintang: 2, kali: 1 },
    'm09-hitung-teliti': { akurasi: 1, poin: 1278, bintang: 3, kali: 3 },
  },
  rekor: 5000,
});

function tersimpan(): { versi?: number; misi: Record<string, Record<string, unknown>>; rekor: number } {
  return JSON.parse(isi.get(SOLO)!);
}

// ------------------------------------------------------------------ arti bintang

test('bintangUntuk: bintang = ketepatan (0 bila tidak ada yang tepat)', () => {
  assert.equal(bintangUntuk(0), 0);
  assert.equal(bintangUntuk(-0.2), 0);
  assert.equal(bintangUntuk(Number.NaN), 0);
  assert.equal(bintangUntuk(0.01), 1);
  assert.equal(bintangUntuk(0.5), 1);
  assert.equal(bintangUntuk(0.5999999999999999), 2, 'toleransi pembulatan di ambang 0,6');
  assert.equal(bintangUntuk(0.6), 2);
  assert.equal(bintangUntuk(0.998), 2);
  assert.equal(bintangUntuk(0.999), 3);
  assert.equal(bintangUntuk(1), 3);
});

// ------------------------------------------------------------------ migrasi progres lama

test('migrasi v1: bintang dihitung ulang dari akurasi; akurasi/poin/kali tetap; 0 bintang tetap tercatat dicoba', () => {
  isi.set(SOLO, LAMA);
  const p = progresSolo();
  assert.equal(p.versi, VERSI_SOLO);
  assert.deepEqual(p.misi['m01-parkir'], { akurasi: 0, poin: 0, bintang: 0, kali: 1 });
  assert.deepEqual(p.misi['m02-detektif-penyok'], { akurasi: 0.5, poin: 640, bintang: 1, kali: 2 });
  assert.deepEqual(p.misi['m03-berkas-ruko'], { akurasi: 0.6, poin: 700, bintang: 2, kali: 1 });
  assert.deepEqual(p.misi['m09-hitung-teliti'], { akurasi: 1, poin: 1278, bintang: 3, kali: 3 });
  // "Sudah dicoba" = catatan ada, terlepas dari bintang.
  assert.ok('m01-parkir' in p.misi);
  assert.equal(Object.keys(p.misi).length, 4);

  // Tertulis sebagai versi 2 dengan bintang baru.
  const s = tersimpan();
  assert.equal(s.versi, 2);
  assert.equal(s.misi['m01-parkir']!.bintang, 0);
  assert.equal(s.misi['m02-detektif-penyok']!.bintang, 1);
  assert.equal(s.misi['m03-berkas-ruko']!.bintang, 2);
  assert.equal(s.misi['m09-hitung-teliti']!.bintang, 3);
});

test('migrasi v1: rekor & total poin tidak berubah', () => {
  isi.set(SOLO, LAMA);
  const p = progresSolo();
  assert.equal(p.rekor, 5000);
  assert.equal(totalPoin(p), 0 + 640 + 700 + 1278);
  assert.equal(tersimpan().rekor, 5000);

  // Rekor yang lebih kecil dari total (data lama tidak konsisten) juga tidak "diperbaiki" oleh migrasi.
  beforeEachManual();
  isi.set(SOLO, JSON.stringify({ misi: { 'm01-parkir': { akurasi: 1, poin: 1300, bintang: 3, kali: 1 } }, rekor: 100 }));
  assert.equal(progresSolo().rekor, 100);
  assert.equal(tersimpan().rekor, 100);
});

test('migrasi v1: teks mentah lama dicadangkan persis, sebelum ditimpa', () => {
  isi.set(SOLO, LAMA);
  progresSolo();
  assert.equal(isi.get(CADANGAN), LAMA);
  assert.notEqual(isi.get(SOLO), LAMA);
});

test('migrasi v1: cadangan yang sudah ada tidak ditimpa', () => {
  const cadanganLama = '{"misi":{},"rekor":7}';
  isi.set(CADANGAN, cadanganLama);
  isi.set(SOLO, LAMA);
  progresSolo();
  assert.equal(isi.get(CADANGAN), cadanganLama);
  assert.equal(tersimpan().versi, 2);

  // Tab lama menulis format lama lagi setelah migrasi: dimigrasi ulang, cadangan pertama tetap.
  isi.set(SOLO, JSON.stringify({ misi: { 'm01-parkir': { akurasi: 0, poin: 0, bintang: 1, kali: 2 } }, rekor: 0 }));
  assert.equal(progresSolo().misi['m01-parkir']!.bintang, 0);
  assert.equal(isi.get(CADANGAN), cadanganLama);
});

test('migrasi idempoten: dibaca berkali-kali hasilnya sama dan tidak menulis lagi', () => {
  isi.set(SOLO, LAMA);
  const a = progresSolo();
  const mentahSesudah = isi.get(SOLO);
  const nTulis = tulisan.get(SOLO);
  const nCadangan = tulisan.get(CADANGAN);
  const b = progresSolo();
  const c = progresSolo();
  assert.deepEqual(b, a);
  assert.deepEqual(c, a);
  assert.equal(isi.get(SOLO), mentahSesudah);
  assert.equal(tulisan.get(SOLO), nTulis, 'progres versi 2 dibaca tanpa ditulis ulang');
  assert.equal(tulisan.get(CADANGAN), nCadangan);
  assert.equal(nCadangan, 1);
});

test('versi 2 dibaca apa adanya: tanpa cadangan, tanpa tulis', () => {
  const v2 = JSON.stringify({ versi: 2, misi: { 'm01-parkir': { akurasi: 0, poin: 0, bintang: 0, kali: 1 } }, rekor: 0 });
  isi.set(SOLO, v2);
  const p = progresSolo();
  assert.equal(p.misi['m01-parkir']!.bintang, 0);
  assert.equal(isi.get(SOLO), v2);
  assert.equal(isi.has(CADANGAN), false);
  assert.equal(tulisan.get(SOLO) ?? 0, 0);
});

test('versi lebih baru (sesudah rollback build) tidak dimigrasi dan tidak dicadangkan', () => {
  const v3 = JSON.stringify({ versi: 3, misi: { 'm01-parkir': { akurasi: 0.7, poin: 900, bintang: 2, kali: 1 } }, rekor: 900 });
  isi.set(SOLO, v3);
  assert.equal(progresSolo().misi['m01-parkir']!.bintang, 2);
  assert.equal(isi.get(SOLO), v3);
  assert.equal(isi.has(CADANGAN), false);
});

test('JSON rusak: aman (tanpa lempar), tampil kosong, tidak ditimpa saat dibaca', () => {
  for (const rusak of ['{rusak', 'null', '[]', '"teks"', '{"rekor":500}', '{"misi":[1,2]}']) {
    beforeEachManual();
    isi.set(SOLO, rusak);
    const p = progresSolo();
    assert.deepEqual(p.misi, {}, rusak);
    assert.equal(p.rekor, 0, rusak);
    assert.equal(isi.get(SOLO), rusak, `${rusak}: data mentah tidak ditimpa saat dibaca`);
  }
});

test('JSON rusak lalu main: teks mentah dicadangkan sekali sebelum ditimpa', () => {
  isi.set(SOLO, '{rusak');
  const p = catatHasilSolo('m01-parkir', 1, 1250);
  assert.equal(isi.get(CADANGAN_RUSAK), '{rusak');
  assert.equal(p.misi['m01-parkir']!.bintang, 3);
  assert.equal(tersimpan().versi, 2);
});

test('entri misi rusak dilewati tanpa lempar, tetapi tidak dihapus dari penyimpanan', () => {
  isi.set(SOLO, JSON.stringify({
    misi: {
      'm01-parkir': null,
      'm02-detektif-penyok': { akurasi: 'x', poin: 5 },
      'm03-berkas-ruko': 'rusak',
      'm04-excavator': { akurasi: 0.7, poin: 800, bintang: 2, kali: 1 },
      'm05-polis-mana': { akurasi: 0.2 },
    },
    rekor: 800,
  }));
  const p = progresSolo();
  assert.deepEqual(Object.keys(p.misi).sort(), ['m04-excavator', 'm05-polis-mana']);
  assert.deepEqual(p.misi['m05-polis-mana'], { akurasi: 0.2, poin: 0, bintang: 1, kali: 1 });
  const s = tersimpan();
  assert.equal(s.misi['m01-parkir'], null);
  assert.deepEqual(s.misi['m02-detektif-penyok'], { akurasi: 'x', poin: 5 });
  assert.equal(s.misi['m03-berkas-ruko'], 'rusak');

  // Entri rusak juga bertahan saat misi lain dicatat; misi yang dicatat ulang menggantikannya.
  catatHasilSolo('m02-detektif-penyok', 0, 0);
  const s2 = tersimpan();
  assert.equal(s2.misi['m01-parkir'], null);
  assert.equal(s2.misi['m03-berkas-ruko'], 'rusak');
  assert.equal(s2.misi['m02-detektif-penyok']!.bintang, 0);
});

// ------------------------------------------------------------------ catatHasilSolo (arti baru)

test('catatHasilSolo: 0 tepat = 0 bintang tetapi tercatat dicoba; terbaik disimpan', () => {
  let p = catatHasilSolo('m01-parkir', 0, 0);
  assert.deepEqual(p.misi['m01-parkir'], { akurasi: 0, poin: 0, bintang: 0, kali: 1 });
  assert.equal(p.versi, 2);
  assert.equal(tersimpan().versi, 2);

  p = catatHasilSolo('m01-parkir', 0.5, 700);
  assert.deepEqual(p.misi['m01-parkir'], { akurasi: 0.5, poin: 700, bintang: 1, kali: 2 });

  // Percobaan lebih buruk tidak menurunkan apa pun, tetapi tetap dihitung sebagai percobaan.
  p = catatHasilSolo('m01-parkir', 0, 0);
  assert.deepEqual(p.misi['m01-parkir'], { akurasi: 0.5, poin: 700, bintang: 1, kali: 3 });

  p = catatHasilSolo('m01-parkir', 0.6, 650);
  assert.deepEqual(p.misi['m01-parkir'], { akurasi: 0.6, poin: 700, bintang: 2, kali: 4 }, 'akurasi & poin terbaik masing-masing');

  p = catatHasilSolo('m01-parkir', 1, 1300);
  assert.deepEqual(p.misi['m01-parkir'], { akurasi: 1, poin: 1300, bintang: 3, kali: 5 });
  assert.equal(p.rekor, 1300);
  assert.deepEqual(progresSolo(), p);
});

test('catatHasilSolo pada progres lama: cadangkan, migrasi, lalu catat', () => {
  isi.set(SOLO, LAMA);
  const p = catatHasilSolo('m05-polis-mana', 0, 0);
  assert.equal(isi.get(CADANGAN), LAMA);
  assert.equal(p.misi['m01-parkir']!.bintang, 0, 'bintang lama "sudah dicoba" dihitung ulang');
  assert.equal(p.misi['m05-polis-mana']!.bintang, 0);
  assert.equal(p.misi['m05-polis-mana']!.kali, 1);
  assert.equal(p.rekor, 5000, 'rekor lama dipertahankan');
  assert.equal(tersimpan().versi, 2);
  assert.equal(Object.keys(tersimpan().misi).length, 5);
});

test('rekor: naik bila total melampaui, tidak pernah turun', () => {
  catatHasilSolo('m01-parkir', 1, 1300);
  catatHasilSolo('m02-detektif-penyok', 0.5, 600);
  assert.equal(progresSolo().rekor, 1900);
  ulangSolo();
  assert.equal(rekorLalu(), 1900);
  const p = catatHasilSolo('m01-parkir', 0, 0);
  assert.equal(p.rekor, 1900);
});

test('ulangSolo: misi dikosongkan, rekor tetap, progres lama dicadangkan dulu', () => {
  isi.set(SOLO, LAMA);
  ulangSolo();
  assert.equal(isi.get(CADANGAN), LAMA);
  assert.deepEqual(tersimpan(), { versi: 2, misi: {}, rekor: 5000 });
  assert.equal(rekorLalu(), 5000);
  assert.deepEqual(progresSolo(), { versi: 2, misi: {}, rekor: 5000 });
});

test('penyimpanan diblokir: migrasi & catat tetap berjalan di memori tanpa lempar', () => {
  diblokir = true;
  assert.deepEqual(progresSolo(), { versi: 2, misi: {}, rekor: 0 });
  const p = catatHasilSolo('m01-parkir', 0, 0);
  assert.equal(p.misi['m01-parkir']!.bintang, 0);
  assert.equal(progresSolo().misi['m01-parkir']!.kali, 1);
  assert.equal(isi.size, 0);
});

test('cadangan gagal tersimpan (kuota): data lama tidak ditimpa saat dibaca, tampilan tetap bermakna baru', () => {
  isi.set(SOLO, LAMA);
  const setAsli = tiruan.setItem;
  tiruan.setItem = (k: string, v: string) => {
    if (k === CADANGAN) throw new Error('QuotaExceededError');
    setAsli(k, v);
  };
  try {
    for (let i = 0; i < 3; i++) {
      const p = progresSolo();
      assert.equal(p.misi['m01-parkir']!.bintang, 0);
      assert.equal(isi.get(SOLO), LAMA, `bacaan ${i + 1}: tanpa cadangan tersimpan, data lama dibiarkan`);
    }
  } finally {
    tiruan.setItem = setAsli;
  }
});

/** Setel ulang di tengah tes (beberapa kasus dalam satu tes). */
function beforeEachManual(): void {
  isi.clear();
  tulisan.clear();
  diblokir = false;
  kosongkanMemoriUntukTes();
}
