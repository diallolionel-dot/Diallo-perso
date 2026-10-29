/**
 * Règles RPG de Diallo Coaching.
 *
 * Principes non négociables :
 * - L'XP récompense le SUIVI et la RÉGULARITÉ, jamais les calories brûlées,
 *   le déficit calorique ou la restriction alimentaire.
 * - Le repos planifié rapporte de l'XP : il fait partie de l'entraînement.
 * - Aucune perte d'XP, aucune pénalité, aucune série remise à zéro :
 *   la régularité se mesure sur une fenêtre glissante de 7 jours.
 */

export const XP_ACTIONS = [
  "weigh_in",
  "meal_logged",
  "workout_logged",
  "planned_rest",
  "sleep_logged",
  "measurements_logged",
  "progress_photo",
  "daily_checkin",
  "weekly_review",
  "consistency_week",
] as const;

export type XpAction = (typeof XP_ACTIONS)[number];

export interface XpRule {
  label: string;
  xp: number;
  /** Nombre maximal d'occurrences récompensées par jour (anti-farm). */
  dailyCap: number;
}

export const XP_RULES: Record<XpAction, XpRule> = {
  weigh_in: { label: "Pesée enregistrée", xp: 10, dailyCap: 1 },
  meal_logged: { label: "Repas consigné", xp: 5, dailyCap: 5 },
  workout_logged: { label: "Séance consignée", xp: 25, dailyCap: 2 },
  planned_rest: { label: "Repos planifié respecté", xp: 15, dailyCap: 1 },
  sleep_logged: { label: "Sommeil renseigné", xp: 5, dailyCap: 1 },
  measurements_logged: { label: "Mensurations relevées", xp: 20, dailyCap: 1 },
  progress_photo: { label: "Photo de progression", xp: 15, dailyCap: 1 },
  daily_checkin: { label: "Check-in du jour", xp: 10, dailyCap: 1 },
  weekly_review: { label: "Bilan hebdomadaire", xp: 30, dailyCap: 1 },
  consistency_week: { label: "Semaine régulière (5 jours suivis sur 7)", xp: 50, dailyCap: 1 },
};

/** XP nécessaire pour passer du niveau `level` au suivant. */
export function xpToNextLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError("level doit être un entier >= 1");
  }
  return 100 + (level - 1) * 50;
}

export interface LevelProgress {
  level: number;
  /** XP accumulée dans le niveau courant. */
  current: number;
  /** XP requise pour atteindre le niveau suivant. */
  required: number;
  /** Ratio 0–1 dans le niveau courant. */
  ratio: number;
}

export function levelFromXp(totalXp: number): LevelProgress {
  let remaining = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level);
    level += 1;
  }
  const required = xpToNextLevel(level);
  return { level, current: remaining, required, ratio: remaining / required };
}

const TITLES: ReadonlyArray<{ minLevel: number; title: string }> = [
  { minLevel: 1, title: "Recrue" },
  { minLevel: 3, title: "Combattant" },
  { minLevel: 6, title: "Guerrier" },
  { minLevel: 10, title: "Vétéran" },
  { minLevel: 15, title: "Champion" },
  { minLevel: 21, title: "Légende" },
];

export function titleForLevel(level: number): string {
  let title = TITLES[0].title;
  for (const t of TITLES) {
    if (level >= t.minLevel) title = t.title;
  }
  return title;
}

/** Nombre de jours suivis (au moins une action) dans les 7 derniers jours. */
export function consistencyScore(trackedDays: ReadonlyArray<boolean>): number {
  return trackedDays.slice(-7).filter(Boolean).length;
}

/** Progression vers l'objectif de poids, bornée entre 0 et 1. */
export function weightGoalProgress(start: number, current: number, target: number): number {
  const total = start - target;
  if (total === 0) return 1;
  const ratio = (start - current) / total;
  return Math.min(1, Math.max(0, ratio));
}
