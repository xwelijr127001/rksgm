/**
 * Halaman host: "Soal acara ini".
 *  - Playlist room (urutan soal) diatur di sini TANPA coding: pilih cepat paket, naik/turun,
 *    lepas, tambah dari bank. Tiap perubahan langsung dikirim lewat socket `host:playlist` dan
 *    statusnya (menyimpan / tersimpan / belum tersimpan) selalu terlihat di kepala bagian.
 *  - Soal buatan panitia (gambar desainer + pertanyaan): daftar, ubah, hapus, dan editor.
 *  - Setelah pertandingan mulai bagian ini hanya-baca (server pun hanya menerima saat LOBBY).
 *
 * Tahan galat: bila server belum punya API bank / event playlist, bagian ini hanya menampilkan
 * pesan ramah; kendali pertandingan di Host.tsx tidak tersentuh.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BATAS_PLAYLIST, type BankSoal, type IdPaket, type RingkasSoal, type SoalKustom } from '@shared/bankSoal';
import { PHASE_DURATIONS } from '@shared/brand';
import type { Phase, RoomPublicState } from '@shared/types';
import { Icon } from '../../art/Icon';
import { t, useBahasa } from '../../i18n';
import { terjemahkanGalat } from '../../i18n/galat';
import { ambilBank, ambilSoal, hapusSoal, pesanGalatBank, pinSalah, useKonfigBank, type GagalBank } from '../../state/bank';
import { actions, lupakanPin, savedPin, useGame } from '../../state/store';
import { Modal, Pesan } from '../../ui/kit';
import { EditorSoal } from './EditorSoal';
import { LencanaAsal, LencanaProduk, LencanaTingkat, judulSoal } from './lencana';
import { PinPanitia } from './PinPanitia';
import './bank.css';

type StatusSimpan = { jenis: 'diam' | 'menyimpan' | 'tersimpan' } | { jenis: 'galat'; pesan: string };

const FASE_MAIN: Phase[] = ['BRIEFING', 'ACTIVE', 'REVEAL', 'LEADERBOARD'];
const DURASI_TAK_DIKENAL = 60;

function samaUrutan(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

/** Perkiraan lama pertandingan: waktu menjawab + briefing, pembahasan, dan papan peringkat tiap ronde. */
function perkiraanMenit(playlist: string[], peta: Map<string, RingkasSoal>): number {
  const jeda = (PHASE_DURATIONS.briefingMs + PHASE_DURATIONS.revealMs + PHASE_DURATIONS.leaderboardMs) / 1000;
  const detik = playlist.reduce((n, id) => n + (peta.get(id)?.durasi ?? DURASI_TAK_DIKENAL) + jeda, 0);
  return Math.max(1, Math.round(detik / 60));
}

function InfoSoal({ r }: { r: RingkasSoal }) {
  return (
    <span className="bank-meta">
      <LencanaProduk produk={r.produk} />
      <LencanaTingkat tingkat={r.tingkat} />
      <LencanaAsal asal={r.asal} />
      <span>{t('bank.infoSoal', { langkah: r.langkah, detik: r.durasi })}</span>
    </span>
  );
}

export function AturSoal({ room }: { room: RoomPublicState }) {
  const { bahasa } = useBahasa();
  const { status } = useGame();
  const konfig = useKonfigBank();

  const [buka, setBuka] = useState(false);
  const [bank, setBank] = useState<BankSoal | null>(null);
  const [galatBank, setGalatBank] = useState<GagalBank | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [playlist, setPlaylist] = useState<string[] | null>(null);
  const [galatPlaylist, setGalatPlaylist] = useState<string | null>(null);
  const [simpan, setSimpan] = useState<StatusSimpan>({ jenis: 'diam' });
  const [umumkan, setUmumkan] = useState('');
  const [pemilih, setPemilih] = useState(false);
  const [akanGanti, setAkanGanti] = useState<IdPaket | null>(null);

  // soal kustom
  const [editor, setEditor] = useState<{ soal: SoalKustom | null } | null>(null);
  const [membuka, setMembuka] = useState<string | null>(null);
  const [akanDihapus, setAkanDihapus] = useState<RingkasSoal | null>(null);
  const [pesanKustom, setPesanKustom] = useState<{ jenis: 'sukses' | 'kuning' | 'error'; teks: string } | null>(null);
  const [pinDitolak, setPinDitolak] = useState(false);
  const [, setVersiPin] = useState(0);

  const terkonfirmasi = useRef<string[] | null>(null);
  const urutanKirim = useRef(0);
  const rondeTerbaca = useRef<number | null>(null);

  const bisaUbah = room.phase === 'LOBBY';
  const fase: Phase = room.phase === 'PAUSED' ? (room.prevPhase ?? 'LOBBY') : room.phase;
  const sedangMain = FASE_MAIN.includes(fase);
  const butuhPin = konfig?.butuhPin === true;
  const pinKurang = butuhPin && (!savedPin() || pinDitolak);

  const peta = useMemo(() => new Map((bank?.soal ?? []).map((r) => [r.id, r])), [bank]);

  const muatBank = useCallback(async () => {
    const h = await ambilBank();
    if (h.ok) {
      setBank(h.data);
      setGalatBank(null);
    } else {
      setGalatBank(h);
    }
    return h.ok;
  }, []);

  const bacaPlaylist = useCallback(async () => {
    const h = await actions.hostPlaylist();
    if (h.ok && h.playlist) {
      terkonfirmasi.current = h.playlist;
      setPlaylist(h.playlist);
      setGalatPlaylist(null);
    } else {
      setGalatPlaylist(h.error ?? '');
    }
    return h.ok;
  }, []);

  const muatSemua = useCallback(async () => {
    setMemuat(true);
    await Promise.all([muatBank(), bacaPlaylist()]);
    setMemuat(false);
  }, [muatBank, bacaPlaylist]);

  // Muat saat room terpasang dan setiap kali koneksi pulih (server adalah sumber kebenaran).
  const tersambung = status === 'connected';
  useEffect(() => {
    if (!tersambung) return;
    rondeTerbaca.current = null;
    void muatSemua();
  }, [room.code, tersambung, muatSemua]);

  // Jumlah ronde berubah di server (tab host lain, reset): baca ulang sekali per nilai.
  useEffect(() => {
    if (!playlist || simpan.jenis === 'menyimpan') return;
    if (room.totalRounds === playlist.length || rondeTerbaca.current === room.totalRounds) return;
    rondeTerbaca.current = room.totalRounds;
    void bacaPlaylist();
  }, [room.totalRounds, playlist, simpan.jenis, bacaPlaylist]);

  /** Kirim playlist baru. Tampil dulu (optimistis); bila server menolak, kembali ke yang tersimpan. */
  const kirim = useCallback(async (berikut: string[]): Promise<boolean> => {
    setPlaylist(berikut);
    setSimpan({ jenis: 'menyimpan' });
    const no = ++urutanKirim.current;
    const h = await actions.hostPlaylist(berikut);
    if (h.ok && h.playlist) terkonfirmasi.current = h.playlist;
    if (no !== urutanKirim.current) return h.ok; // ada kiriman yang lebih baru: hasilnya yang menentukan
    if (h.ok && h.playlist) {
      setPlaylist(h.playlist);
      setSimpan({ jenis: 'tersimpan' });
    } else {
      setPlaylist(terkonfirmasi.current);
      setSimpan({ jenis: 'galat', pesan: terjemahkanGalat(h.error) || t('bank.galat.jaringan') });
    }
    return h.ok;
  }, []);

  const namaSoal = (id: string): string => {
    const r = peta.get(id);
    return r ? judulSoal(r, bahasa) : t('bank.soalTanpaInfo', { id });
  };

  const pindah = (indeks: number, arah: -1 | 1) => {
    if (!playlist || !bisaUbah) return;
    const tujuan = indeks + arah;
    if (tujuan < 0 || tujuan >= playlist.length) return;
    const berikut = [...playlist];
    const id = berikut[indeks]!;
    berikut[indeks] = berikut[tujuan]!;
    berikut[tujuan] = id;
    setUmumkan(t('bank.pindahInfo', { judul: namaSoal(id), n: tujuan + 1 }));
    void kirim(berikut);
    // Fokus tetap di soal yang dipindah; bila tombol arah itu jadi nonaktif (ujung daftar), pakai arah sebaliknya.
    requestAnimationFrame(() => {
      const sama = document.getElementById(`bank-${arah < 0 ? 'naik' : 'turun'}-${id}`) as HTMLButtonElement | null;
      const lain = document.getElementById(`bank-${arah < 0 ? 'turun' : 'naik'}-${id}`) as HTMLButtonElement | null;
      (sama && !sama.disabled ? sama : lain)?.focus();
    });
  };

  const lepas = (indeks: number) => {
    if (!playlist || !bisaUbah || playlist.length <= BATAS_PLAYLIST.min) return;
    const id = playlist[indeks]!;
    setUmumkan(t('bank.lepasInfo', { judul: namaSoal(id) }));
    void kirim(playlist.filter((_, i) => i !== indeks));
  };

  const tambah = async (id: string): Promise<{ ok: boolean; posisi?: number }> => {
    const kini = playlist ?? [];
    if (!bisaUbah || kini.includes(id) || kini.length >= BATAS_PLAYLIST.maks) return { ok: false };
    setUmumkan(t('bank.tambahInfo', { judul: namaSoal(id), n: kini.length + 1 }));
    const ok = await kirim([...kini, id]);
    return { ok, posisi: kini.length + 1 };
  };

  const paketKini: IdPaket | null = useMemo(() => {
    if (!bank || !playlist) return null;
    if (bank.paket.acara.length > 0 && samaUrutan(playlist, bank.paket.acara)) return 'acara';
    if (bank.paket.latihan.length > 0 && samaUrutan(playlist, bank.paket.latihan)) return 'latihan';
    return null;
  }, [bank, playlist]);

  const pilihPaket = (paket: IdPaket) => {
    if (!bank || !playlist || !bisaUbah || paketKini === paket) return;
    // Daftar racikan sendiri: tanya dulu, karena urutan yang sudah disusun akan diganti.
    if (paketKini === null) setAkanGanti(paket);
    else void kirim(bank.paket[paket].slice(0, BATAS_PLAYLIST.maks));
  };

  // ---------------------------------------------------------------- soal kustom

  const galatApi = (g: GagalBank) => {
    if (butuhPin && pinSalah(g)) {
      lupakanPin();
      setPinDitolak(true);
    }
    setPesanKustom({ jenis: 'error', teks: pesanGalatBank(g) });
  };

  const bukaUbah = async (r: RingkasSoal) => {
    setPesanKustom(null);
    setMembuka(r.id);
    const h = await ambilSoal(r.id);
    setMembuka(null);
    if (h.ok) setEditor({ soal: h.data });
    else galatApi(h);
  };

  const mintaHapus = (r: RingkasSoal) => {
    setPesanKustom(null);
    const diPlaylist = playlist?.includes(r.id) ?? false;
    if (diPlaylist && !bisaUbah) return setPesanKustom({ jenis: 'kuning', teks: t('bank.hapusTerkunci') });
    if (diPlaylist && (playlist?.length ?? 0) <= BATAS_PLAYLIST.min) return setPesanKustom({ jenis: 'kuning', teks: t('bank.hapusSatuSatunya') });
    setAkanDihapus(r);
  };

  const hapus = async (r: RingkasSoal) => {
    setAkanDihapus(null);
    // Lepas dari playlist dulu supaya room tidak menunjuk soal yang sudah tidak ada.
    if (playlist?.includes(r.id)) {
      const ok = await kirim(playlist.filter((id) => id !== r.id));
      if (!ok) return;
    }
    const h = await hapusSoal(r.id);
    if (!h.ok) return galatApi(h);
    setPesanKustom({ jenis: 'sukses', teks: t('bank.terhapus', { judul: r.judul }) });
    await muatBank();
  };

  // ---------------------------------------------------------------- tampilan

  const jumlah = playlist?.length ?? room.totalRounds;
  const tersedia = (bank?.soal ?? []).filter((r) => !(playlist ?? []).includes(r.id));
  const kustom = (bank?.soal ?? []).filter((r) => r.asal === 'kustom');
  const penuh = (playlist?.length ?? 0) >= BATAS_PLAYLIST.maks;
  const KELOMPOK: { asal: RingkasSoal['asal']; judul: string }[] = [
    { asal: 'acara', judul: 'bank.paketAcara' },
    { asal: 'latihan', judul: 'bank.paketLatihan' },
    { asal: 'kustom', judul: 'bank.kustomJudul' },
  ];

  return (
    <section className="panel bank-bagian" aria-labelledby="bank-judul">
      <div className="bank-kepala">
        <div className="bank-kepala-teks">
          <h3 id="bank-judul">{t('bank.judulBagian')}</h3>
          <div className="bank-ringkas">
            <span className="chip">
              <Icon name="daftar" size={15} /> {t('bank.jumlahSoal', { n: jumlah })}
            </span>
            {playlist ? (
              <span className="chip" title={t('bank.ringkasanKet')}>
                <Icon name="jam" size={15} /> {t('bank.perkiraan', { menit: perkiraanMenit(playlist, peta) })}
              </span>
            ) : null}
            {playlist && bank ? (
              <span className="chip">{t(paketKini === 'acara' ? 'bank.paketAcara' : paketKini === 'latihan' ? 'bank.paketLatihan' : 'bank.racikan')}</span>
            ) : null}
            {!bisaUbah ? (
              <span className="chip chip-kuning">
                <Icon name="polis" size={15} /> {t('bank.terkunci')}
              </span>
            ) : null}
            <span role="status" aria-live="polite">
              {simpan.jenis === 'menyimpan' ? (
                <span className="bank-status bank-status-menyimpan">
                  <span className="memuat" aria-hidden /> {t('bank.statusMenyimpan')}
                </span>
              ) : simpan.jenis === 'tersimpan' ? (
                <span className="bank-status bank-status-tersimpan">
                  <Icon name="cek" size={15} /> {t('bank.statusTersimpan')}
                </span>
              ) : simpan.jenis === 'galat' ? (
                <span className="bank-status bank-status-galat">
                  <Icon name="silang" size={15} /> {t('bank.statusGagal')}
                </span>
              ) : null}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-garis bank-buka bank-btn"
          aria-expanded={buka}
          aria-controls="bank-isi"
          onClick={() => setBuka(!buka)}
        >
          {buka ? t('bank.tutupDaftar') : bisaUbah ? t('bank.aturSoal') : t('bank.lihatDaftar')}
          <span className="bank-buka-panah" aria-hidden>
            ▾
          </span>
        </button>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {umumkan}
      </p>

      {simpan.jenis === 'galat' ? (
        <Pesan jenis="error" onTutup={() => setSimpan({ jenis: 'diam' })}>
          {t('bank.gagalSimpan', { alasan: simpan.pesan })}
        </Pesan>
      ) : null}

      {buka ? (
        <div id="bank-isi" className="bank-bagian">
          {!bisaUbah ? <Pesan jenis="kuning">{t('bank.hanyaBaca')}</Pesan> : null}

          {memuat && !playlist ? (
            <div className="bank-hampa">
              <span className="memuat" aria-hidden /> {t('bank.memuat')}
            </div>
          ) : null}

          {!memuat && !playlist ? (
            <Pesan jenis="kuning">
              {t('bank.playlistGagal')}
              {galatPlaylist ? <div className="mini">{terjemahkanGalat(galatPlaylist)}</div> : null}
              <div style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-netral bank-btn" onClick={() => void muatSemua()}>
                  {t('bank.muatUlang')}
                </button>
              </div>
            </Pesan>
          ) : null}

          {!memuat && playlist && galatBank ? (
            <Pesan jenis="kuning">
              {galatBank.jenis === 'belumAda' ? t('bank.bankBelumAda') : t('bank.bankGagal', { alasan: pesanGalatBank(galatBank) })}
              <div style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-netral bank-btn" onClick={() => void muatSemua()}>
                  {t('bank.muatUlang')}
                </button>
              </div>
            </Pesan>
          ) : null}

          {playlist && bank && bisaUbah ? (
            <div className="stack-s">
              <strong className="kecil">{t('bank.pilihCepat')}</strong>
              <div className="bank-paket">
                {(['acara', 'latihan'] as const).map((p) => {
                  const n = bank.paket[p].length;
                  return (
                    <button
                      key={p}
                      type="button"
                      className="bank-paket-tombol"
                      aria-pressed={paketKini === p}
                      disabled={n === 0}
                      onClick={() => pilihPaket(p)}
                    >
                      <i className="bank-paket-tanda" aria-hidden>
                        {paketKini === p ? '✓' : ''}
                      </i>
                      <span>
                        {t(p === 'acara' ? 'bank.paketAcara' : 'bank.paketLatihan')}
                        <small>
                          {n === 0 ? t('bank.paketKosong') : t(p === 'acara' ? 'bank.paketAcaraKet' : 'bank.paketLatihanKet', { n })}
                          {paketKini === p ? ` · ${t('bank.dipakai')}` : ''}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="bank-catatan-kotak">
                <Icon name="tanya" size={16} /> <span>{t('bank.catatanSolo')}</span>
              </p>
            </div>
          ) : null}

          {playlist ? (
            <ol className="bank-daftar" aria-label={t('bank.daftarAria')}>
              {playlist.map((id, i) => {
                const r = peta.get(id);
                const kini = sedangMain && i === room.roundIndex;
                const judul = namaSoal(id);
                return (
                  <li key={id} className={'bank-butir' + (kini ? ' bank-butir-kini' : '') + (!r ? ' bank-butir-hilang' : '')}>
                    <span className="bank-no" aria-hidden>
                      {i + 1}
                    </span>
                    <div className="bank-isi">
                      {r?.gambar ? <img className="bank-mini" src={r.gambar} alt="" loading="lazy" /> : null}
                      <div className="bank-isi-teks">
                        <span className="bank-judul">
                          <span className="sr-only">{t('bank.nomorAria', { n: i + 1 })} </span>
                          {judul}
                        </span>
                        {r ? <InfoSoal r={r} /> : bank ? <span className="bank-meta">{t('bank.soalHilang')}</span> : null}
                        {kini ? (
                          <span className="bank-meta">
                            <span className="bank-lencana bank-lencana-kini">
                              <Icon name="kilat" size={12} /> {t('bank.sedangDimainkan')}
                            </span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {bisaUbah ? (
                      <div className="bank-aksi">
                        <button
                          type="button"
                          id={`bank-naik-${id}`}
                          className="bank-ikon-btn"
                          disabled={i === 0}
                          aria-label={t('bank.naikAria', { judul })}
                          title={t('bank.naik')}
                          onClick={() => pindah(i, -1)}
                        >
                          <span aria-hidden>▲</span>
                        </button>
                        <button
                          type="button"
                          id={`bank-turun-${id}`}
                          className="bank-ikon-btn"
                          disabled={i === playlist.length - 1}
                          aria-label={t('bank.turunAria', { judul })}
                          title={t('bank.turun')}
                          onClick={() => pindah(i, 1)}
                        >
                          <span aria-hidden>▼</span>
                        </button>
                        <button
                          type="button"
                          className="bank-ikon-btn bank-ikon-btn-bahaya"
                          disabled={playlist.length <= BATAS_PLAYLIST.min}
                          aria-label={t('bank.lepasAria', { judul })}
                          title={t('bank.lepas')}
                          onClick={() => lepas(i)}
                        >
                          <span aria-hidden>✕</span>
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : null}

          {playlist && bisaUbah ? (
            <>
              <div className="bank-kaki">
                <button
                  type="button"
                  className="btn bank-btn"
                  aria-expanded={pemilih}
                  aria-controls="bank-pemilih"
                  disabled={penuh || !bank}
                  onClick={() => setPemilih(!pemilih)}
                >
                  + {t('bank.tambahSoal')}
                </button>
                <span className="bank-catatan">
                  {penuh
                    ? t('bank.penuh', { maks: BATAS_PLAYLIST.maks })
                    : playlist.length <= BATAS_PLAYLIST.min
                      ? t('bank.minimal', { min: BATAS_PLAYLIST.min })
                      : t('bank.batas', { min: BATAS_PLAYLIST.min, maks: BATAS_PLAYLIST.maks })}
                </span>
              </div>

              {pemilih && bank && !penuh ? (
                <div id="bank-pemilih" className="bank-kotak">
                  <div className="baris-antara">
                    <h4>{t('bank.pemilihJudul')}</h4>
                    <button type="button" className="btn btn-netral bank-btn" onClick={() => setPemilih(false)}>
                      {t('layar.tutup')}
                    </button>
                  </div>
                  {tersedia.length === 0 ? <div className="bank-hampa">{t('bank.pemilihKosong')}</div> : null}
                  {KELOMPOK.map((k) => {
                    const isi = tersedia.filter((r) => r.asal === k.asal);
                    if (isi.length === 0) return null;
                    return (
                      <div key={k.asal} className="stack-s">
                        <p className="bank-kelompok">{t(k.judul)}</p>
                        <ul className="bank-pilihan">
                          {isi.map((r) => (
                            <li key={r.id}>
                              <div className="bank-isi">
                                {r.gambar ? <img className="bank-mini" src={r.gambar} alt="" loading="lazy" /> : null}
                                <div className="bank-isi-teks">
                                  <span className="bank-judul">{judulSoal(r, bahasa)}</span>
                                  <InfoSoal r={r} />
                                </div>
                              </div>
                              <div className="bank-pilihan-aksi">
                                <button
                                  type="button"
                                  className="btn btn-garis bank-btn"
                                  aria-label={t('bank.tambahkanAria', { judul: judulSoal(r, bahasa) })}
                                  onClick={() => void tambah(r.id)}
                                >
                                  {t('bank.tambahkan')}
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : null}

          {/* ---------------------------------------------------------------- soal buatan panitia */}
          {bank ? (
            <div className="bank-kotak" aria-labelledby="bank-kustom-judul" role="group">
              <div className="baris-antara" style={{ flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <h4 id="bank-kustom-judul">{t('bank.kustomJudul')}</h4>
                  <p className="bank-catatan">{t('bank.kustomKet')}</p>
                </div>
                {!pinKurang ? (
                  <button
                    type="button"
                    className="btn bank-btn"
                    onClick={() => {
                      setPesanKustom(null);
                      setEditor({ soal: null });
                    }}
                  >
                    + {t('bank.buatSoal')}
                  </button>
                ) : null}
              </div>

              {butuhPin ? (
                <PinPanitia
                  ditolak={pinDitolak}
                  onTersimpan={() => {
                    setPinDitolak(false);
                    setPesanKustom(null);
                    setVersiPin((n) => n + 1);
                  }}
                />
              ) : konfig?.dikenal ? (
                <p className="bank-catatan-kotak">
                  <Icon name="polis" size={16} /> <span>{t('bank.tanpaPin')}</span>
                </p>
              ) : null}

              {pesanKustom ? (
                <Pesan jenis={pesanKustom.jenis} onTutup={() => setPesanKustom(null)}>
                  {pesanKustom.teks}
                </Pesan>
              ) : null}

              {kustom.length === 0 ? (
                <div className="bank-hampa">{t('bank.kustomKosong')}</div>
              ) : (
                <ul className="bank-pilihan">
                  {kustom.map((r) => {
                    const diPlaylist = playlist?.includes(r.id) ?? false;
                    return (
                      <li key={r.id}>
                        <div className="bank-isi">
                          {r.gambar ? <img className="bank-mini" src={r.gambar} alt="" loading="lazy" /> : null}
                          <div className="bank-isi-teks">
                            <span className="bank-judul">{r.judul}</span>
                            <InfoSoal r={r} />
                            {diPlaylist ? (
                              <span className="bank-meta">
                                <span className="bank-lencana">
                                  <Icon name="cek" size={12} /> {t('bank.adaDiPlaylist')}
                                </span>
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="bank-pilihan-aksi">
                          {!diPlaylist && bisaUbah && playlist && !penuh ? (
                            <button
                              type="button"
                              className="btn btn-garis bank-btn"
                              aria-label={t('bank.tambahkanAria', { judul: r.judul })}
                              onClick={() => void tambah(r.id)}
                            >
                              {t('bank.tambahkan')}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="btn btn-netral bank-btn"
                            disabled={pinKurang || membuka !== null}
                            aria-label={t('bank.ubahAria', { judul: r.judul })}
                            onClick={() => void bukaUbah(r)}
                          >
                            {membuka === r.id ? t('bank.membuka') : t('bank.ubah')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-bahaya bank-btn"
                            disabled={pinKurang}
                            aria-label={t('bank.hapusAria', { judul: r.judul })}
                            onClick={() => mintaHapus(r)}
                          >
                            {t('bank.hapus')}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {akanGanti && bank ? (
        <Modal
          judul={t('bank.gantiPaketJudul', { paket: t(akanGanti === 'acara' ? 'bank.paketAcara' : 'bank.paketLatihan') })}
          onTutup={() => setAkanGanti(null)}
          aksi={
            <>
              <button type="button" className="btn btn-netral" onClick={() => setAkanGanti(null)}>
                {t('layar.batal')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const paket = akanGanti;
                  setAkanGanti(null);
                  void kirim(bank.paket[paket].slice(0, BATAS_PLAYLIST.maks));
                }}
              >
                {t('bank.gantiPaketSetuju')}
              </button>
            </>
          }
        >
          <p>{t('bank.gantiPaketPesan', { n: bank.paket[akanGanti].length })}</p>
        </Modal>
      ) : null}

      {akanDihapus ? (
        <Modal
          judul={t('bank.hapusJudul', { judul: akanDihapus.judul })}
          onTutup={() => setAkanDihapus(null)}
          aksi={
            <>
              <button type="button" className="btn btn-netral" onClick={() => setAkanDihapus(null)}>
                {t('layar.batal')}
              </button>
              <button type="button" className="btn btn-bahaya" onClick={() => void hapus(akanDihapus)}>
                {t('bank.hapusSetuju')}
              </button>
            </>
          }
        >
          <p>
            {t('bank.hapusPesan')}
            {playlist?.includes(akanDihapus.id) ? ` ${t('bank.hapusPesanDiPlaylist')}` : ''}
          </p>
        </Modal>
      ) : null}

      {editor ? (
        <EditorSoal
          awal={editor.soal}
          butuhPin={butuhPin}
          bisaTambah={bisaUbah && playlist !== null}
          penuh={penuh}
          diPlaylist={(id) => playlist?.includes(id) ?? false}
          onTambah={tambah}
          onTersimpan={() => void muatBank()}
          onTutup={() => setEditor(null)}
        />
      ) : null}
    </section>
  );
}
