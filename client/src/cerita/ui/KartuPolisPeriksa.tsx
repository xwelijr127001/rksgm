/**
 * Kartu polis yang bisa DIPERIKSA (mode cerita, docs/rancangan-mode-cerita.md 11.4 & 11.5): judul, subjudul, dan
 * baris label/nilai seperti PolicyCardView, tetapi subjudul & setiap baris yang punya arti awam
 * (DefAktivitas.kartuArti, lihat artiKartu di hasilAktivitas.ts) menjadi tombol pengungkap (`aria-expanded`) yang
 * membuka arti 1-2 kalimat tepat di bawahnya. Ketuk / Enter / Spasi; tanpa hover. Keadaan terbuka ditandai ikon
 * + / − dan teks artinya sendiri (bukan warna saja).
 *
 * Dipakai di aktivitas polis (MissionPlay `sisipanJawab`: kartu tetap terlihat selama memilih) dan di Catatan kasus.
 * Tanpa data arti (episode lama / data belum ada) = kartu biasa yang hanya dibaca. Chip produk ("AUTO") sengaja
 * tidak ditampilkan: istilah tanpa penjelasan (tinjauan 26 Sep); jenis polis ada di subjudul yang bisa diperiksa.
 */
import { useId, useState } from 'react';
import type { PolicyCard } from '@shared/types';
import { Icon } from '../../art/Icon';
import { t, useBahasa } from '../../i18n';
import './aktivitas.css';

export interface ArtiKartu {
  sub: string | null;
  baris: (string | null)[];
}

/** Satu baris yang bisa diperiksa: tombol (label + nilai + ikon +/−) lalu arti di bawahnya. */
function BarisPeriksa({ id, label, nilai, arti, buka, onUbah }: {
  id: string;
  label?: string;
  nilai: string;
  arti: string;
  buka: boolean;
  onUbah: () => void;
}) {
  return (
    <>
      <button type="button" className="kpp-tombol" aria-expanded={buka} aria-controls={id} onClick={onUbah}>
        <span className="kpp-isi">
          {label ? <span className="kpp-label">{label}</span> : null}
          <span className="kpp-nilai">{nilai}</span>
        </span>
        <span className="kpp-tanda" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" focusable="false">
            <path d={buka ? 'M6 12h12' : 'M12 6v12M6 12h12'} stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <p id={id} className="kpp-arti" hidden={!buka}>{arti}</p>
    </>
  );
}

export function KartuPolisPeriksa({ card, arti }: { card: PolicyCard; arti?: ArtiKartu | null }) {
  useBahasa();
  const dasar = useId();
  const [buka, setBuka] = useState<Record<string, boolean>>({});
  const ubah = (k: string) => setBuka((b) => ({ ...b, [k]: !b[k] }));
  const bisaDiperiksa = !!arti && (!!arti.sub || arti.baris.some(Boolean));
  return (
    <article className="kpp" aria-labelledby={`${dasar}-judul`}>
      <div className="kpp-kepala">
        <span className="kpp-ikon" aria-hidden="true"><Icon name="polis" size={22} /></span>
        <div className="kpp-kepala-teks">
          <strong id={`${dasar}-judul`} className="kpp-judul">{card.title}</strong>
          {card.subtitle && arti?.sub ? (
            <div className="kpp-sub-periksa">
              <BarisPeriksa id={`${dasar}-sub`} nilai={card.subtitle} arti={arti.sub} buka={!!buka.sub} onUbah={() => ubah('sub')} />
            </div>
          ) : card.subtitle ? <span className="kpp-sub">{card.subtitle}</span> : null}
          {bisaDiperiksa ? <p className="kpp-ket">{t('ceritaAkt.kartuKet')}</p> : null}
        </div>
      </div>
      <ul className="kpp-baris">
        {card.rows.map((r, i) => {
          const a = arti?.baris[i] ?? null;
          return (
            <li key={i}>
              {a ? (
                <BarisPeriksa id={`${dasar}-b${i}`} label={r.label} nilai={r.value} arti={a} buka={!!buka[i]} onUbah={() => ubah(String(i))} />
              ) : (
                <span className="kpp-isi kpp-isi-diam">
                  <span className="kpp-label">{r.label}</span>
                  <span className="kpp-nilai">{r.value}</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {card.note ? <p className="kpp-catatan">{card.note}</p> : null}
    </article>
  );
}
