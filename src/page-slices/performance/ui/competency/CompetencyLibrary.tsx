"use client"

import { EmptyValue } from "@/components/empty-value"
import {
  deleteCompetency,
  getCompetencies,
  saveCompetency,
  type CompetencyRow,
} from "@/app/(main)/performance/actions/competency-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
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
import { ListColumns, StatBand } from "../list"

type Role = CompetencyRow["role"]
const ROLES = Constants.public.Enums.project_role_enum as readonly Role[]

const ALL = "all"

/** Shared column template so the header and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_10rem_6rem_8rem]"

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

  const items = data
    .filter((c) => roleFilter === ALL || c.role === roleFilter)
    .sort(
      (a, b) =>
        ROLES.indexOf(a.role) - ROLES.indexOf(b.role) ||
        a.name.localeCompare(b.name),
    )

  return (
    <div className="flex flex-col">
      {/* Competencies per role; a 0 means members in that role get no
          work-quality score. */}
      <StatBand
        stats={ROLES.map((role) => ({
          label: role,
          value: data.filter((c) => c.role === role).length,
        }))}
      />

      <div className="flex items-center justify-between gap-4 py-3">
        <Select
          value={roleFilter}
          onValueChange={(v) => v && setRoleFilter(v as Role | typeof ALL)}
        >
          <SelectTrigger className="w-48">
            <SelectValue>
              {(v: string) => (v === ALL ? t("allRoles") : v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allRoles")}</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() =>
            setDraft({
              role: roleFilter === ALL ? ROLES[0] : roleFilter,
              name: "",
              description: "",
            })
          }
        >
          <RiAddLine data-icon="inline-start" />
          {t("addCompetencyButton")}
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t("noCompetencies")}
          description={
            roleFilter === ALL
              ? t("noCompetenciesAllHint")
              : t("noCompetenciesRoleHint")
          }
          icon={<RiFileList3Line className="size-5" />}
          placement="inner"
        />
      ) : (
        <GroupedList>
          <ListColumns grid={ROW_GRID}>
            <span>{t("competency")}</span>
            <span className="hidden md:block">{t("role")}</span>
            <span className="hidden text-right md:block">{t("used")}</span>
            <span />
          </ListColumns>
          {items.map((c) => (
            <ListRow key={c.id} className={cn(ROW_GRID, "min-h-14")}>
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground truncate">{c.name}</span>
                {c.description && (
                  <span className="text-tertiary-foreground truncate text-[13px]">
                    {c.description}
                  </span>
                )}
              </div>
              <div className="hidden min-w-0 md:block">
                <Badge variant="secondary" className="max-w-full">
                  <span className="truncate">{c.role}</span>
                </Badge>
              </div>
              <span className="text-muted-foreground hidden text-right tabular-nums md:block">
                {c.usage > 0 ? t("usageCount", { n: c.usage }) : <EmptyValue />}
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
                  onClick={() => setRemoving(c)}
                >
                  {tc("delete")}
                </Button>
              </ListRowActions>
            </ListRow>
          ))}
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
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comp-desc">{t("explanation")}</Label>
                <Textarea
                  id="comp-desc"
                  placeholder={t("competencyDescriptionPlaceholder")}
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
            <Button onClick={save} disabled={saving}>
              {saving ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("deleteNamed", { name: removing?.name ?? "" })}
        description={
          removing?.usage
            ? t("competencyInUse", { n: removing.usage })
            : t("competencyDeletePermanent")
        }
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
