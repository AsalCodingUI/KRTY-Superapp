"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createClient } from "@/shared/api/supabase/client"
import { useT } from "@/shared/i18n/client"
import { RiDeleteBinLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import {
  CATEGORIES_KEY,
  useProjectCategories,
  type ProjectCategory,
} from "./CategoryPicker"

/** How many projects (that the viewer can see) sit in each category. */
function useCategoryUsage(enabled: boolean) {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, "usage"],
    enabled,
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("projects")
        .select("category_id")
        .not("category_id", "is", null)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of data ?? [])
        counts[row.category_id!] = (counts[row.category_id!] ?? 0) + 1
      return counts
    },
  })
}

/** "Kelola kategori": rename (saved on blur / Enter) or delete each one. */
export function CategoryManageDialog({
  open,
  onOpenChange,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The picker clears its value when its category goes. */
  onDeleted?: (id: string) => void
}) {
  const t = useT("projects")
  const tc = useT("common")
  const queryClient = useQueryClient()
  const { data: categories = [] } = useProjectCategories(open)
  const { data: usage = {} } = useCategoryUsage(open)
  const [deleting, setDeleting] = useState<ProjectCategory | null>(null)

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
    void queryClient.invalidateQueries({ queryKey: ["projects"] })
  }

  const rename = async (category: ProjectCategory, next: string) => {
    const name = next.trim()
    if (!name || name === category.name) return true
    const { error } = await createClient()
      .from("project_categories")
      .update({ name })
      .eq("id", category.id)
    if (error) {
      toast.error(t("categorySaveFailed"))
      return false
    }
    queryClient.setQueryData<ProjectCategory[]>(CATEGORIES_KEY, (list = []) =>
      list
        .map((c) => (c.id === category.id ? { ...c, name } : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
    refresh()
    return true
  }

  const remove = async (category: ProjectCategory) => {
    const { error } = await createClient()
      .from("project_categories")
      .delete()
      .eq("id", category.id)
    if (error) {
      toast.error(t("categorySaveFailed"))
      return
    }
    queryClient.setQueryData<ProjectCategory[]>(CATEGORIES_KEY, (list = []) =>
      list.filter((c) => c.id !== category.id),
    )
    onDeleted?.(category.id)
    toast.success(t("categoryDeleted"))
    refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("categoryManage")}</DialogTitle>
          <DialogDescription>{t("categoryManageHint")}</DialogDescription>
        </DialogHeader>
        {categories.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {t("categoryEmpty")}
          </p>
        ) : (
          <ul className="scroll-pane scroll-pane-bleed-1 flex max-h-80 flex-col gap-1 py-0.5">
            {categories.map((category) => (
              <CategoryRow
                key={`${category.id}:${category.name}`}
                category={category}
                count={usage[category.id] ?? 0}
                onRename={(name) => rename(category, name)}
                onDelete={() => setDeleting(category)}
              />
            ))}
          </ul>
        )}
      </DialogContent>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title={t("categoryDeleteTitle", { name: deleting?.name ?? "" })}
        description={t("categoryDeleteDescription", {
          n: deleting ? (usage[deleting.id] ?? 0) : 0,
        })}
        confirmText={tc("delete")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (deleting) await remove(deleting)
          setDeleting(null)
        }}
      />
    </Dialog>
  )
}

function CategoryRow({
  category,
  count,
  onRename,
  onDelete,
}: {
  category: ProjectCategory
  count: number
  onRename: (name: string) => Promise<boolean>
  onDelete: () => void
}) {
  const t = useT("projects")
  const [draft, setDraft] = useState(category.name)
  const save = async () => {
    if (!(await onRename(draft))) setDraft(category.name)
  }
  return (
    <li className="flex items-center gap-2">
      <Input
        value={draft}
        maxLength={60}
        aria-label={t("categoryRename")}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") {
            e.stopPropagation()
            setDraft(category.name)
          }
        }}
        className="flex-1"
      />
      <span className="text-muted-foreground text-meta w-16 shrink-0 text-right tabular-nums">
        {t("categoryUsage", { n: count })}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("categoryDelete")}
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive-ink"
      >
        <RiDeleteBinLine />
      </Button>
    </li>
  )
}
