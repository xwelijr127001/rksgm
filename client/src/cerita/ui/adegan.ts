/**
 * KOMPOSISI ADEGAN v3 (docs/cerita/ADEGAN-AUTO1.md bagian 3-4): `adeganKini(ep, state)` = siapa di mana, dengan pose,
 * ekspresi, dan arah pandang apa, prop di mana, serta aksi sekali jalan milik baris kini. Fungsi MURNI: tanpa React,
 * tanpa bahasa, tanpa menulis state; hasil yang sama untuk state yang sama (juga setelah JSON/muat ulang).
 *
 * Lipatan (fold), urut:
 *   1. `Episode.panggung.awal`;
 *   2. RIWAYAT node-node sebelumnya: cue node saat node itu mulai, lalu cue setiap baris yang tampil (dicari lewat
 *      node + kunci teks, TIDAK pernah lewat kalimat) - fakta yang bertahan: sudah masuk / sudah pergi / lokasi / prop;
 *      pilihan & jawaban aktivitas = pemain berbicara (arah pandang);
 *   3. cue node kini, lalu cue baris node kini yang SUDAH tampil (`barisTerlihat(...).slice(0, baris)`), lalu baris
 *      umpan balik aktivitas bila sedang tampil.
 * Nilai cue bertahan sampai cue berikutnya (`CueAdegan`: tanpa nilai = ikut sebelumnya, null = tidak hadir), kecuali
 * pose GERAK (`duduk-jelaskan`, `duduk-tunjuk`) yang hanya berlaku di baris yang membawanya.
 *
 * Turunan per baris (tanpa cue eksplisit di baris itu):
 *  - pose Miss Raksa duduk: `duduk-jelaskan` saat ia bicara berekspresi serius, selain itu `duduk-dengar`;
 *  - pandang: pembicara menatap lawan bicaranya. Miss Raksa bicara -> ke pemain (ia mentor; baris yang ditujukan ke
 *    Bu Rina diberi cue `pandang: 'lawan'`, dan Bu Rina lalu menatapnya). Bu Rina bicara -> ke pemain, atau ke Miss
 *    Raksa bila Miss Raksa yang terakhir menyapanya; Miss Raksa mendengarkan -> ke Bu Rina. Pemain bicara (baris,
 *    pilihan, jawaban aktivitas) -> keduanya ke pemain. Narasi -> tatapan tetap. Aksi / pindah lokasi mengosongkan
 *    "lawan terakhir";
 *  - ekspresi: Bu Rina = `ekspresiNasabah` (baris Bu Rina terakhir di node kini, atau suasana), tetapi `netral`
 *    sesudah lompatan waktu (aksi pindah yang memisahkannya: telepon) sampai ia bicara lagi; Miss Raksa bicara = ekspresi barisnya,
 *    mendengarkan = cermin wajah Bu Rina (kesal/cemas/bingung -> cemas = wajah prihatin; lega/senang/tersenyum ->
 *    tersenyum; lainnya netral).
 *
 * `aksi` hanya ada pada baris (bukan umpan balik) yang membawa cue aksi; kuncinya `${episode}:${node}#${baris}@${langkah}`
 * unik per putaran (ulang bab / main lagi menaikkan `langkah`), sehingga panggung memutarnya sekali saat baris itu
 * BARU dicapai. `pembuka` = awal episode baru (langkah 0 di node mulai).
 *
 * Episode tanpa `panggung` (fixture lama) memakai perilaku v2: nasabah hadir sejak pernah bicara, pergi dari meja
 * sesudah narasi pertama di epilog.
 */
import { barisTerlihat, latarKini, nodeKini, suasanaNasabah, umpanBalikKini } from '../mesin';
import type {
  AksiAdegan, ArahPandang, Baris, CueAdegan, Ekspresi, Episode, EntriRiwayat, IdLokasiAdegan, IdNode, IdPembicara, IdPropAdegan, NodeCerita,
  PoseMentor, PoseNasabah, StateCerita, TempatProp,
} from '../tipe';
import type { KomposisiAdegan, PembicaraAdegan } from './adeganTipe';

// ------------------------------------------------------------------ kosakata cue (dipakai juga validasi.ts)

/**
 * Sifat pose Miss Raksa: `sikap` bertahan sampai cue berikutnya; `gerak` hanya di baris yang membawanya (tidak boleh
 * di cue node / awal); `aksi` = bingkai animasi aksi masuk (panggung), tidak dipakai sebagai nilai cue.
 */
export const JENIS_POSE_MENTOR: Readonly<Record<PoseMentor, 'sikap' | 'gerak' | 'aksi'>> = {
  'berdiri-sambut': 'sikap',
  berdiri: 'sikap',
  'duduk-dengar': 'sikap',
  telepon: 'sikap',
  'duduk-jelaskan': 'gerak',
  'duduk-tunjuk': 'gerak',
  'berdiri-persilakan': 'aksi',
};

/** Sifat pose Bu Rina: `aksi` = bingkai animasi masuk/pergi (jalan, berbalik ke pintu), bukan nilai cue. */
export const JENIS_POSE_NASABAH: Readonly<Record<PoseNasabah, 'sikap' | 'aksi'>> = {
  berdiri: 'sikap',
  duduk: 'sikap',
  'duduk-condong': 'sikap',
  telepon: 'sikap',
  'jalan-a': 'aksi',
  'jalan-b': 'aksi',
  'duduk-turun': 'aksi',
  'berdiri-pergi': 'aksi',
};

const AKSI: Record<AksiAdegan, true> = { masuk: true, pergi: true, kartu: true, pindah: true };
const PANDANG: Record<ArahPandang, true> = { lawan: true, pemain: true, bawah: true, depan: true };
const TEMPAT: Record<TempatProp, true> = { tangan: true, meja: true, tersimpan: true };
export const DAFTAR_AKSI_ADEGAN = Object.keys(AKSI) as AksiAdegan[];
export const DAFTAR_PANDANG = Object.keys(PANDANG) as ArahPandang[];
export const DAFTAR_TEMPAT_PROP = Object.keys(TEMPAT) as TempatProp[];
/** Prop bawaan: kunci di tangan Bu Rina (tidak digambar selama ia tidak hadir), kartu polis di laci, telepon di meja. */
export const PROP_BAWAAN: Readonly<Record<IdPropAdegan, TempatProp>> = { kunci: 'tangan', kartu: 'tersimpan', telepon: 'meja' };
export const DAFTAR_PROP_ADEGAN = Object.keys(PROP_BAWAAN) as IdPropAdegan[];

const DUDUK: ReadonlySet<PoseMentor> = new Set<PoseMentor>(['duduk-dengar', 'duduk-jelaskan', 'duduk-tunjuk']);

// ------------------------------------------------------------------ pembantu teks-bebas (dipakai tampilan.ts)

const ada = (rec: object | null | undefined, kunci: string): boolean => !!rec && Object.prototype.hasOwnProperty.call(rec, kunci);

/** Pembicara narasi: bukan pemeran episode dan bukan pemain. */
export function adalahNarasi(ep: Episode, siapa: string): boolean {
  return siapa !== 'pemain' && !ada(ep.pemeran, siapa);
}

/**
 * Ekspresi nasabah di panggung: baris nasabah terakhir yang SUDAH tampil di node kini (bila berekspresi),
 * selain itu ekspresi suasana (dari kepercayaan).
 */
export function ekspresiNasabah(ep: Episode, s: StateCerita): Ekspresi {
  const tampil = barisTerlihat(ep, s).slice(0, Math.max(0, s.baris));
  for (let i = tampil.length - 1; i >= 0; i--) {
    const b = tampil[i]!;
    if (b.siapa === ep.nasabah && b.ekspresi) return b.ekspresi;
  }
  return suasanaNasabah(ep, s).ekspresi;
}

/** Peran pembicara di panggung: pemeran berpotret Miss Raksa = mentor, nasabah episode = nasabah. */
function peranPembicara(ep: Episode, siapa: IdPembicara): PembicaraAdegan {
  if (siapa === 'pemain') return 'pemain';
  if (siapa === ep.nasabah && ada(ep.pemeran, siapa)) return 'nasabah';
  if (ada(ep.pemeran, siapa) && ep.pemeran[siapa]!.potret === 'missRaksa') return 'mentor';
  return 'narasi';
}

/**
 * Wajah Bu Rina di komposisi: `ekspresiNasabah`, KECUALI sesudah lompatan waktu di node kini (baris bercue aksi `pindah`
 * yang membuat Bu Rina tidak lagi bersama mereka: `nasabah: null` atau lewat telepon, mis. "Beberapa hari kemudian,
 * Bu Rina menelepon.") sebelum ia bicara lagi: `netral`, karena wajahnya di meja beberapa hari sebelumnya (mis. senang)
 * tidak berlaku lagi. Pindah bersama ke parkiran bukan lompatan waktu: suasananya tetap.
 */
function wajahNasabahDiAdegan(ep: Episode, s: StateCerita): Ekspresi {
  const tampil = barisTerlihat(ep, s).slice(0, Math.max(0, s.baris));
  for (let i = tampil.length - 1; i >= 0; i--) {
    const b = tampil[i]!;
    if (b.siapa === ep.nasabah && b.ekspresi) return b.ekspresi;
    const c = b.adegan;
    if (c?.aksi === 'pindah' && (c.nasabah === null || c.nasabah?.lewatTelepon === true)) return 'netral';
  }
  return suasanaNasabah(ep, s).ekspresi;
}

/** Wajah Miss Raksa saat mendengarkan: cermin perasaan Bu Rina (bukan satu senyum untuk semua baris). */
function wajahMendengar(e: Ekspresi): Ekspresi {
  if (e === 'kesal' || e === 'cemas' || e === 'bingung') return 'cemas';
  // Bu Rina lega -> wajah lega Miss Raksa (ikut lega), bukan senyum menyambut.
  if (e === 'lega') return 'lega';
  if (e === 'senang' || e === 'tersenyum') return 'tersenyum';
  return 'netral';
}

// ------------------------------------------------------------------ lipatan cue

interface Jejak {
  lokasi: IdLokasiAdegan;
  /** `pose` = SIKAP Miss Raksa yang bertahan (pose gerak tidak disimpan di sini). */
  mentor: { pose: PoseMentor; pandang: ArahPandang } | null;
  nasabah: { pose: PoseNasabah; pandang: ArahPandang; lewatTelepon: boolean } | null;
  prop: Record<IdPropAdegan, TempatProp>;
  /** Siapa yang terakhir berbicara KEPADA Bu Rina: menentukan ke mana ia menatap saat menjawab. */
  lawan: 'mentor' | 'pemain' | null;
}

interface HasilCue {
  /** Pose gerak Miss Raksa di baris ini saja. */
  gerak?: PoseMentor;
  /** Cue menetapkan pandang secara eksplisit (turunan pembicara tidak menimpanya). */
  pandangMentor: boolean;
  pandangNasabah: boolean;
}

interface BarisDilipat {
  siapa: PembicaraAdegan;
  ekspresi?: Ekspresi;
  gerak?: PoseMentor;
  aksi?: AksiAdegan;
}

function jejakAwal(awal: CueAdegan | undefined): Jejak {
  const j: Jejak = { lokasi: 'meja', mentor: { pose: 'duduk-dengar', pandang: 'pemain' }, nasabah: null, prop: { ...PROP_BAWAAN }, lawan: null };
  terapkanCue(j, awal);
  return j;
}

/** Terapkan satu cue ke jejak (mengubah `j`). Nilai yang tidak dikenal diabaikan (validasi.ts yang menolaknya). */
function terapkanCue(j: Jejak, cue: CueAdegan | undefined): HasilCue {
  const hasil: HasilCue = { pandangMentor: false, pandangNasabah: false };
  if (!cue || typeof cue !== 'object') return hasil;
  if (cue.lokasi && cue.lokasi !== j.lokasi) {
    j.lokasi = cue.lokasi;
    j.lawan = null;
  }
  const parkir = j.lokasi === 'parkiran';
  if (cue.mentor === null) j.mentor = null;
  else if (cue.mentor) {
    const lama = j.mentor ?? { pose: parkir ? 'berdiri' : 'duduk-dengar', pandang: 'pemain' };
    const pose = cue.mentor.pose && ada(JENIS_POSE_MENTOR, cue.mentor.pose) ? cue.mentor.pose : undefined;
    const gerak = pose !== undefined && JENIS_POSE_MENTOR[pose] !== 'sikap';
    if (gerak) hasil.gerak = pose;
    const pandang = cue.mentor.pandang && ada(PANDANG, cue.mentor.pandang) ? cue.mentor.pandang : undefined;
    hasil.pandangMentor = pandang !== undefined;
    j.mentor = { pose: pose && !gerak ? pose : lama.pose, pandang: pandang ?? lama.pandang };
  }
  if (cue.nasabah === null) j.nasabah = null;
  else if (cue.nasabah) {
    const lama = j.nasabah ?? { pose: parkir ? 'berdiri' : 'duduk', pandang: 'pemain', lewatTelepon: false };
    const pose = cue.nasabah.pose && ada(JENIS_POSE_NASABAH, cue.nasabah.pose) ? cue.nasabah.pose : lama.pose;
    const pandang = cue.nasabah.pandang && ada(PANDANG, cue.nasabah.pandang) ? cue.nasabah.pandang : undefined;
    hasil.pandangNasabah = pandang !== undefined;
    const lewatTelepon = typeof cue.nasabah.lewatTelepon === 'boolean' ? cue.nasabah.lewatTelepon : lama.lewatTelepon;
    j.nasabah = { pose, pandang: pandang ?? lama.pandang, lewatTelepon };
  }
  for (const [id, tempat] of Object.entries(cue.prop ?? {})) {
    if (ada(PROP_BAWAAN, id) && typeof tempat === 'string' && ada(TEMPAT, tempat)) j.prop[id as IdPropAdegan] = tempat as TempatProp;
  }
  if (cue.aksi) j.lawan = null;
  return hasil;
}

/** Pemain berbicara (baris pemain, pilihan, atau jawaban aktivitas yang disampaikan): keduanya menatap pemain. */
function pemainBicara(j: Jejak, r?: HasilCue): void {
  if (j.mentor && !r?.pandangMentor) j.mentor.pandang = 'pemain';
  if (j.nasabah && !j.nasabah.lewatTelepon && !r?.pandangNasabah) j.nasabah.pandang = 'pemain';
  j.lawan = 'pemain';
}

/** Satu baris tampil: terapkan cue-nya, lalu turunkan arah pandang dari pembicaranya. */
function lipatBaris(ep: Episode, j: Jejak, b: Pick<Baris, 'siapa' | 'ekspresi' | 'adegan'>): BarisDilipat {
  const r = terapkanCue(j, b.adegan);
  const siapa = peranPembicara(ep, b.siapa);
  const m = j.mentor;
  const n = j.nasabah;
  if (siapa === 'mentor' && m) {
    if (!r.pandangMentor) m.pandang = 'pemain';
    const keNasabah = m.pandang === 'lawan' && !!n && !n.lewatTelepon;
    if (keNasabah && !r.pandangNasabah) n!.pandang = 'lawan';
    j.lawan = keNasabah ? 'mentor' : 'pemain';
  } else if (siapa === 'nasabah' && n) {
    if (!r.pandangNasabah) n.pandang = n.lewatTelepon ? 'depan' : j.lawan === 'mentor' ? 'lawan' : 'pemain';
    if (m && !r.pandangMentor) m.pandang = n.lewatTelepon ? 'depan' : 'lawan';
  } else if (siapa === 'pemain') pemainBicara(j, r);
  // narasi: tatapan tetap (kecuali cue barisnya menetapkan)
  return { siapa, ...(b.ekspresi ? { ekspresi: b.ekspresi } : {}), ...(r.gerak ? { gerak: r.gerak } : {}), ...(b.adegan?.aksi ? { aksi: b.adegan.aksi } : {}) };
}

function ambilNode(ep: Episode, id: IdNode): NodeCerita | null {
  return ada(ep.node, id) ? ep.node[id]! : null;
}

/** Baris episode untuk entri riwayat (node + kunci teks; juga baris umpan balik aktivitas). Kunci pensiun = tanpa cue. */
function barisRiwayat(ep: Episode, e: Extract<EntriRiwayat, { jenis: 'baris' }>): Pick<Baris, 'siapa' | 'ekspresi' | 'adegan'> {
  const n = ambilNode(ep, e.node);
  const cocok = (b: Baris) => b.teks === e.teks && b.siapa === e.siapa;
  const b = !n || n.jenis === 'cabang' ? undefined
    : n.baris.find(cocok) ?? (n.jenis === 'aktivitas' ? n.hasil.flatMap((h) => h.umpanBalik ?? []).find(cocok) : undefined);
  return b ?? { siapa: e.siapa, ...(e.ekspresi ? { ekspresi: e.ekspresi } : {}) };
}

function poseMentorTampil(sikap: PoseMentor, kini: BarisDilipat | null): PoseMentor {
  if (kini?.gerak) return kini.gerak;
  if (!DUDUK.has(sikap)) return sikap;
  return kini?.siapa === 'mentor' && kini.ekspresi === 'serius' ? 'duduk-jelaskan' : 'duduk-dengar';
}

// ------------------------------------------------------------------ API

export function adeganKini(ep: Episode, s: StateCerita): KomposisiAdegan {
  if (!ep.panggung) return adeganTanpaPanggung(ep, s);
  const j = jejakAwal(ep.panggung.awal);
  const riwayat: EntriRiwayat[] = Array.isArray(s.riwayat) ? s.riwayat : [];

  // Riwayat node sebelumnya = semua entri sebelum ekor milik node kini (ekor: baris node kini, jawaban & umpan
  // baliknya; entri 'bab' tanpa node ikut ekor). Baris node kini dibaca dari barisTerlihat (tahan simpanan lama).
  let mulaiEkor = riwayat.length;
  for (let i = riwayat.length - 1; i >= 0; i--) {
    const e = riwayat[i]!;
    if ('node' in e && e.node !== s.node) break;
    mulaiEkor = i;
  }
  let nodeTerakhir: IdNode | null = null;
  for (let i = 0; i < mulaiEkor; i++) {
    const e = riwayat[i]!;
    if (!('node' in e)) continue;
    if (e.node !== nodeTerakhir) {
      terapkanCue(j, ambilNode(ep, e.node)?.adegan);
      nodeTerakhir = e.node;
    }
    if (e.jenis === 'baris') lipatBaris(ep, j, barisRiwayat(ep, e));
    else if (e.jenis === 'pilihan' || e.jenis === 'aktivitas') pemainBicara(j);
  }

  const node = nodeKini(ep, s);
  terapkanCue(j, node?.adegan);
  let kini: BarisDilipat | null = null;
  for (const b of barisTerlihat(ep, s).slice(0, Math.max(0, s.baris))) kini = lipatBaris(ep, j, b);
  const aksi = kini?.aksi ?? null;
  const ub = s.umpanBalik ? umpanBalikKini(ep, s) : null;
  if (ub) {
    // Jawaban aktivitas sudah disampaikan (pemain berbicara), lalu reaksi. Umpan balik tampil di layar aktivitas,
    // jadi tidak membawa aksi panggung.
    pemainBicara(j);
    for (const b of ub.baris) kini = lipatBaris(ep, j, b);
  }

  const n = j.nasabah;
  const wajahNasabah = n ? wajahNasabahDiAdegan(ep, s) : null;
  const m = j.mentor;
  return {
    lokasi: j.lokasi,
    mentor: m
      ? {
          pose: poseMentorTampil(m.pose, kini),
          ekspresi: kini?.siapa === 'mentor' ? kini.ekspresi ?? 'netral' : wajahNasabah ? wajahMendengar(wajahNasabah) : 'netral',
          pandang: m.pandang,
        }
      : null,
    nasabah: n && wajahNasabah ? { pose: n.pose, ekspresi: wajahNasabah, pandang: n.pandang, lewatTelepon: n.lewatTelepon } : null,
    pembicara: kini?.siapa ?? null,
    prop: { ...j.prop },
    aksi: aksi && !ub ? { jenis: aksi, kunci: `${ep.id}:${s.node}#${s.baris}@${s.langkah}` } : null,
    pembuka: s.langkah === 0 && s.node === ep.mulai,
  };
}

// ------------------------------------------------------------------ episode tanpa panggung v3 (perilaku v2)

/**
 * v2: nasabah hadir bila sudah pernah bicara (riwayat) atau bicara di node kini; di node AKHIR, sesudah narasi pertama
 * tampil (pergantian adegan: pergi, waktu berlalu, telepon), ia tidak lagi di meja.
 */
function nasabahHadirV2(ep: Episode, s: StateCerita): boolean {
  const id = ep.nasabah;
  if (!id || ep.pemeran[id]?.potret !== 'nasabah') return false;
  const terlihat = barisTerlihat(ep, s);
  if (nodeKini(ep, s)?.jenis === 'akhir' && terlihat.slice(0, Math.max(0, s.baris)).some((b) => adalahNarasi(ep, b.siapa))) return false;
  if (s.riwayat.some((e) => e.jenis === 'baris' && e.siapa === id)) return true;
  return terlihat.some((b) => b.siapa === id);
}

function adeganTanpaPanggung(ep: Episode, s: StateCerita): KomposisiAdegan {
  const lokasi: IdLokasiAdegan = latarKini(ep, s) === 'parkiran' ? 'parkiran' : 'meja';
  const b = s.baris > 0 ? barisTerlihat(ep, s)[s.baris - 1] ?? null : null;
  const siapa = b ? peranPembicara(ep, b.siapa) : null;
  const wajah = ekspresiNasabah(ep, s);
  const hadir = nasabahHadirV2(ep, s);
  const kini: BarisDilipat | null = b && siapa ? { siapa, ...(b.ekspresi ? { ekspresi: b.ekspresi } : {}) } : null;
  return {
    lokasi,
    mentor: {
      pose: lokasi === 'parkiran' ? 'berdiri' : poseMentorTampil('duduk-dengar', kini),
      ekspresi: siapa === 'mentor' ? b?.ekspresi ?? 'netral' : hadir ? wajahMendengar(wajah) : 'netral',
      pandang: siapa === 'mentor' || siapa === 'pemain' || !hadir ? 'pemain' : 'lawan',
    },
    nasabah: hadir ? { pose: lokasi === 'parkiran' ? 'berdiri' : 'duduk', ekspresi: wajah, pandang: 'pemain', lewatTelepon: false } : null,
    pembicara: siapa,
    prop: { ...PROP_BAWAAN },
    aksi: null,
    pembuka: s.langkah === 0 && s.node === ep.mulai,
  };
}
