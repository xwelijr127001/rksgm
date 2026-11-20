/**
 * T-064 EPISODE 1 DEV "Kenalan Raksa" (spec docs/superpowers/specs/2026-11-19-episode-1-dev-design.md, plan Task 1): potongan
 * 5 menit kasus truk trailer untuk tamu acara yang baru pertama main. Episode TERPISAH (id `auto-2-dev`, simpanan sendiri,
 * rute pendek /cerita/kenalan); Episode 1 lengkap (`auto-2`) tidak berubah: episode ini hanya MEMAKAI ULANG teks, latar, seni,
 * pemeran, dokumen, dan aktivitas SIM-nya.
 *
 * Alur: pembuka Miss Raksa (2 baris) -> k01 (Babak 1, 3 balasan) -> k06 (Babak 6, 3 balasan) -> ksim (Periksa SIM, arena yang
 * sama) -> kdash (BARU: rekaman dashcam, arena `dashcam` dari Task 2 Designer) -> k14 (Babak 14, 3 balasan) -> cabang status ->
 * tiga akhir (baris akhir auto-2). Status nasabah 0-100 mulai 30 (Cemas); Puas >= 70, Selesai dengan catatan 45-69, Kurang < 45.
 * Angka (plan Step 2): k01 A +10 / C -6 / E 0; k06 B +14 / A -10 / D -10; ksim bersih +8 / ragu 0; kdash bersih +8 / ragu -4;
 * k14 C +14 / A -10 / D 0. Jalur terbaik 30 + 10 + 14 + 8 + 8 + 14 = 84 (Puas).
 * Tampilan opt-in: `teksBesar` (pemutar HP teks besar) + `akhirKenalan` (akhir singkat dengan kartu petugas, tanpa layar nama).
 */
import type { Bahasa } from '@shared/bahasa';
import type { MissionPublic } from '@shared/types';
import { teksCerita } from '../../teks';
import type { Baris, CueLatar, DefAktivitas, Ekspresi, Episode, IdNode, Kondisi, NodeCerita } from '../../tipe';
import { EPISODE_AUTO_2 } from '../auto-2/episode';
import { TEKS_AUTO_2_DEV } from './teks';

type Siapa = 'missRaksa' | 'hendra' | 'bima' | 'darto' | 'narasi';
const b = (teks: string, siapa: Siapa, ekspresi?: Ekspresi, tata?: CueLatar): Baris => ({ siapa, teks, ...(ekspresi ? { ekspresi } : {}), ...(tata ? { tata } : {}) });
const TELEPON_HENDRA: CueLatar = { lokasi: 'kantor', hadir: [], telepon: 'hendra', objek: [] };
const tanda = (t: string): Kondisi => ({ tanda: t });

/** Satu balasan percakapan: alternatif auto-2 (kunci teks & baris akibat dipakai ulang) dengan angka status episode ini. */
interface Alt { id: string; delta: number; akibat: Baris[] }

/** Titik percakapan 3 balasan: node pilihan (`<id>`) + node akibat (`<id>-<alt>`), teks = kunci auto-2 yang sama. */
function titik(id: string, tata: CueLatar, baris: Baris[], alt: Alt[], lanjut: IdNode, dokumen?: string): NodeCerita[] {
  const pilihan: NodeCerita = {
    id, bab: 'b1', jenis: 'pilihan', tata, baris, tanya: `${id}.tanya`, ...(dokumen ? { dokumen } : {}),
    pilihan: alt.map((a) => ({ id: a.id, teks: `${id}.${a.id}`, efek: { kepercayaan: a.delta, alasan: `${id}.${a.id}.alasan`, pasang: [`kep:${id}:${a.id}`] }, lanjut: `${id}-${a.id}` })),
  };
  return [pilihan, ...alt.map((a): NodeCerita => ({ id: `${id}-${a.id}`, bab: 'b1', jenis: 'dialog', baris: a.akibat, lanjut }))];
}

// ------------------------------------------------------------------ aktivitas DASHCAM (konfig = kontrak dengan Task 2)

const SUMBER = { teks: TEKS_AUTO_2_DEV };
function misiDashcam(bahasa: Bahasa): MissionPublic {
  const tx = (k: string) => teksCerita(SUMBER, k, bahasa);
  return {
    id: 'cerita-auto2dev-dashcam', number: 0, level: 1,
    title: tx('akt.dashcam.judul'), product: 'AUTO', productLabel: tx('akt.dashcam.produk'), location: tx('akt.dashcam.lokasi'),
    scene: 'gambar', image: null, story: tx('akt.dashcam.cerita'), instruction: tx('akt.dashcam.instruksi'),
    interactionLabel: tx('akt.dashcam.labelInteraksi'), durationSeconds: 60, briefingSeconds: 0, learning: '', rakiBriefing: '',
    steps: [{
      kind: 'assign', id: 'dashcam', prompt: tx('akt.dashcam.tanya'), hint: tx('akt.dashcam.petunjuk'), presentation: 'match', weight: 1,
      items: [{ id: 'rekaman', label: tx('akt.dashcam.item.rekaman'), icon: 'kamera' }],
      buckets: [{ id: 'bersih', label: tx('akt.dashcam.wadah.bersih'), icon: 'cek' }, { id: 'ragu', label: tx('akt.dashcam.wadah.ragu'), icon: 'jam' }],
    }],
  };
}

const DASHCAM: DefAktivitas = {
  id: 'dashcam',
  misi: misiDashcam,
  kunci: [{ stepId: 'dashcam', weight: 1, explanation: '', assign: { rekaman: 'bersih' } }],
  penjelasan: { dashcam: 'kdash.a.alasan' },
  ringkasan: 'akt.dashcam.judul',
  labelKirim: 'akt.dashcam.kirim',
  fokus: 'adegan',
  // Kontrak Interfaces (plan Task 1 -> Task 2): ArenaPolaDashcam mencatat tetapkan(jawaban, 'dashcam', 'rekaman', 'bersih' | 'ragu').
  arena: {
    pola: 'dashcam', langkah: 'dashcam', item: 'rekaman', tanya: 'arena.dashcam.tanya',
    benda: [{ id: 'truk' }, { id: 'mobil' }, { id: 'truk-kecil' }], tepat: 'mobil', bersih: 'bersih', ragu: 'ragu',
  },
};

// ------------------------------------------------------------------ graf

/**
 * T-073: bagian tiap node = bagiannya di kasus lengkap auto-2: buka + Babak 1 (k01) = b1 Laporan awal; Babak 6 (k06) = b2 Survey dan
 * estimasi; SIM + dashcam = b3 Pemeriksaan kejadian; Babak 14 + akhir = b4 Keputusan dan penyelesaian.
 */
function babDev(id: IdNode): string {
  if (id === 'buka' || id.startsWith('k01')) return 'b1';
  if (id.startsWith('k06')) return 'b2';
  if (id.startsWith('ksim') || id.startsWith('kdash')) return 'b3';
  return 'b4';
}

function bangunNode(): NodeCerita[] {
  return [
    {
      id: 'buka', bab: 'b1', jenis: 'dialog',
      tata: { lokasi: 'kantor', hadir: ['missRaksa'], telepon: null, objek: [] },
      baris: [b('buka.1', 'missRaksa', 'tersenyum'), b('buka.2', 'missRaksa', 'netral')],
      lanjut: 'k01',
    },
    // Babak 1: balasan WhatsApp pertama (A tepat, C keliru paling bermakna, E kurang).
    ...titik('k01', TELEPON_HENDRA, [b('k01.1', 'narasi'), b('k01.2', 'hendra', 'bingung')], [
      { id: 'a', delta: 10, akibat: [b('k01-a.1', 'hendra', 'lega'), { ...b('k01-a.2', 'narasi'), lampiran: 'fotoTruk' }] },
      { id: 'c', delta: -6, akibat: [b('k01-c.1', 'hendra', 'kesal')] },
      { id: 'e', delta: 0, akibat: [b('k01-e.1', 'hendra', 'bingung'), b('k01-e.2', 'narasi')] },
    ], 'k06'),
    // Babak 6: "Kapan keputusannya?" (B tepat, A dan D keliru).
    ...titik('k06', TELEPON_HENDRA, [b('k06.1', 'narasi'), b('k06.2', 'hendra', 'cemas')], [
      { id: 'b', delta: 14, akibat: [b('k06-b.1', 'hendra', 'lega'), b('k06-b.2', 'narasi')] },
      { id: 'a', delta: -10, akibat: [b('k06-a.1', 'narasi'), b('k06-a.2', 'narasi')] },
      { id: 'd', delta: -10, akibat: [b('k06-d.1', 'narasi')] },
    ], 'ksim', 'linimasa'),
    // Periksa SIM Pak Darto: arena & aktivitas auto-2 yang sama (T-049 cocokkan baris dengan tangan).
    {
      id: 'ksim', bab: 'b1', jenis: 'aktivitas', aktivitas: 'sim', langsung: true,
      tata: { lokasi: 'wawancara', hadir: ['bima', 'darto'], telepon: null, objek: [] },
      baris: [b('ksim.1', 'narasi'), b('ksim.2', 'bima')],
      hasil: [
        { jika: tanda('akt:sim:taruh:periksa:ragu'), efek: { kepercayaan: 0, alasan: 'ksim.b.alasan', pasang: ['kep:ksim:b'] }, lanjut: 'ksim-b' },
        { efek: { kepercayaan: 8, alasan: 'ksim.a.alasan', pasang: ['kep:ksim:a'] }, lanjut: 'ksim-a' },
      ],
    },
    { id: 'ksim-a', bab: 'b1', jenis: 'dialog', baris: [b('ksim-a.1', 'bima')], lanjut: 'kdash' },
    { id: 'ksim-b', bab: 'b1', jenis: 'dialog', baris: [b('ksim-b.1', 'bima')], lanjut: 'kdash' },
    // BARU: rekaman dashcam di jalan tol (menggantikan soal lajur; arena `dashcam`, Task 2).
    {
      id: 'kdash', bab: 'b1', jenis: 'aktivitas', aktivitas: 'dashcam', langsung: true,
      tata: { lokasi: 'tol', hadir: ['bima'], telepon: null, objek: [] },
      baris: [b('kdash.1', 'narasi'), b('kdash.2', 'bima', 'serius')],
      hasil: [
        { jika: tanda('akt:dashcam:taruh:rekaman:ragu'), efek: { kepercayaan: -4, alasan: 'kdash.b.alasan', pasang: ['kep:kdash:b'] }, lanjut: 'kdash-b' },
        { efek: { kepercayaan: 8, alasan: 'kdash.a.alasan', pasang: ['kep:kdash:a'] }, lanjut: 'kdash-a' },
      ],
    },
    { id: 'kdash-a', bab: 'b1', jenis: 'dialog', baris: [b('kdash-a.1', 'bima')], lanjut: 'k14' },
    { id: 'kdash-b', bab: 'b1', jenis: 'dialog', baris: [b('kdash-b.1', 'bima')], lanjut: 'k14' },
    // Babak 14: nasabah keberatan dengan nilai ganti (C tepat, A keliru, D kurang).
    ...titik('k14', TELEPON_HENDRA, [b('k14.1', 'narasi'), b('k14.2', 'hendra', 'kesal')], [
      { id: 'c', delta: 14, akibat: [b('k14-c.1', 'hendra', 'netral'), b('k14-c.2', 'narasi')] },
      { id: 'a', delta: -10, akibat: [b('k14-a.1', 'hendra', 'kesal')] },
      { id: 'd', delta: 0, akibat: [b('k14-d.1', 'narasi')] },
    ], 'akhir-cek', 'banding'),
    {
      id: 'akhir-cek', bab: 'b1', jenis: 'cabang',
      cabang: [{ jika: { kepercayaan: { min: 70 } }, lanjut: 'akhir-puas' }, { jika: { kepercayaan: { min: 45 } }, lanjut: 'akhir-catatan' }],
      lainnya: 'akhir-kurang',
    },
    ...(['puas', 'catatan', 'kurang'] as const).map((akhir): NodeCerita => ({
      id: `akhir-${akhir}`, bab: 'b1', jenis: 'akhir', akhir,
      tata: { lokasi: 'kantor', hadir: ['missRaksa', 'hendra'], telepon: null, objek: [] },
      baris: [
        b(`akhir.${akhir}.1`, 'hendra', akhir === 'puas' ? 'senang' : akhir === 'catatan' ? 'netral' : 'kesal'),
        b('akhir.bayar', 'narasi'),
        b(`akhir.${akhir}.2`, 'missRaksa', akhir === 'puas' ? 'tersenyum' : 'serius'),
      ],
    })),
  ];
}

function bangun(asal: Episode): Episode {
  return {
    id: 'auto-2-dev',
    serahTelepon: { tokoh: 'missRaksa', maju: [['buka', 'k01']], balik: { dari: ['k14-c', 'k14-a', 'k14-d'], ke: ['akhir-puas', 'akhir-catatan', 'akhir-kurang'] } },
    versi: 1,
    produk: 'AUTO',
    jenis: 'nyata',
    judul: 'judul',
    ringkas: 'ringkas',
    durasiMenit: 5,
    mulai: 'buka',
    pemeran: { missRaksa: asal.pemeran.missRaksa!, hendra: asal.pemeran.hendra!, bima: asal.pemeran.bima!, darto: asal.pemeran.darto! },
    nasabah: 'hendra',
    // T-073: empat bagian = letak tiap langkah di kasus lengkap (judul & tujuan bagian auto-2), supaya kepala menunjukkan kemajuan
    // nyata ("BAGIAN 3/4 · Pemeriksaan kejadian"). Akhir Kenalan tetap tanpa "coba lagi dari bagian".
    bab: (['b1', 'b2', 'b3', 'b4'] as const).map((id) => ({ id, judul: `bab.${id}.judul`, tujuan: `bab.${id}.tujuan` })),
    akhir: asal.akhir,
    paham: {},
    proses: {},
    catatan: {},
    kepercayaanAwal: 30,
    kepercayaanBatas: { min: 0, maks: 100 },
    labelSuasana: 'status',
    antarmuka: 'hp',
    seniArena: asal.seniArena,
    lampiran: asal.lampiran,
    cutIn: ['k01.2'],
    suasana: asal.suasana,
    node: Object.fromEntries(bangunNode().map((n) => [n.id, { ...n, bab: babDev(n.id) }])),
    aktivitas: { sim: asal.aktivitas.sim!, dashcam: DASHCAM },
    teks: TEKS_AUTO_2_DEV,
    bahasa: ['id', 'en', 'zh'],
    kartuAkhir: asal.kartuAkhir,
    istilah: asal.istilah,
    latar: asal.latar,
    dokumen: { linimasa: asal.dokumen!.linimasa!, banding: asal.dokumen!.banding! },
    tampilan: { teksBesar: true, akhirKenalan: true },
  };
}

/**
 * Episode 1 Dev. Build tanpa auto-2 (VITE_CERITA_TANPA=auto-2): vite.config ikut mengganti modul ini dengan rintisan null,
 * jadi isi kasusnya tidak terbawa lewat episode ini.
 */
export const EPISODE_AUTO_2_DEV: Episode = bangun(EPISODE_AUTO_2);
