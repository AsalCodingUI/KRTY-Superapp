"use client"

import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"

/**
 * The document editor (Tiptap, the heaviest thing in the app), loaded only
 * when a dialog shows it. Import this one in dialogs and pages, so the
 * calendar, My tasks, the portal and Yang baru don't carry the editor until
 * someone opens a task, a note or a report.
 */
export const MarkdownDocEditor = dynamic(
  () => import("./doc-editor").then((m) => m.MarkdownDocEditor),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="bg-muted/40 min-h-32 w-full rounded-lg" />
    ),
  },
)
