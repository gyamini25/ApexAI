// ApexAI mark — an apex "A" formed by two speed strokes with a cyan AI node.
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="glow-red rounded-[11px]"
      aria-label="ApexAI"
    >
      <defs>
        <linearGradient id="apexRedTile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5a5a" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="#0c1018" stroke="#ff2d2d" strokeOpacity="0.45" />
      <path d="M24 13 L13.5 35" stroke="url(#apexRedTile)" strokeWidth="5" strokeLinecap="round" />
      <path d="M24 13 L34.5 35" stroke="url(#apexRedTile)" strokeWidth="5" strokeLinecap="round" />
      <path d="M18.5 28 L29.5 28" stroke="#e6ebf2" strokeWidth="3.6" strokeLinecap="round" opacity="0.92" />
      <circle cx="24" cy="13" r="2.6" fill="#28e0d8" />
    </svg>
  )
}
