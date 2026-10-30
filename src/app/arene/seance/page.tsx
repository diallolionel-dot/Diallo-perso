import type { Metadata } from "next";
import { createWorkout } from "@/app/actions/tracking";
import { WorkoutForm } from "@/components/forms/WorkoutForm";
import { FormPage } from "@/components/layout/FormPage";
import { getFormContext } from "@/lib/data/form-context";

export const metadata: Metadata = { title: "Nouvelle séance" };

export default function SeancePage({ searchParams }: PageProps<"/arene/seance">) {
  return (
    <FormPage eyebrow="Arène" title="Nouvelle séance" subtitle="Séance ou repos planifié : les deux comptent." back="/arene">
      <WorkoutFormLoader searchParams={searchParams} />
    </FormPage>
  );
}

async function WorkoutFormLoader({ searchParams }: Pick<PageProps<"/arene/seance">, "searchParams">) {
  const [ctx, params] = await Promise.all([getFormContext(), searchParams]);
  return (
    <WorkoutForm
      action={createWorkout}
      nowLocal={ctx.nowLocal}
      initialKind={params.type === "repos" ? "repos" : "combat"}
      disabledReason={ctx.disabledReason}
    />
  );
}
