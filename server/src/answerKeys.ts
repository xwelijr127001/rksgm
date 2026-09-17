/**
 * KUNCI JAWABAN + RUBRIC - SERVER ONLY.
 * File ini tidak pernah di-import client. Isinya hanya dikirim ke client
 * (dalam bentuk MissionReveal) setelah ronde ditutup / fase REVEAL.
 */

import type { MissionKey } from '../../shared/scoring';
import type { MissionPublic, MissionReveal, StepDef, StepReveal } from '../../shared/types';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '../../shared/missions';

export const MISSION_KEYS: MissionKey[] = [
  {
    missionId: 'm01-parkir',
    roundIndex: 0,
    summary:
      'Dokumentasikan kerusakan lebih dulu, lalu laporkan melalui kanal klaim agar kejadian tercatat rapi.',
    steps: [
      {
        stepId: 's1',
        weight: 1,
        single: 'dokumentasi',
        explanation:
          'Memperbaiki, membuang bagian rusak, atau mengabaikan kejadian membuat bukti hilang. Dokumentasi + laporan menjaga jejak kejadian.',
      },
    ],
  },
  {
    missionId: 'm02-detektif-penyok',
    roundIndex: 1,
    summary: 'Tiga bukti yang menghubungkan kendaraan, titik kerusakan, dan identitasnya.',
    steps: [
      {
        stepId: 'bukti',
        weight: 1,
        multi: ['foto-full', 'foto-depan-kiri', 'foto-identitas'],
        requiredSelections: 3,
        explanation:
          'Foto keseluruhan menunjukkan kondisi kendaraan, foto detail depan kiri menunjukkan titik benturan, foto identitas memastikan kendaraan yang diperiksa benar. Foto makanan, selfie, dan kucing tidak membantu pemeriksaan.',
      },
    ],
  },
  {
    missionId: 'm03-berkas-ruko',
    roundIndex: 2,
    summary: 'Empat dokumen sesuai checklist laporan awal masuk folder.',
    steps: [
      {
        stepId: 'berkas',
        weight: 1,
        multi: ['kronologi', 'foto-kerusakan', 'daftar-barang', 'estimasi'],
        requiredSelections: 4,
        explanation:
          'Checklist laporan awal: kronologi, foto kerusakan, daftar barang terdampak, dan estimasi kerugian. Brosur promo dan struk kopi tidak berkaitan dengan kejadian.',
      },
    ],
  },
  {
    missionId: 'm04-excavator',
    roundIndex: 3,
    summary:
      'Empat informasi pemeriksaan: identitas unit, posisi unit, bagian yang rusak, dan keterangan operator.',
    steps: [
      {
        stepId: 'temuan',
        weight: 1,
        multi: ['seri', 'posisi', 'rusak', 'operator'],
        requiredSelections: 4,
        explanation:
          'Nomor seri memastikan unit yang diperiksa, posisi unit dan bagian rusak menjelaskan kejadian, keterangan operator melengkapi kronologi. Spanduk, warung, dan awan tidak menambah informasi pemeriksaan.',
      },
    ],
  },
  {
    missionId: 'm05-polis-mana',
    roundIndex: 4,
    summary:
      'Kartu A (Comprehensive) dapat dilanjutkan; kartu B (TLO) belum memenuhi ambang kerusakan total pada simulasi.',
    steps: [
      {
        stepId: 'cocok',
        weight: 1,
        assign: { 'kasus-a': 'lanjut', 'kasus-b': 'tidak-ambang' },
        explanation:
          'Kartu A menyatakan kerusakan benturan tercakup, jadi penilaian dapat dilanjutkan. Kartu B adalah TLO dengan ambang minimal 75% nilai kendaraan; kerusakan Rp4 juta dari nilai Rp200 juta hanya 2%, sehingga tidak memenuhi ambang pada simulasi ini.',
      },
    ],
  },
  {
    missionId: 'm06-paket-penyok',
    roundIndex: 5,
    summary:
      'Selisih 2 peti, 2 peti diterima dengan kemasan rusak, lalu dokumentasikan ketidaksesuaian dan lengkapi dokumen pengangkutan.',
    steps: [
      {
        stepId: 'selisih',
        weight: 1,
        number: { value: 2 },
        explanation: '10 peti dikirim - 8 peti diterima = selisih 2 peti.',
      },
      {
        stepId: 'rusak',
        weight: 1,
        number: { value: 2 },
        explanation: 'Bukti penerimaan dan foto menunjukkan 2 peti diterima dengan kemasan rusak.',
      },
      {
        stepId: 'tindak',
        weight: 2,
        single: 'dokumentasi',
        explanation:
          'Ketidaksesuaian jumlah dan kondisi kemasan perlu dicatat, lalu dokumen pengangkutan dilengkapi untuk pemeriksaan. Jangan menyimpulkan seluruh kerugian otomatis dijamin.',
      },
    ],
  },
  {
    missionId: 'm07-banjir-gudang',
    roundIndex: 6,
    summary: 'Polis A, karena perluasan banjir tercantum dan periode polis sesuai.',
    steps: [
      {
        stepId: 'polis',
        weight: 1,
        single: 'polis-a',
        explanation:
          'Hanya Polis A mencantumkan perluasan banjir. Polis B tidak mencantumkannya, jadi risiko banjir tidak relevan pada kartu tersebut.',
      },
      {
        stepId: 'alasan',
        weight: 1,
        single: 'perluasan-periode',
        explanation:
          'Alasannya adalah jenis risiko (perluasan banjir tercantum) dan periode polis yang mencakup tanggal kejadian - bukan besar nilai, jarak lokasi, atau anggapan bahwa banjir selalu dijamin.',
      },
    ],
  },
  {
    missionId: 'm08-benturan-keausan',
    roundIndex: 7,
    summary:
      'Panel = terkait kejadian, catatan keausan = kondisi sebelumnya, kerusakan internal = perlu pemeriksaan teknis.',
    steps: [
      {
        stepId: 'klasifikasi',
        weight: 1,
        assign: { panel: 'terkait', 'catatan-aus': 'sebelumnya', internal: 'teknis' },
        explanation:
          'Kartu polis simulasi menjamin benturan dan mengecualikan keausan bertahap. Panel rusak setelah benturan diperiksa sebagai kerusakan terkait kejadian; catatan keausan sebelum kejadian dipisahkan; kerusakan internal yang hubungannya belum jelas perlu pemeriksaan teknis tambahan.',
      },
    ],
  },
  {
    missionId: 'm09-hitung-teliti',
    roundIndex: 8,
    summary: '10% x Rp100.000.000 = Rp10.000.000; risiko sendiri Rp10.000.000; hasil akhir Rp90.000.000.',
    steps: [
      {
        stepId: 'persen',
        weight: 1,
        number: { value: 10_000_000 },
        explanation: '10% dari kerugian yang disetujui Rp100.000.000 adalah Rp10.000.000.',
      },
      {
        stepId: 'risiko',
        weight: 1,
        number: { value: 10_000_000 },
        explanation:
          'Hasil persentase Rp10.000.000 lebih besar dari minimum Rp5.000.000, jadi nilai yang dipakai adalah Rp10.000.000.',
      },
      {
        stepId: 'hasil',
        weight: 2,
        number: { value: 90_000_000 },
        explanation: 'Rp100.000.000 - Rp10.000.000 = Rp90.000.000 pada simulasi ini.',
      },
    ],
  },
  {
    missionId: 'm10-grand-mission',
    roundIndex: 9,
    summary:
      'A: AUTO, cek cakupan banjir, di luar jaminan kartu. B: HVC, cek nomor seri, klarifikasi identitas. C: PROPERTY, cek bukti & objek, lanjut survei.',
    steps: [
      {
        stepId: 'produk',
        weight: 1,
        assign: { 'kasus-a': 'AUTO', 'kasus-b': 'HVC', 'kasus-c': 'PROPERTY' },
        explanation: 'Mobil operasional = AUTO, alat berat = HVC, gudang = FIRE / PROPERTY.',
      },
      {
        stepId: 'periksa',
        weight: 1,
        assign: { 'kasus-a': 'jaminan', 'kasus-b': 'identitas', 'kasus-c': 'bukti' },
        explanation:
          'Kasus A perlu dicek cakupan banjir pada kartu; kasus B perlu dicek nomor seri karena laporan dan kartu berbeda; kasus C bukti awal dan kesesuaian objek sudah lengkap sehingga pemeriksaannya di sisi itu.',
      },
      {
        stepId: 'tindak',
        weight: 2,
        assign: { 'kasus-a': 'luar-jaminan', 'kasus-b': 'klarifikasi', 'kasus-c': 'survei' },
        explanation:
          'A: banjir tidak tercakup pada kartu simulasi, jadi di luar jaminan yang tercantum. B: nomor seri berbeda, klarifikasi identitas unit dulu. C: jaminan, objek, dan bukti sesuai, lanjut ke survei / penilaian sesuai prosedur.',
      },
    ],
  },
];

/** Ronde penentuan; indeks ronde = TOTAL_ROUNDS (10). */
export const TIEBREAK_KEY: MissionKey = {
  missionId: 'm11-penentuan',
  roundIndex: 10,
  summary: 'Identitas kendaraan dan kronologi singkat adalah catatan pertama.',
  steps: [
    {
      stepId: 'penentuan',
      weight: 1,
      single: 'identitas-kronologi',
      explanation:
        'Tanpa identitas objek dan kronologi, pemeriksaan tidak bisa dimulai. Informasi lain tidak berkaitan dengan kejadian.',
    },
  ],
};

export const TUTORIAL_KEY: MissionKey = {
  missionId: 'tutorial',
  roundIndex: -1,
  summary: 'Kartu helm proyek adalah jawabannya. Latihan ini tidak dihitung pada skor kompetisi.',
  steps: [
    {
      stepId: 'latihan',
      weight: 1,
      single: 'helm',
      explanation: 'Begitu caranya: ketuk kartu untuk memilih, lalu tekan Kirim Jawaban.',
    },
  ],
};

export function keyForRound(roundIndex: number): MissionKey | undefined {
  if (roundIndex === TIEBREAK_KEY.roundIndex) return TIEBREAK_KEY;
  return MISSION_KEYS.find((k) => k.roundIndex === roundIndex);
}

export function keyForMissionId(missionId: string): MissionKey | undefined {
  if (missionId === 'tutorial') return TUTORIAL_KEY;
  if (missionId === TIEBREAK_KEY.missionId) return TIEBREAK_KEY;
  return MISSION_KEYS.find((k) => k.missionId === missionId);
}

/** Cari label opsi agar pembahasan tampil sebagai teks, bukan id. */
function labelOf(step: StepDef | undefined, id: string): string {
  if (!step) return id;
  if (step.kind === 'single' || step.kind === 'multi') {
    return step.options.find((o) => o.id === id)?.label ?? id;
  }
  if (step.kind === 'assign') {
    return (
      step.items.find((o) => o.id === id)?.label ??
      step.buckets.find((o) => o.id === id)?.label ??
      id
    );
  }
  if (step.kind === 'order') return step.items.find((o) => o.id === id)?.label ?? id;
  return id;
}

function rupiah(v: number): string {
  return 'Rp' + Math.round(v).toLocaleString('id-ID');
}

/** Ubah kunci jawaban menjadi payload REVEAL yang siap ditampilkan. */
export function buildReveal(mission: MissionPublic, key: MissionKey): MissionReveal {
  const steps: StepReveal[] = key.steps.map((sk) => {
    const step = mission.steps.find((s) => s.id === sk.stepId);
    const correctText: string[] = [];

    if (sk.single !== undefined) correctText.push(labelOf(step, sk.single));
    if (sk.multi !== undefined) correctText.push(...sk.multi.map((id) => labelOf(step, id)));
    if (sk.assign !== undefined) {
      for (const [itemId, bucketId] of Object.entries(sk.assign)) {
        correctText.push(`${labelOf(step, itemId)} -> ${labelOf(step, bucketId)}`);
      }
    }
    if (sk.number !== undefined) {
      const fmt = step && step.kind === 'number' && step.format === 'rupiah';
      correctText.push(
        fmt ? rupiah(sk.number.value) : `${sk.number.value}${step && step.kind === 'number' && step.unit ? ' ' + step.unit : ''}`,
      );
    }
    if (sk.order !== undefined) correctText.push(sk.order.map((id) => labelOf(step, id)).join(' -> '));

    return {
      stepId: sk.stepId,
      prompt: step?.prompt ?? sk.stepId,
      weight: sk.weight,
      correctText,
      explanation: sk.explanation,
    };
  });

  return {
    missionId: mission.id,
    roundIndex: key.roundIndex,
    summary: key.summary,
    learning: mission.learning,
    steps,
  };
}

/** Sanity check saat boot: tiap misi punya kunci untuk semua langkahnya. */
export function assertKeysComplete(): void {
  const problems: string[] = [];
  for (const m of [...MISSIONS, TUTORIAL_MISSION, TIEBREAK_MISSION]) {
    const key = keyForMissionId(m.id);
    if (!key) {
      problems.push(`misi ${m.id} tidak punya kunci jawaban`);
      continue;
    }
    for (const step of m.steps) {
      const sk = key.steps.find((s) => s.stepId === step.id);
      if (!sk) {
        problems.push(`misi ${m.id} langkah ${step.id} tidak punya kunci`);
        continue;
      }
      const kinds = ['single', 'multi', 'assign', 'number', 'order'] as const;
      const filled = kinds.filter((k) => sk[k] !== undefined);
      if (filled.length !== 1) {
        problems.push(`misi ${m.id} langkah ${step.id} punya ${filled.length} bentuk kunci`);
      } else if (filled[0] !== step.kind) {
        problems.push(
          `misi ${m.id} langkah ${step.id}: jenis langkah ${step.kind} tapi kunci ${filled[0]}`,
        );
      }
      if (step.kind === 'multi' && sk.multi && (sk.requiredSelections ?? sk.multi.length) !== step.requiredSelections) {
        problems.push(`misi ${m.id} langkah ${step.id}: requiredSelections tidak sinkron`);
      }
      if (step.kind === 'assign' && sk.assign) {
        for (const [itemId, bucketId] of Object.entries(sk.assign)) {
          if (!step.items.some((i) => i.id === itemId)) problems.push(`${m.id}/${step.id}: item ${itemId} tak ada`);
          if (!step.buckets.some((b) => b.id === bucketId)) problems.push(`${m.id}/${step.id}: bucket ${bucketId} tak ada`);
        }
        if (Object.keys(sk.assign).length !== step.items.length) {
          problems.push(`${m.id}/${step.id}: jumlah item kunci != jumlah item`);
        }
      }
      if ((step.kind === 'single' && sk.single && !step.options.some((o) => o.id === sk.single)) ||
          (step.kind === 'multi' && sk.multi && sk.multi.some((id) => !step.options.some((o) => o.id === id)))) {
        problems.push(`${m.id}/${step.id}: id opsi pada kunci tidak ditemukan`);
      }
    }
  }
  if (problems.length) throw new Error('Kunci jawaban tidak konsisten:\n- ' + problems.join('\n- '));
}
