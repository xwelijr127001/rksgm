/**
 * Penangkap galat untuk bagian yang dimuat lazy di pemain cerita (aktivitas: MissionPlay + adegan 2D).
 *
 * Tanpa ini, potongan kode (chunk) yang gagal diunduh - jaringan putus sesaat, atau deploy baru mengganti nama
 * berkas saat pemain sedang di tengah episode - membuat seluruh halaman kosong tanpa pesan. Browser menyimpan
 * kegagalan import() untuk alamat yang sama, jadi mencoba ulang di tempat tidak menolong: pemulihan yang andal
 * adalah memuat ulang halaman. Progres cerita sudah tersimpan (useCerita menyimpan setiap aksi), sehingga pemain
 * kembali tepat ke node ini. Bila penyimpanan perangkat tidak tersedia, pesannya berkata jujur bahwa cerita akan
 * mulai dari awal.
 */
import { Component, createRef, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Arrow } from '../../components/PlayerShell';
import { t } from '../../i18n';

interface Props {
  children: ReactNode;
  /** true = progres tersimpan di perangkat (muat ulang melanjutkan dari sini). */
  tersimpan: boolean;
  /** Tujuan tautan kembali (daftar cerita). */
  kembali: string;
}

export class BatasGagal extends Component<Props, { galat: boolean }> {
  state = { galat: false };

  static getDerivedStateFromError(): { galat: boolean } {
    return { galat: true };
  }

  private judul = createRef<HTMLHeadingElement>();

  componentDidCatch(e: unknown, info: ErrorInfo): void {
    // Tetap tercatat di konsol untuk diagnosa (tanpa layanan eksternal).
    console.error('[cerita] bagian gagal dimuat', e, info.componentStack);
  }

  /** Fokus yang hilang (tombol "Lanjut" sudah tidak ada) dibawa ke judul pesan, supaya keyboard tidak tersesat. */
  private fokuskan(): void {
    const aktif = document.activeElement;
    if (!aktif || aktif === document.body) this.judul.current?.focus({ preventScroll: true });
  }

  // Galat bisa tertangkap saat pemasangan pertama (chunk yang diunduh lebih awal sudah gagal) atau sesudahnya.
  componentDidMount(): void {
    if (this.state.galat) this.fokuskan();
  }

  componentDidUpdate(_: Props, lama: { galat: boolean }): void {
    if (this.state.galat && !lama.galat) this.fokuskan();
  }

  render(): ReactNode {
    if (!this.state.galat) return this.props.children;
    return (
      <div className="status-panel cer-gagal" role="alert">
        <h2 ref={this.judul} tabIndex={-1} data-cer-fokus="">{t('cerita.gagalJudul')}</h2>
        <p>{t('cerita.gagalIsi')}</p>
        <p>{t(this.props.tersimpan ? 'cerita.gagalTersimpan' : 'cerita.gagalTanpaSimpan')}</p>
        <div className="cer-gagal-aksi">
          <button type="button" className="primary-action" onClick={() => window.location.reload()}>
            {t('cerita.gagalMuatUlang')} <Arrow />
          </button>
          <Link className="cer-tombol-garis" to={this.props.kembali}>{t('cerita.kembaliDaftar')}</Link>
        </div>
      </div>
    );
  }
}
