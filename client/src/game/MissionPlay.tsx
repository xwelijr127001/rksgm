/**
 * Satu layar misi: kartu tugas + adegan 2D (engine) + panel jawaban (HTML) + bar aksi.
 *
 * Draft jawaban dimiliki pemanggil (Play/Practice/Tutorial). Ketukan adegan dan
 * kontrol HTML sama-sama memanggil fungsi di draft.ts lalu `onAnswer`, sehingga
 * keduanya selalu sinkron dan tunduk pada aturan yang sama.
 *
 * Tata letak diatur per keadaan lewat CSS grid-area (stage.css), bukan dengan
 * memindah elemen di DOM: adegan tidak pernah dimuat ulang saat rotasi/resize atau
 * saat berpindah dari menjawab ke pembahasan, sehingga pilihan pemain tidak hilang.
 *
 * Misi bergambar (soal buatan panitia, lihat gambar.ts): slot adegan diisi AdeganGambar, engine
 * tidak dimuat, dan seluruh jawaban lewat panel HTML. Tidak ada objek yang bisa diketuk, jadi
 * petunjuk, contoh "cara main", dan pembahasan tidak pernah menyebut ketukan/tanda di gambar.
 *
 * Akses info (aksesInfo.ts): checklist, dokumen, dan keterangan objek `info` di adegan selalu punya
 * tombol HTML ("Lihat checklist", "Dokumen"), jadi mode ringan & engine gagal tidak kehilangan
 * informasi. Selama adegan belum bisa diketuk (memuat/ringan/gagal), petunjuk & "Cara main" memakai
 * mekanik daftar, bukan "ketuk gambar". Hal yang sama untuk langkah yang tidak punya objek pilihan/item di adegan
 * (mis. aktivitas cerita polis: kartu polis hanya membuka dokumen): petunjuknya selalu "pilih dari daftar".
 *
 * Keyboard: bar aksi yang lengket menjadi scroll-padding-bottom dokumen (fokus Tab/panah tidak berhenti di balik
 * bar); grup radio/tab = satu tab stop dengan navigasi panah (panahGrup).
 *
 * API tambahan (docs/rancangan-mode-cerita.md bagian 6): `fokus` menimpa heuristik tata letak,
 * `kiatAwal` = petunjuk kunjungan pertama satu baris (di akhir panel jawaban, dekat bar aksi), PanelBantu
 * memberi cara main ringkas & tombol dokumen untuk panel briefing/"Siap mulai". Pemanggil lama (Play,
 * SoloMain, Tutorial) tetap jalan.
 */

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { MissionAnswer, MissionPublic, MissionReveal, OptionDef, PlayerLook, StepAnswer, StepDef } from '@shared/types';
import { TOKOH } from '@shared/brand';
import { formatRupiah } from '@shared/scoring';
import { Icon } from '../art/Icon';
import { Raki } from '../art/Raki';
import { playSfx } from '../audio/audio';
import { useReducedMotion } from '../hooks';
import { bahasaKini, t, useBahasa } from '../i18n';
import { DocTableView, Modal, PolicyCardView } from '../ui/kit';
import {
  asList, asNumber, asRecord, asText, assignItem, chooseSingle, missingParts, missionStarted, resolveTap,
  stepComplete, stepStarted, toggleMulti, unassignItem, urutanTampil, type Change,
} from './draft';
import { AdeganGambar } from './AdeganGambar';
import {
  ID_CHECKLIST, adeganBertanda, aksesInfo, fxLangkah, kunciPetunjuk, teksInfoAdegan, tombolUntuk, type AksesInfo, type JenisTombol,
} from './aksesInfo';
import { bacaAngka, misiBergambar, visualMisi } from './gambar';
import { GameStage, type StageApi, type StageStatus } from './GameStage';
import { judulHasil, nilaiMisi, statusMisi, type BarisHasil, type HasilLangkah } from './hasil';
import { PotretTokoh } from './KarakterTokoh';
import { sceneFor } from './scenes';
import type { ActionFx, SceneSpec, StageMode, StageStats, StageView } from './types';
import './stage.css';
import './acara-piksel.css';

export type SubmitState = 'idle' | 'sending' | 'sent' | 'failed';

/** Bantuan untuk panel non-menjawab (briefing, "Siap mulai", terkirim, pembahasan, jeda). */
export interface PanelBantu {
  /**
   * Buka dialog dokumen. `id` = dokumen yang disorot ('checklist', id kartu polis/tabel; tanpa id = semua).
   * `pembuka` = tombol yang menerima fokus lagi setelah dialog ditutup.
   */
  bukaDokumen: (id?: string, pembuka?: HTMLElement | null) => void;
  /** Adegan bisa diketuk (engine siap). false = memuat, mode ringan, engine gagal, atau misi bergambar. */
  interaktif: boolean;
  /** Cara main ringkas (satu kalimat per mekanik + cara mengirim), sadar mode adegan. */
  caraRingkas: ReactNode;
  /** Tombol "Lihat checklist" / "Lihat dokumen kasus" sesuai misi (null bila misi tidak punya). */
  tombolInfo: ReactNode;
}

export interface MissionPlayProps {
  mission: MissionPublic;
  /** -1 untuk latihan/tutorial. */
  roundIndex: number;
  look: PlayerLook;
  mode: StageMode;
  answer: MissionAnswer;
  onAnswer: (stepId: string, value: StepAnswer) => void;
  onSubmit?: () => void;
  submitState?: SubmitState;
  submitError?: string | null;
  /** false saat koneksi terputus: tombol kirim menunggu. */
  online?: boolean;
  reveal?: MissionReveal | null;
  /** Panel untuk mode selain 'play' (briefing, terkirim, pembahasan, jeda). */
  panel?: ReactNode | ((h: PanelBantu) => ReactNode);
  submitLabel?: string;
  /** Sisa waktu (ms) untuk tombol "kirim sekarang" saat waktu hampir habis. */
  remainingMs?: number | null;
  onSceneStatus?: (s: StageStatus, stats?: StageStats) => void;
  /** Ganti nilai ini untuk memuat ulang adegan (permintaan host). */
  sceneNonce?: number;
  /** Cerita sudah dibaca saat briefing (pertandingan): dilipat saat menjawab. */
  sudahBriefing?: boolean;
  /** Buka contoh "cara main" sejak awal (pemanasan). */
  bantuanAwal?: boolean;
  /**
   * Kunjungan pertama: petunjuk ringkas satu baris yang bisa ditutup (contoh lengkap tetap di "Cara main").
   * Tampil di akhir panel jawaban, tepat di atas bar aksi, supaya pilihan pertama tetap terlihat.
   */
  kiatAwal?: boolean;
  /** Menimpa heuristik tata letak saat menjawab: 'baca' = jawaban dulu, 'adegan' = adegan dulu. */
  fokus?: 'baca' | 'adegan';
  /** Keterangan di bawah adegan saat briefing (bawaan: "Gambar belum bisa disentuh. Sebentar lagi mulai."). */
  ketIntro?: string;
  // ---- Tambahan mode cerita (docs/rancangan-mode-cerita.md 11.5). Semua opsional: tanpa prop ini solo, latihan,
  // tutorial, dan pertandingan tampil & berperilaku persis seperti sebelumnya.
  /**
   * Isi di ATAS panel jawaban saat menjawab/jeda (mis. kartu polis yang bisa diperiksa), jadi tetap terlihat selama
   * memilih. Tidak tampil di briefing/pembahasan.
   */
  sisipanJawab?: ReactNode;
  /**
   * false = tanpa baris status "Pilihanmu: …" di atas pilihan (pilihan yang dipilih sudah bertanda "Dipilih").
   * Dipakai cerita bersama `sisipanJawab` (kartu polis) supaya pilihan pertama tetap muat di atas bar aksi di HP kecil.
   */
  statusPilihan?: boolean;
  /**
   * true = baris petunjuk di kartu tugas memakai `step.hint` (isi yang diajarkan, mis. "mobil yang mana, dan rusaknya di
   * mana") bila ada, menggantikan petunjuk mekanik umum. Dipakai cerita: cara mengetuk tetap ada di baki ("Ketuk di
   * gambar untuk menambah") dan di "Cara main".
   */
  petunjukLangkah?: boolean;
  /**
   * Mengganti teks dialog "kirim walau belum lengkap". Dipanggil dengan langkah PERTAMA yang belum lengkap
   * (`terisi`/`wajib` = pilihan/bagian yang terisi & yang diminta langkah itu; `kurang` = daftar bawaan). Hasil null
   * = dialog bawaan (misi.kirimSekarangTanya / misi.konfirmasiCatatan). `kembali` menutup dialog (fokus kembali ke
   * pembuka daftar pilihan bila ada), `kirim` mengirim apa adanya.
   */
  konfirmasiKurang?: (info: { kurang: string[]; terisi: number; wajib: number; langkah: StepDef }) => {
    judul: string; isi: ReactNode; kembali: string; kirim: string;
  } | null;
  /** Teks penghitung baki langkah pilih-banyak (mis. "0/3 foto"). Bawaan: "0 / 3". */
  labelHitung?: (n: number, maks: number) => string;
  /**
   * Baki ringkas untuk langkah pilih-banyak: tanpa slot kosong setinggi kartu; pilihan tampil sebagai baris ringkas
   * yang bisa dibatalkan, sisanya satu baris pendek. Saat mulai menjawab, pembuka "Pilih lewat daftar" (di bawah
   * baki) ikut dijaga terlihat di atas bar aksi yang lengket.
   */
  albumRingkas?: boolean;
  /**
   * Potret pemandu Miss Raksa pengganti di kartu tugas (cerita: potret v3 satu keluarga dengan panggung). Tanpa prop ini
   * = potret sprite bawaan; tidak dipakai bila pemandunya Raki (tutorial / Miss Raksa nonaktif).
   */
  potretPemandu?: ReactNode;
  /**
   * Visual pengganti untuk misi TANPA adegan 2D (scene 'gambar'): mis. panggung latar episode cerita yang sama dengan
   * dialognya. Tidak bisa diketuk (jawaban lewat daftar); diabaikan untuk misi beradegan.
   */
  visual?: ReactNode;
  /**
   * true = jawaban yang belum lengkap TIDAK bisa dikirim: dialog kekurangan hanya menawarkan kembali melengkapi (cerita
   * yang memetakan susunan lengkap ke akibat naskah). Tanpa prop ini = "kirim apa adanya" tetap tersedia.
   */
  wajibLengkap?: boolean;
}

// ------------------------------------------------------------------ teks bantu

/**
 * Teks ada di kamus `misi` (client/src/i18n/kamus/misi.ts) dan dibaca saat render lewat t(),
 * jadi ikut berganti begitu pemain mengganti bahasa.
 */

/** Baki tempat pilihan terkumpul, per efek ketukan. Judul: misi.baki<Baki>; pesan: misi.masuk<Baki> / misi.penuh<Baki>. */
type Baki = 'Album' | 'Folder' | 'Catatan' | 'Pilihan';
const BAKI: Record<ActionFx, Baki> = {
  photo: 'Album',
  file: 'Folder',
  note: 'Catatan',
  talk: 'Catatan',
  choose: 'Pilihan',
  stamp: 'Pilihan',
  tag: 'Pilihan',
};
const bakiDari = (fx: ActionFx | null): Baki => BAKI[fx ?? 'choose'];
const judulBaki = (fx: ActionFx | null): string => t(`misi.baki${bakiDari(fx)}`);

/**
 * Spasi antara label tebal ("Kasus:") atau kalimat dengan lanjutannya. Tanda baca Mandarin
 * selebar satu aksara dan sudah membawa jaraknya sendiri, jadi di sana tanpa spasi.
 */
export function sela(): string {
  return bahasaKini() === 'zh' ? '' : ' ';
}

/**
 * Keterangan objek `info` di adegan (mis. kalender). Teks Indonesianya ada di berkas adegan dan dipakai
 * apa adanya; terjemahannya di kamus: misi.info.<idMisi>.<idObjek> (kelengkapan dijaga draft.test.ts).
 * Tanpa terjemahan = teks adegan. Satu baris (tampil di panel & dialog HTML).
 */
function teksInfo(missionId: string, objectId: string, asli: string): string {
  return teksInfoAdegan(missionId, objectId, asli, bahasaKini(), t);
}

/**
 * Satu kalimat petunjuk: apa yang diketuk dan bahwa pilihan masih bisa diganti. "Ketuk di gambar" hanya bila
 * adegan bisa diketuk DAN langkah ini punya objek pilihan/item di adegan (aksesInfo.ts kunciPetunjuk).
 * Petunjuk menyebut WADAH yang sama dengan judul bakinya (judulBaki): langkah multi yang pilihannya terkumpul
 * di "Pilihanmu" (fx choose/stamp/tag, mis. paket acara a01) tidak disuruh mencari "Catatan temuan".
 */
function petunjuk(step: StepDef, fx: ActionFx | null, adeganAktif: boolean, bergambar = false): string {
  const kunci = kunciPetunjuk(step, fx, adeganAktif, bergambar);
  return t(kunci === 'misi.petunjukMultiCatat' && bakiDari(fx) === 'Pilihan' ? 'misi.petunjukMultiPilih' : kunci);
}

function labelDari(opsi: OptionDef[], id: string): string {
  return opsi.find((o) => o.id === id)?.label ?? id;
}

function teksAngka(step: Extract<StepDef, { kind: 'number' }>, n: number): string {
  if (step.format === 'rupiah') return formatRupiah(n);
  // Bilangan bulat ditulis apa adanya (perilaku lama); pecahan (soal kustom) dengan koma desimal bahasa aktif.
  const angka = Number.isInteger(n) ? String(n) : n.toLocaleString(bahasaKini() === 'id' ? 'id-ID' : 'en-US', { maximumFractionDigits: 6, useGrouping: false });
  return `${angka}${step.unit ? ' ' + step.unit : ''}`;
}

/** Ringkasan jawaban satu langkah dalam bahasa sehari-hari (`step` = langkah misi yang sudah diterjemahkan). */
export function ringkas(step: StepDef, v: StepAnswer | undefined): string {
  if (step.kind === 'single') return asText(v) ? labelDari(step.options, asText(v)) : t('misi.belumDipilih');
  if (step.kind === 'multi') {
    const l = asList(v);
    return l.length ? l.map((id) => labelDari(step.options, id)).join(' · ') : t('misi.belumDipilih');
  }
  if (step.kind === 'assign') {
    const peta = asRecord(v);
    const baris = step.items.filter((i) => peta[i.id]).map((i) => `${i.label}: ${labelDari(step.buckets, peta[i.id]!)}`);
    return baris.length ? baris.join(' · ') : t('misi.belumDipilih');
  }
  if (step.kind === 'number') {
    const n = asNumber(v);
    return n === null ? t('misi.belumDiisi') : teksAngka(step, n);
  }
  return asList(v).map((id) => labelDari(step.items, id)).join(' → ') || t('misi.belumDiisi');
}

/** Data untuk `konfirmasiKurang`: langkah pertama yang belum lengkap + jumlah yang terisi & yang diminta. */
function infoKurang(mission: MissionPublic, answer: MissionAnswer, kurang: string[], cadangan: StepDef): { kurang: string[]; terisi: number; wajib: number; langkah: StepDef } {
  const langkah = mission.steps.find((s) => !stepComplete(s, answer[s.id])) ?? cadangan;
  const v = answer[langkah.id];
  if (langkah.kind === 'multi') return { kurang, terisi: asList(v).length, wajib: Math.max(1, langkah.requiredSelections), langkah };
  if (langkah.kind === 'assign') {
    const peta = asRecord(v);
    return { kurang, terisi: langkah.items.filter((i) => peta[i.id]).length, wajib: langkah.items.length, langkah };
  }
  if (langkah.kind === 'order') return { kurang, terisi: asList(v).length, wajib: langkah.items.length, langkah };
  return { kurang, terisi: stepStarted(langkah, v) ? 1 : 0, wajib: 1, langkah };
}

function layarPendek(): boolean {
  try { return window.matchMedia('(max-height: 540px)').matches; } catch { return false; }
}

/**
 * Cara main ringkas untuk briefing & kartu "Siap mulai": satu kalimat per mekanik (tanpa duplikat)
 * + cara mengirim. Sadar mode: adegan yang belum/tidak bisa diketuk = mekanik daftar.
 */
function CaraRingkas({ mission, spec, interaktif, bergambar, tombol }: {
  mission: MissionPublic;
  spec: SceneSpec | null;
  interaktif: boolean;
  bergambar: boolean;
  tombol: string;
}) {
  useBahasa();
  const kalimat = [...new Set(mission.steps.map((s) => petunjuk(s, fxLangkah(spec, s.id), interaktif, bergambar)))].slice(0, 2);
  kalimat.push(t(mission.steps.length > 1 ? 'misi.caraLaluKirimBanyak' : 'misi.caraLaluKirim', { tombol }));
  return <ul className="misi-cara-ringkas">{kalimat.map((k) => <li key={k}>{k}</li>)}</ul>;
}

/** Misi hitung butuh ruang membaca & menjawab; misi mencari bukti butuh ruang adegan. */
function fokusMisi(mission: MissionPublic): 'baca' | 'adegan' {
  // Misi bergambar: gambar ADALAH bahan bacaannya (tanpa dokumen), jadi selalu di atas jawaban.
  // Bingkai netral (tanpa gambar) hanya hiasan: pertanyaan & pilihan dulu.
  const visual = visualMisi(mission).jenis;
  if (visual !== 'adegan') return visual === 'gambar' ? 'adegan' : 'baca';
  return mission.steps.some((s) => s.kind === 'number') ? 'baca' : 'adegan';
}

// ------------------------------------------------------------------ komponen utama

export function MissionPlay(props: MissionPlayProps) {
  const { mission, roundIndex, look, mode, answer, onAnswer, onSubmit, reveal = null, albumRingkas = false } = props;
  const submitState = props.submitState ?? 'idle';
  const online = props.online ?? true;
  const reduced = useReducedMotion();
  // `mission` dari pemanggil sudah dalam bahasa aktif; label yang digambar di adegan ikut bahasa itu.
  const { bahasa } = useBahasa();
  // Gambar menang atas adegan: misi bergambar tidak punya objek adegan sama sekali (spec = null).
  const visual = useMemo(() => visualMisi(mission).jenis, [mission]);
  const bergambar = visual !== 'adegan';
  const spec =useMemo(() => (bergambar ? null : sceneFor(mission, bahasa)), [mission, bahasa, bergambar]);
  const [cursor, setCursor] = useState(0);
  const [fokusItem, setFokusItem] = useState<Record<string, string>>({});
  const [umumkan, setUmumkan] = useState('');
  const [pesan, setPesan] = useState('');
  const [ceritaBuka, setCeritaBuka] = useState(() => !props.sudahBriefing && !layarPendek());
  const [bantuanBuka, setBantuanBuka] = useState(Boolean(props.bantuanAwal));
  const [kiatBuka, setKiatBuka] = useState(Boolean(props.kiatAwal) && !props.bantuanAwal);
  const [dokumen, setDokumenState] = useState<string | null>(null);
  const dokumenDibuka = useRef(0);
  /** Penerima fokus setelah dialog dokumen ditutup (tombol pembuka, atau tombol Dokumen/Checklist bila dari kanvas). */
  const kembaliDokumen = useRef<HTMLElement | (() => HTMLElement | null) | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<string[] | null>(null);
  const [status, setStatus] = useState<StageStatus>('loading');
  const api = useRef<StageApi | null>(null);
  const answerRef = useRef(answer);
  answerRef.current = answer;
  const akar = useRef<HTMLDivElement>(null);
  const adeganRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const tanyaRef = useRef<HTMLHeadingElement>(null);

  const step = mission.steps[Math.min(cursor, mission.steps.length - 1)]!;
  const terakhir = cursor >= mission.steps.length - 1;
  // "Aktif" = ada objek yang bisa diketuk. Gambar yang sudah tampil tetap bukan adegan interaktif.
  const adeganAktif = !bergambar && status === 'ready';
  const akses = useMemo(() => aksesInfo(mission, spec), [mission, spec]);
  // Legenda ✓ ✕ ! hanya bila pembahasan memang memberi tanda di adegan (bukan adegan dokumen/papan saja).
  const bertanda = useMemo(() => adeganBertanda(mission, spec), [mission, spec]);

  /** Tombol HTML pembuka dokumen jenis ini yang sedang tampil (baris alat, baki, atau panel briefing). */
  const cariPembuka = useCallback((jenis: JenisTombol | null): HTMLElement | null => {
    const el = akar.current;
    if (!el) return null;
    return (jenis ? el.querySelector<HTMLElement>(`[data-misi-buka="${jenis}"]`) : null) ?? el.querySelector<HTMLElement>('[data-misi-buka]');
  }, []);
  const bukaDokumen = useCallback((id: string, pembuka?: HTMLElement | (() => HTMLElement | null) | null) => {
    dokumenDibuka.current = performance.now();
    kembaliDokumen.current = pembuka ?? (() => cariPembuka(tombolUntuk(akses, id)));
    setDokumenState(id);
  }, [akses, cariPembuka]);

  // Item assign yang sedang dipilih; default = item pertama yang belum dijawab.
  const itemAktif = useMemo(() => {
    if (step.kind !== 'assign') return null;
    const pilihan = fokusItem[step.id];
    if (pilihan && step.items.some((i) => i.id === pilihan)) return pilihan;
    const peta = asRecord(answer[step.id]);
    return (step.items.find((i) => !peta[i.id]) ?? step.items[0])?.id ?? null;
  }, [step, fokusItem, answer]);

  const view: StageView = useMemo(() => ({
    mode,
    focusStepId: mode === 'play' ? step.id : null,
    focusItemId: mode === 'play' ? itemAktif : null,
    answer,
    reveal,
    reducedMotion: reduced,
  }), [mode, step.id, itemAktif, answer, reveal, reduced]);
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => { setCursor(0); setFokusItem({}); setUmumkan(''); setPesan(''); }, [mission.id, roundIndex]);
  // Visual milik pemanggil (cerita) menggantikan bingkai gambar: laporkan selesai dimuat seperti gambar netral.
  const visualPemanggil = Boolean(props.visual) && bergambar;
  const onSceneStatus = props.onSceneStatus;
  useEffect(() => {
    if (!visualPemanggil) return;
    setStatus('static');
    onSceneStatus?.('static');
  }, [visualPemanggil, mission.id, roundIndex, onSceneStatus]);
  // Pesan yang sedang tampil masih dalam bahasa lama: kosongkan saat bahasa berganti (jawaban tidak disentuh).
  useEffect(() => { setUmumkan(''); setPesan(''); }, [bahasa]);

  // Kelola fokus saat tahap berganti: judul tahap baru mendapat fokus & terlihat.
  const fokusKe = useCallback((el: HTMLElement | null | undefined) => {
    if (!el) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  }, [reduced]);
  /**
   * Mulai menjawab (briefing/"Siap mulai" -> menjawab): pertanyaan difokuskan, lalu halaman digeser
   * SEPERLUNYA supaya pilihan pertama terlihat utuh di atas bar aksi yang lengket. Urutan prioritas:
   * pertanyaan selalu terlihat utuh > pilihan pertama terlihat > kartu tugas utuh (bila muat, kartu
   * tidak digeser; bila tidak muat, baris "Pertanyaan n dari m" & tepi atas kartu boleh keluar layar).
   * Tidak ada geser bila semuanya sudah terlihat.
   */
  const tampakkanPilihan = useCallback(() => {
    const tanya = tanyaRef.current;
    if (tanya) { if (!tanya.hasAttribute('tabindex')) tanya.setAttribute('tabindex', '-1'); tanya.focus({ preventScroll: true }); }
    const tugas = akar.current?.querySelector<HTMLElement>('.misi-tugas');
    const panel = panelRef.current;
    // Kontrol pertama yang tampil (bukan yang di daftar terlipat); adegan interaktif = slot pertama baki bukti.
    let pertama = [...(panel?.querySelectorAll<HTMLElement>('.opsi, .angka, .kolom, .item-chip') ?? [])]
      .find((el) => el.getClientRects().length > 0 && !el.closest('details:not([open])'))
      ?? panel?.querySelector<HTMLElement>('.baki .slot') ?? panel?.querySelector<HTMLElement>('.baki');
    // Baki ringkas (cerita): pembuka daftar yang terlipat di bawah baki = jalan tanpa kanvas, jadi ikut terlihat utuh.
    if (albumRingkas) {
      const daftar = panel?.querySelector<HTMLElement>('.daftar-alternatif:not([open]) > summary');
      if (daftar && (!pertama || daftar.getBoundingClientRect().bottom > pertama.getBoundingClientRect().bottom)) pertama = daftar;
    }
    if (!tugas || !pertama) return;
    const aksi = akar.current?.querySelector<HTMLElement>('.misi-aksi');
    const lengket = aksi ? getComputedStyle(aksi).position === 'sticky' : false;
    const batas = lengket && aksi ? Math.min(window.innerHeight, aksi.getBoundingClientRect().top) : window.innerHeight;
    const kurang = pertama.getBoundingClientRect().bottom + 8 - batas;
    const atasKartu = tugas.getBoundingClientRect().top - 8;
    const atasTanya = (tanya ?? tugas).getBoundingClientRect().top - 8;
    // Kartu di atas layar (pemain tadi menggulir briefing): naik seperlunya, selama pilihan pertama tetap terlihat.
    const geser = Math.min(Math.max(Math.min(0, atasKartu), kurang), atasTanya);
    if (Math.abs(geser) > 0.5) window.scrollBy({ top: geser, behavior: reduced ? 'auto' : 'smooth' });
  }, [reduced, albumRingkas]);
  const modeLama = useRef(mode);
  useEffect(() => {
    if (modeLama.current === mode) return;
    const dari = modeLama.current;
    modeLama.current = mode;
    // Jeda & lanjut dari jeda: tempat pemain tidak dipindah (layout tetap sama, hanya terkunci).
    if (mode === 'paused' || dari === 'paused') return;
    // Setelah render panel baru.
    requestAnimationFrame(() => {
      if (mode === 'play') { tampakkanPilihan(); return; }
      const h = panelRef.current?.querySelector<HTMLElement>('h2');
      if (h) { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }, [mode, tampakkanPilihan]);
  const cursorLama = useRef(cursor);
  useEffect(() => {
    if (cursorLama.current === cursor) return;
    cursorLama.current = cursor;
    setPesan('');
    requestAnimationFrame(() => fokusKe(tanyaRef.current));
  }, [cursor, fokusKe]);

  /**
   * Bar aksi yang lengket menutupi bagian bawah layar (HP, tablet tegak, HP mendatar, laptop zoom 200%).
   * Tingginya dipasang sebagai scroll-padding-bottom dokumen (stage.css: --misi-aksi-lengket), jadi elemen
   * yang difokus lewat Tab/panah - dan scrollIntoView - digulir ke ATAS bar, tidak berhenti di baliknya
   * (WCAG 2.4.11). Desktop (bar ikut alur, tidak lengket) = tanpa padding.
   */
  useEffect(() => {
    if (mode !== 'play') return;
    const aksi = akar.current?.querySelector<HTMLElement>('.misi-aksi');
    if (!aksi) return;
    const root = document.documentElement;
    const ukur = (): void => {
      if (getComputedStyle(aksi).position === 'sticky') root.style.setProperty('--misi-aksi-lengket', `${aksi.offsetHeight + 12}px`);
      else root.style.removeProperty('--misi-aksi-lengket');
    };
    ukur();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(ukur);
    ro?.observe(aksi);
    // Rotasi/zoom bisa mengubah lengket <-> ikut alur tanpa mengubah tinggi bar.
    window.addEventListener('resize', ukur);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', ukur);
      root.style.removeProperty('--misi-aksi-lengket');
    };
  }, [mode]);

  /**
   * Pilihan lewat keyboard mengubah tata letak (slot album bertambah, pesan muncul) sehingga kontrol yang sedang
   * difokus bergeser - bisa ke balik bar aksi atau keluar layar. Setelah jawaban berubah dari kontrol di panel,
   * kontrol itu dibawa kembali ke tampilan seperlunya (scroll-padding di atas = di atas bar aksi).
   */
  const jagaFokus = useRef(false);
  useLayoutEffect(() => {
    if (!jagaFokus.current) return;
    jagaFokus.current = false;
    const el = document.activeElement;
    if (el instanceof HTMLElement && el !== document.body && panelRef.current?.contains(el)) el.scrollIntoView({ block: 'nearest' });
  }, [answer]);

  /** `lanjut` false = jangan pindah otomatis ke bagian berikutnya (panah di grup kategori; lihat panahGrup). */
  const terapkan = useCallback((c: Change, lanjut = true) => {
    if (c.kind === 'unchanged') return;
    const s = mission.steps.find((x) => x.id === c.stepId);
    if (c.kind === 'full') {
      const teks = t(`misi.penuh${bakiDari(fxLangkah(spec, c.stepId))}`, { n: c.max, total: c.max });
      setUmumkan(teks);
      setPesan(teks);
      playSfx('tik');
      if (spec && s) api.current?.highlight(spec.objects.filter((o) => o.stepId === s.id && asList(answerRef.current[s.id]).includes(o.refId)).map((o) => o.id));
      return;
    }
    setPesan('');
    jagaFokus.current = true;
    onAnswer(c.stepId, c.value);
    if (!s) return;
    if (c.kind === 'added' && s.kind === 'multi') {
      setUmumkan(t(`misi.masuk${bakiDari(fxLangkah(spec, s.id))}`, { label: labelDari(s.options, c.refId), n: c.count, total: c.max }));
      playSfx('bukti');
    } else if (c.kind === 'removed' && s.kind === 'multi') {
      setUmumkan(t('misi.dibatalkan', { label: labelDari(s.options, c.refId), n: c.count, total: c.max }));
      playSfx('pilih');
    } else if (c.kind === 'chosen' && s.kind === 'single') {
      setUmumkan(t('misi.pilihanTersimpan', { label: labelDari(s.options, c.refId) }));
      playSfx('pilih');
    } else if (c.kind === 'chosen' && s.kind === 'number' && typeof c.value === 'number') {
      setUmumkan(t('misi.jawabanmuUmumkan', { nilai: teksAngka(s, c.value) }));
      playSfx('pilih');
    } else if (c.kind === 'assigned' && s.kind === 'assign') {
      setUmumkan(t('misi.kategoriDitetapkan', { item: labelDari(s.items, c.itemId), kategori: labelDari(s.buckets, c.bucketId) }));
      playSfx('bukti');
      // Lanjut otomatis ke bagian berikutnya yang belum dipilih (ketukan/klik/Spasi). Panah: tetap di bagian ini
      // (dipasang eksplisit; tanpa itu bagian aktif bawaan = bagian pertama yang belum dipilih = ikut pindah).
      const peta = asRecord(c.value);
      const berikut = lanjut ? s.items.find((i) => !peta[i.id]) : s.items.find((i) => i.id === c.itemId);
      if (berikut) setFokusItem((f) => ({ ...f, [s.id]: berikut.id }));
    } else if (c.kind === 'unassigned' && s.kind === 'assign') {
      setUmumkan(t('misi.dikosongkan', { label: labelDari(s.items, c.itemId) }));
      playSfx('pilih');
    }
  }, [mission, onAnswer, spec]);

  const ketukAdegan = useCallback((objectId: string) => {
    if (!spec) return;
    const v = viewRef.current;
    const r = resolveTap(mission, spec, v, objectId);
    if (r.kind === 'change') terapkan(r.change);
    else if (r.kind === 'focusItem') {
      const s = mission.steps.find((x) => x.id === r.stepId);
      setFokusItem((f) => ({ ...f, [r.stepId]: r.itemId }));
      if (s && s.kind === 'assign') setUmumkan(t('misi.bagianDipilih', { label: labelDari(s.items, r.itemId) }));
      playSfx('pilih');
    } else if (r.kind === 'needItem') {
      const teks = t('misi.pilihBagianDulu');
      setUmumkan(teks);
      setPesan(teks);
      api.current?.highlight(spec.objects.filter((o) => o.stepId === r.stepId && o.role === 'item').map((o) => o.id));
    } else if (r.kind === 'openDoc') {
      // Dibuka dari kanvas: setelah ditutup, fokus ke tombol HTML yang juga membuka dokumen ini.
      bukaDokumen(r.docId);
      playSfx('pilih');
    } else if (r.kind === 'info') {
      // Keterangan tampil di panel HTML, bukan balon di adegan (tidak menutupi objek).
      const teks = teksInfo(mission.id, r.objectId, r.text);
      setUmumkan(teks);
      setPesan(teks);
      playSfx('tik');
    } else if (r.reason === 'other-step') {
      const teks = t('misi.bendaLangkahLain');
      setUmumkan(teks);
      setPesan(teks);
    }
  }, [mission, spec, terapkan, bukaDokumen]);

  function kirim(): void {
    if (!onSubmit || submitState === 'sending' || !online) return;
    const kurang = missingParts(mission, answerRef.current, t);
    if (kurang.length && missionStarted(mission, answerRef.current)) {
      setKonfirmasi(kurang);
      return;
    }
    onSubmit();
  }

  const bolehKirim = mode === 'play' && missionStarted(mission, answer) && submitState !== 'sending' && online;
  const fx = fxLangkah(spec, step.id);
  // Langkah ini punya objek pilihan/item di adegan. Tanpa objek (mis. aktivitas cerita polis, misi 7) jawabannya
  // hanya lewat daftar, juga saat adegan bisa diketuk: daftar langsung terbuka & tidak menyebut ketukan gambar.
  const langkahDiAdegan = fx !== null;
  const sisa = props.remainingMs ?? null;
  const labelKirim = props.submitLabel ?? t('misi.kirimLaporan');
  const tombolInfo = (
    <TombolInfo akses={akses} buka={bukaDokumen} kelas="alat" teksDokumen={t('misi.lihatDokumen')} />
  );
  const bantu: PanelBantu = {
    bukaDokumen: (id, pembuka) => bukaDokumen(id ?? 'semua', pembuka ?? undefined),
    interaktif: adeganAktif,
    caraRingkas: <CaraRingkas mission={mission} spec={spec} interaktif={adeganAktif} bergambar={bergambar} tombol={labelKirim} />,
    tombolInfo: akses.tombolChecklist || akses.tombolDokumen ? <div className="misi-info-tombol">{tombolInfo}</div> : null,
  };
  const pemandu = mission.id === 'tutorial' || !TOKOH.missRaksa.aktif ? 'raki' : 'missRaksa';
  // Jeda memakai tata letak menjawab (tidak melompat), kontrol dikunci.
  const menjawab = mode === 'play' || mode === 'paused';
  const panelLuar = typeof props.panel === 'function' ? props.panel(bantu) : props.panel;
  const ketAksi = !terakhir
    ? (stepStarted(step, answer[step.id]) ? t('misi.ketTersimpan') : t('misi.ketJawabDulu'))
    : !missionStarted(mission, answer) ? t('misi.ketIsiDulu') : t('misi.ketBelumDikirim');

  // Mode ringan / engine gagal (tanpa kanvas yang bisa diketuk): gambarnya hanya rujukan dan jawaban lewat
  // daftar, jadi daftar didahulukan - juga bila pemanggil meminta fokus 'adegan' (aktivitas cerita).
  const tanpaKanvas = !bergambar && (status === 'static' || status === 'failed');
  const fokus = tanpaKanvas ? 'baca' : (props.fokus ?? fokusMisi(mission));

  // Teks dialog "belum lengkap" dari pemanggil (cerita), dihitung dari langkah pertama yang belum lengkap.
  const kurangKustom = konfirmasi && props.konfirmasiKurang ? props.konfirmasiKurang(infoKurang(mission, answer, konfirmasi, step)) : null;

  return (
    <div ref={akar} className={`misi misi-${mode}`} data-mode={mode} data-fokus={fokus} data-visual={visual} data-paket={/^a\d\d-/.test(mission.id) ? 'acara' : undefined}>
      {menjawab ? (
        <header className="misi-tugas">
          {mission.steps.length > 1 ? (
            <div className="misi-langkah" aria-label={t('misi.pertanyaanKe', { n: cursor + 1, total: mission.steps.length })}>
              <span>{t('misi.pertanyaanKe', { n: cursor + 1, total: mission.steps.length })}</span>
              <div aria-hidden="true">{mission.steps.map((s, i) => <i key={s.id} className={(i === cursor ? 'kini ' : '') + (stepComplete(s, answer[s.id]) ? 'terisi' : '')} />)}</div>
            </div>
          ) : null}
          <div className="tugas-inti">
            <span className="tugas-pemandu" aria-hidden="true">
              {pemandu === 'raki' ? <Raki size={44} mood="sapa" /> : props.potretPemandu ?? <PotretTokoh tokoh="missRaksa" ukuran={44} />}
            </span>
            <div>
              <h2 ref={tanyaRef} id="misi-tanya" className="misi-tanya">{step.prompt}</h2>
              <p className="misi-petunjuk">{props.petunjukLangkah && step.hint ? step.hint : petunjuk(step, fx, adeganAktif, bergambar)}</p>
            </div>
          </div>
          <div className="tugas-alat">
            <button type="button" className="alat" aria-expanded={ceritaBuka} aria-controls="misi-cerita" onClick={() => setCeritaBuka((b) => !b)}>
              <Icon name="daftar" size={17} /> {t('misi.cerita')}
            </button>
            <TombolInfo akses={akses} buka={bukaDokumen} kelas="alat" teksDokumen={t('misi.dokumen')} teksChecklist={t('misi.checklist')} />
            <button type="button" className="alat" aria-expanded={bantuanBuka} aria-controls="misi-bantuan" onClick={() => { setBantuanBuka((b) => !b); setKiatBuka(false); }}>
              <Icon name="tanya" size={17} /> {t('misi.caraMain')}
            </button>
          </div>
          {ceritaBuka ? <p id="misi-cerita" className="tugas-cerita"><b>{t('misi.kasus')}</b>{sela()}{mission.story}</p> : null}
          {bantuanBuka ? <div id="misi-bantuan"><CaraMain mission={mission} langkah={step} interaktif={adeganAktif} onTutup={() => setBantuanBuka(false)} /></div> : null}
        </header>
      ) : null}

      <div ref={adeganRef} className="misi-adegan">
        {props.visual && bergambar ? (
          // Visual milik pemanggil (cerita: panggung latar episode); seperti gambar, tidak bisa diketuk.
          props.visual
        ) : bergambar ? (
          // Tanpa engine. Status tetap diteruskan (siap ATAU gagal) supaya host tidak menunggu selamanya.
          <AdeganGambar
            key={`${mission.id}:${roundIndex}:${props.sceneNonce ?? 0}`}
            mission={mission}
            onStatus={(s) => { setStatus(s); props.onSceneStatus?.(s); }}
          />
        ) : (
          <GameStage
            key={`${mission.id}:${roundIndex}:${props.sceneNonce ?? 0}`}
            mission={mission}
            spec={spec}
            roundIndex={roundIndex}
            look={look}
            view={view}
            onTap={ketukAdegan}
            apiRef={api}
            label={t('misi.adeganLabel', { lokasi: mission.location })}
            onStatus={(s, st) => { setStatus(s); props.onSceneStatus?.(s, st); }}
          />
        )}
        {/* Legenda hanya bila ada tanda di adegan: misi bergambar, adegan statis, dan adegan tanpa objek
            pilihan/item (mis. kartu dokumen saja) tidak punya tanda. */}
        {mode === 'reveal' && adeganAktif && reveal && bertanda ? <LegendaTanda /> : null}
        {mode === 'intro' && !bergambar ? <p className="adegan-ket">{props.ketIntro ?? t('misi.adeganBelumBisa')}</p> : null}
        {/* Tampil sejak gambar masih dimuat supaya panel di bawahnya tidak bergeser saat gambar datang. */}
        {mode === 'intro' && visual === 'gambar' && status !== 'failed' ? <p className="adegan-ket">{t('misi.gambarAmati')}</p> : null}
        {status === 'failed' && menjawab && !bergambar ? (
          <p className="adegan-catatan" role="status">{t('misi.adeganGagal')}</p>
        ) : null}
      </div>

      <section ref={panelRef} className="misi-panel" aria-label={menjawab ? t('misi.panelJawaban') : t('misi.panelStatus')}>
        {!menjawab ? panelLuar : (
          <>
            {/* Jeda: pemberitahuan di atas pilihan; pilihan tetap terlihat tetapi terkunci. */}
            {mode === 'paused' ? panelLuar : null}
            {props.sisipanJawab ?? null}
            {props.statusPilihan === false ? null : <StatusPilihan step={step} value={answer[step.id]} />}
            <KontrolLangkah
              key={step.id}
              step={step}
              seed={mission.id + ':' + step.id}
              value={answer[step.id]}
              fx={fx}
              adeganAktif={adeganAktif && langkahDiAdegan}
              memuat={!bergambar && status === 'loading' && langkahDiAdegan}
              angkaBebas={bergambar}
              itemAktif={itemAktif}
              onFokusItem={(id) => setFokusItem((f) => ({ ...f, [step.id]: id }))}
              terapkan={(c, lanjut) => terapkan(c, lanjut)}
              disabled={submitState === 'sending' || mode === 'paused'}
              bukaChecklist={akses.tombolChecklist ? (pembuka) => bukaDokumen(ID_CHECKLIST, pembuka) : undefined}
              ringkas={albumRingkas}
              labelHitung={props.labelHitung}
            />
            {/* Petunjuk kunjungan pertama: tepat di atas bar aksi yang dirujuknya ("tekan ... di bawah"), bukan
                di kartu tugas, supaya tidak mendorong pilihan pertama ke bawah bar aksi di HP pendek. */}
            {kiatBuka && !bantuanBuka ? (
              <p className="misi-kiat" role="note">
                <span className="misi-kiat-ikon" aria-hidden="true"><Icon name="kilat" size={16} /></span>
                <span className="misi-kiat-teks">{t(mission.steps.length > 1 ? 'misi.kiatPertamaBanyak' : 'misi.kiatPertama', { tombol: labelKirim })}</span>
                <button type="button" className="misi-kiat-tutup" onClick={() => { setKiatBuka(false); tanyaRef.current?.focus({ preventScroll: true }); }} aria-label={t('misi.tutupPetunjuk')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
                </button>
              </p>
            ) : null}
            <p className="sr-only" aria-live="polite">{umumkan}</p>
            {pesan ? <p className="misi-pesan" role="status"><Icon name="tanya" size={18} /><span>{pesan}</span></p> : null}
            {props.submitError && submitState === 'failed' ? (
              <div className="misi-gagal" role="alert">
                <Icon name="silang" size={20} />
                <div><strong>{t('misi.gagalJudul')}</strong><br />{props.submitError}{sela()}{t('misi.gagalPeriksa')}{sela()}<b>{t('misi.kirimLagi')}</b>{t('misi.titik')}</div>
              </div>
            ) : null}
          </>
        )}
      </section>

      {mode === 'play' ? (
        <div className="misi-aksi">
          <div className="aksi-baris">
            {cursor > 0 ? (
              <button type="button" className="aksi-kembali" onClick={() => setCursor((c) => c - 1)} aria-label={t('misi.pertanyaanSebelumnya')}>
                <Panah balik />
              </button>
            ) : null}
            {!terakhir ? (
              <button type="button" className="primary-action" disabled={!stepStarted(step, answer[step.id])} onClick={() => setCursor((c) => c + 1)}>
                {t('misi.lanjutKe', { n: cursor + 2 })} <Panah />
              </button>
            ) : (
              <button type="button" className="primary-action" disabled={!bolehKirim} onClick={kirim} aria-describedby="misi-kirim-ket">
                {!online ? t('misi.menungguKoneksi') : submitState === 'sending' ? t('misi.mengirim') : submitState === 'failed' ? t('misi.kirimLagi') : (props.submitLabel ?? t('misi.kirimLaporan'))}
                {submitState === 'sending' ? <i className="adegan-spinner terang" aria-hidden="true" /> : <Panah />}
              </button>
            )}
          </div>
          <div className="aksi-ket">
            <span id="misi-kirim-ket">{ketAksi}</span>
            {!terakhir && !stepStarted(step, answer[step.id]) ? <button type="button" className="text-button" onClick={() => setCursor((c) => c + 1)}>{t('misi.lewatiDulu')}</button> : null}
            {!terakhir && sisa !== null && sisa < 10000 && missionStarted(mission, answer) ? (
              <button type="button" className="text-button tegas" onClick={kirim}>{t('misi.waktuHampirHabis')}</button>
            ) : null}
          </div>
        </div>
      ) : null}

      {dokumen ? (
        <Modal
          judul={t('misi.dokumenKasus')}
          kembaliKe={() => { const k = kembaliDokumen.current; return typeof k === 'function' ? k() : k; }}
          onTutup={(sebab) => {
            // Klik "hantu" dari ketukan layar sentuh yang membuka dokumen tidak boleh langsung menutupnya.
            // Hanya klik latar yang dijaga: Escape & tombol Tutup selalu menutup.
            if (sebab === 'latar' && performance.now() - dokumenDibuka.current < 500) return;
            setDokumenState(null);
          }}
        >
          <IsiDokumen mission={mission} akses={akses} sorot={dokumen} />
        </Modal>
      ) : null}

      {konfirmasi ? (
        <Modal
          judul={kurangKustom?.judul ?? t('misi.kirimSekarangTanya')}
          kembaliKe={() => (kurangKustom ? akar.current?.querySelector<HTMLElement>('.misi-panel .daftar-alternatif > summary') : null)
            ?? akar.current?.querySelector<HTMLElement>('.misi-aksi .primary-action') ?? null}
          onTutup={() => setKonfirmasi(null)}
          aksi={<>
            <button type="button" className={props.wajibLengkap ? 'btn btn-utama' : 'btn btn-netral'} onClick={() => setKonfirmasi(null)}>{kurangKustom?.kembali ?? t('misi.periksaLagi')}</button>
            {props.wajibLengkap ? null : (
              <button type="button" className="btn btn-utama" onClick={() => { setKonfirmasi(null); onSubmit?.(); }}>{kurangKustom?.kirim ?? t('misi.kirimSekarang')}</button>
            )}
          </>}
        >
          {kurangKustom ? kurangKustom.isi : (
            <>
              <p>{t('misi.belumLengkap')}</p>
              <ul className="konfirmasi-daftar">{konfirmasi.map((k) => <li key={k}>{k}</li>)}</ul>
              <p className="kecil lembut">{t('misi.konfirmasiCatatan')}</p>
            </>
          )}
        </Modal>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ dokumen & checklist (HTML)

/**
 * Tombol HTML pembuka dokumen: "Lihat checklist" (misi ber-checklist) dan "Dokumen" (kartu polis,
 * tabel, catatan di adegan). `data-misi-buka` = penerima fokus bila dokumen dibuka dari kanvas.
 */
function TombolInfo({ akses, buka, kelas, teksDokumen, teksChecklist }: {
  akses: AksesInfo;
  buka: (id: string, pembuka: HTMLElement) => void;
  kelas: string;
  teksDokumen: string;
  /** Bawaan "Lihat checklist"; baris alat kartu tugas memakai "Checklist" yang lebih ringkas. */
  teksChecklist?: string;
}) {
  useBahasa();
  return (
    <>
      {akses.tombolChecklist ? (
        <button type="button" className={kelas} data-misi-buka="checklist" aria-haspopup="dialog" onClick={(e) => buka(ID_CHECKLIST, e.currentTarget)}>
          <Icon name="cek" size={17} /> {teksChecklist ?? t('misi.lihatChecklist')}
        </button>
      ) : null}
      {akses.tombolDokumen ? (
        <button type="button" className={kelas} data-misi-buka="dokumen" aria-haspopup="dialog" onClick={(e) => buka('semua', e.currentTarget)}>
          <Icon name="polis" size={17} /> {teksDokumen}
        </button>
      ) : null}
    </>
  );
}

/**
 * Isi dialog dokumen: kartu polis, tabel, checklist, dan "Catatan di adegan" (objek `info`).
 * `sorot` = dokumen yang dibuka (ditandai & digulir ke tampilan); 'semua' = tanpa sorotan.
 */
function IsiDokumen({ mission, akses, sorot }: { mission: MissionPublic; akses: AksesInfo; sorot: string }) {
  useBahasa();
  const isi = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Setelah dialog terpasang: bawa dokumen yang disorot ke dalam tampilan di SATU-SATUNYA kotak gulir
    // dialog (Modal: .mdl-isi; isi dokumen sendiri tidak menggulir), seperti scrollIntoView({ block:
    // 'nearest' }) tetapi hanya pada kotak itu: halaman di belakang dialog tidak ikut bergeser.
    // Sudah terlihat utuh = tidak digeser; lebih tinggi dari kotaknya = tepi atasnya yang ditampilkan.
    const id = requestAnimationFrame(() => {
      const el = isi.current?.querySelector<HTMLElement>('.dokumen-sorot');
      const wadah = isi.current?.closest<HTMLElement>('.mdl-isi') ?? null;
      if (!el || !wadah) return;
      const a = el.getBoundingClientRect();
      const w = wadah.getBoundingClientRect();
      // Panel dialog sedang beranimasi membesar (transform): ukuran layar dibagi skala = ukuran tata letak.
      const skala = wadah.offsetHeight > 0 && w.height > 0 ? w.height / wadah.offsetHeight : 1;
      const atas = (a.top - w.top) / skala;
      const bawah = (a.bottom - w.top) / skala;
      const kotak = wadah.clientHeight;
      // Ruang untuk garis sorotan (3px + jarak 2px).
      const tepi = 6;
      const geser = atas < tepi || bawah - atas > kotak - 2 * tepi ? atas - tepi : bawah > kotak - tepi ? bawah - kotak + tepi : 0;
      if (Math.abs(geser) > 1) wadah.scrollTop += geser;
    });
    return () => cancelAnimationFrame(id);
  }, [sorot]);
  return (
    <div ref={isi} className="dokumen-isi">
      {mission.checklist?.length ? (
        <div className={'panel-krem misi-dok-checklist' + (sorot === ID_CHECKLIST ? ' dokumen-sorot' : '')}>
          <strong>{t('misi.daftarIsiLaporan')}</strong>
          <ul>{mission.checklist.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      ) : null}
      {mission.policyCards?.map((c) => <div key={c.id} className={sorot === c.id ? 'dokumen-sorot' : ''}><PolicyCardView card={c} aktif={sorot === c.id} /></div>)}
      {mission.tables?.map((tb) => <div key={tb.id} className={sorot === tb.id ? 'dokumen-sorot' : ''}><DocTableView table={tb} /></div>)}
      {akses.info.length ? (
        <div className="panel-krem misi-catatan-adegan">
          <strong>{t('misi.catatanAdegan')}</strong>
          <ul>
            {akses.info.map((i) => (
              <li key={i.objectId}><span className="misi-catatan-label">{i.label}</span><span>{teksInfo(mission.id, i.objectId, i.teks)}</span></li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ status pilihan

/** "Apakah pilihan saya sudah tercatat?" dijawab tepat di bawah adegan. */
function StatusPilihan({ step, value }: { step: StepDef; value: StepAnswer | undefined }) {
  useBahasa();
  // Multi: baki bukti sudah menjadi status (slot bernomor + hitungan).
  if (step.kind === 'multi') return null;
  let isi: string | null = null;
  if (step.kind === 'single') isi = asText(value) ? labelDari(step.options, asText(value)) : null;
  else if (step.kind === 'number') { const n = asNumber(value); isi = n === null ? null : teksAngka(step, n); }
  else if (step.kind === 'assign') {
    const n = step.items.filter((i) => asRecord(value)[i.id]).length;
    if (!n) {
      return (
        <p className="pilihan-status">
          <span className="pilihan-ikon pilihan-ikon-belum" aria-hidden="true" />
          <span className="pilihan-teks"><span className="pilihan-label">{t('misi.kemajuan')}</span> <b>{t('misi.bagianDitandai', { n: 0, total: step.items.length })}</b></span>
        </p>
      );
    }
    isi = t('misi.bagianDitandai', { n, total: step.items.length });
  }
  return isi ? (
    <p className="pilihan-status terisi">
      <span className="pilihan-ikon" aria-hidden="true"><Icon name="cek" size={16} /></span>
      <span className="pilihan-teks"><span className="pilihan-label">{step.kind === 'assign' ? t('misi.kemajuan') : t('misi.pilihanmu')}</span> <b>{isi}</b></span>
      <span className="pilihan-chip">{t('misi.tersimpan')}</span>
    </p>
  ) : (
    <p className="pilihan-status">
      <span className="pilihan-ikon pilihan-ikon-belum" aria-hidden="true" />
      <span className="pilihan-teks"><span className="pilihan-label">{t('misi.pilihanmu')}</span> <b>{t('misi.belumAda')}</b></span>
    </p>
  );
}

// ------------------------------------------------------------------ cara main (bantuan)

/**
 * 'daftar' & 'isi' = misi bergambar atau adegan yang tidak bisa diketuk (ringan/gagal/memuat): memilih
 * dari daftar, mengisi angka dari gambar. 'angkaDaftar' = misi hitung tanpa papan interaktif.
 */
type Mekanik = 'foto' | 'folder' | 'catat' | 'pilihBanyak' | 'pilih' | 'kelompok' | 'angka' | 'angkaDaftar' | 'daftar' | 'isi';

/** Contoh mekanik dalam bahasa aktif: kamus misi.cara.<mekanik>.judul / .teks / .hasil. */
const cara = (m: Mekanik): { judul: string; teks: string; hasil: string } => ({
  judul: t(`misi.cara.${m}.judul`),
  teks: t(`misi.cara.${m}.teks`),
  hasil: t(`misi.cara.${m}.hasil`),
});

/** `interaktif` = objek adegan bisa diketuk; false (ringan/gagal/memuat) = mekanik daftar, bukan "ketuk gambar". */
export function mekanikLangkah(step: StepDef, spec: SceneSpec | null, bergambar = false, interaktif = true): Mekanik {
  if (step.kind === 'number') return bergambar ? 'isi' : interaktif ? 'angka' : 'angkaDaftar';
  if (step.kind === 'assign') return 'kelompok';
  if (step.kind === 'single') return 'pilih';
  // Tanpa objek di adegan untuk langkah ini = daftar, juga bila adegannya bisa diketuk.
  const fx = bergambar ? null : fxLangkah(spec, step.id);
  if (!interaktif || !fx) return step.kind === 'multi' ? 'daftar' : 'pilih';
  // Contoh menyebut wadah yang sama dengan bakinya: Album / Folder / Catatan temuan / Pilihanmu.
  const baki = bakiDari(fx);
  return baki === 'Album' ? 'foto' : baki === 'Folder' ? 'folder' : baki === 'Catatan' ? 'catat' : 'pilihBanyak';
}

/**
 * Contoh singkat mekanik ("ketuk -> tercatat -> bisa dibatalkan").
 * Saat menjawab: hanya untuk langkah yang sedang dikerjakan, dibuka lewat "Cara main".
 * Saat briefing: semua mekanik misi, sebelum adegan bisa disentuh.
 * `interaktif` false (mode ringan, engine gagal, masih memuat): contoh memakai daftar, tidak meminta
 * mengetuk gambar.
 */
export function CaraMain({ mission, langkah, onTutup, interaktif = true }: { mission: MissionPublic; langkah?: StepDef; onTutup?: () => void; interaktif?: boolean }) {
  const { bahasa } = useBahasa();
  const bergambar = useMemo(() => misiBergambar(mission), [mission]);
  const spec = useMemo(() => (bergambar ? null : sceneFor(mission, bahasa)), [mission, bahasa, bergambar]);
  const daftar = useMemo(() => [...new Set((langkah ? [langkah] : mission.steps).map((s) => mekanikLangkah(s, spec, bergambar, interaktif)))], [mission, spec, langkah, bergambar, interaktif]);
  return (
    <div className="cara-main" role="note" aria-label={t('misi.caraMain')}>
      {daftar.slice(0, 2).map((m) => {
        const c = cara(m);
        return (
          <div key={m} className="cara-baris">
            <div className="cara-demo" aria-hidden="true">
              <span className="cara-benda" /><span className="cara-jari" /><span className="cara-chip">{c.hasil}</span>
            </div>
            <div><strong>{c.judul}</strong><p>{c.teks}</p></div>
          </div>
        );
      })}
      {onTutup ? <button type="button" className="text-button" onClick={onTutup}>{t('misi.tutupBantuan')}</button> : null}
    </div>
  );
}

// ------------------------------------------------------------------ pembahasan

export function TandaIkon({ jenis }: { jenis: 'tepat' | 'salah' | 'terlewat' }) {
  return (
    <span className={'tanda-ikon tanda-' + jenis} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        {jenis === 'tepat' ? <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          : jenis === 'salah' ? <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          : <path d="M12 6v7m0 4.5v.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />}
      </svg>
    </span>
  );
}

/** Arti tanda di gambar saat pembahasan: sama dengan ikon di baris hasil (ikon + kata, bukan warna saja). */
export function LegendaTanda() {
  useBahasa();
  return (
    <p className="adegan-ket" aria-label={t('misi.legendaAria')}>
      <span><TandaIkon jenis="tepat" /> {t('misi.legendaTepat')}</span>
      <span><TandaIkon jenis="salah" /> {t('misi.legendaKurang')}</span>
      <span><TandaIkon jenis="terlewat" /> {t('misi.legendaSeharusnya')}</span>
    </p>
  );
}

/** Kata status per pertanyaan dalam bahasa aktif: kamus misi.status.<status>. */
const kataStatus = (s: HasilLangkah['status']): string => t(`misi.status.${s}`);
const IKON_STATUS: Record<HasilLangkah['status'], 'tepat' | 'salah' | 'terlewat'> = { tepat: 'tepat', sebagian: 'terlewat', belum: 'salah', kosong: 'salah' };

const gabung = (b: BarisHasil[]): string => b.map((x) => x.teks).join(' · ');

/**
 * Paling banyak tiga baris per pertanyaan: yang kurang tepat (✕), yang sudah tepat (✓, hanya
 * bila sebagian), dan yang seharusnya (!). Tanda "!" sama dengan tanda di gambar.
 */
function BarisRinci({ h, step, berjudul = false }: { h: HasilLangkah; step: StepDef | undefined; /** Baris judul di atasnya sudah menyebut statusnya. */ berjudul?: boolean }) {
  useBahasa();
  const benar = h.pilihan.filter((p) => p.tanda === 'tepat');
  const salah = h.pilihan.filter((p) => p.tanda === 'salah');
  const sisa = h.tepat.filter((p) => p.tanda !== 'dipilih');
  const kumpul = step?.kind === 'multi';
  return (
    <ul className="rl-baris">
      {h.status === 'kosong' && !berjudul ? <li><TandaIkon jenis="salah" /><span><b>{t('misi.belumMenjawab')}</b></span></li> : null}
      {salah.length ? <li><TandaIkon jenis="salah" /><span><b>{t('misi.kamuPilih')}</b>{sela()}{gabung(salah)}</span></li> : null}
      {benar.length && h.status !== 'tepat' ? <li><TandaIkon jenis="tepat" /><span><b>{t('misi.sudahTepat')}</b>{sela()}{gabung(benar)}</span></li> : null}
      {sisa.length ? <li><TandaIkon jenis="terlewat" /><span><b>{kumpul && benar.length ? t('misi.masihTerlewat') : t('misi.yangTepat')}</b>{sela()}{gabung(sisa)}</span></li> : null}
    </ul>
  );
}

/**
 * Hasil misi, dibacakan juri (Bu Isti): satu kalimat hasil (vonis), raihan (bintang solo), paling
 * banyak tiga baris per pertanyaan (pilihanmu & yang tepat), ALASAN SINGKAT yang langsung terlihat,
 * lalu satu tombol. Rincian panjang dilipat SESUDAH tombol. Di HP panel ini tampil di atas adegan
 * bertanda (stage.css); di layar lebar adegan di sampingnya. Tanpa kotak berwarna: hijau untuk ✓,
 * satu aksen merah bata untuk ✕.
 *
 * Alasan singkat: misi satu pertanyaan = penjelasan pertanyaan itu; misi berlangkah banyak =
 * "Intinya" (pelajaran misi), penjelasan per pertanyaan di lipatan "Kenapa begitu?".
 *
 * `padat` = pertandingan (pembahasan hanya tampil ±14 detik; layar proyektor memuat
 * pembahasan lengkap): misi berlangkah banyak cukup satu baris status per pertanyaan.
 * Status per langkah dihitung dengan aturan yang sama dengan server (hasil.ts).
 */
export function HasilMisi({ mission, reveal, answer, akurasi, dijawab, poin = null, keterangan, aksi, catatan, padat = false, raihan }: {
  mission: MissionPublic;
  reveal: MissionReveal;
  answer: MissionAnswer | null;
  /** Ketepatan resmi dari server (0..1). */
  akurasi: number;
  dijawab: boolean;
  poin?: number | null;
  /** Kalimat kecil di bawah judul, menggantikan kalimat bawaan. */
  keterangan?: ReactNode;
  aksi?: ReactNode;
  catatan?: ReactNode;
  padat?: boolean;
  /** Tepat di bawah vonis: raihan pemain (mis. baris bintang solo + keterangan bintang). */
  raihan?: ReactNode;
}) {
  useBahasa();
  const st = statusMisi(akurasi, dijawab);
  const judul = judulHasil(st);
  const rinci = nilaiMisi(mission.steps, reveal, dijawab ? answer : null);
  const banyak = rinci.length > 1;
  const rinciDiLuar = !(padat && banyak);
  const juri = TOKOH.isti.aktif;
  const ikon = st === 'tepat' ? 'tepat' : st === 'sebagian' ? 'terlewat' : 'salah';
  const alasanTunggal = !banyak ? rinci[0]?.alasan?.trim() ?? '' : '';
  const intinya = <p className="hasil-inti"><b>{t('misi.intinya')}</b>{sela()}{reveal.learning}</p>;
  return (
    <div className="hasil" data-hasil={st}>
      <div className="hasil-kepala">
        <span className="hasil-juri" aria-hidden="true">
          {juri ? <PotretTokoh tokoh="isti" ukuran={56} /> : null}
          <TandaIkon jenis={ikon} />
        </span>
        <div>
          {juri ? <span className="hasil-juri-nama">{TOKOH.isti.nama} · {t('tokoh.isti.juri')}</span> : null}
          <h2 className="hasil-judul">{judul.judul}</h2>
          {!padat || st === 'terlewat' ? <p className="hasil-sub">{keterangan ?? judul.sub}</p> : null}
        </div>
      </div>
      {raihan ? <div className="hasil-raihan">{raihan}</div> : null}
      {poin !== null ? <p className="hasil-poin"><strong>+{poin.toLocaleString('id-ID')}</strong> {t('misi.poin')}</p> : null}

      {st !== 'tepat' ? (
        <ol className="hasil-daftar">
          {rinci.map((h, i) => {
            const step = mission.steps.find((x) => x.id === h.stepId);
            return (
              <li key={h.stepId} className="ringkas-langkah" data-status={h.status}>
                {banyak ? (
                  <p className="rl-judul">
                    <TandaIkon jenis={IKON_STATUS[h.status]} />
                    <span>{i + 1}. {h.prompt}</span>
                    <b className={'rl-status s-' + h.status}>{kataStatus(h.status)}</b>
                  </p>
                ) : null}
                {rinciDiLuar && h.status !== 'tepat' ? <BarisRinci h={h} step={step} berjudul={banyak} /> : null}
              </li>
            );
          })}
        </ol>
      ) : null}

      {/* Alasan singkat: terlihat tanpa membuka lipatan, sebelum tombol. */}
      {alasanTunggal ? <p className="hasil-alasan"><b>{st === 'tepat' ? t('misi.alasanTepat') : t('misi.alasanLabel')}</b>{sela()}{alasanTunggal}</p> : null}
      {banyak ? intinya : null}

      {aksi ? <div className="hasil-aksi">{aksi}</div> : null}

      {banyak ? (
        <details className="lipat">
          <summary>{!rinciDiLuar ? t('misi.lihatRincian') : st === 'tepat' ? t('misi.kenapaTepat') : t('misi.kenapaBegitu')}</summary>
          <div className="lipat-isi">
            {rinci.map((h, i) => (
              <div key={h.stepId}>
                <b>{i + 1}. {h.prompt}</b>
                {!rinciDiLuar && h.status !== 'tepat' ? <BarisRinci h={h} step={mission.steps.find((x) => x.id === h.stepId)} berjudul /> : null}
                <p>{h.alasan}</p>
              </div>
            ))}
          </div>
        </details>
      ) : null}
      {!banyak ? intinya : null}
      {catatan}
    </div>
  );
}

export function Panah({ balik = false }: { balik?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={balik ? { transform: 'rotate(180deg)' } : undefined}><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// ------------------------------------------------------------------ kontrol HTML per langkah

/**
 * Pola ARIA radio & tab (WAI-ARIA APG) untuk grup pilihan: grup = SATU tab stop (yang terpilih, atau yang pertama
 * bila belum ada), panah memindah fokus SEKALIGUS memilih, Home/End ke ujung, berputar di ujung. Pembaca layar
 * mengumumkan "tombol radio 1 dari 4"; tanpa ini panah tidak berbuat apa-apa. Tab & Spasi tetap berfungsi.
 */
function tabGrup(terpilih: boolean, indeks: number, adaTerpilih: boolean): 0 | -1 {
  return terpilih || (!adaTerpilih && indeks === 0) ? 0 : -1;
}

/**
 * Penanganan panah untuk satu grup (`onKeyDown` di wadah role=radiogroup/tablist). Radio: panah atas/bawah/kiri/kanan;
 * tab (baris chip): kiri/kanan. `pilih` menerima tombol tujuan yang SUDAH difokus.
 */
function panahGrup(e: KeyboardEvent<HTMLElement>, peran: 'radio' | 'tab', pilih: (el: HTMLButtonElement) => void): void {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const maju = peran === 'tab' ? ['ArrowRight'] : ['ArrowDown', 'ArrowRight'];
  const mundur = peran === 'tab' ? ['ArrowLeft'] : ['ArrowUp', 'ArrowLeft'];
  const k = e.key;
  if (!maju.includes(k) && !mundur.includes(k) && k !== 'Home' && k !== 'End') return;
  const semua = [...e.currentTarget.querySelectorAll<HTMLButtonElement>(`[role="${peran}"]`)].filter((b) => !b.disabled);
  const kini = semua.indexOf(e.target as HTMLButtonElement);
  if (kini < 0) return;
  e.preventDefault();
  const n = semua.length;
  const tujuan = semua[k === 'Home' ? 0 : k === 'End' ? n - 1 : maju.includes(k) ? (kini + 1) % n : (kini - 1 + n) % n]!;
  if (tujuan === semua[kini]) return;
  tujuan.focus();
  pilih(tujuan);
}

function KontrolLangkah({ step, seed, value, fx, adeganAktif, memuat = false, angkaBebas = false, itemAktif, onFokusItem, terapkan, disabled, bukaChecklist, ringkas = false, labelHitung }: {
  step: StepDef;
  /** Kunci urutan tampil yang diacak (sama untuk semua pemain). */
  seed: string;
  value: StepAnswer | undefined;
  fx: ActionFx | null;
  adeganAktif: boolean;
  /** Adegan masih dimuat (belum diketahui apakah kanvas bisa diketuk). */
  memuat?: boolean;
  /** Soal kustom: ketikan angka boleh pecahan/negatif (lihat bacaAngka). */
  angkaBebas?: boolean;
  itemAktif: string | null;
  onFokusItem: (id: string) => void;
  /** `lanjut` false = tetap di bagian ini (panah di grup kategori tidak melompat ke bagian berikutnya). */
  terapkan: (c: Change, lanjut?: boolean) => void;
  disabled: boolean;
  /** Misi ber-checklist: tombol "Lihat checklist" di kepala baki (dekat folder, juga tanpa kanvas). */
  bukaChecklist?: (pembuka: HTMLElement) => void;
  /** Baki ringkas (MissionPlayProps.albumRingkas). */
  ringkas?: boolean;
  /** Teks penghitung baki (MissionPlayProps.labelHitung). */
  labelHitung?: (n: number, maks: number) => string;
}) {
  useBahasa();
  const idPanel = useId();
  // Daftar alternatif: terlipat selama adegan dimuat & bila adegan bisa diketuk; dibuka otomatis HANYA bila
  // ternyata tidak ada kanvas (mode ringan / engine gagal). Tidak pernah dilipat otomatis: lipatan yang
  // berubah sendiri menggeser tata letak di bawah jari pemain sehingga ketukan meleset.
  const [daftarBuka, setDaftarBuka] = useState(() => !adeganAktif && !memuat);
  useEffect(() => { if (!adeganAktif && !memuat) setDaftarBuka(true); }, [adeganAktif, memuat]);

  /**
   * Tombol "Batal" di slot baki hilang bersama slotnya, jadi fokus keyboard jatuh ke <body>. Setelah jawaban
   * berubah, fokus dipindah ke kontrol wajar: tombol Batal slot berikutnya (yang kini menempati nomor itu), slot
   * sebelumnya bila yang dibatalkan slot terakhir, lalu - baki kosong - pilihan itu sendiri di daftar yang terbuka
   * (terbaca "tidak dicentang"), atau pembuka daftar pilihan. Hanya bila tombol itu memang memegang fokus.
   * Efek tata letak anak berjalan sebelum `jagaFokus` MissionPlay, yang lalu menggulir kontrol itu ke tampilan.
   */
  const kontrolRef = useRef<HTMLDivElement>(null);
  const batalDi = useRef<{ nomor: number; id: string } | null>(null);
  /** Daftar alternatif dibuka lewat ringkasannya oleh pemain (bukan dibuka otomatis). */
  const dibukaPemain = useRef(false);
  useLayoutEffect(() => {
    const b = batalDi.current;
    if (!b) return;
    batalDi.current = null;
    const aktif = document.activeElement;
    if (aktif && aktif !== document.body && aktif.isConnected) return;
    const akar = kontrolRef.current;
    if (!akar) return;
    const tombol = [...akar.querySelectorAll<HTMLElement>('.slot-hapus:not(:disabled)')];
    const tujuan = tombol[b.nomor] ?? tombol[b.nomor - 1]
      ?? [...akar.querySelectorAll<HTMLElement>('.daftar-alternatif[open] .opsi[data-opsi]')].find((el) => el.dataset.opsi === b.id)
      ?? akar.querySelector<HTMLElement>('.daftar-alternatif > summary');
    tujuan?.focus({ preventScroll: true });
  }, [value]);

  if (step.kind === 'multi') {
    const list = asList(value);
    const maks = Math.max(1, step.requiredSelections);
    const judul = judulBaki(fx);
    const sisa = maks - list.length;
    const hitung = <span className={list.length === maks ? 'baki-hitung lengkap' : 'baki-hitung'}>{labelHitung ? labelHitung(list.length, maks) : <>{list.length} / {maks}</>}</span>;
    // Sisa pilihan: slot kosong bernomor (bawaan) atau satu baris pendek (baki ringkas).
    const teksSisa = (list.length ? t('misi.slotLagi', { n: sisa }) + sela() : '') + (adeganAktif ? t('misi.slotKetuk') : t('misi.slotDaftar'));
    return (
      <div className="kontrol" ref={kontrolRef}>
        <div className={ringkas ? 'baki baki-ringkas' : 'baki'} aria-label={t('misi.bakiAria', { baki: judul, n: list.length, total: maks })}>
          {bukaChecklist ? (
            <div className="baki-kepala misi-baki-cek">
              <span className="misi-baki-judul"><strong>{judul}</strong>{hitung}</span>
              <button type="button" className="misi-cek-baki" data-misi-buka="checklist" aria-haspopup="dialog" onClick={(e) => bukaChecklist(e.currentTarget)}>
                <Icon name="cek" size={16} /> {t('misi.lihatChecklist')}
              </button>
            </div>
          ) : (
            <div className="baki-kepala"><strong>{judul}</strong>{hitung}</div>
          )}
          {ringkas && !list.length ? null : <ul className="baki-slot">
            {list.map((id, i) => {
              const o = step.options.find((x) => x.id === id);
              if (!o) return null;
              return (
                <li key={o.id} className="slot slot-isi" data-album-isi={ringkas ? '' : undefined}>
                  <span className="slot-no">{i + 1}</span>
                  {o.icon ? <Icon name={o.icon} size={20} /> : null}
                  <span className="slot-teks">{o.label}</span>
                  <button
                    type="button"
                    className="slot-hapus"
                    disabled={disabled}
                    // Enter yang ditahan tidak ikut membatalkan slot berikutnya yang menerima fokus.
                    onKeyDown={(e) => { if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault(); }}
                    onClick={(e) => {
                      const b = e.currentTarget;
                      if (document.activeElement === b) batalDi.current = { nomor: [...(kontrolRef.current?.querySelectorAll('.slot-hapus') ?? [])].indexOf(b), id: o.id };
                      terapkan(toggleMulti(step, value, o.id));
                    }}
                    aria-label={t('misi.batalkanAria', { label: o.label })}
                  >
                    <Icon name="silang" size={16} /><span>{t('misi.batal')}</span>
                  </button>
                </li>
              );
            })}
            {sisa > 0 && !ringkas ? (
              <li className="slot slot-kosong">
                <span className="slot-no">{list.length + 1}</span>
                <span className="slot-teks">{teksSisa}</span>
              </li>
            ) : null}
          </ul>}
          {sisa > 0 && ringkas ? <p className="baki-sisa">{teksSisa}</p> : null}
        </div>
        <details
          className="daftar-alternatif"
          open={daftarBuka}
          onToggle={(e) => {
            const d = e.currentTarget;
            setDaftarBuka(d.open);
            // Baki ringkas (cerita): daftar yang baru DIBUKA pemain di dekat bar aksi digeser seperlunya supaya pilihan
            // pertamanya terlihat di atas bar (scroll-padding), bukan terbuka di balik bar.
            if (ringkas && d.open && dibukaPemain.current) requestAnimationFrame(() => d.querySelector<HTMLElement>('.opsi')?.scrollIntoView({ block: 'nearest' }));
            dibukaPemain.current = false;
          }}
        >
          <summary onClick={() => { dibukaPemain.current = true; }}>{adeganAktif ? t('misi.pilihLewatDaftar') : t('misi.daftarPilihan')}</summary>
          <div className="opsi-daftar" role="group" aria-label={step.prompt}>
            {urutanTampil(step.options, seed).map((o) => {
              const dipilih = list.includes(o.id);
              return (
                <button key={o.id} type="button" role="checkbox" aria-checked={dipilih} data-opsi={o.id} className={'opsi' + (dipilih ? ' dipilih' : '')} disabled={disabled} onClick={() => terapkan(toggleMulti(step, value, o.id))}>
                  {o.icon ? <span className="opsi-ikon"><Icon name={o.icon} size={22} /></span> : null}
                  <span className="opsi-teks">{o.label}{o.desc ? <small>{o.desc}</small> : null}</span>
                  <span className="opsi-tanda kotak" aria-hidden="true">{dipilih ? list.indexOf(o.id) + 1 : ''}</span>
                </button>
              );
            })}
          </div>
        </details>
      </div>
    );
  }

  if (step.kind === 'single') {
    const pilih = asText(value);
    const ada = step.options.some((o) => o.id === pilih);
    return (
      <div className="kontrol">
        <div className="opsi-daftar" role="radiogroup" aria-label={step.prompt} onKeyDown={(e) => panahGrup(e, 'radio', (el) => el.click())}>
          {urutanTampil(step.options, seed).map((o, i) => (
            <button key={o.id} type="button" role="radio" aria-checked={pilih === o.id} tabIndex={tabGrup(pilih === o.id, i, ada)} className={'opsi' + (pilih === o.id ? ' dipilih' : '')} disabled={disabled} onClick={() => terapkan(chooseSingle(step, value, o.id))}>
              {o.icon ? <span className="opsi-ikon"><Icon name={o.icon} size={22} /></span> : null}
              <span className="opsi-teks">{o.label}{o.desc ? <small>{o.desc}</small> : null}</span>
              {pilih === o.id ? <span className="opsi-kata" aria-hidden="true">{t('misi.dipilih')}</span> : null}
              <span className="opsi-tanda" aria-hidden="true">{pilih === o.id ? <i /> : null}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step.kind === 'assign') {
    const peta = asRecord(value);
    const item = step.items.find((i) => i.id === itemAktif) ?? step.items[0]!;
    const idTab = (id: string): string => `${idPanel}-${id}`;
    const kategori = urutanTampil(step.buckets, seed + ':kategori');
    const adaKategori = kategori.some((b) => b.id === peta[item.id]);
    return (
      <div className="kontrol">
        {/* Tab otomatis: panah kiri/kanan memindah fokus sekaligus membuka bagian itu. */}
        <div className="item-tab" role="tablist" aria-label={t('misi.bagianDinilai')} onKeyDown={(e) => panahGrup(e, 'tab', (el) => { const id = el.dataset.item; if (id) onFokusItem(id); })}>
          {step.items.map((it) => (
            <button
              key={it.id} type="button" role="tab" id={idTab(it.id)} data-item={it.id} aria-selected={it.id === item.id} aria-controls={idPanel}
              tabIndex={it.id === item.id ? 0 : -1} className={'item-chip' + (it.id === item.id ? ' kini' : '') + (peta[it.id] ? ' sudah' : '')} onClick={() => onFokusItem(it.id)}
            >
              {it.icon ? <Icon name={it.icon} size={18} /> : null}
              <span>{it.label.split(' - ')[0]}</span>
              {peta[it.id] ? <Icon name="cek" size={16} /> : null}
            </button>
          ))}
        </div>
        <div className="item-panel" role="tabpanel" id={idPanel} aria-labelledby={idTab(item.id)}>
          <div className="item-kini">
            <span><small>{t('misi.kategoriUntuk')}</small><strong>{item.label}</strong></span>
            {peta[item.id] ? (
              <button type="button" className="text-button" disabled={disabled} onClick={() => terapkan(unassignItem(step, value, item.id))}>{t('misi.kosongkan')}</button>
            ) : null}
          </div>
          {/* Panah = ganti kategori bagian INI (tanpa melompat ke bagian berikutnya); ketuk/Spasi = pilih lalu lanjut. */}
          <div className="opsi-daftar" role="radiogroup" aria-label={t('misi.kategoriUntukAria', { label: item.label })} onKeyDown={(e) => panahGrup(e, 'radio', (el) => { const id = el.dataset.kategori; if (id) terapkan(assignItem(step, value, item.id, id), false); })}>
            {kategori.map((b, i) => {
              const dipilih = peta[item.id] === b.id;
              return (
                <button key={b.id} type="button" role="radio" data-kategori={b.id} aria-checked={dipilih} tabIndex={tabGrup(dipilih, i, adaKategori)} className={'opsi' + (dipilih ? ' dipilih' : '')} disabled={disabled} onClick={() => terapkan(assignItem(step, value, item.id, b.id))}>
                  {b.icon ? <span className="opsi-ikon"><Icon name={b.icon} size={22} /></span> : null}
                  <span className="opsi-teks">{b.label}</span>
                  {dipilih ? <span className="opsi-kata" aria-hidden="true">{t('misi.dipilih')}</span> : null}
                  <span className="opsi-tanda" aria-hidden="true">{dipilih ? <i /> : null}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (step.kind === 'number') {
    return <KontrolAngka step={step} value={value} terapkan={terapkan} disabled={disabled} bebas={angkaBebas} />;
  }
  return <p className="kecil lembut">{t('misi.jenisBelumDidukung')}</p>;
}

function KontrolAngka({ step, value, terapkan, disabled, bebas = false }: {
  step: Extract<StepDef, { kind: 'number' }>;
  value: StepAnswer | undefined;
  terapkan: (c: Change) => void;
  disabled: boolean;
  bebas?: boolean;
}) {
  useBahasa();
  const n = asNumber(value);
  const [teks, setTeks] = useState(n !== null && !step.suggestions?.includes(n) ? String(n) : '');
  const set = (v: number | null): void => {
    if (v === null) return;
    terapkan({ kind: 'chosen', stepId: step.id, value: v, refId: String(v) });
  };
  // Rupiah selalu bulat; pecahan/negatif hanya untuk soal kustom berformat angka.
  const pecahan = bebas && step.format !== 'rupiah';
  const kolom = (
    <label className="angka-tulis">
      <span className="sr-only">{t('misi.tulisAngka')}</span>
      <input
        className="kolom" type="text" inputMode={pecahan ? 'decimal' : 'numeric'} autoComplete="off" placeholder={t('misi.tulisAngka')} disabled={disabled}
        value={teks}
        onChange={(e) => {
          setTeks(e.target.value);
          set(bacaAngka(e.target.value, pecahan));
        }}
      />
    </label>
  );
  // Soal kustom tanpa chip angka: kolom tulis langsung terlihat (tidak disembunyikan di balik lipatan).
  if (!step.suggestions?.length) return <div className="kontrol">{kolom}</div>;
  return (
    <div className="kontrol">
      <div className="angka-pilihan" role="radiogroup" aria-label={step.prompt} onKeyDown={(e) => panahGrup(e, 'radio', (el) => el.click())}>
        {step.suggestions?.map((s, i) => (
          <button key={s} type="button" role="radio" aria-checked={n === s} tabIndex={tabGrup(n === s, i, n !== null && step.suggestions!.includes(n))} className={'angka' + (n === s ? ' dipilih' : '')} disabled={disabled} onClick={() => { setTeks(''); set(s); }}>
            {teksAngka(step, s)}
          </button>
        ))}
      </div>
      <details className="daftar-alternatif">
        <summary>{t('misi.angkaTulisSendiri')}</summary>
        {kolom}
        {n !== null && !step.suggestions?.includes(n) ? <p className="kecil">{t('misi.jawabanmu', { nilai: teksAngka(step, n) })}</p> : null}
      </details>
    </div>
  );
}
