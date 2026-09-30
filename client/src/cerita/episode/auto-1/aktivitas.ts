/**
 * Aktivitas klaim episode AUTO-1 (docs/rancangan-mode-cerita.md bagian 3.2).
 *
 * Setiap aktivitas = misi sintetis (MissionPublic) yang dimainkan lewat MissionPlay yang sudah ada.
 * Id misi, langkah, opsi, dan kartu TETAP: dipakai naskah (tanda `akt:<id>:pilih:<opsi>`) DAN adegan 2D
 * (client/src/game/scenes/cerita/index.ts, objek adegan merujuk opsi lewat refId; fx 'photo' untuk bukti
 * diatur di adegan). Rubrik ada di sini karena mode cerita tidak bertanding; kode ini TIDAK mengimpor
 * server/ atau kunci pertandingan.
 *
 * Urutan opsi di data sengaja acak (jawaban tepat tidak selalu di depan). Baris kartu polis TANPA flag:
 * flag ok/no akan membocorkan jawaban, dan chip "info" di setiap baris tampak seperti tombol bantuan padahal
 * tidak bisa diketuk (tinjauan ux-cerita, 26 Sep 2026).
 *
 * Pengecoh aktivitas bukti butuh pertimbangan pemeriksaan, bukan konyol: dua foto bagian mobil yang TIDAK
 * rusak dan tidak menunjukkan identitasnya (`foto-ban` ban depan, `foto-dasbor` dasbor dari jendela) plus
 * `foto-menu` (brosur di kaca, turunan distraktor m02 "foto makanan"). Dasarnya m02: bukti harus menghubungkan
 * kendaraan, lokasi kerusakan, dan kejadian. Tiap opsi = objek adegan di
 * client/src/game/scenes/cerita/auto1-bukti.ts (kontrak 3.2); lihat docs/cerita/TINJAUAN-PIC-CLAIM.md bagian G.
 *
 * v2 (docs/rancangan-mode-cerita.md 11.5): pengecoh kartu `ambang-tlo` (ambang 75% / TLO, di luar materi episode;
 * diajarkan misi 5) DIHAPUS dari opsi. Id-nya dicatat di `opsiPensiun` supaya baris umpan balik khusus opsi itu
 * (b4-polis.hasil.4.1) tetap sah bagi simpanan lama; kuncinya ada di blok PENSIUN teks.*. Opsi lain & id-nya tetap.
 * `alasanOpsi` (alasan per opsi, tampil setelah dikirim) dan `kartuArti` (arti awam baris kartu) ikut di sini.
 */
import type { Bahasa } from '@shared/bahasa';
import type { MissionPublic } from '@shared/types';
import { teksCerita } from '../../teks';
import type { DefAktivitas, IdAktivitas, KunciTeks } from '../../tipe';
import { LOKASI_AUTO_1, TEKS_AUTO_1 } from './teks';

export const MISI_BUKTI = 'cerita-auto1-bukti';
export const MISI_POLIS = 'cerita-auto1-polis';

/** Opsi langkah `bukti` (urutan tampil). Tiga yang tepat: foto-full, foto-penyok, foto-plat. */
const OPSI_BUKTI = [
  { id: 'foto-menu', icon: 'brosur' },
  { id: 'foto-full', icon: 'mobil' },
  { id: 'foto-ban', icon: 'mobil' },
  { id: 'foto-penyok', icon: 'rusak' },
  { id: 'foto-dasbor', icon: 'foto' },
  { id: 'foto-plat', icon: 'plat' },
] as const;

/**
 * Opsi langkah `penjelasan` (urutan tampil). Yang tepat: bisa-dinilai. Ikon netral agar tidak membocorkan jawaban.
 * Tiap pengecoh mewakili satu salah kaprah: `pasti-diganti` = menjanjikan hasil, `tidak-tercakup` = menyangkal isi kartu.
 */
const OPSI_POLIS = [
  { id: 'pasti-diganti', icon: 'uang' },
  { id: 'tidak-tercakup', icon: 'polis' },
  { id: 'bisa-dinilai', icon: 'dokumen' },
] as const;

/** Opsi polis yang dipensiunkan (v2): tidak ditawarkan lagi, tetapi tanda `akt:polis:pilih:<opsi>` simpanan lama tetap sah. */
const OPSI_POLIS_PENSIUN = ['ambang-tlo'];

/** Baris kartu polis Bu Rina: kunci teks `akt.polis.kartu.<baris>.label|nilai|arti`. */
const BARIS_KARTU = ['kendaraan', 'benturan', 'status', 'risiko'] as const;

/** Kunci alasan per opsi: `akt.<id>.alasan.<opsi>` (tampil setelah jawaban dikirim). */
const alasanTiapOpsi = (id: IdAktivitas, opsi: readonly { id: string }[]): Record<string, KunciTeks> =>
  Object.fromEntries(opsi.map((o) => [o.id, `akt.${id}.alasan.${o.id}`]));

// panggung.lokasi: label lokasi aktivitas polis memakai `{lokasi}` (nama ruang yang sama dengan papan nama).
const SUMBER = { teks: TEKS_AUTO_1, panggung: { lokasi: LOKASI_AUTO_1 } };

function penerjemah(bahasa: Bahasa): (kunci: KunciTeks) => string {
  return (kunci) => teksCerita(SUMBER, kunci, bahasa);
}

/** Bidang misi yang sama polanya untuk kedua aktivitas (`akt.<id>.*`). */
function dasarMisi(id: IdAktivitas, bahasa: Bahasa) {
  const tx = penerjemah(bahasa);
  return {
    number: 0,
    level: 1 as const,
    product: 'AUTO' as const,
    durationSeconds: 60,
    briefingSeconds: 0,
    title: tx(`akt.${id}.judul`),
    productLabel: tx(`akt.${id}.produk`),
    location: tx(`akt.${id}.lokasi`),
    story: tx(`akt.${id}.cerita`),
    instruction: tx(`akt.${id}.instruksi`),
    interactionLabel: tx(`akt.${id}.labelInteraksi`),
    learning: tx(`akt.${id}.pelajaran`),
    rakiBriefing: tx(`akt.${id}.briefing`),
  };
}

function misiBukti(bahasa: Bahasa): MissionPublic {
  const tx = penerjemah(bahasa);
  return {
    ...dasarMisi('bukti', bahasa),
    id: MISI_BUKTI,
    scene: 'parkiran',
    steps: [
      {
        kind: 'multi',
        id: 'bukti',
        prompt: tx('akt.bukti.tanya'),
        hint: tx('akt.bukti.petunjuk'),
        presentation: 'cards',
        requiredSelections: 3,
        weight: 1,
        options: OPSI_BUKTI.map((o) => ({ id: o.id, label: tx(`akt.bukti.opsi.${o.id}`), icon: o.icon })),
      },
    ],
  };
}

function misiPolis(bahasa: Bahasa): MissionPublic {
  const tx = penerjemah(bahasa);
  return {
    ...dasarMisi('polis', bahasa),
    id: MISI_POLIS,
    scene: 'kantor',
    policyCards: [
      {
        id: 'polis-rina',
        title: tx('akt.polis.kartu.judul'),
        subtitle: tx('akt.polis.kartu.sub'),
        product: 'AUTO',
        rows: BARIS_KARTU.map((b) => ({
          label: tx(`akt.polis.kartu.${b}.label`),
          value: tx(`akt.polis.kartu.${b}.nilai`),
        })),
        note: tx('akt.polis.kartu.catatan'),
      },
    ],
    steps: [
      {
        kind: 'single',
        id: 'penjelasan',
        prompt: tx('akt.polis.tanya'),
        hint: tx('akt.polis.petunjuk'),
        presentation: 'cards',
        weight: 1,
        options: OPSI_POLIS.map((o) => ({ id: o.id, label: tx(`akt.polis.opsi.${o.id}`), icon: o.icon })),
      },
    ],
  };
}

const BUKTI: DefAktivitas = {
  id: 'bukti',
  misi: misiBukti,
  // `explanation` tidak dipakai mode cerita; teks pembahasan ada di `penjelasan`.
  kunci: [{ stepId: 'bukti', weight: 1, multi: ['foto-full', 'foto-penyok', 'foto-plat'], requiredSelections: 3, explanation: '' }],
  penjelasan: { bukti: 'akt.bukti.bahas.bukti' },
  ringkasan: 'akt.bukti.ringkasan',
  labelKirim: 'akt.bukti.kirim',
  fokus: 'adegan',
  alasanOpsi: alasanTiapOpsi('bukti', OPSI_BUKTI),
};

const POLIS: DefAktivitas = {
  id: 'polis',
  misi: misiPolis,
  kunci: [{ stepId: 'penjelasan', weight: 1, single: 'bisa-dinilai', explanation: '' }],
  penjelasan: { penjelasan: 'akt.polis.bahas.penjelasan' },
  ringkasan: 'akt.polis.ringkasan',
  labelKirim: 'akt.polis.kirim',
  fokus: 'baca',
  alasanOpsi: alasanTiapOpsi('polis', OPSI_POLIS),
  // Urutan `baris` = urutan `rows` kartu (BARIS_KARTU).
  kartuArti: {
    'polis-rina': { sub: 'akt.polis.kartu.sub.arti', baris: BARIS_KARTU.map((b) => `akt.polis.kartu.${b}.arti`) },
  },
  opsiPensiun: OPSI_POLIS_PENSIUN,
};

export const AKTIVITAS_AUTO_1: Record<IdAktivitas, DefAktivitas> = { bukti: BUKTI, polis: POLIS };
