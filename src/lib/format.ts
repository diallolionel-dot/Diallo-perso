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
