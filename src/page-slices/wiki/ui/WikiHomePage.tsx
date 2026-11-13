"use client"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { SectionTitle } from "@/components/section-title"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { RiAddLine, RiBookClosedLine } from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  childrenOf,
  readRecentPages,
  useWikiPages,
  useWikiWriter,
  type WikiPageMeta,
} from "../model/data"
import { WikiPageCard } from "./WikiPageCard"
import { WikiPageRows } from "./WikiPageRows"

/** How many pages lie under `id`, at any depth. */
function countUnder(pages: WikiPageMeta[], id: string) {
  let count = 0
  const stack = [id]
  while (stack.length) {
    const parent = stack.pop()!
    for (const page of pages)
      if (page.parent_id === parent) {
        count++
        stack.push(page.id)
      }
  }
  return count
}

/** Selamat pagi / siang / sore / malam, by the hour. */
function greetingKey(hour: number) {
  if (hour < 11) return "greetMorning" as const
  if (hour < 15) return "greetNoon" as const
  if (hour < 19) return "greetAfternoon" as const
  return "greetEvening" as const
}

/**
 * Kretya Wiki → Home, as Notion's: a greeting, the pages opened lately
 * (this device), the top-level pages as cards, and the latest edits by
 * anyone.
 */
export function WikiHomePage() {
  const t = useT("wiki")
  const tn = useT("nav")
  const router = useRouter()
  const { profile } = useUserProfile()
  const { data: pages, isLoading, isError } = useWikiPages()
  const writer = useWikiWriter()
  const [creating, setCreating] = useState(false)
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [hour, setHour] = useState<number | null>(null)
  useEffect(() => {
    setRecentIds(readRecentPages())
    setHour(new Date().getHours())
  }, [])

  const all = useMemo(() => pages ?? [], [pages])
  const recent = useMemo(() => {
    const byId = new Map(all.map((p) => [p.id, p]))
    return recentIds
      .map((id) => byId.get(id))
      .filter((p): p is WikiPageMeta => Boolean(p))
      .slice(0, 6)
  }, [all, recentIds])
  const top = useMemo(() => childrenOf(all, null), [all])
  const edited = useMemo(
    () =>
      [...all]
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 8),
    [all],
  )

  const create = async () => {
    setCreating(true)
    try {
      router.push(`/wiki/${await writer.create(null)}`)
    } catch {
      toast.error(t("createFailed"))
      setCreating(false)
    }
  }

  const firstName = profile?.full_name?.split(" ")[0]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        className="pb-0"
        title={tn("wikiAll")}
        actions={
          <Button onClick={() => void create()} disabled={creating}>
            {creating ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RiAddLine data-icon="inline-start" />
            )}
            {t("newPage")}
          </Button>
        }
      />

      <h2 className="text-heading min-h-8 text-center text-2xl font-medium tracking-tight">
        {hour === null
          ? null
          : firstName
            ? t("greetName", { greet: t(greetingKey(hour)), name: firstName })
            : t(greetingKey(hour))}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<RiBookClosedLine className="size-5" />}
          title={t("loadFailed")}
        />
      ) : !all.length ? (
        <EmptyState
          icon={<RiBookClosedLine className="size-5" />}
          title={t("empty")}
          description={t("emptyDesc")}
        />
      ) : (
        <>
          {recent.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>{t("recent")}</SectionTitle>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {recent.map((page) => (
                  <WikiPageCard key={page.id} page={page} />
                ))}
              </div>
            </section>
          )}
          <section className="flex flex-col gap-3">
            <SectionTitle>{t("topPages")}</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {top.map((page) => (
                <WikiPageCard
                  key={page.id}
                  page={page}
                  count={countUnder(all, page.id)}
                />
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-1">
            <SectionTitle>{t("lastEdited")}</SectionTitle>
            <WikiPageRows pages={all} list={edited} />
          </section>
        </>
      )}
    </div>
  )
}
