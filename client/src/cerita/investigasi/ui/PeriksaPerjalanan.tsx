/**
 * T-091 / T-092 (Designer): PERIKSA PERJALANAN (Investigator kasus 2 "Malam di Jalan Melati"): satu-satunya penyelidikan kasus ini.
 * T-092 (pemilik: "redesign ... not confusing"): layar digambar ulang supaya tamu 29-60 tahun paham dalam sekali lihat:
 *   SUMBER       dua keping kecil BERLABEL, "Struk perjalanan" dan "Formulir kejadian", dengan tanggal dan pelat nomor yang sama
 *                (centang di tiap nilai, lencana "cocok"); penumpang = "Penumpang: disembunyikan" + gembok (tanpa mosaik);
 *   GARIS WAKTU  tokoh utama layar: 21:05 "Penumpang naik" ... [tempat kosong putus-putus] ... 21:24 "Perjalanan ditutup"
 *                (HP: tegak; lebar >= 600: mendatar);
 *   KARTU        "21:18 Benturan · dari formulir kejadian" (ikon percikan), satu keping jingga di bawah garis waktu.
 * Cara main: ketuk kartu (terangkat), lalu ketuk tempat kosong; atau SERET kartu ke tempat kosong; atau langsung ketuk tempat
 * kosong. Seretan yang dilepas di luar tempat kosong = kartu bergeleng + kalimat petunjuk; tamu tidak pernah terhenti.
 * Sesudah ditaruh: kartu menyala di garis waktu dan kalimat perintah berganti temuan yang menyala hijau:
 * "Jam 21:18 penumpang masih di dalam mobil." Lalu "Simpan hasil pemeriksaan" -> onSelesai.
 *
 * Kontrak (LayarInvestigasi, tidak berubah): `{ onSelesai, awal?, onLangkah? }`. Langkah yang disimpan: 0 = kartu di baki,
 * 1 = kartu sudah diangkat (`awal` >= 1 dari simpanan lama juga dibaca begitu); `onLangkah(1)` dipanggil saat kartu diangkat.
 * TEKS: judul, nama dua sumber, dan tombol simpan = kunci naskah kasus lewat `useTx()` (`inv2.jalan.*`); kata layar ini sendiri di
 * kamus `investigasi` (`jalan.*`, id / en / zh). Jam, tanggal, dan pelat nomor = angka fiktif yang sama di semua bahasa.
 * Aplikasinya FIKTIF: ubin ungu tanpa nama, logo, atau warna merek mana pun.
 * Ukur 360 x 640 (hitung; ruang isi 544): kemajuan 20 + perintah 64 + sumber 100 + garis waktu 176 + baki 60 + tombol 56 +
 * jarak 5 x 8 = 516 px. Tata letak lentur (tanpa koordinat tetap); lebar >= 600: kolom paling lebar 600 px, garis waktu mendatar.
 * Gerak dikurangi: tanpa ajakan / luncur / kilau; keadaan akhir langsung tampil.
 */
import { useRef, useState, type CSSProperties, type PointerEvent as PE } from 'react';
import { playSfx } from '../../../audio/audio';
import { t } from '../../../i18n';
import { IkonInv, useTx } from './dasar';
import './investigasi.css';
import './bukti-adegan.css';
import './kasus2.css';

/** Angka fiktif kasus 2, sama di id / en / zh (dipakai juga oleh kartu polis). */
export const TANGGAL_KASUS2 = '14/11/2026';
export const PELAT_KASUS2 = 'B 1870 RKS';
const JAM = { naik: '21:05', benturan: '21:18', tutup: '21:24' } as const;

/** 0 = kartu di baki, 1 = kartu diangkat, 2 = kartu sudah di garis waktu. */
type Tahap = 0 | 1 | 2;

function Sumber({ jenis, nama }: { jenis: 'struk' | 'formulir'; nama: string }) {
  return (
    <div className="pj-chip" {...(jenis === 'struk' ? { 'data-struk': '' } : { 'data-formulir': '' })}>
      <b><IkonInv nama={jenis === 'struk' ? 'aplikasi' : 'buku'} kali={1} />{nama}</b>
      <span><span className="pj-tanggal"><span className="sr-only">{t('investigasi.jalan.tanggal')} </span>{TANGGAL_KASUS2}</span></span>
      <span><span className="pj-pelat"><span className="sr-only">{t('investigasi.jalan.pelat')} </span>{PELAT_KASUS2}</span></span>
    </div>
  );
}

function IsiKartu() {
  return (
    <>
      <IkonInv nama="benturan" kali={2} />
      <b>{JAM.benturan}</b>
      <span>{t('investigasi.jalan.benturan')}<small>{t('investigasi.jalan.dariForm')}</small></span>
    </>
  );
}

export function PeriksaPerjalanan({ onSelesai, awal = 0, onLangkah }: { onSelesai: () => void; awal?: number; onLangkah?: (langkah: number) => void }) {
  const tx = useTx();
  const [tahap, setTahap] = useState<Tahap>(() => (awal >= 1 ? 1 : 0));
  /** Hitungan lepasan keliru (kunci gelengan kartu; > 0 = kalimat petunjuk tampil). */
  const [salah, setSalah] = useState(0);
  const [geser, setGeser] = useState<{ x: number; y: number } | null>(null);
  const slot = useRef<HTMLButtonElement>(null);
  const seret = useRef<{ x: number; y: number; jalan: boolean } | null>(null);
  const lewatiKlik = useRef(false);

  const angkat = () => { if (tahap !== 0) return; playSfx('ketuk'); setTahap(1); onLangkah?.(1); };
  const taruh = () => { if (tahap === 2) return; playSfx('konfirmasi'); setSalah(0); setTahap(2); };
  const turun = (e: PE<HTMLButtonElement>) => { seret.current = { x: e.clientX, y: e.clientY, jalan: false }; };
  const gerak = (e: PE<HTMLButtonElement>) => {
    const s = seret.current; if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (!s.jalan && Math.hypot(dx, dy) < 8) return;
    if (!s.jalan) { s.jalan = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* penunjuk sudah lepas */ } if (tahap === 0) { setTahap(1); onLangkah?.(1); } }
    setGeser({ x: dx, y: dy });
  };
  const lepas = (e: PE<HTMLButtonElement>) => {
    const s = seret.current; seret.current = null;
    if (!s?.jalan) return;
    lewatiKlik.current = true; setGeser(null);
    const r = slot.current?.getBoundingClientRect();
    const kena = !!r && e.clientX >= r.left - 16 && e.clientX <= r.right + 16 && e.clientY >= r.top - 16 && e.clientY <= r.bottom + 16;
    if (kena) taruh(); else { playSfx('keliru'); setSalah((n) => n + 1); }
  };
  const klik = () => { if (lewatiKlik.current) { lewatiKlik.current = false; return; } angkat(); };

  const sudah = tahap === 2;
  const perintah = sudah ? t('investigasi.jalan.sukses') : salah ? t('investigasi.jalan.salah') : tahap === 1 ? t('investigasi.jalan.2.tanya') : t('investigasi.jalan.1.tanya');
  return (
    <section className="iv-layar pj" data-periksa-perjalanan="" data-tahap={tahap} data-sudah={sudah ? '' : undefined} aria-labelledby="pj-tanya">
      <p className="ps-kemajuan">
        <b>{tx('inv2.jalan.judul')}</b>
        <span aria-hidden="true">{[1, 2].map((i) => <i key={i} data-isi={tahap >= i ? '' : undefined} data-kini={tahap === i - 1 ? '' : undefined} />)}</span>
        <span className="sr-only">{t('investigasi.jalan.langkah', { n: Math.min(2, tahap + 1), total: 2 })}</span>
      </p>
      <h2 id="pj-tanya" className="iv-tanya pj-tanya" tabIndex={-1} data-cer-fokus="" aria-live="polite" data-sukses={sudah ? '' : undefined} data-salah={!sudah && salah ? '' : undefined}>{perintah}</h2>
      <div className="pj-sumber">
        <Sumber jenis="struk" nama={tx('inv2.jalan.struk')} />
        <Sumber jenis="formulir" nama={tx('inv2.jalan.form')} />
        <p className="pj-kaki">
          <span><IkonInv nama="kunci" kali={1} />{t('investigasi.jalan.penumpang')}</span>
          <span className="pj-cocok"><IkonInv nama="centang" kali={1} />{t('investigasi.jalan.cocok')}</span>
        </p>
      </div>
      <ol className="pj-garis" aria-label={t('investigasi.jalan.garis')}>
        <li className="pj-henti"><time>{JAM.naik}</time><span><IkonInv nama="naik" kali={1} />{t('investigasi.jalan.naik')}</span></li>
        <li className="pj-sela" data-isi={sudah ? '' : undefined}>
          {sudah
            ? <span className="pj-kartu" data-kejadian="" data-ditaruh=""><IsiKartu /></span>
            : <button ref={slot} type="button" className="pj-slot" data-tempat="tengah" data-siap={tahap === 1 ? '' : undefined} onClick={taruh}>{t('investigasi.jalan.taruh')}</button>}
        </li>
        <li className="pj-henti"><time>{JAM.tutup}</time><span><IkonInv nama="tutup" kali={1} />{t('investigasi.jalan.tutup')}</span></li>
      </ol>
      <div className="pj-baki">
        {sudah ? <p>{tx('inv2.jalan.l3.hasil')}</p> : (
          <button key={salah} type="button" className="pj-kartu" data-kartu-benturan="" aria-pressed={tahap === 1} data-seret={geser ? '' : undefined} data-salah={salah && !geser ? '' : undefined}
            style={geser ? ({ transform: `translate(${geser.x}px, ${geser.y}px)` } as CSSProperties) : undefined}
            onPointerDown={turun} onPointerMove={gerak} onPointerUp={lepas} onPointerCancel={() => { seret.current = null; setGeser(null); }} onClick={klik}>
            <IsiKartu />
          </button>
        )}
      </div>
      <button type="button" className="primary-action iv-tombol" data-jalan-lanjut="" disabled={!sudah} onClick={onSelesai}>{tx('inv2.jalan.selesai')}</button>
    </section>
  );
}
