import { describe, expect, it } from "vitest"
import { finalScore, qualityPercent, ratingFor, slaPercent } from "./kpi"

const milestones = (results: string[]) =>
  [30, 60, 10].map((weight, i) => ({
    weight_percentage: weight,
    actual_result: results[i],
  }))

describe("slaPercent", () => {
  it("is 100% when every milestone is on time", () => {
    expect(slaPercent(milestones(["On Time", "On Time", "On Time"]))).toBe(100)
  })

  it("rewards faster and penalises delays by weight", () => {
    // 30x120 + 60x80 + 10x100 = 9400 of 10000
    expect(slaPercent(milestones(["Faster", "Delay", "On Time"]))).toBe(94)
  })

  it("falls back to the stored score when the result label is unknown", () => {
    expect(slaPercent([{ weight_percentage: 50, score_achieved: 6000 }])).toBe(
      120,
    )
  })

  it("is null when nothing is scored", () => {
    expect(slaPercent([])).toBeNull()
  })
})

describe("qualityPercent", () => {
  it("is achieved over checked", () => {
    expect(
      qualityPercent([
        { is_achieved: true },
        { is_achieved: false },
        { is_achieved: true },
        { is_achieved: true },
      ]),
    ).toBe(75)
  })

  it("is null without data", () => {
    expect(qualityPercent([])).toBeNull()
  })
})

describe("finalScore", () => {
  it("weights SLA 40 / 360 15 / quality 45 and caps parts at 100", () => {
    const { score, missing } = finalScore({ sla: 110, review: 80, quality: 90 })
    // 100x40 + 80x15 + 90x45 = 9250 / 100
    expect(score).toBeCloseTo(92.5)
    expect(missing).toEqual([])
  })

  it("re-weights the parts that have data and lists the missing ones", () => {
    const { score, missing } = finalScore({
      sla: 80,
      review: null,
      quality: 100,
    })
    // (80x40 + 100x45) / 85
    expect(score).toBeCloseTo(90.588, 2)
    expect(missing).toEqual(["review"])
  })

  it("is null with no data at all", () => {
    expect(
      finalScore({ sla: null, review: null, quality: null }).score,
    ).toBeNull()
  })
})

describe("ratingFor", () => {
  it("maps scores to the Indonesian rating scale", () => {
    expect(ratingFor(96)?.label).toBe("ratingExceptional")
    expect(ratingFor(85)?.label).toBe("ratingAbove")
    expect(ratingFor(75)?.label).toBe("ratingMeets")
    expect(ratingFor(60)?.label).toBe("ratingBelow")
    expect(ratingFor(10)?.label).toBe("ratingNeedsWork")
    expect(ratingFor(null)).toBeNull()
  })
})
