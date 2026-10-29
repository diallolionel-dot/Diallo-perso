import { describe, expect, it } from "vitest";
import {
  XP_ACTIONS,
  XP_RULES,
  consistencyScore,
  levelFromXp,
  titleForLevel,
  weightGoalProgress,
  xpToNextLevel,
} from "./xp";

describe("règles XP", () => {
  it("ne récompense jamais les calories brûlées ni la restriction", () => {
    const forbidden = /calor|kcal|deficit|déficit|restrict|jeûne|fast/i;
    for (const action of XP_ACTIONS) {
      expect(action).not.toMatch(forbidden);
      expect(XP_RULES[action].label).not.toMatch(forbidden);
    }
  });

  it("valorise le repos planifié", () => {
    expect(XP_RULES.planned_rest.xp).toBeGreaterThan(0);
  });

  it("n'attribue que des gains positifs avec un plafond journalier", () => {
    for (const action of XP_ACTIONS) {
      expect(XP_RULES[action].xp).toBeGreaterThan(0);
      expect(XP_RULES[action].dailyCap).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("niveaux", () => {
  it("calcule le palier suivant", () => {
    expect(xpToNextLevel(1)).toBe(100);
    expect(xpToNextLevel(3)).toBe(200);
    expect(() => xpToNextLevel(0)).toThrow(RangeError);
  });

  it("déduit le niveau de l'XP totale", () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, current: 0, required: 100 });
    expect(levelFromXp(100)).toMatchObject({ level: 2, current: 0, required: 150 });
    expect(levelFromXp(260)).toMatchObject({ level: 3, current: 10, required: 200 });
    expect(levelFromXp(-50).level).toBe(1);
  });

  it("associe un titre au niveau", () => {
    expect(titleForLevel(1)).toBe("Recrue");
    expect(titleForLevel(4)).toBe("Combattant");
    expect(titleForLevel(30)).toBe("Légende");
  });
});

describe("progression", () => {
  it("mesure la régularité sur 7 jours glissants", () => {
    expect(consistencyScore([true, false, true, true, true, false, true, true])).toBe(5);
  });

  it("borne la progression de poids", () => {
    expect(weightGoalProgress(92, 92, 80)).toBe(0);
    expect(weightGoalProgress(92, 86, 80)).toBe(0.5);
    expect(weightGoalProgress(92, 93, 80)).toBe(0);
    expect(weightGoalProgress(92, 79, 80)).toBe(1);
  });
});
