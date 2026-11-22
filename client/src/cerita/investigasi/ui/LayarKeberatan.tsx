/**
 * T-077 / T-079: LAYAR KEBERATAN. T-079: pemain membantah DARI BUKU CATATANNYA: buku terbuka (BukuCatatan) dengan pernyataan yang
 * dibantah distabilo jingga di halaman "Keterangan" dan slip bukti yang bisa dipilih di halaman "Bukti"; pilih SATU slip lalu tekan
 * tombol besar "KEBERATAN!" -> onPilih(id). Tanpa nyawa, tanpa pewaktu; kekeliruan tidak pernah menghalangi:
 *   percobaan 0  pertanyaan + buku;
 *   percobaan 1  catatan tempel kuning berisi petunjuk + bagian gambar yang perlu dilihat disorot (baris nomor lajur di slip dashcam);
 *   percobaan 2  catatan tempel Miss Raksa ("berpikir") menuntun: hanya bukti yang tepat yang aktif (sudah terpilih), lainnya pudar.
 * Yang tampil hanya bukti di `bukti` (yang belum dikumpulkan tidak dikirim Task 1, jadi tidak bisa dipilih).
 * Props rencana: { pernyataan, bukti, percobaan, onPilih } (+ opsional tx; tepat = bukti yang benar, bawaan 'dashcam' sesuai desain).
 * T-088: gambar slip rekaman dashcam = tombol PERBESAR: lembar berisi kutipan yang dibantah + bingkai sebelum truk membanting
 * setir (keempat lajur bernomor, truk disorot) + "Pakai bukti ini" (memilih slip itu; KEBERATAN tetap ditekan pemain sendiri).
 * Ukur 360 x 640 (hitung; ruang isi 544): tanya 26 + label 20 / tempel 56..78 + buku (halaman atas 108, jilid 4, halaman bawah 210,
 * sampul 18 = 340) + tombol 56 + jarak 3 x 8 = 466 (percobaan 0) .. 524 px (percobaan 1 dan 2).
 * T-090 (Fullstack, kasus berbasis data; tanpa prop ini = persis seperti semula): `tanya` / `petunjuk1` / `petunjuk2` = teks
 * jadi kasus yang menggantikan teks kamus (kasus 2: pertanyaan kasus 3 baris = 78 px, dikirim HANYA di percobaan 0: 518 px);
 * `perbesar` = kartu yang gambarnya bisa diperbesar (bawaan ['dashcam']; lembar perbesarnya masih bingkai dashcam kasus 1).
 * T-115 (tanpa gulir; angka "Ukur" di atas tidak berlaku lagi, hitungan baru di team/HANDOFF.md "## T-115"): di layar ini kepala
 * halaman buku ("KETERANGAN 1", "BUKTI 3") tidak digambar, dan pada langkah dipandu di layar < 680 px hanya slip yang tepat yang
 * tampil (ui/muat.css). Dengan lebar huruf aplikasi yang sebenarnya layar ini 419..508 px (ruang isi 557).
 * T-127 (babak 2, masukan Pak Peterson butir 17: "buku catatan sebagai alat"; hitungan: team/HANDOFF.md "## T-127"):
 *  - `pasangan` (hanya percobaan 0): TEMUAN BERPASANGAN. Pemain memilih DUA catatan: satu keterangan (keping polaroid di halaman
 *    atas) dan satu bukti (slip di halaman bawah), lalu "KEBERATAN!". Keterangan yang dipilih hanya dinilai di layar ini:
 *    keliru pertama = penunjuk (`salah(id)`), keliru kedua = penjelasan (`alasan`) dan keterangan yang dibantah terpilih sendiri
 *    serta terkunci. Umpan baliknya LEMBAR kecil Miss Raksa (dialog, satu tombol tutup), bukan catatan di halaman: layar ini sudah
 *    516 px dari 557 px di 360 x 640, jadi catatan tempel tambahan tidak muat tanpa gulir. Tidak ada aksi mesin dan tidak ada percobaan bernilai yang terpakai. `onPilih(idBukti)` baru
 *    dipanggil saat keterangannya tepat, jadi pilihan bernilainya (id kartu, urutan percobaan) persis seperti semula.
 *  - `temuan` = baris temuan di slip bukti (tafsiran pemain / temuan terbukti), diteruskan ke BukuCatatan.
 *  - `zum(id)` = isi lembar perbesar untuk KARTU ITU (gambar bukti babak 2); undefined = bingkai dashcam bernomor seperti semula.
 * T-130 (tinjauan Codex T-131): lembar perbesar MEMBAWA id kartu yang dibuka. Dulu id itu dibuang dan "Pakai bukti ini" selalu
 * memilih 'dashcam' (bisa memilih kartu bernilai yang salah begitu kasus lain memakai perbesar). Sekarang: gambar = kartu yang
 * dibuka, judul lembar = judul kartu itu, dan "Pakai bukti ini" memilih kartu yang SAMA.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { t } from '../../../i18n';
import { Modal } from '../../../ui/kit';
import { BingkaiDashcam } from '../../hp/arena/ArenaDashcam';
import { BukuCatatan, PotretReaksi, type TemuanSlip } from './BukuCatatan';
import { useTx } from './dasar';
import './tambahan.css';
import type { Bukti, Pernyataan, Tx } from './dasar';
import './investigasi.css';

const PERBESAR_BAWAAN: readonly Bukti['id'][] = ['dashcam'];

/** T-127: temuan berpasangan (lihat kepala berkas). `pernyataan` = semua keterangan yang sudah tersemat, urut naskah. */
export interface PasanganKeberatan { pernyataan: Pernyataan[]; ket: string; salah: (id: string) => string; alasan: string }

export function LayarKeberatan({ pernyataan, bukti, percobaan, onPilih, tx, tepat = 'dashcam', tanya, petunjuk1, petunjuk2, perbesar = PERBESAR_BAWAAN, pasangan, temuan, zum: isiZum }: {
  pernyataan: Pernyataan;
  bukti: Bukti[];
  percobaan: 0 | 1 | 2;
  onPilih: (id: Bukti['id']) => void;
  tx?: Tx;
  tepat?: Bukti['id'];
  /** T-090: pertanyaan kasus (teks jadi) sebagai judul layar; tanpa nilai = "Bukti mana yang membantahnya?". */
  tanya?: string;
  /** T-090: catatan tempel percobaan kedua / dipandu (teks jadi); tanpa nilai = petunjuk kasus 1 di kamus. */
  petunjuk1?: string;
  petunjuk2?: string;
  /** T-090: kartu yang gambarnya bisa diperbesar (kasus tanpa rekaman dashcam mengirim []). */
  perbesar?: readonly Bukti['id'][];
  /** T-127: temuan berpasangan di percobaan pertama (tanpa nilai / satu keterangan saja = layar seperti semula). */
  pasangan?: PasanganKeberatan;
  /** T-127: baris temuan per id bukti di slipnya. */
  temuan?: Readonly<Record<string, TemuanSlip>>;
  /** T-127 / T-130: gambar lembar perbesar untuk kartu itu (pengganti bingkai dashcam bernomor); undefined = bingkai lama. */
  zum?: (id: Bukti['id']) => ReactNode | undefined;
}) {
  const dipandu = percobaan === 2;
  const [pilih, setPilih] = useState<Bukti['id'] | null>(dipandu ? tepat : null);
  // Percobaan baru = pilihan lama dilepas (dipandu: bukti yang tepat langsung terpilih).
  useEffect(() => { setPilih(percobaan === 2 ? tepat : null); }, [percobaan, tepat]);
  // T-088: rekaman dashcam bisa DIPERBESAR (ketuk gambar slipnya) di samping kutipan yang dibantah, sebelum memutuskan.
  const [zum, setZum] = useState<Bukti['id'] | null>(null);
  const teks = useTx(tx);
  const kartuZum = zum ? bukti.find((x) => x.id === zum) : undefined;
  const gambarZum = zum ? isiZum?.(zum) : undefined;
  // T-127: temuan berpasangan. Keterangan yang dipilih + jumlah kekeliruan memilihnya hanya hidup di layar ini.
  const berpasangan = percobaan === 0 && !!pasangan && pasangan.pernyataan.length > 1;
  const [ket, setKet] = useState<string | null>(null);
  const [keliruKet, setKeliruKet] = useState(0);
  const [catatan, setCatatan] = useState<string | null>(null);
  const ajukan = () => {
    if (!pilih) return;
    if (berpasangan && pasangan && ket !== pernyataan.id) {
      if (!ket) return;
      const n = keliruKet + 1;
      setKeliruKet(n);
      // Keliru pertama: penunjuk untuk keterangan itu, pilihannya dilepas. Keliru kedua: penjelasan, keterangan yang dibantah terpilih.
      if (n === 1) { setCatatan(pasangan.salah(ket)); setKet(null); } else { setCatatan(pasangan.alasan); setKet(pernyataan.id); }
      return;
    }
    onPilih(pilih);
  };
  const siap = !!pilih && (!berpasangan || !!ket);
  return (
    <section className="iv-layar iv-keberatan" data-layar-keberatan="" data-percobaan={percobaan} data-berpasangan={berpasangan ? '' : undefined} aria-labelledby="iv-keberatan-tanya">
      <h2 id="iv-keberatan-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tanya ?? t('investigasi.keberatan.tanya')}</h2>
      {percobaan === 0 ? <p className="iv-label">{berpasangan && pasangan ? pasangan.ket : t('investigasi.keberatan.pilih')}</p> : null}
      {berpasangan && catatan ? (
        <Modal judul={t(keliruKet >= 2 ? 'investigasi.formatif.penjelasan' : 'investigasi.formatif.sumber')} onTutup={() => setCatatan(null)} lebar={420}>
          <p className="iv-tempel iv-pandu iv-pasang-catatan" role="status" data-pasang-catatan={keliruKet >= 2 ? 'alasan' : 'penunjuk'}><PotretReaksi reaksi="miss-berpikir" ukuran={48} /><span>{catatan}</span></p>
        </Modal>
      ) : null}
      {percobaan === 1 ? <p className="iv-tempel" role="status">{petunjuk1 ?? t('investigasi.keberatan.petunjuk1')}</p> : null}
      {dipandu ? (
        <p className="iv-tempel iv-pandu" role="status">
          <PotretReaksi reaksi="miss-berpikir" ukuran={48} />
          <span>{petunjuk2 ?? t('investigasi.keberatan.petunjuk2')}</span>
        </p>
      ) : null}
      <BukuCatatan pernyataan={berpasangan && pasangan ? pasangan.pernyataan : [pernyataan]} bukti={bukti} tx={tx} sorotPernyataan={berpasangan ? undefined : pernyataan.id} tanpaPensil temuan={temuan}
        pilihPernyataan={berpasangan ? { terpilih: ket, terkunci: keliruKet >= 2, onPilih: setKet } : undefined}
        pilihBukti={{ terpilih: pilih, sorot: percobaan >= 1 ? tepat : null, redup: (id) => dipandu && id !== tepat, onPilih: setPilih, bisaPerbesar: perbesar, onPerbesar: (id) => setZum(id) }} />
      {zum ? (
        <Modal judul={gambarZum && kartuZum ? teks(kartuZum.judul) : t('investigasi.keberatan.zumJudul')} onTutup={() => setZum(null)} lebar={420}>
          <div className="iv-zum">
          {/* T-127: selama pemain masih MEMILIH keterangannya (temuan berpasangan), kutipan yang dibantah tidak ditunjukkan di sini */}
          {berpasangan && ket !== pernyataan.id ? null : <p className="iv-zum-kutip"><b>{t(`investigasi.siapa.${pernyataan.siapa}`)}</b><q>{teks(pernyataan.teks)}</q></p>}
          {gambarZum ?? <BingkaiDashcam besar potong="lajur" sorotTruk />}
          {gambarZum ? null : <p className="iv-label">{t('investigasi.keberatan.zumKet')}</p>}
          <button type="button" className="primary-action iv-tombol" data-zum-pakai={zum} onClick={() => { if (zum) setPilih(zum); setZum(null); }}>{t('investigasi.keberatan.zumPakai')}</button>
          </div>
        </Modal>
      ) : null}
      <button type="button" className="primary-action iv-tombol iv-tombol-keberatan" data-keberatan="" disabled={!siap} onClick={ajukan}>
        {siap ? t('investigasi.keberatan.tombol') : berpasangan ? t('investigasi.pasang.belum') : t('investigasi.keberatan.belum')}
      </button>
    </section>
  );
}
