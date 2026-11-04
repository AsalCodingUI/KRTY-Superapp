# Forms and fields

Every input a person types into or picks from: fields in dialogs and pages,
pickers, toggles, inline edits, file uploads. Live examples: **/ui** →
Form.

## Use

| Need                                  | Use                                                                         | File                                                              |
| ------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Text, email, url, number-ish          | `Input`                                                                     | `src/components/ui/input.tsx`                                     |
| Field with icon / button / suffix     | `InputGroup` + `InputGroupAddon` + `InputGroupInput`                        | `src/components/ui/input-group.tsx`                               |
| Search box                            | `InputGroup` + `RiSearchLine` addon + `type="search"`                       | same (TeamsPage)                                                  |
| Multi-line text                       | `Textarea` (grows with content)                                             | `src/components/ui/textarea.tsx`                                  |
| Text with bullets / numbered lists    | `RichTextField`                                                             | `src/components/rich-text-field.tsx`                              |
| Edit a title in place                 | `InlineText`                                                                | `src/components/inline-text.tsx`                                  |
| Pick one of a list                    | `Select` + `SelectTrigger` + `SelectValue` + `SelectContent` + `SelectItem` | `src/components/ui/select.tsx`                                    |
| Pick one, with search / "add new"     | `Popover` + `Command` (combobox; see `CategoryPicker`)                      | `src/components/ui/command.tsx`, `projects/ui/CategoryPicker.tsx` |
| 2–5 options, all visible              | `SegmentedControl`                                                          | `src/components/segmented-control.tsx`                            |
| Many options, all visible             | `RadioGroup` + `RadioGroupItem`                                             | `src/components/ui/radio-group.tsx`                               |
| On / off that applies now             | `Switch`                                                                    | `src/components/ui/switch.tsx`                                    |
| Yes / no inside a form, multi-select  | `Checkbox`                                                                  | `src/components/ui/checkbox.tsx`                                  |
| A date kept as `"yyyy-MM-dd"`         | `DateField`                                                                 | `src/components/date-field.tsx`                                   |
| A `Date`, range, presets, time        | `DatePicker` / `DateRangePicker`                                            | `src/components/date-picker.tsx`                                  |
| A time `"HH:mm"`                      | `TimeSelect` (24h, `step` minutes)                                          | `src/components/time-select.tsx`                                  |
| Year + quarter                        | `QuarterFilter`                                                             | `src/components/quarter-filter.tsx`                               |
| A file in a form                      | `FileField`                                                                 | `src/components/file-field.tsx`                                   |
| Upload dialog with preview            | `FileDropCanvas` (+ `twoPaneDialogClassName`)                               | `src/components/file-drop-canvas.tsx`                             |
| Label                                 | `Label htmlFor`                                                             | `src/components/ui/label.tsx`                                     |
| Error under a field                   | `FieldError` (+ `aria-invalid` on the control)                              | `src/components/ui/field.tsx`                                     |
| A settings row (label, hint, control) | `Row` in SettingsDialog                                                     | `src/widgets/settings/ui/SettingsDialog.tsx`                      |

Not used: `Field` / `FieldGroup` / `FieldDescription` from `ui/field.tsx`
(2 files). Don't start using them in one form; the pattern below is the
standard.

## Rules

**One field** (label above control)

```tsx
<div className="flex flex-col gap-2">
  <Label htmlFor="client-name">Nama</Label>
  <Input id="client-name" … />
  <p className="text-muted-foreground text-[13px]">Hint, if needed.</p>
</div>
```

- Label → control `gap-2` (8px). Every control has a `Label htmlFor` or
  an `aria-label` (a `Select` trigger with a visible `Label` still needs
  `aria-label`, Base UI's trigger is a button).
- Hint under the control: `text-muted-foreground text-[13px]`.
- Optional field: append `<span className="text-muted-foreground
font-normal">({tc("optional")})</span>` inside the Label. Required
  fields carry no star; they use `required` and the submit stays disabled
  until they're filled. (Exception: the client-facing brief form marks
  required questions with `RequiredMark`, `briefs/ui/brief-ui.tsx`.)

**Layout**

- Fields stack in `flex flex-col gap-4`; side-by-side pairs in
  `grid grid-cols-2 gap-3`.
- Checkbox / switch with its text: `<label className="flex cursor-pointer
items-center gap-2.5 text-sm">` around the control and a `<span>`.
- A switch row with a hint (settings): text left (`text-sm` + 13px hint),
  `Switch` right (`SettingsDialog` `Row`).

**Sizes and look** (built into the components; never set per page)

- Height `h-8` (32px) for `Input`, `InputGroup`, `SelectTrigger`,
  `DatePicker`, `FileField`, `SegmentedControl`. `SelectTrigger
size="sm"` = `h-7` for rows and toolbars. Nothing else (no `h-9`,
  `h-11`).
- Single-line fields are pills (`rounded-full`); `Textarea` is
  `rounded-md`, an `InputGroup` holding a textarea `rounded-xl`.
- Surface tokens: `bg-field` (`hover:bg-field-hover`), border
  `border-field-border` (`hover:border-field-border-hover`; transparent in
  dark). Text `text-base` on phones (no iOS zoom), `md:text-sm`.
  Placeholder `text-muted-foreground`.
- Focus: `focus-visible:border-primary/50 ring-2 ring-focus-ring`.
- Error: `aria-invalid` → `border-destructive ring-2 ring-destructive/20`.
- Disabled: `opacity-50`, `cursor-not-allowed`.
- Widths: `w-full` in forms; filters in page headers get a fixed width
  (`w-36`, `sm:w-[260px]` for search).

**Select**

- Use the shared `Select`; it collects the items so `SelectValue` shows
  the label (never a raw id). For a custom display pass a render function
  to `SelectValue`.
- The list scrolls with an overlay thumb (`OverlayThumb`): no width
  taken, shown while hovered / scrolling. Don't add a scrollbar or
  `max-h` other than `max-h-60` for long lists (`TimeSelect`).
- `SelectContent align="end"` when the trigger is at the right edge.

**Dates, times, numbers**

- Never `<input type="date">` or `type="time"`: `DateField` /
  `DatePicker` / `TimeSelect`. Bounds with `min` / `max` (DateField) or
  `fromDate` / `toDate`.
- Money and counts: `Input inputMode="decimal"` (or `"numeric"` for
  whole numbers) with a cleaner on change (`cleanAmount` in
  `finance/ui/SubscriptionDialog.tsx`), stored as a number on submit.
  Not `type="number"`. Show amounts back with `tabular-nums`; a currency
  goes in a `Select` beside the amount, not inside the input.

**Validation and errors**

- Required and format: native (`required`, `type="email"`, `maxLength`)
  plus a disabled submit while required fields are empty.
- A field the server rejected: `aria-invalid` on the control and
  `FieldError` under it. Anything else (network, permission): `toast.error`.
- Don't clear the form on error.

**Save and cancel**

- Dialog: the body is a `<form id="x-form" onSubmit>`; `DialogFooter`
  holds Cancel (`outline`, `type="button"`) then Save (`type="submit"
form="x-form"`). Busy: see button.md.
- Page (settings, editors): changes that apply now save on change
  (switches, `InlineText`, notes autosave with "Menyimpan… / Tersimpan" in
  `text-tertiary-foreground text-xs`). A page form with an explicit save
  puts it in `PageHeader actions`.

**Keyboard**

- Enter submits (it's a `<form>`); in a `Textarea`, ⌘/Ctrl+Enter
  submits (`TaskDialog` comments).
- Esc closes the dialog (built in). `InlineText`: Enter / blur saves, Esc
  reverts.
- First field `autoFocus` in a create dialog.

**Light**: `DatePicker` loads the calendar lazily (on hover / focus);
keep heavy pickers behind `dynamic()`.

## Don't

- `className="h-9"`, `h-11 px-4`, `text-xs`, `text-[13px]` on `Input` /
  `SelectTrigger`: the field sizes are fixed.
- A `SelectTrigger` or `PopoverTrigger` restyled by hand to look like a
  field or a ghost: use the component (or add a variant to it).
- An icon placed with `absolute left-3` over an `Input` with `pl-9`:
  `InputGroup`.
- `" *"` typed after a label.
- `gap-1.5` / `gap-1` between label and control.
- `type="number"` (spinner arrows, scroll-to-change) or `type="date"`.

## Not form fields (keep their own style)

`InlineText` (looks like text until hovered), the brief builder's question
editor, the document editor (`policies/ui/doc-editor.tsx`), PIN entry
(`p/[token]/PinForm.tsx`), the glass fields on minimal screens
(`glassControlClass`), property rows in `TaskDialog` (until a ghost
`SelectTrigger` exists, see Migration).

## Good examples

- Dialog form: `src/page-slices/clients/ui/ClientFormDialog.tsx`
- Amount + currency: `src/page-slices/finance/ui/SubscriptionDialog.tsx`
- Search box: `src/page-slices/teams/ui/TeamsPage.tsx`
- Checkboxes with text: `src/page-slices/contracts/ui/ContractFormDialog.tsx`
- Switch rows: `src/widgets/settings/ui/SettingsDialog.tsx`
- Combobox: `src/page-slices/projects/ui/CategoryPicker.tsx`

## Example

```tsx
<form id="sub-form" onSubmit={submit} className="flex flex-col gap-4">
  <div className="flex flex-col gap-2">
    <Label htmlFor="sub-name">Nama</Label>
    <Input id="sub-name" required autoFocus value={name} onChange={…} />
  </div>
  <div className="grid grid-cols-2 gap-3">
    <div className="flex flex-col gap-2">
      <Label>Mata uang</Label>
      <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
        <SelectTrigger className="w-full" aria-label="Mata uang">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>…</SelectContent>
      </Select>
    </div>
    <div className="flex flex-col gap-2">
      <Label htmlFor="sub-amount">Nominal</Label>
      <Input id="sub-amount" inputMode="decimal" value={amount} onChange={…} />
    </div>
  </div>
  <div className="flex flex-col gap-2">
    <Label htmlFor="sub-start">Mulai</Label>
    <DateField id="sub-start" value={start} onChange={setStart} />
  </div>
</form>
<DialogFooter>
  <Button type="button" variant="outline" onClick={close}>{tc("cancel")}</Button>
  <Button type="submit" form="sub-form" disabled={saving || !name}>
    {saving && <Spinner data-icon="inline-start" />}
    {saving ? tc("saving") : tc("save")}
  </Button>
</DialogFooter>
```

## Migration notes

Found Nov 2026; fix in place, then delete the line. Paths under `src/`.

**Missing variants (add to the shared component, then replace)**

- Ghost / inline `SelectTrigger` (property rows):
  `hover:bg-accent border-transparent bg-transparent px-2.5 text-[13px]
shadow-none` repeated at `page-slices/projects/ui/workspace/TaskDialog.tsx:448,484,527`,
  `projects/ui/workspace/ProjectTasks.tsx:745,771` → `SelectTrigger
variant="ghost"`.
- Combobox triggers copy SelectTrigger's classes by hand:
  `page-slices/projects/ui/CategoryPicker.tsx:121`,
  `page-slices/briefs/ui/BriefCreateDialog.tsx:152` → export a
  `fieldTriggerClassName` (or a `Combobox` component) from `ui/select.tsx`.
- Focus ring differs: fields use `ring-focus-ring` (primary 22%),
  `Button` / `Checkbox` / `Switch` / `RadioGroupItem` `ring-primary/15`
  → one token.
- `FieldError` is `text-sm`; hints are `text-[13px]` → make FieldError
  13px.
- `TimeSelect` and `DatePicker` accept a `size` / `inputSize` they ignore
  → remove the props.
- `SegmentedControl` keeps a deprecated `size` prop → remove.

**Field size overrides**

- `app/(fullscreen)/auth/update-password/page.tsx:86,102`: `Input h-11 px-4`
  → default (or a minimal-screen field variant shared with login).
- `page-slices/projects/ui/workspace/TaskBoard.tsx:430`: `h-9 text-[13px]`
  → default.
- `projects/ui/workspace/ProjectTasks.tsx:679`, `briefs/ui/BriefBuilder.tsx:1229,1238`:
  `h-7` (+ `text-[13px]`) → needs an `Input size="sm"` (add it) like
  `SelectTrigger size="sm"`.
- `projects/ui/workspace/TaskDialog.tsx:349`, `my-notes/MyNotesPage.tsx:612`:
  `text-[13px]` → drop; `h-8` repeated on Inputs at
  `ProjectDashboard.tsx:1514`, `ProjectTasks.tsx:461,906`,
  `performance/ui/kpi/ProjectScoringView.tsx:263`,
  `projects/ui/ProjectForm.tsx:532` (SelectTrigger) → drop (default).
- `projects/ui/workspace/ProjectDashboard.tsx:844`: `InputGroup h-7` →
  `size="sm"` once it exists.
- `projects/ui/workspace/ReportDialog.tsx:324`,
  `projects/ui/workspace/ClientPortalCard.tsx:169`: `Input text-xs` → drop.
- `features/leave-request/ui/LeaveRequestForm.tsx:64`: `Input bg-muted`
  (read-only look) → `readOnly` / `disabled`.
- `performance/ui/kpi/ProjectScoringView.tsx:932`: `Textarea text-[13px]`
  → drop.

**Label spacing** (`gap-1.5` / `gap-1` → `gap-2`)

- `projects/ui/ProjectForm.tsx:351,374,382,394,420,443,451,498`
- `projects/ui/invoice/InvoiceSettingsDialog.tsx:319,329,432,512`
- `projects/ui/invoice/InvoiceEditorDialog.tsx:341`
- `projects/ui/workspace/ProjectDocuments.tsx:546,568,593`
- `performance/ui/meeting/OneOnOne.tsx:453,463,474,484`
- `performance/ui/competency/CompetencyLibrary.tsx:308,328,337`
- `performance/ui/review/ReviewMonitoring.tsx:551,564`,
  `performance/ui/review/ReviewForm.tsx:278`
- `briefs/ui/BriefCreateDialog.tsx:137,147,270`
- `widgets/notifications/ui/AnnouncementDialog.tsx:114,123,133`
- `contracts/ui/ContractDialog.tsx:259` (`gap-1`)

**Search boxes** (absolute icon + `Input pl-9` → `InputGroup`)

- `page-slices/clients/ui/ClientsPage.tsx:330`, `whats-new/ui/WhatsNewPage.tsx:168`,
  `contracts/ui/ContractsPage.tsx:266`, `projects/ui/ProjectsListPage.tsx:261,284`,
  `policies/ui/PoliciesPage.tsx:310`, `briefs/ui/BriefsView.tsx:92`.

**Markers and text**

- `widgets/event-calendar/ui/event-dialog.tsx:610,699,765`: `" *"` after
  labels → drop (required is native); its errors `text-destructive
text-xs` (`:756,828`) → `FieldError`.
- Hint size `text-xs` instead of `text-[13px]`:
  `projects/ui/workspace/ProjectDocuments.tsx:533`,
  `widgets/notifications/ui/AnnouncementDialog.tsx:145`.
- Error lines hand-made (`<p className="text-destructive text-sm|text-[13px]">`)
  at `contracts/ui/ContractDialog.tsx:277`, `briefs/ui/BriefForm.tsx:730,981`,
  `app/(fullscreen)/p/[token]/PinForm.tsx:263` → `FieldError`.

**Inputs**

- `performance/ui/kpi/ProjectScoringView.tsx:264`: `type="number"` →
  `inputMode="decimal"` + cleaner.
- `projects/ui/invoice/InvoiceSettingsDialog.tsx:400`: raw text button
  under a FileField ("Hapus QR") → `Button variant="link" size="xs"`.
- `performance/ui/review/ReviewResult.tsx:188`: the only `Tabs` (ui/tabs)
  in the app → `SegmentedControl` (see navigation.md).
