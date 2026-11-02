"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  needsVerification,
  PAYMENT_FIELDS,
  PAYMENT_TYPE_LABEL,
} from "@/entities/finance/lib/invoice"
import {
  invoiceKeys,
  removeQrIfUnused,
  usePaymentMethods,
  type PaymentMethod,
} from "@/page-slices/projects/ui/invoice/data"
import { createClient } from "@/shared/api/supabase/client"
import { ContextTarget, copyText, type CtxItem } from "@/shared/context-menu"
import { useQueryClient } from "@tanstack/react-query"
import { BadgeCheck, Copy, Pencil, Power, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { canManageByRole } from "@/shared/lib/roles"
import { RiAddLine, RiBankCardLine } from "@/shared/ui/lucide-icons"
import { formatDistanceToNow } from "date-fns"
import { TriangleAlert as AlertTriangle } from "@/components/icons"
import dynamic from "next/dynamic"
import { useState } from "react"

// The settings dialog (methods + studio profile forms) only loads when opened.
const InvoiceSettingsDialog = dynamic(
  () =>
    import("@/page-slices/projects/ui/invoice/InvoiceSettingsDialog").then(
      (m) => m.InvoiceSettingsDialog,
    ),
  { loading: () => null },
)

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
  const [deleting, setDeleting] = useState<PaymentMethod | null>(null)
  const tc = useT("common")
  const tm = useT("ctxmenu")
  const queryClient = useQueryClient()
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: invoiceKeys.methods })

  const copy = async (text: string) => {
    if (await copyText(text)) toast.success(tm("copied"))
    else toast.error(tm("copyFailed"))
  }
  /** One column of a method, saved straight away (same table as the form). */
  const patch = async (
    m: PaymentMethod,
    change: Partial<Pick<PaymentMethod, "is_active" | "verified_at">>,
    done: string,
  ) => {
    const { error } = await createClient()
      .from("payment_methods")
      .update(change)
      .eq("id", m.id)
    if (error) return void toast.error(t("errMethod"))
    toast.success(done)
    await refresh()
  }
  /** Right-click on a method card: the form's actions, plus copying details. */
  const methodItems = (m: PaymentMethod): CtxItem[] => {
    const fields = PAYMENT_FIELDS[m.type]
      .map((f) => ({ ...f, value: m.details?.[f.key] }))
      .filter((f): f is typeof f & { value: string } => Boolean(f.value))
    return [
      {
        id: "edit",
        label: t("ctxEditMethod"),
        icon: Pencil,
        onSelect: () => setOpened({ tab: "methods", methodId: m.id }),
      },
      {
        id: "copy",
        label: t("ctxCopyDetails"),
        icon: Copy,
        disabled: fields.length === 0,
        submenu: [
          ...fields.map((f) => ({
            id: f.key,
            label: f.label,
            hint: f.value,
            onSelect: () => copy(f.value),
          })),
          {
            id: "all",
            label: t("ctxCopyAllDetails"),
            onSelect: () =>
              copy(
                [m.name, ...fields.map((f) => `${f.label}: ${f.value}`)].join(
                  "\n",
                ),
              ),
          },
        ],
      },
      {
        id: "active",
        label: t("methodActive"),
        icon: Power,
        role: "checkbox",
        checked: m.is_active,
        onSelect: () =>
          patch(
            m,
            { is_active: !m.is_active },
            m.is_active ? t("ctxDeactivated") : t("ctxActivated"),
          ),
      },
      ...(m.type === "crypto"
        ? [
            {
              id: "checked",
              label: t("markChecked"),
              icon: BadgeCheck,
              onSelect: () =>
                patch(
                  m,
                  { verified_at: new Date().toISOString() },
                  t("verified"),
                ),
            },
          ]
        : []),
      {
        id: "delete",
        label: t("deleteMethod"),
        icon: Trash2,
        destructive: true,
        onSelect: () => setDeleting(m),
      },
    ]
  }

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
              <ContextTarget
                key={m.id}
                type="payment-method"
                id={m.id}
                label={m.name}
                items={() => methodItems(m)}
              >
                <button
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
              </ContextTarget>
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
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => !next && setDeleting(null)}
        title={t("deleteMethodTitle", { name: deleting?.name ?? "" })}
        description={t("deleteMethodDescription")}
        confirmText={t("deleteMethod")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (!deleting) return
          const { error } = await createClient()
            .from("payment_methods")
            .delete()
            .eq("id", deleting.id)
          if (error) return void toast.error(t("errMethod"))
          if (deleting.qr_path) await removeQrIfUnused(deleting.qr_path)
          toast.success(t("methodDeleted"))
          setDeleting(null)
          await refresh()
        }}
      />
    </div>
  )
}
