/**
 * T-103 (Designer): "TANYA LEBIH LANJUT" pada satu pernyataan. Props = kontrak beku T-102 (`PressPanelProps`, cerita/tipe.ts):
 *   PressPanel({ question, answer, opened, onPress, onClose })
 *   opened false  hanya tombolnya (44 px+): ikon tanya + "Tanya lebih lanjut" + "Tanpa poin, tanpa waktu" -> onPress()
 *   opened true   catatan tanya-jawab: "Anda bertanya" + pertanyaan, lalu jawabannya, dan tombol "Tutup" -> onClose()
 * Tanpa pewaktu, tanpa poin, bisa dibuka lagi. Kontrolnya tombol biasa (papan ketik dan pembaca layar sama dengan ketukan):
 * saat terbuka fokus pindah ke catatan (dibacakan), saat ditutup fokus kembali ke tombol "Tanya lebih lanjut" kalau tombol itu
 * masih di layar. Catatan masuk dengan geser kecil; gerak dikurangi = langsung tampil. Tidak menyimpan apa pun.
 */
import { useEffect, useRef } from 'react';
import type { PressPanelProps } from '../../../tipe';
import { PanelIcon } from './seni';
import { useLabelPanel } from './teks';
import './panel.css';

export function PressPanel({ question, answer, opened, onPress, onClose }: PressPanelProps) {
  const L = useLabelPanel();
  const tombol = useRef<HTMLButtonElement>(null);
  const catatan = useRef<HTMLDivElement>(null);
  const sebelum = useRef(opened);
  useEffect(() => {
    if (opened && !sebelum.current) catatan.current?.focus({ preventScroll: false });
    if (!opened && sebelum.current) tombol.current?.focus();
    sebelum.current = opened;
  }, [opened]);
  if (!opened) {
    return (
      <button ref={tombol} type="button" className="pn-tanya" data-tanya-lanjut="" aria-expanded={false} onClick={onPress}>
        <PanelIcon nama="tanya" kali={2} />
        <span className="pn-tanya-teks"><b>{L('tanya')}</b><small>{L('tanyaKet')}</small></span>
      </button>
    );
  }
  return (
    <div ref={catatan} className="pn-jawab" data-tanya-lanjut="buka" role="group" aria-label={L('tanya')} tabIndex={-1}>
      <p className="pn-jawab-tanya"><b>{L('tanyaAnda')}</b><span>{question}</span></p>
      <p className="pn-jawab-isi">{answer}</p>
      <button type="button" className="pn-jawab-tutup" data-tanya-tutup="" onClick={onClose}>{L('tutup')}</button>
    </div>
  );
}
