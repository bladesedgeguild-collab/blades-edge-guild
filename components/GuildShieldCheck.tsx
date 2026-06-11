export function GuildShieldCheck({ size = 20, color = '#1a1208' }: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield outline */}
      <path
        d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z"
        fill={color}
        fillOpacity="0.15"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Sword blade — vertical */}
      <line x1="12" y1="7" x2="12" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Sword crossguard — horizontal */}
      <line x1="9" y1="10" x2="15" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Sword pommel */}
      <circle cx="12" cy="17.5" r="1" fill={color} />
    </svg>
  )
}
