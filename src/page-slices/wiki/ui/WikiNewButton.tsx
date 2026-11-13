"use client"

import { panelNewButtonClassName } from "@/components/new-menu"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useT } from "@/shared/i18n/client"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useWikiWriter, wikiHref } from "../model/data"

/** The wiki panel's own "+ Halaman baru" (where + Baru is elsewhere): a
 *  new top-level page, opened. */
export function WikiNewButton() {
  const t = useT("wiki")
  const router = useRouter()
  const writer = useWikiWriter()
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
      <Button
        variant="outline"
        className={panelNewButtonClassName}
        aria-label={t("newPage")}
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            router.push(wikiHref(await writer.create(null)))
          } catch {
            toast.error(t("createFailed"))
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? (
          <Spinner
            data-icon="inline-start"
            className="size-4 group-data-[collapsible=icon]:size-3.5"
          />
        ) : (
          <RiAddLine
            data-icon="inline-start"
            className="size-4 group-data-[collapsible=icon]:size-3.5"
          />
        )}
        <span className="group-data-[collapsible=icon]:sr-only">
          {t("newPage")}
        </span>
      </Button>
    </div>
  )
}
