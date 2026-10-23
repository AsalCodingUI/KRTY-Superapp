"use client"

import { StatusPage } from "@/components/status-page"
import { Button } from "@/components/ui/button"
import { useT } from "@/shared/i18n/client"
import { RiRefreshLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { useEffect } from "react"

/** Error boundary content for app routes. */
export function ErrorView({
  error,
  reset,
  fullScreen = false,
}: {
  error: Error & { digest?: string }
  reset: () => void
  fullScreen?: boolean
}) {
  const t = useT("shell")
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <StatusPage
      className={fullScreen ? "min-h-svh" : undefined}
      code=":("
      title={t("errorTitle")}
      description={t("errorDescription")}
      detail={error.digest ? t("errorCode", { code: error.digest }) : null}
      actions={
        <>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            {t("goToDashboard")}
          </Button>
          <Button onClick={reset}>
            <RiRefreshLine data-icon="inline-start" />
            {t("tryAgain")}
          </Button>
        </>
      }
    />
  )
}
