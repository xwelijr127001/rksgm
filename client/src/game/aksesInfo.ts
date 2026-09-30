/**
 * AKSES INFO - jalur HTML untuk semua informasi misi, termasuk yang digambar di adegan 2D.
 *
 * Adegan boleh tidak interaktif (mode ringan ?adegan=ringan, engine gagal, masih memuat) atau
 * dibaca dengan pembaca layar. Karena itu setiap informasi yang bisa "diketuk" di adegan juga
 * harus bisa dibuka lewat kontrol HTML biasa:
 *  - checklist misi (mis. misi 3, objek "Folder laporan")  -> tombol "Lihat checklist"
 *  - kartu polis & tabel dokumen                            -> tombol "Dokumen"
 *  - objek adegan `role: 'doc'`                             -> dokumen HTML yang sama (disorot)
 *  - objek adegan `role: 'info'` (mis. kalender misi 7)     -> bagian "Catatan di adegan" di dialog dokumen
 *
 * Juga untuk adegan yang tidak interaktif:
 *  - `fxLangkah` + `kunciPetunjuk`: petunjuk "ketuk di gambar" HANYA bila adegan bisa diketuk DAN langkah itu
 *    punya objek pilihan/item di adegan; selain itu petunjuk memakai daftar (mis. aktivitas cerita polis)
 *  - `adeganBertanda`   : apakah pembahasan memberi tanda ✓ ✕ ! di adegan (legenda hanya bila ada tanda)
 *  - `gambarStatisDariSpec` + `lapisanStatis`: gambar statis mode ringan/engine gagal untuk aktivitas mode
 *    cerita disusun dari SceneSpec-nya sendiri (bukan gambar ringan lama misi latihan di lokasi yang sama)
 *
 * MURNI (tanpa React/Phaser/kamus) dan teruji (aksesInfo.test.ts) untuk SEMUA misi.
 * Tidak ada kunci jawaban di sini: yang dibaca hanya data publik misi & tata letak adegan.
 */

import type { Bahasa } from '@shared/bahasa';
import type { MissionPublic, StepDef } from '@shared/types';
import { WORLD_H, WORLD_W, type ActionFx, type ArtRef, type SceneObjectSpec, type SceneSpec } from './types';

/** Id dokumen checklist (refId objek doc "Folder laporan" di misi 3 & sorotan dialog). */
export const ID_CHECKLIST = 'checklist';

/** Keterangan objek `info` di adegan. `teks` = teks di berkas adegan (Indonesia) atau label objek. */
export interface InfoAdegan {
  objectId: string;
  refId: string;
  /** Nama objek seperti tertulis di adegan (sudah dalam bahasa spec). */
  label: string;
  teks: string;
}

/** Objek `doc` di adegan dan dokumen HTML padanannya. */
export interface DokAdegan {
  objectId: string;
  docId: string;
  label: string;
}

/** Tombol HTML pembuka dokumen. */
export type JenisTombol = 'checklist' | 'dokumen';

export interface AksesInfo {
  /** Misi punya checklist (daftar isi laporan). */
  checklist: boolean;
  /** Id kartu polis & tabel yang tampil di dialog dokumen. */
  dokumen: string[];
  /** Keterangan objek `info` di adegan, urut seperti di adegan. */
  info: InfoAdegan[];
  /** Objek `doc` di adegan yang dokumennya ada di HTML. */
  docAdegan: DokAdegan[];
  /** Objek `doc` di adegan TANPA padanan HTML (harus kosong; dijaga tes). */
  yatim: string[];
  /** Tampilkan tombol "Lihat checklist" (baris alat, kepala baki, briefing). */
  tombolChecklist: boolean;
  /** Tampilkan tombol "Dokumen" (kartu polis, tabel, atau catatan di adegan). */
  tombolDokumen: boolean;
}

/** Semua id dokumen HTML yang bisa disorot: kartu polis, tabel, dan checklist. */
export function idDokumenHtml(mission: MissionPublic): Set<string> {
  const ids = new Set<string>();
  for (const c of mission.policyCards ?? []) ids.add(c.id);
  for (const tb of mission.tables ?? []) ids.add(tb.id);
  if (mission.checklist?.length) ids.add(ID_CHECKLIST);
  return ids;
}

/** Kontrol HTML yang diperlukan misi ini (spec = null untuk misi bergambar / tanpa adegan). */
export function aksesInfo(mission: MissionPublic, spec: SceneSpec | null): AksesInfo {
  const html = idDokumenHtml(mission);
  const dokumen = [...(mission.policyCards ?? []).map((c) => c.id), ...(mission.tables ?? []).map((tb) => tb.id)];
  const info: InfoAdegan[] = [];
  const docAdegan: DokAdegan[] = [];
  const yatim: string[] = [];
  for (const o of spec?.objects ?? []) {
    if (o.role === 'info') {
      const teks = (o.info ?? o.label).trim();
      if (teks) info.push({ objectId: o.id, refId: o.refId, label: o.label, teks });
      else yatim.push(o.id);
    } else if (o.role === 'doc') {
      if (html.has(o.refId)) docAdegan.push({ objectId: o.id, docId: o.refId, label: o.label });
      else yatim.push(o.id);
    }
  }
  const checklist = Boolean(mission.checklist?.length);
  return {
    checklist,
    dokumen,
    info,
    docAdegan,
    yatim,
    tombolChecklist: checklist,
    tombolDokumen: dokumen.length > 0 || info.length > 0,
  };
}

/**
 * Tombol HTML yang membuka dokumen `docId` (untuk mengembalikan fokus setelah dokumen dibuka dari
 * ketukan kanvas). 'semua' = tombol Dokumen bila ada, selain itu checklist.
 */
export function tombolUntuk(akses: AksesInfo, docId: string): JenisTombol | null {
  if (docId === ID_CHECKLIST) return akses.tombolChecklist ? 'checklist' : akses.tombolDokumen ? 'dokumen' : null;
  if (akses.tombolDokumen) return 'dokumen';
  return akses.tombolChecklist ? 'checklist' : null;
}

/** Teks adegan boleh berbaris ("Tanggal kejadian:\n05 Sep 2026"); di HTML cukup satu baris. */
export function teksSebaris(s: string): string {
  return s.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

/** Penerjemah dengan bentuk t() (client/src/i18n); parameter supaya modul ini tetap murni. */
export type Penerjemah = (kunci: string, param?: Record<string, string | number>) => string;

/**
 * Keterangan objek info dalam bahasa aktif. Teks Indonesia = teks di berkas adegan; terjemahannya di
 * kamus misi.info.<idMisi>.<idObjek>. Tanpa terjemahan = teks spec (objek tanpa `info` memakai label,
 * dan label sudah diterjemahkan lewat scenes/label*.ts).
 */
export function teksInfoAdegan(missionId: string, objectId: string, asli: string, bahasa: Bahasa, tr: Penerjemah): string {
  if (bahasa === 'id') return teksSebaris(asli);
  const kunci = `misi.info.${missionId}.${objectId}`;
  const teks = tr(kunci);
  return teksSebaris(teks === kunci ? asli : teks);
}

// ------------------------------------------------------------------ objek adegan per langkah

/** Langkah pemilik objek (sama dengan draft.ts stepIdsOf; disalin supaya modul ini tetap tanpa dependensi). */
function langkahObjek(o: SceneObjectSpec): string[] {
  return o.stepIds?.length ? o.stepIds : o.stepId ? [o.stepId] : [];
}

// ------------------------------------------------------------------ petunjuk mekanik

/**
 * Efek ketukan objek PILIHAN/ITEM milik langkah ini di adegan. null = langkah ini tidak punya objek adegan
 * yang bisa dipakai menjawab (mis. aktivitas cerita 'cerita-auto1-polis' yang hanya punya kartu dokumen,
 * misi 7 yang polisnya ada di dialog dokumen): jawabannya hanya lewat daftar HTML.
 */
export function fxLangkah(spec: SceneSpec | null, stepId: string): ActionFx | null {
  const o = spec?.objects.find((x) => langkahObjek(x).includes(stepId) && (x.role === 'option' || x.role === 'item'));
  return o?.fx ?? null;
}

/**
 * Kunci kamus petunjuk satu kalimat untuk langkah ini (misi.petunjuk*; teksnya di kamus/misi.ts).
 * Petunjuk yang meminta mengetuk gambar HANYA bila adegan bisa diketuk (`adeganAktif`) DAN langkah itu punya
 * objek pilihan/item di adegan (`fx`, dari fxLangkah); selain itu mekanik daftar. Pemain tidak pernah disuruh
 * mengetuk gambar yang tidak bisa dipakai menjawab (temuan review A, pola yang sama di aktivitas cerita polis).
 */
export function kunciPetunjuk(step: StepDef, fx: ActionFx | null, adeganAktif: boolean, bergambar = false): string {
  // Misi bergambar: tidak ada dokumen/papan di adegan; sumbernya gambar itu sendiri.
  if (bergambar && step.kind === 'number') return 'misi.petunjukAngkaGambar';
  const ketuk = adeganAktif && fx !== null;
  // Pertanyaan sudah menyebut jumlahnya; petunjuk cukup menjelaskan mekaniknya (tidak mengulang).
  if (step.kind === 'multi') {
    if (!ketuk) return 'misi.petunjukMultiDaftar';
    if (fx === 'photo') return 'misi.petunjukMultiFoto';
    if (fx === 'file') return 'misi.petunjukMultiFolder';
    return 'misi.petunjukMultiCatat';
  }
  if (step.kind === 'single') return ketuk ? 'misi.petunjukSingleAdegan' : 'misi.petunjukSingleDaftar';
  if (step.kind === 'assign') return ketuk ? 'misi.petunjukAssignAdegan' : 'misi.petunjukAssignDaftar';
  if (step.kind === 'number') return 'misi.petunjukAngka';
  return 'misi.petunjukUrut';
}

/** Kunci petunjuk yang meminta pemain mengetuk gambar (hanya sah bila langkahnya punya objek di adegan). */
export const PETUNJUK_KETUK_GAMBAR: ReadonlySet<string> = new Set([
  'misi.petunjukMultiFoto', 'misi.petunjukMultiFolder', 'misi.petunjukMultiCatat', 'misi.petunjukSingleAdegan', 'misi.petunjukAssignAdegan',
]);

// ------------------------------------------------------------------ tanda pembahasan di adegan

/**
 * Pembahasan memberi tanda ✓ ✕ ! di adegan hanya pada objek PILIHAN (langkah single/multi) dan ITEM
 * (langkah assign) milik misi ini (draft.ts objectStates). Adegan tanpa objek seperti itu - mis. aktivitas
 * cerita 'cerita-auto1-polis' yang hanya punya kartu dokumen, atau papan angka misi hitung - tidak punya
 * tanda, jadi legenda tanda tidak ditampilkan.
 */
export function adeganBertanda(mission: MissionPublic, spec: SceneSpec | null): boolean {
  if (!spec) return false;
  const jenis = new Map(mission.steps.map((s) => [s.id, s.kind] as const));
  return spec.objects.some((o) => langkahObjek(o).some((id) => {
    const k = jenis.get(id);
    return (o.role === 'option' && (k === 'single' || k === 'multi')) || (o.role === 'item' && k === 'assign');
  }));
}

// ------------------------------------------------------------------ gambar statis dari SceneSpec

/**
 * Gambar ringan lama (art/Scene.tsx) digambar per LOKASI untuk misi latihan & acara. Aktivitas mode cerita
 * (misi sintetis 'cerita-*', docs/rancangan-mode-cerita.md 3.2) memakai lokasi yang sama tetapi isinya lain
 * (parkiran lama = "MOBIL NASABAH" misi 1), jadi mode ringan / engine gagal / memuat memakai gambar statis yang
 * disusun dari SceneSpec aktivitas itu sendiri (tanpa spec: bingkai netral berjudul). Misi lain tidak berubah.
 */
export function gambarStatisDariSpec(missionId: string): boolean {
  return missionId.startsWith('cerita-');
}

/** Satu gambar di gambar statis, dalam koordinat dunia (640 x 480). */
export interface LapisanStatis {
  kunci: string;
  /** SVG lengkap berukuran w x h (penanda ukuran __W__/__H__ sudah diganti). */
  svg: string;
  /** Pojok kiri atas. */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Label nama objek (pil seperti di engine), titik tengah & lebar perkiraan dalam koordinat dunia. */
export interface LabelStatis {
  kunci: string;
  teks: string;
  x: number;
  y: number;
  w: number;
}

/** Ukuran huruf & tinggi pil label (sama dengan engine: teks 20 tebal, pil 34). */
export const LABEL_STATIS = { huruf: 20, tinggi: 34 } as const;

/** Perkiraan lebar pil label (teks + 20): aksara CJK selebar satu huruf penuh, huruf Latin ~0,58 em. */
export function lebarLabelStatis(teks: string, huruf: number = LABEL_STATIS.huruf): number {
  let em = 0;
  for (const c of teks) em += /[⺀-鿿豈-﫿＀-￯]/.test(c) ? 1 : /[A-Z0-9MW&]/.test(c) ? 0.66 : c === ' ' ? 0.3 : 0.56;
  return Math.ceil(em * huruf + 20);
}

const svgBerukuran = (a: ArtRef): string => a.svg.replace('__W__', String(a.w)).replace('__H__', String(a.h));

/**
 * Susunan gambar statis dari SceneSpec, sama dengan susunan engine (MissionScene): latar memenuhi dunia,
 * hiasan (bawaan kedalaman 5) & objek (bawaan 20) berpusat di (x, y) dan diurutkan menurut kedalaman
 * (stabil), lalu label objek di atas semuanya. Petugas (hero) tidak digambar: bentuknya bergantung profil.
 */
export function lapisanStatis(spec: SceneSpec): { latar: LapisanStatis; lapisan: LapisanStatis[]; label: LabelStatis[] } {
  const latar: LapisanStatis = { kunci: 'latar', svg: svgBerukuran(spec.background), x: 0, y: 0, w: WORLD_W, h: WORLD_H };
  const calon = [
    ...(spec.props ?? []).map((p) => ({ id: 'hiasan:' + p.id, art: p.art, x: p.x, y: p.y, d: p.depth ?? 5 })),
    ...spec.objects.map((o) => ({ id: 'objek:' + o.id, art: o.art, x: o.x, y: o.y, d: o.depth ?? 20 })),
  ];
  const lapisan = calon
    .map((c, i) => ({ c, i }))
    .sort((a, b) => a.c.d - b.c.d || a.i - b.i)
    .map(({ c }) => ({ kunci: c.id, svg: svgBerukuran(c.art), x: c.x - c.art.w / 2, y: c.y - c.art.h / 2, w: c.art.w, h: c.art.h }));
  const label = spec.objects
    .filter((o) => o.label.trim())
    .map((o) => {
      const w = lebarLabelStatis(o.label);
      // Pil tetap di dalam adegan (engine: jepitX).
      const x = Math.min(WORLD_W - w / 2 - 4, Math.max(w / 2 + 4, o.x + (o.labelDx ?? 0)));
      return { kunci: o.id, teks: o.label, x, y: o.y + o.art.h / 2 + 18 + (o.labelDy ?? 0), w };
    });
  return { latar, lapisan, label };
}
