import "server-only";
import { z } from "zod";

/**
 * Variables d'environnement Supabase — lues UNIQUEMENT côté serveur.
 *
 * Aucune n'est préfixée NEXT_PUBLIC_ : elles ne sont jamais incluses dans
 * le JavaScript envoyé au navigateur. Toutes les requêtes Supabase passent
 * par le serveur Next.js (Server Components, Server Actions, Route Handlers).
 */
const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

const supabaseAdminEnvSchema = supabaseEnvSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(20),
});

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;
export type SupabaseAdminEnv = z.infer<typeof supabaseAdminEnvSchema>;

/** Renvoie la configuration Supabase, ou `null` si elle est absente (mode démo). */
export function getSupabaseEnv(): SupabaseEnv | null {
  const parsed = supabaseEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  });
  return parsed.success ? parsed.data : null;
}

/** Configuration avec la clé secrète (opérations d'administration, ex. suppression du compte). */
export function getSupabaseAdminEnv(): SupabaseAdminEnv | null {
  const parsed = supabaseAdminEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
  return parsed.success ? parsed.data : null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase n'est pas configuré : renseigner SUPABASE_URL et SUPABASE_PUBLISHABLE_KEY dans .env.local (voir README).",
    );
    this.name = "SupabaseNotConfiguredError";
  }
}
