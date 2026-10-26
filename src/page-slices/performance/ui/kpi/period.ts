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

/** "2026-Q2" → "Q2", or "Q2 2025" when it isn't `refYear`'s. */
export function quarterShort(quarter: string, refYear?: string) {
  const [year, part] = quarter.split("-")
  return refYear && year === refYear ? part : `${part} ${year}`
}

/** Quarters from `from` to `to` inclusive ("2026-Q2" … "2026-Q4"). */
export function quarterSpan(from: string, to: string, max = 8) {
  let [y, q] = from.split("-Q").map(Number)
  const out: string[] = []
  for (let i = 0; i < 40; i++) {
    const key = `${y}-Q${q}`
    out.push(key)
    if (key >= to) break
    q += 1
    if (q === 5) {
      q = 1
      y += 1
    }
  }
  return out.length > max ? out.slice(-max) : out
}
