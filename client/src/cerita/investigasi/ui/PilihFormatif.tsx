/**
 * T-127 (babak 2, masukan Pak Peterson butir 12 dan 13): PILIH FORMATIF. Pemain MENAFSIRKAN satu bukti: sebuah pertanyaan, bukti
 * itu sendiri (gambar netral: tanpa nomor, tanpa centang), dan 2-3 bacaan untuk dipilih. Dipakai semua kasus babak 2
 * (KonfigInvestigasi.tafsir, cerita/tipe.ts); komponen ini tidak tahu kasusnya dan tidak menyimpan apa pun.
 *
 * Tanpa poin, tanpa waktu, tanpa akhir permainan. Umpan baliknya langsung:
 *   tepat             catatan hijau `benar`, tombol "Lanjut"
 *   keliru pertama    catatan kuning `salah(id)`: PENUNJUK ke sumbernya (bukan jawabannya); bingkai bukti berdenyut; pilihan itu
 *                     dipadamkan, yang lain tetap bisa dipilih. Pilihan ber-`hampir` (berhati-hati, tetapi sumbernya terbaca)
 *                     diberi label "Hampir", bukan "Belum tepat".
 *   keliru kedua      Miss Raksa menunjukkan PENJELASANnya (`alasan`), bukti digambar dengan bantuannya (`gambar(true)`), bacaan
 *                     yang tepat ditandai, lalu "Lanjut". Tidak ada percobaan ketiga.
 * `onSelesai(hasil)` dipanggil oleh tombol "Lanjut" (sekali); `onCoba(n)` tiap kekeliruan, supaya pemanggil bisa menyimpannya
 * sebagai draf kunjungan (`awal` = jumlah kekeliruan yang sudah terjadi sesudah muat ulang; 2 = langsung keadaan dipandu).
 * Papan ketik: pilihan = tombol biasa; catatan umpan balik = role="status". Satu tombol utama ("Lanjut"), baru ada sesudah selesai.
 * Ukur (hitung; team/HANDOFF.md "## T-127"): tanya 26..52 + bukti 192 + pilihan 54 + catatan 66..88 + tombol 56 + jarak 32.
 */
import { useRef, useState, type ReactNode } from 'react';
import { playSfx } from '../../../audio/audio';
import { t } from '../../../i18n';
import { PotretReaksi } from './BukuCatatan';
import './investigasi.css';
import './ronde2.css';

export type HasilFormatif = 'first' | 'second' | 'guided';

export function PilihFormatif({ id, tanya, gambar, opsi, tepat, hampir = [], salah, alasan, benar, lanjut, awal = 0, onCoba, onSelesai }: {
  /** Id tafsir (kait data- untuk QA). */
  id: string;
  tanya: string;
  /** Gambar buktinya; `jelas` true = dengan bantuan penjelasan (mis. nomor lajur), hanya sesudah keliru kedua. */
  gambar: (jelas: boolean) => ReactNode;
  opsi: { id: string; teks: string }[];
  tepat: string;
  hampir?: readonly string[];
  /** Penunjuk sumber untuk pilihan keliru itu (kekeliruan pertama). */
  salah: (id: string) => string;
  /** Penjelasan (kekeliruan kedua). */
  alasan: string;
  /** Kalimat sesudah pilihan yang tepat. */
  benar: string;
  /** Label tombol lanjut. */
  lanjut: string;
  awal?: number;
  onCoba?: (keliru: number) => void;
  onSelesai: (hasil: HasilFormatif) => void;
}) {
  const [keliru, setKeliru] = useState(() => Math.max(0, Math.min(2, Math.floor(awal))));
  /** Pilihan yang sudah dicoba dan keliru (dipadamkan). */
  const [gugur, setGugur] = useState<string[]>([]);
  const [terakhir, setTerakhir] = useState<string | null>(null);
  const [benarDipilih, setBenarDipilih] = useState(false);
  const sudah = useRef(false);
  const dipandu = keliru >= 2;
  const selesai = benarDipilih || dipandu;
  const pilih = (x: string) => {
    if (selesai || gugur.includes(x)) return;
    if (x === tepat) { playSfx('konfirmasi'); setBenarDipilih(true); setTerakhir(x); return; }
    playSfx('keliru');
    const n = keliru + 1;
    setKeliru(n); setGugur((g) => [...g, x]); setTerakhir(x);
    onCoba?.(n);
  };
  const hasil: HasilFormatif = dipandu ? 'guided' : keliru === 1 ? 'second' : 'first';
  // Muat ulang sesudah satu kekeliruan: pilihan yang keliru tadi tidak diingat, jadi layarnya kembali netral (hasil tetap 'second').
  const keadaan = benarDipilih ? 'tepat' : dipandu ? 'dipandu' : keliru === 1 && terakhir ? (hampir.includes(terakhir) ? 'hampir' : 'keliru') : 'awal';
  return (
    <section className="iv-layar pf" data-pilih-formatif={id} data-keadaan={keadaan} aria-labelledby="pf-tanya">
      <h2 id="pf-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tanya}</h2>
      <div className="pf-gambar" data-tunjuk={keadaan === 'keliru' || keadaan === 'hampir' ? '' : undefined}>{gambar(dipandu)}</div>
      <div className="pf-opsi" role="group" aria-labelledby="pf-tanya" data-jumlah={opsi.length}>
        {opsi.map((o) => {
          const jawab = selesai && o.id === tepat;
          return (
            <button key={o.id} type="button" className="pf-pilih" data-opsi={o.id} data-jawab={jawab ? '' : undefined} data-gugur={gugur.includes(o.id) ? '' : undefined}
              aria-pressed={jawab} disabled={selesai || gugur.includes(o.id)} onClick={() => pilih(o.id)}>
              {o.teks}{jawab ? <span aria-hidden="true"> ✓</span> : null}
            </button>
          );
        })}
      </div>
      <div className="pf-catatan" role="status">
        {keadaan === 'awal' ? <p className="iv-label">{t('investigasi.formatif.pilih')}</p> : null}
        {keadaan === 'keliru' || keadaan === 'hampir' ? (
          <p className="iv-tempel pf-tempel"><b>{t(keadaan === 'hampir' ? 'investigasi.formatif.hampir' : 'investigasi.formatif.sumber')}</b>{terakhir ? salah(terakhir) : ''}</p>
        ) : null}
        {keadaan === 'dipandu' ? (
          <p className="iv-tempel iv-pandu pf-tempel"><PotretReaksi reaksi="miss-berpikir" ukuran={48} /><span><b>{t('investigasi.formatif.penjelasan')}</b>{alasan}</span></p>
        ) : null}
        {keadaan === 'tepat' ? <p className="iv-tempel pf-tempel" data-tepat=""><b>{t('investigasi.formatif.tepat')}</b>{benar}</p> : null}
      </div>
      {selesai ? (
        <button type="button" className="primary-action iv-tombol" data-pf-lanjut="" onClick={() => { if (sudah.current) return; sudah.current = true; onSelesai(hasil); }}>{lanjut}</button>
      ) : null}
    </section>
  );
}
