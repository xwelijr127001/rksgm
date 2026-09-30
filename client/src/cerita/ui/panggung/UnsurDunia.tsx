/**
 * Potongan React dunia panggung v3: lapisan ruang (urutan kontrak), tokoh (jangkar di titik tempat), prop, dan
 * teks papan nama TERKONTROL dari konfigurasi episode (bukan huruf hasil generasi). Semua hiasan: aria-hidden di
 * pembungkus dunia (Panggung.tsx). Id SVG diberi awalan unik per salinan (awalanId) supaya salinan adegan untuk
 * silang-pudar/pembuka tidak bentrok.
 *
 * Struktur tokoh (semua kotak 0 x 0 di titik jangkar, isi meluber):
 *   .cer-pg-tokoh (posisi dunia + skala + z) > .cer-pg-sorot (sorotan pembicara, transisi CSS)
 *     > .cer-pg-gerak (data-aktor; animasi aksi) > .cer-pg-napas (napas) > salinan .cer-pg-varian: dasar | kedip | bicara
 */
import { memo, useEffect, useMemo, useState } from 'react';
import type { GambarTokoh } from '../../seni/tokoh';
import type { LapisanSvg, RuangAdegan } from '../../seni/ruang';
import { KEPALA_TINGGI } from '../../seni/tokoh';
import { awalanId, Z, type LetakProp, type LetakTokoh, type SusunanAdegan } from './dunia';
import { jalankanSaatIdle } from './panas';
import { jalurKlip, kotakDiAtasMeja, pikselDari, ruangPiksel, sidikGambar, tempelanDari, titikKisi, type PotonganPiksel, type TempelanPiksel } from './piksel';
import { gambarProp } from './prop';
import type { SalinanJalan } from './rencana';
import { gambarTokoh } from './sumber';

// ------------------------------------------------------------------ SVG inline

/**
 * Satu gambar SVG inline (kanvas w x h, sudut kiri-atas di x,y) dengan id berawalan unik salinan ini.
 * (Putaran 3 menguji <img> data URL untuk lapisan & tokoh: elemen panggung 3575 -> 91, tetapi ketukan kedatangan
 * lebih lambat karena setiap gambar SVG baru membangun dokumen SVG sendiri, dan fps/jeda tampil tidak membaik, jadi
 * tidak dipakai.)
 */
function GambarSvg({ isi, w, h, x, y, awalan, className, varian, z, tersembunyi, basi }: {
  isi: string; w: number; h: number; x: number; y: number; awalan: string; className: string; varian?: string; z?: number; tersembunyi?: boolean;
  /** Isi belum diperbarui untuk pose kini (data-basi): tidak boleh diperlihatkan (GerakKecil melewatinya). */
  basi?: boolean;
}) {
  const html = useMemo(() => awalanId(isi, awalan), [isi, awalan]);
  return (
    <svg
      className={className}
      data-varian={varian}
      data-basi={basi ? '' : undefined}
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      overflow="visible"
      focusable="false"
      style={{ left: x, top: y, zIndex: z, visibility: tersembunyi ? 'hidden' : undefined }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Satu potongan PNG (piksel.ts) sebagai <svg> di kotak dunia w x h (sudut kiri-atas x,y): viewBox = kotak sumber,
 * <image> atlas utuh di 0,0, nearest-neighbour (atribut SVG + CSS .cer-pg-piksel). `klip` = CSS clip-path (koordinat
 * kotak elemen) untuk salinan yang dipotong (tangan di atas meja). Kelas, data-varian, data-basi & visibility sama
 * dengan GambarSvg, jadi gerak kecil (kedip/mulut) dan uji memperlakukannya sama.
 */
function GambarPiksel({ p, w, h, x, y, className, varian, z, tersembunyi, basi, klip, tempelan }: {
  p: PotonganPiksel; w: number; h: number; x: number; y: number; className: string; varian?: string; z?: number; tersembunyi?: boolean;
  basi?: boolean; klip?: string | null;
  /** Lapisan wajah di atas potongan dasar (piksel seni relatif sudut kiri-atas potongan dasar). */
  tempelan?: readonly TempelanPiksel[];
}) {
  const s = p.sumber;
  return (
    <svg
      className={`${className} cer-pg-piksel`}
      data-varian={varian}
      data-basi={basi ? '' : undefined}
      viewBox={`${s.x} ${s.y} ${s.w} ${s.h}`}
      width={w}
      height={h}
      preserveAspectRatio="none"
      focusable="false"
      style={{ left: x, top: y, zIndex: z, visibility: tersembunyi ? 'hidden' : undefined, clipPath: klip ?? undefined }}
    >
      <image href={p.url} x={0} y={0} width={p.atlas.w} height={p.atlas.h} preserveAspectRatio="none" imageRendering="pixelated" style={{ imageRendering: 'pixelated' }} />
      {tempelan?.map((t, i) => (
        <svg key={i} x={s.x + t.x} y={s.y + t.y} width={t.p.sumber.w} height={t.p.sumber.h} viewBox={`${t.p.sumber.x} ${t.p.sumber.y} ${t.p.sumber.w} ${t.p.sumber.h}`} overflow="hidden">
          <image href={t.p.url} x={0} y={0} width={t.p.atlas.w} height={t.p.atlas.h} preserveAspectRatio="none" imageRendering="pixelated" style={{ imageRendering: 'pixelated' }} />
        </svg>
      ))}
    </svg>
  );
}

// ------------------------------------------------------------------ lapisan ruang

function Lapisan({ l, z, awalan, className = 'cer-pg-lapisan' }: { l: LapisanSvg | undefined; z: number; awalan: string; className?: string }) {
  if (!l) return null;
  const p = pikselDari(l);
  if (p) return <GambarPiksel p={p} w={l.w} h={l.h} x={l.x} y={l.y} z={z} className={className} />;
  return <GambarSvg isi={l.svg} w={l.w} h={l.h} x={l.x} y={l.y} z={z} awalan={awalan} className={className} />;
}

/** Jarak (satuan dunia) perpanjangan tepi latar raster ke luar dunia (pandangan letterbox terbesar: k 1). */
const TEPI_LUAR = 4000;

/**
 * Tepi latar RASTER diperpanjang ke luar dunia (letterbox saat skala piksel bulat membuat pandangan lebih besar
 * daripada dunia): kolom/baris piksel tepi latar yang sama diregangkan nearest-neighbour, jadi dinding & lantai
 * berlanjut dengan warna tepi ruang (bukan pita polos). Di bawah latar (z sama, lebih dulu), aria-hidden lewat dunia.
 */
function TepiLatar({ l }: { l: LapisanSvg }) {
  const p = pikselDari(l);
  if (!p) return null;
  const { x: sx, y: sy, w: sw, h: sh } = p.sumber;
  const E = TEPI_LUAR;
  const bagian: [string, { x: number; y: number; w: number; h: number }, { x: number; y: number; w: number; h: number }][] = [
    ['kiri', { x: sx, y: sy, w: 1, h: sh }, { x: l.x - E, y: l.y, w: E, h: l.h }],
    ['kanan', { x: sx + sw - 1, y: sy, w: 1, h: sh }, { x: l.x + l.w, y: l.y, w: E, h: l.h }],
    ['atas', { x: sx, y: sy, w: sw, h: 1 }, { x: l.x, y: l.y - E, w: l.w, h: E }],
    ['bawah', { x: sx, y: sy + sh - 1, w: sw, h: 1 }, { x: l.x, y: l.y + l.h, w: l.w, h: E }],
    ['kiri-atas', { x: sx, y: sy, w: 1, h: 1 }, { x: l.x - E, y: l.y - E, w: E, h: E }],
    ['kanan-atas', { x: sx + sw - 1, y: sy, w: 1, h: 1 }, { x: l.x + l.w, y: l.y - E, w: E, h: E }],
    ['kiri-bawah', { x: sx, y: sy + sh - 1, w: 1, h: 1 }, { x: l.x - E, y: l.y + l.h, w: E, h: E }],
    ['kanan-bawah', { x: sx + sw - 1, y: sy + sh - 1, w: 1, h: 1 }, { x: l.x + l.w, y: l.y + l.h, w: E, h: E }],
  ];
  return (
    <>
      {bagian.map(([nama, sumber, k]) => (
        <GambarPiksel key={nama} p={{ ...p, sumber }} w={k.w} h={k.h} x={k.x} y={k.y} z={Z.latar} className="cer-pg-lapisan cer-pg-tepi" varian={`tepi-${nama}`} />
      ))}
    </>
  );
}

/** Teks papan nama dari konfigurasi (ejaan terkontrol, huruf serif tetap), dipaskan ke kotak papan. */
function PapanNama({ ruang, nama }: { ruang: RuangAdegan; nama: string }) {
  const p = ruang.papanNama;
  if (!p || !nama) return null;
  const ukuran = Math.min(p.ukuranHuruf, p.h * 0.55);
  const perkiraan = nama.length * 0.52 * ukuran;
  const pas = perkiraan > p.w * 0.88 ? { textLength: Math.round(p.w * 0.88), lengthAdjust: 'spacingAndGlyphs' as const } : {};
  return (
    <svg className="cer-pg-lapisan" viewBox={`0 0 ${p.w} ${p.h}`} width={p.w} height={p.h} focusable="false" style={{ left: p.x, top: p.y, zIndex: Z.papan }}>
      <text
        x={p.w / 2}
        y={p.h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight={600}
        fontSize={ukuran}
        letterSpacing={ukuran * 0.02}
        fill={p.warna}
        {...pas}
      >
        {nama}
      </text>
    </svg>
  );
}

/**
 * Semua lapisan ruang dengan z kontrak. `pintuAktor` = daun pintu diberi data-aktor 'pintu' (hanya dunia utama;
 * salinan adegan tidak ikut dianimasikan).
 */
export const LapisanRuang = memo(function LapisanRuang({ ruang, awalan, papan, pintuAktor }: { ruang: RuangAdegan; awalan: string; papan: string; pintuAktor: boolean }) {
  const pintu = ruang.pintu;
  return (
    <>
      <TepiLatar l={ruang.latar} />
      <Lapisan l={ruang.latar} z={Z.latar} awalan={`${awalan}l`} />
      {/* Ruang raster: tulisan papan sudah dipanggang di latar (papanNama kosong), jadi tanpa teks panggung. */}
      <PapanNama ruang={ruang} nama={papan} />
      <Lapisan l={ruang.koridor} z={Z.koridor} awalan={`${awalan}k`} />
      {pintu ? (
        <div
          className="cer-pg-pintu"
          data-aktor={pintuAktor ? 'pintu' : undefined}
          style={{
            left: pintu.daun.x, top: pintu.daun.y, width: pintu.daun.w, height: pintu.daun.h, zIndex: Z.pintu,
            transformOrigin: `${pintu.engsel.x - pintu.daun.x}px ${pintu.engsel.y - pintu.daun.y}px`,
          }}
        >
          <Lapisan l={{ ...pintu.daun, x: 0, y: 0 }} z={0} awalan={`${awalan}p`} />
        </div>
      ) : null}
      <Lapisan l={ruang.belakangMeja} z={Z.mejaBelakang} awalan={`${awalan}mb`} />
      <Lapisan l={ruang.depanMeja} z={Z.mejaDepan} awalan={`${awalan}md`} />
      <Lapisan l={ruang.kursi?.belakang} z={Z.kursiBelakang} awalan={`${awalan}kb`} />
      <Lapisan l={ruang.kursi?.depan} z={Z.kursiDepan} awalan={`${awalan}kd`} />
    </>
  );
});

// ------------------------------------------------------------------ tokoh

/**
 * Satu salinan gambar tokoh (dasar / kedip / bicara / tangan di atas meja / pose jalan), jangkar di titik 0,0.
 * `g` = gambar dasar (kanvas & jangkar); `isi` = isi SVG varian, atau `piksel` = potongan PNG varian (raster:
 * varian boleh potongan lain / PNG lain dengan kanvas & jangkar yang sama). `klip` = hanya bagian ini (raster).
 */
function SvgTokoh({ g, isi, piksel, tempelan, klip, awalan, varian, tersembunyi, basi }: {
  g: GambarTokoh; isi: string; piksel?: PotonganPiksel | null; tempelan?: readonly TempelanPiksel[]; klip?: string | null; awalan: string; varian: string;
  tersembunyi?: boolean; basi?: boolean;
}) {
  if (piksel) {
    return <GambarPiksel p={piksel} w={g.w} h={g.h} x={-g.jangkar.x} y={-g.jangkar.y} className="cer-pg-varian" varian={varian} tersembunyi={tersembunyi} basi={basi} klip={klip} tempelan={tempelan} />;
  }
  return <GambarSvg isi={isi} w={g.w} h={g.h} x={-g.jangkar.x} y={-g.jangkar.y} awalan={awalan} className="cer-pg-varian" varian={varian} tersembunyi={tersembunyi} basi={basi} />;
}

/**
 * Satu tokoh di dunia. `kedip`/`bicara` = pasang salinan mata tertutup / mulut terbuka (hanya bila gerak boleh).
 * `sementara` = aktor rencana (gaya bawaan tak terlihat; hanya animasi yang memperlihatkannya).
 */
export const TokohDunia = memo(function TokohDunia({
  letak, awalan, aktor, kedip = false, bicara = false, sorot = false, sementara = false, className = '', ekspresiData, nama,
}: {
  letak: LetakTokoh;
  awalan: string;
  aktor?: string;
  kedip?: boolean;
  bicara?: boolean;
  sorot?: boolean;
  sementara?: boolean;
  className?: string;
  /** Penanda uji `data-ekspresi` (wajah yang tampil), hanya untuk nasabah di dunia utama. */
  ekspresiData?: string;
  /** Nama sebagai teks (hanya saat gambar pengganti sementara dipakai). */
  nama?: string;
}) {
  const g = letak.gambar;
  // Varian kedip/bicara digambar TANPA id per pemasangan (satu entri cache generator per pose, dipakai bersama oleh
  // semua pemasangan & dipanaskan lebih dulu oleh panas.ts), lalu diberi awalan unik salinan ini (awalanId di
  // GambarSvg), sama seperti varian dasar. Id per pemasangan di kunci cache membuat heap naik sampai batas LRU.
  // Salinan KEDIP (± 280 elemen SVG yang hanya tampil 120 md sekali tiap 3-6 dtk) diperbarui SAAT IDLE sesudah pose
  // berganti, bukan di bingkai ketukan (respons input <= 200 md). Sampai diperbarui, elemennya tetap berisi pose
  // sebelumnya dengan tanda data-basi, dan GerakKecil tidak mengedipkan salinan basi (pose lama tidak pernah tampil).
  const [kedipSiap, setKedipSiap] = useState<{ tanda: string; g: GambarTokoh } | null>(null);
  // Kunci salinan kedip = tanda penampilan + sidik gambar raster (gambar raster lain dengan pose/letak sama, mis. atlas
  // pengganti, tidak boleh berkedip dengan wajah gambar lama).
  const pDasar = pikselDari(g);
  const kunciKedip = pDasar ? `${letak.tanda}|${sidikGambar(g)}` : letak.tanda;
  const tandaKedip = kedip ? kunciKedip : null;
  const opsiKini = letak.opsi;
  useEffect(() => {
    if (tandaKedip === null) return;
    function* perbarui(): Generator<void> {
      setKedipSiap((lama) => (lama?.tanda === tandaKedip ? lama : { tanda: tandaKedip!, g: gambarTokoh({ ...opsiKini, kedip: true }) }));
    }
    return jalankanSaatIdle(perbarui());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tandaKedip]);
  const gKedip = kedipSiap?.g ?? null;
  const kedipBasi = kedipSiap?.tanda !== kunciKedip;
  const gBicara = useMemo(() => (bicara ? gambarTokoh({ ...letak.opsi, bicara: true }) : null), [bicara, letak.opsi]);
  // Raster (piksel.ts): skala 1 & titik di kisi piksel seni (dunia.ts buatLetak), tanpa napas (skala pecahan).
  // Tangan di atas meja: tokoh di belakang meja (z < puncak meja) yang punya lapisan `diAtasMeja` digambar lagi
  // tangannya di antara prop & depan meja. Ikut animasi aksi (data-aktor sama), tanpa napas/kedip/mulut. Raster:
  // GAMBAR YANG SAMA dipotong ke kotak `diAtasMejaPiksel` (transform sama, tanpa salinan lengan kedua).
  const belakangMeja = letak.z < Z.mejaBelakang;
  const svgDiAtas = !pDasar && g.diAtasMeja && belakangMeja ? g.diAtasMeja : '';
  const klipDiAtas = pDasar && belakangMeja ? jalurKlip(kotakDiAtasMeja(g)) : null;
  const gaya = { left: letak.titik.x, top: letak.titik.y, transform: `scale(${letak.skala})` };
  // Penanda uji/diagnosis (raster): frame atlas & ujung telunjuk dalam satuan DUNIA (kartu: jari di landasan kartu).
  const telunjuk = (g as { titikTangan?: Record<string, { x: number; y: number }> }).titikTangan?.telunjuk;
  return (
    <>
      <div
        className={`cer-pg-tokoh ${className}`}
        data-siapa={letak.siapa}
        data-pose={letak.opsi.pose}
        data-sorot={sorot ? '' : undefined}
        data-piksel={pDasar ? '' : undefined}
        data-frame={pDasar ? (g as { frame?: string }).frame : undefined}
        data-telunjuk={telunjuk && !sementara ? `${letak.titik.x + (telunjuk.x - g.jangkar.x) * letak.skala},${letak.titik.y + (telunjuk.y - g.jangkar.y) * letak.skala}` : undefined}
        style={{ ...gaya, zIndex: letak.z }}
      >
        <div className="cer-pg-sorot">
          <div className={`cer-pg-gerak${sementara ? ' cer-pg-sementara' : ''}`} data-aktor={aktor} data-ekspresi={ekspresiData}>
            <div className="cer-pg-napas" data-piksel={pDasar ? '' : undefined}>
              <SvgTokoh g={g} isi={g.svg} piksel={pDasar} tempelan={tempelanDari(g)} awalan={`${awalan}d`} varian="dasar" />
              {/* Jenis elemen salinan kedip mengikuti gambar DASAR (raster tetap raster walau isinya belum diperbarui saat
                  idle, ditandai basi): elemen tidak dipasang ulang saat diperbarui, jadi rujukan gerak kecil tetap sah. */}
              {kedip ? (
                <SvgTokoh
                  g={g}
                  isi={gKedip?.svg ?? ''}
                  piksel={pDasar ? pikselDari(gKedip) ?? pDasar : pikselDari(gKedip)}
                  tempelan={tempelanDari(gKedip)}
                  awalan={`${awalan}k`}
                  varian="kedip"
                  tersembunyi
                  basi={kedipBasi || (!!pDasar && !pikselDari(gKedip))}
                />
              ) : null}
              {bicara ? <SvgTokoh g={g} isi={gBicara?.svg ?? ''} piksel={pikselDari(gBicara)} tempelan={tempelanDari(gBicara)} awalan={`${awalan}b`} varian="bicara" tersembunyi /> : null}
            </div>
            {nama ? <LabelNama g={g} skala={letak.skala} nama={nama} /> : null}
          </div>
        </div>
      </div>
      {svgDiAtas || klipDiAtas ? (
        <div className={`cer-pg-tokoh cer-pg-diatas-meja ${className}`} data-lapis="diatas-meja" data-sorot={sorot ? '' : undefined} data-piksel={pDasar ? '' : undefined} style={{ ...gaya, zIndex: Z.prop + 2 }}>
          <div className="cer-pg-sorot">
            <div className={`cer-pg-gerak${sementara ? ' cer-pg-sementara' : ''}`} data-aktor={aktor}>
              <SvgTokoh g={g} isi={svgDiAtas} piksel={klipDiAtas ? pDasar : null} tempelan={klipDiAtas ? tempelanDari(g) : undefined} klip={klipDiAtas} awalan={`${awalan}m`} varian="diatas-meja" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
});

/** Pejalan: titik jangkar bergerak lewat transform; salinan pose (jalan-a, jalan-b, diam) bergantian terlihat. */
export const PejalanDunia = memo(function PejalanDunia({ kunci, titik0, z, salinan, awalan }: {
  kunci: string;
  titik0: { x: number; y: number };
  z: number;
  salinan: SalinanJalan[];
  awalan: string;
}) {
  const gambar = useMemo(() => salinan.map((s) => ({ s, g: gambarTokoh(s.opsi) })), [salinan]);
  return (
    <div className="cer-pg-tokoh cer-pg-sementara" data-aktor={`x:${kunci}`} data-siapa="nasabah" style={{ left: titik0.x, top: titik0.y, zIndex: z }}>
      {gambar.map(({ s, g }) => (
        <div key={s.id} className="cer-pg-gerak" data-aktor={`x:${kunci}:${s.id}`} style={{ opacity: 0 }}>
          <div className="cer-pg-cermin" style={s.cermin ? { transform: 'scaleX(-1)' } : undefined}>
            <SvgTokoh g={g} isi={g.svg} piksel={pikselDari(g)} tempelan={tempelanDari(g)} awalan={`${awalan}${s.id}`} varian={s.opsi.pose} />
          </div>
        </div>
      ))}
    </div>
  );
});

// ------------------------------------------------------------------ prop & label

/**
 * Prop di dunia. `piksel` (ruang raster) = prop piksel ruang bila ada: skala 1, sudut kiri-atas di kisi piksel seni
 * (sejajar piksel ruang); selain itu SVG.
 */
export const PropDunia = memo(function PropDunia({ prop, awalan, aktor, sementara = false, piksel = false }: { prop: LetakProp; awalan: string; aktor?: string; sementara?: boolean; piksel?: boolean }) {
  const g = useMemo(() => gambarProp(prop.id, prop.tempat, awalan, piksel), [prop.id, prop.tempat, awalan, piksel]);
  const raster = !!pikselDari(g);
  const titik = raster ? titikKisi(prop.titik, g.jangkar) : prop.titik;
  return (
    <div className="cer-pg-prop" data-prop={prop.id} data-piksel={raster ? '' : undefined} style={{ left: titik.x, top: titik.y, zIndex: prop.tempat === 'tangan' ? Z.kursiDepan : Z.prop, transform: raster ? undefined : `scale(${prop.skala})` }}>
      <div className={`cer-pg-gerak${sementara ? ' cer-pg-sementara' : ''}`} data-aktor={aktor}>
        {pikselDari(g) ? (
          <GambarPiksel p={pikselDari(g)!} w={g.w} h={g.h} x={-g.jangkar.x} y={-g.jangkar.y} className="cer-pg-varian" />
        ) : <svg
          className="cer-pg-varian"
          viewBox={`0 0 ${g.w} ${g.h}`}
          width={g.w}
          height={g.h}
          overflow="visible"
          focusable="false"
          style={{ left: -g.jangkar.x, top: -g.jangkar.y }}
          dangerouslySetInnerHTML={{ __html: g.svg }}
        />}
      </div>
    </div>
  );
});

/**
 * Nama tokoh sebagai teks di bawah kepala saat gambar pengganti sementara dipakai (aset belum ada / gagal).
 * Di dalam pembungkus gerak tokohnya (koordinat lokal), jadi ikut muncul/hilang bersama tokoh (tidak mendahului).
 */
function LabelNama({ g, skala, nama }: { g: GambarTokoh; skala: number; nama: string }) {
  const s = skala || 1;
  return (
    <div
      className="cer-pg-label"
      style={{ left: g.kepala.x - g.jangkar.x, top: g.kepala.y - g.jangkar.y + KEPALA_TINGGI * 0.6 + 6, fontSize: 28 / s, borderWidth: 2 / s }}
    >
      {nama}
    </div>
  );
}

/** Salinan satu adegan (tanpa animasi di dalamnya) untuk silang-pudar pindah lokasi & pembuka. */
export const SalinanAdegan = memo(function SalinanAdegan({ susunan, awalan, papan, tanpaTokoh }: {
  susunan: SusunanAdegan;
  awalan: string;
  papan: string;
  tanpaTokoh: boolean;
}) {
  return (
    <>
      <LapisanRuang ruang={susunan.ruang} awalan={`${awalan}r`} papan={papan} pintuAktor={false} />
      {tanpaTokoh ? null : susunan.tokoh.map((l) => <TokohDunia key={l.siapa} letak={l} awalan={`${awalan}${l.siapa}`} />)}
      {susunan.prop.map((p) => <PropDunia key={p.id} prop={p} awalan={`${awalan}p${p.id}`} piksel={ruangPiksel(susunan.ruang)} />)}
    </>
  );
});
