"use server";

import { redirect } from "next/navigation";
import { DEMO_MODE_MESSAGE, actionContext } from "@/lib/actions/context";
import { localDateTimeToIso } from "@/lib/dates";
import type { MediaKind } from "@/lib/media/image";
import { awardForAction, rewardQuery } from "@/lib/rpg/award";
import { fileFromForm, removePrivateImages, uploadPrivateImage } from "@/lib/supabase/storage";
import { errorState, formValues, parseForm, type FormState } from "@/lib/validation/form";
import {
  bodyMeasurementSchema,
  dailyCheckinSchema,
  mealSchema,
  progressPhotoSchema,
  uuidSchema,
  weightEntrySchema,
  workoutSchema,
} from "@/lib/validation/schemas";

const SAVE_FAILED = "L'enregistrement a échoué. Vérifie ta connexion et réessaie.";

type Ctx = NonNullable<Awaited<ReturnType<typeof actionContext>>>;

/** Envoie la photo facultative d'un formulaire. */
async function optionalPhoto(ctx: Ctx, formData: FormData, kind: MediaKind) {
  const file = fileFromForm(formData);
  if (!file) return { ok: true as const, path: null };
  return uploadPrivateImage(ctx.supabase, ctx.user.id, kind, file);
}

// ---------------------------------------------------------------------
// Pesée
// ---------------------------------------------------------------------
export async function createWeightEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await actionContext();
  if (!ctx) return errorState(DEMO_MODE_MESSAGE);

  const parsed = parseForm(weightEntrySchema, formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.data;

  const photo = await optionalPhoto(ctx, formData, "weigh-ins");
  if (!photo.ok) return errorState(photo.message, formValues(formData));

  const { data, error } = await ctx.supabase
    .from("weight_entries")
    .insert({
      user_id: ctx.user.id,
      measured_at: localDateTimeToIso(input.measuredAt, ctx.timezone),
      weight_kg: input.weightKg,
      body_fat_pct: input.bodyFatPct ?? null,
      note: input.note ?? null,
      photo_path: photo.path,
    })
    .select("id")
    .single();

  if (error || !data) {
    await removePrivateImages(ctx.supabase, ctx.user.id, [photo.path]);
    return errorState(SAVE_FAILED, formValues(formData));
  }

  const reward = await awardForAction(ctx.supabase, [{ action: "weigh_in", sourceId: data.id }], input.measuredAt.slice(0, 10), ctx.today);
  redirect(`/evolution${rewardQuery(reward)}`);
}

// ---------------------------------------------------------------------
// Repas
// ---------------------------------------------------------------------
export async function createMeal(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await actionContext();
  if (!ctx) return errorState(DEMO_MODE_MESSAGE);

  const parsed = parseForm(mealSchema, formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.data;

  const photo = await optionalPhoto(ctx, formData, "meals");
  if (!photo.ok) return errorState(photo.message, formValues(formData));

  const { data, error } = await ctx.supabase
    .from("meals")
    .insert({
      user_id: ctx.user.id,
      eaten_at: localDateTimeToIso(input.eatenAt, ctx.timezone),
      slot: input.slot,
      title: input.title,
      kcal: input.kcal ?? null,
      protein_g: input.proteinG ?? null,
      carbs_g: input.carbsG ?? null,
      fat_g: input.fatG ?? null,
      source: "manual",
      note: input.note ?? null,
      photo_path: photo.path,
    })
    .select("id")
    .single();

  if (error || !data) {
    await removePrivateImages(ctx.supabase, ctx.user.id, [photo.path]);
    return errorState(SAVE_FAILED, formValues(formData));
  }

  const reward = await awardForAction(ctx.supabase, [{ action: "meal_logged", sourceId: data.id }], input.eatenAt.slice(0, 10), ctx.today);
  redirect(`/nutrition${rewardQuery(reward)}`);
}

// ---------------------------------------------------------------------
// Séance (ou repos planifié)
// ---------------------------------------------------------------------
export async function createWorkout(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await actionContext();
  if (!ctx) return errorState(DEMO_MODE_MESSAGE);

  const parsed = parseForm(workoutSchema, formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.data;
  const isRest = input.kind === "repos";

  const photo = await optionalPhoto(ctx, formData, "workouts");
  if (!photo.ok) return errorState(photo.message, formValues(formData));

  const { data, error } = await ctx.supabase
    .from("workouts")
    .insert({
      user_id: ctx.user.id,
      started_at: localDateTimeToIso(input.startedAt, ctx.timezone),
      kind: input.kind,
      title: input.title,
      duration_min: isRest ? 0 : input.durationMin,
      perceived_effort: isRest ? null : (input.perceivedEffort ?? null),
      is_planned_rest: isRest,
      note: input.note ?? null,
      photo_path: photo.path,
    })
    .select("id")
    .single();

  if (error || !data) {
    await removePrivateImages(ctx.supabase, ctx.user.id, [photo.path]);
    return errorState(SAVE_FAILED, formValues(formData));
  }

  if (!isRest && input.exercises.length > 0) {
    const { error: exercisesError } = await ctx.supabase.from("workout_exercises").insert(
      input.exercises.map((exercise, position) => ({
        workout_id: data.id,
        user_id: ctx.user.id,
        position,
        name: exercise.name,
        sets: exercise.sets.map((s) => ({ reps: s.reps, load_kg: s.loadKg, duration_s: s.durationS })),
      })),
    );
    if (exercisesError) {
      // Pas de séance à moitié enregistrée.
      await ctx.supabase.from("workouts").delete().eq("id", data.id);
      await removePrivateImages(ctx.supabase, ctx.user.id, [photo.path]);
      return errorState(SAVE_FAILED, formValues(formData));
    }
  }

  const reward = await awardForAction(
    ctx.supabase,
    [{ action: isRest ? "planned_rest" : "workout_logged", sourceId: data.id }],
    input.startedAt.slice(0, 10),
    ctx.today,
  );
  redirect(`/arene${rewardQuery(reward)}`);
}

// ---------------------------------------------------------------------
// Mensurations
// ---------------------------------------------------------------------
export async function createMeasurement(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await actionContext();
  if (!ctx) return errorState(DEMO_MODE_MESSAGE);

  const parsed = parseForm(bodyMeasurementSchema, formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.data;

  const { data, error } = await ctx.supabase
    .from("body_measurements")
    .insert({
      user_id: ctx.user.id,
      measured_on: input.measuredOn,
      waist_cm: input.waistCm ?? null,
      hips_cm: input.hipsCm ?? null,
      chest_cm: input.chestCm ?? null,
      arm_cm: input.armCm ?? null,
      thigh_cm: input.thighCm ?? null,
      neck_cm: input.neckCm ?? null,
      note: input.note ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return errorState(SAVE_FAILED, formValues(formData));

  const reward = await awardForAction(ctx.supabase, [{ action: "measurements_logged", sourceId: data.id }], input.measuredOn, ctx.today);
  redirect(`/evolution${rewardQuery(reward)}`);
}

// ---------------------------------------------------------------------
// Check-in quotidien (un par jour, modifiable)
// ---------------------------------------------------------------------
export async function saveCheckin(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await actionContext();
  if (!ctx) return errorState(DEMO_MODE_MESSAGE);

  const parsed = parseForm(dailyCheckinSchema, formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.data;

  const { data, error } = await ctx.supabase
    .from("daily_checkins")
    .upsert(
      {
        user_id: ctx.user.id,
        day: input.day,
        sleep_hours: input.sleepHours ?? null,
        sleep_quality: input.sleepQuality ?? null,
        energy: input.energy ?? null,
        stress: input.stress ?? null,
        hunger: input.hunger ?? null,
        work_load: input.workLoad ?? null,
        pain_level: input.painLevel ?? null,
        pain_zone: input.painLevel ? (input.painZone ?? null) : null,
        note: input.note ?? null,
      },
      { onConflict: "user_id,day" },
    )
    .select("id")
    .single();

  if (error || !data) return errorState(SAVE_FAILED, formValues(formData));

  const actions: Parameters<typeof awardForAction>[1] = [{ action: "daily_checkin", sourceId: data.id }];
  if (input.sleepHours !== undefined) actions.push({ action: "sleep_logged", sourceId: data.id });
  const reward = await awardForAction(ctx.supabase, actions, input.day, ctx.today);
  redirect(`/${rewardQuery(reward)}`);
}

// ---------------------------------------------------------------------
// Photo de progression
// ---------------------------------------------------------------------
export async function createProgressPhoto(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await actionContext();
  if (!ctx) return errorState(DEMO_MODE_MESSAGE);

  const parsed = parseForm(progressPhotoSchema, formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.data;

  const file = fileFromForm(formData);
  if (!file) {
    return { status: "error", message: "Choisis une photo.", fieldErrors: { photo: "Photo requise" }, values: formValues(formData), nonce: crypto.randomUUID() };
  }
  const upload = await uploadPrivateImage(ctx.supabase, ctx.user.id, "progress", file);
  if (!upload.ok) return errorState(upload.message, formValues(formData));

  const { data, error } = await ctx.supabase
    .from("progress_photos")
    .insert({ user_id: ctx.user.id, taken_on: input.takenOn, pose: input.pose, storage_path: upload.path, note: input.note ?? null })
    .select("id")
    .single();

  if (error || !data) {
    await removePrivateImages(ctx.supabase, ctx.user.id, [upload.path]);
    return errorState(SAVE_FAILED, formValues(formData));
  }

  const reward = await awardForAction(ctx.supabase, [{ action: "progress_photo", sourceId: data.id }], input.takenOn, ctx.today);
  redirect(`/evolution${rewardQuery(reward)}`);
}

// ---------------------------------------------------------------------
// Suppressions (l'XP déjà gagnée est conservée : aucune pénalité)
// ---------------------------------------------------------------------
const DELETABLE = {
  weight_entries: { photoColumn: "photo_path", back: "/evolution" },
  meals: { photoColumn: "photo_path", back: "/nutrition" },
  workouts: { photoColumn: "photo_path", back: "/arene" },
  body_measurements: { photoColumn: null, back: "/evolution" },
  progress_photos: { photoColumn: "storage_path", back: "/evolution" },
} as const;

type DeletableTable = keyof typeof DELETABLE;

async function deleteRow(table: DeletableTable, formData: FormData): Promise<void> {
  const ctx = await actionContext();
  const { back, photoColumn } = DELETABLE[table];
  if (!ctx) redirect(back);

  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) redirect(back);

  let photoPath: string | null = null;
  if (photoColumn) {
    const { data } = await ctx.supabase.from(table).select(photoColumn).eq("id", id.data).maybeSingle();
    const row = data as Record<string, string | null> | null;
    photoPath = row?.[photoColumn] ?? null;
  }

  // La RLS garantit qu'on ne supprime que ses propres lignes.
  const { error } = await ctx.supabase.from(table).delete().eq("id", id.data);
  if (!error) await removePrivateImages(ctx.supabase, ctx.user.id, [photoPath]);
  redirect(back);
}

export async function deleteWeightEntry(formData: FormData) {
  await deleteRow("weight_entries", formData);
}

export async function deleteMeal(formData: FormData) {
  await deleteRow("meals", formData);
}

export async function deleteWorkout(formData: FormData) {
  await deleteRow("workouts", formData);
}

export async function deleteMeasurement(formData: FormData) {
  await deleteRow("body_measurements", formData);
}

export async function deleteProgressPhoto(formData: FormData) {
  await deleteRow("progress_photos", formData);
}
