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
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  stepComplete, stepIdsOf, stepStarted, toggleMulti, unassignItem, urutanTampil, type Change,
} from './draft';
import { AdeganGambar } from './AdeganGambar';
import { bacaAngka, misiBergambar, visualMisi } from './gambar';
import { GameStage, type StageApi, type StageStatus } from './GameStage';
import { judulHasil, nilaiMisi, statusMisi, type BarisHasil, type HasilLangkah } from './hasil';
import { PotretTokoh } from './KarakterTokoh';
import { sceneFor } from './scenes';
import type { ActionFx, SceneSpec, StageMode, StageStats, StageView } from './types';
import './stage.css';

export type SubmitState = 'idle' | 'sending' | 'sent' | 'failed';

/** Bantuan untuk panel non-menjawab (briefing, terkirim, pembahasan, jeda). */
export interface PanelBantu {
  bukaDokumen: (id?: string) => void;
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
 * Tanpa terjemahan = teks adegan.
 */
function teksInfo(missionId: string, objectId: string, asli: string): string {
  if (bahasaKini() === 'id') return asli;
  const kunci = `misi.info.${missionId}.${objectId}`;
  const teks = t(kunci);
  return teks === kunci ? asli : teks;
}

function fxLangkah(spec: SceneSpec | null, stepId: string): ActionFx | null {
  const o = spec?.objects.find((x) => stepIdsOf(x).includes(stepId) && (x.role === 'option' || x.role === 'item'));
  return o?.fx ?? null;
}

/** Satu kalimat petunjuk: apa yang diketuk dan bahwa pilihan masih bisa diganti. */
function petunjuk(step: StepDef, fx: ActionFx | null, adeganAktif: boolean, bergambar = false): string {
  // Misi bergambar: tidak ada dokumen/papan di adegan; sumbernya gambar itu sendiri.
  if (bergambar && step.kind === 'number') return t('misi.petunjukAngkaGambar');
  // Pertanyaan sudah menyebut jumlahnya; petunjuk cukup menjelaskan mekaniknya (tidak mengulang).
  if (step.kind === 'multi') {
    if (!adeganAktif) return t('misi.petunjukMultiDaftar');
    if (fx === 'photo') return t('misi.petunjukMultiFoto');
    if (fx === 'file') return t('misi.petunjukMultiFolder');
    return t('misi.petunjukMultiCatat');
  }
  if (step.kind === 'single') return adeganAktif ? t('misi.petunjukSingleAdegan') : t('misi.petunjukSingleDaftar');
  if (step.kind === 'assign') {
    return adeganAktif && fx ? t('misi.petunjukAssignAdegan') : t('misi.petunjukAssignDaftar');
  }
  if (step.kind === 'number') return t('misi.petunjukAngka');
  return t('misi.petunjukUrut');
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

function layarPendek(): boolean {
  try { return window.matchMedia('(max-height: 540px)').matches; } catch { return false; }
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
  const { mission, roundIndex, look, mode, answer, onAnswer, onSubmit, reveal = null } = props;
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
  // "Aktif" = ada objek yang bisa diketuk. Gambar yang sudah tampil tetap bukan adegan interaktif.
  const adeganAktif = !bergambar && status === 'ready';
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
  // Pesan yang sedang tampil masih dalam bahasa lama: kosongkan saat bahasa berganti (jawaban tidak disentuh).
  useEffect(() => { setUmumkan(''); setPesan(''); }, [bahasa]);

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
    requestAnimationFrame(() => {
      if (mode === 'play') { fokusKe(tanyaRef.current); return; }
      const h = panelRef.current?.querySelector<HTMLElement>('h2');
      if (h) { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
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
      const teks = t(`misi.penuh${bakiDari(fxLangkah(spec, c.stepId))}`, { n: c.max, total: c.max });
      setUmumkan(teks);
      setPesan(teks);
      playSfx('tik');
      if (spec && s) api.current?.highlight(spec.objects.filter((o) => o.stepId === s.id && asList(answerRef.current[s.id]).includes(o.refId)).map((o) => o.id));
      void objectId;
      return;
    }
    setPesan('');
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
      // Lanjut otomatis ke bagian berikutnya yang belum dipilih.
      const peta = asRecord(c.value);
      const berikut = s.items.find((i) => !peta[i.id]);
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
    if (r.kind === 'change') terapkan(r.change, objectId);
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
      setDokumen(r.docId);
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
  }, [mission, spec, terapkan, setDokumen]);

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
  const sisa = props.remainingMs ?? null;
  const bantu: PanelBantu = {
    bukaDokumen: (id) => setDokumen(id ?? 'semua'),
  };
  const pemandu = mission.id === 'tutorial' || !TOKOH.missRaksa.aktif ? 'raki' : 'missRaksa';
  // Jeda memakai tata letak menjawab (tidak melompat), kontrol dikunci.
  const menjawab = mode === 'play' || mode === 'paused';
  const panelLuar = typeof props.panel === 'function' ? props.panel(bantu) : props.panel;
  const ketAksi = !terakhir
    ? (stepStarted(step, answer[step.id]) ? t('misi.ketTersimpan') : t('misi.ketJawabDulu'))
    : !missionStarted(mission, answer) ? t('misi.ketIsiDulu') : t('misi.ketBelumDikirim');

  return (
    <div ref={akar} className={`misi misi-${mode}`} data-mode={mode} data-fokus={fokusMisi(mission)} data-visual={visual}>
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
              {pemandu === 'raki' ? <Raki size={44} mood="sapa" /> : <PotretTokoh tokoh="missRaksa" ukuran={44} />}
            </span>
            <div>
              <h2 ref={tanyaRef} id="misi-tanya" className="misi-tanya">{step.prompt}</h2>
              <p className="misi-petunjuk">{petunjuk(step, fx, adeganAktif, bergambar)}</p>
            </div>
          </div>
          <div className="tugas-alat">
            <button type="button" className="alat" aria-expanded={ceritaBuka} aria-controls="misi-cerita" onClick={() => setCeritaBuka((b) => !b)}>
              <Icon name="daftar" size={17} /> {t('misi.cerita')}
            </button>
            {punyaDokumen ? (
              <button type="button" className="alat" onClick={() => setDokumen('semua')}>
                <Icon name="polis" size={17} /> {t('misi.dokumen')}
              </button>
            ) : null}
            <button type="button" className="alat" aria-expanded={bantuanBuka} aria-controls="misi-bantuan" onClick={() => setBantuanBuka((b) => !b)}>
              <Icon name="tanya" size={17} /> {t('misi.caraMain')}
            </button>
          </div>
          {ceritaBuka ? <p id="misi-cerita" className="tugas-cerita"><b>{t('misi.kasus')}</b>{sela()}{mission.story}</p> : null}
          {bantuanBuka ? <div id="misi-bantuan"><CaraMain mission={mission} langkah={step} onTutup={() => setBantuanBuka(false)} /></div> : null}
        </header>
      ) : null}

      <div ref={adeganRef} className="misi-adegan">
        {bergambar ? (
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
        {/* Misi bergambar: tidak ada tanda di gambar (tanpa legenda) dan tidak ada yang "bisa disentuh". */}
        {mode === 'reveal' && adeganAktif && reveal ? <LegendaTanda /> : null}
        {mode === 'intro' && !bergambar ? <p className="adegan-ket">{t('misi.adeganBelumBisa')}</p> : null}
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
            <StatusPilihan step={step} value={answer[step.id]} />
            <KontrolLangkah
              key={step.id}
              step={step}
              seed={mission.id + ':' + step.id}
              value={answer[step.id]}
              fx={fx}
              adeganAktif={adeganAktif}
              angkaBebas={bergambar}
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
        <Modal judul={t('misi.dokumenKasus')} onTutup={() => {
          // Klik "hantu" dari ketukan layar sentuh yang membuka dokumen tidak boleh langsung menutupnya.
          if (performance.now() - dokumenDibuka.current < 500) return;
          setDokumen(null);
        }}>
          <div className="dokumen-isi">
            {mission.policyCards?.map((c) => <div key={c.id} className={dokumen === c.id ? 'dokumen-sorot' : ''}><PolicyCardView card={c} aktif={dokumen === c.id} /></div>)}
            {mission.tables?.map((tb) => <div key={tb.id} className={dokumen === tb.id ? 'dokumen-sorot' : ''}><DocTableView table={tb} /></div>)}
            {mission.checklist?.length ? (
              <div className={'panel-krem' + (dokumen === 'checklist' ? ' dokumen-sorot' : '')}>
                <strong>{t('misi.daftarIsiLaporan')}</strong>
                <ul>{mission.checklist.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}

      {konfirmasi ? (
        <Modal
          judul={t('misi.kirimSekarangTanya')}
          onTutup={() => setKonfirmasi(null)}
          aksi={<>
            <button type="button" className="btn btn-netral" onClick={() => setKonfirmasi(null)}>{t('misi.periksaLagi')}</button>
            <button type="button" className="btn btn-utama" onClick={() => { setKonfirmasi(null); onSubmit?.(); }}>{t('misi.kirimSekarang')}</button>
          </>}
        >
          <p>{t('misi.belumLengkap')}</p>
          <ul className="konfirmasi-daftar">{konfirmasi.map((k) => <li key={k}>{k}</li>)}</ul>
          <p className="kecil lembut">{t('misi.konfirmasiCatatan')}</p>
        </Modal>
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

/** 'daftar' & 'isi' = misi bergambar: memilih beberapa dari daftar, mengisi angka dari gambar (tanpa ketukan adegan). */
type Mekanik = 'foto' | 'folder' | 'catat' | 'pilih' | 'kelompok' | 'angka' | 'daftar' | 'isi';

/** Contoh mekanik dalam bahasa aktif: kamus misi.cara.<mekanik>.judul / .teks / .hasil. */
const cara = (m: Mekanik): { judul: string; teks: string; hasil: string } => ({
  judul: t(`misi.cara.${m}.judul`),
  teks: t(`misi.cara.${m}.teks`),
  hasil: t(`misi.cara.${m}.hasil`),
});

export function mekanikLangkah(step: StepDef, spec: SceneSpec | null, bergambar = false): Mekanik {
  if (step.kind === 'number') return bergambar ? 'isi' : 'angka';
  if (step.kind === 'assign') return 'kelompok';
  if (step.kind === 'single') return 'pilih';
  if (bergambar && step.kind === 'multi') return 'daftar';
  const fx = fxLangkah(spec, step.id);
  return fx === 'photo' ? 'foto' : fx === 'file' ? 'folder' : fx ? 'catat' : 'pilih';
}

/**
 * Contoh singkat mekanik ("ketuk -> tercatat -> bisa dibatalkan").
 * Saat menjawab: hanya untuk langkah yang sedang dikerjakan, dibuka lewat "Cara main".
 * Saat briefing: semua mekanik misi, sebelum adegan bisa disentuh.
 */
export function CaraMain({ mission, langkah, onTutup }: { mission: MissionPublic; langkah?: StepDef; onTutup?: () => void }) {
  const { bahasa } = useBahasa();
  const bergambar = useMemo(() => misiBergambar(mission), [mission]);
  const spec = useMemo(() => (bergambar ? null : sceneFor(mission, bahasa)), [mission, bahasa, bergambar]);
  const daftar = useMemo(() => [...new Set((langkah ? [langkah] : mission.steps).map((s) => mekanikLangkah(s, spec, bergambar)))], [mission, spec, langkah, bergambar]);
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
 * Hasil misi, dibacakan juri (Bu Isti): gambar dulu (adegan bertanda di atas panel ini), lalu
 * satu kalimat hasil, paling banyak tiga baris per pertanyaan, dan satu tombol. Penjelasan
 * panjang dilipat. Tanpa kotak berwarna: hijau untuk ✓, satu aksen merah bata untuk ✕.
 *
 * `padat` = pertandingan (pembahasan hanya tampil ±14 detik; layar proyektor memuat
 * pembahasan lengkap): misi berlangkah banyak cukup satu baris status per pertanyaan.
 * Status per langkah dihitung dengan aturan yang sama dengan server (hasil.ts).
 */
export function HasilMisi({ mission, reveal, answer, akurasi, dijawab, poin = null, keterangan, aksi, catatan, padat = false }: {
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
}) {
  useBahasa();
  const st = statusMisi(akurasi, dijawab);
  const judul = judulHasil(st);
  const rinci = nilaiMisi(mission.steps, reveal, dijawab ? answer : null);
  const banyak = rinci.length > 1;
  const rinciDiLuar = !(padat && banyak);
  const juri = TOKOH.isti.aktif;
  const ikon = st === 'tepat' ? 'tepat' : st === 'sebagian' ? 'terlewat' : 'salah';
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

      <details className="lipat">
        <summary>{!rinciDiLuar ? t('misi.lihatRincian') : st === 'tepat' ? t('misi.kenapaTepat') : t('misi.kenapaBegitu')}</summary>
        <div className="lipat-isi">
          {rinci.map((h, i) => (
            <div key={h.stepId}>
              {banyak ? <b>{i + 1}. {h.prompt}</b> : null}
              {!rinciDiLuar && h.status !== 'tepat' ? <BarisRinci h={h} step={mission.steps.find((x) => x.id === h.stepId)} berjudul /> : null}
              <p>{h.alasan}</p>
            </div>
          ))}
          {padat ? <p><b>{t('misi.intinya')}</b>{sela()}{reveal.learning}</p> : null}
        </div>
      </details>

      {aksi ? <div className="hasil-aksi">{aksi}</div> : null}
      {!padat ? <p className="hasil-inti"><b>{t('misi.intinya')}</b>{sela()}{reveal.learning}</p> : null}
      {catatan}
    </div>
  );
}

export function Panah({ balik = false }: { balik?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={balik ? { transform: 'rotate(180deg)' } : undefined}><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// ------------------------------------------------------------------ kontrol HTML per langkah

function KontrolLangkah({ step, seed, value, fx, adeganAktif, angkaBebas = false, itemAktif, onFokusItem, terapkan, disabled }: {
  step: StepDef;
  /** Kunci urutan tampil yang diacak (sama untuk semua pemain). */
  seed: string;
  value: StepAnswer | undefined;
  fx: ActionFx | null;
  adeganAktif: boolean;
  /** Soal kustom: ketikan angka boleh pecahan/negatif (lihat bacaAngka). */
  angkaBebas?: boolean;
  itemAktif: string | null;
  onFokusItem: (id: string) => void;
  terapkan: (c: Change) => void;
  disabled: boolean;
}) {
  useBahasa();
  if (step.kind === 'multi') {
    const list = asList(value);
    const maks = Math.max(1, step.requiredSelections);
    const judul = judulBaki(fx);
    const sisa = maks - list.length;
    return (
      <div className="kontrol">
        <div className="baki" aria-label={t('misi.bakiAria', { baki: judul, n: list.length, total: maks })}>
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
                  <button type="button" className="slot-hapus" disabled={disabled} onClick={() => terapkan(toggleMulti(step, value, o.id))} aria-label={t('misi.batalkanAria', { label: o.label })}>
                    <Icon name="silang" size={16} /><span>{t('misi.batal')}</span>
                  </button>
                </li>
              );
            })}
            {sisa > 0 ? (
              <li className="slot slot-kosong">
                <span className="slot-no">{list.length + 1}</span>
                <span className="slot-teks">{list.length ? t('misi.slotLagi', { n: sisa }) + sela() : ''}{adeganAktif ? t('misi.slotKetuk') : t('misi.slotDaftar')}</span>
              </li>
            ) : null}
          </ul>
        </div>
        <details className="daftar-alternatif" open={!adeganAktif || undefined}>
          <summary>{adeganAktif ? t('misi.pilihLewatDaftar') : t('misi.daftarPilihan')}</summary>
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
    return (
      <div className="kontrol">
        <div className="item-tab" role="tablist" aria-label={t('misi.bagianDinilai')}>
          {step.items.map((it) => (
            <button key={it.id} type="button" role="tab" aria-selected={it.id === item.id} className={'item-chip' + (it.id === item.id ? ' kini' : '') + (peta[it.id] ? ' sudah' : '')} onClick={() => onFokusItem(it.id)}>
              {it.icon ? <Icon name={it.icon} size={18} /> : null}
              <span>{it.label.split(' - ')[0]}</span>
              {peta[it.id] ? <Icon name="cek" size={16} /> : null}
            </button>
          ))}
        </div>
        <div className="item-kini" role="tabpanel">
          <span><small>{t('misi.kategoriUntuk')}</small><strong>{item.label}</strong></span>
          {peta[item.id] ? (
            <button type="button" className="text-button" disabled={disabled} onClick={() => terapkan(unassignItem(step, value, item.id))}>{t('misi.kosongkan')}</button>
          ) : null}
        </div>
        <div className="opsi-daftar" role="radiogroup" aria-label={t('misi.kategoriUntukAria', { label: item.label })}>
          {urutanTampil(step.buckets, seed + ':kategori').map((b) => {
            const dipilih = peta[item.id] === b.id;
            return (
              <button key={b.id} type="button" role="radio" aria-checked={dipilih} className={'opsi' + (dipilih ? ' dipilih' : '')} disabled={disabled} onClick={() => terapkan(assignItem(step, value, item.id, b.id))}>
                {b.icon ? <span className="opsi-ikon"><Icon name={b.icon} size={22} /></span> : null}
                <span className="opsi-teks">{b.label}</span>
                {dipilih ? <span className="opsi-kata" aria-hidden="true">{t('misi.dipilih')}</span> : null}
                <span className="opsi-tanda" aria-hidden="true">{dipilih ? <i /> : null}</span>
              </button>
            );
          })}
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
      <div className="angka-pilihan" role="radiogroup" aria-label={step.prompt}>
        {step.suggestions?.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={n === s} className={'angka' + (n === s ? ' dipilih' : '')} disabled={disabled} onClick={() => { setTeks(''); set(s); }}>
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
