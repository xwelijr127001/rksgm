/** Lencana kecil bank soal (produk, tingkat, asal). Selalu memuat TEKS, tidak hanya warna. */

import type { AsalSoal, RingkasSoal, Tingkat } from '@shared/bankSoal';
import type { Bahasa } from '@shared/bahasa';
import { MISSIONS } from '@shared/missions';
import { MISSIONS_ACARA } from '@shared/missions.acara';
import type { Product } from '@shared/types';
import { misiDalamBahasa, t } from '../../i18n';

/** Tiga batang bertingkat; hiasan (teks tingkat selalu menyertai). */
export function BatangTingkat({ tingkat }: { tingkat: Tingkat }) {
  return (
    <span className="bank-batang" aria-hidden>
      {[1, 2, 3].map((n) => (
        <i key={n} className={n <= tingkat ? 'bank-batang-isi' : undefined} />
      ))}
    </span>
  );
}

export function LencanaTingkat({ tingkat }: { tingkat: Tingkat }) {
  return (
    <span className="bank-lencana">
      <BatangTingkat tingkat={tingkat} />
      {t(`bank.tingkat${tingkat}`)}
    </span>
  );
}

export function LencanaProduk({ produk }: { produk: Product }) {
  return (
    <span className="bank-lencana bank-lencana-produk" title={t(`bank.produk.${produk}`)}>
      {t(`bank.produkPendek.${produk}`)}
    </span>
  );
}

export function LencanaAsal({ asal }: { asal: AsalSoal }) {
  return <span className={'bank-lencana' + (asal === 'kustom' ? ' bank-lencana-kustom' : '')}>{t(`bank.asal.${asal}`)}</span>;
}

/**
 * Judul soal dalam bahasa aktif. Soal bawaan punya terjemahan (shared/i18n/misi.ts); soal kustom
 * tampil apa adanya sesuai ketikan panitia.
 */
export function judulSoal(r: RingkasSoal, bahasa: Bahasa): string {
  if (r.asal === 'kustom' || bahasa === 'id') return r.judul;
  const misi = (r.asal === 'acara' ? MISSIONS_ACARA : MISSIONS).find((m) => m.id === r.id);
  return misi ? misiDalamBahasa(misi, bahasa).title : r.judul;
}
