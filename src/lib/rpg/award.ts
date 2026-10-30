import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { XpAction } from "./xp";

export interface AwardOutcome {
  xp: number;
  unlocked: string[];
}

/**
 * Attribue l'XP d'une action de suivi (datée `day`), puis vérifie la semaine régulière
 * (au jour `today`) et les succès. Une saisie antidatée de plus de 7 jours ne rapporte rien.
 * Tout passe par les fonctions SQL (plafonds, anti-doublon) : le serveur ne choisit
 * jamais le montant. Une erreur ici ne doit pas faire échouer la saisie elle-même.
 */
export async function awardForAction(
  supabase: SupabaseClient<Database>,
  actions: Array<{ action: XpAction; sourceId?: string }>,
  day: string,
  today: string,
): Promise<AwardOutcome> {
  const outcome: AwardOutcome = { xp: 0, unlocked: [] };
  try {
    for (const { action, sourceId } of actions) {
      const { data } = await supabase.rpc("award_xp", { p_action: action, p_occurred_on: day, p_source_id: sourceId ?? null });
      outcome.xp += data ?? 0;
    }
    const { data: bonus } = await supabase.rpc("check_consistency_week", { p_today: today });
    outcome.xp += bonus ?? 0;
    const { data: unlocked } = await supabase.rpc("refresh_achievements");
    outcome.unlocked = unlocked ?? [];
  } catch (error) {
    console.error("Attribution d'XP impossible", error);
  }
  return outcome;
}

/** Paramètres d'URL affichant le gain (toast) après redirection. */
export function rewardQuery({ xp, unlocked }: AwardOutcome): string {
  const params = new URLSearchParams();
  if (xp > 0) params.set("xp", String(xp));
  if (unlocked.length > 0) params.set("succes", unlocked.join(","));
  const query = params.toString();
  return query ? `?${query}` : "";
}
