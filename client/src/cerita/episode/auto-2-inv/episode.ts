/**
 * T-076 EPISODE 1 · INVESTIGATOR (pilot; spec docs/superpowers/specs/2026-11-20-episode-1-investigator-design.md, plan Task 1):
 * satu kasus 5 menit bergaya detektif di atas kasus truk trailer. Episode TERPISAH (id `auto-2-inv`, simpanan cerita sendiri,
 * rute pendek /cerita/investigator); Episode 1 lengkap (`auto-2`) dan Episode 1 Dev (`auto-2-dev`) tidak berubah: episode ini
 * hanya MEMAKAI ULANG latar, seni, pemeran, aktivitas SIM (auto-2) dan aktivitas dashcam (auto-2-dev).
 *
 * Fiksi kasus (keputusan Lead): catatan petugas tol menyebut truk di LAJUR 3 (terlarang untuk truk), jadi klaim terlihat tidak
 * dijamin; pemain membuktikan dengan dashcam bahwa truk di LAJUR 2. Putarannya MELINDUNGI nasabah yang jujur.
 *
 * Alur (b1-b4 = bagian di kepala layar; jenis investigasi tiap node di kurung, lihat NodeInvestigasi di cerita/tipe.ts):
 *  b1 judul (judul) -> buka -> darto (catat) -> tol (catat) -> selisih
 *  b2 kdash [arena dashcam] -> bukti-dashcam (bukti) -> bukti-rambu (bukti) -> ksim (periksa-sim, T-080) -> bukti-sim (bukti)
 *  b3 keb-buka -> keb0 (keberatan 0, PILIHAN) --tepat--> keb-cap
 *                    |--keliru--> keb0-<kartu> -> keb1 (keberatan 1, PILIHAN) --tepat--> keb-cap
 *                                                   |--keliru--> keb1-<kartu> -> keb2 (keberatan 2 dipandu, DIALOG) -> keb-cap
 *     keb-cap (cap) -> keb-akui (petugas memperbaiki catatannya)
 *  b4 putusan-buka -> putusan (putusan, PILIHAN) -> putusan-<x> -> pesan (PILIHAN di obrolan Pak Hendra) -> pesan-<x>
 *     -> akhir-cek -> akhir-tuntas | akhir-tinjau (hasil-investigasi; AKHIR)
 * Kekeliruan tidak pernah menghentikan pemain (tanpa nyawa, tanpa waktu): hanya poin yang berbeda. Kartu yang tepat (dashcam)
 * selalu terkumpul di jalur wajib sebelum keberatan; pilihan keberatan memakai `jika: bukti:<id>` supaya kartu yang belum
 * terkumpul tidak pernah bisa dipilih.
 *
 * Skor (cerita/investigasi/skor.ts) dibaca dari TANDA: keb:<tepat|tepat-kedua|dipandu>, putusan:<layak|tambahan|polis>,
 * pesan:<baik|datar|janji>. Dua akhir (penjaga episode mewajibkan >= 2): `tuntas` = putusan layak, `tinjau` = putusan lain
 * (diluruskan Miss Raksa; klaim tetap dijamin di kedua akhir). Status Pak Hendra (30 = Cemas) hanya berubah oleh pesan.
 */
import type { Baris, CueLatar, Efek, Ekspresi, Episode, IdNode, Kondisi, NodeCerita, NodeInvestigasi } from '../../tipe';
import { tandaBukti, tandaCatat, tandaKeberatan, tandaPesan, tandaPutusan } from '../../investigasi/status';
import { EPISODE_AUTO_2 } from '../auto-2/episode';
import { EPISODE_AUTO_2_DEV } from '../auto-2-dev/episode';
import { TEKS_AUTO_2_INV } from './teks';

type Siapa = 'missRaksa' | 'hendra' | 'bima' | 'darto' | 'tol' | 'narasi';
const b = (teks: string, siapa: Siapa, ekspresi?: Ekspresi, tata?: CueLatar): Baris => ({ siapa, teks, ...(ekspresi ? { ekspresi } : {}), ...(tata ? { tata } : {}) });
const tanda = (t: string): Kondisi => ({ tanda: t });

// Tata panggung (komposisi yang sudah dipakai auto-2: kantor + Miss Raksa, ruang wawancara 1-2 tokoh, obrolan Pak Hendra).
const KANTOR: CueLatar = { lokasi: 'kantor', hadir: ['missRaksa'], telepon: null, objek: [] };
const RUANG = (...hadir: string[]): CueLatar => ({ lokasi: 'wawancara', hadir, telepon: null, objek: [] });
/** Miss Raksa memandu lewat telepon (sisipan wajah) saat pemain di lapangan; tokoh di ruangan tetap. */
const RUANG_TELEPON = (...hadir: string[]): CueLatar => ({ lokasi: 'wawancara', hadir, telepon: 'missRaksa', objek: [] });
const TELEPON_HENDRA: CueLatar = { lokasi: 'kantor', hadir: [], telepon: 'hendra', objek: [] };

/** Urutan kartu di layar KEBERATAN: kartu yang tepat tidak di urutan pertama. */
export const URUTAN_KEBERATAN = ['rambu', 'dashcam', 'sim'] as const;
type IdBukti = (typeof URUTAN_KEBERATAN)[number];
const TEPAT: IdBukti = 'dashcam';

const dialog = (id: IdNode, tata: CueLatar, baris: Baris[], lanjut: IdNode, opsi: { efek?: Efek; investigasi?: NodeInvestigasi } = {}): NodeCerita =>
  ({ id, bab: '', jenis: 'dialog', tata, baris, lanjut, ...(opsi.efek ? { efek: opsi.efek } : {}), ...(opsi.investigasi ? { investigasi: opsi.investigasi } : {}) });

/** Percobaan keberatan ke-n (0 / 1) = node pilihan: kartu tepat -> cap; kartu keliru -> penjelasan Miss Raksa -> percobaan berikut. */
function keberatan(n: 0 | 1, pengantar: string, lanjutSalah: IdNode, kunciSalah: (id: IdBukti) => string): NodeCerita[] {
  const id = `keb${n}`;
  const pilihan: NodeCerita = {
    id, bab: '', jenis: 'pilihan', tata: RUANG('tol', 'darto'), baris: [b(pengantar, 'narasi')], tanya: 'inv.keb.tanya',
    investigasi: { jenis: 'keberatan', pernyataan: 'tol', tepat: TEPAT, percobaan: n },
    pilihan: URUTAN_KEBERATAN.map((x) => ({
      id: x,
      teks: `inv.keb.pilih.${x}`,
      jika: tanda(tandaBukti(x)),
      efek: { pasang: [x === TEPAT ? tandaKeberatan(n === 0 ? 'tepat' : 'tepat-kedua') : `keb:keliru:${n}:${x}`] },
      lanjut: x === TEPAT ? 'keb-cap' : `${id}-${x}`,
    })),
  };
  const salah = URUTAN_KEBERATAN.filter((x) => x !== TEPAT).map((x) =>
    dialog(`${id}-${x}`, RUANG_TELEPON('tol', 'darto'), [b(kunciSalah(x), 'missRaksa', n === 0 ? 'netral' : 'serius')], lanjutSalah));
  return [pilihan, ...salah];
}

function bangunNode(): NodeCerita[] {
  return [
    // ---------------------------------------------------------------- b1: kartu judul, pembuka, dua keterangan
    dialog('judul', KANTOR, [b('inv.judul.kartu', 'narasi')], 'buka', { investigasi: { jenis: 'judul' } }),
    dialog('buka', KANTOR, [b('inv.buka.1', 'missRaksa', 'tersenyum'), b('inv.buka.2', 'missRaksa', 'netral'), b('inv.buka.3', 'missRaksa', 'serius')], 'darto'),
    dialog('darto', RUANG('darto'), [b('inv.darto.1', 'narasi'), b('inv.darto.2', 'darto', 'cemas'), b('inv.darto.3', 'darto', 'serius')], 'tol',
      { efek: { pasang: [tandaCatat('darto')] }, investigasi: { jenis: 'catat', pernyataan: 'darto' } }),
    dialog('tol', RUANG('tol'), [b('inv.tol.1', 'narasi'), b('inv.tol.2', 'tol', 'netral'), b('inv.tol.3', 'tol', 'serius')], 'selisih',
      { efek: { pasang: [tandaCatat('tol')] }, investigasi: { jenis: 'catat', pernyataan: 'tol' } }),
    dialog('selisih', RUANG_TELEPON('tol'), [b('inv.selisih.1', 'missRaksa', 'serius')], 'kdash'),

    // ---------------------------------------------------------------- b2: tiga kartu bukti (dashcam, rambu dari bingkai rekaman, SIM)
    {
      id: 'kdash', bab: '', jenis: 'aktivitas', aktivitas: 'dashcam', langsung: true, tata: RUANG('darto'),
      baris: [b('inv.kdash.1', 'narasi'), b('inv.kdash.2', 'darto', 'netral')],
      hasil: [{ lanjut: 'bukti-dashcam' }],
    },
    dialog('bukti-dashcam', RUANG('darto'), [b('inv.bukti.dashcam.1', 'narasi')], 'bukti-rambu',
      { efek: { pasang: [tandaBukti('dashcam')] }, investigasi: { jenis: 'bukti', bukti: 'dashcam' } }),
    dialog('bukti-rambu', RUANG('darto'), [b('inv.bukti.rambu.1', 'narasi')], 'ksim',
      { efek: { pasang: [tandaBukti('rambu')] }, investigasi: { jenis: 'bukti', bukti: 'rambu' } }),
    // T-080 (Designer): periksa SIM DI MEJA wawancara (3 ketukan: golongan vs STNK, hologram, pindai QR), bukan arena SIM Satpas
    // Episode 1. Node dialog biasa + tampilan 'periksa-sim'; kartu bukti SIM tetap diberikan node 'bukti-sim' seperti semula.
    dialog('ksim', RUANG('darto'), [b('inv.sim.1', 'narasi'), b('inv.sim.2', 'darto', 'netral')], 'bukti-sim', { investigasi: { jenis: 'periksa-sim' } }),
    dialog('bukti-sim', RUANG('darto'), [b('inv.bukti.sim.1', 'narasi')], 'keb-buka',
      { efek: { pasang: [tandaBukti('sim')] }, investigasi: { jenis: 'bukti', bukti: 'sim' } }),

    // ---------------------------------------------------------------- b3: KEBERATAN (pernyataan petugas tol vs satu kartu bukti)
    dialog('keb-buka', RUANG('tol', 'darto'), [
      b('inv.keb-buka.1', 'narasi'),
      b('inv.keb-buka.2', 'tol', 'serius'),
      b('inv.keb-buka.3', 'missRaksa', 'serius', RUANG_TELEPON('tol', 'darto')),
    ], 'keb0'),
    ...keberatan(0, 'inv.keb.1', 'keb1', (x) => `inv.keb.salah.${x}`),
    ...keberatan(1, 'inv.keb.2', 'keb2', (x) => `inv.keb.pandu.${x}`),
    // Percobaan ketiga = dipandu: hanya kartu tepat yang melanjutkan (node dialog; ketukan kartu itu = lanjut).
    dialog('keb2', RUANG('tol', 'darto'), [b('inv.keb.3', 'narasi')], 'keb-cap',
      { efek: { pasang: [tandaKeberatan('dipandu')] }, investigasi: { jenis: 'keberatan', pernyataan: 'tol', tepat: TEPAT, percobaan: 2 } }),
    dialog('keb-cap', RUANG('tol', 'darto'), [b('inv.keb.cap', 'narasi')], 'keb-akui', { investigasi: { jenis: 'cap' } }),
    dialog('keb-akui', RUANG('tol', 'darto'), [b('inv.akui.1', 'tol', 'bingung'), b('inv.akui.2', 'tol', 'netral'), b('inv.akui.3', 'darto', 'lega')], 'putusan-buka'),

    // ---------------------------------------------------------------- b4: putusan, pesan untuk Pak Hendra, hasil
    dialog('putusan-buka', KANTOR, [b('inv.putusan.1', 'missRaksa', 'tersenyum'), b('inv.putusan.2', 'missRaksa', 'serius')], 'putusan'),
    {
      id: 'putusan', bab: '', jenis: 'pilihan', tata: KANTOR, baris: [b('inv.putusan.3', 'narasi')], tanya: 'inv.putusan.tanya',
      investigasi: { jenis: 'putusan' },
      pilihan: (['layak', 'tambahan', 'polis'] as const).map((x) => ({ id: x, teks: `inv.putusan.${x}`, efek: { pasang: [tandaPutusan(x)] }, lanjut: `putusan-${x}` })),
    },
    dialog('putusan-layak', KANTOR, [b('inv.putusan.layak.1', 'missRaksa', 'tersenyum')], 'pesan'),
    dialog('putusan-tambahan', KANTOR, [b('inv.putusan.tambahan.1', 'missRaksa', 'serius')], 'pesan'),
    dialog('putusan-polis', KANTOR, [b('inv.putusan.polis.1', 'missRaksa', 'serius')], 'pesan'),
    {
      id: 'pesan', bab: '', jenis: 'pilihan', tata: TELEPON_HENDRA, baris: [b('inv.pesan.1', 'narasi'), b('inv.pesan.2', 'hendra', 'cemas')], tanya: 'inv.pesan.tanya',
      pilihan: [
        { id: 'janji', teks: 'inv.pesan.janji', efek: { kepercayaan: 10, alasan: 'inv.pesan.janji.alasan', pasang: [tandaPesan('janji')] }, lanjut: 'pesan-janji' },
        { id: 'baik', teks: 'inv.pesan.baik', efek: { kepercayaan: 30, alasan: 'inv.pesan.baik.alasan', pasang: [tandaPesan('baik')] }, lanjut: 'pesan-baik' },
        { id: 'datar', teks: 'inv.pesan.datar', efek: { pasang: [tandaPesan('datar')] }, lanjut: 'pesan-datar' },
      ],
    },
    dialog('pesan-baik', TELEPON_HENDRA, [b('inv.pesan.baik.1', 'hendra', 'lega')], 'akhir-cek'),
    dialog('pesan-datar', TELEPON_HENDRA, [b('inv.pesan.datar.1', 'hendra', 'bingung'), b('inv.pesan.datar.2', 'narasi')], 'akhir-cek'),
    dialog('pesan-janji', TELEPON_HENDRA, [b('inv.pesan.janji.1', 'hendra', 'senang'), b('inv.pesan.janji.2', 'narasi')], 'akhir-cek'),
    { id: 'akhir-cek', bab: '', jenis: 'cabang', cabang: [{ jika: tanda(tandaPutusan('layak')), lanjut: 'akhir-tuntas' }], lainnya: 'akhir-tinjau' },
    ...(['tuntas', 'tinjau'] as const).map((akhir): NodeCerita => ({
      id: `akhir-${akhir}`, bab: '', jenis: 'akhir', akhir, tata: KANTOR,
      baris: [b(`inv.akhir.${akhir}.1`, 'missRaksa', akhir === 'tuntas' ? 'tersenyum' : 'netral')],
      investigasi: { jenis: 'hasil-investigasi' },
    })),
  ];
}

/** Bagian tiap node (kepala layar "BAGIAN n/4"; id b2 / b3 = musik pemeriksaan, hp/audioTema.ts). */
function babInv(id: IdNode): string {
  if (['judul', 'buka', 'darto', 'tol', 'selisih'].includes(id)) return 'b1';
  if (id.startsWith('kdash') || id.startsWith('ksim') || id.startsWith('bukti-')) return 'b2';
  if (id.startsWith('keb')) return 'b3';
  return 'b4';
}

function bangun(asal: Episode, dev: Episode): Episode {
  return {
    id: 'auto-2-inv',
    versi: 1,
    produk: 'AUTO',
    jenis: 'nyata',
    judul: 'judul',
    ringkas: 'ringkas',
    durasiMenit: 5,
    mulai: 'judul',
    pemeran: { missRaksa: asal.pemeran.missRaksa!, hendra: asal.pemeran.hendra!, bima: asal.pemeran.bima!, darto: asal.pemeran.darto!, tol: asal.pemeran.tol! },
    nasabah: 'hendra',
    bab: ([1, 2, 3, 4] as const).map((n) => ({ id: `b${n}`, judul: `inv.bab.${n}.judul`, tujuan: `inv.bab.${n}.tujuan` })),
    akhir: {
      tuntas: { judul: 'inv.akhir.tuntas.judul', ringkas: 'inv.akhir.tuntas.ringkas', nada: 'baik', pelajaran: ['inv.pelajaran.1'] },
      tinjau: { judul: 'inv.akhir.tinjau.judul', ringkas: 'inv.akhir.tinjau.ringkas', nada: 'campuran', pelajaran: ['inv.pelajaran.1'] },
    },
    paham: {},
    proses: {},
    catatan: {},
    kepercayaanAwal: 30,
    kepercayaanBatas: { min: 0, maks: 100 },
    labelSuasana: 'status',
    antarmuka: 'hp',
    seniArena: asal.seniArena,
    lampiran: asal.lampiran,
    suasana: asal.suasana,
    node: Object.fromEntries(bangunNode().map((n) => [n.id, { ...n, bab: babInv(n.id) }])),
    // Aktivitas dipakai ulang apa adanya: SIM (auto-2, T-049) dan rekaman dashcam (auto-2-dev, T-065..T-073).
    aktivitas: { dashcam: dev.aktivitas.dashcam! },
    teks: TEKS_AUTO_2_INV,
    bahasa: ['id', 'en', 'zh'],
    latar: asal.latar,
    tampilan: { teksBesar: true },
    investigasi: {
      kasus: 'kasus-1',
      nomor: 1,
      judul: 'inv.kasus.judul',
      pernyataan: [
        { id: 'darto', siapa: 'darto', teks: 'inv.pernyataan.darto' },
        { id: 'tol', siapa: 'petugasTol', teks: 'inv.pernyataan.tol' },
      ],
      // Urut terkumpul (buku catatan); urutan di layar keberatan = URUTAN_KEBERATAN.
      bukti: [
        { id: 'dashcam', judul: 'inv.bukti.dashcam.judul', sumber: 'inv.bukti.dashcam.sumber', ikon: 'rekaman' },
        { id: 'rambu', judul: 'inv.bukti.rambu.judul', sumber: 'inv.bukti.rambu.sumber', ikon: 'foto' },
        { id: 'sim', judul: 'inv.bukti.sim.judul', sumber: 'inv.bukti.sim.sumber', ikon: 'kartu' },
      ],
    },
  };
}

/**
 * Episode 1 Investigator. Build tanpa auto-2 (VITE_CERITA_TANPA=auto-2): vite.config ikut mengganti modul ini dengan rintisan
 * null, jadi isi kasusnya tidak terbawa lewat episode ini.
 */
export const EPISODE_AUTO_2_INV: Episode = bangun(EPISODE_AUTO_2, EPISODE_AUTO_2_DEV);
