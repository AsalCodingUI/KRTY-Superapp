/**
 * # Undo / redo — ⌘Z / Ctrl+Z, ⌘⇧Z / Ctrl+Shift+Z / Ctrl+Y
 *
 * One stack per tab (shared/undo/store.ts). After a change lands, register
 * how to take it back:
 *
 *   import { registerUndo, rowsUndo, UndoStale } from "@/shared/undo"
 *
 *   const before = { category_id: project.category_id }   // captured first
 *   await save({ category_id: next })
 *   registerUndo(rowsUndo({
 *     label: t("undoCategory", { name }),
 *     table: "projects",
 *     rows: [{ id: project.id, before, after: { category_id: next } }],
 *     done: () => queryClient.invalidateQueries({ queryKey: [...] }),
 *   }))
 *
 * or by hand: registerUndo({ label, undo: async () => {…}, redo: async () => {…} })
 * — throw `new UndoStale()` when the row moved on since (the step is
 * dropped with "Udah berubah, nggak bisa di-undo").
 *
 * The shortcuts only act when focus isn't in a text field, textarea,
 * select or contentEditable: typing and the editors keep their own undo.
 * The page group of the right-click menu shows Urungkan / Ulangi; in the
 * Mac app the Edit menu's Undo / Redo come here too (desktop/src-tauri).
 * Writes made while an undo runs don't register (no loops).
 */
export {
  createUndoManager,
  UndoStale,
  type UndoAction,
  type UndoEntry,
  type UndoOutcome,
} from "./manager"
export { registerUndo, runUndo, undoManager, useUndoState } from "./store"
export { matches, pick, rowsUndo, sameValue } from "./row"
export { UndoShortcuts, isEditableTarget } from "./UndoShortcuts"
