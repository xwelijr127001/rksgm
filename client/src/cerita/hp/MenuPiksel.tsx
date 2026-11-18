/**
 * T-041 (owner 19 Nov): bagian Menu cerita piksel. Ikon piksel 12 x 12 sel (24 px = 2 px per sel, crispEdges, warna PALET.md)
 * dan pemilih bahasa sebagai kunci piksel bersegmen (ID / EN / 中文). Gaya: desain.css "T-041".
 */
import type { ReactElement } from 'react';
import { DAFTAR_BAHASA } from '@shared/bahasa';
import { t, useBahasa } from '../../i18n';

/** k tinta #212121, o oranye #FF9000, p persik #FFD9A8, w putih, . kosong. */
const WARNA: Record<string, string> = { k: '#212121', o: '#ff9000', p: '#ffd9a8', w: '#ffffff' };

export type JenisIkonMenu = 'riwayat' | 'catatan' | 'bantuan' | 'daftar' | 'gambar';

const GAMBAR: Record<JenisIkonMenu, string[]> = {
  // gelembung percakapan dengan dua baris teks dan ekor
  riwayat: [
    '............',
    '.kkkkkkkkkk.',
    'kppppppppppk',
    'kpkkkkkkkppk',
    'kppppppppppk',
    'kpkkkkkppppk',
    'kppppppppppk',
    '.kkpkkkkkkk.',
    '..kpk.......',
    '..kk........',
    '..k.........',
    '............',
  ],
  // papan catatan: penjepit, kertas putih bergaris, bingkai oranye
  catatan: [
    '....kkkk....',
    '.kkkpwwpkkk.',
    '.kookkkkook.',
    '.kowwwwwwok.',
    '.kowkkkkwok.',
    '.kowwwwwwok.',
    '.kowkkkkwok.',
    '.kowwwwwwok.',
    '.kowkkwwwok.',
    '.kowwwwwwok.',
    '.kooooooook.',
    '.kkkkkkkkkk.',
  ],
  // koin tanda tanya
  bantuan: [
    '...kkkkkk...',
    '..kwwwwwwk..',
    '.kwwkkkkwwk.',
    'kwwkkwwkkwwk',
    'kwwwwwwkkwwk',
    'kwwwwwkkwwwk',
    'kwwwwkkwwwwk',
    'kwwwwwwwwwwk',
    'kwwwwkkwwwwk',
    '.kwwwkkwwwk.',
    '..kwwwwwwk..',
    '...kkkkkk...',
  ],
  // tampilan daftar: tiga butir dan garis
  daftar: [
    '............',
    'kkk.........',
    'kok.kkkkkkkk',
    'kkk.........',
    '............',
    'kkk.........',
    'kok.kkkkkk..',
    'kkk.........',
    '............',
    'kkk.........',
    'kok.kkkkkkk.',
    'kkk.........',
  ],
  // tampilan gambar: bingkai, matahari, dua bukit
  gambar: [
    '............',
    '............',
    'kkkkkkkkkkkk',
    'kwwwwwwwoowk',
    'kwwwwwwwoowk',
    'kwwwkwwwwwwk',
    'kwwkkkwwwwwk',
    'kwkkkkkwkwwk',
    'kkkkkkkkkkwk',
    'kkkkkkkkkkkk',
    '............',
    '............',
  ],
};

export function IkonMenu({ jenis }: { jenis: JenisIkonMenu }) {
  const rects: ReactElement[] = [];
  GAMBAR[jenis].forEach((baris, y) => {
    let x = 0;
    while (x < baris.length) {
      const c = baris[x];
      if (c === '.') { x++; continue; }
      let e = x + 1;
      while (e < baris.length && baris[e] === c) e++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={e - x} height={1} fill={WARNA[c]} />);
      x = e;
    }
  });
  return (
    <svg className="hp-ikon-piksel" width="24" height="24" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {rects}
    </svg>
  );
}

/** Bahasa ID / EN / 中文 sebagai tiga kunci piksel; yang aktif tertekan (aria-pressed). Pilihan tersimpan seperti PilihBahasa. */
export function BahasaKunci() {
  const { bahasa, aturBahasa } = useBahasa();
  return (
    <div className="hp-bahasa-kunci" role="group" aria-label={t('umum.pilihBahasa')}>
      {DAFTAR_BAHASA.map((b) => (
        <button key={b.kode} type="button" className="hp-kunci-piksel" aria-pressed={bahasa === b.kode} lang={b.htmlLang} aria-label={b.nama} title={b.nama}
          onClick={() => { if (bahasa !== b.kode) aturBahasa(b.kode); }}>
          {b.singkat}
        </button>
      ))}
    </div>
  );
}
