"use client"

import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { Loader2Icon } from "@/components/icons"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const t = useT("common")
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label={t("loading")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
