import "server-only";
import { getProfile, getSession } from "@/lib/auth/session";
import { addDays, dayOf, dayRange, DEFAULT_TIMEZONE, isValidTimezone, timeOf, todayIn } from "@/lib/dates";
import { demoMeals, demoNutritionHistory, demoProfile } from "@/lib/demo/data";
import { signedUrlsFor } from "@/lib/supabase/storage";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MEAL_SLOT_LABELS } from "@/lib/validation/schemas";
import type { MealView, NutritionData } from "./types";

const HISTORY_DAYS = 7;

function totalsOf(meals: Array<Pick<MealView, "kcal" | "proteinG" | "carbsG" | "fatG">>): NutritionData["totals"] {
  return meals.reduce<NutritionData["totals"]>(
    (acc, m) => ({
      kcal: acc.kcal + (m.kcal ?? 0),
      proteinG: acc.proteinG + (m.proteinG ?? 0),
      carbsG: acc.carbsG + (m.carbsG ?? 0),
      fatG: acc.fatG + (m.fatG ?? 0),
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

function demoNutrition(): NutritionData {
  const meals: MealView[] = demoMeals.map((m) => ({
    ...m,
    slotLabel: MEAL_SLOT_LABELS[m.slot],
    photoUrl: null,
  }));
  return {
    mode: "demo",
    meals,
    totals: totalsOf(meals),
    targets: { calories: demoProfile.dailyCaloriesTarget, protein: demoProfile.dailyProteinTargetG },
    history: demoNutritionHistory,
  };
}

export async function loadNutrition(): Promise<NutritionData> {
  if (!isSupabaseConfigured()) return demoNutrition();

  const { supabase, user } = await getSession();
  const profile = await getProfile();
  const tz = isValidTimezone(profile.timezone) ? profile.timezone : DEFAULT_TIMEZONE;
  const today = todayIn(tz);
  const historyStart = addDays(today, -(HISTORY_DAYS - 1));

  const { data, error } = await supabase
    .from("meals")
    .select("id, eaten_at, slot, title, kcal, protein_g, carbs_g, fat_g, photo_path")
    .gte("eaten_at", dayRange(historyStart, tz).start)
    .order("eaten_at", { ascending: true });
  if (error) throw new Error("Lecture des repas impossible.");

  const rows = data ?? [];
  const todayRows = rows.filter((m) => dayOf(m.eaten_at, tz) === today);
  const urls = await signedUrlsFor(supabase, user.id, todayRows.map((m) => m.photo_path));

  const meals: MealView[] = todayRows.map((m) => ({
    id: m.id,
    slotLabel: MEAL_SLOT_LABELS[m.slot],
    time: timeOf(m.eaten_at, tz),
    title: m.title,
    kcal: m.kcal,
    proteinG: m.protein_g === null ? null : Number(m.protein_g),
    carbsG: m.carbs_g === null ? null : Number(m.carbs_g),
    fatG: m.fat_g === null ? null : Number(m.fat_g),
    photoUrl: m.photo_path ? (urls.get(m.photo_path) ?? null) : null,
    hasPhoto: Boolean(m.photo_path),
  }));

  const byDay = new Map<string, { day: string; kcal: number; proteinG: number; count: number }>();
  for (const m of rows) {
    const day = dayOf(m.eaten_at, tz);
    const entry = byDay.get(day) ?? { day, kcal: 0, proteinG: 0, count: 0 };
    entry.kcal += m.kcal ?? 0;
    entry.proteinG += Number(m.protein_g ?? 0);
    entry.count += 1;
    byDay.set(day, entry);
  }

  return {
    mode: "live",
    meals,
    totals: totalsOf(meals),
    targets: { calories: profile.daily_calories_target, protein: profile.daily_protein_target_g },
    history: [...byDay.values()]
      .map((d) => ({ ...d, proteinG: Math.round(d.proteinG) }))
      .sort((a, b) => b.day.localeCompare(a.day)),
  };
}
