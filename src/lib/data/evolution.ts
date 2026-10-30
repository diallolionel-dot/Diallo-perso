import "server-only";
import { getProfile, getSession } from "@/lib/auth/session";
import { addDays, dayOf, dayRange, DEFAULT_TIMEZONE, isValidTimezone, todayIn } from "@/lib/dates";
import { demoMeasurements, demoPhotos, demoProfile, demoWeights } from "@/lib/demo/data";
import { formatDecimal } from "@/lib/format";
import { signedUrlsFor } from "@/lib/supabase/storage";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MEASUREMENT_FIELDS, PHOTO_POSE_LABELS } from "@/lib/validation/schemas";
import type { EvolutionData } from "./types";

const WEIGHT_HISTORY_DAYS = 180;
const RECENT_WEIGHTS = 8;
const RECENT_PHOTOS = 12;

function withDeltas<T extends { weightKg: number }>(newestFirst: T[]) {
  return newestFirst.map((w, i) => {
    const previous = newestFirst[i + 1];
    return { ...w, delta: previous ? Math.round((w.weightKg - previous.weightKg) * 10) / 10 : null };
  });
}

function demoEvolution(): EvolutionData {
  const newestFirst = [...demoWeights].reverse().map((w) => ({ id: w.date, ...w, photoUrl: null }));
  return {
    mode: "demo",
    targetWeightKg: demoProfile.targetWeightKg,
    weights: demoWeights,
    recentWeights: withDeltas(newestFirst).slice(0, 6),
    measurements: demoMeasurements,
    measurementEntries: [],
    photos: demoPhotos.map((p) => ({ id: p.id, pose: PHOTO_POSE_LABELS[p.pose], date: p.date, url: null })),
  };
}

export async function loadEvolution(): Promise<EvolutionData> {
  if (!isSupabaseConfigured()) return demoEvolution();

  const { supabase, user } = await getSession();
  const profile = await getProfile();
  const tz = isValidTimezone(profile.timezone) ? profile.timezone : DEFAULT_TIMEZONE;
  const today = todayIn(tz);

  const [weights, measurements, photos] = await Promise.all([
    supabase
      .from("weight_entries")
      .select("id, measured_at, weight_kg, photo_path")
      .gte("measured_at", dayRange(addDays(today, -WEIGHT_HISTORY_DAYS), tz).start)
      .order("measured_at", { ascending: true }),
    supabase.from("body_measurements").select("*").order("measured_on", { ascending: true }),
    supabase.from("progress_photos").select("id, taken_on, pose, storage_path").order("taken_on", { ascending: false }).limit(RECENT_PHOTOS),
  ]);
  if (weights.error || measurements.error || photos.error) throw new Error("Lecture de l'évolution impossible.");

  const weightRows = weights.data ?? [];
  const newestFirst = [...weightRows].reverse().slice(0, RECENT_WEIGHTS + 1);
  const photoRows = photos.data ?? [];
  const urls = await signedUrlsFor(supabase, user.id, [
    ...newestFirst.map((w) => w.photo_path),
    ...photoRows.map((p) => p.storage_path),
  ]);

  const measurementRows = measurements.data ?? [];
  const summaries = MEASUREMENT_FIELDS.flatMap((field) => {
    const values = measurementRows.map((m) => m[field.column]).filter((v): v is number => v !== null);
    return values.length > 0 ? [{ label: field.label, firstCm: Number(values[0]), latestCm: Number(values[values.length - 1]) }] : [];
  });

  return {
    mode: "live",
    targetWeightKg: profile.target_weight_kg,
    weights: weightRows.map((w) => ({ date: dayOf(w.measured_at, tz), weightKg: Number(w.weight_kg) })),
    recentWeights: withDeltas(
      newestFirst.map((w) => ({
        id: w.id,
        date: dayOf(w.measured_at, tz),
        weightKg: Number(w.weight_kg),
        photoUrl: w.photo_path ? (urls.get(w.photo_path) ?? null) : null,
      })),
    ).slice(0, RECENT_WEIGHTS),
    measurements: summaries,
    measurementEntries: [...measurementRows]
      .reverse()
      .slice(0, 5)
      .map((m) => ({
        id: m.id,
        date: m.measured_on,
        summary: MEASUREMENT_FIELDS.filter((f) => m[f.column] !== null)
          .map((f) => `${f.label} ${formatDecimal(Number(m[f.column]))}`)
          .join(" · "),
      })),
    photos: photoRows.map((p) => ({
      id: p.id,
      pose: PHOTO_POSE_LABELS[p.pose],
      date: p.taken_on,
      url: urls.get(p.storage_path) ?? null,
    })),
  };
}
