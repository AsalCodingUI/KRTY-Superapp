"use client"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useT } from "@/shared/i18n/client"
import { RiAddLine, RiBookClosedLine } from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useWikiPages, useWikiWriter } from "../model/data"
import { WikiPageRows } from "./WikiPageRows"

/**
 * Kretya Wiki → Semua halaman: the top-level pages (each with how many
 * pages are under it). Everyone reads and writes.
 */
export function WikiHomePage() {
  const t = useT("wiki")
  const router = useRouter()
  const { data: pages, isLoading, isError } = useWikiPages()
  const writer = useWikiWriter()
  const [creating, setCreating] = useState(false)

  const create = async () => {
    setCreating(true)
    try {
      router.push(`/wiki/${await writer.create(null)}`)
    } catch {
      toast.error(t("createFailed"))
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t("title")}
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
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<RiBookClosedLine className="size-5" />}
          title={t("loadFailed")}
        />
      ) : !pages?.length ? (
        <EmptyState
          icon={<RiBookClosedLine className="size-5" />}
          title={t("empty")}
          description={t("emptyDesc")}
        />
      ) : (
        <WikiPageRows pages={pages} parentId={null} />
      )}
    </div>
  )
}
