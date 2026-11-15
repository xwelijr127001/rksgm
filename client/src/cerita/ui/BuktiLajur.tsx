/**
 * BUKTI LAJUR (DokumenCerita.skema 'lajur'): bukti yang dibaca pemain, terpisah dari ilustrasi lokasi.
 * - Tiruan rambu: papan berwarna dengan tulisan = nilai baris dokumen (teks naskah, terbaca, bisa diperbesar).
 * - Diagram tampak atas: N lajur dihitung dari kiri (lajur 1 paling kiri), arah lalu lintas ke atas, kendaraan di lajur
 *   menurut naskah + keterangannya (sumber, mis. "keterangan supir").
 * Hanya fakta: lajur tidak diwarnai "dilarang"/"boleh" dan tidak ada tanda benar/salah (kesimpulan = keputusan pemain).
 * Gambar latar ruas tol BUKAN bukti geometri jalan.
 */
import type { DokumenCerita, KunciTeks, SkemaLajur } from '../tipe';

const LEBAR_LAJUR = 64;
const TEPI = 28;

export function BuktiLajur({ dokumen, skema, tx, besar = false }: { dokumen: DokumenCerita; skema: SkemaLajur; tx: (k: KunciTeks) => string; besar?: boolean }) {
  const nilai = (i: number) => {
    const b = dokumen.baris[i];
    return b ? tx(b.nilai ?? b.label) : '';
  };
  const label = (i: number) => {
    const b = dokumen.baris[i];
    return b ? tx(b.label) : '';
  };
  const w = TEPI * 2 + skema.jumlah * LEBAR_LAJUR;
  const h = 176;
  const xLajur = (n: number) => TEPI + (n - 1) * LEBAR_LAJUR;
  const kendaraan = tx(skema.kendaraan);
  const posisi = nilai(skema.posisi.baris);
  return (
    <div className="cer-bukti-lajur" data-besar={besar ? '' : undefined}>
      <ul className="cer-bukti-rambu">
        {skema.rambu.map((r) => (
          <li key={r.baris} className="cer-bukti-papan" style={{ background: r.warna }}>
            <span className="cer-bukti-papan-label">{label(r.baris)}</span>
            <span className="cer-bukti-papan-teks">{nilai(r.baris)}</span>
          </li>
        ))}
      </ul>
      <figure className="cer-bukti-diagram">
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${nilai(skema.penomoran)} ${kendaraan}: ${posisi}`} data-lajur={skema.jumlah} data-posisi={skema.posisi.lajur}>
          <rect x={TEPI} y={6} width={skema.jumlah * LEBAR_LAJUR} height={h - 12} fill="#5a6066" />
          {/* tepi jalan (garis penuh) & pemisah lajur (putus-putus) */}
          <line x1={TEPI + 2} y1={6} x2={TEPI + 2} y2={h - 6} stroke="#fffdf6" strokeWidth={3} />
          <line x1={w - TEPI - 2} y1={6} x2={w - TEPI - 2} y2={h - 6} stroke="#fffdf6" strokeWidth={3} />
          {Array.from({ length: skema.jumlah - 1 }, (_, i) => (
            <line key={i} x1={xLajur(i + 2)} y1={6} x2={xLajur(i + 2)} y2={h - 6} stroke="#fffdf6" strokeWidth={2.5} strokeDasharray="12 10" />
          ))}
          {/* arah lalu lintas + nomor lajur dari kiri */}
          {Array.from({ length: skema.jumlah }, (_, i) => {
            const cx = xLajur(i + 1) + LEBAR_LAJUR / 2;
            return (
              <g key={i} data-lajur-ke={i + 1}>
                <path d={`M${cx} 18 l-7 10 h4.5 v14 h5 v-14 h4.5 z`} fill="rgba(255,253,246,.55)" />
                <circle cx={cx} cy={h - 26} r={14} fill="#fffdf6" />
                <text x={cx} y={h - 21} textAnchor="middle" fontSize={16} fontWeight={800} fill="#243d30">{i + 1}</text>
              </g>
            );
          })}
          {/* kendaraan menurut naskah (tampak atas: kepala biru di depan/atas, bak putih) */}
          <g data-kendaraan="" transform={`translate(${xLajur(skema.posisi.lajur) + LEBAR_LAJUR / 2 - 13} 56)`}>
            <rect x={0} y={20} width={26} height={62} rx={3} fill="#f4f1e6" stroke="#243d30" strokeWidth={1.5} />
            <rect x={1} y={0} width={24} height={18} rx={4} fill="#2f6fb0" stroke="#243d30" strokeWidth={1.5} />
          </g>
        </svg>
        <figcaption>
          <span><b>{label(skema.penomoran)}</b>: {nilai(skema.penomoran)}</span>
          <span><span className="cer-bukti-truk" aria-hidden="true" /><b>{kendaraan}</b>: {posisi}</span>
        </figcaption>
      </figure>
    </div>
  );
}

/** Baris dokumen yang sudah ditampilkan skema (tidak diulang di daftar teks). */
export function barisSkema(skema: SkemaLajur): ReadonlySet<number> {
  return new Set([...skema.rambu.map((r) => r.baris), skema.penomoran, skema.posisi.baris]);
}
