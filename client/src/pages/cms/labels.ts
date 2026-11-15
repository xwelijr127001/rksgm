/** Indonesian labels of the CMS (staff tools are Indonesian-only, DECISIONS.md D-13). */
import type { AssetKind, Classification, EndingContent, EvidenceKind, MoodBand, RoundLayout, Speaker } from '@shared/story/content';
import type { ScenarioStatus } from '@shared/story/dto';
import type { CastUses, FlagSource } from './contentEdit';

export const STATUS_LABEL: Record<ScenarioStatus, string> = {
  draft: 'Draf',
  in_review: 'Dalam review',
  published: 'Terbit',
  archived: 'Diarsipkan',
};

export const CLASSIFICATION_LABEL: Record<Classification, string> = {
  tepat: 'Tepat',
  kurang_tepat: 'Kurang tepat',
  keliru: 'Keliru',
};

/** `cast` is shown with the member's name where one is known (castOptionLabel). */
export const SPEAKER_LABEL: Record<Speaker, string> = {
  narrator: 'Narasi',
  customer: 'Customer',
  officer: 'Petugas',
  cast: 'Tokoh pendukung',
};

/** The round's activity (one main activity per screen). */
export const LAYOUT_LABEL: Record<RoundLayout, string> = {
  chat: 'Percakapan (chat)',
  dossier: 'Meja berkas',
  field: 'Adegan lapangan',
  stage: 'Adegan klasik',
};

/** What the participant does in each activity, for the activity picker. */
export const LAYOUT_HELP: Record<RoundLayout, string> = {
  chat: 'Satu utas pesan menjadi tempat bermain: kontak di atas, pesan masuk dan keluar, berkas sebagai lampiran di dalam chat. Lima draf balasan ada di area ketik; balasan yang dikirim tampil sebagai pesan peserta. Tanpa ilustrasi di sampingnya.',
  dossier: 'Meja berkas: konteks singkat dan kartu dokumen yang bisa dibuka (dokumen, daftar periksa, linimasa, perbandingan, foto), lalu satu dari lima tindakan. Butuh minimal satu berkas.',
  field: 'Adegan lapangan: satu gambar latar hasil unggahan dengan titik bernomor (juga tampil sebagai daftar). Mengetuk titik membuka info yang dibutuhkan untuk memutuskan. Butuh minimal satu berkas dengan titik.',
  stage: 'Adegan klasik: latar dengan tokoh dan dialog (gaya skenario demo), lalu lima pilihan.',
};

/** Short tag of an activity in the round list ('' = none: the classic stage). */
export const LAYOUT_TAG: Record<RoundLayout, string> = {
  chat: 'chat',
  dossier: 'berkas',
  field: 'lapangan',
  stage: '',
};

/** Evidence kinds in the editor: the room's word, plus the validator's word where they differ ("linimasa"). */
export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  document: 'Dokumen',
  checklist: 'Daftar periksa',
  timeline: 'Alur (linimasa)',
  compare: 'Perbandingan',
  photo: 'Foto',
};

/** What an evidence kind shows when opened. */
export const EVIDENCE_KIND_HELP: Record<EvidenceKind, string> = {
  document: 'Teks yang dibaca, mis. ringkasan surat atau laporan (isi wajib).',
  checklist: 'Baris dengan status: ada, menyusul, belum ada, perlu dicek (1–12 baris).',
  timeline: 'Urutan tahap atau waktu; nilai = waktu atau keterangan (1–12 baris).',
  compare: 'Baris berisi dua sisi: label dan pembandingnya (1–12 baris).',
  photo: 'Gambar hasil unggahan dari pustaka (foto atau latar), dengan keterangan opsional.',
};

/** Shown under the status selects: unknown statuses use "perlu dicek" rather than an invented one. */
export const EVIDENCE_MARK_HINT = 'Status yang tidak disebut naskah: pilih “Perlu dicek”, jangan menebak.';

/** Label of a row's value field by kind (the value sits beside the row label). */
export const EVIDENCE_VALUE_LABEL: Record<EvidenceKind, string> = {
  document: 'Nilai (opsional)',
  checklist: 'Keterangan (opsional)',
  timeline: 'Waktu/keterangan (opsional)',
  compare: 'Pembanding (opsional)',
  photo: 'Nilai (opsional)',
};

/** Label of a cast member in speaker lists: its name, or a placeholder naming the ID while the name is empty. */
export function castOptionLabel(name: string, castId: string): string {
  return name.trim() ? `${SPEAKER_LABEL.cast}: ${name.trim()}` : `${SPEAKER_LABEL.cast} (${castId}, belum bernama)`;
}

/** Round numbers (from 0-based indexes) in running text: "6", "6 dan 9", "2, 6 dan 9". */
export function roundListLabel(indexes: readonly number[]): string {
  const numbers = indexes.map((i) => String(i + 1));
  const last = numbers.pop() ?? '';
  return numbers.length ? `${numbers.join(', ')} dan ${last}` : last;
}

/** Where a cast member appears, for its card: "Berbicara di 2 baris (pembuka dan babak) dan membalas di babak 6." */
export function castUsesLabel(uses: CastUses): string {
  const parts = [uses.lines ? `berbicara di ${uses.lines} baris (pembuka dan babak)` : '', uses.replies.length ? `membalas di babak ${roundListLabel(uses.replies)}` : ''].filter(Boolean);
  const text = parts.join(' dan ');
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}.` : 'Belum berbicara atau membalas di babak mana pun.';
}

export const MOOD_LABEL: Record<MoodBand, string> = {
  sangat_kecewa: 'Sangat kecewa (0–19)',
  kecewa: 'Kecewa (20–39)',
  ragu: 'Ragu-ragu (40–59)',
  tenang: 'Mulai tenang (60–79)',
  senang: 'Senang (80–100)',
};

export const MOOD_RANGE: Record<MoodBand, string> = {
  sangat_kecewa: '0–19',
  kecewa: '20–39',
  ragu: '40–59',
  tenang: '60–79',
  senang: '80–100',
};

/** Band label with its range, in the scenario's own status words when it sets all five (scene.scenarioMoodLabels). */
export function moodBandLabel(band: MoodBand, words: Record<MoodBand, string> | null): string {
  return words ? `${words[band]} (${MOOD_RANGE[band]})` : MOOD_LABEL[band];
}


/** Where a flag comes from, for flag pickers: "babak 3 pilihan 1 (tanda janji_kirim)", with its name when it has one. */
export function flagSourceLabel(s: FlagSource, name = ''): string {
  const flag = name.trim() ? `tanda ${s.flag}: ${name.trim()}` : `tanda ${s.flag}`;
  return `${s.setBy.map((x) => `babak ${x.roundIndex + 1} pilihan ${x.choiceIndex + 1}`).join(' / ')} (${flag})`;
}

const fmt = (n: number) => n.toLocaleString('id-ID');

function boundText(name: string, min: number | null, max: number | null): string | null {
  if (min !== null && max !== null) return `${name} ${fmt(min)}–${fmt(max)}`;
  if (min !== null) return `${name} ≥ ${fmt(min)}`;
  if (max !== null) return `${name} ≤ ${fmt(max)}`;
  return null;
}

/** Plain-language condition of an ending, e.g. "status ≥ 70 (status saja)" or "tanpa syarat". */
export function endingRuleLabel(e: Pick<EndingContent, 'minMood' | 'maxMood' | 'minScore' | 'maxScore'>): string {
  const mood = boundText('status', e.minMood, e.maxMood);
  const score = boundText('nilai', e.minScore, e.maxScore);
  if (mood && score) return `${mood} dan ${score}`;
  if (mood) return `${mood} (status saja)`;
  if (score) return `${score} (nilai saja)`;
  return 'tanpa syarat';
}

export const ASSET_KIND_LABEL: Record<AssetKind, string> = {
  background: 'Latar',
  character: 'Tokoh & ekspresi',
  photo: 'Foto bukti',
  video: 'Video',
  bgm: 'Musik latar (BGM)',
};

export const EVENT_LABEL: Record<string, string> = {
  create: 'Dibuat',
  save: 'Draf disimpan',
  submit: 'Diajukan ke review',
  return: 'Dikembalikan ke draf',
  anonymization_checked: 'Pemeriksaan anonimisasi dicatat',
  publish: 'Diterbitkan',
  archive: 'Diarsipkan',
  unarchive: 'Dipulihkan dari arsip',
  withdraw: 'Versi ditarik',
};
