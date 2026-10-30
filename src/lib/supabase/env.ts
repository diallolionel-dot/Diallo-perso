import "server-only";
import { readSupabaseAdminEnv, readSupabaseEnv, type SupabaseAdminEnv, type SupabaseEnv } from "./config";

/**
 * Variables d'environnement Supabase — lues UNIQUEMENT côté serveur.
 * Toutes les requêtes Supabase passent par le serveur Next.js
 * (Server Components, Server Actions, Route Handlers, proxy).
 */
export type { SupabaseAdminEnv, SupabaseEnv };

/** Renvoie la configuration Supabase, ou `null` si elle est absente (mode démo). */
export function getSupabaseEnv(): SupabaseEnv | null {
  return readSupabaseEnv();
}

/** Configuration avec la clé secrète (opérations d'administration, ex. suppression du compte). */
export function getSupabaseAdminEnv(): SupabaseAdminEnv | null {
  return readSupabaseAdminEnv();
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

export function isAdminConfigured(): boolean {
  return getSupabaseAdminEnv() !== null;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase n'est pas configuré : renseigner SUPABASE_URL et SUPABASE_PUBLISHABLE_KEY dans .env.local (voir README).",
    );
    this.name = "SupabaseNotConfiguredError";
  }
}
