/**
 * ALUR ANTARMUKA HP (fungsi MURNI, tanpa React): bagaimana baris naskah tampil di HP.
 *
 * - KETUKAN: baris-baris berurutan dalam satu node yang tampilannya sama (obrolan atau adegan tatap muka) dan tanpa
 *   pergantian tata di tengahnya tampil BERSAMA; di adegan satu ketukan = satu beat (bolehGabung). Mesin tetap memajukan satu baris per aksi 'lanjut'; antarmuka HP hanya
 *   memajukan beberapa baris sekaligus sampai ujung ketukan. Riwayat, simpanan, dan penilaian sama persis.
 * - PANDANG: baris tampil sebagai OBROLAN bila lawan bicara jarak jauhnya nasabah dan tidak ada yang hadir di lokasi
 *   (chat WhatsApp di naskah), atau bila baris itu ucapan nasabah lewat ponsel; selain itu ADEGAN (panggung + kartu dialog).
 * - OBROLAN: utas pesan disusun dari riwayat (baris nasabah = masuk, pilihan & pesan aktivitas pemain = keluar, narasi =
 *   catatan, perubahan status = catatan status). Muat ulang = utas yang sama.
 */
import { barisTerlihat, nodeKini, suasanaNasabah } from '../mesin';
import type { Baris, Episode, IdNode, KunciTeks, NodeCerita, StateCerita } from '../tipe';
import { adalahNarasi } from '../ui/adegan';
import { telusuriRiwayat, terapkanCue, type Lipatan } from '../ui/latar/komposisi';

export type Pandang = 'obrolan' | 'adegan';

/** Tampilan satu baris pada lipatan tata saat baris itu tampil. */
function pandangBaris(ep: Episode, k: Lipatan, b: Pick<Baris, 'siapa'>): Pandang {
  if (!ep.nasabah || k.telepon !== ep.nasabah) return 'adegan';
  if (b.siapa === ep.nasabah) return 'obrolan';
  return k.hadir.length === 0 ? 'obrolan' : 'adegan';
}

/** Tampilan tiap baris terlihat node kini (indeks = indeks baris terlihat). Baris yang belum tampil memakai cue-nya sendiri. */
function pandangNode(ep: Episode, s: StateCerita): Pandang[] {
  const n = nodeKini(ep, s);
  if (!n || !ep.latar) return [];
  const terlihat = barisTerlihat(ep, s, n);
  // Lipatan sebelum baris pertama node kini: riwayat tanpa baris node kini yang sudah tampil.
  const tanpaNodeKini = s.riwayat.slice(0, s.riwayat.length - riwayatNodeKini(s));
  let k = terapkanCue(telusuriRiwayat(ep, tanpaNodeKini), n.tata);
  return terlihat.map((b) => {
    k = terapkanCue(k, b.tata);
    return pandangBaris(ep, k, b);
  });
}

/** Banyak entri riwayat di ekor yang milik baris node kini yang sudah tampil. */
function riwayatNodeKini(s: StateCerita): number {
  let n = 0;
  for (let i = s.riwayat.length - 1; i >= 0 && n < s.baris; i--) {
    const e = s.riwayat[i]!;
    if (e.jenis === 'baris' && e.node === s.node) n += 1;
    else break;
  }
  return n;
}

/**
 * Baris b boleh tampil bersama baris a sebelumnya: tanpa pergantian tata dan tampilannya sama. Di ADEGAN (visual novel)
 * satu ketukan = satu BEAT: satu gagasan dengan perubahan visual. Ucapan dengan penutur atau ekspresi baru memulai beat
 * baru (wajah/kamera/sorotan berganti, mis. pembuka Miss Raksa: salam -> kasus -> cara bermain); narasi menempel pada beat
 * sebelumnya (konteks/akibat), jadi tidak ada ketukan kosong untuk narasi. Obrolan: pesan berurutan tetap bersama.
 */
function bolehGabung(ep: Episode, a: Baris, b: Baris, pandangA: Pandang, pandangB: Pandang): boolean {
  if (b.tata || pandangA !== pandangB) return false;
  if (pandangB === 'obrolan' || adalahNarasi(ep, b.siapa)) return true;
  return !adalahNarasi(ep, a.siapa) && a.siapa === b.siapa && (a.ekspresi ?? 'netral') === (b.ekspresi ?? 'netral');
}

/** Ketukan yang sedang tampil: indeks baris [awal, akhir] node kini, atau null bila belum ada baris tampil. */
export function ketukanKini(ep: Episode, s: StateCerita): { awal: number; akhir: number; pandang: Pandang } | null {
  if (s.baris <= 0) return null;
  const terlihat = barisTerlihat(ep, s);
  const pandang = pandangNode(ep, s);
  const akhir = Math.min(s.baris, terlihat.length) - 1;
  let awal = akhir;
  while (awal > 0 && bolehGabung(ep, terlihat[awal - 1]!, terlihat[awal]!, pandang[awal - 1] ?? 'adegan', pandang[awal] ?? 'adegan')) awal -= 1;
  return { awal, akhir, pandang: pandang[akhir] ?? 'adegan' };
}

/** true = baris berikutnya di node kini masih satu ketukan dengan baris terakhir yang tampil (antarmuka memajukannya). */
export function ketukanBelumUtuh(ep: Episode, s: StateCerita): boolean {
  const terlihat = barisTerlihat(ep, s);
  if (s.baris <= 0 || s.baris >= terlihat.length) return false;
  const pandang = pandangNode(ep, s);
  return bolehGabung(ep, terlihat[s.baris - 1]!, terlihat[s.baris]!, pandang[s.baris - 1] ?? 'adegan', pandang[s.baris] ?? 'adegan');
}

/** Tampilan saat menunggu keputusan/aktivitas di node kini: tampilan baris terakhirnya (atau tata node bila tanpa baris). */
export function pandangKini(ep: Episode, s: StateCerita): Pandang {
  const k = ketukanKini(ep, s);
  if (k) return k.pandang;
  const n = nodeKini(ep, s);
  if (!n || !ep.latar) return 'adegan';
  const lip = terapkanCue(telusuriRiwayat(ep, s.riwayat), n.tata);
  return pandangBaris(ep, lip, { siapa: 'narasi' });
}

// ------------------------------------------------------------------ status nasabah

/** Label pita status untuk nilai kepercayaan tertentu. */
export function labelStatus(ep: Episode, nilai: number): KunciTeks {
  return suasanaNasabah(ep, { kepercayaan: nilai }).label;
}

// ------------------------------------------------------------------ utas obrolan

export type PesanObrolan =
  | { jenis: 'masuk'; id: string; teks: KunciTeks; ekspresi?: Baris['ekspresi']; node: IdNode; lampiran?: string }
  | { jenis: 'keluar'; id: string; teks: KunciTeks | null; isi?: string; node: IdNode }
  | { jenis: 'catatan'; id: string; teks: KunciTeks; node: IdNode; lampiran?: string; topik?: KunciTeks; akibat?: boolean }
  | { jenis: 'status'; id: string; teks: KunciTeks; arah: 'naik' | 'turun' | 'tetap'; sebelum: KunciTeks; sesudah: KunciTeks; node: IdNode };

/**
 * Utas obrolan dari riwayat: hanya baris yang tampil sebagai obrolan, pilihan yang dijawab di obrolan, pesan aktivitas
 * (DefAktivitas.pesanObrolan), dan catatan status sesudah akibatnya. `pesanAktivitas` dipanggil dengan jawaban tersimpan.
 * `sesiMulai` = indeks pesan pertama sesudah tampilan terakhir kali berpindah ke obrolan (yang lebih lama boleh dilipat).
 *
 * ADEGAN SELA (T-025, K11): keputusan yang mengirim pesan obrolan, lalu node akibatnya dibuka dengan adegan (ruang Komite) dan
 * BARU kemudian kembali ke obrolan. Adegan itu tidak memutus rangkaiannya: sesi obrolan berikutnya dimulai dari pesan keluar
 * keputusan tadi (pemain melihat pesannya sendiri di atas reaksi nasabah), dan catatan status tetap menutup akibat DI OBROLAN,
 * bukan di kartu adegan sela. `statusDiObrolan` = node akibat yang catatan statusnya ditahan untuk obrolan dengan cara ini.
 * `sesiTengahNode` = sesi obrolan terakhir dimulai oleh baris yang BUKAN baris pertama node-nya yang tampil (pembuka node itu
 * adegan yang sudah dilewati pemain, mis. ruang Komite di K13): sesi semacam itu langsung tampil, tanpa gerbang "Mulai".
 */
export function utasObrolan(
  ep: Episode,
  s: StateCerita,
  pesanAktivitas: (node: IdNode, idAktivitas: string) => string | null,
): { pesan: PesanObrolan[]; sesiMulai: number; statusDiObrolan: IdNode | null; sesiTengahNode: boolean } {
  const pesan: PesanObrolan[] = [];
  let sesiMulai = 0;
  // Adegan sela: indeks pesan keluar keputusan terakhir selama belum ada baris obrolan sesudahnya, node akibat yang sedang
  // di sela, dan node akibat yang catatan statusnya ditahan untuk obrolan.
  let keluarKeputusan: number | null = null;
  let nodeSela: IdNode | null = null;
  let statusDiObrolan: IdNode | null = null;
  // Urutan baris di node-nya (0 = baris pertama node itu yang tampil) + apakah sesi terakhir dimulai di tengah node.
  let nodeBaris: IdNode | null = null;
  let urutanBaris = 0;
  let sesiTengahNode = false;
  let pandangLalu: Pandang | null = null;
  let kepercayaan = ep.kepercayaanAwal;
  // Catatan status sesudah keputusan menunggu sampai baris akibatnya (node akibat) selesai tampil.
  let statusTunda: PesanObrolan | null = null;
  let nodeAkibat: IdNode | null = null;
  let setelahKeputusan = false;
  const lepas = () => {
    if (statusTunda) pesan.push(statusTunda);
    statusTunda = null;
    nodeAkibat = null;
  };
  const masukObrolan = (tengahNode = false) => {
    if (pandangLalu !== 'obrolan') { sesiMulai = keluarKeputusan ?? pesan.length; sesiTengahNode = tengahNode && keluarKeputusan === null; }
    pandangLalu = 'obrolan';
  };
  telusuriRiwayat(ep, s.riwayat, (e, k, b) => {
    if (e.jenis === 'bab') return;
    if (e.jenis === 'baris') {
      const p = pandangBaris(ep, k, b ?? { siapa: e.siapa });
      urutanBaris = e.node === nodeBaris ? urutanBaris + 1 : 0;
      nodeBaris = e.node;
      // Adegan sela: baris adegan tepat sesudah keputusan berpesan, di node yang barisnya kemudian kembali ke obrolan.
      if (keluarKeputusan !== null && p !== 'obrolan') {
        if (nodeSela === null && obrolanMenyusul(ep, k, e.node, e.teks)) nodeSela = e.node;
        else if (e.node !== nodeSela) { keluarKeputusan = null; nodeSela = null; }
      }
      const sela = keluarKeputusan !== null && nodeSela === e.node;
      if (statusTunda) {
        // Baris akibat pertama menentukan tempat catatan status: obrolan (juga bila ia adegan SELA), atau adegan (catatan di
        // kartu dialog).
        if (nodeAkibat === null) {
          if (p === 'obrolan') nodeAkibat = e.node;
          else if (sela) { nodeAkibat = e.node; statusDiObrolan = e.node; }
          else statusTunda = null;
        } else if (e.node !== nodeAkibat) lepas();
      }
      setelahKeputusan = false;
      // Baris node akibat keputusan (catatan statusnya masih menunggu): akibat ditampilkan utuh, tidak dilipat.
      const diAkibat = statusTunda !== null && nodeAkibat === e.node;
      if (p === 'obrolan') {
        masukObrolan(urutanBaris > 0);
        const id = `b${pesan.length}`;
        const lampiran = { ...(b?.lampiran ? { lampiran: b.lampiran } : {}), ...(b?.topik ? { topik: b.topik } : {}), ...(diAkibat ? { akibat: true } : {}) };
        if (e.siapa === ep.nasabah) pesan.push({ jenis: 'masuk', id, teks: e.teks, ekspresi: e.ekspresi, node: e.node, ...lampiran });
        else if (e.siapa === 'pemain') pesan.push({ jenis: 'keluar', id, teks: e.teks, node: e.node });
        else pesan.push({ jenis: 'catatan', id, teks: e.teks, node: e.node, ...lampiran });
        keluarKeputusan = null;
        nodeSela = null;
      } else pandangLalu = p;
      return;
    }
    if (e.jenis === 'pilihan') {
      lepas();
      keluarKeputusan = null;
      nodeSela = null;
      statusDiObrolan = null;
      if (pandangPada(ep, k, e.node) === 'obrolan') {
        masukObrolan();
        pesan.push({ jenis: 'keluar', id: `p${pesan.length}`, teks: e.teks, node: e.node });
        keluarKeputusan = pesan.length - 1;
      }
      setelahKeputusan = true;
      return;
    }
    if (e.jenis === 'aktivitas') {
      lepas();
      keluarKeputusan = null;
      nodeSela = null;
      statusDiObrolan = null;
      const isi = pesanAktivitas(e.node, e.aktivitas);
      if (isi !== null) {
        masukObrolan();
        pesan.push({ jenis: 'keluar', id: `a${pesan.length}`, teks: null, isi, node: e.node });
        keluarKeputusan = pesan.length - 1;
      }
      setelahKeputusan = true;
      return;
    }
    // alasan: perubahan status (sesudah keputusan, atau efek node mis. protes janji).
    const sebelum = kepercayaan;
    if (typeof e.nilai === 'number') kepercayaan = e.nilai;
    const st: PesanObrolan = {
      jenis: 'status', id: `s${pesan.length}`, teks: e.teks, arah: e.arah,
      sebelum: labelStatus(ep, sebelum), sesudah: labelStatus(ep, kepercayaan), node: e.node,
    };
    if (setelahKeputusan) {
      // Keputusan: tempatnya ditentukan baris akibat pertama (lihat di atas).
      lepas();
      statusTunda = st;
      nodeAkibat = null;
    } else if (pandangLalu === 'obrolan') {
      // Efek node (mis. protes janji tanggal 20) sesudah barisnya tampil di obrolan: langsung.
      lepas();
      pesan.push(st);
    }
    setelahKeputusan = false;
  }, s.node);
  lepas();
  return { pesan, sesiMulai, statusDiObrolan, sesiTengahNode };
}

/**
 * Sesudah baris `teks` node `id` (lipatan `k` = sesudah cue baris itu) masih ada baris TANPA syarat yang tampil sebagai obrolan.
 * Baris bersyarat tidak dihitung: belum tentu tampil, dan catatan status tidak boleh menunggu obrolan yang tidak datang.
 */
function obrolanMenyusul(ep: Episode, k: Lipatan, id: IdNode, teks: KunciTeks): boolean {
  const n: NodeCerita | undefined = ep.node[id];
  if (!n || n.jenis === 'cabang') return false;
  const i = n.baris.findIndex((x) => x.teks === teks);
  if (i < 0) return false;
  let kk = k;
  for (const b of n.baris.slice(i + 1)) {
    kk = terapkanCue(kk, b.tata);
    if (!b.jika && pandangBaris(ep, kk, b) === 'obrolan') return true;
  }
  return false;
}

/**
 * Pesan yang diberi CUT-IN potret (Episode.cutIn): pesan masuk TERBARU bila teksnya terdaftar dan sesudahnya hanya ada
 * catatan/status dari node yang sama. Begitu pemain membalas atau cerita berlanjut ke node lain, pesan itu kembali menjadi
 * gelembung biasa (cut-in = penekanan sesaat, bukan elemen tetap). Baris bersyarat (protes janji) hanya ada di utas bila
 * memang tampil, jadi cut-in-nya ikut bersyarat. null = tanpa cut-in.
 */
export function idCutIn(ep: Episode, pesan: readonly PesanObrolan[]): string | null {
  if (!ep.cutIn?.length) return null;
  for (let i = pesan.length - 1; i >= 0; i--) {
    const p = pesan[i]!;
    if (p.jenis === 'masuk') {
      const sesudah = pesan.slice(i + 1);
      return ep.cutIn.includes(p.teks) && sesudah.every((x) => (x.jenis === 'catatan' || x.jenis === 'status') && x.node === p.node) ? p.id : null;
    }
    if (p.jenis === 'keluar') return null;
  }
  return null;
}

/** Tampilan keputusan di node `id` dengan lipatan saat itu (baris terakhir node menentukan). */
function pandangPada(ep: Episode, k: Lipatan, id: IdNode): Pandang {
  const n: NodeCerita | undefined = ep.node[id];
  const terakhir = n && n.jenis !== 'cabang' ? n.baris[n.baris.length - 1] : undefined;
  return pandangBaris(ep, k, terakhir ?? { siapa: 'narasi' });
}

/** Penutur baris: 'nasabah' | 'pemain' | 'narasi' | id pemeran lain (untuk kartu adegan). */
/**
 * Catatan narasi panjang di obrolan: kalimat pertama (biasanya konteks waktu, "Hari ke-1, pagi.") tampil, sisanya di balik
 * "Detail". Catatan pendek (<= 110 huruf) atau tanpa jeda kalimat di 70 huruf pertama = utuh (null).
 */
export function ringkasCatatan(teks: string): { awal: string; sisa: string } | null {
  if (teks.length <= 110) return null;
  const m = /^(.{3,70}?[.!?。])\s+(\S[\s\S]*)$/u.exec(teks);
  return m ? { awal: m[1]!, sisa: m[2]! } : null;
}

export function jenisPenutur(ep: Episode, siapa: string): 'nasabah' | 'pemain' | 'narasi' | 'tokoh' {
  if (siapa === 'pemain') return 'pemain';
  if (siapa === ep.nasabah) return 'nasabah';
  return adalahNarasi(ep, siapa) ? 'narasi' : 'tokoh';
}
