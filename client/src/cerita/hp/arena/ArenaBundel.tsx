/**
 * POLA BUNDEL (K11 pengajuan berkas + kabar ke nasabah): urutan pendek, SATU fokus per langkah, state keputusan yang sama
 * (jawaban {tindakan, kabar}; penilaian & pemetaan tidak berubah).
 *  A. PERIKSA BERKAS: map pengajuan sebagai objek utama (slot per kelompok berkas), hitungan "n dari total kelompok berkas
 *     tersedia", slot yang belum tersedia ditunjukkan netral (fakta, bukan jawaban), daftar lengkap bisa dibuka.
 *  B. TENTUKAN TINDAKAN: pertanyaan + pengingat fakta berkas di dekatnya + pilihan satu kolom (ikon mendukung label).
 *  C. KABARI NASABAH: ringkasan "Rencana tindakan" + Ubah, pilihan pesan (belum terkirim, bukan gelembung terkirim),
 *     pratinjau satu pesan, dan konfirmasi yang labelnya mengikuti pilihan (tanpa mengabari = tidak mengklaim mengirim).
 * Kembali ke langkah sebelumnya mempertahankan pilihan; tidak ada umpan balik benar/salah sebelum konfirmasi. Langkah yang
 * sedang dibuka disimpan per kunjungan (muat ulang = langkah yang sama). Tampilan daftar = urutan sama tanpa gambar.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { playSfx } from '../../../audio/audio';
import { Arrow } from '../../../components/PlayerShell';
import { t } from '../../../i18n';
import type { KunciTeks, TujuanArena } from '../../tipe';
import { GambarSeni, TombolKirim } from '../bagianHp';
import { pilihOpsi, type ArenaBundel } from './logika';
import { panahUbin, type PropsPola } from './pola';

type Langkah = 'periksa' | 'tindakan' | 'kabar';
const URUTAN: Langkah[] = ['periksa', 'tindakan', 'kabar'];
const KUNCI_LANGKAH = 'raksa:cerita:langkah-arena';

function bacaLangkah(kunjungan: string): Langkah | null {
  try {
    const v = JSON.parse(localStorage.getItem(KUNCI_LANGKAH) ?? 'null') as { kunjungan?: string; langkah?: string } | null;
    return v?.kunjungan === kunjungan && URUTAN.includes(v.langkah as Langkah) ? (v.langkah as Langkah) : null;
  } catch { return null; }
}
function simpanLangkah(kunjungan: string, langkah: Langkah): void {
  try { localStorage.setItem(KUNCI_LANGKAH, JSON.stringify({ kunjungan, langkah })); } catch { /* kenyamanan saja */ }
}
/** Langkah tersimpan dilupakan saat aktivitas dikirim (Arena memanggilnya bersama hapus draf). */
export function lupakanLangkahArena(): void {
  try { localStorage.removeItem(KUNCI_LANGKAH); } catch { /* abaikan */ }
}

export function ArenaPolaBundel({ ep, misi, konfig, jawaban, ubah, daftar, tx, onKirim, kunjungan }: PropsPola & { konfig: ArenaBundel }) {
  const tabel = (konfig.fakta?.tabel && misi.tables?.find((x) => x.id === konfig.fakta!.tabel)) || null;
  const baris = tabel?.rows.map((r) => ({ label: r.label, ada: r.value === tx('akt.bundel.tabel.ada') })) ?? [];
  const tersedia = baris.filter((r) => r.ada).length;
  const kosong = baris.filter((r) => !r.ada).map((r) => r.label);
  const pilihT = konfig.tindakan.pilihan.find((x) => x.id === jawaban[konfig.tindakan.langkah]) ?? null;
  const pilihK = konfig.kabar.pilihan.find((x) => x.id === jawaban[konfig.kabar.langkah]) ?? null;

  const [langkah, setLangkahMentah] = useState<Langkah>(() => {
    const v = bacaLangkah(kunjungan ?? '');
    return v === 'kabar' && !pilihT ? 'tindakan' : v ?? 'periksa';
  });
  const bagianRef = useRef<HTMLElement>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const pindah = useRef(false);
  const ke = (l: Langkah) => {
    pindah.current = true;
    setLangkahMentah(l);
    simpanLangkah(kunjungan ?? '', l);
  };
  // Langkah berganti: fokus ke judul langkah, layar ke awal langkah (di bawah kepala lengket), bukan sisa gulir lama.
  useEffect(() => {
    if (!pindah.current) return;
    pindah.current = false;
    judulRef.current?.focus({ preventScroll: true });
    bagianRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [langkah]);

  const nasabah = tx(ep.pemeran[ep.nasabah]?.nama ?? ep.nasabah);
  const nomor = URUTAN.indexOf(langkah) + 1;
  const judulLangkah = (l: Langkah) => tx(`arena.bundel.tahap.${l}`);

  return (
    <div className="hp-bundel" data-langkah={langkah}>
      <nav className="hp-tahap" aria-label={t('ceritaHp.tahapLabel')}>
        <ol>
          {URUTAN.map((l, i) => {
            const bisa = l === 'periksa' || l === 'tindakan' || !!pilihT;
            const kini = l === langkah;
            return (
              <li key={l}>
                <button type="button" className="hp-tahap-item" aria-current={kini ? 'step' : undefined} disabled={!bisa || kini} onClick={() => ke(l)} data-tahap={l}>
                  <span className="hp-tahap-no" aria-hidden="true">{i + 1}</span>
                  <span className="hp-tahap-nama">{judulLangkah(l)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section ref={bagianRef} className="hp-bundel-langkah" aria-labelledby="hp-bundel-judul" data-tahap={langkah}>
        {/* Nomor langkah sudah terlihat di penanda langkah; pembaca layar mendengarnya bersama judul. */}
        <h3 id="hp-bundel-judul" ref={judulRef} tabIndex={-1} className="hp-tanya-arena">
          <span className="sr-only">{t('ceritaHp.langkahKe', { n: nomor, total: URUTAN.length })}: </span>
          {langkah === 'periksa' ? tx('arena.bundel.pengantar') : langkah === 'tindakan' ? tx(konfig.tindakan.tanya) : tx(konfig.kabar.tanya)}
        </h3>

        {langkah === 'periksa' ? (
          <>
            {!daftar ? <MapBertab baris={baris} tersedia={tersedia} catatan={tabel?.note} judul={tabel?.title} /> : (<>
            <div className="hp-map">
              {!daftar ? <GambarSeni ep={ep} id="bundel.map" className="hp-map-seni" /> : null}
              <p className="hp-map-hitung"><b>{t('ceritaHp.hitungKelompok', { n: tersedia, total: baris.length })}</b></p>
            </div>
            {kosong.map((k) => (
              <div key={k} className="hp-slot-kosong" data-kosong="">
                <span className="hp-slot-kosong-ikon" aria-hidden="true" />
                <span><b>{k}</b><span>{t('ceritaHp.belumTersedia')}</span></span>
              </div>
            ))}
            <details className="hp-tahu hp-isi-map">
              <summary>{t('ceritaHp.lihatSemuaKelompok', { total: baris.length })}</summary>
              <ul aria-label={tabel?.title}>
                {baris.map((r, i) => (
                  <li key={i} data-ada={r.ada ? 'ya' : 'tidak'}>
                    <span className="hp-isi-tanda" aria-hidden="true" />
                    <span>{r.label}</span>
                    <b>{r.ada ? t('ceritaHp.tersedia') : t('ceritaHp.belumTersedia')}</b>
                  </li>
                ))}
              </ul>
              {tabel?.note ? <p className="hp-bundel-catatan">{tabel.note}</p> : null}
            </details>
            </>)}
            <button type="button" className="primary-action hp-lanjut" data-tahap-lanjut="" onClick={() => ke('tindakan')}>
              {tx('arena.bundel.keTindakan')} <Arrow />
            </button>
          </>
        ) : null}

        {langkah === 'tindakan' ? (
          <>
            <p className="hp-ingat">{t('ceritaHp.ingatBerkas', { n: tersedia, total: baris.length, kosong: kosong.join(tx('daftar.pemisah')) })}</p>
            <Pilihan
              idLabel="hp-bundel-judul"
              pilihan={konfig.tindakan.pilihan}
              terpilih={pilihT?.id ?? null}
              daftar={daftar}
              tx={tx}
              ep={ep}
              langkah={konfig.tindakan.langkah}
              onPilih={(id) => ubah(pilihOpsi(jawaban, konfig.tindakan.langkah, id))}
            />
            <TombolKirim
              key="ke-kabar"
              label={tx('arena.bundel.keKabar')}
              siap={!!pilihT}
              onKirim={() => ke('kabar')}
              alasanBelum={pilihT ? null : tx('arena.bundel.belumTindakan')}
            />
            <p className="hp-kembali-langkah"><button type="button" className="hp-tautan" onClick={() => ke('periksa')}>{tx('arena.bundel.kembaliPeriksa')}</button></p>
          </>
        ) : null}

        {langkah === 'kabar' && pilihT ? (
          <>
            <div className="hp-rencana">
              <p><span>{tx('arena.bundel.rencana')}</span><b>{tx(pilihT.label)}</b>{pilihT.arti ? <small>{tx(pilihT.arti)}</small> : null}</p>
              <button type="button" className="hp-tautan" onClick={() => ke('tindakan')} aria-label={`${t('ceritaHp.ubah')}: ${tx('arena.bundel.rencana')}`}>{t('ceritaHp.ubah')}</button>
            </div>
            <Pilihan
              idLabel="hp-bundel-judul"
              pilihan={konfig.kabar.pilihan}
              terpilih={pilihK?.id ?? null}
              daftar
              kutip
              tx={tx}
              ep={ep}
              langkah={konfig.kabar.langkah}
              onPilih={(id) => ubah(pilihOpsi(jawaban, konfig.kabar.langkah, id))}
            />
            {pilihK ? (
              pilihK.arti ? (
                <p className="hp-pratinjau-kosong" role="status">{tx('arena.bundel.tanpaPesan', { nama: nasabah })}</p>
              ) : (
                <figure className="hp-pratinjau" role="status">
                  <figcaption>{tx('arena.bundel.pratinjau')} · {tx('arena.bundel.untuk', { nama: nasabah })}</figcaption>
                  <p className="hp-pratinjau-gelembung">{tx(pilihK.label)}</p>
                </figure>
              )
            ) : null}
            <TombolKirim
              key="konfirmasi"
              label={!pilihK ? tx('arena.bundel.konfirmasi') : pilihK.arti ? tx('arena.bundel.konfirmasiTanpa') : tx('arena.bundel.konfirmasiKirim')}
              siap={!!pilihK}
              onKirim={onKirim}
              alasanBelum={pilihK ? null : tx('arena.bundel.belumKabar', { nama: nasabah })}
              catatan={t('ceritaHp.konfirmasiFinal')}
            />
          </>
        ) : null}
      </section>
    </div>
  );
}

/** Pilihan satu kolom: radio (tanda bulat + kata "Dipilih", bukan warna saja), ikon kecil di kiri bila tampilan gambar. */
function Pilihan({ idLabel, pilihan, terpilih, daftar, kutip = false, tx, ep, langkah, onPilih }: {
  idLabel: string;
  pilihan: TujuanArena[];
  terpilih: string | null;
  daftar: boolean;
  /** Label = isi pesan (tanda kutip), bukan nama tindakan. */
  kutip?: boolean;
  tx: (k: KunciTeks) => string;
  ep: PropsPola['ep'];
  langkah: string;
  onPilih: (id: string) => void;
}) {
  const id = useId();
  return (
    <div className="hp-opsi-daftar hp-opsi-ikon-daftar" role="radiogroup" aria-labelledby={idLabel} aria-describedby={id} onKeyDown={panahUbin}>
      <span id={id} className="sr-only">{t('ceritaHp.pilihSatu')}</span>
      {pilihan.map((x, i) => {
        const aktif = x.id === terpilih;
        const isi: ReactNode = kutip && !x.arti ? <q>{tx(x.label)}</q> : tx(x.label);
        return (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={aktif}
            tabIndex={aktif || (!terpilih && i === 0) ? 0 : -1}
            className={'hp-opsi hp-opsi-ikon' + (aktif ? ' dipilih' : '') + (kutip && !x.arti ? ' hp-opsi-pesan' : '')}
            data-opsi={x.id}
            data-langkah={langkah}
            onClick={() => onPilih(x.id)}
          >
            <span className="hp-opsi-tanda" aria-hidden="true">{aktif ? <i /> : null}</span>
            {!daftar && x.seni ? <GambarSeni ep={ep} id={x.seni} className="hp-opsi-seni" /> : null}
            <span className="hp-opsi-teks"><b>{isi}</b>{x.arti ? <span>{tx(x.arti)}</span> : null}</span>
            {aktif ? <span className="hp-ubin-tanda">{t('ceritaHp.dipilih')}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Map pengajuan bertab (prototipe Claude Design): tab bernomor per kelompok berkas (centang = tersedia, lingkaran putus = belum;
 * bukan warna saja), SATU lembar terbuka di depan map. Status = data tabel naskah apa adanya (tidak ditebak).
 */
function MapBertab({ baris, tersedia, catatan, judul }: { baris: { label: string; ada: boolean }[]; tersedia: number; catatan?: string; judul?: string }) {
  const [buka, setBuka] = useState(0);
  const idPanel = useId();
  const r = baris[buka];
  const panah = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = (buka + (e.key === 'ArrowRight' ? 1 : -1) + baris.length) % baris.length;
    setBuka(i);
    e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[i]?.focus();
  };
  if (!r) return null;
  return (
    <div className="hp-mapt">
      <div className="hp-mapt-kepala">
        <b>{t('ceritaHp.mapPengajuan')}</b>
        <span className="hp-mapt-hitung">{t('ceritaHp.hitungKelompok', { n: tersedia, total: baris.length })}</span>
      </div>
      <div className="hp-mapt-tab" role="tablist" aria-label={judul} onKeyDown={panah}>
        {baris.map((x, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === buka}
            aria-controls={idPanel}
            tabIndex={i === buka ? 0 : -1}
            className="hp-mapt-tab-item"
            data-ada={x.ada ? 'ya' : 'tidak'}
            data-lembar={i + 1}
            aria-label={`${t('ceritaHp.lembarKe', { n: i + 1, total: baris.length })}: ${x.label}. ${x.ada ? t('ceritaHp.tersedia') : t('ceritaHp.belumTersedia')}`}
            onClick={() => { if (i !== buka) playSfx('kertas'); setBuka(i); }}
          >
            <b>{i + 1}</b><span aria-hidden="true">{x.ada ? '✓' : '○'}</span>
          </button>
        ))}
      </div>
      <div id={idPanel} className="hp-mapt-lembar" role="tabpanel" data-ada={r.ada ? 'ya' : 'tidak'}>
        <span className="hp-mapt-no">{t('ceritaHp.lembarKe', { n: buka + 1, total: baris.length })}</span>
        <b className="hp-mapt-nama">{r.label}</b>
        <span className="hp-mapt-status"><span aria-hidden="true">{r.ada ? '✓' : '○'}</span>{r.ada ? t('ceritaHp.tersedia') : t('ceritaHp.belumTersedia')}</span>
      </div>
      {catatan ? <p className="hp-bundel-catatan">{catatan}</p> : null}
    </div>
  );
}
