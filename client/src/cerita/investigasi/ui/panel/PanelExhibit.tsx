/**
 * T-103 (Designer): LEMBAR BUKTI (perbesar satu kartu). Dialog bersama (ui/kit Modal): fokus masuk ke judul, Tab berputar di
 * dalam, Escape / latar / "Tutup" menutup, dan saat ditutup fokus KEMBALI ke tombol yang membukanya.
 * Isi per jenis kartu (aset.ts `kind`):
 *   foto    foto 288 x 192; SATU ketukan (pada foto atau tombol di bawahnya) = lihat bagian buktinya dari dekat (288 x 224), ketuk
 *           lagi = foto utuh. Keterangan di bawah foto membawa bukti yang sama dengan gambarnya (`excerpt`).
 *   pesan   kutipan pesan sebagai gelembung percakapan
 *   kertas  kutipan dokumen sebagai lembar kertas
 *   id kartu tanpa seni panel: hanya kutipan dan sumbernya.
 * `quote` = pernyataan yang sedang diperiksa (tampil di atas, supaya bisa dibandingkan). `onUse` = tombol "Pakai bukti ini".
 * Semua kalimat datang dari props (sudah diterjemahkan); komponen ini tidak menyimpan apa pun.
 * T-125: label "Sumber" punya SATU pemilik = teks kartu (`card.source` di semua kasus sudah berbunyi "Sumber: ..." / "Source: ..." /
 * "来源：..."). Dulu komponen ini menambah labelnya sekali lagi ("Sumber: Sumber: ..."). Sekarang `labelSumber` hanya MEMISAH
 * label yang sudah ada supaya bisa ditebalkan; label kamus dipakai hanya bila teksnya datang tanpa label.
 */
import { useState } from 'react';
import { Modal } from '../../../../ui/kit';
import type { PanelCard } from '../../../tipe';
import { evidenceArt } from './aset';
import { PanelIcon } from './seni';
import { useLabelPanel } from './teks';
import './panel.css';

/** Pisah "Label: isi" (titik dua Latin atau lebar-penuh) dari teks sumber yang sudah diterjemahkan. */
function labelSumber(sumber: string, bawaan: string): { label: string; isi: string } {
  const m = /^\s*([^:：]{1,24})([:：])\s*(.+)$/s.exec(sumber);
  return m ? { label: m[1]! + m[2]!, isi: m[3]! } : { label: bawaan + ':', isi: sumber.trim() };
}

export function PanelExhibit({ card, quote, onClose, onUse }: {
  card: PanelCard;
  quote?: { name: string; text: string };
  onClose: () => void;
  /** Tanpa nilai (atau kartu `disabled`) = lembar hanya untuk dibaca. */
  onUse?: (id: PanelCard['id']) => void;
}) {
  const L = useLabelPanel();
  const seni = evidenceArt(card.id);
  const [dekat, setDekat] = useState(false);
  const bisaPakai = !!onUse && !card.disabled;
  const sumber = labelSumber(card.source, L('sumber'));
  return (
    <Modal judul={card.title} onTutup={() => onClose()} lebar={420}
      aksi={(
        <>
          {bisaPakai ? <button type="button" className="primary-action iv-tombol pn-lembar-pakai" data-bukti-pakai={card.id} onClick={() => onUse!(card.id)}>{L('pakai')}</button> : null}
          <button type="button" className="btn btn-netral pn-lembar-tutup" data-bukti-tutup="" onClick={() => onClose()}>{L('tutup')}</button>
        </>
      )}>
      <div className="pn-lembar" data-lembar-bukti={card.id} data-jenis={seni?.kind}>
        {quote ? <p className="pn-kutip"><b>{quote.name}</b><q>{quote.text}</q></p> : null}
        {seni?.kind === 'foto' && seni.exhibit ? (
          <figure className="pn-foto">
            {/* T-115: foto utuh dan foto dekat memakai KOTAK yang sama (3 : 2), dan tombol gantinya menumpang di sudut foto
                (44 x 44, berlabel untuk pembaca layar), jadi lembar tidak bertambah tinggi dan tidak melompat. */}
            {seni.detail ? (
              <div className="pn-foto-bingkai">
                <button type="button" className="pn-foto-tombol" aria-pressed={dekat} aria-label={L(dekat ? 'utuh' : 'dekat')} onClick={() => setDekat((d) => !d)}>
                  <img src={dekat ? seni.detail : seni.exhibit} alt="" width={288} height={192} />
                </button>
                <button type="button" className="pn-foto-ganti" data-foto-dekat={dekat ? '' : undefined} aria-label={L(dekat ? 'utuh' : 'dekat')} title={L(dekat ? 'utuh' : 'dekat')} onClick={() => setDekat((d) => !d)}>
                  <PanelIcon nama={dekat ? 'foto-inspeksi' : 'periksa'} kali={2} />
                </button>
              </div>
            ) : <img src={seni.exhibit} alt="" width={288} height={192} />}
            {card.excerpt ? <figcaption>{card.excerpt}</figcaption> : null}
          </figure>
        ) : seni?.kind === 'pesan' ? (
          <blockquote className="pn-pesan"><p>{card.excerpt ?? card.title}</p></blockquote>
        ) : seni?.kind === 'kertas' ? (
          <blockquote className="pn-kertas"><p>{card.excerpt ?? card.title}</p></blockquote>
        ) : card.excerpt ? <blockquote className="pn-kertas"><p>{card.excerpt}</p></blockquote> : null}
        <p className="pn-sumber">{seni ? <PanelIcon nama={seni.icon} /> : null}<span data-sumber-bukti=""><b>{sumber.label}</b> {sumber.isi}</span></p>
      </div>
    </Modal>
  );
}
