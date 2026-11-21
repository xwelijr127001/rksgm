/**
 * T-103 (Designer): ASET PANEL = semua seni Investigator kasus 3 "Satu Baris Terlalu Banyak" dan hadiah seri, diindeks dengan
 * id yang disepakati (shared/investigator/rubric.ts: id kartu kasus-3 dan AwardId). Semua nilai = URL PNG atau sel atlas.
 * Seni: cerita/seni/investigasi/panel/*.png; sumber: character/investigator-t103/{tokoh,adegan}.mts.
 * Tidak ada teks yang dipanggang di gambar (tanggal, nomor rujukan, isi pesan): teks datang dari naskah lewat props.
 *
 *   PanelAssets.desk                gambar meja / kartu judul kasus 3, 292 x 150 (sudah 2x)
 *   PanelAssets.room                ruang panel 180 x 52 (tampil 2x); orangnya = bust terpisah
 *   PanelAssets.evidence[idKartu]   { thumb 96 x 68, exhibit? 288 x 192 (sudah 2x), detail? 144 x 112 (tampil 2x), icon }
 *   PanelAssets.portrait[kursi]     potret 64 x 64 berlatar krem (buku catatan / kartu pernyataan)
 *   PanelAssets.bust                atlas bust 64 x 64 tembus pandang + sel per kursi dan raut
 *   PanelAssets.reaction            atlas potret reaksi 64 x 64 bertanda emosi + sel per nama
 *   PanelAssets.icon                atlas ikon 16 x 16 + sel per nama
 *   PanelAssets.award[idHadiah]     lencana 32 x 32 (sel atlas) atau bingkai kartu petugas (9-slice 48 x 48, irisan 16)
 *   PanelAssets.stamp['kasus-3']    stempel kasus 3: sel ikon 16 px dan sel lencana 32 px
 *   PanelAssets.sprite              atlas badan penuh + manifes skema seni/piksel/susun.ts (ketua, penaksir, pemohon)
 */
import meja from '../../../seni/investigasi/panel/meja.png';
import ruang from '../../../seni/investigasi/panel/ruang.png';
import fotoInspeksi from '../../../seni/investigasi/panel/foto-inspeksi.png';
import fotoKejadian from '../../../seni/investigasi/panel/foto-kejadian.png';
import spion from '../../../seni/investigasi/panel/spion.png';
import buktiAtlas from '../../../seni/investigasi/panel/bukti.png';
import buktiFotoInspeksi from '../../../seni/investigasi/panel/bukti-foto-inspeksi.png';
import buktiPesan from '../../../seni/investigasi/panel/bukti-pesan-pengajuan.png';
import buktiPenawaran from '../../../seni/investigasi/panel/bukti-penawaran.png';
import buktiKejadian from '../../../seni/investigasi/panel/bukti-kartu-kejadian.png';
import potretKetua from '../../../seni/investigasi/panel/potret-ketua.png';
import potretPenaksir from '../../../seni/investigasi/panel/potret-penaksir.png';
import potretPemohon from '../../../seni/investigasi/panel/potret-pemohon.png';
import tokoh from '../../../seni/investigasi/panel/tokoh.png';
import reaksi from '../../../seni/investigasi/panel/reaksi.png';
import ikon from '../../../seni/investigasi/panel/ikon.png';
import lencana from '../../../seni/investigasi/panel/lencana.png';
import bingkaiKepala from '../../../seni/investigasi/panel/bingkai-kepala.png';
import atlasBadan from '../../../seni/investigasi/panel/kasus3.png';
import manifesBadan from '../../../seni/investigasi/panel/kasus3.json';

/** Kursi di ruang panel: ketua (penelaah, tengah), penaksir bengkel (kiri), pemohon klaim (kanan). */
export type PanelSeat = 'ketua' | 'penaksir' | 'pemohon';
export const PANEL_SEATS: readonly PanelSeat[] = ['penaksir', 'ketua', 'pemohon'];
/** Raut bust per kursi (sel [kolom, baris] atlas tokoh.png). `netral` ada di semua kursi. */
export type PanelFace = 'netral' | 'serius' | 'ragu' | 'cemas' | 'terbuka' | 'lega';
const SEL_BUST: Readonly<Record<PanelSeat, Partial<Record<PanelFace, readonly [number, number]>>>> = {
  ketua: { netral: [0, 0], serius: [1, 0] },
  penaksir: { netral: [0, 1], ragu: [1, 1], serius: [1, 1], cemas: [1, 1] },
  pemohon: { netral: [0, 2], cemas: [1, 2], ragu: [1, 2], serius: [2, 2], terbuka: [3, 2], lega: [4, 2] },
};
/** Potret reaksi bertanda emosi (sel atlas reaksi.png). */
const SEL_REAKSI = { 'ketua-tanya': 0, 'penaksir-kaget': 1, 'penaksir-ragu': 2, 'pemohon-cemas': 3, 'pemohon-mengaku': 4, 'pemohon-lega': 5 } as const;
export type PanelReactionId = keyof typeof SEL_REAKSI;
const SEL_IKON = { 'foto-inspeksi': 0, 'pesan-pengajuan': 1, penawaran: 2, spion: 3, tanya: 4, 'stempel-3': 5, panel: 6, periksa: 7 } as const;
export type PanelIconId = keyof typeof SEL_IKON;

export interface PanelEvidenceArt {
  /** Gambar kartu bukti 96 x 68 (sel yang sama dengan KartuBukti kasus 1-2). */
  thumb: string;
  /** Gambar besar untuk lembar "perbesar", 288 x 192 (seni 144 x 96 dipanggang 2x). */
  exhibit?: string;
  /** Potongan dekat 144 x 112 (tampil 2x = 288 x 224): bagian yang menjadi bukti. */
  detail?: string;
  icon: PanelIconId;
  /** Cara lembar "perbesar" menggambar kutipannya: foto + keterangan, gelembung pesan, atau lembar kertas. */
  kind: 'foto' | 'pesan' | 'kertas';
}

export const PanelAssets = {
  desk: meja,
  room: ruang,
  evidence: {
    'foto-inspeksi': { thumb: buktiFotoInspeksi, exhibit: fotoInspeksi, detail: spion, icon: 'foto-inspeksi', kind: 'foto' },
    'pesan-pengajuan': { thumb: buktiPesan, icon: 'pesan-pengajuan', kind: 'pesan' },
    penawaran: { thumb: buktiPenawaran, icon: 'penawaran', kind: 'kertas' },
    'kartu-kejadian': { thumb: buktiKejadian, exhibit: fotoKejadian, detail: spion, icon: 'foto-inspeksi', kind: 'foto' },
  } as Readonly<Record<string, PanelEvidenceArt>>,
  portrait: { ketua: potretKetua, penaksir: potretPenaksir, pemohon: potretPemohon } as Readonly<Record<PanelSeat, string>>,
  bust: { url: tokoh, cell: 64, size: [320, 192] as const, cells: SEL_BUST },
  reaction: { url: reaksi, cell: 64, size: [384, 64] as const, cells: SEL_REAKSI },
  /** Reaksi sesudah kartu yang TEPAT diajukan, per id babak (rubrik): kronologi = pemohon cemas, pengajuan = pemohon mengaku. */
  roundReaction: { kronologi: 'pemohon-cemas', pengajuan: 'pemohon-mengaku' } as Readonly<Record<string, PanelReactionId>>,
  /** Atlas kartu bukti 384 x 68, sel 96 x 68 urut: foto-inspeksi, pesan-pengajuan, penawaran, kartu-kejadian (untuk tabel sel lama). */
  evidenceAtlas: { url: buktiAtlas, cells: { 'foto-inspeksi': 0, 'pesan-pengajuan': 1, penawaran: 2, 'kartu-kejadian': 3 } as Readonly<Record<string, number>> },
  icon: { url: ikon, cell: 16, size: [128, 16] as const, cells: SEL_IKON },
  award: {
    'lencana-dua-kasus': { url: lencana, cell: 0 },
    'segel-panel': { url: lencana, cell: 1 },
    'bingkai-kepala': { url: bingkaiKepala, slice: 16 },
  },
  stamp: { 'kasus-3': { icon: 'stempel-3' as PanelIconId, large: { url: lencana, cell: 2 } } },
  sprite: { url: atlasBadan, manifest: manifesBadan },
} as const;

/** Seni sebuah kartu bukti; id yang tidak dikenal = undefined (pemanggil memakai seninya sendiri). */
export const evidenceArt = (id: string): PanelEvidenceArt | undefined => PanelAssets.evidence[id];
/** Sel bust [kolom, baris]; raut yang tidak ada untuk kursi itu = netral. */
export const bustCell = (seat: PanelSeat, face: PanelFace = 'netral'): readonly [number, number] => SEL_BUST[seat][face] ?? SEL_BUST[seat].netral!;
