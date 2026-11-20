/**
 * T-052 / T-072: kartu petugas piksel "Petugas Klaim Raksa" (kenang-kenangan untuk ditangkap layar).
 * T-072 (pemilik: "lebih lucu, rapikan, pasang juga di Episode 1 lengkap"): kartu ID berlanyard sungguhan, 300 px:
 *   tali jingga + jepit logam di atas; kartu bertepi tinta 3 px dengan bayangan lembut; pita jingga (burung hantu Raksa, "RAKSA",
 *   nomor ID "RKS-0000" dari hash stabil nama + tanggal); foto berbingkai berisi potret piksel pemain 64 px (4x kisi 16) dengan
 *   kilau bintang; nama besar SATU baris (elipsis); jabatan "Petugas Klaim" satu baris (tidak pernah patah di tengah kata); tanggal
 *   cap hasil (judul akhir, warna status); kaki merah muda "Lulus pelatihan Raksa" + tanggal hari ini. Tanpa animasi.
 * Varian:
 *   penuh  kartu utuh (akhir Episode 1 Dev; lembar bawah akhir Episode 1 lengkap). `ubahNama` = nama di kartu adalah kolom isian
 *          (Episode 1 Dev: ketuk nama, ketik; kosong = Tamu).
 *   mini   84 x 56 di baris kepala akhir satu layar (T-024: tinggi kepala tetap): tombol yang membuka kartu utuh di lembar bawah.
 * Tanpa profil (bukan pemutar HP) = tidak digambar.
 * T-077 (Episode 1 Investigator, opt-in, kartu lain tidak berubah): `investigasi={{ stempel, pangkat }}` mengganti jabatan dengan
 * pangkat investigator + lencana pangkat piksel 24 px, dan teks kaki dengan BARIS STEMPEL kasus (4 slot, terisi = jumlah stempel).
 * `look` = karakter dikirim langsung (layar hasil investigasi), menimpa konteks pemutar HP.
 */
import { useMemo } from 'react';
import type { PlayerLook } from '@shared/types';
import { AvatarPiksel } from '../../art/AvatarPiksel';
import { t, useBahasa } from '../../i18n';
import { useLookPemain } from '../hp/lookPemain';
import ikonInvUrl from '../seni/investigasi/ikon.png';
import pangkatUrl from '../seni/investigasi/pangkat.png';
import './akhir.css';

/** T-077: pangkat investigator (sel lencana di seni/investigasi/pangkat.png) dan jumlah slot stempel kasus. */
const SEL_PANGKAT = { muda: 0, investigator: 1, senior: 2, kepala: 3 } as const;
const SLOT_STEMPEL = 4;
export type KartuInvestigasi = { stempel: string[]; pangkat: keyof typeof SEL_PANGKAT; /** T-078: stempel terakhir baru saja didapat (dicap dengan animasi). */ baru?: boolean };

/** Tanda burung hantu Raksa 10 x 10 sel (cokelat logo #73502F, mata krem, paruh jingga). */
const BURUNG = [
  '.b......b.',
  '.bbbbbbbb.',
  'bwwbbbbwwb',
  'bwkbbbbkwb',
  'bwwbbbbwwb',
  '.bbbbobbb.',
  '.bpppppbb.',
  '.bpppppbb.',
  '..bbbbbb..',
  '..o....o..',
];
const WARNA: Record<string, string> = { b: '#73502F', w: '#FFF1E2', k: '#212121', o: '#FF9000', p: '#F6D25C' };
const RECT_BURUNG = BURUNG.flatMap((r, y) => {
  const out: string[] = [];
  let x = 0;
  while (x < r.length) { const c = r[x]!; if (c === '.') { x++; continue; } let e = x + 1; while (e < r.length && r[e] === c) e++; out.push(`<rect x="${x}" y="${y}" width="${e - x}" height="1" fill="${WARNA[c]}"/>`); x = e; }
  return out;
}).join('');
const Burung = ({ ukuran }: { ukuran: number }) => (
  <svg width={ukuran} height={ukuran} viewBox="0 0 10 10" shapeRendering="crispEdges" focusable="false" aria-hidden="true" dangerouslySetInnerHTML={{ __html: RECT_BURUNG }} />
);
/** Kilau bintang piksel 7 x 7. */
const Kilau = ({ className }: { className: string }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 7 7" shapeRendering="crispEdges" focusable="false" aria-hidden="true">
    <rect x="3" y="0" width="1" height="7" fill="#FF9000" /><rect x="0" y="3" width="7" height="1" fill="#FF9000" /><rect x="2" y="2" width="3" height="3" fill="#F6D25C" />
  </svg>
);

/** Nomor ID stabil: "RKS-" + 4 angka dari FNV-1a (nama + tanggal). */
export function nomorPetugas(nama: string, tanggal: string): string {
  let h = 0x811c9dc5;
  for (const ch of `${nama.trim().toLowerCase()}|${tanggal}`) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 0x01000193) >>> 0; }
  return `RKS-${String(h % 10000).padStart(4, '0')}`;
}

export type CapKartu = { teks: string; nada: 'baik' | 'campuran' | 'buruk' };
export type UbahNamaKartu = { id: string; nilai: string; label: string; placeholder: string; onUbah: (nilai: string) => void };

export function KartuPetugas({ nama, cap, ubahNama, varian = 'penuh', onBuka, look: lookProp, investigasi }: {
  nama: string;
  /** Cap hasil (judul akhir + nada) di kaki kartu. */
  cap?: CapKartu;
  /** Episode 1 Dev: nama di kartu = kolom isian. */
  ubahNama?: UbahNamaKartu;
  varian?: 'penuh' | 'mini';
  /** Varian mini: buka kartu utuh (lembar bawah). */
  onBuka?: (pemicu: HTMLElement) => void;
  /** T-077: karakter dikirim langsung (menimpa konteks pemutar HP). */
  look?: PlayerLook;
  /** T-077: kartu investigator: pangkat + baris stempel kasus. */
  investigasi?: KartuInvestigasi;
}) {
  const lookKonteks = useLookPemain();
  const look = lookProp ?? lookKonteks;
  const { bahasa } = useBahasa();
  const hari = new Date();
  const kunciHari = `${hari.getFullYear()}-${hari.getMonth() + 1}-${hari.getDate()}`;
  const tanggal = useMemo(() => {
    const lokal = bahasa === 'zh' ? 'zh-CN' : bahasa === 'en' ? 'en-GB' : 'id-ID';
    return new Intl.DateTimeFormat(lokal, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bahasa, kunciHari]);
  if (!look) return null;

  if (varian === 'mini') {
    return (
      <button type="button" className="kp-mini" data-kartu-petugas="mini" aria-haspopup="dialog" aria-label={t('ceritaAkhir.kartuBuka', { nama })}
        onClick={(e) => onBuka?.(e.currentTarget)}>
        <span className="kp-mini-pita" aria-hidden="true"><Burung ukuran={10} />RAKSA</span>
        <span className="kp-mini-isi" aria-hidden="true">
          <AvatarPiksel look={look} ukuran={32} />
          <span className="kp-mini-lagi">›</span>
        </span>
      </button>
    );
  }

  const nomor = nomorPetugas(nama, kunciHari);
  return (
    <figure className="kp" data-kartu-petugas="" data-investigasi={investigasi ? investigasi.pangkat : undefined}
      aria-label={investigasi ? t('investigasi.kartu', { nama, pangkat: t(`investigasi.pangkat.${investigasi.pangkat}`), n: Math.min(SLOT_STEMPEL, investigasi.stempel.length), total: SLOT_STEMPEL }) : t('ceritaAkhir.kartuPetugas', { nama })}>
      {/* tali lanyard + jepit logam */}
      <span className="kp-tali" aria-hidden="true"><i /></span>
      <div className="kp-kartu">
        <div className="kp-pita">
          <span className="kp-merek" aria-hidden="true"><Burung ukuran={20} />RAKSA</span>
          <span className="kp-nomor">{nomor}</span>
        </div>
        <div className="kp-badan">
          <span className="kp-foto" aria-hidden="true">
            <AvatarPiksel look={look} ukuran={64} />
            <Kilau className="kp-kilau kp-kilau-1" />
            <Kilau className="kp-kilau kp-kilau-2" />
          </span>
          <div className="kp-teks">
            {ubahNama ? (
              <label className="kp-nama kp-nama-isi">
                <span className="sr-only">{ubahNama.label}</span>
                <input id={ubahNama.id} type="text" maxLength={24} autoComplete="nickname" enterKeyHint="done" value={ubahNama.nilai}
                  placeholder={ubahNama.placeholder} onChange={(e) => ubahNama.onUbah(e.currentTarget.value)} />
                <span className="kp-pena" aria-hidden="true">✎</span>
              </label>
            ) : <b className="kp-nama">{nama}</b>}
            {investigasi ? (
              <span className="kp-jabatan kp-pangkat">
                <i aria-hidden="true" style={{ backgroundImage: `url(${pangkatUrl})`, backgroundPosition: `${-SEL_PANGKAT[investigasi.pangkat] * 24}px 0` }} />
                {t(`investigasi.pangkat.${investigasi.pangkat}`)}
              </span>
            ) : <span className="kp-jabatan">{t('ceritaAkhir.petugasKlaim')}</span>}
            {cap ? <span className="kp-cap" data-nada={cap.nada}>{cap.teks}</span> : null}
          </div>
        </div>
        <div className="kp-kaki">
          {investigasi ? (
            <span className="kp-stempel" aria-hidden="true">
              {Array.from({ length: SLOT_STEMPEL }, (_, i) => (
                <i key={i} data-isi={i < investigasi.stempel.length ? '' : undefined} data-baru={investigasi.baru && i === Math.min(SLOT_STEMPEL, investigasi.stempel.length) - 1 ? '' : undefined} style={{ backgroundImage: `url(${ikonInvUrl})`, backgroundPosition: `${i < investigasi.stempel.length ? -112 : -128}px 0` }} />
              ))}
            </span>
          ) : <span className="kp-lulus"><Kilau className="kp-kilau-kaki" />{t('ceritaAkhir.kartuLulus')}</span>}
          <span className="kp-tanggal">{tanggal}</span>
        </div>
      </div>
    </figure>
  );
}
