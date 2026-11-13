#!/usr/bin/env node
// Inserts the pages convert.mjs made into Kretya Wiki (wiki_pages).
//
//   node scripts/notion-import/insert.mjs <pages.json> <owner profile id> [--dry]
//
// - Each page gets a new id; "(wiki:<notion id>)" links become
//   "(/wiki/<new id>)".
// - Notion's gray icons become emoji; covers hosted by Notion
//   (app.notion.com) are copied to the wiki's storage folder.
// - Parents go in before their children (one request per level).
// - created_by / updated_by: the owner (it shows as "Diedit … oleh …").
// - Refuses to run when the wiki already has pages (no duplicates).
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY from .env.local;
// never prints them.
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const [, , file, owner, flag] = process.argv
if (!file || !owner) {
  console.error("usage: insert.mjs <pages.json> <owner profile id> [--dry]")
  process.exit(1)
}
const dry = flag === "--dry"
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]
    }),
)
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_KEY
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const FOLDER = "00000000-0000-0000-0000-00000000a1c1"

const pages = JSON.parse(readFileSync(file, "utf8"))
const ids = new Map(pages.map((p) => [p.key, randomUUID()]))

// Notion's own icons (gray SVGs) → an emoji, as the wiki uses.
const NOTION_ICON_EMOJI = {
  atm: "💰",
  "palm-tree": "🌴",
  following: "👥",
  flag: "🚩",
  fireworks: "🎆",
  "star-outline": "⭐",
  subtask: "🧩",
  "photo-landscape": "🏞️",
  run: "🏃",
}
const iconOf = async (url) => {
  const m = /app\.notion\.com\/icons\/([\w-]+?)_\w+\.svg$/.exec(url ?? "")
  return m ? (NOTION_ICON_EMOJI[m[1]] ?? "📄") : rehost(url)
}

// Notion-hosted assets → our storage (once each).
const copied = new Map()
async function rehost(url) {
  if (!url || !/^https:\/\/(app\.notion\.com|www\.notion\.so)\//.test(url)) return url
  if (copied.has(url)) return copied.get(url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`)
  const type = res.headers.get("content-type") || "application/octet-stream"
  const name = url.split("/").pop().replace(/[^\w.-]+/g, "-")
  const path = `${FOLDER}/notion-${name}`
  if (!dry) {
    const up = await fetch(`${URL_}/storage/v1/object/report-images/${path}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": type, "x-upsert": "true" },
      body: Buffer.from(await res.arrayBuffer()),
    })
    if (!up.ok) throw new Error(`upload ${path}: ${up.status} ${await up.text()}`)
  }
  const out = `${URL_}/storage/v1/object/public/report-images/${path}`
  copied.set(url, out)
  return out
}

const rewrite = (body) =>
  (body ?? "").replace(/\(wiki:([0-9a-f]{32})\)/g, (m, key) =>
    ids.has(key) ? `(/wiki/${ids.get(key)})` : m,
  )

// Depth of each page (parents first).
const byKey = new Map(pages.map((p) => [p.key, p]))
const depth = (p) => (p.parent_key ? 1 + depth(byKey.get(p.parent_key)) : 0)

const rows = []
for (const p of pages) {
  rows.push({
    depth: depth(p),
    row: {
      id: ids.get(p.key),
      parent_id: p.parent_key ? ids.get(p.parent_key) : null,
      title: (p.title ?? "").slice(0, 200),
      body: rewrite(p.body),
      position: p.position ?? 0,
      icon: await iconOf(p.icon),
      cover: await rehost(p.cover),
      kind: p.kind === "database" ? "database" : "page",
      schema: p.schema ?? [],
      props: p.props ?? {},
      created_by: owner,
      updated_by: owner,
    },
  })
}
const left = rows.filter((r) => /\(wiki:[0-9a-f]{32}\)/.test(r.row.body)).length
console.log(`${rows.length} pages, ${copied.size} Notion assets rehosted, ${left} pages with unresolved links`)
if (dry) process.exit(0)

const existing = await fetch(`${URL_}/rest/v1/wiki_pages?select=id&limit=1`, { headers })
if ((await existing.json()).length) {
  console.error("wiki_pages isn't empty: not importing (no duplicates).")
  process.exit(1)
}
const maxDepth = Math.max(...rows.map((r) => r.depth))
for (let d = 0; d <= maxDepth; d++) {
  const level = rows.filter((r) => r.depth === d).map((r) => r.row)
  for (let i = 0; i < level.length; i += 50) {
    const res = await fetch(`${URL_}/rest/v1/wiki_pages`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(level.slice(i, i + 50)),
    })
    if (!res.ok) throw new Error(`insert level ${d}: ${res.status} ${await res.text()}`)
  }
  console.log(`level ${d}: ${level.length} pages`)
}
console.log("done")
