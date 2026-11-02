import HorizontalRule from "@tiptap/extension-horizontal-rule"
import { Extension } from "@tiptap/react"

/** A line that is only "---", "***" or "___" (three or more). */
const RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/

/**
 * "---" then Enter turns the line into a divider and carries on in a new
 * paragraph below it, as in most Markdown editors.
 */
export const DividerShortcut = Extension.create({
  name: "dividerShortcut",
  // Before list / slash-menu Enter handling.
  priority: 1000,

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { selection, schema } = editor.state
        const { $from, empty } = selection
        const parent = $from.parent
        if (
          !empty ||
          parent.type.name !== "paragraph" ||
          !schema.nodes.horizontalRule ||
          !RULE.test(parent.textContent)
        )
          return false
        const from = $from.before()
        const to = $from.after()
        return editor
          .chain()
          .insertContentAt(
            { from, to },
            [{ type: "horizontalRule" }, { type: "paragraph" }],
            { updateSelection: true },
          )
          .run()
      },
    }
  },
})

/**
 * The divider node without its "type --- and it converts at once" rule:
 * that fired on the third dash, so the Enter that followed left a stray
 * empty line. Enter (above) does it instead.
 */
export const Divider = HorizontalRule.extend({
  addInputRules() {
    return []
  },
})
