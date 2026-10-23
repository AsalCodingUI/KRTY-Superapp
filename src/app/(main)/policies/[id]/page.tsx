import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/** Rules open as a modal over the list; old links land there. */
export default async function PolicyRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ v?: string }>
}) {
  const [{ id }, { v }] = await Promise.all([params, searchParams])
  const query = new URLSearchParams({ aturan: id })
  if (v) query.set("v", v)
  redirect(`/policies?${query}`)
}
