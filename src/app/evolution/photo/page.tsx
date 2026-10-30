import type { Metadata } from "next";
import { createProgressPhoto } from "@/app/actions/tracking";
import { ActionForm } from "@/components/forms/ActionForm";
import { ChoiceField, TextAreaField, TextField } from "@/components/forms/fields";
import { PhotoField } from "@/components/forms/PhotoField";
import { FormPage } from "@/components/layout/FormPage";
import { getFormContext } from "@/lib/data/form-context";
import { PHOTO_POSES, PHOTO_POSE_LABELS } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Photo de progression" };

export default function PhotoPage() {
  return (
    <FormPage
      eyebrow="Évolution"
      title="Photo de progression"
      subtitle="Même lumière, même tenue, même distance."
      back="/evolution"
    >
      <ProgressPhotoForm />
    </FormPage>
  );
}

async function ProgressPhotoForm() {
  const ctx = await getFormContext();
  return (
    <ActionForm action={createProgressPhoto} submitLabel="Enregistrer la photo" disabledReason={ctx.disabledReason}>
      <PhotoField label="Photo" hint="Stockée en privé, sans données GPS." />
      <ChoiceField
        name="pose"
        label="Pose"
        defaultValue="face"
        options={PHOTO_POSES.map((p) => ({ value: p, label: PHOTO_POSE_LABELS[p] }))}
      />
      <TextField name="takenOn" label="Date" type="date" defaultValue={ctx.today} required />
      <TextAreaField name="note" label="Note" rows={2} maxLength={1000} />
    </ActionForm>
  );
}
