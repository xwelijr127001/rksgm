import { DAFTAR_BAHASA, bahasaSah } from '@shared/bahasa';
import { t, useBahasa } from '../i18n';

/**
 * Pemilih bahasa (ID / EN / 中文). <select> bawaan: mudah dipakai di HP, bisa dioperasikan
 * keyboard & pembaca layar. Pilihan tersimpan di perangkat ini; bawaan Indonesia.
 */
export function PilihBahasa({ className = '' }: { className?: string }) {
  const { bahasa, aturBahasa } = useBahasa();
  return (
    <label className={'pilih-bahasa ' + className}>
      <span className="sr-only">{t('umum.pilihBahasa')}</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" stroke="currentColor" strokeWidth="1.6" /></svg>
      <select value={bahasa} onChange={(e) => { if (bahasaSah(e.target.value)) aturBahasa(e.target.value); }} aria-label={t('umum.pilihBahasa')}>
        {/* Hanya kode singkat: header HP sempit, dan lebar <select> mengikuti teks pilihan. */}
        {DAFTAR_BAHASA.map((b) => <option key={b.kode} value={b.kode} lang={b.htmlLang} title={b.nama} aria-label={b.nama}>{b.singkat}</option>)}
      </select>
    </label>
  );
}
