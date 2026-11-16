/**
 * Adegan jalan "Periksa rambu": komposisi visual dari aset ekspor Claude Design (seni/). Tanpa aturan permainan:
 * menerima tanda lajur dari luar dan melapor ketukan lajur. Truk diam di lajur keterangan supir (tidak ada animasi gerak).
 * Lajur = tombol penuh (target sentuh lebar); tanda = arsiran + garis tepi + lencana (bukan hanya warna); nomor lajur dan truk
 * tetap terbaca di atas tanda.
 */
import { IkonTandai, JalanEmpatLajur, TrukBiru, ArsirLajur } from './seni/Aset';
import { JUMLAH_LAJUR, LAJUR_TRUK, kiriTrukPersen, persenLajur, TRUK_LEBAR_PERSEN, tinggiTrukPersen, TRUK_ATAS_PERSEN } from './seni/geometri';

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
  /** Lingkaran putus-putus kuning + label "Truk · menurut supir" di sekeliling truk. */
  cincinTruk?: boolean;
  /** Tulisan ilustrasi dalam bahasa pemakai (Episode 2: tabel teks). Tanpa ini = Indonesia (prototipe /lokasi). */
  label?: LabelAdegan;
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

/** Isi visual satu lajur: tanda rambu 1 (merah) dan rambu 2 (biru) dengan arsiran, garis tepi, dan lencana. */
function IsiLajur({ n, tanda1, tanda2 }: { n: number; tanda1: boolean; tanda2: boolean }) {
  return (
    <>
      {tanda1 ? (
        <span className="lk-tanda lk-tanda-merah lk-masuk" data-tanda="rambu1">
          <ArsirLajur varian="merah" />
          <span className="lk-tanda-tepi" />
          <span className="lk-lencana"><IkonTandai /></span>
        </span>
      ) : null}
      {tanda2 ? (
        <span className="lk-tanda lk-tanda-biru lk-masuk" data-tanda="rambu2">
          <ArsirLajur varian="biru" />
          <span className="lk-tanda-tepi" />
          <span className="lk-lencana"><IkonTandai /></span>
        </span>
      ) : null}
    </>
  );
}

export function Adegan({ tanda1, tanda2, bisaTandai = false, aktifTanda = [], onLajur, statis = false, cincinTruk = false, label = LABEL_ID }: PropsAdegan) {
  const hidup = !statis && bisaTandai;
  const t = persenLajur(LAJUR_TRUK);
  return (
    <figure className="lk-adegan">
      <div className={`lk-kotak${hidup ? ' lk-hidup' : ''}`} role="group" aria-label={label.jalan}>
        <div className="lk-seni"><JalanEmpatLajur /></div>

        {LAJUR.map((n) => {
          const p = persenLajur(n);
          const gaya = { left: `${p.kiri}%`, width: `${p.lebar}%` };
          const a = tanda1.includes(n); const b = tanda2.includes(n);
          return statis ? (
            <div key={n} className="lk-lajur lk-lajur-statis" style={gaya} aria-hidden="true"><IsiLajur n={n} tanda1={a} tanda2={b} /></div>
          ) : (
            <button key={n} type="button" className={`lk-lajur${aktifTanda.includes(n) ? ' is-on' : ''}`} style={gaya} disabled={!bisaTandai}
              aria-pressed={bisaTandai ? aktifTanda.includes(n) : undefined} aria-label={namaLajur(n, label)} onClick={() => onLajur?.(n)}>
              <IsiLajur n={n} tanda1={a} tanda2={b} />
            </button>
          );
        })}

        <div className="lk-truk" aria-hidden="true" style={{ left: `${kiriTrukPersen(LAJUR_TRUK)}%`, top: `${TRUK_ATAS_PERSEN}%`, width: `${TRUK_LEBAR_PERSEN}%` }}><TrukBiru /></div>

        {cincinTruk ? (
          <div className="lk-cincin lk-cincin-masuk" aria-hidden="true"
            style={{ left: `${t.tengah - (TRUK_LEBAR_PERSEN + 3.3) / 2}%`, top: `${TRUK_ATAS_PERSEN - 1.67}%`, width: `${TRUK_LEBAR_PERSEN + 3.3}%`, height: `${tinggiTrukPersen() + 3.3}%` }}>
            <span className="lk-cincin-label">{label.truk}</span>
          </div>
        ) : null}

        {LAJUR.map((n) => (
          <span key={n} aria-hidden="true" className={`lk-num${tanda1.includes(n) ? ' on-merah' : ''}${tanda2.includes(n) ? ' on-biru' : ''}`} style={{ left: `${persenLajur(n).tengah}%` }}>{n}</span>
        ))}
      </div>
      <figcaption className="lk-keterangan">{label.keterangan}</figcaption>
    </figure>
  );
}
