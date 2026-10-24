"use client"

import { cn } from "@/lib/utils"
import { useEffect } from "react"

type Item = {
  /** The class exactly as the app uses it. */
  cls: string
  name: string
  /** What it is / where it comes from. */
  from: string
  /** Where the app uses it. */
  usedIn: string
  /** Drawn on the chrome color instead of the page (chrome-only shadows). */
  onChrome?: boolean
  /** Defined nowhere: renders no shadow at all. */
  dead?: boolean
}

type Group = { title: string; note: string; items: Item[] }

const GROUPS: Group[] = [
  {
    title: "Skala elevasi (satu-satunya shadow di app)",
    note: "shadow-(--elev-N). Hairline + contact shadow + ambient lebar dengan spread negatif; warna bayangan ikut hue tema. Dark: hairline putih + bayangan dalam.",
    items: [
      {
        cls: "shadow-(--elev-1)",
        name: "--elev-1 · control",
        from: "0 0 0 1px 5% · 0 1px 2px 6%",
        usedIn:
          "Thumb segmented/tabs/view toggle, switch & slider thumb, toolbar kanvas",
      },
      {
        cls: "shadow-(--elev-2)",
        name: "--elev-2 · resting card",
        from: "+ 0 6px 16px -4px 7%",
        usedIn:
          "Item aktif di chrome (nav, switch, toggle), kartu hover, sidebar floating, handle pad warna",
        onChrome: true,
      },
      {
        cls: "shadow-(--elev-3)",
        name: "--elev-3 · sheet / paper",
        from: "+ 0 16px 40px -10px 11%",
        usedIn:
          "Halaman di chrome, kertas invoice/PDF/Word/viewer, thumbnail, halaman print, dokumen SLA",
      },
      {
        cls: "shadow-(--elev-4)",
        name: "--elev-4 · popover / menu",
        from: "+ 0 24px 56px -14px 17%",
        usedIn:
          "Popover, dropdown, select, hover card, tooltip chart, menu editor, item yang di-drag, overlay drop file",
      },
      {
        cls: "shadow-(--elev-5)",
        name: "--elev-5 · dialog",
        from: "+ 0 36px 80px -18px 22%",
        usedIn:
          "Dialog, alert dialog, sheet samping, drawer, panel editor invoice",
      },
    ],
  },
  {
    title: "Khusus (bukan elevasi)",
    note: "Garis dan ring yang kebetulan digambar pakai box-shadow.",
    items: [
      {
        cls: "shadow-[0_-20px_25px_-5px_rgb(0_0_0/0.1),0_-8px_10px_-6px_rgb(0_0_0/0.1)]",
        name: "--drawer-stacked-shadow",
        from: "Bayangan ke atas saat drawer bertumpuk",
        usedIn: "Drawer (nested open)",
      },
      {
        cls: "shadow-[inset_0_0_0_1px_var(--border)]",
        name: "inset 1px border",
        from: "Garis tepi dalam",
        usedIn: "Data table",
      },
      {
        cls: "shadow-[0_0_0_1px_var(--sidebar-border)]",
        name: "sidebar outline ring",
        from: "1px var(--sidebar-border) (dulu hsl() yang tidak valid)",
        usedIn: "Sidebar menu button (variant outline)",
      },
      {
        cls: "ring-2 ring-focus-ring",
        name: "ring fokus field",
        from: "oklch(0.629 0.187 252 / 22%)",
        usedIn: "Input, select, textarea, input group",
      },
      {
        cls: "ring-2 ring-primary/15",
        name: "ring fokus kontrol",
        from: "primary 15%",
        usedIn: "Button, badge, checkbox, tabs, scroll area",
      },
      {
        cls: "ring-2 ring-destructive/20 dark:ring-destructive/40",
        name: "ring error",
        from: "destructive 20% (dark 40%)",
        usedIn: "aria-invalid di field & button",
      },
    ],
  },
]

/** Concentric corners: outer 20px, padding 8px, so everything inside is 12px. */
function NestedDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">Radius konsentris</h3>
        <p className="text-muted-foreground text-xs">
          nest-rounded-[20px] nest-p-2 di luar, rounded-nested di dalam: 20 − 8
          = 12px, lengkungnya sejajar.
        </p>
      </div>
      <div className="bg-muted dark:bg-background grid place-items-center rounded-3xl p-8">
        <div className="bg-card nest-rounded-[20px] nest-p-2 flex w-72 flex-col gap-2 shadow-(--elev-4)">
          {["WalletConnect", "Phantom", "Google"].map((name) => (
            <div
              key={name}
              className="bg-muted rounded-nested flex h-12 items-center px-4 text-sm"
            >
              {name}
            </div>
          ))}
          <div className="bg-primary text-primary-foreground rounded-nested grid h-11 place-items-center text-sm font-medium">
            Other methods
          </div>
        </div>
      </div>
    </div>
  )
}

function Tile({ item }: { item: Item }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        className={cn(
          "grid h-36 place-items-center rounded-2xl p-6",
          item.onChrome ? "bg-chrome" : "bg-muted dark:bg-background",
        )}
      >
        <div
          className={cn(
            "size-full rounded-2xl",
            item.onChrome ? "bg-sidebar-active" : "bg-card",
            item.cls,
          )}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 px-1">
        <span className="text-foreground flex items-center gap-1.5 font-mono text-xs font-medium">
          {item.name}
          {item.dead && (
            <span className="bg-destructive/15 text-destructive rounded px-1 font-sans text-[10px]">
              tidak ngefek
            </span>
          )}
        </span>
        <span className="text-muted-foreground font-mono text-[11px] leading-4 break-all">
          {item.from}
        </span>
        <span className="text-tertiary-foreground text-[11px] leading-4">
          {item.usedIn}
        </span>
      </div>
    </div>
  )
}

function Column({ dark }: { dark: boolean }) {
  return (
    <section
      className={cn(
        dark && "dark",
        "bg-background text-foreground flex min-w-0 flex-col gap-10 p-8",
      )}
      style={{ colorScheme: dark ? "dark" : "light" }}
    >
      <h2 className="text-heading text-xl">{dark ? "Dark" : "Light"}</h2>
      <NestedDemo />
      {GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">{group.title}</h3>
            <p className="text-muted-foreground text-xs">{group.note}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-7">
            {group.items.map((item) => (
              <Tile key={item.cls} item={item} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/**
 * Both themes side by side. The page holds the html element in light while
 * it's open (so the left column is true light even if the app is in dark),
 * and the right column opts into `.dark`.
 */
export function ShadowLab() {
  useEffect(() => {
    const html = document.documentElement
    const wasDark = html.classList.contains("dark")
    // next-themes may re-apply its class after mount; keep it off here.
    const holdLight = () => {
      if (html.classList.contains("dark")) html.classList.remove("dark")
      html.style.colorScheme = "light"
    }
    holdLight()
    const observer = new MutationObserver(holdLight)
    observer.observe(html, { attributes: true, attributeFilter: ["class"] })
    return () => {
      observer.disconnect()
      if (wasDark) html.classList.add("dark")
      html.style.colorScheme = ""
    }
  }, [])

  return (
    <main className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <Column dark={false} />
      <Column dark />
    </main>
  )
}
