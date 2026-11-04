# Feedback

How the app tells people what happened or what's going on: toasts, empty
states, missing values, error and 404 pages, confirm before destroying,
loading (spinner, skeleton), pending buttons, optimistic writes, unread
dots and counts, the notification sound. Live examples: **/ui** → Feedback.

## Use

| Need                                  | Use                                                                                 | File                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Something saved / failed / copied     | `toast.success(t(…))` / `toast.error(t(…))` from `sonner`                           | `src/components/ui/sonner.tsx` (Toaster)                               |
| Long upload / batch                   | `const id = toast.loading(…)`, then `toast.dismiss(id)` or `toast.error(…, { id })` | `src/page-slices/policies/ui/doc-editor.tsx`                           |
| Undo after a change                   | `registerUndo(rowsUndo(…))` (⌘Z, toasts for you)                                    | `src/shared/undo/index.ts`                                             |
| A list / page with nothing in it      | `EmptyState title description icon action`                                          | `src/components/empty-state.tsx`                                       |
| Nothing inside a small panel          | `PanelEmpty`                                                                        | `src/components/panel.tsx`                                             |
| A missing number / field              | `EmptyValue` or `orEmpty(value)`                                                    | `src/components/empty-value.tsx`                                       |
| Route crashed                         | `ErrorView` (in `error.tsx`)                                                        | `src/components/error-view.tsx`                                        |
| 404                                   | `NotFoundView` (in `not-found.tsx`)                                                 | `src/components/not-found-view.tsx`                                    |
| Any other full-page state             | `StatusPage code title description actions`                                         | `src/components/status-page.tsx`                                       |
| Before deleting / irreversible action | `ConfirmDialog variant="destructive"`                                               | `src/components/confirm-dialog.tsx`                                    |
| Loading a section / dialog            | `Spinner className="size-6"` centered                                               | `src/components/ui/spinner.tsx`                                        |
| Loading a route                       | `loading.tsx` with `Skeleton`s in the page's shape                                  | `src/components/ui/skeleton.tsx`                                       |
| Button while its action runs          | `disabled={pending}` + `<Spinner data-icon="inline-start" />`                       | `src/components/ui/button.tsx`                                         |
| Edits that show at once               | Patch the query cache first, roll back on error                                     | `src/page-slices/projects/ui/workspace/task-data.ts` (`useTaskWriter`) |
| Count in nav                          | `NavBadge` (pops when it goes up)                                                   | `src/components/nav-main.tsx`                                          |
| "New / unread" marker                 | Dot: `bg-primary size-2 rounded-full`                                               | `src/components/nav-main.tsx` (`NavDot`)                               |
| New notification sound                | `playNotificationSound(undefined, id)`                                              | `src/shared/lib/notification-sound.ts`                                 |

## Rules

**Toasts**

- One `Toaster` (root layout, `bottom-right`, `closeButton`), always dark.
  Import `toast` from `sonner`; never another toast library.
- Copy from i18n (`t(...)`), never a literal string. Indonesian casual,
  short, no "Berhasil":
  - success: object + past verb, no period: `Klien dihapus`,
    `Link disalin`, `Tersimpan`.
  - error: `Gagal <verb> <object>` plus, when retrying helps,
    `, coba lagi`: `Gagal menyimpan, coba lagi`. No period.
  - info: plain sentence, casual: `Udah versi terbaru`.
- Errors: show our message, not `error.message` (Postgres / network text
  isn't for people). Log the raw error with `console.error`.
- Toast for results the person didn't see happen (saved in the background,
  copied, sent). Don't toast what's already visible (a row that appeared,
  a checkbox that ticked); never toast on every autosave.
- Undoable changes register an undo instead of an "Undo" toast button.

**Empty states**

- `EmptyState placement="outer"` (default, dashed outline) for a page or
  section that is empty on its own; `placement="inner"` inside a list,
  card, panel, popover or dialog. Lists: always `inner` (table.md).
- Title says what's missing (`Belum ada project`), description says what
  to do next, one optional `action`. Icon is the bare section icon
  (the tile sizes it); `icon={null}` hides it.
- Filtered to nothing is a different message from truly empty
  (`emptyFilteredTitle`).
- Missing value in a cell / stat: `EmptyValue` (dashed stroke, labelled
  `Belum ada data`), not `-`, `—` or `0`.

**Errors and 404**

- Route errors: `error.tsx` renders `ErrorView` (try again + dashboard);
  404: `NotFoundView`. Outside the app shell pass `fullScreen`.
- `StatusPage`: soft code, title, one-line description, actions. No red,
  no alarm icons.

**Confirm**

- Ask before anything that can't come back: delete, remove a member,
  revoke a link. `ConfirmDialog variant="destructive"` with
  `confirmText={tc("delete")}` (or the verb), `cancelText={tc("cancel")}`.
- Title is the question with the object: `Hapus komentar ini?`,
  `Hapus “{name}”?`. Description only when it adds the consequence:
  `Komentarnya hilang buat semua orang dan nggak bisa dibalikin.`
- Async `onConfirm`: the dialog stays open with a spinner until it ends,
  then closes. Keep one dialog per list, driven by
  `pendingDelete` state (see `TaskDialog.tsx` comments).
- Reversible actions with undo (move, status, archive) don't confirm.
- Never `window.confirm`.

**Loading**

- Route: `loading.tsx` mirrors the page (title row `pt-6 pb-4`, then
  content in the real shapes: list rows `h-12`, buttons `h-8 rounded-full`).
- Section / dialog body: `<div className="flex justify-center py-16"><Spinner className="size-6" /></div>`.
- Inline (a row, a small control): `Spinner` at `size-4` / `size-3.5`.
- Show loading only for real waits; content that is cached renders at once.

**Pending buttons**

- `disabled={pending}` and a leading `<Spinner data-icon="inline-start" />`,
  label unchanged (no width jump). Cancel stays enabled unless the action
  can't be interrupted (`ConfirmDialog` disables both).
- Disabled = `opacity-50` from `Button`; don't restyle.

**Optimistic updates**

- Writes people expect to be instant (status, reorder, check, rename):
  `cancelQueries` → snapshot → `setQueryData` patch → write → on error
  restore the snapshot + `toast.error` → `invalidateQueries` either way →
  register undo (`useTaskWriter`). No spinner.

**Unread and counts**

- Unread / new: a still dot, `bg-primary size-2 rounded-full` (`size-1.5`
  on a collapsed sidebar icon or next to text), `ring-2 ring-background`
  when it sits on an icon tile. No pulsing, no red for "unread".
- Counts: `h-5 min-w-5 rounded-full px-1.5 text-xs tabular-nums`, `99+`
  cap, `animate-count-pop` only when the number goes up (`NavBadge`).
- Red (`destructive`) is for overdue / errors, not for "new".

**Sound**

- Only new notifications make a sound, through
  `playNotificationSound(undefined, notification.id)` (de-duped across tabs
  and bursts; silent in the Mac app, which plays it natively). The choice
  lives in Settings → Notifikasi (`notificationSound()`); never play audio
  elsewhere.

## Don't

- `toast.success("Berhasil!")`, literal strings, `toast.error(error.message)`.
- A trailing period on toast text, or mixing `Gagal menyimpan.` /
  `Gagal nyimpen. Coba lagi.` / `Gagal menyimpan, coba lagi` for one thing.
- Your own empty block (`<p className="text-center py-10">Belum ada…</p>`).
- `-` or `0` for "no data".
- Deleting on first click, or `window.confirm`.
- `{saving ? "Menyimpan…" : "Simpan"}` label swaps (use the spinner).
- A spinner where the content's shape is known on a route (use skeletons),
  or skeletons that don't match the page (`h-9 rounded-md` buttons).
- `animate-ping` / pulsing unread markers.

## Not feedback (keep their own)

Form field errors (`FieldError`, form.md), inline save status in editors
(`statusSaved` / `statusDirty` in the policy editor), the brief builder's
own autosave line, onboarding / What's new dialogs.

## Good examples

- Confirm a delete: `src/page-slices/projects/ui/workspace/TaskDialog.tsx`
  (comment delete, `pendingDelete`)
- Optimistic writes + undo: `src/page-slices/projects/ui/workspace/task-data.ts`
- Empty states: `src/page-slices/projects/ui/ProjectList.tsx`,
  `src/widgets/event-calendar/ui/components/EmptyState.tsx` (filtered vs empty)
- Upload progress toast: `src/page-slices/policies/ui/doc-editor.tsx`
- Count + dot: `src/components/nav-main.tsx`

## Example

```tsx
const [pendingDelete, setPendingDelete] = useState<string | null>(null)

<ConfirmDialog
  open={pendingDelete !== null}
  onOpenChange={(open) => !open && setPendingDelete(null)}
  title={t("deleteTitle", { name })}
  description={t("deleteDescription")}
  confirmText={tc("delete")}
  cancelText={tc("cancel")}
  variant="destructive"
  onConfirm={async () => {
    const { error } = await remove(pendingDelete!)
    if (error) return void toast.error(t("deleteFailed"))
    toast.success(t("deleted"))
  }}
/>

{rows.length === 0 ? (
  <EmptyState
    placement="inner"
    icon={<FolderOpen />}
    title={t("emptyTitle")}
    description={t("emptyDescription")}
  />
) : (
  …
)}

<Button disabled={saving} onClick={save}>
  {saving && <Spinner data-icon="inline-start" />}
  {tc("save")}
</Button>
```

## Migration notes

Nothing below is changed yet.

**Toast copy** (`src/shared/i18n/messages/*.ts`)

- Trailing periods on `Gagal …` in about 100 strings (`projects.ts` 35,
  `performance.ts` 22, `policies.ts` 9, `finance.ts` 6, `auth.ts` 4,
  `invoices.ts` 4, `whatsNew.ts` 4, …) vs none in `leave.ts`, `calendar.ts`,
  `api.ts` → drop the period. Same for `saved: "Tersimpan."`.
- Same meaning, different words: `saved` is `Tersimpan` (`briefs.ts:110`,
  `performance.ts:47`), `Disimpan` (`santuy.ts:87`), `Tersimpan.`;
  `saveFailed` is `Gagal menyimpan.` (`briefs.ts:72`, `policies.ts:113`,
  `performance.ts:196`), `Gagal nyimpen. Coba lagi.` (`prefs.ts:73`),
  `Gagal menyimpan, coba lagi` (`santuy.ts:8`) → add `common.saved`,
  `common.saveFailed`, `common.deleted`, `common.copied` and use those.
- `leave.ts:160` `processing: "Memproses..."` → `…` (one character, like
  `common.saving`).
- `leave.ts:183` `cannotUndo: "Tindakan ini tidak bisa dibatalkan."` is formal; newer copy
  says `nggak bisa dibalikin` → one casual line in `common`.
- Literal toast strings: `src/app/(fullscreen)/menubar/MenubarPreview.tsx:234`,
  `src/app/(fullscreen)/desktop/DesktopApp.tsx:342`,
  `src/widgets/menubar/ui/MenubarPopover.tsx:171` → i18n keys.
- `toast.error(error.message || t(...))`:
  `src/page-slices/leave/ui/StakeholderLeavePage.tsx:300,341,375,396,428,473,541,587,650`
  → `toast.error(t(...))` + `console.error(error)`.

**Empty states**

- `placement` missing where it's inside something (defaults to outer):
  `src/page-slices/leave/ui/components/LeaveDetailsModal.tsx:106` (in a
  modal, also `className="py-8"`),
  `src/page-slices/leave/ui/components/ApprovalInbox.tsx:322` (in the inbox
  popover) → `placement="inner"`.
- Two empty components: `PanelEmpty` (`panel.tsx:100`, used by
  `santuy/ui/SantuyPage.tsx`, `SantuyQueue.tsx`) and `EmptyState` → make
  `PanelEmpty` an `EmptyState` size (e.g. `size="sm"`) or document it as the
  panel variant only.
- `src/components/ui/empty.tsx` (shadcn `Empty`) is unused → delete.
- 32 icons passed with `className="size-5"` (see icons.md) → bare icon.

**Confirm**

- `window.confirm`: `src/page-slices/projects/ui/ProjectForm.tsx:259`
  (remove a scored member) → `ConfirmDialog variant="destructive"`.
- Hand-built `AlertDialog`s: `workspace/ReportDialog.tsx`,
  `workspace/NoteDialog.tsx`, `invoice/InvoiceEditorDialog.tsx`,
  `policies/ui/PolicyEditor.tsx` → check whether `ConfirmDialog` fits
  (discard-changes prompts may need a third button: add it to
  `ConfirmDialog`, not locally).
- `useConfirmDialog` (`confirm-dialog.tsx:96-126`): the promise never
  resolves on cancel (leaks the awaiting code) → resolve `false` in
  `onOpenChange(false)`.
- `ConfirmDialog` swallows `onConfirm` errors (`console.error`, then the
  dialog stays open with no message) → callers must toast; document it or
  toast a shared failure line there.

**Loading**

- Route skeleton buttons `h-9 rounded-md` while real buttons are
  `h-8 rounded-full`: `src/app/(main)/clients/loading.tsx:11,19`,
  `projects/loading.tsx:11`, `projects/[id]/loading.tsx:11`,
  `processes/loading.tsx:11`, `processes/[id]/loading.tsx:11`,
  `policies/loading.tsx:11,19`, `payment-methods/loading.tsx:11`,
  `leave/loading.tsx:11`, `teams/loading.tsx:11`,
  `finance/loading.tsx:17`, `finance/subscriptions/loading.tsx:17` →
  `h-8 rounded-full` (search inputs: the input's height / radius).
- `projects/loading.tsx` draws `h-24`/`h-32`/`h-40` blocks for a grouped
  list → `h-10` group pills + `h-14` rows, like the page.
- Spinner sizes off the pattern: `size-5` in `PortalSessionEnded.tsx:17`,
  `PolicyDialog.tsx:301`, `LeaveRules.tsx:25`, `EmployeeLeavePage.tsx:47`,
  `LeaveRequestModal.tsx:48`, `SettingsDialog.tsx:550`,
  `NotificationsPanel.tsx:375` → `size-6` (centered) ; bare `<Spinner />`
  centered in `ApprovalInbox.tsx:319` → `size-6`.
- `src/features/leave-request/ui/LeaveRequestForm.tsx:156-157`
  (`animate-pulse` text + spun icon) → `Spinner`.
- `src/page-slices/policies/ui/doc-editor-lazy.tsx:16` (hand-made pulse
  div) → `Skeleton`.

**Pending buttons**

- Label swaps `{saving ? tc("saving") : tc("save")}` (23 places), e.g.
  `ClientFormDialog.tsx:201`, `ProcessFormDialog.tsx:174`,
  `ContractFormDialog.tsx:348`, `ProjectForm.tsx:607`,
  `ProjectDashboard.tsx:904` → spinner + unchanged label
  (`grep -rn '"saving")' src` for the rest).

**Optimistic**

- `src/page-slices/projects/ui/my-notes/notes-data.ts:88,109` patch on
  `onMutate` but don't snapshot / restore (they refetch on error) → the
  `useTaskWriter` order (snapshot, restore, then invalidate).

**Unread and counts**

- `src/widgets/notifications/ui/Notifications.tsx:91-96`: red `animate-ping`
  dot on the bell, running forever → still `bg-primary size-2` dot with
  `ring-2 ring-background`.
- Same file `:103-105`: count chip `bg-primary/10 text-primary rounded-sm`
  → the `NavBadge` chip (`nav-main.tsx:28`).
- Dot sizes mixed: `size-1.5` (`app-topbar.tsx:150`, `app-sidebar.tsx:326`)
  vs `size-2` (`nav-main.tsx:59`, `MenubarPopover.tsx:1530`,
  `NotificationsPanel.tsx:422`) → `size-2`, `size-1.5` only beside text /
  collapsed icons; one shared `UnreadDot` in `src/components/`.
