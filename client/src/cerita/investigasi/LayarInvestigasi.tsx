/**
 * T-076 EPISODE 1 INVESTIGATOR (rencana Task 1): PENGHUBUNG antara mesin cerita dan komponen Task 2 (cerita/investigasi/ui).
 * Pemutar HP (hp/PemainHP.tsx) memanggil pintu-pintu ini hanya untuk episode ber-`investigasi`:
 *  - LayarInvestigasi: layar node ber-`investigasi` (judul, tebak, catat, bukti, periksa-sim, keberatan, cap, koreksi, putusan).
 *    Semua kemajuan lewat mesin (`onLanjut` = aksi lanjut, `onPilih` = aksi pilih), jadi muat ulang di tengah kasus kembali ke
 *    layar yang sama.
 *  - HasilKasus: layar akhir (node hasil-investigasi). T-087: dibuka dengan kalimat Pak Hendra (sesuai pesan yang dikirim), lalu
 *    rincian skor + kartu "Kasus 2 · segera hadir" + "Main lagi" / "Selesai". Rekaman perangkat (skor terbaik + stempel) dicatat
 *    sekali di sini. "Main lagi" = lembar: latih pilihan terlemah (LatihanKasus, TIDAK mengubah skor terbaik) / ulang dari awal /
 *    tamu baru; pada skor sempurna lembar itu menampilkan laporan petugas tol yang sudah dikoreksi.
 *  - GerbangKasus (T-087): masuk lagi dengan kasus yang belum selesai = "Lanjutkan kasus" / "Mulai baru" (dengan konfirmasi).
 *  - IsiBukuCatatan: buku catatan (Menu) dari state.
 * Teks naskah (kunci teks episode) diterjemahkan lewat <PenyediaTeksInvestigasi value={tx}>; teks antarmuka komponen ada di kamus
 * aplikasi `investigasi` (Task 2), teks pembungkus di sini di teks episode (`inv.ui.*`, `inv.hasil.*`, `inv.lagi.*`, ...).
 */
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlayerLook } from '@shared/types';
import { jedaMusik, playSfx } from '../../audio/audio';
import { t } from '../../i18n';
import { Modal } from '../../ui/kit';
import { jenisPenutur, ketukanKini } from '../hp/alur';
import { BingkaiDashcam } from '../hp/arena/ArenaDashcam';
import { babKini, barisTerlihat } from '../mesin';
import { bacaDrafAktivitas, kunjunganAktivitas, simpanDrafAktivitas } from '../simpan';
import type { Ekspresi, Episode, HasilMuat, KunciTeks, NodeCerita, NodeInvestigasi, StateCerita } from '../tipe';
import { PotretPikselHp } from '../ui/latar/piksel/PotretPikselHp';
import { adaRekaman, bacaRekaman, berlanggananInvestigasi, catatHasil, catatIntipKasus2, pangkat, tamuBaru, versiInvestigasi } from './simpan';
import { langkahTerlemah, MAKS_LANGKAH, poinKeberatan, poinLangkah, poinPesan, poinPutusan, skorKasus, type LangkahNilai, type SkorKasus } from './skor';
import { buktiTerkumpul, hasilKasus, PESAN, pernyataanDikoreksi, pernyataanTercatat, tebakanLajur, type Bukti, type HasilKeberatan, type Pesan } from './status';
import { BukuCatatan, PotretReaksi } from './ui/BukuCatatan';
import { CapKeberatan } from './ui/CapKeberatan';
import { PenyediaTeksInvestigasi } from './ui/dasar';
import { HasilInvestigasi } from './ui/HasilInvestigasi';
import { JudulKasus } from './ui/JudulKasus';
import { KoreksiCatatan } from './ui/KoreksiCatatan';
import { LayarKeberatan } from './ui/LayarKeberatan';
import { KILAS_BARIS, pakaiKeterangan } from './ui/LayarKeterangan';
import { LayarPutusan } from './ui/LayarPutusan';
import { PeriksaSim } from './ui/PeriksaSim';
import { PratinjauKasus2, TeaserKasus } from './ui/TeaserKasus';
import { TebakLajur } from './ui/TebakLajur';
import './ui/investigasi.css';
import './ui/alur.css';

type Tx = (k: KunciTeks) => string;

/** Urutan kartu di layar keberatan (kartu yang tepat tidak di tempat pertama); kartu lain mengikuti urutan terkumpul. */
const URUTAN_KARTU: readonly Bukti['id'][] = ['rambu', 'dashcam', 'sim'];
const urutKartu = (bukti: Bukti[]): Bukti[] => [...bukti].sort((a, b) => URUTAN_KARTU.indexOf(a.id) - URUTAN_KARTU.indexOf(b.id));

/** T-079: sesudah "Sematkan": kalimat menulis sendiri 0,9 s, pin jatuh 0,3 s, lalu terbaca sebentar; baru cerita lanjut (md). */
const JEDA_SEMAT_MS = 2000;
const JEDA_PIN_MS = 900;
/** T-085: pin mendarat 150 md sesudah mulai jatuh (animasi bk-pin 0,3 s dengan pantulan): bunyi 'pin' di saat itu. */
const JEDA_BUNYI_PIN_MS = JEDA_PIN_MS + 150;
/** T-087: ketukan kedua pada tombol semat baru dihitung sesudah jeda ini (ketuk ganda tak sengaja tidak melompati tintanya). */
const JEDA_LEWATI_MS = 350;
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

// ------------------------------------------------------------------ periksa SIM: langkah yang bisa dilanjutkan (T-087)

/**
 * Langkah periksa SIM (0..2) disimpan sebagai DRAF kunjungan node itu (cerita/simpan.ts: satu draf per episode, kunci = node +
 * langkah mesin; "mulai baru" menghapusnya). Bukan progres mesin: hanya supaya muat ulang di tengah tiga ketukan itu tidak
 * mengulangnya dari awal.
 */
const DRAF_SIM = 'periksaSim';
export function langkahSimTersimpan(ep: Episode, state: StateCerita): 0 | 1 | 2 {
  const d = bacaDrafAktivitas(ep.id, kunjunganAktivitas(state));
  const n = d && typeof d === 'object' ? (d as Record<string, unknown>)[DRAF_SIM] : null;
  return n === 1 || n === 2 ? n : 0;
}
function simpanLangkahSim(ep: Episode, state: StateCerita, n: 0 | 1 | 2 | null): void {
  simpanDrafAktivitas(ep.id, kunjunganAktivitas(state), n ? { [DRAF_SIM]: n } : {});
}

// ------------------------------------------------------------------ bagian kecil bersama

/** Ucapan nasabah (Pak Hendra): potret piksel + nama + peran + kalimatnya. */
function UcapanNasabah({ ep, tx, ekspresi, teks, kecil = false }: { ep: Episode; tx: Tx; ekspresi: Ekspresi; teks: string; kecil?: boolean }) {
  const p = ep.pemeran[ep.nasabah];
  return (
    <figure className="iv-ucap" data-kecil={kecil ? '' : undefined}>
      <PotretPikselHp tokoh="hendra" ekspresi={ekspresi} ukuran={kecil ? 48 : 64} label="" />
      <figcaption>
        {p ? <b>{tx(p.nama)}<small>{tx(p.peran)}</small></b> : null}
        <q>{teks}</q>
      </figcaption>
    </figure>
  );
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

/**
 * Node `catat`: buku catatan terbuka dengan tombol "Sematkan"; sesudah disemat kalimatnya menulis sendiri, pin jatuh, lalu mesin
 * lanjut (2 detik). T-087 (review pilot butir 7): upacara yang BERULANG bisa dilewati. Pin PERTAMA seorang tamu tetap utuh (tombol
 * mati selama tinta menulis); begitu sudah ada pernyataan lain tersemat di kasus ini, atau perangkat ini sudah pernah menamatkan
 * kasus (main ulang), tombolnya tetap hidup sebagai "Lanjut": ketukan kedua = pin langsung terpasang dan cerita lanjut.
 */
function LayarCatat({ ep, state, id, tx, onLanjut }: { ep: Episode; state: StateCerita; id: string; tx: Tx; onLanjut: () => void }) {
  const [tersemat, setTersemat] = useState(false);
  const lanjutRef = useRef(onLanjut);
  lanjutRef.current = onLanjut;
  const sudahLanjut = useRef(false);
  const saatSemat = useRef(0);
  const lanjut = () => { if (sudahLanjut.current) return; sudahLanjut.current = true; lanjutRef.current(); };
  useEffect(() => {
    if (!tersemat) return;
    const pin = window.setTimeout(() => playSfx('pin'), JEDA_BUNYI_PIN_MS);
    const w = window.setTimeout(lanjut, JEDA_SEMAT_MS);
    return () => { window.clearTimeout(pin); window.clearTimeout(w); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tersemat]);
  const p = ep.investigasi?.pernyataan.find((x) => x.id === id);
  // Data episode keliru (pernyataan tidak ada): jangan menahan pemain.
  if (!p) return <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={onLanjut}>{tx('inv.ui.lanjut')}</button></section>;
  const lain = pernyataanTercatat(ep, state).filter((x) => x.id !== p.id);
  const bolehLewati = lain.length > 0 || adaRekaman();
  return (
    // T-079: layar semat = BUKU CATATAN terbuka. Pernyataan baru tampil pudar (pensil) di halaman "Keterangan"; "Sematkan" =
    // kalimatnya menulis sendiri dengan tinta, pin jatuh (T-085: bunyi goresan pensil lalu klik pin), lalu cerita lanjut.
    <section className="iv-layar iv-catat" data-layar-catat="" aria-label={tx('inv.ui.sematJudul')}>
      <p className="iv-label">{tx('inv.ui.sematJudul')}</p>
      <BukuCatatan pernyataan={[...lain, ...(tersemat ? [p] : [])]} bukti={buktiTerkumpul(ep, state)}
        menunggu={tersemat ? undefined : p} pernyataanBaru={tersemat ? p.id : undefined} />
      <button type="button" className="primary-action iv-tombol" data-semat="" data-lewati={tersemat && bolehLewati ? '' : undefined} disabled={tersemat && !bolehLewati} aria-live="polite"
        onClick={() => {
          if (!tersemat) { playSfx('pensil'); saatSemat.current = performance.now(); setTersemat(true); return; }
          if (!bolehLewati || performance.now() - saatSemat.current < JEDA_LEWATI_MS) return;
          playSfx('pin');
          lanjut();
        }}>
        {tersemat ? (bolehLewati ? tx('inv.ui.lanjut') : tx('inv.ui.tersematBuku')) : tx('inv.ui.sematTombol')}
      </button>
    </section>
  );
}

/**
 * Node `bukti`: kartu bukti baru + kalimat temuannya (baris node), lalu "Simpan ke buku catatan" = lanjut. T-087: boleh beberapa
 * kartu sekaligus (dashcam + rambu dalam satu halaman buku), dan `balik` = kalimat "Tebakan awalmu: lajur X" sesudah rekaman
 * diputar. Tombolnya hidup sejak awal: ketukan selama slip masih meluncur langsung melanjutkan (tidak pernah menahan tamu).
 */
function LayarBukti({ ep, state, bukti, keterangan, balik, tx, onLanjut }: { ep: Episode; state: StateCerita; bukti: Bukti[]; keterangan: string; balik: string; tx: Tx; onLanjut: () => void }) {
  // T-080: kartu bukti baru DIJEPIT ke halaman "Bukti" buku catatan (slip meluncur masuk, klip menjepit; T-085: bunyi 'jepit').
  useEffect(() => { const w = window.setTimeout(() => playSfx('jepit'), JEDA_BUNYI_JEPIT_MS); return () => window.clearTimeout(w); }, []);
  const baru = bukti.map((b) => b.id);
  const daftar = [...buktiTerkumpul(ep, state).filter((x) => !baru.includes(x.id)), ...bukti];
  return (
    <section className="iv-layar iv-bukti-baru" data-bukti-baru={baru.join(' ')} aria-labelledby="iv-bukti-baru-judul">
      <div className="iv-bukti-kepala">
        {baru.includes('sim') ? <PotretReaksi reaksi="darto-lega" ukuran={48} /> : null}
        <h2 id="iv-bukti-baru-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx('inv.ui.buktiBaru')}</h2>
      </div>
      {balik ? <p className="iv-tempel iv-tebak-balik" data-tebak-balik="">{balik}</p> : null}
      {keterangan ? <p>{keterangan}</p> : null}
      <BukuCatatan pernyataan={[]} bukti={daftar} buktiBaru={baru} halaman="bukti" tanpaPensil />
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
    case 'tebak':
      // T-087: tebakan lajur di bingkai pembuka (tanpa benar / salah): satu ketukan = pilihan mesin '1'..'4' (tanda tebak:<n>).
      isi = <TebakLajur key={node.id} pilihan={tebakanLajur(state) ?? undefined} onPilih={(n) => { if (onPilih(String(n))) playSfx('konfirmasi'); }} />;
      break;
    case 'catat':
      isi = <LayarCatat key={node.id} ep={ep} state={state} id={inv.pernyataan} tx={tx} onLanjut={onLanjut} />;
      break;
    case 'bukti': {
      const id = [inv.bukti, ...(inv.juga ?? [])];
      const tebakan = id.includes('dashcam') ? tebakanLajur(state) : null;
      isi = <LayarBukti key={node.id} ep={ep} state={state} bukti={konfig.bukti.filter((x) => id.includes(x.id))} keterangan={barisPertama}
        balik={tebakan ? tx(`inv.tebak.balik.${tebakan}`) : ''} tx={tx} onLanjut={onLanjut} />;
      break;
    }
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
    case 'koreksi':
      // T-087 / T-088: petugas mencoret "3" dan menulis "2" (KoreksiCatatan); "Lanjut" = lanjut, efek node memasang koreksi:<id>.
      isi = <KoreksiCatatan key={node.id} pernyataan={konfig.pernyataan.find((x) => x.id === inv.pernyataan)} onSelesai={onLanjut} />;
      break;
    case 'periksa-sim':
      // T-080: periksa SIM di meja wawancara (3 ketukan); selesai = lanjut ke node kartu bukti SIM. T-087: langkahnya disimpan
      // sebagai draf kunjungan, jadi muat ulang melanjutkan dari langkah yang sama.
      isi = <PeriksaSim key={node.id} awal={langkahSimTersimpan(ep, state)} onLangkah={(n) => simpanLangkahSim(ep, state, n)}
        onSelesai={() => { simpanLangkahSim(ep, state, null); onLanjut(); }} />;
      break;
    case 'putusan':
      isi = <LayarPutusan key={node.id} onPilih={(p) => { if (onPilih(p)) playSfx('konfirmasi'); }} />;
      break;
    default:
      isi = null;
  }
  return <PenyediaTeksInvestigasi value={tx}>{isi}</PenyediaTeksInvestigasi>;
}

// ------------------------------------------------------------------ gerbang masuk (T-087, review pilot butir 4)

/** true = halaman dibuka dengan kasus Investigator yang BELUM selesai (ada aksi tersimpan): tawarkan lanjut atau mulai baru. */
export function perluGerbangKasus(ep: Episode, muat: HasilMuat): boolean {
  return !!ep.investigasi && muat.status === 'lanjut' && !muat.state.akhir && muat.state.langkah > 0;
}

/**
 * "Lanjutkan kasus" / "Mulai baru". Mulai baru meminta konfirmasi dan hanya menyentuh Investigator: progres episode ini
 * (diarsipkan, cerita/simpan.ts) dan rekaman skor / stempel perangkat (`tamuBaru`); episode lain dan profil tidak disentuh.
 * Tampil juga bila belum ada rekaman hadiah (kasus pertama yang ditinggal di tengah jalan).
 */
export function GerbangKasus({ ep, state, tx, onLanjut, onBaru }: { ep: Episode; state: StateCerita; tx: Tx; onLanjut: () => void; onBaru: () => void }) {
  const [tanya, setTanya] = useState(false);
  const konfig = ep.investigasi;
  const bab = babKini(ep, state);
  return (
    <section className="iv-layar iv-gerbang" data-gerbang-kasus="" aria-labelledby="iv-gerbang-judul">
      <PotretReaksi reaksi="miss-detektif" ukuran={128} />
      {konfig ? <p className="iv-label">{t('investigasi.kasus', { n: konfig.nomor })} · {tx(konfig.judul)}</p> : null}
      <h2 id="iv-gerbang-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx('inv.gerbang.judul')}</h2>
      <p>{tx('inv.gerbang.ket')}</p>
      {bab ? <p className="iv-gerbang-posisi">{t('cerita.bagian', { n: bab.nomor, total: bab.jumlah })} · {tx(bab.bab.judul)}</p> : null}
      {tanya ? (
        <div className="iv-gerbang-tanya" role="group" aria-label={tx('inv.gerbang.baru')}>
          <p className="iv-tempel" role="status">{tx('inv.gerbang.tanya')}</p>
          <button type="button" className="akh-kedua iv-tombol" data-gerbang-ya="" onClick={onBaru}>{tx('inv.gerbang.ya')}</button>
          <button type="button" className="primary-action iv-tombol" data-gerbang-batal="" onClick={() => setTanya(false)}>{tx('inv.ui.batal')}</button>
        </div>
      ) : (
        <>
          <button type="button" className="primary-action iv-tombol" data-gerbang-lanjut="" onClick={onLanjut}>{tx('inv.gerbang.lanjut')}</button>
          <button type="button" className="akh-kedua iv-tombol" data-gerbang-baru="" onClick={() => setTanya(true)}>{tx('inv.gerbang.baru')}</button>
        </>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ latihan pilihan terlemah (T-087, review pilot butir 6)

const EKSPRESI_PESAN: Record<Pesan, Ekspresi> = { baik: 'lega', datar: 'bingung', janji: 'senang' };

/** Latihan KEBERATAN: tiga percobaan seperti di kasus (petunjuk, lalu dipandu), dengan cap bila tepat. Tidak menyentuh mesin. */
function LatihanKeberatan({ ep, state, tx, onHasil }: { ep: Episode; state: StateCerita; tx: Tx; onHasil: (h: HasilKeberatan) => void }) {
  const acuan = Object.values(ep.node).map((n) => n.investigasi).find((i): i is Extract<NodeInvestigasi, { jenis: 'keberatan' }> => i?.jenis === 'keberatan');
  const pernyataan = ep.investigasi?.pernyataan.find((x) => x.id === acuan?.pernyataan);
  const tepat = acuan?.tepat ?? 'dashcam';
  const [percobaan, setPercobaan] = useState<0 | 1 | 2>(0);
  /** Kalimat Miss Raksa sesudah kartu yang keliru (menunggu "Lanjut"). */
  const [sela, setSela] = useState<string | null>(null);
  const [cap, setCap] = useState<HasilKeberatan | null>(null);
  if (!pernyataan) return <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={() => onHasil('dipandu')}>{tx('inv.ui.lanjut')}</button></section>;
  if (cap) {
    return (
      <section className="iv-layar iv-cap-bawah" aria-live="polite">
        <CapKeberatan onSelesai={() => onHasil(cap)} />
        <PotretReaksi reaksi="tol-kaget" ukuran={128} />
        <p className="iv-cap-kalimat">{tx('inv.keb.cap')}</p>
      </section>
    );
  }
  if (sela) {
    return (
      <section className="iv-layar iv-latihan-sela" data-latihan-sela="">
        <p className="iv-tempel iv-pandu" role="status"><PotretReaksi reaksi="miss-berpikir" ukuran={48} /><span>{sela}</span></p>
        <button type="button" className="primary-action iv-tombol" onClick={() => { setSela(null); setPercobaan((n) => (n === 0 ? 1 : 2)); }}>{tx('inv.ui.lanjut')}</button>
      </section>
    );
  }
  return (
    <LayarKeberatan key={percobaan} pernyataan={pernyataan} bukti={urutKartu(buktiTerkumpul(ep, state))} percobaan={percobaan} tepat={tepat}
      onPilih={(id) => {
        if (id === tepat) { jedaMusik(HENING_KEBERATAN_S, NAIK_KEBERATAN_S); setCap(percobaan === 0 ? 'tepat' : percobaan === 1 ? 'tepat-kedua' : 'dipandu'); return; }
        if (percobaan === 2) return;
        playSfx('keliru');
        setSela(tx(percobaan === 0 ? `inv.keb.salah.${id}` : `inv.keb.pandu.${id}`));
      }} />
  );
}

/** Latihan PESAN untuk Pak Hendra: tiga pesan dari node `pesan` episode (urutan naskah), pilih satu lalu kirim. */
function LatihanPesan({ ep, tx, onHasil }: { ep: Episode; tx: Tx; onHasil: (p: Pesan) => void }) {
  const node = ep.node.pesan;
  const pilihan = node?.jenis === 'pilihan' ? node.pilihan.filter((x) => (PESAN as readonly string[]).includes(x.id)) : [];
  const [pilih, setPilih] = useState<Pesan | null>(null);
  return (
    <section className="iv-layar iv-latihan-pesan" data-latihan-pesan="" aria-labelledby="iv-latihan-pesan-tanya">
      <UcapanNasabah ep={ep} tx={tx} ekspresi="cemas" teks={tx('inv.pesan.2')} kecil />
      <h2 id="iv-latihan-pesan-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx('inv.pesan.tanya')}</h2>
      <div className="iv-daftar" role="radiogroup" aria-labelledby="iv-latihan-pesan-tanya">
        {pilihan.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={pilih === x.id} className="iv-pesan-kartu" data-pesan={x.id} onClick={() => setPilih(x.id as Pesan)}>
            <span>{tx(x.teks)}</span>
            <span className="iv-bukti-tanda" aria-hidden="true">{pilih === x.id ? '✓' : ''}</span>
          </button>
        ))}
      </div>
      <button type="button" className="primary-action iv-tombol" data-latihan-kirim="" disabled={!pilih} onClick={() => { if (pilih) { playSfx('pesanKirim'); onHasil(pilih); } }}>{tx('inv.latihan.kirim')}</button>
    </section>
  );
}

/**
 * LATIHAN satu langkah yang dinilai, dengan konteks kasus (buku catatan dari state akhir). Hanya tampilan: mesin cerita, skor
 * kasus dan rekaman perangkat TIDAK disentuh, jadi skor terbaik permainan penuh tidak bisa berubah dari sini.
 */
function LatihanKasus({ ep, state, langkah, skor, tx, onSelesai }: { ep: Episode; state: StateCerita; langkah: LangkahNilai; skor: SkorKasus; tx: Tx; onSelesai: () => void }) {
  const [putaran, setPutaran] = useState(0);
  const [hasil, setHasil] = useState<{ poin: number; ucapan?: { ekspresi: Ekspresi; teks: string }; kalimat: string } | null>(null);
  const maks = MAKS_LANGKAH[langkah];
  const tadi = poinLangkah(skor, langkah);
  const pita = <p className="iv-latihan-pita" data-latihan={langkah}>{tx('inv.latihan.label')} · {tx(`inv.lagi.langkah.${langkah}`)}</p>;
  if (hasil) {
    const baris: [string, number, boolean][] = [[tx('inv.latihan.tadi'), tadi, false], [tx('inv.latihan.kini'), hasil.poin, true]];
    return (
      <section className="iv-layar iv-latihan-hasil" data-latihan-hasil={langkah} aria-labelledby="iv-latihan-judul">
        {pita}
        <h2 id="iv-latihan-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx('inv.latihan.hasil')}</h2>
        {hasil.ucapan ? <UcapanNasabah ep={ep} tx={tx} ekspresi={hasil.ucapan.ekspresi} teks={hasil.ucapan.teks} kecil /> : null}
        {hasil.kalimat ? <p className="iv-tempel iv-pandu"><PotretReaksi reaksi={hasil.poin >= maks ? 'miss-bangga' : 'miss-berpikir'} ukuran={48} /><span>{hasil.kalimat}</span></p> : null}
        <ul className="iv-poin">
          {baris.map(([nama, n, kini]) => (
            <li key={nama} data-kini={kini ? '' : undefined}>
              <span className="iv-poin-nama">{nama}</span>
              <span className="iv-poin-batang" aria-hidden="true"><i style={{ width: `${(n / maks) * 100}%` }} /></span>
              <span className="iv-poin-angka"><b>{n}</b> / {maks}</span>
            </li>
          ))}
        </ul>
        <p className="iv-label">{tx(hasil.poin > tadi ? 'inv.latihan.naik' : 'inv.latihan.sama')}</p>
        <div className="iv-latihan-aksi">
          {hasil.poin < maks ? <button type="button" className="akh-kedua iv-tombol" data-latihan-lagi="" onClick={() => { setHasil(null); setPutaran((n) => n + 1); }}>{tx('inv.latihan.cobaLagi')}</button> : null}
          <button type="button" className="primary-action iv-tombol" data-latihan-kembali="" onClick={onSelesai}>{tx('inv.latihan.kembali')}</button>
        </div>
      </section>
    );
  }
  return (
    <>
      <div className="iv-layar">{pita}</div>
      {langkah === 'keberatan' ? <LatihanKeberatan key={putaran} ep={ep} state={state} tx={tx} onHasil={(h) => setHasil({ poin: poinKeberatan(h), kalimat: tx('inv.keb.cap') })} />
        : langkah === 'putusan' ? <LayarPutusan key={putaran} onPilih={(p) => { playSfx('konfirmasi'); setHasil({ poin: poinPutusan(p), kalimat: tx(`inv.putusan.${p}.1`) }); }} />
          : <LatihanPesan key={putaran} ep={ep} tx={tx} onHasil={(p) => setHasil({ poin: poinPesan(p), ucapan: { ekspresi: EKSPRESI_PESAN[p], teks: tx(`inv.pesan.${p}.1`) }, kalimat: p === 'baik' ? '' : tx(`inv.pesan.${p}.2`) })} />}
    </>
  );
}

// ------------------------------------------------------------------ layar hasil

/**
 * Layar hasil (node hasil-investigasi). Rekaman perangkat dicatat di sini (idempoten: aman untuk muat ulang & StrictMode).
 * T-087: (1) dibuka dengan kalimat Pak Hendra menurut pesan yang dikirim; (2) rincian skor. Cap stempel mendarat hanya bila
 * stempel kasus ini BELUM ada sebelum hasil ini (rekaman dibaca sekali saat layar dipasang, sebelum dicatat); "Rekor baru!" hanya
 * bila skor terbaik yang sudah ada terlampaui. Ketukan pada kartu kasus 2 dihitung di rekaman perangkat (`intipKasus2`).
 */
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
  const navigasi = useNavigate();
  const kasus = ep.investigasi?.kasus ?? ep.id;
  const h = hasilKasus(state);
  const total = h ? skorKasus(h).total : null;
  /** Rekaman SEBELUM hasil ini dicatat: dasar "stempel baru" dan "rekor baru". Muat ulang di layar ini = keduanya sudah lewat. */
  const [sebelum] = useState(() => bacaRekaman());
  useEffect(() => { if (total !== null) catatHasil(kasus, total); }, [kasus, total]);
  const [tahap, setTahap] = useState<'ucapan' | 'skor'>('ucapan');
  const [lembar, setLembar] = useState<'lagi' | 'pratinjau' | null>(null);
  const [latihan, setLatihan] = useState<LangkahNilai | null>(null);
  /** Perayaan (cap mendarat, "Rekor baru!", bunyinya) hanya pada tampilan pertama rincian skor, bukan sepulang dari latihan. */
  const [segar, setSegar] = useState(true);
  if (!h) {
    // State tanpa ketiga hasil (seharusnya tidak terjadi di jalur naskah): tetap beri jalan keluar.
    return <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={onMainLagi}>{tx('inv.ui.lanjut')}</button></section>;
  }
  const skor = skorKasus(h);
  if (latihan) {
    return <PenyediaTeksInvestigasi value={tx}><LatihanKasus key={latihan} ep={ep} state={state} langkah={latihan} skor={skor} tx={tx} onSelesai={() => setLatihan(null)} /></PenyediaTeksInvestigasi>;
  }
  if (tahap === 'ucapan') {
    const akhir = state.akhir ? ep.akhir[state.akhir] : undefined;
    return (
      <section className="iv-layar iv-hendra" data-hasil-ucapan={h.pesan} aria-labelledby="iv-hendra-judul">
        <h2 id="iv-hendra-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{akhir ? tx(akhir.judul) : t('investigasi.hasil.judul')}</h2>
        <UcapanNasabah ep={ep} tx={tx} ekspresi={EKSPRESI_PESAN[h.pesan]} teks={tx(`inv.hasil.hendra.${h.pesan}`)} />
        <button type="button" className="primary-action iv-tombol" data-lihat-hasil="" onClick={() => setTahap('skor')}>{tx('inv.hasil.lihat')}</button>
      </section>
    );
  }
  const r = bacaRekaman();
  // Stempel kasus ini langsung terlihat (efek pencatatan baru berjalan sesudah gambar pertama).
  const stempel = r.stempel.includes(kasus) ? r.stempel : [...r.stempel, kasus];
  const lama = sebelum.terbaik[kasus];
  const lemah = langkahTerlemah(skor);
  const dikoreksi = pernyataanDikoreksi(ep, state);
  const tutup = () => setLembar(null);
  return (
    <PenyediaTeksInvestigasi value={tx}>
      {/* T-078: Miss Raksa "bangga" bila putusannya tepat (akhir tuntas), "berpikir" bila diluruskan */}
      <HasilInvestigasi skor={skor} nama={nama} look={look} stempel={stempel} pangkat={pangkat(stempel.length)} reaksi={h.putusan === 'layak' ? 'miss-bangga' : 'miss-berpikir'}
        stempelBaru={segar && !sebelum.stempel.includes(kasus)} rekor={segar && lama !== undefined && skor.total > lama} terbaik={Math.max(r.terbaik[kasus] ?? 0, lama ?? 0)}
        onMainLagi={() => setLembar('lagi')} onSelesai={() => navigasi('/cerita')}
        teaser={<TeaserKasus onBuka={() => { catatIntipKasus2(); setLembar('pratinjau'); }} />} />
      {lembar === 'pratinjau' ? <PratinjauKasus2 onTutup={tutup} /> : null}
      {lembar === 'lagi' ? (
        <Modal judul={t('investigasi.hasil.mainLagi')} onTutup={tutup} lebar={420}>
          <div className="iv-lagi" data-lembar-main-lagi="">
            {lemah ? (
              <>
                <button type="button" className="iv-lagi-pilih" data-utama="" data-latih={lemah} onClick={() => { tutup(); setSegar(false); setLatihan(lemah); }}>
                  <b>{tx('inv.lagi.lemah')}</b>
                  <span>{tx(`inv.lagi.langkah.${lemah}`)} · {poinLangkah(skor, lemah)} / {MAKS_LANGKAH[lemah]}</span>
                </button>
                <p className="iv-lagi-ket">{tx('inv.lagi.lemahKet')}</p>
              </>
            ) : (
              <>
                {/* Skor sempurna: hadiahnya laporan petugas tol yang sudah dikoreksi (halaman "Keterangan" buku catatan). */}
                <p className="iv-lagi-sempurna" data-hadiah-sempurna="">{tx('inv.lagi.sempurna')}</p>
                {dikoreksi ? <BukuCatatan pernyataan={[dikoreksi]} bukti={[]} halaman="keterangan" tanpaPensil koreksi={{ id: dikoreksi.id, teks: t('investigasi.koreksi.baris') }} /> : null}
              </>
            )}
            <button type="button" className="iv-lagi-pilih" data-ulang-awal="" onClick={() => { tutup(); onMainLagi(); }}>
              <b>{tx('inv.lagi.awal')}</b>
              <span>{tx('inv.lagi.awalKet')}</span>
            </button>
            <TamuBaru tx={tx} onMulaiUlang={() => { tutup(); onMainLagi(); }} />
          </div>
        </Modal>
      ) : null}
    </PenyediaTeksInvestigasi>
  );
}

/** Buku catatan (Menu): pernyataan yang sudah disemat + kartu bukti yang sudah terkumpul (+ T-087: baris "Laporan dikoreksi"). */
export function IsiBukuCatatan({ ep, state, tx }: { ep: Episode; state: StateCerita; tx: Tx }) {
  const dikoreksi = pernyataanDikoreksi(ep, state);
  return (
    <PenyediaTeksInvestigasi value={tx}>
      <BukuCatatan pernyataan={pernyataanTercatat(ep, state)} bukti={buktiTerkumpul(ep, state)}
        koreksi={dikoreksi ? { id: dikoreksi.id, teks: t('investigasi.koreksi.baris') } : undefined} />
    </PenyediaTeksInvestigasi>
  );
}
