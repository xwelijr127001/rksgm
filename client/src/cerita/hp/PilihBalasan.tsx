/**
 * Keputusan percakapan di HP: pertanyaan + fakta yang perlu dibaca (di tempat) + balasan sebagai pilihan radio. Ketuk =
 * memilih (bisa diganti), "Kirim" = keputusan dijalankan SEKALI. Panah atas/bawah memindah pilihan (pola radiogroup).
 *
 * T-018 Tahap 1b (D-128): di cangkang obrolan HP (LembarObrolan) keputusan tampil sebagai LEMBAR BALASAN ringkas bergaya
 * game yang naik dari komposer: pegangan (ketuk / geser turun / Esc = tutup, pilihan tetap diingat), ikon Miss Raksa +
 * pertanyaan, baris pilihan bernomor (angka 1-5 = pilih, Enter = kirim), tombol kirim "Pilih 1 balasan" -> "Kirim balasan N",
 * dan kartu rujukan di balik tab kuning "Catatan" (lembar berbalik ke daftar catatan polos + "Kembali ke balasan").
 * Bila lembar lebih tinggi daripada ruang yang ada, HANYA daftar pilihan (atau catatan) yang menggulir di dalam lembar;
 * pertanyaan dan tombol kirim tetap terlihat. Di tempat lain (desktop, adegan tatap muka) semuanya satu blok seperti semula.
 *
 * T-115 (Raksa Investigator, opt-in lewat `ringkas`; episode lain tidak berubah): pesan untuk nasabah di kasus Investigator panjang
 * (sampai +- 390 huruf pada 18 px), jadi daftar tiga pesan utuh tidak muat di lembar dan badan lembarnya menggulir. Dengan
 * `ringkas`: di daftar tiap pesan dipotong 3 baris; mengetuk satu pesan MELIPAT lembar menjadi pesan itu saja, utuh, dengan "Ganti
 * balasan" (kembali ke daftar) dan tombol kirim. Tidak ada yang perlu digulir; pesan lain tetap satu ketukan jauhnya.
 *
 * T-124 (masukan Pak Peterson 22 Nov 2026, butir 1-2; HANYA `DUA_LANGKAH` di bawah = episode `auto-2`, node `k03`, dokumen
 * `proses`; keputusan lain, Episode 1 Dev dan kasus Investigator tidak berubah): kartu tahapan dan lima balasan dulu tampil
 * bersamaan, jadi "Tahap berikutnya" dan "Kirim balasan" berebut perhatian. Sekarang DUA LANGKAH, tampilan saja:
 *   1. BACA  "Pelajari tahapan klaim": kartu proses mulai di tahap 1 dari 4; satu baris aksi = Sebelumnya + SATU tombol utama
 *      ("Tahap berikutnya", di tahap terakhir "Lanjut ke balasan"). Penjelasan "urutan penjelasan, bukan jadwal" dan catatan
 *      dokumen selalu terlihat.
 *   2. BALAS pertanyaan naskah + lima radio + "Lihat tahapan" (kembali ke langkah 1) + SATU tombol kirim.
 * "Lihat tahapan" TIDAK melepas balasan yang sedang dipilih. Sesudah langkah 2 pernah dicapai, langkah 1 adalah TINJAUAN: tombol
 * utamanya "Kembali ke balasan" di tahap mana pun, dan tahap digeser dengan dua tombol panah (atau penanda 1-4).
 * Naskah, lima pilihan, nilai kepercayaan dan node lanjutannya tidak disentuh: hanya `onKirim` (sekali) yang menyentuh mesin.
 * Ingatan: langkah & tahap diingat selama KUNJUNGAN halaman ini (`kunjungan`, tidak disimpan) dan dilupakan saat balasan
 * terkirim; sesudah muat ulang, balasan tersimpan yang masih sah (`awal`) membuka langkah 2, selain itu langkah 1 dari tahap 1.
 * Fokus pindah ke judul langkah yang baru (cincin fokus terlihat bagi pengguna keyboard); panah kiri/kanan hanya bekerja di dalam
 * penanda tahap, panah atas/bawah hanya di dalam daftar balasan.
 *
 * T-126 (keputusan Lead atas audit T-124; HANYA `DAFTAR_POLOS` di bawah = k06 `linimasa` di auto-2 dan Episode 1 Dev, dan HANYA di
 * blok biasa / desktop; lembar balasan HP tidak berubah): tiga tahap perkiraan waktu tampil sebagai daftar bernomor POLOS di
 * SAMPING balasan (dua kolom mulai 1024 px), tanpa tombol tahap; satu-satunya tombol utama = kirim. Pilihan, pratinjau "Ganti
 * balasan" dan pengiriman berjalan persis seperti keputusan blok biasa lainnya.
 */
import { useContext, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { playSfx } from '../../audio/audio';
import { Arrow } from '../../components/PlayerShell';
import { t } from '../../i18n';
import { URL_IKON_PIKSEL } from '../seni/piksel';
import type { DokumenCerita, Episode, KunciTeks, NodePilihan, Pilihan } from '../tipe';
import { BacaTahapan, DaftarTahapan, KartuDokumen } from '../ui/KartuDokumen';
import { TombolKirim } from './bagianHp';
import { PotretSaya } from './lookPemain';
import { LembarObrolan } from './ekor';
import './duaLangkah.css';

/** Catatan yang sudah pernah dibuka (titik merah "belum dibaca" hilang), per dokumen, selama halaman hidup. */
const catatanDibaca = new Set<string>();

/** T-124: satu-satunya keputusan yang tampil dua langkah (baca tahapan, lalu balas). Lihat kepala berkas. */
const DUA_LANGKAH = { episode: 'auto-2', node: 'k03', dokumen: 'proses' } as const;
/** T-126: keputusan yang dokumen bertahapnya tampil sebagai daftar polos di samping balasan (blok biasa / desktop saja). */
const DAFTAR_POLOS: readonly { episode: string; node: string; dokumen: string }[] = [
  { episode: 'auto-2', node: 'k06', dokumen: 'linimasa' },
  { episode: 'auto-2-dev', node: 'k06', dokumen: 'linimasa' },
];
type Langkah = 'baca' | 'balas';
/** T-124: langkah & tahap yang sedang dibuka, per keputusan, selama kunjungan halaman ini (dilupakan saat balasan terkirim). */
const kunjungan = new Map<string, { langkah: Langkah; tahap: number; sudahBalas: boolean }>();
/** T-124: jeda sesudah langkah berganti; selama itu baris aksi tidak menerima ketukan (ketuk ganda tidak ikut mengirim). */
const JEDA_LANGKAH_MS = 400;

export function PilihBalasan({ ep, node, pilihan, tx, gaya, petunjuk, onKirim, awal = null, onUbahPilih, onTutup, ringkas = false }: {
  ep: Episode;
  node: NodePilihan;
  pilihan: Pilihan[];
  tx: (k: KunciTeks) => string;
  /** 'obrolan' = balasan chat (tombol "Kirim balasan"); 'adegan' = jawaban tatap muka. */
  gaya: 'obrolan' | 'adegan';
  /** Petunjuk "pilih lalu kirim, masih bisa diganti" (hanya keputusan pertama; sesudahnya teks berulang). */
  petunjuk: boolean;
  onKirim: (id: string) => void;
  /** Pilihan yang dipulihkan sesudah muat ulang (belum dikirim). */
  awal?: string | null;
  onUbahPilih?: (id: string) => void;
  /** (lembar) tutup lembar dan kembali ke tombol "Balas ..."; pilihan tetap diingat pemanggil. */
  onTutup?: () => void;
  /** T-115 (lembar): daftar dipotong 3 baris per pesan; pesan yang diketuk tampil utuh sendirian (lihat kepala berkas). */
  ringkas?: boolean;
}) {
  const idJudul = useId();
  const lembar = useContext(LembarObrolan);
  const sah = awal && pilihan.some((p) => p.id === awal) ? awal : null;
  const [dipilih, setDipilihMentah] = useState<string | null>(sah);
  const [lipat, setLipat] = useState(!!sah);
  const setDipilih = (id: string) => { setDipilihMentah(id); onUbahPilih?.(id); };
  const indeks = pilihan.findIndex((p) => p.id === dipilih);
  const terpilih = indeks >= 0 ? pilihan[indeks]! : null;
  const dok = node.dokumen ? ep.dokumen?.[node.dokumen] : undefined;
  const [nota, setNota] = useState(false);
  const [dibaca, setDibaca] = useState(() => !!node.dokumen && catatanDibaca.has(`${ep.id}:${node.dokumen}`));
  const akar = useRef<HTMLElement>(null);
  const geser = useRef<number | null>(null);
  const panah = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const maju = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    const i = ((indeks < 0 ? (maju > 0 ? -1 : 0) : indeks) + maju + pilihan.length) % pilihan.length;
    setDipilih(pilihan[i]!.id);
    (e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[i])?.focus();
  };

  // ---- T-124: keputusan dua langkah (hanya DUA_LANGKAH; di tempat lain `duaLangkah` false dan tidak ada yang berubah)
  const duaLangkah = ep.id === DUA_LANGKAH.episode && node.id === DUA_LANGKAH.node && node.dokumen === DUA_LANGKAH.dokumen && !!dok?.tahapan && !dok.skema && dok.baris.length >= 2;
  const kunciKunjungan = `${ep.id}:${node.id}`;
  const jumlahTahap = dok?.baris.length ?? 0;
  const [langkah, setLangkah] = useState<Langkah>(() => (!duaLangkah || sah ? 'balas' : kunjungan.get(kunciKunjungan)?.langkah ?? 'baca'));
  const [tahap, setTahap] = useState(() => (duaLangkah ? Math.min(Math.max(kunjungan.get(kunciKunjungan)?.tahap ?? 0, 0), Math.max(jumlahTahap - 1, 0)) : 0));
  /** Langkah balas sudah pernah dicapai (kunjungan ini, atau ada balasan tersimpan): langkah baca = tinjauan. */
  const [sudahBalas, setSudahBalas] = useState(() => duaLangkah && (!!sah || !!kunjungan.get(kunciKunjungan)?.sudahBalas));
  const [jeda, setJeda] = useState(false);
  const pewaktuJeda = useRef<number | null>(null);
  useEffect(() => () => { if (pewaktuJeda.current !== null) window.clearTimeout(pewaktuJeda.current); }, []);
  const membaca = duaLangkah && langkah === 'baca';
  const tahapTerakhir = tahap >= jumlahTahap - 1;
  const catat = (l: Langkah, th: number, sb: boolean) => { if (duaLangkah) kunjungan.set(kunciKunjungan, { langkah: l, tahap: th, sudahBalas: sb }); };
  const keTahap = (i: number) => {
    if (i < 0 || i >= jumlahTahap || i === tahap) return;
    setTahap(i);
    catat(langkah, i, sudahBalas);
  };
  const keLangkah = (l: Langkah) => {
    const sb = sudahBalas || l === 'balas';
    const th = l === 'baca' ? 0 : tahap; // tinjauan selalu mulai dari tahap 1
    setLangkah(l); setSudahBalas(sb); setTahap(th);
    catat(l, th, sb);
    setJeda(true);
    if (pewaktuJeda.current !== null) window.clearTimeout(pewaktuJeda.current);
    pewaktuJeda.current = window.setTimeout(() => { pewaktuJeda.current = null; setJeda(false); }, JEDA_LANGKAH_MS);
    // Fokus ke judul langkah yang baru. Di lembar tanpa menggulir; di blok biasa (desktop) judul boleh digulir ke dalam layar.
    requestAnimationFrame(() => akar.current?.querySelector<HTMLElement>('[data-hp-fokus]')?.focus({ preventScroll: lembar }));
  };
  const kirim = () => {
    if (!dipilih) return;
    kunjungan.delete(kunciKunjungan);
    onKirim(dipilih);
  };
  /** Baris aksi langkah baca: Sebelumnya (+ Berikutnya saat tinjauan) + satu tombol utama. */
  const kakiBaca = membaca ? (
    <div className="hp-dl-kaki" data-kaki="baca" data-jeda={jeda ? '' : undefined}>
      <button type="button" className="hp-lembar-kembali hp-dl-kedua" data-ikon="" data-tahap-sebelum="" aria-disabled={tahap === 0 ? true : undefined}
        onClick={() => { if (tahap > 0) { playSfx('ketuk'); keTahap(tahap - 1); } }}>
        <Arrow back /><span className="hp-dl-teks">{t('ceritaHp.tahapSebelum')}</span>
      </button>
      {sudahBalas ? (
        <button type="button" className="hp-lembar-kembali hp-dl-kedua" data-ikon="" data-tahap-berikut="" aria-disabled={tahapTerakhir ? true : undefined}
          onClick={() => { if (!tahapTerakhir) { playSfx('ketuk'); keTahap(tahap + 1); } }}>
          <span className="hp-dl-teks">{t('ceritaHp.tahapBerikut')}</span><Arrow />
        </button>
      ) : null}
      <button type="button" className="primary-action hp-dl-utama" data-ke-balasan={sudahBalas || tahapTerakhir ? '' : undefined} data-tahap-maju={sudahBalas || tahapTerakhir ? undefined : ''}
        onClick={() => { playSfx('ketuk'); if (sudahBalas || tahapTerakhir) keLangkah('balas'); else keTahap(tahap + 1); }}>
        <span>{sudahBalas ? t('ceritaHp.kembaliBalasan') : tahapTerakhir ? t('ceritaHp.lanjutKeBalasan') : t('ceritaHp.tahapBerikut')}</span> <Arrow />
      </button>
    </div>
  ) : null;
  const tombolLihat = duaLangkah ? (
    <button type="button" className="hp-lembar-kembali hp-dl-kedua" data-lihat-tahapan="" onClick={() => { playSfx('ketuk'); keLangkah('baca'); }}>
      <Arrow back /><span>{t('ceritaHp.lihatTahapan')}</span>
    </button>
  ) : null;

  if (lembar) {
    const bukaNota = (buka: boolean) => {
      setNota(buka);
      if (buka && node.dokumen) { catatanDibaca.add(`${ep.id}:${node.dokumen}`); setDibaca(true); }
      requestAnimationFrame(() => akar.current?.querySelector<HTMLElement>(buka ? '[data-kembali-balasan]' : '[data-hp-fokus]')?.focus({ preventScroll: true }));
    };
    const tombol = (e: KeyboardEvent<HTMLElement>) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (nota) bukaNota(false); else onTutup?.(); return; }
      if (nota || membaca) return; // T-124: angka & Enter hanya untuk balasan, bukan saat membaca tahapan
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= pilihan.length) {
        e.preventDefault();
        setDipilih(pilihan[n - 1]!.id);
        if (ringkas) setLipat(true);
        akar.current?.querySelectorAll<HTMLElement>('[role="radio"]')[n - 1]?.focus();
        return;
      }
      // Enter pada baris yang SUDAH terpilih (atau pada pertanyaan) = kirim; pada baris lain = memilihnya (klik bawaan).
      // T-124: di keputusan dua langkah fokus pindah ke pertanyaan setiap kali langkah berganti, jadi Enter pada pertanyaan
      // TIDAK mengirim di sana (Enter yang ditekan dua kali tidak boleh mengirim balasan).
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (e.key === 'Enter' && dipilih && el && ((el.matches('[data-hp-fokus]') && !duaLangkah) || el.getAttribute('data-pilihan') === dipilih)) {
        e.preventDefault();
        akar.current?.querySelector<HTMLElement>('[data-kirim]')?.click();
      }
    };
    // T-115: lembar terlipat = hanya pesan yang dipilih, utuh (`ringkas`).
    const lipatLembar = ringkas && lipat && !!terpilih && !nota;
    // Pegangan: ketuk = tutup; geser turun >= 20 px = tutup.
    const turun = (e: PointerEvent<HTMLButtonElement>) => { geser.current = e.clientY; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* abaikan */ } };
    const lepas = (e: PointerEvent<HTMLButtonElement>) => { const y0 = geser.current; geser.current = null; if (y0 !== null && e.clientY - y0 >= 20) onTutup?.(); };
    return (
      <section ref={akar} className="hp-pilih hp-lembar" data-lembar="" data-gaya={gaya} data-tampil={nota ? 'nota' : 'balas'} data-ringkas={ringkas ? (lipatLembar ? 'lipat' : 'daftar') : undefined}
        data-dua-langkah={duaLangkah ? '' : undefined} data-langkah={duaLangkah ? langkah : undefined} aria-labelledby={idJudul} onKeyDown={tombol}>
        <div className="hp-lembar-pegangan">
          <button type="button" data-tutup-lembar="" aria-label={t('ceritaHp.tutupBalasan')} onClick={() => onTutup?.()} onPointerDown={turun} onPointerUp={lepas}><i aria-hidden="true" /></button>
        </div>
        <div className="hp-lembar-kepala">
          <span className="hp-lembar-mr" aria-hidden="true" style={{ backgroundImage: `url(${URL_IKON_PIKSEL.missRaksa})` }} />
          <h2 id={idJudul} className="hp-tanya" tabIndex={-1} data-hp-fokus="">{membaca ? t('ceritaHp.pelajariTahapan') : tx(node.tanya)}</h2>
        </div>
        {dok && !duaLangkah ? (
          <button type="button" className="hp-lembar-catatan" data-catatan="" data-dibaca={dibaca ? '' : undefined} aria-pressed={nota} onClick={() => bukaNota(!nota)}>
            <span aria-hidden="true">▤</span> {t('ceritaHp.catatan')}{dibaca ? null : <span className="sr-only"> ({t('ceritaHp.catatanBaru')})</span>}
          </button>
        ) : null}
        {membaca && dok ? (
          <>
            <div className="hp-lembar-badan" data-gulir-lembar=""><BacaTahapan dokumen={dok} id={node.dokumen!} tx={tx} tahap={tahap} onTahap={keTahap} /></div>
            {kakiBaca}
          </>
        ) : nota && dok ? (
          <>
            <div className="hp-lembar-badan" data-gulir-lembar=""><NotaDokumen dokumen={dok} id={node.dokumen!} tx={tx} /></div>
            <button type="button" className="hp-lembar-kembali" data-kembali-balasan="" onClick={() => bukaNota(false)}><span aria-hidden="true">←</span> {t('ceritaHp.kembaliBalasan')}</button>
          </>
        ) : (
          <>
            <div className="hp-opsi-daftar hp-lembar-badan" data-gulir-lembar="" role="radiogroup" aria-labelledby={idJudul} onKeyDown={panah}>
              {pilihan.map((p, i) => {
                const aktif = p.id === dipilih;
                if (lipatLembar && !aktif) return null;
                return (
                  <button key={p.id} type="button" role="radio" aria-checked={aktif} tabIndex={aktif || (indeks < 0 && i === 0) ? 0 : -1}
                    className={'hp-opsi' + (aktif ? ' dipilih' : dipilih ? ' lain' : '')} data-pilihan={p.id} style={{ animationDelay: `${i * 30}ms` }} onClick={() => { playSfx('ketuk'); setDipilih(p.id); if (ringkas) setLipat(true); }}>
                    <span className="hp-opsi-nomor" aria-hidden="true">{i + 1}</span>
                    <span className="hp-opsi-teks">{tx(p.teks)}</span>
                  </button>
                );
              })}
            </div>
            {lipatLembar ? (
              <button type="button" className="hp-tautan hp-lembar-ganti" data-ganti-balasan="" onClick={() => { playSfx('ketuk'); setLipat(false); requestAnimationFrame(() => akar.current?.querySelector<HTMLElement>(`[data-pilihan="${terpilih!.id}"]`)?.focus({ preventScroll: true })); }}>
                {gaya === 'obrolan' ? t('ceritaHp.gantiBalasan') : t('ceritaHp.gantiJawaban')}
              </button>
            ) : null}
            {duaLangkah ? (
              // T-124: "Lihat tahapan" dan kirim di satu baris aksi (tanpa potret: lebarnya dipakai tombol kirim).
              <div className="hp-dl-kaki" data-kaki="balas" data-jeda={jeda ? '' : undefined}>
                {tombolLihat}
                <TombolKirim
                  label={terpilih ? t('ceritaHp.kirimBalasanN', { n: indeks + 1 }) : t('ceritaHp.pilihSatuBalasan')}
                  siap={dipilih !== null}
                  onKirim={kirim}
                />
              </div>
            ) : (
              <TombolKirim
                label={terpilih ? t('ceritaHp.kirimBalasanN', { n: indeks + 1 }) : t('ceritaHp.pilihSatuBalasan')}
                siap={dipilih !== null}
                onKirim={() => { if (dipilih) onKirim(dipilih); }}
                potret={<PotretSaya ukuran={32} />}
              />
            )}
          </>
        )}
      </section>
    );
  }

  if (duaLangkah && dok) {
    // T-124: blok biasa (desktop >= 1024 px, layar sangat pendek) dalam dua langkah. Daftar balasan TIDAK dilipat menjadi
    // pratinjau di sini: lima radio tetap terlihat, yang dipilih bertanda, dan satu tombol kirim di samping "Lihat tahapan".
    return (
      <section ref={akar} className="hp-pilih" data-gaya={gaya} data-dua-langkah="" data-langkah={langkah} aria-labelledby={idJudul}>
        <h2 id={idJudul} className="hp-tanya" tabIndex={-1} data-hp-fokus="">{membaca ? t('ceritaHp.pelajariTahapan') : tx(node.tanya)}</h2>
        {membaca ? (
          <>
            <BacaTahapan dokumen={dok} id={node.dokumen!} tx={tx} tahap={tahap} onTahap={keTahap} />
            {kakiBaca}
          </>
        ) : (
          <>
            {petunjuk ? <p className="hp-petunjuk">{t('ceritaHp.pilihPetunjuk')}</p> : null}
            <div className="hp-opsi-daftar" role="radiogroup" aria-labelledby={idJudul} onKeyDown={panah}>
              {pilihan.map((p, i) => {
                const aktif = p.id === dipilih;
                return (
                  <button key={p.id} type="button" role="radio" aria-checked={aktif} tabIndex={aktif || (indeks < 0 && i === 0) ? 0 : -1}
                    className={'hp-opsi' + (aktif ? ' dipilih' : '')} data-pilihan={p.id} onClick={() => setDipilih(p.id)}>
                    <span className="hp-opsi-tanda" aria-hidden="true">{aktif ? <i /> : null}</span>
                    <span className="hp-opsi-teks">{tx(p.teks)}</span>
                  </button>
                );
              })}
            </div>
            <div className="hp-dl-kaki" data-kaki="balas" data-jeda={jeda ? '' : undefined}>
              {tombolLihat}
              <TombolKirim
                label={gaya === 'obrolan' ? t('ceritaHp.kirimBalasan') : t('ceritaHp.kirimJawaban')}
                siap={dipilih !== null}
                onKirim={kirim}
                alasanBelum={dipilih ? null : gaya === 'obrolan' ? t('ceritaHp.belumBalasan') : t('ceritaHp.belumJawaban')}
              />
            </div>
          </>
        )}
      </section>
    );
  }

  // T-126: k06 `linimasa`: daftar tahap polos di kolom kiri, balasan di kolom kanan (lihat kepala berkas).
  const dokDaftar = !!dok?.tahapan && !dok.skema && DAFTAR_POLOS.some((x) => x.episode === ep.id && x.node === node.id && x.dokumen === node.dokumen);
  const isiBalas = (
    <>
      {petunjuk && !lipat ? <p className="hp-petunjuk">{t('ceritaHp.pilihPetunjuk')}</p> : null}
      {/* Prototipe Claude Design: sesudah memilih dengan ketukan, daftar dilipat menjadi PRATINJAU kalimat lengkap (naskah) + Ganti;
          panah keyboard tetap memilih di dalam daftar tanpa melipatnya. */}
      {lipat && terpilih ? (
        <figure className="hp-pratinjau-balasan" data-gaya={gaya} role="status">
          <figcaption>{t('ceritaHp.pratinjauBelum')}</figcaption>
          <p className="hp-pratinjau-balasan-teks" data-pratinjau={terpilih.id}>{tx(terpilih.teks)}</p>
          <button type="button" className="hp-tautan" data-ganti-balasan="" onClick={() => { setLipat(false); requestAnimationFrame(() => document.querySelector<HTMLElement>(`.hp-pilih [data-pilihan="${terpilih.id}"]`)?.focus()); }}>
            {gaya === 'obrolan' ? t('ceritaHp.gantiBalasan') : t('ceritaHp.gantiJawaban')}
          </button>
        </figure>
      ) : null}
      <div className="hp-opsi-daftar" role="radiogroup" aria-labelledby={idJudul} onKeyDown={panah} hidden={lipat && !!terpilih}>
        {pilihan.map((p, i) => {
          const aktif = p.id === dipilih;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={aktif}
              tabIndex={aktif || (indeks < 0 && i === 0) ? 0 : -1}
              className={'hp-opsi' + (aktif ? ' dipilih' : '')}
              data-pilihan={p.id}
              onClick={() => { setDipilih(p.id); setLipat(true); }}
            >
              <span className="hp-opsi-tanda" aria-hidden="true">{aktif ? <i /> : null}</span>
              <span className="hp-opsi-teks">{tx(p.teks)}</span>
            </button>
          );
        })}
      </div>
      <TombolKirim
        label={gaya === 'obrolan' ? t('ceritaHp.kirimBalasan') : t('ceritaHp.kirimJawaban')}
        siap={dipilih !== null}
        onKirim={() => { if (dipilih) onKirim(dipilih); }}
        alasanBelum={dipilih ? null : gaya === 'obrolan' ? t('ceritaHp.belumBalasan') : t('ceritaHp.belumJawaban')}
      />
    </>
  );
  return (
    <section className="hp-pilih" data-gaya={gaya} data-dok-daftar={dokDaftar ? '' : undefined} aria-labelledby={idJudul}>
      <h2 id={idJudul} className="hp-tanya" tabIndex={-1} data-hp-fokus="">{tx(node.tanya)}</h2>
      {dokDaftar && dok ? (
        <div className="hp-dl-dua-kolom">
          <DaftarTahapan dokumen={dok} id={node.dokumen!} tx={tx} />
          <div className="hp-dl-kolom-balas">{isiBalas}</div>
        </div>
      ) : (
        <>
          {dok ? <KartuDokumen dokumen={dok} id={node.dokumen!} tx={tx} /> : null}
          {isiBalas}
        </>
      )}
    </section>
  );
}

/**
 * Catatan (D-128): isi kartu dokumen sebagai daftar POLOS di lembar balasan: label tebal, nilai di bawahnya; dokumen bertahap =
 * daftar bernomor (awalan "1. " di label dilepas), tanpa penjelajah tahap. Fakta & catatan ketidakpastian = baris naskah apa
 * adanya. Dokumen ber-skema (bukti lajur) tetap memakai KartuDokumen.
 */
function NotaDokumen({ dokumen, id, tx }: { dokumen: DokumenCerita; id: string; tx: (k: KunciTeks) => string }) {
  if (dokumen.skema) return <KartuDokumen dokumen={dokumen} id={id} tx={tx} />;
  const idJudul = `hp-nota-${id}`;
  return (
    <section className="hp-nota" data-dokumen={id} aria-labelledby={idJudul}>
      <h3 id={idJudul}>{tx(dokumen.judul)}</h3>
      {dokumen.tahapan ? (
        <ol>
          {dokumen.baris.map((b, i) => (
            <li key={i}><span className="hp-opsi-nomor" aria-hidden="true">{i + 1}</span><span><b>{tx(b.label).replace(/^\d+\.\s*/, '')}</b>{b.nilai ? tx(b.nilai) : null}</span></li>
          ))}
        </ol>
      ) : (
        <dl>
          {dokumen.baris.map((b, i) => (
            <div key={i}><dt>{tx(b.label)}</dt>{b.nilai ? <dd>{tx(b.nilai)}</dd> : <dd />}</div>
          ))}
        </dl>
      )}
      {dokumen.tahapan === 'paralel' ? <p className="hp-nota-urutan">{t('ceritaHp.urutanPenjelasan')}</p> : null}
      {dokumen.catatan ? <p className="hp-nota-kaki">{tx(dokumen.catatan)}</p> : null}
    </section>
  );
}
