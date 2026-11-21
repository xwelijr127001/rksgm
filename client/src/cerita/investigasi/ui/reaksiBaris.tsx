/**
 * T-078: POTRET REAKSI di ucapan adegan Episode 1 Investigator. Tampilan saja: graf dan naskah (Task 1) tidak berubah; yang
 * menentukan adalah KUNCI TEKS barisnya. Pemutar HP memberi `hiasReaksi` ke AdeganTatap hanya untuk episode ber-`investigasi`.
 *   pembuka          Miss Raksa "berpikir"  (lajur 3: benarkah? / dua keterangan tidak mungkin sama-sama benar)
 *   petugas mengakui petugas tol "kaget" (melihat rekamannya) lalu "mengaku" (memperbaiki laporannya), Pak Darto "lega"
 *   putusan tepat    Miss Raksa "bangga"   (juga di kalimat penutup akhir tuntas; layar hasil memakai prop `reaksi`)
 * Potret 48 px di bingkai 52 px, di kanan ucapan (kolom kedua .hp-ucapan[data-hias], investigasi.css).
 */
import type { ReactNode } from 'react';
import type { Baris } from '../../tipe';
import { PotretReaksi, type Reaksi } from './BukuCatatan';
import './investigasi.css';

export const REAKSI_BARIS: Readonly<Record<string, Reaksi>> = {
  // T-084: Miss Raksa investigator (kaca pembesar) di kalimat pembuka dan pengantar putusan
  'inv.buka.1': 'miss-detektif',
  'inv.putusan.1': 'miss-detektif',
  'inv.putusan.2': 'miss-berpikir',
  'inv.selisih.1': 'miss-berpikir',
  'inv.akui.1': 'tol-kaget',
  'inv.akui.2': 'tol-mengaku',
  'inv.akui.3': 'darto-lega',
  'inv.putusan.layak.1': 'miss-bangga',
  'inv.akhir.tuntas.1': 'miss-bangga',
  // T-091, kasus 2 "Malam di Jalan Melati" (kunci naskah berawalan inv2.)
  'inv2.buka.1': 'miss-detektif',
  'inv2.selisih.1': 'miss-berpikir',
  'inv2.keb-buka.3': 'miss-berpikir',
  'inv2.akui.1': 'yusuf-terbuka',
  'inv2.putusan.2': 'miss-detektif',
  'inv2.putusan.polis.1': 'miss-bangga',
};

export function hiasReaksi(b: Baris): ReactNode {
  const r = REAKSI_BARIS[b.teks];
  return r ? <span className="iv-reaksi-baris" aria-hidden="true"><PotretReaksi reaksi={r} ukuran={48} /></span> : null;
}
