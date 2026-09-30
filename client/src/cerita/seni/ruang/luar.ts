/**
 * PINTU-LUAR (shot pembuka ± 1,6 dtk, kamera mendorong pelan): koridor di depan ruang layanan Raksa Silver Club —
 * papan walnut dengan rak & tiga lilin LED (foto 08, TEKS KOSONG: panggung menulis nama dari konfigurasi), panel
 * bilah zaitun di bawahnya, kolom bambu (foto 05/09), pintu ruang layanan (tertutup; daun terpisah bila panggung ingin
 * membukanya ke sekilas ruang kuning), pedestal walnut berisi vas (foto 09), lantai mengkilap. Kamera setinggi mata
 * orang berdiri (cakrawala y 330), dinding pada s = 0,517: pintu 90 × 210 cm = 270 × 630.
 */
import { cahaya, elips, gores, gradLinear, jalur, kotak, lapisan, modePiksel, n, tepi } from './alat';
import { dindingOker, kusenPintu, lilin, panelBambu, panelBilah, papanWalnut, plint } from './dinding';
import { daunPintu, sekilasRuang } from './pintu';
import type { RuangAdegan } from './tipe';

const LOK = 'pintu-luar';
const CAKRAWALA = 330;
const S = 0.517;
const LANTAI = Math.round(CAKRAWALA + 870 * S); // 780
/**
 * Papan + pintu dirapatkan di blok tengah x 380–1285 supaya potongan 4:3 (HP, mis. x 330–1330) tetap memuat seluruh
 * teks papan & pintu; bambu & pedestal = pengapit di tepi (boleh terpotong).
 */
const PINTU = { x: 1008, y: LANTAI - 632, w: 272, h: 632 } as const;
const PAPAN = { x: 385, y: 250, w: 560, h: 150, rakAtas: 400, rakBawah: 421 } as const;
const TEKS = { x: 410, y: 262, w: 510, h: 78, ukuranHuruf: 56, warna: '#e9c46a' } as const;
const LILIN = [440, 665, 890] as const;

/** Pedestal walnut dengan vas keramik kecil (foto 09). */
function pedestal(id: string, x: number, lantai: number): string {
  const w = 92;
  const h = 270;
  const y = lantai - h;
  let s = `<defs>${gradLinear(`${id}-ped`, x, 0, x + w, 0, [[0, '#9b6238'], [0.5, '#7a4526'], [1, '#512c16']])}</defs>`;
  s += elips(x + w / 2 + 16, lantai + 2, w * 0.75, 9, '#2a1508', 'opacity=".3"');
  s += kotak(x, y, w, h, `url(#${id}-ped)`, tepi(1.3, 0.75));
  let serat = '';
  for (let i = 0; i < 6; i += 1) serat += `M${x + 10 + i * 13} ${y + 6} C${x + 18 + i * 13} ${y + h * 0.4} ${x + 4 + i * 13} ${y + h * 0.7} ${x + 12 + i * 13} ${lantai - 6} `;
  s += gores(serat, '#3b1f0e', 1.4, 'opacity=".35"');
  s += kotak(x - 4, y - 8, w + 8, 8, '#a8703f', tepi(1, 0.7));
  // Vas keramik hijau pucat.
  const cx = x + w / 2;
  s += jalur(`M${cx - 10} ${y - 8} Q${cx - 24} ${y - 26} ${cx - 12} ${y - 44} L${cx - 7} ${y - 58} L${cx + 7} ${y - 58} L${cx + 12} ${y - 44} Q${cx + 24} ${y - 26} ${cx + 10} ${y - 8} Z`, '#b9ccb0', tepi(1, 0.7));
  s += gores(`M${cx - 12} ${y - 40} Q${cx - 18} ${y - 26} ${cx - 10} ${y - 14}`, '#eef6e6', 2, 'opacity=".7"');
  return s;
}

function latarLuar(): string {
  const id = `rg-${LOK}-latar`;
  let s = dindingOker(id, 1600, LANTAI, [120, 665, 1145, 1480]);
  s += panelBambu(`${id}-bambu`, 150, 320, 0, LANTAI - 12, 21);
  s += panelBambu(`${id}-bambu2`, 1540, 1640, 0, LANTAI - 12, 23);
  s += papanWalnut(`${id}-papan`, PAPAN, 9, 665);
  s += panelBilah(`${id}-bilah`, PAPAN.x, PAPAN.x + PAPAN.w, PAPAN.rakBawah, LANTAI - 12, [480, 665, 850], 17);
  s += `<defs>${gradLinear(`${id}-bayrak`, 0, PAPAN.rakBawah, 0, PAPAN.rakBawah + 22, [[0, '#000', 0.42], [1, '#000', 0]])}</defs>`;
  s += kotak(PAPAN.x, PAPAN.rakBawah, PAPAN.w, 22, `url(#${id}-bayrak)`);
  LILIN.forEach((x, i) => {
    s += lilin(`${id}-lilin${i}`, x, PAPAN.rakAtas - 1, 52, 28);
  });
  s += kusenPintu(`${id}-kusen`, PINTU, 20);
  s += plint(LANTAI, 1600, [PINTU.x - 20, PINTU.x + PINTU.w + 20]);
  // Lantai batu hangat mengkilap + pantulan papan, pintu, lilin.
  s += `<defs>${gradLinear(`${id}-lt`, 0, LANTAI, 0, 900, [[0, '#b99468'], [1, '#8c6844']])}</defs>`;
  s += kotak(0, LANTAI, 1600, 900 - LANTAI, `url(#${id}-lt)`);
  s += kotak(PAPAN.x, LANTAI + 2, PAPAN.w, 60, '#5b6534', 'opacity=".18"');
  s += kotak(PINTU.x, LANTAI + 2, PINTU.w, 90, '#7a4a2c', 'opacity=".22"');
  LILIN.forEach((x, i) => {
    s += cahaya(`${id}-pantul${i}`, x, LANTAI + 40, 30, 50, '#ffd98a', 0.22);
  });
  let nat = '';
  for (let x0 = -2000; x0 <= 3600; x0 += 150) nat += `M${n(x0)} ${LANTAI} L${n(800 + (x0 - 800) * ((900 - CAKRAWALA) / (LANTAI - CAKRAWALA)))} 900 `;
  s += gores(nat, '#5a3d20', 1.2, 'opacity=".3"');
  s += gores(`M0 ${LANTAI + 46} H1600`, '#5a3d20', 1, 'opacity=".25"');
  s += `<defs>${gradLinear(`${id}-ao`, 0, LANTAI, 0, LANTAI + 16, [[0, '#2a1508', 0.35], [1, '#2a1508', 0]])}</defs>`;
  s += kotak(0, LANTAI, 1600, 16, `url(#${id}-ao)`);
  s += pedestal(`${id}-ped`, 1380, LANTAI);
  // Sudut ruang menggelap (vinyet hangat lembut) supaya mata tertuju ke papan & pintu.
  s += `<defs><radialGradient id="${id}-vin" gradientUnits="userSpaceOnUse" cx="830" cy="430" r="980"><stop offset=".6" stop-color="#3b1f0e" stop-opacity="0"/><stop offset="1" stop-color="#3b1f0e" stop-opacity=".28"/></radialGradient></defs>`;
  if (!modePiksel()) s += kotak(0, 0, 1600, 900, `url(#${id}-vin)`);
  return s;
}

/** Bingkai yang disarankan untuk HP (4:3) & titik tuju dorong kamera (dunia). */
export const BINGKAI_LUAR = { hp: { x: 330, y: 120, w: 1000, h: 750 }, pusatDorong: { x: 830, y: 440 } } as const;

export function luarPintu(): RuangAdegan {
  const b = PINTU;
  const tinggiGagang = Math.round(LANTAI - 100 * 5.8 * S);
  // Tokoh piksel selalu skala 1 (telapak di luar dunia bawah); shot pembuka TIDAK menaruh tokoh.
  const kaki = 1000;
  return {
    lokasi: LOK,
    latar: lapisan(latarLuar(), 0, 0, 1600, 900),
    koridor: lapisan(sekilasRuang(`rg-${LOK}-koridor`, b), b.x, b.y, b.w, b.h),
    pintu: {
      daun: lapisan(daunPintu(`rg-${LOK}-daun`, b, tinggiGagang), b.x, b.y, b.w, b.h),
      engsel: { x: b.x, y: b.y + b.h / 2 },
      bukaan: { x: b.x, y: b.y, w: b.w, h: b.h },
    },
    tempat: {
      // Shot pembuka tanpa tokoh; titik cadangan skala 1 (latar depan) bila panggung ingin menaruh tokoh.
      mentor: { x: 760, y: kaki },
      mentorBerdiri: { x: 760, y: kaki },
      skalaMentor: 1,
      nasabahDuduk: { x: 1220, y: kaki },
      skalaNasabah: 1,
      nasabahBerdiri: { x: 1220, y: kaki },
      jalurMasuk: [],
    },
    papanNama: { ...TEKS },
  };
}
