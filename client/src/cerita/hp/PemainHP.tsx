/**
 * PEMAIN CERITA ANTARMUKA HP (Episode.antarmuka 'hp'): satu tugas & satu pusat perhatian per layar.
 *
 * - Kepala ringkas: kembali, "Bagian n/4 · judul", tombol Menu (Riwayat, Catatan kasus, Bantuan, bahasa, suara) supaya
 *   bantuan tersedia tanpa mendominasi layar; tujuan bab satu kalimat di bawahnya.
 * - Tampilan (satu per satu): OBROLAN (chat dengan nasabah), ADEGAN (panggung + kartu dialog tatap muka), ARENA (tugas),
 *   AKHIR (LayarAkhir yang sama dengan Episode 1).
 * - Ketukan: baris berurutan yang setampilan tampil bersama (alur.ts); antarmuka memajukan mesin satu baris per aksi
 *   sampai ketukan utuh (efek tata letak, sebelum digambar). Lanjut/keputusan yang diketuk beruntun (ketuk ganda) ditahan
 *   sebentar supaya akibat & status tidak terlewat.
 * - Aktivitas: kartu tugas di bawah percakapan; "Mulai" membuka arena. Draf tersimpan = arena langsung terbuka saat
 *   halaman dimuat ulang.
 * - PROTOTIPE meja kasus (D-68, hanya build VITE_MEJA_KASUS=1): aktivitas bundel bermeja = MejaKasus (Phaser) dan node
 *   akibatnya = MejaAkibat; build biasa tidak memuat kodenya.
 */
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import type { Bahasa } from '@shared/bahasa';
import type { MissionAnswer } from '@shared/types';
import { playSfx } from '../../audio/audio';
import { Arrow } from '../../components/PlayerShell';
import { t } from '../../i18n';
import type { Profil } from '../../state/profil';
import { useHalaman } from '../../ui/halaman';
import { Modal } from '../../ui/kit';
import { adaDialogTerbuka } from '../../ui/modal';
import { babKini, barisTerlihat, bisaLanjut, nodeKini, pilihanTersedia, semuaBarisTampil, suasanaNasabah } from '../mesin';
import { akhirDitemukan, berlanggananCerita, versiPenyimpananCerita } from '../simpan';
import type { Episode, IdBab, KunciTeks, NodeAktivitas, NodePilihan, StateCerita } from '../tipe';
import { GerbangKasus, HasilKasus, IsiBukuCatatan, LayarInvestigasi, jenisPeriksa, kilasBalikKini, periksaTersimpan, perluGerbangKasus, tamuBaruSemuaKasus } from '../investigasi/LayarInvestigasi';
import { hiasReaksi } from '../investigasi/ui/reaksiBaris';
import { LayarKeterangan, pakaiKeterangan } from '../investigasi/ui/LayarKeterangan';
import { IkonInv } from '../investigasi/ui/dasar';
import { buktiTerkumpul, pernyataanTercatat } from '../investigasi/status';
import { IkonAlat, selaPembicara } from '../ui/bagian';
import { IsiCatatanKasus } from '../ui/CatatanKasus';
import { DaftarIstilah, istilahBaris } from '../ui/KotakDialog';
import { LayarAkhir } from '../ui/LayarAkhir';
import { IsiRiwayat } from '../ui/Riwayat';
import type { KendaliCerita } from '../ui/useCerita';
import { AdeganTatap, type StatusSesudah } from './AdeganTatap';
import { Arena, adaDrafArena, bacaTampilan } from './arena/Arena';
import { BahasaKunci, IkonMenu } from './MenuPiksel';
import { ringkasTindakan } from './arena/ringkas';
import { RingkasRambu } from './arena/RingkasRambu';
import { tanggapan as tanggapanRambu } from './arena/rambu';
import { TombolLanjut } from './bagianHp';
import { ketukanBelumUtuh, ketukanKini, labelStatus, pandangKini, utasObrolan } from './alur';
import { useTransisiTelepon } from './transisiTelepon';
import { MEJA_KASUS, mejaAktif } from './meja/bendera';
import { akibatMeja } from './meja/logika';
import { KUERI_CANGKANG_LAYAR, useKueri } from './cangkang';
import { Obrolan } from './Obrolan';
import { LookPemain } from './lookPemain';
import { PilihBalasan } from './PilihBalasan';
import { KontrolSuara, PetunjukSuara, useAudioCerita, type TemaCerita } from './AudioCerita';
import './hp.css';
import './desain.css';

const MejaKasus = MEJA_KASUS ? lazy(() => import('./meja/MejaKasus')) : null;
const MejaAkibat = MEJA_KASUS ? lazy(() => import('./meja/MejaAkibat')) : null;

/** Jeda minimum antara dua aksi maju (ms): ketukan ganda tidak melompati akibat/ketukan berikutnya. */
const JEDA_AKSI_MS = 450;

// T-076: 'investigasi' = layar node ber-`investigasi` (hanya episode ber-`Episode.investigasi`; episode lain tidak pernah ke sini).
type Tampilan = 'obrolan' | 'adegan' | 'arena' | 'akhir' | 'investigasi';

function PemainHPInti({ ep, state, kendali, profil, bahasa, tx: txAsli }: {
  ep: Episode;
  state: StateCerita;
  kendali: KendaliCerita;
  profil: Profil;
  bahasa: Bahasa;
  tx: (k: KunciTeks, param?: Record<string, string | number>) => string;
}) {
  const { kirim } = kendali;
  const namaPemain = profil.nickname;
  // K08: bila tanda lajur menempatkan truk di lajur terlarang tetapi kesimpulan "tidak melanggar" dipilih (K08-C), baris akibat dan
  // alasannya yang bernada "pertanyaan terjawab" diganti teks netral. HANYA tampilan: efek status & riwayat mesin tidak berubah
  // (keputusan substansi ada pada owner, lihat docs/prd-v02/DECISIONS.md D-71).
  const konflikRambu = useMemo(() => {
    const arena = ep.aktivitas.rambu?.arena;
    const jawaban = state.aktivitas.rambu?.jawaban;
    return arena?.pola === 'rambu' && !!jawaban && tanggapanRambu(arena, jawaban).some((x) => x.teks === 'arena.rambu.tanggap.sikapTidak');
  }, [ep, state.aktivitas]);
  const tx = useMemo(() => {
    if (!konflikRambu) return txAsli;
    const ganti: Record<string, KunciTeks> = { 'k08-c.1': 'k08-c.konflik', 'k08.c.alasan': 'k08.c.alasanKonflik' };
    return (k: KunciTeks, p?: Record<string, string | number>) => txAsli(ganti[k] ?? k, p);
  }, [konflikRambu, txAsli]);
  useSyncExternalStore(berlanggananCerita, versiPenyimpananCerita, () => 0);

  // Ketukan utuh: baris berikutnya yang setampilan dengan baris terakhir ikut dimajukan sebelum digambar.
  useLayoutEffect(() => {
    for (let i = 0; i < 12; i++) {
      const s = kendali.baca();
      if (!s || !ketukanBelumUtuh(ep, s)) break;
      if (!kirim({ jenis: 'lanjut' })) break;
    }
  }, [state, ep, kirim, kendali]);

  const node = nodeKini(ep, state)!;
  const bab = babKini(ep, state);
  const lengkap = semuaBarisTampil(ep, state);
  const kunciNode = `${state.node}#${state.langkah}`;
  const [arenaUntuk, setArenaUntuk] = useState<string | null>(() => (node.jenis === 'aktivitas' && lengkap && adaDrafArena(ep, state) ? kunciNode : null));
  const [akhirUntuk, setAkhirUntuk] = useState<string | null>(() => (node.jenis === 'akhir' && lengkap ? kunciNode : null));
  const [dialog, setDialog] = useState<'menu' | 'riwayat' | 'catatan' | 'bantuan' | null>(null);
  // Pilihan dibuka pemain (per node): tampilan saja; muat ulang = tombol Balas lagi, tanpa efek mesin.
  const [balasUntuk, setBalasUntuk] = useState<string | null>(() => (bacaBalasan()?.kunci === `${state.node}#${state.langkah}` ? `${state.node}#${state.langkah}` : null));
  const aksiTerakhir = useRef(0);
  // T-076 (Episode 1 Investigator, opt-in): node ber-`investigasi` digambar layar investigasi begitu barisnya habis. Node 'catat'
  // dua langkah: baris terakhir (pernyataannya) dibaca dulu di adegan, "Lanjut" membuka kartu pernyataan untuk disemat
  // (`sematUntuk`, tampilan saja: muat ulang = baris terakhir lagi). Hasil (node akhir) lewat alur akhir biasa.
  const inv = ep.investigasi ? node.investigasi : undefined;
  // T-087: periksa SIM yang ditinggal di tengah jalan (langkah tersimpan sebagai draf) langsung terbuka lagi sesudah muat ulang.
  // T-090: sama untuk garis waktu perjalanan dan halaman polis kasus 2 (jenisPeriksa).
  const [sematUntuk, setSematUntuk] = useState<string | null>(() => (jenisPeriksa(inv) && lengkap && periksaTersimpan(ep, state) > 0 ? kunciNode : null));
  // T-087 (review pilot butir 4): halaman dibuka dengan kasus yang belum selesai = gerbang "Lanjutkan kasus" / "Mulai baru"
  // (sekali per kunjungan halaman; tampilan saja, mesin tidak disentuh sampai tamu memilih).
  const [gerbang, setGerbang] = useState(() => perluGerbangKasus(ep, kendali.muat));
  // T-080: 'periksa-sim' juga dua langkah (baris terakhir dibaca di adegan dulu, "Lanjut" membuka layar periksa SIM).
  const duaLangkah = inv?.jenis === 'catat' || jenisPeriksa(inv);
  const layarInv = !!inv && lengkap && inv.jenis !== 'hasil-investigasi' && (!duaLangkah || sematUntuk === kunciNode);

  const pandang = pandangKini(ep, state);
  const tampilan: Tampilan = gerbang || layarInv ? 'investigasi'
    : akhirUntuk === kunciNode && node.jenis === 'akhir' ? 'akhir'
      : arenaUntuk === kunciNode && node.jenis === 'aktivitas' && lengkap ? 'arena'
        : pandang;

  const [temaUji, setTemaUji] = useState<TemaCerita | null>(null);
  // Contoh musik hanya selama Menu terbuka; ditutup = kembali mengikuti adegan (preferensi pemain tidak diubah).
  useEffect(() => { if (dialog !== 'menu') setTemaUji(null); }, [dialog]);
  // T-085: kilas balik keterangan (LayarKeterangan) sedang tampil = sapuan filter pada trek wawancara.
  useAudioCerita(ep, state, { babId: bab?.bab.id, akhir: tampilan === 'akhir', obrolan: tampilan === 'obrolan', temaUji, kilas: tampilan === 'adegan' && kilasBalikKini(ep, state) });

  const infoAkhir = tampilan === 'akhir' && state.akhir ? ep.akhir[state.akhir] : undefined;
  const bagianJudul = infoAkhir ? tx(infoAkhir.judul) : bab ? t('cerita.bagian', { n: bab.nomor, total: bab.jumlah }) : '';
  useHalaman(bagianJudul ? `${tx(ep.judul)} · ${bagianJudul}` : tx(ep.judul));

  // ---- aksi
  const bolehAksi = () => {
    const kini = performance.now();
    if (kini - aksiTerakhir.current < JEDA_AKSI_MS) return false;
    aksiTerakhir.current = kini;
    return true;
  };
  const maju = () => {
    if (!bolehAksi()) return;
    if (node.jenis === 'akhir' && lengkap) { setAkhirUntuk(kunciNode); return; }
    if (duaLangkah && lengkap) { setSematUntuk(kunciNode); return; }
    if (bisaLanjut(ep, state)) kirim({ jenis: 'lanjut' });
  };
  // T-076: aksi layar investigasi (satu aksi mesin per layar; tanpa jeda ketuk ganda karena tombolnya milik layar itu sendiri).
  const lanjutInv = () => { if (kirim({ jenis: 'lanjut' })) aksiTerakhir.current = performance.now(); };
  const pilihInv = (id: string): boolean => {
    const ok = kirim({ jenis: 'pilih', node: state.node, pilihan: id });
    if (ok) { aksiTerakhir.current = performance.now(); lupakanBalasan(); }
    return ok;
  };
  const pilih = (id: string) => {
    if (kirim({ jenis: 'pilih', node: state.node, pilihan: id })) {
      aksiTerakhir.current = performance.now();
      playSfx(pandang === 'obrolan' ? 'pesanKirim' : 'konfirmasi');
      lupakanBalasan();
    }
  };
  const kirimAktivitas = useCallback((jawaban: MissionAnswer) => {
    if (kirim({ jenis: 'aktivitas', node: state.node, jawaban })) {
      aksiTerakhir.current = performance.now();
      playSfx('konfirmasi');
      setArenaUntuk(null);
    }
  }, [kirim, state.node]);
  // (meja hasil) semua baris node akibat tampil sekaligus; tidak pernah pindah node.
  const majukanSemua = useCallback(() => {
    for (let i = 0; i < 20; i++) {
      const s = kendali.baca();
      if (!s || semuaBarisTampil(ep, s)) break;
      if (!kirim({ jenis: 'lanjut' })) break;
    }
  }, [ep, kendali, kirim]);
  const ulangBab = (b: IdBab) => { kirim({ jenis: 'ulangBab', bab: b }); setAkhirUntuk(null); };
  const ulangEpisode = () => { kendali.mulaiDariAwal(); setAkhirUntuk(null); setArenaUntuk(null); setSematUntuk(null); };

  // Pesan pemain dari susunan aktivitas (DefAktivitas.pesanObrolan) untuk utas obrolan.
  const pesanAktivitas = useCallback((_n: string, id: string) => {
    const def = ep.aktivitas[id];
    const j = state.aktivitas[id]?.jawaban;
    return def?.pesanObrolan && j ? def.pesanObrolan(j, tx) : null;
  }, [ep, state.aktivitas, tx]);

  // ---- gulir & fokus saat tampilan / node berganti (obrolan menggulir dirinya sendiri)
  const tanda = `${tampilan}|${tampilan === 'obrolan' ? '' : kunciNode}`;
  const tandaLalu = useRef(tanda);
  useEffect(() => {
    if (tanda === tandaLalu.current) return;
    tandaLalu.current = tanda;
    if (tampilan !== 'obrolan') window.scrollTo({ top: 0, behavior: 'auto' });
    const id = requestAnimationFrame(() => {
      const aktif = document.activeElement;
      if (adaDialogTerbuka() || (aktif && aktif !== document.body && document.contains(aktif))) return;
      // Fokus tanpa menggulir: layar baru selalu mulai dari atas (obrolan menggulir ke pesan barunya sendiri).
      document.querySelector<HTMLElement>('.hp-layar [data-hp-fokus], .hp-layar [data-lanjut], .hp-layar [data-mulai-tugas], .hp-layar [data-mulai-percakapan], .hp-layar [data-balas]')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [tanda, tampilan]);

  // Enter / Spasi di luar kontrol = Lanjut (sama dengan tombolnya).
  const majuRef = useRef(maju);
  majuRef.current = maju;
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.key !== 'Enter' && e.key !== ' ') || e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (adaDialogTerbuka()) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (el && el !== document.body && el.closest('button, a, input, select, textarea, summary, [role="button"], [role="radio"]')) return;
      if (!document.querySelector('.hp-layar [data-lanjut]')) return;
      e.preventDefault();
      majuRef.current();
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  // ---- komposer (bawah obrolan / adegan): keputusan, tugas, atau Lanjut
  const def = node.jenis === 'aktivitas' ? ep.aktivitas[node.aktivitas] : undefined;
  const misi = useMemo(() => (def ? def.misi(bahasa) : null), [def, bahasa]);
  const status = tx(suasanaNasabah(ep, state).label);
  const komposer = node.jenis === 'pilihan' && lengkap && balasUntuk !== kunciNode ? (
    <button type="button" className="primary-action hp-balas" data-balas="" onClick={() => { playSfx('ketuk'); setBalasUntuk(kunciNode); ingatBalasan(kunciNode, bacaBalasan()?.kunci === kunciNode ? bacaBalasan()!.pilih : null); requestAnimationFrame(() => document.querySelector<HTMLElement>('.hp-pilih [data-hp-fokus]')?.focus({ preventScroll: false })); }}>
      {pandang === 'obrolan' ? t('ceritaHp.balasNama', { nama: tx(ep.pemeran[ep.nasabah]?.nama ?? ep.nasabah) }) : t('ceritaHp.jawabPilihan')} <Arrow />
    </button>
  ) : node.jenis === 'pilihan' && lengkap ? (
    <PilihBalasan key={kunciNode} awal={bacaBalasan()?.kunci === kunciNode ? bacaBalasan()!.pilih : null} onUbahPilih={(id) => ingatBalasan(kunciNode, id)} ep={ep} node={node as NodePilihan} pilihan={pilihanTersedia(ep, state)} tx={tx} gaya={pandang}
      petunjuk={!state.riwayat.some((e) => e.jenis === 'pilihan')} onKirim={pilih}
      onTutup={() => { playSfx('ketuk'); setBalasUntuk(null); requestAnimationFrame(() => document.querySelector<HTMLElement>('.hp-layar [data-balas]')?.focus({ preventScroll: true })); }} />
  ) : node.jenis === 'aktivitas' && lengkap && misi ? (
    <section className="hp-aksi" aria-labelledby="hp-aksi-judul">
      <p className="hp-aksi-label">{t('ceritaHp.tugas')}</p>
      <h2 id="hp-aksi-judul">{misi.title}</h2>
      <p>{misi.instruction}</p>
      <button type="button" className="primary-action" data-mulai-tugas="" onClick={() => { playSfx('kertas'); requestAnimationFrame(() => setArenaUntuk(kunciNode)); /* T-044: sound first, mount the arena next frame */ }}>
        {adaDrafArena(ep, state) ? t('ceritaHp.lanjutkanTugas') : t('ceritaHp.mulaiTugas')} <Arrow />
      </button>
    </section>
  ) : node.jenis === 'akhir' && lengkap ? (
    <TombolLanjut label={t('ceritaHp.lihatRingkasan')} onKlik={maju} />
  ) : (
    <TombolLanjut onKlik={maju} />
  );

  /** Daftar balasan sedang terbuka (di HP = lembar balasan): petunjuk suara disembunyikan, kepala obrolan ramping. */
  const balasTerbuka = node.jenis === 'pilihan' && lengkap && balasUntuk === kunciNode;

  // Istilah baris ketukan kini ("Apa itu …?"), di atas komposer.
  const ketukan = ketukanKini(ep, state);
  const barisKetukan = ketukan ? barisTerlihat(ep, state).slice(ketukan.awal, ketukan.akhir + 1) : [];
  const istilah = barisKetukan.flatMap((b) => istilahBaris(ep, b, tx));
  const sisipanIstilah = istilah.length ? <DaftarIstilah key={kunciNode + '#' + state.baris} istilah={istilah} /> : null;

  // Umpan balik tindakan & catatan status untuk adegan tatap muka (obrolan punya utasnya sendiri).
  const terakhir = state.terakhir;
  const awalNode = ketukan?.awal === 0;
  const aktTerakhir = [...state.riwayat].reverse().find((e) => e.jenis === 'aktivitas');
  const tindakan = terakhir && awalNode && aktTerakhir && aktTerakhir.jenis === 'aktivitas'
    ? ringkasTindakan(ep, aktTerakhir.aktivitas, state.aktivitas[aktTerakhir.aktivitas]?.jawaban, tx) : null;
  // T-025: akibat yang dibuka dengan adegan sela lalu kembali ke obrolan (ruang Komite K11 sesudah kabar terkirim): catatan
  // statusnya menutup akibat DI OBROLAN (hp/alur.ts utasObrolan), jadi tidak ikut di kartu adegan sela.
  const statusDiObrolan = useMemo(() => utasObrolan(ep, state, pesanAktivitas).statusDiObrolan, [ep, state, pesanAktivitas]);
  const statusSesudah: StatusSesudah | null = terakhir?.alasan && awalNode && statusDiObrolan !== state.node ? statusDariRiwayat(ep, state, tx) : null;
  // K08: jalan bertanda + tanggapan tokoh atas tanda pemain (dibaca dari jawaban tersimpan; benar setelah muat ulang).
  const arenaTerakhir = aktTerakhir && aktTerakhir.jenis === 'aktivitas' ? ep.aktivitas[aktTerakhir.aktivitas]?.arena : undefined;
  const jawabanTerakhir = aktTerakhir && aktTerakhir.jenis === 'aktivitas' ? state.aktivitas[aktTerakhir.aktivitas]?.jawaban : undefined;
  const buktiTindakan = terakhir && awalNode && arenaTerakhir?.pola === 'rambu' && jawabanTerakhir ? <RingkasRambu ep={ep} konfig={arenaTerakhir} jawaban={jawabanTerakhir} tx={tx} /> : null;

  // PROTOTIPE meja kasus: aktivitas bundel bermeja & node akibatnya.
  const arenaNode = node.jenis === 'aktivitas' ? ep.aktivitas[node.aktivitas]?.arena : undefined;
  const pakaiMeja = !!MejaKasus && arenaNode?.pola === 'bundel' && !!arenaNode.meja && mejaAktif();
  const akibatDiMeja = MejaAkibat && tampilan !== 'akhir' && mejaAktif() ? akibatMeja(ep, state) : null;
  // Kartu tugas meja tampil: unduh engine & kode meja lebih awal (jaringan HP lambat), sebelum pemain menekan Mulai.
  useEffect(() => {
    if (!MEJA_KASUS || !pakaiMeja) return;
    void import('./meja/MejaKasus').catch(() => {});
    void import('../../game/engine/stage').then((m) => m.prefetchEngine()).catch(() => {});
  }, [pakaiMeja]);

  // T-018 Tahap 2: cangkang layar (halaman tidak menggulir) untuk adegan beraksi-di-dialog, aktivitas, dan layar akhir.
  const cangkangLayar = useKueri(KUERI_CANGKANG_LAYAR);
  const [slotAkhir, setSlotAkhir] = useState<HTMLDivElement | null>(null);
  // T-076: layar investigasi & hasil investigasi tidak dikunci (tingginya dihitung muat oleh komponennya; halaman boleh menggulir bila tidak).
  const kunciLayar = (tampilan === 'akhir' && !ep.investigasi) || (tampilan === 'arena' && !pakaiMeja) || (tampilan === 'adegan' && !akibatDiMeja && !(node.jenis === 'pilihan' && lengkap));
  // T-024: layar akhir SATU LAYAR (tanpa gulir) di cangkang, untuk episode dengan ringkasan keputusan bernomor. Legenda suasana,
  // catatan simulasi dan status naskah yang dulu di bawah kartu pindah ke Menu selama bentuk ini tampil.
  const akhirSatu = tampilan === 'akhir' && cangkangLayar && !!ep.titik?.length;

  return (
    <div className="player-ui cer-layar hp-layar" data-teks-besar={ep.tampilan?.teksBesar ? '' : undefined} data-kunci={kunciLayar ? '' : undefined} data-tampilan={tampilan} data-akhir-satu={akhirSatu ? '' : undefined} data-balas-terbuka={balasTerbuka ? '' : undefined}>
      <header className="hp-kepala">
        <Link className="hp-kembali" to="/cerita" aria-label={t('cerita.kembaliDaftar')}><Arrow back /></Link>
        <div className="hp-judul">
          <h1 className="sr-only">{tx(ep.judul)}</h1>
          {bab && tampilan !== 'akhir' ? (
            <p className="hp-judul-teks"><span className="hp-bagian">{t('cerita.bagian', { n: bab.nomor, total: bab.jumlah })}</span><b>{tx(bab.bab.judul)}</b></p>
          ) : <p className="hp-judul-teks"><span className="hp-bagian">{t('cerita.akhirLabel')}</span><b>{tx(ep.judul)}</b></p>}
        </div>
        {ep.investigasi ? (
          // T-079: buku catatan investigator selalu terjangkau (ikon buku + jumlah isinya), di kiri Menu.
          <div className="hp-kepala-kanan">
            <button type="button" className="hp-buku-tombol" data-buku-tombol="" aria-haspopup="dialog" aria-label={t('investigasi.bukuInvestigator')} onClick={() => { playSfx('kertas'); setDialog('catatan'); }}>
              <IkonInv nama="buku" />
              {pernyataanTercatat(ep, state).length + buktiTerkumpul(ep, state).length > 0 ? <b aria-hidden="true">{pernyataanTercatat(ep, state).length + buktiTerkumpul(ep, state).length}</b> : null}
            </button>
            <button type="button" className="hp-menu" aria-haspopup="dialog" onClick={() => setDialog('menu')}>
              <span aria-hidden="true">⋯</span><span className="hp-menu-teks">{t('ceritaHp.menu')}</span>
            </button>
          </div>
        ) : (
        <button type="button" className="hp-menu" aria-haspopup="dialog" onClick={() => setDialog('menu')}>
          <span aria-hidden="true">⋯</span><span className="hp-menu-teks">{t('ceritaHp.menu')}</span>
        </button>
        )}
      </header>
      {bab && tampilan !== 'akhir' && tampilan !== 'arena' && tampilan !== 'obrolan' && tampilan !== 'investigasi' && !akibatDiMeja ? (
        <p className="hp-tujuan"><b>{t('ceritaHp.tujuan')}</b>{selaPembicara()}{tx(bab.bab.tujuan)}</p>
      ) : null}

      <PetunjukSuara idEpisode={ep.id} layarPertama={state.node === ep.mulai && !state.riwayat.some((e) => e.jenis === 'pilihan' || e.jenis === 'aktivitas')} sembunyi={balasTerbuka || tampilan === 'arena'} />
      <main className="hp-main" data-tampilan={tampilan} data-node={state.node}>
        {tampilan === 'investigasi' ? (
          gerbang
            ? <GerbangKasus ep={ep} state={state} tx={tx} onLanjut={() => setGerbang(false)} onBaru={() => { tamuBaruSemuaKasus(ep); ulangEpisode(); setGerbang(false); }} />
            : <LayarInvestigasi ep={ep} state={state} node={node} tx={tx} onLanjut={lanjutInv} onPilih={pilihInv} onMulaiUlang={ulangEpisode} />
        ) : tampilan === 'akhir' && ep.investigasi ? (
          <HasilKasus ep={ep} state={state} nama={namaPemain} look={profil.look} tx={tx} onMainLagi={ulangEpisode} />
        ) : tampilan === 'arena' && node.jenis === 'aktivitas' && pakaiMeja && MejaKasus ? (
          <Suspense fallback={<p className="meja-muat-halaman" role="status">{t('ceritaHp.mejaMenyiapkan')}</p>}>
            <MejaKasus key={kunciNode} ep={ep} state={state} node={node as NodeAktivitas} bahasa={bahasa} tx={tx} namaPemain={namaPemain}
              onKirim={kirimAktivitas} onKembali={() => setArenaUntuk(null)} />
          </Suspense>
        ) : akibatDiMeja && MejaAkibat ? (
          <Suspense fallback={<p className="meja-muat-halaman" role="status">{t('ceritaHp.mejaMenyiapkan')}</p>}>
            <MejaAkibat key={state.node} ep={ep} state={state} bahasa={bahasa} tx={tx} statusSesudah={statusDariRiwayat(ep, state, tx)}
              majukanSemua={majukanSemua} onLanjut={maju} />
          </Suspense>
        ) : tampilan === 'arena' && node.jenis === 'aktivitas' ? (
          <Arena
            key={kunciNode}
            ep={ep}
            state={state}
            node={node as NodeAktivitas}
            bahasa={bahasa}
            tx={tx}
            namaPemain={namaPemain}
            onKirim={kirimAktivitas}
            onKembali={() => setArenaUntuk(null)}
          />
        ) : tampilan === 'akhir' ? (
          <LayarAkhir ep={ep} state={state} bahasa={bahasa} namaPemain={namaPemain} tx={tx} ditemukan={akhirDitemukan(ep.id)} onUlangBab={ulangBab} onUlangEpisode={ulangEpisode} slotAksi={cangkangLayar ? slotAkhir : null} satuLayar={cangkangLayar} />
        ) : tampilan === 'obrolan' ? (
          <Obrolan ep={ep} state={state} tx={tx} status={status} pesanAktivitas={pesanAktivitas} komposer={komposer} sisipan={<>{sisipanIstilah}{buktiTindakan}</>} tujuan={bab ? tx(bab.bab.tujuan) : undefined} lembar={balasTerbuka} />
        ) : pakaiKeterangan(ep, state) ? (
          // T-079 (Episode 1 Investigator): ruang wawancara = layar keterangan (saksi duduk, gerak, kilas balik); baris tetap maju lewat komposer.
          <LayarKeterangan ep={ep} state={state} tx={tx} komposer={komposer}
            mulaiTugas={node.jenis === 'aktivitas' && lengkap && misi ? () => { playSfx('kertas'); requestAnimationFrame(() => setArenaUntuk(kunciNode)); } : undefined}
            nama={(id) => (id === 'pemain' ? namaPemain : Object.prototype.hasOwnProperty.call(ep.pemeran, id) ? tx(ep.pemeran[id]!.nama) : id)} />
        ) : (
          <AdeganTatap ep={ep} state={state} tx={tx} namaPemain={namaPemain} status={status} tindakan={tindakan} buktiTindakan={buktiTindakan} statusSesudah={statusSesudah} komposer={komposer} aksiDiDialog={!(node.jenis === 'pilihan' && lengkap)} sisipan={sisipanIstilah} hiasUcapan={ep.investigasi ? hiasReaksi : undefined}
            tugasNanti={node.jenis === 'aktivitas' && !lengkap && misi ? { judul: misi.title, instruksi: misi.instruction, tombol: t('ceritaHp.mulaiTugas') } : null} />
        )}
        {kendali.hanyaMemori ? <p className="cer-memori" role="status">{t('cerita.hanyaMemori')}</p> : null}
      </main>
      {tampilan === 'akhir' && !ep.investigasi ? <div ref={setSlotAkhir} className="hp-akhir-aksi" /> : null}

      {dialog === 'menu' ? (
        <Modal judul={t('ceritaHp.menuJudul')} onTutup={() => setDialog(null)} lebar={420} kelas="hp-menu-piksel">
          {/* D-132: baris tujuan bisa disembunyikan di layar pendek, jadi selalu terbaca di Menu. */}
          {bab && tampilan !== 'akhir' ? <p className="hp-menu-tujuan"><b>{t('ceritaHp.tujuan')}</b>{selaPembicara()}{tx(bab.bab.tujuan)}</p> : null}
          {/* T-041 (owner 19 Nov): pixel Menu that fits 360x640 / 390x700 without scrolling: 2x2 pixel keys, language keys, Music + Effects. */}
          <ul className="hp-menu-daftar hp-menu-ringkas">
            <li><button type="button" className="hp-kunci-piksel" onClick={() => setDialog('riwayat')}><IkonMenu jenis="riwayat" /><span>{t('cerita.riwayat')}</span></button></li>
            <li><button type="button" className="hp-kunci-piksel" onClick={() => setDialog('catatan')}><IkonMenu jenis="catatan" /><span>{ep.investigasi ? t('investigasi.buku') : t('cerita.catatanKasus')}</span></button></li>
            <li><button type="button" className="hp-kunci-piksel" onClick={() => setDialog('bantuan')}><IkonMenu jenis="bantuan" /><span>{t('cerita.bantuan')}</span></button></li>
            {/* T-024: keterangan yang dulu di bawah kartu akhir (legenda pita grafik, catatan simulasi, status naskah).
                D-246 (polish): tepat di bawah Bantuan, di ATAS bahasa & suara, supaya terlihat tanpa menggulir Menu. */}
            {akhirSatu && ep.suasana.length ? (
              <li className="hp-menu-info" data-menu-info="suasana">
                <b>{t('ceritaAkhir.menu.suasana')}</b>
                <span>{[...ep.suasana].sort((a, b) => b.min - a.min).map((p) => `${p.min}+ ${tx(p.label)}`).join(' · ')}</span>
              </li>
            ) : null}
            {akhirSatu ? (
              <li className="hp-menu-info" data-menu-info="catatan">
                <b>{t('ceritaAkhir.menu.catatan')}</b>
                <span>{t('misi.catatanSimulasiPeriksa')}</span>
                {ep.statusNaskah ? <span>{tx(ep.statusNaskah)}</span> : null}
              </li>
            ) : null}
            {tampilan === 'arena' ? <li><button type="button" className="hp-kunci-piksel" data-menu-tampilan="" aria-label={bacaTampilan() === 'daftar' ? t('ceritaHp.tampilanVisual') : t('ceritaHp.tampilanDaftar')} onClick={() => { setDialog(null); window.dispatchEvent(new Event('raksa:alih-tampilan')); }}><IkonMenu jenis={bacaTampilan() === 'daftar' ? 'gambar' : 'daftar'} /><span>{bacaTampilan() === 'daftar' ? t('ceritaHp.tampilanVisualPendek') : t('ceritaHp.tampilanDaftarPendek')}</span></button></li> : null}
            {/* T-076: "Tamu baru" = hapus rekaman investigasi perangkat ini (skor terbaik, stempel) dan mulai kasus dari awal. */}
            {ep.investigasi ? <li className="hp-menu-baris"><span>{tx('inv.ui.tamuBaruKet')}</span><button type="button" className="hp-tautan" data-menu-tamu-baru="" onClick={() => { tamuBaruSemuaKasus(ep); setDialog(null); ulangEpisode(); }}>{tx('inv.ui.tamuBaruYa')}</button></li> : null}
            <li className="hp-menu-baris"><span>{t('ceritaHp.menuBahasa')}</span><BahasaKunci /></li>
            <li className="hp-menu-suara"><span className="sr-only">{t('ceritaHp.menuSuara')}</span><KontrolSuara temaUji={temaUji} onTemaUji={setTemaUji} /></li>
          </ul>
        </Modal>
      ) : null}
      {dialog === 'riwayat' ? (
        <Modal judul={t('cerita.riwayatJudul')} onTutup={() => setDialog(null)} lebar={560}>
          <IsiRiwayat ep={ep} state={state} bahasa={bahasa} tx={tx} namaPemain={namaPemain} look={profil.look} />
        </Modal>
      ) : null}
      {dialog === 'catatan' ? (
        <Modal judul={ep.investigasi ? t('investigasi.bukuInvestigator') : t('cerita.catatanKasus')} onTutup={() => setDialog(null)} lebar={560}>
          {ep.investigasi ? <IsiBukuCatatan ep={ep} state={state} tx={tx} /> : <IsiCatatanKasus ep={ep} state={state} bahasa={bahasa} tx={tx} />}
        </Modal>
      ) : null}
      {dialog === 'bantuan' ? (
        <Modal judul={t('cerita.bantuanJudul')} onTutup={() => setDialog(null)} lebar={480}>
          <ul className="cer-bantuan">
            <li><span className="cer-bantuan-ikon" aria-hidden="true"><Arrow /></span><span>{t('ceritaHp.bantuanLanjut')}</span></li>
            <li><span className="cer-bantuan-ikon" aria-hidden="true">1</span><span>{t('ceritaHp.bantuanBalas')}</span></li>
            <li><span className="cer-bantuan-ikon" aria-hidden="true">2</span><span>{t('ceritaHp.bantuanTugas')}</span></li>
            <li><span className="cer-bantuan-ikon" aria-hidden="true">3</span><span>{t('ceritaHp.bantuanStatus')}</span></li>
            <li><span className="cer-bantuan-ikon"><IkonAlat jenis="riwayat" /></span><span><b>{t('cerita.riwayat')}</b>{selaPembicara()}{t('cerita.bantuanRiwayat')}</span></li>
            <li><span className="cer-bantuan-ikon"><IkonAlat jenis="catatan" /></span><span><b>{t('cerita.catatanKasus')}</b>{selaPembicara()}{t('cerita.bantuanCatatan')}</span></li>
            <li><span className="cer-bantuan-ikon" aria-hidden="true">≡</span><span>{t('ceritaHp.bantuanDaftar')}</span></li>
          </ul>
        </Modal>
      ) : null}
    </div>
  );
}

/** Status sebelum → sesudah keputusan terakhir (entri alasan terakhir di riwayat) untuk catatan di kartu adegan. */
function statusDariRiwayat(ep: Episode, s: StateCerita, tx: (k: KunciTeks) => string): StatusSesudah | null {
  const nilai: number[] = [ep.kepercayaanAwal];
  let terakhir: Extract<StateCerita['riwayat'][number], { jenis: 'alasan' }> | null = null;
  for (const e of s.riwayat) {
    if (e.jenis !== 'alasan') continue;
    terakhir = e;
    if (typeof e.nilai === 'number') nilai.push(e.nilai);
  }
  if (!terakhir) return null;
  const sesudah = nilai[nilai.length - 1]!;
  const sebelum = nilai.length > 1 ? nilai[nilai.length - 2]! : ep.kepercayaanAwal;
  return { sebelum: tx(labelStatus(ep, sebelum)), sesudah: tx(labelStatus(ep, sesudah)), arah: terakhir.arah, alasan: tx(terakhir.teks) };
}

/** Balasan yang sedang disusun (per node & langkah) di sessionStorage: muat ulang memulihkan pilihan & daftar yang terbuka. */
const KUNCI_BALASAN = 'raksa:cerita:balasan';
function bacaBalasan(): { kunci: string; pilih: string | null } | null {
  try { const v = JSON.parse(sessionStorage.getItem(KUNCI_BALASAN) ?? 'null'); return v && typeof v.kunci === 'string' ? v : null; } catch { return null; }
}
function ingatBalasan(kunci: string, pilih: string | null): void {
  try { sessionStorage.setItem(KUNCI_BALASAN, JSON.stringify({ kunci, pilih })); } catch { /* kenyamanan saja */ }
}
function lupakanBalasan(): void {
  try { sessionStorage.removeItem(KUNCI_BALASAN); } catch { /* abaikan */ }
}

/**
 * T-021: pembungkus tipis. Saat panggung kantor menyerahkan cerita ke obrolan (dan sebaliknya) di titik Episode.serahTelepon,
 * pemain inti tetap digambar dengan state panggung LAMA selama 800 md pertama (aksi dibekukan; ketuk = lewati), sementara
 * hp/transisiTelepon memutar adegan telepon. Di luar titik serah dan saat gerak dikurangi: tidak ada bedanya dengan sebelumnya.
 */
export function PemainHP(props: Parameters<typeof PemainHPInti>[0]) {
  const { tampil, tahan, lapis } = useTransisiTelepon(props.ep, props.state);
  const beku = useMemo<KendaliCerita>(() => ({ ...props.kendali, kirim: () => false, baca: () => tampil }), [props.kendali, tampil]);
  // T-052: karakter pilihan pemain untuk gelembung pesannya, lembar balasan, dan kartu petugas di layar akhir.
  return <LookPemain.Provider value={props.profil.look ?? null}>
    <PemainHPInti {...props} state={tampil} kendali={tahan ? beku : props.kendali} />
    {lapis}
  </LookPemain.Provider>;
}
