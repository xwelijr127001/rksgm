/**
 * Kotak dialog visual novel: potret bulat pembicara + nama & peran + kalimat yang "diketik".
 *
 * - Ketukan pada kotak, tombol "Lanjut", atau Enter/Spasi (ditangani halaman) pertama = kalimat utuh,
 *   berikutnya = lanjut. Pemanggil yang memutuskan: `selesai` (sudah utuh) dan `onMaju`.
 * - Gerak dikurangi (`mati`) = kalimat langsung utuh.
 * - Teks yang terlihat aria-hidden; pembaca layar menerima kalimat UTUH sekali lewat live region
 *   (diumumkan ulang hanya bila baris atau bahasanya berganti), bukan huruf demi huruf.
 * - Ruang kalimat utuh dipesan sejak awal (sisa huruf tak terlihat), jadi kotak tidak "melompat" saat mengetik.
 * - Istilah baris ini (docs/rancangan-mode-cerita.md 11.4): setelah kalimat utuh, tombol "Apa itu …?"
 *   (aria-expanded) membuka artinya tepat di bawah kalimat. Ketukan di area istilah TIDAK memajukan dialog;
 *   Enter/Spasi di tombolnya diabaikan penangan halaman (fokus di tombol). Yang terbuka direset tiap baris.
 */
import { Component, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PlayerLook } from '@shared/types';
import { Arrow } from '../../components/PlayerShell';
import { useReducedMotion } from '../../hooks';
import { t } from '../../i18n';
import type { Ekspresi } from '../tipe';
import type { IstilahTampil } from './istilah';
import { IkonInfo, PotretPembicara, tahanUlang, type Pembicara } from './bagian';

/**
 * Batas galat potret pembicara: seni potret yang gagal digambar (generator melempar / mengembalikan data rusak)
 * diganti inisial nama di bingkai yang sama; kotak dialog, kalimat, dan cerita tetap jalan (sebelumnya galat potret
 * menjatuhkan seluruh halaman ke BatasRute). Dicoba lagi saat pembicara/ekspresi berganti (`kunci`).
 */
class BatasPotret extends Component<{ kunci: string; nama: string; ukuran: number; children: ReactNode }, { galat: boolean; kunci: string }> {
  state = { galat: false, kunci: this.props.kunci };
  static getDerivedStateFromProps(p: { kunci: string }, s: { galat: boolean; kunci: string }) {
    return p.kunci !== s.kunci ? { galat: false, kunci: p.kunci } : null;
  }
  static getDerivedStateFromError() {
    return { galat: true };
  }
  componentDidCatch(e: unknown) {
    if (import.meta.env?.DEV) console.warn('Potret pembicara gagal digambar; memakai inisial.', e);
  }
  render() {
    if (!this.state.galat) return this.props.children;
    const u = this.props.ukuran;
    return <span className="tokoh-potret cer-potret cer-inisial" data-potret-cadangan="" aria-hidden="true" style={{ width: u, height: u }}>{this.props.nama.slice(0, 1)}</span>;
  }
}

/** Kecepatan mengetik (md per huruf). ±40 huruf per detik: cukup pelan untuk diikuti, tidak menahan pembaca cepat. */
const MS_PER_HURUF = 24;

// Bagian murni (IstilahTampil, istilahBaris) ada di ./istilah (bisa diuji di node); diekspor ulang untuk pemakai lama.
export { istilahBaris, type IstilahTampil } from './istilah';

export function KotakDialog({
  kunci, pembicara, ekspresi, look, teks, selesai, mati, onSelesai, onMaju, labelTombol, umumkan, sisipan, petunjuk, istilah = [], slotLewati,
}: {
  /** Berubah tiap baris baru: memulai ketikan dari awal. */
  kunci: string;
  pembicara: Pembicara;
  ekspresi?: Ekspresi;
  look: PlayerLook;
  teks: string;
  /** Kalimat sudah diminta tampil utuh (ketukan pertama). */
  selesai: boolean;
  /** Gerak dikurangi: tanpa efek mengetik. */
  mati: boolean;
  /** Dipanggil sekali ketika kalimat baris ini tampil utuh (dengan cara apa pun). */
  onSelesai: () => void;
  /** Ketukan pada kotak / tombol Lanjut; `detail` dari event klik (0 = tanpa pointer, mis. Enter). */
  onMaju: (detail: number) => void;
  /** Label tombol; null = tanpa tombol (pilihan tampil di bawah kotak). */
  labelTombol: string | null;
  /** Kalimat untuk live region (nama + kalimat utuh + catatan). */
  umumkan: string;
  /** Konten tambahan di dalam kotak setelah kalimat (mis. satu kalimat ajar sesudah pilihan). */
  sisipan?: ReactNode;
  petunjuk?: string | null;
  /** Istilah yang pertama kali muncul di baris ini; tombolnya tampil setelah kalimat utuh. */
  istilah?: IstilahTampil[];
  /**
   * Ref sel tempat panggung memasang tombol "Lewati pembuka" (Panggung `slotLewati`, lewat portal): sel kiri baris
   * kaki, di atas petunjuk (satu sel grid yang sama). Selama tombol ada, petunjuk disembunyikan tetapi tetap mengisi
   * tempatnya (cerita.css), jadi tinggi baris kaki & posisi Lanjut tidak berubah saat tombol muncul atau hilang.
   */
  slotLewati?: (el: HTMLDivElement | null) => void;
}) {
  const huruf = useMemo(() => Array.from(teks), [teks]);
  const [ketik, setKetik] = useState(() => ({ kunci, n: 0 }));
  const n = ketik.kunci === kunci ? ketik.n : 0;
  const utuh = selesai || mati || n >= huruf.length;

  useEffect(() => {
    if (utuh) return;
    const mulai = performance.now() - n * MS_PER_HURUF;
    let id = 0;
    const tick = (kini: number) => {
      const baru = Math.min(huruf.length, Math.floor((kini - mulai) / MS_PER_HURUF));
      setKetik((k) => (k.kunci === kunci && k.n === baru ? k : { kunci, n: baru }));
      if (baru < huruf.length) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
    // `n` sengaja tidak jadi dependensi: efek hanya dimulai ulang saat baris/panjang/utuh berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci, huruf.length, utuh]);

  // Beri tahu pemanggil sekali kalimat utuh (selesai mengetik, gerak dikurangi, atau diminta utuh).
  useEffect(() => {
    if (utuh && !selesai) onSelesai();
  }, [utuh, selesai, onSelesai, kunci]);

  // Live region: dikosongkan dulu lalu diisi, supaya kalimat yang sama pada baris baru tetap dibacakan.
  const [siar, setSiar] = useState('');
  useEffect(() => {
    setSiar('');
    const id = window.setTimeout(() => setSiar(umumkan), 60);
    return () => window.clearTimeout(id);
  }, [umumkan, kunci]);

  const tampil = utuh ? teks : huruf.slice(0, n).join('');
  const sisa = utuh ? '' : huruf.slice(n).join('');
  const narasi = pembicara.jenis === 'narasi';

  return (
    <section
      className="cer-dialog"
      data-jenis={pembicara.jenis}
      aria-label={t('cerita.percakapanAria')}
      onClick={(e) => {
        // Ketukan yang meleset tipis di sekitar "Lewati pembuka" (sel kiri baris kaki selama tombol ada) tidak memajukan.
        if (e.target instanceof Element && e.target.closest('.cer-dialog-kaki-kiri')?.querySelector('.cer-pg-lewati')) return;
        onMaju(e.detail);
      }}
    >
      <div className="cer-dialog-badan">
        {!narasi ? (
          <BatasPotret kunci={`${pembicara.jenis}|${ekspresi ?? ''}`} nama={pembicara.nama} ukuran={52}>
            <PotretPembicara jenis={pembicara.jenis} ekspresi={ekspresi} look={look} ukuran={52} nama={pembicara.nama} potret={pembicara.potret} />
          </BatasPotret>
        ) : null}
        <div className="cer-dialog-isi">
          {!narasi ? (
            <p className="cer-dialog-nama" aria-hidden="true">
              <b>{pembicara.nama}</b>
              {pembicara.peran ? <span>{pembicara.peran}</span> : null}
            </p>
          ) : null}
          <p className="cer-dialog-teks" aria-hidden="true">
            {tampil}
            {sisa ? <span className="cer-dialog-sisa">{sisa}</span> : null}
          </p>
          {istilah.length ? (utuh ? <DaftarIstilah key={kunci} istilah={istilah} /> : <CadanganIstilah istilah={istilah} />) : null}
        </div>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{siar}</p>
      {sisipan}
      {labelTombol || petunjuk ? (
        <div className="cer-dialog-kaki">
          <div className="cer-dialog-kaki-kiri">
            <div ref={slotLewati} className="cer-dialog-lewati" />
            {petunjuk ? <p className="cer-dialog-petunjuk">{petunjuk}</p> : null}
          </div>
          {labelTombol ? (
            <button
              type="button"
              className="primary-action cer-lanjut"
              data-cer-fokus=""
              onKeyDown={tahanUlang}
              onClick={(e) => { e.stopPropagation(); onMaju(e.detail); }}
            >
              {labelTombol} <Arrow />
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Ruang baris tombol istilah SELAMA kalimat diketik: bentuk & ukuran persis sama dengan tombolnya (kelas tata letak
 * sama), tetapi tak terlihat, aria-hidden, inert, dan BUKAN tombol (tidak bisa diketuk/difokus). Jadi kotak dialog
 * tidak memanjang dan tombol Lanjut tidak melompat ke bawah saat kalimat utuh (ketukan yang diarahkan ke Lanjut
 * menjelang kalimat selesai tidak meleset); tombol istilah sungguhan baru ada sesudah kalimat utuh.
 */
function CadanganIstilah({ istilah }: { istilah: IstilahTampil[] }) {
  return (
    <div className="cer-istilah cer-istilah-cadangan" aria-hidden="true" inert>
      {istilah.map((i) => (
        <div key={i.id} className="cer-istilah-butir">
          <span className="cer-istilah-tombol-bentuk">
            <IkonInfo />
            <span>{t('cerita.apaItu', { istilah: i.label })}</span>
            <svg className="cer-istilah-panah" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" />
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Tombol "Apa itu <istilah>?" + arti 1-2 kalimat di bawahnya (disclosure: aria-expanded & aria-controls).
 * Dipasang ulang per baris (pemanggil memberi key = kunci baris), jadi yang terbuka tidak terbawa ke baris
 * berikutnya. Klik di dalam area ini dihentikan di sini: kotak dialog di luarnya memajukan cerita saat diketuk.
 * Bisa dipakai di luar kotak dialog (mis. kartu pengantar aktivitas): tanpa tombol Lanjut, hanya arti yang digulir.
 */
export function DaftarIstilah({ istilah }: { istilah: IstilahTampil[] }) {
  const awalan = useId();
  const reduced = useReducedMotion();
  const [buka, setBuka] = useState<ReadonlySet<string>>(() => new Set());
  const baruDibuka = useRef<string | null>(null);
  const akar = useRef<HTMLDivElement>(null);

  // Arti yang baru dibuka digulir ke dalam layar seperlunya (HP mendatar, zoom, teks panjang): artinya utuh
  // terlihat, dan bila muat juga tombol Lanjut di bawahnya; tombol istilahnya sendiri tidak keluar dari atas layar.
  useEffect(() => {
    const id = baruDibuka.current;
    baruDibuka.current = null;
    if (!id) return;
    const arti = akar.current?.querySelector<HTMLElement>(`[data-istilah-arti="${CSS.escape(id)}"]`);
    const tombol = akar.current?.querySelector<HTMLElement>(`[data-istilah="${CSS.escape(id)}"]`);
    if (!arti || !tombol) return;
    // T-025: di cangkang HP halaman tidak menggulir; yang menggulir = kotak teks dialog adegan (hp/AdeganTatap .hp-vn-isi).
    // Arti yang baru dibuka digulir UTUH ke dalam kotak itu; puncaknya tidak pernah keluar dari atas (arti lebih tinggi daripada
    // kotak = puncaknya yang terlihat). Tombolnya boleh tergulir ke atas: yang baru diminta pemain adalah artinya.
    const kotak = akar.current?.closest<HTMLElement>('[data-gulir-dialog]');
    if (kotak && kotak.scrollHeight > kotak.clientHeight + 1) {
      const k = kotak.getBoundingClientRect();
      const ra = arti.getBoundingClientRect();
      const turun = Math.min(ra.bottom + 8 - k.bottom, ra.top - 8 - k.top);
      if (turun > 0) kotak.scrollBy({ top: turun, behavior: reduced ? 'auto' : 'smooth' });
      return;
    }
    const lanjut = akar.current?.closest('.cer-dialog')?.querySelector<HTMLElement>('.cer-lanjut');
    const bawah = Math.max(arti.getBoundingClientRect().bottom, lanjut ? lanjut.getBoundingClientRect().bottom + 12 : 0);
    const geser = Math.min(bawah - window.innerHeight, tombol.getBoundingClientRect().top - 8);
    if (geser > 0) window.scrollBy({ top: geser, behavior: reduced ? 'auto' : 'smooth' });
  }, [buka, reduced]);

  const ganti = (id: string) => {
    setBuka((lama) => {
      const baru = new Set(lama);
      if (baru.has(id)) baru.delete(id);
      else { baru.add(id); baruDibuka.current = id; }
      return baru;
    });
  };

  return (
    <div ref={akar} className="cer-istilah" onClick={(e) => e.stopPropagation()}>
      {istilah.map((i, n) => {
        const terbuka = buka.has(i.id);
        const idArti = `${awalan}-${n}`;
        return (
          <div key={i.id} className="cer-istilah-butir">
            <button
              type="button"
              className="cer-istilah-tombol"
              aria-expanded={terbuka}
              aria-controls={idArti}
              data-istilah={i.id}
              onKeyDown={tahanUlang}
              onClick={() => ganti(i.id)}
            >
              <IkonInfo />
              <span>{t('cerita.apaItu', { istilah: i.label })}</span>
              <svg className="cer-istilah-panah" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {i.anggota?.length ? (
              // T-025: arti + deretan anggota (ikon hiasan di atas, peran di bawahnya; urutannya = urutan kursi di gambar ruang).
              <div id={idArti} className="cer-istilah-arti" data-istilah-arti={i.id} hidden={!terbuka}>
                <p>{i.arti}</p>
                <ul className="cer-istilah-anggota">
                  {i.anggota.map((a, m) => (
                    <li key={m}>{a.ikon ? <span className="cer-istilah-ikon" data-ikon={a.ikon} aria-hidden="true" /> : null}<span>{a.teks}</span></li>
                  ))}
                </ul>
              </div>
            ) : <p id={idArti} className="cer-istilah-arti" data-istilah-arti={i.id} hidden={!terbuka}>{i.arti}</p>}
          </div>
        );
      })}
    </div>
  );
}
