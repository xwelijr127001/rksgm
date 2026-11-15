/**
 * POLA BANDINGKAN (K10 pemeriksaan bukti) — komposisi prototipe Claude Design (14 Nov 2026):
 *  - dua sumber di kepala (nama dokumen saja);
 *  - SATU perbedaan aktif (tab Perbedaan 1..n, centang bila sudah ditandai);
 *  - kartu perbedaan berlabel "Ringkasan dari naskah" (bukan kutipan dokumen asli) + "Catatan bukti" (yang diketahui/belum);
 *  - pilihan tindakan (cap) tepat di bawah kartu; cap terpilih MENEMPEL di kartu dan tetap bisa diganti (ketuk lagi = sama);
 *  - "Perbedaan berikutnya" sampai semua ditandai, lalu Kirim; ringkasan semua pilihan bisa dibuka kapan saja.
 * Jawaban arena tidak berubah (tetapkan(langkah, selisih, perlakuan)). Kata yang dipakai "ditandai", bukan "benar".
 */
import { useId, useState } from 'react';
import { t } from '../../../i18n';
import { GambarSeni, TombolKirim } from '../bagianHp';
import { petaLangkah, sisaArena, tetapkan, type ArenaBandingkan } from './logika';
import { panahUbin, type PropsPola } from './pola';

export function ArenaPolaBandingkan({ ep, konfig, jawaban, ubah, daftar, tx, labelKirim, onKirim }: PropsPola & { konfig: ArenaBandingkan }) {
  const peta = petaLangkah(jawaban, konfig.langkah);
  const sah = (sid: string) => konfig.perlakuan.some((p) => p.id === peta[sid]);
  const [aktif, setAktif] = useState<string>(() => konfig.selisih.find((s) => !sah(s.id))?.id ?? konfig.selisih[0]!.id);
  const sisa = sisaArena(konfig, jawaban);
  const idTanya = useId();
  const indeks = konfig.selisih.findIndex((s) => s.id === aktif);
  const s = konfig.selisih[indeks]!;
  const cap = konfig.perlakuan.find((x) => x.id === peta[s.id]) ?? null;
  const berikut = konfig.selisih.find((x, i) => i > indeks && !sah(x.id)) ?? konfig.selisih.find((x) => x.id !== s.id && !sah(x.id)) ?? null;
  const pilih = (pid: string) => ubah(tetapkan(jawaban, konfig.langkah, s.id, pid));

  return (
    <div className="hp-bandingkan hp-bandingkan-satu">
      <div className="hp-sumber">
        <span className="hp-sumber-dok">{tx(konfig.sumber.kiri)}</span>
        <span className="hp-sumber-vs" aria-hidden="true">↔</span>
        <span className="hp-sumber-dok">{tx(konfig.sumber.kanan)}</span>
      </div>

      <div className="hp-isu-tab" role="tablist" aria-label={t('ceritaHp.ditandaiDari', { n: konfig.selisih.length - sisa, total: konfig.selisih.length })}>
        {konfig.selisih.map((x, i) => (
          <button key={x.id} type="button" role="tab" aria-selected={x.id === aktif} className="hp-isu-tab-item" data-isu={x.id} onClick={() => setAktif(x.id)}>
            {t('ceritaHp.perbedaanKe', { n: i + 1 })}{sah(x.id) ? <span aria-label={t('ceritaHp.dipilih')}> ✓</span> : null}
          </button>
        ))}
      </div>

      <section className={'hp-isu' + (cap ? ' dicap' : '')} role="tabpanel" data-selisih={s.id} aria-label={t('ceritaHp.perbedaanKe', { n: indeks + 1 })}>
        <p className="hp-isu-label">{t('ceritaHp.ringkasanNaskah')}</p>
        <p className="hp-isu-teks">{tx(s.label)}</p>
        {s.catatan ? (
          <p className="hp-isu-catatan"><b>{t('ceritaHp.catatanBukti')}</b><span>{tx(s.catatan)}</span></p>
        ) : null}
        {cap ? (
          <span className="hp-isu-cap" aria-live="polite">
            {!daftar ? <GambarSeni ep={ep} id={cap.seni} className="hp-cap-kecil" /> : null}
            <b>{tx(cap.label)}</b>
          </span>
        ) : null}
      </section>

      <h3 id={idTanya} className="hp-tanya-arena">{tx(konfig.tanya)}</h3>
      <div className="hp-aksi-cap" role="radiogroup" aria-labelledby={idTanya} onKeyDown={panahUbin}>
        {konfig.perlakuan.map((x, i) => {
          const on = peta[s.id] === x.id;
          return (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on || (!cap && i === 0) ? 0 : -1}
              className={'hp-aksi-cap-item' + (on ? ' terpilih' : '')}
              data-perlakuan={x.id}
              onClick={() => pilih(x.id)}
            >
              <span className="hp-opsi-tanda" aria-hidden="true">{on ? <i /> : null}</span>
              <span className="hp-aksi-cap-teks"><b>{tx(x.label)}</b>{x.arti ? <span>{tx(x.arti)}</span> : null}</span>
            </button>
          );
        })}
      </div>

      {cap && berikut ? (
        <button type="button" className="hp-isu-berikut" data-isu-berikut="" onClick={() => setAktif(berikut.id)}>
          {t('ceritaHp.perbedaanBerikut')} →
        </button>
      ) : null}

      <details className="hp-tahu hp-isu-ringkasan" data-ringkasan-selisih="">
        <summary>{t('ceritaHp.ringkasanPilihan', { n: konfig.selisih.length - sisa, total: konfig.selisih.length })}</summary>
        <ol>
          {konfig.selisih.map((x, i) => {
            const p = konfig.perlakuan.find((y) => y.id === peta[x.id]);
            return (
              <li key={x.id}>
                <button type="button" className="hp-tautan" onClick={() => setAktif(x.id)}>{t('ceritaHp.perbedaanKe', { n: i + 1 })}</button>
                <span>{p ? tx(p.label) : t('ceritaHp.belumDitandai')}</span>
              </li>
            );
          })}
        </ol>
      </details>

      <TombolKirim
        label={labelKirim}
        siap={sisa === 0}
        onKirim={onKirim}
        alasanBelum={sisa ? t('ceritaHp.belumDitandaiNo', { daftar: konfig.selisih.map((x, i) => (sah(x.id) ? null : i + 1)).filter((x) => x !== null).join(', ') }) : null}
        catatan={t('ceritaHp.pilihanBisaDiubah')}
      />
    </div>
  );
}
