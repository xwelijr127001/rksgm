/**
 * RAKSA GAME - kontrak data bersama antara server dan client.
 *
 * PENTING: file ini TIDAK memuat kunci jawaban. Kunci jawaban & rubric ada di
 * server/src/answerKeys.ts dan hanya dikirim ke client saat fase REVEAL.
 */

export type Phase =
  | 'LOBBY'
  | 'TUTORIAL'
  | 'BRIEFING'
  | 'ACTIVE'
  | 'REVEAL'
  | 'LEADERBOARD'
  | 'FINISHED'
  | 'PAUSED';

export type Role = 'host' | 'player' | 'spectator';

export type Product = 'AUTO' | 'HVC' | 'FIRE' | 'CARGO' | 'MIX';

export type StepKind = 'single' | 'multi' | 'assign' | 'number' | 'order';

/** Kunci adegan SVG untuk tiap misi. */
export type SceneKey =
  | 'parkiran'
  | 'bengkel'
  | 'ruko'
  | 'proyek'
  | 'kantor'
  | 'pelabuhan'
  | 'gudang'
  | 'gudang-forklift'
  | 'kantor-hitung'
  | 'kota-banjir'
  /** Soal tanpa adegan 2D: visualnya sebuah gambar (lihat MissionPublic.image). */
  | 'gambar';

/** Ikon SVG kecil untuk kartu opsi / bukti. */
export type IconKey =
  | 'kamera' | 'mobil' | 'plat' | 'makanan' | 'selfie' | 'kucing'
  | 'dokumen' | 'foto' | 'daftar' | 'kalkulator' | 'brosur' | 'struk'
  | 'excavator' | 'operator' | 'lokasi' | 'rusak' | 'spanduk' | 'warung' | 'awan'
  | 'polis' | 'peti' | 'kapal' | 'gudang' | 'banjir' | 'forklift'
  | 'obeng' | 'cek' | 'tanya' | 'silang' | 'jam' | 'uang' | 'medali' | 'bintang' | 'kilat';

export interface OptionDef {
  id: string;
  label: string;
  /** Keterangan tambahan singkat (opsional). */
  desc?: string;
  icon?: IconKey;
  /** Untuk presentasi hotspot: posisi dalam persen (0-100) pada adegan. */
  hotspot?: { x: number; y: number; r?: number };
}

interface StepBase {
  id: string;
  prompt: string;
  /** Bobot langkah pada rubric misi. Default 1. */
  weight?: number;
  hint?: string;
}

export interface SingleStep extends StepBase {
  kind: 'single';
  options: OptionDef[];
  presentation?: 'cards' | 'list';
}

export interface MultiStep extends StepBase {
  kind: 'multi';
  options: OptionDef[];
  /** Jumlah pilihan benar yang diharapkan; dipakai pada rumus ketepatan. */
  requiredSelections: number;
  presentation?: 'cards' | 'hotspot' | 'folder' | 'checklist';
}

export interface AssignStep extends StepBase {
  kind: 'assign';
  items: OptionDef[];
  buckets: OptionDef[];
  presentation?: 'match' | 'sort' | 'stage';
}

export interface NumberStep extends StepBase {
  kind: 'number';
  /** Chip nilai siap-tap agar nyaman di HP. */
  suggestions?: number[];
  unit?: string;
  format?: 'rupiah' | 'angka';
}

export interface OrderStep extends StepBase {
  kind: 'order';
  items: OptionDef[];
}

export type StepDef = SingleStep | MultiStep | AssignStep | NumberStep | OrderStep;

export interface PolicyRow {
  label: string;
  value: string;
  /** Penanda status; UI wajib menampilkan teks/ikon, bukan hanya warna. */
  flag?: 'ok' | 'no' | 'info';
}

export interface PolicyCard {
  id: string;
  title: string;
  subtitle?: string;
  product: Product;
  rows: PolicyRow[];
  note?: string;
}

export interface DocTable {
  id: string;
  title: string;
  icon?: IconKey;
  rows: PolicyRow[];
  note?: string;
}

/** Konten misi yang boleh diakses client (tanpa kunci jawaban). */
export interface MissionPublic {
  id: string;
  number: number;
  title: string;
  product: Product;
  productLabel: string;
  location: string;
  scene: SceneKey;
  story: string;
  instruction: string;
  interactionLabel: string;
  durationSeconds: number;
  briefingSeconds: number;
  steps: StepDef[];
  policyCards?: PolicyCard[];
  tables?: DocTable[];
  checklist?: string[];
  /** Pesan pembelajaran; bukan kunci jawaban, tetapi hanya ditampilkan saat REVEAL. */
  learning: string;
  /** Kalimat Raki saat briefing. */
  rakiBriefing: string;
  /** Tingkat kesulitan: 1 mudah, 2 sedang, 3 sulit. Tanpa nilai = belum ditentukan. */
  level?: 1 | 2 | 3;
  /**
   * Visual berupa gambar (soal buatan panitia, scene = 'gambar'). Bila ada, client menampilkan
   * gambar ini di tempat adegan 2D dan pemain menjawab lewat daftar pilihan.
   */
  image?: { src: string; alt: string } | null;
}

/** Jawaban satu langkah. */
export type StepAnswer = string | string[] | number | Record<string, string> | null;

/** Jawaban satu misi: stepId -> jawaban. */
export type MissionAnswer = Record<string, StepAnswer>;

export interface StepReveal {
  stepId: string;
  prompt: string;
  weight: number;
  /** Jawaban benar dalam bentuk teks siap tampil. */
  correctText: string[];
  explanation: string;
  /**
   * Bentuk mesin dari jawaban benar (id, bukan teks) supaya adegan bisa menandai
   * objek yang tepat. Ikut aturan yang sama: hanya dikirim saat REVEAL.
   */
  correct?: {
    optionIds?: string[];
    assign?: Record<string, string>;
    value?: number;
  };
}

export interface MissionReveal {
  missionId: string;
  roundIndex: number;
  summary: string;
  learning: string;
  steps: StepReveal[];
  /**
   * Ringkasan & penjelasan dalam bahasa lain (per stepId). Ikut aturan yang sama dengan kunci:
   * hanya ada di server dan baru dikirim saat REVEAL. Opsional: tanpa ini client memakai teks Indonesia.
   */
  terjemahan?: Partial<Record<'en' | 'zh', { summary: string; steps: Record<string, string> }>>;
}

export interface RoundResult {
  roundIndex: number;
  answered: boolean;
  accuracy: number;
  basePoints: number;
  speedBonus: number;
  roundScore: number;
  elapsedMs: number;
}

export interface PlayerLook {
  body: number;
  skin: number;
  hair: number;
  accessory: 'none' | 'helm' | 'jaket' | 'headset' | 'topi';
  color: number;
}

export interface PlayerPublic {
  id: string;
  nickname: string;
  look: PlayerLook;
  connected: boolean;
  ready: boolean;
  totalPoints: number;
  rank: number;
  /** true bila pemain sudah mengirim jawaban pada ronde aktif. */
  submittedThisRound: boolean;
  /** Detik sejak ronde dimulai saat jawaban masuk (papan aktivitas host). */
  submitElapsedSeconds: number | null;
  /**
   * true bila adegan 3D ronde ini sudah siap di perangkat pemain.
   * Informasi untuk host; TIDAK memberi tambahan waktu individual.
   */
  sceneReady: boolean;
}

export interface LeaderRow {
  playerId: string;
  nickname: string;
  look: PlayerLook;
  rank: number;
  totalPoints: number;
  totalAccuracy: number;
  totalTimeMs: number;
  answeredCount: number;
  /** Perubahan peringkat dibanding ronde sebelumnya (+ naik, - turun). */
  delta: number;
  tied: boolean;
}

export interface Prizes {
  first: string;
  second: string;
  third: string;
}

export interface RoomPublicState {
  code: string;
  eventName: string;
  phase: Phase;
  /** Fase sebelum PAUSED. */
  prevPhase: Phase | null;
  pausedRemainingMs: number | null;
  roundIndex: number;
  totalRounds: number;
  /** Waktu server saat snapshot (epoch ms) untuk sinkronisasi timer client. */
  serverNow: number;
  /** Deadline fase saat ini (epoch ms) atau null bila tak bertimer. */
  phaseEndsAt: number | null;
  phaseDurationMs: number | null;
  autoAdvance: boolean;
  prizes: Prizes;
  players: PlayerPublic[];
  playerCount: number;
  connectedCount: number;
  spectatorCount: number;
  submittedCount: number;
  /** Jumlah pemain yang adegan ronde ini sudah siap (lihat PlayerPublic.sceneReady). */
  sceneReadyCount: number;
  mission: MissionPublic | null;
  reveal: MissionReveal | null;
  leaderboard: LeaderRow[] | null;
  podium: LeaderRow[] | null;
  joinUrl: string;
  tie: boolean;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface Badge {
  id: string;
  label: string;
  desc: string;
  icon: IconKey;
}

/** Data privat pemain; dikirim hanya ke socket pemain terkait. */
export interface MePrivate {
  playerId: string;
  nickname: string;
  look: PlayerLook;
  rank: number;
  totalPoints: number;
  totalAccuracy: number;
  totalTimeMs: number;
  answeredCount: number;
  rounds: RoundResult[];
  badges: Badge[];
  /** Ronde yang jawabannya sudah diterima server (anti double-submit). */
  submittedRound: number | null;
  /** Echo jawaban yang tersimpan di server untuk ronde aktif. */
  submittedAnswer: MissionAnswer | null;
}

export type HostAction =
  | 'startTutorial'
  | 'startMatch'
  | 'pause'
  | 'resume'
  | 'next'
  | 'closeRound'
  | 'end'
  | 'reset'
  | 'kick'
  | 'tiebreak'
  /** Minta satu pemain memuat ulang adegan 3D-nya. */
  | 'retryScene';

export interface Ack<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

/** Panjang playlist BAWAAN. Jumlah ronde sebuah room = RoomPublicState.totalRounds (bisa berbeda). */
export const TOTAL_ROUNDS = 10;
