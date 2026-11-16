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
import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Arrow } from '../../../components/PlayerShell';
import { t } from '../../../i18n';
import { KeSlot, SlotKepalaArena, SlotKirimArena } from '../cangkang';
import { Adegan, type RambuAdegan } from '../../lokasi/Adegan';
import { ContohArsir } from '../../lokasi/seni/Aset';
import '../../lokasi/lokasi.css';
import { Kutipan, PotretHp, TombolKirim } from '../bagianHp';
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
  const ke = (l: LangkahRambu) => { catatJalan(); setLangkahMentah(l); simpanLangkah(kunjungan ?? '', l); };

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

  // T-018 Tahap 2 (owner 16 Nov, K08): saat langkah berganti (mis. sesudah menandai lajur -> kesimpulan) isi di ATAS gambar jalan
  // bertambah / hilang. Di cangkang HP posisi gulir dikoreksi sebesar pergeseran gambar jalan, jadi jalan tetap di tempatnya
  // dan pilihan kesimpulan + tombol muncul tanpa layar melompat.
  const akarRef = useRef<HTMLDivElement>(null);
  const jalanAtas = useRef<number | null>(null);
  /** Posisi gambar jalan di LAYAR tepat sebelum langkah berganti (dipanggil dari ke()). */
  function catatJalan(): void { jalanAtas.current = akarRef.current?.querySelector<HTMLElement>('.lk-adegan')?.getBoundingClientRect().top ?? null; }
  useLayoutEffect(() => {
    const lama = jalanAtas.current;
    jalanAtas.current = null;
    const g = akarRef.current?.closest<HTMLElement>('[data-gulir-arena]'); const j = akarRef.current?.querySelector<HTMLElement>('.lk-adegan');
    // Kesimpulan (lembar di atas jalan): isi di belakang lembar tidak menggulir; selalu dari puncak adegan.
    if (g && tahapKini === 'putus') { g.scrollTop = 0; return; }
    if (lama === null || !g || !j || !/(auto|scroll)/.test(getComputedStyle(g).overflowY)) return;
    // D-176: bila langkah baru menampilkan KARTU BUNYI RAMBU (yang harus dibaca), kartu itu utuh di puncak penggulir dan jalan
    // boleh bergeser. Selain itu (mis. ke kesimpulan) gambar jalan tetap di tempatnya.
    const kartu = akarRef.current?.querySelector<HTMLElement>('.lk-bukti-kartu');
    if (kartu) { g.scrollTop += kartu.getBoundingClientRect().top - g.getBoundingClientRect().top - 2; return; }
    g.scrollTop += j.getBoundingClientRect().top - lama;
  }, [tandaLangkah]);

  // D-177: di cangkang HP tombol langkah ("Lanjut ke rambu berikutnya" / "Lanjut ke kesimpulan") ada di bilah bawah yang
  // tersemat, seperti tombol kirim; alasan "tandai dulu" menjadi label tombol nonaktif.
  const slotKirim = useContext(SlotKirimArena);

  const Pilihanmu = () => (
    <ul className="lk-pilihanmu" aria-live="polite">
      {konfig.rambu.map((_, i) => ((terbuka.includes(i) || tanda[i]!.length) ? (
        <li key={i}>
          <span className={`px-contoh px-contoh-${i === 0 ? 'merah' : 'biru'}`} aria-hidden="true" />
          {tanda[i]!.length
            ? <><b>{nama(i)}</b>{selaPembicara()}{tx('arena.rambu.pilihanmu', { lajur: daftarLajur(tanda[i]!, tx) })}</>
            : <><b>{nama(i)}</b>{selaPembicara()}{tx('arena.rambu.belum')}</>}
        </li>
      ) : null))}
    </ul>
  );

  // T-020 batch 1: tiang rambu di adegan = tombolnya (menggantikan tombol "Rambu n" dan chip "Lihat lagi"). Rambu yang sedang
  // menunggu diketuk = aktif; yang sudah dibuka = selesai (ketuk = lihat lagi); sisanya terkunci.
  const tiang: RambuAdegan[] = konfig.rambu.map((_, i) => {
    const label = tx('arena.rambu.periksa', { rambu: nama(i) });
    if (tahapKini === 'ketuk' && i === aktif) return { label, keadaan: 'aktif', onKetuk: () => ke(ketukRambu(konfig, langkah)) };
    if (tahapKini === 'tandai' && i === aktif) return { label, keadaan: 'aktif', onKetuk: () => {} };
    if (terbuka.includes(i)) return { label: tx(tahapKini === 'putus' ? 'arena.rambu.periksaLagi' : 'arena.rambu.lihatLagi', { rambu: nama(i) }), keadaan: 'selesai', onKetuk: () => ke(bukaUlang(konfig, langkah, i)) };
    return { label, keadaan: 'terkunci', onKetuk: () => {} };
  });
  const lbl = labelAdegan(tx);
  /** Satu baris legenda di bawah adegan: contoh arsiran + "Tandamu" + tanda tiap rambu, lalu kalimat keterangan ilustrasi. */
  const Legenda = () => (
    <p className="lk-legenda" aria-live="polite">
      {adaTanda ? <><b>{t('ceritaHp.tandamu')}</b>{konfig.rambu.map((_, i) => (tanda[i]!.length ? <span key={i}> · <span className={`px-contoh px-contoh-${i === 0 ? 'merah' : 'biru'}`} aria-hidden="true" />{nama(i)}{selaPembicara()}{daftarLajur(tanda[i]!, tx)}</span> : null))} · </> : null}
      {lbl.keterangan}
    </p>
  );
  const [lihatTanda, setLihatTanda] = useState(false);

  if (tahapKini === 'putus' && slotKirim) {
    // Kesimpulan di cangkang HP = LEMBAR di atas jalan (pola lembar balasan obrolan): tidak ada yang menggulir, jadi layar tidak
    // bisa melompat. Di atas lembar hanya potongan atas adegan (tanda, muka rambu, kabin truk di atas 12, D-185).
    return (
      <div ref={akarRef} className="hp-rambu lk lk-tertanam" data-tahap={tahapKini}>
        <Adegan label={lbl} tanda1={tanda[0] ?? []} tanda2={tanda[1] ?? []} statis atasTruk={12} tanpaKeterangan rambu={tiang.map((x) => ({ ...x, onKetuk: undefined }))} />
        {createPortal(
          <SlotKirimArena.Provider value={null}>
            <section className="hp-lembar hp-lembar-simpul" data-lembar-simpul="" data-tampil={lihatTanda ? 'tanda' : 'pilihan'} aria-labelledby={idTanya}>
              <div className="hp-lembar-pegangan" aria-hidden="true" />
              <div className="hp-lembar-kepala">
                {kutipan ? <span className="hp-lembar-mr hp-lembar-wajah" aria-hidden="true"><PotretHp ep={ep} id={kutipan.siapa} ekspresi={kutipan.ekspresi} nama="" /></span> : null}
                <h3 id={idTanya} className="hp-tanya" ref={simpanRef} tabIndex={-1}><span className="sr-only">{tx(konfig.simpul.tanya)} </span>{kutipan ? tx(kutipan.teks) : tx(konfig.simpul.tanya)}</h3>
              </div>
              <button type="button" className="hp-lembar-catatan" data-tandamu="" data-dibaca="" aria-pressed={lihatTanda} onClick={() => setLihatTanda((v) => !v)}><span aria-hidden="true">▤</span> {t('ceritaHp.tandamu')}</button>
              {lihatTanda ? (
                <>
                  <div className="hp-lembar-badan hp-lembar-tanda">
                    <Pilihanmu />
                    <div className="lk-chip-baris" role="group" aria-label={tx('arena.rambu.periksaLagiGrup')}>
                      {terbuka.map((i) => <button key={i} type="button" className="lk-chip" onClick={() => { setLihatTanda(false); ke(bukaUlang(konfig, langkah, i)); }}>{tx('arena.rambu.periksaLagi', { rambu: nama(i) })}</button>)}
                    </div>
                  </div>
                  <button type="button" className="hp-lembar-kembali" data-kembali-pilihan="" onClick={() => setLihatTanda(false)}><span aria-hidden="true">←</span> {t('ceritaHp.kembaliPilihan')}</button>
                </>
              ) : (
                <>
                  <div className="hp-opsi-daftar hp-lembar-badan" data-gulir-lembar="" role="radiogroup" aria-labelledby={idTanya} onKeyDown={panahUbin}>
                    {konfig.simpul.pilihan.map((p, i) => (
                      <button key={p.id} type="button" role="radio" aria-checked={dipilih === p.id} data-simpul={p.id} className={'hp-opsi' + (dipilih === p.id ? ' dipilih' : dipilih ? ' lain' : '')}
                        onClick={() => { playSfx('ketuk'); ubah(pilihSimpul(konfig, jawaban, p.id)); }}>
                        <span className="hp-opsi-nomor" aria-hidden="true">{i + 1}</span><span className="hp-opsi-teks">{tx(p.label)}</span>
                      </button>
                    ))}
                  </div>
                  <TombolKirim label={dipilih ? labelKirim : t('ceritaHp.pilihSatuKesimpulan')} siap={!!dipilih} onKirim={onKirim} />
                </>
              )}
            </section>
          </SlotKirimArena.Provider>, slotKirim)}
      </div>
    );
  }

  return (
    <div ref={akarRef} className="hp-rambu lk lk-tertanam" data-tahap={tahapKini}>
      {tahapKini !== 'putus' ? (
        <>
          <p className="lk-konteks">{tx('arena.rambu.konteks', { truk: konfig.lajurTruk })}</p>

          {tahapKini === 'tandai' ? (
            <section className="lk-bukti-kartu lk-geser" aria-label={tx('arena.rambu.bunyi', { rambu: nama(aktif) })} aria-live="polite">
              <div className="lk-bukti-kepala">
                <span className={`px px-muka-${aktif + 1} lk-bukti-muka`} aria-hidden="true" />
                <h3 className="lk-bukti-label">{nama(aktif)}</h3>
                <span className="lk-bukti-kicker">{tx('arena.rambu.kicker')}</span>
              </div>
              <p className="lk-bukti-isi">“{tx(r.isi)}”</p>
            </section>
          ) : null}

          {tahapKini === 'ketuk'
            ? <KeSlot ke={SlotKepalaArena}><p className="lk-instruksi hp-instruksi-arena" ref={simpanRef} tabIndex={-1} aria-live="polite">{tx('arena.rambu.ketuk')}</p></KeSlot>
            : <p className="lk-instruksi" ref={simpanRef} tabIndex={-1} aria-live="polite">{tx(r.petunjuk)}</p>}

          <Adegan label={lbl} tanda1={tanda[0] ?? []} tanda2={tanda[1] ?? []} bisaTandai={tahapKini === 'tandai'} aktifTanda={tanda[aktif] ?? []} rambu={tiang} tanpaKeterangan
            onLajur={(n) => { playSfx('ketuk'); ubah(alihLajur(konfig, jawaban, aktif, n)); }} />
          <Legenda />

          {tahapKini === 'tandai' ? (
            <>
              {(() => {
                const boleh = bolehLanjut(konfig, jawaban, langkah);
                const label = langkah.lihat !== null ? tx('arena.rambu.selesaiUbah') : akhirRambu ? tx('arena.rambu.lanjutSimpul') : tx('arena.rambu.lanjutRambu');
                const maju = () => ke(lanjutRambu(konfig, jawaban, langkah));
                if (slotKirim) return createPortal(
                  <button type="button" className="primary-action hp-kirim-tombol" data-lanjut-rambu="" disabled={!boleh} onClick={maju}>
                    <span className="hp-kirim-label">{boleh ? label : tx('arena.rambu.tandaiMin')}</span> <Arrow />
                  </button>, slotKirim);
                return (
                  <>
                    <button type="button" className="lk-btn lk-btn-utama" data-lanjut-rambu="" disabled={!boleh} onClick={maju}>{label}</button>
                    {!boleh ? <p className="lk-alasan">{tx('arena.rambu.tandaiMin')}</p> : null}
                  </>
                );
              })()}
            </>
          ) : null}
        </>
      ) : (
        <>
          <Adegan label={lbl} tanda1={tanda[0] ?? []} tanda2={tanda[1] ?? []} statis cincinTruk rambu={tiang} />
          <Pilihanmu />
          <Kutipan ep={ep} baris={kutipan ?? null} tx={tx} namaPemain={namaPemain} />
          <KeSlot ke={SlotKepalaArena}><h3 id={idTanya} className="hp-tanya-arena" ref={simpanRef} tabIndex={-1}>{tx(konfig.simpul.tanya)}</h3></KeSlot>
          <div className="lk-pilihan" role="radiogroup" aria-labelledby={idTanya} onKeyDown={panahUbin}>
            {konfig.simpul.pilihan.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={dipilih === p.id} data-simpul={p.id} className={`lk-opsi${dipilih === p.id ? ' dipilih' : ''}`}
                onClick={() => ubah(pilihSimpul(konfig, jawaban, p.id))}>{tx(p.label)}</button>
            ))}
          </div>
          <TombolKirim label={labelKirim} siap={!!dipilih} onKirim={onKirim} alasanBelum={dipilih ? null : tx('arena.rambu.pilihDulu')} catatan={t('ceritaHp.pilihanBisaDiubah')} />
        </>
      )}
    </div>
  );
}
