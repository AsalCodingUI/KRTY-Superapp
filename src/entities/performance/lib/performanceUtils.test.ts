import { describe, expect, it } from "vitest"
import {
  calculateSkillPercentage,
  getQuarterMonths,
  getRatingBadgeVariant,
  getRatingLevel,
  getSkillRating,
} from "./performanceUtils"

describe("performanceUtils", () => {
  describe("getRatingLevel", () => {
    it("returns Outstanding for >= 95%", () => {
      expect(getRatingLevel(95)).toBe("Outstanding")
      expect(getRatingLevel(100)).toBe("Outstanding")
    })

    it("returns Above Expectation for >= 85%", () => {
      expect(getRatingLevel(85)).toBe("Above Expectation")
      expect(getRatingLevel(94)).toBe("Above Expectation")
    })

    it("returns Meet Expectation for >= 75%", () => {
      expect(getRatingLevel(75)).toBe("Meet Expectation")
      expect(getRatingLevel(84)).toBe("Meet Expectation")
    })

    it("returns Below for >= 60%", () => {
      expect(getRatingLevel(60)).toBe("Below")
      expect(getRatingLevel(74)).toBe("Below")
    })

    it("returns Needs Improvement for < 60%", () => {
      expect(getRatingLevel(59)).toBe("Needs Improvement")
      expect(getRatingLevel(0)).toBe("Needs Improvement")
    })
  })

  describe("getRatingBadgeVariant", () => {
    it("returns success for Outstanding", () => {
      expect(getRatingBadgeVariant("Outstanding")).toBe("success")
    })

    it("returns default for Above Expectation", () => {
      expect(getRatingBadgeVariant("Above Expectation")).toBe("default")
    })

    it("returns default for Meet Expectation", () => {
      expect(getRatingBadgeVariant("Meet Expectation")).toBe("default")
    })

    it("returns warning for Below", () => {
      expect(getRatingBadgeVariant("Below")).toBe("warning")
    })

    it("returns error for Needs Improvement", () => {
      expect(getRatingBadgeVariant("Needs Improvement")).toBe("error")
    })

    it("is case insensitive", () => {
      expect(getRatingBadgeVariant("OUTSTANDING")).toBe("success")
      expect(getRatingBadgeVariant("outstanding")).toBe("success")
    })
  })

  describe("calculateSkillPercentage", () => {
    it("calculates percentage from score out of 5", () => {
      expect(calculateSkillPercentage(5)).toBe(100)
      expect(calculateSkillPercentage(4)).toBe(80)
      expect(calculateSkillPercentage(3)).toBe(60)
    })

    it("returns 0 when totalUser is 0", () => {
      expect(calculateSkillPercentage(5, 0)).toBe(0)
    })

    it("rounds to nearest integer", () => {
      expect(calculateSkillPercentage(4.5)).toBe(90)
      expect(calculateSkillPercentage(3.75)).toBe(75)
    })
  })

  describe("getSkillRating", () => {
    it("wraps getRatingLevel correctly", () => {
      expect(getSkillRating(95)).toBe("Outstanding")
      expect(getSkillRating(80)).toBe("Meet Expectation")
    })
  })

  describe("getQuarterMonths", () => {
    it("returns correct month range for Q1", () => {
      expect(getQuarterMonths("Q1")).toBe("Januari - Maret")
    })

    it("returns correct month range for Q2", () => {
      expect(getQuarterMonths("Q2")).toBe("April - Juni")
    })

    it("returns correct month range for Q3", () => {
      expect(getQuarterMonths("Q3")).toBe("Juli - September")
    })

    it("returns correct month range for Q4", () => {
      expect(getQuarterMonths("Q4")).toBe("Oktober - Desember")
    })

    it("handles year-quarter format", () => {
      expect(getQuarterMonths("2025-Q1")).toBe("Januari - Maret")
      expect(getQuarterMonths("2024-Q4")).toBe("Oktober - Desember")
    })

    it("returns N/A for invalid quarter", () => {
      expect(getQuarterMonths("Q5")).toBe("N/A")
      expect(getQuarterMonths("invalid")).toBe("N/A")
    })
  })
})
