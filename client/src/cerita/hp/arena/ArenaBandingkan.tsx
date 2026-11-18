/**
 * POLA BANDINGKAN (K10 pemeriksaan bukti).
 * Tampilan GAMBAR — T-020 batch 2: dua kertas piksel (D-149, D-159), seni/aktivitas/banding/:
 *  - dua kertas berdampingan (kepala biru = kiri, cokelat = kanan), tiga baris berikon; isi baris = teks HTML dari tabel cerita
 *    (`sel`), tidak ada kata di gambar; baris perbedaan aktif disorot di kedua kertas dengan penanda "≠" merah di antaranya;
 *  - kotak kalimat naskah + "Catatan bukti" + kotak kemajuan n/total (setinggi perbedaan terpanjang: tidak melompat);
 *  - lima cap karet = lima cara mencatat; ketuk cap = jejak cap menempel di baris itu, lalu perbedaan berikutnya yang belum dicap
 *    disorot; baris instruksi memuat arti cap yang baru dipakai. Cap bisa diganti (ketuk baris, lalu cap lain).
 * Tampilan DAFTAR (dan kasus tanpa `sel`): susunan teks lama (tab perbedaan, kartu, lima baris pilihan, ringkasan).
 * Jawaban arena tidak berubah (tetapkan(langkah, selisih, perlakuan)). Kata yang dipakai "ditandai", bukan "benar".
 */
import { useEffect, useId, useRef, useState } from 'react';
import '../../seni/aktivitas/piksel.css';
import { t } from '../../../i18n';
import { playSfx } from '../../../audio/audio';
import { KeSlot, SlotKepalaArena } from '../cangkang';
import { TombolKirim } from '../bagianHp';
import { petaLangkah, sisaArena, tetapkan, type ArenaBandingkan } from './logika';
import { panahUbin, type PropsPola } from './pola';

/** Jeda sebelum sorotan pindah ke perbedaan berikutnya: jejak cap sempat terlihat menempel. */
const JEDA_PINDAH = 650;

export function ArenaPolaBandingkan({ ep, misi, konfig, jawaban, ubah, daftar, tx, labelKirim, onKirim }: PropsPola & { konfig: ArenaBandingkan }) {
  const peta = petaLangkah(jawaban, konfig.langkah);
  const sah = (sid: string) => konfig.perlakuan.some((p) => p.id === peta[sid]);
  const [aktif, setAktif] = useState<string>(() => konfig.selisih.find((s) => !sah(s.id))?.id ?? konfig.selisih[0]!.id);
  /** Cap yang terakhir dipakai: artinya tetap tampil di baris instruksi sesudah sorotan pindah. */
  const [capBaru, setCapBaru] = useState<string | null>(null);
  const pindah = useRef<number | null>(null);
  const batalPindah = () => { if (pindah.current !== null) { window.clearTimeout(pindah.current); pindah.current = null; } };
  useEffect(() => batalPindah, []);
  const sisa = sisaArena(konfig, jawaban);
  const idTanya = useId();
  const indeks = konfig.selisih.findIndex((s) => s.id === aktif);
  const s = konfig.selisih[indeks]!;
  const cap = konfig.perlakuan.find((x) => x.id === peta[s.id]) ?? null;
  const berikutDari = (sid: string, sudah: (id: string) => boolean) => {
    const i = konfig.selisih.findIndex((x) => x.id === sid);
    return [...konfig.selisih.slice(i + 1), ...konfig.selisih.slice(0, i)].find((x) => !sudah(x.id)) ?? null;
  };
  const kirim = (
    <TombolKirim
      label={labelKirim}
      siap={sisa === 0}
      onKirim={onKirim}
      alasanBelum={sisa ? t('ceritaHp.belumDitandaiNo', { daftar: konfig.selisih.map((x, i) => (sah(x.id) ? null : i + 1)).filter((x) => x !== null).join(tx('daftar.pemisah')) }) : null}
      alasanRingkas={sisa ? t('ceritaHp.belumBedaRingkas', { n: sisa }) : null}
      catatan={t('ceritaHp.pilihanBisaDiubah')}
    />
  );

  if (daftar || !konfig.selisih.every((x) => x.sel)) {
    const pilih = (pid: string) => ubah(tetapkan(jawaban, konfig.langkah, s.id, pid));
    const berikut = berikutDari(s.id, sah);
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
          {s.catatan ? <p className="hp-isu-catatan"><b>{t('ceritaHp.catatanBukti')}</b><span>{tx(s.catatan)}</span></p> : null}
          {cap ? <span className="hp-isu-cap" aria-live="polite"><b>{tx(cap.label)}</b></span> : null}
        </section>
        <KeSlot ke={SlotKepalaArena}><h3 id={idTanya} className="hp-tanya-arena">{tx(konfig.tanya)}</h3></KeSlot>
        <div className="hp-aksi-cap" role="radiogroup" aria-labelledby={idTanya} onKeyDown={panahUbin}>
          {konfig.perlakuan.map((x, i) => {
            const on = peta[s.id] === x.id;
            return (
              <button key={x.id} type="button" role="radio" aria-checked={on} tabIndex={on || (!cap && i === 0) ? 0 : -1} className={'hp-aksi-cap-item' + (on ? ' terpilih' : '')} data-perlakuan={x.id} onClick={() => pilih(x.id)}>
                <span className="hp-opsi-tanda" aria-hidden="true">{on ? <i /> : null}</span>
                <span className="hp-aksi-cap-teks"><b>{tx(x.label)}</b>{x.arti ? <span>{tx(x.arti)}</span> : null}</span>
              </button>
            );
          })}
        </div>
        {cap && berikut ? <button type="button" className="hp-isu-berikut" data-isu-berikut="" onClick={() => setAktif(berikut.id)}>{t('ceritaHp.perbedaanBerikut')} →</button> : null}
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
        {kirim}
      </div>
    );
  }

  const kelasCap = (seni?: string) => (seni ? ep.seniArena?.[seni]?.piksel ?? '' : '');
  const capDari = (sid: string) => konfig.perlakuan.find((x) => x.id === peta[sid]) ?? null;
  // T-036 Fix 2: membuka baris kertas pembanding = bunyi "berkas dibuka" (hanya bila berganti baris).
  const pilihBaris = (sid: string) => { if (sid !== aktif) playSfx('kertas'); batalPindah(); setCapBaru(null); setAktif(sid); };
  const pilihCap = (pid: string) => {
    batalPindah();
    ubah(tetapkan(jawaban, konfig.langkah, s.id, pid));
    setCapBaru(pid);
    const berikut = berikutDari(s.id, (id) => id === s.id || sah(id));
    if (berikut) pindah.current = window.setTimeout(() => { pindah.current = null; setAktif(berikut.id); }, JEDA_PINDAH);
  };
  const artiCap = konfig.perlakuan.find((x) => x.id === capBaru) ?? cap;
  const petunjuk = misi.steps.find((x) => x.id === konfig.langkah)?.hint ?? misi.instruction;
  const kertas = (sisi: 'kiri' | 'kanan') => (
    <div className="bd-kertas" data-kertas={sisi}>
      <p className="bd-kepala">{tx(konfig.sumber[sisi])}</p>
      {konfig.selisih.map((x, i) => {
        const c = capDari(x.id);
        const isi = (
          <>
            <span className={'px px-baris-' + (x.ikon ?? 'pensil')} aria-hidden="true" />
            <span className="bd-sel">{tx(x.sel![sisi])}</span>
            {sisi === 'kiri' && c ? <span className={'px bd-jejak ' + kelasCap(c.seni)} data-jejak={c.id} aria-hidden="true" /> : null}
          </>
        );
        // Kertas kiri = tab (keyboard & pembaca layar); baris kertas kanan = sasaran ketuk yang sama, tanpa nama kedua.
        return sisi === 'kiri' ? (
          <button key={x.id} type="button" role="tab" aria-selected={x.id === aktif} className="bd-baris hp-isu-tab-item-px" data-isu={x.id} data-aktif={x.id === aktif ? '' : undefined}
            aria-label={`${t('ceritaHp.perbedaanKe', { n: i + 1 })}: ${tx(konfig.sumber.kiri)} ${tx(x.sel!.kiri)}, ${tx(konfig.sumber.kanan)} ${tx(x.sel!.kanan)}${c ? `. ${tx(c.label)}` : ''}`} onClick={() => pilihBaris(x.id)}>
            {isi}
          </button>
        ) : (
          <button key={x.id} type="button" tabIndex={-1} aria-hidden="true" className="bd-baris" data-isu-kanan={x.id} data-aktif={x.id === aktif ? '' : undefined} onClick={() => pilihBaris(x.id)}>{isi}</button>
        );
      })}
    </div>
  );

  return (
    <div className="hp-bandingkan bd-px">
      <KeSlot ke={SlotKepalaArena}>
        <h3 id={idTanya} className="hp-tanya-arena">{tx(konfig.tanya)}</h3>
        <p className="hp-instruksi-arena bd-instruksi" aria-live="polite" data-arti={artiCap ? artiCap.id : undefined}>
          {artiCap ? <><b>{tx(artiCap.label)}{artiCap.arti ? ':' : ''}</b>{artiCap.arti ? <span> {tx(artiCap.arti)}</span> : null}</> : petunjuk}
        </p>
      </KeSlot>

      <div className="bd-kertas-baris" role="tablist" aria-label={t('ceritaHp.ditandaiDari', { n: konfig.selisih.length - sisa, total: konfig.selisih.length })} style={{ ['--baris' as string]: indeks }}>
        {kertas('kiri')}
        <span className="px bd-beda" aria-hidden="true" />
        {kertas('kanan')}
      </div>

      <div className="bd-isu-tumpuk">
        {konfig.selisih.map((x, i) => {
          const on = x.id === aktif;
          return (
            <section key={x.id} className="hp-isu bd-isu" role={on ? 'tabpanel' : undefined} aria-hidden={on ? undefined : true} data-selisih={on ? x.id : undefined} data-bayangan={on ? undefined : ''} aria-label={t('ceritaHp.perbedaanKe', { n: i + 1 })}>
              <span className="bd-maju" aria-hidden="true">
                {konfig.selisih.map((y, j) => <span key={y.id} className="px px-kemajuan" data-kotak={j === i ? 'kini' : sah(y.id) ? 'selesai' : 'belum'} />)}
                <b>{i + 1}/{konfig.selisih.length}</b>
              </span>
              <p className="hp-isu-teks">{tx(x.label)}</p>
              {x.catatan ? <p className="hp-isu-catatan"><b>{t('ceritaHp.catatanBukti')}:</b> <span>{tx(x.catatan)}</span></p> : null}
            </section>
          );
        })}
      </div>

      <div className="bd-cap-baris" role="radiogroup" aria-labelledby={idTanya} onKeyDown={panahUbin}>
        {konfig.perlakuan.map((x, i) => {
          const on = peta[s.id] === x.id;
          return (
            <button key={x.id} type="button" role="radio" aria-checked={on} tabIndex={on || (!cap && i === 0) ? 0 : -1} className="bd-cap-tombol" data-perlakuan={x.id}
              aria-label={x.arti ? `${tx(x.label)}: ${tx(x.arti)}` : tx(x.label)} onClick={() => pilihCap(x.id)}>
              <span className={'px bd-cap ' + kelasCap(x.seni)} aria-hidden="true" />
              <span>{tx(x.label)}</span>
            </button>
          );
        })}
      </div>
      {kirim}
    </div>
  );
}
