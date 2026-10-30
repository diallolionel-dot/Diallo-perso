"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { createContext, use, useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { initialFormState, type FormState } from "@/lib/validation/form";

const FormStateContext = createContext<FormState>(initialFormState);

/** Erreur et valeur précédente d'un champ, après une soumission refusée. */
export function useField(name: string): { error?: string; value?: string } {
  const state = use(FormStateContext);
  return { error: state.fieldErrors?.[name], value: state.values?.[name] };
}

interface ActionFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  /** Si renseigné, le formulaire est affiché mais l'envoi est désactivé (mode démo). */
  disabledReason?: string;
  submitVariant?: "primary" | "ghost";
  className?: string;
}

/**
 * Formulaire relié à une Server Action. En cas d'erreur, il est remonté avec
 * les valeurs saisies (React réinitialise les champs après chaque action).
 */
export function ActionForm({
  action,
  submitLabel,
  children,
  disabledReason,
  submitVariant = "primary",
  className,
}: ActionFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <FormStateContext value={state}>
      <form key={state.nonce ?? "initial"} action={formAction} noValidate className={className ?? "flex flex-col gap-4"}>
        {children}
        {state.status === "error" && state.message ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-ember-400/40 bg-ember-400/10 px-3 py-2.5 text-sm text-ember-400"
          >
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
            {state.message}
          </p>
        ) : null}
        {disabledReason ? <p className="text-xs leading-relaxed text-ink-muted">{disabledReason}</p> : null}
        <SubmitButton label={submitLabel} disabled={Boolean(disabledReason)} variant={submitVariant} />
      </form>
    </FormStateContext>
  );
}

function SubmitButton({ label, disabled, variant }: { label: string; disabled: boolean; variant: "primary" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={disabled || pending} className="w-full">
      {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
      {pending ? "Enregistrement…" : label}
    </Button>
  );
}
