import { CheckCircle2, Circle } from "lucide-react";
import type { DemoQuest } from "@/lib/demo/data";
import { cn } from "@/lib/cn";

/** Quêtes du jour (lecture seule en phase 1). */
export function QuestList({ quests }: { quests: DemoQuest[] }) {
  return (
    <ul className="divide-y divide-line">
      {quests.map((q) => {
        const done = q.status === "done";
        return (
          <li key={q.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            {done ? (
              <CheckCircle2 aria-hidden className="size-5 shrink-0 text-teal-400" />
            ) : (
              <Circle aria-hidden className="size-5 shrink-0 text-ink-faint" />
            )}
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", done ? "text-ink-soft" : "text-ink")}>{q.label}</p>
              <p className="text-xs text-ink-muted">{q.hint}</p>
            </div>
            <span className={cn("tabular text-xs font-bold", done ? "text-gold-400" : "text-ink-faint")}>+{q.xp} XP</span>
            <span className="sr-only">{done ? "accomplie" : "à faire"}</span>
          </li>
        );
      })}
    </ul>
  );
}
