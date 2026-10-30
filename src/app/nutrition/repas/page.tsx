import type { Metadata } from "next";
import { createMeal } from "@/app/actions/tracking";
import { ActionForm } from "@/components/forms/ActionForm";
import { ChoiceField, NumberField, TextAreaField, TextField } from "@/components/forms/fields";
import { PhotoField } from "@/components/forms/PhotoField";
import { FormPage } from "@/components/layout/FormPage";
import { getFormContext } from "@/lib/data/form-context";
import { MEAL_SLOTS, MEAL_SLOT_LABELS } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Nouveau repas" };

/** Moment du repas le plus probable selon l'heure locale. */
function guessSlot(nowLocal: string): (typeof MEAL_SLOTS)[number] {
  const hour = Number(nowLocal.slice(11, 13));
  if (hour < 11) return "petit_dejeuner";
  if (hour < 15) return "dejeuner";
  if (hour < 18) return "collation";
  return "diner";
}

export default function RepasPage() {
  return (
    <FormPage eyebrow="Nutrition" title="Nouveau repas" subtitle="Une photo et un titre suffisent." back="/nutrition">
      <MealForm />
    </FormPage>
  );
}

async function MealForm() {
  const ctx = await getFormContext();
  return (
    <ActionForm action={createMeal} submitLabel="Enregistrer le repas" disabledReason={ctx.disabledReason}>
      <PhotoField label="Photo du repas" />
      <ChoiceField
        name="slot"
        label="Moment"
        columns={2}
        defaultValue={guessSlot(ctx.nowLocal)}
        options={MEAL_SLOTS.map((s) => ({ value: s, label: MEAL_SLOT_LABELS[s] }))}
      />
      <TextField name="title" label="Repas" placeholder="Poulet, riz, haricots verts" maxLength={160} required />
      <TextField name="eatenAt" label="Date et heure" type="datetime-local" defaultValue={ctx.nowLocal} required />
      <details className="rounded-xl border border-line bg-night-900/50 px-3 py-2">
        <summary className="cursor-pointer py-1 text-sm font-medium text-ink-soft">Calories et macros (facultatif)</summary>
        <div className="mt-3 grid grid-cols-2 gap-3 pb-1">
          <NumberField name="kcal" label="Énergie" suffix="kcal" integer />
          <NumberField name="proteinG" label="Protéines" suffix="g" />
          <NumberField name="carbsG" label="Glucides" suffix="g" />
          <NumberField name="fatG" label="Lipides" suffix="g" />
        </div>
      </details>
      <TextAreaField name="note" label="Note" rows={2} maxLength={1000} placeholder="Faim, contexte, envie de sucre…" />
    </ActionForm>
  );
}
