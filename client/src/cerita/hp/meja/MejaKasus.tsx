/**
 * MEJA KASUS (PROTOTIPE K11, D-68; build VITE_MEJA_KASUS=1): babak bundel pengajuan sebagai pekerjaan di meja.
 *
 *  - PERIKSA: ketuk map -> map terbuka (bidikan dekat Phaser) dengan kartu tiap kelompok berkas; ketuk kartu = panel
 *    berkas (fakta naskah). Slot yang tidak ada di map tampil apa adanya ("Belum tersedia"); berkas tersedia yang belum
 *    dibuka = "Belum diperiksa". Membuka semua berkas TIDAK diwajibkan.
 *  - TINDAKAN: "Pindahkan map" (atau dari map terbuka) -> tempat di meja menyala dengan arti tindakannya -> ketuk tempat:
 *    papan kelengkapan (lengkapi dulu), baki Komite (ajukan sekarang), kontak nasabah (minta persetujuannya). Ketuk tempat
 *    tanpa memilih map = panel tempat itu dengan "Taruh map di sini". Penempatan = rencana (draf), bisa dipindah lagi.
 *  - KABAR: ketuk kontak -> panel kontak: pilihan pesan + pratinjau "belum dikirim", atau sengaja tidak mengabari.
 *  - KONFIRMASI: ringkasan tindakan berkas & kabar (masing-masing bisa diubah) -> SATU aksi mesin 'aktivitas'.
 *  Satu sumber state: draf meja (logika.ts) -> pandang Phaser, lapisan tombol HTML (keyboard / pembaca layar), tampilan
 *  daftar (pilihan sendiri atau engine gagal), dan panel. Tidak ada umpan balik benar/salah sebelum konfirmasi.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Bahasa } from '@shared/bahasa';
import type { MissionAnswer } from '@shared/types';
import { Arrow } from '../../../components/PlayerShell';
import { sanitizeDraft } from '../../../game/draft';
import { gerakDikurangi, pantauGerak } from '../../../gerak';
import { t } from '../../../i18n';
import { Modal } from '../../../ui/kit';
import { bacaDrafAktivitas, hapusDrafAktivitas, kunjunganAktivitas, simpanDrafAktivitas } from '../../simpan';
import type { Episode, KunciTeks, NodeAktivitas, StateCerita, TempatMeja } from '../../tipe';
import { GambarSeni } from '../../ui/gambarIlustrasi';
import { bacaTampilan, simpanTampilan } from '../arena/Arena';
import type { ArenaBundel } from '../arena/logika';
import { panahUbin } from '../arena/pola';
import {
  bacaMeja, drafSimpan, jalankanMeja, jawabanKonfirmasi, kabarKini, kabarTanpaPesan, kurangKonfirmasi, petunjukMeja,
  statusBerkas, tempatKini, tindakanDiTempat, tindakanKini, type AksiMeja, type MejaDraf, type StatusBerkas,
} from './logika';
import type { KataMeja, PandangMeja } from './MejaScene';
import { PanggungMeja, type StatusPanggung } from './PanggungMeja';
import { PotretPikselHp } from '../../ui/latar/piksel/PotretPikselHp';
import { tokohPotret } from '../../ui/latar/piksel/potret';
import { OBJEK, kotakKartu, kotakMapDi, persen, type ObjekMeja } from './tata';
import './meja.css';

/**
 * Klik "hantu": sentuhan yang diketuk di kanvas (Phaser bereaksi saat jari diangkat) masih diikuti klik tiruan peramban
 * di titik yang sama, yang bisa mengenai panel / tombol yang BARU muncul di sana (mis. pilihan kabar). Klik apa pun di
 * luar kanvas dalam jeda ini sesudah ketukan kanvas ditelan (fase tangkap).
 */
const JEDA_KLIK_HANTU_MS = 350;

type Panel = { jenis: 'berkas'; id: string } | { jenis: 'tempat'; tempat: 'komite' | 'papan' } | { jenis: 'kontak' } | { jenis: 'konfirmasi' };
type Tx = (k: KunciTeks, param?: Record<string, string | number>) => string;

/** Fakta kelengkapan dari tabel skenario: label & ada/belum per baris (urut berkas). */
export function kelengkapanMeja(konfig: ArenaBundel, misi: { tables?: { id: string; title: string; note?: string; rows: { label: string; value: string }[] }[] }, tx: Tx) {
  const tabel = (konfig.fakta?.tabel && misi.tables?.find((x) => x.id === konfig.fakta!.tabel)) || null;
  const baris = tabel?.rows.map((r) => ({ label: r.label, ada: r.value === tx('akt.bundel.tabel.ada') })) ?? [];
  return { tabel, baris, ada: baris.map((r) => r.ada), tersedia: baris.filter((r) => r.ada).length };
}

/** Kata adegan (bahasa aktif) yang sama untuk meja kerja & meja hasil. */
export function kataMeja(konfig: ArenaBundel, ep: Episode, tx: Tx, hitung: { n: number; total: number }, status: string): KataMeja {
  const m = konfig.meja!;
  const nasabah = tx(ep.pemeran[ep.nasabah ?? '']?.nama ?? '');
  const aksi = (tempat: TempatMeja) => {
    const id = tindakanDiTempat(konfig, tempat);
    const p = konfig.tindakan.pilihan.find((x) => x.id === id);
    const singkat = id ? m.tindakan[id]?.singkat : undefined;
    return singkat ? tx(singkat) : p ? tx(p.label) : '';
  };
  return {
    objek: { map: tx(m.objek.map), komite: tx(m.objek.komite), papan: tx(m.objek.papan), kontak: nasabah },
    aksi: { komite: aksi('komite'), papan: aksi('papan'), kontak: aksi('kontak') },
    mapDipilih: t('ceritaHp.mejaMapDipilih'),
    rencana: t('ceritaHp.mejaRencana'),
    draf: t('ceritaHp.mejaDraf'),
    tanpaKabar: t('ceritaHp.mejaTanpaKabar'),
    terkirim: t('ceritaHp.mejaTerkirim'),
    belumDikabari: t('ceritaHp.mejaBelumDikabari'),
    statusJudul: t('ceritaHp.mejaStatusJudul'),
    status,
    berkas: Object.fromEntries(m.berkas.map((b) => [b.id, tx(b.singkat)])),
    statusBerkas: { 'belum-diperiksa': t('ceritaHp.mejaBelumDiperiksa'), diperiksa: t('ceritaHp.mejaDiperiksa'), 'belum-tersedia': t('ceritaHp.belumTersedia') },
    isiMap: t('ceritaHp.mejaIsiMap'),
    hitung: t('ceritaHp.hitungKelompok', hitung),
    dikembalikan: t('ceritaHp.mejaDikembalikan'),
  };
}

export function useGerak(): boolean {
  const [gerak, setGerak] = useState(() => !gerakDikurangi());
  useEffect(() => pantauGerak(() => setGerak(!gerakDikurangi())), []);
  return gerak;
}

export default function MejaKasus({ ep, state, node, bahasa, tx, onKirim, onKembali }: {
  ep: Episode;
  state: StateCerita;
  node: NodeAktivitas;
  bahasa: Bahasa;
  tx: Tx;
  namaPemain: string;
  onKirim: (jawaban: MissionAnswer) => void;
  onKembali: () => void;
}) {
  const def = ep.aktivitas[node.aktivitas]!;
  const konfig = def.arena as ArenaBundel;
  const meja = konfig.meja!;
  const misi = useMemo(() => def.misi(bahasa), [def, bahasa]);
  const [kunjungan] = useState(() => kunjunganAktivitas(state));
  const [m, setM] = useState<MejaDraf>(() => {
    const mentah = bacaDrafAktivitas(ep.id, kunjungan);
    return bacaMeja(konfig, mentah, sanitizeDraft(misi, mentah));
  });
  const terkirim = useRef(false);
  useEffect(() => { if (!terkirim.current) simpanDrafAktivitas(ep.id, kunjungan, drafSimpan(m)); }, [ep.id, kunjungan, m]);
  const aksi = useCallback((a: AksiMeja) => setM((x) => jalankanMeja(konfig, x, a)), [konfig]);

  const [angkat, setAngkat] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [umum, setUmum] = useState('');
  const [tampilan, setTampilan] = useState<'gambar' | 'daftar'>(bacaTampilan);
  const [mesin, setMesin] = useState<StatusPanggung>('muat');
  const daftar = tampilan === 'daftar' || mesin === 'gagal';
  const gerak = useGerak();

  const nasabah = tx(ep.pemeran[ep.nasabah ?? '']?.nama ?? '');
  const { tabel, baris, ada, tersedia } = kelengkapanMeja(konfig, misi, tx);
  const hitung = { n: tersedia, total: baris.length };
  const tindakan = tindakanKini(konfig, m);
  const kabar = kabarKini(konfig, m);
  const tempat = tempatKini(konfig, m);
  const pTindakan = konfig.tindakan.pilihan.find((x) => x.id === tindakan) ?? null;
  const pKabar = konfig.kabar.pilihan.find((x) => x.id === kabar) ?? null;
  const tanpaPesan = kabarTanpaPesan(konfig, kabar);
  const status = statusBerkas(konfig, m, ada);
  const petunjuk = petunjukMeja(konfig, m);
  const kurang = kurangKonfirmasi(konfig, m);
  const seniBerkas = useMemo(() => Object.fromEntries(meja.berkas.map((b) => [b.id, b.seni])), [meja]);
  const namaTempat = (tp: TempatMeja) => (tp === 'kontak' ? nasabah : tx(meja.objek[tp]));

  const kata = useMemo(() => kataMeja(konfig, ep, tx, hitung, tx(meja.statusAwal)), [konfig, ep, tx, hitung.n, hitung.total, meja]);
  const aktif = panel?.jenis === 'berkas' ? `berkas:${panel.id}` : panel?.jenis === 'tempat' ? panel.tempat : panel?.jenis === 'kontak' ? 'kontak' : null;
  const sorot: ObjekMeja[] = m.fokus === 'map' ? [] : petunjuk === 'periksa' ? ['map'] : petunjuk === 'kabar' ? ['kontak'] : [];
  const pandang: PandangMeja = useMemo(() => ({
    fokus: m.fokus, angkat, tempat, kabar: kabar ? (tanpaPesan ? 'tanpa' : 'draf') : null, berkas: status, sorot, aktif, hasil: null, gerak, kata,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [m, angkat, tempat, kabar, tanpaPesan, JSON.stringify(status), sorot.join(), aktif, gerak, kata]);

  // ---- aksi pemain (ketukan Phaser, tombol HTML, tampilan daftar: semuanya lewat sini)
  const umumkanRencana = (tp: TempatMeja) => {
    const id = tindakanDiTempat(konfig, tp);
    const p = konfig.tindakan.pilihan.find((x) => x.id === id);
    if (p) setUmum(t('ceritaHp.mejaUmumRencana', { tindakan: tx(p.label), tempat: namaTempat(tp) }));
  };
  const taruh = (tp: TempatMeja) => {
    aksi({ jenis: 'taruh', tempat: tp });
    setAngkat(false);
    umumkanRencana(tp);
  };
  const mulaiPindah = () => {
    aksi({ jenis: 'tutup-map' });
    setAngkat(true);
    setUmum(t('ceritaHp.mejaUmumAngkat'));
  };
  const bukaBerkas = (id: string) => {
    aksi({ jenis: 'periksa', berkas: id });
    setPanel({ jenis: 'berkas', id });
  };
  const ketukKanvas = useRef(-Infinity);
  useEffect(() => {
    const telan = (e: MouseEvent) => {
      if (performance.now() - ketukKanvas.current > JEDA_KLIK_HANTU_MS) return;
      if (e.target instanceof HTMLCanvasElement && e.target.dataset.raksaMeja) return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener('click', telan, true);
    return () => document.removeEventListener('click', telan, true);
  }, []);
  const ketukDariKanvas = (id: string) => {
    ketukKanvas.current = performance.now();
    ketuk(id);
  };
  const ketuk = (id: string) => {
    if (id.startsWith('berkas:')) { bukaBerkas(id.slice(7)); return; }
    if (id === 'map') {
      if (angkat) { setAngkat(false); setUmum(t('ceritaHp.mejaUmumBatal')); return; }
      aksi({ jenis: 'buka-map' });
      setUmum(t('ceritaHp.mejaUmumBuka', hitung));
      return;
    }
    const tp = id as TempatMeja;
    if (angkat) { taruh(tp); return; }
    setPanel(tp === 'kontak' ? { jenis: 'kontak' } : { jenis: 'tempat', tempat: tp });
  };

  // Fokus keyboard mengikuti fokus meja/map (tombol objek pertama yang relevan), tanpa menggulir.
  const lapisRef = useRef<HTMLDivElement>(null);
  const fokusLalu = useRef(m.fokus);
  useEffect(() => {
    if (fokusLalu.current === m.fokus) return;
    fokusLalu.current = m.fokus;
    const tujuan = m.fokus === 'map' ? '[data-meja-judul-map]' : '[data-meja-sasaran="map"]';
    requestAnimationFrame(() => document.querySelector<HTMLElement>(tujuan)?.focus({ preventScroll: true }));
  }, [m.fokus]);

  const judulRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    judulRef.current?.focus({ preventScroll: true });
  }, []);

  const konfirmasi = () => {
    if (terkirim.current || kurang) return;
    terkirim.current = true;
    hapusDrafAktivitas(ep.id);
    setPanel(null);
    onKirim(jawabanKonfirmasi(konfig, m));
  };
  const ganti = () => {
    const v = daftar ? 'gambar' : 'daftar';
    setTampilan(v);
    simpanTampilan(v);
    if (mesin === 'gagal' && v === 'gambar') setMesin('muat');
    setAngkat(false);
  };
  const kembaliKe = (id: string) => () => document.querySelector<HTMLElement>(`[data-meja-sasaran="${id}"]`) ?? document.querySelector<HTMLElement>('[data-meja-utama]');

  // ---- bar langkah berikutnya (tombol utama = langkah berikutnya; lainnya sekunder)
  const tombolUtama: { label: string; aksi: () => void } | null = daftar
    ? null
    : m.fokus === 'map' ? { label: t('ceritaHp.mejaPindahkan'), aksi: mulaiPindah }
      : angkat ? null
        : petunjuk === 'periksa' ? { label: t('ceritaHp.mejaBukaMap'), aksi: () => ketuk('map') }
          : petunjuk === 'tindakan' ? { label: t('ceritaHp.mejaPindahkan'), aksi: mulaiPindah }
            : petunjuk === 'kabar' ? { label: t('ceritaHp.mejaPilihKabar', { nama: nasabah }), aksi: () => setPanel({ jenis: 'kontak' }) }
              : { label: t('ceritaHp.mejaTinjau'), aksi: () => setPanel({ jenis: 'konfirmasi' }) };
  const teksPetunjuk = angkat ? t('ceritaHp.mejaPetunjukAngkat')
    : m.fokus === 'map' ? t('ceritaHp.mejaPetunjukMap')
      : petunjuk === 'periksa' ? t('ceritaHp.mejaPetunjukPeriksa')
        : petunjuk === 'tindakan' ? t('ceritaHp.mejaPetunjukTindakan')
          : petunjuk === 'kabar' ? t('ceritaHp.mejaPetunjukKabar', { nama: nasabah })
            : t('ceritaHp.mejaPetunjukKonfirmasi');

  const labelObjek = (id: ObjekMeja): string => {
    if (id === 'map') {
      const isi = m.mapDibuka ? t('ceritaHp.hitungKelompok', hitung) : t('ceritaHp.mejaMapBelumDibuka');
      const rencana = pTindakan ? `${t('ceritaHp.mejaRencana')}: ${tx(pTindakan.label)}` : '';
      return [tx(meja.objek.map), isi, rencana, angkat ? t('ceritaHp.mejaMapDipilih') : ''].filter(Boolean).join('. ');
    }
    if (angkat) return `${namaTempat(id)}: ${kata.aksi[id]}. ${t('ceritaHp.mejaTaruhDiSini')}`;
    if (id === 'kontak') return `${t('ceritaHp.mejaKontak', { nama: nasabah })}. ${pKabar ? (tanpaPesan ? t('ceritaHp.mejaTanpaKabar') : t('ceritaHp.mejaDraf')) : t('ceritaHp.mejaBelumDipilih')}`;
    return `${namaTempat(id)}${tempat === id ? `. ${t('ceritaHp.mejaRencana')}: ${pTindakan ? tx(pTindakan.label) : ''}` : ''}`;
  };

  return (
    <div className="hp-arena meja" data-pola="meja" data-tampilan={daftar ? 'daftar' : 'gambar'} data-fokus={m.fokus} data-angkat={angkat ? '' : undefined}>
      <header className="meja-kepala">
        <button type="button" className="meja-kembali" onClick={onKembali} aria-label={t('ceritaHp.kembaliCerita')}><Arrow back /></button>
        <h2 ref={judulRef} tabIndex={-1} className="meja-judul"><span className="hp-arena-tugas">{t('ceritaHp.tugas')}</span> {misi.title}</h2>
      </header>
      <p className="sr-only" role="status" aria-live="polite">{umum}</p>

      {daftar ? (
        <MejaDaftar
          konfig={konfig} tx={tx} nasabah={nasabah} baris={baris} status={status} hitung={hitung} tindakan={tindakan}
          namaTempat={namaTempat} kabarLabel={pKabar ? (tanpaPesan ? tx(pKabar.label) : `${t('ceritaHp.mejaDraf')}: ${tx(pKabar.label)}`) : t('ceritaHp.mejaBelumDipilih')}
          onBerkas={bukaBerkas} onTindakan={(id) => { const tp = meja.tindakan[id]?.tempat; if (tp) taruh(tp); }} onKontak={() => setPanel({ jenis: 'kontak' })}
          gagal={mesin === 'gagal' && tampilan === 'gambar'}
        />
      ) : (
        <PanggungMeja ep={ep} seniBerkas={seniBerkas} pandang={pandang} onKetuk={ketukDariKanvas} onStatus={setMesin}>
          <div className="meja-lapis" ref={lapisRef}>
            {m.fokus === 'map' ? (
              <>
                <h3 className="sr-only" tabIndex={-1} data-meja-judul-map="">{`${tx(meja.objek.map)}: ${t('ceritaHp.hitungKelompok', hitung)}`}</h3>
                {meja.berkas.map((b, i) => (
                  <button key={b.id} type="button" className="meja-sasaran" data-meja-sasaran={`berkas:${b.id}`} style={persen(kotakKartu(i))}
                    aria-label={`${baris[i]?.label ?? tx(b.singkat)}. ${kata.statusBerkas[status[i]!.status]}`} onClick={() => ketuk(`berkas:${b.id}`)} />
                ))}
              </>
            ) : (
              (['map', 'komite', 'kontak', 'papan'] as const).map((id) => (
                <button key={id} type="button" className="meja-sasaran" data-meja-sasaran={id} style={persen(id === 'map' ? kotakMapDi(tempat) : OBJEK[id])}
                  aria-label={labelObjek(id)} aria-pressed={id === 'map' ? angkat : undefined} onClick={() => ketuk(id)} />
              ))
            )}
          </div>
        </PanggungMeja>
      )}

      {/* Bar lengket: petunjuk + aksi sekunder di kiri, tombol utama (langkah berikutnya) di kanan; satu baris di HP. */}
      <div className="meja-bar" data-meja-bar="" data-daftar={daftar ? '' : undefined}>
        {daftar ? (
          <>
            <button type="button" className="primary-action meja-utama" data-meja-utama="" disabled={!!kurang} aria-describedby={kurang ? 'meja-kurang' : undefined} onClick={() => setPanel({ jenis: 'konfirmasi' })}>{t('ceritaHp.mejaTinjau')} <Arrow /></button>
            {kurang ? <p id="meja-kurang" className="hp-kirim-belum">{kurang === 'tindakan' ? t('ceritaHp.mejaKurangTindakan') : t('ceritaHp.mejaKurangKabar', { nama: nasabah })}</p> : null}
          </>
        ) : (
          <>
            <div className="meja-bar-teks">
              <p className="meja-petunjuk"><b>{t('ceritaHp.mejaLangkah')}</b> {teksPetunjuk}</p>
              {m.fokus === 'map' ? <button type="button" className="hp-tautan meja-sekunder" onClick={() => aksi({ jenis: 'tutup-map' })}>{t('ceritaHp.mejaKembaliMeja')}</button> : null}
              {angkat ? <button type="button" className="hp-tautan meja-sekunder" onClick={() => { setAngkat(false); setUmum(t('ceritaHp.mejaUmumBatal')); }}>{t('ceritaHp.mejaBatalPindah')}</button> : null}
              {m.fokus === 'meja' && !angkat && tindakan && petunjuk !== 'tindakan' ? <button type="button" className="hp-tautan meja-sekunder" onClick={mulaiPindah}>{t('ceritaHp.mejaPindahkan')}</button> : null}
            </div>
            {tombolUtama ? <button type="button" className="primary-action meja-utama" data-meja-utama="" onClick={tombolUtama.aksi}>{tombolUtama.label} <Arrow /></button> : null}
          </>
        )}
      </div>
      <p className="hp-arena-alih">
        <button type="button" className="hp-tautan" onClick={ganti}>{daftar ? t('ceritaHp.tampilanVisual') : t('ceritaHp.tampilanDaftar')}</button>
      </p>

      {panel?.jenis === 'berkas' ? (
        <PanelBerkas
          ep={ep} tx={tx} judul={baris[meja.berkas.findIndex((b) => b.id === panel.id)]?.label ?? panel.id}
          berkas={meja.berkas.find((b) => b.id === panel.id)!} status={status.find((s) => s.id === panel.id)!.status}
          catatan={panel.id === 'tender' ? tabel?.note : undefined} hitung={hitung}
          onTutup={() => setPanel(null)} kembaliKe={kembaliKe(`berkas:${panel.id}`)}
        />
      ) : null}
      {panel?.jenis === 'tempat' ? (() => {
        const id = tindakanDiTempat(konfig, panel.tempat);
        const p = konfig.tindakan.pilihan.find((x) => x.id === id)!;
        const di = tempat === panel.tempat;
        return (
          <Modal judul={namaTempat(panel.tempat)} gaya="lembar" lebar={520} onTutup={() => setPanel(null)} kembaliKe={kembaliKe(panel.tempat)}
            aksi={(
              <>
                <button type="button" className="btn btn-netral" onClick={() => setPanel(null)}>{t('ceritaHp.mejaKembaliMeja')}</button>
                {di
                  ? <button type="button" className="btn btn-utama" onClick={() => { setPanel(null); mulaiPindah(); }}>{t('ceritaHp.mejaPindahkan')}</button>
                  : <button type="button" className="btn btn-utama" data-meja-taruh="" onClick={() => { setPanel(null); taruh(panel.tempat); }}>{t('ceritaHp.mejaTaruhDiSini')}</button>}
              </>
            )}>
            <div className="meja-tempat">
              <GambarSeni ep={ep} id={p.seni} className="meja-tempat-seni" />
              <div>
                <p className="meja-tempat-label">{di ? t('ceritaHp.mejaRencanaDiSini') : t('ceritaHp.mejaBilaDitaruh')}</p>
                <p><b>{tx(p.label)}</b>{p.arti ? <span> — {tx(p.arti)}</span> : null}</p>
                {di ? <p className="meja-catatan">{t('ceritaHp.mejaBelumDijalankan')}</p> : null}
              </div>
            </div>
          </Modal>
        );
      })() : null}
      {panel?.jenis === 'kontak' ? (
        <PanelKontak ep={ep} konfig={konfig} tx={tx} nasabah={nasabah} kabar={kabar}
          onPilih={(id) => { aksi({ jenis: 'kabar', kabar: id }); }} onTutup={() => setPanel(null)} kembaliKe={kembaliKe('kontak')} />
      ) : null}
      {panel?.jenis === 'konfirmasi' && pTindakan && pKabar ? (
        <Modal judul={t('ceritaHp.mejaRingkasan')} gaya="lembar" lebar={520} onTutup={() => setPanel(null)} kembaliKe={() => document.querySelector<HTMLElement>('[data-meja-utama]')}
          aksi={(
            <>
              <button type="button" className="btn btn-netral" onClick={() => setPanel(null)}>{t('ceritaHp.mejaKembaliMeja')}</button>
              <TombolKonfirmasiMeja label={tanpaPesan ? tx('arena.bundel.konfirmasiTanpa') : tx('arena.bundel.konfirmasiKirim')} onKonfirmasi={konfirmasi} />
            </>
          )}>
          <div className="meja-ringkas">
            <section>
              <h4>{t('ceritaHp.mejaTindakanBerkas')}</h4>
              <p><b>{tx(pTindakan.label)}</b>{pTindakan.arti ? <span> — {tx(pTindakan.arti)}</span> : null}</p>
              <p className="meja-catatan">{t('ceritaHp.mejaDiTempat', { tempat: namaTempat(meja.tindakan[pTindakan.id]!.tempat) })}</p>
              <button type="button" className="hp-tautan" onClick={() => { setPanel(null); mulaiPindah(); }}>{t('ceritaHp.mejaUbahTindakan')}</button>
            </section>
            <section>
              <h4>{t('ceritaHp.mejaKabarUntuk', { nama: nasabah })}</h4>
              {tanpaPesan ? (
                <p className="hp-pratinjau-kosong">{tx('arena.bundel.tanpaPesan', { nama: nasabah })}</p>
              ) : (
                <figure className="hp-pratinjau">
                  <figcaption>{tx('arena.bundel.pratinjau')} · {tx('arena.bundel.untuk', { nama: nasabah })}</figcaption>
                  <p className="hp-pratinjau-gelembung">{tx(pKabar.label)}</p>
                </figure>
              )}
              <button type="button" className="hp-tautan" onClick={() => setPanel({ jenis: 'kontak' })}>{t('ceritaHp.mejaUbahKabar')}</button>
            </section>
            <p className="hp-kirim-catatan">{t('ceritaHp.konfirmasiFinal')}</p>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

/** Tombol konfirmasi akhir: sekali tekan = sekali kirim (ketukan ganda / Enter beruntun diabaikan). */
function TombolKonfirmasiMeja({ label, onKonfirmasi }: { label: string; onKonfirmasi: () => void }) {
  const sudah = useRef(false);
  const [mengirim, setMengirim] = useState(false);
  return (
    <button type="button" className="btn btn-utama" data-kirim="" disabled={mengirim}
      onClick={() => { if (sudah.current) return; sudah.current = true; setMengirim(true); onKonfirmasi(); }}>
      {label}
    </button>
  );
}

function PanelBerkas({ ep, tx, judul, berkas, status, catatan, hitung, onTutup, kembaliKe }: {
  ep: Episode;
  tx: Tx;
  judul: string;
  berkas: NonNullable<ArenaBundel['meja']>['berkas'][number];
  status: StatusBerkas;
  catatan?: string;
  hitung: { n: number; total: number };
  onTutup: () => void;
  kembaliKe: () => HTMLElement | null;
}) {
  const kosong = status === 'belum-tersedia';
  return (
    <Modal judul={judul} gaya="lembar" lebar={520} onTutup={onTutup} kembaliKe={kembaliKe}
      aksi={<button type="button" className="btn btn-utama" onClick={onTutup}>{t('ceritaHp.mejaKembaliMap')}</button>}>
      <div className="meja-berkas" data-kosong={kosong ? '' : undefined}>
        {kosong ? <span className="meja-berkas-slot" aria-hidden="true" /> : <GambarSeni ep={ep} id={berkas.seni} className="meja-berkas-seni" />}
        <div>
          <p className="meja-berkas-status"><b>{kosong ? t('ceritaHp.belumTersedia') : t('ceritaHp.tersedia')}</b>{kosong ? null : <> · {t('ceritaHp.mejaDiperiksa')}</>}</p>
          {kosong ? <p>{t('ceritaHp.mejaBelumDiMap')}</p> : berkas.rincian ? <p>{tx(berkas.rincian)}</p> : null}
          {kosong ? <p className="meja-catatan">{t('ceritaHp.mejaIsiMapHitung', hitung)}</p> : null}
          {catatan ? <p className="meja-catatan">{catatan}</p> : null}
        </div>
      </div>
    </Modal>
  );
}

function PanelKontak({ ep, konfig, tx, nasabah, kabar, onPilih, onTutup, kembaliKe }: {
  ep: Episode;
  konfig: ArenaBundel;
  tx: Tx;
  nasabah: string;
  kabar: string | null;
  onPilih: (id: string) => void;
  onTutup: () => void;
  kembaliKe: () => HTMLElement | null;
}) {
  const idTanya = useId();
  const pilihan = konfig.kabar.pilihan.find((x) => x.id === kabar) ?? null;
  const potret = tokohPotret(ep, ep.nasabah ?? '');
  return (
    <Modal judul={t('ceritaHp.mejaKontak', { nama: nasabah })} gaya="lembar" lebar={520} onTutup={onTutup} kembaliKe={kembaliKe}
      aksi={<button type="button" className="btn btn-utama" onClick={onTutup}>{t('ceritaHp.mejaKembaliMeja')}</button>}>
      <div className="meja-kontak">
        <div className="meja-kontak-kepala">
          {potret ? <PotretPikselHp tokoh={potret} ekspresi="netral" ukuran={48} label="" /> : null}
          <p id={idTanya}><b>{tx(konfig.kabar.tanya)}</b></p>
        </div>
        <div className="hp-opsi-daftar" role="radiogroup" aria-labelledby={idTanya} onKeyDown={panahUbin}>
          {konfig.kabar.pilihan.map((x, i) => {
            const aktif = x.id === kabar;
            const isi: ReactNode = x.arti ? tx(x.label) : <q>{tx(x.label)}</q>;
            return (
              <button key={x.id} type="button" role="radio" aria-checked={aktif} tabIndex={aktif || (!kabar && i === 0) ? 0 : -1}
                className={'hp-opsi hp-opsi-ikon' + (aktif ? ' dipilih' : '') + (x.arti ? '' : ' hp-opsi-pesan')} data-opsi={x.id} data-langkah={konfig.kabar.langkah}
                onClick={() => onPilih(x.id)}>
                <span className="hp-opsi-tanda" aria-hidden="true">{aktif ? <i /> : null}</span>
                <span className="hp-opsi-teks"><b>{isi}</b>{x.arti ? <span>{tx(x.arti)}</span> : null}</span>
                {aktif ? <span className="hp-ubin-tanda">{t('ceritaHp.dipilih')}</span> : null}
              </button>
            );
          })}
        </div>
        {pilihan ? (
          pilihan.arti ? (
            <p className="hp-pratinjau-kosong" role="status">{tx('arena.bundel.tanpaPesan', { nama: nasabah })}</p>
          ) : (
            <figure className="hp-pratinjau" role="status">
              <figcaption>{tx('arena.bundel.pratinjau')} · {tx('arena.bundel.untuk', { nama: nasabah })}</figcaption>
              <p className="hp-pratinjau-gelembung">{tx(pilihan.label)}</p>
            </figure>
          )
        ) : null}
      </div>
    </Modal>
  );
}

/** Tampilan daftar (tanpa engine): urutan & state yang sama, kontrol HTML biasa. */
function MejaDaftar({ konfig, tx, nasabah, baris, status, hitung, tindakan, namaTempat, kabarLabel, onBerkas, onTindakan, onKontak, gagal }: {
  konfig: ArenaBundel;
  tx: Tx;
  nasabah: string;
  baris: { label: string; ada: boolean }[];
  status: { id: string; status: StatusBerkas }[];
  hitung: { n: number; total: number };
  tindakan: string | null;
  namaTempat: (tp: TempatMeja) => string;
  kabarLabel: string;
  onBerkas: (id: string) => void;
  onTindakan: (id: string) => void;
  onKontak: () => void;
  gagal: boolean;
}) {
  const meja = konfig.meja!;
  const idT = useId();
  const statusTeks: Record<StatusBerkas, string> = { 'belum-diperiksa': t('ceritaHp.mejaBelumDiperiksa'), diperiksa: t('ceritaHp.mejaDiperiksa'), 'belum-tersedia': t('ceritaHp.belumTersedia') };
  return (
    <div className="meja-daftar">
      {gagal ? <p className="hp-arena-gagal" role="status">{t('ceritaHp.mejaGagal')}</p> : null}
      <section aria-labelledby="meja-d-map">
        <h3 id="meja-d-map">{tx(meja.objek.map)}</h3>
        <p className="meja-catatan">{t('ceritaHp.hitungKelompok', hitung)}</p>
        <ul className="meja-daftar-berkas">
          {meja.berkas.map((b, i) => (
            <li key={b.id} data-status={status[i]?.status}>
              <button type="button" data-meja-berkas={b.id} onClick={() => onBerkas(b.id)}>
                <span>{baris[i]?.label ?? tx(b.singkat)}</span>
                <b>{statusTeks[status[i]!.status]}</b>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby={idT}>
        <h3 id={idT}>{tx(konfig.tindakan.tanya)}</h3>
        <div className="hp-opsi-daftar" role="radiogroup" aria-labelledby={idT} onKeyDown={panahUbin}>
          {konfig.tindakan.pilihan.map((x, i) => {
            const aktif = x.id === tindakan;
            const tp = meja.tindakan[x.id]?.tempat;
            return (
              <button key={x.id} type="button" role="radio" aria-checked={aktif} tabIndex={aktif || (!tindakan && i === 0) ? 0 : -1}
                className={'hp-opsi hp-opsi-ikon' + (aktif ? ' dipilih' : '')} data-opsi={x.id} data-langkah={konfig.tindakan.langkah} onClick={() => onTindakan(x.id)}>
                <span className="hp-opsi-tanda" aria-hidden="true">{aktif ? <i /> : null}</span>
                <span className="hp-opsi-teks"><b>{tx(x.label)}</b><span>{x.arti ? tx(x.arti) : null}{tp ? ` (${t('ceritaHp.mejaDiTempat', { tempat: namaTempat(tp) })})` : null}</span></span>
                {aktif ? <span className="hp-ubin-tanda">{t('ceritaHp.mejaRencana')}</span> : null}
              </button>
            );
          })}
        </div>
      </section>
      <section aria-labelledby="meja-d-kabar">
        <h3 id="meja-d-kabar">{t('ceritaHp.mejaKabarUntuk', { nama: nasabah })}</h3>
        <p>{kabarLabel}</p>
        <button type="button" className="btn btn-netral" data-meja-kontak="" onClick={onKontak}>{t('ceritaHp.mejaBukaKontak', { nama: nasabah })}</button>
      </section>
    </div>
  );
}
