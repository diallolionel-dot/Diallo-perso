import type { Metadata } from "next";
import { Clock, Dumbbell, Moon, Plus, Swords } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { PhaseNotice } from "@/components/ui/PhaseNotice";
import { Pill } from "@/components/ui/Pill";
import { Stat } from "@/components/ui/Stat";
import { cn } from "@/lib/cn";
import { demoLastWorkout, demoMonthStats, demoWeekPlan, type DemoSessionPlan } from "@/lib/demo/data";

export const metadata: Metadata = { title: "Arène" };

const kindStyles: Record<DemoSessionPlan["kind"], string> = {
  combat: "border-ember-400/40 text-ember-400",
  force: "border-teal-500/40 text-teal-300",
  cardio: "border-gold-500/40 text-gold-300",
  repos: "border-violet-400/40 text-violet-400",
};

function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m.toString().padStart(2, "0")}`;
}

export default function ArenePage() {
  return (
    <>
      <PageHeader eyebrow="Entraînement" title="Arène" subtitle="Séances, exercices, séries, charges." />
      <DemoBanner />

      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Séances" value={demoMonthStats.sessions} hint="ce mois" />
        <Stat label="Temps" value={formatDuration(demoMonthStats.totalMinutes)} hint="cumulé" />
        <Stat label="Repos" value={demoMonthStats.restDays} hint="planifiés" />
      </div>

      <Card>
        <CardHeader eyebrow="Plan de la semaine" title="Feuille de route" icon={<Swords aria-hidden className="size-4" />} />
        <ul className="flex flex-col gap-1.5">
          {demoWeekPlan.map((s) => (
            <li key={s.day} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
              <span className="w-9 text-xs font-semibold uppercase tracking-wider text-ink-muted">{s.day}</span>
              <span
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-lg border bg-night-900/70 px-3 py-2 text-sm font-medium",
                  kindStyles[s.kind],
                )}
              >
                {s.kind === "repos" ? <Moon aria-hidden className="size-4" /> : <Dumbbell aria-hidden className="size-4" />}
                {s.label}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Le repos planifié rapporte de l&apos;XP : la récupération fait partie du programme.
        </p>
      </Card>

      <Card tone="teal">
        <CardHeader
          eyebrow="Dernière séance"
          title={demoLastWorkout.title}
          action={
            <Pill tone="teal" icon={<Clock aria-hidden className="size-3" />}>
              {demoLastWorkout.durationMin} min
            </Pill>
          }
        />
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Exercices, séries et charges de la dernière séance</caption>
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
              {demoLastWorkout.exercises.map((ex) => (
                <tr key={ex.name} className="bg-night-900/60">
                  <th scope="row" className="px-3 py-2.5 font-medium text-ink">
                    {ex.name}
                  </th>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {ex.sets.map((set, i) => (
                        <span key={i} className="tabular rounded-md bg-night-700 px-1.5 py-0.5 text-xs text-ink-soft">
                          {set.reps}
                          {typeof set.reps === "number" ? " rép." : ""}
                          {set.loadKg ? ` × ${set.loadKg.toLocaleString("fr-FR")} kg` : ""}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-muted">Effort ressenti : {demoLastWorkout.perceivedEffort}/10</p>
      </Card>

      <Button variant="primary" disabled className="w-full">
        <Plus aria-hidden className="size-4" />
        Nouvelle séance
      </Button>
      <PhaseNotice phase={2}>
        Création et enregistrement des séances (exercices, séries, charges, durée), photo de séance optionnelle.
      </PhaseNotice>
    </>
  );
}
