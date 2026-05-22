export default function Logo({ size = 28, theme = 'dark' }: { size?: number; theme?: 'dark' | 'light' }) {
  const amber = theme === 'dark' ? '#f59e0b' : '#d97706'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TalkWright"
    >
      {/* Halo rings around nib */}
      <circle cx="20" cy="44" r="11" stroke={amber} strokeWidth="1.5" opacity="0.3" />
      <circle cx="20" cy="44" r="7" stroke={amber} strokeWidth="1" opacity="0.2" />
      {/* Quill spine */}
      <path d="M54 8 C42 12 24 26 18 46" stroke={amber} strokeWidth="2.5" strokeLinecap="round" />
      {/* Right barb edge */}
      <path d="M54 8 C58 20 52 32 42 40" stroke={amber} strokeWidth="2" strokeLinecap="round" opacity="0.65" />
      {/* Barb detail lines */}
      <path d="M49 15 C52 20 48 26 44 30" stroke={amber} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      <path d="M43 23 C46 27 43 32 39 36" stroke={amber} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      <path d="M37 31 C39 34 37 38 34 41" stroke={amber} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      {/* Nib tip */}
      <path d="M18 46 L15 51 L21 48 Z" fill={amber} />
      {/* Ink dot */}
      <circle cx="16" cy="50" r="1.8" fill={amber} opacity="0.7" />
    </svg>
  )
}
