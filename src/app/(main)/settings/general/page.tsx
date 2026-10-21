import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/** Settings is a modal now; old links open it over the dashboard. */
export default function SettingsRedirect() {
  redirect("/dashboard?settings=general")
}
