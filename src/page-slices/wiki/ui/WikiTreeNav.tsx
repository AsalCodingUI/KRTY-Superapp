"use client"

import { PrefetchLink } from "@/components/prefetch-link"
import { Collapse } from "@/components/ui/collapse"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { ChevronRight } from "@/components/icons"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  childrenOf,
  trailOf,
  useWikiPages,
  wikiHref,
  type WikiPageMeta,
} from "../model/data"
import { WikiIcon } from "./wiki-icon"

const OPEN_KEY = "wiki-tree-open"

/** Which pages are open in the panel (remembered on this device). */
function useOpenPages(trail: string[]) {
  const [open, setOpen] = useState<string[]>([])
  useEffect(() => {
    try {
      setOpen(JSON.parse(localStorage.getItem(OPEN_KEY) ?? "[]"))
    } catch {}
  }, [])
  // The open page's parents open with it.
  const key = trail.join("/")
  useEffect(() => {
    if (!key) return
    setOpen((prev) => {
      const add = key.split("/").filter((id) => !prev.includes(id))
      return add.length ? [...prev, ...add] : prev
    })
  }, [key])
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  return { open, toggle }
}

/** The chevron that opens a page's subpages (on the row's right). */
function Toggle({
  page,
  isOpen,
  onToggle,
  sub,
}: {
  page: WikiPageMeta
  isOpen: boolean
  onToggle: () => void
  sub?: boolean
}) {
  const t = useT("shell")
  const name = page.title || "…"
  const label = isOpen ? t("navCollapse", { name }) : t("navExpand", { name })
  const icon = (
    <ChevronRight
      className={cn("transition-transform", isOpen && "rotate-90")}
    />
  )
  if (!sub)
    return (
      <SidebarMenuAction
        aria-label={label}
        aria-expanded={isOpen}
        className="text-muted-foreground top-1.5! right-1.5"
        onClick={onToggle}
      >
        {icon}
      </SidebarMenuAction>
    )
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={isOpen}
      onClick={onToggle}
      className="text-muted-foreground hover:bg-sidebar-accent absolute top-[calc(50%+1px)] right-1.5 grid size-5 -translate-y-1/2 place-items-center rounded-md [&_svg]:size-3.5"
    >
      {icon}
    </button>
  )
}

/**
 * The wiki's pages in the panel, as Notion's sidebar: every level opens
 * (the chevron), the open page's parents open with it; each page with its
 * emoji at the rows' icon size.
 */
export function WikiTreeNav() {
  const pathname = usePathname()
  const t = useT("wiki")
  const { data: pages = [] } = useWikiPages()
  const openId = pathname.startsWith("/wiki/")
    ? pathname.slice("/wiki/".length).split("/")[0]
    : null
  const trail = useMemo(
    () => (openId ? trailOf(pages, openId).map((p) => p.id) : []),
    [pages, openId],
  )
  // Not the open page itself: only its parents open with it.
  const { open, toggle } = useOpenPages(trail.slice(0, -1))
  const top = childrenOf(pages, null)
  if (!top.length) return null

  const name = (p: WikiPageMeta) => p.title || t("untitled")

  const renderSub = (parent: WikiPageMeta) => {
    const kids = childrenOf(pages, parent.id)
    if (!kids.length) return null
    return (
      <Collapse open={open.includes(parent.id)}>
        <SidebarMenuSub>
          {kids.map((page) => {
            const hasKids = childrenOf(pages, page.id).length > 0
            const isOpen = open.includes(page.id)
            return (
              <SidebarMenuSubItem key={page.id}>
                <div className="relative">
                  <SidebarMenuSubButton
                    isActive={page.id === openId}
                    className={cn(hasKids && "pr-8")}
                    render={<PrefetchLink href={wikiHref(page.id)} />}
                  >
                    <WikiIcon
                      icon={page.icon}
                      kind={page.kind}
                      className="size-3.5 text-[12px]"
                    />
                    <span className="truncate">{name(page)}</span>
                  </SidebarMenuSubButton>
                  {hasKids && (
                    <Toggle
                      sub
                      page={page}
                      isOpen={isOpen}
                      onToggle={() => toggle(page.id)}
                    />
                  )}
                </div>
                {renderSub(page)}
              </SidebarMenuSubItem>
            )
          })}
        </SidebarMenuSub>
      </Collapse>
    )
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {top.map((page) => {
          const hasKids = childrenOf(pages, page.id).length > 0
          return (
            <SidebarMenuItem key={page.id}>
              <SidebarMenuButton
                tooltip={name(page)}
                isActive={page.id === openId}
                className={cn(hasKids && "pr-8")}
                render={<PrefetchLink href={wikiHref(page.id)} />}
              >
                <WikiIcon
                  icon={page.icon}
                  kind={page.kind}
                  className="size-3.5 text-[12px]"
                />
                <span className="truncate">{name(page)}</span>
              </SidebarMenuButton>
              {hasKids && (
                <Toggle
                  page={page}
                  isOpen={open.includes(page.id)}
                  onToggle={() => toggle(page.id)}
                />
              )}
              {renderSub(page)}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
