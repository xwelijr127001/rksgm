/**
 * HALAMAN PROTOTIPE /lokasi v3 (hanya build VITE_KEJADIAN=1, bukan fitur pemain): irisan K08 Episode 2 "Rambu di lokasi" dengan
 * arah visual dari ekspor Claude Design (aset di cerita/lokasi/seni, komposisi di cerita/lokasi/Adegan.tsx).
 *
 * Satu adegan jalan, SATU petunjuk pada satu waktu, petunjuk tepat DI ATAS jalan: ketuk rambu 1 -> ketuk lajur -> ketuk rambu 2 ->
 * ketuk lajur -> kesimpulan kepada Pak Bima. Nomor lajur dan truk (posisi menurut supir) terlihat sejak awal. Tanda pemain tidak
 * dinilai saat menandai; Pak Bima kemudian mencocokkannya dengan tulisan rambu dan kesimpulan pemain. Akibat memakai kalimat
 * naskah K08. Tafsir "lajur kiri" (rambu 2) tetap belum pasti. Catatan rinci di balik "Lihat catatan".
 * Isi kasus: cerita/lokasi/logika.ts (kunci naskah). Teks petunjuk dan tanggapan atas tanda adalah teks antarmuka DRAF.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PlayerShell } from '../components/PlayerShell';
import { KEJADIAN } from '../cerita/kejadian/bendera';
import { Adegan } from '../cerita/lokasi/Adegan';
import { ContohArsir, IkonCentang, IkonPeriksa, IkonUlang } from '../cerita/lokasi/seni/Aset';
import {
  KEADAAN_AWAL, LAJUR_TRUK, PILIHAN, RAMBU, bolehLanjut, bukaUlang, cariPilihan, catatanTemuan, ketukRambu, lanjut, rambuAktif, rambuTerbuka,
  selesaiPeriksa, t, tahap, tandai, tandaAktif, tanggapanTanda, teksLajur, type IdPilihan, type IdRambu, type Keadaan,
} from '../cerita/lokasi/logika';
import '../cerita/lokasi/lokasi.css';

type Fase = 'periksa' | 'putus' | 'akibat';

const AVATAR = import.meta.glob('../cerita/seni/auto-2/proto/{bima,hendra-cemas}-avatar-320.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const avatar = (k: 'bima' | 'hendra-cemas') => AVATAR[`../cerita/seni/auto-2/proto/${k}-avatar-320.webp`] ?? '';

const NAMA: Record<IdRambu, string> = { rambu1: 'Rambu 1', rambu2: 'Rambu 2' };

export default function ProtoLokasi() {
  const [fase, setFase] = useState<Fase>('periksa');
  const [k, setK] = useState<Keadaan>(KEADAAN_AWAL);
  const [terpilih, setTerpilih] = useState<IdPilihan | null>(null);
  const [dipilih, setDipilih] = useState<IdPilihan | null>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const bukti = useRef<HTMLElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    judulRef.current?.focus({ preventScroll: true });
  }, [fase]);

  if (!KEJADIAN) return <Navigate to="/cerita" replace />;

  const ulang = () => { setK(KEADAAN_AWAL); setTerpilih(null); setDipilih(null); setFase('periksa'); };
  const lanjutkan = () => {
    const baru = lanjut(k);
    setK(baru);
    if (selesaiPeriksa(baru) && !baru.lihat) setFase('putus');
  };
  const aktif = rambuAktif(k);
  const tahapKini = tahap(k);
  // Rambu lain yang sudah dibuka dan boleh dilihat lagi (rambu yang sedang ditandai tidak ditawarkan lagi).
  const lainnya = rambuTerbuka(k).filter((id) => !(tahapKini === 'tandai' && id === aktif));
  const adaTanda = k.tanda1.length + k.tanda2.length > 0;

  return (
    <PlayerShell label="Prototipe">
      <main className="lk" data-fase={fase}>
        {fase === 'periksa' ? (
          <section className="lk-bagian" aria-labelledby="lk-j">
            <h1 id="lk-j" ref={judulRef} tabIndex={-1} className="lk-judul">Periksa rambu di lokasi</h1>
            <p className="lk-konteks">Truk berada di lajur {LAJUR_TRUK} menurut keterangan supir.</p>

            {tahapKini === 'tandai' ? (
              <section ref={bukti} className="lk-bukti-kartu lk-geser" aria-label={`Bunyi ${NAMA[aktif]}`} aria-live="polite">
                <div className="lk-bukti-kepala">
                  <span className="lk-bukti-ikon" aria-hidden="true"><IkonPeriksa ukuran={20} /></span>
                  <h2 className="lk-bukti-label">{t(RAMBU[aktif].labelKunci)}</h2>
                  <span className="lk-bukti-kicker">Bunyi rambu</span>
                </div>
                <p className="lk-bukti-isi">“{t(RAMBU[aktif].isiKunci)}”</p>
              </section>
            ) : null}

            {tahapKini === 'ketuk' ? (
              <div className="lk-tag-baris">
                <button type="button" className="lk-tag" onClick={() => setK((x) => ketukRambu(x))} aria-label={`Periksa ${NAMA[aktif]}`}>
                  <span className="lk-tag-ikon" aria-hidden="true"><IkonPeriksa ukuran={22} /></span>
                  <span>{NAMA[aktif]}</span>
                </button>
                <p className="lk-instruksi" aria-live="polite">Ketuk rambu untuk memeriksa.</p>
              </div>
            ) : <p className="lk-instruksi" aria-live="polite">{RAMBU[aktif].instruksi}</p>}

            <Adegan tanda1={k.tanda1} tanda2={k.tanda2} bisaTandai={tahapKini === 'tandai'} aktifTanda={tandaAktif(k)} onLajur={(n) => setK((x) => tandai(x, n))} />

            {tahapKini === 'tandai' ? (
              <>
                <Pilihanmu k={k} />
                {adaTanda ? <p className="lk-catatan-tanda"><ContohArsir />Arsiran dan garis ini tandamu sendiri, bukan marka jalan resmi.</p> : null}
                <button type="button" className="lk-btn lk-btn-utama" disabled={!bolehLanjut(k)} onClick={lanjutkan}>
                  {k.lihat ? 'Selesai mengubah' : aktif === 'rambu2' ? 'Lanjut ke Pak Bima' : 'Lanjut ke rambu berikutnya'}
                </button>
                {!bolehLanjut(k) ? <p className="lk-alasan">Tandai setidaknya satu lajur.</p> : null}
              </>
            ) : null}

            {lainnya.length ? (
              <div className="lk-chip-baris" role="group" aria-label="Lihat lagi">
                {lainnya.map((id) => (
                  <button key={id} type="button" className="lk-chip" onClick={() => setK((x) => bukaUlang(x, id))}>Lihat lagi {NAMA[id]}</button>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {fase === 'putus' ? (
          <section className="lk-bagian" aria-labelledby="lk-j">
            <h1 id="lk-j" ref={judulRef} tabIndex={-1} className="lk-judul">Pak Bima bertanya</h1>
            <Adegan tanda1={k.tanda1} tanda2={k.tanda2} statis cincinTruk />
            <Pilihanmu k={k} />
            <div className="lk-orang">
              <img src={avatar('bima')} alt="" width={72} height={72} />
              <p className="lk-gelembung">{t('k08.2')}</p>
            </div>
            <p className="lk-tugas"><b>{t('k08.tanya')}</b></p>
            <ul className="lk-pilihan">
              {PILIHAN.map((p) => (
                <li key={p.id}>
                  <button type="button" className={`lk-opsi${terpilih === p.id ? ' dipilih' : ''}`} aria-pressed={terpilih === p.id} onClick={() => setTerpilih(p.id)}>{t(p.teksKunci)}</button>
                </li>
              ))}
            </ul>
            <button type="button" className="lk-btn lk-btn-utama" disabled={!terpilih} onClick={() => { setDipilih(terpilih); setFase('akibat'); }}>Sampaikan</button>
            {!terpilih ? <p className="lk-alasan">Pilih satu dulu.</p> : null}
            <div className="lk-chip-baris" role="group" aria-label="Periksa lagi">
              {rambuTerbuka(k).map((id) => (
                <button key={id} type="button" className="lk-chip" onClick={() => { setK((x) => bukaUlang(x, id)); setFase('periksa'); }}>Periksa lagi {NAMA[id]}</button>
              ))}
            </div>
          </section>
        ) : null}

        {fase === 'akibat' && dipilih ? (
          <section className="lk-bagian" aria-labelledby="lk-j">
            <h1 id="lk-j" ref={judulRef} tabIndex={-1} className="lk-judul">Setelah kamu sampaikan</h1>
            <Adegan tanda1={k.tanda1} tanda2={k.tanda2} statis cincinTruk />
            <p className="lk-dikatakan">Kamu: “{t(cariPilihan(dipilih).teksKunci)}”</p>
            {cariPilihan(dipilih).akibat.map((b) => (
              b.pembicara === 'hendra'
                ? <div key={b.kunci} className="lk-orang"><img src={avatar('hendra-cemas')} alt="" width={72} height={72} /><p className="lk-gelembung">{t(b.kunci)}</p></div>
                : <p key={b.kunci} className="lk-narasi">{t(b.kunci)}</p>
            ))}
            <div className="lk-tanggapan" role="group" aria-label="Pak Bima mencocokkan tandamu">
              {tanggapanTanda(k.tanda1, dipilih).map((x) => (
                <div key={x.kunci} className={`lk-umpan lk-geser ${x.kunci === 'sama' ? 'lk-umpan-sama' : 'lk-umpan-beda'}`}>
                  {x.kunci === 'sama' ? <IkonCentang /> : <IkonUlang />}
                  <div className="lk-umpan-isi"><p className={`lk-tanggapan-${x.kunci}`}>{x.teks}</p></div>
                </div>
              ))}
            </div>
            {cariPilihan(dipilih).akibat.some((b) => t(b.kunci).includes(t(cariPilihan(dipilih).alasanKunci))) ? null
              : <p className="lk-alasan-teks"><b>Catatan:</b> {t(cariPilihan(dipilih).alasanKunci)}</p>}
            <details className="lk-lihat-catatan">
              <summary>Lihat catatan</summary>
              <CatatanTemuan k={k} />
            </details>
            <button type="button" className="lk-btn lk-btn-utama" onClick={ulang}>Main lagi</button>
          </section>
        ) : null}

        <details className="lk-tentang">
          <summary>Tentang prototipe</summary>
          <p>Prototipe satu adegan. Semua teks antarmuka masih draf; isi kasus dari naskah Episode 2. Ilustrasi ini bukan rekonstruksi kejadian: posisi truk berasal dari keterangan supir dan belum diverifikasi. Arah visual dari ekspor Claude Design.</p>
        </details>
        <p className="lk-kaki">Prototipe · bukan fitur pemain · <Link to="/cerita">Daftar episode</Link></p>
      </main>
    </PlayerShell>
  );
}

/** Tanda pemain per rambu, hanya untuk rambu yang sudah dibuka. */
function Pilihanmu({ k }: { k: Keadaan }) {
  const ada: Array<{ id: IdRambu; lajur: number[]; kelas: string }> = [];
  if (k.progres >= 1 || k.tanda1.length) ada.push({ id: 'rambu1', lajur: k.tanda1, kelas: 'merah' });
  if (k.progres >= 3 || k.tanda2.length) ada.push({ id: 'rambu2', lajur: k.tanda2, kelas: 'biru' });
  return (
    <ul className="lk-pilihanmu" aria-live="polite">
      {ada.map((a) => (
        <li key={a.id}><span className={`lk-warna ${a.kelas}`} aria-hidden="true" /><b>{NAMA[a.id]}:</b> {a.lajur.length ? `pilihanmu ${teksLajur(a.lajur)}` : 'belum ada lajur yang kamu tandai'}</li>
      ))}
    </ul>
  );
}

function CatatanTemuan({ k }: { k: Keadaan }) {
  const c = catatanTemuan(k);
  return (
    <section className="lk-catatan" aria-label="Catatan temuan lokasi">
      <h2 className="lk-catatan-judul">Catatan temuan lokasi</h2>
      <h3 className="lk-catatan-sub">Dari berkas</h3>
      <ul className="lk-catatan-daftar">{c.berkas.map((b) => <li key={b.label}><b>{b.label}.</b> {b.isi}</li>)}</ul>
      <h3 className="lk-catatan-sub">Yang kamu tandai di jalan</h3>
      <ul className="lk-catatan-daftar">{c.tandamu.map((b) => <li key={b.label}><b>{b.label}:</b> {b.isi}</li>)}</ul>
      <h3 className="lk-catatan-sub">Belum pasti</h3>
      <ul className="lk-catatan-daftar">{c.belumPasti.map((x) => <li key={x}>{x}</li>)}</ul>
    </section>
  );
}
