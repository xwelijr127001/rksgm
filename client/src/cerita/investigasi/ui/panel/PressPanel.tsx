/**
 * T-103 (Designer): "TANYA LEBIH LANJUT" pada satu pernyataan. Props = kontrak beku T-102 (`PressPanelProps`, cerita/tipe.ts):
 *   PressPanel({ question, answer, opened, onPress, onClose })
 *   opened false  hanya tombolnya (44 px+): ikon tanya + "Tanya lebih lanjut" + "Tanpa poin, tanpa waktu" -> onPress()
 *   opened true   catatan tanya-jawab: "Anda bertanya" + pertanyaan, lalu jawabannya, dan tombol "Tutup" -> onClose()
 * Tanpa pewaktu, tanpa poin, bisa dibuka lagi. Kontrolnya tombol biasa (papan ketik dan pembaca layar sama dengan ketukan):
 * saat terbuka fokus pindah ke catatan (dibacakan), saat ditutup fokus kembali ke tombol "Tanya lebih lanjut" kalau tombol itu
 * masih di layar. Catatan masuk dengan geser kecil; gerak dikurangi = langsung tampil. Tidak menyimpan apa pun.
 * T-127 (Fullstack, babak 2; dua prop opsional, tanpa prop itu komponen persis seperti di atas):
 *   choices  (opened false) 2-3 pertanyaan untuk dipilih SATU: tiap pertanyaan satu tombol (ikon tanya + kalimatnya, 52 px+)
 *            -> onPress(id). Keterangan "tanpa poin, tanpa waktu" ditulis pemanggil di atasnya, sekali.
 *   mark     (opened true) baris "tanda jeli" di bawah jawaban (pertanyaan yang berguna); bukan poin
 */
import { useEffect, useRef } from 'react';
import type { PressPanelProps } from '../../../tipe';
import { PanelIcon } from './seni';
import { useLabelPanel } from './teks';
import './panel.css';

export function PressPanel({ question, answer, opened, onPress, onClose, choices, mark }: PressPanelProps) {
  const L = useLabelPanel();
  const tombol = useRef<HTMLButtonElement>(null);
  const catatan = useRef<HTMLDivElement>(null);
  const sebelum = useRef(opened);
  useEffect(() => {
    if (opened && !sebelum.current) catatan.current?.focus({ preventScroll: false });
    if (!opened && sebelum.current) tombol.current?.focus();
    sebelum.current = opened;
  }, [opened]);
  if (!opened && choices?.length) {
    return (
      <div className="pn-tanya-daftar" role="group" aria-label={L('tanya')} data-tanya-pilihan="">
        {choices.map((c, i) => (
          <button key={c.id} ref={i === 0 ? tombol : undefined} type="button" className="pn-tanya pn-tanya-pilih" data-tanya-lanjut={c.id} onClick={() => onPress(c.id)}>
            <PanelIcon nama="tanya" kali={2} />
            <span className="pn-tanya-teks"><b>{c.question}</b></span>
          </button>
        ))}
      </div>
    );
  }
  if (!opened) {
    return (
      <button ref={tombol} type="button" className="pn-tanya" data-tanya-lanjut="" aria-expanded={false} onClick={() => onPress()}>
        <PanelIcon nama="tanya" kali={2} />
        <span className="pn-tanya-teks"><b>{L('tanya')}</b><small>{L('tanyaKet')}</small></span>
      </button>
    );
  }
  return (
    <div ref={catatan} className="pn-jawab" data-tanya-lanjut="buka" role="group" aria-label={L('tanya')} tabIndex={-1}>
      <p className="pn-jawab-tanya"><b>{L('tanyaAnda')}</b><span>{question}</span></p>
      <p className="pn-jawab-isi">{answer}</p>
      {mark ? <p className="pn-jawab-jeli" data-tanda-jeli="" role="status"><span aria-hidden="true">✦</span>{mark}</p> : null}
      <button type="button" className="pn-jawab-tutup" data-tanya-tutup="" onClick={onClose}>{L('tutup')}</button>
    </div>
  );
}
