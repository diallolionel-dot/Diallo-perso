import "server-only";
import { getProfile, getSession } from "@/lib/auth/session";
import { addDays, dayOf, dayRange, daysBetween, DEFAULT_TIMEZONE, isValidTimezone, todayIn } from "@/lib/dates";
import { demoProfile, demoRestDays, demoToday, demoTrackedDays, demoUnlockedAchievements, demoWeights } from "@/lib/demo/data";
import { achievementStatuses } from "@/lib/rpg/achievements";
import { buildConsistencyWindow, buildDailyQuests } from "@/lib/rpg/quests";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { DashboardData } from "./types";

const WEIGHT_HISTORY_DAYS = 120;

function demoDashboard(): DashboardData {
  return {
    mode: "demo",
    displayName: demoProfile.displayName,
    dayNumber: daysBetween(demoProfile.startDate, demoToday.date) + 1,
    startWeightKg: demoProfile.startWeightKg,
    targetWeightKg: demoProfile.targetWeightKg,
    weights: demoWeights,
    totalXp: demoProfile.totalXp,
    xpToday: demoToday.xpGainedToday,
    today: {
      caloriesKcal: 1640,
      proteinG: 128,
      mealsCount: demoToday.activity.mealsLogged,
      sleepHours: demoToday.sleepHours,
      workout: demoToday.workout,
      plannedRest: false,
      painLevel: null,
    },
    targets: { calories: demoProfile.dailyCaloriesTarget, protein: demoProfile.dailyProteinTargetG },
    quests: buildDailyQuests(demoToday.activity),
    consistency: buildConsistencyWindow(demoToday.date, new Set(demoTrackedDays), new Set(demoRestDays)),
    achievements: achievementStatuses(new Set(demoUnlockedAchievements)),
  };
}

export async function loadDashboard(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) return demoDashboard();

  const { supabase } = await getSession();
  const profile = await getProfile();
  const tz = isValidTimezone(profile.timezone) ? profile.timezone : DEFAULT_TIMEZONE;
  const today = todayIn(tz);
  const todayRange = dayRange(today, tz);
  const weekStart = addDays(today, -6);

  const [weights, meals, checkin, workouts, xp, recentRests, achievements] = await Promise.all([
    supabase
      .from("weight_entries")
      .select("measured_at, weight_kg")
      .gte("measured_at", dayRange(addDays(today, -WEIGHT_HISTORY_DAYS), tz).start)
      .order("measured_at", { ascending: true }),
    supabase.from("meals").select("kcal, protein_g").gte("eaten_at", todayRange.start).lt("eaten_at", todayRange.end),
    supabase.from("daily_checkins").select("sleep_hours, pain_level").eq("day", today).maybeSingle(),
    supabase
      .from("workouts")
      .select("title, duration_min, is_planned_rest")
      .gte("started_at", todayRange.start)
      .lt("started_at", todayRange.end),
    supabase.from("xp_events").select("xp, occurred_on"),
    supabase.from("workouts").select("started_at").eq("is_planned_rest", true).gte("started_at", dayRange(weekStart, tz).start),
    supabase.from("achievements").select("code"),
  ]);

  const failed = [weights, meals, checkin, workouts, xp, recentRests, achievements].find((r) => r.error);
  if (failed) throw new Error("Lecture du tableau de bord impossible.");

  const weightPoints = (weights.data ?? []).map((w) => ({ date: dayOf(w.measured_at, tz), weightKg: Number(w.weight_kg) }));
  const xpEvents = xp.data ?? [];
  const todayWorkouts = workouts.data ?? [];
  const training = todayWorkouts.find((w) => !w.is_planned_rest);
  const plannedRest = todayWorkouts.some((w) => w.is_planned_rest);
  const mealRows = meals.data ?? [];
  const weighedToday = weightPoints.some((w) => w.date === today);

  return {
    mode: "live",
    displayName: profile.display_name,
    dayNumber: profile.start_date ? Math.max(1, daysBetween(profile.start_date, today) + 1) : null,
    startWeightKg: profile.start_weight_kg ?? weightPoints[0]?.weightKg ?? null,
    targetWeightKg: profile.target_weight_kg,
    weights: weightPoints,
    totalXp: xpEvents.reduce((sum, e) => sum + e.xp, 0),
    xpToday: xpEvents.filter((e) => e.occurred_on === today).reduce((sum, e) => sum + e.xp, 0),
    today: {
      caloriesKcal: mealRows.reduce((sum, m) => sum + (m.kcal ?? 0), 0),
      proteinG: Math.round(mealRows.reduce((sum, m) => sum + Number(m.protein_g ?? 0), 0)),
      mealsCount: mealRows.length,
      sleepHours: checkin.data?.sleep_hours ?? null,
      workout: training ? { label: training.title, durationMin: training.duration_min } : null,
      plannedRest,
      painLevel: checkin.data?.pain_level ?? null,
    },
    targets: { calories: profile.daily_calories_target, protein: profile.daily_protein_target_g },
    quests: buildDailyQuests({
      weighedIn: weighedToday,
      mealsLogged: mealRows.length,
      trained: Boolean(training),
      plannedRest,
      sleepLogged: checkin.data?.sleep_hours != null,
      checkinDone: Boolean(checkin.data),
    }),
    consistency: buildConsistencyWindow(
      today,
      new Set(xpEvents.filter((e) => e.occurred_on >= weekStart).map((e) => e.occurred_on)),
      new Set((recentRests.data ?? []).map((w) => dayOf(w.started_at, tz))),
    ),
    achievements: achievementStatuses(new Set((achievements.data ?? []).map((a) => a.code))),
  };
}
