"use client"

import { ListPager } from "@/components/list-pager"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { SegmentedControl } from "@/components/segmented-control"
import { SidebarNoticeCard } from "@/components/sidebar-notices"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { ViewToggle, type ViewMode } from "@/components/view-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { RiDownloadLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { Fragment, useState } from "react"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
} from "./doc-blocks"
import * as mock from "../model/navigation-mock"
import { NavigationCompare, ShellCompare } from "./navigation-compare"

const RULES: [string, string][] = [
  [
    "Tab halaman",
    "TabNavigation di bawah PageHeader: bagian-bagian halaman. Teks saja, angka lewat count (0 nggak tampil). Di toolbar: plain; garis full-bleed: bleed",
  ],
  [
    "Segmented",
    "SegmentedControl buat ganti tampilan / filter di dalam konten atau toolbar (h-8, fitContent)",
  ],
  [
    "View toggle",
    "ViewToggle cuma list / grid / table / kanban, ikon saja, diingat per halaman (useViewMode)",
  ],
  [
    "State di URL",
    "Tab = route sendiri · filter = ?param lewat replaceUrl · jendela di atas list = ?thing=linkKey (Back nutup)",
  ],
  [
    "Nama param",
    "Bahasa Inggris, satu per ide: ?period= ?project= ?member= ?task= · key baris = linkKey(nama, id)",
  ],
  [
    "Link",
    "Semua next/link prefetch={false}; PrefetchLink di sidebar & baris list. ParamLink kalau cuma ganti query",
  ],
  [
    "Breadcrumb",
    "Dibikin SiteHeader dari config nav; halaman nambah langkah lewat useBreadcrumbs. Nggak ada di HP",
  ],
  [
    "Paging",
    "ListPager di bawah GroupedList (ghost icon-sm, rata kanan, hilang kalau 1 halaman). DataTable punya sendiri",
  ],
]

/** /ui → Navigasi: tabs, switches, breadcrumbs, pager, sidebar bits. */
export function NavigationTab() {
  const [tab, setTab] = useState<(typeof mock.tabs)[number]["value"]>("all")
  const [scope, setScope] = useState<"projects" | "docs">("projects")
  const [period, setPeriod] = useState<"week" | "month">("month")
  const [view, setView] = useState<ViewMode>("list")
  const [view4, setView4] = useState<ViewMode>("kanban")
  const [page, setPage] = useState(0)
  const pageCount = Math.ceil(mock.items.length / mock.PAGE_SIZE)
  const shown = mock.items.slice(
    page * mock.PAGE_SIZE,
    (page + 1) * mock.PAGE_SIZE,
  )

  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="navigation.md">
        Tab, segmented, view toggle, breadcrumb, pager, dan link: kapan pakai
        yang mana, dan state-nya disimpan di mana.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Sebelum / sesudah"
        note="TabNavigationLink count, TabNavigation plain / bleed (garis full-bleed di Performa), ring fokus, prefetch={false} di semua next/link, replaceUrl buat query yang nggak dibaca server. Kiri: cara lama; kanan: yang jalan sekarang."
      >
        <div className="flex flex-col gap-8">
          <ShellCompare />
          <NavigationCompare />
        </div>
      </DocGroup>

      <DocGroup title="Tab halaman">
        <DocExample
          title="Header, tab dengan angka, toolbar"
          source="components/tab-navigation.tsx · page-slices/policies/ui/PoliciesPage.tsx"
        >
          <div className="border-border rounded-xl border border-dashed p-5">
            <PageHeader
              className="pb-4"
              title="Aturan"
              actions={<ViewToggle value={view} onValueChange={setView} />}
            />
            <TabNavigation className="mb-4">
              {mock.tabs.map((item) => (
                <TabNavigationLink
                  key={item.value}
                  active={tab === item.value}
                  onClick={() => setTab(item.value)}
                  count={item.count}
                  showLeadingIcon={false}
                >
                  {item.label}
                </TabNavigationLink>
              ))}
            </TabNavigation>
            <p className="text-muted-foreground text-sm">
              Tab aktif:{" "}
              <code className="font-mono text-xs">?status={tab}</code> (di app
              lewat replaceUrl, tanpa reload)
            </p>
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Segmented dan view toggle">
        <DocExample
          title="SegmentedControl"
          source="components/segmented-control.tsx"
        >
          <DocCanvas className="flex-col items-start">
            <SegmentedControl
              fitContent
              value={scope}
              onChange={setScope}
              items={[
                { value: "projects", label: "Project" },
                { value: "docs", label: "Dokumen" },
              ]}
            />
            <SegmentedControl
              fitContent
              value={period}
              onChange={setPeriod}
              items={[
                { value: "week", label: "Minggu" },
                { value: "month", label: "Bulan" },
              ]}
            />
            <div className="w-72">
              <SegmentedControl
                value={period}
                onChange={setPeriod}
                items={[
                  { value: "week", label: "Isi penuh: Minggu" },
                  { value: "month", label: "Bulan" },
                ]}
              />
            </div>
          </DocCanvas>
        </DocExample>
        <DocExample
          title="ViewToggle"
          source="components/view-toggle.tsx (useViewMode)"
        >
          <DocCanvas>
            <ViewToggle value={view} onValueChange={setView} />
            <ViewToggle
              value={view4}
              onValueChange={setView4}
              modes={["list", "grid", "kanban", "table"]}
            />
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Breadcrumb">
        <DocExample
          title="Section › langkah halaman"
          source="components/site-header.tsx · page-breadcrumbs.ts (useBreadcrumbs)"
          kind="spec"
        >
          <DocCanvas>
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-nowrap">
                {mock.crumbs.map((crumb, i) => {
                  const last = i === mock.crumbs.length - 1
                  return (
                    <Fragment key={crumb.label}>
                      {i > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem className={last ? "min-w-0" : "shrink-0"}>
                        {last || !crumb.href ? (
                          <BreadcrumbPage className="truncate font-medium">
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            render={<Link href={crumb.href} prefetch={false} />}
                            className="max-w-48 truncate"
                          >
                            {crumb.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Tombol kembali di judul"
          source="components/page-header.tsx (back)"
        >
          <div className="border-border rounded-xl border border-dashed p-5">
            <PageHeader
              title="Cuti melahirkan"
              back={{ href: "/ui", label: "Aturan" }}
            />
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Paging">
        <DocExample title="ListPager" source="components/list-pager.tsx">
          <div className="flex flex-col gap-2">
            <GroupedList>
              {shown.map((item) => (
                <ListRow key={item}>{item}</ListRow>
              ))}
            </GroupedList>
            <ListPager
              page={page + 1}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Sidebar"
        note="Halaman sidebar dari shared/config/workspaces.ts; di HP diganti FloatingTabBar (pil kaca gelap di bawah, md:hidden)."
      >
        <DocExample
          title="Kartu notice"
          source="components/sidebar-notices.tsx (SidebarNoticeCard)"
        >
          <div className="bg-sidebar flex w-64 flex-col gap-2 rounded-xl p-2">
            <SidebarNoticeCard
              title="Update siap"
              subtitle="Mulai ulang buat pasang"
              icon={<RiDownloadLine />}
              tone="accent"
              onClick={() => {}}
            />
            <SidebarNoticeCard
              title="Kretya Flow buat Mac"
              subtitle="Unduh aplikasinya"
              icon={<RiDownloadLine />}
              onClick={() => {}}
              onDismiss={() => {}}
            />
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            <>
              SegmentedControl buat tab halaman, atau TabNavigation buat pilihan
              di form.
            </>,
            <>
              <code className="font-mono text-xs">router.replace(`?…`)</code>{" "}
              buat filter yang nggak dibaca server: pakai replaceUrl.
            </>,
            <>
              <code className="font-mono text-xs">{"<Link href>"}</code> tanpa{" "}
              <code className="font-mono text-xs">prefetch={"{false}"}</code>.
            </>,
            <>
              <code className="font-mono text-xs">
                {"<button onClick={() => router.push()}>"}
              </code>{" "}
              buat link biasa.
            </>,
            <>
              Garis tab digambar ulang (
              <code className="font-mono text-xs">
                border-b + TabNavigation border-b-0
              </code>
              ): pakai <code className="font-mono text-xs">plain</code> /{" "}
              <code className="font-mono text-xs">bleed</code>.
            </>,
            <>Nama query baru pakai bahasa Indonesia (?proyek=).</>,
          ]}
        />
      </DocGroup>
    </div>
  )
}
