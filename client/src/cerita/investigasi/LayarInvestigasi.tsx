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
 * T-115 (pemilik: "semua layar tanpa menggulir"): tiap layar di sini muat di 360 x 640 dan 390 x 700 tanpa gulir (hitungan per
 * layar: team/HANDOFF.md "## T-115"; gaya rapatnya di ui/muat.css). Yang berubah bentuk: layar semat hanya halaman "Keterangan"
 * (halaman "Bukti" tinggal kepalanya); layar "Bukti baru!" hanya slip yang baru; putusan = alasan terbuka pada kartu yang dipilih;
 * gerbang "Mulai baru" menyembunyikan potret selama bertanya; arsip kasus dan buku catatan (Menu) = BERHALAMAN (tab), satu
 * pernyataan per tampilan; hasil = tiga tombol sebaris (Main lagi / Arsip kasus / Selesai); latihan pesan = daftar tiga pesan
 * terpotong, pesan yang dipilih tampil utuh sendirian.
 *
 * T-126 (masukan Pak Peterson, kartu C; hitungan: team/HANDOFF.md "## T-126"):
 *  - butir 19 + 20: lembar "Rincian nilai" di layar hasil (RincianNilai): tiga halaman (Bukti / Putusan / Penanganan nasabah), tiap
 *    halaman = poin didapat / maksimum, alasan pengurangannya dari FAKTA yang tersimpan (hasil tiap babak, putusan, pesan; tidak
 *    pernah menebak ketukan dari totalnya), dan "Latih bagian ini" tepat di samping penjelasannya (latihan tidak mengubah skor
 *    terbaik). Halaman pertama = bagian terlemah. Lembar "Main lagi" (latih pilihan terlemah / ulang dari awal) tidak berubah.
 *  - butir 10: gambar sampul kasus 1 = SeniTolNetral (jalan tol kosong), bukan bingkai dashcam bertruk.
 *
 * T-127 (BABAK 2 masukan Pak Peterson, irisan 1: sambungan bersama + kasus 1; hitungan: team/HANDOFF.md "## T-127"). Semuanya
 * FORMATIF: tanpa poin, tidak lewat sambungan pilihan bernilai (./acara.ts), tidak menyentuh rekaman perangkat:
 *  - "Tanya lebih lanjut" = PILIHAN 2-3 pertanyaan per kunjungan saksi (LayarTekan + PressPanel `choices`); pertanyaan yang berguna
 *    memberi TANDA JELI di buku catatan (dibaca dari tanda press yang sudah ada).
 *  - node `tafsir` (dan `periksa-sim` bila kasusnya punya tafsir 'sim') = PilihFormatif: pilih satu bacaan atas satu bukti, keliru
 *    pertama = penunjuk ke sumbernya, keliru kedua = penjelasan lalu lanjut (LayarTafsir; jumlah kekeliruan = draf kunjungan).
 *  - KEBERATAN percobaan pertama = TEMUAN BERPASANGAN (pilih satu keterangan + satu bukti; `konfig.keberatan.pasangan`).
 *  - judul kartu bukti NETRAL; temuannya ditulis di slip sesudah pemain menafsirkan atau dipandu (`slipTemuan`): tafsiran pemain
 *    (pensil) terpisah dari temuan yang sudah terbukti (centang), dan buku catatan mendapat halaman "Temuan" (DaftarTemuan).
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
import { babKini, barisTerlihat } from '../mesin';
import { bacaDrafAktivitas, kunjunganAktivitas, mulaiBaru, simpanDrafAktivitas } from '../simpan';
import { teksCerita } from '../teks';
import type { Ekspresi, Episode, HasilMuat, KonfigInvestigasi, KunciTeks, NodeCerita, NodeInvestigasi, PanelCard, Round, StateCerita, TafsirInvestigasi } from '../tipe';
import { PotretPikselHp } from '../ui/latar/piksel/PotretPikselHp';
import { tokohPotret } from '../ui/latar/piksel/potret';
import { modeAcara } from './acara';
import { aksiLanjut, daftarKasusHub, tamuBaruSemuaKasus, tujuanPangkat, type KasusHub } from './hub';
import { RUTE_HUB, ruteKasus, useRumahCerita } from './rute';
import { adaRekaman, bacaRekaman, berlanggananInvestigasi, catatHadiah, catatHasil, catatIntipKasus2, hadiahRekaman, pangkatRekaman, stempelSeri, TOTAL_MAKS, totalSkor, versiInvestigasi } from './simpan';
import { MAKS_LANGKAH, poinBabak, poinKeberatan, poinPesan, poinPutusan, putusanTepat, rincianBabak, skorKasus, skorKasusLengkap, titikTerlemah, type SkorKasus, type TitikLatihan } from './skor';
import { buktiTerkumpul, hasilKasus, hasilKasusLengkap, PESAN, PILIH_LANJUT, pernyataanTercatat, pilihTekan, semuaPernyataanDikoreksi, semuaPress, tafsirDibuat, tebakanAwal, tekananTerbuka, temuanKasus, type Bukti, type HasilBabak, type HasilKeberatan, type HasilLengkap, type Pernyataan, type Pesan, type Putusan } from './status';
import { BukuCatatan, PotretReaksi, reaksiSah, type KoreksiPernyataan, type TemuanSlip } from './ui/BukuCatatan';
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
import { PilihFormatif } from './ui/PilihFormatif';
import { CINCIN_K3_FOTO, SENI_R2, SLIP_WAKTU_K2, type IdSeniR2 } from './ui/seniR2';
import { seniKasus } from './ui/seniKasus';
import { SeniTolNetral } from './ui/SeniTolNetral';
import { evidenceArt, PanelAward, PanelExhibit, PanelRound, PressPanel } from './ui/panel';
import { useLabelPanel } from './ui/panel/teks';
import { TebakLajur, type Lajur } from './ui/TebakLajur';
import './ui/investigasi.css';
import './ui/alur.css';
import './ui/panel/panel.css';
import './ui/muat.css'; // T-115: sesudah lembar gaya layar (merapatkan layar-layar di atas supaya muat tanpa gulir)
import './ui/ronde2.css'; // T-127: bagian babak 2 (pilih formatif, tanda jeli, temuan); pemilihnya tidak menimpa aturan di atas

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

/** T-132: lapisan penunjuk di atas gambar bukti babak 2 (`BuktiInvestigasi.lapis`); hanya digambar sesudah temuannya ada. */
const LAPIS_R2: Readonly<Record<string, string>> = { 'k3-cincin': CINCIN_K3_FOTO };

/**
 * T-106: kartu bukti untuk komponen panel Designer (teks sudah diterjemahkan; `kutipan` = kutipan persis kartu itu).
 * T-132: kartu ber-`seni` membawa gambar babak 2-nya (kartu dan gambar besar yang netral); `bertemuan` = temuan kartu itu sudah ada
 * (tafsir dibuat / dipandu, atau pernyataannya dikoreksi): baru saat itu lapisan penunjuknya (`lapis`) ikut dikirim.
 */
function kartuPanel(b: Bukti, tx: Tx, redup = false, bertemuan = false): PanelCard {
  const g = b.seni && b.seni in SENI_R2 ? SENI_R2[b.seni as IdSeniR2] : null;
  const lapis = bertemuan && b.lapis ? LAPIS_R2[b.lapis] : undefined;
  return {
    id: b.id, title: tx(b.judul), source: tx(b.sumber), ...(b.kutipan ? { excerpt: tx(b.kutipan) } : {}), ...(redup ? { disabled: true } : {}),
    ...(g ? { art: { thumb: g.thumb, exhibit: g.exhibit, ...(lapis ? { overlay: lapis } : {}) } } : {}),
  };
}
/** Teks pilihan "Tanya: ..." tanpa awalannya (PressPanel dan buku catatan menulis pertanyaannya saja). */
const tanpaAwalan = (s: string): string => s.replace(/^[^:：]{1,16}[:：]\s*/, '');

/**
 * T-127: baris temuan untuk slip bukti (per id bukti): tafsir yang sudah dibuat pemain, atau temuan yang sudah terbukti.
 * Judul kartunya sendiri netral; baris inilah yang "ditulis di kartu" sesudah pemain menafsirkan atau dipandu.
 */
function slipTemuan(ep: Episode, state: StateCerita, tx: Tx): Record<string, TemuanSlip> {
  const hasil: Record<string, TemuanSlip> = {};
  for (const x of temuanKasus(ep, state)) if (x.bukti && x.ringkas) hasil[x.bukti] = { teks: tx(x.ringkas), mapan: x.mapan };
  return hasil;
}

/**
 * T-127: gambar bukti babak 2 (seni T-128, 288 x 192, 1 piksel gambar = 1 px CSS). `lajur` = nomor lajur 1..n di tengah tiap
 * lajur: HANYA digambar sebagai bantuan penjelasan (kekeliruan kedua).
 * T-130 (tinjauan Codex): `alt` = uraian yang TERLIHAT di gambar itu (hubungan letak, isian kotak; `seniKet` kasusnya), tanpa
 * kesimpulannya, supaya pemain pembaca layar bisa menafsirkan sendiri. Tanpa uraian = judul kartu yang netral.
 */
function GambarR2({ seni, alt, lajur, lapis }: { seni: string; alt: string; lajur?: readonly (readonly [number, number])[]; /** T-132: id LAPIS_R2 (penunjuk temuan). */ lapis?: string }) {
  const g = seni in SENI_R2 ? SENI_R2[seni as IdSeniR2] : null;
  if (!g) return null;
  const urlLapis = lapis ? LAPIS_R2[lapis] : undefined;
  return (
    <span className="r2-bingkai" data-seni-r2={seni} data-lapis={urlLapis ? lapis : undefined}>
      <img src={g.exhibit} width={288} height={192} alt={alt} />
      {urlLapis ? <img className="r2-lapis" src={urlLapis} width={288} height={192} alt="" /> : null}
      {lajur?.map(([a, b], i) => <i key={i} className="r2-lajur" aria-hidden="true" style={{ left: (a + b) / 2 }}>{i + 1}</i>)}
    </span>
  );
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
 * T-127: jumlah kekeliruan (0..2) di layar pilih formatif node ini = draf kunjungan yang sama, kunci sendiri. `periksa` = nodenya
 * dua langkah (periksa-sim): draf juga membawa `periksaSim: 1`, supaya muat ulang membuka layarnya lagi (bukan baris pengantarnya).
 * Simpanan lama di tengah periksa SIM tiga ketukan (periksaSim 1..2, tanpa kunci ini) = layar baru tanpa kekeliruan.
 */
const DRAF_TAFSIR = 'tafsir';
/**
 * T-130 (tinjauan Codex): draf = DAFTAR id pilihan yang sudah ditolak (urut), supaya muat ulang memulihkan pilihan yang padam dan
 * penunjuknya. Draf T-127 berupa ANGKA (jumlah kekeliruan saja) tetap dibaca apa adanya.
 */
function tafsirTersimpan(ep: Episode, state: StateCerita): number | string[] {
  const d = bacaDrafAktivitas(ep.id, kunjunganAktivitas(state));
  const n = d && typeof d === 'object' ? (d as Record<string, unknown>)[DRAF_TAFSIR] : null;
  if (Array.isArray(n)) return n.filter((x): x is string => typeof x === 'string' && x.length <= 40).slice(0, 2);
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(2, Math.floor(n))) : 0;
}
function simpanTafsir(ep: Episode, state: StateCerita, gugur: number | string[] | null, periksa: boolean): void {
  simpanDrafAktivitas(ep.id, kunjunganAktivitas(state), gugur === null ? {} : { ...(periksa ? { [DRAF_PERIKSA]: 1 } : {}), [DRAF_TAFSIR]: gugur });
}

/**
 * T-127 node `tafsir` (dan `periksa-sim` ber-tafsir): layar PilihFormatif untuk satu `TafsirInvestigasi`. Selesai (tepat atau
 * dipandu) = aksi mesin 'lanjut'; efek node itulah yang memasang `tafsir:<id>`. Tidak ada pilihan bernilai di sini.
 */
function LayarTafsir({ ep, konfig, state, tafsir, periksa, tx, onLanjut }: { ep: Episode; konfig: KonfigInvestigasi; state: StateCerita; tafsir: TafsirInvestigasi; periksa: boolean; tx: Tx; onLanjut: () => void }) {
  const [awal] = useState(() => tafsirTersimpan(ep, state));
  useEffect(() => {
    if (periksa && periksaTersimpan(ep, state) === 0) simpanTafsir(ep, state, awal, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const kartu = tafsir.bukti ? konfig.bukti.find((x) => x.id === tafsir.bukti) : undefined;
  const k = (ekor: string) => tx(kunci(konfig, `tafsir.${tafsir.id}.${ekor}`));
  const seni = tafsir.seni;
  const alt = tafsir.seniKet ? tx(tafsir.seniKet) : kartu ? tx(kartu.judul) : '';
  // Pilihan bergambar: slip waktu kasus 2 (96 x 68); gambarnya hiasan, nama aksesnya = teks + keterangan pilihan itu.
  const slip = (id: string | undefined) => (id && id in SLIP_WAKTU_K2 ? <img className="r2-slip" src={SLIP_WAKTU_K2[id as keyof typeof SLIP_WAKTU_K2]} width={96} height={68} alt="" /> : undefined);
  const hadiah = tafsir.hadiah && tafsir.hadiah in SENI_R2 ? <img className="r2-slip" src={SENI_R2[tafsir.hadiah as IdSeniR2].thumb} width={96} height={68} alt="" /> : undefined;
  return (
    <PilihFormatif id={tafsir.id} tanya={tx(tafsir.tanya)} awal={awal} susun={tafsir.tampilan === 'daftar' ? 'kolom' : 'baris'} hadiah={hadiah}
      gambar={seni ? (jelas, selesai) => <GambarR2 seni={seni} alt={alt} lajur={jelas ? tafsir.lajur : undefined} lapis={selesai ? kartu?.lapis : undefined} /> : undefined}
      opsi={tafsir.opsi.map((o) => ({ id: o.id, teks: tx(o.teks), gambar: slip(o.seni), ...(o.ket ? { ket: tx(o.ket) } : {}) }))} tepat={tafsir.tepat} hampir={tafsir.hampir}
      salah={(id) => k(`salah.${id}`)} alasan={k('alasan')} benar={k('benar')} lanjut={tx('inv.ui.lanjut')}
      onCoba={(gugur) => simpanTafsir(ep, state, gugur, periksa)} onSelesai={() => { simpanTafsir(ep, state, null, periksa); onLanjut(); }} />
  );
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
      {/* T-115: halaman "Bukti" tinggal kepalanya (jumlah); slipnya ada di buku catatan (tombol buku di kepala layar). */}
      <BukuCatatan pernyataan={[...lain, ...(tersemat ? [p] : [])]} bukti={buktiTerkumpul(ep, state)} ringkasBukti tanpaPensil
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
  // T-115: halaman buku hanya memuat slip yang BARU (kepalanya tetap menghitung semua bukti); yang lama ada di buku catatan.
  const jumlah = new Set([...buktiTerkumpul(ep, state).map((x) => x.id), ...baru]).size;
  // T-127: tafsir yang baru saja dibuat pemain ikut tertulis di slipnya ("ditulis di kartu sesudah pemain menafsirkan").
  const temuan = slipTemuan(ep, state, tx);
  return (
    <section className="iv-layar iv-bukti-baru" data-bukti-baru={baru.join(' ')} aria-labelledby="iv-bukti-baru-judul">
      <div className="iv-bukti-kepala">
        {baru.includes('sim') ? <PotretReaksi reaksi="darto-lega" ukuran={48} /> : null}
        <h2 id="iv-bukti-baru-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx('inv.ui.buktiBaru')}</h2>
      </div>
      {balik ? <p className="iv-tempel iv-tebak-balik" data-tebak-balik="">{balik}</p> : null}
      {keterangan ? <p>{keterangan}</p> : null}
      <BukuCatatan pernyataan={[]} bukti={bukti} jumlahBukti={jumlah} buktiBaru={baru} halaman="bukti" tanpaPensil temuan={temuan} />
      {bukti.filter((b) => !!evidenceArt(b.id)).map((b) => (
        <button key={b.id} type="button" className="akh-kedua iv-tombol iv-tombol-kedua" data-perbesar-bukti={b.id} aria-haspopup="dialog" onClick={() => { playSfx('kertas'); setBesar(b); }}>{label('periksa', { judul: tx(b.judul) })}</button>
      ))}
      <button type="button" className="primary-action iv-tombol" data-simpan-bukti="" onClick={() => { playSfx('kertas'); onLanjut(); }}>{tx('inv.ui.simpan')}</button>
      {besar ? <PanelExhibit card={kartuPanel(besar, tx, false, !!temuan[besar.id])} onClose={() => setBesar(null)} /> : null}
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
  // T-132: penunjuk di gambar besar (cincin spion) hanya untuk kartu yang temuannya sudah ada di buku catatan pemain.
  const temuan = slipTemuan(ep, state, tx);
  const cards = round.evidenceIds.filter((id) => punya.includes(id)).flatMap((id) => {
    const b = konfig.bukti.find((x) => x.id === id);
    return b ? [kartuPanel(b, tx, attempt === 2 && !round.acceptedIds.includes(id), !!temuan[id])] : [];
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
  // T-127: pernyataan boleh punya 2-3 pertanyaan (press + pressLain). Node 'jawab' menyebut pertanyaannya sendiri (`tekan.press`).
  const semua = p ? semuaPress(p) : [];
  const press = tk ? semua.find((x) => x.id === tk.press) : undefined;
  if (!tk || !p || !press) return <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={maju}>{tx('inv.ui.lanjut')}</button></section>;
  // Yang ditawarkan = pertanyaan yang memang punya pilihan di node tawar ini (lebih dari satu = daftar "pilih satu").
  const ditawarkan = tawar && node.jenis === 'pilihan' ? semua.filter((x) => node.pilihan.some((o) => o.id === pilihTekan(p, x.id))) : [];
  const banyak = ditawarkan.length > 1;
  const bergambar = !tawar && !!press.seni;
  return (
    <section className="iv-layar iv-tekan" data-layar-tekan={tk.langkah} data-tekan-banyak={banyak ? '' : undefined} data-tekan-press={tawar ? undefined : press.id} aria-labelledby="iv-tekan-judul">
      <h2 id="iv-tekan-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx(banyak ? 'inv.ui.tekan.apa' : 'inv.ui.tekan.pilih')}</h2>
      {banyak ? <p className="iv-label">{tx('inv.ui.tekan.satu')}</p> : null}
      {/* jawaban bergambar: gambarnya menggantikan halaman keterangan (pernyataannya baru saja disemat), supaya muat tanpa gulir */}
      {bergambar ? <div className="iv-tekan-gambar"><GambarR2 seni={press.seni!} alt={press.seniKet ? tx(press.seniKet) : ''} /></div> : <BukuCatatan pernyataan={[p]} bukti={[]} halaman="keterangan" tanpaPensil />}
      <PressPanel question={tanpaAwalan(tx(press.questionKey))} answer={tx(press.answerKey)} opened={!tawar}
        choices={banyak ? ditawarkan.map((x) => ({ id: x.id, question: tanpaAwalan(tx(x.questionKey)) })) : undefined}
        mark={!tawar && press.berguna ? t('investigasi.jeli.dapat') : undefined}
        onPress={(id) => { if (onPilih(pilihTekan(p, id ?? press.id))) playSfx('kertas'); }} onClose={onLanjut} />
      {tawar ? <button type="button" className="primary-action iv-tombol" data-tekan-lanjut="" onClick={maju}>{tx('inv.ui.tekan.lanjut')}</button> : null}
    </section>
  );
}

/**
 * T-127: isi lembar "perbesar" KEBERATAN untuk kartu yang punya seni babak 2: gambar bukti yang netral (tanpa nomor lajur, tanpa
 * sorotan). undefined = lembar lama (bingkai dashcam bernomor).
 */
function zumBukti(konfig: KonfigInvestigasi, tx: Tx): (id: Bukti['id']) => ReactNode | undefined {
  // T-130: per KARTU yang dibuka (bukan selalu kartu yang tepat). Alt = uraian tafsir kartu itu bila ada, selain itu judulnya.
  return (id) => {
    const b = konfig.bukti.find((x) => x.id === id);
    if (!b?.seni) return undefined;
    const tf = konfig.tafsir?.find((x) => x.bukti === id && x.seni === b.seni);
    return <GambarR2 seni={b.seni} alt={tf?.seniKet ? tx(tf.seniKet) : tx(b.judul)} />;
  };
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
          {/* T-078: bingkai dashcam diam di kartu pembuka; T-090: kasus ber-`bingkai: 'seni'` = gambar seniKasus. T-126 (butir 10):
              kasus 1 = SeniTolNetral (jalan tol KOSONG, T-125), supaya tidak ada jalur yang memperlihatkan truk di lajur 2 sebelum
              rekamannya diperiksa. Rekaman bertruk tetap hanya di penyelidikan (ArenaDashcam, kartu bukti, zum KEBERATAN). */}
          <JudulKasus nomor={konfig.nomor} judul={konfig.judul} onMulai={onLanjut} tokoh={<PotretReaksi reaksi="miss-detektif" ukuran={128} />}
            gambar={konfig.bingkai === 'dashcam' ? <SeniTolNetral besar /> : <img className="iv-seni-kasus" src={seniKasus(konfig.kasus).judul} alt="" />} />
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
      // T-130 (tinjauan Codex): kalimat "Tebakan awalmu ... tafsiranmu ..." hanya bila tafsir kartu itu memang DIBUAT pemain di
      // simpanan ini. Simpanan lama yang sudah melewati layar tafsir tidak pernah diberi "tafsiranmu" yang tidak ia buat.
      const tafsirKartu = konfig.tafsir?.find((x) => x.bukti === konfig.tebak.balikPada);
      const tebakan = id.includes(konfig.tebak.balikPada) && (!tafsirKartu || tafsirDibuat(state, tafsirKartu.id)) ? tebakanAwal(ep, state) : null;
      isi = <LayarBukti key={node.id} ep={ep} state={state} bukti={konfig.bukti.filter((x) => id.includes(x.id))} keterangan={barisPertama}
        balik={tebakan ? tx(kunci(konfig, `tebak.balik.${tebakan}`)) : ''} tx={tx} onLanjut={onLanjut} />;
      break;
    }
    case 'keberatan': {
      const pernyataan = konfig.pernyataan.find((x) => x.id === inv.pernyataan);
      // Hanya kartu yang SUDAH terkumpul yang dikirim: kartu lain tidak bisa dipilih (mesin pun menolaknya lewat `jika`).
      const bukti = urutKartu(konfig, buktiTerkumpul(ep, state));
      if (!pernyataan) { isi = <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={onLanjut}>{tx('inv.ui.lanjut')}</button></section>; break; }
      // T-127: percobaan pertama = temuan berpasangan (bila kasusnya punya `pasangan`): keterangan dipilih dari yang sudah tersemat.
      const pas = inv.percobaan === 0 ? konfig.keberatan.pasangan : undefined;
      isi = (
        <LayarKeberatan key={node.id} pernyataan={pernyataan} bukti={bukti} percobaan={inv.percobaan} tepat={inv.tepat}
          perbesar={konfig.keberatan.perbesar ?? []} {...teksKeberatan(konfig, inv.percobaan, tx)}
          {...(pas ? { tanya: tx(pas.tanya), pasangan: { pernyataan: pernyataanTercatat(ep, state), ket: tx(pas.ket), salah: (id: string) => tx(kunci(konfig, `pasang.salah.${id}`)), alasan: tx(kunci(konfig, 'pasang.alasan')) } } : {})}
          temuan={slipTemuan(ep, state, tx)} zum={zumBukti(konfig, tx)}
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
    case 'tafsir': {
      // T-127: pilihan formatif atas satu bukti (tanpa poin); data kasus keliru = jangan menahan pemain.
      const x = konfig.tafsir?.find((y) => y.id === inv.tafsir);
      isi = x ? <LayarTafsir key={node.id} ep={ep} konfig={konfig} state={state} tafsir={x} periksa={false} tx={tx} onLanjut={onLanjut} />
        : <section className="iv-layar"><button type="button" className="primary-action iv-tombol" onClick={onLanjut}>{tx('inv.ui.lanjut')}</button></section>;
      break;
    }
    case 'periksa-sim': {
      // T-127 (butir 13): kasus yang punya tafsir 'sim' = SATU pilihan formatif (golongan cocok / tidak cocok / tanggal tidak terbaca)
      // atas catatan SIM dan STNK, menggantikan tiga ketukan "COCOK". Id node, jenis dan urutannya tidak berubah.
      const sim = konfig.tafsir?.find((y) => y.id === 'sim');
      if (sim) { isi = <LayarTafsir key={node.id} ep={ep} konfig={konfig} state={state} tafsir={sim} periksa tx={tx} onLanjut={onLanjut} />; break; }
      // T-080: periksa SIM di meja wawancara (3 ketukan); selesai = lanjut ke node kartu bukti SIM. T-087: langkahnya disimpan
      // sebagai draf kunjungan, jadi muat ulang melanjutkan dari langkah yang sama.
      const awal = Math.min(2, periksaTersimpan(ep, state)) as 0 | 1 | 2;
      isi = <PeriksaSim key={node.id} awal={awal} onLangkah={(n) => simpanPeriksa(ep, state, n)}
        onSelesai={() => { simpanPeriksa(ep, state, null); onLanjut(); }} />;
      break;
    }
    case 'periksa-perjalanan':
    case 'periksa-polis': {
      // T-130 (babak 2, kasus 2): kasus yang punya tafsir 'jam' / 'klausul' = pilihan formatif di node LAMA itu (id node, jenis dan
      // lanjutannya tidak berubah); tanpa tafsir itu = layar garis waktu / kartu polis seperti semula.
      const x = konfig.tafsir?.find((y) => y.id === (inv.jenis === 'periksa-perjalanan' ? 'jam' : 'klausul'));
      isi = x ? <LayarTafsir key={node.id} ep={ep} konfig={konfig} state={state} tafsir={x} periksa tx={tx} onLanjut={onLanjut} />
        : <LayarPeriksa key={node.id} ep={ep} state={state} jenis={inv.jenis} onLanjut={onLanjut} />;
      break;
    }
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
    <section className="iv-layar iv-gerbang" data-gerbang-kasus="" data-tanya={tanya ? '' : undefined} aria-labelledby="iv-gerbang-judul">
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
      perbesar={konfig.keberatan.perbesar ?? []} {...teksKeberatan(konfig, percobaan, tx)} temuan={slipTemuan(ep, state, tx)} zum={zumBukti(konfig, tx)}
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
  // T-115: pesan untuk nasabah panjang (kasus 2: +- 390 huruf), jadi tiga pesan utuh tidak muat. Daftar = tiap pesan dipotong 3
  // baris; pesan yang diketuk tampil UTUH sendirian dengan "Ganti pesan" (kembali ke daftar) dan "Kirim pesan".
  const terpilih = pilihan.find((x) => x.id === pilih);
  if (terpilih) {
    return (
      <section className="iv-layar iv-latihan-pesan" data-latihan-pesan="lipat" aria-labelledby="iv-latihan-pesan-tanya">
        <h2 id="iv-latihan-pesan-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx(kunci(konfig, 'pesan.tanya'))}</h2>
        <p className="iv-pesan-kartu" data-pesan={terpilih.id} data-utuh="" role="status"><span>{tx(terpilih.teks)}</span><span className="iv-bukti-tanda" aria-hidden="true">✓</span></p>
        <button type="button" className="hp-tautan iv-pesan-ganti" data-ganti-pesan="" onClick={() => setPilih(null)}>{t('ceritaHp.gantiBalasan')}</button>
        <button type="button" className="primary-action iv-tombol" data-latihan-kirim="" onClick={() => { playSfx('pesanKirim'); onHasil(terpilih.id as Pesan); }}>{tx('inv.latihan.kirim')}</button>
      </section>
    );
  }
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
      <div className="iv-layar iv-latihan-kepala">{pita}</div>
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
  const [lembar, setLembar] = useState<'lagi' | 'arsip' | 'rincian' | null>(null);
  /** T-115: halaman arsip yang dibuka lebih dulu (dari lembar "Main lagi" pada skor sempurna: keterangan yang dikoreksi). */
  const [tabArsip, setTabArsip] = useState<TabArsip | undefined>(undefined);
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
    // T-109: sedang main di papan acara = kasus berikutnya juga di papan (run baru dari awal; simpanan main sendiri tidak disentuh).
    if (modeAcara()) { navigasi('/investigator/acara/' + k.nomor); return; }
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
    </div>
  );
  // T-126: lembar "Rincian nilai". Halaman pertama = bagian terlemah (di situ pengurangan dan latihannya). Skor terbaik perangkat
  // yang LEBIH tinggi dari permainan ini ikut disebut; rinciannya hanya bila pilihan permainan terbaik itu tersimpan lengkap dan
  // jumlahnya memang skor terbaik itu (rekaman lama: totalnya saja).
  const tabRincian: TabRincian = lemah?.langkah === 'putusan' ? 'putusan' : lemah?.langkah === 'pesan' ? 'penanganan' : 'bukti';
  const terbaikKini = Math.max(r.terbaik[kasus] ?? 0, lama ?? 0);
  const pilihanTerbaik = r.penjelasan?.[kasus];
  const rinciTerbaik = terbaikKini > skor.total && pilihanTerbaik?.babak
    ? skorKasusLengkap(konfig, { babak: pilihanTerbaik.babak as HasilBabak[], putusan: pilihanTerbaik.putusan as Putusan, pesan: pilihanTerbaik.pesan as Pesan }) : null;
  const infoTerbaik = terbaikKini > skor.total ? { total: terbaikKini, rinci: rinciTerbaik && rinciTerbaik.total === terbaikKini ? rinciTerbaik : null } : null;
  // T-115: "Arsip kasus" pindah ke baris aksi (tombol ketiga, HasilInvestigasi `onArsip`); baris 48 px-nya dilepas.
  const bukaArsip = (tab?: TabArsip) => { setTabArsip(tab); setLembar('arsip'); };
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
        onMainLagi={() => setLembar('lagi')} onSelesai={() => navigasi(rumah)} teaser={kaki} tautan={tautCerita} onArsip={() => bukaArsip()}
        onRincian={() => { playSfx('kertas'); setLembar('rincian'); }} />
      {lembar === 'rincian' ? (
        <Modal judul={t('investigasi.rincian.judul')} onTutup={tutup} lebar={420}>
          <RincianNilai konfig={konfig} h={h} skor={skor} tx={tx} awal={tabRincian} terbaik={infoTerbaik}
            onLatih={(titik) => { tutup(); setSegar(false); setLatihan(titik); }} />
        </Modal>
      ) : null}
      {lembar === 'arsip' ? (
        <Modal judul={tx('inv.hasil.arsip')} onTutup={tutup} lebar={420}>
          {/* T-090 / T-106: arsip kasus, baca saja. T-115: BERHALAMAN (tab), satu halaman per tampilan, supaya tidak menggulir */}
          <ArsipKasus konfig={konfig} dikoreksi={dikoreksi} pesan={pesanArsip ? { id: pesanArsip.id, teks: tx(pesanArsip.teks) } : null} tx={tx} awal={tabArsip} />
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
                {/* T-115: keterangan yang dikoreksi dibuka di arsip kasus (halaman "Keterangan"), tidak lagi dijejalkan di lembar ini */}
                {dikoreksi ? <button type="button" className="iv-lagi-pilih" data-utama="" data-buka-koreksi="" onClick={() => bukaArsip('keterangan')}><b>{tx('inv.hasil.arsip')}</b><span>{t('investigasi.keterangan')}</span></button> : null}
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

type TabRincian = 'bukti' | 'putusan' | 'penanganan';

/**
 * T-126: isi lembar "Rincian nilai" (butir 19 + 20 masukan Pak Peterson). BERHALAMAN seperti arsip kasus: satu bagian nilai per
 * tampilan, supaya lembar tidak menggulir. Tiap halaman: poin didapat / maksimum, "n poin hilang" atau "Nilai penuh", ALASANNYA,
 * dan "Latih bagian ini" bila ada poin yang hilang.
 * Alasan hanya dari fakta yang tersimpan di state kasus (`h`):
 *   Bukti       hasil tiap babak (percobaan pertama / kedua / dipandu) + nilai ketiga hasil itu menurut rubrik; kasus ber-panel =
 *               satu blok per babak, masing-masing dengan latihannya sendiri. Kartu keliru yang diketuk TIDAK disebut (kasus 1-2
 *               tidak menyimpannya), jadi tidak ada yang ditebak dari total.
 *   Putusan     nama putusan yang dipilih + kalimat Miss Raksa untuk putusan itu (naskah kasus, `putusan.<id>.1`).
 *   Penanganan  kalimat naskah untuk pesan yang dikirim (`pesan.<id>.2`); pesan terbaik = satu kalimat kamus.
 * `terbaik` = skor terbaik perangkat yang lebih tinggi dari permainan ini: satu baris per halaman ("Di permainan terbaikmu: 40 / 40");
 * bila pilihan permainan terbaik itu tidak tersimpan (rekaman lama), hanya totalnya ("Skor terbaik kasus ini: 85"), tanpa alasan.
 * Latihan (LatihanKasus) tidak menyentuh mesin, skor kasus, maupun rekaman perangkat.
 */
function RincianNilai({ konfig, h, skor, tx, awal, terbaik, onLatih }: {
  konfig: KonfigInvestigasi;
  h: HasilLengkap;
  skor: SkorKasus;
  tx: Tx;
  awal: TabRincian;
  terbaik: { total: number; rinci: SkorKasus | null } | null;
  onLatih: (titik: TitikLatihan) => void;
}) {
  const [kini, setKini] = useState<TabRincian>(awal);
  const nilai: Record<TabRincian, { poin: number; maks: number }> = {
    bukti: { poin: skor.bukti, maks: MAKS_LANGKAH.keberatan },
    putusan: { poin: skor.putusan, maks: MAKS_LANGKAH.putusan },
    penanganan: { poin: skor.penanganan, maks: MAKS_LANGKAH.pesan },
  };
  const namaTab: Record<TabRincian, string> = { bukti: t('investigasi.hasil.bukti'), putusan: t('investigasi.hasil.putusan'), penanganan: t('investigasi.rincian.tab.penanganan') };
  const babak = rincianBabak(konfig, h.babak);
  /** Babak dengan poin hilang terbanyak (seri = yang lebih awal): tombol latihannya yang utama bila dua babak sama-sama kurang. */
  let babakLemah: string | null = null;
  let hilangLemah = 0;
  for (const x of babak) if (x.maks - x.poin > hilangLemah) { hilangLemah = x.maks - x.poin; babakLemah = x.id; }
  const namaPutusan = konfig.putusanLayar?.nama ? tx(konfig.putusanLayar.nama[h.putusan]) : t(`investigasi.putusan.${h.putusan}`);
  const tombolLatih = (titik: TitikLatihan, utama = true) => (
    <button type="button" className={(utama ? 'primary-action' : 'akh-kedua') + ' iv-tombol'} data-latih-bagian={titik.langkah} data-latih-babak={titik.langkah === 'keberatan' ? titik.babak : undefined}
      onClick={() => { playSfx('konfirmasi'); onLatih(titik); }}>{t('investigasi.rincian.latih')}</button>
  );
  const { poin, maks } = nilai[kini];
  const hilang = maks - poin;
  /** Kasus ber-panel dengan nilai yang sama di tiap babak: nilainya ditulis SEKALI di kaki halaman, bukan di tiap babak. */
  const skala = (id: string) => ({ a: poinBabak(konfig, id, 'first'), b: poinBabak(konfig, id, 'second'), c: poinBabak(konfig, id, 'guided') });
  const skalaSama = babak.length > 1 && babak.every((x) => JSON.stringify(skala(x.id)) === JSON.stringify(skala(babak[0]!.id)));
  const terbaikBagian = terbaik?.rinci ? { bukti: terbaik.rinci.bukti, putusan: terbaik.rinci.putusan, penanganan: terbaik.rinci.penanganan }[kini] : null;
  return (
    <div className="iv-rincian" data-rincian-nilai-isi="" data-halaman={kini}>
      <div className="iv-tab" role="tablist">
        {(['bukti', 'putusan', 'penanganan'] as const).map((x) => (
          <button key={x} type="button" role="tab" id={`iv-rincian-tab-${x}`} aria-selected={x === kini} aria-controls="iv-rincian-panel" className="iv-tab-tombol" data-tab-rincian={x}
            data-kurang={nilai[x].poin < nilai[x].maks ? '' : undefined} onClick={() => { playSfx('kertas'); setKini(x); }}>
            <span>{namaTab[x]}</span><small>{nilai[x].poin} / {nilai[x].maks}</small>
          </button>
        ))}
      </div>
      <section id="iv-rincian-panel" className="iv-rincian-kartu" role="tabpanel" aria-labelledby={`iv-rincian-tab-${kini}`}>
        <p className="iv-rincian-kepala"><b>{t(`investigasi.hasil.${kini}`)}</b><span className="iv-rincian-angka"><b>{poin}</b> / {maks}</span></p>
        <p className="iv-rincian-status" data-status={hilang > 0 ? 'kurang' : 'penuh'}>{hilang > 0 ? t('investigasi.rincian.hilang', { n: hilang }) : t('investigasi.rincian.penuh')}</p>
        {terbaik ? (
          <p className="iv-rincian-terbaik" data-terbaik-rincian={terbaikBagian !== null ? 'rinci' : 'total'}>
            {terbaikBagian !== null ? t('investigasi.rincian.terbaikBagian', { n: terbaikBagian, maks }) : t('investigasi.rincian.terbaik', { n: terbaik.total })}
          </p>
        ) : null}
        {kini === 'bukti' ? babak.map((x) => (
          <div key={x.id} className="iv-rincian-babak" data-babak={x.id} data-hasil={x.hasil}>
            {/* kasus ber-panel: nama babak, lalu SATU baris hasil + poin babak itu; kasus satu babak: kalimat utuh */}
            {konfig.panel ? <p className="iv-rincian-nama"><b>{tx(kunci(konfig, `panel.${x.id}.nama`))}</b></p> : null}
            {konfig.panel
              ? <p className="iv-rincian-sebab" data-baris-babak=""><span>{t(`investigasi.rincian.babak.${x.hasil}`)}</span><b>{x.poin} / {x.maks}</b></p>
              : <p className="iv-rincian-sebab">{t(`investigasi.rincian.bukti.${x.hasil}`)}</p>}
            {skalaSama ? null : <p className="iv-rincian-skala">{t('investigasi.rincian.bukti.skala', skala(x.id))}</p>}
            {x.poin < x.maks ? tombolLatih({ langkah: 'keberatan', babak: x.id, poin: x.poin, maks: x.maks }, x.id === babakLemah) : null}
          </div>
        )) : kini === 'putusan' ? (
          <>
            <p className="iv-rincian-nama" data-putusan={h.putusan}><b>{t('investigasi.rincian.putusan.pilih', { nama: namaPutusan })}</b></p>
            <p className="iv-rincian-sebab">{tx(kunci(konfig, `putusan.${h.putusan}.1`))}</p>
            {hilang > 0 ? tombolLatih({ langkah: 'putusan', poin, maks }) : null}
          </>
        ) : (
          <>
            <p className="iv-rincian-sebab" data-pesan={h.pesan}>{h.pesan === 'baik' ? t('investigasi.rincian.pesan.baik') : tx(kunci(konfig, `pesan.${h.pesan}.2`))}</p>
            {hilang > 0 ? tombolLatih({ langkah: 'pesan', poin, maks }) : null}
          </>
        )}
      </section>
      {kini === 'bukti' && skalaSama ? <p className="iv-rincian-skala">{t('investigasi.rincian.bukti.skalaBabak', skala(babak[0]!.id))}</p> : null}
      {hilang > 0 ? <p className="iv-rincian-ket">{t('investigasi.rincian.latihKet')}</p> : null}
    </div>
  );
}

type TabArsip = 'garis' | 'keterangan' | 'pesan';

/**
 * T-115: isi lembar "Arsip kasus", BERHALAMAN supaya tidak ada yang menggulir: tab "Garis waktu" (kasus yang punya), "Keterangan"
 * (pernyataan yang dikoreksi, satu per tampilan) dan "Pesan" (pesan pada permainan terbaik). Satu halaman per tampilan; tab hanya
 * ada untuk bagian yang memang ada. Tombol tutup = tombol lembar itu sendiri.
 */
function ArsipKasus({ konfig, dikoreksi, pesan, tx, awal }: {
  konfig: KonfigInvestigasi;
  dikoreksi: { pernyataan: Pernyataan[]; koreksi: KoreksiPernyataan[] } | null;
  pesan: { id: string; teks: string } | null;
  tx: Tx;
  awal?: TabArsip;
}) {
  const tab: TabArsip[] = [...(konfig.arsip ? ['garis' as const] : []), ...(dikoreksi ? ['keterangan' as const] : []), ...(pesan ? ['pesan' as const] : [])];
  const [pilih, setPilih] = useState<TabArsip | undefined>(awal);
  const kini = pilih && tab.includes(pilih) ? pilih : tab[0];
  const nama: Record<TabArsip, string> = { garis: t('investigasi.arsip.garis'), keterangan: t('investigasi.keterangan'), pesan: t('investigasi.arsip.pesan') };
  return (
    <div className="iv-arsip" data-arsip-kasus-isi="" data-halaman={kini}>
      {tab.length > 1 ? (
        <div className="iv-tab" role="tablist">
          {tab.map((x) => <button key={x} type="button" role="tab" aria-selected={x === kini} className="iv-tab-tombol" data-tab-arsip={x} onClick={() => { playSfx('kertas'); setPilih(x); }}>{nama[x]}</button>)}
        </div>
      ) : null}
      {kini === 'garis' && konfig.arsip ? (
        <section className="iv-arsip-kartu" aria-labelledby="iv-arsip-garis">
          <h3 id="iv-arsip-garis">{tx(konfig.arsip.judul)}</h3>
          <ol className="iv-garis">
            {konfig.arsip.garis.map((k, i) => <li key={k} data-sorot={i === konfig.arsip?.sorot ? '' : undefined}>{tx(k)}</li>)}
          </ol>
        </section>
      ) : null}
      {kini === 'keterangan' && dikoreksi ? <BukuCatatan pernyataan={dikoreksi.pernyataan} bukti={[]} halaman="keterangan" satu tanpaPensil koreksi={dikoreksi.koreksi} /> : null}
      {kini === 'pesan' && pesan ? (
        <section className="iv-arsip-kartu" aria-labelledby="iv-arsip-pesan">
          <h3 id="iv-arsip-pesan">{tx(konfig.arsip?.pesan ?? 'inv.lagi.langkah.pesan')}</h3>
          <p className="iv-arsip-pesan" data-pesan={pesan.id}>{pesan.teks}</p>
        </section>
      ) : null}
    </div>
  );
}

/**
 * Buku catatan (Menu): pernyataan yang sudah disemat + kartu bukti yang sudah terkumpul (+ T-087: baris koreksi).
 * T-115: BERHALAMAN supaya muat tanpa gulir di lembar: tab "Keterangan n" (satu pernyataan per tampilan, keping polaroid
 * memilihnya; catatan "Tanya lebih lanjut" dibuka dengan satu tombol) dan tab "Bukti n" (slip bukti).
 */
export function IsiBukuCatatan({ ep, state, tx }: { ep: Episode; state: StateCerita; tx: Tx }) {
  const dikoreksi = koreksiBuku(ep, state, tx);
  // T-106: "Tanya lebih lanjut" yang sudah dibuka tertulis di bawah pernyataan saksinya (sumbernya), bisa dibaca ulang kapan saja.
  // T-127: pertanyaan yang BERGUNA membawa tanda jeli (label kamus); pertanyaan lain tetap tertulis tanpa tanda.
  const tanya = tekananTerbuka(ep, state).map((x) => ({ id: x.pernyataan.id, tanya: tanpaAwalan(tx(x.press.questionKey)), jawab: tx(x.press.answerKey), ...(x.press.berguna ? { jeli: t('investigasi.jeli.tanda') } : {}) }));
  const pernyataan = pernyataanTercatat(ep, state);
  const bukti = buktiTerkumpul(ep, state);
  // T-127: halaman ketiga "Temuan" hanya untuk kasus babak 2 (punya tafsir atau temuan berpasangan); kasus lain tetap dua tab.
  const konfig = ep.investigasi;
  const adaTemuan = !!konfig && (!!konfig.tafsir?.length || !!konfig.keberatan.pasangan);
  const temuan = adaTemuan ? temuanKasus(ep, state) : [];
  type Hal = 'keterangan' | 'bukti' | 'temuan';
  const [halaman, setHalaman] = useState<Hal>('keterangan');
  const NAMA: Record<Hal, string> = { keterangan: t('investigasi.keterangan'), bukti: t('investigasi.bukti'), temuan: t('investigasi.temuan.tab') };
  const tab = (h: Hal, n: number) => (
    <button type="button" role="tab" aria-selected={halaman === h} className="iv-tab-tombol" data-tab-buku={h} onClick={() => { playSfx('kertas'); setHalaman(h); }}>
      {NAMA[h]}<span className="iv-hitung">{n}</span>
    </button>
  );
  return (
    <PenyediaTeksInvestigasi value={tx}>
      <div className="iv-buku-lembar" data-buku-lembar={halaman}>
        <div className="iv-tab" role="tablist" data-tiga={adaTemuan ? '' : undefined}>{tab('keterangan', pernyataan.length)}{tab('bukti', bukti.length)}{adaTemuan ? tab('temuan', temuan.length) : null}</div>
        {halaman === 'temuan'
          ? <DaftarTemuan temuan={temuan.map((x) => ({ id: x.id, teks: tx(x.teks), mapan: x.mapan }))} />
          : <BukuCatatan pernyataan={pernyataan} bukti={bukti} halaman={halaman} satu tanpaPensil koreksi={dikoreksi?.koreksi} tanya={tanya} temuan={slipTemuan(ep, state, tx)} />}
      </div>
    </PenyediaTeksInvestigasi>
  );
}

/**
 * T-127 halaman "Temuan" buku catatan: TAFSIRAN pemain (belum dikonfirmasi; pensil) dan TEMUAN yang sudah terbukti (centang) di dua
 * bagian terpisah, supaya bacaan pemain tidak pernah tampil sebagai fakta sebelum saksinya mengoreksi catatannya.
 */
function DaftarTemuan({ temuan }: { temuan: { id: string; teks: string; mapan: boolean }[] }) {
  const bagian = (mapan: boolean) => temuan.filter((x) => x.mapan === mapan);
  if (!temuan.length) return <p className="iv-temuan-kosong" data-temuan-kosong="">{t('investigasi.temuan.kosong')}</p>;
  return (
    <div className="iv-temuan" data-daftar-temuan="">
      {([false, true] as const).map((mapan) => (bagian(mapan).length ? (
        <section key={String(mapan)} className="iv-temuan-bagian" data-temuan={mapan ? 'mapan' : 'tafsir'} aria-labelledby={`iv-temuan-${mapan ? 'mapan' : 'tafsir'}`}>
          <h3 id={`iv-temuan-${mapan ? 'mapan' : 'tafsir'}`}><span aria-hidden="true">{mapan ? '✓' : '✎'}</span>{t(mapan ? 'investigasi.temuan.judulMapan' : 'investigasi.temuan.judulTafsir')}</h3>
          <ul>{bagian(mapan).map((x) => <li key={x.id} data-temuan-id={x.id}>{x.teks}</li>)}</ul>
        </section>
      ) : null))}
    </div>
  );
}
