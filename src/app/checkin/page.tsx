import type { Metadata } from "next";
import { saveCheckin } from "@/app/actions/tracking";
import { ActionForm } from "@/components/forms/ActionForm";
import { ChoiceField, FieldRow, NumberField, SCALE_1_TO_5, TextAreaField, TextField } from "@/components/forms/fields";
import { FormPage } from "@/components/layout/FormPage";
import { getSession } from "@/lib/auth/session";
import { getFormContext } from "@/lib/data/form-context";

export const metadata: Metadata = { title: "Check-in" };

export default function CheckinPage() {
  return (
    <FormPage
      eyebrow="Rituel quotidien"
      title="Check-in"
      subtitle="30 secondes pour que le Mentor comprenne ta journée."
      back="/"
    >
      <CheckinForm />
    </FormPage>
  );
}

async function CheckinForm() {
  const ctx = await getFormContext();

  // Pré-remplit avec le check-in du jour s'il existe déjà (il sera mis à jour).
  let existing: Record<string, string | number | null> | null = null;
  if (ctx.live) {
    const { supabase } = await getSession();
    const { data } = await supabase.from("daily_checkins").select("*").eq("day", ctx.today).maybeSingle();
    existing = data;
  }
  const v = (column: string) => (existing?.[column] ?? null) as string | number | null;

  return (
    <ActionForm
      action={saveCheckin}
      submitLabel={existing ? "Mettre à jour le check-in" : "Valider le check-in"}
      disabledReason={ctx.disabledReason}
    >
      <TextField name="day" label="Jour" type="date" defaultValue={ctx.today} required />
      <FieldRow>
        <NumberField name="sleepHours" label="Sommeil" suffix="h" placeholder="6,5" defaultValue={v("sleep_hours")} />
        <NumberField name="painLevel" label="Douleur" suffix="/10" integer hint="0 = aucune" defaultValue={v("pain_level")} />
      </FieldRow>
      <ChoiceField name="sleepQuality" label="Qualité du sommeil" options={SCALE_1_TO_5} defaultValue={v("sleep_quality")} hint="1 très mauvaise · 5 excellente" />
      <ChoiceField name="energy" label="Énergie" options={SCALE_1_TO_5} defaultValue={v("energy")} hint="1 à plat · 5 au top" />
      <ChoiceField name="stress" label="Stress" options={SCALE_1_TO_5} defaultValue={v("stress")} hint="1 serein · 5 sous pression" />
      <ChoiceField name="hunger" label="Faim / envies de sucre" options={SCALE_1_TO_5} defaultValue={v("hunger")} hint="1 aucune · 5 très fortes" />
      <ChoiceField name="workLoad" label="Charge de travail" options={SCALE_1_TO_5} defaultValue={v("work_load")} hint="1 calme · 5 rush" />
      <TextField name="painZone" label="Zone douloureuse" placeholder="Genou gauche, épaule…" maxLength={80} defaultValue={v("pain_zone")} />
      <TextAreaField name="note" label="Note" rows={2} maxLength={1000} defaultValue={v("note") as string | null} />
    </ActionForm>
  );
}
