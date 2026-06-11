export function GuildShieldCheck({ size = 20, color = '#1a1208' }: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tabard top crossbar / shoulder piece */}
      <path
        d="M1 2 Q1 1 2 1 L22 1 Q23 1 23 2 L23 7 Q23 8 22 8 L15 8 L15 23 Q15 24 14 25 L12 26 L10 25 Q9 24 9 23 L9 8 L2 8 Q1 8 1 7 Z"
        fill={color}
        fillOpacity="0.2"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Rivets along top bar — left side */}
      <circle cx="3.5" cy="4.5" r="0.7" fill={color} />
      <circle cx="6.5" cy="4.5" r="0.7" fill={color} />
      {/* Rivets along top bar — right side */}
      <circle cx="17.5" cy="4.5" r="0.7" fill={color} />
      <circle cx="20.5" cy="4.5" r="0.7" fill={color} />
      {/* Sword blade — centered in body */}
      <line x1="12" y1="9.5" x2="12" y2="21" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      {/* Sword crossguard */}
      <line x1="9.5" y1="12.5" x2="14.5" y2="12.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      {/* Sword grip */}
      <line x1="12" y1="12.5" x2="12" y2="15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Pommel */}
      <circle cx="12" cy="21.5" r="1" fill={color} />
    </svg>
  )
}
