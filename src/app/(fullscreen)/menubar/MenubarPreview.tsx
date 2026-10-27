"use client"

import { AppIcon } from "@/components/app-icon"
import { SegmentedControl } from "@/components/segmented-control"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useDateLocale } from "@/shared/i18n/client"
import { canManageByRole } from "@/shared/lib/roles"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import { getPreviewPeople } from "./actions"

import {
  DEFAULT_SURFACE,
  LayoutList,
  LayoutRail,
  LayoutTabs,
  LayoutTiles,
  SCENARIOS,
  SECTIONS,
  SurfaceContext,
  statusText,
  useMenubarData,
  useNow,
  type On,
  type Person,
  type Scenario,
  type Surface,
} from "@/widgets/menubar/ui/MenubarPopover"

/**
 * Dev page for the menu bar popover: the layouts side by side, from a few
 * people's point of view, over different wallpapers, with worst cases and
 * the glass settings to tune. Real data, but the buttons only show a toast.
 */

const LAYOUTS = [
  {
    key: "A",
    name: "Tab",
    note: "Absen di atas, isi dipisah per tab.",
    Component: LayoutTabs,
  },
  {
    key: "B",
    name: "Satu daftar",
    note: "Absen satu baris di header, semua bagian satu scroll.",
    Component: LayoutList,
  },
  {
    key: "C",
    name: "Ringkasan",
    note: "Angka di atas sekaligus jadi tab.",
    Component: LayoutTiles,
  },
  {
    key: "D",
    name: "Rail",
    note: "Ikon navigasi di kiri, absen menempel di bawah.",
    Component: LayoutRail,
  },
] as const

/** Backgrounds to test the popover's see-through surface against. */
const WALLPAPERS = [
  {
    key: "blue",
    label: "Biru",
    css: "radial-gradient(120% 80% at 20% 0%, #7c6cf2 0%, #3b6fd8 35%, #0f172a 100%)",
  },
  {
    key: "sunset",
    label: "Senja",
    css: "radial-gradient(100% 90% at 80% 10%, #ffd27a 0%, #f2766b 35%, #8a3f8f 70%, #2b1840 100%)",
  },
  {
    key: "forest",
    label: "Hijau",
    css: "linear-gradient(160deg, #cfe8c4 0%, #5f9e6e 45%, #1d3b2c 100%)",
  },
  {
    key: "light",
    label: "Terang",
    css: "linear-gradient(180deg, #f5f5f7 0%, #e3e6ec 100%)",
  },
  {
    key: "dark",
    label: "Gelap",
    css: "linear-gradient(180deg, #1c1c1e 0%, #0b0b0c 100%)",
  },
  {
    key: "busy",
    label: "Ramai",
    css: "repeating-linear-gradient(45deg, #ff5f57 0 28px, #febc2e 28px 56px, #28c840 56px 84px, #2f7bf5 84px 112px, #ffffff 112px 140px, #111111 140px 168px)",
  },
] as const

/** Default POVs besides the viewer: one employee who has clocked in today
 *  and one who hasn't (picked by name, can be changed on the page). */
const DEFAULT_POVS = ["Rizal Dwi Artanto", "Rezah Aurellia"]

export function MenubarPreview() {
  const dateLocale = useDateLocale()
  const now = useNow()
  const { profile } = useUserProfile()
  const [on, setOn] = useState<On>({
    attendance: true,
    schedule: true,
    tasks: true,
    notifications: true,
    approvals: true,
    leave: true,
  })
  const [layout, setLayout] = useState<"all" | (typeof LAYOUTS)[number]["key"]>(
    "D",
  )
  const [sample, setSample] = useState<Scenario>("real")
  const [wallpaper, setWallpaper] =
    useState<(typeof WALLPAPERS)[number]["key"]>("blue")
  const [surface, setSurface] = useState<Surface>(DEFAULT_SURFACE)
  const { data: people = [] } = useQuery({
    queryKey: ["menubar-preview-people"],
    queryFn: () => getPreviewPeople(),
  })
  const [picked, setPicked] = useState<string[] | null>(null)
  const povIds =
    picked ??
    [
      profile?.id,
      ...people
        .filter((p) => DEFAULT_POVS.includes(p.full_name ?? ""))
        .map((p) => p.id),
    ].filter((id): id is string => Boolean(id))
  const povs = povIds
    .map((id): Person | undefined =>
      id === profile?.id
        ? { id, full_name: profile.full_name, role: profile.role }
        : people.find((p) => p.id === id),
    )
    .filter((p): p is Person => Boolean(p))
  const shown = LAYOUTS.filter((l) => layout === "all" || l.key === layout)

  return (
    <div className="relative isolate min-h-dvh">
      {/* Wallpaper, fixed so it fills the screen however long the page is. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          background: WALLPAPERS.find((w) => w.key === wallpaper)!.css,
        }}
      />
      {/* A fake macOS menu bar, with the KRTY icon open. */}
      <div className="sticky top-0 z-10 flex h-7 items-center justify-end gap-4 bg-black/25 px-4 text-[13px] text-white backdrop-blur-xl">
        <span className="dark flex size-6 items-center justify-center rounded-md bg-white/20">
          <AppIcon variant="mark" size={96} className="size-4" />
        </span>
        <span className="opacity-80">
          {format(now, "EEE d MMM  HH:mm", { locale: dateLocale })}
        </span>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Controls: sections, layout, and whose point of view. */}
        <aside className="bg-popover text-popover-foreground flex flex-col gap-3 self-start rounded-2xl px-4 py-3 text-sm shadow-(--elev-3)">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <span className="w-14 font-medium">Isi</span>
            {SECTIONS.map((s) => (
              <label
                key={s.key}
                className="flex cursor-pointer items-center gap-2"
              >
                <Checkbox
                  checked={on[s.key]}
                  onCheckedChange={(v) =>
                    setOn((o) => ({ ...o, [s.key]: Boolean(v) }))
                  }
                />
                {s.label}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <span className="w-14 font-medium">Latar</span>
            <SegmentedControl
              fitContent
              value={wallpaper}
              onChange={setWallpaper}
              items={WALLPAPERS.map((w) => ({ value: w.key, label: w.label }))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
            <span className="w-14 font-medium">Kaca</span>
            {(
              [
                ["blur", "Blur", 0, 80, "px"],
                ["solid", "Solid", 0, 100, "%"],
              ] as const
            ).map(([key, label, min, max, unit]) => (
              <label key={key} className="flex items-center gap-3">
                <span className="text-muted-foreground whitespace-nowrap">
                  {label}
                </span>
                <div className="w-36 shrink-0">
                  <Slider
                    min={min}
                    max={max}
                    value={[surface[key]]}
                    onValueChange={(v) =>
                      setSurface((s) => ({
                        ...s,
                        [key]: Array.isArray(v) ? v[0] : v,
                      }))
                    }
                  />
                </div>
                <span className="w-12 tabular-nums">
                  {surface[key]}
                  {unit}
                </span>
              </label>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(
                  `blur ${surface.blur}px · solid ${surface.solid}%`,
                )
                toast.success("Nilai disalin")
              }}
            >
              Salin nilai
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSurface(DEFAULT_SURFACE)}
            >
              Reset
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <span className="w-14 font-medium">Layout</span>
            <SegmentedControl
              fitContent
              value={layout}
              onChange={setLayout}
              items={[
                { value: "all" as const, label: "Semua" },
                ...LAYOUTS.map((l) => ({
                  value: l.key,
                  label: `${l.key} · ${l.name}`,
                })),
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <span className="w-14 font-medium">Kondisi</span>
            <SegmentedControl
              fitContent
              value={sample}
              onChange={setSample}
              items={SCENARIOS.map((c) => ({ value: c.value, label: c.label }))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <span className="w-14 font-medium">POV</span>
            {[
              ...(profile
                ? [
                    {
                      id: profile.id,
                      full_name: profile.full_name,
                      role: profile.role,
                    },
                  ]
                : []),
              ...people.filter((p) => p.id !== profile?.id),
            ].map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2"
              >
                <Checkbox
                  checked={povIds.includes(p.id)}
                  onCheckedChange={(v) =>
                    setPicked(
                      v
                        ? [...povIds, p.id]
                        : povIds.filter((id) => id !== p.id),
                    )
                  }
                />
                {p.full_name}
                <span className="text-tertiary-foreground text-xs">
                  {p.id === profile?.id
                    ? "kamu"
                    : canManageByRole(p.role)
                      ? "admin"
                      : "karyawan"}
                </span>
              </label>
            ))}
          </div>
          <span className="text-muted-foreground text-[13px]">
            Data asli tiap orang, tombol belum menyimpan apa pun.
          </span>
        </aside>

        <SurfaceContext.Provider value={surface}>
          {povs.map((person) => (
            <PovRow
              key={person.id}
              person={person}
              on={on}
              layouts={shown}
              sample={sample}
            />
          ))}
        </SurfaceContext.Provider>
      </div>
    </div>
  )
}

/** One person's popover in each chosen layout, side by side. */
function PovRow({
  sample,
  person,
  on,
  layouts,
}: {
  person: Person
  on: On
  sample: Scenario
  layouts: readonly (typeof LAYOUTS)[number][]
}) {
  const data = useMenubarData(on, person, sample)
  return (
    <section className="flex flex-col gap-3">
      <h2 className="w-fit rounded-lg bg-black/50 px-2.5 py-1 text-base font-medium text-white backdrop-blur">
        POV {person.full_name}
        <span className="ml-2 text-[13px] font-normal text-white/70">
          {canManageByRole(person.role) ? "Admin" : "Karyawan"} ·{" "}
          {statusText(data)}
        </span>
      </h2>
      <div className="flex items-start gap-6 overflow-x-auto pb-2">
        {layouts.map(({ key, name, note, Component }) => (
          <figure key={key} className="flex shrink-0 flex-col gap-2">
            <figcaption className="w-fit rounded-lg bg-black/50 px-2.5 py-1 text-white backdrop-blur">
              <span className="text-sm font-medium">
                {key} · {name}
              </span>
              <span className="block text-[13px] text-white/70">{note}</span>
            </figcaption>
            <Component data={data} on={on} />
          </figure>
        ))}
      </div>
    </section>
  )
}
