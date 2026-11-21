/** Tokoh piksel untuk potret seorang pemeran di episode berpanggung latar (Episode 2), atau null (pakai seni lain / inisial). */
import type { Episode, IdPembicara } from '../../../tipe';
import { tokohPikselTersedia, type IdTokohPiksel } from '../../../seni/piksel';
import { idPikselPemeran, PERAN_PIKSEL } from './adegan';

/** T-090: pemeran ber-`piksel` (meminjam seni pemeran lain) memakai potret pemeran yang dipinjamnya. */
export function tokohPotret(ep: Pick<Episode, 'latar'> & Partial<Pick<Episode, 'pemeran'>>, id: IdPembicara): IdTokohPiksel | null {
  const t = ep.latar ? PERAN_PIKSEL[idPikselPemeran(ep, id)]?.tokoh : undefined;
  return t && tokohPikselTersedia(t) ? t : null;
}
