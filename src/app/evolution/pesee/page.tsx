import type { Metadata } from "next";
import { createWeightEntry } from "@/app/actions/tracking";
import { ActionForm } from "@/components/forms/ActionForm";
import { FieldRow, NumberField, TextField, TextAreaField } from "@/components/forms/fields";
import { PhotoField } from "@/components/forms/PhotoField";
import { FormPage } from "@/components/layout/FormPage";
import { getFormContext } from "@/lib/data/form-context";

export const metadata: Metadata = { title: "Nouvelle pesée" };

export default function PeseePage() {
  return (
    <FormPage eyebrow="Évolution" title="Nouvelle pesée" subtitle="Le matin, à jeun, même balance." back="/evolution">
      <WeightForm />
    </FormPage>
  );
}

async function WeightForm() {
  const ctx = await getFormContext();
  return (
    <ActionForm action={createWeightEntry} submitLabel="Enregistrer la pesée" disabledReason={ctx.disabledReason}>
      <FieldRow>
        <NumberField name="weightKg" label="Poids" suffix="kg" placeholder="90,4" required />
        <NumberField name="bodyFatPct" label="Masse grasse" suffix="%" hint="Facultatif" />
      </FieldRow>
      <TextField name="measuredAt" label="Date et heure" type="datetime-local" defaultValue={ctx.nowLocal} required />
      <PhotoField label="Photo de la balance" hint="Facultatif. Utile pour la lecture automatique en phase 3." />
      <TextAreaField name="note" label="Note" rows={2} maxLength={1000} placeholder="Repas tardif, mauvaise nuit…" />
    </ActionForm>
  );
}
