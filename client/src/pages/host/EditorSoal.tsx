/**
 * Editor "Buat soal sendiri" untuk panitia (tanpa coding): panel penuh di atas halaman host.
 * Kiri = isian (tentang soal, gambar, 1-4 pertanyaan), kanan = pratinjau seperti di HP pemain;
 * di layar sempit (tablet) keduanya bergantian lewat dua tombol di kepala panel.
 *
 * Validasi di client (drafSoal.ts) memakai BATAS_KUSTOM + hitungan karakter; server tetap penentu
 * akhir dan rincian galatnya ditampilkan per butir. Konfirmasi selalu di dalam halaman
 * (Modal), tidak pernah window.confirm/alert.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BATAS_KUSTOM, type JenisLangkahKustom, type SoalKustom } from '@shared/bankSoal';
import { Icon } from '../../art/Icon';
import { t, useBahasa } from '../../i18n';
import { JENIS_GAMBAR, pesanGalatBank, pinSalah, simpanSoal, unggahGambar, type GagalBank } from '../../state/bank';
import { lupakanPin } from '../../state/store';
import { Modal, Pesan, TombolKonfirmasi } from '../../ui/kit';
import {
  BATAS_LAIN,
  DAFTAR_JENIS,
  DAFTAR_PRODUK,
  DAFTAR_TINGKAT,
  bacaAngka,
  drafDari,
  drafKosong,
  idBaru,
  langkahKosong,
  periksaDraf,
  soalDariDraf,
  type DrafLangkah,
  type DrafSoal,
  type GalatIsian,
} from './drafSoal';
import { BatangTingkat } from './lencana';
import { PinPanitia } from './PinPanitia';
import { PratinjauSoal } from './PratinjauSoal';
import './bank.css';

const idIsian = (alamat: string) => `bank-f-${alamat.replace(/\./g, '-')}`;

// ------------------------------------------------------------------ isian teks

function TeksGalat({ id, galat }: { id: string; galat: GalatIsian | undefined }) {
  if (!galat) return null;
  return (
    <p id={id} className="bank-galat" role="alert">
      <Icon name="silang" size={14} /> {t(galat.kunci, galat.param)}
    </p>
  );
}

function Isian({
  alamat,
  label,
  ket,
  nilai,
  maks,
  galat,
  baris,
  placeholder,
  inputMode,
  onUbah,
  onSentuh,
}: {
  alamat: string;
  label: string;
  ket?: ReactNode;
  nilai: string;
  /** Batas karakter: tampil sebagai hitungan "n/maks". */
  maks?: number;
  galat: GalatIsian | undefined;
  /** > 0 = textarea setinggi itu. */
  baris?: number;
  placeholder?: string;
  inputMode?: 'numeric' | 'decimal';
  onUbah: (v: string) => void;
  onSentuh: (alamat: string) => void;
}) {
  const id = idIsian(alamat);
  const n = nilai.length;
  const jelas = [ket ? `${id}-ket` : '', galat ? `${id}-galat` : ''].filter(Boolean).join(' ') || undefined;
  const umum = {
    id,
    className: 'kolom',
    value: nilai,
    maxLength: maks,
    placeholder,
    'aria-invalid': galat ? true : undefined,
    'aria-describedby': jelas,
    onBlur: () => onSentuh(alamat),
  };
  return (
    <div className="bank-isian">
      <div className="bank-isian-kepala">
        <label htmlFor={id}>{label}</label>
        {maks ? (
          <span className={'bank-hitung' + (n >= maks ? ' bank-hitung-penuh' : '')} aria-hidden>
            {t('bank.hitung', { n, maks })}
          </span>
        ) : null}
      </div>
      {baris ? (
        <textarea {...umum} rows={baris} onChange={(e) => onUbah(e.target.value)} />
      ) : (
        <input {...umum} type="text" inputMode={inputMode} autoComplete="off" onChange={(e) => onUbah(e.target.value)} />
      )}
      {ket ? (
        <p id={`${id}-ket`} className="bank-ket">
          {ket}
        </p>
      ) : null}
      <TeksGalat id={`${id}-galat`} galat={galat} />
    </div>
  );
}

/** Pilihan tunggal berupa deret tombol (teks + tanda centang; tidak hanya warna). */
function Segmen<T extends string | number>({
  label,
  pilihan,
  nilai,
  teks,
  hias,
  onPilih,
}: {
  label: string;
  pilihan: readonly T[];
  nilai: T;
  teks: (v: T) => string;
  hias?: (v: T) => ReactNode;
  onPilih: (v: T) => void;
}) {
  return (
    <div className="bank-isian" role="group" aria-label={label}>
      <div className="bank-isian-kepala">
        <span className="bank-label">{label}</span>
      </div>
      <div className="bank-segmen">
        {pilihan.map((v) => (
          <button key={String(v)} type="button" aria-pressed={v === nilai} onClick={() => onPilih(v)}>
            {v === nilai ? <span aria-hidden>✓</span> : null}
            {hias?.(v)}
            {teks(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ satu pertanyaan

function IsianLangkah({
  langkah,
  indeks,
  bisaHapus,
  galat,
  onUbah,
  onHapus,
  onSentuh,
}: {
  langkah: DrafLangkah;
  indeks: number;
  bisaHapus: boolean;
  galat: (alamat: string) => GalatIsian | undefined;
  onUbah: (patch: Partial<DrafLangkah>) => void;
  onHapus: () => void;
  onSentuh: (alamat: string) => void;
}) {
  const a = `steps.${indeks}`;
  const s = langkah;
  const berisi = Boolean(s.prompt.trim() || s.penjelasan.trim() || s.options.some((o) => o.label.trim()) || s.nilai.trim());

  const gantiJenis = (kind: JenisLangkahKustom) => {
    if (kind === s.kind) return;
    // Pilih satu hanya boleh punya satu tanda benar: pertahankan yang pertama.
    onUbah({ kind, benar: kind === 'single' ? s.benar.slice(0, 1) : s.benar });
  };

  const tandai = (idOpsi: string, benar: boolean) => {
    if (s.kind === 'single') onUbah({ benar: benar ? [idOpsi] : [] });
    else onUbah({ benar: benar ? [...s.benar.filter((x) => x !== idOpsi), idOpsi] : s.benar.filter((x) => x !== idOpsi) });
    onSentuh(`${a}.benar`);
  };

  const nilaiTerbaca = bacaAngka(s.nilai);
  const galatBenar = galat(`${a}.benar`);

  return (
    <div className="bank-langkah" role="group" aria-label={t('bank.tJudul', { n: indeks + 1 })}>
      <div className="bank-langkah-kepala">
        <h4>{t('bank.tJudul', { n: indeks + 1 })}</h4>
        {bisaHapus ? (
          berisi ? (
            <TombolKonfirmasi
              label={t('bank.tHapus')}
              kelas="btn btn-netral bank-btn"
              judul={t('bank.tHapusJudul', { n: indeks + 1 })}
              pesan={t('bank.tHapusPesan')}
              labelSetuju={t('bank.hapusSetuju')}
              onSetuju={onHapus}
            />
          ) : (
            <button type="button" className="btn btn-netral bank-btn" onClick={onHapus}>
              {t('bank.tHapus')}
            </button>
          )
        ) : null}
      </div>

      <Segmen
        label={t('bank.tJenis')}
        pilihan={DAFTAR_JENIS}
        nilai={s.kind}
        teks={(k) => t(`bank.jenis.${k}`)}
        onPilih={gantiJenis}
      />

      <Isian
        alamat={`${a}.prompt`}
        label={t('bank.tTeks')}
        nilai={s.prompt}
        maks={BATAS_KUSTOM.prompt}
        baris={2}
        galat={galat(`${a}.prompt`)}
        onUbah={(prompt) => onUbah({ prompt })}
        onSentuh={onSentuh}
      />

      {s.kind === 'number' ? (
        <>
          <Segmen
            label={t('bank.tFormat')}
            pilihan={['angka', 'rupiah'] as const}
            nilai={s.format}
            teks={(f) => t(`bank.format.${f}`)}
            onPilih={(format) => onUbah({ format })}
          />
          <div className="bank-dua">
            <Isian
              alamat={`${a}.nilai`}
              label={t('bank.tNilai')}
              nilai={s.nilai}
              inputMode="decimal"
              galat={galat(`${a}.nilai`)}
              ket={Number.isFinite(nilaiTerbaca) && s.nilai.trim() ? t('bank.dibacaSebagai', { angka: nilaiTerbaca.toLocaleString('id-ID') }) : undefined}
              onUbah={(nilai) => onUbah({ nilai })}
              onSentuh={onSentuh}
            />
            <Isian
              alamat={`${a}.toleransi`}
              label={t('bank.tToleransi')}
              nilai={s.toleransi}
              inputMode="decimal"
              galat={galat(`${a}.toleransi`)}
              ket={t('bank.tToleransiKet')}
              onUbah={(toleransi) => onUbah({ toleransi })}
              onSentuh={onSentuh}
            />
            {s.format === 'angka' ? (
              <Isian
                alamat={`${a}.unit`}
                label={t('bank.tSatuan')}
                nilai={s.unit}
                maks={BATAS_LAIN.satuan}
                placeholder={t('bank.tSatuanContoh')}
                galat={galat(`${a}.unit`)}
                onUbah={(unit) => onUbah({ unit })}
                onSentuh={onSentuh}
              />
            ) : null}
          </div>
        </>
      ) : (
        <div className="bank-isian">
          <div className="bank-isian-kepala">
            <span className="bank-label">{t('bank.tOpsi')}</span>
            <span className="bank-hitung" aria-hidden>
              {t('bank.hitung', { n: s.options.length, maks: BATAS_KUSTOM.opsiMaks })}
            </span>
          </div>
          <p className="bank-ket">{t(s.kind === 'single' ? 'bank.tTandaiSatu' : 'bank.tTandaiBeberapa')}</p>
          <ul className="bank-opsi" id={idIsian(`${a}.benar`)} tabIndex={-1}>
            {s.options.map((o, j) => {
              const alamat = `${a}.options.${j}`;
              const id = idIsian(alamat);
              const benar = s.benar.includes(o.id);
              const g = galat(alamat);
              return (
                <li key={o.id} className={'bank-opsi-baris' + (benar ? ' bank-opsi-benar' : '')}>
                  <label className="bank-tanda">
                    <input
                      type={s.kind === 'single' ? 'radio' : 'checkbox'}
                      name={`bank-benar-${s.id}`}
                      checked={benar}
                      aria-label={t('bank.tBenarAria', { n: j + 1 })}
                      onChange={(e) => tandai(o.id, e.target.checked)}
                    />
                    {t('bank.tBenar')}
                  </label>
                  <div className="bank-opsi-tengah">
                    <input
                      id={id}
                      className="kolom"
                      type="text"
                      autoComplete="off"
                      value={o.label}
                      maxLength={BATAS_KUSTOM.opsi}
                      placeholder={t('bank.tOpsiKe', { n: j + 1 })}
                      aria-label={t('bank.tOpsiKe', { n: j + 1 })}
                      aria-invalid={g ? true : undefined}
                      aria-describedby={g ? `${id}-galat` : undefined}
                      onChange={(e) => onUbah({ options: s.options.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)) })}
                      onBlur={() => onSentuh(alamat)}
                    />
                    <div className="bank-opsi-kaki">
                      <TeksGalat id={`${id}-galat`} galat={g} />
                      <span className={'bank-hitung' + (o.label.length >= BATAS_KUSTOM.opsi ? ' bank-hitung-penuh' : '')} style={{ marginLeft: 'auto' }} aria-hidden>
                        {t('bank.hitung', { n: o.label.length, maks: BATAS_KUSTOM.opsi })}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="bank-ikon-btn bank-ikon-btn-bahaya"
                    disabled={s.options.length <= BATAS_KUSTOM.opsiMin}
                    aria-label={t('bank.tHapusOpsi', { n: j + 1 })}
                    title={t('bank.tHapusOpsi', { n: j + 1 })}
                    onClick={() => onUbah({ options: s.options.filter((x) => x.id !== o.id), benar: s.benar.filter((x) => x !== o.id) })}
                  >
                    <span aria-hidden>✕</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <TeksGalat id={`${idIsian(`${a}.benar`)}-galat`} galat={galatBenar} />
          <div className="bank-kaki">
            <button
              type="button"
              className="btn btn-garis bank-btn"
              disabled={s.options.length >= BATAS_KUSTOM.opsiMaks}
              onClick={() => onUbah({ options: [...s.options, { id: idBaru('o', s.options.map((o) => o.id)), label: '' }] })}
            >
              + {t('bank.tTambahOpsi')}
            </button>
          </div>
        </div>
      )}

      <Isian
        alamat={`${a}.hint`}
        label={t('bank.tPetunjuk')}
        nilai={s.hint}
        maks={BATAS_KUSTOM.prompt}
        galat={galat(`${a}.hint`)}
        onUbah={(hint) => onUbah({ hint })}
        onSentuh={onSentuh}
      />
      <Isian
        alamat={`${a}.penjelasan`}
        label={t('bank.tPenjelasan')}
        ket={t('bank.tPenjelasanKet')}
        nilai={s.penjelasan}
        maks={BATAS_KUSTOM.penjelasan}
        baris={3}
        galat={galat(`${a}.penjelasan`)}
        onUbah={(penjelasan) => onUbah({ penjelasan })}
        onSentuh={onSentuh}
      />
    </div>
  );
}

// ------------------------------------------------------------------ editor

type StatusUnggah = { jenis: 'diam' | 'proses' | 'ok' } | { jenis: 'galat'; pesan: string };
type StatusTambah = { jenis: 'diam' | 'proses' | 'gagal' } | { jenis: 'ok'; posisi: number };

export function EditorSoal({
  awal,
  butuhPin,
  bisaTambah,
  penuh,
  diPlaylist,
  onTambah,
  onTersimpan,
  onTutup,
}: {
  /** null = soal baru. */
  awal: SoalKustom | null;
  butuhPin: boolean;
  /** Playlist room masih bisa diubah (lobby). */
  bisaTambah: boolean;
  penuh: boolean;
  diPlaylist: (id: string) => boolean;
  onTambah: (id: string) => Promise<{ ok: boolean; posisi?: number }>;
  onTersimpan: (soal: SoalKustom) => void;
  onTutup: () => void;
}) {
  useBahasa();
  const [draf, setDraf] = useState<DrafSoal>(() => (awal ? drafDari(awal) : drafKosong()));
  const bersih = useRef(JSON.stringify(draf));
  const [dicoba, setDicoba] = useState(false);
  const [sentuh, setSentuh] = useState<Record<string, true>>({});
  const [menyimpan, setMenyimpan] = useState(false);
  const [galatSimpan, setGalatSimpan] = useState<GagalBank | null>(null);
  const [pinDitolak, setPinDitolak] = useState(false);
  const [hasil, setHasil] = useState<SoalKustom | null>(null);
  const [tambah, setTambah] = useState<StatusTambah>({ jenis: 'diam' });
  const [unggah, setUnggah] = useState<StatusUnggah>({ jenis: 'diam' });
  const [lokal, setLokal] = useState<{ src: string; url: string } | null>(null);
  const [tab, setTab] = useState<'isi' | 'pratinjau'>('isi');
  const [tanyaTutup, setTanyaTutup] = useState(false);
  const berkasRef = useRef<HTMLInputElement>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);

  const semuaGalat = useMemo(() => periksaDraf(draf), [draf]);
  const jumlahGalat = Object.keys(semuaGalat).length;
  const galat = (alamat: string): GalatIsian | undefined => (dicoba || sentuh[alamat] ? semuaGalat[alamat] : undefined);
  const tandaiSentuh = (alamat: string) => setSentuh((s) => (s[alamat] ? s : { ...s, [alamat]: true }));
  const kotor = JSON.stringify(draf) !== bersih.current;

  const ubah = (patch: Partial<DrafSoal>) => setDraf((d) => ({ ...d, ...patch }));
  const ubahLangkah = (i: number, patch: Partial<DrafLangkah>) =>
    setDraf((d) => ({ ...d, steps: d.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  const mintaTutup = () => {
    if (kotor && !hasil) setTanyaTutup(true);
    else onTutup();
  };
  const mintaTutupRef = useRef(mintaTutup);
  mintaTutupRef.current = mintaTutup;

  // Panel penuh: halaman di belakangnya tidak ikut bergulir / terfokus selama editor terbuka.
  useEffect(() => {
    const akar = document.getElementById('root');
    const gulirLama = document.body.style.overflow;
    const pemicu = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    akar?.setAttribute('inert', '');
    judulRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Dialog konfirmasi di atas editor (Modal) menangani Escape-nya sendiri.
      if (document.querySelector('.bank-editor [role="dialog"]')) return;
      mintaTutupRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = gulirLama;
      akar?.removeAttribute('inert');
      window.removeEventListener('keydown', onKey);
      // Kembalikan fokus ke tombol yang membuka editor (bila masih ada di halaman).
      if (pemicu?.isConnected) pemicu.focus();
    };
  }, []);

  // Pratinjau lokal gambar yang baru diunggah (tidak menunggu server menyajikannya).
  useEffect(() => {
    if (!lokal) return;
    return () => URL.revokeObjectURL(lokal.url);
  }, [lokal]);

  const urlGambar = draf.image ? (lokal && lokal.src === draf.image.src ? lokal.url : draf.image.src) : null;

  const pilihBerkas = async (berkas: File | undefined) => {
    if (!berkas) return;
    if (!(JENIS_GAMBAR as readonly string[]).includes(berkas.type)) return setUnggah({ jenis: 'galat', pesan: t('bank.gJenisSalah') });
    if (berkas.size > BATAS_KUSTOM.gambarMaks) {
      return setUnggah({ jenis: 'galat', pesan: t('bank.gTerlaluBesar', { mb: (berkas.size / (1024 * 1024)).toFixed(1) }) });
    }
    setUnggah({ jenis: 'proses' });
    const h = await unggahGambar(berkas);
    if (!h.ok) {
      if (butuhPin && pinSalah(h)) {
        lupakanPin();
        setPinDitolak(true);
      }
      return setUnggah({ jenis: 'galat', pesan: t('bank.gGagal', { alasan: pesanGalatBank(h) }) });
    }
    setLokal({ src: h.data, url: URL.createObjectURL(berkas) });
    setDraf((d) => ({ ...d, image: { src: h.data, alt: d.image?.alt ?? '' } }));
    setUnggah({ jenis: 'ok' });
  };

  const simpan = async () => {
    setGalatSimpan(null);
    if (jumlahGalat > 0) {
      setDicoba(true);
      setTab('isi');
      const pertama = Object.keys(semuaGalat)[0];
      // Tunggu tab "Isi" tampil dulu (layar sempit), baru fokus ke isian pertama yang bermasalah.
      requestAnimationFrame(() => {
        const el = pertama ? document.getElementById(idIsian(pertama)) : null;
        el?.scrollIntoView({ block: 'center' });
        el?.focus({ preventScroll: true });
      });
      return;
    }
    setMenyimpan(true);
    const h = await simpanSoal(soalDariDraf(draf));
    setMenyimpan(false);
    if (!h.ok) {
      if (butuhPin && pinSalah(h)) {
        lupakanPin();
        setPinDitolak(true);
      }
      return setGalatSimpan(h);
    }
    bersih.current = JSON.stringify(draf);
    setHasil(h.data);
    setTambah({ jenis: 'diam' });
    onTersimpan(h.data);
  };

  const tambahKePlaylist = async () => {
    if (!hasil) return;
    setTambah({ jenis: 'proses' });
    const h = await onTambah(hasil.id);
    setTambah(h.ok ? { jenis: 'ok', posisi: h.posisi ?? 0 } : { jenis: 'gagal' });
  };

  const buatLagi = () => {
    const kosong = drafKosong();
    bersih.current = JSON.stringify(kosong);
    setDraf(kosong);
    setHasil(null);
    setDicoba(false);
    setSentuh({});
    setUnggah({ jenis: 'diam' });
    setTab('isi');
  };

  const judulPanel = draf.id ? t('bank.editorUbah') : t('bank.editorBaru');

  return createPortal(
    <div className="bank-editor" role="dialog" aria-modal="true" aria-labelledby="bank-editor-judul">
      <div className="bank-editor-atas">
        <h2 id="bank-editor-judul" ref={judulRef} tabIndex={-1} style={{ outline: 'none' }}>
          {judulPanel}
        </h2>
        {!hasil ? (
          <div className="bank-tab" role="group" aria-label={t('bank.tabAria')}>
            <button type="button" aria-pressed={tab === 'isi'} onClick={() => setTab('isi')}>
              {t('bank.tabIsi')}
            </button>
            <button type="button" aria-pressed={tab === 'pratinjau'} onClick={() => setTab('pratinjau')}>
              {t('bank.pratinjau')}
            </button>
          </div>
        ) : null}
        <button type="button" className="btn btn-netral bank-btn" onClick={mintaTutup}>
          {t('layar.tutup')}
        </button>
      </div>

      <div className="bank-editor-gulir">
        {hasil ? (
          <div className="bank-selesai" role="status">
            <span className="bank-selesai-cek" aria-hidden>
              <Icon name="cek" size={40} />
            </span>
            <h3 style={{ margin: 0 }}>{t('bank.tersimpanJudul')}</h3>
            <p style={{ margin: 0 }}>{t('bank.tersimpanKet', { judul: hasil.title })}</p>

            {tambah.jenis === 'ok' ? (
              <Pesan jenis="sukses">{t('bank.ditambahkan', { n: tambah.posisi })}</Pesan>
            ) : diPlaylist(hasil.id) ? (
              <Pesan jenis="info">{t('bank.sudahDiPlaylist')}</Pesan>
            ) : !bisaTambah ? (
              <Pesan jenis="info">{t('bank.tambahNanti')}</Pesan>
            ) : penuh ? (
              <Pesan jenis="kuning">{t('bank.penuhSingkat')}</Pesan>
            ) : null}
            {tambah.jenis === 'gagal' ? <Pesan jenis="error">{t('bank.tambahGagal')}</Pesan> : null}

            <div className="bank-kaki">
              {bisaTambah && !penuh && !diPlaylist(hasil.id) && tambah.jenis !== 'ok' ? (
                <button type="button" className="btn btn-utama" disabled={tambah.jenis === 'proses'} onClick={() => void tambahKePlaylist()}>
                  {tambah.jenis === 'proses' ? t('bank.statusMenyimpan') : t('bank.tambahKePlaylist')}
                </button>
              ) : null}
              <button type="button" className="btn btn-garis bank-btn" onClick={buatLagi}>
                {t('bank.buatLagi')}
              </button>
              <button type="button" className="btn btn-netral bank-btn" onClick={onTutup}>
                {t('bank.selesai')}
              </button>
            </div>
            <p className="bank-catatan">{t('bank.catatanSolo')}</p>
          </div>
        ) : (
          <div className="bank-editor-badan" data-tab={tab}>
            <div className="bank-kolom-isi">
              {/* ------------------------------------------------ 1. tentang soal */}
              <section className="bank-kartu" aria-labelledby="bank-bag-1">
                <h3 id="bank-bag-1">
                  <span className="bank-kartu-no" aria-hidden>
                    1
                  </span>
                  {t('bank.bagianInfo')}
                </h3>
                <Isian
                  alamat="title"
                  label={t('bank.fJudul')}
                  nilai={draf.title}
                  maks={BATAS_KUSTOM.judul}
                  galat={galat('title')}
                  onUbah={(title) => ubah({ title })}
                  onSentuh={tandaiSentuh}
                />
                <div className="bank-dua">
                  <div className="bank-isian">
                    <div className="bank-isian-kepala">
                      <label htmlFor="bank-f-product">{t('bank.fProduk')}</label>
                    </div>
                    <select
                      id="bank-f-product"
                      className="kolom bank-pilih"
                      value={draf.product}
                      onChange={(e) => ubah({ product: DAFTAR_PRODUK.find((p) => p === e.target.value) ?? 'MIX' })}
                    >
                      {DAFTAR_PRODUK.map((p) => (
                        <option key={p} value={p}>
                          {t(`bank.produk.${p}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Isian
                    alamat="durasi"
                    label={t('bank.fDurasi')}
                    ket={t('bank.fDurasiKet', { min: BATAS_KUSTOM.durasiMin, maks: BATAS_KUSTOM.durasiMaks })}
                    nilai={draf.durasi}
                    inputMode="numeric"
                    galat={galat('durasi')}
                    onUbah={(durasi) => ubah({ durasi: durasi.replace(/[^\d]/g, '').slice(0, 3) })}
                    onSentuh={tandaiSentuh}
                  />
                </div>
                <Segmen
                  label={t('bank.fTingkat')}
                  pilihan={DAFTAR_TINGKAT}
                  nilai={draf.tingkat}
                  teks={(n) => t(`bank.tingkat${n}`)}
                  hias={(n) => <BatangTingkat tingkat={n} />}
                  onPilih={(tingkat) => ubah({ tingkat })}
                />
                <Isian
                  alamat="story"
                  label={t('bank.fCerita')}
                  ket={t('bank.fCeritaKet')}
                  nilai={draf.story}
                  maks={BATAS_KUSTOM.cerita}
                  baris={4}
                  galat={galat('story')}
                  onUbah={(story) => ubah({ story })}
                  onSentuh={tandaiSentuh}
                />
                <Isian
                  alamat="instruction"
                  label={t('bank.fTugas')}
                  ket={t('bank.fTugasKet')}
                  nilai={draf.instruction}
                  maks={BATAS_KUSTOM.tugas}
                  baris={2}
                  galat={galat('instruction')}
                  onUbah={(instruction) => ubah({ instruction })}
                  onSentuh={tandaiSentuh}
                />
                <Isian
                  alamat="learning"
                  label={t('bank.fPelajaran')}
                  ket={t('bank.fPelajaranKet')}
                  nilai={draf.learning}
                  maks={BATAS_KUSTOM.pelajaran}
                  baris={2}
                  galat={galat('learning')}
                  onUbah={(learning) => ubah({ learning })}
                  onSentuh={tandaiSentuh}
                />
              </section>

              {/* ------------------------------------------------ 2. gambar */}
              <section className="bank-kartu" aria-labelledby="bank-bag-2">
                <h3 id="bank-bag-2">
                  <span className="bank-kartu-no" aria-hidden>
                    2
                  </span>
                  {t('bank.bagianGambar')}
                </h3>
                <div className="bank-gambar">
                  <div className={'bank-bingkai' + (urlGambar ? ' bank-bingkai-isi' : '')}>
                    {urlGambar ? <img src={urlGambar} alt={draf.image?.alt || t('bank.gPratinjauAlt')} /> : <span>{t('bank.gTanpa')}</span>}
                  </div>
                  <div className="bank-gambar-sisi">
                    <input
                      ref={berkasRef}
                      className="bank-berkas"
                      type="file"
                      hidden
                      tabIndex={-1}
                      accept={JENIS_GAMBAR.join(',')}
                      onChange={(e) => {
                        void pilihBerkas(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                    <div className="bank-kaki">
                      <button type="button" className="btn bank-btn" disabled={unggah.jenis === 'proses'} onClick={() => berkasRef.current?.click()}>
                        {unggah.jenis === 'proses' ? t('bank.gMengunggah') : draf.image ? t('bank.gGanti') : t('bank.gUnggah')}
                      </button>
                      {draf.image ? (
                        <button
                          type="button"
                          className="btn btn-netral bank-btn"
                          onClick={() => {
                            ubah({ image: null });
                            setUnggah({ jenis: 'diam' });
                          }}
                        >
                          {t('bank.gLepas')}
                        </button>
                      ) : null}
                    </div>
                    <div role="status" aria-live="polite">
                      {unggah.jenis === 'ok' ? (
                        <span className="bank-status bank-status-tersimpan">
                          <Icon name="cek" size={15} /> {t('bank.gTerunggah')}
                        </span>
                      ) : null}
                      {unggah.jenis === 'galat' ? (
                        <p className="bank-galat">
                          <Icon name="silang" size={14} /> {unggah.pesan}
                        </p>
                      ) : null}
                    </div>
                    <p className="bank-ket">{t('bank.gSyarat')}</p>
                    <p className="bank-catatan-kotak">
                      <Icon name="foto" size={16} /> <span>{t('bank.gDesainer')}</span>
                    </p>
                  </div>
                </div>
                {draf.image ? (
                  <Isian
                    alamat="image.alt"
                    label={t('bank.gAlt')}
                    ket={t('bank.gAltKet')}
                    nilai={draf.image.alt}
                    maks={BATAS_LAIN.alt}
                    baris={2}
                    galat={galat('image.alt')}
                    onUbah={(alt) => setDraf((d) => (d.image ? { ...d, image: { ...d.image, alt } } : d))}
                    onSentuh={tandaiSentuh}
                  />
                ) : null}
              </section>

              {/* ------------------------------------------------ 3. pertanyaan */}
              <section className="bank-kartu" aria-labelledby="bank-bag-3">
                <h3 id="bank-bag-3">
                  <span className="bank-kartu-no" aria-hidden>
                    3
                  </span>
                  {t('bank.bagianTanya')}
                </h3>
                {draf.steps.map((s, i) => (
                  <IsianLangkah
                    key={s.id}
                    langkah={s}
                    indeks={i}
                    bisaHapus={draf.steps.length > 1}
                    galat={galat}
                    onUbah={(patch) => ubahLangkah(i, patch)}
                    onHapus={() => {
                      setDraf((d) => ({ ...d, steps: d.steps.filter((x) => x.id !== s.id) }));
                      setSentuh({});
                    }}
                    onSentuh={tandaiSentuh}
                  />
                ))}
                <div className="bank-kaki">
                  <button
                    type="button"
                    className="btn btn-garis bank-btn"
                    disabled={draf.steps.length >= BATAS_KUSTOM.langkahMaks}
                    onClick={() => setDraf((d) => ({ ...d, steps: [...d.steps, langkahKosong(d.steps.map((x) => x.id))] }))}
                  >
                    + {t('bank.tTambah')}
                  </button>
                  <span className="bank-catatan">{t('bank.tMaks', { n: draf.steps.length, maks: BATAS_KUSTOM.langkahMaks })}</span>
                </div>
              </section>
            </div>

            <aside className="bank-kolom-pratinjau" aria-labelledby="bank-pv-judul">
              <div className="stack-s" style={{ marginBottom: 10 }}>
                <h3 id="bank-pv-judul" style={{ margin: 0 }}>
                  {t('bank.pratinjau')}
                </h3>
                <p className="bank-catatan">{t('bank.pratinjauKet')}</p>
              </div>
              <PratinjauSoal draf={draf} urlGambar={urlGambar} />
            </aside>
          </div>
        )}
      </div>

      {!hasil ? (
        <div className="bank-editor-bawah">
          <div className="bank-editor-pesan" role="status" aria-live="polite">
            {galatSimpan ? (
              <Pesan jenis="error" onTutup={() => setGalatSimpan(null)}>
                {galatSimpan.rincian.length > 0 ? t('bank.galatServer') : pesanGalatBank(galatSimpan)}
                {galatSimpan.rincian.length > 0 ? (
                  <ul className="bank-rincian">
                    {galatSimpan.rincian.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : null}
              </Pesan>
            ) : dicoba && jumlahGalat > 0 ? (
              <span className="bank-galat">
                <Icon name="silang" size={14} /> {t('bank.vRingkas', { n: jumlahGalat })}
              </span>
            ) : kotor ? (
              <span className="lembut">{t('bank.belumDisimpan')}</span>
            ) : null}
            {pinDitolak && butuhPin ? <PinPanitia ditolak onTersimpan={() => setPinDitolak(false)} /> : null}
          </div>
          <button type="button" className="btn btn-utama" disabled={menyimpan || unggah.jenis === 'proses'} onClick={() => void simpan()}>
            {menyimpan ? t('bank.statusMenyimpan') : t('bank.simpanSoal')}
          </button>
        </div>
      ) : null}

      {tanyaTutup ? (
        <Modal
          judul={t('bank.buangJudul')}
          onTutup={() => setTanyaTutup(false)}
          aksi={
            <>
              <button type="button" className="btn btn-netral" onClick={() => setTanyaTutup(false)}>
                {t('bank.lanjutEdit')}
              </button>
              <button type="button" className="btn btn-bahaya" onClick={onTutup}>
                {t('bank.buangSetuju')}
              </button>
            </>
          }
        >
          <p>{t('bank.buangPesan')}</p>
        </Modal>
      ) : null}
    </div>,
    document.body,
  );
}
