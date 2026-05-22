export default function Logo({ size = 28, theme = 'dark' }: { size?: number; theme?: 'dark' | 'light' }) {
  const amber = theme === 'dark' ? '#f59e0b' : '#d97706'
  const shade = theme === 'dark' ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.18)'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TalkWright"
    >
      {/* Chunky feather body — solid filled shape */}
      <path
        d="M47 6 C58 8 62 24 56 38 C52 48 44 54 34 58 L28 56 C22 48 18 36 22 24 C26 12 36 4 47 6 Z"
        fill={amber}
      />
      {/* Spine — subtle dark line through center */}
      <path
        d="M46 8 C40 24 34 40 30 56"
        stroke={shade}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Barb lines — right side */}
      <path d="M50 16 C46 20 42 22 40 26" stroke={shade} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M54 26 C48 30 44 32 42 36" stroke={shade} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M54 36 C50 40 46 42 44 46" stroke={shade} strokeWidth="1.5" strokeLinecap="round" />
      {/* Barb lines — left side */}
      <path d="M36 14 C32 18 28 20 26 24" stroke={shade} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40 24 C36 28 32 30 30 34" stroke={shade} strokeWidth="1.5" strokeLinecap="round" />
      {/* Nib tip — small bold curl below feather */}
      <path
        d="M30 56 C26 60 18 60 18 55 C18 52 22 51 26 53"
        stroke={amber}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
