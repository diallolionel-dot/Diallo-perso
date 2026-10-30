"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

interface DeleteButtonProps {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
}

/** Suppression d'une saisie, avec confirmation. */
export function DeleteButton({ action, id, label }: DeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Supprimer ${label} ?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Submit label={label} />
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Supprimer ${label}`}
      className="grid size-9 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-ember-400/10 hover:text-ember-400"
    >
      {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Trash2 aria-hidden className="size-4" />}
    </button>
  );
}
