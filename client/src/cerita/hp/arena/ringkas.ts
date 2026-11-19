/**
 * Ringkasan satu kalimat TINDAKAN pemain dari susunan arena (umpan balik tindakan di kartu adegan sesudah aktivitas
 * tatap muka): apa yang baru dilakukan, bukan penilaiannya. Pesan ke nasabah (obrolan) memakai DefAktivitas.pesanObrolan.
 */
import type { MissionAnswer } from '@shared/types';
import type { Episode, KunciTeks } from '../../tipe';
import { petaLangkah } from './logika';
import { ringkasTanda } from './rambu';

export function ringkasTindakan(ep: Episode, idAktivitas: string, jawaban: MissionAnswer | undefined, tx: (k: KunciTeks, p?: Record<string, string | number>) => string): string | null {
  const k = ep.aktivitas[idAktivitas]?.arena;
  if (!k || !jawaban) return null;
  switch (k.pola) {
    case 'tujuan': {
      const tj = k.tujuan.find((x) => x.id === petaLangkah(jawaban, k.langkah)[k.benda.id]);
      return tj ? `${tx(k.benda.nama ?? k.benda.id)} → ${tx(tj.label)}` : null;
    }
    case 'susun': {
      const p = petaLangkah(jawaban, k.langkah);
      return k.wadah
        .map((w) => ({ w, isi: k.benda.filter((b) => p[b.id] === w.id).map((b) => tx(b.nama ?? b.id)) }))
        .filter((x) => x.isi.length)
        .map((x) => `${tx(x.w.label)}${tx('daftar.titikDua')}${x.isi.join(tx('daftar.pemisah'))}`)
        .join(tx('daftar.antarKalimat'));
    }
    case 'bandingkan': {
      const p = petaLangkah(jawaban, k.langkah);
      const hitung = new Map<string, number>();
      for (const s of k.selisih) if (p[s.id]) hitung.set(p[s.id]!, (hitung.get(p[s.id]!) ?? 0) + 1);
      return k.perlakuan.filter((x) => hitung.has(x.id)).map((x) => `${tx(x.label)} (${hitung.get(x.id)})`).join(tx('daftar.pemisah'));
    }
    // Bundel: baris akibatnya sendiri menyebut tindakan berkas & kabar (berlabel topik), jadi tanpa ringkasan terpisah.
    case 'bundel':
      return null;
    case 'pesan':
      return null;
    // Rambu: tanda yang dibuat pemain di jalan (apa yang dilakukan, bukan penilaiannya); tanggapan tokoh tampil di adegan akibat.
    case 'rambu':
      return ringkasTanda(k, jawaban, tx);
    // T-022: satu kalimat hasil pemeriksaan SIM (tanpa ketukan keliru / dengan arahan Pak Bima).
    case 'sim': {
      const w = petaLangkah(jawaban, k.langkah)[k.benda];
      return w ? tx(w === k.ragu ? 'akt.sim.wadah.ragu' : 'akt.sim.wadah.bersih') : null;
    }
    case 'dashcam': {
      // T-064 (Episode 1 Dev): mobil on the first tap = bersih; otherwise ragu.
      const w = petaLangkah(jawaban, k.langkah)[k.item];
      return w ? tx(w === k.ragu ? 'akt.dashcam.wadah.ragu' : 'akt.dashcam.wadah.bersih') : null;
    }
  }
}
