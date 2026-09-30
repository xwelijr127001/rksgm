/**
 * Hook state MODE CERITA: muat progres sekali, jalankan aksi lewat reducer mesin, simpan setelah SETIAP aksi sah.
 *
 * - Muat: muatProgres(ep) dibaca sekali saat mount. 'lanjut' -> state tersimpan; 'baru' -> stateAwal (TIDAK
 *   disimpan sampai aksi pertama); 'tidakCocok' -> state null, tampilan menawarkan pemulihan (tidak ada yang
 *   dihapus diam-diam; mulaiBaru mengarsipkan progres lama).
 * - Aksi: dijalankan terhadap ref (bukan closure render) sehingga dua ketukan cepat tetap berurutan; aksi yang
 *   tidak sah (mesin mengembalikan objek yang sama) tidak menyimpan apa pun. Tidak ada aksi otomatis saat mount
 *   (aman untuk StrictMode). Efek samping (simpan, catat akhir) ada di pengendali event, bukan di updater state.
 */
import { useCallback, useRef, useState } from 'react';
import { jalankan, stateAwal } from '../mesin';
import { catatAkhir, muatProgres, mulaiBaru, simpanProgres } from '../simpan';
import type { AksiCerita, Episode, HasilMuat, StateCerita } from '../tipe';

export interface KendaliCerita {
  /** null = progres tersimpan tidak cocok, menunggu pilihan pemulihan. */
  state: StateCerita | null;
  /** Hasil muat saat halaman dibuka (untuk alasan pemulihan). */
  muat: HasilMuat;
  /** Jalankan aksi; true bila state berubah (dan sudah disimpan). */
  kirim: (aksi: AksiCerita) => boolean;
  /** "Mulai ulang": progres tersimpan diarsipkan, state kembali ke awal (belum disimpan). */
  mulaiDariAwal: () => void;
  /** true bila simpanan terakhir hanya masuk memori tab (localStorage diblokir/penuh). */
  hanyaMemori: boolean;
}

export function useCerita(ep: Episode): KendaliCerita {
  const [muat] = useState<HasilMuat>(() => muatProgres(ep));
  const [state, setState] = useState<StateCerita | null>(() =>
    muat.status === 'lanjut' ? muat.state : muat.status === 'baru' ? stateAwal(ep) : null,
  );
  const ref = useRef(state);
  const [hanyaMemori, setHanyaMemori] = useState(false);

  const kirim = useCallback(
    (aksi: AksiCerita): boolean => {
      const lama = ref.current;
      if (!lama) return false;
      const baru = jalankan(ep, lama, aksi);
      if (baru === lama) return false;
      ref.current = baru;
      setState(baru);
      setHanyaMemori(!simpanProgres(ep, baru));
      if (baru.akhir && baru.akhir !== lama.akhir) catatAkhir(ep.id, baru.akhir);
      return true;
    },
    [ep],
  );

  const mulaiDariAwal = useCallback(() => {
    const s = mulaiBaru(ep);
    ref.current = s;
    setState(s);
  }, [ep]);

  return { state, muat, kirim, mulaiDariAwal, hanyaMemori };
}
