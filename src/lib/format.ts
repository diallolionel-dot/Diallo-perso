const decimalFormatters = new Map<number, Intl.NumberFormat>();

/** Nombre au format français avec un nombre fixe de décimales (ex. 90,0). */
export function formatDecimal(value: number, digits = 1): string {
  let formatter = decimalFormatters.get(digits);
  if (!formatter) {
    formatter = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    decimalFormatters.set(digits, formatter);
  }
  return formatter.format(value);
}

/** Variation signée (ex. +0,1 / −0,5). */
export function formatDelta(value: number, digits = 1): string {
  const abs = formatDecimal(Math.abs(value), digits);
  if (value > 0) return `+${abs}`;
  if (value < 0) return `−${abs}`;
  return abs;
}

/** Durée lisible : « 45 min », « 1 h », « 14 h 30 ». */
export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m.toString().padStart(2, "0")}`;
}
