import { SantuyPage } from "@/page-slices/santuy/ui/SantuyPage"
import { getGoogleEnv } from "@/shared/lib/google-calendar"

export const dynamic = "force-dynamic"

/** Sharing Santuy: the weekly presenter rotation and its Meet link. */
export default function SantuyRoute() {
  return <SantuyPage googleConfigured={!!getGoogleEnv()} />
}
