"use client"

import { useT } from "@/shared/i18n/client"
import { invokeApp } from "@/shared/lib/desktop-app"
import { useEffect } from "react"
import { toast } from "sonner"
import { setUndoRunner, undoManager } from "./store"

const TEXT_INPUTS = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
])

/**
 * A text field, textarea, select or contentEditable (the Tiptap editors):
 * there ⌘Z stays the browser's own text undo.
 */
export function isEditableTarget(el: EventTarget | Element | null): boolean {
  if (!el || !(el instanceof Element)) return false
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)
    return true
  if (el instanceof HTMLInputElement)
    return TEXT_INPUTS.has((el.type || "text").toLowerCase())
  if (el instanceof HTMLElement && el.isContentEditable) return true
  return Boolean(el.closest?.('[contenteditable=""],[contenteditable="true"]'))
}

/** Undo or redo from this key press, or null. */
export function undoKey(e: KeyboardEvent): "undo" | "redo" | null {
  if (e.altKey) return null
  const mod = e.metaKey !== e.ctrlKey // one of them, not both
  if (!mod) return null
  const key = e.key.toLowerCase()
  const z = key === "z" || (key.length !== 1 && e.code === "KeyZ")
  if (z) return e.shiftKey ? "redo" : "undo"
  if (e.ctrlKey && !e.shiftKey && (key === "y" || e.code === "KeyY"))
    return "redo"
  return null
}

declare global {
  interface Window {
    /** The Mac app's Edit > Undo / Redo (desktop/src-tauri/src/lib.rs). */
    __krtyMenuEdit?: (action: "undo" | "redo") => void
  }
}

/**
 * ⌘Z / Ctrl+Z undo, ⌘⇧Z / Ctrl+Shift+Z / Ctrl+Y redo across the app, with
 * a toast for each; mounted once in the (main) layout.
 */
export function UndoShortcuts() {
  const t = useT("undo")

  useEffect(() => {
    // One toast for undo / redo, replaced by the next one: an update keeps
    // the old fields unless they're cleared.
    const fresh = {
      id: "krty-undo",
      description: undefined,
      action: undefined,
    }
    const run = async (dir: "undo" | "redo", id?: number) => {
      const out =
        dir === "undo" ? await undoManager.undo(id) : await undoManager.redo(id)
      switch (out.status) {
        case "busy":
          return
        case "empty":
          toast(t(dir === "undo" ? "nothingToUndo" : "nothingToRedo"), {
            ...fresh,
          })
          return
        case "stale":
          toast.warning(t("stale"), {
            ...fresh,
            description: out.entry.label,
          })
          return
        case "error":
          console.error("undo failed", out.error)
          toast.error(t(dir === "undo" ? "failed" : "redoFailed"), {
            ...fresh,
            description: out.entry.label,
          })
          return
        case "done": {
          const entry = out.entry
          if (dir === "undo")
            toast.success(t("undone", { label: entry.label }), {
              ...fresh,
              action: {
                label: t("redo"),
                onClick: () => void run("redo", entry.id),
              },
            })
          else
            toast.success(t("redone", { label: entry.label }), {
              ...fresh,
            })
        }
      }
    }
    setUndoRunner(run)

    // The Mac app's menu runs the same thing; a key press it already got
    // (the page handles ⌘Z first) shouldn't run twice.
    let handledAt = 0
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      const dir = undoKey(e)
      if (!dir) return
      if (isEditableTarget(e.target) || isEditableTarget(document.activeElement))
        return
      e.preventDefault()
      handledAt = Date.now()
      void run(dir)
    }
    window.addEventListener("keydown", onKey)

    window.__krtyMenuEdit = (action) => {
      if (isEditableTarget(document.activeElement)) {
        // Text undo, as the native menu item would do it.
        void invokeApp<boolean>("native_edit", { action }).then((ok) => {
          if (!ok) document.execCommand(action)
        })
        return
      }
      if (Date.now() - handledAt < 400) return
      void run(action)
    }

    return () => {
      window.removeEventListener("keydown", onKey)
      setUndoRunner(null)
      delete window.__krtyMenuEdit
    }
  }, [t])

  return null
}
