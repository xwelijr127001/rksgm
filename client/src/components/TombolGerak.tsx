import { aturGerakPenuh } from '../gerak';
import { useSetelanGerak } from '../hooks';
import { t, useBahasa } from '../i18n';

/**
 * Hanya tampil bila PERANGKAT meminta gerak dikurangi (mis. "Animation effects" Windows
 * dimatikan demi performa), sehingga tokoh & adegan diam. Satu ketukan menyalakan animasi
 * di perangkat ini saja; ketuk lagi untuk kembali mengikuti perangkat.
 */
export function TombolGerak({ className = 'btn btn-kecil btn-netral', ringkas = false }: { className?: string; ringkas?: boolean }) {
  const { sistemKurang, dipaksa } = useSetelanGerak();
  useBahasa();
  if (!sistemKurang) return null;
  return (
    <button
      type="button"
      className={className}
      aria-pressed={dipaksa}
      title={t('umum.gerakKet')}
      onClick={() => aturGerakPenuh(!dipaksa)}
    >
      {dipaksa ? t('umum.gerakMenyala') : ringkas ? t('umum.gerakNyalakan') : t('umum.gerakNyalakanPanjang')}
    </button>
  );
}
