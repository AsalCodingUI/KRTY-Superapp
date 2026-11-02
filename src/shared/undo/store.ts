"use client"

import { useSyncExternalStore } from "react"
import { createUndoManager, type UndoAction, type UndoSnapshot } from "./manager"

/** This tab's stack. */
export const undoManager = createUndoManager({ limit: 50 })

/**
 * Registers an action that just landed. Returns its id (a toast's own
 * "Undo" button can run that one: `runUndo("undo", id)`).
 */
export function registerUndo(action: UndoAction) {
  return undoManager.push(action)
}

type Runner = (dir: "undo" | "redo", id?: number) => Promise<void>

let runner: Runner | null = null

/** UndoShortcuts installs the runner that also shows the toasts. */
export function setUndoRunner(fn: Runner | null) {
  runner = fn
}

/**
 * Undo / redo with feedback (the toast), from the keyboard, the right-click
 * menu, the Mac app's Edit menu or a toast's button.
 */
export async function runUndo(dir: "undo" | "redo", id?: number) {
  if (runner) return runner(dir, id)
  await (dir === "undo" ? undoManager.undo(id) : undoManager.redo(id))
}

const server: UndoSnapshot = { undo: null, redo: null, busy: false }

export function useUndoState() {
  return useSyncExternalStore(
    undoManager.subscribe,
    undoManager.getSnapshot,
    () => server,
  )
}
