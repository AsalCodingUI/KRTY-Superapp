"use client"

import { StatusPage } from "@/components/status-page"
import { Button } from "@/components/ui/button"
import { useT } from "@/shared/i18n/client"
import { RiArrowLeftLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

/** 404 used inside the app shell and at the root. */
export function NotFoundView({ fullScreen = false }: { fullScreen?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useT("shell")
  const tc = useT("common")
  return (
    <StatusPage
      screen={fullScreen}
      code="404"
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
      detail={pathname}
      actions={
        <>
          <Button
            variant="outline"
            onClick={() =>
              window.history.length > 1
                ? router.back()
                : router.push("/dashboard")
            }
          >
            <RiArrowLeftLine data-icon="inline-start" />
            {tc("back")}
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard" prefetch={false} />}
          >
            {t("goToDashboard")}
          </Button>
        </>
      }
    />
  )
}
