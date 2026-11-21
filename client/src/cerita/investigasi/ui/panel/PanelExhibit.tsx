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
 */
import { useState } from 'react';
import { Modal } from '../../../../ui/kit';
import type { PanelCard } from '../../../tipe';
import { evidenceArt } from './aset';
import { PanelIcon } from './seni';
import { useLabelPanel } from './teks';
import './panel.css';

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
            {seni.detail ? (
              <button type="button" className="pn-foto-tombol" aria-pressed={dekat} aria-label={L(dekat ? 'utuh' : 'dekat')} onClick={() => setDekat((d) => !d)}>
                <img src={dekat ? seni.detail : seni.exhibit} alt="" width={288} height={dekat ? 224 : 192} />
              </button>
            ) : <img src={seni.exhibit} alt="" width={288} height={192} />}
            {card.excerpt ? <figcaption>{card.excerpt}</figcaption> : null}
            {seni.detail ? (
              <button type="button" className="pn-foto-ganti" data-foto-dekat={dekat ? '' : undefined} onClick={() => setDekat((d) => !d)}>
                <PanelIcon nama={dekat ? 'foto-inspeksi' : 'periksa'} />{L(dekat ? 'utuh' : 'dekat')}
              </button>
            ) : null}
          </figure>
        ) : seni?.kind === 'pesan' ? (
          <blockquote className="pn-pesan"><p>{card.excerpt ?? card.title}</p></blockquote>
        ) : seni?.kind === 'kertas' ? (
          <blockquote className="pn-kertas"><p>{card.excerpt ?? card.title}</p></blockquote>
        ) : card.excerpt ? <blockquote className="pn-kertas"><p>{card.excerpt}</p></blockquote> : null}
        <p className="pn-sumber">{seni ? <PanelIcon nama={seni.icon} /> : null}<span><b>{L('sumber')}:</b> {card.source}</span></p>
      </div>
    </Modal>
  );
}
