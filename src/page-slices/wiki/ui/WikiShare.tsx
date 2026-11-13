"use client"

import { Check, Globe, Lock, UserPlus } from "@/components/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
} from "@/components/ui/select"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import {
  accessGate,
  useWikiMembers,
  useWikiWriter,
  type WikiPageMeta,
} from "../model/data"

type Person = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

/** Everyone, to invite (a small studio: one list). */
function usePeople(enabled: boolean) {
  return useQuery({
    queryKey: ["wiki-share-people"],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await createClient()
        .from("profiles")
        .select("id, full_name, avatar_url")
        .order("full_name")
      return (data ?? []) as Person[]
    },
  })
}

function PersonRow({
  name,
  avatar,
  note,
  children,
}: {
  name: string
  avatar: string | null
  note?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-9 items-center gap-2.5">
      <Avatar className="size-6">
        <AvatarImage src={avatar || undefined} alt="" />
        <AvatarFallback>{name}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-sm">
        {name}
        {note && (
          <span className="text-muted-foreground text-meta"> · {note}</span>
        )}
      </span>
      {children}
    </div>
  )
}

/**
 * Bagikan, as Notion's Share: open to everyone at Kretya, or only to
 * invited people (each can view or edit); a subpage follows the nearest
 * restricted page above it until it's restricted itself. Who may change it:
 * whoever may edit the page (wiki_pages_access.sql enforces all of it).
 */
export function WikiShare({
  page,
  pages,
}: {
  page: WikiPageMeta
  pages: WikiPageMeta[]
}) {
  const t = useT("wiki")
  const writer = useWikiWriter()
  const { authProfile, profile } = useUserProfile()
  const me = authProfile?.id ?? profile?.id ?? null
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)

  const gate = accessGate(pages, page.id)
  const own = gate?.id === page.id
  const inherited = gate && !own ? gate : null
  const { data: members = [] } = useWikiMembers(
    open ? (gate?.id ?? null) : null,
  )
  const { data: people = [] } = usePeople(open)
  const byId = new Map(people.map((p) => [p.id, p]))
  const creator = gate?.created_by ? byId.get(gate.created_by) : undefined
  const canManage = page.access === "edit"

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
    } catch {
      toast.error(t("shareFailed"))
    } finally {
      setBusy(false)
    }
  }

  const restrict = (on: boolean) =>
    run(() =>
      writer.setRestricted(
        page.id,
        on,
        // Restricting under a restricted page: the people who had it keep it.
        on && inherited
          ? [
              ...members,
              ...(inherited.created_by
                ? [{ profile_id: inherited.created_by, can_edit: true }]
                : []),
            ]
          : [],
        me,
      ),
    )

  const listed = new Set([
    ...members.map((m) => m.profile_id),
    ...(gate?.created_by ? [gate.created_by] : []),
  ])
  const invitable = people.filter((p) => !listed.has(p.id))
  const label = (id: string, name: string | null) =>
    id === me ? `${name ?? "…"} (${t("you")})` : (name ?? "…")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline">
            {page.restricted || inherited ? (
              <Lock data-icon="inline-start" />
            ) : (
              <Globe data-icon="inline-start" />
            )}
            {t("share")}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 gap-3 p-3">
        <p className="text-sm font-medium">{t("shareTitle")}</p>

        {inherited ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <Lock className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm">
                  {t("accessInherited", {
                    name: inherited.title || t("untitled"),
                  })}
                </span>
                <span className="text-muted-foreground text-meta">
                  {t("accessInheritedHint")}
                </span>
              </div>
            </div>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void restrict(true)}
              >
                {t("restrictThis")}
              </Button>
            )}
          </div>
        ) : (
          <div role="radiogroup" className="-mx-1 flex flex-col">
            {(
              [
                [false, Globe, "accessEveryone", "accessEveryoneHint"],
                [true, Lock, "accessInvited", "accessInvitedHint"],
              ] as const
            ).map(([invited, Icon, title, hint]) => (
              <button
                key={title}
                type="button"
                role="radio"
                aria-checked={own === invited}
                disabled={!canManage || busy}
                onClick={() => own !== invited && void restrict(invited)}
                className="rounded-control hover:bg-muted flex items-start gap-2.5 px-2 py-1.5 text-left disabled:pointer-events-none"
              >
                <Icon className="mt-0.5 size-4 shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm">{t(title)}</span>
                  <span className="text-muted-foreground text-meta">
                    {t(hint)}
                  </span>
                </span>
                {own === invited && (
                  <Check className="text-primary mt-0.5 size-4 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {gate && (
          <div className="flex flex-col">
            {gate.created_by && (
              <PersonRow
                name={label(gate.created_by, creator?.full_name ?? null)}
                avatar={creator?.avatar_url ?? null}
                note={t("creator")}
              />
            )}
            {members
              .filter((m) => m.profile_id !== gate.created_by)
              .map((m) => (
                <PersonRow
                  key={m.profile_id}
                  name={label(m.profile_id, m.name)}
                  avatar={m.avatar_url}
                >
                  {own && canManage ? (
                    <Select
                      value={m.can_edit ? "edit" : "view"}
                      disabled={busy}
                      onValueChange={(v) =>
                        void run(() =>
                          v === "remove"
                            ? writer.removeMember(page.id, m.profile_id)
                            : writer.setMember(
                                page.id,
                                m.profile_id,
                                v === "edit",
                              ),
                        )
                      }
                    >
                      <SelectTrigger size="sm" className="text-meta">
                        {m.can_edit ? t("canEdit") : t("canView")}
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="edit">{t("canEdit")}</SelectItem>
                        <SelectItem value="view">{t("canView")}</SelectItem>
                        <SelectSeparator />
                        <SelectItem value="remove" className="text-destructive">
                          {t("removeAccess")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-muted-foreground text-meta">
                      {m.can_edit ? t("canEdit") : t("canView")}
                    </span>
                  )}
                </PersonRow>
              ))}
          </div>
        )}

        {own && canManage && (
          <Popover open={adding} onOpenChange={setAdding}>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" disabled={busy}>
                  <UserPlus data-icon="inline-start" />
                  {t("addPerson")}
                </Button>
              }
            />
            <PopoverContent align="start" className="w-64 gap-0 p-0">
              <Command loop>
                <CommandInput size="sm" placeholder={t("searchPeople")} />
                <CommandList>
                  <CommandEmpty>{t("noPeople")}</CommandEmpty>
                  <CommandGroup>
                    {invitable.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`${p.full_name ?? ""} ${p.id}`}
                        onSelect={() => {
                          setAdding(false)
                          void run(() => writer.setMember(page.id, p.id, false))
                        }}
                      >
                        <Avatar className="size-5">
                          <AvatarImage src={p.avatar_url || undefined} alt="" />
                          <AvatarFallback>{p.full_name ?? "?"}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{p.full_name ?? "…"}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </PopoverContent>
    </Popover>
  )
}
