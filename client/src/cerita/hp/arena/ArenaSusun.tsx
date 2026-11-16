/**
 * POLA SUSUN (dokumen -> baki, kartu saksi -> daftar): SATU benda aktif (gambar + nama + keterangan), progres
 * "Dokumen 2 dari 8", satu pertanyaan, dan wadah besar yang bisa disentuh (atau tombol radio di tampilan daftar).
 * Ketuk wadah = benda terbang ke wadahnya (animasi menjelaskan perpindahan; gerak dikurangi = langsung), umpan balik
 * "STNK truk ditempatkan di 'Minta sekarang'" + "Ubah", lalu benda berikutnya masuk. Sesudah semua ditempatkan:
 * RINGKASAN per wadah (nama tiap benda; ketuk untuk memindah), baru tombol kirim. "Ditempatkan" bukan "benar": tidak
 * ada tanda keberhasilan sebelum dikirim, dan kunci tidak pernah ditunjukkan di sini.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { playSfx } from '../../../audio/audio';
import { useReducedMotion } from '../../../hooks';
import { t } from '../../../i18n';
import { KeSlot, SlotKepalaArena } from '../cangkang';
import type { BendaArena, Episode, KunciTeks } from '../../tipe';
import { GambarSeni, PotretHp, TombolKirim } from '../bagianHp';
import { itemBerikut, kelompokWadah, lepaskan, petaLangkah, sisaArena, tetapkan, type ArenaSusun } from './logika';
import { PapanSaksi } from './PapanSaksi';
import { panahUbin, type PropsPola } from './pola';

const KUNCI_TUTORIAL = 'raksa:cerita:tutorial-susun';
const tutorialSudah = (): boolean => { try { return localStorage.getItem(KUNCI_TUTORIAL) !== null; } catch { return true; } };
const catatTutorial = (): void => { try { localStorage.setItem(KUNCI_TUTORIAL, '1'); } catch { /* sekali per sesi */ } };

/** Lama benda baru menunggu sebelum masuk sesudah penempatan (ms): cukup untuk melihat benda lama terbang. */
const JEDA_BERIKUT = 520;

export function ArenaPolaSusun({ ep, konfig, jawaban, ubah, daftar, tx, labelKirim, onKirim, onAktif }: PropsPola & { konfig: ArenaSusun }) {
  const reduced = useReducedMotion();
  const peta = petaLangkah(jawaban, konfig.langkah);
  const [aktif, setAktif] = useState<string | null>(() => itemBerikut(konfig, jawaban));
  const [umpan, setUmpan] = useState<{ benda: string; wadah: string } | null>(null);
  const [terbang, setTerbang] = useState<{ seni?: string; dari: DOMRect; ke: DOMRect; kunci: number } | null>(null);
  const [tutorial, setTutorial] = useState(() => !tutorialSudah() && !daftar && konfig.gaya === 'baki');
  const [isiBuka, setIsiBuka] = useState<string | null>(null);
  // Jeda sesudah penempatan (benda lama terbang, benda berikut belum masuk). STATE, bukan ref: akhir jeda harus
  // menggambar ulang walau benda berikutnya null (benda terakhir -> ringkasan).
  const [menunggu, setMenunggu] = useState(false);
  const fokusRef = useRef<HTMLDivElement>(null);
  const kartuRef = useRef<HTMLDivElement>(null);
  const grupRef = useRef<HTMLDivElement>(null);
  const wadahRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const tunda = useRef<number | null>(null);
  const sfxTerakhir = useRef(0);
  useEffect(() => () => { if (tunda.current) window.clearTimeout(tunda.current); }, []);
  const idTanya = useId();
  useEffect(() => { onAktif?.(aktif); }, [aktif, onAktif]);

  const total = konfig.benda.length;
  const sisa = sisaArena(konfig, jawaban);
  const benda = aktif ? konfig.benda.find((b) => b.id === aktif)! : null;
  const urutan = benda ? konfig.benda.findIndex((b) => b.id === benda.id) + 1 : total;
  const namaBenda = (b: BendaArena) => tx(b.nama ?? b.id);
  const namaWadah = (id: string) => tx(konfig.wadah.find((w) => w.id === id)?.label ?? id);

  const tempatkan = (wadah: string) => {
    if (!benda) return;
    const dari = kartuRef.current?.getBoundingClientRect();
    const ke = wadahRef.current[wadah]?.getBoundingClientRect();
    const baru = tetapkan(jawaban, konfig.langkah, benda.id, wadah);
    ubah(baru);
    const kini = performance.now();
    if (kini - sfxTerakhir.current > 140) { sfxTerakhir.current = kini; playSfx('taruh'); }
    setUmpan({ benda: benda.id, wadah });
    if (tutorial) { setTutorial(false); catatTutorial(); }
    // Progres, umpan balik, benda berikutnya, pertanyaan, dan baki dalam satu layar (gulir hanya bila baki terpotong).
    requestAnimationFrame(() => {
      const bawah = grupRef.current?.getBoundingClientRect().bottom ?? 0;
      if (bawah > window.innerHeight - 8) fokusRef.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    });
    if (!reduced && !daftar && dari && ke) setTerbang({ seni: benda.seni, dari, ke, kunci: Date.now() });
    const berikut = itemBerikut(konfig, baru);
    if (tunda.current) window.clearTimeout(tunda.current);
    if (reduced || daftar) {
      tunda.current = null;
      setMenunggu(false);
      setAktif(berikut);
    } else {
      setAktif(null);
      setMenunggu(true);
      tunda.current = window.setTimeout(() => {
        tunda.current = null;
        setMenunggu(false);
        setAktif(berikut);
      }, JEDA_BERIKUT);
    }
  };

  // Mulai mengubah satu benda (dari umpan balik atau ringkasan).
  const ubahBenda = (id: string) => {
    if (tunda.current) { window.clearTimeout(tunda.current); tunda.current = null; }
    setMenunggu(false);
    setUmpan(null);
    setAktif(id);
    requestAnimationFrame(() => kartuRef.current?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }));
  };

  const ringkasan = aktif === null && !menunggu && sisa === 0;
  const kelompok = kelompokWadah(konfig, jawaban);
  // K02 (prototipe Claude Design): meja close-up + tiga baki ringkas sejajar; arti baki & isi baki bisa dibuka.
  const mejaBaki = konfig.gaya === 'baki' && !daftar;
  const batalkan = (id: string) => {
    ubah(lepaskan(jawaban, konfig.langkah, id));
    playSfx('batal');
    ubahBenda(id);
  };
  const umpanEl = umpan ? (
    <p className="hp-umpan" role="status">
      <span>{t('ceritaHp.ditempatkan', { benda: namaBenda(konfig.benda.find((b) => b.id === umpan.benda)!), wadah: namaWadah(umpan.wadah) })}</span>
      <span className="hp-umpan-aksi">
        {mejaBaki ? <button type="button" className="hp-tautan" data-batalkan="" onClick={() => batalkan(umpan.benda)}>{t('ceritaHp.batalkan')}</button> : null}
        <button type="button" className="hp-tautan" onClick={() => ubahBenda(umpan.benda)}>{t('ceritaHp.ubah')}</button>
      </span>
    </p>
  ) : null;

  // K09 (gaya papan, tampilan gambar): papan rencana + kartu kontak (komposisi prototipe).
  if (konfig.gaya === 'papan' && !daftar) {
    return <PapanSaksi ep={ep} konfig={konfig} jawaban={jawaban} ubah={ubah} tx={tx} labelKirim={labelKirim} onKirim={onKirim} />;
  }

  return (
    <div className="hp-susun" data-gaya={konfig.gaya}>
      {!ringkasan ? (
        <>
          <div className="hp-susun-fokus" ref={fokusRef}>
            <p className="hp-progres" aria-live="polite">
              {t('ceritaHp.progres', { satuan: tx(konfig.satuan), n: Math.min(urutan, total), total })}
              {benda ? <span className="sr-only">: {namaBenda(benda)}</span> : null}
            </p>
            {mejaBaki ? null : umpanEl}
            <div className="hp-panggung-benda" ref={kartuRef}>
              {benda ? <KartuBenda key={benda.id} ep={ep} benda={benda} tx={tx} daftar={daftar} sekarangDi={peta[benda.id] ? namaWadah(peta[benda.id]!) : null} /> : <div className="hp-benda-kosong" aria-hidden="true" />}
            </div>
          </div>
          <KeSlot ke={SlotKepalaArena}><h3 id={idTanya} className="hp-tanya-arena">{tx(konfig.tanya)}</h3></KeSlot>
          {mejaBaki ? <p className="hp-instruksi-baki" aria-hidden={benda ? undefined : true}>{t('ceritaHp.instruksiBaki')}</p> : null}
          {tutorial && benda && !mejaBaki ? (
            <div className="hp-tutorial" role="note">
              <span className="hp-tutorial-tunjuk" aria-hidden="true">
                <svg viewBox="0 0 20 20" width="20" height="20"><path d="M10 3v12M5 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <p>{t('ceritaHp.tutorialSusun')}</p>
              <button type="button" className="hp-tautan" onClick={() => { setTutorial(false); catatTutorial(); }}>{t('ceritaHp.mengerti')}</button>
            </div>
          ) : null}
          <div ref={grupRef} className="hp-wadah-daftar" role="radiogroup" aria-labelledby={idTanya} onKeyDown={panahUbin}>
            {konfig.wadah.map((w) => (
              <button
                key={w.id}
                ref={(el) => { wadahRef.current[w.id] = el; }}
                type="button"
                role="radio"
                aria-checked={!!benda && peta[benda.id] === w.id}
                disabled={!benda}
                className={'hp-wadah' + (benda && peta[benda.id] === w.id ? ' terpilih' : '')}
                data-wadah={w.id}
                onClick={() => tempatkan(w.id)}
              >
                {!daftar ? <GambarSeni ep={ep} id={w.seni} className="hp-wadah-seni" /> : null}
                <span className="hp-wadah-teks"><b>{tx(w.label)}</b>{w.arti ? <span>{tx(w.arti)}</span> : null}</span>
                {/* Jumlah hanya bila ada isinya: "0 di sini" di tiap wadah mengulang hal yang sama. */}
                {mejaBaki ? <span className="hp-wadah-jumlah" aria-label={t('ceritaHp.jumlahDi', { n: kelompok[w.id]?.length ?? 0 })}>{kelompok[w.id]?.length ?? 0}</span>
                  : kelompok[w.id]?.length ? <span className="hp-wadah-isi">{t('ceritaHp.jumlahDi', { n: kelompok[w.id]!.length })}</span> : <span aria-hidden="true" />}
              </button>
            ))}
          </div>
          {mejaBaki ? (
            <>
              {umpanEl}
              <div className="hp-baki-isi-baris">
                {konfig.wadah.map((w) => (
                  <button key={w.id} type="button" className="hp-baki-isi" aria-expanded={isiBuka === w.id} data-isi-baki={w.id} onClick={() => { if (isiBuka !== w.id) playSfx('kertas'); setIsiBuka(isiBuka === w.id ? null : w.id); }}>
                    {t('ceritaHp.isiBaki', { n: kelompok[w.id]?.length ?? 0 })}
                  </button>
                ))}
              </div>
              {isiBuka ? (
                <section className="hp-baki-panel" aria-label={t('ceritaHp.isiBakiJudul', { wadah: namaWadah(isiBuka) })}>
                  <p className="hp-baki-panel-judul">{t('ceritaHp.isiBakiJudul', { wadah: namaWadah(isiBuka) })}</p>
                  {kelompok[isiBuka]?.length ? (
                    <ul>
                      {kelompok[isiBuka]!.map((id) => (
                        <li key={id}>
                          <span>{namaBenda(konfig.benda.find((b) => b.id === id)!)}</span>
                          <button type="button" className="hp-tautan" onClick={() => { setIsiBuka(null); ubahBenda(id); }}>{t('ceritaHp.ubah')}</button>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="hp-baki-panel-kosong">{t('ceritaHp.bakiKosong')}</p>}
                </section>
              ) : null}
              <details className="hp-tahu hp-baki-arti">
                <summary>{t('ceritaHp.artiBaki')}</summary>
                <dl>
                  {konfig.wadah.map((w) => (
                    <div key={w.id}><dt>{tx(w.label)}</dt>{w.arti ? <dd>{tx(w.arti)}</dd> : null}</div>
                  ))}
                </dl>
              </details>
            </>
          ) : null}
        </>
      ) : (
        <Ringkasan ep={ep} konfig={konfig} kelompok={kelompok} tx={tx} daftar={daftar} namaBenda={namaBenda} onUbah={ubahBenda} />
      )}
      {ringkasan ? (
        <TombolKirim label={labelKirim} siap={sisa === 0} onKirim={onKirim} catatan={t('ceritaHp.pilihanBisaDiubah')} />
      ) : null}
      {terbang ? <BendaTerbang key={terbang.kunci} ep={ep} seni={terbang.seni} dari={terbang.dari} ke={terbang.ke} onSelesai={() => setTerbang(null)} /> : null}
    </div>
  );
}

function KartuBenda({ ep, benda, tx, daftar, sekarangDi }: { ep: Episode; benda: BendaArena; tx: (k: KunciTeks) => string; daftar: boolean; sekarangDi: string | null }) {
  const nama = tx(benda.nama ?? benda.id);
  return (
    <div className="hp-benda" data-benda={benda.id}>
      {!daftar ? (
        benda.tokoh ? <PotretHp ep={ep} id={benda.tokoh.id} ekspresi={benda.tokoh.ekspresi} kali={2} nama={nama} />
          : <GambarSeni ep={ep} id={benda.seni} className="hp-benda-seni" />
      ) : null}
      <div className="hp-benda-teks">
        <b>{nama}</b>
        {benda.keterangan ? <span>{tx(benda.keterangan)}</span> : null}
        {sekarangDi ? <span className="hp-benda-di">{t('ceritaHp.sekarangDi', { wadah: sekarangDi })}</span> : null}
      </div>
    </div>
  );
}

/**
 * Ringkasan sebelum kirim (ritme 15 Nov 2026): tiga kelompok RINGKAS "Nama wadah (n)", awalnya tertutup, paling banyak satu
 * terbuka. Isi kelompok = nama tiap benda + "Ubah" (benda kembali aktif untuk dipindah). Total yang ditempatkan dan tombol kirim
 * tepat di bawahnya (pemanggil). Angka dihitung dari jawaban yang sama dengan mesin, jadi tidak bisa hilang atau ganda.
 */
function Ringkasan({ ep, konfig, kelompok, tx, daftar, namaBenda, onUbah }: {
  ep: Episode;
  konfig: ArenaSusun;
  kelompok: Record<string, string[]>;
  tx: (k: KunciTeks) => string;
  daftar: boolean;
  namaBenda: (b: BendaArena) => string;
  onUbah: (id: string) => void;
}) {
  const judulRef = useRef<HTMLHeadingElement>(null);
  const [buka, setBuka] = useState<string | null>(null);
  useEffect(() => { judulRef.current?.focus({ preventScroll: false }); }, []);
  const total = konfig.benda.length;
  const ditempatkan = konfig.wadah.reduce((n, w) => n + (kelompok[w.id]?.length ?? 0), 0);
  return (
    <section className="hp-ringkasan hp-ringkasan-ringkas" aria-labelledby="hp-ringkasan-judul">
      <h3 id="hp-ringkasan-judul" ref={judulRef} tabIndex={-1}>{t('ceritaHp.ringkasanJudul')}</h3>
      <p className="hp-ringkasan-total" data-total={ditempatkan}>{t('ceritaHp.totalDitempatkan', { n: ditempatkan, total, satuan: tx(konfig.satuan).toLocaleLowerCase('id') })}</p>
      {konfig.wadah.map((w) => {
        const isi = kelompok[w.id] ?? [];
        const terbuka = buka === w.id;
        const idIsi = `hp-ringkasan-isi-${w.id}`;
        return (
          <div key={w.id} className="hp-ringkasan-wadah" data-wadah={w.id} data-terbuka={terbuka ? '' : undefined}>
            <h4>
              <button type="button" className="hp-ringkasan-kelompok" aria-expanded={terbuka} aria-controls={idIsi} data-kelompok={w.id} onClick={() => { if (!terbuka) playSfx('kertas'); setBuka(terbuka ? null : w.id); }}>
                {!daftar ? <GambarSeni ep={ep} id={w.seni} className="hp-ringkasan-seni" /> : null}
                <span className="hp-ringkasan-kelompok-nama">{tx(w.label)}</span>
                <span className="hp-ringkasan-jumlah" data-jumlah={isi.length}>{isi.length}</span>
                <span className="hp-ringkasan-panah" aria-hidden="true" />
              </button>
            </h4>
            <div id={idIsi} hidden={!terbuka}>
              {isi.length ? (
                <ul>
                  {isi.map((id) => {
                    const b = konfig.benda.find((x) => x.id === id)!;
                    return (
                      <li key={id}>
                        <button type="button" className="hp-chip" data-benda={id} onClick={() => onUbah(id)}>
                          {!daftar && b.seni ? <GambarSeni ep={ep} id={b.seni} className="hp-chip-seni" /> : null}
                          {!daftar && b.tokoh ? <PotretHp ep={ep} id={b.tokoh.id} ekspresi={b.tokoh.ekspresi} nama={namaBenda(b)} /> : null}
                          <span className="hp-chip-teks">
                            <span>{namaBenda(b)}</span>
                            {b.tokoh && b.keterangan ? <small>{tx(b.keterangan)}</small> : null}
                          </span>
                          <span className="hp-chip-ubah">{t('ceritaHp.ubah')}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="hp-ringkasan-kosong">{t('ceritaHp.wadahKosong')}</p>}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/**
 * Salinan benda yang terbang dari kartu ke wadahnya (lapisan tetap di atas halaman, tanpa interaksi). Hanya menjelaskan
 * perpindahan: state sudah berubah sebelum animasi mulai.
 */
function BendaTerbang({ ep, seni, dari, ke, onSelesai }: { ep: Episode; seni?: string; dari: DOMRect; ke: DOMRect; onSelesai: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // Pemanggil membuat fungsi baru tiap render: simpan di ref agar animasi tidak diulang dari awal setiap render.
  const selesai = useRef(onSelesai);
  selesai.current = onSelesai;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dx = ke.left + ke.width / 2 - (dari.left + dari.width / 2);
    const dy = ke.top + ke.height / 2 - (dari.top + dari.height / 2);
    const a = el.animate(
      [{ transform: 'translate(0, 0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.2 }],
      { duration: 460, easing: 'cubic-bezier(.4,.1,.3,1)' },
    );
    a.onfinish = () => selesai.current();
    return () => a.cancel();
  }, [dari, ke]);
  const lebar = Math.min(dari.width, 220);
  return (
    <div ref={ref} className="hp-terbang" aria-hidden="true" style={{ left: dari.left + dari.width / 2 - lebar / 2, top: dari.top, width: lebar, height: dari.height }}>
      <GambarSeni ep={ep} id={seni} />
    </div>
  );
}
