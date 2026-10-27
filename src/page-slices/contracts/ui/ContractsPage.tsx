"use client"

import { useCanonicalParam } from "@/shared/hooks/useCanonicalParam"
import { findByLinkKey, linkKey } from "@/shared/lib/url-params"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
} from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  RiDeleteBinLine,
  RiEyeLine,
  RiFileTextLine,
  RiMoreFill,
  RiPencilLine,
  RiSearchLine,
  RiUploadLine,
} from "@/shared/ui/lucide-icons"
import { useQueryClient } from "@tanstack/react-query"
import { AnimatePresence } from "motion/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  contractKeys,
  endsSoon,
  kindLabelKey,
  removeContractFile,
  supabase,
  useContracts,
  type ContractPerson,
  type ContractRow,
} from "../model/data"
import { ContractDialog } from "./ContractDialog"
import { ContractFormDialog } from "./ContractFormDialog"
import {
  EndingChip,
  StatusBadge,
  usePeriodLabel,
  type ContractViewer,
} from "./parts"

const ALL = "all"

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_auto_10rem]"
// Plus the ⋯ menu.
const ROW_GRID_ADMIN =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_auto_10rem_2rem]"

/**
 * Contracts: employees read and acknowledge their own; stakeholders upload
 * and manage everyone's, grouped by person, with the ones ending within 30
 * days called out.
 */
/** `?contract=rizal-dwi-artanto-pkwt-1a2b3c4d`: whose contract, and which. */
const contractKey = (c: ContractRow) =>
  linkKey([c.person?.full_name, c.title].filter(Boolean).join(" "), c.id)

export function ContractsPage({ viewer }: { viewer: ContractViewer }) {
  const t = useT("contracts")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { data: contracts = [], isLoading } = useContracts(
    viewer.isAdmin ? null : viewer.id,
  )

  const openId = searchParams.get("contract")
  const go = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    router.replace(params.size ? `${pathname}?${params}` : pathname, {
      scroll: false,
    })
  }

  const [query, setQuery] = useState("")
  const [person, setPerson] = useState<string>(ALL)
  // null: closed; "new": upload; otherwise the contract being edited.
  const [form, setForm] = useState<ContractRow | "new" | null>(null)
  const [deleting, setDeleting] = useState<ContractRow | null>(null)
  const needle = query.trim().toLowerCase()

  const people = useMemo(() => {
    const byId = new Map<string, ContractPerson>()
    for (const c of contracts) if (c.person) byId.set(c.person.id, c.person)
    return [...byId.values()].sort((a, b) =>
      (a.full_name ?? "").localeCompare(b.full_name ?? ""),
    )
  }, [contracts])

  const shown = useMemo(
    () =>
      contracts.filter(
        (c) =>
          (person === ALL || c.user_id === person) &&
          (!needle ||
            [c.title, c.person?.full_name, c.kind, c.notes]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(needle)),
      ),
    [contracts, person, needle],
  )

  // Stakeholders: one group per person, people with a contract ending soon
  // first, then by name.
  const groups = useMemo(() => {
    if (!viewer.isAdmin) return []
    const map = new Map<
      string,
      { person: ContractPerson | null; rows: ContractRow[] }
    >()
    for (const c of shown) {
      const group = map.get(c.user_id) ?? { person: c.person, rows: [] }
      group.rows.push(c)
      map.set(c.user_id, group)
    }
    return [...map.entries()]
      .map(([id, g]) => ({ id, ...g, soon: g.rows.some(endsSoon) }))
      .sort(
        (a, b) =>
          Number(b.soon) - Number(a.soon) ||
          (a.person?.full_name ?? "").localeCompare(b.person?.full_name ?? ""),
      )
  }, [shown, viewer.isAdmin])

  const open = findByLinkKey(contracts, openId)
  useCanonicalParam("contract", openId, open && contractKey(open))

  const remove = async (contract: ContractRow) => {
    const { error } = await supabase()
      .from("employee_contracts")
      .delete()
      .eq("id", contract.id)
    if (error) {
      toast.error(t("errDelete"))
      throw error
    }
    // The row is gone either way; a leftover file is only storage.
    await removeContractFile(contract.file_path).catch(() => undefined)
    toast.success(t("deleted"))
    if (open?.id === contract.id) go({ contract: null })
    queryClient.invalidateQueries({ queryKey: contractKeys.all })
  }

  const rowProps = (c: ContractRow) => ({
    contract: c,
    isAdmin: viewer.isAdmin,
    onOpen: () => go({ contract: contractKey(c) }),
    onEdit: () => setForm(c),
    onDelete: () => setDeleting(c),
  })

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("title")}
        actions={
          viewer.isAdmin && (
            <Button onClick={() => setForm("new")}>
              <RiUploadLine data-icon="inline-start" />
              {t("upload")}
            </Button>
          )
        }
      />

      {viewer.isAdmin && contracts.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-sm">
            <RiSearchLine className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={person} onValueChange={(v) => v && setPerson(v)}>
            <SelectTrigger
              className="w-full sm:w-52"
              aria-label={t("filterEmployee")}
            >
              <SelectValue>
                {(v: string) =>
                  v === ALL
                    ? t("allEmployees")
                    : (people.find((p) => p.id === v)?.full_name ?? v)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("allEmployees")}</SelectItem>
              {people.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name ?? p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="pb-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-6" />
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            title={
              needle ? t("noMatch", { query: query.trim() }) : t("emptyTitle")
            }
            description={
              needle || person !== ALL
                ? t("noMatchHint")
                : viewer.isAdmin
                  ? t("emptyAdminDescription")
                  : t("emptyDescription")
            }
            icon={<RiFileTextLine />}
          />
        ) : viewer.isAdmin ? (
          <GroupedList>
            {groups.map((g) => (
              <ListGroup
                key={g.id}
                label={g.person?.full_name ?? t("fieldEmployeeLabel")}
                count={g.rows.length}
                icon={<PersonAvatar person={g.person} />}
              >
                <AnimatePresence initial={false}>
                  {g.rows.map((c) => (
                    <ContractListRow key={c.id} {...rowProps(c)} />
                  ))}
                </AnimatePresence>
              </ListGroup>
            ))}
          </GroupedList>
        ) : (
          <GroupedList>
            {shown.map((c) => (
              <ContractListRow key={c.id} {...rowProps(c)} />
            ))}
          </GroupedList>
        )}
      </div>

      {open && (
        <ContractDialog
          key={open.id}
          contract={open}
          viewer={viewer}
          onEdit={() => setForm(open)}
          onClose={() => go({ contract: null })}
        />
      )}
      {viewer.isAdmin && (
        <ContractFormDialog
          contract={form === "new" ? null : form}
          defaultUserId={person === ALL ? null : person}
          open={form !== null}
          onOpenChange={(next) => !next && setForm(null)}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => !next && setDeleting(null)}
        title={deleting ? t("deleteTitle", { title: deleting.title }) : ""}
        description={t("deleteDescription")}
        confirmText={t("delete")}
        variant="destructive"
        onConfirm={async () => {
          if (deleting) await remove(deleting)
        }}
      />
    </div>
  )
}

function PersonAvatar({ person }: { person: ContractPerson | null }) {
  const name = person?.full_name ?? ""
  return (
    <Avatar className="size-5">
      {person?.avatar_url && <AvatarImage src={person.avatar_url} alt="" />}
      <AvatarFallback className="text-[10px]">{name || "?"}</AvatarFallback>
    </Avatar>
  )
}

function ContractListRow({
  contract,
  isAdmin,
  onOpen,
  onEdit,
  onDelete,
}: {
  contract: ContractRow
  isAdmin: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const t = useT("contracts")
  const period = usePeriodLabel()
  const soon = endsSoon(contract)

  return (
    <ListRow
      className={cn(
        isAdmin ? ROW_GRID_ADMIN : ROW_GRID,
        "min-h-14",
        // Ending soon: a warm edge so it stands out in a long list.
        soon &&
          "before:bg-warning before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <RiFileTextLine className="text-muted-foreground size-4 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <button
            type="button"
            onClick={onOpen}
            className="text-foreground truncate text-left outline-none after:absolute after:inset-0 focus-visible:underline"
          >
            {contract.title}
          </button>
          <span className="text-tertiary-foreground truncate text-[13px]">
            {period(contract)}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <EndingChip contract={contract} className="hidden sm:inline-flex" />
        <ListChip className={cn(!isAdmin && "hidden md:inline-flex")}>
          {t(kindLabelKey(contract.kind))}
        </ListChip>
        {/* Phones have no status column; employees need to see it. */}
        {!isAdmin && (
          <span className="md:hidden">
            <StatusBadge status={contract.status} />
          </span>
        )}
        {contract.has_ematerai && (
          <ListChip className="hidden sm:inline-flex">{t("ematerai")}</ListChip>
        )}
      </div>
      <div className="hidden justify-end md:flex">
        <StatusBadge status={contract.status} />
      </div>
      {isAdmin && (
        <div className="relative z-10 hidden justify-end md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("actions")}
                  className="text-muted-foreground"
                />
              }
            >
              <RiMoreFill />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem onClick={onOpen}>
                <RiEyeLine />
                {t("view")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <RiPencilLine />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <RiDeleteBinLine />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </ListRow>
  )
}
