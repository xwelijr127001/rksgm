/**
 * T-028: KONVERTER Episode 2 solo "Truk Trailer di Jalan Tol" (client/src/cerita/episode/auto-2) -> skenario Story Room
 * (ScenarioContent v2, shared/story/content.ts), ditambah LAPORAN tiap pendekatan dan tiap pecahan / susunan teks.
 *
 *   npx tsx --tsconfig client/tsconfig.json tools/cerita/ep2-ke-skenario.mts          tulis seed + laporan
 *   npx tsx --tsconfig client/tsconfig.json tools/cerita/ep2-ke-skenario.mts --cek    seed di repo == hasil konversi sekarang?
 *                                                                                     (keluar 1 bila berbeda; tidak menulis)
 * Keluaran : server/src/story/seed/ep2Trailer.ts (data seed, DIBUAT ALAT INI: jangan disunting tangan) dan
 *            docs/prd-v02/EP2-ROOM-CONVERSION.md (laporan konversi; dilacak git bersama seed-nya).
 *
 * SATU SUMBER: tidak ada kalimat naskah yang diketik ulang di sini. Yang dibaca: Episode (node, titik, pemeran, suasana, akhir,
 * dokumen), tabel teks id + en, dan misi aktivitas (item + tabel). Yang ditulis alat ini sendiri hanya TEKS_KONVERTER di bawah
 * (kalimat waktu habis dan tambahan sinopsis: naskah solo tidak punya keduanya) dan dicantumkan di laporan.
 *
 * ATURAN (spec team/specs/2026-11-17-T-028-ep2-room.md rev 1.0 + 1.1):
 *  - 15 babak = titik keputusan K01..K15 (id babak = id titik); `ksim` bukan babak. Lima pilihan per babak = alternatif dasar
 *    a..e (id `alt-a`..`alt-e`); varian akibat (K09 a2, K11 b2/d2/d3/e2) BUKAN pilihan: diratakan ke alternatif dasarnya.
 *  - klasifikasi = nilai naskah (tepat / kurang -> kurang_tepat / keliru), akurasi 1 / 0,5 / 0, moodDelta = delta naskah.
 *  - tanda (`pasang`) menjadi setsFlag HANYA bila babak sesudahnya membacanya lewat node cabang + dialog ber-efek (janji-20 ->
 *    K14: baris protes ber-ifFlag + flagEffects). `kep:*` dan `catat` bukan tanda.
 *  - waktu habis = delta terburuk di antara lima alternatif (naskah solo tanpa timer).
 *  - tata letak: `chat` untuk titik berbalas pesan dan aktivitas menyusun pesan (arena pola 'pesan'); `dossier` untuk aktivitas
 *    lain, dengan fakta bersama aktivitas / dokumen sebagai berkas (RENCANA di bawah). Tidak ada babak `stage`.
 *  - akibat: baris akibat dasar tanpa syarat. Kutipan PEMBUKA dari responden babak -> balasan; sisanya, urut naskah, menjadi
 *    konsekuensi (kutipan tokoh di tengah ditulis `Nama: "…"`). Tanpa sisa -> kalimat alasan netral menjadi konsekuensi.
 *  - bahasa: id + en (CONTENT_LOCALES); zh tidak dikonversi.
 *  - setiap teks diukur terhadap TEXT_LIMITS; validateScenario tanpa galat adalah GERBANG KERAS (alat keluar 1, tidak menulis).
 * Bila naskah solo berubah sehingga sebuah aturan tidak lagi cocok (mis. baris pembuka bersyarat, tanda baru), alat ini MELEMPAR
 * galat dengan nama node-nya, bukan menebak.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { EPISODE_AUTO_2 } from '../../client/src/cerita/episode/auto-2/episode';
import type { Baris, Efek, Episode, Kondisi, NodeAktivitas, NodeDialog } from '../../client/src/cerita/tipe';
import {
  CONTENT_ID_PATTERN,
  CONTENT_SCHEMA_VERSION,
  MOOD_BANDS,
  MOOD_BAND_FLOOR,
  STORY_CHOICE_COUNT,
  STORY_ROUND_COUNT,
  TEXT_LIMITS,
  textKey,
  type ChoiceContent,
  type ChoiceForm,
  type Classification,
  type ContentLocale,
  type DialogueLine,
  type EndingContent,
  type EndingKind,
  type EvidenceItem,
  type EvidenceKind,
  type EvidenceMark,
  type RoundContent,
  type RoundLayout,
  type ScenarioContent,
  type SpeakerRef,
} from '../../shared/story/content';
import { sanitizeScenarioContent, validateScenario, type ContentIssue, type ValidationContext } from '../../shared/story/validate';

// ------------------------------------------------------------------ tetapan

/** Bahasa room v1 (keputusan owner + rev 1.1): Indonesia dan Inggris. zh tidak dikonversi. */
export const BAHASA_RUANG: readonly ContentLocale[] = ['id', 'en'];

/** Satu-satunya teks yang DITULIS konverter (naskah solo tidak punya padanannya). `{nasabah}` = nama nasabah dari naskah. */
export const TEKS_KONVERTER = {
  /** Kalimat tambahan di sinopsis (rev 1.1: sinopsis menyatakan "kasus dari modul klaim; untuk uji acara"). */
  sinopsis: { id: 'Kasus dari modul klaim; untuk uji acara.', en: 'A case from the claims module; for an event trial.' },
  /** Konsekuensi waktu habis, sama di ke-15 babak (naskah solo tanpa timer, jadi tanpa teks waktu habis). */
  waktuHabis: { id: 'Kamu belum memutuskan apa pun. {nasabah} menunggu tanpa kabar.', en: 'You have not decided anything. {nasabah} is left waiting with no news.' },
} as const satisfies Record<string, Record<ContentLocale, string>>;

const AKURASI = { tepat: 1, kurang: 0.5, keliru: 0 } as const;
const KLASIFIKASI: Record<keyof typeof AKURASI, Classification> = { tepat: 'tepat', kurang: 'kurang_tepat', keliru: 'keliru' };
const JENIS_AKHIR: Record<'baik' | 'campuran' | 'buruk', EndingKind> = { baik: 'happy', campuran: 'with_notes', buruk: 'unhappy' };
const LATAR_MEJA = 'builtin:bg:meja';
const LATAR_TELEPON = 'builtin:bg:telepon';
const TOKOH_PETUGAS = 'builtin:char:miss-raksa';
const ALTERNATIF = ['a', 'b', 'c', 'd', 'e'] as const;
const idPilihan = (alt: string) => `alt-${alt}`;
/** Tanda kutip kutipan tokoh di dalam konsekuensi, per bahasa (naskah id memakai " lurus, naskah en memakai “ ”). */
const KUTIP: Record<ContentLocale, readonly [string, string]> = { id: ['"', '"'], en: ['“', '”'] };

type Tanda = Record<string, EvidenceMark>;
/** Sumber satu berkas (fakta bersama) babak. Semua teksnya dibaca dari naskah / misi aktivitas. */
type SumberBukti =
  /** Dokumen cerita (`Episode.dokumen`): judul, baris label + isi, catatan. Bertahapan -> alur, selain itu perbandingan. */
  | { jenis: 'dokumen'; dokumen: string }
  /** Kartu tugas aktivitas: judul + cerita aktivitas (dokumen teks). */
  | { jenis: 'kartu' }
  /** Daftar item sebuah langkah aktivitas (dokumen yang bisa diminta, kartu saksi, perbedaan catatan) + cerita aktivitas. */
  | { jenis: 'item'; langkah: string }
  /** Tabel aktivitas ("Dokumen" di aktivitas solo). `tanda` = nilai sel (kunci teks) yang ditampilkan sebagai tanda status. */
  | { jenis: 'tabel'; tabel: string; bentuk: Extract<EvidenceKind, 'compare' | 'checklist'>; cerita: boolean; tanda?: Tanda };

interface RencanaBabak {
  bukti: SumberBukti[];
  /** Kunci teks pertanyaan pengganti instruksi aktivitas. */
  tanya?: string;
  /** Kunci teks pilihan pengganti label alternatif (`titik.<id>.<alt>`). */
  pilihan?: (alt: string) => string;
  bentuk?: ChoiceForm;
}

/**
 * RANCANGAN babak AKTIVITAS (titik berbalas pesan tidak perlu rancangan: pertanyaan, balasan dan dokumennya sudah di node).
 * Aktivitas solo dimainkan dengan menyusun benda; room memberi lima pilihan, jadi yang dibawa adalah FAKTA bersamanya:
 *  - K02 delapan dokumen yang bisa diminta; K09 lima kartu saksi; K10 fakta pokok + tiga perbedaan catatan;
 *  - K04 / K05 / K15 kartu tugasnya (lima tujuan / bagian pesan adalah jawabannya, bukan fakta);
 *  - K07 rencana kerja; K11 isi bundel (nilai "Ada" / "Belum ada di berkas" tampil sebagai tanda status);
 *  - K08 temuan di lokasi (dokumen `rambu`); pertanyaannya "Apa kesimpulanmu?" dan pilihannya lima kalimat kesimpulan naskah,
 *    karena instruksi aktivitas menyuruh menandai lajur dan langkah itu tidak ada di room.
 */
export const RENCANA: Readonly<Record<string, RencanaBabak>> = {
  k02: { bukti: [{ jenis: 'item', langkah: 'berkas' }] },
  k04: { bukti: [{ jenis: 'kartu' }] },
  k05: { bukti: [{ jenis: 'kartu' }] },
  k07: { bukti: [{ jenis: 'tabel', tabel: 'rencana', bentuk: 'compare', cerita: true }] },
  k08: { bukti: [{ jenis: 'dokumen', dokumen: 'rambu' }], tanya: 'akt.rambu.tanya', pilihan: (alt) => `k08.${alt}`, bentuk: 'message' },
  k09: { bukti: [{ jenis: 'item', langkah: 'saksi' }] },
  k10: { bukti: [{ jenis: 'tabel', tabel: 'fakta', bentuk: 'compare', cerita: false }, { jenis: 'item', langkah: 'selisih' }] },
  k11: { bukti: [{ jenis: 'tabel', tabel: 'isi-bundel', bentuk: 'checklist', cerita: true, tanda: { 'akt.bundel.tabel.ada': 'ok', 'akt.bundel.tabel.belum': 'missing' } }] },
  k15: { bukti: [{ jenis: 'kartu' }] },
};

// ------------------------------------------------------------------ laporan

export interface CatatanLaporan {
  /** Id babak, atau null untuk seluruh skenario. */
  babak: string | null;
  uraian: string;
}

export interface RingkasBabak {
  id: string;
  nomor: number;
  judul: string;
  sumber: string;
  tataLetak: RoundLayout;
  kunci: boolean;
  responden: string;
  bukti: string[];
  pilihan: { alt: string; nilai: string; delta: number; tanda: string | null; bentuk: ChoiceForm }[];
  waktuHabis: number;
  efekTertunda: { tanda: string; delta: number }[];
}

export interface Laporan {
  sumber: { episode: string; versi: number; bahasa: string[] };
  babak: RingkasBabak[];
  /** Pendekatan: hal di naskah solo yang di room diratakan, disederhanakan atau tidak dibawa. */
  pendekatan: CatatanLaporan[];
  /** Pecahan dan susunan teks: teks naskah yang dipindah tempat, digabung atau dipotong secara mekanis. */
  pecahan: CatatanLaporan[];
  /** Teks yang ditulis konverter sendiri. */
  teksKonverter: { kunci: string; dipakai: string; id: string; en: string }[];
  /** Teks terpanjang per jenis terhadap batasnya. */
  ukuran: { jenis: string; batas: number; panjang: number; bahasa: string; kunci: string }[];
  validasi: { galat: ContentIssue[]; peringatan: ContentIssue[] };
  jumlahTeks: Record<string, number>;
  hashKonten: string;
}

export interface HasilKonversi {
  konten: ScenarioContent;
  laporan: Laporan;
}

// ------------------------------------------------------------------ konversi

/** Konteks validasi alat ini: kategori dan aset bawaan yang dipakai skenario (uji server memakai pustaka DB yang sebenarnya). */
export function konteksValidasi(): ValidationContext {
  const bawaan = (kind: string) => ({ kind, expressions: [] as string[], archived: false, builtin: true });
  return {
    categories: new Map([['auto', { active: true }]]),
    assets: new Map([
      [LATAR_MEJA, bawaan('background')],
      [LATAR_TELEPON, bawaan('background')],
      [TOKOH_PETUGAS, bawaan('character')],
    ]),
  };
}

/** JSON kanonik (kunci terurut), sama dengan server/src/story/content/scenarios.ts canonicalJson: dasar hash versi terbit. */
export function jsonKanonik(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(jsonKanonik).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v as Record<string, unknown>).sort().map((k) => JSON.stringify(k) + ':' + jsonKanonik((v as Record<string, unknown>)[k])).join(',') + '}';
  }
  return JSON.stringify(v);
}

const panjang = (s: string) => [...s].length;

export function konversiEp2(ep: Episode = EPISODE_AUTO_2): HasilKonversi {
  const pendekatan: CatatanLaporan[] = [];
  const pecahan: CatatanLaporan[] = [];
  const teks: Record<ContentLocale, Record<string, string>> = { id: {}, en: {} };
  const batasKunci = new Map<string, { jenis: string; batas: number }>();

  /** Teks naskah `kunci` dalam `bahasa`; kunci yang tidak ada = galat (naskah id dan en harus lengkap). */
  const tx = (bahasa: ContentLocale, kunci: string): string => {
    const v = ep.teks[bahasa]?.[kunci];
    if (typeof v !== 'string' || !v.trim()) throw new Error(`teks naskah "${kunci}" tidak ada dalam bahasa ${bahasa}`);
    return v;
  };
  /** Simpan teks room `kunciRuang` per bahasa dari `isi(bahasa)`; '' = tidak disimpan. `jenis` = nama batas di TEXT_LIMITS. */
  const simpan = (kunciRuang: string, jenis: keyof typeof TEXT_LIMITS, isi: (bahasa: ContentLocale) => string) => {
    batasKunci.set(kunciRuang, { jenis, batas: TEXT_LIMITS[jenis] });
    for (const bahasa of BAHASA_RUANG) {
      const v = isi(bahasa);
      if (v) teks[bahasa][kunciRuang] = v;
    }
  };
  const simpanKunci = (kunciRuang: string, jenis: keyof typeof TEXT_LIMITS, kunciNaskah: string) => simpan(kunciRuang, jenis, (b) => tx(b, kunciNaskah));

  // ---- pemeran
  const idNasabah = ep.nasabah;
  const idPetugas = Object.keys(ep.pemeran).find((id) => ep.pemeran[id]!.potret === 'missRaksa');
  if (!ep.pemeran[idNasabah] || !idPetugas) throw new Error('episode tanpa nasabah atau tanpa mentor (potret missRaksa)');
  const namaPemeran = (bahasa: ContentLocale, id: string) => tx(bahasa, ep.pemeran[id]?.nama ?? `pemeran.${id}.nama`);
  const pemeranBersuara = new Set<string>();
  /** Pembicara naskah -> pembicara room. Pemeran selain nasabah dan mentor menjadi tokoh pendukung (cast) ber-id sama. */
  const pembicara = (siapa: string, di: string): SpeakerRef => {
    if (siapa === 'narasi') return { speaker: 'narrator', castId: null };
    if (siapa === idNasabah) return { speaker: 'customer', castId: null };
    if (siapa === idPetugas) return { speaker: 'officer', castId: null };
    if (!ep.pemeran[siapa]) throw new Error(`${di}: pembicara "${siapa}" bukan pemeran episode (pemain tidak punya baris di room)`);
    if (!CONTENT_ID_PATTERN.test(siapa)) throw new Error(`${di}: id pemeran "${siapa}" bukan id konten yang sah`);
    pemeranBersuara.add(siapa);
    return { speaker: 'cast', castId: siapa };
  };
  const samaPembicara = (a: SpeakerRef, b: SpeakerRef) => a.speaker === b.speaker && a.castId === b.castId;

  // ---- skenario
  simpanKunci(textKey.title(), 'title', ep.judul);
  simpan(textKey.synopsis(), 'synopsis', (b) => `${tx(b, ep.ringkas)} ${TEKS_KONVERTER.sinopsis[b]}`);
  simpan(textKey.customerName(), 'characterName', (b) => namaPemeran(b, idNasabah));
  simpan(textKey.officerName(), 'characterName', (b) => namaPemeran(b, idPetugas));
  // Lima status naskah = lima pita mood room; batas bawahnya harus sama persis (0 / 20 / 40 / 60 / 80).
  for (const band of MOOD_BANDS) {
    const s = ep.suasana.find((x) => x.min === MOOD_BAND_FLOOR[band]);
    if (!s || ep.suasana.length !== MOOD_BANDS.length) throw new Error(`suasana naskah tidak sejajar dengan pita mood room (batas ${MOOD_BAND_FLOOR[band]})`);
    simpanKunci(textKey.moodLabel(band), 'moodLabel', s.label);
  }

  // ---- pembuka: node awal (dialog mentor) sebelum titik pertama
  const titik = ep.titik ?? [];
  if (titik.length !== STORY_ROUND_COUNT) throw new Error(`episode punya ${titik.length} titik keputusan, room butuh ${STORY_ROUND_COUNT}`);
  const awal = ep.node[ep.mulai];
  if (!awal || awal.jenis !== 'dialog' || awal.lanjut !== titik[0]!.id) throw new Error('node awal bukan dialog pembuka yang langsung menuju titik pertama');
  const intro: DialogueLine[] = awal.baris.map((b, i) => {
    if (b.jika) throw new Error(`pembuka: baris ${b.teks} bersyarat`);
    const id = `buka${i + 1}`;
    simpanKunci(textKey.introLine(id), 'line', b.teks);
    return { id, ...pembicara(b.siapa, 'pembuka'), ifFlag: null };
  });

  // ---- konsekuensi tertunda: cabang `{ tanda }` -> dialog ber-efek -> titik (naskah: janji tanggal 20 ditagih di awal K14)
  interface Tertunda { tanda: string; babak: string; delta: number; baris: Baris[]; cabang: string; dialog: string }
  const tertunda: Tertunda[] = [];
  const idTitik = new Set(titik.map((t) => t.id));
  for (const n of Object.values(ep.node)) {
    if (n.jenis !== 'cabang' || !idTitik.has(n.lainnya)) continue;
    for (const c of n.cabang) {
      const tanda = 'tanda' in c.jika ? c.jika.tanda : null;
      const d = ep.node[c.lanjut];
      if (!tanda || !d || d.jenis !== 'dialog' || d.lanjut !== n.lainnya || typeof d.efek?.kepercayaan !== 'number') {
        throw new Error(`cabang ${n.id}: bentuk konsekuensi tertunda tidak dikenal (harus tanda -> dialog ber-efek kepercayaan -> ${n.lainnya})`);
      }
      if (!CONTENT_ID_PATTERN.test(tanda)) throw new Error(`cabang ${n.id}: tanda "${tanda}" bukan id konten yang sah`);
      tertunda.push({ tanda, babak: n.lainnya, delta: d.efek.kepercayaan, baris: d.baris, cabang: n.id, dialog: d.id });
    }
  }

  // ---- babak
  const babak: RoundContent[] = [];
  const ringkasBabak: RingkasBabak[] = [];
  const tandaTerpasang = new Map<string, string>();
  const deltaSaran: number[] = [];
  const varianDiratakan: string[] = [];

  titik.forEach((t, indeks) => {
    const n = ep.node[t.id];
    if (!n || (n.jenis !== 'pilihan' && n.jenis !== 'aktivitas')) throw new Error(`titik ${t.id}: node bukan pilihan / aktivitas`);
    if (t.nomor !== indeks + 1 || !CONTENT_ID_PATTERN.test(t.id)) throw new Error(`titik ${t.id}: nomor / id tidak urut`);
    if (Object.keys(t.alternatif).sort().join('') !== ALTERNATIF.join('')) throw new Error(`titik ${t.id}: alternatif bukan a..e`);
    const rencana = RENCANA[t.id];
    const aktivitas = n.jenis === 'aktivitas' ? ep.aktivitas[n.aktivitas] : null;
    if (n.jenis === 'aktivitas' && (!aktivitas || !rencana)) throw new Error(`titik ${t.id}: aktivitas "${n.aktivitas}" tanpa RENCANA konversi`);
    if (n.jenis === 'pilihan' && rencana) throw new Error(`titik ${t.id}: RENCANA hanya untuk titik aktivitas`);
    const misi = (bahasa: ContentLocale) => aktivitas!.misi(bahasa);
    const tataLetak: RoundLayout = n.jenis === 'pilihan' || aktivitas?.arena?.pola === 'pesan' ? 'chat' : 'dossier';

    simpanKunci(textKey.roundTitle(t.id), 'roundTitle', t.judul);
    const bab = ep.bab.find((b) => b.id === n.bab);
    if (bab) simpanKunci(textKey.roundMeta(t.id), 'roundMeta', bab.judul);
    simpanKunci(textKey.roundPrompt(t.id), 'prompt', n.jenis === 'pilihan' ? n.tanya : rencana!.tanya ?? `akt.${n.aktivitas}.instruksi`);
    simpanKunci(textKey.roundReason(t.id), 'reason', t.alasan);
    if (rencana?.tanya) pecahan.push({ babak: t.id, uraian: `Prompt = \`${rencana.tanya}\` (the question of the activity's last step), not the activity instruction \`akt.${(n as NodeAktivitas).aktivitas}.instruksi\`, which tells the player to mark lanes: that step does not exist in a room.` });

    // -- baris pembuka (+ baris protes konsekuensi tertunda lebih dulu, seperti urutan naskah)
    const baris: DialogueLine[] = [];
    const efekTertunda: { flag: string; moodDelta: number }[] = [];
    for (const k of tertunda.filter((x) => x.babak === t.id)) {
      if (!tandaTerpasang.has(k.tanda)) throw new Error(`titik ${t.id}: tanda "${k.tanda}" tidak dipasang pilihan di babak sebelumnya`);
      k.baris.forEach((b, i) => {
        if (b.jika) throw new Error(`${k.dialog}: baris ${b.teks} bersyarat ganda`);
        const id = `${k.tanda}-${i + 1}`;
        simpanKunci(textKey.line(t.id, id), 'line', b.teks);
        baris.push({ id, ...pembicara(b.siapa, k.dialog), ifFlag: k.tanda });
      });
      efekTertunda.push({ flag: k.tanda, moodDelta: k.delta });
    }
    n.baris.forEach((b, i) => {
      if (b.jika) throw new Error(`titik ${t.id}: baris pembuka ${b.teks} bersyarat (tidak ada aturan konversinya)`);
      const id = `b${i + 1}`;
      simpanKunci(textKey.line(t.id, id), 'line', b.teks);
      baris.push({ id, ...pembicara(b.siapa, t.id), ifFlag: null });
    });

    // -- alternatif: efek dasar, akibat dasar, varian
    const cabangAlt = (alt: string): { efek: Efek; lanjut: string; jika?: Kondisi }[] => {
      const tandaKep = `kep:${t.id}:${alt}`;
      const semua = n.jenis === 'pilihan' ? n.pilihan.map((p) => ({ efek: p.efek, lanjut: p.lanjut, jika: undefined })) : n.hasil.map((h) => ({ efek: h.efek, lanjut: h.lanjut, jika: h.jika }));
      return semua.filter((x): x is { efek: Efek; lanjut: string; jika: Kondisi | undefined } => !!x.efek?.pasang?.includes(tandaKep));
    };
    /** Opsi langkah pilih-satu aktivitas yang disyaratkan sebuah cabang (tanda `akt:<aktivitas>:pilih:<opsi>`, langsung atau di dalam `semua`). */
    const opsiCabang = (k: Kondisi | undefined, aktivitasId: string): string[] => {
      if (!k) return [];
      const awalan = `akt:${aktivitasId}:pilih:`;
      if ('tanda' in k) return k.tanda.startsWith(awalan) ? [k.tanda.slice(awalan.length)] : [];
      return 'semua' in k ? k.semua.flatMap((x) => opsiCabang(x, aktivitasId)) : [];
    };
    interface Alt { alt: string; nilai: keyof typeof AKURASI; delta: number; tanda: string | null; akibat: Baris[]; alasan: string; kombinasi: string[] }
    const alternatif: Alt[] = ALTERNATIF.map((alt) => {
      const cabang = cabangAlt(alt);
      const dasar = cabang.find((c) => c.lanjut === `${t.id}-${alt}`);
      if (!dasar) throw new Error(`titik ${t.id}: alternatif ${alt} tanpa cabang dasar ${t.id}-${alt}`);
      const delta = dasar.efek.kepercayaan;
      if (typeof delta !== 'number' || cabang.some((c) => c.efek.kepercayaan !== delta)) throw new Error(`titik ${t.id}-${alt}: delta status tidak tunggal`);
      const varian = [...new Set(cabang.map((c) => c.lanjut).filter((l) => l !== `${t.id}-${alt}`))];
      for (const v of varian) varianDiratakan.push(v);
      if (varian.length) {
        pendekatan.push({ babak: t.id, uraian: `Option ${alt.toUpperCase()}: the solo result variant${varian.length > 1 ? 's' : ''} ${varian.map((v) => `\`${v}\``).join(', ')} (other arrangements of the activity that map to the same alternative, same classification and status change) ${varian.length > 1 ? 'are' : 'is'} flattened to the base outcome \`${t.id}-${alt}\`.` });
      }
      const lain = (dasar.efek.pasang ?? []).filter((p) => p !== `kep:${t.id}:${alt}`);
      let tanda: string | null = null;
      for (const p of lain) {
        if (tertunda.some((k) => k.tanda === p)) {
          if (tanda) throw new Error(`titik ${t.id}-${alt}: lebih dari satu tanda tertunda`);
          tanda = p;
          tandaTerpasang.set(p, t.id);
        } else pendekatan.push({ babak: t.id, uraian: `Option ${alt.toUpperCase()}: the solo flag \`${p}\` is not mapped (no later round reads it).` });
      }
      const akibat = ep.node[dasar.lanjut];
      if (!akibat || akibat.jenis !== 'dialog') throw new Error(`titik ${t.id}: node akibat ${dasar.lanjut} bukan dialog`);
      if (akibat.efek) throw new Error(`titik ${t.id}: node akibat ${dasar.lanjut} punya efek sendiri (tidak ada aturan konversinya)`);
      const bersyarat = akibat.baris.filter((b) => b.jika);
      if (bersyarat.length) {
        pendekatan.push({ babak: t.id, uraian: `Option ${alt.toUpperCase()}: ${bersyarat.length} outcome line${bersyarat.length > 1 ? 's' : ''} shown only for certain arrangements of the solo activity (${bersyarat.map((b) => `\`${b.teks}\``).join(', ')}) ${bersyarat.length > 1 ? 'are' : 'is'} not carried: a room option has no arrangement.` });
      }
      const nilai = t.alternatif[alt]!.nilai;
      if (nilai === 'tepat') deltaSaran.push(delta);
      // Kombinasi dasar alternatif ini di aktivitas berlangkah ganda (mis. K11: tindakan atas bundel + kabar).
      const kombinasi = n.jenis === 'aktivitas' ? cabang.filter((c) => c.lanjut === dasar.lanjut).map((c) => opsiCabang(c.jika, n.aktivitas)).find((o) => o.length > 1) ?? [] : [];
      return { alt, nilai, delta, tanda, akibat: akibat.baris.filter((b) => !b.jika), alasan: dasar.efek.alasan ?? `${t.id}.${alt}.alasan`, kombinasi };
    });
    if (n.jenis === 'aktivitas' && alternatif.some((a) => a.kombinasi.length > 1)) {
      if (alternatif.some((a) => a.kombinasi.length < 2)) throw new Error(`titik ${t.id}: kombinasi dasar tidak lengkap untuk tiap alternatif`);
      pendekatan.push({ babak: t.id, uraian: `The solo activity combines ${alternatif[0]!.kombinasi.length} choices; a room option is one of the script’s five alternatives, and its outcome is that of the alternative’s base combination: ${alternatif.map((a) => `${a.alt.toUpperCase()} = ${a.kombinasi.map((o) => `\`${o}\``).join(' + ')}`).join('; ')} (option texts \`akt.${n.aktivitas}.opsi.<id>\`). An outcome therefore also states the side its option text does not name, for example that no news was sent.` });
    }

    // -- responden babak: pembicara yang paling sering MEMBUKA akibat dengan kutipan (seri: nasabah)
    const pembuka = alternatif.map((a) => (a.akibat[0] && a.akibat[0].siapa !== 'narasi' ? pembicara(a.akibat[0].siapa, `${t.id}-${a.alt}`) : null));
    const hitung = new Map<string, { ref: SpeakerRef; n: number }>();
    for (const p of pembuka) {
      if (!p) continue;
      const k = `${p.speaker}:${p.castId ?? ''}`;
      hitung.set(k, { ref: p, n: (hitung.get(k)?.n ?? 0) + 1 });
    }
    const calon = [...hitung.values()].sort((a, b) => b.n - a.n || Number(b.ref.speaker === 'customer') - Number(a.ref.speaker === 'customer'));
    const responden: SpeakerRef | null = calon[0]?.ref ?? null;

    // -- pilihan + teksnya
    const bentukAktivitas: ChoiceForm = rencana?.bentuk ?? 'action';
    const pilihan: ChoiceContent[] = alternatif.map((a) => {
      const id = idPilihan(a.alt);
      const kunciTeks = n.jenis === 'pilihan' ? n.pilihan.find((p) => p.id === a.alt)!.teks : rencana!.pilihan?.(a.alt) ?? t.alternatif[a.alt]!.label;
      // Balasan yang seluruhnya di dalam kurung = arahan tindakan, bukan pesan ("(Tidak membalas dulu …)"): bentuk tindakan, kurung dilepas.
      const dalamKurung = (s: string) => /^\(.*\)$/s.test(s.trim());
      const kurung = n.jenis === 'pilihan' && BAHASA_RUANG.every((b) => dalamKurung(tx(b, kunciTeks)));
      if (n.jenis === 'pilihan' && !kurung && BAHASA_RUANG.some((b) => dalamKurung(tx(b, kunciTeks)))) throw new Error(`titik ${t.id}-${a.alt}: kurung balasan tidak sama di semua bahasa`);
      const bentuk: ChoiceForm = n.jenis === 'pilihan' ? (kurung ? 'action' : 'message') : bentukAktivitas;
      simpan(textKey.choiceText(t.id, id), 'choiceText', (b) => (kurung ? tx(b, kunciTeks).trim().slice(1, -1).trim() : tx(b, kunciTeks)));
      if (kurung) pecahan.push({ babak: t.id, uraian: `Option ${a.alt.toUpperCase()} (\`${kunciTeks}\`) is a stage direction in brackets, not a message: its form is "action" and the outer brackets are removed.` });

      // Kutipan pembuka responden -> balasan; sisanya -> konsekuensi (urut naskah).
      let i = 0;
      const balasan: Baris[] = [];
      while (responden && i < a.akibat.length && a.akibat[i]!.siapa !== 'narasi' && samaPembicara(pembicara(a.akibat[i]!.siapa, t.id), responden)) balasan.push(a.akibat[i++]!);
      const sisa = a.akibat.slice(i);
      const kutipanDiTengah = sisa.filter((b) => b.siapa !== 'narasi');
      const bagian = (bahasa: ContentLocale, b: Baris): string => {
        const isi = tx(bahasa, b.teks);
        if (b.siapa === 'narasi') return b.topik ? `${tx(bahasa, b.topik)}: ${isi}` : isi;
        const [buka, tutup] = KUTIP[bahasa];
        if (isi.includes(buka) || isi.includes(tutup)) throw new Error(`titik ${t.id}-${a.alt}: kutipan ${b.teks} sudah memuat tanda kutip (${bahasa})`);
        return `${namaPemeran(bahasa, b.siapa)}: ${buka}${isi}${tutup}`;
      };
      simpan(textKey.choiceReply(t.id, id), 'reply', (b) => balasan.map((x) => tx(b, x.teks)).join(' '));
      if (sisa.length) {
        const konsekuensi = (b: ContentLocale) => sisa.map((x) => bagian(b, x)).join(' ');
        simpan(textKey.choiceConsequence(t.id, id), 'consequence', konsekuensi);
        // Kalimat alasan netral yang kata demi kata sama dengan konsekuensinya tidak diulang sebagai alasan (alasan babak tetap ada).
        if (BAHASA_RUANG.every((b) => konsekuensi(b) === tx(b, a.alasan))) {
          pecahan.push({ babak: t.id, uraian: `Option ${a.alt.toUpperCase()}: the neutral cause sentence \`${a.alasan}\` is word for word the outcome narration, so it is not repeated as the option’s reason.` });
        } else simpanKunci(textKey.choiceReason(t.id, id), 'reason', a.alasan);
      } else {
        // Hanya kutipan responden: kalimat alasan netral naskah (yang di solo tampil bersama reaksi) menjadi konsekuensinya.
        simpanKunci(textKey.choiceConsequence(t.id, id), 'consequence', a.alasan);
        pecahan.push({ babak: t.id, uraian: `Option ${a.alt.toUpperCase()}: the base outcome is only ${balasan.length ? 'the respondent’s words' : 'empty'}, so the neutral cause sentence \`${a.alasan}\` is the consequence text (a consequence is required) and the option has no separate reason.` });
      }
      if (kutipanDiTengah.length) {
        pecahan.push({ babak: t.id, uraian: `Option ${a.alt.toUpperCase()}: ${kutipanDiTengah.map((b) => `\`${b.teks}\` (${ep.pemeran[b.siapa] ? namaPemeran('id', b.siapa) : b.siapa})`).join(', ')} ${kutipanDiTengah.length > 1 ? 'are' : 'is'} written inside the consequence as \`Name: "…"\`, in script order (${!responden ? 'the round has no respondent: no outcome opens with a quote' : kutipanDiTengah.some((b) => samaPembicara(pembicara(b.siapa, t.id), responden)) ? 'the words come after narration, and a reply is always shown before the consequence' : 'the speaker is not the round’s respondent'}).` });
      }
      if (a.akibat.some((b) => b.topik)) pecahan.push({ babak: t.id, uraian: `Option ${a.alt.toUpperCase()}: the topic labels of the outcome lines (${[...new Set(a.akibat.filter((b) => b.topik).map((b) => `\`${b.topik}\``))].join(', ')}) are written as a prefix "Label: …" inside the one consequence text.` });
      return { id, classification: KLASIFIKASI[a.nilai], accuracy: AKURASI[a.nilai], moodDelta: a.delta, setsFlag: a.tanda, form: bentuk };
    });

    // -- waktu habis: delta terburuk; teks dari konverter
    const waktuHabis = Math.min(...alternatif.map((a) => a.delta));
    simpan(textKey.timeoutConsequence(t.id), 'consequence', (b) => TEKS_KONVERTER.waktuHabis[b].replace('{nasabah}', namaPemeran(b, idNasabah)));

    // -- berkas (fakta bersama)
    const sumberBukti: SumberBukti[] = n.jenis === 'pilihan' ? (n.dokumen ? [{ jenis: 'dokumen', dokumen: n.dokumen }] : []) : rencana!.bukti;
    const bukti: EvidenceItem[] = [];
    const ringkasBukti: string[] = [];
    let ceritaTerpakai = false;
    const cerita = (bahasa: ContentLocale) => misi(bahasa).story;
    /** Judul berkas; lebih dari batas dengan keterangan dalam kurung di ujung -> keterangan itu menjadi label jenis (kicker). */
    const judulBukti = (idBukti: string, judul: (bahasa: ContentLocale) => string, asal: string) => {
      const semua = BAHASA_RUANG.map((b) => judul(b));
      if (semua.every((j) => panjang(j) <= TEXT_LIMITS.evidenceTitle)) {
        simpan(textKey.evidenceTitle(t.id, idBukti), 'evidenceTitle', judul);
        return;
      }
      const pisah = semua.map((j) => /^(.*\S)\s*\(([^()]+)\)$/.exec(j));
      if (pisah.some((m) => !m)) throw new Error(`titik ${t.id}: judul berkas ${asal} melewati ${TEXT_LIMITS.evidenceTitle} karakter dan tidak berakhiran keterangan dalam kurung`);
      simpan(textKey.evidenceTitle(t.id, idBukti), 'evidenceTitle', (b) => /^(.*\S)\s*\(([^()]+)\)$/.exec(judul(b))![1]!);
      simpan(textKey.evidenceKicker(t.id, idBukti), 'evidenceKicker', (b) => /^(.*\S)\s*\(([^()]+)\)$/.exec(judul(b))![2]!);
      pecahan.push({ babak: t.id, uraian: `Evidence title \`${asal}\` is longer than ${TEXT_LIMITS.evidenceTitle} characters (${semua.map((j, i) => `${BAHASA_RUANG[i]} ${panjang(j)}`).join(', ')}): the words in brackets at its end become the item’s kind label and the rest stays the title.` });
    };
    for (const s of sumberBukti) {
      if (s.jenis === 'dokumen') {
        const d = ep.dokumen?.[s.dokumen];
        if (!d || !CONTENT_ID_PATTERN.test(s.dokumen)) throw new Error(`titik ${t.id}: dokumen "${s.dokumen}" tidak ada`);
        const kind: EvidenceKind = d.tahapan ? 'timeline' : 'compare';
        judulBukti(s.dokumen, (b) => tx(b, d.judul), d.judul);
        if (d.catatan) simpanKunci(textKey.evidenceBody(t.id, s.dokumen), 'evidenceBody', d.catatan);
        const rows = d.baris.map((r, i) => {
          const id = `r${i + 1}`;
          simpanKunci(textKey.evidenceRow(t.id, s.dokumen, id), 'evidenceRow', r.label);
          if (r.nilai) simpanKunci(textKey.evidenceRowValue(t.id, s.dokumen, id), 'evidenceRow', r.nilai);
          return { id, mark: 'none' as EvidenceMark };
        });
        bukti.push({ id: s.dokumen, kind, assetId: null, spot: null, rows });
        ringkasBukti.push(`${kind} \`dok.${s.dokumen}\` (${rows.length} rows)`);
        if (d.skema) pendekatan.push({ babak: t.id, uraian: `The lane diagram and sign pictures of document \`${s.dokumen}\` are not drawn: its ${rows.length} facts are the rows of a comparison.` });
        if (d.tahapan === 'paralel') pendekatan.push({ babak: t.id, uraian: `Document \`${s.dokumen}\` is shown as numbered steps; the solo screen’s remark that its order is the order of explanation, not a schedule, is interface text of the solo game and is not in the room.` });
      } else if (s.jenis === 'kartu') {
        const id = 'kartu';
        judulBukti(id, (b) => misi(b).title, `akt.${(n as NodeAktivitas).aktivitas}.judul`);
        simpan(textKey.evidenceBody(t.id, id), 'evidenceBody', cerita);
        ceritaTerpakai = true;
        bukti.push({ id, kind: 'document', assetId: null, spot: null, rows: [] });
        ringkasBukti.push(`document: the activity card (title + story)`);
      } else if (s.jenis === 'item') {
        const id = 'daftar';
        const langkah = (bahasa: ContentLocale) => {
          const l = misi(bahasa).steps.find((x) => x.id === s.langkah);
          if (!l || l.kind !== 'assign') throw new Error(`titik ${t.id}: langkah "${s.langkah}" bukan langkah susun`);
          return l;
        };
        judulBukti(id, (b) => misi(b).title, `akt.${(n as NodeAktivitas).aktivitas}.judul`);
        if (!ceritaTerpakai) simpan(textKey.evidenceBody(t.id, id), 'evidenceBody', cerita);
        ceritaTerpakai = true;
        const rows = langkah('id').items.map((it, i) => {
          if (!CONTENT_ID_PATTERN.test(it.id)) throw new Error(`titik ${t.id}: id item "${it.id}" bukan id konten yang sah`);
          simpan(textKey.evidenceRow(t.id, id, it.id), 'evidenceRow', (b) => langkah(b).items[i]!.label);
          return { id: it.id, mark: 'none' as EvidenceMark };
        });
        bukti.push({ id, kind: 'checklist', assetId: null, spot: null, rows });
        ringkasBukti.push(`checklist: the ${rows.length} items of the activity, in the activity’s own order, no status marks`);
      } else {
        const tabel = (bahasa: ContentLocale) => {
          const x = misi(bahasa).tables?.find((y) => y.id === s.tabel);
          if (!x) throw new Error(`titik ${t.id}: tabel "${s.tabel}" tidak ada di aktivitas`);
          return x;
        };
        if (!CONTENT_ID_PATTERN.test(s.tabel)) throw new Error(`titik ${t.id}: id tabel "${s.tabel}" bukan id konten yang sah`);
        judulBukti(s.tabel, (b) => tabel(b).title, `akt.${(n as NodeAktivitas).aktivitas}.tabel.judul`);
        const pakaiCerita = s.cerita && !ceritaTerpakai;
        if (pakaiCerita) ceritaTerpakai = true;
        simpan(textKey.evidenceBody(t.id, s.tabel), 'evidenceBody', (b) => [pakaiCerita ? cerita(b) : '', tabel(b).note ?? ''].filter(Boolean).join('\n'));
        const tandaNilai = (bahasa: ContentLocale, nilai: string): EvidenceMark | null => {
          for (const [kunci, mark] of Object.entries(s.tanda ?? {})) if (tx(bahasa, kunci) === nilai) return mark;
          return null;
        };
        const rows = tabel('id').rows.map((r, i) => {
          const id = `r${i + 1}`;
          const mark = tandaNilai('id', r.value);
          if (BAHASA_RUANG.some((b) => tandaNilai(b, tabel(b).rows[i]!.value) !== mark)) throw new Error(`titik ${t.id}: tanda baris ${id} tabel ${s.tabel} berbeda antarbahasa`);
          simpan(textKey.evidenceRow(t.id, s.tabel, id), 'evidenceRow', (b) => tabel(b).rows[i]!.label);
          if (!mark) simpan(textKey.evidenceRowValue(t.id, s.tabel, id), 'evidenceRow', (b) => tabel(b).rows[i]!.value);
          return { id, mark: mark ?? ('none' as EvidenceMark) };
        });
        bukti.push({ id: s.tabel, kind: s.bentuk, assetId: null, spot: null, rows });
        ringkasBukti.push(`${s.bentuk}: activity table \`${s.tabel}\` (${rows.length} rows)`);
        if (s.tanda) pecahan.push({ babak: t.id, uraian: `Table \`${s.tabel}\`: the cell values ${Object.keys(s.tanda).map((k) => `\`${k}\` ("${tx('id', k)}")`).join(' and ')} are shown as the room’s status marks (${Object.values(s.tanda).join(' / ')}: "Ada" / "Belum ada") instead of as text.` });
      }
    }
    if (aktivitas && !ceritaTerpakai) pendekatan.push({ babak: t.id, uraian: `The activity story \`akt.${(n as NodeAktivitas).aktivitas}.cerita\` is not carried: its fact is already a row of the evidence document.` });

    const telepon = !!n.tata?.telepon;
    const kunci = false; // diisi sesudah semua delta saran diketahui
    babak.push({
      id: t.id,
      backgroundAssetId: tataLetak === 'chat' || telepon ? LATAR_TELEPON : LATAR_MEJA,
      showOfficer: false,
      mediaAssetId: null,
      lines: baris,
      choices: pilihan,
      timeout: { moodDelta: waktuHabis },
      layout: tataLetak,
      keyRound: kunci,
      flagEffects: efekTertunda,
      authorNote: '',
      evidence: bukti,
      respondent: responden,
    });
    ringkasBabak.push({
      id: t.id,
      nomor: t.nomor,
      judul: tx('id', t.judul),
      sumber: n.jenis === 'pilihan' ? 'chat reply' : `activity \`${n.aktivitas}\``,
      tataLetak,
      kunci,
      responden: responden ? (responden.speaker === 'cast' ? namaPemeran('id', responden.castId!) : responden.speaker === 'customer' ? namaPemeran('id', idNasabah) : namaPemeran('id', idPetugas)) : 'none (narration)',
      bukti: ringkasBukti,
      pilihan: alternatif.map((a, i) => ({ alt: a.alt, nilai: a.nilai, delta: a.delta, tanda: a.tanda, bentuk: pilihan[i]!.form })),
      waktuHabis,
      efekTertunda: efekTertunda.map((e) => ({ tanda: e.flag, delta: e.moodDelta })),
    });
  });

  // ---- babak kunci: saran berbobot lebih dari bobot dasar (naskah: titik kunci berbobot ganda)
  const bobotDasar = Math.min(...deltaSaran);
  babak.forEach((r, i) => {
    r.keyRound = deltaSaran[i]! > bobotDasar;
    ringkasBabak[i]!.kunci = r.keyRound;
  });
  for (const k of tertunda) if (!babak.some((r) => r.flagEffects.some((e) => e.flag === k.tanda))) throw new Error(`konsekuensi tertunda ${k.cabang} tidak terpasang di babak mana pun`);

  // ---- tokoh pendukung
  const cast = Object.keys(ep.pemeran).filter((id) => pemeranBersuara.has(id)).map((id) => ({ id, characterAssetId: null }));
  for (const m of cast) {
    simpan(textKey.castName(m.id), 'characterName', (b) => namaPemeran(b, m.id));
    simpanKunci(textKey.castRole(m.id), 'castRole', ep.pemeran[m.id]!.peran);
  }

  // ---- akhir: cabang status sesudah titik terakhir
  const akibatTerakhir = ep.node[`${titik[titik.length - 1]!.id}-a`] as NodeDialog;
  const cekAkhir = ep.node[akibatTerakhir.lanjut];
  if (!cekAkhir || cekAkhir.jenis !== 'cabang') throw new Error('sesudah titik terakhir tidak ada cabang akhir');
  const batasStatus = (k: Kondisi, di: string): { min: number | null; maks: number | null } => {
    if (!('kepercayaan' in k)) throw new Error(`${di}: akhir bercabang selain dari status`);
    return { min: k.kepercayaan.min ?? null, maks: k.kepercayaan.maks ?? null };
  };
  const akhir: EndingContent[] = [];
  const pasangAkhir = (idNode: string, batas: { min: number | null; maks: number | null }) => {
    const a = ep.node[idNode];
    if (!a || a.jenis !== 'akhir' || !ep.akhir[a.akhir] || !CONTENT_ID_PATTERN.test(a.akhir)) throw new Error(`node akhir ${idNode} tidak sah`);
    const info = ep.akhir[a.akhir]!;
    simpanKunci(textKey.endingTitle(a.akhir), 'endingTitle', info.judul);
    simpanKunci(textKey.endingText(a.akhir), 'endingText', info.ringkas);
    const ucapan = (ref: SpeakerRef['speaker']) => a.baris.filter((b) => !b.jika && b.siapa !== 'narasi' && pembicara(b.siapa, idNode).speaker === ref);
    simpan(textKey.endingCustomer(a.akhir), 'endingText', (b) => ucapan('customer').map((x) => tx(b, x.teks)).join(' '));
    simpan(textKey.endingMentor(a.akhir), 'endingText', (b) => ucapan('officer').map((x) => tx(b, x.teks)).join(' '));
    akhir.push({ id: a.akhir, kind: JENIS_AKHIR[info.nada], minMood: batas.min, maxMood: batas.maks, minScore: null, maxScore: null });
    return a.baris.filter((b) => b.siapa === 'narasi').map((b) => b.teks);
  };
  const narasiAkhir = new Set<string>();
  for (const c of cekAkhir.cabang) for (const k of pasangAkhir(c.lanjut, batasStatus(c.jika, cekAkhir.id))) narasiAkhir.add(k);
  for (const k of pasangAkhir(cekAkhir.lainnya, { min: null, maks: null })) narasiAkhir.add(k);

  // ---- catatan internal (hanya CMS; tidak pernah dikirim ke room)
  const catatan = [
    `Dibuat otomatis dari Episode 2 solo "${tx('id', ep.judul)}" (client/src/cerita/episode/${ep.id}, versi ${ep.versi}) oleh tools/cerita/ep2-ke-skenario.mts (T-028).`,
    'Jangan disunting di CMS: ubah naskah episode solo, lalu jalankan ulang konverter. Daftar penyederhanaan: docs/prd-v02/EP2-ROOM-CONVERSION.md.',
    'Terbit lewat seed server untuk uji acara, bukan persetujuan komite.',
    ...(ep.statusNaskah ? [`Status naskah sumber: ${tx('id', ep.statusNaskah)}`] : []),
  ].join('\n');

  const mentah: ScenarioContent = {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    categoryId: 'auto',
    difficulty: 2,
    locales: [...BAHASA_RUANG],
    initialMood: ep.kepercayaanAwal,
    contentSource: 'demo',
    presentation: {
      customerCharacterId: null,
      officerCharacterId: TOKOH_PETUGAS,
      moodExpressions: { sangat_kecewa: '', kecewa: '', ragu: '', tenang: '', senang: '' },
      bgmAssetId: null,
    },
    cast,
    intro,
    rounds: babak,
    endings: akhir,
    authorNotes: catatan,
    text: teks,
  };
  const konten = sanitizeScenarioContent(JSON.parse(JSON.stringify(mentah)));
  if (!konten) throw new Error('konten tidak terbaca sesudah disanitasi');
  // Sanitasi tidak boleh mengubah apa pun selain merapikan spasi: yang disimpan harus sama dengan yang disusun.
  for (const bahasa of BAHASA_RUANG) {
    for (const [k, v] of Object.entries(teks[bahasa])) {
      if (konten.text[bahasa]?.[k] === undefined) throw new Error(`teks ${bahasa} "${k}" hilang saat sanitasi`);
      if (konten.text[bahasa]![k] !== v) pecahan.push({ babak: null, uraian: `Text \`${k}\` (${bahasa}): whitespace was normalised by the content sanitiser.` });
    }
  }

  // ---- pendekatan tingkat skenario
  const aktivitasBukanBabak = Object.values(ep.node).filter((n): n is NodeAktivitas => n.jenis === 'aktivitas' && !idTitik.has(n.id)).map((n) => n.id);
  pendekatan.unshift(
    { babak: null, uraian: `Room text is Indonesian for every participant: the room runtime reads one fixed content language (\`server/src/story/runtime/room.ts\`, \`LOCALE = 'id'\`). The English text map is stored (${Object.keys(teks.en).length} texts) and validated, but no room shows it until the runtime gets a language choice.` },
    { babak: null, uraian: 'Chinese (zh) is not converted (content locales are id and en).' },
    { babak: null, uraian: `Pak Hendra has no portrait: \`customerCharacterId\` is null (name and status word only). A built-in character is not a data + URL addition: built-in characters are drawn by client code for Bu Rina only, built-in assets have no file URL, and the chat and dossier layouts show no customer portrait at all. The default customer portrait is Bu Rina’s face, which must not stand for Pak Hendra.` },
    { babak: null, uraian: `No \`stage\` rounds: every solo decision is either a chat reply or an activity, so rounds are \`chat\` (${babak.filter((r) => r.layout === 'chat').length}) or \`dossier\` (${babak.filter((r) => r.layout === 'dossier').length}). Backgrounds are the built-in \`telepon\` (chat and phone-cue rounds) and \`meja\`; neither layout draws them. The Episode 2 pixel rooms, walking, the phone hand-over cutscene and the Claims Committee room are not in a room.` },
    { babak: null, uraian: `Activities become one decision with five options (the script’s five alternatives). The player does not arrange documents, cards or message parts; what an arrangement would show (which tray, which lane) is reduced to the option text \`titik.<id>.<alt>\`, the script’s own summary of that alternative.` },
    { babak: null, uraian: 'In English the summary labels used as option texts of activity rounds are in the past tense ("Sent Rudi to inspect at the depot"): right for a summary, odd for an option. No room shows English today (first item); to be reworded if rooms get an English content language.' },
    { babak: null, uraian: `Not a round: ${aktivitasBukanBabak.map((x) => `\`${x}\``).join(', ') || 'none'} (the SIM check after K09: a learning activity with no status change and no numbered decision).` },
    { babak: null, uraian: `Solo bookkeeping is not mapped: the summary flags \`kep:<titik>:<alt>\` and the case notes (\`catat\`). Only a flag that a later round reads becomes a room flag: ${[...tandaTerpasang.entries()].map(([f, r]) => `\`${f}\` (left in ${r.toUpperCase()}, read at the start of ${tertunda.find((k) => k.tanda === f)!.babak.toUpperCase()}: ${tertunda.find((k) => k.tanda === f)!.delta} and a line only its holder sees)`).join('; ') || 'none'}. The follow-up flag set by the protest itself is not needed (a room applies a delayed effect once by construction).` },
    { babak: null, uraian: 'The delayed flag has no label text: the script has only full sentences for it, and the room inserts a label into its own sentence ("<label> (babak 12) berdampak di babak ini"). Without a label the reminder reads "keputusanmu di babak 12 …"; the protest line itself names the promise.' },
    { babak: null, uraian: `The opening is carried whole (${intro.length} lines), including Miss Raksa’s sentence that her advice and reasons come at the end (\`${awal.baris[awal.baris.length - 1]!.teks}\`). In a room that is only half true: the recommended option is shown right after a round that was not answered correctly, and her reasons come in the final summary. Kept as written; leaving the sentence out is a script decision.` },
    { babak: null, uraian: 'Timeout: the solo game has no timer and no timeout text. Each round’s timeout applies the worst status change among its five alternatives, with one converter-written sentence (below).' },
    { babak: null, uraian: 'No lesson text per round: after a decision the room shows the option’s neutral cause sentence (as the solo game does); Miss Raksa’s reason for the round (\`titik.<id>.alasan\`) is the round reason of the final summary. Nothing is cut to the 220-character lesson limit.' },
    { babak: null, uraian: `Endings: chosen by final status only, as in the script (${akhir.map((e) => `\`${e.id}\` ${e.kind}${e.minMood !== null ? ` from ${e.minMood}` : ' fallback'}`).join(', ')}). Ending text = the one-line summary \`akhir.<id>.ringkas\`, then Pak Hendra’s and Miss Raksa’s closing words. The shared narration ${[...narasiAkhir].map((k) => `\`${k}\``).join(', ')} is not carried (its fact is in the summary line), nor are the solo end screen’s result cards and lessons (\`kartu.*\`, \`akhir.pelajaran.*\`).` },
    { babak: null, uraian: 'Not carried from the solo presentation: glossary buttons ("Apa itu …?"), chat attachments such as the truck photos, expressions, the buttons’ send labels (`akt.<id>.kirim`: they name the solo gesture, e.g. "Tugaskan Mas Rudi", and would contradict options such as assessing from photos only), the per-step questions and hints of activities, chapter goals, and the location names.' },
    { babak: null, uraian: 'Scenario kind: `contentSource` is `demo` (the schema has only demo and settled_case, and this script is a draft, not a committee-settled case). The host picker therefore marks it DEMO and competition recaps leave its rooms out unless "sertakan DEMO" is chosen.' },
  );

  // ---- ukuran teks terhadap batas + validasi (gerbang keras)
  const terpanjang = new Map<string, { jenis: string; batas: number; panjang: number; bahasa: string; kunci: string }>();
  for (const bahasa of BAHASA_RUANG) {
    for (const [k, v] of Object.entries(konten.text[bahasa] ?? {})) {
      const b = batasKunci.get(k);
      if (!b) throw new Error(`teks "${k}" tanpa batas yang dikenal`);
      const p = panjang(v);
      if (p > b.batas) throw new Error(`teks ${bahasa} "${k}" ${p} karakter, batas ${b.jenis} ${b.batas}: tidak ada aturan pecah untuk teks ini`);
      if (p > (terpanjang.get(b.jenis)?.panjang ?? -1)) terpanjang.set(b.jenis, { ...b, panjang: p, bahasa, kunci: k });
    }
  }
  const isu = validateScenario(konten, konteksValidasi());
  const laporan: Laporan = {
    sumber: { episode: ep.id, versi: ep.versi, bahasa: [...BAHASA_RUANG] },
    babak: ringkasBabak,
    pendekatan,
    pecahan,
    teksKonverter: [
      { kunci: textKey.synopsis(), dipakai: 'appended to the Episode 2 blurb (`ringkas`)', ...TEKS_KONVERTER.sinopsis },
      { kunci: 'round.<id>.timeout.consequence', dipakai: `timeout consequence of all ${babak.length} rounds; {nasabah} = the customer’s name from the script`, ...TEKS_KONVERTER.waktuHabis },
    ],
    ukuran: [...terpanjang.values()].sort((a, b) => b.panjang / b.batas - a.panjang / a.batas),
    validasi: { galat: isu.filter((i) => i.severity === 'error'), peringatan: isu.filter((i) => i.severity === 'warning') },
    jumlahTeks: Object.fromEntries(BAHASA_RUANG.map((b) => [b, Object.keys(konten.text[b] ?? {}).length])),
    hashKonten: createHash('sha256').update(jsonKanonik(konten)).digest('hex'),
  };
  if (babak.length !== STORY_ROUND_COUNT || babak.some((r) => r.choices.length !== STORY_CHOICE_COUNT)) throw new Error('jumlah babak / pilihan tidak sesuai');
  if (varianDiratakan.length !== new Set(varianDiratakan).size) throw new Error('varian akibat terhitung ganda');
  return { konten, laporan };
}

// ------------------------------------------------------------------ keluaran: seed TypeScript + laporan Markdown

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BERKAS_SEED = path.join(AKAR, 'server', 'src', 'story', 'seed', 'ep2Trailer.ts');
export const BERKAS_LAPORAN = path.join(AKAR, 'docs', 'prd-v02', 'EP2-ROOM-CONVERSION.md');

const petik = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
const kunciTs = (k: string) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : petik(k));
const sederhana = (v: unknown) => v === null || typeof v !== 'object' || (Array.isArray(v) && v.every((x) => x === null || typeof x !== 'object'));

/** Literal TypeScript bergaya repo (petik tunggal, kunci tanpa petik); objek / larik bernilai sederhana ditulis satu baris. */
export function tulisTs(v: unknown, lekuk = ''): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return petik(v);
  if (typeof v !== 'object') return String(v);
  const dalam = lekuk + '  ';
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    if (v.every((x) => x === null || typeof x !== 'object')) return `[${v.map((x) => tulisTs(x)).join(', ')}]`;
    return `[\n${v.map((x) => dalam + tulisTs(x, dalam)).join(',\n')},\n${lekuk}]`;
  }
  const isi = Object.entries(v as Record<string, unknown>);
  if (!isi.length) return '{}';
  const sebaris = `{ ${isi.map(([k, x]) => `${kunciTs(k)}: ${tulisTs(x)}`).join(', ')} }`;
  if (isi.every(([, x]) => sederhana(x)) && isi.length <= 8 && sebaris.length <= 150 && !isi.some(([k]) => k.includes('.'))) return sebaris;
  return `{\n${isi.map(([k, x]) => `${dalam}${kunciTs(k)}: ${tulisTs(x, dalam)}`).join(',\n')},\n${lekuk}}`;
}

export function sumberSeed(h: HasilKonversi): string {
  return `/**
 * SEED "Truk Trailer di Jalan Tol": Episode 2 solo sebagai skenario Story Room (T-028).
 *
 * GENERATED by tools/cerita/ep2-ke-skenario.mts from client/src/cerita/episode/${h.laporan.sumber.episode} (version ${h.laporan.sumber.versi}).
 * DO NOT EDIT BY HAND: change the solo episode (or the converter), then regenerate:
 *   npx tsx --tsconfig client/tsconfig.json tools/cerita/ep2-ke-skenario.mts
 * The converter test (tools/cerita/ep2-ke-skenario.test.mts, in \`npm run test:client\`) fails when this file is not what the
 * converter produces from the current episode. What was approximated: docs/prd-v02/EP2-ROOM-CONVERSION.md.
 *
 * Server-only (never bundled into the client). Content is in id + en; rooms play the Indonesian text. Published by
 * seed/publish.ts (idempotent by scenario id + content hash). Canonical content hash of this data:
 *   ${h.laporan.hashKonten}
 */
import type { ScenarioContent } from '../../../../shared/story/content';

export const EP2_TRAILER_CONTENT: ScenarioContent = ${tulisTs(h.konten)};

/** A fresh copy (callers may mutate it; the seed data never changes). */
export const ep2TrailerContent = (): ScenarioContent => structuredClone(EP2_TRAILER_CONTENT);
`;
}

export function sumberLaporan(h: HasilKonversi): string {
  const l = h.laporan;
  const baris: string[] = [];
  const t = (s: string) => baris.push(s);
  t('# T-028 conversion report: Episode 2 solo -> hosted story room scenario');
  t('');
  t(`Generated by \`tools/cerita/ep2-ke-skenario.mts\` from \`client/src/cerita/episode/${l.sumber.episode}\` (version ${l.sumber.versi}). Do not edit: rerun the converter.`);
  t(`Output: \`server/src/story/seed/ep2Trailer.ts\`, content hash \`${l.hashKonten}\`. Languages: ${l.sumber.bahasa.join(', ')} (${Object.entries(l.jumlahTeks).map(([b, n]) => `${b} ${n} texts`).join(', ')}).`);
  t(`Validator (\`shared/story/validate.ts\`): **${l.validasi.galat.length} errors**, ${l.validasi.peringatan.length} warnings (listed at the end; warnings never block publication).`);
  t('');
  t('## Rounds');
  t('');
  t('| # | Round | Solo form | Layout | Key | Respondent | A | B | C | D | E | Timeout | Evidence |');
  t('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  const sel = (p: RingkasBabak['pilihan'][number]) => `${p.nilai === 'tepat' ? '**tepat**' : p.nilai} ${p.delta > 0 ? '+' : ''}${p.delta}${p.tanda ? ` ⚑ \`${p.tanda}\`` : ''}`;
  for (const r of l.babak) {
    t(`| ${r.nomor} | \`${r.id}\` ${r.judul} | ${r.sumber} | ${r.tataLetak} | ${r.kunci ? 'yes' : ''} | ${r.responden} | ${r.pilihan.map(sel).join(' | ')} | ${r.waktuHabis}${r.efekTertunda.map((e) => `; start: ${e.delta} if \`${e.tanda}\``).join('')} | ${r.bukti.join('; ') || 'none'} |`);
  }
  t('');
  t('Each cell: the script’s classification and status change of that alternative, kept as authored. Accuracy is tepat 1, kurang 0.5, keliru 0. Option ids are `alt-a` to `alt-e`; a room shuffles the order per participant.');
  t(`Option form: ${l.babak.map((r) => `${r.id} ${[...new Set(r.pilihan.map((p) => p.bentuk))].join(' + ')}`).join(', ')}. The form shows only in chat rounds (a message is a sent bubble, an action a note).`);
  t('');
  const daftar = (judul: string, pembuka: string, isi: CatatanLaporan[]) => {
    t(`## ${judul}`);
    t('');
    t(pembuka);
    t('');
    const umum = isi.filter((c) => c.babak === null);
    for (const c of umum) t(`- ${c.uraian}`);
    const perBabak = new Map<string, string[]>();
    for (const c of isi) if (c.babak) perBabak.set(c.babak, [...(perBabak.get(c.babak) ?? []), c.uraian]);
    for (const [id, daftarBabak] of perBabak) for (const u of daftarBabak) t(`- **${id.toUpperCase()}** ${u}`);
    t('');
  };
  daftar('Approximations', `What the solo episode has and the room does not, or has in a simpler form (${l.pendekatan.length}).`, l.pendekatan);
  daftar('Text splits and compositions', `Script text that was moved, joined or trimmed by a mechanical rule; no sentence was rewritten (${l.pecahan.length}).`, l.pecahan);
  t('## Texts written by the converter');
  t('');
  t('The only player-facing sentences that are not from the script. For the Lead / PIC to confirm.');
  t('');
  t('| Key | Used for | id | en |');
  t('| --- | --- | --- | --- |');
  for (const x of l.teksKonverter) t(`| \`${x.kunci}\` | ${x.dipakai} | ${x.id} | ${x.en} |`);
  t('');
  t('## Longest text per kind against its limit');
  t('');
  t('| Kind | Limit | Longest | Language | Key |');
  t('| --- | --- | --- | --- | --- |');
  for (const u of l.ukuran) t(`| ${u.jenis} | ${u.batas} | ${u.panjang} | ${u.bahasa} | \`${u.kunci}\` |`);
  t('');
  t('## Validator warnings');
  t('');
  if (!l.validasi.peringatan.length) t('None.');
  for (const w of l.validasi.peringatan) t(`- \`${w.code}\`${w.round ? ` round ${w.round}` : ''} (\`${w.field}\`): ${w.message}`);
  t('');
  return baris.join('\n');
}

// ------------------------------------------------------------------ baris perintah

const dijalankanLangsung = !!process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (dijalankanLangsung) {
  const h = konversiEp2();
  const l = h.laporan;
  console.log(`Episode ${l.sumber.episode} v${l.sumber.versi} -> ${l.babak.length} babak x ${STORY_CHOICE_COUNT} pilihan; teks ${Object.entries(l.jumlahTeks).map(([b, n]) => `${b} ${n}`).join(', ')}; pendekatan ${l.pendekatan.length}, pecahan teks ${l.pecahan.length}.`);
  console.log(`Validasi: ${l.validasi.galat.length} galat, ${l.validasi.peringatan.length} peringatan. Hash konten ${l.hashKonten}.`);
  for (const g of l.validasi.galat) console.log(`  GALAT ${g.code} ${g.round ? `babak ${g.round} ` : ''}${g.field}: ${g.message}`);
  if (l.validasi.galat.length) {
    console.log('Validasi gagal: seed TIDAK ditulis.');
    process.exit(1);
  }
  const seed = sumberSeed(h);
  if (process.argv.includes('--cek')) {
    const ada = fs.existsSync(BERKAS_SEED) ? fs.readFileSync(BERKAS_SEED, 'utf8').replace(/\r\n/g, '\n') : null;
    const sama = ada === seed;
    console.log(sama ? `Seed mutakhir: ${path.relative(AKAR, BERKAS_SEED)}` : `SEED BASI: ${path.relative(AKAR, BERKAS_SEED)} bukan hasil konversi sekarang. Jalankan alat ini tanpa --cek.`);
    process.exit(sama ? 0 : 1);
  }
  fs.mkdirSync(path.dirname(BERKAS_LAPORAN), { recursive: true });
  fs.writeFileSync(BERKAS_SEED, seed);
  fs.writeFileSync(BERKAS_LAPORAN, sumberLaporan(h));
  console.log(`Ditulis: ${path.relative(AKAR, BERKAS_SEED)} dan ${path.relative(AKAR, BERKAS_LAPORAN)}`);
}
