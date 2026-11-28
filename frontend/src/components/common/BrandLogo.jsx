/**
 * The Shaaz mark is intentionally code-native SVG so it stays crisp at every
 * size. The S-shaped flourish reaches up to support the crown, with gentle
 * motion that respects reduced-motion preferences.
 */
export default function BrandLogo({ size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'brand-logo--sm' : size === 'lg' ? 'brand-logo--lg' : 'brand-logo--md'

  return (
    <span className={`brand-logo ${sizeClass} ${className}`} aria-label="Shaaz Ethnicwear">
      <svg viewBox="0 0 100 108" role="img" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="shaazGold" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#fff3b7" />
            <stop offset="0.45" stopColor="#d4af37" />
            <stop offset="1" stopColor="#9c6d0c" />
          </linearGradient>
          <linearGradient id="shaazRed" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f05a72" />
            <stop offset="0.52" stopColor="#9b1313" />
            <stop offset="1" stopColor="#5e0707" />
          </linearGradient>
          <filter id="shaazGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="50" cy="55" r="42" fill="#fff8f0" opacity="0.96" />
        <circle cx="50" cy="55" r="41" fill="none" stroke="url(#shaazGold)" strokeWidth="2.5" />
        <text x="47" y="82" textAnchor="middle" className="brand-logo__letter" fill="url(#shaazRed)">S</text>
        <path className="brand-logo__arm" d="M48 59 C62 62, 69 55, 70 42 C71 36, 68 33, 65 35" fill="none" stroke="url(#shaazRed)" strokeWidth="5.2" strokeLinecap="round" />
        <path className="brand-logo__hand" d="M63 36 C67 32, 72 33, 75 36" fill="none" stroke="#d4af37" strokeWidth="3.4" strokeLinecap="round" />
        <g className="brand-logo__crown" filter="url(#shaazGlow)">
          <path d="M58 29 L61 13 L68 20 L73 9 L79 20 L86 13 L88 29 Z" fill="url(#shaazGold)" stroke="#9c6d0c" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M58 29 H88 L85 35 H61 Z" fill="#d4af37" stroke="#9c6d0c" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="73" cy="25" r="2.5" fill="#9b1313" />
        </g>
        <path className="brand-logo__sparkle" d="M87 42 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5-4 -4-1.5 4-1.5z" fill="#d4af37" />
      </svg>
    </span>
  )
}
