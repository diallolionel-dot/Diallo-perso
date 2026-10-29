import { Lock, Shield } from "lucide-react";
import type { BadgeRarity } from "@/lib/demo/data";
import { cn } from "@/lib/cn";

const rarityClasses: Record<BadgeRarity, string> = {
  commun: "border-ink-faint/50 text-ink-soft",
  rare: "border-teal-500/60 text-teal-300 shadow-[0_0_18px_-6px_var(--color-teal-400)]",
  épique: "border-violet-400/60 text-violet-400 shadow-[0_0_18px_-6px_var(--color-violet-400)]",
  légendaire: "border-gold-400/70 text-gold-300 shadow-[0_0_22px_-6px_var(--color-gold-400)]",
};

interface BadgeMedalProps {
  name: string;
  description: string;
  rarity: BadgeRarity;
  unlocked: boolean;
}

/** Médaille de succès. Verrouillée = silhouette discrète, jamais culpabilisante. */
export function BadgeMedal({ name, description, rarity, unlocked }: BadgeMedalProps) {
  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-center" title={description}>
      <div
        className={cn(
          "relative grid size-14 place-items-center rotate-45 rounded-xl border-2 bg-night-800",
          unlocked ? rarityClasses[rarity] : "border-line-strong text-ink-faint",
        )}
      >
        <span className="-rotate-45">
          {unlocked ? (
            <Shield aria-hidden className={cn("size-6", rarity === "légendaire" && "animate-glint")} />
          ) : (
            <Lock aria-hidden className="size-5" />
          )}
        </span>
      </div>
      <p className={cn("mt-1 text-[0.7rem] font-semibold leading-tight", unlocked ? "text-ink" : "text-ink-muted")}>{name}</p>
      <p className="text-[0.6rem] uppercase tracking-wider text-ink-faint">{rarity}</p>
      <span className="sr-only">{unlocked ? "Débloqué" : "À débloquer"} : {description}</span>
    </div>
  );
}
