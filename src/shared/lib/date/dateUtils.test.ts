import { describe, expect, it } from "vitest"
import { calculateBusinessDays } from "./utils"

describe("dateUtils", () => {
  describe("calculateBusinessDays", () => {
    it("returns 0 when start is after end", () => {
      const start = new Date("2024-01-15")
      const end = new Date("2024-01-10")
      expect(calculateBusinessDays(start, end)).toBe(0)
    })

    it("counts weekdays correctly for a full work week", () => {
      // Monday to Friday
      const start = new Date("2024-01-08") // Monday
      const end = new Date("2024-01-12") // Friday
      expect(calculateBusinessDays(start, end)).toBe(5)
    })

    it("excludes weekends", () => {
      // Monday to next Monday (includes one weekend)
      const start = new Date("2024-01-08") // Monday
      const end = new Date("2024-01-15") // Next Monday
      expect(calculateBusinessDays(start, end)).toBe(6)
    })

    it("returns 1 for same day", () => {
      const date = new Date("2024-01-10") // Wednesday
      expect(calculateBusinessDays(date, date)).toBe(1)
    })

    it("returns 0 for weekend-only range", () => {
      const saturday = new Date("2024-01-13")
      const sunday = new Date("2024-01-14")
      expect(calculateBusinessDays(saturday, sunday)).toBe(0)
    })
  })
})
