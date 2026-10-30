/**
 * Dates « locales » (jour calendaire, heure murale) dans le fuseau de l'utilisateur.
 * Les jours sont manipulés en chaînes ISO `YYYY-MM-DD` pour éviter les pièges
 * de fuseau ; les instants sont stockés en `timestamptz` (ISO avec offset).
 */

export const DEFAULT_TIMEZONE = "Europe/Paris";

const LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

/** Décalage (ms) du fuseau par rapport à UTC à un instant donné. */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(date.getTime() / 1000) * 1000;
}

export function isValidTimezone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Jour calendaire courant dans le fuseau donné. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const p = partsInZone(now, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Date et heure murales courantes (`YYYY-MM-DDTHH:mm`), pour pré-remplir un champ datetime-local. */
export function nowLocalInput(timeZone: string, now: Date = new Date()): string {
  const p = partsInZone(now, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Convertit une heure murale (`YYYY-MM-DDTHH:mm`) du fuseau donné en instant ISO UTC. */
export function localDateTimeToIso(local: string, timeZone: string): string {
  const m = LOCAL_DATETIME.exec(local);
  if (!m) throw new RangeError(`Date locale invalide : ${local}`);
  const [, y, mo, d, h, mi] = m.map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Deux passes pour gérer les changements d'heure.
  let instant = asUtc - zoneOffsetMs(new Date(asUtc), timeZone);
  instant = asUtc - zoneOffsetMs(new Date(instant), timeZone);
  return new Date(instant).toISOString();
}

/** Jour calendaire (dans le fuseau) d'un instant ISO. */
export function dayOf(isoInstant: string, timeZone: string): string {
  return todayIn(timeZone, new Date(isoInstant));
}

/** Heure murale `HH:mm` d'un instant ISO dans le fuseau. */
export function timeOf(isoInstant: string, timeZone: string): string {
  const p = partsInZone(new Date(isoInstant), timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Nombre de jours de `from` à `to` (positif si `to` est après). */
export function daysBetween(from: string, to: string): number {
  const toUtc = (day: string) => {
    const [y, m, d] = day.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

/** Bornes [début, fin[ d'un jour calendaire du fuseau, en instants ISO. */
export function dayRange(day: string, timeZone: string): { start: string; end: string } {
  return {
    start: localDateTimeToIso(`${day}T00:00`, timeZone),
    end: localDateTimeToIso(`${addDays(day, 1)}T00:00`, timeZone),
  };
}

const WEEKDAY_INITIALS = ["D", "L", "M", "M", "J", "V", "S"];
const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function weekdayIndex(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function weekdayInitial(day: string): string {
  return WEEKDAY_INITIALS[weekdayIndex(day)];
}

export function weekdayShort(day: string): string {
  return WEEKDAY_SHORT[weekdayIndex(day)];
}

/** Lundi de la semaine contenant `day`. */
export function startOfWeek(day: string): string {
  const idx = weekdayIndex(day);
  return addDays(day, idx === 0 ? -6 : 1 - idx);
}

/** `29/10` */
export function formatShortDay(day: string): string {
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
}
