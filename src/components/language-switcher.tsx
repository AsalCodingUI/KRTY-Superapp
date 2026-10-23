"use client"

import { SlidingIndicator } from "@/components/sliding-indicator"
import { cn } from "@/lib/utils"
import { useLocale, useSetLocale, useT } from "@/shared/i18n/client"
import { LOCALES } from "@/shared/i18n/config"

/** ID / EN pill beside the theme switcher; Indonesian is the default. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const t = useT("common")

  return (
    <div
      role="radiogroup"
      aria-label={t("language")}
      className={cn(
        "fill-ink inline-flex w-fit items-center gap-0.5 self-start rounded-full p-0.5",
        className,
      )}
    >
      <SlidingIndicator
        activeSelector="[aria-checked=true]"
        className="bg-background dark:bg-foreground/[0.13] rounded-full shadow-(--shadow-chrome-active)"
      />
      {LOCALES.map((value) => {
        const active = locale === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={value === "id" ? "Bahasa Indonesia" : "English"}
            title={value === "id" ? "Bahasa Indonesia" : "English"}
            onClick={() => !active && setLocale(value)}
            className={cn(
              "focus-visible:ring-focus-ring relative grid size-7 cursor-pointer place-items-center rounded-full text-[11px] font-semibold tracking-wide uppercase transition-colors duration-150 ease-out outline-none focus-visible:ring-2",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {value}
          </button>
        )
      })}
    </div>
  )
}
