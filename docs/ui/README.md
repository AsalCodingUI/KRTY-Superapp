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

Foundations (smallest first), then components. Each file ends with
**Migration notes**: places that don't follow it yet, to fix later.

| Doc                            | Covers                                                                     |
| ------------------------------ | -------------------------------------------------------------------------- |
| [typography.md](typography.md) | Fonts, the type scale by role, weights, text colors, numbers               |
| [color.md](color.md)           | Color tokens, light/dark, status colors, borders, focus, project colors    |
| [radius.md](radius.md)         | Radius scale, squircles, nested radii, per component                       |
| [spacing.md](spacing.md)       | 4px grid, page gutter and bleed, paddings, gaps                            |
| [elevation.md](elevation.md)   | Shadows, borders vs tints, glass/blur, z-index ladder                      |
| [motion.md](motion.md)         | One ease, three durations, what to animate, reduced motion                 |
| [icons.md](icons.md)           | Icon source, sizes, meanings, icon-only buttons                            |
| [button.md](button.md)         | Variants, sizes, states, placement, custom buttons                         |
| [badge.md](badge.md)           | Badge vs chip, status per domain, counts, unread dots                      |
| [form.md](form.md)             | Fields, labels, errors, dates, money, dialog forms                         |
| [table.md](table.md)           | Lists and tables: rows, headers, groups, hover, DataTable, Markdown tables |
| [navigation.md](navigation.md) | Tabs, segmented, view toggle, URL state, breadcrumbs, paging               |
| [overlay.md](overlay.md)       | Dialogs, sheets, popovers, menus, tooltips, confirm                        |
| [feedback.md](feedback.md)     | Toasts, empty states, loading, confirm, unread, sound                      |
| [layout.md](layout.md)         | Page anatomy, PageHeader, scroll panes, minimal screens, Mac/Windows shell |
| [components.md](components.md) | The app's custom components (cards, avatars, editors, charts…)             |

Breakpoints: phone layouts (no sidebar, bottom tab bar) are below 768px
(`md`); dialogs turn into bottom sheets below 640px (`sm`).

## Working on UI

- Find the doc above; follow its **Use**, **Rules** and **Don't** sections.
- Copy from the "Good examples" it names rather than from older pages.
- Something the doc doesn't cover: ask, or pick the closest rule and say so.
  When the user settles a new rule, add it to the doc and to its /ui tab.
