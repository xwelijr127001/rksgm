/**
 * T-127 (babak 2, masukan Pak Peterson butir 12 dan 13): PILIH FORMATIF. Pemain MENAFSIRKAN satu bukti: sebuah pertanyaan, bukti
 * itu sendiri (gambar netral: tanpa nomor, tanpa centang), dan 2-3 bacaan untuk dipilih. Dipakai semua kasus babak 2
 * (KonfigInvestigasi.tafsir, cerita/tipe.ts); komponen ini tidak tahu kasusnya dan tidak menyimpan apa pun.
 *
 * Tanpa poin, tanpa waktu, tanpa akhir permainan. Umpan baliknya langsung (T-139: pilihan keliru TIDAK PERNAH menyelesaikan layar
 * dan jawabannya tidak pernah ditunjukkan; layar baru selesai saat pemain sendiri memilih bacaan yang tepat):
 *   tepat             catatan hijau `benar`, tombol "Lanjut"
 *   keliru pertama    catatan kuning `salah(id)`: PENUNJUK ke sumbernya (bukan jawabannya); bingkai bukti berdenyut; pilihan itu
 *                     dipadamkan dan berlabel "sudah dicoba", yang lain tetap bisa dipilih. Pilihan ber-`hampir` (berhati-hati,
 *                     tetapi sumbernya terbaca) diberi label "Hampir", bukan "Belum tepat".
 *   keliru kedua dst. catatan kuning `lagi`: penunjuk yang LEBIH KUAT ke tempat melihat (tetap bukan jawabannya); pilihan itu juga
 *                     dipadamkan. Pemain memilih lagi.
 *   tepat sesudah dua kekeliruan atau lebih: PENJELASAN Miss Raksa (`alasan`) tampil SESUDAH pilihan yang tepat itu, bukti digambar
 *                     dengan bantuannya (`gambar(true)`), lalu "Lanjut". Hasilnya 'guided', sama dengan hasil "dipandu" yang lama.
 * `onSelesai(hasil)` dipanggil oleh tombol "Lanjut" (sekali); `onCoba(gugur, jumlah)` tiap kekeliruan, supaya pemanggil bisa
 * menyimpannya sebagai draf kunjungan.
 * Papan ketik: pilihan = tombol biasa; catatan umpan balik = role="status". Satu tombol utama ("Lanjut"), baru ada sesudah selesai.
 * Ukur (hitung; team/HANDOFF.md "## T-127", "## T-130" dan "## T-139"): tanya 26..78 + bukti 196 + pilihan 52..78 + catatan 66..110 + tombol 56.
 *
 * T-130 (irisan kasus 2 + perbaikan tinjauan Codex T-131):
 *  - MUAT ULANG: draf = daftar id pilihan yang SUDAH ditolak (urut). Layar pulih persis: pilihan itu tetap padam dan penunjuk
 *    pilihan TERAKHIR tampil lagi.
 *  - `gambar` opsional (pilihan tanpa bukti bergambar, mis. "dokumen apa yang kurang?"); `susun: 'kolom'` = pilihan bertumpuk
 *    selebar layar untuk kalimat panjang; `opsi[].gambar` = pilihan bergambar (slip waktu 96 x 68) dengan `ket` sebagai
 *    keterangan untuk pembaca layar; `hadiah` = gambar kecil di catatan sesudah selesai (dokumen yang diminta "datang").
 *
 * T-134 (tinjauan akhir Codex):
 *  - Draf = id yang ditolak DAN jumlah kekeliruan (`awal` berbentuk { gugur, jumlah }; `onCoba(gugur, jumlah)`).
 *  - `samping` = kartu kedua di samping pertanyaan (kasus 3: kartu kejadian berkalender 14 di samping foto bercap 03).
 *
 * T-139:
 *  - `awal.terungkap` = draf dari ATURAN LAMA yang sudah dua kali keliru: saat itu jawabannya sudah ditunjukkan dan layarnya
 *    tinggal menunggu "Lanjut". Draf seperti itu dipulihkan sebagai layar SELESAI (jawaban bertanda, penjelasan, "Lanjut", hasil
 *    'guided'): langkah yang sudah selesai tidak dibuka lagi. Draf aturan baru dengan dua kekeliruan atau lebih = layar terbuka.
 *  - tanda centang pilihan yang tepat kini SEBARIS dengan tulisannya (dulu anak kisi tersendiri = baris kedua di dalam tombol).
 */
import { useRef, useState, type ReactNode } from 'react';
import { playSfx } from '../../../audio/audio';
import { t } from '../../../i18n';
import { PotretReaksi } from './BukuCatatan';
import './investigasi.css';
import './ronde2.css';

export type HasilFormatif = 'first' | 'second' | 'guided';
export interface OpsiFormatif { id: string; teks: string; /** Gambar pilihan (slip); `teks` lalu menjadi nama aksesnya. */ gambar?: ReactNode; /** Keterangan gambar untuk pembaca layar. */ ket?: string }

/**
 * Draf yang dipulihkan: id pilihan yang sudah ditolak (urut) dan jumlah kekeliruan (bisa lebih besar dari jumlah id: draf lama
 * berupa angka). T-139: `terungkap` = draf aturan lama yang jawabannya SUDAH ditunjukkan (dua kekeliruan): pulih sebagai selesai.
 */
export interface DrafFormatif { gugur: readonly string[]; jumlah: number; terungkap?: boolean }

export function PilihFormatif({ id, tanya, gambar, opsi, tepat, hampir = [], salah, lagi, alasan, benar, lanjut, awal, onCoba, onSelesai, susun = 'baris', hadiah, samping }: {
  /** Id tafsir (kait data- untuk QA). */
  id: string;
  tanya: string;
  /**
   * Gambar buktinya; `jelas` true = dengan bantuan penjelasan (mis. nomor lajur): T-139 hanya SESUDAH pemain memilih yang tepat
   * pada percobaan ketiga atau lebih (atau draf lama yang sudah terungkap). T-132: `selesai` true = bacaan ini sudah dijawab:
   * saat itulah penunjuk temuan (cincin kasus 3) boleh digambar.
   */
  gambar?: (jelas: boolean, selesai: boolean) => ReactNode;
  opsi: OpsiFormatif[];
  tepat: string;
  hampir?: readonly string[];
  /** Penunjuk sumber untuk pilihan keliru itu (kekeliruan pertama). */
  salah: (id: string) => string;
  /** T-139: penunjuk yang lebih kuat ke tempat melihat (kekeliruan kedua dan seterusnya); tanpa nilai = `salah(id)` pilihan itu. */
  lagi?: string;
  /** Penjelasan: tampil SESUDAH pilihan yang tepat bila pemain keliru dua kali atau lebih. */
  alasan: string;
  /** Kalimat sesudah pilihan yang tepat. */
  benar: string;
  /** Label tombol lanjut. */
  lanjut: string;
  /** Draf sebelum muat ulang: id yang ditolak + jumlah kekeliruan (+ `terungkap` untuk draf aturan lama). */
  awal?: DrafFormatif;
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
  // Draf: hanya id yang memang pilihan keliru layar ini, tanpa ganda.
  const [awalGugur] = useState<string[]>(() => [...new Set(awal?.gugur ?? [])].filter((x) => x !== tepat && opsi.some((o) => o.id === x)));
  // Jumlah kekeliruan = yang terbesar dari jumlah tersimpan dan banyaknya id (draf lama: angka saja; draf T-130: id saja).
  const [keliru, setKeliru] = useState(() => {
    const n = awal?.jumlah ?? 0;
    return Math.max(awalGugur.length, Number.isFinite(n) ? Math.max(0, Math.min(99, Math.floor(n))) : 0);
  });
  /** T-139: draf aturan lama yang jawabannya sudah ditunjukkan: layar ini sudah selesai (tinggal "Lanjut"). */
  const [terungkap] = useState(() => !!awal?.terungkap);
  /** Pilihan yang sudah dicoba dan keliru (dipadamkan, berlabel "sudah dicoba"). */
  const [gugur, setGugur] = useState<string[]>(awalGugur);
  const [terakhir, setTerakhir] = useState<string | null>(awalGugur.length ? awalGugur[awalGugur.length - 1]! : null);
  const [benarDipilih, setBenarDipilih] = useState(false);
  const sudah = useRef(false);
  const selesai = benarDipilih || terungkap;
  /** Dua kekeliruan atau lebih (atau draf lama yang terungkap): penjelasan + bantuan gambar, hasil 'guided'. Hanya sesudah selesai. */
  const berpenjelasan = terungkap || keliru >= 2;
  const pilih = (x: string) => {
    if (selesai || gugur.includes(x)) return;
    if (x === tepat) { playSfx('konfirmasi'); setBenarDipilih(true); setTerakhir(x); return; }
    // T-139: keliru = peringatan + coba lagi, berapa kali pun; pilihan itu dipadamkan supaya tidak diulang.
    playSfx('keliru');
    const baru = [...gugur, x];
    setKeliru(keliru + 1); setGugur(baru); setTerakhir(x);
    onCoba?.(baru, keliru + 1);
  };
  const hasil: HasilFormatif = berpenjelasan ? 'guided' : keliru === 1 ? 'second' : 'first';
  // Draf lama berupa angka: pilihan yang keliru tadi tidak diketahui, jadi layarnya netral (hasil tetap dihitung dari jumlahnya).
  // 'dipandu' = selesai dengan penjelasan (nama lama dipertahankan untuk kait QA); 'keliru-lagi' = kekeliruan kedua dan seterusnya.
  const keadaan = selesai ? (berpenjelasan ? 'dipandu' : 'tepat')
    : keliru === 0 || !terakhir ? 'awal'
      : keliru >= 2 ? 'keliru-lagi' : hampir.includes(terakhir) ? 'hampir' : 'keliru';
  const labelDicoba = t('investigasi.dicoba');
  return (
    <section className="iv-layar pf" data-pilih-formatif={id} data-keadaan={keadaan} data-keliru={keliru} data-susun={susun} aria-labelledby="pf-tanya">
      {samping ? (
        <div className="pf-kepala" data-bersamping="">
          <h2 id="pf-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tanya}</h2>
          <span className="pf-samping">{samping}</span>
        </div>
      ) : <h2 id="pf-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{tanya}</h2>}
      {gambar ? <div className="pf-gambar" data-tunjuk={keadaan === 'keliru' || keadaan === 'hampir' || keadaan === 'keliru-lagi' ? '' : undefined}>{gambar(selesai && berpenjelasan, selesai)}</div> : null}
      <div className="pf-opsi" role="group" aria-labelledby="pf-tanya" data-jumlah={opsi.length} data-bergambar={opsi.some((o) => o.gambar) ? '' : undefined}>
        {opsi.map((o) => {
          const jawab = selesai && o.id === tepat;
          const dicoba = gugur.includes(o.id);
          const nama = `${o.teks}${o.gambar && o.ket ? `: ${o.ket}` : ''}${dicoba ? ` (${labelDicoba})` : ''}`;
          return (
            <button key={o.id} type="button" className="pf-pilih" data-opsi={o.id} data-jawab={jawab ? '' : undefined} data-gugur={dicoba ? '' : undefined}
              aria-pressed={jawab} aria-label={o.gambar || dicoba ? nama : undefined} disabled={selesai || dicoba} onClick={() => pilih(o.id)}>
              {o.gambar ? (
                <>{o.gambar}{jawab ? <span className="pf-centang" aria-hidden="true"> ✓</span> : null}{dicoba ? <i className="iv-cap-dicoba" aria-hidden="true">{labelDicoba}</i> : null}</>
              ) : (
                <><span className="pf-teks">{o.teks}{jawab ? <span aria-hidden="true"> ✓</span> : null}</span>{dicoba ? <small className="pf-dicoba" aria-hidden="true">{labelDicoba}</small> : null}</>
              )}
            </button>
          );
        })}
      </div>
      <div className="pf-catatan" role="status">
        {keadaan === 'awal' ? <p className="iv-label">{t('investigasi.formatif.pilih')}</p> : null}
        {keadaan === 'keliru' || keadaan === 'hampir' ? (
          <p className="iv-tempel pf-tempel"><b>{t(keadaan === 'hampir' ? 'investigasi.formatif.hampir' : 'investigasi.formatif.sumber')}</b>{terakhir ? salah(terakhir) : ''}</p>
        ) : null}
        {keadaan === 'keliru-lagi' ? (
          <p key={keliru} className="iv-tempel pf-tempel" data-lagi=""><b>{t('investigasi.formatif.lagi')}</b>{lagi ?? (terakhir ? salah(terakhir) : '')}</p>
        ) : null}
        {keadaan === 'dipandu' ? (
          <p className="iv-tempel iv-pandu pf-tempel" data-tepat={benarDipilih ? '' : undefined} data-berhadiah={hadiah ? '' : undefined}>{hadiah ??<PotretReaksi reaksi="miss-berpikir" ukuran={48} />}<span><b>{t('investigasi.formatif.penjelasan')}</b>{alasan}</span></p>
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
