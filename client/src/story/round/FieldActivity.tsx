/**
 * Field activity: one scene picture (the round's background) with numbered information points, and the same items as
 * a numbered list under it — the list is the full equivalent for keyboard, screen readers and a picture that fails to
 * load (the markers are a tap shortcut, hidden from assistive technology). A marker is a small see-through pin kept
 * inside the picture, with a 44 px tap area around it, so it hides as little of the scene as possible; "Perbesar
 * gambar" opens the picture across the sheet's full width. Then the question and five actions; after close the result
 * card (the page's OutcomeBlock).
 */
import { useState, type CSSProperties } from 'react';
import type { StoryScenePublic } from '@shared/story/protocol';
import { t } from '../../i18n';
import { withBase } from '../base';
import { DialogueList, OpeningLines } from '../ui/conversation';
import { SceneMedia } from '../ui/SceneMedia';
import { DecisionArea, PublicLesson, type ActivityProps } from './activityParts';
import { EvidenceList } from './EvidenceList';
import { fieldMarkersOf, type FieldMarker, type RoundView } from './roundModel';

/** The round's scene picture (an uploaded background; built-in pixel backgrounds have no file), or null. */
export function fieldPictureUrl(view: Pick<RoundView, 'scene' | 'assets'>): string | null {
  const bg = view.assets?.get(view.scene.backgroundAssetId);
  return bg && !bg.builtin && bg.url ? withBase(bg.url) : null;
}

export function FieldActivity(p: ActivityProps) {
  const { view, phase, onOpen, onZoom } = p;
  const url = fieldPictureUrl(view);
  return (
    <>
      {view.intro.length ? <OpeningLines lines={view.intro} /> : null}
      {view.lines.length ? (
        <div className="sr-ringkasan">
          <DialogueList lines={view.lines} />
        </div>
      ) : null}
      {url ? <FieldScene key={url} url={url} scene={view.scene} onOpen={onOpen} onZoom={onZoom} /> : null}
      <EvidenceList items={view.scene.evidence} variant="list" onOpen={onOpen} assets={view.assets} />
      <SceneMedia mediaAssetId={view.scene.mediaAssetId} assets={view.assets} />
      <DecisionArea {...p} />
      <PublicLesson view={view} phase={phase} />
    </>
  );
}

/** A marker's place in percent of the picture; the stylesheet keeps it inside the picture's edges. */
const markerPlace = (m: FieldMarker) => ({ '--x': `${m.x}%`, '--y': `${m.y}%` }) as CSSProperties;

/** The picture with its markers; markers appear once the picture has its size, a failed picture leaves a note. */
function FieldScene({ url, scene, onOpen, onZoom }: { url: string; scene: StoryScenePublic; onOpen: ((id: string) => void) | null; onZoom: (() => void) | null }) {
  const [state, setState] = useState<'loading' | 'ok' | 'failed'>('loading');
  if (state === 'failed') return <p className="sr-berkas-gagal">{t('ruang.adeganGagal')}</p>;
  const markers = fieldMarkersOf(scene.evidence);
  const zoom = onZoom && state === 'ok' ? onZoom : null;
  return (
    <figure className="sr-lapangan">
      <div className="sr-lapangan-bingkai">
        <img src={url} alt="" onLoad={() => setState('ok')} onError={() => setState('failed')} />
        {state === 'ok'
          ? markers.map((m) =>
              onOpen ? (
                <button key={m.id} type="button" className="sr-penanda" style={markerPlace(m)} data-berkas={m.id} tabIndex={-1} aria-hidden="true" title={m.title} onClick={() => onOpen(m.id)}>
                  {m.number}
                </button>
              ) : (
                <span key={m.id} className="sr-penanda" style={markerPlace(m)} aria-hidden="true">
                  {m.number}
                </span>
              ),
            )
          : null}
      </div>
      {markers.length || zoom ? (
        <figcaption className="sr-lapangan-keterangan">
          {markers.length ? <span className="sr-kecil sr-lapangan-petunjuk">{t(onOpen ? 'ruang.adeganPetunjuk' : 'ruang.adeganPetunjukLayar')}</span> : null}
          {zoom ? (
            <button type="button" className="sr-perbesar" onClick={zoom}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6" />
              </svg>
              {t('ruang.perbesarGambar')}
            </button>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
