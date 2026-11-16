/**
 * Adegan jalan "Periksa rambu" (T-020 batch 1: seni PIKSEL, seni/aktivitas/jalan + peta). Tanpa aturan permainan: menerima tanda
 * lajur dari luar dan melapor ketukan lajur / tiang rambu. Jalan tampak atas, lalu lintas ke atas, lajur 1 paling kiri. Truk diam
 * di lajur keterangan supir. Lajur = tombol setinggi adegan (target sentuh lebar); tanda = arsiran + garis tepi + muka rambu + tuts
 * berarsir (bukan hanya warna). Semua posisi = px dari tepi blok jalan (seni/geometri.ts), tidak ada yang diskalakan.
 */
import '../seni/aktivitas/piksel.css';
import { CINCIN, JUMLAH_LAJUR, LAJUR_TRUK, PANAH, TRUK, TUTS, geserLajur, selTuts, type KeadaanTuts } from './seni/geometri';

export interface RambuAdegan {
  /** Nama rambu untuk pembaca layar ("Periksa Rambu 1"). */
  label: string;
  /** terkunci = belum boleh diperiksa (55 %); aktif = rambu yang diperiksa sekarang; selesai = sudah diperiksa, bisa dibuka lagi. */
  keadaan: 'terkunci' | 'aktif' | 'selesai';
  /** Tanpa ini tiang hanya hiasan. */
  onKetuk?: () => void;
}

export interface PropsAdegan {
  tanda1: ReadonlyArray<number>;
  tanda2: ReadonlyArray<number>;
  /** Lajur bisa diketuk (tahap menandai). */
  bisaTandai?: boolean;
  /** Rambu yang sedang ditandai: menentukan keadaan `aria-pressed` tiap lajur. */
  aktifTanda?: ReadonlyArray<number>;
  onLajur?: (n: number) => void;
  /** Tanpa tombol (jalan hanya ditampilkan, mis. saat menjawab Pak Bima). */
  statis?: boolean;
  /** Cincin putus-putus kuning + label "Truk · menurut supir" di sekeliling truk. */
  cincinTruk?: boolean;
  /** Tulisan ilustrasi dalam bahasa pemakai (Episode 2: tabel teks). Tanpa ini = Indonesia (prototipe /lokasi). */
  label?: LabelAdegan;
  /** Tiang rambu di bahu kiri (rambu 1, rambu 2). Tanpa ini: dua tiang hiasan. */
  rambu?: ReadonlyArray<RambuAdegan>;
  /** Atas truk (px), mutlak. Tanpa ini: 80 dikurangi potongan atas adegan (--potong, D-182). Langkah kesimpulan memakai 12 (D-185). */
  atasTruk?: number;
  /** Tanpa kalimat keterangan di bawah gambar (pemanggil menulis legendanya sendiri). */
  tanpaKeterangan?: boolean;
}

export interface LabelAdegan { jalan: string; truk: string; keterangan: string; lajur: (n: number) => string; lajurTruk: (n: number) => string }
const LABEL_ID: LabelAdegan = {
  jalan: 'Ilustrasi jalan empat lajur, arah lalu lintas ke atas',
  truk: 'Truk · menurut supir',
  keterangan: 'Ilustrasi • posisi truk menurut supir. Bukan denah kejadian.',
  lajur: (n) => `Lajur ${n}`,
  lajurTruk: (n) => `Lajur ${n}, posisi truk menurut supir`,
};

const LAJUR = Array.from({ length: JUMLAH_LAJUR }, (_, i) => i + 1);
const namaLajur = (n: number, l: LabelAdegan): string => (n === LAJUR_TRUK ? l.lajurTruk(n) : l.lajur(n));
/** `calc(var(--x0) + Npx)`: N px dari tepi kiri blok jalan. */
const dariJalan = (px: number): string => `calc(var(--x0) + ${px}px)`;

/** Isi visual satu lajur: tanda rambu 1 (arsir merah, tepi utuh) dan rambu 2 (arsir biru, tepi putus-putus) + muka rambunya. */
function IsiLajur({ tanda1, tanda2 }: { tanda1: boolean; tanda2: boolean }) {
  return (
    <>
      {tanda1 ? (
        <span className="lk-tanda lk-tanda-merah lk-masuk" data-tanda="rambu1">
          <span className="lk-tanda-arsir" /><span className="lk-tanda-tepi" /><span className="px px-muka px-muka-1" />
        </span>
      ) : null}
      {tanda2 ? (
        <span className="lk-tanda lk-tanda-biru lk-masuk" data-tanda="rambu2">
          <span className="lk-tanda-arsir" /><span className="lk-tanda-tepi" /><span className="px px-muka px-muka-2" />
        </span>
      ) : null}
    </>
  );
}

export function Adegan({ tanda1, tanda2, bisaTandai = false, aktifTanda = [], onLajur, statis = false, cincinTruk = false, label = LABEL_ID, rambu, atasTruk, tanpaKeterangan = false }: PropsAdegan) {
  /** `top` = n px dari atas adegan penuh (236); ikut naik bila adegan dipotong dari atas, kecuali atas truk ditentukan pemanggil. */
  const atas = (n: number): string | number => (atasTruk === undefined ? `calc(${n}px - var(--potong, 0px))` : n - TRUK.atas + atasTruk);
  const hidup = !statis && bisaTandai;
  const kiriTruk = geserLajur(LAJUR_TRUK);
  const keadaan = (n: number): KeadaanTuts => (tanda1.includes(n) ? 'dilarang' : tanda2.includes(n) ? 'lajurKiri' : 'biasa');
  return (
    <figure className="lk-adegan">
      <div className={`lk-kotak lk-px${hidup ? ' lk-hidup' : ''}`} role="group" aria-label={label.jalan}>
        <span className="px-jalan" aria-hidden="true" />
        {LAJUR.map((n) => <span key={n} className="px-panah" aria-hidden="true" style={{ left: dariJalan(geserLajur(n) + PANAH.geser) }} />)}

        {LAJUR.map((n) => {
          const gaya = { left: dariJalan(geserLajur(n)) };
          const a = tanda1.includes(n); const b = tanda2.includes(n);
          return statis ? (
            <div key={n} className="lk-lajur lk-lajur-statis" style={gaya} aria-hidden="true"><IsiLajur tanda1={a} tanda2={b} /></div>
          ) : (
            <button key={n} type="button" className={`lk-lajur${aktifTanda.includes(n) ? ' is-on' : ''}`} style={gaya} disabled={!bisaTandai}
              aria-pressed={bisaTandai ? aktifTanda.includes(n) : undefined} aria-label={namaLajur(n, label)} onClick={() => onLajur?.(n)}>
              <IsiLajur tanda1={a} tanda2={b} />
            </button>
          );
        })}

        <span className="px-truk-bayangan" aria-hidden="true" style={{ left: dariJalan(kiriTruk + TRUK.geser + TRUK.bayangan), top: atas(TRUK.atas + TRUK.bayangan) }} />
        <span className="px-truk" aria-hidden="true" data-truk="" style={{ left: dariJalan(kiriTruk + TRUK.geser), top: atas(TRUK.atas) }} />
        {cincinTruk ? (
          <div className="lk-cincin lk-cincin-masuk" aria-hidden="true" style={{ left: dariJalan(kiriTruk + CINCIN.geser), top: atas(CINCIN.atas) }}>
            <span className="lk-cincin-label">{label.truk}</span>
          </div>
        ) : null}

        {LAJUR.map((n) => {
          const k = keadaan(n); const sel = selTuts(n, k);
          return <span key={n} className="px-tuts" aria-hidden="true" data-tuts={n} data-keadaan={k} data-tekan={k === 'biasa' ? undefined : ''} style={{ left: dariJalan(geserLajur(n) + TUTS.geser), backgroundPosition: `${sel.x}px ${sel.y}px` }} />;
        })}

        {(rambu ?? [null, null]).map((r, i) => (r?.onKetuk ? (
          <button key={i} type="button" className="lk-tiang" data-rambu={i} data-keadaan={r.keadaan} disabled={r.keadaan === 'terkunci'} aria-label={r.label} onClick={r.onKetuk}>
            <span className={`px px-tiang-${i + 1}`} /><span className="lk-tiang-nomor" aria-hidden="true">{i + 1}</span>
          </button>
        ) : (
          <span key={i} className="lk-tiang" data-rambu={i} data-keadaan={r?.keadaan ?? 'selesai'} aria-hidden="true" style={{ cursor: 'default' }}>
            <span className={`px px-tiang-${i + 1}`} />{r ? <span className="lk-tiang-nomor">{i + 1}</span> : null}
          </span>
        )))}

        <span className="px px-pohon-1 px-hias-a" aria-hidden="true" /><span className="px px-pohon-2 px-hias-b" aria-hidden="true" />
        <span className="px px-semak px-hias-c" aria-hidden="true" /><span className="px px-semak px-hias-d" aria-hidden="true" />
      </div>
      {tanpaKeterangan ? null : <figcaption className="lk-keterangan">{label.keterangan}</figcaption>}
    </figure>
  );
}
