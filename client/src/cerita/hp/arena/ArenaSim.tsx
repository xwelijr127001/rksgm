/**
 * T-022 "PERIKSA SIM PAK DARTO" (pola 'sim'; owner GO 16 Nov 2026; konsep D-190..D-194, seni character/aktivitas-ep2-pixel-v1/sim/).
 * Empat langkah, lima layar, semuanya dengan tangan (tidak ada daftar jawaban):
 *   1 meja     : ketuk dompet Pak Darto (bukan fotokopi di berkas)            -> cap ASLI
 *   2 kartu    : ketuk kotak golongan (kaca pembesar), lalu label di truk; "Balik" membalik kartu -> cap COCOK
 *   3a tempat  : papan tiga tempat; ketuk Satpas SIM
 *   3b loket   : ketuk baris NIK di KTP; terminal mengetik lalu "data ditemukan"  -> cap SATPAS
 *   4 cetakan  : seret kartu ke cetakan Satpas (atau ketuk kartu / cetakan): tiga baris dicentang -> cap SESUAI
 *   akhir      : papan jalan dengan empat cap + kartu "Cerita Pak Bima dari kasus lain".
 * Ketukan keliru tidak pernah berkata "salah": bendanya berbingkai putus-putus kuning dan Pak Bima menjawab satu kalimat; tidak ada
 * yang hilang. Jawaban arena = satu item ke wadah `bersih` (tanpa ketukan keliru) atau `ragu`; SIM-nya asli, jadi cerita tidak
 * bercabang. Selalu mulai dari meja (tidak ada langkah tersimpan). Semua sasaran = tombol bernama (keyboard & pembaca layar);
 * satu-satunya seretan (langkah 4) punya padanan ketuk. Gerak dikurangi: keadaan berganti tanpa jeda.
 * Tata letak adegan = px dari tepi / pusat area gambar (W - 4) x 232, persis README seni; satu set seni untuk 336 dan 366.
 *
 * FOKUS KEYBOARD (17 Nov 2026): sesudah sebuah tombol diaktifkan lewat keyboard, fokus tidak pernah jatuh ke <body>:
 *  - ketukan keliru, atau benar tetapi langkahnya belum beres (kotak golongan): fokus TETAP di sasaran itu. Syaratnya simpul DOM yang
 *    tetap, jadi <Ketuk> didefinisikan di tingkat modul (dulu di dalam render: tombolnya dibuat ulang tiap render dan fokusnya hilang);
 *  - langkah beres (sasarannya menjadi nonaktif): fokus pindah ke tombol bilah ("Lanjut: ..."), tindakan berikutnya;
 *  - tombol bilah (langkah baru): fokus ke baris instruksi langkah itu (tabindex -1, tanpa cincin, seperti judul langkah K11); satu Tab
 *    dari sana = sasaran pertama adegan;
 *  - "Kenapa?" -> tombol "Tutup" di catatan; "Tutup" -> kembali ke tab "Kenapa?".
 * Pemindahan fokus HANYA sesudah aktivasi keyboard (klik tepercaya dengan detail 0); ketuk, tetikus, seretan dan klik skrip tidak
 * memindahkan fokus, jadi alur sentuh tidak berubah.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as PE, type ReactNode } from 'react';
import { playSfx } from '../../../audio/audio';
import { useReducedMotion } from '../../../hooks';
import { susunTokoh } from '../../seni/piksel';
import '../../seni/aktivitas/piksel.css';
import '../../seni/aktivitas/sim.css';
import type { KonfigArena, KunciTeks } from '../../tipe';
import { tokohPotret } from '../../ui/latar/piksel/potret';
import { KeSlot, SlotKepalaArena } from '../cangkang';
import { PotretHp, TombolKirim } from '../bagianHp';
import { tetapkan } from './logika';
import type { PropsPola } from './pola';

type Langkah = 'meja' | 'kartu' | 'tempat' | 'loket' | 'cetakan' | 'akhir';
const URUT: Langkah[] = ['meja', 'kartu', 'tempat', 'loket', 'cetakan', 'akhir'];
const CAP = ['asli', 'cocok', 'satpas', 'sesuai'] as const;
/** Cap ke-n selesai sesudah langkah ini beres. */
const CAP_DARI: Record<(typeof CAP)[number], Langkah> = { asli: 'meja', cocok: 'kartu', satpas: 'loket', sesuai: 'cetakan' };
interface Ucap { siapa: 'bima' | 'darto'; kunci: KunciTeks; ragu?: boolean }
/** Tujuan fokus sesudah aktivasi keyboard: tombol bilah (langkah beres), baris instruksi (langkah baru), "Tutup" / tab "Kenapa?". */
type TujuanFokus = 'bilah' | 'instruksi' | 'tutup' | 'kenapa';

/**
 * Sasaran ketuk di adegan: tombol bernama tanpa isi (gambarnya terletak di bawahnya). HARUS di tingkat modul: komponen yang
 * didefinisikan di dalam render berganti identitas tiap render, sehingga React membuang tombol lama dan membuat yang baru, dan fokus
 * keyboard jatuh ke <body> sesudah tiap aktivasi (terukur 17 Nov di langkah 1, 2 dan 3b).
 */
function Ketuk({ id, nama, gaya, keadaan, petunjuk, mati, onKetuk }: {
  id: string;
  nama: string;
  gaya: CSSProperties;
  keadaan?: 'ragu' | 'benar';
  /** D-217: garis putus-putus sebelum langkah ini beres. */
  petunjuk: boolean;
  mati: boolean;
  onKetuk: () => void;
}) {
  return <button type="button" className="sim-ketuk" data-ketuk={id} data-keadaan={keadaan} data-petunjuk={petunjuk ? '' : undefined} aria-label={nama} style={gaya} disabled={mati} onClick={onKetuk} />;
}

export function ArenaPolaSim({ ep, konfig, jawaban, ubah, tx, labelKirim, onKirim }: PropsPola & { konfig: Extract<KonfigArena, { pola: 'sim' }> }) {
  const kurang = useReducedMotion();
  const [langkah, setLangkah] = useState<Langkah>('meja');
  const [beres, setBeres] = useState(false);
  const [lensa, setLensa] = useState(false);
  const [balik, setBalik] = useState(false);
  const [tempat, setTempat] = useState<string | null>(null);
  const [monitor, setMonitor] = useState<'kosong' | 'ketik' | 'isi'>('kosong');
  const [jatuh, setJatuh] = useState(false);
  const [centang, setCentang] = useState(0);
  const [ucap, setUcap] = useState<Ucap>({ siapa: 'bima', kunci: 'arena.sim.bima.meja' });
  const [raguDi, setRaguDi] = useState<string | null>(null);
  const [salah, setSalah] = useState(0);
  const [kenapa, setKenapa] = useState(false);
  const [seret, setSeret] = useState<number | null>(null);
  const pewaktu = useRef<number[]>([]);
  useEffect(() => () => { for (const id of pewaktu.current) window.clearTimeout(id); }, []);
  const nanti = (f: () => void, ms: number) => { if (kurang || ms <= 0) f(); else pewaktu.current.push(window.setTimeout(f, ms)); };

  // ---- fokus keyboard (lihat kepala berkas). `lewatKeyboard` = klik yang sedang diproses berasal dari keyboard; `fokusNanti` = tujuan
  // fokus sesudah render berikutnya. 'bilah' menunggu sampai tombol bilah aktif (langkah 4: baru sesudah tiga centang).
  const akar = useRef<HTMLDivElement>(null);
  const instruksiRef = useRef<HTMLParagraphElement>(null);
  const lewatKeyboard = useRef(false);
  const fokusNanti = useRef<TujuanFokus | null>(null);
  const fokusKe = (tujuan: TujuanFokus) => { if (lewatKeyboard.current) fokusNanti.current = tujuan; };
  useLayoutEffect(() => {
    const tujuan = fokusNanti.current;
    if (!tujuan) return;
    const root = akar.current;
    const aktif = document.activeElement;
    // Pemain sudah memindahkan fokus ke luar permainan (mis. ke kepala halaman) selagi menunggu: jangan direbut.
    if (tujuan === 'bilah' && aktif && aktif !== document.body && !root?.contains(aktif)) { fokusNanti.current = null; return; }
    // Tombol bilah: di cangkang HP berada di bilah bawah (portal, di luar .hp-sim), di desktop di dalam .hp-sim; keduanya di dalam .hp-arena.
    const el = tujuan === 'instruksi' ? instruksiRef.current
      : tujuan === 'bilah' ? (root?.closest<HTMLElement>('.hp-arena') ?? root)?.querySelector<HTMLElement>('[data-kirim]:not(:disabled)') ?? null
        : root?.querySelector<HTMLElement>(tujuan === 'tutup' ? '[data-kenapa-tutup]' : '[data-kenapa]') ?? null;
    if (!el) { if (tujuan !== 'bilah') fokusNanti.current = null; return; }
    fokusNanti.current = null;
    el.focus({ preventScroll: true });
  });

  const keliru = (di: string, kunci: KunciTeks) => { playSfx('batal'); setRaguDi(di); setSalah((n) => n + 1); setUcap({ siapa: 'bima', kunci, ragu: true }); };
  const benar = (u: Ucap, selesai = true) => { playSfx('konfirmasi'); setRaguDi(null); setUcap(u); if (selesai) { setBeres(true); fokusKe('bilah'); } };
  const maju = () => {
    const berikut = URUT[URUT.indexOf(langkah) + 1]!;
    setLangkah(berikut); setBeres(false); setRaguDi(null); setKenapa(false);
    fokusKe('instruksi');
    if (berikut !== 'akhir') setUcap({ siapa: 'bima', kunci: `arena.sim.bima.${berikut}` });
    else ubah(tetapkan(jawaban, konfig.langkah, konfig.benda, salah ? konfig.ragu : konfig.bersih));
  };

  // ---- langkah 4: seret (atau ketuk) kartu ke cetakan
  const jatuhkan = () => {
    if (jatuh) return;
    setJatuh(true); setSeret(null); playSfx('kertas');
    fokusKe('bilah');
    if (kurang) { setCentang(3); benar({ siapa: 'bima', kunci: 'arena.sim.bima.sama' }); return; }
    [1, 2, 3].forEach((n) => nanti(() => { setCentang(n); if (n === 3) benar({ siapa: 'bima', kunci: 'arena.sim.bima.sama' }); }, 250 * n));
  };
  const y0 = useRef<number | null>(null);
  const turun = (e: PE<HTMLButtonElement>) => { if (jatuh) return; lewatKeyboard.current = false; y0.current = e.clientY; try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* penunjuk tanpa sesi aktif (WebKit, peristiwa buatan): seret tetap jalan tanpa tangkapan */ } setSeret(0); };
  const gerak = (e: PE<HTMLButtonElement>) => { if (y0.current !== null && !jatuh) setSeret(Math.min(0, Math.max(-130, e.clientY - y0.current))); };
  const naik = (e: PE<HTMLButtonElement>) => {
    if (y0.current === null) return;
    const dy = e.clientY - y0.current; y0.current = null;
    if (dy <= -24 || Math.abs(dy) < 6) jatuhkan(); else setSeret(null);
  };

  const sudahCap = (c: (typeof CAP)[number]) => langkah === 'akhir' || URUT.indexOf(langkah) > URUT.indexOf(CAP_DARI[c]) || (langkah === CAP_DARI[c] && beres);
  const capKini = CAP.find((c) => !sudahCap(c));
  const instruksi: KunciTeks = langkah === 'akhir' ? 'arena.sim.inst.akhir' : beres ? `arena.sim.beres.${langkah}` : langkah === 'kartu' ? (lensa ? 'arena.sim.inst.label' : 'arena.sim.inst.golongan') : `arena.sim.inst.${langkah}`;
  const keadaan = (id: string, benarnya: boolean) => (raguDi === id ? 'ragu' : benarnya ? 'benar' : undefined);
  const darto = useMemo(() => { const tp = tokohPotret(ep, 'darto'); return tp ? susunTokoh(tp, { pose: 'berdiri', hadap: 'kanan', ekspresi: 'netral' }) : null; }, [ep]);

  /**
   * Satu sasaran ketuk: elemen <Ketuk> berkunci tetap (id-nya). Ini fungsi biasa yang MENGEMBALIKAN elemen (dipanggil, bukan dipakai
   * sebagai komponen), jadi jenis komponennya selalu `Ketuk` di tingkat modul dan tombolnya bertahan antar-render.
   */
  const sasaran = (id: string, nama: KunciTeks, gaya: CSSProperties, onKetuk: () => void, o: { benarnya?: boolean; petunjuk?: boolean } = {}) => (
    <Ketuk key={id} id={id} nama={tx(nama)} gaya={gaya} keadaan={keadaan(id, !!o.benarnya)} petunjuk={!!o.petunjuk && !beres} mati={beres} onKetuk={onKetuk} />
  );

  let adegan: ReactNode = null;
  if (langkah === 'meja') {
    adegan = (
      <>
        <span className="sim-dinding" aria-hidden="true" />
        {darto ? (
          <span className="sim-darto" aria-hidden="true" style={{ width: darto.ukuran.w }}>
            {darto.lapisan.map((l, i) => <span key={i} style={{ left: l.x - darto.lapisan[0]!.x, top: l.y - darto.lapisan[0]!.y, width: l.sumber.w, height: l.sumber.h, backgroundImage: `url(${darto.url})`, backgroundPosition: `-${l.sumber.x}px -${l.sumber.y}px` }} />)}
          </span>
        ) : null}
        <span className="sim-meja sim-meja-bawah" aria-hidden="true" />
        <span className="px sm-berkas" aria-hidden="true" style={{ left: 8, top: 100 }} />
        <span className="px sm-dompet" aria-hidden="true" style={beres ? { right: 20, top: 100 } : { right: 52, top: 118 }} />
        {beres ? <><span className="px sm-sim-kecil" aria-hidden="true" style={{ right: 36, top: 146 }} /><span className="px sm-jempol" aria-hidden="true" style={{ right: 118, top: 192 }} /></> : null}
        <span className="sim-pelat" aria-hidden="true" style={{ left: 14, top: 204 }}>{tx('arena.sim.benda.fotokopi')}</span>
        {beres ? null : <span className="sim-pelat" aria-hidden="true" style={{ right: 22, top: 184 }}>{tx('arena.sim.benda.dompet')}</span>}
        {sasaran('fotokopi', 'arena.sim.benda.fotokopi', { left: 4, top: 96, width: 148, height: 106 }, () => keliru('fotokopi', 'arena.sim.ragu.fotokopi'), { petunjuk: true })}
        {sasaran('dompet', 'arena.sim.benda.dompet', { right: 30, top: 104, width: 108, height: 76 }, () => benar({ siapa: 'darto', kunci: 'arena.sim.darto.serah' }), { petunjuk: true })}
        {beres ? <i className="sim-garis" data-garis="kartu-kecil" aria-hidden="true" style={{ right: 34, top: 144, width: 124, height: 80, zIndex: 2 }} /> : null}
      </>
    );
  } else if (langkah === 'kartu') {
    adegan = (
      <>
        <span className="sim-meja" aria-hidden="true" />
        <span className={'px ' + (balik ? 'sm-sim-belakang' : 'sm-sim-depan')} aria-hidden="true" style={{ left: 8, top: 8 }} />
        <span className="px sm-jempol" aria-hidden="true" style={{ left: 22, top: 118 }} />
        {!balik ? (
          <>
            {sasaran('foto', 'arena.sim.benda.foto', { left: 16, top: 64, width: 62, height: 76 }, () => keliru('foto', 'arena.sim.ragu.foto'))}
            {sasaran('nama', 'arena.sim.benda.nama', { left: 80, top: 66, width: 136, height: 80 }, () => keliru('nama', 'arena.sim.ragu.nama'))}
            {sasaran('golongan', 'arena.sim.benda.golongan', { left: 156, top: 12, width: 88, height: 56 }, () => { setLensa(true); benar({ siapa: 'bima', kunci: 'arena.sim.bima.lensa' }, false); })}
          </>
        ) : null}
        {lensa && !balik ? <span className="px sm-lensa-asli" aria-hidden="true" style={{ left: 152, top: 0 }} /> : null}
        <span className="px sm-truk-mini" aria-hidden="true" style={{ left: 6, top: 170 }} />
        <button type="button" className="sim-label-truk" data-ketuk="label" data-keadaan={beres ? 'cocok' : lensa ? 'ketuk' : raguDi === 'label' ? 'ragu' : undefined} disabled={beres}
          onClick={() => { if (lensa) benar({ siapa: 'bima', kunci: 'arena.sim.bima.cocok' }); else { setRaguDi(null); setUcap({ siapa: 'bima', kunci: 'arena.sim.bima.labelDulu' }); } }}>
          <span className="px sm-lubang" aria-hidden="true" /><span>{tx('arena.sim.benda.truk')}</span><b>{tx('arena.sim.benda.perlu')}</b>
        </button>
        <button type="button" className="sim-balik" data-balik="" aria-pressed={balik} onClick={() => { playSfx('kertas'); setBalik(!balik); if (!balik) { setRaguDi(null); setUcap({ siapa: 'bima', kunci: 'arena.sim.bima.balik' }); } }}>
          {tx(balik ? 'arena.sim.benda.depan' : 'arena.sim.benda.balik')}
        </button>
      </>
    );
  } else if (langkah === 'tempat') {
    const ubin = (id: 'kantor' | 'bengkel' | 'satpas', kelas: string, gaya: CSSProperties, raguKunci?: KunciTeks) => (
      <button key={id} type="button" className={'sim-ubin' + (tempat === id ? ' terpilih' : '')} data-ketuk={id} data-keadaan={keadaan(id, tempat === id)} style={gaya} disabled={beres} aria-pressed={tempat === id}
        onClick={() => { if (raguKunci) keliru(id, raguKunci); else { setTempat(id); benar({ siapa: 'bima', kunci: 'arena.sim.bima.satpas' }); } }}>
        <span className="sim-ubin-gambar"><span className={'px ' + kelas} /></span>
        <span className="sim-ubin-nama">{tx(`arena.sim.tempat.${id}`)}</span>
        {tempat === id ? <span className="px sm-sim-pin" aria-hidden="true" /> : null}
      </button>
    );
    adegan = (
      <>
        <span className="sim-rumput" aria-hidden="true" /><span className="sim-jalan-h" aria-hidden="true" /><span className="sim-jalan-v" aria-hidden="true" />
        <span className="px px-pohon-1" aria-hidden="true" style={{ position: 'absolute', left: 'calc(50% - 60px)', top: 6 }} /><span className="px px-pohon-2" aria-hidden="true" style={{ position: 'absolute', left: 'calc(50% + 40px)', top: 14 }} />
        <span className="px px-semak" aria-hidden="true" style={{ position: 'absolute', left: 24, bottom: 16 }} /><span className="px px-pohon-2" aria-hidden="true" style={{ position: 'absolute', right: 26, bottom: 20 }} /><span className="px px-semak" aria-hidden="true" style={{ position: 'absolute', right: 70, bottom: 6 }} />
        {ubin('kantor', 'px-ubin-kantor', { left: 6, top: 30 }, 'arena.sim.ragu.kantor')}
        {ubin('bengkel', 'px-ubin-bengkel-rekanan', { right: 6, top: 30 }, 'arena.sim.ragu.bengkel')}
        {ubin('satpas', 'sm-ubin-satpas', { left: 'calc(50% - 48px)', bottom: 8 })}
      </>
    );
  } else if (langkah === 'loket') {
    const nik = () => { benar({ siapa: 'bima', kunci: 'arena.sim.bima.ketemu' }); setMonitor(kurang ? 'isi' : 'ketik'); nanti(() => setMonitor('isi'), 300); };
    adegan = (
      <>
        <span className="sim-meja" aria-hidden="true" /><span className="sim-loket" aria-hidden="true" />
        <span className="px sm-ktp" aria-hidden="true" style={{ left: 6, top: 108 }} />
        <span className={'px sm-monitor sm-monitor-' + monitor} role="img" aria-label={monitor} data-monitor={monitor} style={{ right: 6, top: 106 }} />
        <span className="px sm-surat-kuasa" role="img" aria-label={tx('arena.sim.benda.kuasa')} style={{ right: 6, top: 184 }} />
        {sasaran('nik', 'arena.sim.ktp.nik', { left: 10, top: 126, width: 134, height: 24 }, nik, { benarnya: beres, petunjuk: true })}
        {sasaran('ktpNama', 'arena.sim.ktp.nama', { left: 10, top: 152, width: 134, height: 26 }, () => keliru('ktpNama', 'arena.sim.ragu.ktpNama'), { petunjuk: true })}
        {sasaran('ktpAlamat', 'arena.sim.ktp.alamat', { left: 10, top: 180, width: 134, height: 22 }, () => keliru('ktpAlamat', 'arena.sim.ragu.ktpAlamat'), { petunjuk: true })}
      </>
    );
  } else if (langkah === 'cetakan') {
    const atas = jatuh ? 118 : 136 + (seret ?? 0); // D-221: 118 (bukan 122) supaya kotak nomor utuh di dalam adegan
    // Sesudah kartu dijatuhkan, kartu dan cetakan baru menjadi `disabled` saat langkahnya beres (tiga centang, 750 md kemudian):
    // sampai saat itu keduanya hanya aria-disabled (jatuhkan() mengabaikan aktivasi ulang), supaya tombol yang diaktifkan lewat
    // keyboard tidak kehilangan fokus selama centang muncul; begitu beres, fokusnya pindah ke tombol bilah.
    const menunggu = jatuh && !beres ? true : undefined;
    adegan = (
      <>
        <span className="sim-meja" aria-hidden="true" />
        <button type="button" className="sim-cetakan" data-ketuk="cetakan" aria-label={tx('arena.sim.benda.cetakan')} disabled={beres} aria-disabled={menunggu} onClick={jatuhkan}>
          <span className="px sm-cetakan" aria-hidden="true" />
          {[0, 1, 2].map((r) => <span key={r} className="px sm-centang" data-centang={centang > r ? '' : undefined} aria-hidden="true" style={{ left: 262, top: 23 + 24 * r }} />)}
        </button>
        {seret !== null && !jatuh ? <span className="px sm-sim-hantu" aria-hidden="true" style={{ left: 'calc(50% - 120px)', top: 136 }} /> : null}
        <button type="button" className="sim-kartu-seret" data-ketuk="kartu" data-jatuh={jatuh ? '' : undefined} aria-label={tx('arena.sim.benda.kartu')} disabled={beres} aria-disabled={menunggu} style={{ top: atas }}
          onPointerDown={turun} onPointerMove={gerak} onPointerUp={naik} onPointerCancel={() => { y0.current = null; setSeret(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lewatKeyboard.current = true; jatuhkan(); } }}>
          <span className="px sm-sim-depan" aria-hidden="true" />
          {jatuh ? <><i className="sim-garis" style={{ left: 152, top: 8, width: 80, height: 48 }} /><i className="sim-garis" style={{ left: 74, top: 60, width: 66, height: 26 }} /><i className="sim-garis" style={{ left: 74, top: 88, width: 130, height: 23 }} /></> : null}
        </button>
        <span className="px sm-jempol" aria-hidden="true" style={{ left: 'calc(50% - 130px)', top: atas + 54 }} />
      </>
    );
  }

  const papan = (
    <ol className="sim-papan" data-akhir={langkah === 'akhir' ? '' : undefined} aria-label={tx('arena.sim.papan')}>
      <span className="px sm-klip" aria-hidden="true" />
      {CAP.map((c) => {
        const sudah = sudahCap(c);
        return (
          <li key={c} data-cap={c} data-keadaan={sudah ? 'cap' : c === capKini ? 'kini' : 'tunggu'}>
            <span className="sim-cap-nama">{tx(`arena.sim.cap.${c}`)}</span>
            <span className={'px ' + (sudah ? `sm-cap-${c}` : 'sm-cap-kosong')} aria-hidden="true" />
            <span className="sr-only">{tx(sudah ? 'arena.sim.cap.sudah' : 'arena.sim.cap.belum')}</span>
          </li>
        );
      })}
    </ol>
  );
  const ucapEl = (u: Ucap) => (
    <div className="sim-ucap" data-ragu={u.ragu ? '' : undefined} data-siapa={u.siapa} role="status">
      <span className="sim-ucap-potret" aria-hidden="true"><PotretHp ep={ep} id={u.siapa} nama="" /></span>
      <p><span className="sr-only">{tx(ep.pemeran[u.siapa]?.nama ?? u.siapa)}: </span>{tx(u.kunci)}</p>
    </div>
  );

  return (
    <div ref={akar} className="hp-sim" data-langkah={langkah} data-beres={beres ? '' : undefined} data-salah={salah}
      // Aktivasi keyboard pada tombol = click tepercaya dengan detail 0 (Enter / Spasi); ketuk dan tetikus punya detail >= 1, klik
      // skrip tidak tepercaya. Dicatat di fase tangkap, sebelum penangan tombolnya (juga tombol bilah dan instruksi yang diportal).
      onClickCapture={(e) => { lewatKeyboard.current = e.isTrusted && e.detail === 0; if (!lewatKeyboard.current) fokusNanti.current = null; }}
      // Enter yang DITAHAN tidak mengaktifkan ulang: fokus bisa baru saja pindah ke tombol bilah, dan ulangan tombol akan langsung menekannya.
      onKeyDownCapture={(e) => { if (e.key === 'Enter' && e.repeat) e.preventDefault(); }}>
      <KeSlot ke={SlotKepalaArena}>
        <p ref={instruksiRef} tabIndex={-1} className="hp-instruksi-arena sim-instruksi" role="status" data-beres={beres || langkah === 'akhir' ? '' : undefined}>{beres || langkah === 'akhir' ? <span aria-hidden="true">✓ </span> : null}{tx(instruksi)}</p>
      </KeSlot>
      {langkah === 'akhir' ? (
        <>
          {papan}
          <section className="sim-kasus" aria-label={tx('arena.sim.kasus.judul')}>
            <h3 className="sim-kasus-judul"><span className="px px-kaca-kecil" aria-hidden="true" />{tx('arena.sim.kasus.judul')}</h3>
            <span className="px sm-lensa-palsu" aria-hidden="true" />
            <ul>{[1, 2, 3].map((n) => <li key={n}>{tx(`arena.sim.kasus.${n}`)}</li>)}</ul>
          </section>
          {ucapEl({ siapa: 'bima', kunci: 'arena.sim.akhir.umpan' })}
        </>
      ) : (
        <>
          <div className="sim-adegan" data-adegan={langkah}>
            <div className="sim-isi">
              {adegan}
              {kenapa ? (
                <div className="sim-catatan" role="note">
                  <p>{tx(`arena.sim.kenapa.${langkah === 'meja' || langkah === 'kartu' || langkah === 'tempat' || langkah === 'loket' ? langkah : 'cetakan'}`)}</p>
                  <button type="button" className="hp-tautan" data-kenapa-tutup="" onClick={() => { setKenapa(false); fokusKe('kenapa'); }}>{tx('arena.sim.kenapa.tutup')}</button>
                </div>
              ) : <button type="button" className="sim-kenapa" data-kenapa="" aria-expanded={false} onClick={() => { setKenapa(true); fokusKe('tutup'); }}>{tx('arena.sim.kenapa')}</button>}
            </div>
          </div>
          {papan}
          {ucapEl(ucap)}
        </>
      )}
      {langkah === 'akhir'
        ? <TombolKirim key="akhir" label={labelKirim} siap onKirim={onKirim} />
        : <TombolKirim key={langkah} label={tx(`arena.sim.lanjut.${langkah}`)} siap={beres} onKirim={maju} alasanBelum={beres ? null : tx(`arena.sim.bilah.${langkah}`)} alasanRingkas={beres ? null : tx(`arena.sim.bilah.${langkah}`)} />}
    </div>
  );
}
