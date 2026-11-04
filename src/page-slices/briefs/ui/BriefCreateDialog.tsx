"use client"

import { createBrief } from "@/app/(main)/projects/actions/brief-actions"
import { SegmentedControl } from "@/components/segmented-control"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useProjectOptions } from "@/page-slices/projects/ui/ProjectLineage"
import { useT } from "@/shared/i18n/client"
import {
  BRIEF_SETS,
  BRIEFS_PER_CLIENT,
  type BriefSet,
} from "@/shared/lib/briefs/types"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import { ChevronDown } from "@/components/icons"
import { useState } from "react"
import { toast } from "sonner"
import { useBriefClients, useRefreshBriefs } from "../model/data"
import { SET_LABEL_KEYS, SetIcon } from "./shared"
import { dialogWidth } from "@/components/ui/dialog-sections"

type Mode = "ask" | "offer" | "off"
const NO_PROJECT = "__none"

/**
 * "Brief baru": title, client (pick one, or type a new one), an optional
 * project, and per question set whether it's asked, offered or left out.
 */
export function BriefCreateDialog({
  open,
  onOpenChange,
  defaultProjectId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** From inside a project: linked to it. */
  defaultProjectId?: string | null
  onCreated: (id: string) => void
}) {
  const t = useT("briefs")
  const tc = useT("common")
  const { data: clients = [] } = useBriefClients(open)
  const { data: projects = [] } = useProjectOptions(open)
  const [title, setTitle] = useState("")
  const [clientId, setClientId] = useState<string | null>(null)
  const [newClient, setNewClient] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [projectId, setProjectId] = useState<string | null>(
    defaultProjectId ?? null,
  )
  const [modes, setModes] = useState<Record<BriefSet, Mode>>({
    design: "ask",
    branding: "offer",
    development: "offer",
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const refresh = useRefreshBriefs()

  const client = clients.find((c) => c.id === clientId) ?? null
  const needle = search.trim()
  const exact = clients.some(
    (c) =>
      c.pic.toLowerCase() === needle.toLowerCase() ||
      c.name.toLowerCase() === needle.toLowerCase(),
  )
  const sets = BRIEF_SETS.filter((s) => modes[s] === "ask")
  const offers = BRIEF_SETS.filter((s) => modes[s] === "offer")
  // The client is optional (a lead we barely know yet); a new one needs
  // its company.
  const ready =
    title.trim() && (!newClient || company.trim()) && sets.length > 0

  const submit = async () => {
    if (!ready || saving) return
    setSaving(true)
    const result = await createBrief({
      title,
      clientId,
      newClient: newClient
        ? { name: company, contact: newClient, email }
        : null,
      projectId,
      sets,
      offers,
    })
    setSaving(false)
    if (!result.success || !result.data)
      return void toast.error(result.success ? "" : result.error)
    toast.success(t("created"))
    await refresh()
    onOpenChange(false)
    onCreated(result.data.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogWidth.form}>
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="gap-field flex flex-col">
            <Label htmlFor="brief-title">{t("fieldTitle")}</Label>
            <Input
              id="brief-title"
              value={title}
              placeholder={t("fieldTitlePlaceholder")}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="gap-field flex flex-col">
            <Label htmlFor="brief-client">{t("fieldClient")}</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger
                id="brief-client"
                className={cn(
                  "bg-field hover:bg-field-hover border-field-border focus-visible:ring-focus-ring flex h-8 w-full cursor-pointer items-center justify-between gap-1.5 rounded-full border px-3 text-sm outline-none focus-visible:ring-2",
                  !client && !newClient && "text-muted-foreground",
                )}
              >
                <span className="truncate">
                  {(client &&
                    (client.pic === client.name
                      ? client.name
                      : `${client.pic} · ${client.name}`)) ??
                    (newClient
                      ? t("clientNew", { name: newClient })
                      : t("clientPick"))}
                </span>
                <ChevronDown className="text-muted-foreground size-4 shrink-0" />
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-(--anchor-width) min-w-64 gap-0 p-0"
              >
                <Command loop shouldFilter={false}>
                  <CommandInput
                    size="sm"
                    value={search}
                    onValueChange={setSearch}
                    placeholder={t("clientSearch")}
                  />
                  <CommandList>
                    <CommandGroup>
                      {(client || newClient) && !needle && (
                        <CommandItem
                          value="__none"
                          onSelect={() => {
                            setClientId(null)
                            setNewClient(null)
                            setPickerOpen(false)
                          }}
                        >
                          <span className="text-muted-foreground">
                            {t("clientPick")}
                          </span>
                        </CommandItem>
                      )}
                      {clients
                        .filter(
                          (c) =>
                            !needle ||
                            `${c.pic} ${c.name}`
                              .toLowerCase()
                              .includes(needle.toLowerCase()),
                        )
                        .map((c) => {
                          const full = c.briefs >= BRIEFS_PER_CLIENT
                          return (
                            <CommandItem
                              key={c.id}
                              value={c.id}
                              disabled={full}
                              data-checked={c.id === clientId}
                              onSelect={() => {
                                setClientId(c.id)
                                setNewClient(null)
                                setPickerOpen(false)
                                setSearch("")
                              }}
                            >
                              <span className="min-w-0 truncate">{c.pic}</span>
                              <span className="text-tertiary-foreground min-w-0 flex-1 truncate text-xs">
                                {c.pic !== c.name ? c.name : ""}
                              </span>
                              {full && (
                                <span className="text-tertiary-foreground text-xs">
                                  {t("clientFull")}
                                </span>
                              )}
                            </CommandItem>
                          )
                        })}
                      {needle && !exact && (
                        <CommandItem
                          value="__new"
                          onSelect={() => {
                            setNewClient(needle)
                            setClientId(null)
                            setPickerOpen(false)
                            setSearch("")
                          }}
                        >
                          <RiAddLine />
                          <span className="truncate">
                            {t("clientNew", { name: needle })}
                          </span>
                        </CommandItem>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {newClient && (
              <Input
                value={company}
                placeholder={t("clientCompany")}
                aria-label={t("clientCompany")}
                onChange={(e) => setCompany(e.target.value)}
              />
            )}
            {newClient && (
              <Input
                type="email"
                value={email}
                placeholder={t("clientEmail")}
                aria-label={t("clientEmail")}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </div>

          <div className="gap-field flex flex-col">
            <Label>{t("fieldProject")}</Label>
            <Select
              value={projectId ?? NO_PROJECT}
              onValueChange={(v) =>
                v && setProjectId(v === NO_PROJECT ? null : v)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) =>
                    v === NO_PROJECT ? (
                      <span className="text-muted-foreground">
                        {t("projectNone")}
                      </span>
                    ) : (
                      (projects.find((p) => p.id === v)?.name ?? "…")
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value={NO_PROJECT}>{t("projectNone")}</SelectItem>
                <SelectSeparator />
                {[...projects]
                  .sort(
                    (a, b) =>
                      Number(b.client_name === client?.name) -
                      Number(a.client_name === client?.name),
                  )
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="gap-field flex flex-col">
            <Label>{t("fieldSets")}</Label>
            {BRIEF_SETS.map((set) => (
              <div key={set} className="flex items-center gap-3 text-sm">
                <SetIcon set={set} />
                <span className="min-w-0 flex-1">{t(SET_LABEL_KEYS[set])}</span>
                <SegmentedControl
                  fitContent
                  value={modes[set]}
                  onChange={(mode) => setModes((m) => ({ ...m, [set]: mode }))}
                  items={[
                    { value: "ask", label: t("setAsk") },
                    { value: "offer", label: t("setOffer") },
                    { value: "off", label: t("setOff") },
                  ]}
                />
              </div>
            ))}
            <p className="text-muted-foreground text-xs">{t("setsHint")}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button disabled={!ready || saving} onClick={() => void submit()}>
            {saving && <Spinner data-icon="inline-start" />}
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
