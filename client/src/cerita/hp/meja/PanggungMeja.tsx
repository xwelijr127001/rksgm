/**
 * Pembungkus React untuk adegan meja (Phaser). Satu instance per pemasangan; `pandang` berubah = `atur()` (tanpa membuat
 * ulang). Selama engine dimuat tampil permukaan meja statis + "Menyiapkan meja…"; gagal / dimatikan (?adegan=ringan) =
 * `onStatus('gagal')` dan pemanggil memakai tampilan daftar dengan state yang sama. Anak (`children`) = lapisan tombol
 * HTML di atas kanvas, hanya saat engine siap.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { adeganDimatikan } from '../../../game/GameStage';
import { t } from '../../../i18n';
import type { Episode } from '../../tipe';
import type { PandangMeja } from './MejaScene';
import { buatPanggungMeja, type HandleMeja } from './panggung';

export type StatusPanggung = 'muat' | 'siap' | 'gagal';

const SENI_MEJA = ['meja.kayu', 'meja.map', 'meja.mapBuka', 'meja.kontak', 'bundel.sekarang', 'bundel.lengkapi', 'dok.laporan', 'dok.suratpolisi.ada'];

export function PanggungMeja({ ep, seniBerkas, pandang, onKetuk, onStatus, children }: {
  ep: Episode;
  seniBerkas: Record<string, string | undefined>;
  pandang: PandangMeja;
  onKetuk: (id: string) => void;
  onStatus: (s: StatusPanggung) => void;
  children?: ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<HandleMeja | null>(null);
  const pandangRef = useRef(pandang);
  const ketukRef = useRef(onKetuk);
  const statusRef = useRef(onStatus);
  pandangRef.current = pandang;
  ketukRef.current = onKetuk;
  statusRef.current = onStatus;
  const [status, setStatus] = useState<StatusPanggung>('muat');

  useEffect(() => {
    const ubah = (s: StatusPanggung) => { setStatus(s); statusRef.current(s); };
    if (adeganDimatikan() || !host.current) { ubah('gagal'); return; }
    let batal = false;
    const potret = ep.latar?.tokoh[ep.nasabah ?? '']?.avatar.netral;
    buatPanggungMeja({
      parent: host.current,
      seni: ep.seniArena ?? {},
      kunciSeni: [...new Set([...SENI_MEJA, ...Object.values(seniBerkas).filter((x): x is string => !!x)])],
      seniBerkas,
      avatarUrl: potret?.length ? potret[potret.length - 1]!.src : null,
      pandang: pandangRef.current,
      onKetuk: (id) => ketukRef.current(id),
    }).then((h) => {
      if (batal) { h.destroy(); return; }
      handle.current = h;
      h.atur(pandangRef.current);
      ubah('siap');
    }).catch((e: unknown) => {
      if (batal) return;
      console.warn('[meja] engine tidak dapat dimuat, memakai tampilan daftar:', e);
      ubah('gagal');
    });
    return () => {
      batal = true;
      handle.current?.destroy();
      handle.current = null;
      host.current?.querySelectorAll('canvas[data-raksa-meja]').forEach((c) => c.remove());
    };
    // Satu instance per pemasangan; perubahan tampilan lewat atur().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { handle.current?.atur(pandang); }, [pandang]);

  return (
    <div className="meja-panggung" data-status={status}>
      <div className="meja-kanvas" ref={host} />
      {status === 'muat' ? <span className="meja-muat" role="status"><i className="adegan-spinner" aria-hidden="true" /> {t('ceritaHp.mejaMenyiapkan')}</span> : null}
      {status === 'siap' ? children : null}
    </div>
  );
}
