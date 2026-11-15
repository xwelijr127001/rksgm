/**
 * VALIDASI EPISODE (dijaga tes; docs/rancangan-mode-cerita.md bagian 2.5).
 *
 *  - validasiEpisode(ep): daftar pesan (Bahasa Indonesia) untuk setiap pelanggaran aturan data; [] = sah.
 *  - jelajahiSemuaJalur(ep): menjalankan MESIN SUNGGUHAN (mesin.ts) ke semua kombinasi pilihan & jawaban
 *    aktivitas, memastikan setiap jalur berakhir (tanpa jalan buntu / putaran / melewati batas langkah).
 *  - (v3) cue adegan & `panggung` (docs/cerita/ADEGAN-AUTO1.md bagian 4): nilai dikenal, aksi hanya di baris, dan
 *    alur kehadiran masuk akal di graf (Bu Rina tidak duduk lagi sesudah pergi tanpa masuk, tidak bicara saat tidak
 *    hadir, tidak di kursi kantor pada adegan telepon).
 *
 * Kode ini hanya membaca episode; tidak mengimpor server/ atau kunci pertandingan.
 */
import { DAFTAR_BAHASA, type Bahasa } from '@shared/bahasa';
import type { StepKey } from '@shared/scoring';
import type { MissionAnswer, MissionPublic, StepAnswer, StepDef } from '@shared/types';
import { JUMLAH_LAJUR as JUMLAH_LAJUR_ASET, LAJUR_TRUK as LAJUR_TRUK_ASET } from './lokasi/seni/geometri';
import { jalankan, pilihanTersedia, semuaBarisTampil, stateAwal } from './mesin';
import {
  DAFTAR_EKSPRESI, DAFTAR_LATAR, DAFTAR_LOKASI_ADEGAN, type AksiCerita, type Baris, type CueAdegan, type CueLatar, type DefAktivitas, type Efek, type Ekspresi, type Episode,
  type IdAkhir, type IdLokasiAdegan, type IdNode, type Kondisi, type NilaiProses, type NodeCerita, type StateCerita,
} from './tipe';
import { DAFTAR_AKSI_ADEGAN, DAFTAR_PANDANG, DAFTAR_PROP_ADEGAN, DAFTAR_TEMPAT_PROP, JENIS_POSE_MENTOR, JENIS_POSE_NASABAH } from './ui/adegan';

const NILAI_PROSES: readonly NilaiProses[] = ['tepat', 'dikoreksi', 'keliru'];
const PRODUK = ['AUTO', 'HVC', 'FIRE', 'CARGO', 'MIX'];
const POTRET = ['nasabah', 'missRaksa', 'pemain', 'tokoh'];
const NADA = ['baik', 'campuran', 'buruk'];
const PEMBICARA_BAWAAN = ['pemain', 'narasi'];

const ada = (rec: object | null | undefined, kunci: string): boolean => !!rec && Object.prototype.hasOwnProperty.call(rec, kunci);
const teksSah = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;

/** Tetangga graf sebuah node (tanpa melihat kondisi). */
function tetangga(n: NodeCerita): IdNode[] {
  switch (n.jenis) {
    case 'dialog': return [n.lanjut];
    case 'pilihan': return (n.pilihan ?? []).map((p) => p.lanjut);
    case 'aktivitas': return (n.hasil ?? []).map((h) => h.lanjut);
    case 'cabang': return [...(n.cabang ?? []).map((c) => c.lanjut), n.lainnya];
    default: return [];
  }
}

/** Parameter {nama} dalam teks, urut & unik. */
const parameter = (s: string): string[] => [...new Set(s.match(/\{(\w+)\}/g) ?? [])].sort();
/** Parameter yang diisi teksCerita: {nama} dari pemanggil, {lokasi} dari `Episode.panggung.lokasi.nama` (v3). */
const PARAMETER_SAH = ['{nama}', '{lokasi}'];
/** Parameter tambahan HANYA untuk teks arena rambu (K08): nama rambu, daftar lajur yang ditandai/disebut, dan lajur truk; diisi komponen, bukan naskah. */
const PARAMETER_ARENA_RAMBU = ['{rambu}', '{tanda}', '{tulisan}', '{truk}', '{lajur}'];
const TEMA_PANGGUNG = ['silver'];

// ------------------------------------------------------------------ cue adegan (v3)

/**
 * Tempat cue: awal episode, node, baris dialog (panggung), atau baris yang tampil di layar aktivitas (baris node
 * aktivitas = kartu pengantar; umpan balik aktivitas), yang tidak memutar aksi panggung.
 */
type TempatCue = 'awal' | 'node' | 'baris' | 'aktivitas' | 'umpan';
const ALASAN_TANPA_AKSI: Record<Exclude<TempatCue, 'baris'>, string> = {
  awal: 'komposisi awal tidak diputar sebagai aksi',
  node: 'cue node berlaku untuk seluruh node; aksi milik satu baris',
  aktivitas: 'baris node aktivitas tampil di kartu aktivitas, bukan panggung',
  umpan: 'umpan balik tampil di layar aktivitas, bukan panggung',
};

/** Periksa bentuk & kosakata satu cue. Mengembalikan pesan (kosong = sah). */
function periksaCue(cue: unknown, tempat: string, di: TempatCue): string[] {
  const pesan: string[] = [];
  const salah = (p: string) => pesan.push(`${tempat}: ${p}`);
  if (cue === undefined) return pesan;
  if (!cue || typeof cue !== 'object' || Array.isArray(cue)) return [`${tempat}: cue adegan harus berupa objek`];
  const c = cue as Record<string, unknown>;
  for (const k of Object.keys(c)) if (!['lokasi', 'mentor', 'nasabah', 'aksi', 'prop'].includes(k)) salah(`bidang cue "${k}" tidak dikenal`);
  if (c.lokasi !== undefined) {
    if (!DAFTAR_LOKASI_ADEGAN.includes(c.lokasi as IdLokasiAdegan)) salah(`lokasi adegan "${String(c.lokasi)}" tidak dikenal`);
    else if (c.lokasi === 'pintu-luar') salah('lokasi "pintu-luar" hanya untuk pembuka panggung, bukan nilai cue');
  }
  const cekTokoh = (nama: 'mentor' | 'nasabah', jenisPose: Readonly<Record<string, string>>, bidang: string[]) => {
    const t = c[nama];
    if (t === undefined || t === null) return;
    if (typeof t !== 'object' || Array.isArray(t)) {
      salah(`${nama} harus objek atau null`);
      return;
    }
    const o = t as Record<string, unknown>;
    for (const k of Object.keys(o)) if (!bidang.includes(k)) salah(`${nama}: bidang "${k}" tidak dikenal`);
    if (o.pose !== undefined) {
      const jenis = typeof o.pose === 'string' && ada(jenisPose, o.pose) ? jenisPose[o.pose] : undefined;
      if (!jenis) salah(`pose ${nama} "${String(o.pose)}" tidak dikenal`);
      else if (jenis === 'aksi') salah(`pose ${nama} "${String(o.pose)}" hanya bingkai animasi aksi (masuk/pergi), bukan nilai cue`);
      else if (jenis === 'gerak' && (di === 'awal' || di === 'node')) salah(`pose ${nama} "${String(o.pose)}" hanya berlaku satu baris; pakai di cue baris, bukan cue ${di}`);
    }
    if (o.pandang !== undefined && !DAFTAR_PANDANG.includes(o.pandang as never)) salah(`pandang ${nama} "${String(o.pandang)}" tidak dikenal`);
    if (o.lewatTelepon !== undefined && typeof o.lewatTelepon !== 'boolean') salah(`${nama}.lewatTelepon harus true/false`);
  };
  cekTokoh('mentor', JENIS_POSE_MENTOR, ['pose', 'pandang']);
  cekTokoh('nasabah', JENIS_POSE_NASABAH, ['pose', 'pandang', 'lewatTelepon']);
  if (c.prop !== undefined) {
    if (!c.prop || typeof c.prop !== 'object' || Array.isArray(c.prop)) salah('prop harus objek');
    else {
      for (const [id, tempatProp] of Object.entries(c.prop)) {
        if (!DAFTAR_PROP_ADEGAN.includes(id as never)) salah(`prop "${id}" tidak dikenal`);
        if (!DAFTAR_TEMPAT_PROP.includes(tempatProp as never)) salah(`prop "${id}": tempat "${String(tempatProp)}" tidak dikenal`);
      }
    }
  }
  if (c.aksi !== undefined) {
    const n = c.nasabah as CueAdegan['nasabah'];
    const prop = (c.prop ?? {}) as CueAdegan['prop'];
    if (!DAFTAR_AKSI_ADEGAN.includes(c.aksi as never)) salah(`aksi "${String(c.aksi)}" tidak dikenal`);
    else if (di !== 'baris') salah(`aksi "${String(c.aksi)}" hanya di cue baris dialog (${ALASAN_TANPA_AKSI[di]})`);
    else if (c.aksi === 'masuk' && !(n && n.lewatTelepon !== true)) salah('aksi masuk wajib menetapkan nasabah yang hadir (pose sesudah masuk)');
    else if (c.aksi === 'pergi' && n !== null) salah('aksi pergi wajib menetapkan nasabah: null (tidak hadir sesudahnya)');
    else if (c.aksi === 'kartu' && prop?.kartu !== 'meja') salah('aksi kartu wajib memindahkan prop kartu ke meja');
    else if (c.aksi === 'pindah' && c.lokasi === undefined && n === undefined) salah('aksi pindah wajib mengubah lokasi atau kehadiran nasabah');
  }
  return pesan;
}

/** Keadaan kehadiran untuk analisis alur: lokasi | mentor | nasabah (hadir di bingkai / telepon / absen). */
type Hadir = 'hadir' | 'telepon' | 'absen';
interface Alur { lokasi: IdLokasiAdegan; mentor: boolean; nasabah: Hadir }
const kunciAlur = (a: Alur): string => `${a.lokasi}|${a.mentor ? 1 : 0}|${a.nasabah}`;
const bacaAlur = (s: string): Alur => {
  const [lokasi, m, n] = s.split('|');
  return { lokasi: lokasi as IdLokasiAdegan, mentor: m === '1', nasabah: n as Hadir };
};

function alirCue(a: Alur, cue: CueAdegan | undefined): Alur {
  if (!cue || typeof cue !== 'object') return a;
  const lokasi = cue.lokasi && DAFTAR_LOKASI_ADEGAN.includes(cue.lokasi) ? cue.lokasi : a.lokasi;
  const mentor = cue.mentor === null ? false : cue.mentor ? true : a.mentor;
  let nasabah = a.nasabah;
  if (cue.nasabah === null) nasabah = 'absen';
  else if (cue.nasabah) {
    nasabah = cue.nasabah.lewatTelepon === true ? 'telepon' : cue.nasabah.lewatTelepon === false ? 'hadir' : a.nasabah === 'telepon' ? 'telepon' : 'hadir';
  }
  return { lokasi, mentor, nasabah };
}

/**
 * Alur kehadiran di graf (tanpa melihat kondisi: baris ber-`jika` boleh tampil atau tidak). Pesan:
 *  - Bu Rina hadir di bingkai tanpa aksi masuk padahal sebelumnya tidak hadir / lewat telepon (mis. duduk lagi sesudah
 *    pergi atau sesudah waktu berlalu);
 *  - lokasi telepon (kursi pengunjung kosong) dengan Bu Rina di bingkai;
 *  - pembicara (nasabah / mentor) tidak hadir saat barisnya tampil;
 *  - aksi masuk padahal pasti sudah hadir, aksi pergi padahal pasti tidak hadir.
 */
function periksaAlurAdegan(ep: Episode, tetanggaNode: (n: NodeCerita) => IdNode[]): string[] {
  const pesan = new Set<string>();
  const node = ep.node ?? {};
  if (!ep.panggung || !ada(node, ep.mulai)) return [];
  const mentorId = Object.entries(ep.pemeran ?? {}).filter(([, p]) => p?.potret === 'missRaksa').map(([id]) => id);
  const awal: Alur = alirCue({ lokasi: 'meja', mentor: true, nasabah: 'absen' }, ep.panggung.awal);

  /** Terapkan satu cue ke himpunan keadaan, periksa, kembalikan himpunan baru. */
  const terapkan = (masuk: Set<string>, cue: CueAdegan | undefined, tempat: string, siapa?: string, opsional = false): Set<string> => {
    const keluar = new Set<string>(opsional ? masuk : []);
    const sebelum = [...masuk].map(bacaAlur);
    if (cue?.aksi === 'masuk' && sebelum.length && sebelum.every((a) => a.nasabah === 'hadir')) pesan.add(`${tempat}: aksi masuk padahal Bu Rina sudah hadir`);
    if (cue?.aksi === 'pergi' && sebelum.length && sebelum.every((a) => a.nasabah === 'absen')) pesan.add(`${tempat}: aksi pergi padahal Bu Rina tidak hadir`);
    for (const a of sebelum) {
      const b = alirCue(a, cue);
      if (b.nasabah === 'hadir' && a.nasabah !== 'hadir' && cue?.aksi !== 'masuk') {
        pesan.add(`${tempat}: Bu Rina hadir di bingkai tanpa aksi masuk (sebelumnya ${a.nasabah === 'absen' ? 'tidak hadir, mis. sudah pergi' : 'hanya lewat telepon'})`);
      }
      if (b.lokasi === 'telepon' && b.nasabah === 'hadir') pesan.add(`${tempat}: lokasi telepon berarti kursi pengunjung kosong; Bu Rina hanya boleh lewatTelepon atau tidak hadir`);
      if (siapa !== undefined && siapa === ep.nasabah && b.nasabah === 'absen') pesan.add(`${tempat}: Bu Rina bicara padahal tidak hadir (beri cue lewatTelepon, atau aksi masuk)`);
      if (siapa !== undefined && mentorId.includes(siapa) && !b.mentor) pesan.add(`${tempat}: Miss Raksa bicara padahal tidak hadir`);
      keluar.add(kunciAlur(b));
    }
    return keluar;
  };
  const lipatBaris = (masuk: Set<string>, baris: Baris[] | undefined, tempat: string): Set<string> => {
    let s = masuk;
    (Array.isArray(baris) ? baris : []).forEach((b, i) => {
      s = terapkan(s, b.adegan, `${tempat}.baris[${i}] (${String(b.teks)})`, b.siapa, b.jika !== undefined);
    });
    return s;
  };

  const masukNode = new Map<IdNode, Set<string>>([[ep.mulai, new Set([kunciAlur(awal)])]]);
  const antre: IdNode[] = [ep.mulai];
  for (let putaran = 0; antre.length && putaran < 10_000; putaran++) {
    const id = antre.shift()!;
    const n = node[id];
    if (!n) continue;
    const tempat = `node "${id}"`;
    let s = terapkan(masukNode.get(id)!, n.adegan, `${tempat}.adegan`);
    if (n.jenis !== 'cabang') s = lipatBaris(s, n.baris, tempat);
    if (n.jenis === 'aktivitas') {
      const gabung = new Set<string>();
      (n.hasil ?? []).forEach((h, i) => {
        for (const x of lipatBaris(s, h.umpanBalik, `${tempat}.hasil[${i}].umpanBalik`)) gabung.add(x);
      });
      s = gabung.size ? gabung : s;
    }
    for (const t of tetanggaNode(n)) {
      if (!ada(node, t)) continue;
      const lama = masukNode.get(t) ?? new Set<string>();
      const ukuran = lama.size;
      for (const x of s) lama.add(x);
      if (!masukNode.has(t) || lama.size !== ukuran) {
        masukNode.set(t, lama);
        antre.push(t);
      }
    }
  }
  return [...pesan];
}

/**
 * Angka dalam teks, dinormalkan seperti penjaga angka kamus UI (i18n/terjemahan.test.ts): tanpa pemisah
 * ribuan/desimal dan tanpa nol di depan ("Rp100.000" = "100000", "03" = "3").
 */
const angka = (s: string): string[] => (s.match(/\d[\d.,]*\d|\d/g) ?? []).map((x) => x.replace(/[.,]/g, '').replace(/^0+(?=\d)/, ''));

/**
 * Selisih angka sumber (id) vs terjemahan. `hilang` = angka id yang tidak ada di terjemahan; `tambahan` =
 * angka yang hanya ada di terjemahan. zh boleh menambah angka bulan 1-12 (tanggal "9月26日").
 */
function selisihAngka(sumber: string, terjemahan: string, bahasa: Bahasa): { hilang: string[]; tambahan: string[] } {
  const sisa = angka(terjemahan);
  const hilang: string[] = [];
  for (const n of angka(sumber)) {
    const i = sisa.indexOf(n);
    if (i < 0) hilang.push(n);
    else sisa.splice(i, 1);
  }
  const tambahan = sisa.filter((n) => !(bahasa === 'zh' && n.length <= 2 && Number(n) >= 1 && Number(n) <= 12));
  return { hilang, tambahan };
}

/** Tanda-tangan akibat pilihan (lanjut + efek, tanpa teks alasan) untuk mendeteksi cabang palsu. */
function tandaTanganAkibat(lanjut: IdNode, efek: Efek | undefined): string {
  const urut = (x: string[] | undefined) => [...new Set(x ?? [])].sort();
  return JSON.stringify({
    lanjut,
    pasang: urut(efek?.pasang),
    cabut: urut(efek?.cabut),
    kepercayaan: efek?.kepercayaan || 0,
    paham: urut(efek?.paham),
    catat: urut(efek?.catat),
    proses: Object.entries(efek?.proses ?? {}).sort(([a], [b]) => a.localeCompare(b)),
  });
}

function misiAman(ep: Episode, idAkt: string, bahasa: Bahasa): MissionPublic | null {
  try {
    const m = ep.aktivitas[idAkt]!.misi(bahasa);
    return m && typeof m === 'object' && Array.isArray(m.steps) ? m : null;
  } catch {
    return null;
  }
}

/**
 * Opsi yang pernah ada di misi lalu dihapus (`opsiPensiun` pada definisi aktivitas, docs/rancangan-mode-cerita.md
 * 11.5): tanda `akt:<id>:pilih:<opsi>` dari simpanan lama tetap boleh dibaca kondisi (mis. baris umpan balik khusus
 * opsi itu). Nilai non-string diabaikan (data episode yang rusak).
 */
function opsiPensiun(def: DefAktivitas): string[] {
  const x: unknown = def.opsiPensiun;
  return Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : [];
}

/** Id opsi / item per langkah misi. */
function idOpsi(step: StepDef): string[] {
  if (step.kind === 'single' || step.kind === 'multi') return step.options.map((o) => o.id);
  if (step.kind === 'assign' || step.kind === 'order') return step.items.map((o) => o.id);
  return [];
}

// ------------------------------------------------------------------ arena antarmuka HP

/**
 * Konfigurasi arena (DefAktivitas.arena) harus cocok dengan misi sintetisnya: langkah ada & jenisnya sesuai pola, benda
 * = semua item langkah (tanpa tambahan), wadah/tujuan/perlakuan = semua wadah langkah, pilihan bundel = semua opsi.
 * Gambar, tokoh, tabel/dokumen fakta, dan kunci teks yang dirujuk harus ada. Arena dan antarmuka standar menilai
 * jawaban yang sama, jadi ketidakcocokan berarti pilihan yang tidak bisa dipilih (atau dipilih tanpa dinilai).
 */
function periksaArena(
  ep: Episode, def: DefAktivitas, misi: MissionPublic, tempat: string, salah: (p: string) => void, teks: (k: unknown, t: string) => void,
): void {
  const k = def.arena;
  if (!k) return;
  const t = `${tempat}.arena`;
  const seni = (id: string | undefined, di: string) => {
    if (id !== undefined && !ada(ep.seniArena ?? {}, id)) salah(`${di}: gambar "${id}" tidak ada di episode.seniArena`);
  };
  const sama = (a: string[], b: string[], apa: string, di: string) => {
    const kurang = b.filter((x) => !a.includes(x));
    const lebih = a.filter((x) => !b.includes(x));
    if (kurang.length) salah(`${di}: ${apa} misi tidak ada di arena: ${kurang.join(', ')}`);
    if (lebih.length) salah(`${di}: ${apa} arena tidak ada di misi: ${lebih.join(', ')}`);
    if (new Set(a).size !== a.length) salah(`${di}: ${apa} arena dobel`);
  };
  const langkah = (id: string, jenis: 'assign' | 'single') => {
    const st = misi.steps.find((x) => x.id === id);
    if (!st) salah(`${t}: langkah "${id}" tidak ada di misi`);
    else if (st.kind !== jenis) salah(`${t}: langkah "${id}" harus ${jenis} (misi: ${st.kind})`);
    return st ?? null;
  };
  const tujuan = (x: { id: string; label: string; arti?: string; seni?: string }, di: string) => {
    teks(x.label, `${di}.label`);
    if (x.arti !== undefined) teks(x.arti, `${di}.arti`);
    seni(x.seni, di);
  };
  const benda = (b: { id: string; nama?: string; keterangan?: string; seni?: string; tokoh?: { id: string } }, di: string) => {
    if (b.nama !== undefined) teks(b.nama, `${di}.nama`);
    if (b.keterangan !== undefined) teks(b.keterangan, `${di}.keterangan`);
    seni(b.seni, di);
    if (b.tokoh && !ada(ep.pemeran ?? {}, b.tokoh.id)) salah(`${di}: tokoh "${b.tokoh.id}" tidak ada di pemeran`);
    if (!b.seni && !b.tokoh) salah(`${di}: benda tanpa gambar atau tokoh`);
  };
  teks(k.tanya, `${t}.tanya`);
  if (k.catatan !== undefined) teks(k.catatan, `${t}.catatan`);
  if (k.fakta?.tabel !== undefined && !(misi.tables ?? []).some((x) => x.id === k.fakta!.tabel)) salah(`${t}.fakta: tabel "${k.fakta.tabel}" tidak ada di misi`);
  if (k.fakta?.dokumen !== undefined && !ada(ep.dokumen ?? {}, k.fakta.dokumen)) salah(`${t}.fakta: dokumen "${k.fakta.dokumen}" tidak ada di episode.dokumen`);
  if (k.catatanBenda !== undefined && !(k.pola === 'susun' && k.benda.some((b) => b.id === k.catatanBenda))) salah(`${t}.catatanBenda: "${k.catatanBenda}" bukan benda arena susun ini`);
  switch (k.pola) {
    case 'susun': {
      teks(k.satuan, `${t}.satuan`);
      const st = langkah(k.langkah, 'assign');
      k.benda.forEach((b, i) => benda(b, `${t}.benda[${i}]`));
      k.wadah.forEach((w, i) => tujuan(w, `${t}.wadah[${i}]`));
      if (st?.kind === 'assign') {
        sama(k.benda.map((b) => b.id), st.items.map((x) => x.id), 'item', t);
        sama(k.wadah.map((w) => w.id), st.buckets.map((x) => x.id), 'wadah', t);
      }
      break;
    }
    case 'tujuan': {
      const st = langkah(k.langkah, 'assign');
      benda(k.benda, `${t}.benda`);
      k.tujuan.forEach((w, i) => tujuan(w, `${t}.tujuan[${i}]`));
      if (st?.kind === 'assign') {
        sama([k.benda.id], st.items.map((x) => x.id), 'item', t);
        sama(k.tujuan.map((w) => w.id), st.buckets.map((x) => x.id), 'wadah', t);
      }
      break;
    }
    case 'bandingkan': {
      const st = langkah(k.langkah, 'assign');
      teks(k.sumber.kiri, `${t}.sumber.kiri`);
      teks(k.sumber.kanan, `${t}.sumber.kanan`);
      k.selisih.forEach((x, i) => { teks(x.label, `${t}.selisih[${i}].label`); if (x.catatan !== undefined) teks(x.catatan, `${t}.selisih[${i}].catatan`); });
      k.perlakuan.forEach((w, i) => tujuan(w, `${t}.perlakuan[${i}]`));
      if (st?.kind === 'assign') {
        sama(k.selisih.map((x) => x.id), st.items.map((x) => x.id), 'item', t);
        sama(k.perlakuan.map((w) => w.id), st.buckets.map((x) => x.id), 'wadah', t);
      }
      break;
    }
    case 'bundel': {
      for (const [nama, bagian] of [['tindakan', k.tindakan], ['kabar', k.kabar]] as const) {
        const st = langkah(bagian.langkah, 'single');
        teks(bagian.tanya, `${t}.${nama}.tanya`);
        bagian.pilihan.forEach((w, i) => tujuan(w, `${t}.${nama}.pilihan[${i}]`));
        if (st?.kind === 'single') sama(bagian.pilihan.map((w) => w.id), st.options.map((x) => x.id), 'opsi', `${t}.${nama}`);
      }
      if (k.fakta?.tabel === undefined) salah(`${t}: pola bundel butuh fakta.tabel (isi bundel)`);
      if (k.meja) {
        // Meja kasus (prototipe D-68): berkas seurutan baris tabel fakta; tiap pilihan tindakan punya tempat sendiri.
        const m = k.meja;
        const tabel = (misi.tables ?? []).find((x) => x.id === k.fakta?.tabel);
        if (tabel && tabel.rows.length !== m.berkas.length) salah(`${t}.meja: ${m.berkas.length} berkas, tabel fakta ${tabel.rows.length} baris`);
        if (new Set(m.berkas.map((b) => b.id)).size !== m.berkas.length) salah(`${t}.meja: id berkas dobel`);
        m.berkas.forEach((b, i) => {
          teks(b.singkat, `${t}.meja.berkas[${i}].singkat`);
          if (b.rincian !== undefined) teks(b.rincian, `${t}.meja.berkas[${i}].rincian`);
          seni(b.seni, `${t}.meja.berkas[${i}]`);
        });
        for (const [n, v] of Object.entries(m.objek)) teks(v, `${t}.meja.objek.${n}`);
        teks(m.statusAwal, `${t}.meja.statusAwal`);
        sama(Object.keys(m.tindakan), k.tindakan.pilihan.map((p) => p.id), 'pilihan tindakan', `${t}.meja.tindakan`);
        const tempat = Object.values(m.tindakan).map((x) => x.tempat);
        if (new Set(tempat).size !== tempat.length) salah(`${t}.meja.tindakan: dua tindakan memakai tempat yang sama`);
        for (const [id, x] of Object.entries(m.tindakan)) {
          teks(x.status, `${t}.meja.tindakan.${id}.status`);
          if (x.singkat !== undefined) teks(x.singkat, `${t}.meja.tindakan.${id}.singkat`);
        }
      }
      break;
    }
    case 'rambu': {
      if (k.jumlahLajur !== JUMLAH_LAJUR_ASET || k.lajurTruk !== LAJUR_TRUK_ASET) salah(`${t}: jumlah lajur/lajur truk harus sama dengan aset jalan (${JUMLAH_LAJUR_ASET}/${LAJUR_TRUK_ASET})`);
      const ids = new Set<string>();
      k.rambu.forEach((r, i) => {
        const st = langkah(r.langkah, 'assign');
        teks(r.label, `${t}.rambu[${i}].label`); teks(r.isi, `${t}.rambu[${i}].isi`); teks(r.petunjuk, `${t}.rambu[${i}].petunjuk`);
        if (r.tulisan?.some((n) => !Number.isInteger(n) || n < 1 || n > k.jumlahLajur)) salah(`${t}.rambu[${i}].tulisan: nomor lajur di luar jalan`);
        if (st?.kind === 'assign') {
          const item = Array.from({ length: k.jumlahLajur }, (_, n) => `${r.awalanItem}${n + 1}`);
          item.forEach((x) => { if (ids.has(x)) salah(`${t}.rambu[${i}]: item "${x}" dobel antar-rambu`); ids.add(x); });
          sama(item, st.items.map((x) => x.id), 'item', `${t}.rambu[${i}]`);
          sama([r.wadah], st.buckets.map((x) => x.id), 'wadah', `${t}.rambu[${i}]`);
        }
      });
      const st = langkah(k.simpul.langkah, 'single');
      teks(k.simpul.tanya, `${t}.simpul.tanya`);
      k.simpul.pilihan.forEach((w, i) => tujuan(w, `${t}.simpul.pilihan[${i}]`));
      if (st?.kind === 'single') sama(k.simpul.pilihan.map((w) => w.id), st.options.map((x) => x.id), 'opsi', `${t}.simpul`);
      for (const id of Object.keys(k.simpul.sikap)) if (!k.simpul.pilihan.some((w) => w.id === id)) salah(`${t}.simpul.sikap: opsi "${id}" tidak ada`);
      break;
    }
    case 'pesan': {
      const st = langkah(k.langkah, 'assign');
      k.benda.forEach((b, i) => {
        if (b.nama !== undefined) teks(b.nama, `${t}.benda[${i}].nama`);
        if (b.keterangan === undefined) salah(`${t}.benda[${i}]: bagian pesan butuh keterangan (kalimatnya)`);
        else teks(b.keterangan, `${t}.benda[${i}].keterangan`);
      });
      if (st?.kind === 'assign') {
        sama(k.benda.map((b) => b.id), st.items.map((x) => x.id), 'item', t);
        const ember = st.buckets.map((x) => x.id);
        for (const w of [k.masuk, k.tidak]) if (!ember.includes(w)) salah(`${t}: wadah "${w}" tidak ada di misi`);
        if (ember.length !== 2) salah(`${t}: langkah pesan harus punya tepat dua wadah (masuk/tidak)`);
      }
      break;
    }
  }
}

// ------------------------------------------------------------------ validasiEpisode

export function validasiEpisode(ep: Episode): string[] {
  const pesan: string[] = [];
  const salah = (p: string) => pesan.push(p);

  // Kunci teks yang dirujuk (kunci -> tempat pertama dirujuk).
  const rujukanTeks = new Map<string, string>();
  const teks = (kunci: unknown, tempat: string) => {
    if (!teksSah(kunci)) {
      salah(`${tempat}: kunci teks kosong/tidak sah`);
      return;
    }
    if (!rujukanTeks.has(kunci)) rujukanTeks.set(kunci, tempat);
  };

  // ---- metadata
  if (!teksSah(ep.id) || !/^[a-z0-9-]+$/.test(ep.id)) salah(`id episode "${String(ep.id)}" tidak sah (huruf kecil, angka, tanda minus)`);
  if (!Number.isInteger(ep.versi) || ep.versi < 1) salah(`versi episode harus bilangan bulat >= 1 (sekarang ${String(ep.versi)})`);
  if (!PRODUK.includes(ep.produk)) salah(`produk "${String(ep.produk)}" tidak dikenal`);
  if (!(typeof ep.durasiMenit === 'number' && ep.durasiMenit > 0)) salah('durasiMenit harus angka > 0');
  if (!Number.isFinite(ep.kepercayaanAwal)) salah('kepercayaanAwal harus angka');
  teks(ep.judul, 'judul episode');
  teks(ep.ringkas, 'ringkas episode');
  for (const n of ep.latihanTerkait ?? []) if (!Number.isInteger(n) || n < 1) salah(`latihanTerkait berisi nomor misi tidak sah: ${String(n)}`);

  // ---- pemeran
  const pemeran = ep.pemeran ?? {};
  for (const [id, p] of Object.entries(pemeran)) {
    if (PEMBICARA_BAWAAN.includes(id)) salah(`pemeran "${id}": id ini dicadangkan untuk pemain/narasi`);
    teks(p?.nama, `pemeran "${id}".nama`);
    teks(p?.peran, `pemeran "${id}".peran`);
    if (!POTRET.includes(p?.potret)) salah(`pemeran "${id}": potret "${String(p?.potret)}" tidak dikenal`);
  }
  if (!ada(pemeran, ep.nasabah)) salah(`nasabah "${String(ep.nasabah)}" tidak ada di pemeran`);

  // ---- bab
  const idBab = (ep.bab ?? []).map((b) => b.id);
  if (idBab.length === 0) salah('episode belum punya bab');
  for (const b of ep.bab ?? []) {
    if (!teksSah(b.id)) salah('ada bab tanpa id');
    teks(b.judul, `bab "${b.id}".judul`);
    teks(b.tujuan, `bab "${b.id}".tujuan`);
  }
  for (const id of new Set(idBab.filter((x, i) => idBab.indexOf(x) !== i))) salah(`id bab "${id}" dipakai lebih dari sekali`);

  // ---- akhir, paham, proses, catatan
  const akhir = ep.akhir ?? {};
  if (Object.keys(akhir).length < 2) salah('episode harus punya minimal 2 akhir berbeda');
  for (const [id, a] of Object.entries(akhir)) {
    teks(a?.judul, `akhir "${id}".judul`);
    teks(a?.ringkas, `akhir "${id}".ringkas`);
    if (!NADA.includes(a?.nada)) salah(`akhir "${id}": nada "${String(a?.nada)}" tidak dikenal`);
    if (!Array.isArray(a?.pelajaran) || a.pelajaran.length === 0) salah(`akhir "${id}": pelajaran kosong`);
    else a.pelajaran.forEach((k, i) => teks(k, `akhir "${id}".pelajaran[${i}]`));
  }
  for (const [ruang, rec] of [['paham', ep.paham], ['proses', ep.proses], ['catatan', ep.catatan]] as const) {
    for (const [id, k] of Object.entries(rec ?? {})) teks(k, `${ruang} "${id}"`);
  }

  // ---- lampiran obrolan (foto/dokumen yang dikirim tokoh)
  for (const [id, l] of Object.entries(ep.lampiran ?? {})) {
    teks(l?.judul, `lampiran "${id}".judul`);
    if (!ada(ep.seniArena ?? {}, l?.seni)) salah(`lampiran "${id}": gambar "${String(l?.seni)}" tidak ada di episode.seniArena`);
    if (l?.dari !== undefined && !ada(pemeran, l.dari)) salah(`lampiran "${id}": pengirim "${l.dari}" tidak ada di pemeran`);
  }

  // ---- suasana
  const suasana = ep.suasana ?? [];
  if (suasana.length === 0) salah('suasana nasabah kosong');
  suasana.forEach((x, i) => {
    if (typeof x.min !== 'number' || Number.isNaN(x.min)) salah(`suasana[${i}]: min harus angka`);
    if (!DAFTAR_EKSPRESI.includes(x.ekspresi)) salah(`suasana[${i}]: ekspresi "${String(x.ekspresi)}" tidak dikenal`);
    teks(x.label, `suasana[${i}].label`);
    if (i > 0 && !(suasana[i - 1]!.min > x.min)) salah(`suasana harus diurutkan menurun berdasarkan min (suasana[${i}])`);
  });

  // ---- tanda yang dipasang (untuk memeriksa tanda di kondisi)
  const node = ep.node ?? {};
  const semuaNode = Object.entries(node);
  const tandaDipasang = new Set<string>();
  for (const [, n] of semuaNode) {
    const efek: (Efek | undefined)[] = [];
    if (n.jenis === 'dialog') efek.push(n.efek);
    if (n.jenis === 'pilihan') for (const p of n.pilihan ?? []) efek.push(p.efek);
    if (n.jenis === 'aktivitas') for (const h of n.hasil ?? []) efek.push(h.efek);
    for (const e of efek) for (const t of e?.pasang ?? []) tandaDipasang.add(t);
  }

  // ---- aktivitas (definisi) - dikumpulkan dulu karena kondisi 'akt:' merujuk opsinya
  const infoAkt = new Map<string, { opsi: Set<string>; benar: Set<string>; pensiun: Set<string>; taruh: Map<string, Set<string>> }>();
  const aktivitas = ep.aktivitas ?? {};
  for (const [kunci, def] of Object.entries(aktivitas)) {
    const tempat = `aktivitas "${kunci}"`;
    if (def?.id !== kunci) salah(`${tempat}: def.id "${String(def?.id)}" harus sama dengan kuncinya`);
    teks(def?.labelKirim, `${tempat}.labelKirim`);
    teks(def?.ringkasan, `${tempat}.ringkasan`);
    const misi = misiAman(ep, kunci, 'id');
    const opsi = new Set<string>();
    const benar = new Set<string>();
    const pensiun = new Set(def ? opsiPensiun(def) : []);
    // Langkah susun: item -> wadah yang mungkin (tanda akt:<id>:taruh:<item>:<wadah>).
    const taruh = new Map<string, Set<string>>();
    infoAkt.set(kunci, { opsi, benar, pensiun, taruh });
    if (!misi) {
      salah(`${tempat}: misi('id') gagal atau tidak punya langkah`);
      continue;
    }
    if (!teksSah(misi.id)) salah(`${tempat}: misi tanpa id`);
    if (misi.steps.length === 0) salah(`${tempat}: misi tidak punya langkah`);
    for (const st of misi.steps) for (const o of idOpsi(st)) opsi.add(o);
    for (const st of misi.steps) if (st.kind === 'assign') for (const it of st.items) taruh.set(it.id, new Set(st.buckets.map((b) => b.id)));
    for (const p of pensiun) if (opsi.has(p)) salah(`${tempat}: opsi pensiun "${p}" masih ditawarkan di misi`);
    // (v2) Alasan per opsi & arti awam baris kartu: rujukan opsi / kartu / teks harus ada.
    for (const [o, k] of Object.entries(def?.alasanOpsi ?? {})) {
      if (!opsi.has(o)) salah(`${tempat}.alasanOpsi: opsi "${o}" tidak ada di misi`);
      teks(k, `${tempat}.alasanOpsi["${o}"]`);
    }
    for (const [idKartu, arti] of Object.entries(def?.kartuArti ?? {})) {
      const kartu = (misi.policyCards ?? []).find((c) => c.id === idKartu);
      if (!kartu) {
        salah(`${tempat}.kartuArti: kartu "${idKartu}" tidak ada di misi`);
        continue;
      }
      if (arti?.sub !== undefined) teks(arti.sub, `${tempat}.kartuArti["${idKartu}"].sub`);
      const baris = Array.isArray(arti?.baris) ? arti.baris : [];
      if (baris.length !== kartu.rows.length) salah(`${tempat}.kartuArti["${idKartu}"]: ${baris.length} arti untuk ${kartu.rows.length} baris kartu`);
      baris.forEach((k, i) => {
        if (k !== null) teks(k, `${tempat}.kartuArti["${idKartu}"].baris[${i}]`);
      });
    }
    const kunciRubrik: StepKey[] = Array.isArray(def.kunci) ? def.kunci : [];
    for (const st of misi.steps) {
      if (!kunciRubrik.some((k) => k.stepId === st.id)) salah(`${tempat}: langkah misi "${st.id}" tidak punya rubrik di def.kunci`);
    }
    for (const k of kunciRubrik) {
      const st = misi.steps.find((x) => x.id === k.stepId);
      const t2 = `${tempat}/langkah "${k.stepId}"`;
      if (!st) {
        salah(`${t2}: dirujuk def.kunci tetapi tidak ada di misi`);
        continue;
      }
      if (!ada(def.penjelasan ?? {}, k.stepId)) salah(`${t2}: penjelasan belum ada`);
      else teks(def.penjelasan[k.stepId], `${t2}.penjelasan`);
      const ids = new Set(idOpsi(st));
      const cekOpsi = (id: string) => {
        if (!ids.has(id)) salah(`${t2}: opsi rubrik "${id}" tidak ada di misi`);
      };
      if (k.single !== undefined) {
        if (st.kind !== 'single') salah(`${t2}: rubrik single tetapi langkah misi "${st.kind}"`);
        cekOpsi(k.single);
        benar.add(k.single);
      } else if (k.multi !== undefined) {
        if (st.kind !== 'multi') salah(`${t2}: rubrik multi tetapi langkah misi "${st.kind}"`);
        k.multi.forEach(cekOpsi);
        k.multi.forEach((x) => benar.add(x));
        const wajib = k.requiredSelections ?? k.multi.length;
        if (st.kind === 'multi' && st.requiredSelections !== wajib) salah(`${t2}: requiredSelections misi (${st.requiredSelections}) beda dengan rubrik (${wajib})`);
      } else if (k.assign !== undefined) {
        if (st.kind !== 'assign') salah(`${t2}: rubrik assign tetapi langkah misi "${st.kind}"`);
        else {
          const ember = new Set(st.buckets.map((b) => b.id));
          for (const [item, tujuan] of Object.entries(k.assign)) {
            cekOpsi(item);
            if (!ember.has(tujuan)) salah(`${t2}: wadah rubrik "${tujuan}" tidak ada di misi`);
          }
        }
      } else if (k.order !== undefined) {
        if (st.kind !== 'order') salah(`${t2}: rubrik order tetapi langkah misi "${st.kind}"`);
        k.order.forEach(cekOpsi);
      } else if (k.number !== undefined) {
        if (st.kind !== 'number') salah(`${t2}: rubrik number tetapi langkah misi "${st.kind}"`);
      } else salah(`${t2}: rubrik tanpa jawaban benar`);
    }
    // Antarmuka HP: tiap aktivitas punya arena yang cocok dengan misinya.
    if (ep.antarmuka === 'hp' && !def.arena) salah(`${tempat}: episode antarmuka HP tetapi aktivitas tanpa arena`);
    periksaArena(ep, def, misi, tempat, salah, teks);
    // Id tidak pernah diterjemahkan: struktur misi en/zh harus sama dengan id.
    const bentuk = (m: MissionPublic) => JSON.stringify([m.id, m.steps.map((st) => [st.id, st.kind, idOpsi(st)])]);
    for (const b of DAFTAR_BAHASA.map((x) => x.kode).filter((x) => x !== 'id')) {
      const lain = misiAman(ep, kunci, b);
      if (!lain) salah(`${tempat}: misi('${b}') gagal atau tidak punya langkah`);
      else if (bentuk(lain) !== bentuk(misi)) salah(`${tempat}: misi('${b}') beda id/langkah/opsi dengan misi('id')`);
    }
  }
  const misiId = Object.keys(aktivitas).map((k) => misiAman(ep, k, 'id')?.id).filter(Boolean);
  for (const id of new Set(misiId.filter((x, i) => misiId.indexOf(x) !== i))) salah(`id misi "${String(id)}" dipakai lebih dari satu aktivitas`);

  // ---- kondisi & efek
  const cekKondisi = (k: Kondisi | undefined, tempat: string): void => {
    if (k === undefined) return;
    if (!k || typeof k !== 'object') {
      salah(`${tempat}: kondisi tidak sah`);
      return;
    }
    if ('tanda' in k) {
      const t = k.tanda;
      if (!teksSah(t)) salah(`${tempat}: tanda kosong`);
      else if (t.startsWith('akt:')) {
        const [, idAkt = '', jenis = '', ...sisa] = t.split(':');
        const opsi = sisa.join(':');
        const info = infoAkt.get(idAkt);
        if (!info) salah(`${tempat}: tanda "${t}" merujuk aktivitas "${idAkt}" yang tidak ada`);
        else if (['tepat', 'sebagian', 'belum'].includes(jenis)) {
          if (opsi) salah(`${tempat}: tanda "${t}" tidak sah`);
        } else if (jenis === 'pilih') {
          // Opsi pensiun: tidak pernah dipasang lagi di perjalanan baru, tetapi ada di simpanan lama.
          if (!info.opsi.has(opsi) && !info.pensiun.has(opsi)) salah(`${tempat}: tanda "${t}" merujuk opsi "${opsi}" yang tidak ada di misi`);
        } else if (jenis === 'lewat') {
          if (!info.benar.has(opsi)) salah(`${tempat}: tanda "${t}" tidak pernah dipasang ("${opsi}" bukan opsi benar di rubrik)`);
        } else if (jenis === 'taruh') {
          const [item = '', wadah = '', ...lebih] = sisa;
          if (lebih.length || !info.taruh.get(item)?.has(wadah)) salah(`${tempat}: tanda "${t}" merujuk item/wadah susun yang tidak ada di misi`);
        } else salah(`${tempat}: tanda "${t}" tidak sah (akt:<id>:tepat|sebagian|belum|pilih:<opsi>|lewat:<opsi>|taruh:<item>:<wadah>)`);
      } else if (!tandaDipasang.has(t)) salah(`${tempat}: tanda "${t}" diperiksa tetapi tidak pernah dipasang`);
    } else if ('tidak' in k) cekKondisi(k.tidak, tempat);
    else if ('semua' in k || 'salahSatu' in k) {
      const daftar = 'semua' in k ? k.semua : k.salahSatu;
      if (!Array.isArray(daftar) || daftar.length === 0) salah(`${tempat}: daftar kondisi kosong`);
      else daftar.forEach((x) => cekKondisi(x, tempat));
    } else if ('kepercayaan' in k) {
      const { min, maks } = k.kepercayaan ?? {};
      if (min === undefined && maks === undefined) salah(`${tempat}: kondisi kepercayaan tanpa min/maks`);
      if ((min !== undefined && !Number.isFinite(min)) || (maks !== undefined && !Number.isFinite(maks))) salah(`${tempat}: batas kepercayaan harus angka`);
      if (min !== undefined && maks !== undefined && min > maks) salah(`${tempat}: kepercayaan min > maks`);
    } else if ('paham' in k) {
      if (!ada(ep.paham, k.paham)) salah(`${tempat}: paham "${k.paham}" tidak ada di episode.paham`);
    } else if ('proses' in k) {
      if (!ada(ep.proses, k.proses)) salah(`${tempat}: proses "${k.proses}" tidak ada di episode.proses`);
      const nilai = Array.isArray(k.nilai) ? k.nilai : [k.nilai];
      if (nilai.length === 0 || !nilai.every((v) => NILAI_PROSES.includes(v))) salah(`${tempat}: nilai proses tidak sah`);
    } else salah(`${tempat}: bentuk kondisi tidak dikenal`);
  };

  /** Kunci alasan yang dipakai graf (untuk memeriksa Episode.makna). */
  const alasanDipakai = new Set<string>();
  const cekEfek = (e: Efek | undefined, tempat: string): void => {
    if (e === undefined) return;
    for (const t of [...(e.pasang ?? []), ...(e.cabut ?? [])]) if (!teksSah(t)) salah(`${tempat}: tanda kosong di efek`);
    for (const t of e.pasang ?? []) {
      if (t.startsWith('akt:')) salah(`${tempat}: tanda "${t}" berawalan akt: (dicadangkan untuk hasil aktivitas)`);
      if ((e.cabut ?? []).includes(t)) salah(`${tempat}: tanda "${t}" dipasang dan dicabut sekaligus`);
    }
    if (e.kepercayaan !== undefined) {
      if (!Number.isFinite(e.kepercayaan)) salah(`${tempat}: kepercayaan harus angka`);
      if (!e.alasan) salah(`${tempat}: efek kepercayaan wajib disertai alasan (hapus kepercayaan bila 0)`);
    }
    if (e.alasan !== undefined) teks(e.alasan, `${tempat}.alasan`);
    if (teksSah(e.alasan)) alasanDipakai.add(e.alasan);
    for (const p of e.paham ?? []) if (!ada(ep.paham, p)) salah(`${tempat}: paham "${p}" tidak ada di episode.paham`);
    for (const c of e.catat ?? []) if (!ada(ep.catatan, c)) salah(`${tempat}: catatan "${c}" tidak ada di episode.catatan`);
    for (const [p, v] of Object.entries(e.proses ?? {})) {
      if (!ada(ep.proses, p)) salah(`${tempat}: proses "${p}" tidak ada di episode.proses`);
      if (!NILAI_PROSES.includes(v)) salah(`${tempat}: nilai proses "${String(v)}" tidak sah`);
    }
  };

  /** (v3) Ada cue adegan di episode (tanpa `panggung`, adeganKini memakai perilaku v2 dan mengabaikannya). */
  let adaCue = false;
  const cekCue = (cue: unknown, tempat: string, di: TempatCue): void => {
    if (cue === undefined) return;
    adaCue = true;
    for (const p of periksaCue(cue, tempat, di)) salah(p);
  };

  const cekBaris = (baris: Baris[] | undefined, tempat: string, di: TempatCue = 'baris'): void => {
    if (!Array.isArray(baris)) {
      salah(`${tempat}: baris harus berupa daftar`);
      return;
    }
    baris.forEach((b, i) => {
      const t = `${tempat}.baris[${i}]`;
      if (!PEMBICARA_BAWAAN.includes(b.siapa) && !ada(pemeran, b.siapa)) salah(`${t}: pembicara "${String(b.siapa)}" tidak ada di pemeran`);
      if (b.ekspresi !== undefined && !DAFTAR_EKSPRESI.includes(b.ekspresi)) salah(`${t}: ekspresi "${String(b.ekspresi)}" tidak dikenal`);
      teks(b.teks, t);
      cekKondisi(b.jika, t);
      if (b.istilah !== undefined && !Array.isArray(b.istilah)) salah(`${t}: istilah harus berupa daftar`);
      for (const i of Array.isArray(b.istilah) ? b.istilah : []) if (!ada(ep.istilah, i)) salah(`${t}: istilah "${String(i)}" tidak ada di episode.istilah`);
      cekCue(b.adegan, `${t}.adegan`, di);
      if (b.lampiran !== undefined && !ada(ep.lampiran ?? {}, b.lampiran)) salah(`${t}: lampiran "${String(b.lampiran)}" tidak ada di episode.lampiran`);
      if (b.topik !== undefined) teks(b.topik, `${t}.topik`);
    });
  };

  const cekRujukan = (id: IdNode, tempat: string): void => {
    if (!ada(node, id)) salah(`${tempat}: merujuk node "${String(id)}" yang tidak ada`);
  };

  // ---- node
  if (!ada(node, ep.mulai)) salah(`mulai merujuk node "${String(ep.mulai)}" yang tidak ada`);
  // Panggung lama (v2/v3) butuh latar node mulai; episode berpanggung latar memakai `latar.awal` + `tata`.
  else if (node[ep.mulai]!.jenis !== 'cabang' && !node[ep.mulai]!.latar && !ep.latar) salah(`node mulai "${ep.mulai}" wajib punya latar`);
  const pemakaiAkt = new Map<string, string[]>();
  const akhirDipakai = new Set<IdAkhir>();
  for (const [kunci, n] of semuaNode) {
    const tempat = `node "${kunci}"`;
    if (n.id !== kunci) salah(`${tempat}: id "${String(n.id)}" harus sama dengan kuncinya`);
    if (!idBab.includes(n.bab)) salah(`${tempat}: bab "${String(n.bab)}" tidak ada di episode.bab`);
    if (n.latar !== undefined && !DAFTAR_LATAR.includes(n.latar)) salah(`${tempat}: latar "${String(n.latar)}" tidak dikenal`);
    cekCue(n.adegan, `${tempat}.adegan`, 'node');
    switch (n.jenis) {
      case 'dialog':
        cekBaris(n.baris, tempat);
        cekEfek(n.efek, `${tempat}.efek`);
        cekRujukan(n.lanjut, `${tempat}.lanjut`);
        break;
      case 'pilihan': {
        cekBaris(n.baris, tempat);
        teks(n.tanya, `${tempat}.tanya`);
        const pilihan = n.pilihan ?? [];
        if (pilihan.length < 2) salah(`${tempat}: node pilihan harus punya minimal 2 pilihan`);
        const idP = pilihan.map((p) => p.id);
        for (const id of new Set(idP.filter((x, i) => idP.indexOf(x) !== i))) salah(`${tempat}: id pilihan "${id}" dipakai lebih dari sekali`);
        const tt = new Map<string, string>();
        for (const p of pilihan) {
          const t = `${tempat}/pilihan "${p.id}"`;
          if (!teksSah(p.id)) salah(`${tempat}: ada pilihan tanpa id`);
          teks(p.teks, `${t}.teks`);
          cekEfek(p.efek, `${t}.efek`);
          cekKondisi(p.jika, `${t}.jika`);
          cekRujukan(p.lanjut, `${t}.lanjut`);
          const sig = tandaTanganAkibat(p.lanjut, p.efek);
          const kembar = tt.get(sig);
          if (kembar !== undefined) salah(`${tempat}: cabang palsu - pilihan "${kembar}" dan "${p.id}" punya akibat sama (lanjut & efek)`);
          else tt.set(sig, p.id);
        }
        break;
      }
      case 'aktivitas': {
        cekBaris(n.baris, tempat, 'aktivitas');
        if (!ada(aktivitas, n.aktivitas)) salah(`${tempat}: aktivitas "${String(n.aktivitas)}" tidak ada di episode.aktivitas`);
        else pemakaiAkt.set(n.aktivitas, [...(pemakaiAkt.get(n.aktivitas) ?? []), kunci]);
        const hasil = n.hasil ?? [];
        if (hasil.length === 0) salah(`${tempat}: aktivitas tanpa cabang hasil`);
        hasil.forEach((h, i) => {
          const t = `${tempat}.hasil[${i}]`;
          cekKondisi(h.jika, `${t}.jika`);
          cekEfek(h.efek, `${t}.efek`);
          if (h.umpanBalik !== undefined) cekBaris(h.umpanBalik, `${t}.umpanBalik`, 'umpan');
          cekRujukan(h.lanjut, `${t}.lanjut`);
          if (h.jika === undefined && i < hasil.length - 1) salah(`${t}: cabang tanpa jika harus paling akhir (cabang sesudahnya tidak pernah terpilih)`);
          // Akibat langsung: akibat tampil sebagai node `lanjut`, tidak ada layar umpan balik untuk barisnya.
          if (n.langsung && h.umpanBalik?.length) salah(`${t}: node langsung tidak boleh punya umpanBalik (akibat = node lanjut)`);
        });
        if (hasil.length > 0 && hasil[hasil.length - 1]!.jika !== undefined) {
          salah(`${tempat}: cabang hasil terakhir harus tanpa jika (cadangan bila tidak ada yang cocok, mis. jawaban kosong)`);
        }
        break;
      }
      case 'cabang':
        if (!Array.isArray(n.cabang) || n.cabang.length === 0) salah(`${tempat}: node cabang tanpa cabang`);
        (n.cabang ?? []).forEach((c, i) => {
          if (c.jika === undefined) salah(`${tempat}.cabang[${i}]: jika wajib ada (pakai lainnya untuk cadangan)`);
          cekKondisi(c.jika, `${tempat}.cabang[${i}].jika`);
          cekRujukan(c.lanjut, `${tempat}.cabang[${i}].lanjut`);
        });
        cekRujukan(n.lainnya, `${tempat}.lainnya`);
        break;
      case 'akhir':
        cekBaris(n.baris, tempat);
        if (!ada(akhir, n.akhir)) salah(`${tempat}: akhir "${String(n.akhir)}" tidak ada di episode.akhir`);
        else akhirDipakai.add(n.akhir);
        break;
      default:
        salah(`${tempat}: jenis "${String((n as { jenis?: unknown }).jenis)}" tidak dikenal`);
    }
  }
  for (const id of Object.keys(akhir)) if (!akhirDipakai.has(id)) salah(`akhir "${id}" tidak dipakai node akhir mana pun`);
  for (const b of idBab) if (!semuaNode.some(([, n]) => n.bab === b)) salah(`bab "${b}" tidak punya node`);
  for (const id of Object.keys(aktivitas)) {
    const pemakai = pemakaiAkt.get(id) ?? [];
    if (pemakai.length === 0) salah(`aktivitas "${id}" tidak dipakai node mana pun`);
    if (pemakai.length > 1) salah(`aktivitas "${id}" dipakai lebih dari satu node (${pemakai.join(', ')}); hasilnya dinilai sekali per perjalanan`);
  }

  // ---- layar akhir v2: kartu akhir, makna alasan, istilah (docs/rancangan-mode-cerita.md bagian 11)
  if (ep.kartuAkhir !== undefined) {
    const aturan = Array.isArray(ep.kartuAkhir) ? ep.kartuAkhir : [];
    if (!Array.isArray(ep.kartuAkhir)) salah('kartuAkhir harus berupa daftar');
    const idAturan = new Set<string>();
    const cadangan = new Set<string>();
    aturan.forEach((a, i) => {
      const tempat = `kartuAkhir[${i}] "${String(a?.id)}"`;
      if (!teksSah(a?.id)) salah(`kartuAkhir[${i}]: id kosong`);
      else if (idAturan.has(a.id)) salah(`${tempat}: id dipakai lebih dari sekali`);
      else idAturan.add(a.id);
      if (!ada(akhir, a?.akhir)) salah(`${tempat}: akhir "${String(a?.akhir)}" tidak ada di episode.akhir`);
      else if (cadangan.has(a.akhir)) salah(`${tempat}: sesudah aturan cadangan akhir "${a.akhir}" (tidak pernah dipakai)`);
      else if (a.jika === undefined) cadangan.add(a.akhir);
      teks(a?.judul, `${tempat}.judul`);
      teks(a?.sebab, `${tempat}.sebab`);
      teks(a?.pelajaran, `${tempat}.pelajaran`);
      cekKondisi(a?.jika, `${tempat}.jika`);
      for (const [j, u] of (a?.ulang ?? []).entries()) {
        if (!idBab.includes(u?.bab)) salah(`${tempat}.ulang[${j}]: bab "${String(u?.bab)}" tidak ada`);
        cekKondisi(u?.jika, `${tempat}.ulang[${j}].jika`);
      }
      if (a?.latihan !== undefined && !(Number.isInteger(a.latihan) && a.latihan >= 1)) salah(`${tempat}: latihan harus nomor misi`);
    });
    for (const id of Object.keys(akhir)) if (!cadangan.has(id)) salah(`kartuAkhir: akhir "${id}" belum punya aturan cadangan (tanpa jika)`);
  }
  if (ep.makna !== undefined) {
    for (const k of alasanDipakai) if (!ada(ep.makna, k)) salah(`makna: alasan "${k}" belum punya makna (membantu/perhatian/ralat)`);
    for (const [k, m] of Object.entries(ep.makna)) {
      if (!alasanDipakai.has(k)) salah(`makna "${k}": bukan alasan yang dipakai graf`);
      if (!['membantu', 'perhatian', 'ralat'].includes(m?.nilai)) salah(`makna "${k}": nilai "${String(m?.nilai)}" tidak dikenal`);
      if (m?.diluruskan !== undefined && m.nilai !== 'perhatian') salah(`makna "${k}": diluruskan hanya untuk nilai perhatian`);
      cekKondisi(m?.diluruskan, `makna "${k}".diluruskan`);
    }
  }
  for (const [id, x] of Object.entries(ep.istilah ?? {})) {
    teks(x?.label, `istilah "${id}".label`);
    teks(x?.arti, `istilah "${id}".arti`);
  }

  // ---- panggung & cue adegan v3 (docs/cerita/ADEGAN-AUTO1.md bagian 1-4)
  const panggung: unknown = ep.panggung;
  if (panggung !== undefined) {
    const p = panggung as Partial<NonNullable<Episode['panggung']>> | null;
    if (!p || typeof p !== 'object') salah('panggung harus berupa objek');
    else {
      if (!teksSah(p.lokasi?.nama)) salah('panggung.lokasi.nama kosong (nama ruang layanan untuk papan nama & {lokasi})');
      if (!TEMA_PANGGUNG.includes(p.lokasi?.tema as string)) salah(`panggung.lokasi.tema "${String(p.lokasi?.tema)}" tidak dikenal`);
      const eks: unknown = p.eksterior;
      if (eks !== null) {
        const e = eks as { nama?: unknown; aset?: unknown } | undefined;
        if (!e || typeof e !== 'object' || !teksSah(e.nama) || !teksSah(e.aset)) salah('panggung.eksterior harus null (slot kosong) atau { nama, aset }');
      }
      if (!p.awal || typeof p.awal !== 'object') salah('panggung.awal (komposisi awal) wajib ada');
      else for (const x of periksaCue(p.awal, 'panggung.awal', 'awal')) salah(x);
    }
  } else if (adaCue) salah('ada cue adegan tetapi episode tanpa panggung (cue diabaikan tampilan)');
  if (panggung !== undefined && panggung && typeof panggung === 'object') for (const x of periksaAlurAdegan(ep, tetangga)) salah(x);

  // ---- graf: terjangkau dari mulai, jalan ke akhir, putaran cabang
  if (ada(node, ep.mulai)) {
    const terjangkau = new Set<IdNode>([ep.mulai]);
    const antre = [ep.mulai];
    while (antre.length) {
      const n = node[antre.shift()!];
      if (!n) continue;
      for (const t of tetangga(n)) if (ada(node, t) && !terjangkau.has(t)) {
        terjangkau.add(t);
        antre.push(t);
      }
    }
    for (const [id] of semuaNode) if (!terjangkau.has(id)) salah(`node "${id}" tidak terjangkau dari mulai`);
    const akhirTerjangkau = new Set(semuaNode.filter(([id, n]) => terjangkau.has(id) && n.jenis === 'akhir').map(([, n]) => (n as { akhir: string }).akhir));
    if (akhirTerjangkau.size < 2) salah(`hanya ${akhirTerjangkau.size} akhir yang terjangkau dari mulai (minimal 2)`);
  }
  const keAkhir = new Set(semuaNode.filter(([, n]) => n.jenis === 'akhir').map(([id]) => id));
  for (let berubah = true; berubah;) {
    berubah = false;
    for (const [id, n] of semuaNode) {
      if (!keAkhir.has(id) && tetangga(n).some((t) => keAkhir.has(t))) {
        keAkhir.add(id);
        berubah = true;
      }
    }
  }
  for (const [id] of semuaNode) if (!keAkhir.has(id)) salah(`node "${id}": tidak ada jalan ke akhir (jalan buntu)`);
  for (const [id, n] of semuaNode) {
    if (n.jenis !== 'cabang') continue;
    const dilihat = new Set<IdNode>();
    const tumpukan: IdNode[] = [id];
    while (tumpukan.length) {
      const x = tumpukan.pop()!;
      for (const t of tetangga(node[x]!)) {
        if (t === id) {
          salah(`node "${id}": putaran antar node cabang (mesin berhenti di sini)`);
          tumpukan.length = 0;
          break;
        }
        if (ada(node, t) && node[t]!.jenis === 'cabang' && !dilihat.has(t)) {
          dilihat.add(t);
          tumpukan.push(t);
        }
      }
    }
  }

  // ---- panggung latar (Episode.latar): lokasi & aset tokoh yang dirujuk tata node/baris harus ada
  const latar = ep.latar;
  if (latar) {
    // T-013 Stage 3: lokasi = ruang piksel (id tidak kosong; keberadaan ruang & seni tokoh diuji di
    // ui/latar/piksel/adegan.test.ts terhadap manifest: setiap komposisi naskah harus terpetakan tanpa cadangan).
    for (const [idL, l] of Object.entries(latar.lokasi ?? {})) {
      teks(l?.nama, `latar.lokasi "${idL}".nama`);
      if (!teksSah(l?.piksel)) salah(`latar.lokasi "${idL}".piksel: id ruang piksel wajib ada`);
    }
    const punyaAset = (idT: string) => ada(pemeran, idT);
    const cekTata = (c: CueLatar | undefined, tempat: string) => {
      if (!c) return;
      if (c.lokasi !== undefined && !ada(latar.lokasi ?? {}, c.lokasi)) salah(`${tempat}: lokasi "${c.lokasi}" tidak ada di latar.lokasi`);
      for (const idT of [...(c.hadir ?? []), ...(c.telepon ? [c.telepon] : [])]) {
        if (!punyaAset(idT)) salah(`${tempat}: tokoh "${idT}" bukan pemeran`);
      }
      // Panggung punya paling banyak tiga slot tokoh per lokasi; lebih dari itu akan hilang diam-diam.
      if ((c.hadir?.length ?? 0) > 3) salah(`${tempat}: paling banyak 3 tokoh hadir (${c.hadir!.length})`);
    };
    cekTata(latar.awal, 'latar.awal');
    cekTata({ lokasi: latar.sampul?.lokasi, hadir: latar.sampul?.hadir }, 'latar.sampul');
    for (const [kunci, n] of semuaNode) {
      cekTata(n.tata, `node "${kunci}".tata`);
      const baris = n.jenis === 'cabang' ? [] : [...(n.baris ?? []), ...(n.jenis === 'aktivitas' ? (n.hasil ?? []).flatMap((h) => h.umpanBalik ?? []) : [])];
      baris.forEach((b, i) => cekTata(b.tata, `node "${kunci}".baris[${i}].tata`));
    }
  }

  // ---- dokumen di atas pilihan & titik keputusan bernomor (ringkasan akhir)
  for (const [idD, d] of Object.entries(ep.dokumen ?? {})) {
    teks(d?.judul, `dokumen "${idD}".judul`);
    (d?.baris ?? []).forEach((b, i) => {
      teks(b.label, `dokumen "${idD}".baris[${i}].label`);
      if (b.nilai !== null) teks(b.nilai, `dokumen "${idD}".baris[${i}].nilai`);
    });
    if (d?.catatan !== undefined) teks(d.catatan, `dokumen "${idD}".catatan`);
    const sk = d?.skema;
    if (sk) {
      const t2 = `dokumen "${idD}".skema`;
      const barisAda = (i: number) => Number.isInteger(i) && i >= 0 && i < (d.baris ?? []).length;
      if (sk.jenis !== 'lajur') salah(`${t2}: jenis "${String(sk.jenis)}" tidak dikenal`);
      if (!(Number.isInteger(sk.jumlah) && sk.jumlah >= 1 && sk.jumlah <= 8)) salah(`${t2}: jumlah lajur 1-8`);
      if (!(Number.isInteger(sk.posisi?.lajur) && sk.posisi.lajur >= 1 && sk.posisi.lajur <= sk.jumlah)) salah(`${t2}: posisi kendaraan di luar lajur 1-${sk.jumlah}`);
      for (const i of [sk.penomoran, sk.posisi?.baris, ...(sk.rambu ?? []).map((r) => r.baris)]) if (!barisAda(i as number)) salah(`${t2}: baris ${String(i)} tidak ada di dokumen`);
      teks(sk.kendaraan, `${t2}.kendaraan`);
    }
  }
  // ---- cut-in obrolan: hanya baris ucapan nasabah yang ada di naskah
  const barisNasabah = new Set(semuaNode.flatMap(([, n]) => (n.jenis === 'cabang' ? [] : [...n.baris, ...(n.jenis === 'aktivitas' ? n.hasil.flatMap((h) => h.umpanBalik ?? []) : [])]).filter((b) => b.siapa === ep.nasabah).map((b) => b.teks)));
  for (const k of ep.cutIn ?? []) if (!barisNasabah.has(k)) salah(`cutIn: "${k}" bukan baris ucapan nasabah di naskah`);
  for (const [kunci, n] of semuaNode) {
    if (n.jenis === 'pilihan' && n.dokumen !== undefined && !ada(ep.dokumen ?? {}, n.dokumen)) salah(`node "${kunci}": dokumen "${n.dokumen}" tidak ada di episode.dokumen`);
  }
  const idTitik = new Set<string>();
  for (const k of ep.titik ?? []) {
    const tempat = `titik "${k.id}"`;
    if (idTitik.has(k.id)) salah(`${tempat}: id dipakai lebih dari sekali`);
    idTitik.add(k.id);
    teks(k.judul, `${tempat}.judul`);
    teks(k.alasan, `${tempat}.alasan`);
    const alt = Object.entries(k.alternatif ?? {});
    if (alt.length < 2) salah(`${tempat}: minimal 2 alternatif`);
    for (const [a, v] of alt) {
      teks(v?.label, `${tempat}.alternatif "${a}".label`);
      if (!['tepat', 'kurang', 'keliru'].includes(v?.nilai)) salah(`${tempat}.alternatif "${a}": nilai "${String(v?.nilai)}" tidak dikenal`);
      if (!tandaDipasang.has(`kep:${k.id}:${a}`)) salah(`${tempat}: alternatif "${a}" tidak pernah dipilih (tanda kep:${k.id}:${a} tidak dipasang efek mana pun)`);
    }
    if (k.alternatif?.[k.saran]?.nilai !== 'tepat') salah(`${tempat}: saran "${String(k.saran)}" harus alternatif bernilai tepat`);
  }
  if (ep.statusNaskah !== undefined) teks(ep.statusNaskah, 'statusNaskah');
  if (ep.kepercayaanBatas) {
    const b = ep.kepercayaanBatas;
    if (!(b.min < b.maks) || ep.kepercayaanAwal < b.min || ep.kepercayaanAwal > b.maks) salah('kepercayaanBatas tidak sah atau kepercayaanAwal di luar batas');
  }
  if (ep.bahasa !== undefined && (!ep.bahasa.includes('id') || ep.bahasa.some((b) => !DAFTAR_BAHASA.some((x) => x.kode === b)))) {
    salah('bahasa episode harus memuat "id" dan hanya kode bahasa aplikasi');
  }

  // ---- teks per bahasa episode (`Episode.bahasa`; tanpa nilai = semua bahasa aplikasi)
  const tabel = ep.teks ?? ({} as Episode['teks']);
  const id = tabel.id ?? {};
  for (const [kunci, tempat] of rujukanTeks) if (!ada(id, kunci)) salah(`${tempat}: kunci teks "${kunci}" tidak ada di teks id`);
  for (const { kode } of DAFTAR_BAHASA.filter((x) => !ep.bahasa || ep.bahasa.includes(x.kode))) {
    const t = tabel[kode];
    if (!t) {
      salah(`teks ${kode} belum ada`);
      continue;
    }
    for (const [kunci, isi] of Object.entries(t)) if (!teksSah(isi)) salah(`teks ${kode} "${kunci}" kosong`);
    if (kode === 'id') {
      for (const [kunci, isi] of Object.entries(t)) {
        if (typeof isi !== 'string') continue;
        const sahUntuk = kunci.startsWith('arena.rambu.') ? [...PARAMETER_SAH, ...PARAMETER_ARENA_RAMBU] : PARAMETER_SAH;
        for (const p of parameter(isi)) if (!sahUntuk.includes(p)) salah(`teks id "${kunci}": parameter ${p} tidak dikenal (hanya ${sahUntuk.join(', ')})`);
        if (parameter(isi).includes('{lokasi}') && !teksSah(ep.panggung?.lokasi?.nama)) salah(`teks id "${kunci}": memakai {lokasi} tetapi episode tanpa panggung.lokasi.nama`);
      }
      continue;
    }
    for (const kunci of Object.keys(id)) if (!ada(t, kunci)) salah(`teks ${kode}: kunci "${kunci}" belum diterjemahkan`);
    for (const kunci of Object.keys(t)) if (!ada(id, kunci)) salah(`teks ${kode}: kunci "${kunci}" tidak ada di teks id`);
    for (const [kunci, asal] of Object.entries(id)) {
      const terj = ada(t, kunci) ? t[kunci] : undefined;
      if (typeof asal !== 'string' || typeof terj !== 'string') continue;
      const pa = parameter(asal).join(' ');
      const pt = parameter(terj).join(' ');
      if (pa !== pt) salah(`teks ${kode} "${kunci}": parameter beda (id: ${pa || '-'}; ${kode}: ${pt || '-'})`);
      const { hilang, tambahan } = selisihAngka(asal, terj, kode);
      if (hilang.length) salah(`teks ${kode} "${kunci}": angka ${hilang.join(', ')} dari teks id tidak ada di terjemahan`);
      if (tambahan.length) salah(`teks ${kode} "${kunci}": angka ${tambahan.join(', ')} tidak ada di teks id`);
    }
  }

  return [...new Set(pesan)];
}

// ------------------------------------------------------------------ jelajahiSemuaJalur

export interface HasilJelajah {
  /** Jumlah jalur lengkap (mulai -> akhir) yang berbeda urutan aksinya. */
  jalur: number;
  /** Jumlah jalur per akhir. */
  akhir: Record<IdAkhir, number>;
  /** Jalan buntu, putaran, pilihan < 2, batas langkah/keadaan terlampaui. [] = aman. */
  masalah: string[];
  /** Jumlah keadaan (state berbeda secara makna) yang dikunjungi. */
  keadaan: number;
}

function kombinasi<T>(daftar: T[], ukuran: number): T[][] {
  if (ukuran <= 0) return [[]];
  if (ukuran > daftar.length) return [];
  const hasil: T[][] = [];
  const isi: T[] = [];
  const rekursi = (mulai: number) => {
    if (isi.length === ukuran) {
      hasil.push([...isi]);
      return;
    }
    for (let i = mulai; i < daftar.length; i++) {
      isi.push(daftar[i]!);
      rekursi(i + 1);
      isi.pop();
    }
  };
  rekursi(0);
  return hasil;
}

/**
 * Kandidat jawaban aktivitas: single = tiap opsi; multi = semua kombinasi berukuran requiredSelections
 * + satu jawaban kosong; jenis lain = jawaban rubrik + kosong. Langkah digabung (hasil kali).
 */
export function kandidatJawaban(ep: Episode, idAkt: string, batas = 5000): MissionAnswer[] | null {
  const def = ada(ep.aktivitas, idAkt) ? ep.aktivitas[idAkt]! : null;
  const misi = def ? misiAman(ep, idAkt, 'id') : null;
  if (!def || !misi) return null;
  let hasil: MissionAnswer[] = [{}];
  for (const st of misi.steps) {
    const k = def.kunci.find((x) => x.stepId === st.id);
    let pilihan: StepAnswer[];
    if (st.kind === 'single') pilihan = st.options.map((o) => o.id);
    else if (st.kind === 'multi') pilihan = [...kombinasi(st.options.map((o) => o.id), st.requiredSelections), []];
    else {
      const benar: StepAnswer | undefined = k?.assign ?? k?.order ?? k?.number?.value;
      pilihan = benar === undefined ? [null] : [benar, null];
    }
    const baru: MissionAnswer[] = [];
    for (const h of hasil) for (const p of pilihan) baru.push({ ...h, [st.id]: p });
    if (baru.length > batas) return null;
    hasil = baru;
  }
  return hasil;
}

/** Semua kondisi di episode (untuk tanda-tangan state: hanya bagian state yang bisa memengaruhi masa depan). */
function kumpulkanRujukanKondisi(ep: Episode): { tanda: Set<string>; paham: Set<string>; proses: Set<string> } {
  const r = { tanda: new Set<string>(), paham: new Set<string>(), proses: new Set<string>() };
  const jelajah = (k: Kondisi | undefined): void => {
    if (!k || typeof k !== 'object') return;
    if ('tanda' in k) r.tanda.add(k.tanda);
    else if ('tidak' in k) jelajah(k.tidak);
    else if ('semua' in k) (k.semua ?? []).forEach(jelajah);
    else if ('salahSatu' in k) (k.salahSatu ?? []).forEach(jelajah);
    else if ('paham' in k) r.paham.add(k.paham);
    else if ('proses' in k) r.proses.add(k.proses);
  };
  for (const n of Object.values(ep.node ?? {})) {
    if (n.jenis !== 'cabang') for (const b of n.baris ?? []) jelajah(b.jika);
    if (n.jenis === 'pilihan') for (const p of n.pilihan ?? []) jelajah(p.jika);
    if (n.jenis === 'aktivitas') for (const h of n.hasil ?? []) {
      jelajah(h.jika);
      for (const b of h.umpanBalik ?? []) jelajah(b.jika);
    }
    if (n.jenis === 'cabang') for (const c of n.cabang ?? []) jelajah(c.jika);
  }
  return r;
}

/**
 * Menelusuri SEMUA jalur dengan mesin sungguhan: setiap pilihan tersedia, setiap kandidat jawaban aktivitas,
 * dan 'lanjut'. Keadaan yang sama maknanya (bagian state yang bisa memengaruhi aksi berikutnya) hanya
 * ditelusuri sekali; jumlah jalur tetap dihitung penuh.
 */
export function jelajahiSemuaJalur(ep: Episode, opsi: { maksLangkah?: number; maksKeadaan?: number } = {}): HasilJelajah {
  const maksLangkah = opsi.maksLangkah ?? 1000;
  const maksKeadaan = opsi.maksKeadaan ?? 200_000;
  const masalah = new Set<string>();
  const rujukan = kumpulkanRujukanKondisi(ep);
  const kandidat = new Map<string, MissionAnswer[]>();
  const memo = new Map<string, Record<IdAkhir, number>>();
  const diTumpukan = new Set<string>();
  const buntuAktivitas = new Set<IdNode>();
  let terhenti = false;

  const tandaTangan = (s: StateCerita): string => JSON.stringify([
    s.node, s.baris, s.akhir, s.umpanBalik, s.kepercayaan,
    s.tanda.filter((t) => rujukan.tanda.has(t)).sort(),
    s.paham.filter((p) => rujukan.paham.has(p)).sort(),
    Object.entries(s.proses).filter(([p]) => rujukan.proses.has(p)).sort(([a], [b]) => a.localeCompare(b)),
    Object.keys(s.aktivitas).sort(),
  ]);

  const aksiUntuk = (s: StateCerita): AksiCerita[] => {
    const daftar: AksiCerita[] = [{ jenis: 'lanjut' }];
    const n = ep.node[s.node];
    if (n?.jenis === 'pilihan') for (const p of pilihanTersedia(ep, s, n)) daftar.push({ jenis: 'pilih', node: s.node, pilihan: p.id });
    if (n?.jenis === 'aktivitas' && !s.umpanBalik) {
      if (!kandidat.has(n.aktivitas)) {
        const k = kandidatJawaban(ep, n.aktivitas);
        if (!k) masalah.add(`node "${s.node}": kandidat jawaban aktivitas "${n.aktivitas}" tidak bisa dibuat (misi gagal / kombinasi terlalu banyak)`);
        kandidat.set(n.aktivitas, k ?? []);
      }
      for (const jawaban of kandidat.get(n.aktivitas)!) daftar.push({ jenis: 'aktivitas', node: s.node, jawaban });
    }
    return daftar;
  };

  const tambah = (ke: Record<IdAkhir, number>, dari: Record<IdAkhir, number>) => {
    for (const [a, j] of Object.entries(dari)) ke[a] = (ke[a] ?? 0) + j;
  };

  const kunjungi = (s: StateCerita, kedalaman: number): Record<IdAkhir, number> => {
    const sig = tandaTangan(s);
    const tersimpan = memo.get(sig);
    if (tersimpan) return tersimpan;
    if (diTumpukan.has(sig)) {
      masalah.add(`node "${s.node}": putaran - keadaan yang sama bisa berulang tanpa akhir`);
      return {};
    }
    if (kedalaman > maksLangkah) {
      masalah.add(`node "${s.node}": melebihi batas ${maksLangkah} langkah`);
      return {};
    }
    if (memo.size >= maksKeadaan) {
      if (!terhenti) masalah.add(`penjelajahan dihentikan: lebih dari ${maksKeadaan} keadaan`);
      terhenti = true;
      return {};
    }
    diTumpukan.add(sig);
    const n = ep.node[s.node];
    if (n?.jenis === 'pilihan' && semuaBarisTampil(ep, s)) {
      const jumlah = pilihanTersedia(ep, s, n).length;
      if (jumlah < 2) masalah.add(`node "${s.node}": hanya ${jumlah} pilihan tersedia pada salah satu jalur (minimal 2)`);
    }
    const hasil: Record<IdAkhir, number> = {};
    let adaAksi = false;
    // Pilihan/jawaban yang ditawarkan tampilan (baris sudah habis) tetapi ditolak mesin = pemain macet.
    const ditawarkan = semuaBarisTampil(ep, s) && !s.umpanBalik;
    for (const a of aksiUntuk(s)) {
      const berikut = jalankan(ep, s, a);
      if (berikut === s) {
        if (ditawarkan && a.jenis === 'aktivitas' && !buntuAktivitas.has(s.node)) {
          buntuAktivitas.add(s.node);
          masalah.add(`node "${s.node}": jalan buntu - jawaban aktivitas tidak cocok dengan cabang hasil mana pun (mis. ${JSON.stringify(a.jawaban)})`);
        }
        if (ditawarkan && a.jenis === 'pilih') masalah.add(`node "${s.node}": jalan buntu - pilihan "${a.pilihan}" ditolak mesin (rujukan rusak)`);
        continue;
      }
      adaAksi = true;
      tambah(hasil, kunjungi(berikut, kedalaman + 1));
    }
    if (!adaAksi) {
      if (s.akhir !== null) hasil[s.akhir] = 1;
      else masalah.add(`node "${s.node}": jalan buntu - tidak ada aksi sah${n ? '' : ' (node tidak ada)'}`);
    }
    diTumpukan.delete(sig);
    memo.set(sig, hasil);
    return hasil;
  };

  const akhir = kunjungi(stateAwal(ep), 0);
  return {
    jalur: Object.values(akhir).reduce((a, b) => a + b, 0),
    akhir,
    masalah: [...masalah],
    keadaan: memo.size,
  };
}
