import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

// Hidden for now: SLA Generator moves out of Projects later.
export default function ProjectsSlaRoute() {
  redirect("/projects")
}
