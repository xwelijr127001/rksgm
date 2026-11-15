/**
 * Optional evidence photo/video of a scene (CMS `mediaAssetId`). Missing or failed media simply shows nothing. Kept
 * free of the stage's canvas imports so activities that show it render in node tests.
 */
import { useState } from 'react';
import { withBase } from '../base';
import type { RoomAssetMap } from '../stage/StoryStage';

export function SceneMedia({ mediaAssetId, assets }: { mediaAssetId: string | null; assets: RoomAssetMap | null }) {
  const [failed, setFailed] = useState(false);
  const media = mediaAssetId ? assets?.get(mediaAssetId) : undefined;
  if (!media?.url || failed) return null;
  const url = withBase(media.url);
  return (
    <figure className="ss-media">
      {media.kind === 'video' ? (
        <video src={url} controls playsInline preload="metadata" onError={() => setFailed(true)} />
      ) : (
        <img src={url} alt={media.title} loading="lazy" onError={() => setFailed(true)} />
      )}
      <figcaption>{media.title}</figcaption>
    </figure>
  );
}
