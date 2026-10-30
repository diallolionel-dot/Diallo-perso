/**
 * Catalogue des succès. Les conditions de déblocage vivent en base
 * (fonction refresh_achievements) : un test vérifie que les codes concordent.
 * Les succès ne rapportent pas d'XP et célèbrent uniquement des progrès réels.
 */

export type BadgeRarity = "commun" | "rare" | "épique" | "légendaire";

export interface AchievementDef {
  code: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { code: "premier_pas", name: "Premier pas", description: "Première pesée enregistrée", rarity: "commun" },
  { code: "premiere_arene", name: "Entrée dans l'arène", description: "Première séance consignée", rarity: "commun" },
  { code: "sept_soleils", name: "Sept soleils", description: "7 jours de suivi", rarity: "rare" },
  { code: "repos_du_sage", name: "Repos du sage", description: "4 repos planifiés respectés", rarity: "rare" },
  { code: "semaine_reguliere", name: "Métronome", description: "Première semaine régulière (5 jours sur 7)", rarity: "rare" },
  { code: "cap_moins_2", name: "Cap des −2 kg", description: "Premier palier franchi", rarity: "épique" },
  { code: "mi_parcours", name: "Mi-parcours", description: "La moitié de la quête principale", rarity: "épique" },
  { code: "objectif_atteint", name: "Objectif atteint", description: "Quête principale accomplie", rarity: "légendaire" },
];

export interface AchievementStatus extends AchievementDef {
  unlocked: boolean;
}

export function achievementStatuses(unlockedCodes: ReadonlySet<string>): AchievementStatus[] {
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: unlockedCodes.has(a.code) }))
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
}

export function achievementName(code: string): string {
  return ACHIEVEMENTS.find((a) => a.code === code)?.name ?? code;
}
