import test from 'node:test';
import assert from 'node:assert/strict';
import { buatTumpukan, fokusBerikut, gulirUntukTombol, terapkanInert, type ElemenDialog, type Lingkungan, type PeristiwaTombol } from './modal';

// ------------------------------------------------------------------ tiruan DOM secukupnya

class Tiruan implements ElemenDialog<Tiruan> {
  readonly atribut = new Map<string, string>();
  readonly anak: Tiruan[] = [];
  induk: Tiruan | null = null;
  /** true = dicapai Tab; 'skrip' = hanya bisa difokus lewat skrip (tabindex -1). */
  tabbable: boolean | 'skrip' = false;

  constructor(readonly nama: string, readonly dok: Dok) {}

  getAttribute(n: string) { return this.atribut.get(n) ?? null; }
  setAttribute(n: string, v: string) { this.atribut.set(n, v); }
  removeAttribute(n: string) { this.atribut.delete(n); }
  contains(lain: Tiruan | null) {
    for (let x = lain; x; x = x.induk) if (x === this) return true;
    return false;
  }
  focus() { if (this.dok.bisaFokus(this)) this.dok.aktif = this; }
  get isConnected(): boolean {
    let x: Tiruan | null = this;
    while (x.induk) x = x.induk;
    return x === this.dok.body;
  }
  tambah(...anak: Tiruan[]): this {
    for (const a of anak) { a.induk = this; this.anak.push(a); }
    return this;
  }
  lepas(): void {
    if (!this.induk) return;
    this.induk.anak.splice(this.induk.anak.indexOf(this), 1);
    this.induk = null;
    if (this.dok.aktif && this.contains(this.dok.aktif)) this.dok.aktif = null; // fokus jatuh ke body
  }
}

class Dok {
  readonly body = new Tiruan('body', this);
  aktif: Tiruan | null = null;
  readonly antrean: (() => void)[] = [];
  readonly riwayatTumpukan: boolean[] = [];

  el(nama: string, tabbable: boolean | 'skrip' = false): Tiruan {
    const t = new Tiruan(nama, this);
    t.tabbable = tabbable;
    return t;
  }
  urutanDokumen(): Tiruan[] {
    const hasil: Tiruan[] = [];
    const jalan = (t: Tiruan) => { hasil.push(t); t.anak.forEach(jalan); };
    jalan(this.body);
    return hasil;
  }
  dalamInert(t: Tiruan): boolean {
    for (let x: Tiruan | null = t; x; x = x.induk) if (x.getAttribute('inert') !== null) return true;
    return false;
  }
  bisaFokus(t: Tiruan): boolean {
    return t.isConnected && t.tabbable !== false && !this.dalamInert(t);
  }
  jalankanAntrean(): void {
    while (this.antrean.length) this.antrean.shift()!();
  }
  lingkungan(): Lingkungan<Tiruan> {
    return {
      anakAkar: () => [...this.body.anak],
      aktif: () => this.aktif,
      daftarFokus: (w) => this.urutanDokumen().filter((t) => t !== w && w.contains(t) && t.tabbable === true && !this.dalamInert(t)),
      bisaFokus: (t) => this.bisaFokus(t),
      urutan: (a, b) => { const u = this.urutanDokumen(); return u.indexOf(a) - u.indexOf(b); },
      cadangan: () => this.urutanDokumen().find((t) => t.tabbable === true && this.bisaFokus(t)) ?? null,
      siapkanWadah: (w) => { if (w.tabbable === false) w.tabbable = 'skrip'; },
      saatTumpukan: (ada) => { this.riwayatTumpukan.push(ada); },
      jadwalkan: (fn) => { this.antrean.push(fn); },
    };
  }
}

function tombol(key: string, shiftKey = false, lain: Partial<PeristiwaTombol> = {}) {
  const catat = { dicegah: false, dihentikan: false };
  const e: PeristiwaTombol = {
    key, shiftKey, altKey: false, ctrlKey: false, metaKey: false, defaultPrevented: false,
    preventDefault() { catat.dicegah = true; },
    stopPropagation() { catat.dihentikan = true; },
    ...lain,
  };
  return { e, catat };
}

/** Halaman: #root berisi tombol "Dokumen" & "Cara main", plus elemen lain yang SUDAH inert sejak awal. */
function halaman() {
  const dok = new Dok();
  const root = dok.el('root');
  const tombolDokumen = dok.el('Dokumen', true);
  const caraMain = dok.el('Cara main', true);
  root.tambah(tombolDokumen, caraMain);
  const sudahInert = dok.el('iklan');
  sudahInert.setAttribute('inert', 'lama');
  dok.body.tambah(root, sudahInert);
  const tumpukan = buatTumpukan(dok.lingkungan());
  return { dok, root, tombolDokumen, caraMain, sudahInert, tumpukan };
}

/** Dialog seperti Modal: latar (anak body) > judul (tabindex -1) + isi gulir + tombol. */
function dialog(dok: Dok, nama: string, jumlahTombol = 2) {
  const latar = dok.el(nama);
  const judul = dok.el(`${nama}:judul`, 'skrip');
  const isi = dok.el(`${nama}:isi`, true);
  const tombolTombol = Array.from({ length: jumlahTombol }, (_, i) => dok.el(`${nama}:tombol${i + 1}`, true));
  latar.tambah(judul, isi, ...tombolTombol);
  dok.body.tambah(latar);
  return { latar, judul, isi, tombolTombol };
}

// ------------------------------------------------------------------ fokusBerikut

test('fokusBerikut: Tab maju & mundur berputar di ujung daftar', () => {
  const d = ['a', 'b', 'c'];
  assert.equal(fokusBerikut(d, 'a', false), 'b');
  assert.equal(fokusBerikut(d, 'c', false), 'a');
  assert.equal(fokusBerikut(d, 'a', true), 'c');
  assert.equal(fokusBerikut(d, 'b', true), 'a');
  assert.equal(fokusBerikut(['x'], 'x', false), 'x');
  assert.equal(fokusBerikut([], null, false), null);
});

test('fokusBerikut: fokus di luar daftar memakai posisi dokumen bila diketahui', () => {
  const d = [10, 20, 30];
  const urutan = (a: number, b: number) => a - b;
  // Judul (posisi 5) sebelum kontrol pertama: maju -> pertama, mundur -> terakhir.
  assert.equal(fokusBerikut(d, 5, false, urutan), 10);
  assert.equal(fokusBerikut(d, 5, true, urutan), 30);
  // Elemen non-Tab di tengah (25): lanjut ke tetangga sesungguhnya.
  assert.equal(fokusBerikut(d, 25, false, urutan), 30);
  assert.equal(fokusBerikut(d, 25, true, urutan), 20);
  // Sesudah yang terakhir: berputar.
  assert.equal(fokusBerikut(d, 99, false, urutan), 10);
  // Tanpa fungsi urutan / tanpa fokus: mulai dari ujung.
  assert.equal(fokusBerikut(d, 25, false), 10);
  assert.equal(fokusBerikut(d, null, true), 30);
});

// ------------------------------------------------------------------ terapkanInert

test('terapkanInert: dua lapis dicatat sekali lalu dipulihkan persis', () => {
  const dok = new Dok();
  const root = dok.el('root');
  const lama = dok.el('lama');
  lama.setAttribute('inert', 'x');
  const editor = dok.el('editor');
  const konfirmasi = dok.el('konfirmasi');
  dok.body.tambah(root, lama, editor);
  const catatan = new Map<Tiruan, string | null>();

  terapkanInert(dok.body.anak, editor, catatan);
  assert.equal(root.getAttribute('inert'), '');
  assert.equal(editor.getAttribute('inert'), null);
  assert.equal(lama.getAttribute('inert'), 'x');

  dok.body.tambah(konfirmasi);
  terapkanInert(dok.body.anak, konfirmasi, catatan);
  assert.equal(editor.getAttribute('inert'), '', 'editor ikut inert di bawah konfirmasi');
  assert.equal(root.getAttribute('inert'), '');
  assert.equal(konfirmasi.getAttribute('inert'), null);

  // Konfirmasi ditutup & dilepas: editor aktif lagi, root tetap inert.
  konfirmasi.lepas();
  terapkanInert(dok.body.anak, editor, catatan);
  assert.equal(editor.getAttribute('inert'), null);
  assert.equal(root.getAttribute('inert'), '');

  terapkanInert(dok.body.anak, null, catatan);
  assert.equal(root.getAttribute('inert'), null);
  assert.equal(editor.getAttribute('inert'), null);
  assert.equal(lama.getAttribute('inert'), 'x', 'nilai asli yang sudah ada tidak dihapus');
  assert.equal(catatan.size, 0);
});

// ------------------------------------------------------------------ tumpukan

test('buka: fokus masuk ke judul, latar inert, gulir dikunci sekali', () => {
  const { dok, root, tombolDokumen, sudahInert, tumpukan } = halaman();
  tombolDokumen.focus();
  const d = dialog(dok, 'dokumen');
  tumpukan.buka(d.latar, () => ({ fokusAwal: () => d.judul }));
  assert.equal(dok.aktif, d.judul);
  assert.equal(root.getAttribute('inert'), '');
  assert.equal(sudahInert.getAttribute('inert'), 'lama');
  assert.equal(d.latar.getAttribute('inert'), null);
  assert.deepEqual(dok.riwayatTumpukan, [true]);
});

test('Tab & Shift+Tab berputar di dalam dialog teratas', () => {
  const { dok, tombolDokumen, caraMain, tumpukan } = halaman();
  tombolDokumen.focus();
  const d = dialog(dok, 'dokumen');
  tumpukan.buka(d.latar, () => ({ fokusAwal: () => d.judul }));
  const [t1, t2] = d.tombolTombol;
  const urutanMaju: (Tiruan | null)[] = [];
  for (let i = 0; i < 4; i++) {
    const { e, catat } = tombol('Tab');
    assert.equal(tumpukan.tombol(e), true);
    assert.equal(catat.dicegah, true);
    urutanMaju.push(dok.aktif);
  }
  assert.deepEqual(urutanMaju, [d.isi, t1, t2, d.isi], 'dari judul: isi gulir, tombol, lalu kembali ke isi');
  assert.notEqual(dok.aktif, caraMain);

  const urutanMundur: (Tiruan | null)[] = [];
  for (let i = 0; i < 3; i++) {
    tumpukan.tombol(tombol('Tab', true).e);
    urutanMundur.push(dok.aktif);
  }
  assert.deepEqual(urutanMundur, [t2, t1, d.isi]);

  // Shift+Tab dari judul langsung ke kontrol terakhir.
  d.judul.focus();
  tumpukan.tombol(tombol('Tab', true).e);
  assert.equal(dok.aktif, t2);
});

test('Escape hanya untuk dialog teratas; propagasi dihentikan', () => {
  const { dok, tombolDokumen, tumpukan } = halaman();
  const tutupA: string[] = [];
  tombolDokumen.focus();
  const a = dialog(dok, 'editor');
  tumpukan.buka(a.latar, () => ({ onEscape: () => tutupA.push('editor'), fokusAwal: () => a.judul }));
  a.tombolTombol[0]!.focus();
  const b = dialog(dok, 'konfirmasi');
  tumpukan.buka(b.latar, () => ({ onEscape: () => tutupA.push('konfirmasi'), fokusAwal: () => b.judul }));

  const { e, catat } = tombol('Escape');
  assert.equal(tumpukan.tombol(e), true);
  assert.deepEqual(tutupA, ['konfirmasi']);
  assert.equal(catat.dihentikan, true);
  assert.equal(catat.dicegah, true);

  // Sedang menyusun huruf (IME) atau sudah ditangani komponen di dalam dialog: tidak menutup.
  assert.equal(tumpukan.tombol(tombol('Escape', false, { isComposing: true }).e), false);
  assert.equal(tumpukan.tombol(tombol('Escape', false, { defaultPrevented: true }).e), false);
  assert.deepEqual(tutupA, ['konfirmasi']);
});

test('dua lapis: tutup atas -> fokus ke pembukanya di editor; tutup semua -> inert pulih & fokus ke tombol awal', () => {
  const { dok, root, tombolDokumen, sudahInert, tumpukan } = halaman();
  tombolDokumen.focus();
  const ed = dialog(dok, 'editor');
  const tutupEditor = tumpukan.buka(ed.latar, () => ({ fokusAwal: () => ed.judul }));
  const pembukaKonfirmasi = ed.tombolTombol[1]!;
  pembukaKonfirmasi.focus();
  const kf = dialog(dok, 'konfirmasi');
  const tutupKonfirmasi = tumpukan.buka(kf.latar, () => ({ fokusAwal: () => kf.judul }));
  assert.equal(ed.latar.getAttribute('inert'), '');
  assert.equal(root.getAttribute('inert'), '');
  assert.equal(dok.aktif, kf.judul);

  tutupKonfirmasi();
  kf.latar.lepas();
  assert.equal(ed.latar.getAttribute('inert'), null, 'editor aktif lagi segera');
  assert.equal(root.getAttribute('inert'), '', 'halaman tetap inert selama editor terbuka');
  dok.jalankanAntrean();
  assert.equal(dok.aktif, pembukaKonfirmasi);

  tutupEditor();
  ed.latar.lepas();
  dok.jalankanAntrean();
  assert.equal(root.getAttribute('inert'), null);
  assert.equal(sudahInert.getAttribute('inert'), 'lama');
  assert.equal(dok.aktif, tombolDokumen);
  assert.deepEqual(dok.riwayatTumpukan, [true, false]);
  assert.equal(tumpukan.jumlah(), 0);
});

test('editor ditutup bersama konfirmasinya (urutan lepas terbalik): fokus tetap ke tombol pembuka editor', () => {
  const { dok, root, tombolDokumen, tumpukan } = halaman();
  tombolDokumen.focus();
  const ed = dialog(dok, 'editor');
  const tutupEditor = tumpukan.buka(ed.latar, () => ({ fokusAwal: () => ed.judul }));
  ed.tombolTombol[0]!.focus();
  const kf = dialog(dok, 'konfirmasi');
  const tutupKonfirmasi = tumpukan.buka(kf.latar, () => ({ fokusAwal: () => kf.judul }));

  // React membersihkan induk (editor) lebih dulu, lalu anaknya (konfirmasi), lalu DOM dilepas.
  tutupEditor();
  assert.equal(tumpukan.wadahTeratas(), kf.latar);
  tutupKonfirmasi();
  ed.latar.lepas();
  kf.latar.lepas();
  dok.jalankanAntrean();
  assert.equal(root.getAttribute('inert'), null);
  assert.equal(dok.aktif, tombolDokumen);
});

test('kembaliKe menang atas pembuka; tujuan yang hilang jatuh ke pembuka lalu kontrol wajar', () => {
  const { dok, tombolDokumen, caraMain, tumpukan } = halaman();
  // Dibuka dari kanvas (fokus tidak di tombol mana pun) dengan kembaliKe = tombol Dokumen.
  const kanvas = dok.el('kanvas', 'skrip');
  dok.body.anak[0]!.tambah(kanvas);
  kanvas.focus();
  const d1 = dialog(dok, 'd1');
  tumpukan.buka(d1.latar, () => ({ kembaliKe: () => tombolDokumen, fokusAwal: () => d1.judul }))();
  d1.latar.lepas();
  dok.jalankanAntrean();
  assert.equal(dok.aktif, tombolDokumen);

  // kembaliKe tidak bisa difokus (sudah dilepas): kembali ke pembuka.
  const hilang = dok.el('hilang', true);
  caraMain.focus();
  const d2 = dialog(dok, 'd2');
  tumpukan.buka(d2.latar, () => ({ kembaliKe: () => hilang, fokusAwal: () => d2.judul }))();
  d2.latar.lepas();
  dok.jalankanAntrean();
  assert.equal(dok.aktif, caraMain);

  // Pembuka ikut hilang (mis. baris yang dihapus): kontrol wajar di halaman, bukan body.
  const sementara = dok.el('Hapus', true);
  dok.body.anak[0]!.tambah(sementara);
  sementara.focus();
  const d3 = dialog(dok, 'd3');
  tumpukan.buka(d3.latar, () => ({ fokusAwal: () => d3.judul }))();
  sementara.lepas();
  d3.latar.lepas();
  dok.jalankanAntrean();
  assert.equal(dok.aktif, tombolDokumen);
});

test('pasang ulang (StrictMode): pemulihan fokus yang tertunda tidak mencuri fokus dari dialog baru', () => {
  const { dok, root, tombolDokumen, tumpukan } = halaman();
  tombolDokumen.focus();
  const d = dialog(dok, 'dokumen');
  const opsi = () => ({ fokusAwal: () => d.judul });
  tumpukan.buka(d.latar, opsi, tombolDokumen)();
  tumpukan.buka(d.latar, opsi, tombolDokumen);
  dok.jalankanAntrean();
  assert.equal(dok.aktif, d.judul);
  assert.equal(root.getAttribute('inert'), '');
  assert.equal(tumpukan.jumlah(), 1);
});

test('fokus yang lolos ke luar dialog dikembalikan ke dalam', () => {
  const { dok, caraMain, tumpukan } = halaman();
  const d = dialog(dok, 'dokumen');
  tumpukan.buka(d.latar, () => ({ fokusAwal: () => d.judul }));
  // Mis. elemen baru di body yang belum sempat inert menerima fokus.
  const lepas = dok.el('lepas', true);
  dok.body.tambah(lepas);
  dok.aktif = lepas;
  tumpukan.fokusMasuk(lepas);
  assert.equal(dok.aktif, d.judul);
  // Anak body baru ikut inert setelah disusun ulang.
  tumpukan.susunInert();
  assert.equal(lepas.getAttribute('inert'), '');
  // Fokus di dalam dialog dibiarkan.
  d.tombolTombol[0]!.focus();
  tumpukan.fokusMasuk(d.tombolTombol[0]!);
  assert.equal(dok.aktif, d.tombolTombol[0]);
  assert.notEqual(dok.aktif, caraMain);
});

test('dialog tanpa kontrol: fokus ke wadahnya dan Tab tetap di sana', () => {
  const { dok, tumpukan } = halaman();
  const latar = dok.el('kosong');
  dok.body.tambah(latar);
  tumpukan.buka(latar, () => ({}));
  assert.equal(dok.aktif, latar);
  tumpukan.tombol(tombol('Tab').e);
  assert.equal(dok.aktif, latar);
});

test('gulirUntukTombol: tombol gulir dari judul', () => {
  assert.equal(gulirUntukTombol('ArrowDown', 500), 40);
  assert.equal(gulirUntukTombol('ArrowUp', 500), -40);
  assert.equal(gulirUntukTombol('PageDown', 500), 450);
  assert.equal(gulirUntukTombol('PageUp', 500), -450);
  assert.equal(gulirUntukTombol('Home', 500), 'awal');
  assert.equal(gulirUntukTombol('End', 500), 'akhir');
  assert.equal(gulirUntukTombol('Enter', 500), null);
});
