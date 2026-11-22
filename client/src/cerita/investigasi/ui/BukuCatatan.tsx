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
 *
 * T-115 (pemilik: "semua layar tanpa menggulir"): buku penuh tidak lagi dipakai utuh di layar mana pun. Tiga prop baru:
 *   satu          halaman "Keterangan" menampilkan SATU pernyataan: baris keping polaroid bernomor (48 x 56, sasaran ketuk 52 x 60)
 *                 memilih pernyataannya; isinya selebar halaman (nama, kalimat, koreksi). Catatan "Tanya lebih lanjut" pernyataan
 *                 itu dibuka dengan satu tombol dan MENGGANTIKAN kalimatnya (tombol yang sama mengembalikannya), jadi tinggi
 *                 halaman tidak bertambah. Dipakai lembar buku catatan (Menu) dan arsip kasus.
 *   ringkasBukti  halaman "Bukti" tinggal kepalanya ("BUKTI 3"): layar semat cukup memperlihatkan bahwa buktinya ada.
 *   jumlahBukti   angka di kepala halaman "Bukti" bila yang digambar hanya sebagian (layar "Bukti baru!": slip yang baru saja).
 *
 * T-127 (babak 2, masukan Pak Peterson butir 12, 14, 17; semua opsional, tanpa prop ini buku persis seperti di atas):
 *   temuan            per id bukti: baris TEMUAN di slipnya, di bawah judul kartu yang netral. `mapan` false = tafsiran pemain
 *                     (tanda pensil, garis putus); true = temuan yang sudah terbukti (centang, tinta). Slip ber-temuan memotong
 *                     judulnya menjadi satu baris, jadi tinggi slip tetap 52 px.
 *   pilihPernyataan   KEBERATAN berpasangan: halaman "Keterangan" = keping polaroid yang bisa DIPILIH (satu), kalimat keterangan
 *                     yang dipilih di bawahnya. Bersama `pilihBukti` = "pilih dua catatan".
 *   tanya[].jeli      pertanyaan itu berguna: TANDA JELI (bintang di keping + satu baris di catatan tanya-jawabnya).
 *   `Bukti.seni`      gambar slip dari seni babak 2 (ui/seniR2.ts) sebagai ganti potongan atlas lama.
 */
import { useState, type CSSProperties } from 'react';
import { t } from '../../../i18n';
import { PotretPikselHp } from '../../ui/latar/piksel/PotretPikselHp';
import buktiUrl from '../../seni/investigasi/bukti.png';
import bukti2Url from '../../seni/investigasi/bukti-kasus2.png';
import { PanelAssets } from './panel/aset';
import { SENI_R2, type IdSeniR2 } from './seniR2';
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

// T-104: pihak kasus 3 memakai tokoh piksel seni T-103 (terdaftar di seni/piksel). Baris kasus 1-2 tidak berubah.
const TOKOH_PIKSEL: Readonly<Record<Pernyataan['siapa'], IdTokohPiksel>> = { darto: 'darto', petugasTol: 'tol', yusuf: 'yusuf', agus: 'agus', pemohon: 'pemohon', penaksir: 'penaksir' };

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
  'foto-interior': [bukti2Url, 6, 10], struk: [bukti2Url, 102, 14], 'polis-kasus2': [bukti2Url, 198, 12],
  // T-104: kartu kasus 3 = gambar kartu Designer T-103 (satu PNG 96 x 68 per kartu); potongan 84 x 44 dari tengahnya.
  'kartu-kejadian': [PanelAssets.evidence['kartu-kejadian']!.thumb, 6, 12], 'foto-inspeksi': [PanelAssets.evidence['foto-inspeksi']!.thumb, 6, 12],
  'pesan-pengajuan': [PanelAssets.evidence['pesan-pengajuan']!.thumb, 6, 12], penawaran: [PanelAssets.evidence.penawaran!.thumb, 6, 12],
};

/** T-127: potongan gambar slip sebuah kartu: seni babak 2 (`Bukti.seni`, sel 96 x 68) bila ada, selain itu atlas lama. */
function potongBukti(b: Bukti): readonly [string, number, number] {
  const r2 = b.seni && b.seni in SENI_R2 ? SENI_R2[b.seni as IdSeniR2] : null;
  return r2 ? [r2.thumb, 6, 12] : POTONG_BUKTI[b.id];
}

/** T-127: baris temuan di slip sebuah bukti (teks jadi, pendek). */
export interface TemuanSlip { teks: string; mapan: boolean }
/** T-127: keterangan sebagai pilihan tunggal (KEBERATAN berpasangan). `terkunci` = sudah dipandu: tidak bisa diganti lagi. */
export interface PilihPernyataan { terpilih: string | null; onPilih: (id: string) => void; terkunci?: boolean }

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

/** T-106: "Tanya lebih lanjut" yang sudah dibuka pada pernyataan `id`: pertanyaan dan jawabannya ditulis di bawah pernyataan itu. */
export interface TanyaPernyataan { id: string; tanya: string; jawab: string; /** T-127: label tanda jeli bila pertanyaannya berguna. */ jeli?: string }

function BarisKeterangan({ p, keadaan, sorot, teks, koreksi, tanya }: { p: Pernyataan; keadaan: 'tersemat' | 'baru' | 'menunggu'; sorot: boolean; teks: Tx; koreksi?: KoreksiPernyataan; tanya?: TanyaPernyataan }) {
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
        {tanya ? <span className="bk-tanya" data-tanya-lanjut=""><b>{t('investigasi.tanyaLanjut')}</b><span>{tanya.tanya}</span><q className="bk-tulisan">{tanya.jawab}</q>{tanya.jeli ? <em className="bk-jeli" data-tanda-jeli=""><span aria-hidden="true">✦</span>{tanya.jeli}</em> : null}</span> : null}
      </span>
    </li>
  );
}

/**
 * T-115: halaman "Keterangan" satu pernyataan per tampilan. Keping = tab (polaroid + nomor urut, supaya dua keterangan dari
 * orang yang sama tetap terbedakan); panelnya = nama, kalimat (dicoret bila dikoreksi), baris koreksi. Bila pernyataan itu punya
 * catatan "Tanya lebih lanjut", tombol di bawahnya menukar kalimat dengan catatan itu dan sebaliknya.
 */
function KeteranganSatu({ pernyataan, teks, koreksi, tanya }: { pernyataan: Pernyataan[]; teks: Tx; koreksi: readonly KoreksiPernyataan[]; tanya?: readonly TanyaPernyataan[] }) {
  const [pilih, setPilih] = useState(0);
  const [bukaTanya, setBukaTanya] = useState(false);
  const k = Math.min(pilih, pernyataan.length - 1);
  const p = pernyataan[k]!;
  const kor = koreksi.find((x) => x.id === p.id);
  const tny = tanya?.find((x) => x.id === p.id);
  const terbuka = !!tny && bukaTanya;
  return (
    <div className="bk-satu" data-keterangan-satu="">
      <div className="bk-keping" role="tablist" aria-label={t('investigasi.keterangan')}>
        {pernyataan.map((x, i) => (
          <button key={x.id} type="button" role="tab" aria-selected={i === k} className="bk-keping-tombol" data-keping={x.id}
            aria-label={`${i + 1}. ${t(`investigasi.siapa.${x.siapa}`)}`} onClick={() => { setPilih(i); setBukaTanya(false); }}>
            <span className="bk-polaroid" aria-hidden="true">
              <PotretPikselHp tokoh={TOKOH_PIKSEL[x.siapa]} ekspresi="netral" ukuran={40} label="" />
              <IkonInv nama="pin" kali={1} className="bk-pin" />
            </span>
            <i className="bk-keping-no" aria-hidden="true">{i + 1}</i>
            {tanya?.find((y) => y.id === x.id)?.jeli ? <i className="bk-keping-jeli" aria-hidden="true">✦</i> : null}
          </button>
        ))}
      </div>
      <div className="bk-baris bk-satu-isi" role="tabpanel" data-pernyataan={p.id} data-keadaan="tersemat" data-koreksi={kor ? 'ada' : undefined}>
        <b className="bk-siapa">{t(`investigasi.siapa.${p.siapa}`)}</b>
        {tny && bukaTanya ? (
          <span className="bk-tanya" data-tanya-lanjut=""><b>{t('investigasi.tanyaLanjut')}</b><span>{tny.tanya}</span><q className="bk-tulisan">{tny.jawab}</q>{tny.jeli ? <em className="bk-jeli" data-tanda-jeli=""><span aria-hidden="true">✦</span>{tny.jeli}</em> : null}</span>
        ) : (
          <>
            <q className="bk-tulisan">{teks(p.teks)}</q>
            {kor ? <ins className="bk-tulisan bk-koreksi">{kor.teks}</ins> : null}
          </>
        )}
        {tny ? (
          <button type="button" className="bk-tanya-tombol" data-tanya-tombol="" aria-expanded={terbuka} onClick={() => setBukaTanya((v) => !v)}>
            {terbuka ? <><span aria-hidden="true">‹</span>{t('investigasi.keterangan')}</> : <>{t('investigasi.tanyaLanjut')}<span aria-hidden="true">›</span></>}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * T-127: halaman "Keterangan" sebagai PILIHAN (KEBERATAN berpasangan): keping polaroid bernomor = pilihan tunggal; kalimat keterangan
 * yang dipilih tampil di bawahnya (belum memilih = ajakan satu baris). Tinggi tetap: panelnya selalu setinggi keterangan terpanjang
 * (semua kalimat menumpuk di satu sel, yang tidak dipilih tak terlihat), jadi slip bukti di bawahnya tidak melompat.
 */
function KeteranganPilih({ pernyataan, teks, pilih }: { pernyataan: Pernyataan[]; teks: Tx; pilih: PilihPernyataan }) {
  return (
    <div className="bk-satu bk-pilih-ket" data-keterangan-pilih="" data-terkunci={pilih.terkunci ? '' : undefined}>
      <div className="bk-keping" role="radiogroup" aria-label={t('investigasi.keterangan')}>
        {pernyataan.map((x, i) => (
          <button key={x.id} type="button" role="radio" aria-checked={pilih.terpilih === x.id} className="bk-keping-tombol" data-keping={x.id} data-pilih-keterangan={x.id}
            disabled={pilih.terkunci && pilih.terpilih !== x.id} aria-label={`${i + 1}. ${t(`investigasi.siapa.${x.siapa}`)}: ${teks(x.teks)}`} onClick={() => { if (!pilih.terkunci) pilih.onPilih(x.id); }}>
            <span className="bk-polaroid" aria-hidden="true">
              <PotretPikselHp tokoh={TOKOH_PIKSEL[x.siapa]} ekspresi="netral" ukuran={40} label="" />
              <IkonInv nama="pin" kali={1} className="bk-pin" />
            </span>
            <i className="bk-keping-no" aria-hidden="true">{i + 1}</i>
          </button>
        ))}
      </div>
      <div className="bk-pilih-tumpuk" aria-live="polite">
        {pernyataan.map((x) => (
          <div key={x.id} className="bk-baris bk-satu-isi" data-pernyataan={x.id} data-keadaan="tersemat" data-sembunyi={pilih.terpilih === x.id ? undefined : ''} aria-hidden={pilih.terpilih === x.id ? undefined : true}>
            <b className="bk-siapa">{t(`investigasi.siapa.${x.siapa}`)}</b>
            <q className="bk-tulisan">{teks(x.teks)}</q>
          </div>
        ))}
        {pilih.terpilih ? null : <p className="bk-pilih-ajak">{t('investigasi.pasang.pilihKet')}</p>}
      </div>
    </div>
  );
}

function SlipBukti({ b, pilih, teks, baru, temuan }: { b: Bukti; pilih?: PilihBukti; teks: Tx; baru?: boolean; temuan?: TemuanSlip }) {
  const [atlas, px, py] = potongBukti(b);
  const isi = (
    <>
      <i className="bk-klip" aria-hidden="true" style={{ backgroundImage: `url(${klipUrl})` }} />
      <span className="bk-slip-gambar" aria-hidden="true" style={{ backgroundImage: `url(${atlas})`, backgroundPosition: `${-px}px ${-py}px` }}>
        {pilih?.sorot === b.id ? <i className="bk-slip-sorot" data-bukti={b.seni ? undefined : b.id} /> : null}
      </span>
      <span className="bk-slip-teks" data-bertemuan={temuan ? '' : undefined}>
        <b className="bk-tulisan">{teks(b.judul)}</b>
        {temuan ? <small className="bk-slip-temuan" data-temuan={temuan.mapan ? 'mapan' : 'tafsir'}><span aria-hidden="true">{temuan.mapan ? '✓' : '✎'}</span><span className="sr-only">{t(temuan.mapan ? 'investigasi.temuan.mapan' : 'investigasi.temuan.tafsir')}: </span>{temuan.teks}</small> : null}
      </span>
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
        aria-label={`${t('investigasi.bukti')}: ${teks(b.judul)}. ${teks(b.sumber)}${temuan ? `. ${t(temuan.mapan ? 'investigasi.temuan.mapan' : 'investigasi.temuan.tafsir')}: ${temuan.teks}` : ''}`} onClick={() => pilih.onPilih(b.id)}>
        {isi}
      </button>
    </li>
  );
}

export function BukuCatatan({ pernyataan, bukti, tx, menunggu, pernyataanBaru, sorotPernyataan, pilihBukti, tanpaPensil = false, buktiBaru, halaman = 'semua', koreksi, tanya, satu = false, ringkasBukti = false, jumlahBukti, temuan, pilihPernyataan }: {
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
  koreksi?: KoreksiPernyataan | readonly KoreksiPernyataan[];
  /** T-106: "Tanya lebih lanjut" yang sudah dibuka (satu per pernyataan). */
  tanya?: readonly TanyaPernyataan[];
  /** T-115: halaman "Keterangan" satu pernyataan per tampilan (keping polaroid memilihnya). */
  satu?: boolean;
  /** T-115: halaman "Bukti" tinggal kepalanya (jumlah saja, tanpa slip). */
  ringkasBukti?: boolean;
  /** T-115: angka di kepala halaman "Bukti" bila `bukti` hanya sebagian dari yang terkumpul. */
  jumlahBukti?: number;
  /** T-127: baris temuan per id bukti (tafsiran pemain atau temuan yang sudah terbukti). */
  temuan?: Readonly<Record<string, TemuanSlip>>;
  /** T-127: keterangan sebagai pilihan tunggal (KEBERATAN berpasangan). */
  pilihPernyataan?: PilihPernyataan;
}) {
  const teks = useTx(tx);
  const semuaKoreksi: readonly KoreksiPernyataan[] = !koreksi ? [] : 'id' in koreksi ? [koreksi] : koreksi;
  const jumlah = pernyataan.length;
  return (
    <section className="bk" aria-label={t('investigasi.bukuInvestigator')} data-buku-catatan="" data-halaman={halaman} data-ringkas-bukti={ringkasBukti ? '' : undefined} style={{ '--bk-pensil': `url(${pensilUrl})` } as CSSProperties}>
      <span className="bk-elastis" aria-hidden="true" />
      {halaman === 'bukti' ? null : <>
      <div className="bk-halaman bk-atas">
        <h3 className="bk-judul"><IkonInv nama="pin" kali={1} />{t('investigasi.keterangan')}<span className="iv-hitung">{jumlah}</span></h3>
        {pilihPernyataan && jumlah ? <KeteranganPilih pernyataan={pernyataan} teks={teks} pilih={pilihPernyataan} /> : satu && jumlah ? <KeteranganSatu pernyataan={pernyataan} teks={teks} koreksi={semuaKoreksi} tanya={tanya} /> : jumlah || menunggu ? (
          <ul className="bk-daftar">
            {pernyataan.map((p) => <BarisKeterangan key={p.id} p={p} keadaan={p.id === pernyataanBaru ? 'baru' : 'tersemat'} sorot={p.id === sorotPernyataan} teks={teks} koreksi={semuaKoreksi.find((k) => k.id === p.id)} tanya={tanya?.find((x) => x.id === p.id)} />)}
            {menunggu ? <BarisKeterangan key={`tunggu-${menunggu.id}`} p={menunggu} keadaan="menunggu" sorot={false} teks={teks} /> : null}
          </ul>
        ) : <p className="bk-kosong bk-tulisan">{t('investigasi.kosongPernyataan')}</p>}
      </div>
      {halaman === 'keterangan' ? null : <span className="bk-jilid" aria-hidden="true" />}
      </>}
      {halaman === 'keterangan' ? null : <div className="bk-halaman bk-bawah">
        <h3 className="bk-judul"><IkonInv nama="foto" kali={1} />{t('investigasi.bukti')}<span className="iv-hitung">{jumlahBukti ?? bukti.length}</span></h3>
        {ringkasBukti ? null : bukti.length
          ? <ul className="bk-daftar bk-slip-daftar">{bukti.map((b) => <SlipBukti key={b.id} b={b} pilih={pilihBukti} teks={teks} temuan={temuan?.[b.id]} baru={typeof buktiBaru === 'string' ? b.id === buktiBaru : !!buktiBaru?.includes(b.id)} />)}</ul>
          : <p className="bk-kosong bk-tulisan">{t('investigasi.kosongBukti')}</p>}
      </div>}
      {tanpaPensil ? null : <span className="bk-pensil" aria-hidden="true" />}
    </section>
  );
}
