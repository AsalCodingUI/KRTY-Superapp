import { describe, expect, it, vi } from "vitest"
import { createUndoManager, UndoStale } from "./manager"
import { matches, sameValue } from "./row"
import { isEditableTarget, undoKey } from "./UndoShortcuts"

/** A counter with undoable +n steps. */
function counter(limit?: number) {
  const m = createUndoManager({ limit })
  const state = { value: 0 }
  const add = (n: number) => {
    state.value += n
    m.push({
      label: `+${n}`,
      undo: async () => {
        state.value -= n
      },
      redo: async () => {
        state.value += n
      },
    })
  }
  return { m, state, add }
}

describe("undo manager", () => {
  it("undoes and redoes in order", async () => {
    const { m, state, add } = counter()
    add(1)
    add(2)
    expect(state.value).toBe(3)
    expect((await m.undo()).status).toBe("done")
    expect(state.value).toBe(1)
    expect((await m.undo()).status).toBe("done")
    expect(state.value).toBe(0)
    expect((await m.undo()).status).toBe("empty")
    const redo = await m.redo()
    expect(redo.status === "done" && redo.entry.label).toBe("+1")
    expect(state.value).toBe(1)
  })

  it("clears redo on a new action", async () => {
    const { m, state, add } = counter()
    add(1)
    await m.undo()
    expect(m.sizes().redo).toBe(1)
    add(5)
    expect(m.sizes()).toEqual({ undo: 1, redo: 0 })
    expect((await m.redo()).status).toBe("empty")
    expect(state.value).toBe(5)
  })

  it("keeps only the last `limit` actions", async () => {
    const { m, state, add } = counter(3)
    for (let i = 1; i <= 5; i++) add(i)
    expect(m.sizes().undo).toBe(3)
    while ((await m.undo()).status === "done");
    // 1 and 2 fell off the bottom.
    expect(state.value).toBe(3)
  })

  it("drops a stale step, keeps a failed one", async () => {
    const m = createUndoManager()
    m.push({
      label: "stale",
      undo: () => {
        throw new UndoStale()
      },
      redo: () => {},
    })
    expect((await m.undo()).status).toBe("stale")
    expect(m.sizes()).toEqual({ undo: 0, redo: 0 })

    let fail = true
    m.push({
      label: "flaky",
      undo: async () => {
        if (fail) throw new Error("network")
      },
      redo: () => {},
    })
    expect((await m.undo()).status).toBe("error")
    expect(m.sizes().undo).toBe(1)
    fail = false
    expect((await m.undo()).status).toBe("done")
    expect(m.sizes()).toEqual({ undo: 0, redo: 1 })
  })

  it("ignores pushes and presses while an undo runs", async () => {
    const m = createUndoManager()
    let release!: () => void
    m.push({
      label: "slow",
      undo: () =>
        new Promise<void>((r) => {
          // The write it reuses tries to register itself.
          m.push({ label: "echo", undo: () => {}, redo: () => {} })
          release = r
        }),
      redo: () => {},
    })
    const first = m.undo()
    expect(m.busy).toBe(true)
    expect((await m.undo()).status).toBe("busy")
    release()
    expect((await first).status).toBe("done")
    expect(m.sizes()).toEqual({ undo: 0, redo: 1 })
  })

  it("undoes a given entry by id (a toast's own button)", async () => {
    const { m, state, add } = counter()
    add(1)
    const id = m.getSnapshot().undo!.id
    add(10)
    expect((await m.undo(id)).status).toBe("done")
    expect(state.value).toBe(10)
    expect(m.sizes()).toEqual({ undo: 1, redo: 1 })
    expect((await m.undo(9999)).status).toBe("empty")
  })

  it("notifies subscribers with a fresh snapshot", () => {
    const m = createUndoManager()
    const fn = vi.fn()
    const off = m.subscribe(fn)
    m.push({ label: "a", undo: () => {}, redo: () => {} })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(m.getSnapshot().undo?.label).toBe("a")
    off()
    m.clear()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(m.getSnapshot().undo).toBeNull()
  })
})

describe("row comparison", () => {
  it("treats Postgres round trips as equal", () => {
    expect(sameValue(1024, "1024")).toBe(true)
    expect(sameValue(null, undefined)).toBe(true)
    expect(sameValue(null, "x")).toBe(false)
    expect(sameValue({ a: 1 }, { a: 1 })).toBe(true)
    expect(matches({ status: "done", x: 1 }, { status: "done" })).toBe(true)
    expect(matches({ status: "todo" }, { status: "done" })).toBe(false)
    expect(matches(undefined, { status: "done" })).toBe(false)
  })
})

describe("shortcuts", () => {
  const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init)

  it("maps the keys", () => {
    expect(undoKey(key({ key: "z", metaKey: true }))).toBe("undo")
    expect(undoKey(key({ key: "z", ctrlKey: true }))).toBe("undo")
    expect(undoKey(key({ key: "Z", metaKey: true, shiftKey: true }))).toBe("redo")
    expect(undoKey(key({ key: "Z", ctrlKey: true, shiftKey: true }))).toBe("redo")
    expect(undoKey(key({ key: "y", ctrlKey: true }))).toBe("redo")
    expect(undoKey(key({ key: "z" }))).toBeNull()
    expect(undoKey(key({ key: "z", metaKey: true, altKey: true }))).toBeNull()
    expect(undoKey(key({ key: "k", metaKey: true }))).toBeNull()
  })

  it("leaves text fields and editors alone", () => {
    const input = document.createElement("input")
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    const editor = document.createElement("div")
    editor.setAttribute("contenteditable", "true")
    const inner = document.createElement("p")
    editor.appendChild(inner)
    document.body.append(input, checkbox, editor)
    expect(isEditableTarget(input)).toBe(true)
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true)
    expect(isEditableTarget(document.createElement("select"))).toBe(true)
    expect(isEditableTarget(inner)).toBe(true)
    expect(isEditableTarget(checkbox)).toBe(false)
    expect(isEditableTarget(document.createElement("button"))).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
  })
})
