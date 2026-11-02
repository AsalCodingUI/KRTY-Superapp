import { AppSettingsPage } from "@/page-slices/app-settings/ui/AppSettingsPage"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

/** Kretya Flow's own settings (inside the Mac app). */
export default function AppSettingsRoute() {
  return (
    <Suspense>
      <AppSettingsPage />
    </Suspense>
  )
}
