# App components

The app's own building blocks that the other docs don't cover: cards on
the dashboard, avatars, brand pieces, document blocks, editors, file
views, small controls and charts. Primitives (`src/components/ui`) live
in their own docs (button, badge, form, overlay, navigation, table…).
Live examples: **/ui** → Components.

## Use

**Cards and blocks**

| Component                                             | For                                                                           | File                                                | Props                                                           | Not for                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `HomeCard`                                            | A block on a dashboard / overview (title inside the card)                     | `src/app/(main)/dashboard/components/home-card.tsx` | `title badge actions className data-*`                          | Page sections without a card (`SectionTitle`) |
| `HomeRow`                                             | A row in a `HomeCard` (leading, title/subtitle, trailing)                     | same                                                | `href onClick leading title subtitle trailing className data-*` | Page lists (`GroupedList` + `ListRow`)        |
| `HomeFigure`                                          | One big number in a card ("8 / 11 jam")                                       | same                                                | `value unit hint roll`                                          | Several numbers (`HomeStats`)                 |
| `HomeStats`                                           | 2–4 label-over-value columns in a card                                        | same                                                | `items: {label value tone}[]`                                   | A page's headline band (`StatStrip`)          |
| `HomeFooter`, `HomeIconLink`, `HomeEmpty`             | Card footer link line · header icon link · empty text                         | same                                                | `label value href linkLabel` · `href label` · text              |                                               |
| `HomeColumn`, `HomeGrid`, `HomeActions`, `HomeAction` | Dashboard column · two cards side by side · quick-action pills                | same                                                | `children` · `aside` · `href onClick icon primary desktopOnly`  | Other pages                                   |
| `Panel` (+ `PanelEmpty`, `PanelList`)                 | A bordered block with a header bar (title, count, action)                     | `src/components/panel.tsx`                          | `title meta action bodyClassName`                               | Dashboard cards (`HomeCard`)                  |
| `BoardCard`                                           | A card on a board (kanban): meta, title, people; no grip icon, hover lifts it | `src/components/board-card.tsx`                     | `draggable lifted`                                              | Projects kanban, task board                   |
| `surfaceClassName`                                    | The card surface (`bg-card border rounded-card`) for anything card-like       | same                                                | class                                                           | Copying the classes by hand                   |

**People and projects**

| Component                                   | For                                                                  | File                                      | Props                                                        | Not for                        |
| ------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ | ------------------------------ |
| `Avatar` + `AvatarImage` + `AvatarFallback` | A person (photo, else initials; the fallback shows the first letter) | `src/components/ui/avatar.tsx`            | `size: xs (20) · sm (24) · md (28) · default (32) · lg (40)` | Projects (`ProjectAvatar`)     |
| `initials(name, fallback?)`                 | The letters for a person's avatar                                    | `src/shared/lib/initials.ts`              | name, fallback (`?`)                                         | Inline `.slice(0, 2)`          |
| `AvatarGroup` + `AvatarOverflow`            | A few people overlapping, then "+N"                                  | `src/components/avatar-group.tsx`         | `children` · `count size`                                    | More than ~4 shown             |
| `PersonCell`                                | First cell of a person row: avatar 28px, name, secondary             | `src/page-slices/performance/ui/list.tsx` | `name avatarUrl secondary children`                          | Outside lists                  |
| `ProjectAvatar`                             | A project's (or client's) letter tile in its stable color            | `src/components/project-avatar.tsx`       | `id name className` (`size-5` default)                       | People; brand logos            |
| `projectColor(id)`, `projectColorVar(id)`   | The project's color as class / CSS var (timeline bars)               | same                                      | `id`                                                         | Hand-picked colors per project |

**Brand and app chrome**

| Component           | For                                                       | File                                              | Props                                                                      | Not for                                  |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| `AppIcon`           | The app icon (tile) or mark (transparent, light/dark)     | `src/components/app-icon.tsx`                     | `variant: tile \| mark`, `size: 96 \| 192 \| 512 \| 1024` (≈4× shown size) | Project/client logos                     |
| `BrandBackdrop`     | The animated pink field behind minimal screens (fixed)    | `src/components/brand-backdrop.tsx`               | none                                                                       | Inside the app; behind scrolling content |
| `GradientASCII`     | The canvas it draws (React Bits, ours: `still`)           | `src/components/gradient-ascii/GradientASCII.jsx` | many; see `BrandBackdrop`                                                  | Direct use — go through `BrandBackdrop`  |
| `ThemeSwitcher`     | Light / dark / system pill (sidebar, phone menu, portal)  | `src/components/theme-switcher.tsx`               | `className`                                                                | Minimal screens (`ThemeToggleButton`)    |
| `ThemeToggleButton` | One icon button that flips light/dark                     | `src/components/theme-toggle-button.tsx`          | `className`                                                                | Inside the app                           |
| `AppearancePopover` | Theme + chrome tint picker (hue pad, swatches, intensity) | `src/components/appearance-popover.tsx`           | `className`                                                                | Anything but the sidebar / portal footer |
| `LanguageSwitcher`  | ID / EN pill                                              | `src/components/language-switcher.tsx`            | `className`                                                                |                                          |

**Documents and content**

| Component                      | For                                                                                                    | File                                              | Props                                                                     | Not for                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| `Markdown`                     | Reading stored Markdown (reports, rules, comments) with tables, callouts, toggles, galleries, mentions | `src/components/markdown.tsx`                     | `children: string`, `images`, `className`                                 | Editing (`MarkdownDocEditor`)              |
| `MarkdownDocEditor` (lazy)     | The Tiptap document editor (reports, notes, rules, tasks)                                              | `src/page-slices/policies/ui/doc-editor-lazy.tsx` | see `doc-editor.tsx`                                                      | Short text (`Textarea` / `RichTextField`)  |
| `RichTextField`                | A plain-text field that reads as text and edits as a textarea, with bullet / numbered lists            | `src/components/rich-text-field.tsx`              | `value onChange onBlur placeholder readOnly`                              | Documents (editor)                         |
| `InlineText`                   | Click-to-edit a single line (a title)                                                                  | `src/components/inline-text.tsx`                  | `value onSave required placeholder`                                       | Forms                                      |
| `EmojiPicker`                  | Pick an emoji (a wiki page's icon): search, groups, Acak, Hapus; data loads on open                     | `src/components/emoji-picker.tsx`                 | `trigger onPick onRemove align`                                           | Plain icons (`components/icons`)           |
| `CalloutBox` (`CALLOUT_STYLE`) | A tinted note box in documents (info / success / warning / danger)                                     | `src/components/callout-box.tsx`                  | `tone icon children`                                                      | App messages (feedback.md: alerts, toasts) |
| `EmbedBlock`                   | A link as a card or a live preview (YouTube, Figma…)                                                   | `src/components/embed-block.tsx`                  | `url title view: card \| preview-small \| preview-wide`, `editing footer` | Plain links                                |
| `GalleryStrip`                 | Several pictures in one sideways row, each its own shape                                               | `src/components/gallery-strip.tsx`                | `images: {src alt w h}[]`, `editing` + edit callbacks                     | One picture (`ZoomableImage`)              |
| `EmptyValue` / `orEmpty(v)`    | The dashed "no data" mark for a missing value                                                          | `src/components/empty-value.tsx`                  | `className` · value                                                       | Empty lists (`EmptyState`)                 |

**Files**

| Component                                                   | For                                                                     | File                                                    | Props                                       | Not for                          |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------- | -------------------------------- |
| `FileViewer` (lazy)                                         | A private file full size (see overlay.md)                               | `src/components/file-viewer.tsx`                        | `items index onIndexChange onClose actions` |                                  |
| `PdfPages`, `PdfThumbnail`                                  | A PDF's pages / first page (pdf.js, loaded on use)                      | `src/components/pdf-view.tsx`                           | `url maxPages onError`                      |                                  |
| `DocxPages`, `SheetView`, `DocxThumbnail`, `SheetThumbnail` | Word and spreadsheet files drawn in the browser                         | `src/components/office-view.tsx`                        | `url onError`                               | .doc, PowerPoint (download)      |
| `Zoomable`, `ZoomPill`, `ZoomableImage` (zoomable)          | Pinch-zoom area for a viewer; −/%/+ pill; an image that fits then zooms | `src/components/zoomable.tsx`                           | `children(zoom, view) min max overlay`      | Pictures in documents (lightbox) |
| `ZoomOnClickImage`, `LightboxScope` (image-lightbox)        | A picture in a document that opens in its lightbox on a click           | `src/components/image-lightbox.tsx`                     | `src alt className`                         | File viewers (`ZoomableImage`)   |
| `FileDropCanvas`                                            | Drop / pick a file into a dialog with a preview pane                    | `src/components/file-drop-canvas.tsx`                   | see file                                    |                                  |
| `FilePreview`                                               | A library file's thumbnail on a card                                    | `src/page-slices/projects/ui/workspace/FilePreview.tsx` | `file badge emptyLabel url`                 |                                  |

**Small controls and figures**

| Component       | For                                                         | File                                | Props                                                      | Not for                               |
| --------------- | ----------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| `RollingValue`  | A number that rolls when it changes (period switch)         | `src/components/rolling-value.tsx`  | `value children`                                           | Values that tick every second (clock) |
| `FillSlider`    | iOS-style pill slider, label inside, value right            | `src/components/fill-slider.tsx`    | `label value onChange min max step format radiusClassName` | Form ranges with marks (`Slider`)     |
| `QuarterFilter` | Year select + Q1–Q4 / full year                             | `src/components/quarter-filter.tsx` | `value: "2026-Q4" onChange showYear years hideAll`         | Date ranges (`DatePicker`)            |
| `TimeSelect`    | A time of day in 15-min steps (form.md has the field rules) | `src/components/time-select.tsx`    | `value: "13:30" onValueChange step placeholder disabled`   | Durations                             |

**Charts**

| Use                                              | For                                                     | File                                                              |
| ------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------- |
| CSS bars: `bar-grow` / `bar-grow-y` with `--bar` | Simple bars and meters (week hours, KPI, leave balance) | `src/app/globals.css`, e.g. `dashboard/components/week-hours.tsx` |
| `ChartContainer` + recharts                      | Area / line charts with axes and tooltips               | `src/components/ui/chart.tsx`, `finance/ui/OverviewTab.tsx`       |
| `Donut`                                          | A ring with the value in the middle                     | `src/page-slices/finance/ui/parts.tsx`                            |

Colors come from `--chart-1…5` and the semantic tokens (see color.md).

## Rules

- Reuse these; don't rebuild a card, avatar, project tile, number roll or
  callout in a page. A missing variant goes into the component (and here).
- Card surface = `surfaceClassName` (`bg-card border-field-border
dark:border-border rounded-card border`). `HomeCard` is `surfaceClassName`
  plus `p-surface gap-4` and a 15px title; `Panel` a 44px header bar with a
  border.
- Avatars: `Avatar size` (`xs` 20px, `sm` 24px, `md` 28px, default 32px,
  `lg` 40px), not a `size-*` className; in a person row `PersonCell`
  (`md`). Letters = `initials(name)`: first letter of the first two words,
  or two letters of a one-word name, uppercase (`AvatarFallback` shows the
  first one). Projects and clients are always `ProjectAvatar` (square,
  `rounded-tile`, white letter), never a round avatar.
- Numbers that change with a filter roll (`RollingValue`, built into
  `StatStrip`, `HomeFigure`, `HomeStats`); a missing value is
  `orEmpty(value)`, never "-" or "0".
- Documents: stored as Markdown; read with `Markdown` (`images` when the
  source may hold pictures), edit with the lazy `MarkdownDocEditor`.
  Callouts, toggles, galleries and embeds follow `shared/lib/doc-blocks.ts`
  and `shared/lib/embeds.ts`, so editor and reader look the same.
- Heavy pieces load on use: the editor (`doc-editor-lazy`), pdf.js,
  docx-preview and xlsx (dynamic `import()` inside `pdf-view` /
  `office-view`), recharts (only in lazy tabs: Finance → Overview). Import
  `FileViewer` and dialogs with `next/dynamic`.
- Charts: CSS bars first (no library); recharts only for axes/area/pie,
  and only in a chunk that isn't on the first screen. Animations off for
  pies (`isAnimationActive={false}`).
- Theme and language controls are only the shared ones above; theme
  changes go through `useThemeTransition`.

## Don't

- `bg-card border rounded-xl p-5` copied into a page; `HomeCard` or
  `surfaceClassName`.
- `name.slice(0, 2).toUpperCase()` or a local initials helper; `Avatar` +
  `initials()` from `shared/lib/initials`. `Avatar className="size-7"`;
  `size="md"`.
- A colored letter tile for a project/client made by hand.
- `<span>{value ?? "-"}</span>` for a missing number.
- Importing `doc-editor.tsx`, `recharts` or `pdfjs-dist` directly into a
  page that shows on load.
- `BrandBackdrop` inside the app or behind scrolling content (it is a
  fixed canvas; the frosted card over it is the only blur).

## Good examples

- Dashboard cards: `src/app/(main)/dashboard/components/AdminDashboard.tsx`
- People in rows: `src/page-slices/performance/ui/review/ReviewMonitoring.tsx`
- Markdown with pictures: `src/app/(fullscreen)/r/[token]/page.tsx` (client report)
- Lazy chart tab: `src/page-slices/finance/ui/FinancePage.tsx` → `OverviewTab.tsx`

## Example

```tsx
<HomeGrid>
  <HomeCard
    title="Kehadiran"
    actions={
      <HomeIconLink href="/attendance" label="Buka">
        …
      </HomeIconLink>
    }
  >
    <HomeFigure value="8 / 11" unit="jam" hint="Minggu ini" />
    <HomeFooter label="Sisa cuti" value="9 hari" href="/leave" />
  </HomeCard>
  <HomeCard title="Project aktif">
    {projects.map((p) => (
      <HomeRow
        key={p.id}
        href={projectHref(p)}
        leading={
          <ProjectAvatar id={p.id} name={p.name} className="size-7 text-xs" />
        }
        title={p.name}
        subtitle={p.client}
        trailing={orEmpty(p.due)}
      />
    ))}
  </HomeCard>
</HomeGrid>
```

## Migration notes

Done 2026-11-05 (local): one `initials()` (`src/shared/lib/initials.ts`,
tested) replaces the 5 local helpers (ProjectList, ProjectKanban,
task-utils — now a re-export —, ApprovalInbox, nav-user), MenubarPopover's,
UserCard's, UserProfile's, teams `Columns`' and the inline
`.slice(0, 2).toUpperCase()` calls (15 files). `Avatar` got `xs` (20) and
`md` (28); plain `className="size-5 | size-7 | size-8 | size-10"` on
`Avatar` became `size="xs" | "md" | default | "lg"` (21 places).
`HomeCard` and `MyKpiView`'s `CARD` build on `surfaceClassName`.
Finance's `NameTile` deleted; client / subscription tiles are
`ProjectAvatar id={name}` (colors now from the project palette).
image-lightbox's `ZoomableImage` renamed `ZoomOnClickImage` (zoomable.tsx
keeps `ZoomableImage`). `TimeSelect`'s unused `size` prop removed. Deleted
(no imports): `charts/category-bar.tsx` (its color fix was recent, still
unused), `charts/radar-chart.tsx`, `always-dark.tsx`, `ui/drawer.tsx`,
`ui/hover-card.tsx`, `ui/navigation-menu.tsx`, `PanelLink`, `AvatarBadge`.

Done (table pass): `PanelRow` replaced by `PanelList` (a `GroupedList`
bled into the panel body; Santuy, project dashboard / portal panels);
`HomeRow` on the table row heights (`min-h-12`, `min-h-14` with a
subtitle, `py-2`) with `HomeCard`'s sliding highlight instead of a
per-row hover, plus `onClick` for button rows. Left: `size-6` avatars (their `text-[10px]` fallback would turn
`text-xs` under `size="sm"`), responsive / `cn(...)` sizes, `size-4`,
`size-20`; `avatarSizeClasses` in avatar-group; `fileKind()` (thumbnail:
`csv` and `doc` tiles, image by mime only) vs `previewKind()` (viewer:
`audio`, image by extension, PSD excluded) answer different questions, so
they were not merged; ThemeSwitcher / LanguageSwitcher pill, `title=`
labels, QuarterFilter defaults, GradientASCII typing, OverviewTab callout.
The older list below is kept for reference.

Unused (dead code; delete, or document before first use):

- `src/components/charts/category-bar.tsx`, `src/components/charts/radar-chart.tsx` — no imports.
- `src/components/always-dark.tsx` — no imports.
- `src/components/ui/avatar.tsx:65` `AvatarBadge` — no users.
- `src/components/ui/drawer.tsx`, `hover-card.tsx`, `navigation-menu.tsx` — no imports (overlay.md / navigation.md).

Duplicates and drift:

- `src/app/(main)/dashboard/components/home-card.tsx` `HomeCard` writes the card surface inline (`bg-card border-field-border dark:border-border rounded-xl border`) → `surfaceClassName`.
- Initials: 5 local helpers (`projects/ui/ProjectList.tsx:85`, `ProjectKanban.tsx:39`, `projects/ui/workspace/task-utils.ts:23`, `leave/ui/components/ApprovalInbox.tsx:78`, `components/nav-user.tsx:37`) plus 16 inline `.slice(0, 2).toUpperCase()` (e.g. `ProjectsListPage.tsx:522`, `ProjectForm.tsx:520`, `ProjectSettings.tsx:389`, `ProjectReports.tsx:163`, `attendance/components/AdminAttendanceHistoryList.tsx:379`) → one `initials()` in `src/shared/lib`, or a `PersonAvatar name src size` component.
- Avatar sizes are set with `className` (`size-5` ×9, `size-6` ×8, `size-7` ×8, `size-8` ×5, `size-4`, `size-10`, `size-20`) instead of `size` (used once) → add `xs` (20) and `md` (28) to `Avatar`'s `size` and use the prop.
- `avatarSizeClasses` in `src/components/avatar-group.tsx:11` is marked "Legacy" and only used by `AvatarOverflow` → fold into `Avatar` sizes.
- `src/page-slices/finance/ui/parts.tsx:57` `NameTile` (letter tile colored from a name) duplicates `ProjectAvatar` → use `ProjectAvatar` (or a shared `LetterTile`).
- `src/components/image-lightbox.tsx` and `src/components/zoomable.tsx` both export `ZoomableImage` (different components) → rename one.
- `ThemeSwitcher` and `LanguageSwitcher` repeat the same radiogroup pill (`fill-ink … SlidingIndicator`) that `SegmentedControl` provides → one pill (`SegmentedControl size="icon"`).
- `ThemeSwitcher`, `ThemeToggleButton`, `AppearancePopover`, `HomeIconLink` label with `title=` → `Tooltip` (overlay.md).
- `src/components/quarter-filter.tsx:48-51` defaults `value="2025-Q1"` and `years=[2025, 2026, 2027]` → derive from today (current quarter, a range around this year).
- `src/components/time-select.tsx:52` declares a `size` prop "for API compatibility" that nothing passes and nothing reads → remove it.
- `src/components/gradient-ascii/GradientASCII.jsx` is the only `.jsx` in `src` (858 lines, untyped: TS infers `dpr` and `style` as required, so `BrandBackdrop` passes `style={{}}`) → `.tsx` with typed props, or keep vendored but note it.
- `src/components/charts/*` keep their own `colorMap` with legacy names (`indigo`, `emerald`, `blue`…) → if kept, chart tokens only.
- `src/page-slices/finance/ui/OverviewTab.tsx:174` warning note (`bg-warning-subtle text-amber-11 rounded-lg px-4 py-2.5`) is a hand-made callout → the shared alert (feedback.md) or `CalloutBox tone="warning"`.
- `src/components/table-section.tsx` is used only by DataTable (layout.md).

## Document blocks (wiki additions)

- Callout tones: `neutral` (outline only, `> [!NEUTRAL]`, Notion's default
  callout), `info`, `success`, `warning`, `danger` (`shared/lib/doc-blocks`).
- Columns (`policies/ui/columns.tsx`): `<div data-columns>` / `<div
  data-column>` around Markdown; equal widths, stacked on phones. Every
  editor reads them; only the wiki offers "/2 kolom" and "/3 kolom"
  (`MarkdownDocEditor columns`).
- `MarkdownDocEditor toolbar={false}`: no formatting bar (the wiki, as
  Notion); the selection menu and "/" do the same.
