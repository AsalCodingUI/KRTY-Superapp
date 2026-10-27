import { DesktopApp } from "./DesktopApp"

export const metadata = { title: "KRTY" }

/** The KRTY desktop app's window (a Tauri shell loads this page). */
export default function DesktopPage() {
  return <DesktopApp />
}
