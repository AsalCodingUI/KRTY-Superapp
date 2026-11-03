import { siteConfig } from "@/app/siteConfig"
import { redirect } from "next/navigation"

/** The old Setelan app page (links from Kretya Flow 0.1–0.2): Settings now
 *  opens as a window over the dashboard. */
export default function AppSettingsRoute() {
  redirect(`${siteConfig.baseLinks.dashboard}?settings=general`)
}
