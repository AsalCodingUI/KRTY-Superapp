import { createCn } from "cn/config"

/**
 * The app's class merger. It must know the app's own tokens: the type
 * scale (text-micro … text-kpi) are font sizes (unregistered, `text-micro`
 * reads as a color and `cn("text-white", "text-micro")` drops the white),
 * and the radius roles (rounded-control … rounded-tile) are radii.
 */
export const cn = createCn({
  extend: {
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
