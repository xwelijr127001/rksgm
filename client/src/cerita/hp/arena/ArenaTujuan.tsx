/**
 * POLA TUJUAN: satu benda ke satu tujuan yang TERLIHAT, menurut adegannya.
 * - 'peta' (K04 penugasan): peta berisi tempat-tempat; ketuk tempat = Mas Rudi (potret) berpindah ke tempat itu.
 * - 'teruskan' (K05 bukti): foto kerusakan di atas, lembar "teruskan ke" berisi tujuan; ketuk = foto menempel ke tujuan.
 * - 'rencana' (K07): papan rencana kerja (jalur 1 berisi hitungan bengkel yang sedang berjalan, slot sesudahnya, jalur 2
 *   bersamaan) + pilihan di luar papan; ketuk = kartu pemeriksaan pindah ke slot itu.
 * Pilihan bisa diganti sebelum dikirim; kartu umpan balik menulis tujuan & artinya (pembaca layar: live region).
 * Bila tokoh yang dipindah juga yang memberi tugas, kalimatnya tampil di kartu tokoh itu (Arena tidak mengulanginya).
 */
import { useContext, useId } from 'react';
import { createPortal } from 'react-dom';
import { selaPembicara } from '../../ui/bagian';
import { t } from '../../../i18n';
import { KeSlot, SlotKepalaArena } from '../cangkang';
import type { Episode, KunciTeks, TujuanArena } from '../../tipe';
import { GambarSeni, PotretHp, TombolKirim } from '../bagianHp';
import { petaLangkah, tetapkan, type ArenaTujuan } from './logika';
import { Ubin, panahUbin, type PropsPola } from './pola';
import { PapanTujuan, bisaPapan } from './PapanTujuan';
import { RencanaPeriksa } from './RencanaPeriksa';

export function ArenaPolaTujuan({ ep, misi, konfig, jawaban, ubah, daftar, tx, labelKirim, onKirim, kutipan }: PropsPola & { konfig: ArenaTujuan }) {
  const idTanya = useId();
  // T-020 (D-143): di cangkang HP, papan lokasi diawali SATU baris instruksi hijau tepat di bawah pertanyaan (tersemat).
  const slotKepala = useContext(SlotKepalaArena);
  const pakaiPapan = !daftar && (konfig.gaya === 'peta' || konfig.gaya === 'teruskan') && bisaPapan(konfig.tujuan.length);
  const dipilih = petaLangkah(jawaban, konfig.langkah)[konfig.benda.id] ?? null;
  const tujuan = konfig.tujuan.find((x) => x.id === dipilih) ?? null;
  const pilih = (id: string) => ubah(tetapkan(jawaban, konfig.langkah, konfig.benda.id, id));
  const namaBenda = tx(konfig.benda.nama ?? konfig.benda.id);
  const token = <Token ep={ep} konfig={konfig} tx={tx} />;
  const ubinProps = (x: TujuanArena) => ({
    ep, tujuan: x, tx, daftar, terpilih: x.id === dipilih, onPilih: () => pilih(x.id), data: { tujuan: x.id },
    tambahan: x.id === dipilih && !daftar ? <span className="hp-token-di">{token}</span> : undefined,
  });

  return (
    <div className="hp-pola-tujuan" data-gaya={konfig.gaya} data-papan={pakaiPapan ? '' : undefined} data-dipilih={dipilih ? '' : undefined}>
      {pakaiPapan && slotKepala && misi.instruction ? createPortal(<p className="hp-instruksi-arena">{misi.instruction}</p>, slotKepala) : null}
      {!daftar && konfig.gaya !== 'rencana' ? (
        <div className="hp-tujuan-benda">
          <span className={'hp-token-awal' + (dipilih ? ' pergi' : '')}>{token}</span>
          <span className="hp-tujuan-benda-teks"><b>{namaBenda}</b>{konfig.benda.keterangan ? <span>{tx(konfig.benda.keterangan)}</span> : null}{kutipan ? <q>{tx(kutipan.teks)}</q> : null}</span>
        </div>
      ) : null}
      <KeSlot ke={SlotKepalaArena}><h3 id={idTanya} className="hp-tanya-arena">{tx(konfig.tanya)}</h3></KeSlot>
      {konfig.gaya === 'rencana' && !daftar ? (
        <RencanaPeriksa ep={ep} konfig={konfig} dipilih={dipilih} tx={tx} idTanya={idTanya} instruksi={misi.instruction} onPilih={pilih} />
      ) : !daftar && (konfig.gaya === 'peta' || konfig.gaya === 'teruskan') && bisaPapan(konfig.tujuan.length) ? (
        <PapanTujuan ep={ep} tujuan={konfig.tujuan} dipilih={dipilih} token={konfig.benda.tokoh ? token : <Token ep={ep} konfig={konfig} tx={tx} kecil />} tokenBenda={!konfig.benda.tokoh} tx={tx} idTanya={idTanya} onPilih={pilih} />
      ) : (
        <div className={'hp-ubin-kisi' + (konfig.gaya === 'peta' && !daftar ? ' hp-peta' : '')} role="radiogroup" aria-labelledby={idTanya} onKeyDown={panahUbin}>
          {konfig.tujuan.map((x) => <Ubin key={x.id} {...ubinProps(x)} gaya={daftar ? 'baris' : 'kotak'} />)}
        </div>
      )}
      {/* Pilihan aktif diulang tepat di atas tombol: tidak perlu menggulir kembali untuk mengingatnya. K07 (papan gabus): strip di atas papan sudah memuatnya. */}
      {konfig.gaya === 'rencana' && !daftar ? null : <p className="hp-umpan" role="status" data-kosong={tujuan ? undefined : ''}>
        {tujuan ? <span><b>{t('ceritaHp.dipilih')}</b>{selaPembicara()}{tx(tujuan.label)}</span> : null}
      </p>}
      <TombolKirim label={labelKirim} siap={!!tujuan} onKirim={onKirim} alasanRingkas={tujuan ? null : t('ceritaHp.belumTujuanRingkas')} alasanBelum={tujuan ? null : t('ceritaHp.belumTujuan', { benda: namaBenda })} catatan={t('ceritaHp.pilihanBisaDiubah')} />
    </div>
  );
}

/** Benda yang dipindah: potret tokoh (surveyor) atau gambar benda (foto, kartu). */
function Token({ ep, konfig, tx, kecil = false }: { ep: Episode; konfig: ArenaTujuan; tx: (k: KunciTeks) => string; /** Di ubin papan: versi 22 x 28 (dokumen). */ kecil?: boolean }) {
  const b = konfig.benda;
  if (b.tokoh) return <PotretHp ep={ep} id={b.tokoh.id} ekspresi={b.tokoh.ekspresi} nama={tx(b.nama ?? b.id)} />;
  return <GambarSeni ep={ep} id={b.seni} className="hp-token-seni" kecil={kecil} />;
}

/** Papan rencana kerja: dua slot di papan (sesudah hitungan / bersamaan) + pilihan di luar papan. */
function Papan({ konfig, tx, dipilih, idTanya, ubinProps, token, pilih }: {
  konfig: ArenaTujuan;
  tx: (k: KunciTeks) => string;
  dipilih: string | null;
  idTanya: string;
  ubinProps: (x: TujuanArena) => Parameters<typeof Ubin>[0];
  token: React.ReactNode;
  pilih: (id: string) => void;
}) {
  const slot = (id: string) => konfig.tujuan.find((x) => x.id === id);
  const papan = ['setelah', 'paralel'].map(slot).filter((x): x is TujuanArena => !!x);
  const luar = konfig.tujuan.filter((x) => !papan.includes(x));
  return (
    <div className="hp-papan" role="radiogroup" aria-labelledby={idTanya} onKeyDown={panahUbin}>
      <div className="hp-papan-bidang">
        <p className="hp-papan-judul">{tx('arena.jalur.papan')}</p>
        <div className="hp-lajur" data-lajur="1">
          <span className="hp-lajur-nama">{tx('akt.jalur.tabel.1')}</span>
          <span className="hp-kartu-tetap">{tx('arena.jalur.hitung')}</span>
          {papan[0] ? <SlotPapan x={papan[0]} tx={tx} terpilih={dipilih === papan[0].id} token={token} onPilih={() => pilih(papan[0]!.id)} /> : null}
        </div>
        <div className="hp-lajur" data-lajur="2">
          <span className="hp-lajur-nama">{tx('akt.jalur.tabel.2')}</span>
          {papan[1] ? <SlotPapan x={papan[1]} tx={tx} terpilih={dipilih === papan[1].id} token={token} onPilih={() => pilih(papan[1]!.id)} /> : null}
        </div>
        {konfig.catatan ? <p className="hp-papan-catatan">{tx(konfig.catatan)}</p> : null}
      </div>
      <p className="hp-papan-lain">{tx('arena.jalur.lainnya')}</p>
      <div className="hp-ubin-kisi">
        {luar.map((x) => <Ubin key={x.id} {...ubinProps(x)} gaya="kotak" />)}
      </div>
    </div>
  );
}

function SlotPapan({ x, tx, terpilih, token, onPilih }: { x: TujuanArena; tx: (k: KunciTeks) => string; terpilih: boolean; token: React.ReactNode; onPilih: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={terpilih} className={'hp-slot' + (terpilih ? ' terpilih' : '')} data-tujuan={x.id} onClick={onPilih}>
      {terpilih ? <span className="hp-slot-kartu">{token}</span> : <span className="hp-slot-plus" aria-hidden="true">+</span>}
      <span className="hp-ubin-teks"><b>{tx(x.label)}</b>{x.arti ? <span>{tx(x.arti)}</span> : null}</span>
      {terpilih ? <span className="hp-ubin-tanda">{t('ceritaHp.dipilih')}</span> : null}
    </button>
  );
}
