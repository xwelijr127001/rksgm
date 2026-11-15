/**
 * RINGKAS RAMBU (K08, di adegan akibat) — komposisi prototipe Claude Design (14 Nov 2026): SATU diagram jalan (bukti utama, statis,
 * truk berlabel keterangan supir), lalu SATU tanggapan utama Pak Bima (potret kecil) yang mudah ditemukan; tanggapan lain dapat dibuka
 * lewat "Lihat penjelasan". Ilustrasi lokasi besar tidak ditampilkan di atasnya (AdeganTatap: tanpaPanggung).
 * Membaca jawaban tersimpan di state, jadi tetap benar setelah muat ulang dan saat bab diulang. Hanya perbandingan, tanpa penilaian.
 */
import type { MissionAnswer } from '@shared/types';
import { t } from '../../../i18n';
import { Adegan } from '../../lokasi/Adegan';
import { IkonCentang, IkonUlang } from '../../lokasi/seni/Aset';
import '../../lokasi/lokasi.css';
import type { Episode, KunciTeks } from '../../tipe';
import { PotretHp } from '../bagianHp';
import { lajurDitandai, tanggapan, type ArenaRambu } from './rambu';

export function RingkasRambu({ ep, konfig, jawaban, tx }: { ep: Episode; konfig: ArenaRambu; jawaban: MissionAnswer; tx: (k: KunciTeks, p?: Record<string, string | number>) => string }) {
  const kartu = tanggapan(konfig, jawaban);
  // Tanggapan utama: pertentangan sikap dulu (paling penting bagi kesimpulan), lalu beda tulisan, lalu "sama".
  const urut = [...kartu].sort((a, b) => ({ sikap: 0, tulisan: 1, sama: 2 })[a.jenis] - ({ sikap: 0, tulisan: 1, sama: 2 })[b.jenis]);
  const utama = urut[0];
  const lain = urut.slice(1);
  const nama = tx(ep.pemeran.bima?.nama ?? 'bima');
  return (
    <div className="hp-rambu-ringkas lk lk-tertanam" data-rambu-ringkas="">
      <Adegan tanda1={lajurDitandai(konfig, jawaban, 0)} tanda2={lajurDitandai(konfig, jawaban, 1)} statis cincinTruk />
      {utama ? (
        <div className="lk-tanggapan" role="group" aria-label={tx('arena.rambu.tanggapGrup')}>
          <div className={`lk-umpan lk-umpan-utama ${utama.jenis === 'sama' ? 'lk-umpan-sama' : 'lk-umpan-beda'}`} data-tanggapan={utama.jenis}>
            {ep.pemeran.bima ? <PotretHp ep={ep} id="bima" nama={nama} /> : null}
            <div className="lk-umpan-isi">
              <p className="lk-umpan-nama"><b>{nama}</b>{utama.jenis === 'sama' ? <IkonCentang /> : <IkonUlang />}</p>
              <p>{tx(utama.teks, utama.param)}</p>
            </div>
          </div>
          {lain.length ? (
            <details className="hp-tahu lk-penjelasan">
              <summary>{t('ceritaHp.lihatPenjelasan')}</summary>
              {lain.map((x) => (
                <div key={x.jenis} className={`lk-umpan ${x.jenis === 'sama' ? 'lk-umpan-sama' : 'lk-umpan-beda'}`} data-tanggapan={x.jenis}>
                  {x.jenis === 'sama' ? <IkonCentang /> : <IkonUlang />}
                  <div className="lk-umpan-isi"><p>{tx(x.teks, x.param)}</p></div>
                </div>
              ))}
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
