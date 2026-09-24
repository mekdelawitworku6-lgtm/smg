export default function WbsLogo({ style, className = "", ariaLabel = "WBS logo" }) {
  return (
    <svg viewBox="0 0 224 204" role="img" aria-label={ariaLabel} style={style} className={className}>
      <defs>
        <linearGradient id="wbsGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9a6b16" />
          <stop offset="0.4" stopColor="#e6c25f" />
          <stop offset="0.6" stopColor="#f3df95" />
          <stop offset="1" stopColor="#a97a22" />
        </linearGradient>
      </defs>
      <circle cx="112" cy="100" r="94" fill="none" stroke="url(#wbsGold)" strokeWidth="1.2" />
      <g transform="translate(0 6)">
        <path fill="url(#wbsGold)" opacity="0.9" d="M62 34C92 32 104 66 98 100C94 124 80 136 84 152C74 138 84 120 88 104C92 76 84 52 62 34Z" />
        <path fill="url(#wbsGold)" opacity="0.6" d="M68 32C100 36 110 68 104 100C100 122 92 134 96 146C86 136 90 124 94 108C98 80 90 54 68 32Z" />
        <g transform="translate(34 28) scale(0.85)">
          <path fill="url(#wbsGold)" stroke="#fff" strokeWidth="1.5" d="M40 4C30 6 24 14 22 26C22 29 23 31 22.5 33C20 37 16 41 16 43C16 45 19 45.5 22 45.5C21 47 20 49 20 50C21 51 23 51.5 23 52C21 52.5 20 54 20.5 55.5C21.5 57 24 57.5 24 59C24 62 22 65 23.5 67C25 70 30 71 33 70L36 90L50 94C48 84 50 72 53 62C58 42 54 14 40 4Z" />
          <path d="M27 35Q31 38 36 35" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M28 36.5l-3 2M31 37.5l-1 3M34 37l.5 3" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
        </g>
        <path fill="url(#wbsGold)" stroke="#fff" strokeWidth="1.2" d="M56 92C74 96 82 120 84 152C68 142 58 120 52 102Z" />
        <path fill="url(#wbsGold)" d="M84 152L88 148L116 74L110 70Z" />
        <path fill="#141010" d="M108 72H126L142 146L134 152Z" />
        <path fill="url(#wbsGold)" d="M134 152L139 148L174 50L168 50Z" />
        <path fill="url(#wbsGold)" d="M158 46H186V50H158Z" />
      </g>
    </svg>
  );
}