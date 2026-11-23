/**
 * T-103 (Designer): SATU BABAK PANEL (Investigator kasus 3). Props = kontrak beku T-102 (`PanelRoundProps`, cerita/tipe.ts):
 *   PanelRound({ chair, statement, cards, attempt, onInspect, onPresent })
 * Layar, dari atas:
 *   ruang panel (hiasan)    tiga kursi; pembuat pernyataan yang diperiksa terang, lainnya redup
 *   ketua                   gelembung (ekor ke kursi tengah): nama + pertanyaan babak (`chair.line`). Percobaan 1 / 2 dengan `chair.hint`: catatan tempel kuning
 *                           berisi petunjuk menggantikan gelembung pertanyaan (pertanyaannya tetap ada untuk pembaca layar)
 *   pernyataan              kutipan yang diperiksa, distabilo jingga
 *   kartu bukti             pilihan tunggal; tiap kartu punya tombol PERBESAR sendiri (44 px+) yang membuka lembar bukti. Lembar
 *                           ditutup = fokus kembali ke tombol perbesar itu. Kartu `disabled` pudar dan tidak bisa dipilih (tetap
 *                           bisa diperbesar). Percobaan 2: bila tinggal satu kartu aktif, kartu itu langsung terpilih.
 *   tombol utama            "Tunjukkan bukti ini" -> onPresent(id). Tanpa waktu, tanpa nyawa.
 * Komponen hanya MENGEMBALIKAN pilihan: tidak membaca atau mengubah skor, tanda, atau simpanan. Semua kalimat naskah dari props.
 * Ukur 360 x 640 (hitung; ruang isi 544): ruang 108 + ketua 78 (nama + 2 baris) / 100 (petunjuk 3 baris) + pernyataan 82
 * (nama + 2 baris) + kartu 3 x 52 + 2 x 5 = 166 + tombol 56 + jarak 4 x 8 = 522 (percobaan 0) .. 544 px (petunjuk 3 baris).
 * Kalimat yang lebih panjang dari itu membuat layar bergulir (tidak ada yang terpotong).
 * T-115 (Fullstack, tanpa gulir; hitungan di atas meleset: kartu berjudul dua baris + baris sumber = 63 px, bukan 52): ruang
 * panel dipotong menjadi 72 px, baris sumber kartu tidak diulang di daftar (ada di lembar bukti), jarak 6 px, dan pada langkah
 * dipandu di layar < 680 px hanya kartu yang diterima yang tampil (ui/muat.css). Tinggi sekarang 390..504 px (ruang isi 557).
 * T-139 (Fullstack; pemilik: "salah = peringatan sampai benar"): TIDAK ADA lagi kartu yang dipilihkan. Di percobaan mana pun tamu
 * sendiri yang memilih lalu menekan "Tunjukkan bukti ini". Kartu yang sudah diajukan dan keliru datang ber-`tried` (+ `disabled`):
 * bercap "sudah dicoba" di gambarnya, redup, tidak bisa dipilih (tetap bisa diperbesar). Kartu itu TETAP tampil di layar pendek
 * (aturan sembunyi muat.css dilepas); tinggi percobaan 2 = tinggi percobaan 1 dengan petunjuknya (hitungan: HANDOFF "## T-139").
 */
import { useEffect, useState } from 'react';
import type { IdBukti, PanelRoundProps } from '../../../tipe';
import { evidenceArt, type PanelSeat } from './aset';
import { PanelExhibit } from './PanelExhibit';
import { PanelIcon, PanelRoom } from './seni';
import { useLabelPanel } from './teks';
import '../investigasi.css';
import './panel.css';

const KURSI: Readonly<Record<string, PanelSeat>> = { pemohon: 'pemohon', penaksir: 'penaksir' };

export function PanelRound({ chair, statement, cards, attempt, onInspect, onPresent }: PanelRoundProps) {
  const L = useLabelPanel();
  const [pilih, setPilih] = useState<IdBukti | null>(null);
  // Percobaan, pernyataan, atau daftar kartu aktif yang baru = pilihan lama dilepas. T-139: tidak ada kartu yang dipilihkan.
  const kunciKartu = cards.map((c) => c.id + (c.disabled ? '-' : '+')).join('|');
  useEffect(() => { setPilih(null); }, [attempt, statement.id, kunciKartu]);
  const [lembar, setLembar] = useState<IdBukti | null>(null);
  const kartuLembar = lembar ? cards.find((c) => c.id === lembar) : undefined;
  const petunjuk = attempt > 0 && chair.hint ? chair.hint : null;
  const kursi = KURSI[statement.actor] ?? null;
  return (
    <section className="iv-layar pn-ronde" data-panel-ronde="" data-percobaan={attempt} aria-labelledby="pn-ronde-tanya">
      <PanelRoom speaker={kursi} faces={attempt > 0 ? { ketua: 'serius' } : undefined} />
      <div className="pn-ketua" data-petunjuk={petunjuk ? '' : undefined}>
        <b>{chair.name}</b>
        <h2 id="pn-ronde-tanya" className={petunjuk ? 'sr-only' : undefined} tabIndex={-1} data-cer-fokus="">{chair.line}</h2>
        {petunjuk ? <p role="status" data-panel-petunjuk="">{petunjuk}</p> : null}
      </div>
      <figure className="pn-pernyataan" data-pernyataan={statement.id} aria-label={L('dibantah')}>
        <figcaption>{statement.name}</figcaption>
        <q>{statement.text}</q>
      </figure>
      <ul className="pn-kartu-daftar" aria-label={L('daftar')}>
        {cards.map((c) => {
          const seni = evidenceArt(c.id);
          const terpilih = pilih === c.id;
          return (
            <li key={c.id} className="pn-kartu" data-kartu={c.id} data-terpilih={terpilih ? '' : undefined} data-redup={c.disabled ? '' : undefined} data-dicoba={c.tried ? '' : undefined}>
              <button type="button" className="pn-kartu-pilih" aria-pressed={terpilih} disabled={c.disabled} data-dicoba={c.tried ? '' : undefined}
                aria-label={c.tried ? `${L('bukti', { judul: c.title })} (${L('dicoba')})` : L('bukti', { judul: c.title })} onClick={() => setPilih(c.id)}>
                {/* T-132: kartu ber-seni babak 2 (`art`) memakai gambar kartu yang NETRAL (mis. perkiraan biaya tanpa cincin merah) */}
                <span className="pn-kartu-gambar" aria-hidden="true" data-seni-r2={c.art ? '' : undefined} style={c.art ? { backgroundImage: `url(${c.art.thumb})` } : seni ? { backgroundImage: `url(${seni.thumb})` } : undefined}>
                  {/* T-139: cap "sudah dicoba" di atas gambar kartu yang sudah diajukan dan keliru */}
                  {c.tried ? <i className="iv-cap-dicoba">{L('dicoba')}</i> : null}
                </span>
                <span className="pn-kartu-teks"><b>{c.title}</b><small>{c.source}</small></span>
                <span className="pn-kartu-tanda" aria-hidden="true">{terpilih ? '✓' : ''}</span>
              </button>
              <button type="button" className="pn-kartu-periksa" data-kartu-periksa={c.id} aria-haspopup="dialog" aria-label={L('periksa', { judul: c.title })}
                onClick={() => { setLembar(c.id); onInspect(c.id); }}>
                <PanelIcon nama="periksa" kali={2} />
              </button>
            </li>
          );
        })}
      </ul>
      {kartuLembar ? (
        <PanelExhibit card={kartuLembar} quote={{ name: statement.name, text: statement.text }} onClose={() => setLembar(null)}
          onUse={(id) => { setPilih(id); setLembar(null); }} />
      ) : null}
      <button type="button" className="primary-action iv-tombol pn-tunjukkan" data-panel-tunjukkan="" disabled={!pilih} onClick={() => { if (pilih) onPresent(pilih); }}>
        {pilih ? L('tunjukkan') : L('pilih')}
      </button>
    </section>
  );
}
