/**
 * T-057: layar akhir proyektor acara = konsep A "Panggung podium" (character/proyektor-t056/konsep-a.png, README A; dipilih
 * pemilik). Panggung tirai piksel, lampu sorot, podium 2-1-3 dengan petugas PIKSEL tiap pemain (T-052 look), nama & poin di
 * blok, Miss Raksa (sprite piksel atlas) mengumumkan di gelembung, daftar samping peringkat 4-10 berwajah piksel mini.
 *
 * Panggung digambar pada kotak tetap 1920 x 1016 (1080 dikurangi bilah status) lalu DISKALAKAN utuh ke ruang yang tersedia,
 * jadi 1920x1080, 1366x768, dan 1280x720 mendapat susunan yang sama tanpa gulir.
 *
 * Urutan muncul (README A): 0 s gelembung "Selamat"; 2,0 s daftar 4-10 baris demi baris (150 md, "tik"); 4,0 s juara 3
 * ("podium"); 6,0 s juara 2; 6,7 & 7,5 s drum; 8,5 s juara 1 + konfeti piksel + fanfare; 11 s kalimat terima kasih. Gerak
 * dikurangi: semua sekaligus + satu "chime". Suara lewat playSfx (bisu & efek mati dihormati mesin audio).
 * Data: `room.podium` / leaderboard dari server apa adanya (peringkat & seri dari server); tidak ada data baru.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { LeaderRow, PlayerLook } from '@shared/types';
import { TOKOH } from '@shared/brand';
import { AvatarPiksel } from '../../art/AvatarPiksel';
import { playSfx } from '../../audio/audio';
import { kisiHeroPiksel } from '../../game/art/heroPiksel';
import { SpriteTokoh } from '../../game/KarakterTokoh';
import { useReducedMotion } from '../../hooks';
import { t } from '../../i18n';
import './panggung.css';

const LEBAR = 1920;
const TINGGI = 1016;

/** Petugas piksel (kisi 18 x 34 dari look) sebagai SVG rect, `s` px per sel. */
function PetugasPiksel({ look, s }: { look: PlayerLook; s: number }) {
  const rect = useMemo(() => {
    const g = kisiHeroPiksel(look);
    const out: string[] = [];
    g.forEach((r, y) => {
      let x = 0;
      while (x < r.length) {
        const c = r[x];
        if (!c) { x++; continue; }
        let e = x + 1;
        while (e < r.length && r[e] === c) e++;
        out.push(`<rect x="${x}" y="${y}" width="${e - x}" height="1" fill="${c}"/>`);
        x = e;
      }
    });
    return out.join('');
  }, [look.body, look.skin, look.hair, look.color, look.accessory]); // eslint-disable-line react-hooks/exhaustive-deps
  return <svg className="pjp-petugas" width={18 * s} height={34 * s} viewBox="0 0 18 34" shapeRendering="crispEdges" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: rect }} />;
}

/** Konfeti piksel: kotak kecil jatuh (warna PALET), posisi & jeda dari benih tetap supaya tidak berganti tiap render. */
function Konfeti({ diam }: { diam: boolean }) {
  const daftar = useMemo(() => {
    let s = 7;
    const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
    const W = ['#ff9000', '#f6d25c', '#fbd7a3', '#d0c282', '#ca94ae', '#ffffff', '#c02430'];
    return Array.from({ length: 110 }, () => ({ x: Math.round(r() * 320) * 6, y: Math.round(r() * 120) * 6, w: r() < 0.5 ? 6 : 12, c: W[Math.floor(r() * W.length)]!, d: r() * 2.2, l: 2.6 + r() * 2.4 }));
  }, []);
  return (
    <div className={'pjp-konfeti' + (diam ? ' diam' : '')} aria-hidden="true">
      {daftar.map((k, i) => (
        <i key={i} style={{ left: k.x, top: diam ? 80 + k.y : -20, width: k.w, height: k.w === 6 ? 12 : 6, background: k.c, animationDelay: `${k.d}s`, animationDuration: `${k.l}s` } as CSSProperties} />
      ))}
    </div>
  );
}

export function PanggungJuara({ rows, acara, hadiah }: { rows: readonly LeaderRow[]; acara: string; hadiah: readonly string[] }) {
  const kurang = useReducedMotion();
  const wadah = useRef<HTMLDivElement>(null);
  const [ukur, setUkur] = useState({ s: 1, x: 0, y: 0 });
  // Skala utuh ke ruang yang tersedia (tanpa gulir).
  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const hitung = () => {
      const w = el.clientWidth, h = el.clientHeight;
      const s = Math.max(0.2, Math.min(w / LEBAR, h / TINGGI));
      setUkur({ s, x: (w - LEBAR * s) / 2, y: (h - TINGGI * s) / 2 });
    };
    hitung();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(hitung);
    ro?.observe(el);
    window.addEventListener('resize', hitung);
    return () => { ro?.disconnect(); window.removeEventListener('resize', hitung); };
  }, []);

  const tiga = rows.slice(0, 3);
  const lain = rows.slice(3, 10);
  // Urutan muncul: 0 awal, 1 daftar mulai, 2 juara 3, 3 juara 2, 4 juara 1, 5 terima kasih. `barisLain` = baris 4-10 yang tampil.
  const [langkah, setLangkah] = useState(kurang ? 5 : 0);
  const [barisLain, setBarisLain] = useState(kurang ? lain.length : 0);
  const kunci = rows.map((r) => `${r.playerId}:${r.rank}`).join('|');
  useEffect(() => {
    if (kurang) {
      setLangkah(5); setBarisLain(lain.length);
      playSfx('chime');
      return;
    }
    setLangkah(0); setBarisLain(0);
    const id: number[] = [];
    const nanti = (ms: number, f: () => void) => { id.push(window.setTimeout(f, ms)); };
    lain.forEach((_, i) => nanti(2000 + i * 150, () => { setBarisLain(i + 1); playSfx('tik'); }));
    nanti(2000, () => setLangkah(1));
    if (tiga[2]) nanti(4000, () => { setLangkah(2); playSfx('podium'); });
    if (tiga[1]) nanti(6000, () => { setLangkah(3); playSfx('podium'); });
    nanti(6700, () => playSfx('drum'));
    nanti(7500, () => playSfx('drum'));
    nanti(8500, () => { setLangkah(4); playSfx('fanfare'); window.setTimeout(() => playSfx('confetti'), 300); });
    nanti(11000, () => setLangkah(5));
    return () => id.forEach((x) => window.clearTimeout(x));
  }, [kunci, kurang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Blok 2-1-3: hanya yang ada pemainnya, tetap di tengah.
  const blok = [1, 0, 2].filter((i) => tiga[i]).map((i) => ({ i, r: tiga[i]!, tampil: langkah >= (i === 2 ? 2 : i === 1 ? 3 : 4) }));
  const TINGGI_BLOK = [340, 270, 240];
  const WARNA_BLOK = ['emas', 'perak', 'perunggu'];

  return (
    <div ref={wadah} className="pjp-wadah">
      <section className="pjp-panggung" aria-label={t('layar.juara', { acara })} data-langkah={langkah}
        style={{ transform: `translate(${ukur.x}px, ${ukur.y}px) scale(${ukur.s})` }}>
        <div className="pjp-tirai" aria-hidden="true" />
        <div className="pjp-lampu-atas" aria-hidden="true" />
        <div className={'pjp-sorot' + (langkah >= 4 ? ' lebar' : '')} aria-hidden="true" />
        <div className="pjp-lantai" aria-hidden="true" />

        <h2 className="pjp-judul">{t('layar.juara', { acara })}</h2>

        {/* Miss Raksa (pembawa acara) + gelembung */}
        <div className="pjp-miss" aria-hidden="true"><SpriteTokoh tokoh="missRaksa" tinggi={552} lambai={!kurang} /></div>
        <p className="pjp-gelembung" aria-live="polite">
          <b>{TOKOH.missRaksa.nama}</b>
          {langkah >= 5 ? t('layar.terimaKasih') : t('layar.panggungSelamat')}
        </p>

        {/* Podium */}
        {blok.length ? (
          <ol className="pjp-podium">
            {blok.map(({ i, r, tampil }) => (
              <li key={r.playerId} className={'pjp-blok ' + WARNA_BLOK[i] + (tampil ? ' tampil' : '')} style={{ '--tinggi': `${TINGGI_BLOK[i]}px` } as CSSProperties}
                aria-hidden={!tampil}>
                <div className="pjp-orang"><PetugasPiksel look={r.look} s={i === 0 ? 8 : 7} /></div>
                <div className="pjp-muka">
                  <span className="pjp-angka">{r.rank}</span>
                  <span className="pjp-nama">{r.nickname}</span>
                  <span className="pjp-poin">{t('layar.nPoin', { n: r.totalPoints.toLocaleString('id-ID') })}</span>
                  {hadiah[i] ? <span className="pjp-hadiah">{hadiah[i]}</span> : null}
                  {r.tied ? <span className="pjp-seri">{t('layar.peringkatSeri')}</span> : null}
                </div>
              </li>
            ))}
          </ol>
        ) : <p className="pjp-kosong">{t('layar.belumAdaHasil')}</p>}

        {/* Peringkat 4-10 (tidak ada bila tidak ada peringkat 4 ke bawah) */}
        {lain.length ? (
          <div className="pjp-samping">
            <h3>{t('layar.panggungLain')}</h3>
            <ol>
              {lain.map((r, k) => (
                <li key={r.playerId} className={k < barisLain ? 'tampil' : ''}>
                  <span className="pjp-s-no">{r.rank}</span>
                  <AvatarPiksel look={r.look} ukuran={48} />
                  <span className="pjp-s-nama">{r.nickname}</span>
                  <span className="pjp-s-poin">{r.totalPoints.toLocaleString('id-ID')}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {langkah >= 4 ? <Konfeti diam={kurang} /> : null}
      </section>
    </div>
  );
}
