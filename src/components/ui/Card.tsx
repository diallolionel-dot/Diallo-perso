import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardTone = "default" | "gold" | "teal";

const toneClasses: Record<CardTone, string> = {
  default: "border-line before:from-white/[0.04]",
  gold: "border-gold-500/35 before:from-gold-400/[0.10] shadow-[0_0_40px_-20px_var(--color-gold-500)]",
  teal: "border-teal-500/35 before:from-teal-400/[0.08] shadow-[0_0_40px_-20px_var(--color-teal-500)]",
};

interface CardProps extends ComponentPropsWithoutRef<"section"> {
  tone?: CardTone;
}

/** Carte RPG : fond nuit, liseré fin, reflet discret en haut. */
export function Card({ tone = "default", className, children, ...props }: CardProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border bg-night-850/90 p-4",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-b before:to-transparent before:to-40%",
        "animate-rise",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      <div className="relative">{children}</div>
    </section>
  );
}

interface CardHeaderProps {
  title: string;
  eyebrow?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, eyebrow, icon, action }: CardHeaderProps) {
  return (
    <header className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon ? (
          <span className="grid size-8 place-items-center rounded-lg border border-line-strong bg-night-800 text-ink-soft">
            {icon}
          </span>
        ) : null}
        <div>
          {eyebrow ? (
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-muted">{eyebrow}</p>
          ) : null}
          <h2 className="font-display text-[0.95rem] font-semibold tracking-wide text-ink">{title}</h2>
        </div>
      </div>
      {action}
    </header>
  );
}
