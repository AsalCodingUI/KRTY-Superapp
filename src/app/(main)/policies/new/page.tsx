import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function NewPolicyRoute() {
  redirect("/policies?policy=new&edit=1")
}
