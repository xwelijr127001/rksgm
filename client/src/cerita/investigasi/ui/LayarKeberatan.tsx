/**
 * T-077: LAYAR KEBERATAN. Pernyataan tersemat yang akan dibantah (berpendar) + kartu bukti yang sudah dikumpulkan; pemain memilih SATU
 * kartu lalu menekan tombol besar "KEBERATAN!" -> onPilih(id). Tanpa nyawa, tanpa pewaktu; kekeliruan tidak pernah menghalangi:
 *   percobaan 0  pertanyaan + kartu;
 *   percobaan 1  petunjuk singkat + bagian gambar yang perlu dilihat disorot (baris nomor lajur di kartu dashcam);
 *   percobaan 2  Miss Raksa ("berpikir") menuntun: hanya bukti yang tepat yang aktif (sudah terpilih), kartu lain pudar.
 * Yang tampil hanya bukti di `bukti` (yang belum dikumpulkan tidak dikirim Task 1, jadi tidak bisa dipilih).
 * Props rencana: { pernyataan, bukti, percobaan, onPilih } (+ opsional tx; tepat = bukti yang benar, bawaan 'dashcam' sesuai desain).
 * Ukur 360 x 640 (hitung, lebar isi 328): tanya 26 + pernyataan 100 + petunjuk 20..75 + 3 kartu 76 + 2 x 6 + tombol 56 + jarak
 * 4 x 8 = 474..529 px <= 568 (layar - kepala cerita 56 - bantalan 16).
 */
import { useEffect, useState } from 'react';
import { t } from '../../../i18n';
import { KartuPernyataan, PotretReaksi } from './BukuCatatan';
import { KartuBukti } from './KartuBukti';
import type { Bukti, Pernyataan, Tx } from './dasar';
import './investigasi.css';

export function LayarKeberatan({ pernyataan, bukti, percobaan, onPilih, tx, tepat = 'dashcam' }: {
  pernyataan: Pernyataan;
  bukti: Bukti[];
  percobaan: 0 | 1 | 2;
  onPilih: (id: Bukti['id']) => void;
  tx?: Tx;
  tepat?: Bukti['id'];
}) {
  const dipandu = percobaan === 2;
  const [pilih, setPilih] = useState<Bukti['id'] | null>(dipandu ? tepat : null);
  // Percobaan baru = pilihan lama dilepas (dipandu: bukti yang tepat langsung terpilih).
  useEffect(() => { setPilih(percobaan === 2 ? tepat : null); }, [percobaan, tepat]);
  return (
    <section className="iv-layar iv-keberatan" data-layar-keberatan="" data-percobaan={percobaan} aria-labelledby="iv-keberatan-tanya">
      <h2 id="iv-keberatan-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{t('investigasi.keberatan.tanya')}</h2>
      <KartuPernyataan pernyataan={pernyataan} tersemat sorot tx={tx} />
      {percobaan === 0 ? <p className="iv-label">{t('investigasi.keberatan.pilih')}</p> : null}
      {percobaan === 1 ? <p className="iv-petunjuk" role="status">{t('investigasi.keberatan.petunjuk1')}</p> : null}
      {dipandu ? (
        <p className="iv-petunjuk iv-pandu" role="status">
          <PotretReaksi reaksi="miss-berpikir" ukuran={48} />
          <span><b>Miss Raksa</b>{t('investigasi.keberatan.petunjuk2')}</span>
        </p>
      ) : null}
      <ul className="iv-daftar">
        {bukti.map((b) => (
          <li key={b.id}>
            <KartuBukti bukti={b} tx={tx} terpilih={pilih === b.id} sorot={percobaan >= 1 && b.id === tepat} redup={dipandu && b.id !== tepat} onPilih={setPilih} />
          </li>
        ))}
      </ul>
      <button type="button" className="primary-action iv-tombol iv-tombol-keberatan" data-keberatan="" disabled={!pilih} onClick={() => { if (pilih) onPilih(pilih); }}>
        {pilih ? t('investigasi.keberatan.tombol') : t('investigasi.keberatan.belum')}
      </button>
    </section>
  );
}
