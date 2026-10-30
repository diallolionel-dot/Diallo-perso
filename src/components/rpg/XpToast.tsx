"use client";

import { Sparkles, Trophy } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { achievementName } from "@/lib/rpg/achievements";

interface Reward {
  xp: number;
  unlocked: string[];
}

function readReward(params: URLSearchParams): Reward | null {
  const xp = Number(params.get("xp") ?? 0);
  const unlocked = (params.get("succes") ?? "").split(",").filter(Boolean);
  return xp > 0 || unlocked.length > 0 ? { xp: Number.isFinite(xp) ? xp : 0, unlocked } : null;
}

/**
 * Annonce le gain d'XP et les succès débloqués après une saisie
 * (paramètres `xp` et `succes` posés par la Server Action), puis nettoie l'URL.
 */
export function XpToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const key = params.toString();
  const incoming = readReward(params);

  const [reward, setReward] = useState<Reward | null>(incoming);
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    // Nouvelle URL : on mémorise la récompense avant que l'URL ne soit nettoyée.
    setLastKey(key);
    if (incoming) setReward(incoming);
  }

  useEffect(() => {
    if (incoming) router.replace(pathname, { scroll: false });
  }, [incoming, pathname, router]);

  useEffect(() => {
    if (!reward) return;
    const timer = setTimeout(() => setReward(null), 4500);
    return () => clearTimeout(timer);
  }, [reward]);

  if (!reward) return null;

  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-safe">
      <div className="mt-4 flex animate-rise items-center gap-3 rounded-2xl border border-gold-400/50 bg-night-850/95 px-4 py-3 shadow-[0_10px_40px_-12px_var(--color-gold-400)] backdrop-blur">
        {reward.unlocked.length > 0 ? (
          <Trophy aria-hidden className="size-5 text-gold-300" />
        ) : (
          <Sparkles aria-hidden className="size-5 text-gold-300" />
        )}
        <div className="text-sm">
          {reward.xp > 0 ? <p className="font-display font-semibold text-gold-200">+{reward.xp} XP</p> : null}
          {reward.unlocked.length > 0 ? (
            <p className="text-ink-soft">Succès débloqué : {reward.unlocked.map(achievementName).join(", ")}</p>
          ) : (
            <p className="text-ink-muted">Suivi enregistré.</p>
          )}
        </div>
      </div>
    </div>
  );
}
