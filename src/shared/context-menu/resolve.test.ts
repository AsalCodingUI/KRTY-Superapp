import { afterEach, describe, expect, it } from "vitest"
import { detectNative, detectTokenAt, waNumber } from "./detect"
import { registerContextType, setElementTarget } from "./registry"
import {
  resolveLayers,
  visibleItems,
  type LayerBuilders,
  type ResolveInput,
} from "./resolve"
import type { CtxItem } from "./types"

/** Builders that just name what they were asked for. */
const stub: LayerBuilders = {
  selection: () => ({
    label: "selection",
    items: [{ id: "copy", label: "Salin" }],
  }),
  token: (tok) => ({
    label: tok.kind,
    items: [{ id: tok.kind, label: tok.value }],
  }),
  native: (hit) => ({
    label: hit.kind,
    items: [{ id: hit.kind, label: hit.kind }],
  }),
  entityLinks: (href) => [{ id: "open", label: `open ${href}` }],
  page: (_ctx, alone) => ({
    label: "page",
    items: [{ id: alone ? "page-inline" : "page-sub", label: "Halaman" }],
  }),
}

function html(markup: string) {
  document.body.innerHTML = markup
  return document.body
}

const input = (
  target: Element,
  extra: Partial<ResolveInput> = {},
): ResolveInput => ({
  target,
  x: 10,
  y: 10,
  selectionText: "",
  onSelection: false,
  token: null,
  access: "employee",
  keyboard: false,
  ...extra,
})

const kinds = (target: Element, extra?: Partial<ResolveInput>) => {
  const r = resolveLayers(input(target, extra), stub)
  if (r.native) throw new Error("native")
  return r.layers.map((l) => l.kind)
}

afterEach(() => {
  document.body.innerHTML = ""
})

describe("resolveLayers ordering", () => {
  it("goes most specific first and ends with the page", () => {
    html(`<table><tr><td><button id="b">Simpan</button></td></tr></table>`)
    expect(kinds(document.getElementById("b")!)).toEqual([
      "button",
      "table",
      "page",
    ])
  })

  it("puts the selection, then a token, before element layers", () => {
    html(`<p id="p">mail a@b.co</p>`)
    const p = document.getElementById("p")!
    expect(kinds(p, { selectionText: "mail", onSelection: true })).toEqual([
      "selection",
      "page",
    ])
    // Right-click on a Mac selects the word: the whole email still shows.
    expect(
      kinds(p, {
        selectionText: "a",
        onSelection: true,
        token: { kind: "email", value: "a@b.co" },
      }),
    ).toEqual(["selection", "email", "page"])
    expect(kinds(p, { token: { kind: "email", value: "a@b.co" } })).toEqual([
      "email",
      "page",
    ])
  })

  it("inlines the page layer only when it is alone", () => {
    html(`<div id="d">plain</div>`)
    const r = resolveLayers(input(document.getElementById("d")!), stub)
    expect(!r.native && r.layers[0].items[0].id).toBe("page-inline")
    html(`<a id="a" href="/x">x</a>`)
    const r2 = resolveLayers(input(document.getElementById("a")!), stub)
    expect(!r2.native && r2.layers.at(-1)!.items[0].id).toBe("page-sub")
  })

  it("lets an entity with href hide the generic link to the same page", () => {
    html(
      `<div id="row"><a id="a" href="/projects/1">P</a><a id="o" href="/other">O</a></div>`,
    )
    const row = document.getElementById("row")!
    const off = setElementTarget(row, {
      type: "project",
      label: "P",
      href: "/projects/1",
      items: () => [{ id: "edit", label: "Ubah" }],
    })
    const r = resolveLayers(input(document.getElementById("a")!), stub)
    expect(!r.native && r.layers.map((l) => l.kind)).toEqual([
      "project",
      "page",
    ])
    expect(!r.native && r.layers[0].items.map((i) => i.id)).toEqual([
      "open",
      "edit",
    ])
    // Another link in the row keeps its own layer.
    expect(kinds(document.getElementById("o")!)).toEqual([
      "link",
      "project",
      "page",
    ])
    off()
  })

  it("stacks nested entities, inner first, and skips their own button kind", () => {
    html(
      `<div id="outer"><button id="inner"><span id="t">Task</span></button></div>`,
    )
    const outer = document.getElementById("outer")!
    const inner = document.getElementById("inner")!
    const offs = [
      setElementTarget(outer, {
        type: "project",
        items: () => [{ id: "p", label: "p" }],
      }),
      setElementTarget(inner, {
        type: "task",
        items: () => [{ id: "t", label: "t" }],
      }),
    ]
    expect(kinds(document.getElementById("t")!)).toEqual([
      "task",
      "project",
      "page",
    ])
    offs.forEach((off) => off())
  })

  it("drops suppressed generic kinds inside a target", () => {
    html(`<div id="doc"><img id="i" src="/a.png"></div>`)
    const doc = document.getElementById("doc")!
    const off = setElementTarget(doc, {
      type: "doc",
      suppress: ["image"],
      items: () => [{ id: "b", label: "Blok" }],
    })
    expect(kinds(document.getElementById("i")!)).toEqual(["doc", "page"])
    off()
  })

  it("uses registered data-ctx types, with sections", () => {
    const off = registerContextType("client", (el, { id }) => ({
      label: el.dataset.ctxLabel,
      items: [
        { label: "A", items: [{ id: `copy-${id}`, label: "Salin ID" }] },
        { label: "B", items: [{ id: "x", label: "x" }] },
      ],
    }))
    html(
      `<div data-ctx="client" data-ctx-id="c1" data-ctx-label="Acme"><span id="s">Acme</span></div>`,
    )
    const r = resolveLayers(input(document.getElementById("s")!), stub)
    expect(!r.native && r.layers.map((l) => [l.kind, l.label])).toEqual([
      ["client", "A"],
      ["client", "B"],
      ["page", "page"],
    ])
    expect(!r.native && r.layers[0].items[0].id).toBe("copy-c1")
    off()
  })

  it("leaves data-ctx=native areas and iframes to the browser", () => {
    html(`<div data-ctx="native"><a id="a" href="/x">x</a></div>`)
    expect(resolveLayers(input(document.getElementById("a")!), stub)).toEqual({
      native: true,
    })
  })
})

describe("visibility", () => {
  const items: CtxItem[] = [
    { id: "all", label: "all" },
    { id: "pm", label: "pm", access: ["pm", "stakeholder"] },
    { id: "hidden", label: "h", hidden: true },
    {
      id: "sub",
      label: "sub",
      submenu: [{ id: "s", label: "s", access: ["stakeholder"] }],
    },
  ]
  it("filters by access level, recursively, dropping empty submenus", () => {
    expect(visibleItems(items, "employee").map((i) => i.id)).toEqual(["all"])
    expect(visibleItems(items, "pm").map((i) => i.id)).toEqual(["all", "pm"])
    expect(visibleItems(items, "stakeholder").map((i) => i.id)).toEqual([
      "all",
      "pm",
      "sub",
    ])
  })
  it("hides access-gated items on public pages", () => {
    expect(visibleItems(items, null).map((i) => i.id)).toEqual(["all"])
  })
  it("drops layers left empty", () => {
    html(`<div id="row"><span id="s">x</span></div>`)
    const off = setElementTarget(document.getElementById("row")!, {
      type: "project",
      items: () => [{ id: "del", label: "Hapus", access: ["stakeholder"] }],
    })
    expect(kinds(document.getElementById("s")!)).toEqual(["page"])
    expect(
      kinds(document.getElementById("s")!, { access: "stakeholder" }),
    ).toEqual(["project", "page"])
    off()
  })
})

describe("detectNative", () => {
  it("knows links, internal or not, and mailto / tel", () => {
    html(
      `<a id="i" href="/p">in</a><a id="e" href="https://example.com/x">ex</a><a id="m" href="mailto:a@b.co">m</a><a id="t" href="tel:+62812">t</a>`,
    )
    const get = (id: string) => detectNative(document.getElementById(id)!)
    expect(get("i")).toMatchObject({
      kind: "link",
      internal: true,
      scheme: "web",
    })
    expect(get("e")).toMatchObject({ kind: "link", internal: false })
    expect(get("m")).toMatchObject({ scheme: "mailto" })
    expect(get("t")).toMatchObject({ scheme: "tel" })
  })

  it("knows fields, rich text hosts, code, tables, media, buttons", () => {
    html(`
      <input id="txt" type="text"><input id="pw" type="password"><input id="cb" type="checkbox">
      <textarea id="ta"></textarea>
      <div id="ce" contenteditable="true"><p id="cep">x</p></div>
      <pre id="pre"><code id="code">let a = 1</code></pre>
      <table id="tb"><tr><td>1</td></tr></table>
      <video id="v" src="/v.mp4"></video>
      <button id="b" aria-keyshortcuts="Meta+S">Simpan</button>
      <div id="rb" role="button" aria-disabled="true">Kirim</div>
      <img id="img" src="/a.png" alt="A">`)
    const get = (id: string) => detectNative(document.getElementById(id)!)
    expect(get("txt")).toMatchObject({
      kind: "field",
      mode: "input",
      password: false,
    })
    expect(get("pw")).toMatchObject({ kind: "field", password: true })
    expect(get("cb")).toBeNull()
    expect(get("ta")).toMatchObject({ kind: "field", mode: "input" })
    expect(get("ce")).toMatchObject({ kind: "field", mode: "rich" })
    // Only the host is the field, not what's inside it.
    expect(get("cep")).toBeNull()
    expect(get("pre")).toMatchObject({ kind: "code", text: "let a = 1" })
    expect(get("code")).toBeNull()
    expect(get("tb")).toMatchObject({ kind: "table" })
    expect(get("v")).toMatchObject({ kind: "video" })
    expect(get("b")).toMatchObject({
      kind: "button",
      label: "Simpan",
      shortcut: "Meta+S",
    })
    expect(get("rb")).toMatchObject({ kind: "button", disabled: true })
    expect(get("img")).toMatchObject({ kind: "image", alt: "A" })
  })

  it("gives a table layer its row and cell", () => {
    html(`<table><tr><td>a</td><td id="c">b</td></tr></table>`)
    const r = resolveLayers(input(document.getElementById("c")!), {
      ...stub,
      native: (hit) =>
        hit.kind === "table"
          ? {
              items: [
                {
                  id: "t",
                  label: `${hit.row?.cells.length}:${hit.cell?.textContent}`,
                },
              ],
            }
          : null,
    })
    expect(!r.native && r.layers[0].items[0].label).toBe("2:b")
  })
})

describe("detectTokenAt", () => {
  it("finds the email, phone, date or address under the offset", () => {
    const text =
      "Hubungi rico@kretya.studio atau 0812-3456-7890 sebelum 12 Januari 2026, lihat https://kretya.studio."
    expect(detectTokenAt(text, text.indexOf("rico") + 2)).toEqual({
      kind: "email",
      value: "rico@kretya.studio",
    })
    expect(detectTokenAt(text, text.indexOf("0812") + 3)).toEqual({
      kind: "phone",
      value: "0812-3456-7890",
    })
    expect(detectTokenAt(text, text.indexOf("Januari"))).toEqual({
      kind: "date",
      value: "12 Januari 2026",
    })
    expect(detectTokenAt(text, text.indexOf("https") + 4)).toEqual({
      kind: "url",
      value: "https://kretya.studio",
    })
    expect(detectTokenAt(text, 2)).toBeNull()
    expect(detectTokenAt("2026-11-02", 3)).toMatchObject({ kind: "date" })
  })
  it("ignores short numbers", () => {
    expect(detectTokenAt("kode 0123", 6)).toBeNull()
  })
  it("turns 08… into a wa.me number", () => {
    expect(waNumber("0812-3456-7890")).toBe("6281234567890")
    expect(waNumber("+62 812 3456")).toBe("628123456")
  })
})
