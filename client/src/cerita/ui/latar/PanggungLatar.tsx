/**
 * PANGGUNG LATAR (episode dengan `Episode.latar`, Episode 2): pintu masuk untuk SEMUA pemakai (adegan HP, aktivitas, kartu
 * episode, halaman cerita lebar). T-013 Stage 3: satu-satunya penggambar = PANGGUNG PIKSEL (piksel/PanggungPiksel.tsx) lewat
 * adapter cue (piksel/adegan.ts). Panggung ilustrasi (WebP, gerbang T-010, gambar mini kabur) sudah dihapus.
 *
 * Komposisi yang tidak terpetakan (tidak ada di naskah AUTO-2; diuji) atau PNG piksel yang gagal dimuat = kotak panggung
 * polos berlabel lokasi: cerita tetap jalan, semua informasi ada di teks dialog.
 */
import { useState } from 'react';
import type { Episode, IdPembicara, KunciTeks } from '../../tipe';
import type { KomposisiLatar } from './komposisi';
import { adeganPiksel } from './piksel/adegan';
import { PanggungPiksel } from './piksel/PanggungPiksel';
import '../panggung/panggung.css';
import './latar.css';

export interface PropsPanggungLatar {
  ep: Episode;
  komposisi: KomposisiLatar;
  tx: (k: KunciTeks) => string;
  nama: (id: IdPembicara) => string;
  /** Label suasana nasabah ("Cemas"); null = tanpa label (kartu episode). */
  suasana: string | null;
  /** true = label itu status hubungan kumulatif (Episode.labelSuasana 'status'), ditulis "Status …". */
  status?: boolean;
  className?: string;
  /** Pita bawah panggung (px CSS) yang ditumpangi kotak dialog; kepala tokoh dibingkai di atasnya. */
  ruangBawah?: number;
  /** 'penuh' = kartu episode mengisi kotaknya (D-97). */
  isi?: 'penuh';
}

export function PanggungLatar(p: PropsPanggungLatar) {
  const [gagal, setGagal] = useState(false);
  const piksel = gagal ? null : adeganPiksel(p.ep, p.komposisi).piksel;
  if (piksel) {
    return <PanggungPiksel ep={p.ep} komposisi={p.komposisi} adegan={piksel} tx={p.tx} nama={p.nama} suasana={p.suasana} status={p.status} ruangBawah={p.ruangBawah} className={p.className} isi={p.isi} onGagal={() => setGagal(true)} />;
  }
  const lok = p.ep.latar?.lokasi[p.komposisi.lokasi];
  return (
    <div className={'cer-panggung cer-latar ' + (p.className ?? '')} data-jenis="latar" data-gaya="polos" data-lokasi={p.komposisi.lokasi}>
      {lok?.nama ? <p className="cer-latar-lokasi">{p.tx(lok.nama)}</p> : null}
    </div>
  );
}
