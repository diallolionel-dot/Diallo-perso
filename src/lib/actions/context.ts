import "server-only";
import { getProfile, getSession } from "@/lib/auth/session";
import { DEFAULT_TIMEZONE, isValidTimezone, todayIn } from "@/lib/dates";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const DEMO_MODE_MESSAGE = "Mode démonstration : configure Supabase pour enregistrer tes données.";

/**
 * Contexte d'une Server Action : revérifie la session (jamais de confiance
 * accordée au client) et fournit le fuseau de l'utilisateur.
 * `null` en mode démonstration.
 */
export async function actionContext() {
  if (!isSupabaseConfigured()) return null;
  const { supabase, user } = await getSession();
  const profile = await getProfile();
  const timezone = isValidTimezone(profile.timezone) ? profile.timezone : DEFAULT_TIMEZONE;
  return { supabase, user, profile, timezone, today: todayIn(timezone) };
}

export type ActionContext = NonNullable<Awaited<ReturnType<typeof actionContext>>>;
