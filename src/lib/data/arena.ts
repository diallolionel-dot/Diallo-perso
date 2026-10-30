import "server-only";
import { getProfile, getSession } from "@/lib/auth/session";
import { addDays, dayOf, dayRange, DEFAULT_TIMEZONE, isValidTimezone, startOfWeek, todayIn, weekdayShort } from "@/lib/dates";
import { demoMonthStats, demoSessions, demoWeek } from "@/lib/demo/data";
import { signedUrlsFor } from "@/lib/supabase/storage";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Json } from "@/types/database";
import type { ArenaData, SessionView } from "./types";

const RECENT_SESSIONS = 10;

function demoArena(): ArenaData {
  return {
    mode: "demo",
    monthStats: demoMonthStats,
    week: demoWeek.map((d) => ({ day: d.day, label: d.label, kind: d.kind })),
    sessions: demoSessions.map((s) => ({
      ...s,
      exercises: s.exercises.map((e) => ({ name: e.name, sets: e.sets.map((set) => ({ ...set })) })),
      photoUrl: null,
    })),
  };
}

function parseSets(sets: Json): SessionView["exercises"][number]["sets"] {
  if (!Array.isArray(sets)) return [];
  return sets.flatMap((s) => {
    if (!s || typeof s !== "object" || Array.isArray(s)) return [];
    const num = (v: Json | undefined) => (typeof v === "number" ? v : undefined);
    return [{ reps: num(s.reps), loadKg: num(s.load_kg), durationS: num(s.duration_s) }];
  });
}

export async function loadArena(): Promise<ArenaData> {
  if (!isSupabaseConfigured()) return demoArena();

  const { supabase, user } = await getSession();
  const profile = await getProfile();
  const tz = isValidTimezone(profile.timezone) ? profile.timezone : DEFAULT_TIMEZONE;
  const today = todayIn(tz);
  const monthStart = `${today.slice(0, 7)}-01`;
  const weekStart = startOfWeek(today);

  const [month, recent] = await Promise.all([
    supabase
      .from("workouts")
      .select("started_at, title, kind, duration_min, is_planned_rest")
      .gte("started_at", dayRange(monthStart < weekStart ? monthStart : weekStart, tz).start)
      .order("started_at", { ascending: true }),
    supabase
      .from("workouts")
      .select("id, started_at, title, kind, duration_min, perceived_effort, photo_path, workout_exercises(name, position, sets)")
      .order("started_at", { ascending: false })
      .limit(RECENT_SESSIONS),
  ]);
  if (month.error || recent.error) throw new Error("Lecture des séances impossible.");

  const monthRows = (month.data ?? []).filter((w) => dayOf(w.started_at, tz) >= monthStart);
  const weekRows = (month.data ?? []).filter((w) => dayOf(w.started_at, tz) >= weekStart);
  const urls = await signedUrlsFor(supabase, user.id, (recent.data ?? []).map((w) => w.photo_path));

  return {
    mode: "live",
    monthStats: {
      sessions: monthRows.filter((w) => !w.is_planned_rest).length,
      totalMinutes: monthRows.reduce((sum, w) => sum + w.duration_min, 0),
      restDays: monthRows.filter((w) => w.is_planned_rest).length,
    },
    week: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const session = weekRows.find((w) => dayOf(w.started_at, tz) === date);
      return { day: weekdayShort(date), label: session?.title ?? null, kind: session?.kind ?? null, isToday: date === today };
    }),
    sessions: (recent.data ?? []).map((w) => ({
      id: w.id,
      title: w.title,
      kind: w.kind,
      date: dayOf(w.started_at, tz),
      durationMin: w.duration_min,
      perceivedEffort: w.perceived_effort,
      exercises: [...(w.workout_exercises ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((e) => ({ name: e.name, sets: parseSets(e.sets) })),
      photoUrl: w.photo_path ? (urls.get(w.photo_path) ?? null) : null,
    })),
  };
}
