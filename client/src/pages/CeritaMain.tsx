/**
 * PEMAIN EPISODE MODE CERITA (visual novel). Alamat: /cerita/:episode. Kontrak: docs/rancangan-mode-cerita.md bagian 4.
 *
 * - Tanpa profil -> /kenalan?lanjut=/cerita/<id>; id tak dikenal -> /cerita.
 * - Progres: muatProgres sekali saat dibuka ('lanjut' dilanjutkan, 'baru' = stateAwal, 'tidakCocok' = dialog
 *   pemulihan: Mulai ulang (progres lama diarsipkan) / Kembali ke daftar; tidak ada yang dihapus diam-diam).
 *   Setiap aksi sah dijalankan lewat reducer mesin lalu disimpan (useCerita). Tidak ada aksi otomatis saat mount.
 * - Tiga tampilan, satu per satu (HP tidak ditumpuk): 'dialog' (panggung + kotak dialog + pilihan),
 *   'aktivitas' (MissionPlay, dimuat lazy bersama Phaser; chunk gagal -> BatasGagal: pesan + muat ulang),
 *   'akhir' (satu kartu hasil, LayarAkhir; bagian 11.1).
 * - Setelah memilih (bagian 11.3): TANPA gema "Kamu: …" (pilihan tetap di Riwayat). Baris reaksi tokoh, lalu
 *   setelah kalimatnya utuh SATU kalimat ajar (alasan) bergaya netral; live region membacakan keduanya.
 * - Istilah di tempat (bagian 11.4): baris dengan `istilah` memberi tombol "Apa itu …?" di kotak dialog.
 * - Petunjuk "Ketuk kotak ini…" tampil SEKALI per perangkat (localStorage 'raksa:cerita:petunjuk'; penyimpanan
 *   gagal = tampil di baris pertama episode seperti dulu), selanjutnya ada di tombol Bantuan.
 * - Tombol Lanjut digulir ke dalam layar seperlunya setiap baris berganti; Enter yang ditahan tidak melompati
 *   baris, dan aktivasi keyboard sesaat setelah memilih ditahan agar reaksi & alasan tidak terlewat.
 * - Semua teks episode dari KUNCI (teksCerita) dalam bahasa aktif: ganti bahasa tidak mengubah state.
 * - Header ringkas: kembali, "Bagian n/5 · judul bab", bahasa, suara; baris kedua: tujuan bab + Riwayat,
 *   Catatan kasus & Bantuan (Modal bersama: fokus terkunci, latar inert).
 * - Panggung v3 (docs/cerita/ADEGAN-AUTO1.md): komposisi dari adeganKini(ep, state) (murni); komposisi sesudah aksi
 *   berikutnya (pratinjau reducer, tidak ditulis) diberikan ke panggung untuk memanaskan cache seni saat idle.
 *   ?adegan=ringan|penuh disimpan saat halaman dibuka (juga bila dialihkan ke /kenalan). Lanjut/Enter/ketuk
 *   saat panggung bergerak = gerak diselesaikan ke komposisi akhir LALU semantik Lanjut yang sama seperti biasa
 *   (ketukan pertama melengkapi kalimat, berikutnya maju): tidak ada ketukan tambahan, tidak ada maju ganda.
 *   Membuka Riwayat/Catatan/Bantuan juga menyelesaikan gerak. Ingatan aksi panggung (`sesiPanggung`) milik
 *   halaman ini, bukan state cerita, sehingga aksi tidak diputar ulang saat panggung dipasang ulang.
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import type { Bahasa } from '@shared/bahasa';
import type { MissionAnswer } from '@shared/types';
import { playSfx } from '../audio/audio';
import { Merek } from '../components/Merek';
import { PilihBahasa } from '../components/PilihBahasa';
import { Arrow, PlayerShell, SoundButton } from '../components/PlayerShell';
import { useReducedMotion } from '../hooks';
import { t, useBahasa } from '../i18n';
import { useProfil, type Profil } from '../state/profil';
import { useHalaman } from '../ui/halaman';
import { Memuat, Modal } from '../ui/kit';
import { adaDialogTerbuka } from '../ui/modal';
import { cariEpisode } from '../cerita/episode';
import {
  babKini, bisaLanjut, nodeKini, pilihanTersedia, semuaBarisTampil, suasanaNasabah,
} from '../cerita/mesin';
import { akhirDitemukan, berlanggananCerita, versiPenyimpananCerita } from '../cerita/simpan';
import { teksCerita } from '../cerita/teks';
import type { Episode, HasilMuat, IdBab, KunciTeks, NodeAktivitas, StateCerita } from '../cerita/tipe';
import { CatatanAlasan, IkonAlat, IkonInfo, infoPembicara, labelPerasaan, sela, selaPembicara, tahanUlang } from '../cerita/ui/bagian';
import { BatasGagal } from '../cerita/ui/BatasGagal';
import { IsiCatatanKasus } from '../cerita/ui/CatatanKasus';
import { KotakDialog, istilahBaris } from '../cerita/ui/KotakDialog';
import { LayarAkhir } from '../cerita/ui/LayarAkhir';
import { adeganKini } from '../cerita/ui/adegan';
import { buatSesiPanggung, Panggung, simpanModeAdegan, type KendaliPanggung } from '../cerita/ui/Panggung';
import { komposisiBerikut } from '../cerita/ui/panggung/panas';
import { IsiRiwayat } from '../cerita/ui/Riwayat';
import { barisKini, ekspresiNasabah, kunciBaris } from '../cerita/ui/tampilan';
import { useCerita, type KendaliCerita } from '../cerita/ui/useCerita';
import { KartuDokumen } from '../cerita/ui/KartuDokumen';
import { komposisiLatar as hitungKomposisiLatar, nasabahDiPanggung } from '../cerita/ui/latar/komposisi';
import { PanggungLatar } from '../cerita/ui/latar/PanggungLatar';
import { PemainHP } from '../cerita/hp/PemainHP';
import '../cerita/ui/cerita.css';

/**
 * Aktivitas (MissionPlay + adegan 2D + engine) hanya diunduh saat dibutuhkan. Chunk yang gagal diunduh
 * ditangkap BatasGagal (pesan + muat ulang; progres sudah tersimpan), bukan layar putih.
 */
const muatAktivitas = () => import('../cerita/ui/Aktivitas');
const AktivitasCerita = lazy(muatAktivitas);

/**
 * Setelah memilih, aktivasi LEWAT KEYBOARD berikutnya (Enter/Spasi) baru diterima sesudah jeda ini, supaya
 * baris reaksi nasabah dan alasan perubahan suasana tidak terlewat oleh tekanan beruntun. Ketukan/klik tidak
 * ditahan (pemain melihat apa yang diketuknya).
 */
const JEDA_KEYBOARD_SETELAH_PILIH_MS = 400;
/** Ketukan pointer ke kotak dialog sesudah "Lewati pembuka" yang ditelan (ketuk ganda), md. */
const JEDA_KLIK_SETELAH_LEWATI_MS = 500;
/** Jarak tombol Lanjut dari tepi bawah layar saat digulir agar terlihat. */
const RUANG_BAWAH = 12;

/** Penanda perangkat: petunjuk "Ketuk kotak ini…" sudah pernah tampil (nilai apa pun = sudah). */
const KUNCI_PETUNJUK = 'raksa:cerita:petunjuk';
/** true = sudah pernah tampil; false = belum; null = penyimpanan tidak bisa dibaca. */
function petunjukSudahTampil(): boolean | null {
  try { return window.localStorage.getItem(KUNCI_PETUNJUK) !== null; } catch { return null; }
}
/** Mencatat petunjuk sudah tampil; false bila penyimpanan menolak. */
function catatPetunjukTampil(): boolean {
  try { window.localStorage.setItem(KUNCI_PETUNJUK, '1'); return true; } catch { return false; }
}


export default function CeritaMain() {
  const { episode } = useParams();
  const { profil } = useProfil();
  useBahasa();
  // ?adegan=ringan|penuh disimpan SEKALI saat halaman dibuka, sebelum pengalihan ke /kenalan yang membuang query.
  useState(simpanModeAdegan);
  const ep = cariEpisode(episode);
  if (!profil) return <Navigate to={'/kenalan?lanjut=/cerita/' + encodeURIComponent(episode ?? '')} replace />;
  if (!ep) return <Navigate to="/cerita" replace />;
  return <SesiCerita key={ep.id} ep={ep} profilAwal={profil} />;
}

function SesiCerita({ ep, profilAwal }: { ep: Episode; profilAwal: Profil }) {
  const { bahasa } = useBahasa();
  // Dibaca sekali: tampilan & nama tidak berubah di tengah episode (look stabil untuk adegan 2D).
  const [profil] = useState(profilAwal);
  const nama = profil.nickname;
  const kendali = useCerita(ep);
  const tx = useCallback((k: KunciTeks) => teksCerita(ep, k, bahasa, { nama }), [ep, bahasa, nama]);
  const txParam = useCallback((k: KunciTeks, param?: Record<string, string | number>) => teksCerita(ep, k, bahasa, { nama, ...param }), [ep, bahasa, nama]);

  if (!kendali.state) return <LayarPemulihan ep={ep} muat={kendali.muat} tx={tx} onMulai={kendali.mulaiDariAwal} />;
  // Episode mobile-first (Episode 2): pemain HP (cerita/hp). Episode lain: halaman cerita standar di bawah.
  if (ep.antarmuka === 'hp') return <PemainHP ep={ep} state={kendali.state} kendali={kendali} profil={profil} bahasa={bahasa} tx={txParam} />;
  return <PemainCerita ep={ep} state={kendali.state} kendali={kendali} profil={profil} bahasa={bahasa} tx={tx} />;
}

// ------------------------------------------------------------------ pemulihan progres

function LayarPemulihan({ ep, muat, tx, onMulai }: { ep: Episode; muat: HasilMuat; tx: (k: KunciTeks) => string; onMulai: () => void }) {
  const nav = useNavigate();
  const alasan = muat.status === 'tidakCocok' ? muat.alasan : 'rusak';
  const kembali = () => nav('/cerita');
  return (
    <PlayerShell back="/cerita" label={t('cerita.labelHub')} className="cer-layar">
      <main className="cer-pulih">
        <h1>{tx(ep.judul)}</h1>
        <p>{t(`cerita.pulih.${alasan}`)}</p>
        <div className="cer-pulih-aksi">
          <button type="button" className="primary-action" onClick={onMulai}>{t('cerita.pulihMulai')} <Arrow /></button>
          <Link className="cer-tombol-garis" to="/cerita">{t('cerita.pulihKembali')}</Link>
        </div>
      </main>
      <Modal
        judul={t('cerita.pulihJudul')}
        onTutup={kembali}
        aksi={<>
          <button type="button" className="btn btn-netral" onClick={kembali}>{t('cerita.pulihKembali')}</button>
          <button type="button" className="btn btn-utama" onClick={onMulai}>{t('cerita.pulihMulai')}</button>
        </>}
      >
        <p>{t(`cerita.pulih.${alasan}`)}</p>
        <p className="kecil">{t('cerita.pulihArsip')}</p>
      </Modal>
    </PlayerShell>
  );
}

// ------------------------------------------------------------------ pemain

type Tampilan = 'dialog' | 'aktivitas' | 'akhir';

function PemainCerita({ ep, state, kendali, profil, bahasa, tx }: {
  ep: Episode;
  state: StateCerita;
  kendali: KendaliCerita;
  profil: Profil;
  bahasa: Bahasa;
  tx: (k: KunciTeks) => string;
}) {
  const { kirim } = kendali;
  const reduced = useReducedMotion();
  const namaPemain = profil.nickname;
  const look = profil.look;
  useSyncExternalStore(berlanggananCerita, versiPenyimpananCerita, () => 0);

  const node = nodeKini(ep, state)!;
  const bab = babKini(ep, state);
  const kini = barisKini(ep, state);
  const lengkap = semuaBarisTampil(ep, state);
  // "Putaran" naik saat episode diulang, supaya baris pertama diketik lagi walau kuncinya sama.
  const [putaran, setPutaran] = useState(0);
  const kunci = kunciBaris(state) + '@' + putaran;
  const [selesaiKunci, setSelesaiKunci] = useState<string | null>(null);
  const selesai = reduced || selesaiKunci === kunci || !kini;
  // Layar akhir dibuka untuk BARIS ini (kunci baris + putaran), bukan untuk angka `langkah`: "Ulang episode"
  // mengembalikan langkah ke 0, sehingga jalur yang sama panjangnya berakhir di langkah yang sama lagi dan
  // baris epilog terakhir (pelajaran mentor) akan terlewat bila pembandingnya `langkah`.
  const [akhirDibuka, setAkhirDibuka] = useState<string | null>(() => (node.jenis === 'akhir' && lengkap ? kunci : null));
  const [dialog, setDialog] = useState<'riwayat' | 'catatan' | 'bantuan' | null>(null);

  const tampilan: Tampilan =
    node.jenis === 'aktivitas' && (state.umpanBalik || lengkap) ? 'aktivitas'
      : node.jenis === 'akhir' && lengkap && (akhirDibuka === kunci || !kini) ? 'akhir'
        : 'dialog';
  const pilihan = tampilan === 'dialog' && node.jenis === 'pilihan' && lengkap && selesai ? pilihanTersedia(ep, state) : [];

  // Judul tab "<judul episode> · Bagian n/5" (layar akhir: "<judul episode> · <judul akhir>"). Halaman ini tanpa
  // PlayerShell, jadi useHalaman dipanggil di sini: dibuka lewat "Mulai"/"Lanjutkan" (navigasi pengguna), fokus
  // pindah ke <h1> (sr-only) alih-alih jatuh ke <body>. Enter/Spasi dari <h1> tetap memajukan dialog (bukan kontrol).
  const infoAkhir = tampilan === 'akhir' && state.akhir ? ep.akhir[state.akhir] : undefined;
  const bagianJudul = infoAkhir ? tx(infoAkhir.judul) : bab ? t('cerita.bagian', { n: bab.nomor, total: bab.jumlah }) : '';
  useHalaman(bagianJudul ? `${tx(ep.judul)} · ${bagianJudul}` : tx(ep.judul));

  // ---- panggung v3: komposisi adegan (murni) + kendali gerak (hanya tampilan)
  const komposisi = useMemo(() => adeganKini(ep, state), [ep, state]);
  // Episode berpanggung latar (Episode 2): komposisi latar menggantikan panggung dunia Episode 1.
  const komposisiLatar = useMemo(() => (ep.latar ? hitungKomposisiLatar(ep, state) : null), [ep, state]);
  const panggung = useRef<KendaliPanggung | null>(null);
  // Sel baris kaki kotak dialog untuk tombol "Lewati pembuka" panggung (portal; v5.1: di luar gambar, di samping Lanjut).
  const [slotLewati, setSlotLewati] = useState<HTMLDivElement | null>(null);
  const [sesiPanggung] = useState(buatSesiPanggung);
  // Pratinjau murni komposisi sesudah aksi berikutnya (reducer mesin, tanpa menulis state): panggung memanaskan
  // cache seni tokohnya saat idle supaya ketukan berikutnya tidak menunggu generator (panas.ts).
  const berikut = useCallback(() => komposisiBerikut(ep, state), [ep, state]);

  // ---- aksi
  /** Waktu keputusan terakhir (lihat JEDA_KEYBOARD_SETELAH_PILIH_MS). */
  const pilihPada = useRef(-Infinity);
  /** Waktu Enter/Spasi terakhir ditekan/dilepas: klik tanpa pointer tepat sesudahnya = aktivasi keyboard. */
  const tombolPada = useRef(-Infinity);
  const maju = useCallback((dariKeyboard: boolean): boolean => {
    if (tampilan !== 'dialog') return false;
    // Tekanan beruntun sesaat setelah memilih: ditelan (dianggap sudah ditangani) supaya reaksi tidak terlewat.
    if (dariKeyboard && performance.now() - pilihPada.current < JEDA_KEYBOARD_SETELAH_PILIH_MS) return true;
    // Panggung sedang bergerak: selesaikan ke komposisi akhir, lalu semantik Lanjut yang sama (tanpa ketukan ekstra).
    panggung.current?.selesaikan();
    if (!selesai) { setSelesaiKunci(kunci); return true; }
    if (bisaLanjut(ep, state)) return kirim({ jenis: 'lanjut' });
    if (node.jenis === 'akhir' && lengkap) { setAkhirDibuka(kunci); return true; }
    return false;
  }, [tampilan, selesai, kunci, ep, state, kirim, node.jenis, lengkap]);
  const majuRef = useRef(maju);
  majuRef.current = maju;
  /**
   * Waktu "Lewati pembuka" terakhir diaktifkan (v5.1: tombol di baris kaki kotak dialog). Ketukan POINTER ke kotak
   * dialog sesaat sesudahnya (ketuk ganda: ketukan kedua jatuh ke baris kaki setelah tombol hilang) ditelan, jadi
   * lewati hanya menyelesaikan gambar dan tidak pernah sekaligus memajukan cerita. Keyboard tidak terpengaruh.
   */
  const lewatiPada = useRef(-Infinity);
  const catatLewati = useCallback(() => { lewatiPada.current = performance.now(); }, []);
  /** Klik pada kotak dialog / tombol Lanjut: `detail` 0 tepat setelah Enter/Spasi = dari keyboard. */
  const majuDariKlik = (detail: number) => {
    if (detail > 0 && performance.now() - lewatiPada.current < JEDA_KLIK_SETELAH_LEWATI_MS) return;
    maju(detail === 0 && performance.now() - tombolPada.current < 250);
  };

  const pilih = (id: string) => {
    if (kirim({ jenis: 'pilih', node: state.node, pilihan: id })) {
      pilihPada.current = performance.now();
      playSfx('pilih');
    }
  };
  // Aktivitas berakibat langsung = sama dengan memilih: Enter beruntun sesaat sesudahnya tidak melompati akibatnya.
  const kirimAktivitas = useCallback((jawaban: MissionAnswer) => {
    if (kirim({ jenis: 'aktivitas', node: state.node, jawaban })) pilihPada.current = performance.now();
  }, [kirim, state.node]);
  const lanjutAktivitas = useCallback(() => { kirim({ jenis: 'lanjut' }); }, [kirim]);
  const ulangBab = (b: IdBab) => { kirim({ jenis: 'ulangBab', bab: b }); };
  const ulangEpisode = () => { kendali.mulaiDariAwal(); setPutaran((p) => p + 1); setAkhirDibuka(null); };
  const tandaiSelesai = useCallback(() => setSelesaiKunci(kunci), [kunci]);

  // Enter / Spasi di luar kontrol (fokus di halaman) = sama dengan mengetuk kotak dialog. Tombol yang ditahan
  // (autorepeat) diabaikan di sini; di tombol Lanjut & pilihan, onKeyDown `tahanUlang` mencegah klik berulangnya.
  useEffect(() => {
    const catat = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') tombolPada.current = performance.now(); };
    const f = (e: KeyboardEvent) => {
      if ((e.key !== 'Enter' && e.key !== ' ') || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (adaDialogTerbuka()) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (el && el !== document.body && el.closest('button, a, input, select, textarea, summary, [role="button"], [contenteditable="true"], .mdl-latar')) return;
      if (majuRef.current(true)) e.preventDefault();
    };
    window.addEventListener('keydown', catat, true);
    window.addEventListener('keyup', catat, true);
    window.addEventListener('keydown', f);
    return () => {
      window.removeEventListener('keydown', catat, true);
      window.removeEventListener('keyup', catat, true);
      window.removeEventListener('keydown', f);
    };
  }, []);

  // Riwayat / Catatan / Bantuan dibuka saat panggung bergerak: gerak diselesaikan (tidak diputar ulang saat ditutup).
  useEffect(() => { if (dialog) panggung.current?.selesaikan(); }, [dialog]);

  // Unduh chunk aktivitas lebih awal bila aktivitas tinggal satu langkah lagi (bukan engine-nya).
  const dekatAktivitas = node.jenis === 'aktivitas' || (node.jenis === 'dialog' && ep.node[node.lanjut]?.jenis === 'aktivitas');
  useEffect(() => { if (dekatAktivitas) void muatAktivitas().catch(() => undefined); }, [dekatAktivitas]);

  // ---- fokus & gulir saat tampilan berganti (tidak saat halaman baru dibuka)
  const mainRef = useRef<HTMLElement>(null);
  const pilihanRef = useRef<HTMLElement>(null);
  const tanda = `${tampilan}|${state.node}|${state.langkah}|${pilihan.length > 0 ? 'p' : ''}`;
  const tandaAwal = useRef<string | null>(tanda);
  const tampilanLama = useRef(tampilan);
  const nodeLama = useRef(state.node);
  useEffect(() => {
    if (tanda === tandaAwal.current) return;
    tandaAwal.current = null;
    const gerak: ScrollBehavior = reduced ? 'auto' : 'smooth';
    const gantiLayar = tampilanLama.current !== tampilan || nodeLama.current !== state.node;
    tampilanLama.current = tampilan;
    nodeLama.current = state.node;
    const id = requestAnimationFrame(() => {
      if (gantiLayar && window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'auto' });
      else if (pilihan.length && pilihanRef.current) pilihanRef.current.scrollIntoView({ block: 'nearest', behavior: gerak });
      // Fokus hilang (tombol yang ditekan sudah tidak ada): pindahkan ke tujuan wajar tampilan ini.
      const aktif = document.activeElement;
      if (adaDialogTerbuka() || (aktif && aktif !== document.body && document.contains(aktif))) return;
      mainRef.current?.querySelector<HTMLElement>('[data-cer-fokus]')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanda]);

  // ---- data tampilan
  const nasabah = ep.pemeran[ep.nasabah];
  const namaNasabah = nasabah ? tx(nasabah.nama) : '';
  const mentor = ep.pemeran.missRaksa;
  const namaMentor = mentor ? tx(mentor.nama) : '';
  const pembicara = kini ? infoPembicara(ep, kini.siapa, tx, namaPemain) : null;
  // Satu sumber kebenaran untuk suasana di panggung: wajah yang tampil (komposisi adegan), dan labelnya ditulis
  // dari wajah itu. Potret kotak dialog tetap memakai ekspresi baris / suasana seperti sebelumnya.
  const ekspresiPanggung = ekspresiNasabah(ep, state);
  // Panggung latar: wajah nasabah yang tampil (di lokasi atau di layar ponsel), sama dengan sprite-nya.
  const wajahLatar = komposisiLatar ? nasabahDiPanggung(ep, komposisiLatar)?.ekspresi : undefined;
  // Episode berlabel status: label = pita status kumulatif (tidak ikut berganti dengan ekspresi sesaat di wajah).
  const labelStatus = ep.labelSuasana === 'status';
  const labelPanggung = labelStatus
    ? tx(suasanaNasabah(ep, state).label)
    : labelPerasaan(ep, wajahLatar ?? komposisi.nasabah?.ekspresi ?? ekspresiPanggung, tx);
  const namaPemeran = useCallback((id: string) => (Object.prototype.hasOwnProperty.call(ep.pemeran, id) ? tx(ep.pemeran[id]!.nama) : id), [ep, tx]);
  // Naskah episode belum tersedia di bahasa aktif: teks Indonesia + catatan (tidak diterjemahkan diam-diam).
  const bahasaBelum = !!ep.bahasa && !ep.bahasa.includes(bahasa);
  // Baris pertama sesudah memilih = reaksi tokoh; kalimat ajar (alasan) ikut tampil di bawahnya, netral.
  const barisPertama = state.baris <= 1;
  const terakhir = tampilan === 'dialog' && barisPertama ? state.terakhir : null;
  const alasan = terakhir?.alasan ? { arah: terakhir.arah ?? 'tetap', teks: tx(terakhir.alasan) } : null;
  const teksKini = kini ? tx(kini.teks) : '';
  const umumkan = [
    pembicara && pembicara.nama ? `${pembicara.nama}${selaPembicara()}${teksKini}` : teksKini,
    alasan ? alasan.teks : '',
  ].filter(Boolean).join(' ');
  const istilah = tampilan === 'dialog' ? istilahBaris(ep, kini, tx) : [];
  const labelTombol = pilihan.length ? null
    : node.jenis === 'pilihan' && lengkap && selesai ? null
      : node.jenis === 'akhir' && lengkap && selesai ? t('cerita.lihatRingkasan')
        : t('cerita.lanjut');
  const awalEpisode = state.langkah === 0 && state.node === ep.mulai && state.baris <= 1;

  // Petunjuk penggunaan pertama: SEKALI per perangkat, di baris pertama episode. Dicatat begitu tampil, tetapi
  // tetap terlihat sampai pemain maju dari baris itu (dan tidak muncul lagi bila episode diulang di sesi ini).
  // Penyimpanan tidak bisa dibaca/ditulis (null) = tampil di baris pertama episode setiap kali, seperti dulu.
  const [petunjukTampil, setPetunjukTampil] = useState(petunjukSudahTampil);
  const petunjukBaruTampil = useRef(false);
  const adaPetunjuk = tampilan === 'dialog' && awalEpisode && petunjukTampil !== true;
  useEffect(() => {
    if (!adaPetunjuk || petunjukTampil !== false || petunjukBaruTampil.current) return;
    if (catatPetunjukTampil()) petunjukBaruTampil.current = true;
    else setPetunjukTampil(null);
  }, [adaPetunjuk, petunjukTampil]);
  useEffect(() => {
    if (!awalEpisode && petunjukBaruTampil.current) setPetunjukTampil(true);
  }, [awalEpisode]);

  // Tombol Lanjut selalu terjangkau: setelah baris berganti, atau setelah kalimat utuh (kalimat ajar / tombol
  // "Apa itu …?" muncul dan mendorong tombol ke bawah), halaman digulir SEPERLUNYA bila tombol berada di bawah tepi layar
  // (HP mendatar, teks panjang/bahasa lain). Dijalankan setelah efek gulir-ke-atas saat node berganti.
  const adaLanjut = tampilan === 'dialog' && labelTombol !== null;
  useEffect(() => {
    if (!adaLanjut) return;
    const id = requestAnimationFrame(() => {
      if (adaDialogTerbuka()) return;
      const b = mainRef.current?.querySelector<HTMLElement>('.cer-lanjut');
      if (!b) return;
      const batas = window.innerHeight - RUANG_BAWAH;
      const bawah = b.getBoundingClientRect().bottom;
      if (bawah > batas) window.scrollBy({ top: bawah - batas, behavior: reduced ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(id);
  }, [kunci, selesai, adaLanjut, reduced]);

  return (
    <div className="player-ui cer-layar" data-tampilan={tampilan}>
      <header className="player-header cer-kepala">
        <div className="player-header-kiri">
          <Merek className="mrk-lebar-saja" />
          <Link className="back-link cer-kembali" to="/cerita">
            <Arrow back /><span className="cer-kembali-teks">{t('cerita.kembaliDaftar')}</span>
          </Link>
        </div>
        <div className="cer-kepala-bab">
          <h1 className="sr-only">{tx(ep.judul)}</h1>
          {bab ? (
            <p className="cer-bab">
              <span className="cer-bab-no">{t('cerita.bagian', { n: bab.nomor, total: bab.jumlah })}</span>
              <span className="cer-bab-sela" aria-hidden="true"> · </span>
              <b className="cer-bab-judul">{tx(bab.bab.judul)}</b>
            </p>
          ) : null}
        </div>
        <div className="player-header-right"><PilihBahasa /><SoundButton /></div>
      </header>

      <div className="cer-bilah">
        {bab && tampilan !== 'akhir' ? (
          <p className="cer-tujuan"><b>{t('cerita.tujuan')}</b>{sela()}{tx(bab.bab.tujuan)}</p>
        ) : <p className="cer-tujuan"><b>{t('cerita.akhirLabel')}</b></p>}
        <div className="cer-alat">
          <button type="button" className="cer-alat-tombol" aria-haspopup="dialog" onClick={() => setDialog('riwayat')}>
            <IkonAlat jenis="riwayat" /><span>{t('cerita.riwayat')}</span>
          </button>
          <button type="button" className="cer-alat-tombol" aria-haspopup="dialog" onClick={() => setDialog('catatan')}>
            <IkonAlat jenis="catatan" /><span>{t('cerita.catatanKasus')}</span>
          </button>
          <button type="button" className="cer-alat-tombol" aria-haspopup="dialog" onClick={() => setDialog('bantuan')}>
            <IkonAlat jenis="bantuan" /><span>{t('cerita.bantuan')}</span>
          </button>
        </div>
      </div>

      <main ref={mainRef} className="cer-main" data-tampilan={tampilan} data-node={state.node}>
        {tampilan === 'dialog' ? (
          <>
            {komposisiLatar ? (
              <PanggungLatar ep={ep} komposisi={komposisiLatar} tx={tx} nama={namaPemeran} suasana={labelPanggung} status={labelStatus} />
            ) : (
              <Panggung
                ep={ep}
                komposisi={komposisi}
                mengetik={!selesai}
                namaMentor={namaMentor}
                namaNasabah={namaNasabah}
                suasana={labelPanggung}
                sesi={sesiPanggung}
                kendali={panggung}
                berikut={berikut}
                slotLewati={slotLewati}
                onLewati={catatLewati}
              />
            )}
            <div className="cer-cerita">
              {bahasaBelum ? <p className="cer-bahasa-belum" role="note">{t('cerita.bahasaBelumTersedia')}</p> : null}
              {kini && pembicara ? (
                <KotakDialog
                  kunci={kunci}
                  pembicara={pembicara}
                  ekspresi={kini.siapa === ep.nasabah ? kini.ekspresi ?? ekspresiPanggung : kini.ekspresi}
                  look={look}
                  teks={teksKini}
                  selesai={selesai}
                  mati={reduced}
                  onSelesai={tandaiSelesai}
                  onMaju={majuDariKlik}
                  labelTombol={labelTombol}
                  umumkan={umumkan}
                  sisipan={alasan && selesai ? <CatatanAlasan arah={alasan.arah} teks={alasan.teks} className="cer-alasan-dialog" /> : null}
                  petunjuk={adaPetunjuk ? t('cerita.ketukLanjut') : null}
                  istilah={istilah}
                  slotLewati={setSlotLewati}
                />
              ) : null}
              {pilihan.length && node.jenis === 'pilihan' ? (
                <section ref={pilihanRef} className="cer-pilihan" aria-labelledby="cer-tanya">
                  <h2 id="cer-tanya" className="cer-tanya" tabIndex={-1} data-cer-fokus="">{tx(node.tanya)}</h2>
                  {/* Fakta yang perlu dibaca sebelum menjawab: SESUDAH pertanyaan (yang menerima fokus), sebelum pilihan,
                      jadi pembaca layar & keyboard melewatinya dalam urutan baca yang sama dengan mata. */}
                  {node.dokumen && ep.dokumen?.[node.dokumen] ? <KartuDokumen dokumen={ep.dokumen[node.dokumen]!} id={node.dokumen} tx={tx} /> : null}
                  <div className="cer-pilihan-daftar" role="group" aria-label={t('cerita.pilihanAria')} data-jumlah={pilihan.length}>
                    {pilihan.map((p) => (
                      <button key={p.id} type="button" className="cer-opsi" data-pilihan={p.id} onKeyDown={tahanUlang} onClick={() => pilih(p.id)}>
                        <span className="cer-opsi-tanda" aria-hidden="true">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" focusable="false"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.4V15h0A2.5 2.5 0 0 1 5 12.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                        </span>
                        <span className="cer-opsi-teks">{tx(p.teks)}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              {kendali.hanyaMemori ? <p className="cer-memori" role="status">{t('cerita.hanyaMemori')}</p> : null}
            </div>
          </>
        ) : tampilan === 'aktivitas' ? (
          <div className="misi-main cer-misi">
            {/* key = node: aktivitas berikutnya (juga bila langsung menyambung) mulai dari kartu tugasnya sendiri
                dengan draf kosong, bukan mewarisi 'mulai' & jawaban aktivitas sebelumnya. */}
            <BatasGagal key={state.node} tersimpan={!kendali.hanyaMemori} kembali="/cerita">
              <Suspense fallback={<div className="cer-memuat"><Memuat teks={t('cerita.memuatAktivitas')} /></div>}>
                <AktivitasCerita
                  ep={ep}
                  state={state}
                  node={node as NodeAktivitas}
                  bahasa={bahasa}
                  look={look}
                  namaPemain={namaPemain}
                  tx={tx}
                  onKirim={kirimAktivitas}
                  onLanjut={lanjutAktivitas}
                />
              </Suspense>
            </BatasGagal>
            {kendali.hanyaMemori ? <p className="cer-memori" role="status">{t('cerita.hanyaMemori')}</p> : null}
          </div>
        ) : (
          <LayarAkhir
            ep={ep}
            state={state}
            bahasa={bahasa}
            namaPemain={namaPemain}
            tx={tx}
            ditemukan={akhirDitemukan(ep.id)}
            onUlangBab={ulangBab}
            onUlangEpisode={ulangEpisode}
          />
        )}
      </main>

      {dialog === 'riwayat' ? (
        <Modal judul={t('cerita.riwayatJudul')} onTutup={() => setDialog(null)} lebar={560}>
          <IsiRiwayat ep={ep} state={state} bahasa={bahasa} tx={tx} namaPemain={namaPemain} look={look} />
        </Modal>
      ) : null}
      {dialog === 'catatan' ? (
        <Modal judul={t('cerita.catatanKasus')} onTutup={() => setDialog(null)} lebar={560}>
          <IsiCatatanKasus ep={ep} state={state} bahasa={bahasa} tx={tx} />
        </Modal>
      ) : null}
      {dialog === 'bantuan' ? (
        <Modal judul={t('cerita.bantuanJudul')} onTutup={() => setDialog(null)} lebar={480}>
          <IsiBantuan />
        </Modal>
      ) : null}
    </div>
  );
}

/** Isi dialog Bantuan: cara memakai layar cerita, satu baris per kontrol (ikon sama dengan tombolnya). */
function IsiBantuan() {
  return (
    <ul className="cer-bantuan">
      <li>
        <span className="cer-bantuan-ikon" aria-hidden="true"><Arrow /></span>
        <span>{t('cerita.bantuanLanjut')}</span>
      </li>
      <li>
        <span className="cer-bantuan-ikon"><IkonAlat jenis="riwayat" /></span>
        <span><b>{t('cerita.riwayat')}</b>{selaPembicara()}{t('cerita.bantuanRiwayat')}</span>
      </li>
      <li>
        <span className="cer-bantuan-ikon"><IkonAlat jenis="catatan" /></span>
        <span><b>{t('cerita.catatanKasus')}</b>{selaPembicara()}{t('cerita.bantuanCatatan')}</span>
      </li>
      <li>
        <span className="cer-bantuan-ikon"><IkonInfo /></span>
        <span>{t('cerita.bantuanIstilah')}</span>
      </li>
    </ul>
  );
}
