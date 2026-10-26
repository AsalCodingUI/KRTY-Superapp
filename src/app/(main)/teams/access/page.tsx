import { redirect } from "next/navigation"

/** Members & access now live in the Team table (sheet: Access). */
export default function MembersAccessRoute() {
  redirect("/teams")
}
