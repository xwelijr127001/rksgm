/**
 * MEJA HASIL (PROTOTIPE K11, D-68): node akibat aktivitas bermeja sesudah konfirmasi. Dunia merespons dulu (adegan meja
 * mode hasil: map ke tempat akhirnya, status pengajuan berubah, kabar terkirim / belum), lalu akibat konkret per sisi
 * (Berkas, lalu Kabar: pesan terkirim + balasan nasabah bila ada), lalu "Kenapa" & perubahan status satu baris.
 *
 * Semua dibaca dari state mesin (keputusan tersimpan + baris node akibat), bukan dari draf: muat ulang = tampilan sama,
 * tidak ada pengiriman ulang. Saat dipasang, baris node akibat yang belum tampil dimajukan sekaligus (riwayat sama
 * dengan alur biasa); "Lanjut cerita" = aksi lanjut mesin seperti biasa.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Bahasa } from '@shared/bahasa';
import { t } from '../../../i18n';
import { barisTerlihat } from '../../mesin';
import type { Baris, Episode, KunciTeks, StateCerita } from '../../tipe';
import type { StatusSesudah } from '../AdeganTatap';
import { CatatanStatus, PotretHp, TombolLanjut } from '../bagianHp';
import { bacaTampilan } from '../arena/Arena';
import { akibatMeja, kabarTanpaPesan, statusBerkas } from './logika';
import type { PandangMeja } from './MejaScene';
import { kataMeja, kelengkapanMeja, useGerak } from './MejaKasus';
import { PanggungMeja, type StatusPanggung } from './PanggungMeja';
import './meja.css';

type Tx = (k: KunciTeks, param?: Record<string, string | number>) => string;

export default function MejaAkibat({ ep, state, bahasa, tx, statusSesudah, majukanSemua, onLanjut }: {
  ep: Episode;
  state: StateCerita;
  bahasa: Bahasa;
  tx: Tx;
  statusSesudah: StatusSesudah | null;
  /** Majukan mesin sampai semua baris node akibat tampil (tanpa pindah node). */
  majukanSemua: () => void;
  onLanjut: () => void;
}) {
  const a = akibatMeja(ep, state)!;
  useLayoutEffect(() => { majukanSemua(); }, [state.node, state.baris, majukanSemua]);

  const def = ep.aktivitas[a.aktivitas]!;
  const meja = a.konfig.meja!;
  const misi = useMemo(() => def.misi(bahasa), [def, bahasa]);
  const nasabah = tx(ep.pemeran[ep.nasabah ?? '']?.nama ?? '');
  const jawaban = state.aktivitas[a.aktivitas]?.jawaban ?? {};
  const pesan = def.pesanObrolan?.(jawaban, tx) ?? null;
  const kirim = !kabarTanpaPesan(a.konfig, a.kabar);
  const { baris: tabel, ada } = kelengkapanMeja(a.konfig, misi, tx);
  const gerak = useGerak();
  const [mesin, setMesin] = useState<StatusPanggung>('muat');
  const [daftar] = useState(() => bacaTampilan() === 'daftar');

  const kata = useMemo(() => kataMeja(a.konfig, ep, tx, { n: ada.filter(Boolean).length, total: tabel.length }, tx(meja.tindakan[a.tindakan]!.status)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a.konfig, a.tindakan, ep, tx, tabel.length]);
  const pandang: PandangMeja = useMemo(() => ({
    fokus: 'meja', angkat: false, tempat: meja.tindakan[a.tindakan]!.tempat, kabar: null,
    berkas: statusBerkas(a.konfig, { diperiksa: [] }, ada), sorot: [], aktif: null, hasil: { akhir: a.akhir, kirim }, gerak, kata,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [a.akhir, a.tindakan, kirim, gerak, kata]);

  // Layar baru: fokus ke judul hasil (panel konfirmasi yang baru ditutup mengembalikan fokus ke halaman yang sudah
  // berganti), tanpa menggulir.
  const judulRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => judulRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  const tampil = barisTerlihat(ep, state).slice(0, state.baris);
  const sisi = (topik: string) => tampil.filter((b) => b.topik === topik);
  const berkas = sisi('topik.berkas');
  const kabar = sisi('topik.kabar');
  const balasan = tampil.filter((b) => b.siapa === ep.nasabah);
  const lain = tampil.filter((b) => !b.topik && b.siapa !== ep.nasabah);

  return (
    <div className="hp-arena meja meja-hasil-layar" data-pola="meja" data-hasil={a.akhir}>
      <header className="meja-kepala">
        <h2 className="meja-judul"><span className="hp-arena-tugas">{t('ceritaHp.mejaHasil')}</span> {misi.title}</h2>
      </header>
      {!daftar && mesin !== 'gagal' ? (
        <PanggungMeja ep={ep} seniBerkas={{}} pandang={pandang} onKetuk={() => {}} onStatus={setMesin} />
      ) : (
        <p className="meja-status-teks"><b>{t('ceritaHp.mejaStatusJudul')}:</b> {kata.status}</p>
      )}

      <section className="meja-hasil" aria-labelledby="meja-hasil-judul">
        <h3 id="meja-hasil-judul" ref={judulRef} tabIndex={-1} data-hp-fokus="">{t('ceritaHp.mejaYangTerjadi')}</h3>
        {berkas.length ? (
          <div className="meja-akibat" data-topik="berkas">
            <p className="meja-akibat-topik">{tx('topik.berkas')}</p>
            {berkas.map((b, i) => <p key={i}>{tx(b.teks)}</p>)}
          </div>
        ) : null}
        <div className="meja-akibat" data-topik="kabar">
          <p className="meja-akibat-topik">{tx('topik.kabar')}</p>
          {pesan ? (
            <p className="meja-pesan" data-terkirim="">
              <span className="meja-pesan-label">{t('ceritaHp.mejaPesanmu')} · {t('ceritaHp.mejaTerkirim')}</span>
              <q>{pesan}</q>
            </p>
          ) : null}
          {balasan.map((b, i) => <Balasan key={i} ep={ep} b={b} nama={nasabah} tx={tx} />)}
          {kabar.map((b, i) => <p key={i}>{tx(b.teks)}</p>)}
        </div>
        {lain.map((b, i) => <p key={i} className="meja-akibat-lain">{tx(b.teks)}</p>)}
        {statusSesudah ? (
          <div className="hp-status-catatan" data-arah={statusSesudah.arah}>
            <CatatanStatus nama={nasabah} {...statusSesudah} />
          </div>
        ) : null}
      </section>
      <div className="meja-bar meja-bar-hasil">
        <TombolLanjut label={t('ceritaHp.mejaLanjutCerita')} onKlik={onLanjut} />
      </div>
    </div>
  );
}

function Balasan({ ep, b, nama, tx }: { ep: Episode; b: Baris; nama: string; tx: Tx }) {
  return (
    <figure className="meja-balas">
      <PotretHp ep={ep} id={b.siapa} ekspresi={b.ekspresi} nama={nama} />
      <figcaption><b>{nama}</b><q>{tx(b.teks)}</q></figcaption>
    </figure>
  );
}
