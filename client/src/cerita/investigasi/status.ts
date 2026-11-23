/**
 * T-076 EPISODE 1 INVESTIGATOR (rencana Task 1): STATUS investigasi, dibaca MURNI dari state cerita (tanda). Tanpa React,
 * tanpa penyimpanan: muat ulang di tengah kasus memberi status yang sama karena state cerita yang menyimpannya (simpan.ts
 * cerita, entri per episode: auto-2, auto-2-dev, auto-2-inv tidak saling bocor).
 *
 * Tanda (dipasang efek node episode, lihat NodeInvestigasi di cerita/tipe.ts):
 *   catat:<idPernyataan>                     pernyataan dicatat ke buku
 *   bukti:<idBukti>                          kartu bukti terkumpul
 *   keb:tepat | keb:tepat-kedua | keb:dipandu   hasil KEBERATAN (percobaan pertama / kedua / dipandu Miss Raksa)
 *   putusan:layak | putusan:tambahan | putusan:polis
 *   pesan:baik | pesan:datar | pesan:janji   pesan ke nasabah
 *   tebak:<idTebakan>                        (T-087) tebakan di pembuka; tidak dinilai. Kasus 1: tebak:1..4 (lajur); T-090
 *                                            kasus 2: tebak:keluarga | tebak:penumpang | tebak:belum (id = konfig.tebak.pilihan)
 *   koreksi:<idPernyataan>                   (T-087) pernyataan itu sudah dikoreksi pembuatnya (petugas tol: lajur 3 -> 2)
 *   panel:<idBabak>:first|second|guided      (T-102, kasus ber-panel) hasil SATU babak panel; kasus 1-2 dan simpanan lama
 *                                            tetap memakai keb:* (babak tunggal 'keberatan')
 *   panel-keliru:<idBabak>:<0|1>:<idBukti>   (T-102) kartu keliru yang diajukan di percobaan itu (tidak dinilai sendiri)
 *   press:<idPernyataan>:<idPress>           (T-102) "Tanya lebih lanjut" pernyataan itu sudah dibuka (tanpa poin)
 *   tafsir:<idTafsir>                        (T-127, babak 2) pilihan formatif itu sudah dijawab (tepat atau dipandu); tanpa poin
 * T-139 (pemilik: "salah = peringatan sampai benar"): tanda dan nilainya TIDAK berubah, hanya cara mencapainya. `keb:dipandu` dan
 * `panel:<idBabak>:guided` kini berarti "tepat pada percobaan KETIGA atau sesudahnya" (dulu: jawabannya ditunjukkan sesudah dua
 * kekeliruan). Kartu yang sudah keliru dibaca dari `keb:keliru:<percobaan>:<idBukti>` / `panel-keliru:*` (kartuKeberatanKeliru,
 * kartuPanelKeliru) supaya layar bisa menandainya "sudah dicoba".
 * T-127: TANDA JELI dan TEMUAN tidak punya tanda sendiri: tanda jeli = press yang dibuka DAN ber-`berguna`; temuan = tafsir yang
 * dibuat / KEBERATAN berpasangan yang selesai, "mapan" menurut tanda koreksi kasusnya. Simpanan lama tanpa tanda itu tetap sah.
 *
 * Tipe kontrak (rencana "Interfaces", dipakai komponen Task 2): Bukti, Pernyataan, HasilKeberatan.
 */
import { LEGACY_ROUND_ID, ROUND_OUTCOMES, type RoundOutcome } from '@shared/investigator/rubric';
import type { BuktiInvestigasi, Ekspresi, Episode, KonfigInvestigasi, KunciTeks, PernyataanInvestigasi, PesanInvestigasi, Press, PutusanInvestigasi, Round, StateCerita, TafsirInvestigasi } from '../tipe';

export type Bukti = BuktiInvestigasi;
export type Pernyataan = PernyataanInvestigasi;
export type HasilKeberatan = 'tepat' | 'tepat-kedua' | 'dipandu';
export type Putusan = PutusanInvestigasi;
export type Pesan = PesanInvestigasi;

export const HASIL_KEBERATAN: readonly HasilKeberatan[] = ['tepat', 'tepat-kedua', 'dipandu'];
export const PUTUSAN: readonly Putusan[] = ['layak', 'tambahan', 'polis'];
export const PESAN: readonly Pesan[] = ['baik', 'datar', 'janji'];

export const tandaCatat = (id: string): string => `catat:${id}`;
export const tandaBukti = (id: string): string => `bukti:${id}`;
export const tandaKeberatan = (h: HasilKeberatan): string => `keb:${h}`;
export const tandaPutusan = (p: Putusan): string => `putusan:${p}`;
export const tandaPesan = (p: Pesan): string => `pesan:${p}`;
/** T-087: lajur yang ditebak tamu di bingkai pembuka (kasus 1). */
export type Lajur = 1 | 2 | 3 | 4;
export const LAJUR: readonly Lajur[] = [1, 2, 3, 4];
/** T-090: id tebakan apa pun (kasus 1: 1..4 = `tebak:1`..`tebak:4` seperti semula; kasus 2: 'keluarga' | 'penumpang' | 'belum'). */
export const tandaTebak = (id: string | number): string => `tebak:${id}`;
export const tandaKoreksi = (id: string): string => `koreksi:${id}`;

type Tanda = Pick<StateCerita, 'tanda'>;
const punya = (s: Tanda, t: string): boolean => s.tanda.includes(t);

/** Pernyataan yang sudah dicatat, urut naskah (`Episode.investigasi.pernyataan`). */
export function pernyataanTercatat(ep: Pick<Episode, 'investigasi'>, s: Tanda): Pernyataan[] {
  return (ep.investigasi?.pernyataan ?? []).filter((p) => punya(s, tandaCatat(p.id)));
}

/** Kartu bukti yang sudah terkumpul, urut naskah. Hanya kartu ini yang boleh ditawarkan di layar KEBERATAN. */
export function buktiTerkumpul(ep: Pick<Episode, 'investigasi'>, s: Tanda): Bukti[] {
  return (ep.investigasi?.bukti ?? []).filter((b) => punya(s, tandaBukti(b.id)));
}

export function hasilKeberatan(s: Tanda): HasilKeberatan | null {
  return HASIL_KEBERATAN.find((h) => punya(s, tandaKeberatan(h))) ?? null;
}

export function putusanDipilih(s: Tanda): Putusan | null {
  return PUTUSAN.find((p) => punya(s, tandaPutusan(p))) ?? null;
}

export function pesanDipilih(s: Tanda): Pesan | null {
  return PESAN.find((p) => punya(s, tandaPesan(p))) ?? null;
}

/**
 * T-134: NASKAH yang dipakai untuk MENAMPILKAN sebuah pesan yang sudah dipilih (kalimat pesan, reaksi, kalimat nasabah, wajah).
 * `id` = id naskah (`<awalan>.pesan.<id>`, `.pesan.<id>.1` / `.2`, `<awalan>.balas.<id>`); `ragam` = id ragam bila pilihan itu
 * memang ragam baru (disimpan di rekaman perangkat supaya arsip permainan terbaik tahu naskahnya). `bertanda(tanda)` menjawab
 * apakah pilihan itu membawa tanda ragamnya: dari state cerita (`punyaRagam`), dari rekaman (`ragamRekaman`), atau selalu true
 * (latihan: selalu naskah yang berlaku sekarang). Kasus tanpa `pesanRagam` = naskah id pesannya sendiri, seperti semula.
 */
export function naskahPesan(k: Pick<KonfigInvestigasi, 'balasan' | 'pesanRagam'>, pesan: Pesan, bertanda: (tanda: string, idRagam: string) => boolean): { id: string; ekspresi: Ekspresi; ragam?: string } {
  const r = k.pesanRagam?.[pesan];
  return r && bertanda(r.tanda, r.id) ? { id: r.id, ekspresi: r.ekspresi, ragam: r.id } : { id: pesan, ekspresi: k.balasan[pesan] };
}
/** Tanda ragam dibaca dari state cerita (permainan ini). */
export const punyaRagam = (s: Tanda) => (tanda: string): boolean => punya(s, tanda);
/** Tanda ragam dibaca dari rekaman perangkat (`penjelasan[kasus].ragam` = id ragam; rekaman lama tanpa field itu = naskah lama). */
export const ragamRekaman = (ragam: string | undefined) => (_tanda: string, idRagam: string): boolean => ragam === idRagam;

/**
 * T-087 / T-090: tebakan pembuka = id pilihan `konfig.tebak.pilihan` yang tandanya terpasang (null = belum menebak, mis.
 * progres lama dari sebelum T-087). Kasus 1 mengembalikan '1'..'4'.
 */
export function tebakanAwal(ep: Pick<Episode, 'investigasi'>, s: Tanda): string | null {
  return (ep.investigasi?.tebak.pilihan ?? []).find((p) => punya(s, tandaTebak(p.id)))?.id ?? null;
}

/** T-087: pernyataan yang sudah dikoreksi pembuatnya (buku catatan menulis "Laporan dikoreksi" di bawahnya), atau null. */
export function pernyataanDikoreksi(ep: Pick<Episode, 'investigasi'>, s: Tanda): Pernyataan | null {
  return (ep.investigasi?.pernyataan ?? []).find((p) => punya(s, tandaKoreksi(p.id))) ?? null;
}

/** Tiga hasil yang dinilai; null selama salah satunya belum ada (kasus belum selesai). */
export function hasilKasus(s: Tanda): { keberatan: HasilKeberatan; putusan: Putusan; pesan: Pesan } | null {
  const keberatan = hasilKeberatan(s);
  const putusan = putusanDipilih(s);
  const pesan = pesanDipilih(s);
  return keberatan && putusan && pesan ? { keberatan, putusan, pesan } : null;
}

// ------------------------------------------------------------------ T-102: babak panel, "Tanya lebih lanjut", hasil lengkap

/** Hasil satu babak (rubrik bersama): 'first' | 'second' | 'guided'. */
export type HasilBabak = RoundOutcome;
/** Padanan hasil KEBERATAN lama dengan hasil babak rubrik bersama (kasus 1-2: babak tunggal 'keberatan'). */
export const KE_HASIL_BABAK: Readonly<Record<HasilKeberatan, HasilBabak>> = { tepat: 'first', 'tepat-kedua': 'second', dipandu: 'guided' };
export const KE_HASIL_KEBERATAN: Readonly<Record<HasilBabak, HasilKeberatan>> = { first: 'tepat', second: 'tepat-kedua', guided: 'dipandu' };

export const tandaPanel = (idBabak: string, hasil: HasilBabak): string => `panel:${idBabak}:${hasil}`;
export const tandaPanelKeliru = (idBabak: string, percobaan: 0 | 1, idBukti: string): string => `panel-keliru:${idBabak}:${percobaan}:${idBukti}`;
export const tandaTekan = (idPernyataan: string, idPress: string): string => `press:${idPernyataan}:${idPress}`;

/**
 * T-139: kartu bukti yang SUDAH diajukan dan keliru (urut diajukan, tanpa ganda), dibaca dari tanda yang sudah lama dipasang
 * pilihan keliru: KEBERATAN kasus 1-2 `keb:keliru:<percobaan>:<idBukti>`, babak panel `panel-keliru:<idBabak>:<percobaan>:<idBukti>`.
 * Layar memakainya untuk menandai kartu itu "sudah dicoba" dan mematikannya di percobaan berikutnya. Hanya dibaca: tidak ada
 * tanda baru, jadi simpanan lama (termasuk yang sedang berada di langkah ketiga) memberi daftar yang sama.
 */
function kartuKeliru(s: Tanda, awalan: string): string[] {
  const hasil: string[] = [];
  for (const t of s.tanda) {
    if (!t.startsWith(awalan)) continue;
    // sisa = "<percobaan>:<idBukti>"
    const id = t.slice(awalan.length).replace(/^\d+:/, '');
    if (id && !hasil.includes(id)) hasil.push(id);
  }
  return hasil;
}
export const kartuKeberatanKeliru = (s: Tanda): string[] => kartuKeliru(s, 'keb:keliru:');
export const kartuPanelKeliru = (s: Tanda, idBabak: string): string[] => kartuKeliru(s, `panel-keliru:${idBabak}:`);
/** Id pilihan tetap node tawar "Tanya lebih lanjut" (`NodeDasar.tekan` langkah 'tawar', T-104). */
export const PILIH_TEKAN = 'tekan';
export const PILIH_LANJUT = 'lanjut';

/** Babak panel kasus ini, urut naskah ([] = kasus satu KEBERATAN). */
export function babakPanel(ep: Pick<Episode, 'investigasi'>): Round[] {
  return ep.investigasi?.panel?.rounds ?? [];
}

/** Id babak yang dinilai, urut rubrik: babak panel, atau babak tunggal 'keberatan' (kasus 1-2). */
export function idBabakKasus(ep: Pick<Episode, 'investigasi'>): string[] {
  const b = babakPanel(ep);
  return b.length ? b.map((x) => x.id) : [LEGACY_ROUND_ID];
}

/** Hasil satu babak, atau null selama belum selesai. Babak tunggal 'keberatan' dibaca dari tanda lama keb:*. */
export function hasilBabak(ep: Pick<Episode, 'investigasi'>, s: Tanda, idBabak: string): HasilBabak | null {
  if (!babakPanel(ep).length) {
    const h = idBabak === LEGACY_ROUND_ID ? hasilKeberatan(s) : null;
    return h ? KE_HASIL_BABAK[h] : null;
  }
  return ROUND_OUTCOMES.find((o) => punya(s, tandaPanel(idBabak, o))) ?? null;
}

/** Hasil SEMUA babak urut rubrik; null selama salah satunya belum selesai. */
export function hasilSemuaBabak(ep: Pick<Episode, 'investigasi'>, s: Tanda): HasilBabak[] | null {
  const hasil: HasilBabak[] = [];
  for (const id of idBabakKasus(ep)) {
    const h = hasilBabak(ep, s, id);
    if (!h) return null;
    hasil.push(h);
  }
  return hasil;
}

/** Babak panel pertama yang belum selesai (null = semua selesai, atau kasus tanpa panel). Babak yang selesai tidak diulang. */
export function babakBerjalan(ep: Pick<Episode, 'investigasi'>, s: Tanda): Round | null {
  return babakPanel(ep).find((b) => !hasilBabak(ep, s, b.id)) ?? null;
}

/** "Tanya lebih lanjut" pernyataan itu sudah dibuka? */
export function sudahTekan(s: Tanda, idPernyataan: string, idPress: string): boolean {
  return punya(s, tandaTekan(idPernyataan, idPress));
}

/** T-127: semua pertanyaan sebuah pernyataan, urut layar: `press` lalu `pressLain`. */
export function semuaPress(p: Pernyataan): Press[] {
  return [...(p.press ? [p.press] : []), ...(p.pressLain ?? [])];
}
/** T-127: id pilihan node tawar untuk sebuah pertanyaan: pertanyaan pertama (`press`) tetap 'tekan'; yang lain 'tekan-<id>'. */
export const pilihTekan = (p: Pernyataan, idPress: string): string => (p.press?.id === idPress ? PILIH_TEKAN : `${PILIH_TEKAN}-${idPress}`);

/**
 * Pernyataan (urut naskah) yang "Tanya lebih lanjut"-nya sudah dibuka: buku catatan menulis tanya-jawabnya dengan sumbernya.
 * T-127: satu entri per pernyataan (pertanyaan PERTAMA yang terbuka menurut urut layar; satu kunjungan = satu pertanyaan).
 */
export function tekananTerbuka(ep: Pick<Episode, 'investigasi'>, s: Tanda): { pernyataan: Pernyataan; press: Press }[] {
  const hasil: { pernyataan: Pernyataan; press: Press }[] = [];
  for (const p of ep.investigasi?.pernyataan ?? []) {
    const press = semuaPress(p).find((x) => sudahTekan(s, p.id, x.id));
    if (press) hasil.push({ pernyataan: p, press });
  }
  return hasil;
}

/** T-127 TANDA JELI: pertanyaan BERGUNA yang sudah dibuka (hiasan di buku catatan; tanpa poin, bukan stempel). */
export function tandaJeli(ep: Pick<Episode, 'investigasi'>, s: Tanda): { pernyataan: Pernyataan; press: Press }[] {
  return tekananTerbuka(ep, s).filter((x) => !!x.press.berguna);
}

// ------------------------------------------------------------------ T-127 (babak 2): tafsir dan temuan

export const tandaTafsir = (id: string): string => `tafsir:${id}`;
/** T-130: tafsir itu memang DIBUAT pemain di simpanan ini (bukan hanya mapan lewat tanda lain di simpanan lama). */
export const tafsirDibuat = (s: Tanda, id: string): boolean => punya(s, tandaTafsir(id));

/**
 * Satu baris halaman "Temuan": `teks` = kalimat lengkap, `ringkas` = versi slip bukti (hanya tafsir), `bukti` = kartu yang
 * menerimanya, `mapan` = sudah terbukti (bukan lagi tafsiran pemain).
 */
export interface Temuan { id: string; teks: KunciTeks; ringkas?: KunciTeks; bukti?: Bukti['id']; mapan: boolean }

/** Tafsir sebuah kasus yang sudah dibuat pemain ATAU sudah mapan lewat tandanya (simpanan lama tanpa `tafsir:<id>`). */
function temuanTafsir(x: TafsirInvestigasi, s: Tanda): Temuan | null {
  if (!x.temuan) return null;
  const dibuat = punya(s, tandaTafsir(x.id));
  const mapan = x.mapanSaat ? punya(s, x.mapanSaat) : dibuat;
  return dibuat || mapan ? { id: `tafsir:${x.id}`, teks: x.temuan, ringkas: x.ringkas, bukti: x.bukti, mapan } : null;
}

/**
 * Semua temuan kasus ini, urut naskah: tafsir (TafsirInvestigasi), temuan berpasangan KEBERATAN (sesudah babaknya selesai;
 * mapan sesudah pernyataannya dikoreksi), lalu (T-132) temuan babak panel (`temuanBabak`). TAFSIRAN (mapan false) dan TEMUAN (mapan true) digambar terpisah oleh pemanggil.
 */
export function temuanKasus(ep: Pick<Episode, 'investigasi'>, s: Tanda): Temuan[] {
  const k = ep.investigasi;
  if (!k) return [];
  const hasil: Temuan[] = [];
  for (const x of k.tafsir ?? []) { const t = temuanTafsir(x, s); if (t) hasil.push(t); }
  const pas = k.keberatan.pasangan;
  if (pas && hasilKeberatan(s)) hasil.push({ id: 'pasangan', teks: pas.temuan, mapan: punya(s, tandaKoreksi(k.keberatan.pernyataan)) });
  // T-132: temuan per babak panel: ada sesudah babaknya selesai, mapan sesudah pernyataan babak itu dikoreksi pembuatnya.
  for (const x of k.temuanBabak ?? []) {
    const r = k.panel?.rounds.find((y) => y.id === x.round);
    if (r && hasilBabak(ep, s, r.id)) hasil.push({ id: `babak:${r.id}`, teks: x.temuan, ringkas: x.ringkas, bukti: x.bukti, mapan: punya(s, tandaKoreksi(r.statementId)) });
  }
  return hasil;
}

/** SEMUA pernyataan yang sudah dikoreksi pembuatnya, urut naskah (kasus ber-panel bisa lebih dari satu). */
export function semuaPernyataanDikoreksi(ep: Pick<Episode, 'investigasi'>, s: Tanda): Pernyataan[] {
  return (ep.investigasi?.pernyataan ?? []).filter((p) => punya(s, tandaKoreksi(p.id)));
}

/** Hasil yang dinilai dalam bentuk rubrik bersama (semua kasus): hasil tiap babak urut rubrik, putusan, pesan. */
export interface HasilLengkap { babak: HasilBabak[]; putusan: Putusan; pesan: Pesan }

/**
 * Seperti hasilKasus, untuk SEMUA kasus: kasus 1-2 (dan simpanan lamanya) memberi satu babak dari keb:*, kasus ber-panel satu
 * hasil per babak. null selama salah satu hasil belum ada.
 */
export function hasilKasusLengkap(ep: Pick<Episode, 'investigasi'>, s: Tanda): HasilLengkap | null {
  const babak = hasilSemuaBabak(ep, s);
  const putusan = putusanDipilih(s);
  const pesan = pesanDipilih(s);
  return babak && putusan && pesan ? { babak, putusan, pesan } : null;
}
