import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { MISSIONS } from '@shared/missions';
import { ALL_BADGES, clamp, computeBadges } from '@shared/scoring';
import type { Badge, RoundResult } from '@shared/types';
import { Avatar } from '../art/Avatar';
import { Icon } from '../art/Icon';
import { forceMusic, playSfx, setTrack } from '../audio/audio';
import { PlayerShell, Arrow } from '../components/PlayerShell';
import { KarakterTokoh } from '../game/KarakterTokoh';
import { useReducedMotion } from '../hooks';
import { bahasaKini, misiDalamBahasa, t, useBahasa } from '../i18n';
import { rekorLalu, totalPoin, ulangSolo, useProfil, type ProgresSolo } from '../state/profil';
import { savedLook } from '../state/store';
import { Confetti } from '../ui/kit';
import { BarisBintang, SatuBintang, TOTAL_BINTANG, TOTAL_MISI, angka, bintangMisi, jumlahBintang, jumlahDicoba } from './soloBagian';
import './solo.css';

/**
 * Progres solo -> bentuk RoundResult supaya lencana dihitung dengan aturan yang SAMA dengan
 * pertandingan (computeBadges). Misi yang belum dicoba = ronde tanpa jawaban. Progres hanya
 * menyimpan akurasi & poin TERBAIK, jadi waktu menjawab diturunkan dari bonus cepatnya
 * (bonus = 300 x akurasi x sisa waktu). Bila poin terbaik berasal dari percobaan yang kurang tepat,
 * turunan ini memperkirakan waktu lebih lambat dari sebenarnya: "Respons Kilat" jadi sedikit lebih
 * sulit, tidak pernah lebih mudah.
 */
function rondeDariProgres(p: ProgresSolo): RoundResult[] {
  return MISSIONS.map((m, i) => {
    const c = p.misi[m.id];
    const durasiMs = m.durationSeconds * 1000;
    if (!c) return { roundIndex: i, answered: false, accuracy: 0, basePoints: 0, speedBonus: 0, roundScore: 0, elapsedMs: durasiMs };
    const mentah = clamp(Number(c.akurasi) || 0, 0, 1);
    const akurasi = mentah >= 0.999 ? 1 : mentah;
    const poin = Math.max(0, Number(c.poin) || 0);
    const dasar = Math.round(1000 * akurasi);
    const bonus = clamp(poin - dasar, 0, Math.round(300 * akurasi));
    const rasio = akurasi > 0 ? clamp(1 - bonus / (300 * akurasi), 0, 1) : 1;
    return { roundIndex: i, answered: true, accuracy: akurasi, basePoints: dasar, speedBonus: bonus, roundScore: poin, elapsedMs: Math.round(rasio * durasiMs) };
  });
}

/** Lencana yang bisa diraih sendirian: semua kecuali "juara" (peringkat 1 butuh lawan). */
const LENCANA_SOLO = ALL_BADGES.filter((b) => b.id !== 'juara');

/** Nama/keterangan lencana dalam bahasa aktif (kamus pemain.lencana.<id>.*), sama dengan hasil pertandingan. */
function teksLencana(b: Badge, bagian: 'nama' | 'ket'): string {
  const asli = bagian === 'nama' ? b.label : b.desc;
  if (bahasaKini() === 'id') return asli;
  const kunci = `pemain.lencana.${b.id}.${bagian}`;
  const teks = t(kunci);
  return teks === kunci ? asli : teks;
}

function KartuLencana({ b, terbuka }: { b: Badge; terbuka: boolean }) {
  return <li className={'solo-lencana' + (terbuka ? ' solo-lencana-terbuka' : '')}>
    <span className="solo-lencana-ikon" aria-hidden="true"><Icon name={b.icon} size={24} /></span>
    <span className="solo-lencana-teks"><b>{teksLencana(b, 'nama')}</b><small>{teksLencana(b, 'ket')}</small></span>
    <span className="solo-lencana-status">{terbuka ? <Icon name="cek" size={16} /> : null}{terbuka ? t('solo.lencanaTerbuka') : t('solo.lencanaBelum')}</span>
  </li>;
}

/**
 * HASIL AKHIR mode solo: karakter pemain, total poin, bintang dari 30, lencana, rekor pribadi di
 * perangkat ini, dan sapaan Mr Roger. Satu tombol utama: "Main lagi" (atau kembali ke peta bila
 * masih ada misi yang belum dicoba).
 */
export default function SoloHasil() {
  const { bahasa } = useBahasa();
  const { profil, progres } = useProfil();
  const reduced = useReducedMotion();
  const [rayakan, setRayakan] = useState(false);
  const [look] = useState(() => profil?.look ?? savedLook());
  // Rekor yang harus dipecahkan dibaca sekali: "Main lagi" di layar ini mengubahnya.
  const [lalu] = useState(rekorLalu);
  const dicoba = jumlahDicoba(progres);

  useEffect(() => { forceMusic(true); setTrack('podium'); return () => { setTrack(null); forceMusic(false); }; }, []);
  useEffect(() => {
    if (dicoba === 0) return;
    playSfx('confetti');
    if (reduced) return;
    setRayakan(true);
    const id = window.setTimeout(() => setRayakan(false), 3500);
    return () => window.clearTimeout(id);
    // hanya saat layar dibuka
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const lencana = useMemo(() => computeBadges(rondeDariProgres(progres), 0, MISSIONS), [progres]);
  const daftarMisi = useMemo(() => MISSIONS.map((m) => misiDalamBahasa(m, bahasa)), [bahasa]);

  if (dicoba === 0) return <Navigate to="/solo" replace />;

  const total = totalPoin(progres);
  const bintang = jumlahBintang(progres);
  const lengkap = dicoba >= TOTAL_MISI;
  // "Rekor baru!" hanya bila ada rekor lama yang benar-benar dilampaui putaran ini.
  const rekorBaru = lalu > 0 && total > lalu && total >= progres.rekor;
  const terkunci = LENCANA_SOLO.filter((b) => !lencana.some((l) => l.id === b.id));
  const sapaan = bintang >= TOTAL_BINTANG ? t('solo.ceo.sempurna') : lengkap ? t('solo.ceo.lengkap') : t('solo.ceo.sebagian');

  // Progres kosong -> penjaga `dicoba === 0` di atas langsung mengalihkan ke /solo (replace),
  // jadi tombol kembali di peta tidak membawa pemain ke layar hasil yang sudah kosong.
  function mainLagi() {
    ulangSolo();
  }

  return <PlayerShell back="/solo" label={t('solo.labelHasil')} className="solo-layar">
    {rayakan ? <Confetti jumlah={36} /> : null}
    <main className="solo-hasil">
      <section className="solo-hasil-diri">
        <div className="solo-avatar solo-avatar-besar"><Avatar look={look} size={120} mood="senang" /></div>
        <span className="eyebrow">{t('solo.eyebrowHasil', { n: dicoba, total: TOTAL_MISI })}</span>
        <h1>{profil ? t('solo.hebat', { nama: profil.nickname }) : t('solo.hebatTanpaNama')}</h1>
        <dl className="solo-hasil-angka">
          <div><dt>{t('solo.totalPoin')}</dt><dd>{angka(total)}</dd></div>
          <div><dt>{t('solo.bintangDari', { total: TOTAL_BINTANG })}</dt><dd><SatuBintang ukuran={26} />{bintang}</dd></div>
        </dl>
        <div className="solo-rekor" data-baru={rekorBaru || undefined}>
          {rekorBaru ? <strong className="solo-rekor-baru"><Icon name="medali" size={20} /> {t('solo.rekorBaru')}</strong> : null}
          <p>{t('solo.rekorPerangkat', { n: angka(progres.rekor) })}</p>
          {rekorBaru ? <p className="solo-rekor-kecil">{t('solo.rekorLama', { n: angka(lalu) })}</p>
            : lalu > total ? <p className="solo-rekor-kecil">{t('solo.rekorKurang', { n: angka(lalu - total + 1) })}</p> : null}
        </div>
        <div className="solo-hasil-aksi">
          {lengkap
            ? <button type="button" className="primary-action" onClick={mainLagi}>{t('solo.mainLagi')} <Arrow /></button>
            : <Link className="primary-action" to="/solo">{t('solo.kePeta')} <Arrow /></Link>}
          <p className="solo-hasil-ket">{lengkap ? t('solo.mainLagiKet') : t('solo.belumSemua', { n: TOTAL_MISI - dicoba })}</p>
          <Link className="quiet-link" to="/join">{t('solo.punyaKode')} <Arrow /></Link>
        </div>
      </section>

      <section className="solo-hasil-sisi">
        <KarakterTokoh tokoh="ceo" className="solo-ceo" tinggi={120} teks={sapaan} />
        <h2>{t('solo.lencana')}</h2>
        {lencana.length
          ? <ul className="solo-lencana-daftar">{lencana.map((b) => <KartuLencana key={b.id} b={b} terbuka />)}</ul>
          : <p className="solo-lencana-kosong">{t('solo.lencanaKosong')}</p>}
        {terkunci.length ? <details className="simple-details">
          <summary>{t('solo.lencanaLain', { n: terkunci.length })}</summary>
          <ul className="solo-lencana-daftar">{terkunci.map((b) => <KartuLencana key={b.id} b={b} terbuka={false} />)}</ul>
        </details> : null}
        <details className="simple-details">
          <summary>{t('solo.rincianMisi')}</summary>
          <ol className="solo-rincian">
            {daftarMisi.map((m) => {
              const c = progres.misi[m.id];
              return <li key={m.id}>
                <span className="solo-rincian-no" aria-hidden="true">{m.number}</span>
                <span className="solo-rincian-judul"><span className="sr-only">{t('solo.misiKe', { n: m.number })} </span>{m.title}</span>
                <BarisBintang n={bintangMisi(progres, m.id)} ukuran={16} />
                <small>{c ? t('pemain.nPoin', { n: angka(c.poin) }) : t('solo.belumDicoba')}</small>
              </li>;
            })}
          </ol>
        </details>
      </section>
    </main>
  </PlayerShell>;
}
