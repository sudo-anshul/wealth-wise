import Link from 'next/link';

/** The approved W mark and wordmark, shared across public, account, and workspace screens. */
export function WealthWiseLogo({ className = 'logo', markSize = 38 }: { className?: string; markSize?: number }) {
  return <Link className={className} href="/" aria-label="WealthWise home">
    <svg width={markSize} height={markSize * 34 / 38} viewBox="0 0 40 34" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 8 7 18 7-18 7 18 7-18M24 8l7 18 7-18" />
    </svg>
    <span style={{ color: 'inherit' }}>WealthWise<span style={{ color: 'var(--coral)' }}>.</span></span>
  </Link>;
}
