import { useEffect, useMemo, useState } from 'react';
import { TUTORIAL_MISSION } from '@shared/missions';
import type { MissionAnswer } from '@shared/types';
import { Raki } from '../art/Raki';
import { playSfx } from '../audio/audio';
import { PlayerShell } from '../components/PlayerShell';
import { MissionPlay, Panah, TandaIkon, sela } from '../game/MissionPlay';
import { prefetchAdegan } from '../game/prefetch';
import { misiDalamBahasa, t, useBahasa } from '../i18n';
import { savedLook, useGame } from '../state/store';

/**
 * Pemanasan sebelum pertandingan: mencoba mengetuk benda di gambar, melihat
 * pilihan tercatat, mengganti pilihan, lalu mengirim. Tidak memengaruhi skor.
 */
export default function Tutorial() {
  const { bahasa } = useBahasa();
  const { identity } = useGame();
  const [answer, setAnswer] = useState<MissionAnswer>({});
  const [sent, setSent] = useState(false);
  const [ulang, setUlang] = useState(0);
  useEffect(() => { prefetchAdegan(); }, []);
  // Misi pemanasan dalam bahasa aktif; id langkah/opsi tidak berubah, jadi pemeriksaan jawaban tetap sama.
  const misi = useMemo(() => misiDalamBahasa(TUTORIAL_MISSION, bahasa), [bahasa]);
  const correct = answer[TUTORIAL_MISSION.steps[0].id] === 'helm';
  const look = identity?.look ?? savedLook();

  return <PlayerShell label={t('misi.pemanasan')} className="kompak">
    <main className="misi-main">
      <div className="misi-judul"><div><span className="eyebrow">{t('misi.eyebrowTutorial')}</span><h1>{t('misi.tutorialJudul')}</h1></div></div>
      <MissionPlay
        key={ulang}
        mission={misi}
        roundIndex={-1}
        look={look}
        mode={sent ? 'reveal' : 'play'}
        answer={answer}
        onAnswer={(id, v) => setAnswer(old => ({ ...old, [id]: v }))}
        onSubmit={() => { playSfx('kirim'); setSent(true); }}
        submitLabel={t('misi.kirimJawabanLatihan')}
        bantuanAwal
        sudahBriefing
        panel={<div className="hasil" data-hasil={correct ? 'tepat' : 'belum'}>
          <div className="hasil-kepala">
            <span className="hasil-juri" aria-hidden="true"><Raki size={56} mood={correct ? 'senang' : 'berpikir'} /><TandaIkon jenis={correct ? 'tepat' : 'salah'} /></span>
            <div>
              <span className="hasil-juri-nama">Raki</span>
              <h2 className="hasil-judul">{correct ? t('misi.siapBermain') : t('misi.belumTepatCoba')}</h2>
              <p className="hasil-sub">{correct ? t('misi.caranyaSama') : t('misi.tenangPemanasan')}</p>
            </div>
          </div>
          <p className="hasil-inti"><b>{t('misi.ingat')}</b>{sela()}{t('misi.ingatTeks')}</p>
          <div className="hasil-aksi">
            {correct ? <p className="status-caption">{t('misi.tungguPanitia')}</p> : null}
            <button type="button" className={correct ? 'text-button' : 'primary-action'} onClick={() => { setSent(false); setAnswer({}); setUlang(u => u + 1); }}>{t('misi.cobaLagi')} {correct ? null : <Panah />}</button>
          </div>
          <p className="practice-note">{t('misi.catatanPemanasanHasil')}</p>
        </div>}
      />
      {!sent ? <p className="practice-note misi-catatan">{t('misi.catatanPemanasan')}</p> : null}
    </main>
  </PlayerShell>;
}
