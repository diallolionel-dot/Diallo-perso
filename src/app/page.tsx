import { Beef, Flame, HeartPulse, Moon, Scale, Settings, Swords, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { WeightChart } from "@/components/charts/WeightChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { SystemStatus } from "@/components/layout/SystemStatus";
import { BadgeMedal } from "@/components/rpg/BadgeMedal";
import { LevelCard } from "@/components/rpg/LevelCard";
import { QuestList } from "@/components/rpg/QuestList";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { LinkButton } from "@/components/ui/LinkButton";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Stat } from "@/components/ui/Stat";
import { cn } from "@/lib/cn";
import { loadDashboard } from "@/lib/data/dashboard";
import type { DashboardData } from "@/lib/data/types";
import { formatDecimal } from "@/lib/format";
import { consistencyScore, weightGoalProgress } from "@/lib/rpg/xp";

/** Seuil de douleur à partir duquel le QG propose le mode récupération. */
const PAIN_ALERT_LEVEL = 4;

export default function QgPage() {
  return (
    <>
      <PageHeader
        eyebrow="Saison 1"
        title="Quartier Général"
        aside={
          <Link
            href="/profil"
            aria-label="Profil et réglages"
            className="grid size-11 place-items-center rounded-xl border border-line-strong bg-night-850 text-ink-soft hover:text-ink"
          >
            <Settings aria-hidden className="size-5" />
          </Link>
        }
      />
      <Suspense fallback={<PageSkeleton cards={4} />}>
        <Dashboard />
      </Suspense>
      <SystemStatus />
    </>
  );
}

async function Dashboard() {
  const data = await loadDashboard();
  const live = data.mode === "live";

  return (
    <>
      <p className="-mt-2 text-sm text-ink-muted">
        {data.dayNumber ? `Jour ${data.dayNumber} · ` : ""}
        {data.displayName ? `Bon retour, ${data.displayName}.` : "Bon retour."}
      </p>

      {live ? null : <DemoBanner />}

      {data.today.painLevel !== null && data.today.painLevel >= PAIN_ALERT_LEVEL ? (
        <Card tone="gold" role="note">
          <div className="flex items-start gap-3">
            <HeartPulse aria-hidden className="mt-0.5 size-5 shrink-0 text-ember-400" />
            <div className="text-sm leading-relaxed">
              <p className="font-semibold text-ink">Mode récupération · douleur {data.today.painLevel}/10</p>
              <p className="text-ink-muted">
                Pas d&apos;intensité aujourd&apos;hui : repos planifié ou mobilité douce. Si la douleur persiste ou
                s&apos;aggrave, consulte un professionnel de santé.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <LevelCard totalXp={data.totalXp} xpToday={data.xpToday} />

      <MainQuest data={data} />

      <Card>
        <CardHeader eyebrow="Aujourd'hui" title="Résumé du jour" icon={<Flame aria-hidden className="size-4" />} />
        <div className="grid grid-cols-2 gap-2.5">
          <Stat
            label="Énergie"
            icon={<Flame aria-hidden className="size-3.5" />}
            value={data.today.caloriesKcal.toLocaleString("fr-FR")}
            unit="kcal"
            hint={data.targets.calories ? `repère ${data.targets.calories.toLocaleString("fr-FR")} kcal` : `${data.today.mealsCount} repas`}
          />
          <Stat
            label="Protéines"
            icon={<Beef aria-hidden className="size-3.5" />}
            value={data.today.proteinG}
            unit="g"
            hint={data.targets.protein ? `objectif ${data.targets.protein} g` : undefined}
          />
          <Stat
            label="Sommeil"
            icon={<Moon aria-hidden className="size-3.5" />}
            value={data.today.sleepHours === null ? "—" : formatDecimal(data.today.sleepHours)}
            unit={data.today.sleepHours === null ? undefined : "h"}
            hint={data.today.sleepHours === null ? "à renseigner au check-in" : "nuit dernière"}
          />
          <Stat
            label="Arène"
            icon={<Swords aria-hidden className="size-3.5" />}
            value={data.today.workout ? data.today.workout.durationMin : data.today.plannedRest ? "Repos" : "—"}
            unit={data.today.workout ? "min" : undefined}
            hint={data.today.workout?.label ?? (data.today.plannedRest ? "planifié" : "pas encore de séance")}
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
              {data.quests.filter((q) => q.status === "done").length}/{data.quests.length}
            </Pill>
          }
        />
        <QuestList quests={data.quests} interactive={live} />
      </Card>

      <Consistency days={data.consistency} />

      <Card>
        <CardHeader eyebrow="Succès" title="Salle des trophées" />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {data.achievements.map((a) => (
            <BadgeMedal key={a.code} {...a} />
          ))}
        </div>
      </Card>
    </>
  );
}

function MainQuest({ data }: { data: DashboardData }) {
  const current = data.weights.at(-1)?.weightKg ?? null;
  const { startWeightKg: start, targetWeightKg: target } = data;

  if (start === null || target === null || current === null) {
    return (
      <Card tone="teal">
        <CardHeader eyebrow="Quête principale" title="Prépare ta quête" icon={<Target aria-hidden className="size-4 text-teal-300" />} />
        <p className="text-sm leading-relaxed text-ink-muted">
          {target === null
            ? "Renseigne ton poids de départ et ton objectif dans le profil pour suivre ta progression."
            : "Enregistre une première pesée pour lancer la courbe."}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <LinkButton href="/evolution/pesee" variant="primary">
            <Scale aria-hidden className="size-4" /> Pesée
          </LinkButton>
          <LinkButton href="/profil">
            <Settings aria-hidden className="size-4" /> Profil
          </LinkButton>
        </div>
      </Card>
    );
  }

  const progress = weightGoalProgress(start, current, target);
  const lost = start - current;

  return (
    <Card tone="teal">
      <CardHeader
        eyebrow="Quête principale"
        title={`${formatDecimal(start, 0)} → ${formatDecimal(target, 0)} kg`}
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
          {lost > 0 ? (
            <p className="text-teal-300">
              <span className="tabular font-semibold">−{formatDecimal(lost)} kg</span> depuis le départ
            </p>
          ) : (
            <p className="text-ink-muted">Le départ est posé.</p>
          )}
          <p className="text-ink-muted">
            encore <span className="tabular font-semibold text-ink-soft">{formatDecimal(Math.max(0, current - target))} kg</span>
          </p>
        </div>
      </div>
      <ProgressBar value={progress} label="Progression vers l'objectif de poids" className="mt-3" />
      <div className="mt-3">
        <WeightChart id="qg-weight" entries={data.weights} targetKg={target} title="Évolution du poids, avec la ligne d'objectif" />
      </div>
    </Card>
  );
}

function Consistency({ days }: { days: DashboardData["consistency"] }) {
  const regularity = consistencyScore(days.map((d) => d.tracked));
  return (
    <Card>
      <CardHeader
        eyebrow="Régularité"
        title={`${regularity} jour${regularity > 1 ? "s" : ""} suivi${regularity > 1 ? "s" : ""} sur 7`}
        action={<Pill tone={regularity >= 5 ? "teal" : "neutral"}>{regularity >= 5 ? "Semaine régulière" : "En route"}</Pill>}
      />
      <ol className="grid grid-cols-7 gap-1.5" aria-label="Jours suivis sur les 7 derniers jours">
        {days.map((d) => (
          <li key={d.date} className="flex flex-col items-center gap-1.5">
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
  );
}
