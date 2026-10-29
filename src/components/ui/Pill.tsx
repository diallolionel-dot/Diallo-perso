import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PillTone = "neutral" | "gold" | "teal" | "ember" | "violet";

const toneClasses: Record<PillTone, string> = {
  neutral: "border-line-strong bg-night-800 text-ink-soft",
  gold: "border-gold-500/40 bg-gold-500/10 text-gold-300",
  teal: "border-teal-500/40 bg-teal-500/10 text-teal-300",
  ember: "border-ember-400/40 bg-ember-400/10 text-ember-400",
  violet: "border-violet-400/40 bg-violet-400/10 text-violet-400",
};

interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  icon?: ReactNode;
  className?: string;
}

export function Pill({ children, tone = "neutral", icon, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
