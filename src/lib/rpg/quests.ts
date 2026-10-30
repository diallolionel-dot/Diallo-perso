import { addDays, weekdayInitial } from "@/lib/dates";
import { XP_RULES } from "./xp";

export type QuestStatus = "done" | "todo";

export interface Quest {
  id: "weigh" | "meals" | "train" | "sleep" | "checkin";
  label: string;
  hint: string;
  xp: number;
  status: QuestStatus;
  href: string;
}

export interface DayActivity {
  weighedIn: boolean;
  mealsLogged: number;
  trained: boolean;
  plannedRest: boolean;
  sleepLogged: boolean;
  checkinDone: boolean;
}

export const MEALS_QUEST_TARGET = 3;

/** Rituels de suivi du jour. Aucune quête ne porte sur les calories ou la restriction. */
export function buildDailyQuests(a: DayActivity): Quest[] {
  return [
    {
      id: "weigh",
      label: "Pesée du matin",
      hint: "À jeun, même balance",
      xp: XP_RULES.weigh_in.xp,
      status: a.weighedIn ? "done" : "todo",
      href: "/evolution/pesee",
    },
    {
      id: "meals",
      label: `Consigner ${MEALS_QUEST_TARGET} repas`,
      hint: a.mealsLogged > 0 && a.mealsLogged < MEALS_QUEST_TARGET ? `${a.mealsLogged}/${MEALS_QUEST_TARGET} pour l'instant` : "Une photo suffit",
      xp: XP_RULES.meal_logged.xp * MEALS_QUEST_TARGET,
      status: a.mealsLogged >= MEALS_QUEST_TARGET ? "done" : "todo",
      href: "/nutrition/repas",
    },
    {
      id: "train",
      label: "Séance Arène ou repos planifié",
      hint: a.plannedRest ? "Repos planifié : récupération validée" : "Les deux comptent",
      xp: a.plannedRest ? XP_RULES.planned_rest.xp : XP_RULES.workout_logged.xp,
      status: a.trained || a.plannedRest ? "done" : "todo",
      href: "/arene/seance",
    },
    {
      id: "sleep",
      label: "Renseigner le sommeil",
      hint: "Durée de la nuit dernière",
      xp: XP_RULES.sleep_logged.xp,
      status: a.sleepLogged ? "done" : "todo",
      href: "/checkin",
    },
    {
      id: "checkin",
      label: "Check-in du jour",
      hint: "Énergie, stress, faim, douleurs",
      xp: XP_RULES.daily_checkin.xp,
      status: a.checkinDone ? "done" : "todo",
      href: "/checkin",
    },
  ];
}

export interface ConsistencyDay {
  date: string;
  day: string;
  tracked: boolean;
  rest: boolean;
}

/** Fenêtre glissante des 7 derniers jours (du plus ancien à aujourd'hui). */
export function buildConsistencyWindow(today: string, trackedDays: ReadonlySet<string>, restDays: ReadonlySet<string>): ConsistencyDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const rest = restDays.has(date);
    return { date, day: weekdayInitial(date), tracked: trackedDays.has(date) || rest, rest };
  });
}
