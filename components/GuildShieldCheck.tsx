export function GuildShieldCheck({ size = 20, color = '#1a1208' }: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield body — classic heater shape, wide top, pointed bottom */}
      <path
        d="M2 2 L18 2 L18 13 Q18 18 10 21 Q2 18 2 13 Z"
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Inner shield border for depth */}
      <path
        d="M4 4 L16 4 L16 12.5 Q16 16.5 10 19 Q4 16.5 4 12.5 Z"
        fill="none"
        stroke={color}
        strokeWidth="0.6"
        strokeOpacity="0.5"
        strokeLinejoin="round"
      />
      {/* Pommel */}
      <rect x="8.5" y="4.5" width="3" height="1.8" rx="0.9" fill={color} />
      {/* Grip */}
      <rect x="9.3" y="6.3" width="1.4" height="3" rx="0.3" fill={color} />
      {/* Crossguard */}
      <rect x="6.5" y="9" width="7" height="1.5" rx="0.5" fill={color} />
      {/* Blade — long, slightly tapered */}
      <path d="M9.3 10.5 L10.7 10.5 L10.2 18.5 L10 19.2 L9.8 18.5 Z" fill={color} />
    </svg>
  )
}
