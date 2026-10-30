import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { DEFAULT_TIMEZONE } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface SessionUser {
  id: string;
  email: string | null;
}

/**
 * Data Access Layer : point d'entrée unique pour identifier l'utilisateur.
 * Le jeton est vérifié (signature) par getClaims ; sans session valide,
 * redirection vers /connexion. Mis en cache le temps d'une requête.
 */
export const getSession = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/connexion");

  const user: SessionUser = { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
  return { supabase, user };
});

/** Profil de l'utilisateur courant (créé automatiquement à l'inscription). */
export const getProfile = cache(async (): Promise<Profile> => {
  const { supabase, user } = await getSession();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw new Error("Lecture du profil impossible.");
  return (
    data ?? {
      id: user.id,
      display_name: null,
      height_cm: null,
      birth_year: null,
      start_weight_kg: null,
      target_weight_kg: null,
      start_date: null,
      daily_calories_target: null,
      daily_protein_target_g: null,
      coach_context: null,
      timezone: DEFAULT_TIMEZONE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );
});
