/** The Veias da Sintonia lockup: the interlocking-hearts mark and the lowercase serif name. */
export function BrandLockup({ stacked = false, className = "" }: { stacked?: boolean; className?: string }) {
  return <span className={`brand-lockup${stacked ? " brand-lockup--stacked" : ""} ${className}`}>
    {/* eslint-disable-next-line @next/next/no-img-element -- a tiny static SVG mark */}
    <img src="/brand/mark.svg" alt="" width={stacked ? 64 : 30} height={stacked ? 64 : 30}/>
    <span>veias da{stacked ? <br/> : " "}sintonia</span>
  </span>;
}

/** The thin line–sparkle–line divider used across the brand pieces. */
export function BrandOrnament({ className = "" }: { className?: string }) {
  return <span className={`brand-ornament ${className}`} aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0 L13.6 10.4 L24 12 L13.6 13.6 L12 24 L10.4 13.6 L0 12 L10.4 10.4 Z"/></svg>
  </span>;
}
