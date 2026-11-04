import { UiDocsPage } from "@/page-slices/ui-docs/ui/UiDocsPage"
import { Suspense } from "react"

/** Internal: the UI rules per component, live on mock data (docs/ui). */
export default function UiDocsRoute() {
  return (
    <Suspense>
      <UiDocsPage />
    </Suspense>
  )
}
