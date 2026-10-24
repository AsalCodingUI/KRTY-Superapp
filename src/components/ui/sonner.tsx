"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
// Static lucide icons: the root layout must not pull the animated icon set
// (and motion) onto every page, /login included.
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"

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
          // Near-black, leaning a touch toward the chrome tint.
          "--normal-bg":
            "oklch(0.2 calc(var(--tint-c, 0) * 0.025) var(--tint-h, 250))",
          "--normal-text": "oklch(0.97 0 0)",
          "--normal-border": "rgb(255 255 255 / 0.08)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !items-center !gap-3 !rounded-2xl !py-3.5 !pr-12 !pl-4 !text-sm !shadow-(--elev-4)",
          icon: "!m-0 !size-[18px] [&>svg]:!size-[18px]",
          title: "!font-medium !leading-5",
          description: "!text-white/60 !leading-5",
          // Quiet × centered on the right. Sonner positions it with
          // `transform`, so that is reset rather than stacked on.
          closeButton:
            "!left-auto !right-3 !top-1/2 !-translate-y-1/2 !transform-none !size-7 !rounded-full !border-0 !bg-transparent !text-white/50 transition-colors hover:!bg-white/10 hover:!text-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
