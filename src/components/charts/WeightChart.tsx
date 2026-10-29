interface WeightPoint {
  date: string;
  weightKg: number;
}

interface WeightChartProps {
  /** Identifiant unique du graphique dans la page (dégradé SVG). */
  id: string;
  entries: WeightPoint[];
  targetKg: number;
  /** Affiche la ligne d'objectif (échelle étendue jusqu'à l'objectif). */
  showTarget?: boolean;
  height?: number;
  title: string;
}

const WIDTH = 320;
const PAD = { top: 14, right: 12, bottom: 22, left: 30 };

function dayIndex(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

function formatShortDate(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
}

/** Courbe de poids en SVG pur (rendu serveur, sans librairie). */
export function WeightChart({ id, entries, targetKg, showTarget = true, height = 150, title }: WeightChartProps) {
  if (entries.length < 2) {
    return <p className="text-sm text-ink-muted">Au moins deux pesées sont nécessaires pour tracer la courbe.</p>;
  }

  const weights = entries.map((e) => e.weightKg);
  const minW = Math.min(...weights, ...(showTarget ? [targetKg] : []));
  const maxW = Math.max(...weights);
  const yMin = Math.floor(minW - 0.5);
  const yMax = Math.ceil(maxW + 0.5);

  const x0 = dayIndex(entries[0].date);
  const x1 = dayIndex(entries[entries.length - 1].date);
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const sx = (iso: string) => PAD.left + ((dayIndex(iso) - x0) / Math.max(1, x1 - x0)) * innerW;
  const sy = (kg: number) => PAD.top + ((yMax - kg) / (yMax - yMin)) * innerH;

  const points = entries.map((e) => `${sx(e.date).toFixed(1)},${sy(e.weightKg).toFixed(1)}`);
  const linePath = `M${points.join(" L")}`;
  const areaPath = `${linePath} L${sx(entries[entries.length - 1].date).toFixed(1)},${PAD.top + innerH} L${PAD.left},${PAD.top + innerH} Z`;

  const ticks = showTarget ? [yMax, Math.round((yMax + yMin) / 2), yMin] : [yMax, (yMax + yMin) / 2, yMin];
  const last = entries[entries.length - 1];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="h-auto w-full" role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id={`${id}-area`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-teal-400)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-teal-400)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={sy(t)} y2={sy(t)} stroke="var(--color-line)" strokeWidth="1" />
          <text x={PAD.left - 6} y={sy(t)} textAnchor="end" dominantBaseline="central" className="fill-ink-faint text-[9px] tabular">
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </text>
        </g>
      ))}

      {showTarget ? (
        <g>
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={sy(targetKg)}
            y2={sy(targetKg)}
            stroke="var(--color-gold-400)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <text x={WIDTH - PAD.right} y={sy(targetKg) - 5} textAnchor="end" className="fill-gold-300 text-[9px] font-semibold">
            Objectif {targetKg} kg
          </text>
        </g>
      ) : null}

      <path d={areaPath} fill={`url(#${id}-area)`} />
      <path d={linePath} fill="none" stroke="var(--color-teal-400)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={sx(last.date)} cy={sy(last.weightKg)} r="4" fill="var(--color-night-950)" stroke="var(--color-teal-300)" strokeWidth="2" />

      <text x={PAD.left} y={height - 6} className="fill-ink-faint text-[9px]">
        {formatShortDate(entries[0].date)}
      </text>
      <text x={WIDTH - PAD.right} y={height - 6} textAnchor="end" className="fill-ink-faint text-[9px]">
        {formatShortDate(last.date)}
      </text>
    </svg>
  );
}
