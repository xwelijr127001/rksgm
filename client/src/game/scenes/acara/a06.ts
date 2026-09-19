/**
 * Misi acara 06 - Satu per Satu, Pak Kepala Gudang (gudang alat berat).
 * Mekanik: STIKER NOMOR URUT. Lima tindakan berjajar di meja sortir; ketuk satu
 * tindakan, lalu pilih "Langkah 1 - 4" atau "Jangan dilakukan dulu" di bawah
 * adegan. Stiker pilihan menempel di atas tindakan itu. Nampan m08 tidak dipakai
 * dan tidak ada dokumen.
 *
 * Latar `m08-latar` dan forklift GT-220 dipakai ulang apa adanya (kunci tekstur &
 * SVG sama persis dengan misi 8). Properti baru: rak besi yang tiangnya bengkok di
 * belakang forklift, jam dinding, dan kepala gudang yang menunjuk jam (terburu-buru).
 *
 * Netral: kelima tindakan digambar setara (92 x 80, tatakan sama, garis tinta sama).
 * Urutan kiri-kanan SENGAJA bukan urutan proses, dan sama dengan urutan chip di
 * panel HTML (urutan data), jadi posisi tidak memberi petunjuk.
 *
 * Label dua baris: jarak antar tindakan hanya 110, sedangkan pil label 20 px +
 * penanda bisa selebar 150. Karena itu label posisi 1, 3, 5 ada di baris atas dan
 * label posisi 2, 4 diturunkan ke baris bawah; tetangga sebaris berjarak 220 sehingga
 * label, keterangan aksi ("Jangan dulu"), dan tanda pembahasan tidak bertumpuk.
 * Label BARIS ATAS dijaga pendek (maks. sekitar 7 huruf, juga saat diterjemahkan)
 * supaya tidak melebar ke kolom tetangga; label baris bawah boleh lebih panjang.
 *
 * Petugas tetap di pojok kanan bawah (pita jalan sempit, pola misi 8): lajur bawah
 * penuh label, jadi berjalan ke tindakan akan menutupi label.
 */

import type { ArtRef, SceneObjectSpec, SceneSpec } from '../../types';
import { INK, INK_TIPIS, P, art, circle, line, path, rrect, shadow, text } from '../../art/kit';
import { personArt, type PersonOpts } from '../../art/characters';
import { clipboard, phone, toolbox, trashBin } from '../../art/props';
import { FORKLIFT, forklift as forkliftM08, latar as latarM08 } from '../m08-forklift';

/** Ukuran seragam gambar tindakan. */
const W = 92;
const H = 80;

/** Garis tebal bertepi tinta (gagang, pipa): garis tinta di bawah, warna di atas. */
function batang(d: string, warna: string, tebal: number): string {
  return line(d, P.tinta, tebal + 4) + line(d, warna, tebal);
}

// ------------------------------------------------------------------ tindakan (item)

/** Tatakan yang sama di bawah tiap tindakan (permukaan di y 67). */
function tatakan(): string {
  return `${shadow(46, 77, 42, 3)}${rrect(4, 67, 84, 10, 5, '#efe3c8', INK_TIPIS)}`;
}

/** Kamera + pelat nomor seri. */
function gambarDok(): string {
  return `
    ${tatakan()}
    ${rrect(16, 24, 18, 10, 3, P.besiTua, INK_TIPIS)}
    ${rrect(8, 32, 48, 38, 8, P.besiTua, INK)}
    ${rrect(42, 37, 9, 6, 2, P.kuning)}
    ${circle(32, 51, 13, P.kaca, INK_TIPIS)}
    ${circle(32, 51, 6, P.biru)}
    ${circle(28, 47, 2.5, P.putih, 'opacity="0.8"')}
    ${rrect(50, 44, 38, 26, 4, P.krem, INK)}
    ${circle(55, 49, 1.6, P.besi)}${circle(83, 49, 1.6, P.besi)}${circle(55, 65, 1.6, P.besi)}${circle(83, 65, 1.6, P.besi)}
    ${text(69, 58, 'SN', 10, P.tinta, 900)}
    ${line('M59 63 H79', P.tintaLembut, 2.4)}`;
}

/** Ponsel dengan formulir laporan + lembar catatan + gelombang kirim. */
function gambarLapor(): string {
  return `
    ${tatakan()}
    <g transform="rotate(-8 19 55)">
      ${rrect(8, 40, 22, 30, 3, P.putih, INK_TIPIS)}
      ${line('M12 48 H26 M12 54 H26 M12 60 H21', P.besiMuda, 2.4)}
    </g>
    <g transform="translate(28 9.5) scale(0.9)">
      ${phone()}
      ${rrect(10, 14, 20, 6, 2, P.hijau)}
      ${line('M11 27 H29 M11 34 H29 M11 41 H23', P.besiMuda, 2.6)}
      ${rrect(14, 46, 12, 7, 3, P.kuning)}
    </g>
    ${line('M70 26 c5 7 5 15 0 22', P.biru, 3)}
    ${line('M77 20 c9 11 9 23 0 34', P.biruMuda, 3)}`;
}

/** Papan klip pemeriksaan + helm. */
function gambarSurvei(): string {
  return `
    ${tatakan()}
    <g transform="translate(6 3) scale(0.78)">${clipboard(4)}</g>
    <g transform="translate(46 48) scale(0.62)">
      ${path('M16 31 C16 13 28 7 40 7 C52 7 64 13 64 31 Z', P.kuning, INK)}
      ${rrect(12, 28, 56, 7, 3.5, P.kuning, INK)}
      ${line('M40 8 V28', P.kuningTua, 3)}
    </g>`;
}

/** Kotak perkakas + stang las dengan percikan. */
function gambarPerbaiki(): string {
  return `
    ${tatakan()}
    <g transform="translate(4 25) scale(0.8)">${toolbox()}</g>
    ${batang('M84 66 L76 40', P.besi, 4.5)}
    ${batang('M76 40 L70 29', P.besiMuda, 3)}
    ${circle(69, 25, 4.5, P.kuningPucat, INK_TIPIS)}
    ${line('M69 16 V9 M77 19 l6 -5 M61 19 l-6 -5 M80 27 h7', P.oranye, 3)}`;
}

/** Tempat sampah + potongan komponen yang patah. */
function gambarBuang(): string {
  return `
    ${tatakan()}
    <g transform="translate(6 12) scale(0.8)">${trashBin()}</g>
    ${path('M56 46 L59 40 L62 47 L65 41 L66 60 L84 60 C88 60 88 70 84 70 L56 70 Z', P.besiTua, INK)}
    ${line('M60 52 V65', P.besiMuda, 2.5)}
    ${line('M70 65 H82', P.besiMuda, 2.5, 'opacity="0.7"')}`;
}

// ------------------------------------------------------------------ properti

/** Kotak rak dalam koordinat dunia: tepat di belakang pemberat forklift (x 406). */
const RAK = { x0: 404, y0: 112, w: 78, h: 240 };

/**
 * Rak besi tiga tingkat, 78 x 240. Tiang kiri bengkok ke dalam setinggi pemberat
 * forklift, palang di tingkat itu miring dan satu kardus bergeser. Garis benturan
 * oranye di sisi forklift (pola misi 8).
 */
function rakPenyok(): string {
  return `
    ${shadow(44, 234, 34, 5, 0.12)}
    ${line('M20 38 L68 92 M68 100 L30 160', P.besiMuda, 3, 'opacity="0.7"')}
    ${rrect(64, 6, 9, 226, 3, P.besi, INK_TIPIS)}
    ${path('M14 6 H23 V150 L31 180 L23 210 V232 H14 V210 L22 180 L14 150 Z', P.besi, INK_TIPIS)}
    ${rrect(22, 8, 22, 22, 3, '#dfc69c', INK_TIPIS)}${rrect(46, 14, 18, 16, 3, '#e6d2ae', INK_TIPIS)}
    ${rrect(12, 30, 63, 8, 3, P.besiMuda, INK_TIPIS)}
    ${rrect(28, 62, 32, 30, 3, P.kayu, INK_TIPIS)}${line('M28 72 H60', P.kayuTua, 3)}
    ${rrect(12, 92, 63, 8, 3, P.besiMuda, INK_TIPIS)}
    <g transform="rotate(-11 50 150)">${rrect(38, 135, 26, 24, 3, '#dfc69c', INK_TIPIS)}${line('M51 135 V159', '#cdb083', 3)}</g>
    ${path('M27 168 L75 158 L75 166 L27 176 Z', P.besiMuda, INK_TIPIS)}
    ${rrect(12, 222, 63, 8, 3, P.besiMuda, INK_TIPIS)}
    ${line('M10 166 l-6 -5 M9 180 h-6 M10 194 l-6 5', P.oranye, 4)}`;
}

/** Jam dinding 52 x 52 (sore hari: kepala gudang ingin beres hari ini juga). */
function jamDinding(): string {
  return `
    ${circle(27, 28, 22, P.tinta, 'opacity="0.12"')}
    ${circle(26, 26, 22, P.krem, INK)}
    ${line('M26 8 V12 M26 40 V44 M8 26 H12 M40 26 H44', P.tintaLembut, 2.4)}
    ${line('M26 26 L32 36', P.tinta, 3.5)}
    ${line('M26 26 L13 18.5', P.tinta, 2.5)}
    ${circle(26, 26, 2.6, P.merah)}`;
}

/** NPC dengan skala sama seperti petugas di adegan (0,8), pola misi 10. */
function orangKecil(key: string, o: Omit<PersonOpts, 'key'>, s = 0.8): ArtRef {
  const penuh = personArt({ ...o, key });
  const isi = penuh.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return art(key, Math.round(penuh.w * s), Math.round(penuh.h * s), `<g transform="scale(${s})">${isi}</g>`);
}

// ------------------------------------------------------------------ adegan

function buat(): SceneSpec {
  const bg = art('m08-latar', 640, 480, latarM08());
  // Kepala gudang berdiri di depan papan perkakas, lengan terangkat ke arah jam dinding.
  const kepala = orangKecil('a06-kepala-gudang', { shirt: '#e9eef0', pants: '#3c4a52', helmet: true, vest: true, pose: 'lambai', mood: 'cemas' });

  // Lima tindakan di atas meja sortir (permukaan meja y 412), jarak sama 110.
  // Urutan kiri-kanan = urutan data item (bukan urutan proses).
  const Y = 372;
  const X0 = 76;
  const JARAK = 110;
  // Baris label: atas = pusat y 417 (400-434), bawah = pusat y 459 (442-476). Sela 8 satuan: saat
  // pembahasan lencana ✓/✕/! membuat label sedikit lebih besar, dan sela 1 satuan membuat sudutnya bertumpuk.
  // Area sentuh selebar kolom (106 < 110) dan memanjang sampai tepi bawah label
  // masing-masing (pemain awam sering mengetuk tulisan nama); tidak ada yang saling menutup.
  const ATAS = { labelDy: -13, hit: { w: 106, h: 138 } };
  const BAWAH = { labelDy: 29, hit: { w: 106, h: 208 } };
  const tindakan: { refId: string; label: string; gambar: string }[] = [
    { refId: 'lapor', label: 'Lapor', gambar: gambarLapor() },
    { refId: 'perbaiki', label: 'Perbaikan', gambar: gambarPerbaiki() },
    { refId: 'buang', label: 'Buang', gambar: gambarBuang() },
    { refId: 'dok', label: 'Foto & seri', gambar: gambarDok() },
    { refId: 'survei', label: 'Survei', gambar: gambarSurvei() },
  ];
  const objects: SceneObjectSpec[] = tindakan.map((t, i) => ({
    id: t.refId,
    role: 'item',
    stepId: 'urutan',
    refId: t.refId,
    fx: 'tag',
    x: X0 + i * JARAK,
    y: Y,
    art: art(`a06-${t.refId}`, W, H, t.gambar),
    label: t.label,
    depth: 22,
    ...(i % 2 === 0 ? ATAS : BAWAH),
  }));

  return {
    missionId: 'a06-urutan-gudang',
    background: bg,
    props: [
      { id: 'rak', x: RAK.x0 + RAK.w / 2, y: RAK.y0 + RAK.h / 2, art: art('a06-rak', RAK.w, RAK.h, rakPenyok()), depth: 5 },
      { id: 'forklift', x: FORKLIFT.x0 + FORKLIFT.w / 2, y: FORKLIFT.y0 + FORKLIFT.h / 2, art: art('m08-forklift', FORKLIFT.w, FORKLIFT.h, forkliftM08()), depth: 6 },
      { id: 'jam', x: 608, y: 66, art: art('a06-jam', 52, 52, jamDinding()), depth: 4 },
      { id: 'kepala-gudang', x: 602, y: 330 - kepala.h / 2, art: kepala, motion: 'bob', depth: 8 },
    ],
    hero: { x: 604, y: 478 },
    walk: { minX: 584, maxX: 604, minY: 464, maxY: 478 },
    bucketShort: {
      'urutan:l1': 'Langkah 1',
      'urutan:l2': 'Langkah 2',
      'urutan:l3': 'Langkah 3',
      'urutan:l4': 'Langkah 4',
      'urutan:jangan': 'Jangan dulu',
    },
    objects,
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = { missionId: 'a06-urutan-gudang', buat };
