"use client"

import { Button } from "@/components/ui/button"
import {
  FILL,
  reportTemplate,
  type ReportTemplateId,
} from "@/page-slices/projects/lib/report-templates"
import { useLocale, useT } from "@/shared/i18n/client"
import { useEditorState, type Editor } from "@tiptap/react"
import { CalendarDays, CalendarRange, FileText } from "@/components/icons"
import { useState } from "react"

/**
 * "Mulai dari template: Harian · Mingguan · Kosong" above an empty
 * report. Shown only while the report is empty (so a template never
 * replaces writing); gone once anything is written or "Kosong" is picked.
 * `onTitle` gets the template's title (the dialog decides whether to use
 * it).
 */
export function ReportTemplatePicker({
  editor,
  onTitle,
}: {
  editor: Editor
  onTitle: (title: string) => void
}) {
  const t = useT("projects")
  const locale = useLocale()
  const [dismissed, setDismissed] = useState(false)
  const empty = useEditorState({
    editor,
    selector: ({ editor: e }) => !e.isDestroyed && e.isEmpty,
  })
  if (dismissed || !empty || !editor.isEditable) return null

  const apply = (id: ReportTemplateId) => {
    if (!editor.isEmpty) return
    const tpl = reportTemplate(id, locale)
    editor.commands.setContent(tpl.body, {
      contentType: "markdown",
      emitUpdate: true,
    })
    // The FILL marks out (empty bullets and lines), the caret on the first.
    const marks: number[] = []
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText) return
      let i = (node.text ?? "").indexOf(FILL)
      while (i >= 0) {
        marks.push(pos + i)
        i = (node.text ?? "").indexOf(FILL, i + FILL.length)
      }
    })
    if (marks.length) {
      const tr = editor.state.tr
      for (const at of [...marks].reverse()) tr.delete(at, at + FILL.length)
      tr.setMeta("addToHistory", false)
      editor.view.dispatch(tr)
    }
    onTitle(tpl.title)
    // After this bar (holding the focused button) is gone.
    const at = marks.length ? marks[0] : "start"
    setTimeout(() => editor.commands.focus(at), 0)
    setDismissed(true)
  }

  const choices = [
    {
      id: "daily" as const,
      label: t("reportTemplateDaily"),
      icon: CalendarDays,
    },
    {
      id: "weekly" as const,
      label: t("reportTemplateWeekly"),
      icon: CalendarRange,
    },
  ]

  return (
    <div className="border-border flex shrink-0 items-center gap-1.5 overflow-x-auto border-b px-4 py-2">
      <span className="text-muted-foreground mr-1 shrink-0 text-[13px]">
        {t("reportTemplate")}
      </span>
      {choices.map((c) => (
        <Button
          key={c.id}
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => apply(c.id)}
        >
          <c.icon data-icon="inline-start" />
          {c.label}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground shrink-0"
        onClick={() => {
          setDismissed(true)
          editor.commands.focus()
        }}
      >
        <FileText data-icon="inline-start" />
        {t("reportTemplateBlank")}
      </Button>
    </div>
  )
}
