import { DesktopApp } from "./DesktopApp"

export const metadata = { title: "Kretya Flow" }

/** The Kretya Flow (desktop app) window (a Tauri shell loads this page). */
export default function DesktopPage() {
  return <DesktopApp />
}
