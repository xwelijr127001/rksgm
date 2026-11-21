/**
 * T-103 (Designer): LABEL ANTARMUKA komponen panel (tombol dan nama kontrol saja). Kartu 3 tidak boleh mengubah kamus bersama,
 * jadi label kecil ini tinggal di sini (id / en / zh, tanpa jatuh ke bahasa lain). Semua kalimat NASKAH (pertanyaan ketua,
 * pernyataan, judul / sumber / kutipan bukti, pertanyaan dan jawaban "tanya lebih lanjut") datang dari props, sudah diterjemahkan.
 * Tidak ada istilah kebijakan, hukum, atau nama panel di sini.
 */
import { useBahasa } from '../../../../i18n';

const LABEL = {
  id: {
    tanya: 'Tanya lebih lanjut',
    tanyaKet: 'Tanpa poin, tanpa waktu',
    tanyaAnda: 'Anda bertanya',
    tutup: 'Tutup',
    pilih: 'Pilih satu bukti',
    tunjukkan: 'Tunjukkan bukti ini',
    periksa: 'Perbesar: {judul}',
    bukti: 'Bukti: {judul}',
    daftar: 'Bukti di meja',
    pakai: 'Pakai bukti ini',
    sumber: 'Sumber',
    dekat: 'Lihat dari dekat',
    utuh: 'Lihat foto utuh',
    dibantah: 'Pernyataan yang diperiksa',
    ruang: 'Ruang panel',
  },
  en: {
    tanya: 'Ask a follow-up',
    tanyaKet: 'No points, no timer',
    tanyaAnda: 'You asked',
    tutup: 'Close',
    pilih: 'Choose one piece of evidence',
    tunjukkan: 'Present this evidence',
    periksa: 'Enlarge: {judul}',
    bukti: 'Evidence: {judul}',
    daftar: 'Evidence on the table',
    pakai: 'Use this evidence',
    sumber: 'Source',
    dekat: 'Look closer',
    utuh: 'See the whole photo',
    dibantah: 'Statement under review',
    ruang: 'Panel room',
  },
  zh: {
    tanya: '继续追问',
    tanyaKet: '不扣分，不计时',
    tanyaAnda: '你的提问',
    tutup: '关闭',
    pilih: '请选择一项证据',
    tunjukkan: '出示这项证据',
    periksa: '放大：{judul}',
    bukti: '证据：{judul}',
    daftar: '桌上的证据',
    pakai: '使用这项证据',
    sumber: '来源',
    dekat: '近看',
    utuh: '查看整张照片',
    dibantah: '正在核对的陈述',
    ruang: '评审室',
  },
} as const;
export type LabelPanel = keyof (typeof LABEL)['id'];

/** Label dalam bahasa aktif; `{judul}` diganti parameter. Berlangganan bahasa (ganti bahasa = gambar ulang). */
export function useLabelPanel(): (k: LabelPanel, param?: Record<string, string>) => string {
  const { bahasa } = useBahasa();
  const kamus = LABEL[bahasa as keyof typeof LABEL] ?? LABEL.id;
  return (k, param) => {
    let s: string = kamus[k];
    if (param) for (const [n, v] of Object.entries(param)) s = s.split(`{${n}}`).join(v);
    return s;
  };
}
