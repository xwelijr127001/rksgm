/**
 * T-033 (Designer D-306..D-311; pemilik 18 Nov: "ramah tetapi tetap interaktif, beri petunjuk"): LANGKAH TERPANDU satu aktivitas.
 *  - pita langkah `ol.lgk-langkah` (bernomor; kini disorot, aria-current="step"; selesai dicentang, katanya tetap) di tempat kalimat
 *    instruksi (slot kepala arena; kalimat instruksi lama disembunyikan selama pita tampil);
 *  - kalimat petunjuk `p.lgk-petunjuk` (aria-live polite) yang berganti per langkah;
 *  - penunjuk piksel `span.lgk-penunjuk` (2 bingkai, diam saat gerak dikurangi) + cincin `.lgk-sasaran` pada sasaran ketukan
 *    berikutnya (tombol yang memang sudah bisa difokus: keyboard sampai ke sana tanpa jalan baru);
 *  - kartu cara main `.lgk-pelatih` sekali per perangkat per jenis aktivitas (hanya K05, K10, K-SIM: menyentuh saja bukan aksinya).
 * Langkah KINI dibaca dari DOM arena (MutationObserver), jadi pola-pola arena tidak berubah: K08 dari `data-tahap`; K-SIM dari
 * `data-beres`; lainnya: belum ada isian = langkah 1, tombol kirim aktif = langkah 3, selebihnya langkah 2. Tombol kirim tetap
 * nonaktif dengan alasannya (perilaku lama tiap pola) sampai langkah itu dibolehkan.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../../../i18n';
import { useKueri } from '../cangkang';
import './pandu.css';

export const KODE_PANDU = ['k02', 'k04', 'k05', 'k07', 'k08', 'k09', 'k10', 'k11', 'ksim'] as const;
const PELATIH = new Set(['k05', 'k10', 'ksim']);
const KUNCI_PELATIH = (k: string) => `raksa:pelatih:${k}`;
const SASARAN_LEWAT = '.hp-tautan, .hp-arena-info, .hp-arena-kembali, [aria-pressed="true"], [aria-checked="true"], [disabled], .lgk-pelatih *, .hp-lembar-catatan, summary';

function sudahLihatPelatih(k: string): boolean { try { return localStorage.getItem(KUNCI_PELATIH(k)) === '1'; } catch { return true; } }
function simpanPelatih(k: string): void { try { localStorage.setItem(KUNCI_PELATIH(k), '1'); } catch { /* kenyamanan saja */ } }

const tampak = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };

/** Jumlah rambu K08 yang sudah dibuka (dibaca): tiang 'selesai' + tiang aktif yang sedang ditandai. */
function rambuDibaca(arena: HTMLElement): number {
  const tahap = arena.querySelector('.hp-rambu')?.getAttribute('data-tahap');
  return arena.querySelectorAll('.lk-tiang[data-keadaan="selesai"]').length + (tahap === 'tandai' ? 1 : 0);
}

/** Langkah kini (0..2) dari keadaan DOM arena. */
function bacaKini(kode: string, arena: HTMLElement, adaIsian: boolean): number {
  // T-033 Fix 1 (D-322): K08 langkah 1 selesai sesudah KEDUA rambu dibaca.
  if (kode === 'k08') { const t = arena.querySelector('.hp-rambu')?.getAttribute('data-tahap'); const n = arena.querySelectorAll('.lk-tiang').length || 2; return t === 'putus' ? 2 : rambuDibaca(arena) >= n ? 1 : 0; }
  const kirim = [...arena.querySelectorAll<HTMLButtonElement>('[data-kirim], .hp-kirim-tombol, [data-lanjut-rambu]')].filter(tampak).at(-1);
  if (kode === 'ksim') { const l = arena.querySelector('.hp-sim')?.getAttribute('data-langkah'); return l === 'akhir' ? 2 : l && l !== 'meja' ? 1 : 0; }
  if (kode === 'k11') { const l = arena.querySelector('.hp-bundel')?.getAttribute('data-langkah'); return l === 'kabar' ? 2 : l === 'tindakan' ? 1 : 0; }
  if (kirim && !kirim.disabled) return 2;
  return adaIsian ? 1 : 0;
}

/**
 * Sasaran ketukan berikutnya. `disentuh` = tombol yang sudah diketuk di kunjungan ini (penunjuk tidak pernah tinggal di yang baru saja
 * diketuk, D-325); `terakhir` = tombol yang terakhir diketuk.
 */
function cariSasaran(kode: string, arena: HTMLElement, kini: number, disentuh: WeakSet<Element>, terakhir: Element | null): HTMLElement | null {
  const semua = (sel: string, dalam: Element | null = arena) => [...(dalam?.querySelectorAll<HTMLElement>(sel) ?? [])].filter((e) => tampak(e) && !e.matches(SASARAN_LEWAT));
  const pertama = (sel: string, dalam: Element | null = arena) => semua(sel, dalam).find((e) => !disentuh.has(e)) ?? null;
  const kirim = () => semua('[data-kirim], .hp-kirim-tombol, [data-lanjut-rambu]').at(-1) ?? null;
  if (kode === 'k08') {
    const t = arena.querySelector('.hp-rambu')?.getAttribute('data-tahap');
    if (t === 'ketuk') return pertama('.lk-tiang[data-keadaan="aktif"]');
    if (t === 'tandai') return arena.querySelector('button.lk-lajur.is-on') ? kirim() : semua('button.lk-lajur')[0] ?? null; // D-323: lajur pertama, bukan jawabannya
    // D-332: kesimpulan = kesimpulan pertama di lembar, lalu tombol kirim sesudah satu dipilih.
    if (t === 'putus') return arena.querySelector('[data-simpul][aria-checked="true"]') ? kirim() : semua('[data-simpul]')[0] ?? null;
    return null;
  }
  if (kini === 2) return kirim();
  const gulir = arena.querySelector('.hp-arena-gulir');
  // D-324: K02 = dokumen di meja (yang disebut petunjuk), bukan baki.
  // T-033 Fix 2 (D-333): sesudah dokumen dibuka (diketuk) penunjuk pindah ke baki; sesudah baki diketuk kembali ke dokumen berikutnya.
  if (kode === 'k02') return terakhir?.matches('.hp-panggung-benda') ? pertama('.hp-wadah', gulir) ?? semua('.hp-wadah', gulir)[0] ?? null : arena.querySelector<HTMLElement>('.hp-panggung-benda');
  // D-325: K10 sesudah baris diketuk -> tombol cap; sesudah cap -> baris berikutnya yang belum disentuh.
  if (kode === 'k10') return terakhir?.matches('.bd-baris') ? pertama('.bd-cap-tombol', gulir) : pertama('.bd-baris', gulir);
  // D-326: K11 = berkas / pilihan tahap kini, bukan tab tahapnya.
  if (kode === 'k11') return pertama('button:not(.hp-tahap-item)', gulir);
  // D-325: K-SIM sesudah benda diketuk -> kendali yang muncul (pilihan), bukan benda berikutnya.
  if (kode === 'ksim' && terakhir?.matches('.sim-ketuk')) return pertama('button:not(.sim-ketuk):not(.sim-kenapa)', gulir) ?? pertama('button', gulir);
  return pertama('button', gulir);
}

export function PanduLangkah({ kode, arena, adaIsian, slotKepala }: { kode: string; arena: HTMLElement | null; adaIsian: boolean; slotKepala: HTMLElement | null }) {
  const [kini, setKini] = useState(0);
  const [petunjuk, setPetunjuk] = useState(1);
  const [pos, setPos] = useState<{ x: number; y: number; arah?: 'kiri' } | null>(null);
  const disentuh = useRef(new WeakSet<Element>()); const terakhir = useRef<Element | null>(null);
  const sasaranRef = useRef<HTMLElement | null>(null);
  const [pelatih, setPelatih] = useState(() => PELATIH.has(kode) && !sudahLihatPelatih(kode));
  const idPelatih = useId();
  const okRef = useRef<HTMLButtonElement>(null);
  // Layar pendek: pita + petunjuk hanya untuk pembaca layar (pandu.css). Jangan masuk slot kepala: slot yang tidak kosong tampil dan
  // menambah celah 8 px di atas isi aktivitas yang sudah diukur pas.
  const pendek = useKueri('(max-height: 699px)');
  // D-327: di layar pendek pita RINGKAS (nomor saja, 24 px) + petunjuk satu baris di tempat instruksi, untuk aktivitas yang muat;
  // Aktivitas lain (isinya sudah pas) tetap hanya penunjuk + petunjuk yang dibacakan.
  // Diukur (cek-layar, 18 Nov): pita ringkas muat hanya di K05 dan K11; di K08 (+28..46 px), K10 (+5) dan K-SIM (+6) isi meluap.
  const kompak = pendek && ['k05', 'k11'].includes(kode);

  // langkah kini + sasaran: dibaca ulang tiap kali DOM arena berubah
  useEffect(() => {
    if (!arena) return;
    let jadwal = 0;
    const hitung = () => {
      jadwal = 0;
      const k = bacaKini(kode, arena, adaIsian); setKini(k);
      // D-332: petunjuk K08 mengikuti penunjuk (tahap menandai = petunjuk lajur; kesimpulan = petunjuk 3).
      const tahapK08 = kode === 'k08' ? arena.querySelector('.hp-rambu')?.getAttribute('data-tahap') : null;
      setPetunjuk(tahapK08 === 'tandai' ? 2 : tahapK08 === 'putus' ? 3 : k + 1);
      const s = cariSasaran(kode, arena, k, disentuh.current, terakhir.current);
      if (sasaranRef.current !== s) { sasaranRef.current?.classList.remove('lgk-sasaran'); s?.classList.add('lgk-sasaran'); sasaranRef.current = s; }
      if (s) {
        const a = arena.getBoundingClientRect(); const r = s.getBoundingClientRect();
        // D-328: sasaran di tepi atas gambar -> panah dari kanan, di dalam gambar (tidak menutupi teks di atasnya).
        const gambar = s.closest('.lk-kotak, .lk-adegan, .sim-adegan, .hp-papan-lok, figure'); const atasGambar = gambar ? gambar.getBoundingClientRect().top : -Infinity;
        if (r.top - 24 < atasGambar) setPos({ x: Math.round(r.right - a.left + 4), y: Math.round(r.top - a.top + r.height / 2 - 10), arah: 'kiri' });
        else setPos({ x: Math.round(r.left - a.left + r.width / 2 - 10), y: Math.round(r.top - a.top - 24) });
      } else setPos(null);
    };
    const nanti = () => { if (!jadwal) jadwal = requestAnimationFrame(hitung); };
    hitung();
    const ketuk = (e: Event) => { const b = (e.target as Element | null)?.closest?.('button, .hp-panggung-benda'); if (b && arena.contains(b)) { disentuh.current.add(b); terakhir.current = b; nanti(); } };
    arena.addEventListener('click', ketuk, true);
    const mo = new MutationObserver(nanti); mo.observe(arena, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-tahap', 'disabled', 'data-beres', 'data-langkah', 'aria-pressed', 'aria-checked', 'class'] });
    const ro = new ResizeObserver(nanti); ro.observe(arena);
    arena.addEventListener('scroll', nanti, true); window.addEventListener('resize', nanti);
    return () => { arena.removeEventListener('click', ketuk, true); mo.disconnect(); ro.disconnect(); arena.removeEventListener('scroll', nanti, true); window.removeEventListener('resize', nanti); if (jadwal) cancelAnimationFrame(jadwal); sasaranRef.current?.classList.remove('lgk-sasaran'); sasaranRef.current = null; };
  }, [arena, kode, adaIsian]);

  useEffect(() => { if (pelatih) okRef.current?.focus({ preventScroll: true }); }, [pelatih]);

  const nama = [1, 2, 3].map((n) => t(`langkah.${kode}.${n}`));
  const pita = (
    <div className="lgk" data-kini={kini + 1} data-kompak={kompak ? '' : undefined}>
      <ol className="lgk-langkah" aria-label={t('langkah.label')}>
        {nama.map((x, i) => {
          const status = i < kini ? 'selesai' : i === kini ? 'kini' : 'nanti';
          return (
            <li key={i} data-status={status} aria-current={status === 'kini' ? 'step' : undefined}>
              <b aria-hidden="true">{i + 1}</b><span className="lgk-nama" aria-hidden="true">{x}</span><span className="sr-only">{x}{status === 'selesai' ? ` (${t('langkah.selesai')})` : ''}</span>
            </li>
          );
        })}
      </ol>
      <p className="lgk-petunjuk" aria-live="polite">{t(`langkah.${kode}.p${petunjuk}`)}</p>
    </div>
  );
  return (
    <>
      {pendek && !kompak && arena ? createPortal(pita, arena) : slotKepala ? createPortal(pita, slotKepala) : pita}
      {arena && pos ? createPortal(<span className="lgk-penunjuk" aria-hidden="true" data-arah={pos.arah} style={{ left: pos.x, top: pos.y }} />, arena) : null}
      {arena && pelatih ? createPortal(
        <div className="lgk-pelatih" role="dialog" aria-modal="false" aria-labelledby={idPelatih}>
          <h3 id={idPelatih}>{t('langkah.pelatih.judul')}</h3>
          <p>{t('langkah.pelatih.isi')}</p>
          <button ref={okRef} type="button" className="primary-action" data-pelatih-ok="" onClick={() => { simpanPelatih(kode); setPelatih(false); }}>{t('langkah.pelatih.ok')}</button>
        </div>, arena) : null}
    </>
  );
}

