"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { ActionForm } from "@/components/forms/ActionForm";
import { TextField } from "@/components/forms/fields";

export function LoginForm({ disabledReason }: { disabledReason?: string }) {
  const suite = useSearchParams().get("suite") ?? "/";

  return (
    <ActionForm action={signIn} submitLabel="Entrer" disabledReason={disabledReason}>
      <input type="hidden" name="suite" value={suite} />
      <TextField name="email" label="E-mail" type="email" inputMode="email" autoComplete="username" required />
      <TextField name="password" label="Mot de passe" type="password" autoComplete="current-password" required />
    </ActionForm>
  );
}
