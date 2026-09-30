/**
 * MEJA LAYANAN kayu jati + kaca (foto 05/09), perspektif 3/4 memanjang ke kanan. v5 (review 28 Sep): kayu jati sedang
 * (dulu madu terang #e8bd80) supaya puncak meja jelas terpisah dari jas emas Miss Raksa (nilai & saturasi berbeda),
 * tangan & manset putih di meja terbaca; kaca, lis hijau Raksa & bentuk tetap.
 * - `belakangMeja`: puncak meja (kayu, kaca, pantulan), monitor di belakang-kiri yang membelakangi kamera & miring
 *   ke Miss Raksa (tidak menutupi wajah/tangan), tumpukan formulir. Map kulit lama TIDAK lagi digambar (v4 piksel: meja
 *   terlalu sempit untuk telepon + kartu awal + map pada ukuran prop chibi; tangan Miss Raksa bertumpu di kaca). Tempat mendarat kartu (`LANDASAN_KARTU`) sengaja kosong: kartu polis satu-satunya benda krem-hijau
 *   serupa kartu di tengah meja. Kartu disodorkan dari tepi dekat meja sisi pemain (`PROP_MEJA.kartuSimpan`).
 * - `depanMeja`: bibir meja & panel depan (menutupi pinggang/pangkuan Miss Raksa), lis hijau Raksa.
 * Koordinat: geometri.ts. Prop bergerak (kartu, kunci, telepon): prop.ts, ditaruh panggung.
 */
import { GARIS, cahaya, elips, gores, gradLinear, jalur, lerp, modePiksel, n, poli, tepi, type Tt } from './alat';
import { CANGKIR, FORMULIR, MEJA, MONITOR } from './geometri';
import { propCangkir } from './prop';

const { JB, JK, DK, DB, bibir } = MEJA;

function puncakMeja(id: string): string {
  let s = `<defs>${gradLinear(`${id}-kayu`, JB[0], JB[1], DK[0], DK[1], [[0, '#bc8353'], [0.5, '#ad7546'], [1, '#9a653b']])}</defs>`;
  s += poli([JB, JK, DK, DB], `url(#${id}-kayu)`);
  // Serat kayu mengikuti kedalaman (dari tepi jauh ke tepi dekat).
  let serat = '';
  for (let i = 1; i < 22; i += 1) {
    const t = i / 22;
    const a = lerp(JB, JK, t + Math.sin(i * 1.7) * 0.01);
    const b = lerp(DB, DK, t);
    serat += `M${n(a[0])} ${n(a[1])} L${n(b[0])} ${n(b[1])} `;
  }
  s += gores(serat, '#7c5031', 1, 'opacity=".22"');
  // Kaca di atas kayu: rona hijau-kebiruan tipis, berkas pantulan diagonal, sorot tepi jauh. Piksel: tanpa rona
  // (kayu madu tetap terbaca), berkas pantulan lebih tegas (2 pita terang).
  if (!modePiksel()) s += poli([JB, JK, DK, DB], '#d9f0e8', 'opacity=".2"');
  const r1: Tt[] = [lerp(JB, JK, 0.34), lerp(JB, JK, 0.43), lerp(DB, DK, 0.37), lerp(DB, DK, 0.25)];
  const r2: Tt[] = [lerp(JB, JK, 0.47), lerp(JB, JK, 0.5), lerp(DB, DK, 0.43), lerp(DB, DK, 0.39)];
  // Piksel v5: pita pantulan = warna jati terang PADAT (putih transparan di atas jati sedang terkuantisasi ke mauve kursi).
  s += modePiksel()
    ? poli(r1, '#c69162') + poli(r2, '#c08a5b')
    : poli(r1, '#ffffff', 'opacity=".13"') + poli(r2, '#ffffff', 'opacity=".1"');
  // Pantulan hangat dinding/papan di kaca dekat tepi jauh.
  if (!modePiksel()) {
    s += `<defs>${gradLinear(`${id}-pantul`, 0, JK[1], 0, JK[1] + 40, [[0, '#6b3c1e', 0.28], [1, '#6b3c1e', 0]])}</defs>`;
    s += poli([JB, JK, lerp(JK, DK, 0.45), lerp(JB, DB, 0.45)], `url(#${id}-pantul)`);
  }
  // Garis tepi jauh (celah bayang di balik meja) & tepi samping.
  s += gores(`M${n(JB[0])} ${n(JB[1])} L${n(JK[0])} ${n(JK[1])}`, GARIS, 1.6, 'opacity=".7"');
  s += gores(`M${n(JB[0])} ${n(JB[1])} L${n(DB[0])} ${n(DB[1])} M${n(JK[0])} ${n(JK[1])} L${n(DK[0])} ${n(DK[1])}`, GARIS, 1.4, 'opacity=".6"');
  s += gores(`M${n(JB[0] + 4)} ${n(JB[1] + 2.5)} L${n(JK[0] - 4)} ${n(JK[1] + 2.5)}`, '#fff8e2', 1.4, 'opacity=".55"');
  return s;
}

/** Monitor membelakangi kamera, layar menghadap Miss Raksa (kanan-belakang). */
function monitor(id: string): string {
  const { x, y, w, h } = MONITOR;
  const ka = x + w;
  const ba = y + h;
  const belakang: Tt[] = [[x + 10, y + 16], [ka - 6, y + 4], [ka - 2, ba - 12], [x + 14, ba - 4]];
  const sisi: Tt[] = [[x, y + 20], [x + 10, y + 16], [x + 14, ba - 4], [x + 4, ba - 2]];
  const lehX = x + w * 0.54;
  const alasY = ba + 28;
  let s = `<defs>${gradLinear(`${id}-mon`, x, y, ka, ba, [[0, '#4a4d52'], [0.35, '#303236'], [1, '#1d1e21']])}</defs>`;
  // Bayang alas di kaca meja.
  s += elips(lehX + 8, alasY + 3, 56, 9, '#2a1a0c', 'opacity=".28"');
  // Leher & alas.
  s += jalur(`M${n(lehX - 7)} ${n(ba - 30)} L${n(lehX + 7)} ${n(ba - 30)} L${n(lehX + 9)} ${n(alasY - 3)} L${n(lehX - 5)} ${n(alasY - 3)} Z`, '#2b2d31', tepi(1.2, 0.8));
  s += elips(lehX + 2, alasY, 44, 8.5, '#34363a', tepi(1.2, 0.8));
  s += elips(lehX - 4, alasY - 2, 30, 4, '#5c6066', 'opacity=".6"');
  // Kabel.
  s += gores(`M${n(lehX + 4)} ${n(ba - 26)} C${n(lehX + 30)} ${n(ba)} ${n(lehX + 18)} ${n(alasY + 4)} ${n(lehX + 50)} ${n(alasY + 8)}`, '#18191b', 2.2, 'opacity=".85"');
  // Badan.
  s += poli(sisi, '#1a1b1e', tepi(1.2, 0.85));
  s += poli(belakang, `url(#${id}-mon)`, tepi(1.4, 0.9));
  // Tonjolan belakang (dudukan VESA) & kisi ventilasi.
  const c = lerp(lerp(belakang[0], belakang[2], 0.5), lerp(belakang[1], belakang[3], 0.5), 0.5);
  s += jalur(`M${n(c[0] - 34)} ${n(c[1] - 26)} L${n(c[0] + 30)} ${n(c[1] - 30)} L${n(c[0] + 32)} ${n(c[1] + 26)} L${n(c[0] - 32)} ${n(c[1] + 30)} Z`, '#2a2c30', tepi(0.9, 0.6));
  let kisi = '';
  for (let i = 0; i < 6; i += 1) kisi += `M${n(c[0] - 22 + i * 8)} ${n(c[1] - 42 + i * 0.5)} l0 -12 `;
  s += gores(kisi, '#101113', 2, 'opacity=".8"');
  s += gores(`M${n(belakang[0][0] + 3)} ${n(belakang[0][1] + 2)} L${n(belakang[1][0] - 4)} ${n(belakang[1][1] + 2)}`, '#7b8087', 1.3, 'opacity=".7"');
  // Pendar layar (menghadap Miss Raksa) di tepi kanan.
  s += cahaya(`${id}-layar`, ka - 2, y + h * 0.45, 14, h * 0.45, '#cfe6ff', 0.22);
  return s;
}

/** Tumpukan formulir kosong + pena (kiri meja). */
function formulir(): string {
  const { x, y } = FORMULIR;
  let s = elips(x + 34, y + 6, 40, 6, '#2a1a0c', 'opacity=".18"');
  for (let i = 0; i < 3; i += 1) {
    s += poli([[x + 6 - i, y - 12 - i * 3], [x + 68 - i, y - 16 - i * 3], [x + 72 - i, y - 2 - i * 3], [x + 2 - i, y + 2 - i * 3]], i === 2 ? '#fbf8ef' : '#eee7d6', tepi(0.8, 0.45));
  }
  s += gores(`M${x + 14} ${y - 12} l40 -2 M${x + 14} ${y - 8} l32 -1.6`, '#9c9486', 1, 'opacity=".7"');
  s += gores(`M${x + 20} ${y - 3} l46 -9`, '#1f4f7a', 2.6);
  s += gores(`M${x + 20} ${y - 3} l6 -1.2`, '#d8c07a', 2.6);
  return s;
}

/** Cangkir epilog telepon (geometri.ts): di kanan tempat mendarat kartu (di luar `LANDASAN_KARTU`). */
export { CANGKIR };

export function belakangMejaSvg(lok: string): string {
  const id = `rg-${lok}-mejaB`;
  let s = puncakMeja(id);
  s += formulir();
  s += monitor(id);
  if (lok === 'telepon') {
    const c = propCangkir();
    s += `<g transform="translate(${n(CANGKIR.x - c.jangkar.x)} ${n(CANGKIR.y - c.jangkar.y)})">${c.svg}</g>`;
  }
  return s;
}

export function depanMejaSvg(lok: string): string {
  const id = `rg-${lok}-mejaD`;
  const DBb: Tt = [DB[0], DB[1] + bibir];
  const DKb: Tt = [DK[0], DK[1] + bibir];
  let s = `<defs>${gradLinear(`${id}-muka`, 0, DK[1], 0, 900, [[0, '#a06e45'], [0.35, '#8e5f3a'], [1, '#6c4428']])}</defs>`;
  // Panel depan.
  s += poli([DBb, DKb, [DK[0], 900], [DB[0], 900]], `url(#${id}-muka)`);
  // Serat kayu mendatar halus (panel utuh, bukan pintu lemari) + satu sambungan panel di tengah.
  let serat = '';
  for (let i = 0; i < 16; i += 1) {
    const dy = 22 + i * 12 + ((i * 7) % 5);
    const a = lerp(DBb, DKb, 0);
    const b = lerp(DBb, DKb, 1);
    serat += `M${n(a[0])} ${n(a[1] + dy)} C${n(a[0] + 300)} ${n(a[1] + dy - 3)} ${n(b[0] - 400)} ${n(b[1] + dy + 4)} ${n(b[0])} ${n(b[1] + dy)} `;
  }
  s += gores(serat, '#6f4121', 1.2, 'opacity=".18"');
  const tengah = lerp(DBb, DKb, 0.5);
  s += gores(`M${n(tengah[0])} ${n(tengah[1] + 42)} V900`, '#4d2a12', 1.8, 'opacity=".45"') + gores(`M${n(tengah[0] + 2.5)} ${n(tengah[1] + 42)} V900`, '#e2b27a', 1, 'opacity=".4"');
  // Lis hijau Raksa di bawah bibir.
  const l1 = lerp(DBb, DKb, 0);
  const l2 = lerp(DBb, DKb, 1);
  s += poli([[l1[0], l1[1] + 34], [l2[0], l2[1] + 34], [l2[0], l2[1] + 39], [l1[0], l1[1] + 39]], '#2f7a4b');
  s += gores(`M${n(l1[0])} ${n(l1[1] + 34)} L${n(l2[0])} ${n(l2[1] + 34)}`, '#7cc08e', 1, 'opacity=".7"');
  // Bayang di bawah bibir (bibir menjorok).
  s += `<defs>${gradLinear(`${id}-bay`, 0, DKb[1], 0, DKb[1] + 26, [[0, '#2a1407', 0.45], [1, '#2a1407', 0]])}</defs>`;
  s += poli([DBb, DKb, [DK[0], DKb[1] + 26], [DB[0], DBb[1] + 26]], `url(#${id}-bay)`);
  // Gelap ke bawah kanan (menjauhi cahaya).
  s += `<defs>${gradLinear(`${id}-gelap`, DB[0], 0, DK[0], 0, [[0, '#fff1d0', 0.12], [0.6, '#000', 0], [1, '#000', 0.16]])}</defs>`;
  s += poli([DBb, DKb, [DK[0], 900], [DB[0], 900]], `url(#${id}-gelap)`);
  // Bibir meja (kayu) + tepi kaca hijau muda di atasnya.
  s += poli([DB, DK, DKb, DBb], '#b07d50', tepi(1.3, 0.8));
  s += gores(`M${n(DB[0])} ${n(DB[1] + 1.5)} L${n(DK[0])} ${n(DK[1] + 1.5)}`, '#a9dccb', 3);
  s += gores(`M${n(DB[0] + 3)} ${n(DB[1] + 0.2)} L${n(DK[0] - 3)} ${n(DK[1] + 0.2)}`, '#f4fffb', 1.2, 'opacity=".9"');
  s += gores(`M${n(DB[0])} ${n(DB[1] + 7)} L${n(DK[0])} ${n(DK[1] + 7)}`, '#cf9c6a', 1, 'opacity=".6"');
  // Tepi vertikal kiri/kanan.
  s += gores(`M${n(DBb[0])} ${n(DBb[1])} V900 M${n(DKb[0])} ${n(DKb[1])} V900`, GARIS, 1.6, 'opacity=".75"');
  return s;
}

/**
 * Kotak lapisan meja (dunia, kelipatan 4): belakang = puncak meja + monitor + map/formulir/cangkir (mulai di bawah dagu
 * kedua tokoh duduk); depan = bibir + panel depan sampai tepi bawah dunia.
 */
export const KOTAK_BELAKANG_MEJA = { x: DB[0] - 12, y: MONITOR.y - 8, w: DK[0] - DB[0] + 24, h: DB[1] + 12 - (MONITOR.y - 8) } as const;
export const KOTAK_DEPAN_MEJA = { x: DB[0] - 12, y: Math.min(DB[1], DK[1]) - 4, w: DK[0] - DB[0] + 24, h: 900 - (Math.min(DB[1], DK[1]) - 4) } as const;
