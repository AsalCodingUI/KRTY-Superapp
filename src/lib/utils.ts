import { createCn } from "cn/config"

/**
 * The app's class merger. It must know the app's own tokens: the type
 * scale (text-micro … text-kpi) are font sizes (unregistered, `text-micro`
 * reads as a color and `cn("text-white", "text-micro")` drops the white),
 * the radius roles (rounded-control … rounded-tile) are radii, the shadow
 * roles (shadow-control … shadow-dialog) are shadows, and the spacing
 * roles (gap-field, p-surface, …) are spacing.
 */
export const cn = createCn({
  extend: {
    // The spacing roles (globals.css: gap-field, p-surface, …).
    theme: {
      spacing: ["field", "fields", "inline", "section", "surface"],
    },
    classGroups: {
      "font-size": [
        {
          text: [
            "micro",
            "caption",
            "meta",
            "body",
            "title",
            "section",
            "stat",
            "page-title",
            "kpi",
          ],
        },
      ],
      // The named layers (globals.css --z-index-*).
      z: [{ z: ["editor-menu", "lightbox", "context-menu", "over-menu"] }],
      // The shadow roles (globals.css).
      shadow: [{ shadow: ["control", "raised", "sheet", "popover", "dialog"] }],
      // The radius roles (globals.css), so `cn("rounded-tile", "rounded-md")`
      // keeps one radius, not both.
      ...Object.fromEntries(
        ["rounded", "rounded-t", "rounded-b", "rounded-l", "rounded-r"].map(
          (group) => [
            group,
            [
              {
                [group]: [
                  "control",
                  "chip",
                  "row",
                  "card",
                  "popover",
                  "dialog",
                  "tile",
                ],
              },
            ],
          ],
        ),
      ),
    },
  },
})
