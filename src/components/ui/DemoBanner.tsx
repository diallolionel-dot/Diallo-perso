import { FlaskConical } from "lucide-react";
import { DEMO_MODE_LABEL } from "@/lib/demo/data";

/** Bandeau signalant que l'écran affiche des données fictives. */
export function DemoBanner() {
  return (
    <div
      role="note"
      className="flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-400/[0.07] px-3 py-2 text-xs text-ink-soft"
    >
      <FlaskConical aria-hidden className="size-4 shrink-0 text-violet-400" />
      <span>
        <strong className="font-semibold text-violet-400">{DEMO_MODE_LABEL}</strong> — valeurs fictives, rien
        n&apos;est enregistré.
      </span>
    </div>
  );
}
