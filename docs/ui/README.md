# UI rules

How every screen in Kretya is built. Read the file for a component **before**
adding or changing UI that uses it. Each rule here was reviewed on the live
page **/ui** (one tab per file, mock data), so the doc and the page change
together.

## Goals

1. **Consistent**: one way to build each thing. Reuse the shared component;
   don't restyle it locally with one-off classes.
2. **Light**: cheap to render and to ship. No per-item motion in long lists,
   no blur on scrolling content, heavy dialogs and editors load lazily.
3. **Central**: sizes, colors, radii, spacing and motion live in tokens and
   shared constants, not copied into pages. If a page needs a variant, add it
   to the shared component (and its doc), then use it.

## Files

| Doc                  | Covers                                                                     | Status  |
| -------------------- | -------------------------------------------------------------------------- | ------- |
| [table.md](table.md) | Lists and tables: rows, headers, groups, hover, DataTable, Markdown tables | Done    |
| typography.md        | Type scale, weights, text colors                                           | Next    |
| color.md             | Color system and tokens, light/dark                                        | Planned |
| radius.md            | Corner radii, nested radii                                                 | Planned |
| spacing.md           | Gutter, gaps, section spacing                                              | Planned |
| motion.md            | Easing, durations, when to animate                                         | Planned |
| button.md            | Variants, sizes, icon buttons                                              | Planned |
| badge.md             | Status badges, chips                                                       | Planned |
| form.md              | Fields, labels, errors, save                                               | Planned |
| dialog-sheet.md      | Dialogs, sheets, confirm                                                   | Planned |
| page-layout.md       | Page header, gutter, scroll panes                                          | Planned |

## Working on UI

- Find the doc above; follow its **Use**, **Rules** and **Don't** sections.
- Copy from the "Good examples" it names rather than from older pages.
- Something the doc doesn't cover: ask, or pick the closest rule and say so.
  When the user settles a new rule, add it to the doc and to its /ui tab.
