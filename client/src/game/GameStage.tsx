/**
 * Panggung adegan 2D. Membungkus engine (Phaser) untuk React.
 *
 * - Ilustrasi SVG statis tampil seketika sebagai tampilan sederhana, lalu
 *   kanvas engine muncul di atasnya setelah siap.
 * - Bila engine gagal (HP lama, WebGL & kanvas bermasalah, unduhan gagal, waktu
 *   habis), ilustrasi statis tetap tampil dan pemain menjawab lewat kontrol HTML.
 * - Aktivitas mode cerita ('cerita-*') tidak punya gambar ringan lama yang sesuai: tampilan
 *   sederhananya disusun dari SceneSpec-nya sendiri (latar + seni objek + label, tanpa interaksi),
 *   atau bingkai netral berjudul bila adegannya tidak ada. Misi latihan/acara tetap memakai art/Scene.
 * - Setiap mount = instance baru dengan token baru; ketukan dari instance/ronde
 *   lama dibuang. Unmount = destroy (kanvas, listener, konteks GPU).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MissionPublic, PlayerLook } from '@shared/types';
import { Icon } from '../art/Icon';
import { Scene } from '../art/Scene';
import { t, useBahasa } from '../i18n';

import { LABEL_STATIS, gambarStatisDariSpec, lapisanStatis } from './aksesInfo';
import { WORLD_H, WORLD_W, type SceneSpec, type StageStats, type StageView } from './types';
import type { StageHandle } from './engine/stage';

export type StageStatus = 'static' | 'loading' | 'ready' | 'failed';

export interface StageApi {
  highlight(objectIds: string[]): void;
}

let tokenGlobal = 0;

/** Pemain/panitia bisa memaksa mode ringan: ?adegan=ringan atau localStorage raksa:adegan=ringan. */
export function adeganDimatikan(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get('adegan');
    if (q === 'ringan') localStorage.setItem('raksa:adegan', 'ringan');
    if (q === 'penuh') localStorage.removeItem('raksa:adegan');
    return localStorage.getItem('raksa:adegan') === 'ringan';
  } catch {
    return false;
  }
}

export function GameStage({
  mission,
  spec,
  roundIndex,
  look,
  view,
  onTap,
  onStatus,
  apiRef,
  label,
}: {
  mission: MissionPublic;
  spec: SceneSpec | null;
  roundIndex: number;
  look: PlayerLook;
  view: StageView;
  /** Dipanggil hanya untuk ketukan yang masih relevan (token/misi/ronde sama). */
  onTap: (objectId: string) => void;
  onStatus?: (status: StageStatus, stats?: StageStats) => void;
  apiRef?: React.MutableRefObject<StageApi | null>;
  label: string;
}) {
  useBahasa();
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<StageHandle | null>(null);
  const viewRef = useRef(view);
  const onTapRef = useRef(onTap);
  const onStatusRef = useRef(onStatus);
  const [status, setStatus] = useState<StageStatus>(spec && !adeganDimatikan() ? 'loading' : 'static');
  viewRef.current = view;
  onTapRef.current = onTap;
  onStatusRef.current = onStatus;

  useEffect(() => {
    if (!spec || adeganDimatikan() || !host.current) {
      setStatus('static');
      onStatusRef.current?.('static');
      return;
    }
    const token = ++tokenGlobal;
    const konteks = { token, missionId: mission.id, roundIndex };
    let batal = false;
    setStatus('loading');
    onStatusRef.current?.('loading');
    void import('./engine/stage')
      .then(({ createStage }) =>
        createStage({
          parent: host.current!,
          mission,
          spec,
          look,
          view: viewRef.current,
          bucketShort: spec.bucketShort ?? {},
          // Bahasa berganti -> spec berganti (sceneFor(mission, bahasa)) -> instance baru dengan kata baru.
          kata: {
            difoto: t('adegan.difoto'), masukFolder: t('adegan.masukFolder'), dicatat: t('adegan.dicatat'), didengar: t('adegan.didengar'),
            dipilih: t('adegan.dipilih'), ditandai: t('adegan.ditandai'), dibatalkan: t('adegan.dibatalkan'), dijeda: t('adegan.dijeda'),
          },
          onTap: (objectId) => {
            // Pesan dari instance/ronde lama dibuang.
            if (batal || token !== tokenGlobal || konteks.missionId !== mission.id || konteks.roundIndex !== roundIndex) return;
            onTapRef.current(objectId);
          },
        }),
      )
      .then((h) => {
        if (batal) {
          h.destroy();
          return;
        }
        handle.current = h;
        h.update(viewRef.current);
        if (apiRef) apiRef.current = { highlight: h.highlight };
        setStatus('ready');
        onStatusRef.current?.('ready', h.stats);
      })
      .catch((err: unknown) => {
        if (batal) return;
        // Detail teknis hanya untuk log developer.
        console.warn('[adegan] engine tidak dapat dimuat, memakai tampilan sederhana:', err);
        setStatus('failed');
        onStatusRef.current?.('failed');
      });
    return () => {
      batal = true;
      handle.current?.destroy();
      handle.current = null;
      if (apiRef) apiRef.current = null;
      // Pastikan tidak ada kanvas yatim bila destroy terjadi sebelum boot selesai.
      host.current?.querySelectorAll('canvas[data-raksa-stage]').forEach((c) => c.remove());
    };
    // Instance baru hanya saat misi/ronde/adegan berganti; perubahan view lewat update().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id, roundIndex, spec]);

  useEffect(() => {
    handle.current?.update(view);
  }, [view]);

  const siap = status === 'ready';
  const dariSpec = gambarStatisDariSpec(mission.id);
  return (
    <div className={`adegan adegan-${status}`} data-status={status}>
      <div className="adegan-kanvas" ref={host} role="img" aria-label={label} />
      {!siap ? (
        <div className="adegan-statis" aria-hidden="true">
          {!dariSpec ? <Scene scene={mission.scene} /> : spec ? <AdeganSusun spec={spec} /> : <BingkaiNetral judul={mission.title} />}
        </div>
      ) : null}
      {status === 'loading' ? (
        <span className="adegan-chip" role="status">
          <i className="adegan-spinner" aria-hidden="true" /> {t('layar.menyiapkanAdegan')}
        </span>
      ) : null}
    </div>
  );
}

const uriSvg = (svg: string): string => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

/**
 * Gambar statis dari SceneSpec (aksesInfo.lapisanStatis): seni yang sama dengan kanvas engine, pada
 * posisinya, tanpa interaksi, tanda, atau petugas. Hiasan: nama objeknya juga ada di daftar HTML.
 */
function AdeganSusun({ spec }: { spec: SceneSpec }) {
  const { latar, lapisan, label } = useMemo(() => lapisanStatis(spec), [spec]);
  const h = LABEL_STATIS.tinggi;
  return (
    <svg className="adegan-susun" viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} preserveAspectRatio="xMidYMid meet" data-sumber="spec" focusable="false">
      {[latar, ...lapisan].map((l) => (
        <image key={l.kunci} href={uriSvg(l.svg)} x={l.x} y={l.y} width={l.w} height={l.h} preserveAspectRatio="none" />
      ))}
      {label.map((l) => (
        <g key={l.kunci} transform={`translate(${l.x} ${l.y})`}>
          <rect x={-l.w / 2} y={-h / 2} width={l.w} height={h} rx={14} fill="#ffffff" fillOpacity={0.96} stroke="#212121" strokeOpacity={0.85} strokeWidth={2} />
          <text y={1} textAnchor="middle" dominantBaseline="middle" fontSize={LABEL_STATIS.huruf} fontWeight={700} fill="#212121">{l.teks}</text>
        </g>
      ))}
    </svg>
  );
}

/** Aktivitas cerita tanpa adegan terdaftar: bingkai netral berjudul (gaya bingkai netral misi bergambar). */
function BingkaiNetral({ judul }: { judul: string }) {
  return (
    <div className="adegan-gambar-netral">
      <span className="adegan-gambar-lencana"><Icon name="daftar" size={26} /></span>
      <strong>{judul}</strong>
    </div>
  );
}
