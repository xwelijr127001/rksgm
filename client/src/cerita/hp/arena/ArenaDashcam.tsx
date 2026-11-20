/**
 * T-065 (Episode 1 Dev "Kenalan Raksa", plan Task 2): POLA DASHCAM "Rekaman dashcam". Pengganti pertanyaan lajur di Episode 1 Dev.
 * T-069 (pemilik memilih gaya Claude Designer, campuran): GAYA T-065 (sudut kamera + lencana REKAM, jalan K08, bahu abu-hijau,
 * pembatas & sprite kendaraan T-065) DITAMBAH dua rambu di bahu kiri (merah: truk & trailer dilarang di lajur 3 dan 4; biru: truk &
 * bus gunakan lajur kiri) dan nomor lajur 1-4, digambar dengan gaya yang sama (character/dashcam-t065/bangun-t069.mjs). Adegan 336 x 240.
 * Rekaman ~6 detik:
 *   0.0-0.9 s  truk lurus di lajur 2, mobil biru di lajur 3, truk kecil berhenti di lajur 1 dekat pembatas (lampu hazard);
 *   0.9-3.3 s  mobil berbelok dari lajur 3 ke lajur 2 tepat di depan truk (terbaca dalam gerakan);
 *   3.3-4.5 s  truk membanting setir ke kiri, menabrak pembatas dan truk kecil; serpihan, debu, jejak rem;
 *   4.5-6.0 s  bingkai beku.
 * T-071 (pemilik: "jalannya ikut bergerak"): kamera mengikuti truk. Tanah bergulir KE BAWAH selama rekaman: ubin jalan 336 x 26
 * (garis putus, aspal, pembatas, bahu) berulang, ditambah lapisan benda di tanah (dua pasang rambu berjarak 288 px + truk kecil yang
 * berhenti) yang bergeser sama. Total 288 px: 74 px/detik (satu periode garis 26 px tiap 0,35 detik) sampai 3,3 s, melambat, berhenti
 * tepat saat benturan (4,5 s), lalu diam. Truk kecil masuk dari atas dan berhenti tepat di samping titik benturan; rambu pertama
 * keluar di bawah, pasangan berikutnya tiba di posisi yang sama pada bingkai beku. Nomor lajur = UI, tetap.
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
import ubin from '../../seni/aktivitas/dashcam/ubin.png';
import rambu from '../../seni/aktivitas/dashcam/rambu.png';
import nomorLajur from '../../seni/aktivitas/dashcam/nomor-lajur.png';
import trukAtas from '../../seni/aktivitas/jalan/truk-atas.png';
import trukMiring from '../../seni/aktivitas/dashcam/truk-miring.png';
import mobilAtas from '../../seni/aktivitas/dashcam/mobil-atas.png';
import trukKecilNyala from '../../seni/aktivitas/dashcam/truk-kecil-atas-nyala.png';
import trukKecilMati from '../../seni/aktivitas/dashcam/truk-kecil-atas-mati.png';
import serpih from '../../seni/aktivitas/dashcam/serpih.png';
import jejak from '../../seni/aktivitas/dashcam/jejak.png';
import debu from '../../seni/aktivitas/dashcam/debu.png';
import SPRITE from '../../seni/aktivitas/dashcam/sprite.json';
import { KeSlot, SlotKepalaArena } from '../cangkang';
import { PotretHp, TombolKirim } from '../bagianHp';
import { pilihOpsi, tetapkan } from './logika';
import type { PropsPola } from './pola';
import type { KonfigArena } from '../../tipe';
import './dashcam.css';

export type IdKendaraan = 'mobil' | 'truk' | 'truk-kecil';
/** Konfig arena dashcam = KonfigArena pola 'dashcam' di cerita/tipe.ts (Task 1, Fullstack): Interfaces + langkah & item misi sintetis. */
export type KonfigDashcam = Extract<KonfigArena, { pola: 'dashcam' }>;

type Tahap = 'putar' | 'pilih' | 'selesai';
/** Lama rekaman (md): animasi CSS 6 s; cadangan pewaktu sedikit lebih lama bila animationend tidak terpicu. */
const LAMA = 6000;

/**
 * T-069: adegan 336 x 240 (1 piksel seni = 1 px CSS) di tengah area, x0 = var(--x0). Jalan x 57..335 (bahu 7 + empat lajur 66):
 * lajur n = 64 + (n - 1) * 66. Posisi kiri-atas per bingkai (1 / 2 / 3 = gerak dikurangi; 3 = bingkai beku):
 *   truk   (143,100) lurus di lajur 2 -> sama -> sprite miring (91,78) di pembatas
 *   mobil  (216,34) lajur 3 -> (150,10) lajur 2 di depan truk -> (150,2)
 * Rekaman berjalan = pose 1 digerakkan CSS (dashcam.css), lalu diganti pose 3 pada 76 %.
 */
type Pose = { src: string; x: number; y: number; w: number; h: number };
const POSE: Record<'truk' | 'mobil', Pose[]> = {
  truk: [
    { src: trukAtas, x: 143, y: 100, w: 40, h: 124 },
    { src: trukAtas, x: 143, y: 100, w: 40, h: 124 },
    { src: trukMiring, x: 91, y: 78, w: 75, h: 133 },
  ],
  mobil: [
    { src: mobilAtas, x: 216, y: 34, w: 26, h: 44 },
    { src: mobilAtas, x: 150, y: 10, w: 26, h: 44 },
    { src: mobilAtas, x: 150, y: 2, w: 26, h: 44 },
  ],
};
/** Gaya posisi: kiri-atas dari tepi kiri adegan (var --x0); titik putar CSS = pusat gambar. */
function posisi(p: { x: number; y: number; w: number; h: number }): CSSProperties {
  return { left: `calc(var(--x0) + ${p.x}px)`, top: p.y, width: p.w, height: p.h, transformOrigin: '50% 50%' };
}

/** Sasaran ketuk di bingkai beku (bingkai 3): px dari tepi kiri adegan 336 (var --x0) dan dari atas. */
const SASARAN: Record<IdKendaraan, CSSProperties> = {
  mobil: { left: 'calc(var(--x0) + 139px)', top: 0, width: 48, height: 52 },
  'truk-kecil': { left: 'calc(var(--x0) + 57px)', top: 18, width: 48, height: 66 },
  truk: { left: 'calc(var(--x0) + 97px)', top: 96, width: 68, height: 112 },
};
/** Lajur 1-4: pusat x di adegan 336 (nomor lajur di pita K08). */
const PUSAT_LAJUR = [97, 163, 229, 295];

/**
 * Bingkai DIAM sebelum benturan (T-068 Fix 1 pita K08; T-078 dipakai juga kartu pembuka Episode 1 Investigator): adegan geser 0
 * (dua rambu, truk lurus di lajur 2, mobil di lajur 3; truk kecil belum masuk layar), tanpa animasi.
 *   bawaan  skala 1/2 tepat, dipotong ke y 20-236 = 168 x 108, nomor lajur 1-4 (14 px) di pusat tiap lajur;
 *   besar   skala 1, x 0-292, y 20-170 = 292 x 150 (rambu merah & biru utuh, lajur 1-3 + tepi lajur 4), nomor lajur 1-3.
 */
export function BingkaiDashcam({ besar = false }: { besar?: boolean }) {
  return (
    <figure className="dc-pita" data-besar={besar ? '' : undefined} aria-label={t('dashcam.judul')} style={{ '--ubin': `url(${ubin})`, '--rambu': `url(${rambu})` } as CSSProperties}>
      <div className="dc-pita-isi">
        <span className="dc-latar" aria-hidden="true" />
        <span className="dc-tanah" aria-hidden="true" />
        {(['truk', 'mobil'] as const).map((k) => <img key={k} className="dc-pita-kend" src={POSE[k][0]!.src} alt="" aria-hidden="true" style={posisi(POSE[k][0]!)} />)}
      </div>
      {/* nomor lajur terbaca (14 px) di pusat tiap lajur: angka piksel di latar hanya 2,5 px pada skala 1/2 */}
      {PUSAT_LAJUR.filter((x) => !besar || x < 280).map((x, i) => <span key={i} className="dc-pita-lajur" aria-hidden="true" style={{ left: besar ? x : x / 2 }}>{i + 1}</span>)}
    </figure>
  );
}

export function ArenaPolaDashcam({ ep, konfig, jawaban, ubah, tx, labelKirim, onKirim }: PropsPola & { konfig: KonfigDashcam }) {
  const kurang = useReducedMotion();
  const [tahap, setTahap] = useState<Tahap>('putar');
  const [bingkai, setBingkai] = useState(kurang ? 1 : 0); // 0 = animasi; 1..3 = bingkai diam (gerak dikurangi)
  const [putaran, setPutaran] = useState(0);
  const [salah, setSalah] = useState(0);
  const [pesan, setPesan] = useState<{ kunci: string; jenis: 'tepat' | 'ragu' | 'jelaskan' } | null>(null);
  const [diketuk, setDiketuk] = useState<IdKendaraan | null>(null);
  // T-068: langkah kedua (konfig.simpul, Episode 1 lengkap K08): pertanyaan tokoh pada bingkai beku yang sama. 'ulang' = rekaman
  // diputar lagi di langkah kedua (hasil langkah pertama tetap; tanpa sasaran ketuk).
  const simpul = konfig.simpul;
  const [fase, setFase] = useState<'rekaman' | 'tanya'>('rekaman');
  const [ulang, setUlang] = useState(false);
  const pilihSimpul = simpul ? (typeof jawaban[simpul.langkah] === 'string' ? (jawaban[simpul.langkah] as string) : null) : null;
  const instruksiRef = useRef<HTMLParagraphElement>(null);
  const putarRef = useRef<HTMLButtonElement>(null);
  const lewatKeyboard = useRef(false);
  const fokus = useRef<'instruksi' | 'putar' | null>(null);

  // Rekaman berjalan: bingkai beku saat animasi truk selesai, cadangan pewaktu.
  const akhirRekaman = () => { if (ulang) setUlang(false); else setTahap((x) => (x === 'putar' ? 'pilih' : x)); };
  useEffect(() => {
    if ((tahap !== 'putar' && !ulang) || bingkai !== 0) return;
    const id = window.setTimeout(akhirRekaman, LAMA + 300);
    return () => window.clearTimeout(id);
  }, [tahap, bingkai, putaran, ulang]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!fokus.current) return;
    const el = fokus.current === 'putar' ? putarRef.current : instruksiRef.current;
    fokus.current = null;
    el?.focus({ preventScroll: true });
  });

  const putarLagi = () => {
    if (fase === 'tanya') {
      playSfx('ketuk');
      setPutaran((n) => n + 1); setUlang(true); setBingkai(kurang ? 1 : 0);
      return;
    }
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

  const main = tahap === 'putar' || ulang;
  const beku = !main || bingkai === 3;
  const keadaanBingkai = main ? (bingkai === 0 ? 'jalan' : String(bingkai)) : '3';
  const instruksi = tahap === 'selesai' ? 'dashcam.selesai' : tahap === 'pilih' ? 'dashcam.tanya' : 'dashcam.tonton';
  const penanya = simpul ? tx(ep.pemeran[simpul.penanya]?.nama ?? simpul.penanya) : '';
  const benda = new Set(konfig.benda.map((b) => b.id));

  return (
    <div className="hp-dashcam" data-tahap={tahap} data-fase={fase} data-salah={salah} data-laptop={ep.investigasi ? '' : undefined}
      onClickCapture={(e) => { lewatKeyboard.current = e.isTrusted && e.detail === 0; }}>
      <KeSlot ke={SlotKepalaArena}>
        <p ref={instruksiRef} tabIndex={-1} className="hp-instruksi-arena dc-instruksi" role="status" data-beres={tahap === 'selesai' ? '' : undefined}>
          {fase === 'tanya' && simpul ? tx(simpul.judul ?? simpul.tanya) : <>{tahap === 'selesai' ? <span aria-hidden="true">✓ </span> : null}{t(instruksi)}</>}
        </p>
      </KeSlot>
      {fase === 'tanya' && simpul ? null : <>
      <figure className="dc-adegan" data-bingkai={keadaanBingkai} data-beku={beku ? '' : undefined} aria-label={t('dashcam.judul')}
        style={{ '--ubin': `url(${ubin})`, '--rambu': `url(${rambu})` } as CSSProperties}>
        <div className="dc-isi" key={putaran}>
          {/* T-071: tanah bergulir (ubin jalan berulang + lapisan rambu) */}
          <span className="dc-latar" aria-hidden="true" />
          <span className="dc-tanah" aria-hidden="true" />
          {/* T-073: truk kecil berhenti = sprite SENDIRI di koordinat akhir (T-069: x 65, y 22), di luar lapisan bergulir. Tanpa animasi
              (bingkai beku, bingkai diam, Safari mana pun) ia selalu di tempatnya; masuknya dari atas = animasi terpisah (dashcam.css). */}
          <span className="dc-truk-kecil" aria-hidden="true" style={{ left: 'calc(var(--x0) + 65px)', '--nyala': `url(${trukKecilNyala})`, '--mati': `url(${trukKecilMati})` } as CSSProperties} />
          {/* T-073: nomor lajur di DALAM adegan, 6 px dari tepi bawah (bukan top 226: tepi bingkai 3 px memotongnya di HP) */}
          <img className="dc-nomor" src={nomorLajur} alt="" aria-hidden="true" style={{ left: 'var(--x0)', bottom: 6, width: 336, height: 13 }} />
          <img className="dc-jejak" src={jejak} alt="" aria-hidden="true" style={{ left: `calc(var(--x0) + ${SPRITE.jejak.x}px)`, top: SPRITE.jejak.y, width: SPRITE.jejak.w, height: SPRITE.jejak.h }} />
          {/* animasi: pose 0 bergerak (CSS) lalu diganti pose piksel beku; gerak dikurangi: pose bingkai 1 / 2 / 3 */}
          {(['truk', 'mobil'] as const).map((k) => POSE[k].map((p, i) => (
            <img key={`${k}${i}`} className={`dc-kend dc-${k} dc-pose-${i + 1}`} src={p.src} alt="" aria-hidden="true" style={posisi(p)}
              onAnimationEnd={k === 'truk' && i === 0 ? (e) => { if (e.animationName.includes('dc-truk')) akhirRekaman(); } : undefined} />
          )))}
          <img className="dc-serpih" src={serpih} alt="" aria-hidden="true" style={{ left: 'calc(var(--x0) + 87px)', top: 74, width: 22, height: 14 }} />
          <img className="dc-debu" src={debu} alt="" aria-hidden="true" style={{ left: `calc(var(--x0) + ${SPRITE.debu.x}px)`, top: SPRITE.debu.y, width: SPRITE.debu.w, height: SPRITE.debu.h }} />
          {/* bingkai kamera: sudut, REKAM */}
          <span className="dc-sudut" aria-hidden="true" />
          <span className="dc-rekam" aria-hidden="true"><i />{t('dashcam.rekam')} 14:32</span>
          {fase === 'rekaman' && tahap !== 'putar' ? (['mobil', 'truk-kecil', 'truk'] as const).filter((id) => benda.has(id)).map((id) => (
            <button key={id} type="button" className="dc-sasaran" data-kendaraan={id} style={SASARAN[id]} aria-label={t(`dashcam.benda.${id}`)}
              data-keadaan={diketuk === id ? (id === konfig.tepat ? 'tepat' : 'ragu') : undefined} disabled={tahap === 'selesai'} onClick={() => ketuk(id)} />
          )) : null}
        </div>
        {/* T-067: tombol di dalam adegan: kanan atas selama rekaman / bingkai 1-2, kanan bawah di bingkai beku (dashcam.css) */}
        <div className="dc-kendali">
        <button ref={putarRef} type="button" className="dc-tombol dc-putar" data-putar="" disabled={fase === 'rekaman' && tahap === 'selesai'} data-sorot={pesan?.jenis === 'ragu' ? '' : undefined} onClick={putarLagi}>
          <span aria-hidden="true">↻ </span>{t('dashcam.putar')}
        </button>
        {kurang && main && bingkai < 3 ? (
          <button type="button" className="dc-tombol" data-lanjut-bingkai="" onClick={() => { const n = bingkai + 1; setBingkai(n); if (n === 3) { if (ulang) setUlang(false); else setTahap('pilih'); } }}>{t('dashcam.lanjutBingkai')}</button>
        ) : null}
        </div>
      </figure>
      {/* T-080 (Episode 1 Investigator): rekaman diputar di LAYAR LAPTOP pemain (bingkai + dek papan ketik, investigasi/ui/bukti-adegan.css) */}
      {ep.investigasi ? <span className="dc-laptop-dek" aria-hidden="true" /> : null}
      {/* T-069: keterangan bingkai diam (gerak dikurangi) DI BAWAH adegan: tidak menutupi mobil, rambu, atau tombol */}
      {bingkai > 0 && main ? <p className="dc-keterangan">{t('dashcam.bingkai', { n: bingkai })}: {t(`dashcam.bingkai.${bingkai}`)}</p> : null}
      {/* T-067: tulisan dua rambu dalam bahasa aktif (di rambu piksel tetap bahasa Indonesia, 5 px: dibaca di sini) */}
      <ul className="dc-rambu" aria-label={t('dashcam.rambu.judul')}>
        <li data-rambu="merah">{t('dashcam.rambu.1')}</li>
        <li data-rambu="biru">{t('dashcam.rambu.2')}</li>
      </ul>
      </>}
      {pesan && fase === 'rekaman' ? (
        <div className="dc-pesan" data-jenis={pesan.jenis} role="status">
          <p>{t(pesan.kunci)}</p>
          {pesan.jenis === 'tepat' ? <p className="dc-catatan">{t('dashcam.catatan')}</p> : null}
        </div>
      ) : null}
      {fase === 'tanya' && simpul ? (
        <>
          {/*
            T-068 Fix 1 (pemilik: tanpa gulir): PITA ringkas = adegan SEBELUM benturan (pose Codex 1: truk lurus di lajur 2, mobil di lajur 3),
            skala 1/2 tepat, dipotong ke y 24-234 (dua rambu, empat lajur, truk, nomor lajur) = 160 x 105; di sampingnya pertanyaan tokoh
            dan chip "Rambu" yang bisa dibuka (tulisan rambu dalam bahasa aktif). Lima kesimpulan di bawahnya, tanpa gulir (dashcam.css).
          */}
          <div className="dc-pita-baris">
            <BingkaiDashcam />
            <div className="dc-pita-kanan">
              <p className="dc-tanya-ringkas"><span className="dc-ucap-potret" aria-hidden="true"><PotretHp ep={ep} id={simpul.penanya} nama="" /></span><b>{penanya}</b> {tx(simpul.tanya)}</p>
              <details className="dc-rambu-chip">
                <summary>{t('dashcam.rambu.chip')}</summary>
                <ul className="dc-rambu" aria-label={t('dashcam.rambu.judul')}>
                  <li data-rambu="merah">{t('dashcam.rambu.1')}</li>
                  <li data-rambu="biru">{t('dashcam.rambu.2')}</li>
                </ul>
              </details>
            </div>
          </div>
          <div className="dc-simpul" role="radiogroup" aria-label={tx(simpul.judul ?? simpul.tanya)}>
            {simpul.pilihan.map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={pilihSimpul === o.id} className="dc-opsi" data-opsi={o.id}
                onClick={() => { playSfx('ketuk'); ubah(pilihOpsi(jawaban, simpul.langkah, o.id)); }}>
                {tx(o.label)}
              </button>
            ))}
          </div>
          <TombolKirim key="tanya" label={labelKirim} siap={!!pilihSimpul} onKirim={onKirim} alasanBelum={pilihSimpul ? null : t('dashcam.belumSimpul')} alasanRingkas={pilihSimpul ? null : t('dashcam.belumSimpul')} />
        </>
      ) : simpul ? (
        <TombolKirim key="rekaman" label={t('dashcam.keTanya', { nama: penanya })} siap={tahap === 'selesai'}
          onKirim={() => { setFase('tanya'); if (lewatKeyboard.current) fokus.current = 'instruksi'; }}
          alasanBelum={tahap === 'selesai' ? null : t('dashcam.belum')} alasanRingkas={tahap === 'selesai' ? null : t('dashcam.belum')} />
      ) : (
        <TombolKirim label={labelKirim} siap={tahap === 'selesai'} onKirim={onKirim} alasanBelum={tahap === 'selesai' ? null : t('dashcam.belum')} alasanRingkas={tahap === 'selesai' ? null : t('dashcam.belum')} />
      )}
    </div>
  );
}
