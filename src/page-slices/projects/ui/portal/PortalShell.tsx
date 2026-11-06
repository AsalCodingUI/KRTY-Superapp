"use client"

import { leavePortal } from "@/app/(fullscreen)/p/[token]/actions"
import { AppIcon } from "@/components/app-icon"
import { AppearancePopover } from "@/components/appearance-popover"
import { LanguageSwitcher } from "@/components/language-switcher"
import { PageTranslator } from "@/components/page-translator"
import { PageSheet, pageSheetContentClassName } from "@/components/page-sheet"
import { ProjectAvatar } from "@/components/project-avatar"
import { SlidingIndicator } from "@/components/sliding-indicator"
import { FloatingTabBar, type FloatingTab } from "@/components/floating-tab-bar"
import { ThemeSwitcher } from "@/components/theme-switcher"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { STATUS_LABEL_KEYS } from "@/page-slices/projects/lib/status"
import { useT } from "@/shared/i18n/client"
import {
  RiFileTextLine,
  RiFolderLine,
  RiLayoutGridLine,
  RiLogoutBoxLine,
} from "@/shared/ui/lucide-icons"
import { Newspaper } from "@/components/icons"
import { m } from "motion/react"
import { TRANSITION } from "@/shared/lib/motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useLayoutEffect, useTransition } from "react"

/** The pages a client may open, in sidebar order (same names as inside). */
const SECTIONS = [
  {
    slug: "",
    key: "projectDashboard",
    icon: RiLayoutGridLine,
    filled: GridFilled,
  },
  // Not the app's paper icon: next to Documents' it read the same on the
  // phone's icon-only tab bar.
  {
    slug: "reports",
    key: "projectReports",
    icon: Newspaper,
    filled: NewspaperFilled,
  },
  {
    slug: "documents",
    key: "projectDocuments",
    icon: RiFileTextLine,
    filled: FileFilled,
  },
  {
    slug: "library",
    key: "projectLibrary",
    icon: RiFolderLine,
    filled: FolderFilled,
  },
] as const

/**
 * The client portal in the app's own chrome (the same shell as inside):
 * no top bar from md up; the studio, the project and its pages in the
 * sidebar, "Sign out" where the account row sits, a row on the chrome
 * above the sheet (toggle, breadcrumb, translator), and the page sheet
 * with the app's padding.
 */
export function PortalShell({
  token,
  project,
  children,
}: {
  token: string
  project: { id: string; name: string; status: string | null }
  children: React.ReactNode
}) {
  const t = useT("nav")
  const tp = useT("projects")
  const pathname = usePathname()
  const router = useRouter()
  const [leaving, startLeaving] = useTransition()
  // One translator at a time (the phone's header or the chrome row).
  const isMobile = useIsMobile()
  // The link key: /p/<project-name>-<code>.
  const base = `/p/${token}`
  const slug = pathname.slice(base.length + 1).split("/")[0] ?? ""
  const current = SECTIONS.find((s) => s.slug === slug) ?? SECTIONS[0]
  const sectionHref = (s: string) => (s ? `${base}/${s}` : base)
  // Deeper than a section (a report): the section links back up.
  const deeper = pathname.replace(/\/$/, "") !== sectionHref(current.slug)

  const statusKey =
    STATUS_LABEL_KEYS[project.status as keyof typeof STATUS_LABEL_KEYS]

  const signOut = () =>
    startLeaving(async () => {
      await leavePortal(token)
      router.refresh()
    })

  // The portal always wears the dark sidebar (the app's "dark sidebar"
  // look), whatever this browser's own setting; restored on the way out.
  useLayoutEffect(() => {
    const root = document.documentElement
    const had = root.hasAttribute("data-dark-chrome")
    root.setAttribute("data-dark-chrome", "")
    return () => {
      if (!had) root.removeAttribute("data-dark-chrome")
    }
  }, [])

  return (
    <SidebarProvider className="bg-chrome h-svh min-h-0 flex-col overflow-hidden">
      {/* Before first paint too (the effect runs after hydration). */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            'document.documentElement.setAttribute("data-dark-chrome","")',
        }}
      />
      {/* Phones only: the project on the chrome (Shopify style). From md up
          everything sits in the sidebar, like the app (no top bar). */}
      <header
        // Dark in light mode too when Settings → Tampilan says so.
        data-chrome-dark=""
        className="on-chrome text-foreground relative z-40 flex h-(--app-topbar-height) shrink-0 items-center gap-3 px-4 md:hidden"
      >
        <Link
          prefetch={false}
          href={base}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-base font-medium"
        >
          <ProjectAvatar
            id={project.id}
            name={project.name}
            className="size-8 shrink-0 text-sm"
          />
          <span className="truncate" translate="no">
            {project.name}
          </span>
        </Link>
        {isMobile && <PageTranslator whole source="en" />}
      </header>

      <div className="flex min-h-0 w-full flex-1 md:pr-2 md:pb-2">
        <Sidebar
          collapsible="icon"
          className="on-chrome overflow-hidden"
          data-chrome-dark=""
        >
          <SidebarRail />
          {/* Same header as the app's sidebar: the studio, then the
              project (and its status) where the workspace tabs sit. */}
          <SidebarHeader className="gap-3 px-3 pt-3 pb-3">
            <div className="flex h-8 items-center group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:justify-center">
              <span className="flex min-w-0 items-center gap-2 pl-2.5 group-data-[collapsible=icon]:pl-0">
                <AppIcon size={96} variant="mark" className="size-4 shrink-0" />
                <span
                  className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden"
                  translate="no"
                >
                  Kretya Studio
                </span>
              </span>
            </div>
            <Link
              prefetch={false}
              href={base}
              className="flex h-8 min-w-0 items-center gap-2 pl-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-0"
            >
              <ProjectAvatar
                id={project.id}
                name={project.name}
                className="size-5 shrink-0 text-[10px]"
              />
              <span
                className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden"
                translate="no"
              >
                {project.name}
              </span>
              {statusKey && (
                <Badge
                  variant="secondary"
                  className="blend-ink ml-auto shrink-0 group-data-[collapsible=icon]:hidden"
                >
                  {tp(statusKey)}
                </Badge>
              )}
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="pt-0">
              <SidebarMenu className="relative">
                <SlidingIndicator
                  activeSelector="[data-active]"
                  className="bg-sidebar-active rounded-full"
                />
                {SECTIONS.map((section) => (
                  <SidebarMenuItem key={section.slug}>
                    <SidebarMenuButton
                      tooltip={t(section.key)}
                      isActive={section.slug === current.slug}
                      className="not-data-active:blend-ink data-active:bg-transparent"
                      render={
                        <Link
                          href={sectionHref(section.slug)}
                          prefetch={false}
                        />
                      }
                    >
                      <section.icon />
                      <span className="truncate">{t(section.key)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            {/* Sign out where the app has its account row. */}
            <SidebarGroup className="mt-auto">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={tp("portalSignOut")}
                    disabled={leaving}
                    onClick={signOut}
                    className="blend-ink"
                  >
                    <RiLogoutBoxLine />
                    <span className="truncate">{tp("portalSignOut")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex flex-nowrap items-center gap-2 group-data-[collapsible=icon]:flex-col">
              <ThemeSwitcher className="group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:self-center" />
              <AppearancePopover className="group-data-[collapsible=icon]:self-center" />
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* The app's tab row, on the chrome above the sheet: the sidebar
              toggle, where you are, and the translator. */}
          <div
            data-chrome-dark=""
            className="on-chrome text-foreground flex h-(--app-tabs-height) min-w-0 shrink-0 items-center gap-1 pt-3 pb-2 max-md:hidden"
          >
            <SidebarTrigger className="text-muted-foreground hover:bg-chrome-hover" />
            <Breadcrumb className="ml-2 min-w-0 flex-1">
              <BreadcrumbList className="text-meta flex-nowrap">
                <BreadcrumbItem className="shrink-0">
                  <BreadcrumbLink
                    render={<Link href={base} prefetch={false} />}
                    className="max-w-48 truncate"
                    translate="no"
                  >
                    {project.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  {deeper ? (
                    <BreadcrumbLink
                      render={
                        <Link
                          href={sectionHref(current.slug)}
                          prefetch={false}
                        />
                      }
                      className="truncate"
                    >
                      {t(current.key)}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="truncate font-medium">
                      {t(current.key)}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            {!isMobile && <PageTranslator whole source="en" />}
          </div>

          {/* The same page sheet as inside the app (components/page-sheet). */}
          <PageSheet
            data-translate-root
            className="max-md:shadow-raised max-md:pt-2 md:pt-6"
          >
            <div
              className={cn(
                pageSheetContentClassName,
                "pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-6",
              )}
            >
              <m.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={TRANSITION}
                className="flex flex-1 flex-col"
              >
                {children}
              </m.div>
            </div>
          </PageSheet>
        </div>
      </div>

      <TabBar
        onSignOut={signOut}
        leaving={leaving}
        items={SECTIONS.map((section) => ({
          href: sectionHref(section.slug),
          label: t(section.key),
          icon: section.icon,
          filled: section.filled,
          active: section.slug === current.slug,
        }))}
      />
    </SidebarProvider>
  )
}

/** The portal's tab bar: its pages, and theme, language and sign out. */
function TabBar({
  items,
  onSignOut,
  leaving,
}: {
  items: FloatingTab[]
  onSignOut: () => void
  leaving: boolean
}) {
  const tc = useT("common")
  const tp = useT("projects")
  return (
    <FloatingTabBar
      id="portal-tabs"
      items={items}
      menu={
        <>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{tc("theme")}</span>
            <ThemeSwitcher />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{tc("language")}</span>
            <LanguageSwitcher />
          </div>
          <Separator />
          <Button
            variant="destructive-ghost"
            className="justify-start"
            disabled={leaving}
            onClick={onSignOut}
          >
            <RiLogoutBoxLine data-icon="inline-start" />
            {tp("portalSignOut")}
          </Button>
        </>
      }
    />
  )
}

/* Filled versions of the tab icons, for the open tab (24px grid, same
   shapes as the outline ones; the lines are cut out with evenodd). */
type IconProps = { className?: string }

function GridFilled({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  )
}

function NewspaperFilled({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M8 2.5h11.5A2.5 2.5 0 0 1 22 5v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-8.5A2.5 2.5 0 0 1 4.5 8h1V5A2.5 2.5 0 0 1 8 2.5ZM5.5 10h-1a.5.5 0 0 0-.5.5V19a1 1 0 0 0 1.5.87V10ZM9.5 6.5h8v4h-8zM9.5 13.25h8v1.5h-8zM9.5 16.75h5.5v1.5H9.5z"
      />
    </svg>
  )
}

function FileFilled({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7.5 1.5V8a.5.5 0 0 0 .5.5h4.5ZM8 12.25h8v1.5H8zM8 16.25h8v1.5H8zM8 8.25h3v1.5H8z"
      />
    </svg>
  )
}

function FolderFilled({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M2.5 6A2.5 2.5 0 0 1 5 3.5h4.38a2.5 2.5 0 0 1 1.77.73L12.92 6H19a2.5 2.5 0 0 1 2.5 2.5v9.5A2.5 2.5 0 0 1 19 20.5H5A2.5 2.5 0 0 1 2.5 18Z" />
    </svg>
  )
}
