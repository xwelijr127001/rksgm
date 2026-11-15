/**
 * Surveyor portrait for the "Join Game" entry (staff review #6: replace the Bu Isti icon with a surveyor). Flat SVG
 * in the brand palette inside the same round frame as the other landing portraits; decorative (the card text names
 * the action). Replace with an official brand illustration when the design team provides one.
 */
export function PotretSurveyor({ ukuran = 60 }: { ukuran?: number }) {
  return (
    <span className="tokoh-potret potret-surveyor" style={{ width: ukuran, height: ukuran }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={ukuran} height={ukuran} focusable="false">
        <circle cx="32" cy="32" r="32" fill="#FCF3D9" />
        {/* body: field vest over shirt */}
        <path d="M14 64c1-12 8-18 18-18s17 6 18 18H14Z" fill="#F6C445" />
        <path d="M27 46h10l-2 18h-6l-2-18Z" fill="#EEF5E9" />
        <path d="M18 56h9m10 0h9" stroke="#FFFEFA" strokeWidth="2.4" strokeLinecap="round" />
        {/* clipboard */}
        <rect x="38" y="44" width="14" height="17" rx="2" fill="#5B4636" transform="rotate(-8 45 52)" />
        <rect x="40" y="47" width="10" height="12" rx="1" fill="#FFFEFA" transform="rotate(-8 45 52)" />
        <path d="M42 51h6m-6 3h5" stroke="#215C40" strokeWidth="1.4" strokeLinecap="round" transform="rotate(-8 45 52)" />
        {/* head */}
        <path d="M26 38h12v8a6 6 0 0 1-12 0v-8Z" fill="#E0A27E" />
        <ellipse cx="32" cy="30" rx="10" ry="11" fill="#E9B08C" />
        <circle cx="28.4" cy="30.5" r="1.3" fill="#243D30" />
        <circle cx="35.6" cy="30.5" r="1.3" fill="#243D30" />
        <path d="M29 35.5c2 1.6 4 1.6 6 0" stroke="#A9573C" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        {/* safety helmet */}
        <path d="M20.5 25c0-8 5-13 11.5-13S43.5 17 43.5 25h-23Z" fill="#215C40" />
        <path d="M18 25.5h28" stroke="#163E2B" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 13v8" stroke="#2E9A66" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
