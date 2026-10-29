interface MacroRingProps {
  /** Valeur entre 0 et 1. */
  value: number;
  size?: number;
  label: string;
  center: string;
  caption?: string;
  tone?: "teal" | "gold";
}

/** Anneau de progression SVG (rendu serveur, sans dépendance). */
export function MacroRing({ value, size = 76, label, center, caption, tone = "teal" }: MacroRingProps) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, value));
  const color = tone === "teal" ? "var(--color-teal-400)" : "var(--color-gold-400)";

  return (
    <figure className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label} : ${center}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-night-700)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-ink text-[13px] font-semibold tabular"
        >
          {center}
        </text>
      </svg>
      <figcaption className="text-center">
        <span className="block text-xs font-semibold text-ink-soft">{label}</span>
        {caption ? <span className="block text-[0.7rem] text-ink-muted">{caption}</span> : null}
      </figcaption>
    </figure>
  );
}
