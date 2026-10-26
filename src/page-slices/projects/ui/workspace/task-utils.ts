import {
  differenceInCalendarDays,
  format,
  isToday,
  isTomorrow,
  type Locale,
} from "date-fns"

/** "Hari ini", "Besok", a weekday this week, else "12 Mar". */
export function dueLabel(
  date: string,
  locale: Locale,
  words: { today: string; tomorrow: string },
) {
  const d = new Date(`${date}T00:00:00`)
  if (isToday(d)) return words.today
  if (isTomorrow(d)) return words.tomorrow
  const diff = differenceInCalendarDays(d, new Date())
  if (diff > 1 && diff < 7) return format(d, "EEE", { locale })
  return format(d, "d MMM", { locale })
}

export function initials(name: string | null | undefined) {
  return (name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
