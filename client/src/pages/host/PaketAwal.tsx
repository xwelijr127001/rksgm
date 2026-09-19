/**
 * Pilihan paket soal saat MEMBUAT room (panel "Buat Room"). Hanya tampil bila bank soal bisa
 * dibaca dan kedua paket bawaan berisi; selain itu server memakai paket bawaannya sendiri dan
 * panel lama tampil persis seperti sebelumnya. Playlist tetap bisa diatur lagi di lobby.
 */

import { useEffect, useState } from 'react';
import type { BankSoal, IdPaket } from '@shared/bankSoal';
import { t, useBahasa } from '../../i18n';
import { ambilBank } from '../../state/bank';
import './bank.css';

export function PaketAwal({ nilai, onPilih }: { nilai: IdPaket | null; onPilih: (p: IdPaket) => void }) {
  useBahasa();
  const [bank, setBank] = useState<BankSoal | null>(null);

  useEffect(() => {
    let hidup = true;
    void ambilBank().then((h) => {
      if (hidup && h.ok) setBank(h.data);
    });
    return () => {
      hidup = false;
    };
  }, []);

  if (!bank || bank.paket.acara.length === 0 || bank.paket.latihan.length === 0) return null;
  const terpilih = nilai ?? bank.bawaan;

  return (
    <div className="stack-s" role="group" aria-label={t('bank.paketAwal')}>
      <span className="label-kolom" style={{ marginBottom: 0 }}>
        {t('bank.paketAwal')}
      </span>
      <div className="bank-paket">
        {(['acara', 'latihan'] as const).map((p) => (
          <button key={p} type="button" className="bank-paket-tombol" aria-pressed={terpilih === p} onClick={() => onPilih(p)}>
            <i className="bank-paket-tanda" aria-hidden>
              {terpilih === p ? '✓' : ''}
            </i>
            <span>
              {t(p === 'acara' ? 'bank.paketAcara' : 'bank.paketLatihan')}
              <small>{t(p === 'acara' ? 'bank.paketAcaraKet' : 'bank.paketLatihanKet', { n: bank.paket[p].length })}</small>
            </span>
          </button>
        ))}
      </div>
      <p className="bank-ket">{t('bank.paketAwalKet')}</p>
    </div>
  );
}
