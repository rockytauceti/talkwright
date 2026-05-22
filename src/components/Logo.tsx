export default function Logo({ size = 28, theme = 'dark' }: { size?: number; height?: number; theme?: 'dark' | 'light' }) {
  const amber = theme === 'dark' ? '#f59e0b' : '#d97706'
  const bg = theme === 'dark' ? '#0a0a0a' : '#ffffff'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TalkWright"
    >
      {/* Ornamental dashed ring */}
      <circle cx="32" cy="32" r="28" stroke={amber} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.45" />
      {/* Cardinal diamond ornaments */}
      <path d="M32 5 L34.5 10 L32 15 L29.5 10 Z" fill={amber} opacity="0.75" />
      <path d="M32 49 L34.5 54 L32 59 L29.5 54 Z" fill={amber} opacity="0.75" />
      <path d="M5 32 L10 29.5 L15 32 L10 34.5 Z" fill={amber} opacity="0.75" />
      <path d="M49 32 L54 29.5 L59 32 L54 34.5 Z" fill={amber} opacity="0.75" />
      {/* T crossbar */}
      <rect x="13" y="17" width="38" height="8" rx="1.5" fill={amber} />
      {/* Crossbar serifs */}
      <rect x="11" y="16" width="7" height="2.5" rx="0.8" fill={amber} />
      <rect x="46" y="16" width="7" height="2.5" rx="0.8" fill={amber} />
      {/* T stem */}
      <rect x="27.5" y="25" width="9" height="23" rx="1.5" fill={amber} />
      {/* Stem serifs */}
      <rect x="23" y="45.5" width="7" height="2.5" rx="0.8" fill={amber} />
      <rect x="34" y="45.5" width="7" height="2.5" rx="0.8" fill={amber} />
      {/* Subtle cross inset on crossbar */}
      <rect x="30" y="19.5" width="4" height="4" rx="0.5" fill={bg} opacity="0.18" />
    </svg>
  )
}
