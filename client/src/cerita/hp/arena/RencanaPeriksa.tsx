/**
 * K07 RENCANA PEMERIKSAAN (pola tujuan gaya 'rencana', tampilan gambar) — ritme 15 Nov 2026.
 * Hierarki: (1) situasi: satu kartu "Hitungan biaya bengkel · Sedang berjalan" + fakta kasus (kendaraan lain ikut tertabrak);
 * (2) pertanyaan (oleh ArenaTujuan); (3) papan waktu dua baris (Bengkel / Pemeriksaan kejadian) yang BERUBAH sesuai pilihan
 * sebelum dikirim; (4) dua pilihan papan langsung + "Pilihan lain" (semua alternatif naskah tetap terlihat, tidak ada yang
 * dipilih lebih dulu atau disorot sebagai benar). Jawaban = tetapkan(langkah, benda, tujuan) seperti sebelumnya.
 */
import { useId, useState, type KeyboardEvent } from 'react';
import { t } from '../../../i18n';
import type { KunciTeks, TujuanArena } from '../../tipe';
import type { ArenaTujuan } from './logika';
import { panahUbin } from './pola';

const PAPAN = ['setelah', 'paralel'];

export function RencanaPeriksa({ konfig, dipilih, tx, idTanya, onPilih }: {
  konfig: ArenaTujuan;
  dipilih: string | null;
  tx: (k: KunciTeks) => string;
  idTanya: string;
  onPilih: (id: string) => void;
}) {
  const idLain = useId();
  const idUtama = useId();
  const idDaftarLain = useId();
  const utama = PAPAN.map((id) => konfig.tujuan.find((x) => x.id === id)).filter((x): x is TujuanArena => !!x);
  const lain = konfig.tujuan.filter((x) => !PAPAN.includes(x.id));
  const pil = konfig.tujuan.find((x) => x.id === dipilih) ?? null;
  // Tiga alternatif tanpa pemeriksaan di lokasi: dibuka dengan tombol berlabel jelas; terbuka sendiri bila salah satunya dipilih.
  const [lainBuka, setLainBuka] = useState(() => lain.some((x) => x.id === dipilih));
  const lainTerbuka = lainBuka || lain.some((x) => x.id === dipilih);
  const posisi = dipilih === 'paralel' ? 'bersama' : dipilih === 'setelah' ? 'sesudah' : dipilih ? 'tanpa' : 'kosong';
  const opsi = (x: TujuanArena, i: number, daftar: TujuanArena[]) => {
    const on = x.id === dipilih;
    return (
      <button key={x.id} type="button" role="radio" aria-checked={on} tabIndex={on || (!dipilih && i === 0 && daftar === utama) ? 0 : -1}
        className={'hp-rpk-opsi' + (on ? ' terpilih' : '')} data-tujuan={x.id} onClick={() => onPilih(x.id)}>
        <span className="hp-opsi-tanda" aria-hidden="true">{on ? <i /> : null}</span>
        <span className="hp-rpk-opsi-teks"><b>{tx(x.label)}</b>{x.arti ? <span>{tx(x.arti)}</span> : null}</span>
        {on ? <span className="hp-ubin-tanda">{t('ceritaHp.dipilih')}</span> : null}
      </button>
    );
  };
  return (
    <div className="hp-rpk">
      <div className="hp-rpk-situasi">
        <p className="hp-rpk-situasi-kepala"><b>{tx('arena.jalur.hitung')}</b><span className="hp-rpk-chip"><span aria-hidden="true">◷ </span>{t('ceritaHp.sedangBerjalan')}</span></p>
        {konfig.catatan ? <p className="hp-rpk-fakta">{tx(konfig.catatan)}</p> : null}
      </div>

      <div className="hp-rpk-papan" aria-hidden="true" data-posisi={posisi}>
        <span className="hp-rpk-kolom" data-kolom="1">{t('ceritaHp.kolomSekarang')}</span>
        <span className="hp-rpk-kolom" data-kolom="2">{t('ceritaHp.kolomSesudah')}</span>
        <span className="hp-rpk-baris-nama">{tx('arena.jalur.barisBengkel')}</span>
        <span className="hp-rpk-bar hp-rpk-bar-bengkel">{tx('arena.jalur.hitung')}</span>
        <span className="hp-rpk-baris-nama">{t('ceritaHp.rencanaPemeriksaan')}</span>
        <span className="hp-rpk-bar hp-rpk-bar-periksa" data-posisi={posisi}>
          {posisi === 'bersama' || posisi === 'sesudah' ? tx(pil!.label) : posisi === 'tanpa' ? t('ceritaHp.tanpaPemeriksaan') : t('ceritaHp.belumAdaDiRencana')}
        </span>
      </div>

      <p id={idUtama} className="hp-rpk-lain">{t('ceritaHp.denganPemeriksaan')} ({utama.length})</p>
      <div className="hp-rpk-opsi-daftar" role="radiogroup" aria-labelledby={idUtama} onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => panahUbin(e)}>
        {utama.map((x, i) => opsi(x, i, utama))}
      </div>
      {lain.length ? (
        <>
          <p id={idLain} className="hp-rpk-lain">{t('ceritaHp.tanpaPemeriksaan')} ({lain.length})</p>
          <button type="button" className="hp-rpk-buka-lain" aria-expanded={lainTerbuka} aria-controls={idDaftarLain} data-buka-lain="" disabled={lain.some((x) => x.id === dipilih)} onClick={() => setLainBuka(!lainBuka)}>
            {lainTerbuka ? t('ceritaHp.sembunyikanPilihanLain') : t('ceritaHp.lihatPilihanLain', { n: lain.length })}
          </button>
          <div id={idDaftarLain} hidden={!lainTerbuka} className="hp-rpk-opsi-daftar hp-rpk-opsi-lain" role="radiogroup" aria-labelledby={idLain} onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => panahUbin(e)}>
            {lain.map((x, i) => opsi(x, i, lain))}
          </div>
        </>
      ) : null}
    </div>
  );
}
