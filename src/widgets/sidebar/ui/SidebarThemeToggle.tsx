"use client"

import { SegmentedControl } from "@/shared/ui/interaction/SegmentedControl"
import { RiMoonLine, RiSunLine } from "@/shared/ui/lucide-icons"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function SidebarThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="px-2 py-1">
      <SegmentedControl
        value={theme === "dark" ? "dark" : "light"}
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
