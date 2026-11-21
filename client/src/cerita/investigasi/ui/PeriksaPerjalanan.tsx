/**
 * T-091 (Designer): PERIKSA PERJALANAN (Investigator kasus 2 "Malam di Jalan Melati"; menggantikan layar sementara T-090).
 * Satu-satunya penyelidikan kasus ini: Pak Yusuf memperlihatkan SATU struk perjalanan di HP-nya (nama dan alamat penumpang
 * ditutup mosaik); di sebelahnya formulir kejadian. Empat langkah pendek, ketuk saja:
 *   1 ketuk HP            struk terbuka: garis waktu perjalanan 21:05 penumpang dijemput ... 21:24 perjalanan ditutup di aplikasi;
 *   2 ketuk formulir      formulir terbuka: "Jam benturan: 21:18" menyala;
 *   3 ketuk tempatnya     keping "21:18" menunjuk ke garis waktu; tiga tempat (sebelum / di antara / sesudah). Tempat keliru =
 *                         tempat itu bergeleng dan kalimat petunjuk muncul; tamu mencoba lagi, tidak pernah terhenti. Tempat
 *                         yang tepat: baris "21:18 · benturan" meluncur masuk di antara dua perhentian dan menyala;
 *   4 ketuk tanggal/pelat tanggal dan pelat nomor di struk dan di formulir dilingkari hijau: "Tanggal sama · pelat nomor sama".
 * Lalu "Simpan hasil pemeriksaan" -> onSelesai (cerita lanjut ke kartu bukti struk).
 *
 * Kontrak (LayarInvestigasi, sama dengan PeriksaSim): `{ onSelesai, awal?, onLangkah? }`; `awal` = langkah untuk memulai sesudah
 * muat ulang (0..3, langkah sebelumnya dianggap selesai), `onLangkah(n)` dipanggil tiap pindah langkah (pemanggil menyimpannya).
 * TEKS: naskah kasus lewat `useTx()` (`inv2.jalan.*`, `inv2.garis.*`; jam dan labelnya milik naskah); kata antarmuka sendiri di
 * kamus `investigasi` (`jalan.*`). Tanggal dan pelat nomor = angka fiktif yang sama di semua bahasa (TANGGAL, PELAT).
 * Aplikasinya FIKTIF: ubin ungu tanpa nama, logo, atau warna merek mana pun.
 * Ukur 360 x 640 (hitung; ruang isi 544): kemajuan 20 + perintah 26..52 + meja 296 + hasil 66 + tombol 56 + jarak 4 x 8 =
 * 496..522 px. HP 182 x 284: bilah 26 + data 72 + garis waktu 180 (5 baris x 36). Gerak dikurangi: tanpa luncur / kedip.
 */
import { useState, type CSSProperties } from 'react';
import { playSfx } from '../../../audio/audio';
import { t } from '../../../i18n';
import klip from '../../seni/investigasi/klip.png';
import sensor from '../../seni/investigasi/sensor.png';
import { IkonInv, useTx } from './dasar';
import './investigasi.css';
import './bukti-adegan.css';
import './kasus2.css';

const JUMLAH = 4;
type Tempat = 'sebelum' | 'tengah' | 'sesudah';
/** Tanggal dan pelat nomor yang sama di struk dan formulir (fiktif; angka saja, jadi sama di id / en / zh). */
const TANGGAL = '14/11/2026';
const PELAT = 'B 1870 RKS';

/** Baris "tanggal + pelat nomor": di langkah 4 = tombol; sesudah dicocokkan berlingkar hijau. */
function BarisCocok({ aktif, cocok, onKetuk }: { aktif: boolean; cocok: boolean; onKetuk: () => void }) {
  const isi = (
    <>
      <span>
        <span className="pj-tanggal"><span className="sr-only">{t('investigasi.jalan.tanggal')} </span>{TANGGAL}</span>
        <span className="pj-pelat"><span className="sr-only">{t('investigasi.jalan.pelat')} </span>{PELAT}</span>
      </span>
      {cocok ? <b aria-hidden="true">✓</b> : null}
    </>
  );
  return aktif
    ? <button type="button" className="pj-cocok" data-cocokkan="" onClick={onKetuk}>{isi}</button>
    : <p className="pj-cocok" data-cocok={cocok ? '' : undefined}>{isi}</p>;
}

export function PeriksaPerjalanan({ onSelesai, awal = 0, onLangkah }: { onSelesai: () => void; awal?: number; onLangkah?: (langkah: number) => void }) {
  const tx = useTx();
  const [langkah, setLangkah] = useState(() => Math.max(0, Math.min(JUMLAH - 1, Math.floor(awal))));
  /** Langkah kini sudah dijawab (hasilnya tampil). */
  const [sudah, setSudah] = useState(false);
  /** Langkah 3: tempat keliru terakhir (petunjuk tampil; boleh mencoba lagi). */
  const [keliru, setKeliru] = useState<Tempat | null>(null);
  const n = langkah + 1;
  const ketuk = (l: number) => { if (langkah !== l || sudah) return; playSfx(l === 3 ? 'konfirmasi' : l === 0 ? 'kertas' : 'ketuk'); setSudah(true); };
  const taruh = (tempat: Tempat) => {
    if (langkah !== 2 || sudah) return;
    if (tempat === 'tengah') { playSfx('konfirmasi'); setKeliru(null); setSudah(true); } else { playSfx('keliru'); setKeliru(tempat); }
  };
  const maju = () => {
    if (!sudah) return;
    if (langkah >= JUMLAH - 1) { onSelesai(); return; }
    setLangkah(langkah + 1); setSudah(false); setKeliru(null);
    onLangkah?.(langkah + 1);
  };
  const strukTerbuka = langkah > 0 || sudah;
  const formTerbuka = langkah > 1 || (langkah === 1 && sudah);
  const memilih = langkah === 2 && !sudah;
  const ditaruh = langkah > 2 || (langkah === 2 && sudah);
  const mencocokkan = langkah === 3 && !sudah;
  const cocok = langkah === 3 && sudah;
  const slot = (tempat: Tempat) => (
    <li key={tempat}>
      {/* `key` berganti tiap ketukan keliru supaya gelengnya diputar lagi */}
      <button key={keliru === tempat ? 'keliru' : 'biasa'} type="button" className="pj-slot" data-tempat={tempat} data-keliru={keliru === tempat ? '' : undefined} onClick={() => taruh(tempat)}>
        {tx(`inv2.jalan.l3.${tempat}`)}
      </button>
    </li>
  );

  return (
    <section className="iv-layar pj" data-periksa-perjalanan="" data-langkah={n} data-sudah={sudah ? '' : undefined} aria-labelledby="pj-tanya">
      <p className="ps-kemajuan">
        <b>{tx('inv2.jalan.judul')}</b>
        <span aria-hidden="true">{Array.from({ length: JUMLAH }, (_, i) => <i key={i} data-isi={i < langkah || (i === langkah && sudah) ? '' : undefined} data-kini={i === langkah ? '' : undefined} />)}</span>
        <span className="sr-only">{t('investigasi.jalan.langkah', { n, total: JUMLAH })}</span>
      </p>
      <h2 id="pj-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tx(`inv2.jalan.l${n}.tanya`)}</h2>
      <div className="pj-meja">
        <div className="pj-isi" style={{ '--pj-sensor': `url(${sensor})`, '--pj-klip': `url(${klip})` } as CSSProperties}>
          {/* HP Pak Yusuf: struk perjalanan */}
          {strukTerbuka ? (
            <div className="pj-hp" data-struk="" data-terbuka="">
              <p className="pj-hp-bar"><IkonInv nama="aplikasi" kali={1} /><b>{tx('inv2.jalan.struk')}</b></p>
              <div className="pj-hp-data">
                <p className="pj-orang" role="img" aria-label={t('investigasi.jalan.disamarkan')}><i /><span className="pj-sensor" style={{ width: 60 }} /><span className="pj-sensor" style={{ width: 84 }} /></p>
                <BarisCocok aktif={mencocokkan} cocok={cocok} onKetuk={() => ketuk(3)} />
              </div>
              <ol className="pj-garis">
                {memilih ? slot('sebelum') : null}
                <li className="pj-titik">{tx('inv2.garis.1')}</li>
                {memilih ? slot('tengah') : null}
                {ditaruh ? <li><span className="pj-kejadian" data-kejadian="" data-baru={langkah === 2 ? '' : undefined}>{tx('inv2.garis.2')}</span></li> : null}
                <li className="pj-titik" data-akhir="">{tx('inv2.garis.3')}</li>
                {memilih ? slot('sesudah') : null}
              </ol>
            </div>
          ) : (
            <button type="button" className="pj-hp" data-struk="" data-tutup="" onClick={() => ketuk(0)}>
              <IkonInv nama="aplikasi" kali={3} />
              <span>{tx('inv2.jalan.struk')}</span>
              <span>{tx('inv2.jalan.tertutup')}</span>
            </button>
          )}
          {/* formulir kejadian */}
          {formTerbuka ? (
            <div className="pj-form" data-formulir="" data-terbuka="">
              <b>{tx('inv2.jalan.form')}</b>
              <BarisCocok aktif={mencocokkan} cocok={cocok} onKetuk={() => ketuk(3)} />
              <p className="pj-jam" data-baru={langkah === 1 ? '' : undefined}>{tx('inv2.jalan.form.jam')}</p>
            </div>
          ) : (
            <button type="button" className="pj-form" data-formulir="" data-tutup="" disabled={langkah !== 1} onClick={() => ketuk(1)}>
              <span>{tx('inv2.jalan.form')}</span>
              {langkah === 1 ? <span>{tx('inv2.jalan.tertutup')}</span> : null}
            </button>
          )}
          {strukTerbuka ? <p className="pj-ket">{tx('inv2.jalan.struk.ket')}</p> : null}
          {memilih ? <span className="pj-keping" role="img" aria-label={t('investigasi.jalan.jam')}>21:18</span> : null}
          {cocok ? <p className="pj-sama">✓ {tx('inv2.jalan.sama')}</p> : null}
        </div>
      </div>
      <p className="ps-hasil" role="status">{sudah ? tx(`inv2.jalan.l${n}.hasil`) : keliru ? tx('inv2.jalan.l3.coba') : ''}</p>
      <button type="button" className="primary-action iv-tombol" data-jalan-lanjut="" disabled={!sudah} onClick={maju}>
        {langkah >= JUMLAH - 1 ? tx('inv2.jalan.selesai') : tx('inv.ui.lanjut')}
      </button>
    </section>
  );
}
