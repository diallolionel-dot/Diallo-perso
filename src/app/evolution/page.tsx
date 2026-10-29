import type { Metadata } from "next";
import { Camera, LockKeyhole, Ruler, Scale } from "lucide-react";
import { WeightChart } from "@/components/charts/WeightChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { PhaseNotice } from "@/components/ui/PhaseNotice";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { formatDecimal, formatDelta } from "@/lib/format";
import { demoMeasurements, demoPhotoSlots, demoProfile, demoWeights } from "@/lib/demo/data";

export const metadata: Metadata = { title: "Évolution" };

function formatDate(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
}

export default function EvolutionPage() {
  const recent = [...demoWeights].reverse().slice(0, 6);

  return (
    <>
      <PageHeader eyebrow="Chroniques" title="Évolution" subtitle="Pesées, mensurations et photos." />
      <DemoBanner />

      <Card tone="teal">
        <CardHeader
          eyebrow="Pesées"
          title="Courbe de poids"
          icon={<Scale aria-hidden className="size-4 text-teal-300" />}
          action={<Pill tone="teal">{demoWeights.length} pesées</Pill>}
        />
        <WeightChart
          id="evolution-weight"
          entries={demoWeights}
          targetKg={demoProfile.targetWeightKg}
          showTarget={false}
          height={170}
          title="Évolution du poids, échelle resserrée sur les pesées"
        />
        <ul className="mt-3 divide-y divide-line">
          {recent.map((w, i) => {
            const previous = recent[i + 1];
            const delta = previous ? w.weightKg - previous.weightKg : null;
            return (
              <li key={w.date} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink-muted">{formatDate(w.date)}</span>
                <span className="flex items-center gap-3">
                  {delta !== null ? (
                    <span className={cn("tabular text-xs", delta <= 0 ? "text-teal-300" : "text-ink-muted")}>
                      {formatDelta(delta)}
                    </span>
                  ) : null}
                  <span className="tabular font-semibold text-ink">{formatDecimal(w.weightKg)} kg</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          Le poids fluctue d&apos;un jour à l&apos;autre (eau, sel, sommeil) : c&apos;est la tendance qui compte.
        </p>
      </Card>

      <Card>
        <CardHeader eyebrow="Mensurations" title="Depuis le départ" icon={<Ruler aria-hidden className="size-4" />} />
        <ul className="divide-y divide-line">
          {demoMeasurements.map((m) => {
            const delta = m.currentCm - m.startCm;
            return (
              <li key={m.label} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-ink-soft">{m.label}</span>
                <span className="flex items-center gap-3">
                  <span className={cn("tabular text-xs", delta < 0 ? "text-teal-300" : "text-ink-muted")}>
                    {delta === 0 ? "=" : `${formatDelta(delta)} cm`}
                  </span>
                  <span className="tabular font-semibold text-ink">{m.currentCm.toLocaleString("fr-FR")} cm</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardHeader
          eyebrow="Photos de progression"
          title="Galerie privée"
          icon={<Camera aria-hidden className="size-4" />}
        />
        <div className="grid grid-cols-2 gap-2.5">
          {demoPhotoSlots.map((p) => (
            <figure
              key={p.id}
              className="relative grid aspect-[3/4] place-items-center rounded-xl border border-line-strong bg-gradient-to-b from-night-700 to-night-900"
            >
              <LockKeyhole aria-hidden className="size-6 text-ink-faint" />
              <figcaption className="absolute inset-x-0 bottom-0 flex justify-between rounded-b-xl bg-night-950/70 px-2.5 py-1.5 text-[0.7rem] text-ink-muted">
                <span>{p.label}</span>
                <span className="tabular">{formatDate(p.date)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="primary" disabled>
            <Scale aria-hidden className="size-4" />
            Nouvelle pesée
          </Button>
          <Button disabled>
            <Camera aria-hidden className="size-4" />
            Photo
          </Button>
        </div>
      </Card>

      <PhaseNotice phase={2}>
        Saisie des pesées et mensurations, photos stockées dans un bucket Supabase privé, affichées via des URLs
        signées à durée limitée.
      </PhaseNotice>
    </>
  );
}
