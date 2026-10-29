/**
 * ⚠️ DONNÉES FICTIVES DE DÉMONSTRATION — Phase 1.
 *
 * Rien ici n'est lu ni écrit dans une base de données. Ces valeurs servent
 * uniquement à illustrer l'interface tant que Supabase n'est pas branché
 * (phase 2). Les dates sont fixes pour garder un rendu déterministe.
 */

export const DEMO_MODE_LABEL = "Données de démonstration";

export const demoProfile = {
  displayName: "Diallo",
  startWeightKg: 92,
  targetWeightKg: 80,
  startDate: "2026-10-06",
  dailyCaloriesTarget: 2200,
  dailyProteinTargetG: 170,
  totalXp: 1340,
};

export interface DemoWeightEntry {
  date: string;
  weightKg: number;
}

export const demoWeights: DemoWeightEntry[] = [
  { date: "2026-10-06", weightKg: 92.0 },
  { date: "2026-10-08", weightKg: 91.8 },
  { date: "2026-10-10", weightKg: 91.9 },
  { date: "2026-10-13", weightKg: 91.4 },
  { date: "2026-10-15", weightKg: 91.1 },
  { date: "2026-10-17", weightKg: 91.3 },
  { date: "2026-10-20", weightKg: 90.8 },
  { date: "2026-10-22", weightKg: 90.6 },
  { date: "2026-10-24", weightKg: 90.7 },
  { date: "2026-10-27", weightKg: 90.2 },
  { date: "2026-10-29", weightKg: 90.0 },
];

export const demoToday = {
  date: "2026-10-29",
  dayNumber: 24,
  caloriesKcal: 1640,
  proteinG: 128,
  carbsG: 150,
  fatG: 52,
  sleepHours: 6.5,
  workout: { label: "MMA — technique & sparring", durationMin: 90 },
  xpGainedToday: 55,
};

export type QuestStatus = "done" | "todo";

export interface DemoQuest {
  id: string;
  label: string;
  hint: string;
  xp: number;
  status: QuestStatus;
}

export const demoQuests: DemoQuest[] = [
  { id: "weigh", label: "Pesée du matin", hint: "À jeun, même balance", xp: 10, status: "done" },
  { id: "meals", label: "Consigner 3 repas", hint: "Une photo suffit", xp: 15, status: "done" },
  { id: "train", label: "Séance Arène ou repos planifié", hint: "Les deux comptent", xp: 25, status: "done" },
  { id: "sleep", label: "Renseigner le sommeil", hint: "Heure de coucher et réveil", xp: 5, status: "todo" },
  { id: "checkin", label: "Check-in du soir", hint: "Énergie, stress, faim", xp: 10, status: "todo" },
];

/** 7 derniers jours : `true` = au moins une action de suivi. */
export const demoConsistency: Array<{ day: string; tracked: boolean; rest?: boolean }> = [
  { day: "J", tracked: true },
  { day: "V", tracked: true },
  { day: "S", tracked: false },
  { day: "D", tracked: true, rest: true },
  { day: "L", tracked: true },
  { day: "M", tracked: true },
  { day: "M", tracked: true },
];

export type BadgeRarity = "commun" | "rare" | "épique" | "légendaire";

export interface DemoBadge {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  unlocked: boolean;
}

export const demoBadges: DemoBadge[] = [
  { id: "first-step", name: "Premier pas", description: "Première pesée enregistrée", rarity: "commun", unlocked: true },
  { id: "seven-days", name: "Sept soleils", description: "7 jours suivis", rarity: "rare", unlocked: true },
  { id: "wise-rest", name: "Repos du sage", description: "4 repos planifiés respectés", rarity: "rare", unlocked: true },
  { id: "two-kilos", name: "Cap des −2 kg", description: "Premier palier franchi", rarity: "épique", unlocked: false },
  { id: "eighty", name: "Objectif 80", description: "Quête principale accomplie", rarity: "légendaire", unlocked: false },
];

export interface DemoMeal {
  id: string;
  slot: string;
  time: string;
  title: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  hasPhoto: boolean;
}

export const demoMeals: DemoMeal[] = [
  { id: "m1", slot: "Petit-déjeuner", time: "07:40", title: "Œufs brouillés, pain complet, café", kcal: 420, proteinG: 28, carbsG: 32, fatG: 18, hasPhoto: true },
  { id: "m2", slot: "Déjeuner", time: "12:55", title: "Poulet, riz basmati, haricots verts", kcal: 640, proteinG: 52, carbsG: 70, fatG: 14, hasPhoto: true },
  { id: "m3", slot: "Collation", time: "16:30", title: "Fromage blanc 0 %, fruits rouges", kcal: 180, proteinG: 22, carbsG: 18, fatG: 1, hasPhoto: false },
  { id: "m4", slot: "Dîner", time: "20:45", title: "Thon, patate douce, salade", kcal: 400, proteinG: 26, carbsG: 30, fatG: 19, hasPhoto: true },
];

export interface DemoSessionPlan {
  day: string;
  label: string;
  kind: "combat" | "force" | "cardio" | "repos";
}

export const demoWeekPlan: DemoSessionPlan[] = [
  { day: "Lun", label: "MMA", kind: "combat" },
  { day: "Mar", label: "Force — haut", kind: "force" },
  { day: "Mer", label: "Repos planifié", kind: "repos" },
  { day: "Jeu", label: "Boxe", kind: "combat" },
  { day: "Ven", label: "Grappling", kind: "combat" },
  { day: "Sam", label: "Moringue + cardio", kind: "cardio" },
  { day: "Dim", label: "Repos planifié", kind: "repos" },
];

export interface DemoExercise {
  name: string;
  sets: Array<{ reps: number | string; loadKg?: number }>;
}

export interface DemoWorkout {
  title: string;
  date: string;
  durationMin: number;
  perceivedEffort: number;
  exercises: DemoExercise[];
}

export const demoLastWorkout: DemoWorkout = {
  title: "Force — haut du corps",
  date: "2026-10-28",
  durationMin: 65,
  perceivedEffort: 7,
  exercises: [
    { name: "Développé couché", sets: [{ reps: 8, loadKg: 70 }, { reps: 8, loadKg: 70 }, { reps: 6, loadKg: 72.5 }] },
    { name: "Tractions", sets: [{ reps: 8 }, { reps: 7 }, { reps: 6 }] },
    { name: "Rowing haltère", sets: [{ reps: 10, loadKg: 30 }, { reps: 10, loadKg: 30 }, { reps: 10, loadKg: 30 }] },
    { name: "Gainage", sets: [{ reps: "45 s" }, { reps: "45 s" }, { reps: "45 s" }] },
  ],
};

export const demoMonthStats = { sessions: 11, totalMinutes: 870, restDays: 6 };

export interface DemoMeasurement {
  label: string;
  startCm: number;
  currentCm: number;
}

export const demoMeasurements: DemoMeasurement[] = [
  { label: "Tour de taille", startCm: 101, currentCm: 98.5 },
  { label: "Tour de hanches", startCm: 104, currentCm: 103 },
  { label: "Poitrine", startCm: 106, currentCm: 105 },
  { label: "Bras (contracté)", startCm: 37.5, currentCm: 37.5 },
  { label: "Cuisse", startCm: 61, currentCm: 60 },
];

export const demoPhotoSlots = [
  { id: "p1", label: "Face", date: "2026-10-06" },
  { id: "p2", label: "Profil", date: "2026-10-06" },
  { id: "p3", label: "Face", date: "2026-10-27" },
  { id: "p4", label: "Profil", date: "2026-10-27" },
];

export interface DemoCoachMessage {
  id: string;
  role: "coach" | "user";
  text: string;
}

/** Exemples rédigés à la main pour illustrer l'interface — PAS générés par une IA. */
export const demoCoachMessages: DemoCoachMessage[] = [
  {
    id: "c1",
    role: "coach",
    text: "Trois semaines de suivi, 5 jours sur 7 renseignés : c'est la régularité qui fait la différence, pas la perfection.",
  },
  { id: "c2", role: "user", text: "Grosse semaine de boulot qui arrive, j'ai peur de lâcher." },
  {
    id: "c3",
    role: "coach",
    text: "On prépare le terrain : 3 repas simples prêts d'avance, et 2 séances courtes au lieu de 4 longues. Le repos planifié reste une victoire.",
  },
];
