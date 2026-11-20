/**
 * T-077 / T-079: LAYAR KEBERATAN. T-079: pemain membantah DARI BUKU CATATANNYA: buku terbuka (BukuCatatan) dengan pernyataan yang
 * dibantah distabilo jingga di halaman "Keterangan" dan slip bukti yang bisa dipilih di halaman "Bukti"; pilih SATU slip lalu tekan
 * tombol besar "KEBERATAN!" -> onPilih(id). Tanpa nyawa, tanpa pewaktu; kekeliruan tidak pernah menghalangi:
 *   percobaan 0  pertanyaan + buku;
 *   percobaan 1  catatan tempel kuning berisi petunjuk + bagian gambar yang perlu dilihat disorot (baris nomor lajur di slip dashcam);
 *   percobaan 2  catatan tempel Miss Raksa ("berpikir") menuntun: hanya bukti yang tepat yang aktif (sudah terpilih), lainnya pudar.
 * Yang tampil hanya bukti di `bukti` (yang belum dikumpulkan tidak dikirim Task 1, jadi tidak bisa dipilih).
 * Props rencana: { pernyataan, bukti, percobaan, onPilih } (+ opsional tx; tepat = bukti yang benar, bawaan 'dashcam' sesuai desain).
 * T-088: gambar slip rekaman dashcam = tombol PERBESAR: lembar berisi kutipan yang dibantah + bingkai sebelum truk membanting
 * setir (keempat lajur bernomor, truk disorot) + "Pakai bukti ini" (memilih slip itu; KEBERATAN tetap ditekan pemain sendiri).
 * Ukur 360 x 640 (hitung; ruang isi 544): tanya 26 + label 20 / tempel 56..78 + buku (halaman atas 108, jilid 4, halaman bawah 210,
 * sampul 18 = 340) + tombol 56 + jarak 3 x 8 = 466 (percobaan 0) .. 524 px (percobaan 1 dan 2).
 */
import { useEffect, useState } from 'react';
import { t } from '../../../i18n';
import { Modal } from '../../../ui/kit';
import { BingkaiDashcam } from '../../hp/arena/ArenaDashcam';
import { BukuCatatan, PotretReaksi } from './BukuCatatan';
import { useTx } from './dasar';
import './tambahan.css';
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
  // T-088: rekaman dashcam bisa DIPERBESAR (ketuk gambar slipnya) di samping kutipan yang dibantah, sebelum memutuskan.
  const [zum, setZum] = useState(false);
  const teks = useTx(tx);
  return (
    <section className="iv-layar iv-keberatan" data-layar-keberatan="" data-percobaan={percobaan} aria-labelledby="iv-keberatan-tanya">
      <h2 id="iv-keberatan-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{t('investigasi.keberatan.tanya')}</h2>
      {percobaan === 0 ? <p className="iv-label">{t('investigasi.keberatan.pilih')}</p> : null}
      {percobaan === 1 ? <p className="iv-tempel" role="status">{t('investigasi.keberatan.petunjuk1')}</p> : null}
      {dipandu ? (
        <p className="iv-tempel iv-pandu" role="status">
          <PotretReaksi reaksi="miss-berpikir" ukuran={48} />
          <span>{t('investigasi.keberatan.petunjuk2')}</span>
        </p>
      ) : null}
      <BukuCatatan pernyataan={[pernyataan]} bukti={bukti} tx={tx} sorotPernyataan={pernyataan.id} tanpaPensil
        pilihBukti={{ terpilih: pilih, sorot: percobaan >= 1 ? tepat : null, redup: (id) => dipandu && id !== tepat, onPilih: setPilih, bisaPerbesar: ['dashcam'], onPerbesar: () => setZum(true) }} />
      {zum ? (
        <Modal judul={t('investigasi.keberatan.zumJudul')} onTutup={() => setZum(false)} lebar={420}>
          <div className="iv-zum">
          <p className="iv-zum-kutip"><b>{t(`investigasi.siapa.${pernyataan.siapa}`)}</b><q>{teks(pernyataan.teks)}</q></p>
          <BingkaiDashcam besar potong="lajur" sorotTruk />
          <p className="iv-label">{t('investigasi.keberatan.zumKet')}</p>
          <button type="button" className="primary-action iv-tombol" data-zum-pakai="" onClick={() => { setPilih('dashcam'); setZum(false); }}>{t('investigasi.keberatan.zumPakai')}</button>
          </div>
        </Modal>
      ) : null}
      <button type="button" className="primary-action iv-tombol iv-tombol-keberatan" data-keberatan="" disabled={!pilih} onClick={() => { if (pilih) onPilih(pilih); }}>
        {pilih ? t('investigasi.keberatan.tombol') : t('investigasi.keberatan.belum')}
      </button>
    </section>
  );
}
