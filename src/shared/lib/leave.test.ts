import { describe, expect, it } from "vitest"
import { annualLeaveEntitlement, annualLeaveSummary } from "./leave"

const today = new Date(2026, 9, 21) // 21 Oct 2026

describe("annualLeaveEntitlement", () => {
  it("gives interns no annual leave", () => {
    const e = annualLeaveEntitlement(
      { employment_type: "magang", join_date: "2020-01-01" },
      today,
    )
    expect(e).toMatchObject({ eligible: false, quota: 0 })
  })

  it("keeps the full quota when no join date is recorded", () => {
    expect(annualLeaveEntitlement({}, today)).toMatchObject({
      eligible: true,
      quota: 12,
    })
  })

  it("is not eligible before 6 full months", () => {
    const e = annualLeaveEntitlement({ join_date: "2026-04-22" }, today)
    expect(e.eligible).toBe(false)
    expect(e.eligibleFrom?.toDateString()).toBe(
      new Date(2026, 9, 22).toDateString(),
    )
  })

  it("gives 1 day per full month between 6 and 11 months", () => {
    expect(annualLeaveEntitlement({ join_date: "2026-04-21" }, today)).toMatchObject(
      { eligible: true, quota: 6 },
    )
    expect(annualLeaveEntitlement({ join_date: "2026-02-10" }, today)).toMatchObject(
      { eligible: true, quota: 8 },
    )
  })

  it("gives the full 12 days from 12 months", () => {
    expect(annualLeaveEntitlement({ join_date: "2025-10-21" }, today)).toMatchObject(
      { eligible: true, quota: 12 },
    )
  })
})

describe("annualLeaveSummary", () => {
  it("subtracts approved business days from the entitlement", () => {
    // Mon 5 – Wed 7 Oct 2026 = 3 business days
    const s = annualLeaveSummary(
      [{ start_date: "2026-10-05", end_date: "2026-10-07" }],
      2026,
      {},
    )
    expect(s).toMatchObject({ quota: 12, used: 3, remaining: 9 })
  })
})
