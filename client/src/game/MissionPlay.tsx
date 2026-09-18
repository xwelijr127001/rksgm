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
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { MissionAnswer, MissionPublic, MissionReveal, OptionDef, PlayerLook, StepAnswer, StepDef } from '@shared/types';
import { TOKOH } from '@shared/brand';
import { formatRupiah } from '@shared/scoring';
import { Icon } from '../art/Icon';
import { Raki } from '../art/Raki';
import { playSfx } from '../audio/audio';
import { useReducedMotion } from '../hooks';
import { DocTableView, Modal, PolicyCardView } from '../ui/kit';
import {
  asList, asNumber, asRecord, asText, assignItem, chooseSingle, missingParts, missionStarted, resolveTap,
  stepComplete, stepIdsOf, stepStarted, toggleMulti, unassignItem, urutanTampil, type Change,
} from './draft';
import { GameStage, type StageApi, type StageStatus } from './GameStage';
import { JUDUL_HASIL, nilaiMisi, statusMisi, type BarisHasil, type HasilLangkah } from './hasil';
import { PotretTokoh } from './KarakterTokoh';
import { sceneFor } from './scenes';
import type { ActionFx, SceneSpec, StageMode, StageStats, StageView } from './types';
import './stage.css';

export type SubmitState = 'idle' | 'sending' | 'sent' | 'failed';

/** Bantuan untuk panel non-menjawab (briefing, terkirim, pembahasan, jeda). */
export interface PanelBantu {
  bukaDokumen: (id?: string) => void;
  /** Gulir ke adegan (di HP adegan berada di bawah hasil saat pembahasan). */
  lihatAdegan: () => void;
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
}

// ------------------------------------------------------------------ teks bantu

const JUDUL_BAKI: Record<ActionFx, string> = {
  photo: 'Album bukti',
  file: 'Folder laporan',
  note: 'Catatan temuan',
  talk: 'Catatan temuan',
  choose: 'Pilihanmu',
  stamp: 'Pilihanmu',
  tag: 'Pilihanmu',
};

function fxLangkah(spec: SceneSpec | null, stepId: string): ActionFx | null {
  const o = spec?.objects.find((x) => stepIdsOf(x).includes(stepId) && (x.role === 'option' || x.role === 'item'));
  return o?.fx ?? null;
}

/** Satu kalimat petunjuk: apa yang diketuk dan bahwa pilihan masih bisa diganti. */
function petunjuk(step: StepDef, fx: ActionFx | null, adeganAktif: boolean): string {
  // Pertanyaan sudah menyebut jumlahnya; petunjuk cukup menjelaskan mekaniknya (tidak mengulang).
  if (step.kind === 'multi') {
    if (!adeganAktif) return 'Pilih dari daftar. Ketuk lagi untuk membatalkan.';
    if (fx === 'photo') return 'Ketuk benda di gambar: fotonya masuk Album bukti. Ketuk lagi untuk membatalkan.';
    if (fx === 'file') return 'Ketuk dokumen di gambar: masuk Folder laporan. Ketuk lagi untuk mengeluarkan.';
    return 'Ketuk bagian gambar: temuan masuk Catatan temuan. Ketuk lagi untuk membatalkan.';
  }
  if (step.kind === 'single') return adeganAktif ? 'Ketuk satu di gambar atau pilih dari daftar. Masih bisa diganti.' : 'Pilih satu dari daftar. Masih bisa diganti.';
  if (step.kind === 'assign') {
    return adeganAktif && fx ? 'Pilih satu bagian, lalu tentukan kategorinya. Masih bisa diganti.' : 'Untuk tiap bagian, pilih kategori yang sesuai.';
  }
  if (step.kind === 'number') return 'Baca dokumennya, lalu ketuk angka yang sesuai.';
  return 'Susun urutannya.';
}

function labelDari(opsi: OptionDef[], id: string): string {
  return opsi.find((o) => o.id === id)?.label ?? id;
}

function teksAngka(step: Extract<StepDef, { kind: 'number' }>, n: number): string {
  return step.format === 'rupiah' ? formatRupiah(n) : `${n}${step.unit ? ' ' + step.unit : ''}`;
}

/** Ringkasan jawaban satu langkah dalam bahasa sehari-hari. */
export function ringkas(step: StepDef, v: StepAnswer | undefined): string {
  if (step.kind === 'single') return asText(v) ? labelDari(step.options, asText(v)) : 'Belum dipilih';
  if (step.kind === 'multi') {
    const l = asList(v);
    return l.length ? l.map((id) => labelDari(step.options, id)).join(' · ') : 'Belum dipilih';
  }
  if (step.kind === 'assign') {
    const peta = asRecord(v);
    const baris = step.items.filter((i) => peta[i.id]).map((i) => `${i.label}: ${labelDari(step.buckets, peta[i.id]!)}`);
    return baris.length ? baris.join(' · ') : 'Belum dipilih';
  }
  if (step.kind === 'number') {
    const n = asNumber(v);
    return n === null ? 'Belum diisi' : teksAngka(step, n);
  }
  return asList(v).map((id) => labelDari(step.items, id)).join(' → ') || 'Belum diisi';
}

function layarPendek(): boolean {
  try { return window.matchMedia('(max-height: 540px)').matches; } catch { return false; }
}

/** Misi hitung butuh ruang membaca & menjawab; misi mencari bukti butuh ruang adegan. */
function fokusMisi(mission: MissionPublic): 'baca' | 'adegan' {
  return mission.steps.some((s) => s.kind === 'number') ? 'baca' : 'adegan';
}

// ------------------------------------------------------------------ komponen utama

export function MissionPlay(props: MissionPlayProps) {
  const { mission, roundIndex, look, mode, answer, onAnswer, onSubmit, reveal = null } = props;
  const submitState = props.submitState ?? 'idle';
  const online = props.online ?? true;
  const reduced = useReducedMotion();
  const spec = useMemo(() => sceneFor(mission), [mission]);
  const [cursor, setCursor] = useState(0);
  const [fokusItem, setFokusItem] = useState<Record<string, string>>({});
  const [umumkan, setUmumkan] = useState('');
  const [pesan, setPesan] = useState('');
  const [ceritaBuka, setCeritaBuka] = useState(() => !props.sudahBriefing && !layarPendek());
  const [bantuanBuka, setBantuanBuka] = useState(Boolean(props.bantuanAwal));
  const [dokumen, setDokumenState] = useState<string | null>(null);
  const dokumenDibuka = useRef(0);
  const setDokumen = useCallback((id: string | null) => { if (id) dokumenDibuka.current = performance.now(); setDokumenState(id); }, []);
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
  const adeganAktif = status === 'ready';
  const punyaDokumen = Boolean(mission.policyCards?.length || mission.tables?.length);

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

  // Kelola fokus saat tahap berganti: judul tahap baru mendapat fokus & terlihat.
  const fokusKe = useCallback((el: HTMLElement | null | undefined) => {
    if (!el) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  }, [reduced]);
  const modeLama = useRef(mode);
  useEffect(() => {
    if (modeLama.current === mode) return;
    const dari = modeLama.current;
    modeLama.current = mode;
    // Jeda & lanjut dari jeda: tempat pemain tidak dipindah (layout tetap sama, hanya terkunci).
    if (mode === 'paused' || dari === 'paused') return;
    // Setelah render panel baru.
    requestAnimationFrame(() => fokusKe(mode === 'play' ? tanyaRef.current : panelRef.current?.querySelector<HTMLElement>('h2')));
  }, [mode, fokusKe]);
  const cursorLama = useRef(cursor);
  useEffect(() => {
    if (cursorLama.current === cursor) return;
    cursorLama.current = cursor;
    setPesan('');
    requestAnimationFrame(() => fokusKe(tanyaRef.current));
  }, [cursor, fokusKe]);

  const terapkan = useCallback((c: Change, objectId?: string) => {
    if (c.kind === 'unchanged') return;
    const s = mission.steps.find((x) => x.id === c.stepId);
    if (c.kind === 'full') {
      const judul = JUDUL_BAKI[fxLangkah(spec, c.stepId) ?? 'choose'];
      const t = `${judul} sudah penuh (${c.max} dari ${c.max}). Batalkan satu dulu kalau mau mengganti.`;
      setUmumkan(t);
      setPesan(t);
      playSfx('tik');
      if (spec && s) api.current?.highlight(spec.objects.filter((o) => o.stepId === s.id && asList(answerRef.current[s.id]).includes(o.refId)).map((o) => o.id));
      void objectId;
      return;
    }
    setPesan('');
    onAnswer(c.stepId, c.value);
    if (!s) return;
    if (c.kind === 'added' && s.kind === 'multi') {
      const judul = JUDUL_BAKI[fxLangkah(spec, s.id) ?? 'choose'];
      setUmumkan(`${labelDari(s.options, c.refId)} masuk ${judul.toLowerCase()} (${c.count} dari ${c.max}).`);
      playSfx('bukti');
    } else if (c.kind === 'removed' && s.kind === 'multi') {
      setUmumkan(`${labelDari(s.options, c.refId)} dibatalkan (${c.count} dari ${c.max}).`);
      playSfx('pilih');
    } else if (c.kind === 'chosen' && s.kind === 'single') {
      setUmumkan(`Pilihanmu: ${labelDari(s.options, c.refId)}. Tersimpan, belum dikirim.`);
      playSfx('pilih');
    } else if (c.kind === 'chosen' && s.kind === 'number' && typeof c.value === 'number') {
      setUmumkan(`Jawabanmu: ${teksAngka(s, c.value)}.`);
      playSfx('pilih');
    } else if (c.kind === 'assigned' && s.kind === 'assign') {
      setUmumkan(`${labelDari(s.items, c.itemId)}: ${labelDari(s.buckets, c.bucketId)}.`);
      playSfx('bukti');
      // Lanjut otomatis ke bagian berikutnya yang belum dipilih.
      const peta = asRecord(c.value);
      const berikut = s.items.find((i) => !peta[i.id]);
      if (berikut) setFokusItem((f) => ({ ...f, [s.id]: berikut.id }));
    } else if (c.kind === 'unassigned' && s.kind === 'assign') {
      setUmumkan(`${labelDari(s.items, c.itemId)} dikosongkan.`);
      playSfx('pilih');
    }
  }, [mission, onAnswer, spec]);

  const ketukAdegan = useCallback((objectId: string) => {
    if (!spec) return;
    const v = viewRef.current;
    const r = resolveTap(mission, spec, v, objectId);
    if (r.kind === 'change') terapkan(r.change, objectId);
    else if (r.kind === 'focusItem') {
      const s = mission.steps.find((x) => x.id === r.stepId);
      setFokusItem((f) => ({ ...f, [r.stepId]: r.itemId }));
      if (s && s.kind === 'assign') setUmumkan(`${labelDari(s.items, r.itemId)} dipilih. Sekarang tentukan kategorinya.`);
      playSfx('pilih');
    } else if (r.kind === 'needItem') {
      const t = 'Pilih dulu bagian yang mau ditandai, lalu kategorinya.';
      setUmumkan(t);
      setPesan(t);
      api.current?.highlight(spec.objects.filter((o) => o.stepId === r.stepId && o.role === 'item').map((o) => o.id));
    } else if (r.kind === 'openDoc') {
      setDokumen(r.docId);
      playSfx('pilih');
    } else if (r.kind === 'info') {
      // Keterangan tampil di panel HTML, bukan balon di adegan (tidak menutupi objek).
      setUmumkan(r.text);
      setPesan(r.text);
      playSfx('tik');
    } else if (r.reason === 'other-step') {
      const t = 'Benda itu untuk pertanyaan lain. Pakai tombol Lanjut atau Kembali di bawah.';
      setUmumkan(t);
      setPesan(t);
    }
  }, [mission, spec, terapkan, setDokumen]);

  function kirim(): void {
    if (!onSubmit || submitState === 'sending' || !online) return;
    const kurang = missingParts(mission, answerRef.current);
    if (kurang.length && missionStarted(mission, answerRef.current)) {
      setKonfirmasi(kurang);
      return;
    }
    onSubmit();
  }

  const bolehKirim = mode === 'play' && missionStarted(mission, answer) && submitState !== 'sending' && online;
  const fx = fxLangkah(spec, step.id);
  const sisa = props.remainingMs ?? null;
  const bantu: PanelBantu = {
    bukaDokumen: (id) => setDokumen(id ?? 'semua'),
    lihatAdegan: () => adeganRef.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' }),
  };
  const pemandu = mission.id === 'tutorial' || !TOKOH.missRaksa.aktif ? 'raki' : 'missRaksa';
  // Jeda memakai tata letak menjawab (tidak melompat), kontrol dikunci.
  const menjawab = mode === 'play' || mode === 'paused';
  const panelLuar = typeof props.panel === 'function' ? props.panel(bantu) : props.panel;
  const ketAksi = !terakhir
    ? (stepStarted(step, answer[step.id]) ? 'Tersimpan. Bisa diubah lagi nanti.' : 'Jawab dulu, lalu lanjut.')
    : !missionStarted(mission, answer) ? 'Isi jawaban dulu, lalu kirim.' : 'Belum dikirim. Setelah dikirim tidak bisa diubah.';

  return (
    <div ref={akar} className={`misi misi-${mode}`} data-mode={mode} data-fokus={fokusMisi(mission)}>
      {menjawab ? (
        <header className="misi-tugas">
          {mission.steps.length > 1 ? (
            <div className="misi-langkah" aria-label={`Pertanyaan ${cursor + 1} dari ${mission.steps.length}`}>
              <span>Pertanyaan {cursor + 1} dari {mission.steps.length}</span>
              <div aria-hidden="true">{mission.steps.map((s, i) => <i key={s.id} className={(i === cursor ? 'kini ' : '') + (stepComplete(s, answer[s.id]) ? 'terisi' : '')} />)}</div>
            </div>
          ) : null}
          <div className="tugas-inti">
            <span className="tugas-pemandu" aria-hidden="true">
              {pemandu === 'raki' ? <Raki size={44} mood="sapa" /> : <PotretTokoh tokoh="missRaksa" ukuran={44} />}
            </span>
            <div>
              <h2 ref={tanyaRef} id="misi-tanya" className="misi-tanya">{step.prompt}</h2>
              <p className="misi-petunjuk">{petunjuk(step, fx, adeganAktif)}</p>
            </div>
          </div>
          <div className="tugas-alat">
            <button type="button" className="alat" aria-expanded={ceritaBuka} aria-controls="misi-cerita" onClick={() => setCeritaBuka((b) => !b)}>
              <Icon name="daftar" size={17} /> Cerita
            </button>
            {punyaDokumen ? (
              <button type="button" className="alat" onClick={() => setDokumen('semua')}>
                <Icon name="polis" size={17} /> Dokumen
              </button>
            ) : null}
            <button type="button" className="alat" aria-expanded={bantuanBuka} aria-controls="misi-bantuan" onClick={() => setBantuanBuka((b) => !b)}>
              <Icon name="tanya" size={17} /> Cara main
            </button>
          </div>
          {ceritaBuka ? <p id="misi-cerita" className="tugas-cerita"><b>Kasus:</b> {mission.story}</p> : null}
          {bantuanBuka ? <div id="misi-bantuan"><CaraMain mission={mission} langkah={step} onTutup={() => setBantuanBuka(false)} /></div> : null}
        </header>
      ) : null}

      <div ref={adeganRef} className="misi-adegan">
        {mode === 'reveal' ? <p className="adegan-judul">Adegan dengan tanda pembahasan</p> : null}
        <GameStage
          key={`${mission.id}:${roundIndex}:${props.sceneNonce ?? 0}`}
          mission={mission}
          spec={spec}
          roundIndex={roundIndex}
          look={look}
          view={view}
          onTap={ketukAdegan}
          apiRef={api}
          label={`Adegan ${mission.location}`}
          onStatus={(s, st) => { setStatus(s); props.onSceneStatus?.(s, st); }}
        />
        {status === 'failed' ? (
          <p className="adegan-catatan" role="status">Gambar interaktif tidak bisa tampil di perangkat ini. Tenang, kamu tetap bisa menjawab lewat daftar pilihan.</p>
        ) : null}
      </div>

      <section ref={panelRef} className="misi-panel" aria-label={menjawab ? 'Jawabanmu' : 'Status misi'}>
        {!menjawab ? panelLuar : (
          <>
            {/* Jeda: pemberitahuan di atas pilihan; pilihan tetap terlihat tetapi terkunci. */}
            {mode === 'paused' ? panelLuar : null}
            <StatusPilihan step={step} value={answer[step.id]} />
            <KontrolLangkah
              key={step.id}
              step={step}
              seed={mission.id + ':' + step.id}
              value={answer[step.id]}
              fx={fx}
              adeganAktif={adeganAktif}
              itemAktif={itemAktif}
              onFokusItem={(id) => setFokusItem((f) => ({ ...f, [step.id]: id }))}
              terapkan={(c) => terapkan(c)}
              disabled={submitState === 'sending' || mode === 'paused'}
            />
            <p className="sr-only" aria-live="polite">{umumkan}</p>
            {pesan ? <p className="misi-pesan" role="status"><Icon name="tanya" size={18} /><span>{pesan}</span></p> : null}
            {props.submitError && submitState === 'failed' ? (
              <div className="misi-gagal" role="alert">
                <Icon name="silang" size={20} />
                <div><strong>Laporan belum terkirim.</strong><br />{props.submitError} Periksa koneksi, lalu tekan <b>Kirim lagi</b>.</div>
              </div>
            ) : null}
          </>
        )}
      </section>

      {mode === 'play' ? (
        <div className="misi-aksi">
          <div className="aksi-baris">
            {cursor > 0 ? (
              <button type="button" className="aksi-kembali" onClick={() => setCursor((c) => c - 1)} aria-label="Pertanyaan sebelumnya">
                <Panah balik />
              </button>
            ) : null}
            {!terakhir ? (
              <button type="button" className="primary-action" disabled={!stepStarted(step, answer[step.id])} onClick={() => setCursor((c) => c + 1)}>
                Lanjut ke pertanyaan {cursor + 2} <Panah />
              </button>
            ) : (
              <button type="button" className="primary-action" disabled={!bolehKirim} onClick={kirim} aria-describedby="misi-kirim-ket">
                {!online ? 'Menunggu koneksi…' : submitState === 'sending' ? 'Mengirim…' : submitState === 'failed' ? 'Kirim lagi' : (props.submitLabel ?? 'Kirim laporan')}
                {submitState === 'sending' ? <i className="adegan-spinner terang" aria-hidden="true" /> : <Panah />}
              </button>
            )}
          </div>
          <div className="aksi-ket">
            <span id="misi-kirim-ket">{ketAksi}</span>
            {!terakhir && !stepStarted(step, answer[step.id]) ? <button type="button" className="text-button" onClick={() => setCursor((c) => c + 1)}>Lewati dulu</button> : null}
            {!terakhir && sisa !== null && sisa < 10000 && missionStarted(mission, answer) ? (
              <button type="button" className="text-button tegas" onClick={kirim}>Waktu hampir habis, kirim sekarang</button>
            ) : null}
          </div>
        </div>
      ) : null}

      {dokumen ? (
        <Modal judul="Dokumen kasus" onTutup={() => {
          // Klik "hantu" dari ketukan layar sentuh yang membuka dokumen tidak boleh langsung menutupnya.
          if (performance.now() - dokumenDibuka.current < 500) return;
          setDokumen(null);
        }}>
          <div className="dokumen-isi">
            {mission.policyCards?.map((c) => <div key={c.id} className={dokumen === c.id ? 'dokumen-sorot' : ''}><PolicyCardView card={c} aktif={dokumen === c.id} /></div>)}
            {mission.tables?.map((t) => <div key={t.id} className={dokumen === t.id ? 'dokumen-sorot' : ''}><DocTableView table={t} /></div>)}
            {mission.checklist?.length ? (
              <div className={'panel-krem' + (dokumen === 'checklist' ? ' dokumen-sorot' : '')}>
                <strong>Daftar isi laporan awal</strong>
                <ul>{mission.checklist.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}

      {konfirmasi ? (
        <Modal
          judul="Kirim sekarang?"
          onTutup={() => setKonfirmasi(null)}
          aksi={<>
            <button type="button" className="btn btn-netral" onClick={() => setKonfirmasi(null)}>Periksa lagi</button>
            <button type="button" className="btn btn-utama" onClick={() => { setKonfirmasi(null); onSubmit?.(); }}>Kirim sekarang</button>
          </>}
        >
          <p>Masih ada yang belum lengkap:</p>
          <ul className="konfirmasi-daftar">{konfirmasi.map((k) => <li key={k}>{k}</li>)}</ul>
          <p className="kecil lembut">Bagian yang kosong tidak mendapat poin. Setelah dikirim, jawaban tidak bisa diubah.</p>
        </Modal>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ status pilihan

/** "Apakah pilihan saya sudah tercatat?" dijawab tepat di bawah adegan. */
function StatusPilihan({ step, value }: { step: StepDef; value: StepAnswer | undefined }) {
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
          <span className="pilihan-teks"><span className="pilihan-label">Kemajuan</span> <b>0 dari {step.items.length} bagian ditandai</b></span>
        </p>
      );
    }
    isi = `${n} dari ${step.items.length} bagian ditandai`;
  }
  return isi ? (
    <p className="pilihan-status terisi">
      <span className="pilihan-ikon" aria-hidden="true"><Icon name="cek" size={16} /></span>
      <span className="pilihan-teks"><span className="pilihan-label">{step.kind === 'assign' ? 'Kemajuan' : 'Pilihanmu'}</span> <b>{isi}</b></span>
      <span className="pilihan-chip">Tersimpan</span>
    </p>
  ) : (
    <p className="pilihan-status">
      <span className="pilihan-ikon pilihan-ikon-belum" aria-hidden="true" />
      <span className="pilihan-teks"><span className="pilihan-label">Pilihanmu</span> <b>Belum ada</b></span>
    </p>
  );
}

// ------------------------------------------------------------------ cara main (bantuan)

type Mekanik = 'foto' | 'folder' | 'catat' | 'pilih' | 'kelompok' | 'angka';

const CARA: Record<Mekanik, { judul: string; teks: string; hasil: string }> = {
  foto: { judul: 'Kamera bukti', teks: 'Ketuk benda di gambar untuk memotretnya. Fotonya masuk Album bukti. Salah pilih? Ketuk lagi.', hasil: 'Masuk album' },
  folder: { judul: 'Folder laporan', teks: 'Ketuk dokumen di gambar untuk memasukkannya ke folder. Ketuk lagi untuk mengeluarkan.', hasil: 'Masuk folder' },
  catat: { judul: 'Catatan temuan', teks: 'Ketuk bagian gambar yang memberi informasi. Temuan masuk catatan. Ketuk lagi untuk batal.', hasil: 'Dicatat' },
  pilih: { judul: 'Ambil keputusan', teks: 'Pilih satu jawaban. Masih bisa diganti sebelum kamu menekan Kirim.', hasil: 'Dipilih' },
  kelompok: { judul: 'Kelompokkan', teks: 'Pilih satu bagian, lalu tentukan kategorinya. Setelah itu lanjut otomatis ke bagian berikutnya.', hasil: 'Ditandai' },
  angka: { judul: 'Hitung & isi angka', teks: 'Baca dokumennya, lalu ketuk angka yang sesuai. Jawabanmu muncul di papan.', hasil: 'Tercatat' },
};

export function mekanikLangkah(step: StepDef, spec: SceneSpec | null): Mekanik {
  if (step.kind === 'number') return 'angka';
  if (step.kind === 'assign') return 'kelompok';
  if (step.kind === 'single') return 'pilih';
  const fx = fxLangkah(spec, step.id);
  return fx === 'photo' ? 'foto' : fx === 'file' ? 'folder' : fx ? 'catat' : 'pilih';
}

/**
 * Contoh singkat mekanik ("ketuk -> tercatat -> bisa dibatalkan").
 * Saat menjawab: hanya untuk langkah yang sedang dikerjakan, dibuka lewat "Cara main".
 * Saat briefing: semua mekanik misi, sebelum adegan bisa disentuh.
 */
export function CaraMain({ mission, langkah, onTutup }: { mission: MissionPublic; langkah?: StepDef; onTutup?: () => void }) {
  const spec = useMemo(() => sceneFor(mission), [mission]);
  const daftar = useMemo(() => [...new Set((langkah ? [langkah] : mission.steps).map((s) => mekanikLangkah(s, spec)))], [mission, spec, langkah]);
  return (
    <div className="cara-main" role="note" aria-label="Cara main">
      {daftar.slice(0, 2).map((m) => (
        <div key={m} className="cara-baris">
          <div className="cara-demo" aria-hidden="true">
            <span className="cara-benda" /><span className="cara-jari" /><span className="cara-chip">{CARA[m].hasil}</span>
          </div>
          <div><strong>{CARA[m].judul}</strong><p>{CARA[m].teks}</p></div>
        </div>
      ))}
      {onTutup ? <button type="button" className="text-button" onClick={onTutup}>Tutup bantuan</button> : null}
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

const KATA_STATUS: Record<HasilLangkah['status'], string> = { tepat: 'Tepat', sebagian: 'Sebagian tepat', belum: 'Belum tepat', kosong: 'Tidak dijawab' };

function Alasan({ teks }: { teks: string }) {
  // Kalimat pertama langsung terbaca; sisanya bisa dibuka bila panjang.
  const m = teks.match(/^(.+?[.!?])\s+(.+)$/s);
  if (!m || teks.length < 170) return <p className="hasil-alasan"><b>Kenapa?</b> {teks}</p>;
  return (
    <div className="hasil-alasan">
      <p><b>Kenapa?</b> {m[1]}</p>
      <details><summary>Baca selengkapnya</summary><p>{m[2]}</p></details>
    </div>
  );
}

function BarisPilihan({ b }: { b: BarisHasil }) {
  return (
    <li className={'hb hb-' + b.tanda}>
      <TandaIkon jenis={b.tanda === 'tepat' ? 'tepat' : 'salah'} />
      <span className="hb-teks">{b.teks}</span>
      <span className="hb-kata">{b.tanda === 'tepat' ? 'Tepat' : 'Belum tepat'}</span>
    </li>
  );
}

/**
 * Hasil misi: status → pilihan pemain → langkah yang tepat → alasan → tindakan berikutnya.
 * Status per langkah dihitung dengan aturan yang sama dengan server (hasil.ts).
 */
export function HasilMisi({ mission, reveal, answer, akurasi, dijawab, poin = null, keterangan, aksi, lihatAdegan, catatan }: {
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
  lihatAdegan?: () => void;
  catatan?: ReactNode;
}) {
  const st = statusMisi(akurasi, dijawab);
  const judul = JUDUL_HASIL[st];
  const rinci = nilaiMisi(mission.steps, reveal, dijawab ? answer : null);
  // Rekap per status (bukan "x dari y tepat" saja) supaya tidak bertentangan dengan "Sebagian sudah tepat".
  const rekap = (['tepat', 'sebagian', 'belum', 'kosong'] as const)
    .map((k) => [rinci.filter((h) => h.status === k).length, k === 'tepat' ? 'tepat' : k === 'sebagian' ? 'sebagian tepat' : k === 'belum' ? 'belum tepat' : 'tidak dijawab'] as const)
    .filter(([n]) => n > 0)
    .map(([n, kata]) => `${n} ${kata}`)
    .join(' · ');
  return (
    <div className="hasil" data-hasil={st}>
      <div className="hasil-kepala">
        <span className="hasil-ikon" aria-hidden="true"><TandaIkon jenis={st === 'tepat' ? 'tepat' : st === 'sebagian' ? 'terlewat' : 'salah'} /></span>
        <div>
          <h2 className="hasil-judul">{judul.judul}</h2>
          <p className="hasil-sub">{keterangan ?? judul.sub}</p>
        </div>
      </div>
      {poin !== null || rinci.length > 1 ? (
        <p className="hasil-angka">
          {poin !== null ? <span><strong>+{poin.toLocaleString('id-ID')}</strong> poin</span> : null}
          {rinci.length > 1 ? <span>Dari {rinci.length} pertanyaan: {rekap}</span> : null}
        </p>
      ) : null}

      <ol className="hasil-daftar">
        {rinci.map((h, i) => {
          const step = mission.steps.find((s) => s.id === h.stepId);
          const banyak = step?.kind === 'multi' || step?.kind === 'assign';
          const sisa = h.tepat.filter((t) => t.tanda !== 'dipilih');
          return (
            <li key={h.stepId} className="hasil-langkah" data-status={h.status}>
              <div className="hasil-langkah-kepala">
                <h3>{rinci.length > 1 ? `${i + 1}. ` : ''}{h.prompt}</h3>
                {rinci.length > 1 ? <span className={'hasil-lencana l-' + h.status}>{KATA_STATUS[h.status]}</span> : null}
              </div>
              <div className="hasil-baris">
                <span className="hasil-label">Pilihanmu</span>
                {h.pilihan.length ? <ul>{h.pilihan.map((b) => <BarisPilihan key={b.teks} b={b} />)}</ul> : <p className="hb-kosong">{dijawab ? 'Tidak ada jawaban di bagian ini.' : 'Jawaban tidak dikirim.'}</p>}
              </div>
              {h.status !== 'tepat' && sisa.length ? (
                <div className="hasil-baris">
                  {/* Yang sudah dipilih dengan tepat tidak diulang; cukup yang masih terlewat. */}
                  <span className="hasil-label">{sisa.length < h.tepat.length ? 'Yang masih terlewat' : 'Langkah yang tepat'}</span>
                  <ul>
                    {sisa.map((b) => (
                      <li key={b.teks} className="hb hb-benar">
                        <TandaIkon jenis="tepat" />
                        <span className="hb-teks">{b.teks}</span>
                        {banyak ? <span className="hb-kata">Terlewat</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Alasan teks={h.alasan} />
            </li>
          );
        })}
      </ol>

      <p className="hasil-inti"><Icon name="bintang" size={18} /><span><b>Intinya:</b> {reveal.learning}</span></p>
      {lihatAdegan ? <button type="button" className="text-button hasil-lihat" onClick={lihatAdegan}>Lihat adegan dengan tandanya <Panah /></button> : null}
      {aksi ? <div className="hasil-aksi">{aksi}</div> : null}
      {catatan}
    </div>
  );
}

export function Panah({ balik = false }: { balik?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={balik ? { transform: 'rotate(180deg)' } : undefined}><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// ------------------------------------------------------------------ kontrol HTML per langkah

function KontrolLangkah({ step, seed, value, fx, adeganAktif, itemAktif, onFokusItem, terapkan, disabled }: {
  step: StepDef;
  /** Kunci urutan tampil yang diacak (sama untuk semua pemain). */
  seed: string;
  value: StepAnswer | undefined;
  fx: ActionFx | null;
  adeganAktif: boolean;
  itemAktif: string | null;
  onFokusItem: (id: string) => void;
  terapkan: (c: Change) => void;
  disabled: boolean;
}) {
  if (step.kind === 'multi') {
    const list = asList(value);
    const maks = Math.max(1, step.requiredSelections);
    const judul = JUDUL_BAKI[fx ?? 'choose'];
    const sisa = maks - list.length;
    return (
      <div className="kontrol">
        <div className="baki" aria-label={`${judul}: ${list.length} dari ${maks}`}>
          <div className="baki-kepala"><strong>{judul}</strong><span className={list.length === maks ? 'baki-hitung lengkap' : 'baki-hitung'}>{list.length} / {maks}</span></div>
          <ul className="baki-slot">
            {list.map((id, i) => {
              const o = step.options.find((x) => x.id === id);
              if (!o) return null;
              return (
                <li key={o.id} className="slot slot-isi">
                  <span className="slot-no">{i + 1}</span>
                  {o.icon ? <Icon name={o.icon} size={20} /> : null}
                  <span className="slot-teks">{o.label}</span>
                  <button type="button" className="slot-hapus" disabled={disabled} onClick={() => terapkan(toggleMulti(step, value, o.id))} aria-label={`Batalkan ${o.label}`}>
                    <Icon name="silang" size={16} /><span>Batal</span>
                  </button>
                </li>
              );
            })}
            {sisa > 0 ? (
              <li className="slot slot-kosong">
                <span className="slot-no">{list.length + 1}</span>
                <span className="slot-teks">{list.length ? `${sisa} lagi. ` : ''}{adeganAktif ? 'Ketuk di gambar untuk menambah.' : 'Pilih dari daftar di bawah.'}</span>
              </li>
            ) : null}
          </ul>
        </div>
        <details className="daftar-alternatif" open={!adeganAktif || undefined}>
          <summary>{adeganAktif ? 'Pilih lewat daftar' : 'Daftar pilihan'}</summary>
          <div className="opsi-daftar" role="group" aria-label={step.prompt}>
            {urutanTampil(step.options, seed).map((o) => {
              const dipilih = list.includes(o.id);
              return (
                <button key={o.id} type="button" role="checkbox" aria-checked={dipilih} className={'opsi' + (dipilih ? ' dipilih' : '')} disabled={disabled} onClick={() => terapkan(toggleMulti(step, value, o.id))}>
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
    return (
      <div className="kontrol">
        <div className="opsi-daftar" role="radiogroup" aria-label={step.prompt}>
          {urutanTampil(step.options, seed).map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={pilih === o.id} className={'opsi' + (pilih === o.id ? ' dipilih' : '')} disabled={disabled} onClick={() => terapkan(chooseSingle(step, value, o.id))}>
              {o.icon ? <span className="opsi-ikon"><Icon name={o.icon} size={22} /></span> : null}
              <span className="opsi-teks">{o.label}{o.desc ? <small>{o.desc}</small> : null}</span>
              {pilih === o.id ? <span className="opsi-kata" aria-hidden="true">Dipilih</span> : null}
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
    return (
      <div className="kontrol">
        <div className="item-tab" role="tablist" aria-label="Bagian yang dinilai">
          {step.items.map((it) => (
            <button key={it.id} type="button" role="tab" aria-selected={it.id === item.id} className={'item-chip' + (it.id === item.id ? ' kini' : '') + (peta[it.id] ? ' sudah' : '')} onClick={() => onFokusItem(it.id)}>
              {it.icon ? <Icon name={it.icon} size={18} /> : null}
              <span>{it.label.split(' - ')[0]}</span>
              {peta[it.id] ? <Icon name="cek" size={16} /> : null}
            </button>
          ))}
        </div>
        <div className="item-kini" role="tabpanel">
          <span><small>Kategori untuk</small><strong>{item.label}</strong></span>
          {peta[item.id] ? (
            <button type="button" className="text-button" disabled={disabled} onClick={() => terapkan(unassignItem(step, value, item.id))}>Kosongkan</button>
          ) : null}
        </div>
        <div className="opsi-daftar" role="radiogroup" aria-label={`Kategori untuk ${item.label}`}>
          {urutanTampil(step.buckets, seed + ':kategori').map((b) => {
            const dipilih = peta[item.id] === b.id;
            return (
              <button key={b.id} type="button" role="radio" aria-checked={dipilih} className={'opsi' + (dipilih ? ' dipilih' : '')} disabled={disabled} onClick={() => terapkan(assignItem(step, value, item.id, b.id))}>
                {b.icon ? <span className="opsi-ikon"><Icon name={b.icon} size={22} /></span> : null}
                <span className="opsi-teks">{b.label}</span>
                {dipilih ? <span className="opsi-kata" aria-hidden="true">Dipilih</span> : null}
                <span className="opsi-tanda" aria-hidden="true">{dipilih ? <i /> : null}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step.kind === 'number') {
    return <KontrolAngka step={step} value={value} terapkan={terapkan} disabled={disabled} />;
  }
  return <p className="kecil lembut">Jenis pertanyaan ini belum didukung.</p>;
}

function KontrolAngka({ step, value, terapkan, disabled }: {
  step: Extract<StepDef, { kind: 'number' }>;
  value: StepAnswer | undefined;
  terapkan: (c: Change) => void;
  disabled: boolean;
}) {
  const n = asNumber(value);
  const [teks, setTeks] = useState(n !== null && !step.suggestions?.includes(n) ? String(n) : '');
  const set = (v: number | null): void => {
    if (v === null) return;
    terapkan({ kind: 'chosen', stepId: step.id, value: v, refId: String(v) });
  };
  return (
    <div className="kontrol">
      <div className="angka-pilihan" role="radiogroup" aria-label={step.prompt}>
        {step.suggestions?.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={n === s} className={'angka' + (n === s ? ' dipilih' : '')} disabled={disabled} onClick={() => { setTeks(''); set(s); }}>
            {teksAngka(step, s)}
          </button>
        ))}
      </div>
      <details className="daftar-alternatif">
        <summary>Angkanya tidak ada? Tulis sendiri</summary>
        <label className="angka-tulis">
          <span className="sr-only">Tulis angka</span>
          <input
            className="kolom" type="text" inputMode="numeric" autoComplete="off" placeholder="Tulis angka" disabled={disabled}
            value={teks}
            onChange={(e) => {
              setTeks(e.target.value);
              const bersih = e.target.value.replace(/[^\d]/g, '');
              if (bersih) set(Number(bersih));
            }}
          />
        </label>
        {n !== null && !step.suggestions?.includes(n) ? <p className="kecil">Jawabanmu: {teksAngka(step, n)}</p> : null}
      </details>
    </div>
  );
}
