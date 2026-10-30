import { describe, expect, it } from "vitest";
import {
  addDays,
  dayOf,
  dayRange,
  daysBetween,
  isValidTimezone,
  localDateTimeToIso,
  nowLocalInput,
  startOfWeek,
  timeOf,
  todayIn,
  weekdayInitial,
} from "./dates";

const PARIS = "Europe/Paris";

describe("fuseau Europe/Paris", () => {
  it("donne le jour local, pas le jour UTC", () => {
    // 23h30 UTC le 29/10 = 00h30 le 30/10 à Paris (heure d'hiver, UTC+1).
    expect(todayIn(PARIS, new Date("2026-10-29T23:30:00Z"))).toBe("2026-10-30");
    expect(todayIn("UTC", new Date("2026-10-29T23:30:00Z"))).toBe("2026-10-29");
  });

  it("convertit une heure murale en instant, été comme hiver", () => {
    expect(localDateTimeToIso("2026-07-01T08:00", PARIS)).toBe("2026-07-01T06:00:00.000Z");
    expect(localDateTimeToIso("2026-12-01T08:00", PARIS)).toBe("2026-12-01T07:00:00.000Z");
  });

  it("gère le passage à l'heure d'hiver (25 octobre 2026)", () => {
    const { start, end } = dayRange("2026-10-25", PARIS);
    expect(start).toBe("2026-10-24T22:00:00.000Z");
    expect(end).toBe("2026-10-25T23:00:00.000Z");
  });

  it("fait l'aller-retour instant ↔ jour et heure locaux", () => {
    const iso = localDateTimeToIso("2026-10-30T07:45", PARIS);
    expect(dayOf(iso, PARIS)).toBe("2026-10-30");
    expect(timeOf(iso, PARIS)).toBe("07:45");
    expect(nowLocalInput(PARIS, new Date(iso))).toBe("2026-10-30T07:45");
  });

  it("refuse une date locale mal formée", () => {
    expect(() => localDateTimeToIso("30/10/2026", PARIS)).toThrow(RangeError);
  });

  it("valide les fuseaux", () => {
    expect(isValidTimezone(PARIS)).toBe(true);
    expect(isValidTimezone("Mars/Olympus")).toBe(false);
  });
});

describe("calendrier", () => {
  it("additionne les jours à travers les mois", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-06", "2026-10-29")).toBe(23);
  });

  it("trouve le lundi et l'initiale du jour", () => {
    expect(startOfWeek("2026-10-30")).toBe("2026-10-26");
    expect(startOfWeek("2026-11-01")).toBe("2026-10-26");
    expect(weekdayInitial("2026-10-30")).toBe("V");
  });
});
