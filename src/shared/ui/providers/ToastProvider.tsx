"use client"

import { Toaster } from "sonner"
import {
  RiAlarmWarningLine,
  RiAlertFill,
  RiCheckboxCircleFill,
  RiLoader2Line,
} from "@/shared/ui/lucide-icons"

/**
 * ToastProvider initializes the Sonner toaster.
 * Placed at the root of the application.
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors={false}
      closeButton={false}
      icons={{
        success: <RiCheckboxCircleFill className="size-6 text-current" />,
        error: <RiAlertFill className="size-6 text-current" />,
        warning: <RiAlarmWarningLine className="size-6 text-current" />,
        loading: <RiLoader2Line className="size-6 text-current animate-spin" />,
        info: null,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-center w-[340px] overflow-hidden rounded-xl shadow-none py-[6px] pl-4 pr-2",
          content: "flex-1 min-w-0",
          icon: "p-2",
          title: "text-label-md leading-4 truncate",
          actionButton:
            "text-label-md leading-4 px-2 py-[6px] rounded-lg text-current transition-opacity hover:opacity-90 bg-transparent",
          cancelButton:
            "text-label-md leading-4 px-2 py-[6px] rounded-lg text-current transition-opacity hover:opacity-90 bg-transparent",
          success: "bg-surface-success text-foreground-on-color",
          error: "bg-surface-danger text-foreground-on-color",
          warning: "bg-surface-warning text-foreground-warning-on-color",
          info: "bg-surface-inverse-primary text-foreground-on-color",
          loading: "bg-surface-inverse-primary text-foreground-on-color",
          default: "bg-surface-inverse-primary text-foreground-on-color",
        },
      }}
    />
  )
}
