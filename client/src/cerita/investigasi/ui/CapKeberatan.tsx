/**
 * T-077: CAP "KEBERATAN!" (momen Ace Attorney). Lapisan penuh di atas layar: kilat putih, ledakan piksel (seni/investigasi/
 * ledakan.png, 2x) membesar dan bergetar, kata "KEBERATAN!" / "OBJECTION!" / "有异议！" sebagai teks hidup, satu efek suara
 * 'keberatan'. Selesai sendiri sesudah 1,5 detik -> onSelesai; ketuk di mana saja (atau Enter / Spasi / Escape) = lewati.
 * Gerak dikurangi: gambar diam tanpa kilat dan getar, lama yang sama. Dipasang lewat portal ke <body> supaya `position: fixed` tidak
 * terpengaruh induk yang ber-transform. Props rencana: { onSelesai }.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { playSfx } from '../../../audio/audio';
import { t } from '../../../i18n';
import ledakanUrl from '../../seni/investigasi/ledakan.png';
import './investigasi.css';

const LAMA_MS = 1500;

export function CapKeberatan({ onSelesai }: { onSelesai: () => void }) {
  const selesaiRef = useRef(onSelesai);
  selesaiRef.current = onSelesai;
  const sudah = useRef(false);
  const tombolRef = useRef<HTMLButtonElement>(null);
  const selesai = () => { if (sudah.current) return; sudah.current = true; selesaiRef.current(); };
  useEffect(() => {
    playSfx('keberatan');
    tombolRef.current?.focus({ preventScroll: true });
    const id = window.setTimeout(selesai, LAMA_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="iv-cap" data-cap-keberatan="" role="alert">
      <button ref={tombolRef} type="button" className="iv-cap-lapis" aria-label={t('investigasi.keberatan.tombol')} onClick={selesai}>
        <span className="iv-cap-kilat" aria-hidden="true" />
        <span className="iv-cap-ledakan" aria-hidden="true" style={{ backgroundImage: `url(${ledakanUrl})` }}>
          <b>{t('investigasi.keberatan.tombol')}</b>
        </span>
      </button>
    </div>,
    document.body,
  );
}
