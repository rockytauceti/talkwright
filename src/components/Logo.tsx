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
      {/* Feather body — pointed tip at upper-right, calamus at lower-left */}
      <path
        d="M 52 6 C 60 12, 60 26, 50 38 C 40 50, 24 56, 10 50 C 4 46, 4 40, 10 34 C 18 24, 34 12, 52 6 Z"
        fill={fill}
        stroke={outline}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      {/* Center spine */}
      <line x1="51" y1="8" x2="11" y2="49" stroke={detail} strokeWidth="2.5" strokeLinecap="round" />
      {/* Barb lines crossing spine */}
      <line x1="40" y1="11" x2="48" y2="19" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      <line x1="28" y1="17" x2="42" y2="31" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="25" x2="34" y2="39" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="37" x2="22" y2="45" stroke={detail} strokeWidth="2" strokeLinecap="round" />
      {/* Writing nib — curves down from calamus and loops right */}
      <path
        d="M 10 50 C 6 54, 6 60, 12 60 C 18 60, 20 54, 16 50"
        stroke={outline}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
