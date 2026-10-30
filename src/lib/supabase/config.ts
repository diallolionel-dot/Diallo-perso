import { z } from "zod";

/**
 * Lecture des variables Supabase, sans garde `server-only` pour pouvoir être
 * utilisée par le proxy. Les modules applicatifs passent par `./env`, qui
 * ajoute cette garde. Aucune variable n'est préfixée NEXT_PUBLIC_.
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
export function readSupabaseEnv(): SupabaseEnv | null {
  const parsed = supabaseEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  });
  return parsed.success ? parsed.data : null;
}

export function readSupabaseAdminEnv(): SupabaseAdminEnv | null {
  const parsed = supabaseAdminEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
  return parsed.success ? parsed.data : null;
}
