/**
 * T-077: HASIL INVESTIGASI. Lencana nilai S / A / B / C (seni/investigasi/nilai.png, 2x = 80 px) + total "85 / 100"; tiga baris poin
 * per bagian (Bukti 40, Putusan 30, Penanganan nasabah 30) dengan batang; kartu petugas (KartuPetugas T-072) dengan pangkat dan
 * baris stempel kasus.
 * T-078: potret reaksi Miss Raksa 64 px di kanan kepala (opsional `reaksi`); stempel kasus TERBARU dicap sesudah 0,6 s (membesar
 * lalu mendarat + satu bunyi 'stempel', T-085).
 * T-087 (review pilot butir 3 dan 5):
 *  - `stempelBaru` (bawaan true): cap mendarat + bunyinya HANYA saat stempel kasus ini pertama kali didapat; main ulang = stempel
 *    sudah terpasang, tanpa gerak dan tanpa bunyi.
 *  - `rekor` = "Rekor baru!" hanya saat skor terbaik naik; `terbaik` (lebih tinggi dari skor ini) = keping "Terbaik 85".
 *  - "Kasus berikutnya" (tombol yang hanya membuka tulisan "segera hadir") DIHAPUS: tempatnya diisi `teaser` (kartu "Kasus 2 ·
 *    segera hadir", ui/TeaserKasus) yang sudah terlihat SEBELUM ketukan apa pun, dan baris aksi = "Main lagi" + "Selesai".
 *  - "Tamu baru" dan skor terbaik tidak lagi di kaki layar ini (pindah ke lembar "Main lagi" dan ke kepala), supaya kartu teaser muat.
 * Ukur 360 x 640 (hitung; ruang isi 544 = 640 - kepala cerita 56 - bantalan .hp-main 12 + 28): kepala 80 (92 bila keping rekor /
 * terbaik tampil) + poin 3 x 24 + 2 x 4 = 80 + kartu 176 + teaser 96 + tombol 52 + jarak 4 x 8 = 516 (528) px <= 544.
 * T-090: `total` = baris "Total 185 / 200" (jumlah skor terbaik semua kasus) + "1 kasus lagi menuju Senior", di antara rincian
 * poin dan kartu petugas (24 px; 44 bila keduanya tidak muat sebaris). Pemanggil hanya mengirimnya bersama isi `teaser` yang
 * PENDEK (48 px: tautan kasus berikutnya, atau arsip kasus + "Kasus 3 · segera hadir"), bukan bersama kartu penggoda 96 px:
 * kepala 80 (92) + poin 80 + total 24 (44) + kartu 176 + baris 48 + tombol 52 + jarak 5 x 8 = 500 (512; 532) px <= 544.
 * T-099 (Fullstack, tambahan kecil): `tautan` = satu baris tautan sekunder di bawah baris aksi (kasus 1: "Ikuti cerita klaim Pak
 * Hendra"). Barisnya 28 px dan menempel ke tombol (alur.css .iv-cerita: margin atas -8 px menghapus jarak kisi), jadi tinggi layar
 * bertambah 28: 516 -> 544 (hasil pertama kasus 1, pas); 528 -> 556 dengan keping rekor / terbaik, 500 (512; 532) -> 528 (540; 560)
 * sesudah kasus 2 tamat. Yang lebih dari 544 menggulir halaman beberapa px di 360 x 640; yang tergeser hanya tautan ini.
 * T-115 (pemilik: "tanpa menggulir"; hitungan di atas tidak berlaku lagi, angka baru di team/HANDOFF.md "## T-115"): layar ini
 * dikunci setinggi layar (pemutar HP) dan dirapatkan (ui/muat.css): keping rekor / terbaik menumpang di sudut potret reaksi (kepala
 * tetap 80), baris poin 20 px, baris total satu baris, jarak 6 px; `onArsip` = tombol "Arsip kasus" KETIGA di baris aksi
 * (menggantikan baris arsip 48 px di `teaser`).
 */
import { useEffect, type ReactNode } from 'react';
import { playSfx } from '../../../audio/audio';
import { useReducedMotion } from '../../../hooks';
import type { PlayerLook } from '@shared/types';
import { t } from '../../../i18n';
import { KartuPetugas } from '../../ui/KartuPetugas';
import nilaiUrl from '../../seni/investigasi/nilai.png';
import { PotretReaksi, type Reaksi } from './BukuCatatan';
import { useTx, type Pangkat, type SkorKasus } from './dasar';
import './investigasi.css';
import './alur.css';

const SEL_NILAI: Record<SkorKasus['nilai'], number> = { S: 0, A: 1, B: 2, C: 3 };

export function HasilInvestigasi({ skor, nama, look, stempel, pangkat, onMainLagi, onSelesai, reaksi, stempelBaru = true, rekor = false, terbaik, teaser, total, tautan, onArsip }: {
  skor: SkorKasus;
  nama: string;
  look: PlayerLook;
  stempel: string[];
  pangkat: Pangkat;
  /** "Main lagi": pemanggil membuka pilihannya (latih pilihan terlemah / ulang dari awal). */
  onMainLagi: () => void;
  /** "Selesai": kembali ke daftar episode. */
  onSelesai: () => void;
  /** T-078: potret reaksi di kanan kepala (mis. Miss Raksa "bangga"). */
  reaksi?: Reaksi;
  /** T-087: stempel kasus ini BARU didapat sekarang (cap mendarat + bunyi). false = sudah punya (main ulang, muat ulang). */
  stempelBaru?: boolean;
  /** T-087: skor terbaik kasus ini baru saja naik. */
  rekor?: boolean;
  /** T-087: skor terbaik di perangkat (ditampilkan hanya bila lebih tinggi dari skor ini). */
  terbaik?: number;
  /** T-087: kartu "Kasus 2" di antara kartu petugas dan baris aksi (T-090: atau baris pendek: tautan kasus berikutnya / arsip kasus). */
  teaser?: ReactNode;
  /** T-090: total skor terbaik semua kasus ("Total 185 / 200") + `menuju` ("1 kasus lagi menuju Senior"). */
  total?: { skor: number; maks: number; menuju?: string };
  /** T-099: baris tautan sekunder di bawah baris aksi (mis. ke cerita klaim kasus ini). */
  tautan?: ReactNode;
  /** T-115: tombol "Arsip kasus" di baris aksi (tiga tombol sebaris). */
  onArsip?: () => void;
}) {
  const kurang = useReducedMotion();
  const teks = useTx();
  // Bunyi cap tepat saat stempel mendarat (animasi CSS .kp-stempel i[data-baru]: mulai 0,6 s, mendarat 0,82 s). Gerak dikurangi:
  // stempel langsung terpasang, bunyinya tetap ada (T-085). Rekor baru tanpa stempel baru: bunyi yang sama, segera.
  useEffect(() => {
    if (!(stempelBaru && stempel.length) && !rekor) return;
    const w = window.setTimeout(() => playSfx('stempel'), stempelBaru && !kurang ? 820 : 150);
    return () => window.clearTimeout(w);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const bagian: [string, number, number][] = [['bukti', skor.bukti, 40], ['putusan', skor.putusan, 30], ['penanganan', skor.penanganan, 30]];
  const lebihBaik = terbaik !== undefined && terbaik > skor.total;
  return (
    <section className="iv-layar iv-hasil" data-hasil-investigasi="" data-nilai={skor.nilai} aria-labelledby="iv-hasil-judul">
      <div className="iv-hasil-kepala">
        <span className="iv-nilai" role="img" aria-label={t('investigasi.hasil.nilai', { nilai: skor.nilai })}
          style={{ backgroundImage: `url(${nilaiUrl})`, backgroundPosition: `${-SEL_NILAI[skor.nilai] * 80}px 0` }} />
        <div className="iv-hasil-total">
          <h2 id="iv-hasil-judul" tabIndex={-1} data-cer-fokus="">{t('investigasi.hasil.judul')}</h2>
          <p className="iv-hasil-angka"><b>{skor.total}</b><span> / 100</span></p>
          <p className="iv-hasil-pangkat">{t(`investigasi.pangkat.${pangkat}`)}</p>
          {rekor ? <p className="iv-rekor" data-rekor="baru" role="status">{teks('inv.hasil.rekor')}</p>
            : lebihBaik ? <p className="iv-rekor" data-rekor="lama">{teks('inv.hasil.terbaik')} {terbaik}</p> : null}
        </div>
        {reaksi ? <PotretReaksi reaksi={reaksi} ukuran={64} /> : null}
      </div>
      <ul className="iv-poin">
        {bagian.map(([kunci, n, maks]) => (
          <li key={kunci}>
            <span className="iv-poin-nama">{t(`investigasi.hasil.${kunci}`)}</span>
            <span className="iv-poin-batang" aria-hidden="true"><i style={{ width: `${(n / maks) * 100}%` }} /></span>
            <span className="iv-poin-angka"><b>{n}</b> / {maks}</span>
          </li>
        ))}
      </ul>
      {total ? (
        <p className="iv-total" data-total-kasus="">
          <b>{teks('inv.hasil.total')} <span data-total-skor="">{total.skor}</span> / {total.maks}</b>
          {total.menuju ? <em data-menuju-pangkat="">{total.menuju}</em> : null}
        </p>
      ) : null}
      <KartuPetugas nama={nama} look={look} investigasi={{ stempel, pangkat, baru: stempelBaru }} />
      {teaser}
      <div className="iv-hasil-aksi" data-tiga={onArsip ? '' : undefined}>
        <button type="button" className="akh-kedua iv-tombol" data-main-lagi="" aria-haspopup="dialog" onClick={onMainLagi}>{t('investigasi.hasil.mainLagi')}</button>
        {onArsip ? <button type="button" className="akh-kedua iv-tombol" data-arsip-kasus="" aria-haspopup="dialog" onClick={onArsip}>{teks('inv.hasil.arsip')}</button> : null}
        <button type="button" className="primary-action iv-tombol" data-selesai-kasus="" onClick={onSelesai}>{teks('inv.hasil.selesai')}</button>
      </div>
      {tautan}
    </section>
  );
}
