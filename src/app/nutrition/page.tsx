import type { Metadata } from "next";
import { Camera, ImageOff, Plus, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { MacroRing } from "@/components/ui/MacroRing";
import { PhaseNotice } from "@/components/ui/PhaseNotice";
import { Pill } from "@/components/ui/Pill";
import { demoMeals, demoProfile } from "@/lib/demo/data";

export const metadata: Metadata = { title: "Nutrition" };

const MACRO_REFERENCES = { carbsG: 230, fatG: 70 };

export default function NutritionPage() {
  const totals = demoMeals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      proteinG: acc.proteinG + m.proteinG,
      carbsG: acc.carbsG + m.carbsG,
      fatG: acc.fatG + m.fatG,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  return (
    <>
      <PageHeader eyebrow="Ravitaillement" title="Nutrition" subtitle="Repas, photos, macros et journal." />
      <DemoBanner />

      <Card tone="teal">
        <CardHeader
          eyebrow="Bilan du jour"
          title={`${totals.kcal.toLocaleString("fr-FR")} kcal consignées`}
          action={<Pill>repère {demoProfile.dailyCaloriesTarget.toLocaleString("fr-FR")}</Pill>}
        />
        <div className="grid grid-cols-3 gap-2">
          <MacroRing
            label="Protéines"
            center={`${totals.proteinG} g`}
            caption={`/ ${demoProfile.dailyProteinTargetG} g`}
            value={totals.proteinG / demoProfile.dailyProteinTargetG}
          />
          <MacroRing
            label="Glucides"
            center={`${totals.carbsG} g`}
            caption={`/ ${MACRO_REFERENCES.carbsG} g`}
            value={totals.carbsG / MACRO_REFERENCES.carbsG}
            tone="gold"
          />
          <MacroRing
            label="Lipides"
            center={`${totals.fatG} g`}
            caption={`/ ${MACRO_REFERENCES.fatG} g`}
            value={totals.fatG / MACRO_REFERENCES.fatG}
            tone="gold"
          />
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
        />
        <ul className="flex flex-col gap-2.5">
          {demoMeals.map((meal) => (
            <li key={meal.id} className="flex gap-3 rounded-xl border border-line bg-night-900/70 p-2.5">
              <div
                className="grid size-16 shrink-0 place-items-center rounded-lg border border-line-strong bg-gradient-to-br from-night-700 to-night-900 text-ink-faint"
                aria-hidden
              >
                {meal.hasPhoto ? <Camera className="size-5" /> : <ImageOff className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-teal-400/90">{meal.slot}</p>
                  <p className="tabular text-xs text-ink-muted">{meal.time}</p>
                </div>
                <p className="truncate text-sm font-medium text-ink">{meal.title}</p>
                <p className="mt-0.5 tabular text-xs text-ink-muted">
                  {meal.kcal} kcal · P {meal.proteinG} · G {meal.carbsG} · L {meal.fatG}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="primary" disabled>
            <Camera aria-hidden className="size-4" />
            Photo repas
          </Button>
          <Button disabled>
            <Plus aria-hidden className="size-4" />
            Saisie manuelle
          </Button>
        </div>
      </Card>

      <PhaseNotice phase={2}>
        Enregistrement des repas et stockage privé des photos dans Supabase (URLs signées).
      </PhaseNotice>
      <PhaseNotice phase={3}>
        Estimation des calories et macros à partir d&apos;une photo, via une fonction serveur. Les estimations
        resteront indicatives et modifiables.
      </PhaseNotice>
    </>
  );
}
