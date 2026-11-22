/**
 * T-127 (babak 2, masukan Pak Peterson butir 12 dan 13): PILIH FORMATIF. Pemain MENAFSIRKAN satu bukti: sebuah pertanyaan, bukti
 * itu sendiri (gambar netral: tanpa nomor, tanpa centang), dan 2-3 bacaan untuk dipilih. Dipakai semua kasus babak 2
 * (KonfigInvestigasi.tafsir, cerita/tipe.ts); komponen ini tidak tahu kasusnya dan tidak menyimpan apa pun.
 *
 * Tanpa poin, tanpa waktu, tanpa akhir permainan. Umpan baliknya langsung:
 *   tepat             catatan hijau `benar`, tombol "Lanjut"
 *   keliru pertama    catatan kuning `salah(id)`: PENUNJUK ke sumbernya (bukan jawabannya); bingkai bukti berdenyut; pilihan itu
 *                     dipadamkan, yang lain tetap bisa dipilih. Pilihan ber-`hampir` (berhati-hati, tetapi sumbernya terbaca)
 *                     diberi label "Hampir", bukan "Belum tepat".
 *   keliru kedua      Miss Raksa menunjukkan PENJELASANnya (`alasan`), bukti digambar dengan bantuannya (`gambar(true)`), bacaan
 *                     yang tepat ditandai, lalu "Lanjut". Tidak ada percobaan ketiga.
 * `onSelesai(hasil)` dipanggil oleh tombol "Lanjut" (sekali); `onCoba(gugur)` tiap kekeliruan, supaya pemanggil bisa menyimpannya
 * sebagai draf kunjungan.
 * Papan ketik: pilihan = tombol biasa; catatan umpan balik = role="status". Satu tombol utama ("Lanjut"), baru ada sesudah selesai.
 * Ukur (hitung; team/HANDOFF.md "## T-127" dan "## T-130"): tanya 26..78 + bukti 196 + pilihan 54..78 + catatan 66..110 + tombol 56.
 *
 * T-130 (irisan kasus 2 + perbaikan tinjauan Codex T-131):
 *  - MUAT ULANG: `awal` = daftar id pilihan yang SUDAH ditolak (urut), bukan lagi hanya jumlahnya. Layar pulih persis: pilihan
 *    itu tetap padam dan penunjuk pilihan TERAKHIR tampil lagi (dua = keadaan dipandu). Draf lama berupa ANGKA (T-127) tetap
 *    diterima: jumlah kekeliruannya dipakai, tanpa penunjuk (id-nya tidak pernah tersimpan).
 *  - `gambar` opsional (pilihan tanpa bukti bergambar, mis. "dokumen apa yang kurang?"); `susun: 'kolom'` = pilihan bertumpuk
 *    selebar layar untuk kalimat panjang; `opsi[].gambar` = pilihan bergambar (slip waktu 96 x 68) dengan `ket` sebagai
 *    keterangan untuk pembaca layar; `hadiah` = gambar kecil di catatan sesudah selesai (dokumen yang diminta "datang").
 *
 * T-134 (tinjauan akhir Codex):
 *  - Draf = id yang ditolak DAN jumlah kekeliruan (`awal` berbentuk { gugur, jumlah }; `onCoba(gugur, jumlah)`). Dulu, draf lama
 *    berupa angka (satu kekeliruan tanpa id) ditambah satu kekeliruan baru hanya menyimpan id yang baru, jadi muat ulang kembali
 *    ke "satu kekeliruan" dan keadaan dipandu hilang. Sekarang jumlahnya ikut disimpan dan yang dipakai = yang terbesar.
 *  - `samping` = kartu kedua di samping pertanyaan (kasus 3: kartu kejadian berkalender 14 di samping foto bercap 03).
 */
import { useRef, useState, type ReactNode } from 'react';
import { playSfx } from '../../../audio/audio';
import { t } from '../../../i18n';
import { PotretReaksi } from './BukuCatatan';
import './investigasi.css';
import './ronde2.css';

export type HasilFormatif = 'first' | 'second' | 'guided';
export interface OpsiFormatif { id: string; teks: string; /** Gambar pilihan (slip); `teks` lalu menjadi nama aksesnya. */ gambar?: ReactNode; /** Keterangan gambar untuk pembaca layar. */ ket?: string }

/** Draf yang dipulihkan: id pilihan yang sudah ditolak (urut) dan jumlah kekeliruan (bisa lebih besar dari jumlah id: draf lama). */
export interface DrafFormatif { gugur: readonly string[]; jumlah: number }

export function PilihFormatif({ id, tanya, gambar, opsi, tepat, hampir = [], salah, alasan, benar, lanjut, awal = 0, onCoba, onSelesai, susun = 'baris', hadiah, samping }: {
  /** Id tafsir (kait data- untuk QA). */
  id: string;
  tanya: string;
  /**
   * Gambar buktinya; `jelas` true = dengan bantuan penjelasan (mis. nomor lajur), hanya sesudah keliru kedua. T-132: `selesai`
   * true = bacaan ini sudah dijawab (tepat atau dipandu): saat itulah penunjuk temuan (cincin kasus 3) boleh digambar.
   */
  gambar?: (jelas: boolean, selesai: boolean) => ReactNode;
  opsi: OpsiFormatif[];
  tepat: string;
  hampir?: readonly string[];
  /** Penunjuk sumber untuk pilihan keliru itu (kekeliruan pertama). */
  salah: (id: string) => string;
  /** Penjelasan (kekeliruan kedua). */
  alasan: string;
  /** Kalimat sesudah pilihan yang tepat. */
  benar: string;
  /** Label tombol lanjut. */
  lanjut: string;
  /** Draf sebelum muat ulang: id yang ditolak + jumlah kekeliruan. Angka = draf lama (hanya jumlahnya); larik = hanya id-nya. */
  awal?: number | readonly string[] | DrafFormatif;
  /** Tiap kekeliruan: id yang sudah ditolak dan JUMLAH kekeliruan sejauh ini (untuk disimpan sebagai draf kunjungan). */
  onCoba?: (gugur: string[], jumlah: number) => void;
  onSelesai: (hasil: HasilFormatif) => void;
  /** 'baris' = pilihan sebaris (bawaan); 'kolom' = bertumpuk selebar layar (kalimat panjang). */
  susun?: 'baris' | 'kolom';
  /** Gambar kecil di catatan sesudah selesai. */
  hadiah?: ReactNode;
  /** T-134: kartu kedua (gambar 96 x 68) di samping pertanyaan. */
  samping?: ReactNode;
}) {
  // Draf: hanya id yang memang pilihan keliru layar ini, paling banyak dua, tanpa ganda.
  const [awalGugur] = useState<string[]>(() => {
    const ids: readonly string[] = typeof awal === 'number' ? [] : Array.isArray(awal) ? (awal as readonly string[]) : (awal as DrafFormatif).gugur;
    return [...new Set(ids)].filter((x) => x !== tepat && opsi.some((o) => o.id === x)).slice(0, 2);
  });
  // Jumlah kekeliruan = yang terbesar dari jumlah tersimpan dan banyaknya id (draf lama: angka saja; draf T-130: id saja).
  const [keliru, setKeliru] = useState(() => {
    const n = typeof awal === 'number' ? awal : Array.isArray(awal) ? 0 : (awal as DrafFormatif).jumlah;
    return Math.max(awalGugur.length, Number.isFinite(n) ? Math.max(0, Math.min(2, Math.floor(n))) : 0);
  });
  /** Pilihan yang sudah dicoba dan keliru (dipadamkan). */
  const [gugur, setGugur] = useState<string[]>(awalGugur);
  const [terakhir, setTerakhir] = useState<string | null>(awalGugur.length ? awalGugur[awalGugur.length - 1]! : null);
  const [benarDipilih, setBenarDipilih] = useState(false);
  const sudah = useRef(false);
  const dipandu = keliru >= 2;
  const selesai = benarDipilih || dipandu;
  const pilih = (x: string) => {
    if (selesai || gugur.includes(x)) return;
    if (x === tepat) { playSfx('konfirmasi'); setBenarDipilih(true); setTerakhir(x); return; }
    playSfx('keliru');
    const baru = [...gugur, x];
    setKeliru(keliru + 1); setGugur(baru); setTerakhir(x);
    onCoba?.(baru, keliru + 1);
  };
  const hasil: HasilFormatif = dipandu ? 'guided' : keliru === 1 ? 'second' : 'first';
  // Draf lama berupa angka: pilihan yang keliru tadi tidak diketahui, jadi layarnya netral (hasil tetap 'second').
  const keadaan = benarDipilih ? 'tepat' : dipandu ? 'dipandu' : keliru === 1 && terakhir ? (hampir.includes(terakhir) ? 'hampir' : 'keliru') : 'awal';
  return (
    <section className="iv-layar pf" data-pilih-formatif={id} data-keadaan={keadaan} data-susun={susun} aria-labelledby="pf-tanya">
      {samping ? (
        <div className="pf-kepala" data-bersamping="">
          <h2 id="pf-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tanya}</h2>
          <span className="pf-samping">{samping}</span>
        </div>
      ) : <h2 id="pf-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tanya}</h2>}
      {gambar ? <div className="pf-gambar" data-tunjuk={keadaan === 'keliru' || keadaan === 'hampir' ? '' : undefined}>{gambar(dipandu, selesai)}</div> : null}
      <div className="pf-opsi" role="group" aria-labelledby="pf-tanya" data-jumlah={opsi.length} data-bergambar={opsi.some((o) => o.gambar) ? '' : undefined}>
        {opsi.map((o) => {
          const jawab = selesai && o.id === tepat;
          return (
            <button key={o.id} type="button" className="pf-pilih" data-opsi={o.id} data-jawab={jawab ? '' : undefined} data-gugur={gugur.includes(o.id) ? '' : undefined}
              aria-pressed={jawab} aria-label={o.gambar ? `${o.teks}${o.ket ? `: ${o.ket}` : ''}` : undefined} disabled={selesai || gugur.includes(o.id)} onClick={() => pilih(o.id)}>
              {o.gambar ?? o.teks}{jawab ? <span className="pf-centang" aria-hidden="true"> ✓</span> : null}
            </button>
          );
        })}
      </div>
      <div className="pf-catatan" role="status">
        {keadaan === 'awal' ? <p className="iv-label">{t('investigasi.formatif.pilih')}</p> : null}
        {keadaan === 'keliru' || keadaan === 'hampir' ? (
          <p className="iv-tempel pf-tempel"><b>{t(keadaan === 'hampir' ? 'investigasi.formatif.hampir' : 'investigasi.formatif.sumber')}</b>{terakhir ? salah(terakhir) : ''}</p>
        ) : null}
        {keadaan === 'dipandu' ? (
          <p className="iv-tempel iv-pandu pf-tempel" data-berhadiah={hadiah ? '' : undefined}>{hadiah ?? <PotretReaksi reaksi="miss-berpikir" ukuran={48} />}<span><b>{t('investigasi.formatif.penjelasan')}</b>{alasan}</span></p>
        ) : null}
        {keadaan === 'tepat' ? (
          hadiah
            ? <p className="iv-tempel iv-pandu pf-tempel" data-tepat="" data-berhadiah="">{hadiah}<span><b>{t('investigasi.formatif.tepat')}</b>{benar}</span></p>
            : <p className="iv-tempel pf-tempel" data-tepat=""><b>{t('investigasi.formatif.tepat')}</b>{benar}</p>
        ) : null}
      </div>
      {selesai ? (
        <button type="button" className="primary-action iv-tombol" data-pf-lanjut="" onClick={() => { if (sudah.current) return; sudah.current = true; onSelesai(hasil); }}>{lanjut}</button>
      ) : null}
    </section>
  );
}
