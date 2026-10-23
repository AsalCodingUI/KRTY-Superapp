"use client"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  needsVerification,
  PAYMENT_FIELDS,
  PAYMENT_TYPE_LABEL,
} from "@/entities/finance/lib/invoice"
import { usePaymentMethods } from "@/page-slices/projects/ui/invoice/data"
import { InvoiceSettingsDialog } from "@/page-slices/projects/ui/invoice/InvoiceSettingsDialog"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { canManageByRole } from "@/shared/lib/roles"
import { RiAddLine, RiBankCardLine } from "@/shared/ui/lucide-icons"
import { formatDistanceToNow } from "date-fns"
import { AlertTriangle } from "lucide-react"
import { useState } from "react"

/** What opens in the settings dialog: a method, a new one, or the studio. */
type Opened =
  | { tab: "methods"; methodId: string | null }
  | { tab: "studio"; methodId: null }

/**
 * Where invoices get paid: every payment method (bank, crypto, PayPal…) and
 * the studio profile printed on invoices. Shared by all projects.
 */
export function PaymentMethodsPage() {
  const t = useT("invoices")
  const dateLocale = useDateLocale()
  const { profile, loading } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const { data: methods = [], isLoading } = usePaymentMethods(isAdmin)
  const [opened, setOpened] = useState<Opened | null>(null)

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  if (!isAdmin)
    return (
      <EmptyState
        className="py-16"
        title={t("noAccessTitle")}
        description={t("noAccessDescription")}
        icon={<RiBankCardLine />}
      />
    )

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("tabMethods")}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setOpened({ tab: "studio", methodId: null })}
            >
              {t("tabStudio")}
            </Button>
            <Button
              onClick={() => setOpened({ tab: "methods", methodId: "new" })}
            >
              <RiAddLine data-icon="inline-start" />
              {t("addMethod")}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      ) : methods.length === 0 ? (
        <EmptyState
          title={t("methodsEmpty")}
          description={t("methodsEmptyHint")}
          icon={<RiBankCardLine />}
        />
      ) : (
        <div className="grid gap-4 pb-4 md:grid-cols-2 xl:grid-cols-3">
          {methods.map((m) => {
            const filled = PAYMENT_FIELDS[m.type]
              .map((f) => m.details?.[f.key])
              .filter(Boolean)
            const stale = needsVerification(m)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setOpened({ tab: "methods", methodId: m.id })}
                className="bg-card border-foreground/10 hover:border-foreground/20 focus-visible:border-primary/50 focus-visible:ring-primary/20 flex flex-col overflow-hidden rounded-xl border text-left transition-[border-color] duration-200 outline-none focus-visible:ring-2"
              >
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="border-border rounded-full border px-2 py-0.5 text-xs">
                      {PAYMENT_TYPE_LABEL[m.type] ?? m.type}
                    </span>
                    {!m.is_active && (
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                        {t("methodInactive")}
                      </span>
                    )}
                  </div>
                  <span className="text-foreground truncate font-medium">
                    {m.name}
                  </span>
                  <p className="text-muted-foreground truncate text-sm">
                    {filled.length
                      ? filled.slice(0, 2).join(" · ")
                      : t("methodNoDetails")}
                  </p>
                </div>
                <div className="bg-muted/40 border-border text-muted-foreground flex items-center justify-between gap-3 border-t px-5 py-3 text-[13px]">
                  <span className="truncate">
                    {m.type === "crypto"
                      ? m.verified_at
                        ? `${t("lastChecked")} ${formatDistanceToNow(
                            new Date(m.verified_at),
                            { addSuffix: true, locale: dateLocale },
                          )}`
                        : t("neverChecked")
                      : m.is_active
                        ? t("methodActive")
                        : t("methodInactive")}
                  </span>
                  {stale && (
                    <span className="text-warning flex shrink-0 items-center gap-1">
                      <AlertTriangle className="size-3.5" />
                      {t("needsCheck")}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {opened && (
        <InvoiceSettingsDialog
          key={`${opened.tab}:${opened.methodId ?? ""}`}
          open
          onOpenChange={(next) => !next && setOpened(null)}
          initialTab={opened.tab}
          initialMethodId={opened.methodId}
        />
      )}
    </div>
  )
}
