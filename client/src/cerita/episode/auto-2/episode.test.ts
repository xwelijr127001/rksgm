/**
 * Tes EPISODE AUTO-2 (kasus truk, 15 titik keputusan): struktur sesuai naskah, pemetaan tindakan -> alternatif yang
 * lengkap & deterministik, tiga akhir, penjepit status, janji tanggal 20 yang ditagih SEKALI, simpanan terpisah dari
 * Episode 1, panggung latar, dan audit bias penyajian balasan.
 */
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { MissionAnswer } from '@shared/types';
import { DAFTAR_EPISODE, cariEpisode } from '../index';
import { EPISODE_AUTO_1 } from '../auto-1/episode';
import { kondisiTerpenuhi, jalankan, nilaiAktivitas, nodeKini, stateAwal } from '../../mesin';
import { aturUlangMemoriCerita, muatProgres, mulaiBaru, simpanProgres } from '../../simpan';
import { teksCerita } from '../../teks';
import type { CabangHasil, Episode, NodeAktivitas, StateCerita } from '../../tipe';
import { komposisiLatar } from '../../ui/latar/komposisi';
import { idCutIn, utasObrolan } from '../../hp/alur';
import { deretStatus, hitungNilai, infoTitik, pilihanTitik } from '../../ui/titik';
import { TINGGI_LEGA, URUTAN_LEGA, URUTAN_PAS, pilihLega, pilihPas, type LegaAkhir, type PasAkhir } from '../../ui/pasAkhir';
import { majuSampaiKeputusan, salinJson } from '../../uji/jalurEpisode';
import { validasiEpisode } from '../../validasi';
import { ANGGOTA_KOMITE, EPISODE_AUTO_2 as EP, KOMITE_BERKAS } from './episode';

// ------------------------------------------------------------------ naskah (Skenario Auto 01): klasifikasi & status per alternatif

type Nilai = 'tepat' | 'kurang' | 'keliru';
/** Klasifikasi & perubahan status naskah untuk alternatif A-E tiap babak (sumber: tabel naskah, draf). */
const NASKAH: Record<string, Record<string, [Nilai, number]>> = {
  k01: { a: ['tepat', 6], b: ['keliru', -3], c: ['keliru', -6], d: ['kurang', 0], e: ['kurang', 0] },
  k02: { a: ['kurang', 0], b: ['tepat', 6], c: ['keliru', -6], d: ['keliru', -3], e: ['keliru', -3] },
  k03: { a: ['keliru', -6], b: ['kurang', 0], c: ['tepat', 6], d: ['keliru', -3], e: ['kurang', 0] },
  k04: { a: ['keliru', -6], b: ['kurang', 0], c: ['keliru', -3], d: ['tepat', 6], e: ['keliru', -6] },
  k05: { a: ['kurang', 0], b: ['keliru', -6], c: ['kurang', 0], d: ['keliru', -3], e: ['tepat', 6] },
  k06: { a: ['keliru', -12], b: ['tepat', 12], c: ['kurang', 0], d: ['keliru', -6], e: ['keliru', -6] },
  k07: { a: ['keliru', -3], b: ['kurang', 0], c: ['keliru', -6], d: ['tepat', 6], e: ['kurang', 0] },
  k08: { a: ['keliru', -6], b: ['keliru', -3], c: ['tepat', 6], d: ['kurang', 0], e: ['kurang', 0] },
  k09: { a: ['kurang', 0], b: ['keliru', -6], c: ['kurang', 0], d: ['keliru', -3], e: ['tepat', 6] },
  k10: { a: ['keliru', -6], b: ['keliru', -6], c: ['kurang', 0], d: ['tepat', 6], e: ['keliru', -3] },
  k11: { a: ['tepat', 6], b: ['keliru', -6], c: ['kurang', 0], d: ['keliru', -6], e: ['kurang', 0] },
  k12: { a: ['keliru', 4], b: ['tepat', 12], c: ['keliru', -12], d: ['kurang', 0], e: ['keliru', -6] },
  k13: { a: ['kurang', 0], b: ['keliru', -6], c: ['keliru', -6], d: ['kurang', 0], e: ['tepat', 6] },
  k14: { a: ['keliru', -12], b: ['keliru', -6], c: ['tepat', 12], d: ['kurang', 0], e: ['keliru', -6] },
  k15: { a: ['keliru', -6], b: ['kurang', 2], c: ['tepat', 6], d: ['keliru', -6], e: ['kurang', 0] },
};
const TITIK = Object.keys(NASKAH);
const BAGIAN: Record<string, string> = { k01: 'b1', k02: 'b1', k03: 'b1', k04: 'b2', k05: 'b2', k06: 'b2', k07: 'b3', k08: 'b3', k09: 'b3', k10: 'b3', k11: 'b3', k12: 'b4', k13: 'b4', k14: 'b4', k15: 'b4' };

// ------------------------------------------------------------------ pembantu

const kondisiState = (tanda: string[]) => ({ tanda, kepercayaan: 0, paham: [], proses: {} });

/** Alternatif (huruf) yang dipetakan cabang hasil ini, dari tanda `kep:` efeknya. */
function altCabang(titik: string, c: CabangHasil): string {
  const t = (c.efek?.pasang ?? []).find((x) => x.startsWith(`kep:${titik}:`));
  assert.ok(t, `${titik}: cabang tanpa tanda kep`);
  return t!.split(':')[2]!;
}

/** Cabang pertama yang cocok untuk jawaban ini (aturan berurutan, sama dengan mesin). */
function petakan(titik: string, jawaban: MissionAnswer): { alt: string; lanjut: string } {
  const n = EP.node[titik] as NodeAktivitas;
  const h = nilaiAktivitas(EP, EP.aktivitas[n.aktivitas]!, jawaban);
  const c = n.hasil.find((x) => x.jika === undefined || kondisiTerpenuhi(x.jika, kondisiState(h.tanda)));
  assert.ok(c, `${titik}: tidak ada cabang cocok`);
  return { alt: altCabang(titik, c!), lanjut: c!.lanjut };
}

/** Semua jawaban LENGKAP yang mungkin untuk aktivitas titik ini (susun: setiap item ke setiap wadah; pilih-satu: setiap opsi). */
function semuaJawaban(titik: string): MissionAnswer[] {
  const n = EP.node[titik] as NodeAktivitas;
  const misi = EP.aktivitas[n.aktivitas]!.misi('id');
  let hasil: MissionAnswer[] = [{}];
  for (const st of misi.steps) {
    const pilihan: unknown[] = [];
    if (st.kind === 'assign') {
      let peta: Record<string, string>[] = [{}];
      for (const it of st.items) peta = peta.flatMap((p) => st.buckets.map((b) => ({ ...p, [it.id]: b.id })));
      pilihan.push(...peta);
    } else if (st.kind === 'single') pilihan.push(...st.options.map((o) => o.id));
    else throw new Error(`langkah ${st.kind} tidak dipakai Episode 2`);
    hasil = hasil.flatMap((j) => pilihan.map((p) => ({ ...j, [st.id]: p as never })));
  }
  return hasil;
}

/** Satu jawaban yang dipetakan ke alternatif `alt` (yang pertama ditemukan). */
const jawabanUntuk = (() => {
  const cache = new Map<string, MissionAnswer>();
  return (titik: string, alt: string): MissionAnswer => {
    // T-022: periksa SIM bukan titik bernomor; jalur yang tidak menyebutnya = tanpa ketukan keliru.
    if (titik === 'ksim') return { sim: { periksa: alt === 'b' ? 'ragu' : 'bersih' } };
    const k = `${titik}:${alt}`;
    if (!cache.has(k)) {
      const j = semuaJawaban(titik).find((x) => petakan(titik, x).alt === alt);
      assert.ok(j, `${titik}: tidak ada susunan untuk alternatif ${alt}`);
      cache.set(k, j!);
    }
    return cache.get(k)!;
  };
})();

/** Mainkan seluruh episode dengan alternatif per titik; kembalikan state akhir. */
function mainkan(pilih: Record<string, string>, ep: Episode = EP): StateCerita {
  let s = majuSampaiKeputusan(ep, stateAwal(ep));
  for (let i = 0; i < 200 && !s.akhir; i++) {
    const n = nodeKini(ep, s)!;
    // T-022: periksa SIM bukan titik keputusan bernomor (tanpa cabang, tanpa perubahan status); dimainkan tanpa ketukan keliru.
    if (n.id === 'ksim') { s = majuSampaiKeputusan(ep, jalankan(ep, s, { jenis: 'aktivitas', node: 'ksim', jawaban: { sim: { periksa: pilih.ksim ?? 'bersih' } } })); continue; }
    const alt = pilih[n.id];
    assert.ok(alt, `node keputusan tak terduga: ${n.id}`);
    const b = n.jenis === 'pilihan' ? jalankan(ep, s, { jenis: 'pilih', node: n.id, pilihan: alt! })
      : jalankan(ep, s, { jenis: 'aktivitas', node: n.id, jawaban: jawabanUntuk(n.id, alt!) });
    assert.notEqual(b, s, `aksi ditolak di ${n.id}`);
    s = majuSampaiKeputusan(ep, b);
  }
  assert.ok(s.akhir, 'episode tidak selesai');
  return s;
}

const SEMUA = (alt: (titik: string) => string) => Object.fromEntries(TITIK.map((k) => [k, alt(k)]));
const TEPAT = SEMUA((k) => Object.keys(NASKAH[k]!).find((a) => NASKAH[k]![a]![0] === 'tepat')!);
const TERBURUK = SEMUA((k) => Object.entries(NASKAH[k]!).sort((x, y) => x[1][1] - y[1][1])[0]![0]);

// ------------------------------------------------------------------ struktur

test('Episode 2 sah menurut validator yang sama dengan Episode 1', () => {
  assert.deepEqual(validasiEpisode(EP), []);
  assert.deepEqual(validasiEpisode(EPISODE_AUTO_1), []);
});

test('terdaftar sebagai episode nomor 2 dengan id & namespace simpanan sendiri', () => {
  assert.deepEqual(DAFTAR_EPISODE.map((e) => e.id), ['auto-1', 'auto-2']);
  assert.equal(cariEpisode('auto-2'), EP);
  assert.equal(teksCerita(EP, EP.judul, 'id'), 'Truk Trailer di Jalan Tol');
});

test('15 titik keputusan: urut naskah, empat bagian, lima alternatif, klasifikasi & status sesuai naskah', () => {
  assert.deepEqual(EP.titik!.map((k) => k.id), TITIK);
  assert.deepEqual(EP.titik!.map((k) => k.nomor), TITIK.map((_, i) => i + 1));
  for (const k of EP.titik!) {
    assert.equal(EP.node[k.id]!.bab, BAGIAN[k.id], k.id);
    assert.deepEqual(Object.keys(k.alternatif), ['a', 'b', 'c', 'd', 'e'], k.id);
    for (const [alt, [nilai]] of Object.entries(NASKAH[k.id]!)) assert.equal(k.alternatif[alt]!.nilai, nilai, `${k.id}-${alt}`);
    assert.equal(k.alternatif[k.saran]!.nilai, 'tepat');
  }
  // Perubahan status tiap alternatif = naskah (diambil dari efek pilihan / cabang yang memasang kep:<titik>:<alt>).
  for (const k of TITIK) {
    const n = EP.node[k]!;
    const efek = n.jenis === 'pilihan' ? n.pilihan.map((p) => p.efek!) : (n as NodeAktivitas).hasil.map((h) => h.efek!);
    for (const e of efek) {
      const alt = e.pasang!.find((x) => x.startsWith(`kep:${k}:`))!.split(':')[2]!;
      assert.equal(e.kepercayaan, NASKAH[k]![alt]![1], `${k}-${alt}`);
    }
  }
});

test('9 titik tindakan pada objek + 6 balasan percakapan; aktivitas berakibat langsung & wajib lengkap', () => {
  const aktivitas = TITIK.filter((k) => EP.node[k]!.jenis === 'aktivitas');
  assert.deepEqual(aktivitas, ['k02', 'k04', 'k05', 'k07', 'k08', 'k09', 'k10', 'k11', 'k15']);
  for (const k of aktivitas) assert.equal((EP.node[k] as NodeAktivitas).langsung, true, k);
  assert.deepEqual(TITIK.filter((k) => EP.node[k]!.jenis === 'pilihan'), ['k01', 'k03', 'k06', 'k12', 'k13', 'k14']);
});

// ------------------------------------------------------------------ pemetaan tindakan -> alternatif

test('setiap susunan lengkap dipetakan ke tepat satu alternatif, dan kelima alternatif bisa dicapai', () => {
  const ukuran: Record<string, number> = {};
  for (const k of TITIK.filter((x) => EP.node[x]!.jenis === 'aktivitas')) {
    const semua = semuaJawaban(k);
    ukuran[k] = semua.length;
    const tercapai = new Set(semua.map((j) => petakan(k, j).alt));
    assert.deepEqual([...tercapai].sort(), ['a', 'b', 'c', 'd', 'e'], k);
    // Susunan yang disarankan (kunci aktivitas) memetakan ke alternatif tepat.
    const def = EP.aktivitas[(EP.node[k] as NodeAktivitas).aktivitas]!;
    const kunci = Object.fromEntries(def.kunci.map((x) => [x.stepId, x.assign ?? x.single]));
    assert.equal(petakan(k, kunci as MissionAnswer).alt, EP.titik!.find((t) => t.id === k)!.saran, `${k}: kunci`);
  }
  assert.deepEqual(ukuran, { k02: 6561, k04: 5, k05: 5, k07: 5, k08: 5, k09: 32, k10: 125, k11: 9, k15: 64 });
});

test('aturan berkas (K02): kekeliruan paling menentukan menang; surat polisi menyusul tidak menahan proses', () => {
  const dasar = { formulir: 'sekarang', stnk: 'sekarang', ktp: 'sekarang', sim: 'sekarang', suratpolisi: 'menyusul', kk: 'tidak', slip: 'tidak', rekening: 'tidak' };
  const alt = (ubah: Record<string, string>) => petakan('k02', { berkas: { ...dasar, ...ubah } }).alt;
  assert.equal(alt({}), 'b');
  assert.equal(alt({ suratpolisi: 'sekarang' }), 'c');
  assert.equal(alt({ suratpolisi: 'tidak' }), 'd');
  assert.equal(alt({ slip: 'menyusul' }), 'e');
  assert.equal(alt({ ktp: 'menyusul', sim: 'tidak' }), 'a');
  assert.equal(alt({ slip: 'sekarang', suratpolisi: 'tidak' }), 'e');
});

test('bundel (K11): sembilan kombinasi tetap memetakan ke alternatif lama; akibatnya menyebut berkas DAN kabar', () => {
  // Urutan aturan lama (sebelum akibat per kombinasi): disetujui > hendra > sekarang > nanti > sisa A.
  const lama = (bundel: string, kabar: string) => kabar === 'disetujui' ? 'd' : bundel === 'hendra' ? 'e' : bundel === 'sekarang' ? 'b' : kabar === 'nanti' ? 'c' : 'a';
  const akibat = new Set<string>();
  for (const bundel of ['lengkapi', 'sekarang', 'hendra']) {
    for (const kabar of ['persetujuan', 'disetujui', 'nanti']) {
      const r = petakan('k11', { bundel, kabar });
      assert.equal(r.alt, lama(bundel, kabar), `${bundel}+${kabar}`);
      akibat.add(r.lanjut);
      const n = EP.node[r.lanjut]!;
      assert.equal(n.jenis, 'dialog');
      const baris = n.jenis === 'dialog' ? n.baris : [];
      // Satu baris berkas (sesuai tindakan) + satu baris kabar, berlabel topik.
      assert.deepEqual(baris.filter((x) => x.topik).map((x) => x.topik), ['topik.berkas', 'topik.kabar'], r.lanjut);
      assert.equal(baris.find((x) => x.topik === 'topik.berkas')!.teks, `k11.akibat.berkas.${bundel}`, r.lanjut);
      // T-025: sisi berkas = ketukan PERTAMA, di ruang Komite; keadaan ruangnya dari tindakan atas berkas (KOMITE_BERKAS).
      const bk = baris[0]!;
      assert.equal(bk.topik, 'topik.berkas', `${r.lanjut}: berkas dulu`);
      assert.deepEqual(bk.tata, { lokasi: 'komite', hadir: [], telepon: null, objek: [], komite: KOMITE_BERKAS[bundel] }, r.lanjut);
      // Kabar terkirim = baris sesudah berkas kembali ke obrolan dengan Pak Hendra; tidak mengabari = tetap di ruang Komite.
      assert.equal(n.tata, undefined, `${r.lanjut}: tata ada di barisnya, bukan di node`);
      assert.equal(baris[1]!.tata?.telepon === 'hendra', kabar !== 'nanti', `${r.lanjut}: tempat akibat kabar`);
      assert.equal(baris.slice(2).some((x) => x.tata), false, `${r.lanjut}: tidak ada pergantian tata lain`);
    }
  }
  assert.equal(akibat.size, 9, 'tiap kombinasi punya akibat sendiri');
  // Fix 1: berkas lengkap = Komite masih menunggu / menimbang; tidak ada akibat K11 yang memperlihatkan SETUJU.
  assert.deepEqual(KOMITE_BERKAS, { lengkapi: 'tunggu', sekarang: 'catatan', hendra: 'kosong' });
});

test('T-025: ruang Komite di naskah: K11 pengantar menunggu, K13 dibuka dengan setuju lalu obrolan + surat, K12 tetap obrolan; anggota bukan pemeran', () => {
  const tata = (id: string) => (EP.node[id] as { tata?: unknown }).tata;
  const baris = (id: string) => (EP.node[id] as { baris: { teks: string; tata?: unknown; istilah?: string[] }[] }).baris;
  assert.deepEqual(EP.latar!.lokasi.komite, { nama: 'lokasi.komite', piksel: 'komite-ep2', komite: { tunggu: 'lokasi.komite.tunggu', setuju: 'lokasi.komite.setuju', catatan: 'lokasi.komite.catatan', kosong: 'lokasi.komite.kosong' } });
  // K11: pindah ruang terjadi di isyarat pengantar (tata node = baris narasi satu-satunya); kartu tugas bundel tampil di ketukan itu.
  assert.deepEqual(tata('k11'), { lokasi: 'komite', hadir: [], telepon: null, objek: [], komite: 'tunggu' });
  assert.deepEqual(baris('k11').map((x) => [x.teks, x.tata, x.istilah]), [['k11.1', undefined, ['komite']]]);
  // K12: tidak berubah (obrolan dari kantor).
  assert.deepEqual(tata('k12'), { lokasi: 'kantor', hadir: [], telepon: 'hendra', objek: [] });
  assert.ok(baris('k12').every((x) => !x.tata));
  // K13: ketukan pembuka di ruang Komite (setuju), lalu pesan Pak Hendra di obrolan dengan surat penawaran seperti semula.
  assert.deepEqual(tata('k13'), { lokasi: 'komite', hadir: [], telepon: null, objek: [], komite: 'setuju' });
  assert.deepEqual(baris('k13').map((x) => [x.teks, x.tata]), [['k13.1', undefined], ['k13.2', { lokasi: 'kantor', hadir: [], telepon: 'hendra', objek: ['surat'] }]]);
  // Fix 1: SETUJU hanya di K13 (keputusan Komite keluar di minggu ke-7; K11-D dan K12 berkata keputusan belum keluar).
  const bersetuju = Object.values(EP.node).filter((n) => JSON.stringify(n).includes('"komite":"setuju"')).map((n) => n.id);
  assert.deepEqual(bersetuju, ['k13']);
  for (const [id, harap] of [['k11-a', 'tunggu'], ['k11-c', 'tunggu'], ['k11-d', 'tunggu'], ['k11-b', 'catatan'], ['k11-d2', 'catatan'], ['k11-e', 'kosong'], ['k11-d3', 'kosong']] as const) {
    assert.equal((baris(id)[0]!.tata as { komite?: string }).komite, harap, id);
  }
  // Hanya K11 (dan akibatnya) serta K13 yang memberi isyarat komite.
  const berisyarat = Object.values(EP.node).filter((n) => JSON.stringify(n).includes('"komite":"')).map((n) => n.id).sort();
  assert.deepEqual(berisyarat, ['k11', 'k11-a', 'k11-b', 'k11-b2', 'k11-c', 'k11-d', 'k11-d2', 'k11-d3', 'k11-e', 'k11-e2', 'k13']);
  // Anggota komite = sprite milik ruang: bukan pemeran, tidak pernah menjadi penutur atau hadir di tata mana pun.
  for (const id of ANGGOTA_KOMITE) {
    assert.ok(!Object.prototype.hasOwnProperty.call(EP.pemeran, id), id);
    assert.ok(!JSON.stringify(EP.node).includes(`"siapa":"${id}"`), `${id} tidak pernah berbicara`);
  }
  // Istilah: empat peran + ikon, urut kursi.
  assert.deepEqual(EP.istilah!.komite, { label: 'istilah.komite.label', arti: 'istilah.komite.arti', anggota: ANGGOTA_KOMITE.map((id, i) => ({ teks: `istilah.komite.anggota.${i + 1}`, ikon: `komite-${id}` })) });
  assert.deepEqual(validasiEpisode(EP), []);
  // Validator menolak keadaan yang tidak dikenal, isyarat komite di lokasi tanpa kalimat keadaan, dan kalimat keadaan yang hilang.
  const ubah = (f: (e: typeof EP) => void) => { const e = structuredClone({ ...EP, aktivitas: {} }) as typeof EP; e.aktivitas = EP.aktivitas; f(e); return validasiEpisode(e).join(' | '); };
  assert.match(ubah((e) => { (e.node.k13 as { tata: { komite: string } }).tata.komite = 'tidur'; }), /node "k13"\.tata: keadaan komite "tidur" tidak dikenal/);
  assert.match(ubah((e) => { (e.node.k13 as { tata: { lokasi: string } }).tata.lokasi = 'kantor'; }), /isyarat komite di lokasi "kantor"/);
  assert.match(ubah((e) => { delete (e.latar!.lokasi.komite!.komite as Record<string, string>).kosong; }), /latar\.lokasi "komite"\.komite\.kosong/);
  assert.match(ubah((e) => { e.istilah!.komite!.anggota![0]!.teks = 'tidak.ada'; }), /istilah "komite"\.anggota\[0\]\.teks/);
});

test('aturan saksi (K09) & penutupan (K15): varian akibat tetap benar untuk susunannya', () => {
  const saksi = (ya: string[]) => petakan('k09', { saksi: Object.fromEntries(['hendra', 'darto', 'tol', 'polisi', 'mobilkecil'].map((x) => [x, ya.includes(x) ? 'ya' : 'tidak'])) });
  assert.deepEqual(saksi(['hendra', 'darto', 'tol', 'polisi']), { alt: 'e', lanjut: 'k09-e' });
  assert.deepEqual(saksi(['hendra', 'darto']), { alt: 'a', lanjut: 'k09-a' });
  assert.deepEqual(saksi(['darto', 'polisi']), { alt: 'a', lanjut: 'k09-a2' });
  assert.deepEqual(saksi(['darto']), { alt: 'b', lanjut: 'k09-b' });
  assert.deepEqual(saksi([]), { alt: 'd', lanjut: 'k09-d' });
  assert.deepEqual(saksi(['hendra', 'darto', 'tol', 'polisi', 'mobilkecil']), { alt: 'c', lanjut: 'k09-c' });
  const pesan = (masuk: string[]) => petakan('k15', { pesan: Object.fromEntries(['kabar', 'bukti', 'langkah', 'jujur', 'bintang', 'polis'].map((x) => [x, masuk.includes(x) ? 'masuk' : 'tidak'])) }).alt;
  assert.equal(pesan(['kabar', 'bukti', 'langkah', 'jujur']), 'c');
  assert.equal(pesan(['kabar']), 'b');
  assert.equal(pesan(['kabar', 'bukti', 'langkah', 'jujur', 'bintang']), 'd');
  assert.equal(pesan(['kabar', 'polis']), 'e');
  assert.equal(pesan(['bukti', 'langkah', 'jujur']), 'a');
});

// ------------------------------------------------------------------ jalur penuh, akhir, status

test('semua tepat: Puas, status dijepit 100, 15 keputusan tercatat, klaim dibayar', () => {
  const s = mainkan(TEPAT);
  assert.equal(s.akhir, 'puas');
  assert.equal(s.kepercayaan, 100);
  for (const k of TITIK) assert.equal(pilihanTitik(s, k), TEPAT[k], k);
  assert.ok(s.riwayat.some((e) => e.jenis === 'baris' && e.teks === 'akhir.bayar'));
});

test('alternatif terburuk tiap babak: Kurang puas, status tidak pernah di bawah 0, klaim tetap dibayar', () => {
  const s = mainkan(TERBURUK);
  assert.equal(s.akhir, 'kurang');
  assert.equal(s.kepercayaan, 0);
  const deret = deretStatus(EP, s);
  assert.ok(deret.every((v) => v >= 0 && v <= 100), deret.join(','));
  assert.ok(s.riwayat.some((e) => e.jenis === 'baris' && e.teks === 'akhir.bayar'));
});

test('ambang akhir dari status saja: 70 Puas, 45-69 Selesai dengan catatan, < 45 Kurang puas', () => {
  // Tepat di 1-3 dan 6 (+30), sisanya kurang tepat (+2 di 15) -> 62.
  const tengah = { ...SEMUA((k) => Object.keys(NASKAH[k]!).find((a) => NASKAH[k]![a]![0] === 'kurang')!), k01: 'a', k02: 'b', k03: 'c', k06: 'b' };
  const s = mainkan(tengah);
  assert.equal(s.kepercayaan, 62);
  assert.equal(s.akhir, 'catatan');
  const kurang = mainkan(SEMUA((k) => Object.keys(NASKAH[k]!).find((a) => NASKAH[k]![a]![0] === 'kurang')!));
  assert.equal(kurang.kepercayaan, 32);
  assert.equal(kurang.akhir, 'kurang');
});

test('janji tanggal 20 (12-A): +4 saat itu, protes -12 SEKALI di awal babak 14, tidak berulang setelah muat ulang', () => {
  const jalur: Record<string, string> = { ...TEPAT, k12: 'a', k06: 'c', k03: 'b' };
  // Satu 'lanjut' demi satu 'lanjut', mencatat state tepat di node protes (sebelum efeknya diterapkan saat maju).
  let simpanTengah: StateCerita | null = null;
  const maju = (x: StateCerita): StateCerita => {
    for (let i = 0; i < 500; i++) {
      if (x.node === 'k14-janji' && !simpanTengah) simpanTengah = salinJson(x);
      const y = jalankan(EP, x, { jenis: 'lanjut' });
      if (y === x) return x;
      x = y;
    }
    throw new Error('lanjut tidak berhenti');
  };
  let s = maju(stateAwal(EP));
  for (let i = 0; i < 50 && !s.akhir; i++) {
    const n = nodeKini(EP, s)!;
    const alt = jalur[n.id]!;
    s = maju(n.jenis === 'pilihan' ? jalankan(EP, s, { jenis: 'pilih', node: n.id, pilihan: alt }) : jalankan(EP, s, { jenis: 'aktivitas', node: n.id, jawaban: jawabanUntuk(n.id, alt) }));
  }
  const protes = (x: StateCerita) => x.riwayat.filter((e) => e.jenis === 'alasan' && e.teks === 'k14.janji.alasan');
  assert.ok(s.akhir);
  assert.equal(protes(s).length, 1);
  const e = protes(s)[0]!;
  assert.equal(e.jenis === 'alasan' ? e.arah : '', 'turun');
  // Status tepat sebelum protes (sesudah titik 13) turun 12 (dijepit) sesudahnya.
  const deret = deretStatus(EP, s);
  const iProtes = s.riwayat.filter((x) => x.jenis === 'alasan').findIndex((x) => x.jenis === 'alasan' && x.teks === 'k14.janji.alasan');
  assert.equal(deret[iProtes + 1], Math.max(0, deret[iProtes]! - 12));
  // Muat ulang tepat di node protes: efek baru diterapkan saat maju, tetap sekali; status akhir sama.
  assert.ok(simpanTengah, 'node protes tidak pernah tampil');
  const lanjutan = mainkanDari(salinJson(simpanTengah!), jalur);
  assert.equal(protes(lanjutan).length, 1);
  assert.equal(lanjutan.kepercayaan, s.kepercayaan);
  assert.equal(lanjutan.akhir, s.akhir);
  // Tanpa janji: tidak ada protes.
  assert.equal(protes(mainkan(TEPAT)).length, 0);
});

test('cut-in obrolan: momen terpilih saja; protes janji hanya bila janji 12-A dibuat; hilang sesudah dibalas', () => {
  const tanpaPesanAktivitas = () => null;
  const cutInDi = (s: StateCerita) => {
    const u = utasObrolan(EP, s, tanpaPesanAktivitas).pesan;
    const id = idCutIn(EP, u);
    return id ? u.find((p) => p.id === id)!.teks : null;
  };
  // Langkah demi langkah sepanjang jalur; catat teks cut-in yang pernah muncul.
  const jalani = (jalur: Record<string, string>) => {
    const muncul = new Set<string>();
    let x = stateAwal(EP);
    for (let i = 0; i < 2000 && !x.akhir; i++) {
      const t = cutInDi(x);
      if (t) muncul.add(t);
      const n = nodeKini(EP, x)!;
      let y = jalankan(EP, x, { jenis: 'lanjut' });
      if (y === x) {
        const alt = jalur[n.id]!;
        y = n.jenis === 'pilihan' ? jalankan(EP, x, { jenis: 'pilih', node: n.id, pilihan: alt }) : jalankan(EP, x, { jenis: 'aktivitas', node: n.id, jawaban: jawabanUntuk(n.id, alt) });
      }
      if (y === x) break;
      x = y;
    }
    // Baris akhir nasabah (sebelum layar akhir): sejak T-019 tatap muka di panggung, TANPA cut-in obrolan.
    for (let i = 0; i < 10; i++) { const t = cutInDi(x); if (t) muncul.add(t); const y = jalankan(EP, x, { jenis: 'lanjut' }); if (y === x) break; x = y; }
    return muncul;
  };
  const tepat = jalani(TEPAT);
  assert.deepEqual([...tepat].sort(), ['k01.2', 'k12.2'], 'jalur tepat: kecemasan awal, tanggal 20 (akhir = tatap muka, T-019)');
  // T-019 (D-105): tiga akhir = kantor, Miss Raksa + Pak Hendra hadir, tanpa telepon; teks baris tidak berubah.
  for (const akhir of ['puas', 'catatan', 'kurang']) {
    const n = EP.node[`akhir-${akhir}`] as unknown as { tata: unknown; baris: { teks: string; siapa: string }[] };
    assert.deepEqual(n.tata, { lokasi: 'kantor', hadir: ['missRaksa', 'hendra'], telepon: null, objek: [] });
    assert.deepEqual(n.baris.map((x) => [x.teks, x.siapa]), [[`akhir.${akhir}.1`, 'hendra'], ['akhir.bayar', 'narasi'], [`akhir.${akhir}.2`, 'missRaksa']]);
  }
  const janji = jalani({ ...TEPAT, k12: 'a', k06: 'c', k03: 'b' });
  assert.ok(janji.has('k14.janji.1'), 'janji 12-A: protes babak 14 diberi cut-in');
  // Sesudah pemain membalas pesan pertama, cut-in hilang (kembali gelembung biasa).
  const k01 = majuSampaiKeputusan(EP, stateAwal(EP));
  assert.equal(cutInDi(k01), 'k01.2');
  assert.equal(cutInDi(jalankan(EP, k01, { jenis: 'pilih', node: 'k01', pilihan: 'a' })), null);
  assert.equal(idCutIn({ ...EP, cutIn: [] }, utasObrolan(EP, k01, tanpaPesanAktivitas).pesan), null, 'tanpa daftar = tanpa cut-in');
});

function mainkanDari(awal: StateCerita, pilih: Record<string, string>): StateCerita {
  let s = majuSampaiKeputusan(EP, awal);
  for (let i = 0; i < 200 && !s.akhir; i++) {
    const n = nodeKini(EP, s)!;
    const alt = pilih[n.id]!;
    s = majuSampaiKeputusan(EP, n.jenis === 'pilihan' ? jalankan(EP, s, { jenis: 'pilih', node: n.id, pilihan: alt }) : jalankan(EP, s, { jenis: 'aktivitas', node: n.id, jawaban: jawabanUntuk(n.id, alt) }));
  }
  return s;
}

test('coba lagi dari Bagian 4 sesudah janji: cadangan bab sebelum 12, janji & protes tidak terbawa', () => {
  const s = mainkan({ ...TEPAT, k12: 'a' });
  const ulang = jalankan(EP, s, { jenis: 'ulangBab', bab: 'b4' });
  assert.notEqual(ulang, s);
  assert.equal(ulang.node, 'k12');
  assert.ok(!ulang.tanda.includes('janji-20'));
  const akhir = mainkanDari(ulang, TEPAT);
  assert.equal(akhir.riwayat.filter((e) => e.jenis === 'alasan' && e.teks === 'k14.janji.alasan').length, 0);
  assert.equal(akhir.akhir, 'puas');
});

// ------------------------------------------------------------------ simpanan terpisah dari Episode 1

class Penyimpanan {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
}
beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new Penyimpanan(), configurable: true, writable: true });
  aturUlangMemoriCerita();
});

test('progres Episode 2 tidak menimpa Episode 1; mulai baru Episode 2 hanya mengarsipkan Episode 2', () => {
  const s1 = jalankan(EPISODE_AUTO_1, stateAwal(EPISODE_AUTO_1), { jenis: 'lanjut' });
  assert.ok(simpanProgres(EPISODE_AUTO_1, s1));
  const s2 = majuSampaiKeputusan(EP, stateAwal(EP));
  const s2b = jalankan(EP, s2, { jenis: 'pilih', node: 'k01', pilihan: 'a' });
  assert.ok(simpanProgres(EP, s2b));
  const m1 = muatProgres(EPISODE_AUTO_1);
  const m2 = muatProgres(EP);
  assert.equal(m1.status, 'lanjut');
  assert.equal(m2.status, 'lanjut');
  if (m1.status === 'lanjut') assert.deepEqual(m1.state, s1);
  mulaiBaru(EP);
  assert.equal(muatProgres(EP).status, 'baru');
  const lagi = muatProgres(EPISODE_AUTO_1);
  assert.equal(lagi.status, 'lanjut');
  if (lagi.status === 'lanjut') assert.deepEqual(lagi.state, s1);
});

// ------------------------------------------------------------------ panggung latar & bahasa

test('komposisi panggung latar mengikuti tata node/baris dan wajah pembicara', () => {
  const awal = stateAwal(EP);
  assert.deepEqual(komposisiLatar(EP, awal).hadir.map((x) => x.id), ['missRaksa']);
  const k01 = majuSampaiKeputusan(EP, awal);
  const kk = komposisiLatar(EP, k01);
  assert.equal(kk.lokasi, 'kantor');
  assert.equal(kk.telepon?.id, 'hendra');
  assert.equal(kk.telepon?.ekspresi, 'bingung');
  // Babak 4: Mas Rudi di pool.
  const k04 = mainkanSampai('k04');
  const kp = komposisiLatar(EP, k04);
  assert.equal(kp.lokasi, 'pool');
  assert.deepEqual(kp.hadir.map((x) => x.id), ['rudi']);
  // T-013 Stage 3: semua lokasi = ruang piksel `<lokasi>-ep2` (panggung ilustrasi dihapus).
  for (const [id, l] of Object.entries(EP.latar!.lokasi)) assert.equal(l.piksel, `${id}-ep2`, id);
});

function mainkanSampai(target: string): StateCerita {
  let s = majuSampaiKeputusan(EP, stateAwal(EP));
  while (s.node !== target) {
    const n = nodeKini(EP, s)!;
    const alt = TEPAT[n.id]!;
    s = majuSampaiKeputusan(EP, n.jenis === 'pilihan' ? jalankan(EP, s, { jenis: 'pilih', node: n.id, pilihan: alt }) : jalankan(EP, s, { jenis: 'aktivitas', node: n.id, jawaban: jawabanUntuk(n.id, alt) }));
  }
  return s;
}

test('T-014: naskah tersedia dalam id, en, zh (kelengkapan diuji di teks.test.ts)', () => {
  assert.deepEqual(EP.bahasa, ['id', 'en', 'zh']);
  assert.notEqual(teksCerita(EP, 'k01.2', 'en'), teksCerita(EP, 'k01.2', 'id'));
  assert.notEqual(teksCerita(EP, 'k01.2', 'zh'), teksCerita(EP, 'k01.2', 'id'));
});

// ------------------------------------------------------------------ audit bias penyajian balasan

test('balasan yang disarankan bukan satu-satunya terpanjang/terpendek, dan posisinya berbeda-beda', () => {
  const posisi: number[] = [];
  for (const k of TITIK.filter((x) => EP.node[x]!.jenis === 'pilihan')) {
    const n = EP.node[k]!;
    if (n.jenis !== 'pilihan') continue;
    const saran = EP.titik!.find((t) => t.id === k)!.saran;
    const panjang = n.pilihan.map((p) => ({ id: p.id, n: teksCerita(EP, p.teks, 'id', { nama: 'Rina' }).length }));
    const maks = Math.max(...panjang.map((p) => p.n));
    const min = Math.min(...panjang.map((p) => p.n));
    const pSaran = panjang.find((p) => p.id === saran)!.n;
    assert.ok(!(pSaran === maks && panjang.filter((p) => p.n === maks).length === 1), `${k}: saran satu-satunya terpanjang (${JSON.stringify(panjang)})`);
    assert.ok(!(pSaran === min && panjang.filter((p) => p.n === min).length === 1), `${k}: saran satu-satunya terpendek`);
    posisi.push(n.pilihan.findIndex((p) => p.id === saran));
  }
  assert.ok(new Set(posisi).size >= 4, `posisi saran terlalu seragam: ${posisi.join(',')}`);
});

// ------------------------------------------------------------------ T-024: layar akhir satu layar (strip token + lembar rincian)

test('T-024: token keputusan = pilihan, klasifikasi, dan saran naskah hanya bila berbeda; legenda menghitung per klasifikasi', () => {
  const tepat = mainkan(TEPAT);
  const buruk = mainkan(TERBURUK);
  assert.equal(EP.titik!.length, 15);
  for (const k of EP.titik!) {
    const a = infoTitik(tepat, k);
    assert.deepEqual([a.alt, a.nilai, a.saran, a.label], [TEPAT[k.id], 'tepat', null, k.alternatif[TEPAT[k.id]!]!.label], k.id);
    const b = infoTitik(buruk, k);
    assert.equal(b.alt, TERBURUK[k.id], k.id);
    assert.equal(b.nilai, NASKAH[k.id]![TERBURUK[k.id]!]![0], k.id);
    // Yang disarankan = satu-satunya alternatif "tepat" titik itu, dan hanya disebut bila pemain memilih yang lain.
    assert.equal(b.saran, b.alt === k.saran ? null : k.alternatif[k.saran]!.label, k.id);
  }
  assert.deepEqual(hitungNilai(EP, tepat), { tepat: 15, kurang: 0, keliru: 0 });
  const h = hitungNilai(EP, buruk);
  assert.equal(h.tepat + h.kurang + h.keliru, 15);
  assert.equal(h.keliru, TITIK.filter((k) => NASKAH[k]![TERBURUK[k]!]![0] === 'keliru').length);
  // Simpanan rusak: titik tanpa tanda / dengan alternatif tak dikenal = tidak tercatat (token abu), tidak dihitung, saran tetap ada.
  const rusak = { tanda: ['kep:k01:zz', 'kep:k02:b'] };
  const k1 = infoTitik(rusak, EP.titik![0]!);
  assert.deepEqual([k1.alt, k1.label, k1.nilai], [null, null, null]);
  assert.equal(k1.saran, EP.titik![0]!.alternatif[EP.titik![0]!.saran]!.label);
  assert.deepEqual(infoTitik(rusak, EP.titik![2]!), { alt: null, label: null, nilai: null, saran: EP.titik![2]!.alternatif[EP.titik![2]!.saran]!.label });
  assert.deepEqual(hitungNilai(EP, rusak), { tepat: 1, kurang: 0, keliru: 0 });
});

test('T-024: aturan pas layar akhir: utuh, lalu tanpa kalimat sebab, lalu tanpa legenda, lalu jaring pengaman gulir', () => {
  assert.deepEqual([...URUTAN_PAS], ['utuh', 'tanpa-sebab', 'tanpa-legenda', 'gulir']);
  const coba = (muatMulai: PasAkhir | null) => { const ditanya: PasAkhir[] = []; const hasil = pilihPas((p) => { ditanya.push(p); return muatMulai !== null && URUTAN_PAS.indexOf(p) >= URUTAN_PAS.indexOf(muatMulai); }); return [hasil, ditanya.join(' ')]; };
  // Susunan pertama yang muat dipakai dan yang sesudahnya tidak dicoba; "gulir" tidak pernah ditanyakan (selalu muat).
  assert.deepEqual(coba('utuh'), ['utuh', 'utuh']);
  assert.deepEqual(coba('tanpa-sebab'), ['tanpa-sebab', 'utuh tanpa-sebab']);
  assert.deepEqual(coba('tanpa-legenda'), ['tanpa-legenda', 'utuh tanpa-sebab tanpa-legenda']);
  assert.deepEqual(coba(null), ['gulir', 'utuh tanpa-sebab tanpa-legenda']);
});

test('T-024 polish (D-245): layar tinggi melonggar berurutan selama muat: Pelajaran utuh, kalimat sebab utuh, grafik; berhenti di yang pertama tidak muat', () => {
  assert.deepEqual([...URUTAN_LEGA], ['pelajaran', 'sebab', 'grafik']);
  // Batas tinggi di antara ukuran mock (640 / 645: potongan dua baris tetap) dan layar tinggi yang diukur Designer (740 / 844).
  assert.ok(TINGGI_LEGA > 645 && TINGGI_LEGA <= 740, String(TINGGI_LEGA));
  const coba = (muat: LegaAkhir[]) => { const ditanya: string[] = []; const hasil = pilihLega((l) => { ditanya.push(l.join('+')); return muat.includes(l[l.length - 1]!); }); return [hasil.join(' '), ditanya.join(' ')]; };
  assert.deepEqual(coba(['pelajaran', 'sebab', 'grafik']), ['pelajaran sebab grafik', 'pelajaran pelajaran+sebab pelajaran+sebab+grafik']);
  assert.deepEqual(coba(['pelajaran', 'sebab']), ['pelajaran sebab', 'pelajaran pelajaran+sebab pelajaran+sebab+grafik']);
  // Kalimat sebab tidak muat: berhenti di sana; grafik TIDAK dicoba (urutan, bukan pilihan bebas).
  assert.deepEqual(coba(['pelajaran', 'grafik']), ['pelajaran', 'pelajaran pelajaran+sebab']);
  assert.deepEqual(coba(['sebab', 'grafik']), ['', 'pelajaran']);
  assert.deepEqual(coba([]), ['', 'pelajaran']);
});
