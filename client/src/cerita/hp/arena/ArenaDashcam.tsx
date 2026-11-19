/**
 * T-065 (Episode 1 Dev "Kenalan Raksa", plan Task 2): POLA DASHCAM "Rekaman dashcam". Pengganti pertanyaan lajur di Episode 1 Dev:
 * rekaman piksel ~6 detik di jalan tol (gaya adegan lajur K08: jalan tampak atas, lalu lintas ke atas, 1 piksel seni = 1 px CSS):
 *   0.0-1.5 s  truk Episode 1 melaju di lajur 2, mobil kecil di lajur 3, truk kecil berhenti di bahu kiri (lampu hazard) mendekat;
 *   1.5-3.0 s  mobil kecil pindah dari lajur 3 ke lajur 2 tepat di depan truk;
 *   3.0-4.5 s  truk membanting setir ke kiri, menabrak pembatas dan truk kecil yang berhenti (sprite truk miring + serpihan);
 *   4.5-6.0 s  jalan berhenti; bingkai beku.
 * Lalu "Ketuk kendaraan yang memicu kejadian." Tiga sasaran ketuk (>= 48 px, cincin piksel saat fokus) baru aktif di bingkai beku;
 * ketukan selama rekaman berjalan diabaikan (tombolnya belum ada). "Putar lagi" selalu bisa. Gerak dikurangi: tiga bingkai diam
 * dengan "Lanjut" (bingkai 3 = bingkai beku), tetap bisa dijawab.
 * Hasil: `mobil` (konfig.tepat) pada ketukan pertama -> `bersih`; ketukan keliru -> petunjuk singkat + putar lagi; ketukan keliru
 * kedua -> `ragu` + penjelasan. Mobil yang diketuk sesudah satu kekeliruan = tepat tetapi dicatat `ragu`. Lalu alur Kirim biasa.
 *
 * KONTRAK (rencana Task 2 / Interfaces): konfig = KonfigArena pola 'dashcam' (cerita/tipe.ts, Task 1): { langkah; item; benda:
 * { id: 'mobil' | 'truk' | 'truk-kecil' }[]; tepat: 'mobil'; bersih; ragu }. Jawaban = tetapkan(jawaban, langkah, item, bersih | ragu)
 * (Auto 2 Dev: 'dashcam', 'rekaman'; cabang node kdash membaca akt:dashcam:taruh:rekaman:<bersih|ragu>).
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { playSfx } from '../../../audio/audio';
import { useReducedMotion } from '../../../hooks';
import { t } from '../../../i18n';
import '../../seni/aktivitas/piksel.css';
import jalanStrip from '../../seni/aktivitas/jalan/jalan-strip.png';
import trukAtas from '../../seni/aktivitas/jalan/truk-atas.png';
import mobilAtas from '../../seni/aktivitas/dashcam/mobil-atas.png';
import pembatas from '../../seni/aktivitas/dashcam/pembatas.png';
import serpih from '../../seni/aktivitas/dashcam/serpih.png';
import trukKecilMati from '../../seni/aktivitas/dashcam/truk-kecil-atas-mati.png';
import trukKecilNyala from '../../seni/aktivitas/dashcam/truk-kecil-atas-nyala.png';
import trukMiring from '../../seni/aktivitas/dashcam/truk-miring.png';
import { KeSlot, SlotKepalaArena } from '../cangkang';
import { TombolKirim } from '../bagianHp';
import { tetapkan } from './logika';
import type { PropsPola } from './pola';
import type { KonfigArena } from '../../tipe';
import './dashcam.css';

export type IdKendaraan = 'mobil' | 'truk' | 'truk-kecil';
/** Konfig arena dashcam = KonfigArena pola 'dashcam' di cerita/tipe.ts (Task 1, Fullstack): Interfaces + langkah & item misi sintetis. */
export type KonfigDashcam = Extract<KonfigArena, { pola: 'dashcam' }>;

type Tahap = 'putar' | 'pilih' | 'selesai';
/** Lama rekaman (md): animasi CSS 6 s; cadangan pewaktu sedikit lebih lama bila animationend tidak terpicu. */
const LAMA = 6000;

/** Sasaran ketuk di bingkai beku: px dari tepi kiri blok jalan (var --x0) dan dari atas adegan (236 tinggi). */
const SASARAN: Record<IdKendaraan, CSSProperties> = {
  mobil: { left: 'calc(var(--x0) + 82px)', top: 0, width: 48, height: 52 },
  'truk-kecil': { left: 'calc(var(--x0) + 3px)', top: 16, width: 48, height: 70 },
  truk: { left: 'calc(var(--x0) + 40px)', top: 96, width: 68, height: 114 },
};

export function ArenaPolaDashcam({ konfig, jawaban, ubah, labelKirim, onKirim }: PropsPola & { konfig: KonfigDashcam }) {
  const kurang = useReducedMotion();
  const [tahap, setTahap] = useState<Tahap>('putar');
  const [bingkai, setBingkai] = useState(kurang ? 1 : 0); // 0 = animasi; 1..3 = bingkai diam (gerak dikurangi)
  const [putaran, setPutaran] = useState(0);
  const [salah, setSalah] = useState(0);
  const [pesan, setPesan] = useState<{ kunci: string; jenis: 'tepat' | 'ragu' | 'jelaskan' } | null>(null);
  const [diketuk, setDiketuk] = useState<IdKendaraan | null>(null);
  const instruksiRef = useRef<HTMLParagraphElement>(null);
  const putarRef = useRef<HTMLButtonElement>(null);
  const lewatKeyboard = useRef(false);
  const fokus = useRef<'instruksi' | 'putar' | null>(null);

  // Rekaman berjalan: bingkai beku saat animasi truk selesai, cadangan pewaktu.
  useEffect(() => {
    if (tahap !== 'putar' || bingkai !== 0) return;
    const id = window.setTimeout(() => setTahap((x) => (x === 'putar' ? 'pilih' : x)), LAMA + 300);
    return () => window.clearTimeout(id);
  }, [tahap, bingkai, putaran]);
  useLayoutEffect(() => {
    if (!fokus.current) return;
    const el = fokus.current === 'putar' ? putarRef.current : instruksiRef.current;
    fokus.current = null;
    el?.focus({ preventScroll: true });
  });

  const putarLagi = () => {
    if (tahap === 'selesai') return;
    playSfx('ketuk');
    setPutaran((n) => n + 1);
    setDiketuk(null);
    if (kurang) { setBingkai(1); setTahap('putar'); } else { setBingkai(0); setTahap('putar'); }
    if (lewatKeyboard.current) fokus.current = 'instruksi';
  };
  const selesai = (alt: string) => { setTahap('selesai'); ubah(tetapkan(jawaban, konfig.langkah, konfig.item, alt)); };
  const ketuk = (id: IdKendaraan) => {
    if (tahap !== 'pilih') return;
    setDiketuk(id);
    if (id === konfig.tepat) {
      playSfx('konfirmasi');
      setPesan({ kunci: 'dashcam.tepat', jenis: 'tepat' });
      selesai(salah ? konfig.ragu : konfig.bersih);
      return;
    }
    playSfx('batal');
    if (salah >= 1) { setPesan({ kunci: 'dashcam.jelaskan', jenis: 'jelaskan' }); selesai(konfig.ragu); return; }
    setSalah(1);
    setPesan({ kunci: `dashcam.ragu.${id}`, jenis: 'ragu' });
    if (lewatKeyboard.current) fokus.current = 'putar';
  };

  const beku = tahap !== 'putar' || bingkai === 3;
  const keadaanBingkai = bingkai === 0 ? (tahap === 'putar' ? 'jalan' : '3') : String(bingkai);
  const instruksi = tahap === 'selesai' ? 'dashcam.selesai' : tahap === 'pilih' ? 'dashcam.tanya' : 'dashcam.tonton';
  const benda = new Set(konfig.benda.map((b) => b.id));

  return (
    <div className="hp-dashcam" data-tahap={tahap} data-salah={salah}
      onClickCapture={(e) => { lewatKeyboard.current = e.isTrusted && e.detail === 0; }}>
      <KeSlot ke={SlotKepalaArena}>
        <p ref={instruksiRef} tabIndex={-1} className="hp-instruksi-arena dc-instruksi" role="status" data-beres={tahap === 'selesai' ? '' : undefined}>
          {tahap === 'selesai' ? <span aria-hidden="true">✓ </span> : null}{t(instruksi)}
        </p>
      </KeSlot>
      <figure className="dc-adegan" data-bingkai={keadaanBingkai} data-beku={beku ? '' : undefined} aria-label={t('dashcam.judul')}
        style={{ '--jalan': `url(${jalanStrip})`, '--pembatas': `url(${pembatas})` } as CSSProperties}>
        <div className="dc-isi" key={putaran}>
          <span className="dc-pembatas" aria-hidden="true" />
          <span className="dc-jalan" aria-hidden="true" />
          <span className="dc-truk-kecil" aria-hidden="true" style={{ '--nyala': `url(${trukKecilNyala})`, '--mati': `url(${trukKecilMati})` } as CSSProperties} />
          <img className="dc-mobil" src={mobilAtas} alt="" aria-hidden="true" width={26} height={44} />
          <img className="dc-truk" src={trukAtas} alt="" aria-hidden="true" width={40} height={124}
            onAnimationEnd={(e) => { if (e.animationName.includes('dc-truk')) setTahap((x) => (x === 'putar' ? 'pilih' : x)); }} />
          <img className="dc-truk-miring" src={trukMiring} alt="" aria-hidden="true" width={75} height={133} />
          <img className="dc-serpih" src={serpih} alt="" aria-hidden="true" width={22} height={14} />
          {/* bingkai kamera: sudut, REKAM, kode waktu */}
          <span className="dc-sudut" aria-hidden="true" />
          <span className="dc-rekam" aria-hidden="true"><i />{t('dashcam.rekam')} 14:32</span>
          {tahap !== 'putar' ? (['mobil', 'truk-kecil', 'truk'] as const).filter((id) => benda.has(id)).map((id) => (
            <button key={id} type="button" className="dc-sasaran" data-kendaraan={id} style={SASARAN[id]} aria-label={t(`dashcam.benda.${id}`)}
              data-keadaan={diketuk === id ? (id === konfig.tepat ? 'tepat' : 'ragu') : undefined} disabled={tahap === 'selesai'} onClick={() => ketuk(id)} />
          )) : null}
        </div>
        {bingkai > 0 && tahap === 'putar' ? <figcaption className="dc-keterangan">{t('dashcam.bingkai', { n: bingkai })}: {t(`dashcam.bingkai.${bingkai}`)}</figcaption> : null}
      </figure>
      <div className="dc-kendali">
        {kurang && tahap === 'putar' && bingkai < 3 ? (
          <button type="button" className="dc-tombol" data-lanjut-bingkai="" onClick={() => { const n = bingkai + 1; setBingkai(n); if (n === 3) setTahap('pilih'); }}>{t('dashcam.lanjutBingkai')}</button>
        ) : null}
        <button ref={putarRef} type="button" className="dc-tombol dc-putar" data-putar="" disabled={tahap === 'selesai'} data-sorot={pesan?.jenis === 'ragu' ? '' : undefined} onClick={putarLagi}>
          <span aria-hidden="true">↻ </span>{t('dashcam.putar')}
        </button>
      </div>
      {pesan ? (
        <div className="dc-pesan" data-jenis={pesan.jenis} role="status">
          <p>{t(pesan.kunci)}</p>
          {pesan.jenis === 'tepat' ? <p className="dc-catatan">{t('dashcam.catatan')}</p> : null}
        </div>
      ) : null}
      <TombolKirim label={labelKirim} siap={tahap === 'selesai'} onKirim={onKirim} alasanBelum={tahap === 'selesai' ? null : t('dashcam.belum')} alasanRingkas={tahap === 'selesai' ? null : t('dashcam.belum')} />
    </div>
  );
}
