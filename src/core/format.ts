// Espace insécable : présente dans toutes les polices, contrairement à l'espace fine.
const THOUSANDS_SEPARATOR = " ";

/** 81866 -> "81 866" (avec une espace insécable). */
export function formatInt(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
}

/** 61.4 -> "61,4" (virgule décimale). */
export function formatDecimal(value: number, digits = 1): string {
  const [integerPart, decimalPart] = value.toFixed(digits).split(".");
  const integer = formatInt(Number(integerPart));
  return decimalPart ? `${integer},${decimalPart}` : integer;
}
