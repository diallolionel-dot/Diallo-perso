"use server";

import { redirect } from "next/navigation";
import { DEMO_MODE_MESSAGE, actionContext } from "@/lib/actions/context";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isAdminConfigured } from "@/lib/supabase/env";
import { removeAllPrivateImages } from "@/lib/supabase/storage";
import { errorState, formValues, parseForm, type FormState } from "@/lib/validation/form";
import { deleteDataSchema, profileSchema } from "@/lib/validation/schemas";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await actionContext();
  if (!ctx) return errorState(DEMO_MODE_MESSAGE);

  const parsed = parseForm(profileSchema, formData);
  if (!parsed.ok) return parsed.state;
  const p = parsed.data;

  const { error } = await ctx.supabase
    .from("profiles")
    .update({
      display_name: p.displayName ?? null,
      height_cm: p.heightCm ?? null,
      birth_year: p.birthYear ?? null,
      start_weight_kg: p.startWeightKg ?? null,
      target_weight_kg: p.targetWeightKg ?? null,
      start_date: p.startDate ?? null,
      daily_calories_target: p.dailyCaloriesTarget ?? null,
      daily_protein_target_g: p.dailyProteinTargetG ?? null,
      coach_context: p.coachContext ?? null,
      timezone: p.timezone,
    })
    .eq("id", ctx.user.id);

  if (error) return errorState("Le profil n'a pas pu être enregistré.", formValues(formData));
  redirect("/profil?enregistre=1");
}

/** Efface toutes les données de suivi et les photos ; le compte est conservé. */
export async function deleteAllData(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await actionContext();
  if (!ctx) return errorState(DEMO_MODE_MESSAGE);

  const parsed = parseForm(deleteDataSchema, formData);
  if (!parsed.ok) return parsed.state;

  try {
    await removeAllPrivateImages(ctx.supabase, ctx.user.id);
  } catch {
    return errorState("Les photos n'ont pas pu être supprimées : rien n'a été effacé. Réessaie.");
  }
  const { error } = await ctx.supabase.rpc("delete_my_data");
  if (error) return errorState("L'effacement a échoué. Réessaie.");

  redirect("/profil?efface=1");
}

/** Supprime définitivement le compte (photos, données, identifiants). Nécessite la clé secrète. */
export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await actionContext();
  if (!ctx) return errorState(DEMO_MODE_MESSAGE);
  if (!isAdminConfigured()) {
    return errorState("Suppression du compte indisponible : SUPABASE_SECRET_KEY n'est pas configurée sur le serveur.");
  }

  const parsed = parseForm(deleteDataSchema, formData);
  if (!parsed.ok) return parsed.state;

  try {
    await removeAllPrivateImages(ctx.supabase, ctx.user.id);
  } catch {
    return errorState("Les photos n'ont pas pu être supprimées : le compte est conservé. Réessaie.");
  }

  // La suppression de auth.users déclenche les ON DELETE CASCADE sur toutes les tables.
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(ctx.user.id);
  if (error) return errorState("La suppression du compte a échoué. Réessaie.");

  await ctx.supabase.auth.signOut();
  redirect("/connexion");
}
