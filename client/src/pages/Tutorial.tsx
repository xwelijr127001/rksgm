import { useEffect, useState } from 'react';
import { TUTORIAL_MISSION } from '@shared/missions';
import type { MissionAnswer } from '@shared/types';
import { Raki } from '../art/Raki';
import { playSfx } from '../audio/audio';
import { PlayerShell } from '../components/PlayerShell';
import { MissionPlay, Panah, TandaIkon } from '../game/MissionPlay';
import { prefetchAdegan } from '../game/prefetch';
import { savedLook, useGame } from '../state/store';

/**
 * Pemanasan sebelum pertandingan: mencoba mengetuk benda di gambar, melihat
 * pilihan tercatat, mengganti pilihan, lalu mengirim. Tidak memengaruhi skor.
 */
export default function Tutorial() {
  const { identity } = useGame();
  const [answer, setAnswer] = useState<MissionAnswer>({});
  const [sent, setSent] = useState(false);
  const [ulang, setUlang] = useState(0);
  useEffect(() => { prefetchAdegan(); }, []);
  const correct = answer[TUTORIAL_MISSION.steps[0].id] === 'helm';
  const look = identity?.look ?? savedLook();

  return <PlayerShell label="Pemanasan" className="kompak">
    <main className="misi-main">
      <div className="misi-judul"><div><span className="eyebrow">COBA SEKALI, LANGSUNG PAHAM</span><h1>Ketuk, periksa, lalu kirim.</h1></div></div>
      <MissionPlay
        key={ulang}
        mission={TUTORIAL_MISSION}
        roundIndex={-1}
        look={look}
        mode={sent ? 'reveal' : 'play'}
        answer={answer}
        onAnswer={(id, v) => setAnswer(old => ({ ...old, [id]: v }))}
        onSubmit={() => { playSfx('kirim'); setSent(true); }}
        submitLabel="Kirim jawaban latihan"
        bantuanAwal
        sudahBriefing
        panel={<div className="hasil" data-hasil={correct ? 'tepat' : 'belum'}>
          <div className="hasil-kepala">
            <span className="hasil-ikon" aria-hidden="true"><TandaIkon jenis={correct ? 'tepat' : 'salah'} /></span>
            <div>
              <h2 className="hasil-judul">{correct ? 'Kamu siap bermain.' : 'Belum tepat. Coba sekali lagi?'}</h2>
              <p className="hasil-sub">{correct ? 'Di pertandingan, caranya sama persis.' : 'Tenang, ini masih pemanasan. Coba ketuk helm proyek, ya.'}</p>
            </div>
          </div>
          <div className="pemandu-kata"><Raki size={48} mood={correct ? 'senang' : 'berpikir'} /><p><b>Raki</b>Ingat tiga langkahnya: <strong>ketuk</strong> benda di gambar atau pilihan di daftar, <strong>periksa</strong> pilihanmu, lalu tekan <strong>Kirim</strong> sebelum waktu habis.</p></div>
          <div className="hasil-aksi">
            {correct ? <p className="status-caption">Tunggu panitia memulai pertandingan.</p> : null}
            <button type="button" className={correct ? 'text-button' : 'primary-action'} onClick={() => { setSent(false); setAnswer({}); setUlang(u => u + 1); }}>Coba lagi {correct ? null : <Panah />}</button>
          </div>
          <p className="practice-note">Pemanasan ini tidak memengaruhi poin. Simulasi edukasi; klaim sebenarnya mengikuti polis dan pemeriksaan Raksa.</p>
        </div>}
      />
      {!sent ? <p className="practice-note misi-catatan">Pemanasan ini tidak memengaruhi poin. Semua kasus adalah simulasi edukasi; klaim sebenarnya mengikuti polis dan pemeriksaan Raksa.</p> : null}
    </main>
  </PlayerShell>;
}
