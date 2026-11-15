/**
 * Field rounds: where each evidence item sits on the round background, as a numbered point (percent of the image's
 * width/height, the same numbers the room uses). Click the picture to place the chosen item; every point is also a
 * button that arrow keys move (Shift = 5 steps), and each evidence card has numeric x/y fields, so nothing needs a
 * pointer or precise dragging. Points stay within the room's safe range (contentEdit.SPOT_RANGE, the dashed frame) and
 * are drawn where the room draws them.
 */
import { useId, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { contentText, textKey } from '@shared/story/content';
import { withBase } from '../../../story/base';
import { SPOT_RANGE, setEvidenceSpot, spotAt } from '../contentEdit';
import type { EditorProps } from './fields';

const ARROWS: Record<string, readonly [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** The safe range as a frame over the picture (x in % of the width, y in % of the height, like the spots). */
const SAFE_AREA = { left: `${SPOT_RANGE.min}%`, top: `${SPOT_RANGE.min}%`, right: `${100 - SPOT_RANGE.max}%`, bottom: `${100 - SPOT_RANGE.max}%` };

export function SpotMap({ ed, roundIndex }: { ed: EditorProps; roundIndex: number }) {
  const selectId = useId();
  const [active, setActive] = useState(0);
  /** URL of a background that failed to load (the map then shows the neutral 16:9 field). */
  const [failed, setFailed] = useState<string | null>(null);
  const r = ed.content.rounds[roundIndex];
  if (!r || r.evidence.length === 0) return null;
  const bg = ed.assets.find((a) => a.id === r.backgroundAssetId);
  const url = bg && !bg.builtin && bg.url ? withBase(bg.url) : null;
  const shown = url && url !== failed ? url : null;
  const current = Math.min(active, r.evidence.length - 1);
  const titleOf = (i: number) => contentText(ed.content, ed.locale, textKey.evidenceTitle(r.id, r.evidence[i]?.id ?? '')) || `Berkas ${i + 1}`;
  const place = (i: number, spot: { x: number; y: number }) => ed.update((x) => setEvidenceSpot(x, roundIndex, i, spot));

  const pick = (e: MouseEvent<HTMLDivElement>) => {
    if (ed.readOnly) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    place(current, { x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100 });
  };
  const nudge = (i: number, e: KeyboardEvent<HTMLButtonElement>) => {
    const stored = r.evidence[i]?.spot;
    const arrow = ARROWS[e.key];
    if (!stored || !arrow || ed.readOnly) return;
    e.preventDefault();
    const step = e.shiftKey ? 5 : 1;
    const spot = spotAt(stored.x, stored.y);
    place(i, { x: spot.x + arrow[0] * step, y: spot.y + arrow[1] * step });
  };
  /** A numbered point where the room draws it: a button (click selects it, arrows move it) while editing, a plain mark when read-only. */
  const marker = (i: number, key: string, stored: { x: number; y: number }) => {
    const spot = spotAt(stored.x, stored.y);
    const style = { left: `${spot.x}%`, top: `${spot.y}%` };
    const where = `${titleOf(i)}: ${spot.x}% dari kiri, ${spot.y}% dari atas`;
    if (ed.readOnly) {
      return (
        <span key={key} className="cms-titik" style={style} title={where}>
          {i + 1}
        </span>
      );
    }
    return (
      <button
        key={key}
        type="button"
        className={`cms-titik${i === current ? ' aktif' : ''}`}
        style={style}
        aria-label={`Titik ${i + 1}, ${where}. Panah untuk menggeser.`}
        onClick={(e) => {
          e.stopPropagation();
          setActive(i);
        }}
        onFocus={() => setActive(i)}
        onKeyDown={(e) => nudge(i, e)}
      >
        {i + 1}
      </button>
    );
  };

  return (
    <div className="cms-peta">
      <div className="stf-isian">
        <label htmlFor={selectId}>Klik gambar untuk menaruh titik</label>
        <select id={selectId} className="kolom" value={current} disabled={ed.readOnly} onChange={(e) => setActive(Number(e.target.value))}>
          {r.evidence.map((item, i) => (
            <option key={item.id} value={i}>
              {i + 1}. {titleOf(i)}
              {item.spot ? '' : ' (belum bertitik)'}
            </option>
          ))}
        </select>
        <small>
          Nomor titik = urutan berkas. Titik selalu di dalam bingkai putus-putus ({SPOT_RANGE.min}–{SPOT_RANGE.max}%), supaya penanda tidak terpotong di room. Tanpa mouse: fokus ke titik lalu tekan panah (Shift = 5 langkah), atau isi X/Y di kartu berkas.
        </small>
      </div>
      {shown ? null : (
        <p className="cms-isu-peringatan">
          {url
            ? 'Gambar latar gagal dimuat. Titik tetap disimpan dalam persen.'
            : 'Latar bawaan tidak punya berkas gambar, jadi peserta tidak melihat adegan dan titiknya, hanya daftar berkas. Pilih latar hasil unggahan di “Latar” di atas.'}
        </p>
      )}
      <div className="cms-peta-wadah">
        <div className={`cms-peta-bingkai${ed.readOnly ? '' : ' bisa-taruh'}`} onClick={pick}>
          {shown ? <img src={shown} alt="" draggable={false} onError={() => setFailed(shown)} /> : <div className="cms-peta-kosong" />}
          <span className="cms-peta-aman" style={SAFE_AREA} aria-hidden="true" />
          {r.evidence.map((item, i) => (item.spot ? marker(i, item.id, item.spot) : null))}
        </div>
      </div>
    </div>
  );
}
