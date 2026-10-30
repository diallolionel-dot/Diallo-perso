import { describe, expect, it } from "vitest";
import { parseForm } from "./form";
import {
  bodyMeasurementSchema,
  dailyCheckinSchema,
  deleteDataSchema,
  mealSchema,
  profileSchema,
  weightEntrySchema,
  workoutSchema,
} from "./schemas";

function fd(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(values)) data.append(k, v);
  return data;
}

describe("pesée", () => {
  it("accepte la virgule décimale et ignore les champs vides", () => {
    const r = parseForm(weightEntrySchema, fd({ measuredAt: "2026-10-30T07:30", weightKg: "90,4", bodyFatPct: "", note: " " }));
    expect(r).toEqual({ ok: true, data: { measuredAt: "2026-10-30T07:30", weightKg: 90.4, bodyFatPct: undefined, note: undefined } });
  });

  it("refuse un poids aberrant avec un message par champ", () => {
    const r = parseForm(weightEntrySchema, fd({ measuredAt: "2026-10-30T07:30", weightKg: "900" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.state.fieldErrors?.weightKg).toBe("Maximum 300");
      expect(r.state.values?.weightKg).toBe("900");
    }
  });

  it("refuse une saisie non numérique", () => {
    const r = parseForm(weightEntrySchema, fd({ measuredAt: "2026-10-30T07:30", weightKg: "abc" }));
    expect(r.ok).toBe(false);
  });
});

describe("repas", () => {
  it("exige un titre et un moment valides", () => {
    const r = parseForm(mealSchema, fd({ eatenAt: "2026-10-30T12:30", slot: "brunch", title: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.state.fieldErrors?.slot).toBeDefined();
      expect(r.state.fieldErrors?.title).toBe("Champ requis");
    }
  });

  it("accepte un repas sans macros", () => {
    const r = parseForm(mealSchema, fd({ eatenAt: "2026-10-30T12:30", slot: "dejeuner", title: "Poulet riz" }));
    expect(r.ok).toBe(true);
  });
});

describe("séance", () => {
  it("lit les exercices sérialisés en JSON", () => {
    const exercises = JSON.stringify([{ name: "Développé couché", sets: [{ reps: 8, loadKg: 70 }] }]);
    const r = parseForm(workoutSchema, fd({ startedAt: "2026-10-30T18:00", kind: "force", title: "Haut", durationMin: "65", exercises }));
    expect(r.ok && r.data.exercises[0].sets[0]).toEqual({ reps: 8, loadKg: 70 });
  });

  it("refuse un JSON d'exercices corrompu", () => {
    const r = parseForm(workoutSchema, fd({ startedAt: "2026-10-30T18:00", kind: "force", title: "Haut", durationMin: "65", exercises: "{oops" }));
    expect(r.ok).toBe(false);
  });

  it("refuse une série sans répétitions ni durée", () => {
    const exercises = JSON.stringify([{ name: "Squat", sets: [{ loadKg: 80 }] }]);
    const r = parseForm(workoutSchema, fd({ startedAt: "2026-10-30T18:00", kind: "force", title: "Bas", durationMin: "50", exercises }));
    expect(r.ok).toBe(false);
  });
});

describe("mensurations et check-in", () => {
  it("exige au moins une mensuration", () => {
    expect(parseForm(bodyMeasurementSchema, fd({ measuredOn: "2026-10-30" })).ok).toBe(false);
    expect(parseForm(bodyMeasurementSchema, fd({ measuredOn: "2026-10-30", waistCm: "98,5" })).ok).toBe(true);
  });

  it("borne les échelles du check-in", () => {
    expect(parseForm(dailyCheckinSchema, fd({ day: "2026-10-30", energy: "6" })).ok).toBe(false);
    expect(parseForm(dailyCheckinSchema, fd({ day: "2026-10-30", painLevel: "3", painZone: "genou", workLoad: "4" })).ok).toBe(true);
  });
});

describe("profil et suppression", () => {
  it("refuse un fuseau inconnu et un objectif identique au départ", () => {
    const r = parseForm(profileSchema, fd({ timezone: "Mars/Olympus", startWeightKg: "92", targetWeightKg: "92" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.state.fieldErrors?.timezone).toBeDefined();
    }
  });

  it("exige la confirmation exacte", () => {
    expect(parseForm(deleteDataSchema, fd({ confirm: "supprimer" })).ok).toBe(false);
    expect(parseForm(deleteDataSchema, fd({ confirm: "SUPPRIMER" })).ok).toBe(true);
  });
});
