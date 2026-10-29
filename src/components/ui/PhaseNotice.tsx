import { Lock } from "lucide-react";
import type { ReactNode } from "react";

interface PhaseNoticeProps {
  phase: number;
  children: ReactNode;
}

/** Signale clairement une fonctionnalité pas encore active. */
export function PhaseNotice({ phase, children }: PhaseNoticeProps) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-dashed border-line-strong bg-night-900/60 px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
      <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
      <span>
        <span className="font-semibold text-ink-soft">Phase {phase} · </span>
        {children}
      </span>
    </p>
  );
}
