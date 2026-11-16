/**
 * PAPAN LOKASI (K04 penugasan, K05 penerusan foto) — adaptasi prototipe Claude Design (14 Nov 2026).
 * Papan ILUSTRATIF (bukan peta: tanpa jarak, waktu tempuh, atau posisi nyata) berisi semua tujuan sebagai tempat bergambar.
 *  - Ketuk tempat = MELIHAT keterangannya (belum memilih).
 *  - "Pilih tujuan ini" = MEMILIH: token (Mas Rudi / bundel foto) muncul di tempat itu; jawaban arena sama dengan pola tujuan
 *    lama (tetapkan(langkah, benda, tujuan)), jadi mesin, penilaian, draf, dan simpanan tidak berubah.
 *  - Kirim tetap lewat TombolKirim di ArenaTujuan.
 * Posisi tempat = tata letak tetap per indeks (bukan geografi).
 */
import { useId, type ReactNode, useLayoutEffect, useRef } from 'react';
import { playSfx } from '../../../audio/audio';
import { t } from '../../../i18n';
import type { Episode, KunciTeks, TujuanArena } from '../../tipe';
import { GambarSeni } from '../bagianHp';

/** Posisi tempat (persen lebar/tinggi papan) per jumlah tujuan; urutan = urutan naskah. */
const TATA: Record<number, Array<[number, number]>> = {
  5: [[22, 25], [22, 76], [50, 51], [78, 25], [78, 76]],
  4: [[25, 25], [25, 72], [75, 25], [75, 72]],
  3: [[22, 30], [50, 66], [78, 30]],
};

export function bisaPapan(jumlah: number): boolean {
  return !!TATA[jumlah];
}

export function PapanTujuan({ ep, tujuan, dipilih, token, tokenBenda = false, tx, idTanya, onPilih }: {
  ep: Episode;
  tujuan: TujuanArena[];
  dipilih: string | null;
  token: ReactNode;
  /** Token = benda (bundel foto K05), bukan potret tokoh: tanpa cincin, di sudut kanan atas gambar (+62, -10). */
  tokenBenda?: boolean;
  tx: (k: KunciTeks) => string;
  idTanya: string;
  onPilih: (id: string) => void;
}) {
  // T-020 (D-143, keputusan Lead 16 Nov): KETUK = PILIH (ketuk tempat lain = ganti); tombol kirim di bilah bawah = konfirmasi.
  // Tidak ada lagi langkah "Pilih tujuan ini"; strip di bawah papan menampilkan nama + arti tempat yang dipilih.
  const lihat = dipilih;
  const idDetail = useId();
  const pos = TATA[tujuan.length]!;
  const dilihat = tujuan.find((x) => x.id === lihat) ?? null;
  // T-020 batch 1: semua gambar tujuan piksel (K04) = papan piksel (rumput, jalan tanah, pohon; jangkar px di piksel.css).
  const piksel = tujuan.every((x) => !!(x.seni && ep.seniArena?.[x.seni]?.piksel));
  // D-205 (T-020 batch 3): di DPR 3 ubin tengah tidak persis piksel bila tinggi papan pecahan (221,22) atau ubinnya jatuh di
  // setengah piksel. Papan piksel: tinggi dibulatkan ke bawah ke px CSS utuh, atas ubin tengah = px utuh (dibulatkan ke bawah).
  const papanRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = papanRef.current;
    if (!el || !piksel || typeof ResizeObserver === 'undefined') return;
    const bulatkan = () => {
      el.style.maxHeight = '';
      const h = el.getBoundingClientRect().height; const b = Math.floor(h + 0.01);
      if (Math.abs(h - b) > 0.01) el.style.maxHeight = `${b}px`;
      const tengah = tujuan.length === 5 ? el.querySelectorAll<HTMLElement>('.hp-tempat')[2] : null;
      if (tengah) { el.style.setProperty('--tengah', `${Math.floor((el.clientHeight - tengah.offsetHeight) / 2)}px`); el.setAttribute('data-tengah', ''); }
    };
    bulatkan();
    const ro = new ResizeObserver(bulatkan);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener('resize', bulatkan);
    return () => { ro.disconnect(); window.removeEventListener('resize', bulatkan); };
  }, [piksel, tujuan.length, dipilih]);
  // T-018 Tahap 2 / T-020: di cangkang HP peta dipendekkan supaya kelima tempat + tombol kirim terlihat; kartu detail bisa di bawah
  // lipatan, jadi sesudah sebuah tempat diketuk kartu detailnya (dengan "Pilih tujuan ini") digulir ke dalam pandangan.
  return (
    <div className="hp-papan-lok-wadah">
      <div ref={papanRef} className={'hp-papan-lok' + (piksel ? ' hp-papan-px' : '')} role="group" aria-labelledby={idTanya} data-jumlah={tujuan.length}>
        {piksel ? (
          <>
            <span className="px-jalan-v kiri" aria-hidden="true" /><span className="px-jalan-v kanan" aria-hidden="true" /><span className="px-jalan-h" aria-hidden="true" />
            <span className="px-simpang kiri" aria-hidden="true" /><span className="px-simpang kanan" aria-hidden="true" />
            <span className="px px-pohon-1 px-prop-a" aria-hidden="true" /><span className="px px-pohon-2 px-prop-b" aria-hidden="true" />
            <span className="px px-semak px-prop-c" aria-hidden="true" /><span className="px px-pohon-2 px-prop-d" aria-hidden="true" />
          </>
        ) : (
          <svg className="hp-papan-lok-jalan" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M22 25 C38 34 42 44 50 51 C58 56 62 34 78 25 M50 51 C46 62 34 68 22 76 M50 51 C58 64 66 68 78 76" />
          </svg>
        )}
        {tujuan.map((x, i) => {
          const [kiri, atas] = pos[i]!;
          const pilih = x.id === dipilih;
          const lht = x.id === lihat;
          return (
            <button
              key={x.id}
              type="button"
              className={'hp-tempat' + (pilih ? ' terpilih' : '') + (lht ? ' dilihat' : '')}
              style={{ left: `${kiri}%`, top: `${atas}%` }}
              aria-pressed={lht}
              aria-controls={idDetail}
              aria-label={`${tx(x.label)}${pilih ? `, ${t('ceritaHp.tujuanTerpilih')}` : ''}`}
              data-tujuan={x.id}
              onClick={() => { if (x.id !== dipilih) { playSfx('konfirmasi'); onPilih(x.id); } }}
            >
              <span className="hp-tempat-gambar">
                <GambarSeni ep={ep} id={x.seni} className="hp-tempat-seni" />
                {pilih ? <span className="hp-tempat-centang" aria-hidden="true">✓</span> : null}
              </span>
              <span className="hp-tempat-nama">{tx(x.label)}</span>
              {pilih ? <span className={'hp-tempat-token' + (tokenBenda ? ' hp-tempat-token-benda' : '')} aria-hidden="true">{token}</span> : null}
            </button>
          );
        })}
        <span className="hp-papan-lok-label">{t('ceritaHp.papanIlustrasi')}</span>
      </div>
      <div id={idDetail} className={'hp-tempat-detail' + (dilihat ? ' terpilih' : '')} data-strip={dilihat ? 'pilihan' : 'kosong'} aria-live="polite">
        {dilihat ? (
          <>
            <p className="hp-tempat-detail-kepala"><b>{tx(dilihat.label)}</b><span>{t('ceritaHp.tujuanTerpilih')}</span></p>
            {dilihat.arti ? <p className="hp-tempat-detail-arti">{tx(dilihat.arti)}</p> : null}
          </>
        ) : <p className="hp-tempat-detail-arti">{t('ceritaHp.lihatTempat')}</p>}
      </div>
    </div>
  );
}
