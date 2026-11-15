/**
 * ILUSTRASI panggung latar (fungsi MURNI): aset tokoh per ekspresi, pilihan resolusi, potongan kamera lokasi bergambar per
 * kelas layar (tetap untuk kantor, mengikuti subjek untuk lapangan), kotak tokoh di balik meja dan tokoh berdiri menurut
 * perspektif. Tanpa React & DOM (diuji di ilustrasi.test.ts).
 *
 * Aturan rendering per jenis aset: ilustrasi = gambar halus (image-rendering bawaan, varian resolusi sesuai ukuran tampil
 * x DPR, tidak pernah diperbesar melewati berkas terbesar); seni piksel Episode 1 tetap di jalurnya sendiri (panggung/).
 */
import type { BendaIlustrasi, Ekspresi, Episode, GambarTokoh, IdPembicara, LokasiIlustrasi, TokohIlustrasi, TokohLokasi, VarianGambar } from '../../tipe';
import type { KomposisiLatar, TokohLatar } from './komposisi';

const ada = (rec: object | undefined, k: string): boolean => !!rec && Object.prototype.hasOwnProperty.call(rec, k);

/** Aset ilustrasi pemeran ini, atau null (tanpa aset: siluet / inisial). */
export function asetTokoh(ep: Episode, id: IdPembicara): TokohIlustrasi | null {
  return ep.latar && ada(ep.latar.tokoh, id) ? ep.latar.tokoh[id] ?? null : null;
}

/** Pemeran punya potret dada-ke-atas sendiri (bukan badan penuh yang dipakai sebagai gambar dekat): cukup tajam untuk bidikan dekat. */
export function punyaPotret(ep: Episode, id: IdPembicara): boolean {
  const a = asetTokoh(ep, id);
  return !!a && a.dekat.netral !== a.badan;
}

/** Varian avatar (kepala-bahu persegi) untuk ekspresi ini; ekspresi tanpa avatar = netral. */
export function avatarTokoh(ep: Episode, id: IdPembicara, ekspresi: Ekspresi): readonly VarianGambar[] | null {
  const a = asetTokoh(ep, id);
  return a ? a.avatar[ekspresi] ?? a.avatar.netral : null;
}

/** Gambar adegan dekat (di balik meja) untuk ekspresi ini; ekspresi tanpa gambar = netral. */
export function dekatTokoh(ep: Episode, id: IdPembicara, ekspresi: Ekspresi): GambarTokoh | null {
  const a = asetTokoh(ep, id);
  return a ? a.dekat[ekspresi] ?? a.dekat.netral : null;
}

/** Nilai `srcset` dengan deskriptor lebar ("a.webp 160w, b.webp 320w"). */
export function srcsetDari(v: readonly VarianGambar[]): string {
  return v.map((x) => `${x.src} ${x.w}w`).join(', ');
}

/**
 * Varian terkecil yang cukup untuk `perluPx` piksel perangkat pada sisi itu (lebar/tinggi); bila tidak ada yang cukup,
 * yang terbesar (tidak pernah memilih berkas lebih kecil dari yang tersedia hanya demi hemat).
 */
export function pilihVarian(v: readonly VarianGambar[], perluPx: number, sisi: 'w' | 'h' = 'w'): VarianGambar {
  const urut = [...v].sort((a, b) => a[sisi] - b[sisi]);
  return urut.find((x) => x[sisi] >= perluPx) ?? urut[urut.length - 1]!;
}

export type KelasLayar = 'hp' | 'lebar';
/** Kelas layar dari lebar kotak panggung (piksel CSS): kotak sempit = bingkai HP. */
export const kelasLayar = (lebarKotak: number): KelasLayar => (lebarKotak < 560 ? 'hp' : 'lebar');

export interface Kotak { x: number; y: number; w: number; h: number }

/**
 * Potongan kamera (piksel sumber) lokasi bergambar untuk kotak panggung wKotak x hKotak: pusat & lebar dari bingkai kelas
 * layarnya, tinggi = lebar / rasio kotak; bila lebih tinggi dari gambar, lebar dikurangi. Selalu di dalam gambar.
 */
export function potonganIlustrasi(lok: LokasiIlustrasi, wKotak: number, hKotak: number): Kotak {
  const r = wKotak > 0 && hKotak > 0 ? wKotak / hKotak : 16 / 9;
  const kelas = kelasLayar(wKotak);
  // Panggung HP yang tinggi (beat pendek visual novel) = bidikan dekat bila lokasi menyediakannya.
  const b = kelas === 'hp' && r <= 1.15 && lok.bingkai.hpDekat ? lok.bingkai.hpDekat : lok.bingkai[kelas];
  let w = Math.min(b.lebar, lok.w);
  let h = w / r;
  if (h > lok.h) { h = lok.h; w = h * r; }
  if (w > lok.w) { w = lok.w; h = w / r; }
  const x = Math.min(Math.max(b.cx - w / 2, 0), lok.w - w);
  const y = Math.min(Math.max(b.cy - h / 2, 0), lok.h - h);
  return { x, y, w, h };
}

type TokohDekat = Extract<TokohLokasi, { jenis: 'dekat' }>;
type TokohBerdiri = Extract<TokohLokasi, { jenis: 'berdiri' }>;

/**
 * Kabur latar (px CSS) untuk bidikan yang memperbesar gambar latar melewati resolusinya: `perbesar` = piksel perangkat
 * yang ditampilkan per piksel berkas terbesar. Sampai 1,4x tanpa kabur; di atasnya kabur lembut (ruang tajam sinematik,
 * tokoh tetap tajam) supaya pembesaran tidak tampak pecah. Maks. 2,5 px.
 */
export function kaburLatar(perbesar: number): number {
  return perbesar <= 1.4 ? 0 : Math.min(2.5, Math.round((perbesar - 1.4) * 2.2 * 10) / 10);
}

/** Kotak tokoh (piksel sumber) di balik meja: tinggi kepala & puncak kepala lokasi, pusat kepala di x. */
export function kotakTokohIlustrasi(t: TokohDekat, g: GambarTokoh, x: number): Kotak {
  const h = t.tinggiKepala / Math.max(0.01, g.kepala.bawah - g.kepala.atas);
  const w = h * g.rasio;
  return { x: x - g.kepala.cx * w, y: t.atasKepala - g.kepala.atas * h, w, h };
}

/** Tinggi orang dewasa acuan (m) dan tinggi badan tokoh acuan dalam satuan `TokohIlustrasi.badan.tinggi`. */
export const TINGGI_ORANG_M = 1.7;
export const TINGGI_BADAN_ACUAN = 160;

/**
 * Kotak badan penuh BERDIRI (piksel sumber): kaki di titik slot, tinggi dari perspektif lokasi (lihat TokohLokasi) dikali
 * tinggi relatif tokoh (badan.tinggi / acuan), pusat kepala di x kaki.
 */
export function kotakBerdiri(t: TokohBerdiri, b: GambarTokoh & { tinggi: number }, kaki: { x: number; y: number }): Kotak {
  const h = (((kaki.y - t.cakrawala) * TINGGI_ORANG_M) / t.mata) * (b.tinggi / TINGGI_BADAN_ACUAN);
  const w = h * b.rasio;
  return { x: kaki.x - b.kepala.cx * w, y: kaki.y - h, w, h };
}

/** Satu lapisan berkedalaman di lokasi BERDIRI: benda (kendaraan) atau tokoh (gambar badan, atau siluet tanpa aset). */
export type LapisBerdiri =
  | { jenis: 'benda'; benda: BendaIlustrasi; kotak: Kotak; kedalaman: number }
  | { jenis: 'tokoh'; tokoh: TokohLatar; badan: (GambarTokoh & { tinggi: number }) | null; kotak: Kotak; kedalaman: number };

/**
 * Letak adegan lokasi BERDIRI (murni): tokoh hadir (maks. 3) di slot kakinya, benda lokasi, urut dari yang terjauh
 * (alas/kaki y kecil) ke terdekat, sehingga tokoh di depan truk menutupi truk dan sebaliknya. `subjek` = kotak yang
 * dibingkai kamera: tokoh, fokus benda, papan wajib, benda akibat keputusan yang tampil.
 * Gaya visual novel: saat ada yang BERBICARA, kamera mengikuti pembicara SETENGAH BADAN (`BINGKAI_BICARA` dari puncak
 * kepala), jadi wajah besar & terbaca; saat narasi, semua tokoh badan penuh (menapak, suasana lokasi).
 */
export const BINGKAI_BICARA = 0.6;
export function letakBerdiri(ep: Episode, lok: LokasiIlustrasi, k: Pick<KomposisiLatar, 'hadir' | 'objek'>): { lapis: LapisBerdiri[]; subjek: Kotak[]; bebasLabel: Kotak[]; bicara: boolean } {
  const t = lok.tokoh;
  if (t.jenis !== 'berdiri') return { lapis: [], subjek: [], bebasLabel: [], bicara: false };
  const n = Math.min(3, k.hadir.length) as 0 | 1 | 2 | 3;
  const slot = n ? t.slot[n] : [];
  const lapis: LapisBerdiri[] = (lok.benda ?? []).map((b) => ({ jenis: 'benda' as const, benda: b, kotak: b.kotak, kedalaman: b.alas }));
  k.hadir.slice(0, 3).forEach((tk, i) => {
    const kaki = slot[i]!;
    const badan = asetTokoh(ep, tk.id)?.badan ?? null;
    // Tanpa aset: siluet setinggi orang acuan di slot yang sama.
    const kotak = kotakBerdiri(t, badan ?? { varian: [], rasio: 0.36, kepala: { atas: 0, bawah: 0.15, cx: 0.5 }, tinggi: TINGGI_BADAN_ACUAN }, kaki);
    lapis.push({ jenis: 'tokoh', tokoh: tk, badan, kotak, kedalaman: kaki.y });
  });
  lapis.sort((a, b) => a.kedalaman - b.kedalaman);
  const bicara = k.hadir.slice(0, 3).some((x) => x.bicara);
  const objek = k.objek.flatMap((id) => {
    const o = lok.objek?.[id];
    const seni = o ? ep.seniArena?.[o.seni] : undefined;
    return o && seni ? [{ x: o.x, y: o.y, w: o.w, h: (o.w * seni.h) / seni.w }] : [];
  });
  const subjek = [
    // Saat ada yang berbicara, kamera mengikuti PEMBICARA saja (setengah badan); tokoh lain boleh di tepi/luar bingkai.
    ...lapis.flatMap((l) => (l.jenis === 'benda' ? [l.benda.fokus] : !bicara ? [l.kotak] : l.tokoh.bicara ? [{ ...l.kotak, h: l.kotak.h * BINGKAI_BICARA }] : [])),
    // Papan wajib dibingkai saat narasi (suasana lokasi); saat ada yang berbicara, kamera milik pembicara.
    ...(bicara ? [] : (lok.papan ?? []).filter((p) => p.wajib).map((p) => p.kotak)),
    ...objek,
  ];
  // Kepala tokoh yang dibingkai & tulisan papan wajib tidak boleh tertutup pita label di atas panggung.
  const bebasLabel = [...lapis.flatMap((l) => (l.jenis === 'tokoh' && (!bicara || l.tokoh.bicara) ? [l.kotak] : [])), ...(bicara ? [] : (lok.papan ?? []).filter((p) => p.wajib).map((p) => p.kotak))];
  return { lapis, subjek, bebasLabel, bicara };
}

/** Gabungan kotak (null bila kosong). */
export function gabungKotak(k: readonly Kotak[]): Kotak | null {
  if (!k.length) return null;
  const x0 = Math.min(...k.map((a) => a.x)), y0 = Math.min(...k.map((a) => a.y));
  const x1 = Math.max(...k.map((a) => a.x + a.w)), y1 = Math.max(...k.map((a) => a.y + a.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Ruang tepi subjek (piksel sumber): kiri-kanan, atas kepala, bawah kaki. */
export const RUANG_SUBJEK = { sisi: 36, atas: 24, bawah: 18 } as const;

/**
 * Potongan kamera yang MENGIKUTI SUBJEK (tokoh berdiri, fokus benda, papan wajib), bukan sekadar tengah gambar:
 * lebar = max(lebar minimum kelas layar, lebar subjek + ruang, tinggi subjek + ruang); selalu di dalam gambar.
 * `ruangBawahCss` = pita bawah yang tertutup kotak dialog yang menumpang ke panggung (subjek tetap di atasnya).
 * `ruangAtasCss` = tinggi pita label lokasi (px CSS) di atas panggung: kepala tokoh & tulisan papan wajib (`bebasLabel`)
 * tidak boleh berada di bawahnya (fokus benda boleh: atap truk di bawah label kecil tidak menghilangkan informasi). Bila subjek tidak muat sekalipun
 * seluruh gambar dipakai (kotak sangat lebar), bagian atas diutamakan; kaki yang terpotong. Tanpa subjek: potongan
 * bawaan kelas layar.
 */
export function potonganSubjek(lok: LokasiIlustrasi, wKotak: number, hKotak: number, subjek: readonly Kotak[], bebasLabel: readonly Kotak[], ruangAtasCss: number, ruangBawahCss = 0): Kotak {
  const u = gabungKotak(subjek);
  if (!u || !(wKotak > 0 && hKotak > 0)) return potonganIlustrasi(lok, wKotak, hKotak);
  const r = wKotak / hKotak;
  const b = lok.bingkai[kelasLayar(wKotak)];
  const pitaCss = Math.min(ruangAtasCss, hKotak * 0.5);
  const pitaBawahCss = Math.min(ruangBawahCss, hKotak * 0.3);
  const bawah = u.y + u.h + RUANG_SUBJEK.bawah;
  const atasSubjek = u.y - RUANG_SUBJEK.atas;
  const atasKepala = bebasLabel.length ? Math.min(...bebasLabel.map((k) => k.y)) - RUANG_SUBJEK.atas : Infinity;
  // Tinggi potongan H = W / r harus memuat (bawah - atasSubjek) + pita bawah dan (bawah - atasKepala) + pita atas + pita
  // bawah; pita = px CSS x W / wKotak, jadi W >= tinggi / (1/r - pita/wKotak).
  const sisa = (pitaPx: number) => (hKotak - pitaPx) / wKotak;
  const perluW = Math.max((bawah - atasSubjek) / sisa(pitaBawahCss), Number.isFinite(atasKepala) ? (bawah - atasKepala) / sisa(pitaCss + pitaBawahCss) : 0);
  let w = Math.min(Math.max(b.lebar, u.w + 2 * RUANG_SUBJEK.sisi, perluW), lok.w);
  let h = w / r;
  if (h > lok.h) { h = lok.h; w = h * r; }
  const pita = (pitaCss * w) / wKotak;
  const pitaBawah = (pitaBawahCss * w) / wKotak;
  const atasPerlu = Math.min(atasSubjek, atasKepala - pita);
  const lebih = h - (bawah + pitaBawah - atasPerlu);
  // Ruang lebih dibagi 40 % di atas, 60 % di bawah kaki; tidak cukup = bagian atas diutamakan.
  const y = Math.min(Math.max(lebih >= 0 ? atasPerlu - lebih * 0.4 : atasPerlu, 0), lok.h - h);
  const x = Math.min(Math.max(u.x + u.w / 2 - w / 2, 0), lok.w - w);
  return { x, y, w, h };
}
