import { useState } from 'react';
import { Raki } from './Raki';
import { playSfx } from '../audio/audio';
import { KarakterTokoh } from '../game/KarakterTokoh';
export function WelcomeArt() {
  const [wave, setWave] = useState(false);
  return <div className="welcome-world">
    <svg className="world-drawing" viewBox="0 0 560 510" fill="none" aria-hidden="true">
      <circle cx="280" cy="251" r="213" fill="#F7D45B" />
      <path d="M78 343c42-86 141-90 241-64s135 6 174-62" stroke="#E8BC3A" strokeWidth="85" />
      <path d="M78 339c42-86 141-90 241-64s135 6 174-62" stroke="#FCF8EB" strokeWidth="64" />
      <path d="M78 339c42-86 141-90 241-64s135 6 174-62" stroke="#E2D7BE" strokeWidth="2" strokeDasharray="10 12" />
      <g stroke="#214C3C" strokeWidth="2.5" strokeLinejoin="round">
        <path d="m328 208 0-111 57-23 79 30v116l-76 25-60-37Z" fill="#D8E8D9" />
        <path d="m328 97 59 25 77-18M387 122v123" />
        <path d="m339 110 36 15v16l-36-15v-16Zm0 32 36 15v16l-36-15v-16Zm0 32 36 15v16l-36-15v-16Z" fill="#F9FCF5" />
        <path d="m402 134 47-16v20l-47 16v-20Zm0 35 47-16v20l-47 16v-20Z" fill="#6CA887" />
        <path d="m420 212 16-5v22l-16 5v-22Z" fill="#214C3C" />
      </g>
      <g transform="translate(76 192)" stroke="#214C3C" strokeWidth="2.5" strokeLinejoin="round">
        <path d="m0 28 57-28 52 32-57 27L0 28Z" fill="#E7946E" />
        <path d="M0 28v47l52 28V59L0 28Z" fill="#FFF8E8" /><path d="m52 59 57-27v47l-57 24V59Z" fill="#D8E8D9" />
        <path d="m18 50 17 10v24L18 74V50Z" fill="#6CA887" /><path d="m70 62 22-10v14L70 76V62Z" fill="#FFF8E8" />
      </g>
      <g transform="translate(156 298) rotate(-10)">
        <ellipse cx="43" cy="42" rx="55" ry="12" fill="#214C3C" opacity=".12" />
        <path d="m6 21 15-21h43l21 21 11 3v21H-3V29l9-8Z" fill="#287451" stroke="#214C3C" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="m26 6-9 15h52L57 6H26Z" fill="#DCEAE3" /><path d="M42 6v15" stroke="#214C3C" strokeWidth="2" />
        <circle cx="18" cy="43" r="11" fill="#214C3C" /><circle cx="74" cy="43" r="11" fill="#214C3C" /><circle cx="18" cy="43" r="5" fill="#FAF8EE" /><circle cx="74" cy="43" r="5" fill="#FAF8EE" />
        <path d="M-2 30h10m77 0h8" stroke="#F7D45B" strokeWidth="4" />
      </g>
      <g stroke="#214C3C" strokeWidth="2.5" strokeLinecap="round"><path d="M285 176v-34m-9 12 9 9 10-11" /><path d="M267 139c-10-37 46-40 39 0-7 18-32 18-39 0Z" fill="#6CA887" /><path d="M485 312v-35m-8 12 8 9 9-11" /><path d="M469 274c-12-35 45-38 33 0-5 17-29 17-33 0Z" fill="#6CA887" /></g>
      <path d="m102 116 4 11 12 3-12 4-4 11-3-11-12-4 12-3 3-11Z" fill="#287451" /><path d="m443 44 3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Z" fill="#E7946E" />
      <path d="M148 82h48m-34-14h39" stroke="#E9BA3F" strokeWidth="4" strokeLinecap="round" />
    </svg>
    <KarakterTokoh tokoh="ceo" className="welcome-ceo" tinggi={150} />
    <div className="world-caption">Kota ini butuh andalan.<span>Kamu, misalnya.</span></div>
    <button className="welcome-raki" aria-label="Sapa Raki" onClick={() => { setWave(v => !v); playSfx('pilih'); }}><Raki size={170} mood={wave ? 'senang' : 'sapa'} /><span className="raki-greeting" aria-live="polite">{wave ? 'Yuk, main bareng!' : 'Hai, aku Raki!'}</span></button>
  </div>;
}

