import { z } from "zod";
import { XP_ACTIONS } from "@/lib/rpg/xp";

/**
 * Schémas de validation des saisies. Ils reprennent les contraintes CHECK
 * de la migration SQL : la base reste la dernière ligne de défense, mais
 * les erreurs sont signalées à l'utilisateur avant tout envoi.
 *
 * Phase 1 : schémas prêts, branchés sur les formulaires en phase 2.
 */

const isoDate = z.iso.date();
const optionalNote = z.string().trim().max(1000).optional();
const scale1to5 = z.number().int().min(1).max(5);

export const weightEntrySchema = z.object({
  measuredAt: z.iso.datetime({ offset: true }),
  weightKg: z.number().min(30).max(300),
  bodyFatPct: z.number().min(2).max(70).optional(),
  note: optionalNote,
});

export const MEAL_SLOTS = ["petit_dejeuner", "dejeuner", "collation", "diner"] as const;

export const mealSchema = z.object({
  eatenAt: z.iso.datetime({ offset: true }),
  slot: z.enum(MEAL_SLOTS),
  title: z.string().trim().min(1).max(160),
  kcal: z.number().int().min(0).max(5000).optional(),
  proteinG: z.number().min(0).max(500).optional(),
  carbsG: z.number().min(0).max(1000).optional(),
  fatG: z.number().min(0).max(500).optional(),
  note: optionalNote,
});

export const WORKOUT_KINDS = ["combat", "force", "cardio", "mobilite", "repos"] as const;

export const exerciseSetSchema = z.object({
  reps: z.number().int().min(0).max(500).optional(),
  loadKg: z.number().min(0).max(500).optional(),
  durationS: z.number().int().min(0).max(7200).optional(),
});

export const workoutExerciseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sets: z.array(exerciseSetSchema).max(30),
});

export const workoutSchema = z
  .object({
    startedAt: z.iso.datetime({ offset: true }),
    kind: z.enum(WORKOUT_KINDS),
    title: z.string().trim().min(1).max(120),
    durationMin: z.number().int().min(0).max(600),
    perceivedEffort: z.number().int().min(1).max(10).optional(),
    isPlannedRest: z.boolean().default(false),
    exercises: z.array(workoutExerciseSchema).max(40).default([]),
    note: optionalNote,
  })
  .refine((w) => !w.isPlannedRest || w.kind === "repos", {
    message: "Un repos planifié doit être de type « repos ».",
    path: ["kind"],
  });

const centimeters = z.number().min(10).max(250);

export const bodyMeasurementSchema = z
  .object({
    measuredOn: isoDate,
    waistCm: centimeters.optional(),
    hipsCm: centimeters.optional(),
    chestCm: centimeters.optional(),
    armCm: centimeters.optional(),
    thighCm: centimeters.optional(),
    neckCm: centimeters.optional(),
    note: optionalNote,
  })
  .refine((m) => [m.waistCm, m.hipsCm, m.chestCm, m.armCm, m.thighCm, m.neckCm].some((v) => v !== undefined), {
    message: "Au moins une mensuration est requise.",
  });

export const PHOTO_POSES = ["face", "profil", "dos", "autre"] as const;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const photoUploadSchema = z.object({
  pose: z.enum(PHOTO_POSES),
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
});

export const dailyCheckinSchema = z.object({
  day: isoDate,
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: scale1to5.optional(),
  energy: scale1to5.optional(),
  stress: scale1to5.optional(),
  hunger: scale1to5.optional(),
  note: optionalNote,
});

export const coachMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

export const xpActionSchema = z.enum(XP_ACTIONS);

export type WeightEntryInput = z.infer<typeof weightEntrySchema>;
export type MealInput = z.infer<typeof mealSchema>;
export type WorkoutInput = z.infer<typeof workoutSchema>;
export type BodyMeasurementInput = z.infer<typeof bodyMeasurementSchema>;
export type DailyCheckinInput = z.infer<typeof dailyCheckinSchema>;
export type CoachMessageInput = z.infer<typeof coachMessageSchema>;
