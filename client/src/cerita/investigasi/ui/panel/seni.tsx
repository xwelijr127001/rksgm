/**
 * T-103 (Designer): kepingan seni panel yang berdiri sendiri (tanpa status, tanpa skor): ikon, ruang panel, potret reaksi,
 * lencana hadiah. Semua hiasan = aria-hidden kecuali diberi `label`.
 *
 *   PanelIcon      ikon 16 x 16 pada kelipatan bulat
 *   PanelRoom      ruang panel 360 x 104 (seni 180 x 52 pada 2x) dengan tiga bust 64 px: penaksir (kiri), ketua (tengah), pemohon
 *                  (kanan, dicerminkan supaya menghadap ke tengah). `speaker` = kursi yang sedang bicara (terang, lainnya redup,
 *                  naik-turun 2 px; gerak dikurangi = diam). `faces` = raut per kursi (bawaan netral).
 *   PanelReaction  potret reaksi 64 x 64 bertanda emosi (48 / 64 / 128 px), untuk adegan sesudah kartu diajukan
 *   PanelAward     lencana hadiah 32 x 32 (1x / 2x / 3x): 'lencana-dua-kasus', 'segel-panel', stempel besar kasus 3
 * Bingkai kartu petugas Kepala = kelas CSS `.pn-bingkai-kepala` (panel.css) pada kartu `.kp-kartu`: tidak mengubah tata letak.
 */
import type { CSSProperties } from 'react';
import { PANEL_SEATS, PanelAssets, bustCell, type PanelFace, type PanelIconId, type PanelReactionId, type PanelSeat } from './aset';
import './panel.css';

export function PanelIcon({ nama, kali = 1, className = '' }: { nama: PanelIconId; kali?: 1 | 2 | 3; className?: string }) {
  const a = PanelAssets.icon;
  const gaya: CSSProperties = {
    width: 16 * kali, height: 16 * kali, backgroundImage: `url(${a.url})`, backgroundSize: `${a.size[0] * kali}px ${16 * kali}px`,
    backgroundPosition: `${-a.cells[nama] * 16 * kali}px 0`,
  };
  return <i className={'pn-ikon ' + className} aria-hidden="true" style={gaya} />;
}

export function PanelRoom({ speaker, faces, label }: {
  speaker?: PanelSeat | null;
  faces?: Partial<Record<PanelSeat, PanelFace>>;
  /** Teks pengganti untuk pembaca layar; tanpa nilai = hiasan. */
  label?: string;
}) {
  return (
    <div className="pn-ruang" data-ruang-panel="" {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      style={{ '--pn-ruang': `url(${PanelAssets.room})`, '--pn-tokoh': `url(${PanelAssets.bust.url})` } as CSSProperties}>
      <div className="pn-ruang-isi">
        {PANEL_SEATS.map((kursi) => {
          const [kol, bar] = bustCell(kursi, faces?.[kursi]);
          return <i key={kursi} className="pn-kursi" data-kursi={kursi} data-bicara={speaker === kursi ? '' : undefined} data-redup={speaker && speaker !== kursi ? '' : undefined}
            style={{ backgroundPosition: `${-kol * 64}px ${-bar * 64}px` }} />;
        })}
      </div>
    </div>
  );
}

export function PanelReaction({ reaksi, ukuran = 64, label = '' }: { reaksi: PanelReactionId; ukuran?: 48 | 64 | 128; label?: string }) {
  const a = PanelAssets.reaction;
  return (
    <span className="pn-reaksi" data-reaksi={reaksi} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      style={{ width: ukuran, height: ukuran, backgroundImage: `url(${a.url})`, backgroundSize: `${a.size[0] * ukuran / 64}px ${ukuran}px`, backgroundPosition: `${-a.cells[reaksi] * ukuran}px 0` }} />
  );
}

const SEL_LENCANA = { 'lencana-dua-kasus': 0, 'segel-panel': 1, 'stempel-kasus-3': 2 } as const;
export type PanelAwardId = keyof typeof SEL_LENCANA;
export function PanelAward({ id, kali = 2, label = '' }: { id: PanelAwardId; kali?: 1 | 2 | 3; label?: string }) {
  return (
    <span className="pn-lencana" data-lencana={id} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      style={{ width: 32 * kali, height: 32 * kali, backgroundImage: `url(${PanelAssets.award['segel-panel'].url})`, backgroundSize: `${96 * kali}px ${32 * kali}px`, backgroundPosition: `${-SEL_LENCANA[id] * 32 * kali}px 0` }} />
  );
}
