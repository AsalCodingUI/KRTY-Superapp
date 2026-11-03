/**
 * Text size and dark sidebar (Settings → Tampilan): the keys and the
 * boot script that applies them before first paint. The hooks live in
 * display-prefs.ts (client only).
 */
export const TEXT_SIZES = ["small", "regular", "large", "xlarge"] as const
export type TextSize = (typeof TEXT_SIZES)[number]
export const FONT_PX: Record<TextSize, number> = {
  small: 15,
  regular: 16,
  large: 17,
  xlarge: 18,
}

export const TEXT_KEY = "text-size"
export const DARK_CHROME_KEY = "dark-chrome"
export const DISPLAY_EVENT = "display-prefs"

export const DISPLAY_SCRIPT = `try{var r=document.documentElement,z=localStorage.getItem("${TEXT_KEY}"),m=${JSON.stringify(FONT_PX)};if(m[z]&&z!=="regular")r.style.fontSize=m[z]+"px";if(localStorage.getItem("${DARK_CHROME_KEY}")==="1")r.setAttribute("data-dark-chrome","")}catch(e){}`
