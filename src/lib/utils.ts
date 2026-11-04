import { createCn } from "cn/config"

/**
 * The app's class merger. It must know the type-scale tokens
 * (globals.css: text-micro … text-kpi) are font sizes: unregistered,
 * `text-micro` reads as a text color and `cn("text-white", "text-micro")`
 * drops the white.
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
    },
  },
})
