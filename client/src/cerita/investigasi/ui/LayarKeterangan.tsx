/**
 * T-079: LAYAR KETERANGAN (Episode 1 Investigator): ruang wawancara ditata sebagai WAWANCARA, dengan gerak.
 * Pemilik: "Pak Darto cuma berdiri, terasa datar; buat seperti situasinya, ada geraknya." Hanya tampilan: naskah, graf, dan mesin
 * tidak berubah (baris tetap maju lewat komposer pemutar HP: "Lanjut").
 *
 * Panggung 336 x 236 (1 piksel seni = 2 px):
 *   latar   dinding ruang wawancara (seni/piksel/ep2-ruang-wawancara-latar.png, potongan 168 x 118 pada 2x);
 *   TV      (T-083) TV dinding di kanan atas menggantikan papan tulis seni ruangan; saksi duduk 20 px di kiri pusat supaya
 *           kepalanya tidak menutupi TV;
 *   saksi   DUDUK di seberang meja: potret piksel tokoh (pose berdiri atlas samping, 2x) dari kepala sampai dada; badan bawahnya
 *           tertutup tepi meja di sisi pemain (seni/investigasi/meja-depan.png: buku catatan, pena, cangkir kopi);
 *   putaran diam   napas (naik-turun 2 px tiap 2,6 s) + kedip (lapisan wajah "mata tutup" 0,14 s tiap 3,8 s);
 *   putaran bicara kepala mengangguk kecil selama kalimatnya diketik (teks muncul huruf demi huruf; ketuk teks = tampil utuh);
 *   ketukan gerak  per baris (GERAK_BARIS): condong ke depan, bersandar ke belakang, menggeleng, mengusap keringat (tetes jatuh);
 *   potret reaksi T-078 (REAKSI_BARIS) muncul di sudut kanan atas panggung.
 * Di kalimat KUNCI (KILAS_BARIS) panggung berganti ke panel KILAS BALIK (KilasBalik.tsx) yang memperagakan kalimat itu; baris
 * berikutnya kembali ke ruangan. Miss Raksa lewat telepon = sisipan potret kecil di kiri atas (seperti sisipan telepon lama).
 * Gerak dikurangi: tanpa ketik, tanpa putaran; bingkai diam.
 *
 * Dipakai pemutar HP untuk node DIALOG episode ber-`investigasi` yang lokasinya 'wawancara' dan ada saksi berpotret (darto / tol /
 * bima) di ruangan: `pakaiKeterangan`. Ukur 360 x 640 (hitung; ruang .hp-main sesudah kepala 56 + baris tujuan +- 52 + bantalan):
 * panggung 236 + dialog (nama 30 + sampai 4 baris 18 px = 104 + aksi 62 + bantalan 22 = 218) = 454 px <= +- 492.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotion } from '../../../hooks';
import { t } from '../../../i18n';
import { jenisPenutur, ketukanKini } from '../../hp/alur';
import { barisTerlihat, nodeKini } from '../../mesin';
import { susunTokoh, svgTokoh, type IdTokohPiksel } from '../../seni/piksel';
import latarRuang from '../../seni/piksel/ep2-ruang-wawancara-latar.png';
import mejaDepan from '../../seni/investigasi/meja-depan.png';
import type { Baris, Ekspresi, Episode, KunciTeks, StateCerita } from '../../tipe';
import { komposisiLatar } from '../../ui/latar/komposisi';
import { idPikselPemeran } from '../../ui/latar/piksel/adegan';
import { PotretReaksi } from './BukuCatatan';
import { KilasBalik, type Kilas } from './KilasBalik';
import { REAKSI_BARIS } from './reaksiBaris';
import { SerahDashcam, TvDinding } from './SerahDashcam';
import './keterangan.css';

/** Saksi yang bisa didudukkan (punya atlas piksel samping). */
const SAKSI: readonly string[] = ['darto', 'tol', 'bima', 'yusuf', 'agus'];
/** Kalimat kunci -> panel kilas balik. */
export const KILAS_BARIS: Readonly<Record<string, Kilas>> = { 'inv.darto.3': 'darto', 'inv.tol.3': 'tol', 'inv2.yusuf.2': 'benturan', 'inv2.agus.3': 'turun' };
/**
 * T-091: wajah saksi per baris (tampilan saja, menimpa `ekspresi` naskah). Pak Yusuf saat meluruskan keterangannya = TERBUKA:
 * menjelaskan dengan tenang, kedua telapak tangan terbuka (wajah + badan 'terbuka', Ekspresi cerita 'tersenyum'); bukan pose malu.
 */
export const EKSPRESI_BARIS: Readonly<Record<string, Ekspresi>> = { 'inv2.akui.1': 'tersenyum' };
/** Ketukan gerak saksi per baris. */
type Gerak = 'condong' | 'mundur' | 'geleng' | 'usap' | 'angguk';
export const GERAK_BARIS: Readonly<Record<string, Gerak>> = {
  'inv.darto.2': 'condong',
  'inv.tol.2': 'angguk',
  'inv.keb-buka.2': 'geleng',
  'inv.akui.1': 'mundur',
  'inv.akui.2': 'usap',
  'inv.akui.3': 'angguk',
  // T-091, kasus 2
  'inv2.yusuf.3': 'angguk',
  'inv2.agus.2': 'angguk',
  'inv2.agus.3': 'condong',
  'inv2.keb-buka.2': 'mundur',
};

/** true = node ini digambar LayarKeterangan (bukan panggung adegan umum). */
export function pakaiKeterangan(ep: Episode, state: StateCerita): boolean {
  if (!ep.investigasi) return false;
  const n = nodeKini(ep, state);
  // Node dialog dan pengantar aktivitas (dashcam / SIM: kartu tugasnya tampil di baris aksi); node pilihan tetap panggung umum.
  if (!n || (n.jenis !== 'dialog' && n.jenis !== 'aktivitas') || state.baris <= 0) return false;
  const k = komposisiLatar(ep, state);
  return k.lokasi === 'wawancara' && k.hadir.some((x) => SAKSI.includes(x.id));
}

/** Teks muncul huruf demi huruf; `selesai` = sudah utuh. Gerak dikurangi / teks kosong = langsung utuh. */
function useKetik(teks: string, kunci: string, langsung: boolean): { n: number; selesai: boolean; tuntaskan: () => void } {
  const [n, setN] = useState(langsung ? teks.length : 0);
  useEffect(() => {
    if (langsung) { setN(teks.length); return; }
    setN(0);
    let i = 0;
    const id = window.setInterval(() => { i += 2; setN(Math.min(i, teks.length)); if (i >= teks.length) window.clearInterval(id); }, 28);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci, langsung]);
  return { n, selesai: n >= teks.length, tuntaskan: () => setN(teks.length) };
}

/** Saksi duduk: dua lapisan SVG (mata buka + mata tutup untuk kedip), 2x, dipotong tepi meja oleh panggung. */
function SaksiDuduk({ id, ekspresi, bicara, gerak, serah }: { id: string; ekspresi: Ekspresi; bicara: boolean; gerak?: Gerak; /** T-082: serah terima dashcam sedang diputar (sprite disembunyikan sebentar oleh bingkai lengan). */ serah?: boolean }) {
  const svg = useMemo(() => {
    try {
      const buka = susunTokoh(id as IdTokohPiksel, { pose: 'berdiri', hadap: 'kanan', ekspresi });
      const tutup = susunTokoh(id as IdTokohPiksel, { pose: 'berdiri', hadap: 'kanan', ekspresi, mata: 'tutup' });
      if (!buka) return null;
      return { buka: svgTokoh(buka, { skala: 2 }), tutup: tutup ? svgTokoh(tutup, { skala: 2 }) : '', w: buka.ukuran.w * 2 };
    } catch { return null; }
  }, [id, ekspresi]);
  if (!svg) return null;
  return (
    <span className="kt-saksi" data-tokoh={id} data-bicara={bicara ? '' : undefined} data-gerak={serah ? undefined : gerak} data-serah={serah ? '' : undefined} style={{ width: svg.w, marginLeft: -svg.w / 2 - 20 } as CSSProperties}>
      <span className="kt-saksi-badan">
        <span className="kt-lapis" dangerouslySetInnerHTML={{ __html: svg.buka }} />
        {svg.tutup ? <span className="kt-lapis kt-kedip" dangerouslySetInnerHTML={{ __html: svg.tutup }} /> : null}
      </span>
      {gerak === 'usap' ? <><i className="kt-tetes" /><i className="kt-tetes kt-tetes-2" /></> : null}
    </span>
  );
}

export function LayarKeterangan({ ep, state, tx, nama, komposer, mulaiTugas }: {
  ep: Episode;
  state: StateCerita;
  tx: (k: KunciTeks) => string;
  nama: (id: string) => string;
  /** Baris aksi pemutar HP (Lanjut). */
  komposer: ReactNode;
  /** T-080: node aktivitas yang barisnya habis: buka arenanya (dipakai serah terima dashcam, pengganti kartu TUGAS umum). */
  mulaiTugas?: () => void;
}) {
  const kurang = useReducedMotion();
  const k = komposisiLatar(ep, state);
  const semua = barisTerlihat(ep, state);
  const ket = ketukanKini(ep, state);
  const baris: Baris[] = ket ? semua.slice(ket.awal, ket.akhir + 1) : [];
  const ucapan = [...baris].reverse().find((b) => jenisPenutur(ep, b.siapa) !== 'narasi') ?? null;
  // Saksi di kursi: pembicara baris ini bila ia saksi; selain itu saksi terakhir yang bicara di node ini; selain itu yang hadir.
  const sudah = semua.slice(0, Math.max(0, state.baris));
  const saksi = (ucapan && SAKSI.includes(ucapan.siapa) ? ucapan.siapa : null)
    ?? [...sudah].reverse().find((b) => SAKSI.includes(b.siapa))?.siapa
    ?? k.hadir.find((x) => SAKSI.includes(x.id))?.id ?? null;
  const ekspresi: Ekspresi = (ucapan && ucapan.siapa === saksi ? EKSPRESI_BARIS[ucapan.teks] ?? ucapan.ekspresi : k.hadir.find((x) => x.id === saksi)?.ekspresi) ?? 'netral';
  const kunci = `${state.node}:${state.baris}`;
  const kilas = ucapan ? KILAS_BARIS[ucapan.teks] : undefined;
  const gerak = ucapan && ucapan.siapa === saksi ? GERAK_BARIS[ucapan.teks] : undefined;
  const reaksi = ucapan ? REAKSI_BARIS[ucapan.teks] : undefined;
  const teksUcapan = ucapan ? tx(ucapan.teks) : '';
  const ketik = useKetik(teksUcapan, kunci, kurang);
  const bicaraSaksi = !!ucapan && ucapan.siapa === saksi && !ketik.selesai;
  const lewatTelepon = !!k.telepon && !!ucapan && ucapan.siapa === k.telepon.id;
  // Kartu tugas (node aktivitas, baris habis) ikut di baris aksi: panggung memendek (168 px) supaya tetap satu layar. Bila teks
  // dialog masih meluap, baris tujuan di atas layar disembunyikan (cara yang sama dengan AdeganTatap: data-tanpa-tujuan; tujuan
  // tetap ada di Menu).
  const nodeIni = nodeKini(ep, state);
  // T-080: pengantar arena DASHCAM = serah terima rekaman di meja (Pak Darto menyerahkan kartu memori, laptop menyala), dengan
  // satu tombol "Putar rekaman"; panggung tetap utuh. Aktivitas lain tetap kartu tugas pemutar HP di panggung pendek.
  const serah = !!mulaiTugas && nodeIni?.jenis === 'aktivitas' && nodeIni.aktivitas === 'dashcam' && state.baris >= semua.length;
  const adaTugas = !serah && nodeIni?.jenis === 'aktivitas' && state.baris >= semua.length;
  const akar = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = akar.current; const layar = el?.closest<HTMLElement>('.hp-layar'); const isi = el?.querySelector<HTMLElement>('.kt-isi');
    if (!el || !layar || !isi) return;
    layar.removeAttribute('data-tanpa-tujuan');
    if (isi.scrollHeight > isi.clientHeight + 1) layar.setAttribute('data-tanpa-tujuan', '');
    return () => layar.removeAttribute('data-tanpa-tujuan');
  });

  return (
    <div ref={akar} className="kt" data-keterangan="" data-node={state.node} data-tugas={adaTugas ? '' : undefined}>
      <div className="kt-panggung" data-kilas={kilas} key={kilas ? `kilas:${kunci}` : 'ruang'}>
        {kilas ? <KilasBalik jenis={kilas} nama={nama(ucapan!.siapa)} /> : (
          <>
            <span className="kt-latar" aria-hidden="true" style={{ backgroundImage: `url(${latarRuang})` }} />
            {/* T-083: TV dinding menggantikan papan tulis; menyala hanya saat serah terima rekaman dashcam */}
            <TvDinding key={serah ? `tv:${kunci}` : 'tv'} nyala={serah && saksi === 'darto'} />
            {saksi ? <SaksiDuduk key={saksi} id={idPikselPemeran(ep, saksi)} ekspresi={ekspresi} bicara={bicaraSaksi} gerak={gerak} serah={serah && saksi === 'darto'} /> : null}
            <span className="kt-meja" aria-hidden="true" style={{ backgroundImage: `url(${mejaDepan})` }} />
            {serah && saksi === 'darto' ? <SerahDashcam key={kunci} /> : null}
            {k.telepon ? (
              <span className="kt-telepon" data-bicara={lewatTelepon ? '' : undefined} aria-hidden="true">
                <PotretReaksi reaksi={reaksi && reaksi.startsWith('miss-') ? reaksi : 'miss-berpikir'} ukuran={64} />
              </span>
            ) : null}
            {reaksi && !reaksi.startsWith('miss-') ? <span className="kt-reaksi" key={kunci} aria-hidden="true"><PotretReaksi reaksi={reaksi} ukuran={64} /></span> : null}
          </>
        )}
      </div>
      <article className="kt-dialog" aria-live="polite">
        <div className="kt-isi">
          {baris.map((b, i) => {
            if (jenisPenutur(ep, b.siapa) === 'narasi') return <p key={i} className="hp-narasi">{tx(b.teks)}</p>;
            const p = ep.pemeran[b.siapa];
            const terakhir = b === ucapan;
            const teks = tx(b.teks);
            return (
              <div key={i} className="hp-ucapan" data-penutur={b.siapa}>
                <p className="hp-ucapan-nama"><b>{nama(b.siapa)}</b>{p ? <span>{tx(p.peran)}</span> : null}{lewatTelepon && terakhir ? <span className="kt-via">{t('investigasi.viaTelepon')}</span> : null}</p>
                {terakhir && !ketik.selesai ? (
                  // Diketik: bagian yang belum muncul tetap memesan tempat (transparan), jadi kotak dialog tidak melompat.
                  <p className="hp-ucapan-teks kt-ketik" onClick={ketik.tuntaskan}><span className="sr-only">{teks}</span><span aria-hidden="true">{teks.slice(0, ketik.n)}</span><span className="kt-belum" aria-hidden="true">{teks.slice(ketik.n)}</span></p>
                ) : <p className="hp-ucapan-teks">{teks}</p>}
              </div>
            );
          })}
        </div>
        <div className="kt-aksi">
          {serah ? <button type="button" className="primary-action kt-tombol-serah" data-putar-rekaman="" onClick={mulaiTugas}>▶ {t('investigasi.serah.putar')}</button> : komposer}
        </div>
      </article>
    </div>
  );
}
