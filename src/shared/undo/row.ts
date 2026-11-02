import { createClient } from "@/shared/api/supabase/client"
import { UndoStale, type UndoAction } from "./manager"

type Values = Record<string, unknown>

/** Same value, the way Postgres hands it back (numbers, dates, json). */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return a == null && b == null
  if (typeof a === "number" || typeof b === "number") return Number(a) === Number(b)
  if (typeof a === "object" || typeof b === "object")
    return JSON.stringify(a) === JSON.stringify(b)
  return String(a) === String(b)
}

/** Every key of `expected` holds the same value in `row`. */
export function matches(row: Values | null | undefined, expected: Values) {
  if (!row) return false
  return Object.keys(expected).every((k) => sameValue(row[k], expected[k]))
}

/** The keys of `patch` as they are in `row` (what to go back to). */
export function pick<T extends Values>(row: T, keys: Iterable<string>) {
  const out: Values = {}
  for (const k of keys) out[k] = row[k]
  return out as Partial<T>
}

/**
 * Undo / redo for field edits on rows of one table, written straight
 * through Supabase: `rows` are { id, before, after } (only the fields the
 * action changed). Before going back it checks each row still holds
 * `after` (redo: `before`) on the `check` fields (all by default; leave
 * out what triggers rewrite, e.g. completed_at), else throws UndoStale.
 * `write` overrides the update (a cache-patching writer); `done` runs
 * after either direction (invalidate the queries).
 */
export function rowsUndo({
  label,
  table,
  rows,
  check,
  write,
  done,
}: {
  label: string
  table: string
  rows: { id: string; before: Values; after: Values }[]
  check?: (key: string) => boolean
  write?: (patches: { id: string; patch: Values }[]) => Promise<boolean>
  done?: () => unknown
}): UndoAction {
  const keep = (v: Values) =>
    Object.fromEntries(Object.entries(v).filter(([k]) => !check || check(k)))

  const go = async (dir: "undo" | "redo") => {
    const db = createClient()
    const keys = [...new Set(rows.flatMap((r) => Object.keys(r.before)))]
    const { data, error } = await (db as any)
      .from(table)
      .select(["id", ...keys].join(","))
      .in(
        "id",
        rows.map((r) => r.id),
      )
    if (error) throw error
    const current = new Map<string, Values>(
      ((data ?? []) as Values[]).map((r) => [String(r.id), r]),
    )
    for (const r of rows) {
      const expected = keep(dir === "undo" ? r.after : r.before)
      if (!matches(current.get(r.id), expected)) throw new UndoStale()
    }
    const patches = rows.map((r) => ({
      id: r.id,
      patch: dir === "undo" ? r.before : r.after,
    }))
    if (write) {
      if (!(await write(patches))) throw new Error("write failed")
    } else {
      const results = await Promise.all(
        patches.map(({ id, patch }) =>
          (db as any).from(table).update(patch).eq("id", id),
        ),
      )
      const failed = results.find((r: { error: unknown }) => r.error)
      if (failed) throw failed.error
    }
    await done?.()
  }

  return { label, undo: () => go("undo"), redo: () => go("redo") }
}
