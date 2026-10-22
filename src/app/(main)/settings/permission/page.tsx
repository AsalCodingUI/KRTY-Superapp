import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/** Settings is gone; old links land where the content lives now. */
export default function SettingsRedirect() {
  redirect("/teams/access")
}
