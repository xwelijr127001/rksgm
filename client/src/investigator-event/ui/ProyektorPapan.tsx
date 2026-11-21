/**
 * T-105 (Designer): PAPAN PROYEKTOR "Top Investigator hari ini" (16:9), tampilan saja: props masuk, tanpa fetch / socket /
 * penyimpanan. Kartu 6 mengisi props dari `BoardSnapshot` (shared/investigator/event.ts) tiap jajak.
 *
 * Rupa = kantor detektif malam layar judul T-100: dinding malam, jendela kota, logo piksel "RAKSA INVESTIGATOR", papan gabus
 * berpaku berisi peringkat, Miss Raksa detektif di belakang meja kayu.
 *   kiri   papan gabus: 10 baris (EVENT_LIMITS.topRows) peringkat / nama samaran / stempel (3 slot) / total. Peringkat = nilai
 *          `rank` dari server apa adanya (nilai sama = peringkat sama). Peringkat 1-3 = perisai emas / perak / perunggu.
 *   kanan  kartu "Ikut main": QR + kode acara besar + jumlah peserta; Miss Raksa di bawahnya.
 *   kosong catatan tempel "Papan masih kosong" di papan gabus.
 *   tutup  cap merah "PAPAN DITUTUP" di atas papan, kartu QR diganti ucapan terima kasih; baris terakhir tetap terbaca.
 *   sorot  baris yang baru muncul atau berubah (total / peringkat / stempel) berpendar jingga lembut dua kali (2,4 dtk) dan
 *          memakai tanda ▲ selama 6 dtk; gerak dikurangi = tanpa pendar, hanya tanda ▲. Perbandingan dengan props sebelumnya
 *          dilakukan di sini (status tampilan murni).
 * Skala: seluruh kanvas memakai satuan --u = 1 % lebar kanvas 16:9 (kanvas = sebesar-besarnya di dalam layar), jadi
 * 1280 x 720 dan 1920 x 1080 sama persis. Baris papan: nama 2,6 u (33 px di 720p, 50 px di 1080p), total 3 u, judul 3,6 u.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PublicRow } from '@shared/investigator/event';
import { SERIES_MAX } from '@shared/investigator/rubric';
import { t, useBahasa } from '../../i18n';
import seniLogo from '../../cerita/seni/investigasi/hub-logo.png';
import seniMiss from '../../cerita/seni/investigasi/hub-miss.png';
import seniKota from '../../cerita/seni/investigasi/acara/kota.png';
import { KodeQr, StempelPapan } from './bagian';
import './acara-inv.css';

export interface ProyektorPapanProps {
  /** Baris publik urut peringkat (paling banyak 10 yang digambar). */
  rows: readonly PublicRow[];
  participants: number;
  /** Kode acara publik (tampil besar) dan tautan yang dijadikan QR (/investigator?acara=KODE). */
  code: string;
  joinUrl: string;
  status: 'open' | 'closed';
}

const MAKS_BARIS = 10;
const tanda = (r: PublicRow) => `${r.rank}|${r.total}|${r.stamps}`;

export function ProyektorPapan({ rows, participants, code, joinUrl, status }: ProyektorPapanProps) {
  useBahasa();
  const tampil = rows.slice(0, MAKS_BARIS);
  // Sorot baris yang berubah: bandingkan dengan gambar sebelumnya (gambar pertama tidak menyorot apa pun).
  const lama = useRef<Map<string, string> | null>(null);
  const [berubah, setBerubah] = useState<ReadonlySet<string>>(new Set());
  const kunci = tampil.map((r) => `${r.alias}=${tanda(r)}`).join(';');
  useEffect(() => {
    const kini = new Map(tampil.map((r) => [r.alias, tanda(r)]));
    const dulu = lama.current;
    lama.current = kini;
    if (!dulu) return;
    const beda = new Set<string>();
    kini.forEach((v, alias) => { if (dulu.get(alias) !== v) beda.add(alias); });
    if (!beda.size) return;
    setBerubah(beda);
    const id = window.setTimeout(() => setBerubah(new Set()), 6000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci]);
  const tutup = status === 'closed';
  return (
    <div className="ai-proyektor" data-papan-investigator={status}>
      <div className="ai-kanvas" style={{ '--ai-kota': `url(${seniKota})` } as CSSProperties}>
        <header className="ai-kepala">
          <img className="ai-logo" src={seniLogo} alt="Raksa Investigator" width={92} height={38} />
          <div className="ai-judul">
            <p>{t('acaraInv.papanSub')}</p>
            <h1>{t('acaraInv.papanJudul')}</h1>
          </div>
          <p className="ai-peserta" data-papan-peserta="">{t('acaraInv.peserta', { n: participants })}</p>
        </header>

        <section className="ai-gabus" aria-label={t('acaraInv.papanJudul')}>
          <i className="ai-paku" data-p="1" aria-hidden="true" /><i className="ai-paku" data-p="2" aria-hidden="true" /><i className="ai-paku" data-p="3" aria-hidden="true" /><i className="ai-paku" data-p="4" aria-hidden="true" />
          {tampil.length ? (
            <ol className="ai-baris-daftar">
              {tampil.map((r) => (
                <li key={r.alias} className="ai-baris" data-peringkat={r.rank <= 3 ? r.rank : undefined} data-berubah={berubah.has(r.alias) ? '' : undefined}
                  aria-label={t('acaraInv.barisAria', { rank: r.rank, alias: r.alias, total: r.total, maks: SERIES_MAX, stempel: r.stamps })}>
                  <span className="ai-baris-rank" aria-hidden="true">{r.rank}</span>
                  <span className="ai-baris-nama" aria-hidden="true">{r.alias}{berubah.has(r.alias) ? <i className="ai-naik">▲</i> : null}</span>
                  <StempelPapan jumlah={r.stamps} />
                  <span className="ai-baris-total" aria-hidden="true"><b>{r.total}</b><small>/{SERIES_MAX}</small></span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="ai-kosong" data-papan-kosong="">
              <h2>{t('acaraInv.kosongJudul')}</h2>
              <p>{t('acaraInv.kosongTeks')}</p>
            </div>
          )}
          {tutup ? <b className="ai-cap-tutup" data-papan-tutup="">{t('acaraInv.tutupCap')}</b> : null}
        </section>

        <aside className="ai-sisi">
          {tutup ? (
            <div className="ai-ikut" data-tutup="">
              <h2>{t('acaraInv.tutupCap')}</h2>
              <p className="ai-ikut-terima">{t('acaraInv.tutupTeks')}</p>
            </div>
          ) : (
            <div className="ai-ikut">
              <h2>{t('acaraInv.ikutJudul')}</h2>
              <p>{t('acaraInv.ikutPindai')}</p>
              <div className="ai-qr"><KodeQr value={joinUrl} label={t('acaraInv.ikutPindai')} /></div>
              <p>{t('acaraInv.ikutKode')}</p>
              <b className="ai-kode" data-papan-kode="">{code}</b>
            </div>
          )}
          <i className="ai-kota" aria-hidden="true" />
          <img className="ai-miss" src={seniMiss} alt="" width={64} height={88} />
        </aside>

        <p className="ai-catatan">{t('acaraInv.catatan')}</p>
      </div>
    </div>
  );
}
