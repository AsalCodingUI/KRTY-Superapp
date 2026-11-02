import { describe, expect, it } from "vitest"
import {
  ID_HOLIDAYS,
  getIdHoliday,
  idHolidayKey,
  idHolidaysBetween,
  isIdHolidayDate,
} from "./id-holidays"

const count = (year: string, kind: "nasional" | "cuti_bersama") =>
  ID_HOLIDAYS.filter((h) => h.date.startsWith(year) && h.kind === kind).length

describe("ID_HOLIDAYS", () => {
  it("is sorted by date with one entry per day", () => {
    const dates = ID_HOLIDAYS.map((h) => h.date)
    expect(dates).toEqual([...dates].sort())
    expect(new Set(dates).size).toBe(dates.length)
  })

  it("has real calendar dates", () => {
    for (const { date } of ID_HOLIDAYS) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      const d = new Date(`${date}T00:00:00Z`)
      expect(Number.isNaN(d.getTime())).toBe(false)
      expect(d.toISOString().slice(0, 10)).toBe(date)
    }
  })

  it("fills every field", () => {
    for (const h of ID_HOLIDAYS) {
      expect(h.name.trim()).not.toBe("")
      expect(h.description.trim()).not.toBe("")
      expect(["nasional", "cuti_bersama"]).toContain(h.kind)
    }
  })

  it("matches the SKB totals", () => {
    expect(count("2026", "nasional")).toBe(17)
    expect(count("2026", "cuti_bersama")).toBe(8)
    expect(count("2027", "nasional")).toBe(18)
    expect(count("2027", "cuti_bersama")).toBe(8)
  })

  it("looks holidays up by key, day and range", () => {
    const natal = getIdHoliday(idHolidayKey({ date: "2026-12-25" }))
    expect(natal?.kind).toBe("nasional")
    expect(getIdHoliday("id:2026-12-26")).toBeUndefined()
    expect(isIdHolidayDate("2026-08-17")).toBe(true)
    expect(idHolidaysBetween("2026-12-01", "2026-12-31")).toHaveLength(2)
  })
})
