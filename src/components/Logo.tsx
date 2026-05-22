export default function Logo({ size = 28, theme = 'dark' }: { size?: number; theme?: 'dark' | 'light' }) {
  const outline = theme === 'dark' ? '#e7e5e4' : '#1c1917'
  const fill = theme === 'dark' ? '#44403c' : '#f5f5f0'
  const detail = theme === 'dark' ? '#78716c' : '#a8a29e'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TalkWright"
    >
      {/* Main feather body — wide rounded oval, pointed at top-right and bottom-left */}
      <path
        d="M44 5
           C 52 5, 60 14, 60 26
           C 60 38, 52 50, 40 53
           C 32 55, 22 53, 18 50
           C 10 46, 6 36, 8 26
           C 10 14, 18 5, 28 4
           C 34 3, 40 4, 44 5 Z"
        fill={fill}
        stroke={outline}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      {/* Center spine */}
      <path
        d="M44 6 C 36 20, 28 34, 20 50"
        stroke={detail}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Barb lines — left of spine */}
      <path d="M38 11 C 32 15, 26 17, 20 18" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      <path d="M32 19 C 26 23, 20 25, 14 26" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      <path d="M27 28 C 22 31, 16 33, 12 34" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      <path d="M23 37 C 18 40, 14 42, 12 43" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      {/* Barb lines — right of spine */}
      <path d="M46 12 C 50 16, 54 20, 54 24" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      <path d="M44 21 C 48 25, 52 29, 52 33" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      <path d="M40 30 C 44 34, 48 38, 46 42" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      <path d="M34 40 C 38 43, 40 46, 38 49" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      {/* Writing nib tail — curves out from bottom tip and loops right */}
      <path
        d="M20 50 C 16 54, 16 60, 22 60 C 28 60, 34 56, 32 52"
        stroke={outline}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
