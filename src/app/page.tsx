import { Beef, Flame, Moon, Swords, Target, Trophy } from "lucide-react";
import { WeightChart } from "@/components/charts/WeightChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { SystemStatus } from "@/components/layout/SystemStatus";
import { BadgeMedal } from "@/components/rpg/BadgeMedal";
import { LevelCard } from "@/components/rpg/LevelCard";
import { QuestList } from "@/components/rpg/QuestList";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Stat } from "@/components/ui/Stat";
import { cn } from "@/lib/cn";
import { formatDecimal } from "@/lib/format";
import {
  demoBadges,
  demoConsistency,
  demoProfile,
  demoQuests,
  demoToday,
  demoWeights,
} from "@/lib/demo/data";
import { consistencyScore, weightGoalProgress } from "@/lib/rpg/xp";

export default function QgPage() {
  const { startWeightKg, targetWeightKg } = demoProfile;
  const current = demoWeights[demoWeights.length - 1].weightKg;
  const lost = startWeightKg - current;
  const remaining = current - targetWeightKg;
  const progress = weightGoalProgress(startWeightKg, current, targetWeightKg);
  const questsDone = demoQuests.filter((q) => q.status === "done").length;
  const regularity = consistencyScore(demoConsistency.map((d) => d.tracked));

  return (
    <>
      <PageHeader
        eyebrow={`Jour ${demoToday.dayNumber} · Saison 1`}
        title="Quartier Général"
        subtitle={`Bon retour, ${demoProfile.displayName}.`}
      />

      <DemoBanner />

      <LevelCard totalXp={demoProfile.totalXp} xpToday={demoToday.xpGainedToday} />

      <Card tone="teal">
        <CardHeader
          eyebrow="Quête principale"
          title={`${startWeightKg} → ${targetWeightKg} kg`}
          icon={<Target aria-hidden className="size-4 text-teal-300" />}
          action={<Pill tone="teal">{Math.round(progress * 100)} %</Pill>}
        />
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-ink-muted">Poids actuel</p>
            <p className="tabular font-display text-4xl font-bold leading-none text-ink">
              {formatDecimal(current)}
              <span className="ml-1 font-sans text-base font-medium text-ink-muted">kg</span>
            </p>
          </div>
          <div className="text-right text-xs leading-relaxed">
            <p className="text-teal-300">
              <span className="tabular font-semibold">−{formatDecimal(lost)} kg</span> depuis le départ
            </p>
            <p className="text-ink-muted">
              encore <span className="tabular font-semibold text-ink-soft">{formatDecimal(remaining)} kg</span>
            </p>
          </div>
        </div>
        <ProgressBar value={progress} label="Progression vers l'objectif de poids" className="mt-3" />
        <div className="mt-3">
          <WeightChart
            id="qg-weight"
            entries={demoWeights}
            targetKg={targetWeightKg}
            title="Évolution du poids depuis le départ, avec la ligne d'objectif"
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          eyebrow="Aujourd'hui"
          title="Résumé du jour"
          icon={<Flame aria-hidden className="size-4" />}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <Stat
            label="Énergie"
            icon={<Flame aria-hidden className="size-3.5" />}
            value={demoToday.caloriesKcal.toLocaleString("fr-FR")}
            unit="kcal"
            hint={`repère ${demoProfile.dailyCaloriesTarget.toLocaleString("fr-FR")} kcal`}
          />
          <Stat
            label="Protéines"
            icon={<Beef aria-hidden className="size-3.5" />}
            value={demoToday.proteinG}
            unit="g"
            hint={`objectif ${demoProfile.dailyProteinTargetG} g`}
          />
          <Stat
            label="Sommeil"
            icon={<Moon aria-hidden className="size-3.5" />}
            value={demoToday.sleepHours.toLocaleString("fr-FR")}
            unit="h"
            hint="nuit dernière"
          />
          <Stat
            label="Arène"
            icon={<Swords aria-hidden className="size-3.5" />}
            value={demoToday.workout.durationMin}
            unit="min"
            hint={demoToday.workout.label}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          eyebrow="Quêtes du jour"
          title="Rituels de suivi"
          icon={<Trophy aria-hidden className="size-4 text-gold-300" />}
          action={
            <Pill tone="gold">
              {questsDone}/{demoQuests.length}
            </Pill>
          }
        />
        <QuestList quests={demoQuests} />
      </Card>

      <Card>
        <CardHeader
          eyebrow="Régularité"
          title={`${regularity} jours suivis sur 7`}
          action={<Pill tone={regularity >= 5 ? "teal" : "neutral"}>{regularity >= 5 ? "Semaine régulière" : "En route"}</Pill>}
        />
        <ol className="grid grid-cols-7 gap-1.5" aria-label="Jours suivis sur les 7 derniers jours">
          {demoConsistency.map((d, i) => (
            <li key={i} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid size-9 w-full place-items-center rounded-lg border text-[0.65rem] font-bold",
                  d.rest
                    ? "border-violet-400/40 bg-violet-400/10 text-violet-400"
                    : d.tracked
                      ? "border-teal-500/50 bg-teal-500/15 text-teal-300"
                      : "border-line bg-night-900 text-ink-faint",
                )}
              >
                {d.rest ? "R" : d.tracked ? "✓" : "·"}
              </span>
              <span className="text-[0.65rem] text-ink-muted">{d.day}</span>
              <span className="sr-only">{d.rest ? "repos planifié" : d.tracked ? "suivi" : "non renseigné"}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Fenêtre glissante : un jour manqué ne remet rien à zéro. Le repos planifié compte comme un jour suivi.
        </p>
      </Card>

      <Card>
        <CardHeader eyebrow="Succès" title="Salle des trophées" />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {demoBadges.map((b) => (
            <BadgeMedal key={b.id} {...b} />
          ))}
        </div>
      </Card>

      <SystemStatus />
    </>
  );
}
