import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Card, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";

/** État réel des briques techniques : rien n'est présenté comme actif s'il ne l'est pas. */
export function SystemStatus() {
  const supabase = isSupabaseConfigured();
  const rows = [
    { label: "Base de données (Supabase)", ok: supabase, on: "Configurée", off: "Non configurée" },
    { label: "Enregistrement des saisies", ok: supabase, on: "Actif", off: "Mode démo" },
    { label: "Analyse IA des photos & Mentor", ok: false, on: "Actif", off: "Phase 3" },
  ];

  return (
    <Card>
      <CardHeader eyebrow="Coulisses" title="État du système" />
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 text-sm text-ink-soft">
            {r.label}
            <Pill tone={r.ok ? "teal" : "neutral"}>{r.ok ? r.on : r.off}</Pill>
          </li>
        ))}
      </ul>
    </Card>
  );
}
