import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Readable storage paths: "PT Westura" → "pt-westura", "Logo Final (2).PNG"
 * → "logo-final-2" + ".png". Keeps storage browsable (R2 / Studio) instead of
 * a pile of UUIDs; the app still shows the original names from the database.
 */
export function slugify(value: string, max = 60) {
  const slug = value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "")
  return slug || "file"
}

/** "Brief Klien.v2.PDF" → { base: "Brief Klien.v2", ext: "pdf" } */
export function splitFileName(name: string) {
  const dot = name.lastIndexOf(".")
  if (dot <= 0 || dot === name.length - 1) return { base: name, ext: "" }
  return {
    base: name.slice(0, dot),
    ext: name
      .slice(dot + 1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ""),
  }
}

const withSuffix = (dir: string, stem: string, ext: string, n: number) =>
  `${dir}/${stem}${n > 1 ? `-${n}` : ""}${ext ? `.${ext}` : ""}`

const isTaken = (error: { message?: string; statusCode?: string } | null) =>
  Boolean(
    error &&
    (error.statusCode === "409" ||
      /exists|duplicate/i.test(error.message ?? "")),
  )

/**
 * Names already used in `dir` that start like `stem` (one list request).
 * Empty when listing isn't allowed or fails; the upload loop still copes.
 */
async function takenNames(
  db: SupabaseClient,
  bucket: string,
  dir: string,
  stem: string,
) {
  try {
    const { data, error } = await db.storage
      .from(bucket)
      .list(dir, { search: stem, limit: 1000 })
    if (error || !data) return new Set<string>()
    return new Set(data.map((o) => `${dir}/${o.name}`))
  } catch {
    return new Set<string>()
  }
}

/**
 * Uploads to "<dir>/<stem>.<ext>", or "<stem>-2.<ext>", "-3"… when the name
 * is taken (never overwrites). Returns the path it landed on. Lists the
 * folder first to pick a free name, so the file is normally sent once; a
 * name taken in the meantime still falls through to the next one.
 */
export async function uploadUnique(
  db: SupabaseClient,
  bucket: string,
  dir: string,
  stem: string,
  ext: string,
  file: File,
) {
  const taken = await takenNames(db, bucket, dir, stem)
  for (let n = 1; n <= 50; n++) {
    const path = withSuffix(dir, stem, ext, n)
    if (taken.has(path)) continue
    const { error } = await db.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type || undefined })
    if (!error) return path
    if (!isTaken(error)) throw error
  }
  throw new Error("no free file name")
}

/** Moves a file to "<same dir>/<stem>.<ext>" (or a free "-n" variant). */
export async function moveUnique(
  db: SupabaseClient,
  bucket: string,
  from: string,
  stem: string,
  ext: string,
) {
  const dir = from.slice(0, from.lastIndexOf("/"))
  for (let n = 1; n <= 50; n++) {
    const to = withSuffix(dir, stem, ext, n)
    if (to === from) return from
    const { error } = await db.storage.from(bucket).move(from, to)
    if (!error) return to
    if (!isTaken(error)) throw error
  }
  throw new Error("no free file name")
}

/** Today's date as "2026-10-23" (local time) for file names. */
export function dateStamp(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * `fn` over `items` with at most `limit` running at once; results keep the
 * input order. Each item settles on its own (one failure doesn't stop the
 * rest).
 */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i], i) }
      } catch (reason) {
        results[i] = { status: "rejected", reason }
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  )
  return results
}
