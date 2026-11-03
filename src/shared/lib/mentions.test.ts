import { describe, expect, it } from "vitest"
import {
  MENTION_MD,
  clientSafeMentions,
  mentionMarkdown,
  parseMentionHref,
} from "./mentions"

const P = "d802b25b-1407-49f5-b1a8-0618eec6fec1"
const T = "11111111-2222-3333-4444-555555555555"

describe("mentions", () => {
  it("writes and reads people and tasks", () => {
    const person = mentionMarkdown(
      { kind: "person", id: P, projectId: null },
      "Farah [x]",
    )
    expect(person).toBe(`[@Farah \\[x\\]](mention://person/${P})`)
    const m = MENTION_MD.exec(person)!
    expect(m[1]).toBe("@")
    expect(parseMentionHref(m[3])).toEqual({
      kind: "person",
      id: P,
      projectId: null,
    })

    const task = mentionMarkdown(
      { kind: "task", id: T, projectId: P },
      "Desain",
    )
    expect(task).toBe(`[#Desain](mention://task/${P}/${T})`)
    expect(parseMentionHref(MENTION_MD.exec(task)![3])).toEqual({
      kind: "task",
      id: T,
      projectId: P,
    })
  })

  it("cuts ids for clients, keeping the label", () => {
    const md = `Hi [@Farah](mention://person/${P}) see [#Desain](mention://task/${P}/${T}).`
    const safe = clientSafeMentions(md)
    expect(safe).toBe(
      "Hi [@Farah](mention://person) see [#Desain](mention://task).",
    )
    expect(safe).not.toContain(P)
    expect(parseMentionHref("mention://task")).toEqual({
      kind: "task",
      id: null,
      projectId: null,
    })
  })

  it("ignores other links", () => {
    expect(parseMentionHref("https://example.com")).toBeNull()
    expect(parseMentionHref("mention://person/nope")).toBeNull()
  })
})
