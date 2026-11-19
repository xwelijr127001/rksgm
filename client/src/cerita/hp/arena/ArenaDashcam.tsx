/**
 * T-065 (Episode 1 Dev "Kenalan Raksa", plan Task 2): POLA DASHCAM "Rekaman dashcam". Pengganti pertanyaan lajur di Episode 1 Dev.
 * T-067 (pilihan pemilik): tampilan CODEX (character/dashcam-codex/draw.cjs, dibangun ulang di character/dashcam-t065/bangun.mjs):
 * jalan tol tampak atas 320 x 240, bahu hijau + pembatas jingga-putih, dua rambu (merah: truk & trailer dilarang di lajur 3 dan 4;
 * biru: truk & bus gunakan lajur kiri), nomor lajur 1-4, truk putih kecil berhenti di bahu dengan pekerja berlutut mengganti ban.
 * Rekaman ~6 detik:
 *   0.0-0.9 s  truk di lajur 2, mobil gelap di lajur 3;
 *   0.9-3.5 s  mobil berbelok dari lajur 3 ke lajur 2 tepat di depan truk (terbaca dalam gerakan);
 *   2.4-4.5 s  truk membanting setir ke kiri, menabrak pembatas dan truk kecil; debu + jejak rem;
 *   4.5-6.0 s  bingkai beku.
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
import latar from '../../seni/aktivitas/dashcam/latar.png';
import truk0 from '../../seni/aktivitas/dashcam/truk-0.png';
import trukM14 from '../../seni/aktivitas/dashcam/truk-m14.png';
import trukM36 from '../../seni/aktivitas/dashcam/truk-m36.png';
import mobil0 from '../../seni/aktivitas/dashcam/mobil-0.png';
import mobilM36 from '../../seni/aktivitas/dashcam/mobil-m36.png';
import mobilP4 from '../../seni/aktivitas/dashcam/mobil-p4.png';
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
 * T-067 (tampilan Codex, pilihan pemilik): adegan 320 x 240 (1 piksel seni = 1 px CSS) di tengah area, x0 = var(--x0). Pusat
 * kendaraan per bingkai = character/dashcam-codex/draw.cjs: truk (186,177,0) -> (176,162,-14) -> (118,130,-36); mobil (236,133,0) ->
 * (204,105,-36) -> (178,33,+4). Sprite = PNG berputar piksel (bayangan ikut), pusatnya di (ox, oy) dalam PNG (sprite.json).
 */
type Pose = keyof typeof SPRITE & ('truk-0' | 'truk-m14' | 'truk-m36' | 'mobil-0' | 'mobil-m36' | 'mobil-p4');
const SRC: Record<Pose, string> = { 'truk-0': truk0, 'truk-m14': trukM14, 'truk-m36': trukM36, 'mobil-0': mobil0, 'mobil-m36': mobilM36, 'mobil-p4': mobilP4 };
const POSE: Record<'truk' | 'mobil', [Pose, number, number][]> = {
  truk: [['truk-0', 186, 177], ['truk-m14', 176, 162], ['truk-m36', 118, 130]],
  mobil: [['mobil-0', 236, 133], ['mobil-m36', 204, 105], ['mobil-p4', 178, 33]],
};
/** Gaya posisi sprite: kiri-atas = pusat - (ox, oy); titik putar CSS (animasi) = pusat kendaraan. */
function posisi(pose: Pose, cx: number, cy: number): CSSProperties {
  const sp = SPRITE[pose];
  return { left: `calc(var(--x0) + ${cx - sp.ox}px)`, top: cy - sp.oy, width: sp.w, height: sp.h, transformOrigin: `${sp.ox}px ${sp.oy}px` };
}

/** Sasaran ketuk di bingkai beku (bingkai 3): px dari tepi kiri adegan 320 (var --x0) dan dari atas. */
const SASARAN: Record<IdKendaraan, CSSProperties> = {
  mobil: { left: 'calc(var(--x0) + 154px)', top: 6, width: 48, height: 56 },
  'truk-kecil': { left: 'calc(var(--x0) + 75px)', top: 20, width: 48, height: 58 },
  truk: { left: 'calc(var(--x0) + 86px)', top: 86, width: 70, height: 90 },
};

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
    <div className="hp-dashcam" data-tahap={tahap} data-fase={fase} data-salah={salah}
      onClickCapture={(e) => { lewatKeyboard.current = e.isTrusted && e.detail === 0; }}>
      <KeSlot ke={SlotKepalaArena}>
        <p ref={instruksiRef} tabIndex={-1} className="hp-instruksi-arena dc-instruksi" role="status" data-beres={tahap === 'selesai' ? '' : undefined}>
          {fase === 'tanya' && simpul ? tx(simpul.judul ?? simpul.tanya) : <>{tahap === 'selesai' ? <span aria-hidden="true">✓ </span> : null}{t(instruksi)}</>}
        </p>
      </KeSlot>
      {fase === 'tanya' && simpul ? null : <>
      <figure className="dc-adegan" data-bingkai={keadaanBingkai} data-beku={beku ? '' : undefined} aria-label={t('dashcam.judul')}
        style={{ '--latar': `url(${latar})` } as CSSProperties}>
        <div className="dc-isi" key={putaran}>
          {/* T-067: latar Codex (bahu hijau, pembatas jingga-putih, dua rambu, aspal, nomor lajur, truk kecil + pekerja ganti ban) */}
          <span className="dc-latar" aria-hidden="true" />
          {/* lampu hazard truk kecil (berkedip saat rekaman berjalan) */}
          <span className="dc-hazard" aria-hidden="true" style={{ left: 'calc(var(--x0) + 85px)' }} />
          <span className="dc-hazard" aria-hidden="true" style={{ left: 'calc(var(--x0) + 110px)' }} />
          <img className="dc-jejak" src={jejak} alt="" aria-hidden="true" style={{ left: `calc(var(--x0) + ${SPRITE.jejak.x}px)`, top: SPRITE.jejak.y, width: SPRITE.jejak.w, height: SPRITE.jejak.h }} />
          {/* animasi: pose 0 bergerak (CSS) lalu diganti pose piksel beku; gerak dikurangi: pose bingkai 1 / 2 / 3 */}
          {(['truk', 'mobil'] as const).map((k) => POSE[k].map(([pose, cx, cy], i) => (
            <img key={pose} className={`dc-kend dc-${k} dc-pose-${i + 1}`} src={SRC[pose]} alt="" aria-hidden="true" style={posisi(pose, cx, cy)}
              onAnimationEnd={k === 'truk' && i === 0 ? (e) => { if (e.animationName.includes('dc-truk')) akhirRekaman(); } : undefined} />
          )))}
          <img className="dc-debu" src={debu} alt="" aria-hidden="true" style={{ left: `calc(var(--x0) + ${SPRITE.debu.x}px)`, top: SPRITE.debu.y, width: SPRITE.debu.w, height: SPRITE.debu.h }} />
          {/* bingkai kamera: sudut, REKAM */}
          <span className="dc-sudut" aria-hidden="true" />
          <span className="dc-rekam" aria-hidden="true"><i />{t('dashcam.rekam')} 14:32</span>
          {fase === 'rekaman' && tahap !== 'putar' ? (['mobil', 'truk-kecil', 'truk'] as const).filter((id) => benda.has(id)).map((id) => (
            <button key={id} type="button" className="dc-sasaran" data-kendaraan={id} style={SASARAN[id]} aria-label={t(`dashcam.benda.${id}`)}
              data-keadaan={diketuk === id ? (id === konfig.tepat ? 'tepat' : 'ragu') : undefined} disabled={tahap === 'selesai'} onClick={() => ketuk(id)} />
          )) : null}
        </div>
        {bingkai > 0 && main ? <figcaption className="dc-keterangan">{t('dashcam.bingkai', { n: bingkai })}: {t(`dashcam.bingkai.${bingkai}`)}</figcaption> : null}
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
            <figure className="dc-pita" aria-label={t('dashcam.judul')} style={{ '--latar': `url(${latar})` } as CSSProperties}>
              <div className="dc-pita-isi">
                <span className="dc-latar" aria-hidden="true" />
                {(['truk', 'mobil'] as const).map((k) => { const [pose, cx, cy] = POSE[k][0]; return <img key={pose} className="dc-pita-kend" src={SRC[pose]} alt="" aria-hidden="true" style={posisi(pose, cx, cy)} />; })}
              </div>
              {/* nomor lajur 1-4 terbaca (14 px) di pusat tiap lajur: angka piksel di latar hanya 2,5 px pada skala 1/2 */}
              {[1, 2, 3, 4].map((n) => <span key={n} className="dc-pita-lajur" aria-hidden="true" style={{ left: 68 + (n - 1) * 24.5 }}>{n}</span>)}
            </figure>
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
