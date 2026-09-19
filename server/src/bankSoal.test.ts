/**
 * Bank soal tanpa server & tanpa DB: registri, validasi + konversi soal kustom, playlist room,
 * ronde penentuan setelah playlist pendek, lencana/CSV berbasis playlist, cache terjemahan misi.
 * (Jalur REST/socket + SQLite diuji di bank.integration.test.ts.)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { BATAS_KUSTOM, type SoalKustom } from '../../shared/bankSoal';
import { terjemahkanMisi } from '../../shared/i18n/misi';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '../../shared/missions';
import { MISSIONS_ACARA } from '../../shared/missions.acara';
import { computeBadges, gradeMission } from '../../shared/scoring';
import type { RoundResult } from '../../shared/types';
import { buildReveal, periksaKunciMisi } from './answerKeys';
import {
  GALAT_PLAYLIST,
  cariSoalBawaan as cariSoal,
  idPaket,
  periksaPlaylist,
  playlistPaket,
  ringkas,
  soalLatihan,
  type EntriSoal,
  type PencariSoal,
} from './bankSoal';
import { buildResultsCsv } from './csv';
import { kenaliGambar } from './gambarSoal';
import { RoomManager, sanitizeLook } from './rooms';
import { POLA_ID_KUSTOM, idKustomBaru, kustomKeMisi, validasiSoalKustom } from './soalKustom';

// ------------------------------------------------------------------ alat bantu

function fakeClock(start = 1_700_000_000_000) {
  let t = start;
  return {
    now: () => t,
    advance(ms: number) {
      t += ms;
    },
  };
}

const GAMBAR = '/gambar-soal/0123456789abcdef0123456789abcdef.png';

/** Kiriman editor host yang sah; `ubah` menimpa bagian tertentu. */
function kiriman(ubah: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    title: 'Foto mana yang dipakai?',
    product: 'AUTO',
    tingkat: 2,
    story: 'Nasabah mengirim beberapa foto setelah mobilnya tersenggol di parkiran.',
    instruction: 'Pilih foto yang paling membantu pemeriksaan.',
    learning: 'Foto titik kerusakan dan identitas kendaraan paling membantu pemeriksaan.',
    durationSeconds: 30,
    image: { src: GAMBAR, alt: 'Mobil penyok di parkiran' },
    steps: [
      {
        id: '',
        kind: 'single',
        prompt: 'Foto mana yang paling membantu?',
        options: [
          { id: '', label: 'Foto penyok pintu kiri' },
          { id: '', label: 'Foto makan siang' },
          { id: '', label: 'Foto langit sore' },
        ],
        benar: ['o1'],
        penjelasan: 'Foto penyok menunjukkan titik kerusakan yang diperiksa.',
      },
    ],
    ...ubah,
  };
}

function langkah(ubah: Record<string, unknown>): Record<string, unknown> {
  return { ...(kiriman().steps as Record<string, unknown>[])[0], ...ubah };
}

function sah(raw: Record<string, unknown>, id = 'k-ujicoba1'): SoalKustom {
  const hasil = validasiSoalKustom(raw, { id, gambarAda: () => true });
  assert.equal(hasil.ok, true, hasil.ok ? '' : hasil.rincian.join(' / '));
  if (!hasil.ok) throw new Error('tidak sah');
  return hasil.soal;
}

function rincian(raw: unknown, gambarAda: (src: string) => boolean = () => true): string[] {
  const hasil = validasiSoalKustom(raw, { id: 'k-ujicoba1', gambarAda });
  assert.equal(hasil.ok, false, 'harus ditolak');
  return hasil.ok ? [] : hasil.rincian;
}

/** Tiga soal kustom berbeda jenis: single, multi, number (dua langkah). */
const SOAL_A = sah(kiriman(), 'k-aaaaaaaa');
const SOAL_B = sah(
  kiriman({
    title: 'Dokumen laporan awal',
    product: 'FIRE',
    tingkat: 1,
    durationSeconds: 40,
    image: null,
    steps: [
      {
        kind: 'multi',
        prompt: 'Dokumen mana saja yang diperlukan?',
        options: [
          { id: 'kronologi', label: 'Kronologi kejadian' },
          { id: 'foto', label: 'Foto kerusakan' },
          { id: 'brosur', label: 'Brosur promo' },
          { id: 'struk', label: 'Struk kopi' },
        ],
        benar: ['foto', 'kronologi'],
        penjelasan: 'Kronologi dan foto kerusakan menjelaskan kejadian.',
      },
    ],
  }),
  'k-bbbbbbbb',
);
const SOAL_C = sah(
  kiriman({
    title: 'Hitung risiko sendiri',
    product: 'HVC',
    tingkat: 3,
    durationSeconds: 60,
    steps: [
      {
        kind: 'number',
        prompt: 'Berapa 10% dari Rp50.000.000?',
        nilai: 5_000_000,
        format: 'rupiah',
        penjelasan: '10% x Rp50.000.000 = Rp5.000.000.',
      },
      {
        kind: 'number',
        prompt: 'Berapa peti yang rusak?',
        nilai: 4,
        toleransi: 1,
        unit: 'peti',
        penjelasan: 'Empat peti rusak; selisih satu masih diterima.',
      },
    ],
  }),
  'k-cccccccc',
);

/** Bank tiruan: paket bawaan asli + soal kustom di memori (tanpa SQLite). */
function bankTiruan(kustom: SoalKustom[]): { cari: PencariSoal; isi: Map<string, SoalKustom> } {
  const isi = new Map(kustom.map((s) => [s.id, s]));
  const cari: PencariSoal = (id) => {
    const s = isi.get(id);
    if (s) return { ...kustomKeMisi(s), asal: 'kustom' } satisfies EntriSoal;
    return POLA_ID_KUSTOM.test(id) ? undefined : cariSoal(id);
  };
  return { cari, isi };
}

function managerBaru(kustom: SoalKustom[] = [SOAL_A, SOAL_B, SOAL_C]) {
  const clock = fakeClock();
  const bank = bankTiruan(kustom);
  const manager = new RoomManager(
    () => {},
    () => 'http://192.168.1.10:4000',
    clock.now,
    bank.cari,
  );
  return { manager, clock, bank };
}

/** Jawaban sempurna dari kunci sebuah entri bank. */
function jawabanTepat(e: EntriSoal): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const sk of e.kunci.steps) {
    if (sk.single !== undefined) out[sk.stepId] = sk.single;
    else if (sk.multi) out[sk.stepId] = [...sk.multi];
    else if (sk.assign) out[sk.stepId] = { ...sk.assign };
    else if (sk.number) out[sk.stepId] = sk.number.value;
    else if (sk.order) out[sk.stepId] = [...sk.order];
  }
  return out;
}

// ------------------------------------------------------------------ registri

test('registri: paket latihan lengkap dengan kunci & tingkat 1/2/3 menurut posisi', () => {
  assert.deepEqual(idPaket('latihan'), MISSIONS.map((m) => m.id));
  const tingkat = MISSIONS.map((m) => cariSoal(m.id)!.misi.level);
  assert.deepEqual(
    tingkat,
    MISSIONS.map((m, i) => m.level ?? (i <= 2 ? 1 : i <= 6 ? 2 : 3)),
  );
  const e = cariSoal('m01-parkir')!;
  assert.equal(e.asal, 'latihan');
  assert.equal(e.kunci.missionId, 'm01-parkir');
  assert.deepEqual(ringkas(e), {
    id: 'm01-parkir',
    judul: MISSIONS[0].title,
    produk: 'AUTO',
    tingkat: MISSIONS[0].level ?? 1,
    asal: 'latihan',
    langkah: 1,
    durasi: 20,
    gambar: null,
  });
  assert.equal(JSON.stringify(ringkas(e)).includes('dokumentasi'), false, 'ringkasan tidak memuat kunci');
});

test('registri: id tak dikenal, tutorial, dan ronde penentuan bukan soal bank', () => {
  assert.equal(cariSoal('tidak-ada'), undefined);
  assert.equal(cariSoal(TUTORIAL_MISSION.id), undefined);
  assert.equal(cariSoal(TIEBREAK_MISSION.id), undefined);
  assert.equal(cariSoal(undefined as unknown as string), undefined);
});

test('registri: paket acara kosong jatuh ke latihan; terisi -> dipakai apa adanya', () => {
  assert.deepEqual(idPaket('acara'), MISSIONS_ACARA.map((m) => m.id));
  const p = playlistPaket('acara');
  assert.ok(p.length > 0);
  assert.deepEqual(p, MISSIONS_ACARA.length ? MISSIONS_ACARA.map((m) => m.id) : MISSIONS.map((m) => m.id));
});

test('soalLatihan: hanya paket latihan + tutorial; penentuan perlu izin; acara & kustom ditolak', () => {
  assert.equal(soalLatihan('m09-hitung-teliti')?.kunci.missionId, 'm09-hitung-teliti');
  assert.equal(soalLatihan('tutorial')?.misi.id, 'tutorial');
  assert.equal(soalLatihan(TIEBREAK_MISSION.id), undefined);
  assert.equal(soalLatihan(TIEBREAK_MISSION.id, { penentuan: true })?.misi.id, TIEBREAK_MISSION.id);
  assert.equal(soalLatihan('k-aaaaaaaa'), undefined);
  assert.equal(soalLatihan(MISSIONS_ACARA[0]?.id ?? 'a01-contoh'), undefined);
  assert.equal(soalLatihan({ toString: 1 }), undefined);
});

// ------------------------------------------------------------------ validasi soal kustom

test('validasi: kiriman sah dirapikan (id s1/o1 dibuat server, id kiriman client diabaikan)', () => {
  const soal = sah({ ...kiriman(), id: 'm01-parkir', kunciRahasia: 'x' }, 'k-zzzzzzzz');
  assert.equal(soal.id, 'k-zzzzzzzz', 'id soal ditentukan server');
  assert.equal(soal.steps[0].id, 's1');
  assert.deepEqual(soal.steps[0].options!.map((o) => o.id), ['o1', 'o2', 'o3']);
  assert.deepEqual(soal.steps[0].benar, ['o1']);
  assert.equal('kunciRahasia' in soal, false, 'bidang asing dibuang');
  assert.match(idKustomBaru(), POLA_ID_KUSTOM);
  assert.notEqual(idKustomBaru(), idKustomBaru());
});

test('validasi: teks wajib & batas panjang (BATAS_KUSTOM)', () => {
  const r = rincian(kiriman({ title: '  ', story: '', instruction: null, learning: undefined }));
  for (const nama of ['Judul', 'Cerita', 'Tugas', 'Pelajaran']) {
    assert.ok(r.includes(`${nama} wajib diisi.`), nama);
  }
  const p = rincian(
    kiriman({
      title: 'j'.repeat(BATAS_KUSTOM.judul + 1),
      story: 'c'.repeat(BATAS_KUSTOM.cerita + 1),
      instruction: 't'.repeat(BATAS_KUSTOM.tugas + 1),
      learning: 'p'.repeat(BATAS_KUSTOM.pelajaran + 1),
    }),
  );
  assert.deepEqual(p, [
    `Judul maksimal ${BATAS_KUSTOM.judul} karakter.`,
    `Cerita maksimal ${BATAS_KUSTOM.cerita} karakter.`,
    `Tugas maksimal ${BATAS_KUSTOM.tugas} karakter.`,
    `Pelajaran maksimal ${BATAS_KUSTOM.pelajaran} karakter.`,
  ]);
  // Tepat di batas = sah; karakter kontrol dibuang.
  assert.equal(sah(kiriman({ title: 'j'.repeat(BATAS_KUSTOM.judul) })).title.length, BATAS_KUSTOM.judul);
  assert.equal(sah(kiriman({ title: 'Judul  \n rapi' })).title, 'Judul rapi');
});

test('validasi: produk, tingkat, durasi', () => {
  assert.deepEqual(rincian(kiriman({ product: 'JIWA' })), ['Produk tidak dikenal.']);
  assert.deepEqual(rincian(kiriman({ tingkat: 4 })), ['Tingkat harus 1, 2, atau 3.']);
  assert.deepEqual(rincian(kiriman({ tingkat: '2' })), ['Tingkat harus 1, 2, atau 3.']);
  const durasi = [`Durasi harus antara ${BATAS_KUSTOM.durasiMin} dan ${BATAS_KUSTOM.durasiMaks} detik.`];
  for (const d of [19, 181, Number.NaN, Infinity, '30', null]) {
    assert.deepEqual(rincian(kiriman({ durationSeconds: d })), durasi, String(d));
  }
  assert.equal(sah(kiriman({ durationSeconds: 20 })).durationSeconds, 20);
  assert.equal(sah(kiriman({ durationSeconds: 180 })).durationSeconds, 180);
});

test('validasi: gambar hanya hasil unggahan (/gambar-soal/<hash>.<ext>) atau null', () => {
  const bukanUnggahan = ['Gambar harus berasal dari unggahan di halaman ini.'];
  for (const src of [
    'https://contoh.com/a.png',
    '/gambar-soal/../raksa-game.db',
    '/gambar-soal/0123456789abcdef0123456789abcdef.svg',
    '/gambar-soal/0123456789ABCDEF0123456789ABCDEF.png',
    'javascript:alert(1)',
    '',
  ]) {
    assert.deepEqual(rincian(kiriman({ image: { src, alt: 'x' } })), bukanUnggahan, src);
  }
  assert.deepEqual(rincian(kiriman({ image: 'gambar.png' })), bukanUnggahan);
  assert.deepEqual(
    rincian(kiriman(), () => false),
    ['Berkas gambar tidak ditemukan. Unggah ulang gambarnya.'],
  );
  assert.equal(sah(kiriman({ image: null })).image, null);
  assert.deepEqual(sah(kiriman({ image: { src: GAMBAR, alt: '' } })).image, {
    src: GAMBAR,
    alt: 'Foto mana yang dipakai?',
  });
});

test('validasi: 1-4 pertanyaan, jenis dikenal, teks pertanyaan & penjelasan', () => {
  const jumlah = [`Soal harus punya 1 sampai ${BATAS_KUSTOM.langkahMaks} pertanyaan.`];
  assert.deepEqual(rincian(kiriman({ steps: [] })), jumlah);
  assert.deepEqual(rincian(kiriman({ steps: 'bukan daftar' })), jumlah);
  assert.deepEqual(rincian(kiriman({ steps: Array.from({ length: 5 }, () => langkah({})) })), jumlah);
  assert.equal(sah(kiriman({ steps: Array.from({ length: 4 }, () => langkah({})) })).steps.length, 4);

  assert.ok(rincian(kiriman({ steps: [langkah({ kind: 'assign' })] })).includes('Pertanyaan 1: jenis harus single, multi, atau number.'));
  assert.deepEqual(rincian(kiriman({ steps: [langkah({ prompt: '' })] })), ['Pertanyaan 1: teks pertanyaan wajib diisi.']);
  assert.deepEqual(rincian(kiriman({ steps: [langkah({ penjelasan: ' ' })] })), ['Pertanyaan 1: penjelasan wajib diisi.']);
  assert.deepEqual(rincian(kiriman({ steps: [langkah({ prompt: 'p'.repeat(BATAS_KUSTOM.prompt + 1) })] })), [
    `Pertanyaan 1: teks pertanyaan maksimal ${BATAS_KUSTOM.prompt} karakter.`,
  ]);
  assert.deepEqual(rincian(kiriman({ steps: [langkah({ penjelasan: 'p'.repeat(BATAS_KUSTOM.penjelasan + 1) })] })), [
    `Pertanyaan 1: penjelasan maksimal ${BATAS_KUSTOM.penjelasan} karakter.`,
  ]);
  assert.deepEqual(rincian(kiriman({ steps: [langkah({}), langkah({ id: 's1' })] })), [
    'Pertanyaan 2: id pertanyaan tidak boleh sama dengan pertanyaan lain.',
  ]);
  // Nomor pertanyaan di pesan mengikuti posisinya.
  assert.deepEqual(rincian(kiriman({ steps: [langkah({}), langkah({ prompt: '' })] })), [
    'Pertanyaan 2: teks pertanyaan wajib diisi.',
  ]);
});

test('validasi: 2-6 pilihan, teks pilihan, id pilihan unik', () => {
  const opsi = (n: number) => Array.from({ length: n }, (_, i) => ({ id: '', label: `Pilihan ${i + 1}` }));
  const jumlah = [`Pertanyaan 1: butuh ${BATAS_KUSTOM.opsiMin} sampai ${BATAS_KUSTOM.opsiMaks} pilihan.`];
  assert.deepEqual(rincian(kiriman({ steps: [langkah({ options: opsi(1) })] })), jumlah);
  assert.deepEqual(rincian(kiriman({ steps: [langkah({ options: opsi(7) })] })), jumlah);
  assert.equal(sah(kiriman({ steps: [langkah({ options: opsi(6) })] })).steps[0].options!.length, 6);
  assert.deepEqual(
    rincian(kiriman({ steps: [langkah({ options: [{ label: 'Ada' }, { label: '' }] })] })),
    ['Pertanyaan 1, pilihan 2: teks wajib diisi.'],
  );
  assert.deepEqual(
    rincian(kiriman({ steps: [langkah({ options: [{ label: 'Ada' }, { label: 'x'.repeat(BATAS_KUSTOM.opsi + 1) }] })] })),
    [`Pertanyaan 1, pilihan 2: teks maksimal ${BATAS_KUSTOM.opsi} karakter.`],
  );
  assert.ok(
    rincian(kiriman({ steps: [langkah({ options: [{ id: 'sama', label: 'A' }, { id: 'sama', label: 'B' }], benar: ['sama'] })] }))
      .includes('Pertanyaan 1: id pilihan tidak boleh sama.'),
  );
  // Id berbahaya (nama bawaan Object) tidak dipakai: diganti id buatan server.
  const aman = sah(kiriman({ steps: [langkah({ id: '__proto__', options: [{ id: 'constructor', label: 'A' }, { id: 'b', label: 'B' }], benar: ['b'] })] }));
  assert.equal(aman.steps[0].id, 's1');
  assert.deepEqual(aman.steps[0].options!.map((o) => o.id), ['o1', 'b']);
});

test('validasi: single tepat 1 benar; multi >= 1 benar dan tidak semua pilihan', () => {
  assert.deepEqual(rincian(kiriman({ steps: [langkah({ benar: [] })] })), ['Pertanyaan 1: tandai tepat 1 jawaban benar.']);
  assert.deepEqual(rincian(kiriman({ steps: [langkah({ benar: ['o1', 'o2'] })] })), ['Pertanyaan 1: tandai tepat 1 jawaban benar.']);
  assert.deepEqual(rincian(kiriman({ steps: [langkah({ benar: ['o9'] })] })), ['Pertanyaan 1: jawaban benar harus salah satu pilihan.']);
  assert.deepEqual(rincian(kiriman({ steps: [langkah({ kind: 'multi', benar: [] })] })), ['Pertanyaan 1: tandai minimal 1 jawaban benar.']);
  assert.deepEqual(rincian(kiriman({ steps: [langkah({ kind: 'multi', benar: ['o1', 'o2', 'o3'] })] })), [
    'Pertanyaan 1: jawaban benar tidak boleh semua pilihan.',
  ]);
  const multi = sah(kiriman({ steps: [langkah({ kind: 'multi', benar: ['o3', 'o1', 'o1'] })] }));
  assert.deepEqual(multi.steps[0].benar, ['o1', 'o3'], 'duplikat dibuang, urutan mengikuti pilihan');
});

test('validasi: number butuh nilai terhingga; toleransi >= 0; bidang pilihan dibuang', () => {
  const angka = (ubah: Record<string, unknown>) =>
    kiriman({ steps: [{ kind: 'number', prompt: 'Berapa peti?', penjelasan: 'Dua peti.', nilai: 2, ...ubah }] });
  for (const nilai of [undefined, null, '', 'dua', Number.NaN, Infinity, {}]) {
    assert.deepEqual(rincian(angka({ nilai })), ['Pertanyaan 1: nilai jawaban harus berupa angka.'], String(nilai));
  }
  assert.deepEqual(rincian(angka({ nilai: 1e16 })), ['Pertanyaan 1: nilai jawaban terlalu besar.']);
  assert.deepEqual(rincian(angka({ toleransi: -1 })), ['Pertanyaan 1: toleransi harus angka 0 atau lebih.']);
  assert.deepEqual(rincian(angka({ toleransi: 'banyak' })), ['Pertanyaan 1: toleransi harus angka 0 atau lebih.']);
  assert.deepEqual(rincian(angka({ unit: 'kilogram sekali' })), ['Pertanyaan 1: satuan maksimal 12 karakter.']);
  const l = sah(angka({ nilai: '2', unit: 'peti', options: [{ label: 'x' }], benar: ['o1'] })).steps[0];
  assert.deepEqual(l, { id: 's1', kind: 'number', prompt: 'Berapa peti?', penjelasan: 'Dua peti.', nilai: 2, toleransi: 0, unit: 'peti', format: 'angka' });
});

test('validasi: kiriman yang bukan objek ditolak tanpa melempar', () => {
  for (const raw of [null, undefined, 'teks', 42, [], [kiriman()]]) {
    assert.deepEqual(rincian(raw), ['Data soal tidak terbaca.']);
  }
  // Nilai "beracun" (toString bukan fungsi) tidak menjatuhkan validasi.
  const racun = { toString: 1, valueOf: 1 };
  assert.ok(rincian(kiriman({ title: racun, steps: [langkah({ prompt: racun, options: [racun, racun], benar: [racun] })] })).length > 0);
});

// ------------------------------------------------------------------ konversi -> misi + kunci

test('konversi: soal kustom -> MissionPublic (tanpa kunci) + MissionKey yang konsisten', () => {
  for (const soal of [SOAL_A, SOAL_B, SOAL_C]) {
    const { misi, kunci } = kustomKeMisi(soal);
    assert.deepEqual(periksaKunciMisi(misi, kunci), [], soal.id);
    assert.equal(misi.id, soal.id);
    assert.equal(misi.scene, 'gambar');
    assert.equal(misi.level, soal.tingkat);
    assert.equal(misi.durationSeconds, soal.durationSeconds);
    assert.equal(misi.briefingSeconds, 10);
    assert.equal(misi.rakiBriefing, soal.story);
    assert.deepEqual(misi.image, soal.image);
    const publik = JSON.stringify(misi);
    for (const l of soal.steps) assert.equal(publik.includes(l.penjelasan), false, 'penjelasan tidak ada di misi publik');
    assert.equal(publik.includes('benar'), false);
    assert.equal(publik.includes('nilai'), false);
  }
  const b = kustomKeMisi(SOAL_B);
  assert.equal(b.misi.productLabel, 'FIRE / PROPERTY - Kebakaran & Harta Benda');
  assert.equal(b.misi.interactionLabel, 'Pilih 2 jawaban');
  const langkahB = b.misi.steps[0];
  assert.ok(langkahB.kind === 'multi' && langkahB.requiredSelections === 2);
  assert.deepEqual(b.kunci.steps[0].multi, ['kronologi', 'foto']);
  assert.equal(kustomKeMisi(SOAL_C).misi.interactionLabel, 'Jawab 2 pertanyaan');
});

test('konversi: hasilnya dinilai gradeMission seperti misi bawaan', () => {
  const a = kustomKeMisi(SOAL_A);
  assert.equal(gradeMission(a.kunci, { s1: 'o1' }).accuracy, 1);
  assert.equal(gradeMission(a.kunci, { s1: 'o2' }).accuracy, 0);
  assert.equal(gradeMission(a.kunci, {}).accuracy, 0);

  const b = kustomKeMisi(SOAL_B);
  assert.equal(gradeMission(b.kunci, { s1: ['kronologi', 'foto'] }).accuracy, 1);
  assert.equal(gradeMission(b.kunci, { s1: ['kronologi'] }).accuracy, 0.5);
  assert.equal(gradeMission(b.kunci, { s1: ['kronologi', 'foto', 'brosur', 'struk'] }).accuracy, 0, 'pilih semua = 0');

  const c = kustomKeMisi(SOAL_C);
  assert.equal(gradeMission(c.kunci, { s1: 5_000_000, s2: 4 }).accuracy, 1);
  assert.equal(gradeMission(c.kunci, { s1: 5_000_000, s2: 5 }).accuracy, 1, 'dalam toleransi');
  assert.equal(gradeMission(c.kunci, { s1: 5_000_001, s2: 6 }).accuracy, 0, 'tanpa toleransi harus persis');
  assert.equal(gradeMission(c.kunci, { s1: 5_000_000 }).accuracy, 0.5);
});

test('konversi: pembahasan (buildReveal) berisi teks jawaban; tanpa terjemahan', () => {
  const c = kustomKeMisi(SOAL_C);
  const reveal = buildReveal(c.misi, c.kunci);
  assert.deepEqual(reveal.steps.map((s) => s.correctText), [['Rp5.000.000'], ['4 peti']]);
  assert.equal(reveal.summary, 'Rp5.000.000 | 4 peti');
  assert.equal(reveal.learning, SOAL_C.learning);
  assert.equal(reveal.terjemahan, undefined);
  const b = kustomKeMisi(SOAL_B);
  assert.deepEqual(buildReveal(b.misi, b.kunci).steps[0].correctText, ['Kronologi kejadian', 'Foto kerusakan']);
  // Paket bawaan tetap membawa terjemahan pembahasan.
  const m1 = cariSoal('m01-parkir')!;
  assert.ok(buildReveal(m1.misi, m1.kunci).terjemahan?.en?.summary);
});

// ------------------------------------------------------------------ playlist room

test('room: tanpa playlist = paket latihan 10 soal (perilaku lama)', () => {
  const { manager } = managerBaru();
  const room = manager.create();
  assert.deepEqual(room.playlist, MISSIONS.map((m) => m.id));
  assert.equal(room.totalRounds, 10);
  assert.equal(room.tiebreakRound, 10);
  assert.equal(room.publicState().totalRounds, 10);
  // Playlist berisi id yang semuanya tak dikenal -> jatuh ke paket latihan, bukan room tanpa soal.
  assert.equal(manager.create('x', ['hantu']).totalRounds, 10);
});

test('room: playlist kustom 3 soal berjalan sampai FINISHED dengan totalRounds 3', () => {
  const { manager, clock, bank } = managerBaru();
  const playlist = ['k-aaaaaaaa', 'm05-polis-mana', 'k-cccccccc'];
  const room = manager.create('Acara Kustom', playlist);
  room.settings.autoAdvance = false;
  const ani = room.addPlayer('Ani', sanitizeLook({}));
  const budi = room.addPlayer('Budi', sanitizeLook({}));

  const lobby = room.publicState();
  assert.equal(lobby.totalRounds, 3);
  assert.equal(lobby.mission, null);
  assert.equal(JSON.stringify(lobby).includes('k-cccccccc'), false, 'playlist tidak disiarkan ke pemain');
  assert.equal('playlist' in lobby, false);

  room.startMatch();
  for (let i = 0; i < 3; i++) {
    assert.equal(room.phase, 'BRIEFING');
    assert.equal(room.roundIndex, i);
    const st = room.publicState();
    assert.equal(st.mission?.id, playlist[i]);
    assert.equal(st.mission?.number, i + 1, 'nomor misi = posisi + 1');
    assert.equal(st.reveal, null);
    const e = bank.cari(playlist[i])!;
    for (const sk of e.kunci.steps) {
      assert.equal(JSON.stringify(st).includes(sk.explanation), false, 'penjelasan belum keluar sebelum REVEAL');
    }

    room.next(); // ACTIVE
    clock.advance(1000);
    assert.equal(room.submit(ani, i, jawabanTepat(e)).accepted, true);
    assert.equal(room.submit(budi, i, {}).accepted, true);
    room.closeRound();
    const rv = room.publicState();
    assert.equal(rv.phase, 'REVEAL');
    assert.equal(rv.reveal?.missionId, playlist[i]);
    assert.equal(rv.reveal?.roundIndex, i, 'roundIndex pembahasan = posisi di playlist');
    assert.equal(rv.reveal?.steps.length, e.kunci.steps.length);
    assert.equal(room.submissionOf(ani.id, i)!.accuracy, 1);
    room.next(); // LEADERBOARD
    room.next(); // ronde berikutnya / FINISHED
  }

  assert.equal(room.phase, 'FINISHED');
  assert.equal(room.publicState().totalRounds, 3);
  assert.equal(ani.rounds.length, 3);
  assert.equal(room.podium![0].playerId, ani.id);
  assert.equal(room.podium![0].answeredCount, 3);
  // m05 dimainkan di posisi 2: nomor & durasinya mengikuti playlist, bukan indeks paket latihan.
  assert.equal(room.missionForRound(1)?.number, 2);
  assert.equal(room.missionForRound(1)?.durationSeconds, MISSIONS[4].durationSeconds);
  assert.equal(room.missionForRound(3)?.id, TIEBREAK_MISSION.id);
  assert.equal(room.missionForRound(4), null);

  const lencana = room.privateState(ani).badges.map((b) => b.id);
  assert.ok(lencana.includes('juara'));
  assert.ok(lencana.includes('lengkap'));
  assert.ok(lencana.includes('kilat'), 'playlist pendek: cukup menjawab cepat di semua soalnya');
  for (const id of ['detektif', 'teliti', 'pahlawan-kota']) assert.equal(lencana.includes(id), false, id);

  const csv = buildResultsCsv(room);
  assert.match(csv, /misi3_poin/);
  assert.equal(csv.includes('misi4_poin'), false, 'kolom CSV mengikuti playlist');
  assert.equal(csv.includes('penentuan_poin'), false);
  assert.match(csv, /# misi 1,Foto mana yang dipakai\?/);
  assert.match(csv, /# misi 3,Hitung risiko sendiri/);
  room.dispose();
});

test('room: ronde penentuan setelah playlist pendek memakai indeks playlist.length', () => {
  const { manager, clock, bank } = managerBaru();
  const room = manager.create('Seri', ['k-aaaaaaaa', 'k-bbbbbbbb']);
  room.settings.autoAdvance = false;
  const a = room.addPlayer('Ani', sanitizeLook({}));
  const b = room.addPlayer('Budi', sanitizeLook({}));
  room.startMatch();
  assert.throws(() => room.startTiebreak(), /setelah pertandingan selesai/);
  for (let i = 0; i < 2; i++) {
    room.next();
    clock.advance(500);
    // Jawaban & waktu identik -> seri.
    room.submit(a, i, jawabanTepat(bank.cari(room.playlist[i])!));
    room.submit(b, i, jawabanTepat(bank.cari(room.playlist[i])!));
    room.closeRound();
    room.next();
    room.next();
  }
  assert.equal(room.phase, 'FINISHED');
  assert.equal(room.publicState().tie, true);

  room.startTiebreak();
  assert.equal(room.roundIndex, 2);
  assert.equal(room.publicState().mission?.id, TIEBREAK_MISSION.id);
  assert.equal(room.publicState().totalRounds, 2, 'ronde penentuan tidak menambah totalRounds');
  room.next();
  clock.advance(700);
  assert.equal(room.submit(a, 2, { penentuan: 'identitas-kronologi' }).accepted, true);
  assert.equal(room.submit(b, 2, { penentuan: 'warna-favorit' }).accepted, true);
  assert.equal(room.submit(b, 10, { penentuan: 'identitas-kronologi' }).accepted, false, 'indeks 10 milik paket 10 soal');
  room.closeRound();
  assert.equal(room.publicState().reveal?.roundIndex, 2);
  assert.equal(room.publicState().reveal?.missionId, TIEBREAK_MISSION.id);
  room.next(); // LEADERBOARD
  room.next(); // FINISHED (bukan ronde "berikutnya")
  assert.equal(room.phase, 'FINISHED');
  assert.equal(room.podium![0].playerId, a.id);
  assert.equal(room.publicState().tie, false);
  assert.throws(() => room.startTiebreak(), /sudah dipakai/);
  assert.match(buildResultsCsv(room), /misi2_poin.*penentuan_poin/);
  assert.equal(buildResultsCsv(room).includes('misi3_poin'), false);
  room.dispose();
});

test('room: setPlaylist hanya saat LOBBY; id tak dikenal, duplikat, dan jumlah di luar 1-20 ditolak', () => {
  const { manager } = managerBaru();
  const room = manager.create();
  room.addPlayer('Ani', sanitizeLook({}));

  assert.deepEqual(room.setPlaylist(['k-bbbbbbbb', 'm03-berkas-ruko']), ['k-bbbbbbbb', 'm03-berkas-ruko']);
  assert.equal(room.totalRounds, 2);

  const galat = (raw: unknown) => {
    try {
      room.setPlaylist(raw);
    } catch (err) {
      return (err as Error).message;
    }
    return 'diterima';
  };
  assert.equal(galat(['m01-parkir', 'k-hantuuuu']), GALAT_PLAYLIST.takDikenal);
  assert.equal(galat(['m01-parkir', TIEBREAK_MISSION.id]), GALAT_PLAYLIST.takDikenal, 'ronde penentuan bukan soal playlist');
  assert.equal(galat(['m01-parkir', 'tutorial']), GALAT_PLAYLIST.takDikenal);
  assert.equal(galat(['m01-parkir', 'm02-detektif-penyok', 'm01-parkir']), GALAT_PLAYLIST.ganda);
  assert.equal(galat([]), GALAT_PLAYLIST.jumlah);
  assert.equal(galat(Array.from({ length: 21 }, (_, i) => `m${i}`)), GALAT_PLAYLIST.jumlah);
  assert.equal(galat('m01-parkir'), GALAT_PLAYLIST.bentuk);
  assert.equal(galat([1, 2]), GALAT_PLAYLIST.bentuk);
  assert.equal(galat({ length: 1, 0: 'm01-parkir' }), GALAT_PLAYLIST.bentuk);
  assert.deepEqual(room.playlist, ['k-bbbbbbbb', 'm03-berkas-ruko'], 'playlist lama utuh setelah penolakan');

  // 20 soal = batas atas yang sah (bank tiruan tidak punya 20 soal, jadi diuji lewat periksaPlaylist).
  const duaPuluh = Array.from({ length: 20 }, (_, i) => `x${i}`);
  assert.equal(periksaPlaylist(duaPuluh, () => cariSoal('m01-parkir')).length, 20);

  room.startTutorial();
  assert.equal(galat(['m01-parkir']), GALAT_PLAYLIST.bukanLobby);
  room.backToLobby();
  room.startMatch();
  assert.equal(galat(['m01-parkir']), GALAT_PLAYLIST.bukanLobby);
  room.finish();
  assert.equal(galat(['m01-parkir']), GALAT_PLAYLIST.bukanLobby);
  room.reset();
  assert.deepEqual(room.setPlaylist(['m01-parkir']), ['m01-parkir']);
  room.dispose();
});

test('room: soal kustom dibekukan saat pertandingan mulai; yang dihapus dibuang dari playlist', () => {
  const { manager, clock, bank } = managerBaru();
  const room = manager.create('Beku', ['k-aaaaaaaa', 'k-bbbbbbbb']);
  const ani = room.addPlayer('Ani', sanitizeLook({}));

  // Disunting saat lobby -> versi terbaru yang dimainkan.
  bank.isi.set('k-aaaaaaaa', { ...SOAL_A, title: 'Judul baru', steps: [{ ...SOAL_A.steps[0], benar: ['o2'] }] });
  room.startMatch();
  assert.equal(room.publicState().mission?.title, 'Judul baru');

  // Disunting / dihapus di tengah pertandingan -> ronde berjalan tidak berubah.
  bank.isi.set('k-aaaaaaaa', { ...SOAL_A, title: 'Disunting lagi' });
  bank.isi.delete('k-bbbbbbbb');
  room.next();
  clock.advance(500);
  room.submit(ani, 0, { s1: 'o2' });
  room.closeRound();
  assert.equal(room.publicState().mission?.title, 'Judul baru');
  assert.equal(room.submissionOf(ani.id, 0)!.accuracy, 1, 'dinilai dengan kunci yang dibekukan');
  room.next();
  room.next();
  assert.equal(room.publicState().mission?.id, 'k-bbbbbbbb', 'soal yang dihapus tetap ada sampai pertandingan selesai');
  room.finish();

  // Kembali ke lobby: id yang sudah tidak ada di bank hilang dari playlist.
  room.reset();
  assert.deepEqual(room.playlist, ['k-aaaaaaaa']);
  assert.equal(room.buangDariPlaylist('k-aaaaaaaa', ['m01-parkir', 'm02-detektif-penyok']), true);
  assert.deepEqual(room.playlist, ['m01-parkir', 'm02-detektif-penyok'], 'playlist kosong diganti cadangan');
  assert.equal(room.buangDariPlaylist('k-aaaaaaaa', []), false);

  // Semua soal playlist lenyap dari bank -> pertandingan tidak bisa dimulai tanpa soal.
  room.setPlaylist(['k-cccccccc']);
  bank.isi.delete('k-cccccccc');
  assert.throws(() => room.startMatch(), new RegExp(GALAT_PLAYLIST.kosong.slice(0, 15)));
  assert.equal(room.phase, 'LOBBY');
  room.dispose();
});

// ------------------------------------------------------------------ lencana, gambar, cache terjemahan

test('lencana: lencana per-misi bisa dimatikan; kilat menyesuaikan panjang playlist', () => {
  const ronde = (n: number): RoundResult[] =>
    Array.from({ length: n }, (_, i) => ({
      roundIndex: i,
      answered: true,
      accuracy: 1,
      basePoints: 1000,
      speedBonus: 300,
      roundScore: 1300,
      elapsedMs: 2000,
    }));
  const penuh = computeBadges(ronde(10), 2, MISSIONS).map((b) => b.id);
  assert.deepEqual(penuh, ['tepat-sasaran', 'kilat', 'lengkap', 'detektif', 'teliti', 'pahlawan-kota']);
  const campuran = computeBadges(ronde(10), 2, MISSIONS, { lencanaMisi: false }).map((b) => b.id);
  assert.deepEqual(campuran, ['tepat-sasaran', 'kilat', 'lengkap']);
  // Paket 10 soal tetap butuh 8 jawaban untuk "kilat".
  assert.equal(computeBadges(ronde(7), 2, MISSIONS).some((b) => b.id === 'kilat'), false);
  assert.equal(computeBadges(ronde(3), 2, MISSIONS.slice(0, 3)).some((b) => b.id === 'kilat'), true);
});

test('gambar: jenis dikenali dari magic bytes; SVG & teks ditolak', () => {
  const isi = (awal: number[]) => Buffer.concat([Buffer.from(awal), Buffer.alloc(32)]);
  assert.equal(kenaliGambar(isi([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'png');
  assert.equal(kenaliGambar(isi([0xff, 0xd8, 0xff, 0xe0])), 'jpg');
  assert.equal(kenaliGambar(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(16)])), 'webp');
  assert.equal(kenaliGambar(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVEfmt '), Buffer.alloc(16)])), null);
  assert.equal(kenaliGambar(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), null);
  assert.equal(kenaliGambar(Buffer.from('<?xml version="1.0"?><svg></svg>')), null);
  assert.equal(kenaliGambar(Buffer.from('GIF89a' + 'x'.repeat(20))), null);
  assert.equal(kenaliGambar(Buffer.from([0x89, 0x50])), null);
  assert.equal(kenaliGambar(Buffer.alloc(0)), null);
});

test('terjemahan misi: nomor mengikuti kiriman (tidak basi) dan objek stabil untuk isi yang sama', () => {
  const m5 = MISSIONS[4];
  const asli = terjemahkanMisi(m5, 'en');
  assert.equal(asli.number, 5);
  assert.notEqual(asli.title, m5.title, 'judul diterjemahkan');

  const diPosisi2 = terjemahkanMisi({ ...m5, number: 2 }, 'en');
  assert.equal(diPosisi2.number, 2, 'misi yang sama di posisi playlist lain membawa nomor barunya');
  assert.equal(diPosisi2.title, asli.title);
  assert.equal(terjemahkanMisi(m5, 'en').number, 5, 'nomor lama tetap benar setelahnya');

  // Siaran state berulang (objek baru, isi sama) -> objek hasil yang sama, adegan client tidak dibangun ulang.
  assert.equal(terjemahkanMisi({ ...m5, number: 2 }, 'en'), diPosisi2);
  assert.equal(terjemahkanMisi({ ...m5 }, 'en'), asli);
  assert.equal(terjemahkanMisi({ ...m5, durationSeconds: 99 }, 'en').durationSeconds, 99, 'isi berubah -> tidak pakai cache');
  assert.equal(terjemahkanMisi({ ...m5, level: 3 }, 'zh').level, 3);

  // Soal kustom tidak punya lapisan terjemahan: dikembalikan apa adanya, suntingan langsung tampil.
  const kustom = { ...kustomKeMisi(SOAL_A).misi, number: 1 };
  assert.equal(terjemahkanMisi(kustom, 'en'), kustom);
  const disunting = { ...kustom, title: 'Judul sesudah disunting' };
  assert.equal(terjemahkanMisi(disunting, 'en').title, 'Judul sesudah disunting');
});
