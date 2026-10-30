import type { Metadata } from "next";
import { Camera, LockKeyhole, Ruler, Scale } from "lucide-react";
import { Suspense } from "react";
import { deleteMeasurement, deleteProgressPhoto, deleteWeightEntry } from "@/app/actions/tracking";
import { WeightChart } from "@/components/charts/WeightChart";
import { DeleteButton } from "@/components/forms/DeleteButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { LinkButton } from "@/components/ui/LinkButton";
import { Pill } from "@/components/ui/Pill";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { loadEvolution } from "@/lib/data/evolution";
import { formatShortDay } from "@/lib/dates";
import { formatDecimal, formatDelta } from "@/lib/format";

export const metadata: Metadata = { title: "Évolution" };

export default function EvolutionPage() {
  return (
    <>
      <PageHeader eyebrow="Chroniques" title="Évolution" subtitle="Pesées, mensurations et photos." />
      <Suspense fallback={<PageSkeleton />}>
        <EvolutionContent />
      </Suspense>
    </>
  );
}

async function EvolutionContent() {
  const data = await loadEvolution();
  const live = data.mode === "live";

  return (
    <>
      {live ? null : <DemoBanner />}

      <div className="grid grid-cols-3 gap-2">
        <LinkButton href="/evolution/pesee" variant="primary">
          <Scale aria-hidden className="size-4" /> Pesée
        </LinkButton>
        <LinkButton href="/evolution/mensurations">
          <Ruler aria-hidden className="size-4" /> Mesures
        </LinkButton>
        <LinkButton href="/evolution/photo">
          <Camera aria-hidden className="size-4" /> Photo
        </LinkButton>
      </div>

      <Card tone="teal">
        <CardHeader
          eyebrow="Pesées"
          title="Courbe de poids"
          icon={<Scale aria-hidden className="size-4 text-teal-300" />}
          action={<Pill tone="teal">{data.weights.length} pesée{data.weights.length > 1 ? "s" : ""}</Pill>}
        />
        <WeightChart
          id="evolution-weight"
          entries={data.weights}
          targetKg={data.targetWeightKg ?? 0}
          showTarget={false}
          height={170}
          title="Évolution du poids, échelle resserrée sur les pesées"
        />
        {data.recentWeights.length > 0 ? (
          <ul className="mt-3 divide-y divide-line">
            {data.recentWeights.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                <span className="flex items-center gap-2 text-ink-muted">
                  {w.photoUrl ? (
                    <a href={w.photoUrl} target="_blank" rel="noreferrer" aria-label="Voir la photo de la pesée">
                      {/* eslint-disable-next-line @next/next/no-img-element -- URL signée privée */}
                      <img src={w.photoUrl} alt="" className="size-8 rounded-md object-cover" />
                    </a>
                  ) : null}
                  {formatShortDay(w.date)}
                </span>
                <span className="flex items-center gap-3">
                  {w.delta !== null ? (
                    <span className={cn("tabular text-xs", w.delta <= 0 ? "text-teal-300" : "text-ink-muted")}>{formatDelta(w.delta)}</span>
                  ) : null}
                  <span className="tabular font-semibold text-ink">{formatDecimal(w.weightKg)} kg</span>
                  {live ? <DeleteButton action={deleteWeightEntry} id={w.id} label="cette pesée" /> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          Le poids fluctue d&apos;un jour à l&apos;autre (eau, sel, sommeil) : c&apos;est la tendance qui compte.
        </p>
      </Card>

      <Card>
        <CardHeader eyebrow="Mensurations" title="Depuis le départ" icon={<Ruler aria-hidden className="size-4" />} />
        {data.measurements.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucune mesure pour l&apos;instant. Le tour de taille est le meilleur indicateur.</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.measurements.map((m) => {
              const delta = Math.round((m.latestCm - m.firstCm) * 10) / 10;
              return (
                <li key={m.label} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink-soft">{m.label}</span>
                  <span className="flex items-center gap-3">
                    <span className={cn("tabular text-xs", delta < 0 ? "text-teal-300" : "text-ink-muted")}>
                      {delta === 0 ? "=" : `${formatDelta(delta)} cm`}
                    </span>
                    <span className="tabular font-semibold text-ink">{formatDecimal(m.latestCm)} cm</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {data.measurementEntries.length > 0 ? (
          <details className="mt-3 text-xs text-ink-muted">
            <summary className="cursor-pointer font-semibold text-ink-soft">Relevés récents</summary>
            <ul className="mt-2 divide-y divide-line">
              {data.measurementEntries.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 py-1.5">
                  <span>
                    <span className="font-semibold text-ink-soft">{formatShortDay(e.date)}</span> · {e.summary}
                  </span>
                  <DeleteButton action={deleteMeasurement} id={e.id} label="ce relevé" />
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </Card>

      <Card>
        <CardHeader eyebrow="Photos de progression" title="Galerie privée" icon={<Camera aria-hidden className="size-4" />} />
        {data.photos.length === 0 ? (
          <p className="text-sm text-ink-muted">Une photo face et une de profil toutes les deux semaines suffisent.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {data.photos.map((p) => (
              <figure
                key={p.id}
                className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-xl border border-line-strong bg-gradient-to-b from-night-700 to-night-900"
              >
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL signée privée : pas d'optimisation ni de cache serveur
                  <img src={p.url} alt={`Photo de progression, ${p.pose}, ${formatShortDay(p.date)}`} className="absolute inset-0 size-full object-cover" />
                ) : (
                  <LockKeyhole aria-hidden className="size-6 text-ink-faint" />
                )}
                <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-night-950/75 px-2.5 py-1 text-[0.7rem] text-ink-muted">
                  <span>{p.pose}</span>
                  <span className="flex items-center gap-1">
                    <span className="tabular">{formatShortDay(p.date)}</span>
                    {live ? <DeleteButton action={deleteProgressPhoto} id={p.id} label="cette photo" /> : null}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Stockage privé : chaque photo n&apos;est accessible que par un lien signé valable 10 minutes.
        </p>
      </Card>
    </>
  );
}
