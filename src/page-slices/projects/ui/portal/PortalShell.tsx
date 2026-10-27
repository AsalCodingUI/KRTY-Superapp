"use client"

import { leavePortal } from "@/app/(fullscreen)/p/[token]/actions"
import { AppIcon } from "@/components/app-icon"
import { AppearancePopover } from "@/components/appearance-popover"
import { LanguageSwitcher } from "@/components/language-switcher"
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
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { STATUS_LABEL_KEYS } from "@/page-slices/projects/lib/status"
import { useT } from "@/shared/i18n/client"
import {
  RiFileTextLine,
  RiFolderLine,
  RiLayoutGridLine,
  RiLogoutBoxLine,
} from "@/shared/ui/lucide-icons"
import { Newspaper } from "lucide-react"
import { m } from "motion/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"

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
 * The client portal in the app's own chrome: the tinted top bar and
 * sidebar, and the page as one rounded sheet, with only the project's
 * client pages in the sidebar and "Sign out" where the account menu sits.
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

  return (
    <SidebarProvider className="bg-chrome h-svh min-h-0 flex-col overflow-hidden">
      {/* Who and what: the studio / the project and its status on the
          left; the team's faces and "Sign out" on the right. */}
      <header className="on-chrome text-foreground relative z-40 flex h-(--app-topbar-height) shrink-0 items-center gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 whitespace-nowrap">
          {/* On a phone only the project (Shopify style): bigger, alone. */}
          <AppIcon
            size={192}
            variant="mark"
            className="size-[22px] shrink-0 max-md:hidden"
          />
          <span className="text-sm font-medium max-md:hidden">
            Kretya Studio
          </span>
          <span
            aria-hidden
            className="text-muted-foreground/50 text-lg font-light max-md:hidden"
          >
            /
          </span>
          <Link
            href={base}
            className="flex min-w-0 items-center gap-2 text-sm font-medium max-md:gap-2.5 max-md:text-base"
          >
            <ProjectAvatar
              id={project.id}
              name={project.name}
              className="size-5 shrink-0 rounded-[5px] text-[10px] max-md:size-8 max-md:rounded-[9px] max-md:text-sm"
            />
            <span className="truncate">{project.name}</span>
          </Link>
          {statusKey && (
            <span className="blend-ink bg-foreground/[0.06] text-muted-foreground hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline">
              {tp(statusKey)}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="blend-ink text-muted-foreground max-md:hidden"
            disabled={leaving}
            aria-label={tp("portalSignOut")}
            onClick={signOut}
          >
            <RiLogoutBoxLine data-icon="inline-start" />
            {tp("portalSignOut")}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-1 md:pr-3 md:pb-3">
        <Sidebar collapsible="icon" className="on-chrome overflow-hidden">
          <SidebarRail />
          <SidebarContent>
            <SidebarGroup className="pt-0.5">
              <SidebarMenu className="relative">
                <SlidingIndicator
                  activeSelector="[data-active]"
                  className="bg-sidebar-active blend-light rounded-full"
                  shadowClassName="rounded-full shadow-(--elev-2)"
                />
                {SECTIONS.map((section) => (
                  <SidebarMenuItem key={section.slug}>
                    <SidebarMenuButton
                      tooltip={t(section.key)}
                      isActive={section.slug === current.slug}
                      className="not-data-active:blend-ink data-active:bg-transparent"
                      render={<Link href={sectionHref(section.slug)} />}
                    >
                      <section.icon />
                      <span className="truncate">{t(section.key)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex flex-nowrap items-center gap-2 group-data-[collapsible=icon]:flex-col">
              <ThemeSwitcher className="group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:self-center" />
              <LanguageSwitcher className="group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:self-center" />
              <AppearancePopover className="group-data-[collapsible=icon]:self-center" />
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="relative flex min-w-0 flex-1">
          <div
            aria-hidden
            className="blend-shadow pointer-events-none absolute inset-0 z-20 hidden shadow-(--elev-3) md:block md:rounded-3xl"
          />
          <SidebarInset className="dark:bg-surface overflow-y-auto overscroll-contain [--bleed:0.75rem] [--page-gutter:1.25rem] [scrollbar-gutter:stable] max-md:rounded-t-[28px] max-md:shadow-(--elev-2) md:z-20 md:rounded-3xl md:[--page-gutter:2.5rem] xl:[--page-gutter:4rem]">
            {/* No sidebar on a phone: the tab bar below does its job. */}
            <header className="flex h-12 shrink-0 items-center gap-2 max-md:hidden">
              <div className="gutter-x flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                />
                <Breadcrumb className="min-w-0">
                  <BreadcrumbList className="flex-nowrap">
                    <BreadcrumbItem className="shrink-0">
                      <BreadcrumbLink
                        render={<Link href={base} />}
                        className="max-w-48 truncate"
                      >
                        {project.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="min-w-0">
                      {deeper ? (
                        <BreadcrumbLink
                          render={<Link href={sectionHref(current.slug)} />}
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
              </div>
            </header>
            <div className="gutter-x flex flex-1 flex-col gap-4 overflow-x-clip pb-6 max-md:pt-1 max-md:pb-[calc(8rem+env(safe-area-inset-bottom))]">
              <m.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-1 flex-col"
              >
                {children}
              </m.div>
            </div>
          </SidebarInset>
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
            variant="ghost"
            className="text-destructive hover:text-destructive justify-start"
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
