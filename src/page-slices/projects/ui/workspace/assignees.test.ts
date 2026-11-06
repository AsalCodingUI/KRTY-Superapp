import { describe, expect, it } from "vitest"
import {
  assigneesOf,
  cleanAssigneeIds,
  isAssignedTo,
  sameAssignees,
  toggleAssignee,
} from "./assignees"

describe("cleanAssigneeIds", () => {
  it("drops blanks and repeats, keeps the first order", () => {
    expect(cleanAssigneeIds(["b", null, "a", "b", undefined, "", "c"])).toEqual(
      ["b", "a", "c"],
    )
  })
  it("empty stays empty", () => {
    expect(cleanAssigneeIds([])).toEqual([])
  })
})

describe("isAssignedTo", () => {
  const task = { assignee_ids: ["a", "b"] }
  it("is mine when my id is in the list", () => {
    expect(isAssignedTo(task, "b")).toBe(true)
  })
  it("isn't when it's not, or there's no viewer", () => {
    expect(isAssignedTo(task, "c")).toBe(false)
    expect(isAssignedTo(task, null)).toBe(false)
    expect(isAssignedTo({ assignee_ids: [] }, "a")).toBe(false)
  })
})

describe("toggleAssignee", () => {
  it("adds at the end", () => {
    expect(toggleAssignee(["a"], "b")).toEqual(["a", "b"])
  })
  it("removes when there", () => {
    expect(toggleAssignee(["a", "b", "c"], "b")).toEqual(["a", "c"])
  })
  it("doesn't change the input", () => {
    const ids = ["a"]
    toggleAssignee(ids, "b")
    expect(ids).toEqual(["a"])
  })
})

describe("assigneesOf", () => {
  const team = [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ]
  it("follows the task's order and skips people not on the team", () => {
    expect(
      assigneesOf({ assignee_ids: ["b", "gone", "a"] }, team).map((m) => m.id),
    ).toEqual(["b", "a"])
  })
})

describe("sameAssignees", () => {
  it("ignores order", () => {
    expect(sameAssignees(["a", "b"], ["b", "a"])).toBe(true)
    expect(sameAssignees(["a"], ["a", "b"])).toBe(false)
  })
})
