import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "@/test/fake-supabase";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const state = vi.hoisted(() => ({ fake: null as ReturnType<typeof import("@/test/fake-supabase").createFakeSupabase> | null }));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => state.fake!.client,
  createSupabaseAdminClient: () => state.fake!.client,
  PRIVATE_MEDIA_BUCKET: "private-media",
  SIGNED_URL_TTL_SECONDS: 600,
}));
vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({ supabase: state.fake!.client, user: { id: USER_ID, email: null } }),
  getProfile: async () => ({ id: USER_ID, timezone: "Europe/Paris" }),
}));

const { signIn } = await import("./auth");
const { deleteAllData, updateProfile } = await import("./profile");

const idle = { status: "idle" as const };

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(values)) data.append(k, v);
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

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://abcdefghijklmnop.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_key_000000");
  state.fake = createFakeSupabase();
});

afterEach(() => vi.unstubAllEnvs());

describe("connexion", () => {
  it("redirige vers la page demandée si elle est interne", async () => {
    expect(await redirectOf(signIn(idle, form({ email: "moi@example.com", password: "secret123", suite: "/nutrition" })))).toBe("/nutrition");
  });

  it("refuse une redirection vers un autre site", async () => {
    for (const suite of ["//evil.example", "https://evil.example", "/\\evil.example"]) {
      expect(await redirectOf(signIn(idle, form({ email: "moi@example.com", password: "secret123", suite })))).toBe("/");
    }
  });

  it("renvoie un message générique en cas d'échec, sans renvoyer le mot de passe", async () => {
    state.fake!.client.auth.signInWithPassword = async () => ({ data: {}, error: { message: "Invalid login" } as never });
    const result = await signIn(idle, form({ email: "moi@example.com", password: "mauvais123" }));
    expect(result.message).toBe("Identifiants incorrects.");
    expect(result.values).toEqual({ email: "moi@example.com" });
  });
});

describe("profil et données", () => {
  it("enregistre le dossier athlète dans le profil", async () => {
    await redirectOf(
      updateProfile(idle, form({ timezone: "Europe/Paris", startWeightKg: "92", targetWeightKg: "80", coachContext: "MMA, grappling, boxe." })),
    );
    const update = state.fake!.queries.find((q) => q.op === "update")!;
    expect(update.payload).toMatchObject({ start_weight_kg: 92, target_weight_kg: 80, coach_context: "MMA, grappling, boxe." });
    expect(update.filters).toEqual([["eq", "id", USER_ID]]);
  });

  it("n'efface rien sans la confirmation exacte", async () => {
    const result = await deleteAllData(idle, form({ confirm: "oui" }));
    expect(result.status).toBe("error");
    expect(state.fake!.rpcCalls).toHaveLength(0);
  });

  it("efface les données après confirmation", async () => {
    expect(await redirectOf(deleteAllData(idle, form({ confirm: "SUPPRIMER" })))).toBe("/profil?efface=1");
    expect(state.fake!.rpcCalls.map((c) => c.fn)).toEqual(["delete_my_data"]);
  });
});
