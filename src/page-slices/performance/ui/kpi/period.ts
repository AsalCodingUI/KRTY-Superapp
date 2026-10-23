/** Period helpers shared by the Performance tabs ("2026-Q4", "2026-All"). */
export function currentQuarter(date = new Date()) {
  return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
}

export function isQuarter(value: string) {
  return /^\d{4}-Q[1-4]$/.test(value)
}

export function normalizePeriod(value: string | null | undefined) {
  if (value && (isQuarter(value) || /^\d{4}-All$/.test(value))) return value
  return currentQuarter()
}

/** `t` is the "performance" translator (for "Tahun {year}"). */
export function periodLabel(
  value: string,
  t: (key: "periodYear", vars: { year: string }) => string,
) {
  const [year, part] = value.split("-")
  return part === "All" ? t("periodYear", { year }) : `${part} ${year}`
}

export function periodYears(center = new Date().getFullYear()) {
  return [center - 1, center, center + 1]
}
