/**
 * HALAMAN PROTOTIPE /kejadian v2 (hanya build VITE_KEJADIAN=1, bukan fitur pemain): irisan dua menit dari K10 Episode 2.
 * Pertanyaan yang diuji: apakah menemukan lalu menyiapkan langkah berikutnya sendiri menyenangkan, SEBELUM ada skor?
 *
 * Alur: Pak Hendra bingung -> susun kejadian (keterangan saksi bisa dibuka kapan saja) -> adegan memutar SUSUNAN PEMAIN ->
 * bandingkan dua catatan, tandai sendiri yang berbeda -> pilih SATU hal yang mau diperjelas, siapkan pertanyaannya, dan lihat
 * catatan kasus berubah -> penutup singkat: yang sudah diketahui dan yang belum jelas.
 * Tanpa skor, tanpa waktu, tanpa hasil klaim, tanpa jawaban karangan dari petugas. Isi: cerita/kejadian/logika.ts (semua DRAF).
 */
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Arrow, PlayerShell } from '../components/PlayerShell';
import { useReducedMotion } from '../hooks';
import { KEJADIAN } from '../cerita/kejadian/bendera';
import {
  BARIS, CATATAN_NAMA, HAL, JUMLAH_LANGKAH, KETERANGAN_SAKSI, NAMA_PIHAK, SUSUNAN_KOSONG, kartuTersisa, keadaanAdegan, lepas, penuh, penutupHendra,
  pertanyaanUntuk, pihakBoleh, ringkasCatatan, sesuaiSaksi, susunPertanyaan, tambahPertanyaan, taruh, teksKartu,
  type IdBaris, type IdHal, type IdKejadian, type IdPihak, type KeadaanAdegan, type Pertanyaan, type Susunan,
} from '../cerita/kejadian/logika';
import '../cerita/kejadian/kejadian.css';

type Fase = 'buka' | 'susun' | 'putar' | 'banding' | 'tindak' | 'akhir';

const AVATAR = import.meta.glob('../cerita/seni/auto-2/ilustrasi/hendra-{cemas,tenang}-avatar-320.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const avatar = (k: 'cemas' | 'tenang') => AVATAR[`../cerita/seni/auto-2/ilustrasi/hendra-${k}-avatar-320.webp`] ?? '';

const JEDA_AWAL_MS = 700;
const JEDA_LANGKAH_MS = 1900;

export default function ProtoKejadian() {
  const gerakKurang = useReducedMotion();
  const [fase, setFase] = useState<Fase>('buka');
  const [susunan, setSusunan] = useState<Susunan>(SUSUNAN_KOSONG);
  const [terpilih, setTerpilih] = useState<IdKejadian | null>(null);
  const [langkah, setLangkah] = useState(0);
  const [ditandai, setDitandai] = useState<IdBaris[]>([]);
  const [diperiksa, setDiperiksa] = useState(false);
  const [hal, setHal] = useState<IdHal | null>(null);
  const [pihak, setPihak] = useState<IdPihak | null>(null);
  const [daftar, setDaftar] = useState<Pertanyaan[]>([]);
  const [baru, setBaru] = useState<IdHal | null>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const catatanRef = useRef<HTMLElement>(null);

  // Pindah layar: ke atas, fokus ke judul (tanpa menggeser layar lagi).
  useEffect(() => {
    window.scrollTo(0, 0);
    judulRef.current?.focus({ preventScroll: true });
  }, [fase]);

  // Pemutaran otomatis (dimatikan bila pemain/sistem meminta gerak dikurangi: pemain menekan "Berikutnya").
  useEffect(() => {
    if (fase !== 'putar' || gerakKurang || langkah >= JUMLAH_LANGKAH) return;
    const id = window.setTimeout(() => setLangkah((n) => n + 1), langkah === 0 ? JEDA_AWAL_MS : JEDA_LANGKAH_MS);
    return () => window.clearTimeout(id);
  }, [fase, langkah, gerakKurang]);

  if (!KEJADIAN) return <Navigate to="/cerita" replace />;

  const ulang = () => {
    setSusunan(SUSUNAN_KOSONG); setTerpilih(null); setLangkah(0); setDitandai([]); setDiperiksa(false);
    setHal(null); setPihak(null); setDaftar([]); setBaru(null); setFase('buka');
  };
  const ketukKartu = (id: IdKejadian) => setTerpilih((t) => (t === id ? null : id));
  const ketukSlot = (i: number) => {
    if (terpilih) { setSusunan((s) => taruh(s, terpilih, i)); setTerpilih(null); } else setSusunan((s) => lepas(s, i));
  };
  const putar = () => { setLangkah(0); setFase('putar'); };
  const tandai = (id: IdBaris) => { if (!diperiksa) setDitandai((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id])); };

  const pilihHal = (id: IdHal) => {
    setHal(id);
    const boleh = HAL.find((h) => h.id === id)!.pihak;
    setPihak(boleh.length === 1 ? boleh[0] : (pertanyaanUntuk(daftar, id)?.pihak ?? null));
  };
  const tempel = () => {
    if (!hal || !pihak || !pihakBoleh(hal, pihak)) return;
    setDaftar((d) => tambahPertanyaan(d, hal, pihak));
    setBaru(hal); setHal(null); setPihak(null);
    window.setTimeout(() => catatanRef.current?.scrollIntoView({ block: 'nearest', behavior: gerakKurang ? 'auto' : 'smooth' }), 60);
  };

  return (
    <PlayerShell label="Prototipe">
      <main className="kj" data-fase={fase}>
        <p className="kj-cap">Prototipe · bukan fitur pemain · teks masih draf</p>

        {fase === 'buka' ? (
          <section className="kj-bagian" aria-labelledby="kj-j">
            <h1 id="kj-j" ref={judulRef} tabIndex={-1} className="kj-judul">Kejadian semalam</h1>
            <div className="kj-hendra">
              <img src={avatar('cemas')} alt="" width={84} height={84} />
              <p className="kj-gelembung">Tolong bantu saya. Truk saya kecelakaan di tol semalam. Polisi dan petugas tol sama-sama mencatatnya, tapi katanya catatannya tidak persis sama. Saya bingung harus bagaimana.</p>
            </div>
            <p className="kj-tugas">Bantu Pak Hendra paham apa yang terjadi, lalu putuskan apa yang perlu diperjelas.</p>
            <button type="button" className="primary-action kj-utama" onClick={() => setFase('susun')}>Mulai <Arrow /></button>
          </section>
        ) : null}

        {fase === 'susun' ? (
          <section className="kj-bagian" aria-labelledby="kj-j">
            <h1 id="kj-j" ref={judulRef} tabIndex={-1} className="kj-judul">Susun kejadiannya</h1>
            <Saksi />
            <p className="kj-tugas">Ketuk satu kartu, lalu ketuk langkah tempatnya.</p>
            <ol className="kj-slot-daftar">
              {susunan.map((id, i) => (
                <li key={i}>
                  <button type="button" className={`kj-slot${terpilih ? ' sasaran' : ''}${id ? ' isi' : ''}`} onClick={() => ketukSlot(i)}
                    aria-label={`Langkah ${i + 1}: ${id ? teksKartu(id) : 'belum diisi'}${id && !terpilih ? '. Ketuk untuk melepas' : ''}`}>
                    <span className="kj-no">{i + 1}</span>
                    <span className="kj-slot-teks">{id ? teksKartu(id) : terpilih ? 'Taruh di sini' : '(belum diisi)'}</span>
                  </button>
                </li>
              ))}
            </ol>
            {kartuTersisa(susunan).length ? (
              <ul className="kj-kartu-daftar" aria-label="Kartu yang belum ditaruh">
                {kartuTersisa(susunan).map((k) => (
                  <li key={k.id}>
                    <button type="button" className={`kj-kartu${terpilih === k.id ? ' dipilih' : ''}`} aria-pressed={terpilih === k.id} onClick={() => ketukKartu(k.id)}>
                      <span>{k.teks}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="kj-alasan">Semua kartu sudah ditaruh. Ketuk langkah untuk melepasnya.</p>}
            <button type="button" className="primary-action kj-utama" disabled={!penuh(susunan)} onClick={putar}>Putar kejadiannya <Arrow /></button>
            {!penuh(susunan) ? <p className="kj-alasan">Isi ketiga langkah dulu.</p> : null}
          </section>
        ) : null}

        {fase === 'putar' ? (
          <section className="kj-bagian" aria-labelledby="kj-j">
            <h1 id="kj-j" ref={judulRef} tabIndex={-1} className="kj-judul">Susunanmu diputar</h1>
            <Adegan keadaan={keadaanAdegan(susunan, langkah)} caption={langkah === 0 ? 'Sebelum kejadian' : `Langkah ${langkah}: ${teksKartu(susunan[langkah - 1] as IdKejadian)}`} />
            <p className="kj-keterangan-adegan" aria-live="polite">
              {langkah === 0 ? 'Sebelum kejadian.' : <><b>Langkah {langkah}.</b> {teksKartu(susunan[langkah - 1] as IdKejadian)}</>}
            </p>
            <p className="kj-catatan-gambar">Gambar ilustrasi. Posisi dan arah tidak persis seperti di lokasi.</p>
            <Saksi />
            {langkah < JUMLAH_LANGKAH ? (
              <div className="kj-baris-tombol">
                <button type="button" className="primary-action kj-utama" onClick={() => setLangkah((n) => n + 1)}>Berikutnya <Arrow /></button>
                <button type="button" className="btn btn-netral kj-kedua" onClick={() => setLangkah(JUMLAH_LANGKAH)}>Lewati</button>
                <button type="button" className="btn btn-netral kj-kedua" onClick={() => setFase('susun')}>Ubah susunan</button>
              </div>
            ) : (
              <>
                <p className="kj-tugas">
                  {sesuaiSaksi(susunan)
                    ? 'Urutanmu sama dengan keterangan saksi. Ini jadi dasar catatan kasus.'
                    : 'Urutanmu berbeda dari keterangan saksi. Kamu bisa mengubahnya; catatan kasus tetap memakai urutan saksi.'}
                </p>
                <div className="kj-baris-tombol">
                  <button type="button" className="primary-action kj-utama" onClick={() => setFase('banding')}>Lanjut <Arrow /></button>
                  <button type="button" className="btn btn-netral kj-kedua" onClick={() => setFase('susun')}>Ubah susunan</button>
                  <button type="button" className="btn btn-netral kj-kedua" onClick={putar}>Putar ulang</button>
                </div>
              </>
            )}
          </section>
        ) : null}

        {fase === 'banding' ? (
          <section className="kj-bagian" aria-labelledby="kj-j">
            <h1 id="kj-j" ref={judulRef} tabIndex={-1} className="kj-judul">Dua catatan</h1>
            <p className="kj-tugas">{diperiksa ? 'Ini hasil perbandingannya.' : 'Bandingkan catatan polisi dengan catatan petugas tol. Ketuk baris yang menurutmu tidak cocok.'}</p>
            <ul className="kj-banding">
              {BARIS.map((b) => {
                const t = ditandai.includes(b.id);
                return (
                  <li key={b.id} className={diperiksa ? `periksa ${b.jenis}` : ''}>
                    <button type="button" className={`kj-baris${t ? ' ditandai' : ''}`} aria-pressed={t} disabled={diperiksa} onClick={() => tandai(b.id)}>
                      <span className="kj-baris-judul">{b.label}</span>
                      <span className="kj-pasang">
                        <span className="kj-sel"><b>Polisi</b>{b.polisi}</span>
                        <span className="kj-sel"><b>Petugas tol</b>{b.tol}</span>
                      </span>
                      <span className="kj-tanda">{t ? 'Kamu tandai: berbeda' : diperiksa ? 'Belum kamu tandai' : 'Ketuk bila berbeda'}</span>
                    </button>
                    {diperiksa ? <p className="kj-penjelasan"><b>{b.jenis === 'sama' ? 'Sama.' : b.jenis === 'beda' ? 'Berbeda.' : 'Hanya di satu catatan.'}</b> {b.penjelasan}</p> : null}
                  </li>
                );
              })}
            </ul>
            {diperiksa ? <p className="kj-penjelasan">{CATATAN_NAMA}</p> : null}
            {diperiksa
              ? <button type="button" className="primary-action kj-utama" onClick={() => setFase('tindak')}>Lanjut <Arrow /></button>
              : <button type="button" className="primary-action kj-utama" onClick={() => setDiperiksa(true)}>Periksa tandaku <Arrow /></button>}
          </section>
        ) : null}

        {fase === 'tindak' ? (
          <section className="kj-bagian" aria-labelledby="kj-j">
            <h1 id="kj-j" ref={judulRef} tabIndex={-1} className="kj-judul">Apa yang mau kamu perjelas?</h1>
            <p className="kj-tugas">Pilih satu hal yang berbeda, lalu siapkan pertanyaannya. Jawabannya belum ada; pertanyaanmu masuk ke catatan kasus.</p>
            <ul className="kj-kartu-daftar">
              {HAL.map((h) => {
                const p = pertanyaanUntuk(daftar, h.id);
                return (
                  <li key={h.id}>
                    <button type="button" className={`kj-kartu${hal === h.id ? ' dipilih' : ''}${p ? ' ditaruh' : ''}`} aria-pressed={hal === h.id} onClick={() => pilihHal(h.id)}>
                      <span><b>{h.judul}</b></span>
                      <small>{p ? `Pertanyaan untuk ${NAMA_PIHAK[p.pihak]} sudah di catatan. Ketuk untuk mengganti.` : h.ringkas}</small>
                    </button>
                  </li>
                );
              })}
            </ul>

            {hal ? (
              <div className="kj-siap" role="group" aria-label="Siapkan pertanyaan">
                {HAL.find((h) => h.id === hal)!.pihak.length > 1 ? (
                  <>
                    <p className="kj-tugas"><b>Tanya siapa?</b></p>
                    <div className="kj-chip-baris">
                      {HAL.find((h) => h.id === hal)!.pihak.map((p) => (
                        <button key={p} type="button" className={`kj-chip${pihak === p ? ' dipilih' : ''}`} aria-pressed={pihak === p} onClick={() => setPihak(p)}>{NAMA_PIHAK[p]}</button>
                      ))}
                    </div>
                  </>
                ) : <p className="kj-tugas">Hanya ada di catatan tol, jadi ditujukan ke <b>Petugas tol</b>.</p>}
                {pihak ? <blockquote className="kj-pertanyaan">{susunPertanyaan(hal, pihak)}</blockquote> : <p className="kj-alasan">Pilih dulu siapa yang ditanya.</p>}
                <button type="button" className="primary-action kj-utama" disabled={!pihak} onClick={tempel}>Tempel ke catatan kasus <Arrow /></button>
              </div>
            ) : null}

            <CatatanKasus daftar={daftar} baru={baru} refCatatan={catatanRef} />

            <button type="button" className="primary-action kj-utama" disabled={daftar.length === 0} onClick={() => setFase('akhir')}>Selesai <Arrow /></button>
            {daftar.length === 0 ? <p className="kj-alasan">Siapkan setidaknya satu pertanyaan.</p> : null}
          </section>
        ) : null}

        {fase === 'akhir' ? (
          <section className="kj-bagian" aria-labelledby="kj-j">
            <h1 id="kj-j" ref={judulRef} tabIndex={-1} className="kj-judul">Catatan kasus sekarang</h1>
            <div className="kj-hendra">
              <img src={avatar('tenang')} alt="" width={64} height={64} className="kecil" />
              <p className="kj-gelembung">{penutupHendra(daftar.length)}</p>
            </div>
            <CatatanKasus daftar={daftar} baru={null} refCatatan={catatanRef} akhir />
            <button type="button" className="btn btn-netral kj-kedua" onClick={() => setFase('tindak')}>Tambah atau ganti pertanyaan</button>
            <button type="button" className="primary-action kj-utama" onClick={ulang}>Main lagi <Arrow /></button>
          </section>
        ) : null}

        <p className="kj-kaki"><Link to="/cerita">Daftar episode</Link></p>
      </main>
    </PlayerShell>
  );
}

/** Keterangan semua saksi, ringkas: terlipat sampai dibuka pemain (tidak menambah tembok teks). */
function Saksi() {
  return (
    <details className="kj-saksi-panel">
      <summary>Lihat keterangan saksi</summary>
      <p>{KETERANGAN_SAKSI}</p>
    </details>
  );
}

/** Catatan kasus: yang sudah pasti, yang berbeda (dengan status), dan pertanyaan yang menunggu jawaban. Berubah saat pemain menempel pertanyaan. */
function CatatanKasus({ daftar, baru, refCatatan, akhir = false }: { daftar: Pertanyaan[]; baru: IdHal | null; refCatatan: React.RefObject<HTMLElement | null>; akhir?: boolean }) {
  const r = ringkasCatatan(daftar);
  return (
    <section className="kj-catatan" ref={refCatatan} aria-label="Catatan kasus" tabIndex={-1}>
      <h2 className="kj-catatan-judul">Catatan kasus</h2>
      <h3 className="kj-catatan-sub">Sudah pasti (semua saksi)</h3>
      <ol className="kj-catatan-daftar">{r.pasti.slice(0, -1).map((t) => <li key={t}>{t}</li>)}</ol>
      <p className="kj-catatan-lepas">{r.pasti[r.pasti.length - 1]}</p>
      <h3 className="kj-catatan-sub">Berbeda di dua catatan</h3>
      <ul className="kj-catatan-daftar tanpa-no">
        {r.beda.map((b) => (
          <li key={b.hal.id} className={baru === b.hal.id ? 'baru' : ''}>
            <b>{b.hal.judul}.</b> {b.hal.ringkas}.{' '}
            <span className={`kj-status ${b.status}`}>{b.status === 'ditanyakan' ? `Ditanyakan ke ${NAMA_PIHAK[b.pihak as IdPihak]}` : 'Belum ditanyakan'}</span>
          </li>
        ))}
      </ul>
      <h3 className="kj-catatan-sub">{akhir ? 'Belum jelas, menunggu jawaban' : 'Perlu klarifikasi'}</h3>
      {r.klarifikasi.length === 0 ? <p className="kj-catatan-lepas">Belum ada pertanyaan.</p> : (
        <ul className="kj-catatan-daftar tanpa-no">
          {r.klarifikasi.map((p) => (
            <li key={p.hal} className={baru === p.hal ? 'baru' : ''}>
              <span className="kj-pertanyaan-teks">{p.teks}</span>
              <span className="kj-status menunggu">Belum ada jawaban</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Adegan ilustrasi dari atas: jalan, pembatas di kiri, mobil kecil, truk Pak Hendra, truk kecil yang berhenti ganti ban. */
function Adegan({ keadaan, caption }: { keadaan: KeadaanAdegan; caption: string }) {
  const truk = { lurus: 'translate(145px,215px)', kiri: 'translate(106px,196px) rotate(-14deg)', tabrak: 'translate(89px,152px) rotate(-26deg)' }[keadaan.truk];
  const mobil = keadaan.mobil === 'asal' ? 'translate(195px,118px)' : 'translate(146px,136px) rotate(-9deg)';
  const kecil = keadaan.truk === 'tabrak' ? 'translate(33px,98px) rotate(-8deg)' : 'translate(37px,92px)';
  return (
    <svg className="kj-adegan" viewBox="0 0 320 300" role="img" aria-label={`Ilustrasi kejadian. ${caption}`}>
      <rect width="320" height="300" fill="#b9c9a4" />
      <rect x="70" width="200" height="300" fill="#4a4f52" />
      <rect x="0" width="58" height="300" fill="#c9c3b2" />
      <g stroke="#e9e6dc" strokeWidth="2" strokeDasharray="14 14" opacity=".75">
        <line x1="120" y1="0" x2="120" y2="300" /><line x1="170" y1="0" x2="170" y2="300" /><line x1="220" y1="0" x2="220" y2="300" />
      </g>
      <rect x="58" width="12" height="300" fill="#8f979b" />
      <g fill="#d4553b" opacity=".9">{[10, 70, 130, 190, 250].map((y) => <rect key={y} x="58" y={y} width="12" height="14" />)}</g>
      <g className="kj-g" style={{ transform: kecil }}>
        <rect x="-16" y="-24" width="32" height="48" rx="3" fill="#e0b84f" /><rect x="-16" y="-24" width="32" height="14" rx="3" fill="#9a7a22" />
        <circle cx="-17" cy="8" r="5" fill="#222" />
      </g>
      <g className="kj-g" style={{ transform: mobil }}>
        <rect x="-11" y="-20" width="22" height="40" rx="6" fill="#3b6ea5" /><rect x="-8" y="-9" width="16" height="10" rx="2" fill="#cfe0f0" />
      </g>
      <g className="kj-g" style={{ transform: truk }}>
        <rect x="-16" y="-8" width="32" height="64" rx="2" fill="#d8d2c4" stroke="#8c8672" />
        <rect x="-14" y="-40" width="28" height="31" rx="4" fill="#215c40" /><rect x="-10" y="-36" width="20" height="8" rx="2" fill="#cfe9dc" />
      </g>
      <g className="kj-g" style={{ transform: 'translate(64px,128px)', opacity: keadaan.truk === 'tabrak' ? 1 : 0 }}>
        <polygon points="0,-18 5,-6 18,-8 9,2 17,14 3,9 -4,20 -6,7 -19,6 -9,-3 -14,-15 -2,-8" fill="#f2c230" stroke="#d4553b" strokeWidth="2" />
      </g>
    </svg>
  );
}
