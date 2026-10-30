import "server-only";
import { connection } from "next/server";
import { DEMO_MODE_MESSAGE } from "@/lib/actions/context";
import { getProfile } from "@/lib/auth/session";
import { DEFAULT_TIMEZONE, isValidTimezone, nowLocalInput, todayIn } from "@/lib/dates";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface FormContext {
  live: boolean;
  timezone: string;
  /** `YYYY-MM-DDTHH:mm` pour pré-remplir les champs date-heure. */
  nowLocal: string;
  today: string;
  /** Message affiché quand l'enregistrement est indisponible (mode démo). */
  disabledReason?: string;
}

/** Valeurs par défaut des formulaires, calculées à la requête dans le fuseau de l'utilisateur. */
export async function getFormContext(): Promise<FormContext> {
  if (!isSupabaseConfigured()) {
    await connection();
    return {
      live: false,
      timezone: DEFAULT_TIMEZONE,
      nowLocal: nowLocalInput(DEFAULT_TIMEZONE),
      today: todayIn(DEFAULT_TIMEZONE),
      disabledReason: DEMO_MODE_MESSAGE,
    };
  }
  const profile = await getProfile();
  const timezone = isValidTimezone(profile.timezone) ? profile.timezone : DEFAULT_TIMEZONE;
  return { live: true, timezone, nowLocal: nowLocalInput(timezone), today: todayIn(timezone) };
}
