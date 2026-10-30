import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, jpegFile } from "@/test/fake-supabase";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ENTRY_ID = "22222222-2222-4222-8222-222222222222";

const state = vi.hoisted(() => ({ fake: null as ReturnType<typeof import("@/test/fake-supabase").createFakeSupabase> | null }));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({ supabase: state.fake!.client, user: { id: USER_ID, email: "moi@example.com" } }),
  getProfile: async () => ({ id: USER_ID, timezone: "Europe/Paris" }),
}));

const { createMeal, createWeightEntry, createWorkout, deleteMeal, saveCheckin } = await import("./tracking");

function form(values: Record<string, string>, photo?: File): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(values)) data.append(k, v);
  if (photo) data.append("photo", photo);
  return data;
}

async function redirectOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    const message = (error as Error).message;
    if (message.startsWith("REDIRECT:")) return message.slice("REDIRECT:".length);
    throw error;
  }
  throw new Error("Aucune redirection");
}

const idle = { status: "idle" as const };

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://abcdefghijklmnop.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_key_000000");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-30T06:15:00Z"));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("pesée", () => {
  it("valide, envoie la photo dans le dossier de l'utilisateur, convertit l'heure de Paris et attribue l'XP", async () => {
    state.fake = createFakeSupabase({
      responses: { "weight_entries.insert": { data: { id: ENTRY_ID }, error: null } },
      rpc: { award_xp: { data: 10, error: null }, refresh_achievements: { data: ["premier_pas"], error: null } },
    });

    const url = await redirectOf(
      createWeightEntry(idle, form({ measuredAt: "2026-10-30T07:30", weightKg: "90,4", note: "" }, jpegFile())),
    );

    const { uploads, queries, rpcCalls } = state.fake;
    expect(uploads).toHaveLength(1);
    expect(uploads[0].bucket).toBe("private-media");
    expect(uploads[0].path).toMatch(new RegExp(`^${USER_ID}/weigh-ins/[0-9a-f-]{36}\\.jpg$`));

    const insert = queries.find((q) => q.table === "weight_entries" && q.op === "insert")!;
    expect(insert.payload).toMatchObject({
      user_id: USER_ID,
      weight_kg: 90.4,
      measured_at: "2026-10-30T06:30:00.000Z",
      photo_path: uploads[0].path,
      note: null,
    });

    expect(rpcCalls[0]).toEqual({ fn: "award_xp", args: { p_action: "weigh_in", p_occurred_on: "2026-10-30", p_source_id: ENTRY_ID } });
    expect(rpcCalls.map((c) => c.fn)).toEqual(["award_xp", "check_consistency_week", "refresh_achievements"]);
    expect(url).toBe("/evolution?xp=10&succes=premier_pas");
  });

  it("refuse une saisie invalide sans rien écrire", async () => {
    state.fake = createFakeSupabase();
    const result = await createWeightEntry(idle, form({ measuredAt: "2026-10-30T07:30", weightKg: "abc" }));
    expect(result.status).toBe("error");
    expect(result.fieldErrors?.weightKg).toBeDefined();
    expect(state.fake.queries).toHaveLength(0);
    expect(state.fake.uploads).toHaveLength(0);
  });

  it("refuse un fichier déguisé en photo", async () => {
    state.fake = createFakeSupabase();
    const fakePhoto = new File(["<html>pas une image</html>"], "photo.jpg", { type: "image/jpeg" });
    const result = await createWeightEntry(idle, form({ measuredAt: "2026-10-30T07:30", weightKg: "90" }, fakePhoto));
    expect(result.message).toMatch(/Format non reconnu/);
    expect(state.fake.uploads).toHaveLength(0);
    expect(state.fake.queries).toHaveLength(0);
  });

  it("supprime la photo envoyée si l'enregistrement échoue", async () => {
    state.fake = createFakeSupabase({ responses: { "weight_entries.insert": { data: null, error: { message: "boom" } } } });
    const result = await createWeightEntry(idle, form({ measuredAt: "2026-10-30T07:30", weightKg: "90" }, jpegFile()));
    expect(result.status).toBe("error");
    expect(result.values?.weightKg).toBe("90");
    expect(state.fake.removed).toEqual([state.fake.uploads[0].path]);
    expect(state.fake.rpcCalls).toHaveLength(0);
  });
});

describe("mode démonstration", () => {
  it("n'écrit rien quand Supabase n'est pas configuré", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "");
    state.fake = createFakeSupabase();
    const result = await createMeal(idle, form({ eatenAt: "2026-10-30T12:30", slot: "dejeuner", title: "Poulet riz" }));
    expect(result.message).toMatch(/Mode démonstration/);
    expect(state.fake.queries).toHaveLength(0);
  });
});

describe("séance", () => {
  it("enregistre un repos planifié sans durée ni exercices et l'XP de repos", async () => {
    state.fake = createFakeSupabase({
      responses: { "workouts.insert": { data: { id: ENTRY_ID }, error: null } },
      rpc: { award_xp: { data: 15, error: null } },
    });
    const url = await redirectOf(
      createWorkout(idle, form({ kind: "repos", title: "Repos planifié", durationMin: "0", startedAt: "2026-10-30T09:00", exercises: "[]" })),
    );
    const insert = state.fake.queries.find((q) => q.table === "workouts" && q.op === "insert")!;
    expect(insert.payload).toMatchObject({ kind: "repos", is_planned_rest: true, duration_min: 0, perceived_effort: null });
    expect(state.fake.queries.some((q) => q.table === "workout_exercises")).toBe(false);
    expect(state.fake.rpcCalls[0].args).toMatchObject({ p_action: "planned_rest" });
    expect(url).toBe("/arene?xp=15");
  });

  it("enregistre les exercices et annule la séance si leur insertion échoue", async () => {
    state.fake = createFakeSupabase({
      responses: {
        "workouts.insert": { data: { id: ENTRY_ID }, error: null },
        "workout_exercises.insert": { data: null, error: { message: "boom" } },
      },
    });
    const exercises = JSON.stringify([{ name: "Développé couché", sets: [{ reps: 8, loadKg: 70 }] }]);
    const result = await createWorkout(
      idle,
      form({ kind: "force", title: "Haut", durationMin: "65", startedAt: "2026-10-30T18:00", exercises }),
    );
    const exercisesInsert = state.fake.queries.find((q) => q.table === "workout_exercises")!;
    expect(exercisesInsert.payload).toEqual([
      { workout_id: ENTRY_ID, user_id: USER_ID, position: 0, name: "Développé couché", sets: [{ reps: 8, load_kg: 70, duration_s: undefined }] },
    ]);
    expect(state.fake.queries.some((q) => q.table === "workouts" && q.op === "delete")).toBe(true);
    expect(result.status).toBe("error");
    expect(state.fake.rpcCalls).toHaveLength(0);
  });
});

describe("check-in", () => {
  it("met à jour le check-in du jour et attribue check-in + sommeil", async () => {
    state.fake = createFakeSupabase({ responses: { "daily_checkins.upsert": { data: { id: ENTRY_ID }, error: null } } });
    await redirectOf(saveCheckin(idle, form({ day: "2026-10-30", sleepHours: "6,5", energy: "3", painLevel: "0", painZone: "genou" })));
    const upsert = state.fake.queries.find((q) => q.op === "upsert")!;
    expect(upsert.options).toEqual({ onConflict: "user_id,day" });
    expect(upsert.payload).toMatchObject({ user_id: USER_ID, day: "2026-10-30", sleep_hours: 6.5, energy: 3, pain_level: 0, pain_zone: null });
    const awarded = state.fake.rpcCalls.filter((c) => c.fn === "award_xp").map((c) => (c.args as { p_action: string }).p_action);
    expect(awarded).toEqual(["daily_checkin", "sleep_logged"]);
  });
});

describe("suppression", () => {
  it("supprime le repas et sa photo", async () => {
    const path = `${USER_ID}/meals/${ENTRY_ID}.jpg`;
    state.fake = createFakeSupabase({ responses: { "meals.select": { data: { photo_path: path }, error: null } } });
    const url = await redirectOf(deleteMeal(form({ id: ENTRY_ID })));
    const del = state.fake.queries.find((q) => q.op === "delete")!;
    expect(del).toMatchObject({ table: "meals", filters: [["eq", "id", ENTRY_ID]] });
    expect(state.fake.removed).toEqual([path]);
    expect(url).toBe("/nutrition");
  });

  it("ignore un identifiant invalide", async () => {
    state.fake = createFakeSupabase();
    await redirectOf(deleteMeal(form({ id: "1 OR 1=1" })));
    expect(state.fake.queries.some((q) => q.op === "delete")).toBe(false);
  });

  it("ne supprime jamais une photo hors du dossier de l'utilisateur", async () => {
    state.fake = createFakeSupabase({
      responses: { "meals.select": { data: { photo_path: `${ENTRY_ID}/meals/autre.jpg` }, error: null } },
    });
    await redirectOf(deleteMeal(form({ id: ENTRY_ID })));
    expect(state.fake.removed).toEqual([]);
  });
});
