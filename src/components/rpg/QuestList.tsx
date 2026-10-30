import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import Link from "next/link";
import type { Quest } from "@/lib/rpg/quests";
import { cn } from "@/lib/cn";

/** Quêtes du jour. Une quête à faire mène directement au formulaire concerné. */
export function QuestList({ quests, interactive }: { quests: Quest[]; interactive: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {quests.map((q) => {
        const done = q.status === "done";
        const content = (
          <>
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
          </>
        );
        return (
          <li key={q.id} className="py-2.5 first:pt-0 last:pb-0">
            {interactive && !done ? (
              <Link href={q.href} className="-mx-1 flex items-center gap-3 rounded-lg px-1 hover:bg-night-800/60">
                {content}
                <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-faint" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
