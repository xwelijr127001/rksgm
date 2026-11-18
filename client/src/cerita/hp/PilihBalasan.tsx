/**
 * Keputusan percakapan di HP: pertanyaan + fakta yang perlu dibaca (di tempat) + balasan sebagai pilihan radio. Ketuk =
 * memilih (bisa diganti), "Kirim" = keputusan dijalankan SEKALI. Panah atas/bawah memindah pilihan (pola radiogroup).
 *
 * T-018 Tahap 1b (D-128): di cangkang obrolan HP (LembarObrolan) keputusan tampil sebagai LEMBAR BALASAN ringkas bergaya
 * game yang naik dari komposer: pegangan (ketuk / geser turun / Esc = tutup, pilihan tetap diingat), ikon Miss Raksa +
 * pertanyaan, baris pilihan bernomor (angka 1-5 = pilih, Enter = kirim), tombol kirim "Pilih 1 balasan" -> "Kirim balasan N",
 * dan kartu rujukan di balik tab kuning "Catatan" (lembar berbalik ke daftar catatan polos + "Kembali ke balasan").
 * Bila lembar lebih tinggi daripada ruang yang ada, HANYA daftar pilihan (atau catatan) yang menggulir di dalam lembar;
 * pertanyaan dan tombol kirim tetap terlihat. Di tempat lain (desktop, adegan tatap muka) semuanya satu blok seperti semula.
 */
import { useContext, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { playSfx } from '../../audio/audio';
import { t } from '../../i18n';
import { URL_IKON_PIKSEL } from '../seni/piksel';
import type { DokumenCerita, Episode, KunciTeks, NodePilihan, Pilihan } from '../tipe';
import { KartuDokumen } from '../ui/KartuDokumen';
import { TombolKirim } from './bagianHp';
import { PotretSaya } from './lookPemain';
import { LembarObrolan } from './ekor';

/** Catatan yang sudah pernah dibuka (titik merah "belum dibaca" hilang), per dokumen, selama halaman hidup. */
const catatanDibaca = new Set<string>();

export function PilihBalasan({ ep, node, pilihan, tx, gaya, petunjuk, onKirim, awal = null, onUbahPilih, onTutup }: {
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
  /** (lembar) tutup lembar dan kembali ke tombol "Balas ..."; pilihan tetap diingat pemanggil. */
  onTutup?: () => void;
}) {
  const idJudul = useId();
  const lembar = useContext(LembarObrolan);
  const sah = awal && pilihan.some((p) => p.id === awal) ? awal : null;
  const [dipilih, setDipilihMentah] = useState<string | null>(sah);
  const [lipat, setLipat] = useState(!!sah);
  const setDipilih = (id: string) => { setDipilihMentah(id); onUbahPilih?.(id); };
  const indeks = pilihan.findIndex((p) => p.id === dipilih);
  const terpilih = indeks >= 0 ? pilihan[indeks]! : null;
  const dok = node.dokumen ? ep.dokumen?.[node.dokumen] : undefined;
  const [nota, setNota] = useState(false);
  const [dibaca, setDibaca] = useState(() => !!node.dokumen && catatanDibaca.has(`${ep.id}:${node.dokumen}`));
  const akar = useRef<HTMLElement>(null);
  const geser = useRef<number | null>(null);
  const panah = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const maju = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    const i = ((indeks < 0 ? (maju > 0 ? -1 : 0) : indeks) + maju + pilihan.length) % pilihan.length;
    setDipilih(pilihan[i]!.id);
    (e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[i])?.focus();
  };

  if (lembar) {
    const bukaNota = (buka: boolean) => {
      setNota(buka);
      if (buka && node.dokumen) { catatanDibaca.add(`${ep.id}:${node.dokumen}`); setDibaca(true); }
      requestAnimationFrame(() => akar.current?.querySelector<HTMLElement>(buka ? '[data-kembali-balasan]' : '[data-hp-fokus]')?.focus({ preventScroll: true }));
    };
    const tombol = (e: KeyboardEvent<HTMLElement>) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (nota) bukaNota(false); else onTutup?.(); return; }
      if (nota) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= pilihan.length) {
        e.preventDefault();
        setDipilih(pilihan[n - 1]!.id);
        akar.current?.querySelectorAll<HTMLElement>('[role="radio"]')[n - 1]?.focus();
        return;
      }
      // Enter pada baris yang SUDAH terpilih (atau pada pertanyaan) = kirim; pada baris lain = memilihnya (klik bawaan).
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (e.key === 'Enter' && dipilih && el && (el.matches('[data-hp-fokus]') || el.getAttribute('data-pilihan') === dipilih)) {
        e.preventDefault();
        akar.current?.querySelector<HTMLElement>('[data-kirim]')?.click();
      }
    };
    // Pegangan: ketuk = tutup; geser turun >= 20 px = tutup.
    const turun = (e: PointerEvent<HTMLButtonElement>) => { geser.current = e.clientY; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* abaikan */ } };
    const lepas = (e: PointerEvent<HTMLButtonElement>) => { const y0 = geser.current; geser.current = null; if (y0 !== null && e.clientY - y0 >= 20) onTutup?.(); };
    return (
      <section ref={akar} className="hp-pilih hp-lembar" data-lembar="" data-gaya={gaya} data-tampil={nota ? 'nota' : 'balas'} aria-labelledby={idJudul} onKeyDown={tombol}>
        <div className="hp-lembar-pegangan">
          <button type="button" data-tutup-lembar="" aria-label={t('ceritaHp.tutupBalasan')} onClick={() => onTutup?.()} onPointerDown={turun} onPointerUp={lepas}><i aria-hidden="true" /></button>
        </div>
        <div className="hp-lembar-kepala">
          <span className="hp-lembar-mr" aria-hidden="true" style={{ backgroundImage: `url(${URL_IKON_PIKSEL.missRaksa})` }} />
          <h2 id={idJudul} className="hp-tanya" tabIndex={-1} data-hp-fokus="">{tx(node.tanya)}</h2>
        </div>
        {dok ? (
          <button type="button" className="hp-lembar-catatan" data-catatan="" data-dibaca={dibaca ? '' : undefined} aria-pressed={nota} onClick={() => bukaNota(!nota)}>
            <span aria-hidden="true">▤</span> {t('ceritaHp.catatan')}{dibaca ? null : <span className="sr-only"> ({t('ceritaHp.catatanBaru')})</span>}
          </button>
        ) : null}
        {nota && dok ? (
          <>
            <div className="hp-lembar-badan" data-gulir-lembar=""><NotaDokumen dokumen={dok} id={node.dokumen!} tx={tx} /></div>
            <button type="button" className="hp-lembar-kembali" data-kembali-balasan="" onClick={() => bukaNota(false)}><span aria-hidden="true">←</span> {t('ceritaHp.kembaliBalasan')}</button>
          </>
        ) : (
          <>
            <div className="hp-opsi-daftar hp-lembar-badan" data-gulir-lembar="" role="radiogroup" aria-labelledby={idJudul} onKeyDown={panah}>
              {pilihan.map((p, i) => {
                const aktif = p.id === dipilih;
                return (
                  <button key={p.id} type="button" role="radio" aria-checked={aktif} tabIndex={aktif || (indeks < 0 && i === 0) ? 0 : -1}
                    className={'hp-opsi' + (aktif ? ' dipilih' : dipilih ? ' lain' : '')} data-pilihan={p.id} style={{ animationDelay: `${i * 30}ms` }} onClick={() => { playSfx('ketuk'); setDipilih(p.id); }}>
                    <span className="hp-opsi-nomor" aria-hidden="true">{i + 1}</span>
                    <span className="hp-opsi-teks">{tx(p.teks)}</span>
                  </button>
                );
              })}
            </div>
            <TombolKirim
              label={terpilih ? t('ceritaHp.kirimBalasanN', { n: indeks + 1 }) : t('ceritaHp.pilihSatuBalasan')}
              siap={dipilih !== null}
              onKirim={() => { if (dipilih) onKirim(dipilih); }}
              potret={<PotretSaya ukuran={32} />}
            />
          </>
        )}
      </section>
    );
  }

  return (
    <section className="hp-pilih" data-gaya={gaya} aria-labelledby={idJudul}>
      <h2 id={idJudul} className="hp-tanya" tabIndex={-1} data-hp-fokus="">{tx(node.tanya)}</h2>
      {dok ? <KartuDokumen dokumen={dok} id={node.dokumen!} tx={tx} /> : null}
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

/**
 * Catatan (D-128): isi kartu dokumen sebagai daftar POLOS di lembar balasan: label tebal, nilai di bawahnya; dokumen bertahap =
 * daftar bernomor (awalan "1. " di label dilepas), tanpa penjelajah tahap. Fakta & catatan ketidakpastian = baris naskah apa
 * adanya. Dokumen ber-skema (bukti lajur) tetap memakai KartuDokumen.
 */
function NotaDokumen({ dokumen, id, tx }: { dokumen: DokumenCerita; id: string; tx: (k: KunciTeks) => string }) {
  if (dokumen.skema) return <KartuDokumen dokumen={dokumen} id={id} tx={tx} />;
  const idJudul = `hp-nota-${id}`;
  return (
    <section className="hp-nota" data-dokumen={id} aria-labelledby={idJudul}>
      <h3 id={idJudul}>{tx(dokumen.judul)}</h3>
      {dokumen.tahapan ? (
        <ol>
          {dokumen.baris.map((b, i) => (
            <li key={i}><span className="hp-opsi-nomor" aria-hidden="true">{i + 1}</span><span><b>{tx(b.label).replace(/^\d+\.\s*/, '')}</b>{b.nilai ? tx(b.nilai) : null}</span></li>
          ))}
        </ol>
      ) : (
        <dl>
          {dokumen.baris.map((b, i) => (
            <div key={i}><dt>{tx(b.label)}</dt>{b.nilai ? <dd>{tx(b.nilai)}</dd> : <dd />}</div>
          ))}
        </dl>
      )}
      {dokumen.tahapan === 'paralel' ? <p className="hp-nota-urutan">{t('ceritaHp.urutanPenjelasan')}</p> : null}
      {dokumen.catatan ? <p className="hp-nota-kaki">{tx(dokumen.catatan)}</p> : null}
    </section>
  );
}
