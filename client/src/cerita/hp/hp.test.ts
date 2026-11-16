/**
 * Tes ANTARMUKA HP (fungsi murni): ketukan & tampilan per baris (alur.ts), utas obrolan dari riwayat, logika arena
 * (logika.ts) yang berbagi MissionAnswer dengan antarmuka standar, pesan & ringkasan tindakan, dan validasi
 * konfigurasi arena. Memakai Episode 2 sungguhan lewat mesin, persis seperti pemain.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { MissionAnswer } from '@shared/types';
import { jalankan, pilihanTersedia, semuaBarisTampil, stateAwal } from '../mesin';
import { teksCerita } from '../teks';
import type { AksiCerita, Episode, KonfigArena, KunciTeks, NodeAktivitas, StateCerita } from '../tipe';
import { LANJUT } from '../uji/jalurEpisode';
import { validasiEpisode } from '../validasi';
import { EPISODE_AUTO_2 as EP } from '../episode/auto-2/episode';
import { ketukanBelumUtuh, ketukanKini, pandangKini, ringkasCatatan, utasObrolan, type PesanObrolan } from './alur';
import {
  alihBagian, bagianDiPesan, itemArena, itemBerikut, jawabanKirim, kelompokWadah, lepaskan, petaLangkah, pilihOpsi, sisaArena, tetapkan,
  type ArenaPesan, type ArenaSusun,
} from './arena/logika';
import { ringkasTindakan } from './arena/ringkas';

const tx = (k: KunciTeks, p?: Record<string, string | number>) => teksCerita(EP, k, 'id', { nama: 'Rina', ...p });

/** Seperti PemainHP: sesudah tiap aksi, baris berikutnya dalam ketukan yang sama ikut tampil. */
function kirim(s: StateCerita, aksi: AksiCerita): StateCerita {
  let x = jalankan(EP, s, aksi);
  for (let i = 0; i < 12 && ketukanBelumUtuh(EP, x); i++) x = jalankan(EP, x, LANJUT);
  return x;
}
const siapMemutuskan = (s: StateCerita) => semuaBarisTampil(EP, s) && pilihanTersedia(EP, s).length > 0;
const arenaDi = (node: string): KonfigArena => EP.aktivitas[(EP.node[node] as NodeAktivitas).aktivitas]!.arena!;
const pesanAktivitas = (s: StateCerita) => (_n: string, id: string) => {
  const def = EP.aktivitas[id];
  const j = s.aktivitas[id]?.jawaban;
  return def?.pesanObrolan && j ? def.pesanObrolan(j, tx) : null;
};
/** 'lanjut' (dengan ketukan utuh) sampai node keputusan/aktivitas `node` siap diputuskan. */
function majuKe(s: StateCerita, node: string): StateCerita {
  let x = s;
  for (let i = 0; i < 80 && !(x.node === node && (siapMemutuskan(x) || (EP.node[node]!.jenis === 'aktivitas' && semuaBarisTampil(EP, x)))); i++) x = kirim(x, LANJUT);
  assert.equal(x.node, node, `tidak sampai ke ${node}`);
  return x;
}
const BERKAS_TEPAT = { formulir: 'sekarang', stnk: 'sekarang', ktp: 'sekarang', sim: 'sekarang', suratpolisi: 'menyusul', kk: 'tidak', slip: 'tidak', rekening: 'tidak' };

// ------------------------------------------------------------------ ketukan & tampilan

test('pembuka: tiga beat Miss Raksa (satu gagasan + wajah baru tiap beat), lalu satu "Lanjut" ke balasan pertama di obrolan', () => {
  let s = stateAwal(EP);
  for (let i = 0; i < 12 && ketukanBelumUtuh(EP, s); i++) s = jalankan(EP, s, LANJUT);
  // Beat = satu baris Miss Raksa dengan ekspresi berbeda (salam -> kasus -> cara bermain); tidak ada beat kosong.
  const ekspresi: string[] = [];
  for (let beat = 0; beat < 3; beat++) {
    const k = ketukanKini(EP, s)!;
    assert.equal(k.pandang, 'adegan');
    assert.equal(k.akhir - k.awal, 0, `beat ${beat + 1} berisi ${k.akhir - k.awal + 1} baris`);
    ekspresi.push((EP.node.buka as { baris: { ekspresi?: string }[] }).baris[k.akhir]!.ekspresi ?? 'netral');
    if (beat < 2) s = kirim(s, LANJUT);
  }
  assert.equal(new Set(ekspresi).size, 3, 'tiap beat pembuka mengganti wajah Miss Raksa');
  // Narasi menempel pada beat sebelumnya (bukan ketukan kosong): k01 = laporan + pesan Pak Hendra + pilihan, satu ketukan.
  const s1 = kirim(s, LANJUT);
  assert.equal(s1.node, 'k01');
  assert.ok(siapMemutuskan(s1), 'balasan pertama belum bisa dipilih sesudah ketukan terakhir pembuka');
  assert.equal(pandangKini(EP, s1), 'obrolan');
});

test('beat adegan: narasi + ucapan tokoh = dua beat (bidikan lebar lalu pembicara); narasi sesudah ucapan menempel', () => {
  // Babak 8 (ruas tol): narasi rambu (lebar) lalu pertanyaan Pak Bima (pembicara) sebelum keputusan. State dibangun langsung
  // di k08 (beat hanya membaca node, baris terlihat, dan tata node).
  const n8 = EP.node.k08 as { baris: { siapa: string; teks: string; ekspresi?: string }[] };
  const baris = (i: number) => ({ jenis: 'baris' as const, node: 'k08', siapa: n8.baris[i]!.siapa, ...(n8.baris[i]!.ekspresi ? { ekspresi: n8.baris[i]!.ekspresi as never } : {}), teks: n8.baris[i]!.teks });
  let s: StateCerita = { ...stateAwal(EP), node: 'k08', baris: 1, riwayat: [baris(0)] };
  for (let i = 0; i < 12 && ketukanBelumUtuh(EP, s); i++) s = jalankan(EP, s, LANJUT);
  const k1 = ketukanKini(EP, s)!;
  assert.deepEqual([k1.awal, k1.akhir], [0, 0], 'beat 1 = narasi lokasi saja');
  s = kirim(s, LANJUT);
  const k2 = ketukanKini(EP, s)!;
  assert.deepEqual([k2.awal, k2.akhir], [1, 1], 'beat 2 = pertanyaan Pak Bima');
  assert.ok(semuaBarisTampil(EP, s), 'tugas (aktivitas arena) tampil sesudah dialog yang relevan');
});

test('utas obrolan: balasan pemain, reaksi nasabah, lalu catatan status SESUDAH reaksinya', () => {
  let s = majuKe(stateAwal(EP), 'k01');
  s = kirim(s, { jenis: 'pilih', node: 'k01', pilihan: 'a' });
  const { pesan } = utasObrolan(EP, s, pesanAktivitas(s));
  const keluar = pesan.findIndex((p) => p.jenis === 'keluar');
  const reaksi = pesan.findIndex((p, i) => i > keluar && p.jenis === 'masuk');
  const status = pesan.findIndex((p) => p.jenis === 'status');
  assert.ok(keluar >= 0 && reaksi > keluar, 'reaksi Pak Hendra harus sesudah balasan');
  assert.ok(status > reaksi, 'catatan status harus sesudah reaksi');
  const st = pesan[status] as Extract<PesanObrolan, { jenis: 'status' }>;
  assert.equal(st.arah, 'naik');
  // Foto truk adalah lampiran pesan di obrolan (bukti yang relevan), bukan ponsel dekoratif.
  assert.ok(pesan.some((p) => (p.jenis === 'masuk' || p.jenis === 'catatan') && p.lampiran === 'fotoTruk'));
});

test('aktivitas dokumen: susunan arena menjadi SATU pesan keluar yang menyebut dokumennya, reaksi & status menyusul', () => {
  let s = majuKe(stateAwal(EP), 'k01');
  s = kirim(s, { jenis: 'pilih', node: 'k01', pilihan: 'a' });
  s = majuKe(s, 'k02');
  const k = arenaDi('k02') as ArenaSusun;
  s = kirim(s, { jenis: 'aktivitas', node: 'k02', jawaban: jawabanKirim(k, { [k.langkah]: BERKAS_TEPAT }) });
  assert.ok(s.tanda.includes('kep:k02:b'), 'susunan tepat harus dipetakan ke alternatif tepat naskah (B)');
  const { pesan } = utasObrolan(EP, s, pesanAktivitas(s));
  const keluar = pesan.filter((p): p is Extract<PesanObrolan, { jenis: 'keluar' }> => p.jenis === 'keluar' && p.node === 'k02');
  assert.equal(keluar.length, 1);
  assert.equal(keluar[0]!.isi, 'Pak, mohon kirim dokumen ini: Formulir klaim, STNK truk, KTP Pak Hendra dan SIM Pak Darto. Yang boleh menyusul begitu siap: Surat keterangan polisi.');
  const i = pesan.indexOf(keluar[0]!);
  assert.ok(pesan.slice(i + 1).some((p) => p.jenis === 'masuk'), 'reaksi Pak Hendra sesudah permintaan');
  assert.equal(pesan[pesan.length - 1]!.jenis, 'status');
});

test('akibat bundel (K11): kabar terkirim dulu, lalu akibat berkas & kabar berlabel (utuh), lalu alasan + status', () => {
  // Pintas sah: susunan arena per titik (jalur apa saja) hanya untuk sampai ke K11; yang diuji utas sesudahnya.
  const lewat = (s: StateCerita): StateCerita => {
    let x = s;
    for (let i = 0; i < 400 && x.node !== 'k11'; i++) {
      const n = EP.node[x.node]!;
      if (n.jenis === 'pilihan' && siapMemutuskan(x)) x = kirim(x, { jenis: 'pilih', node: x.node, pilihan: pilihanTersedia(EP, x)[0]!.id });
      else if (n.jenis === 'aktivitas' && semuaBarisTampil(EP, x)) {
        const k = arenaDi(x.node);
        const j: MissionAnswer = k.pola === 'susun' ? { [k.langkah]: Object.fromEntries(k.benda.map((b) => [b.id, k.wadah[0]!.id])) }
          : k.pola === 'tujuan' ? tetapkan({}, k.langkah, k.benda.id, k.tujuan[0]!.id)
            : k.pola === 'bandingkan' ? { [k.langkah]: Object.fromEntries(k.selisih.map((x2) => [x2.id, k.perlakuan[0]!.id])) } : {};
        x = kirim(x, { jenis: 'aktivitas', node: x.node, jawaban: jawabanKirim(k, j) });
      } else x = kirim(x, LANJUT);
    }
    return majuKe(x, 'k11');
  };
  const awal = lewat(stateAwal(EP));
  // Ajukan sekarang + kabar tahap persetujuan (B): pesan terkirim, berkas dikembalikan, kabar tidak disangkal.
  let s = kirim(awal, { jenis: 'aktivitas', node: 'k11', jawaban: { bundel: 'sekarang', kabar: 'persetujuan' } });
  while (!semuaBarisTampil(EP, s)) s = kirim(s, LANJUT);
  assert.equal(s.node, 'k11-b2');
  const { pesan } = utasObrolan(EP, s, pesanAktivitas(s));
  const i = pesan.findIndex((p) => p.jenis === 'keluar' && p.node === 'k11');
  assert.ok(i >= 0, 'kabar yang dipilih tampil sebagai pesan terkirim');
  const sesudah = pesan.slice(i + 1);
  const catatan = sesudah.filter((p): p is Extract<PesanObrolan, { jenis: 'catatan' }> => p.jenis === 'catatan');
  assert.deepEqual(catatan.map((p) => p.topik), ['topik.berkas', 'topik.kabar']);
  assert.ok(catatan.every((p) => p.akibat), 'akibat tidak dilipat di balik "Detail"');
  assert.doesNotMatch(catatan.map((p) => tx(p.teks)).join(' '), /belum mengabari|tidak tahu apa-apa/, 'pemain mengabari: akibat tidak boleh menyatakan sebaliknya');
  assert.equal(sesudah[sesudah.length - 1]!.jenis, 'status', 'perubahan status sesudah akibat');
  // Tanpa kabar (C): akibat tetap di kantor (tanpa pesan terkirim) dan menyebut kedua sisi.
  let c = kirim(awal, { jenis: 'aktivitas', node: 'k11', jawaban: { bundel: 'lengkapi', kabar: 'nanti' } });
  while (!semuaBarisTampil(EP, c)) c = kirim(c, LANJUT);
  assert.equal(pandangKini(EP, c), 'adegan');
  assert.equal(utasObrolan(EP, c, pesanAktivitas(c)).pesan.filter((p) => p.jenis === 'keluar' && p.node === 'k11').length, 0);
  assert.equal(ringkasTindakan(EP, 'bundel', { bundel: 'lengkapi', kabar: 'nanti' }, tx), null, 'baris akibat sudah menyebut kedua tindakan');
});

// ------------------------------------------------------------------ logika arena

test('susun: tetapkan / ubah / lepaskan; urutan benda berikutnya; ringkasan per baki; sisa = yang belum ditempatkan', () => {
  const k = arenaDi('k02') as ArenaSusun;
  let j: MissionAnswer = {};
  assert.equal(sisaArena(k, j), 8);
  assert.equal(itemBerikut(k, j), 'formulir');
  j = tetapkan(j, k.langkah, 'formulir', 'sekarang');
  j = tetapkan(j, k.langkah, 'suratpolisi', 'tidak');
  assert.equal(itemBerikut(k, j), 'kk');
  assert.equal(sisaArena(k, j), 6);
  // Ubah penempatan: benda pindah baki, tidak dobel.
  j = tetapkan(j, k.langkah, 'suratpolisi', 'menyusul');
  assert.deepEqual(kelompokWadah(k, j), { sekarang: ['formulir'], menyusul: ['suratpolisi'], tidak: [] });
  j = lepaskan(j, k.langkah, 'formulir');
  assert.equal(itemBerikut(k, j), 'formulir');
  assert.equal(sisaArena(k, j), 7);
  // Wadah yang tidak dikenal tidak dihitung ditempatkan.
  assert.equal(sisaArena(k, tetapkan({}, k.langkah, 'formulir', 'entah')), 8);
  assert.deepEqual(itemArena(k), k.benda.map((b) => b.id));
});

test('pesan: masukkan/keluarkan bagian; yang tidak dimasukkan dikirim sebagai "tidak"; pesan kosong belum boleh dikirim', () => {
  const k = arenaDi('k15') as ArenaPesan;
  let j: MissionAnswer = {};
  assert.equal(sisaArena(k, j), 1);
  j = alihBagian(k, j, 'jujur');
  j = alihBagian(k, j, 'kabar');
  assert.deepEqual(bagianDiPesan(k, j), ['kabar', 'jujur'], 'urutan pesan mengikuti urutan bagian, bukan urutan ketukan');
  assert.equal(sisaArena(k, j), 0);
  j = alihBagian(k, j, 'jujur');
  assert.deepEqual(bagianDiPesan(k, j), ['kabar']);
  const kirimJ = jawabanKirim(k, j);
  const peta = petaLangkah(kirimJ, k.langkah);
  assert.equal(Object.keys(peta).length, k.benda.length);
  assert.ok(Object.entries(peta).every(([id, w]) => (id === 'kabar' ? w === k.masuk : w === k.tidak)));
});

test('jawaban arena dinilai mesin sama dengan antarmuka standar (bundel 2 langkah, pesan lengkap, tujuan)', () => {
  const tutup = arenaDi('k15') as ArenaPesan;
  let j: MissionAnswer = {};
  for (const id of ['kabar', 'bukti', 'langkah', 'jujur']) j = alihBagian(tutup, j, id);
  const s15 = jalankanDari('k15', jawabanKirim(tutup, j));
  assert.ok(s15.includes('kep:k15:c'), `pesan lengkap harus tepat (C): ${s15.join(',')}`);
  const bundel = arenaDi('k11');
  assert.equal(bundel.pola, 'bundel');
  if (bundel.pola === 'bundel') {
    let b: MissionAnswer = pilihOpsi({}, bundel.tindakan.langkah, 'lengkapi');
    assert.equal(sisaArena(bundel, b), 1, 'kabar belum dipilih');
    b = pilihOpsi(b, bundel.kabar.langkah, 'persetujuan');
    assert.equal(sisaArena(bundel, b), 0);
    assert.ok(jalankanDari('k11', b).includes('kep:k11:a'));
  }
  assert.ok(jalankanDari('k04', tujuanArena('k04', 'pool')).includes('kep:k04:d'));
  // Pesan kosong tidak pernah dikirim; pesan satu bagian tetap dinilai (bukan kunci tersembunyi).
  assert.equal(jalankanDari('k15', jawabanKirim(tutup, alihBagian(tutup, {}, 'kabar'))).length, 1);
});

/** Jawaban pola tujuan: benda arena di `node` ke `tujuan`. */
function tujuanArena(node: string, tujuan: string): MissionAnswer {
  const k = arenaDi(node);
  assert.equal(k.pola, 'tujuan');
  return k.pola === 'tujuan' ? tetapkan({}, k.langkah, k.benda.id, tujuan) : {};
}

/** Mainkan jalur tepat sampai `node` (aktivitas), kirim jawaban, kembalikan tanda keputusan node itu. */
function jalankanDari(node: string, jawaban: MissionAnswer): string[] {
  const TEPAT: Record<string, AksiCerita> = {
    k01: { jenis: 'pilih', node: 'k01', pilihan: 'a' },
    k03: { jenis: 'pilih', node: 'k03', pilihan: 'c' },
    k06: { jenis: 'pilih', node: 'k06', pilihan: 'b' },
    k12: { jenis: 'pilih', node: 'k12', pilihan: 'b' },
    k13: { jenis: 'pilih', node: 'k13', pilihan: 'e' },
    k14: { jenis: 'pilih', node: 'k14', pilihan: 'c' },
  };
  const JAWAB: Record<string, () => MissionAnswer> = {
    k02: () => ({ berkas: BERKAS_TEPAT }),
    k04: () => tujuanArena('k04', 'pool'),
    k05: () => tujuanArena('k05', 'mitra'),
    k07: () => tujuanArena('k07', 'paralel'),
    k08: () => ({ r1: { r1l3: 'tanda', r1l4: 'tanda' }, r2: { r2l1: 'tanda' }, simpul: 'c' }),
    k09: () => ({ saksi: { hendra: 'ya', darto: 'ya', tol: 'ya', polisi: 'ya', mobilkecil: 'tidak' } }),
    ksim: () => ({ sim: { periksa: 'bersih' } }),
    k10: () => ({ selisih: { jam: 'catat', nama: 'catat', antisipasi: 'catat' } }),
    k11: () => ({ bundel: 'lengkapi', kabar: 'persetujuan' }),
  };
  let s = stateAwal(EP);
  for (let i = 0; i < 400; i++) {
    if (s.node === node && semuaBarisTampil(EP, s)) {
      s = kirim(s, { jenis: 'aktivitas', node, jawaban });
      return s.tanda.filter((t) => t.startsWith(`kep:${node}:`));
    }
    const n = EP.node[s.node]!;
    if (semuaBarisTampil(EP, s) && n.jenis === 'pilihan' && TEPAT[s.node]) s = kirim(s, TEPAT[s.node]!);
    else if (semuaBarisTampil(EP, s) && n.jenis === 'aktivitas' && JAWAB[s.node]) s = kirim(s, { jenis: 'aktivitas', node: s.node, jawaban: jawabanKirim(arenaDi(s.node), JAWAB[s.node]!()) });
    else s = kirim(s, LANJUT);
  }
  throw new Error(`tidak sampai ke ${node}`);
}

test('arena: pilihan yang disarankan tidak bisa ditebak dari panjang keterangannya', () => {
  // Pilihan arena yang menghasilkan saran naskah (dibuktikan lewat mesin di bawah), per langkah yang ditampilkan.
  const SARAN: Record<string, { jawab: MissionAnswer; daftar: (k: KonfigArena) => { id: string; label: KunciTeks; arti?: KunciTeks }[]; id: string }[]> = {
    k04: [{ jawab: tujuanArena('k04', 'pool'), daftar: (k) => (k.pola === 'tujuan' ? k.tujuan : []), id: 'pool' }],
    k05: [{ jawab: tujuanArena('k05', 'mitra'), daftar: (k) => (k.pola === 'tujuan' ? k.tujuan : []), id: 'mitra' }],
    k07: [{ jawab: tujuanArena('k07', 'paralel'), daftar: (k) => (k.pola === 'tujuan' ? k.tujuan : []), id: 'paralel' }],
    k10: [{ jawab: { selisih: { jam: 'catat', nama: 'catat', antisipasi: 'catat' } }, daftar: (k) => (k.pola === 'bandingkan' ? k.perlakuan : []), id: 'catat' }],
    k11: [
      { jawab: { bundel: 'lengkapi', kabar: 'persetujuan' }, daftar: (k) => (k.pola === 'bundel' ? k.tindakan.pilihan : []), id: 'lengkapi' },
      { jawab: { bundel: 'lengkapi', kabar: 'persetujuan' }, daftar: (k) => (k.pola === 'bundel' ? k.kabar.pilihan : []), id: 'persetujuan' },
    ],
  };
  for (const [node, langkah] of Object.entries(SARAN)) {
    const saran = (EP.titik ?? []).find((t) => t.id === node)!.saran;
    for (const l of langkah) {
      assert.ok(jalankanDari(node, l.jawab).includes(`kep:${node}:${saran}`), `${node}: "${l.id}" bukan pilihan saran`);
      const panjang = l.daftar(arenaDi(node)).map((x) => ({ id: x.id, n: tx(x.label).length + (x.arti ? tx(x.arti).length : 0) }));
      const maks = Math.max(...panjang.map((x) => x.n));
      const satuSatunya = panjang.filter((x) => x.n === maks).length === 1;
      assert.ok(!(satuSatunya && panjang.find((x) => x.id === l.id)!.n === maks), `${node}: saran "${l.id}" satu-satunya keterangan terpanjang (${JSON.stringify(panjang)})`);
    }
  }
});

test('ringkasan tindakan = apa yang dilakukan, bukan penilaian', () => {
  const peta = arenaDi('k04');
  assert.equal(peta.pola, 'tujuan');
  if (peta.pola !== 'tujuan') return;
  const idAkt = (EP.node.k04 as NodeAktivitas).aktivitas;
  const r = ringkasTindakan(EP, idAkt, tetapkan({}, peta.langkah, peta.benda.id, 'pool'), tx)!;
  assert.match(r, /→/);
  assert.doesNotMatch(r, /tepat|benar|salah|keliru/i);
});

// ------------------------------------------------------------------ validasi konfigurasi arena

test('validator: arena harus cocok dengan misi (wadah hilang, gambar tak ada, langkah salah, lampiran tak ada)', () => {
  assert.deepEqual(validasiEpisode(EP), []);
  const ubahArena = (id: string, f: (k: KonfigArena) => KonfigArena): Episode => ({
    ...EP,
    aktivitas: { ...EP.aktivitas, [id]: { ...EP.aktivitas[id]!, arena: f(EP.aktivitas[id]!.arena!) } },
  });
  const berkas = (EP.node.k02 as NodeAktivitas).aktivitas;
  const tanpaWadah = validasiEpisode(ubahArena(berkas, (k) => (k.pola === 'susun' ? { ...k, wadah: k.wadah.slice(1) } : k)));
  assert.ok(tanpaWadah.some((p) => p.includes('wadah misi tidak ada di arena')), tanpaWadah.join('\n'));
  const seniSalah = validasiEpisode(ubahArena(berkas, (k) => (k.pola === 'susun' ? { ...k, benda: k.benda.map((b, i) => (i ? b : { ...b, seni: 'tidak.ada' })) } : k)));
  assert.ok(seniSalah.some((p) => p.includes('gambar "tidak.ada"')), seniSalah.join('\n'));
  const langkahSalah = validasiEpisode(ubahArena(berkas, (k) => (k.pola === 'susun' ? { ...k, langkah: 'entah' } : k)));
  assert.ok(langkahSalah.some((p) => p.includes('langkah "entah" tidak ada di misi')), langkahSalah.join('\n'));
  const tanpaArena = validasiEpisode({ ...EP, aktivitas: { ...EP.aktivitas, [berkas]: { ...EP.aktivitas[berkas]!, arena: undefined } } });
  assert.ok(tanpaArena.some((p) => p.includes('aktivitas tanpa arena')), tanpaArena.join('\n'));
  const lampiranSalah = validasiEpisode({ ...EP, lampiran: {} });
  assert.ok(lampiranSalah.some((p) => p.includes('lampiran "fotoTruk" tidak ada')), lampiranSalah.join('\n'));
});

test('catatan obrolan panjang: kalimat pertama (konteks waktu) tampil, sisanya di Detail; catatan pendek utuh', () => {
  const k01 = tx('k01.1');
  const r = ringkasCatatan(k01);
  assert.ok(r, 'catatan pembuka obrolan panjang');
  assert.match(r!.awal, /^Hari ke-1/);
  assert.equal(`${r!.awal} ${r!.sisa}`, k01, 'tidak ada kata yang hilang');
  assert.equal(ringkasCatatan('Hari ke-1, siang.'), null);
  assert.equal(ringkasCatatan('x'.repeat(200)), null, 'tanpa jeda kalimat = utuh');
});
