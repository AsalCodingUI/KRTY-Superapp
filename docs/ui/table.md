# Tables and lists

Every list of rows in the app: page lists, grouped lists, DataTable, task
and invoice tables, tables inside Markdown. Live examples: **/ui** → Table.

## Use

| Need                                | Use                                                        | File                                                     |
| ----------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| A list of rows (most pages)         | `GroupedList` + `ListRow`                                  | `src/components/grouped-list.tsx`                        |
| Column labels above rows            | `ListHeader grid={ROW_GRID}` (or `listHeaderClassName`)    | same                                                     |
| Groups (status, category)           | `ListGroup label icon count`                               | same                                                     |
| Group header that sums its rows     | `GridGroup` (or `listGroupHeaderClassName` + the row grid) | `src/page-slices/performance/ui/list.tsx`                |
| Metadata chip in a row              | `ListChip`                                                 | `grouped-list.tsx`                                       |
| Actions shown on hover              | `ListRowActions` or `RowMenu`                              | `grouped-list.tsx`, `projects/ui/workspace/row-menu.tsx` |
| Sorting, multi-select, bulk actions | `DataTable`                                                | `src/components/data-table/data-table.tsx`               |
| Status in a cell                    | `Badge`                                                    | `src/components/ui/badge.tsx`                            |
| Paging                              | `ListPager`                                                | `src/components/list-pager.tsx`                          |
| Table in written content            | Markdown table (automatic)                                 | `src/components/markdown.tsx`                            |

A row that can't be a `ListRow` (a sortable `li`, a `role="row"` div) still
sits inside `GroupedList` and gets `data-slot="list-row"`, `relative`,
`gutter-x` and the row height, so it joins the sliding highlight.

## Rules

**Rows**

- Two heights only: `min-h-12` (one line), or `ListRow desc` = `min-h-14`
  when a description line runs under the title. Nothing else (no
  `min-h-11`, `h-11`, `min-h-16`).
- `py-2`, `text-sm`, sides `gutter-x` (the page gutter, full bleed).
- Columns: one shared grid constant per list (`ROW_GRID`) used by the
  header and every row; `gap-x-4` (16px) between columns.
- Checkbox column: 24px from the checkbox to the next column
  (`grid-cols-[1.5rem_…] gap-x-4`; DataTable's select cell `pr-4 pl-2`).

**No lines**

- No `border-b` / `border-t` / `divide-y` between rows, under the column
  labels or around groups.

**Hover and selection**

- Hover: the single sliding highlight (`GroupedList`, DataTable's
  `HoverHighlight`), `bg-(--row-hover)`, rounded-lg, 2px inset top and
  bottom. Never a per-row `hover:bg-*`.
- Selected / current row: `--row-selected` in the same rounded shape
  (DataTable: `RowHighlights`; lists: see `MyNotesPage` `aria-current`).

**Column labels and groups**

- Column labels sit on a pill: `bg-muted dark:bg-muted/40`, `h-10`,
  `rounded-lg`, `text-[13px]` muted (`listHeaderClassName`).
- Group headers use the same pill (`ListGroup`, `listGroupHeaderClassName`).
- Vertical spacing is 4px everywhere: header → first row, row → row,
  last row → next group, collapsed header → header.

**Alignment**

- Columns left-aligned, header matching its cells. Only the last data
  column is right-aligned (totals, remaining, dates at the end). Score
  columns meant to be compared may be right-aligned. Numbers use
  `tabular-nums`.

**Content**

- Status: `Badge` with a semantic variant (success / warning / info /
  secondary / destructive), never a hand-made pill.
- Secondary text under a title: `text-tertiary-foreground text-[13px]`.
- Empty list: `EmptyState placement="inner"`.

**Light**

- `GroupedList` and DataTable drop per-row motion above 50 rows; keep it
  that way (don't wrap rows in your own `motion` components).
- Page long lists with `ListPager` instead of rendering hundreds of rows.

**Markdown tables** (`markdown.tsx`): labels on the pill, rows `h-12`, no
lines, the sliding hover highlight.

## Don't

- `border-b border-border/50` between rows, or `border-b` under the header.
- `hover:bg-muted/20` (or any hover color) on a row.
- A third row height, `py-2.5` / `py-3` rows, `text-[13px]` rows.
- Right-aligning a middle column (e.g. "Used", "Duration") next to
  left-aligned text.
- A `::before` / `::after` on a `<tr>` (browsers make it an extra cell);
  use `RowHighlights`.
- Copying a list's markup into a page; import the component or the
  shared class constants.

## Not tables (keep their own style)

Printed invoice (`InvoiceDocument`), calendars and timelines, spreadsheet
preview (`office-view.tsx`: Excel-like grid, one outer border, no shadow),
comment threads, form field rows.

## Good examples

- Grouped, with description: `src/page-slices/projects/ui/ProjectList.tsx`
- Column labels + rows: `src/page-slices/leave/ui/components/EmployeeLeaveList.tsx`
- Div rows in a table: `src/page-slices/projects/ui/workspace/ProjectInvoices.tsx`
- Checkbox rows: `src/page-slices/projects/ui/my-tasks/MyTasksPage.tsx`
- DataTable with selection: `src/page-slices/leave/ui/components/AdminColumns.tsx`

## Example

```tsx
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_7rem_6rem] items-center gap-x-4"

<GroupedList>
  <ListHeader grid={ROW_GRID}>
    <span>Name</span>
    <span>Status</span>
    <span className="text-right">Total</span>
  </ListHeader>
  {rows.map((r) => (
    <ListRow key={r.id} desc className={ROW_GRID}>
      <div className="flex min-w-0 flex-col">
        <span className="truncate">{r.name}</span>
        <span className="text-tertiary-foreground truncate text-[13px]">
          {r.client}
        </span>
      </div>
      <Badge variant="success">{r.status}</Badge>
      <span className="text-right tabular-nums">{r.total}</span>
    </ListRow>
  ))}
</GroupedList>
```
