# Badges, chips and counts

Small labels next to content: a row's status, its metadata, counts and
unread dots. Live examples: **/ui** → Badge.

## Use

| Need                                     | Use                                                        | File                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| A state (approved, overdue, running)     | `Badge variant`                                            | `src/components/ui/badge.tsx`                                                              |
| Metadata in a row (type, date, currency) | `ListChip`                                                 | `src/components/grouped-list.tsx`                                                          |
| Project or task status                   | `ProjectStatusIcon` (glyph), task: `StatusDot`             | `src/page-slices/projects/ui/ProjectStatusIcon.tsx`, `projects/ui/workspace/TaskBoard.tsx` |
| Contract status                          | `StatusBadge`                                              | `src/page-slices/contracts/ui/parts.tsx`                                                   |
| KPI rating                               | `RatingChip`                                               | `src/page-slices/performance/ui/kpi/RatingChip.tsx`                                        |
| 360 review cycle                         | `CycleStatusBadge`                                         | `src/page-slices/performance/ui/review/cycle-status.tsx`                                   |
| Contract ending soon                     | `EndingChip` (amber `ListChip`)                            | `contracts/ui/parts.tsx`                                                                   |
| Count next to a label                    | `<span className="text-tertiary-foreground tabular-nums">` | `ListGroup count`, tab labels                                                              |
| Count on a sidebar row                   | `NavBadge` (via `NavMain` item `badge`)                    | `src/components/nav-main.tsx`                                                              |
| "Something new" without a count          | `NavDot` (via `NavMain` item `dot`)                        | same                                                                                       |
| Count inside a button                    | `InboxCount`                                               | `src/page-slices/leave/ui/components/ApprovalInbox.tsx`                                    |

**Badge vs ListChip**: a `Badge` says what _state_ something is in and is
coloured by meaning. A `ListChip` carries _facts_ (type, dates, notes,
currency), is always grey, square-ish (`rounded-md`, `h-6`,
`text-[13px]`) and sits in the row's text flow. If it would change colour
when the record moves on, it's a Badge.

## Variants

Usage across `src` (93 Badges): secondary 32, mapped (`variant={…}`) 28,
warning 11, success 9, info 6, destructive 4, default 3.

| Variant         | Meaning                                    | Examples                                |
| --------------- | ------------------------------------------ | --------------------------------------- |
| `success`       | Done, approved, good                       | Disetujui, Lunas, Berjalan, Exceptional |
| `warning`       | Waiting, needs attention, partial          | Menunggu, Sebagian, Below               |
| `destructive`   | Rejected, overdue, failed                  | Ditolak, Terlambat, Needs work          |
| `info`          | Scheduled, sent, current / upcoming        | Terkirim, Dijadwalkan, Hari ini         |
| `secondary`     | Neutral: draft, ended, a plain label       | Draft, Selesai, Meets                   |
| `outline`       | Not started yet (contract draft)           | Draft (kontrak)                         |
| `default`       | Brand accent, rare (a "Lead" / "Baru" tag) | —                                       |
| `ghost`, `link` | Not for status (base shadcn leftovers)     | —                                       |

## Rules

**Badge**

- One size: `h-5`, `px-1.5`, `text-xs font-medium`, pill, icons `size-3`
  (with `data-icon="inline-start"`). No size or font overrides.
- Colour comes from the variant only (`bg-*-subtle text-*-11` tokens).
  Never pass a colour through `className`.
- Map each domain's statuses to variants once, next to the domain
  (`const STATUS_VARIANT = {...} as const`), and reuse that map; better,
  export a `<XStatusBadge status>` like `StatusBadge` / `CycleStatusBadge`.
- Allowed `className`: `shrink-0`, `max-w-full` (truncating a long label),
  `ml-*` / alignment.

**Domain mappings (canonical)**

| Domain                       | Status → variant                                                                                                    | Where                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Leave request                | approved → success · pending → warning · rejected → destructive                                                     | `STATUS_VARIANT` in `leave/ui/components/EmployeeLeaveList.tsx` |
| Leave type                   | Annual → info · Sick → warning · WFH → secondary                                                                    | `LEAVE_TYPE_BADGE`, `AdminLeaveList.tsx`                        |
| Contract                     | acknowledged → success · sent → warning · draft → outline                                                           | `StatusBadge`, `contracts/ui/parts.tsx`                         |
| Invoice (app)                | Draft → secondary · Sent → info · Partial → warning · Paid → success · Overdue → destructive · Refunded → secondary | `STATUS`, `projects/ui/workspace/ProjectInvoices.tsx`           |
| KPI rating                   | Exceptional → success · Above → info · Meets → secondary · Below → warning · Needs work → destructive               | `RatingChip` + `entities/performance/lib/kpi.ts`                |
| Review cycle                 | scheduled → info · running → success · ended / closed → secondary                                                   | `CycleStatusBadge`                                              |
| Attendance / dates           | today → info, otherwise secondary                                                                                   | `attendance/components/AttendanceHistoryList.tsx`               |
| Calendar event type          | event colour → variant (`getBadgeVariant`)                                                                          | `widgets/event-calendar/ui/event-dialog.tsx`                    |
| Process step (portal, panel) | done → success · open → secondary                                                                                   | see Migration                                                   |

**Project and task status are glyphs, not badges**

- `ProjectStatusIcon`: Planned dashed ring · Active half-filled · Review
  open ring · Paused ring with bars · Completed check · Archived archive
  icon. Muted, `size-4`; Completed slightly stronger.
- Tasks reuse it through `StatusDot` (todo → Planned, in_progress →
  Active, review → Review, done → Completed).
- The project's property strip uses a coloured dot (`STATUS_DOT` in
  `ProjectProperties.tsx`: Active primary, Review warning, Completed
  success, others muted) before the label.

**Counts**

- Next to a label (group header, tab, section title): the number in
  `text-tertiary-foreground tabular-nums`, `ml-1.5` after the label.
  Hidden at 0.
- Sidebar: `NavBadge` pill `h-5 min-w-5 bg-foreground/[0.08]
text-foreground/70 text-xs tabular-nums`, `99+` cap, pops when it goes
  up.
- Unread / new: a `bg-primary` dot, `size-2` (`size-1.5` on an icon or a
  tab label). `aria-hidden`; the label or list says it in words.
- Inside a primary button: `InboxCount` (`bg-primary text-primary-foreground`
  pill, `h-5 min-w-5`).
- Every count uses `tabular-nums`.

**Custom tags**: a small fact with an icon (Internal, Lead, Default) is
`Badge variant="secondary"` (or `default` for brand), with the icon as
`data-icon="inline-start"`. Not a hand-made span.

**Not badges (keep their own style)**: the printed invoice's header chips
(`InvoiceDocument` `HeaderChip`, `STATUS_TONE`, `TERM_TONE`: fixed print
colours), mention highlights in comments (`TaskDialog`), inline link
chips in `RichTextField`, notification icon tiles, `PhaseRail`'s missing
dates warning (an inline callout).

## Don't

- `<span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">`
  (a hand-made pill): `Badge variant="secondary"` or `ListChip`.
- `<span className="bg-success-subtle text-green-11 …">` for a state:
  `Badge variant="success"`.
- `<Badge className="bg-info-subtle text-blue-11">`: use the variant.
- `<Badge className="text-sm">` or `text-[11px]` tags.
- Copying a status → variant map into a second file.
- A Badge for a fact that never changes colour (use `ListChip`), or a
  ListChip for a state.

## Good examples

- Status column: `src/page-slices/leave/ui/components/EmployeeLeaveList.tsx`
- Status component: `src/page-slices/contracts/ui/parts.tsx` (`StatusBadge`, `EndingChip`)
- Mapped rating: `src/page-slices/performance/ui/kpi/RatingChip.tsx`
- Group counts: `src/components/grouped-list.tsx` (`ListGroup count`)
- Tab counts: `src/page-slices/policies/ui/PoliciesPage.tsx`

## Example

```tsx
const STATUS_VARIANT = {
  approved: "success",
  pending: "warning",
  rejected: "destructive",
} as const

<ListRow className={ROW_GRID}>
  <span className="truncate">{req.reason}</span>
  <ListChip>{formatLeaveRange(req.start_date, req.end_date)}</ListChip>
  <Badge variant={STATUS_VARIANT[req.status]}>{t(LABEL[req.status])}</Badge>
</ListRow>

<TabNavigationLink active={tab === "draft"} onClick={…}>
  Draft
  {count > 0 && (
    <span className="text-tertiary-foreground ml-1.5 tabular-nums">{count}</span>
  )}
</TabNavigationLink>
```

## Migration notes

Found Nov 2026; fix in place, then delete the line. Paths under `src/`.

**Hand-made status pills → `Badge`**

- `page-slices/projects/ui/portal/PortalOverview.tsx:162-171` (step done /
  open: `bg-success-subtle text-green-11` / `bg-muted`) → `Badge success /
secondary`.
- `page-slices/projects/ui/workspace/ProjectDashboard.tsx:1462-1470`
  (`ProcessPanel`, same pill) → same. Share one `StepStatusBadge`.
- `widgets/event-calendar/ui/components/GuestList.tsx:95-110` (RSVP,
  `rounded-sm` tinted div) → `Badge success / warning / destructive` with
  `data-icon`.
- `page-slices/projects/ui/workspace/ProjectInvoices.tsx:620`: `<Badge
className={status.tone}>` repaints the default variant by class → add a
  `variant` per status to `STATUS` and pass `variant`.
- `page-slices/projects/ui/invoice/InvoiceSettingsDialog.tsx:181`: payment
  methods are bordered card buttons (`border rounded-xl hover:bg-muted/50`)
  with a strike-through for inactive and a warning icon for stale → rows
  (`GroupedList`) with `Badge secondary` "Nonaktif" / `warning` "Perlu
  dicek".

**Hand-made tags → `Badge secondary` (or `ListChip` for facts)**

- `page-slices/projects/ui/workspace/ProjectLibrary.tsx:142` `InternalTag`
  (`text-[11px] py-px`) → `Badge secondary` + lock icon.
- `components/nav-project.tsx:124` lead tag (`bg-primary/10 text-primary
text-[11px]`) → `Badge default`.
- `page-slices/processes/ui/ProcessesPage.tsx:210`,
  `processes/ui/ProcessEditorPage.tsx:166` (`px-2.5 py-1`) "Default" →
  `Badge secondary`.
- `page-slices/processes/ui/ProcessesPage.tsx:222` (bordered `rounded-md`)
  → `ListChip` or `Badge outline`.
- `page-slices/policies/ui/PoliciesPage.tsx:530` policy status pill →
  `Badge` with a mapped variant.
- `page-slices/clients/ui/ClientsPage.tsx:465` (currency, bordered) and
  `:469` (country) → `ListChip`.
- `page-slices/briefs/ui/shared.tsx:161`, `briefs/ui/BriefBuilder.tsx:721,726`
  (`text-[11px]`) → `Badge secondary`.
- `page-slices/projects/ui/portal/PortalShell.tsx:155` (`bg-foreground/[0.06]`
  on the chrome) → `Badge secondary` (keep `blend-ink`).

**Badge overrides**

- `widgets/event-calendar/ui/dialog-variants/LeaveDialog.tsx:69,72`,
  `BaseReadOnlyDialog.tsx:99`: `className="text-sm"` → drop.
- `page-slices/performance/ui/kpi/TeamKpiList.tsx:82`: `font-normal` →
  drop.

**Duplicate maps**

- Leave `STATUS_VARIANT` is copied in `leave/ui/components/EmployeeLeaveList.tsx:30`,
  `LeaveDetailsModal.tsx:28`, `LeaveRequestDetailDialog.tsx:23` → one
  `LeaveStatusBadge` in `entities/leave/ui/`.
- `entities/leave/ui/LeaveStatus.tsx`, `entities/leave/ui/LeaveCard.tsx`,
  `entities/attendance/ui/AttendanceStatus.tsx`,
  `entities/calendar/ui/EventStatus.tsx` are unused (0 imports) and carry a
  `size` prop Badge doesn't have → reuse as the single badge per domain,
  or delete.

**Counts**

- `components/tab-navigation.tsx:143` `badge` prop (`bg-primary rounded-sm`
  pill) is unused while 5 pages hand-write the tertiary count
  (`clients/ui/ClientsPage.tsx:320`, `projects/ui/my-tasks/MyTasksPage.tsx:381`,
  `projects/ui/workspace/ProjectInvoices.tsx:480`,
  `projects/ui/workspace/ProjectTasks.tsx:400`,
  `policies/ui/PoliciesPage.tsx:299`) → give `TabNavigationLink` a
  `count` prop with the tertiary style; drop `badge`.
- `components/app-topbar.tsx:150` dot `size-1.5` vs `NavDot` `size-2`:
  fine (on a label), keep both sizes documented.
- `widgets/menubar/ui/MenubarPopover.tsx:611` has its own `StatusDot`
  (name clash with the task one) → rename (`TrackerDot`).
