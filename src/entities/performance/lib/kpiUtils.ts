export function getQuarterFromDate(date: Date | string): string {
  const d = new Date(date)
  const month = d.getMonth() + 1

  if (month <= 3) return "Q1"
  if (month <= 6) return "Q2"
  if (month <= 9) return "Q3"
  return "Q4"
}
