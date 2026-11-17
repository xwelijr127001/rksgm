import test from 'node:test';
import assert from 'node:assert/strict';
import type { Episode, NodeCerita } from './tipe';
import { jelajahiSemuaJalur, kandidatJawaban, validasiEpisode } from './validasi';
import { buatEpisodeUji } from './uji/episodeUji';

/** Pesan validasi setelah fixture diubah. */
function pesanSetelah(ubah: (ep: Episode) => void): string[] {
  const ep = buatEpisodeUji();
  ubah(ep);
  return validasiEpisode(ep);
}

function adaPesan(pesan: string[], pola: RegExp): void {
  assert.ok(pesan.some((p) => pola.test(p)), `tidak ada pesan ${pola}; pesan:\n${pesan.join('\n')}`);
}

function node<J extends NodeCerita['jenis']>(ep: Episode, id: string, jenis: J): Extract<NodeCerita, { jenis: J }> {
  const n = ep.node[id];
  if (!n || n.jenis !== jenis) throw new Error(`fixture: ${id} bukan ${jenis}`);
  return n as Extract<NodeCerita, { jenis: J }>;
}

test('fixture sah: validasiEpisode = []', () => {
  assert.deepEqual(validasiEpisode(buatEpisodeUji()), []);
});

test('T-026: jenis episode: demo / nyata / kosong sah; nilai lain ditolak', () => {
  assert.equal(buatEpisodeUji().jenis, undefined, 'fixture tanpa jenis = sah (kartu tanpa tag)');
  for (const j of ['demo', 'nyata'] as const) assert.deepEqual(pesanSetelah((ep) => { ep.jenis = j; }), [], j);
  adaPesan(pesanSetelah((ep) => { (ep as { jenis?: string }).jenis = 'latihan'; }), /jenis "latihan" tidak dikenal/);
  adaPesan(pesanSetelah((ep) => { (ep as { jenis?: unknown }).jenis = ''; }), /jenis "" tidak dikenal/);
});

test('rujukan node hilang', () => {
  const p = pesanSetelah((ep) => {
    node(ep, 'n1-pilih', 'pilihan').pilihan[0]!.lanjut = 'tidak-ada';
  });
  adaPesan(p, /pilihan "dengar"\.lanjut: merujuk node "tidak-ada" yang tidak ada/);
  adaPesan(pesanSetelah((ep) => { ep.mulai = 'hilang'; }), /mulai merujuk node "hilang"/);
  adaPesan(pesanSetelah((ep) => { node(ep, 'cabang-akhir', 'cabang').lainnya = 'hilang'; }), /cabang-akhir"\.lainnya: merujuk node "hilang"/);
});

test('rujukan lain: pembicara, ekspresi, latar, bab, paham, proses, catatan, aktivitas, akhir, id node', () => {
  const p = pesanSetelah((ep) => {
    const sapa = node(ep, 'n1-sapa', 'dialog');
    sapa.baris[0]!.siapa = 'hantu';
    sapa.baris[1]!.ekspresi = 'marah' as never;
    sapa.latar = 'pantai' as never;
    sapa.efek = { catat: ['rahasia'], paham: ['semua'], proses: { lompat: 'tepat' } };
    node(ep, 'n2-cerita', 'dialog').bab = 'bab-hilang';
    node(ep, 'n2-foto', 'aktivitas').aktivitas = 'video';
    node(ep, 'akhir-dingin', 'akhir').akhir = 'beku';
    node(ep, 'akhir-janji', 'akhir').id = 'akhir-lain';
  });
  adaPesan(p, /pembicara "hantu" tidak ada di pemeran/);
  adaPesan(p, /ekspresi "marah" tidak dikenal/);
  adaPesan(p, /latar "pantai" tidak dikenal/);
  adaPesan(p, /catatan "rahasia" tidak ada/);
  adaPesan(p, /paham "semua" tidak ada/);
  adaPesan(p, /proses "lompat" tidak ada/);
  adaPesan(p, /bab "bab-hilang" tidak ada di episode\.bab/);
  adaPesan(p, /aktivitas "video" tidak ada/);
  adaPesan(p, /akhir "beku" tidak ada di episode\.akhir/);
  adaPesan(p, /akhir "dingin" tidak dipakai node akhir mana pun/);
  adaPesan(p, /node "akhir-janji": id "akhir-lain" harus sama dengan kuncinya/);
});

test('node tidak terjangkau dari mulai', () => {
  const p = pesanSetelah((ep) => {
    ep.node.yatim = { id: 'yatim', jenis: 'dialog', bab: 'awal', baris: [{ siapa: 'narasi', teks: 'n1-sapa.2' }], lanjut: 'akhir-baik' };
  });
  assert.deepEqual(p, ['node "yatim" tidak terjangkau dari mulai']);
});

test('jalan buntu: node tanpa jalan ke akhir', () => {
  const p = pesanSetelah((ep) => {
    ep.node['buntu-a'] = { id: 'buntu-a', jenis: 'dialog', bab: 'tutup', baris: [{ siapa: 'narasi', teks: 'akhir-pergi.1' }], lanjut: 'buntu-b' };
    ep.node['buntu-b'] = { id: 'buntu-b', jenis: 'dialog', bab: 'tutup', baris: [{ siapa: 'narasi', teks: 'akhir-pergi.1' }], lanjut: 'buntu-a' };
    node(ep, 'n1-pilih', 'pilihan').pilihan[2]!.lanjut = 'buntu-a';
  });
  adaPesan(p, /node "buntu-a": tidak ada jalan ke akhir/);
  adaPesan(p, /node "buntu-b": tidak ada jalan ke akhir/);
  adaPesan(p, /node "akhir-pergi" tidak terjangkau/);
});

test('cabang palsu: dua pilihan dengan lanjut & efek sama (teks alasan beda tidak dihitung)', () => {
  const p = pesanSetelah((ep) => {
    node(ep, 'n1-pilih', 'pilihan').pilihan[1]!.efek = { kepercayaan: 2, pasang: ['dengar'], alasan: 'alasan.ketus' };
  });
  adaPesan(p, /node "n1-pilih": cabang palsu - pilihan "dengar" dan "ketus" punya akibat sama/);
  // Urutan isi efek tidak mengelabui pemeriksaan.
  const q = pesanSetelah((ep) => {
    const n = node(ep, 'n3-tutup', 'pilihan');
    n.pilihan[0]!.efek = { kepercayaan: 1, paham: ['polis', 'langkah'], alasan: 'alasan.jujur' };
    n.pilihan[1]!.efek = { paham: ['langkah', 'polis'], kepercayaan: 1, alasan: 'alasan.janji' };
  });
  adaPesan(q, /cabang palsu - pilihan "jujur" dan "janji"/);
});

test('node pilihan wajib >= 2 pilihan', () => {
  const p = pesanSetelah((ep) => {
    const n = node(ep, 'n1-pilih', 'pilihan');
    n.pilihan = [n.pilihan[0]!];
  });
  adaPesan(p, /node "n1-pilih": node pilihan harus punya minimal 2 pilihan/);
});

test('efek kepercayaan tanpa alasan', () => {
  const p = pesanSetelah((ep) => {
    delete node(ep, 'n1-pilih', 'pilihan').pilihan[0]!.efek!.alasan;
  });
  adaPesan(p, /pilihan "dengar"\.efek: efek kepercayaan wajib disertai alasan/);
  const q = pesanSetelah((ep) => {
    const h = node(ep, 'n2-foto', 'aktivitas').hasil[0]!;
    delete h.efek!.alasan;
  });
  adaPesan(q, /n2-foto"\.hasil\[0\]\.efek: efek kepercayaan wajib disertai alasan/);
});

test('kunci teks hilang / belum diterjemahkan / kosong', () => {
  const p = pesanSetelah((ep) => {
    delete ep.teks.id['n2-cerita.3'];
  });
  adaPesan(p, /node "n2-cerita"\.baris\[2\]: kunci teks "n2-cerita\.3" tidak ada di teks id/);
  adaPesan(p, /teks en: kunci "n2-cerita\.3" tidak ada di teks id/);
  const q = pesanSetelah((ep) => {
    delete ep.teks.en['alasan.jujur'];
    ep.teks.zh.judul = '  ';
  });
  adaPesan(q, /teks en: kunci "alasan\.jujur" belum diterjemahkan/);
  adaPesan(q, /teks zh "judul" kosong/);
  adaPesan(pesanSetelah((ep) => { ep.akhir.baik!.pelajaran = ['akhir.baik.pelajaran', 'tidak.ada']; }), /akhir "baik"\.pelajaran\[1\]: kunci teks "tidak\.ada" tidak ada di teks id/);
  adaPesan(pesanSetelah((ep) => { ep.aktivitas.foto!.labelKirim = 'kirim.hilang'; }), /aktivitas "foto"\.labelKirim: kunci teks "kirim\.hilang"/);
});

test('parameter {x} harus sama di tiga bahasa', () => {
  const p = pesanSetelah((ep) => {
    ep.teks.en['n1-sapa.1'] = 'Welcome, {name}. Today you are at the service desk.';
  });
  adaPesan(p, /teks en "n1-sapa\.1": parameter beda \(id: \{nama\}; en: \{name\}\)/);
  adaPesan(pesanSetelah((ep) => { ep.teks.zh['akhir-baik.2'] = '做得好。'; }), /teks zh "akhir-baik\.2": parameter beda/);
});

test('angka di teks id wajib ada di terjemahan; hanya zh boleh menambah angka bulan 1-12', () => {
  const p = pesanSetelah((ep) => {
    ep.teks.zh['n1-pilih.1'] = '明天早上我要送 15 盒餐！';
  });
  adaPesan(p, /teks zh "n1-pilih\.1": angka 150 dari teks id tidak ada di terjemahan/);
  adaPesan(p, /teks zh "n1-pilih\.1": angka 15 tidak ada di teks id/);
  const q = pesanSetelah((ep) => {
    ep.teks.en['akhir-janji.1'] = 'On 9/26, Mrs Uji came back disappointed.';
  });
  adaPesan(q, /teks en "akhir-janji\.1": angka 9 tidak ada di teks id/);
  // Fixture: zh "9月26日" untuk "26 September" -> sah (lihat tes fixture sah). Pemisah ribuan dinormalkan.
  const r = pesanSetelah((ep) => {
    ep.teks.id['n1-pilih.1'] = 'Besok pagi saya harus antar 1.500 kotak katering!';
    ep.teks.en['n1-pilih.1'] = 'Tomorrow morning I must deliver 1,500 catering boxes!';
    ep.teks.zh['n1-pilih.1'] = '明天早上我要送 1500 盒餐！';
  });
  assert.deepEqual(r, []);
});

test('tanda di kondisi harus bisa dipasang; tanda akt: merujuk aktivitas & opsi yang ada', () => {
  const p = pesanSetelah((ep) => {
    const c = node(ep, 'cabang-akhir', 'cabang');
    c.cabang[1]!.jika = { tanda: 'janjii' };
    node(ep, 'n2-foto', 'aktivitas').hasil[1]!.umpanBalik![1]!.jika = { tanda: 'akt:foto:lewat:kucing' };
    node(ep, 'n2-cerita', 'dialog').baris[1]!.jika = { tanda: 'akt:video:tepat' };
    node(ep, 'n3-tutup', 'pilihan').baris[1]!.jika = { tanda: 'akt:foto:pilih:ban' };
    node(ep, 'n1-pilih', 'pilihan').pilihan[0]!.efek!.pasang = ['akt:foto:tepat'];
  });
  adaPesan(p, /tanda "janjii" diperiksa tetapi tidak pernah dipasang/);
  adaPesan(p, /tanda "akt:foto:lewat:kucing" tidak pernah dipasang/);
  adaPesan(p, /tanda "akt:video:tepat" merujuk aktivitas "video" yang tidak ada/);
  adaPesan(p, /tanda "akt:foto:pilih:ban" merujuk opsi "ban"/);
  adaPesan(p, /tanda "akt:foto:tepat" berawalan akt:/);
});

test('opsi pensiun (v2): tanda akt:<id>:pilih:<opsi pensiun> sah di kondisi, tetapi opsi itu tidak boleh masih ada di misi', () => {
  const pensiun = (ep: Episode, ids: string[]) => Object.assign(ep.aktivitas.foto!, { opsiPensiun: ids });
  const bacaBan = (ep: Episode) => { node(ep, 'n2-foto', 'aktivitas').hasil[1]!.umpanBalik![1]!.jika = { tanda: 'akt:foto:pilih:ban' }; };
  adaPesan(pesanSetelah(bacaBan), /tanda "akt:foto:pilih:ban" merujuk opsi "ban"/);
  assert.deepEqual(pesanSetelah((ep) => { bacaBan(ep); pensiun(ep, ['ban']); }), []);
  adaPesan(pesanSetelah((ep) => pensiun(ep, ['kucing'])), /opsi pensiun "kucing" masih ditawarkan di misi/);
});

test('alasanOpsi & kartuArti (v2): opsi / kartu / jumlah baris / kunci teks harus ada', () => {
  const p = pesanSetelah((ep) => {
    const def = ep.aktivitas.foto!;
    def.alasanOpsi = { full: 'akt.foto.alasan.full', hantu: 'akt.foto.alasan.hantu' };
    def.kartuArti = { 'kartu-hilang': { baris: [] } };
  });
  adaPesan(p, /alasanOpsi: opsi "hantu" tidak ada di misi/);
  adaPesan(p, /kunci teks "akt\.foto\.alasan\.full" tidak ada di teks id/);
  adaPesan(p, /kartuArti: kartu "kartu-hilang" tidak ada di misi/);
});

test('aktivitas: def.id, rubrik vs misi, penjelasan, misi terjemahan, cabang hasil cadangan', () => {
  const p = pesanSetelah((ep) => {
    const def = ep.aktivitas.foto!;
    def.id = 'foto-lain';
    def.kunci = [{ ...def.kunci[0]!, multi: ['full', 'ban'] }, def.kunci[1]!];
    delete def.penjelasan.jelas;
    const asli = def.misi;
    def.misi = (b) => (b === 'en' ? { ...asli(b), id: 'uji-foto-en' } : asli(b));
  });
  adaPesan(p, /aktivitas "foto": def\.id "foto-lain" harus sama dengan kuncinya/);
  adaPesan(p, /langkah "bukti": opsi rubrik "ban" tidak ada di misi/);
  adaPesan(p, /langkah "jelas": penjelasan belum ada/);
  adaPesan(p, /misi\('en'\) beda id\/langkah\/opsi/);

  const q = pesanSetelah((ep) => {
    const def = ep.aktivitas.foto!;
    def.kunci = [def.kunci[0]!];
  });
  adaPesan(q, /langkah misi "jelas" tidak punya rubrik/);

  const r = pesanSetelah((ep) => {
    const n = node(ep, 'n2-foto', 'aktivitas');
    n.hasil = n.hasil.slice(0, 2);
  });
  adaPesan(r, /n2-foto": cabang hasil terakhir harus tanpa jika/);
});

// ------------------------------------------------------------------ v3: panggung & cue adegan

/** Fixture + panggung v3 yang sah: mentor menyambut, nasabah masuk di narasi n1-sapa.2, parkiran di n2, pergi di akhir-pergi. */
function denganPanggung(ep: Episode): Episode {
  ep.panggung = {
    lokasi: { nama: 'Ruang Uji', tema: 'silver' },
    eksterior: null,
    awal: { lokasi: 'meja', mentor: { pose: 'berdiri-sambut', pandang: 'pemain' }, nasabah: null, prop: { kunci: 'tangan' } },
  };
  node(ep, 'n1-sapa', 'dialog').baris[1]!.adegan = { aksi: 'masuk', mentor: { pose: 'duduk-dengar', pandang: 'lawan' }, nasabah: { pose: 'duduk' }, prop: { kunci: 'meja' } };
  node(ep, 'n2-cerita', 'dialog').adegan = { lokasi: 'parkiran', mentor: { pose: 'berdiri' }, nasabah: { pose: 'berdiri' } };
  node(ep, 'n2-cerita', 'dialog').baris[0]!.adegan = { aksi: 'pindah', lokasi: 'parkiran' };
  node(ep, 'n3-tutup', 'pilihan').adegan = { lokasi: 'meja', mentor: { pose: 'duduk-dengar' }, nasabah: { pose: 'duduk' } };
  node(ep, 'akhir-pergi', 'akhir').baris[0]!.adegan = { aksi: 'pergi', nasabah: null };
  return ep;
}
const pesanPanggung = (ubah: (ep: Episode) => void): string[] => pesanSetelah((ep) => ubah(denganPanggung(ep)));

test('panggung v3: fixture dengan panggung & cue sah = []; {lokasi} diisi dari panggung', () => {
  assert.deepEqual(pesanPanggung(() => {}), []);
  const p = pesanPanggung((ep) => {
    for (const b of ['id', 'en', 'zh'] as const) ep.teks[b]['n1-sapa.1'] = `${ep.teks[b]['n1-sapa.1']} {lokasi}`;
  });
  assert.deepEqual(p, []);
});

test('panggung v3: konfigurasi (nama, tema, eksterior, awal), cue tanpa panggung, parameter teks', () => {
  const p = pesanPanggung((ep) => {
    ep.panggung = { lokasi: { nama: ' ', tema: 'emas' as never }, eksterior: { nama: 'Gedung', aset: '' }, awal: undefined as never };
  });
  adaPesan(p, /panggung\.lokasi\.nama kosong/);
  adaPesan(p, /panggung\.lokasi\.tema "emas" tidak dikenal/);
  adaPesan(p, /panggung\.eksterior harus null/);
  adaPesan(p, /panggung\.awal \(komposisi awal\) wajib ada/);
  adaPesan(pesanPanggung((ep) => { delete ep.panggung; }), /ada cue adegan tetapi episode tanpa panggung/);
  const q = pesanSetelah((ep) => {
    for (const b of ['id', 'en', 'zh'] as const) ep.teks[b]['n1-sapa.1'] = `${ep.teks[b]['n1-sapa.1']} {lokasi} {kota}`;
  });
  adaPesan(q, /teks id "n1-sapa\.1": memakai \{lokasi\} tetapi episode tanpa panggung/);
  adaPesan(q, /teks id "n1-sapa\.1": parameter \{kota\} tidak dikenal/);
});

test('cue v3: nilai lokasi, pose, pandang, prop, aksi, dan bidang harus dikenal', () => {
  const p = pesanPanggung((ep) => {
    const sapa = node(ep, 'n1-sapa', 'dialog');
    sapa.baris[0]!.adegan = {
      lokasi: 'pantai' as never, mentor: { pose: 'terbang' as never, pandang: 'atas' as never }, prop: { payung: 'meja' } as never, kamera: 'dekat',
    } as never;
    node(ep, 'n1-pilih', 'pilihan').baris[0]!.adegan = { nasabah: { pose: 'duduk', lewatTelepon: 'ya' as never }, prop: { kunci: 'saku' as never }, aksi: 'lompat' as never };
    node(ep, 'n3-tutup', 'pilihan').baris[0]!.adegan = { lokasi: 'pintu-luar' };
  });
  adaPesan(p, /n1-sapa"\.baris\[0\]\.adegan: lokasi adegan "pantai" tidak dikenal/);
  adaPesan(p, /pose mentor "terbang" tidak dikenal/);
  adaPesan(p, /pandang mentor "atas" tidak dikenal/);
  adaPesan(p, /prop "payung" tidak dikenal/);
  adaPesan(p, /bidang cue "kamera" tidak dikenal/);
  adaPesan(p, /nasabah\.lewatTelepon harus true\/false/);
  adaPesan(p, /prop "kunci": tempat "saku" tidak dikenal/);
  adaPesan(p, /aksi "lompat" tidak dikenal/);
  adaPesan(p, /lokasi "pintu-luar" hanya untuk pembuka panggung/);
});

test('cue v3: aksi hanya di baris dialog; pose gerak hanya per baris; bingkai animasi bukan nilai cue; aksi harus konsisten', () => {
  const p = pesanPanggung((ep) => {
    node(ep, 'n3-tutup', 'pilihan').adegan = { lokasi: 'meja', aksi: 'pindah' };
    node(ep, 'n2-foto', 'aktivitas').baris[0]!.adegan = { aksi: 'kartu', prop: { kartu: 'meja' } };
    node(ep, 'n2-foto', 'aktivitas').hasil[0]!.umpanBalik![0]!.adegan = { aksi: 'pergi', nasabah: null };
    ep.panggung!.awal.mentor = { pose: 'duduk-tunjuk' };
    node(ep, 'n1-pilih', 'pilihan').baris[0]!.adegan = { nasabah: { pose: 'jalan-a' }, mentor: { pose: 'berdiri-persilakan' } };
  });
  adaPesan(p, /n3-tutup"\.adegan: aksi "pindah" hanya di cue baris dialog \(cue node/);
  adaPesan(p, /n2-foto"\.baris\[0\]\.adegan: aksi "kartu" hanya di cue baris dialog \(baris node aktivitas tampil di kartu aktivitas/);
  adaPesan(p, /umpanBalik\.baris\[0\]\.adegan: aksi "pergi" hanya di cue baris dialog \(umpan balik tampil di layar aktivitas/);
  adaPesan(p, /panggung\.awal: pose mentor "duduk-tunjuk" hanya berlaku satu baris/);
  adaPesan(p, /pose nasabah "jalan-a" hanya bingkai animasi aksi/);
  adaPesan(p, /pose mentor "berdiri-persilakan" hanya bingkai animasi aksi/);
  const q = pesanPanggung((ep) => {
    node(ep, 'n1-sapa', 'dialog').baris[1]!.adegan = { aksi: 'masuk' };
    node(ep, 'akhir-pergi', 'akhir').baris[0]!.adegan = { aksi: 'pergi' };
    node(ep, 'n3-tutup', 'pilihan').baris[0]!.adegan = { aksi: 'kartu' };
    node(ep, 'n2-cerita', 'dialog').baris[0]!.adegan = { aksi: 'pindah' };
  });
  adaPesan(q, /aksi masuk wajib menetapkan nasabah yang hadir/);
  adaPesan(q, /aksi pergi wajib menetapkan nasabah: null/);
  adaPesan(q, /aksi kartu wajib memindahkan prop kartu ke meja/);
  adaPesan(q, /aksi pindah wajib mengubah lokasi atau kehadiran nasabah/);
});

test('alur adegan v3: tidak duduk lagi sesudah pergi tanpa masuk, tidak bicara saat tidak hadir, kursi kosong saat telepon', () => {
  // Pergi di akhir n2-cerita (baris mentor), lalu n3-tutup mendudukkannya lagi lewat cue node tanpa aksi masuk.
  const p = pesanPanggung((ep) => {
    node(ep, 'n2-cerita', 'dialog').baris[2]!.adegan = { aksi: 'pergi', nasabah: null };
  });
  adaPesan(p, /node "n3-tutup"\.adegan: Bu Rina hadir di bingkai tanpa aksi masuk \(sebelumnya tidak hadir/);
  // Tanpa cue masuk di narasi pintu: nasabah bicara di n1-pilih padahal belum hadir.
  const q = pesanPanggung((ep) => { delete node(ep, 'n1-sapa', 'dialog').baris[1]!.adegan; });
  adaPesan(q, /node "n1-pilih"\.baris\[0\] \(n1-pilih\.1\): Bu Rina bicara padahal tidak hadir/);
  // Adegan telepon dengan Bu Rina di kursi; masuk dua kali; pergi padahal sudah pergi.
  const r = pesanPanggung((ep) => {
    node(ep, 'n3-tutup', 'pilihan').adegan = { lokasi: 'telepon', nasabah: { pose: 'duduk' } };
    node(ep, 'n3-tutup', 'pilihan').baris[0]!.adegan = { aksi: 'masuk', nasabah: { pose: 'duduk' } };
    node(ep, 'akhir-pergi', 'akhir').adegan = { nasabah: null };
  });
  adaPesan(r, /n3-tutup"\.adegan: lokasi telepon berarti kursi pengunjung kosong/);
  adaPesan(r, /aksi masuk padahal Bu Rina sudah hadir/);
  adaPesan(r, /aksi pergi padahal Bu Rina tidak hadir/);
  // Epilog "beberapa hari kemudian" lewat telepon (kursi kosong), lalu telepon selesai = sah.
  const s = pesanPanggung((ep) => {
    const akhir = node(ep, 'akhir-baik', 'akhir');
    akhir.baris = [
      { siapa: 'narasi', teks: 'akhir-pergi.1', adegan: { aksi: 'pindah', lokasi: 'telepon', nasabah: { pose: 'telepon', lewatTelepon: true } } },
      { siapa: 'nasabah', ekspresi: 'senang', teks: 'akhir-baik.1' },
      { siapa: 'mentor', teks: 'akhir-baik.2', adegan: { nasabah: null } },
    ];
  });
  assert.deepEqual(s, []);
});

test('jelajahiSemuaJalur: fixture mencapai SEMUA akhir tanpa masalah; jumlah jalur = semua kombinasi', () => {
  const ep = buatEpisodeUji();
  // Kandidat 'foto': bukti = C(4,2) + kosong = 7, jelas = 3 -> 21 jawaban.
  assert.equal(kandidatJawaban(ep, 'foto')?.length, 21);
  const h = jelajahiSemuaJalur(ep);
  assert.deepEqual(h.masalah, []);
  assert.deepEqual(Object.keys(h.akhir).sort(), Object.keys(ep.akhir).sort());
  for (const [akhir, n] of Object.entries(h.akhir)) assert.ok(n > 0, `akhir ${akhir}`);
  // usir: 1; dengar: 21 jawaban x (jujur|janji); ketus: 21 x (jujur|janji|maaf->(jujur|janji)).
  assert.equal(h.jalur, 1 + 21 * 2 + 21 * 4);
  assert.equal(h.akhir.pergi, 1);
  assert.equal(Object.values(h.akhir).reduce((a, b) => a + b, 0), h.jalur);
});

test('jelajahiSemuaJalur melaporkan jalan buntu, putaran, pilihan < 2, dan batas langkah', () => {
  // Tanpa cabang hasil cadangan: jawaban 'belum' tidak cocok cabang mana pun -> buntu.
  const buntu = buatEpisodeUji();
  const n = node(buntu, 'n2-foto', 'aktivitas');
  n.hasil = n.hasil.slice(0, 2);
  const hb = jelajahiSemuaJalur(buntu);
  adaPesan(hb.masalah, /node "n2-foto": jalan buntu - jawaban aktivitas tidak cocok dengan cabang hasil mana pun/);
  assert.equal(hb.masalah.filter((m) => m.includes('n2-foto')).length, 1, 'satu pesan per node, bukan per jawaban');

  // Dialog yang kembali ke dirinya sendiri tanpa perubahan: putaran.
  const putar = buatEpisodeUji();
  node(putar, 'n2-cerita', 'dialog').lanjut = 'n2-cerita';
  adaPesan(jelajahiSemuaJalur(putar).masalah, /node "n2-cerita": putaran/);
  adaPesan(validasiEpisode(putar), /node "n2-cerita": tidak ada jalan ke akhir/);

  // 'janji' hanya bila ketus -> jalur dengar hanya punya 1 pilihan di n3-tutup.
  const satu = buatEpisodeUji();
  node(satu, 'n3-tutup', 'pilihan').pilihan[1]!.jika = { tanda: 'ketus' };
  adaPesan(jelajahiSemuaJalur(satu).masalah, /node "n3-tutup": hanya 1 pilihan tersedia/);

  adaPesan(jelajahiSemuaJalur(buatEpisodeUji(), { maksLangkah: 5 }).masalah, /melebihi batas 5 langkah/);
});
