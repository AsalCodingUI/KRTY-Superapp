# Design Guideline

## Golden Standard: Leave & Attendance Admin

This document defines the UI rules for admin pages by using Leave & Attendance Admin as the main reference. The goal is to keep page structure, spacing, navigation, stats, and table patterns consistent across all admin-facing pages.

## Source of Truth

- Main reference for page skeleton and tab layout: `src/page-slices/leave/ui/StakeholderLeavePage.tsx`
- Main reference for wrapped admin tables: `src/app/(main)/leave/AdminClientPage.tsx`
- Main reference for reusable stats cards: `src/page-slices/leave/ui/components/LeaveAdminStats.tsx`
- Supporting reference for shared table container: `src/shared/ui/structure/TableSection.tsx`

## Reference Hierarchy

- Use `StakeholderLeavePage.tsx` for overall page composition, header, tabs, and content rhythm.
- Use `LeaveAdminStats.tsx` for the preferred reusable stats-card pattern.
- Use `AdminClientPage.tsx` for the standard wrapped `DataTable` pattern with title and description.
- If implementations differ, prefer the reusable shared pattern over one-off inline markup.

## Core Principle

- Reuse the same page skeleton for every admin page.
- Keep hierarchy simple: header, container, tabs, sections, data.
- Prefer shared UI primitives from `@/shared/ui`.
- If a page needs custom layout, it should still inherit spacing and structure from Leave & Attendance Admin.

## 1. Page Wrapper

Always use this outer page structure.

```tsx
<div className="flex flex-col">
  <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
    <RiIconName className="size-4 text-foreground-secondary" />
    <p className="text-label-md text-foreground-primary">Page Title</p>
  </div>

  <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
    ...
  </div>
</div>
```

### Rules

- Outer wrapper is always `flex flex-col`.
- Header always uses `gap-2 rounded-xxl px-5 pt-4 pb-3`.
- Header icon uses `size-4 text-foreground-secondary`.
- Header title uses `text-label-md text-foreground-primary`.
- Main content container always uses `bg-surface-neutral-primary flex flex-col rounded-xxl`.

## 2. Tab Navigation

Use the Leave & Attendance Admin tab pattern.

```tsx
<div className="px-5 pt-2 border-b border-neutral-primary">
  <div className="xl:hidden">
    <Select>
      ...
    </Select>
  </div>

  <div className="hidden xl:flex items-start justify-between gap-4">
    <TabNavigation className="border-b-0">
      <TabNavigationLink>Tab 1</TabNavigationLink>
      <TabNavigationLink>Tab 2</TabNavigationLink>
    </TabNavigation>
  </div>
</div>
```

### Rules

- Tab bar wrapper uses `px-5 pt-2 border-b border-neutral-primary`.
- Add `space-y-3` only when the mobile selector and desktop action row are intentionally stacked in the same wrapper.
- Mobile navigation uses `Select`.
- Desktop navigation uses `TabNavigation` with `border-b-0`.
- If page has tab-specific actions, place them on the right side of the desktop row.

## 3. Tab Content

Use a padded content area with mounted tab panels.

```tsx
<div className="p-5">
  <div className="block space-y-5">{content}</div>
  <div className="hidden space-y-5">{content}</div>
</div>
```

### Rules

- Content wrapper always uses `p-5`.
- Inside each tab panel use `block space-y-5` when active.
- Inactive mounted panels use `hidden space-y-5`.
- Each major block inside a tab should be wrapped in `<section>`.

## 4. Section Spacing

### Rules

- Space between sections is always `space-y-5`.
- Do not mix `space-y-4`, `gap-lg`, or arbitrary spacing values for top-level page sections.
- Keep section rhythm consistent between tabs.

## 5. Stats Cards

Preferred standard for stats cards is the shared card pattern already used in `LeaveAdminStats.tsx`.

```tsx
<dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  <Card>
    <dt className="text-label-md text-foreground-secondary">Label</dt>
    <dd className="mt-2 flex items-baseline space-x-2.5">
      <span className="text-display-xxs text-foreground-primary">Value</span>
    </dd>
  </Card>
</dl>
```

### Rules

- Use `gap-6` for stats grid.
- Default responsive grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- If there are 4 or 5 stats, layout may expand to `lg:grid-cols-4` or `lg:grid-cols-5`.
- Label uses `text-label-md text-foreground-secondary`.
- Value uses `text-display-xxs text-foreground-primary`.
- Value row uses `mt-2 flex items-baseline space-x-2.5`.

### Avoid

- `px-4 py-3` as the defining style of the metric card.
- `text-heading-md` for the main numeric value when the page is following this admin stats pattern.
- Uneven internal spacing between cards.

### Note

- `StakeholderLeavePage.tsx` still contains an older inline stats implementation with bordered boxes, `gap-3`, and `text-heading-md`.
- That implementation should be treated as a page-specific legacy variation, not the final standard.
- The reusable pattern in `LeaveAdminStats.tsx` is the preferred guideline baseline.

## 6. Table Pattern

Always prefer `DataTable` from `@/shared/ui` for admin data views.

```tsx
<section>
  <DataTable
    data={data}
    columns={columns}
    showTableWrapper={true}
    tableTitle="Section Title"
    tableDescription="Short supporting description"
  />
</section>
```

### Rules

- Use `DataTable`, not a manually composed `Table`, for standard admin listing pages.
- Wrap tables in `<section>`.
- `showTableWrapper={true}` is the default standard for standalone admin tables.
- `tableTitle` and `tableDescription` should be present when using the standard wrapped table pattern.
- Disable only the table features the page truly does not need, such as `showExport`, `showViewOptions`, or `showFilterbar`.

### Exception

- Inside nested accordion content such as grouped attendance history, `DataTable` may appear without the standard wrapper if the surrounding container already provides the visual frame.
- Example: `AdminAttendanceHistoryList.tsx` uses `DataTable` inside `AccordionContent`.
- Inside an already-framed admin content panel, a secondary table may also omit the wrapper when another section on the same tab already establishes the main layout container.
- Example: `StakeholderLeavePage.tsx` uses `showTableWrapper={false}` for `RemainingLeaveView`.

## 7. Action Placement

### Rules

- Actions that affect a specific tab should live in the tab header row, aligned to the right on desktop.
- Example: `Added Manually` button in the `approval` tab.
- Do not place contextual actions inside the page header unless they affect the whole page.

## 8. Consistency Rules

### Always do

- Use shared primitives from `@/shared/ui`.
- Preserve `rounded-xxl` for the main page container language.
- Keep page header separate from main content block.
- Keep section spacing and table spacing visually stable across tabs.

### Do not do

- Mix manual table markup with `DataTable` patterns in similar admin pages.
- Use a different tab navigation structure on one admin page without a product reason.
- Invent new stat card spacing or typography if the page can follow the shared admin stats pattern.

## 9. Typography

Use typography as hierarchy, not as decoration.

### Rules

- Page title uses `text-label-md text-foreground-primary`.
- Section title inside cards, table wrappers, or content blocks should prefer `text-label-md`.
- Supporting text and helper text should use `text-body-sm` or `text-body-xs` depending on density.
- Stat labels should use `text-label-md text-foreground-secondary`.
- Primary numeric values in admin stat cards should use `text-display-xxs`.
- Secondary or muted information should use `text-foreground-secondary` or `text-foreground-tertiary`.

### Avoid

- Jumping to `text-heading-md` for numbers or labels unless there is a clear visual reason.
- Mixing too many text sizes inside one section.
- Using muted text color for primary information.

## 10. Buttons And Actions

Buttons should reflect action importance and page context.

### Rules

- Primary actions should be limited and easy to identify.
- Tab-specific actions belong in the tab header row, not in the global page header.
- Destructive actions should use confirmation before execution.
- Use small buttons such as `size="sm"` when placed inside dense admin toolbars or tab rows.
- Keep action labels explicit and task-oriented.

### Recommended examples

- `Add Leave Manually`
- `Approve Request`
- `Reject Request`
- `Load more`

### Note

- The current `StakeholderLeavePage.tsx` button copy is `Added Manually`.
- For future pages, prefer verb-first labels such as `Add Leave Manually`.

### Avoid

- Vague labels such as `Submit` when the action can be more specific.
- Multiple primary buttons in the same local action group.
- Placing row-level actions in a global toolbar.

## 11. Form Layout

Forms should follow the same visual rhythm as the admin page.

### Rules

- Use `space-y-4` inside dialogs or forms unless a denser layout is intentionally required.
- Use `mt-2` between a label and its input control.
- For paired fields, use `grid grid-cols-1 gap-3 sm:grid-cols-2`.
- Keep related controls grouped in the same row only when they are semantically paired.
- Use clear labels for every input.
- Placeholder text should support the input, not replace the label.

### Preferred patterns

```tsx
<div>
  <Label htmlFor="field-id">Field Label</Label>
  <TextInput id="field-id" className="mt-2" />
</div>
```

```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
  <div>...</div>
  <div>...</div>
</div>
```

### Avoid

- Mixing unrelated controls in the same row.
- Large vertical gaps between label and control.
- Inconsistent field widths within the same form block.

## 12. States

Every admin page should account for non-happy-path states.

### Empty State

- Use `EmptyState` from `@/shared/ui` when a list or table has no data.
- Empty states should explain what is missing and what happens next.
- Use concise icon + title + description structure.

Preferred pattern:

```tsx
<EmptyState
  icon={<RiInboxLine className="size-5" />}
  title="No records found"
  description="Records will appear here after data is created."
  placement="inner"
/>
```

### Loading State

- Use shared loading patterns such as `Skeleton`, spinner, or existing page loading UI.
- Preserve layout shape while loading to avoid content jump.
- For tabs, do not collapse the entire container while waiting for content.

### Error State

- Show actionable and specific error messages.
- Prefer inline feedback for local actions and toast feedback for async mutations.
- Confirm destructive or irreversible actions before they run.

### Avoid

- Blank sections with no explanation.
- Generic error text when a better explanation is available.
- Loading states that change spacing or card dimensions drastically.

## 13. Responsive Rules

Responsive behavior should preserve the same information architecture across screen sizes.

### Rules

- Mobile uses `Select` for tab switching when tab navigation would become cramped.
- Desktop uses `TabNavigation`.
- Multi-column form rows collapse to one column on small screens.
- Stats grids may reduce columns on smaller breakpoints, but spacing rhythm should stay consistent.
- Header, tabs, and content spacing should remain stable across breakpoints.
- Actions should wrap or move below the navigation row only when necessary.

### Avoid

- Using a completely different content order between mobile and desktop without a product reason.
- Compressing tables into unreadable layouts.
- Removing section spacing on smaller screens.

## 14. Naming Rules

Naming should be direct and consistent.

### Rules

- Page titles should describe the page purpose, not the implementation.
- Table titles should describe the dataset.
- Table descriptions should explain what the user can do or review there.
- Tab labels should be short, scannable, and noun-focused.
- Metric labels should be short and stable across pages.

### Examples

- Page title: `Leave & Attendance Center`
- Table title: `Leave Approvals`
- Table description: `Review and approve employee leave requests`
- Tab label: `Attendance History`

## 15. Exceptions And Deviation Rules

This guideline is the default, not a hard ban on all variation.

### A deviation is acceptable when

- The surrounding UI already provides the necessary wrapper or border.
- A grouped or nested pattern needs lighter table chrome.
- The page solves a different product problem that cannot fit the standard cleanly.

### If deviating

- Keep spacing tokens and typography as close as possible to the standard.
- Prefer shared components over custom markup.
- Document the reason if the variation is likely to be reused.

## 16. Dialog Pattern

Dialogs should follow a consistent structure across create, edit, confirm, and review flows.

### Rules

- Use shared dialog primitives from `@/shared/ui`.
- Keep dialog structure consistent: `Dialog` -> `DialogContent` -> `DialogHeader` -> `DialogBody` -> `DialogFooter`.
- Dialog footer action order is always secondary action on the left and primary action on the right.
- For dismissive actions, use `Cancel` on the left.
- Keep form rhythm inside dialogs consistent with the page form rules.

### Width standard

- Use `sm:max-w-md` for short confirmations and simple actions.
- Use `sm:max-w-lg` for standard create or edit forms.
- Use `sm:max-w-xl` or larger only when the form genuinely needs extra width.

### Form spacing inside dialog

- Use `DialogBody` with `space-y-4` as the default.
- Use `mt-2` between label and input.
- Use `grid grid-cols-1 gap-3 sm:grid-cols-2` for paired fields.
- Do not over-compress forms to fit more fields horizontally.

### Footer pattern

```tsx
<DialogFooter>
  <DialogClose asChild>
    <Button variant="ghost">Cancel</Button>
  </DialogClose>
  <Button>Save Changes</Button>
</DialogFooter>
```

### Avoid

- Reversing footer button order.
- Mixing tertiary and destructive actions in the primary slot without clear intent.
- Using oversized dialog widths for short confirmation content.

## 17. Badge And Status Mapping

Badges should communicate status consistently across pages.

### Rules

- Use the same variant for the same status meaning across modules.
- Prefer semantic status labels over page-specific wording when possible.
- If a new status is introduced, map it to the nearest existing semantic meaning before creating a new style.

### Standard mapping

| Status | Variant |
| --- | --- |
| Active | `success` |
| Completed | `info` |
| Archived | `zinc` |
| Draft | `zinc` |
| Sent | `blue` |
| Paid | `success` |
| Overdue | `error` |
| Partial | `warning` |

### Usage note

- When the same word has different business meaning in different modules, the visual treatment should still follow the semantic outcome.
- Example: a positive finished state should remain visually positive even if the domain label differs.

## 18. Card List Item Pattern

Use card list items for structured records that are richer than a simple table row but lighter than a full detail page.

### Rules

- Each item should be visually grouped inside a `Card` or card-like bordered container.
- Internal spacing should default to `p-4` or equivalent card padding from the shared component.
- Use a three-part layout when actions are present: leading visual on the left, content in the middle, actions on the right.
- Content block should stack title and supporting text cleanly with small vertical spacing.
- Actions should align to the top-right on desktop and remain easy to tap on mobile.

### Preferred layout

```tsx
<Card>
  <div className="flex items-start gap-3">
    <div className="shrink-0">{icon}</div>
    <div className="min-w-0 flex-1 space-y-1">
      <p className="text-label-md text-foreground-primary">Item Title</p>
      <p className="text-body-sm text-foreground-secondary">
        Supporting information
      </p>
    </div>
    <div className="flex items-center gap-2">{actions}</div>
  </div>
</Card>
```

### Action pattern

- For lightweight row actions, prefer icon-only or compact tertiary actions.
- Small icon actions should use the shared small button size when available.
- Avoid large primary buttons inside dense card lists unless the action is the core purpose of the card.

### Avoid

- Uneven padding between similar list cards.
- Pushing actions below the card content on desktop without layout pressure.
- Mixing table-row behavior and card-list behavior in the same list without a clear product reason.

## 19. Back Navigation Pattern

Use a back action when the page is a child detail view of a broader list or parent workflow.

### Rules

- Show a back button on detail pages, drill-down pages, and nested resource pages.
- Do not show a back button on top-level index pages or primary landing pages.
- Place the back action above the main tab/content container and below the page header when both are present.
- Keep the back action visually secondary.
- Back labels should describe the parent destination, not just the action.

### Preferred examples

- `Back to Projects`
- `Back to Invoices`
- `Back to Employees`

### Preferred pattern

```tsx
<div className="flex flex-col gap-4">
  <Button variant="ghost" size="sm" className="w-fit">
    Back to Projects
  </Button>

  <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
    ...
  </div>
</div>
```

### Avoid

- Using a back button on pages that are already top-level navigation destinations.
- Placing the back action in the tab row when it changes page-level navigation.
- Using generic labels such as `Back` when the parent destination is known.

## 20. Sub-tab Pattern

Sub-tabs are allowed when a page or tab contains multiple closely related content groups that still belong to one parent context.

### Rules

- Use route-based tabs when the selected tab should be linkable, restorable on refresh, or shareable by URL.
- Use local `useState` tabs when the tab only controls local presentation inside a stable parent page and does not need deep linking.
- Keep the primary page tab and sub-tab hierarchy visually clear.
- Do not introduce sub-tabs if a simple section layout is sufficient.

### When to use `useTabRoute`

- The tab is part of page-level navigation.
- The active tab should persist in the URL.
- Users may bookmark or share the exact tab state.
- Server data loading depends on the tab.

### When to use `useState`

- The tab is local to one page section or one parent tab.
- The selected state is only a UI convenience.
- The content can be mounted and switched without route changes.
- The tab does not need direct linking.

### Guidance

- Prefer one primary tab layer at page level.
- Add sub-tabs only when the content groups are tightly related and switching between them is frequent.
- If a sub-tab starts to behave like a real navigation destination, promote it to route-based navigation.

### Avoid

- Mixing route-driven and local tab state for the same hierarchy level.
- Using sub-tabs where a filter, segmented control, or section heading would be simpler.
- Hiding materially different workflows behind local sub-tabs without a clear navigation cue.

## Gap Found in Other Pages

| Page | Issue |
| --- | --- |
| ProjectsListPage | Stats cards use `px-4 py-3` and `text-heading-md`; should align to the shared stats pattern with `text-display-xxs` and `gap-6`. |
| ProjectsListPage | Table uses manual `Table`; should use `DataTable`. |
| FinancePage | Stats cards follow the same inconsistent pattern as `ProjectsListPage`. |
| ProjectDetailPage | Info card uses `space-y-5` inside `Card` with inconsistent internal padding. |
| ProjectsListPage | Stats grid uses `gap-lg xl:grid-cols-5`; should align to `gap-6`. |

## Implementation Note

- If an existing page visually follows Leave & Attendance Admin but still differs in details, use this document as the normalization target for future refactors.
- When in doubt, follow the shared component pattern over one-off inline layout.
