/**
 * LATAR ruang layanan Raksa Silver Club (lokasi `meja` / `telepon`): dinding kuning oker hangat + lampu sorot,
 * panel bambu hijau (foto 05/09), plakat walnut di antara kedua kepala dengan rak & lilin LED (foto 08, TEKS KOSONG di
 * SVG: panggung menulis nama lokasi; lapisan piksel: teks dibakar alat bangun), panel bilah zaitun di belakang badan
 * tokoh (foto 08), lantai, sandaran kursi petugas, dan SEKAT pintu masuk di kanan (kusen engsel; daun & koridor =
 * lapisan terpisah). Adaptasi ilustratif, bukan denah resmi. Koordinat: geometri.ts.
 */
import {
  GARIS, acak, cahaya, elips, gores, gradLinear, gradRadial, jalur, kotak, modePiksel, n, poli, tepi,
} from './alat';
import {
  BAMBU, BILAH, CAKRAWALA, KUSEN, LANTAI_Y, LILIN_X, MEJA, PAPAN, PINTU, SEKAT, TEMPAT_MEJA, TINGGI_LILIN, TITIK_HILANG, keGrid,
} from './geometri';

/**
 * Palet ruang (dipakai juga pintu-luar). v5 (review 28 Sep "dinding lebih tenang, jas/meja/dinding sama-sama emas"):
 * dinding oker diturunkan saturasinya menjadi pasir hangat (dulu #efc877 / #e3b35c / #d29a45), supaya jas emas Miss
 * Raksa & tulisan emas plakat menjadi satu-satunya emas jenuh; nada dinding tetap hangat (identitas kayu-emas-hijau).
 */
export const WARNA = {
  okerTerang: '#e0c69a',
  oker: '#d5b788',
  okerTua: '#c5a473',
  walnut: '#553019',
  walnutTua: '#361c0d',
  walnutTerang: '#8c5634',
  kayuMuda: '#d2a064',
  kayuSedang: '#a8733f',
  kayuTua: '#7a4a28',
  kusen: '#6e4329',
  lantaiJauh: '#a8784a',
  lantaiDekat: '#6e4527',
} as const;

// ------------------------------------------------------------------ dinding + lampu

export function dindingOker(id: string, lebar: number, bawah: number, lampu: readonly number[]): string {
  if (modePiksel()) {
    // Piksel: dinding pasir hangat datar + genangan cahaya sorot 2 nada yang BERDEKATAN (v5: dulu 3 nada kontras = pola
    // "api" di balik kepala), pita sedikit lebih tua di kaki dinding.
    let q = kotak(0, 0, lebar, bawah, WARNA.oker) + kotak(0, bawah - 96, lebar, 96, '#cbac7c');
    for (const x of lampu) {
      q += elips(x, -20, 120, 280, '#dabd90') + elips(x, -40, 60, 150, '#dfc499');
    }
    return q;
  }
  let s = `<defs>${gradLinear(`${id}-dd`, 0, 0, lebar * 0.9, bawah * 1.3, [[0, WARNA.okerTerang], [0.45, WARNA.oker], [1, WARNA.okerTua]])}</defs>`;
  s += kotak(0, 0, lebar, bawah, `url(#${id}-dd)`);
  // Lampu sorot plafon (di luar bingkai atas) menyapu dinding: kipas terang memudar ke bawah.
  lampu.forEach((x, i) => {
    s += cahaya(`${id}-sorot${i}`, x, -30, 150, 360, '#fde7ad', 0.62);
    s += cahaya(`${id}-inti${i}`, x, -10, 55, 120, '#fff4d2', 0.55);
  });
  // Cahaya kiri atas + bayangan lembut di sudut kanan bawah.
  s += `<defs>${gradRadial(`${id}-kiri`, 0, 0, lebar * 0.7, [[0, '#fff1c9', 0.28], [1, '#fff1c9', 0]], bawah * 0.9)}</defs>`;
  s += kotak(0, 0, lebar, bawah, `url(#${id}-kiri)`);
  return s;
}

/** Plint kayu gelap di kaki dinding (kecuali di rentang `lubang`). */
export function plint(y: number, lebar: number, lubang?: readonly [number, number]): string {
  const bagian: [number, number][] = lubang ? [[0, lubang[0]], [lubang[1], lebar]] : [[0, lebar]];
  return bagian
    .map(([a, b]) => kotak(a, y - 12, b - a, 12, WARNA.kayuTua) + kotak(a, y - 12, b - a, 2, '#a26a3d') + kotak(a, y - 1, b - a, 1.4, GARIS, 'opacity=".5"'))
    .join('');
}

// ------------------------------------------------------------------ bambu

/**
 * Panel batang bambu hijau vertikal di atas latar hijau tua, ruas tidak beraturan, sorot kiri, sedikit tunas.
 * `benih` membuat susunan stabil.
 */
export function panelBambu(id: string, x1: number, x2: number, yAtas: number, yBawah: number, benih = 7): string {
  const r = acak(benih);
  // Piksel v5: batang hijau lebih tenang (hijau kuning #98a23f / #68a04a yang menyala diredam; jumlah warna sama = susunan
  // acak berbenih sama).
  const warna = modePiksel()
    ? ['#3a6a3e', '#437545', '#4a7d4a', '#52844e', '#3f6f40', '#5b8a50', '#6f8c4a', '#35633a']
    : ['#2f6d37', '#3b7f43', '#478d49', '#56984b', '#3a7440', '#68a04a', '#98a23f', '#2b6232'];
  // Piksel v5: latar sela batang lebih terang (dulu #1f4426 -> #132b18 hampir hitam) = kontras panel lebih tenang.
  const latarBambu: [string, string] = modePiksel() ? ['#2b5030', '#224227'] : ['#1f4426', '#132b18'];
  let s = `<defs>${gradLinear(`${id}-latar`, x1, yAtas, x2, yBawah, [[0, latarBambu[0]], [1, latarBambu[1]]])}</defs>`;
  s += kotak(x1, yAtas, x2 - x1, yBawah - yAtas, `url(#${id}-latar)`);
  // Dua baris: batang belakang (lebih gelap) lalu batang depan.
  for (const baris of [0, 1]) {
    let x = x1 - 4 + baris * 6;
    while (x < x2 - 4) {
      const w = baris === 0 ? 12 + r() * 6 : 11 + r() * 8;
      const c = warna[Math.floor(r() * warna.length)];
      const gelap = baris === 0 ? (modePiksel() ? 0.22 : 0.38) : 0;
      const bx = x + (baris === 0 ? 0 : r() * 4);
      const ww = Math.min(w, x2 - bx);
      if (ww > 4 && modePiksel()) {
        // Piksel: batang selebar kelipatan 4 (3–5 piksel), satu kolom sorot & satu kolom bayang, ruas 1 piksel.
        const px = keGrid(bx);
        const pw = Math.max(8, keGrid(Math.min(ww, x2 - px)));
        s += kotak(px, yAtas, pw, yBawah - yAtas, c);
        if (gelap) s += kotak(px, yAtas, pw, yBawah - yAtas, '#0b1f0e', `opacity="${gelap}"`);
        if (pw >= 12) s += kotak(px + 4, yAtas, 4, yBawah - yAtas, '#cfe39a', `opacity="${baris ? 0.26 : 0.14}"`);
        s += kotak(px + pw - 4, yAtas, 4, yBawah - yAtas, '#0c2210', 'opacity=".22"');
        let y = keGrid(yAtas + 20 + r() * 90);
        while (y < yBawah - 10) {
          s += kotak(px, y, pw, 4, '#16361b', 'opacity=".5"') + kotak(px + 4, y + 4, pw - 8, 4, '#d9ecb0', 'opacity=".22"');
          y = keGrid(y + 70 + r() * 70);
        }
      } else if (ww > 4) {
        s += kotak(bx, yAtas, ww, yBawah - yAtas, c);
        s += kotak(bx + ww * 0.12, yAtas, ww * 0.26, yBawah - yAtas, '#e8f3c4', `opacity="${baris ? 0.3 : 0.14}"`);
        s += kotak(bx + ww * 0.72, yAtas, ww * 0.28, yBawah - yAtas, '#0c2210', 'opacity=".32"');
        if (gelap) s += kotak(bx, yAtas, ww, yBawah - yAtas, '#0b1f0e', `opacity="${gelap}"`);
        // Ruas.
        let y = yAtas + 20 + r() * 90;
        while (y < yBawah - 10) {
          s += kotak(bx, y, ww, 2.2, '#16361b', 'opacity=".7"') + kotak(bx + 1, y + 2.2, ww - 2, 1.4, '#d9ecb0', 'opacity=".35"');
          y += 70 + r() * 70;
        }
      }
      x += (baris === 0 ? w * 1.9 : w + 1.5 + r() * 3);
    }
  }
  // Tunas kecil (seperti foto 09) — sedikit saja.
  for (let i = 0; i < 3; i += 1) {
    const tx = x1 + 30 + r() * (x2 - x1 - 60);
    const ty = yAtas + 120 + r() * (yBawah - yAtas - 220);
    s += jalur(`M${n(tx)} ${n(ty)} q7 -9 16 -6 q-6 6 -16 6 Z`, '#8fbf5a', tepi(0.8, 0.5));
    s += jalur(`M${n(tx)} ${n(ty)} q-4 -10 2 -16 q1 9 -2 16 Z`, '#a7cd6a', tepi(0.8, 0.5));
  }
  // Cahaya dari kiri atas, gelap ke kanan bawah.
  s += `<defs>${gradLinear(`${id}-sinar`, x1, yAtas, x2, yBawah, [[0, '#fff3c0', 0.22], [0.5, '#fff3c0', 0], [1, '#000', 0.22]])}</defs>`;
  s += kotak(x1, yAtas, x2 - x1, yBawah - yAtas, `url(#${id}-sinar)`);
  // Tepi & bayang panel di dinding kanan.
  s += `<defs>${gradLinear(`${id}-bayang`, x2, 0, x2 + 22, 0, [[0, '#5a3614', 0.3], [1, '#5a3614', 0]])}</defs>`;
  s += kotak(x2, yAtas, 22, yBawah - yAtas, `url(#${id}-bayang)`);
  s += gores(`M${n(x1)} ${n(yAtas)} V${n(yBawah)} M${n(x2)} ${n(yAtas)} V${n(yBawah)}`, GARIS, 1.4, 'opacity=".55"');
  return s;
}

// ------------------------------------------------------------------ papan walnut + lilin + bilah

/** Serat kayu walnut: gelombang horizontal & satu "mata kayu" melengkung (foto 08). */
function seratWalnut(r: () => number, x: number, y: number, w: number, h: number): string {
  let s = '';
  const garis = 12;
  for (let i = 0; i < garis; i += 1) {
    const yy = y + (h * (i + 0.5)) / garis + (r() - 0.5) * 8;
    const a1 = (r() - 0.5) * h * 0.35;
    const a2 = (r() - 0.5) * h * 0.35;
    const terang = i % 3 !== 1;
    const d = `M${n(x - 4)} ${n(yy)} C${n(x + w * 0.3)} ${n(yy + a1)} ${n(x + w * 0.55)} ${n(yy - a2)} ${n(x + w * 0.78)} ${n(yy + a1 * 0.6)} S${n(x + w + 6)} ${n(yy - a1 * 0.4)} ${n(x + w + 6)} ${n(yy)}`;
    s += gores(d, terang ? WARNA.walnutTerang : WARNA.walnutTua, 2 + r() * 6, `opacity="${terang ? 0.28 + r() * 0.2 : 0.35}"`);
  }
  // Serat melengkung di sekitar "mata kayu" (kiri tengah): busur terbuka, bukan cincin.
  const cx = x + w * 0.24;
  const cy = y + h * 0.58;
  for (let k = 0; k < 4; k += 1) {
    const rx = 46 + k * 30;
    const ry = 10 + k * 8;
    s += gores(`M${n(cx - rx)} ${n(cy + ry * 0.2)} Q${n(cx - rx * 0.3)} ${n(cy - ry * 1.8)} ${n(cx + rx * 0.4)} ${n(cy - ry * 0.4)} T${n(cx + rx * 1.6)} ${n(cy + ry * 0.3)}`, k % 2 ? WARNA.walnutTua : WARNA.walnutTerang, 3 + k, 'opacity=".2"');
  }
  return s;
}

/**
 * Papan walnut: bingkai atas kayu muda, bidang walnut berserat (TEKS KOSONG), rak kayu di bawah. Bidang teks tidak
 * diberi hiasan supaya tulisan dari konfigurasi (panggung) terbaca.
 */
export function papanWalnut(id: string, p: { x: number; y: number; w: number; h: number; rakAtas: number; rakBawah: number }, benih = 3, sorotX?: number): string {
  const r = acak(benih);
  const { x, y, w, h, rakAtas, rakBawah } = p;
  if (modePiksel()) {
    // Piksel: plakat walnut datar 2 nada + bevel 1 piksel (terang kiri-atas, gelap kanan-bawah), bingkai atas kayu
    // muda 2 piksel, dua serat pendek di tepi (bidang teks bersih), rak 3 piksel (atas terang, muka, garis bawah).
    let q = kotak(x - 4, y - 8, w + 8, 8, '#c99a5e') + kotak(x - 4, y - 8, w + 8, 4, '#efcf97');
    q += kotak(x, y, w, h, WARNA.walnut);
    q += kotak(x, y, w, 4, WARNA.walnutTerang) + kotak(x, y, 4, h, WARNA.walnutTerang, 'opacity=".7"');
    q += kotak(x, y + h - 4, w, 4, WARNA.walnutTua) + kotak(x + w - 4, y, 4, h, WARNA.walnutTua);
    q += kotak(x + 12, y + 12, w * 0.16, 4, WARNA.walnutTerang, 'opacity=".55"') + kotak(x + w * 0.78, y + h - 16, w * 0.14, 4, WARNA.walnutTua, 'opacity=".8"');
    q += kotak(x - 12, rakAtas - 4, w + 24, 4, '#e2b171') + kotak(x - 12, rakAtas, w + 24, rakBawah - rakAtas, '#a06a3a') + kotak(x - 12, rakBawah - 4, w + 24, 4, '#6e4329');
    return q;
  }
  let s = `<defs>${gradLinear(`${id}-wal`, 0, y, 0, y + h, [[0, '#6a3c21'], [0.55, WARNA.walnut], [1, '#3f2211']])}</defs>`;
  // Bingkai atas.
  s += kotak(x - 4, y - 7, w + 8, 7, '#c99a5e') + kotak(x - 4, y - 7, w + 8, 1.6, '#efcf97') + kotak(x - 4, y - 1.2, w + 8, 1.2, GARIS, 'opacity=".45"');
  s += kotak(x, y, w, h, `url(#${id}-wal)`);
  s += `<defs><clipPath id="${id}-klip"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"/></clipPath></defs>`;
  s += `<g clip-path="url(#${id}-klip)">${seratWalnut(r, x, y, w, h)}</g>`;
  // Kilau hangat dari lampu sorot di atas papan.
  const sx = sorotX ?? x + w / 2;
  s += cahaya(`${id}-kilau`, sx, y - 10, w * 0.42, h * 0.9, '#ffc98a', 0.3);
  // Rak: sisi atas tipis (hampir sejajar mata) + muka depan.
  s += `<defs>${gradLinear(`${id}-rak`, 0, rakAtas, 0, rakBawah, [[0, '#c08a50'], [1, '#86552b']])}</defs>`;
  s += kotak(x - 10, rakAtas - 3, w + 20, 3, '#dcaa6c');
  s += kotak(x - 10, rakAtas, w + 20, rakBawah - rakAtas, `url(#${id}-rak)`);
  s += kotak(x - 10, rakAtas, w + 20, 1.5, '#f0c88c', 'opacity=".8"');
  s += gores(`M${n(x - 10)} ${n(rakBawah)} H${n(x + w + 10)}`, GARIS, 1.4, 'opacity=".7"');
  s += kotak(x, y, w, h, 'none', tepi(1.3, 0.6));
  return s;
}

/** Lilin LED krem (tepi atas "meleleh", nyala LED kecil, pendar). Kelas `rg-nyala` = pendar (boleh dikedipkan panggung). */
export function lilin(id: string, cx: number, dasar: number, tinggi: number, lebar: number): string {
  const x = cx - lebar / 2;
  const atas = dasar - tinggi;
  if (modePiksel()) {
    // Piksel: badan krem 3 kolom (terang, krem, teduh), bibir atas 1 piksel, LED 1 piksel, nyala 1 × 2 piksel, pendar.
    // Pendar kecil datar (2 nada), badan krem 2 kolom + kolom teduh, nyala jingga 2 piksel berujung kuning, bayang rak.
    let q = `<g class="rg-nyala">${elips(cx, atas - 6, lebar * 0.75 + 4, tinggi * 0.4 + 4, '#f4d38e')}${elips(cx, atas - 8, lebar * 0.4 + 2, tinggi * 0.22 + 2, '#fbe6b4')}</g>`;
    q += kotak(x - 4, dasar, lebar + 8, 4, '#8a5a24', 'opacity=".5"');
    q += kotak(x, atas, lebar, tinggi, '#f3e0bb') + kotak(x, atas, 4, tinggi, '#fff6e2') + kotak(x + lebar - 4, atas, 4, tinggi, '#d4b584');
    q += kotak(cx - 2, atas - 12, 4, 8, '#e8841c') + kotak(cx - 2, atas - 16, 4, 4, '#ffd45c');
    return q;
  }
  let s = `<defs>${gradLinear(`${id}-bd`, x, 0, x + lebar, 0, [[0, '#fff6e2'], [0.55, '#f3e0bb'], [1, '#d9bd8e']])}</defs>`;
  s += `<g class="rg-nyala">${cahaya(`${id}-pendar`, cx, atas + tinggi * 0.2, lebar * 2.3, tinggi * 1.2, '#ffd27a', 0.42)}</g>`;
  s += elips(cx, dasar, lebar * 0.75, lebar * 0.14, '#2a1508', 'opacity=".35"');
  s += jalur(
    `M${n(x)} ${n(atas + 5)} Q${n(x + lebar * 0.3)} ${n(atas + 1)} ${n(x + lebar * 0.55)} ${n(atas + 4)} Q${n(x + lebar * 0.8)} ${n(atas + 7)} ${n(x + lebar)} ${n(atas + 2)} L${n(x + lebar)} ${n(dasar - 2)} Q${n(cx)} ${n(dasar + 2)} ${n(x)} ${n(dasar - 2)} Z`,
    `url(#${id}-bd)`,
    tepi(0.9, 0.55),
  );
  // Cahaya dalam lilin (LED) & nyala.
  s += elips(cx, atas + 9, lebar * 0.32, 5, '#ffe7a8', 'opacity=".8"');
  s += jalur(`M${n(cx)} ${n(atas - 9)} Q${n(cx + 4)} ${n(atas - 1)} ${n(cx)} ${n(atas + 4)} Q${n(cx - 4)} ${n(atas - 1)} ${n(cx)} ${n(atas - 9)} Z`, '#ffcf6b', 'opacity=".95"');
  s += elips(cx, atas, 1.3, 2.4, '#fff8dc');
  return s;
}

/** Panel bilah vertikal zaitun-keemasan (foto 08) di bawah rak papan. */
export function panelBilah(id: string, x1: number, x2: number, yAtas: number, yBawah: number, lampuX: readonly number[], benih = 11): string {
  const r = acak(benih);
  const warna = ['#76803f', '#838a47', '#6b753c', '#8e9150'];
  let s = kotak(x1, yAtas, x2 - x1, yBawah - yAtas, modePiksel() ? '#5a6134' : '#262b1a');
  let i = 0;
  if (modePiksel()) {
    // Piksel: bilah 3 piksel + celah 1 piksel (jarak 4 piksel). v5 (review: pola di balik leher/wajah terlalu kontras):
    // celah zaitun tua (dulu hampir hitam #262b1a), bilah dua nada berdekatan, sorot kolom tipis, pendar lampu hanya
    // di bawah lilin (tengah, di antara kedua kepala; dulu juga tepat di balik leher kedua tokoh), gelap tepi lebih tipis.
    const bilah = ['#7a8243', '#80884a'];
    for (let x = x1; x < x2; x += 16) {
      s += kotak(x, yAtas, Math.min(12, x2 - x), yBawah - yAtas, bilah[(i + (r() < 0.2 ? 1 : 0)) % bilah.length]);
      s += kotak(x, yAtas, 4, yBawah - yAtas, '#eee6ad', 'opacity=".12"');
      i += 1;
    }
    const tengah = lampuX.length ? lampuX[Math.floor(lampuX.length / 2)]! : (x1 + x2) / 2;
    s += cahaya(`${id}-kolam0`, tengah, yAtas, 90, 150, '#ffd98f', 0.28);
    s += `<defs>${gradLinear(`${id}-gelap`, 0, yAtas, 0, yBawah, [[0, '#000', 0.14], [0.06, '#000', 0], [0.7, '#000', 0.03], [1, '#000', 0.18]])}</defs>`;
    s += kotak(x1, yAtas, x2 - x1, yBawah - yAtas, `url(#${id}-gelap)`);
    return s;
  }
  for (let x = x1 + 2; x < x2 - 2; x += 16) {
    const c = warna[(i + (r() < 0.2 ? 1 : 0)) % warna.length];
    const w = Math.min(12, x2 - 2 - x);
    s += kotak(x, yAtas, w, yBawah - yAtas, c);
    s += kotak(x + 1.2, yAtas, 2.2, yBawah - yAtas, '#eee6ad', 'opacity=".22"');
    s += kotak(x + w - 2.6, yAtas, 2.6, yBawah - yAtas, '#1c2012', 'opacity=".4"');
    i += 1;
  }
  // Pendar lampu rak ke bawah + gelap ke kaki dinding.
  lampuX.forEach((lx, i) => {
    s += cahaya(`${id}-kolam${i}`, lx, yAtas, 70, 150, '#ffd98f', 0.5);
  });
  s += `<defs>${gradLinear(`${id}-gelap`, 0, yAtas, 0, yBawah, [[0, '#000', 0.28], [0.08, '#000', 0], [0.7, '#000', 0.05], [1, '#000', 0.3]])}</defs>`;
  s += kotak(x1, yAtas, x2 - x1, yBawah - yAtas, `url(#${id}-gelap)`);
  s += gores(`M${n(x1)} ${n(yAtas)} V${n(yBawah)} M${n(x2)} ${n(yAtas)} V${n(yBawah)}`, GARIS, 1.2, 'opacity=".5"');
  return s;
}

// ------------------------------------------------------------------ lantai, kusen

/** Lantai kayu madu mengkilap: papan menyempit ke titik hilang, pantulan dinding, bayangan kaki dinding. */
export function lantai(id: string, yAtas: number, lebar: number, bawah: number, vpX: number, vpY: number): string {
  let s = `<defs>${gradLinear(`${id}-lt`, 0, yAtas, 0, bawah, [[0, WARNA.lantaiJauh], [1, WARNA.lantaiDekat]])}</defs>`;
  s += kotak(0, yAtas, lebar, bawah - yAtas, `url(#${id}-lt)`);
  let garis = '';
  const k = (bawah - vpY) / (yAtas - vpY);
  const jarak = modePiksel() ? 128 : 64;
  for (let x0 = -1400; x0 <= lebar + 1400; x0 += jarak) {
    const xb = vpX + (x0 - vpX) * k;
    garis += `M${n(x0)} ${n(yAtas)} L${n(xb)} ${n(bawah)} `;
  }
  s += gores(garis, '#4f2e14', 1.3, modePiksel() ? 'opacity=".45"' : 'opacity=".38"');
  // Kilau lantai (pantulan lampu) memanjang ke arah kamera.
  s += `<defs>${gradLinear(`${id}-kilau`, 0, yAtas, 0, bawah, [[0, '#ffd9a0', 0.16], [1, '#ffd9a0', 0]])}</defs>`;
  s += kotak(0, yAtas, lebar, bawah - yAtas, `url(#${id}-kilau)`);
  // Sambungan ujung papan (berselang).
  const r = acak(5);
  let sambung = '';
  for (let i = 0; i < 26; i += 1) {
    const t = r();
    const y = yAtas + (bawah - yAtas) * (0.08 + t * t * 0.9);
    const x = r() * lebar;
    const len = 30 + (y - yAtas) * 0.35;
    sambung += `M${n(x)} ${n(y)} h${n(len)} `;
  }
  s += gores(sambung, '#6c3f1c', 1, 'opacity=".22"');
  // Pantulan hangat dinding & bayangan kaki dinding.
  s += `<defs>${gradLinear(`${id}-pantul`, 0, yAtas, 0, yAtas + 90, [[0, '#6b3c16', 0.35], [0.1, '#ffd48a', 0.25], [1, '#ffd48a', 0]])}</defs>`;
  s += kotak(0, yAtas, lebar, 90, `url(#${id}-pantul)`);
  return s;
}

/** Kusen kayu di sekeliling bukaan pintu (latar). Bukaan sendiri diisi gelap (tertutup koridor/daun). */
export function kusenPintu(id: string, b: { x: number; y: number; w: number; h: number }, tebal: number): string {
  const { x, y, w, h } = b;
  const bawah = y + h;
  let s = `<defs>${gradLinear(`${id}-bay`, x + w + tebal, 0, x + w + tebal + 26, 0, [[0, '#5a3614', 0.28], [1, '#5a3614', 0]])}</defs>`;
  s += kotak(x + w + tebal, y - tebal + 8, 26, h + tebal - 8, `url(#${id}-bay)`);
  s += kotak(x, y, w, h, '#22150c');
  // Jamb kiri, kanan, kepala.
  const jamb = (jx: number): string =>
    kotak(jx, y - tebal, tebal, h + tebal, WARNA.kusen) + kotak(jx, y - tebal, 3, h + tebal, '#9a6640') + kotak(jx + tebal - 2.5, y - tebal, 2.5, h + tebal, '#3b2212', 'opacity=".6"');
  s += jamb(x - tebal) + jamb(x + w);
  s += kotak(x - tebal, y - tebal, w + tebal * 2, tebal, WARNA.kusen) + kotak(x - tebal, y - tebal, w + tebal * 2, 3, '#a8724a');
  s += kotak(x - tebal, y - tebal, w + tebal * 2, h + tebal, 'none', tepi(1.4, 0.75));
  s += kotak(x, y, w, h, 'none', tepi(1.2, 0.6));
  // Ambang lantai.
  s += kotak(x - 2, bawah - 3, w + 4, 6, '#b89a74') + kotak(x - 2, bawah - 3, w + 4, 1.5, '#e8d4b4');
  return s;
}

// ------------------------------------------------------------------ kursi petugas (sandaran di balik Miss Raksa)

/** Sandaran kursi kantor (jaring abu tua, bingkai membulat) di balik punggung Miss Raksa (ia menghadap kanan). */
function sandaranPetugas(id: string): string {
  // Digambar di koordinat lama (Miss Raksa x 600, tepi meja 604) lalu dipindah ke kiri badan Miss Raksa kini & diperlebar
  // 1,3× (badan chibi lebih lebar): dasar sandaran di tepi jauh meja.
  const dx = TEMPAT_MEJA.mentor.x - 69;
  const t = `translate(${dx} ${MEJA.JB[1]}) scale(1.25 0.86) translate(-531 -604)`;
  return `<g transform="${t}">${sandaranLama(id)}</g>`;
}
function sandaranLama(id: string): string {
  let s = `<defs>${gradLinear(`${id}-ks`, 470, 440, 580, 600, [[0, '#6a6660'], [0.45, '#48443f'], [1, '#2e2b28']])}</defs>`;
  // Tiang & bingkai.
  s += jalur('M488 452 Q530 432 574 446 Q584 520 572 604 L496 604 Q478 520 488 452 Z', `url(#${id}-ks)`, tepi(1.4, 0.75));
  s += jalur('M496 462 Q530 446 564 458 Q572 520 562 596 L504 596 Q490 520 496 462 Z', '#3a3733', 'opacity=".55"');
  // Anyaman jaring (garis halus) & sorot bingkai kiri atas.
  let jaring = '';
  for (let k = 0; k < 7; k += 1) jaring += `M${500 + k * 10} ${462 - k * 1.2} Q${498 + k * 10} 530 ${504 + k * 9} 596 `;
  s += gores(jaring, '#26231f', 1, 'opacity=".5"');
  s += gores('M492 458 Q530 438 572 450', '#8e877e', 1.6, 'opacity=".75"');
  s += gores('M490 470 Q484 530 496 600', '#7a746c', 1.2, 'opacity=".5"');
  return s;
}

// ------------------------------------------------------------------ susunan latar `meja`

/** Warna kusen pintu sekat (kayu madu; daun pintu pintu.ts `daunSekat` senada). */
export const KUSEN_SEKAT = { kayu: '#a4724a', sorot: '#cf9f6c', bayang: '#6e4a2e' } as const;

/**
 * SEKAT pintu masuk (kanan, sedalam tokoh skala 1): muka kiri sekat (tebal, menjauh ke titik hilang), muka depan oker,
 * kusen engsel di kiri bukaan; bukaan diisi gelap (tertutup lapisan koridor/daun). Kusen atas di luar dunia.
 */
function sekatPintu(id: string): string {
  const x0 = SEKAT.x;
  // v5: sisi sekat & kusen kayu madu lebih terang/hangat (dulu #a86f33 & kusen #6e4329 tua).
  let s = kotak(x0 - SEKAT.sisi, 0, SEKAT.sisi, 900, '#b98a57') + kotak(x0 - SEKAT.sisi, 0, 4, 900, '#d2a672');
  s += `<defs>${gradLinear(`${id}-sekat`, x0, 0, 1600, 900, [[0, WARNA.okerTerang], [0.6, WARNA.oker], [1, WARNA.okerTua]])}</defs>`;
  s += kotak(x0, 0, 1600 - x0, 900, `url(#${id}-sekat)`);
  s += cahaya(`${id}-sekat-sorot`, x0 + 60, -40, 120, 420, '#fde7ad', 0.45);
  // Kusen engsel (kiri bukaan).
  const kx = PINTU.x - KUSEN;
  s += kotak(kx, 0, KUSEN, 900, KUSEN_SEKAT.kayu) + kotak(kx, 0, 4, 900, KUSEN_SEKAT.sorot) + kotak(kx + KUSEN - 4, 0, 4, 900, KUSEN_SEKAT.bayang);
  // Bukaan: tertutup lapisan koridor/daun di dalam dunia. Diisi TERANG (dinding & lantai koridor, bukan gelap): baris &
  // kolom tepi latar ini yang diperpanjang panggung ke luar dunia bila pandangan lebih besar daripada dunia (letterbox),
  // jadi tidak pernah tampak sebagai bidang hitam di bawah/samping pintu.
  s += kotak(PINTU.x, 0, PINTU.w, 900, '#efe3c9') + kotak(PINTU.x, 666, PINTU.w, 234, '#d9c7a4');
  s += modePiksel() ? kotak(x0 - SEKAT.sisi - 4, 0, 4, 900, '#9a6c3c') : gores(`M${n(x0 - SEKAT.sisi)} 0 V900`, GARIS, 1.4, 'opacity=".6"');
  return s;
}

export function latarRuangLayanan(lok: string): string {
  const id = `rg-${lok}-latar`;
  const bawahDinding = LANTAI_Y;
  const tengahPapan = PAPAN.x + PAPAN.w / 2;
  let s = '';
  s += dindingOker(id, 1600, bawahDinding, [216, 560, tengahPapan, 1184]);
  s += panelBambu(`${id}-bambu`, BAMBU.x, BAMBU.x2, 0, bawahDinding - 12);
  s += panelBilah(`${id}-bilah`, BILAH.x, BILAH.x2, BILAH.y, bawahDinding - 12, [TEMPAT_MEJA.mentor.x, tengahPapan, TEMPAT_MEJA.nasabahDuduk.x]);
  // Plakat nama + rak lilin di antara kedua kepala (bayang rak di dinding).
  s += papanWalnut(`${id}-papan`, PAPAN, 3, tengahPapan);
  s += kotak(PAPAN.x - 12, PAPAN.rakBawah, PAPAN.w + 24, 8, '#8a5a24', 'opacity=".35"');
  LILIN_X.forEach((x, i) => {
    s += lilin(`${id}-lilin${i}`, x, PAPAN.rakAtas - 4, TINGGI_LILIN, 16);
  });
  s += plint(bawahDinding, 1600);
  s += lantai(`${id}-lantai`, bawahDinding, 1600, 900, TITIK_HILANG[0], CAKRAWALA);
  // Bayang meja di lantai kanan (cahaya dari kiri atas) — menapakkan meja; di bawah lapisan tokoh.
  const [dkx, dky] = MEJA.DK;
  s += `<defs>${gradLinear(`${id}-baymeja`, dkx, 0, dkx + 90, 0, [[0, '#2a1508', 0.34], [1, '#2a1508', 0]])}</defs>`;
  s += poli([[dkx, dky + 12], [dkx + 56, dky + 24], [dkx + 84, 900], [dkx, 900]], `url(#${id}-baymeja)`);
  s += `<defs>${gradLinear(`${id}-kontakmeja`, dkx, 0, dkx + 24, 0, [[0, '#1d0d04', 0.38], [1, '#1d0d04', 0]])}</defs>`;
  s += poli([[dkx, dky + 16], [dkx + 12, dky + 20], [dkx + 24, 900], [dkx, 900]], `url(#${id}-kontakmeja)`);
  s += sandaranPetugas(id);
  s += sekatPintu(id);
  // Cahaya koridor di muka kiri sekat & lantai dekatnya saat pintu terbuka: tersembunyi (opacity 0), panggung boleh
  // menaikkannya selama daun terbuka.
  s += `<defs>${gradLinear(`${id}-tumpah`, SEKAT.x, 0, SEKAT.x - 120, 0, [[0, '#fff3d2', 0.5], [1, '#fff3d2', 0]])}</defs>`;
  s += poli([[SEKAT.x - SEKAT.sisi, bawahDinding + 120], [SEKAT.x, bawahDinding + 60], [SEKAT.x, 900], [SEKAT.x - 140, 900]], `url(#${id}-tumpah)`, 'class="rg-cahaya-pintu" opacity="0"');
  return s;
}
