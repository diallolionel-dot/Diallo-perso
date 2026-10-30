import type { Metadata } from "next";
import { Camera, ImageOff, Plus, UtensilsCrossed } from "lucide-react";
import { Suspense } from "react";
import { deleteMeal } from "@/app/actions/tracking";
import { PageHeader } from "@/components/layout/PageHeader";
import { DeleteButton } from "@/components/forms/DeleteButton";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { LinkButton } from "@/components/ui/LinkButton";
import { MacroRing } from "@/components/ui/MacroRing";
import { PhaseNotice } from "@/components/ui/PhaseNotice";
import { Pill } from "@/components/ui/Pill";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Stat } from "@/components/ui/Stat";
import { loadNutrition } from "@/lib/data/nutrition";
import { formatShortDay, weekdayShort } from "@/lib/dates";
import { formatDecimal } from "@/lib/format";

export const metadata: Metadata = { title: "Nutrition" };

export default function NutritionPage() {
  return (
    <>
      <PageHeader eyebrow="Ravitaillement" title="Nutrition" subtitle="Repas, photos, macros et journal." />
      <Suspense fallback={<PageSkeleton />}>
        <NutritionContent />
      </Suspense>
      <PhaseNotice phase={3}>
        Estimation des calories et macros à partir d&apos;une photo, via une fonction serveur. Les estimations resteront
        indicatives et modifiables.
      </PhaseNotice>
    </>
  );
}

async function NutritionContent() {
  const data = await loadNutrition();
  const live = data.mode === "live";
  const { totals, targets } = data;

  return (
    <>
      {live ? null : <DemoBanner />}

      <Card tone="teal">
        <CardHeader
          eyebrow="Bilan du jour"
          title={`${totals.kcal.toLocaleString("fr-FR")} kcal consignées`}
          action={targets.calories ? <Pill>repère {targets.calories.toLocaleString("fr-FR")}</Pill> : null}
        />
        <div className="grid grid-cols-3 gap-2">
          <MacroRing
            label="Protéines"
            center={`${Math.round(totals.proteinG)} g`}
            caption={targets.protein ? `/ ${targets.protein} g` : "objectif à définir"}
            value={targets.protein ? totals.proteinG / targets.protein : 0}
          />
          <Stat label="Glucides" value={Math.round(totals.carbsG)} unit="g" className="self-start" />
          <Stat label="Lipides" value={Math.round(totals.fatG)} unit="g" className="self-start" />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Les repères servent à s&apos;orienter, pas à juger. Aucune XP n&apos;est liée aux calories : seul le fait de
          consigner compte.
        </p>
      </Card>

      <Card>
        <CardHeader
          eyebrow="Journal"
          title="Repas du jour"
          icon={<UtensilsCrossed aria-hidden className="size-4" />}
          action={<Pill>{data.meals.length}</Pill>}
        />
        {data.meals.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun repas consigné aujourd&apos;hui. Une photo et un titre suffisent.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {data.meals.map((meal) => (
              <li key={meal.id} className="flex gap-3 rounded-xl border border-line bg-night-900/70 p-2.5">
                <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-line-strong bg-gradient-to-br from-night-700 to-night-900 text-ink-faint">
                  {meal.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL signée privée : pas d'optimisation ni de cache serveur
                    <img src={meal.photoUrl} alt={`Photo : ${meal.title}`} className="absolute inset-0 size-full object-cover" />
                  ) : meal.hasPhoto ? (
                    <Camera aria-hidden className="size-5" />
                  ) : (
                    <ImageOff aria-hidden className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-teal-400/90">{meal.slotLabel}</p>
                    <p className="tabular text-xs text-ink-muted">{meal.time}</p>
                  </div>
                  <p className="truncate text-sm font-medium text-ink">{meal.title}</p>
                  <p className="mt-0.5 tabular text-xs text-ink-muted">
                    {[
                      meal.kcal !== null ? `${meal.kcal} kcal` : null,
                      meal.proteinG !== null ? `P ${formatDecimal(meal.proteinG, 0)}` : null,
                      meal.carbsG !== null ? `G ${formatDecimal(meal.carbsG, 0)}` : null,
                      meal.fatG !== null ? `L ${formatDecimal(meal.fatG, 0)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Macros non renseignées"}
                  </p>
                </div>
                {live ? <DeleteButton action={deleteMeal} id={meal.id} label="ce repas" /> : null}
              </li>
            ))}
          </ul>
        )}
        <LinkButton href="/nutrition/repas" variant="primary" className="mt-3 w-full">
          <Plus aria-hidden className="size-4" />
          Ajouter un repas
        </LinkButton>
      </Card>

      {data.history.length > 0 ? (
        <Card>
          <CardHeader eyebrow="7 derniers jours" title="Historique" />
          <ul className="divide-y divide-line">
            {data.history.map((d) => (
              <li key={d.day} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink-muted">
                  {weekdayShort(d.day)} {formatShortDay(d.day)}
                </span>
                <span className="tabular text-xs text-ink-soft">
                  {d.kcal.toLocaleString("fr-FR")} kcal · {d.proteinG} g prot. · {d.count} repas
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
