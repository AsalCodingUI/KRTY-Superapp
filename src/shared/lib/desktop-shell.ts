/** Set by Kretya Flow on every page it loads (see desktop/src-tauri):
 *  "mac" or "windows". */
export const DESKTOP_SHELL_COOKIE = "krty_shell"

export type DesktopShell = "mac" | "windows"

export const parseDesktopShell = (value?: string): DesktopShell | null =>
  value === "mac" || value === "windows" ? value : null
