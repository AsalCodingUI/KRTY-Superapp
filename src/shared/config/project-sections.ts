import {
  RiLayoutGridLine,
  RiFileList3Line,
  RiFilePaperLine,
  RiFileTextLine,
  RiFolderLine,
  RiMoneyDollarCircleLine,
  RiSettings3Line,
  RiStarLine,
  type RemixiconComponentType,
} from "@/shared/ui/lucide-icons"
import type { MessageKey } from "@/shared/i18n/messages"

/** Pages inside a project (DesignerHQ-style), in sidebar order. */
export const PROJECT_SECTIONS: {
  slug: string
  name: string
  /** Translate with useT("projects") / getT("projects"). */
  labelKey: MessageKey<"projects">
  icon: RemixiconComponentType
}[] = [
  {
    slug: "",
    name: "Dashboard",
    labelKey: "sectionDashboard",
    icon: RiLayoutGridLine,
  },
  {
    slug: "tasks",
    name: "Tugas",
    labelKey: "sectionTasks",
    icon: RiFileList3Line,
  },
  {
    slug: "reports",
    name: "Report",
    labelKey: "sectionReports",
    icon: RiFilePaperLine,
  },
  {
    slug: "invoices",
    name: "Invoice",
    labelKey: "sectionInvoices",
    icon: RiMoneyDollarCircleLine,
  },
  {
    slug: "documents",
    name: "Dokumen",
    labelKey: "sectionDocuments",
    icon: RiFileTextLine,
  },
  {
    slug: "library",
    name: "Library & Aset",
    labelKey: "sectionLibrary",
    icon: RiFolderLine,
  },
  {
    slug: "assessment",
    name: "Penilaian",
    labelKey: "sectionAssessment",
    icon: RiStarLine,
  },
  {
    slug: "settings",
    name: "Pengaturan",
    labelKey: "sectionSettings",
    icon: RiSettings3Line,
  },
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
