/**
 * AKTIVITAS KLAIM di mode cerita (dimuat lazy: MissionPlay, adegan 2D, dan engine Phaser baru diunduh di sini).
 *
 * Alur (satu MissionPlay yang sama, jadi adegan tidak dimuat ulang), kontrak docs/rancangan-mode-cerita.md 11.5:
 *   'intro'  kartu aktivitas SATU tugas: baris pengantar terakhir, tugas singkat, tombol "Mulai". Cara main & dokumen
 *            tidak diulang di sini (tersedia di kepala tugas saat menjawab: "Cara main", "Dokumen").
 *   'play'   adegan 2D + daftar HTML; draft jawaban di state komponen ini (ganti bahasa tidak menghapusnya karena id
 *            misi/opsi sama). Album foto ringkas ("0/3 foto"), kartu polis yang bisa diperiksa di atas pilihan
 *            (MissionPlay sisipanJawab), dan dialog "foto belum lengkap" khusus cerita (konfirmasiKurang). Tanpa
 *            bahasa poin/waktu.
 *   'reveal' setelah dikirim (aksi 'aktivitas' ke mesin, dinilai sekali di klien): tanda di adegan dari
 *            MissionReveal SINTETIS (dibuat dari rubrik klien DefAktivitas.kunci), panel umpan balik (vonis langkah,
 *            reaksi/mentor, pilihan yang membantu / terlewat / kurang membantu + alasan singkatnya) lalu "Lanjutkan
 *            cerita". Alasan perasaan & pembahasan panjang ada di "Kenapa begitu?" (opsional, netral).
 * Muat ulang saat umpan balik: state.umpanBalik tersimpan, jadi pembahasan tampil lagi dari jawaban tersimpan
 * tanpa menilai ulang. Mode ringan / engine gagal tetap bisa dikerjakan lewat daftar HTML (MissionPlay).
 * Kode ini TIDAK mengimpor server/ atau kunci pertandingan; rubrik cerita ada di episode.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Bahasa } from '@shared/bahasa';
import { TOKOH } from '@shared/brand';
import type { MissionAnswer, MissionPublic, MissionReveal, PlayerLook, StepDef } from '@shared/types';
import { playSfx } from '../../audio/audio';
import { Arrow } from '../../components/PlayerShell';
import { fxLangkah } from '../../game/aksesInfo';
import type { StageStatus } from '../../game/GameStage';
import { MissionPlay, TandaIkon, sela } from '../../game/MissionPlay';
import { nilaiMisi, type HasilLangkah } from '../../game/hasil';
import { sceneFor } from '../../game/scenes';
import { t } from '../../i18n';
import { barisTerlihat, umpanBalikKini } from '../mesin';
import { PotretMissRaksa } from '../seni/tokoh/PotretMissRaksa';
import type { Baris, DefAktivitas, Episode, KunciTeks, NodeAktivitas, StateCerita } from '../tipe';
import { PotretPembicara, infoPembicara } from './bagian';
import { KartuPolisPeriksa } from './KartuPolisPeriksa';
import { artiKartu, buatReveal, langkahDenganJawaban, rincianOpsi, statusAkurasi, type OpsiHasil, type RincianOpsi } from './hasilAktivitas';
import './aktivitas.css';

export interface PropsAktivitas {
  ep: Episode;
  state: StateCerita;
  node: NodeAktivitas;
  bahasa: Bahasa;
  look: PlayerLook;
  namaPemain: string;
  tx: (k: KunciTeks) => string;
  /** Kirim jawaban ke mesin (aksi 'aktivitas'); penilaian terjadi di sana, sekali. */
  onKirim: (jawaban: MissionAnswer) => void;
  /** Lanjut dari umpan balik ke node berikutnya. */
  onLanjut: () => void;
}

export default function AktivitasCerita({ ep, state, node, bahasa, look, namaPemain, tx, onKirim, onLanjut }: PropsAktivitas) {
  const def = ep.aktivitas[node.aktivitas]!;
  const misi = useMemo(() => def.misi(bahasa), [def, bahasa]);
  const ub = umpanBalikKini(ep, state);
  const hasil = ub?.hasil ?? null;
  const reveal = useMemo(() => (hasil ? buatReveal(def, misi, tx) : null), [hasil, def, misi, tx]);
  const [jawaban, setJawaban] = useState<MissionAnswer>({});
  const jawabanRef = useRef(jawaban);
  jawabanRef.current = jawaban;
  const [mulai, setMulai] = useState(false);
  const mode = hasil ? 'reveal' : mulai ? 'play' : 'intro';
  const pengantar = barisTerlihat(ep, state);
  const barisAkhir = pengantar[pengantar.length - 1] ?? null;
  const akar = useRef<HTMLDivElement>(null);
  const [statusAdegan, setStatusAdegan] = useState<StageStatus>('loading');
  const pemeranNasabah = Object.prototype.hasOwnProperty.call(ep.pemeran, ep.nasabah) ? ep.pemeran[ep.nasabah] : undefined;
  // Pemandu di kartu tugas saat menjawab = potret piksel Miss Raksa (sama dengan dialog & panggung), wajah dari baris
  // Miss Raksa terakhir di pengantar aktivitas ini. Miss Raksa nonaktif: MissionPlay memakai Raki seperti biasa.
  const wajahPemandu = [...pengantar].reverse().find((b) => ep.pemeran[b.siapa]?.potret === 'missRaksa')?.ekspresi ?? 'netral';
  const potretPemandu = TOKOH.missRaksa.aktif ? <PotretMissRaksa ekspresi={wajahPemandu} ukuran={44} /> : undefined;
  const namaNasabah = pemeranNasabah ? tx(pemeranNasabah.nama) : '';

  // Langkah pilih-banyak yang objeknya DIFOTO di adegan (aktivitas bukti): penghitung & dialog memakai kata "foto".
  // sceneFor di-cache per misi & bahasa (spec yang sama dengan MissionPlay).
  const langkahFoto = useMemo(() => {
    const spec = sceneFor(misi, bahasa);
    return new Set(misi.steps.filter((s) => s.kind === 'multi' && fxLangkah(spec, s.id) === 'photo').map((s) => s.id));
  }, [misi, bahasa]);
  const labelHitung = useMemo(
    () => (langkahFoto.size ? (n: number, maks: number) => t('ceritaAkt.hitungFoto', { n, maks }) : undefined),
    [langkahFoto],
  );

  // Dialog "belum lengkap" khusus cerita: akibat jujur, tanpa poin. Kirim tetap lewat cabang "belum lengkap" episode.
  const konfirmasiKurang = useCallback(({ terisi, wajib, langkah }: { terisi: number; wajib: number; langkah: StepDef }) => {
    if (langkahFoto.has(langkah.id)) {
      return {
        judul: t('ceritaAkt.fotoKurangJudul', { n: terisi, total: wajib }),
        isi: <p>{t('ceritaAkt.fotoKurangAkibat', { nama: namaNasabah })}</p>,
        kembali: t('ceritaAkt.lengkapiFoto'),
        kirim: t(terisi === 1 ? 'ceritaAkt.kirimFotoSatu' : 'ceritaAkt.kirimFotoBanyak', { n: terisi }),
      };
    }
    return { judul: t('ceritaAkt.kurangJudul'), isi: <p>{t('ceritaAkt.kurangAkibat')}</p>, kembali: t('ceritaAkt.lengkapi'), kirim: t('ceritaAkt.kirimApaAdanya') };
  }, [langkahFoto, namaNasabah]);

  // Kartu polis yang bisa diperiksa: tampil di atas pilihan selama menjawab (satu-satunya tempat kartu tampil
  // utuh di aktivitas; kartu pengantar tidak mengulangnya).
  const kartu = misi.policyCards ?? [];
  const sisipan = kartu.length ? (
    <div className="cer-akt-sisipan">
      {kartu.map((c) => <KartuPolisPeriksa key={c.id} card={c} arti={artiKartu(def, c.id, tx)} />)}
    </div>
  ) : null;

  // Tampil pertama (chunk lazy baru selesai dimuat): bila fokus hilang (tombol "Lanjut" sudah tidak ada),
  // bawa ke judul kartu aktivitas / pembahasan supaya pembaca layar & keyboard tidak tersesat.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const aktif = document.activeElement;
      if (aktif && aktif !== document.body) return;
      akar.current?.querySelector<HTMLElement>('[data-cer-fokus], .misi-panel h2')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Bunyi hasil hanya saat baru dinilai (bukan saat pembahasan dimuat ulang).
  const sudahAdaHasil = useRef(Boolean(hasil));
  useEffect(() => {
    if (hasil && !sudahAdaHasil.current) playSfx(hasil.akurasi >= 0.999 ? 'naik' : 'pilih');
    sudahAdaHasil.current = Boolean(hasil);
  }, [hasil]);

  const kirim = useCallback(() => {
    playSfx('kirim');
    onKirim(jawabanRef.current);
  }, [onKirim]);

  const tanpaKanvas = statusAdegan === 'static' || statusAdegan === 'failed';
  const tombolMulai = t('cerita.mulaiAktivitas');

  return (
    <div ref={akar} className="cer-aktivitas" data-mode={mode}>
      <MissionPlay
        mission={misi}
        roundIndex={-1}
        look={look}
        mode={mode}
        answer={hasil ? hasil.jawaban : jawaban}
        onAnswer={(id, value) => setJawaban((lama) => ({ ...lama, [id]: value }))}
        onSubmit={kirim}
        reveal={reveal}
        submitLabel={tx(def.labelKirim)}
        fokus={def.fokus}
        sudahBriefing
        onSceneStatus={setStatusAdegan}
        // Mode ringan / engine gagal: gambar tidak akan bisa disentuh; pilihannya lewat daftar.
        ketIntro={tanpaKanvas ? t('ceritaAkt.ketDaftarMulai', { tombol: tombolMulai }) : t('cerita.ketAdeganMulai', { tombol: tombolMulai })}
        sisipanJawab={sisipan}
        statusPilihan={!sisipan}
        petunjukLangkah
        konfirmasiKurang={konfirmasiKurang}
        labelHitung={labelHitung}
        albumRingkas
        potretPemandu={potretPemandu}
        panel={() => (hasil && reveal && ub ? (
          <PanelUmpanBalik
            ep={ep}
            def={def}
            misi={misi}
            reveal={reveal}
            jawaban={hasil.jawaban}
            akurasi={hasil.akurasi}
            baris={ub.baris}
            alasan={ub.alasan ? tx(ub.alasan.teks) : null}
            look={look}
            namaPemain={namaPemain}
            namaNasabah={namaNasabah}
            tx={tx}
            onLanjut={onLanjut}
          />
        ) : (
          <KartuAktivitas
            ep={ep}
            misi={misi}
            baris={barisAkhir}
            look={look}
            namaPemain={namaPemain}
            tx={tx}
            onMulai={() => { playSfx('tik'); setMulai(true); }}
          />
        ))}
      />
    </div>
  );
}

/**
 * Satu ucapan pendek (potret + nama + kalimat) di panel aktivitas. `lanjutan` = baris berikutnya dari pembicara yang
 * sama (satu potret & nama untuk beberapa kalimat berturut-turut, bukan potret berulang).
 */
function Ucapan({ ep, baris, lanjutan = [], look, namaPemain, tx }: {
  ep: Episode;
  baris: Baris;
  lanjutan?: Baris[];
  look: PlayerLook;
  namaPemain: string;
  tx: (k: KunciTeks) => string;
}) {
  const p = infoPembicara(ep, baris.siapa, tx, namaPemain);
  return (
    <div className="cer-ucap" data-jenis={p.jenis}>
      {p.jenis !== 'narasi' ? <PotretPembicara jenis={p.jenis} ekspresi={baris.ekspresi} look={look} ukuran={44} nama={p.nama} /> : null}
      <p>
        {p.jenis !== 'narasi' ? <b>{p.nama}{p.peran ? <span> · {p.peran}</span> : null}</b> : null}
        <span className="cer-ucap-teks">{tx(baris.teks)}</span>
        {lanjutan.map((b, i) => <span key={i} className="cer-ucap-teks cer-ucap-lanjut">{sela()}{tx(b.teks)}</span>)}
      </p>
    </div>
  );
}

/** Baris berturut-turut dari pembicara yang sama digabung (urutan tetap). */
function kelompokPembicara(baris: Baris[]): Baris[][] {
  const hasil: Baris[][] = [];
  for (const b of baris) {
    const akhir = hasil[hasil.length - 1];
    if (akhir && akhir[0]!.siapa === b.siapa) akhir.push(b);
    else hasil.push([b]);
  }
  return hasil;
}

/**
 * Kartu sebelum aktivitas dimulai: SATU tugas (baris pengantar terakhir + tugas singkat + "Mulai"). Adegan di
 * bawahnya sudah mulai dimuat. Cara main, dokumen, dan kartu polis tidak diulang di sini: saat menjawab kepala tugas
 * memberi petunjuk satu kalimat + tombol "Cara main"/"Dokumen", dan kartu polis tampil di atas pilihan.
 */
function KartuAktivitas({ ep, misi, baris, look, namaPemain, tx, onMulai }: {
  ep: Episode;
  misi: MissionPublic;
  baris: Baris | null;
  look: PlayerLook;
  namaPemain: string;
  tx: (k: KunciTeks) => string;
  onMulai: () => void;
}) {
  return (
    <div className="status-panel misi-mulai cer-akt-mulai">
      <span className="status-label cer-akt-label">{t('cerita.aktivitasLabel')} · {misi.title}</span>
      {baris ? <Ucapan ep={ep} baris={baris} look={look} namaPemain={namaPemain} tx={tx} /> : null}
      <div className="status-tugas">
        <span className="status-label">{t('cerita.tugasmu')}</span>
        <h2 tabIndex={-1} data-cer-fokus="">{misi.instruction}</h2>
      </div>
      <div className="misi-mulai-aksi">
        <button type="button" className="primary-action" onClick={onMulai}>{t('cerita.mulaiAktivitas')} <Arrow /></button>
      </div>
    </div>
  );
}

const gabung = (b: { teks: string }[]): string => b.map((x) => x.teks).join(' · ');

/** Rincian umum untuk langkah selain pilih-satu/pilih-banyak (tidak dipakai AUTO-1; cadangan episode lain). */
function RincianLangkah({ h }: { h: HasilLangkah }) {
  const benar = h.pilihan.filter((p) => p.tanda === 'tepat');
  const salah = h.pilihan.filter((p) => p.tanda === 'salah');
  const sisa = h.tepat.filter((p) => p.tanda !== 'dipilih');
  return (
    <ul className="rl-baris cer-rincian">
      {salah.length ? <li><TandaIkon jenis="salah" /><span><b>{t('cerita.kamuPilih')}</b>{sela()}{gabung(salah)}</span></li> : null}
      {benar.length && h.status !== 'tepat' ? <li><TandaIkon jenis="tepat" /><span><b>{t('cerita.sudahTepat')}</b>{sela()}{gabung(benar)}</span></li> : null}
      {sisa.length ? <li><TandaIkon jenis="terlewat" /><span><b>{t('cerita.yangTepat')}</b>{sela()}{gabung(sisa)}</span></li> : null}
    </ul>
  );
}

/** Satu kelompok pilihan setelah dikirim: ikon + kata, lalu tiap pilihan dengan alasan singkatnya. */
function KelompokOpsi({ jenis, ikon, judul, opsi }: { jenis: string; ikon: 'tepat' | 'salah' | 'terlewat'; judul: string; opsi: OpsiHasil[] }) {
  if (!opsi.length) return null;
  return (
    <div className="cer-opsi-kelompok" data-kelompok={jenis}>
      <p className="cer-opsi-kelompok-judul"><TandaIkon jenis={ikon} /><span>{judul}</span></p>
      <ul>
        {opsi.map((o) => <li key={o.id} data-opsi={o.id}><b>{o.label}</b>{o.alasan ? <span>{o.alasan}</span> : null}</li>)}
      </ul>
    </div>
  );
}

/**
 * Pilihan satu langkah setelah dikirim. Pilih-banyak (foto): yang membantu, yang terlewat, dan yang kurang membantu,
 * masing-masing dengan alasan singkat. Pilih-satu: bila tepat TIDAK diulang (reaksi & mentor sudah menanggapinya;
 * alasannya di "Kenapa begitu?"); bila keliru: pilihanmu & yang tepat, masing-masing dengan alasannya.
 */
function PilihanLangkah({ r, h }: { r: RincianOpsi; h: HasilLangkah | undefined }) {
  if (r.jenis === 'lain') return h ? <RincianLangkah h={h} /> : null;
  if (r.jenis === 'single') {
    if (r.tepat) return null;
    return (
      <>
        <KelompokOpsi jenis="kurang" ikon="salah" judul={t('cerita.kamuPilih')} opsi={r.kurang} />
        <KelompokOpsi jenis="terlewat" ikon="terlewat" judul={t('cerita.yangTepat')} opsi={r.terlewat} />
      </>
    );
  }
  return (
    <>
      <KelompokOpsi jenis="membantu" ikon="tepat" judul={t('ceritaAkt.kelompok.membantu')} opsi={r.membantu} />
      <KelompokOpsi jenis="terlewat" ikon="terlewat" judul={t('ceritaAkt.kelompok.terlewat')} opsi={r.terlewat} />
      <KelompokOpsi jenis="kurang" ikon="salah" judul={t('ceritaAkt.kelompok.kurang')} opsi={r.kurang} />
    </>
  );
}

/** "Kenapa begitu?" (opsional): pengungkap dengan aria-expanded; isi dipisah per sisi (langkah klaim / perasaan). */
function Kenapa({ bagian }: { bagian: { judul: string; isi: ReactNode }[] }) {
  const id = useId();
  const [buka, setBuka] = useState(false);
  if (!bagian.length) return null;
  return (
    <div className="cer-kenapa">
      <button type="button" className="cer-kenapa-tombol" aria-expanded={buka} aria-controls={id} onClick={() => setBuka((b) => !b)}>
        <span className="kpp-tanda" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" focusable="false">
            <path d={buka ? 'M6 12h12' : 'M12 6v12M6 12h12'} stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
        <span>{t('cerita.kenapa')}</span>
      </button>
      <div id={id} className="cer-kenapa-isi" hidden={!buka}>
        {bagian.map((b, i) => <div key={i}><b>{b.judul}</b>{b.isi}</div>)}
      </div>
    </div>
  );
}

/**
 * Umpan balik aktivitas: vonis LANGKAH (bahasa tepat/keliru hanya untuk proses), reaksi nasabah / catatan mentor dari
 * cabang, pilihan yang membantu / terlewat / kurang membantu dengan alasan singkat, lalu "Lanjutkan cerita".
 * Alasan perasaan nasabah (netral, tanpa kotak berwarna) & pembahasan panjang ada di "Kenapa begitu?".
 */
function PanelUmpanBalik({ ep, def, misi, reveal, jawaban, akurasi, baris, alasan, look, namaPemain, namaNasabah, tx, onLanjut }: {
  ep: Episode;
  def: DefAktivitas;
  misi: MissionPublic;
  reveal: MissionReveal;
  jawaban: MissionAnswer;
  akurasi: number;
  baris: Baris[];
  /** Alasan perubahan perasaan nasabah (teks jadi), atau null. */
  alasan: string | null;
  look: PlayerLook;
  namaPemain: string;
  namaNasabah: string;
  tx: (k: KunciTeks) => string;
  onLanjut: () => void;
}) {
  const st = statusAkurasi(akurasi);
  const rinci = rincianOpsi(def, misi, jawaban, tx);
  // Rincian umum hanya untuk jenis langkah lain; opsi yang sudah dihapus dari misi tetap berlabel.
  const umum = rinci.some((r) => r.jenis === 'lain') ? nilaiMisi(langkahDenganJawaban(def, misi.steps, jawaban, tx), reveal, jawaban) : [];
  const kenapa: { judul: string; isi: ReactNode }[] = [];
  for (const r of rinci) {
    // Pilih-satu yang tepat: alasan pilihannya pindah ke sini (tidak diulang di atas).
    const alasanPilihan = r.jenis === 'single' && r.tepat ? r.membantu.map((o) => o.alasan).filter((x): x is string => !!x) : [];
    if (alasanPilihan.length) kenapa.push({ judul: t('ceritaAkt.pilihanmu'), isi: alasanPilihan.map((a, i) => <p key={i}>{a}</p>) });
    if (r.penjelasan.trim()) kenapa.push({ judul: t('ceritaAkt.langkahKlaim'), isi: <p>{r.penjelasan}</p> });
  }
  if (alasan) kenapa.push({ judul: t('ceritaAkt.perasaan', { nama: namaNasabah }), isi: <p>{alasan}</p> });
  return (
    <div className="status-panel cer-umpan" data-hasil={st}>
      <div className="cer-umpan-kepala">
        <TandaIkon jenis={st === 'tepat' ? 'tepat' : st === 'sebagian' ? 'terlewat' : 'salah'} />
        <div>
          <span className="status-label">{misi.title}</span>
          <h2 tabIndex={-1}>{t(`cerita.hasil.${st}`)}</h2>
        </div>
      </div>
      {baris.length ? (
        <div className="cer-umpan-ucapan">
          {kelompokPembicara(baris).map(([b, ...lanjut], i) => <Ucapan key={i} ep={ep} baris={b!} lanjutan={lanjut} look={look} namaPemain={namaPemain} tx={tx} />)}
        </div>
      ) : null}
      {rinci.map((r) => <PilihanLangkah key={r.stepId} r={r} h={umum.find((h) => h.stepId === r.stepId)} />)}
      <div className="cer-umpan-aksi">
        <button type="button" className="primary-action" data-cer-fokus="" onClick={onLanjut}>{t('cerita.lanjutCerita')} <Arrow /></button>
      </div>
      <Kenapa bagian={kenapa} />
      <p className="practice-note">{t('misi.catatanSimulasiPeriksa')}</p>
    </div>
  );
}
