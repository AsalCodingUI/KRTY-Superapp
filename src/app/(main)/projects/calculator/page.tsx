import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

// Hidden for now: Calculator moves out of Projects later.
export default function ProjectsCalculatorRoute() {
  redirect("/projects")
}
