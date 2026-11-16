/**
 * POLA RAMBU (K08 "Rambu di lokasi"): satu adegan jalan, satu petunjuk pada satu waktu, petunjuk tepat di atas jalan.
 *  1. Ketuk rambu 1 -> bunyinya terbaca di atas jalan -> ketuk lajur untuk menandai (ketuk lagi = batal) -> lanjut.
 *  2. Rambu 2 muncul setelah rambu 1 selesai; rambu yang sudah dibuka bisa dilihat/diubah lagi tanpa kehilangan kemajuan.
 *  3. Kesimpulan kepada tokoh (lima kalimat naskah) dengan jalan bertanda tetap terlihat. Kirim = SATU aksi mesin 'aktivitas'.
 * Nomor lajur dan posisi truk (keterangan supir) terlihat sejak awal. Tanda pemain tidak dinilai saat menandai; tanggapan
 * (membandingkan tanda dengan tulisan rambu dan kesimpulan) tampil sesudah dikirim, di adegan akibat.
 * Susunan = jawaban misi sintetis 'rambu' (draf tersimpan per kunjungan); langkah layar disimpan per kunjungan (muat ulang =
 * langkah yang sama). Komponen jalan & aset: cerita/lokasi (Adegan, seni). Tampilan daftar tidak ada: lajur adalah tombol
 * berlabel (keyboard & pembaca layar setara).
 */
import { playSfx } from '../../../audio/audio';
import { selaPembicara } from '../../ui/bagian';
import { useEffect, useId, useRef, useState } from 'react';
import { t } from '../../../i18n';
import { Adegan } from '../../lokasi/Adegan';
import { ContohArsir, IkonPeriksa } from '../../lokasi/seni/Aset';
import '../../lokasi/lokasi.css';
import { Kutipan, TombolKirim } from '../bagianHp';
import { panahUbin, type PropsPola } from './pola';
import {
  LANGKAH_AWAL, alihLajur, bolehLanjut, bukaUlang, daftarLajur, ketukRambu, labelAdegan, lajurDitandai, lanjutRambu, pilihSimpul, pulihkanLangkah, rambuAktif,
  rambuTerbuka, serialLangkah, simpulDipilih, tahap, uraiLangkah, type ArenaRambu, type LangkahRambu,
} from './rambu';

const KUNCI_LANGKAH = 'raksa:cerita:langkah-arena';

function bacaLangkah(kunjungan: string): LangkahRambu | null {
  try {
    const v = JSON.parse(localStorage.getItem(KUNCI_LANGKAH) ?? 'null') as { kunjungan?: string; langkah?: unknown } | null;
    return v?.kunjungan === kunjungan ? uraiLangkah(v.langkah) : null;
  } catch { return null; }
}
function simpanLangkah(kunjungan: string, langkah: LangkahRambu): void {
  try { localStorage.setItem(KUNCI_LANGKAH, JSON.stringify({ kunjungan, langkah: serialLangkah(langkah) })); } catch { /* kenyamanan saja */ }
}

export function ArenaPolaRambu({ ep, konfig, jawaban, ubah, tx, labelKirim, onKirim, kutipan, kunjungan, namaPemain }: PropsPola & { konfig: ArenaRambu }) {
  const idTanya = useId();
  const [langkah, setLangkahMentah] = useState<LangkahRambu>(() => pulihkanLangkah(konfig, jawaban, bacaLangkah(kunjungan ?? '')) ?? LANGKAH_AWAL);
  const ke = (l: LangkahRambu) => { setLangkahMentah(l); simpanLangkah(kunjungan ?? '', l); };

  const aktif = rambuAktif(konfig, langkah);
  const tahapKini = tahap(konfig, langkah);
  const r = konfig.rambu[aktif]!;
  const tanda = konfig.rambu.map((_, i) => lajurDitandai(konfig, jawaban, i));
  const adaTanda = tanda.some((x) => x.length > 0);
  const dipilih = simpulDipilih(konfig, jawaban);
  const nama = (i: number) => tx(konfig.rambu[i]!.label);
  const terbuka = rambuTerbuka(konfig, langkah);
  // Rambu lain yang sudah dibuka dan boleh dilihat lagi (rambu yang sedang ditandai tidak ditawarkan lagi).
  const lainnya = terbuka.filter((i) => !(tahapKini === 'tandai' && i === aktif));
  const akhirRambu = aktif === konfig.rambu.length - 1;

  // Fokus ke petunjuk saat langkah layar berganti (bukan saat pertama kali dibuka: Arena sudah memfokuskan judulnya).
  const petunjukRef = useRef<HTMLElement | null>(null);
const simpanRef = (el: HTMLElement | null) => { petunjukRef.current = el; };
  const pertama = useRef(true);
  const tandaLangkah = `${tahapKini}|${aktif}`;
  useEffect(() => {
    if (pertama.current) { pertama.current = false; return; }
    petunjukRef.current?.focus({ preventScroll: true });
  }, [tandaLangkah]);

  const Pilihanmu = () => (
    <ul className="lk-pilihanmu" aria-live="polite">
      {konfig.rambu.map((_, i) => ((terbuka.includes(i) || tanda[i]!.length) ? (
        <li key={i}>
          <span className={`lk-warna ${i === 0 ? 'merah' : 'biru'}`} aria-hidden="true" />
          {tanda[i]!.length
            ? <><b>{nama(i)}</b>{selaPembicara()}{tx('arena.rambu.pilihanmu', { lajur: daftarLajur(tanda[i]!, tx) })}</>
            : <><b>{nama(i)}</b>{selaPembicara()}{tx('arena.rambu.belum')}</>}
        </li>
      ) : null))}
    </ul>
  );

  return (
    <div className="hp-rambu lk lk-tertanam" data-tahap={tahapKini}>
      {tahapKini !== 'putus' ? (
        <>
          <p className="lk-konteks">{tx('arena.rambu.konteks', { truk: konfig.lajurTruk })}</p>

          {tahapKini === 'tandai' ? (
            <section className="lk-bukti-kartu lk-geser" aria-label={tx('arena.rambu.bunyi', { rambu: nama(aktif) })} aria-live="polite">
              <div className="lk-bukti-kepala">
                <span className="lk-bukti-ikon" aria-hidden="true"><IkonPeriksa ukuran={20} /></span>
                <h3 className="lk-bukti-label">{nama(aktif)}</h3>
                <span className="lk-bukti-kicker">{tx('arena.rambu.kicker')}</span>
              </div>
              <p className="lk-bukti-isi">“{tx(r.isi)}”</p>
            </section>
          ) : null}

          {tahapKini === 'ketuk' ? (
            <div className="lk-tag-baris">
              <button type="button" className="lk-tag" data-hp-fokus="" onClick={() => ke(ketukRambu(konfig, langkah))} aria-label={tx('arena.rambu.periksa', { rambu: nama(aktif) })}>
                <span className="lk-tag-ikon" aria-hidden="true"><IkonPeriksa ukuran={22} /></span>
                <span>{nama(aktif)}</span>
              </button>
              <p className="lk-instruksi" ref={simpanRef} tabIndex={-1} aria-live="polite">{tx('arena.rambu.ketuk')}</p>
            </div>
          ) : <p className="lk-instruksi" ref={simpanRef} tabIndex={-1} aria-live="polite">{tx(r.petunjuk)}</p>}

          <Adegan label={labelAdegan(tx)} tanda1={tanda[0] ?? []} tanda2={tanda[1] ?? []} bisaTandai={tahapKini === 'tandai'} aktifTanda={tanda[aktif] ?? []}
            onLajur={(n) => { playSfx('ketuk'); ubah(alihLajur(konfig, jawaban, aktif, n)); }} />

          {tahapKini === 'tandai' ? (
            <>
              <Pilihanmu />
              {adaTanda ? <p className="lk-catatan-tanda"><ContohArsir />{tx('arena.rambu.catatanTanda')}</p> : null}
              <button type="button" className="lk-btn lk-btn-utama" disabled={!bolehLanjut(konfig, jawaban, langkah)} onClick={() => ke(lanjutRambu(konfig, jawaban, langkah))}>
                {langkah.lihat !== null ? tx('arena.rambu.selesaiUbah') : akhirRambu ? tx('arena.rambu.lanjutSimpul') : tx('arena.rambu.lanjutRambu')}
              </button>
              {!bolehLanjut(konfig, jawaban, langkah) ? <p className="lk-alasan">{tx('arena.rambu.tandaiMin')}</p> : null}
            </>
          ) : null}

          {lainnya.length ? (
            <div className="lk-chip-baris" role="group" aria-label={tx('arena.rambu.lihatLagiGrup')}>
              {lainnya.map((i) => (
                <button key={i} type="button" className="lk-chip" onClick={() => ke(bukaUlang(konfig, langkah, i))}>{tx('arena.rambu.lihatLagi', { rambu: nama(i) })}</button>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <Adegan label={labelAdegan(tx)} tanda1={tanda[0] ?? []} tanda2={tanda[1] ?? []} statis cincinTruk />
          <Pilihanmu />
          <Kutipan ep={ep} baris={kutipan ?? null} tx={tx} namaPemain={namaPemain} />
          <h3 id={idTanya} className="hp-tanya-arena" ref={simpanRef} tabIndex={-1}>{tx(konfig.simpul.tanya)}</h3>
          <div className="lk-pilihan" role="radiogroup" aria-labelledby={idTanya} onKeyDown={panahUbin}>
            {konfig.simpul.pilihan.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={dipilih === p.id} data-simpul={p.id} className={`lk-opsi${dipilih === p.id ? ' dipilih' : ''}`}
                onClick={() => ubah(pilihSimpul(konfig, jawaban, p.id))}>{tx(p.label)}</button>
            ))}
          </div>
          <TombolKirim label={labelKirim} siap={!!dipilih} onKirim={onKirim} alasanBelum={dipilih ? null : tx('arena.rambu.pilihDulu')} catatan={t('ceritaHp.pilihanBisaDiubah')} />
          <div className="lk-chip-baris" role="group" aria-label={tx('arena.rambu.periksaLagiGrup')}>
            {terbuka.map((i) => (
              <button key={i} type="button" className="lk-chip" onClick={() => ke(bukaUlang(konfig, langkah, i))}>{tx('arena.rambu.periksaLagi', { rambu: nama(i) })}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
