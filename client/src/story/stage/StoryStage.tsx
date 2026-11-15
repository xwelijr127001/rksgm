/**
 * Visuals of one Story Room scene. Presentation only: it never advances the room, awards time, or reads private
 * state other than the expression it is given.
 *
 *  - Built-in pixel locations (`builtin:bg:meja|parkiran|telepon`) with the built-in customer Bu Rina reuse the v5.1
 *    pixel stage (cerita/ui/Panggung) through a static composition: no opening/animation cues, so every device shows
 *    the same final composition regardless of when it joined the scene.
 *  - Uploaded backgrounds/characters (CMS asset library) render as image layers. A scenario without a customer
 *    character shows the background only; the customer's status stays readable as text ("Status Bu Rina: Kecewa").
 *  - Anything that fails (missing asset, decode error, render error) degrades to a text-only stage card; the dialogue
 *    and choices next to the stage stay fully playable (PRD: lightweight fallback).
 *
 * Readiness for the server is reported by the participant page (story/round/useRoundReady) for the same images
 * (`stageImageUrls`); the server's bounded readiness policy decides when answering opens, never this component.
 */
import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { StoryScenarioLabel, StoryScenePublic, StorySceneLine } from '@shared/story/protocol';
import { Panggung, buatSesiPanggung } from '../../cerita/ui/Panggung';
import type { KomposisiAdegan } from '../../cerita/ui/adeganTipe';
import type { Ekspresi, IdLokasiAdegan, KonfigPanggung } from '../../cerita/tipe';
import { t } from '../../i18n';
import { withBase } from '../base';

export interface RoomAsset {
  id: string;
  kind: string;
  builtin: boolean;
  url: string | null;
  mime: string | null;
  title: string;
  variantUrls: Record<string, string>;
}

export type RoomAssetMap = ReadonlyMap<string, RoomAsset>;

const BUILTIN_LOCATIONS: Record<string, IdLokasiAdegan> = {
  'builtin:bg:meja': 'meja',
  'builtin:bg:parkiran': 'parkiran',
  'builtin:bg:telepon': 'telepon',
};
const BUILTIN_CUSTOMER = 'builtin:char:bu-rina';
const PIXEL_EXPRESSIONS: readonly Ekspresi[] = ['netral', 'cemas', 'kesal', 'bingung', 'lega', 'senang', 'serius', 'tersenyum'];

/** Location label baked into the pixel room's sign; the story room uses the same service desk. */
const STAGE_CONFIG: Pick<KonfigPanggung, 'lokasi' | 'eksterior'> = { lokasi: { nama: 'Raksa Silver Club', tema: 'silver' }, eksterior: null };

export function pixelExpression(expression: string): Ekspresi {
  return (PIXEL_EXPRESSIONS as readonly string[]).includes(expression) ? (expression as Ekspresi) : 'netral';
}

/** Static composition for a built-in location (poses follow the AUTO-1 cues for the same places). */
function compositionFor(location: IdLokasiAdegan, showOfficer: boolean, customerExpression: string, speaking: StorySceneLine['speaker'] | null): KomposisiAdegan {
  const phone = location === 'telepon';
  const outside = location === 'parkiran';
  return {
    lokasi: location,
    mentor: showOfficer
      ? {
          pose: phone ? 'telepon' : outside ? 'berdiri' : speaking === 'officer' ? 'duduk-jelaskan' : 'duduk-dengar',
          ekspresi: speaking === 'officer' ? 'tersenyum' : 'netral',
          pandang: phone ? 'depan' : 'lawan',
        }
      : null,
    nasabah: { pose: phone ? 'telepon' : outside ? 'berdiri' : 'duduk', ekspresi: pixelExpression(customerExpression), pandang: phone ? 'depan' : 'lawan', lewatTelepon: phone },
    pembicara: speaking === 'customer' ? 'nasabah' : speaking === 'officer' ? 'mentor' : speaking === 'narrator' ? 'narasi' : null,
    prop: { kunci: outside ? 'tangan' : 'meja', kartu: 'tersimpan', telepon: phone ? 'tangan' : 'meja' },
    aksi: null,
    pembuka: false,
  };
}

/** Uploaded images the stage shows for a scene (background, customer expression, officer); [] for built-in pixel stages. */
export function stageImageUrls(scene: StoryScenePublic, scenario: StoryScenarioLabel, expression: string, assets: RoomAssetMap | null): string[] {
  if (!assets) return [];
  const urls: string[] = [];
  const bg = assets.get(scene.backgroundAssetId);
  if (bg && !bg.builtin && bg.url) urls.push(withBase(bg.url));
  const customer = scenario.customerCharacterId ? assets.get(scenario.customerCharacterId) : undefined;
  const variant = customer && !customer.builtin ? customer.variantUrls[expression] ?? customer.url : null;
  if (variant) urls.push(withBase(variant));
  if (scene.showOfficer && scenario.officerCharacterId) {
    const officer = assets.get(scenario.officerCharacterId);
    const o = officer && !officer.builtin ? officer.url ?? Object.values(officer.variantUrls)[0] ?? null : null;
    if (o) urls.push(withBase(o));
  }
  return urls;
}

const NO_FAILURES: ReadonlySet<string> = new Set();

/** Images among `urls` that failed to load (the stage falls back per layer). */
function useFailedImages(urls: string[]): ReadonlySet<string> {
  const key = urls.join('|');
  const [state, setState] = useState<{ key: string; failed: ReadonlySet<string> }>({ key, failed: NO_FAILURES });
  useEffect(() => {
    let alive = true;
    if (!key) return;
    const failed = new Set<string>();
    void Promise.all(
      key.split('|').map(
        (url) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => {
              failed.add(url);
              resolve();
            };
            img.src = url;
          }),
      ),
    ).then(() => {
      if (alive) setState({ key, failed });
    });
    return () => {
      alive = false;
    };
  }, [key]);
  return state.key === key ? state.failed : NO_FAILURES;
}

class StageBoundary extends Component<{ resetKey: string; fallback: ReactNode; children: ReactNode }, { failed: boolean; resetKey: string }> {
  state = { failed: false, resetKey: this.props.resetKey };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  static getDerivedStateFromProps(p: { resetKey: string }, s: { failed: boolean; resetKey: string }) {
    return p.resetKey !== s.resetKey ? { failed: false, resetKey: p.resetKey } : null;
  }
  componentDidCatch(err: unknown) {
    console.warn('[story] stage failed; text fallback shown', err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Customer caption: "Status Bu Rina: Kecewa" with a mood word (participant), the name alone on shared screens. */
function customerCaption(customerName: string, moodLabel: string): string {
  return moodLabel ? t('ruang.statusCustomer', { nama: customerName, kata: moodLabel }) : customerName;
}

interface StoryStageProps {
  scene: StoryScenePublic;
  scenario: StoryScenarioLabel;
  /** Customer expression to show (a participant's own mood band, or the neutral expression on shared screens). */
  customerExpression: string;
  /** Mood word shown with the customer's name ("Kecewa", or the scenario's own status word); empty on shared screens. */
  moodLabel: string;
  customerName: string;
  officerName: string;
  assets: RoomAssetMap | null;
  speaking: StorySceneLine['speaker'] | null;
  /** Force the text-only stage (participant chose the light mode, or assets are known to be unavailable). */
  textOnly?: boolean;
}

export function StoryStage(p: StoryStageProps) {
  const location = BUILTIN_LOCATIONS[p.scene.backgroundAssetId];
  const pixel = !p.textOnly && location !== undefined && p.scenario.customerCharacterId === BUILTIN_CUSTOMER;
  const urls = useMemo(
    () => (pixel || p.textOnly ? [] : stageImageUrls(p.scene, p.scenario, p.customerExpression, p.assets)),
    [pixel, p.textOnly, p.scene, p.scenario, p.customerExpression, p.assets],
  );
  const failed = useFailedImages(urls);
  const fallback = <TextStage {...p} />;
  if (p.textOnly) return fallback;
  return (
    <StageBoundary resetKey={p.scene.roundId + (pixel ? ':pixel' : ':img')} fallback={fallback}>
      {pixel && location ? (
        <PixelStage location={location} {...p} />
      ) : (
        <ImageStage {...p} failed={failed} fallback={fallback} />
      )}
    </StageBoundary>
  );
}

function PixelStage({ location, scene, customerExpression, moodLabel, customerName, officerName, speaking, scenario }: StoryStageProps & { location: IdLokasiAdegan }) {
  // The page session object keeps Panggung from replaying one-shot actions; there are none in the story room.
  const [sesi] = useState(buatSesiPanggung);
  const ep = useMemo(() => ({ id: `story:${scenario.scenarioId}`, panggung: { ...STAGE_CONFIG, awal: {} } }), [scenario.scenarioId]);
  const composition = useMemo(() => compositionFor(location, scene.showOfficer, customerExpression, speaking), [location, scene.showOfficer, customerExpression, speaking]);
  return (
    <div className="ss-panggung">
      <Panggung ep={ep} komposisi={composition} mengetik={false} namaMentor={officerName} namaNasabah={customerName} suasana={moodLabel} sesi={sesi} />
    </div>
  );
}

function ImageStage({ scene, scenario, customerExpression, assets, failed, fallback, customerName, moodLabel }: StoryStageProps & { failed: ReadonlySet<string>; fallback: ReactNode }) {
  const bg = assets?.get(scene.backgroundAssetId);
  const bgUrl = bg && !bg.builtin && bg.url ? withBase(bg.url) : null;
  if (!bgUrl || failed.has(bgUrl)) return <>{fallback}</>;
  const customer = scenario.customerCharacterId ? assets?.get(scenario.customerCharacterId) : undefined;
  const cRaw = customer && !customer.builtin ? customer.variantUrls[customerExpression] ?? customer.url : null;
  const cUrl = cRaw ? withBase(cRaw) : null;
  const officer = scene.showOfficer && scenario.officerCharacterId ? assets?.get(scenario.officerCharacterId) : undefined;
  const oRaw = officer && !officer.builtin ? officer.url ?? Object.values(officer.variantUrls)[0] ?? null : null;
  const oUrl = oRaw ? withBase(oRaw) : null;
  // Without a customer portrait the name alone (shared screens) would label a picture the customer is not in.
  const caption = moodLabel || scenario.customerCharacterId ? customerCaption(customerName, moodLabel) : '';
  // The picture is decorative (the dialogue carries the story); the caption stays readable text, not an image label.
  return (
    <div className="ss-gambar" style={{ backgroundImage: `url("${bgUrl}")` }}>
      {oUrl && !failed.has(oUrl) ? <img className="ss-tokoh ss-tokoh-petugas" src={oUrl} alt="" /> : null}
      {cUrl && !failed.has(cUrl) ? <img className="ss-tokoh ss-tokoh-customer" src={cUrl} alt="" /> : null}
      {caption ? <span className="ss-label-tokoh">{caption}</span> : null}
    </div>
  );
}

/** Text-only stage: always works (no images), keeps who-is-there and the customer's mood readable. */
function TextStage({ scene, customerName, officerName, moodLabel }: StoryStageProps) {
  return (
    <div className="ss-teks">
      <span className="ss-teks-judul">{scene.title}</span>
      <span className="ss-teks-tokoh">
        {customerCaption(customerName, moodLabel)}
        {scene.showOfficer && officerName ? ` — ${officerName}` : ''}
      </span>
    </div>
  );
}
