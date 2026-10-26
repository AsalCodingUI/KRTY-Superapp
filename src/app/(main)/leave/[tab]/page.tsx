import { notFound } from "next/navigation"
import LeavePage from "../page"

/** The leave page's own tabs; anything else is a 404, not the inbox. */
const TABS = ["approval", "remaining", "attendance"]

export default async function LeaveTabPage({
  params,
  searchParams,
}: {
  params: Promise<{ tab: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tab } = await params
  if (!TABS.includes(tab)) notFound()
  return <LeavePage searchParams={searchParams} />
}
