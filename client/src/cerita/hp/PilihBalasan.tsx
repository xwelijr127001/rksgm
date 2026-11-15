/**
 * Keputusan percakapan di HP: pertanyaan + fakta yang perlu dibaca (di tempat) + balasan sebagai pilihan radio. Ketuk =
 * memilih (bisa diganti), "Kirim" = keputusan dijalankan SEKALI. Panah atas/bawah memindah pilihan (pola radiogroup).
 */
import { useId, useState, type KeyboardEvent } from 'react';
import { t } from '../../i18n';
import type { Episode, KunciTeks, NodePilihan, Pilihan } from '../tipe';
import { KartuDokumen } from '../ui/KartuDokumen';
import { TombolKirim } from './bagianHp';

export function PilihBalasan({ ep, node, pilihan, tx, gaya, petunjuk, onKirim, awal = null, onUbahPilih }: {
  ep: Episode;
  node: NodePilihan;
  pilihan: Pilihan[];
  tx: (k: KunciTeks) => string;
  /** 'obrolan' = balasan chat (tombol "Kirim balasan"); 'adegan' = jawaban tatap muka. */
  gaya: 'obrolan' | 'adegan';
  /** Petunjuk "pilih lalu kirim, masih bisa diganti" (hanya keputusan pertama; sesudahnya teks berulang). */
  petunjuk: boolean;
  onKirim: (id: string) => void;
  /** Pilihan yang dipulihkan sesudah muat ulang (belum dikirim). */
  awal?: string | null;
  onUbahPilih?: (id: string) => void;
}) {
  const idJudul = useId();
  const sah = awal && pilihan.some((p) => p.id === awal) ? awal : null;
  const [dipilih, setDipilihMentah] = useState<string | null>(sah);
  const [lipat, setLipat] = useState(!!sah);
  const setDipilih = (id: string) => { setDipilihMentah(id); onUbahPilih?.(id); };
  const indeks = pilihan.findIndex((p) => p.id === dipilih);
  const terpilih = indeks >= 0 ? pilihan[indeks]! : null;
  const panah = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const maju = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    const i = ((indeks < 0 ? (maju > 0 ? -1 : 0) : indeks) + maju + pilihan.length) % pilihan.length;
    setDipilih(pilihan[i]!.id);
    (e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[i])?.focus();
  };
  return (
    <section className="hp-pilih" data-gaya={gaya} aria-labelledby={idJudul}>
      <h2 id={idJudul} className="hp-tanya" tabIndex={-1} data-hp-fokus="">{tx(node.tanya)}</h2>
      {node.dokumen && ep.dokumen?.[node.dokumen] ? <KartuDokumen dokumen={ep.dokumen[node.dokumen]!} id={node.dokumen} tx={tx} /> : null}
      {petunjuk && !lipat ? <p className="hp-petunjuk">{t('ceritaHp.pilihPetunjuk')}</p> : null}
      {/* Prototipe Claude Design: sesudah memilih dengan ketukan, daftar dilipat menjadi PRATINJAU kalimat lengkap (naskah) + Ganti;
          panah keyboard tetap memilih di dalam daftar tanpa melipatnya. */}
      {lipat && terpilih ? (
        <figure className="hp-pratinjau-balasan" data-gaya={gaya} role="status">
          <figcaption>{t('ceritaHp.pratinjauBelum')}</figcaption>
          <p className="hp-pratinjau-balasan-teks" data-pratinjau={terpilih.id}>{tx(terpilih.teks)}</p>
          <button type="button" className="hp-tautan" data-ganti-balasan="" onClick={() => { setLipat(false); requestAnimationFrame(() => document.querySelector<HTMLElement>(`.hp-pilih [data-pilihan="${terpilih.id}"]`)?.focus()); }}>
            {gaya === 'obrolan' ? t('ceritaHp.gantiBalasan') : t('ceritaHp.gantiJawaban')}
          </button>
        </figure>
      ) : null}
      <div className="hp-opsi-daftar" role="radiogroup" aria-labelledby={idJudul} onKeyDown={panah} hidden={lipat && !!terpilih}>
        {pilihan.map((p, i) => {
          const aktif = p.id === dipilih;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={aktif}
              tabIndex={aktif || (indeks < 0 && i === 0) ? 0 : -1}
              className={'hp-opsi' + (aktif ? ' dipilih' : '')}
              data-pilihan={p.id}
              onClick={() => { setDipilih(p.id); setLipat(true); }}
            >
              <span className="hp-opsi-tanda" aria-hidden="true">{aktif ? <i /> : null}</span>
              <span className="hp-opsi-teks">{tx(p.teks)}</span>
            </button>
          );
        })}
      </div>
      <TombolKirim
        label={gaya === 'obrolan' ? t('ceritaHp.kirimBalasan') : t('ceritaHp.kirimJawaban')}
        siap={dipilih !== null}
        onKirim={() => { if (dipilih) onKirim(dipilih); }}
        alasanBelum={dipilih ? null : gaya === 'obrolan' ? t('ceritaHp.belumBalasan') : t('ceritaHp.belumJawaban')}
      />
    </section>
  );
}
