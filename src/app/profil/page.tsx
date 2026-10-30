import type { Metadata } from "next";
import { CheckCircle2, Download, LogOut } from "lucide-react";
import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { deleteAccount, deleteAllData, updateProfile } from "@/app/actions/profile";
import { ActionForm } from "@/components/forms/ActionForm";
import { FieldRow, NumberField, TextAreaField, TextField } from "@/components/forms/fields";
import { FormPage } from "@/components/layout/FormPage";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { getProfile } from "@/lib/auth/session";
import { getFormContext } from "@/lib/data/form-context";
import { DEFAULT_TIMEZONE } from "@/lib/dates";
import { isAdminConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Profil" };

export default function ProfilPage({ searchParams }: PageProps<"/profil">) {
  return (
    <>
      <FormPage eyebrow="Réglages" title="Profil" subtitle="Ta quête, tes repères, ton dossier pour le Mentor." back="/">
        <ProfileForm searchParams={searchParams} />
      </FormPage>
      <Suspense fallback={<PageSkeleton cards={1} />}>
        <DataControls />
      </Suspense>
    </>
  );
}

async function ProfileForm({ searchParams }: Pick<PageProps<"/profil">, "searchParams">) {
  const [ctx, params] = await Promise.all([getFormContext(), searchParams]);
  const profile = ctx.live ? await getProfile() : null;

  return (
    <>
      {params.enregistre ? (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-2.5 text-sm text-teal-200">
          <CheckCircle2 aria-hidden className="size-4" /> Profil enregistré.
        </p>
      ) : null}
      {params.efface ? (
        <p role="status" className="mb-4 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-2.5 text-sm text-teal-200">
          Toutes tes données de suivi et tes photos ont été effacées.
        </p>
      ) : null}
      <ActionForm action={updateProfile} submitLabel="Enregistrer le profil" disabledReason={ctx.disabledReason}>
        <TextField name="displayName" label="Prénom affiché" maxLength={60} defaultValue={profile?.display_name} />
        <FieldRow>
          <NumberField name="startWeightKg" label="Poids de départ" suffix="kg" defaultValue={profile?.start_weight_kg} />
          <NumberField name="targetWeightKg" label="Objectif" suffix="kg" defaultValue={profile?.target_weight_kg} />
        </FieldRow>
        <TextField name="startDate" label="Début de la quête" type="date" defaultValue={profile?.start_date} />
        <FieldRow>
          <NumberField name="heightCm" label="Taille" suffix="cm" defaultValue={profile?.height_cm} />
          <NumberField name="birthYear" label="Année de naissance" integer defaultValue={profile?.birth_year} />
        </FieldRow>
        <FieldRow>
          <NumberField name="dailyCaloriesTarget" label="Repère énergie" suffix="kcal" integer defaultValue={profile?.daily_calories_target} />
          <NumberField name="dailyProteinTargetG" label="Objectif protéines" suffix="g" integer defaultValue={profile?.daily_protein_target_g} />
        </FieldRow>
        <TextAreaField
          name="coachContext"
          label="Dossier athlète (pour le Mentor)"
          rows={8}
          maxLength={8000}
          defaultValue={profile?.coach_context}
          hint="Objectifs, sports, contraintes pro, sommeil, points faibles… Stocké en privé, jamais dans le code."
        />
        <TextField name="timezone" label="Fuseau horaire" defaultValue={profile?.timezone ?? DEFAULT_TIMEZONE} hint="Ex. Europe/Paris" />
      </ActionForm>
    </>
  );
}

async function DataControls() {
  const ctx = await getFormContext();
  const admin = ctx.live && isAdminConfigured();

  return (
    <>
      <Card>
        <CardHeader eyebrow="Tes données" title="Export" />
        <p className="mb-3 text-sm leading-relaxed text-ink-muted">
          Télécharge l&apos;intégralité de tes données au format JSON (les photos restent dans le stockage privé).
        </p>
        {ctx.live ? (
          <a
            href="/api/export"
            download
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line-strong bg-night-800 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            <Download aria-hidden className="size-4" /> Exporter mes données
          </a>
        ) : (
          <Button disabled className="w-full">
            <Download aria-hidden className="size-4" /> Exporter mes données
          </Button>
        )}
      </Card>

      <Card className="border-ember-400/30">
        <CardHeader eyebrow="Zone sensible" title="Effacer mes données" />
        <p className="mb-3 text-sm leading-relaxed text-ink-muted">
          Supprime pesées, repas, séances, mensurations, check-ins, photos, XP et succès. Ton compte est conservé.
          Action irréversible.
        </p>
        <ActionForm action={deleteAllData} submitLabel="Tout effacer" submitVariant="ghost" disabledReason={ctx.disabledReason}>
          <TextField name="confirm" label="Tape SUPPRIMER pour confirmer" autoComplete="off" />
        </ActionForm>
      </Card>

      {admin ? (
        <Card className="border-ember-400/30">
          <CardHeader eyebrow="Zone sensible" title="Supprimer mon compte" />
          <p className="mb-3 text-sm leading-relaxed text-ink-muted">
            Supprime définitivement le compte, toutes les données et toutes les photos.
          </p>
          <ActionForm action={deleteAccount} submitLabel="Supprimer le compte" submitVariant="ghost">
            <TextField name="confirm" label="Tape SUPPRIMER pour confirmer" autoComplete="off" />
          </ActionForm>
        </Card>
      ) : null}

      {ctx.live ? (
        <form action={signOut}>
          <Button type="submit" className="w-full">
            <LogOut aria-hidden className="size-4" /> Se déconnecter
          </Button>
        </form>
      ) : null}
    </>
  );
}
