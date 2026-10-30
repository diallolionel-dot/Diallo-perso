import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/Card";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-[80dvh] flex-col justify-center gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- icône SVG locale */}
        <img src="/icons/icon.svg" alt="" width={72} height={72} className="drop-shadow-[0_0_24px_rgb(226_185_96/0.25)]" />
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-teal-400/90">Accès privé</p>
          <h1 className="font-display text-2xl font-bold tracking-wide text-ink">Diallo Coaching</h1>
        </div>
      </header>

      <Card>
        <Suspense>
          <LoginForm
            disabledReason={
              configured ? undefined : "Supabase n'est pas encore configuré : l'application tourne en mode démonstration."
            }
          />
        </Suspense>
      </Card>

      {configured ? (
        <p className="text-center text-xs leading-relaxed text-ink-muted">
          Compte unique : les inscriptions sont désactivées.
        </p>
      ) : (
        <Link href="/" className="text-center text-sm font-semibold text-teal-300">
          Explorer la démonstration →
        </Link>
      )}
    </div>
  );
}
