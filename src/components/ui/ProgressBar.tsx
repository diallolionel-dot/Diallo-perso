import { cn } from "@/lib/cn";

type BarTone = "teal" | "gold";

const fillClasses: Record<BarTone, string> = {
  teal: "from-teal-600 via-teal-400 to-teal-300 shadow-[0_0_12px_-2px_var(--color-teal-400)]",
  gold: "from-gold-600 via-gold-400 to-gold-200 shadow-[0_0_12px_-2px_var(--color-gold-400)]",
};

interface ProgressBarProps {
  /** Valeur entre 0 et 1. */
  value: number;
  tone?: BarTone;
  label: string;
  size?: "sm" | "md";
  className?: string;
}

/** Barre de progression (XP en or, progression physique en turquoise). */
export function ProgressBar({ value, tone = "teal", label, size = "md", className }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className={cn(
        "relative w-full overflow-hidden rounded-full border border-line bg-night-950",
        size === "sm" ? "h-1.5" : "h-2.5",
        className,
      )}
    >
      <div className="h-full origin-left" style={{ width: `${clamped * 100}%` }}>
        <div className={cn("h-full w-full origin-left animate-bar-fill rounded-full bg-gradient-to-r", fillClasses[tone])} />
      </div>
    </div>
  );
}
