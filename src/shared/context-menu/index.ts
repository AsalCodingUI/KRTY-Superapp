/**
 * # Right-click menu (context menu) — for every element in the app
 *
 * Right-click anything (or Shift+F10 / the ContextMenu key on the focused
 * element, or a long press on a registered row on touch) and one menu opens
 * at the pointer, built from what is under it. ⇧ or ⌥ + right-click gives
 * the browser's own menu (the footer says so).
 *
 * ## How it decides
 *
 * From the clicked element up to <html> it collects *layers*, most
 * specific first; each is a group (with a small label) in the menu:
 *
 *   1. Selected text, when the click is on it — Salin, Cari di app (⌘K
 *      with the text). No AI here on purpose (quota): AI actions live
 *      only in the document editors' own layers (doc-context-menu).
 *   2. A token under the pointer in plain text — email (Kirim email,
 *      Salin), phone (WhatsApp, Telepon, Salin), date, bare web address.
 *   3. For each element going up:
 *      - a React target (`<ContextTarget>` / `useContextTarget`),
 *      - a `data-ctx="<type>"` marker with a registered type resolver,
 *      - what it natively is, each kind once (the nearest): link, image,
 *        video/audio, text field / contentEditable, code, table, button.
 *   4. The page: Kembali, Maju, Muat ulang, Salin link halaman, Buka di
 *      browser (Mac app), Mode gelap, Bahasa — inline when nothing else
 *      matched, else folded into one "Halaman" submenu.
 *
 * An entity with an `href` brings Buka / Buka di tab baru (Buka di
 * browser in the Mac app) / Salin link and hides the generic link layer
 * for that address (rows whose covering <a> is the row's own page).
 * `data-ctx="native"` on an element opts its whole subtree out (the
 * browser menu shows). Iframes (embeds) handle their own right-click; a
 * handler that already called `preventDefault()` (another menu) wins.
 *
 * Opening costs no network: items are built synchronously; a `submenu`
 * given as a loader runs when that submenu opens (spinner meanwhile).
 * With 10+ items, typing filters them (Backspace / Esc to clear).
 * Scroll, resize, window blur and Esc close it.
 *
 * Mounted: <ContextMenuProvider> in the root layout (so client report
 * pages /r/… and the portal /p/… get the generic, signed-out set);
 * <ContextMenuAppScope /> in the (main) layout adds the access level and
 * ⌘K search.
 *
 * ## Add actions for your thing (under 10 lines)
 *
 * a) The component that renders it holds the actions (closures):
 *
 *      import { ContextTarget } from "@/shared/context-menu"
 *      <ContextTarget type="task" id={task.id} label={task.title}
 *        href={taskHref(task)}
 *        items={() => [
 *          { id: "done", label: t("markDone"), icon: Check, onSelect: () => done(task) },
 *          { id: "del", label: tc("delete"), icon: Trash, destructive: true,
 *            confirm: true, access: ["pm", "stakeholder"], onSelect: () => remove(task) },
 *        ]}>
 *        <TaskRow … />   // one element that passes data-* props to the DOM
 *      </ContextTarget>
 *
 *    or, for an element you only hold by ref (third-party roots):
 *      useContextTarget(ref, (ctx) => [...items], { label })
 *
 * b) Rows rendered anywhere, by data attributes only (no wrapper):
 *
 *      // once, at module level in your feature (imported where used)
 *      registerContextType("client", (el, { id }) => ({
 *        label: el.dataset.ctxLabel,
 *        items: [{ id: "copy-id", label: "Salin ID", onSelect: () => copyText(id!) }],
 *      }))
 *      <div data-ctx="client" data-ctx-id={c.id} data-ctx-label={c.name}
 *           data-ctx-href={`/clients/${c.id}`}>…</div>
 *
 * Items (see CtxItem): id, label, icon, shortcut ("Mod+C"), hint,
 * onSelect(ctx) (runs as the menu closes; a rejected promise toasts),
 * disabled, destructive + confirm (second click runs it), checked + role
 * ("checkbox" | "radio"), submenu (items or async loader), access
 * (["employee" | "pm" | "stakeholder"]), hidden, keepOpen, keywords.
 * Return `CtxSection[]` ({ label, items }) for several labelled groups.
 * `suppress: ["image"]` on a target drops generic layers of those kinds
 * inside it (the doc editor covers its own pictures). DataTable rows:
 * pass `wrapRow={(item, row) => <ContextTarget …>{row}</ContextTarget>}`.
 *
 * Reference integrations: projects list / kanban / table rows
 * (page-slices/projects/ui/ProjectMenu.tsx — ContextTarget + a "project"
 * type), the document editors (page-slices/policies/ui/doc-context-menu.tsx
 * — useContextTarget on the editor DOM), the sidebar (nav-main.tsx) and
 * the account button (nav-user.tsx).
 * Builders get `ctx` (target, el, x, y, selectionText, access, keyboard):
 * read the clicked spot from it (the doc editor finds the block under it).
 */

export {
  ContextMenuProvider,
  useSetContextMenuScope,
} from "./ContextMenuProvider"
export type { ContextMenuScope } from "./ContextMenuProvider"
export { ContextMenuAppScope } from "./ContextMenuAppScope"
export { ContextTarget, useContextTarget } from "./ContextTarget"
export { registerContextType } from "./registry"
export { copyText, download, formatShortcut } from "./actions"
export { openAppSearch } from "./events"
export type {
  CtxContext,
  CtxIcon,
  CtxItem,
  CtxItems,
  CtxLayer,
  CtxSection,
  CtxTypeResolver,
} from "./types"
