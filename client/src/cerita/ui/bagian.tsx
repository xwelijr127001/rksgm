/**
 * Potongan kecil tampilan mode cerita yang dipakai di banyak tempat: identitas pembicara, potret bulat,
 * kalimat ajar netral, dan tanda ketepatan langkah. Semua ikon disertai kata (status tidak hanya lewat warna).
 */
import type { KeyboardEvent } from 'react';
import { TOKOH } from '@shared/brand';
import type { PlayerLook } from '@shared/types';
import { Avatar } from '../../art/Avatar';
import { bahasaKini, t } from '../../i18n';
import { PotretNasabah } from '../seni';
import { PotretMissRaksa } from '../seni/tokoh/PotretMissRaksa';
import type { Ekspresi, Episode, KunciTeks, NilaiProses, VarianGambar } from '../tipe';
import { PotretIlustrasi } from './gambarIlustrasi';
import { asetTokoh, avatarTokoh } from './latar/ilustrasi';
import { kunciLabelEkspresi } from './tampilan';

export type Arah = 'naik' | 'turun' | 'tetap';
export type JenisPembicara = 'nasabah' | 'missRaksa' | 'pemain' | 'tokoh' | 'narasi';
/** Avatar ilustrasi pembicara untuk ekspresi tertentu (episode berpanggung latar), atau null. */
export type AvatarPotret = (ekspresi: Ekspresi) => readonly VarianGambar[] | null;

export interface Pembicara {
  jenis: JenisPembicara;
  /** Kosong untuk narasi. */
  nama: string;
  peran: string;
  /** Episode berpanggung latar: avatar ilustrasi tokoh itu per ekspresi (wajah sama dengan panggung). */
  potret?: AvatarPotret;
}

/** Nama & peran pembicara dalam bahasa aktif. `tx` = teks episode (teksCerita dengan {nama}). */
export function infoPembicara(ep: Episode, siapa: string, tx: (k: KunciTeks) => string, namaPemain: string): Pembicara {
  if (siapa === 'pemain') return { jenis: 'pemain', nama: namaPemain, peran: t('cerita.peranPemain') };
  const p = Object.prototype.hasOwnProperty.call(ep.pemeran, siapa) ? ep.pemeran[siapa] : undefined;
  if (!p) return { jenis: 'narasi', nama: '', peran: '' };
  const potret: AvatarPotret | undefined = asetTokoh(ep, siapa) ? (e) => avatarTokoh(ep, siapa, e) : undefined;
  return { jenis: p.potret, nama: tx(p.nama), peran: tx(p.peran), ...(potret ? { potret } : {}) };
}

/** Kata perasaan untuk ekspresi yang tampil (label suasana episode bila ada, selain itu kamus cerita.ekspresi.*). */
export function labelPerasaan(ep: Episode, e: Ekspresi, tx: (k: KunciTeks) => string): string {
  const k = kunciLabelEkspresi(ep, e);
  return k ? tx(k) : t(`cerita.ekspresi.${e}`);
}

/**
 * Potret bulat pembicara (hiasan: nama & peran selalu ditulis sebagai teks di sebelahnya). Miss Raksa & Bu Rina
 * memakai SENI PIKSEL yang sama dengan panggung (PotretMissRaksa / PotretNasabah = PotretPiksel: jendela potret
 * manifest, skala bulat, piksel perangkat bulat) dengan ekspresi barisnya; kotak dialog, Riwayat, dan aktivitas
 * cerita memakai potret yang sama. Atlas gagal dimuat = huruf awal di bingkai yang sama.
 */
export function PotretPembicara({ jenis, ekspresi, look, ukuran = 48, nama = '', potret }: {
  jenis: JenisPembicara;
  ekspresi?: Ekspresi;
  look: PlayerLook;
  ukuran?: number;
  nama?: string;
  /** Episode berpanggung latar: avatar ilustrasi (lihat Pembicara.potret) menggantikan seni Episode 1. */
  potret?: AvatarPotret;
}) {
  const v = potret?.(ekspresi ?? 'netral');
  if (v) return <PotretIlustrasi varian={v} ukuran={ukuran} nama={nama} />;
  if (jenis === 'nasabah') return <PotretNasabah ekspresi={ekspresi ?? 'netral'} ukuran={ukuran} className="cer-potret" />;
  if (jenis === 'pemain') {
    return <span className="cer-potret cer-potret-pemain" aria-hidden="true" style={{ width: ukuran, height: ukuran }}><Avatar look={look} size={ukuran} mood="netral" /></span>;
  }
  if (jenis === 'missRaksa' && TOKOH.missRaksa.aktif) {
    return <PotretMissRaksa ekspresi={ekspresi ?? 'netral'} ukuran={ukuran} className="cer-potret" />;
  }
  if (jenis === 'narasi') return null;
  // Tokoh dinonaktifkan / tanpa seni: inisial di bingkai yang sama.
  return <span className="tokoh-potret cer-potret cer-inisial" aria-hidden="true" style={{ width: ukuran, height: ukuran }}>{nama.slice(0, 1)}</span>;
}

/**
 * Ikon arah perubahan suasana (panah naik/turun/datar); selalu tampil bersama kata cerita.arah.<arah>.
 * Catatan alasan di dialog TIDAK memakainya lagi (docs/rancangan-mode-cerita.md 11.3: kalimat ajar netral).
 */
export function IkonArah({ arah }: { arah: Arah }) {
  return (
    <span className={'cer-arah cer-arah-' + arah} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" focusable="false">
        {arah === 'naik' ? <path d="M12 19V6m-6 6 6-6 6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          : arah === 'turun' ? <path d="M12 5v13m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M6 12h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />}
      </svg>
    </span>
  );
}

/**
 * Satu kalimat ajar sesudah pilihan (alasan perubahan suasana), gaya NETRAL: ikon info + kalimat, tanpa kata
 * "Suasana membaik/memburuk" dan tanpa hijau/merah, supaya perasaan nasabah tidak terbaca sebagai benar/salah
 * (docs/rancangan-mode-cerita.md 11.3). `arah` hanya disimpan sebagai atribut data (tidak tampil); API tetap.
 */
export function CatatanAlasan({ arah, teks, className = '' }: { arah: Arah; teks: string; className?: string }) {
  return (
    <p className={'cer-alasan ' + className} data-arah={arah}>
      <IkonInfo />
      <span>{teks}</span>
    </p>
  );
}

/** Ikon info bulat (hiasan) untuk kalimat ajar & penjelasan istilah; warnanya netral, tidak menilai. */
export function IkonInfo() {
  return (
    <span className="cer-info-ikon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" focusable="false">
        <path d="M12 10.5v7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="12" cy="6.5" r="1.8" fill="currentColor" />
      </svg>
    </span>
  );
}

/**
 * Tanda ketepatan langkah klaim: ✓ tepat, ↺ diperbaiki, ✕ keliru, ! sebagian, – tidak tersentuh (ikon + kata).
 * 'sebagian' hanya dipakai hasil aktivitas (Catatan kasus); butir proses tidak punya nilai itu.
 */
export function TandaProses({ nilai, kata }: { nilai: NilaiProses | 'sebagian' | null; /** Menimpa kata bawaan (mis. "Sudah paham"). */ kata?: string }) {
  const jenis = nilai ?? 'kosong';
  return (
    <span className={'cer-proses cer-proses-' + jenis}>
      <IkonProses nilai={nilai} />
      <b className="cer-proses-kata">{kata ?? t(jenis === 'sebagian' ? 'cerita.hasil.sebagian' : `cerita.proses.${jenis}`)}</b>
    </span>
  );
}

/** Ikon bulat ketepatan saja (hiasan; kata selalu ada di sebelahnya). Warna dari kelas induk .cer-proses-<nilai>. */
export function IkonProses({ nilai }: { nilai: NilaiProses | 'sebagian' | null }) {
  const jenis = nilai ?? 'kosong';
  return (
    <span className="cer-proses-ikon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" focusable="false">
        {jenis === 'tepat' ? <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          : jenis === 'dikoreksi' ? <path d="M7 9.5a6 6 0 1 1-.8 6M7 4.5v5h5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          : jenis === 'keliru' ? <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          : jenis === 'sebagian' ? <path d="M12 6v7m0 4.5v.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          : <path d="M7 12h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />}
      </svg>
    </span>
  );
}

/** Ikon tombol alat di header: riwayat (gulungan percakapan), catatan kasus (papan catatan), bantuan (tanda tanya). */
export function IkonAlat({ jenis }: { jenis: 'riwayat' | 'catatan' | 'bantuan' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      {jenis === 'riwayat' ? (
        <>
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3.6V16h0A2.5 2.5 0 0 1 4 13.5Z" fill="var(--krem-tua)" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M8 8.5h8M8 11.8h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </>
      ) : jenis === 'bantuan' ? (
        <>
          <circle cx="12" cy="12" r="8.2" fill="var(--putih)" stroke="currentColor" strokeWidth="1.7" />
          <path d="M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6v.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="16.9" r="1.1" fill="currentColor" />
        </>
      ) : (
        <>
          <rect x="5" y="4.5" width="14" height="16" rx="2.2" fill="var(--kuning)" stroke="currentColor" strokeWidth="1.7" />
          <path d="M9 3.5h6v3H9Z" fill="var(--putih)" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M8.5 10.5h7M8.5 13.8h7M8.5 17h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/**
 * onKeyDown untuk tombol cerita (Lanjut, pilihan): Enter yang DITAHAN (autorepeat) tidak mengklik berulang.
 * Tanpa ini, menahan Enter sekitar satu detik melompati beberapa baris, termasuk reaksi nasabah dan alasan
 * perubahan suasana, tanpa pernah dibacakan (penjaga `e.repeat` di window tidak berlaku saat fokus di tombol).
 */
export function tahanUlang(e: KeyboardEvent<HTMLElement>): void {
  if ((e.key === 'Enter' || e.key === ' ') && e.repeat) e.preventDefault();
}

/** Jarak setelah label tebal yang sudah bertanda baca ("Tujuan:"); tanda baca Mandarin sudah membawa jaraknya. */
export function sela(): string {
  return bahasaKini() === 'zh' ? '' : ' ';
}

/** Pemisah antara nama pembicara dan ucapannya ("Bu Rina: …"); Mandarin memakai titik dua lebar tanpa spasi. */
export function selaPembicara(): string {
  return bahasaKini() === 'zh' ? '：' : ': ';
}

/** Pemisah setelah label tebal TANPA tanda baca ("Suasana membaik"): Mandarin memakai titik dua lebar. */
export function selaLabel(): string {
  return bahasaKini() === 'zh' ? '：' : ' ';
}
