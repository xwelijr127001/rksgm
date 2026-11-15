/**
 * Aktivitas EPISODE AUTO-2: delapan keputusan naskah yang dijalankan sebagai TINDAKAN pada benda kasus di ARENA HP
 * (client/src/cerita/hp/arena; konfigurasi benda & tujuan di ./arena.ts): dokumen ke baki, Mas Rudi ke lokasi di peta,
 * foto ke tujuannya, kartu pemeriksaan ke papan rencana, kartu saksi, stempel perbedaan, bundel + kabar, susun pesan.
 * Misi sintetis tetap menjadi format jawaban & rubrik (scene 'gambar': tanpa adegan 2D Phaser). Setiap aktivitas punya
 * node `langsung` di episode.ts: susunan yang LENGKAP (wajib) dipetakan oleh aturan eksplisit & berurutan ke tepat satu
 * dari lima alternatif naskah (A-E), lalu akibat naskah tampil sebagai dialog. Tidak ada penilaian kombinasi bebas.
 *
 * `kunci` = susunan alternatif yang disarankan naskah (dipakai mesin untuk tanda akt:<id>:tepat|sebagian|belum dan tanda
 * susunan akt:<id>:taruh:<item>:<wadah> / akt:<id>:pilih:<opsi>); kondisi cabang di episode.ts hanya membaca tanda susunan.
 * Mode cerita tidak bertanding: kunci & alasan memang ada di bundel klien (lihat batas keamanan di docs/cerita).
 * Teks: kunci `akt.<id>.*` di teks.id.ts. Id misi, langkah, item, wadah, dan opsi TETAP (dipakai tanda & simpanan).
 */
import type { Bahasa } from '@shared/bahasa';
import type { IconKey, MissionPublic, StepDef } from '@shared/types';
import type { StepKey } from '@shared/scoring';
import { teksCerita } from '../../teks';
import type { DefAktivitas, IdAktivitas, KunciTeks } from '../../tipe';
import { ARENA_AUTO_2, PESAN_AUTO_2 } from './arena';
import { TEKS_AUTO_2 } from './teks';

const SUMBER = { teks: TEKS_AUTO_2 };
const penerjemah = (bahasa: Bahasa) => (kunci: KunciTeks) => teksCerita(SUMBER, kunci, bahasa);

/** Satu aktivitas: misi sintetis (format jawaban & rubrik; tampilannya arena HP) + kunci + label tombol kirim. */
interface Rancangan {
  id: IdAktivitas;
  /** Titik keputusan naskah yang dijalankan aktivitas ini (judul & alasan ringkasan akhir dipakai ulang). */
  titik: string;
  langkah: (tx: (k: KunciTeks) => string) => StepDef[];
  kunci: StepKey[];
  /** Tabel dokumen di "Dokumen" (dibaca sebelum menyusun). */
  tabel?: (tx: (k: KunciTeks) => string) => NonNullable<MissionPublic['tables']>;
}

function misi(r: Rancangan, bahasa: Bahasa): MissionPublic {
  const tx = penerjemah(bahasa);
  const tabel = r.tabel?.(tx);
  return {
    id: `cerita-auto2-${r.id}`,
    number: 0,
    level: 1,
    title: tx(`akt.${r.id}.judul`),
    product: 'AUTO',
    productLabel: tx(`akt.${r.id}.produk`),
    location: tx(`akt.${r.id}.lokasi`),
    scene: 'gambar',
    image: null,
    story: tx(`akt.${r.id}.cerita`),
    instruction: tx(`akt.${r.id}.instruksi`),
    interactionLabel: tx(`akt.${r.id}.labelInteraksi`),
    durationSeconds: 60,
    briefingSeconds: 0,
    // Tidak dipakai mode cerita (tanpa pembahasan & briefing Raki): saran & alasan ada di ringkasan akhir.
    learning: '',
    rakiBriefing: '',
    steps: r.langkah(tx),
    ...(tabel ? { tables: tabel } : {}),
  };
}

/** Langkah susun (assign): item & wadah dari kunci teks `akt.<id>.item.<x>` / `akt.<id>.wadah.<y>`. */
function susun(id: IdAktivitas, stepId: string, item: readonly (readonly [string, IconKey])[], wadah: readonly (readonly [string, IconKey])[], presentasi: 'sort' | 'match') {
  return (tx: (k: KunciTeks) => string): StepDef => ({
    kind: 'assign',
    id: stepId,
    prompt: tx(`akt.${id}.tanya`),
    hint: tx(`akt.${id}.petunjuk`),
    presentation: presentasi,
    weight: 1,
    items: item.map(([x, icon]) => ({ id: x, label: tx(`akt.${id}.item.${x}`), icon })),
    buckets: wadah.map(([y, icon]) => ({ id: y, label: tx(`akt.${id}.wadah.${y}`), icon })),
  });
}

/** Langkah assign "tandai lajur" untuk satu rambu: empat lajur (item) ke satu wadah "ditandai". */
function tandaLajur(rambu: 'r1' | 'r2') {
  return (tx: (k: KunciTeks) => string): StepDef => ({
    kind: 'assign',
    id: rambu,
    prompt: tx(`akt.rambu.tanya.${rambu}`),
    hint: tx('akt.rambu.petunjuk.lajur'),
    presentation: 'match',
    weight: 1,
    items: [1, 2, 3, 4].map((n) => ({ id: `${rambu}l${n}`, label: tx(`akt.rambu.item.${rambu}l${n}`), icon: 'lokasi' as IconKey })),
    buckets: [{ id: 'tanda', label: tx('akt.rambu.wadah.tanda'), icon: 'cek' as IconKey }],
  });
}

const RANCANGAN: Rancangan[] = [
  // K02: delapan dokumen ke tiga baki.
  {
    id: 'berkas',
    titik: 'k02',
    langkah: (tx) => [susun('berkas', 'berkas', [
      ['rekening', 'struk'], ['stnk', 'dokumen'], ['suratpolisi', 'polis'], ['ktp', 'dokumen'],
      ['kk', 'daftar'], ['formulir', 'daftar'], ['slip', 'uang'], ['sim', 'dokumen'],
    ], [['sekarang', 'kilat'], ['menyusul', 'jam'], ['tidak', 'silang']], 'sort')(tx)],
    kunci: [{
      stepId: 'berkas', weight: 1, explanation: '',
      assign: { formulir: 'sekarang', stnk: 'sekarang', ktp: 'sekarang', sim: 'sekarang', suratpolisi: 'menyusul', kk: 'tidak', slip: 'tidak', rekening: 'tidak' },
    }],
  },
  // K04: kartu Mas Rudi ke salah satu dari lima tujuan pemeriksaan.
  {
    id: 'surveyor',
    titik: 'k04',
    langkah: (tx) => [susun('surveyor', 'tujuan', [['rudi', 'operator']], [
      ['kantor', 'gudang'], ['foto', 'kamera'], ['pool', 'lokasi'], ['bengkel', 'obeng'], ['langganan', 'struk'],
    ], 'match')(tx)],
    kunci: [{ stepId: 'tujuan', weight: 1, explanation: '', assign: { rudi: 'pool' } }],
  },
  // K05: bundel foto kerusakan ke salah satu dari lima tujuan.
  {
    id: 'foto',
    titik: 'k05',
    langkah: (tx) => [susun('foto', 'tujuan', [['bundel', 'foto']], [
      ['tunggu', 'jam'], ['hendra', 'operator'], ['lain', 'lokasi'], ['mitra', 'obeng'], ['diam', 'silang'],
    ], 'match')(tx)],
    kunci: [{ stepId: 'tujuan', weight: 1, explanation: '', assign: { bundel: 'mitra' } }],
  },
  // K07: kartu pemeriksaan kejadian ke rencana kerja (jalur paralel / berurutan / tidak).
  {
    id: 'jalur',
    titik: 'k07',
    langkah: (tx) => [susun('jalur', 'jalur', [['periksa', 'lokasi']], [
      ['setelah', 'jam'], ['jelas', 'polis'], ['telepon', 'operator'], ['percaya', 'cek'], ['paralel', 'kilat'],
    ], 'match')(tx)],
    kunci: [{ stepId: 'jalur', weight: 1, explanation: '', assign: { periksa: 'paralel' } }],
    tabel: (tx) => [{
      id: 'rencana',
      title: tx('akt.jalur.tabel.judul'),
      icon: 'daftar',
      rows: [1, 2, 3].map((n) => ({ label: tx(`akt.jalur.tabel.${n}`), value: tx(`akt.jalur.tabel.${n}.isi`) })),
    }],
  },
  // K08: tandai lajur untuk dua rambu, lalu kesimpulan (satu dari lima kalimat naskah). Kunci rambu 1 = lajur yang disebut
  // tulisannya (hanya untuk ketepatan sesaat); tafsir rambu 2 ("lajur kiri") BELUM dikonfirmasi, jadi tanpa kunci. Hasil cabang
  // hanya dari kesimpulan (akt:rambu:pilih:<alt>); tanda lajur dibaca tanggapan tokoh dan ringkasan.
  {
    id: 'rambu',
    titik: 'k08',
    langkah: (tx) => [
      tandaLajur('r1')(tx),
      tandaLajur('r2')(tx),
      {
        kind: 'single', id: 'simpul', prompt: tx('akt.rambu.tanya'), hint: tx('akt.rambu.petunjuk'), presentation: 'cards', weight: 1,
        options: (['c', 'e', 'a', 'd', 'b'] as const).map((o) => ({ id: o, label: tx(`k08.${o}`), icon: 'dokumen' as IconKey })),
      },
    ],
    kunci: [
      { stepId: 'r1', weight: 1, explanation: '', assign: { r1l3: 'tanda', r1l4: 'tanda' } },
      { stepId: 'r2', weight: 1, explanation: '', assign: {} },
      { stepId: 'simpul', weight: 1, explanation: '', single: 'c' },
    ],
  },
  // K09: lima kartu saksi -> wawancarai / tidak perlu.
  {
    id: 'saksi',
    titik: 'k09',
    langkah: (tx) => [susun('saksi', 'saksi', [
      ['polisi', 'operator'], ['hendra', 'operator'], ['mobilkecil', 'mobil'], ['darto', 'operator'], ['tol', 'operator'],
    ], [['ya', 'cek'], ['tidak', 'silang']], 'sort')(tx)],
    kunci: [{ stepId: 'saksi', weight: 1, explanation: '', assign: { hendra: 'ya', darto: 'ya', tol: 'ya', polisi: 'ya', mobilkecil: 'tidak' } }],
  },
  // K10: tiga perbedaan keterangan -> cara mencatatnya.
  {
    id: 'selisih',
    titik: 'k10',
    langkah: (tx) => [susun('selisih', 'selisih', [['nama', 'dokumen'], ['antisipasi', 'dokumen'], ['jam', 'jam']], [
      ['catat', 'daftar'], ['samakan', 'obeng'], ['ulang', 'operator'], ['abaikan', 'silang'], ['tolak', 'polis'],
    ], 'sort')(tx)],
    kunci: [{ stepId: 'selisih', weight: 1, explanation: '', assign: { jam: 'catat', nama: 'catat', antisipasi: 'catat' } }],
    tabel: (tx) => [{
      id: 'fakta',
      title: tx('akt.selisih.tabel.judul'),
      icon: 'daftar',
      rows: [1, 2, 3, 4].map((n) => ({ label: tx(`akt.selisih.tabel.${n}`), value: tx(`akt.selisih.tabel.${n}.isi`) })),
    }],
  },
  // K11: dua langkah: tindakan atas bundel + kabar untuk Pak Hendra.
  {
    id: 'bundel',
    titik: 'k11',
    langkah: (tx) => [
      {
        kind: 'single', id: 'bundel', prompt: tx('akt.bundel.tanya1'), hint: tx('akt.bundel.petunjuk1'), presentation: 'cards', weight: 1,
        options: (['sekarang', 'lengkapi', 'hendra'] as const).map((o) => ({ id: o, label: tx(`akt.bundel.opsi.${o}`), icon: 'dokumen' as const })),
      },
      {
        kind: 'single', id: 'kabar', prompt: tx('akt.bundel.tanya2'), hint: tx('akt.bundel.petunjuk2'), presentation: 'cards', weight: 1,
        options: (['nanti', 'disetujui', 'persetujuan'] as const).map((o) => ({ id: o, label: tx(`akt.bundel.opsi.${o}`), icon: 'operator' as const })),
      },
    ],
    kunci: [
      { stepId: 'bundel', weight: 1, explanation: '', single: 'lengkapi' },
      { stepId: 'kabar', weight: 1, explanation: '', single: 'persetujuan' },
    ],
    tabel: (tx) => [{
      id: 'isi-bundel',
      title: tx('akt.bundel.tabel.judul'),
      icon: 'daftar',
      rows: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
        label: tx(`akt.bundel.tabel.${n}`),
        value: tx(n === 7 ? 'akt.bundel.tabel.belum' : 'akt.bundel.tabel.ada'),
      })),
      note: tx('akt.bundel.tabel.catatan'),
    }],
  },
  // K15: enam bagian pesan penutupan -> masuk / tidak.
  {
    id: 'tutup',
    titik: 'k15',
    langkah: (tx) => [susun('tutup', 'pesan', [
      ['bintang', 'bintang'], ['kabar', 'uang'], ['jujur', 'daftar'], ['bukti', 'struk'], ['polis', 'polis'], ['langkah', 'dokumen'],
    ], [['masuk', 'cek'], ['tidak', 'silang']], 'sort')(tx)],
    kunci: [{
      stepId: 'pesan', weight: 1, explanation: '',
      assign: { kabar: 'masuk', bukti: 'masuk', langkah: 'masuk', jujur: 'masuk', bintang: 'tidak', polis: 'tidak' },
    }],
  },
];

function definisi(r: Rancangan): DefAktivitas {
  return {
    id: r.id,
    misi: (bahasa) => misi(r, bahasa),
    kunci: r.kunci,
    penjelasan: Object.fromEntries(r.kunci.map((k) => [k.stepId, `titik.${r.titik}.alasan`])),
    ringkasan: `titik.${r.titik}.judul`,
    labelKirim: `akt.${r.id}.kirim`,
    fokus: 'baca',
    arena: ARENA_AUTO_2[r.id],
    ...(PESAN_AUTO_2[r.id] ? { pesanObrolan: PESAN_AUTO_2[r.id] } : {}),
  };
}

export const AKTIVITAS_AUTO_2: Record<IdAktivitas, DefAktivitas> = Object.fromEntries(RANCANGAN.map((r) => [r.id, definisi(r)]));
