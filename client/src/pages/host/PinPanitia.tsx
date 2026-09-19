/**
 * PIN panitia. Hanya muncul bila server memasang PANITIA_PIN (GET /api/config -> butuhPin).
 * Diisi sekali per tab (sessionStorage, lihat state/store.ts), lalu ikut terkirim pada
 * `host:create` (pin) dan API bank (header x-panitia-pin).
 */

import { useId, useState } from 'react';
import { Icon } from '../../art/Icon';
import { t, useBahasa } from '../../i18n';
import { savedPin, simpanPin } from '../../state/store';
import './bank.css';

/** Kolom PIN terkendali (dipakai di panel "Buat Room"; PIN baru disimpan setelah server menerima). */
export function KolomPin({
  nilai,
  onUbah,
  onEnter,
  denganKet = true,
}: {
  nilai: string;
  onUbah: (v: string) => void;
  onEnter?: () => void;
  denganKet?: boolean;
}) {
  useBahasa();
  const id = useId();
  return (
    <div>
      <label className="label-kolom" htmlFor={id}>
        {t('bank.pinLabel')}
      </label>
      <input
        id={id}
        className="kolom"
        type="password"
        autoComplete="off"
        maxLength={64}
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.();
        }}
      />
      {denganKet ? (
        <p className="bank-ket" style={{ marginTop: 6 }}>
          {t('bank.pinKet')}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Isian PIN mandiri untuk bagian bank soal: menyimpan PIN ke tab ini. Belum ada cara menguji PIN
 * tanpa memanggil API, jadi PIN yang salah baru ketahuan saat server menolak (`ditolak`).
 */
export function PinPanitia({ ditolak = false, onTersimpan }: { ditolak?: boolean; onTersimpan: () => void }) {
  useBahasa();
  const [pin, setPin] = useState('');
  const [ganti, setGanti] = useState(false);
  const ada = Boolean(savedPin());

  if (ada && !ditolak && !ganti) {
    return (
      <div className="bank-kaki">
        <span className="bank-status bank-status-tersimpan">
          <Icon name="cek" size={15} /> {t('bank.pinTersimpan')}
        </span>
        <button type="button" className="btn btn-netral bank-btn" onClick={() => setGanti(true)}>
          {t('bank.pinGanti')}
        </button>
      </div>
    );
  }

  const pakai = () => {
    if (!pin.trim()) return;
    simpanPin(pin);
    setPin('');
    setGanti(false);
    onTersimpan();
  };

  return (
    <div className="bank-pin">
      {ditolak ? (
        <p className="bank-galat" role="alert">
          <Icon name="silang" size={15} /> {t('bank.pinDitolak')}
        </p>
      ) : null}
      <div className="bank-pin-baris">
        <KolomPin nilai={pin} onUbah={setPin} onEnter={pakai} denganKet={false} />
        <button type="button" className="btn bank-btn" onClick={pakai} disabled={!pin.trim()}>
          {t('bank.pinSimpan')}
        </button>
        {ganti ? (
          <button
            type="button"
            className="btn btn-netral bank-btn"
            onClick={() => {
              setGanti(false);
              setPin('');
            }}
          >
            {t('layar.batal')}
          </button>
        ) : null}
      </div>
      <p className="bank-ket">{t('bank.pinKet')}</p>
    </div>
  );
}
