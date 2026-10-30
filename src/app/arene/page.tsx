import type { Metadata } from "next";
import { Clock, Dumbbell, Moon, Plus, Swords } from "lucide-react";
import { Suspense } from "react";
import { deleteWorkout } from "@/app/actions/tracking";
import { DeleteButton } from "@/components/forms/DeleteButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { LinkButton } from "@/components/ui/LinkButton";
import { Pill } from "@/components/ui/Pill";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Stat } from "@/components/ui/Stat";
import { cn } from "@/lib/cn";
import { loadArena } from "@/lib/data/arena";
import type { SessionView } from "@/lib/data/types";
import { formatShortDay, weekdayShort } from "@/lib/dates";
import { formatDecimal, formatDuration } from "@/lib/format";
import { WORKOUT_KIND_LABELS } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Arène" };

const kindStyles: Record<SessionView["kind"], string> = {
  combat: "border-ember-400/40 text-ember-400",
  force: "border-teal-500/40 text-teal-300",
  cardio: "border-gold-500/40 text-gold-300",
  mobilite: "border-teal-500/30 text-teal-200",
  repos: "border-violet-400/40 text-violet-400",
};

function formatSet(set: SessionView["exercises"][number]["sets"][number]): string {
  const parts: string[] = [];
  if (set.reps !== undefined) parts.push(`${set.reps} rép.`);
  if (set.durationS !== undefined) parts.push(`${set.durationS} s`);
  if (set.loadKg !== undefined) parts.push(`× ${formatDecimal(set.loadKg, set.loadKg % 1 === 0 ? 0 : 1)} kg`);
  return parts.join(" ");
}

export default function ArenePage() {
  return (
    <>
      <PageHeader eyebrow="Entraînement" title="Arène" subtitle="Séances, exercices, séries, charges." />
      <Suspense fallback={<PageSkeleton />}>
        <ArenaContent />
      </Suspense>
    </>
  );
}

async function ArenaContent() {
  const data = await loadArena();
  const live = data.mode === "live";

  return (
    <>
      {live ? null : <DemoBanner />}

      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Séances" value={data.monthStats.sessions} hint="ce mois" />
        <Stat label="Temps" value={formatDuration(data.monthStats.totalMinutes)} hint="cumulé" />
        <Stat label="Repos" value={data.monthStats.restDays} hint="planifiés" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <LinkButton href="/arene/seance" variant="primary">
          <Plus aria-hidden className="size-4" /> Séance
        </LinkButton>
        <LinkButton href="/arene/seance?type=repos">
          <Moon aria-hidden className="size-4" /> Repos planifié
        </LinkButton>
      </div>

      <Card>
        <CardHeader
          eyebrow={live ? "Semaine en cours" : "Plan de la semaine"}
          title={live ? "Feuille de route" : "Feuille de route (exemple)"}
          icon={<Swords aria-hidden className="size-4" />}
        />
        <ul className="flex flex-col gap-1.5">
          {data.week.map((s) => (
            <li key={s.day} className="flex items-center gap-3 rounded-lg px-1 py-1">
              <span className={cn("w-9 text-xs font-semibold uppercase tracking-wider", s.isToday ? "text-teal-300" : "text-ink-muted")}>
                {s.day}
              </span>
              {s.label && s.kind ? (
                <span className={cn("flex flex-1 items-center gap-2 rounded-lg border bg-night-900/70 px-3 py-2 text-sm font-medium", kindStyles[s.kind])}>
                  {s.kind === "repos" ? <Moon aria-hidden className="size-4" /> : <Dumbbell aria-hidden className="size-4" />}
                  <span className="truncate">{s.label}</span>
                </span>
              ) : (
                <span className="flex-1 rounded-lg border border-dashed border-line px-3 py-2 text-sm text-ink-faint">—</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Le repos planifié rapporte de l&apos;XP : la récupération fait partie du programme.
        </p>
      </Card>

      {data.sessions.length === 0 ? (
        <Card>
          <CardHeader eyebrow="Historique" title="Aucune séance pour l'instant" />
          <p className="text-sm text-ink-muted">Ta première entrée dans l&apos;arène t&apos;attend.</p>
        </Card>
      ) : (
        data.sessions.map((session, index) => <SessionCard key={session.id} session={session} highlight={index === 0} live={live} />)
      )}
    </>
  );
}

function SessionCard({ session, highlight, live }: { session: SessionView; highlight: boolean; live: boolean }) {
  const isRest = session.kind === "repos";
  return (
    <Card tone={highlight ? "teal" : "default"}>
      <CardHeader
        eyebrow={`${weekdayShort(session.date)} ${formatShortDay(session.date)} · ${WORKOUT_KIND_LABELS[session.kind]}`}
        title={session.title}
        action={
          <div className="flex items-center gap-1">
            {isRest ? (
              <Pill tone="violet">Repos</Pill>
            ) : (
              <Pill tone="teal" icon={<Clock aria-hidden className="size-3" />}>
                {formatDuration(session.durationMin)}
              </Pill>
            )}
            {live ? <DeleteButton action={deleteWorkout} id={session.id} label="cette séance" /> : null}
          </div>
        }
      />
      {session.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL signée privée : pas d'optimisation ni de cache serveur
        <img src={session.photoUrl} alt={`Photo de la séance ${session.title}`} className="mb-3 max-h-56 w-full rounded-xl object-cover" />
      ) : null}
      {session.exercises.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Exercices, séries et charges</caption>
            <thead className="bg-night-800 text-[0.68rem] uppercase tracking-wider text-ink-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Exercice
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Séries
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {session.exercises.map((ex, i) => (
                <tr key={`${ex.name}-${i}`} className="bg-night-900/60">
                  <th scope="row" className="px-3 py-2.5 font-medium text-ink">
                    {ex.name}
                  </th>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {ex.sets.map((set, j) => (
                        <span key={j} className="tabular rounded-md bg-night-700 px-1.5 py-0.5 text-xs text-ink-soft">
                          {formatSet(set)}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {session.perceivedEffort ? <p className="mt-2 text-xs text-ink-muted">Effort ressenti : {session.perceivedEffort}/10</p> : null}
    </Card>
  );
}
