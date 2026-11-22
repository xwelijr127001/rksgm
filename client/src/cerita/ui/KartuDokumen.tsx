/**
 * Kartu DOKUMEN di atas pilihan (`NodePilihan.dokumen`): fakta pendek yang perlu dibaca sebelum menjawab (kartu proses,
 * linimasa perkiraan, potongan surat). Teks UI biasa (terbaca, bisa diperbesar, dibacakan pembaca layar), bukan gambar.
 * Tidak memuat jawaban: hanya keadaan kasus yang juga diketahui petugas di cerita.
 * Dokumen ber-`skema` (bukti ruas jalan) menampilkan tiruan rambu + diagram lajur (BuktiLajur) sebagai ganti baris yang
 * dipakainya, dengan tombol "Perbesar bukti" (lembar bukti di dialog, ukuran besar).
 * T-124: `BacaTahapan` (di bawah) = dokumen bertahap yang sama sebagai langkah baca tersendiri, untuk keputusan dua langkah.
 */
import { useState } from 'react';
import { t } from '../../i18n';
import { Modal } from '../../ui/kit';
import type { DokumenCerita, KunciTeks } from '../tipe';
import { BuktiLajur, barisSkema } from './BuktiLajur';

export function KartuDokumen({ dokumen, id, tx }: { dokumen: DokumenCerita; id: string; tx: (k: KunciTeks) => string }) {
  const idJudul = `cer-dok-${id}`;
  const [besar, setBesar] = useState(false);
  const diSkema = dokumen.skema ? barisSkema(dokumen.skema) : new Set<number>();
  const sisa = dokumen.baris.filter((_, i) => !diSkema.has(i));
  return (
    <section className="cer-dok" data-dokumen={id} aria-labelledby={idJudul}>
      <h3 id={idJudul} className="cer-dok-judul">
        <IkonDokumen />
        <span>{tx(dokumen.judul)}</span>
      </h3>
      {dokumen.skema ? (
        <>
          <BuktiLajur dokumen={dokumen} skema={dokumen.skema} tx={tx} />
          <button type="button" className="cer-dok-perbesar" data-perbesar-bukti="" onClick={() => setBesar(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M15 15l5 5M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {t('ceritaHp.perbesarBukti')}
          </button>
        </>
      ) : null}
      {dokumen.tahapan && !dokumen.skema && sisa.length >= 2 ? (
        <Tahapan baris={sisa} jenis={dokumen.tahapan} idDok={id} tx={tx} />
      ) : sisa.length ? (
        <dl className="cer-dok-baris">
          {sisa.map((b, i) => (
            <div key={i} className="cer-dok-isi" data-tanpa-nilai={b.nilai ? undefined : ''}>
              <dt>{tx(b.label)}</dt>
              {/* Baris judul tanpa nilai tetap berpasangan dt/dd (markup daftar sah); dd kosong disembunyikan CSS. */}
              {b.nilai ? <dd>{tx(b.nilai)}</dd> : <dd />}
            </div>
          ))}
        </dl>
      ) : null}
      {dokumen.catatan ? <p className="cer-dok-catatan">{tx(dokumen.catatan)}</p> : null}
      {besar && dokumen.skema ? (
        <Modal judul={`${t('ceritaHp.lembarBukti')}: ${tx(dokumen.judul)}`} onTutup={() => setBesar(false)} lebar={640}>
          <BuktiLajur dokumen={dokumen} skema={dokumen.skema} tx={tx} besar />
        </Modal>
      ) : null}
    </section>
  );
}

function IkonDokumen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20Z" fill="#fffdf6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 3.5V8h4M9.5 12h6M9.5 15h6M9.5 18h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/**
 * T-124 BACA TAHAPAN: dokumen bertahap sebagai LANGKAH BACA tersendiri (langkah 1 keputusan dua langkah, hp/PilihBalasan.tsx;
 * gaya di hp/duaLangkah.css). Isinya sama dengan kartu tahapan di atas (judul, tahap, penjelasan urutan, catatan = baris naskah
 * apa adanya), tetapi TANPA tombol Sebelumnya/Berikutnya di dalam kartu: tahap aktif dipegang pemanggil (`tahap`, `onTahap`),
 * yang menaruh tombol geser di SATU baris aksi bersama tombol utamanya. Di sini hanya penanda posisi yang bisa diketuk
 * (tablist; panah kiri/kanan, Home, End) dan kartu tahap aktif. Kartu tahap lain ikut digambar tak terlihat di sel yang sama
 * (`data-ukur`), jadi tinggi kartu = tahap terpanjang dan baris aksi di bawahnya tidak melompat saat tahap berganti.
 */
export function BacaTahapan({ dokumen, id, tx, tahap, onTahap }: { dokumen: DokumenCerita; id: string; tx: (k: KunciTeks) => string; tahap: number; onTahap: (i: number) => void }) {
  const idJudul = `cer-baca-${id}`;
  const idPanel = `cer-baca-panel-${id}`;
  const baris = dokumen.baris;
  const n = baris.length;
  const aktif = Math.min(Math.max(tahap, 0), n - 1);
  const label = (i: number) => tx(baris[i]!.label).replace(/^\d+\.\s*/, '');
  const panah = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = e.key === 'ArrowRight' ? (aktif + 1) % n : e.key === 'ArrowLeft' ? (aktif - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (i < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    onTahap(i);
    e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[i]?.focus();
  };
  const isi = (i: number) => (
    <>
      <p className="hp-dl-ke">{t('ceritaHp.tahapKe', { n: i + 1, total: n })}</p>
      <p className="hp-dl-nama">{label(i)}</p>
      {baris[i]!.nilai ? <p className="hp-dl-isi">{tx(baris[i]!.nilai!)}</p> : null}
    </>
  );
  return (
    <section className="cer-dok hp-dl-baca" data-dokumen={id} data-jenis={dokumen.tahapan} aria-labelledby={idJudul}>
      <h3 id={idJudul} className="cer-dok-judul">
        <IkonDokumen />
        <span>{tx(dokumen.judul)}</span>
      </h3>
      <div className="hp-dl-peta" role="tablist" aria-labelledby={idJudul} onKeyDown={panah}>
        {baris.map((_, i) => (
          <button key={i} id={`${idPanel}-t${i}`} type="button" role="tab" aria-selected={i === aktif} aria-controls={idPanel} tabIndex={i === aktif ? 0 : -1}
            className="hp-dl-titik" data-tahap={i + 1} data-lewat={i < aktif ? '' : undefined} onClick={() => onTahap(i)}>
            <span className="hp-dl-no">{i + 1}</span>
            <span className="hp-dl-label">{label(i)}</span>
          </button>
        ))}
      </div>
      <div className="hp-dl-tumpuk">
        {baris.map((_, i) => (i === aktif ? null : <div key={i} className="hp-dl-kartu" data-ukur="" aria-hidden="true">{isi(i)}</div>))}
        <div id={idPanel} className="hp-dl-kartu" role="tabpanel" aria-labelledby={`${idPanel}-t${aktif}`} aria-live="polite" data-tahap-aktif={aktif + 1}>{isi(aktif)}</div>
      </div>
      {dokumen.tahapan === 'paralel' ? <p className="hp-dl-urutan">{t('ceritaHp.urutanPenjelasan')}</p> : null}
      {dokumen.catatan ? <p className="cer-dok-catatan">{tx(dokumen.catatan)}</p> : null}
    </section>
  );
}

/**
 * TAHAPAN (ritme 15 Nov 2026): gambaran tahap kecil (nomor + label, bisa diketuk) + SATU kartu detail aktif + "Tahap n dari N" +
 * Sebelumnya/Berikutnya. Tidak berputar sendiri, tidak wajib dibuka satu per satu; fakta & label = baris naskah apa adanya
 * (awalan nomor "1. " di label dilepas karena nomor sudah tampil). Catatan ketidakpastian dokumen tetap tampil di bawah (pemanggil).
 */
function Tahapan({ baris, jenis, idDok, tx }: { baris: DokumenCerita['baris']; jenis: 'urut' | 'paralel'; idDok: string; tx: (k: KunciTeks) => string }) {
  const [aktif, setAktif] = useState(0);
  const label = (i: number) => tx(baris[i]!.label).replace(/^\d+\.\s*/, '');
  const b = baris[aktif]!;
  const idPanel = `cer-tahap-${idDok}`;
  const panah = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = (aktif + (e.key === 'ArrowRight' ? 1 : -1) + baris.length) % baris.length;
    setAktif(i);
    e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[i]?.focus();
  };
  return (
    <div className="cer-tahap" data-jenis={jenis}>
      <div className="cer-tahap-peta" role="tablist" aria-label={tx(baris[0]!.label) ? t('ceritaHp.tahapKe', { n: aktif + 1, total: baris.length }) : undefined} onKeyDown={panah}>
        {baris.map((_, i) => (
          <button key={i} type="button" role="tab" aria-selected={i === aktif} aria-controls={idPanel} tabIndex={i === aktif ? 0 : -1}
            className="cer-tahap-item" data-tahap={i + 1} onClick={() => setAktif(i)}>
            <span className="cer-tahap-no" aria-hidden="true">{i + 1}</span>
            <span className="cer-tahap-label">{label(i)}</span>
          </button>
        ))}
      </div>
      <div id={idPanel} className="cer-tahap-kartu" role="tabpanel" aria-live="polite">
        <p className="cer-tahap-ke">{t('ceritaHp.tahapKe', { n: aktif + 1, total: baris.length })}</p>
        <p className="cer-tahap-judul">{label(aktif)}</p>
        {b.nilai ? <p className="cer-tahap-isi">{tx(b.nilai)}</p> : null}
        <div className="cer-tahap-nav">
          <button type="button" className="cer-tahap-geser" disabled={aktif === 0} onClick={() => setAktif(aktif - 1)}>← {t('ceritaHp.tahapSebelum')}</button>
          <button type="button" className="cer-tahap-geser" disabled={aktif === baris.length - 1} onClick={() => setAktif(aktif + 1)}>{t('ceritaHp.tahapBerikut')} →</button>
        </div>
      </div>
      {jenis === 'paralel' ? <p className="cer-tahap-urutan">{t('ceritaHp.urutanPenjelasan')}</p> : null}
    </div>
  );
}
