/**
 * Satu Phaser.Scene generik yang menggambar SceneSpec misi mana pun.
 *
 * Scene TIDAK menyimpan jawaban. Setiap perubahan tampilan berasal dari
 * StageView (draft React) lewat `terapkan()`; animasi dipicu oleh SELISIH
 * status objek, sehingga pilihan dari kontrol HTML dan dari ketukan adegan
 * menghasilkan animasi yang sama persis.
 */

import type Phaser from 'phaser';
import type { MissionPublic } from '@shared/types';
import { objectStates } from '../draft';
import type { ArtRef, ObjectState, PropSpec, SceneObjectSpec, SceneSpec, StageView } from '../types';
import { WORLD_H, WORLD_W } from '../types';
import type { HeroProp } from '../art/characters';

type Ph = typeof Phaser;

export interface SceneInit {
  mission: MissionPublic;
  spec: SceneSpec;
  view: StageView;
  /** Tekstur siap pakai: kunci ArtRef -> kanvas. */
  canvases: Map<string, HTMLCanvasElement>;
  rasterScale: number;
  /** Kunci tekstur petugas per benda yang dipegang. */
  heroArt: Record<HeroProp, ArtRef>;
  /** Label singkat kategori assign (untuk stiker di adegan). */
  bucketShort: Record<string, string>;
  /** Kata singkat yang digambar engine (bahasa aktif): lihat i18n/kamus/adegan.ts. */
  kata: KataAdegan;
  onTap(objectId: string): void;
  onReady(): void;
}

export interface KataAdegan { difoto: string; masukFolder: string; dicatat: string; didengar: string; dipilih: string; ditandai: string; dibatalkan: string; dijeda: string }

const FONT = '"Segoe UI Variable", "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif';
const HEX = {
  // T-029: palet Raksa v1 untuk ANTARMUKA di kanvas (pil, vonis, panel). Seni adegan (game/art, game/scenes) tidak berubah.
  tinta: 0x212121,
  kuning: 0xff9000, // isi pil terpilih (jingga merek, teks tinta)
  kuningTua: 0xe07e00,
  putih: 0xffffff,
  krem: 0xfff9f5,
  hijau: 0x2f7d57, // vonis tepat (isi, label putih 5,01 : 1)
  hijauTua: 0x2c5a6b, // vonis terlewat "Yang seharusnya" (garis + teks di atas putih): keluarga kurang, sama dengan .tanda-terlewat (D-292)
  merah: 0xd32f2f,
  biru: 0x3e7285,
  kayuTua: 0x9c6b3f,
};
/** Warna stiker kategori sebelum pembahasan: sengaja netral (bukan hijau/merah). */
const WARNA_TAG = [0x3e7285, 0x7a5aa6, 0xb26b1f, 0x2e7d7a];
/** Skala gambar petugas di adegan. */
const HERO_S = 0.8;

/**
 * Penanda di dalam label objek. Satu penanda per objek supaya adegan tidak penuh stiker:
 * ketuk = bisa disentuh, pilih = sudah tercatat (centang / nomor urut), dok = membuka dokumen.
 * Sebelum pembahasan penanda sengaja netral (kuning/putih), tidak pernah menilai.
 */
type Penanda = 'ketuk' | 'pilih' | 'dok' | null;

interface ObjView {
  spec: SceneObjectSpec;
  /** Gambar objek (ikut urutan kedalaman adegan). */
  root: Phaser.GameObjects.Container;
  /** Label, lencana, stiker: selalu di lapisan atas supaya tidak tertutup karakter. */
  ui: Phaser.GameObjects.Container;
  img: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Container;
  labelBg: Phaser.GameObjects.Graphics;
  labelText: Phaser.GameObjects.Text;
  /** Penanda di dalam label (menggantikan titik ketuk & lencana terpisah). */
  tanda: Phaser.GameObjects.Graphics;
  tandaTeks: Phaser.GameObjects.Text;
  penanda: Penanda;
  denyut: Phaser.Tweens.Tween | null;
  /** Posisi x label dari spesifikasi, sebelum dijepit ke dalam adegan. */
  labelX0: number;
  /** Lebar pil label terakhir (dunia), untuk pemeriksaan tumpang-tindih. */
  labelW: number;
  tag: Phaser.GameObjects.Container | null;
  verdict: Phaser.GameObjects.Container | null;
  caption: Phaser.GameObjects.Container | null;
  focusRing: Phaser.GameObjects.Graphics;
  /** (T-054, gaya 'piksel') bingkai jingga bertangga + centang di sekeliling objek yang dipilih; null = gaya lama. */
  bingkai: Phaser.GameObjects.Graphics | null;
  zone: Phaser.GameObjects.Zone;
  state: ObjectState | null;
  baseScale: number;
}

export function defineMissionScene(P: Ph) {
  return class MissionScene extends P.Scene {
    cfg!: SceneInit;
    objs = new Map<string, ObjView>();
    hero!: Phaser.GameObjects.Image;
    heroBob: Phaser.Tweens.Tween | null = null;
    heroProp: HeroProp = 'none';
    pauseLayer!: Phaser.GameObjects.Container;
    view!: StageView;
    zoom = 1;
    tekan: { id: string; x: number; y: number; t: number } | null = null;
    ketukTerakhir = new Map<string, number>();
    introSelesai = false;
    boards = new Map<string, Phaser.GameObjects.Text[]>();
    /** Properti seni piksel (ArtRef.piksel): ukuran & letak dihitung ulang setiap zoom berubah. */
    propPiksel: { img: Phaser.GameObjects.Image; p: PropSpec }[] = [];

    constructor() {
      super({ key: 'misi' });
    }

    init(data: SceneInit): void {
      this.cfg = data;
      this.view = data.view;
    }

    // ---------------------------------------------------------------- util

    tex(a: ArtRef): string {
      if (!this.textures.exists(a.key)) {
        const c = this.cfg.canvases.get(a.key);
        if (c) {
          const t = this.textures.addCanvas(a.key, c);
          // Seni piksel (raster.ts rasterPiksel): nearest-neighbour, bukan dihaluskan.
          if (t && this.teksturPiksel(a)) t.setFilter(P.Textures.FilterMode.NEAREST);
        }
      }
      return a.key;
    }

    /** true bila tekstur gambar ini seni piksel 1:1 (bukan SVG cadangan saat atlas gagal). */
    teksturPiksel(a: ArtRef): boolean {
      return !!a.piksel && this.cfg.canvases.get(a.key)?.dataset.piksel === '1';
    }

    /**
     * Letak properti seni piksel: n piksel PERANGKAT bulat per piksel seni (bulat terdekat ke tinggi rancangan
     * `art.h`, minimal 1), titik pijak di tengah tepi bawah kotak rancangan, pojok kiri-atas di piksel perangkat
     * bulat (kamera: 1 satuan dunia = zoom piksel perangkat, scroll 0).
     */
    letakPiksel(img: Phaser.GameObjects.Image, p: PropSpec): void {
      const q = p.art.piksel!;
      const n = Math.max(1, Math.round((p.art.h * this.zoom) / q.h));
      const s = n / this.zoom;
      const j = q.jangkar ?? { x: q.w / 2, y: q.h };
      const bulat = (v: number) => Math.round(v * this.zoom) / this.zoom;
      img.setOrigin(0, 0).setDisplaySize(q.w * s, q.h * s).setPosition(bulat(p.x - j.x * s), bulat(p.y + p.art.h / 2 - j.y * s));
    }

    teks(x: number, y: number, s: string, size: number, color = '#212121', bold = true): Phaser.GameObjects.Text {
      const t = this.add.text(x, y, s, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        color,
        fontStyle: bold ? 'bold' : 'normal',
        align: 'center',
      });
      t.setResolution(Math.max(1, this.zoom));
      t.setOrigin(0.5, 0.5);
      return t;
    }

    /** Posisi x lokal (relatif objek) supaya pil selebar w tetap di dalam adegan. */
    jepitX(v: ObjView, xLokal: number, w: number): number {
      const dunia = v.spec.x + xLokal;
      const aman = Math.min(WORLD_W - w / 2 - 6, Math.max(w / 2 + 6, dunia));
      return xLokal + (aman - dunia);
    }

    /** T-061c: true = adegan bergaya piksel (kasus acara); bentuk UI kanvas memakai kotak bertangga, bukan kotak membulat. */
    piksel(): boolean {
      return this.cfg.spec.gaya === 'piksel';
    }

    /**
     * T-061c (gaya piksel): kotak bertangga (sudut 2) bertepi `tebal` + alas tinta 4, sama dengan pil label piksel T-054.
     * Pengganti fillRoundedRect/strokeRoundedRect di papan, stiker, vonis, keterangan, foto, dan lapisan jeda.
     */
    kotakPiksel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, isi: number, tepi: number, tebal = 2, a = 1): void {
      g.fillStyle(tepi, a).fillRect(x + 2, y, w - 4, h + 4).fillRect(x, y + 2, w, h);
      if (tebal > 0) g.fillStyle(isi, a).fillRect(x + tebal, y + tebal, w - 2 * tebal, h - 2 * tebal);
    }

    reduced(): boolean {
      return this.view.reducedMotion;
    }

    // ---------------------------------------------------------------- bangun

    create(): void {
      const cam = this.cameras.main;
      this.zoom = this.scale.width / WORLD_W;
      cam.setZoom(this.zoom);
      cam.centerOn(WORLD_W / 2, WORLD_H / 2);
      cam.setBackgroundColor('#fff9f5');

      const { spec } = this.cfg;
      this.add.image(0, 0, this.tex(spec.background)).setOrigin(0, 0).setDisplaySize(WORLD_W, WORLD_H).setDepth(0);

      for (const p of spec.props ?? []) {
        const img = this.add.image(p.x, p.y, this.tex(p.art)).setDepth(p.depth ?? 5);
        if (this.teksturPiksel(p.art)) {
          this.letakPiksel(img, p);
          this.propPiksel.push({ img, p });
        } else img.setDisplaySize(p.art.w, p.art.h);
        this.gerakProp(img, p.motion);
      }

      for (const o of spec.objects) this.buatObjek(o);

      for (const b of spec.boards ?? []) this.buatPapan(b);

      const h = this.cfg.heroArt.none;
      this.hero = this.add.image(spec.hero.x, spec.hero.y, this.tex(h)).setDisplaySize(h.w * HERO_S, h.h * HERO_S).setOrigin(0.5, 0.96).setDepth(40);
      this.hero.setFlipX(Boolean(spec.hero.flip));
      for (const a of Object.values(this.cfg.heroArt)) this.tex(a);

      this.buatLapisanJeda();

      this.input.on('pointerup', () => { this.tekan = null; });

      this.terapkan(this.view, true);
      this.animasiIdle();
      this.cfg.onReady();
    }

    gerakProp(img: Phaser.GameObjects.Image, motion: string | undefined): void {
      if (!motion || this.reduced()) return;
      if (motion === 'drift') this.tweens.add({ targets: img, x: img.x + 26, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (motion === 'bob') this.tweens.add({ targets: img, y: img.y - 5, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (motion === 'sway') this.tweens.add({ targets: img, angle: 3, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (motion === 'blink') this.tweens.add({ targets: img, alpha: 0.55, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    /**
     * Ketukan hanya dihitung bila sasaran DOM-nya kanvas ini. Tombol HTML yang kebetulan berada di atas
     * kanvas (bar aksi lengket, kartu) tidak boleh ikut mengenai objek adegan di bawahnya.
     */
    dariKanvas(p: Phaser.Input.Pointer): boolean {
      const e = p.event as Event | undefined;
      return !e || !e.target || e.target === this.game.canvas;
    }

    buatObjek(o: SceneObjectSpec): void {
      const depth = o.depth ?? 20;
      const root = this.add.container(o.x, o.y).setDepth(depth);
      const ui = this.add.container(o.x, o.y).setDepth(200 + depth);

      const piksel = this.cfg.spec.gaya === 'piksel';
      const focusRing = this.add.graphics();
      focusRing.lineStyle(6, HEX.tinta, 1); // T-029: cincin fokus antarmuka = tinta (jingga 2,9 : 1 pada halaman)
      if (piksel) focusRing.strokeRect(-o.art.w / 2 - 12, -o.art.h / 2 - 12, o.art.w + 24, o.art.h + 24);
      else focusRing.strokeRoundedRect(-o.art.w / 2 - 12, -o.art.h / 2 - 12, o.art.w + 24, o.art.h + 24, 18);
      focusRing.setVisible(false);
      // T-054 gaya piksel: bingkai pilihan = dua garis bertangga (jingga 8 + jingga tua 4) 4..12 dunia di luar kartu, centang
      // dalam kotak jingga bertangga di pojok kanan atas (sama dengan kunci piksel T-030; tidak bergantung warna saja).
      let bingkai: Phaser.GameObjects.Graphics | null = null;
      if (piksel) {
        bingkai = this.add.graphics();
        const kotakTangga = (x: number, y: number, w: number, h: number, t: number, c: number) => {
          bingkai!.fillStyle(c, 1);
          bingkai!.fillRect(x + t, y, w - 2 * t, t).fillRect(x + t, y + h - t, w - 2 * t, t);
          bingkai!.fillRect(x, y + t, t, h - 2 * t).fillRect(x + w - t, y + t, t, h - 2 * t);
        };
        const L = -o.art.w / 2 - 12, T = -o.art.h / 2 - 12, BW = o.art.w + 24, BH = o.art.h + 24;
        kotakTangga(L, T, BW, BH, 4, HEX.kuning);
        kotakTangga(L + 4, T + 4, BW - 8, BH - 8, 4, HEX.kuning);
        kotakTangga(L + 8, T + 8, BW - 16, BH - 16, 4, 0x9a4f00);
        // centang 28 x 28 di pojok kanan atas
        const cx = L + BW - 22, cy = T - 6;
        bingkai.fillStyle(HEX.tinta, 1).fillRect(cx + 4, cy, 20, 28).fillRect(cx, cy + 4, 28, 20);
        bingkai.fillStyle(HEX.kuning, 1).fillRect(cx + 4, cy + 4, 20, 20);
        bingkai.fillStyle(HEX.tinta, 1);
        for (const [x, y] of [[0, 3], [1, 4], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]] as const) bingkai.fillRect(cx + 4 + x * 2.6, cy + 6 + y * 2.6, 3, 3);
        bingkai.setVisible(false);
      }

      const img = this.add.image(0, 0, this.tex(o.art)).setDisplaySize(o.art.w, o.art.h);

      // Label nama singkat di bawah objek, dengan penanda di dalamnya (lihat Penanda).
      const label = this.add.container(o.labelDx ?? 0, o.art.h / 2 + 18 + (o.labelDy ?? 0));
      const labelText = this.teks(0, 0, o.label, 20);
      const labelBg = this.add.graphics();
      const tanda = this.add.graphics();
      const tandaTeks = this.teks(0, 1, '', 15);
      label.add([labelBg, tanda, tandaTeks, labelText]);

      root.add(bingkai ? [focusRing, bingkai, img] : [focusRing, img]);
      ui.add(label);

      const hitW = Math.max(o.hit?.w ?? o.art.w, 76);
      const hitH = Math.max(o.hit?.h ?? o.art.h, 76);
      const zone = this.add.zone(o.x, o.y, hitW, hitH).setDepth(depth + 100);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (!this.dariKanvas(p)) return;
        this.tekan = { id: o.id, x: p.x, y: p.y, t: this.time.now };
        const v = this.objs.get(o.id);
        if (v && v.state?.interactive !== false && !this.reduced()) {
          this.tweens.add({ targets: v.img, scaleX: v.img.scaleX * 0.94, scaleY: v.img.scaleY * 0.94, duration: 70, yoyo: true });
        }
      });
      zone.on('pointerup', (p: Phaser.Input.Pointer) => {
        const t = this.tekan;
        this.tekan = null;
        if (!t || t.id !== o.id || !this.dariKanvas(p)) return;
        // Geser jari (scroll) bukan ketukan.
        if (Math.hypot(p.x - t.x, p.y - t.y) > 16 * Math.max(1, this.zoom) || this.time.now - t.t > 900) return;
        // Cegah ketukan ganda (mis. klik tiruan setelah sentuhan di Safari).
        const akhir = this.ketukTerakhir.get(o.id) ?? -Infinity;
        if (this.time.now - akhir < 380) return;
        this.ketukTerakhir.set(o.id, this.time.now);
        this.cfg.onTap(o.id);
      });
      zone.on('pointerout', () => {
        if (this.tekan?.id === o.id) this.tekan = null;
      });

      const v: ObjView = {
        spec: o, root, ui, img, label, labelBg, labelText, tanda, tandaTeks, penanda: null, denyut: null, labelX0: label.x, labelW: 0,
        tag: null, verdict: null, caption: null, focusRing, bingkai, zone, state: null, baseScale: img.scaleX,
      };
      this.objs.set(o.id, v);
      this.gambarLabel(v, 'biasa', null, null);
    }

    /** Gambar ulang pil label + penanda; lebar menyesuaikan dan label dijaga di dalam adegan. */
    gambarLabel(v: ObjView, gaya: 'biasa' | 'pilih' | 'redup', penanda: Penanda, urutan: number | null): void {
      const t = v.labelText;
      const ruang = penanda ? 24 : 0;
      const w = t.width + 20 + ruang;
      const h = 34;
      const bg = v.labelBg;
      bg.clear();
      const isi = gaya === 'pilih' ? HEX.kuning : HEX.putih;
      const piksel = this.cfg.spec.gaya === 'piksel';
      if (piksel) {
        // T-054: pil label piksel = kotak bertangga (sudut 2 dunia) bergaris tinta 2 + alas tinta 4 (kunci piksel T-030).
        const a = gaya === 'redup' ? 0.45 : 1;
        bg.fillStyle(HEX.tinta, a).fillRect(-w / 2 + 2, -h / 2, w - 4, h + 4).fillRect(-w / 2, -h / 2 + 2, w, h);
        bg.fillStyle(isi, gaya === 'redup' ? 0.7 : 1).fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
      } else {
        bg.fillStyle(isi, gaya === 'redup' ? 0.7 : 0.96).fillRoundedRect(-w / 2, -h / 2, w, h, 14);
        bg.lineStyle(2, HEX.tinta, gaya === 'redup' ? 0.3 : 0.85).strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
      }
      t.setX(ruang / 2);

      const g = v.tanda;
      const mx = -w / 2 + 17;
      g.clear().setPosition(mx, 0);
      const nomor = penanda === 'pilih' && urutan !== null;
      v.tandaTeks.setPosition(mx, 1).setText(nomor ? String(urutan) : '').setVisible(nomor);
      if (piksel && (penanda === 'ketuk' || penanda === 'pilih')) {
        // T-054: penanda kotak piksel. Ketuk = kotak putih + inti jingga; pilih = kotak putih + centang atau nomor urut.
        g.fillStyle(HEX.tinta, 1).fillRect(-9, -11, 18, 22).fillRect(-11, -9, 22, 18);
        g.fillStyle(HEX.putih, 1).fillRect(-9, -9, 18, 18);
        if (penanda === 'ketuk') g.fillStyle(HEX.kuning, 1).fillRect(-4, -4, 8, 8);
        else if (!nomor) {
          g.fillStyle(HEX.tinta, 1);
          for (const [x, y] of [[0, 3], [1, 4], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]] as const) g.fillRect(-8 + x * 2.2, -6 + y * 2.2, 3, 3);
        }
      } else if (penanda === 'ketuk') {
        g.fillStyle(HEX.putih, 1).fillCircle(0, 0, 9);
        g.lineStyle(2.5, HEX.tinta, 1).strokeCircle(0, 0, 9);
        g.fillStyle(HEX.kuning, 1).fillCircle(0, 0, 4.5);
      } else if (penanda === 'pilih') {
        g.fillStyle(HEX.putih, 1).fillCircle(0, 0, 11);
        g.lineStyle(2.5, HEX.tinta, 1).strokeCircle(0, 0, 11);
        if (!nomor) {
          g.lineStyle(3.5, HEX.tinta, 1).beginPath();
          g.moveTo(-5.5, 0); g.lineTo(-1.5, 4.5); g.lineTo(6, -5);
          g.strokePath();
        }
      } else if (penanda === 'dok' && piksel) {
        // T-061c: penanda dokumen piksel (lembar persegi bertepi tinta + tiga baris).
        g.fillStyle(HEX.tinta, 1).fillRect(-7, -9, 14, 18);
        g.fillStyle(HEX.putih, 1).fillRect(-5, -7, 10, 14);
        g.fillStyle(HEX.tinta, 0.75).fillRect(-3, -4, 6, 2).fillRect(-3, 0, 6, 2).fillRect(-3, 4, 4, 2);
      } else if (penanda === 'dok') {
        g.fillStyle(HEX.putih, 1).fillRoundedRect(-7, -9, 14, 18, 3);
        g.lineStyle(2, HEX.tinta, 1).strokeRoundedRect(-7, -9, 14, 18, 3);
        g.lineStyle(2, HEX.tinta, 0.7).beginPath();
        g.moveTo(-3.5, -3.5); g.lineTo(3.5, -3.5); g.moveTo(-3.5, 1); g.lineTo(3.5, 1); g.moveTo(-3.5, 5.5); g.lineTo(1, 5.5);
        g.strokePath();
      }
      v.label.setX(this.jepitX(v, v.labelX0, w));
      v.labelW = w;

      // Hanya penanda "bisa diketuk" yang berdenyut, dan hanya saat menjawab.
      const denyut = penanda === 'ketuk' && this.view.mode === 'play' && !this.reduced();
      if (denyut && !v.denyut) v.denyut = this.tweens.add({ targets: g, scale: 1.18, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      else if (!denyut && v.denyut) { v.denyut.stop(); v.denyut = null; g.setScale(1); }
      v.penanda = penanda;
    }

    buatPapan(b: NonNullable<SceneSpec['boards']>[number]): void {
      const h = 48 + b.lines.length * 46;
      const g = this.add.graphics().setDepth(18);
      if (this.piksel()) {
        g.fillStyle(HEX.tinta, 0.18).fillRect(b.x - b.w / 2 + 4, b.y + 6, b.w, h);
        this.kotakPiksel(g, b.x - b.w / 2, b.y, b.w, h, 0x212121, HEX.kayuTua, 4);
      } else {
        g.fillStyle(HEX.tinta, 0.18).fillRoundedRect(b.x - b.w / 2 + 4, b.y + 6, b.w, h, 14);
        g.fillStyle(0x212121, 1).fillRoundedRect(b.x - b.w / 2, b.y, b.w, h, 14);
        g.lineStyle(4, HEX.kayuTua, 1).strokeRoundedRect(b.x - b.w / 2, b.y, b.w, h, 14);
      }
      const judul = this.teks(b.x, b.y + 24, b.title, 21, '#ff9000').setDepth(19);
      void judul;
      const baris: Phaser.GameObjects.Text[] = [];
      b.lines.forEach((l, i) => {
        const y = b.y + 66 + i * 46;
        this.teks(b.x - b.w / 2 + 16, y, l.label, 20, '#ffffff', false).setOrigin(0, 0.5).setDepth(19);
        const nilai = this.teks(b.x + b.w / 2 - 16, y, '…', 23, '#ffffff').setOrigin(1, 0.5).setDepth(19);
        nilai.setData('stepId', l.stepId);
        baris.push(nilai);
      });
      this.boards.set(b.id, baris);
    }

    buatLapisanJeda(): void {
      const g = this.add.graphics();
      g.fillStyle(HEX.tinta, 0.55).fillRect(0, 0, WORLD_W, WORLD_H);
      const pill = this.add.graphics();
      if (this.piksel()) this.kotakPiksel(pill, -150, -34, 300, 68, HEX.krem, HEX.tinta, 3);
      else {
        pill.fillStyle(HEX.krem, 1).fillRoundedRect(-150, -34, 300, 68, 22);
        pill.lineStyle(3, HEX.tinta, 1).strokeRoundedRect(-150, -34, 300, 68, 22);
      }
      pill.setPosition(WORLD_W / 2, WORLD_H / 2);
      const t = this.teks(WORLD_W / 2, WORLD_H / 2, this.cfg.kata.dijeda, 28);
      this.pauseLayer = this.add.container(0, 0, [g, pill, t]).setDepth(500).setVisible(false);
    }

    mulaiBob(): void {
      if (this.reduced()) return;
      this.heroBob?.stop();
      this.heroBob = this.tweens.add({ targets: this.hero, scaleY: this.hero.scaleY * 1.025, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    animasiIdle(): void {
      if (this.reduced()) return;
      this.mulaiBob();
    }

    // ---------------------------------------------------------------- terapkan view

    terapkan(view: StageView, awal = false): void {
      const sebelumnya = this.view;
      this.view = view;
      const states = objectStates(this.cfg.mission, this.cfg.spec, view);
      let fokusBaru: ObjView | null = null;
      let aksiBaru: { v: ObjView; fx: SceneObjectSpec['fx'] } | null = null;

      for (const v of this.objs.values()) {
        const s = states[v.spec.id];
        if (!s) continue;
        const lama = v.state;
        v.state = s;

        const bisa = s.interactive;
        const bacaan = v.spec.role === 'doc' || v.spec.role === 'info';
        if (v.zone.input) v.zone.input.enabled = bisa || (bacaan && view.mode !== 'paused');
        v.zone.input && (v.zone.input.cursor = bisa || bacaan ? 'pointer' : 'default');
        v.root.setAlpha(s.dim ? 0.45 : 1);
        v.ui.setAlpha(s.dim ? 0.55 : 1);

        const penanda: Penanda = s.selected && v.spec.role !== 'item' && view.mode !== 'reveal' ? 'pilih'
          : bisa && !s.selected ? 'ketuk'
          : bacaan && (view.mode === 'play' || view.mode === 'intro') ? 'dok'
          : null;
        const penandaLama = v.penanda;
        this.gambarLabel(v, s.selected && v.spec.role !== 'bucket' ? 'pilih' : s.dim ? 'redup' : 'biasa', penanda, s.order);
        if (!awal && penanda === 'pilih' && penandaLama !== 'pilih' && !this.reduced()) {
          this.tweens.add({ targets: v.tanda, scale: { from: 1.7, to: 1 }, duration: 240, ease: 'Back.easeOut' });
        }

        // Stiker kategori (assign), ditumpuk satu per langkah.
        const tagLama = (lama?.tags ?? []).map((t) => `${t.stepId}:${t.refId}`).join('|');
        const tagBaru = s.tags.map((t) => `${t.stepId}:${t.refId}`).join('|');
        if (tagLama !== tagBaru) {
          v.tag?.destroy();
          v.tag = s.tags.length ? this.buatTag(v, s.tags, !awal && s.tags.length >= (lama?.tags.length ?? 0)) : null;
          if (!awal && s.tags.length >= (lama?.tags.length ?? 0) && s.tags.length > 0) aksiBaru = { v, fx: 'stamp' };
        }

        // T-054 gaya piksel: bingkai jingga + centang di sekeliling opsi yang dipilih (bukan saat pembahasan: tanda vonis berlaku).
        v.bingkai?.setVisible(s.selected && v.spec.role === 'option' && view.mode !== 'reveal');
        // Fokus item assign.
        v.focusRing.setVisible(s.focus);
        if (s.focus && !lama?.focus && !awal) fokusBaru = v;

        // Pilihan baru -> animasi aksi.
        if (!awal && s.selected && !lama?.selected && v.spec.role === 'option') aksiBaru = { v, fx: v.spec.fx ?? 'choose' };
        if (!awal && !s.selected && lama?.selected && v.spec.role === 'option') this.efekBatal(v);

        // Penilaian saat pembahasan: menggantikan label supaya jelas milik objek ini.
        const vLama = lama?.verdict ?? null;
        if (vLama !== s.verdict) {
          v.verdict?.destroy();
          v.verdict = s.verdict ? this.buatVerdict(v, s.verdict, awal) : null;
        }
        v.label.setVisible(!v.verdict && !v.caption);
      }

      this.perbaruiPapan(view);
      this.pauseLayer.setVisible(view.mode === 'paused');
      if (view.mode === 'paused') this.tweens.pauseAll();
      else if (sebelumnya?.mode === 'paused') this.tweens.resumeAll();


      if (aksiBaru) this.jalankanAksi(aksiBaru.v, aksiBaru.fx ?? 'choose');
      else if (fokusBaru) this.jalanKe(fokusBaru, 'tunjuk');
      if (view.mode === 'play' && (awal || sebelumnya?.mode !== 'play')) this.time.delayedCall(awal ? 350 : 60, () => this.sapaObjek());
    }

    perbaruiPapan(view: StageView): void {
      for (const baris of this.boards.values()) {
        for (const t of baris) {
          const stepId = t.getData('stepId') as string;
          const step = this.cfg.mission.steps.find((s) => s.id === stepId);
          const v = view.answer[stepId];
          let s = '…';
          if (typeof v === 'number' && Number.isFinite(v)) {
            s = step && step.kind === 'number' && step.format === 'rupiah'
              ? 'Rp' + Math.round(v).toLocaleString('id-ID')
              : `${v}${step && step.kind === 'number' && step.unit ? ' ' + step.unit : ''}`;
          }
          if (t.text !== s) {
            t.setText(s);
            if (s !== '…' && !this.reduced()) this.tweens.add({ targets: t, scale: { from: 1.35, to: 1 }, duration: 220, ease: 'Back.easeOut' });
          }
        }
      }
    }

    buatTag(v: ObjView, tags: ObjectState['tags'], animasiTerakhir: boolean): Phaser.GameObjects.Container {
      const c = this.add.container(0, -v.spec.art.h / 2 - 8);
      let lebar = 0;
      tags.forEach((tag, i) => {
        const step = this.cfg.mission.steps.find((s) => s.id === tag.stepId);
        const idx = step && step.kind === 'assign' ? Math.max(0, step.buckets.findIndex((b) => b.id === tag.refId)) : 0;
        const warna = WARNA_TAG[idx % WARNA_TAG.length]!;
        const teks = this.cfg.bucketShort[`${tag.stepId}:${tag.refId}`] ?? tag.label.slice(0, 18);
        const t = this.teks(0, 0, teks, 18, '#ffffff');
        const w = t.width + 24;
        lebar = Math.max(lebar, w);
        const g = this.add.graphics();
        const piksel = this.piksel();
        if (piksel) this.kotakPiksel(g, -w / 2, -16, w, 32, warna, HEX.tinta, 3);
        else {
          g.fillStyle(warna, 1).fillRoundedRect(-w / 2, -16, w, 32, 10);
          g.lineStyle(3, HEX.tinta, 1).strokeRoundedRect(-w / 2, -16, w, 32, 10);
        }
        // Gaya piksel: stiker tegak (rotasi memecah tepi piksel).
        const satu = this.add.container(0, -i * 34, [g, t]).setAngle(piksel ? 0 : i % 2 === 0 ? -4 : 3);
        c.add(satu);
        if (animasiTerakhir && i === tags.length - 1 && !this.reduced()) {
          satu.setScale(1.6).setAlpha(0);
          this.tweens.add({ targets: satu, scale: 1, alpha: 1, duration: 200, ease: 'Quad.easeIn' });
        }
      });
      c.setData('w', lebar);
      v.ui.add(c);
      return c;
    }

    buatVerdict(v: ObjView, verdict: NonNullable<ObjectState['verdict']>, instan: boolean): Phaser.GameObjects.Container {
      const warna = verdict === 'tepat' ? HEX.hijau : verdict === 'kurang' ? HEX.merah : HEX.putih;
      const teksWarna = verdict === 'terlewat' ? '#2c5a6b' : '#ffffff';
      const kata = v.spec.label;
      const t = this.teks(12, 0, kata, 19, teksWarna);
      const w = t.width + 50;
      t.setX(-w / 2 + 34 + (t.width) / 2);
      const g = this.add.graphics();
      if (this.piksel()) this.kotakPiksel(g, -w / 2, -18, w, 36, warna, verdict === 'terlewat' ? HEX.hijauTua : HEX.tinta, 3);
      else {
        g.fillStyle(warna, 1).fillRoundedRect(-w / 2, -18, w, 36, 18);
        g.lineStyle(3, verdict === 'terlewat' ? HEX.hijauTua : HEX.tinta, 1).strokeRoundedRect(-w / 2, -18, w, 36, 18);
      }
      const ikon = this.add.graphics();
      ikon.lineStyle(4.5, verdict === 'terlewat' ? HEX.hijauTua : HEX.putih, 1);
      const ix = -w / 2 + 18;
      ikon.beginPath();
      if (verdict === 'kurang') {
        ikon.moveTo(ix - 6, -6); ikon.lineTo(ix + 6, 6); ikon.moveTo(ix + 6, -6); ikon.lineTo(ix - 6, 6);
      } else if (verdict === 'tepat') {
        ikon.moveTo(ix - 7, 0); ikon.lineTo(ix - 2, 6); ikon.lineTo(ix + 7, -6);
      } else {
        ikon.moveTo(ix, -8); ikon.lineTo(ix, 3); ikon.moveTo(ix, 7); ikon.lineTo(ix, 8);
      }
      ikon.strokePath();
      // Di posisi label objek (label disembunyikan) supaya jelas tanda ini milik objek mana.
      const c = this.add.container(this.jepitX(v, v.label.x, w), v.label.y, [g, ikon, t]);
      c.setData('w', w);
      v.ui.add(c);
      if (!instan && !this.reduced()) {
        c.setScale(0.3);
        this.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'Back.easeOut', delay: 120 });
      }
      return c;
    }

    // ---------------------------------------------------------------- aksi & animasi

    propUntuk(fx: SceneObjectSpec['fx']): HeroProp {
      if (fx === 'photo') return 'kamera';
      if (fx === 'file' || fx === 'note' || fx === 'talk') return 'papan';
      if (fx === 'stamp' || fx === 'tag') return 'stempel';
      return 'tunjuk';
    }

    aksiKe = 0;

    jalanKe(v: ObjView, prop: HeroProp, lalu?: () => void): void {
      const spec = this.cfg.spec;
      const w = spec.walk ?? { minX: 60, maxX: WORLD_W - 60, minY: spec.hero.y, maxY: spec.hero.y };
      const kiri = v.spec.x < this.hero.x;
      const tx = Math.min(w.maxX, Math.max(w.minX, v.spec.x + (kiri ? 80 : -80)));
      const ty = Math.min(w.maxY, Math.max(w.minY, this.hero.y));
      const nomor = ++this.aksiKe;
      this.hero.setFlipX(kiri);
      this.tweens.killTweensOf(this.hero);
      this.hero.setAngle(0);
      this.heroBob = null;
      const selesai = (): void => {
        this.pakaiProp(prop);
        this.time.delayedCall(650, () => {
          if (nomor !== this.aksiKe) return;
          this.pakaiProp('none');
          // Kembali ke posisi awal supaya tidak menutupi objek.
          this.time.delayedCall(700, () => {
            if (nomor !== this.aksiKe) return;
            this.pulang();
          });
        });
        lalu?.();
      };
      // Gerak dikurangi: petugas tidak berjalan, cukup berganti pose di tempat.
      if (this.reduced()) {
        selesai();
        return;
      }
      const jarak = Math.hypot(tx - this.hero.x, ty - this.hero.y);
      if (jarak < 8) {
        this.hero.setPosition(tx, ty);
        selesai();
        return;
      }
      const dur = Math.min(360, 120 + jarak * 0.9);
      this.tweens.add({ targets: this.hero, x: tx, y: ty, duration: dur, ease: 'Sine.easeInOut', onComplete: selesai });
      this.tweens.add({ targets: this.hero, angle: { from: -3, to: 3 }, duration: dur / 3, yoyo: true, repeat: 1, onComplete: () => this.hero.setAngle(0) });
    }

    pulang(): void {
      const { x, y, flip } = this.cfg.spec.hero;
      if (this.reduced() || Math.hypot(x - this.hero.x, y - this.hero.y) < 8) {
        this.hero.setPosition(x, y).setFlipX(Boolean(flip));
        return;
      }
      this.hero.setFlipX(x < this.hero.x);
      this.tweens.add({
        targets: this.hero, x, y, duration: 320, ease: 'Sine.easeInOut',
        onComplete: () => {
          this.hero.setFlipX(Boolean(flip));
          this.mulaiBob();
        },
      });
    }

    /** Sekali saat misi dimulai: semua objek bergantian "mengangguk" = ini bisa disentuh. */
    sapaObjek(): void {
      if (this.reduced()) return;
      let i = 0;
      for (const v of this.objs.values()) {
        if (!v.state?.interactive) continue;
        this.tweens.add({ targets: v.root, scale: { from: 1, to: 1.08 }, duration: 160, yoyo: true, delay: 120 + i * 90, ease: 'Sine.easeOut' });
        i += 1;
      }
    }

    pakaiProp(prop: HeroProp): void {
      const a = this.cfg.heroArt[prop] ?? this.cfg.heroArt.none;
      this.heroProp = prop;
      this.hero.setTexture(a.key).setDisplaySize(a.w * HERO_S, a.h * HERO_S);
    }

    jalankanAksi(v: ObjView, fx: NonNullable<SceneObjectSpec['fx']>): void {
      this.jalanKe(v, this.propUntuk(fx));
      if (this.reduced()) {
        this.caption(v, this.kataAksi(fx, v));
        return;
      }
      if (fx === 'photo') this.efekFoto(v);
      else if (fx === 'file' || fx === 'note' || fx === 'talk') this.efekTerbang(v);
      else this.efekPop(v);
      this.caption(v, this.kataAksi(fx, v));
    }

    kataAksi(fx: SceneObjectSpec['fx'], v: ObjView): string {
      const k = this.cfg.kata;
      if (fx === 'photo') return k.difoto;
      if (fx === 'file') return k.masukFolder;
      // Sengaja seragam untuk semua objek: keterangan tambahan hanya ada pada
      // sebagian opsi di shared/missions.ts, jadi menampilkannya bisa jadi petunjuk.
      if (fx === 'note') return k.dicatat;
      if (fx === 'talk') return k.didengar;
      if (fx === 'stamp' || fx === 'tag') {
        const tag = v.state?.tags[v.state.tags.length - 1];
        return tag ? (this.cfg.bucketShort[`${tag.stepId}:${tag.refId}`] ?? k.ditandai) : k.ditandai;
      }
      return k.dipilih;
    }

    /** Keterangan aksi singkat DI POSISI LABEL objek itu (label disembunyikan sebentar), supaya tidak menutupi objek lain. */
    caption(v: ObjView, s: string): void {
      v.caption?.destroy();
      const t = this.teks(0, 0, s, 20, '#ffffff');
      const w = t.width + 26;
      const g = this.add.graphics();
      if (this.piksel()) this.kotakPiksel(g, -w / 2, -17, w, 34, HEX.tinta, HEX.tinta, 0, 0.95);
      else g.fillStyle(HEX.tinta, 0.95).fillRoundedRect(-w / 2, -17, w, 34, 17);
      const c = this.add.container(this.jepitX(v, v.label.x, w), v.label.y, [g, t]);
      v.ui.add(c);
      v.caption = c;
      v.label.setVisible(false);
      const selesai = (): void => {
        if (v.caption !== c) return;
        c.destroy();
        v.caption = null;
        // Label selalu kembali (kecuali digantikan tanda pembahasan), walau caption datang beruntun.
        v.label.setVisible(!v.verdict);
      };
      if (this.reduced()) {
        this.time.delayedCall(1100, selesai);
        return;
      }
      c.setScale(0.7);
      this.tweens.add({ targets: c, scale: 1, duration: 160, ease: 'Back.easeOut' });
      this.time.delayedCall(1150, selesai);
    }

    efekFoto(v: ObjView): void {
      const { x, y } = v.spec;
      const w = v.spec.art.w + 26;
      const h = v.spec.art.h + 26;
      const siku = this.add.graphics().setDepth(250);
      siku.lineStyle(5, HEX.putih, 1);
      const L = 18;
      const titik: [number, number, number, number][] = [
        [-w / 2, -h / 2, 1, 1], [w / 2, -h / 2, -1, 1], [-w / 2, h / 2, 1, -1], [w / 2, h / 2, -1, -1],
      ];
      for (const [cx, cy, dx, dy] of titik) {
        siku.beginPath();
        siku.moveTo(cx, cy + dy * L);
        siku.lineTo(cx, cy);
        siku.lineTo(cx + dx * L, cy);
        siku.strokePath();
      }
      siku.setPosition(x, y).setScale(1.3).setAlpha(0);
      this.tweens.add({ targets: siku, scale: 1, alpha: 1, duration: 160, ease: 'Quad.easeOut' });
      // Kilatan lembut (bukan kedip berulang), singkat dan rendah.
      const kilat = this.add.rectangle(x, y, w, h, 0xffffff, 0).setDepth(251);
      this.tweens.add({ targets: kilat, fillAlpha: { from: 0.55, to: 0 }, duration: 220, delay: 160, onComplete: () => kilat.destroy() });
      this.tweens.add({ targets: siku, alpha: 0, duration: 200, delay: 420, onComplete: () => siku.destroy() });
      this.polaroid(v, 360);
    }

    polaroid(v: ObjView, delay: number): void {
      const { x, y } = v.spec;
      const fw = 86;
      const fh = 96;
      const g = this.add.graphics();
      if (this.piksel()) this.kotakPiksel(g, -fw / 2, -fh / 2, fw, fh, HEX.putih, HEX.tinta, 3);
      else {
        g.fillStyle(HEX.putih, 1).fillRoundedRect(-fw / 2, -fh / 2, fw, fh, 8);
        g.lineStyle(3, HEX.tinta, 1).strokeRoundedRect(-fw / 2, -fh / 2, fw, fh, 8);
      }
      const skala = Math.min((fw - 14) / v.spec.art.w, (fh - 28) / v.spec.art.h);
      const foto = this.add.image(0, -8, v.spec.art.key).setDisplaySize(v.spec.art.w * skala, v.spec.art.h * skala);
      const c = this.add.container(x, y, [g, foto]).setDepth(260).setAlpha(0).setAngle(this.piksel() ? 0 : -6);
      this.tweens.add({
        targets: c, alpha: 1, duration: 120, delay,
        onComplete: () => {
          this.tweens.add({ targets: c, x: WORLD_W / 2, y: WORLD_H + 60, angle: 8, scale: 0.6, duration: 520, ease: 'Cubic.easeIn', onComplete: () => c.destroy() });
        },
      });
    }

    efekTerbang(v: ObjView): void {
      const salinan = this.add.image(v.spec.x, v.spec.y, v.spec.art.key).setDisplaySize(v.spec.art.w, v.spec.art.h).setDepth(260).setAlpha(0.95);
      const target = this.cfg.spec.collectTarget ?? null;
      const tx = target ? target.x : WORLD_W / 2;
      const ty = target ? target.y : WORLD_H + 60;
      this.tweens.add({
        targets: salinan, x: tx, y: ty, scaleX: salinan.scaleX * 0.4, scaleY: salinan.scaleY * 0.4, angle: 12,
        duration: 520, ease: 'Cubic.easeIn', onComplete: () => salinan.destroy(),
      });
      this.efekPop(v);
    }

    efekPop(v: ObjView): void {
      this.tweens.add({ targets: v.root, scale: { from: 1.1, to: 1 }, duration: 240, ease: 'Back.easeOut' });
    }

    efekBatal(v: ObjView): void {
      this.caption(v, this.cfg.kata.dibatalkan);
      if (this.reduced()) return;
      this.tweens.add({ targets: v.root, angle: { from: -3, to: 3 }, duration: 70, yoyo: true, repeat: 1, onComplete: () => v.root.setAngle(0) });
    }

    /** Sorot objek tertentu (mis. "pilih kasus dulu" / "batas pilihan penuh"). */
    sorot(ids: string[]): void {
      for (const id of ids) {
        const v = this.objs.get(id);
        if (!v) continue;
        if (this.reduced()) {
          this.caption(v, '↑');
          continue;
        }
        this.tweens.add({ targets: v.root, scale: { from: 1.12, to: 1 }, duration: 320, ease: 'Back.easeOut' });
      }
    }

    /** Kotak label & objek (koordinat dunia) untuk uji tumpang-tindih otomatis. */
    kotakUji(): { id: string; label: { x: number; y: number; w: number; h: number } | null; objek: { x: number; y: number; w: number; h: number }; interaktif: boolean }[] {
      return [...this.objs.values()].map((v) => ({
        id: v.spec.id,
        label: v.verdict
          ? { x: v.spec.x + v.verdict.x - ((v.verdict.getData('w') as number) ?? 0) / 2, y: v.spec.y + v.verdict.y - 18, w: (v.verdict.getData('w') as number) ?? 0, h: 36 }
          : v.label.visible ? { x: v.spec.x + v.label.x - v.labelW / 2, y: v.spec.y + v.label.y - 17, w: v.labelW, h: 34 } : null,
        objek: { x: v.spec.x - v.spec.art.w / 2, y: v.spec.y - v.spec.art.h / 2, w: v.spec.art.w, h: v.spec.art.h },
        interaktif: v.spec.role !== 'info',
      }));
    }

    atur(view: StageView): void {
      this.terapkan(view);
    }

    ubahUkuran(pixelW: number): void {
      this.zoom = pixelW / WORLD_W;
      this.cameras.main.setZoom(this.zoom);
      this.cameras.main.centerOn(WORLD_W / 2, WORLD_H / 2);
      for (const { img, p } of this.propPiksel) this.letakPiksel(img, p);
    }
  };
}

export type MissionSceneInstance = InstanceType<ReturnType<typeof defineMissionScene>>;
