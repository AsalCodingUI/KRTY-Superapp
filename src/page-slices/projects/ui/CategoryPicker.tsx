"use client"

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { createClient } from "@/shared/api/supabase/client"
import { accessLevel, canRunProjects } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, Settings2 } from "@/components/icons"
import dynamic from "next/dynamic"
import { useState } from "react"
import { toast } from "sonner"

const CategoryManageDialog = dynamic(
  () => import("./CategoryManageDialog").then((m) => m.CategoryManageDialog),
  { ssr: false },
)

export type ProjectCategory = { id: string; name: string }

export const CATEGORIES_KEY = ["project-categories"]

export function useProjectCategories(enabled = true) {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    enabled,
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("project_categories")
        .select("id, name")
        .order("name")
      if (error) throw error
      return (data ?? []) as ProjectCategory[]
    },
  })
}

/**
 * Pick a project category, or type a new one and "Tambah '…'" it (PMs and
 * stakeholders may add; the list is shared). They also rename and delete
 * them from "Kelola kategori".
 */
export function CategoryPicker({
  id,
  value,
  onChange,
  className,
}: {
  id?: string
  value: string | null
  onChange: (id: string | null) => void
  /** The trigger's look (an inline value instead of a field). */
  className?: string
}) {
  const t = useT("projects")
  const queryClient = useQueryClient()
  const { data: categories = [] } = useProjectCategories()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [adding, setAdding] = useState(false)
  const [managing, setManaging] = useState(false)
  const { profile } = useUserProfile()
  const canManage = canRunProjects(accessLevel(profile))

  const name = search.trim()
  const exact = categories.find(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  )
  const current = categories.find((c) => c.id === value) ?? null
  // Filtered here (not by cmdk) so "Tambah …" always stays listed.
  const shown = name
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(name.toLowerCase()),
      )
    : categories

  const pick = (next: string | null) => {
    onChange(next)
    setOpen(false)
    setSearch("")
  }

  const add = async () => {
    if (!name || adding) return
    setAdding(true)
    const { data, error } = await createClient()
      .from("project_categories")
      .insert({ name })
      .select("id, name")
      .single()
    setAdding(false)
    if (error || !data) {
      toast.error(t("categoryAddFailed"))
      return
    }
    queryClient.setQueryData<ProjectCategory[]>(CATEGORIES_KEY, (list = []) =>
      [...list, data].sort((a, b) => a.name.localeCompare(b.name)),
    )
    void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
    pick(data.id)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        className={cn(
          "bg-field hover:bg-field-hover hover:border-field-border-hover focus-visible:border-primary/50 focus-visible:ring-focus-ring border-field-border flex h-8 w-full cursor-pointer items-center justify-between gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-[color,box-shadow] duration-200 outline-none focus-visible:ring-2",
          !current && "text-muted-foreground",
          className,
        )}
      >
        <span className="truncate">{current?.name ?? t("categoryNone")}</span>
        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-0 p-0">
        <Command loop shouldFilter={false}>
          <CommandInput
            size="sm"
            value={search}
            onValueChange={setSearch}
            placeholder={t("categorySearch")}
          />
          <CommandList>
            <CommandGroup>
              {!name && (
                <CommandItem
                  value="__none"
                  data-checked={value === null}
                  onSelect={() => pick(null)}
                >
                  <span className="text-muted-foreground">
                    {t("categoryNone")}
                  </span>
                </CommandItem>
              )}
              {shown.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.name}
                  data-checked={c.id === value}
                  onSelect={() => pick(c.id)}
                >
                  <span className="truncate">{c.name}</span>
                </CommandItem>
              ))}
              {name && !exact && (
                <CommandItem
                  value="__add"
                  disabled={adding}
                  onSelect={() => void add()}
                >
                  <RiAddLine />
                  <span className="truncate">{t("categoryAdd", { name })}</span>
                </CommandItem>
              )}
            </CommandGroup>
            {canManage && !name && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__manage"
                    onSelect={() => {
                      setOpen(false)
                      setManaging(true)
                    }}
                  >
                    <Settings2 className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {t("categoryManage")}
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
      {managing && (
        <CategoryManageDialog
          open={managing}
          onOpenChange={setManaging}
          onDeleted={(id) => id === value && onChange(null)}
        />
      )}
    </Popover>
  )
}
