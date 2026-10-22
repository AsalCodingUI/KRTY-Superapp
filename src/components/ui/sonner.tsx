"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"
import { CircleCheck as CircleCheckIcon } from "@/components/icons"

const Toaster = ({ ...props }: ToasterProps) => {
  // Toasts are always dark (like the top bar), in light mode too.
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "oklch(0.205 0 0)",
          "--normal-text": "oklch(0.96 0 0)",
          "--normal-border": "rgb(255 255 255 / 0.08)",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          // Quiet × on the right, matching the toast instead of a white ring.
          closeButton:
            "!left-auto !right-2 !top-1/2 !-translate-y-1/2 !translate-x-0 !size-6 !rounded-md !border-0 !bg-transparent !text-white/55 hover:!bg-white/10 hover:!text-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
