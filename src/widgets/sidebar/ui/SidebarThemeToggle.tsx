"use client"

import { SegmentedControl } from "@/components/segmented-control"
import { RiMoonLine, RiSunLine } from "@/shared/ui/lucide-icons"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function SidebarThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="w-full px-2 py-1">
      <SegmentedControl
        value={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={setTheme}
        items={[
          {
            value: "light",
            label: "Light",
            icon: RiSunLine,
          },
          {
            value: "dark",
            label: "Dark",
            icon: RiMoonLine,
          },
        ]}
      />
    </div>
  )

}
