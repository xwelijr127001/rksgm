/**
 * T-077 / T-079: BUKU CATATAN INVESTIGATOR.
 * T-079 (pemilik: "catatannya seperti buku, seperti detektif"): buku catatan kulit cokelat TERBUKA yang mengisi layar. Buku dijilid
 * di atas (gaya buku reporter), jadi di HP tegak kedua halamannya bertumpuk dan tetap selebar layar (teks >= 16 px terbaca):
 *   halaman atas  "Keterangan": tiap pernyataan tersemat = foto polaroid kecil pembicara + pin merah + kalimat bertulisan tangan;
 *   jilid         cincin spiral (seni/investigasi/spiral.png);
 *   halaman bawah "Bukti": kartu bukti dijepit seperti slip / polaroid (gambar bukti + judul bertulisan tangan + klip kertas);
 *   pensil di sarungnya di bawah, karet pengikat di tepi kanan, jahitan di sampul.
 * Tulisan tangan = fon tulisan sistem (Bradley Hand / Segoe Print / Chalkboard / "casual" Android), 16-18 px, tinta biru-hitam.
 *
 * Props rencana TETAP: { pernyataan, bukti } (+ opsional):
 *   menunggu          pernyataan yang BELUM disemat (layar semat): tampil pudar seperti coretan pensil;
 *   pernyataanBaru    id yang baru disemat: kalimatnya "menulis sendiri" (0,9 s) lalu pin jatuh;
 *   sorotPernyataan   id yang sedang dibantah (KEBERATAN): baris berpendar jingga;
 *   pilihBukti        KEBERATAN: slip bukti = pilihan tunggal (terpilih, sorot, redup, onPilih), datanya sama dengan KartuBukti;
 *   tanpaPensil       tanpa baris pensil (layar yang butuh tinggi).
 * Tinggi (hitung, HP 360): halaman atas 42 + 68 per pernyataan; jilid 12; halaman bawah 42 + 58 per bukti; pensil 20; sampul 18.
 * Penuh (2 + 3) = 446 px. Diekspor juga: PotretReaksi (potret reaksi T-077) dan KartuPernyataan (kartu lama, masih dipakai uji).
 */
import type { CSSProperties } from 'react';
import { t } from '../../../i18n';
import { PotretPikselHp } from '../../ui/latar/piksel/PotretPikselHp';
import buktiUrl from '../../seni/investigasi/bukti.png';
import bukti2Url from '../../seni/investigasi/bukti-kasus2.png';
import reaksi2Url from '../../seni/investigasi/reaksi-kasus2.png';
import type { IdTokohPiksel } from '../../seni/piksel';
import klipUrl from '../../seni/investigasi/klip.png';
import pensilUrl from '../../seni/investigasi/pensil.png';
import reaksiUrl from '../../seni/investigasi/reaksi.png';
import { IkonInv, useTx, type Bukti, type Pernyataan, type Tx } from './dasar';
import './investigasi.css';
import './buku.css';

/**
 * Potret reaksi 64 x 64 (seni/investigasi/reaksi.png): tokoh + tanda emosi. T-084: Miss Raksa di episode ini = INVESTIGATOR:
 * memegang kaca pembesar (di mata: 'miss-berpikir' dan 'miss-detektif'; diturunkan: 'miss-bangga') dan memakai lencana detektif.
 */
const SEL_REAKSI = {
  'tol-kaget': 0, 'tol-mengaku': 1, 'darto-lega': 2, 'miss-berpikir': 3, 'miss-bangga': 4, 'miss-detektif': 5,
  // T-091, kasus 2 (seni/investigasi/reaksi-kasus2.png, 256 x 64): sel 100 + n
  'yusuf-cemas': 100, 'yusuf-terbuka': 101, 'yusuf-lega': 102, 'agus-serius': 103,
} as const;
export type Reaksi = keyof typeof SEL_REAKSI;
/** T-091: nama reaksi dari data kasus (`konfig.keberatan.reaksi`, string bebas) -> Reaksi yang ada, atau undefined. */
export const reaksiSah = (nama: string | undefined): Reaksi | undefined => (nama && nama in SEL_REAKSI ? (nama as Reaksi) : undefined);
export function PotretReaksi({ reaksi, ukuran = 64, label = '' }: { reaksi: Reaksi; ukuran?: 48 | 64 | 128; label?: string }) {
  // T-084: Miss Raksa pada 48 px = POTONGAN 1:1 (x 12..60, y 2..50 selnya), bukan pengecilan 0,75: kaca pembesar dan matanya
  // tetap piksel utuh. Sel lain pada 48 px tetap diperkecil (tanda emosinya ada di sudut sel).
  const potong = ukuran === 48 && reaksi.startsWith('miss-');
  const kasus2 = SEL_REAKSI[reaksi] >= 100;
  const sel = SEL_REAKSI[reaksi] % 100, lebar = kasus2 ? 256 : 384;
  const gaya = potong
    ? { backgroundSize: '384px 64px', backgroundPosition: `${-sel * 64 - 12}px -2px` }
    : { backgroundSize: `${lebar * ukuran / 64}px ${ukuran}px`, backgroundPosition: `${-sel * ukuran}px 0` };
  return (
    <span className="iv-reaksi" data-reaksi={reaksi} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      style={{ width: ukuran, height: ukuran, backgroundImage: `url(${kasus2 ? reaksi2Url : reaksiUrl})`, ...gaya }} />
  );
}

const TOKOH_PIKSEL: Readonly<Record<Pernyataan['siapa'], IdTokohPiksel>> = { darto: 'darto', petugasTol: 'tol', yusuf: 'yusuf', agus: 'agus' };

/** Kartu pernyataan lama (T-077): potret + nama + kalimat (+ tombol "Sematkan"). Layar semat & KEBERATAN kini memakai buku. */
export function KartuPernyataan({ pernyataan, tersemat = false, onSemat, reaksi, sorot = false, tx }: {
  pernyataan: Pernyataan; tersemat?: boolean; onSemat?: (id: string) => void; reaksi?: Reaksi; sorot?: boolean; tx?: Tx;
}) {
  const teks = useTx(tx);
  const nama = t(`investigasi.siapa.${pernyataan.siapa}`);
  return (
    <figure className="iv-pernyataan" data-pernyataan={pernyataan.id} data-tersemat={tersemat ? '' : undefined} data-sorot={sorot || tersemat ? '' : undefined}>
      {tersemat ? <IkonInv nama="pin" className="iv-pernyataan-pin" /> : null}
      <span className="iv-pernyataan-potret" aria-hidden="true">
        {reaksi ? <PotretReaksi reaksi={reaksi} ukuran={48} /> : <PotretPikselHp tokoh={TOKOH_PIKSEL[pernyataan.siapa]} ekspresi="netral" ukuran={48} label="" />}
      </span>
      <figcaption className="iv-pernyataan-teks"><b>{nama}</b><q>{teks(pernyataan.teks)}</q></figcaption>
      {onSemat ? (
        tersemat
          ? <span className="iv-semat-sudah" role="status">{t('investigasi.tersemat')}</span>
          : <button type="button" className="iv-semat" data-semat="" onClick={() => onSemat(pernyataan.id)}><IkonInv nama="pin" kali={1} />{t('investigasi.semat')}</button>
      ) : null}
    </figure>
  );
}

/** Potongan gambar bukti 84 x 44 di slip (dari sel 96 x 68 seni/investigasi/bukti.png; T-091 kasus 2: bukti-kasus2.png). */
const POTONG_BUKTI: Record<Bukti['id'], readonly [string, number, number]> = {
  dashcam: [buktiUrl, 6, 0], rambu: [buktiUrl, 102, 10], sim: [buktiUrl, 198, 12],
  'foto-interior': [bukti2Url, 6, 10], struk: [bukti2Url, 102, 14], 'polis-kasus2': [bukti2Url, 198, 22],
};

export interface PilihBukti {
  terpilih: Bukti['id'] | null;
  /** Bukti yang bagian gambarnya disorot (petunjuk). */
  sorot?: Bukti['id'] | null;
  /** Bukti yang pudar dan tidak bisa dipilih (langkah dipandu). */
  redup?: (id: Bukti['id']) => boolean;
  onPilih: (id: Bukti['id']) => void;
  /** T-088: bukti yang gambarnya bisa DIPERBESAR (ketuk gambarnya) sebelum memilih; mis. rekaman dashcam. */
  bisaPerbesar?: readonly Bukti['id'][];
  onPerbesar?: (id: Bukti['id']) => void;
}
/** T-088: pernyataan `id` sudah DIKOREKSI: kalimat lamanya dicoret, `teks` ditulis di bawahnya (tinta merah); `baru` = dengan gerak. */
export interface KoreksiPernyataan { id: string; teks: string; baru?: boolean }

function BarisKeterangan({ p, keadaan, sorot, teks, koreksi }: { p: Pernyataan; keadaan: 'tersemat' | 'baru' | 'menunggu'; sorot: boolean; teks: Tx; koreksi?: KoreksiPernyataan }) {
  return (
    <li className="bk-baris" data-pernyataan={p.id} data-keadaan={keadaan} data-sorot={sorot ? '' : undefined} data-koreksi={koreksi ? (koreksi.baru ? 'baru' : 'ada') : undefined}>
      <span className="bk-polaroid" aria-hidden="true">
        <PotretPikselHp tokoh={TOKOH_PIKSEL[p.siapa]} ekspresi="netral" ukuran={40} label="" />
        {keadaan !== 'menunggu' ? <IkonInv nama="pin" kali={1} className="bk-pin" /> : null}
      </span>
      <span className="bk-baris-teks">
        <b className="bk-siapa">{t(`investigasi.siapa.${p.siapa}`)}</b>
        <q className="bk-tulisan">{teks(p.teks)}</q>
        {koreksi ? <ins className="bk-tulisan bk-koreksi">{koreksi.teks}</ins> : null}
      </span>
    </li>
  );
}

function SlipBukti({ b, pilih, teks, baru }: { b: Bukti; pilih?: PilihBukti; teks: Tx; baru?: boolean }) {
  const [atlas, px, py] = POTONG_BUKTI[b.id];
  const isi = (
    <>
      <i className="bk-klip" aria-hidden="true" style={{ backgroundImage: `url(${klipUrl})` }} />
      <span className="bk-slip-gambar" aria-hidden="true" style={{ backgroundImage: `url(${atlas})`, backgroundPosition: `${-px}px ${-py}px` }}>
        {pilih?.sorot === b.id ? <i className="bk-slip-sorot" data-bukti={b.id} /> : null}
      </span>
      <span className="bk-slip-teks"><b className="bk-tulisan">{teks(b.judul)}</b></span>
      {pilih ? <span className="iv-bukti-tanda" aria-hidden="true">{pilih.terpilih === b.id ? '✓' : ''}</span> : null}
    </>
  );
  if (!pilih) return <li><div className="bk-slip" data-bukti={b.id} data-baru={baru ? '' : undefined} title={teks(b.sumber)}>{isi}</div></li>;
  const redup = pilih.redup?.(b.id) ?? false;
  const zum = !!pilih.onPerbesar && !!pilih.bisaPerbesar?.includes(b.id);
  return (
    <li className={zum ? 'bk-slip-berzum' : undefined}>
      {/* T-088: gambar slip = tombol perbesar (saudara tombol pilih, bukan di dalamnya) */}
      {zum ? <button type="button" className="bk-slip-zum" data-perbesar={b.id} aria-haspopup="dialog" aria-label={t('investigasi.keberatan.perbesar')} onClick={() => pilih.onPerbesar!(b.id)}><IkonInv nama="tambahan" kali={1} /></button> : null}
      <button type="button" className="bk-slip" data-bukti={b.id} data-redup={redup ? '' : undefined} aria-pressed={pilih.terpilih === b.id} disabled={redup}
        aria-label={`${t('investigasi.bukti')}: ${teks(b.judul)}. ${teks(b.sumber)}`} onClick={() => pilih.onPilih(b.id)}>
        {isi}
      </button>
    </li>
  );
}

export function BukuCatatan({ pernyataan, bukti, tx, menunggu, pernyataanBaru, sorotPernyataan, pilihBukti, tanpaPensil = false, buktiBaru, halaman = 'semua', koreksi }: {
  pernyataan: Pernyataan[];
  bukti: Bukti[];
  tx?: Tx;
  menunggu?: Pernyataan;
  pernyataanBaru?: string;
  sorotPernyataan?: string;
  pilihBukti?: PilihBukti;
  tanpaPensil?: boolean;
  /** T-080: bukti yang baru dikumpulkan: slipnya meluncur masuk lalu klipnya menjepit. T-087: boleh beberapa sekaligus. */
  buktiBaru?: Bukti['id'] | readonly Bukti['id'][];
  /** T-080: 'bukti' = hanya halaman "Bukti" (layar "Bukti baru!", supaya muat bersama kalimat temuannya). */
  halaman?: 'semua' | 'bukti' | 'keterangan';
  /** T-088: pernyataan yang sudah dikoreksi (KEBERATAN berhasil): "Laporan dikoreksi: lajur 2". */
  koreksi?: KoreksiPernyataan;
}) {
  const teks = useTx(tx);
  const jumlah = pernyataan.length;
  return (
    <section className="bk" aria-label={t('investigasi.bukuInvestigator')} data-buku-catatan="" data-halaman={halaman} style={{ '--bk-pensil': `url(${pensilUrl})` } as CSSProperties}>
      <span className="bk-elastis" aria-hidden="true" />
      {halaman === 'bukti' ? null : <>
      <div className="bk-halaman bk-atas">
        <h3 className="bk-judul"><IkonInv nama="pin" kali={1} />{t('investigasi.keterangan')}<span className="iv-hitung">{jumlah}</span></h3>
        {jumlah || menunggu ? (
          <ul className="bk-daftar">
            {pernyataan.map((p) => <BarisKeterangan key={p.id} p={p} keadaan={p.id === pernyataanBaru ? 'baru' : 'tersemat'} sorot={p.id === sorotPernyataan} teks={teks} koreksi={koreksi?.id === p.id ? koreksi : undefined} />)}
            {menunggu ? <BarisKeterangan key={`tunggu-${menunggu.id}`} p={menunggu} keadaan="menunggu" sorot={false} teks={teks} /> : null}
          </ul>
        ) : <p className="bk-kosong bk-tulisan">{t('investigasi.kosongPernyataan')}</p>}
      </div>
      {halaman === 'keterangan' ? null : <span className="bk-jilid" aria-hidden="true" />}
      </>}
      {halaman === 'keterangan' ? null : <div className="bk-halaman bk-bawah">
        <h3 className="bk-judul"><IkonInv nama="foto" kali={1} />{t('investigasi.bukti')}<span className="iv-hitung">{bukti.length}</span></h3>
        {bukti.length
          ? <ul className="bk-daftar bk-slip-daftar">{bukti.map((b) => <SlipBukti key={b.id} b={b} pilih={pilihBukti} teks={teks} baru={typeof buktiBaru === 'string' ? b.id === buktiBaru : !!buktiBaru?.includes(b.id)} />)}</ul>
          : <p className="bk-kosong bk-tulisan">{t('investigasi.kosongBukti')}</p>}
      </div>}
      {tanpaPensil ? null : <span className="bk-pensil" aria-hidden="true" />}
    </section>
  );
}
