export default function Logo({ size = 28, theme = 'dark' }: { size?: number; theme?: 'dark' | 'light' }) {
  const fill = theme === 'dark' ? '#e7e5e4' : '#292524'
  const shade = theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.18)'
  const nib = theme === 'dark' ? '#e7e5e4' : '#292524'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TalkWright"
    >
      <path
        d="M47 6 C58 8 62 24 56 38 C52 48 44 54 34 58 L28 56 C22 48 18 36 22 24 C26 12 36 4 47 6 Z"
        fill={fill}
      />
      <path d="M46 8 C40 24 34 40 30 56" stroke={shade} strokeWidth="2" strokeLinecap="round" />
      <path d="M50 16 C46 20 42 22 40 26" stroke={shade} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M54 26 C48 30 44 32 42 36" stroke={shade} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M54 36 C50 40 46 42 44 46" stroke={shade} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M36 14 C32 18 28 20 26 24" stroke={shade} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40 24 C36 28 32 30 30 34" stroke={shade} strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M30 56 C26 60 18 60 18 55 C18 52 22 51 26 53"
        stroke={nib}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
