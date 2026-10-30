import { z } from "zod";
import { isValidTimezone } from "@/lib/dates";
import { XP_ACTIONS } from "@/lib/rpg/xp";

/**
 * Schémas de validation des formulaires. Ils reçoivent les valeurs brutes
 * d'un FormData (chaînes) et reprennent les contraintes CHECK de la base :
 * la base reste la dernière ligne de défense, mais les erreurs sont
 * expliquées à l'utilisateur avant tout envoi.
 */

/** Chaîne vide ou espaces → undefined. */
const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/** Nombre saisi au clavier français : « 90,4 » est accepté. */
function decimal(min: number, max: number) {
  return z.preprocess(
    (v) => {
      const cleaned = emptyToUndefined(v);
      return typeof cleaned === "string" ? Number(cleaned.replace(",", ".").replace(/\s/g, "")) : cleaned;
    },
    z.number({ error: "Nombre attendu" }).min(min, `Minimum ${min}`).max(max, `Maximum ${max}`),
  );
}

function integer(min: number, max: number) {
  return z.preprocess(
    (v) => {
      const cleaned = emptyToUndefined(v);
      return typeof cleaned === "string" ? Number(cleaned.replace(/\s/g, "")) : cleaned;
    },
    z.number({ error: "Nombre attendu" }).int("Nombre entier attendu").min(min, `Minimum ${min}`).max(max, `Maximum ${max}`),
  );
}

const optional = <T extends z.ZodType>(schema: T) => z.preprocess(emptyToUndefined, schema.optional());

const text = (max: number) => z.string().trim().max(max, `${max} caractères maximum`);
const optionalText = (max: number) => optional(text(max));
const requiredText = (max: number) => z.string({ error: "Champ requis" }).trim().min(1, "Champ requis").max(max, `${max} caractères maximum`);

const localDateTime = z
  .string({ error: "Date requise" })
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date et heure invalides");
const localDate = z.iso.date({ error: "Date invalide" });

const scale1to5 = optional(integer(1, 5));

// ---------------------------------------------------------------------
// Connexion
// ---------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.email({ error: "Adresse e-mail invalide" }).max(254),
  password: z.string().min(6, "6 caractères minimum").max(128),
});

// ---------------------------------------------------------------------
// Pesée
// ---------------------------------------------------------------------
export const weightEntrySchema = z.object({
  measuredAt: localDateTime,
  weightKg: decimal(30, 300),
  bodyFatPct: optional(decimal(2, 70)),
  note: optionalText(1000),
});

// ---------------------------------------------------------------------
// Repas
// ---------------------------------------------------------------------
export const MEAL_SLOTS = ["petit_dejeuner", "dejeuner", "collation", "diner"] as const;
export const MEAL_SLOT_LABELS: Record<(typeof MEAL_SLOTS)[number], string> = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  collation: "Collation",
  diner: "Dîner",
};

export const mealSchema = z.object({
  eatenAt: localDateTime,
  slot: z.enum(MEAL_SLOTS, { error: "Moment du repas requis" }),
  title: requiredText(160),
  kcal: optional(integer(0, 5000)),
  proteinG: optional(decimal(0, 500)),
  carbsG: optional(decimal(0, 1000)),
  fatG: optional(decimal(0, 500)),
  note: optionalText(1000),
});

// ---------------------------------------------------------------------
// Séance
// ---------------------------------------------------------------------
export const WORKOUT_KINDS = ["combat", "force", "cardio", "mobilite", "repos"] as const;
export const WORKOUT_KIND_LABELS: Record<(typeof WORKOUT_KINDS)[number], string> = {
  combat: "Combat",
  force: "Force",
  cardio: "Cardio",
  mobilite: "Mobilité",
  repos: "Repos planifié",
};

export const exerciseSetSchema = z
  .object({
    reps: z.number().int().min(0).max(500).optional(),
    loadKg: z.number().min(0).max(500).optional(),
    durationS: z.number().int().min(0).max(7200).optional(),
  })
  .refine((s) => s.reps !== undefined || s.durationS !== undefined, "Répétitions ou durée requises");

export const workoutExerciseSchema = z.object({
  name: requiredText(120),
  sets: z.array(exerciseSetSchema).max(30, "30 séries maximum"),
});

/** Les exercices arrivent sérialisés en JSON depuis le formulaire. */
const exercisesJson = z.preprocess((v) => {
  const cleaned = emptyToUndefined(v);
  if (cleaned === undefined) return [];
  if (typeof cleaned !== "string") return cleaned;
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}, z.array(workoutExerciseSchema, { error: "Liste d'exercices invalide" }).max(40, "40 exercices maximum"));

export const workoutSchema = z.object({
  startedAt: localDateTime,
  kind: z.enum(WORKOUT_KINDS, { error: "Type de séance requis" }),
  title: requiredText(120),
  durationMin: integer(0, 600),
  perceivedEffort: optional(integer(1, 10)),
  exercises: exercisesJson,
  note: optionalText(1000),
});

// ---------------------------------------------------------------------
// Mensurations
// ---------------------------------------------------------------------
const centimeters = optional(decimal(10, 250));

export const MEASUREMENT_FIELDS = [
  { key: "waistCm", column: "waist_cm", label: "Tour de taille" },
  { key: "hipsCm", column: "hips_cm", label: "Tour de hanches" },
  { key: "chestCm", column: "chest_cm", label: "Poitrine" },
  { key: "armCm", column: "arm_cm", label: "Bras (contracté)" },
  { key: "thighCm", column: "thigh_cm", label: "Cuisse" },
  { key: "neckCm", column: "neck_cm", label: "Cou" },
] as const;

export const bodyMeasurementSchema = z
  .object({
    measuredOn: localDate,
    waistCm: centimeters,
    hipsCm: centimeters,
    chestCm: centimeters,
    armCm: centimeters,
    thighCm: centimeters,
    neckCm: centimeters,
    note: optionalText(1000),
  })
  .refine((m) => MEASUREMENT_FIELDS.some((f) => m[f.key] !== undefined), {
    message: "Au moins une mensuration est requise.",
    path: ["waistCm"],
  });

// ---------------------------------------------------------------------
// Check-in quotidien
// ---------------------------------------------------------------------
export const dailyCheckinSchema = z.object({
  day: localDate,
  sleepHours: optional(decimal(0, 24)),
  sleepQuality: scale1to5,
  energy: scale1to5,
  stress: scale1to5,
  hunger: scale1to5,
  workLoad: scale1to5,
  painLevel: optional(integer(0, 10)),
  painZone: optionalText(80),
  note: optionalText(1000),
});

// ---------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------
export const PHOTO_POSES = ["face", "profil", "dos", "autre"] as const;
export const PHOTO_POSE_LABELS: Record<(typeof PHOTO_POSES)[number], string> = {
  face: "Face",
  profil: "Profil",
  dos: "Dos",
  autre: "Autre",
};

export const progressPhotoSchema = z.object({
  takenOn: localDate,
  pose: z.enum(PHOTO_POSES, { error: "Pose requise" }),
  note: optionalText(1000),
});

// ---------------------------------------------------------------------
// Profil
// ---------------------------------------------------------------------
export const profileSchema = z
  .object({
    displayName: optionalText(60),
    heightCm: optional(decimal(100, 250)),
    birthYear: optional(integer(1920, 2020)),
    startWeightKg: optional(decimal(30, 300)),
    targetWeightKg: optional(decimal(30, 300)),
    startDate: optional(localDate),
    dailyCaloriesTarget: optional(integer(800, 6000)),
    dailyProteinTargetG: optional(integer(0, 500)),
    coachContext: optionalText(8000),
    timezone: z.string().trim().refine(isValidTimezone, "Fuseau horaire inconnu"),
  })
  .refine(
    (p) => p.startWeightKg === undefined || p.targetWeightKg === undefined || p.targetWeightKg !== p.startWeightKg,
    { message: "L'objectif doit différer du poids de départ.", path: ["targetWeightKg"] },
  );

export const deleteDataSchema = z.object({
  confirm: z.literal("SUPPRIMER", { error: "Tape SUPPRIMER pour confirmer." }),
});

// ---------------------------------------------------------------------
// Mentor (phase 3)
// ---------------------------------------------------------------------
export const coachMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

export const xpActionSchema = z.enum(XP_ACTIONS);

export const uuidSchema = z.uuid();

export type WeightEntryInput = z.infer<typeof weightEntrySchema>;
export type MealInput = z.infer<typeof mealSchema>;
export type WorkoutInput = z.infer<typeof workoutSchema>;
export type BodyMeasurementInput = z.infer<typeof bodyMeasurementSchema>;
export type DailyCheckinInput = z.infer<typeof dailyCheckinSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
