/** Squelette affiché pendant le chargement des données d'un écran. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-[var(--radius-card)] border border-line bg-night-850/70" />
      ))}
    </div>
  );
}
