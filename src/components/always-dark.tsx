import type { ReactNode } from "react"

/**
 * Sign-in and other auth screens stay dark whatever the theme: the dark
 * tokens and dark: styles apply inside, on a black page.
 */
export function AlwaysDark({ children }: { children: ReactNode }) {
  return (
    <div className="dark text-foreground min-h-dvh bg-black [color-scheme:dark]">
      {children}
    </div>
  )
}
