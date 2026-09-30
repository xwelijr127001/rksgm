/**
 * Isi dialog "Catatan kasus": yang sudah diketahui (butir `catatan` yang tercatat), hasil aktivitas, kartu polis,
 * dan hal yang sudah dipahami nasabah. Hanya membaca state; semua teks dari kunci dalam bahasa aktif.
 *
 * Hasil aktivitas dibaca ulang di luar konteks (juga lewat tangkapan layar), jadi pilihan pemain TIDAK ditulis
 * sebagai fakta kasus: tiap aktivitas diberi status (Tepat / Sebagian / Belum tepat / Diperbaiki), tiap pilihan
 * bertanda ✓ / ✕, jawaban tepat yang terlewat ditulis, dan pilihan yang kemudian diluruskan cerita ditandai
 * "diperbaiki". Kartu polis sudah bisa dibaca ulang sejak aktivitasnya dimulai (lihat aktivitasBerkartu), dan barisnya
 * bisa diperiksa artinya seperti saat aktivitas (KartuPolisPeriksa). Jawaban lama dengan opsi yang sudah dihapus dari
 * misi tetap berlabel kalimat (hasilAktivitas labelOpsi), bukan id.
 */
import type { Bahasa } from '@shared/bahasa';
import { t } from '../../i18n';
import type { Episode, KunciTeks, StateCerita } from '../tipe';
import { TandaProses, selaPembicara } from './bagian';
import { aktivitasBerkartu, artiKartu, ringkasAktivitas, type StatusAktivitas } from './hasilAktivitas';
import { KartuPolisPeriksa } from './KartuPolisPeriksa';

const NILAI_STATUS: Record<StatusAktivitas, 'tepat' | 'sebagian' | 'keliru' | 'dikoreksi'> = {
  tepat: 'tepat', sebagian: 'sebagian', belum: 'keliru', dikoreksi: 'dikoreksi',
};

/** Ikon ✓ / ✕ satu pilihan; katanya untuk pembaca layar (status tidak hanya lewat bentuk/warna). */
function TandaPilihan({ tepat }: { tepat: boolean }) {
  return (
    <>
      <span className={'cer-catatan-tanda ' + (tepat ? 'cer-catatan-tanda-tepat' : 'cer-catatan-tanda-salah')} aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" focusable="false">
          {tepat
            ? <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
            : <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />}
        </svg>
      </span>
      <span className="sr-only">{t(tepat ? 'cerita.proses.tepat' : 'cerita.proses.keliru')}{selaPembicara()}</span>
    </>
  );
}

export function IsiCatatanKasus({ ep, state, bahasa, tx }: {
  ep: Episode;
  state: StateCerita;
  bahasa: Bahasa;
  tx: (k: KunciTeks) => string;
}) {
  const nasabah = ep.pemeran[ep.nasabah];
  const namaNasabah = nasabah ? tx(nasabah.nama) : '';
  const catatan = Object.keys(ep.catatan).filter((id) => state.catatan.includes(id));
  const aktivitas = ringkasAktivitas(ep, state, bahasa, tx);
  const kartu = aktivitasBerkartu(ep, state, bahasa).flatMap((id) => {
    const def = ep.aktivitas[id]!;
    return (def.misi(bahasa).policyCards ?? []).map((card) => ({ card, arti: artiKartu(def, card.id, tx) }));
  });
  const paham = Object.keys(ep.paham).filter((id) => state.paham.includes(id));

  return (
    <div className="cer-catatan">
      <p className="cer-catatan-ket">{t('cerita.catatanKet')}</p>
      <section>
        <h4>{t('cerita.catatanDiketahui')}</h4>
        {catatan.length ? (
          <ul className="cer-catatan-daftar">{catatan.map((id) => <li key={id}>{tx(ep.catatan[id]!)}</li>)}</ul>
        ) : <p className="cer-catatan-kosong">{t('cerita.catatanBelum')}</p>}
      </section>
      <section>
        <h4>{t('cerita.catatanAktivitas')}</h4>
        {aktivitas.length ? aktivitas.map((a) => (
          <div key={a.id} className="cer-catatan-akt" data-status={a.status}>
            <p className="cer-catatan-akt-kepala">
              <b>{t('cerita.riwayatAktivitas', { judul: a.judul })}</b>
              <TandaProses
                nilai={NILAI_STATUS[a.status]}
                kata={a.status === 'dikoreksi' ? t('cerita.proses.dikoreksi') : t(`cerita.hasil.${a.status}`)}
              />
            </p>
            {a.pilihan.length ? (
              <>
                <p className="cer-catatan-sub">{t(a.status === 'dikoreksi' ? 'cerita.catatanPilihanAwal' : 'cerita.catatanPilihanmu')}</p>
                <ul className="cer-catatan-pilihan">
                  {a.pilihan.map((p, i) => (
                    <li key={i} data-tanda={p.tanda}><TandaPilihan tepat={p.tanda === 'tepat'} /><span>{p.teks}</span></li>
                  ))}
                </ul>
              </>
            ) : null}
            {a.terlewat.length ? (
              <>
                <p className="cer-catatan-sub">{t('cerita.catatanYangTepat')}</p>
                <ul className="cer-catatan-pilihan">
                  {a.terlewat.map((teks, i) => <li key={i} data-tanda="terlewat"><TandaPilihan tepat /><span>{teks}</span></li>)}
                </ul>
              </>
            ) : null}
            {a.status === 'dikoreksi' ? <p className="cer-catatan-ralat">{t('cerita.catatanDiralat')}</p> : null}
          </div>
        )) : <p className="cer-catatan-kosong">{t('cerita.catatanBelum')}</p>}
      </section>
      {kartu.length ? (
        <section>
          <h4>{t('cerita.catatanPolis')}</h4>
          {kartu.map((k) => <KartuPolisPeriksa key={k.card.id} card={k.card} arti={k.arti} />)}
        </section>
      ) : null}
      <section>
        <h4>{t('cerita.catatanPaham', { nama: namaNasabah })}</h4>
        {paham.length ? (
          <ul className="cer-catatan-daftar">{paham.map((id) => <li key={id}>{tx(ep.paham[id]!)}</li>)}</ul>
        ) : <p className="cer-catatan-kosong">{t('cerita.catatanBelum')}</p>}
      </section>
    </div>
  );
}
