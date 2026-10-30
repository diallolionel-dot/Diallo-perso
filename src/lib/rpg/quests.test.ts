import { describe, expect, it } from "vitest";
import { buildConsistencyWindow, buildDailyQuests } from "./quests";

const none = { weighedIn: false, mealsLogged: 0, trained: false, plannedRest: false, sleepLogged: false, checkinDone: false };

describe("quêtes du jour", () => {
  it("part de zéro sans culpabiliser", () => {
    const quests = buildDailyQuests(none);
    expect(quests.every((q) => q.status === "todo")).toBe(true);
    expect(quests.map((q) => q.label).join(" ")).not.toMatch(/calor|kcal|déficit/i);
  });

  it("valide la quête d'entraînement avec un repos planifié", () => {
    const train = buildDailyQuests({ ...none, plannedRest: true }).find((q) => q.id === "train")!;
    expect(train.status).toBe("done");
    expect(train.xp).toBe(15);
  });

  it("suit la progression des repas", () => {
    const meals = (n: number) => buildDailyQuests({ ...none, mealsLogged: n }).find((q) => q.id === "meals")!;
    expect(meals(2)).toMatchObject({ status: "todo", hint: "2/3 pour l'instant" });
    expect(meals(3).status).toBe("done");
  });
});

describe("fenêtre de régularité", () => {
  it("couvre les 7 derniers jours et compte le repos comme suivi", () => {
    const window = buildConsistencyWindow("2026-10-30", new Set(["2026-10-30", "2026-10-28"]), new Set(["2026-10-25"]));
    expect(window).toHaveLength(7);
    expect(window[0]).toEqual({ date: "2026-10-24", day: "S", tracked: false, rest: false });
    expect(window[1]).toEqual({ date: "2026-10-25", day: "D", tracked: true, rest: true });
    expect(window[6]).toMatchObject({ date: "2026-10-30", day: "V", tracked: true });
  });
});
