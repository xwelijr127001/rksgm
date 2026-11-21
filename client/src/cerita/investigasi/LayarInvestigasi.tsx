/**
 * T-076 EPISODE 1 INVESTIGATOR (rencana Task 1): PENGHUBUNG antara mesin cerita dan komponen Task 2 (cerita/investigasi/ui).
 * Pemutar HP (hp/PemainHP.tsx) memanggil pintu-pintu ini hanya untuk episode ber-`investigasi`:
 *  - LayarInvestigasi: layar node ber-`investigasi` (judul, tebak, catat, bukti, periksa-*, keberatan, cap, koreksi, putusan).
 *    Semua kemajuan lewat mesin (`onLanjut` = aksi lanjut, `onPilih` = aksi pilih), jadi muat ulang di tengah kasus kembali ke
 *    layar yang sama.
 *  - HasilKasus: layar akhir (node hasil-investigasi). T-087: dibuka dengan kalimat nasabah (sesuai pesan yang dikirim), lalu
 *    rincian skor + kartu kasus berikutnya + "Main lagi" / "Selesai". Rekaman perangkat (skor terbaik + stempel) dicatat sekali di
 *    sini. "Main lagi" = lembar: latih pilihan terlemah (LatihanKasus, TIDAK mengubah skor terbaik) / ulang dari awal / tamu
 *    baru; pada skor sempurna lembar itu menampilkan pernyataan yang sudah dikoreksi.
 *  - GerbangKasus (T-087): masuk lagi dengan kasus yang belum selesai = "Lanjutkan kasus" / "Mulai baru" (dengan konfirmasi).
 *  - IsiBukuCatatan: buku catatan (Menu) dari state.
 *
 * T-090 (kasus berbasis DATA): tidak ada lagi isi kasus 1 yang tertanam di sini. Yang berbeda antar kasus dibaca dari
 * `Episode.investigasi` (cerita/tipe.ts KonfigInvestigasi): urutan kartu / kartu tepat / pernyataan KEBERATAN (kasus dan
 * latihan), kartu yang bisa diperbesar, teks koreksi, tebakan pembuka, gambar judul, nasabah dan balasannya, tabel putusan,
 * kasus berikutnya, arsip. Kunci teks naskah memakai `konfig.awalan` (`kunci()`), mis. `inv.keb.cap` / `inv2.keb.cap`.
 *
 * Teks naskah (kunci teks episode) diterjemahkan lewat <PenyediaTeksInvestigasi value={tx}>; teks antarmuka komponen ada di kamus
 * aplikasi `investigasi` (Task 2), teks pembungkus di sini di teks episode (`inv.ui.*`, `inv.hasil.*`, `inv.lagi.*`, ...).
 */
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PlayerLook } from '@shared/types';
import { jedaMusik, playSfx } from '../../audio/audio';
import { t, useBahasa } from '../../i18n';
import { Modal } from '../../ui/kit';
import { cariEpisode } from '../episode';
import { jenisPenutur, ketukanKini } from '../hp/alur';
import { BingkaiDashcam } from '../hp/arena/ArenaDashcam';
import { babKini, barisTerlihat } from '../mesin';
import { bacaDrafAktivitas, kunjunganAktivitas, mulaiBaru, simpanDrafAktivitas } from '../simpan';
import { teksCerita } from '../teks';
import type { Ekspresi, Episode, HasilMuat, KonfigInvestigasi, KunciTeks, NodeCerita, NodeInvestigasi, PanelCard, Round, StateCerita } from '../tipe';
import { PotretPikselHp } from '../ui/latar/piksel/PotretPikselHp';
import { tokohPotret } from '../ui/latar/piksel/potret';
import { aksiLanjut, daftarKasusHub, tamuBaruSemuaKasus, tujuanPangkat, type KasusHub } from './hub';
import { RUTE_HUB, ruteKasus, useRumahCerita } from './rute';
import { adaRekaman, bacaRekaman, berlanggananInvestigasi, catatHadiah, catatHasil, catatIntipKasus2, hadiahRekaman, pangkatRekaman, stempelSeri, TOTAL_MAKS, totalSkor, versiInvestigasi } from './simpan';
import { poinBabak, poinKeberatan, poinPesan, poinPutusan, putusanTepat, skorKasus, skorKasusLengkap, titikTerlemah, type TitikLatihan } from './skor';
import { buktiTerkumpul, hasilKasus, hasilKasusLengkap, PESAN, PILIH_LANJUT, PILIH_TEKAN, pernyataanTercatat, semuaPernyataanDikoreksi, tebakanAwal, tekananTerbuka, type Bukti, type HasilBabak, type HasilKeberatan, type Pernyataan, type Pesan, type Putusan } from './status';
import { BukuCatatan, PotretReaksi, reaksiSah, type KoreksiPernyataan } from './ui/BukuCatatan';
import { CapKeberatan } from './ui/CapKeberatan';
import { PenyediaTeksInvestigasi } from './ui/dasar';
import { HasilInvestigasi } from './ui/HasilInvestigasi';
import { JudulKasus } from './ui/JudulKasus';
import { KoreksiCatatan } from './ui/KoreksiCatatan';
import { LayarKeberatan } from './ui/LayarKeberatan';
import { KILAS_BARIS, pakaiKeterangan } from './ui/LayarKeterangan';
import { LayarPutusan } from './ui/LayarPutusan';
import { PeriksaPerjalanan } from './ui/PeriksaPerjalanan';
import { PeriksaPolis } from './ui/PeriksaPolis';
import { PeriksaSim } from './ui/PeriksaSim';
import { seniKasus } from './ui/seniKasus';
import { evidenceArt, PanelAward, PanelExhibit, PanelRound, PressPanel } from './ui/panel';
import { useLabelPanel } from './ui/panel/teks';
import { TebakLajur, type Lajur } from './ui/TebakLajur';
import './ui/investigasi.css';
import './ui/alur.css';

type Tx = (k: KunciTeks) => string;

/** Kunci teks naskah kasus: `<awalan>.<ekor>` (awalan 'inv' = kasus 1, 'inv2' = kasus 2; daftar ekor di KonfigInvestigasi). */
const kunci = (konfig: KonfigInvestigasi, ekor: string): KunciTeks => `${konfig.awalan}.${ekor}`;

/** Urutan kartu di layar keberatan = `konfig.keberatan.urutan` (kartu yang tepat tidak di tempat pertama); kartu lain di belakang. */
function urutKartu(konfig: KonfigInvestigasi, bukti: Bukti[]): Bukti[] {
  const ke = (b: Bukti) => { const i = konfig.keberatan.urutan.indexOf(b.id); return i < 0 ? konfig.keberatan.urutan.length : i; };
  return [...bukti].sort((a, b) => ke(a) - ke(b));
}

/** Teks layar KEBERATAN kasus (T-090): pertanyaan kasus hanya di percobaan pertama; tanpa `layar` = teks bawaan komponen. */
function teksKeberatan(konfig: KonfigInvestigasi, percobaan: 0 | 1 | 2, tx: Tx): { tanya?: string; petunjuk1?: string; petunjuk2?: string } {
  const l = konfig.keberatan.layar;
  return l ? { tanya: percobaan === 0 ? tx(l.tanya) : undefined, petunjuk1: tx(l.petunjuk1), petunjuk2: tx(l.petunjuk2) } : {};
}

/** Teks layar putusan kasus (T-090); tanpa `putusanLayar` = teks bawaan komponen (kasus 1). */
function teksPutusan(konfig: KonfigInvestigasi, tx: Tx): { ket?: string; sebab?: Record<Putusan, string>; nama?: Record<Putusan, string>; tanya?: string } {
  const l = konfig.putusanLayar;
  if (!l) return {};
  const tiga = (r: Record<Putusan, KunciTeks>): Record<Putusan, string> => ({ layak: tx(r.layak), tambahan: tx(r.tambahan), polis: tx(r.polis) });
  // T-106: kasus ber-`nama` (kasus 3) memakai nama tampil dan pertanyaan kasusnya sendiri; kasus 1-2 tetap memakai kamus.
  return { ket: tx(l.ket), sebab: tiga(l.sebab), ...(l.nama ? { nama: tiga(l.nama), tanya: tx(kunci(konfig, 'putusan.tanya')) } : {}) };
}

/** Baris koreksi di buku catatan: teks kasus (`konfig.koreksi.baris`) atau baris kamus kasus 1 ("Laporan dikoreksi: lajur 2"). */
function koreksiBuku(ep: Episode, state: StateCerita, tx: Tx): { pernyataan: Pernyataan[]; koreksi: KoreksiPernyataan[] } | null {
  // T-106: SEMUA pernyataan yang sudah dikoreksi (kasus ber-panel: satu per babak). Baris koreksinya: babak panel =
  // Round.correctionKey; selain itu teks kasus (`konfig.koreksi.baris`) atau baris kamus kasus 1.
  const daftar = semuaPernyataanDikoreksi(ep, state);
  if (!daftar.length) return null;
  const konfig = ep.investigasi;
  const baris = (p: Pernyataan): string => {
    const r = konfig?.panel?.rounds.find((x) => x.statementId === p.id);
    return r ? tx(r.correctionKey) : konfig?.koreksi ? tx(konfig.koreksi.baris) : t('investigasi.koreksi.baris');
  };
  return { pernyataan: daftar, koreksi: daftar.map((p) => ({ id: p.id, teks: baris(p) })) };
}

/** T-106: kartu bukti untuk komponen panel Designer (teks sudah diterjemahkan; `kutipan` = kutipan persis kartu itu). */
function kartuPanel(b: Bukti, tx: Tx, redup = false): PanelCard {
  return { id: b.id, title: tx(b.judul), source: tx(b.sumber), ...(b.kutipan ? { excerpt: tx(b.kutipan) } : {}), ...(redup ? { disabled: true } : {}) };
}
/** Teks pilihan "Tanya: ..." tanpa awalannya (PressPanel dan buku catatan menulis pertanyaannya saja). */
const tanpaAwalan = (s: string): string => s.replace(/^[^:：]{1,16}[:：]\s*/, '');

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

// ------------------------------------------------------------------ layar "periksa": langkah yang bisa dilanjutkan (T-087, T-090)

/** Jenis node yang membuka layar periksa sesudah barisnya dibaca (SIM kasus 1; garis waktu perjalanan dan polis kasus 2). */
const JENIS_PERIKSA: readonly NodeInvestigasi['jenis'][] = ['periksa-sim', 'periksa-perjalanan', 'periksa-polis'];
export function jenisPeriksa(inv: NodeInvestigasi | undefined): boolean {
  return !!inv && JENIS_PERIKSA.includes(inv.jenis);
}

/**
 * Kemajuan layar periksa disimpan sebagai DRAF kunjungan node itu (cerita/simpan.ts: satu draf per episode, kunci = node +
 * langkah mesin; "mulai baru" menghapusnya). Bukan progres mesin: hanya supaya muat ulang di tengah layar itu tidak kembali ke
 * baris pengantarnya. Nilai: periksa SIM = langkah 1..2 (0 = belum melewati langkah pertama); garis waktu / polis (T-090) =
 * 1 + langkah (1 = layar sudah dibuka). > 0 = pemutar HP langsung membuka layar itu lagi sesudah muat ulang.
 */
const DRAF_PERIKSA = 'periksaSim';
export function periksaTersimpan(ep: Episode, state: StateCerita): number {
  const d = bacaDrafAktivitas(ep.id, kunjunganAktivitas(state));
  const n = d && typeof d === 'object' ? (d as Record<string, unknown>)[DRAF_PERIKSA] : null;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 && n < 100 ? Math.floor(n) : 0;
}
function simpanPeriksa(ep: Episode, state: StateCerita, n: number | null): void {
  simpanDrafAktivitas(ep.id, kunjunganAktivitas(state), n ? { [DRAF_PERIKSA]: n } : {});
}

/**
 * T-090 node `periksa-perjalanan` / `periksa-polis` (kasus 2): komponen Designer dipasang seperti PeriksaSim. Kontraknya hanya
 * `{ onSelesai }`; `awal` dan `onLangkah` (cara lanjut PeriksaSim) ikut dikirim sebagai prop tambahan yang boleh diabaikan
 * komponennya. Layar yang sudah dibuka dicatat (draf = 1), jadi muat ulang kembali ke layar ini, bukan ke baris pengantarnya.
 */
function LayarPeriksa({ ep, state, jenis, onLanjut }: { ep: Episode; state: StateCerita; jenis: 'periksa-perjalanan' | 'periksa-polis'; onLanjut: () => void }) {
  const [awal] = useState(() => Math.max(0, periksaTersimpan(ep, state) - 1));
  useEffect(() => {
    if (periksaTersimpan(ep, state) === 0) simpanPeriksa(ep, state, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const lanjutan: object = { awal, onLangkah: (n: number) => simpanPeriksa(ep, state, Math.max(0, Math.floor(n)) + 1) };
  const selesai = () => { simpanPeriksa(ep, state, null); onLanjut(); };
  return jenis === 'periksa-perjalanan' ? <PeriksaPerjalanan onSelesai={selesai} {...lanjutan} /> : <PeriksaPolis onSelesai={selesai} {...lanjutan} />;
}

// ------------------------------------------------------------------ bagian kecil bersama

/** Potret piksel seorang pemeran (dengan seni pinjaman `Pemeran.piksel` bila ada); pemeran tanpa potret piksel = tidak digambar. */
function PotretPemeran({ ep, id, ekspresi, ukuran }: { ep: Episode; id: string; ekspresi: Ekspresi; ukuran: number }) {
  const tokoh = tokohPotret(ep, id);
  return tokoh ? <PotretPikselHp tokoh={tokoh} ekspresi={ekspresi} ukuran={ukuran} label="" /> : null;
}

/** Ucapan nasabah kasus (kasus 1 Pak Hendra, kasus 2 Pak Yusuf): potret piksel + nama + peran + kalimatnya. */
function UcapanNasabah({ ep, tx, ekspresi, teks, kecil = false }: { ep: Episode; tx: Tx; ekspresi: Ekspresi; teks: string; kecil?: boolean }) {
  const id = ep.investigasi?.nasabah ?? ep.nasabah;
  const p = ep.pemeran[id];
  return (
    <figure className="iv-ucap" data-kecil={kecil ? '' : undefined} data-nasabah={id}>
      <PotretPemeran ep={ep} id={id} ekspresi={ekspresi} ukuran={kecil ? 48 : 64} />
      <figcaption>
        {p ? <b>{tx(p.nama)}<small>{tx(p.peran)}</small></b> : null}
        <q>{teks}</q>
      </figcaption>
    </figure>
  );
}

/**
 * Potret di bawah cap KEBERATAN: potret reaksi kasus (`keberatan.reaksi` = nama sel potret reaksi; kasus 1: petugas tol "kaget",
 * kasus 2: Pak Yusuf "terbuka", tenang, bukan pose malu) atau, bila namanya tidak dikenal / tidak ada, potret piksel pembuat
 * pernyataan yang dibantah dengan wajah serius.
 */
function PotretCap({ ep }: { ep: Episode }) {
  const keb = ep.investigasi?.keberatan;
  const reaksi = reaksiSah(keb?.reaksi);
  if (!keb || reaksi) return <PotretReaksi reaksi={reaksi ?? 'tol-kaget'} ukuran={128} />;
  return <span className="iv-cap-potret" aria-hidden="true"><PotretPemeran ep={ep} id={keb.pernyataan} ekspresi="serius" ukuran={128} /></span>;
}

/**
 * T-078 node `cap`: cap KEBERATAN menutupi layar 1,5 s (atau diketuk), LALU layar di bawahnya tinggal: yang dibantah + kalimat
 * keberatan; "Lanjut" baru meneruskan cerita (dulu cap langsung lanjut, jadi reaksinya tidak pernah terlihat).
 */
function LayarCap({ ep, kalimat, tx, onLanjut }: { ep: Episode; kalimat: string; tx: Tx; onLanjut: () => void }) {
  const [cap, setCap] = useState(true);
  // T-085: di pukulan KEBERATAN musik konfrontasi jatuh hening; efek 'keberatan' (CapKeberatan) = pukulan + sting di lubang itu.
  useEffect(() => { jedaMusik(HENING_KEBERATAN_S, NAIK_KEBERATAN_S); }, []);
  return (
    <section className="iv-layar iv-cap-bawah" data-cap-bawah="" aria-live="polite">
      {cap ? <CapKeberatan onSelesai={() => setCap(false)} /> : null}
      <PotretCap ep={ep} />
      {kalimat ? <p className="iv-cap-kalimat">{kalimat}</p> : null}
      <button type="button" className="primary-action iv-tombol" data-cap-lanjut="" onClick={onLanjut}>{tx('inv.ui.lanjut')}</button>
    </section>
  );
}

/**
 * T-090 "Tamu baru" dengan lebih dari satu kasus: hapus rekaman perangkat (skor, stempel) DAN arsipkan progres cerita kasus
 * Investigator LAIN (cerita/simpan.ts `mulaiBaru`), supaya tamu berikutnya tidak membuka kasus lain langsung di layar hasil tamu
 * sebelumnya (yang akan mencatat stempelnya lagi). Progres kasus yang sedang terbuka dimulai ulang oleh pemanggil. Episode
 * lain (bukan Investigator) dan profil tidak disentuh.
 */
export { tamuBaruSemuaKasus }; // T-094: logikanya pindah ke ./hub.ts (hub memakainya tanpa kasus yang sedang terbuka)

/** "Tamu baru": dua ketukan (tombol, lalu konfirmasi sebaris). Menghapus HANYA data Investigator, lalu `onMulaiUlang`. */
function TamuBaru({ ep, tx, onMulaiUlang }: { ep: Episode; tx: Tx; onMulaiUlang: () => void }) {
  const [tanya, setTanya] = useState(false);
  if (!tanya) return <p className="iv-tamu"><button type="button" className="hp-tautan" data-tamu-baru="" onClick={() => setTanya(true)}>{tx('inv.ui.tamuBaru')}</button></p>;
  return (
    <div className="iv-tamu" role="group" aria-label={tx('inv.ui.tamuBaru')}>
      <p className="iv-label">{tx('inv.ui.tamuBaruKet')}</p>
      <p>
        <button type="button" className="hp-tautan" data-tamu-baru-ya="" onClick={() => { tamuBaruSemuaKasus(ep); setTanya(false); onMulaiUlang(); }}>{tx('inv.ui.tamuBaruYa')}</button>
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
 * kartu sekaligus (dashcam + rambu dalam satu halaman buku), dan `balik` = kalimat "Tebakan awalmu: ..." di layar kartu
 * `konfig.tebak.balikPada`. Tombolnya hidup sejak awal: ketukan selama slip masih meluncur langsung melanjutkan.
 */
function LayarBukti({ ep, state, bukti, keterangan, balik, tx, onLanjut }: { ep: Episode; state: StateCerita; bukti: Bukti[]; keterangan: string; balik: string; tx: Tx; onLanjut: () => void }) {
  useEffect(() => { const w = window.setTimeout(() => playSfx('jepit'), JEDA_BUNYI_JEPIT_MS); return () => window.clearTimeout(w); }, []);
  const label = useLabelPanel();
  // T-106: kartu yang punya seni panel (kasus 3) bisa DIPERBESAR dengan satu ketukan sebelum disimpan (lembar PanelExhibit).
  const [besar, setBesar] = useState<Bukti | null>(null);
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
      {bukti.filter((b) => !!evidenceArt(b.id)).map((b) => (
        <button key={b.id} type="button" className="akh-kedua iv-tombol" data-perbesar-bukti={b.id} aria-haspopup="dialog" onClick={() => { playSfx('kertas'); setBesar(b); }}>{label('periksa', { judul: tx(b.judul) })}</button>
      ))}
      <button type="button" className="primary-action iv-tombol" data-simpan-bukti="" onClick={() => { playSfx('kertas'); onLanjut(); }}>{tx('inv.ui.simpan')}</button>
      {besar ? <PanelExhibit card={kartuPanel(besar, tx)} onClose={() => setBesar(null)} /> : null}
    </section>
  );
}

/**
 * T-090 node `tebak` untuk kasus ber-`bingkai: 'seni'` (kasus 2): Miss Raksa bertanya, gambar `seniKasus(kasus).tebak`, lalu
 * daftar pilihan `konfig.tebak.pilihan` (satu ketukan = pilihan mesin; tanpa benar / salah). Kasus 1 tetap ui/TebakLajur.
 * Ukur 360 x 640 (hitung): kepala 68..94 + gambar <= 140 + 3 pilihan 52 + 2 x 6 + keterangan 20..40 + jarak 3 x 8 = 420..466 px.
 */
function TebakPilihan({ konfig, tanya, ket, pilihan, tx, onPilih }: { konfig: KonfigInvestigasi; tanya: string; ket: string; pilihan: string | null; tx: Tx; onPilih: (id: string) => void }) {
  return (
    <section className="iv-layar iv-tebak iv-tebak-daftar" data-tebak-pilihan="" aria-labelledby="iv-tebak-tanya">
      <div className="iv-tebak-kepala">
        <PotretReaksi reaksi="miss-detektif" ukuran={64} />
        <p className="iv-tebak-balon"><b>Miss Raksa</b><span id="iv-tebak-tanya" tabIndex={-1} data-cer-fokus="">{tanya}</span></p>
      </div>
      <img className="iv-seni-kasus" src={seniKasus(konfig.kasus).tebak} alt="" />
      <div className="iv-daftar" role="group" aria-labelledby="iv-tebak-tanya">
        {konfig.tebak.pilihan.map((p) => (
          <button key={p.id} type="button" className="iv-tebak-pilih" data-tebak={p.id} aria-pressed={pilihan === p.id} onClick={() => onPilih(p.id)}>{tx(p.teks)}</button>
        ))}
      </div>
      {ket ? <p className="iv-label">{ket}</p> : null}
    </section>
  );
}

/**
 * T-090 node `koreksi` untuk kasus ber-`konfig.koreksi` (kasus 2): halaman "Keterangan" buku catatan pemain; kalimat lama
 * dicoret dan baris koreksi kasus ditulis di bawahnya ("Keterangan diperbarui: ..."). Kasus 1 tetap ui/KoreksiCatatan.
 */
function LayarKoreksi({ konfig, pernyataan, tx, onLanjut, baris }: { konfig: KonfigInvestigasi; pernyataan: Pernyataan | undefined; tx: Tx; onLanjut: () => void; baris?: string }) {
  useEffect(() => { playSfx('pensil'); }, []);
  const k = konfig.koreksi;
  return (
    <section className="iv-layar iv-koreksi" data-koreksi-catatan="umum" aria-labelledby="iv-koreksi-judul">
      <h2 id="iv-koreksi-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{k ? tx(k.judul) : t('investigasi.koreksi.judul')}</h2>
      {k ? <p className="iv-label">{tx(k.ket)}</p> : null}
      {pernyataan && k ? (
        <BukuCatatan pernyataan={[pernyataan]} bukti={[]} halaman="keterangan" tanpaPensil koreksi={{ id: pernyataan.id, teks: baris ?? tx(k.baris), baru: true }} />
      ) : null}
      <button type="button" className="primary-action iv-tombol" data-koreksi-lanjut="" onClick={onLanjut}>{tx('inv.ui.lanjut')}</button>
    </section>
  );
}

/**
 * T-106: SATU babak panel (kasus 3) = komponen Designer `PanelRound` (props beku T-102). Kartu = `Round.evidenceIds` yang sudah
 * terkumpul, urut layar; langkah dipandu (attempt 2) meredupkan kartu yang tidak diterima. Komponen hanya mengembalikan PILIHAN;
 * pemanggil (node cerita atau latihan) yang memutuskan tepat / keliru.
 */
function BabakPanel({ ep, konfig, state, round, attempt, tx, onPresent }: {
  ep: Episode; konfig: KonfigInvestigasi; state: StateCerita; round: Round; attempt: 0 | 1 | 2; tx: Tx;
  onPresent: (id: Bukti['id'], diterima: boolean) => void;
}) {
  const p = konfig.pernyataan.find((x) => x.id === round.statementId);
  const idKetua = konfig.panel?.chair ?? '';
  const nama = (id: string): string => (Object.prototype.hasOwnProperty.call(ep.pemeran, id) ? tx(ep.pemeran[id]!.nama) : id);
  const punya = buktiTerkumpul(ep, state).map((b) => b.id);
  const cards = round.evidenceIds.filter((id) => punya.includes(id)).flatMap((id) => {
    const b = konfig.bukti.find((x) => x.id === id);
    return b ? [kartuPanel(b, tx, attempt === 2 && !round.acceptedIds.includes(id))] : [];
  });
  return (
    <PanelRound key={`${round.id}-${attempt}`} attempt={attempt}
      chair={{ id: idKetua, name: nama(idKetua), line: tx(round.promptKey), ...(attempt > 0 ? { hint: tx(round.hintKeys[attempt - 1]!) } : {}) }}
      statement={{ id: round.statementId, actor: p?.siapa ?? 'pemohon', name: p ? nama(p.siapa) : '', text: p ? tx(p.teks) : '' }}
      cards={cards} onInspect={() => playSfx('kertas')} onPresent={(id) => onPresent(id, round.acceptedIds.includes(id))} />
  );
}

/**
 * T-106 "Tanya lebih lanjut" (node ber-`tekan`, T-104) = komponen Designer `PressPanel`. Langkah 'tawar' (node PILIHAN):
 * pernyataannya, tombol "Tanya lebih lanjut" (pilihan 'tekan') dan "Lanjut tanpa bertanya" (pilihan 'lanjut'). Langkah 'jawab'
 * (node DIALOG): pertanyaan dan jawaban terbuka; "Tutup" = lanjut. Tanpa poin, tanpa waktu.
 */
function LayarTekan({ konfig, node, tx, onLanjut, onPilih }: { konfig: KonfigInvestigasi; node: NodeCerita; tx: Tx; onLanjut: () => void; onPilih: (id: string) => boolean }) {
  const tk = node.tekan;
  const p = tk ? konfig.pernyataan.find((x) => x.id === tk.pernyataan) : undefined;
  const tawar = tk?.langkah === 'tawar';
  const maju = () => { if (tawar) onPilih(PILIH_LANJUT); else onLanjut(); };
  if (!tk || !p || !p.press) return <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={maju}>{tx('inv.ui.lanjut')}</button></section>;
  return (
    <section className="iv-layar iv-tekan" data-layar-tekan={tk.langkah} aria-labelledby="iv-tekan-judul">
      <h2 id="iv-tekan-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx('inv.ui.tekan.pilih')}</h2>
      <BukuCatatan pernyataan={[p]} bukti={[]} halaman="keterangan" tanpaPensil />
      <PressPanel question={tanpaAwalan(tx(p.press.questionKey))} answer={tx(p.press.answerKey)} opened={!tawar}
        onPress={() => { if (onPilih(PILIH_TEKAN)) playSfx('kertas'); }} onClose={onLanjut} />
      {tawar ? <button type="button" className="primary-action iv-tombol" data-tekan-lanjut="" onClick={maju}>{tx('inv.ui.tekan.lanjut')}</button> : null}
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
  if (!konfig || (!inv && !node.tekan)) return null;
  // T-106: node "Tanya lebih lanjut" (tanpa jenis investigasi, T-104).
  if (node.tekan || !inv) return <PenyediaTeksInvestigasi value={tx}><LayarTekan key={node.id} konfig={konfig} node={node} tx={tx} onLanjut={onLanjut} onPilih={onPilih} /></PenyediaTeksInvestigasi>;
  const barisPertama = node.jenis !== 'cabang' && node.baris[0] ? tx(node.baris[0].teks) : '';
  let isi: ReactNode = null;
  switch (inv.jenis) {
    case 'judul':
      isi = (
        <>
          {/* T-078: bingkai dashcam diam (sebelum benturan: rambu + lajur) di kartu pembuka; T-090: kasus ber-`bingkai: 'seni'` = gambar seniKasus */}
          <JudulKasus nomor={konfig.nomor} judul={konfig.judul} onMulai={onLanjut} tokoh={<PotretReaksi reaksi="miss-detektif" ukuran={128} />}
            gambar={konfig.bingkai === 'dashcam' ? <BingkaiDashcam besar /> : <img className="iv-seni-kasus" src={seniKasus(konfig.kasus).judul} alt="" />} />
          {adaRekaman() ? <TamuBaru ep={ep} tx={tx} onMulaiUlang={onMulaiUlang} /> : null}
        </>
      );
      break;
    case 'tebak': {
      // T-087: tebakan pembuka (tanpa benar / salah): satu ketukan = pilihan mesin (tanda tebak:<id>). T-090: pilihannya data kasus.
      const tebakan = tebakanAwal(ep, state);
      const pilih = (id: string) => { if (onPilih(id)) playSfx('konfirmasi'); };
      isi = konfig.bingkai === 'dashcam'
        ? <TebakLajur key={node.id} pilihan={tebakan ? (Number(tebakan) as Lajur) : undefined} onPilih={(n) => pilih(String(n))} />
        : <TebakPilihan key={node.id} konfig={konfig} tanya={node.jenis === 'pilihan' ? tx(node.tanya) : ''} ket={barisPertama} pilihan={tebakan} tx={tx} onPilih={pilih} />;
      break;
    }
    case 'catat':
      isi = <LayarCatat key={node.id} ep={ep} state={state} id={inv.pernyataan} tx={tx} onLanjut={onLanjut} />;
      break;
    case 'bukti': {
      const id = [inv.bukti, ...(inv.juga ?? [])];
      const tebakan = id.includes(konfig.tebak.balikPada) ? tebakanAwal(ep, state) : null;
      isi = <LayarBukti key={node.id} ep={ep} state={state} bukti={konfig.bukti.filter((x) => id.includes(x.id))} keterangan={barisPertama}
        balik={tebakan ? tx(kunci(konfig, `tebak.balik.${tebakan}`)) : ''} tx={tx} onLanjut={onLanjut} />;
      break;
    }
    case 'keberatan': {
      const pernyataan = konfig.pernyataan.find((x) => x.id === inv.pernyataan);
      // Hanya kartu yang SUDAH terkumpul yang dikirim: kartu lain tidak bisa dipilih (mesin pun menolaknya lewat `jika`).
      const bukti = urutKartu(konfig, buktiTerkumpul(ep, state));
      if (!pernyataan) { isi = <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={onLanjut}>{tx('inv.ui.lanjut')}</button></section>; break; }
      isi = (
        <LayarKeberatan key={node.id} pernyataan={pernyataan} bukti={bukti} percobaan={inv.percobaan} tepat={inv.tepat}
          perbesar={konfig.keberatan.perbesar ?? []} {...teksKeberatan(konfig, inv.percobaan, tx)}
          onPilih={(id) => {
            // Percobaan 2 (dipandu, node dialog): hanya kartu tepat yang melanjutkan. Percobaan 0 / 1: pilihan mesin.
            if (inv.percobaan === 2) { if (id === inv.tepat) onPilih(id); return; }
            if (onPilih(id) && id !== inv.tepat) playSfx('keliru'); // T-085: dengung rendah lembut
          }} />
      );
      break;
    }
    case 'panel': {
      // T-106: satu percobaan satu babak panel. Percobaan 0 / 1 = pilihan mesin (id pilihan = id kartu); percobaan 2 (dipandu,
      // node dialog): hanya kartu yang diterima yang melanjutkan (pemutar mengirimnya lewat jalur pilihan bernilai yang sama).
      const r = konfig.panel?.rounds.find((x) => x.id === inv.round);
      if (!r) { isi = <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={onLanjut}>{tx('inv.ui.lanjut')}</button></section>; break; }
      isi = (
        <BabakPanel ep={ep} konfig={konfig} state={state} round={r} attempt={inv.attempt} tx={tx}
          onPresent={(id, diterima) => {
            if (inv.attempt === 2) { if (diterima) onPilih(id); return; }
            if (onPilih(id)) playSfx(diterima ? 'konfirmasi' : 'keliru');
          }} />
      );
      break;
    }
    case 'panel-koreksi': {
      // T-106: pembuat pernyataan mengoreksi keterangannya sesudah babak itu; efek node memasang koreksi:<pernyataan>.
      const r = konfig.panel?.rounds.find((x) => x.id === inv.round);
      isi = <LayarKoreksi key={node.id} konfig={konfig} pernyataan={r ? konfig.pernyataan.find((x) => x.id === r.statementId) : undefined} baris={r ? tx(r.correctionKey) : undefined} tx={tx} onLanjut={onLanjut} />;
      break;
    }
    case 'cap':
      isi = <LayarCap key={node.id} ep={ep} kalimat={barisPertama} tx={tx} onLanjut={onLanjut} />;
      break;
    case 'koreksi': {
      // T-087 / T-088: petugas mencoret "3" dan menulis "2" (KoreksiCatatan); "Lanjut" = lanjut, efek node memasang koreksi:<id>.
      // T-090: kasus ber-`konfig.koreksi` memakai layar umum (halaman buku catatan pemain dengan baris koreksi kasus itu).
      const pernyataan = konfig.pernyataan.find((x) => x.id === inv.pernyataan);
      isi = konfig.koreksi
        ? <LayarKoreksi key={node.id} konfig={konfig} pernyataan={pernyataan} tx={tx} onLanjut={onLanjut} />
        : <KoreksiCatatan key={node.id} pernyataan={pernyataan} onSelesai={onLanjut} />;
      break;
    }
    case 'periksa-sim': {
      // T-080: periksa SIM di meja wawancara (3 ketukan); selesai = lanjut ke node kartu bukti SIM. T-087: langkahnya disimpan
      // sebagai draf kunjungan, jadi muat ulang melanjutkan dari langkah yang sama.
      const awal = Math.min(2, periksaTersimpan(ep, state)) as 0 | 1 | 2;
      isi = <PeriksaSim key={node.id} awal={awal} onLangkah={(n) => simpanPeriksa(ep, state, n)}
        onSelesai={() => { simpanPeriksa(ep, state, null); onLanjut(); }} />;
      break;
    }
    case 'periksa-perjalanan':
    case 'periksa-polis':
      isi = <LayarPeriksa key={node.id} ep={ep} state={state} jenis={inv.jenis} onLanjut={onLanjut} />;
      break;
    case 'putusan':
      isi = <LayarPutusan key={node.id} {...teksPutusan(konfig, tx)} onPilih={(p) => { if (onPilih(p)) playSfx('konfirmasi'); }} />;
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

/** Latihan KEBERATAN: tiga percobaan seperti di kasus (petunjuk, lalu dipandu), dengan cap bila tepat. Tidak menyentuh mesin. */
function LatihanKeberatan({ ep, konfig, state, tx, onHasil }: { ep: Episode; konfig: KonfigInvestigasi; state: StateCerita; tx: Tx; onHasil: (h: HasilKeberatan) => void }) {
  const pernyataan = konfig.pernyataan.find((x) => x.id === konfig.keberatan.pernyataan);
  const tepat = konfig.keberatan.tepat;
  const [percobaan, setPercobaan] = useState<0 | 1 | 2>(0);
  /** Kalimat Miss Raksa sesudah kartu yang keliru (menunggu "Lanjut"). */
  const [sela, setSela] = useState<string | null>(null);
  const [cap, setCap] = useState<HasilKeberatan | null>(null);
  if (!pernyataan) return <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={() => onHasil('dipandu')}>{tx('inv.ui.lanjut')}</button></section>;
  if (cap) {
    return (
      <section className="iv-layar iv-cap-bawah" aria-live="polite">
        <CapKeberatan onSelesai={() => onHasil(cap)} />
        <PotretCap ep={ep} />
        <p className="iv-cap-kalimat">{tx(kunci(konfig, 'keb.cap'))}</p>
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
    <LayarKeberatan key={percobaan} pernyataan={pernyataan} bukti={urutKartu(konfig, buktiTerkumpul(ep, state))} percobaan={percobaan} tepat={tepat}
      perbesar={konfig.keberatan.perbesar ?? []} {...teksKeberatan(konfig, percobaan, tx)}
      onPilih={(id) => {
        if (id === tepat) { jedaMusik(HENING_KEBERATAN_S, NAIK_KEBERATAN_S); setCap(percobaan === 0 ? 'tepat' : percobaan === 1 ? 'tepat-kedua' : 'dipandu'); return; }
        if (percobaan === 2) return;
        playSfx('keliru');
        setSela(tx(kunci(konfig, percobaan === 0 ? `keb.salah.${id}` : `keb.pandu.${id}`)));
      }} />
  );
}

/** Latihan PESAN untuk nasabah: tiga pesan dari node `pesan` episode (urutan naskah), pilih satu lalu kirim. */
function LatihanPesan({ ep, konfig, tx, onHasil }: { ep: Episode; konfig: KonfigInvestigasi; tx: Tx; onHasil: (p: Pesan) => void }) {
  const node = ep.node.pesan;
  const pilihan = node?.jenis === 'pilihan' ? node.pilihan.filter((x) => (PESAN as readonly string[]).includes(x.id)) : [];
  const [pilih, setPilih] = useState<Pesan | null>(null);
  return (
    <section className="iv-layar iv-latihan-pesan" data-latihan-pesan="" aria-labelledby="iv-latihan-pesan-tanya">
      <UcapanNasabah ep={ep} tx={tx} ekspresi="cemas" teks={tx(kunci(konfig, 'pesan.2'))} kecil />
      <h2 id="iv-latihan-pesan-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx(kunci(konfig, 'pesan.tanya'))}</h2>
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
/** T-106: latihan SATU babak panel (kasus 3): percobaan pertama, kedua, lalu dipandu; tidak mengubah skor terbaik. */
function LatihanPanel({ ep, konfig, state, round, tx, onHasil }: { ep: Episode; konfig: KonfigInvestigasi; state: StateCerita; round: Round; tx: Tx; onHasil: (h: HasilBabak) => void }) {
  const [attempt, setAttempt] = useState<0 | 1 | 2>(0);
  const [sela, setSela] = useState<string | null>(null);
  if (sela) {
    return (
      <section className="iv-layar iv-latihan-sela" data-latihan-sela="">
        <p className="iv-tempel iv-pandu" role="status"><span>{sela}</span></p>
        <button type="button" className="primary-action iv-tombol" onClick={() => { setSela(null); setAttempt((n) => (n === 0 ? 1 : 2)); }}>{tx('inv.ui.lanjut')}</button>
      </section>
    );
  }
  return (
    <BabakPanel ep={ep} konfig={konfig} state={state} round={round} attempt={attempt} tx={tx}
      onPresent={(id, diterima) => {
        if (diterima) { playSfx('konfirmasi'); onHasil(attempt === 0 ? 'first' : attempt === 1 ? 'second' : 'guided'); return; }
        if (attempt === 2) return;
        playSfx('keliru');
        setSela(tx(kunci(konfig, `panel.${round.id}.${attempt === 0 ? 'salah' : 'pandu'}.${id}`)));
      }} />
  );
}

function LatihanKasus({ ep, konfig, state, titik, tx, onSelesai }: { ep: Episode; konfig: KonfigInvestigasi; state: StateCerita; titik: TitikLatihan; tx: Tx; onSelesai: () => void }) {
  const [putaran, setPutaran] = useState(0);
  const [hasil, setHasil] = useState<{ poin: number; ucapan?: { ekspresi: Ekspresi; teks: string }; kalimat: string } | null>(null);
  // T-106: titik latihan = satu babak (kasus ber-panel), atau keberatan / putusan / pesan (kasus 1-2 seperti semula).
  const langkah = titik.langkah;
  const round = titik.langkah === 'keberatan' ? konfig.panel?.rounds.find((r) => r.id === titik.babak) : undefined;
  const maks = titik.maks;
  const tadi = titik.poin;
  const pita = <p className="iv-latihan-pita" data-latihan={langkah} data-latihan-babak={round?.id}>{tx('inv.latihan.label')} · {round ? tx(kunci(konfig, `panel.${round.id}.nama`)) : tx(`inv.lagi.langkah.${langkah}`)}</p>;
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
      {round ? <LatihanPanel key={putaran} ep={ep} konfig={konfig} state={state} round={round} tx={tx} onHasil={(h) => setHasil({ poin: poinBabak(konfig, round.id, h), kalimat: tx(kunci(konfig, `${round.id}.jawab.1`)) })} />
        : langkah === 'keberatan' ? <LatihanKeberatan key={putaran} ep={ep} konfig={konfig} state={state} tx={tx} onHasil={(h) => setHasil({ poin: poinKeberatan(h), kalimat: tx(kunci(konfig, 'keb.cap')) })} />
        : langkah === 'putusan' ? <LayarPutusan key={putaran} {...teksPutusan(konfig, tx)} onPilih={(p) => { playSfx('konfirmasi'); setHasil({ poin: poinPutusan(konfig.putusan, p), kalimat: tx(kunci(konfig, `putusan.${p}.1`)) }); }} />
          : <LatihanPesan key={putaran} ep={ep} konfig={konfig} tx={tx} onHasil={(p) => setHasil({ poin: poinPesan(p), ucapan: { ekspresi: konfig.balasan[p], teks: tx(kunci(konfig, `pesan.${p}.1`)) }, kalimat: p === 'baik' ? '' : tx(kunci(konfig, `pesan.${p}.2`)) })} />}
    </>
  );
}

// ------------------------------------------------------------------ layar hasil

/**
 * Layar hasil (node hasil-investigasi). Rekaman perangkat dicatat di sini (idempoten: aman untuk muat ulang & StrictMode).
 * T-087: (1) dibuka dengan kalimat nasabah menurut pesan yang dikirim; (2) rincian skor. Cap stempel mendarat hanya bila
 * stempel kasus ini BELUM ada sebelum hasil ini (rekaman dibaca sekali saat layar dipasang, sebelum dicatat); "Rekor baru!" hanya
 * bila skor terbaik yang sudah ada terlampaui.
 * T-090:
 *  - Total semua kasus ("Total 185 / 200") + "1 kasus lagi menuju Senior" (pada dua stempel) tampil di kasus tanpa kasus
 *    berikutnya (kasus 2) dan, di kasus 1, begitu perangkat punya dua stempel.
 *  - Kasus ber-`konfig.berikut` (kasus 1): kartu kasus 2 = TAUTAN ke episode itu (ketukan tetap dihitung di `intipKasus2`);
 *    sesudah kasus 2 pernah ditamatkan kartunya menjadi tautan sebaris. Episode itu tidak ada di build ini = lembar pratinjau lama.
 *  - Kasus tanpa `berikut` (kasus 2): tombol "Arsip kasus" (garis waktu + pesan yang dikirim, baca saja) dan tulisan
 *    "Kasus 3 · segera hadir" (`konfig.segera`, teks saja).
 * T-099: kasus ber-`konfig.cerita` (kasus 1) mendapat tautan sekunder "Ikuti cerita klaim Pak Hendra" -> /cerita/<episode itu>
 *    (progres ceritanya dilanjutkan seperti biasa), di bawah baris aksi; "Kasus berikutnya" tetap yang utama. Kasus 2 (berkas
 *    tersendiri) tidak punya tautan cerita. Episode cerita itu tidak ada di build ini = tanpa tautan.
 */
export function HasilKasus({ ep, state, nama, look, tx, onMainLagi }: {
  ep: Episode;
  state: StateCerita;
  nama: string;
  look: PlayerLook;
  tx: Tx;
  onMainLagi: () => void;
}) {
  useSyncExternalStore(berlanggananInvestigasi, versiInvestigasi, () => 0);
  const navigasi = useNavigate();
  const { bahasa } = useBahasa();
  // T-094: kasus yang dibuka dari hub Raksa Investigator (atau alamat pendeknya) pulang ke hub; kasus berikutnya tetap di bawah hub.
  const rumah = useRumahCerita();
  const konfig = ep.investigasi;
  const kasus = konfig?.kasus ?? ep.id;
  // T-106: hasil SEMUA kasus dalam bentuk rubrik bersama (kasus 1-2: satu babak dari keb:*; kasus 3: dua babak panel). Kasus tanpa
  // manifes rubrik jatuh ke hitungan lama.
  const h = hasilKasusLengkap(ep, state);
  const hLama = hasilKasus(state);
  const skor = h && konfig ? skorKasusLengkap(konfig, h) ?? (hLama ? skorKasus(hLama, konfig.putusan) : null) : null;
  const total = skor ? skor.total : null;
  const [sebelum] = useState(() => bacaRekaman());
  const kunciPilihan = h ? `${h.putusan}|${h.pesan}|${h.babak.join(',')}` : '';
  // Skor terbaik + stempel + pilihan permainan terbaik (untuk arsip). Idempoten.
  useEffect(() => { if (total !== null && h) catatHasil(kasus, total, { putusan: h.putusan, pesan: h.pesan, babak: h.babak }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [kasus, total, kunciPilihan]);
  const [tahap, setTahap] = useState<'ucapan' | 'skor'>('ucapan');
  const [lembar, setLembar] = useState<'lagi' | 'arsip' | null>(null);
  const [latihan, setLatihan] = useState<TitikLatihan | null>(null);
  const [segar, setSegar] = useState(true);
  // Capaian SESUDAH hasil ini (efek pencatatan baru berjalan sesudah gambar pertama): stempel kasus ini + skor terbaiknya.
  const r = bacaRekaman();
  const capaian = total === null ? r : { ...r, stempel: r.stempel.includes(kasus) ? r.stempel : [...r.stempel, kasus], terbaik: { ...r.terbaik, [kasus]: Math.max(r.terbaik[kasus] ?? 0, total) } };
  // Hadiah seri yang BARU diraih (belum pernah diumumkan): diumumkan sekali, lalu ditandai. Senior dan Kepala bisa datang bersama.
  const hadiahBaru = total === null ? [] : hadiahRekaman(capaian).filter((a) => !sebelum.hadiah?.includes(a));
  const kunciHadiah = hadiahBaru.join(',');
  useEffect(() => { if (kunciHadiah) catatHadiah(hadiahBaru); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [kunciHadiah]);
  if (!h || !konfig || !skor) {
    // State tanpa ketiga hasil (seharusnya tidak terjadi di jalur naskah): tetap beri jalan keluar.
    return <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={onMainLagi}>{tx('inv.ui.lanjut')}</button></section>;
  }
  if (latihan) {
    return <PenyediaTeksInvestigasi value={tx}><LatihanKasus key={latihan.langkah + (latihan.langkah === 'keberatan' ? latihan.babak : '')} ep={ep} konfig={konfig} state={state} titik={latihan} tx={tx} onSelesai={() => setLatihan(null)} /></PenyediaTeksInvestigasi>;
  }
  if (tahap === 'ucapan') {
    const akhir = state.akhir ? ep.akhir[state.akhir] : undefined;
    return (
      <section className="iv-layar iv-hendra" data-hasil-ucapan={h.pesan} aria-labelledby="iv-hendra-judul">
        <h2 id="iv-hendra-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{akhir ? tx(akhir.judul) : t('investigasi.hasil.judul')}</h2>
        <UcapanNasabah ep={ep} tx={tx} ekspresi={konfig.balasan[h.pesan]} teks={tx(kunci(konfig, `balas.${h.pesan}`))} />
        <button type="button" className="primary-action iv-tombol" data-lihat-hasil="" onClick={() => setTahap('skor')}>{tx('inv.hasil.lihat')}</button>
      </section>
    );
  }
  const stempel = stempelSeri(capaian);
  const lama = sebelum.terbaik[kasus];
  const lemah = titikTerlemah(konfig, h);
  const namaTitik = (x: TitikLatihan): string => (x.langkah === 'keberatan' && konfig.panel ? tx(kunci(konfig, `panel.${x.babak}.nama`)) : tx(`inv.lagi.langkah.${x.langkah}`));
  const dikoreksi = koreksiBuku(ep, state, tx);
  const tutup = () => setLembar(null);
  // T-106: SATU tindakan berikutnya dari daftar kasus seri (berkas berikutnya yang belum berstempel; kalau semua sudah: main lagi
  // kasus dengan poin terbanyak yang bisa diraih kembali; kalau semua sempurna: arsip kasus ini). Dihitung ulang tiap hasil.
  const lanjut = aksiLanjut(daftarKasusHub(capaian));
  const judulKasus = (k: KasusHub): string => t('hubInv.kasusJudul', { n: k.nomor, judul: teksCerita(k.ep, k.konfig.judul, bahasa) });
  const keKasus = (k: KasusHub, dariAwal: boolean) => {
    if (k.konfig.kasus === 'kasus-2') catatIntipKasus2(); // T-087: penghitung minat sukarela (uji coba), seperti kartu "Kasus 2" dulu
    if (dariAwal) mulaiBaru(k.ep);
    navigasi(rumah === RUTE_HUB ? ruteKasus(k.nomor) : '/cerita/' + k.ep.id);
  };
  const totalSemua = totalSkor(capaian);
  const tampilTotal = konfig.nomor > 1 || stempel.length >= 2;
  const tujuan = tujuanPangkat(capaian);
  const menuju = tujuan ? t(tujuan.jenis === 'senior' ? 'hubInv.menujuSenior' : 'hubInv.menujuKepala', { n: tujuan.kurang }) : undefined;
  // Arsip kasus (terbuka sejak kasus ini pernah diselesaikan): pesan pada permainan TERBAIK. Rekaman lama tanpa catatan pilihan,
  // bila permainan ini bukan yang terbaik: ringkasan fakta saja (garis waktu + keterangan yang dikoreksi).
  const nodePesan = ep.node.pesan;
  const idPesanArsip = skor.total >= (r.terbaik[kasus] ?? 0) ? h.pesan : r.penjelasan?.[kasus]?.pesan;
  const pesanArsip = nodePesan?.jenis === 'pilihan' && idPesanArsip ? nodePesan.pilihan.find((x) => x.id === idPesanArsip) : undefined;
  const kaki = (
    <div className="iv-hasil-lanjut">
      {hadiahBaru.length ? (
        <p className="iv-hadiah" data-hadiah-baru={kunciHadiah} role="status">
          <b>{t('investigasi.hadiah.baru')}</b>
          {hadiahBaru.map((a) => <span key={a} data-hadiah={a}>{a === 'bingkai-kepala' ? null : <PanelAward id={a} kali={1} />}{t(`investigasi.hadiah.${a}`)}</span>)}
        </p>
      ) : null}
      {lanjut.jenis === 'arsip' ? null : (
        <button type="button" className="iv-berikut" data-aksi-lanjut={lanjut.jenis} data-kasus-berikut={lanjut.kasus.ep.id}
          onClick={() => { if (lanjut.jenis === 'lagi' && lanjut.kasus.konfig.kasus === kasus) { setLembar('lagi'); return; } keKasus(lanjut.kasus, lanjut.jenis === 'lagi'); }}>
          <b>{judulKasus(lanjut.kasus)}<small>{lanjut.jenis === 'buka' ? t('hubInv.berikutBuka') : t('hubInv.berikutLagi', { n: lanjut.pulih })}</small></b><span aria-hidden="true">›</span>
        </button>
      )}
      <button type="button" className="iv-berikut" data-arsip-kasus="" aria-haspopup="dialog" onClick={() => setLembar('arsip')}>
        <b>{tx('inv.hasil.arsip')}<small>{konfig.arsip ? tx('inv.hasil.arsipKet') : t('investigasi.arsipKet')}</small></b><span aria-hidden="true">›</span>
      </button>
    </div>
  );
  // T-099: cerita klaim dari kejadian yang sama (hanya kasus yang menyebutnya, dan hanya bila episode itu ada di build ini).
  const cerita = konfig.cerita && cariEpisode(konfig.cerita.episode) ? konfig.cerita : null;
  const tautCerita = cerita ? (
    <p className="iv-cerita"><Link to={'/cerita/' + cerita.episode} data-cerita-kasus={cerita.episode}>{tx(cerita.ajakan)} <span aria-hidden="true">›</span></Link></p>
  ) : undefined;
  return (
    <PenyediaTeksInvestigasi value={tx}>
      {/* T-078: Miss Raksa "bangga" bila putusannya tepat (akhir tuntas), "berpikir" bila diluruskan */}
      <HasilInvestigasi skor={skor} nama={nama} look={look} stempel={stempel} pangkat={pangkatRekaman(capaian)} reaksi={putusanTepat(konfig.putusan, h.putusan) ? 'miss-bangga' : 'miss-berpikir'}
        stempelBaru={segar && !sebelum.stempel.includes(kasus)} rekor={segar && lama !== undefined && skor.total > lama} terbaik={Math.max(r.terbaik[kasus] ?? 0, lama ?? 0)}
        total={tampilTotal ? { skor: totalSemua, maks: TOTAL_MAKS, menuju } : undefined}
        onMainLagi={() => setLembar('lagi')} onSelesai={() => navigasi(rumah)} teaser={kaki} tautan={tautCerita} />
      {lembar === 'arsip' ? (
        <Modal judul={tx('inv.hasil.arsip')} onTutup={tutup} lebar={420}>
          {/* T-090 / T-106: arsip kasus, baca saja: garis waktu (bila kasusnya punya) + keterangan yang dikoreksi + pesan permainan terbaik */}
          <div className="iv-arsip" data-arsip-kasus-isi="">
            {konfig.arsip ? (
              <section className="iv-arsip-kartu" aria-labelledby="iv-arsip-garis">
                <h3 id="iv-arsip-garis">{tx(konfig.arsip.judul)}</h3>
                <ol className="iv-garis">
                  {konfig.arsip.garis.map((k, i) => <li key={k} data-sorot={i === konfig.arsip?.sorot ? '' : undefined}>{tx(k)}</li>)}
                </ol>
              </section>
            ) : null}
            {dikoreksi ? <BukuCatatan pernyataan={dikoreksi.pernyataan} bukti={[]} halaman="keterangan" tanpaPensil koreksi={dikoreksi.koreksi} /> : null}
            {pesanArsip ? (
              <section className="iv-arsip-kartu" aria-labelledby="iv-arsip-pesan">
                <h3 id="iv-arsip-pesan">{tx(konfig.arsip?.pesan ?? 'inv.lagi.langkah.pesan')}</h3>
                <p className="iv-arsip-pesan" data-pesan={pesanArsip.id}>{tx(pesanArsip.teks)}</p>
              </section>
            ) : null}
            <button type="button" className="akh-kedua iv-tombol" data-tutup-arsip="" onClick={tutup}>{tx('inv.hasil.tutup')}</button>
          </div>
        </Modal>
      ) : null}
      {lembar === 'lagi' ? (
        <Modal judul={t('investigasi.hasil.mainLagi')} onTutup={tutup} lebar={420}>
          <div className="iv-lagi" data-lembar-main-lagi="">
            {lemah ? (
              <>
                <button type="button" className="iv-lagi-pilih" data-utama="" data-latih={lemah.langkah} onClick={() => { tutup(); setSegar(false); setLatihan(lemah); }}>
                  <b>{tx('inv.lagi.lemah')}</b>
                  <span>{namaTitik(lemah)} · {lemah.poin} / {lemah.maks}</span>
                </button>
                <p className="iv-lagi-ket">{tx('inv.lagi.lemahKet')}</p>
              </>
            ) : (
              <>
                {/* Skor sempurna: hadiahnya pernyataan yang sudah dikoreksi (halaman "Keterangan" buku catatan). */}
                <p className="iv-lagi-sempurna" data-hadiah-sempurna="">{tx('inv.lagi.sempurna')}</p>
                {dikoreksi ? <BukuCatatan pernyataan={dikoreksi.pernyataan} bukti={[]} halaman="keterangan" tanpaPensil koreksi={dikoreksi.koreksi} /> : null}
              </>
            )}
            <button type="button" className="iv-lagi-pilih" data-ulang-awal="" onClick={() => { tutup(); onMainLagi(); }}>
              <b>{tx('inv.lagi.awal')}</b>
              <span>{tx('inv.lagi.awalKet')}</span>
            </button>
            <TamuBaru ep={ep} tx={tx} onMulaiUlang={() => { tutup(); onMainLagi(); }} />
          </div>
        </Modal>
      ) : null}
    </PenyediaTeksInvestigasi>
  );
}

/** Buku catatan (Menu): pernyataan yang sudah disemat + kartu bukti yang sudah terkumpul (+ T-087: baris koreksi). */
export function IsiBukuCatatan({ ep, state, tx }: { ep: Episode; state: StateCerita; tx: Tx }) {
  const dikoreksi = koreksiBuku(ep, state, tx);
  // T-106: "Tanya lebih lanjut" yang sudah dibuka tertulis di bawah pernyataan saksinya (sumbernya), bisa dibaca ulang kapan saja.
  const tanya = tekananTerbuka(ep, state).map((x) => ({ id: x.pernyataan.id, tanya: tanpaAwalan(tx(x.press.questionKey)), jawab: tx(x.press.answerKey) }));
  return (
    <PenyediaTeksInvestigasi value={tx}>
      <BukuCatatan pernyataan={pernyataanTercatat(ep, state)} bukti={buktiTerkumpul(ep, state)} koreksi={dikoreksi?.koreksi} tanya={tanya} />
    </PenyediaTeksInvestigasi>
  );
}
