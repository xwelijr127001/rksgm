/**
 * T-076 EPISODE 1 INVESTIGATOR (rencana Task 1): PENGHUBUNG antara mesin cerita dan komponen Task 2 (cerita/investigasi/ui).
 * Pemutar HP (hp/PemainHP.tsx) memanggil tiga pintu ini hanya untuk episode ber-`investigasi`:
 *  - LayarInvestigasi: layar node ber-`investigasi` (judul, catat, bukti, keberatan, cap, putusan). Semua kemajuan lewat mesin
 *    (`onLanjut` = aksi lanjut, `onPilih` = aksi pilih), jadi muat ulang di tengah kasus kembali ke layar yang sama.
 *  - HasilKasus: layar akhir (node hasil-investigasi): skor dari tanda state, rekaman perangkat (skor terbaik + stempel) dicatat
 *    sekali di sini, "Main lagi", "Kasus berikutnya" (segera hadir), "Tamu baru".
 *  - IsiBukuCatatan: buku catatan (Menu) dari state.
 * Teks naskah (kunci teks episode) diterjemahkan lewat <PenyediaTeksInvestigasi value={tx}>; teks antarmuka komponen ada di kamus
 * aplikasi `investigasi` (Task 2), teks pembungkus di sini di teks episode (`inv.ui.*`).
 */
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { BingkaiDashcam } from '../hp/arena/ArenaDashcam';
import type { PlayerLook } from '@shared/types';
import { jedaMusik, playSfx } from '../../audio/audio';
import { jenisPenutur, ketukanKini } from '../hp/alur';
import { barisTerlihat } from '../mesin';
import type { Episode, KunciTeks, NodeCerita, StateCerita } from '../tipe';
import { adaRekaman, bacaRekaman, berlanggananInvestigasi, catatHasil, pangkat, tamuBaru, versiInvestigasi } from './simpan';
import { skorKasus } from './skor';
import { buktiTerkumpul, hasilKasus, pernyataanTercatat, type Bukti } from './status';
import { BukuCatatan, PotretReaksi } from './ui/BukuCatatan';
import { CapKeberatan } from './ui/CapKeberatan';
import { PenyediaTeksInvestigasi } from './ui/dasar';
import { HasilInvestigasi } from './ui/HasilInvestigasi';
import { JudulKasus } from './ui/JudulKasus';
import { LayarKeberatan } from './ui/LayarKeberatan';
import { KILAS_BARIS, pakaiKeterangan } from './ui/LayarKeterangan';
import { LayarPutusan } from './ui/LayarPutusan';
import { PeriksaSim } from './ui/PeriksaSim';
import './ui/investigasi.css';

type Tx = (k: KunciTeks) => string;

/** Urutan kartu di layar keberatan (kartu yang tepat tidak di tempat pertama); kartu lain mengikuti urutan terkumpul. */
const URUTAN_KARTU: readonly Bukti['id'][] = ['rambu', 'dashcam', 'sim'];
const urutKartu = (bukti: Bukti[]): Bukti[] => [...bukti].sort((a, b) => URUTAN_KARTU.indexOf(a.id) - URUTAN_KARTU.indexOf(b.id));

/** T-079: sesudah "Sematkan": kalimat menulis sendiri 0,9 s, pin jatuh 0,3 s, lalu terbaca sebentar; baru cerita lanjut (md). */
const JEDA_SEMAT_MS = 2000;
const JEDA_PIN_MS = 900;
/** T-085: pin mendarat 150 md sesudah mulai jatuh (animasi bk-pin 0,3 s dengan pantulan): bunyi 'pin' di saat itu. */
const JEDA_BUNYI_PIN_MS = JEDA_PIN_MS + 150;
/** T-085: slip bukti meluncur 0 - 0,5 s, klip menjepit 0,5 - 0,8 s; 'jepit' = kertas lalu jepitan 0,38 s kemudian (0,68 s). */
const JEDA_BUNYI_JEPIT_MS = 300;
/** T-085 cap KEBERATAN: musik hening 0,4 s (sting 'keberatan' berbunyi di lubang itu), lalu kembali dalam 0,9 s. */
const HENING_KEBERATAN_S = 0.4;
const NAIK_KEBERATAN_S = 0.9;

/**
 * T-085: true = layar keterangan (ui/LayarKeterangan) sedang menampilkan panel KILAS BALIK. Aturannya sama dengan komponen itu:
 * ucapan terakhir (bukan narasi) di ketukan kini adalah kalimat kunci KILAS_BARIS. Dipakai pemutar HP untuk sapuan filter musik.
 */
export function kilasBalikKini(ep: Episode, state: StateCerita): boolean {
  if (!pakaiKeterangan(ep, state)) return false;
  const ket = ketukanKini(ep, state);
  if (!ket) return false;
  const ucapan = barisTerlihat(ep, state).slice(ket.awal, ket.akhir + 1).reverse().find((b) => jenisPenutur(ep, b.siapa) !== 'narasi');
  return !!ucapan && ucapan.teks in KILAS_BARIS;
}

/**
 * T-078 node `cap`: cap KEBERATAN menutupi layar 1,5 s (atau diketuk), LALU layar di bawahnya tinggal: petugas tol "kaget" +
 * kalimat keberatan; "Lanjut" baru meneruskan cerita (dulu cap langsung lanjut, jadi reaksinya tidak pernah terlihat).
 */
function LayarCap({ kalimat, tx, onLanjut }: { kalimat: string; tx: Tx; onLanjut: () => void }) {
  const [cap, setCap] = useState(true);
  // T-085: di pukulan KEBERATAN musik konfrontasi jatuh hening; efek 'keberatan' (CapKeberatan) = pukulan + sting di lubang itu.
  useEffect(() => { jedaMusik(HENING_KEBERATAN_S, NAIK_KEBERATAN_S); }, []);
  return (
    <section className="iv-layar iv-cap-bawah" data-cap-bawah="" aria-live="polite">
      {cap ? <CapKeberatan onSelesai={() => setCap(false)} /> : null}
      <PotretReaksi reaksi="tol-kaget" ukuran={128} />
      {kalimat ? <p className="iv-cap-kalimat">{kalimat}</p> : null}
      <button type="button" className="primary-action iv-tombol" data-cap-lanjut="" onClick={onLanjut}>{tx('inv.ui.lanjut')}</button>
    </section>
  );
}

/** "Tamu baru": dua ketukan (tombol, lalu konfirmasi sebaris). Menghapus HANYA rekaman investigasi, lalu `onMulaiUlang`. */
function TamuBaru({ tx, onMulaiUlang }: { tx: Tx; onMulaiUlang: () => void }) {
  const [tanya, setTanya] = useState(false);
  if (!tanya) return <p className="iv-tamu"><button type="button" className="hp-tautan" data-tamu-baru="" onClick={() => setTanya(true)}>{tx('inv.ui.tamuBaru')}</button></p>;
  return (
    <div className="iv-tamu" role="group" aria-label={tx('inv.ui.tamuBaru')}>
      <p className="iv-label">{tx('inv.ui.tamuBaruKet')}</p>
      <p>
        <button type="button" className="hp-tautan" data-tamu-baru-ya="" onClick={() => { tamuBaru(); setTanya(false); onMulaiUlang(); }}>{tx('inv.ui.tamuBaruYa')}</button>
        {' · '}
        <button type="button" className="hp-tautan" onClick={() => setTanya(false)}>{tx('inv.ui.batal')}</button>
      </p>
    </div>
  );
}

/** Node `catat`: kartu pernyataan dengan tombol "Sematkan"; sesudah disemat tandanya terlihat sebentar, lalu mesin lanjut. */
function LayarCatat({ ep, state, id, tx, onLanjut }: { ep: Episode; state: StateCerita; id: string; tx: Tx; onLanjut: () => void }) {
  const [tersemat, setTersemat] = useState(false);
  const lanjutRef = useRef(onLanjut);
  lanjutRef.current = onLanjut;
  useEffect(() => {
    if (!tersemat) return;
    const pin = window.setTimeout(() => playSfx('pin'), JEDA_BUNYI_PIN_MS);
    const w = window.setTimeout(() => lanjutRef.current(), JEDA_SEMAT_MS);
    return () => { window.clearTimeout(pin); window.clearTimeout(w); };
  }, [tersemat]);
  const p = ep.investigasi?.pernyataan.find((x) => x.id === id);
  // Data episode keliru (pernyataan tidak ada): jangan menahan pemain.
  if (!p) return <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={onLanjut}>{tx('inv.ui.lanjut')}</button></section>;
  return (
    // T-079: layar semat = BUKU CATATAN terbuka. Pernyataan baru tampil pudar (pensil) di halaman "Keterangan"; "Sematkan" =
    // kalimatnya menulis sendiri dengan tinta, pin jatuh (T-085: bunyi goresan pensil lalu klik pin), lalu cerita lanjut.
    <section className="iv-layar iv-catat" data-layar-catat="" aria-label={tx('inv.ui.sematJudul')}>
      <p className="iv-label">{tx('inv.ui.sematJudul')}</p>
      <BukuCatatan pernyataan={[...pernyataanTercatat(ep, state).filter((x) => x.id !== p.id), ...(tersemat ? [p] : [])]} bukti={buktiTerkumpul(ep, state)}
        menunggu={tersemat ? undefined : p} pernyataanBaru={tersemat ? p.id : undefined} />
      <button type="button" className="primary-action iv-tombol" data-semat="" disabled={tersemat} aria-live="polite"
        onClick={() => { if (!tersemat) { playSfx('pensil'); setTersemat(true); } }}>
        {tersemat ? tx('inv.ui.tersematBuku') : tx('inv.ui.sematTombol')}
      </button>
    </section>
  );
}

/** Node `bukti`: kartu bukti baru + kalimat temuannya (baris node), lalu "Simpan ke buku catatan" = lanjut. */
function LayarBukti({ ep, state, bukti, keterangan, tx, onLanjut }: { ep: Episode; state: StateCerita; bukti: Bukti | undefined; keterangan: string; tx: Tx; onLanjut: () => void }) {
  // T-080: kartu bukti baru DIJEPIT ke halaman "Bukti" buku catatan (slip meluncur masuk, klip menjepit; T-085: bunyi 'jepit').
  useEffect(() => { const w = window.setTimeout(() => playSfx('jepit'), JEDA_BUNYI_JEPIT_MS); return () => window.clearTimeout(w); }, []);
  const daftar = bukti ? [...buktiTerkumpul(ep, state).filter((x) => x.id !== bukti.id), bukti] : buktiTerkumpul(ep, state);
  return (
    <section className="iv-layar iv-bukti-baru" data-bukti-baru={bukti?.id} aria-labelledby="iv-bukti-baru-judul">
      <div className="iv-bukti-kepala">
        {bukti?.id === 'sim' ? <PotretReaksi reaksi="darto-lega" ukuran={48} /> : null}
        <h2 id="iv-bukti-baru-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx('inv.ui.buktiBaru')}</h2>
      </div>
      {keterangan ? <p>{keterangan}</p> : null}
      <BukuCatatan pernyataan={[]} bukti={daftar} buktiBaru={bukti?.id} halaman="bukti" tanpaPensil />
      <button type="button" className="primary-action iv-tombol" data-simpan-bukti="" onClick={() => { playSfx('kertas'); onLanjut(); }}>{tx('inv.ui.simpan')}</button>
    </section>
  );
}

export function LayarInvestigasi({ ep, state, node, tx, onLanjut, onPilih, onMulaiUlang }: {
  ep: Episode;
  state: StateCerita;
  node: NodeCerita;
  tx: Tx;
  /** Aksi mesin 'lanjut' (tanpa jeda ketuk ganda: dipanggil sekali per layar). */
  onLanjut: () => void;
  /** Aksi mesin 'pilih' untuk node kini; true = diterima. */
  onPilih: (id: string) => boolean;
  /** Mulai kasus dari awal (dipakai "Tamu baru" di kartu judul). */
  onMulaiUlang: () => void;
}) {
  useSyncExternalStore(berlanggananInvestigasi, versiInvestigasi, () => 0);
  const konfig = ep.investigasi;
  const inv = node.investigasi;
  if (!konfig || !inv) return null;
  const barisPertama = node.jenis !== 'cabang' && node.baris[0] ? tx(node.baris[0].teks) : '';
  let isi: ReactNode = null;
  switch (inv.jenis) {
    case 'judul':
      isi = (
        <>
          {/* T-078: bingkai dashcam diam (sebelum benturan: rambu + lajur) di kartu pembuka */}
          <JudulKasus nomor={konfig.nomor} judul={konfig.judul} onMulai={onLanjut} gambar={<BingkaiDashcam besar />} tokoh={<PotretReaksi reaksi="miss-detektif" ukuran={128} />} />
          {adaRekaman() ? <TamuBaru tx={tx} onMulaiUlang={onMulaiUlang} /> : null}
        </>
      );
      break;
    case 'catat':
      isi = <LayarCatat key={node.id} ep={ep} state={state} id={inv.pernyataan} tx={tx} onLanjut={onLanjut} />;
      break;
    case 'bukti':
      isi = <LayarBukti key={node.id} ep={ep} state={state} bukti={konfig.bukti.find((x) => x.id === inv.bukti)} keterangan={barisPertama} tx={tx} onLanjut={onLanjut} />;
      break;
    case 'keberatan': {
      const pernyataan = konfig.pernyataan.find((x) => x.id === inv.pernyataan);
      // Hanya kartu yang SUDAH terkumpul yang dikirim: kartu lain tidak bisa dipilih (mesin pun menolaknya lewat `jika`).
      const bukti = urutKartu(buktiTerkumpul(ep, state));
      if (!pernyataan) { isi = <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={onLanjut}>{tx('inv.ui.lanjut')}</button></section>; break; }
      isi = (
        <LayarKeberatan key={node.id} pernyataan={pernyataan} bukti={bukti} percobaan={inv.percobaan} tepat={inv.tepat}
          onPilih={(id) => {
            // Percobaan 2 (dipandu, node dialog): hanya kartu tepat yang melanjutkan. Percobaan 0 / 1: pilihan mesin.
            if (inv.percobaan === 2) { if (id === inv.tepat) onLanjut(); return; }
            if (onPilih(id) && id !== inv.tepat) playSfx('keliru'); // T-085: dengung rendah lembut
          }} />
      );
      break;
    }
    case 'cap':
      isi = <LayarCap key={node.id} kalimat={barisPertama} tx={tx} onLanjut={onLanjut} />;
      break;
    case 'periksa-sim':
      // T-080: periksa SIM di meja wawancara (3 ketukan); selesai = lanjut ke node kartu bukti SIM.
      isi = <PeriksaSim key={node.id} onSelesai={onLanjut} />;
      break;
    case 'putusan':
      isi = <LayarPutusan key={node.id} onPilih={(p) => { if (onPilih(p)) playSfx('konfirmasi'); }} />;
      break;
    default:
      isi = null;
  }
  return <PenyediaTeksInvestigasi value={tx}>{isi}</PenyediaTeksInvestigasi>;
}

/** Layar hasil (node hasil-investigasi). Rekaman perangkat dicatat di sini (idempoten: aman untuk muat ulang & StrictMode). */
export function HasilKasus({ ep, state, nama, look, tx, onMainLagi }: {
  ep: Episode;
  state: StateCerita;
  nama: string;
  look: PlayerLook;
  tx: Tx;
  /** Mulai kasus dari awal (progres cerita episode ini saja); skor terbaik tetap tersimpan. */
  onMainLagi: () => void;
}) {
  useSyncExternalStore(berlanggananInvestigasi, versiInvestigasi, () => 0);
  const kasus = ep.investigasi?.kasus ?? ep.id;
  const h = hasilKasus(state);
  const total = h ? skorKasus(h).total : null;
  useEffect(() => { if (total !== null) catatHasil(kasus, total); }, [kasus, total]);
  if (!h) {
    // State tanpa ketiga hasil (seharusnya tidak terjadi di jalur naskah): tetap beri jalan keluar.
    return <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={onMainLagi}>{tx('inv.ui.lanjut')}</button></section>;
  }
  const skor = skorKasus(h);
  const r = bacaRekaman();
  // Stempel kasus ini langsung terlihat (efek pencatatan baru berjalan sesudah gambar pertama).
  const stempel = r.stempel.includes(kasus) ? r.stempel : [...r.stempel, kasus];
  const terbaik = Math.max(r.terbaik[kasus] ?? 0, skor.total);
  return (
    <PenyediaTeksInvestigasi value={tx}>
      {/* T-078: Miss Raksa "bangga" bila putusannya tepat (akhir tuntas), "berpikir" bila diluruskan */}
      <HasilInvestigasi skor={skor} nama={nama} look={look} stempel={stempel} pangkat={pangkat(stempel.length)} reaksi={h.putusan === 'layak' ? 'miss-bangga' : 'miss-berpikir'}
        onMainLagi={onMainLagi} onKasusBerikutnya={() => { /* kasus 2 belum ada: komponen menampilkan "segera hadir" */ }} />
      <div className="iv-layar iv-hasil-kaki" data-hasil-kaki="">
        {terbaik > skor.total ? <p className="iv-label" data-skor-terbaik={terbaik}>{tx('inv.ui.terbaik')} {terbaik}</p> : null}
        <TamuBaru tx={tx} onMulaiUlang={onMainLagi} />
      </div>
    </PenyediaTeksInvestigasi>
  );
}

/** Buku catatan (Menu): pernyataan yang sudah disemat + kartu bukti yang sudah terkumpul. */
export function IsiBukuCatatan({ ep, state, tx }: { ep: Episode; state: StateCerita; tx: Tx }) {
  return (
    <PenyediaTeksInvestigasi value={tx}>
      <BukuCatatan pernyataan={pernyataanTercatat(ep, state)} bukti={buktiTerkumpul(ep, state)} />
    </PenyediaTeksInvestigasi>
  );
}
