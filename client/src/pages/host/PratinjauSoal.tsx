/**
 * Pratinjau sederhana "seperti yang dilihat pemain": bingkai HP berisi gambar 4:3, cerita yang
 * dibawakan Miss Raksa, kalimat tugas, lalu pertanyaan dengan pilihannya. TIDAK menampilkan
 * kunci jawaban (pemain juga tidak melihatnya). Ini hanya gambaran; tampilan persisnya diatur
 * layar misi pemain.
 */

import { SapaanPemandu } from '../../game/KarakterTokoh';
import { t, useBahasa } from '../../i18n';
import type { DrafSoal } from './drafSoal';
import { LencanaProduk, LencanaTingkat } from './lencana';

function Samar({ teks }: { teks: string }) {
  return <span className="bank-samar">{teks}</span>;
}

export function PratinjauSoal({ draf, urlGambar }: { draf: DrafSoal; urlGambar: string | null }) {
  useBahasa();
  return (
    <div className="bank-hp" aria-label={t('bank.pratinjauKet')}>
      <div className="bank-hp-kepala">
        <LencanaProduk produk={draf.product} />
        <LencanaTingkat tingkat={draf.tingkat} />
        <span className="bank-lencana">{t('bank.pvDetik', { detik: draf.durasi.trim() || '?' })}</span>
      </div>
      <h4>{draf.title.trim() || <Samar teks={t('bank.pvJudul')} />}</h4>

      <div className="bank-hp-gambar">
        {urlGambar ? <img src={urlGambar} alt={draf.image?.alt ?? ''} /> : <span style={{ padding: 12 }}>{t('bank.pvGambar')}</span>}
      </div>

      <SapaanPemandu tokoh="missRaksa" ukuran={44} teks={draf.story.trim() || <Samar teks={t('bank.pvCerita')} />} />

      <p className="bank-hp-tugas">{draf.instruction.trim() || <Samar teks={t('bank.pvTugas')} />}</p>

      {draf.steps.map((s, i) => (
        <div key={s.id} className="bank-hp-tanya">
          <b>
            {draf.steps.length > 1 ? `${i + 1}. ` : ''}
            {s.prompt.trim() || <Samar teks={t('bank.pvTanya')} />}
          </b>
          {s.hint.trim() ? <p className="kecil lembut">{s.hint.trim()}</p> : null}
          {s.kind === 'number' ? (
            <div className="bank-hp-angka">
              {s.format === 'rupiah' ? <b>Rp</b> : null}
              <span style={{ flex: 1 }}>{t('bank.pvKetikAngka')}</span>
              {s.format === 'angka' && s.unit.trim() ? <b>{s.unit.trim()}</b> : null}
            </div>
          ) : (
            <>
              {s.kind === 'multi' ? <p className="mini lembut">{t('bank.pvPilihBeberapa')}</p> : null}
              {s.options.map((o, j) => (
                <div key={o.id} className="bank-hp-opsi">
                  <i className={s.kind === 'multi' ? 'bank-hp-kotak' : undefined} aria-hidden />
                  <span>{o.label.trim() || <Samar teks={t('bank.pvOpsi', { n: j + 1 })} />}</span>
                </div>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
