/**
 * The app-wide undo stack (one per tab): every action that can be taken
 * back registers { label, undo, redo } right after it lands. ⌘Z / Ctrl+Z
 * runs the newest undo, ⌘⇧Z / Ctrl+Shift+Z / Ctrl+Y its redo (see
 * UndoShortcuts). A new action clears the redo stack; the stack keeps the
 * last `limit` actions.
 *
 * `undo` / `redo` capture the exact values to go back to, before the
 * mutation runs, and check the row still holds what the action left (or,
 * for redo, what the undo left); when it doesn't they throw `UndoStale`
 * and the step is dropped ("Udah berubah, nggak bisa di-undo").
 *
 * While an undo or redo runs, nothing new is registered (the writes it
 * reuses would otherwise push themselves), and further presses are ignored.
 */

export type UndoAction = {
  /** What it did, shown as "Dibatalkan: <label>" (already translated). */
  label: string
  undo: () => unknown | Promise<unknown>
  redo: () => unknown | Promise<unknown>
}

export type UndoEntry = UndoAction & { id: number }

/** Thrown from undo / redo when the row moved on since. */
export class UndoStale extends Error {
  constructor(message = "stale") {
    super(message)
    this.name = "UndoStale"
  }
}

export type UndoOutcome =
  | { status: "done"; entry: UndoEntry }
  | { status: "empty" }
  | { status: "busy" }
  | { status: "stale"; entry: UndoEntry }
  | { status: "error"; entry: UndoEntry; error: unknown }

export type UndoSnapshot = {
  undo: UndoEntry | null
  redo: UndoEntry | null
  busy: boolean
}

export function createUndoManager({ limit = 50 }: { limit?: number } = {}) {
  let undoStack: UndoEntry[] = []
  let redoStack: UndoEntry[] = []
  let busy = false
  let nextId = 1
  const listeners = new Set<() => void>()
  let snapshot: UndoSnapshot = { undo: null, redo: null, busy: false }

  const emit = () => {
    snapshot = {
      undo: undoStack.at(-1) ?? null,
      redo: redoStack.at(-1) ?? null,
      busy,
    }
    for (const fn of listeners) fn()
  }

  /** Registers a done action; returns its id (0 when ignored mid-undo). */
  function push(action: UndoAction): number {
    if (busy) return 0
    const entry: UndoEntry = { ...action, id: nextId++ }
    undoStack = [...undoStack, entry].slice(-limit)
    redoStack = []
    emit()
    return entry.id
  }

  async function step(
    from: () => UndoEntry[],
    setFrom: (s: UndoEntry[]) => void,
    to: () => UndoEntry[],
    setTo: (s: UndoEntry[]) => void,
    run: (e: UndoEntry) => unknown,
    id?: number,
  ): Promise<UndoOutcome> {
    if (busy) return { status: "busy" }
    const stack = from()
    const index = id === undefined ? stack.length - 1 : stack.findIndex((e) => e.id === id)
    const entry = stack[index]
    if (!entry) return { status: "empty" }
    busy = true
    emit()
    try {
      await run(entry)
      setFrom(from().filter((e) => e !== entry))
      setTo([...to(), entry].slice(-limit))
      return { status: "done", entry }
    } catch (error) {
      if (error instanceof UndoStale) {
        // It can't go back any more: drop it.
        setFrom(from().filter((e) => e !== entry))
        return { status: "stale", entry }
      }
      // A failed write: keep it where it was, so it can be tried again.
      return { status: "error", entry, error }
    } finally {
      busy = false
      emit()
    }
  }

  const getUndo = () => undoStack
  const setUndo = (s: UndoEntry[]) => (undoStack = s)
  const getRedo = () => redoStack
  const setRedo = (s: UndoEntry[]) => (redoStack = s)

  return {
    push,
    /** Undo the newest action, or the one with `id` (a toast's own Undo). */
    undo: (id?: number) =>
      step(getUndo, setUndo, getRedo, setRedo, (e) => e.undo(), id),
    redo: (id?: number) =>
      step(getRedo, setRedo, getUndo, setUndo, (e) => e.redo(), id),
    /** Drops an action (it can't be taken back any more). */
    forget(id: number) {
      undoStack = undoStack.filter((e) => e.id !== id)
      redoStack = redoStack.filter((e) => e.id !== id)
      emit()
    },
    clear() {
      undoStack = []
      redoStack = []
      emit()
    },
    get busy() {
      return busy
    },
    sizes: () => ({ undo: undoStack.length, redo: redoStack.length }),
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    getSnapshot: () => snapshot,
  }
}

export type UndoManager = ReturnType<typeof createUndoManager>
