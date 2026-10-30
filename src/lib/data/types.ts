import type { AchievementStatus } from "@/lib/rpg/achievements";
import type { ConsistencyDay, Quest } from "@/lib/rpg/quests";

/**
 * Modèles de vue des écrans. Les chargeurs produisent la même forme en mode
 * démonstration (données fictives) et en mode réel (Supabase).
 */

export type DataMode = "demo" | "live";

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export interface DashboardData {
  mode: DataMode;
  displayName: string | null;
  dayNumber: number | null;
  startWeightKg: number | null;
  targetWeightKg: number | null;
  weights: WeightPoint[];
  totalXp: number;
  xpToday: number;
  today: {
    caloriesKcal: number;
    proteinG: number;
    mealsCount: number;
    sleepHours: number | null;
    workout: { label: string; durationMin: number } | null;
    plannedRest: boolean;
    painLevel: number | null;
  };
  targets: { calories: number | null; protein: number | null };
  quests: Quest[];
  consistency: ConsistencyDay[];
  achievements: AchievementStatus[];
}

export interface MealView {
  id: string;
  slotLabel: string;
  time: string;
  title: string;
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  photoUrl: string | null;
  hasPhoto: boolean;
}

export interface NutritionData {
  mode: DataMode;
  meals: MealView[];
  totals: { kcal: number; proteinG: number; carbsG: number; fatG: number };
  targets: { calories: number | null; protein: number | null };
  history: Array<{ day: string; kcal: number; proteinG: number; count: number }>;
}

export interface SessionView {
  id: string;
  title: string;
  kind: "combat" | "force" | "cardio" | "mobilite" | "repos";
  date: string;
  durationMin: number;
  perceivedEffort: number | null;
  exercises: Array<{ name: string; sets: Array<{ reps?: number; loadKg?: number; durationS?: number }> }>;
  photoUrl: string | null;
}

export interface ArenaData {
  mode: DataMode;
  monthStats: { sessions: number; totalMinutes: number; restDays: number };
  week: Array<{ day: string; label: string | null; kind: SessionView["kind"] | null; isToday?: boolean }>;
  sessions: SessionView[];
}

export interface EvolutionData {
  mode: DataMode;
  targetWeightKg: number | null;
  weights: WeightPoint[];
  recentWeights: Array<{ id: string; date: string; weightKg: number; delta: number | null; photoUrl: string | null }>;
  measurements: Array<{ label: string; firstCm: number; latestCm: number }>;
  measurementEntries: Array<{ id: string; date: string; summary: string }>;
  photos: Array<{ id: string; pose: string; date: string; url: string | null }>;
}
