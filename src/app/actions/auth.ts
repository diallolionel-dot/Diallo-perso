"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errorState, parseForm, type FormState } from "@/lib/validation/form";
import { loginSchema } from "@/lib/validation/schemas";

/** N'accepte qu'un chemin interne comme destination après connexion. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return errorState("Supabase n'est pas configuré : l'application est en mode démonstration.");

  const parsed = parseForm(loginSchema, formData);
  if (!parsed.ok) return { ...parsed.state, values: { email: parsed.state.values?.email ?? "" } };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Message volontairement générique : ne révèle pas si le compte existe.
    return errorState("Identifiants incorrects.", { email: parsed.data.email });
  }

  redirect(safeNext(formData.get("suite")));
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/connexion");
}
