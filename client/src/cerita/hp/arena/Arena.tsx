/**
 * ARENA AKTIVITAS (antarmuka HP): satu tugas, satu pusat perhatian. Kepala (kembali ke cerita + judul), konteks singkat
 * (kalimat tokoh yang memberi tugas + fakta yang dibutuhkan, di tempat), lalu pola interaksi sesuai adegan
 * (DefAktivitas.arena). Satu antarmuka utama: tampilan GAMBAR (benda & tujuan yang disentuh) atau tampilan DAFTAR
 * (teks sederhana, setara untuk keyboard & pembaca layar); keduanya memakai susunan, draf, dan penilaian yang sama, dan
 * berpindah tampilan tidak menghapus susunan. Tampilan gambar gagal (galat render) = tampilan daftar + pesan singkat.
 *
 * Susunan = MissionAnswer misi sintetis; disimpan sebagai draf per kunjungan (muat ulang = kembali), dihapus saat dikirim.
 * Kirim = SATU aksi mesin 'aktivitas' (pemetaan `langsung` ke alternatif naskah), tanpa kuis kedua.
 */
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Bahasa } from '@shared/bahasa';
import type { MissionAnswer } from '@shared/types';
import { Arrow } from '../../../components/PlayerShell';
import { sanitizeDraft } from '../../../game/draft';
import { t } from '../../../i18n';
import { barisTerlihat } from '../../mesin';
import { bacaDrafAktivitas, hapusDrafAktivitas, kunjunganAktivitas, simpanDrafAktivitas } from '../../simpan';
import type { Episode, KunciTeks, NodeAktivitas, StateCerita } from '../../tipe';
import { KartuFakta, Kutipan } from '../bagianHp';
import { KUERI_CANGKANG_LAYAR, SlotKepalaArena, SlotKirimArena, useKueri } from '../cangkang';
import { jawabanKirim } from './logika';
import { ArenaPolaBandingkan } from './ArenaBandingkan';
import { ArenaPolaBundel, lupakanLangkahArena } from './ArenaBundel';
import { ArenaPolaPesan } from './ArenaPesan';
import { ArenaPolaRambu } from './ArenaRambu';
import { ArenaPolaSim } from './ArenaSim';
import { ArenaPolaSusun } from './ArenaSusun';
import { ArenaPolaTujuan } from './ArenaTujuan';
import type { PropsPola } from './pola';

/** Pilihan tampilan gambar / daftar pemain, berlaku untuk semua arena (juga meja kasus prototipe). */
const KUNCI_TAMPILAN = 'raksa:cerita:tampilan-arena';
export function bacaTampilan(): 'gambar' | 'daftar' {
  try { return localStorage.getItem(KUNCI_TAMPILAN) === 'daftar' ? 'daftar' : 'gambar'; } catch { return 'gambar'; }
}
export function simpanTampilan(v: 'gambar' | 'daftar'): void {
  try { localStorage.setItem(KUNCI_TAMPILAN, v); } catch { /* preferensi saja */ }
}

/** Ada susunan tersimpan untuk kunjungan aktivitas ini (arena dibuka langsung saat halaman dimuat ulang). */
export function adaDrafArena(ep: Episode, state: StateCerita): boolean {
  const d = bacaDrafAktivitas(ep.id, kunjunganAktivitas(state));
  return !!d && typeof d === 'object' && Object.keys(d as object).length > 0;
}

export function Arena({ ep, state, node, bahasa, tx, namaPemain, onKirim, onKembali }: {
  ep: Episode;
  state: StateCerita;
  node: NodeAktivitas;
  bahasa: Bahasa;
  tx: (k: KunciTeks, param?: Record<string, string | number>) => string;
  namaPemain: string;
  onKirim: (jawaban: MissionAnswer) => void;
  onKembali: () => void;
}) {
  const def = ep.aktivitas[node.aktivitas]!;
  const konfig = def.arena!;
  const misi = useMemo(() => def.misi(bahasa), [def, bahasa]);
  const [kunjungan] = useState(() => kunjunganAktivitas(state));
  const [jawaban, setJawaban] = useState<MissionAnswer>(() => sanitizeDraft(misi, bacaDrafAktivitas(ep.id, kunjungan)));
  useEffect(() => { simpanDrafAktivitas(ep.id, kunjungan, jawaban); }, [ep.id, kunjungan, jawaban]);
  const [tampilan, setTampilan] = useState<'gambar' | 'daftar'>(bacaTampilan);
  const [gagal, setGagal] = useState(false);
  const daftar = tampilan === 'daftar' || gagal;
  const pengantar = barisTerlihat(ep, state, node);
  // Kalimat tokoh pemberi tugas. Narasi tidak diulang: baru saja dibaca di adegan/obrolan tepat sebelum tugas.
  const kutipan = [...pengantar].reverse().find((b) => b.siapa !== 'narasi' && Object.prototype.hasOwnProperty.call(ep.pemeran, b.siapa)) ?? null;
  // Tokoh yang memberi tugas = tokoh yang dipindah (Mas Rudi di peta): kalimatnya tampil di kartu tokoh itu, tidak dua kali.
  const kutipanDiPola = (!daftar && konfig.pola === 'tujuan' && !!kutipan && konfig.benda.tokoh?.id === kutipan.siapa) || ((konfig.pola === 'rambu' || konfig.pola === 'sim') && !!kutipan);
  // Fakta tampil sebagai kartu, kecuali pola yang menampilkannya sendiri (isi bundel) atau gambar yang sudah memuatnya.
  const faktaKartu = konfig.pola === 'bundel' || konfig.pola === 'rambu' || (konfig.fakta?.hanyaDaftar && !daftar) ? undefined : konfig.fakta;
  // Pola susun: briefing sudah dibaca di obrolan/adegan tepat sebelum tugas, jadi konteks langsung diringkas: catatan fakta
  // kunci tetap terlihat + "Pesan & info tugas" (kutipan & cerita) yang bisa dibuka; benda aktif, pertanyaan, dan semua
  // wadah jadi pusat layar HP. Isi konteks tidak hilang, hanya dilipat.
  // K10 juga: satu persoalan aktif jadi pusat layar; kutipan, cerita, dan fakta pokok dilipat (prototipe Claude Design).
  const ringkas = konfig.pola === 'susun' || konfig.pola === 'bandingkan' || (konfig.pola === 'tujuan' && (konfig.gaya === 'rencana' || konfig.gaya === 'teruskan') && !daftar) || konfig.pola === 'bundel';
  // Fakta kunci tidak diulang saat benda yang keterangannya sudah memuatnya sedang aktif (mis. kartu surat polisi).
  const [aktifSusun, setAktifSusun] = useState<string | null>(null);
  // Meja K02 (tampilan gambar): fakta catatan dibaca di kartu bendanya sendiri saat relevan, tidak menumpuk di atas meja.
  const catatanTampil = !!konfig.catatan && !(konfig.pola === 'tujuan' && konfig.gaya === 'rencana' && !daftar) && !(konfig.catatanBenda && (aktifSusun === konfig.catatanBenda || (konfig.pola === 'susun' && konfig.gaya === 'baki' && !daftar)));
  // T-020 batch 2 (K07, K09, K10): di cangkang HP info tugas yang terlipat dibuka lewat tab "Info tugas" di baris judul (tidak
  // memakan satu baris di atas papan). Isinya sama (kutipan, cerita, fakta); di desktop tetap <details> biasa.
  const tabInfo = ringkas && !daftar && (konfig.pola === 'bandingkan' || konfig.pola === 'bundel' || (konfig.pola === 'tujuan' && (konfig.gaya === 'rencana' || konfig.gaya === 'teruskan')) || (konfig.pola === 'susun' && konfig.gaya === 'papan'));
  const [infoBuka, setInfoBuka] = useState(false);
  const gulirRef = useRef<HTMLDivElement>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    judulRef.current?.focus({ preventScroll: true });
  }, []);

  const kirim = () => {
    hapusDrafAktivitas(ep.id);
    lupakanLangkahArena();
    onKirim(jawabanKirim(konfig, jawaban));
  };
  const props: PropsPola = { ep, misi, jawaban, ubah: setJawaban, daftar, tx, labelKirim: tx(def.labelKirim), onKirim: kirim, namaPemain, kutipan: kutipanDiPola ? kutipan : null, onAktif: setAktifSusun, kunjungan };
  const ganti = () => {
    const v = daftar ? 'gambar' : 'daftar';
    setTampilan(v);
    setGagal(false);
    simpanTampilan(v);
  };

  // T-018 Tahap 2 (D-133): di cangkang HP pertanyaan (dan baris rambu K08) disematkan di bawah kepala aktivitas, tombol kirim di
  // bilah bawah, dan sisanya SATU penggulir (.hp-arena-gulir; di desktop display: contents = tata letak lama).
  const cangkang = useKueri(KUERI_CANGKANG_LAYAR);
  const [slotKepala, setSlotKepala] = useState<HTMLDivElement | null>(null);
  const [slotKirim, setSlotKirim] = useState<HTMLDivElement | null>(null);

  return (
    <SlotKepalaArena.Provider value={cangkang ? slotKepala : null}><SlotKirimArena.Provider value={cangkang ? slotKirim : null}>
    <div className="hp-arena" data-pola={konfig.pola} data-tampilan={daftar ? 'daftar' : 'gambar'} data-tab-info={tabInfo ? '' : undefined}>
      <header className="hp-arena-kepala">
        <button type="button" className="hp-arena-kembali" onClick={onKembali}><Arrow back /><span className="hp-arena-kembali-penuh">{t('ceritaHp.kembaliCerita')}</span><span className="hp-arena-kembali-pendek" aria-hidden="true">{t('ceritaHp.kembali')}</span></button>
        <p className="hp-arena-tugas">{t('ceritaHp.tugas')}</p>
        <h2 ref={judulRef} tabIndex={-1} className="hp-arena-judul">{misi.title}</h2>
        {tabInfo ? (
          <button type="button" className="hp-arena-info" data-info-tugas="" aria-expanded={infoBuka} onClick={() => { setInfoBuka(!infoBuka); if (gulirRef.current) gulirRef.current.scrollTop = 0; }}>
            <span aria-hidden="true">≡</span>{t('ceritaHp.infoTugas')}
          </button>
        ) : null}
      </header>
      <div ref={setSlotKepala} className="hp-arena-sematan" />
      <div ref={gulirRef} className="hp-arena-gulir" data-gulir-arena="">
      {konfig.pola === 'rambu' || konfig.pola === 'sim' || (konfig.pola === 'bundel' && !(cangkang && tabInfo)) ? null : <div className="hp-arena-konteks" data-ringkas={ringkas ? '' : undefined}>
        {ringkas ? (
          <>
            {catatanTampil ? <p className="hp-konteks-catatan">{tx(konfig.catatan!)}</p> : null}
            <details className="hp-tahu" open={tabInfo ? infoBuka : undefined} onToggle={tabInfo ? (e) => setInfoBuka(e.currentTarget.open) : undefined}>
              <summary>{t('ceritaHp.konteksLengkap')}</summary>
              <Kutipan ep={ep} baris={kutipan} tx={tx} namaPemain={namaPemain} />
              <p>{misi.story}</p>
              <KartuFakta ep={ep} misi={misi} fakta={faktaKartu} tx={tx} />
            </details>
          </>
        ) : (
          <>
            {!kutipanDiPola ? <Kutipan ep={ep} baris={kutipan} tx={tx} namaPemain={namaPemain} /> : null}
            {/* Fakta tugas (satu-dua kalimat) terlihat di dekat keputusan, tidak dilipat. */}
            <p className="hp-konteks-cerita">{misi.story}</p>
            <KartuFakta ep={ep} misi={misi} fakta={faktaKartu} tx={tx} />
          </>
        )}
      </div>}
      {gagal ? <p className="hp-arena-gagal" role="status">{t('ceritaHp.gagalVisual')}</p> : null}
      <BatasArena key={daftar ? 'daftar' : 'gambar'} onGagal={() => { if (!daftar) setGagal(true); }}>
        {konfig.pola === 'susun' ? <ArenaPolaSusun {...props} konfig={konfig} />
          : konfig.pola === 'tujuan' ? <ArenaPolaTujuan {...props} konfig={konfig} />
            : konfig.pola === 'bandingkan' ? <ArenaPolaBandingkan {...props} konfig={konfig} />
              : konfig.pola === 'bundel' ? <ArenaPolaBundel {...props} konfig={konfig} />
                : konfig.pola === 'rambu' ? <ArenaPolaRambu {...props} konfig={konfig} />
                  : konfig.pola === 'sim' ? <ArenaPolaSim {...props} konfig={konfig} />
                  : <ArenaPolaPesan {...props} konfig={konfig} />}
      </BatasArena>
      {konfig.pola === 'rambu' || konfig.pola === 'sim' ? null : (
        <p className="hp-arena-alih">
          <button type="button" className="hp-tautan" onClick={ganti}>{daftar ? t('ceritaHp.tampilanVisual') : t('ceritaHp.tampilanDaftar')}</button>
        </p>
      )}
      </div>
      <div ref={setSlotKirim} className="hp-arena-kirim" />
    </div>
    </SlotKirimArena.Provider></SlotKepalaArena.Provider>
  );
}

/** Galat saat menggambar tampilan gambar: pindah ke tampilan daftar (susunan tetap, ada di state Arena). */
class BatasArena extends Component<{ children: ReactNode; onGagal: () => void }, { galat: boolean }> {
  state = { galat: false };
  static getDerivedStateFromError() { return { galat: true }; }
  componentDidCatch(e: unknown) {
    if (import.meta.env?.DEV) console.warn('Arena gagal digambar; memakai tampilan daftar.', e);
    this.props.onGagal();
  }
  render() { return this.state.galat ? null : this.props.children; }
}
