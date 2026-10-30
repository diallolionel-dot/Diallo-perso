import type { z } from "zod";

/** État renvoyé par une Server Action de formulaire. */
export interface FormState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Valeurs saisies, renvoyées pour ne rien perdre en cas d'erreur. */
  values?: Record<string, string>;
  /** Change à chaque réponse : permet de remonter le formulaire avec les valeurs saisies. */
  nonce?: string;
}

export const initialFormState: FormState = { status: "idle" };

/** Extrait les champs texte d'un FormData (les fichiers sont ignorés). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) values[key] = value;
  }
  return values;
}

export type ParseResult<T> = { ok: true; data: T } | { ok: false; state: FormState };

/** Valide un FormData avec un schéma Zod et produit des messages par champ. */
export function parseForm<S extends z.ZodType>(schema: S, formData: FormData): ParseResult<z.infer<S>> {
  const values = formValues(formData);
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_form";
    fieldErrors[key] ??= issue.message;
  }
  return {
    ok: false,
    state: {
      status: "error",
      message: fieldErrors._form ?? "Certains champs sont à corriger.",
      fieldErrors,
      values,
      nonce: crypto.randomUUID(),
    },
  };
}

export function errorState(message: string, values?: Record<string, string>): FormState {
  return { status: "error", message, values, nonce: crypto.randomUUID() };
}
