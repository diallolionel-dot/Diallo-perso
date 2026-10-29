import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { SupabaseNotConfiguredError, getSupabaseAdminEnv, getSupabaseEnv } from "./env";

/**
 * Client Supabase lié à la session de l'utilisateur (cookies httpOnly).
 * Toutes les requêtes sont soumises à la Row Level Security.
 *
 * Phase 1 : prêt mais non utilisé par les écrans (données de démonstration).
 */
export async function createSupabaseServerClient() {
  const env = getSupabaseEnv();
  if (!env) throw new SupabaseNotConfiguredError();

  const cookieStore = await cookies();

  return createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appelé depuis un Server Component : les cookies sont en lecture seule.
          // Le rafraîchissement de session sera assuré par le proxy (phase 2).
        }
      },
    },
  });
}

/**
 * Client administrateur (clé secrète) — contourne la RLS.
 * À réserver aux opérations qui l'exigent : suppression du compte,
 * écriture des réponses du Mentor. Jamais importable côté client.
 */
export function createSupabaseAdminClient() {
  const env = getSupabaseAdminEnv();
  if (!env) throw new SupabaseNotConfiguredError();

  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Durée de validité des URLs signées pour les photos privées. */
export const SIGNED_URL_TTL_SECONDS = 60 * 10;

export const PRIVATE_MEDIA_BUCKET = "private-media";
