/**
 * ADEGAN MEJA KASUS (Phaser; PROTOTIPE K11, D-68). Menggambar meja tampak atas (map pengajuan, baki Komite, kontak
 * nasabah, papan kelengkapan, kartu status) dan bidikan dekat map terbuka (kartu tiap kelompok berkas).
 *
 * Seperti MissionScene: adegan TIDAK menyimpan keputusan. Semua keadaan datang dari `PandangMeja` (diturunkan dari draf
 * meja React lewat `atur()`); adegan hanya menganimasikan SELISIH (map berpindah, bidikan dekat dibuka, lencana kabar)
 * dan melaporkan ketukan (`onKetuk(id)`) untuk objek yang bisa disentuh saat itu. Ketukan = tekan & lepas di sasaran yang
 * sama tanpa bergeser (geser jari = gulir halaman, bukan ketukan); tidak ada seret presisi.
 * Mode hasil (`pandang.hasil`): tanpa sasaran sentuh; meja memainkan akibat yang sudah tersimpan (map ke tempat akhirnya,
 * status pengajuan, kabar terkirim / belum) sekali, singkat; gerak dikurangi = langsung keadaan akhir.
 */
import type Phaser from 'phaser';
import type { TempatMeja } from '../../tipe';
import type { StatusBerkas } from './logika';
import { LETAK_LAPORAN, LETAK_MAP, MAP_BUKA, MEJA_H, MEJA_W, OBJEK, STATUS, kotakKartu, kotakMapDi, type Kotak, type ObjekMeja } from './tata';

type Ph = typeof Phaser;
type Wadah = Phaser.GameObjects.Container;

export interface KataMeja {
  objek: Record<ObjekMeja, string>;
  /** Label tempat saat map dipilih (tindakan yang terjadi bila map ditaruh di sana). */
  aksi: Record<TempatMeja, string>;
  mapDipilih: string;
  rencana: string;
  draf: string;
  tanpaKabar: string;
  terkirim: string;
  belumDikabari: string;
  statusJudul: string;
  status: string;
  berkas: Record<string, string>;
  statusBerkas: Record<StatusBerkas, string>;
  isiMap: string;
  hitung: string;
  dikembalikan: string;
}

export interface PandangMeja {
  fokus: 'meja' | 'map';
  /** Map sedang dipilih untuk dipindah (tempat tujuan menyala). */
  angkat: boolean;
  /** Tempat rencana tindakan (null = map belum dipindah). */
  tempat: TempatMeja | null;
  /** Lencana kabar di kartu kontak: draf pesan / sengaja tidak mengabari / belum dipilih. */
  kabar: 'draf' | 'tanpa' | null;
  berkas: { id: string; status: StatusBerkas }[];
  /** Objek yang berdenyut (petunjuk langkah berikutnya). */
  sorot: string[];
  /** Objek yang panelnya terbuka (bingkai tegas). */
  aktif: string | null;
  /** Mode hasil: akhir meja sesudah konfirmasi (keputusan tersimpan). */
  hasil: null | { akhir: 'lengkap' | 'kembali' | 'tahan'; kirim: boolean };
  gerak: boolean;
  kata: KataMeja;
}

export interface InitMeja {
  tekstur: Map<string, HTMLCanvasElement>;
  /** Seni berkas per id kelompok (kunci tekstur), untuk kartu di map terbuka. */
  seniBerkas: Record<string, string | undefined>;
  pandang: PandangMeja;
  onKetuk(id: string): void;
  onSiap(): void;
}

const FONT = '"Segoe UI Variable", "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif';
const W = { tinta: 0x17362a, tintaLembut: 0x47604f, krem: 0xfff9e9, putih: 0xffffff, kuning: 0xf6c445, kuningTua: 0xd8a41f, hijau: 0x176b45, abu: 0x6f7d73, kertas: 0xf7f3e8, cap: 0x9a3b24 };
const T = { tinta: '#17362a', lembut: '#47604f', putih: '#ffffff', cap: '#9a3b24' };
type GayaPil = 'biasa' | 'aksi' | 'pilih' | 'putus' | 'hijau' | 'redup' | 'cap';

export function defineMejaScene(P: Ph) {
  return class MejaScene extends P.Scene {
    cfg!: InitMeja;
    p!: PandangMeja;
    zoom = 1;
    tekan: { id: string; x: number; y: number; t: number; gulir: number } | null = null;
    ketukTerakhir = 0;
    zona = new Map<string, Phaser.GameObjects.Zone>();
    map!: Wadah;
    /** Bayangan map di alas saat map direncanakan di tempat lain (pemain melihat asal map). */
    bayangMap!: Phaser.GameObjects.Image;
    mapLabel!: Wadah;
    labelObjek = new Map<string, Wadah>();
    cincin = new Map<string, Phaser.GameObjects.Graphics>();
    denyut = new Map<string, Phaser.Tweens.Tween>();
    tagRencana!: Wadah;
    laporan!: Phaser.GameObjects.Image;
    lencana!: Wadah;
    statusTeks!: Phaser.GameObjects.Text;
    buka!: Wadah;
    kartu = new Map<string, { root: Wadah; bg: Phaser.GameObjects.Graphics; judul: Phaser.GameObjects.Text; status: Phaser.GameObjects.Text; seni: Phaser.GameObjects.Image | null }>();
    hitungTeks!: Phaser.GameObjects.Text;
    sudahHasil = false;

    constructor() {
      super({ key: 'meja' });
    }

    init(data: InitMeja): void {
      this.cfg = data;
      this.p = data.pandang;
    }

    // ---------------------------------------------------------------- util

    tex(kunci: string): string {
      if (!this.textures.exists(kunci)) {
        const c = this.cfg.tekstur.get(kunci);
        if (c) this.textures.addCanvas(kunci, c);
      }
      return kunci;
    }

    gambar(kunci: string, x: number, y: number, w: number, h: number): Phaser.GameObjects.Image {
      return this.add.image(x, y, this.tex(kunci)).setDisplaySize(w, h);
    }

    teks(x: number, y: number, s: string, ukuran: number, warna = T.tinta, tebal = true, lebar = 0): Phaser.GameObjects.Text {
      const t = this.add.text(x, y, s, {
        fontFamily: FONT,
        fontSize: `${ukuran}px`,
        color: warna,
        fontStyle: tebal ? 'bold' : 'normal',
        align: 'center',
        ...(lebar ? { wordWrap: { width: lebar } } : {}),
      });
      t.setResolution(Math.max(1, this.zoom));
      t.setOrigin(0.5, 0.5);
      return t;
    }

    /** Garis putus-putus pada tepi kotak (Graphics tidak punya stroke putus-putus). */
    putus(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, warna: number, tebal = 2): void {
      g.lineStyle(tebal, warna, 1);
      const seg = 6;
      const sela = 5;
      const sisi = (x1: number, y1: number, x2: number, y2: number) => {
        const pjg = Math.hypot(x2 - x1, y2 - y1);
        for (let d = 0; d < pjg; d += seg + sela) {
          const a = d / pjg;
          const b = Math.min(1, (d + seg) / pjg);
          g.lineBetween(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b);
        }
      };
      sisi(x, y, x + w, y);
      sisi(x + w, y, x + w, y + h);
      sisi(x + w, y + h, x, y + h);
      sisi(x, y + h, x, y);
    }

    /** Pil label: wadah berisi latar + teks; `gambarPil` mengganti isi & gaya. */
    pil(x: number, y: number, lebarMaks = 150): Wadah {
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      const t = this.teks(0, 0, '', 15, T.tinta, true, lebarMaks - 20);
      c.add([g, t]);
      c.setData('lebarMaks', lebarMaks);
      return c;
    }

    gambarPil(c: Wadah, s: string, gaya: GayaPil): void {
      const [g, t] = c.list as [Phaser.GameObjects.Graphics, Phaser.GameObjects.Text];
      if (c.getData('isi') === `${gaya}|${s}`) return;
      c.setData('isi', `${gaya}|${s}`);
      t.setText(s);
      t.setColor(gaya === 'pilih' || gaya === 'hijau' ? T.putih : gaya === 'cap' ? T.cap : T.tinta);
      t.setFontSize(gaya === 'putus' || gaya === 'redup' ? 14 : 15);
      const w = Math.min(c.getData('lebarMaks') as number, Math.ceil(t.width + 22));
      const h = Math.ceil(t.height + 10);
      g.clear();
      const isi = gaya === 'aksi' ? W.kuning : gaya === 'pilih' || gaya === 'hijau' ? W.hijau : gaya === 'redup' ? 0xeef0ee : W.krem;
      g.fillStyle(isi, gaya === 'biasa' ? 0.96 : 1).fillRoundedRect(-w / 2, -h / 2, w, h, Math.min(14, h / 2));
      if (gaya === 'putus') this.putus(g, -w / 2, -h / 2, w, h, W.tinta, 1.6);
      else g.lineStyle(gaya === 'aksi' || gaya === 'cap' ? 2.5 : 2, gaya === 'cap' ? W.cap : gaya === 'redup' ? W.abu : W.tinta, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, Math.min(14, h / 2));
      c.setVisible(s !== '');
    }

    // ---------------------------------------------------------------- bangun

    create(): void {
      this.zoom = this.scale.width / MEJA_W;
      const cam = this.cameras.main;
      cam.setZoom(this.zoom);
      cam.centerOn(MEJA_W / 2, MEJA_H / 2);
      cam.setBackgroundColor('#c99862');

      this.add.image(0, 0, this.tex('meja.kayu')).setOrigin(0, 0).setDisplaySize(MEJA_W, MEJA_H);

      // Kartu status pengajuan (bukan sasaran sentuh).
      const kartuStatus = this.add.graphics();
      kartuStatus.fillStyle(W.tinta, 0.16).fillRoundedRect(STATUS.x - STATUS.w / 2 + 3, STATUS.y - STATUS.h / 2 + 4, STATUS.w, STATUS.h, 10);
      kartuStatus.fillStyle(W.putih, 1).fillRoundedRect(STATUS.x - STATUS.w / 2, STATUS.y - STATUS.h / 2, STATUS.w, STATUS.h, 10);
      kartuStatus.lineStyle(2, W.tinta, 1).strokeRoundedRect(STATUS.x - STATUS.w / 2, STATUS.y - STATUS.h / 2, STATUS.w, STATUS.h, 10);
      this.teks(STATUS.x, STATUS.y - 22, this.p.kata.statusJudul, 12, T.lembut, false);
      this.statusTeks = this.teks(STATUS.x, STATUS.y + 8, this.p.kata.status, 14, T.tinta, true, STATUS.w - 14);

      // Baki Komite & papan kelengkapan.
      this.gambar('bundel.sekarang', OBJEK.komite.x, 70, 120, 90);
      this.gambar('bundel.lengkapi', 54, OBJEK.papan.y, 96, 72);
      // Kontak nasabah: kartu + potret bundar (disiapkan engine sebagai tekstur bulat).
      this.gambar('meja.kontak', OBJEK.kontak.x, 222, 120, 132);
      if (this.cfg.tekstur.has('meja.avatar')) this.gambar('meja.avatar', OBJEK.kontak.x, 214, 54, 54);
      this.lencana = this.pil(OBJEK.kontak.x, 264, 118);

      for (const [id, x, y, lebar] of [['komite', OBJEK.komite.x, 128, 136], ['kontak', OBJEK.kontak.x, 306, 128], ['papan', 162, OBJEK.papan.y, 118]] as const) {
        const c = this.pil(x, y, lebar).setDepth(60);
        this.labelObjek.set(id, c);
      }

      // Laporan (rencana: dikirim ke nasabah) - tersembunyi sampai tempatnya kontak.
      this.laporan = this.gambar('dok.laporan', LETAK_LAPORAN.x, LETAK_LAPORAN.y, 104 * LETAK_LAPORAN.s, 80 * LETAK_LAPORAN.s).setAngle(-10).setDepth(30).setVisible(false);

      // Map (wadah: gambar + label ikut berpindah).
      const r = LETAK_MAP.rumah;
      this.bayangMap = this.gambar('meja.map', r.x, r.y, 190, 140).setAlpha(0.2).setDepth(39).setVisible(false);
      this.map = this.add.container(r.x, r.y).setDepth(40);
      this.map.add(this.gambar('meja.map', 0, 0, 190, 140));
      this.mapLabel = this.pil(r.x, r.y + 90, 170).setDepth(61);
      this.tagRencana = this.pil(0, 0, 120).setDepth(62);

      // Cincin sorot / aktif per objek.
      for (const id of ['map', 'komite', 'kontak', 'papan'] as const) {
        const g = this.add.graphics().setDepth(55).setVisible(false);
        this.cincin.set(id, g);
      }

      // Sasaran sentuh meja.
      for (const id of ['komite', 'kontak', 'papan', 'map'] as const) this.buatZona(id, OBJEK[id], id === 'map' ? 120 : 100);

      this.buatBidikanDekat();

      this.terapkan(true);
      this.cfg.onSiap();
    }

    buatZona(id: string, k: Kotak, depth: number): void {
      const z = this.add.zone(k.x, k.y, k.w, k.h).setDepth(depth);
      z.setInteractive({ useHandCursor: true });
      z.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        if (!this.dariKanvas(ptr)) return;
        this.tekan = { id, x: ptr.x, y: ptr.y, t: this.time.now, gulir: window.scrollY };
      });
      z.on('pointerup', (ptr: Phaser.Input.Pointer) => {
        const t = this.tekan;
        this.tekan = null;
        if (!t || t.id !== id || !this.dariKanvas(ptr)) return;
        // Geser jari / halaman bergulir = gulir, bukan ketukan.
        if (Math.hypot(ptr.x - t.x, ptr.y - t.y) > 14 * Math.max(1, this.zoom) || this.time.now - t.t > 900 || Math.abs(window.scrollY - t.gulir) > 3) return;
        // Ketukan ganda / klik tiruan sesudah sentuhan.
        if (this.time.now - this.ketukTerakhir < 300) return;
        this.ketukTerakhir = this.time.now;
        this.cfg.onKetuk(id);
      });
      z.on('pointerout', () => {
        if (this.tekan?.id === id) this.tekan = null;
      });
      this.zona.set(id, z);
    }

    dariKanvas(ptr: Phaser.Input.Pointer): boolean {
      const e = ptr.event as Event | undefined;
      return !e || !e.target || e.target === this.game.canvas;
    }

    buatBidikanDekat(): void {
      this.buka = this.add.container(0, 0).setDepth(150).setVisible(false);
      const redup = this.add.graphics();
      redup.fillStyle(W.tinta, 0.42).fillRect(0, 0, MEJA_W, MEJA_H);
      this.buka.add(redup);
      this.buka.add(this.gambar('meja.mapBuka', MAP_BUKA.x, MAP_BUKA.y, MAP_BUKA.w, MAP_BUKA.h));
      this.cfg.pandang.berkas.forEach((b, i) => {
        const k = kotakKartu(i);
        const root = this.add.container(k.x, k.y);
        const bg = this.add.graphics();
        const kunciSeni = this.cfg.seniBerkas[b.id];
        const seni = kunciSeni ? this.gambar(kunciSeni, k.w / 2 - 26, -k.h / 2 + 22, 42, 32) : null;
        const judul = this.teks(-k.w / 2 + 9, -k.h / 2 + 7, this.p.kata.berkas[b.id] ?? b.id, 15, T.tinta, true, 92).setOrigin(0, 0).setAlign('left');
        const status = this.teks(-k.w / 2 + 9, k.h / 2 - 6, '', 14, T.lembut, false).setOrigin(0, 1).setAlign('left');
        root.add([bg, ...(seni ? [seni] : []), judul, status]);
        this.buka.add(root);
        this.kartu.set(b.id, { root, bg, judul, status, seni });
        this.buatZona(`berkas:${b.id}`, k, 200);
      });
      // Sel ke-8: ringkasan isi map.
      const s = kotakKartu(this.cfg.pandang.berkas.length);
      this.buka.add(this.teks(s.x, s.y - 16, this.p.kata.isiMap, 15, T.tinta));
      this.hitungTeks = this.teks(s.x, s.y + 12, '', 14, T.tinta, false, s.w - 10);
      this.buka.add(this.hitungTeks);
    }

    // ---------------------------------------------------------------- terapkan pandang

    atur(p: PandangMeja): void {
      const lalu = this.p;
      this.p = p;
      if (this.sys.isActive()) this.terapkan(false, lalu);
    }

    gerak(): boolean {
      return this.p.gerak;
    }

    terapkan(awal: boolean, lalu?: PandangMeja): void {
      const p = this.p;
      const k = p.kata;
      const mode = p.hasil ? 'hasil' : p.fokus;

      // Sasaran sentuh: meja (tanpa bidikan dekat & bukan hasil) / kartu berkas (bidikan dekat).
      for (const [id, z] of this.zona) {
        const bisa = mode === 'map' ? id.startsWith('berkas:') : mode === 'meja' ? !id.startsWith('berkas:') : false;
        if (z.input) {
          z.input.enabled = bisa;
          z.input.cursor = bisa ? 'pointer' : 'default';
        }
      }
      this.zona.get('map')?.setPosition(...this.posisiZonaMap(p));

      // Label objek: nama, atau tindakan saat map dipilih.
      for (const id of ['komite', 'kontak', 'papan'] as const) {
        const c = this.labelObjek.get(id)!;
        const rencana = !p.hasil && !p.angkat && p.tempat === id && id !== 'kontak';
        this.gambarPil(c, p.angkat ? k.aksi[id] : rencana ? `${k.rencana}\n${k.aksi[id]}` : k.objek[id], p.angkat ? 'aksi' : rencana ? 'putus' : 'biasa');
      }

      // Lencana kabar.
      const kirimHasil = p.hasil ? (p.hasil.kirim ? k.terkirim : k.belumDikabari) : null;
      if (kirimHasil && (!this.sudahHasil || !this.gerak())) this.gambarPil(this.lencana, kirimHasil, p.hasil!.kirim ? 'hijau' : 'redup');
      else if (!p.hasil) this.gambarPil(this.lencana, p.kabar === 'draf' ? k.draf : p.kabar === 'tanpa' ? k.tanpaKabar : '', p.kabar === 'draf' ? 'putus' : 'redup');

      if (!p.hasil) {
        this.statusTeks.setText(k.status);
        this.letakkanRencana(awal || !this.gerak());
      } else if (!this.sudahHasil) {
        this.sudahHasil = true;
        this.mainkanHasil();
      }

      // Cincin: sorot (berdenyut) & aktif (tegas).
      for (const [id, g] of this.cincin) {
        const sorot = !p.hasil && p.fokus === 'meja' && (p.angkat ? id !== 'map' : p.sorot.includes(id));
        const aktif = !p.hasil && p.aktif === id;
        const ko = id === 'map' ? kotakMapDi(p.tempat) : OBJEK[id as Exclude<ObjekMeja, 'map'>];
        g.clear();
        g.setAlpha(1);
        if (sorot || aktif) {
          g.lineStyle(aktif ? 5 : 4, aktif ? W.hijau : W.kuningTua, 1).strokeRoundedRect(ko.x - ko.w / 2 + 3, ko.y - ko.h / 2 + 3, ko.w - 6, ko.h - 6, 16);
        }
        g.setVisible(sorot || aktif);
        const lama = this.denyut.get(id);
        if (sorot && !aktif && this.gerak()) {
          if (!lama) this.denyut.set(id, this.tweens.add({ targets: g, alpha: 0.3, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
        } else if (lama) {
          lama.stop();
          this.denyut.delete(id);
          g.setAlpha(1);
        }
      }

      // Map dipilih: terangkat sedikit.
      if (!p.hasil) {
        const ang = p.angkat ? 1.05 : 1;
        const dasar = LETAK_MAP[p.tempat ?? 'rumah'].s;
        if (lalu?.angkat !== p.angkat && this.gerak() && !awal) {
          this.tweens.add({ targets: this.map, scale: dasar * ang, angle: p.angkat ? -2 : 0, duration: 140, ease: 'Quad.easeOut' });
        } else if (!this.tweens.isTweening(this.map)) {
          this.map.setScale(dasar * ang).setAngle(p.angkat ? -2 : 0);
        }
      }
      const tampilLabelMap = !p.hasil && (p.tempat === null || p.tempat === 'kontak');
      this.gambarPil(this.mapLabel, tampilLabelMap ? (p.angkat ? k.mapDipilih : k.objek.map) : '', p.angkat ? 'pilih' : 'biasa');

      // Bidikan dekat map.
      this.aturBidikan(mode === 'map', awal || lalu?.fokus === p.fokus);
    }

    posisiZonaMap(p: PandangMeja): [number, number] {
      const k = kotakMapDi(p.tempat);
      const z = this.zona.get('map');
      z?.setSize(k.w, k.h);
      if (z?.input?.hitArea && 'setTo' in z.input.hitArea) (z.input.hitArea as Phaser.Geom.Rectangle).setTo(0, 0, k.w, k.h);
      return [k.x, k.y];
    }

    /** Map & laporan di tempat rencana (draf), dengan tag "Rencana". */
    letakkanRencana(langsung: boolean): void {
      const p = this.p;
      const l = LETAK_MAP[p.tempat ?? 'rumah'];
      const s = l.s * (p.angkat ? 1.05 : 1);
      if (langsung) {
        this.tweens.killTweensOf(this.map);
        this.map.setPosition(l.x, l.y).setScale(s);
      } else if (this.map.x !== l.x || this.map.y !== l.y) {
        this.tweens.add({ targets: this.map, x: l.x, y: l.y, scale: s, duration: 260, ease: 'Cubic.easeOut' });
      }
      this.mapLabel.setPosition(LETAK_MAP.rumah.x, LETAK_MAP.rumah.y + 90);
      this.laporan.setVisible(p.tempat === 'kontak');
      this.bayangMap.setVisible(p.tempat === 'komite' || p.tempat === 'papan');
      if (p.tempat === 'kontak' && !langsung) this.tweens.add({ targets: this.laporan, alpha: { from: 0, to: 1 }, x: { from: LETAK_MAP.rumah.x, to: LETAK_LAPORAN.x }, y: { from: LETAK_MAP.rumah.y, to: LETAK_LAPORAN.y }, duration: 260, ease: 'Cubic.easeOut' });
      // Tag "Rencana" hanya untuk laporan di kontak (baki & papan memakai labelnya sendiri).
      const tag = p.tempat === 'kontak' ? { x: LETAK_LAPORAN.x, y: LETAK_LAPORAN.y + 34 } : null;
      if (tag) this.tagRencana.setPosition(tag.x, tag.y);
      this.gambarPil(this.tagRencana, tag && !p.angkat ? p.kata.rencana : '', 'putus');
    }

    aturBidikan(buka: boolean, langsung: boolean): void {
      const k = this.p.kata;
      for (const b of this.p.berkas) {
        const v = this.kartu.get(b.id);
        if (!v) continue;
        const ko = kotakKartu(this.p.berkas.indexOf(b));
        const kosong = b.status === 'belum-tersedia';
        v.bg.clear();
        if (kosong) {
          v.bg.fillStyle(W.kertas, 1).fillRoundedRect(-ko.w / 2, -ko.h / 2, ko.w, ko.h, 10);
          this.putus(v.bg, -ko.w / 2 + 1, -ko.h / 2 + 1, ko.w - 2, ko.h - 2, W.abu, 2.2);
        } else {
          v.bg.fillStyle(W.tinta, 0.14).fillRoundedRect(-ko.w / 2 + 2, -ko.h / 2 + 3, ko.w, ko.h, 10);
          v.bg.fillStyle(W.putih, 1).fillRoundedRect(-ko.w / 2, -ko.h / 2, ko.w, ko.h, 10);
          v.bg.lineStyle(this.p.aktif === `berkas:${b.id}` ? 4 : 2, this.p.aktif === `berkas:${b.id}` ? W.hijau : W.tinta, 1).strokeRoundedRect(-ko.w / 2, -ko.h / 2, ko.w, ko.h, 10);
        }
        v.seni?.setVisible(!kosong);
        v.status.setText(k.statusBerkas[b.status]);
        v.status.setFontStyle(kosong ? 'bold' : 'normal');
      }
      this.hitungTeks.setText(k.hitung);
      if (this.buka.visible === buka) return;
      this.tweens.killTweensOf(this.buka);
      if (langsung || !this.gerak()) {
        this.buka.setVisible(buka).setAlpha(1).setScale(1).setPosition(0, 0);
        return;
      }
      // Map "dibuka" dari letaknya di meja (skala dari titik map), lalu ditutup kembali ke sana.
      const asal = { x: this.map.x * 0.6, y: this.map.y * 0.6 };
      if (buka) {
        this.buka.setVisible(true).setAlpha(0).setScale(0.4).setPosition(asal.x, asal.y);
        this.tweens.add({ targets: this.buka, alpha: 1, scale: 1, x: 0, y: 0, duration: 200, ease: 'Cubic.easeOut' });
      } else {
        this.tweens.add({ targets: this.buka, alpha: 0, scale: 0.4, x: asal.x, y: asal.y, duration: 160, ease: 'Cubic.easeIn', onComplete: () => this.buka.setVisible(false) });
      }
    }

    // ---------------------------------------------------------------- hasil (sesudah konfirmasi)

    mainkanHasil(): void {
      const p = this.p;
      const h = p.hasil!;
      const k = p.kata;
      this.buka.setVisible(false);
      this.bayangMap.setVisible(false);
      this.gambarPil(this.tagRencana, '', 'putus');
      this.gambarPil(this.mapLabel, '', 'biasa');
      const awalTempat: TempatMeja | null = h.akhir === 'lengkap' ? 'papan' : h.akhir === 'kembali' ? 'komite' : 'kontak';
      const a = LETAK_MAP[awalTempat];
      this.map.setPosition(a.x, a.y).setScale(a.s).setAngle(0);
      this.laporan.setVisible(h.akhir === 'tahan').setAlpha(1).setPosition(LETAK_LAPORAN.x, LETAK_LAPORAN.y);
      const akhirStatus = () => {
        this.statusTeks.setText(k.status);
        if (this.gerak()) this.tweens.add({ targets: this.statusTeks, scale: { from: 1.15, to: 1 }, duration: 220, ease: 'Back.easeOut' });
      };
      const lencana = () => {
        this.gambarPil(this.lencana, h.kirim ? k.terkirim : k.belumDikabari, h.kirim ? 'hijau' : 'redup');
        if (this.gerak()) this.tweens.add({ targets: this.lencana, scale: { from: 1.25, to: 1 }, duration: 240, ease: 'Back.easeOut' });
      };
      const komite = LETAK_MAP.komite;
      const rumah = LETAK_MAP.rumah;
      const cap = this.pil(0, 0, 150).setDepth(70).setAngle(-8);

      if (!this.gerak()) {
        if (h.akhir === 'lengkap') this.map.setPosition(komite.x, komite.y).setScale(komite.s);
        if (h.akhir === 'kembali') {
          this.map.setPosition(rumah.x, rumah.y).setScale(1);
          cap.setPosition(rumah.x, rumah.y);
          this.gambarPil(cap, k.dikembalikan, 'cap');
        }
        if (h.akhir === 'tahan') this.laporan.setPosition(OBJEK.kontak.x - 44, 172).setScale(this.laporan.scaleX * 0.7);
        akhirStatus();
        lencana();
        return;
      }

      if (h.akhir === 'lengkap') {
        // Surat polisi masuk ke map, lalu map diajukan ke Komite (lengkap).
        const surat = this.gambar('dok.suratpolisi.ada', MEJA_W + 40, a.y - 30, 52, 40).setDepth(45);
        this.tweens.chain({
          tweens: [
            { targets: surat, x: a.x, y: a.y - 6, duration: 420, ease: 'Cubic.easeOut' },
            { targets: surat, alpha: 0, scale: 0.6, duration: 160 },
            { targets: this.map, x: komite.x, y: komite.y, scale: komite.s, duration: 460, ease: 'Cubic.easeInOut', onComplete: () => { surat.destroy(); akhirStatus(); } },
          ],
        });
        this.time.delayedCall(700, lencana);
      } else if (h.akhir === 'kembali') {
        // Diajukan tanpa surat polisi: Komite mengembalikannya ke meja.
        this.tweens.chain({
          tweens: [
            { targets: this.map, y: komite.y - 8, duration: 220, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => { cap.setPosition(komite.x, komite.y); this.gambarPil(cap, k.dikembalikan, 'cap'); } },
            { targets: [this.map, cap], x: rumah.x, y: rumah.y, duration: 520, ease: 'Cubic.easeInOut', delay: 380 },
          ],
        });
        this.tweens.add({ targets: this.map, scale: 1, duration: 520, delay: 820, ease: 'Cubic.easeInOut', onComplete: akhirStatus });
        this.time.delayedCall(500, lencana);
      } else {
        // Laporan dikirim ke nasabah; map tetap di meja, belum diajukan.
        this.tweens.add({ targets: this.laporan, x: OBJEK.kontak.x - 44, y: 172, scale: this.laporan.scaleX * 0.7, duration: 520, ease: 'Cubic.easeInOut', onComplete: akhirStatus });
        this.time.delayedCall(420, lencana);
      }
    }

    /** Lebar kanvas berubah (rotasi / jendela): kamera menyesuaikan, dunia tetap. */
    ubahUkuran(lebarPx: number): void {
      this.zoom = lebarPx / MEJA_W;
      this.cameras.main.setZoom(this.zoom);
      this.cameras.main.centerOn(MEJA_W / 2, MEJA_H / 2);
    }
  };
}

export type MejaSceneInstance = InstanceType<ReturnType<typeof defineMejaScene>>;
