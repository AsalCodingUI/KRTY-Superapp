import { WikiHomePage } from "@/page-slices/wiki/ui/WikiHomePage"

export const dynamic = "force-dynamic"

/** Kretya Wiki → Semua halaman (everyone: access.ts). */
export default function WikiRoute() {
  return <WikiHomePage />
}
