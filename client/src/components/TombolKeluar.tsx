import { useRef, useState } from 'react';
import { t, useBahasa } from '../i18n';
import { Modal } from '../ui/kit';
import { Arrow } from './PlayerShell';

/**
 * Tombol kembali/keluar di header pemain (review staf #8). Saat ronde berjalan, keluar bisa membuat peserta kehilangan
 * babak, jadi tombol meminta konfirmasi singkat dulu; di luar ronde langsung keluar. Keluar TIDAK mereset room: room
 * tetap berjalan untuk peserta lain, dan peserta bisa kembali dengan kode yang sama dari perangkat ini.
 */
export function TombolKeluar({ label, perluKonfirmasi, judul, pesan, labelSetuju, onKeluar }: {
  label?: string;
  perluKonfirmasi: boolean;
  judul: string;
  pesan: string;
  labelSetuju: string;
  onKeluar: () => void;
}) {
  useBahasa();
  const [buka, setBuka] = useState(false);
  const tombol = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={tombol} type="button" className="back-link tombol-keluar" onClick={() => (perluKonfirmasi ? setBuka(true) : onKeluar())}>
      <Arrow back /><span>{label ?? t('umum.kembali')}</span>
    </button>
    {buka ? <Modal
      judul={judul}
      onTutup={() => setBuka(false)}
      kembaliKe={() => tombol.current}
      aksi={<>
        <button type="button" className="btn btn-netral" onClick={() => setBuka(false)}>{t('layar.batal')}</button>
        <button type="button" className="btn btn-bahaya" onClick={() => { setBuka(false); onKeluar(); }}>{labelSetuju}</button>
      </>}
    ><p>{pesan}</p></Modal> : null}
  </>;
}
