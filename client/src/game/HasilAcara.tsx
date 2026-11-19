/**
 * T-055: hasil / pembahasan misi PAKET ACARA (10 kasus pertandingan, id aNN-*) dalam bahasa Episode 1. Data, skor, dan alur sama
 * persis dengan HasilMisi (MissionPlay.tsx mengalihkan ke sini); hanya penyajiannya:
 *  - kepala = Bu Isti PIKSEL (potret 40 x 40, x 2) + gelembung bicara: nama juri, vonis (judul), chip vonis berwarna status
 *    (tepat / sebagian / belum / terlewat) dan lencana poin piksel;
 *  - "Sudah tepat", "Masih terlewat" / "Yang tepat", "Kamu pilih" sebagai daftar ringkas berikon (satu butir per baris);
 *  - "Intinya" sebagai kartu catatan berlampu (takeaway), alasan panjang dilipat di balik kunci "Kenapa begitu?" (gaya Episode 1:
 *    tampilan pertama pendek, lipatan boleh menggulir di dalam);
 *  - nyaman dibaca: 16 px, tinggi baris 1,5, lebar paling banyak +- 60 huruf.
 * Gaya: ./hasil-acara.css. Teks: kunci kamus yang sudah ada (misi.*, tokoh.isti.juri), jadi id / en / zh ikut.
 */
import type { ReactNode } from 'react';
import { TOKOH } from '@shared/brand';
import type { MissionAnswer, MissionPublic, MissionReveal } from '@shared/types';
import urlIsti from '../cerita/seni/piksel/ikon-isti-juri.png';
import { t, useBahasa } from '../i18n';
import { judulHasil, nilaiMisi, statusMisi, type BarisHasil, type StatusMisi } from './hasil';
import './hasil-acara.css';

const tanpaTitikDua = (s: string): string => s.replace(/\s*[:：]\s*$/, '');
const KATA_VONIS: Record<StatusMisi, string> = { tepat: 'misi.status.tepat', sebagian: 'misi.status.sebagian', belum: 'misi.status.belum', terlewat: 'misi.status.kosong' };

/** Ikon piksel 12 x 12 (rect, crispEdges): centang, silang, seru, lampu. */
function IkonPiksel({ jenis }: { jenis: 'tepat' | 'salah' | 'terlewat' | 'lampu' }) {
  const POLA: Record<typeof jenis, string[]> = {
    tepat: ['............', '..........##', '.........##.', '........##..', '.......##...', '#.....##....', '##...##.....', '.##.##......', '..###.......', '...#........', '............', '............'],
    salah: ['............', '.##......##.', '..##....##..', '...##..##...', '....####....', '.....##.....', '....####....', '...##..##...', '..##....##..', '.##......##.', '............', '............'],
    terlewat: ['.....##.....', '.....##.....', '.....##.....', '.....##.....', '.....##.....', '.....##.....', '.....##.....', '............', '............', '.....##.....', '.....##.....', '............'],
    lampu: ['....####....', '...#....#...', '..#..##..#..', '..#.#..#.#..', '..#..##..#..', '..#......#..', '...#....#...', '....#..#....', '....####....', '....####....', '.....##.....', '............'],
  };
  const rect: ReactNode[] = [];
  POLA[jenis].forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') rect.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />); }));
  return <svg className={'ha-ikon ha-ikon-' + jenis} width="18" height="18" viewBox="0 0 12 12" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" focusable="false">{rect}</svg>;
}

/** T-060: on a phone a list shows at most DAFTAR_MAKS items (one line each, hasil-acara.css); the rest are in the "Kenapa" fold. */
const DAFTAR_MAKS = 3;

function Daftar({ jenis, judul, isi, potong = false }: { jenis: 'tepat' | 'salah' | 'terlewat'; judul: string; isi: BarisHasil[]; potong?: boolean }) {
  if (!isi.length) return null;
  const tampil = potong ? isi.slice(0, DAFTAR_MAKS) : isi;
  return (
    <section className="ha-daftar" data-jenis={jenis}>
      <h3><IkonPiksel jenis={jenis} />{tanpaTitikDua(judul)}</h3>
      <ul>
        {tampil.map((b, i) => <li key={i}>{b.teks}</li>)}
        {tampil.length < isi.length ? <li className="ha-lagi">{t('misi.lainDiKenapa', { n: isi.length - tampil.length })}</li> : null}
      </ul>
    </section>
  );
}

export function HasilAcara({ mission, reveal, answer, akurasi, dijawab, poin = null, keterangan, aksi, catatan, padat = false, raihan }: {
  mission: MissionPublic;
  reveal: MissionReveal;
  answer: MissionAnswer | null;
  akurasi: number;
  dijawab: boolean;
  poin?: number | null;
  keterangan?: ReactNode;
  aksi?: ReactNode;
  catatan?: ReactNode;
  padat?: boolean;
  raihan?: ReactNode;
}) {
  useBahasa();
  const st = statusMisi(akurasi, dijawab);
  const judul = judulHasil(st);
  const rinci = nilaiMisi(mission.steps, reveal, dijawab ? answer : null);
  const banyak = rinci.length > 1;
  const juri = TOKOH.isti.aktif;
  // Gabungan semua langkah; misi berlangkah banyak memberi nomor langkah di depan butir.
  const awalan = (i: number) => (banyak ? `${i + 1}. ` : '');
  const benar = rinci.flatMap((h, i) => h.pilihan.filter((p) => p.tanda === 'tepat').map((p) => ({ ...p, teks: awalan(i) + p.teks })));
  const salah = rinci.flatMap((h, i) => h.pilihan.filter((p) => p.tanda === 'salah').map((p) => ({ ...p, teks: awalan(i) + p.teks })));
  const sisa = rinci.flatMap((h, i) => h.tepat.filter((p) => p.tanda !== 'dipilih').map((p) => ({ ...p, teks: awalan(i) + p.teks })));
  const kumpul = mission.steps.some((s) => s.kind === 'multi');
  const alasan = rinci.filter((h) => h.alasan?.trim());
  // T-060: lists longer than DAFTAR_MAKS are cut on the phone (padat); the full lists then also live in the "Kenapa" fold.
  const terpotong = padat && [benar, sisa, salah].some((d) => d.length > DAFTAR_MAKS);
  const judulSisa = kumpul && benar.length ? t('misi.masihTerlewat') : t('misi.yangTepat');
  return (
    <div className="hasil hasil-acara" data-hasil={st} data-padat={padat ? '' : undefined}>
      {/* T-060: phone = one compact row: Bu Isti 44 px + verdict chip + points (the verdict sentence stays for screen readers). */}
      <div className="ha-kepala">
        {juri ? <img className="ha-isti" src={urlIsti} width={80} height={80} alt="" aria-hidden="true" /> : null}
        <div className="ha-gelembung">
          {juri ? <span className="ha-juri">{TOKOH.isti.nama} · {t('tokoh.isti.juri')}</span> : null}
          <h2 className="hasil-judul">{judul.judul}</h2>
          <div className="ha-chip-baris">
            <span className="ha-vonis" data-st={st}>
              <IkonPiksel jenis={st === 'tepat' ? 'tepat' : st === 'sebagian' ? 'terlewat' : 'salah'} />
              {t(KATA_VONIS[st])}
            </span>
            {poin !== null ? <span className="ha-poin"><b>+{poin.toLocaleString('id-ID')}</b> {t('misi.poin')}</span> : null}
          </div>
        </div>
      </div>
      {!padat || st === 'terlewat' ? <p className="ha-sub">{keterangan ?? judul.sub}</p> : null}
      {raihan ? <div className="hasil-raihan">{raihan}</div> : null}

      <div className="ha-daftar-semua">
        {st === 'terlewat' && !salah.length && !benar.length ? <p className="ha-kosong"><IkonPiksel jenis="salah" />{t('misi.belumMenjawab')}</p> : null}
        <Daftar jenis="tepat" judul={t('misi.sudahTepat')} isi={benar} potong={padat} />
        <Daftar jenis="terlewat" judul={judulSisa} isi={sisa} potong={padat} />
        <Daftar jenis="salah" judul={t('misi.kamuPilih')} isi={salah} potong={padat} />
      </div>

      <div className="ha-inti">
        <span className="ha-inti-lampu"><IkonPiksel jenis="lampu" /></span>
        <p><b>{tanpaTitikDua(t('misi.intinya'))}</b>{reveal.learning}</p>
      </div>

      {aksi ? <div className="hasil-aksi">{aksi}</div> : null}

      {/* T-060: "Kenapa" key and the small leaderboard note share one footer row (no separate line). */}
      <div className="ha-kaki">
        {alasan.length || terpotong ? (
          <details className="ha-kenapa">
            <summary className="ha-kenapa-kunci">{st === 'tepat' ? t('misi.kenapaTepat') : t('misi.kenapaBegitu')}</summary>
            <div className="ha-kenapa-isi">
              {alasan.map((h, i) => (
                <div key={h.stepId}>
                  {banyak ? <b>{i + 1}. {h.prompt}</b> : null}
                  <p>{h.alasan}</p>
                </div>
              ))}
              {terpotong ? (
                <div className="ha-kenapa-daftar">
                  <b>{t('misi.daftarLengkap')}</b>
                  <Daftar jenis="tepat" judul={t('misi.sudahTepat')} isi={benar} />
                  <Daftar jenis="terlewat" judul={judulSisa} isi={sisa} />
                  <Daftar jenis="salah" judul={t('misi.kamuPilih')} isi={salah} />
                </div>
              ) : null}
            </div>
          </details>
        ) : null}
        {catatan ? <div className="ha-catatan">{catatan}</div> : null}
      </div>
    </div>
  );
}
