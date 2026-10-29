import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StatProps {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Tuile de statistique compacte. */
export function Stat({ label, value, unit, hint, icon, className }: StatProps) {
  return (
    <div className={cn("rounded-xl border border-line bg-night-900/70 p-3", className)}>
      <div className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-wider text-ink-muted">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1.5 tabular text-xl font-semibold text-ink">
        {value}
        {unit ? <span className="ml-1 text-xs font-medium text-ink-muted">{unit}</span> : null}
      </p>
      {hint ? <div className="mt-0.5 text-xs text-ink-muted">{hint}</div> : null}
    </div>
  );
}
