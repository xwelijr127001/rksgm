/**
 * Adegan GAMBAR: soal buatan panitia tampil dengan gambar desainer di tempat adegan 2D.
 *
 * - Bingkai sama dengan kanvas engine (.adegan, rasio 4:3) sehingga tata letak layar misi tidak
 *   berubah dan tidak bergeser saat gambar datang; gambar "contain" di atas latar krem.
 * - TANPA engine: tidak ada impor Phaser di jalur ini. Pemain menjawab lewat panel HTML.
 * - Tiga keadaan yang jujur: memuat (chip), gagal (ikon + teks + tombol muat ulang), siap.
 *   Tanpa gambar sama sekali = bingkai netral berisi judul misi, bukan galat.
 * - Melapor ke pemanggil dengan kosakata status adegan (loading/ready/failed/static) supaya
 *   "adegan siap" tetap terkirim ke host, juga saat gambar gagal atau terlalu lama.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MissionPublic } from '@shared/types';
import { Icon } from '../art/Icon';
import { t, useBahasa } from '../i18n';
import { STATUS_ADEGAN, visualMisi, type StatusGambar } from './gambar';
import type { StageStatus } from './GameStage';

/** Lebih lama dari ini dianggap gagal (host tidak menunggu); bila gambar menyusul datang, ia tetap tampil. */
const BATAS_MUAT_MS = 10_000;

export function AdeganGambar({ mission, onStatus, penonton = false }: {
  mission: MissionPublic;
  onStatus?: (status: StageStatus) => void;
  /** Layar proyektor: tanpa kalimat "kamu tetap bisa menjawab". */
  penonton?: boolean;
}) {
  useBahasa();
  const visual = useMemo(() => visualMisi(mission), [mission]);
  const src = visual.jenis === 'gambar' ? visual.src : null;
  const alt = visual.jenis === 'gambar' ? visual.alt : '';
  const [status, setStatus] = useState<StatusGambar>(src ? 'memuat' : 'netral');
  /** Naik tiap "Muat ulang gambar": elemen <img> dibuat baru sehingga peramban meminta lagi. */
  const [coba, setCoba] = useState(0);
  const img = useRef<HTMLImageElement>(null);
  const statusRef = useRef<StatusGambar | null>(null);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const lapor = useCallback((s: StatusGambar) => {
    if (statusRef.current === s) return;
    statusRef.current = s;
    setStatus(s);
    onStatusRef.current?.(STATUS_ADEGAN[s]);
  }, []);

  useEffect(() => {
    if (!src) { lapor('netral'); return; }
    // Gambar dari cache bisa selesai sebelum efek ini jalan (onLoad sudah melapor) atau sebelum
    // React memasang onLoad: periksa dulu, supaya status tidak mundur dari siap ke memuat.
    const el = img.current;
    if (el?.complete) { lapor(el.naturalWidth > 0 ? 'siap' : 'gagal'); return; }
    lapor('memuat');
    const timer = window.setTimeout(() => { if (statusRef.current === 'memuat') lapor('gagal'); }, BATAS_MUAT_MS);
    return () => window.clearTimeout(timer);
  }, [src, coba, lapor]);

  return (
    <div className="adegan adegan-gambar" data-status={status}>
      {src ? (
        <img
          key={coba}
          ref={img}
          className="adegan-gambar-img"
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          draggable={false}
          onLoad={() => lapor('siap')}
          onError={() => lapor('gagal')}
        />
      ) : (
        // Judul yang sama sudah ada di kepala halaman: bingkai ini hiasan, bukan informasi baru.
        <div className="adegan-gambar-netral" aria-hidden="true">
          <span className="adegan-gambar-lencana"><Icon name="daftar" size={26} /></span>
          <strong>{mission.title}</strong>
        </div>
      )}
      {status === 'memuat' ? (
        <span className="adegan-chip" role="status">
          <i className="adegan-spinner" aria-hidden="true" /> {t('misi.gambarMemuat')}
        </span>
      ) : null}
      {status === 'gagal' ? (
        <div className="adegan-gambar-pesan" role="status">
          <span className="adegan-gambar-lencana adegan-gambar-lencana-gagal"><Icon name="foto" size={26} /></span>
          <p><b>{t('misi.gambarGagal')}</b>{penonton ? null : <span>{t('misi.gambarTetapJawab')}</span>}</p>
          <button type="button" className="adegan-gambar-ulang" onClick={() => setCoba((n) => n + 1)}>
            {t('misi.gambarMuatUlang')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
