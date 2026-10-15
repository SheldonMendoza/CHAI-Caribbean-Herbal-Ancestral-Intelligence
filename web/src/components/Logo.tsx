/**
 * CHAI logo — original inline SVG.
 * A Caribbean botanical leaf whose veins resolve into a small knowledge
 * network (nodes on the vein tips) — the "ancestral wisdom meets
 * intelligence" motif. No palm trees, no beach clichés, no gradients.
 */
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="CHAI leaf logo"
      focusable="false"
    >
      {/* leaf body */}
      <path
        d="M24 4 C13 12 8.5 22 8.5 31 C8.5 39.5 15 44.5 24 44.5 C33 44.5 39.5 39.5 39.5 31 C39.5 22 35 12 24 4 Z"
        fill="#145C43"
      />
      {/* midrib */}
      <path
        d="M24 8 C23 18 23 30 24 42"
        stroke="#F2C14E"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* side veins */}
      <g stroke="#F2C14E" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.85">
        <path d="M23.5 15 C19 16.5 15.5 19 13.5 22.5" />
        <path d="M24.5 15 C29 16.5 32.5 19 34.5 22.5" />
        <path d="M23.5 23 C19.5 24.5 16.5 27 15 30.5" />
        <path d="M24.5 23 C28.5 24.5 31.5 27 33 30.5" />
        <path d="M23.8 31 C21 32 19 34 18.5 36.5" />
        <path d="M24.2 31 C27 32 29 34 29.5 36.5" />
      </g>
      {/* knowledge nodes at vein tips */}
      <g fill="#F2C14E">
        <circle cx="13.5" cy="22.5" r="2.2" />
        <circle cx="34.5" cy="22.5" r="2.2" />
        <circle cx="15" cy="30.5" r="2.2" />
        <circle cx="33" cy="30.5" r="2.2" />
      </g>
      {/* central node — the synthesis point */}
      <circle cx="24" cy="24" r="3.1" fill="#F2C14E" />
      <circle cx="24" cy="24" r="5.4" fill="none" stroke="#F2C14E" strokeWidth="1.2" opacity="0.7" />
    </svg>
  );
}

/** Full brand lockup: mark + "CHAI" + full name. */
export function Logo({ size = 44, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <span className="brand">
      <LogoMark size={size} />
      <span className="brand-wordmark">
        <span
          className="brand-mark"
          style={dark ? { color: '#F7F4E9' } : undefined}
        >
          CHAI
        </span>
        <span
          className="brand-full"
          style={dark ? { color: '#c9c2ab' } : undefined}
        >
          Caribbean Herbal Ancestral Intelligence
        </span>
      </span>
    </span>
  );
}
