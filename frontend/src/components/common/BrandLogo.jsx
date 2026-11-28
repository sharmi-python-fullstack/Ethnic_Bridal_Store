/**
 * The Shaaz mark is intentionally code-native SVG so it stays crisp at every
 * size. The original gold crown sits above the upright S in Shaaz, with a
 * gentle sparkle that respects reduced-motion preferences.
 */
export default function BrandLogo({ size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'brand-logo--sm' : size === 'lg' ? 'brand-logo--lg' : 'brand-logo--md'

  return (
    <span className={`brand-logo ${sizeClass} ${className}`} aria-label="Shaaz Ethnicwear">
      <svg viewBox="0 0 250 112" role="img" aria-hidden="true" focusable="false">
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
        <text x="16" y="85" className="brand-logo__letter" fill="url(#shaazGold)">Shaaz</text>
        <g transform="translate(-36 0)">
          <g className="brand-logo__crown" filter="url(#shaazGlow)">
            <path d="M58 29 L61 13 L68 20 L73 9 L79 20 L86 13 L88 29 Z" fill="url(#shaazGold)" stroke="#9c6d0c" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M58 29 H88 L85 35 H61 Z" fill="#d4af37" stroke="#9c6d0c" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="73" cy="25" r="2.5" fill="#9b1313" />
          </g>
        </g>
        <text x="125" y="106" textAnchor="middle" className="brand-logo__subtitle" fill="#f5e6a3">ETHNICWEAR</text>
        <path className="brand-logo__sparkle" d="M58 18 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5-4 -4-1.5 4-1.5z" fill="#f5e6a3" />
      </svg>
    </span>
  )
}
