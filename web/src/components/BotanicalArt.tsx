/**
 * BotanicalArt — original inline-SVG botanical composition.
 * Used as the hero visual when the seed dataset provides no plant imagery
 * yet (dev fixture). At integration the hero prefers real seed plant
 * photographs; this artwork never substitutes for real content.
 */
export function BotanicalArt() {
  return (
    <svg
      viewBox="0 0 560 420"
      role="img"
      aria-label="Original botanical illustration of Caribbean plant leaves with a knowledge network motif"
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '20px' }}
    >
      <rect width="560" height="420" fill="#0B3D2C" />
      {/* leaf clusters */}
      <g>
        <path d="M120 360 C80 300 70 220 110 140 C150 220 150 300 120 360 Z" fill="#145C43" />
        <path d="M120 340 C100 290 95 230 118 165" stroke="#F2C14E" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M280 380 C240 310 235 220 280 130 C325 220 320 310 280 380 Z" fill="#087A52" />
        <path d="M280 360 C262 300 258 230 282 160" stroke="#F2C14E" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M440 360 C400 300 395 230 432 155 C468 230 465 300 440 360 Z" fill="#145C43" />
        <path d="M438 340 C422 295 420 240 440 180" stroke="#F2C14E" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* side veins */}
        <g stroke="#F2C14E" strokeWidth="2" opacity="0.6" fill="none">
          <path d="M112 200 C95 205 85 215 82 228" />
          <path d="M128 200 C145 205 155 215 158 228" />
          <path d="M272 215 C255 220 245 230 242 243" />
          <path d="M288 215 C305 220 315 230 318 243" />
          <path d="M432 220 C418 225 410 233 408 244" />
          <path d="M448 220 C462 225 470 233 472 244" />
        </g>
      </g>
      {/* knowledge network nodes */}
      <g fill="#F2C14E">
        <circle cx="82" cy="228" r="7" />
        <circle cx="158" cy="228" r="7" />
        <circle cx="242" cy="243" r="7" />
        <circle cx="318" cy="243" r="7" />
        <circle cx="408" cy="244" r="7" />
        <circle cx="472" cy="244" r="7" />
      </g>
      <g stroke="#F2C14E" strokeWidth="1.5" opacity="0.5">
        <path d="M82 228 C150 260 320 260 472 244" fill="none" />
        <path d="M158 228 C220 200 340 200 408 244" fill="none" />
      </g>
      <circle cx="280" cy="120" r="10" fill="#E96B48" />
      <circle cx="280" cy="120" r="17" fill="none" stroke="#E96B48" strokeWidth="2" opacity="0.6" />
    </svg>
  );
}
