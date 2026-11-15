/**
 * Isi dialog "Riwayat": semua entri riwayat state (KUNCI teks) dibaca ulang dalam bahasa aktif, jadi ganti bahasa
 * tidak mengubah state. Pilihanmu ditandai kata "Pilihanmu" (gema "Kamu: …" tidak lagi tampil di dialog, jadi di
 * sinilah pilihan pemain dibaca ulang); kalimat ajar sesudahnya bergaya netral (CatatanAlasan: ikon info, tanpa
 * hijau/merah). Membuka riwayat tidak menerapkan efek apa pun (hanya membaca). Saat dibuka, kotak gulir langsung
 * ke bagian terbaru.
 */
import { useEffect, useRef } from 'react';
import type { Bahasa } from '@shared/bahasa';
import type { PlayerLook } from '@shared/types';
import { t } from '../../i18n';
import type { Episode, KunciTeks, StateCerita } from '../tipe';
import { CatatanAlasan, PotretPembicara, infoPembicara } from './bagian';
import { ringkasTindakan } from '../hp/arena/ringkas';
import { aktivitasLangsung } from './hasilAktivitas';
import { nomorBab } from './tampilan';

export function IsiRiwayat({ ep, state, bahasa, tx, namaPemain, look }: {
  ep: Episode;
  state: StateCerita;
  bahasa: Bahasa;
  tx: (k: KunciTeks) => string;
  namaPemain: string;
  look: PlayerLook;
}) {
  const akar = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const wadah = akar.current?.closest<HTMLElement>('.mdl-isi');
      if (wadah) wadah.scrollTop = wadah.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!state.riwayat.length) return <p>{t('cerita.riwayatKosong')}</p>;
  return (
    <ol ref={akar} className="cer-riwayat">
      {state.riwayat.map((e, i) => {
        if (e.jenis === 'bab') {
          const info = ep.bab.find((b) => b.id === e.bab);
          return <li key={i} className="cer-rw-bab"><b>{t('cerita.babNomor', { n: nomorBab(ep, e.bab), judul: info ? tx(info.judul) : e.bab })}</b></li>;
        }
        if (e.jenis === 'baris') {
          const p = infoPembicara(ep, e.siapa, tx, namaPemain);
          return (
            <li key={i} className="cer-rw-baris" data-jenis={p.jenis}>
              {p.jenis !== 'narasi' ? <PotretPembicara jenis={p.jenis} ekspresi={e.ekspresi} look={look} ukuran={32} nama={p.nama} potret={p.potret} /> : null}
              <p>{p.jenis !== 'narasi' ? <b className="cer-rw-nama">{p.nama}</b> : null}{tx(e.teks)}</p>
            </li>
          );
        }
        if (e.jenis === 'pilihan') {
          return (
            <li key={i} className="cer-rw-pilihan">
              <span className="cer-rw-tanda">{t('cerita.riwayatPilihan')}</span>
              <p>{tx(e.teks)}</p>
            </li>
          );
        }
        if (e.jenis === 'alasan') return <li key={i} className="cer-rw-alasan"><CatatanAlasan arah={e.arah} teks={tx(e.teks)} /></li>;
        // aktivitas
        const def = Object.prototype.hasOwnProperty.call(ep.aktivitas, e.aktivitas) ? ep.aktivitas[e.aktivitas] : undefined;
        const judul = def ? def.misi(bahasa).title : e.aktivitas;
        // Aktivitas berakibat langsung: tanpa vonis (akibatnya sudah di baris berikut; saran di ringkasan akhir).
        // Apa yang kamu lakukan (mis. "Rambu 1: lajur 3 dan 4"): hanya aktivitas berarena (Episode 2); Episode 1 tanpa ringkasan ini.
        const ringkas = ringkasTindakan(ep, e.aktivitas, state.aktivitas[e.aktivitas]?.jawaban, tx);
        const status = aktivitasLangsung(ep, e.aktivitas) ? 'dijalankan' : e.akurasi >= 0.999 ? 'tepat' : e.akurasi > 0 ? 'sebagian' : 'belum';
        return (
          <li key={i} className="cer-rw-akt" data-status={status}>
            <span className="cer-rw-tanda">{t('cerita.riwayatAktivitas', { judul })}</span>
            <p>{status === 'dijalankan' ? t('cerita.riwayatDijalankan') : t(`cerita.hasil.${status}`)}</p>
            {ringkas ? <p className="cer-rw-ringkas">{ringkas}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
