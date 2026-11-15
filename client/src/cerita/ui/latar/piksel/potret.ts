/** Tokoh piksel untuk potret seorang pemeran di episode berpanggung latar (Episode 2), atau null (pakai seni lain / inisial). */
import type { Episode, IdPembicara } from '../../../tipe';
import { tokohPikselTersedia, type IdTokohPiksel } from '../../../seni/piksel';
import { PERAN_PIKSEL } from './adegan';

export function tokohPotret(ep: Pick<Episode, 'latar'>, id: IdPembicara): IdTokohPiksel | null {
  const t = ep.latar ? PERAN_PIKSEL[id]?.tokoh : undefined;
  return t && tokohPikselTersedia(t) ? t : null;
}
