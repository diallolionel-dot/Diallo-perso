import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, aside }: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-4 pt-2">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-teal-400/90">{eyebrow}</p>
        <h1 className="font-display text-[1.65rem] font-bold leading-tight tracking-wide text-ink">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      {aside}
    </header>
  );
}
