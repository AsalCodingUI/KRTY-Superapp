import type { Locale } from "@/shared/i18n/config"
import { endOfWeek, format, isSameMonth, startOfWeek } from "date-fns"
import { enUS, id as idLocale } from "date-fns/locale"

/**
 * Starting points for a new project report: a title (with the day or the
 * week in it) and a Markdown body of sections to fill in. Offered only
 * while the report is empty, so nothing written is ever replaced.
 */

export const REPORT_TEMPLATES = ["daily", "weekly"] as const
export type ReportTemplateId = (typeof REPORT_TEMPLATES)[number]

type Copy = {
  dailyTitle: (day: string) => string
  weeklyTitle: (range: string) => string
  daily: string
  weekly: string
}

/**
 * Marks a line to fill in. Markdown has no empty bullet or empty line, so
 * the template says `- {{}}` and the picker takes the marks out after it's
 * in, leaving an empty bullet / line with the caret on the first.
 */
export const FILL = "{{}}"

/** Sections, in Markdown: headings, lines to fill, a callout. */
const COPY: Record<Locale, Copy> = {
  id: {
    dailyTitle: (day) => `Laporan harian · ${day}`,
    weeklyTitle: (range) => `Laporan mingguan · ${range}`,
    daily: `## Yang dikerjain

- ${FILL}

## Next

- [ ] ${FILL}

## Catatan

${FILL}
`,
    weekly: `## Ringkasan minggu ini

${FILL}

## Progress per bagian

- **Desain:** ${FILL}
- **Development:** ${FILL}
- **Konten:** ${FILL}

## Minggu depan

- [ ] ${FILL}

## Butuh dari klien

> [!WARNING]
> ${FILL}
`,
  },
  en: {
    dailyTitle: (day) => `Daily report · ${day}`,
    weeklyTitle: (range) => `Weekly report · ${range}`,
    daily: `## Done today

- ${FILL}

## Next

- [ ] ${FILL}

## Notes

${FILL}
`,
    weekly: `## This week in short

${FILL}

## Progress by area

- **Design:** ${FILL}
- **Development:** ${FILL}
- **Content:** ${FILL}

## Next week

- [ ] ${FILL}

## Needed from the client

> [!WARNING]
> ${FILL}
`,
  },
}

/** "Senin, 2 Nov 2026" / "2–8 Nov 2026" / "28 Okt – 3 Nov 2026". */
function dates(locale: Locale, today: Date) {
  const loc = locale === "en" ? enUS : idLocale
  const day = format(today, "EEEE, d MMM yyyy", { locale: loc })
  const from = startOfWeek(today, { weekStartsOn: 1 })
  const to = endOfWeek(today, { weekStartsOn: 1 })
  const range = isSameMonth(from, to)
    ? `${format(from, "d", { locale: loc })}–${format(to, "d MMM yyyy", { locale: loc })}`
    : `${format(from, from.getFullYear() === to.getFullYear() ? "d MMM" : "d MMM yyyy", { locale: loc })} – ${format(to, "d MMM yyyy", { locale: loc })}`
  return { day, range }
}

/** A template's title and body, for today, in the app's language. */
export function reportTemplate(
  id: ReportTemplateId,
  locale: Locale,
  today = new Date(),
): { title: string; body: string } {
  const copy = COPY[locale] ?? COPY.id
  const { day, range } = dates(locale, today)
  return id === "daily"
    ? { title: copy.dailyTitle(day), body: copy.daily }
    : { title: copy.weeklyTitle(range), body: copy.weekly }
}
