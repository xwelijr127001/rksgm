/**
 * PENGGANTI SEMENTARA lapisan ruang v3: bidang warna sederhana dengan koordinat kontrak (ADEGAN-AUTO1.md bagian 2),
 * supaya panggung & cue bisa dibangun paralel. Juga fallback bila generator ruang final gagal.
 */
import type { IdLokasiAdegan } from '../../tipe';
import type { RuangAdegan } from './tipe';

const lap = (svg: string, x: number, y: number, w: number, h: number) => ({ svg, x, y, w, h });

export function ruangSementara(lokasi: IdLokasiAdegan): RuangAdegan {
  const luar = lokasi === 'pintu-luar';
  const parkir = lokasi === 'parkiran';
  const latar = parkir
    ? '<rect width="1600" height="600" fill="#bfe0f2"/><rect y="600" width="1600" height="300" fill="#8f949a"/>'
    : '<rect width="1600" height="600" fill="#e3b35c"/><rect x="90" y="40" width="240" height="560" fill="#3f8a4f"/><rect x="560" y="110" width="590" height="160" rx="10" fill="#4a2e1f"/><rect y="600" width="1600" height="300" fill="#c9a77a"/>';
  return {
    lokasi,
    latar: lap(latar, 0, 0, 1600, 900),
    koridor: parkir ? undefined : lap('<rect width="170" height="430" fill="#f3efe4"/>', 1250, 170, 170, 430),
    pintu: parkir ? undefined : { daun: lap('<rect width="170" height="430" fill="#8a5a3a" stroke="#3a2620" stroke-width="4"/>', 1250, 170, 170, 430), engsel: { x: 1250, y: 385 }, bukaan: { x: 1250, y: 170, w: 170, h: 430 } },
    belakangMeja: luar || parkir ? undefined : lap('<polygon points="50,40 850,10 920,130 0,170" fill="#e9c98e" stroke="#3a2620" stroke-width="4"/><rect x="70" y="-130" width="160" height="170" fill="#222"/>', 330, 570, 920, 180),
    depanMeja: luar || parkir ? undefined : lap('<rect width="600" height="150" fill="#b98552" stroke="#3a2620" stroke-width="4"/>', 330, 700, 600, 150),
    kursi: luar || parkir ? undefined : { belakang: lap('<rect width="200" height="260" rx="24" fill="#8b3f4a"/>', 1010, 480, 200, 260) },
    tempat: {
      mentor: { x: 600, y: 640 },
      mentorBerdiri: { x: 600, y: 900 },
      skalaMentor: 1,
      nasabahDuduk: { x: 1060, y: 700 },
      skalaNasabah: 1.05,
      nasabahBerdiri: parkir ? { x: 980, y: 880 } : { x: 1100, y: 900 },
      jalurMasuk: parkir || luar ? [] : [
        { titik: { x: 1335, y: 600 }, skala: 0.72 },
        { titik: { x: 1180, y: 660 }, skala: 0.9 },
        { titik: { x: 1100, y: 700 }, skala: 1 },
      ],
      kartuSimpan: { x: 700, y: 650 },
      kartuMeja: { x: 830, y: 640 },
      kunciMeja: { x: 975, y: 655 },
      telepon: { x: 470, y: 640 },
    },
    papanNama: parkir ? undefined : { x: 560, y: 110, w: 590, h: 160, ukuranHuruf: 72, warna: '#e8c170' },
  };
}
