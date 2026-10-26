import { describe, expect, it } from "vitest"
import { accessLevel, canOpenPage, canOpenProjectSection } from "./access"

describe("access", () => {
  it("derives the level from role and job title", () => {
    expect(accessLevel({ role: "stakeholder", job_title: "Admin" })).toBe(
      "stakeholder",
    )
    expect(
      accessLevel({ role: "employee", job_title: "Project Manager" }),
    ).toBe("pm")
    expect(accessLevel({ role: "employee", job_title: "Designer" })).toBe(
      "employee",
    )
    expect(accessLevel(null)).toBe("employee")
  })

  it("gates pages by the longest matching prefix", () => {
    expect(canOpenPage("/projects/abc/tasks", "employee")).toBe(true)
    expect(canOpenPage("/finance/subscriptions", "pm")).toBe(false)
    expect(canOpenPage("/finance", "stakeholder")).toBe(true)
    expect(canOpenPage("/teamsx", "employee")).toBe(true) // not a known page
  })

  it("keeps settings to stakeholders and invoices to PMs and up", () => {
    expect(canOpenProjectSection("tasks", "employee")).toBe(true)
    expect(canOpenProjectSection("invoices", "pm")).toBe(true)
    expect(canOpenProjectSection("invoices", "employee")).toBe(false)
    expect(canOpenProjectSection("settings", "pm")).toBe(false)
    expect(canOpenProjectSection("settings", "stakeholder")).toBe(true)
  })
})
