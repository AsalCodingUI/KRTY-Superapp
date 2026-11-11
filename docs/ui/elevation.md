# Elevation

Shadows, borders and tints; glass (backdrop blur); overlays; and the
z-index ladder. Live examples: **/ui** → Elevation.

## Use

| Need                                 | Use                                                              | File                                                                    |
| ------------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Any shadow                           | `shadow-(--elev-1)` … `shadow-(--elev-5)`                        | tokens in `src/app/globals.css`                                         |
| A shadow on the tinted chrome        | the shadow plus `blend-shadow` (fill-only layers: `blend-light`) | `globals.css`                                                           |
| A resting card                       | `surfaceClassName` (border, no shadow)                           | `src/components/panel.tsx`                                              |
| A frosted card on the brand backdrop | `glassSurfaceClass` + `<GlassLayer />`                           | `src/components/minimal-screen.tsx`                                     |
| A see-through control on glass       | `glassControlClass`                                              | same                                                                    |
| Dim behind a dialog                  | built in: `bg-backdrop` (`--backdrop`)                           | `ui/dialog.tsx`, `ui/sheet.tsx`, `ui/drawer.tsx`, `ui/alert-dialog.tsx` |

## Shadow tokens

Each `--elev-N` is a 1px hairline ring, a small contact shadow and a wide
ambient shadow with negative spread (it falls down, not out). The ink
leans to the theme hue (`--elev-ink`). Dark mode: a white 6–7% hairline
carries the edge and the shadow is a soft wide falloff.

| Token      | Level                                    | Used by                                                                                                                                             |
| ---------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--elev-1` | Control                                  | Switch / slider thumb, tabs thumb (`dark:shadow-none`), small floating pills (`ScreenControls`)                                                     |
| `--elev-2` | Resting card / active item on the chrome | Active app tab, the page sheet on the chrome (`page-sheet.tsx`), theme / language switcher thumb, glass card, event & leave cards, floating sidebar |
| `--elev-3` | Sheet / paper                            | Invoice / PDF / docx paper, file thumbnails in viewers                                                                                              |
| `--elev-4` | Popover / menu                           | Dropdown, select, popover, hover card, toast, context menu, editor toolbars, drag previews                                                          |
| `--elev-5` | Dialog                                   | Dialog, alert dialog, right sheet, drawer, side panel, file viewer                                                                                  |

`shadow-none` resets a component's shadow (36 uses, e.g. input groups,
line tabs). `/shadow-lab` (`src/app/(fullscreen)/shadow-lab`) is the
workbench where the tokens were tuned.

## Shadow, border or tint

- **Border** (`border-field-border dark:border-border`): things that rest
  on the page: cards (`surfaceClassName`, `HomeCard`, `Panel`), fields,
  outline buttons. No shadow.
- **Tint** (`bg-muted dark:bg-muted/40`, `bg-accent`, `--row-hover`):
  grouping or state inside a surface: list header / group pills, chips,
  hover and selected rows, segmented-control fill. No border, no shadow.
- **Shadow**: only for things that float above what's under them: the
  page sheet over the chrome, active thumbs, popovers, dialogs, dragged
  items. Pick the level by what it is (table above), not by taste.
- Never stack them: a floating surface gets its shadow (which has its own
  hairline) and no extra `border`.
- On the chrome (sidebar / top bar) shadows sit on their own layer with
  `blend-shadow` (darken in light, normal in dark), so they deepen the
  tint instead of laying grey on it. Fill layers of thumbs use
  `blend-light`; never blend an element that holds text.

## Glass

Used only on the minimal screens (sign in, brief, portal PIN, Mac
connect, 404) and the brief form: a frosted card over `BrandBackdrop`.

- `glassSurfaceClass` = `relative isolate overflow-hidden shadow-(--elev-2)`.
- `<GlassLayer />` inside it: an absolutely positioned
  `bg-background/80 backdrop-blur-2xl backdrop-saturate-150`, on its own
  GPU layer (`translateZ(0)`, `backface-visibility: hidden`) behind the
  content (`-z-10`, `rounded-[inherit]`). With the blur on the card itself,
  scrolling its content or a redraw of the backdrop re-ran the blur and
  the card blinked (Safari, Mac app).
- Controls on glass: `glassControlClass` (`bg-white/35`, `dark:bg-field`).
- The phone tab bar (`floating-tab-bar.tsx`) is the one glass surface in
  the app shell: fixed, small, `backdrop-blur-xl`.
- In the Mac app the chrome is see-through over the window's native
  vibrancy (`DESKTOP_CSS` in `src/app/(main)/layout.tsx`); that blur is the
  OS's, not CSS. The page stays solid.

**Light rule for blur.** `backdrop-filter` re-renders everything under it
every frame that changes. Use it only on small surfaces that are fixed (or
sticky) and over content that moves rarely, on their own layer. Never on
full-screen overlays, list rows, cards in scrolling content or large
sticky headers. If the fill is ≥ 90% opaque, drop the blur.

## Overlays

- Modal dialogs, alert dialogs, left/top/bottom sheets and drawers:
  `bg-backdrop` (light: tinted ink at 18%, the page stays readable; dark:
  black 55%), fade in.
- The right sheet floats like a card and keeps the page visible: its
  overlay is `bg-transparent` (still catches outside clicks).
- Image lightbox: `bg-black/85` (media needs a dark field).
- Avatar crop: a `0 0 0 999px` shadow mask around the crop circle.

## Z-index ladder

| z                             | Layer                                                                                                                       | Where                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `-z-10`, `z-0`, `z-1`, `z-10` | Inside a component's own stacking context: glass layer, badge on an avatar, sticky cells, select scroll arrows              | local                                                                            |
| `z-10`                        | Desktop sidebar (fixed)                                                                                                     | `ui/sidebar.tsx:295`                                                             |
| `z-20`                        | Page sheet (`md:z-20`) and its shadow layer; sidebar resize rail; `ScreenControls`; sticky calendar headers                 | `layout.tsx`, `minimal-screen.tsx`                                               |
| `z-30`                        | In-page floating bits (AI assist, brief field picker, timeline header)                                                      | `policies/ui/ai-assist.tsx`, `briefs/ui/BriefBuilder.tsx`                        |
| `z-40`                        | Top bar; editor floating toolbars; full-window drop zones                                                                   | `app-topbar.tsx`, `policies/ui/doc-editor.tsx`, `SelectionMenu.tsx`, `embed.tsx` |
| `z-50`                        | Every portaled layer: dialog / sheet / drawer (backdrop + popup), popover, menu, select, tooltip, hover card; phone tab bar | `components/ui/*`, `floating-tab-bar.tsx`                                        |
| `z-[60]`                      | Editor suggestion menus (above a dialog that holds the editor)                                                              | `mention.tsx`, `slash-command.tsx`                                               |
| `z-[70]`                      | Image lightbox                                                                                                              | `image-lightbox.tsx`                                                             |
| `z-[80]`                      | Right-click context menu                                                                                                    | `shared/context-menu/ContextMenuProvider.tsx`                                    |
| `9999`                        | Drag previews (document blocks, library files)                                                                              | `globals.css` `.doc-drag-preview`, `.lib-drag-preview`                           |
| sonner                        | Toasts (sonner's own `z-index: 999999999`)                                                                                  | `ui/sonner.tsx`                                                                  |

Within `z-50`, later portals paint on top (a menu opened from a dialog
sits above it). Portaled popups carry `isolate` so their insides can't
leak out of the layer.

## Role tokens (use these)

`shadow-control` (elev-1), `shadow-raised` (elev-2), `shadow-sheet`
(elev-3), `shadow-popover` (elev-4), `shadow-dialog` (elev-5), defined in
`src/app/globals.css` (`--shadow-*` → `--elev-N`) and registered in
`src/lib/utils.ts`. Floating controls over content are all
`shadow-raised`. Named layers above the portals: `z-editor-menu` (60),
`z-lightbox` (70), `z-context-menu` (80), `z-over-menu` (82), as
`--z-index-*` theme keys (an `@utility z-…` is not generated: it clashes
with the built-in `z-*`). The phone tab bar is `z-40`, under dialogs.
Live on /ui → Shadow.

## Rules

- Shadows only from `--elev-1..5`. No `shadow-sm/md/lg/2xl`, no arbitrary
  shadow values.
- The level is the element's role: control 1, card on chrome 2, paper 3,
  popover 4, dialog 5.
- Resting cards: border, no shadow. Grouping inside a surface: tint.
- Shadows on the chrome get `blend-shadow` on a separate layer.
- Blur only through `GlassLayer` or on small fixed surfaces (tab bar,
  floating controls); never on scrolling or full-screen elements.
- z-index from the ladder. A new layer gets a row here first.

## Don't

- `shadow-lg`, `shadow-2xl`, `shadow-[0_10px_30px…]`.
- A card with `border` **and** a shadow at rest.
- `backdrop-blur` on a sticky page header, a list row badge or a
  full-screen drop overlay.
- `z-[999]`, `z-[100]` "to be safe".
- A new overlay colour; use `bg-backdrop`.

## Not on the ladder (keep their own)

Printed invoice (`InvoiceDocument`), the shadow lab, the Mac menubar
preview (`/menubar`, mimics macOS), PIN boxes' focus rings
(`PinForm.tsx`, rings drawn as shadows), the avatar crop mask.

## Good examples

- Page sheet shadow on the chrome: `src/app/(main)/layout.tsx` (`blend-shadow` layer)
- Menu: `src/components/ui/dropdown-menu.tsx`
- Glass: `src/components/minimal-screen.tsx`
- Active pill on the chrome: `src/components/nav-main.tsx`

## Example

```tsx
<div className={cn(glassSurfaceClass, "rounded-3xl p-6")}>
  <GlassLayer />
  <h2 className="text-heading text-lg">Masuk</h2>
</div>
```

## Migration notes

Done 2026-11-05 (local): every `shadow-(--elev-N)` (94) on the role
tokens; floating controls on one level; tab bar / lightbox / What's new
arbitrary shadows → tokens; blur removed from the drag overlays, row
badges, thumbnail play button, file viewer arrows and the review sticky
header; the dead `z-*` config in tailwind.config.ts removed; arbitrary
z values → named layers; the tab bar under dialogs. Kept: the Mac
popover mimic shadow in `DesktopApp.tsx`, ring-style inset shadows.
The older list below is kept for reference.

- **Arbitrary / Tailwind shadows**:
  `src/components/floating-tab-bar.tsx:67`
  (`shadow-[0_10px_30px_-8px_rgb(0_0_0/0.35)]`, dark 0.7) → `--elev-4`;
  `src/components/image-lightbox.tsx:175` `shadow-2xl` → `--elev-5` (or
  none on the black field); `src/page-slices/whats-new/ui/shared.tsx:99`
  `shadow-[0_1px_3px_rgb(0_0_0/0.18)]` → `--elev-1`;
  `src/app/(fullscreen)/desktop/DesktopApp.tsx:393` custom → `--elev-4`
  or document it as a macOS mimic.
- **Floating round controls use three levels**: `--elev-1`
  (`InvoiceEditorDialog.tsx:749,770,781`, `ScreenControls`), `--elev-3`
  (`src/components/zoomable.tsx:92,209`, `gallery-strip.tsx:91`,
  `file-drop-canvas.tsx:157,180`), `--elev-2`
  (`AttendanceHistoryList.tsx:332`) → one level for "floating control over
  content" (suggest `--elev-2`) and a shared class.
- **Popover-like surfaces off `--elev-4`**: `src/app/(fullscreen)/menubar/MenubarPreview.tsx:169`
  (`--elev-3`; preview page, low priority).
- **Blur on full-screen overlays**:
  `src/page-slices/projects/ui/workspace/ProjectLibrary.tsx:948` and
  `ProjectDocuments.tsx:361` (`fixed inset-0 … backdrop-blur-[1px]`
  during file drag) → drop the blur, keep the tint.
- **Blur on scrolling content**:
  `src/page-slices/projects/ui/workspace/row-menu.tsx:80` (duration badge
  on a row, `backdrop-blur-sm`), `FilePreview.tsx:176` (play button on
  thumbnails), `src/components/file-viewer.tsx:301,310` (90% opaque) →
  solid `bg-black/60` / `bg-popover`, no blur.
- **Blur on sticky headers**:
  `src/app/(fullscreen)/performance-review/new/ClientPage.tsx:67`
  (`bg-background/95 backdrop-blur`: at 95% the blur is invisible) →
  `bg-background`. `MenubarPreview.tsx:158,346,356` (preview, exempt).
- **Gallery / invoice floating pills** `InvoiceEditorDialog.tsx:749,770,781`,
  `gallery-strip.tsx:91` use `bg-popover/90 backdrop-blur` → opaque
  `bg-popover` (they sit over a static canvas; fine to keep if measured
  cheap, but pick one).
- **Dead z-index tokens**: `tailwind.config.ts` `theme.extend.zIndex`
  (`z-base`, `z-dropdown`, `z-sticky`, `z-fixed`, `z-modal-backdrop`,
  `z-modal`, `z-popover`, `z-tooltip`) points at `--z-*` variables that
  are never defined and has no users → remove, or define them from the
  ladder above and migrate the arbitrary values to them.
- **Arbitrary z values**: `z-[5]` (`calendar/ProjectTimeline.tsx:271`),
  `z-[60]` (`mention.tsx:538`, `slash-command.tsx:305`), `z-[70]`
  (`image-lightbox.tsx:146,149`), `z-[80]`
  (`ContextMenuProvider.tsx:525,717`), `z-[82]`
  (`widgets/event-calendar/ui/month-view.tsx:33`, a day sheet that must
  beat the context menu) → named layers.
- **Phone tab bar shares `z-50` with dialogs** (`floating-tab-bar.tsx:69`):
  it only works because dialogs portal later; give it its own layer
  below `z-50`.
- **Top bar and in-page toolbars share `z-40`** (`app-topbar.tsx:60,85`,
  `PortalShell.tsx:123` vs `doc-editor.tsx:198`, `SelectionMenu.tsx:120`,
  `embed.tsx:529`): a toolbar near the top can cover the top bar → editor
  toolbars belong with popovers (`z-50`, portaled).
- **Overlay colour**: `image-lightbox.tsx:146` `bg-black/85` is the only
  overlay not on `--backdrop` (intended for media; keep, but as a named
  token if a second one appears).
- **PortalShell copies the page sheet** (`PortalShell.tsx:219,223`: shadow
  layer, `blend-shadow`, `shadow-(--elev-3)`, `md:z-20`) → share one
  page-sheet component with `layout.tsx`.
