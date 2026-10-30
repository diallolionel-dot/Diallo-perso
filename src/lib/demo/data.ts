/**
 * ⚠️ DONNÉES FICTIVES DE DÉMONSTRATION.
 *
 * Utilisées uniquement quand Supabase n'est pas configuré. Rien n'est lu ni
 * écrit dans une base. Les dates sont fixes pour garder un rendu déterministe.
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

export const demoToday = {
  date: "2026-10-29",
  sleepHours: 6.5,
  workout: { label: "MMA — technique & sparring", durationMin: 90 },
  xpGainedToday: 55,
  activity: { weighedIn: true, mealsLogged: 4, trained: true, plannedRest: false, sleepLogged: false, checkinDone: false },
};

export const demoWeights = [
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

export const demoTrackedDays = ["2026-10-23", "2026-10-24", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"];
export const demoRestDays = ["2026-10-25"];

export const demoUnlockedAchievements = ["premier_pas", "premiere_arene", "sept_soleils", "repos_du_sage"];

export const demoMeals = [
  { id: "m1", slot: "petit_dejeuner", time: "07:40", title: "Œufs brouillés, pain complet, café", kcal: 420, proteinG: 28, carbsG: 32, fatG: 18, hasPhoto: true },
  { id: "m2", slot: "dejeuner", time: "12:55", title: "Poulet, riz basmati, haricots verts", kcal: 640, proteinG: 52, carbsG: 70, fatG: 14, hasPhoto: true },
  { id: "m3", slot: "collation", time: "16:30", title: "Fromage blanc 0 %, fruits rouges", kcal: 180, proteinG: 22, carbsG: 18, fatG: 1, hasPhoto: false },
  { id: "m4", slot: "diner", time: "20:45", title: "Thon, patate douce, salade", kcal: 400, proteinG: 26, carbsG: 30, fatG: 19, hasPhoto: true },
] as const;

export const demoNutritionHistory = [
  { day: "2026-10-29", kcal: 1640, proteinG: 128, count: 4 },
  { day: "2026-10-28", kcal: 2050, proteinG: 151, count: 4 },
  { day: "2026-10-27", kcal: 1890, proteinG: 142, count: 3 },
  { day: "2026-10-26", kcal: 2310, proteinG: 118, count: 3 },
  { day: "2026-10-25", kcal: 1720, proteinG: 133, count: 4 },
];

export const demoWeek = [
  { day: "Lun", label: "MMA", kind: "combat" },
  { day: "Mar", label: "Force — haut", kind: "force" },
  { day: "Mer", label: "Repos planifié", kind: "repos" },
  { day: "Jeu", label: "Boxe", kind: "combat" },
  { day: "Ven", label: "Grappling", kind: "combat" },
  { day: "Sam", label: "Moringue + cardio", kind: "cardio" },
  { day: "Dim", label: "Repos planifié", kind: "repos" },
] as const;

export const demoSessions = [
  {
    id: "w1",
    title: "Force — haut du corps",
    kind: "force",
    date: "2026-10-28",
    durationMin: 65,
    perceivedEffort: 7,
    exercises: [
      { name: "Développé couché", sets: [{ reps: 8, loadKg: 70 }, { reps: 8, loadKg: 70 }, { reps: 6, loadKg: 72.5 }] },
      { name: "Tractions", sets: [{ reps: 8 }, { reps: 7 }, { reps: 6 }] },
      { name: "Rowing haltère", sets: [{ reps: 10, loadKg: 30 }, { reps: 10, loadKg: 30 }, { reps: 10, loadKg: 30 }] },
      { name: "Gainage", sets: [{ durationS: 45 }, { durationS: 45 }, { durationS: 45 }] },
    ],
  },
  { id: "w2", title: "MMA — technique & sparring", kind: "combat", date: "2026-10-27", durationMin: 90, perceivedEffort: 8, exercises: [] },
] as const;

export const demoMonthStats = { sessions: 11, totalMinutes: 870, restDays: 6 };

export const demoMeasurements = [
  { label: "Tour de taille", firstCm: 101, latestCm: 98.5 },
  { label: "Tour de hanches", firstCm: 104, latestCm: 103 },
  { label: "Poitrine", firstCm: 106, latestCm: 105 },
  { label: "Bras (contracté)", firstCm: 37.5, latestCm: 37.5 },
  { label: "Cuisse", firstCm: 61, latestCm: 60 },
];

export const demoPhotos = [
  { id: "p1", pose: "face", date: "2026-10-06" },
  { id: "p2", pose: "profil", date: "2026-10-06" },
  { id: "p3", pose: "face", date: "2026-10-27" },
  { id: "p4", pose: "profil", date: "2026-10-27" },
] as const;

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
