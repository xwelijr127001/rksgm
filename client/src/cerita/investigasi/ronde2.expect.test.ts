import test from 'node:test';
import { EPISODE_AUTO_2_INV } from '../episode/auto-2-inv/episode';
import { EPISODE_AUTO_2_INV_2 } from '../episode/auto-2-inv-2/episode';
import { EPISODE_AUTO_2_INV_3 } from '../episode/auto-2-inv-3/episode';
import { jelajahiSemuaJalur } from '../validasi';
import { hasilKasusLengkap, naskahPesan, punyaRagam, ragamRekaman, semuaPress, tandaCatat, tandaKeberatan, tandaPanel, tandaPanelKeliru, tandaPesan, tandaPutusan, tandaTafsir, tandaTekan, KE_HASIL_KEBERATAN, HASIL_KEBERATAN } from './status';
import { rincianBabak, skorKasusLengkap, titikTerlemah } from './skor';
import { KASUS_TERSEDIA, pangkatRekaman, TOTAL_MAKS } from './simpan';
import type { RoundOutcome } from '@shared/investigator/rubric';

// Peterson rounds 1-2 (T-136): path walk of cases 1-2, score table with and without formative marks, message wording by ragam.
// Update: tsx --tsconfig client/tsconfig.json --test --test-update-snapshots client/src/cerita/investigasi/ronde2.expect.test.ts
const EPS = { 'kasus-1': EPISODE_AUTO_2_INV!, 'kasus-2': EPISODE_AUTO_2_INV_2!, 'kasus-3': EPISODE_AUTO_2_INV_3! };

test('path walk of cases 1 and 2', (t) => {
  const hasil: Record<string, unknown> = {};
  for (const k of ['kasus-1', 'kasus-2'] as const) { const j = jelajahiSemuaJalur(EPS[k]); hasil[k] = { jalur: j.jalur, akhir: j.akhir, masalah: j.masalah, keadaan: j.keadaan }; }
  t.assert.snapshot(hasil);
});

test('score table: perfect, all guided, with every formative mark', (t) => {
  const tabel: Record<string, unknown> = {};
  let totalSempurna = 0;
  for (const [kasus, ep] of Object.entries(EPS)) {
    const k = ep.investigasi!;
    const putusanBest = Object.entries(k.putusan).sort((a, b) => b[1] - a[1])[0]![0] as 'layak';
    const babakId = k.panel?.rounds.map((r) => r.id) ?? ['keberatan'];
    const formatif = [
      ...k.pernyataan.map((p) => tandaCatat(p.id)),
      ...k.pernyataan.flatMap((p) => semuaPress(p).map((x) => tandaTekan(p.id, x.id))),
      ...(k.tafsir ?? []).map((x) => tandaTafsir(x.id)),
      ...(k.panel?.rounds ?? []).flatMap((r) => [0, 1].map((n) => tandaPanelKeliru(r.id, n as 0 | 1, r.evidenceIds.find((e) => !r.acceptedIds.includes(e))!))),
    ];
    const lari = (o: RoundOutcome, tambah: string[]) => {
      const bab = k.panel ? babakId.map((id) => tandaPanel(id, o)) : [tandaKeberatan(KE_HASIL_KEBERATAN[o])];
      const h = hasilKasusLengkap(ep, { tanda: [...bab, tandaPutusan(putusanBest), tandaPesan('baik'), ...tambah] })!;
      const s = skorKasusLengkap(k, h)!;
      return { babak: h.babak, skor: s, rincian: rincianBabak(k, h.babak), terlemah: titikTerlemah(k, h) };
    };
    const sempurna = lari('first', []), terpandu = lari('guided', []), denganTanda = lari('first', formatif);
    totalSempurna += sempurna.skor.total;
    tabel[kasus] = { perfect: sempurna, guided: terpandu, perfectDenganTandaFormatif: denganTanda, formatifTandaTidakMengubah: JSON.stringify(sempurna) === JSON.stringify(denganTanda), jumlahTandaFormatif: formatif.length, hasilKeberatan: HASIL_KEBERATAN.length };
  }
  tabel['seri'] = { totalSempurna, TOTAL_MAKS, KASUS_TERSEDIA, pangkatSempurna: pangkatRekaman({ terbaik: Object.fromEntries(KASUS_TERSEDIA.map((k) => [k, 100])), stempel: [...KASUS_TERSEDIA] }) };
  t.assert.snapshot(tabel);
});

test('message wording id by ragam (case 3 janji)', (t) => {
  const k = EPISODE_AUTO_2_INV_3!.investigasi!;
  const ragamTanda = k.pesanRagam!.janji!.tanda;
  const lama = naskahPesan(k, 'janji', ragamRekaman(undefined)); // legacy record without ragam
  const baru = naskahPesan(k, 'janji', ragamRekaman(k.pesanRagam!.janji!.id));
  const state = (tanda: string[]) => naskahPesan(k, 'janji', punyaRagam({ tanda }));
  t.assert.snapshot({ catatanLama: lama, ragamBaru: baru, stateLama: state([tandaPesan('janji')]), stateBaru: state([tandaPesan('janji'), ragamTanda]), baikTidakBerubah: naskahPesan(k, 'baik', ragamRekaman(k.pesanRagam!.janji!.id)) });
});
