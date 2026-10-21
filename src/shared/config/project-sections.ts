import {
  RiLayoutGridLine,
  RiFileList3Line,
  RiFileTextLine,
  RiFolderLine,
  RiMoneyDollarCircleLine,
  RiSettings3Line,
  type RemixiconComponentType,
} from "@/shared/ui/lucide-icons"

/** Pages inside a project (DesignerHQ-style), in sidebar order. */
export const PROJECT_SECTIONS: {
  slug: string
  name: string
  icon: RemixiconComponentType
}[] = [
  { slug: "", name: "Dashboard", icon: RiLayoutGridLine },
  { slug: "tasks", name: "Tugas", icon: RiFileList3Line },
  { slug: "invoices", name: "Invoice", icon: RiMoneyDollarCircleLine },
  { slug: "documents", name: "Dokumen", icon: RiFileTextLine },
  { slug: "library", name: "Library", icon: RiFolderLine },
  { slug: "settings", name: "Pengaturan", icon: RiSettings3Line },
]

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
const PROJECT_PATH = new RegExp(`^/projects/(${UUID})(?:/([^/]+))?`)

/** "/projects/<id>/tasks" -> { id, slug: "tasks" } (slug "" = dashboard). */
export function matchProjectPath(pathname: string) {
  const m = PROJECT_PATH.exec(pathname)
  if (!m) return null
  const slug = m[2] ?? ""
  const section = PROJECT_SECTIONS.find((s) => s.slug === slug)
  return { id: m[1], slug, section: section ?? PROJECT_SECTIONS[0] }
}
