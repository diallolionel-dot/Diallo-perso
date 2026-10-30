import type { Metadata } from "next";
import { createMeasurement } from "@/app/actions/tracking";
import { ActionForm } from "@/components/forms/ActionForm";
import { NumberField, TextAreaField, TextField } from "@/components/forms/fields";
import { FormPage } from "@/components/layout/FormPage";
import { getFormContext } from "@/lib/data/form-context";
import { MEASUREMENT_FIELDS } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Mensurations" };

export default function MensurationsPage() {
  return (
    <FormPage eyebrow="Évolution" title="Mensurations" subtitle="Mètre ruban, à jeun, sans serrer." back="/evolution">
      <MeasurementForm />
    </FormPage>
  );
}

async function MeasurementForm() {
  const ctx = await getFormContext();
  return (
    <ActionForm action={createMeasurement} submitLabel="Enregistrer les mesures" disabledReason={ctx.disabledReason}>
      <TextField name="measuredOn" label="Date" type="date" defaultValue={ctx.today} required />
      <div className="grid grid-cols-2 gap-3">
        {MEASUREMENT_FIELDS.map((f) => (
          <NumberField key={f.key} name={f.key} label={f.label} suffix="cm" />
        ))}
      </div>
      <p className="-mt-1 text-xs text-ink-muted">Renseigne seulement ce que tu as mesuré. Le tour de taille est prioritaire.</p>
      <TextAreaField name="note" label="Note" rows={2} maxLength={1000} />
    </ActionForm>
  );
}
