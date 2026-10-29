import type { Metadata } from "next";
import { Database, Moon, Scale, ScrollText, Send, Swords, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { PhaseNotice } from "@/components/ui/PhaseNotice";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { demoCoachMessages } from "@/lib/demo/data";

export const metadata: Metadata = { title: "Mentor" };

const CONTEXT_SOURCES = [
  { icon: Scale, label: "Pesées et tendance de poids" },
  { icon: UtensilsCrossed, label: "Journal alimentaire et protéines" },
  { icon: Swords, label: "Séances, charges et repos planifiés" },
  { icon: Moon, label: "Sommeil et check-ins (énergie, stress)" },
  { icon: Database, label: "Dossier athlète (objectifs, contraintes)" },
];

export default function MentorPage() {
  return (
    <>
      <PageHeader eyebrow="Conseil" title="Mentor" subtitle="Ton coach, au fait de ton parcours." />

      <Card tone="gold">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-gold-400/50 bg-night-800 text-gold-300">
            <ScrollText aria-hidden className="size-6" />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-ink">Le Mentor</p>
            <p className="text-xs text-ink-muted">Exigeant, bienveillant, jamais culpabilisant.</p>
          </div>
          <Pill className="ml-auto">Inactif</Pill>
        </div>
      </Card>

      <Card aria-label="Aperçu de la conversation">
        <CardHeader eyebrow="Aperçu de l'interface" title="Messages d'exemple" />
        <p className="mb-3 rounded-lg border border-violet-400/30 bg-violet-400/[0.07] px-3 py-2 text-xs text-ink-soft">
          Ces messages ont été rédigés à la main pour illustrer l&apos;écran.{" "}
          <strong className="text-violet-400">Ils ne sont pas générés par une IA.</strong>
        </p>
        <ol className="flex flex-col gap-2.5">
          {demoCoachMessages.map((m) => (
            <li
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "coach"
                  ? "self-start rounded-tl-sm border border-gold-500/25 bg-night-800 text-ink"
                  : "self-end rounded-tr-sm bg-teal-500/15 text-ink",
              )}
            >
              <span className="sr-only">{m.role === "coach" ? "Mentor : " : "Moi : "}</span>
              {m.text}
            </li>
          ))}
        </ol>
        <form className="mt-4 flex gap-2" aria-label="Écrire au Mentor (désactivé)">
          <label htmlFor="mentor-input" className="sr-only">
            Message au Mentor
          </label>
          <input
            id="mentor-input"
            disabled
            placeholder="Disponible en phase 3"
            className="min-h-11 flex-1 rounded-xl border border-line-strong bg-night-900 px-3 text-sm text-ink placeholder:text-ink-faint disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled
            aria-label="Envoyer"
            className="grid size-11 place-items-center rounded-xl border border-gold-500/40 bg-gold-500/15 text-gold-300 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send aria-hidden className="size-4" />
          </button>
        </form>
      </Card>

      <Card>
        <CardHeader eyebrow="Contexte" title="Ce que le Mentor consultera" />
        <ul className="flex flex-col gap-2">
          {CONTEXT_SOURCES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5 text-sm text-ink-soft">
              <Icon aria-hidden className="size-4 text-teal-400" />
              {label}
            </li>
          ))}
        </ul>
      </Card>

      <PhaseNotice phase={3}>
        Coach IA appelé exclusivement depuis le serveur : la clé API ne transite jamais par le téléphone.
      </PhaseNotice>
    </>
  );
}
