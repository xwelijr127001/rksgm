/**
 * Potongan tampilan bersama antarmuka HP: potret tokoh (avatar ilustrasi), kartu fakta yang dibutuhkan saat memutuskan,
 * kutipan konteks, dan tombol kirim yang tidak mengirim dua kali. Gambar seni kode = GambarSeni (ui/gambarIlustrasi).
 */
import { useContext, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SlotKirimArena } from './cangkang';
import { selaPembicara } from '../ui/bagian';
import type { MissionPublic } from '@shared/types';
import { Arrow } from '../../components/PlayerShell';
import { t } from '../../i18n';
import type { Baris, Ekspresi, Episode, IdPembicara, KunciTeks } from '../tipe';
import { IkonArah } from '../ui/bagian';
import { tokohPotret } from '../ui/latar/piksel/potret';
import { PotretPikselHp } from '../ui/latar/piksel/PotretPikselHp';
import { KartuDokumen } from '../ui/KartuDokumen';

export { GambarSeni } from '../ui/gambarIlustrasi';

/** Judul catatan status: label berubah ("Cemas → Tenang"), atau label sama dengan arah skornya ("masih Cemas, tapi membaik"). */
export function judulStatus(nama: string, sebelum: string, sesudah: string, arah: 'naik' | 'turun' | 'tetap'): string {
  if (sebelum !== sesudah) return t('ceritaHp.statusBerubah', { nama, dari: sebelum, ke: sesudah });
  const kunci = arah === 'naik' ? 'ceritaHp.statusTetapNaik' : arah === 'turun' ? 'ceritaHp.statusTetapTurun' : 'ceritaHp.statusTetap';
  return t(kunci, { nama, ke: sesudah });
}

/**
 * Akibat keputusan pada nasabah: ALASAN dalam bahasa awam dulu ("Kenapa: ..."), lalu perubahan status sebagai baris kecil
 * (ikon arah + kata, bukan warna saja). Status = akibat, bukan informasi utama.
 */
export function CatatanStatus({ nama, sebelum, sesudah, arah, alasan }: { nama: string; sebelum: string; sesudah: string; arah: 'naik' | 'turun' | 'tetap'; alasan: string }) {
  return (
    <>
      <p className="hp-kenapa"><b>{t('ceritaHp.kenapa')}</b>{selaPembicara()}{alasan}</p>
      <p className="hp-status-baris">
        <span className="hp-status-ikon" aria-hidden="true"><IkonArah arah={arah} /></span>
        <span>{judulStatus(nama, sebelum, sesudah, arah)}</span>
      </p>
    </>
  );
}

/** Ukuran potret HP (piksel CSS) per kelipatan: avatar obrolan & kartu (1x), kartu saksi (2x). */
const UKURAN_POTRET = { 1: 48, 2: 96 } as const;
/**
 * Potret kepala-bahu tokoh: potret PIKSEL (atlas yang sama dengan panggung, wajah ekspresinya) untuk semua pemeran Episode 2
 * yang punya seni piksel (Miss Raksa, Pak Hendra, enam tokoh samping); tanpa seni = inisial di bingkai yang sama.
 */
export function PotretHp({ ep, id, ekspresi = 'netral', kali = 1, nama }: { ep: Episode; id: IdPembicara; ekspresi?: Ekspresi; kali?: 1 | 2; nama: string; /** @deprecated tidak dipakai lagi (semua potret piksel) */ piksel?: boolean }) {
  const tp = tokohPotret(ep, id);
  const ukuran = UKURAN_POTRET[kali];
  if (!tp) return <span className="tokoh-potret cer-potret cer-inisial hp-potret" aria-hidden="true" style={{ width: ukuran, height: ukuran }}>{nama.slice(0, 1)}</span>;
  return <span className="hp-potret" data-seni="piksel"><PotretPikselHp tokoh={tp} ekspresi={ekspresi} ukuran={ukuran} label={nama} /></span>;
}

/** Fakta yang dibutuhkan saat memutuskan: tabel misi atau kartu dokumen episode, langsung di tempat (bukan tab lain). */
export function KartuFakta({ ep, misi, fakta, tx }: { ep: Episode; misi?: MissionPublic; fakta?: { tabel?: string; dokumen?: string }; tx: (k: KunciTeks) => string }) {
  if (!fakta) return null;
  if (fakta.dokumen && ep.dokumen?.[fakta.dokumen]) return <KartuDokumen dokumen={ep.dokumen[fakta.dokumen]!} id={fakta.dokumen} tx={tx} />;
  const tabel = fakta.tabel ? misi?.tables?.find((x) => x.id === fakta.tabel) : undefined;
  if (!tabel) return null;
  return (
    <section className="cer-dok hp-fakta" aria-label={tabel.title}>
      <h3 className="cer-dok-judul"><span>{tabel.title}</span></h3>
      {/* Label pendek ("Pemicu", "Akibat"): dua kolom juga di HP, kartu tidak memanjang. */}
      <dl className="cer-dok-baris" data-label-pendek={tabel.rows.every((r) => r.label.length <= 16) ? '' : undefined}>
        {tabel.rows.map((r, i) => (
          <div key={i} className="cer-dok-isi">
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      {tabel.note ? <p className="cer-dok-catatan">{tabel.note}</p> : null}
    </section>
  );
}

/** Kutipan konteks (baris naskah terakhir sebelum tugas): potret + nama + kalimat. */
export function Kutipan({ ep, baris, tx, namaPemain }: { ep: Episode; baris: Baris | null; tx: (k: KunciTeks) => string; namaPemain: string }) {
  if (!baris) return null;
  const p = Object.prototype.hasOwnProperty.call(ep.pemeran, baris.siapa) ? ep.pemeran[baris.siapa]! : null;
  if (!p) return <p className="hp-kutipan hp-kutipan-narasi">{tx(baris.teks)}</p>;
  const nama = baris.siapa === 'pemain' ? namaPemain : tx(p.nama);
  return (
    <figure className="hp-kutipan">
      <PotretHp ep={ep} id={baris.siapa} ekspresi={baris.ekspresi} nama={nama} />
      <figcaption><b>{nama}</b><q>{tx(baris.teks)}</q></figcaption>
    </figure>
  );
}

/**
 * Tombol kirim keputusan: sekali tekan = sekali kirim (ketukan ganda/Enter beruntun diabaikan sampai komponen diganti).
 * `catatan` tampil di bawahnya (mis. "Belum dikirim. Setelah dikirim tidak bisa diubah.").
 * T-018 Tahap 2 (D-133): di cangkang aktivitas HP (SlotKirimArena) tombolnya pindah ke bilah bawah yang disematkan; alasan "belum"
 * menjadi label tombol yang nonaktif, dan catatan tetap di tempat asalnya (ujung isi yang menggulir).
 */
export function TombolKirim({ label, siap, onKirim, catatan, alasanBelum, alasanRingkas, potret }: { label: string; siap: boolean; onKirim: () => void; catatan?: ReactNode; alasanBelum?: string | null; /** (D-180) versi pendek alasan untuk label tombol di bilah bawah cangkang HP. */ alasanRingkas?: string | null; /** (T-052) potret pemain di kiri tombol (lembar balasan); tidak dipakai di bilah tersemat arena. */ potret?: ReactNode }) {
  const sudah = useRef(false);
  const [mengirim, setMengirim] = useState(false);
  const slot = useContext(SlotKirimArena);
  const tombol = (
      <button
        type="button"
        className="primary-action hp-kirim-tombol"
        data-kirim=""
        disabled={!siap || mengirim}
        aria-describedby={alasanBelum && !slot ? 'hp-kirim-belum' : undefined}
        onClick={() => {
          if (!siap || sudah.current) return;
          sudah.current = true;
          setMengirim(true);
          onKirim();
        }}
      >
        {slot ? <span className="hp-kirim-label">{!siap && (alasanRingkas || alasanBelum) ? (alasanRingkas || alasanBelum) : label}</span> : label} <Arrow />
      </button>
  );
  if (slot) return <>{createPortal(tombol, slot)}{catatan ? <p className="hp-kirim-catatan">{catatan}</p> : null}</>;
  return (
    <div className="hp-kirim">
      {potret ? <div className="hp-kirim-baris">{potret}{tombol}</div> : tombol}
      {alasanBelum ? <p id="hp-kirim-belum" className="hp-kirim-belum">{alasanBelum}</p> : null}
      {catatan ? <p className="hp-kirim-catatan">{catatan}</p> : null}
    </div>
  );
}

/** Teks "Lanjut" dengan panah (tombol utama alur cerita). */
export function TombolLanjut({ label, onKlik }: { label?: string; onKlik: () => void }) {
  return (
    <button type="button" className="primary-action hp-lanjut cer-lanjut" data-lanjut="" onClick={onKlik}>
      {label ?? t('ceritaHp.lanjut')} <Arrow />
    </button>
  );
}
