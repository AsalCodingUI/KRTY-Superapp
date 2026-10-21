import { redirect } from "next/navigation"

/** Settings is a modal now; old links open it over the dashboard. */
export default function SettingsRedirect() {
  redirect("/dashboard?settings=team-access")
}
