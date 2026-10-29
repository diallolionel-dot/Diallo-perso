import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { levelFromXp, titleForLevel } from "@/lib/rpg/xp";

interface LevelCardProps {
  totalXp: number;
  xpToday: number;
}

export function LevelCard({ totalXp, xpToday }: LevelCardProps) {
  const progress = levelFromXp(totalXp);
  const title = titleForLevel(progress.level);

  return (
    <Card tone="gold">
      <div className="flex items-center gap-4">
        <div className="relative grid size-16 shrink-0 place-items-center">
          <div className="absolute inset-0 rotate-45 rounded-2xl border-2 border-gold-400/70 bg-gradient-to-br from-night-700 to-night-900 shadow-[0_0_24px_-8px_var(--color-gold-400)]" />
          <div className="relative text-center">
            <p className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-gold-300">Niv.</p>
            <p className="font-display text-2xl font-bold leading-none text-gold-200 tabular">{progress.level}</p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-lg font-semibold text-ink">{title}</p>
            <p className="flex items-center gap-1 text-xs font-semibold text-gold-300">
              <Sparkles aria-hidden className="size-3.5" />+{xpToday} XP aujourd&apos;hui
            </p>
          </div>
          <ProgressBar value={progress.ratio} tone="gold" label="Expérience vers le niveau suivant" className="mt-2" />
          <p className="mt-1.5 text-xs text-ink-muted tabular">
            {progress.current} / {progress.required} XP · niveau {progress.level + 1} à {progress.required - progress.current} XP
          </p>
        </div>
      </div>
    </Card>
  );
}
