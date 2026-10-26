"use client"

import { EmptyValue } from "@/components/empty-value"
import {
  deleteCompetency,
  getCompetencies,
  saveCompetency,
  type CompetencyRow,
} from "@/app/(main)/performance/actions/competency-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { SegmentedControl } from "@/components/segmented-control"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow, ListRowActions } from "@/components/grouped-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Constants } from "@/shared/types/database.types"
import { useT } from "@/shared/i18n/client"
import { RiAddLine, RiFileList3Line } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { GridGroup, ListColumns } from "../list"

type Role = CompetencyRow["role"]
const ROLES = Constants.public.Enums.project_role_enum as readonly Role[]

const ALL = "all"

/** Shared column template so the header and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_7rem_8rem]"

/** A role in the filter, with how many competencies it has. */
function RoleLabel({ label, n }: { label: string; n: number }) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      <span
        className={cn(
          "tabular-nums",
          n === 0 ? "text-warning" : "text-tertiary-foreground",
        )}
      >
        {n}
      </span>
    </span>
  )
}

type Draft = { id?: string; role: Role; name: string; description: string }

/** Competencies per project role; used as the checklist when scoring. */
export function CompetencyLibrary() {
  const t = useT("performance")
  const tc = useT("common")
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["competencies"],
    queryFn: () => getCompetencies(),
  })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<CompetencyRow | null>(null)
  const [roleFilter, setRoleFilter] = useState<Role | typeof ALL>(ALL)
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["competencies"] })

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }

  const save = async () => {
    if (!draft) return
    setSaving(true)
    const result = await saveCompetency(draft)
    setSaving(false)
    if (!result.success) {
      toast.error(result.error ?? t("saveFailed"))
      return
    }
    toast.success(draft.id ? t("competencyUpdated") : t("competencyAdded"))
    setDraft(null)
    refresh()
  }

  const countOf = (role: Role) => data.filter((c) => c.role === role).length
  const shownRoles = roleFilter === ALL ? ROLES : [roleFilter]
  const add = (role: Role) => setDraft({ role, name: "", description: "" })

  return (
    <div className="flex flex-col">
      {/* Filter by role (with how many each has) and add. */}
      <div className="bleed gutter-x border-border flex items-center gap-3 border-b py-3">
        <div className="-my-1 min-w-0 flex-1 overflow-x-auto py-1 [scrollbar-width:none]">
          <SegmentedControl
            fitContent
            value={roleFilter}
            onChange={(v) => setRoleFilter(v as Role | typeof ALL)}
            items={[
              {
                value: ALL,
                label: <RoleLabel label={t("allRoles")} n={data.length} />,
              },
              ...ROLES.map((role) => ({
                value: role,
                label: <RoleLabel label={role} n={countOf(role)} />,
              })),
            ]}
          />
        </div>
        <Button
          className="shrink-0"
          onClick={() => add(roleFilter === ALL ? ROLES[0] : roleFilter)}
        >
          <RiAddLine data-icon="inline-start" />
          {t("addCompetencyButton")}
        </Button>
      </div>

      {data.length === 0 && roleFilter === ALL ? (
        <EmptyState
          title={t("noCompetencies")}
          description={t("noCompetenciesAllHint")}
          icon={<RiFileList3Line className="size-5" />}
          placement="inner"
        />
      ) : (
        <GroupedList>
          <ListColumns grid={ROW_GRID}>
            <span>{t("competency")}</span>
            <span className="hidden text-right md:block">{t("used")}</span>
            <span />
          </ListColumns>
          {/* One group per role; a role with none says what that means. */}
          {shownRoles.map((role) => {
            const items = data
              .filter((c) => c.role === role)
              .sort((a, b) => a.name.localeCompare(b.name))
            return (
              <GridGroup
                key={role}
                grid={ROW_GRID}
                label={role}
                extra={
                  items.length > 0 ? (
                    <span className="text-tertiary-foreground tabular-nums">
                      {items.length}
                    </span>
                  ) : (
                    <Badge variant="warning">{t("noCompetencies")}</Badge>
                  )
                }
              >
                {items.map((c) => (
                  <ListRow key={c.id} className={cn(ROW_GRID, "min-h-16")}>
                    <div className="flex min-w-0 flex-col gap-0.5 py-1">
                      <span className="text-foreground truncate">{c.name}</span>
                      {c.description && (
                        <span className="text-tertiary-foreground line-clamp-2 text-[13px] leading-snug">
                          {c.description}
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground hidden text-right text-[13px] tabular-nums md:block">
                      {c.usage > 0 ? (
                        t("usageCount", { n: c.usage })
                      ) : (
                        <EmptyValue />
                      )}
                    </span>
                    <ListRowActions className="justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDraft({
                            id: c.id,
                            role: c.role,
                            name: c.name,
                            description: c.description ?? "",
                          })
                        }
                      >
                        {t("editAction")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          // In use: deleting would rewrite past scores.
                          c.usage > 0
                            ? toast.error(t("competencyInUse", { n: c.usage }))
                            : setRemoving(c)
                        }
                      >
                        {tc("delete")}
                      </Button>
                    </ListRowActions>
                  </ListRow>
                ))}
                <div className="gutter-x flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground -ml-2.5"
                    onClick={() => add(role)}
                  >
                    <RiAddLine data-icon="inline-start" />
                    {t("addCompetencyTo", { role })}
                  </Button>
                  {items.length === 0 && (
                    <span className="text-tertiary-foreground text-[13px]">
                      {t("noCompetenciesRoleHint")}
                    </span>
                  )}
                </div>
              </GridGroup>
            )
          })}
        </GroupedList>
      )}

      <Dialog open={Boolean(draft)} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? t("editCompetency") : t("newCompetency")}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t("role")}</Label>
                <Select
                  value={draft.role}
                  onValueChange={(v) =>
                    v && setDraft({ ...draft, role: v as Role })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comp-name">{t("name")}</Label>
                <Input
                  id="comp-name"
                  maxLength={120}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comp-desc">{t("explanation")}</Label>
                <Textarea
                  id="comp-desc"
                  placeholder={t("competencyDescriptionPlaceholder")}
                  maxLength={1000}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              {tc("cancel")}
            </Button>
            <Button onClick={save} disabled={saving || !draft?.name.trim()}>
              {saving ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("deleteNamed", { name: removing?.name ?? "" })}
        description={t("competencyDeletePermanent")}
        confirmText={tc("delete")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (!removing) return
          const result = await deleteCompetency(removing.id)
          if (result.success) toast.success(t("competencyDeleted"))
          else toast.error(result.error ?? t("deleteFailed"))
          setRemoving(null)
          refresh()
        }}
      />
    </div>
  )
}
