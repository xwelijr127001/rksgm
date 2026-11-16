/**
 * ADEGAN TATAP MUKA (antarmuka HP), gaya VISUAL NOVEL: panggung latar (lokasi + tokoh; pembicara disorot, di lapangan
 * kamera mengikuti pembicara setengah badan) dan KOTAK DIALOG yang menumpang sedikit di bawah panggung, satu komposisi.
 *
 * - Satu ketukan = satu BEAT (alur.ts): narasi sebagai konteks tanpa kartu terpisah, ucapan dengan tab nama + peran
 *   (potret kecil hanya bila penuturnya tidak di panggung). Tokoh lain yang hadir: baris "Hadir: ..." (identitas tetap
 *   terbaca tanpa papan nama di gambar).
 * - Tinggi panggung mengikuti isi (`tinggiPanggung`): beat pendek = panggung tinggi (tokoh besar), beat panjang atau
 *   keputusan yang menunggu = panggung pendek, supaya tindakan berikutnya dekat dengan dialognya.
 * - Aksi yang menyatu (Lanjut, mulai tugas, ringkasan akhir) ada DI DALAM kotak dialog; pilihan keputusan tepat di bawahnya
 *   tanpa kartu tambahan. Umpan balik tindakan & catatan status = baris di kotak dialog, bukan kartu bertumpuk.
 * Pada bidikan dekat, kotak dialog menumpang pita bawah panggung yang dicadangkan kamera (`TUMPANG_DIALOG`): tidak menutupi
 * tokoh/papan; pada bidikan lebar (narasi di lapangan) dialog tepat di bawah gambar.
 */
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { KUERI_CANGKANG_LAYAR } from './cangkang';
import { barisTerlihat } from '../mesin';
import type { Baris, Episode, KunciTeks, StateCerita } from '../tipe';
import { t } from '../../i18n';
import { selaPembicara } from '../ui/bagian';
import { komposisiLatar } from '../ui/latar/komposisi';
import { PanggungLatar } from '../ui/latar/PanggungLatar';
import { adeganPiksel } from '../ui/latar/piksel/adegan';
import { hangatkanKomposisi, komposisiBerikut, sesudahAdeganSiap } from '../ui/latar/hangatkan';
import { RUANG_PIKSEL } from '../ui/latar/piksel/ruang';
import { jenisPenutur, ketukanKini } from './alur';
import { CatatanStatus, PotretHp } from './bagianHp';

export interface StatusSesudah {
  sebelum: string;
  sesudah: string;
  arah: 'naik' | 'turun' | 'tetap';
  alasan: string;
}

/** Pita bawah panggung (px CSS) yang ditumpangi kotak dialog (sama dengan --hp-vn-tumpang di hp.css). */
export const TUMPANG_DIALOG = 22;

export type TinggiPanggung = 'tinggi' | 'sedang' | 'pendek';
/**
 * Tinggi panggung HP untuk beat ini: keputusan yang menunggu atau teks panjang (> 260 huruf) = pendek (2:1), beat singkat
 * (<= 140 huruf) = tinggi (4:3, tokoh besar), selebihnya sedang (16:10).
 */
export function tinggiPanggung(panjangTeks: number, menungguPilihan: boolean): TinggiPanggung {
  if (menungguPilihan || panjangTeks > 260) return 'pendek';
  return panjangTeks <= 140 ? 'tinggi' : 'sedang';
}

/**
 * Owner 16 Nov (iPhone): bingkai panggung tidak boleh melompat di antara dua ketukan berurutan di ruang yang sama (dulu: bentuk
 * dipilih PER KETUKAN dari panjang teksnya, jadi salam pendek = 1:1 bidikan dekat, kalimat berikutnya = 16:10 bidikan lebar).
 * Sekarang bentuk dipilih per NODE (dari ketukan terpanjangnya) dan diingat per ruang + lebar layar: selama lokasi tidak berganti
 * bentuk hanya boleh TURUN (bila sebuah ketukan tidak muat), tidak pernah naik lagi.
 */
let bentukRuang: { ruang: string; lebar: number; bentuk: string } | null = null;
const URUT_BENTUK = ['tinggi', 'sedang', 'pendek'];

export function AdeganTatap({ ep, state, tx, namaPemain, status, tindakan, buktiTindakan, statusSesudah, komposer, aksiDiDialog, sisipan, tugasNanti = null }: {
  ep: Episode;
  state: StateCerita;
  tx: (k: KunciTeks) => string;
  namaPemain: string;
  /** Label status kumulatif nasabah untuk chip panggung. */
  status: string;
  /** Umpan balik tindakan pemain (sesudah aktivitas di adegan), mis. "Mas Rudi: Pool Pak Hendra." */
  tindakan: string | null;
  /** Bukti visual tindakan (mis. jalan bertanda K08 + tanggapan tokoh), tampil di bawah kalimat tindakan di beat pertama akibat. */
  buktiTindakan?: ReactNode;
  statusSesudah: StatusSesudah | null;
  komposer: ReactNode;
  /** true = komposer (Lanjut / tugas / ringkasan) di dalam kotak dialog; false = pilihan keputusan di bawahnya. */
  aksiDiDialog: boolean;
  sisipan?: ReactNode;
  /**
   * (D-174) Node aktivitas yang kartu tugasnya BELUM tampil: isi kartu itu. Dipakai untuk "bayangan" tak terlihat (ketukan
   * terakhir + kartu tugas) yang diukur, supaya kotak panggung node sudah benar sejak ketukan pertama dan tidak berubah saat
   * kartu tugas tiba.
   */
  tugasNanti?: { judul: string; instruksi: string; tombol: string } | null;
}) {
  const k = komposisiLatar(ep, state);
  // T-013: adegan = panggung piksel (PanggungLatar memilihnya lewat adapter yang sama).
  const piksel = adeganPiksel(ep, k).piksel;
  // T-010 G3: lokasi BERIKUTNYA (bila diketahui dari naskah) dipanaskan saat adegan ini tampil, memakai ukuran panggung
  // yang terpasang (cadangan: perkiraan). Lokasi sama tidak perlu. Dibatalkan saat state berganti / keluar halaman.
  const bingkai = useRef<HTMLDivElement>(null);
  const berikut = komposisiBerikut(ep, state);
  const kunciBerikut = berikut ? `${berikut.lokasi}|${berikut.hadir.map((x) => x.id).join(',')}` : '';
  useEffect(() => {
    if (!berikut) return;
    // Baru sesudah adegan kini tampil: PNG piksel lokasi berikutnya tidak berebut jaringan dengan yang sedang ditunggu.
    return sesudahAdeganSiap(bingkai.current, () => hangatkanKomposisi(ep, berikut));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep, kunciBerikut]);
  const ketukan = ketukanKini(ep, state);
  const baris = ketukan ? barisTerlihat(ep, state).slice(ketukan.awal, ketukan.akhir + 1) : [];
  const nama = (id: string) => (id === 'pemain' ? namaPemain : Object.prototype.hasOwnProperty.call(ep.pemeran, id) ? tx(ep.pemeran[id]!.nama) : id);
  const namaNasabah = nama(ep.nasabah);
  const diPanggung = new Set(k.hadir.map((x) => x.id));
  const panjang = baris.reduce((n, b) => n + tx(b.teks).length, 0) + (tindakan?.length ?? 0) + (statusSesudah ? statusSesudah.alasan.length + 40 : 0);
  // Ruangan tanpa tokoh: tidak perlu panggung setinggi bidikan tokoh.
  const kosong = k.hadir.length === 0;
  // Bentuk per NODE: ketukan terpanjang node ini (ucapan penutur/ekspresi yang sama + narasi yang menempel = satu ketukan).
  let panjangNode = panjang;
  /** Baris ketukan TERAKHIR node (untuk bayangan kartu tugas, D-174). */
  let barisAkhir: Baris[] = [];
  {
    let kini = 0; let lalu: Baris | null = null;
    for (const b of barisTerlihat(ep, state)) {
      const narasi = jenisPenutur(ep, b.siapa) === 'narasi';
      if (b.tata || (!narasi && (!lalu || lalu.siapa !== b.siapa || (lalu.ekspresi ?? 'netral') !== (b.ekspresi ?? 'netral')))) { kini = 0; barisAkhir = []; }
      barisAkhir.push(b);
      kini += tx(b.teks).length;
      panjangNode = Math.max(panjangNode, kini);
      if (!narasi) lalu = b;
    }
  }
  const tinggiIsi = tinggiPanggung(panjangNode, !aksiDiDialog);
  const tinggi = kosong && tinggiIsi === 'tinggi' ? 'sedang' : tinggiIsi;
  // Kotak dialog menumpang ke panggung hanya pada bidikan dekat (kantor di balik meja, atau pembicara setengah badan); bidikan
  // lebar saat narasi memperlihatkan kaki tokoh, jadi dialog tepat di bawah gambar.
  // 'dekat' = ruang bermeja layanan (kantor: tokoh di balik meja); selain itu tokoh berdiri berbadan penuh.
  const susun = piksel ? (RUANG_PIKSEL[piksel.ruang]?.tempat.balikMeja ? 'dekat' : 'berdiri') : undefined;
  // Ruangan kosong: dialog tepat di bawah gambar (benda di meja tidak tertutup).
  // K08 akibat: diagram jalan = bukti utama; ilustrasi lokasi besar tidak ditumpuk di atasnya (prototipe Claude Design).
  const tanpaPanggung = !!buktiTindakan;
  const dekat = !tanpaPanggung && !kosong && (susun === 'dekat' || k.hadir.some((x) => x.bicara));
  // Bidikan dekat 1:1 di balik meja hanya untuk tokoh berpotret dada-ke-atas (badan penuh diperbesar = lunak).
  const jenisSusun = susun === 'dekat' && (kosong || !k.hadir.every((x) => x.id === 'missRaksa' || x.id === ep.nasabah)) ? 'dekat-badan' : susun;
  // T-018 Tahap 2 (D-132): di cangkang HP adegan harus muat di layar. Yang mengalah, berurutan: panggung turun lewat bentuk yang
  // SUDAH ada (tinggi -> sedang -> pendek; paling rendah 2:1), lalu baris tujuan disembunyikan (tetap ada di Menu), baru teks
  // dialog menggulir di dalam kotaknya (.hp-vn-isi; tab nama lengket, baris aksi tersemat). Bentuk alami dipakai bila muat.
  // Diukur sebelum digambar; matematika kamera PanggungPiksel tidak disentuh (panggung hanya mengikuti kotaknya).
  const akar = useRef<HTMLDivElement>(null);
  const bentukAlami = tanpaPanggung ? 'tanpa' : tinggi;
  const kunciBeat = `${state.node}:${state.baris}`;
  const kunciLalu = useRef('');
  useLayoutEffect(() => {
    const el = akar.current; const layar = el?.closest<HTMLElement>('.hp-layar'); const isi = el?.querySelector<HTMLElement>('.hp-vn-isi');
    if (!el || !layar || !isi) return;
    const dialog = isi.parentElement!;
    const pas = () => {
      layar.removeAttribute('data-tanpa-tujuan');
      const cangkang = window.matchMedia(KUERI_CANGKANG_LAYAR).matches && layar.hasAttribute('data-kunci');
      let awal = bentukAlami;
      if (cangkang && awal !== 'tanpa') {
        // Ruang yang sama: lanjutkan bentuk yang sudah dipakai bila lebih rendah. Layar pendek (< 700 px): tanpa bentuk tinggi
        // (1:1 / 4:3), supaya ketukan pendek dan panjang di satu ruang memakai bingkai yang sama.
        if (bentukRuang && bentukRuang.ruang === k.lokasi && bentukRuang.lebar === window.innerWidth && URUT_BENTUK.indexOf(bentukRuang.bentuk) > URUT_BENTUK.indexOf(awal)) awal = bentukRuang.bentuk;
        if (window.innerHeight < 700 && awal === 'tinggi') awal = 'sedang';
      }
      el.setAttribute('data-panggung', awal);
      const muat = () => isi.scrollHeight <= isi.clientHeight + 1;
      if (cangkang && !muat()) {
        for (let i = URUT_BENTUK.indexOf(awal) + 1; i > 0 && i < URUT_BENTUK.length && !muat(); i++) el.setAttribute('data-panggung', URUT_BENTUK[i]!);
        if (!muat()) layar.setAttribute('data-tanpa-tujuan', '');
      }
      // D-174: bayangan (ketukan terakhir + kartu tugas) juga harus muat di kotak ini; bila tidak, turunkan SEKARANG.
      const bayangan = el.querySelector<HTMLElement>('[data-bayangan]'); const pg = el.querySelector<HTMLElement>('.cer-panggung.cer-latar'); const main = el.closest<HTMLElement>('.hp-main');
      if (cangkang && bayangan && pg && main) {
        const gm = getComputedStyle(main);
        const ruang = main.clientHeight - parseFloat(gm.paddingTop) - parseFloat(gm.paddingBottom);
        // Tanpa tumpang 22 px: ketukan kartu tugas sering tanpa pembicara, jadi dialognya tidak menumpang panggung (hitung aman).
        const muatNanti = () => pg.offsetHeight + bayangan.offsetHeight <= ruang + 1;
        for (let i = URUT_BENTUK.indexOf(el.getAttribute('data-panggung') ?? '') + 1; i > 0 && i < URUT_BENTUK.length && !muatNanti(); i++) el.setAttribute('data-panggung', URUT_BENTUK[i]!);
      }
      if (cangkang && awal !== 'tanpa') bentukRuang = { ruang: k.lokasi, lebar: window.innerWidth, bentuk: el.getAttribute('data-panggung') ?? awal };
      lebih();
    };
    const lebih = () => dialog.toggleAttribute('data-lebih', isi.scrollHeight - isi.scrollTop - isi.clientHeight > 2);
    if (kunciLalu.current !== kunciBeat) { kunciLalu.current = kunciBeat; isi.scrollTop = 0; }
    pas();
    isi.addEventListener('scroll', lebih, { passive: true });
    window.addEventListener('resize', pas);
    // Tata letak bisa berubah sesudah gambar pertama (font termuat, petunjuk suara hilang, bilah browser): ukur ulang.
    let hidup = true;
    void document.fonts?.ready.then(() => { if (hidup) pas(); });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => pas());
    const main = el.closest('.hp-main');
    if (ro && main) ro.observe(main);
    return () => { hidup = false; ro?.disconnect(); isi.removeEventListener('scroll', lebih); window.removeEventListener('resize', pas); layar.removeAttribute('data-tanpa-tujuan'); };
  });
  const isiBaris = (daftar: Baris[]) => kelompokkan(daftar).map((grup, i) => {
    const b = grup[0]!;
    const jenis = jenisPenutur(ep, b.siapa);
    if (jenis === 'narasi') return grup.map((x, j) => <p key={`${i}-${j}`} className="hp-narasi" data-topik={x.topik ? '' : undefined}>{x.topik ? <b className="hp-topik">{tx(x.topik)}</b> : null}{tx(x.teks)}</p>);
    const p = jenis === 'pemain' ? null : ep.pemeran[b.siapa];
    const akhir = grup[grup.length - 1]!;
    return (
      <div key={i} className="hp-ucapan" data-penutur={b.siapa}>
        <p className="hp-ucapan-nama">
          {jenis !== 'pemain' && (tanpaPanggung || !diPanggung.has(b.siapa)) ? <PotretHp ep={ep} id={b.siapa} ekspresi={akhir.ekspresi} nama={nama(b.siapa)} piksel={!!piksel} /> : null}
          <b>{nama(b.siapa)}</b>{p ? <span>{tx(p.peran)}</span> : null}
        </p>
        {grup.map((x, j) => <p key={j} className="hp-ucapan-teks">{tx(x.teks)}</p>)}
      </div>
    );
  });
  return (
    <div ref={akar} className="hp-adegan hp-vn" data-panggung={bentukAlami} data-panggung-alami={bentukAlami} data-tumpang={dekat ? '' : undefined} data-susun={jenisSusun}>
      <div className="hp-vn-bingkai" ref={bingkai}>
        {tanpaPanggung ? null : <PanggungLatar ep={ep} komposisi={k} tx={tx} nama={nama} suasana={status} status ruangBawah={dekat ? TUMPANG_DIALOG : 0} kunciLangkah={`${state.node}:${state.baris}`} />}
        <article className="hp-vn-dialog" aria-live="polite">
          <div className="hp-vn-isi" data-gulir-dialog="">
          {tindakan ? <p className="hp-tindakan"><b>{t('ceritaHp.tindakanmu')}</b>{selaPembicara()}{tindakan}</p> : null}
          {buktiTindakan}
          {isiBaris(baris)}
          {statusSesudah ? (
            <div className="hp-status-catatan" data-arah={statusSesudah.arah}>
              <CatatanStatus nama={namaNasabah} {...statusSesudah} />
            </div>
          ) : null}
          {k.hadir.length >= 2 ? (
            <p className="hp-vn-hadir">{t('ceritaHp.hadir', { daftar: k.hadir.map((x) => nama(x.id)).join(tx('daftar.pemisah')) })}</p>
          ) : null}
          {aksiDiDialog ? sisipan : null}
          </div>
          {aksiDiDialog ? <div className="hp-vn-aksi">{komposer}</div> : null}
        </article>
        {tugasNanti && !tanpaPanggung ? (
          <div className="hp-vn-dialog hp-vn-bayangan" data-bayangan="" aria-hidden="true">
            <div className="hp-vn-isi">
              {isiBaris(barisAkhir)}
              {k.hadir.length >= 2 ? <p className="hp-vn-hadir">{t('ceritaHp.hadir', { daftar: k.hadir.map((x) => nama(x.id)).join(tx('daftar.pemisah')) })}</p> : null}
            </div>
            <div className="hp-vn-aksi"><div className="hp-aksi"><p className="hp-aksi-label">{t('ceritaHp.tugas')}</p><p className="hp-vn-bayangan-judul">{tugasNanti.judul}</p><p>{tugasNanti.instruksi}</p><span className="hp-vn-bayangan-tombol">{tugasNanti.tombol}</span></div></div>
          </div>
        ) : null}
      </div>
      {aksiDiDialog ? null : <>{sisipan}<div className="hp-komposer">{komposer}</div></>}
    </div>
  );
}

/** Baris berurutan dari penutur yang sama (narasi juga) dikelompokkan: satu tab nama untuk beberapa kalimat. */
function kelompokkan(baris: Baris[]): Baris[][] {
  const hasil: Baris[][] = [];
  for (const b of baris) {
    const akhir = hasil[hasil.length - 1];
    if (akhir && akhir[0]!.siapa === b.siapa) akhir.push(b);
    else hasil.push([b]);
  }
  return hasil;
}
