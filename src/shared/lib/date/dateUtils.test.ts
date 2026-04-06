import { describe, expect, it } from "vitest"
import {
  calculateBusinessDays,
  getAttendanceLogLocalDate,
  getAttendanceSessionState,
} from "./utils"

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

  describe("attendance session helpers", () => {
    it("derives the session date from clock_in before falling back to date", () => {
      expect(
        getAttendanceLogLocalDate({
          date: "2026-04-01",
          clock_in: "2026-03-31T09:00:00Z",
        }),
      ).toBe("2026-03-31")
    })

    it("flags open sessions from a previous day as stale even if the date field is wrong", () => {
      const logs = [
        {
          id: "stale-log",
          date: "2026-04-01",
          clock_in: "2026-03-31T09:00:00Z",
          clock_out: null,
        },
      ]

      const state = getAttendanceSessionState(
        logs,
        new Date("2026-04-01T12:00:00Z"),
      )

      expect(state.activeSession).toBeNull()
      expect(state.staleSession?.id).toBe("stale-log")
      expect(state.hasOpenSession).toBe(true)
    })
  })
})
