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
import { t } from '../../i18n';
import { Modal } from '../../ui/kit';
import { cariEpisode } from '../episode';
import { jenisPenutur, ketukanKini } from '../hp/alur';
import { BingkaiDashcam } from '../hp/arena/ArenaDashcam';
import { babKini, barisTerlihat } from '../mesin';
import { bacaDrafAktivitas, kunjunganAktivitas, simpanDrafAktivitas } from '../simpan';
import type { Ekspresi, Episode, HasilMuat, KonfigInvestigasi, KunciTeks, NodeCerita, NodeInvestigasi, StateCerita } from '../tipe';
import { PotretPikselHp } from '../ui/latar/piksel/PotretPikselHp';
import { tokohPotret } from '../ui/latar/piksel/potret';
import { tamuBaruSemuaKasus } from './hub';
import { RUTE_HUB, ruteKasus, useRumahCerita } from './rute';
import { adaRekaman, bacaRekaman, berlanggananInvestigasi, catatHasil, catatIntipKasus2, pangkat, STEMPEL_SENIOR, TOTAL_MAKS, totalSkor, versiInvestigasi } from './simpan';
import { langkahTerlemah, MAKS_LANGKAH, poinKeberatan, poinLangkah, poinPesan, poinPutusan, putusanTepat, skorKasus, type LangkahNilai, type SkorKasus } from './skor';
import { buktiTerkumpul, hasilKasus, PESAN, pernyataanDikoreksi, pernyataanTercatat, tebakanAwal, type Bukti, type HasilKeberatan, type Pernyataan, type Pesan } from './status';
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
import { PratinjauKasus2, TeaserKasus } from './ui/TeaserKasus';
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
function teksPutusan(konfig: KonfigInvestigasi, tx: Tx): { ket?: string; sebab?: Record<'layak' | 'tambahan' | 'polis', string> } {
  const l = konfig.putusanLayar;
  return l ? { ket: tx(l.ket), sebab: { layak: tx(l.sebab.layak), tambahan: tx(l.sebab.tambahan), polis: tx(l.sebab.polis) } } : {};
}

/** Baris koreksi di buku catatan: teks kasus (`konfig.koreksi.baris`) atau baris kamus kasus 1 ("Laporan dikoreksi: lajur 2"). */
function koreksiBuku(ep: Episode, state: StateCerita, tx: Tx): { pernyataan: Pernyataan; koreksi: KoreksiPernyataan } | null {
  const p = pernyataanDikoreksi(ep, state);
  if (!p) return null;
  const k = ep.investigasi?.koreksi;
  return { pernyataan: p, koreksi: { id: p.id, teks: k ? tx(k.baris) : t('investigasi.koreksi.baris') } };
}

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
function LayarKoreksi({ konfig, pernyataan, tx, onLanjut }: { konfig: KonfigInvestigasi; pernyataan: Pernyataan | undefined; tx: Tx; onLanjut: () => void }) {
  useEffect(() => { playSfx('pensil'); }, []);
  const k = konfig.koreksi;
  return (
    <section className="iv-layar iv-koreksi" data-koreksi-catatan="umum" aria-labelledby="iv-koreksi-judul">
      <h2 id="iv-koreksi-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{k ? tx(k.judul) : t('investigasi.koreksi.judul')}</h2>
      {k ? <p className="iv-label">{tx(k.ket)}</p> : null}
      {pernyataan && k ? (
        <BukuCatatan pernyataan={[pernyataan]} bukti={[]} halaman="keterangan" tanpaPensil koreksi={{ id: pernyataan.id, teks: tx(k.baris), baru: true }} />
      ) : null}
      <button type="button" className="primary-action iv-tombol" data-koreksi-lanjut="" onClick={onLanjut}>{tx('inv.ui.lanjut')}</button>
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
            if (inv.percobaan === 2) { if (id === inv.tepat) onLanjut(); return; }
            if (onPilih(id) && id !== inv.tepat) playSfx('keliru'); // T-085: dengung rendah lembut
          }} />
      );
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
function LatihanKasus({ ep, konfig, state, langkah, skor, tx, onSelesai }: { ep: Episode; konfig: KonfigInvestigasi; state: StateCerita; langkah: LangkahNilai; skor: SkorKasus; tx: Tx; onSelesai: () => void }) {
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
      {langkah === 'keberatan' ? <LatihanKeberatan key={putaran} ep={ep} konfig={konfig} state={state} tx={tx} onHasil={(h) => setHasil({ poin: poinKeberatan(h), kalimat: tx(kunci(konfig, 'keb.cap')) })} />
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
  /** Mulai kasus dari awal (progres cerita episode ini saja); skor terbaik tetap tersimpan. */
  onMainLagi: () => void;
}) {
  useSyncExternalStore(berlanggananInvestigasi, versiInvestigasi, () => 0);
  const navigasi = useNavigate();
  // T-094: kasus yang dibuka dari hub Raksa Investigator (atau alamat pendeknya) pulang ke hub; kasus berikutnya tetap di bawah hub.
  const rumah = useRumahCerita();
  const konfig = ep.investigasi;
  const kasus = konfig?.kasus ?? ep.id;
  const h = hasilKasus(state);
  const total = h && konfig ? skorKasus(h, konfig.putusan).total : null;
  /** Rekaman SEBELUM hasil ini dicatat: dasar "stempel baru" dan "rekor baru". Muat ulang di layar ini = keduanya sudah lewat. */
  const [sebelum] = useState(() => bacaRekaman());
  useEffect(() => { if (total !== null) catatHasil(kasus, total); }, [kasus, total]);
  const [tahap, setTahap] = useState<'ucapan' | 'skor'>('ucapan');
  const [lembar, setLembar] = useState<'lagi' | 'pratinjau' | 'arsip' | null>(null);
  const [latihan, setLatihan] = useState<LangkahNilai | null>(null);
  /** Perayaan (cap mendarat, "Rekor baru!", bunyinya) hanya pada tampilan pertama rincian skor, bukan sepulang dari latihan. */
  const [segar, setSegar] = useState(true);
  if (!h || !konfig) {
    // State tanpa ketiga hasil (seharusnya tidak terjadi di jalur naskah): tetap beri jalan keluar.
    return <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={onMainLagi}>{tx('inv.ui.lanjut')}</button></section>;
  }
  const skor = skorKasus(h, konfig.putusan);
  if (latihan) {
    return <PenyediaTeksInvestigasi value={tx}><LatihanKasus key={latihan} ep={ep} konfig={konfig} state={state} langkah={latihan} skor={skor} tx={tx} onSelesai={() => setLatihan(null)} /></PenyediaTeksInvestigasi>;
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
  const r = bacaRekaman();
  // Stempel kasus ini langsung terlihat (efek pencatatan baru berjalan sesudah gambar pertama).
  const stempel = r.stempel.includes(kasus) ? r.stempel : [...r.stempel, kasus];
  const lama = sebelum.terbaik[kasus];
  const lemah = langkahTerlemah(skor);
  const dikoreksi = koreksiBuku(ep, state, tx);
  const tutup = () => setLembar(null);
  // T-090: kasus berikutnya (episode yang bisa dimainkan di build ini) dan total semua kasus.
  const berikut = konfig.berikut ? cariEpisode(konfig.berikut) : null;
  const berikutTamat = !!berikut?.investigasi && stempel.includes(berikut.investigasi.kasus);
  const keBerikut = () => { catatIntipKasus2(); if (berikut) navigasi(rumah === RUTE_HUB && berikut.investigasi ? ruteKasus(berikut.investigasi.nomor) : '/cerita/' + berikut.id); else setLembar('pratinjau'); };
  const totalSemua = totalSkor({ terbaik: { ...r.terbaik, [kasus]: Math.max(r.terbaik[kasus] ?? 0, skor.total) } });
  const tampilTotal = !konfig.berikut || stempel.length >= 2;
  const nodePesan = ep.node.pesan;
  const pesanTerkirim = nodePesan?.jenis === 'pilihan' ? nodePesan.pilihan.find((x) => x.id === h.pesan) : undefined;
  const kaki = konfig.berikut ? (
    berikutTamat
      ? <button type="button" className="iv-berikut" data-kasus-berikut={konfig.berikut} onClick={keBerikut}><b>{t('investigasi.kasus2.judul')}</b><span aria-hidden="true">›</span></button>
      : <TeaserKasus onBuka={keBerikut} />
  ) : konfig.arsip || konfig.segera ? (
    <div className="iv-hasil-arsip">
      {konfig.arsip ? (
        <button type="button" className="iv-berikut" data-arsip-kasus="" aria-haspopup="dialog" onClick={() => setLembar('arsip')}>
          <b>{tx('inv.hasil.arsip')}<small>{tx('inv.hasil.arsipKet')}</small></b><span aria-hidden="true">›</span>
        </button>
      ) : null}
      {konfig.segera ? <p className="iv-segera" data-kasus-segera="">{tx(konfig.segera)}</p> : null}
    </div>
  ) : null;
  // T-099: cerita klaim dari kejadian yang sama (hanya kasus yang menyebutnya, dan hanya bila episode itu ada di build ini).
  const cerita = konfig.cerita && cariEpisode(konfig.cerita.episode) ? konfig.cerita : null;
  const tautCerita = cerita ? (
    <p className="iv-cerita"><Link to={'/cerita/' + cerita.episode} data-cerita-kasus={cerita.episode}>{tx(cerita.ajakan)} <span aria-hidden="true">›</span></Link></p>
  ) : undefined;
  return (
    <PenyediaTeksInvestigasi value={tx}>
      {/* T-078: Miss Raksa "bangga" bila putusannya tepat (akhir tuntas), "berpikir" bila diluruskan */}
      <HasilInvestigasi skor={skor} nama={nama} look={look} stempel={stempel} pangkat={pangkat(stempel.length)} reaksi={putusanTepat(konfig.putusan, h.putusan) ? 'miss-bangga' : 'miss-berpikir'}
        stempelBaru={segar && !sebelum.stempel.includes(kasus)} rekor={segar && lama !== undefined && skor.total > lama} terbaik={Math.max(r.terbaik[kasus] ?? 0, lama ?? 0)}
        total={tampilTotal ? { skor: totalSemua, maks: TOTAL_MAKS, menuju: stempel.length === STEMPEL_SENIOR - 1 ? tx('inv.hasil.menuju') : undefined } : undefined}
        onMainLagi={() => setLembar('lagi')} onSelesai={() => navigasi(rumah)} teaser={kaki} tautan={tautCerita} />
      {lembar === 'pratinjau' ? <PratinjauKasus2 onTutup={tutup} /> : null}
      {lembar === 'arsip' && konfig.arsip ? (
        <Modal judul={tx('inv.hasil.arsip')} onTutup={tutup} lebar={420}>
          {/* T-090: kenang-kenangan kasus, baca saja: garis waktu + keterangan yang diperbarui + pesan yang dikirim tamu */}
          <div className="iv-arsip" data-arsip-kasus-isi="">
            <section className="iv-arsip-kartu" aria-labelledby="iv-arsip-garis">
              <h3 id="iv-arsip-garis">{tx(konfig.arsip.judul)}</h3>
              <ol className="iv-garis">
                {konfig.arsip.garis.map((k, i) => <li key={k} data-sorot={i === konfig.arsip?.sorot ? '' : undefined}>{tx(k)}</li>)}
              </ol>
            </section>
            {dikoreksi ? <BukuCatatan pernyataan={[dikoreksi.pernyataan]} bukti={[]} halaman="keterangan" tanpaPensil koreksi={dikoreksi.koreksi} /> : null}
            {pesanTerkirim ? (
              <section className="iv-arsip-kartu" aria-labelledby="iv-arsip-pesan">
                <h3 id="iv-arsip-pesan">{tx(konfig.arsip.pesan)}</h3>
                <p className="iv-arsip-pesan" data-pesan={h.pesan}>{tx(pesanTerkirim.teks)}</p>
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
                <button type="button" className="iv-lagi-pilih" data-utama="" data-latih={lemah} onClick={() => { tutup(); setSegar(false); setLatihan(lemah); }}>
                  <b>{tx('inv.lagi.lemah')}</b>
                  <span>{tx(`inv.lagi.langkah.${lemah}`)} · {poinLangkah(skor, lemah)} / {MAKS_LANGKAH[lemah]}</span>
                </button>
                <p className="iv-lagi-ket">{tx('inv.lagi.lemahKet')}</p>
              </>
            ) : (
              <>
                {/* Skor sempurna: hadiahnya pernyataan yang sudah dikoreksi (halaman "Keterangan" buku catatan). */}
                <p className="iv-lagi-sempurna" data-hadiah-sempurna="">{tx('inv.lagi.sempurna')}</p>
                {dikoreksi ? <BukuCatatan pernyataan={[dikoreksi.pernyataan]} bukti={[]} halaman="keterangan" tanpaPensil koreksi={dikoreksi.koreksi} /> : null}
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
  return (
    <PenyediaTeksInvestigasi value={tx}>
      <BukuCatatan pernyataan={pernyataanTercatat(ep, state)} bukti={buktiTerkumpul(ep, state)} koreksi={dikoreksi?.koreksi} />
    </PenyediaTeksInvestigasi>
  );
}
