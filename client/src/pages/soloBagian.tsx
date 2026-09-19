/**
 * Bagian kecil yang dipakai bersama tiga layar mode solo (Solo, SoloMain, SoloHasil):
 * tingkat misi, hitungan bintang, misi yang disarankan, dan baris bintang.
 * Rancangan: docs/rancangan-bank-soal.md bagian 2.
 */
import { MISSIONS } from '@shared/missions';
import type { IconKey, MissionPublic } from '@shared/types';
import type { Tingkat } from '@shared/bankSoal';
import { t, useBahasa } from '../i18n';
import type { ProgresSolo } from '../state/profil';

export const TOTAL_MISI = MISSIONS.length;
export const TOTAL_BINTANG = MISSIONS.length * 3;

/** Tingkat misi; paket latihan yang belum diberi `level`: m01-m03 mudah, m04-m07 sedang, m08-m10 sulit. */
export function tingkatMisi(m: Pick<MissionPublic, 'level' | 'number'>): Tingkat {
  if (m.level) return m.level;
  return m.number <= 3 ? 1 : m.number <= 7 ? 2 : 3;
}

/** Bintang tersimpan satu misi, dijepit 0..3 (isi localStorage tidak dipercaya begitu saja). */
export function bintangMisi(p: ProgresSolo, missionId: string): number {
  const n = Math.trunc(Number(p.misi[missionId]?.bintang ?? 0));
  return Number.isFinite(n) ? Math.min(3, Math.max(0, n)) : 0;
}

/** Hanya 10 misi paket latihan yang dihitung (catatan id lain diabaikan). */
export function jumlahBintang(p: ProgresSolo): number {
  return MISSIONS.reduce((n, m) => n + bintangMisi(p, m.id), 0);
}

export function jumlahDicoba(p: ProgresSolo): number {
  return MISSIONS.filter((m) => p.misi[m.id]).length;
}

/** Misi berikutnya yang disarankan = misi pertama yang belum dicoba; null bila semua sudah dicoba. */
export function misiSaran(p: ProgresSolo): MissionPublic | null {
  return MISSIONS.find((m) => !p.misi[m.id]) ?? null;
}

/** Ikon kecil di kartu titik peta (hiasan; nama misi tetap berupa teks). */
const IKON_MISI: Record<string, IconKey> = {
  'm01-parkir': 'mobil',
  'm02-detektif-penyok': 'kamera',
  'm03-berkas-ruko': 'dokumen',
  'm04-excavator': 'excavator',
  'm05-polis-mana': 'polis',
  'm06-paket-penyok': 'peti',
  'm07-banjir-gudang': 'banjir',
  'm08-benturan-keausan': 'obeng',
  'm09-hitung-teliti': 'kalkulator',
  'm10-grand-mission': 'gudang',
};
const IKON_PRODUK: Record<string, IconKey> = { AUTO: 'mobil', FIRE: 'warung', HVC: 'excavator', CARGO: 'kapal' };

export function ikonMisi(m: Pick<MissionPublic, 'id' | 'product'>): IconKey {
  return IKON_MISI[m.id] ?? IKON_PRODUK[m.product] ?? 'lokasi';
}

/** "1.240" mengikuti penulisan angka halaman lain. */
export function angka(n: number): string {
  return Math.round(Number.isFinite(n) ? n : 0).toLocaleString('id-ID');
}

/** Satu bintang hiasan (tanpa teks): terisi = kuning bertepi tinta; kosong = garis tipis tanpa isi (beda bentuk, bukan hanya warna). */
export function SatuBintang({ isi = true, ukuran = 18 }: { isi?: boolean; ukuran?: number }) {
  return (
    <svg className={isi ? 'solo-bintang-isi' : 'solo-bintang-kosong'} width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1.1 6.1L12 17.2l-5.5 2.9 1.1-6.1L3.2 9.7l6.1-.9Z"
        fill={isi ? '#f6c445' : 'none'}
        stroke={isi ? '#17362a' : '#9aa996'}
        strokeWidth={isi ? 1.8 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Tiga bintang (ikon) + teks untuk pembaca layar. `diam` = tanpa teks (induknya sudah menyebut jumlahnya). */
export function BarisBintang({ n, ukuran = 18, diam = false, className = '' }: { n: number; ukuran?: number; diam?: boolean; className?: string }) {
  useBahasa();
  const jumlah = Math.min(3, Math.max(0, Math.trunc(n)));
  return (
    <span className={'solo-bintang ' + className} data-jumlah={jumlah}>
      {[0, 1, 2].map((i) => <SatuBintang key={i} isi={i < jumlah} ukuran={ukuran} />)}
      {diam ? null : <span className="sr-only">{t('solo.nBintang', { n: jumlah })}</span>}
    </span>
  );
}

/** Tingkat kesulitan: tiga balok (terisi sesuai tingkat) + kata. */
export function TandaTingkat({ tingkat }: { tingkat: Tingkat }) {
  useBahasa();
  return (
    <span className="solo-tingkat" data-tingkat={tingkat}>
      <span className="solo-tingkat-balok" aria-hidden="true">{[1, 2, 3].map((i) => <i key={i} className={i <= tingkat ? 'solo-balok-isi' : ''} />)}</span>
      <span className="sr-only">{t('solo.tingkatAria', { tingkat: t(`solo.tingkat.${tingkat}`) })}</span>
      <span aria-hidden="true">{t(`solo.tingkat.${tingkat}`)}</span>
    </span>
  );
}
