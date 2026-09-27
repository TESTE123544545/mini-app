/**
 * The Veias da Sintonia logo, from the owner's artwork: the gold interlocking-hearts mark and the
 * serif name. The name is drawn as a mask filled with the current text colour, so it stays exact to
 * the logo and still reads as navy on the ivory theme or gold on the celestial navy theme.
 */
export function BrandLockup({ stacked = false, className = "" }: { stacked?: boolean; className?: string }) {
  return <span className={`brand-lockup${stacked ? " brand-lockup--stacked" : ""} ${className}`}>
    {/* eslint-disable-next-line @next/next/no-img-element -- the small pre-sized logo mark */}
    <img className="brand-mark-img" src="/brand/logo-mark-gold.webp" alt="" width={270} height={270}/>
    <span className="brand-wordmark" role="img" aria-label="veias da sintonia"/>
  </span>;
}

/** The thin line–sparkle–line divider used across the brand pieces. */
export function BrandOrnament({ className = "" }: { className?: string }) {
  return <span className={`brand-ornament ${className}`} aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0 L13.6 10.4 L24 12 L13.6 13.6 L12 24 L10.4 13.6 L0 12 L10.4 10.4 Z"/></svg>
  </span>;
}
